---
title: "Redis 持久化与高可用"
category: "后端 · Redis"
tags:
  - Redis
  - RDB
  - AOF
  - 哨兵
  - Cluster
date: 2026-03-17
excerpt: "深入介绍 Redis 的 RDB 和 AOF 两种持久化机制及其混合模式，主从复制原理，哨兵模式的选举与故障转移，Redis Cluster 的数据分片方案，以及 8 种内存淘汰策略的选择指南。"
---

# Redis 持久化与高可用

## 一、RDB 持久化

RDB（Redis Database）是将内存中的数据快照以二进制文件形式（`dump.rdb`）保存到磁盘的持久化方式。

### 1. 触发方式

| 触发方式 | 说明 |
|----------|------|
| 自动触发（save 配置） | 满足「M 秒内有 N 次写操作」时自动执行 BGSAVE |
| 手动 `BGSAVE` | 后台异步生成 RDB（推荐） |
| 手动 `SAVE` | 同步阻塞生成 RDB，期间无法处理请求（不推荐） |
| `SHUTDOWN` 时 | 若 AOF 未开启，关闭前自动保存 RDB |
| 主从全量同步 | 主库生成 RDB 发给从库 |

::: details RDB 配置示例

```ini
# redis.conf
# 自动触发：3600秒内至少1次写 OR 300秒内至少100次写 OR 60秒内至少10000次写
save 3600 1
save 300  100
save 60   10000

# 关闭自动RDB（只用AOF）
# save ""

# RDB文件名和保存目录
dbfilename dump.rdb
dir        /var/lib/redis/

# BGSAVE失败时停止写操作（默认yes，保证数据一致性）
stop-writes-on-bgsave-error yes

# 压缩RDB文件（减小体积，但增加CPU消耗）
rdbcompression yes

# RDB文件校验和（轻微性能损耗，保证文件完整性）
rdbchecksum yes
```

:::

### 2. fork 与 COW 原理

执行 `BGSAVE` 时，Redis 调用 `fork()` 创建子进程：

1. 父进程继续处理写请求，子进程负责将内存数据写入 RDB 文件。
2. 利用操作系统的 **COW（Copy-On-Write，写时复制）** 机制：fork 后父子进程共享同一块物理内存页，只有当父进程修改某页数据时，才复制该页给父进程专用，子进程始终看到 fork 时刻的内存快照。
3. 子进程完成写入后，原子替换旧的 RDB 文件。

::: tip fork 耗时问题
fork 本身需要复制父进程的页表，内存越大耗时越长（通常每 GB 内存耗时约 10ms~20ms）。期间 Redis 主线程阻塞，建议单实例内存不超过 10GB，并监控 `latest_fork_usec` 指标。
:::

### 3. RDB 优缺点

| 优点 | 缺点 |
|------|------|
| 文件紧凑，恢复速度快（直接加载二进制文件） | 最多丢失上次 BGSAVE 到宕机之间的数据 |
| fork 后子进程独立，对性能影响小 | 大内存时 fork 本身有阻塞风险 |
| 适合全量备份和数据迁移 | 不适合要求低 RPO（恢复点目标）的场景 |

---

## 二、AOF 持久化

AOF（Append Only File）将每条写命令追加记录到日志文件（`appendonly.aof`），以此实现数据恢复。

### 1. 写入策略（fsync 频率）

| `appendfsync` 配置 | 说明 | 安全性 | 性能 |
|--------------------|------|--------|------|
| `always` | 每次写命令后立即 fsync | 最安全，最多丢失一条命令 | 最慢 |
| `everysec` | 每秒 fsync 一次（默认） | 最多丢失 1 秒数据 | 折中，推荐 |
| `no` | 由操作系统决定 fsync 时机 | 可能丢失较多数据 | 最快 |

::: details AOF 配置示例

```ini
# redis.conf
appendonly         yes
appendfilename     "appendonly.aof"
appendfsync        everysec

# AOF重写时不执行fsync（避免重写期间主线程被fsync阻塞）
no-appendfsync-on-rewrite yes

# AOF自动重写触发条件：文件体积达到上次重写后的 2 倍 AND 体积超过 64MB
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size   64mb

# AOF文件末尾不完整时仍然加载（宕机可能导致最后一条命令不完整）
aof-use-rdb-preamble yes   # 开启混合持久化
```

:::

### 2. AOF 重写机制

随着写操作积累，AOF 文件会越来越大。AOF 重写通过 `BGREWRITEAOF` 命令，创建子进程将当前内存状态转换为等价的最小命令集，生成新的 AOF 文件，替换旧文件。

重写过程：

1. 主进程 fork 子进程，子进程遍历内存数据，生成等价的写命令写入新 AOF 文件。
2. 重写期间主进程的新写命令同时追加到 **AOF 重写缓冲区**。
3. 子进程完成后，主进程将重写缓冲区中的命令追加到新文件并原子替换旧文件。

---

## 三、RDB + AOF 混合持久化

Redis 4.0 引入混合持久化（`aof-use-rdb-preamble yes`）：AOF 重写时，将 RDB 二进制数据写入 AOF 文件头部，后续新的写命令以 AOF 格式追加，兼具 RDB 恢复快和 AOF 数据完整的优点。

| 持久化方式 | 数据安全性 | 恢复速度 | 文件大小 | 推荐场景 |
|------------|------------|----------|----------|----------|
| 仅 RDB | 低（可能丢分钟级数据） | 最快 | 小 | 可接受数据丢失的缓存场景 |
| 仅 AOF | 高（最多丢1秒） | 慢 | 大 | 数据安全优先 |
| 混合持久化 | 高 | 快 | 中 | **生产环境推荐** |

::: tip 生产环境推荐配置
同时开启 RDB 和 AOF 混合持久化，并定期将 RDB 文件备份到对象存储（如 OSS/S3），以应对极端故障场景。
:::

---

## 四、Redis 主从复制

### 1. 全量复制流程

从库首次连接或与主库断开重连后，触发全量复制：

1. 从库发送 `PSYNC` 命令到主库。
2. 主库执行 `BGSAVE` 生成 RDB 快照，同时将期间产生的写命令缓存到 **repl_backlog** 缓冲区。
3. 主库将 RDB 文件发送给从库，从库清空旧数据并加载 RDB。
4. 主库将 repl_backlog 中的增量命令发给从库，从库回放。
5. 进入**增量复制**阶段：后续写命令实时同步给从库。

### 2. 增量复制

从库断线重连后，若主库的 `repl_backlog` 缓冲区仍保存断线期间的数据，则只同步缺失部分（增量复制），避免全量同步的开销。

::: details 主从复制配置

```ini
# 从库配置
replicaof 192.168.1.100 6379   # 指定主库地址
masterauth "your_master_password"
replica-read-only yes           # 从库只读
replica-lazy-flush no           # 全量同步前是否异步清空旧数据

# 主库配置
repl-backlog-size 10mb          # repl_backlog 缓冲区大小
repl-backlog-ttl  3600          # 无从库连接后 backlog 保留时间（秒）
repl-diskless-sync yes          # 无盘复制：RDB 直接通过 socket 发送（不落盘）
```

```bash
# 查看主库复制状态
redis-cli INFO replication
# 输出：role:master, connected_slaves:2, slave0:ip=..., state=online
```

:::

---

## 五、哨兵模式（Sentinel）

哨兵模式通过独立的 Sentinel 进程监控 Redis 主从集群，实现自动故障转移（Failover）。

### 1. 核心功能

| 功能 | 说明 |
|------|------|
| 监控（Monitoring） | 每秒向主从节点发送 PING，检测节点是否在线 |
| 通知（Notification） | 节点故障时通知管理员或应用程序（Pub/Sub） |
| 自动故障转移（Failover） | 主库宕机时，自动选举新主库并更新从库配置 |
| 配置提供（Config Provider） | 客户端通过 Sentinel 获取当前主库地址 |

### 2. 选举与故障转移流程

1. **主观下线（SDOWN）**：单个 Sentinel 发现主库无响应，标记为主观下线。
2. **客观下线（ODOWN）**：当超过 `quorum`（法定人数）个 Sentinel 都认为主库下线，标记为客观下线。
3. **Leader 选举**：Sentinel 之间通过 Raft 算法选出 Leader，由 Leader 负责故障转移。
4. **选择新主库**：按优先级（`replica-priority`）→ 复制偏移量（数据最新）→ run ID 最小的顺序选择从库。
5. **切换主库**：向新主库发送 `REPLICAOF NO ONE`，向其他从库发送 `REPLICAOF <新主库>`，并更新 Sentinel 配置。

::: details 哨兵配置示例

```ini
# sentinel.conf
sentinel monitor mymaster 192.168.1.100 6379 2   # 至少2个哨兵同意才判定主库宕机
sentinel auth-pass mymaster your_password
sentinel down-after-milliseconds mymaster 5000   # 5秒无响应判定主观下线
sentinel failover-timeout mymaster 60000          # 故障转移超时60秒
sentinel parallel-syncs mymaster 1               # 同时向多少从库发起同步
```

```bash
# 查看哨兵状态
redis-cli -p 26379 SENTINEL masters
redis-cli -p 26379 SENTINEL slaves mymaster
```

:::

::: warning 哨兵模式的局限
哨兵模式解决了高可用问题，但**不支持数据分片**，单主库仍是存储上限。当数据量超过单机内存时，需要升级为 Redis Cluster。
:::

---

## 六、Redis Cluster 集群

Redis Cluster 是官方提供的分布式解决方案，支持数据自动分片和高可用。

### 1. Hash 槽与数据分片

Cluster 将数据空间划分为 **16384 个 Hash 槽（Slot）**，每个键通过 `CRC16(key) % 16384` 计算其所属的槽，槽均匀分配给各主节点。

::: details Hash 槽分配示例

```
3主3从集群，槽分配：
  Master-1: 槽 0 ~ 5460
  Master-2: 槽 5461 ~ 10922
  Master-3: 槽 10923 ~ 16383

CRC16("user:1001") % 16384 = 4092 → 路由到 Master-1
CRC16("order:2001") % 16384 = 7860 → 路由到 Master-2
```

:::

**Hash Tag**：通过在键名中使用 `{}` 包裹部分内容，强制将相关键路由到同一槽，支持 MGET、事务等跨键操作。

```bash
# 使用 Hash Tag：{user:1001} 决定槽，name/email/score 在同一个槽
SET {user:1001}.name "Alice"
SET {user:1001}.email "alice@example.com"
MGET {user:1001}.name {user:1001}.email   # 同一槽，支持 MGET
```

### 2. 节点通信（Gossip 协议）

Cluster 节点之间通过 Gossip 协议互换状态信息（PING/PONG/MEET），每个节点维护全局的槽映射和节点状态。

### 3. 故障检测与自动切换

1. 节点 A 向节点 B 发 PING，超时未响应，A 标记 B 为 **PFAIL（疑似下线）**。
2. 超过半数主节点都认为 B 疑似下线，则 B 被标记为 **FAIL（已下线）**。
3. B 对应的从节点发起选举（Raft），赢得多数主节点投票后提升为新主节点。

### 4. Cluster 配置与管理

::: details Redis Cluster 搭建示例

```ini
# redis-7001.conf（每个节点一个配置文件）
port 7001
cluster-enabled yes
cluster-config-file nodes-7001.conf
cluster-node-timeout 5000
appendonly yes
```

```bash
# 创建 6 节点集群（3主3从）
redis-cli --cluster create \
  127.0.0.1:7001 127.0.0.1:7002 127.0.0.1:7003 \
  127.0.0.1:7004 127.0.0.1:7005 127.0.0.1:7006 \
  --cluster-replicas 1   # 每个主节点1个从节点

# 查看集群信息
redis-cli -p 7001 CLUSTER INFO
redis-cli -p 7001 CLUSTER NODES

# 动态添加节点
redis-cli --cluster add-node 127.0.0.1:7007 127.0.0.1:7001

# 迁移槽（将100个槽从7001迁移到7007）
redis-cli --cluster reshard 127.0.0.1:7001 \
  --cluster-from <node-id-7001> \
  --cluster-to   <node-id-7007> \
  --cluster-slots 100
```

:::

---

## 七、内存淘汰策略

当 Redis 内存达到 `maxmemory` 上限时，根据配置的淘汰策略决定如何释放内存。

### 1. 八种淘汰策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| `noeviction` | 不淘汰，写操作返回错误（默认值） | 数据库模式，不能丢数据 |
| `allkeys-lru` | 从所有键中淘汰最近最少使用（LRU）的键 | **通用缓存（推荐）** |
| `allkeys-lfu` | 从所有键中淘汰使用频率最低（LFU）的键 | 热点数据差异大的缓存 |
| `allkeys-random` | 从所有键中随机淘汰 | 键访问频率均匀时 |
| `volatile-lru` | 只淘汰设置了过期时间的键中 LRU 的键 | 既有缓存又有持久数据 |
| `volatile-lfu` | 只淘汰设置了过期时间的键中 LFU 的键 | 同上，LFU 版本 |
| `volatile-random` | 随机淘汰设置了过期时间的键 | 同上，随机版本 |
| `volatile-ttl` | 优先淘汰剩余 TTL 最短的键 | 需要优先保留长期数据时 |

::: details 内存配置示例

```ini
# redis.conf
maxmemory 4gb
maxmemory-policy allkeys-lru   # 推荐通用缓存使用

# LRU/LFU 采样数（越大越精确，但 CPU 消耗增加；默认 5）
maxmemory-samples 10
```

:::

::: tip LRU vs LFU 选择
- **LRU（最近最少使用）**：适合均匀访问的缓存场景，最近没有被访问的数据优先淘汰。
- **LFU（最低使用频率）**：适合热点数据明显的场景，真正冷门的数据优先淘汰；能更好地保护高频热点数据不被意外淘汰。
- Redis 的 LRU/LFU 均为近似算法（随机采样），不是精确的全局排序，通过调大 `maxmemory-samples` 提高精度。
:::

### 2. 过期键删除策略

Redis 使用两种方式清理过期键：

| 策略 | 触发时机 | 说明 |
|------|----------|------|
| 惰性删除 | 访问键时检查 | 节省 CPU，但过期键可能长时间占用内存 |
| 定期删除 | 后台定时扫描（每秒 10 次） | 每次随机检查若干键，删除其中过期的 |

两种策略配合使用，共同保证过期键最终被清理。内存淘汰策略是在这两种机制之外的最后防线。
