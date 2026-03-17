---
title: "CSS2 与 CSS3 全面对比"
category: "前端 · CSS"
tags:
  - CSS
  - CSS3
  - 对比
  - 新特性
date: 2026-03-17
---

# CSS2 与 CSS3 全面对比

CSS3 并非 CSS2 的简单升级，而是一次系统性的扩展。CSS3 以模块化方式推进，在选择器、布局、视觉效果、动画、字体等多个维度带来了革命性的改变。本文全面梳理两者的核心差异，帮助你建立系统性认知。

## 一、选择器增强

### 1. CSS2 选择器回顾

CSS2 支持基础选择器：标签、类、ID、后代、子代、相邻兄弟、属性选择器（有限）、伪类（`:hover`、`:focus`、`:active`、`:visited`、`:first-child`）。

### 2. CSS3 新增选择器

| 类型 | CSS3 新增示例 | 说明 |
|------|--------------|------|
| 属性选择器 | `[attr^="val"]` | 属性值以 val 开头 |
| 属性选择器 | `[attr$="val"]` | 属性值以 val 结尾 |
| 属性选择器 | `[attr*="val"]` | 属性值包含 val |
| 结构伪类 | `:nth-child(n)` | 第 n 个子元素 |
| 结构伪类 | `:nth-of-type(n)` | 同类型第 n 个 |
| 结构伪类 | `:last-child` | 最后一个子元素 |
| 结构伪类 | `:only-child` | 唯一子元素 |
| 结构伪类 | `:not(selector)` | 否定伪类 |
| UI 状态伪类 | `:checked` | 已勾选的表单元素 |
| UI 状态伪类 | `:disabled` | 禁用的表单元素 |
| UI 状态伪类 | `:placeholder-shown` | 占位符可见时 |
| 伪元素 | `::before` / `::after` | 双冒号写法（规范化） |
| 伪元素 | `::selection` | 用户选中的文本 |
| 通用兄弟 | `A ~ B` | A 之后的所有兄弟 B |

::: details CSS3 选择器示例

```css{2,8,14,20}
/* 偶数行高亮（表格条纹） */
tr:nth-child(even) {
  background: #f5f7fa;
}

/* 排除最后一个元素的分隔线 */
.list-item:not(:last-child) {
  border-bottom: 1px solid #e4e7ed;
}

/* 链接以 .pdf 结尾时显示图标 */
a[href$=".pdf"]::after {
  content: " 📄";
}

/* 选中文字的样式 */
::selection {
  background: #4a90e2;
  color: #fff;
}
```

:::

## 二、盒模型新增（box-sizing）

CSS2 的盒模型（标准模型）中，`width` 只包含内容区，加上 `padding` 和 `border` 后元素实际宽度会超出预期，给布局计算带来很大困难。

CSS3 引入 `box-sizing` 属性：

| 值 | 说明 |
|----|------|
| `content-box` | 默认，`width` 仅为内容区 |
| `border-box` | `width` 包含 `padding` 和 `border` |

::: tip 现代项目的最佳实践
几乎所有现代项目都会在全局设置 `box-sizing: border-box`：

```css
*, *::before, *::after {
  box-sizing: border-box;
}
```

这让宽度计算变得直观：设置 `width: 200px` 就是元素的实际占位宽度。
:::

## 三、布局方式演进

### 1. CSS2 时代：float 布局

CSS2 没有专门的多列布局方案，开发者不得不借用 `float` 属性实现多列，配合 `clearfix` 清除浮动，存在以下问题：

- 必须手动清除浮动，否则父容器高度塌陷
- 等高列布局极难实现
- 元素垂直居中需要 hack（负 margin、table-cell 等）
- 代码可读性差，维护困难

### 2. CSS3 Flexbox：一维布局

Flexbox 解决了垂直居中、等高列、弹性伸缩等痛点：

::: details Flexbox 核心示例

```css{2-7}
/* 水平垂直居中（CSS2 时代需要多种 hack） */
.center-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 自适应侧边栏布局 */
.layout {
  display: flex;
}
.sidebar {
  flex: 0 0 240px; /* 固定宽度 */
}
.main {
  flex: 1; /* 占据剩余空间 */
}
```

:::

### 3. CSS3 Grid：二维布局

Grid 是真正的二维布局系统，行和列同时控制：

::: details Grid 核心示例

```css{2-5}
/* 12 列栅格系统 */
.grid-container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
}

/* 响应式卡片布局 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
```

:::

| 维度 | float 布局 | Flexbox | Grid |
|------|-----------|---------|------|
| 布局维度 | 一维 | 一维 | 二维 |
| 垂直居中 | 困难 | 简单 | 简单 |
| 等高列 | 困难 | 原生支持 | 原生支持 |
| 间距控制 | 需计算 | `gap` | `gap` |
| 适用场景 | 文字环绕 | 组件内布局 | 页面级布局 |

## 四、视觉效果增强

### 1. 圆角与阴影

| 特性 | CSS2 | CSS3 |
|------|------|------|
| 圆角 | 只能用圆角图片 | `border-radius` 原生支持 |
| 盒阴影 | 只能用图片模拟 | `box-shadow` 原生支持 |
| 文字阴影 | 不支持 | `text-shadow` 原生支持 |

::: details CSS3 视觉效果示例

```css{3,9,15}
/* CSS2 时代需要切 9 宫格图片实现圆角 */
/* CSS3 一行搞定 */
.card { border-radius: 12px; }

/* 多重阴影 */
.elevated-card {
  box-shadow:
    0 1px 3px rgba(0,0,0,0.12),
    0 8px 24px rgba(0,0,0,0.08);
}

/* 文字阴影 */
.heading {
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
```

:::

## 五、渐变

| CSS2 | CSS3 |
|------|------|
| 必须用渐变背景图（GIF/PNG） | 原生 `linear-gradient()`、`radial-gradient()`、`conic-gradient()` |
| 修改颜色需重新导出图片 | 直接在代码中修改，实时预览 |
| 增加 HTTP 请求 | 无额外请求 |

## 六、背景属性增强

| 特性 | CSS2 | CSS3 |
|------|------|------|
| 多背景 | 不支持 | 支持多背景叠加（逗号分隔） |
| 背景尺寸 | 不支持 | `background-size: cover/contain` |
| 背景裁剪 | 不支持 | `background-clip` |
| 背景定位原点 | 固定为 padding-box | `background-origin` 可配置 |

## 七、颜色模式扩展

| CSS2 | CSS3 新增 |
|------|-----------|
| `#hex`、`rgb()` | `rgba()`（含透明通道） |
| 140 个命名颜色 | `hsl()`、`hsla()` |
| - | `color()` 函数（更宽广的色域） |
| - | `oklch()`、`lab()` 等现代颜色空间 |

::: details CSS3 颜色用法示例

```css{2,5,8,11}
/* rgba - 半透明背景 */
.overlay { background: rgba(0, 0, 0, 0.5); }

/* hsl - 直观调整色相/饱和度/亮度 */
.primary { color: hsl(210, 80%, 50%); }

/* 同色系调色板（只改亮度） */
.primary-light { color: hsl(210, 80%, 70%); }
.primary-dark  { color: hsl(210, 80%, 30%); }
```

:::

## 八、变形（transform）

CSS2 中没有任何变形能力，所有元素只能是静态矩形布局。CSS3 的 `transform` 属性带来了完整的 2D 和 3D 变形：

| 函数 | 说明 |
|------|------|
| `translate(x, y)` | 位移 |
| `rotate(angle)` | 旋转 |
| `scale(x, y)` | 缩放 |
| `skew(x, y)` | 倾斜 |
| `matrix(...)` | 矩阵变形 |
| `translateZ` / `rotateX` 等 | 3D 变形 |
| `perspective` | 透视效果 |

::: tip transform 不影响布局流
`transform` 的变形不影响文档流，元素变形后其原始位置的空间仍被保留，这与 `position: relative` 移动的行为一致。
:::

## 九、过渡与动画

CSS2 没有任何动画能力，所有动态效果依赖 JavaScript 操作 style 或使用 Flash/GIF。CSS3 提供了完整的声明式动画方案：

| 特性 | CSS2 | CSS3 |
|------|------|------|
| 状态过渡 | 无，需 JS | `transition` |
| 关键帧动画 | 无，需 JS/Flash | `@keyframes` + `animation` |
| 3D 动画 | 无 | `transform: rotateX/Y` + `perspective` |

::: details CSS3 动画示例

```css{2-4,9-14,18-23}
/* 悬停过渡 */
.btn {
  transition: background 0.3s ease, transform 0.2s ease;
}
.btn:hover {
  background: #357abd;
  transform: translateY(-2px);
}

/* 关键帧动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: fadeInUp 0.5s ease forwards;
}
```

:::

## 十、@font-face 自定义字体

CSS2 时代只能使用用户系统上已安装的字体，导致"网页安全字体"只有寥寥几种。CSS3 的 `@font-face` 允许加载自定义字体文件：

::: details @font-face 使用示例

```css{2-9}
/* 声明自定义字体 */
@font-face {
  font-family: 'MyFont';
  src:
    url('/fonts/myfont.woff2') format('woff2'),
    url('/fonts/myfont.woff') format('woff');
  font-weight: normal;
  font-display: swap; /* 避免字体加载时文字不可见 */
}

/* 使用自定义字体 */
body {
  font-family: 'MyFont', sans-serif;
}
```

:::

## 十一、媒体查询（@media）

CSS2 只有极为有限的媒体类型支持（`print`、`screen`），无法根据屏幕尺寸调整样式，响应式设计完全不存在。CSS3 的媒体查询是响应式设计的基础：

::: details 媒体查询示例

```css{2,9,16}
/* 移动端优先的响应式断点 */
@media (min-width: 768px) {
  .container {
    max-width: 768px;
    padding: 0 32px;
  }
}

@media (min-width: 1200px) {
  .container {
    max-width: 1200px;
  }
}

/* 系统深色模式 */
@media (prefers-color-scheme: dark) {
  :root { --bg: #1a1a2e; }
}

/* 打印样式 */
@media print {
  .no-print { display: none; }
}
```

:::

## 十二、CSS 自定义属性（变量）

CSS2 没有变量概念，所有值需要硬编码，修改主题色需要全局搜索替换。CSS3 自定义属性实现了运行时可修改的变量：

```css
:root {
  --primary: #4a90e2;
}
.btn {
  background: var(--primary);
}
```

详见 [CSS 自定义属性（变量）](./10-css3-variables.md) 章节。

## 十三、滤镜与混合模式

| 特性 | CSS2 | CSS3 |
|------|------|------|
| 图像滤镜 | 不支持（依赖 IE 私有 filter） | 标准 `filter` 属性 |
| 背景模糊 | 不支持 | `backdrop-filter: blur()` |
| 图层混合 | 不支持 | `mix-blend-mode` |
| 背景层混合 | 不支持 | `background-blend-mode` |

## 十四、伪元素写法规范化

CSS2 的伪元素使用单冒号（`:before`、`:after`），CSS3 规范将伪元素统一为双冒号写法（`::before`、`::after`），以区分伪类（单冒号）。

| 类别 | 写法 | 示例 |
|------|------|------|
| 伪类 | 单冒号 `:` | `:hover`、`:focus`、`:nth-child()` |
| 伪元素 | 双冒号 `::` | `::before`、`::after`、`::selection` |

::: tip 向下兼容
浏览器为兼容旧代码，通常同时支持 `:before` 和 `::before`。新代码应统一使用双冒号写法。
:::

## 十五、浏览器前缀问题

CSS3 新特性在标准化过程中，各浏览器厂商使用私有前缀实现实验性功能：

| 前缀 | 浏览器 |
|------|--------|
| `-webkit-` | Chrome、Safari、新版 Edge |
| `-moz-` | Firefox |
| `-ms-` | IE、旧版 Edge |
| `-o-` | 旧版 Opera |

::: warning 前缀现状
大多数 CSS3 特性在现代浏览器中已无需前缀。但以下特性仍需注意：
- `backdrop-filter`：仍需 `-webkit-backdrop-filter`
- `background-clip: text`：仍需 `-webkit-background-clip`
- `-webkit-text-fill-color`：用于渐变文字

建议使用 [Autoprefixer](https://autoprefixer.github.io/) 自动添加所需前缀，无需手动维护。
:::

## 十六、总览对比表

| 特性维度 | CSS2 | CSS3 |
|----------|------|------|
| 选择器 | 基础 7 类 | 新增属性、结构、UI 状态伪类等 |
| 盒模型 | 仅 `content-box` | 新增 `box-sizing: border-box` |
| 布局 | float + table | Flexbox、Grid |
| 圆角 | 图片模拟 | `border-radius` |
| 阴影 | 图片模拟 | `box-shadow`、`text-shadow` |
| 渐变 | 图片 | `linear/radial/conic-gradient` |
| 多背景 | 不支持 | 支持 |
| 颜色 | hex、rgb、命名色 | rgba、hsl、hsla、oklch |
| 变形 | 不支持 | `transform` 2D/3D |
| 过渡 | 不支持 | `transition` |
| 动画 | 不支持 | `@keyframes` + `animation` |
| 自定义字体 | 不支持 | `@font-face` |
| 媒体查询 | 仅媒体类型 | 完整媒体特性查询 |
| 变量 | 不支持 | CSS 自定义属性 |
| 滤镜 | 不支持 | `filter`、`backdrop-filter` |
| 混合模式 | 不支持 | `mix-blend-mode` |
| 伪元素写法 | `:before` | `::before`（规范双冒号） |
