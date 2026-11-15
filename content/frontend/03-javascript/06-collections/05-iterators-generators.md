---
title: "迭代器与生成器"
tags:
  - JavaScript
  - 迭代器
  - 生成器
  - Symbol.iterator
excerpt: "说明 Symbol.iterator 与 next() 的 value/done 协议、手写可迭代对象的方法，讲解 for...of 的消费过程与提前中断、function* 与 yield 的暂停恢复、yield* 委托，并给出逐次 next 与清理行为的观察页。"
date: 2026-11-15
---

# 迭代器与生成器

`for...of`、展开语法、解构和 `Array.from` 都通过同一个协议取值：对象实现 `Symbol.iterator` 方法，调用后返回一个带 `next()` 的迭代器，`next()` 每次返回 `{ value, done }`。数组、字符串、`Map`、`Set` 都自带这个协议，普通对象没有。

生成器函数用 `function*` 声明，`yield` 把执行停在这里并交出一个值，下次调用 `next()` 从暂停处继续。生成器对象自身就是迭代器，可以直接被 `for...of` 消费；`yield*` 把另一个可迭代对象的值逐个转出。

本篇先讲迭代器协议，再讲 `for...of` 的消费与中断，随后说明生成器与委托，最后用页面逐步核对。

::: info 本篇的范围
本篇讲同步迭代协议与生成器的最小用法，不展开异步生成器与惰性求值库。数组方法与集合的迭代顺序见“数组迭代与高阶方法”和“Map、Set 与 Weak 集合”。
:::

## 一、可迭代对象与迭代器

### 1. Symbol.iterator

可迭代对象在 `Symbol.iterator` 键上提供一个方法，调用后返回迭代器。数组、字符串、`Map`、`Set` 都实现了它，所以能用于展开与 `for...of`；普通对象没有这个键，直接遍历会抛错。

```js
const text = "abc";
const iterator = text[Symbol.iterator]();
console.log(iterator.next()); // { value: "a", done: false }
console.log(iterator.next()); // { value: "b", done: false }
console.log(iterator.next()); // { value: "c", done: false }
console.log(iterator.next()); // { done: true }
```

### 2. next 的 value 与 done

`next()` 返回的对象有两个字段：`value` 是本次取到的值，`done` 表示是否结束。`done` 为 `true` 时迭代结束，`value` 通常是 `undefined`；结束后再次调用仍返回 `done: true`，不会抛错也不会重新开始。

```js
const iterator = [1][Symbol.iterator]();
console.log(iterator.next()); // { value: 1, done: false }
console.log(iterator.next()); // { value: undefined, done: true }
console.log(iterator.next()); // { value: undefined, done: true }
```

### 3. 手写可迭代对象

要实现自定义可迭代对象，返回一个带 `Symbol.iterator` 方法的对象即可，方法内部返回带 `next()` 的迭代器。把当前下标定义在 `Symbol.iterator` 内部，每次 `for...of` 都会新建迭代器，同一个对象可以重复遍历。

```js
function createRange(start, end) {
  return {
    [Symbol.iterator]() {
      let current = start;
      return { next: () => (current < end ? { value: current++, done: false } : { done: true }) };
    },
  };
}
console.log([...createRange(1, 4)]); // [1, 2, 3]
```

## 二、for...of 如何消费迭代器

### 1. 逐个取值直到 done

`for...of` 先调用 `Symbol.iterator` 拿到迭代器，然后反复调用 `next()`，把 `value` 赋给循环变量，直到 `done` 为 `true` 停止。展开语法、解构和 `Array.from` 走的是同一条路径，所以自定义可迭代对象在这些位置都能使用。

```js
const range = {
  [Symbol.iterator]() {
    let current = 1;
    return { next: () => (current <= 3 ? { value: current++, done: false } : { done: true }) };
  },
};
const values = [];
for (const value of range) values.push(value);
console.log(values); // [1, 2, 3]
```

### 2. 每次迭代重新获取迭代器

`for...of` 每次开始时都调用一次 `Symbol.iterator`，拿到新的迭代器。状态保存在迭代器而不是对象上时，同一个对象可以被多次完整遍历；如果状态挂在对象上，第二次遍历会直接结束。

```js
const range = {
  [Symbol.iterator]() {
    let current = 1;
    return { next: () => (current <= 3 ? { value: current++, done: false } : { done: true }) };
  },
};
console.log([...range]); // [1, 2, 3]
console.log([...range]); // [1, 2, 3]
```

### 3. 提前中断与清理

循环里 `break`、`throw` 或提前 `return` 时，`for...of` 会调用迭代器的 `return()` 方法（如果存在），用于释放资源。生成器把清理逻辑写在 `try...finally` 里，`return()` 被调用时 `finally` 会执行。

```js
function* task() {
  try { yield 1; yield 2; } finally { console.log("清理"); }
}
for (const value of task()) {
  if (value === 1) break;
}
// 清理
```

## 三、生成器函数

### 1. function* 与 yield

`function*` 声明的函数调用后不会立即执行函数体，而是返回一个生成器对象。每次 `next()` 执行到下一个 `yield`，把 `yield` 后面的值作为 `value` 返回，函数暂停在这一行；再次 `next()` 从下一行继续。

```js
function* steps() {
  yield 1;
  yield 2;
}
const generator = steps();
console.log(generator.next()); // { value: 1, done: false }
console.log(generator.next()); // { value: 2, done: false }
console.log(generator.next()); // { value: undefined, done: true }
```

### 2. 暂停与恢复

生成器的执行是分段的：两次 `next()` 之间的代码没有运行。把日志放在 `yield` 前后，可以观察到“开始”只在第一次 `next()` 时打印，“继续”只在第二次时打印。这个特性让生成器适合表达需要逐步推进的流程。

```js
function* trace() {
  console.log("开始");
  yield 1;
  console.log("继续");
  yield 2;
}
const generator = trace();
generator.next(); // 开始
generator.next(); // 继续
```

### 3. 作为迭代器使用

生成器对象同时实现 `Symbol.iterator`，且返回自身，因此可以直接被 `for...of`、展开语法和 `Array.from` 消费。循环会一直 `next()` 到 `done`，不需要手动管理状态。

```js
function* steps() {
  yield "a";
  yield "b";
}
console.log([...steps()]); // ["a", "b"]
for (const value of steps()) {
  console.log(value);
}
```

## 四、yield* 与生成器边界

### 1. yield* 委托

`yield*` 把另一个可迭代对象的值逐个转出，相当于在当前位置展开它的全部产出。它可以委托给生成器、数组或字符串，后面的 `yield` 在委托结束后继续；嵌套组合不需要手写循环。

```js
function* inner() {
  yield "a";
  yield "b";
}
function* outer() {
  yield 1;
  yield* inner();
  yield 2;
}
console.log([...outer()]); // [1, "a", "b", 2]
```

### 2. return 的值不参与迭代

生成器里的 `return value` 结束函数，并把 `value` 放进这一次 `next()` 的结果，此时 `done` 为 `true`。`for...of` 和展开语法只收集 `done` 为 `false` 的值，所以 `return` 的值不会出现在结果中。

```js
function* numbers() {
  yield 1;
  yield 2;
  return 3;
}
console.log([...numbers()]); // [1, 2]
```

### 3. 主动 return 与 finally

调用生成器的 `return()` 会立即结束迭代，返回 `{ value: undefined, done: true }`，并执行 `finally` 中尚未运行的清理代码。资源型生成器把关闭逻辑放在 `finally` 里，无论循环正常结束还是被中断都会执行。

```js
function* task() {
  try { yield 1; } finally { console.log("清理"); }
}
const iterator = task();
iterator.next();
console.log(iterator.return()); // { value: undefined, done: true }
```

## 五、从空目录观察迭代器

### 1. 创建页面

新建空目录 `js-iterators`，创建 `index.html`。脚本手写一个可迭代范围对象并逐次调用 `next()`，再展开两次验证重新开始；用生成器记录 `yield` 前后的日志，检查 `return` 值、`yield*` 委托、生成器自身可迭代，以及 `break` 和 `return()` 触发的清理。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>迭代器与生成器观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>迭代器与生成器观察</h1>
  <table id="output">
    <thead><tr><th>表达式</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    function createRange(start, end) {
      return {
        [Symbol.iterator]() {
          let current = start;
          return {
            next() {
              if (current < end) {
                current += 1;
                return { value: current - 1, done: false };
              }
              return { value: undefined, done: true };
            },
          };
        },
      };
    }

    const range = createRange(1, 3);
    const iterator = range[Symbol.iterator]();
    const first = iterator.next();
    const second = iterator.next();
    const third = iterator.next();
    const fourth = iterator.next();
    const firstPass = [...range];
    const secondPass = [...range];
    const hasIteratorMethod = typeof [][Symbol.iterator];

    function* counter() {
      console.log("开始");
      yield 1;
      console.log("继续");
      yield 2;
      return "结束";
    }

    const gen = counter();
    const g1 = gen.next();
    const g2 = gen.next();
    const g3 = gen.next();
    const g4 = gen.next();
    const selfIterable = gen[Symbol.iterator]() === gen;

    function* values() {
      yield 1;
      yield 2;
      return 3;
    }
    const valuesList = [...values()];

    function* inner() {
      yield "a";
      yield "b";
    }
    function* outer() {
      yield 1;
      yield* inner();
      yield 2;
    }
    const delegated = [...outer()];

    let cleanedOnBreak = false;
    function* withCleanup() {
      try {
        yield 1;
        yield 2;
      } finally {
        cleanedOnBreak = true;
      }
    }
    for (const value of withCleanup()) {
      if (value === 1) break;
    }

    let cleanedOnReturn = false;
    function* cleanupOnReturn() {
      try {
        yield 1;
      } finally {
        cleanedOnReturn = true;
      }
    }
    const pending = cleanupOnReturn();
    pending.next();
    const returnResult = pending.return();

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
      if (value === undefined) return "undefined";
      if (Array.isArray(value)) {
        const items = value.map((item) => (item === undefined ? "undefined" : JSON.stringify(item)));
        return "[" + items.join(",") + "]";
      }
      if (value && typeof value === "object" && "done" in value && "value" in value) {
        return "{ value: " + show(value.value) + ", done: " + value.done + " }";
      }
      return JSON.stringify(value);
    }

    const samples = [
      ["typeof [][Symbol.iterator]", hasIteratorMethod, "数组自带迭代方法"],
      ["第一次 next()", first, "返回 value 与 done"],
      ["第二次 next()", second, "每次前进一个值"],
      ["第三次 next()", third, "超出范围后 done 为 true"],
      ["第四次 next()", fourth, "结束后重复返回同一结果"],
      ["第一次 [...range]", firstPass, "for...of 消费到 done"],
      ["第二次 [...range]", secondPass, "每次迭代从头开始"],
      ["生成器第一次 next()", g1, "执行到第一个 yield"],
      ["生成器第二次 next()", g2, "从暂停处继续"],
      ["生成器第三次 next()", g3, "return 的值随之返回"],
      ["生成器第四次 next()", g4, "结束后 value 为 undefined"],
      ["[...values()]", valuesList, "return 的值不参与迭代"],
      ["[...outer()]", delegated, "yield* 把内层逐个转出"],
      ["gen[Symbol.iterator]() === gen", selfIterable, "生成器对象自身可迭代"],
      ["break 后是否执行 finally", cleanedOnBreak, "提前关闭触发清理"],
      ["pending.return()", returnResult, "主动结束迭代"],
      ["return() 后是否执行 finally", cleanedOnReturn, "同样触发清理"],
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

    console.log("first", JSON.stringify(first));
    console.log("third", JSON.stringify(third));
    console.log("g3", JSON.stringify(g3));
    console.log("values", JSON.stringify(valuesList));
    console.log("delegated", JSON.stringify(delegated));
    console.log("cleanup", cleanedOnBreak, cleanedOnReturn);
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有十七行。可迭代范围对象的 `next()` 依次返回 `1`、`2`，第三次得到 `done: true`，第四次结果相同；展开两次都得到 `[1,2]`，说明每次遍历都新建迭代器；生成器前三次 `next()` 返回 `1`、`2` 和 `"结束"`，第四次只剩 `done: true`；`[...values()]` 只有 `[1,2]`；`yield*` 委托得到 `[1,"a","b",2]`；生成器对象自身可迭代；`break` 与 `return()` 都触发了 `finally`。控制台先输出“开始”“继续”，再输出六条结果。

| 表达式 | 结果 | 说明 |
|--------|------|------|
| `typeof [][Symbol.iterator]` | `"function"` | 数组自带迭代方法 |
| 第一次 `next()` | `{ value: 1, done: false }` | 返回 `value` 与 `done` |
| 第二次 `next()` | `{ value: 2, done: false }` | 每次前进一个值 |
| 第三次 `next()` | `{ value: undefined, done: true }` | 超出范围后 `done` 为 `true` |
| 第四次 `next()` | `{ value: undefined, done: true }` | 结束后重复返回同一结果 |
| 第一次 `[...range]` | `[1,2]` | `for...of` 消费到 `done` |
| 第二次 `[...range]` | `[1,2]` | 每次迭代从头开始 |
| 生成器第一次 `next()` | `{ value: 1, done: false }` | 执行到第一个 `yield` |
| 生成器第二次 `next()` | `{ value: 2, done: false }` | 从暂停处继续 |
| 生成器第三次 `next()` | `{ value: "结束", done: true }` | `return` 的值随之返回 |
| 生成器第四次 `next()` | `{ value: undefined, done: true }` | 结束后 `value` 为 `undefined` |
| `[...values()]` | `[1,2]` | `return` 的值不参与迭代 |
| `[...outer()]` | `[1,"a","b",2]` | `yield*` 把内层逐个转出 |
| `gen[Symbol.iterator]() === gen` | `true` | 生成器对象自身可迭代 |
| `break` 后是否执行 `finally` | `true` | 提前关闭触发清理 |
| `pending.return()` | `{ value: undefined, done: true }` | 主动结束迭代 |
| `return()` 后是否执行 `finally` | `true` | 同样触发清理 |

### 3. 失败分支

创建 `not-iterable.html`，对普通对象 `const item = { title: "任务" };` 使用 `for (const value of item)`。对象没有实现 `Symbol.iterator`，Console 显示 `TypeError: item is not iterable`。修复是遍历它的属性（`Object.entries`）或先实现迭代方法。

创建 `bad-iterator.html`，让 `Symbol.iterator` 返回数字 `1`。协议要求返回对象，Console 显示 `TypeError: Result of the Symbol.iterator method is not an object`。创建 `empty-iterator.html`，让同一个方法返回空对象 `{}`，返回的是对象但没有 `next` 方法，Console 显示 `TypeError: undefined is not a function`。

创建 `never-done.html`，让 `next()` 永远返回 `done: false`。手动调用三次都是 `{ value: "下一个", done: false }`，换成 `for...of` 就会无限循环。迭代器必须在合适的时机返回 `done: true`，并在循环内保留退出条件。

## 六、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格十七行与控制台输出与正文一致；`not-iterable.html` 得到 `TypeError: item is not iterable`，`bad-iterator.html` 得到 `TypeError: Result of the Symbol.iterator method is not an object`，`empty-iterator.html` 得到 `TypeError: undefined is not a function`，`never-done.html` 三次 `next()` 均为 `done: false`。五个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有展开异步迭代、生成器与 `for await...of` 的配合、`next(参数)` 向生成器传值以及迭代器在异常路径上的关闭顺序；这些能力需要按目标环境核对。
