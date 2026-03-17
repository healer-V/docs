---
title: "Redis 数据结构与命令"
category: "后端 · Redis"
tags:
  - Redis
  - 数据结构
  - String
  - Hash
  - List
date: 2026-03-17
excerpt: "全面介绍 Redis 的九种数据结构：String、Hash、List、Set、Sorted Set、Bitmap、HyperLogLog、GEO 和 Stream，覆盖每种结构的常用命令、底层编码与典型应用场景。"
---

# Redis 数据结构与命令

## 一、String（字符串）

String 是 Redis 最基本的数据结构，值可以是字符串、整数或浮点数，最大支持 512MB。

### 1. 基础命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `SET key value [EX seconds] [NX\|XX]` | 设置键值，支持过期时间和条件写 | `SET token:1001 "abc" EX 3600` |
| `GET key` | 获取值 | `GET token:1001` |
| `MSET k1 v1 k2 v2` | 批量设置 | `MSET name Alice age 25` |
| `MGET k1 k2` | 批量获取 | `MGET name age` |
| `SETEX key seconds value` | 设置键值并指定过期时间 | `SETEX session:abc 1800 "data"` |
| `SETNX key value` | 仅键不存在时设置（原子操作） | `SETNX lock:order 1` |
| `DEL key` | 删除键 | `DEL token:1001` |
| `TTL key` | 查看剩余过期时间（秒） | `TTL session:abc` |
| `EXPIRE key seconds` | 设置/更新过期时间 | `EXPIRE token:1001 7200` |

### 2. 计数命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `INCR key` | 自增 1 | `INCR pv:article:100` |
| `INCRBY key n` | 自增 n | `INCRBY stock:sku001 -1` |
| `INCRBYFLOAT key f` | 自增浮点数 | `INCRBYFLOAT price:001 9.9` |
| `DECR key` | 自减 1 | `DECR inventory:sku001` |

::: details String 常用场景示例

```bash
# 1. 缓存用户信息（JSON序列化）
SET user:1001 '{"id":1001,"name":"Alice","email":"alice@example.com"}' EX 3600

# 2. 分布式会话 Session
SET session:a8f3b2c1 '{"userId":1001,"role":"admin"}' EX 1800

# 3. 计数器（文章浏览量）
INCR pv:article:2001
INCRBY pv:article:2001 10   # 批量同步时一次加10

# 4. 限流（每分钟最多100次请求）
SET ratelimit:user:1001 0 EX 60 NX   # 首次初始化
INCR ratelimit:user:1001              # 每次请求+1，客户端判断是否超限

# 5. 分布式锁（SET NX EX 原子操作）
SET lock:order:20250301 1 EX 30 NX   # 成功返回OK，失败返回nil
```

:::

---

## 二、Hash（哈希）

Hash 适合存储对象，每个键对应一个字段-值映射，避免序列化整个对象。

### 1. 常用命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `HSET key field value [field value ...]` | 设置一个或多个字段 | `HSET user:1001 name Alice age 25` |
| `HGET key field` | 获取单个字段 | `HGET user:1001 name` |
| `HMGET key f1 f2` | 批量获取字段 | `HMGET user:1001 name email` |
| `HGETALL key` | 获取所有字段和值 | `HGETALL user:1001` |
| `HDEL key field` | 删除字段 | `HDEL user:1001 age` |
| `HEXISTS key field` | 判断字段是否存在 | `HEXISTS user:1001 email` |
| `HKEYS key` | 获取所有字段名 | `HKEYS user:1001` |
| `HVALS key` | 获取所有字段值 | `HVALS user:1001` |
| `HLEN key` | 获取字段数量 | `HLEN user:1001` |
| `HINCRBY key field n` | 字段自增 n | `HINCRBY user:1001 score 10` |

::: details Hash 场景示例

```bash
# 存储用户对象（部分更新不需要反序列化整个对象）
HSET user:1001 \
  name  "Alice" \
  email "alice@example.com" \
  age   25 \
  score 100

# 只更新积分（不影响其他字段）
HINCRBY user:1001 score 50

# 购物车（Hash Key=cartId，Field=skuId，Value=数量）
HSET cart:user:1001 sku:2001 2 sku:2002 1
HINCRBY cart:user:1001 sku:2001 1   # 加购1件
HGETALL cart:user:1001              # 获取全部购物车项
```

:::

::: tip Hash vs String 存储对象
- **String + JSON**：读写整个对象简单，但部分更新需要先读后写，有竞态风险。
- **Hash**：字段级别读写，部分更新高效，适合频繁修改个别字段的场景。
- 当字段数量少（< 128）且值较小时，Hash 会使用 ziplist 编码，内存极其紧凑。
:::

---

## 三、List（列表）

List 是有序的字符串列表，支持从头部（左）或尾部（右）进行插入和弹出，底层使用 quicklist。

### 1. 常用命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `LPUSH key v1 v2` | 从左端插入（结果反序） | `LPUSH queue:task "t1" "t2"` |
| `RPUSH key v1 v2` | 从右端插入 | `RPUSH timeline:1001 "msg1"` |
| `LPOP key [count]` | 从左端弹出 | `LPOP queue:task` |
| `RPOP key [count]` | 从右端弹出 | `RPOP queue:task` |
| `BLPOP key [key...] timeout` | 阻塞式左端弹出 | `BLPOP queue:task 30` |
| `BRPOP key [key...] timeout` | 阻塞式右端弹出 | `BRPOP queue:task 30` |
| `LRANGE key start stop` | 获取指定范围的元素 | `LRANGE timeline:1001 0 9` |
| `LLEN key` | 获取列表长度 | `LLEN queue:task` |
| `LINDEX key index` | 按索引获取元素 | `LINDEX timeline:1001 0` |
| `LTRIM key start stop` | 保留指定范围，删除其余 | `LTRIM timeline:1001 0 99` |
| `LINSERT key BEFORE\|AFTER pivot value` | 在指定元素前/后插入 | `LINSERT mylist BEFORE "b" "x"` |

::: details List 场景示例

```bash
# 1. 消息队列（生产者 RPUSH，消费者 BLPOP）
# 生产者
RPUSH mq:orders '{"orderId":"20250301001","amount":299}'
# 消费者（阻塞等待，超时30秒）
BLPOP mq:orders 30

# 2. 最近N条动态（微博/朋友圈时间线）
# 发布动态
LPUSH timeline:user:1001 '{"type":"post","id":5001}'
# 保留最近100条（防止列表无限增长）
LTRIM timeline:user:1001 0 99
# 获取最新10条
LRANGE timeline:user:1001 0 9

# 3. 栈（LPUSH + LPOP）
LPUSH stack "a" "b" "c"
LPOP stack   # 返回 "c"（后进先出）
```

:::

---

## 四、Set（集合）

Set 是无序不重复的字符串集合，支持集合运算（交集、并集、差集）。

### 1. 常用命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `SADD key member [member...]` | 添加成员 | `SADD tags:article:100 "Redis" "DB"` |
| `SMEMBERS key` | 获取所有成员 | `SMEMBERS tags:article:100` |
| `SISMEMBER key member` | 判断成员是否存在 | `SISMEMBER tags:article:100 "Redis"` |
| `SCARD key` | 获取集合大小 | `SCARD tags:article:100` |
| `SREM key member` | 删除成员 | `SREM tags:article:100 "DB"` |
| `SRANDMEMBER key count` | 随机获取 count 个成员 | `SRANDMEMBER lottery:pool 3` |
| `SPOP key count` | 随机弹出 count 个成员 | `SPOP lottery:pool 1` |
| `SINTER k1 k2` | 交集 | `SINTER fans:1001 fans:1002` |
| `SUNION k1 k2` | 并集 | `SUNION tags:100 tags:101` |
| `SDIFF k1 k2` | 差集（k1 有 k2 没有） | `SDIFF follows:1001 follows:1002` |

::: details Set 场景示例

```bash
# 1. 去重（文章UV统计，每个IP只计一次）
SADD uv:article:100:20250301 "192.168.1.1"
SADD uv:article:100:20250301 "192.168.1.2"
SCARD uv:article:100:20250301   # 返回当天UV数

# 2. 共同关注（好友交集）
SADD follows:user:1001 1002 1003 1004
SADD follows:user:1005 1002 1003 1006
SINTER follows:user:1001 follows:user:1005   # 共同关注: 1002, 1003

# 3. 推荐关注（差集：user:1005 关注了但 user:1001 没关注的人）
SDIFF follows:user:1005 follows:user:1001   # 返回: 1006

# 4. 抽奖（随机弹出中奖者，不重复）
SADD lottery:pool "user:1001" "user:1002" "user:1003" "user:1004" "user:1005"
SPOP lottery:pool 3   # 随机抽取3名中奖者并移除
```

:::

---

## 五、Sorted Set（有序集合）

Sorted Set 在 Set 基础上为每个成员关联一个 `score`（分数），按 score 自动排序，底层使用 skiplist + ziplist。

### 1. 常用命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `ZADD key [NX\|XX\|GT\|LT] score member` | 添加成员和分数 | `ZADD leaderboard 9800 "Alice"` |
| `ZSCORE key member` | 获取成员分数 | `ZSCORE leaderboard "Alice"` |
| `ZRANK key member` | 获取正序排名（0起） | `ZRANK leaderboard "Alice"` |
| `ZREVRANK key member` | 获取倒序排名 | `ZREVRANK leaderboard "Alice"` |
| `ZINCRBY key increment member` | 成员分数增加 | `ZINCRBY leaderboard 200 "Alice"` |
| `ZRANGE key start stop [WITHSCORES]` | 正序范围获取 | `ZRANGE leaderboard 0 9 WITHSCORES` |
| `ZREVRANGE key start stop [WITHSCORES]` | 倒序范围获取 | `ZREVRANGE leaderboard 0 9 WITHSCORES` |
| `ZRANGEBYSCORE key min max` | 按分数范围获取 | `ZRANGEBYSCORE scores 80 100` |
| `ZCARD key` | 获取成员数量 | `ZCARD leaderboard` |
| `ZREM key member` | 删除成员 | `ZREM leaderboard "Alice"` |
| `ZCOUNT key min max` | 统计分数范围内的成员数 | `ZCOUNT scores 80 100` |

::: details Sorted Set 场景示例

```bash
# 1. 游戏积分排行榜
ZADD game:rank 9800 "Alice" 9500 "Bob" 10200 "Carol"

# 获取 TOP3（倒序）
ZREVRANGE game:rank 0 2 WITHSCORES
# 1) "Carol" 2) "10200"
# 3) "Alice" 4) "9800"
# 5) "Bob"   6) "9500"

# 获取某用户排名
ZREVRANK game:rank "Alice"   # 返回 1（排名第2，0-based）

# 增加积分
ZINCRBY game:rank 500 "Bob"

# 2. 延迟队列（score = 执行时间戳）
# 添加任务（5分钟后执行）
ZADD delay:queue 1746000000 '{"taskId":"t001","type":"email"}'
# 消费者轮询：取出score <= 当前时间的任务
ZRANGEBYSCORE delay:queue 0 1746000000 LIMIT 0 10

# 3. 滑动窗口限流
# 用时间戳为score，记录请求时间
ZADD ratelimit:api:1001 1745990000 "req:uuid1"
# 移除窗口外的记录（1分钟前）
ZREMRANGEBYSCORE ratelimit:api:1001 0 1745990000
# 统计窗口内请求数
ZCARD ratelimit:api:1001
```

:::

---

## 六、Bitmap（位图）

Bitmap 是基于 String 的位操作，将 String 看作二进制位数组，适合大规模布尔状态存储。

### 1. 常用命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `SETBIT key offset value` | 设置指定位 | `SETBIT sign:user:1001 1 1` |
| `GETBIT key offset` | 获取指定位 | `GETBIT sign:user:1001 1` |
| `BITCOUNT key [start end]` | 统计值为1的位数 | `BITCOUNT sign:user:1001` |
| `BITOP op destkey k1 k2` | 位运算（AND/OR/XOR/NOT） | `BITOP AND active users_a users_b` |

::: details Bitmap 场景示例

```bash
# 用户连续签到（offset = 第几天，value = 1已签）
SETBIT sign:user:1001:202503 0 1   # 3月1日签到
SETBIT sign:user:1001:202503 1 1   # 3月2日签到
SETBIT sign:user:1001:202503 3 1   # 3月4日签到（3月3日未签）

# 统计3月签到天数
BITCOUNT sign:user:1001:202503   # 返回 3

# 用户活跃状态（offset = userId，value = 1活跃）
# 存储1亿用户的活跃状态只需 ~12MB
SETBIT daily:active:20250301 1001 1
SETBIT daily:active:20250301 2002 1
BITCOUNT daily:active:20250301   # 当日活跃用户数
```

:::

---

## 七、HyperLogLog

HyperLogLog 是用于基数统计（UV）的概率数据结构，误差率约 0.81%，每个键最多占用 12KB 内存，无论统计多少元素。

| 命令 | 说明 | 示例 |
|------|------|------|
| `PFADD key element [element...]` | 添加元素 | `PFADD uv:page:home "ip:1.1.1.1"` |
| `PFCOUNT key [key...]` | 估算基数 | `PFCOUNT uv:page:home` |
| `PFMERGE destkey k1 k2` | 合并多个 HLL | `PFMERGE uv:total uv:page:home uv:page:about` |

::: details HyperLogLog 场景示例

```bash
# 统计页面UV（只需去重计数，不需要精确值）
PFADD uv:2025-03-01:home "user:1001" "user:1002" "user:1001"
PFCOUNT uv:2025-03-01:home   # 返回 2（去重）

# 合并多天UV
PFMERGE uv:2025-03-week uv:2025-03-01:home uv:2025-03-02:home
PFCOUNT uv:2025-03-week   # 一周去重UV
```

:::

---

## 八、GEO（地理位置）

GEO 基于 Sorted Set 实现，将经纬度编码为 GeoHash 存储，支持地理位置查询和距离计算。

| 命令 | 说明 | 示例 |
|------|------|------|
| `GEOADD key lon lat member` | 添加地理位置 | `GEOADD shops 116.397 39.916 "shop:001"` |
| `GEOPOS key member` | 获取经纬度 | `GEOPOS shops "shop:001"` |
| `GEODIST key m1 m2 [unit]` | 计算两点距离 | `GEODIST shops "shop:001" "shop:002" km` |
| `GEOSEARCH key FROMLONLAT lon lat BYRADIUS r unit` | 范围搜索 | `GEOSEARCH shops FROMLONLAT 116.4 39.9 BYRADIUS 5 km` |

::: details GEO 场景示例

```bash
# 添加门店位置
GEOADD shops \
  116.3972 39.9093 "store:001" \
  116.4074 39.9042 "store:002" \
  116.3882 39.9156 "store:003"

# 查找用户5公里内的门店（按距离升序）
GEOSEARCH shops
  FROMLONLAT 116.4000 39.9100
  BYRADIUS 5 km
  ASC
  COUNT 10
  WITHCOORD WITHDIST

# 计算两门店距离
GEODIST shops "store:001" "store:002" km   # 返回 ~1.08km
```

:::

---

## 九、Stream（流）

Stream 是 Redis 5.0 引入的持久化消息队列，支持消费者组模式，弥补了 List 和 Pub/Sub 在消息持久化和消费确认上的不足。

### 1. 常用命令

| 命令 | 说明 |
|------|------|
| `XADD key * field value` | 追加消息（* 表示自动生成ID） |
| `XREAD COUNT n STREAMS key id` | 从指定ID读取消息 |
| `XRANGE key start end` | 按ID范围获取消息 |
| `XLEN key` | 获取消息数量 |
| `XGROUP CREATE key group id` | 创建消费者组 |
| `XREADGROUP GROUP g consumer STREAMS key >` | 消费者组读取（> 表示未分配的新消息） |
| `XACK key group id` | 确认消息已处理 |
| `XPENDING key group` | 查看待确认消息 |

::: details Stream 消费者组示例

```bash
# 创建 Stream 并发送消息
XADD orders:stream * orderId 20250301001 amount 299 userId 1001
XADD orders:stream * orderId 20250301002 amount 599 userId 1002

# 创建消费者组（从头开始消费）
XGROUP CREATE orders:stream order-group 0

# 消费者1 读取2条未分配消息
XREADGROUP GROUP order-group consumer-1 COUNT 2 STREAMS orders:stream >
# 返回：消息ID + 消息内容

# 确认消费完成（ACK 后消息从 PEL 移除）
XACK orders:stream order-group 1709258400000-0

# 查看待确认消息（重启后可重新消费未ACK的消息）
XPENDING orders:stream order-group - + 10
```

:::

| 特性 | List | Pub/Sub | Stream |
|------|------|---------|--------|
| 消息持久化 | 是 | 否 | 是 |
| 消息确认 | 否 | 否 | 是 |
| 消费者组 | 否 | 否 | 是 |
| 历史消息回溯 | 否 | 否 | 是 |
| 适用场景 | 简单队列 | 实时广播 | 可靠消息队列 |
