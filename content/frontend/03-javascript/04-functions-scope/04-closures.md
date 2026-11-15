---
title: "闭包"
tags:
  - JavaScript
  - 闭包
  - 作用域链
  - 回调
excerpt: "解释闭包的形成条件、函数结束后外层变量为什么仍然可访问，说明计数器与私有数据、工厂函数、循环变量捕获和事件回调中的闭包，并给出可复现的计数器与点击观察页。"
date: 2026-11-15
---

# 闭包

闭包是函数与其定义时所在作用域的组合。函数内部引用了外层变量，并且这个函数在外部被调用或保存下来时，外层变量不会随外层函数结束而消失，闭包因此能保留状态。

闭包让函数拥有私有数据：计数器把 `count` 藏在函数作用域里，只暴露读写方法。它也让回调记住创建时的配置。但同一个外层变量被多个函数共享时，一处修改会影响其他函数；长生命的回调持有不再需要的对象时，还会延长数据的存活时间。

本篇先说明闭包的形成，再介绍状态与私有数据，随后处理循环和事件回调中的闭包，最后用页面核对。

::: info 本篇的范围
本篇讲闭包的形成与常见用途，不展开模块模式、设计模式，也不量化内存占用。内存回收与性能分析见“内存与性能分析”，模块组织见“ES 模块”。
:::

## 一、闭包的形成

### 1. 函数引用外层变量

内层函数读取外层函数的局部变量时，就形成了闭包。关键在于“引用”：函数体里出现外层变量名，执行时沿作用域链找到它。如果内层函数不引用任何外层局部变量，就没有需要保留的状态。

```js
function outer() {
  const message = "外层";
  return function inner() {
    return message;
  };
}
const read = outer();
console.log(read()); // "外层"
```

### 2. 外层结束后仍可访问

`outer()` 返回后，通常它的局部变量应该失效，但 `inner` 仍然引用 `message`，引擎必须保留这个变量。每次调用 `outer()` 都会创建一套新的作用域，返回的函数各自记住自己那一套。

```js
function makeReader(value) {
  return () => value;
}
const readA = makeReader("A");
const readB = makeReader("B");
console.log(readA(), readB()); // A B
```

### 3. 闭包保存的是绑定

闭包保存的是变量绑定，不是复制出来的值。外层变量之后被修改，内层函数读到的是修改后的值。这一点在循环和异步回调中尤其重要。

```js
let count = 0;
function show() {
  return count;
}
count = 5;
console.log(show()); // 5
```

## 二、状态与私有数据

### 1. 计数器

计数器把 `count` 放在 `createCounter` 的作用域内，返回的方法都能访问它。调用 `increment()` 修改的是同一个绑定，因此状态在多次调用之间保留。

```js
function createCounter(start = 0) {
  let count = start;
  return {
    increment() { return ++count; },
    current() { return count; },
  };
}
const counter = createCounter();
counter.increment(); counter.increment();
console.log(counter.current()); // 2
```

### 2. 私有变量

`balance` 不是返回对象的属性，外部无法直接读写，只能通过方法操作。这实现了简单的数据隐藏；返回对象上没有 `balance` 属性，直接读取得到 `undefined`。

```js
function createAccount(balance) {
  return {
    deposit(amount) { balance += amount; return balance; },
    getBalance() { return balance; },
  };
}
const account = createAccount(100);
account.deposit(50);
console.log(account.balance); // undefined
console.log(account.getBalance()); // 150
```

### 3. 工厂函数与独立实例

每次调用工厂函数都会创建新的作用域。不同实例的闭包互不影响，修改一个计数器不会改变另一个。这正是工厂函数比共享全局变量更可靠的地方。

```js
function createGreeter(greeting) {
  return (name) => greeting + "，" + name;
}
const hello = createGreeter("你好");
const hi = createGreeter("嗨");
console.log(hello("Ada")); // "你好，Ada"
console.log(hi("Ada")); // "嗨，Ada"
```

## 三、循环与回调中的闭包

### 1. var 捕获同一个变量

用 `var` 声明循环变量时，整个循环只有一个 `i`。循环中创建的函数都引用这个绑定，循环结束后 `i` 是 `3`，所以每个函数调用都返回 `3`。

```js
const fns = [];
for (var i = 0; i < 3; i++) fns.push(() => i);
console.log(fns[0](), fns[1](), fns[2]()); // 3 3 3
```

### 2. let 每次迭代独立

用 `let` 声明循环变量时，每次迭代都会创建新的绑定。循环中创建的函数分别捕获当次的 `i`，调用时得到 `0`、`1`、`2`。需要为每个元素保留独立状态时，用 `let` 或在循环体内复制一份值。

```js
const fns = [];
for (let i = 0; i < 3; i++) fns.push(() => i);
console.log(fns[0](), fns[1](), fns[2]()); // 0 1 2
```

### 3. 事件回调保存状态

事件回调也是闭包。回调函数引用外层的 `clicks`，每次点击都修改同一个绑定，因此计数能在多次点击之间累加。回调注册后一直存在，直到被移除；它引用的变量和数据也随之一同保留。

```js
const button = document.querySelector("#add");
const output = document.querySelector("#click-count");
let clicks = 0;
button.addEventListener("click", () => {
  clicks++;
  output.textContent = "点击 " + clicks + " 次";
});
```

闭包会延长被引用对象的存活时间。长时间存在的回调如果持有大对象或已移除的 DOM 节点，这些数据无法回收。不再需要回调时，应移除监听或让引用失效。

## 四、从空目录观察闭包

### 1. 创建页面

新建空目录 `js-closures`，创建 `index.html`。页面包含两个计数器、一个工厂函数、`var` 与 `let` 的循环捕获对照，以及一个统计点击次数的按钮。脚本把各次调用的结果写入表格，并在控制台输出五条结果。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>闭包观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>闭包观察</h1>
  <p>
    <button id="add" type="button">点击</button>
    <span id="click-count">点击 0 次</span>
  </p>
  <table id="output">
    <thead><tr><th>表达式</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    function createCounter(start = 0) {
      let count = start;
      return {
        increment() {
          count++;
          return count;
        },
        current() {
          return count;
        },
      };
    }

    function callAll(fns) {
      const out = [];
      for (const fn of fns) out.push(fn());
      return out.join(",");
    }

    function captureVar() {
      const fns = [];
      for (var i = 0; i < 3; i++) fns.push(() => i);
      return callAll(fns);
    }

    function captureLet() {
      const fns = [];
      for (let i = 0; i < 3; i++) fns.push(() => i);
      return callAll(fns);
    }

    function createGreeter(greeting) {
      return (name) => greeting + "，" + name;
    }

    function createPair() {
      let value = 0;
      return {
        add() { value++; },
        get() { return value; },
      };
    }

    const counterA = createCounter();
    const counterB = createCounter(10);
    const firstIncrement = counterA.increment();
    const secondIncrement = counterA.increment();
    const aCurrent = counterA.current();
    counterB.increment();
    const bCurrent = counterB.current();

    const hello = createGreeter("你好");
    const hi = createGreeter("嗨");
    const pair = createPair();
    pair.add();
    pair.add();

    const samples = [
      ["counterA 第一次 increment()", firstIncrement, "返回 1"],
      ["counterA 第二次 increment()", secondIncrement, "状态保留"],
      ["counterA.current()", aCurrent, "同一闭包读到 2"],
      ["counterB.current()", bCurrent, "独立实例为 11"],
      ["counterA.count", counterA.count, "私有变量不可直接访问"],
      ["captureVar()", captureVar(), "var 共享同一个变量"],
      ["captureLet()", captureLet(), "let 每次迭代独立"],
      ["hello(\"Ada\")", hello("Ada"), "工厂函数保存问候语"],
      ["hi(\"Ada\")", hi("Ada"), "另一个工厂实例"],
      ["pair.get()", pair.get(), "两个方法共享 value"],
    ];

    const body = document.querySelector("#output tbody");
    for (const [label, value, extra] of samples) {
      const row = document.createElement("tr");
      for (const text of [label, String(value), extra]) {
        const cell = document.createElement("td");
        cell.textContent = text;
        row.append(cell);
      }
      body.append(row);
    }

    let clicks = 0;
    document.querySelector("#add").addEventListener("click", () => {
      clicks++;
      document.querySelector("#click-count").textContent = "点击 " + clicks + " 次";
    });

    console.log("counterA.current()", aCurrent);
    console.log("captureVar()", captureVar());
    console.log("captureLet()", captureLet());
    console.log("hello", hello("Ada"));
    console.log("pair.get()", pair.get());
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有十行。`counterA` 两次递增依次得到 `1`、`2`，`counterB` 从 `10` 开始递增到 `11`；`counterA.count` 为 `undefined`；`captureVar()` 得到 `3,3,3`，`captureLet()` 得到 `0,1,2`；两个问候函数记住了各自的问候语；`pair.get()` 为 `2`。点击按钮三次，文字从 `点击 0 次` 变为 `点击 3 次`。控制台五条输出与表格一致。

| 表达式 | 结果 | 说明 |
|--------|------|------|
| `counterA` 第一次 `increment()` | `1` | 返回 `1` |
| `counterA` 第二次 `increment()` | `2` | 状态保留 |
| `counterA.current()` | `2` | 同一闭包读到 `2` |
| `counterB.current()` | `11` | 独立实例为 `11` |
| `counterA.count` | `undefined` | 私有变量不可直接访问 |
| `captureVar()` | `3,3,3` | `var` 共享同一个变量 |
| `captureLet()` | `0,1,2` | `let` 每次迭代独立 |
| `hello("Ada")` | `你好，Ada` | 工厂函数保存问候语 |
| `hi("Ada")` | `嗨，Ada` | 另一个工厂实例 |
| `pair.get()` | `2` | 两个方法共享 `value` |

### 3. 失败分支

创建 `var-capture.html`，用 `var` 声明循环变量并在循环中收集箭头函数，循环结束后逐个调用。控制台依次输出 `3`、`3`、`3`，而不是期望的 `0`、`1`、`2`。原因是所有函数共享同一个 `i`，循环结束时它已经是 `3`。修复是把循环变量改成 `let`，或在每次迭代中把当前值复制到新变量。

另一个常见问题是多个方法共享同一个闭包变量。页面中的 `createPair` 两个方法操作同一个 `value`，调用 `add()` 会改变 `get()` 的结果。需要独立状态时，为每个状态创建单独的闭包，而不是共用一份。

## 五、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格十行与控制台五条输出与正文一致；点击按钮三次后文字由 `点击 0 次` 变为 `点击 3 次`；`var-capture.html` 控制台输出三个 `3`。两个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有测量闭包的内存占用或回收时机，没有展开模块模式和异步回调中的闭包；需要判断对象是否被保留时，应使用浏览器内存工具核对。
