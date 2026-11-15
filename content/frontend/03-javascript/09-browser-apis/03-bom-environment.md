---
title: "BOM 与浏览器环境"
tags:
  - JavaScript
  - BOM
  - window
  - URL
  - navigator
excerpt: "说明 window 作为全局对象时 var 与 let 的差异、location 与 history 的导航控制、URL 与 URLSearchParams 的解析和读写、navigator 的 userAgent 与特性检测、语言与时区读取，以及 innerWidth、devicePixelRatio、matchMedia 在设备适配中的作用与边界。"
date: 2026-11-15
---

# BOM 与浏览器环境

BOM 是浏览器提供给脚本的一组全局对象，包括 `window`、`location`、`history`、`navigator`、`screen`，不属于 ECMAScript 标准，由各浏览器按 HTML 规范实现。`window` 是全局对象本身，`location` 描述当前地址，`history` 控制会话历史，`navigator` 提供环境与能力信息。

这些接口的返回值依赖运行环境：视口尺寸、像素比、语言、时区、用户代理都会因设备和设置不同而不同。特性检测应直接查询接口是否存在，而不是解析 `userAgent` 字符串；URL 与查询参数则应使用 `URL`、`URLSearchParams` 处理，不要手工切分字符串。

本篇先讲 `window`、`location` 与 `history`，再讲 URL 与查询参数、`navigator` 与能力检测，最后讲屏幕尺寸与媒体查询，并用页面核对实际返回值。

::: info 本篇的范围
本篇讲浏览器环境提供的全局对象与常用读取方式，不展开安全上下文、权限模型与 Service Worker。存储接口见“存储与缓存边界”，网络请求见“fetch 与网络请求”，页面生命周期见“页面生命周期与性能观察”。
:::

## 一、window 与全局环境

### 1. window 是全局对象

`window` 就是全局对象，`globalThis === window` 为 `true`。在传统脚本的顶层用 `var` 和函数声明创建的变量会成为 `window` 的属性，用 `let`、`const` 声明的不会；在 ES Module 中，所有顶层声明都不会挂到 `window` 上。这也解释了为什么变量名会与 `window` 已有的属性冲突。

```js
var volume = 70;
let speed = 1.5;
console.log(window.volume); // 70
console.log(window.speed); // undefined
```

### 2. location 与 history

`location.href` 是完整地址，`assign` 加载新地址并新增历史记录，`replace` 替换当前记录，直接给 `location.hash` 赋值只改变片段、不重新加载页面。`history.pushState(state, title, url)` 在历史记录中新增一条不发起请求的记录，要求同源；`history.state` 读取当前记录附带的数据。

```js
history.pushState({ page: 2 }, "", "#page-2");
console.log(location.hash); // "#page-2"
console.log(history.state.page); // 2
```

`pushState` 只改地址与历史记录，不加载文档，页面内容需要由脚本自行更新；刷新后服务器仍会收到这个地址，因此服务端必须能响应对应路径。`history.back()` 与 `history.forward()` 触发 `popstate`，监听它恢复界面状态。

## 二、URL 与查询参数

### 1. URL 对象解析

`new URL(地址)` 把字符串拆成 `protocol`、`hostname`、`port`、`pathname`、`search`、`hash` 等字段，`searchParams` 进一步解析查询参数。与字符串拼接相比，`URL` 会处理编码、端口省略与相对路径，解析失败时直接抛 `TypeError`，便于提前发现错误。

```js
const url = new URL("https://example.com/shop?page=2#list");
console.log(url.hostname); // "example.com"
console.log(url.pathname); // "/shop"
console.log(url.searchParams.get("page")); // "2"
```

### 2. 相对地址与 base

`new URL` 的第二个参数是基准地址，解析相对路径时必需：省略基准且地址不是绝对地址时抛 `TypeError`。同样的相对路径在不同基准下得到不同结果，因此处理用户提供的链接时要显式指定当前页面地址作为基准。

```js
const url = new URL("../items?page=3", "https://example.com/shop/list");
console.log(url.href); // "https://example.com/items?page=3"
```

### 3. URLSearchParams 的读写

`searchParams.get` 读取第一个同名参数，不存在时返回 `null`；`getAll` 返回全部同名值。`append` 追加参数，`set` 把同名参数替换为一个值，`toString` 输出编码后的查询字符串。手工拼接 `?a=` 加值容易漏掉编码，`URLSearchParams` 会自动处理。

```js
const params = new URLSearchParams("tag=a");
params.append("tag", "b");
console.log(params.toString()); // "tag=a&tag=b"
params.set("tag", "c");
console.log(params.toString()); // "tag=c"
```

## 三、navigator 与能力检测

### 1. userAgent 与平台信息

`navigator.userAgent` 是浏览器标识字符串，现代 Chrome 已把它简化为固定格式，测试环境返回的版本段为 `Chrome/157.0.0.0`，后三段是 `0`，与真实版本 157.0.8103.79 并不一致。解析 UA 判断浏览器版本会被简化、伪装和第三方浏览器改写破坏，只能用于统计，不能用于功能分支。

```js
const match = navigator.userAgent.match(/Chrome\/(\d+)/);
console.log(match[1]); // "157"
```

### 2. 特性检测

判断某个能力是否可用，直接检查接口是否存在：`"geolocation" in navigator` 为 `true` 表示该属性存在，`typeof AbortController === "function"` 表示构造器可用。特性检测的结果就是代码将要调用的对象，比 UA 判断更可靠，也不受浏览器名称影响。

```js
console.log("geolocation" in navigator); // true
console.log(typeof AbortController); // "function"
```

属性存在不等于功能可用：定位需要用户授权，部分接口只在安全上下文中暴露。调用时仍要处理拒绝和异常，特性检测只回答“是否有这个接口”。

### 3. 语言与时区

`navigator.language` 是用户首选语言标记，`navigator.languages` 是偏好列表；`Intl.DateTimeFormat().resolvedOptions().timeZone` 返回运行环境解析出的时区。展示日期、数字时应把语言与时区传给 `Intl` 的格式化方法，不要手动拼接格式。

```js
console.log(navigator.language); // "zh-CN"
console.log(Intl.DateTimeFormat().resolvedOptions().timeZone); // "Asia/Shanghai"
```

上面的值来自测试机器；换一台设备或修改浏览器语言后会变化，代码不能把它当作固定常量。

## 四、屏幕、媒体查询与设备差异

### 1. 视口与屏幕

`window.innerWidth`、`innerHeight` 是布局视口尺寸，随窗口大小变化；`screen.width`、`screen.height` 是屏幕尺寸，与窗口无关。测试环境两者都是 `1280` 与 `720`，因为窗口恰好占满默认视口。布局应基于视口，而不是屏幕。

```js
console.log(window.innerWidth); // 1280
console.log(window.screen.width); // 1280
```

### 2. devicePixelRatio

`window.devicePixelRatio` 是一个 CSS 像素对应的物理像素数，普通屏幕为 `1`，高密度屏幕常见 `2` 或 `3`。绘制 `<canvas>` 时按它放大画布分辨率并缩放上下文，才能在高密度屏幕上获得清晰图像；缩放浏览器页面也会改变这个值。

```js
console.log(window.devicePixelRatio); // 1
```

### 3. matchMedia 与主题

`window.matchMedia(查询字符串)` 返回 `MediaQueryList`，`matches` 表示当前是否匹配，`addEventListener("change", ...)` 在结果变化时收到通知。判断深色主题用 `(prefers-color-scheme: dark)`，判断断点用 `(min-width: ...)`，两者都与 CSS 媒体查询使用同一套语法。

```js
const query = window.matchMedia("(min-width: 1px)");
console.log(query.matches); // true
```

媒体查询的结果依赖设备与用户设置：测试环境的 `(min-width: 1px)` 恒为真，而 `(prefers-color-scheme: dark)` 为 `false`，说明当前是浅色主题。响应式逻辑应以 CSS 为主，脚本只在需要改变行为时读取匹配结果。

## 五、从空目录观察 BOM

### 1. 创建页面

新建空目录 `js-bom`，创建 `index.html`。脚本读取全局对象、视口、屏幕、像素比、语言时区与 UA，用 `URL` 与 `URLSearchParams` 解析固定地址，读取当前页面的 `protocol`，并在只改 `hash` 的前提下调用 `pushState`，把结果写入表格。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>BOM 与浏览器环境观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>BOM 与浏览器环境观察</h1>
  <table id="output">
    <thead><tr><th>观察项</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    var pageVar = "var 值";
    let pageLet = "let 值";

    const results = {};
    results.globalIsWindow = globalThis === window;
    results.varOnWindow = "pageVar" in window;
    results.varValue = window.pageVar;
    results.letOnWindow = "pageLet" in window;

    results.viewport = window.innerWidth + "×" + window.innerHeight;
    results.dpr = window.devicePixelRatio;
    results.screen = window.screen.width + "×" + window.screen.height;
    results.darkMatches = window.matchMedia("(prefers-color-scheme: dark)").matches;
    results.minWidthMatches = window.matchMedia("(min-width: 1px)").matches;

    const uaMatch = navigator.userAgent.match(/Chrome\/(\d+)/);
    results.uaVersion = uaMatch ? uaMatch[1] : "未匹配";
    results.onLine = navigator.onLine;
    results.hasGeolocation = "geolocation" in navigator;
    results.abortControllerType = typeof AbortController;
    results.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const parsed = new URL("https://example.com:8443/shop/items?page=2&sort=desc#list");
    results.protocol = parsed.protocol;
    results.host = parsed.host;
    results.pathname = parsed.pathname;
    results.search = parsed.search;
    results.hash = parsed.hash;
    results.page = parsed.searchParams.get("page");
    results.missing = parsed.searchParams.get("missing");

    const multi = new URL("https://example.com/?tag=a&tag=b");
    results.tags = multi.searchParams.getAll("tag");

    const params = new URLSearchParams("tag=a");
    params.append("tag", "b");
    params.set("tag", "c");
    results.paramsString = params.toString();

    results.locationProtocol = location.protocol;
    results.isIndex = new URL(location.href).pathname.endsWith("index.html");

    let pushStateResult = "未执行";
    try {
      history.pushState({ step: 1 }, "", "#step");
      pushStateResult = location.hash + " / state.step=" + history.state.step;
    } catch (error) {
      pushStateResult = error.name + ": " + error.message;
    }
    results.pushState = pushStateResult;

    const rows = [
      ["globalThis === window", results.globalIsWindow, "window 就是全局对象"],
      ["var 声明的变量是否在 window 上", results.varOnWindow, "成为全局对象属性"],
      ["window.pageVar 的值", results.varValue, "可以直接读取"],
      ["let 声明的变量是否在 window 上", results.letOnWindow, "不成为属性"],
      ["window.innerWidth × innerHeight", results.viewport, "视口尺寸"],
      ["window.devicePixelRatio", results.dpr, "设备像素比"],
      ["screen.width × screen.height", results.screen, "屏幕尺寸"],
      ["(prefers-color-scheme: dark) 是否匹配", results.darkMatches, "当前主题"],
      ["(min-width: 1px) 是否匹配", results.minWidthMatches, "恒为真的查询"],
      ["userAgent 中的 Chrome 主版本", results.uaVersion, "从字符串提取"],
      ["navigator.onLine", results.onLine, "网络状态"],
      ["\"geolocation\" in navigator", results.hasGeolocation, "特性检测"],
      ["typeof AbortController", results.abortControllerType, "构造器是否存在"],
      ["Intl 解析出的时区", results.timeZone, "运行环境时区"],
      ["URL 的 protocol", results.protocol, "协议"],
      ["URL 的 host", results.host, "主机与端口"],
      ["URL 的 pathname", results.pathname, "路径"],
      ["URL 的 search", results.search, "查询字符串"],
      ["URL 的 hash", results.hash, "片段标识"],
      ["searchParams.get(\"page\")", results.page, "读取单个参数"],
      ["searchParams.get(\"missing\")", results.missing, "不存在的参数"],
      ["重复参数的 getAll(\"tag\")", results.tags, "返回数组"],
      ["append 两次再 set 后的查询字符串", results.paramsString, "set 覆盖全部同名值"],
      ["location.protocol", results.locationProtocol, "当前页面协议"],
      ["当前页面 pathname 是否以 index.html 结尾", results.isIndex, "读取自身地址"],
      ["pushState 后的 hash 与 state", results.pushState, "只改 hash 不刷新"],
    ];

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
      if (value === null) return "null";
      if (Array.isArray(value)) return JSON.stringify(value);
      return String(value);
    }

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

    console.log("window", results.globalIsWindow, results.varOnWindow, results.letOnWindow);
    console.log("viewport", results.viewport, results.dpr, results.screen);
    console.log("url", results.protocol, results.host, results.pathname, results.search, results.hash);
    console.log("params", results.page, results.missing, JSON.stringify(results.tags), results.paramsString);
    console.log("history", results.pushState);
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有二十六行。`globalThis === window` 为 `true`，`var` 声明的 `pageVar` 出现在 `window` 上且值为 `var 值`，`let` 声明的 `pageLet` 不在。视口与屏幕均为 `1280×720`，`devicePixelRatio` 为 `1`；深色主题不匹配，`(min-width: 1px)` 匹配。UA 中提取到版本 `157`，`onLine` 为 `true`，`geolocation` 属性存在，`AbortController` 为 `function`，时区为 `Asia/Shanghai`。`URL` 的五个字段与两个查询参数读取符合预期，重复参数的 `getAll` 返回两个值，`append` 后再 `set` 得到 `tag=c`。`location.protocol` 为 `file:`，页面路径以 `index.html` 结尾，`pushState` 后 `hash` 为 `#step` 且 `history.state.step` 为 `1`。控制台五条输出与表格一致。

| 观察项 | 结果 | 说明 |
|--------|------|------|
| `globalThis === window` | `true` | `window` 就是全局对象 |
| `var` 声明的变量是否在 `window` 上 | `true` | 成为全局对象属性 |
| `window.pageVar` 的值 | `"var 值"` | 可以直接读取 |
| `let` 声明的变量是否在 `window` 上 | `false` | 不成为属性 |
| `window.innerWidth × innerHeight` | `1280×720` | 视口尺寸 |
| `window.devicePixelRatio` | `1` | 设备像素比 |
| `screen.width × screen.height` | `1280×720` | 屏幕尺寸 |
| `(prefers-color-scheme: dark)` 是否匹配 | `false` | 当前主题 |
| `(min-width: 1px)` 是否匹配 | `true` | 恒为真的查询 |
| `userAgent` 中的 Chrome 主版本 | `"157"` | 从字符串提取 |
| `navigator.onLine` | `true` | 网络状态 |
| `"geolocation" in navigator` | `true` | 特性检测 |
| `typeof AbortController` | `"function"` | 构造器是否存在 |
| `Intl` 解析出的时区 | `"Asia/Shanghai"` | 运行环境时区 |
| `URL` 的 `protocol` | `"https:"` | 协议 |
| `URL` 的 `host` | `"example.com:8443"` | 主机与端口 |
| `URL` 的 `pathname` | `"/shop/items"` | 路径 |
| `URL` 的 `search` | `"?page=2&sort=desc"` | 查询字符串 |
| `URL` 的 `hash` | `"#list"` | 片段标识 |
| `searchParams.get("page")` | `"2"` | 读取单个参数 |
| `searchParams.get("missing")` | `null` | 不存在的参数 |
| 重复参数的 `getAll("tag")` | `["a","b"]` | 返回数组 |
| `append` 两次再 `set` 后的查询字符串 | `"tag=c"` | `set` 覆盖全部同名值 |
| `location.protocol` | `"file:"` | 当前页面协议 |
| 当前页面 `pathname` 是否以 `index.html` 结尾 | `true` | 读取自身地址 |
| `pushState` 后的 `hash` 与 `state` | `#step / state.step=1` | 只改 `hash` 不刷新 |

### 3. 失败分支

创建 `no-base.html`，分别执行两条会失败的调用。`new URL("example.com/path")` 缺少协议且没有基准地址，抛 `TypeError: Failed to construct 'URL': Invalid URL`；`history.pushState({}, "", "https://example.com/other")` 把地址改成另一个源，抛 `SecurityError`，消息说明该 URL 无法在 origin 为 `null` 的 `file://` 文档中创建。

::: details 查看 no-base.html 完整内容

```html [no-base.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>BOM 调用失败的观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>BOM 调用失败的观察</h1>
  <p id="url-error">未执行</p>
  <p id="history-error">未执行</p>
  <script>
    const urlError = document.getElementById("url-error");
    try {
      new URL("example.com/path");
      urlError.textContent = "没有抛出";
    } catch (error) {
      urlError.textContent = error.name + ": " + error.message;
    }

    const historyError = document.getElementById("history-error");
    try {
      history.pushState({}, "", "https://example.com/other");
      historyError.textContent = "没有抛出";
    } catch (error) {
      historyError.textContent = error.name + ": " + error.message;
    }
  </script>
</body>
</html>
```

:::

通过 `file://` 打开页面时 origin 为 `null`，`pushState` 只允许改 `hash` 这类不改变源的地址；部署到 HTTP 服务后，同源的路径可以正常写入。处理用户输入的地址时，要么保证带协议，要么把当前 `location.href` 作为第二个参数传入。

## 六、验证记录与边界

以上页面于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格二十六行与控制台五条输出与正文一致；`no-base.html` 得到上述 `TypeError` 与 `SecurityError`。所有行内片段在空白页面中实际执行验证，三个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

视口、屏幕、像素比、语言、时区与 UA 的取值来自测试环境，读者机器上会不同，不能当作固定结果。本文没有验证其他浏览器与旧版本环境，也没有展开安全上下文与定位授权流程、`window.open` 的弹窗拦截、浏览器缩放对 `devicePixelRatio` 的影响、`navigator.userAgentData`、`visualViewport` 与移动端键盘导致的视口变化；这些内容需要按目标环境核对。
