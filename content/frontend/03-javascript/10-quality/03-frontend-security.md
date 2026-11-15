---
title: "前端安全边界"
tags:
  - JavaScript
  - 安全
  - XSS
  - CSP
excerpt: "说明用户数据进入 HTML、属性与 URL 上下文时的注入风险，innerHTML 与 textContent 的行为差异、转义与消毒的边界，敏感数据放在 localStorage 的问题与第三方脚本风险，以及 CSP 响应头拦截内联脚本与 Trusted Types 强制 TrustedHTML 的实际效果。"
date: 2026-11-15
---

# 前端安全边界

页面把用户数据放进 HTML 时，数据与代码的边界取决于插入方式。用 `innerHTML` 写入的字符串会被解析成标签与属性，里面的 `onerror`、`onclick` 会真的执行；用 `textContent` 写入则一律当作文本。属性、URL 与脚本上下文各有不同的转义规则，一种场景的转义不能套用到另一种。

防护不能只靠一处：输入校验、输出编码、CSP 与 Trusted Types 分别覆盖不同位置。CSP 通过响应头限制脚本来源，能拦住内联脚本；Trusted Types 强制 `innerHTML` 只接受经过策略包装的值。它们降低风险，但不替代正确的输出处理。

本篇先讲注入位置与转义边界，再讲 `innerHTML` 的安全写法，随后讲敏感数据、第三方脚本与 CSP，最后启动本地服务观察注入、拦截与策略行为。

::: info 本篇的范围
本篇讲前端输出处理与浏览器安全机制的边界，不写渗透测试教程，也不承诺单一措施防御所有攻击。DOM 修改的基础 API 见“DOM 查询与修改”，存储接口见“存储与缓存边界”。
:::

## 一、信任边界与注入位置

### 1. 用户数据进入 HTML 上下文

HTML 上下文指数据最终出现在标签之间，例如 `<div>数据</div>`。这里的数据必须转义 `<`、`>`、`&`、引号，否则会被解析成新标签。`<img src="x" onerror="...">` 在 `innerHTML` 中会创建元素并执行 `onerror`，这是最直观的注入。

```js
const payload = '<img src="x" onerror="window.__htmlRan = \'yes\'">';
document.getElementById("html-box").innerHTML = payload;
```

实测中 `window.__htmlRan` 变为 `"yes"`，同时浏览器发出一个针对 `x` 的 `404` 请求，说明标签确实被解析并执行。

### 2. 属性与 URL 上下文

数据进入属性值时要转义引号与标签字符，否则可以跳出属性；进入 `href`、`src` 等 URL 属性时还要限制协议。`javascript:` 开头的地址在点击时执行脚本，`data:text/html` 可以承载整页内容。只检查字符串是否包含 `javascript` 并不够，编码与大小写都能绕过。

```js
document.getElementById("bad-link").click();
console.log(window.__linkRan); // 1
```

示例中的链接地址是 `javascript:window.__linkRan = 1`，点击后脚本执行。业务代码应只允许 `http:`、`https:` 等白名单协议，用 `new URL` 解析后判断 `protocol`，而不是拼接字符串。

### 3. 转义与消毒的边界

转义只解决一个上下文：HTML 实体转义后的内容放进属性仍然可能有问题，URL 编码后的内容放进脚本又会失效。富文本需要消毒库按白名单过滤标签与属性，而不是正则替换几个字符；消毒库本身也有版本漏洞，需要持续更新。

```js
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
console.log(escapeHtml("<b>粗体</b>")); // "&lt;b&gt;粗体&lt;/b&gt;"
```

## 二、innerHTML 与安全写法

### 1. innerHTML 会执行

`innerHTML` 按 HTML 解析器规则构建节点，事件属性、脚本 URL 与部分标签的副作用都会生效。把用户输入拼进模板字符串再赋给 `innerHTML`，等于把输入当代码执行。即使内容来自“可信”的接口，只要接口数据可能被污染，风险一样存在。

### 2. textContent 与节点构建

`textContent` 只设置文本节点，标签字符原样显示；需要结构时用 `createElement`、`textContent` 与 `append` 逐个构建，数据始终走文本接口。实测同样的 `<img onerror>` 字符串通过 `textContent` 写入后不会执行，页面上直接显示标签文本。

### 3. 必须渲染富文本时

必须保留格式时（例如允许加粗与链接），先消毒再插入：用白名单只保留允许的标签与属性，移除事件属性与危险协议。消毒后的结果仍建议用 `innerHTML` 之外的方式构建，或至少在插入前用 Trusted Types 策略包装。能不用 `innerHTML` 就不用，是成本最低的选择。

## 三、敏感数据与第三方脚本

### 1. localStorage 与令牌

`localStorage` 按源保存、长期有效，任何同源脚本都能读取。把长期令牌放在这里，一旦出现 XSS，令牌会被直接取走；站点内的第三方脚本也能读到。会话凭证应由服务端通过 `HttpOnly` Cookie 下发，前端只保存非敏感状态。

### 2. 第三方脚本

统计、客服、广告脚本与页面同源执行，拥有完整权限：读取 DOM、Cookie 与存储，发起请求。引入前要评估来源与版本锁定，用 `integrity` 校验静态资源，尽量通过 CSP 限定允许的脚本来源。第三方脚本被篡改是常见的供应链入口。

### 3. 依赖与供应链

依赖包被投毒、构建产物被替换都属于供应链风险。锁定版本与校验和、审查新增依赖、不在页面里直接加载来源不明的脚本，可以降低概率。前端无法完全防御服务端与网络层的问题，需要与后端、运维共同约定边界。

## 四、CSP 与 Trusted Types

### 1. CSP 的作用与限制

Content-Security-Policy 通过响应头或 `meta` 声明允许加载的资源来源，`script-src 'self'` 只允许同源脚本，内联脚本与事件属性会被拦截并在控制台报告。CSP 能显著降低 XSS 的影响，但不能修复已经存在的注入点；内联脚本被拦，攻击者仍可能利用允许的来源或 DOM 型漏洞。

### 2. 用响应头配置最小策略

CSP 通常由服务端设置响应头。下面的策略只允许同源脚本，内联脚本被阻止；外部同源脚本正常执行。上线前先用 `Content-Security-Policy-Report-Only` 观察会被拦截的资源，再切换为强制模式。

```js
// 服务端为 /csp.html 设置的响应头
// Content-Security-Policy: script-src 'self'
```

实测中内联脚本的 `window.inlineRan` 为 `undefined`，同源的 `csp-check.js` 执行成功，控制台报告 `Executing inline script violates the following Content Security Policy directive 'script-src 'self''`。

### 3. Trusted Types

Trusted Types 要求把字符串赋给 `innerHTML` 等危险接口前，先用策略转换成 `TrustedHTML`。开启 `require-trusted-types-for 'script'` 后，直接用字符串赋值抛 `TypeError`，`textContent` 不受影响，通过 `trustedTypes.createPolicy` 包装的值可以写入。

```js
const policy = trustedTypes.createPolicy("demo", { createHTML: (value) => value });
target.innerHTML = policy.createHTML("<i>策略</i>");
```

策略函数仍然要自己做消毒；`createHTML` 原样返回只是演示接口，生产中应在策略内过滤。浏览器支持程度不同，不支持的环境需要回退方案。

## 五、从空目录观察

### 1. 创建服务与页面

新建空目录 `js-security`，创建 `server.mjs`、`index.html`、`csp.html`、`csp-check.js`、`csp-tt.html`、`tt-check.js`。`server.mjs` 托管静态文件，并为 `/csp.html` 与 `/csp-tt.html` 设置不同的 CSP 响应头。启动后打开 `http://127.0.0.1:8000/`。

```bash
node server.mjs
```

`index.html` 对比 `innerHTML` 与 `textContent` 写入同一类字符串，点击一个 `javascript:` 链接，并输出 HTML 转义结果；`csp.html` 尝试执行内联脚本与外部脚本；`csp-tt.html` 尝试字符串赋值、文本赋值与策略赋值。

::: details 查看 server.mjs 与 csp.html、csp-tt.html

```js [server.mjs]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT ?? 8000);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

async function handle(request, response) {
  const url = new URL(request.url, "http://localhost");
  try {
    const file = join(root, url.pathname === "/" ? "index.html" : url.pathname);
    const data = await readFile(file);
    const headers = { "Content-Type": types[extname(file)] ?? "application/octet-stream" };
    if (url.pathname === "/csp.html") headers["Content-Security-Policy"] = "script-src 'self'";
    if (url.pathname === "/csp-tt.html") {
      headers["Content-Security-Policy"] = "require-trusted-types-for 'script'";
    }
    response.writeHead(200, headers);
    response.end(data);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("not found");
  }
}

createServer(handle).listen(port, () => {
  console.log("http://127.0.0.1:" + port + "/");
});
```

```html [csp.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>CSP 拦截观察</title>
  <link rel="icon" href="data:,">
  <script>
    window.inlineRan = true;
  </script>
</head>
<body>
  <h1>CSP 拦截观察</h1>
  <p id="inline-out">未执行</p>
  <p id="external-out">未执行</p>
  <script src="csp-check.js"></script>
</body>
</html>
```

```js [csp-check.js]
document.getElementById("inline-out").textContent =
  "内联脚本 window.inlineRan：" + String(window.inlineRan);
window.externalRan = true;
document.getElementById("external-out").textContent =
  "外部脚本 window.externalRan：" + String(window.externalRan);
```

```html [csp-tt.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>Trusted Types 观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>Trusted Types 观察</h1>
  <p id="string-out">未执行</p>
  <p id="text-out">未执行</p>
  <p id="policy-out">未执行</p>
  <div id="target"></div>
  <script src="tt-check.js"></script>
</body>
</html>
```

```js [tt-check.js]
const stringOut = document.getElementById("string-out");
const target = document.getElementById("target");

try {
  target.innerHTML = "<b>字符串</b>";
  stringOut.textContent = "没有抛错";
} catch (error) {
  stringOut.textContent = error.name + ": " + error.message;
}

const textOut = document.getElementById("text-out");
target.textContent = "<b>文本</b>";
textOut.textContent = "textContent 写入成功：" + target.textContent;

const policyOut = document.getElementById("policy-out");
const policy = trustedTypes.createPolicy("demo", { createHTML: (value) => value });
target.innerHTML = policy.createHTML("<i>策略</i>");
policyOut.textContent = "策略写入成功：" + target.innerHTML;
```

:::

### 2. 读取结果

`index.html` 的表格有六行：`innerHTML` 写入后 `window.__htmlRan` 为 `"yes"`，`textContent` 写入后 `window.__textRan` 为 `"undefined"`，文本容器原样显示标签，`javascript:` 链接点击后 `window.__linkRan` 为 `"1"`，转义输出为 `&lt;b&gt;粗体&lt;/b&gt;`，`typeof window.trustedTypes` 为 `"object"`。控制台另有针对注入图片的 `404` 记录。

| 观察项 | 结果 | 说明 |
|--------|------|------|
| `innerHTML` 写入后 `window.__htmlRan` | `"yes"` | `onerror` 被执行 |
| `textContent` 写入后 `window.__textRan` | `"undefined"` | 没有执行 |
| `text-box` 的 `textContent` | `<img src="x" onerror="...">` | 原样显示标签 |
| `javascript:` 链接点击后 `window.__linkRan` | `"1"` | URL 上下文执行脚本 |
| `escapeHtml` 的输出 | `"&lt;b&gt;粗体&lt;/b&gt;"` | 标签被转成实体 |
| `typeof window.trustedTypes` | `"object"` | Trusted Types 接口 |

`csp.html` 中内联脚本的 `window.inlineRan` 为 `undefined`，外部脚本的 `window.externalRan` 为 `true`，控制台报告内联脚本违反 `script-src 'self'` 并被阻止。`csp-tt.html` 中字符串赋给 `innerHTML` 抛 `TypeError: Failed to set the 'innerHTML' property on 'Element': This document requires 'TrustedHTML' assignment.`，`textContent` 写入成功，策略包装后的值写入成功并显示 `<i>策略</i>`。

| 场景 | 结果 | 说明 |
|------|------|------|
| `script-src 'self'` 下的内联脚本 | 未执行，`window.inlineRan` 为 `undefined` | 被 CSP 阻止 |
| 同源外部脚本 | 执行，`window.externalRan` 为 `true` | 允许加载 |
| `require-trusted-types-for 'script'` 下字符串赋值 `innerHTML` | `TypeError` | 需要 `TrustedHTML` |
| 同环境下的 `textContent` | 写入成功 | 不经过 HTML 解析 |
| 策略 `createHTML` 包装后的赋值 | 写入成功 | 显示 `<i>策略</i>` |

### 3. 失败分支

只转义尖括号而忽略属性上下文：`<a title="用户输入">` 中的引号可以跳出属性，`&` 与实体编码也可能被浏览器二次解析。CSP 被当成唯一防线：内联脚本被拦住了，但同源的外部脚本、DOM 型注入与允许的来源仍可能被利用。

在前端保存长期令牌同样常见：`localStorage` 中的令牌会被任何同源脚本读取，XSS 一旦发生就直接失守。正确做法是服务端通过 `HttpOnly` Cookie 管理会话，前端只处理非敏感状态。

## 六、验证记录与边界

以上页面于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `http://127.0.0.1:8133/` 打开核对，服务端为 Node.js v22.23.4 运行的 `server.mjs`。注入、转义、`javascript:` 链接、CSP 拦截与 Trusted Types 的结果与正文一致；CSP 通过响应头设置，避免 `meta` 在本地文件下的来源判定差异。三个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器与旧版本环境，也没有展开 DOM 型 XSS 的完整利用链、消毒库选型与绕过、CSP 的 `nonce`/`hash`/`strict-dynamic`、`Report-Only` 上报、Trusted Types 策略审计与兼容回退、Service Worker 与第三方脚本的隔离；这些内容需要按目标环境与威胁模型核对。
