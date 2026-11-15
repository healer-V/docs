---
title: "JavaScript 的组成与运行位置"
tags:
  - JavaScript
  - ECMAScript
  - 浏览器
  - 脚本加载
excerpt: "说明 ECMAScript、宿主环境与 Web API 的分工，解释普通脚本、defer、async 与模块脚本的加载和执行时机，并用可复现的执行日志区分 readyState 与 DOM 是否就绪。"
date: 2026-11-15
---

# JavaScript 的组成与运行位置

JavaScript 不是只由一份语言规范构成的。ECMAScript 规定语法、类型、函数、对象和异步语义；浏览器或 Node.js 这样的宿主环境提供文件、网络、页面和定时器等能力。同一段 `let` 声明在两种环境中语义一致，但 `document` 只在浏览器中存在，`process` 只在 Node.js 中存在。

脚本进入页面的方式也影响执行时机。普通 `<script>` 会暂停 HTML 解析去下载并执行；`defer` 等到解析完成再按顺序执行；`async` 下载完成后立即执行；`type="module"` 默认延迟、按模块图求值，并要求通过 HTTP 加载。执行时机不同，脚本能访问到的 DOM 就不同。

本篇先区分语言核心与宿主 API，再说明四种脚本的加载规则，最后用一组日志观察 `readyState`、目标元素是否存在以及执行顺序。

::: info 本篇的范围
本篇讲 JavaScript 的组成与脚本引入时机，不展开变量规则、类型转换和 DOM 操作。变量声明见“变量、声明与命名”，模块导入导出见“ES Module”，DOM 查询见“DOM 查询与修改”。
:::

## 一、ECMAScript 与宿主环境分工

### 1. ECMAScript 规定语言本身

ECMAScript 规定值有哪些类型、表达式怎样求值、函数和对象怎样创建、`Promise` 与 `async` 的语义是什么。这些规则不依赖页面，换一个宿主仍然成立。语言规范由 TC39 维护，通过 ECMA-262 发布。

```js
const values = [1, "2", true];
console.log(values.map((value) => typeof value));
// ["number", "string", "boolean"]
```

上面的 `const`、数组、箭头函数和 `typeof` 都属于语言核心，在浏览器控制台和 Node.js 中得到相同结果。

### 2. 宿主环境提供 Web API

浏览器在语言核心之外提供 `document`、`window`、`fetch`、`localStorage`、`setTimeout` 等接口。它们由 WHATWG、W3C 或浏览器厂商定义，不属于 ECMA-262。脚本通过全局对象访问这些能力。

```js
console.log(typeof document); // "object"
console.log(typeof fetch); // "function"
```

`document` 和 `fetch` 能被访问，是因为当前宿主是浏览器。把它们写进 Node.js 脚本会得到 `ReferenceError`，除非运行时额外提供了兼容实现。

### 3. 浏览器与 Node.js 的差别

两者都运行 ECMAScript，但宿主能力不同：浏览器有 DOM、事件、网络请求和存储；Node.js 有文件系统、进程和原生网络模块。判断一段代码能否运行，要同时看语言特性和宿主接口，而不能只看语法是否通过。

| 能力 | 浏览器 | Node.js |
|------|--------|---------|
| DOM 与事件 | 提供 | 不提供 |
| `fetch` | 提供 | 较新版本提供，行为与浏览器有差异 |
| 文件读写 | 页面脚本不能直接读本地文件 | 通过 `fs` 等模块提供 |
| 全局对象 | `window`（`globalThis` 指向它） | `globalThis`，没有 `window` |
| 模块加载 | `type="module"` | ESM 与 CommonJS 两套体系 |

## 二、script 元素把脚本带进页面

### 1. 内联脚本与外部脚本

`<script>` 可以直接写代码，也可以用 `src` 指向外部文件。带 `src` 时，元素内的代码不会执行；两者不能靠“把代码写在标签里”同时生效。

```html
<script>
  console.log("内联脚本");
</script>
<script src="./app.js"></script>
```

外部脚本便于缓存和复用，内联脚本适合极短的初始化代码。无论哪种形式，脚本都按页面中的位置参与加载顺序。

### 2. 普通脚本按文档顺序执行

没有 `defer`、`async` 或 `type="module"` 的脚本是普通脚本。浏览器遇到它时暂停 HTML 解析，下载并执行，然后继续解析。放在 `<head>` 中的普通脚本执行时，`<body>` 里的元素还不存在。

```html
<head>
  <script src="./normal.js"></script>
</head>
<body>
  <p id="target">目标元素</p>
</body>
```

`normal.js` 中执行 `document.getElementById("target")` 会得到 `null`，因为解析还没有走到 `<p>`。

### 3. defer 把执行推迟到解析完成

`defer` 让浏览器并行下载脚本，但等到文档解析完成后、`DOMContentLoaded` 触发前，按文档顺序执行。多个 `defer` 脚本保持先后顺序，适合需要在完整 DOM 上初始化的代码。

```html
<script defer src="./first.js"></script>
<script defer src="./second.js"></script>
```

两个脚本都在 DOM 解析完成后执行，`first.js` 先于 `second.js`，即使 `second.js` 下载得更快。

### 4. async 下载完成就执行

`async` 也并行下载，但下载完成后立即执行，不等待其他脚本，也不保证顺序。它适合彼此独立、不依赖 DOM 和其他脚本的代码，例如统计脚本。

```html
<script async src="./slow.js"></script>
<script async src="./fast.js"></script>
```

哪个先下载完成，哪个先执行；执行时文档可能仍在解析，也可能已经完成。不能假定 `slow.js` 一定先于 `fast.js`。

### 5. 模块脚本默认延迟且按模块图执行

`type="module"` 把文件当作 ES Module。模块默认是延迟的，等价于带有 `defer` 的脚本，并且在严格模式下执行；顶层 `this` 是 `undefined`。模块的依赖会先被解析和求值，再执行入口模块。

```html
<script type="module" src="./main.js"></script>
```

模块必须通过 HTTP 或 HTTPS 加载。直接用 `file://` 打开页面时，浏览器把模块请求视为跨源请求并阻止，控制台会出现 CORS 错误。这是模块与普通脚本最直接的运行差异之一。

## 三、执行时机决定能访问什么

### 1. readyState 的三个阶段

`document.readyState` 在解析期间为 `"loading"`，解析完成后变为 `"interactive"`，所有资源加载完成后变为 `"complete"`。`defer` 和模块脚本执行时通常是 `"interactive"`；普通脚本在 `<head>` 中执行时是 `"loading"`。

```js
console.log(document.readyState);
```

这个值只说明文档阶段，不直接说明某个元素是否存在。更可靠的判断是实际查询目标节点。

### 2. DOMContentLoaded 与 load 的差别

`DOMContentLoaded` 在文档解析完成、延迟脚本执行后触发，不等待图片、样式表和子框架。`load` 等待页面所有资源加载完成。需要在 DOM 上初始化时监听前者；需要等图片尺寸或全部资源时监听后者。

```js
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM 已就绪");
});

window.addEventListener("load", () => {
  console.log("所有资源已加载");
});
```

### 3. 控制台执行不受文档顺序限制

在开发者工具控制台输入的代码，是在页面已经加载后执行的，不受 `<script>` 位置影响。这意味着同一个表达式在页面脚本中可能取不到节点，在控制台里却能取到。排查“脚本没生效”时，要先确认代码是在哪个时机运行的。

::: tip 先确认执行时机
遇到 `null` 或“元素不存在”，先看脚本位置和执行方式，再怀疑选择器写错。把普通脚本移到 `</body>` 前、改用 `defer`，或把初始化放进 `DOMContentLoaded`，都能改变结果。
:::

## 四、从空目录观察四种脚本

### 1. 创建页面与脚本

新建空目录 `js-script-order`，创建 `index.html`、五个脚本文件和 `server.mjs`。五个脚本各自向 `window.log` 追加一条记录，内容包含脚本名称、当时的 `readyState` 以及目标元素是否存在。

::: details 查看 index.html、五个脚本与 server.mjs 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>脚本执行顺序</title>
  <link rel="icon" href="data:,">
  <script>
    window.log = [];
    window.log.push("head-inline readyState=" + document.readyState);
  </script>
  <script src="./normal.js"></script>
  <script defer src="./defer.js"></script>
  <script async src="./async-slow.js"></script>
  <script async src="./async-fast.js"></script>
  <script type="module" src="./module.js"></script>
</head>
<body>
  <h1>脚本执行顺序</h1>
  <p id="target">这段文字用于检测脚本执行时 DOM 是否已经解析到此处。</p>
  <ol id="output"></ol>
  <script>
    window.addEventListener("load", () => {
      const output = document.getElementById("output");
      for (const entry of window.log) {
        const item = document.createElement("li");
        item.textContent = entry;
        output.append(item);
      }
    });
  </script>
  <script>
    window.log.push("body-inline readyState=" + document.readyState + " target=" + Boolean(document.getElementById("target")));
  </script>
</body>
</html>
```

```js [normal.js]
window.log.push("normal readyState=" + document.readyState + " target=" + Boolean(document.getElementById("target")));
```

```js [defer.js]
window.log.push("defer readyState=" + document.readyState + " target=" + Boolean(document.getElementById("target")));
```

```js [async-slow.js]
window.log.push("async-slow readyState=" + document.readyState + " target=" + Boolean(document.getElementById("target")));
```

```js [async-fast.js]
window.log.push("async-fast readyState=" + document.readyState + " target=" + Boolean(document.getElementById("target")));
```

```js [module.js]
window.log.push("module readyState=" + document.readyState + " target=" + Boolean(document.getElementById("target")));
```

```js [server.mjs]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const root = new URL(".", import.meta.url).pathname;
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

createServer(async (request, response) => {
  const path = request.url === "/" ? "/index.html" : request.url.split("?")[0];
  if (path === "/async-slow.js") {
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  try {
    const body = await readFile(join(root, path));
    response.writeHead(200, {
      "content-type": types[extname(path)] ?? "application/octet-stream",
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(8121, "127.0.0.1", () => {
  console.log("http://127.0.0.1:8121/");
});
```

:::

`server.mjs` 只做两件事：返回当前目录的文件，并让 `async-slow.js` 延迟 300 毫秒返回。延迟用于观察 `async` 的顺序，不改变脚本内容。

### 2. 启动本地服务

在 `js-script-order` 目录执行：

```bash
node server.mjs
```

终端显示 `http://127.0.0.1:8121/` 后，在浏览器访问该地址。这里必须用 HTTP 服务，不能用 `file://`，否则模块脚本会被浏览器阻止。

### 3. 读取执行日志

页面 `load` 后，列表按实际执行顺序显示记录。本次在 Chrome 157.0.8103.79 中得到：

| 顺序 | 记录 | 说明 |
|-----:|------|------|
| 1 | `head-inline readyState=loading` | 解析尚未开始，内联脚本先执行 |
| 2 | `normal readyState=loading target=false` | 普通脚本暂停解析，目标元素还没解析到 |
| 3 | `body-inline readyState=loading target=true` | 解析到 `<body>` 末尾，目标元素已存在 |
| 4 | `defer readyState=interactive target=true` | 解析完成，按文档顺序执行延迟脚本 |
| 5 | `module readyState=interactive target=true` | 模块默认延迟，DOM 已就绪 |
| 6 | `async-fast readyState=interactive target=true` | `async` 下载完成后执行 |
| 7 | `async-slow readyState=interactive target=true` | 比 `async-fast` 晚 300 毫秒返回，最后执行 |

本次日志中 `async` 脚本都排在 `defer` 和模块之后，这是下载与调度共同造成的结果，不是 `async` 的保证。把 `async-slow.js` 的延迟改小，或在网络更慢的环境中，顺序可能不同；`async` 能保证的只有“下载完成后尽快执行”和“彼此不按顺序”。

### 4. 失败分支：模块从 file:// 打开

把 `index.html` 复制为 `file-module.html`，只保留一个模块脚本，然后直接双击打开：

```html
<script type="module" src="./module.js"></script>
```

页面中的内联脚本仍会执行，但模块不执行，`window.log` 只有 `head-inline`。控制台出现跨源错误：

```text
Access to script at 'file:///.../module.js' from origin 'null' has been
blocked by CORS policy: Cross origin requests are only supported for
protocol schemes: chrome, chrome-experimental-site-token-provider,
chrome-extension, chrome-untrusted, data, http, https, isolated-app.
```

修复方式是启动本地 HTTP 服务，改用 `http://127.0.0.1:8121/` 访问。普通脚本不受这条限制，所以同一个页面里“普通脚本能跑、模块不能跑”并不矛盾，区别在加载协议和跨源检查。

## 五、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中核对。`index.html` 通过 `node server.mjs` 在 `http://127.0.0.1:8121/` 访问，`load` 后的日志顺序与上表一致，页面列表与 `window.log` 相同，控制台没有错误。`file-module.html` 通过 `file://` 打开，模块未执行，控制台出现上述 CORS 错误。

两个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。本文没有验证 Firefox、Safari 和旧版本浏览器，也没有测试 `async` 在慢速网络、缓存命中和多个模块依赖下的全部顺序；这些情况应按目标浏览器的实际行为核对，不能把本次日志当成固定顺序。
