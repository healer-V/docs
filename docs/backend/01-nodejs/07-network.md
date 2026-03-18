---
title: "Node.js 网络编程进阶"
category: "后端 · Node.js"
tags:
  - Node.js
  - TCP
  - UDP
  - Socket
excerpt: "Node.js net 模块提供 TCP 底层网络编程能力，dgram 模块支持 UDP 通信，结合 cluster 模块可实现多进程负载均衡，适用于构建高性能网络服务。"
date: 2024-01-21
---

# Node.js 网络编程进阶

## 一、TCP 编程

TCP（传输控制协议）是面向连接的可靠传输协议，适合需要保证数据完整性的场景，如 HTTP、数据库通信、文件传输等。Node.js 的 `net` 模块提供了 TCP/IPC 底层 API，是 HTTP 模块的底层基础。

### 1. TCP 服务器

服务器通过 `net.createServer()` 创建，每个新连接会触发回调并传入 `socket` 对象。`socket` 同时是可读和可写流，支持双向通信。建议设置超时时间防止空闲连接占用资源。

::: details TCP 服务器示例
```js
// src/tcp-server.js
import net from 'net'

const server = net.createServer((socket) => {
  const address = `${socket.remoteAddress}:${socket.remotePort}`
  console.log(`新连接: ${address}`)

  // 接收数据（数据以 Buffer 形式到达）
  socket.on('data', (data) => {
    console.log(`收到来自 ${address} 的数据:`, data.toString())

    // 回显数据给客户端
    socket.write(`Echo: ${data}`)
  })

  // 客户端主动关闭连接
  socket.on('end', () => {
    console.log(`${address} 连接关闭`)
  })

  // 处理连接错误（如网络中断），必须监听否则会抛出未捕获异常
  socket.on('error', (err) => {
    console.error(`${address} 连接错误:`, err.message)
  })

  // 30 秒无数据则断开，防止空闲连接占用资源
  socket.setTimeout(30000)
  socket.on('timeout', () => {
    console.log(`${address} 连接超时，断开`)
    socket.destroy()
  })
})

server.listen(8080, '0.0.0.0', () => {
  console.log('TCP 服务器监听 0.0.0.0:8080')
})

server.on('error', (err) => {
  console.error('服务器错误:', err)
})
```
:::

### 2. TCP 客户端

客户端通过 `net.createConnection()` 连接服务器。连接建立后即可收发数据，数据交换完毕后调用 `end()` 发送 FIN 包，告知服务器数据发送完毕。

::: details TCP 客户端示例
```js
// src/tcp-client.js
import net from 'net'

const client = net.createConnection({ host: 'localhost', port: 8080 }, () => {
  console.log('已连接到服务器')
  client.write('Hello, Server!')
})

client.on('data', (data) => {
  console.log('收到响应:', data.toString())
  client.end() // 发送 FIN 包，告知服务器本端数据发送完毕
})

client.on('end', () => {
  console.log('连接已断开')
})

client.on('error', (err) => {
  console.error('连接错误:', err.message)
})
```
:::

### 3. 自定义协议（帧处理）

TCP 是流式传输，没有消息边界——多次发送的数据可能被合并成一个包（粘包），也可能一次发送被拆成多个包（拆包）。解决方案是在应用层定义帧协议，常用方法是在每条消息前加 4 字节长度头。

::: details 长度前缀帧协议
```js
// src/utils/frame-parser.js
// 协议格式：[4 字节大端序长度][JSON 数据内容]

/**
 * 将 JS 对象编码为帧格式（4字节长度 + JSON 内容）
 */
function encodeMessage(data) {
  const content = Buffer.from(JSON.stringify(data), 'utf-8')
  const header = Buffer.alloc(4)
  header.writeUInt32BE(content.length, 0) // 大端序写入长度
  return Buffer.concat([header, content])
}

/**
 * 有状态的帧解析器，处理 TCP 粘包/拆包问题
 * 内部维护一个缓冲区，不断累积数据直到够一帧
 */
class FrameParser {
  #buffer = Buffer.alloc(0)

  /**
   * 喂入新收到的数据块，返回已完整接收的消息数组
   */
  feed(chunk) {
    this.#buffer = Buffer.concat([this.#buffer, chunk])
    const messages = []

    while (this.#buffer.length >= 4) {
      const msgLength = this.#buffer.readUInt32BE(0)

      // 数据不够一帧，等待更多数据
      if (this.#buffer.length < 4 + msgLength) break

      const content = this.#buffer.slice(4, 4 + msgLength)
      messages.push(JSON.parse(content.toString('utf-8')))
      this.#buffer = this.#buffer.slice(4 + msgLength)
    }

    return messages
  }
}

// 服务端集成示例
const server = net.createServer((socket) => {
  const parser = new FrameParser()

  socket.on('data', (chunk) => {
    const messages = parser.feed(chunk)
    for (const msg of messages) {
      console.log('收到完整消息:', msg)
      socket.write(encodeMessage({ ack: true, id: msg.id }))
    }
  })
})
```
:::

## 二、UDP 编程

UDP（用户数据报协议）是无连接协议，不保证数据到达顺序或完整性，但延迟极低，适合实时性要求高但允许少量丢包的场景，如游戏状态同步、视频通话、DNS 查询。

### 1. UDP 服务器

UDP 服务器不维护连接状态，每条消息都携带发送方地址（`rinfo`），需要手动保存地址才能回复。

::: details UDP 服务器示例
```js
// src/udp-server.js
import dgram from 'dgram'

// 创建 UDP socket，'udp4' 表示 IPv4，'udp6' 表示 IPv6
const server = dgram.createSocket('udp4')

server.on('message', (msg, rinfo) => {
  console.log(`收到来自 ${rinfo.address}:${rinfo.port} 的数据: ${msg}`)

  // 直接回复，使用 rinfo 中的地址信息
  const response = Buffer.from(`已收到: ${msg}`)
  server.send(response, rinfo.port, rinfo.address, (err) => {
    if (err) console.error('发送失败:', err)
  })
})

server.on('error', (err) => {
  console.error('服务器错误:', err)
  server.close()
})

server.on('listening', () => {
  const addr = server.address()
  console.log(`UDP 服务器监听 ${addr.address}:${addr.port}`)
})

server.bind(41234)
```
:::

### 2. UDP 客户端

UDP 客户端无需建立连接，直接发送数据报。发送完毕后需监听响应，然后关闭 socket 释放资源。

::: details UDP 客户端示例
```js
// src/udp-client.js
import dgram from 'dgram'

const client = dgram.createSocket('udp4')
const message = Buffer.from('Hello, UDP Server!')

// 发送数据到指定端口和主机
client.send(message, 41234, 'localhost', (err) => {
  if (err) {
    console.error('发送失败:', err)
    client.close()
    return
  }
  console.log('消息已发送')
})

client.on('message', (msg) => {
  console.log('收到响应:', msg.toString())
  client.close() // 接收到响应后关闭 socket
})
```
:::

## 三、多进程与集群

### 1. child_process

`child_process.fork()` 创建 Node.js 子进程，父子进程通过 IPC 通道（`send`/`on('message')`）通信。子进程运行在独立的 V8 实例中，拥有独立的内存空间，适合隔离执行危险操作或充分利用多核 CPU。

::: details 子进程通信示例
```js
// src/main.js
import { fork } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// fork 创建的子进程自动建立 IPC 通道
const child = fork(path.join(__dirname, 'worker.js'))

// 发送任务给子进程
child.send({ type: 'task', data: [1, 2, 3, 4, 5] })

// 接收子进程的计算结果
child.on('message', (result) => {
  console.log('子进程结果:', result)
})

child.on('exit', (code) => {
  console.log('子进程退出，退出码:', code)
})
```

```js
// src/worker.js
// 子进程：监听父进程发来的任务，完成后回传结果
process.on('message', (msg) => {
  if (msg.type === 'task') {
    // 执行 CPU 密集型计算（不影响父进程的事件循环）
    const sum = msg.data.reduce((a, b) => a + b, 0)
    process.send({ type: 'result', sum })
  }
})
```
:::

### 2. Cluster 模块

单个 Node.js 进程只能使用一个 CPU 核心。`cluster` 模块允许创建多个共享同一端口的工作进程，由操作系统负载均衡分发请求，充分利用多核 CPU 的计算能力。

主进程（Primary）负责创建和监控工作进程，工作进程（Worker）负责处理实际请求。

::: details 多进程 HTTP 服务器
```js{5,7}
// src/cluster.js
import cluster from 'cluster'
import http from 'http'
import os from 'os'

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length
  console.log(`主进程 PID: ${process.pid}，启动 ${numCPUs} 个工作进程`)

  // 创建与 CPU 数量相等的工作进程，最大化 CPU 利用率
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }

  // 工作进程崩溃时自动重启，保证服务高可用
  cluster.on('exit', (worker, code, signal) => {
    console.log(`工作进程 ${worker.process.pid} 退出 (code: ${code})，重启中...`)
    cluster.fork()
  })
} else {
  // 每个工作进程独立创建 HTTP 服务器，监听同一端口
  // 操作系统自动将请求分发到空闲进程
  http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      pid: process.pid,    // 可见每次请求由不同进程处理
      message: 'Hello from worker',
    }))
  }).listen(3000)

  console.log(`工作进程 PID: ${process.pid} 已启动`)
}
```
:::

### 3. Worker Threads（工作线程）

Worker Threads 与主线程共享进程内存，通信开销比 `child_process` 更低，适合需要大量数据传递的 CPU 密集型任务。线程间通过 `postMessage` 通信，也可以通过 `SharedArrayBuffer` 共享内存。

::: details 工作线程并行计算示例
```js
// src/main-worker.js
import { Worker } from 'worker_threads'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function runWorker(workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      path.join(__dirname, 'compute-worker.js'),
      { workerData }  // workerData 会被结构化克隆传递给线程
    )
    worker.on('message', resolve)
    worker.on('error', reject)
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`工作线程退出码: ${code}`))
    })
  })
}

// 将大计算任务拆分成两份，并行执行，缩短总耗时
const results = await Promise.all([
  runWorker({ start: 1, end: 1_000_000 }),
  runWorker({ start: 1_000_001, end: 2_000_000 }),
])
console.log('计算结果:', results)
```

```js
// src/compute-worker.js
import { workerData, parentPort } from 'worker_threads'

const { start, end } = workerData
let sum = 0n  // 使用 BigInt 防止大数溢出

for (let i = BigInt(start); i <= BigInt(end); i++) {
  sum += i
}

// 将结果发回主线程
parentPort.postMessage(sum.toString())
```
:::

## 四、进程间通信（IPC）

### 1. Unix Domain Socket

Unix Domain Socket（也叫命名管道）是同机进程间通信的高效方式，比 TCP loopback 更快，因为不经过网络协议栈。适合本机上的微服务通信、守护进程管理等场景。

::: details Unix Socket 服务端与客户端
```js
// src/ipc-server.js
import net from 'net'
import { existsSync, unlinkSync } from 'fs'

const SOCKET_PATH = '/tmp/app.sock'

// 启动前清理旧的 socket 文件，避免 EADDRINUSE 错误
if (existsSync(SOCKET_PATH)) {
  unlinkSync(SOCKET_PATH)
}

const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    try {
      const msg = JSON.parse(data.toString())
      console.log('IPC 消息:', msg)
      socket.write(JSON.stringify({ ack: true, received: msg }))
    } catch {
      socket.write(JSON.stringify({ error: '无效的 JSON' }))
    }
  })
})

server.listen(SOCKET_PATH, () => {
  console.log(`IPC 服务器就绪: ${SOCKET_PATH}`)
})
```

```js
// src/ipc-client.js
import net from 'net'

const SOCKET_PATH = '/tmp/app.sock'

// 连接到 Unix Socket
const client = net.createConnection(SOCKET_PATH, () => {
  console.log('IPC 连接已建立')
  client.write(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
})

client.on('data', (data) => {
  console.log('IPC 响应:', JSON.parse(data.toString()))
  client.end()
})
```
:::

## 五、最佳实践

| 场景 | 推荐方案 | 原因 |
|------|----------|------|
| I/O 密集型多核利用 | Cluster | 多进程共享端口，OS 负载均衡 |
| CPU 密集型计算 | Worker Threads | 共享内存，线程间通信开销低 |
| 隔离执行 / 危险操作 | child_process | 独立进程，崩溃不影响主进程 |
| 本机进程间通信 | Unix Socket | 跳过网络协议栈，延迟极低 |
| 需要可靠传输 | TCP | 保证顺序和完整性 |
| 实时性优先 / 允许丢包 | UDP | 延迟最低，无连接开销 |

> [!warning]
> Cluster 模式下，多个工作进程不共享内存，不能直接共享 Session、缓存等状态，需借助 Redis 等外部存储。同理，`setInterval` 定时任务在每个工作进程都会执行一次，需要额外的分布式锁防止重复执行。
