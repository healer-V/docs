---
title: "CSS 盒模型与尺寸"
tags:
  - CSS
  - 盒模型
  - 布局
excerpt: "解释内容、内边距、边框和外边距四个区域，比较 content-box 与 border-box 的尺寸计算，并介绍最小最大约束、内容尺寸、固有尺寸和宽高比的作用边界。"
---

# CSS 盒模型与尺寸

**盒模型**把一个盒子分成内容、内边距、边框和外边距四个区域。`width`、`height` 约束哪一层由 `box-sizing` 决定；测量尺寸时必须先明确测量对象。

## 一、四个区域与尺寸计算

### 1. 每个区域负责什么

| 从内到外 | 属性 | 作用 |
|----------|------|------|
| 内容框 | `width`、`height` 等 | 文本或子内容使用的区域 |
| 内边距 | `padding` | 内容与边框之间的间隔 |
| 边框 | `border` | 包围内边距区域的边缘 |
| 外边距 | `margin` | 与周围盒子的间隔，不属于边框框 |

没有变换时，`getBoundingClientRect()` 通常测量边框框，不包含外边距。外边距还可能折叠，因此“盒子占用的外部空间”不能在所有布局中简单相加。

### 2. content-box 与 border-box

下面是局部 CSS，假设页面包含普通块级 `.box`：

```css
.box {
  width: 200px;
  padding: 12px;
  border: 2px solid;
  box-sizing: content-box;
}
```

`content-box` 使 `width` 指定内容框宽度，边框框宽度为 `200 + 12 × 2 + 2 × 2 = 228px`。

改为 `border-box` 后，`200px` 包含内边距和边框，内容框宽度为 `172px`。外边距始终不包含在 `width` 中。

::: tip 统一 border-box 可减少尺寸累加
页面基础样式常设置 `*, *::before, *::after { box-sizing: border-box; }`。这是标准盒尺寸规则，与省略 DOCTYPE 导致的浏览器怪异模式不是同一件事。
:::

内容框不能成为负尺寸。若边框和内边距已超过指定边框框宽度，内容框降到零，盒子的外部尺寸仍可能超过写出的 `width`。

## 二、自动尺寸与最小最大约束

### 1. auto 依赖布局

在普通块级布局中，没有水平外边距约束的块，`width: auto` 通常利用可用宽度，扣除自己的水平内边距和边框；`width: 100%` 则直接指定百分比宽度，可能再叠加装饰而溢出。

`height: auto` 通常随内容增长。为正文固定高度会在文字变长或放大后产生溢出，宜先考虑自然高度与 `min-height`。

### 2. min 与 max

`min-width` 和 `max-width` 分别建立下限与上限。以下是局部样式，用于普通容器：

```css
.panel {
  width: 100%;
  max-width: 640px;
  min-height: 120px;
}
```

容器尽量使用可用宽度但不超过 `640px`；高度至少为 `120px`，内容多时可以继续增长。若最小约束大于最大约束，最小约束优先，不能把相互矛盾的约束当成自动求平均。

::: warning 指定宽度不一定是最终宽度
最小最大尺寸、内容要求和 Flex/Grid 空间分配都可能改变结果。尺寸异常时，应同时检查约束，而不是只查 `width`。
:::

## 三、内容尺寸与固有尺寸

### 1. min-content、max-content 与 fit-content

**内容尺寸**来自内容本身对空间的需要，不只来自作者写出的数值：

| 值 | 含义 | 典型表现 |
|----|------|----------|
| `min-content` | 尽量在允许位置断行后的最小内容尺寸 | 常受最长不可断片段约束 |
| `max-content` | 不进行软换行时需要的内容尺寸 | 长文本可能很宽 |
| `fit-content` | 在内容下限、内容上限与可用空间之间选择 | 尽量适应空间，但仍可能受内容下限限制 |

下面是局部样式，假设 `.label` 包含多个可断行单词：

```css
.label {
  width: fit-content;
  max-width: 100%;
  overflow-wrap: anywhere;
}
```

短标签可按内容收紧，长标签受可用宽度约束并允许长片段断行。`max-width: 100%` 不会自动解决所有后代溢出，还需检查断行和子盒规则。

### 2. 图片与 aspect-ratio

图片等替换元素可能具有**固有尺寸**和固有宽高比。`aspect-ratio` 为盒子提供首选比例，但通常需要至少一个维度自动计算，两个维度都固定时不会强行改写它们。

下面是局部样式，假设 HTML 已提供可加载图片和有意义的 `alt`：

```css
img { max-width: 100%; height: auto; }
.preview {
  width: 240px;
  aspect-ratio: 4 / 3;
  background: #e5e7eb;
}
```

在没有其他约束和内容撑高的情况下，`.preview` 高度为 `180px`。如果需要把图片裁进这个比例，还需组合尺寸与 `object-fit`，而不是认为比例会自动裁剪内容。

## 四、读样式与量盒子

假设页面已包含第一节的 `content-box` 示例，下面仅展示测量动作：

```js
const box = document.querySelector('.box');
getComputedStyle(box).width;       // "200px"
box.getBoundingClientRect().width; // 228
```

解析宽度与边框框宽度不同，是因为测量对象不同。加入变换后，边界矩形还会反映变换；边框框尺寸与 CSS `width` 的关系需重新判断。

::: info 尺寸检查顺序
1. 确认生成了什么盒子和布局项目。
2. 查 `box-sizing`、内边距、边框及最小最大约束。
3. 找百分比的参考量和内容的最小空间需求。
4. 分清读取的是属性解析值还是盒子几何。
:::

内容尺寸与约束定义见 [CSS Sizing](https://www.w3.org/TR/css-sizing-3/)，盒区域定义见 [CSS Box Model](https://www.w3.org/TR/css-box-3/)。
