---
title: "CSS面试题"
category: "面试题"
tags:
  - CSS
excerpt: "围绕盒模型、层叠、选择器、定位、Flex 与 Grid、响应式布局和渲染性能等 CSS 面试题，解释计算过程、行为原因和适用条件，配合示例回答常见追问与布局排错问题。"
---

# CSS面试题

CSS（层叠样式表）决定 DOM（文档对象模型）中的元素如何布局和绘制。一个样式没有达到预期，通常要依次判断：选择器是否匹配、哪条声明胜出、尺寸参考什么，以及布局或绘制受到什么限制。

## 一、现代 CSS 有哪些主要能力？

### 1. 现代 CSS 的能力范围

**现代 CSS 可处理布局、响应式适配、视觉表现、动态效果和样式组织。** “CSS3”是历史统称，CSS 的各模块分别演进，不存在覆盖所有能力的统一“CSS3 版本”。

| 能力 | 代表机制 | 场景 |
|------|----------|------|
| 布局 | Flexbox（一维弹性布局）、Grid（二维网格布局）、定位 | 导航、商品列表、角标 |
| 空间适配 | 媒体查询、容器查询、尺寸函数 | 同一组件在不同空间中重排 |
| 视觉表现 | 圆角、阴影、渐变、滤镜 | 表达边界、层次和状态 |
| 动态效果 | `transform`、`transition`、`animation` | 状态过渡、加载反馈 |
| 样式组织 | 自定义属性、`@layer` | 主题、第三方样式覆盖 |

### 2. 布局选择与兼容验证

例如商品列表可用 Grid 排列，每张卡片内部用 Flex 排标题与按钮，用自定义属性表达主题颜色。选择技术时看布局关系和约束，不能因为功能新就替换所有旧写法。

涉及容器查询、动态视口单位等能力时，应检查目标浏览器和项目 WebView 的支持情况。语法被支持不等于布局已经正确，还需验证长文本、窄屏和用户字体设置。

参考：[MDN：CSS 参考](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference)。

## 二、标准盒模型与 border-box 如何计算尺寸？

### 1. 盒模型的尺寸计算

**盒子从内到外由内容、内边距、边框和外边距组成，`box-sizing` 决定 `width`、`height` 对应哪个范围。** 外边距始终在边框盒之外，不包含在这两个尺寸属性中。

以 `width: 200px; padding: 10px; border: 2px solid` 为例，暂不考虑最小尺寸、溢出和 Flex 收缩：

| 模式 | 内容宽度 | 边框盒宽度 | 两侧各有 10px 外边距时的横向占用 |
|------|----------|------------|----------------------------------|
| `content-box`（默认） | 200px | 200 + 20 + 4 = 224px | 244px |
| `border-box` | 200 - 20 - 4 = 176px | 200px | 220px |

### 2. border-box 的布局与验证

`border-box` 常用于组件布局，因为加入内边距和边框后仍能保持预期总宽度。但它不自动压缩长文本，也不把外边距算入宽度。

在空目录创建 `box-model.html`，以现代浏览器打开，两个盒子的实际边框宽度应分别为 224px、200px：

::: details 查看 box-model.html 的完整示例

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>订单盒模型</title>
  <style>
    .order-box {
      width: 200px;
      padding: 10px;
      border: 2px solid;
      margin: 10px;
    }
    .standard { box-sizing: content-box; }
    .border-box { box-sizing: border-box; }
  </style>
</head>
<body>
  <div class="order-box standard">标准盒模型</div>
  <div class="order-box border-box">border-box 盒模型</div>
</body>
</html>
```

:::

在开发者工具的盒模型面板检查内容、内边距和边框。实际尺寸不同于计算时，先检查覆盖规则、`min-width` 和所在布局；不要直接把 `width` 当作最终显示宽度。

参考：[MDN：box-sizing](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/box-sizing)。

## 三、link 引入 CSS 与 @import 有什么区别？

### 1. HTML 关联与 CSS 导入的发现时机

**`link` 在 HTML 中关联样式表，`@import` 在 CSS 中导入样式表，主要区别是资源发现方式和使用位置。** 两者最终都会参与层叠。

| 方式 | 使用位置 | 资源发现与用途 |
|------|----------|----------------|
| `link rel="stylesheet"` | HTML `head` | 浏览器解析 HTML 时即可发现，适合主样式 |
| `@import` | 样式表或 `style` 中 | 需发现并处理包含它的 CSS，容易形成依赖链 |

### 2. 依赖链与构建产物

以下分别是 `head` 和 `site.css` 中的局部声明，需提供相应样式文件：

```html
<link rel="stylesheet" href="site.css">
```

```css
/* site.css：导入必须位于普通规则之前。 */
@import url("print.css") print;
```

`@import` 通常必须放在其他规则之前，允许前置的例外包括 `@charset` 和层顺序声明等。写在普通选择器规则之后会被忽略。它也不是“页面加载完成才请求”，具体发现时机要看网络请求。

多层导入会增加发现依赖的等待时间。若构建工具已把导入合并，则产物没有同样的请求链；面试回答要区分浏览器原生导入和构建时处理。

参考：[MDN：@import](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@import)。

## 四、什么是 BFC，能解决哪些布局问题？

**BFC（块级格式化上下文）是管理普通块与浮动布局关系的一片区域。** 它能包住内部浮动、避免与外部浮动重叠，并阻止跨边界的父子外边距折叠，但不是隔离全部布局影响的沙箱。

### 1. 如何建立 BFC

常见方式及副作用如下：

| 方式 | 适用判断 |
|------|----------|
| `display: flow-root` | 明确为了建立独立 BFC，通常最直接 |
| 块容器的 `overflow: auto`、`hidden` 等 | 同时改变滚动或裁剪行为，不能无条件使用 |
| `float` 非 `none` | 元素自身浮动，不是普通父容器的替代 |
| `position: absolute`、`fixed` | 同时脱离普通文档流 |
| `display: inline-block` 等 | 同时改变外部布局参与方式 |

Flex 和 Grid 建立各自的格式化上下文，也有抑制项目外边距折叠等效果，但不应直接称为普通 BFC。`overflow: clip` 单独使用不会建立 BFC。

### 2. 为什么能包住浮动

普通父块自动高度计算可能不包含浮动子元素，因此只有浮动内容时父背景会塌成很薄的一条。建立 BFC 后，父元素的自动高度会包含相关内部浮动。

以下是可放入页面的局部 HTML，省略文档外壳：

```html
<div class="article-preview">
  <div class="thumbnail">商品图区域</div>
</div>
```

对应 `style.css` 的局部样式为：

```css
.article-preview { display: flow-root; background: #e6f3ee; }
.thumbnail { float: left; width: 120px; height: 80px; }
```

父背景应包住 80px 高的浮动内容。删除 `flow-root` 后，若没有其他内容或最小高度，父块高度会降为 0；这正是浮动未参与普通高度计算的证据。

### 3. BFC 有哪些边界

新的 BFC 可以阻止首个子块的上外边距与父块折叠，但内部两个普通块之间仍可能折叠。子内容也仍会影响父尺寸，不能把“独立区域”理解成子元素不再影响父元素。

::: warning 不要只为 BFC 设置 overflow: hidden
该写法还会裁剪内容并改变滚动祖先，可能裁掉菜单或影响 `sticky`。只想包住浮动时优先考虑 `flow-root`，布局重构再按需要选 Flex 或 Grid。
:::

参考：[MDN：块级格式化上下文](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Display/Block_formatting_context)。

## 五、transition 与 animation 有什么区别？

### 1. 状态过渡与关键帧动画

**`transition` 在属性值改变时插值，`animation` 按关键帧和时间设置运行。** 过渡适合两个状态之间的变化，关键帧动画适合多阶段或循环变化。

| 维度 | `transition` | `animation` |
|------|--------------|-------------|
| 定义状态 | 旧值与新值 | `@keyframes` 中的一个或多个阶段 |
| 触发 | 匹配样式或脚本改变属性值 | 动画规则生效即可运行，可设置延迟 |
| 循环与方向 | 不提供关键帧循环模型 | 支持次数、方向、暂停和填充模式 |
| 场景 | 悬停变色、展开状态反馈 | 加载进度、连续状态提示 |

### 2. 按钮过渡与动效边界

例如页面按钮的局部样式可以在悬停时过渡背景色：

```css
/* style.css：页面需有 class="order-button" 的按钮。 */
.order-button { background: white; transition: background-color 150ms ease; }
.order-button:hover { background: #e6f3ee; }
```

没有属性变化就不会触发这次过渡。关键帧动画则可独立描述变化，以下是状态标记的局部样式：

```css
/* style.css：用于已有 class="pending" 的状态标记。 */
@keyframes pending-feedback {
  from { opacity: 0.55; }
  to { opacity: 1; }
}
.pending { animation: pending-feedback 1s ease-in-out infinite alternate; }
```

动画结束后是否保留最后阶段由 `animation-fill-mode` 等决定；`forwards` 只保留动画效果，不是改写原声明。并非所有属性都能平滑插值，两者都应考虑减少动态效果的用户偏好。

参考：[MDN：CSS 过渡](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Transitions/Using)、[MDN：CSS 动画](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Animations/Using)。

## 六、伪类与伪元素有什么区别？

### 1. 伪类状态与伪元素内容

**伪类选择已有元素的状态或结构条件，伪元素选择元素的一部分或生成的内容。** 伪类使用单冒号，伪元素通常使用双冒号，历史单冒号兼容不应作为新代码写法。

| 类型 | 示例 | 匹配含义 |
|------|------|----------|
| 伪类 | `:hover`、`:focus` | 悬停或聚焦的元素 |
| 伪类 | `:first-child`、`:nth-child()` | 满足结构位置的元素 |
| 伪元素 | `::before`、`::after` | 元素生成的前后内容 |
| 伪元素 | `::first-line`、`::selection` | 首行或选中的文本部分 |

### 2. 选择器实例与使用限制

以下是链接的局部样式，省略 HTML 中的 `.order-link` 元素：

```css
.order-link:hover { text-decoration-thickness: 2px; }
.order-link::after { content: ""; display: inline-block; width: 6px; height: 6px; }
```

第一条在链接悬停时改变已有文本样式，第二条生成装饰盒子。`::before`、`::after` 通常需设置非 `none` 的 `content` 才显示，不会成为普通 DOM 子节点。

关键业务文字和操作名称应保留在 HTML 中，不能只靠生成内容传递。伪类在优先级中通常计入类级，伪元素通常计入类型级，特殊伪类另有规则。

参考：[MDN：伪类](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Pseudo-classes)、[MDN：伪元素](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Pseudo-elements)。

## 七、如何实现水平居中和垂直居中？

**先判断元素是否参与普通流、尺寸是否已知、父容器能否使用 Flex 或 Grid，再选择方案。** 现代普通组件优先考虑 Flex 或 Grid，覆盖层才优先考虑定位。

### 1. Flex 与 Grid 居中

下面是 `style.css` 的两种独立局部方案，页面需有一个 `.center` 父容器和其子元素，二选一即可：

::: code-group

```css [Flex]
.center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
```

```css [Grid]
.center {
  display: grid;
  place-items: center;
  min-height: 200px;
}
```

:::

两者无需预先知道子元素大小。Flex 的主轴由 `flex-direction` 决定，不能固定把 `justify-content` 当成水平对齐；父元素必须有可分配空间，否则垂直居中没有明显效果。

### 2. 普通流与表格单元格居中

普通块水平居中可以用确定宽度或最大宽度配合 `margin-inline: auto`；这不会自动完成垂直居中。行内内容可以由父元素的 `text-align: center` 水平居中。

表格单元格的 `vertical-align: middle` 可垂直对齐，结合 `text-align: center` 可对齐行内内容。它适用于既有表格，不建议为了普通组件居中把整块改成表格布局。

### 3. 绝对定位居中

未知子尺寸时，让子元素起点位于父中心，再按自身尺寸回退。以下是 `style.css` 的局部样式，父、子分别使用 `.overlay` 和 `.message`：

```css
.overlay { position: relative; height: 200px; }
.message {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
```

`left`、`top` 的百分比参考包含块，`translate` 的百分比在这个普通 HTML 盒子中参考子元素自身。子尺寸变化后无需手动重算偏移。

| 已知尺寸方案 | 成立条件 | 局限 |
|--------------|----------|------|
| `inset: 0; margin: auto` | 绝对定位，子元素有确定宽高 | 尺寸和容器空间需配合 |
| `left/top: 50%` 加负外边距 | 回退量为子宽高的一半 | 尺寸变化需同步修改 |
| 单行文本行高等于容器高度 | 只有一行且高度固定 | 多行或放大文字后不适用 |

定位方案脱离普通流，父元素不会因此自动包住子元素。内容可能变长时，不应只验证短文本下的居中结果。

参考：[MDN：居中布局](https://developer.mozilla.org/en-US/docs/Web/CSS/Layout_cookbook/Center_an_element)。

## 八、浏览器如何决定哪条 CSS 声明生效？

**先比较层叠规则，再比较选择器优先级，最后才比较书写顺序。** `!important` 影响重要性，不是给选择器增加一个优先级分数。

同一元素的同一属性发生冲突时，可以按以下顺序理解：

1. 排除选择器不匹配、媒体条件不成立或属性值无效的规则。
2. 比较来源、重要性和层叠层；浏览器默认、用户样式与作者样式不是同一个来源。
3. 在可比较的同级声明内，比较选择器优先级。
4. 使用 `@scope` 时还涉及作用域接近程度；仍相同时，后声明胜出。

### 1. 选择器优先级如何比较

常规选择器按 `(ID 数量, 类级数量, 类型级数量)` 从左到右比较，不是把三个数字相加：

| 选择器 | 优先级 |
|--------|--------|
| `#message` | `(1, 0, 0)` |
| `.notice.warning` | `(0, 2, 0)` |
| `article p` | `(0, 0, 2)` |
| `*`、组合符 | 不增加优先级 |

类级包括类、属性和普通伪类，类型级包括标签和伪元素。在相同作者来源、相同层、普通声明中，再多类也不能凭数量累加超过一个 ID。

### 2. 为什么后写的样式仍不生效

页面有 `<p id="message" class="notice">库存不足</p>` 时，以下 `style.css` 局部规则使文字为红色：

```css
#message { color: red; }
.notice { color: blue; }
```

`#message` 优先级更高，因此后面的蓝色不生效。行内普通样式又优先于普通作者样式表规则，但仍能被适当的作者重要声明覆盖。

::: warning 不能只比较选择器
层顺序、来源或重要性不同，选择器优先级并不是决定因素。关键帧动画高于普通声明，重要声明可覆盖关键帧动画，活动过渡还有更高层叠优先级；排查时先看声明所属阶段。
:::

使用开发者工具查看命中规则、划掉的声明和计算值，再调整层、选择器或组织方式。不断叠加 `!important` 会使覆盖关系更难维护。

参考：[MDN：层叠规则](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Introduction)、[MDN：优先级](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Specificity)。

## 九、为什么 z-index 很大仍然被其他元素遮挡？

### 1. 堆叠上下文内的层级比较

**`z-index` 在堆叠上下文内比较，子元素不能凭大数值越过父上下文的整体层级。** 堆叠上下文是一组在外部排序时作为整体参与的元素。

例如菜单父容器在 `z-index: 1` 的上下文中，菜单写 `9999`；另一个遮罩父容器在 `z-index: 2` 的上下文中。外部比较先看 1 与 2，菜单仍被遮罩盖住。

| 常见创建条件 | 说明 |
|--------------|------|
| 定位元素设置非 `auto` 的 `z-index` | `relative`、`absolute` 等情形 |
| `position: fixed` 或 `sticky` | 自身形成堆叠上下文 |
| `transform` 非 `none`、`opacity < 1` | 没写 `z-index` 也可创建 |
| Flex、Grid 项目设置非 `auto` 的 `z-index` | 不要求项目先设定位 |
| `isolation: isolate` | 明确建立隔离的堆叠上下文 |

### 2. 沿祖先定位遮挡原因

1. **找共同上下文：** 沿遮挡双方的祖先向上查找堆叠上下文，在同一个父上下文内比较其子上下文的整体层级。子元素的 `z-index: 9999` 不能越过层级更低的父上下文。
2. **区分裁剪：** 检查祖先的 `overflow` 是否裁掉了弹层。裁剪不是层级比较的结果，单纯提高 `z-index` 无法让内容越过裁剪边界。
3. **确认顶层元素：** 原生模态 `dialog` 进入浏览器顶层，不按普通页面的 `z-index` 与兄弟元素竞争。确定根因后再调整父级层序、弹层挂载位置或使用合适的顶层能力。

参考：[MDN：堆叠上下文](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context)。

## 十、Flex 与 Grid 有什么区别，如何选择？

### 1. 一维和二维布局的关系

**Flex 主要沿一条轴分配空间，Grid 统一定义行列轨道。** 区别在于布局关系，不在于元素多少；两者可以嵌套。

| 场景 | 优先考虑 | 原因 |
|------|----------|------|
| 导航、按钮组 | Flex | 单行或单列的排列与剩余空间 |
| 商品列表、仪表盘 | Grid | 跨行统一列宽和位置 |
| 卡片内标题与底部按钮 | Flex | 纵向分配剩余空间 |
| 页面外部网格、内部操作条 | Grid + Flex | 不同层次分别处理二维和一维 |

### 2. 换行与轨道对齐

Flex 换行后，每一行通常独立分配空间，不保证第二行项目与第一行轨道完全对齐。Grid 则共享列轨道，适合需要跨行对齐的列表。

需要已有 `.product-list` 容器和多个子项时，`style.css` 的局部三列网格可以写为：

```css
.product-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
```

`minmax(0, 1fr)` 允许轨道缩小，但长内容仍需选择换行或截断策略。窄屏是否改列数由实际内容决定，不能仅因为 Grid 能二维布局就认为页面已经响应式。

参考：[MDN：Grid 与其他布局的关系](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Relationship_with_other_layout_methods)。

## 十一、border、outline 与 box-shadow 有什么区别？

### 1. 盒模型与绘制效果的区别

**`border` 属于盒模型，`outline` 和 `box-shadow` 主要影响绘制，不分配布局空间。** 因而三者形成相似外观时，对尺寸和使用目的仍不同。

| 属性 | 布局影响 | 常见用途 |
|------|----------|----------|
| `border` | 参与边框盒尺寸，受 `box-sizing` 影响 | 元素实际边界 |
| `outline` | 不占空间，可用 `outline-offset` 偏移 | 键盘焦点提示 |
| `box-shadow` | 不占空间，可有多层、内阴影 | 视觉层次和状态 |

### 2. 焦点样式与布局位移

例如按钮获得焦点时，从无边框变成 2px 边框可能改变内容或总尺寸；轮廓不会推动邻居。局部焦点样式可写为：

```css
.order-button:focus-visible {
  outline: 2px solid #087f5b;
  outline-offset: 2px;
}
```

阴影和轮廓也可能被祖先裁剪。不能删除默认焦点标记后只留下颜色变化，替代效果应在不同背景下仍能明确识别。

参考：[MDN：outline](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/outline)、[MDN：box-shadow](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/box-shadow)。

## 十二、display: none、visibility: hidden 与 opacity: 0 有何区别？

### 1. 隐藏方式与布局、交互

**三者分别表示不生成布局盒、保留盒子但隐藏、保留盒子和交互但透明。** 看不见不等于不占位、不聚焦或不可点击。

| 写法 | 布局占位 | 正常点击与焦点 | 无障碍表现 |
|------|----------|----------------|------------|
| `display: none` | 不占位 | 不参与正常交互 | 通常不在无障碍树中 |
| `visibility: hidden` | 保留 | 隐藏元素不参与正常交互 | 通常不在无障碍树中 |
| `opacity: 0` | 保留 | 仍可被点击、聚焦 | 仍可被辅助技术识别 |

### 2. 透明元素的交互边界

`visibility` 可被后代设为 `visible` 覆盖；`opacity` 作用于整体透明度，后代不能设置 `opacity: 1` 来抵消父级整体透明。

淡出菜单如果只设置透明，用户仍可能点击到菜单或用 Tab 进入。应在状态切换时管理交互，例如关闭后设 `hidden` 或 `inert`。`pointer-events: none` 只处理指针，不会自动阻止键盘焦点。

参考：[MDN：display](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/display)、[MDN：visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/visibility)、[MDN：opacity](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/opacity)。

## 十三、CSS 如何继承，inherit、initial 和 unset 有什么区别？

### 1. 继承值与显式声明

**继承是在元素没有获得相应自身值时，按属性规则采用父级计算值。** `color`、`font-family` 通常继承，`margin`、`border` 通常不继承。

| 关键字 | 取值方式 | 例子 |
|--------|----------|------|
| `inherit` | 强制采用父元素计算值 | 让边框颜色规则明确随父级值 |
| `initial` | 使用 CSS 规范的初始值 | 不等于浏览器给某个标签的默认样式 |
| `unset` | 可继承属性取继承值，其他取初始值 | 按属性本身规则重置 |
| `revert` | 回退当前来源的影响 | 作者样式回退后可恢复用户或浏览器样式 |
| `revert-layer` | 回退当前层的影响 | 在层叠层中使用更早层的结果 |

### 2. 计算值和默认样式的判断

子元素自身的有效声明优先于继承值。例如父元素用 ID 设红色，子元素只用通用选择器设蓝色，子元素仍可为蓝色；这不是两个选择器直接竞争，因为它们作用于不同元素。

按钮常有自己的默认样式，文字没有随父级变化时应查计算值和自身规则，而非简单判断“`color` 不是继承属性”。

参考：[MDN：CSS 继承](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Inheritance)。

## 十四、@layer 如何控制样式覆盖顺序？

**层叠层把样式分组，并在同一来源、同一重要性内先比较层顺序，再比较选择器。** 它适合让组件样式与本地覆盖保持可预测的关系。

以下是 `style.css` 的完整局部规则，需有 `<button id="order-action">提交</button>`：

```css
@layer vendor, app;

@layer vendor {
  #order-action { color: blue; }
}

@layer app {
  button { color: red; }
}
```

按钮显示红色，因为普通声明中后定义的 `app` 层优先于 `vendor`，ID 的优先级不会跨层挽回结果。未分层的普通作者规则又优先于已分层普通规则。

::: warning important 的层顺序反转
同一来源的重要声明中，较早层优先于较晚层，已分层重要声明也优先于未分层重要声明。不能把普通声明的顺序直接套到 `!important`。
:::

层顺序由首次声明确立，最好用一个 `@layer vendor, app;` 集中表达。把规则移入层后覆盖结果改变，应先查层顺序，再查选择器。

参考：[MDN：层叠层](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Cascade_layers)。

## 十五、后代、子代和兄弟选择器有什么区别？

**组合符表达 DOM 关系，决定选择器匹配哪些元素。** 它们本身不增加优先级，也不会改变文档结构。

| 选择器 | 匹配范围 |
|--------|----------|
| `.card p` | 卡片内任意层级的段落 |
| `.card > p` | 卡片的直接子段落 |
| `h2 + p` | 紧跟 `h2` 的同级段落 |
| `h2 ~ p` | `h2` 后面所有匹配的同级段落 |

假设 `.card` 中既有直接段落，也有嵌套在 `section` 中的段落，后代选择器匹配两者，子代选择器只匹配前者。`+` 不会跨过另一个元素，`~` 可以跨过其他兄弟，但不会进入后代。

排查局部内容不匹配时，检查实际 DOM 是否多了一层包装。元素间的空白文本节点不会像元素那样打断相邻兄弟关系，不能把源码换行误认为多了一个兄弟元素。

参考：[MDN：选择器与组合符](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Selectors/Selectors_and_combinators)。

## 十六、:is()、:where() 和 :not() 如何匹配并计算优先级？

### 1. 三个函数的匹配规则

**`:is()` 和 `:where()` 匹配参数中任意选择器，`:not()` 排除参数匹配的元素。** `:where()` 自身及参数始终不增加优先级；`:is()`、`:not()` 采用参数列表中最高的优先级。

| 选择器 | 含义 | 优先级 |
|--------|------|--------|
| `:is(.card, #featured) a` | 两类区域内的链接 | `(1, 0, 1)` |
| `:where(.card, #featured) a` | 同样匹配这些链接 | `(0, 0, 1)` |
| `.card:not(.muted)` | 不是 muted 的卡片 | `(0, 2, 0)` |

### 2. 参数优先级与组件覆盖

即使第一条实际匹配的是 `.card` 分支，参数中的 ID 仍抬高整条选择器优先级。`:not()` 不是额外再加一个普通伪类分数，而是把参数的最高优先级带进来。

组件基础规则可用 `:where()` 限定区域，方便使用者覆盖。要排除状态用 `:not()`，不要因为名称相近就把这三者当作同一种缩写。

参考：[MDN：选择器优先级](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Specificity)。

## 十七、position 的五种常见取值如何影响布局？

### 1. 定位方式与偏移参考

**定位方式决定元素是否保留普通流空间，以及偏移参考什么区域。** 普通流是浏览器不使用浮动、绝对定位等特殊方式时组织盒子的基本布局。

| 取值 | 普通流占位 | 偏移与参照 |
|------|------------|------------|
| `static` | 保留 | 常规布局，定位偏移不生效 |
| `relative` | 保留原位置 | 相对正常位置偏移，不推动邻居重新占位 |
| `absolute` | 不保留 | 相对其包含块定位 |
| `fixed` | 不保留 | 通常相对视口，部分祖先属性改变包含块 |
| `sticky` | 保留 | 正常布局后，在滚动与父边界约束内粘附 |

### 2. 包含块与固定定位例外

商品角标常用父卡片 `relative`、角标 `absolute`。角标参照最近建立相关包含块的祖先，并非无条件参照 DOM 父元素。

祖先 `transform` 等属性可以改变绝对或固定定位的包含块，因此 `fixed` 不总是相对屏幕。偏移生效还不意味着层级更高，是否遮挡要另查堆叠上下文。

参考：[MDN：position](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position)。

## 十八、sticky 不生效时如何排查？

**先检查偏移阈值，再确认滚动祖先和可移动空间。** `sticky` 不是无边界的固定定位，它会受所属容器约束。

在空目录创建 `sticky-demo.html`，现代浏览器打开后滚动内部列表，标题应保持在列表顶部：

::: details 查看 sticky-demo.html 的完整滚动示例

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>订单粘性标题</title>
  <style>
    .order-list { height: 160px; overflow: auto; }
    .order-heading { position: sticky; top: 0; margin: 0; background: white; }
    .order-body { height: 500px; background: #e6f3ee; }
  </style>
</head>
<body>
  <section class="order-list">
    <h2 class="order-heading">订单列表</h2>
    <div class="order-body">在此区域滚动查看订单</div>
  </section>
</body>
</html>
```

:::

排查顺序如下，每一步都有对应证据：

1. 查看计算值，目标轴需有非 `auto` 偏移，如 `top: 0`；删除该属性后不会有预期粘附阈值。
2. 检查祖先的 `overflow`，`hidden`、`auto`、`scroll` 可成为相关滚动祖先，即使它没有用户可见滚动条。
3. 比较容器、内容和粘性元素尺寸，父高度太短或子元素被拉伸到没有移动空间时无法得到预期效果。
4. 若已粘附却被导航挡住，调整 `top` 为导航高度，再独立检查层级。

示例中滚动的是 `.order-list`，滚动外部页面不能代替验证。修改后复测同一个滚动区域，不能只增加 `z-index` 就认为修复成功。

参考：[MDN：sticky 定位](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position#sticky)。

## 十九、百分比宽高参考谁，为什么 height: 100% 无效？

### 1. 百分比尺寸的参照

**百分比的参照随属性和布局而变化，常见宽高需要结合包含块判断。** 包含块是计算尺寸和部分位置的参照区域，不一定是直接父元素。

普通流块盒通常参考最近的块容器或格式化上下文祖先；绝对定位通常参考最近建立包含块的定位祖先。变换等属性也能改变这个查找结果。

### 2. 高度无法解析时的处理

在普通流中，父高度只有 `auto`、由内容撑开时，子 `height: 100%` 往往不能解析为预期的固定高度。可在 `style.css` 用以下局部规则建立明确参照，需有对应父子元素：

```css
.order-panel { height: 200px; }
.order-content { height: 100%; }
```

子高度应为 200px。删除父 `height` 后，在这个普通块场景中百分比高度会按相应的自动高度规则处理；绝对定位、Flex 和 Grid 的确定尺寸规则应另行判断。

`padding` 的百分比通常依据包含块的行内尺寸，在常见水平书写模式下即宽度；`translate` 的百分比通常参考自身盒子。不能把所有百分比都理解为“父元素的同方向尺寸”。

参考：[MDN：包含块](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Display/Containing_block)。

## 二十、垂直 margin 为什么折叠，如何避免？

### 1. 普通块的外边距折叠

**普通块布局中，部分相邻块、父子块和空块的垂直外边距会合并，而不是简单相加。** 水平外边距不使用这套折叠规则。

| 两个可折叠的外边距 | 折叠结果 |
|--------------------|----------|
| 20px 与 30px | 30px，取较大正值 |
| 20px 与 -10px | 10px，正值加负值 |
| -20px 与 -10px | -20px，取绝对值较大的负值 |

父顶部没有边框、内边距或其他分隔条件时，首个普通子块的上外边距可能与父级折叠，表现为“父背景也被一起推开”。空块的上下外边距也可能参与折叠。

### 2. 避免折叠与组件间距

项目外边距在 Flex、Grid 布局中不发生这种折叠；浮动、绝对定位元素也不按普通块的规则折叠。普通块父子边界可以通过合适的 `padding`、边框或 BFC 隔开。

组件之间的统一间距可由父级 `gap` 管理，但它需要支持 `gap` 的布局。不要在未判断根因时到处补 1px 边框，这会改变尺寸与视觉结果。

参考：[MDN：外边距折叠](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Box_model/Margin_collapsing)。

## 二十一、flex-basis、flex-grow 和 flex-shrink 如何计算尺寸？

**Flex 先确定基础尺寸，再按增长或收缩因子分配空间，最后受最小、最大尺寸等约束。** `flex-grow` 决定多余空间的分配比例，不直接代表最终宽度比例。

| 属性 | 作用 | 常见误解 |
|------|------|----------|
| `flex-basis` | 提供主轴基础尺寸，`auto` 结合主尺寸和内容 | 不总是等于 `width` |
| `flex-grow` | 分配正的剩余空间 | 相同增长因子不保证最终同宽 |
| `flex-shrink` | 空间不足时参与收缩 | 相同收缩因子不保证少掉相同像素 |

### 1. 增长与收缩如何分配

假设没有间距、边框、内边距和最小最大尺寸限制，两个项目基础宽度为 100px、200px，增长因子为 1、2，收缩因子均为 1：

| 容器宽度 | 计算过程 | 最终宽度 |
|----------|----------|----------|
| 600px | 剩余 300px，按 1:2 分为 100px、200px | 200px、400px |
| 240px | 缺少 60px，按收缩因子 × 基础尺寸的 100:200 分担 | 80px、160px |

增长是在基础上加空间；收缩权重还乘以基础尺寸。若某项触及最小或最大尺寸，会限制该项并重新分配空间，上表只是无约束的直观计算。

在空目录创建 `flex-sizing.html`，现代浏览器打开后检查两个项目宽度，再把容器的 600px 改成 240px：

::: details 查看 flex-sizing.html 的完整尺寸示例

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>订单列宽分配</title>
  <style>
    .order-row { display: flex; width: 600px; }
    .order-row > div { min-width: 0; }
    .summary { flex: 1 1 100px; background: #e6f3ee; }
    .details { flex: 2 1 200px; background: #e8effa; }
  </style>
</head>
<body>
  <div class="order-row">
    <div class="summary">摘要</div>
    <div class="details">订单明细</div>
  </div>
</body>
</html>
```

:::

删除 `min-width: 0` 并加入不可断开的长内容时，自动最小尺寸可以阻止预期收缩。这是实际结果偏离简化计算时应检查的条件。

### 2. flex: 1 是否表示等宽

当前浏览器通常把单个数字 `flex: 1` 展开为 `1 1 0%`。同一行各项都以零基础分配，且没有不同的最小尺寸、内边距等约束时，才容易得到等宽结果。

`flex: auto` 对应 `1 1 auto`，保留基于内容或尺寸的基础值。零百分比与明确的 `0px` 在主轴尺寸不确定时也有区别，不应把所有 `flex: 1` 都解释为无条件平均分配。

参考：[MDN：Flex 主轴尺寸](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Flexible_box_layout/Controlling_flex_item_ratios)、[MDN：flex 简写](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/flex)。

## 二十二、Flex 子项为什么溢出，min-width: 0 有什么作用？

### 1. 自动最小尺寸导致的溢出

**Flex 项目的自动最小尺寸可能受内容限制，阻止它缩到布局需要的宽度。** 长 URL、连续标识符和不换行文本是常见触发内容。

`flex: 1` 允许空间分配，但不自动取消 `min-width: auto` 的限制。设置 `min-width: 0` 允许需要收缩的项目继续缩小，之后还要决定内容换行、截断或滚动。

### 2. min-width 与内容换行

以下是 `style.css` 的局部样式，页面需有 `.order-row`，其中包含 `.order-name` 和 `.order-status`：

```css
.order-row { display: flex; width: 240px; }
.order-name {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.order-status { flex: none; }
```

状态保留自身宽度，长名称在剩余空间内显示省略号。Flex 项目的自动最小尺寸还受其 `overflow` 等条件影响，不能断言每个 Flex 项目都会被同样的最小内容宽度卡住。

纵向 Flex 中对应问题常需检查 `min-height: 0`。若内容必须完整阅读，可改用 `overflow-wrap: anywhere` 或局部滚动；若窄屏应换行，应检查父级 `flex-wrap`，不能把截断当作唯一修复。

参考：[MDN：Flexbox 基本概念](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Flexible_box_layout/Basic_concepts)。

## 二十三、Flex 主轴、交叉轴和对齐属性如何对应？

### 1. 主轴、交叉轴与对齐属性

**主轴由 `flex-direction` 决定，交叉轴与它垂直。** 在常见水平书写模式中，`row` 的主轴水平，`column` 的主轴垂直；方向还受书写模式和文本方向影响。

| 属性 | 职责 | 生效条件或边界 |
|------|------|----------------|
| `justify-content` | 分配主轴剩余空间 | 无剩余空间时效果有限 |
| `align-items` | 设置项目的交叉轴对齐 | 默认拉伸还受项目自身尺寸影响 |
| `align-self` | 覆盖单个项目的交叉轴对齐 | 不负责主轴对齐 |
| `align-content` | 分配多条 Flex 行的交叉轴空间 | 需多行容器及足够空间，不等于 `align-items` |
| 自动外边距 | 优先吸收相应方向剩余空间 | 可以让操作按钮推到末端 |

### 2. 方向变化时的选择

例如纵向卡片要垂直居中内容，应看 `justify-content`；横向导航让单个操作靠右，可给操作设置 `margin-inline-start: auto`。父级 `display: flex` 不会使 `justify-items` 成为 Flex 项目主轴对齐工具。

排查时先确认轴方向、容器剩余空间和是否多行，再选择属性，不能只靠记忆“justify 是水平、align 是垂直”。

参考：[MDN：Flexbox 对齐](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Flexible_box_layout/Aligning_items_in_a_flex_container)。

## 二十四、Grid 的 auto-fit 与 auto-fill 有什么区别？

**两者都会按可用宽度重复轨道，区别是 `auto-fit` 会折叠空轨道，`auto-fill` 会保留空轨道。** 与 `minmax()` 和 `1fr` 配合时，空余宽度的利用结果就不同。

假设容器宽 640px，列最小宽度 140px、间距 20px，能放四列，但只有两个项目：

| 设置 | 结果 |
|------|------|
| `auto-fill` | 保留四列，每列约 145px，后两列空着 |
| `auto-fit` | 空列及对应间距折叠，两个项目各约 310px |

以下是已有商品列表的 `style.css` 局部规则：

```css
.product-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 140px), 1fr));
  gap: 20px;
}
```

`min(100%, 140px)` 让极窄容器下的下限不超过可用宽度。直接以固定 140px 为下限时，容器小于这一尺寸仍会溢出。

项目填满全部可用轨道时，两种写法看起来可以一样。想让少量卡片扩展到整行可选 `auto-fit`，希望保留空列位置可选 `auto-fill`。

参考：[MDN：repeat()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/repeat)。

## 二十五、媒体查询如何设置合理的响应式断点？

**断点应由内容何时拥挤或失衡决定，而不是与某个设备型号绑定。** `@media` 可以查询视口、媒体类型和用户偏好等条件。

例如项目确认 600px 以上能稳定容纳两列订单卡片，局部样式可以从窄屏规则开始：

```css
.order-list { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 600px) {
  .order-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
```

600px 只是这个布局的验证结果，不是通用标准。先验证单列可读，再持续改变宽度观察何时能增加列数，并检查断点前后是否跳动或溢出。

移动页面还需正确的 `viewport` 声明。只在几个预设手机尺寸截图，不能覆盖临界宽度、长文案和字体放大情况；响应式也不等于所有元素按比例缩小。

参考：[MDN：媒体查询](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Using)。

## 二十六、容器查询与媒体查询有什么区别？

### 1. 视口条件与容器条件

**媒体查询通常判断页面视口等条件，尺寸容器查询判断祖先容器的可用尺寸。** 页面级列数适合媒体查询，复用组件内部排版适合容器查询。

同样的订单摘要在主栏宽 600px、侧栏宽 260px 时，视口宽度可能完全相同。用容器查询就能分别让主栏摘要横排、侧栏摘要竖排。

### 2. 复用组件的尺寸适配

下面是 `style.css` 的局部规则，需有 `.order-panel` 包含 `.order-summary` 及其子项：

```css
.order-panel { container-type: inline-size; container-name: order; }
.order-summary { display: grid; gap: 8px; }
@container order (min-width: 400px) {
  .order-summary { grid-template-columns: 1fr auto; }
}
```

符合名称与尺寸条件的祖先超过阈值时，其后代摘要改为两列。查询不会直接根据容器自身尺寸来改变容器自身，而是用于后代样式，避免循环依赖。

未生效时检查查询容器是否建立、名称是否一致、实际尺寸是否达阈值。`container-type` 会引入相应包含约束，项目旧 WebView 还需要兼容性验证。

参考：[MDN：容器尺寸查询](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_size_and_style_queries)。

## 二十七、px、em、rem、百分比和视口单位如何选择？

### 1. 各长度单位的参照

**长度单位的关键差别是参照对象，不能只概括成绝对或相对。** `px` 是 CSS 像素，不保证等于一个屏幕物理像素。

| 单位 | 参照 | 常见用途 |
|------|------|----------|
| `px` | CSS 像素 | 明确的边框和局部尺寸 |
| `rem` | 根元素的字体大小 | 全局字号和间距尺度 |
| `em` | 字号中参考父级，其他常见长度中参考当前字体 | 随组件字体变化的内边距 |
| `%` | 由属性及布局决定 | 宽度、位置和部分尺寸 |
| `vw`、`vh` | 视口宽高的百分之一 | 视口相关尺寸 |
| `svh`、`lvh`、`dvh` | 小、大、动态视口高度的百分之一 | 移动工具栏变化下的页面高度 |

### 2. 字号与视口变化的结果

根字号为 16px 时，`1.5rem` 为 24px；若当前字体为 24px，`padding: 1em` 对应 24px。多层元素各写 `font-size: 1.5em` 会逐级放大，不能当作固定 24px。

移动端 `dvh` 会随动态视口变化，`svh` 更适合按工具栏展开后的较小空间安排内容。还需验证软键盘、浏览器缩放和长内容，单位选择不能代替溢出处理。

参考：[MDN：CSS 长度](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length)。

## 二十八、calc()、min()、max() 和 clamp() 如何计算尺寸？

### 1. 计算、上下限和区间限制

**`calc()` 做表达式计算，`min()`、`max()` 选择较小或较大值，`clamp()` 把首选值约束在上下界之间。** 运算仍需符合 CSS 的值类型规则。

| 表达式 | 含义 | 场景 |
|--------|------|------|
| `calc(100% - 32px)` | 参考宽度减去 32px | 扣除固定空间 |
| `min(100%, 960px)` | 两个候选中取较小值 | 宽度不超过容器与上限 |
| `max(24px, 2rem)` | 取较大值 | 保证最小间距 |
| `clamp(240px, 50vw, 640px)` | 首选视口一半，最小 240px、最大 640px | 有边界的尺寸变化 |

### 2. 具体宽度与语法边界

视口宽 1000px 时，最后一项为 500px；宽 1600px 时为 640px。宽 400px 时则仍为 240px，说明下限不会自动因为屏幕更小而继续缩减。

`calc()` 的加减号应有必要空格，例如 `calc(100% - 32px)`。当固定下限超过容器时，还需 `max-width: 100%` 等约束；这些函数不会自动解决内容换行和 Flex 最小尺寸问题。

参考：[MDN：CSS 数学函数](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/calc)、[MDN：clamp()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/clamp)。

## 二十九、CSS 自定义属性与 Sass 变量有什么区别？

### 1. 运行时变量与构建时变量

**CSS 自定义属性在浏览器中参与层叠，Sass 变量在构建时替换并生成 CSS。** 因而 CSS 变量可随 DOM 子树和运行时主题变化，Sass 变量适合构建时计算和生成规则。

| 维度 | CSS 自定义属性 | Sass 变量 |
|------|----------------|-----------|
| 写法 | `--accent`、`var(--accent)` | `$accent` |
| 处理时机 | 浏览器样式计算 | Sass 编译 |
| 层叠与继承 | 未注册自定义属性通常参与继承 | 生成 CSS 后没有变量级的 DOM 继承 |
| 运行时修改 | 可用样式和脚本改变 | 需改变生成的 CSS 或重新构建 |

### 2. 主题切换和回退值

以下是 `style.css` 的局部主题样式，需有 `.order-panel` 包含 `.order-button`：

```css
.order-panel { --accent: #087f5b; }
.order-button { color: var(--accent, teal); }
```

按钮使用祖先的主题值。`teal` 是变量缺失或处于相应无效状态时的回退，不是所有属性值错误时的兜底：若 `--accent: 10px`，变量存在，但它不能作为 `color`，此时不会简单改用 teal。

注册自定义属性的 `@property` 可以规定语法、初始值和是否继承，不能把未注册变量的全部规则直接套到注册变量。

参考：[MDN：CSS 自定义属性](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties)、[Sass：变量](https://sass-lang.com/documentation/variables/)。

## 三十、overflow: auto、hidden 和 clip 有什么区别？

### 1. 滚动容器与裁剪方式

**`auto` 允许按需滚动，`hidden` 裁剪但仍支持程序式滚动，`clip` 裁剪且不建立可滚动容器。** 裁掉内容并不会删除其中的 DOM。

| 取值 | 滚动条 | 程序式滚动 | 格式化上下文 |
|------|--------|------------|----------------|
| `auto` | 内容溢出时按需提供 | 可以 | 在适用块容器上可建立 BFC |
| `hidden` | 不显示 | 可以，例如设置 `scrollTop` | 在适用块容器上可建立 BFC |
| `clip` | 不显示 | 不可以 | 单独使用不建立 BFC |

### 2. 键盘访问与双轴计算

例如较长的订单明细可以设置 `max-height: 160px; overflow: auto`，避免整页被内容拉长。键盘访问滚动区域时还需确认是否可聚焦，并有可识别名称。

::: warning 裁剪内容仍可能获得键盘焦点
`clip` 中的隐藏控件仍可能被 Tab 选中，却不能通过滚动进入视野。不要把交互内容随意裁掉；`hidden` 建立的滚动关系也会影响 `sticky`。
:::

同时设置横纵两个值时有计算规则，例如一轴为 `visible`、另一轴为 `auto`，前者会计算为 `auto`。排查时检查计算值，不能只看自己写的一个方向。

参考：[MDN：overflow](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow)。

## 三十一、aspect-ratio 与 object-fit 分别控制什么？

### 1. 盒子比例与内容填充

**`aspect-ratio` 参与盒子首选宽高比计算，`object-fit` 决定图片或视频内容怎样放进已有盒子。** 控制盒子与控制盒内内容是两个步骤。

| 属性 | 效果 | 场景 |
|------|------|------|
| `aspect-ratio: 4 / 3` | 在适用的自动尺寸计算中维持比例 | 统一缩略图区域 |
| `object-fit: cover` | 保持内容比例填满盒子，裁掉超出部分 | 商品缩略图 |
| `object-fit: contain` | 保持比例完整显示，允许留白 | 证件或完整图表 |
| `object-fit: fill` | 拉伸填满，可能改变内容比例 | 明确允许拉伸的内容 |

### 2. 图片裁切的实际效果

页面有对应图片和 `.product-photo` 类时，局部样式可写为：

```css
.product-photo {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}
```

宽度决定高度，内容以 cover 填充。若宽高都已明确固定，首选比例不会覆盖这两项尺寸；只写 `object-fit` 而没有形成目标盒子，也不能得到预期裁切。

裁切位置还可用 `object-position` 控制。重要信息不能被裁掉，缩略图示例不能直接套到证件和数据图。

参考：[MDN：aspect-ratio](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/aspect-ratio)、[MDN：object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/object-fit)。

## 三十二、单行省略号为什么不生效，如何正确设置？

**`text-overflow: ellipsis` 只决定溢出文本的展示方式，必须先让文本发生可裁剪的溢出。** 通常需要受约束的宽度、不换行和隐藏溢出。

下面是已有订单名称的 `style.css` 局部规则：

```css
.order-title {
  max-width: 240px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

若 `.order-title` 是块盒且文字超过 240px，应出现省略号；普通行内 `span` 不会仅因 `max-width` 就得到同样宽度约束，需改成合适的块或行内块。

没有出现省略号时，检查实际宽度、是否换行、溢出区域和 Flex 自动最小尺寸。Flex 项目还可能需要 `min-width: 0`；多行省略不是这三项规则的直接效果。

省略不删除完整文字，但视觉使用者仍需能获取完整内容，例如进入订单详情。仅依赖 `title` 的鼠标悬停提示不足以覆盖触屏和键盘操作。

参考：[MDN：text-overflow](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-overflow)。

## 三十三、float、clear 和清除浮动分别解决什么问题？

**`float` 让周围内容环绕，`clear` 限制元素邻接相关浮动，“清除浮动”通常指让父容器正确包含浮动内容。** 三者有关联，但不能互相替代。

| 机制 | 作用 | 例子 |
|------|------|------|
| `float: left` | 浮动到一侧，周围行内内容环绕 | 文章文字环绕配图 |
| `clear: both` | 将这个元素放到两侧相关浮动下方 | 配图后开始新段落 |
| `display: flow-root` | 父容器建立独立 BFC，包含内部浮动 | 让背景包住浮动图 |

浮动元素不按普通块占位，但仍影响周围行盒和文字排列，因此“脱离普通流”不代表完全没有布局影响。父容器若只有浮动子项，自动高度可能不包含它们。

历史 clearfix 常在父级 `::after` 生成一个带 `clear: both` 的块，利用它把父高度撑到浮动下方。新代码只为包含浮动时可用 `flow-root`；整列页面与卡片网格通常使用 Flex 或 Grid。

参考：[MDN：float](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/float)、[MDN：clear](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/clear)。

## 三十四、哪些 CSS 动画更容易影响性能，如何判断？

### 1. 动画属性对应的渲染阶段

**性能取决于动画触发了哪些渲染阶段及每帧工作量。** 典型过程包括样式计算、布局、绘制和合成，不同属性需要的工作不同。

| 动画属性 | 常见影响 | 判断 |
|----------|----------|------|
| `width`、`height`、部分位置属性 | 改变几何关系，常需布局和绘制 | 必须推动其他内容时可能是必要成本 |
| 背景色、阴影等 | 常需重新绘制 | 关注绘制区域和复杂度 |
| `transform`、`opacity` | 通常不重新布局，适用场景可主要合成 | 适合位移、透明度反馈 |

### 2. 视觉需求与性能测量

例如浮层滑入可先考虑 `transform`，而展开区域必须推开后续内容时，尺寸变化就是业务需要。变换只改变视觉呈现，不会自动让邻居重新排列。

`will-change` 是优化提示，不保证升级为独立图层；过量使用会占内存并提前创建上下文。只在确有收益时使用，并在不再需要时恢复。

::: info GPU 与流畅程度不能仅由属性推断
`transform` 不保证完全由 GPU 执行，也不保证没有绘制。应在 Performance 面板记录动画，查看布局、绘制、帧耗时和低性能设备表现，再判断瓶颈。
:::

参考：[MDN：动画性能与帧率](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate)。

## 三十五、如何尊重用户减少动态效果的偏好？

**通过 `prefers-reduced-motion` 查询减少非必要运动，同时保留状态和反馈。** 它表达减少动态效果的偏好，并不要求把全部变化和信息都隐藏。

对已有 `.order-notice` 状态提示，局部样式可以关闭非必要动画：

```css
@media (prefers-reduced-motion: reduce) {
  .order-notice {
    animation: none;
    transition: none;
  }
}
```

关闭大幅位移、缩放或循环后，错误、加载和完成状态仍应通过文字、图形或静态颜色表达。不能仅移除唯一的加载反馈，使用户无法判断页面是否响应。

测试时切换系统设置或浏览器仿真的减少运动选项，再操作相同控件。若业务依赖 `animationend`、`transitionend` 才完成状态切换，关闭动画后事件链可能不再按原计划发生，应让业务状态独立于视觉动画完成。

参考：[MDN：prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)。

## 三十六、:nth-child() 与 :nth-of-type() 的计数有何区别？

**`:nth-child()` 按全部同级元素的位置计数，`:nth-of-type()` 按同类型元素的位置计数。** 它们从 1 开始，普通文本节点不参与元素位置计数。

假设父容器中依次是一个 `h2`、两个 `p`：

| 选择器 | 匹配结果 |
|--------|----------|
| `p:nth-child(2)` | 全部子元素中的第二个，即第一个段落 |
| `p:nth-of-type(2)` | 同级段落中的第二个，即第三个子元素 |
| `p:nth-child(odd)` | 全部位置为奇数的段落，这里只有第二个段落 |

参数还可写 `2n + 1` 等公式，`n` 从 0 递增，最终只保留有效的正位置。`nth-of-type` 按标签类型分类，不是按相同 class 分类。

结构中插入标题或操作按钮会改变 `nth-child` 的结果。实现隔行样式时，应先明确是所有子项计数还是某类内容计数，不能把结果变化直接归咎于 CSS 顺序。

参考：[MDN：:nth-child()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:nth-child)、[MDN：:nth-of-type()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:nth-of-type)。

## 三十七、:focus、:focus-visible 与 :hover 有什么区别？

**`:focus` 表示当前焦点，`:focus-visible` 表示浏览器判断需要可见焦点提示，`:hover` 表示指针悬停。** 获得焦点与显示哪种提示是两个判断。

| 伪类 | 典型触发 | 边界 |
|------|----------|------|
| `:focus` | 点击、键盘或脚本聚焦 | 不限于键盘操作 |
| `:focus-visible` | 常见于键盘导航 | 输入控件等也可能在鼠标操作后匹配 |
| `:hover` | 鼠标等指针悬停 | 不能替代键盘反馈，触屏行为也不同 |

为已有按钮设置键盘焦点标记，可使用局部样式：

```css
.order-button:focus-visible {
  outline: 2px solid #087f5b;
  outline-offset: 3px;
}
```

不要把 `focus-visible` 简化为“只匹配键盘”，它由浏览器启发式和控件特点判断。删除默认轮廓后必须提供同样可辨认的反馈，并通过 Tab 导航验证。

视觉焦点还要避免被固定头部或裁剪容器遮住。一个只有 hover 效果的交互控件，不能证明键盘使用者能找到当前位置。

参考：[MDN：:focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible)。

## 三十八、@font-face 与 font-display 如何影响字体加载？

**`@font-face` 定义字体资源及其描述符，`font-family` 选择字体，`font-display` 决定加载阶段的显示与交换策略。** 声明字体不代表立刻下载所有字重文件。

提供同目录字体文件后，`style.css` 中的局部规则可写为：

```css
@font-face {
  font-family: "Order UI";
  src: url("order-ui.woff2") format("woff2");
  font-display: swap;
}
body { font-family: "Order UI", sans-serif; }
```

| 策略 | 主要取舍 |
|------|----------|
| `block` | 有短暂阻塞显示期，再允许回退和交换 |
| `swap` | 极短阻塞期，先显示回退，资源就绪后交换 |
| `fallback` | 限制交换窗口，兼顾较早可读与稳定性 |
| `optional` | 更重视避免晚交换，当前访问不保证使用下载字体 |

字体交换时字宽和行高不同会引起布局跳动，应选择相近回退字体并按需要匹配度量。跨源字体需要相应 CORS 许可；失败时仍应能显示回退文字。

排查看 Network 是否请求、描述符是否匹配实际字重、计算字体是否命中。不能只看到 `@font-face` 就认为字体一定已使用。

参考：[MDN：font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/font-display)。

## 三十九、line-height 与 vertical-align 分别影响什么？

### 1. 行盒高度与基线对齐

**`line-height` 参与行盒高度计算，`vertical-align` 对齐行内、行内块或表格单元格。** `vertical-align` 不用于直接把普通块元素在父块中垂直居中。

无单位行高会作为数字继承，再乘以子元素自身字号。固定长度行高会作为该长度继承，更容易在子字号增大时出现重叠：

| 父规则、子字号 | 子元素行高 |
|----------------|------------|
| 父 `font-size: 16px; line-height: 1.5`，子字号 24px | 36px |
| 父 `font-size: 16px; line-height: 24px`，子字号 24px | 24px |

### 2. 字号继承与图片空隙

行盒最终还受同一行其他内容影响，不能把行高数值直接等同于字形的视觉高度。正文通常使用无单位行高，方便不同字号保持阅读节奏。

行内图片底部出现空隙，常与基线对齐、为文字下伸部预留空间有关，可按用途设置 `vertical-align` 或让图片 `display: block`。表格单元格中可以用 `vertical-align: middle`，普通组件居中通常选 Flex 或 Grid。

参考：[MDN：line-height](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/line-height)、[MDN：vertical-align](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/vertical-align)。

## 四十、内容图片应使用 img 还是 CSS 背景图？

### 1. 内容图与装饰图的职责

**承载信息的图片使用 `img`，纯视觉装饰通常使用背景图。** 选择依据是内容职责，而不是哪种方式更方便裁切。

| 方式 | 语义与能力 | 场景 |
|------|------------|------|
| `img` | 可提供 `alt`、尺寸、响应式候选和加载提示 | 商品照片、数据图、内容插图 |
| `background-image` | 不提供图片替代文本，可叠加装饰背景 | 纹理、非必要装饰 |

`img` 用 `object-fit: cover`，背景用 `background-size: cover`，都能保持比例填满区域并裁切。若关键对象被裁掉，可调整位置或改为完整显示，不能只要求盒子外观一致。

### 2. 文本替代与可理解性

例如订单报告中的趋势图需要文本说明或数据替代，不能因为放在页头就当作装饰背景。反过来，重复纹理没有独立信息，不需要让辅助技术逐个朗读。

最后判断是否选择正确，可以关闭图片后检查：用户是否仍能理解内容和操作；如果答案依赖图片信息，就应保留内容元素和等价说明，而不是只让界面看起来完整。

参考：[MDN：background-image](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/background-image)、[MDN：img 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img)。

## 四十一、`:has()` 如何按后代状态选择父元素，有什么性能边界？

**`:has()` 是关系伪类，让选择器依据元素与其后续选择器的关系匹配。** 例如表单行包含无效输入时，可写 `.field:has(input:invalid)`，直接给该行显示错误状态；它不是“把 CSS 变成任意 DOM 查询语言”。

1. 选择器内部的相对选择器决定匹配范围，`:has(> img)` 只检查直接子元素，`:has(img)` 可以匹配更深后代。
2. 优先级取决于参数中最具体的选择器，而不是把 `:has()` 当作普通伪类固定加一档。复杂规则可能增加样式匹配和重新计算成本。
3. 对频繁变化的大范围祖先选择器要在实际页面测量。可访问性状态仍要由语义属性和真实控件表达，视觉错误提示不能代替校验信息。

参考：[MDN：`:has()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:has)。

## 四十二、`content-visibility` 与 `contain` 如何减少渲染工作？

**`contain` 告诉浏览器某些布局、绘制或样式影响被限制在元素范围内；`content-visibility: auto` 可跳过离屏内容的部分渲染工作。** 它们优化的是浏览器处理范围，不减少网络数据或 JavaScript 计算量。

1. 长页面的独立区块可评估 `content-visibility: auto`，并用 `contain-intrinsic-size` 提供未渲染时的预估尺寸，减少滚动条和布局跳动。
2. 容器隔离可能影响尺寸计算、定位或溢出表现，不能无条件给全站元素加 `contain`。
3. 和虚拟列表比较时，前者仍保留 DOM，后者通常只挂载可见项；数据量巨大时两者解决的问题不同。

::: warning 跳过渲染不等于内容不存在
要检查页面内查找、键盘导航、可访问性及滚动定位是否仍符合预期，并在 Performance 面板验证收益。
:::

参考：[MDN：content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility)、[MDN：contain](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/contain)。

## 四十三、为什么动画常选 `transform`，它一定不会引发卡顿吗？

**移动元素的 `top/left` 可能改变布局；`transform` 改变视觉变换，在合适的合成条件下可减少布局和绘制。** 但动画仍可能消耗合成资源或占用大量显存。

| 变化 | 常见影响 | 判断方式 |
|------|----------|----------|
| 改变布局尺寸或位置 | 可能重排其他元素 | 查看布局事件与受影响节点 |
| 改变背景、阴影 | 通常需重绘 | 查看 Paint 时间和面积 |
| 改变 `transform`、`opacity` | 可能主要由合成处理 | 查看图层、帧时间与内存 |

`will-change` 是向浏览器提示未来变化，不是免费加速开关。对订单列表里的每一行都加图层可能使内存和合成成本上升；应只给正在动画的少量元素使用，并复测目标设备。

参考：[web.dev：渲染性能](https://web.dev/articles/rendering-performance)、[MDN：will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/will-change)。

## 四十四、多行文本省略如何实现，为什么只设 `text-overflow` 不够？

**`text-overflow: ellipsis` 主要处理单行或特定溢出场景，不能单独把一段文字限制成指定行数。** 多行截断需要行数限制与溢出处理配合，并确认完整内容仍有访问途径。

对支持 `line-clamp` 的目标浏览器可按项目兼容策略使用相应写法；历史实现常同时设置 `display: -webkit-box`、`-webkit-box-orient: vertical`、`-webkit-line-clamp: 3` 和 `overflow: hidden`。属性是否需要前缀应以目标浏览器矩阵验证，不应只复制某个片段。

::: tip 截断前先判断信息是否可丢失
订单状态、错误原因和操作标签不能只凭视觉省略而让用户无法得知完整内容。可提供可聚焦的展开方式或完整文本位置，并检查窄屏与放大字体。
:::

参考：[MDN：line-clamp](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/line-clamp)、[MDN：text-overflow](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-overflow)。


