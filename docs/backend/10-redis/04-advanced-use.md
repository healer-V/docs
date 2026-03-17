---
title: "Redis 进阶应用场景"
category: "后端 · Redis"
tags:
  - Redis
  - 缓存
  - 分布式锁
  - 消息队列
date: 2026-03-17
excerpt: "深入介绍 Redis 在实际业务中的进阶应用，涵盖缓存三大问题解决方案、布隆过滤器、分布式锁实现、Lua 脚本原子操作、发布订阅、排行榜、限流算法以及 MULTI/EXEC 事务等核心场景。"
---

# Redis 进阶应用场景

## 一、缓存设计与三大问题

### 1. 缓存穿透

**问题**：查询一个数据库中**不存在**的 key，每次都穿透缓存直接打到数据库，大量并发请求可能压垮数据库。

**解决方案**：

| 方案 | 说明 | 适用场景 |
|------|------|----------|
| 缓存空值 | 查询结果为空时也缓存（设置短 TTL，如 60s） | 恶意请求少，数据偶尔为空 |
| 布隆过滤器 | 请求进来先判断 key 是否存在，不存在直接拒绝 | 大量不存在 key 的恶意请求 |
| 参数校验 | 在接口层对参数合法性做校验，非法参数直接拒绝 | 防第一道防线 |

::: details 缓存空值解决穿透示例

```java
// UserService.java
public User getUserById(long userId) {
    String cacheKey = "user:" + userId;

    // 1. 从缓存读取
    String cached = redis.get(cacheKey);
    if (cached != null) {
        // 命中空值缓存（防穿透）
        if ("NULL".equals(cached)) return null;
        return JSON.parseObject(cached, User.class);
    }

    // 2. 查数据库
    User user = userMapper.selectById(userId);

    // 3. 写缓存（空值缓存60秒，正常数据缓存1小时）
    if (user == null) {
        redis.setex(cacheKey, 60, "NULL");
    } else {
        redis.setex(cacheKey, 3600, JSON.toJSONString(user));
    }
    return user;
}
```

:::

### 2. 缓存击穿

**问题**：某个**热点 key** 恰好在过期瞬间，大量并发请求同时穿透缓存，全部打到数据库。

**解决方案**：

| 方案 | 说明 | 适用场景 |
|------|------|----------|
| 互斥锁（Mutex Lock） | 缓存失效时只允许一个请求重建缓存，其他请求等待或重试 | 强一致性要求 |
| 逻辑过期（不设 TTL） | 缓存永不过期，在值中存储过期时间，过期时异步更新 | 极端高并发热点 |
| 热点数据永不过期 | 重要配置/商品等数据不设 TTL，通过主动刷新更新 | 数据更新频率低 |

::: details 互斥锁防止缓存击穿

```java
// ArticleService.java
private static final String LOCK_PREFIX = "lock:article:";

public Article getArticle(long articleId) {
    String cacheKey = "article:" + articleId;

    // 1. 优先读缓存
    String cached = redis.get(cacheKey);
    if (cached != null) {
        return JSON.parseObject(cached, Article.class);
    }

    // 2. 缓存未命中，尝试获取互斥锁（SET NX EX，30秒自动释放）
    String lockKey = LOCK_PREFIX + articleId;
    boolean locked = "OK".equals(redis.set(lockKey, "1", "NX", "EX", 30));

    if (locked) {
        try {
            // 3. 获取锁成功：查数据库重建缓存
            Article article = articleMapper.selectById(articleId);
            redis.setex(cacheKey, 3600, JSON.toJSONString(article));
            return article;
        } finally {
            // 4. 释放锁
            redis.del(lockKey);
        }
    } else {
        // 5. 未获取锁：短暂等待后重试（自旋）
        Thread.sleep(50);
        return getArticle(articleId);   // 递归重试
    }
}
```

:::

### 3. 缓存雪崩

**问题**：大量 key 在**同一时间**集中过期，或 Redis 服务宕机，导致大量请求同时打到数据库，造成数据库压力骤增甚至宕机。

**解决方案**：

| 方案 | 说明 |
|------|------|
| TTL 随机化 | 过期时间加随机偏移（如基础TTL + 随机0~300秒），避免集中过期 |
| 多级缓存 | 本地缓存（Caffeine/Guava）+ Redis，Redis 宕机时本地缓存兜底 |
| 限流熔断 | 数据库压力过大时触发熔断，返回降级数据（如空列表、提示信息） |
| Redis 高可用 | 哨兵模式或 Cluster，避免单点故障 |
| 预热缓存 | 系统启动时将热点数据提前加载到 Redis |

::: details TTL 随机化示例

```java
// 基础过期时间 1 小时，加 0~5 分钟随机偏移
int baseTtl  = 3600;
int randomTtl = new Random().nextInt(300);   // 0~299秒
redis.setex(cacheKey, baseTtl + randomTtl, value);
```

:::

---

## 二、布隆过滤器

布隆过滤器（Bloom Filter）是一种概率型数据结构，用于判断某个元素是否**可能存在**于集合中，存在一定的误判率（False Positive），但**绝不会误判不存在**的元素为存在。

**特点**：占用内存极少（存储 1 亿个元素约需 125MB），查询时间复杂度 O(k)（k 为哈希函数数量）。

### 1. Redis 布隆过滤器

推荐使用 **RedisBloom** 模块（Redis Stack 已内置）：

::: details RedisBloom 使用示例

```bash
# 创建布隆过滤器（容量100万，误判率0.1%）
BF.RESERVE user:bloom 0.001 1000000

# 批量添加元素（数据库中存在的用户ID）
BF.MADD user:bloom "1001" "1002" "1003" "10000"

# 判断元素是否存在
BF.EXISTS user:bloom "1001"    # 1（存在）
BF.EXISTS user:bloom "9999"    # 0（不存在，一定不在数据库中）
BF.EXISTS user:bloom "5000"    # 可能返回1（误判），但概率仅0.1%
```

```java
// Java 中使用 Redisson 操作布隆过滤器
RBloomFilter<Long> bloomFilter = redisson.getBloomFilter("user:bloom");
// 初始化：预计100万元素，误判率0.1%
bloomFilter.tryInit(1_000_000L, 0.001);

// 新用户注册时加入布隆过滤器
bloomFilter.add(userId);

// 查询前先判断
if (!bloomFilter.contains(userId)) {
    return null;   // 一定不存在，直接返回
}
// 可能存在，去缓存或数据库查
```

:::

---

## 三、分布式锁

### 1. SET NX EX 实现

利用 Redis 的原子操作 `SET key value NX EX seconds` 实现分布式锁。

::: details SET NX EX 分布式锁完整实现

```java
// RedisLock.java
@Component
public class RedisDistributedLock {

    @Autowired
    private StringRedisTemplate redisTemplate;

    /**
     * 尝试获取锁
     * @param lockKey   锁的key
     * @param requestId 锁的持有者标识（防止误删他人的锁）
     * @param expireSeconds 锁的过期时间
     */
    public boolean tryLock(String lockKey, String requestId, int expireSeconds) {
        Boolean result = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, requestId, Duration.ofSeconds(expireSeconds));
        return Boolean.TRUE.equals(result);
    }

    /**
     * 释放锁（Lua 脚本保证原子性：判断 + 删除）
     */
    public boolean releaseLock(String lockKey, String requestId) {
        String luaScript =
            "if redis.call('GET', KEYS[1]) == ARGV[1] then " +
            "    return redis.call('DEL', KEYS[1]) " +
            "else " +
            "    return 0 " +
            "end";
        Long result = redisTemplate.execute(
            new DefaultRedisScript<>(luaScript, Long.class),
            Collections.singletonList(lockKey),
            requestId
        );
        return Long.valueOf(1L).equals(result);
    }
}

// 使用示例
String lockKey   = "lock:order:" + orderId;
String requestId = UUID.randomUUID().toString();   // 唯一标识，防止误删
boolean locked   = redisLock.tryLock(lockKey, requestId, 30);

if (!locked) {
    throw new BusinessException("系统繁忙，请稍后重试");
}
try {
    // 执行业务逻辑
    processOrder(orderId);
} finally {
    redisLock.releaseLock(lockKey, requestId);
}
```

:::

::: warning SET NX EX 的局限
- 锁超时但业务未完成时，锁自动释放，可能导致多个节点同时持锁。解决方案：**看门狗机制**（如 Redisson 自动续期）。
- Redis 主库宕机后从库提升，新主库上锁已丢失，可能导致重复获锁。高可靠场景需用 **Redlock 算法**。
:::

### 2. Redlock 算法

Redlock 是 Redis 官方推荐的多节点分布式锁方案，通过向奇数个（如 5 个）独立 Redis 实例加锁，获得半数以上实例的锁才算加锁成功，解决单点故障问题。

::: details Redlock 核心逻辑（伪代码）

```python
# N = 5 个独立 Redis 实例，quorum = 3
lock_value  = uuid()
lock_key    = "lock:resource"
expire_ms   = 30000  # 30秒

start_time = now()
acquired_count = 0

for redis_instance in redis_instances:
    try:
        ok = redis_instance.set(lock_key, lock_value, nx=True, px=expire_ms)
        if ok:
            acquired_count += 1
    except:
        pass  # 忽略单个节点失败

elapsed_ms    = now() - start_time
validity_time = expire_ms - elapsed_ms - clock_drift

if acquired_count >= quorum and validity_time > 0:
    # 加锁成功，锁的有效期为 validity_time
    execute_business_logic()
    # 释放：向所有节点发送 DEL（Lua 脚本判断 value 一致）
    release_all(redis_instances, lock_key, lock_value)
else:
    # 加锁失败：释放已获取的锁
    release_all(redis_instances, lock_key, lock_value)
```

:::

::: tip Redlock 争议
Redlock 在分布式系统中存在争议（Martin Kleppmann 指出其在时钟漂移等极端情况下存在安全隐患）。对于对数据一致性要求极高的业务，建议使用 **ZooKeeper** 或 **etcd** 实现分布式锁，Redis 锁更适合对一致性要求稍低、性能要求高的场景。
:::

---

## 四、Lua 脚本原子操作

Redis 执行 Lua 脚本是原子的（执行期间不会被其他命令打断），适合需要多个 Redis 操作组合成一个原子操作的场景。

::: details Lua 脚本常用示例

```lua
-- 1. 限流脚本：每分钟最多 N 次（滑动窗口计数器）
-- KEYS[1] = 限流 key，ARGV[1] = 限制次数，ARGV[2] = 窗口秒数
local key     = KEYS[1]
local limit   = tonumber(ARGV[1])
local window  = tonumber(ARGV[2])
local current = redis.call('INCR', key)
if current == 1 then
    redis.call('EXPIRE', key, window)
end
if current > limit then
    return 0   -- 超限
else
    return 1   -- 放行
end
```

```lua
-- 2. 库存扣减脚本（原子判断+扣减，防止超卖）
-- KEYS[1] = 库存 key，ARGV[1] = 扣减数量
local stock = tonumber(redis.call('GET', KEYS[1]))
if stock == nil or stock < tonumber(ARGV[1]) then
    return -1   -- 库存不足
end
return redis.call('DECRBY', KEYS[1], ARGV[1])
```

```java
// Java 调用 Lua 脚本（Spring Data Redis）
String luaScript = "...";   // 上方 Lua 代码
DefaultRedisScript<Long> script = new DefaultRedisScript<>(luaScript, Long.class);
Long result = redisTemplate.execute(
    script,
    Collections.singletonList("ratelimit:api:1001"),  // KEYS
    "100", "60"                                         // ARGV
);
```

:::

---

## 五、发布订阅模式

Redis Pub/Sub 支持消息的发布和订阅，适合实时广播场景（如聊天室、实时推送）。

::: details 发布订阅示例

```bash
# 订阅者（客户端A）
SUBSCRIBE channel:notifications
PSUBSCRIBE order:*    # 模式订阅（订阅所有 order: 开头的频道）

# 发布者（客户端B）
PUBLISH channel:notifications '{"type":"alert","msg":"系统维护通知"}'
PUBLISH order:paid '{"orderId":"20250301001"}'
```

:::

::: warning Pub/Sub 的局限
- 消息**不持久化**：订阅者离线期间的消息会丢失。
- **无法确认消费**：不知道消息是否被处理。
- 适合实时性要求高、允许丢消息的场景（如在线状态广播、配置变更通知）。
- 需要可靠消息队列时，使用 **Redis Stream** 或 **Kafka/RabbitMQ**。
:::

---

## 六、常见业务场景实现

### 1. 排行榜

::: details 排行榜完整实现

```bash
# 游戏积分排行榜（Sorted Set）
# 更新分数
ZINCRBY game:rank:global 500 "user:1001"

# 获取 TOP10（倒序）
ZREVRANGE game:rank:global 0 9 WITHSCORES

# 获取用户排名（0-based）
ZREVRANK game:rank:global "user:1001"

# 获取用户积分
ZSCORE game:rank:global "user:1001"

# 周榜：用日期命名，定期清除
ZINCRBY game:rank:2025-W12 200 "user:1001"
EXPIRE game:rank:2025-W12 604800   # 7天后过期
```

:::

### 2. 计数器

::: details 计数器实现

```bash
# 文章浏览量
INCR pv:article:2001
INCRBY pv:article:2001 10   # 批量累加（定时从本地计数器同步）

# 点赞数
INCR like:article:2001
DECR like:article:2001   # 取消点赞

# 查看当前值
GET pv:article:2001
```

:::

### 3. 会话存储

::: details Session 存储实现

```java
// SessionService.java
public String createSession(long userId, Map<String, Object> userInfo) {
    String sessionId = UUID.randomUUID().toString().replace("-", "");
    String sessionKey = "session:" + sessionId;

    // 使用 Hash 存储 Session 数据（字段级别更新）
    Map<String, String> sessionData = new HashMap<>();
    sessionData.put("userId",   String.valueOf(userId));
    sessionData.put("username", (String) userInfo.get("username"));
    sessionData.put("role",     (String) userInfo.get("role"));
    sessionData.put("loginAt",  String.valueOf(System.currentTimeMillis()));

    redisTemplate.opsForHash().putAll(sessionKey, sessionData);
    redisTemplate.expire(sessionKey, Duration.ofHours(2));   // 2小时有效

    return sessionId;
}

public Map<Object, Object> getSession(String sessionId) {
    String sessionKey = "session:" + sessionId;
    Map<Object, Object> session = redisTemplate.opsForHash().entries(sessionKey);
    if (!session.isEmpty()) {
        // 续期（滑动过期）
        redisTemplate.expire(sessionKey, Duration.ofHours(2));
    }
    return session;
}
```

:::

### 4. 限流（令牌桶与漏桶）

::: details 令牌桶限流实现（Lua 脚本）

```lua
-- token_bucket.lua
-- KEYS[1] = 令牌桶 key
-- ARGV[1] = 令牌生成速率（每秒）
-- ARGV[2] = 令牌桶容量
-- ARGV[3] = 请求消耗令牌数
-- ARGV[4] = 当前时间戳（秒）

local key      = KEYS[1]
local rate     = tonumber(ARGV[1])   -- 每秒生成令牌数
local capacity = tonumber(ARGV[2])   -- 桶容量
local consume  = tonumber(ARGV[3])   -- 本次消耗
local now      = tonumber(ARGV[4])   -- 当前时间

local bucket   = redis.call('HMGET', key, 'tokens', 'last_time')
local tokens   = tonumber(bucket[1]) or capacity
local lastTime = tonumber(bucket[2]) or now

-- 根据时间差补充令牌
local elapsed  = math.max(0, now - lastTime)
tokens = math.min(capacity, tokens + elapsed * rate)

if tokens >= consume then
    tokens = tokens - consume
    redis.call('HMSET', key, 'tokens', tokens, 'last_time', now)
    redis.call('EXPIRE', key, math.ceil(capacity / rate) + 1)
    return 1   -- 允许通过
else
    redis.call('HMSET', key, 'tokens', tokens, 'last_time', now)
    return 0   -- 拒绝
end
```

```bash
# 漏桶限流（简单计数器版）：每秒最多 100 个请求
SET ratelimit:api:user:1001 0 EX 1 NX   # 每秒重置
INCR ratelimit:api:user:1001            # 每次请求+1
# 客户端判断：如果值 > 100，返回 429 Too Many Requests
```

:::

---

## 七、Redis 事务

Redis 事务通过 `MULTI/EXEC` 实现命令的批量执行，所有命令在 EXEC 时一次性顺序执行。

::: details Redis 事务示例

```bash
# 基本事务
MULTI
SET user:1001:balance 1000
INCR order:count
SET order:20250301001 '{"userId":1001}'
EXEC
# 返回每条命令的执行结果

# DISCARD 放弃事务
MULTI
SET key1 "value1"
DISCARD   # 取消事务，队列中的命令不会执行
```

:::

### 1. WATCH 乐观锁

`WATCH` 监视一个或多个 key，若在 EXEC 之前这些 key 被其他客户端修改，则整个事务取消（EXEC 返回 nil）。

::: details WATCH 乐观锁示例

```bash
# 转账：从 user:1001 转 100 元到 user:1002
WATCH balance:user:1001

# 读取余额
balance = GET balance:user:1001   # 假设为 500

MULTI
# 如果在 MULTI 和 EXEC 之间 balance:user:1001 被其他客户端修改
# EXEC 会返回 nil，事务取消，需要重新执行
DECRBY balance:user:1001 100
INCRBY balance:user:1002 100
EXEC   # 成功返回 [OK, OK]，失败返回 nil
```

:::

::: warning Redis 事务 vs 数据库事务
Redis 事务与数据库事务有本质区别：
- **没有回滚**：EXEC 执行期间某条命令失败（如类型错误），其他命令仍会正常执行。
- **原子性有限**：保证命令顺序执行不被打断，但不保证全部成功或全部失败的原子性。
- 需要真正的原子操作，使用 **Lua 脚本**更可靠。
:::
