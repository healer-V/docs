---
title: "DOM 查询与修改"
tags:
  - JavaScript
  - DOM
  - querySelector
  - 节点操作
excerpt: "说明 DOM 树的节点类型与文档、元素、文本节点的关系，对照 getElementById、querySelector 与动态 HTMLCollection 的行为，讲解 textContent 与 innerHTML 的差异、创建插入与移除节点、classList/dataset/style 的用法，以及 DocumentFragment 的批量插入。"
date: 2026-11-15
---

# DOM 查询与修改

浏览器把 HTML 解析成 DOM 树，每个标签是元素节点，标签之间的文字是文本节点，整个文档是文档节点。用 `nodeType` 可以区分：文档为 `9`，元素为 `1`，文本为 `3`。绝大多数操作针对元素节点，但遍历时会遇到空白文本节点。

查询用 `getElementById`、`querySelector` 或 `querySelectorAll`。`querySelectorAll` 返回静态快照，之后新增的节点不会出现在同一个集合里；`getElementsByClassName` 返回动态集合，长度随 DOM 变化。修改用 `textContent` 写入纯文本，用 `innerHTML` 解析标签，后者会把用户输入当 HTML 执行。

本篇先讲节点类型与查询，再讲内容修改与节点增删，最后用页面核对静态与动态集合的差异。

::: info 本篇的范围
本篇讲 DOM 的查询与修改，不重复 HTML 元素语义，也不展开虚拟 DOM。事件处理见“事件模型与事件委托”，XSS 的完整边界见“前端安全边界”。
:::

## 一、DOM 树与节点类型

### 1. 节点与元素

`document` 是文档节点，`document.body`、`document.querySelector("ul")` 返回元素节点，元素之间的换行与缩进会形成文本节点。`children` 只包含元素节点，`childNodes` 包含文本节点；需要遍历元素时用 `children`。

```js
const list = document.createElement("ul");
list.innerHTML = "\n  <li>A</li>\n  <li>B</li>\n";
console.log(list.children.length); // 2
console.log(list.childNodes.length); // 5，含空白文本节点
```

### 2. nodeType 与 nodeName

`nodeType` 是数字，判断节点类别时用它；`nodeName` 是标签名的字符串，元素节点为大写（`"UL"`、`"B"`），文本节点为 `"#text"`，文档节点为 `"#document"`。`tagName` 与 `nodeName` 对元素节点一致。

```js
console.log(document.nodeType); // 9
console.log(document.body.nodeType); // 1
console.log(document.createTextNode("x").nodeName); // "#text"
```

## 二、查询节点

### 1. getElementById 与 querySelector

`getElementById` 按 `id` 查找，返回第一个匹配的元素或 `null`；`querySelector` 接受任意 CSS 选择器，返回第一个匹配项或 `null`。两者只返回单个元素，取不到时不会抛错，后续访问它的属性才会抛 `TypeError`，所以要先判断再使用。

```js
const list = document.createElement("ul");
list.id = "list";
list.innerHTML = '<li class="item">A</li>';
document.body.append(list);
console.log(document.getElementById("list").tagName); // "UL"
console.log(list.querySelector(".item").textContent); // "A"
```

### 2. querySelectorAll 与动态集合

`querySelectorAll` 返回静态 `NodeList`，调用那一刻的结果就固定了；`getElementsByClassName`、`getElementsByTagName` 返回动态 `HTMLCollection`，DOM 变化后长度自动更新。需要“先取快照再操作”时用静态集合，需要实时反映时用动态集合。

```js
const snapshot = list.querySelectorAll(".item");
const live = list.getElementsByClassName("item");
const extra = document.createElement("li");
extra.className = "item";
list.append(extra);
console.log(snapshot.length); // 1，快照不变
console.log(live.length); // 2，实时更新
```

### 3. 遍历父子兄弟

`parentElement` 取父元素，`children` 取子元素集合，`firstElementChild`、`lastElementChild` 取首尾，`nextElementSibling`、`previousElementSibling` 取相邻元素。这些属性只看元素节点，不受空白文本干扰。

```js
const list = document.createElement("ul");
list.innerHTML = "<li>A</li><li>B</li>";
const second = list.children[1];
console.log(second.textContent); // "B"
console.log(second.previousElementSibling.textContent); // "A"
```

## 三、修改内容

### 1. textContent 与 innerHTML

`textContent` 读写纯文本，赋值时标签被当作普通字符；`innerHTML` 读写 HTML 源码，赋值时浏览器会解析并创建元素。展示用户输入时必须用 `textContent`，用 `innerHTML` 拼接输入会把 `<img onerror=...>` 之类的片段变成可执行代码。

```js
const box = document.createElement("div");
box.innerHTML = "<b>粗体</b>";
const text = document.createElement("div");
text.textContent = "<b>粗体</b>";
console.log(box.children[0].nodeName); // "B"，解析成了元素
console.log(text.textContent); // "<b>粗体</b>"，原样显示
```

### 2. 创建与插入节点

`document.createElement` 创建元素，`append` 插入到末尾，`prepend` 插入到开头，`insertBefore` 插入到指定节点之前。节点插入后即进入文档，之前的引用仍然有效；要把节点移到别处直接用 `append`，它会从原位置移除。

```js
const list = document.createElement("ul");
list.innerHTML = "<li>A</li>";
const item = document.createElement("li");
item.textContent = "B";
list.append(item);
console.log(list.children.length); // 2
console.log(item.textContent); // "B"
```

### 3. classList、dataset 与 style

`classList` 提供 `add`、`remove`、`toggle`、`contains`，避免手工拼接 `className`；`dataset` 读写 `data-*` 属性，`data-task-id` 对应 `dataset.taskId`；`style` 读写内联样式，单位要自行补全。批量样式优先用类名配合 CSS。

```js
const item = document.createElement("li");
item.className = "task";
item.dataset.id = "7";
item.classList.add("done");
item.style.color = "rgb(200, 0, 0)";
console.log(item.classList.contains("done")); // true
console.log(item.dataset.id); // "7"
console.log(item.style.color); // "rgb(200, 0, 0)"
```

### 4. DocumentFragment

`DocumentFragment` 是轻量容器，节点先挂进去，再一次性插入文档，只触发一次布局计算。循环插入几十个节点时，逐次 `append` 会造成多次重排，用片段可以减少开销。

```js
const host = document.createElement("div");
const fragment = document.createDocumentFragment();
for (let i = 0; i < 3; i += 1) {
  const span = document.createElement("span");
  span.textContent = i;
  fragment.append(span);
}
host.append(fragment);
console.log(host.children.length); // 3
```

## 四、移除与替换

### 1. remove

`element.remove()` 把节点从文档中移除，返回 `undefined`；`replaceWith` 用新节点替换当前节点。移除后元素仍在内存中，变量仍引用它，可以再次插入；不再需要时应同时解除引用。

```js
const list = document.createElement("ul");
list.innerHTML = "<li>A</li><li>B</li>";
const item = list.children[0];
item.remove();
console.log(list.children.length); // 1
```

### 2. 批量更新的顺序

先读完再写、先构建再插入，能避免在遍历过程中改动树结构。遍历动态集合时增删节点，长度会变化，容易漏掉或重复处理；需要边遍历边修改时，先把集合复制成数组。

## 五、从空目录观察 DOM

### 1. 创建页面

新建空目录 `js-dom`，创建 `index.html`。页面包含一个两项列表与两个用于对比 `innerHTML`、`textContent` 的容器，脚本依次执行查询、追加节点、类名与样式修改、HTML 与文本写入、片段插入与节点移除，并把每一步的结果写入表格。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>DOM 查询与修改观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>DOM 查询与修改观察</h1>
  <ul id="list">
    <li class="item" data-id="1">第一项</li>
    <li class="item" data-id="2">第二项</li>
  </ul>
  <div id="html-box"></div>
  <div id="text-box"></div>
  <table id="output">
    <thead><tr><th>观察项</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const list = document.getElementById("list");
    const itemsBefore = document.querySelectorAll(".item");
    const liveBefore = document.getElementsByClassName("item");

    const extra = document.createElement("li");
    extra.className = "item";
    extra.dataset.id = "3";
    extra.textContent = "第三项";
    list.append(extra);

    const staticLengthAfter = itemsBefore.length;
    const liveLengthAfter = liveBefore.length;
    const itemsAfter = document.querySelectorAll(".item");

    const firstItem = list.querySelector(".item");
    firstItem.classList.add("active");
    firstItem.style.color = "rgb(200, 0, 0)";

    const htmlBox = document.getElementById("html-box");
    htmlBox.innerHTML = "<b>粗体</b>";
    const textBox = document.getElementById("text-box");
    textBox.textContent = "<b>粗体</b>";

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 3; i += 1) {
      const node = document.createElement("span");
      node.textContent = "片段" + i;
      fragment.append(node);
    }
    const fragmentHost = document.createElement("div");
    fragmentHost.append(fragment);

    const removed = extra.remove();
    const liveLengthRemoved = liveBefore.length;

    const rows = [
      ["getElementById(\"list\").tagName", list.tagName, "元素节点"],
      ["querySelectorAll(\".item\") 初始长度", 2, "第一次查询得到 2 个"],
      ["追加后同一个 NodeList 的长度", staticLengthAfter, "保持 2，静态快照"],
      ["追加后同一个 HTMLCollection 的长度", liveLengthAfter, "变为 3，实时反映"],
      ["追加后重新 querySelectorAll 的长度", itemsAfter.length, "新查询得到 3"],
      ["移除后同一个 HTMLCollection 的长度", liveLengthRemoved, "回到 2"],
      ["firstItem.textContent", firstItem.textContent, "读取文本"],
      ["firstItem.dataset.id", firstItem.dataset.id, "读取 data-* 属性"],
      ["firstItem.classList.contains(\"active\")", firstItem.classList.contains("active"), "类名操作"],
      ["firstItem.style.color", firstItem.style.color, "内联样式"],
      ["html-box.childNodes[0].nodeName", htmlBox.childNodes[0].nodeName, "innerHTML 解析标签"],
      ["text-box.childNodes[0].nodeName", textBox.childNodes[0].nodeName, "textContent 当作纯文本"],
      ["html-box.textContent", htmlBox.textContent, "HTML 被解析为元素"],
      ["text-box.textContent", textBox.textContent, "标签作为文字显示"],
      ["DocumentFragment 插入后的子节点数", fragmentHost.children.length, "一次插入多个节点"],
      ["typeof remove() 的返回值", typeof removed, "remove 返回 undefined"],
      ["remove 后 list.children.length", list.children.length, "节点已移除"],
      ["document.nodeType", document.nodeType, "文档节点为 9"],
      ["list.nodeType", list.nodeType, "元素节点为 1"],
      ["list.firstChild.nodeType", list.firstChild.nodeType, "文本节点为 3"],
    ];

    const body = document.querySelector("#output tbody");
    for (const [label, value, extraText] of rows) {
      const row = document.createElement("tr");
      for (const text of [label, JSON.stringify(value), extraText]) {
        const cell = document.createElement("td");
        cell.textContent = text;
        row.append(cell);
      }
      body.append(row);
    }

    console.log("nodeList", itemsBefore.length, staticLengthAfter, itemsAfter.length);
    console.log("htmlCollection", 2, liveLengthAfter, liveLengthRemoved);
    console.log("html node", htmlBox.childNodes[0].nodeName, "text node", textBox.childNodes[0].nodeName);
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有二十行。同一个 `NodeList` 在追加节点后长度保持 `2`，重新查询得到 `3`；同一个 `HTMLCollection` 从 `2` 变成 `3`，移除后回到 `2`。`firstItem` 读取到 `第一项`，`dataset.id` 为 `"1"`，类名操作返回 `true`，样式为 `rgb(200, 0, 0)`。`innerHTML` 写入的 `<b>` 变成元素节点 `B`，`textContent` 写入的标签原样显示；片段插入后子节点数为 `3`；`remove()` 返回 `undefined`；文档、元素、文本节点的 `nodeType` 分别为 `9`、`1`、`3`。控制台三条输出与表格一致。

| 观察项 | 结果 | 说明 |
|--------|------|------|
| `getElementById("list").tagName` | `"UL"` | 元素节点 |
| `querySelectorAll(".item")` 初始长度 | `2` | 第一次查询得到 2 个 |
| 追加后同一个 `NodeList` 的长度 | `2` | 保持 2，静态快照 |
| 追加后同一个 `HTMLCollection` 的长度 | `3` | 变为 3，实时反映 |
| 追加后重新 `querySelectorAll` 的长度 | `3` | 新查询得到 3 |
| 移除后同一个 `HTMLCollection` 的长度 | `2` | 回到 2 |
| `firstItem.textContent` | `"第一项"` | 读取文本 |
| `firstItem.dataset.id` | `"1"` | 读取 `data-*` 属性 |
| `firstItem.classList.contains("active")` | `true` | 类名操作 |
| `firstItem.style.color` | `"rgb(200, 0, 0)"` | 内联样式 |
| `html-box.childNodes[0].nodeName` | `"B"` | `innerHTML` 解析标签 |
| `text-box.childNodes[0].nodeName` | `"#text"` | `textContent` 当作纯文本 |
| `html-box.textContent` | `"粗体"` | HTML 被解析为元素 |
| `text-box.textContent` | `"<b>粗体</b>"` | 标签作为文字显示 |
| `DocumentFragment` 插入后的子节点数 | `3` | 一次插入多个节点 |
| `typeof remove()` 的返回值 | `"undefined"` | `remove` 返回 `undefined` |
| `remove` 后 `list.children.length` | `2` | 节点已移除 |
| `document.nodeType` | `9` | 文档节点为 9 |
| `list.nodeType` | `1` | 元素节点为 1 |
| `list.firstChild.nodeType` | `3` | 文本节点为 3 |

### 3. 失败分支

创建 `before-dom.html`，把访问 `#app` 的脚本放在 `<head>` 中且不加 `defer`。脚本执行时 `<div id="app">` 还没解析出来，`getElementById` 返回 `null`，赋值抛 `TypeError: Cannot set properties of null (setting 'textContent')`。修复是把脚本移到 `</body>` 前、加上 `defer`，或在 `DOMContentLoaded` 之后执行。

另一类问题不报错：用 `innerHTML` 拼接用户输入时，片段里的标签会被解析执行；用 `querySelectorAll` 缓存节点后又在别处增删，集合不会更新，逻辑仍在旧数据上运行。前者应改用 `textContent`，后者应重新查询或在增删后同步维护集合。

## 六、验证记录与边界

以上页面于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格二十行与控制台三条输出与正文一致；`before-dom.html` 得到 `TypeError: Cannot set properties of null (setting 'textContent')`。两个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器与旧版本环境，也没有展开 `Range` 与选区、`Shadow DOM`、自定义元素、`MutationObserver` 与框架的渲染差异；这些内容需要按目标环境核对。
