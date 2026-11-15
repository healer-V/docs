---
title: "CommonJS 与 Node.js 模块"
tags:
  - JavaScript
  - CommonJS
  - Node.js
  - require
excerpt: "说明 require 的同步解析与缓存、module.exports 与 exports 的别名关系、模块包装带来的 __dirname 与顶层 this，构造循环 require 观察部分导出，并对照 CommonJS 与 ES Module 在加载时机、绑定方式和互操作上的差异。"
date: 2026-11-15
---

# CommonJS 与 Node.js 模块

Node.js 的默认模块格式是 CommonJS：用 `require` 同步读取模块文件，用 `module.exports` 导出接口。首次加载后结果被缓存，再次 `require` 返回同一个对象，模块代码不会重复执行。每个文件被包进一个函数里，因此拥有自己的作用域，并能访问 `__dirname`、`__filename`、`module`、`exports`。

`exports` 只是 `module.exports` 的初始引用。给它重新赋值不会改变 `module.exports`，导出内容仍然是原来的对象。CommonJS 导出的是值的快照，不是活绑定；ES Module 的导入则是活绑定，这是两种格式最直观的差异之一。

本篇先讲 `require` 与导出，再讲循环依赖与错误写法，随后对照 ES Module，最后用 Node.js 实测。

::: info 本篇的范围
本篇讲 CommonJS 的加载与导出机制，不展开包管理器、依赖版本与加载器实现。模块化背景见“模块化演进”，ES Module 语法见“ES Module”。
:::

## 一、require 与 module.exports

### 1. 基本用法

`require(路径)` 读取目标文件并返回它的 `module.exports`。路径以 `./` 或 `../` 开头时相对于当前文件解析，否则按包名查找。模块里通过 `module.exports = ...` 决定导出什么。

```js
// counter.cjs
let count = 0;
function increment() {
  count += 1;
}
module.exports = { count, increment };
```

### 2. 同步解析与缓存

`require` 是同步的：读到文件、执行完模块代码才返回，因此适合本地文件系统。模块第一次被加载后按解析后的绝对路径缓存，同一进程内再次 `require` 直接返回缓存对象，模块代码不会重复执行。

```js
const first = require("./config.cjs");
const second = require("./config.cjs");
console.log(first === second); // true
console.log(first.loadedAt === second.loadedAt); // true
```

### 3. 模块作用域

Node.js 把每个文件包装成一个函数执行，参数包括 `exports`、`require`、`module`、`__filename`、`__dirname`。因此模块内声明的变量不会泄漏到全局，`__dirname` 是当前文件所在目录的绝对路径，顶层 `this` 指向 `module.exports`。

```js
console.log(__filename); // 当前文件的绝对路径
console.log(__dirname); // 当前文件所在目录
console.log(this === module.exports); // true
```

## 二、exports 与 module.exports

### 1. 别名关系

`exports` 初始指向 `module.exports` 同一个对象。给 `exports.name` 赋值等于给 `module.exports.name` 赋值，两种写法在“添加属性”时等价。

```js
exports.name = "模块";
console.log(module.exports.name); // "模块"
```

### 2. 重新赋值导致导出失效

给 `exports` 整体赋值只是让局部变量 `exports` 指向新对象，`module.exports` 仍是原来那个。结果模块导出的是旧对象，新对象的内容不会出现在 `require` 的返回值里。需要整体替换时，必须直接赋值 `module.exports`。

```js
exports.name = "保留的属性";
exports = { name: "被替换的对象" };
console.log(module.exports); // { name: "保留的属性" }
```

## 三、循环 require

### 1. 部分导出

`a.cjs` 在导出任何内容之前 `require` 了 `b.cjs`，而 `b.cjs` 又 `require` 了 `a.cjs`。此时 `a` 的模块对象已存在但还没有赋值，`b` 拿到的是一个空的部分导出，读取 `a.name` 得到 `undefined`，而不是报错。

```js
// a.cjs
const b = require("./b.cjs"); // 此时 a 还没有导出内容
exports.name = "a 的名字";
exports.fromB = b.name;

// b.cjs
const a = require("./a.cjs");
console.log(typeof a.name); // "undefined"
exports.name = "b 的名字";
```

### 2. Node 的警告

访问循环依赖中尚未赋值的导出属性时，Node.js 会输出 `Warning: Accessing non-existent property 'name' of module exports inside circular dependency`。警告提示顺序有问题；把 `require` 移到导出之后，或把共享逻辑抽到独立模块，可以消除这类访问。

## 四、与 ES Module 的差异

### 1. 加载时机

`require` 同步执行，可以在条件语句、函数内部调用，路径也可以拼接变量；`import` 是静态声明，必须在顶层，加载与求值在模块图确定后进行。CommonJS 因此更灵活，ES Module 因此可以被静态分析。

### 2. 绑定方式

CommonJS 导出的是值的快照：导出时把 `count` 的当前值放进对象，之后模块内部再修改，导出对象上的属性不会跟着变。ES Module 的导入是活绑定，导出方更新后导入方读到的也是新值。用同一个计数器分别写成两种格式，前者调用 `increment` 后仍读到 `0`，后者读到 `1`。

```js
// counter.cjs 导出 { count, increment }
const counter = require("./counter.cjs");
console.log(counter.count); // 0
counter.increment();
console.log(counter.count); // 0，导出的是快照
```

### 3. 互操作边界

ES Module 可以默认导入 CommonJS 模块，默认值就是 `module.exports`；CommonJS 不能用 `import` 语法加载 ES Module，只能用动态 `import()`。ES Module 中没有 `require`、`__dirname` 这些 CommonJS 变量，直接使用会抛 `ReferenceError`。

```js
// consumer.mjs
import counter from "./counter.cjs";
counter.increment();
console.log(counter.count, typeof counter.increment); // 0 "function"
```

## 五、从空目录观察 CommonJS

### 1. 创建文件并运行

新建空目录 `js-commonjs`，创建 `counter.cjs`、`config.cjs`、`require-cache.cjs`、`exports-alias.cjs`、`counter-demo.cjs`、`cycle-a.cjs`、`cycle-b.cjs`、`cycle-main.cjs`、`esm-consumer.mjs`。文件名用 `.cjs` 明确表示为 CommonJS，在目录中依次运行。

```bash
node require-cache.cjs
```

```bash
node counter-demo.cjs
```

```bash
node exports-alias.cjs
```

```bash
node cycle-main.cjs
```

```bash
node esm-consumer.mjs
```

::: details 查看主要文件的内容

```js [config.cjs]
console.log("config.cjs 求值");
module.exports = { loadedAt: Date.now(), name: "配置" };
```

```js [require-cache.cjs]
const first = require("./config.cjs");
const second = require("./config.cjs");
console.log("同一对象:", first === second);
console.log("loadedAt 相同:", first.loadedAt === second.loadedAt);
console.log("__filename 是否以 .cjs 结尾:", __filename.endsWith("require-cache.cjs"));
console.log("__dirname 是否绝对路径:", __dirname.startsWith("/"));
console.log("顶层 this === module.exports:", this === module.exports);
console.log("typeof require:", typeof require);
```

```js [counter.cjs]
let count = 0;

function increment() {
  count += 1;
}

module.exports = { count, increment };
```

```js [counter-demo.cjs]
const counter = require("./counter.cjs");
console.log("第一次 count:", counter.count);
counter.increment();
console.log("increment 后 count:", counter.count);
```

```js [exports-alias.cjs]
exports.name = "保留的属性";
exports = { name: "被替换的对象" };
console.log("module.exports:", JSON.stringify(module.exports));
```

```js [cycle-a.cjs]
const b = require("./cycle-b.cjs");
exports.name = "a 的名字";
console.log("a 读到 b 的类型:", typeof b.name);
exports.fromB = b.name;
```

```js [cycle-b.cjs]
const a = require("./cycle-a.cjs");
console.log("b 读到 a 的类型:", typeof a.name, "值:", a.name);
exports.name = "b 的名字";
```

```js [cycle-main.cjs]
const a = require("./cycle-a.cjs");
console.log("main 读到 a.fromB:", a.fromB);
```

```js [esm-consumer.mjs]
import counter from "./counter.cjs";
counter.increment();
console.log("默认导入是 module.exports:", counter.count, typeof counter.increment);
console.log("typeof require:", typeof require);
```

:::

### 2. 读取结果

`require-cache.cjs` 只打印一次 `config.cjs 求值`，两次 `require` 返回同一对象，`loadedAt` 相同；`__filename` 以文件名结尾，`__dirname` 是绝对路径，顶层 `this` 等于 `module.exports`，`require` 的类型为 `function`。`counter-demo.cjs` 两次读取 `count` 都是 `0`，说明导出的是快照。`exports-alias.cjs` 输出 `module.exports: {"name":"保留的属性"}`。`cycle-main.cjs` 中 `b` 读到 `a` 的 `name` 为 `undefined`，`main` 最终读到 `a.fromB` 为 `b 的名字`。`esm-consumer.mjs` 默认导入得到 `module.exports`，但 `typeof require` 是 `undefined`。

| 检查项 | 结果 | 说明 |
|--------|------|------|
| `config.cjs` 求值次数 | `1` | 缓存命中后不重复执行 |
| 两次 `require` 是否同一对象 | `true` | 返回缓存对象 |
| `loadedAt` 是否相同 | `true` | 同一份数据 |
| `increment` 前后的 `count` | `0` 与 `0` | 导出的是值快照 |
| 顶层 `this === module.exports` | `true` | 模块包装的效果 |
| `__dirname` 是否绝对路径 | `true` | 当前文件所在目录 |
| `exports` 重新赋值后的 `module.exports` | `{"name":"保留的属性"}` | 重新赋值不影响导出 |
| 循环中 `b` 读到的 `a.name` | `undefined` | 部分导出 |
| `main` 读到的 `a.fromB` | `"b 的名字"` | 顺序靠后时可以读到 |
| ESM 中 `typeof require` | `"undefined"` | 没有 CommonJS 变量 |

### 3. 失败分支

在 `.mjs` 文件中直接写 `require("./counter.cjs")` 会得到 `ReferenceError: require is not defined in ES module scope, you can use import instead`。ES Module 中没有 `require`，应改用 `import`；确实需要时通过 `module.createRequire` 创建，而不是声明一个同名变量。

给 `exports` 整体赋值后，`require` 拿到的是旧对象，新对象上的属性全部丢失。这类错误不会抛异常，表现为“导出为空”或“少了几个方法”，排查时先检查模块末尾是否用了 `module.exports = ...`。

## 六、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Node.js v22.23.4 中运行核对，输出与正文一致；循环依赖时同时出现 `Warning: Accessing non-existent property 'name' of module exports inside circular dependency`。本文未使用 HTML 文件，无需浏览器检查。

本文没有验证其他 Node.js 版本、`package.json` 中 `type` 字段对文件解析的影响、`createRequire` 的完整用法与打包工具的 CommonJS 互操作策略；这些内容需要按目标环境核对。
