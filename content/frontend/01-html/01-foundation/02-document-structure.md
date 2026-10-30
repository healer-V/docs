---
title: "HTML 文档结构"
tags:
  - HTML
  - DOCTYPE
  - 字符编码
excerpt: "从空目录创建第一个 HTML 文件，说明 DOCTYPE、html、head、body、编码声明、title 与 viewport 的作用，并用控制台读数和 Nu 检查器验证标准模式、编码及各部分缺失或写错时的表现。"
date: 2026-10-30
---

# HTML 文档结构

一个 HTML 文件由两部分组成：第一行的**文档类型声明**（DOCTYPE），以及包住全部内容的 `html` **根元素**。根元素下分为 `head` 和 `body`：`head` 存放关于文档本身的信息，例如字符编码和标题；`body` 存放页面上显示的内容。浏览器根据这些部分决定渲染模式、文字解码方式、标签页标题和移动端的布局宽度。

## 一、创建第一个 HTML 文件

### 1. 编写并打开页面

::: info 只需要文本编辑器和浏览器
任何能保存纯文本的编辑器都可以编写 HTML，例如 VS Code。文件必须以 UTF-8 编码保存，VS Code 状态栏右侧会显示当前文件的编码。本文的控制台结果在 Chromium 151 中实测。
:::

1. 新建空目录 `html-start`。
2. 在目录中创建 `index.html`，写入下面的完整内容并保存。
3. 双击 `index.html`，或把它拖进浏览器窗口。页面显示标题“前端技术沙龙”和一行时间，浏览器标签页显示“前端技术沙龙报名”。

::: details 查看 index.html 完整内容

```html [index.html]
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>前端技术沙龙报名</title>
  </head>
  <body>
    <h1>前端技术沙龙</h1>
    <p>时间：2026 年 11 月 21 日 14:00</p>
  </body>
</html>
```

:::

各行的作用如下，后面各节逐项说明缺失或写错时的表现：

| 行 | 内容 | 作用 |
|----|------|------|
| 1 | `<!DOCTYPE html>` | 让浏览器使用标准模式 |
| 2、12 | `html` 元素 | 根元素；`lang="zh-CN"` 声明内容语言为中文（中国大陆） |
| 3～7 | `head` 元素 | 文档信息，不作为页面内容显示 |
| 4 | `meta charset` | 声明文件使用 UTF-8 编码 |
| 5 | `meta name="viewport"` | 让移动端浏览器按设备宽度布局 |
| 6 | `title` | 标签页和书签中显示的标题 |
| 8～11 | `body` 元素 | 页面上显示的内容 |

### 2. 在控制台确认读取结果

文档结构有问题时，页面通常照常显示，浏览器也不会提示，需要到开发者工具中读取实际结果。按 F12（macOS 为 Option+Command+I）打开开发者工具，在 Console 中逐行输入：

```js
document.compatMode
document.characterSet
document.title
document.documentElement.lang
```

| 表达式 | 结果 | 含义 |
|--------|------|------|
| `document.compatMode` | `CSS1Compat` | 标准模式；怪异模式时为 `BackCompat` |
| `document.characterSet` | `UTF-8` | 浏览器实际使用的解码方式 |
| `document.title` | `前端技术沙龙报名` | 来自 `title` 元素 |
| `document.documentElement.lang` | `zh-CN` | 来自 `html` 元素的 `lang` 属性 |

### 3. 用 Nu 检查器校验

控制台读数说明浏览器怎样理解了文档；源码是否符合 HTML 标准，要交给 [W3C Nu HTML Checker](https://validator.w3.org/nu/)。可以在网页上选择 File Upload 上传 `index.html`，也可以在 `html-start` 目录中执行以下命令（需要联网）：

```bash
curl -s -H 'Content-Type: text/html; charset=utf-8' --data-binary @index.html 'https://validator.w3.org/nu/?out=text'
```

```text
The document validates according to the specified schema(s).
```

这行输出表示没有发现错误。本文的错误示例都用同一条命令检查，只替换文件名。

## 二、DOCTYPE 与渲染模式

### 1. DOCTYPE 的作用

`<!DOCTYPE html>` 不是元素，而是写在文件最前面的声明。它让浏览器使用**标准模式**，按现行规范呈现页面；缺少它时，浏览器进入**怪异模式**（quirks mode），模拟早期浏览器的一些非标准行为，以兼容很早以前编写的页面（[HTML 标准：DOCTYPE](https://html.spec.whatwg.org/multipage/syntax.html#the-doctype)、[MDN：怪异模式与标准模式](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Quirks_mode_and_standards_mode)）。

DOCTYPE 不区分大小写，写成 `<!doctype html>` 同样得到 `CSS1Compat`。

### 2. 缺少 DOCTYPE 时的差异

怪异模式的影响只出现在部分元素和属性上，页面往往看起来正常。在 `html-start` 中创建 `mode.html`，在 `body` 上设置 20px 字号，再放一个段落和一个表格：

::: details 查看 mode.html 完整内容

```html [mode.html]
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>渲染模式对照</title>
</head>
<body style="font-size: 20px;">
  <p>签到安排</p>
  <table>
    <tr><td>14:00 签到</td></tr>
  </table>
</body>
</html>
```

:::

复制一份并命名为 `mode-no-doctype.html`，删除其中的第 1 行。分别打开两个文件，在控制台执行：

```js
document.compatMode
getComputedStyle(document.querySelector('p')).fontSize
getComputedStyle(document.querySelector('td')).fontSize
```

| 文件 | `compatMode` | 段落字号 | 表格单元格字号 |
|------|--------------|----------|----------------|
| `mode.html` | `CSS1Compat` | `20px` | `20px` |
| `mode-no-doctype.html` | `BackCompat` | `20px` | `16px` |

怪异模式下，表格不继承外层设置的字号，单元格回到浏览器默认的 16px。缺少 DOCTYPE 的页面可能长期看似正常，直到排查某个布局或字号问题时才暴露原因。

删除 `index.html` 的第 1 行后用 Nu 检查，第一条错误就指出了问题：

```text
Error: Start tag seen without seeing a doctype first. Expected “<!DOCTYPE html>”.
From line 1, column 1; to line 1, column 19
There were errors.
```

### 3. DOCTYPE 之前的内容

DOCTYPE 前面只能出现注释和空白。在 `index.html` 第 1 行之前分别插入一行注释和一行文字，结果不同：

| 第 1 行之前插入 | `compatMode` | Nu 检查结果 |
|-----------------|--------------|-------------|
| `<!-- 报名页 -->` | `CSS1Compat` | 通过 |
| `报名页` | `BackCompat` | 报错并停止检查 |

文字 `报名页` 出现在 DOCTYPE 之前，解析器认为文档内容已经开始且没有 DOCTYPE，于是进入怪异模式；随后的 `<!DOCTYPE html>` 和 `<html>` 被当作多余的标记。

:::: details 查看 DOCTYPE 前有文字时的 Nu 完整输出

```text
Error: Non-space characters found without seeing a doctype first. Expected “<!DOCTYPE html>”.
From line 1, column 1; to line 1, column 4
Error: Element “head” is missing a required instance of child element “title”.
From line 1, column 1; to line 1, column 4
Error: Stray doctype.
From line 2, column 1; to line 2, column 15
Error: Stray start tag “html”.
From line 3, column 1; to line 3, column 19
Fatal Error: Cannot recover after last error. Any further errors will be ignored.
From line 3, column 1; to line 3, column 19
There were errors.
```

::::

## 三、html、head 与 body

### 1. 三个元素的职责

- `html` 是根元素，文档中的其他元素都在它里面。`lang` 属性声明内容的主要语言，取值是 BCP 47 语言标签，例如 `zh-CN`、`en`；屏幕阅读器等辅助技术据此选择发音规则（[HTML 标准：lang 属性](https://html.spec.whatwg.org/multipage/dom.html#the-lang-and-xml:lang-attributes)）。
- `head` 存放**元数据**（metadata），即描述文档本身、不作为页面内容显示的信息，例如字符编码、标题、视口设置，以及引入样式表和脚本的元素。
- `body` 存放页面内容，即读者看到和操作的标题、段落、图片、表单等。

### 2. 可省略的标签

HTML 语法允许在不产生歧义时省略 `html`、`head`、`body` 的开始和结束标签，解析器会自动补出这些元素（[HTML 标准：可省略的标签](https://html.spec.whatwg.org/multipage/syntax.html#syntax-tag-omission)）。在 `html-start` 中创建只有 5 行的 `omitted.html`：

```html [omitted.html]
<!DOCTYPE html>
<meta charset="utf-8">
<title>前端技术沙龙报名</title>
<h1>前端技术沙龙</h1>
<p>时间：2026 年 11 月 21 日 14:00
```

在控制台执行 `document.documentElement.outerHTML`，得到浏览器补全后的结构：

```text
<html><head><meta charset="utf-8">
<title>前端技术沙龙报名</title>
</head><body><h1>前端技术沙龙</h1>
<p>时间：2026 年 11 月 21 日 14:00
</p></body></html>
```

`head`、`body` 和 `p` 的结束标签都被补上。Nu 检查没有错误，只给出一条警告：

```text
Warning: Consider adding a “lang” attribute to the “html” start tag to declare the language of this document.
From line 1, column 16; to line 2, column 22
The document validates according to the specified schema(s).
```

省略 `html` 开始标签后就没有位置写 `lang`，`document.documentElement.lang` 为空字符串。

::: tip 至少保留带 lang 的 html 开始标签
省略写法合法，但不写 `html` 开始标签会同时丢失语言声明。编写普通页面时建议完整写出这三个元素，让源码结构与 DOM 一致。
:::

### 3. 内容写进 head 时

`head` 只能包含元数据元素。把页面内容写进 `head`，解析器会提前结束 `head`。复制 `index.html` 并命名为 `head-error.html`，在第 5 行之后插入 `<p>报名入口</p>`。以下是修改后的第 3～8 行：

```html
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <p>报名入口</p>
    <title>前端技术沙龙报名</title>
  </head>
```

打开后在控制台读取 `head` 和 `body` 的子元素：

```js
[...document.head.children].map((element) => element.tagName)
[...document.body.children].map((element) => element.tagName)
document.title
```

| 读取对象 | 结果 |
|----------|------|
| `head` 的子元素 | `META`、`META` |
| `body` 的子元素 | `P`、`TITLE`、`H1`、`P` |
| `document.title` | `前端技术沙龙报名` |

解析器遇到 `<p>` 时认为 `head` 已经结束，自动开始 `body`，之后的 `title` 也落进了 `body`。`document.title` 读取的是文档中第一个 `title` 元素，不检查它的位置，所以标签页标题照常显示，错误只在 DOM 和检查器中可见。Nu 的输出如下：

```text
Error: Element “head” is missing a required instance of child element “title”.
From line 6, column 5; to line 6, column 7
Error: Element “title” not allowed as child of element “body” in this context. (Suppressing further errors from this subtree.)
From line 7, column 5; to line 7, column 11
Error: Stray end tag “head”.
From line 8, column 3; to line 8, column 9
Error: Start tag “body” seen but an element of the same type was already open.
From line 9, column 3; to line 9, column 8
There were errors.
```

第一条错误的位置就是插入的 `<p>`：`head` 在这里结束，因此缺少 `title`。后三条都是连锁结果，把 `<p>` 移进 `body` 后全部消失。

## 四、字符编码声明

### 1. 文件编码与 meta charset

文件中保存的是字节，**字符编码**规定字节与字符的对应关系。同一个常用汉字在 UTF-8 中占 3 个字节，在 GBK 中占 2 个字节。浏览器必须使用与保存时相同的编码解码，否则得到乱码。

`<meta charset="utf-8">` 告诉浏览器文件使用 UTF-8 编码。HTML 标准对编码有两条直接影响写法的要求（[HTML 标准：编码声明](https://html.spec.whatwg.org/multipage/semantics.html#charset)）：

1. 无论是否写了声明，文档实际使用的编码都必须是 UTF-8。声明不能改变文件本身的编码。
2. 包含编码声明的元素必须完整出现在文档的前 1024 个字节内，所以通常把它写成 `head` 的第一个子元素。

### 2. 文件以 GBK 保存时

文件编码与声明不一致时，通过本地文件打开的页面按声明解码。把 `index.html` 转成 GBK 编码，另存为 `gbk.html`，文件中仍然写着 `<meta charset="utf-8">`。macOS 和 Linux 可以在 `html-start` 中执行：

```bash
iconv -f UTF-8 -t GBK index.html > gbk.html
```

在 VS Code 中，也可以点击状态栏的编码，选择“通过编码保存”后选 GBK。打开 `gbk.html` 的读数如下：

| 读取对象 | 结果 |
|----------|------|
| `document.characterSet` | `UTF-8` |
| `document.title` | `ǰ�˼���ɳ������` |
| `h1` 的文字 | `ǰ�˼���ɳ��` |

GBK 编码的汉字字节大多不能组成合法的 UTF-8 序列，显示为 `�`；少数字节恰好组成合法序列，变成 `ǰ` 这类无关字符。Nu 检查报告了 23 条同类错误，以下是前两行：

```text
Error: Malformed byte sequence: “b6”.
At line 6, column 13
```

修复方法是用 UTF-8 重新保存文件，而不是修改 `meta` 中的编码名称。

### 3. 服务器响应头的编码优先

通过网络访问页面时，服务器返回的 `Content-Type` 响应头可以带 `charset`。浏览器按以下顺序确定编码：字节顺序标记（BOM）、用户手动指定的编码、响应头中的 `charset`、文档中的 `meta` 声明（[HTML 标准：确定字符编码](https://html.spec.whatwg.org/multipage/parsing.html#determining-the-character-encoding)）。响应头写错时，文件和 `meta` 都正确也会乱码。

以下 `server.mjs` 让响应头声明 GBK，用来复现这个问题。它需要 Node.js，本例在 Node.js 22 中验证。在 `html-start` 中创建：

```js [server.mjs]
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'

// 故意让响应头声明 GBK，而 index.html 实际以 UTF-8 保存
createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=gbk' })
  response.end(readFileSync('index.html'))
}).listen(8080, () => console.log('http://localhost:8080/'))
```

在 `html-start` 中执行 `node server.mjs`，终端输出：

```text
http://localhost:8080/
```

用浏览器访问这个地址，读数如下：

| 读取对象 | 结果 |
|----------|------|
| `document.characterSet` | `GBK` |
| `document.title` | `鍓嶇鎶€鏈矙榫欐姤鍚�` |

UTF-8 的字节被按 GBK 解读，变成另一组汉字，方向与 `gbk.html` 相反。这类乱码的特征是 `document.characterSet` 不是 `UTF-8`；排查时在开发者工具的 Network 面板中选中该请求，查看响应头的 `Content-Type`，再修正服务器配置。在终端按 Ctrl+C 停止服务。

## 五、title 与 viewport

### 1. title

普通 HTML 文档的 `head` 中必须恰好有一个 `title` 元素。它的文字显示在浏览器标签页和书签中，也是 `document.title` 的来源。

复制 `index.html` 并命名为 `no-title.html`，删除第 6 行的 `title`。打开后 `document.title` 为空字符串，Nu 报告：

```text
Error: Element “head” is missing a required instance of child element “title”.
From line 6, column 3; to line 6, column 9
There were errors.
```

报告位置是第 6 行的 `</head>`：检查器读到 `head` 结束时仍没有找到 `title`。

### 2. viewport

手机浏览器遇到没有 viewport 声明的页面时，会按比屏幕宽得多的虚拟宽度布局，再整体缩小显示，以适配为桌面设计的旧页面。`<meta name="viewport" content="width=device-width, initial-scale=1">` 让布局宽度等于设备宽度，并且初始不缩放。

复制 `index.html` 并命名为 `no-viewport.html`，删除第 5 行。按以下步骤对照：

1. 在开发者工具中按 Ctrl+Shift+M（macOS 为 Command+Shift+M）打开设备工具栏，在设备列表中选择 Pixel 7。
2. 分别打开两个文件并刷新，在控制台执行 `[document.documentElement.clientWidth, screen.width]`。

| 文件 | 布局宽度 `clientWidth` | 屏幕宽度 `screen.width` |
|------|------------------------|-------------------------|
| `index.html` | `412` | `412` |
| `no-viewport.html` | `980` | `412` |

没有 viewport 声明时，页面按 980px 宽布局，再缩小到 412px 宽的屏幕上，文字随之变小。

## 六、常见错误的定位

### 1. 浏览器显示源码

如果打开页面后看到的是带尖括号的源码，先检查文件的真实扩展名。部分编辑器保存时会追加 `.txt`，而系统设置为隐藏扩展名时，文件看起来仍然叫 `index.html`。

把 `index.html` 另存为 `index.html.txt` 后打开，控制台中 `document.contentType` 为 `text/plain`，页面中没有 `h1` 元素，显示的第一行文字就是 `<!DOCTYPE html>`。浏览器按纯文本显示了文件，没有进行 HTML 解析。把扩展名改为 `.html` 即可恢复。

### 2. 按读数定位问题

| 现象 | 读数或检查结果 | 原因 | 处理 |
|------|----------------|------|------|
| 表格字号或布局与预期不同 | `compatMode` 为 `BackCompat` | 缺少 DOCTYPE，或 DOCTYPE 前有文字 | 把 `<!DOCTYPE html>` 写在第一行 |
| 文字乱码 | `characterSet` 为 `UTF-8`，Nu 报 `Malformed byte sequence` | 文件没有以 UTF-8 保存 | 用 UTF-8 重新保存文件 |
| 文字乱码 | `characterSet` 不是 `UTF-8` | 服务器响应头的 `charset` 错误 | 修正服务器的 `Content-Type` |
| 标签页没有标题 | `document.title` 为空字符串 | 缺少 `title` | 在 `head` 中补上 `title` |
| 元数据跑到 `body` 中 | Nu 报 `Stray end tag “head”` | `head` 中写了页面内容元素 | 把内容元素移进 `body` |
| 手机上页面被整体缩小 | 设备模拟下 `clientWidth` 为 `980` | 缺少 viewport 声明 | 在 `head` 中补上 viewport |

::: tip 文档骨架的验收标准
控制台中 `compatMode`、`characterSet`、`title`、`lang` 分别为 `CSS1Compat`、`UTF-8`、预期标题和预期语言，设备模拟下 `clientWidth` 等于屏幕宽度，并且 Nu 检查没有错误，说明浏览器按预期读取了文档骨架。这些读数不检查 `body` 中的元素是否选得合适，内容语义的判断方法见 [HTML 概述](./01-overview.md)。
:::
