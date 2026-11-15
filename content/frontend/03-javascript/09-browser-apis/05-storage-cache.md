---
title: "存储与缓存边界"
tags:
  - JavaScript
  - localStorage
  - Cookie
  - IndexedDB
excerpt: "说明 localStorage 与 sessionStorage 的会话差异、只存字符串带来的序列化需求、容量超限的 QuotaExceededError、键值操作与 storage 事件的跨文档同步，讲解 Cookie 的属性与 HttpOnly 限制，以及 IndexedDB 的异步打开、对象仓库、事务读写与适用边界。"
date: 2026-11-15
---

# 存储与缓存边界

浏览器提供多种本地存储：`localStorage` 与 `sessionStorage` 存字符串键值，Cookie 随请求发送到服务器，IndexedDB 存结构化数据。它们的生命周期、容量、访问方式与安全属性各不相同，选错会带来数据丢失、请求膨胀或同步阻塞。

`localStorage` 的数据按源隔离、长期保留；`sessionStorage` 只在当前标签页的浏览会话内有效。两者都只能存字符串，对象要先用 `JSON.stringify` 序列化。Cookie 有大小与数量限制，每次同源请求都会携带，`HttpOnly` 的 Cookie 脚本无法读取。

本篇先讲 Web Storage 与跨标签页同步，再讲 Cookie 与 IndexedDB，最后启动本地服务核对容量上限、HttpOnly 与事务读写。

::: info 本篇的范围
本篇讲浏览器本地存储的用法与边界，不展开 Service Worker 缓存、HTTP 缓存头、配额管理 API 与数据库迁移方案。网络请求见“fetch 与网络请求”，页面生命周期见“页面生命周期与性能观察”。
:::

## 一、Web Storage 基础

### 1. localStorage 与 sessionStorage

两者的 API 相同：`setItem`、`getItem`、`removeItem`、`clear`、`key`、`length`。区别在生命周期与作用范围：`localStorage` 按源共享、关闭浏览器后保留；`sessionStorage` 属于当前标签页的浏览上下文，同一标签页内的同源 iframe 共享，新开的标签页看不到。

```js
localStorage.setItem("name", "小明");
sessionStorage.setItem("tab", "临时");
console.log(localStorage.getItem("name")); // "小明"
console.log(sessionStorage.getItem("tab")); // "临时"
```

### 2. 只能存字符串

`setItem` 会把值转换成字符串，写入数字 `42` 再读出得到 `"42"`，类型已经改变。存对象、数组前用 `JSON.stringify` 序列化，读取时用 `JSON.parse` 还原；忘记序列化会得到 `"[object Object]"`。

```js
localStorage.setItem("count", 42);
console.log(typeof localStorage.getItem("count")); // "string"
localStorage.setItem("user", JSON.stringify({ age: 20 }));
console.log(JSON.parse(localStorage.getItem("user")).age); // 20
```

### 3. 容量与异常

存储容量按源计算，不同浏览器的上限不同。写入超过配额时抛 `QuotaExceededError`，这是 `DOMException` 的一种，不是普通的 `TypeError`。写入可能失败，业务代码要把 `setItem` 放进 `try` 并准备降级方案。

```js
try {
  localStorage.setItem("big", "x".repeat(10 * 1024 * 1024));
  console.log("写入成功");
} catch (error) {
  console.log(error.name); // "QuotaExceededError"
} finally {
  localStorage.removeItem("big");
}
```

读取不存在或已被删除的键返回 `null`，不会抛错；用返回值前要判断，直接对 `null` 调 `JSON.parse` 会得到 `null` 而不是对象。

## 二、键值操作与跨文档同步

### 1. length、key、removeItem 与 clear

`length` 是当前键的数量，`key(index)` 按索引返回键名，但键的顺序没有保证，不能依赖它做遍历顺序；需要遍历时先收集键名再读取。`removeItem` 删除单个键，`clear` 清空当前源的全部键。

```js
localStorage.setItem("a", "1");
localStorage.setItem("b", "2");
console.log(localStorage.length); // 2
console.log(localStorage.key(0)); // "a"
localStorage.removeItem("a");
console.log(localStorage.getItem("a")); // null
```

### 2. storage 事件

其他同源文档修改 `localStorage` 时，当前文档会收到 `storage` 事件，事件对象带 `key`、`oldValue`、`newValue`、`url`。触发修改的文档本身收不到事件，所以它可以用来在多个标签页之间同步状态，例如同步登录态或主题。

```js
window.addEventListener("storage", (event) => {
  console.log(event.key, event.newValue); // "theme dark"
});
```

上面的监听要放在另一个标签页中，由第一个标签页执行 `localStorage.setItem("theme", "dark")` 触发。两个标签页实测收到 `theme dark`；`sessionStorage` 不跨标签页，因此没有对应的同步事件。

### 3. 同源隔离与隐私模式

存储按源隔离，`http://127.0.0.1:8000` 与 `http://127.0.0.1:8001` 是两个源，数据互不可见。无痕窗口的存储与普通窗口隔离，关闭后清空；浏览器也可能在存储压力下清理数据，重要数据不能只放在本地存储里。

## 三、Cookie

### 1. 读写与属性

`document.cookie` 以 `键=值; 键=值` 的形式读写，写入时用 `;` 追加 `path`、`max-age`、`expires`、`SameSite` 等属性；读取只返回当前路径下脚本可见的 Cookie，不包含属性。删除 Cookie 靠把 `max-age` 设为 `0` 或设置一个过期时间。

```js
document.cookie = "theme=dark; max-age=3600; path=/; SameSite=Lax";
console.log(document.cookie.split("; ").find((item) => item.startsWith("theme=")));
```

### 2. 与 Web Storage 的差异

Cookie 会随同源请求自动发送到服务器，受 4 KB 左右的单条大小限制，过大或过多会拖慢请求；Web Storage 不会发送，容量更大，只在浏览器中使用。需要服务端读取的状态用 Cookie，纯前端的临时数据用 Web Storage 或 IndexedDB。

### 3. HttpOnly 与安全

服务端可以通过 `Set-Cookie` 加上 `HttpOnly`，让脚本无法读取该 Cookie，降低 XSS 窃取会话的风险。`document.cookie` 看不到 `HttpOnly` Cookie，但浏览器仍会在请求中携带。敏感凭证应由服务端设置 `HttpOnly` 与 `Secure`，不要用 `localStorage` 保存令牌。

```js
async function check() {
  await fetch("/set-httponly-cookie");
  console.log(document.cookie.includes("sid=")); // false
}
check();
```

## 四、IndexedDB

### 1. 打开数据库与对象仓库

`indexedDB.open(name, version)` 返回请求对象，首次创建或版本升级时触发 `onupgradeneeded`，在其中创建对象仓库（类似表）；成功时触发 `onsuccess`，拿到数据库连接。版本号只能是正整数，升级逻辑要写在 `onupgradeneeded` 里。

```js
const request = indexedDB.open("demo", 1);
request.onupgradeneeded = () => {
  request.result.createObjectStore("notes", { keyPath: "id" });
};
request.onsuccess = () => console.log(request.result.name); // "demo"
request.onerror = () => console.log(request.error);
```

### 2. 事务与读写

IndexedDB 的所有读写都在事务中完成：`db.transaction(仓库名, 模式)` 得到事务，`objectStore` 拿到仓库，`put`、`add`、`get`、`delete`、`count` 返回请求对象。事务在事件循环的下一轮自动提交，异步操作要挂在请求或事务的事件上，不能用 `await` 中断事务。

```js
const request = indexedDB.open("demo", 1);
request.onsuccess = () => {
  const tx = request.result.transaction("notes", "readwrite");
  tx.objectStore("notes").put({ id: 1, text: "第一条" });
  tx.oncomplete = () => console.log("事务完成");
};
```

读取用 `get(key)`，结果在 `onsuccess` 中通过 `request.result` 取得；遍历用 `openCursor`，范围查询用 `IDBKeyRange`。`count()` 返回记录数。

```js
const request = indexedDB.open("demo", 1);
request.onsuccess = () => {
  const get = request.result.transaction("notes").objectStore("notes").get(1);
  get.onsuccess = () => console.log(get.result.text); // "第一条"
};
```

### 3. 适用边界

IndexedDB 适合结构化数据、大量记录与离线缓存，支持索引、游标与事务；API 异步且冗长，简单键值用 Web Storage 更直接。它同样受配额限制，写入可能失败，需要处理 `onerror` 与 `onabort`；跨版本升级要设计迁移逻辑，不能假设用户环境中只有最新结构。

## 五、从空目录观察存储

### 1. 创建服务与页面

新建空目录 `js-storage`，创建 `server.mjs`、`index.html`、`second.html`、`bad-json.html`。`server.mjs` 托管静态文件，并提供两个设置 Cookie 的路由，其中一个带 `HttpOnly`。启动后打开 `http://127.0.0.1:8000/`。

```bash
node server.mjs
```

页面先清空 `localStorage`，再依次验证字符串转换、序列化、键值操作、会话存储共享、`storage` 事件、容量上限、Cookie 可见性与 IndexedDB 读写，最后把十九项结果写入表格。

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
};

async function handle(request, response) {
  const url = new URL(request.url, "http://localhost");

  if (url.pathname === "/set-plain-cookie") {
    response.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Set-Cookie": "note=from-server; Path=/",
    });
    return response.end("已设置普通 Cookie");
  }

  if (url.pathname === "/set-httponly-cookie") {
    response.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Set-Cookie": "sid=server-secret; Path=/; HttpOnly",
    });
    return response.end("已设置 HttpOnly Cookie");
  }

  try {
    const file = join(root, url.pathname === "/" ? "index.html" : url.pathname);
    const data = await readFile(file);
    response.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
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

:::

::: details 查看 index.html 与 second.html

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>存储与缓存边界观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>存储与缓存边界观察</h1>
  <iframe id="peer" src="second.html" title="同源 iframe" width="240" height="60"></iframe>
  <table id="output">
    <thead><tr><th>观察项</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const results = {};

    function idbRequest(request) {
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    function openDatabase() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open("storage-demo", 1);
        request.onupgradeneeded = () => {
          request.result.createObjectStore("notes", { keyPath: "id" });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    async function main() {
      localStorage.clear();
      localStorage.setItem("name", "小明");
      results.name = localStorage.getItem("name");

      localStorage.setItem("count", 42);
      results.countType = typeof localStorage.getItem("count");
      results.countValue = localStorage.getItem("count");

      localStorage.setItem("profile", JSON.stringify({ age: 20 }));
      results.age = JSON.parse(localStorage.getItem("profile")).age;

      results.missing = localStorage.getItem("nothing");

      localStorage.setItem("temp", "1");
      localStorage.removeItem("temp");
      results.removed = localStorage.getItem("temp");

      results.lengthBeforeClear = localStorage.length;
      localStorage.clear();
      results.lengthAfterClear = localStorage.length;

      sessionStorage.setItem("tab", "same-tab");
      results.sessionSameTab = sessionStorage.getItem("tab");

      sessionStorage.setItem("shared-probe", "from-parent");
      const peer = document.getElementById("peer");
      await new Promise((resolve) => {
        if (peer.contentWindow && peer.contentWindow.flags) return resolve();
        peer.addEventListener("load", resolve, { once: true });
        setTimeout(resolve, 300);
      });
      results.iframeSession = peer.contentWindow.flags
        ? peer.contentWindow.flags.sessionFromParent
        : "未读取";

      localStorage.setItem("broadcast", "hello");
      await new Promise((resolve) => setTimeout(resolve, 100));
      results.iframeStorageEvent = peer.contentWindow.flags
        ? peer.contentWindow.flags.storageEvent
        : "未读取";

      try {
        localStorage.setItem("big", "x".repeat(10 * 1024 * 1024));
        results.quotaError = "没有抛错";
      } catch (error) {
        results.quotaError = error.name;
      } finally {
        localStorage.removeItem("big");
      }

      await fetch("/set-plain-cookie");
      results.serverCookieVisible = document.cookie.includes("note=from-server");

      await fetch("/set-httponly-cookie");
      results.httpOnlyVisible = document.cookie.includes("sid=");

      document.cookie = "token=abc; path=/";
      results.scriptCookieVisible = document.cookie.includes("token=abc");

      document.cookie = "greeting=" + "你好" + "; path=/";
      const greetingPart = document.cookie
        .split("; ")
        .find((item) => item.startsWith("greeting="));
      results.chineseCookie = greetingPart || "未写入";

      results.indexedDbType = typeof indexedDB;

      const db = await openDatabase();
      await new Promise((resolve, reject) => {
        const transaction = db.transaction("notes", "readwrite");
        transaction.objectStore("notes").put({ id: 1, text: "第一条" });
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
      });
      const record = await idbRequest(db.transaction("notes").objectStore("notes").get(1));
      results.idbText = record ? record.text : null;
      const count = await idbRequest(db.transaction("notes").objectStore("notes").count());
      results.idbCount = count;
      db.close();
    }

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
      return String(value);
    }

    main().then(() => {
      const rows = [
        ["localStorage.getItem(\"name\")", results.name, "字符串原样读取"],
        ["setItem(\"count\", 42) 后读取的类型", results.countType, "非字符串被转换"],
        ["setItem(\"count\", 42) 后读取的值", results.countValue, "存的是文本"],
        ["JSON 序列化后解析出的 age", results.age, "对象需自行序列化"],
        ["读取未设置的键", results.missing, "返回 null"],
        ["removeItem 后读取同一个键", results.removed, "返回 null"],
        ["clear 前的 length", results.lengthBeforeClear, "当前键的数量"],
        ["clear 后的 length", results.lengthAfterClear, "全部清空"],
        ["同标签页 sessionStorage 读取", results.sessionSameTab, "会话级存储"],
        ["同源 iframe 读到父页面的 sessionStorage", results.iframeSession, "同一浏览上下文共享"],
        ["iframe 收到的 storage 事件", results.iframeStorageEvent, "只在其他文档触发"],
        ["写入 10 MB 字符串的错误名", results.quotaError, "容量上限"],
        ["服务端设置的普通 Cookie 是否可读", results.serverCookieVisible, "document.cookie 可见"],
        ["HttpOnly Cookie 是否出现在 document.cookie", results.httpOnlyVisible, "脚本不可读"],
        ["脚本写入的 Cookie 是否可读", results.scriptCookieVisible, "可以读写"],
        ["含中文的 Cookie 值", results.chineseCookie, "值为编码或原样"],
        ["typeof indexedDB", results.indexedDbType, "异步数据库入口"],
        ["IndexedDB 读回的 text", results.idbText, "对象仓库中的记录"],
        ["IndexedDB 记录数", results.idbCount, "count() 的结果"],
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
      console.log("storage", results.name, results.countType, results.countValue, results.age);
      console.log("session", results.sessionSameTab, results.iframeSession, results.iframeStorageEvent);
      console.log("quota", results.quotaError);
      console.log("cookie", results.serverCookieVisible, results.httpOnlyVisible, results.chineseCookie);
      console.log("idb", results.idbText, results.idbCount);
    });
  </script>
</body>
</html>
```

```html [second.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>同源 iframe 的存储观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <p>同源 iframe 中读取会话存储并监听存储事件。</p>
  <script>
    window.flags = { sessionFromParent: null, storageEvent: null };

    window.flags.sessionFromParent = sessionStorage.getItem("shared-probe");

    window.addEventListener("storage", (event) => {
      window.flags.storageEvent = event.key + "=" + event.newValue;
    });
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有十九行。`localStorage` 读回 `小明`；写入数字 `42` 后类型是 `"string"`、值是 `"42"`；序列化对象的 `age` 为 `20`；未设置与已删除的键都是 `null`；`clear` 前有 `3` 个键，清空后为 `0`。同标签页 `sessionStorage` 读到 `same-tab`，同源 iframe 读到父页面写入的 `from-parent`，并收到 `broadcast=hello` 的存储事件。写入 10 MB 字符串抛 `QuotaExceededError`。服务端设置的普通 Cookie 可读，`HttpOnly` Cookie 不可见，脚本写入的 Cookie 可读，含中文的值读回 `greeting=你好`。`indexedDB` 类型为 `"object"`，写入后读回 `第一条`，记录数为 `1`。控制台五条日志与表格一致。

| 观察项 | 结果 | 说明 |
|--------|------|------|
| `localStorage.getItem("name")` | `"小明"` | 字符串原样读取 |
| `setItem("count", 42)` 后读取的类型 | `"string"` | 非字符串被转换 |
| `setItem("count", 42)` 后读取的值 | `"42"` | 存的是文本 |
| JSON 序列化后解析出的 `age` | `20` | 对象需自行序列化 |
| 读取未设置的键 | `null` | 返回 `null` |
| `removeItem` 后读取同一个键 | `null` | 返回 `null` |
| `clear` 前的 `length` | `3` | 当前键的数量 |
| `clear` 后的 `length` | `0` | 全部清空 |
| 同标签页 `sessionStorage` 读取 | `"same-tab"` | 会话级存储 |
| 同源 iframe 读到父页面的 `sessionStorage` | `"from-parent"` | 同一浏览上下文共享 |
| iframe 收到的 `storage` 事件 | `"broadcast=hello"` | 只在其他文档触发 |
| 写入 10 MB 字符串的错误名 | `"QuotaExceededError"` | 容量上限 |
| 服务端设置的普通 Cookie 是否可读 | `true` | `document.cookie` 可见 |
| `HttpOnly` Cookie 是否出现在 `document.cookie` | `false` | 脚本不可读 |
| 脚本写入的 Cookie 是否可读 | `true` | 可以读写 |
| 含中文的 Cookie 值 | `"greeting=你好"` | 本次按原样保存 |
| `typeof indexedDB` | `"object"` | 异步数据库入口 |
| IndexedDB 读回的 `text` | `"第一条"` | 对象仓库中的记录 |
| IndexedDB 记录数 | `1` | `count()` 的结果 |

另外用两个标签页核对：第一个标签页写入 `sessionStorage.setItem("probe", "tab-one")` 后，第二个同源标签页读取同一键得到 `null`，说明 `sessionStorage` 不跨标签页；`localStorage` 的写入则通过 `storage` 事件到达另一个标签页，实测输出 `theme dark`。

### 3. 失败分支

打开 `http://127.0.0.1:8000/bad-json.html`，`JSON.parse` 解析被写坏的字符串时抛 `SyntaxError: Expected property name or '}' in JSON at position 1 (line 1 column 2)`。同一个页面里，未设置的键返回 `null`，`JSON.parse(null)` 的结果也是 `null` 而不是抛错，于是“没有数据”会以 `null` 一路传到使用处。

::: details 查看 bad-json.html 完整内容

```html [bad-json.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>读取损坏数据的观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>读取损坏数据的观察</h1>
  <p id="parse-out">未执行</p>
  <p id="missing-out">未执行</p>
  <script>
    const parseOut = document.getElementById("parse-out");
    localStorage.setItem("broken", "{bad json");
    try {
      JSON.parse(localStorage.getItem("broken"));
      parseOut.textContent = "没有抛错";
    } catch (error) {
      parseOut.textContent = error.name + ": " + error.message;
    }

    const missingOut = document.getElementById("missing-out");
    const missing = localStorage.getItem("nothing-here");
    missingOut.textContent =
      "getItem 返回 " + String(missing) + "，JSON.parse 结果 " + String(JSON.parse(missing));
  </script>
</body>
</html>
```

:::

读取持久化数据时要同时处理两种失败：键不存在与内容损坏。前者返回 `null`，后者抛 `SyntaxError`；统一封装成“读取并校验，失败时回退默认值”，可以避免坏数据让整个页面中断。

## 六、验证记录与边界

以上页面于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `http://127.0.0.1:8125/` 打开核对，服务端为 Node.js v22.23.4 运行的 `server.mjs`。表格十九行与控制台五条日志与正文一致；两个标签页的 `sessionStorage` 与 `storage` 事件另行核对，`bad-json.html` 得到上述两条输出。全部行内片段在页面中实际执行验证，三个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

容量上限、Cookie 编码方式与 `key()` 的顺序随浏览器和实现变化，本文记录的是测试环境的结果。本文没有验证其他浏览器与旧版本环境，也没有展开配额查询与清理 API、Cookie 的 `Secure`/`Partitioned` 属性、IndexedDB 版本迁移与索引查询、Service Worker 缓存与 HTTP 缓存头的配合；这些内容需要按目标环境与业务约束核对。
