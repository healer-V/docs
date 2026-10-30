---
title: "HTML 概述"
tags:
  - HTML
  - DOM
  - 浏览器
excerpt: "说明标记与超文本链接的含义，划分 HTML、CSS、JavaScript 的职责，并用无障碍树、键盘操作和解析结果对照，证明元素语义的实际作用，以及页面能显示不等于标记正确。"
date: 2026-10-30
---

# HTML 概述

**HTML**（HyperText Markup Language，超文本标记语言）是描述网页内容和结构的语言。作者用标签把文字标记为标题、段落、按钮、链接等元素；浏览器读取这些标记，决定页面由哪些部分组成、默认怎样显示，以及读者能怎样操作。

HTML 文件是纯文本，任何文本编辑器都能编写，用浏览器直接打开就能看到结果，不需要编译或安装运行环境。

## 一、标记与超文本

### 1. 没有标记的文字

浏览器不会从文字本身猜出哪一句是标题、哪一句是按钮。新建空目录 `html-intro`，在其中创建 `plain.html`，`body` 中只写三行没有标签的文字：

::: details 查看 plain.html 完整内容

```html [plain.html]
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>未标记的文字</title>
</head>
<body>
  前端技术沙龙
  时间：2026 年 11 月 21 日 14:00
  提交报名
</body>
</html>
```

:::

用浏览器打开后，三行文字连成一行显示。按 F12（macOS 为 Option+Command+I）打开开发者工具，在 Console（控制台）中输入表达式并回车，可以读取页面状态。以下结果在 Chromium 151 中实测：

| 表达式 | 结果 |
|--------|------|
| `document.body.innerText` | `前端技术沙龙 时间：2026 年 11 月 21 日 14:00 提交报名` |
| `document.body.children.length` | `0` |

源码中的换行和缩进属于**空白字符**，按浏览器默认的空白处理规则，连续空白显示为一个空格，所以三行变成一行。`children.length` 为 `0` 说明 `body` 中没有任何元素：对浏览器而言这只是一段文字，“提交报名”也只是四个字，不能点击。

### 2. 用标签标记内容

给同样的内容加上标签，每段文字就有了明确的角色。以下是局部 HTML，省略文档外壳：

```html
<h1>前端技术沙龙</h1>
<p>时间：2026 年 11 月 21 日 14:00</p>
<button type="button">提交报名</button>
```

1. `<h1>` 是开始**标签**，`</h1>` 是结束标签，两者连同中间的内容构成一个 `h1` **元素**，表示一级标题。
2. `p` 元素表示段落。`button` 元素表示可以操作的按钮；`type="button"` 是写在开始标签里的**属性**，表示它是普通按钮，而不是提交表单的按钮。
3. 浏览器为每种元素提供默认外观和默认行为：标题字号更大，段落各自成块，按钮可以点击，也可以用键盘操作。

“标记语言”的含义就在于此：HTML 不做计算，也不编写判断逻辑，只用标签声明内容是什么、怎样组织。需要计算或响应操作时，交给 JavaScript。

### 3. 超文本与链接

**超文本**是包含链接的文本：读者点击其中一段文字，就能跳到另一份文档或当前文档的另一个位置。HTML 用 `a` 元素和 `href` 属性表达链接。以下是局部 HTML：

```html
<a href="https://html.spec.whatwg.org/multipage/">HTML 标准</a>
<a href="#agenda">查看日程</a>
```

`href` 的值是一个 URL。第一个链接指向另一个网站上的文档；第二个以 `#` 开头，指向当前页面中 `id="agenda"` 的元素。`a` 元素中的文字是读者看到并点击的部分，应当说明链接目标。

带 `href` 的 `a` 元素由浏览器提供跳转行为，并且可以用 Tab 键聚焦。网页之间通过这类链接互相引用，构成了 Web；HTML 名称中的 HyperText 指的就是这种能力。

## 二、HTML、CSS 与 JavaScript 的分工

网页通常由三种语言共同完成，每种语言回答不同的问题：

| 语言 | 回答的问题 | 报名页中的例子 |
|------|------------|----------------|
| HTML | 内容是什么、怎样分组、有哪些默认行为 | 活动名称是一级标题，“提交报名”是按钮，“查看日程”是链接 |
| CSS | 内容怎样呈现 | 标题使用深蓝色并居中，按钮宽度占满一行 |
| JavaScript | 发生操作或数据变化时做什么 | 点击按钮后检查输入，再把报名数据发送到服务器 |

分不清一个需求属于哪一层时，可以设想去掉某一层后还剩什么：去掉 CSS，页面仍有标题、段落、按钮和链接，只是使用浏览器的默认外观；去掉 JavaScript，按钮仍然能聚焦和点击，只是点击后没有自定义处理；去掉 HTML，就只剩前面 `plain.html` 那样没有结构的文字。

按这个方法判断几个具体需求：

| 需求 | 归属 | 判断依据 |
|------|------|----------|
| 辅助技术能识别出活动名称是一级标题 | HTML | 依赖 `h1` 元素的语义，见第三节的无障碍树对照 |
| 活动名称的字号改为 24px | CSS | 只改变呈现结果 |
| 键盘用户能用 Tab 和 Enter 操作“提交报名” | HTML | `button` 元素自带可聚焦和键盘触发 |
| 点击按钮后文字变为“已提交” | JavaScript | 需要响应点击事件并修改页面 |

::: warning CSS 能改外观，不能补上语义
把 `div` 的字号和字重设置得与 `h1` 完全一样，它对浏览器和辅助技术来说仍然只是普通文字。CSS 负责的范围见 [CSS 与浏览器](../../02-css/01-css-foundation/01-css-and-browser.md)。
:::

## 三、元素语义的实际作用

元素的**语义**是指元素表示的含义，例如“一级标题”“按钮”“链接”。浏览器根据语义提供默认行为，并把语义提供给屏幕阅读器等**辅助技术**。下面用外观相同、元素不同的内容做对照。

### 1. 创建对照页面

在 `html-intro` 中创建 `semantics.html`。第 9 行的 `div` 用内联样式模仿 `h1` 的外观，第 11 行的 `div` 用 `onclick` 属性模仿按钮的点击效果。样式和脚本直接写在属性里，只是为了把对照集中在一个文件中。

::: details 查看 semantics.html 完整内容

```html [semantics.html]
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>元素语义对照</title>
</head>
<body>
  <h1>前端技术沙龙</h1>
  <div style="font-size: 2em; font-weight: bold;">前端技术沙龙</div>
  <button type="button" onclick="this.textContent = '已提交'">提交报名</button>
  <div onclick="this.textContent = '已提交'">提交报名</div>
  <a href="#agenda">查看日程</a>
</body>
</html>
```

:::

打开页面后，第 8 行与第 9 行的计算样式都是 `font-size: 32px`、`font-weight: 700`，肉眼无法区分。

### 2. 无障碍树中的差异

**无障碍树**（accessibility tree）是浏览器根据 DOM 生成、提供给辅助技术的结构，记录每个对象的角色和名称。在 Chromium 开发者工具的 Elements 面板中选中一个元素，切换到 Accessibility 选项卡即可查看它的角色（Role）和名称（Name）。

| 行 | 元素 | 角色 | 名称 |
|----|------|------|------|
| 8 | `h1` | `heading`，级别 1 | 前端技术沙龙 |
| 9 | 加样式的 `div` | `generic` | 无，内容只作为普通文本 |
| 10 | `button` | `button` | 提交报名 |
| 11 | 加 `onclick` 的 `div` | `generic` | 无，内容只作为普通文本 |
| 12 | `a` | `link` | 查看日程 |

辅助技术从无障碍树获取信息：第 8 行会被识别为一级标题，第 9 行只是一段文字；第 10 行是可操作的按钮，第 11 行与普通文字没有区别。

### 3. 键盘操作的差异

按以下步骤只用键盘操作页面：

1. 打开 `semantics.html`，连续按三次 Tab。焦点依次到达 `button` 和 `a`；第三次按 Tab 时，页面中已没有可聚焦的元素，`document.activeElement` 回到 `body`。两个 `div` 都被跳过。
2. 刷新页面，按一次 Tab 让焦点到达 `button`，再按 Enter 或空格。按钮文字变为“已提交”。
3. 用鼠标点击第 11 行的 `div`，它的文字同样变为“已提交”。

鼠标用户看不出两个“提交报名”有什么不同；只用键盘的用户无法到达 `div` 版本，也就无法提交。

::: warning 用 div 模拟按钮会丢失键盘操作
`button` 被 Enter 或空格激活时会派发 `click` 事件，所以同一个 `onclick` 对鼠标和键盘都生效。`div` 没有这种激活行为，也不能通过 Tab 获得焦点。要让 `div` 达到同样效果，需要自行补上可聚焦、按钮角色和键盘处理；直接使用 `button` 就不存在这些遗漏。
:::

## 四、HTML 标准与浏览器解析

### 1. HTML Living Standard

HTML 的现行规范是 WHATWG 维护的 [HTML Living Standard](https://html.spec.whatwg.org/multipage/)，浏览器按它实现元素的含义、默认行为和解析规则。它持续更新，不再发布带版本号的新版本。2019 年 W3C 与 WHATWG 签署[谅解备忘录](https://www.w3.org/2019/04/WHATWG-W3C-MOU.html)，约定 HTML 和 DOM 主要在 WHATWG 按 Living Standard 流程开发，双方此后只维护同一份 HTML 规范（[HTML 标准：历史](https://html.spec.whatwg.org/multipage/introduction.html#history-2)）。

“HTML5”曾是一个规范版本的名称，现在通常泛指一组现代 Web 技术：既包括 HTML 中的元素，也包括存储、多媒体等 JavaScript API（[MDN：HTML5](https://developer.mozilla.org/en-US/docs/Glossary/HTML5)）。

::: tip 按具体特性判断能否使用
“浏览器支持 HTML5”不能说明某个元素或属性可用。需要确认时，查询该元素或属性本身的浏览器支持情况。
:::

### 2. 从源码到 DOM

浏览器拿到 HTML 文件后，按标准规定的[解析模型](https://html.spec.whatwg.org/multipage/parsing.html#overview-of-the-parsing-model)把文本转换成对象树：

1. **解码**：按字符编码把文件中的字节转换为字符。编码判断错误会导致乱码，排查方法见 [HTML 文档结构](./02-document-structure.md)。
2. **分词**：把字符切分为开始标签、结束标签、文本、注释等记号。
3. **建树**：按解析规则把记号组织成节点树。这棵树叫 **DOM**（Document Object Model，文档对象模型）。

浏览器依据 DOM 和 CSS 计算样式、布局并绘制页面，JavaScript 也通过 DOM 读取和修改页面。开发者工具 Elements 面板显示的是 DOM，不是原始源码；查看原始源码使用“查看网页源代码”（Ctrl+U，macOS 为 Option+Command+U）。两者可能不一致，下面的例子说明原因。

### 3. 写错的标记也能显示

HTML 解析规则对错误标记规定了统一的处理方式，浏览器不会因为写错一个标签就拒绝显示页面。在 `html-intro` 中创建 `parse.html`，第 8 行故意漏写 `</strong>`：

::: details 查看 parse.html 完整内容

```html [parse.html]
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>解析结果观察</title>
</head>
<body>
  <p>报名截止：<strong>11 月 18 日</p>
  <p>名额 80 人，额满即止。</p>
</body>
</html>
```

:::

打开后，两段文字都显示为粗体，计算后的 `font-weight` 都是 `700`。在控制台读取两个段落的父元素：

```js
[...document.querySelectorAll('p')].map((paragraph) => paragraph.parentElement.tagName)
```

结果依次是 `BODY` 和 `STRONG`：第二个段落被放进了一个 `strong` 元素。执行 `document.body.innerHTML` 可以看到完整结构，以下输出省略了空白行：

```text
<p>报名截止：<strong>11 月 18 日</strong></p><strong>
  <p>名额 80 人，额满即止。</p>
</strong>
```

解析器在 `</p>` 处结束第一个段落，同时关闭还开着的 `strong`；但它记住了这个没有正常结束的格式元素，遇到后面的内容时重新打开一个 `strong`，第二个段落因此被包了进去。源码第 9 行本身没有错误，显示结果却受到了第 8 行的影响。

### 4. 用检查器确认语法

浏览器会自动修复错误，所以页面能显示不能证明标记正确。[W3C Nu HTML Checker](https://validator.w3.org/nu/) 按 HTML 标准检查源码：可以在网页上选择 File Upload 上传文件，也可以在 `html-intro` 目录中执行以下命令（需要联网）：

```bash
curl -s -H 'Content-Type: text/html; charset=utf-8' --data-binary @parse.html 'https://validator.w3.org/nu/?out=text'
```

检查器的输出如下：

```text
Error: End tag “p” seen, but there were open elements.
From line 8, column 28; to line 8, column 31
Error: Unclosed element “strong”.
From line 8, column 11; to line 8, column 18
Error: Element “p” not allowed as child of element “strong” in this context. (Suppressing further errors from this subtree.)
From line 9, column 3; to line 9, column 5
Error: End tag for  “body” seen, but there were unclosed elements.
From line 10, column 1; to line 10, column 7
There were errors.
```

第二条错误直接指出第 8 行的 `strong` 没有关闭；第三条报告的是连锁结果，即第 9 行的 `p` 落进了 `strong`。在第 8 行补上 `</strong>` 后重新检查，输出变为 `The document validates according to the specified schema(s).`，表示没有发现错误。

检查器只判断源码是否符合语法规则，不判断元素是否选得合适：`plain.html` 和 `semantics.html` 都能通过检查，前者没有任何结构，后者有一个键盘无法使用的“按钮”。

::: tip 判断一段 HTML 是否合格需要两类证据
Nu 检查器通过，说明源码符合 HTML 语法规则，不依赖浏览器纠错；无障碍树中的角色与内容含义一致、交互元素能用键盘操作，说明元素选择正确。只有其中一类证据，不能断定标记合格。
:::
