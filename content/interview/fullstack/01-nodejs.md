---
title: "Node.js面试题"
category: "面试题"
tags:
  - Node.js
  - 事件循环
  - Stream
excerpt: "围绕 Node.js 的事件循环阶段、nextTick 与微任务顺序、libuv 线程池、CPU 密集任务处理、Stream 背压、CommonJS 与 ESM、中间件模型、未处理异常与优雅停机等面试题，给出可运行的验证代码和边界。"
---

# Node.js面试题

Node.js 用单个 JavaScript 主线程执行业务代码，把网络和文件等 I/O 交给操作系统和 libuv 处理，完成后再把回调放回事件循环。大多数 Node.js 面试题都围绕一个问题：哪些工作会阻塞这个主线程，回调在什么时机执行。

::: info 版本边界
本篇的运行结果在 Node.js 22 LTS 上验证。示例保存为 `.cjs` 文件时按 CommonJS 执行，保存为 `.mjs` 时按 ES 模块执行，两者的微任务顺序有差异，题目中会单独说明。
:::

## 一、事件循环与并发模型

### 1. Node.js 的事件循环有哪些阶段？

**libuv 的事件循环按固定顺序循环执行 timers、pending callbacks、idle/prepare、poll、check 和 close callbacks 六个阶段，每个阶段处理自己的回调队列。**

| 阶段 | 执行的回调 |
|------|------------|
| timers | 到期的 `setTimeout`、`setInterval` |
| pending callbacks | 上一轮延迟到本轮的部分系统 I/O 回调，如 TCP 错误 |
| idle, prepare | 仅供内部使用 |
| poll | 获取新的 I/O 事件并执行大部分 I/O 回调；无事可做时在此等待 |
| check | `setImmediate` |
| close callbacks | `socket.on('close')` 等关闭回调 |

`process.nextTick` 和 Promise 微任务不属于以上任何阶段：每个回调执行完后，Node.js 先清空 nextTick 队列，再清空 Promise 微任务队列，然后才继续事件循环。在 nextTick 回调中递归调用 nextTick 会让事件循环永远无法进入下一阶段，I/O 回调全部饿死。

参考：[Node.js：事件循环、定时器和 process.nextTick()](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)。

### 2. setTimeout、setImmediate、nextTick 和 Promise 的执行顺序是什么？

**同步代码最先执行，然后是 nextTick 队列和 Promise 微任务队列，最后才是事件循环各阶段中的定时器和 setImmediate。** 在空目录创建 `order.cjs` 并执行 `node order.cjs`：

```javascript
setTimeout(() => console.log('timeout'), 0);
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));
console.log('sync');
```

Node.js 22 中输出依次为 `sync`、`nextTick`、`promise`、`timeout`。把同样的代码保存为 `order.mjs` 执行，输出变为 `sync`、`promise`、`nextTick`、`timeout`：ES 模块的顶层代码本身在 Promise 任务中求值，模块执行结束时先继续清空微任务队列，nextTick 队列在其后处理。

在主模块中直接比较 `setTimeout(fn, 0)` 与 `setImmediate`，顺序不确定，取决于进入事件循环时 1 毫秒的定时器是否已经到期。但在 I/O 回调内部注册两者时，`setImmediate` 一定先执行，因为 poll 阶段之后紧接着是 check 阶段，定时器要等到下一轮的 timers 阶段。

参考：[Node.js：process.nextTick()](https://nodejs.org/api/process.html#processnexttickcallback-args)、[Node.js：setImmediate() 与 setTimeout()](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#setimmediate-vs-settimeout)。

### 3. Node.js 是单线程的吗，libuv 线程池负责什么？

**执行 JavaScript 的主线程只有一个，但 Node.js 进程内还有 libuv 线程池、V8 的 GC 和编译线程等。** 网络 I/O 由操作系统的非阻塞接口（epoll、kqueue、IOCP）完成，不占用线程池。

libuv 线程池默认 4 个线程，可通过环境变量 `UV_THREADPOOL_SIZE` 在启动前调整。它负责操作系统没有提供非阻塞接口的工作：大多数 `fs` 文件操作、`dns.lookup()`、`crypto` 中的 `pbkdf2`、`scrypt` 等异步方法以及 `zlib` 压缩。

同时发起 10 个 `crypto.pbkdf2` 异步调用时，只有 4 个并行执行，其余排队等待；若同时还有大量文件读取，它们会争用同一个线程池，表现为文件读取变慢。`dns.lookup` 也走线程池，高并发请求外部域名时可能成为瓶颈。

参考：[Node.js：不要阻塞事件循环或工作线程池](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)。

### 4. CPU 密集型任务如何处理？

**CPU 密集型计算会长时间占用主线程，期间所有请求都无法得到响应，应把计算移出主线程。**

| 方式 | 适用场景 | 说明 |
|------|----------|------|
| `worker_threads` | 同一进程内的 CPU 计算，如图片处理、加解密 | 线程间通过消息传递，`SharedArrayBuffer` 可共享内存 |
| `child_process` | 调用外部程序或隔离不可信计算 | 独立进程，通信成本较高 |
| `cluster` / 多进程部署 | 利用多核处理更多并发请求 | 每个进程仍是单线程，不能加速单个计算 |
| 拆分任务 | 计算可分段 | 用 `setImmediate` 分批执行，让出事件循环 |
| 交给专门服务 | 大规模离线计算 | 通过消息队列异步处理 |

判断主线程是否被阻塞，可以用 `perf_hooks.monitorEventLoopDelay()` 监测事件循环延迟；正常时延迟在毫秒级，出现数百毫秒以上说明有同步计算或同步 I/O 卡住了主线程。常见的意外阻塞包括 `JSON.parse` 巨大字符串、同步的 `fs.readFileSync`、复杂正则回溯。

参考：[Node.js：Worker threads](https://nodejs.org/api/worker_threads.html)、[Node.js：perf_hooks.monitorEventLoopDelay](https://nodejs.org/api/perf_hooks.html#perf_hooksmonitoreventloopdelayoptions)。

## 二、模块与流

### 1. CommonJS 与 ES 模块有什么区别？

**CommonJS 用 `require` 同步加载，导出的是值的拷贝（对象则是同一引用）；ES 模块用 `import` 静态声明依赖，导出的是只读的实时绑定，可以异步加载并支持顶层 `await`。**

| 维度 | CommonJS | ES 模块 |
|------|----------|---------|
| 语法 | `require()`、`module.exports` | `import`、`export` |
| 加载时机 | 运行到 `require` 时同步执行 | 解析阶段建立依赖图，再求值 |
| 导出绑定 | 导出时的值，基本类型不随源模块变化 | 实时绑定，源模块修改后导入方可见 |
| 顶层 `await` | 不支持 | 支持 |
| `__dirname` | 可用 | 用 `import.meta.dirname`（Node.js 20.11 起） |

Node.js 通过文件扩展名和 `package.json` 的 `"type"` 字段决定模块格式：`.mjs` 总是 ES 模块，`.cjs` 总是 CommonJS，`.js` 按最近的 `package.json` 中 `"type"` 判断，默认为 CommonJS。ES 模块可以 `import` CommonJS 模块；Node.js 22.12 起默认允许 `require()` 加载不含顶层 `await` 的同步 ES 模块。

参考：[Node.js：模块，确定模块系统](https://nodejs.org/api/packages.html#determining-module-system)、[Node.js：require() 加载 ES 模块](https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require)。

### 2. Stream 是什么，背压如何处理？

**Stream 把数据分成小块逐步处理，避免一次把整个文件或响应读入内存；背压是指写入方速度跟不上读取方时，让读取方暂停，等缓冲区排空后再继续。**

`writable.write()` 返回 `false` 表示内部缓冲区已超过 `highWaterMark`，此时应停止写入并等待 `'drain'` 事件。忽略返回值持续写入，数据会在内存中无限堆积。`pipeline()` 自动处理背压，并在任意一个流出错时销毁所有流，比手写 `pipe()` 更安全。

在空目录创建 `compress.mjs`，执行 `node compress.mjs` 会把自身压缩为 `compress.mjs.gz`：

```javascript
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';

await pipeline(
  createReadStream(import.meta.filename),
  createGzip(),
  createWriteStream(`${import.meta.filename}.gz`),
);
console.log('compressed');
```

运行后终端输出 `compressed`，目录中出现 `.gz` 文件，`gunzip -c compress.mjs.gz` 能还原出源码。若读取的文件不存在，`pipeline` 返回的 Promise 以 `ENOENT` 拒绝，已创建的写入流会被销毁。

参考：[Node.js：Stream 中的背压](https://nodejs.org/en/learn/modules/backpressuring-in-streams)、[Node.js：stream.pipeline](https://nodejs.org/api/stream.html#streampipelinesource-transforms-destination-options)。

### 3. Express 与 Koa 的中间件模型有什么区别？

**Express 中间件按注册顺序线性执行，通过 `next()` 进入下一个；Koa 的中间件是 `async` 函数，`await next()` 之后的代码在下游全部完成后才执行，形成“洋葱模型”。**

Koa 中统计请求耗时可以写成一个中间件：`await next()` 之前记录开始时间，之后计算耗时并写入响应头，下游的所有处理都被包在中间。Express 要实现同样效果，通常需要监听 `res.on('finish')`。

错误处理也不同：Koa 在最外层中间件 `try { await next() } catch (err) {}` 即可捕获下游所有异步错误。Express 4 中异步路由抛出的 Promise 拒绝不会自动进入错误中间件，需要手动 `next(err)`；Express 5 起会自动把返回 Promise 的处理器的拒绝传给 `next`。

参考：[Express：使用中间件](https://expressjs.com/en/guide/using-middleware.html)、[Express 5：迁移指南](https://expressjs.com/en/guide/migrating-5.html)、[Koa：级联](https://koajs.com/#cascading)。

## 三、稳定性

### 1. 未捕获的异常和未处理的 Promise 拒绝会怎样？

**未捕获的同步异常会让进程退出；Node.js 15 起，未处理的 Promise 拒绝默认也会让进程以错误退出（`--unhandled-rejections=throw`）。**

`process.on('uncaughtException')` 可以在退出前记录日志，但官方明确不建议捕获后继续运行：异常可能发生在任意位置，应用状态已经不可信。正确做法是记录日志后退出，由进程管理器（systemd、PM2、Kubernetes）重启实例。

Promise 链最后要有 `.catch()`，`async` 函数调用要有 `await` 或错误处理；`fireAndForget()` 这类不等待的调用一旦拒绝，就会触发进程退出。

参考：[Node.js：uncaughtException 的正确用法](https://nodejs.org/api/process.html#warning-using-uncaughtexception-correctly)、[Node.js CLI：--unhandled-rejections](https://nodejs.org/api/cli.html#--unhandled-rejectionsmode)。

### 2. Node.js 内存泄漏如何排查？

**先确认内存持续增长且 GC 后不回落，再对比不同时间点的堆快照，找出数量持续增加的对象及其引用链。**

常见泄漏来源包括：以请求参数为键、无上限的全局 Map 缓存；只添加不移除的事件监听器（超过 10 个时 Node.js 会打印 `MaxListenersExceededWarning`）；闭包长期持有大对象；未清除的 `setInterval`。

1. 用 `process.memoryUsage()` 或监控系统观察 `heapUsed` 的趋势。
2. 以 `node --inspect` 启动，在 Chrome DevTools 的 Memory 面板中拍摄多个堆快照，选择 Comparison 视图看增量。
3. 无法连接调试器时，可用 `node --heapsnapshot-signal=SIGUSR2 app.js` 启动，向进程发送信号生成快照，再离线分析。

`--max-old-space-size` 只能调整堆上限，不能修复泄漏；容器中还要让它小于容器内存限制，否则进程会在 V8 抛出内存错误前被系统杀死。

参考：[Node.js：使用堆快照](https://nodejs.org/en/learn/diagnostics/memory/using-heap-snapshot)。

### 3. Node.js 服务如何优雅停机？

**收到 `SIGTERM` 后，先停止接收新连接，等待进行中的请求完成，再关闭数据库连接等资源，最后退出；超过时限仍未完成时强制退出。**

```javascript
process.on('SIGTERM', () => {
  server.close(async () => {          // 不再接收新连接，已有请求处理完后回调
    await db.end();                   // 释放数据库连接池
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref(); // 10 秒兜底
});
```

这段局部代码假定 `server` 是 `http.createServer()` 的实例、`db` 是连接池。早期版本中空闲的 HTTP keep-alive 连接会让 `server.close()` 一直等待；Node.js 19 起 `server.close()` 会同时关闭空闲连接，正在处理请求的连接仍会等到响应结束。在 Kubernetes 中，Pod 被删除时与从 Service 摘除流量是并行发生的，通常在 `preStop` 中等待几秒，避免停机期间仍有新请求转发进来。

参考：[Node.js：server.close](https://nodejs.org/api/http.html#serverclosecallback)、[Kubernetes：Pod 终止](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination)。
