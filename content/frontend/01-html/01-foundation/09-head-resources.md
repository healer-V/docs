---
title: "文档头部与资源引用"
tags:
  - HTML
  - 元数据
  - 资源引用
excerpt: "区分文档标题、描述与页面正文，解释 head 中的元数据和样式、图标、脚本声明，并通过独立文件核对资源加载、脚本禁用和缺失资源的表现。"
date: 2026-11-14
---

# 文档头部与资源引用

`head` 保存关于当前文档的信息，以及样式、图标和脚本等资源的声明。浏览器会把这些信息用于标签页识别、文字解码和页面呈现；它们不是正文区域中的标题、段落或图片。

资源声明同时具有两部分含义：地址指向哪份文件，元素及其属性说明怎样使用这份文件。只有文件名，没有正确的声明关系，浏览器并不能据此把文件当作样式表或脚本处理。

下面先区分文档信息与正文内容，再说明样式、图标和脚本的接入方式，最后用四个独立文件核对请求、执行时机和缺失资源的表现。

::: info 本篇的范围
本篇讲 `head` 中常用的文档信息和资源声明，不展开 CSS 规则、JavaScript 语言或模块系统。样式冲突由 CSS 层叠规则处理，脚本依赖关系需要按具体模块方案设计。编码声明见[HTML 字符编码与语言声明](./08-encoding-language.md)，浏览器如何解析文档见[HTML 浏览器解析与语法检查](./10-parsing-validation.md)。
:::

## 一、文档信息与页面内容

### 1. head 不是页面页头

`head` 是文档级信息的容器，通常不出现在页面正文中。它保存标题、编码、描述以及外部资源关系；正文中的 `header` 则是页面或某个内容区域的页头，可以包含标题、导航等内容。两者拼写相近，职责不同。

| 部分 | 位置 | 作用 | 是否直接显示正文 |
|------|------|------|------------------|
| `head` | `html` 内、`body` 前 | 保存文档信息与资源声明 | 否 |
| `header` | `body` 内的内容区域 | 表示页头或区块头部 | 是，作为正文结构 |
| `title` | `head` 内 | 文档标题 | 否，显示在标签页等位置 |
| `h1` | `body` 内 | 正文一级标题 | 是 |

### 2. title 与正文标题

`title` 是文档标题，通常显示在浏览器标签页，并作为添加书签时的默认名称。`h1` 是正文中的一级标题，出现在页面内容里。二者可以相同，也可以分别描述文档身份和正文主题。

以下是局部结构，分别展示 `head` 和 `body` 中相关的内容：

```html
<head>
  <title>资源声明说明</title>
</head>
<body>
  <h1>观察文档资源</h1>
</body>
```

浏览器标签页应显示“资源声明说明”，页面内显示“观察文档资源”。修改 `h1` 不会自动修改标签页标题；把需要显示的正文写进 `title`，也不会得到正文标题的效果。普通独立 HTML 文档应提供一个清楚的文档标题，而不是依赖文件名代替它。[title 的定义与使用](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/title)说明了这些职责。

### 3. meta 的不同声明形式

`meta` 是空元素，但不同元数据使用不同属性。`name` 表示信息种类，`content` 提供对应的值；编码声明则使用专门的 `charset` 属性：

```html
<meta charset="utf-8">
<meta name="description" content="说明 HTML 文档怎样声明外部资源。">
<meta name="viewport" content="width=device-width, initial-scale=1">
```

`charset` 说明如何解码文档字节，`description` 提供文档描述，二者不能互换。`<meta name="charset" content="utf-8">` 不是正确的字符编码声明。页面实际保存的编码、编码声明与内容语言也各有职责；`lang="zh-CN"` 并不能代替 UTF-8 保存。

描述元数据不会自动显示为页面段落。搜索服务可以把描述作为摘要的候选信息，但不能从“已写 description”推导出一定显示某段摘要或提高排名。[meta 的属性定义](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta)给出了不同声明形式。

| 声明 | 作用 | 不负责 |
|------|------|--------|
| `meta charset` | 声明文档字节的解码方式 | 不转换文件编码 |
| `meta name="description"` | 提供文档描述 | 不显示为正文，不保证搜索摘要 |
| `meta name="viewport"` | 设置移动端布局视口条件 | 不自动让固定宽度布局变成响应式 |
| `meta name="robots"` | 提供抓取或索引提示 | 不是访问控制或保密手段 |

`viewport` 声明可让页面以设备宽度建立适合移动端的初始布局条件：`width=device-width` 请求使用设备宽度，`initial-scale=1` 指定初始缩放比例。这个声明不会自行把固定宽度内容变成可伸缩布局。若正文中仍有过宽表格或固定宽度容器，页面依旧会溢出；相应布局需要 CSS 处理。也不应为追求固定外观而禁止用户缩放。具体取值与限制见 [viewport 元数据](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport)。

::: warning viewport 不是响应式布局开关
只写 viewport 而保留固定宽度的内容，手机仍可能需要横向滚动。viewport 设置的是布局视口和初始缩放条件，元素如何伸缩、表格如何换行仍要由 CSS 和内容结构决定。
:::

## 二、样式、图标与资源关系

### 1. style 与外部样式表

`style` 中直接保存当前文档的 CSS；`link rel="stylesheet"` 引用另一份样式表。`href` 是地址，`rel` 说明当前文档与目标资源的关系：

```html
<link rel="stylesheet" href="appearance.css">
<style>
  .notice { border-left: 3px solid; padding-left: 12px; }
</style>
```

这里的外部文件与 HTML 放在同一目录。浏览器取得 `appearance.css` 后把它作为样式表处理；内嵌规则为带有 `class="notice"` 的元素设置左边框和内边距。两种方式可以共存，具体声明冲突按 CSS 层叠规则处理。

`media` 可以限制样式适用条件，例如 `media="print"` 只让相关样式在打印条件下适用。它不是文件扩展名，也不能据此保证资源不会被提前请求。样式声明的位置与用法分别见 [style](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/style)和 [link](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/link)；CSS 规则本身由 CSS 文档完整讲解。

### 2. 图标与资源类型

文档图标同样使用 `link` 声明，但关系变为 `icon`：

```html
<link rel="icon" href="mark.svg" type="image/svg+xml">
```

`type` 是资源媒体类型的提示，不能把实际内容错误的文件变成有效图标。浏览器是否采用以及何时刷新图标还受格式支持和缓存影响，所以判断接入结果时，既检查标签页，也检查实际请求和文件内容。

图标不是页面正文的一部分，也不能代替页面中的品牌名称或说明。需要向读者展示的图像应使用 `img` 等正文元素；`link rel="icon"` 只声明浏览器界面使用的图标资源。

### 3. base 与相对地址

`base` 可以改变文档中相对 URL 的解析基准。例如，`<base href="https://example.com/assets/">` 会让同页的相对地址按这个目录解析。它影响的是后续相对地址的基准，不会把文件复制到该目录，也不会改变服务器上的实际文件。

::: warning 相对地址先看文档基准
同目录地址便于观察资源接入。若文档设置了 `base`，相同的 `appearance.css` 会按新的文档基准解析；文件改名或位置变化也会影响结果。地址解析与站点根路径属于 URL 规则，不能仅凭文件看起来“放在旁边”判断浏览器最终请求的位置。
:::

一个文档通常只需要一个 `base href`，过多基准会让地址来源难以判断。排查资源 404 时，应同时对照 `href` 的写法、`base` 设置和 Network 中的实际请求地址。

## 三、script 与脚本禁用时的内容

### 1. 内联脚本与外部脚本

`script` 中可以直接写脚本，也可以用 `src` 引用外部文件。它不是空元素，需要结束标签。以下是可放在 `body` 结束标签之前的局部写法：

```html
<script>
  console.log('内联脚本已执行');
</script>
<script src="message.js"></script>
```

`console.log()` 把文字写入开发者工具的 Console；这条输出用于观察执行，不会成为页面正文。使用 `src` 后，应把待执行代码放在所引用的文件中，不能再依靠同一 `script` 标签内的文字作为外部脚本的失败回退。

### 2. 接入方式与执行时机

脚本加载方式会影响执行时机，不能只看它出现在 `head` 还是 `body`。先区分下面的常见声明：

| 声明 | 接入时应知道的时机 |
|------|--------------------|
| 普通外部脚本 | 解析器遇到时获取并执行；通常暂停后续 HTML 解析 |
| 外部经典脚本加 `defer` | 获取可以与解析并行，文档解析完成后执行，保持同类延迟脚本的文档顺序 |
| 外部脚本加 `async` | 获取完成后尽快执行，不保证多个脚本按文档顺序执行 |
| `type="module"` | 按模块处理，默认延迟到解析完成后执行；依赖与异步属性有单独规则 |

`defer` 不是普通内联经典脚本的通用“延迟开关”。若代码需要访问正文元素，外部经典脚本配合 `defer` 是一种清楚的最小接入方式。模块示例应使用 HTTP 或 HTTPS 访问，不把直接打开文件时的来源限制误判为模块语法错误。

这里的差别用于选择接入方式，不等于已经解释了模块系统或完整执行时序。具体规则以 [script 的处理模型](https://html.spec.whatwg.org/multipage/scripting.html#the-script-element)为依据，涉及依赖关系的脚本不能从单次刷新结果推导固定执行顺序。

### 3. noscript 的触发条件

`noscript` 可以在脚本被禁用时提供仍有意义的内容。放在 `body` 中时，可以包含普通提示或替代入口：

```html
<noscript><p>脚本被禁用；文档正文仍可阅读。</p></noscript>
```

它不会因为某个脚本发生语法错误或返回 404 就自动显示。浏览器仍然启用了脚本时，外部文件加载失败和“整个页面不支持脚本”是不同条件。具体行为见 [noscript 的定义](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/noscript)。

::: tip 先让正文不依赖脚本
页面的主要信息和基本操作应能在脚本未执行时保留。`noscript` 适合补充提示或替代入口，不是让空页面在禁用脚本时突然变得可用的万能方案。
:::

## 四、其他 link 关系

### 1. canonical、preload 与抓取提示

`link` 的不同 `rel` 还有其他用途：[canonical](https://html.spec.whatwg.org/multipage/links.html#link-type-canonical)声明优选文档地址，[preload 等资源提示](https://html.spec.whatwg.org/multipage/links.html#link-type-preload)参与加载安排。它们需要相应问题和条件，不能把“在 head 中多写几项”当作通用优化。

`canonical` 是给搜索引擎等工具阅读的地址提示，不是浏览器跳转指令；页面不会因为写了 canonical 就自动重定向。`preload` 告诉浏览器某个资源可能在当前页面很快用到，但资源类型、使用方式和服务器支持都会影响结果。抓取指令还可以通过 [robots 元数据](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/robots)声明，但这不是访问控制。

| 关系 | 作用 | 常见误判 |
|------|------|----------|
| `canonical` | 声明优选文档地址 | 会重定向当前页面 |
| `preload` | 提示浏览器提前获取资源 | 写了就一定更快或被使用 |
| `icon` | 声明页面图标 | 会代替正文图片 |
| `robots` meta | 提供抓取或索引提示 | 能阻止访问者直接打开页面 |

### 2. 不把声明当优化清单

每增加一项资源关系，都会带来地址、类型、加载条件和维护成本。没有明确问题时，不必把所有可用的 `rel` 和 `meta` 都写进页面；先确认要解决的问题，再选择相应声明。

::: info 声明与实际结果分开检查
`head` 中的声明只描述关系或条件，不能保证资源已被正确取得。判断样式、图标和脚本是否生效，要同时查看 Network 请求、Console 错误和页面结果，不能只看源码里有没有那一行。
:::

## 五、用独立文件核对资源接入

### 1. 创建文档与三个资源文件

新建空目录 `html-head`，下面四个文件都由读者在这个目录中创建，保存为 UTF-8。`resource.html` 声明文档信息、外部样式、图标与延迟脚本：

::: details 查看 resource.html 完整内容

```html [resource.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="观察文档信息与同目录资源的接入。">
  <title>资源声明说明</title>

  <!-- 外部样式负责颜色，内嵌样式负责左边框 -->
  <link rel="stylesheet" href="appearance.css">
  <link rel="icon" href="mark.svg" type="image/svg+xml">
  <style>
    .notice { border-left: 3px solid; padding-left: 12px; }
  </style>

  <!-- defer 让脚本在文档解析完成后执行，能取得下面的正文元素 -->
  <script src="message.js" defer></script>
</head>
<body>
  <h1>观察文档资源</h1>
  <p class="notice">这段文字同时使用内嵌和外部样式。</p>
  <p id="script-state">外部脚本尚未执行。</p>
  <noscript><p>脚本被禁用；文档正文仍可阅读。</p></noscript>
</body>
</html>
```

:::

在同目录创建 `appearance.css`。句点开头的 `.notice` 匹配前面具有同名 class 的段落，颜色值只用于让外部样式是否生效容易辨认：

```css [appearance.css]
.notice {
  color: #125aa0;
}
```

再创建 `mark.svg`。这是当前文档直接给出的矢量图标文本，保存后就是一个可引用的图片文件：

```xml [mark.svg]
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#125aa0"/>
  <circle cx="16" cy="16" r="7" fill="white"/>
</svg>
```

最后创建 `message.js`。这一条语句查找指定 id 的元素，再修改它的文字；不需要把它扩展成应用程序：

```js [message.js]
document.getElementById('script-state').textContent = '外部脚本已执行。';
```

### 2. 打开页面并观察请求

双击 `resource.html` 即可核对基本显示。标签页显示“资源声明说明”；正文标题与它不同；提示段落呈蓝色并带有左边框；脚本状态变为“外部脚本已执行。”。内嵌样式负责边框，外部样式负责颜色，因此能分别辨认。

| 观察对象 | 预期结果 | 证据 |
|----------|----------|------|
| 标签页 | “资源声明说明” | `head` 中的 `title` |
| 正文标题 | “观察文档资源” | `body` 中的 `h1` |
| 提示段落 | 蓝色文字和左边框 | 外部规则与内嵌规则共同生效 |
| 脚本状态 | “外部脚本已执行。” | `defer` 脚本找到并修改了元素 |
| 图标请求 | 返回 `mark.svg` | Network 中对应请求 |

如果需要观察真实 HTTP 状态，在当前目录的终端中启动一个本地静态服务。以下命令要求已经安装 Python 3.9 或更高版本；未安装时先使用 [Python 官方下载](https://www.python.org/downloads/)完成安装。Windows 可在文件夹地址栏输入 `powershell` 并回车，macOS 可打开终端、输入 `cd `，拖入文件夹后回车：

```powershell
py --version
py -m http.server 8000 --bind 127.0.0.1
```

macOS 或使用 `python3` 命令的环境，运行：

```bash
python3 --version
python3 -m http.server 8000 --bind 127.0.0.1
```

终端保持运行，用浏览器访问 `http://127.0.0.1:8000/resource.html`。操作结束后在终端按 `Ctrl+C` 停止服务；如果 8000 端口已经被占用，可以同时把命令和访问地址中的端口改为 8001。这是本地文件预览服务，不是生产部署方式。[http.server 文档](https://docs.python.org/3.13/library/http.server.html)说明了其用途和边界。

在 Chrome 中按 `F12`，macOS 按 `Option+Command+I`，进入 Network 面板后重新加载页面。可以分别找到样式表、脚本和图标的请求；检查地址是否对应当前目录文件，HTTP 状态是否为 200。某些请求使用缓存时，开启 **Disable cache** 并保持开发者工具打开，再重新加载核对。

### 3. 缺失资源与恢复

把 HTML 中的 `appearance.css` 临时改为 `missing.css` 并保存。重新加载后，段落仍有左边框，但不再使用外部文件提供的蓝色；Network 出现对应地址的 404。这个现象说明内嵌样式仍然有效，问题发生在外部资源地址。

先对照 `href`、文件名和实际请求地址，再改回 `appearance.css`，保存并重新加载。若颜色恢复、请求返回成功，才证明当前缺失资源已经修复。图标缓存较顽固时，也应根据请求和文件内容判断，不能只反复观察标签页外观。

如果把整个 `href` 属性删掉，问题则变成声明本身缺少必需信息。Nu 可以指出 `rel="stylesheet"` 的 `link` 缺少 `href`；但 `href="missing.css"` 在语法上仍可成立，检查器不会代替浏览器验证该文件是否真的存在。

| 注入的问题 | 观察 | 恢复 |
|------------|------|------|
| 样式表地址改为 `missing.css` | 外部颜色消失，内嵌边框仍在，请求 404 | 恢复地址并重新加载 |
| 删除 `link` 的 `href` | Nu 报告缺少必需属性 | 补回有效地址 |
| 脚本地址写错 | 脚本状态不更新，Console 或 Network 有失败证据 | 修正地址，确认脚本执行 |
| 关闭 JavaScript | `noscript` 提示出现，脚本状态保留初始文字 | 重新启用脚本后复测 |
| 只让脚本 404 | 不会触发 `noscript` | 区分资源失败与脚本禁用 |

### 4. 验证记录

以上四份文件于 2026-11-14 在 macOS 的 Chrome 157.0.8103.79 中实测。正常与修复后的文档通过 Nu 检查；缺少 `href` 的对照文档得到相应错误。关闭 JavaScript 再加载时，`noscript` 提示出现，脚本状态保留初始文字；只让脚本文件缺失则不会触发该提示。

本次重写只补充正文层次、注释和观察项，四个文件的元素、属性与预期结果未变；没有据此验证其他浏览器、图标缓存策略或模块脚本的完整加载顺序。
