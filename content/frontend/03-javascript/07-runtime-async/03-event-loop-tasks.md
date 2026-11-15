---
title: "事件循环、宏任务与微任务"
tags:
  - JavaScript
  - 事件循环
  - 微任务
  - setTimeout
excerpt: "说明调用栈、任务队列与微任务队列各自存放什么，按同步代码、微任务、任务三个层次解释一轮执行顺序，对照 setTimeout、Promise.then 与 queueMicrotask 的实际日志，并测量长任务对定时器延迟和渲染的影响。"
date: 2026-11-15
---

# 事件循环、宏任务与微任务

JavaScript 在一个线程上执行，同步代码按调用栈顺序运行；异步回调先进入队列等待。任务队列存放 `setTimeout`、事件回调等任务，微任务队列存放 Promise 回调、`queueMicrotask` 等，优先级更高。

一次循环的规则是：执行一个任务（首次为全局脚本），清空微任务队列，然后才取下一个任务。因此 `Promise.then` 总在 `setTimeout` 之前，即使两者都“立即”触发；同步代码也总在两者之前。长任务会占住主线程，期间定时器迟迟不触发，点击和绘制也被推迟。

本篇先说明三个结构，再用日志核对顺序，随后讲微任务与长任务的边界，最后给出观察页。

::: info 本篇的范围
本篇讲浏览器中的事件循环与任务顺序，不讲 Node.js 的完整阶段划分，也不量化帧率。Promise 的组合方法见“回调与 Promise”，`async`/`await` 见“async/await 与异步错误处理”。
:::

## 一、调用栈与两个队列

### 1. 调用栈只放同步调用

调用栈记录正在执行的同步函数。只要栈里还有内容，引擎就不会去处理队列：一段耗时的循环执行期间，定时器回调、点击事件都只能等待。栈清空后，事件循环才开始检查微任务队列和任务队列。

```js
function work() {
  const end = performance.now() + 100;
  while (performance.now() < end) {
    // 同步占用主线程
  }
}
console.log("开始");
work();
console.log("结束"); // 100ms 后才打印
```

### 2. 任务队列

`setTimeout`、`setInterval`、事件回调、网络请求完成等产生的回调进入任务队列。每轮事件循环取出一个任务执行，执行完并不立即取下一个，而是先清空微任务。

```js
setTimeout(() => console.log("任务 A"), 0);
setTimeout(() => console.log("任务 B"), 0);
// 先输出 A，再输出 B，按入队顺序执行
```

### 3. 微任务队列

Promise 的 `then`、`catch`、`finally` 回调和 `queueMicrotask` 注册的函数进入微任务队列。微任务在当前任务结束后立即全部执行，执行顺序与注册顺序一致；微任务执行过程中新加入的微任务也会在同一轮处理完。

```js
queueMicrotask(() => console.log("微任务 1"));
Promise.resolve().then(() => console.log("微任务 2"));
// 微任务 1 → 微任务 2
```

## 二、一轮执行的顺序

### 1. 同步代码先执行完

同步代码属于当前任务，必须执行完才会轮到队列。日志顺序因此是“同步开始、同步结束、微任务、任务”，与注册异步回调的先后无关。理解这一点，就不会把 `setTimeout(fn, 0)` 当作“插队执行”。

```js
console.log("1 同步开始");
setTimeout(() => console.log("5 定时器"), 0);
Promise.resolve().then(() => console.log("4 then"));
console.log("2 同步结束");
// 1 → 2 → 4 → 5
```

### 2. 每个任务之后清空微任务

微任务检查点位于每个任务执行完之后。定时器回调里产生的 Promise 回调，会在同一轮内紧跟着执行，然后才轮到下一个定时器。这让微任务适合处理“当前操作完成后立刻跟进”的逻辑。

```js
setTimeout(() => {
  console.log("任务");
  Promise.resolve().then(() => console.log("任务后的微任务"));
}, 0);
console.log("同步");
// 同步 → 任务 → 任务后的微任务
```

### 3. setTimeout 的延迟不是零

`setTimeout(fn, 0)` 表示尽快入队，而不是立即执行。浏览器对嵌套层级较深的定时器还有最小延迟限制，实际触发要等当前任务和微任务清空。需要“在当前操作后紧接着执行”时用微任务，需要“让出主线程后再执行”时用定时器。

## 三、微任务的边界

### 1. queueMicrotask 的用法

`queueMicrotask(fn)` 显式把一个函数加入微任务队列，不经过 Promise。它与 `Promise.resolve().then(fn)` 的调度时机相同，写法更短；出错时同样会产生未捕获异常，需要在函数内部自行处理。

```js
queueMicrotask(() => console.log("微任务"));
console.log("同步");
// 同步 → 微任务
```

### 2. 微任务中再加微任务

微任务执行期间新增的微任务会排在当前队列尾部，并在同一轮清空阶段继续执行，直到队列为空。因此一条自我调度的微任务链可以在一个检查点内无限延长，期间不会执行任何任务，也不会渲染。

```js
Promise.resolve().then(() => {
  console.log("第一层");
  Promise.resolve().then(() => console.log("第二层"));
});
setTimeout(() => console.log("定时器"), 0);
// 第一层 → 第二层 → 定时器
```

### 3. 微任务链阻塞渲染

微任务链再长也不会让出主线程，因为清空微任务发生在同一轮内。持续用微任务自我调度会让页面卡死：定时器不触发、点击无响应、画面不更新。需要分批处理大量数据时，用 `setTimeout` 或 `requestIdleCallback` 让出控制权，而不是微任务递归。

## 四、长任务与渲染

### 1. 长任务阻塞输入与绘制

浏览器在主线程上轮流执行任务和渲染。一个耗时 200ms 的同步任务结束后，之前排队的定时器才被处理，期间用户的点击、滚动和页面重绘全部延后。页面观察数据中，长任务期间 0ms 定时器的实际延迟接近忙循环的时长。

### 2. 拆分长任务

把一次大计算拆成多个小任务，用定时器在批次之间让出主线程，可以让输入和绘制插进来。拆分会增加总耗时，但响应更及时；具体批次大小要按任务性质和目标设备调整。

```js
function processBatch(items, index) {
  const batch = items.slice(index, index + 100);
  batch.forEach((item) => item);
  if (index + 100 < items.length) {
    setTimeout(() => processBatch(items, index + 100), 0);
  }
}
processBatch(new Array(1000).fill(0), 0);
```

## 五、从空目录观察事件循环

### 1. 创建页面

新建空目录 `js-event-loop`，创建 `index.html`。脚本记录同步日志、`setTimeout`、`queueMicrotask` 与 `Promise.then` 的实际顺序，观察微任务中再注册微任务的执行时机，用 200ms 忙循环测量定时器延迟，并在空闲状态下测量一次 0ms 定时器的延迟。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>事件循环顺序观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>事件循环顺序观察</h1>
  <table id="output">
    <thead><tr><th>观察项</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const order = [];
    order.push("同步开始");
    setTimeout(() => order.push("定时器"), 0);
    queueMicrotask(() => order.push("queueMicrotask"));
    Promise.resolve().then(() => order.push("then"));
    order.push("同步结束");

    const nested = [];
    Promise.resolve().then(() => {
      nested.push("微任务 1");
      Promise.resolve().then(() => nested.push("微任务 2"));
    });
    setTimeout(() => nested.push("任务"), 0);

    const blockStart = performance.now();
    let timerDelay = null;
    setTimeout(() => {
      timerDelay = Math.round(performance.now() - blockStart);
    }, 0);
    const busyUntil = performance.now() + 200;
    while (performance.now() < busyUntil) {
      // 占用主线程，模拟长任务
    }
    setTimeout(render, 300);

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
      if (Array.isArray(value)) {
        const items = value.map((item) => (item === undefined ? "undefined" : JSON.stringify(item)));
        return "[" + items.join(",") + "]";
      }
      return String(value);
    }

    let idleDelay = null;

    function render() {
      const idleStart = performance.now();
      setTimeout(() => {
        idleDelay = Math.round(performance.now() - idleStart);
        fillRows();
      }, 0);
    }

    function fillRows() {
      const microtaskBeforeTimer =
        order.indexOf("then") !== -1 && order.indexOf("then") < order.indexOf("定时器");
      const rows = [
        ["同步与异步的执行顺序", order, "同步代码先执行完"],
        ["嵌套微任务的顺序", nested, "微任务里再加微任务仍在同一轮清空"],
        ["长任务期间定时器的延迟(ms)", timerDelay, "200ms 忙循环阻塞了定时器"],
        ["微任务是否先于定时器", microtaskBeforeTimer, "每个任务之后先清空微任务"],
        ["空闲时 0ms 定时器的延迟(ms)", idleDelay, "定时器至少等待一个任务周期"],
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
      console.log("order", JSON.stringify(order));
      console.log("nested", JSON.stringify(nested));
      console.log("timerDelay", timerDelay);
      console.log("idleDelay", idleDelay);
    }
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面约一秒后，表格应有五行。执行顺序为 `同步开始`、`同步结束`、`queueMicrotask`、`then`、`定时器`；嵌套微任务得到 `微任务 1`、`微任务 2`、`任务`，说明新加入的微任务仍在同一轮清空；长任务期间定时器延迟为 `200` 毫秒；微任务确实先于定时器；空闲时 0ms 定时器的延迟取整后为 `0`，但顺序仍在同步代码之后。控制台四条输出与表格一致。

| 观察项 | 结果 | 说明 |
|--------|------|------|
| 同步与异步的执行顺序 | `["同步开始","同步结束","queueMicrotask","then","定时器"]` | 同步代码先执行完 |
| 嵌套微任务的顺序 | `["微任务 1","微任务 2","任务"]` | 微任务里再加微任务仍在同一轮清空 |
| 长任务期间定时器的延迟（ms） | `200` | 200ms 忙循环阻塞了定时器 |
| 微任务是否先于定时器 | `true` | 每个任务之后先清空微任务 |
| 空闲时 0ms 定时器的延迟（ms） | `0` | 取整后为 0，但仍在同步代码之后 |

### 3. 失败分支

创建 `microtask-chain.html`，用 1000 次自我调度的 Promise 构成微任务链，同时安排一个 0ms 定时器。控制台输出 `定时器执行，此前微任务次数 1000`：整条微任务链跑完，定时器才得到执行。把次数继续调大，页面会长时间无响应，因为微任务之间不给渲染和输入任何机会。

另外两种误解会直接导致错误判断。把 `setTimeout(fn, 0)` 当成同步执行，会让依赖执行顺序的代码在真实环境里错位；把事件循环与事件冒泡混为一谈，则会误以为捕获、冒泡阶段的差异由任务队列产生——冒泡是同一个任务内部的 DOM 事件传播，与队列无关。

## 六、验证记录与边界

以上页面于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格五行与控制台四条输出与正文一致；`microtask-chain.html` 输出 `定时器执行，此前微任务次数 1000`。两个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

定时器延迟是运行时测量值，受机器负载与页面状态影响，`200` 与 `0` 只代表本次运行。本文没有验证其他浏览器、Node.js 的事件循环阶段差异、`requestAnimationFrame` 与渲染的具体时序，以及微任务链在长时间运行下的界面表现；这些内容需要按目标环境核对。
