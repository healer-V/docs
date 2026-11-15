---
title: "页面生命周期与性能观察"
tags:
  - JavaScript
  - 页面生命周期
  - PerformanceObserver
  - 性能
excerpt: "说明 readyState 的 loading、interactive、complete 三个阶段与 DOMContentLoaded、load 的先后关系，defer 与 async 脚本的执行时机，visibilitychange、pageshow 与 pagehide 的用途，以及 performance.now、mark/measure、PerformanceObserver 长任务与 Navigation Timing 的读取方式。"
date: 2026-11-15
---

# 页面生命周期与性能观察

页面的加载有明确的阶段：HTML 解析开始时 `document.readyState` 为 `loading`，解析完成变为 `interactive` 并触发 `DOMContentLoaded`，图片等资源加载完成后变为 `complete` 并触发 `load`。脚本的执行时机取决于它放在哪里、是否带 `defer` 或 `async`。

页面还有可见性状态：切到后台时 `document.visibilityState` 变为 `hidden` 并触发 `visibilitychange`，往返缓存恢复时 `pageshow` 的 `persisted` 为 `true`。性能数据用 `performance` 接口读取，长任务用 `PerformanceObserver` 观察。

本篇先讲加载阶段与脚本时机，再讲可见性与离开事件，随后讲性能数据与渲染节奏，最后用本地服务核对各阶段的实际时间。

::: info 本篇的范围
本篇讲页面生命周期事件与基础性能观测，不展开浏览器渲染流水线、Lighthouse 评分与真实用户监控平台。事件循环与任务队列见“事件循环与任务队列”，内存见“内存管理与垃圾回收”。
:::

## 一、文档加载与脚本执行时机

### 1. readyState 与 DOMContentLoaded

`document.readyState` 有三个取值：`loading` 表示文档仍在解析，`interactive` 表示解析完成、等待子资源，`complete` 表示资源也加载完成。`DOMContentLoaded` 在文档解析完成时触发，此时可以直接查询和修改 DOM，不必等待图片。

```js
console.log(document.readyState); // "complete"，脚本在页面加载后执行
```

把查询 DOM 的代码放在 `DOMContentLoaded` 监听里或 `</body>` 之前，可以避免元素尚未解析导致的 `null`。页面已经在加载完成后执行脚本时，`DOMContentLoaded` 不会再次触发，需要区分“注册时机”与“事件时机”。

### 2. load 与资源

`load` 在图片、样式、字体、iframe 等子资源全部加载后触发。图片较多时 `DOMContentLoaded` 与 `load` 之间可能相隔几百毫秒，把非关键逻辑放在 `load` 里会让首屏交互延迟。需要尽早渲染的内容应在 `DOMContentLoaded` 甚至解析过程中处理。

### 3. defer 与 async

`<script defer src="...">` 在解析完成后、`DOMContentLoaded` 之前按顺序执行，适合依赖 DOM 的脚本；`<script async src="...">` 下载完成就执行，不保证顺序，也不保证在 `DOMContentLoaded` 之前，适合统计、广告这类独立脚本。两者都不阻塞解析。

```html
<script defer src="defer.js"></script>
<script async src="async.js"></script>
```

实测中 `defer.js` 在 `DOMContentLoaded` 之前执行，执行时 `readyState` 为 `interactive`；把 `async.js` 的响应延迟 150 毫秒后，它在 `DOMContentLoaded` 之后才执行，`readyState` 同样是 `interactive`，直到 `load` 才变为 `complete`。

## 二、页面可见性与离开

### 1. visibilitychange

标签页切到后台、窗口最小化或手机锁屏时，`document.visibilityState` 变为 `hidden`，切回时变为 `visible`，每次变化触发 `visibilitychange`。定时器在后台会被节流，轮询、动画与音视频应监听该事件暂停或恢复，而不是一直占用主线程。

```js
console.log(document.visibilityState); // "visible"
document.addEventListener("visibilitychange", () => {
  console.log("变为", document.visibilityState);
});
```

### 2. pageshow 与往返缓存

页面从往返缓存（back/forward cache）恢复时不会重新加载，`load` 不再触发，但会触发 `pageshow`，且 `event.persisted` 为 `true`。首次加载时 `pageshow` 也会触发，`persisted` 为 `false`。依赖一次性初始化的页面要在 `pageshow` 中检查状态并刷新界面。

### 3. pagehide 与 beforeunload

`pagehide` 在页面离开时触发，`event.persisted` 表示是否进入往返缓存，适合保存状态与上报；`beforeunload` 用于提示用户确认离开，浏览器对自定义提示文案有严格限制，且它会阻止往返缓存，非必要不要使用。异步上报在 `pagehide` 中不保证完成，应使用 `navigator.sendBeacon` 或在 `visibilitychange` 变为 `hidden` 时提前发送。

## 三、性能数据读取

### 1. performance.now 与 mark/measure

`performance.now()` 返回相对于 `timeOrigin` 的毫秒数，精度高于 `Date.now()`，且不受系统时间调整影响。`performance.mark` 打点，`measure` 计算两个标记之间的时长，结果出现在 `performance.getEntriesByName` 中。

```js
performance.mark("start");
for (let i = 0; i < 1000; i += 1) { /* 空循环 */ }
performance.mark("end");
performance.measure("loop", "start", "end");
const entry = performance.getEntriesByName("loop")[0];
console.log(entry.duration >= 0); // true
```

### 2. PerformanceObserver 与长任务

`PerformanceObserver` 异步接收性能条目，不阻塞页面。`type: "longtask"` 观察超过 50 毫秒的主线程任务，`buffered: true` 补收观察者创建之前产生的条目。长任务多说明主线程被脚本占住，交互与渲染会排队。

```js
const tasks = [];
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) tasks.push(Math.round(entry.duration));
}).observe({ type: "longtask", buffered: true });
const start = performance.now();
while (performance.now() - start < 200) { /* 繁忙循环 */ }
setTimeout(() => console.log(tasks.length, tasks[tasks.length - 1]), 100);
```

输出 `1 200`：一个约 200 毫秒的长任务。拆分会话、让出主线程或移到 Worker 都能减少长任务。

### 3. Navigation Timing

`performance.getEntriesByType("navigation")[0]` 返回本次导航的计时条目，包含 `domContentLoadedEventEnd`、`loadEventEnd`、`responseEnd` 等字段，单位是毫秒。它在 `load` 事件回调执行时可能还没有写入最终值，读取前应确认时机。

```js
const navigation = performance.getEntriesByType("navigation")[0];
console.log(navigation.loadEventEnd > 0); // true
```

## 四、渲染节奏

### 1. requestAnimationFrame

`requestAnimationFrame` 在浏览器下一次绘制前调用回调，参数是帧时间戳。它比 `setInterval` 更适合动画：浏览器在后台或掉帧时会自动调整，不会在没有绘制机会时堆积回调。需要每帧更新界面时用它，而不是固定间隔的定时器。

```js
requestAnimationFrame((time) => console.log(typeof time)); // "number"
```

### 2. 强制同步布局

在同一个循环里交替读取布局属性与修改样式，会迫使浏览器每轮都重新计算布局，称为布局抖动。`offsetWidth`、`getBoundingClientRect`、`scrollTop` 都会触发同步布局；先批量读取，再批量写入，可以把多次布局合并成一次。

```js
const items = document.querySelectorAll(".item");
const widths = [...items].map((item) => item.offsetWidth);
items.forEach((item, index) => {
  item.style.width = widths[index] + 1 + "px";
});
```

上面的写法先读完所有宽度再统一写入；把读取放回循环内，每次写入后的读取都会触发一次重排。本篇没有对这个差异做基准测试，结论来自布局机制，实际耗时需要按页面测量。

### 3. 帧预算与降级

60 帧每秒意味着每帧约 16.7 毫秒，其中还要留给样式、布局与绘制，脚本可用的时间更少。长任务会直接造成掉帧；动画应优先使用 `transform` 与 `opacity` 这类不触发布局的属性。设备性能差异很大，性能结论必须在目标设备上验证，不能只看开发机。

## 五、从空目录观察生命周期

### 1. 创建服务与页面

新建空目录 `js-lifecycle`，创建 `server.mjs`、`index.html`、`defer.js`、`async.js`。`server.mjs` 托管静态文件，`/slow-image` 延迟 300 毫秒返回一个像素，`/async.js` 延迟 150 毫秒返回脚本。启动后打开 `http://127.0.0.1:8000/`。

```bash
node server.mjs
```

页面在解析开始时记录 `readyState`，在 `DOMContentLoaded` 与 `load` 时记录状态与时间，注册 `pageshow`，随后制造一个 200 毫秒的长任务，并用 `requestAnimationFrame` 统计 100 毫秒内的回调次数，最后把十八项结果写入表格。

::: details 查看 server.mjs 完整内容

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
  ".png": "image/png",
};

const pixel = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function handle(request, response) {
  const url = new URL(request.url, "http://localhost");

  if (url.pathname === "/slow-image") {
    return setTimeout(() => {
      response.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "no-store" });
      response.end(pixel);
    }, 300);
  }

  if (url.pathname === "/async.js") {
    const data = await readFile(join(root, "async.js"));
    return setTimeout(() => {
      response.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" });
      response.end(data);
    }, 150);
  }

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
```

:::

::: details 查看 index.html、defer.js 与 async.js

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>页面生命周期与性能观察</title>
  <link rel="icon" href="data:,">
  <script>
    window.events = [];
    window.events.push(["inline", document.readyState, performance.now()]);
    window.startedAt = performance.now();
  </script>
  <script defer src="defer.js"></script>
  <script async src="async.js"></script>
</head>
<body>
  <h1>页面生命周期与性能观察</h1>
  <img src="/slow-image" alt="延迟返回的像素" width="1" height="1">
  <table id="output">
    <thead><tr><th>观察项</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const results = {};
    results.inlineState = window.events.find((item) => item[0] === "inline")[1];
    results.visibility = document.visibilityState;
    results.timeOriginType = typeof performance.timeOrigin;

    const longTasks = [];
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) longTasks.push(entry.duration);
    });
    observer.observe({ type: "longtask", buffered: true });

    let frames = 0;
    let lastFrameTime = 0;
    let frameTimeGrowing = true;

    document.addEventListener("DOMContentLoaded", () => {
      window.events.push(["dcl", document.readyState, performance.now()]);
      results.domContentLoadedState = document.readyState;
      results.domContentLoadedMs = Math.round(performance.now() - window.startedAt);
    });

    window.addEventListener("pageshow", (event) => {
      results.pageshowPersisted = event.persisted;
    });

    window.addEventListener("load", () => {
      results.loadState = document.readyState;
      results.loadMs = Math.round(performance.now() - window.startedAt);

      const start = performance.now();
      while (performance.now() - start < 200) {
        // 刻意占用主线程，制造一个长任务
      }

      const frameStart = performance.now();
      function tick(time) {
        frames += 1;
        if (time < lastFrameTime) frameTimeGrowing = false;
        lastFrameTime = time;
        if (performance.now() - frameStart < 100) {
          requestAnimationFrame(tick);
        } else {
          render();
        }
      }
      requestAnimationFrame(tick);
    });

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
      return String(value);
    }

    function render() {
      const deferIndex = window.events.findIndex((item) => item[0] === "defer");
      const asyncIndex = window.events.findIndex((item) => item[0] === "async");
      const dclIndex = window.events.findIndex((item) => item[0] === "dcl");
      results.deferState = deferIndex >= 0 ? window.events[deferIndex][1] : "未执行";
      results.asyncState = asyncIndex >= 0 ? window.events[asyncIndex][1] : "未执行";
      results.deferBeforeDcl = deferIndex >= 0 && dclIndex >= 0 ? deferIndex < dclIndex : null;
      results.asyncAfterDcl = asyncIndex >= 0 && dclIndex >= 0 ? asyncIndex > dclIndex : null;

      const navigation = performance.getEntriesByType("navigation")[0];
      results.domContentLoadedEventEnd = Math.round(navigation.domContentLoadedEventEnd);
      results.loadEventEnd = Math.round(navigation.loadEventEnd);

      results.longTaskCount = longTasks.length;
      results.longTaskMax = longTasks.length ? Math.round(Math.max(...longTasks)) : 0;
      results.frameCount = frames;
      results.frameTimeGrowing = frameTimeGrowing;

      const rows = [
        ["内联脚本执行时的 readyState", results.inlineState, "解析尚未完成"],
        ["defer 脚本执行时的 readyState", results.deferState, "解析完成后执行"],
        ["async 脚本执行时的 readyState", results.asyncState, "下载完成即执行"],
        ["defer 是否早于 DOMContentLoaded", results.deferBeforeDcl, "解析完成前执行"],
        ["async 是否晚于 DOMContentLoaded", results.asyncAfterDcl, "延迟下载后才执行"],
        ["DOMContentLoaded 时的 readyState", results.domContentLoadedState, "文档解析完成"],
        ["load 时的 readyState", results.loadState, "资源加载完成"],
        ["DOMContentLoaded 距脚本开始的毫秒", results.domContentLoadedMs, "不含慢图片"],
        ["load 距脚本开始的毫秒", results.loadMs, "等待慢图片"],
        ["document.visibilityState", results.visibility, "当前可见性"],
        ["pageshow 的 persisted", results.pageshowPersisted, "首次加载"],
        ["typeof performance.timeOrigin", results.timeOriginType, "时间基准"],
        ["navigation 的 domContentLoadedEventEnd", results.domContentLoadedEventEnd, "取整毫秒"],
        ["navigation 的 loadEventEnd", results.loadEventEnd, "取整毫秒"],
        ["长任务数量", results.longTaskCount, "超过 50 毫秒的任务"],
        ["最长长任务耗时", results.longTaskMax, "繁忙循环约 200 毫秒"],
        ["100 毫秒内的动画帧回调次数", results.frameCount, "约 60 帧每秒"],
        ["帧时间戳是否递增", results.frameTimeGrowing, "单调时钟"],
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

      console.log("states", results.inlineState, results.deferState, results.asyncState);
      console.log("dcl-load", results.domContentLoadedMs, results.loadMs);
      console.log("navigation", results.domContentLoadedEventEnd, results.loadEventEnd);
      console.log("longtask", results.longTaskCount, results.longTaskMax);
      console.log("frames", results.frameCount, results.frameTimeGrowing);
    }
  </script>
</body>
</html>
```

```js [defer.js]
window.events.push(["defer", document.readyState, performance.now()]);
```

```js [async.js]
window.events.push(["async", document.readyState, performance.now()]);
```

:::

### 2. 读取结果

打开页面后，表格应有十八行。内联脚本执行时 `readyState` 为 `loading`，`defer` 与 `async` 脚本执行时都为 `interactive`；`defer` 的执行记录排在 `DOMContentLoaded` 之前，延迟返回的 `async` 排在之后。`DOMContentLoaded` 时状态为 `interactive`，`load` 时为 `complete`；两者距脚本开始分别为 `3` 与 `307` 毫秒，差额来自延迟 300 毫秒的图片。`visibilityState` 为 `visible`，首次 `pageshow` 的 `persisted` 为 `false`，`timeOrigin` 类型为 `number`。导航计时的两个字段本次为 `16` 与 `520` 毫秒；长任务数量为 `1`、最长约 `200` 毫秒；100 毫秒内收到 `8` 次动画帧回调，帧时间戳递增。控制台五条输出与表格一致。

| 观察项 | 结果 | 说明 |
|--------|------|------|
| 内联脚本执行时的 `readyState` | `"loading"` | 解析尚未完成 |
| `defer` 脚本执行时的 `readyState` | `"interactive"` | 解析完成后执行 |
| `async` 脚本执行时的 `readyState` | `"interactive"` | 下载完成即执行 |
| `defer` 是否早于 `DOMContentLoaded` | `true` | 解析完成前执行 |
| `async` 是否晚于 `DOMContentLoaded` | `true` | 延迟下载后才执行 |
| `DOMContentLoaded` 时的 `readyState` | `"interactive"` | 文档解析完成 |
| `load` 时的 `readyState` | `"complete"` | 资源加载完成 |
| `DOMContentLoaded` 距脚本开始的毫秒 | `3` | 不含慢图片 |
| `load` 距脚本开始的毫秒 | `307` | 等待慢图片 |
| `document.visibilityState` | `"visible"` | 当前可见性 |
| `pageshow` 的 `persisted` | `false` | 首次加载 |
| `typeof performance.timeOrigin` | `"number"` | 时间基准 |
| `navigation` 的 `domContentLoadedEventEnd` | `16` | 取整毫秒 |
| `navigation` 的 `loadEventEnd` | `520` | 取整毫秒 |
| 长任务数量 | `1` | 超过 50 毫秒的任务 |
| 最长长任务耗时 | `200` | 繁忙循环约 200 毫秒 |
| 100 毫秒内的动画帧回调次数 | `8` | 本次运行结果 |
| 帧时间戳是否递增 | `true` | 单调时钟 |

时间数据随机器负载与网络变化：`load` 距开始的时间主要由服务端 300 毫秒延迟决定，动画帧次数在不同运行间会上下浮动。

### 3. 失败分支

打开 `http://127.0.0.1:8000/late-read.html`。页面在 `load` 回调中读取导航计时，`loadEventEnd` 为 `0`，100 毫秒后再读得到 `9`：回调执行时该字段尚未写入最终值。同一页面在 `load` 之后注册 `DOMContentLoaded` 监听，输出为“没有触发”，因为事件已经发生过。

::: details 查看 late-read.html 完整内容

```html [late-read.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>晚注册监听与过早读取的观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>晚注册监听与过早读取的观察</h1>
  <p id="during">未执行</p>
  <p id="later">未执行</p>
  <p id="dcl">未执行</p>
  <script>
    let dclFired = "没有触发";
    window.addEventListener("load", () => {
      const during = performance.getEntriesByType("navigation")[0].loadEventEnd;
      document.getElementById("during").textContent =
        "load 回调中读到 loadEventEnd: " + Math.round(during);

      document.addEventListener("DOMContentLoaded", () => {
        dclFired = "触发了";
      });

      setTimeout(() => {
        const later = performance.getEntriesByType("navigation")[0].loadEventEnd;
        document.getElementById("later").textContent =
          "100 毫秒后读到 loadEventEnd: " + Math.round(later);
        document.getElementById("dcl").textContent =
          "load 之后注册的 DOMContentLoaded 监听: " + dclFired;
      }, 100);
    });
  </script>
</body>
</html>
```

:::

两个失败都源于时机：事件只触发一次，晚注册的监听收不到；性能条目在对应事件结束前没有最终值，过早读取得到 `0`。判断页面是否就绪要读 `readyState` 或监听事件，读取性能字段要等 `load` 之后。

## 六、验证记录与边界

以上页面于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `http://127.0.0.1:8127/` 打开核对，服务端为 Node.js v22.23.4 运行的 `server.mjs`。表格十八行与控制台五条输出与正文一致；`late-read.html` 得到 `loadEventEnd: 0`、100 毫秒后的 `9` 与“没有触发”。全部行内片段在页面脚本中实际执行验证，两个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

时间是环境相关的：毫秒数、动画帧次数与长任务耗时都随机器和负载变化。本文没有验证其他浏览器与旧版本环境，也没有展开往返缓存的实际命中条件、`beforeunload` 对缓存的影响、INP/LCP 等交互与绘制指标、Worker 与主线程的分工，以及布局抖动的时间差基准；这些内容需要按目标环境与监控方案核对。
