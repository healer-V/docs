---
title: "Node.js 数据库操作"
category: "后端 · Node.js"
tags:
  - Node.js
  - MySQL
  - MongoDB
  - Redis
excerpt: "Node.js 可通过各类驱动连接主流数据库，包括关系型数据库 MySQL/PostgreSQL、NoSQL 数据库 MongoDB 以及缓存数据库 Redis，掌握连接池和事务管理是构建稳健数据层的关键。"
date: 2024-01-22
---

# Node.js 数据库操作

## 一、MySQL 操作

`mysql2` 是 Node.js 最常用的 MySQL 驱动，支持 Promise API 和连接池，性能优于旧版 `mysql` 包。

### 1. 安装与连接

生产环境应使用连接池（`createPool`）而非单个连接，连接池可自动复用空闲连接，避免频繁建立/断开的开销。

::: details 基础连接
```bash
npm install mysql2
```

```js
// src/config/database.js
import mysql from 'mysql2/promise'

// 创建连接池（推荐，复用连接）
const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'password',
  database: 'myapp',
  waitForConnections: true,
  connectionLimit: 10,    // 最大连接数
  queueLimit: 0,          // 等待队列上限（0 = 无限制）
})

// 测试连接
const connection = await pool.getConnection()
console.log('数据库连接成功')
connection.release()  // 用完归还连接池
```
:::

### 2. 基本 CRUD

使用 `?` 占位符传递参数可防止 SQL 注入，`execute` 会对语句进行预编译，适合高频执行的查询；`query` 则每次重新解析，适合一次性查询。

::: details 增删改查
```js
// src/services/user-service.js
// 查询
async function getUsers(page = 1, pageSize = 10) {
  const offset = (page - 1) * pageSize
  // 使用占位符防止 SQL 注入
  const [rows] = await pool.query(
    'SELECT id, name, email FROM users WHERE deleted_at IS NULL LIMIT ? OFFSET ?',
    [pageSize, offset]
  )
  return rows
}

// 插入
async function createUser(name, email, password) {
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, NOW())',
    [name, email, password]
  )
  return result.insertId
}

// 更新
async function updateUser(id, data) {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ')
  const values = [...Object.values(data), id]

  const [result] = await pool.execute(
    `UPDATE users SET ${fields}, updated_at = NOW() WHERE id = ?`,
    values
  )
  return result.affectedRows
}

// 删除（软删除）
async function deleteUser(id) {
  const [result] = await pool.execute(
    'UPDATE users SET deleted_at = NOW() WHERE id = ?',
    [id]
  )
  return result.affectedRows > 0
}
```
:::

### 3. 事务

事务将多个操作绑定为原子单元，要么全部成功，要么全部回滚。以转账为例，扣款和收款必须同时成功才能提交。

::: details 事务管理
```js
// src/services/account-service.js
async function transferMoney(fromId, toId, amount) {
  const conn = await pool.getConnection()

  try {
    await conn.beginTransaction()

    // 检查余额
    const [[sender]] = await conn.execute(
      'SELECT balance FROM accounts WHERE id = ? FOR UPDATE',
      [fromId]
    )

    if (sender.balance < amount) {
      throw new Error('余额不足')
    }

    // 扣款
    await conn.execute(
      'UPDATE accounts SET balance = balance - ? WHERE id = ?',
      [amount, fromId]
    )

    // 收款
    await conn.execute(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [amount, toId]
    )

    // 记录流水
    await conn.execute(
      'INSERT INTO transactions (from_id, to_id, amount, created_at) VALUES (?, ?, ?, NOW())',
      [fromId, toId, amount]
    )

    await conn.commit()
    return { success: true }
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}
```
:::

## 二、MongoDB 操作

MongoDB 是文档型数据库，数据以 BSON 格式存储。Node.js 官方驱动 `mongodb` 提供完整的 CRUD 和聚合能力，适合存储结构灵活的数据。

### 1. 连接数据库

连接 MongoDB 时同样推荐使用连接池（`maxPoolSize`），并在进程退出时主动关闭连接，避免资源泄漏。

::: details MongoDB 连接
```bash
npm install mongodb
```

```js
// src/config/mongodb.js
import { MongoClient, ObjectId } from 'mongodb'

const client = new MongoClient('mongodb://localhost:27017', {
  maxPoolSize: 10,
})

await client.connect()
const db = client.db('myapp')
console.log('MongoDB 连接成功')

// 获取集合引用
const usersCollection = db.collection('users')
const postsCollection = db.collection('posts')

// 进程退出时关闭连接
process.on('SIGTERM', async () => {
  await client.close()
})
```
:::

### 2. 基本操作

MongoDB 使用 `_id`（ObjectId）作为文档唯一标识，查询时需用 `new ObjectId(id)` 转换字符串。条件查询支持 `$exists`、`$gt`、`$in` 等丰富的操作符。

::: details MongoDB CRUD
```js
// 插入文档
const result = await usersCollection.insertOne({
  name: 'Alice',
  email: 'alice@example.com',
  role: 'user',
  createdAt: new Date(),
})
console.log('插入 ID:', result.insertedId)

// 批量插入
await usersCollection.insertMany([
  { name: 'Bob', email: 'bob@example.com' },
  { name: 'Carol', email: 'carol@example.com' },
])

// 查询
const user = await usersCollection.findOne({ email: 'alice@example.com' })

// 条件查询（分页）
const users = await usersCollection
  .find({ role: 'user', deletedAt: { $exists: false } })
  .sort({ createdAt: -1 })
  .skip(0)
  .limit(10)
  .toArray()

// 更新
await usersCollection.updateOne(
  { _id: new ObjectId(userId) },
  { $set: { name: 'Alice Smith', updatedAt: new Date() } }
)

// 删除
await usersCollection.deleteOne({ _id: new ObjectId(userId) })
```
:::

### 3. 聚合管道

聚合管道（Aggregation Pipeline）由多个阶段组成，数据依次经过每个阶段的处理，常用于统计、分组、关联查询等复杂场景。

::: details 聚合统计
```js
// 统计每个分类的文章数量和平均阅读量
const stats = await postsCollection.aggregate([
  // 过滤已发布的文章
  { $match: { status: 'published' } },
  // 按分类分组
  {
    $group: {
      _id: '$category',
      count: { $sum: 1 },
      avgViews: { $avg: '$views' },
      totalViews: { $sum: '$views' },
    },
  },
  // 按文章数量降序
  { $sort: { count: -1 } },
  // 关联分类信息
  {
    $lookup: {
      from: 'categories',
      localField: '_id',
      foreignField: '_id',
      as: 'categoryInfo',
    },
  },
]).toArray()
```
:::

## 三、Redis 操作

Redis 是内存数据库，常用于缓存、会话存储、消息队列等场景。`ioredis` 是 Node.js 中功能最完善的 Redis 客户端，支持集群、哨兵和 Lua 脚本。

### 1. 连接与基本操作

Redis 支持字符串、哈希、列表、集合、有序集合五种基本数据结构，每种结构对应不同的使用场景。

::: details Redis 基础
```bash
npm install ioredis
```

```js
// src/config/redis.js
import Redis from 'ioredis'

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'password',
  db: 0,
  maxRetriesPerRequest: 3,
})

redis.on('connect', () => console.log('Redis 已连接'))
redis.on('error', (err) => console.error('Redis 错误:', err))

// 字符串操作
await redis.set('key', 'value')
await redis.set('key', 'value', 'EX', 3600)  // 1小时过期
const value = await redis.get('key')

// 哈希
await redis.hset('user:1', {
  name: 'Alice',
  email: 'alice@example.com',
  age: 25,
})
const user = await redis.hgetall('user:1')

// 列表
await redis.rpush('queue', 'task1', 'task2')
const task = await redis.lpop('queue')

// 集合
await redis.sadd('online-users', 'user:1', 'user:2')
const online = await redis.smembers('online-users')
const count = await redis.scard('online-users')
```
:::

### 2. 缓存模式

Cache-Aside（旁路缓存）是最常见的缓存策略：读时先查缓存，未命中再查数据库并回填；写时直接更新数据库，同时删除缓存让其自然失效。

::: details Cache-Aside 模式
```js
// src/cache/user-cache.js
class UserCache {
  #redis
  #db
  #TTL = 3600  // 1 小时

  constructor(redis, db) {
    this.#redis = redis
    this.#db = db
  }

  async getUser(id) {
    const cacheKey = `user:${id}`

    // 1. 先查缓存
    const cached = await this.#redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    // 2. 缓存未命中，查数据库
    const [rows] = await this.#db.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    )

    if (!rows.length) return null

    const user = rows[0]

    // 3. 写入缓存
    await this.#redis.set(cacheKey, JSON.stringify(user), 'EX', this.#TTL)

    return user
  }

  async invalidateUser(id) {
    await this.#redis.del(`user:${id}`)
  }
}
```
:::

### 3. 分布式锁

多个进程/节点竞争同一资源时（如防止重复下单），需要分布式锁保证互斥。使用 Redis `SET NX EX` 命令实现原子加锁，Lua 脚本保证释放锁的原子性。

::: details 防并发操作
```js
// src/utils/distributed-lock.js
class DistributedLock {
  #redis

  constructor(redis) {
    this.#redis = redis
  }

  async acquire(key, ttl = 10) {
    const lockKey = `lock:${key}`
    const lockValue = `${process.pid}-${Date.now()}`

    // SET NX EX：仅当 key 不存在时设置，原子操作
    const acquired = await this.#redis.set(lockKey, lockValue, 'NX', 'EX', ttl)
    return acquired ? lockValue : null
  }

  async release(key, lockValue) {
    const lockKey = `lock:${key}`

    // Lua 脚本确保原子性：只有持有锁的才能释放
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `
    return this.#redis.eval(script, 1, lockKey, lockValue)
  }

  async withLock(key, fn, ttl = 10) {
    const lockValue = await this.acquire(key, ttl)
    if (!lockValue) throw new Error(`获取锁失败: ${key}`)

    try {
      return await fn()
    } finally {
      await this.release(key, lockValue)
    }
  }
}

// 使用
const lock = new DistributedLock(redis)

await lock.withLock('order:create', async () => {
  // 只有获得锁的进程才能执行这段代码
  await createOrder(userId, items)
})
```
:::

## 四、ORM 工具

ORM（对象关系映射）将数据库操作抽象为对象方法调用，提供类型安全和自动迁移能力，适合中大型项目减少重复 SQL 的编写。

### 1. Prisma（推荐）

Prisma 是目前 Node.js 生态中类型安全最好的 ORM，通过 Schema 文件定义数据模型，自动生成类型化的查询客户端，支持 MySQL、PostgreSQL、SQLite 等主流数据库。

::: details Prisma 基础用法
```bash
npm install prisma @prisma/client
npx prisma init
```

```prisma
// prisma/schema.prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        Int    @id @default(autoincrement())
  title     String
  content   String?
  authorId  Int
  author    User   @relation(fields: [authorId], references: [id])
}
```

```js
// src/services/user-service.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 查询（自动 JOIN）
const usersWithPosts = await prisma.user.findMany({
  include: { posts: true },
  where: { name: { contains: 'Alice' } },
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: 0,
})

// 事务
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: { email: 'alice@example.com' } })
  const post = await tx.post.create({
    data: { title: '第一篇文章', authorId: user.id },
  })
  return { user, post }
})
```
:::

## 五、最佳实践

1. **使用连接池**：避免每次请求都创建新连接
2. **防 SQL 注入**：始终使用参数化查询或预处理语句
3. **合理使用缓存**：频繁读取、不常变更的数据优先缓存
4. **事务保证一致性**：涉及多个写操作时使用事务
5. **数据库索引**：为查询条件字段（WHERE、ORDER BY）建立索引

> [!warning]
> 生产环境的数据库密码必须使用环境变量注入，绝对不能硬编码在代码中。使用 `.env` 文件配合 `dotenv` 管理敏感配置。
