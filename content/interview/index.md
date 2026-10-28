---
title: "HTML面试题"
tags:
  - HTML
excerpt: "围绕 HTML 结构与语义、脚本和图片加载、表单提交、原生交互及无障碍等面试题，给出明确结论、行为解释、使用示例和易错边界，帮助理解规则并应对追问。"
---

# HTML面试题

HTML（超文本标记语言）描述网页内容的结构与语义，浏览器将标记解析为 DOM（文档对象模型）树，CSS（层叠样式表）再控制布局和绘制。回答 HTML 面试题时，需要分清元素含义、默认行为，以及资源加载、表单提交和无障碍访问的具体规则。

## 一、HTML5 新增了哪些能力？

### 1. 现代 HTML 的能力范围

**HTML5 增强了网页的语义结构、媒体、图形和表单能力。** 现在 HTML 由持续更新的 HTML Living Standard 定义，面试中的“HTML5”通常是这一轮现代 Web 能力的历史称呼。

| 能力 | 代表内容 | 解决的问题 |
|------|----------|------------|
| 语义结构 | `main`、`nav`、`article`、`section` | 表达主体、导航和独立内容 |
| 媒体 | `audio`、`video`、`track` | 原生播放音视频并提供字幕 |
| 图形 | `canvas`，以及可嵌入 HTML 的 SVG | 绘制位图或矢量图形 |
| 表单 | `email`、`date`、`required`、`pattern` | 表达输入用途并提供基础校验 |
| 原生交互 | `details`、`dialog` | 提供折叠内容和对话框行为 |

### 2. 元素能力与 Web API 边界

例如订单页面可用 `main` 标识主体，用有 `label` 的控件收集信息，再用 `dialog` 请求确认。原生元素减少了自行补齐语义和键盘行为的工作，但业务规则仍由应用实现。

::: info HTML 元素与 Web API 的边界
WebSocket、Web Workers、Web Storage 常与 HTML5 一起介绍，但它们有各自的 API 和规范职责，不能把所有现代 Web 能力都称为 HTML 新标签。
:::

参考：[WHATWG：HTML Living Standard](https://html.spec.whatwg.org/multipage/)、[MDN：HTML5 术语](https://developer.mozilla.org/en-US/docs/Glossary/HTML5)。

## 二、src 与 href 有什么区别？

### 1. 资源引用与元素职责

**`src` 通常指定元素要嵌入或执行的资源，`href` 通常指定导航目标或关联资源。** 区别来自元素用途，不能概括成“`src` 阻塞，`href` 不阻塞”。

| 写法 | 浏览器行为 |
|------|------------|
| `<img src="product.jpg">` | 获取并显示图片 |
| `<script src="app.js"></script>` | 获取脚本，按类型和加载属性执行 |
| `<iframe src="map.html"></iframe>` | 在嵌入的浏览上下文中加载页面 |
| `<a href="orders.html">订单</a>` | 提供导航入口，通常在用户激活时导航 |
| `<link rel="stylesheet" href="site.css">` | 获取样式表并参与页面样式计算 |

### 2. 解析和渲染阻塞的区别

图片请求不会像普通经典脚本那样暂停后续 HTML 解析；样式表虽然使用 `href`，仍会影响页面何时能够正确渲染。加载行为应结合元素、`rel`、脚本类型和 `async` 等属性判断。

::: warning 解析阻塞与渲染阻塞不同
普通经典外部脚本会阻塞 HTML 解析。样式表通常阻塞渲染，但不会以相同方式阻塞 HTML 解析，还可能间接延迟等待样式的脚本。
:::

参考：[MDN：script 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script)、[MDN：link 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/link)。

## 三、Canvas 与 SVG 有何区别，如何选择？

### 1. 位图绘制与矢量节点

**Canvas 主要通过绘制命令更新位图，SVG 通过矢量元素描述图形。** Canvas 画完矩形后不会自动保留一个矩形 DOM 节点；SVG 的 `rect`、`circle` 等图形可作为节点单独操作。

| 维度 | Canvas | SVG |
|------|--------|-----|
| 保存方式 | 像素画面，应用维护对象状态 | 图形保留为元素树 |
| 更新方式 | 清除或覆盖区域，再绘制 | 修改元素属性和样式 |
| 交互 | 自行计算命中区域 | 可对图形元素绑定事件 |
| 缩放 | 需匹配画布分辨率，避免模糊 | 矢量图形通常能清晰缩放 |
| 常见用途 | 大量动态对象、图像处理 | 图标、可交互矢量图表 |

### 2. 交互、缩放和性能取舍

几十根需要点击的图表柱子可优先考虑 SVG；持续重绘数千个粒子时可考虑 Canvas。两者都能实现动画，性能取决于对象数量、更新方式和设备，不能只按技术名称判断。

Canvas 的 CSS 显示尺寸与 `width`、`height` 定义的绘图尺寸不同。只用 CSS 放大会拉伸已有像素，高分屏还需考虑设备像素比。重要图形信息无论用哪种方式，都应提供文字或数据替代。

参考：[MDN：Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)、[MDN：SVG](https://developer.mozilla.org/en-US/docs/Web/SVG)。

## 四、什么是 HTML 语义化，如何选择标签？

### 1. 语义标签表达内容职责

**语义化是按内容和操作的真实职责选标签，让页面结构不依赖外观也能被理解。** 它有助于辅助技术导航、维护代码和搜索引擎理解内容，但不保证搜索排名提升。

| 元素 | 职责 | 场景 |
|------|------|------|
| `main` | 页面主要内容 | 订单列表主体 |
| `nav` | 主要导航区域 | 站点菜单、内容目录 |
| `article` | 相对独立、可复用的内容 | 新闻、帖子、评论 |
| `section` | 有主题的内容分组 | 通常有可识别标题的专题 |
| `div` | 无特定语义的通用容器 | 仅为布局或样式分组 |

### 2. 原生按钮与无障碍边界

“提交订单”应使用 `button`。原生按钮支持焦点和键盘激活，并提供按钮角色；改用可点击的 `div`，还需要补齐角色、焦点、键盘事件和禁用状态。

::: tip 标签按职责选择
不要把全部 `div` 换成 `section`，也不要把每组链接都放进 `nav`。语义取决于内容职责，外观可以用 CSS 调整。
:::

参考：[MDN：HTML 无障碍基础](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility/HTML)。

## 五、label、name 和 required 分别有什么作用？

### 1. 控件名称、字段名与必填规则

**`label` 负责控件名称，`name` 负责提交字段名，`required` 负责浏览器必填约束。** 它们分别影响可访问性、提交数据和填写体验，不能互相替代。

| 标记 | 作用 | 条件 |
|------|------|------|
| `label for="keyword"` | 关联控件，点击文字可聚焦它 | `for` 与控件唯一的 `id` 一致 |
| `name="q"` | 把控件值作为 `q` 字段提交 | 控件符合提交条件，例如未禁用 |
| `required` | 空值时阻止常规提交并提示 | 控件类型支持必填约束 |

### 2. 表单提交的可观察结果

在空目录创建 `search.html`，用以下完整页面验证。以现代浏览器打开后，点击“关键词”会聚焦输入框，提交空值会出现校验提示。

::: details 查看 search.html 的完整表单

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>订单搜索</title>
</head>
<body>
  <form method="get">
    <label for="keyword">关键词</label>
    <input id="keyword" name="q" required>
    <button type="submit">搜索</button>
  </form>
</body>
</html>
```

:::

输入 `Vue` 后提交，地址查询串包含 `?q=Vue`。这证明字段命名和原生提交行为，不代表服务器已经执行搜索。点击标签不聚焦时检查 `for` 与 `id`；提交字段缺失时检查 `name` 和 `disabled`。

参考：[MDN：label 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label)、[MDN：input 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input)。

## 六、普通脚本、async 和 defer 的执行时机有何区别？

### 1. 经典脚本的下载与执行顺序

**对 HTML 解析器插入的经典外部脚本，普通脚本就绪后立即执行，`async` 下载完成后尽快执行，`defer` 在 HTML 解析完成后按顺序执行。** 并行下载不代表脚本执行不会占用主线程。

| 写法 | 获取期间 | 执行时机 | 执行顺序 |
|------|----------|----------|----------|
| 普通 `script src` | 暂停继续解析 HTML | 就绪后执行，再继续解析 | 按文档顺序 |
| `script async src` | 可与 HTML 解析并行 | 就绪后尽快执行，可能打断解析 | 不保证文档顺序 |
| `script defer src` | 可与 HTML 解析并行 | 解析后、`DOMContentLoaded` 前 | 按文档顺序 |

### 2. 依赖脚本的选择和限制

以下是 `head` 中的局部片段，省略完整 HTML 和脚本实现。第二个脚本依赖第一个时，可以使用 `defer`：

```html
<script defer src="order-data.js"></script>
<script defer src="order-page.js"></script>
```

改成 `async` 后，第二个脚本先就绪就能先执行，访问尚未初始化的数据会报错。独立统计脚本适合 `async`；依赖 DOM 和固定顺序的页面入口适合 `defer`。

::: warning 区分经典、模块与动态脚本
`defer` 对内联经典脚本无效；同时设置 `async` 和 `defer` 时按 `async` 处理。模块默认延后执行，动态创建脚本的默认顺序也不能直接套用上表。
:::

参考：[MDN：script 的 async 与 defer](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script#async_and_defer)。

## 七、DOCTYPE、lang、charset 和 viewport 有什么作用？

### 1. 解析模式、语言和视口声明

**四者分别声明解析模式、主要语言、字符编码和移动端布局视口。** 它们应在文档开头和 `head` 中尽早声明，各自解决不同问题。

| 声明 | 作用 | 缺失或错误时的表现 |
|------|------|--------------------|
| `<!doctype html>` | 让现代浏览器使用标准模式 | 缺失时通常进入怪异模式，布局规则不同 |
| `html lang="zh-CN"` | 声明页面主要语言 | 辅助技术可能采用错误的发音规则 |
| `meta charset="utf-8"` | 声明字符编码 | 文本按错误编码解码时乱码 |
| `meta name="viewport"` | 设置布局视口和初始缩放 | 手机可能按较宽虚拟视口缩小页面 |

### 2. 最小文档结构与失效表现

页面开头的局部结构如下，省略其他元数据和正文：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>订单列表</title>
</head>
```

`DOCTYPE` 不是普通元素，也不会下载规范文件。控制台的 `document.compatMode` 在标准模式下为 `CSS1Compat`，怪异模式下为 `BackCompat`。

`viewport` 不会自动把固定宽度页面变成响应式页面，CSS 仍需处理布局和溢出。不要用 `user-scalable=no` 禁止用户缩放。

参考：[MDN：HTML 文档结构](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Basic_HTML_syntax)、[MDN：viewport 元数据](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport)。

## 八、HTML 内容类别等同于 CSS 的 display 吗？

### 1. 内容模型和显示盒的边界

**不等同。HTML 内容类别约束语义和合法嵌套，CSS `display` 决定盒子如何参与布局。** 改变显示方式不会改变元素的内容模型。

`span` 设为 `display: block` 后能单独占一行，但不会获得段落语义。`div` 设为 `display: inline` 后，也不能合法地放进只允许短语内容的 `p`。

### 2. 非法嵌套的实际解析结果

以下是错误的局部标记：

```html
<p>订单说明<div>预计三天送达</div></p>
```

解析到 `div` 时，浏览器会自动结束前面的 `p`，实际 DOM 与源码中的嵌套不同。应改成独立的两个块，或在段落内使用合适的 `span`。排查结构异常先查实际 DOM，排查布局异常再查计算后的 `display`。

参考：[MDN：HTML 内容类别](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Content_categories)。

## 九、id、class 和 data-* 应如何使用？

### 1. 三个属性各自承担的职责

**`id` 标识具体元素，`class` 为多个元素分组，`data-*` 保存元素相关的自定义数据。** 三者都能用于选择元素，但目的和约束不同。

| 属性 | 示例 | 使用边界 |
|------|------|----------|
| `id` | `id="order-summary"` | 文档内应唯一，用于关联和片段导航 |
| `class` | `class="order-row selected"` | 可复用，一个元素可有多个类 |
| `data-*` | `data-order-id="42"` | 在 DOM 中保存自定义字符串数据 |

### 2. DOM 读取与可信数据边界

以下是 `body` 中的局部片段，脚本位于按钮之后：

```html
<button id="order-action" class="order-button" data-order-id="42">查看订单</button>
<script>
  const action = document.querySelector('#order-action');
  console.log(action.dataset.orderId);
</script>
```

控制台输出字符串 `"42"`，不会自动转成数字；`data-order-id` 在 `dataset` 中对应 `orderId`。重复 `id` 会让标签关联和定位产生歧义，共用样式应使用 `class`。

::: warning 自定义数据不是可信依据
DOM 对使用者可见且可修改，不要保存密码和令牌，也不要把 `data-*` 中的金额作为服务端业务依据。
:::

参考：[MDN：data-* 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/data-%2A)。

## 十、a 和 button 如何选择？

**跳转到 URL 或页面位置使用带 `href` 的 `a`，执行提交、展开等操作使用 `button`。** 元素选择依据是行为，而非视觉上像文字还是按钮。

链接提供复制地址、新标签打开和历史导航等能力；按钮提供键盘激活、禁用和表单操作语义。使用 `a href="#"` 模拟按钮，还会带来片段导航和默认行为处理。

下面是页面局部片段：

```html
<a href="order-detail.html">订单详情</a>
<button type="button">展开筛选</button>
<button type="submit" form="order-form">提交订单</button>
```

提交按钮需关联 `id="order-form"` 的表单。表单内未明确 `type` 的普通按钮通常会提交表单，因此展开、取消等按钮应显式写 `type="button"`。

参考：[MDN：a 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a)、[MDN：button 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button)。

## 十一、alt、title 和图片尺寸属性有什么作用？

**`alt` 提供替代内容，`title` 提供附加提示，`width` 和 `height` 帮助提前确定图片比例。** 悬停提示不能替代图片的可访问名称。

信息性图片描述其信息，例如“蓝色双肩背包正面”；纯装饰图片通常用 `alt=""`。作为链接或按钮唯一内容的图片，替代文本应表达操作目的，例如“返回首页”。

假设同目录有一张 800 × 600 像素的商品图，页面局部片段可以写成：

```html
<img src="backpack.jpg" alt="蓝色双肩背包正面"
     width="800" height="600"
     style="max-width: 100%; height: auto;">
```

浏览器可在下载前预留 4:3 空间，CSS 仍允许图片缩小。尺寸比例错误时加载前后会变化；省略 `alt` 不等于明确告诉辅助技术这张图是装饰。

参考：[MDN：img 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img)。

## 十二、srcset、sizes 和 picture 分别解决什么问题？

### 1. 候选资源、显示尺寸与构图

**`srcset` 提供候选资源，`sizes` 描述显示宽度，`picture` 选择不同构图或格式。** 它们帮助选资源，不设置最终 CSS 布局。

| 需求 | 使用方式 | 判断依据 |
|------|----------|----------|
| 相同显示大小，不同清晰度 | `srcset` 的 `1x`、`2x` | 设备像素比等条件 |
| 同一构图，不同图片宽度 | `srcset` 的 `w` + `sizes` | 显示宽度和像素比等条件 |
| 不同裁切 | `picture` + `source media` | 媒体条件 |
| 格式回退 | `picture` + `source type` | 格式支持 |

### 2. 实际资源选择和回退

以下是局部标记，需提供两张同构图、宽度分别为 480 和 960 像素的文件，并用 CSS 设置相符的显示宽度：

```html
<img src="product-480.jpg"
     srcset="product-480.jpg 480w, product-960.jpg 960w"
     sizes="(max-width: 600px) 100vw, 480px"
     alt="双肩背包正面">
```

桌面显示宽度为 480 CSS 像素时，高像素密度屏幕可选 960 像素候选。选择还受浏览器策略影响，可通过 `currentSrc` 查看实际资源。

`picture` 最后仍需 `img` 承担展示、替代文本和回退。`sizes` 与真实布局不一致时，浏览器可能下载过大或不够清晰的图片。

参考：[MDN：响应式图片](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images)、[MDN：picture 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/picture)。

## 十三、图片懒加载如何使用，有哪些限制？

**`loading="lazy"` 提示浏览器推迟获取远离视口的图片，适合非首屏列表内容。** 加载范围由浏览器判断，不保证等到图片准确进入屏幕才请求。

有对应文件时，局部标记可写为：

```html
<img src="product.jpg" alt="背包侧面"
     width="800" height="600" loading="lazy">
```

浏览器会根据距离、网络等条件提前获取。应结合 Network 面板和滚动观察效果；懒加载不是压缩，仍需合理的图片格式、大小与响应式候选。

::: tip 首屏关键图片应及时获取
首屏主要图片通常不设懒加载，避免重要内容延迟呈现。声明尺寸或比例，防止图片到达后挤动布局。
:::

图片未出现时先查路径、响应和 CSS 尺寸，再查加载范围。零尺寸或隐藏图片的问题不能单靠修改 `loading` 解决。

参考：[MDN：img 的 loading 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img#loading)。

## 十四、表单 GET、POST 与 enctype 有什么区别？

### 1. 请求方法和表单体编码

**`method` 决定数据发送方式，`enctype` 决定常规 POST 表单体的编码。** GET 适合无副作用的查询，POST 适合提交创建或修改操作，接口也应遵循这些语义。

| 配置 | 数据形式 | 场景 |
|------|----------|------|
| `method="get"` | 编码后加入 URL 查询串 | 可分享的搜索条件 |
| `method="post"` | 数据放入请求体 | 创建订单、提交资料 |
| 默认 POST 编码 | `application/x-www-form-urlencoded` | 普通字段 |
| `multipart/form-data` | 多部分请求体，保留文件内容 | 文件上传 |

### 2. 上传实例与服务端约束

以下是上传表单的局部标记，应用需提供 `/profile/avatar` 接口：

```html
<form action="/profile/avatar" method="post" enctype="multipart/form-data">
  <label for="avatar">头像</label>
  <input id="avatar" type="file" name="avatar" accept="image/*">
  <button type="submit">上传</button>
</form>
```

漏写上传编码时，接收端拿不到预期文件内容，应检查请求方法、`Content-Type` 和负载。`accept` 只是选择文件的提示，服务端需验证实际类型、大小和内容。

::: warning POST 不等于加密
两种方法都需要 HTTPS 保护传输，请求体并不会自动保密。提交按钮的 `formmethod`、`formenctype` 还可覆盖表单设置。
:::

参考：[MDN：form 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form)。

## 十五、disabled 和 readonly 有什么区别？

### 1. 可编辑性与提交行为

**`disabled` 表示控件不可用，`readonly` 表示内容可读取但不能直接编辑。** 最关键的提交差异是禁用控件不提交，只读控件通常仍提交。

| 行为 | `disabled` | `readonly` |
|------|------------|------------|
| 编辑 | 不允许 | 不允许 |
| 焦点 | 通常不能获得 | 通常可以，可选择和复制文本 |
| 提交 | 不提交 | 有 `name` 等必要条件时提交 |
| 约束验证 | 不参与 | 只读控件也不参与相应约束验证 |
| 支持范围 | 多种表单控件 | 文本类输入、`textarea` 等支持只读的控件 |

### 2. 字段缺失和权限边界

需要展示并提交订单号时可用 `readonly`；当前不可用的配送选项可用 `disabled`。`select` 不支持 `readonly`，写这个属性不会得到只读下拉框。

后端收到的字段缺失时，检查控件是否被禁用，不能只看界面有值。两种状态均不能实现权限控制，使用者仍可改 DOM 或构造请求。

参考：[MDN：disabled 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/disabled)、[MDN：readonly 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/readonly)。

## 十六、浏览器表单校验能否替代服务端校验？

### 1. 浏览器约束的作用范围

**不能。浏览器校验改善填写体验，服务端决定请求是否合法。** 客户端可以被绕过，金额、库存、权限和唯一性等业务约束必须在服务端判断。

| 规则 | 用途 | 边界 |
|------|------|------|
| `required` | 检查适用控件必填 | 不适用于所有输入类型 |
| `type="email"` | 检查基础邮箱格式 | 不证明邮箱存在 |
| `min`、`max`、`step` | 限制数值或日期范围与步长 | 依赖控件类型和基准值 |
| `pattern` | 校验适用文本控件的完整值 | 非必填空值不会因此变成必填 |

### 2. 提交路径与服务端校验

`checkValidity()` 返回是否有效；`reportValidity()` 还会展示提示。点击提交按钮或调用 `requestSubmit()` 会走校验，直接调用 `form.submit()` 则会跳过校验和正常的 `submit` 事件。

::: warning 前端验证不是安全边界
`novalidate`、脚本请求和直接调用接口都能绕过页面规则。服务端要返回可对应字段的错误；`placeholder` 也不能替代控件的 `label`。
:::

参考：[MDN：表单约束验证](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Constraint_validation)。

## 十七、数据表格如何正确标记表头和标题？

**`table` 表达行列数据，`caption` 命名整张表，`th` 与 `scope` 关联表头和数据。** 仅用加粗样式模拟表头，不能提供同样的语义。

以下是可放入 HTML `body` 的局部报表：

```html
<table>
  <caption>每日订单汇总</caption>
  <thead><tr><th scope="col">日期</th><th scope="col">订单数</th></tr></thead>
  <tbody><tr><th scope="row">9 月 29 日</th><td>12</td></tr></tbody>
</table>
```

`scope="col"` 关联列，`scope="row"` 关联行；`thead`、`tbody`、`tfoot` 组织表头、正文和汇总。复杂多级表头还可能需要 `id` 与 `headers` 明确关联。

普通两栏页面没有数据行列关系，应使用 CSS 布局。窄屏表格可以提供横向滚动，但要保留表头和阅读上下文。

参考：[MDN：表格无障碍](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Table_accessibility)。

## 十八、iframe 有哪些安全边界，sandbox 有什么作用？

### 1. 同源限制与嵌入成本

**`iframe` 创建嵌入的浏览上下文，`sandbox` 限制其中的能力。** 嵌入适合地图或外部业务页，但会增加加载和通信成本，不能自动隔离一切风险。

父页与嵌入页直接互访 DOM 受同源策略约束，源由协议、主机和端口共同确定。跨源消息可用 `postMessage`，接收方应校验来源和数据，发送方应指定预期目标源。

### 2. 消息通信和 sandbox 使用

需要提供 `order-preview.html` 时，只读预览的局部标记可写为：

```html
<iframe src="order-preview.html"
        title="订单预览" sandbox loading="lazy"></iframe>
```

空 `sandbox` 启用多项限制；确需脚本、表单时才增加 `allow-scripts`、`allow-forms`。`allow` 控制部分功能权限，不替代沙箱。

::: warning 谨慎开放组合权限
同源不可信页面同时拥有 `allow-scripts` 与 `allow-same-origin` 时，可能移除沙箱限制。目标页的 CSP `frame-ancestors` 或其他响应头也可以禁止嵌入。
:::

参考：[MDN：iframe 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe)。

## 十九、原生音视频如何提供控件、格式回退和字幕？

**`audio`、`video` 负责播放，`source` 提供资源候选，`track` 提供字幕等定时文本。** `controls` 提供原生播放操作，具体外观由浏览器决定。

提供对应媒体及 WebVTT 字幕后，视频的局部标记可写为：

```html
<video controls preload="metadata" width="640">
  <source src="order-guide.webm" type="video/webm">
  <source src="order-guide.mp4" type="video/mp4">
  <track src="order-guide-zh.vtt" kind="captions" srclang="zh" label="中文字幕" default>
  您的浏览器不支持视频元素。
</video>
```

浏览器按候选类型和支持情况选择资源，`.mp4` 后缀不保证内部编码能播放。`preload` 是提示，`autoplay` 受浏览器策略限制，不能代替可操作的播放入口。

字幕要包含理解内容所需的对白和声音说明。加载失败时应另提供文字说明或下载入口；元素内的回退文本主要用于不支持该元素的浏览器。

参考：[MDN：video 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video)、[MDN：track 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/track)。

## 二十、DOMContentLoaded 与 load 有什么区别？

### 1. 两个事件各自等待的条件

**`DOMContentLoaded` 关注文档解析完成，`window.load` 关注页面依赖资源加载完成。** 二者都不表示全部业务异步请求完成。

| 事件 | 触发前完成的内容 | 不统一等待的内容 |
|------|------------------|------------------|
| `DOMContentLoaded` | HTML 解析及此阶段需要完成的延迟脚本、模块执行 | 普通图片、子框架、`async` 脚本等 |
| `window.load` | 页面依赖的非懒加载图片、样式、脚本等 | 懒加载资源和业务异步请求 |

### 2. 晚加载脚本的初始化入口

绑定已有按钮不必等所有图片，读取某张图片的加载结果应关注图片自身状态。同步脚本会推迟文档事件，模块中的异步操作不能一概视为事件屏障。

晚加载的脚本可使用以下局部初始化入口，省略实际业务逻辑：

::: details 查看文档就绪检查片段

```javascript
// app.js：仅演示初始化时机，不请求业务数据。
/** DOM 可用时报告初始化时机；无返回值，输出控制台消息。 */
function initializeOrderPage() {
  console.log('订单页面 DOM 已就绪');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeOrderPage, { once: true });
} else {
  initializeOrderPage();
}
```

:::

事件已经触发后再注册不会收到过去的事件，`readyState` 检查避免初始化遗漏。这个入口不保证接口和图片已经可用。

参考：[MDN：DOMContentLoaded 事件](https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event)。

## 二十一、preload 与 prefetch 有什么区别？

### 1. 当前页与后续页的加载提示

**`preload` 获取当前页面很快要用的资源，`prefetch` 提示为可能的后续导航准备资源。** 两者都是加载提示，不是执行指令。

| 方式 | 场景 | 关键限制 |
|------|------|----------|
| `preload` | 当前首屏晚发现的字体、图片 | URL、类型和跨源模式要与实际使用一致 |
| `prefetch` | 后续详情页或资源 | 浏览器可忽略，不保证请求或复用 |

### 2. 字体预加载与带宽检查

需要提供并通过 `@font-face` 使用字体时，`head` 中可放入以下局部声明：

```html
<link rel="preload" href="order-ui.woff2" as="font"
      type="font/woff2" crossorigin>
```

`as` 指定用途，字体还需正确跨源模式。预加载脚本不会执行，预加载样式不会应用；模块依赖的预加载应考虑 `modulepreload`。

过多预加载会争抢关键带宽。检查请求是否重复、资源是否被使用和性能是否改善，不能以提示数量证明优化有效。

参考：[MDN：preload](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload)、[MDN：prefetch](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/prefetch)。

## 二十二、模块脚本与经典脚本有何区别？

### 1. 模块作用域和加载规则

**`type="module"` 使用模块作用域、`import` 和 `export`，经典脚本没有这套模块语义。** 模块自动使用严格模式，默认在 HTML 解析后执行。

| 维度 | 经典脚本 | 模块脚本 |
|------|----------|----------|
| 作用域 | 顶层声明可参与页面全局环境 | 顶层声明保留在模块内 |
| 顶层 `this` | 通常是 `window` | `undefined` |
| 默认执行 | 遇到时执行，受加载属性影响 | 默认延后执行 |
| 跨源获取 | 普通经典脚本可按非 CORS 方式加载 | 需要通过 CORS（跨源资源共享）检查 |

### 2. 运行环境与部署条件

经典脚本的顶层 `var` 通常成为 `window` 属性，顶层 `let`、`const` 不会，不能把全部声明视为全局对象属性。模块依赖通过导入关系表达。

`defer` 对模块无效，`async` 允许模块及依赖就绪后尽快执行。`nomodule` 可为不支持模块的旧浏览器提供回退，现代浏览器会忽略它。

涉及导入的示例应通过 HTTP 服务运行并提供正确的 JavaScript MIME 类型，直接用 `file://` 打开不能代表部署后的加载环境。

参考：[MDN：JavaScript 模块](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)。

## 二十三、ARIA 和 inert 能否替代原生交互语义？

### 1. 语义、ARIA 状态与 inert 行为

**不能。原生元素提供语义和行为，ARIA 补充辅助技术信息，`inert` 禁止一片区域参与正常交互。** 添加 ARIA 不会自动实现点击和键盘操作。

| 方式 | 影响 | 不负责什么 |
|------|------|------------|
| 原生 `button` | 按钮角色、焦点和键盘激活 | 不自动实现业务 |
| `aria-expanded` | 表达展开状态 | 不自动展开内容 |
| `aria-hidden="true"` | 从无障碍树隐藏 | 不阻止后代聚焦 |
| `inert` | 禁止正常点击和聚焦，并从无障碍树移除 | 不自动在视觉上隐藏 |

### 2. 弹窗焦点和交互管理

展开筛选时应同步更新按钮的 `aria-expanded`。弹窗背景只加 `aria-hidden`，会出现键盘仍能进入、辅助技术却读不到的矛盾状态。

原生 `dialog.showModal()` 会让外部内容失去正常交互能力；手写模态层还要管理焦点进入、限制、关闭和恢复。优先复用符合职责的原生控件，再补齐信息。

参考：[MDN：ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)、[MDN：inert 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert)。

## 二十四、template 与 hidden 有何区别，如何使用？

**`template` 保存待实例化的结构，`hidden` 隐藏已有元素。** 前者适合重复创建内容，后者适合切换现有内容状态。

模板结构存于 `template.content` 文档片段，不立即成为可见内容。克隆并插入文档后才参与正常显示。以下是 `body` 中的局部示例：

```html
<template id="order-template"><p class="order-title"></p></template>
<div id="order-list"></div>
<script>
  const row = document.querySelector('#order-template').content.cloneNode(true);
  row.querySelector('.order-title').textContent = '订单已支付';
  document.querySelector('#order-list').append(row);
</script>
```

页面显示“订单已支付”，原模板仍供复用。克隆内容不要保留会重复的 `id`，不可信文本使用 `textContent` 填入。

普通 `hidden` 元素仍在 DOM 中，脚本可访问，因此不是安全隔离。显式 CSS 显示规则还可覆盖普通隐藏效果；`hidden="until-found"` 的查找揭示行为应单独判断。

参考：[MDN：template 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/template)、[MDN：hidden 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden)。

## 二十五、details 与 dialog 分别适用于什么交互？

### 1. 折叠内容和对话框的语义

**`details` 用于展开或收起局部信息，`dialog` 用于对话框。** 折叠答案适合 `details`，要求用户先作决定的取消确认适合模态 `dialog`。

| 元素或方法 | 行为 | 场景 |
|------------|------|------|
| `details` + `summary` | 激活摘要后展开或收起，`open` 表示展开 | 常见问题、补充说明 |
| `dialog.show()` | 非模态显示 | 不阻止背景操作的窗口 |
| `dialog.showModal()` | 进入顶层并建立模态交互 | 取消订单确认 |

### 2. 取消确认的完整交互

在空目录创建 `confirmation.html`，用现代浏览器打开以下完整页面，再点击“取消订单”：

::: details 查看 confirmation.html 的完整确认框

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>取消订单确认</title>
</head>
<body>
  <button id="open-confirmation" type="button">取消订单</button>
  <dialog id="confirmation" aria-labelledby="confirmation-title">
    <h2 id="confirmation-title">确认取消订单？</h2>
    <form method="dialog">
      <button value="back" autofocus>返回</button>
      <button value="confirm">确认取消</button>
    </form>
  </dialog>
  <script>
    const confirmation = document.querySelector('#confirmation');
    /** 点击入口时打开确认框；无返回值，改变模态状态。 */
    function openConfirmation() {
      confirmation.showModal();
    }
    document.querySelector('#open-confirmation').addEventListener('click', openConfirmation);
  </script>
</body>
</html>
```

:::

打开后背景不能正常交互，点击任一表单按钮会关闭，`returnValue` 保存按钮值，默认也可按 Esc 关闭。该页面只演示交互，不发送取消请求。

直接设置 `open` 不等于 `showModal()`，不会提供相同模态状态。业务代码还需判断结果，验证焦点恢复，并处理接口失败。

参考：[MDN：details 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details)、[MDN：dialog 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)。

## 二十六、HTML 特殊字符如何显示，用户输入如何安全写入？

**字符引用在 HTML 源码中表达特殊字符，安全写入则要按目标上下文处理不可信数据。** 一次通用字符串替换不能同时解决所有注入问题。

| 字符 | HTML 源码写法 | 用途 |
|------|---------------|------|
| `<` | `&lt;` | 在文本处显示小于号 |
| `&` | `&amp;` | 显示 & 符号 |
| `"` | `&quot;` | 在双引号属性中表示引号 |

`<p>&lt;button&gt; 是按钮元素</p>` 显示标签名称而不创建按钮。使用 `textContent` 时应传入实际文字 `<button>`，浏览器不会解析成标签，无需先手动转为字符引用。

::: warning 写入位置决定处理方式
HTML 文本、属性、URL 和 JavaScript 规则不同。使用安全文本 API 或对应上下文的自动转义；允许富文本时需专门净化，不能直接赋给 `innerHTML`。
:::

参考：[MDN：HTML 基本语法](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Basic_HTML_syntax)。

## 二十七、为什么 disabled="false" 仍会禁用控件？

**HTML 布尔属性以存在表示开启，以缺失表示关闭，不解析字符串 `"false"` 为假。** `disabled="false"` 仍包含禁用属性，而且不属于规范的布尔属性值形式。

| 写法 | 结果 |
|------|------|
| `disabled`、`disabled=""` | 禁用 |
| `disabled="disabled"` | 禁用 |
| `disabled="false"` | 仍禁用，应避免 |
| 不输出 `disabled` | 不因这个属性而禁用 |

可以用 `button.disabled = false` 或 `removeAttribute('disabled')` 关闭状态。服务端模板应条件式地决定是否输出属性，而不是只转换成字符串。

`aria-expanded="false"` 不是 HTML 布尔属性，需要字符串值表达状态。复选框的 HTML `checked` 表达默认选中，用户操作后的当前状态应检查 DOM 的 `checked` 值。

参考：[MDN：HTML 布尔属性](https://developer.mozilla.org/en-US/docs/Glossary/Boolean/HTML)。

## 二十八、单选框与复选框如何分组和提交数据？

**同一表单的同名单选组通常只选一个，复选框可选多个；两者仅提交已选中的控件。** `name` 决定字段名，`value` 决定选中时的数据。

以下省略外层表单和提交按钮：

```html
<label><input type="radio" name="delivery" value="standard" checked>普通配送</label>
<label><input type="radio" name="delivery" value="express">加急配送</label>
<label><input type="checkbox" name="service" value="gift" checked>礼品包装</label>
<label><input type="checkbox" name="service" value="insurance" checked>运输保障</label>
```

GET 字段部分为 `delivery=standard&service=gift&service=insurance`。重复的服务字段要按多值处理，脚本可以用 `FormData.getAll('service')` 获取数组。

未选中不会提交 `false`，而是缺少这一项；未写 `value` 的选中控件默认提交 `on`。这里使用包裹式 `label`，若采用 `for` 关联，每个控件要有独立 `id`。

参考：[MDN：radio 输入控件](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/radio)、[MDN：checkbox 输入控件](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/checkbox)。

## 二十九、fieldset 与 legend 如何组织表单控件？

**`fieldset` 组织一组相关控件，`legend` 命名整组，`label` 命名单个选项。** “普通”和“加急”结合“配送方式”才构成完整的输入含义。

下面是表单内部的局部标记：

```html
<fieldset>
  <legend>配送方式</legend>
  <label><input type="radio" name="delivery" value="standard">普通</label>
  <label><input type="radio" name="delivery" value="express">加急</label>
</fieldset>
```

`fieldset disabled` 整体禁用后代控件，会影响焦点、校验和提交；但第一个 `legend` 内的控件有例外，不会因父级禁用而被禁用。

仅为两列排版分组时用普通容器和 CSS 即可。有共同问题的多项输入应保留明确组名，不能只依赖视觉边框。

参考：[MDN：fieldset 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/fieldset)。

## 三十、_blank、noopener 和 noreferrer 有什么作用？

**`_blank` 请求新的浏览上下文，`noopener` 阻止新页面通过 `window.opener` 控制原页，`noreferrer` 还抑制引用来源信息。** 浏览器可选择标签页或窗口，不能保证一定是哪一种。

外部帮助链接的局部标记可以写为：

```html
<a href="https://developer.mozilla.org/en-US/docs/Web/HTML"
   target="_blank" rel="noopener">HTML 文档（新窗口）</a>
```

现代 HTML 对 `_blank` 链接隐式提供 `noopener` 保护，显式写出方便表达意图。`noreferrer` 也有隔离作用，但会影响目标站收到的来源信息，并非没有代价的替代。

新上下文适合需要保留当前填写状态的外部资料，普通站内导航通常无需如此。链接文字应提示上下文变化，避免导航预期不一致。

参考：[MDN：noopener](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/noopener)、[MDN：noreferrer](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/noreferrer)。

## 三十一、integrity 和 crossorigin 分别解决什么问题？

### 1. 完整性与跨源检查的职责

**`integrity` 用 SRI（子资源完整性）核对文件内容，`crossorigin` 控制请求采用的跨源模式。** 内容符合预期与服务器允许跨源访问是两个不同判断。

对固定版本的外部脚本或样式，可把实际文件的 SHA-384 等摘要写入 `integrity`。下载后哈希不匹配时，浏览器拒绝执行脚本或应用样式，并在控制台报告错误。

| 检查项 | 必须确认 |
|--------|----------|
| 版本 | URL 指向固定内容 |
| 摘要 | 来自实际字节，包含算法前缀和 Base64 摘要 |
| 跨源 | 服务器允许 CORS，元素使用相符请求模式 |
| 更新 | 文件内容变化时同步修改哈希 |

### 2. 资源更新和失败定位

1. **看浏览器错误：** 先区分资源不存在、CORS 拒绝与完整性校验失败，不要看到脚本没执行就直接删除 `integrity`。
2. **对照实际字节：** 确认响应来自预期的固定版本，并用实际文件重新计算摘要。新旧版本功能相同也可能有不同字节，旧哈希会使新文件加载失败。
3. **核对跨源条件：** 检查元素的 `crossorigin` 与服务器的 CORS 响应是否匹配；摘要正确也不能让跨源检查自动通过。

SRI 不判断依赖自身是否安全，也无法防止主页面与哈希一起被篡改。这里说明校验关系，没有声称验证某个实际 CDN 文件。

参考：[MDN：子资源完整性](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity)。

## 三十二、autocomplete 和 inputmode 会验证输入吗？

### 1. 自动填充和键盘提示

**不会。`autocomplete` 提示字段用途以帮助填充，`inputmode` 提示虚拟键盘类型。** 合法性由输入类型、约束和业务校验决定。

| 属性 | 示例 | 作用 |
|------|------|------|
| `autocomplete` | `email`、`shipping street-address` | 区分数据用途 |
| `autocomplete="one-time-code"` | 验证码 | 请求适用平台的自动填充 |
| `inputmode="numeric"` | 数字验证码 | 提示数字键盘，不限制粘贴内容 |

### 2. 验证码输入与服务端判断

下面是验证码控件的局部片段，省略表单和服务端验证：

```html
<label for="verification-code">六位验证码</label>
<input id="verification-code" name="code" type="text"
       inputmode="numeric" autocomplete="one-time-code"
       pattern="[0-9]{6}" maxlength="6" required>
```

`text` 保留 `001234` 的前导零；验证码不是参与计算的数值，不应只为数字键盘使用 `number`。`pattern` 校验格式，`maxlength` 限制文本长度，填充是否出现由浏览器和平台决定。

数字键盘不证明输入合法，自动填充不证明身份验证通过，页面显示值不证明请求可信。检查控件时应同时关注填写体验、提交值和服务端规则。

参考：[MDN：autocomplete](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete)、[MDN：inputmode](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode)。

## 三十三、表单内的 button 为什么可能意外提交，如何触发表单校验？

**`button` 在关联表单内未声明 `type` 时默认是提交按钮。** 一个只负责打开帮助面板的按钮若省略 `type="button"`，点击它也可能提交表单。

1. 提交按钮会按表单规则触发约束校验，并产生 `submit` 事件；校验失败时通常不会进入正常提交过程。
2. `form.requestSubmit()` 模拟请求提交，可指定提交按钮并遵循校验与 `submit` 事件；直接调用 `form.submit()` 会绕过这些步骤。
3. 在 `submit` 监听器中调用 `event.preventDefault()` 可以阻止默认导航，再按业务需要发送请求。仍需防重复提交和服务端校验。

::: tip 为非提交命令显式写 type
表单中的“查看说明”“删除筛选条件”等按钮应明确使用 `type="button"`；真正提交的按钮用 `type="submit"`，使行为与语义一致。
:::

参考：[MDN：button 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button)、[MDN：requestSubmit](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/requestSubmit)。

## 三十四、哪些表单控件会进入 FormData，disabled 与无 name 有何影响？

**`FormData(form)` 收集的是符合表单提交规则的成功控件，不是表单里所有可见输入。** 控件必须有关联表单及有效 `name`；禁用控件不会提交，未选中的复选框也不会提供值。

| 情况 | 是否进入提交数据 | 原因 |
|------|------------------|------|
| 有 `name` 且未禁用的文本框 | 是 | 有可提交的名称和值 |
| `disabled` 控件 | 否 | 被排除在提交之外 |
| `readonly` 文本框 | 是 | 只限制用户编辑，不取消提交 |
| 未选中的 checkbox | 否 | 没有被选中的值 |
| `name` 缺失 | 否 | 无法形成命名的表单数据 |

同名复选框可产生多个值，读取时用 `getAll()` 而非只用 `get()`。控件可通过 `form` 属性关联表单，因此物理上位于 `<form>` 外也可能提交；排查“字段没发出去”时应检查关联、名称、禁用状态及选中状态。

参考：[MDN：FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData)、[MDN：form 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/form)。

## 三十五、Web Components 的 Custom Elements 与 Shadow DOM 分别解决什么问题？

**Custom Elements 定义可复用的元素行为；Shadow DOM 为组件内部节点和样式提供封装边界。** 两者可以组合，但注册自定义元素不自动创建 Shadow Root。

1. 自定义元素有名称规则、注册与生命周期回调，可把组件行为封装到一个标签中；何时升级取决于定义是否已经加载。
2. Shadow DOM 有独立树和样式作用域，外部样式不会像普通后代选择器那样直接匹配内部节点；可通过 CSS 自定义属性、`::part` 等显式接口定制。
3. 封装不等于安全沙箱。内部脚本仍运行在页面环境，组件仍应设计属性、事件和可访问性接口。

面试追问“为何组件库只注册标签却有样式泄漏”时，应确认它是否真的使用 Shadow DOM，以及全局样式从哪里注入。

参考：[MDN：Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)、[MDN：Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)。

## 三十六、preconnect、dns-prefetch 与 preload 分别提前做什么？

**资源提示提前完成不同阶段的工作：`dns-prefetch` 解析域名，`preconnect` 尝试提前建立连接，`preload` 提前请求当前页面需要的资源。** 是否有收益取决于资源是否真正会用到、优先级和网络条件。

| 提示 | 提前处理 | 常见场景 |
|------|----------|----------|
| `dns-prefetch` | DNS 解析 | 可能访问的外部域名 |
| `preconnect` | DNS、连接与必要握手 | 即将请求的关键跨源资源 |
| `preload` | 当前导航所需的具体资源 | 稍后才被发现的关键字体或图片 |

过量 `preconnect` 会占用连接资源；误用 `preload` 可能抢占关键请求，甚至因 `as`、跨源模式不匹配而重复下载。应在 Network 瀑布图中检查资源发现时间、优先级和实际复用情况。

参考：[MDN：preconnect](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preconnect)、[MDN：preload](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload)。






