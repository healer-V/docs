---
title: "定时器、防抖与节流"
tags:
  - JavaScript
  - setTimeout
  - 防抖
  - 节流
excerpt: "说明 setTimeout 与 setInterval 的返回值与清除方式、实际间隔的漂移与嵌套定时器的最小延迟，解释耗时任务在定时器中的堆积，给出后沿与前沿防抖、固定间隔节流的实现，并用模拟输入对比原始、防抖与节流的调用次数。"
date: 2026-11-15
---

# 定时器、防抖与节流

`setTimeout(fn, ms)` 在至少 `ms` 毫秒后执行一次，`setInterval(fn, ms)` 每隔约 `ms` 毫秒执行一次，两者都返回一个标识，用 `clearTimeout`、`clearInterval` 取消。定时器不保证精确：主线程被占用时会延后，多次嵌套的短定时器还会被强制拉长。

防抖和节流用来限制高频回调的执行次数。防抖把连续触发合并为最后一次（后沿）或第一次（前沿）；节流保证固定间隔内最多执行一次。选择哪一种取决于需要的语义：等用户停手再处理用防抖，持续过程中按频率处理用节流。

本篇先说明定时器的行为与误差，再讲堆积问题，随后给出防抖与节流的实现，最后用模拟输入对比调用次数。

::: info 本篇的范围
本篇讲定时器与限频函数的基本实现，不实现完整的调度器，也不承诺各浏览器精度一致。任务调度顺序见“事件循环、宏任务与微任务”，事件模型见“事件模型与事件委托”。
:::

## 一、setTimeout 与 setInterval

### 1. 返回值与清除

两个函数都返回数值标识，取消时把标识传回对应的清除函数。标识只在当前环境有效；忘记清除会让回调继续执行，或者在已经不需要结果时仍然占用资源。

```js
const id = setTimeout(() => console.log("执行"), 1000);
clearTimeout(id); // 1 秒后不会打印

let count = 0;
const intervalId = setInterval(() => {
  count += 1;
  console.log("第 " + count + " 次");
  if (count === 3) clearInterval(intervalId);
}, 100);
```

### 2. 实际延迟

定时器的参数是最短等待时间，不是精确时间。主线程正在执行长任务、页面正在渲染或浏览器繁忙时，回调都会延后。把 100ms 定时器连续触发几次，实测间隔会在 99 到 101 毫秒之间波动，而不是严格相等。

```js
const stamps = [];
const id = setInterval(() => {
  stamps.push(Math.round(performance.now()));
  if (stamps.length === 5) {
    clearInterval(id);
    console.log(stamps.slice(1).map((value, index) => value - stamps[index]));
  }
}, 100);
// 实测约 [99, 100, 100, 101]
```

### 3. 最小延迟与嵌套限制

浏览器对定时器有最小延迟约束。`setTimeout(fn, 0)` 并不会立即执行，而是要等当前任务与微任务清空；连续嵌套多层后，浏览器还会把延迟提高到约 4 毫秒，避免紧凑的递归定时器占满主线程。实测连续 15 层嵌套时，前六次的间隔接近 0，之后稳定在 5 毫秒左右（取整后的结果）。

```js
const gaps = [];
let depth = 0;
let last = performance.now();
function nest() {
  const now = performance.now();
  gaps.push(Math.round(now - last));
  last = now;
  if (++depth < 15) setTimeout(nest, 0);
}
setTimeout(nest, 0);
```

## 二、定时器的漂移与堆积

### 1. 间隔漂移

`setInterval` 只负责按间隔把回调放进队列，不校正已经发生的延迟。回调执行慢于间隔时，后续触发会排队，实际执行次数少于“总时长 ÷ 间隔”；长时间运行后，累积误差可能明显偏离预期。

### 2. 耗时任务导致堆积

当回调的耗时超过间隔，回调之间几乎没有空隙，形成“刚执行完又立即执行”的连续调用。页面观察中，50ms 间隔、每次耗时 120ms 的任务在 400ms 内只执行了 4 次，而不是 8 次。需要严格间隔时，用 `setTimeout` 在回调末尾安排下一次，或者用递归定时器配合实际耗时判断。

```js
function repeat(task, wait) {
  const run = () => {
    const start = performance.now();
    task();
    const elapsed = performance.now() - start;
    setTimeout(run, Math.max(0, wait - elapsed));
  };
  setTimeout(run, wait);
}
```

### 3. 后台标签页的节流

标签页进入后台后，浏览器会降低定时器频率以节省资源，`setInterval` 的实际间隔可能被拉长到数秒。依赖精确定时的动画、轮询需要考虑到这一点，改用 `requestAnimationFrame`（页面可见时）或调整轮询策略。

## 三、防抖

### 1. 后沿防抖

后沿防抖在事件停止触发 `wait` 毫秒后才执行一次：每次触发都清除上一个定时器并重新计时。适合搜索框输入、窗口尺寸调整这类“只关心最终状态”的场景。模拟 10 次间隔 20ms 的输入，原始回调执行 10 次，防抖后只执行 1 次。

```js
function debounce(fn, wait) {
  let timerId = null;
  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn(...args), wait);
  };
}
```

### 2. 前沿与取消

前沿防抖在第一次触发时立即执行，之后的触发只在安静期结束后才允许再次执行，适合按钮点击、提交这类“立即反馈、避免连点”的场景。无论哪种，都应提供取消方法，在组件销毁或页面卸载时清除定时器。

```js
function debounceLeading(fn, wait) {
  let timerId = null;
  return (...args) => {
    if (timerId === null) fn(...args);
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = null;
    }, wait);
  };
}
```

## 四、节流

### 1. 固定间隔节流

节流保证固定间隔内最多执行一次：记录上次执行时间，未超过间隔的触发直接忽略。与防抖不同，节流在持续触发期间会按频率执行，适合滚动、鼠标移动、拖拽等需要持续反馈的场景。

```js
function throttle(fn, wait) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last < wait) return;
    last = now;
    fn(...args);
  };
}
```

### 2. 选择防抖还是节流

需要“停手后再执行”时用防抖，例如输入校验、自动保存；需要“过程中按频率执行”时用节流，例如滚动位置计算、进度更新。两者都可以加取消方法；页面隐藏或组件销毁时要清理定时器与监听器，否则回调仍会在后台执行。

## 五、从空目录观察定时器

### 1. 创建页面

新建空目录 `js-timers`，创建 `index.html`。脚本用 100ms 间隔的定时器记录连续四次的间隔，用 15 层嵌套的 0ms 定时器观察最小延迟，再用 10 次间隔 20ms 的模拟输入对比原始、后沿防抖与固定间隔节流的调用次数，并检查防抖是否提供取消方法。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>定时器与限制频率观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>定时器与限制频率观察</h1>
  <table id="output">
    <thead><tr><th>观察项</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const results = {};

    const stamps = [];
    const intervalId = setInterval(() => {
      stamps.push(Math.round(performance.now()));
      if (stamps.length === 5) {
        clearInterval(intervalId);
        results.intervalGaps = stamps.slice(1).map((value, index) => value - stamps[index]);
      }
    }, 100);

    const nestedGaps = [];
    let depth = 0;
    let lastStamp = performance.now();
    function nest() {
      const now = performance.now();
      nestedGaps.push(Math.round(now - lastStamp));
      lastStamp = now;
      depth += 1;
      if (depth < 15) {
        setTimeout(nest, 0);
      } else {
        results.nestedGaps = nestedGaps;
      }
    }
    setTimeout(nest, 0);

    function debounce(fn, wait) {
      let timerId = null;
      const wrapped = (...args) => {
        clearTimeout(timerId);
        timerId = setTimeout(() => fn(...args), wait);
      };
      wrapped.cancel = () => clearTimeout(timerId);
      return wrapped;
    }

    function throttle(fn, wait) {
      let last = 0;
      return (...args) => {
        const now = Date.now();
        if (now - last >= wait) {
          last = now;
          fn(...args);
        }
      };
    }

    let rawCount = 0;
    let debouncedCount = 0;
    let throttledCount = 0;

    const onRaw = () => {
      rawCount += 1;
    };
    const onDebounced = debounce(() => {
      debouncedCount += 1;
    }, 100);
    const onThrottled = throttle(() => {
      throttledCount += 1;
    }, 100);

    let bursts = 0;
    const burstId = setInterval(() => {
      onRaw();
      onDebounced();
      onThrottled();
      bursts += 1;
      if (bursts === 10) {
        clearInterval(burstId);
      }
    }, 20);

    setTimeout(() => {
      results.rawCount = rawCount;
      results.debouncedCount = debouncedCount;
      results.throttledCount = throttledCount;
      results.cleared = typeof onDebounced.cancel;
      render();
    }, 900);

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
        ["100ms 间隔的实际间隔(ms)", results.intervalGaps, "连续四次触发的差值"],
        ["嵌套 0ms 定时器的间隔(ms)", results.nestedGaps, "多次嵌套后被拉长"],
        ["原始监听调用次数", results.rawCount, "每个事件都执行"],
        ["防抖后的调用次数", results.debouncedCount, "连续事件只执行一次"],
        ["节流后的调用次数", results.throttledCount, "固定间隔内最多一次"],
        ["防抖是否提供取消方法", results.cleared, "typeof cancel"],
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
      console.log("interval", JSON.stringify(results.intervalGaps));
      console.log("nested", JSON.stringify(results.nestedGaps));
      console.log("counts", results.rawCount, results.debouncedCount, results.throttledCount);
    }
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面约一秒后，表格应有六行。100ms 间隔的实测差值为 `[99,100,100,101]`；15 层嵌套的 0ms 定时器间隔为 `[5,0,0,0,0,0,5,5,5,5,5,5,5,5,5]`，第六次之后被拉长到约 5 毫秒；10 次模拟输入下，原始回调执行 `10` 次，防抖执行 `1` 次，节流执行 `2` 次；防抖提供的取消方法类型为 `function`。控制台三条输出与表格一致。

| 观察项 | 结果 | 说明 |
|--------|------|------|
| 100ms 间隔的实际间隔（ms） | `[99,100,100,101]` | 连续四次触发的差值 |
| 嵌套 0ms 定时器的间隔（ms） | `[5,0,0,0,0,0,5,5,5,5,5,5,5,5,5]` | 多次嵌套后被拉长 |
| 原始监听调用次数 | `10` | 每个事件都执行 |
| 防抖后的调用次数 | `1` | 连续事件只执行一次 |
| 节流后的调用次数 | `2` | 固定间隔内最多一次 |
| 防抖是否提供取消方法 | `"function"` | `typeof cancel` |

### 3. 失败分支

创建 `pileup.html`，用 50ms 间隔的定时器执行每次耗时 120ms 的任务，400ms 后清除。控制台输出 `400ms 内执行次数 4`，远少于按间隔推算的 8 次：回调执行时间超过间隔，触发被推迟而不是排队补发。真实业务中如果任务本身还会等待网络，堆积会更明显，应改用递归 `setTimeout` 或一次性调度。

另外两种问题不会报错。重复调用启动函数而没有清除旧定时器，会让同一次事件触发多次回调，表现为日志成倍出现；页面卸载后没有清理定时器与监听器，回调仍可能执行并访问已经销毁的状态，产生看起来毫无来源的错误。

## 六、验证记录与边界

以上页面于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格六行与控制台三条输出与正文一致；`pileup.html` 输出 `400ms 内执行次数 4`。两个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

定时器的间隔与次数是运行时测量值，受机器负载与浏览器调度影响，`[99,100,100,101]`、`4` 只代表本次运行。本文没有验证其他浏览器与旧版本的定时器精度、后台标签页节流的具体阈值、`requestIdleCallback` 的调度差异，以及节流在前沿与后沿组合下的完整行为；这些内容需要按目标环境核对。
