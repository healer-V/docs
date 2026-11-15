---
title: "Web Worker 与主线程卸载"
tags:
  - JavaScript
  - Web Worker
  - 消息传递
  - 性能
excerpt: "说明 Worker 的独立线程与消息接口、创建与终止方式、脚本必须同源的限制，讲解 postMessage 的结构化克隆、ArrayBuffer 转移与消息顺序，对照 Worker 中可用与缺失的接口、错误处理与模块 Worker，以及把计算移出主线程的边界与清理方式。"
date: 2026-11-15
---

# Web Worker 与主线程卸载

JavaScript 默认只有一条主线程，页面渲染、事件处理与脚本计算都在这里排队。一段耗时几百毫秒的循环会阻塞交互与绘制，而 Web Worker 提供了另一条线程：Worker 执行计算，通过 `postMessage` 与主线程交换数据，主线程保持可响应。

Worker 运行在独立的全局环境中，没有 `document`、`window` 和 `localStorage`，但可以使用 `fetch`、`IndexedDB`、`WebSocket` 等接口。消息通过结构化克隆复制，`ArrayBuffer` 可以作为可转移对象交出所有权，避免复制大块内存。

本篇先讲 Worker 的创建与限制，再讲消息传递与 Worker 环境，随后讲卸载计算的实践，最后启动本地服务核对消息、克隆、转移与终止。

::: info 本篇的范围
本篇讲专用 Worker（Dedicated Worker）的基本模型与消息用法，不展开 SharedWorker、Service Worker 与工作线程调度细节。异步与事件循环见“事件循环与任务队列”，性能观测见“页面生命周期与性能观察”。
:::

## 一、Worker 的模型与创建

### 1. 独立线程与消息接口

`new Worker(脚本地址)` 创建 Worker，脚本在独立线程中执行。主线程用 `worker.postMessage(data)` 发送消息，用 `worker.onmessage` 接收；Worker 内部用 `self.postMessage(data)` 回复，用 `self.onmessage` 接收。两边只共享消息，不共享变量。

```js
const worker = new Worker("worker.js");
worker.onmessage = (event) => console.log(event.data.type); // "sum"
worker.postMessage({ type: "sum", payload: 100 });
```

### 2. 创建、终止与同源限制

Worker 脚本必须与页面同源，跨源地址在构造时抛 `SecurityError`；`file://` 页面也无法加载 Worker，因此需要 HTTP 服务。`worker.terminate()` 立即结束线程，未完成的计算与后续消息都不会继续，适合取消不再需要的任务。

```js
const worker = new Worker("worker.js");
worker.postMessage({ type: "startTicks" });
let count = 0;
worker.onmessage = (event) => {
  if (event.data.type === "tick") count += 1;
};
setTimeout(() => {
  worker.terminate();
  console.log("已终止", count); // 已终止 2
}, 130);
```

### 3. 主线程与 Worker 的分工

主线程负责 DOM、事件与渲染，Worker 负责纯计算与数据处理。Worker 不能直接修改界面，结果必须回传主线程再更新 DOM。把每个小操作都放进 Worker 并不会更快：创建线程、序列化消息都有成本，只有能明显占住主线程的任务才值得卸载。

## 二、消息传递

### 1. postMessage 与结构化克隆

消息按结构化克隆算法复制，支持对象、数组、`Map`、`Set`、`Date`、`ArrayBuffer` 等，不支持函数、DOM 节点与类实例的方法。克隆发生在调用 `postMessage` 的那一刻，之后再修改原对象不会影响对方收到的数据。

```js
const worker = new Worker("worker.js");
const target = { value: 1 };
worker.onmessage = (event) => console.log(event.data.value); // 1
worker.postMessage({ type: "clone", payload: target });
target.value = 2;
```

### 2. 可转移对象

`postMessage` 的第二个参数列出要转移的对象，`ArrayBuffer` 转移后主线程的 `byteLength` 变为 `0`，所有权交给 Worker，整个过程不复制内存。处理大文件、图像数据与二进制协议时，转移比克隆更省内存与时间；转移后原线程不能再访问该缓冲区。

```js
const worker = new Worker("worker.js");
const buffer = new ArrayBuffer(8);
worker.onmessage = (event) => console.log(event.data.byteLength); // 8
worker.postMessage({ type: "buffer", payload: buffer }, [buffer]);
console.log(buffer.byteLength); // 0
```

### 3. 消息顺序

同一对线程之间的消息按发送顺序到达，连续发送三条消息，Worker 按 `a`、`b`、`c` 的顺序收到并回复。顺序保证只针对同一条通道；多个 Worker 之间、Worker 与主线程的不同通道之间没有全局顺序。

```js
const worker = new Worker("worker.js");
worker.onmessage = (event) => console.log(event.data.value);
worker.postMessage({ type: "echo", payload: "a" });
worker.postMessage({ type: "echo", payload: "b" });
worker.postMessage({ type: "echo", payload: "c" });
```

## 三、Worker 中的环境

### 1. 可用的接口与缺失的 DOM

Worker 的全局对象是 `self`（也是 `DedicatedWorkerGlobalScope`），有 `fetch`、`IndexedDB`、`WebSocket`、`crypto` 和 `setTimeout`，没有 `document`、`window`、`localStorage`。依赖 DOM 或 `localStorage` 的代码不能直接搬进 Worker，需要改成传参或改用 IndexedDB。

```js
const worker = new Worker("worker.js");
worker.onmessage = (event) => {
  console.log(event.data.documentType, event.data.localStorageType, event.data.fetchType);
  // undefined undefined function
};
worker.postMessage({ type: "sum", payload: 1 });
```

### 2. 错误处理

Worker 内未捕获的错误不会抛到主线程的 `try...catch`，而是触发 `worker.onerror`，`event.message` 为 `Uncaught Error: 具体信息`。主线程要注册 `onerror` 记录日志；Worker 内部也应对可预期的失败使用 `try...catch` 后回传错误结构，而不是让线程中断。

```js
const worker = new Worker("worker.js");
worker.onerror = (event) => console.log(event.message); // "Uncaught Error: worker 内部错误"
worker.postMessage({ type: "throw" });
```

脚本地址本身加载失败时同样触发 `onerror`，表现为 Worker 无法启动；这类问题常由路径错误或服务端未提供 `.js` 的 `Content-Type` 引起。

### 3. 模块 Worker

`new Worker(地址, { type: "module" })` 让 Worker 脚本按 ES Module 解析，可以使用 `import` 与顶层 `await`。传统 Worker 用 `importScripts` 同步加载脚本，模块 Worker 不支持 `importScripts`，两种写法不能混用。

```js
const worker = new Worker("module-worker.js", { type: "module" });
worker.onmessage = (event) => console.log(event.data.value); // 42
worker.postMessage({ type: "double", payload: 21 });
```

## 四、把计算移出主线程

### 1. 识别适合卸载的计算

适合卸载的是纯计算：大数组排序与聚合、图像像素处理、加解密、解析大文件、复杂校验。它们不依赖 DOM，输入输出可以序列化或转移。频繁的小任务、需要每帧同步结果的任务不适合 Worker，消息往返的开销会抵消收益。

```js
const worker = new Worker("worker.js");
worker.onmessage = (event) => console.log(event.data.value); // 500500
worker.postMessage({ type: "sum", payload: 1000 });
```

### 2. 大数据与分片

一次性传入超大数组会带来克隆成本，可以分片发送、由 Worker 逐步汇总，或用 `ArrayBuffer` 转移避免复制。分片也让 Worker 能在片间检查取消标志，配合 `terminate()` 或自定义取消消息及时停止。需要进度反馈时，Worker 每完成一片就回传一次进度。

### 3. 生命周期与清理

不再使用时调用 `terminate()`，否则线程与它持有的内存会一直存在；页面卸载时的 Worker 通常会随页面销毁，但单页应用切换视图时要主动清理。创建 Worker 的成本不低，重复任务可以复用一个 Worker，通过消息类型区分操作。

## 五、从空目录观察 Worker

### 1. 创建服务与文件

新建空目录 `js-worker`，创建 `server.mjs`、`index.html`、`worker.js`、`math.js`、`module-worker.js`、`cross-origin.html`。`server.mjs` 用 Node.js 内置模块托管静态文件，并同时监听 `8000` 与 `8001`，后者用于演示跨源限制。启动后打开 `http://127.0.0.1:8000/`。

```bash
node server.mjs
```

页面依次验证计算、主线程响应、克隆、转移、顺序、错误、终止与模块 Worker，并把十五项结果写入表格。

::: details 查看 server.mjs 与 worker.js

```js [server.mjs]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT ?? 8000);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

async function handle(request, response) {
  const url = new URL(request.url, "http://localhost");
  try {
    const file = join(root, url.pathname === "/" ? "index.html" : url.pathname);
    const data = await readFile(file);
    response.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
    response.end(data);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("not found");
  }
}

createServer(handle).listen(port, () => {
  console.log("http://127.0.0.1:" + port + "/");
});
createServer(handle).listen(port + 1);
```

```js [worker.js]
self.onmessage = (event) => {
  const { type, payload } = event.data;

  if (type === "sum") {
    let total = 0;
    for (let i = 1; i <= payload; i += 1) total += i;
    self.postMessage({
      type: "sum",
      value: total,
      documentType: typeof document,
      localStorageType: typeof localStorage,
      fetchType: typeof fetch,
    });
  }

  if (type === "busy") {
    const start = Date.now();
    while (Date.now() - start < payload) {
      // 占用 Worker 线程
    }
    self.postMessage({ type: "busy", done: true });
  }

  if (type === "clone") self.postMessage({ type: "clone", value: payload.value });
  if (type === "echo") self.postMessage({ type: "echo", value: payload });
  if (type === "buffer") self.postMessage({ type: "buffer", byteLength: payload.byteLength });

  if (type === "startTicks") {
    setInterval(() => self.postMessage({ type: "tick" }), 50);
  }

  if (type === "throw") throw new Error("worker 内部错误");
};
```

:::

::: details 查看 index.html、math.js 与 module-worker.js

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>Web Worker 观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>Web Worker 观察</h1>
  <table id="output">
    <thead><tr><th>观察项</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const results = {};

    function request(worker, message, transfer = []) {
      return new Promise((resolve) => {
        function onMessage(event) {
          if (event.data.type === message.type) {
            worker.removeEventListener("message", onMessage);
            resolve(event.data);
          }
        }
        worker.addEventListener("message", onMessage);
        worker.postMessage(message, transfer);
      });
    }

    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function main() {
      const worker = new Worker("worker.js");
      worker.onerror = (event) => {
        results.errorFired = true;
        results.errorMessage = event.message;
      };

      const sum = await request(worker, { type: "sum", payload: 10000000 });
      results.sum = sum.value;
      results.documentType = sum.documentType;
      results.localStorageType = sum.localStorageType;
      results.fetchType = sum.fetchType;

      let ticks = 0;
      const timer = setInterval(() => {
        ticks += 1;
      }, 20);
      await request(worker, { type: "busy", payload: 300 });
      clearInterval(timer);
      results.ticks = ticks;

      const cloneTarget = { value: 1 };
      const clonePromise = request(worker, { type: "clone", payload: cloneTarget });
      cloneTarget.value = 2;
      results.cloneValue = (await clonePromise).value;

      const buffer = new ArrayBuffer(8);
      const bufferPromise = request(worker, { type: "buffer", payload: buffer }, [buffer]);
      results.mainByteLength = buffer.byteLength;
      results.workerByteLength = (await bufferPromise).byteLength;

      const order = [];
      await new Promise((resolve) => {
        const listener = (event) => {
          if (event.data.type === "echo") {
            order.push(event.data.value);
            if (order.length === 3) {
              worker.removeEventListener("message", listener);
              resolve();
            }
          }
        };
        worker.addEventListener("message", listener);
        worker.postMessage({ type: "echo", payload: "a" });
        worker.postMessage({ type: "echo", payload: "b" });
        worker.postMessage({ type: "echo", payload: "c" });
      });
      results.fifo = order.join(",");

      worker.postMessage({ type: "throw" });
      await sleep(200);

      const tickWorker = new Worker("worker.js");
      let tickCount = 0;
      await new Promise((resolve) => {
        tickWorker.onmessage = (event) => {
          if (event.data.type === "tick") {
            tickCount += 1;
            if (tickCount === 3) resolve();
          }
        };
        tickWorker.postMessage({ type: "startTicks" });
      });
      tickWorker.terminate();
      const stoppedAt = tickCount;
      await sleep(200);
      results.terminated = tickCount === stoppedAt;
      results.ticksAfterTerminate = tickCount;

      const moduleWorker = new Worker("module-worker.js", { type: "module" });
      const doubled = await request(moduleWorker, { type: "double", payload: 21 });
      results.moduleValue = doubled.value;
      moduleWorker.terminate();

      let missingFired = false;
      const missingWorker = new Worker("missing-worker.js");
      missingWorker.onerror = () => {
        missingFired = true;
      };
      await sleep(300);
      results.missingError = missingFired;
      missingWorker.terminate();

      worker.terminate();
    }

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
      return String(value);
    }

    main().then(() => {
      const rows = [
        ["1 到 10000000 的和", results.sum, "Worker 中计算"],
        ["计算期间主线程定时器触发次数", results.ticks, "主线程未被阻塞"],
        ["Worker 中 typeof document", results.documentType, "没有 DOM"],
        ["Worker 中 typeof localStorage", results.localStorageType, "没有本地存储"],
        ["Worker 中 typeof fetch", results.fetchType, "可以使用网络接口"],
        ["发送后修改原对象的克隆值", results.cloneValue, "克隆发生在发送时"],
        ["转移后主线程 ArrayBuffer 的 byteLength", results.mainByteLength, "所有权已转出"],
        ["Worker 收到的 ArrayBuffer byteLength", results.workerByteLength, "所有权已转入"],
        ["三条消息的到达顺序", results.fifo, "先进先出"],
        ["Worker 抛错时 onerror 是否触发", results.errorFired, "错误事件"],
        ["onerror 的 message", results.errorMessage, "包含错误文本"],
        ["terminate 后计数是否停止", results.terminated, "不再收到消息"],
        ["terminate 后收到的 tick 总数", results.ticksAfterTerminate, "终止时已收到 3 条"],
        ["模块 Worker 的导入函数结果", results.moduleValue, "21 的两倍"],
        ["加载不存在的 Worker 脚本是否触发 onerror", results.missingError, "脚本加载失败"],
      ];

      const body = document.querySelector("#output tbody");
      for (const [label, value, extra] of rows) {
        const row = document.createElement("tr");
        for (const text of [label, show(value), extra]) {
          const cell = document.createElement("td");
          cell.textContent = text;
          row.append(cell);
        }
        body.append(row);
      }

      console.log("sum", results.sum, results.ticks);
      console.log("clone", results.cloneValue, results.mainByteLength, results.workerByteLength);
      console.log("fifo", results.fifo);
      console.log("error", results.errorFired, results.errorMessage);
      console.log("module", results.moduleValue, results.missingError);
    });
  </script>
</body>
</html>
```

```js [math.js]
export function double(value) {
  return value * 2;
}
```

```js [module-worker.js]
import { double } from "./math.js";

self.onmessage = (event) => {
  if (event.data.type === "double") {
    self.postMessage({ type: "double", value: double(event.data.payload) });
  }
};
```

:::

### 2. 读取结果

打开页面后，表格应有十五行。Worker 算出 1 到 10000000 的和为 `50000005000000`，计算期间主线程定时器触发了 `14` 次，说明主线程没有被阻塞。Worker 中 `document` 与 `localStorage` 的类型都是 `undefined`，`fetch` 是 `function`。发送后修改原对象，Worker 仍收到 `1`；转移后主线程的 `ArrayBuffer` 长度为 `0`，Worker 收到 `8`；三条消息按 `a`、`b`、`c` 到达。Worker 抛错触发 `onerror`，消息为 `Uncaught Error: worker 内部错误`；`terminate()` 后计数停止，终止时共收到 `3` 条 tick。模块 Worker 导入的函数返回 `42`，加载不存在的脚本触发 `onerror`。控制台五条输出与表格一致。

| 观察项 | 结果 | 说明 |
|--------|------|------|
| 1 到 10000000 的和 | `50000005000000` | Worker 中计算 |
| 计算期间主线程定时器触发次数 | `14` | 主线程未被阻塞 |
| Worker 中 `typeof document` | `"undefined"` | 没有 DOM |
| Worker 中 `typeof localStorage` | `"undefined"` | 没有本地存储 |
| Worker 中 `typeof fetch` | `"function"` | 可以使用网络接口 |
| 发送后修改原对象的克隆值 | `1` | 克隆发生在发送时 |
| 转移后主线程 `ArrayBuffer` 的 `byteLength` | `0` | 所有权已转出 |
| Worker 收到的 `ArrayBuffer` `byteLength` | `8` | 所有权已转入 |
| 三条消息的到达顺序 | `"a,b,c"` | 先进先出 |
| Worker 抛错时 `onerror` 是否触发 | `true` | 错误事件 |
| `onerror` 的 `message` | `"Uncaught Error: worker 内部错误"` | 包含错误文本 |
| `terminate` 后计数是否停止 | `true` | 不再收到消息 |
| `terminate` 后收到的 tick 总数 | `3` | 终止时已收到 3 条 |
| 模块 Worker 的导入函数结果 | `42` | 21 的两倍 |
| 加载不存在的 Worker 脚本是否触发 `onerror` | `true` | 脚本加载失败 |

定时器触发次数与 tick 数量取决于机器调度，数值会小幅波动。

### 3. 失败分支

打开 `http://127.0.0.1:8000/cross-origin.html`。页面尝试用另一个端口的地址创建 Worker，构造时抛 `SecurityError: Failed to construct 'Worker': Script at ... cannot be accessed from origin ...`；同一页面用同源地址创建则成功。Worker 脚本必须同源，拼接域名或使用 `file://` 都会在创建阶段失败。

::: details 查看 cross-origin.html 完整内容

```html [cross-origin.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>跨源 Worker 的观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>跨源 Worker 的观察</h1>
  <p id="cross-out">未执行</p>
  <p id="local-out">未执行</p>
  <script>
    const crossOut = document.getElementById("cross-out");
    const otherPort = Number(location.port) + 1;
    try {
      new Worker("http://127.0.0.1:" + otherPort + "/worker.js");
      crossOut.textContent = "没有抛错";
    } catch (error) {
      crossOut.textContent = error.name + ": " + error.message;
    }

    const localOut = document.getElementById("local-out");
    try {
      const worker = new Worker("worker.js");
      localOut.textContent = "同源 Worker 创建成功";
      worker.terminate();
    } catch (error) {
      localOut.textContent = error.name + ": " + error.message;
    }
  </script>
</body>
</html>
```

:::

另一类失败发生在数据传输上：把已有归属的 `ArrayBuffer` 再次转移，或转移后继续在主线程读取，都会失败或得到不可用数据。转移前确认缓冲区不再被其他地方使用。

## 六、验证记录与边界

以上页面于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `http://127.0.0.1:8129/` 打开核对，服务端为 Node.js v22.23.4 运行的 `server.mjs`（第二个端口为 `8130`）。表格十五行与控制台五条输出与正文一致；`cross-origin.html` 得到上述 `SecurityError` 与同源创建成功。全部行内片段在页面脚本中实际执行验证，两个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

定时器次数、tick 数量与计算耗时随机器调度波动，不能当作固定值。本文没有验证其他浏览器与旧版本环境，也没有展开 SharedWorker 与 Service Worker、`MessageChannel` 多通道、Worker 内 IndexedDB 与 `OffscreenCanvas`、SAB（共享内存）与跨源隔离要求、Worker 池与任务队列实现；这些内容需要按目标环境核对。
