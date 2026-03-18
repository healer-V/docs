---
title: "Node.js 项目实战"
category: "后端 · Node.js"
tags:
  - Node.js
  - 项目结构
  - 最佳实践
excerpt: "从项目结构设计、环境配置、日志管理到错误处理和安全防护，本文介绍构建生产级 Node.js 应用的最佳实践，帮助你构建可维护、可扩展的服务端应用。"
date: 2024-01-24
---

# Node.js 项目实战

本文以搭建一个企业级 RESTful API 服务为主线，逐步介绍项目结构设计、环境配置、日志、错误处理、安全防护和测试等生产实践。

## 一、项目结构

### 1. 推荐目录结构

清晰的目录结构是可维护项目的基础。按职责分层（路由→控制器→服务→数据），每层只关心自己的职责，使代码易于理解和修改。

```
my-app/
├── src/
│   ├── config/          # 配置：数据库连接、Redis、第三方服务初始化
│   ├── controllers/     # 控制器：解析请求参数，调用 Service，返回 HTTP 响应
│   ├── services/        # 服务层：核心业务逻辑，不依赖 HTTP 细节
│   ├── models/          # 数据模型：ORM Schema 定义
│   ├── middlewares/     # Express 中间件：认证、日志、限流等横切关注点
│   ├── routes/          # 路由：URL 与 Controller 方法的映射
│   ├── utils/           # 工具：通用函数，不含业务逻辑
│   └── app.js           # 应用组装（不含 listen）
├── tests/
│   ├── unit/            # 单元测试：测试 Service 层逻辑
│   └── integration/     # 集成测试：测试完整 API 流程
├── logs/                # 日志文件（加�� .gitignore，不提交）
├── .env                 # 环境变量（加入 .gitignore，不提交）
├── .env.example         # 环境变量示例（提交 Git，作为配置模板）
├── package.json
└── index.js             # 启动入口（仅含 server.listen）
```

### 2. 分层架构实现

分层架构的核心原则：每层只与相邻层通信，Controller 层不直接操作数据库，Service 层不知道 HTTP 的存在。这样 Service 的逻辑可以被 HTTP 接口、CLI 命令、定时任务等多种调用方复用。

::: details 三层架构代码示例
```js
// src/routes/users.js — 路由层：只负责 URL 映射和中间件挂载
import express from 'express'
import { UserController } from '../controllers/userController.js'
import { authenticate } from '../middlewares/auth.js'
import { validateBody } from '../middlewares/validate.js'
import { createUserSchema } from '../schemas/user.js'

const router = express.Router()

router.get('/',          UserController.list)
router.get('/:id',       UserController.getOne)
router.post('/',    authenticate, validateBody(createUserSchema), UserController.create)
router.put('/:id',  authenticate, UserController.update)
router.delete('/:id', authenticate, UserController.remove)

export default router
```

```js
// src/controllers/userController.js — 控制器层：处理 HTTP 请求/响应细节
import { UserService } from '../services/userService.js'
import { errors } from '../utils/AppError.js'

export const UserController = {
  async list(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query
      const result = await UserService.getList({
        page: Math.max(1, parseInt(page)),
        limit: Math.min(100, parseInt(limit)),  // 限制最大每页条数
      })
      res.json({ success: true, data: result })
    } catch (err) {
      next(err)  // 所有错误交给统一错误处理中间件
    }
  },

  async getOne(req, res, next) {
    try {
      const user = await UserService.getById(req.params.id)
      if (!user) return next(errors.notFound('用户'))
      res.json({ success: true, data: user })
    } catch (err) {
      next(err)
    }
  },

  async create(req, res, next) {
    try {
      const user = await UserService.create(req.body)
      res.status(201).json({ success: true, data: user })
    } catch (err) {
      next(err)
    }
  },
}
```

```js
// src/services/userService.js — 服务层：核心业务逻辑
import { db } from '../config/database.js'
import { redis } from '../config/redis.js'
import bcrypt from 'bcrypt'

export const UserService = {
  async getList({ page, limit }) {
    const offset = (page - 1) * limit

    // 并发查询数据和总数，减少等待时间
    const [rows, [{ total }]] = await Promise.all([
      db.query(
        'SELECT id, name, email, created_at FROM users WHERE deleted_at IS NULL LIMIT ? OFFSET ?',
        [limit, offset]
      ),
      db.query('SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL'),
    ])

    return {
      items: rows,
      total: parseInt(total),
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  },

  async getById(id) {
    const cacheKey = `user:${id}`

    // 先查 Redis 缓存
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    // 缓存未命中，查数据库
    const [rows] = await db.query('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL', [id])
    if (!rows.length) return null

    // 回填缓存，1 小时过期
    await redis.set(cacheKey, JSON.stringify(rows[0]), 'EX', 3600)
    return rows[0]
  },

  async create({ name, email, password }) {
    // 业务规则检查：邮箱唯一
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email])
    if (existing.length) {
      throw Object.assign(new Error('该邮箱已被注册'), { statusCode: 409, code: 'EMAIL_TAKEN' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, NOW())',
      [name, email, passwordHash]
    )

    return { id: result.insertId, name, email }
  },
}
```
:::

## 二、环境配置管理

### 1. 使用 dotenv 管理配置

环境变量是将配置与代码分离的标准方式，不同环境（开发、测试、生产）使用不同的 `.env` 文件，而代码本身不变。`.env` 文件不提交到版本控制，`.env.example` 则作为模板提交，新成员克隆仓库后按模板创建自己的 `.env`。

::: details 完整配置管理方案
```bash
npm install dotenv
```

```ini
# .env.example（提交 Git，描述所有需要的配置项）
NODE_ENV=development
PORT=3000

# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_NAME=myapp
DB_USER=root
DB_PASSWORD=

# Redis
REDIS_URL=redis://localhost:6379

# JWT（生产环境必须使用强随机字符串）
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# 跨域
ALLOWED_ORIGINS=http://localhost:5173
```

```js
// src/config/env.js — 统一加载、校验和导出所有配置
import 'dotenv/config'

// 启动时校验必填配置，缺失则立即退出，避免带着错误配置运行
const required = ['DB_HOST', 'DB_PASSWORD', 'JWT_SECRET']
const missing = required.filter(key => !process.env[key])

if (missing.length) {
  console.error('❌ 缺少必要环境变量:', missing.join(', '))
  console.error('请复制 .env.example 为 .env 并填写对应值')
  process.exit(1)
}

// 导出结构化的配置对象，避免代码中散落大量 process.env
export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 3000,
  db: {
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT) || 3306,
    name:     process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret:    process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    origins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  },
}
```
:::

## 三、日志管理

### 1. 使用 winston 配置结构化日志

`console.log` 在生产环境中难以检索和分析。`winston` 支持多级别、多输出目标，配合 `winston-daily-rotate-file` 可以按天滚动日志文件，避免单个日志文件无限增大。

::: details 生产级日志配置
```bash
npm install winston winston-daily-rotate-file
```

```js
// src/config/logger.js
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { config } from './env.js'

const { combine, timestamp, errors, json, colorize, printf } = winston.format

// 开发环境：带颜色的可读格式
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? '\n' + JSON.stringify(meta, null, 2) : ''
    return `${timestamp} [${level}]: ${message}${stack ? '\n' + stack : ''}${metaStr}`
  })
)

// 生产环境：JSON 格式，便于 ELK/Loki 等日志系统解析
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
)

export const logger = winston.createLogger({
  level: config.env === 'production' ? 'info' : 'debug',
  defaultMeta: { service: 'myapp' },  // 所有日志附带服务名
  transports: [
    // 开发环境输出到控制台
    ...(config.env !== 'production'
      ? [new winston.transports.Console({ format: devFormat })]
      : []
    ),

    // 错误日志：保留 30 天
    new DailyRotateFile({
      filename:    'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level:       'error',
      format:      prodFormat,
      maxFiles:    '30d',
      zippedArchive: true,  // 旧日志自动压缩，节省磁盘
    }),

    // 全量日志：保留 7 天
    new DailyRotateFile({
      filename:    'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      format:      prodFormat,
      maxFiles:    '7d',
      zippedArchive: true,
    }),
  ],
})

// 捕获未处理的异常和 Promise 拒绝
logger.exceptions.handle(
  new DailyRotateFile({ filename: 'logs/exceptions-%DATE%.log', maxFiles: '30d' })
)
```
:::

## 四、错误处理

### 1. 统一错误体系

自定义 `AppError` 类区分「业务错误」（预期内，如用户不存在）和「系统错误」（非预期，如数据库连接断开）。业务错误直接向用户展示，系统错误只显示通用提示并记录完整错误信息到日志。

::: details 完整错误处理方案
```js
// src/utils/AppError.js — 自定义业务错误类

/**
 * isOperational = true：预期内的业务错误，可以安全地将 message 展示给用户
 * isOperational = false（或系统 Error）：非预期错误，只记录日志，向用户展示通用提示
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
  }
}

// 常用业务错误工厂函数，保持错误创建方式统一
export const errors = {
  notFound:     (resource = '资源') => new AppError(`${resource}不存在`, 404, 'NOT_FOUND'),
  unauthorized: (msg = '请先登录')  => new AppError(msg, 401, 'UNAUTHORIZED'),
  forbidden:    (msg = '无权限执行此操作') => new AppError(msg, 403, 'FORBIDDEN'),
  badRequest:   (msg)               => new AppError(msg, 400, 'BAD_REQUEST'),
  conflict:     (msg)               => new AppError(msg, 409, 'CONFLICT'),
}
```

```js
// src/middlewares/errorHandler.js — 统一错误响应中间件
import { AppError } from '../utils/AppError.js'
import { logger } from '../config/logger.js'

export function errorHandler(err, req, res, next) {
  // 系统错误（非预期）：记录完整错误信息
  if (!err.isOperational) {
    logger.error('系统错误', {
      error:   err.message,
      stack:   err.stack,
      url:     req.originalUrl,
      method:  req.method,
      body:    req.body,
      userId:  req.user?.id,
    })
  }

  const statusCode = err.statusCode || 500

  res.status(statusCode).json({
    success: false,
    error: {
      code:    err.code || 'INTERNAL_ERROR',
      // 5xx 错误不暴露内部信息给用户
      message: statusCode < 500 ? err.message : '服务器内部错误，请稍后重试',
      // 开发环境附带堆栈，方便调试
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  })
}
```

```js
// src/app.js — 挂载错误���理中间件（必须在所有路由后面）
import express from 'express'
import { errorHandler } from './middlewares/errorHandler.js'
import userRoutes from './routes/users.js'

const app = express()

app.use(express.json())
app.use('/api/users', userRoutes)

// 404 处理：所有未匹配路由
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '接口不存在' } })
})

// 错误处理中间件：必须有四个参数
app.use(errorHandler)

export default app
```
:::

### 2. 全局未处理异常

进程级别的错误兜底处理，防止未处理的 `Promise rejection` 或同步异常导致进程无声崩溃。

::: details 进程级异常兜底
```js
// index.js
import { logger } from './src/config/logger.js'

// Node.js 15+ 未处理的 Promise rejection 会直接崩溃进程
// 显式处理可以在崩溃前记录日志
process.on('unhandledRejection', (reason) => {
  logger.error('未处理的 Promise rejection', {
    reason: reason?.message || reason,
    stack:  reason?.stack,
  })
  // 允许 PM2 捕获并重启进程
  process.exit(1)
})

// 同步代码中未捕获的异常
process.on('uncaughtException', (err) => {
  logger.error('未捕获的异常', {
    error: err.message,
    stack: err.stack,
  })
  process.exit(1)
})
```
:::

## 五、安全防护

### 1. 基础安全配置

每个 Express 项目都应该配置的安全基线：`helmet` 设置安全响应头、`cors` 控制跨域、`express-rate-limit` 防暴力攻击。

::: details Express 安全中间件配置
```bash
npm install helmet express-rate-limit cors
```

```js
// src/app.js
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import cors from 'cors'
import { config } from './config/env.js'

const app = express()

// helmet：自动设置十余个安全响应头
// 包括：X-Content-Type-Options、X-Frame-Options、Strict-Transport-Security 等
app.use(helmet())

// CORS：只允许配置的域名跨域请求
app.use(cors({
  origin: config.cors.origins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,  // 允许携带 Cookie
}))

// 全局限流：每个 IP 每 15 分钟最多 100 次请求
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,  // 在响应头返回限流信息
  message: { success: false, error: { code: 'RATE_LIMITED', message: '请求过于频繁，请稍后再试' } },
})
app.use('/api', globalLimiter)

// 登录接口更严格的限流（防暴力破解密码）
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, error: { code: 'RATE_LIMITED', message: '登录失败次数过多，请 1 分钟后重试' } },
})

// 限制请求体大小（防止恶意大请求）
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

export { app, loginLimiter }
```
:::

### 2. JWT 认证中间件

JWT（JSON Web Token）是无状态认证的标准方案，服务端无需存储 Session，适合分布式部署。Token 携带用户基本信息，通过签名验证真实性，服务端只需校验签名即可。

::: details JWT 认证与 Token 生成
```bash
npm install jsonwebtoken bcrypt
```

```js
// src/middlewares/auth.js
import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import { errors, AppError } from '../utils/AppError.js'

/**
 * 认证中间件：验证 Bearer Token，将用户信息挂载到 req.user
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      return next(errors.unauthorized())
    }

    const token = authHeader.split(' ')[1]
    const payload = jwt.verify(token, config.jwt.secret)

    req.user = payload  // { id, email, role, iat, exp }
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('登录已过期，请重新登录', 401, 'TOKEN_EXPIRED'))
    }
    if (err.name === 'JsonWebTokenError') {
      return next(errors.unauthorized('无效的 Token'))
    }
    next(err)
  }
}

/**
 * 权限检查中间件工厂：检查用户角色
 * 用法：router.delete('/:id', authenticate, authorize('admin'), handler)
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(errors.forbidden())
    }
    next()
  }
}

/**
 * 生成访问 Token
 */
export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  )
}
```
:::

## 六、测试

### 1. 单元测试（Vitest）

单元测试针对 Service 层的业务逻辑，通过 Mock 隔离数据库和外部依赖，确保测试快速且不依赖环境。好的单元测试应覆盖正常路径和各种边界情况（空数据、参数错误等）。

::: details Vitest 单元测试示例
```bash
npm install -D vitest @vitest/coverage-v8
```

```js
// tests/unit/userService.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserService } from '../../src/services/userService.js'

// Mock 数据库模块，避免测试时连接真实数据库
vi.mock('../../src/config/database.js', () => ({
  db: { query: vi.fn(), execute: vi.fn() },
}))
vi.mock('../../src/config/redis.js', () => ({
  redis: { get: vi.fn(), set: vi.fn() },
}))

import { db } from '../../src/config/database.js'
import { redis } from '../../src/config/redis.js'

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks()  // 每个测试前重置所有 Mock
  })

  describe('getById', () => {
    it('缓存命中时应直接返回缓存数据', async () => {
      const mockUser = { id: 1, name: 'Alice', email: 'alice@example.com' }
      redis.get.mockResolvedValue(JSON.stringify(mockUser))

      const result = await UserService.getById(1)

      expect(result).toEqual(mockUser)
      expect(db.query).not.toHaveBeenCalled()  // 缓存命中，不应查数据库
    })

    it('缓存未命中时应查数据库并回填缓存', async () => {
      const mockUser = { id: 1, name: 'Alice', email: 'alice@example.com' }
      redis.get.mockResolvedValue(null)  // 缓存未命中
      db.query.mockResolvedValue([[mockUser]])

      const result = await UserService.getById(1)

      expect(result).toEqual(mockUser)
      expect(redis.set).toHaveBeenCalledWith(
        'user:1',
        JSON.stringify(mockUser),
        'EX',
        3600
      )
    })

    it('用户不存在时应返回 null', async () => {
      redis.get.mockResolvedValue(null)
      db.query.mockResolvedValue([[]])  // 空结果

      const result = await UserService.getById(999)

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('邮箱已存在时应抛出 409 错误', async () => {
      db.query.mockResolvedValue([[{ id: 1 }]])  // 邮箱已存在

      await expect(
        UserService.create({ name: 'Bob', email: 'alice@example.com', password: '123456' })
      ).rejects.toMatchObject({ statusCode: 409, code: 'EMAIL_TAKEN' })
    })
  })
})
```
:::

### 2. 集成测试（Supertest）

集成测试模拟真实的 HTTP 请求，测试从路由到数据库的完整链路，通常在测试数据库（而非生产数据库）上运行。

::: details API 集成测试示例
```js
// tests/integration/users.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../src/app.js'

describe('Users API', () => {
  let authToken

  beforeAll(async () => {
    // 登录获取 Token（测试用账户在测试数据库中预先创建）
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'test-password' })
    authToken = res.body.data.token
  })

  it('GET /api/users 应返回用户列表', async () => {
    const res = await request(app)
      .get('/api/users')
      .query({ page: 1, limit: 10 })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveProperty('items')
    expect(res.body.data).toHaveProperty('total')
    expect(Array.isArray(res.body.data.items)).toBe(true)
  })

  it('GET /api/users/:id 用户不存在时应返回 404', async () => {
    const res = await request(app).get('/api/users/99999')

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('POST /api/users 未认证时应返回 401', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Test', email: 'test2@example.com', password: '123456' })

    expect(res.status).toBe(401)
  })

  it('POST /api/users 已认证时应创建用户', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'New User', email: `new-${Date.now()}@example.com`, password: 'Password123!' })

    expect(res.status).toBe(201)
    expect(res.body.data).toHaveProperty('id')
  })
})
```
:::

## 七、最佳实践总结

1. **严格分层**：Controller 只处理请求/响应，业务逻辑只放在 Service，Service 不依赖 HTTP 细节
2. **配置集中管理**：���有配置通过环境变量注入，统一在 `config/env.js` 中校验和导出
3. **统一错误格式**：使用 `AppError` 类区分业务/系统错误，错误响应格式保持一致
4. **日志分级输出**：生产用 JSON 格式、`info` 级别，开发用彩色格式、`debug` 级别
5. **安全基线必配**：`helmet`、`rate-limit`、`cors`、JWT 是每个项目的标配，不可省略
6. **优雅关闭**：处理 `SIGTERM` 信号，等待请求处理完毕后关闭数据库连接再退出

> [!tip]
> 使用 `eslint` + `prettier` 统一代码风格，配合 `husky` + `lint-staged` 在 Git commit 前自动检查。推荐在 CI/CD 流程中跑完测试后再部署，防止带 Bug 的代码上线。
