---
title: "CSS 元素、盒子与 display"
tags:
  - CSS
  - 布局
  - display
excerpt: "介绍视觉格式化模型中的元素树、盒子树、主盒与匿名盒，区分 display 的外部和内部类型，并比较 block、inline、flex、grid、none 与 contents 的布局结果。"
---

# CSS 元素、盒子与 display

**视觉格式化模型**描述浏览器怎样把文档中的元素转换成盒子，再根据盒子类型、尺寸、定位方式和环境条件安排布局。

**元素**是文档结构中的对象，**盒子**是参与布局和呈现的对象。两者不是一一对应：元素可以不生成盒子，也可以生成多个盒子；浏览器还会生成没有对应 HTML 元素的匿名盒。

## 一、元素怎样生成盒子

### 1. 主盒与匿名盒

元素通常会生成一个**主盒**，用于承载其内容、内边距、边框等。行内元素跨行时会产生多个片段，因此不能总用一个矩形代表它的全部呈现。

当布局规则需要包装直接文本时，浏览器可生成**匿名盒**。下面是局部 HTML，省略文档外壳：

```html
<div class="toolbar">
  操作：
  <button>保存</button>
</div>
```

若 `.toolbar` 使用 `display: flex`，直属文本“操作：”会被包装为匿名 Flex 项目，按钮是另一个 Flex 项目。空白文本通常不会产生可见项目。

对应关系可以简化表示为：

```text
toolbar 的 Flex 容器盒
├─ 匿名 Flex 项目：“操作：”
└─ button 的 Flex 项目盒
```

匿名项目没有可直接匹配的 HTML 元素。如果需要单独控制这段文字的尺寸和样式，应在 HTML 中明确用 `<span>` 包裹。

### 2. DOM 顺序与盒子组织

浏览器可能为表格补齐匿名的行或单元格盒，也可能把直接文本包成匿名块，以满足布局规则。这些补齐不会在 DOM 中新增同名元素。

::: info 盒子树不能替代 DOM 树
脚本查找的是元素；布局面板观察的是生成的盒子与布局项目。遇到无法直接选中或样式无法单独控制的布局对象，要先检查它是否为匿名盒。
:::

## 二、display 的外部与内部类型

`display` 同时影响两个方向：

1. **外部类型**：当前盒子如何与周围盒子一起排列，例如块级或行内级。
2. **内部类型**：它如何安排自己的子内容，例如常规流、Flexbox 或 Grid。

| 常用写法 | 外部类型 | 内部规则 |
|----------|----------|----------|
| `block` | 块级 | 常规流 |
| `inline` | 行内级 | 常规流 |
| `inline-block` | 行内级 | 独立流布局，即 `inline flow-root` |
| `flow-root` | 块级 | 独立流布局 |
| `flex` / `inline-flex` | 块级 / 行内级 | Flexbox |
| `grid` / `inline-grid` | 块级 / 行内级 | Grid |

例如 `display: flex` 不表示容器本身会排成一行；它通常作为块级盒子参与外部排列，**直属子内容**才按 Flex 规则布局。`inline-flex` 改变的是容器在外部的参与方式。

下面是局部样式，假设页面有两个 `.toolbar`：

```css
.toolbar { display: flex; gap: 8px; }
.toolbar.compact { display: inline-flex; }
```

普通工具栏通常独占一个块级位置；带 `compact` 的工具栏可以作为行内级盒子，与周围文字或其他行内级盒子同行。

::: warning display 不改变 HTML 语义
把链接设成 `block` 不会使它变成段落，把 `<div>` 设成 `inline` 也不会获得链接的导航行为。HTML 内容规则与 CSS 布局类型分别判断。
:::

## 三、不生成盒子与不可见

### 1. none、contents 与 visibility

| 声明 | 本元素的盒子 | 后代盒子 | 常规布局占位 |
|------|--------------|----------|--------------|
| `display: none` | 不生成 | 不生成 | 不占位 |
| `display: contents` | 普通元素不生成自身主盒 | 通常继续生成 | 子内容继续参与布局 |
| `visibility: hidden` | 仍生成 | 通常仍生成 | 保留占位 |

`contents` 可让子盒直接参与外层 Flex/Grid 布局，但本元素失去主盒后，它自己的背景、边框和内边距不能按原本盒子绘制。对替换元素等特殊对象也不能套用普通容器的行为。

### 2. contents 的使用边界

下面是局部 HTML，省略文档外壳：

```html
<div class="layout">
  <div class="wrapper"><span>甲</span><span>乙</span></div>
</div>
```

对应局部 CSS：

```css
.layout { display: flex; gap: 12px; }
.wrapper { display: contents; background: yellow; }
```

两个 `span` 会成为外层布局中的项目，但黄色背景不再按 `.wrapper` 的盒子显示，因为它没有自己的主盒。

::: warning contents 需要同时检查辅助技术
部分浏览器或辅助技术组合对 `display: contents` 的语义处理有差异。不能仅凭视觉正确就用于承担重要语义的控件或结构，应验证无障碍树及实际操作。
:::

这些对象和规则的定义见 [CSS Display](https://www.w3.org/TR/css-display-3/)。排查时先问“有没有盒子”，再问“参与哪种外部布局、建立哪种内部布局”，最后才计算尺寸。
