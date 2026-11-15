---
title: "第一个程序与脚本引入"
tags:
  - JavaScript
  - 脚本引入
  - 控制台
excerpt: "从空目录创建 HTML 与外部脚本，计算总价并写入页面，说明脚本路径、元素选择、textContent 与控制台输出，并复现路径错误、执行时机错误和全角符号导致的三种失败。"
date: 2026-11-15
---

# 第一个程序与脚本引入

学习 JavaScript 的第一个可观察结果，不需要框架，也不需要构建工具。一个 HTML 文件负责页面结构，一个 `.js` 文件负责计算和写入，浏览器打开页面后就能看到结果。

这个最小链路包含四件事：页面用 `id` 标出目标元素，脚本用 `document.getElementById()` 找到它，用 `textContent` 写入文本，用 `console.log()` 留下中间值。任何一环出错，页面都会停在“等待写入”的状态，而控制台会给出线索。

本篇从空目录创建这两个文件，运行并核对结果，再复现三种常见失败：脚本路径写错、脚本在目标元素之前执行、以及把半角符号写成全角符号。

::: info 本篇的范围
本篇只建立“能运行并看到结果”的最小链路，不展开变量规则、类型和 DOM API。脚本加载顺序见“JavaScript 的组成与运行位置”，变量声明见“变量、声明与命名”，DOM 查询见“DOM 查询与修改”。
:::

## 一、一个页面加一个脚本文件

### 1. 页面骨架包含什么

最小的 HTML 页面需要文档类型、`html`、`head`、`body` 和字符编码声明。`lang` 与 `title` 不是脚本运行的前提，但能让页面结构和浏览器标签页正确显示。`<meta charset="utf-8">` 必须出现在脚本读取中文之前。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>第一个程序</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>第一个程序</h1>
  <p id="output">等待脚本写入……</p>
  <script src="./app.js"></script>
</body>
</html>
```

:::

`<p id="output">` 是脚本要修改的目标，初始文本只是占位。`<script src="./app.js"></script>` 放在 `</body>` 前，此时目标元素已经解析完成。

### 2. 用 src 引入外部脚本

`src` 的路径相对于当前 HTML 文件。`./app.js` 表示同一目录下的 `app.js`；写成 `/app.js` 会从站点根目录查找，写成 `../app.js` 会到上一级目录查找。文件名和扩展名必须与实际文件一致，大小写也要一致。

```html
<script src="./app.js"></script>
```

带 `src` 的 `<script>` 不应再写内联代码。浏览器会下载并执行外部文件，元素内部的文本被忽略，容易造成“代码明明写了却不执行”的误判。

### 3. 保存编码与扩展名

HTML 和脚本都保存为 UTF-8。脚本使用 `.js` 扩展名，编辑器据此提供语法高亮和检查。如果用纯文本编辑器保存成 `.txt`，浏览器不会按脚本执行。

脚本文件不需要 HTML 标签，也不需要 `<!doctype>`。它只包含 JavaScript 代码，由页面通过 `src` 引入。

## 二、把结果写到页面上

### 1. 用 id 找到目标元素

`document.getElementById("output")` 在文档中查找 `id="output"` 的元素，找到时返回该元素，找不到时返回 `null`。后续的 `.textContent` 访问建立在返回值不是 `null` 的前提上。

```js
const output = document.getElementById("output");
console.log(output); // <p id="output">…</p>
```

### 2. textContent 写入纯文本

`textContent` 读写元素的文本内容，不解析 HTML。写入 `"总价：36 元"` 时，尖括号和引号都会作为普通字符显示，不会生成新元素。这对第一个程序足够，也避免了把用户输入当成标签解析。

```js
output.textContent = "总价：" + total + " 元";
```

### 3. console.log 观察中间值

`console.log()` 把值输出到开发者工具的 Console 面板，不改变页面。它适合检查变量当前是什么、表达式算出了什么。页面显示最终结果，控制台记录过程，两者分工不同。

```js
console.log("总价", total); // 总价 36
```

多个参数会依次显示，中间用空格分隔。打开 Console 的方法因浏览器而异，在 Chrome 中是右键页面选择“检查”，再切换到 Console。

## 三、从空目录运行第一个程序

### 1. 创建两个文件

新建空目录 `js-first`，创建 `index.html` 与 `app.js`，都保存为 UTF-8。`app.js` 内容如下：

```js
const price = 12;
const count = 3;
const total = price * count;

document.getElementById("output").textContent = "总价：" + total + " 元";
console.log("总价", total);
```

前三行声明两个单价与数量，第三行计算总价；后两行分别写入页面和输出到控制台。

### 2. 打开页面并读取结果

双击 `index.html`，或用浏览器打开该文件的本地路径。页面应显示标题“第一个程序”和一行“总价：36 元”。原来的“等待脚本写入……”被替换，说明脚本已经执行并找到目标元素。

| 观察项 | 位置 | 本次结果 |
|--------|------|----------|
| 页面文本 | `<p id="output">` | 总价：36 元 |
| 控制台 | Console 面板 | `总价 36` |
| 页面标题 | 浏览器标签页 | 第一个程序 |
| 脚本请求 | Network 面板 | `app.js` 返回 200 或本地文件成功 |

### 3. 用开发者工具核对

打开 Console 后重新加载页面，应看到一行 `总价 36`。如果页面文本正确但控制台没有记录，检查 `console.log` 是否被注释或删除；如果控制台有记录但页面没变，检查 `id` 是否拼写一致、脚本是否在目标元素之后。

::: tip 先看 Console
空白页、文本没变化、按钮没反应，第一步都是打开 Console。语法错误、找不到元素、请求失败都会在那里留下记录；只看页面结果容易把不同原因混成“脚本没生效”。
:::

## 四、三种常见失败

### 1. 脚本路径错误

把 `src` 改成不存在的文件：

```html
<script src="./apps.js"></script>
```

页面保持“等待脚本写入……”，Console 显示 `Failed to load resource: net::ERR_FILE_NOT_FOUND`。脚本根本没有加载，所以既没有计算结果，也没有后续错误。修复是核对文件名、目录和大小写，确认 Network 面板中请求的地址与实际文件一致。

### 2. 脚本在目标元素之前执行

把 `<script>` 移到 `</head>` 之前：

```html
<head>
  <meta charset="utf-8">
  <title>第一个程序</title>
  <script src="./app.js"></script>
</head>
```

此时 `document.getElementById("output")` 返回 `null`，Console 显示 `Cannot set properties of null (setting 'textContent')`。页面同样停在占位文本。修复方式有两种：把脚本移到 `</body>` 前，或给脚本加 `defer`，让它在文档解析完成后执行。

```html
<script defer src="./app.js"></script>
```

### 3. 全角符号导致语法错误

把 `app.js` 中的分号写成中文全角分号：

```js
const total = 12 * 3；
```

Console 显示 `Invalid or unexpected token`，整个脚本都不执行，页面保持占位文本。全角分号、全角引号和中文括号都不是 JavaScript 语法的一部分。修复是切换到半角输入，重新保存并刷新页面。

::: warning 三种失败的区分
路径错误没有脚本执行，错误指向资源加载；执行时机错误已经加载脚本，但目标元素是 `null`；语法错误连解析都没通过，整个文件都不执行。先看 Console 的第一条错误，再决定检查路径、位置还是符号。
:::

## 五、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。`index.html` 页面文本为“总价：36 元”，Console 输出 `总价 36`，没有错误。`wrong-path.html` 保持占位文本并出现 `ERR_FILE_NOT_FOUND`；`head-script.html` 保持占位文本并出现 `Cannot set properties of null (setting 'textContent')`；`syntax-error.html` 保持占位文本并出现 `Invalid or unexpected token`。

三个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。本文没有验证其他浏览器和移动端，也没有展开 `document` 的完整 API；`file://` 只适用于普通脚本，模块脚本需要 HTTP 服务，见上一篇的失败分支。
