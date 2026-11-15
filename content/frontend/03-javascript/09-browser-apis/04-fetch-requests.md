---
title: "fetch 与网络请求"
tags:
  - JavaScript
  - fetch
  - HTTP
  - CORS
excerpt: "说明 fetch 返回 Response 的读取方式、HTTP 状态码不会触发拒绝、响应体只能读取一次，讲解 method、headers、body 的配置、AbortController 取消与超时封装、网络错误与状态错误和解析错误的分层处理，以及 CORS 与凭证对跨源请求的影响。"
date: 2026-11-15
---

# fetch 与网络请求

`fetch(url, options)` 返回一个 Promise，兑现值是 `Response` 对象。只有网络失败、请求被中止这类错误才会让 Promise 拒绝；服务器返回 `404` 或 `500` 时 Promise 仍然兑现，必须检查 `response.ok` 或 `response.status`。这是 fetch 与许多旧式封装最容易被忽略的差异。

`Response` 的正文通过 `json()`、`text()`、`blob()` 等方法读取，每个 `Response` 只能读取一次。配置请求时用 `method`、`headers`、`body` 描述方法与内容，跨源请求还受 CORS 与凭证设置约束。

本篇先讲请求与响应读取，再讲请求配置与取消，随后讲错误分层与跨域，最后启动本地服务实测各类结果。

::: info 本篇的范围
本篇讲浏览器 `fetch` 的用法与错误边界，不展开 HTTP 协议细节、重试策略、缓存头与服务端实现。Promise 本身见“回调与 Promise”，`async`/`await` 的写法见“async/await 与异步错误处理”。
:::

## 一、fetch 的基本用法

### 1. 发起请求与 Response

`fetch` 的第一个参数是地址，第二个参数可选。返回的 `Response` 提供 `status`、`ok`、`headers`、`url` 等字段，正文要再调用读取方法。`ok` 在状态码为 `200` 到 `299` 时为 `true`，其他状态为 `false`。

```js
async function load() {
  const response = await fetch("./data.json");
  console.log(response.status, response.ok); // 200 true
  const data = await response.json();
  console.log(data.name); // "demo"
}
load();
```

### 2. HTTP 状态不是异常

请求一个不存在的地址，服务器返回 `404`，`fetch` 依然正常兑现，`response.ok` 为 `false`，响应体仍可解析。把 `fetch` 包在 `try...catch` 里并不能捕获 404，必须在读取数据前显式判断状态。

```js
async function check() {
  const response = await fetch("/api/missing");
  console.log(response.status, response.ok); // 404 false
  console.log((await response.json()).error); // "not found"
}
check();
```

### 3. 读取响应体

`json()` 把正文按 JSON 解析，失败时抛 `SyntaxError`；`text()` 按文本返回，适合纯文本、HTML 与调试；`blob()` 返回二进制对象，适合图片与文件。一个 `Response` 的正文只能读取一次，先调用 `json()` 再调用 `text()` 会失败。

```js
async function readText() {
  const response = await fetch("/api/text");
  console.log(await response.text()); // "纯文本响应"
}
readText();
```

## 二、请求配置

### 1. method、headers 与 body

`method` 指定请求方法，`headers` 是请求头对象，`body` 是请求体。发送 JSON 时要把 `Content-Type` 设为 `application/json`，并用 `JSON.stringify` 序列化；发送表单用 `FormData` 时不要手动设置 `Content-Type`，浏览器会补上带边界的分隔符。

```js
async function send() {
  const response = await fetch("/api/echo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "你好" }),
  });
  const data = await response.json();
  console.log(data.method, data.contentType, data.received.text);
}
send();
```

服务端回显 `POST application/json 你好`，说明方法、请求头与请求体都被正确接收。

### 2. AbortController 取消请求

把 `AbortController` 的 `signal` 传给 `fetch`，调用 `controller.abort()` 后请求被中止，Promise 以 `AbortError` 拒绝。取消常用于用户离开页面、输入变化后放弃旧请求等场景；中止后的错误与其他失败一样需要捕获。

```js
async function load(controller) {
  try {
    await fetch("/api/slow", { signal: controller.signal });
  } catch (error) {
    console.log(error.name); // "AbortError"
  }
}
const controller = new AbortController();
setTimeout(() => controller.abort(), 20);
load(controller);
```

### 3. 超时封装

`fetch` 本身没有超时参数，常见做法是用一个定时器在指定时间后 `abort`，并在 `finally` 中清除定时器。中止后抛出 `AbortError`，调用方据此区分超时与业务错误，而不是让请求无限等待。

```js
async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
fetchWithTimeout("/api/info", 1000).then((response) => console.log(response.status));
```

## 三、错误分层

### 1. 网络层错误

连接被拒绝、DNS 失败、断网、CORS 拦截都让 Promise 以 `TypeError` 拒绝，消息为 `Failed to fetch`。这类错误没有状态码，`response` 也不存在，只能从 `error.name` 与浏览器控制台的网络记录判断原因。

```js
async function ping() {
  try {
    await fetch("http://127.0.0.1:8099/");
  } catch (error) {
    console.log(error.name, error.message); // "TypeError" "Failed to fetch"
  }
}
ping();
```

### 2. HTTP 状态错误

`4xx` 与 `5xx` 是服务器给出的业务结果，不是异常。统一处理的做法是拿到 `Response` 后先判断 `ok`，不满足时读取错误体并抛出携带状态的错误对象，让上层按统一格式处理。

```js
async function load() {
  const response = await fetch("/api/missing");
  if (!response.ok) {
    const body = await response.json();
    throw new Error("请求失败：" + response.status + " " + body.error);
  }
  return response.json();
}
load().catch((error) => console.log(error.message)); // 请求失败：404 not found
```

### 3. 解析错误

响应头声明 JSON 但正文不合法时，`json()` 抛 `SyntaxError`。它发生在读取阶段而不是请求阶段，所以 `response.ok` 可能为 `true`。处理方法是把读取单独放进 `try`，或先检查 `content-type`，避免把解析失败当成网络失败。

```js
async function read() {
  const response = await fetch("/api/bad-json");
  try {
    await response.json();
  } catch (error) {
    console.log(error.name); // "SyntaxError"
  }
}
read();
```

## 四、跨域与凭证

### 1. 同源与 CORS

协议、主机、端口三者相同才算同源。跨源请求要能读取响应，服务器必须返回 `Access-Control-Allow-Origin`，否则浏览器拦截并把 Promise 以 `TypeError` 拒绝，控制台输出 `has been blocked by CORS policy`。CORS 是浏览器行为，请求可能已经到达服务器，只是响应不允许页面读取。

```js
async function load() {
  try {
    await fetch("http://127.0.0.1:" + (Number(location.port) + 1) + "/api/info");
  } catch (error) {
    console.log(error.name); // "TypeError"
  }
}
load();
```

### 2. 凭证与 Cookie

`credentials` 控制是否携带 Cookie 与认证信息：默认值 `same-origin` 只对同源请求携带，`include` 对跨源也携带，`omit` 一律不携带。跨源使用 `include` 时，服务器不能把 `Access-Control-Allow-Origin` 设为 `*`，必须返回具体来源并加上 `Access-Control-Allow-Credentials: true`。

```js
async function check() {
  await fetch("/api/cookie");
  const response = await fetch("/api/cookie-status");
  console.log((await response.json()).cookie); // "visit=1"
}
check();
```

同源请求默认携带 Cookie，第二次请求的 `Cookie` 头为 `visit=1`。跨源携带凭证的组合本次没有实测，配置时以服务端返回的具体来源与凭证头为准。

## 五、从空目录观察 fetch

### 1. 创建服务与页面

新建空目录 `js-fetch`，创建 `server.mjs`、`index.html`、`errors.html`、`data.json`。`server.mjs` 只使用 Node.js 内置模块，提供 JSON、文本、慢响应、回显、Cookie 与带 CORS 头的接口，并同时监听 `8000` 与 `8001`，后者用于演示跨源。启动后打开 `http://127.0.0.1:8000/`。

```bash
node server.mjs
```

页面加载后依次请求全部接口，把状态、响应头、解析结果与错误名写入表格。

::: details 查看 server.mjs 完整内容

```js [server.mjs]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT ?? 8000);

const types = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
};

function sendJson(response, data, status = 200) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}

async function handle(request, response) {
  const url = new URL(request.url, "http://localhost");

  if (url.pathname === "/api/info") return sendJson(response, { name: "demo", count: 2 });
  if (url.pathname === "/api/missing") return sendJson(response, { error: "not found" }, 404);
  if (url.pathname === "/api/slow") return setTimeout(() => sendJson(response, { ok: true }), 300);
  if (url.pathname === "/api/text") {
    response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    return response.end("纯文本响应");
  }
  if (url.pathname === "/api/bad-json") {
    response.writeHead(200, { "Content-Type": "application/json" });
    return response.end("{bad json");
  }
  if (url.pathname === "/api/echo") {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf8");
    return sendJson(response, {
      method: request.method,
      contentType: request.headers["content-type"] ?? "",
      received: JSON.parse(raw || "{}"),
    });
  }
  if (url.pathname === "/api/cookie") {
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": "visit=1; Path=/; SameSite=Lax",
    });
    return response.end(JSON.stringify({ set: true }));
  }
  if (url.pathname === "/api/cookie-status") {
    return sendJson(response, { cookie: request.headers.cookie ?? "" });
  }
  if (url.pathname === "/api/cors-ok") {
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    });
    return response.end(JSON.stringify({ cors: true }));
  }

  try {
    const file = join(root, url.pathname === "/" ? "index.html" : url.pathname);
    const data = await readFile(file);
    response.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
    response.end(data);
  } catch {
    sendJson(response, { error: "not found" }, 404);
  }
}

createServer(handle).listen(port, () => {
  console.log("http://127.0.0.1:" + port + "/");
});
createServer(handle).listen(port + 1);
```

:::

::: details 查看 data.json 与 errors.html

```json [data.json]
{ "name": "demo", "count": 2 }
```

```html [errors.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>fetch 错误处理的观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>fetch 错误处理的观察</h1>
  <p id="missing-out">未执行</p>
  <p id="parse-out">未执行</p>
  <script>
    async function main() {
      const missingOut = document.getElementById("missing-out");
      try {
        const response = await fetch("/api/missing");
        const data = await response.json();
        missingOut.textContent =
          "没有抛错：status=" + response.status + ", data.error=" + data.error;
      } catch (error) {
        missingOut.textContent = "进入 catch：" + error.name;
      }

      const parseOut = document.getElementById("parse-out");
      try {
        await (await fetch("/api/bad-json")).json();
        parseOut.textContent = "没有抛错";
      } catch (error) {
        parseOut.textContent = error.name + ": " + error.message;
      }
    }
    main();
  </script>
</body>
</html>
```

:::

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>fetch 与网络请求观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>fetch 与网络请求观察</h1>
  <table id="output">
    <thead><tr><th>观察项</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const results = {};

    async function attempt(run) {
      try {
        return { ok: true, value: await run() };
      } catch (error) {
        return { ok: false, name: error.name, message: error.message };
      }
    }

    async function main() {
      const info = await fetch("/api/info");
      results.infoStatus = info.status;
      results.infoOk = info.ok;
      results.infoType = info.headers.get("content-type");
      const infoData = await info.json();
      results.infoName = infoData.name;
      results.infoCount = infoData.count;
      results.infoUrl = info.url.endsWith("/api/info");

      const missing = await fetch("/api/missing");
      results.missingStatus = missing.status;
      results.missingOk = missing.ok;
      const missingData = await missing.json();
      results.missingError = missingData.error;

      const text = await fetch("/api/text");
      results.textBody = await text.text();

      const bad = await attempt(async () => {
        const response = await fetch("/api/bad-json");
        return response.json();
      });
      results.badJsonName = bad.ok ? "没有抛错" : bad.name;

      const posted = await fetch("/api/echo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "你好" }),
      });
      const echoed = await posted.json();
      results.echoMethod = echoed.method;
      results.echoType = echoed.contentType;
      results.echoText = echoed.received.text;

      const slowStart = performance.now();
      await fetch("/api/slow");
      results.slowMs = Math.round(performance.now() - slowStart);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20);
      const aborted = await attempt(() => fetch("/api/slow", { signal: controller.signal }));
      clearTimeout(timer);
      results.abortName = aborted.ok ? "没有抛错" : aborted.name;

      const refused = await attempt(() => fetch("http://127.0.0.1:8099/"));
      results.refusedName = refused.ok ? "没有抛错" : refused.name;

      const secondPort = Number(location.port) + 1;
      const blocked = await attempt(() => fetch("http://127.0.0.1:" + secondPort + "/api/info"));
      results.blockedName = blocked.ok ? "没有抛错" : blocked.name;

      const allowed = await attempt(async () => {
        const response = await fetch("http://127.0.0.1:" + secondPort + "/api/cors-ok");
        return response.json();
      });
      results.corsValue = allowed.ok ? allowed.value.cors : allowed.name;

      await fetch("/api/cookie");
      const cookieStatus = await fetch("/api/cookie-status");
      const cookieData = await cookieStatus.json();
      results.cookieHeader = cookieData.cookie;
    }

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
      return String(value);
    }

    main().then(() => {
      const rows = [
        ["GET /api/info 的 status", results.infoStatus, "成功响应"],
        ["response.ok", results.infoOk, "2xx 为 true"],
        ["content-type", results.infoType, "响应头"],
        ["json.name", results.infoName, "解析后的字段"],
        ["json.count", results.infoCount, "解析后的字段"],
        ["response.url 是否以 /api/info 结尾", results.infoUrl, "请求地址"],
        ["GET /api/missing 的 status", results.missingStatus, "未找到"],
        ["404 响应的 ok", results.missingOk, "不是异常"],
        ["404 响应的 JSON 字段 error", results.missingError, "响应体仍可解析"],
        ["text/plain 的 text()", results.textBody, "按文本读取"],
        ["对非法 JSON 调 json() 的错误名", results.badJsonName, "解析失败"],
        ["POST 回显的 method", results.echoMethod, "服务端收到的方法"],
        ["POST 回显的 content-type", results.echoType, "请求头"],
        ["POST 回显的 body.text", results.echoText, "请求体被解析"],
        ["慢请求耗时（毫秒，取整）", results.slowMs, "约 300"],
        ["中止后的错误名", results.abortName, "取消请求"],
        ["连接被拒的错误名", results.refusedName, "网络层失败"],
        ["跨源无 CORS 的错误名", results.blockedName, "浏览器拦截"],
        ["跨源带 CORS 的响应字段", results.corsValue, "允许跨源读取"],
        ["同源第二次请求携带的 Cookie", results.cookieHeader, "默认携带同源 Cookie"],
      ];
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
      console.log("info", results.infoStatus, results.infoOk, results.infoType, results.infoName, results.infoCount);
      console.log("missing", results.missingStatus, results.missingOk, results.missingError);
      console.log("echo", results.echoMethod, results.echoType, results.echoText);
      console.log("failures", results.badJsonName, results.abortName, results.refusedName, results.blockedName);
      console.log("timing", results.slowMs);
    });
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开 `http://127.0.0.1:8000/` 后，表格应有二十行。成功响应 `status` 为 `200`、`ok` 为 `true`，`content-type` 为 `application/json; charset=utf-8`，解析出 `demo` 与 `2`，`response.url` 以 `/api/info` 结尾。`404` 响应的 `ok` 为 `false` 且正文可解析；纯文本返回 `纯文本响应`；非法 JSON 抛 `SyntaxError`。POST 回显方法、请求头与正文；慢请求耗时约 `300` 毫秒，本次记录为 `303`。中止得到 `AbortError`，连接被拒与跨源无 CORS 都是 `TypeError`，带 CORS 头的跨源接口返回 `true`，同源第二次请求携带 `visit=1`。控制台五条日志与表格一致。

| 观察项 | 结果 | 说明 |
|--------|------|------|
| `GET /api/info` 的 `status` | `200` | 成功响应 |
| `response.ok` | `true` | 2xx 为 `true` |
| `content-type` | `"application/json; charset=utf-8"` | 响应头 |
| `json.name` | `"demo"` | 解析后的字段 |
| `json.count` | `2` | 解析后的字段 |
| `response.url` 是否以 `/api/info` 结尾 | `true` | 请求地址 |
| `GET /api/missing` 的 `status` | `404` | 未找到 |
| `404` 响应的 `ok` | `false` | 不是异常 |
| `404` 响应的 JSON 字段 `error` | `"not found"` | 响应体仍可解析 |
| `text/plain` 的 `text()` | `"纯文本响应"` | 按文本读取 |
| 对非法 JSON 调 `json()` 的错误名 | `"SyntaxError"` | 解析失败 |
| POST 回显的 `method` | `"POST"` | 服务端收到的方法 |
| POST 回显的 `content-type` | `"application/json"` | 请求头 |
| POST 回显的 `body.text` | `"你好"` | 请求体被解析 |
| 慢请求耗时（毫秒，取整） | `303` | 约 300，随环境波动 |
| 中止后的错误名 | `"AbortError"` | 取消请求 |
| 连接被拒的错误名 | `"TypeError"` | 网络层失败 |
| 跨源无 CORS 的错误名 | `"TypeError"` | 浏览器拦截 |
| 跨源带 CORS 的响应字段 | `true` | 允许跨源读取 |
| 同源第二次请求携带的 Cookie | `"visit=1"` | 默认携带同源 Cookie |

控制台同时出现四条网络错误记录：`404` 资源、`net::ERR_CONNECTION_REFUSED`、CORS 拦截提示与 `net::ERR_FAILED`。这些都是浏览器网络层的日志，不影响页面继续执行。

### 3. 失败分支

打开 `http://127.0.0.1:8000/errors.html`，`/api/missing` 的输出为 `没有抛错：status=404, data.error=not found`：外层 `try...catch` 没有进入，代码把错误响应当成成功数据继续使用。`/api/bad-json` 的输出为 `SyntaxError: Expected property name or '}' in JSON at position 1 (line 1 column 2)`。

两个失败说明同一件事：请求成功不等于拿到可用数据。先判断 `response.ok`，再读取正文；读取正文的 `try` 与请求的 `try` 分开，才能区分“服务器拒绝”与“格式不对”。

## 六、验证记录与边界

以上页面于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `http://127.0.0.1:8123/` 打开核对，服务端为 Node.js v22.23.4 运行的 `server.mjs`（测试时用环境变量把端口改为 `8123` 与 `8124`）。表格二十行与控制台五条日志与正文一致；`errors.html` 得到上述两条输出。全部行内片段在页面中实际执行验证，两个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

慢请求耗时随机器负载波动，不能作为固定值。本文没有验证其他浏览器与旧版本环境，也没有展开跨源携带凭证的组合、重定向与 `redirect` 选项、`response.body` 流式读取、`keepalive`、Service Worker 拦截、HTTP 缓存头、请求重试与并发控制；这些内容需要按目标环境与接口约定核对。
