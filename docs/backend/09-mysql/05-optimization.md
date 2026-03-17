---
title: "MySQL 性能调优"
category: "后端 · MySQL"
tags:
  - MySQL
  - 性能
  - 慢查询
  - 分库分表
date: 2026-03-17
excerpt: "全面介绍 MySQL 性能调优方法，包括慢查询日志分析、连接池配置、Buffer Pool 调优、三种日志的用途与原理、主从复制与读写分离方案，以及分库分表策略和 ShardingSphere 基础配置。"
---

# MySQL 性能调优

## 一、慢查询日志

### 1. 配置慢查询日志

慢查询日志记录执行时间超过阈值的 SQL，是定位性能瓶颈的第一步。

::: details 慢查询日志配置

```sql
-- 查看当前配置
SHOW VARIABLES LIKE 'slow_query%';
SHOW VARIABLES LIKE 'long_query_time';

-- 动态开启（无需重启）
SET GLOBAL slow_query_log      = ON;
SET GLOBAL long_query_time     = 1;       -- 超过1秒记录
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';
SET GLOBAL log_queries_not_using_indexes = ON;  -- 记录未使用索引的查询
```

```ini
# my.cnf 永久配置
[mysqld]
slow_query_log                 = 1
slow_query_log_file            = /var/log/mysql/slow.log
long_query_time                = 1
log_queries_not_using_indexes  = 1
min_examined_row_limit         = 100   # 扫描行数超过100才记录
```

:::

### 2. 慢查询日志分析

使用 `mysqldumpslow` 或 `pt-query-digest` 分析慢查询日志。

::: details 慢查询分析命令示例

```bash
# mysqldumpslow：按总时间降序，显示前10条
mysqldumpslow -s t -t 10 /var/log/mysql/slow.log

# pt-query-digest：更详细的分析报告
pt-query-digest /var/log/mysql/slow.log \
  --limit 10                 \
  --report-format header,profile,query_report \
  > /tmp/slow_report.txt

# 常用分析维度
# -s t  按总执行时间排序
# -s c  按执行次数排序
# -s l  按锁定时间排序
# -s r  按扫描行数排序
```

:::

---

## 二、连接池配置

### 1. MySQL 服务端连接参数

::: details 连接相关配置示例

```sql
-- 查看当前连接数
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Max_used_connections';

-- 查看连接配置
SHOW VARIABLES LIKE 'max_connections';
SHOW VARIABLES LIKE 'wait_timeout';
SHOW VARIABLES LIKE 'interactive_timeout';
```

```ini
[mysqld]
max_connections        = 1000    # 最大连接数，根据内存和业务量调整
wait_timeout           = 600     # 非交互连接空闲超时（秒）
interactive_timeout    = 600     # 交互连接空闲超时（秒）
max_connect_errors     = 100     # 连接错误次数上限
```

:::

### 2. 应用层连接池配置（以 HikariCP 为例）

::: details HikariCP 推荐配置

```yaml
# Spring Boot application.yml
spring:
  datasource:
    hikari:
      # 连接池大小：建议 = CPU核数 * 2 + 磁盘数
      maximum-pool-size: 20
      minimum-idle: 5
      # 连接超时（等待连接的最大时间）
      connection-timeout: 30000      # 30秒
      # 空闲连接最大存活时间
      idle-timeout: 600000           # 10分钟
      # 连接最大生命周期（应小于 wait_timeout）
      max-lifetime: 1800000          # 30分钟
      # 连接测试查询
      connection-test-query: SELECT 1
      # 连接池名称（便于监控）
      pool-name: HikariPool-Main
```

:::

::: tip 连接池大小公式
**最优连接数 ≈ CPU 核数 × 2 + 有效磁盘数**（来自 HikariCP 官方建议）。连接数过多会导致上下文切换开销大于收益，通常不超过 50 个连接，具体需通过压测验证。
:::

---

## 三、Buffer Pool 调优

### 1. Buffer Pool 配置

Buffer Pool 是 InnoDB 最重要的内存区域，缓存数据页和索引页，减少磁盘 I/O。

::: details Buffer Pool 配置示例

```sql
-- 查看 Buffer Pool 使用情况
SHOW STATUS LIKE 'Innodb_buffer_pool_%';
-- 关注：
-- Innodb_buffer_pool_read_requests  -- 读请求总数
-- Innodb_buffer_pool_reads          -- 物理读（磁盘IO）次数
-- 命中率 = 1 - reads/read_requests，应 > 99%

-- 动态调整 Buffer Pool 大小（MySQL 5.7+）
SET GLOBAL innodb_buffer_pool_size = 4294967296;  -- 4GB
```

```ini
[mysqld]
# 建议设为物理内存的 60%~80%（专用数据库服务器）
innodb_buffer_pool_size    = 8G

# Buffer Pool 实例数（当 size > 1G 时，每个实例建议 1G）
innodb_buffer_pool_instances = 8

# 预热：服务重启后自动加载上次的热点页
innodb_buffer_pool_dump_at_shutdown = ON
innodb_buffer_pool_load_at_startup  = ON
```

:::

### 2. 其他重要内存参数

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| `innodb_log_buffer_size` | 64M~256M | redo log 内存缓冲区 |
| `key_buffer_size` | 较小值（InnoDB 为主时） | MyISAM 索引缓存 |
| `sort_buffer_size` | 2M~4M（每连接） | 排序缓冲，过大浪费内存 |
| `join_buffer_size` | 2M~8M（每连接） | JOIN 无索引时的缓冲 |
| `read_buffer_size` | 1M~4M（每连接） | 顺序扫描缓冲 |

---

## 四、三种核心日志

### 1. redo log（重做日志）

redo log 是 InnoDB 特有的**物理日志**，记录数据页的修改，保证事务的**持久性（Durability）**。

- 采用 WAL（Write-Ahead Logging）机制：先写日志再写磁盘，崩溃后通过 redo log 重放恢复数据。
- 固定大小循环写入，写满时触发 checkpoint 将脏页刷盘。

```ini
[mysqld]
innodb_log_file_size    = 1G    # 单个 redo log 文件大小
innodb_log_files_in_group = 2   # redo log 文件组数量
# innodb_flush_log_at_trx_commit 控制刷盘策略：
# 0 = 每秒刷盘（性能最好，宕机丢失最多1秒数据）
# 1 = 每次提交刷盘（最安全，默认值）
# 2 = 每次提交写OS缓存，每秒刷盘（折中）
innodb_flush_log_at_trx_commit = 1
```

### 2. undo log（回滚日志）

undo log 是 InnoDB 的**逻辑日志**，记录数据修改前的旧值，用于：

- 事务**回滚**（Atomicity 原子性）
- **MVCC** 版本链构建（提供历史数据快照）

每次 INSERT/UPDATE/DELETE 都会在 undo log 中记录逆操作（INSERT 对应 DELETE，UPDATE 对应旧值记录）。

### 3. binlog（二进制日志）

binlog 是 MySQL Server 层的**逻辑日志**，记录所有数据修改的 SQL 或行变更，用于：

- **主从复制**：从库读取主库 binlog 进行回放。
- **数据恢复**：结合全量备份 + binlog 恢复到任意时间点。
- **数据审计**：追踪数据变更历史。

::: details binlog 配置与查看

```ini
[mysqld]
log_bin           = /var/log/mysql/mysql-bin  # 开启binlog并指定路径
server_id         = 1                          # 主从复制时必须唯一
binlog_format     = ROW                        # 推荐 ROW 格式（最完整）
binlog_row_image  = FULL                       # 记录完整行数据
expire_logs_days  = 7                          # binlog 保留天数
max_binlog_size   = 500M                       # 单个 binlog 文件最大大小
sync_binlog       = 1                          # 每次提交同步到磁盘（最安全）
```

```sql
-- 查看 binlog 列表
SHOW BINARY LOGS;

-- 查看当前正在写入的 binlog 位置
SHOW MASTER STATUS;

-- 查看 binlog 内容
SHOW BINLOG EVENTS IN 'mysql-bin.000001' LIMIT 20;

-- mysqlbinlog 工具解析
-- mysqlbinlog --start-datetime='2025-03-01 00:00:00' \
--             --stop-datetime='2025-03-01 23:59:59' \
--             /var/log/mysql/mysql-bin.000001 | mysql -u root -p
```

:::

| 日志 | 层级 | 内容类型 | 主要用途 |
|------|------|----------|----------|
| redo log | InnoDB | 物理（页修改） | 崩溃恢复、持久性 |
| undo log | InnoDB | 逻辑（行旧值） | 事务回滚、MVCC |
| binlog | MySQL Server | 逻辑（SQL/行） | 主从复制、数据恢复 |

---

## 五、主从复制

### 1. 复制原理

MySQL 主从复制基于 binlog 异步实现，分为三个线程协作：

| 线程 | 所在节点 | 职责 |
|------|----------|------|
| binlog dump 线程 | 主库 | 读取并发送 binlog 到从库 |
| I/O 线程 | 从库 | 接收 binlog，写入 relay log（中继日志） |
| SQL 线程 | 从库 | 读取 relay log，回放 SQL，更新从库数据 |

::: details 主从复制配置示例

```ini
# 主库 my.cnf
[mysqld]
server_id  = 1
log_bin    = /var/log/mysql/mysql-bin
binlog_format = ROW
```

```ini
# 从库 my.cnf
[mysqld]
server_id       = 2
relay_log       = /var/log/mysql/mysql-relay
read_only       = ON       # 从库只读
log_slave_updates = ON     # 从库也记录binlog（用于级联复制）
```

```sql
-- 主库：创建复制用户
CREATE USER 'repl'@'%' IDENTIFIED BY 'Repl@123';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';
FLUSH PRIVILEGES;

-- 主库：获取当前 binlog 位置
SHOW MASTER STATUS;
-- +------------------+----------+
-- | File             | Position |
-- +------------------+----------+
-- | mysql-bin.000003 |      154 |

-- 从库：配置并启动复制
CHANGE MASTER TO
  MASTER_HOST     = '192.168.1.100',
  MASTER_USER     = 'repl',
  MASTER_PASSWORD = 'Repl@123',
  MASTER_LOG_FILE = 'mysql-bin.000003',
  MASTER_LOG_POS  = 154;

START SLAVE;
SHOW SLAVE STATUS\G
-- 检查：Slave_IO_Running: Yes, Slave_SQL_Running: Yes
```

:::

### 2. 半同步复制与 GTID

::: tip 生产环境推荐
- 使用 **GTID（Global Transaction ID）** 模式简化主从切换，无需关心 binlog 文件名和位置。
- 开启**半同步复制**（`rpl_semi_sync`），至少等待一个从库确认收到 binlog 后再提交，避免主库宕机丢数据。
- 生产环境推荐使用 **MHA** 或 **Orchestrator** 实现自动故障转移。
:::

---

## 六、读写分离

### 1. 读写分离方案对比

| 方案 | 代表产品 | 优势 | 劣势 |
|------|----------|------|------|
| 应用层分离 | ShardingSphere-JDBC | 无额外网络跳转，性能好 | 与应用耦合，多语言需重复实现 |
| 代理层分离 | ProxySQL、MyCat | 应用透明，语言无关 | 增加网络层，代理本身是单点 |
| 云产品 | RDS 读写分离 | 托管免运维 | 成本较高，定制能力弱 |

::: details ShardingSphere-JDBC 读写分离配置（Spring Boot）

```yaml
# application.yml
spring:
  shardingsphere:
    datasource:
      names: master, slave1, slave2
      master:
        type: com.zaxxer.hikari.HikariDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        jdbc-url: jdbc:mysql://master-host:3306/dbname
        username: root
        password: secret
      slave1:
        type: com.zaxxer.hikari.HikariDataSource
        jdbc-url: jdbc:mysql://slave1-host:3306/dbname
        username: root
        password: secret
      slave2:
        type: com.zaxxer.hikari.HikariDataSource
        jdbc-url: jdbc:mysql://slave2-host:3306/dbname
        username: root
        password: secret
    rules:
      readwrite-splitting:
        data-sources:
          rw-ds:
            static-strategy:
              write-data-source-name: master
              read-data-source-names:
                - slave1
                - slave2
            load-balancer-name: round-robin    # 轮询负载均衡
    props:
      sql-show: true   # 打印路由后的 SQL（开发阶段）
```

:::

::: warning 主从延迟问题
读写分离的核心挑战是主从延迟（通常几毫秒到几秒）。对于**写后立即读**的场景（如下单后查询订单），需要强制路由到主库，避免读到从库的旧数据。ShardingSphere 支持通过 Hint 强制主库读。
:::

---

## 七、分库分表策略

### 1. 垂直拆分

**垂直分库**：按业务模块将不同的表拆分到不同数据库。

```
单库（shop）→ 拆分为：
  user_db：users, user_addresses, user_tags
  order_db：orders, order_items, coupons
  product_db：products, categories, inventory
```

**垂直分表**：将一张宽表按访问频率拆分为多张表（常用列 + 不常用列分离）。

```sql
-- 拆分前：users 表有 30 列
-- 拆分后：
-- users（高频字段：id, username, email, status, created_at）
-- users_profile（低频字段：id, bio, avatar, birthday, address...）
```

### 2. 水平拆分（分片）

水平分表：将同一张表的数据按某个维度（分片键）分散到多张表或多个库。

| 分片策略 | 说明 | 优点 | 缺点 |
|----------|------|------|------|
| 按范围分片 | `order_2024_q1`, `order_2024_q2`（按时间/ID范围） | 范围查询高效，扩容容易 | 可能存在热点 |
| 按哈希取模 | `user_id % 4` → 分到 4 张表 | 数据均匀，无热点 | 扩容需要重新分片，范围查询需跨表 |
| 一致性哈希 | 虚拟节点环形映射 | 扩容时迁移数据量少 | 实现复杂 |

::: details 水平分表示例（订单按用户ID分4张表）

```sql
-- 分片规则：table_suffix = user_id % 4
-- 分片表：orders_0, orders_1, orders_2, orders_3

-- user_id=1001 的订单写入 orders_1（1001%4=1）
INSERT INTO `orders_1` (`user_id`, `amount`) VALUES (1001, 299.00);

-- 查询 user_id=1001 的订单（直接路由到 orders_1）
SELECT * FROM `orders_1` WHERE `user_id` = 1001;
```

:::

### 3. 分库分表带来的问题

| 问题 | 描述 | 解决方案 |
|------|------|----------|
| 分布式事务 | 跨库操作无法用本地事务保证 | Seata / TCC 模式 / 最终一致性 |
| 跨库 JOIN | 无法直接 JOIN 不同库的表 | 冗余字段 / 应用层聚合 / 数据同步到 ES |
| 全局唯一 ID | AUTO_INCREMENT 在分片中重复 | Snowflake / 号段模式 / UUID |
| 分页查询 | 跨分片 ORDER BY + LIMIT 需汇总再排序 | 流式分页 / ES 辅助 / 限制深分页 |
| 数据迁移 | 原有数据需重新分片 | 双写迁移 / 停机迁移 / 灰度迁移 |

---

## 八、ShardingSphere 基础

ShardingSphere 是 Apache 顶级项目，提供分库分表、读写分离、数据加密等能力，支持 JDBC 和 Proxy 两种接入模式。

::: details ShardingSphere-JDBC 分库分表配置示例

```yaml
# application.yml：2个库，每库4张订单表（共8张）
spring:
  shardingsphere:
    datasource:
      names: db0, db1
      db0:
        type: com.zaxxer.hikari.HikariDataSource
        jdbc-url: jdbc:mysql://host1:3306/order_db0
        username: root
        password: secret
      db1:
        type: com.zaxxer.hikari.HikariDataSource
        jdbc-url: jdbc:mysql://host2:3306/order_db1
        username: root
        password: secret
    rules:
      sharding:
        tables:
          orders:
            # 真实表：db0.orders_0 ~ db0.orders_3, db1.orders_0 ~ db1.orders_3
            actual-data-nodes: db$->{0..1}.orders_$->{0..3}
            # 分库策略：user_id % 2
            database-strategy:
              standard:
                sharding-column: user_id
                sharding-algorithm-name: db-inline
            # 分表策略：order_id % 4
            table-strategy:
              standard:
                sharding-column: order_id
                sharding-algorithm-name: table-inline
            # 全局唯一ID生成（雪花算法）
            key-generate-strategy:
              column: order_id
              key-generator-name: snowflake
        sharding-algorithms:
          db-inline:
            type: INLINE
            props:
              algorithm-expression: db$->{user_id % 2}
          table-inline:
            type: INLINE
            props:
              algorithm-expression: orders_$->{order_id % 4}
        key-generators:
          snowflake:
            type: SNOWFLAKE
            props:
              worker-id: 1
    props:
      sql-show: true
```

:::

::: tip 什么时候该分库分表
- 单表数据量超过 **2000万行**，或单库容量超过 **1TB** 时考虑分表。
- 优先考虑：加索引 → 读写分离 → 冷热数据归档 → 分表 → 分库。
- 分库分表大幅增加运维和开发复杂度，不要过度设计。
:::
