---
title: "Redis面试题"
category: "面试题"
tags:
  - Redis
  - 缓存
  - 分布式锁
excerpt: "围绕 Redis 的单线程模型、数据类型与底层编码、RDB 与 AOF 持久化、过期与淘汰策略、缓存穿透击穿雪崩、缓存与数据库一致性、分布式锁以及主从、哨兵和集群等面试题，说明机制与取舍。"
---

# Redis面试题

Redis 面试题分两类：Redis 自身如何工作（线程模型、数据结构、持久化和集群），以及把它当缓存或锁使用时，业务系统要处理哪些失败情况。后一类问题没有“万无一失”的答案，回答时要说明方案能保证什么、在什么条件下失效。

::: info 版本边界
本篇以 Redis 7.x 的行为为准，Redis 8 在命令和模块方面的新增内容不展开。命令示例可在 `redis-cli` 中执行。
:::

## 一、基础与数据结构

### 1. Redis 为什么快，它真的是单线程吗？

**Redis 快的主要原因是数据在内存中、命令执行由单个主线程完成而没有锁竞争，并使用 I/O 多路复用（Linux 上是 epoll）同时管理大量连接。**

“单线程”指执行命令的是一个线程，并不是整个进程只有一个线程：持久化时 fork 子进程，`UNLINK` 等异步删除由后台线程完成。Redis 6.0 起可以开启 I/O 线程（`io-threads`）并行处理网络读写和协议解析，命令执行仍然串行。

串行执行意味着任何慢命令都会阻塞其他所有客户端。`KEYS *`、对大集合执行 `HGETALL`/`SMEMBERS`、删除百万元素的大 key 都可能造成秒级卡顿；生产环境应使用 `SCAN` 系列命令分批遍历，用 `UNLINK` 异步删除大 key。

参考：[Redis 文档：延迟诊断](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/latency/)。

### 2. 常用数据类型的底层编码是什么，分别适用于什么场景？

**每种数据类型会根据元素数量和大小选择不同编码，小数据用紧凑编码节省内存，超过阈值后转换为查询更快的结构。** 用 `OBJECT ENCODING key` 可以查看当前编码。

| 类型 | 底层编码（Redis 7） | 典型场景 |
|------|---------------------|----------|
| String | `int`、`embstr`、`raw`（SDS） | 缓存对象、计数器、分布式锁 |
| List | `listpack`、`quicklist` | 消息列表、最新动态 |
| Hash | `listpack`、`hashtable` | 对象字段，如购物车 |
| Set | `intset`、`listpack`（7.2 起）、`hashtable` | 去重、共同好友 |
| Sorted Set | `listpack`、`skiplist` + `hashtable` | 排行榜、延时队列 |

Redis 7.0 用 listpack 全面替代了 ziplist，解决了 ziplist 修改时可能引发的连锁更新问题。Sorted Set 元素较多时同时使用跳表和哈希表：哈希表支持 O(1) 按成员取分数，跳表支持 O(log n) 按分数范围查询。另外还有 Bitmap、HyperLogLog、GEO 和 Stream 等类型，分别用于签到统计、基数估算、地理位置和消息流。

参考：[Redis 文档：数据类型](https://redis.io/docs/latest/develop/data-types/)。

### 3. 为什么 Sorted Set 使用跳表而不是红黑树？

**跳表在多层有序链表上逐层缩小范围，查找、插入、删除的平均复杂度都是 O(log n)，并且范围查询只需定位起点后沿底层链表顺序遍历。**

Redis 作者给出的理由主要是实现与调整更简单：跳表插入时通过随机层数决定节点高度，不需要像红黑树那样旋转；`ZRANGEBYSCORE` 这样的范围查询在跳表中比在平衡树中更直接。跳表每个节点平均的指针数可以通过层级概率调节，内存开销与平衡树相当。

参考：[Redis 源码：t_zset.c](https://github.com/redis/redis/blob/7.4/src/t_zset.c)。

## 二、持久化与内存

### 1. RDB 与 AOF 有什么区别，如何选择？

**RDB 在某个时间点把内存数据生成快照文件；AOF 把每个写命令追加到日志文件，重启时重放命令恢复数据。**

| 维度 | RDB | AOF |
|------|-----|-----|
| 数据安全 | 两次快照之间的数据可能丢失 | `everysec` 下最多丢失约 1 秒 |
| 文件大小 | 二进制压缩，较小 | 较大，需要定期重写压缩 |
| 恢复速度 | 快 | 较慢，需要重放命令 |
| 生成方式 | `BGSAVE` fork 子进程写快照 | 主线程追加，后台 fsync |

`appendfsync` 有三个取值：`always` 每次写都刷盘，最安全但最慢；`everysec` 每秒刷盘，是默认值；`no` 交给操作系统决定。Redis 4.0 起支持混合持久化，AOF 重写时先写入 RDB 格式的全量数据，再追加增量命令，兼顾恢复速度和数据完整性；Redis 7.0 起 AOF 改为由基础文件和增量文件组成的多文件结构。

::: warning fork 可能造成延迟和内存翻倍
`BGSAVE` 和 AOF 重写都会 fork 子进程。fork 时需要复制页表，大内存实例可能阻塞主线程数十到数百毫秒；之后写入越多，写时复制产生的额外内存越多。实例的最大内存应为物理内存预留足够余量。
:::

参考：[Redis 文档：持久化](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)。

### 2. 过期 key 如何删除，内存满了会发生什么？

**Redis 对过期 key 同时使用惰性删除和定期删除：访问 key 时检查是否过期，同时后台定期抽样检查设置了过期时间的 key。** 两种方式都可能让部分已过期的 key 暂时留在内存中。

内存达到 `maxmemory` 后，按 `maxmemory-policy` 处理新的写入：

| 策略 | 行为 |
|------|------|
| `noeviction`（默认） | 拒绝写入并返回错误，读操作正常 |
| `allkeys-lru` | 在所有 key 中淘汰最近最少使用的 |
| `allkeys-lfu` | 在所有 key 中淘汰访问频率最低的 |
| `volatile-lru` / `volatile-lfu` | 只在设置了过期时间的 key 中淘汰 |
| `volatile-ttl` | 优先淘汰剩余时间最短的 |
| `allkeys-random` / `volatile-random` | 随机淘汰 |

纯缓存场景通常选择 `allkeys-lru` 或 `allkeys-lfu`；Redis 同时存放不能丢失的数据时，选择 `volatile-*` 并只给缓存数据设置过期时间。Redis 的 LRU 是近似算法，每次抽样若干 key（`maxmemory-samples`，默认 5）淘汰其中最久未用的，并不维护全局链表。

参考：[Redis 文档：key 淘汰](https://redis.io/docs/latest/develop/reference/eviction/)。

## 三、缓存问题

### 1. 缓存穿透、击穿和雪崩有什么区别，如何应对？

**穿透是请求的数据根本不存在，缓存永远不命中；击穿是一个热点 key 过期的瞬间大量请求打到数据库；雪崩是大量 key 同时失效或缓存服务宕机。**

| 问题 | 触发条件 | 应对方式 |
|------|----------|----------|
| 穿透 | 查询不存在的商品 ID，可能是恶意请求 | 缓存空值并设短过期时间；布隆过滤器预先拦截；参数校验 |
| 击穿 | 热点 key 过期 | 互斥锁只让一个请求回源重建；热点数据逻辑过期，异步刷新 |
| 雪崩 | 大量 key 过期时间相同或 Redis 宕机 | 过期时间加随机偏移；Redis 高可用部署；回源限流与降级 |

布隆过滤器判断“不存在”时一定不存在，判断“存在”时有一定误判率，且普通布隆过滤器不支持删除元素。用它防穿透时，新增商品需要同步写入过滤器，否则新商品会被误拦截。

参考：[Redis 文档：布隆过滤器](https://redis.io/docs/latest/develop/data-types/probabilistic/bloom-filter/)。

### 2. 如何保证缓存与数据库的数据一致性？

**最常用的是 Cache Aside 模式：读时先查缓存，未命中再查数据库并写入缓存；写时先更新数据库，再删除缓存。** 它保证的是最终一致，而非强一致。

为什么是“删除”而不是“更新”缓存：两个并发写请求更新缓存的顺序可能与更新数据库的顺序相反，导致缓存保留旧值；删除后由下一次读请求加载最新值，还能避免写多读少时频繁计算无人读取的缓存。

为什么先更新数据库再删除缓存：若先删缓存再更新数据库，在两步之间到来的读请求会把旧值重新写回缓存，并一直保留到过期。先更新数据库也存在小概率不一致：读请求在缓存失效时读到旧值，写请求随后更新数据库并删除缓存，读请求最后才把旧值写入缓存。这要求读请求的数据库查询比写请求的“更新 + 删除”还慢，概率较低。

::: tip 删除失败要有补偿
删除缓存可能因网络失败而没有执行。可以把删除操作放入消息队列重试，或订阅 MySQL binlog（如使用 Canal）异步删除缓存，让删除不依赖业务代码；同时为所有缓存设置过期时间，作为不一致的兜底上限。
:::

参考：[Microsoft Azure 架构中心：Cache-Aside 模式](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside)。

### 3. 大 key 和热 key 有什么危害，如何处理？

**大 key 是单个 value 过大或集合元素过多的 key，热 key 是访问量远高于其他 key 的 key。** 两者都会让单个实例或单个分片承受不成比例的压力。

大 key 的危害包括：读取占用大量带宽，删除或过期时阻塞主线程，集群迁移时卡顿。可以用 `redis-cli --bigkeys` 或 `MEMORY USAGE key` 定位，处理方式是拆分为多个小 key（如按用户 ID 取模分桶），用 `UNLINK` 异步删除。

热 key 的危害是请求集中到一个分片，即使扩容集群也无法分担。可以用 `redis-cli --hotkeys`（需要 LFU 淘汰策略）发现，处理方式包括在应用层增加本地缓存、把热 key 复制为多个副本 key 随机读取。

参考：[Redis 文档：redis-cli](https://redis.io/docs/latest/develop/tools/cli/)。

## 四、分布式锁与高可用

### 1. 如何用 Redis 实现分布式锁，要注意哪些问题？

**加锁使用 `SET key value NX PX 毫秒数`，它原子地完成“不存在才设置”和“设置过期时间”；value 写入当前请求的唯一标识，释放时只删除自己持有的锁。**

```text
SET lock:order:1001 8f3c2a NX PX 30000
```

释放锁需要先比较 value 再删除，两步必须原子执行，否则可能在比较后锁恰好过期并被别人获取，随后误删别人的锁。使用 Lua 脚本：

```lua
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
```

| 问题 | 原因 | 处理方式 |
|------|------|----------|
| 业务未执行完锁就过期 | 过期时间小于执行时间 | 看门狗续期，如 Redisson 默认每 10 秒续期到 30 秒 |
| 主从切换导致锁丢失 | 主库加锁后尚未同步就宕机 | 接受风险，或用 Redlock、ZooKeeper 等方案 |
| 进程长时间停顿后继续写 | GC 停顿期间锁已被他人获取 | 下游存储校验单调递增的 fencing token |

Redlock 向多个独立 Redis 实例加锁、获得多数成功才算成功，但它依赖各节点时钟大致同步，其安全性存在争议。对正确性要求极高的场景（如扣款），不能只依赖分布式锁，还要用数据库唯一约束或版本号做最终保护。

参考：[Redis 文档：分布式锁](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/)、[Martin Kleppmann：How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html)。

### 2. 主从复制、哨兵和集群分别解决什么问题？

**主从复制提供数据副本和读扩展，哨兵在主节点故障时自动完成主从切换，集群通过分片同时扩展存储容量和写能力。**

| 方案 | 解决的问题 | 限制 |
|------|------------|------|
| 主从复制 | 数据冗余、读写分离 | 主库故障需人工切换 |
| 哨兵 Sentinel | 自动故障发现与主从切换 | 写能力和容量仍受单主限制 |
| 集群 Cluster | 数据分片、多主写入 | 多 key 操作要求在同一槽位 |

Redis Cluster 把 key 空间划分为 16384 个哈希槽，槽位 = `CRC16(key) mod 16384`，每个主节点负责一部分槽位。`MGET`、事务和 Lua 脚本涉及的多个 key 必须在同一槽位，可以用哈希标签让它们落到同一槽，例如 `{user:1001}:cart` 和 `{user:1001}:profile` 只用花括号内的部分计算槽位。

复制是异步的，主节点确认写入后若在同步前宕机，这部分写入会在故障切换后丢失。`WAIT` 命令可以等待指定数量的副本确认，但它只能减少丢失窗口，不能把 Redis 变成强一致存储。

参考：[Redis 文档：复制](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/)、[Redis 文档：集群规范](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/)。
