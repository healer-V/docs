---
title: "Web Storage：localStorage 与 sessionStorage"
tags:
  - HTML
  - Web Storage
  - 浏览器存储
excerpt: "用字号偏好示例说明 setItem、getItem、removeItem、clear 与 key 枚举，解释对象序列化、缺失值、同源隔离和两种存储的生命周期，并核对非法 JSON、存储事件与多标签页结果。"
date: 2026-11-14
---

# Web Storage：localStorage 与 sessionStorage

Web Storage 让页面在浏览器中保存少量字符串键值，刷新后仍可读回。它适合字号、主题、上次选择这类偏好，不适合当作数据库，也不能保存账号令牌等敏感信息。

它提供两个对象：`localStorage` 长期保存在当前来源，`sessionStorage` 随当前标签页的会话存在。两者接口相同，差别在生命周期与共享范围；而“当前来源”意味着协议、主机和端口都相同，换个端口就是另一份存储。

::: info 本篇的范围
本篇讲 Web Storage 的读写、序列化、生命周期、同源隔离和失败处理。HTML 文档结构与资源声明见[文档头部与资源引用](../01-foundation/09-head-resources.md)，URL 与来源的构成见[链接与路径](../02-content-elements/04-links-paths.md)。IndexedDB、Cookie 机制、离线应用架构和服务端同步不在本篇展开。
:::

## 一、用途与基本接口

### 1. 值只能是字符串

`setItem(key, value)` 保存一个键值对，两个参数都会被当作字符串。传入数字会先转成字符串，传入对象则得到 `"[object Object]"`，而不是对象内容。

```js
localStorage.setItem("demo.theme", "dark");
```

键名由作者决定，同一来源内不要和页面其他功能重名；示例统一使用 `demo.` 前缀，便于清理。

### 2. 读取缺失项得到 null

`getItem(key)` 返回保存的字符串；键不存在时返回 `null`，而不是空字符串或抛出异常。因此判断“有没有保存过”要用 `=== null`，不能用 `!value`，因为保存空字符串 `""` 是合法值。

### 3. 删除与清空的范围不同

`removeItem(key)` 只删除一个键；`clear()` 清空当前存储中的**全部**键。示例应优先使用 `removeItem`，避免误删同一来源下其他功能的数据。

### 4. 枚举用 length 与 key

`length` 是当前存储的键数量，`key(index)` 按索引返回键名。它们适合调试或列出当前来源的键，但不保证顺序稳定，也不能据此推断数据属于哪个功能。

## 二、字符串、对象与缺失值

### 1. 对象先序列化再保存

需要保存结构时，用 `JSON.stringify` 转成字符串再存，读取时用 `JSON.parse` 还原：

```js
const raw = JSON.stringify({ size: "large" });
localStorage.setItem("demo.preference", raw);
const data = JSON.parse(localStorage.getItem("demo.preference"));
```

`JSON.parse(null)` 会得到 `null`，但 `JSON.parse(undefined)` 会抛错；读取前先判断缺失更稳妥。

### 2. 解析要捕获异常

存储里的字符串可能被旧版本代码、手动修改或其他页面写成非法 JSON。`JSON.parse` 遇到非法内容会抛 `SyntaxError`，不用 `try/catch` 就会中断后续脚本，让页面停在半途。

### 3. 同步接口会阻塞主线程

Web Storage 的读写是同步的。少量字符串几乎没有感知，但不要在大循环里反复读写大对象，也不要把它当缓存层频繁序列化大量数据。

### 4. 保存的是文本，不是类型

布尔值、日期、`Map` 等类型经 JSON 往返后会丢失原有类型：日期变成字符串，`undefined` 属性被丢弃。读取后要按约定重新解释字段。

## 三、来源与会话生命周期

### 1. localStorage 按来源长期保存

`localStorage` 的数据属于当前来源，关闭标签页、重启浏览器后仍在，直到被代码删除或用户清理浏览器数据。它不是“永久可靠”：用户清理、隐私模式或企业策略都可能让它消失。

### 2. sessionStorage 属于当前标签页

`sessionStorage` 按顶层浏览上下文保存，刷新页面仍在，关闭该标签页后清除。新开一个标签页通常是新的会话，不会自动继承另一个标签页的数据；同一标签页内的不同页面共享。

### 3. 来源由协议、主机和端口组成

`http://127.0.0.1:8130` 与 `http://127.0.0.1:8131` 是两个来源，各自拥有独立的存储；同一来源下的不同路径共享。`file://` 地址的行为受浏览器实现影响，不能作为来源隔离的通用证据。

### 4. storage 事件只通知其他文档

一个文档修改 localStorage 后，**同一来源的其他文档**会收到 `storage` 事件，事件带有 `key`、`oldValue`、`newValue` 与 `url`；发起修改的文档自身不收到。它适合做多标签页提示，不能替代消息队列。

## 四、从空目录保存字号偏好

### 1. 创建 storage.html

新建空目录 `html-storage`，创建 UTF-8 文件 `storage.html`。页面用下拉框选择字号，保存为对象、读取时解析，并记录本标签页的打开次数与收到的存储事件：

::: details 查看 storage.html 完整内容

```html [storage.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>本地字号偏好</title>
</head>
<body>
  <h1>本地字号偏好</h1>
  <p>当前偏好：<output id="current">尚未读取</output></p>
  <p>
    <label for="size">选择字号</label>
    <select id="size">
      <option value="small">小</option>
      <option value="medium">中</option>
      <option value="large">大</option>
    </select>
  </p>
  <p>
    <button id="save" type="button">保存到 localStorage</button>
    <button id="load" type="button">重新读取</button>
    <button id="remove" type="button">删除这一项</button>
  </p>
  <p id="status" role="status">等待操作。</p>
  <p>本标签页打开次数：<span id="visits">0</span></p>
  <h2>storage 事件记录</h2>
  <ul id="events"></ul>
  <script>
    const KEY = "demo.preference";
    const SIZES = { small: "14px", medium: "16px", large: "20px" };
    const select = document.getElementById("size");
    const current = document.getElementById("current");
    const status = document.getElementById("status");
    const events = document.getElementById("events");

    /** 按保存的字号值设置页面根字号；无返回值。 */
    function applySize(size) {
      document.documentElement.style.fontSize = SIZES[size] || SIZES.medium;
    }

    /** 从 localStorage 读取并解析偏好；失败时显示原因，不抛到页面外。 */
    function readPreference() {
      const raw = localStorage.getItem(KEY);
      if (raw === null) {
        current.textContent = "尚未保存";
        status.textContent = "本地没有这一项。";
        applySize("medium");
        return;
      }
      try {
        const data = JSON.parse(raw);
        select.value = data.size;
        current.textContent = data.size;
        status.textContent = "已读取：" + raw;
        applySize(data.size);
      } catch (error) {
        current.textContent = "无法解析";
        status.textContent = "保存的内容不是合法 JSON：" + error.message;
        applySize("medium");
      }
    }

    document.getElementById("save").addEventListener("click", () => {
      const raw = JSON.stringify({ size: select.value });
      localStorage.setItem(KEY, raw);
      status.textContent = "已保存：" + raw;
      current.textContent = select.value;
      applySize(select.value);
    });

    document.getElementById("load").addEventListener("click", readPreference);

    document.getElementById("remove").addEventListener("click", () => {
      localStorage.removeItem(KEY);
      status.textContent = "已删除 " + KEY + "，其他键未改动。";
      current.textContent = "尚未保存";
      applySize("medium");
    });

    const visits = Number(sessionStorage.getItem("demo.visits") || "0") + 1;
    sessionStorage.setItem("demo.visits", String(visits));
    document.getElementById("visits").textContent = String(visits);

    window.addEventListener("storage", (event) => {
      const item = document.createElement("li");
      item.textContent = event.key + "：" + event.oldValue + " → " + event.newValue;
      events.append(item);
    });

    readPreference();
  </script>
</body>
</html>
```

:::

### 2. 启动服务并保存

在 `html-storage` 目录启动静态服务：

```bash
python3 -m http.server 8130
```

访问 `http://127.0.0.1:8130/storage.html`，选择“大”并点击保存。状态区显示 `{"size":"large"}`，页面字号变大。点击“重新读取”应还原同一结果；刷新页面后字号仍是“大”，打开次数从 1 变为 2。

### 3. 查看键与缺失值

在 Console 中读取：

```js
localStorage.getItem('demo.preference');
localStorage.length;
localStorage.key(0);
sessionStorage.getItem('demo.visits');
```

保存后第一项是 `{"size":"large"}`，`length` 至少为 1；删除后 `getItem` 返回 `null`。`sessionStorage` 的值随刷新递增，但新开一个标签页访问同一地址时从 1 重新开始。

### 4. 核对存储事件与来源隔离

再开一个标签页访问同一地址，在其中一个标签页保存“小”，另一个标签页的“storage 事件记录”应新增一条 `demo.preference：{"size":"large"} → {"size":"small"}`。

另起一个服务监听 8131 端口，目录可以相同或复制一份：

```bash
python3 -m http.server 8131
```

访问 `http://127.0.0.1:8131/storage.html`，`localStorage.getItem('demo.preference')` 应为 `null`，`length` 为 0；端口不同就是不同来源。

| 观察项 | 表达式或操作 | 本次结果 |
|--------|--------------|----------|
| 初次读取 | `getItem` | `null`，页面显示“尚未保存” |
| 保存后 | 选择“大”并保存 | `{"size":"large"}`，根字号 `20px` |
| 刷新后 | 重新载入页面 | 仍为 `large`，打开次数由 1 变 2 |
| 删除 | 点击删除 | `getItem` 返回 `null` |
| 其他标签页 | 在另一标签页保存 | 收到一条 `storage` 事件 |
| 其他端口 | 8131 端口读取 | `null`，`length` 为 0 |
| 新标签页会话 | 新开页面的打开次数 | `1`，不继承原标签页的会话值 |

## 五、失败处理与数据边界

### 1. 非法 JSON 要显示原因

在 Console 执行 `localStorage.setItem('demo.preference', '{oops')` 后点击“重新读取”，页面应显示“无法解析”和解析错误，而不是停在半途。本次 Chrome 给出的信息是 `Expected property name or '}' in JSON at position 1 (line 1 column 2)`；提示文案随浏览器版本变化，不能写死到界面逻辑里。

### 2. 访问被禁用或额度不足

隐私设置、企业策略或存储配额都可能让读写抛出异常，常见类型是 `SecurityError` 或 `QuotaExceededError`。写入应放在 `try/catch` 中，并在失败时退回默认值；本次环境没有触发配额上限，未记录具体配额数值。

### 3. 清理只删自己的键

调试结束应删除 `demo.preference` 与 `demo.visits`，而不是直接 `clear()`；同一来源下可能有其他功能的数据。换端口做隔离对照时，两个来源的键要分别清理。

::: warning 不要保存敏感数据
Web Storage 是明文保存、同源脚本可读的本地数据，不能存账号令牌、密码、真实住址或精确位置。页面被注入脚本时，这些内容同样可被读走；敏感状态应由服务端会话与合适的凭据机制处理。
:::

### 4. 验证记录

以上文件于 2026-11-14 在 macOS 的 Chrome 157.0.8103.79 中核对。页面通过 `python3 -m http.server` 在 8130 与 8131 两个端口同源访问：保存后读取 `{"size":"large"}`、根字号 `20px`，刷新后偏好保留且会话计数从 1 增至 2，删除后为 `null`；非法 JSON 显示解析错误；另一标签页收到一条 `storage` 事件；8131 端口读取为 `null` 且 `length` 为 0；新标签页的会话计数从 1 开始。

`storage.html` 经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。本次未触发配额上限或禁用存储的环境，未验证复制标签页时 `sessionStorage` 的复制行为、其他浏览器、隐私模式实现或 IndexedDB。
