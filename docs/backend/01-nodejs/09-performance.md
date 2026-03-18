---
title: "Node.js 性能优化"
category: "后端 · Node.js"
tags:
  - Node.js
  - 性能
  - 内存
  - 监控
excerpt: "Node.js 性能优化涵盖代码层面的异步优化、内存管理，以及生产部署的进程管理和监控。掌握性能分析工具的使用，才能精准定位和解决性能瓶颈。"
date: 2024-01-23
---

# Node.js 性能优化

性能优化的黄金原则是「先测量，再优化」。盲目优化往往收效甚微甚至适得其反，只有通过分析工具找到真正的瓶颈，针对性地优化才能事半功倍。

## 一、性能基准与分析

### 1. 内置性能测量

Node.js 内置的 `performance` API（来自 `perf_hooks`）提供高精度时间戳，适合在代码中插入检测点，精确测量特定代码段的执行时间。

::: details 代码耗时分析
```js
// src/utils/perf-measure.js
import { performance, PerformanceObserver } from 'perf_hooks'

// 方式一：手动标记测量
performance.mark('start')
await processLargeData()
performance.mark('end')

performance.measure('processLargeData', 'start', 'end')
const [measure] = performance.getEntriesByName('processLargeData')
console.log(`耗时: ${measure.duration.toFixed(2)}ms`)

// 方式二：通过 PerformanceObserver 自动收集所有测量数据
const obs = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`${entry.name}: ${entry.duration.toFixed(2)}ms`)
  }
})
obs.observe({ entryTypes: ['measure'] })

// 包装函数：自动测量任意 async 函数的执行时间
async function measure(label, fn) {
  performance.mark(`${label}-start`)
  try {
    return await fn()
  } finally {
    performance.mark(`${label}-end`)
    performance.measure(label, `${label}-start`, `${label}-end`)
  }
}

const result = await measure('db-query', () => db.query('SELECT * FROM users'))
```
:::

### 2. CPU 性能分析

CPU 火焰图是定位性能热点的最直观工具。`clinic.js` 是 Node.js 生态中最完善的性能分析工具套件，能自动生成火焰图、诊断报告和气泡图。

::: details 生成 CPU 火焰图
```bash
# 安装 clinic.js（全局安装，供各项目使用）
npm install -g clinic

# 生成火焰图：直观展示 CPU 时间分布，识别热点函数
clinic flame -- node app.js

# 生成 Doctor 诊断报告：自动分析事件循环延迟、异步操作等
clinic doctor -- node app.js

# 生成气泡图：可视化每个函数的调用频率和耗时
clinic bubbleprof -- node app.js

# 使用 Node.js 内置分析器（不需要额外工具）
node --prof app.js                              # 生成 v8 分析日志
node --prof-process isolate-*.log > profile.txt # 处理为可读格式
```

生成火焰图后，重点关注：
- 宽度大的函数块（消耗 CPU 时间最多）
- 意外出现在火焰图顶部的函数（可能存在同步阻塞）
:::

### 3. 内存使用监控

Node.js 进程的内存主要分为 Heap（JavaScript 对象）、RSS（进程总内存）和 External（Buffer 等 C++ 分配的内存）。Heap 使用率持续上升通常是内存泄漏的信号。

::: details 内存监控工具
```js
// src/utils/monitor.js

// 打印当前内存使用情况（单位: MB）
function logMemoryUsage(label = '') {
  const mem = process.memoryUsage()
  const format = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB'

  console.log(`[${label || new Date().toISOString()}] 内存使用:`)
  console.log(`  RSS（进程总内存）: ${format(mem.rss)}`)
  console.log(`  Heap 总量:        ${format(mem.heapTotal)}`)
  console.log(`  Heap 使用:        ${format(mem.heapUsed)}`)
  console.log(`  External（Buffer）: ${format(mem.external)}`)
}

logMemoryUsage('启动')

// 定期监控并在超阈值时告警
const HEAP_WARN_THRESHOLD = 0.85  // Heap 使用率超过 85% 时告警

setInterval(() => {
  const { heapUsed, heapTotal } = process.memoryUsage()
  const ratio = heapUsed / heapTotal

  if (ratio > HEAP_WARN_THRESHOLD) {
    console.warn(`⚠️ 内存告警: Heap 使用率 ${(ratio * 100).toFixed(1)}%，可能存在内存泄漏`)
  }
}, 30000)

// 设置 V8 堆内存上限（应根据服务器内存调整）
// 启动方式：node --max-old-space-size=2048 app.js （单位: MB）
```
:::

## 二、代码层面优化

### 1. 避免阻塞事件循环

Node.js 单线程架构的最大风险是 CPU 密集型计算阻塞事件循环：执行期间所有其他请求都必须等待，表现为接口延迟飙升。识别并处理这类阻塞操作是 Node.js 性能优化的首要任务。

::: code-group
```js [❌ 阻塞事件循环]
// src/routes/fib.js
// 计算斐波那契（CPU 密集型）时，所有请求都被阻塞
app.get('/fib', (req, res) => {
  const n = parseInt(req.query.n)
  const result = fib(n) // 执行期间无法处理任何其他请求！
  res.json({ result })
})

function fib(n) {
  if (n <= 1) return n
  return fib(n - 1) + fib(n - 2)  // 指数复杂度，n=40 时需要约 1 秒
}
```

```js [✅ 使用 Worker 线程]
// src/routes/fib.js
import { Worker } from 'worker_threads'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 将 CPU 密集型计算移入 Worker 线程，主线程事件循环不受影响
app.get('/fib', async (req, res) => {
  const n = parseInt(req.query.n)

  try {
    const result = await runInWorker(path.join(__dirname, '../workers/fib.js'), { n })
    res.json({ result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

function runInWorker(workerFile, data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerFile, { workerData: data })
    worker.on('message', resolve)
    worker.on('error', reject)
  })
}
```

```js [Worker 文件]
// src/workers/fib.js
import { workerData, parentPort } from 'worker_threads'

function fib(n) {
  if (n <= 1) return n
  return fib(n - 1) + fib(n - 2)
}

// 在独立线程中执行，不影响主线程
parentPort.postMessage(fib(workerData.n))
```
:::

### 2. 流式处理大文件

一次性将大文件读入内存是最常见的性能问题之一。对于大文件，应始终使用流，内存占用从 O(文件大小) 降为 O(块大小)。

::: code-group
```js [❌ 全量读入内存]
// src/routes/download.js
// 500MB 文件会占用 500MB+ 内存，同时处理多个请求时内存会耗尽
app.get('/download', async (req, res) => {
  const data = await fs.readFile('large-video.mp4') // 危险！
  res.send(data)
})
```

```js [✅ 流式传输]
// src/routes/download.js
import { createReadStream, statSync } from 'fs'

// 流式传输：内存占用仅为当前缓冲块（通常 64KB）
app.get('/download', (req, res) => {
  const filePath = 'large-video.mp4'
  const { size } = statSync(filePath)

  res.set({
    'Content-Type': 'video/mp4',
    'Content-Length': size,
    'Accept-Ranges': 'bytes',
  })

  const stream = createReadStream(filePath)
  stream.pipe(res)

  // 客户端断开时及时销毁流，释放文件句柄
  req.on('close', () => stream.destroy())
  stream.on('error', (err) => {
    console.error('文件流错误:', err)
    res.status(500).end()
  })
})
```
:::

### 3. 内存缓存高频数据

对于计算代价高且不频繁变化的数据，在内存中缓存结果可以大幅减少计算和数据库压力。LRU（最近最少使用）算法保证缓存不会无限增长。

::: details LRU 内存缓存
```js
// src/utils/lru-cache.js

/**
 * LRU 缓存：容量满时淘汰最久未使用的条目
 * 利用 Map 的插入顺序特性实现 O(1) 的读写
 */
class LRUCache {
  #cache = new Map()
  #maxSize

  constructor(maxSize = 100) {
    this.#maxSize = maxSize
  }

  get(key) {
    if (!this.#cache.has(key)) return undefined

    // 将条目移到末尾（标记为「最近使用」）
    const value = this.#cache.get(key)
    this.#cache.delete(key)
    this.#cache.set(key, value)
    return value
  }

  set(key, value) {
    if (this.#cache.has(key)) {
      this.#cache.delete(key)
    } else if (this.#cache.size >= this.#maxSize) {
      // Map 第一个元素就是最久未使用的
      const firstKey = this.#cache.keys().next().value
      this.#cache.delete(firstKey)
    }
    this.#cache.set(key, value)
  }

  has(key) { return this.#cache.has(key) }
  get size() { return this.#cache.size }
}

// 在服务中使用内存缓存
const statsCache = new LRUCache(500)

async function getUserStats(userId) {
  // 先查缓存
  const cached = statsCache.get(userId)
  if (cached) return cached

  // 缓存未命中，执行昂贵的计算
  const stats = await computeExpensiveStats(userId)
  statsCache.set(userId, stats)
  return stats
}
```
:::

### 4. 对象池减少 GC 压力

频繁创建和销毁对象会给 V8 垃圾回收器（GC）带来压力，导致周期性停顿（GC Pause）。对象池通过复用对象来避免频繁分配，特别适合高频创建的固定大小对象（如 Buffer）。

::: details Buffer 对象池
```js
// src/utils/buffer-pool.js

/**
 * Buffer 对象池：复用固定大小的 Buffer，避免频繁 GC
 */
class BufferPool {
  #pool = []
  #bufferSize
  #maxPoolSize

  constructor(bufferSize = 64 * 1024, maxPoolSize = 50) {
    this.#bufferSize = bufferSize
    this.#maxPoolSize = maxPoolSize
  }

  // 从池中取出 Buffer（或创建新的）
  acquire() {
    return this.#pool.pop() || Buffer.allocUnsafe(this.#bufferSize)
  }

  // 用完后归还到池中
  release(buffer) {
    // 只回收指定大小的 Buffer，防止内存无限增长
    if (buffer.length === this.#bufferSize && this.#pool.length < this.#maxPoolSize) {
      this.#pool.push(buffer)
    }
  }
}

const pool = new BufferPool(64 * 1024)  // 64KB Buffer 池

// 使用 try/finally 确保 Buffer 一定被归还
async function processChunk(data) {
  const buf = pool.acquire()
  try {
    buf.fill(0)  // 清空旧数据
    data.copy(buf)
    return processBuffer(buf)
  } finally {
    pool.release(buf)  // 无论成功失败都归还
  }
}
```
:::

## 三、内存泄漏排查

### 1. 常见内存泄漏原因

| 原因 | 示例 | 修复方案 |
|------|------|----------|
| 全局变量无限增长 | `global.cache.push(data)` | 使用有界缓存（LRU），设置最大容量 |
| 事件监听未移除 | `emitter.on()` 未调用 `off()` | 使用 `once()` 或组件卸载时手动 `off()` |
| 定时器未清除 | `setInterval` 持续引用外部变量 | 保存返回值，适时调用 `clearInterval` |
| 闭包持有大对象 | 闭包捕获了大型数组引用 | 使用完后手动设 `null` 断开引用 |
| 连接未释放 | 数据库连接用后未 `release` | 在 `finally` 块中确保 `release` |

### 2. 使用 heapdump 定位泄漏

排查内存泄漏的标准流程：在不同时间点生成堆快照，在 Chrome DevTools 中对比两个快照，查找增长的对象类型。

::: details 堆快照分析
```bash
npm install heapdump
```

```js
// src/index.js
import heapdump from 'heapdump'

// 通过 Unix 信号触发快照（不影响运行中的请求）
process.on('SIGUSR2', () => {
  const filename = `heap-${Date.now()}.heapsnapshot`
  heapdump.writeSnapshot(filename, (err, fname) => {
    if (err) console.error('快照失败:', err)
    else console.log('堆快照已写入:', fname)
  })
})

// 触发方式：
// kill -USR2 <PID>
// 或：kill -USR2 $(cat app.pid)
```

排查步骤：
1. 启动应用，触发一次快照（基准）
2. 执行可疑操作（如处理 1000 个请求）
3. 再触发一次快照
4. 在 Chrome DevTools > Memory 中加载两个快照
5. 切换到「Comparison」视图，按「Size Delta」降序排列
6. 找到内存增量最大的对象类型，追溯其引用链
:::

## 四、HTTP 性能优化

### 1. 响应压缩

HTTP 响应压缩能显著减少传输数据量，通常可压缩 60-80% 的文本内容（JSON、HTML、CSS 等），以少量 CPU 换取大量带宽节省。

::: details 启用 gzip 压缩
```bash
npm install compression
```

```js
// src/app.js
import compression from 'compression'

// 自动对超过阈值大小的响应启用 gzip 压缩
app.use(compression({
  threshold: 1024,  // 仅压缩超过 1KB 的响应
  filter: (req, res) => {
    // 客户端明确表示不需要压缩时跳过
    if (req.headers['x-no-compression']) return false
    // 其他情况使用默认过滤逻辑
    return compression.filter(req, res)
  },
}))
```
:::

### 2. HTTP 缓存策略

合理的缓存头配置能让浏览器/CDN 缓存响应，减少服务器请求数量。静态资源使用长期强缓存 + 内容哈希，API 响应通常不缓存或使用协商缓存。

::: details 配置 HTTP 缓存头
```js
// src/app.js

// 静态资源：强缓存 1 年，配合文件名内容哈希（构建时生成）
// 文件内容变了文件名也变了，所以可以缓存很长时间
app.use('/static', express.static('./public', {
  maxAge: '1y',         // Cache-Control: max-age=31536000
  immutable: true,      // 告知缓存该资源不会改变
  etag: false,          // 有强缓存时不需要 ETag
}))

// API 响应：不缓存（数据随时变化）
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  next()
})

// 新闻/列表页：协商缓存（60 秒 + ETag）
app.get('/api/news', async (req, res) => {
  const news = await fetchLatestNews()
  const etag = generateETag(news)  // 基于内容生成 ETag

  // 如果内容没变（ETag 匹配），返回 304 节省传输
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end()
  }

  res.set({
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
    'ETag': etag,
  })
  res.json(news)
})
```
:::

## 五、生产部署优化

### 1. PM2 进程管理

PM2 是 Node.js 生产部署的标准工具，提供集群模式（利用多核 CPU）、自动重启、日志管理、监控等功能。

::: details PM2 集群配置
```bash
npm install -g pm2
```

```js
// ecosystem.config.js（项目根目录）
export default {
  apps: [{
    name: 'myapp',
    script: './src/index.js',

    // 集群模式：启动与 CPU 核数相等的进程，共享端口
    instances: 'max',      // 或指定数字，如 4
    exec_mode: 'cluster',

    // 内存超限自动重启（防止内存泄漏导致服务降级）
    max_memory_restart: '500M',

    // 生产环境变量
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },

    // 日志配置
    error_file: './logs/pm2-error.log',
    out_file:   './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',

    // 优雅重启：等待旧连接处理完再停止旧进程
    wait_ready: true,
    listen_timeout: 5000,
    kill_timeout: 10000,
  }],
}
```

```bash
# 常用 PM2 命令
pm2 start ecosystem.config.js   # 启动
pm2 reload myapp                 # 零停机重载（集群模式）
pm2 status                       # 查看进程状态
pm2 logs myapp                   # 查看实时日志
pm2 monit                        # 实时监控仪表盘
pm2 startup                      # 设置开机自启
pm2 save                         # 保存进程列表
```
:::

### 2. 优雅关闭

容器化部署（Docker/K8s）停止实例时会发送 `SIGTERM` 信号，服务必须正确处理：停止接受新请求，等待现有请求处理完毕，然后释放资源后退出。未处理优雅关闭可能导致正在处理的请求被强制中断。

::: details 实现优雅关闭
```js{8,11}
// src/index.js
import http from 'http'
import { pool } from './config/database.js'
import { redis } from './config/redis.js'
import { logger } from './config/logger.js'

const server = http.createServer(app)

server.listen(3000, () => {
  logger.info('服务器已启动，监听端口 3000')
  // 告知 PM2 进程已就绪（配合 wait_ready: true）
  process.send?.('ready')
})

// K8s/Docker 停止时发送 SIGTERM，必须处理
process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)   // 本地 Ctrl+C

async function gracefulShutdown(signal) {
  logger.info(`收到 ${signal}，开始优雅关闭...`)

  // 停止接受新请求，等待现有请求处理完
  server.close(async () => {
    try {
      await pool.end()       // 关闭数据库连接池
      await redis.quit()     // 关闭 Redis 连接
      logger.info('服务器已优雅关闭')
      process.exit(0)
    } catch (err) {
      logger.error('关闭时出错:', err)
      process.exit(1)
    }
  })

  // 30 秒内未关闭则强制退出（防止卡死）
  setTimeout(() => {
    logger.error('优雅关闭超时，强制退出')
    process.exit(1)
  }, 30000).unref()  // unref 防止定时器阻止进程退出
}
```
:::

## 六、最佳实践

1. **先测量再优化**：用 `clinic.js` 或 `--prof` 找到真正的瓶颈，避免猜测式优化
2. **CPU 密集型任务**：使用 Worker Threads 或独立微服务，不要阻塞主线程事件循环
3. **设置内存上限**：通过 `--max-old-space-size` 限制堆内存，防止单进程耗尽服务器内存
4. **集群模式部署**：生产环境通过 PM2 `cluster` 模式利用全部 CPU 核心
5. **监控关键指标**：响应时间（P99）、错误率、内存趋势、CPU 使用率

> [!tip]
> 使用 `NODE_ENV=production` 启动应用，Express 等框架在生产模式下会禁用开发调试功能（如详细错误信息、视图缓存关闭等），性能通常提升 20-30%。
