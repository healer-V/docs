---
title: "Node.js 异步编程"
category: "后端 · Node.js"
tags:
  - Node.js
  - Promise
  - async/await
excerpt: "Node.js 异步编程是其核心能力，从早期的回调函数演进到 Promise、async/await，掌握各种模式及错误处理方式是编写高质量 Node.js 代码的关键。"
date: 2024-01-18
---

# Node.js 异步编程

## 一、异步编程演进

Node.js 基于事件循环的单线程架构决定了它不能阻塞等待 I/O 操作，必须使用异步编程。了解异步模式的演进历史，有助于在阅读不同时期的代码时快速理解其风格。

| 阶段 | 模式 | 主要问题 |
|------|------|----------|
| 早期（Node.js 0.x） | 回调函数（Callback） | 嵌套过深形成「回调地狱」，错误处理分散 |
| 改进（Node.js 4+） | Promise | 链式调用改善可读性，但链条长时仍难维护 |
| 现代（Node.js 8+） | async/await | 同步风格书写异步代码，错误堆栈清晰 |

## 二、回调函数

### 1. 错误优先约定

Node.js 核心 API 全部遵循「错误优先回调」约定：第一个参数固定为 `error`（无错误时为 `null`），后续参数为正常结果。这个约定让错误处理变得统一，但必须在每个回调中手动检查。

::: details 错误优先回调示例
```js
// src/utils/file-reader.js
import { readFile } from 'fs'

// 第一个参数始终是 error，有错误时不为 null
readFile('config.json', 'utf-8', (err, data) => {
  if (err) {
    // 必须先检查错误，有错误时 data 为 undefined
    console.error('读取失败:', err.message)
    return
  }
  // 确认无错误后才使用 data
  console.log('读取成功:', data)
})
```
:::

### 2. 回调地狱

当多个异步操作需要按顺序执行时，回调函数必须层层嵌套。业务逻辑随着嵌套层数增加而越来越难以理解，这就是「回调地狱」（Callback Hell）。

::: details 回调地狱示例（反模��）
```js
// src/services/user-order-service.js
// ❌ 三层嵌套已难以维护，更多层几乎不可读
import { readFile } from 'fs'

readFile('user.json', 'utf-8', (err, userData) => {
  if (err) return handleError(err)

  const user = JSON.parse(userData)
  db.query('SELECT * FROM orders WHERE userId = ?', [user.id], (err, orders) => {
    if (err) return handleError(err)

    sendEmail(user.email, orders, (err, result) => {
      if (err) return handleError(err)
      console.log('邮件发送成功:', result)
      // 每增加一步就多一层嵌套...
    })
  })
})
```
:::

### 3. 将回调转为 Promise

Node.js 内置的 `util.promisify` 可以将任何遵循错误优先约定的回调函数转换为返回 Promise 的函数，是逐步迁移旧代码的重要工具。

::: details util.promisify 用法
```js{4,7}
// src/utils/promisified.js
import { promisify } from 'util'
import { readFile, writeFile } from 'fs'

// 转换为 Promise 版本
const readFileAsync = promisify(readFile)
const writeFileAsync = promisify(writeFile)

// 现在可以用 async/await 调用
const data = await readFileAsync('config.json', 'utf-8')
await writeFileAsync('output.json', data)
```

> [!tip]
> Node.js 内置模块已在 `fs/promises`、`dns/promises` 等路径下提供了原生 Promise 版本，优先使用这些而非 `promisify`：
> ```js
> import { readFile } from 'fs/promises'
> const data = await readFile('config.json', 'utf-8')
> ```
:::

## 三、Promise

### 1. 基本用法

`Promise` 代表一个异步操作的最终完成或失败，有三种状态：`pending`（进行中）、`fulfilled`（已��功）、`rejected`（已失败）。状态一旦改变就不可逆，`.then()` 返回新 Promise，支持链式调用。

::: details Promise 链式调用
```js
// src/services/user-service.js

// 将回调风格封装成 Promise
function fetchUser(id) {
  return new Promise((resolve, reject) => {
    // 模拟异步数据库查询（100ms 延迟）
    setTimeout(() => {
      if (id > 0) {
        resolve({ id, name: 'Alice', email: 'alice@example.com' })
      } else {
        reject(new Error('无效的用户 ID'))
      }
    }, 100)
  })
}

// 链式调用：每个 .then() 可以返回新值或新 Promise
fetchUser(1)
  .then(user => {
    console.log('用户:', user)
    return fetchOrders(user.id) // 返回 Promise，下一个 .then 等待它
  })
  .then(orders => {
    console.log('订单数量:', orders.length)
  })
  .catch(err => {
    // 链条中任何一步的错误都会跳到这里
    console.error('操作失败:', err.message)
  })
  .finally(() => {
    // 无论成功失败都会执行，用于清理操作
    console.log('请求完成')
  })
```
:::

### 2. Promise 静态方法

这四个静态方法处理多个 Promise 的协调，是并发编程的核心工具，需要理解它们在错误处理上的差异。

| 方法 | 成功条件 | 失败条件 | 适用场景 |
|------|----------|----------|----------|
| `Promise.all()` | 全部成功 | 任一失败立即拒绝 | 必须全部成功才继续 |
| `Promise.allSettled()` | 总是成功 | 不会失败 | 需要知道每个结果（含失败） |
| `Promise.race()` | 最先完成（成功或失败） | 最先的是失败 | 超时控制 |
| `Promise.any()` | 最先成功 | 全部失败 | 多备用源，取最快成功的 |

::: details 并发控制示例
```js
// src/services/dashboard-service.js

// Promise.all：并发请求，全部成功才返回（性能最优）
const [users, products, orders] = await Promise.all([
  fetch('/api/users').then(r => r.json()),
  fetch('/api/products').then(r => r.json()),
  fetch('/api/orders').then(r => r.json()),
])
// 总耗时 = 三个请求中最慢的那个，而非三者之和

// Promise.allSettled：无论成功失败，收集所有结果
const results = await Promise.allSettled([
  fetchUser(1),
  fetchUser(2),
  fetchUser(-1), // 这个会失败，但不影响其他请求
])

results.forEach(result => {
  if (result.status === 'fulfilled') {
    console.log('成功:', result.value)
  } else {
    console.log('失败:', result.reason.message)
  }
})

// Promise.race：超时控制（常用模式）
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`操作超时: ${ms}ms`)), ms)
  )
  return Promise.race([promise, timeout])
}

const data = await withTimeout(fetchUser(1), 3000)
```
:::

## 四、async/await

### 1. 基本语法

`async/await` 是 Promise 的语法糖，`async` 函数始终返回 Promise，`await` 暂停函数执行直到 Promise 完成。这让异步代码看起来和同步代码一样清晰，大大降低了理解成本。

::: details async/await 完整语法
```js{2,5}
// src/services/user-service.js

// async 函数：无论返回值是什么，都会被包装成 Promise
async function getUserWithOrders(id) {
  // await 暂停执行，等待 Promise 解决，获得解决值
  const user = await fetchUser(id)
  const orders = await fetchOrders(user.id)  // 依赖 user.id，必须串行
  return { user, orders }
}

// 调用 async 函数得到 Promise
const result = await getUserWithOrders(1)
console.log(result.user.name)

// Node.js 14.8+：ESM 模块支持顶层 await，无需包裹在 async 函数内
const config = await readFile('config.json', 'utf-8')
```
:::

### 2. 错误处理

`async/await` 的错误通过 `try/catch` 捕获，这和同步代码的错误处理方式完全一致，错误堆栈也更清晰。

::: code-group
```js [try-catch（推荐）]
// src/services/order-service.js
async function processOrder(userId, items) {
  try {
    const user = await fetchUser(userId)
    const order = await createOrder(user.id, items)
    await sendConfirmationEmail(user.email, order)
    return { success: true, orderId: order.id }
  } catch (err) {
    // 任何 await 抛出的错误都在这里统一处理
    console.error('订单处理失败:', err.message)
    return { success: false, error: err.message }
  } finally {
    // 必然执行：适合记录日志、清理资源等操作
    console.log(`订单处理结束: 用户 ${userId}`)
  }
}
```

```js [to() 工具函数（减少嵌套）]
// src/utils/async.js
// 将 Promise 结果转换为 [error, data] 元组，避免大量 try-catch

async function to(promise) {
  try {
    return [null, await promise]
  } catch (err) {
    return [err, null]
  }
}

// 使用：逐步检查每个操作的结果
async function processUser(id) {
  const [userErr, user] = await to(fetchUser(id))
  if (userErr) {
    console.error('获取用户失败:', userErr.message)
    return
  }

  const [orderErr, orders] = await to(fetchOrders(user.id))
  if (orderErr) {
    console.error('获取订单失败:', orderErr.message)
    return
  }

  console.log(`用户 ${user.name} 有 ${orders.length} 个订单`)
}
```
:::

### 3. 并发 vs 顺序执行

滥用 `await` 会让本可并发的操作变成顺序执行，浪费大量时间。只有存在数据依赖时才需要串行执行，互相独立的操作应该并发执行。

::: details 并发执行优化
```js
// src/services/dashboard-service.js

// ❌ 顺序执行（低效）— 总耗时 ≈ 200ms + 300ms + 150ms = 650ms
async function loadDashboardSlow(userId) {
  const user = await fetchUser(userId)         // 200ms，等待结束后才开始下一个
  const orders = await fetchOrders(userId)     // 300ms
  const notifications = await fetchNotifications(userId)  // 150ms
  return { user, orders, notifications }
}

// ✅ 并发执行（高效）— 总耗时 ≈ max(200ms, 300ms, 150ms) = 300ms
async function loadDashboardFast(userId) {
  // 三个请求同时发出，互不等待
  const [user, orders, notifications] = await Promise.all([
    fetchUser(userId),
    fetchOrders(userId),
    fetchNotifications(userId),
  ])
  return { user, orders, notifications }
}

// ✅ 先触发 Promise，再逐个 await（适合需要提前触发的场景）
async function loadDashboardAlternative(userId) {
  const userPromise = fetchUser(userId)       // 立即发出请求
  const ordersPromise = fetchOrders(userId)  // 立即发出请求

  const user = await userPromise       // 等待结果
  const orders = await ordersPromise  // 如果先完成则立即返回
  return { user, orders }
}
```
:::

## 五、EventEmitter

### 1. 基本用法

`EventEmitter` 是 Node.js 事件系统的基础，HTTP 服务器、流、`process` 对象等都继承自它。掌握它对于理解 Node.js 整体架构至关重要。

::: details EventEmitter 完整 API
```js
// src/utils/event-demo.js
import { EventEmitter } from 'events'

const emitter = new EventEmitter()

// on：持续监听，每次触发都会调用
emitter.on('data', (payload) => {
  console.log('收到数据:', payload)
})

// once：只监听一次，触发后自动移除
emitter.once('connect', () => {
  console.log('已连接（只打印一次）')
})

// 发射事件，后续参数作为监听函数的实参
emitter.emit('data', { id: 1, value: 'hello' })
emitter.emit('connect')
emitter.emit('connect') // 不再触发

// 移除特定监听函数
function handler(data) { console.log(data) }
emitter.on('message', handler)
emitter.off('message', handler)       // 移除指定函数
emitter.removeAllListeners('message') // 移除该事件的所有监听

// 获取监听信息
console.log(emitter.listenerCount('data'))  // 1
console.log(emitter.eventNames())           // ['data']

// 防止内存泄漏警告：默认超过 10 个监听器会警告
emitter.setMaxListeners(20)
```
:::

### 2. 继承 EventEmitter 构建可观察对象

通过继承 `EventEmitter`，可以构建自定义的事件驱动类。这是 Node.js 生态中常见的设计模式，让使用者可以通过监听事件来响应类内部的状态变化。

::: details 可观察的数据获取器
```js
// src/utils/data-fetcher.js
import { EventEmitter } from 'events'

/**
 * 可观察的数据获取器
 * 事件：start、data、error、end
 */
class DataFetcher extends EventEmitter {
  #url
  #retries

  constructor(url, retries = 3) {
    super()
    this.#url = url
    this.#retries = retries
  }

  async fetch() {
    this.emit('start', { url: this.#url })

    for (let attempt = 1; attempt <= this.#retries; attempt++) {
      try {
        const response = await fetch(this.#url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const data = await response.json()
        this.emit('data', data)
        this.emit('end', { attempts: attempt })
        return data
      } catch (err) {
        this.emit('retry', { attempt, error: err.message })
        if (attempt === this.#retries) {
          this.emit('error', err)
          throw err
        }
        // 指数退避：等待后重试
        await new Promise(r => setTimeout(r, attempt * 500))
      }
    }
  }
}

// 使用方通过监听事件感知进度
const fetcher = new DataFetcher('https://api.example.com/users', 3)

fetcher.on('start',  ({ url }) => console.log('开始请求:', url))
fetcher.on('retry',  ({ attempt, error }) => console.warn(`第 ${attempt} 次重试，原因: ${error}`))
fetcher.on('data',   (data) => console.log('数据条数:', data.length))
fetcher.on('error',  (err) => console.error('最终失败:', err.message))
fetcher.on('end',    ({ attempts }) => console.log(`完成，共尝试 ${attempts} 次`))

await fetcher.fetch()
```
:::

## 六、并发控制

### 1. 限制并发数量

直接对大量任务使用 `Promise.all` 会同时发出数百个请求，可能导致服务端过载或本地连接数耗尽。生产环境需要限制同时运行的 Promise 数量。

::: details 并发限制器
```js
// src/utils/p-limit.js

/**
 * 限制 Promise 并发数量
 * @param {Function[]} tasks - 返回 Promise 的函数数组（注意是函数，不是 Promise）
 * @param {number} concurrency - 最大并发数
 */
async function pLimit(tasks, concurrency) {
  const results = new Array(tasks.length)
  const executing = new Set()
  let index = 0

  async function runNext() {
    if (index >= tasks.length) return

    const currentIndex = index++
    const task = tasks[currentIndex]

    const promise = (async () => {
      results[currentIndex] = await task()
    })()

    executing.add(promise)
    promise.finally(() => executing.delete(promise))

    // 达到并发上限时，等待最快完成的一个
    if (executing.size >= concurrency) {
      await Promise.race(executing)
    }

    await runNext()
  }

  // 启动初始批次
  await Promise.all(Array.from({ length: concurrency }, runNext))
  return results
}

// 使用：批量处理 100 个用户，每次最多处理 5 个
const userIds = Array.from({ length: 100 }, (_, i) => i + 1)
const tasks = userIds.map(id => () => fetchUser(id))

const users = await pLimit(tasks, 5)
console.log('处理完成:', users.length)
```
:::

### 2. 顺序执行队列

某些场景需要任务严格按顺序执行（如数据库写入顺序有要求），可以用队列来保证顺序。

::: details 顺序执行异步队列
```js
// src/utils/async-queue.js

/**
 * 顺序执行异步队列
 * 所有添加的任务按添加顺序依次执行，互不并发
 */
class AsyncQueue {
  #queue = []
  #running = false

  /**
   * 将任务加入队列
   * @param {Function} task - 返回 Promise 的函数
   * @returns {Promise} 任务执行结果的 Promise
   */
  add(task) {
    return new Promise((resolve, reject) => {
      this.#queue.push({ task, resolve, reject })
      this.#processNext()
    })
  }

  async #processNext() {
    // 已有任务在运行时直接返回，避免并发
    if (this.#running || this.#queue.length === 0) return

    this.#running = true

    while (this.#queue.length > 0) {
      const { task, resolve, reject } = this.#queue.shift()
      try {
        resolve(await task())
      } catch (err) {
        reject(err)
      }
    }

    this.#running = false
  }

  get size() {
    return this.#queue.length
  }
}

// 使用：确保数据库写入按顺序执行
const queue = new AsyncQueue()

const results = await Promise.all([
  queue.add(() => db.insert({ id: 1, name: 'Alice' })),
  queue.add(() => db.insert({ id: 2, name: 'Bob' })),   // 等待 Alice 插入完成
  queue.add(() => db.insert({ id: 3, name: 'Carol' })), // 等待 Bob 插入完成
])
```
:::

## 七、最佳实践

1. **优先 async/await**：代码可读性最好，错误堆栈更清晰，易于调试
2. **并发执行无依赖任务**：用 `Promise.all` 将多个独立请求并发，避免不必要的串行等待
3. **始终处理 Promise 错误**：未处理的 `rejection` 在 Node.js 15+ 会直接崩溃进程
4. **注意 forEach 陷阱**：`forEach` 不等待 `async` 回调，用 `for...of` 或 `Promise.all` 代替

::: warning forEach 中的 async 陷阱
```js
// src/utils/process-items.js

// ❌ 错误：forEach 不等待 async 回调完成，循环结束时任务还未执行
items.forEach(async (item) => {
  await processItem(item) // 不会等待！
})
console.log('看起来完成了，实际任务还在后台跑')

// ✅ 正确：for...of 会等待每个 await
for (const item of items) {
  await processItem(item) // 严格按顺序，一个完成后才处理下一个
}

// ✅ 并发处理：所有 item 同时处理
await Promise.all(items.map(item => processItem(item)))

// ✅ 限制并发：每次最多处理 5 个
await pLimit(items.map(item => () => processItem(item)), 5)
```
:::
