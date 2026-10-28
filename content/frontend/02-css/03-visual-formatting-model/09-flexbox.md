---
title: "CSS Flexbox 布局"
tags:
  - CSS
  - Flexbox
  - 布局
excerpt: "介绍 Flex 容器、项目和轴方向，解释换行、间距、对齐与自动外边距，按基础尺寸、增长和收缩分析空间分配，并处理长文本最小尺寸与视觉顺序边界。"
---

# CSS Flexbox 布局

**Flexbox**是主要沿一个方向排列和分配空间的布局方式。设置 `display: flex` 的元素成为**Flex 容器**，其直属子盒成为**Flex 项目**。

它适合操作栏、导航、横向信息行等一维关系。项目可以换行，但各行独立分配空间，不会自动像 Grid 一样共享列轨道。

## 一、容器、项目与轴

### 1. 主轴与交叉轴

**主轴**由 `flex-direction` 决定，**交叉轴**与主轴垂直。`row` 沿行内方向，`column` 沿块方向；`*-reverse` 反转排列起止方向，不修改 DOM 顺序。

在常见水平 LTR 页面上，`row` 通常是从左到右，`column` 是从上到下；RTL 或竖排时不能机械照搬物理方向。

以下是局部 HTML，省略文档外壳：

```html
<div class="toolbar">
  <span class="title">页面操作</span>
  <button>取消</button>
  <button>保存</button>
</div>
```

对应局部 CSS：

```css
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.title { margin-inline-end: auto; }
```

标题的自动外边距吸收主轴剩余空间，把按钮推向另一端；`align-items` 控制交叉轴对齐，`gap` 提供项目间隔。

### 2. 换行与对齐

| 属性 | 负责的关系 |
|------|------------|
| `flex-wrap` | 是否允许形成多条 Flex 行 |
| `justify-content` | 主轴剩余空间怎样分配 |
| `align-items` / `align-self` | 一行内项目的交叉轴对齐 |
| `align-content` | 多条行在交叉轴空间内怎样分配 |
| `gap` | 项目或行之间的固定间隔 |

`nowrap` 是默认值。设置项目宽度并不保证它们保持原宽，因为默认收缩因子允许收缩；也不会自动换行，换行需另行启用。

::: warning 对齐要先确定轴与剩余空间
`justify-content: center` 控制主轴，并非固定表示水平居中。没有可分配空间时，对齐属性也不会产生想象中的位移。
:::

## 二、项目怎样分配空间

### 1. basis、grow 与 shrink

`flex` 是三个子属性的简写：

| 子属性 | 作用 |
|--------|------|
| `flex-basis` | 主轴基础尺寸的起点 |
| `flex-grow` | 正剩余空间的增长因子 |
| `flex-shrink` | 负剩余空间的收缩因子 |

基础尺寸不是最终尺寸，还要考虑可用空间、最小最大限制和内容要求。下面是局部样式，两个项目没有边框、内边距、外边距与间隔：

```css
.row { display: flex; width: 300px; }
.a { flex: 1 1 100px; min-width: 0; }
.b { flex: 2 1 100px; min-width: 0; }
```

两个基础尺寸合计 `200px`，剩余 `100px` 按增长因子 `1:2` 分配，最终约为 `133.33px` 与 `166.67px`。它们不是总宽度的 `1/3` 和 `2/3`。

### 2. 收缩按缩放因子计算

收缩通常按“收缩因子 × 基础尺寸”的比例分担空间。以下局部规则用于另一个没有装饰和间隔的容器：

```css
.row { display: flex; width: 240px; }
.a { flex: 0 1 200px; min-width: 0; }
.b { flex: 0 1 100px; min-width: 0; }
```

需要收缩 `60px`，两项的缩放收缩因子为 `200:100`，分别减少 `40px` 与 `20px`，得到 `160px` 与 `80px`。若某项碰到最小或最大限制，算法还会冻结该项并重新分配，不能继续套单次比例。

## 三、自动最小尺寸与长文本

Flex 项目主轴上的自动最小尺寸，在常见非滚动条件下可能由内容最小尺寸决定。长网址或不可断开的文本因此可能让项目不再收缩。

以下是局部样式，假设 `.text` 是横向 Flex 项目：

```css
.text {
  flex: 1 1 0;
  min-width: 0;
  overflow-wrap: anywhere;
}
.actions { flex: 0 0 auto; }
```

`min-width: 0` 允许文本项目缩到内容固有下限以下；`overflow-wrap` 决定文本怎样断行。两条声明解决不同问题，只写其中一条不一定足够。

列方向布局中，常见的对应问题是 `min-height: 0`：需要内部区域收缩并滚动时，应检查其块方向最小约束及父级高度。

::: tip 收缩与截断分别设置
让盒子能缩小，先检查 `min-width`；让文字能换行或显示省略号，再设置相应文本规则。不要仅靠 `overflow: hidden` 掩盖布局原因。
:::

## 四、顺序与适用边界

`order` 和反向排列可以改变视觉次序，但通常不会同步改变键盘 Tab 顺序和辅助技术阅读顺序。重要操作的 HTML 顺序应直接符合逻辑，不应靠 CSS 做语义排序。

选择 Flexbox 时可以依次判断：

1. 项目是否主要沿一条轴排列。
2. 哪些项目保持内容尺寸，哪些吸收剩余空间。
3. 空间不足时允许收缩、换行还是溢出滚动。
4. 长文本、放大文字和键盘顺序是否仍然可用。

空间分配的正式规则见 [CSS Flexible Box Layout](https://www.w3.org/TR/css-flexbox-1/)。
