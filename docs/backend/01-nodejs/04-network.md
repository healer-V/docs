---
title: "Node.js HTTP 编程"
category: "后端 · Node.js"
tags:
  - Node.js
  - HTTP
  - 网络
excerpt: "Node.js 内置 http/https 模块可创建 HTTP 服务器与发起 HTTP 请求，结合 url、querystring 等模块可实现完整的 Web 服务，是理解 Express/Koa 等框架底层原理的基础。"
date: 2024-01-20
---

# Node.js HTTP 编程

## 一、HTTP 模块概述

Node.js 内置 `http` 和 `https` 模块，无需安装任何第三方包即可创建 Web 服务器和发起 HTTP 请求。理解这些底层模块有助于深入掌握 Express、Fastify 等框架的工作原理。

### 1. 核心模块

| 模块 | 说明 | 典型用途 |
|------|------|----------|
| `http` | HTTP/1.1 服务器与客户端 | 创建 Web 服务器、发起 HTTP 请求 |
| `https` | HTTPS 服务器与客户端 | 生产环境 TLS 加密通信 |
| `url` | URL 解析与构造 | 解析路径、查询参数 |
| `http2` | HTTP/2 多路复用支持 | 高性能 API 服务 |

## 二、创建 HTTP 服务器

### 1. 基础服务器

`http.createServer()` 接受一个请求处理函数，每次收到请求都会触发该函数。`req` 是 `IncomingMessage` 对象（可读流），`res` 是 `ServerResponse` 对象（可写流）。

::: details Hello World HTTP 服务器
```js
// src/server.js
import http from 'http'

const server = http.createServer((req, res) => {
  // writeHead(statusCode, headers) 设置响应状态码和响应头
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
  })

  // end() 发送响应体并结束响应，必须调用否则客户端一直等待
  res.end('Hello, Node.js!')
})

server.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000')
})
```
:::

### 2. 路由处理

原生 HTTP 模块没有路由功能，需要手动解析 URL 路径和方法进行匹配。使用 `URL` 类解析路径和查询参数，比旧版 `url.parse()` 更直观。

::: details 基础路由分发
```js
// src/server.js
import http from 'http'
import { URL } from 'url'

http.createServer((req, res) => {
  // 构造完整 URL 对象，方便提取 pathname 和 searchParams
  const url = new URL(req.url, `http://${req.headers.host}`)
  const method = req.method.toUpperCase()

  if (method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end('<h1>首页</h1>')

  } else if (method === 'GET' && url.pathname === '/api/users') {
    const page = url.searchParams.get('page') || '1'
    const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ page: +page, data: users }))

  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: '未找到该路径' }))
  }
}).listen(3000)
```
:::

### 3. 解析请求体

HTTP 请求体以流的形式到达，需要监听 `data` 事件累积数据，`end` 事件表示数据接收完毕。必须限制请求体大小，防止恶意大请求耗尽内存。

::: details 处理 POST/PUT 请求体
```js{8-18}
// src/server.js
import http from 'http'

http.createServer((req, res) => {
  if (req.method !== 'POST') {
    return res.writeHead(405).end()
  }

  // 请求体以 Buffer 块的形式流式到达
  let body = ''
  req.on('data', (chunk) => {
    body += chunk.toString()
    // 超过 1MB 立即断开，防止内存溢出
    if (body.length > 1e6) req.destroy()
  })

  // end 事件：所有数据块已接收完毕
  req.on('end', () => {
    try {
      const data = JSON.parse(body)
      console.log('收到数据:', data)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ received: true, data }))
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: '无效的 JSON 格式' }))
    }
  })
}).listen(3000)
```
:::

### 4. 静态文件服务

生产环境静态文件通常由 Nginx 直接服务，但了解其实现原理很重要。关键点是用 `createReadStream` 流式传输文件（避免将整个文件读入内存），以及防止路径穿越攻击（`../../etc/passwd`）。

::: details 静态文件服务器
```js
// src/static-server.js
import http from 'http'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import path from 'path'

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
}

http.createServer(async (req, res) => {
  // 规范化路径并去掉开头的 '../'，防止路径穿越攻击
  const safePath = path.normalize(req.url).replace(/^(\.\.[/\\])+/, '')
  const filePath = path.join('./public', safePath)
  const ext = path.extname(filePath)

  try {
    const stats = await stat(filePath)

    // 目录请求自动定位到 index.html
    if (stats.isDirectory()) {
      return serveFile(path.join(filePath, 'index.html'), res)
    }

    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Content-Length': stats.size,  // 告知客户端内容大小，支持进度条
    })

    // 流式传输文件，不占用额外内存
    createReadStream(filePath).pipe(res)
  } catch {
    res.writeHead(404).end('文件未找到')
  }
}).listen(3000)
```
:::

## 三、URL 解析

### 1. URL API

WHATWG `URL` API 是现代 Node.js 处理 URL 的标准方式，与浏览器 API 完全兼容，支持创建、解析、修改 URL 的各个部分。

::: details URL 对象完整用法
```js
// src/utils/url-utils.js
import { URL } from 'url'

const url = new URL('https://example.com:8080/api/users?page=1&limit=10#section')

// 解析 URL 各部分
console.log(url.protocol)  // 'https:'
console.log(url.host)      // 'example.com:8080'
console.log(url.hostname)  // 'example.com'
console.log(url.port)      // '8080'
console.log(url.pathname)  // '/api/users'
console.log(url.search)    // '?page=1&limit=10'
console.log(url.hash)      // '#section'

// URLSearchParams：操作查询字符串
const params = url.searchParams
console.log(params.get('page'))    // '1'
console.log(params.get('limit'))   // '10'
console.log(params.has('sort'))    // false

// 遍历所有参数
for (const [key, value] of params) {
  console.log(`${key}: ${value}`)
}

// 构造新 URL：以基础 URL 为基准拼接相对路径
const apiUrl = new URL('/api/products', 'https://example.com')
apiUrl.searchParams.set('category', 'electronics')
apiUrl.searchParams.set('sort', 'price')
console.log(apiUrl.toString())
// 'https://example.com/api/products?category=electronics&sort=price'
```
:::

## 四、发起 HTTP 请求

### 1. 使用 http.get

`http.get` 是发起简单 GET 请求的内置方式，适合与不支持 `fetch` 的旧版 Node.js 兼容。响应体同样是流，需要累积后才能解析。

::: details 封装 http.get 为 Promise
```js
// src/utils/http-client.js
import http from 'http'
import https from 'https'

// 根据协议自动选择 http 或 https 模块
function httpGet(url) {
  const mod = url.startsWith('https') ? https : http

  return new Promise((resolve, reject) => {
    mod.get(url, (res) => {
      // 处理重定向
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(httpGet(res.headers.location))
      }

      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) })
        } catch {
          resolve({ status: res.statusCode, data })
        }
      })
    }).on('error', reject)
  })
}

const { status, data } = await httpGet('http://api.example.com/users')
console.log(status, data)
```
:::

### 2. 使用 fetch（推荐，Node.js 18+）

Node.js 18 内置了与浏览器完全兼容的 `fetch` API，大多数情况下无需再安装 `axios` 等第三方库。`AbortController` 用于控制超时，这是生产环境必须处理的场景。

::: details 原生 fetch 完整用法
```js
// src/utils/api-client.js

// GET 请求
const response = await fetch('https://api.example.com/users?page=1')
if (!response.ok) {
  throw new Error(`HTTP 错误: ${response.status}`)
}
const users = await response.json()

// POST 请求（发送 JSON 数据）
const createRes = await fetch('https://api.example.com/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Alice', email: 'alice@example.com' }),
})
const newUser = await createRes.json()
console.log('创建成功:', newUser)

// 带超时控制的请求（生产环境必须设置超时）
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return await res.json()
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`请求超时 (${timeout}ms): ${url}`)
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

const data = await fetchWithTimeout('https://api.example.com/data', {}, 3000)
```
:::

### 3. 封装通用请求客户端

生产项目中建议封装统一的 HTTP 客户端，集中处理认证、错误、重试等逻辑，避免在每个接口调用处重复写相同的代码。

::: details 带认证和重试的请求客户端
```js
// src/utils/api-client.js
class ApiClient {
  #baseURL
  #token
  #timeout

  constructor({ baseURL, timeout = 10000 }) {
    this.#baseURL = baseURL
    this.#timeout = timeout
  }

  setToken(token) {
    this.#token = token
  }

  async request(path, options = {}) {
    const url = `${this.#baseURL}${path}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.#timeout)

    const headers = {
      'Content-Type': 'application/json',
      ...(this.#token && { Authorization: `Bearer ${this.#token}` }),
      ...options.headers,
    }

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
        body: options.body ? JSON.stringify(options.body) : undefined,
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw Object.assign(new Error(error.message || `HTTP ${res.status}`), {
          status: res.status,
          data: error,
        })
      }

      return await res.json()
    } finally {
      clearTimeout(timeoutId)
    }
  }

  get(path, params) {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(path + query)
  }

  post(path, body) {
    return this.request(path, { method: 'POST', body })
  }

  put(path, body) {
    return this.request(path, { method: 'PUT', body })
  }

  delete(path) {
    return this.request(path, { method: 'DELETE' })
  }
}

// 使用
const api = new ApiClient({ baseURL: 'https://api.example.com', timeout: 8000 })
api.setToken('your-jwt-token')

const users = await api.get('/users', { page: 1, limit: 10 })
const newUser = await api.post('/users', { name: 'Bob', email: 'bob@example.com' })
```
:::

## 五、HTTPS 服务器

### 1. 使用 TLS 证书

生产环境建议用 Nginx 处理 HTTPS，Node.js 负责业务逻辑，这样证书更换无需重启 Node.js 进程。开发环境可使用 `mkcert` 工具生成受信任的本地证书。

::: details 创建 HTTPS 服务器
```bash
# 生成自签名证书（仅开发使用，生产用 Let's Encrypt）
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

```js
// src/https-server.js
import https from 'https'
import { readFileSync } from 'fs'

const options = {
  key: readFileSync('./key.pem'),   // 私钥文件
  cert: readFileSync('./cert.pem'), // 证书文件
}

https.createServer(options, (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('HTTPS 连接成功')
}).listen(443, () => {
  console.log('HTTPS 服务器运行在 https://localhost')
})
```
:::

## 六、WebSocket 基础

### 1. 实现实时通信

WebSocket 在 HTTP 握手后升级为全双工连接，服务器可以主动推送数据，适合聊天、实时通知、协同编辑等场景。`ws` 是 Node.js 生态中最成熟的 WebSocket 库。

::: details WebSocket 聊天室服务器
```js
// src/ws-server.js
import { WebSocketServer } from 'ws'
import http from 'http'

// WebSocket 服务复用已有 HTTP 服务器，避免占用额外端口
const server = http.createServer()
const wss = new WebSocketServer({ server })

// 在线用户集合，用于广播消息
const clients = new Set()

wss.on('connection', (ws, req) => {
  clients.add(ws)
  console.log(`新连接，当前在线: ${clients.size}`)

  // 接收客户端消息并广播给所有在线用户
  ws.on('message', (data) => {
    const message = data.toString()
    const payload = JSON.stringify({
      type: 'message',
      content: message,
      time: new Date().toISOString(),
    })

    // 只向连接正常的客户端广播
    for (const client of clients) {
      if (client.readyState === ws.OPEN) {
        client.send(payload)
      }
    }
  })

  ws.on('close', () => {
    clients.delete(ws)
    console.log(`连接断开，剩余在线: ${clients.size}`)
  })

  // 必须处理 error 事件，否则未捕获的错误会导致进程崩溃
  ws.on('error', (err) => {
    console.error('WebSocket 错误:', err)
    clients.delete(ws)
  })

  // 连接后立即发送欢迎消息
  ws.send(JSON.stringify({ type: 'system', content: '已连接到服务器' }))
})

server.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000')
})
```
:::

## 七、最佳实践

1. **生产环境使用框架**：Express、Fastify 等框架提供路由、中间件、错误处理等完善功能，直接使用原生 `http` 模块复杂度高
2. **防止路径穿越**：处理静态文件时始终用 `path.normalize` + 去除前导 `../` 规范化路径
3. **限制请求体大小**：设置合理的上限（如 10MB），防止恶意大请求耗尽内存
4. **设置请求超时**：所有对外的 HTTP 请求必须设置超时，防止慢速响应阻塞程序
5. **统一错误响应格式**：保持 `{ success, error, data }` 等一致的 JSON 结构，便于前端处理

> [!tip]
> Node.js 18+ 内置了 `fetch` API，大多数情况下无需再安装 `axios` 或 `node-fetch`。对于需要连接池、拦截器、自动重试等高级功能的场景，可以考虑 `undici`（Node.js 的官方 HTTP 客户端底层）。
