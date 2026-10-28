---
title: "CSS Grid 布局"
tags:
  - CSS
  - Grid
  - 布局
excerpt: "介绍网格轨道、网格线、区域和自动放置，区分显式与隐式网格，解释 fr、minmax、repeat 和自动适配，并用长文本与子网格说明尺寸约束和共享对齐。"
---

# CSS Grid 布局

**Grid**通过行与列共同安排项目。设置 `display: grid` 的元素成为**网格容器**，其直属子盒成为**网格项目**。

**轨道**是两条相邻网格线之间的行或列，**单元格**是行列轨道的交叉区域，**网格区域**可以包含多个相邻单元格。

## 一、定义轨道与放置项目

### 1. 显式与隐式网格

作者通过 `grid-template-columns`、`grid-template-rows` 等定义的结构叫**显式网格**。项目超出已有结构时，浏览器可创建**隐式轨道**，由 `grid-auto-columns`、`grid-auto-rows` 等控制尺寸。

以下局部 HTML 有三个项目，省略文档外壳：

```html
<div class="layout">
  <div>甲</div><div>乙</div><div>丙</div>
</div>
```

对应局部 CSS：

```css
.layout {
  display: grid;
  grid-template-columns: 120px 1fr;
  grid-auto-rows: minmax(60px, auto);
  gap: 12px;
}
```

前两项进入第一行，第三项进入第二行的第一列。这里定义了两列，行由自动放置产生；额外内容并不会因为没有手写第三个位置就被忽略。

### 2. 网格线与命名区域

项目可通过网格线放置，例如 `grid-column: 1 / 3` 跨越两列，结束线不属于占用区域。`1 / -1` 从第一条线到最后一条**显式**网格线，不保证覆盖以后生成的所有隐式列。

以下是局部布局规则，假设三个项目使用相应类名：

```css
.layout {
  grid-template-areas: "header header" "nav main";
}
.header { grid-area: header; }
.nav { grid-area: nav; }
.main { grid-area: main; }
```

命名区域必须形成矩形，各行的单元数量一致。不能用同一名称在不相邻的位置拼出不规则区域。

::: warning 放置顺序不改变语义顺序
手动定位和 `grid-auto-flow: dense` 可改变视觉位置，但不会保证同步改变键盘或读屏顺序。内容顺序应先在 HTML 中安排正确。
:::

## 二、轨道尺寸怎样计算

### 1. fr 与最小约束

`fr` 表示可用剩余空间的份额，需先考虑固定轨道、间隔和内容约束。它不是容器完整宽度的直接百分比。

| 写法 | 含义 |
|------|------|
| `120px 1fr` | 固定一列，其余空间给另一列 |
| `1fr 2fr` | 在相应约束满足后按份额分配 |
| `minmax(0, 1fr)` | 将轨道最小值显式设为零 |
| `minmax(12rem, 1fr)` | 最小为 `12rem`，上限参与份额分配 |

单独的 `1fr` 含有自动最小约束，长内容可能撑开轨道。需要允许收缩时，`minmax(0, 1fr)` 更明确，同时还要处理项目自己的最小尺寸和文本断行。

以下是局部样式，假设网格项目内有长文本：

```css
.layout { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.layout > * { min-width: 0; overflow-wrap: anywhere; }
```

两列可以利用受限空间，文本允许在必要位置断行。若项目内还有固定宽度图片，仍需检查图片约束，不能认为这一组声明解决了全部溢出。

### 2. repeat、auto-fill 与 auto-fit

`repeat()` 重复轨道定义。以下是局部自适应列表规则：

```css
.list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
```

容器尽量放入更多不小于 `180px` 的列。`auto-fill` 保留可容纳的空轨道；`auto-fit` 会在放置后折叠空轨道，让有内容的轨道利用更多空间。项目很多时，两者可能看起来一样。

::: warning 最小列宽仍可能超过容器
容器比 `180px` 还窄时，上述规则仍可能溢出。需要更窄的回退时可使用 `minmax(min(100%, 180px), 1fr)`，并验证目标浏览器及文本边界。
:::

## 三、对齐与子网格

### 1. 项目对齐与轨道对齐

`justify-items` 与 `align-items` 控制项目在区域内部的对齐；`justify-content` 与 `align-content` 控制整组轨道在容器剩余空间中的对齐。

默认拉伸也有条件，带固有比例的对象等不能总按普通元素判断。先分清“项目相对区域”与“轨道相对容器”，再选择属性。

### 2. subgrid 共享轨道

**子网格**（subgrid）让作为网格项目的内部容器，在选定轴上采用父网格的轨道。它适合让不同包装元素内部的字段继续共享对齐线。

以下是局部样式，假设 `.row` 是两列父网格中的项目，内部还有两个直属字段：

```css
.table { display: grid; grid-template-columns: 8rem 1fr; }
.row {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: subgrid;
}
```

`.row` 跨两列后，其内部字段继承这两列的轨道关系。普通嵌套 Grid 各自计算列宽，不会自动共享；不支持 subgrid 的环境需要独立轨道等回退。定义与限制见 [CSS Grid Level 2](https://www.w3.org/TR/css-grid-2/#subgrids)。

## 四、网格异常的检查顺序

1. 目标是否为直属网格项目，还是藏在普通包装元素中。
2. 额外轨道是否由自动放置或手写网格线产生。
3. `fr` 轨道是否受内容最小尺寸限制。
4. 当前设置的是项目对齐还是轨道对齐。

显式轨道、隐式轨道和自动放置的规则见 [CSS Grid Layout](https://www.w3.org/TR/css-grid-1/)。
