---
title: "内联 SVG"
tags:
  - HTML
  - SVG
  - 图形
excerpt: "说明 SVG 是独立矢量语言、内联集成与 img 引用的文档边界，用 viewBox 与基本形状完成可缩放图形，并核对节点查询、缩放、可访问名称与 Canvas 的差别。"
date: 2026-11-14
---

# 内联 SVG

SVG 是一门描述矢量图形的独立语言，不是 HTML5 发明的新标签集合。HTML5 增强的是**在 HTML 文档中直接书写 SVG** 的能力：浏览器会把 `svg` 及其子元素当作 SVG 命名空间中的图形节点解析，而不是未知标签。

这种集成带来一个直接好处：图形仍是文档节点，可以被查询、修改和单独设置样式；同时因为描述的是几何形状，放大后不会像位图那样出现马赛克。本篇用同一份图形分别内联书写和用 `img` 引用，对比两种边界。

::: info 本篇的范围
本篇讲内联 SVG 的坐标系、基本形状、缩放与替代信息。位图绘制见[Canvas 绘图基础](./04-canvas.md)；图片元素与替代文本的基础见[图片 img](../02-content-elements/05-images.md)。`path` 曲线、滤镜、蒙版、动画、图标构建流程和完整 SVG 规范不在本篇展开。
:::

## 一、SVG 与 HTML 的集成关系

### 1. SVG 是独立的图形语言

SVG 有自己的元素、属性和坐标系，规范由 SVG 工作组维护。它可以单独作为 `.svg` 文件存在，也可以被图片、CSS 或其他文档引用；理解这一点，才能分清“HTML 语法里能写”与“HTML 规范定义”的区别。

### 2. 内联是把 SVG 写进 HTML 文档

把 `<svg>…</svg>` 直接写进 HTML 的 `body`，浏览器会解析其中的 `rect`、`circle` 等元素，并把它们放进当前文档树。源码里不需要额外的 `xmlns` 声明也能在现代 HTML 解析器中工作，但显式写出 `xmlns="http://www.w3.org/2000/svg"` 便于把同一段标记另存为独立文件。

### 3. 内联与 img 引用的文档边界不同

内联 SVG 的形状是当前文档的节点，可以用 `document.querySelector` 找到；用 `<img src="badge.svg">` 引用时，图片内部是独立的文档，外部脚本无法查询其中的形状。两者显示效果可以相同，可操作性完全不同。

| 写法 | 图形节点在哪里 | 能否用页面脚本查询形状 | 缩放表现 |
|------|----------------|------------------------|----------|
| 内联 `<svg>` | 当前文档树 | 能 | 矢量，随视口缩放 |
| `<img src="x.svg">` | 图片内部文档 | 不能 | 矢量，按图片尺寸显示 |

## 二、画布、viewBox 与基本形状

### 1. svg 的 width/height 是显示尺寸

`svg` 上的 `width`、`height` 决定元素在页面中的显示尺寸。它们不会改变内部坐标，只是把内部坐标系映射到这块区域。

### 2. viewBox 定义内部坐标系

`viewBox="0 0 200 120"` 声明内部坐标从 `(0,0)` 开始，宽 200、高 120。之后所有形状坐标都按这个坐标系书写，浏览器再把它映射到显示尺寸；两者比例不同时会等比缩放并居中。

### 3. rect、circle 与 line

`rect` 用 `x`、`y`、`width`、`height` 描述矩形；`circle` 用 `cx`、`cy`、`r` 描述圆心与半径；`line` 用 `x1`、`y1`、`x2`、`y2` 描述两端点。它们都是自闭合元素，不包含文字内容。

### 4. fill 与 stroke 控制外观

`fill` 设置填充颜色，`stroke` 设置描边颜色，`stroke-width` 设置描边宽度。它们可以写在形状上，也可以通过 CSS 设置；没有填充或描边的形状不会显示对应部分。

### 5. 坐标要与 viewBox 对应

形状坐标超出 `viewBox` 范围的部分会被裁掉。本例矩形从 `(20,20)` 到 `(120,100)`，圆在 `(150,60)`、半径 40，横线在 `y=110`，都落在 200×120 的范围内。

## 三、缩放与结构

### 1. 改显示尺寸时 viewBox 等比缩放

元素显示为 400×240 时，200×120 的坐标系被放大 2 倍，矩形显示为 200×160。把 CSS 尺寸改为 200×120 后，矩形显示为 100×80，而 `getBBox()` 读到的内部尺寸仍是 100×80 个用户单位。显示变了，几何定义没变。

### 2. 缺少 viewBox 时只改变视口

删除 `viewBox` 后把显示尺寸改成 100×60，内部坐标不再缩放：矩形仍按 100×80 的用户单位绘制，超出 100×60 视口的下半部分被裁掉。这说明 `viewBox` 负责“映射”，`width`/`height` 负责“窗口大小”，两者不能互相替代。

### 3. 内联节点可以被查询

内联时可以用 `document.querySelector("#badge rect")` 找到矩形，读取或修改 `x`、`fill` 等属性。图形因此可以响应交互、按数据生成或单独设置样式，这一点与普通 HTML 元素一致。

### 4. img 内部无法被页面脚本查询

`img` 元素只暴露图片本身，内部 SVG 的形状不在当前文档树中。需要脚本操作图形时，应选择内联；只需要显示一张矢量图时，`img` 的边界更简单，也便于缓存和复用。

## 四、从空目录创建对照页

### 1. 创建 badge.svg

新建空目录 `html-svg`，先创建可被 `img` 引用的独立文件：

::: details 查看 badge.svg 完整内容

```xml [badge.svg]
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="400" height="240" role="img" aria-labelledby="badge-title badge-desc">
  <title id="badge-title">蓝色矩形与橙色圆的组合图形</title>
  <desc id="badge-desc">左侧是蓝色矩形，右侧是与矩形的右侧相接的橙色圆。</desc>
  <rect x="20" y="20" width="100" height="80" fill="#336699"/>
  <circle cx="150" cy="60" r="40" fill="#e07b39"/>
  <line x1="20" y1="110" x2="180" y2="110" stroke="#33475b" stroke-width="4"/>
</svg>
```

:::

### 2. 创建 inline-svg.html

在同一目录创建页面，把同样的图形内联一份，再用 `img` 引用外部文件：

::: details 查看 inline-svg.html 完整内容

```html [inline-svg.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>内联 SVG 与图片引用</title>
</head>
<body>
  <h1>内联 SVG 与图片引用</h1>
  <p>下方两个图形内容相同：第一个直接写在 HTML 中，第二个由 img 引用外部 SVG 文件。</p>
  <svg id="badge" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120"
       width="400" height="240" role="img"
       aria-labelledby="badge-title badge-desc">
    <title id="badge-title">蓝色矩形与橙色圆的组合图形</title>
    <desc id="badge-desc">左侧是蓝色矩形，右侧是与矩形相接的橙色圆，底部一条深色横线。</desc>
    <rect x="20" y="20" width="100" height="80" fill="#336699"/>
    <circle cx="150" cy="60" r="40" fill="#e07b39"/>
    <line x1="20" y1="110" x2="180" y2="110" stroke="#33475b" stroke-width="4"/>
  </svg>
  <p><img src="badge.svg" alt="蓝色矩形与橙色圆的组合图形" width="400" height="240"></p>
</body>
</html>
```

:::

### 3. 打开页面并核对结构

直接双击 `inline-svg.html` 即可显示两个相同图形。在 Console 中查询内联图形：

```js
const badge = document.getElementById("badge");
badge.querySelector("rect").getAttribute("fill");
badge.querySelector("rect").getBBox();
badge.getAttribute("viewBox");
```

本次读到矩形填充为 `#336699`，`getBBox()` 为 `x=20`、`y=20`、宽 `100`、高 `80`，`viewBox` 为 `0 0 200 120`。用同样的选择器查 `img` 内部形状则得不到节点，因为图片内容是独立文档。

### 4. 观察缩放与裁切

把内联 `svg` 的 CSS 宽度改为 `200px`、高度改为 `120px`，图形整体缩小，矩形显示为 100×80，`getBBox()` 不变。再删除 `viewBox` 并把尺寸改为 100×60，矩形仍按 100×80 绘制，下半部分超出视口被裁掉。

| 观察项 | 表达式或操作 | 本次结果 |
|--------|--------------|----------|
| 内部坐标 | `viewBox` | `0 0 200 120` |
| 矩形几何 | `rect.getBBox()` | `x=20`、`y=20`、`100×80` |
| 显示尺寸 | `svg` 的 `width`/`height` | 400×240，矩形显示 200×160 |
| CSS 缩小 | 改为 200×120 | 矩形显示 100×80，`getBBox()` 不变 |
| 删除 viewBox | 改为 100×60 | 矩形不缩放，超出部分被裁切 |
| img 内部 | 查询 `img` 内形状 | 无法取得，内部为独立文档 |

## 五、图形名称、替代信息与技术选择

### 1. title 与 desc 提供名称和说明

`title` 给出图形的简短名称，`desc` 补充细节；它们应当是 `svg` 的第一个子元素。内联时，`role="img"` 加 `aria-labelledby` 可以把两者组合成可访问名称；独立文件被 `img` 引用时，页面上的 `alt` 才是最终名称。

### 2. 名称不能替代正文说明

图形承载关键信息时，正文仍应能独立说明它表达什么，例如“左侧蓝色矩形，右侧橙色圆”。只依赖图形内部文字或颜色，会让无法看到图形的读者失去信息。

### 3. Canvas 与 SVG 的选择

需要保留节点、可查询可修改、缩放不失真时，优先考虑 SVG；需要大量像素绘制、逐帧重绘或像素级处理时，Canvas 更合适。两者可以同时出现在一个页面中，选择依据是图形的用途，而不是“哪个更现代”。

| 需求 | 内联 SVG | Canvas |
|------|----------|--------|
| 节点可查询、可修改 | 是 | 否，只有像素 |
| 缩放不失真 | 是 | 放大会模糊 |
| 大量像素逐帧绘制 | 不适合 | 适合 |
| 脚本生成简单图形 | 可以 | 需要绘制代码 |

### 4. 验证记录

以上两个文件于 2026-11-14 在 macOS 的 Chrome 157.0.8103.79 中核对。内联 `svg` 的 `viewBox`、矩形 `getBBox()`、400×240 显示下矩形的 200×160 显示尺寸、CSS 缩小后的缩放关系，以及删除 `viewBox` 后不缩放并被裁切，均按上表实际读取；页面脚本能查到内联矩形，`img` 内部形状不可查询；可访问名称由 `title` 与 `desc` 组合，`img` 使用 `alt`。

`inline-svg.html` 经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告；`badge.svg` 以 SVG 模式检查同样无错误、无警告。本次未验证其他浏览器、复杂路径、滤镜、动画、外部样式表对 SVG 的影响，也没有测试屏幕阅读器的实际朗读。
