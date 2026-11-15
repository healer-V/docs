---
title: "调试与 DevTools"
tags:
  - JavaScript
  - 调试
  - DevTools
  - 断点
excerpt: "说明 Console 的记录、分组与过滤，错误堆栈如何指向文件与行号，Sources 面板断点、条件断点与 debugger 语句的用法，暂停时读取作用域与调用栈、修改运行时变量与源码的区别，以及 Network 面板定位 404 与缓存旧脚本的方法。"
date: 2026-11-15
---

# 调试与 DevTools

排查脚本问题最直接的工具是浏览器开发者工具：Console 看输出与错误，Sources 看源码、下断点、单步执行并读取变量，Network 看请求与响应。`console.log` 只能看到打印出来的值，断点能看到执行到某一行时所有作用域的真实状态。

断点命中时调试器暂停主线程，此时可以读取局部变量、调用栈与闭包，也可以临时改变量继续执行。临时改值只影响这一次运行，源码并未改变；刷新后会恢复。请求问题则要到 Network 看状态码、响应体与是否命中缓存。

本篇先讲 Console 与错误信息，再讲断点与作用域，随后讲异常调试与网络诊断，最后用本地页面核对断点、运行时修改与 404 请求。

::: info 本篇的范围
本篇讲浏览器开发者工具的调试方法，不展开远程调试协议、编辑器集成与性能面板。性能分析见“性能分析与优化”，错误类型与捕获见“错误类型、抛出与捕获”。
:::

## 一、Console 与错误信息

### 1. 输出方法与分组

`console.log` 打印普通信息，`console.warn` 与 `console.error` 带不同级别与样式，`console.group` 与 `console.groupEnd` 把一组输出折叠在一起，`console.table` 以表格展示数组或对象。级别影响控制台的过滤，真实错误应使用 `error` 级别，方便在大量日志中筛出。

```js
console.group("一次计算");
console.log("点击了按钮");
console.log("合计结果已更新");
console.groupEnd();
```

控制台把两行日志归入“一次计算”分组，可以整组展开或折叠。

### 2. 过滤与保留日志

Console 顶部的级别过滤可以只看错误或警告；`console.clear()` 清空当前输出。页面跳转或刷新后日志默认清空，勾选 Preserve log 可以保留，排查“提交后跳转丢失日志”的问题时需要它。日志过多时用分组与明确前缀区分模块。

### 3. 从错误堆栈定位

未捕获错误会在 Console 输出错误信息与调用栈，堆栈的每一行是“函数名（文件:行:列）”。点击最上面属于业务代码的一行会跳到 Sources 对应位置；堆栈里的 `anonymous` 常来自回调，要结合上一行判断调用来源。压缩后的代码需要 Source Map 才能还原源码位置。

## 二、断点调试

### 1. Sources 面板与断点

在 Sources 面板打开脚本，点击行号设置断点。代码执行到该行时暂停，面板显示作用域、调用栈与当前行。断点适合“知道大致位置但不知道当时的值”的问题；在循环里下断点会每轮都停，先用条件断点缩小范围。

```js
function totalWithDiscount(items) {
  let total = 0;
  for (const item of items) {
    total += item.price * item.count;
  }
  if (total > 100) {
    total = total * 0.9;
  }
  return total;
}
```

上面函数对合计满 100 的订单打折，但条件是 `>`，合计恰好 100 时不打折。把断点下在 `if` 这一行，两次笔记本共 100 元时命中断点，局部变量 `total` 为 `100`，说明分支判断与预期不符。

### 2. 条件断点与 debugger 语句

右键行号可以设置条件断点，只有表达式为真才暂停，例如 `total === 100`；也可以在代码里写 `debugger;` 语句，打开开发者工具时执行到它就暂停，关闭时忽略。`debugger` 适合临时排查，提交前应删除，否则会给打开控制台的用户带来停顿。

### 3. 作用域、监视与调用栈

暂停时右侧面板列出 Local、Closure、Global 等作用域，能读到当前函数参数、局部变量与闭包变量；Watch 可以添加表达式持续求值。调用栈从当前函数向上排列，点击任一帧可以切换上下文，查看该帧的变量，从而判断错误值是哪一层传进来的。

## 三、异常与异步调试

### 1. 异常时暂停

Sources 面板的 Pause on exceptions 有两个选项：暂停所有异常，或只暂停未捕获的异常。前者会在被 `try...catch` 处理的异常处也停下，适合查“异常被吞掉”的问题；后者只在真正没人处理时停下。开启后刷新页面，异常发生处会直接暂停。

### 2. 异步调用栈

Promise 与定时器的回调在调用栈里看不到发起它的同步代码，需要开启 Async stack traces（默认开启）。开启后堆栈会显示 `await`、`then` 之前的调用链，定位“哪个请求的回调出错”时依赖它。关闭该选项会让异步错误看起来像凭空出现。

### 3. 单步与跳过

Step over 执行下一行但不进入函数，Step into 进入被调用函数，Step out 执行完当前函数回到调用处。第三方库或压缩代码可以加入黑盒（Blackbox），单步时自动跳过，避免陷入库内部。单步时观察变量变化，比事后猜值可靠。

## 四、网络诊断

### 1. Network 面板读取请求

Network 面板按时间列出请求，包含名称、状态、类型、大小与耗时。点击请求可以看到请求头、响应头、响应体与耗时分解。排查接口问题时先确认请求是否发出、方法、URL 与参数是否正确，再看状态码与响应体。

### 2. 状态码与响应体

`404` 表示地址不存在，`500` 表示服务端错误，`200` 但内容不对则要看响应体与请求参数。面板中红色的请求是失败请求，`(failed)` 通常是网络层失败或被拦截。把响应体与前端解析逻辑对照，可以区分“服务端返回错”与“前端读错字段”。

### 3. 缓存与旧脚本

勾选 Disable cache 可以避免浏览器使用缓存中的旧脚本；修改代码后仍看到旧行为时，先确认请求是否返回 `304`、脚本是否来自缓存。Service Worker 拦截的请求会标注来源，排查时要检查是否有旧版本缓存接管了页面。

## 五、从空目录实践

### 1. 创建服务与页面

新建空目录 `js-debug`，创建 `server.mjs`、`index.html`、`main.js`、`fixed.html`。`server.mjs` 托管静态文件，`/api/missing` 固定返回 `404`。启动后打开 `http://127.0.0.1:8000/`。

```bash
node server.mjs
```

页面加载时执行一次合计计算，按钮可重新计算；同时请求 `/api/missing` 并把状态写入页面，控制台用分组记录点击。

::: details 查看 server.mjs、main.js 与 index.html

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
  if (url.pathname === "/api/missing") {
    response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    return response.end(JSON.stringify({ error: "not found" }));
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

```js [main.js]
function totalWithDiscount(items) {
  let total = 0;
  for (const item of items) {
    total += item.price * item.count;
  }
  if (total > 100) {
    total = total * 0.9;
  }
  return total;
}

function render() {
  const items = [
    { name: "笔记本", price: 50, count: 2 },
    { name: "笔", price: 10, count: 0 },
  ];
  const total = totalWithDiscount(items);
  document.getElementById("total").textContent = "合计：" + total;
  console.log("合计", total);
  return total;
}

document.getElementById("run").addEventListener("click", render);
render();
```

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>断点与网络诊断观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>断点与网络诊断观察</h1>
  <p id="total">尚未计算</p>
  <button id="run" type="button">重新计算</button>
  <p id="missing">尚未请求</p>
  <script src="main.js"></script>
  <script>
    document.getElementById("run").addEventListener("click", () => {
      console.group("一次计算");
      console.log("点击了按钮");
      console.log("合计结果已更新");
      console.groupEnd();
    });

    fetch("/api/missing")
      .then((response) => {
        document.getElementById("missing").textContent = "请求状态：" + response.status;
      })
      .catch((error) => {
        document.getElementById("missing").textContent = "请求失败：" + error.name;
      });
  </script>
</body>
</html>
```

:::

### 2. 断点与请求的结果

在 `main.js` 第 6 行的 `if (total > 100)` 下断点，点击按钮后命中，局部作用域读到 `total` 为 `100`、`items.length` 为 `2`，暂停原因为断点。继续执行后页面显示 `合计：100`。

| 观察项 | 结果 | 说明 |
|--------|------|------|
| 断点是否命中 | `true` | 第 6 行，暂停原因为断点 |
| 命中时局部作用域的 `total` | `100` | 恰好等于阈值 |
| 命中时 `items.length` | `2` | 两条明细 |
| 运行时把 `total` 改为 `0` 后页面 | `合计：0` | 只影响本次运行 |
| 刷新后的页面 | `合计：100` | 源码未改变 |
| 把 `>` 改为 `>=` 后的结果 | `合计：90` | 修正后的分支 |
| `/api/missing` 的响应状态 | `404` | 页面显示 `请求状态：404` |
| Console 分组记录 | `startGroup` / 两条 `log` / `endGroup` | 归入“一次计算” |

Network 面板中 `/api/missing` 显示 `404`，Console 同时出现 `Failed to load resource: the server responded with a status of 404 (Not Found)`。把条件改为 `>=` 后重新加载 `fixed.html`，页面显示 `合计：90`，说明问题出在比较符号。

### 3. 失败分支

断点暂停时把 `total` 改成 `0` 再继续，页面显示 `合计：0`；刷新后恢复为 `100`。运行时修改变量只改变当前内存中的值，不会写回源文件，用它验证假设可以，把它当成修复会误判。

只在 `console.log` 中打印局部变量，会漏掉调用栈与被跳过的分支；缓存中的旧脚本会让修改看起来“没生效”，排查时先禁用缓存再刷新。断点下在循环里时每轮都停，应改用条件断点或 `debugger` 附近的判断缩小范围。

## 六、验证记录与边界

以上页面于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `http://127.0.0.1:8131/` 打开核对，服务端为 Node.js v22.23.4 运行的 `server.mjs`。断点由 Chrome DevTools 协议在 `main.js` 第 6 行设置，命中后读取到 `total` 为 `100`、`items.length` 为 `2`；运行时改写、刷新恢复、`/api/missing` 的 `404` 与 Console 分组均按上表记录。`fixed.html` 显示 `合计：90`。HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

DevTools 面板的界面操作（点击行号、Watch 添加表达式、Pause on exceptions 开关）没有自动化验证，本文通过调试协议与网络事件核对等价行为；不同浏览器与版本的按钮位置与默认选项可能不同。本文也没有展开 Source Map 配置、远程调试与编辑器断点；这些内容需要按目标环境核对。
