---
title: "CSS 溢出与滚动"
tags:
  - CSS
  - overflow
  - 滚动
excerpt: "介绍可见溢出、裁剪与滚动容器，比较 visible、hidden、clip、auto 和 scroll，说明轴组合的计算变化、滚动范围测量及对 sticky 和键盘可达性的影响。"
---

# CSS 溢出与滚动

**溢出**是内容或装饰超出盒子相应边界的现象。`overflow` 决定超出部分如何显示、是否裁剪以及能否滚动，但不会自动使内容缩短或让它适合原尺寸。

**滚动容器**提供一个可查看部分内容的区域，内容可以在可滚动范围内移动。出现滚动条只是可能的界面表现，不是判断滚动容器的唯一证据。

## 一、overflow 的取值

| 值 | 超出内容 | 滚动行为 |
|----|----------|----------|
| `visible` | 通常继续绘制到边界外 | 本盒子不因这个值建立滚动容器 |
| `hidden` | 裁剪 | 无常规滚动条，仍可程序滚动及因焦点变化滚动 |
| `clip` | 按裁剪边界裁剪 | 不建立滚动容器，不支持程序滚动 |
| `auto` | 按需要裁剪并滚动 | 有溢出时通常显示滚动条 |
| `scroll` | 按滚动容器处理 | 通常保留滚动条机制，实际外观受系统影响 |

`hidden` 和 `clip` 的区别会影响脚本、锚点与 sticky；不能只因为视觉上都被裁掉，就认为它们行为相同。定义见 [CSS Overflow](https://www.w3.org/TR/css-overflow-3/)。

::: warning 滚动条不负责创造有限高度
普通块级盒子若高度随内容增长，设置 `overflow-y: auto` 可能没有需要滚动的溢出。先建立合适的高度或最大高度约束，再判断滚动行为。
:::

## 二、两个轴不能完全独立判断

`overflow-x` 与 `overflow-y` 可以分别设置，但计算值会相互影响：如果一个轴不是 `visible` 或 `clip`，另一个轴的 `visible` 会计算为 `auto`，`clip` 会计算为 `hidden`。

下面是局部声明，不会简单得到“横向裁剪，纵向无限可见”：

```css
.panel {
  overflow-x: hidden;
  overflow-y: visible;
}
```

这里的纵向计算值会成为 `auto`。开发者工具中写出的声明与 Computed 面板中的值不同，正是轴组合规则的结果。

::: tip 需要纵向装饰溢出时先检查两个轴
横向裁剪可能连带改变纵向滚动。可按实际需要调整结构，或在接受其边界时使用 `clip`；不能只看单独一条 `overflow-y` 声明。
:::

## 三、观察滚动范围

### 1. 建立最小滚动区域

以下是局部 HTML，省略文档外壳。区域具有可访问名称并可聚焦，供键盘验证：

```html
<div class="scroller" tabindex="0" role="region" aria-label="内容列表">
  <div class="row">第一项</div>
  <div class="row">第二项</div>
  <div class="row">第三项</div>
</div>
```

对应局部 CSS，没有边框和内边距：

```css
.scroller { height: 100px; overflow: auto; }
.row { height: 60px; }
.scroller:focus-visible { outline: 2px solid green; }
```

内容总高度为 `180px`，可见内容区域高度为 `100px`，纵向最大滚动距离为 `80px`。不同系统的滚动条外观可能不同。

### 2. 读取与移动

页面已包含上面的 HTML 与 CSS 时，以下片段可在控制台执行：

```js
const scroller = document.querySelector('.scroller');
scroller.clientHeight; // 100
scroller.scrollHeight; // 180
scroller.scrollTop = 40;
```

`clientHeight` 表示含内边距、不含边框和水平滚动条的可见内部高度；`scrollHeight` 表示容纳可滚动内容所需的内部高度。此例没有其他装饰，数字关系较直接。

把 `overflow` 改为 `hidden`，程序赋值仍可移动内容；改为 `clip`，则不能通过这种赋值产生滚动。比较时重新把 `scrollTop` 设为零，避免保留上次状态。

## 四、滚动祖先与内容可达性

### 1. sticky 参照可能改变

祖先的 `overflow: auto`、`scroll`、`hidden` 可能改变 sticky 的滚动参考。标题对页面滚动没有粘附反应时，应检查它是否实际上参照某个内部滚动容器。

`overflow: clip` 不创建同样的滚动容器，而且单独使用也不建立 BFC。不要把它当成 `hidden` 的无条件替换。

### 2. 裁剪可能隐藏交互信息

被裁掉的焦点轮廓、菜单、错误提示或可聚焦内容，会影响用户判断和操作。给内容加 `overflow: hidden` 前，需要核对：

1. 用户能否通过键盘和滚动看到全部必要内容。
2. 当前焦点能否被看见，轮廓是否被祖先截断。
3. 小屏幕、文字放大及长文本是否产生新的溢出。
4. 装饰裁剪和交互浮层是否需要不同的包装元素。

::: warning 增大 z-index 不能解除裁剪
裁剪限制可见区域，层叠决定区域内的绘制顺序。浮层被截断时，应检查裁剪祖先，具体诊断见[遮挡问题排查](../04-stacking-context/04-overlap-debugging.md)。
:::
