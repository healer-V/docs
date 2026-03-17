---
title: "PostgreSQL 性能调优"
category: "后端 · PostgreSQL"
tags:
  - PostgreSQL
  - 性能
  - 分区表
  - 复制
date: 2026-03-17
excerpt: "全面介绍 PostgreSQL 性能调优实践，涵盖 VACUUM/AUTOVACUUM 机制、统计信息与 ANALYZE、范围/列表/哈希分区表、PgBouncer 连接池、关键配置参数调优、逻辑复制与流复制，以及 Patroni 高可用方案。"
---

# PostgreSQL 性能调优

## 一、VACUUM 与 AUTOVACUUM

### 1. 为什么需要 VACUUM

PostgreSQL 使用 MVCC 实现并发控制，UPDATE 和 DELETE 不会立即物理删除旧版本数据，而是将旧行标记为"死元组"（dead tuple）。死元组积累会：

- 增大表和索引的物理大小（表膨胀）
- 降低查询性能（顺序扫描需跳过死元组）
- 导致事务 ID 回卷（XID Wraparound），这是严重问题

`VACUUM` 命令负责清理死元组，回收存储空间（将空间标记为可复用），并更新可见性映射（Visibility Map）。

| 命令 | 说明 |
|------|------|
| `VACUUM tablename` | 清理死元组（不锁表，空间标记为可复用但不归还 OS） |
| `VACUUM FULL tablename` | 完全重写表（锁表，空间归还 OS，用于严重膨胀时） |
| `VACUUM ANALYZE tablename` | 清理死元组并更新统计信息 |
| `VACUUM VERBOSE tablename` | 输出详细执行信息 |

::: warning VACUUM FULL 的影响
`VACUUM FULL` 会对表加排他锁，期间无法读写。大表执行时间可能长达数小时，生产环境建议使用 **pg_repack** 工具实现在线重建，无需长时间锁表。
:::

### 2. AUTOVACUUM 配置

AUTOVACUUM 是 PostgreSQL 后台自动执行 VACUUM 和 ANALYZE 的机制，绝大多数情况下无需手动干预。

::: details AUTOVACUUM 关键配置

```ini
# postgresql.conf
autovacuum = on                        # 开启自动清理（不要关闭！）
autovacuum_max_workers = 3             # 并发 autovacuum 工作进程数
autovacuum_naptime = 1min              # 每分钟检查一次

# 触发 VACUUM 的阈值：死元组数 > base + scale * 表行数
autovacuum_vacuum_threshold     = 50
autovacuum_vacuum_scale_factor  = 0.02   # 2%的行死亡时触发（大表可调小）

# 触发 ANALYZE 的阈值
autovacuum_analyze_threshold    = 50
autovacuum_analyze_scale_factor = 0.01   # 1%的行变化时触发

# 控制 autovacuum 的 I/O 速率（避免影响业务）
autovacuum_vacuum_cost_delay    = 2ms    # 每次清理后休眠时间（降低 I/O 冲击）
autovacuum_vacuum_cost_limit    = 200    # 每次清理的代价上限
```

```sql
-- 针对单张表单独配置 autovacuum（覆盖全局配置）
-- 对于高写入的大表，降低触发阈值比例
ALTER TABLE orders SET (
  autovacuum_vacuum_scale_factor  = 0.005,   -- 0.5%触发
  autovacuum_analyze_scale_factor = 0.002,   -- 0.2%触发
  autovacuum_vacuum_cost_delay    = 1        -- 降低 I/O 限速
);
```

:::

### 3. 监控 AUTOVACUUM 效果

::: details AUTOVACUUM 监控查询

```sql
-- 查看各表的死元组和最后 VACUUM 时间
SELECT
  schemaname,
  relname                                             AS table_name,
  n_dead_tup                                          AS dead_tuples,
  n_live_tup                                          AS live_tuples,
  ROUND(n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0) * 100, 2) AS dead_pct,
  last_autovacuum,
  last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 20;

-- 查看表膨胀情况
SELECT
  relname,
  pg_size_pretty(pg_total_relation_size(oid)) AS total_size,
  pg_size_pretty(pg_relation_size(oid))       AS table_size
FROM pg_class
WHERE relkind = 'r'
ORDER BY pg_total_relation_size(oid) DESC
LIMIT 20;

-- 查看当前正在运行的 autovacuum
SELECT pid, query, state, query_start
FROM pg_stat_activity
WHERE query LIKE 'autovacuum:%';
```

:::

---

## 二、统计信息与 ANALYZE

优化器依赖表的统计信息（行数、列的值分布等）生成最优执行计划。统计信息过时会导致优化器做出错误决策。

### 1. 手动 ANALYZE

::: details ANALYZE 使用示例

```sql
-- 更新整个数据库的统计信息（通常在批量导入后执行）
ANALYZE;

-- 只更新指定表
ANALYZE orders;

-- 只更新指定列（降低统计收集开销）
ANALYZE orders (user_id, status, created_at);

-- 查看统计信息详情
SELECT
  tablename,
  attname,
  n_distinct,           -- 不同值的数量（负数表示占总行数的比例）
  correlation           -- 列值与物理顺序的相关性（1=完全有序，-1=完全逆序，0=随机）
FROM pg_stats
WHERE tablename = 'orders'
ORDER BY attname;
```

:::

### 2. 调整统计目标

`default_statistics_target`（默认 100）控制统计信息的详细程度，值越大越准确但 ANALYZE 越慢。

```sql
-- 对低区分度或查询复杂的列提高统计目标
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 500;
ANALYZE orders;
```

---

## 三、分区表

分区表（Table Partitioning）将一张逻辑表的数据按规则分散到多个物理子表，提升大表查询性能和维护效率。

### 1. 范围分区（Range Partitioning）

按连续范围划分，适合时序数据（如订单、日志）。

::: details 范围分区示例

```sql
-- 创建主分区表
CREATE TABLE orders (
  id          BIGSERIAL,
  user_id     BIGINT      NOT NULL,
  amount      NUMERIC(12,2),
  status      VARCHAR(20),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- 创建各年份分区
CREATE TABLE orders_2024 PARTITION OF orders
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE orders_2025 PARTITION OF orders
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE orders_2026 PARTITION OF orders
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- 为每个分区单独创建索引
CREATE INDEX idx_orders_2025_user_id ON orders_2025 (user_id);
CREATE INDEX idx_orders_2025_status  ON orders_2025 (status, created_at DESC);

-- 插入数据会自动路由到对应分区
INSERT INTO orders (user_id, amount, status, created_at)
VALUES (1001, 299.00, 'paid', '2025-03-15');   -- 路由到 orders_2025

-- 查询会自动裁剪（Partition Pruning），只扫描 2025 年的分区
SELECT * FROM orders
WHERE created_at BETWEEN '2025-01-01' AND '2025-12-31'
  AND user_id = 1001;
-- EXPLAIN 中显示：Append -> Seq Scan on orders_2025（其他分区被裁剪）
```

:::

### 2. 列表分区（List Partitioning）

按枚举值划分，适合区域、状态等离散值字段。

::: details 列表分区示例

```sql
CREATE TABLE sales (
  id          BIGSERIAL,
  region      VARCHAR(20) NOT NULL,
  amount      NUMERIC(12,2),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY LIST (region);

-- 按大区划分
CREATE TABLE sales_north PARTITION OF sales
  FOR VALUES IN ('beijing', 'tianjin', 'hebei');

CREATE TABLE sales_south PARTITION OF sales
  FOR VALUES IN ('guangdong', 'guangxi', 'hainan');

CREATE TABLE sales_east PARTITION OF sales
  FOR VALUES IN ('shanghai', 'jiangsu', 'zhejiang');

-- 兜底分区（不匹配任何分区时写入）
CREATE TABLE sales_other PARTITION OF sales DEFAULT;
```

:::

### 3. 哈希分区（Hash Partitioning）

按哈希值均匀分布，适合无明显时序或区域特征的高写入场景。

::: details 哈希分区示例

```sql
CREATE TABLE user_events (
  id      BIGSERIAL,
  user_id BIGINT NOT NULL,
  event   JSONB,
  ts      TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY HASH (user_id);

-- 创建 4 个哈希分区
CREATE TABLE user_events_0 PARTITION OF user_events
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE user_events_1 PARTITION OF user_events
  FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE user_events_2 PARTITION OF user_events
  FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE user_events_3 PARTITION OF user_events
  FOR VALUES WITH (MODULUS 4, REMAINDER 3);
```

:::

::: tip 分区表的性能收益
- **分区裁剪（Partition Pruning）**：查询条件包含分区键时，只扫描相关分区，跳过其余分区。
- **分区索引更小**：每个分区的索引比全表索引小，内存使用更高效。
- **并行查询**：PostgreSQL 可以并行扫描多个分区。
- **快速删除历史数据**：`DROP TABLE orders_2022` 比 `DELETE FROM orders WHERE created_at < '2023-01-01'` 快几个数量级。
:::

---

## 四、连接池（PgBouncer）

PostgreSQL 每个连接都对应一个独立的后台进程，连接建立开销大，大量短连接会导致资源浪费和性能下降。PgBouncer 是最流行的 PostgreSQL 连接池代理。

### 1. PgBouncer 工作模式

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| Session（会话池） | 客户端连接整个会话期间占用一个服务端连接 | 长连接场景 |
| Transaction（事务池） | 每个事务期间占用一个服务端连接，事务结束立即释放 | **最常用**，大幅提升连接复用率 |
| Statement（语句池） | 每条语句独占连接，不支持事务 | 极少使用 |

::: details PgBouncer 配置示例

```ini
# pgbouncer.ini
[databases]
# 将连接代理到 PostgreSQL
myapp = host=127.0.0.1 port=5432 dbname=myapp

[pgbouncer]
listen_port        = 6432
listen_addr        = 0.0.0.0
auth_type          = md5
auth_file          = /etc/pgbouncer/userlist.txt

# 使用事务池模式（推荐）
pool_mode          = transaction

# 连接数控制
max_client_conn    = 1000     # 允许的最大客户端连接数
default_pool_size  = 20       # 每个 database+user 组合的服务端连接数
reserve_pool_size  = 5        # 预留连接数（高峰时使用）
reserve_pool_timeout = 3      # 等待预留连接的超时（秒）

# 超时配置
server_idle_timeout  = 600    # 服务端空闲连接超时（秒）
client_idle_timeout  = 0      # 客户端空闲超时（0=不超时）
query_timeout        = 0      # 单条查询超时（0=不限制）

# 日志
log_connections    = 1
log_disconnections = 1
```

:::

::: warning Transaction 模式的限制
事务池模式不支持：预编译语句（Prepared Statements，需改用协议级别的 `DEALLOCATE` 或关闭 Prepared Statements）、`SET` 会话变量（事务结束后连接归还，SET 丢失）、`LISTEN/NOTIFY`。应用需针对这些限制做适配。
:::

---

## 五、关键配置参数

### 1. 内存参数

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| `shared_buffers` | 物理内存的 25%~40% | 共享缓冲区（最重要的内存参数） |
| `work_mem` | 4MB~64MB | 每个排序/哈希操作的内存（注意：并发连接 × work_mem 是实际消耗） |
| `maintenance_work_mem` | 256MB~1GB | VACUUM、CREATE INDEX 等维护操作的内存 |
| `effective_cache_size` | 物理内存的 75% | 告诉优化器可用的缓存大小（不实际分配） |
| `wal_buffers` | 64MB~256MB | WAL 缓冲区 |

::: details 内存参数配置示例

```ini
# postgresql.conf（示例：32GB 内存服务器）
shared_buffers       = 8GB        # 物理内存的 25%
effective_cache_size = 24GB       # 物理内存的 75%
work_mem             = 16MB       # 根据并发数调整
maintenance_work_mem = 1GB        # VACUUM/CREATE INDEX 使用
wal_buffers          = 256MB
```

:::

### 2. 连接参数

| 参数 | 说明 |
|------|------|
| `max_connections` | 最大连接数（建议配合 PgBouncer 使用，DB 侧保持较小值如 100~200） |
| `superuser_reserved_connections` | 保留给超级用户的连接数（默认 3） |

### 3. WAL 与检查点参数

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| `wal_level` | `replica`（主从复制） | WAL 详细程度 |
| `checkpoint_completion_target` | 0.9 | 检查点分散写入的时间比例（避免 I/O 尖刺） |
| `max_wal_size` | 4GB~16GB | 触发检查点前 WAL 的最大大小 |
| `min_wal_size` | 1GB~2GB | WAL 文件保留的最小大小 |

::: details 完整推荐配置（32GB 内存，SSD 存储）

```ini
# postgresql.conf
# 内存
shared_buffers               = 8GB
effective_cache_size         = 24GB
work_mem                     = 16MB
maintenance_work_mem         = 1GB
wal_buffers                  = 256MB

# 并发
max_connections              = 200
superuser_reserved_connections = 3

# 检查点
checkpoint_completion_target = 0.9
max_wal_size                 = 8GB
min_wal_size                 = 2GB

# 随机 I/O 成本（SSD 时调低）
random_page_cost             = 1.1   # 默认 4.0，SSD 改为 1.1
effective_io_concurrency     = 200   # SSD 并发 I/O 能力

# 并行查询
max_worker_processes         = 16
max_parallel_workers         = 8
max_parallel_workers_per_gather = 4

# 日志
log_min_duration_statement   = 1000  # 记录超过1秒的查询（慢查询日志）
log_checkpoints              = on
log_lock_waits               = on
```

:::

---

## 六、逻辑复制与流复制

### 1. 流复制（Physical Streaming Replication）

流复制将主库的 WAL 数据实时传输给从库，从库回放 WAL 保持与主库的数据同步。

- 从库是主库的**完整物理拷贝**，支持只读查询（读写分离）。
- 不支持仅复制部分表或数据库。

::: details 流复制配置

```ini
# 主库 postgresql.conf
wal_level         = replica
max_wal_senders   = 10           # 允许的最大 WAL sender 进程数
wal_keep_size     = 1GB          # 保留 WAL 文件的大小（供从库追赶）

# 主库 pg_hba.conf（允许从库连接）
# TYPE    DATABASE    USER          ADDRESS         METHOD
  host    replication repl_user     192.168.1.0/24  md5
```

```sql
-- 主库：创建复制用户
CREATE USER repl_user WITH REPLICATION ENCRYPTED PASSWORD 'Repl@123';
```

```ini
# 从库 postgresql.conf
hot_standby       = on           # 允许只读查询

# 从库 recovery.conf（PostgreSQL 12+ 改为 postgresql.conf + standby.signal）
primary_conninfo = 'host=192.168.1.100 port=5432 user=repl_user password=Repl@123'
```

```bash
# 从库：使用 pg_basebackup 初始化
pg_basebackup -h 192.168.1.100 -U repl_user -D /var/lib/postgresql/data -P -Xs -R
# -R：自动创建 standby.signal 和 primary_conninfo
```

:::

### 2. 逻辑复制（Logical Replication）

逻辑复制按 SQL 层面（行变更）复制数据，支持：

- 只复制特定表或数据库
- 跨大版本复制（如从 PG 14 升级到 PG 16）
- 双向复制（Multi-Master，需额外解决冲突）

::: details 逻辑复制配置

```ini
# 主库 postgresql.conf
wal_level = logical   # 逻辑复制需要 logical 级别
```

```sql
-- 主库：创建发布（Publication）
CREATE PUBLICATION orders_pub FOR TABLE orders, order_items;
-- 或发布所有表
CREATE PUBLICATION all_tables_pub FOR ALL TABLES;

-- 从库：创建订阅（Subscription）
CREATE SUBSCRIPTION orders_sub
CONNECTION 'host=192.168.1.100 port=5432 dbname=myapp user=repl_user password=Repl@123'
PUBLICATION orders_pub;

-- 查看逻辑复制状态
SELECT * FROM pg_stat_replication;      -- 主库
SELECT * FROM pg_stat_subscription;    -- 从库
```

:::

---

## 七、高可用方案（Patroni）

Patroni 是目前最成熟的 PostgreSQL 高可用解决方案，基于 etcd/Consul/ZooKeeper 实现主节点选举和自动故障转移。

### 1. Patroni 架构

```
             ┌─────────────────┐
             │  etcd Cluster   │  （分布式配置中心，存储集群状态）
             └────────┬────────┘
                      │
       ┌──────────────┼──────────────┐
       │              │              │
  ┌────┴────┐   ┌────┴────┐   ┌────┴────┐
  │Patroni  │   │Patroni  │   │Patroni  │
  │(Primary)│   │(Replica)│   │(Replica)│
  │  PG-1   │   │  PG-2   │   │  PG-3   │
  └─────────┘   └─────────┘   └─────────┘
       │
  ┌────┴────┐
  │  HAProxy │  （VIP + 负载均衡，对应用透明）
  └─────────┘
```

### 2. Patroni 核心配置

::: details Patroni 配置示例

```yaml
# /etc/patroni/patroni.yml（节点1）
scope: postgres-cluster
namespace: /service/
name: pg-node-1

restapi:
  listen: 0.0.0.0:8008
  connect_address: 192.168.1.101:8008

etcd3:
  hosts: 192.168.1.201:2379,192.168.1.202:2379,192.168.1.203:2379

bootstrap:
  dcs:
    ttl: 30                          # Leader 租约时间（秒）
    loop_wait: 10                    # Patroni 心跳间隔
    retry_timeout: 30
    maximum_lag_on_failover: 1048576 # 故障转移时允许的最大延迟（1MB）
  initdb:
    - encoding: UTF8
    - data-checksums

postgresql:
  listen: 0.0.0.0:5432
  connect_address: 192.168.1.101:5432
  data_dir: /var/lib/postgresql/data
  pgpass: /tmp/pgpass
  authentication:
    replication:
      username: repl_user
      password: Repl@123
    superuser:
      username: postgres
      password: Postgres@123
  parameters:
    shared_buffers:   8GB
    max_connections:  200
    wal_level:        replica
    hot_standby:      on
    max_wal_senders:  10
```

```bash
# 常用 Patroni 管理命令
patronictl -c /etc/patroni/patroni.yml list         # 查看集群状态
patronictl -c /etc/patroni/patroni.yml failover postgres-cluster  # 手动故障转移
patronictl -c /etc/patroni/patroni.yml switchover postgres-cluster # 计划内切换（无损）
```

:::

| 特性 | Patroni | Repmgr | Patroni + Citus |
|------|---------|--------|-----------------|
| 自动故障转移 | 支持 | 支持 | 支持 |
| 手动切换 | 支持 | 支持 | 支持 |
| 分布式锁（选举安全） | etcd/Consul/ZK | 无 | etcd |
| 水平扩展 | 不支持 | 不支持 | 支持（Citus 分片） |
| 社区活跃度 | 高（Zalando 维护） | 中 | 高 |
| 推荐场景 | **生产环境主流方案** | 小型部署 | 超大规模分析 |
