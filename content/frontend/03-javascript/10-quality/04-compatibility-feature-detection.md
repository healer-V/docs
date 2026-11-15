---
title: "兼容性与特性检测"
tags:
  - JavaScript
  - 兼容性
  - 特性检测
  - polyfill
excerpt: "说明为什么不用 UA 字符串判断能力、in 与 typeof 与调用测试三种检测方式、渐进增强与降级路径的设计与验证，以及 polyfill 与转译的区别、加载失败时的回退和兼容数据来源。页面中删除内置方法模拟缺失环境并验证填充与降级结果。"
date: 2026-11-15
---

# 兼容性与特性检测

代码要在不熟悉的环境里运行，就要先问“这个接口在不在”。“在不在”应该直接检查接口本身：`"IntersectionObserver" in window`、`typeof AbortController === "function"`，或实际调用一次并捕获异常。解析 `navigator.userAgent` 判断浏览器名称与版本，会被简化、伪装与第三方浏览器改写破坏。

检测到缺失后要有降级路径：用兼容写法替代、隐藏依赖该能力的功能，或提示用户升级。Polyfill 补上缺失的实现，转译只改变语法，两者解决的是不同问题。降级分支必须被实际执行验证，否则等于没有。

本篇先讲 UA 判断的问题与三种检测方式，再讲渐进增强与降级，随后讲 polyfill 与兼容数据，最后用页面模拟缺失环境验证填充与回退。

::: info 本篇的范围
本篇讲运行时特性检测与降级设计，不配置 Babel 或打包器，也不承诺所有旧浏览器表现一致。BOM 与浏览器环境的基础接口见“BOM 与浏览器环境”，模块加载见“ES Module”。
:::

## 一、为什么不用 UA 判断能力

### 1. UA 字符串被简化

现代 Chrome 的 UA 已把版本与平台信息简化，测试环境返回 `Chrome/157.0.0.0`，后三段是 `0`，与真实版本 157.0.8103.79 不一致。用 UA 提取版本号会得到错误结论，浏览器厂商也在持续减少 UA 中的信息。

### 2. 能力与名称不对应

同一个接口在不同版本、不同内核、不同嵌入环境中的支持情况不同；国产浏览器与 WebView 可能沿用 Chrome 的 UA 却缺少某些接口。UA 说“是 Chrome”，不代表某个 API 一定存在，也不代表行为一致。判断能力只能直接检查能力。

### 3. 检测的三个层次

`in` 检查属性是否存在，`typeof` 检查类型是否为预期值，实际调用并捕获异常检查行为是否可用。属性存在但值为 `undefined`、类型对但调用报错的情况都存在，越靠后的检测越接近真实使用。选择哪一层取决于接口的风险：存在性检测最轻，调用测试最准确。

## 二、特性检测写法

### 1. in 与 typeof

`"IntersectionObserver" in window` 返回布尔值，`typeof window.IntersectionObserver` 返回 `"function"` 或 `"undefined"`。检测自定义属性时用 `in` 更直接；检测全局构造器时两者都行。不要用真值判断代替，`window.someAPI` 可能因为值为 `0` 或空字符串而误判。

```js
console.log("IntersectionObserver" in window); // true
console.log(typeof window.IntersectionObserver); // "function"
console.log("MadeUpAPI" in window); // false
```

### 2. 调用测试

有些接口属性存在但调用会抛错，例如构造参数不合法、权限未授予。用一个最小调用包住 `try...catch`，能区分“存在”与“可用”。`new URL("example.com/path")` 缺少基准地址时抛 `TypeError`，捕获到它就说明当前环境按预期校验了参数。

```js
try {
  new URL("example.com/path");
  console.log("没有抛错");
} catch (error) {
  console.log(error.name); // "TypeError"
}
```

### 3. 检测时机与缓存

检测应在使用前执行一次并把结果缓存，避免在循环或渲染函数里重复检测。检测结果在页面生命周期内通常不变，但某些接口会因权限或策略动态变化，例如定位权限被拒绝后行为不同；这类能力要在调用时处理失败，而不是只依赖一次检测。

## 三、渐进增强与降级

### 1. 渐进增强

先实现基础功能，再在支持的环境增强体验：不支持 `IntersectionObserver` 时仍然展示全部内容，支持时再启用懒加载。渐进增强保证“最差环境可用”，增强部分失败不影响主流程。

```js
function pick(name) {
  return name in window ? "native" : "fallback";
}
console.log(pick("IntersectionObserver")); // "native"
console.log(pick("MadeUpAPI")); // "fallback"
```

### 2. 降级路径

降级要给出等价功能或明确提示，而不是静默失败。懒加载不支持时直接加载全部图片，动画不支持时直接显示最终状态，剪贴板不支持时提示手动复制。降级分支的代码与主分支一样需要测试。

### 3. 验证降级分支

在现代浏览器中，降级分支通常不会自然触发，必须人为构造缺失环境：删除或替换内置方法、注入缺少接口的桩、在测试中强制走回退路径。只验证主分支就宣称兼容，是兼容性问题的常见来源。

## 四、Polyfill 与转译

### 1. 两者的区别

转译把新语法（可选链、类字段）改写成旧语法，解决“语法不被解析”；Polyfill 用旧语法实现缺失的 API，解决“接口不存在”。转译后的代码仍可能调用不存在的 API，所以两者经常一起使用，但不能互相替代。

```js
delete Array.prototype.at;
console.log(typeof Array.prototype.at); // "undefined"
Array.prototype.at = function (index) {
  const position = Math.trunc(index) || 0;
  return this[position < 0 ? this.length + position : position];
};
console.log([1, 2, 3].at(-1)); // 3
```

删除内置方法再自行补上是演示手段，真实环境不应修改内置原型；生产中使用成熟的 polyfill，并注意它只在缺失时生效。

### 2. 加载与失败回退

Polyfill 通过脚本加载，可能因为网络失败、CSP 拦截或路径错误而没生效。加载后应重新检测能力，缺失时走降级分支，而不是假定填充成功。关键 polyfill 可以内联在页面最前面，减少加载失败的概率。

### 3. 兼容数据来源

MDN 的 browser-compat-data 与 caniuse 提供接口与特性的支持矩阵，包含版本与已知问题。查数据时注意区分“标准支持”“部分支持”“需要前缀”，并把目标用户的实际浏览器分布作为决策依据，而不是凭印象。

## 五、从空目录观察

### 1. 创建服务与页面

新建空目录 `js-compat`，创建 `server.mjs`、`index.html`、`polyfill-missing.html`。`server.mjs` 托管静态文件；页面检测两个接口、运行一个调用测试、删除 `Array.prototype.at` 后补上实现并验证结果，最后记录 UA 是否包含 Chrome。

```bash
node server.mjs
```

启动后打开 `http://127.0.0.1:8000/`。

::: details 查看 index.html 与 polyfill-missing.html

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>特性检测与降级观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>特性检测与降级观察</h1>
  <table id="output">
    <thead><tr><th>观察项</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const results = {};

    results.hasIntersection = "IntersectionObserver" in window;
    results.typeIntersection = typeof window.IntersectionObserver;
    results.hasMadeUp = "MadeUpAPI" in window;
    results.typeMadeUp = typeof window.MadeUpAPI;

    function pick(name) {
      return name in window ? "native" : "fallback";
    }
    results.pickIntersection = pick("IntersectionObserver");
    results.pickMadeUp = pick("MadeUpAPI");

    try {
      new URL("example.com/path");
      results.urlThrows = "没有抛错";
    } catch (error) {
      results.urlThrows = error.name;
    }

    results.atBefore = typeof Array.prototype.at;
    delete Array.prototype.at;
    results.atAfterDelete = typeof Array.prototype.at;

    if (typeof Array.prototype.at !== "function") {
      Array.prototype.at = function (index) {
        const position = Math.trunc(index) || 0;
        return this[position < 0 ? this.length + position : position];
      };
    }
    results.atAfterPolyfill = typeof Array.prototype.at;
    results.atValue = [1, 2, 3].at(-1);

    results.uaHasChrome = navigator.userAgent.includes("Chrome");

    const rows = [
      ["\"IntersectionObserver\" in window", results.hasIntersection, "存在性检测"],
      ["typeof window.IntersectionObserver", results.typeIntersection, "类型检测"],
      ["\"MadeUpAPI\" in window", results.hasMadeUp, "不存在的接口"],
      ["typeof window.MadeUpAPI", results.typeMadeUp, "不存在的接口"],
      ["pick(\"IntersectionObserver\")", results.pickIntersection, "走原生分支"],
      ["pick(\"MadeUpAPI\")", results.pickMadeUp, "走降级分支"],
      ["new URL 无效地址的错误名", results.urlThrows, "用 try/catch 检测"],
      ["删除前 typeof Array.prototype.at", results.atBefore, "环境中已有"],
      ["删除后 typeof Array.prototype.at", results.atAfterDelete, "模拟缺失"],
      ["填充后 typeof Array.prototype.at", results.atAfterPolyfill, "补上实现"],
      ["填充后 [1,2,3].at(-1)", results.atValue, "行为正确"],
      ["userAgent 是否包含 Chrome", results.uaHasChrome, "UA 只说明名称"],
    ];

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
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

    console.log("detect", results.hasIntersection, results.typeIntersection, results.hasMadeUp, results.typeMadeUp);
    console.log("pick", results.pickIntersection, results.pickMadeUp);
    console.log("url", results.urlThrows);
    console.log("at", results.atBefore, results.atAfterDelete, results.atAfterPolyfill, results.atValue);
    console.log("ua", results.uaHasChrome);
  </script>
</body>
</html>
```

```html [polyfill-missing.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>填充加载失败的观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>填充加载失败的观察</h1>
  <p id="support-out">未执行</p>
  <p id="fallback-out">未执行</p>
  <script>
    delete Array.prototype.at;
  </script>
  <script src="missing-polyfill.js"></script>
  <script>
    const supported = typeof Array.prototype.at === "function";
    document.getElementById("support-out").textContent =
      "typeof Array.prototype.at：" + typeof Array.prototype.at;
    const values = [1, 2, 3];
    document.getElementById("fallback-out").textContent = supported
      ? "使用原生 at：" + values.at(-1)
      : "回退取下标：" + values[values.length - 1];
  </script>
</body>
</html>
```

:::

### 2. 读取结果

`index.html` 的表格有十二行：`IntersectionObserver` 存在且类型为 `"function"`，`MadeUpAPI` 不存在且类型为 `"undefined"`；检测函数分别返回 `native` 与 `fallback`；`new URL` 对无效地址抛 `TypeError`；删除 `Array.prototype.at` 后类型变为 `"undefined"`，填充后恢复为 `"function"` 且 `[1, 2, 3].at(-1)` 返回 `3`；UA 包含 `Chrome` 为 `true`。控制台五条输出与表格一致。

| 观察项 | 结果 | 说明 |
|--------|------|------|
| `"IntersectionObserver" in window` | `true` | 存在性检测 |
| `typeof window.IntersectionObserver` | `"function"` | 类型检测 |
| `"MadeUpAPI" in window` | `false` | 不存在的接口 |
| `typeof window.MadeUpAPI` | `"undefined"` | 不存在的接口 |
| `pick("IntersectionObserver")` | `"native"` | 走原生分支 |
| `pick("MadeUpAPI")` | `"fallback"` | 走降级分支 |
| `new URL` 无效地址的错误名 | `"TypeError"` | 用 `try`/`catch` 检测 |
| 删除前 `typeof Array.prototype.at` | `"function"` | 环境中已有 |
| 删除后 `typeof Array.prototype.at` | `"undefined"` | 模拟缺失 |
| 填充后 `typeof Array.prototype.at` | `"function"` | 补上实现 |
| 填充后 `[1,2,3].at(-1)` | `3` | 行为正确 |
| `userAgent` 是否包含 Chrome | `true` | UA 只说明名称 |

### 3. 失败分支

打开 `http://127.0.0.1:8000/polyfill-missing.html`。页面先删除 `Array.prototype.at`，再加载一个不存在的 `missing-polyfill.js`，加载失败后检测结果为 `undefined`，输出为 `回退取下标：3`。这说明 polyfill 没加载时应重新检测并走降级，而不是假定它已经生效。

另一类失败是用 UA 推断能力：同一份 UA 字符串下，`MadeUpAPI` 依然不存在。把“浏览器名称”与“接口支持”混为一谈，会在部分浏览器与 WebView 中直接报错。

## 六、验证记录与边界

以上页面于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `http://127.0.0.1:8135/` 打开核对，服务端为 Node.js v22.23.4 运行的 `server.mjs`。表格十二行与控制台五条输出与正文一致；`polyfill-missing.html` 得到 `typeof Array.prototype.at` 为 `undefined` 与 `回退取下标：3`。两个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

删除内置方法再补回是受控的模拟，真实项目不应修改内置原型。本文没有验证其他浏览器与旧版本环境，也没有展开 polyfill 的完整实现与副作用、转译目标与语法降级、BCD/caniuse 数据的具体条目、特性检测与服务端渲染的配合；这些内容需要按目标用户与支持矩阵核对。
