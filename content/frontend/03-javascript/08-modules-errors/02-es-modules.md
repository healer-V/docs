---
title: "ES Module"
tags:
  - JavaScript
  - ES Module
  - import
  - export
excerpt: "说明命名导出、默认导出与重导出的写法，解释导入绑定只读且为活绑定的含义，通过模块图展示求值顺序，构造循环依赖观察 TDZ 错误，并给出 type=module、动态 import() 与 import.meta 的加载规则和实测结果。"
date: 2026-11-15
---

# ES Module

模块用 `export` 导出接口，用 `import` 导入其他模块的接口。导出分命名导出与默认导出，导入绑定是只读的：不能给导入的名字重新赋值，但能读到导出方后续的修改，因为绑定是活的。模块只求值一次，依赖关系在加载前由静态的 `import` 语句确定。

循环依赖时，模块图按深度优先求值，先执行到的模块可能读到尚未初始化的绑定。`const`/`let` 导出在初始化前处于暂时性死区，提前访问会抛 `ReferenceError`；函数声明会被提升，循环依赖中调用通常可用。

本篇先讲导出与导入，再讲活绑定与求值顺序，随后处理循环依赖与加载方式，最后用本地服务实测。

::: info 本篇的范围
本篇讲 ES Module 的语法与加载行为，不展开打包工具的解析策略与 `import` 映射的完整配置。模块化的演进背景见“模块化演进”，`require` 的机制见“CommonJS 与 Node.js 模块”。
:::

## 一、导出

### 1. 命名导出

命名导出把变量、函数或类按名字暴露出去，导入时用同名绑定或 `as` 改名。一个模块可以有多个命名导出，导入方按需取用，未导入的导出不会出现在当前作用域。

```js
// counter.js
export let count = 0;
export function increment() {
  count += 1;
}
```

### 2. 默认导出

每个模块最多一个默认导出，用 `export default` 声明。导入默认导出时名字可以任意取，不需要与原声明一致；默认导出与命名导出可以同时存在，导入时通常分开书写。

```js
// counter.js
export default { label: "计数器" };

// main.js
import meta, { count, increment } from "./counter.js";
console.log(meta.label); // "计数器"
```

### 3. 重导出

重导出把一个模块的导出转发出去，不引入本地绑定：`export { count } from "./counter.js"` 只做转发，`export { default as counterMeta }` 把默认导出改名后再导出。它常用于把多个模块汇总成一个入口文件。

```js
// combined.js
export { count, increment } from "./counter.js";
export { default as counterMeta } from "./counter.js";
```

## 二、导入

### 1. 导入绑定只读

导入的名字是只读绑定，给它赋值会抛 `TypeError: Assignment to constant variable.`。需要修改状态时，由导出方提供函数（例如 `increment`），导入方调用函数而不是直接改值。

```js
import { count } from "./counter.js";
count = 5; // TypeError: Assignment to constant variable.
```

### 2. 活绑定

导入的不是值的拷贝，而是对导出绑定的引用。导出方修改后，导入方再读取会得到新值。因此先导入、再调用修改函数，读到的是更新后的结果；解构或赋值给普通变量才会固定当时的值。

```js
import { count, increment } from "./counter.js";
console.log(count); // 0
increment();
console.log(count); // 1
```

### 3. 导入提升与模块图

`import` 声明会被提升到模块顶部，先于模块内其他语句处理；依赖的模块会在当前模块求值前完成求值。整个模块图按深度优先求值，每个模块只执行一次，多个模块导入同一模块时共享同一份实例。

## 三、循环依赖

### 1. 求值顺序

`a.js` 导入 `b.js`，`b.js` 又导入 `a.js` 时，求值从入口开始深度优先：先进入 `a`，遇到 `import` 进入 `b`，`b` 执行完再回到 `a`。循环本身不报错，问题在于某个模块在对方的绑定初始化之前就读取它。

```js
// a.js
import { b } from "./b.js";
export const a = "a";
console.log("a.js 求值完成", b);

// b.js
import { a } from "./a.js";
export const b = "b";
console.log("b.js 读取 a", a); // 此时 a 还未初始化
```

### 2. TDZ 错误

按上面的顺序，`b.js` 求值时 `a.js` 只执行到 `import` 那一行，`const a` 尚未初始化。读取 `a` 会抛 `ReferenceError: Cannot access 'a' before initialization`，整个模块图求值失败。改用函数声明或把访问推迟到函数调用时，可以避开暂时性死区。

### 3. 避免循环

循环依赖本身是设计信号：两个模块互相需要，说明职责可能纠缠。优先抽出一个共享模块存放双方都需要的部分，把单向依赖理顺；确实无法避免时，把跨模块访问包进函数，等两个模块都初始化完成后再调用。

## 四、加载方式

### 1. type="module"

`<script type="module" src="...">` 加载模块脚本，默认延迟执行、默认严格模式、拥有独立作用域。同一个模块被多个标签引入也只执行一次；模块脚本受同源策略限制，`file://` 直接打开会被 CORS 阻止。

```html
<script type="module" src="./a.js"></script>
<script type="module" src="./b.js"></script>
```

### 2. 动态 import()

`import()` 返回 Promise，可以在运行时按条件加载模块。模块说明符可以是变量，加载失败时 Promise 被拒绝，需要用 `catch` 处理。适合按需加载、路由切换或加载失败后的降级。

```js
import("./counter.js")
  .then((module) => {
    console.log(module.count, typeof module.increment);
  })
  .catch((error) => console.log("加载失败", error.message));
```

### 3. import.meta

`import.meta` 提供当前模块的元信息，最常用的是 `import.meta.url`，即模块自身的地址。它只在模块中可用，普通脚本里访问会抛错；拼接相对资源路径时比硬编码路径更可靠。

```js
console.log(import.meta.url); // 例如 "http://localhost:8000/main.js"
```

## 五、从空目录观察模块

### 1. 创建文件并启动服务

新建空目录 `js-esm`，创建 `counter.js`、`combined.js`、`main.html`、`assign.html`、`circular.html`、`a.js`、`b.js`、`dynamic.html`。在该目录执行 `python3 -m http.server 8000`，再依次打开 `main.html`、`assign.html`、`circular.html`、`dynamic.html`。

::: details 查看主要文件的内容

```js [counter.js]
export let count = 0;

export function increment() {
  count += 1;
}

export default { label: "计数器" };
```

```js [combined.js]
export { count, increment } from "./counter.js";
export { default as counterMeta } from "./counter.js";
```

```html [main.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>ES Module 导入导出观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>ES Module 导入导出观察</h1>
  <table id="output">
    <thead><tr><th>观察项</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script type="module">
    import meta, { count, increment } from "./counter.js";
    import { count as reCount, counterMeta } from "./combined.js";

    const rows = [];
    rows.push(["导入后的 count", count, "活绑定的当前值"]);
    increment();
    rows.push(["increment 后的 count", count, "导入方看到更新"]);
    rows.push(["默认导出的 label", meta.label, "默认导入可任意命名"]);
    rows.push(["重导出的 count", reCount, "通过 combined.js 转发"]);
    rows.push(["重导出的默认导出", counterMeta.label, "default as 别名"]);
    rows.push(["import.meta.url 是否以 http 开头", import.meta.url.startsWith("http"), "当前模块地址"]);

    const body = document.querySelector("#output tbody");
    for (const [label, value, extra] of rows) {
      const row = document.createElement("tr");
      for (const text of [label, JSON.stringify(value), extra]) {
        const cell = document.createElement("td");
        cell.textContent = text;
        row.append(cell);
      }
      body.append(row);
    }
    console.log("count", count, "meta", meta.label, "reCount", reCount);
  </script>
</body>
</html>
```

```html [assign.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>修改导入绑定</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>修改导入绑定</h1>
  <p>打开控制台查看错误。</p>
  <script type="module">
    import { count } from "./counter.js";
    try {
      count = 5;
    } catch (error) {
      console.log("赋值失败", error.name, error.message);
    }
  </script>
</body>
</html>
```

```js [a.js]
import { b } from "./b.js";

export const a = "a";
console.log("a.js 求值完成", b);
```

```js [b.js]
import { a } from "./a.js";

export const b = "b";
console.log("b.js 读取 a", a);
```

```html [circular.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>循环依赖</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>循环依赖</h1>
  <p>打开控制台查看错误。</p>
  <script type="module" src="./a.js"></script>
</body>
</html>
```

:::

### 2. 读取结果

`main.html` 的控制台输出 `count 1 meta 计数器 reCount 1`，表格六行依次为：导入时 `count` 为 `0`，调用 `increment` 后变为 `1`；默认导出读到 `计数器`；重导出的 `count` 也是 `1`，重导出的默认导出同样可用；`import.meta.url` 以 `http` 开头。`assign.html` 输出 `赋值失败 TypeError Assignment to constant variable.`；`circular.html` 不产生日志，页面报 `ReferenceError: Cannot access 'a' before initialization`；`dynamic.html` 先输出 `import.meta.url true`，动态导入后输出 `动态导入 0 function 计数器`。

| 观察项 | 结果 | 说明 |
|--------|------|------|
| 导入后的 `count` | `0` | 活绑定的当前值 |
| `increment` 后的 `count` | `1` | 导入方看到更新 |
| 默认导出的 `label` | `"计数器"` | 默认导入可任意命名 |
| 重导出的 `count` | `1` | 通过 `combined.js` 转发 |
| 重导出的默认导出 | `"计数器"` | `default as` 别名 |
| `import.meta.url` 是否以 `http` 开头 | `true` | 当前模块地址 |

### 3. 失败分支

直接给导入绑定赋值会抛 `TypeError: Assignment to constant variable.`，而不是静默忽略。需要改变状态时，导出方必须提供修改函数，导入方调用它。

循环依赖中的提前访问会抛 `ReferenceError: Cannot access 'a' before initialization`。错误来自暂时性死区：被导入的 `const` 绑定字面量还没执行。把访问移到函数内部、或把共享部分抽到第三个模块，就能避免这类错误。

## 六、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过本地 HTTP 服务打开核对。`main.html` 表格六行与控制台输出、`assign.html` 的 `TypeError`、`circular.html` 的 `ReferenceError`、`dynamic.html` 的两条日志均与正文一致。四个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器与旧版本环境，也没有展开 `import` 映射、打包器的依赖解析、模块预加载与 `import.meta` 的其他字段；这些内容需要按目标环境核对。
