---
title: "Redis 基础与实践"
category: "后端 · Redis"
tags:
  - Redis
excerpt: "Redis（Remote Dictionary Server）是一个开源的内存键值数据库，以极高的读写性能著称。它支持多种数据结构，常用于缓存、会话管理、消息队列、排行榜等场景。 高性能：数据存储在内存中，读写速度极快（10 万+ QPS）..."
---

# Redis 基础与实践

## 一、Redis 概述

Redis（Remote Dictionary Server）是一个开源的内存键值数据库，以极高的读写性能著称。它支持多种数据结构，常用于缓存、会话管理、消息队列、排行榜等场景。

### 1. 核心特点

- **高性能**：数据存储在内存中，读写速度极快（10 万+ QPS）
- **丰富的数据结构**：String、List、Set、Hash、Sorted Set 等
- **持久化**：支持 RDB 快照和 AOF 日志两种方式
- **原子操作**：所有操作都是原子性的，支持事务
- **集群支持**：原生支持主从复制和 Cluster 分片

### 2. 安装与启动

::: code-group

```bash [macOS]
brew install redis
brew services start redis
```

```bash [Ubuntu/Debian]
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

```bash [Docker]
docker run -d \
  --name redis \
  -p 6379:6379 \
  -v redis_data:/data \
  redis:7-alpine \
  redis-server --requirepass your_password
```

:::

### 3. 连接 Redis

::: details 连接示例

```bash
# 本地连接
redis-cli

# 指定主机和密码
redis-cli -h 127.0.0.1 -p 6379 -a your_password

# 测试连接
127.0.0.1:6379> PING
PONG
```

:::

## 二、数据结构与命令

### 1. String（字符串）

最基础的数据类型，可存储字符串、数字、二进制数据，最大 512MB。

::: details String 命令示例

```bash
# 设置与获取
SET user:1:name "张三"
GET user:1:name

# 设置过期时间（秒）
SET session:abc123 '{"userId":1}' EX 3600

# 仅在 key 不存在时设置（分布式锁常用）
SET lock:order:1001 "holder_id" NX EX 30

# 数值操作
SET counter 100
INCR counter          # 101
INCRBY counter 10     # 111
DECR counter          # 110

# 批量操作
MSET name "张三" age "25" city "北京"
MGET name age city
```

:::

### 2. List（列表）

有序的字符串列表，底层为双向链表或压缩列表，支持从两端插入和弹出。

::: details List 命令示例

```bash
# 左侧/右侧插入
LPUSH queue:tasks "task1" "task2" "task3"
RPUSH queue:tasks "task4"

# 弹出元素
LPOP queue:tasks    # 左侧弹出
RPOP queue:tasks    # 右侧弹出

# 阻塞弹出（消息队列场景）
BLPOP queue:tasks 30    # 阻塞等待 30 秒

# 查看范围
LRANGE queue:tasks 0 -1   # 获取所有元素
LLEN queue:tasks           # 获取长度

# 按索引获取
LINDEX queue:tasks 0       # 获取第一个元素
```

:::

### 3. Hash（哈希）

键值对集合，适合存储对象。

::: details Hash 命令示例

```bash
# 设置字段
HSET user:1 name "张三" age 25 email "zhangsan@example.com"

# 获取字段
HGET user:1 name
HGETALL user:1

# 增加数值字段
HINCRBY user:1 age 1

# 判断字段是否存在
HEXISTS user:1 email

# 删除字段
HDEL user:1 email

# 获取所有字段名
HKEYS user:1
```

:::

### 4. Set（集合）

无序的字符串集合，元素唯一，支持集合运算。

::: details Set 命令示例

```bash
# 添加元素
SADD tags:article:1 "redis" "database" "nosql"
SADD tags:article:2 "redis" "cache" "performance"

# 查看所有成员
SMEMBERS tags:article:1

# 判断是否是成员
SISMEMBER tags:article:1 "redis"

# 集合运算
SINTER tags:article:1 tags:article:2      # 交集
SUNION tags:article:1 tags:article:2      # 并集
SDIFF tags:article:1 tags:article:2       # 差集

# 随机获取（抽奖场景）
SRANDMEMBER lucky:pool 3
SPOP lucky:pool 1    # 随机弹出
```

:::

### 5. Sorted Set（有序集合）

有序集合，每个元素关联一个分数（score），按分数排序，元素唯一。

::: details Sorted Set 命令示例

```bash
# 添加元素与分数
ZADD leaderboard 1000 "player:1" 850 "player:2" 1200 "player:3"

# 查看排名（从高到低）
ZREVRANGE leaderboard 0 9 WITHSCORES    # Top 10

# 查看某成员排名
ZREVRANK leaderboard "player:1"

# 增加分数
ZINCRBY leaderboard 50 "player:2"

# 按分数范围查询
ZRANGEBYSCORE leaderboard 900 1200 WITHSCORES

# 获取成员数量
ZCARD leaderboard

# 删除成员
ZREM leaderboard "player:2"
```

:::

## 三、Key 管理

### 1. 通用命令

::: details Key 管理示例

```bash
# 查看匹配的 key（生产环境慎用，推荐 SCAN）
KEYS user:*

# 使用 SCAN 安全遍历
SCAN 0 MATCH user:* COUNT 100

# 检查 key 是否存在
EXISTS user:1

# 设置/查看过期时间
EXPIRE user:1 3600
TTL user:1            # 剩余秒数
PERSIST user:1        # 移除过期时间

# 删除 key
DEL user:1
UNLINK user:1         # 异步删除（推荐）

# 查看 key 类型
TYPE user:1
```

:::

::: warning
生产环境中禁止使用 `KEYS *` 命令，它会阻塞 Redis 服务器。请使用 `SCAN` 代替。
:::

## 四、持久化

### 1. RDB（快照）

RDB 以指定时间间隔将内存数据快照写入磁盘，生成 `.rdb` 文件。

::: details RDB 配置

```bash
# redis.conf 配置
save 900 1        # 900 秒内至少 1 次修改则触发快照
save 300 10       # 300 秒内至少 10 次修改
save 60 10000     # 60 秒内至少 10000 次修改

dbfilename dump.rdb
dir /var/lib/redis

# 手动触发
BGSAVE            # 后台异步保存
SAVE              # 同步保存（会阻塞）
```

:::

**优点**：文件紧凑，恢复速度快，适合备份
**缺点**：可能丢失最后一次快照后的数据

### 2. AOF（追加日志）

AOF 记录每次写操作命令，重启时重放命令恢复数据。

::: details AOF 配置

```bash
# redis.conf 配置
appendonly yes
appendfilename "appendonly.aof"

# 同步策略
appendfsync always      # 每次写操作都同步，最安全但最慢
appendfsync everysec    # 每秒同步一次（推荐）
appendfsync no          # 由操作系统决定

# AOF 重写（压缩日志文件）
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
```

:::

**优点**：数据安全性高，最多丢失 1 秒数据
**缺点**：文件较大，恢复速度较慢

::: tip
生产环境建议同时开启 RDB 和 AOF。RDB 用于快速恢复和备份，AOF 用于保证数据安全性。
:::

## 五、发布订阅（Pub/Sub）

### 1. 基本用法

::: details 发布订阅示例

```bash
# 终端 1：订阅频道
SUBSCRIBE chat:room:1

# 终端 2：发布消息
PUBLISH chat:room:1 "Hello, Redis!"

# 模式订阅（通配符）
PSUBSCRIBE chat:*
```

:::

### 2. 应用场景

- 实时消息推送
- 配置变更通知
- 事件广播

::: warning
Pub/Sub 不持久化消息，离线客户端会丢失消息。如需可靠消息队列，请使用 Redis Stream 或专业消息中间件。
:::

## 六、事务

### 1. 事务命令

::: details 事务示例

```bash
# MULTI/EXEC 事务
MULTI
SET user:1:balance 900
SET user:2:balance 1100
EXEC

# WATCH 实现乐观锁
WATCH user:1:balance
GET user:1:balance
MULTI
DECRBY user:1:balance 100
INCRBY user:2:balance 100
EXEC
# 如果 WATCH 的 key 在事务期间被修改，EXEC 返回 nil
```

:::

### 2. Lua 脚本

Lua 脚本在 Redis 中原子执行，适合复杂的原子操作。

::: details Lua 脚本示例

```bash
# 限流器：每分钟最多 100 次请求
EVAL "
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])
  local current = redis.call('INCR', key)
  if current == 1 then
    redis.call('EXPIRE', key, window)
  end
  if current > limit then
    return 0
  end
  return 1
" 1 rate:user:1 100 60
```

:::

## 七、集群

### 1. 主从复制

::: details 主从配置

```bash
# 从节点配置（redis.conf）
replicaof 192.168.1.100 6379
masterauth your_master_password

# 查看复制状态
INFO replication
```

:::

### 2. 哨兵模式（Sentinel）

哨兵负责监控主从节点，自动完成故障转移。

::: details 哨兵配置

```bash
# sentinel.conf
sentinel monitor mymaster 192.168.1.100 6379 2
sentinel auth-pass mymaster your_password
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 60000
```

:::

### 3. Cluster 模式

Redis Cluster 将数据分片到多个节点，支持水平扩展。

- 数据按 16384 个 hash slot 分配到各节点
- 每个节点负责一部分 slot
- 支持自动故障转移

## 八、常见应用场景

### 1. 缓存

::: details 缓存示例（Node.js）

```js
const Redis = require('ioredis')
const redis = new Redis()

async function getUser(userId) {
  const cacheKey = `user:${userId}`

  // 先查缓存
  const cached = await redis.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }

  // 缓存未命中，查数据库
  const user = await db.query('SELECT * FROM users WHERE id = ?', [userId])

  // 写入缓存，设置过期时间
  await redis.set(cacheKey, JSON.stringify(user), 'EX', 3600)

  return user
}
```

:::

### 2. 会话管理

::: details Session 存储示例

```js
const session = require('express-session')
const RedisStore = require('connect-redis').default

app.use(session({
  store: new RedisStore({ client: redis }),
  secret: 'your_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 小时
}))
```

:::

### 3. 限流

::: details 滑动窗口限流示例

```js
async function isRateLimited(userId, limit = 100, windowSec = 60) {
  const key = `rate:${userId}`
  const now = Date.now()
  const windowStart = now - windowSec * 1000

  const pipeline = redis.pipeline()
  pipeline.zremrangebyscore(key, 0, windowStart) // 移除窗口外的记录
  pipeline.zadd(key, now, `${now}`)              // 添加当前请求
  pipeline.zcard(key)                             // 统计窗口内请求数
  pipeline.expire(key, windowSec)                 // 设置过期时间

  const results = await pipeline.exec()
  const requestCount = results[2][1]

  return requestCount > limit
}
```

:::

### 4. 排行榜

::: details 排行榜示例

```js
// 更新玩家分数
await redis.zincrby('leaderboard:daily', score, `player:${playerId}`)

// 获取 Top 10
const top10 = await redis.zrevrange('leaderboard:daily', 0, 9, 'WITHSCORES')

// 获取玩家排名（从 0 开始）
const rank = await redis.zrevrank('leaderboard:daily', `player:${playerId}`)
```

:::
