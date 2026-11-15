---
title: "执行上下文与调用栈"
tags:
  - JavaScript
  - 执行上下文
  - 调用栈
  - 递归
excerpt: "说明全局上下文与函数上下文各自保存什么、每次调用如何建立独立变量环境，用进入与离开日志展示调用栈的压入与弹出，通过 Error.stack 观察栈帧顺序，并解释递归终止条件缺失时的 RangeError 与恢复边界。"
date: 2026-11-15
---

# 执行上下文与调用栈

代码运行时，引擎为全局代码建立一个执行上下文，为每次函数调用再建立一个。上下文里保存这次执行需要的变量：参数、局部变量和函数声明。函数返回后上下文销毁，下一处同名变量属于另一次调用。

函数调用按后进先出的顺序记录在调用栈上：被调用的函数压栈，返回时弹栈。嵌套调用时，内层先执行完，外层才能继续。栈的深度有限，递归没有终止条件时，栈被填满会抛 `RangeError: Maximum call stack size exceeded`。

本篇先说明上下文的构成，再用日志观察栈的压入与弹出，随后处理递归与溢出，最后用页面核对。

::: info 本篇的范围
本篇讲执行上下文与调用栈的同步行为，不讲任务队列与 Promise 的调度，那部分见“事件循环、宏任务与微任务”。调试器的断点操作见“调试与 DevTools”，本篇只通过代码输出观察栈帧。
:::

## 一、执行上下文

### 1. 全局上下文

脚本开始执行时先建立全局上下文。顶层声明的变量和函数成为全局对象或全局词法环境的一部分，页面中 `var` 和函数声明挂在 `window` 上，`let`、`const` 存在全局词法环境中，不成为 `window` 的属性。全局上下文在页面关闭前一直存在。

```js
var legacy = "var 声明";
const modern = "const 声明";
console.log(window.legacy); // "var 声明"
console.log(window.modern); // undefined
```

### 2. 函数上下文

每次函数调用都会新建一个函数上下文，里面存放这次调用的参数、局部变量和内部函数。变量查找从当前上下文开始，找不到时沿作用域链向外层查找，直到全局上下文。

```js
const suffix = "！";
function greet(name) {
  const message = "你好，" + name + suffix;
  return message;
}
console.log(greet("Ada")); // "你好，Ada！"
```

### 3. 每次调用独立的环境

同一个函数调用两次，得到两个互不影响的上下文。参数和局部变量各存一份，第二次调用看不到第一次的值。这也是闭包能够保存各自状态的前提。

```js
function makeGreeting(name) {
  const message = "你好，" + name;
  return message;
}
console.log(makeGreeting("Ada")); // "你好，Ada"
console.log(makeGreeting("Bob")); // "你好，Bob"
```

## 二、调用栈

### 1. 压入与弹出

调用函数时，引擎把这次调用的上下文压入调用栈顶；函数返回时弹出，控制权交回调用者。栈顶永远是正在执行的函数，栈底的全局上下文最后才结束。栈的状态决定了“当前执行到哪里、返回后回到哪里”。

```js
function inner() {
  console.log("inner");
}
function outer() {
  console.log("outer 前");
  inner();
  console.log("outer 后");
}
outer(); // outer 前 → inner → outer 后
```

### 2. 嵌套调用的顺序

嵌套调用时，栈依次压入 `outer`、`inner`，`inner` 先执行完并弹出，控制权回到 `outer` 继续执行后面的语句。日志顺序因此呈现“进入、进入、离开、离开”的结构，而不是两个函数交替执行。

```js
function a() {
  console.log("a 进入");
  b();
  console.log("a 离开");
}
function b() {
  console.log("b 进入");
  console.log("b 离开");
}
a();
```

### 3. 从错误信息看栈帧

抛出错误时，`error.stack` 记录从出错位置到最外层的调用链，第一行是错误类型与信息，之后每一行对应一个栈帧，最近的调用在最前。排查“谁调用了这个函数”时，栈帧比单条日志更有用。

```js
function capture() {
  return new Error("追踪").stack;
}
function middle() {
  return capture();
}
const stack = middle();
console.log(stack.split("\n").slice(0, 3));
// ["Error: 追踪", "    at capture (...)", "    at middle (...)"]
```

## 三、递归与栈溢出

### 1. 递归的终止条件

递归是函数调用自身，每一层都会新增一个上下文。必须有终止条件让某一层直接返回，栈才会逐层弹出；缺少终止条件时调用永不结束，栈持续增长直到空间耗尽。

```js
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
console.log(factorial(5)); // 120
```

### 2. RangeError 与恢复

栈满时引擎抛出 `RangeError: Maximum call stack size exceeded`，这次调用链全部结束。用 `try...catch` 捕获后可以继续执行，但已经没有可用的栈空间记录，无法从出错的那一层继续。上面的 `factorial` 用 `n <= 1` 作为终止条件，任何小于等于 `1` 的输入都会直接返回；如果写成 `n === 0`，传入负数就会越过终止条件，一直递归到溢出。

```js
let depth = 0;
function dive() { depth += 1; dive(); }
try {
  dive();
} catch (error) {
  console.log(error.name, depth); // RangeError 10290
}
```

其中的 `10290` 是本文观察页的实测值，深度上限随引擎、环境与页面运行状态变化。

### 3. 尾调用优化不可依赖

递归函数的最后一句话如果只是调用自身，形式上是尾调用，但 JavaScript 规范并未要求引擎做尾调用优化，V8 等实现没有启用。不要依靠这种写法降低栈深度；层数可能很深时改用循环或显式维护的栈。

## 四、从空目录观察调用栈

### 1. 创建页面

新建空目录 `js-call-stack`，创建 `index.html`。脚本记录嵌套调用的进入与离开顺序、调用前后的语句顺序、两次调用的参数、递归结果，再捕获栈溢出时的错误类型、错误信息与实测深度，并拆分 `Error.stack` 取出前三个栈帧的函数名。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>执行上下文与调用栈观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>执行上下文与调用栈观察</h1>
  <table id="output">
    <thead><tr><th>表达式</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const trace = [];

    function inner() {
      trace.push("inner 进入");
      trace.push("inner 离开");
    }

    function outer() {
      trace.push("outer 进入");
      inner();
      trace.push("outer 离开");
    }

    outer();

    const sequence = [];
    function step() {
      sequence.push("函数体");
    }
    sequence.push("调用前");
    step();
    sequence.push("调用后");

    function makeGreeting(name) {
      const message = "你好，" + name;
      return message;
    }
    const greetings = [makeGreeting("Ada"), makeGreeting("Bob")];

    function factorial(n) {
      if (n <= 1) return 1;
      return n * factorial(n - 1);
    }
    const factorialFive = factorial(5);

    function capture() {
      return new Error("追踪").stack;
    }
    function middle() {
      return capture();
    }
    function topCall() {
      return middle();
    }
    const stackLines = topCall().split("\n");
    const stackHead = stackLines[0];
    const frameNames = stackLines.slice(1, 4).map((line) => {
      const match = /at (\w+)/.exec(line.trim());
      return match ? match[1] : line.trim();
    });

    let maxDepth = 0;
    let overflow = null;
    function dive() {
      maxDepth += 1;
      dive();
    }
    try {
      dive();
    } catch (error) {
      overflow = error;
    }

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
      if (Array.isArray(value)) {
        const items = value.map((item) => (item === undefined ? "undefined" : JSON.stringify(item)));
        return "[" + items.join(",") + "]";
      }
      if (value instanceof Error) return value.name;
      return String(value);
    }

    const samples = [
      ["嵌套调用的日志顺序", trace, "内层返回后外层才继续"],
      ["调用前后的顺序", sequence, "调用是同步的"],
      ["两次调用的参数", greetings, "每次调用有独立环境"],
      ["factorial(5)", factorialFive, "递归逐层返回"],
      ["递归深度上限", maxDepth, "本页实测值"],
      ["溢出的错误类型", overflow.name, "栈空间耗尽"],
      ["溢出的错误信息", overflow.message, "浏览器给出的描述"],
      ["stack 的第一行", stackHead, "错误类型与信息"],
      ["stack 的第二帧", frameNames[0], "最近的一次调用"],
      ["stack 的第三帧", frameNames[1], "调用者"],
      ["stack 的第四帧", frameNames[2], "更外层的调用者"],
    ];

    const body = document.querySelector("#output tbody");
    for (const [label, value, extra] of samples) {
      const row = document.createElement("tr");
      for (const text of [label, show(value), extra]) {
        const cell = document.createElement("td");
        cell.textContent = text;
        row.append(cell);
      }
      body.append(row);
    }

    console.log("trace", trace.join(" → "));
    console.log("sequence", sequence.join(" → "));
    console.log("factorial", factorialFive);
    console.log("depth", maxDepth);
    console.log("overflow", String(overflow));
    console.log("frames", frameNames.join(" → "));
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有十一行。嵌套日志是 `outer 进入`、`inner 进入`、`inner 离开`、`outer 离开`；调用前后的顺序是 `调用前`、`函数体`、`调用后`；两次调用各自得到带不同名字的问候；`factorial(5)` 为 `120`；递归实测深度为 `10290`；溢出错误类型为 `RangeError`，信息为 `Maximum call stack size exceeded`；`stack` 依次给出 `capture`、`middle`、`topCall` 三帧。控制台六条输出与表格一致。

| 表达式 | 结果 | 说明 |
|--------|------|------|
| 嵌套调用的日志顺序 | `["outer 进入","inner 进入","inner 离开","outer 离开"]` | 内层返回后外层才继续 |
| 调用前后的顺序 | `["调用前","函数体","调用后"]` | 调用是同步的 |
| 两次调用的参数 | `["你好，Ada","你好，Bob"]` | 每次调用有独立环境 |
| `factorial(5)` | `120` | 递归逐层返回 |
| 递归深度上限 | `10290` | 本页实测值 |
| 溢出的错误类型 | `"RangeError"` | 栈空间耗尽 |
| 溢出的错误信息 | `"Maximum call stack size exceeded"` | 浏览器给出的描述 |
| `stack` 的第一行 | `"Error: 追踪"` | 错误类型与信息 |
| `stack` 的第二帧 | `"capture"` | 最近的一次调用 |
| `stack` 的第三帧 | `"middle"` | 调用者 |
| `stack` 的第四帧 | `"topCall"` | 更外层的调用者 |

### 3. 失败分支

创建 `overflow.html`，写入没有终止条件的递归：`function dive() { dive(); } dive();`。调用栈持续增长直到耗尽，Console 显示 `RangeError: Maximum call stack size exceeded`，脚本中止，后面的代码不再执行。修复方式是补上终止条件，或把递归改写成循环。

另一种常见误解是把调用栈与任务队列混为一谈。调用栈只记录“正在执行的同步调用”，异步回调不会出现在当前栈里，它们在同步代码清空后才被调度执行。看到 `setTimeout` 的回调报错时，栈里只有回调自身的调用链，找不到最初安排它的位置。

## 五、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格十一行与控制台六条输出与正文一致；`overflow.html` 得到 `RangeError: Maximum call stack size exceeded`。两个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

递归深度上限依赖引擎、调用栈上已占用的空间与具体页面，本页的 `10290` 只代表这次运行的结果，不能当作固定值。本文也没有验证其他浏览器、尾调用优化的实现差异与 DevTools 断点面板的具体交互；这些内容需要按目标环境核对。
