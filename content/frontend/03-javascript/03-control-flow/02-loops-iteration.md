---
title: "循环与迭代"
tags:
  - JavaScript
  - 循环
  - 迭代
  - for...of
excerpt: "说明 for、while、do...while、for...of 与 for...in 的执行方式与适用对象，解释循环变量作用域、for...in 遍历数组得到字符串键的问题，并给出可复现的循环观察页。"
date: 2026-11-15
---

# 循环与迭代

循环重复执行一段代码，直到条件不再成立。`for` 把初始化、条件和更新写在一行，适合已知次数的遍历；`while` 只写条件，适合次数不确定的重复；`do...while` 先执行再判断，至少执行一次。

遍历集合时，`for...of` 按值迭代可迭代对象，`for...in` 枚举对象的属性名。两者目的不同：数组和字符串用 `for...of`，普通对象用 `for...in`。把 `for...in` 用在数组上，拿到的是字符串键而不是值。

本篇先说明四种循环的写法，再对照两种遍历方式，最后用页面核对各循环的输出和循环变量作用域。

::: info 本篇的范围
本篇讲基本循环语法，不展开生成器、自定义迭代器和 `map`、`filter` 等数组方法。迭代器协议见“迭代器与生成器”，数组方法见“数组方法”。
:::

## 一、for 循环

### 1. 三段表达式

`for` 的括号内分三段：初始化、继续条件和每次迭代后的更新。条件为真时执行循环体，为假时结束。三段都可以省略，但省略条件会变成无限循环。

```js
const items = ["a", "b", "c"];
for (let i = 0; i < items.length; i++) {
  console.log(i, items[i]);
}
```

### 2. 循环变量作用域

用 `let` 声明的循环变量只在循环内有效，循环结束后无法访问。每次迭代都会创建新的绑定，因此循环内创建的函数捕获的是当次的值，而不是循环结束后的最终值。

```js
const fns = [];
for (let i = 0; i < 3; i++) fns.push(() => i);
console.log(fns[0](), fns[1](), fns[2]()); // 0 1 2
```

如果改用 `var`，所有函数捕获同一个变量，调用时都得到 `3`。需要保留每次迭代的值时，用 `let`。

### 3. 遍历数组的索引与值

`for` 适合需要下标的场景，例如同时读取当前元素和前一个元素。下标从 `0` 到 `length - 1`；条件写成 `i <= items.length` 会多执行一次，得到 `undefined`。

```js
const items = ["a", "b"];
for (let i = 0; i < items.length; i++) {
  const previous = i > 0 ? items[i - 1] : null;
  console.log(i, items[i], previous);
}
```

## 二、while 与 do...while

### 1. while 先判断

`while` 在每次迭代前判断条件，条件一开始就为假时，循环体一次也不执行。适合读取队列、等待状态变化等次数不确定的重复。

```js
let n = 3;
while (n > 0) {
  console.log(n);
  n--;
}
```

### 2. do...while 至少执行一次

`do...while` 先执行循环体，再判断条件。即使条件一开始为假，循环体也会执行一次。适合“先做一次，再决定是否继续”的流程。

```js
let count = 0;
let n = 0;
do { count++; } while (n < 0);
console.log(count); // 1
```

### 3. 循环条件必须变化

`while` 的条件依赖循环体内的修改。如果忘记更新变量，条件永远成立，页面会一直卡在循环里，标签页无响应。写循环时先确认哪个变量推动条件变化，以及它在哪一行被修改。

::: warning 无限循环会冻结页面
在浏览器主线程中，无法结束的循环会阻塞渲染和事件处理，页面表现为卡死。调试时先检查条件变量是否在循环体内更新，必要时加入最大迭代次数保护。
:::

## 三、for...of 与 for...in

### 1. for...of 按值迭代

`for...of` 遍历可迭代对象的值。数组、字符串、`Map`、`Set` 都可迭代；普通对象没有默认迭代器，直接使用会抛出 `TypeError`。

```js
for (const value of ["a", "b"]) console.log(value);
// 输出 a、b
```

### 2. 字符串按码点迭代

字符串的迭代按码点进行，一个 emoji 算一次，而不是按 UTF-16 码元拆成两次。需要逐字符处理时，`for...of` 比按下标循环更安全。

```js
const chars = [];
for (const char of "a😀b") chars.push(char);
console.log(chars); // ["a", "😀", "b"]
```

### 3. for...in 枚举属性名

`for...in` 遍历对象的可枚举属性名，包括从原型继承的属性。用普通对象字面量时通常只得到自有属性，但数组的键是字符串 `"0"`、`"1"`，不是数字；遍历数组应改用 `for...of` 或 `for`。

```js
const task = { id: 7, title: "报告" };
for (const key in task) console.log(key, task[key]);
for (const key in ["a", "b"]) console.log(typeof key, key); // string 0、string 1
```

## 四、从空目录观察循环

### 1. 创建页面

新建空目录 `js-loops`，创建 `index.html`。脚本分别用 `for`、`while`、`do...while`、`for...of` 和 `for...in` 遍历数组、字符串和对象，并把结果写入表格；另在控制台输出字符串迭代次数、循环后的变量类型和闭包捕获结果。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>循环与迭代观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>循环与迭代观察</h1>
  <table id="output">
    <thead><tr><th>表达式</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const items = ["a", "b", "c"];
    const task = { id: 7, title: "报告", done: false };

    function forLoop() {
      const out = [];
      for (let i = 0; i < items.length; i++) {
        out.push(i + ":" + items[i]);
      }
      return out.join("|");
    }

    function whileLoop() {
      const out = [];
      let n = 3;
      while (n > 0) {
        out.push(n);
        n--;
      }
      return out.join(",");
    }

    function doWhile() {
      let count = 0;
      let n = 0;
      do {
        count++;
      } while (n < 0);
      return "执行 " + count + " 次";
    }

    function ofArray() {
      const out = [];
      for (const value of items) out.push(value);
      return out.join("|");
    }

    function ofString() {
      const out = [];
      for (const char of "a😀b") out.push(char);
      return out.join("|");
    }

    function inObject() {
      const out = [];
      for (const key in task) out.push(key);
      return out.join("|");
    }

    function inArray() {
      const out = [];
      for (const key in items) out.push(typeof key + ":" + key);
      return out.join("|");
    }

    function loopScope() {
      for (let i = 0; i < 2; i++) {
        // 循环结束后 i 不再可访问
      }
      return typeof i;
    }

    function closures() {
      const fns = [];
      for (let i = 0; i < 3; i++) {
        fns.push(() => i);
      }
      return fns.map((fn) => fn()).join(",");
    }

    const samples = [
      ["for 遍历数组", forLoop(), "索引与值"],
      ["while 倒计数", whileLoop(), "条件先判断"],
      ["do...while 条件为假", doWhile(), "至少执行一次"],
      ["for...of 数组", ofArray(), "按值迭代"],
      ["for...of 字符串", ofString(), "按码点迭代"],
      ["for...in 对象", inObject(), "枚举属性名"],
      ["for...in 数组", inArray(), "键是字符串"],
      ["循环后的 typeof i", loopScope(), "let 只在循环块内"],
      ["闭包捕获循环变量", closures(), "每次迭代独立绑定"],
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

    console.log("for...of 字符串长度", [..."a😀b"].length);
    console.log("循环后 typeof i", loopScope());
    console.log("闭包结果", closures());
    console.log("do...while 执行次数", doWhile());
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有九行。`for` 一行同时给出行号与值；`do...while` 在条件为假时仍执行一次；`for...of` 遍历字符串得到三个码点；`for...in` 遍历数组时每个键都带 `string:` 前缀；循环外的 `typeof i` 是 `undefined`；闭包捕获结果是 `0,1,2`。控制台应显示字符串长度为 `3`、`typeof i` 为 `undefined`、闭包结果为 `0,1,2`、`do...while` 执行一次。

| 表达式 | 结果 | 说明 |
|--------|------|------|
| `for` 遍历数组 | `0:a\|1:b\|2:c` | 索引与值 |
| `while` 倒计数 | `3,2,1` | 条件先判断 |
| `do...while` 条件为假 | `执行 1 次` | 至少执行一次 |
| `for...of` 数组 | `a\|b\|c` | 按值迭代 |
| `for...of` 字符串 | `a\|😀\|b` | 按码点迭代 |
| `for...in` 对象 | `id\|title\|done` | 枚举属性名 |
| `for...in` 数组 | `string:0\|string:1\|string:2` | 键是字符串 |
| 循环后的 `typeof i` | `undefined` | `let` 只在循环块内 |
| 闭包捕获循环变量 | `0,1,2` | 每次迭代独立绑定 |

### 3. 失败分支

创建 `for-of-object.html`，对普通对象 `task` 使用 `for...of`。对象没有默认迭代器，Console 显示 `TypeError: task is not iterable`。遍历对象属性用 `for...in`，遍历值用 `Object.values(task)`。

另一个常见错误是循环条件不更新。删除 `while` 循环体里的 `n--`，条件 `n > 0` 永远成立，页面会卡死且没有报错。这类问题只能靠检查循环体的变量更新和设置迭代上限来避免。

## 五、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格九行与控制台四条输出与正文一致；`for-of-object.html` 得到 `TypeError: task is not iterable`，错误信息中的对象名来自当前代码。两个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有展开迭代器协议、生成器、`for await...of` 和性能差异；不同引擎的不可迭代错误文案可能不同，应按实际环境核对。
