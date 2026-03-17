---
title: "CSS3 边框、阴影与圆角"
category: "前端 · CSS"
tags:
  - CSS3
  - border-radius
  - box-shadow
  - border-image
date: 2026-03-17
---

# CSS3 边框、阴影与圆角

CSS3 在边框和阴影方面引入了大量新特性，彻底告别了过去需要切图才能实现圆角、阴影的时代。本文系统介绍 `border-radius`、`box-shadow`、`text-shadow`、`border-image` 以及 `outline` 与 `border` 的区别。

## 一、border-radius 圆角

### 1. 基本用法

`border-radius` 用于设置元素的圆角，接受长度值或百分比。

| 写法 | 说明 |
|------|------|
| `border-radius: 8px` | 四角统一设置 |
| `border-radius: 8px 16px` | 左上/右下、右上/左下 |
| `border-radius: 8px 16px 24px` | 左上、右上/左下、右下 |
| `border-radius: 8px 16px 24px 32px` | 左上、右上、右下、左下（顺时针） |

::: details 基本圆角示例

```css{3,8,13}
/* 统一圆角 */
.card {
  border-radius: 12px;
}

/* 胶囊按钮 */
.pill-btn {
  border-radius: 9999px;
}

/* 圆形头像 */
.avatar {
  border-radius: 50%;
  width: 80px;
  height: 80px;
}
```

:::

### 2. 椭圆角

每个角可以独立设置水平半径和垂直半径，用 `/` 分隔。

```
border-radius: 水平半径 / 垂直半径
```

::: details 椭圆角示例

```css{2,7,12}
/* 整体椭圆 */
.ellipse {
  border-radius: 50% / 30%;
  width: 200px;
  height: 100px;
}

/* 上半圆 */
.half-circle-top {
  border-radius: 100px 100px 0 0 / 60px 60px 0 0;
  width: 200px;
  height: 60px;
}

/* 树叶形 */
.leaf {
  border-radius: 0 50% 0 50%;
  width: 100px;
  height: 100px;
}
```

:::

### 3. 百分比用法

百分比相对于元素自身的宽高计算，水平方向基于宽度，垂直方向基于高度。

::: tip 正圆的条件
元素必须是正方形（宽 = 高），设置 `border-radius: 50%` 才能得到正圆。若宽高不等，`50%` 会产生椭圆。
:::

### 4. 各角单独设置

每个角可以通过独立属性控制：

| 属性 | 对应位置 |
|------|----------|
| `border-top-left-radius` | 左上角 |
| `border-top-right-radius` | 右上角 |
| `border-bottom-right-radius` | 右下角 |
| `border-bottom-left-radius` | 左下角 |

::: details 对话气泡示例

```css{4-7}
/* 右下角为直角的气泡 */
.bubble-right {
  border-radius: 12px;
  border-bottom-right-radius: 0;
  background: #4a90e2;
  padding: 12px 16px;
  color: #fff;
}
```

:::

## 二、box-shadow 盒阴影

### 1. 参数说明

```
box-shadow: [inset] offset-x offset-y [blur] [spread] [color];
```

| 参数 | 说明 |
|------|------|
| `inset` | 可选，改为内阴影 |
| `offset-x` | 水平偏移，正值向右 |
| `offset-y` | 垂直偏移，正值向下 |
| `blur` | 模糊半径，默认 0（锐利边缘） |
| `spread` | 扩散半径，正值放大，负值收缩 |
| `color` | 阴影颜色，默认继承 `color` |

### 2. 常用阴影效果

::: details 常用阴影代码示例

```css{3,9,15,21}
/* 轻柔投影 */
.card-light {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 中等卡片阴影 */
.card-medium {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

/* 悬浮效果 */
.card-elevated {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
}

/* 内阴影（输入框焦点态） */
.input-focus {
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
}

/* 扩散阴影（边框替代） */
.outline-shadow {
  box-shadow: 0 0 0 2px #4a90e2;
}
```

:::

### 3. 多重阴影

多个阴影用逗号分隔，先声明的层级更高（在上方）。

::: details 多重阴影示例

```css{3-6}
/* 立体感卡片：近处柔和 + 远处扩散 */
.card-3d {
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 16px 40px rgba(0, 0, 0, 0.04);
}

/* 彩色多重阴影 */
.colorful-shadow {
  box-shadow:
    4px 4px 0 #ff6b6b,
    8px 8px 0 #ffd93d,
    12px 12px 0 #6bcb77;
}
```

:::

### 4. 实用案例

::: details 悬停卡片交互效果

```css
/* 卡片默认状态 */
.card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

/* 悬停状态：阴影增大，卡片上浮 */
.card:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.16);
  transform: translateY(-4px);
}
```

:::

::: warning 性能注意
`box-shadow` 会触发重绘（repaint），频繁动画时建议用 `filter: drop-shadow()` 替代，或配合 `will-change: box-shadow` 提升性能。
:::

## 三、text-shadow 文字阴影

### 1. 参数说明

```
text-shadow: offset-x offset-y [blur] [color];
```

`text-shadow` 没有 `inset` 和 `spread` 参数，语法比 `box-shadow` 更简洁。

| 参数 | 说明 |
|------|------|
| `offset-x` | 水平偏移 |
| `offset-y` | 垂直偏移 |
| `blur` | 模糊半径，可选 |
| `color` | 阴影颜色，可选 |

### 2. 多重阴影

::: details 文字阴影效果示例

```css{3,9,17}
/* 轻微文字阴影 */
.text-subtle {
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

/* 发光文字 */
.text-glow {
  color: #fff;
  text-shadow:
    0 0 8px #4a90e2,
    0 0 20px #4a90e2,
    0 0 40px #4a90e2;
}

/* 立体文字 */
.text-3d {
  color: #fff;
  text-shadow:
    1px 1px 0 #999,
    2px 2px 0 #888,
    3px 3px 0 #777,
    4px 4px 4px rgba(0, 0, 0, 0.3);
}
```

:::

## 四、border-image 边框图片

### 1. 子属性说明

| 子属性 | 说明 |
|--------|------|
| `border-image-source` | 图片路径或渐变 |
| `border-image-slice` | 切割位置（上右下左） |
| `border-image-width` | 边框图片显示宽度 |
| `border-image-outset` | 向外扩展的距离 |
| `border-image-repeat` | 重复方式：`stretch`/`repeat`/`round`/`space` |

### 2. 简写语法

```
border-image: source slice / width / outset repeat;
```

::: details border-image 示例

```css{3-8,14-16}
/* 使用图片作为边框 */
.decorated-box {
  border: 20px solid transparent;
  border-image-source: url('/images/border-tile.png');
  border-image-slice: 20;
  border-image-width: 20px;
  border-image-repeat: round;
}

/* 使用渐变作为边框（常用技巧） */
.gradient-border {
  border: 3px solid transparent;
  background-clip: padding-box;
  border-image: linear-gradient(135deg, #667eea, #764ba2) 1;
}
```

:::

::: tip 渐变边框更简单的实现
对于渐变边框，通常用 `background` + `background-clip` 的方案可读性更高：

```css
.gradient-border-alt {
  background:
    linear-gradient(white, white) padding-box,
    linear-gradient(135deg, #667eea, #764ba2) border-box;
  border: 3px solid transparent;
}
```

:::

## 五、outline 与 border 的区别

### 1. 核心差异对比

| 特性 | `border` | `outline` |
|------|----------|-----------|
| 占据空间 | 是，影响盒模型 | 否，不占据布局空间 |
| 圆角支持 | 支持 `border-radius` | 部分浏览器支持 `outline-radius` |
| 位置 | 在 padding 外、margin 内 | 在 border 外侧 |
| 可单独设置各边 | 是 | 否，四边统一 |
| 主要用途 | 装饰、布局 | 焦点指示（无障碍） |
| 动画 | 支持 transition | 支持 transition |

### 2. 使用建议

::: warning 不要随意禁用 outline
`outline` 是浏览器默认的焦点指示器，对键盘导航和无障碍访问非常重要。不要使用 `outline: none` 消除焦点样式，除非你提供了替代的焦点指示方案。
:::

::: details outline 焦点样式替代方案

```css{5-8}
/* 错误做法：直接移除 */
.btn:focus {
  outline: none; /* 不推荐 */
}

/* 正确做法：自定义焦点样式 */
.btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.5);
}
```

:::
