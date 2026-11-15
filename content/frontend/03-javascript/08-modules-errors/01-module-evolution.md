---
title: "模块化演进"
tags:
  - JavaScript
  - 模块化
  - ES Module
  - 作用域
excerpt: "从全局脚本的命名冲突与加载顺序讲起，说明 IIFE 与命名空间如何隔离却不声明依赖，介绍 CommonJS 与 AMD 的历史定位，再对照 ES Module 的静态依赖、独立作用域、严格模式与延迟执行，并给出三种组织方式的实测对照。"
date: 2026-11-15
---

# 模块化演进

早期页面把所有代码写成全局脚本，变量和函数共享同一个全局作用域。两个脚本声明同名变量时，后加载的会覆盖前一个，或者直接抛语法错误；脚本之间的依赖只能靠 `<script>` 的顺序约定，谁依赖谁看不出来。

IIFE 把代码包进函数，用闭包隔离变量，再把需要暴露的接口挂到一个命名空间对象上。这解决了命名冲突，但没有解决依赖声明与加载顺序。CommonJS 用 `require` 同步加载并缓存模块，AMD 用异步加载适配浏览器；ES Module 用静态的 `import`/`export` 让依赖在加载前就确定。

本篇先看全局脚本的问题，再说明 IIFE 的作用与局限，随后介绍两种历史方案，最后对照 ES Module 的差异并实测。

::: info 本篇的范围
本篇讲模块化的演进与概念差异，不展开 `import`/`export` 的完整语法与循环依赖细节，也不比较打包工具。ES Module 的用法见“ES Module”，CommonJS 的细节见“CommonJS 与 Node.js 模块”。
:::

## 一、全局脚本的问题

### 1. 命名冲突

普通 `<script>` 共享同一个全局词法环境。两个脚本都用 `const config` 声明变量时，第二个脚本在解析阶段就抛出 `SyntaxError: Identifier 'config' has already been declared`，整段不执行，第一个脚本的输出照常出现。用 `var` 则不会报错，但会静默覆盖。

```html
<script>
  const config = { name: "第一个脚本" };
  console.log("第一个脚本执行", config.name);
</script>
<script>
  const config = { name: "第二个脚本" }; // SyntaxError，此脚本不执行
  console.log("第二个脚本执行", config.name);
</script>
```

### 2. 加载顺序

传统脚本按文档顺序同步执行，依赖关系完全由书写位置决定。被依赖的脚本必须写在前面，否则会拿到 `undefined` 或抛错。文件一多，顺序维护成本迅速上升，删除或移动一个 `<script>` 都可能破坏运行。

```html
<script src="utils.js"></script>
<script src="app.js"></script>
<!-- app.js 依赖 utils.js，只能靠顺序保证 -->
```

### 3. 依赖关系不可见

脚本之间通过全局变量通信，读代码时无法从文件本身看出它依赖谁、暴露了什么。同一个全局名字可能被多处修改，排查问题需要通读所有脚本。项目越大，这种隐式耦合越难维护。

## 二、IIFE 与命名空间

### 1. IIFE 的作用

立即执行函数表达式把代码放进函数作用域，内部的变量不泄漏到全局。需要对外提供的接口挂到一个命名空间对象上，外部只能通过这个对象访问，同名的内部变量互不干扰。

```js
const appA = (() => {
  const config = { name: "A" };
  return { getName: () => config.name };
})();
const appB = (() => {
  const config = { name: "B" };
  return { getName: () => config.name };
})();
console.log(appA.getName(), appB.getName()); // A B
console.log(typeof window.config); // "undefined"
```

### 2. 局限

IIFE 只提供隔离，不提供依赖声明和加载机制：脚本之间仍然靠全局命名空间对象通信，加载顺序仍然要手工保证。命名空间本身也是全局变量，多个库仍可能争用同一个名字。它适合小型页面和早期库，不足以支撑大型应用。

## 三、CommonJS 与 AMD 的历史定位

### 1. CommonJS

CommonJS 为服务端 JavaScript 设计，用 `require` 同步读取模块文件，用 `module.exports` 导出接口。模块首次加载后结果被缓存，重复 `require` 返回同一份导出对象。同步加载在本地文件系统上可行，在浏览器里会阻塞页面，因此主要流行于 Node.js 生态。

### 2. AMD

AMD 面向浏览器，用 `define` 声明依赖数组并在加载完成后回调，`require` 异步拉取模块。它解决了浏览器中同步加载阻塞的问题，但语法冗长，需要额外的加载器脚本。随着构建工具和 ES Module 的普及，AMD 的使用范围已经很小。

## 四、ES Module 的差异

### 1. 静态依赖

`import` 语句在模块解析阶段就被记录，依赖关系是静态的：不必执行代码就能确定模块图，打包工具可以据此分析依赖。`import` 只能写在顶层，不能放进条件语句；需要按条件加载时使用动态 `import()`。

### 2. 作用域隔离与严格模式

每个模块有自己的顶层作用域，模块内声明的变量不会成为全局变量，`window.config` 在模块中依然是 `undefined`。模块顶层 `this` 是 `undefined`，代码默认运行在严格模式下，给未声明变量赋值会抛 `ReferenceError`，而不是创建全局变量。

```js
// 模块内部
const config = { name: "模块 A" };
console.log(this); // undefined
undeclaredValue = 1; // ReferenceError
```

### 3. 加载与执行时机

`<script type="module">` 默认延迟执行，相当于带有 `defer`：HTML 解析完成后再按依赖顺序执行，与书写位置无关。多个模块共享同一个模块实例，被导入多次也只求值一次。模块脚本还受同源策略约束，直接用 `file://` 打开会被 CORS 策略阻止。

## 五、从空目录观察三种组织方式

### 1. 创建文件并启动本地服务

新建空目录 `js-modules`，创建 `feature-a.js`、`feature-b.js`、`module.html` 和 `conflict.html` 四个文件。模块与普通脚本都通过 HTTP 访问，在该目录执行下面的命令，然后打开 `http://localhost:8000/module.html` 与 `http://localhost:8000/conflict.html`。

```bash
python3 -m http.server 8000
```

::: details 查看四个文件的完整内容

```html [module.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>模块作用域与求值顺序</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>模块作用域与求值顺序</h1>
  <p>打开控制台查看输出顺序。</p>
  <script>
    console.log("内联经典脚本执行", "typeof window.config:", typeof window.config);
  </script>
  <script type="module" src="./feature-a.js"></script>
  <script type="module" src="./feature-b.js"></script>
  <script type="module">
    import { moduleB } from "./feature-b.js";
    console.log("内联模块执行", moduleB.name, "顶层 this:", this);
  </script>
</body>
</html>
```

```js [feature-a.js]
const config = { name: "模块 A" };
console.log("模块 A 求值", config.name, "顶层 this:", this);

try {
  undeclaredValue = 1;
} catch (error) {
  console.log("模块 A 严格模式", error.name);
}

export const moduleA = config;
```

```js [feature-b.js]
import { moduleA } from "./feature-a.js";

const config = { name: "模块 B" };
console.log("模块 B 求值", config.name, "读到的模块 A:", moduleA.name);

export const moduleB = config;
```

```html [conflict.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>两个全局脚本的命名冲突</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>两个全局脚本的命名冲突</h1>
  <p>打开控制台查看错误。</p>
  <script>
    const config = { name: "第一个脚本" };
    console.log("第一个脚本执行", config.name);
  </script>
  <script>
    const config = { name: "第二个脚本" };
    console.log("第二个脚本执行", config.name);
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开 `module.html`，控制台依次输出四行：内联经典脚本先执行，`typeof window.config` 为 `undefined`；模块 A 求值并打印顶层 `this` 为 `undefined`；模块 A 中给未声明变量赋值得到 `ReferenceError`；模块 B 读到模块 A 的导出；最后内联模块执行。模块的执行顺序由依赖关系决定，与 `<script>` 标签的先后无关。打开 `conflict.html`，控制台只输出第一个脚本的内容，第二个脚本以 `SyntaxError: Identifier 'config' has already been declared` 中止。

| 组织方式 | 结果 | 说明 |
|----------|------|------|
| 两个全局脚本都声明 `const config` | `SyntaxError: Identifier 'config' has already been declared` | 第二个脚本不执行 |
| IIFE 暴露的两个 `config` | `"A"` 与 `"B"` | 各自闭包互不影响 |
| IIFE 中的 `typeof window.config` | `"undefined"` | 未泄漏到全局 |
| 模块顶层 `this` | `undefined` | 模块有独立作用域 |
| 模块中给未声明变量赋值 | `ReferenceError` | 模块默认严格模式 |
| 执行顺序 | 内联经典脚本 → 模块 A → 模块 B → 内联模块 | 模块延迟执行且按依赖求值 |

### 3. 失败分支

用 `file://` 直接打开 `module.html` 时，模块脚本被拒绝加载，控制台出现 `Access to script ... from origin 'null' has been blocked by CORS policy`，只有内联经典脚本执行。模块必须通过 HTTP 访问，这是本地调试最常见的卡点。

另一种偏差是把 `type="module"` 当作普通脚本：它默认延迟执行、默认严格模式、拥有独立作用域，全局变量与 `window` 上的属性都不会自动出现。需要跨模块共享的数据应通过 `export`/`import` 传递，而不是挂在全局对象上。

## 六、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中核对。`module.html`、`conflict.html` 通过本地 HTTP 服务打开，控制台输出与正文一致；`conflict.html` 得到 `SyntaxError: Identifier 'config' has already been declared`；用 `file://` 打开 `module.html` 得到 CORS 阻止信息。三个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器与旧版本环境，也没有展开 CommonJS 与 AMD 的具体加载器实现、打包工具的模块解析策略和 `import` 映射配置；这些内容需要按目标环境核对。
