---
title: "async/await 与异步错误处理"
tags:
  - JavaScript
  - async
  - await
  - 异步错误
excerpt: "说明 async 函数总是返回 Promise、await 在等待处暂停并在微任务中恢复，对照串行 await 与 Promise.all 并行的实测耗时，讲解 try/catch 捕获 rejection、错误向上传播、finally 清理，以及 forEach 中使用 await 不生效的原因。"
date: 2026-11-15
---

# async/await 与异步错误处理

`async` 函数总是返回 Promise：正常返回的值成为 fulfilled 的结果，抛出的异常成为 rejected 的原因。`await` 等待一个 Promise 落定，暂停当前函数，等结果可用后继续执行；暂停期间主线程去处理别的事情，不是阻塞。

`await` 让异步代码看起来像同步代码，`try...catch` 可以直接捕获失败。代价是容易写出串行等待：两次各 50 毫秒的操作依次 `await`，总耗时约 100 毫秒；用 `Promise.all` 同时发起则约 50 毫秒。在 `forEach` 回调里 `await` 不会让外层等待，循环结束后结果还没到。

本篇先说明 `async` 与 `await` 的行为，再讲错误传播与清理，随后处理常见误用，最后用页面核对耗时与顺序。

::: info 本篇的范围
本篇讲 `async`/`await` 的用法与错误处理，不展开模块顶层 `await` 的加载语义，也不讨论请求取消。Promise 的状态与组合方法见“回调与 Promise”，任务调度顺序见“事件循环、宏任务与微任务”。
:::

## 一、async 函数

### 1. 总是返回 Promise

在函数前加 `async`，调用后得到的返回值一定是 Promise，即使函数体里写的是 `return 1`。调用方用 `then` 或 `await` 取结果；函数体同步执行到第一个 `await` 是立即发生的，但结果总是异步交付。

```js
async function getValue() {
  return 1;
}
const result = getValue();
console.log(result instanceof Promise); // true
result.then((value) => console.log(value)); // 1
```

### 2. 返回值与抛出值的区别

`return` 的值成为 fulfilled 的结果，`throw` 的异常成为 rejected 的原因。两者在调用方看来都是 Promise 落定，区别只在于用 `then` 还是 `catch`、用 `await` 还是 `try...catch` 处理。把普通函数改成 `async` 后，原有调用方若仍按同步返回值处理，会拿到 Promise 而不是结果。

```js
async function toNumber(text) {
  const value = Number(text);
  if (Number.isNaN(value)) {
    throw new Error("不是数字");
  }
  return value;
}
toNumber("12").then((value) => console.log(value)); // 12
toNumber("abc").catch((error) => console.log(error.message)); // 不是数字
```

## 二、await 的暂停与恢复

### 1. 暂停在 await 处

执行到 `await` 时，函数把控制权交回调用方，调用方后面的同步代码继续运行。Promise 落定后，函数在微任务中恢复执行。因此“恢复”总排在当前同步代码之后，而不是插入其中。

```js
const order = [];
async function step() {
  order.push("开始");
  await null;
  order.push("恢复");
}
step();
order.push("同步继续");
setTimeout(() => console.log(order), 0); // ["开始", "同步继续", "恢复"]
```

### 2. 串行等待

连续写两个 `await` 时，第二个操作要等第一个完成才开始，总耗时是两者之和。这在后一步依赖前一步结果时是必需的，但在两个操作互不依赖时会白白拉长时间。

```js
const wait = (value, ms) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
async function measure() {
  const start = performance.now();
  await wait("a", 50);
  await wait("b", 50);
  return Math.round(performance.now() - start);
}
measure().then((ms) => console.log(ms)); // 约 100
```

### 3. 并行等待

互不依赖的操作可以同时发起，再用 `await Promise.all` 等待全部结果。两个 50 毫秒的操作并行时，总耗时接近单个操作。注意 `all` 在任一项失败时整体拒绝，需要逐项结果时改用 `allSettled`。

```js
const wait = (value, ms) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
async function measure() {
  const start = performance.now();
  const values = await Promise.all([wait("a", 50), wait("b", 50)]);
  return { elapsed: Math.round(performance.now() - start), values };
}
measure().then((result) => console.log(result.elapsed, result.values)); // 约 50 ["a","b"]
```

## 三、错误处理

### 1. try/catch 捕获 rejection

`await` 一个 rejected 的 Promise 会抛出该原因，可以用普通的 `try...catch` 捕获。这让异步错误和同步错误共用同一套处理结构，不必在每一层写 `catch` 回调。

```js
async function load() {
  try {
    await Promise.reject(new Error("加载失败"));
  } catch (error) {
    console.log("捕获", error.message); // 捕获 加载失败
  }
}
load();
```

### 2. 错误向上传播

`async` 函数内部没有捕获的异常，会让它返回的 Promise 变为 rejected，交给调用方处理。`await` 调用另一个 `async` 函数时，错误沿调用链向上传递，直到某一层捕获；这与同步异常沿调用栈传播的结构一致。

```js
async function inner() {
  throw new Error("内层");
}
async function outer() {
  await inner();
}
outer().catch((error) => console.log(error.message)); // 内层
```

### 3. finally 清理

`try...finally` 在函数返回或抛出前执行 `finally` 块，适合关闭连接、复位状态。`await` 写在 `finally` 里会等清理完成再结束；`finally` 不会改变返回值，除非它自己 `return` 或 `throw`。

```js
async function task() {
  try {
    return "结果";
  } finally {
    console.log("清理");
  }
}
task().then((value) => console.log(value)); // 清理 → 结果
```

### 4. 未等待的调用吞掉错误

调用 `async` 函数却不 `await`、也不挂 `catch` 时，拒绝不会被外层的 `try...catch` 捕获，只能以未处理拒绝的形式暴露。没有监听 `unhandledrejection` 时，错误只会出现在控制台，业务逻辑无从感知。

```js
async function background() {
  throw new Error("后台失败");
}
try {
  background(); // 这里捕获不到
} catch (error) {
  console.log("不会执行到这里");
}
```

## 四、常见误用

### 1. forEach 中的 await

`forEach` 不会等待回调返回的 Promise，循环在第一个 `await` 处就继续迭代并结束。要按顺序等待，用 `for...of`；要并行，用 `map` 加 `Promise.all`。

```js
const log = [];
[1, 2, 3].forEach(async (n) => {
  await new Promise((resolve) => setTimeout(resolve, 20));
  log.push(n);
});
log.push("循环结束");
setTimeout(() => console.log(log), 80); // ["循环结束", 1, 2, 3]
```

### 2. 循环中的串行与并行

`for...of` 加 `await` 是串行执行，适合有顺序依赖或需要限流的场景；`map` 加 `Promise.all` 同时发起所有请求，快但缺少并发上限。批量请求数量大时，同时发起全部请求可能压垮服务端，需要按批处理。

```js
const wait = (value, ms) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
async function loadSerial(ids) {
  const values = [];
  for (const id of ids) values.push(await wait(id, 10)); // 串行：一个接一个
  return values;
}
const loadParallel = (ids) => Promise.all(ids.map((id) => wait(id, 10))); // 并行
loadSerial([1, 2, 3]).then((values) => console.log(values)); // [1, 2, 3]
loadParallel([1, 2, 3]).then((values) => console.log(values)); // [1, 2, 3]
```

## 五、从空目录观察 async/await

### 1. 创建页面

新建空目录 `js-async-await`，创建 `index.html`。脚本记录 `async` 函数的返回类型、`await` 前后的执行顺序，测量串行与并行等待的耗时，验证 `try/catch` 捕获、错误向上传播、`finally` 清理，以及在 `forEach` 回调中 `await` 的实际效果。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>async/await 与错误处理观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>async/await 与错误处理观察</h1>
  <table id="output">
    <thead><tr><th>观察项</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const wait = (value, ms) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
    const fail = (message, ms) => new Promise((resolve, reject) => setTimeout(() => reject(new Error(message)), ms));

    const results = {};
    const order = [];

    async function pauseDemo() {
      order.push("开始");
      await null;
      order.push("恢复");
    }

    async function serialRun() {
      const start = performance.now();
      const first = await wait("a", 50);
      const second = await wait("b", 50);
      return { elapsed: Math.round(performance.now() - start), values: [first, second] };
    }

    async function parallelRun() {
      const start = performance.now();
      const values = await Promise.all([wait("a", 50), wait("b", 50)]);
      return { elapsed: Math.round(performance.now() - start), values };
    }

    async function caughtRun() {
      try {
        await fail("出错了", 5);
      } catch (error) {
        return "捕获:" + error.message;
      }
    }

    async function inner() {
      throw new Error("内层错误");
    }
    async function outer() {
      await inner();
    }

    const cleanup = [];
    async function finallyRun() {
      try {
        return "结果";
      } finally {
        cleanup.push("清理");
      }
    }

    async function main() {
      const pending = serialRun();
      results.returnsPromise = pending instanceof Promise;
      const serial = await pending;
      results.serialElapsed = serial.elapsed;
      results.serialValues = serial.values;

      const parallel = await parallelRun();
      results.parallelElapsed = parallel.elapsed;
      results.parallelValues = parallel.values;

      pauseDemo();
      order.push("同步继续");
      results.pauseOrder = order;

      results.caught = await caughtRun();
      results.propagated = await outer().then(
        () => "没有错误",
        (error) => "外层捕获:" + error.message,
      );

      const value = await finallyRun();
      results.finallyValue = value;
      results.cleanupRan = cleanup;

      const forEachLog = [];
      [1, 2, 3].forEach(async (n) => {
        await wait(null, 20);
        forEachLog.push(n);
      });
      forEachLog.push("forEach 之后");
      results.forEachImmediate = [...forEachLog];
      await wait(null, 80);
      results.forEachLater = [...forEachLog];
    }

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
      if (value === undefined) return "undefined";
      if (Array.isArray(value)) {
        const items = value.map((item) => (item === undefined ? "undefined" : JSON.stringify(item)));
        return "[" + items.join(",") + "]";
      }
      return JSON.stringify(value);
    }

    function render() {
      const rows = [
        ["async 函数是否返回 Promise", results.returnsPromise, "总是返回 Promise"],
        ["await 的暂停顺序", results.pauseOrder, "同步代码先执行"],
        ["串行 await 的耗时(ms)", results.serialElapsed, "两个 50ms 依次等待"],
        ["并行 Promise.all 的耗时(ms)", results.parallelElapsed, "两个 50ms 同时进行"],
        ["串行结果", results.serialValues, "按书写顺序"],
        ["并行结果", results.parallelValues, "按输入顺序"],
        ["try/catch 捕获 rejection", results.caught, "await 让拒绝变成可捕获的异常"],
        ["错误向上传播", results.propagated, "外层 await 拿到拒绝"],
        ["finally 是否执行", results.cleanupRan, "返回前运行清理"],
        ["finally 之后的值", results.finallyValue, "返回值不受影响"],
        ["forEach 结束时的记录", results.forEachImmediate, "回调未被等待"],
        ["80ms 后的记录", results.forEachLater, "等待完成于循环之后"],
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
      console.log("serial", results.serialElapsed, "parallel", results.parallelElapsed);
      console.log("pause", JSON.stringify(results.pauseOrder));
      console.log("caught", results.caught, results.propagated);
      console.log("forEach", JSON.stringify(results.forEachImmediate));
    }

    main().then(render);
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有十二行。`async` 函数返回的是 Promise；`await` 顺序为 `开始`、`同步继续`、`恢复`；串行耗时 `103` 毫秒、并行耗时 `51` 毫秒，结果都是 `["a","b"]`；`try/catch` 得到 `捕获:出错了`，错误向外传播得到 `外层捕获:内层错误`；`finally` 在返回前执行，返回值为 `结果`；`forEach` 结束时只记录了 `forEach 之后`，80 毫秒后才有 `1`、`2`、`3`。控制台四条输出与表格一致。

| 观察项 | 结果 | 说明 |
|--------|------|------|
| `async` 函数是否返回 Promise | `true` | 总是返回 Promise |
| `await` 的暂停顺序 | `["开始","同步继续","恢复"]` | 同步代码先执行 |
| 串行 `await` 的耗时（ms） | `103` | 两个 50ms 依次等待 |
| 并行 `Promise.all` 的耗时（ms） | `51` | 两个 50ms 同时进行 |
| 串行结果 | `["a","b"]` | 按书写顺序 |
| 并行结果 | `["a","b"]` | 按输入顺序 |
| `try/catch` 捕获 rejection | `"捕获:出错了"` | `await` 让拒绝变成可捕获的异常 |
| 错误向上传播 | `"外层捕获:内层错误"` | 外层 `await` 拿到拒绝 |
| `finally` 是否执行 | `["清理"]` | 返回前运行清理 |
| `finally` 之后的值 | `"结果"` | 返回值不受影响 |
| `forEach` 结束时的记录 | `["forEach 之后"]` | 回调未被等待 |
| 80ms 后的记录 | `["forEach 之后",1,2,3]` | 等待完成于循环之后 |

### 3. 失败分支

创建 `swallowed.html`，注册 `unhandledrejection` 监听后调用一个不 `await` 的 `async` 函数：`try { background(); } catch` 不会进入，控制台先输出 `try 块正常结束`，随后输出 `未处理的拒绝 后台失败`。修复是给调用加 `await` 并放进 `try...catch`，或至少挂上 `.catch`。

另一种偏差是把并行误写成串行。两个独立请求各自 `await` 时，总耗时是两者之和；代码没有错误，只是慢。判断依据是实测耗时与依赖关系：没有数据依赖的操作应同时发起。

## 六、验证记录与边界

以上页面于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格十二行与控制台四条输出与正文一致；`swallowed.html` 输出 `try 块正常结束` 与 `未处理的拒绝 后台失败`，同时产生 `Error: 后台失败`。两个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

耗时是运行时测量值，`103` 与 `51` 只代表本次运行，受机器负载影响。本文没有验证其他浏览器和旧版本环境，也没有展开模块顶层 `await`、`for await...of`、请求取消与并发上限控制；这些内容需要按目标环境与具体需求核对。
