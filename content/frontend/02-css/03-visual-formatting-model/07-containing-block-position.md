---
title: "CSS 包含块与定位"
tags:
  - CSS
  - position
  - 布局
excerpt: "解释包含块如何为尺寸和位置提供参考，比较 static、relative、absolute、fixed 与 sticky 的占位和参照条件，并说明百分比高度、变换祖先及粘性定位失效的原因。"
---

# CSS 包含块与定位

**包含块**（containing block）是盒子计算某些尺寸和位置时使用的参考区域。它通常由某个祖先盒子的特定区域形成，但不一定是直接父元素。

**定位**由 `position` 选择方式；`top`、`right`、`bottom`、`left` 或对应逻辑属性表达偏移约束。先找到真实参考区域，再读偏移数值，才能解释位置。

## 一、五种定位方式

| position | 是否保留常规流占位 | 主要行为 |
|----------|--------------------|----------|
| `static` | 是 | 按常规布局，定位偏移不生效 |
| `relative` | 是 | 从原布局位置做视觉偏移，原占位保留 |
| `absolute` | 否 | 按绝对定位包含块计算位置 |
| `fixed` | 否 | 通常相对视口，也可能被祖先建立的包含块约束 |
| `sticky` | 是 | 常规布局后，按滚动参考和偏移条件进行粘附 |

`relative` 和 `sticky` 的位置变化不会简单让后续常规流元素填补原位置。`absolute` 和 `fixed` 则脱离普通占位，但仍可能被裁剪或影响滚动溢出范围。

::: warning 脱离常规流不等于脱离全部约束
绝对定位仍依赖包含块、尺寸限制和绘制规则。`position: absolute` 也不保证元素一定显示在最上方，层级需单独判断。
:::

## 二、包含块怎样确定

### 1. 常规布局与绝对定位

对于普通 `static`、`relative`、`sticky` 盒子，包含块通常来自最近的块容器或建立格式化上下文的祖先的内容区域。

绝对定位通常寻找最近能建立绝对定位包含块的祖先。常见做法是给祖先设置非 `static` 的 `position`，参考区域通常是它的内边距框；若没有这样的祖先，则可能使用**初始包含块**，在连续屏幕媒体中与布局视口有关。

以下是局部 HTML，省略文档外壳：

```html
<div class="panel"><span class="badge">新</span></div>
```

对应局部 CSS：

```css
.panel { position: relative; width: 240px; height: 120px; }
.badge {
  position: absolute;
  top: 8px;
  right: 8px;
}
```

角标位于面板右上方。移除 `.panel` 的 `position: relative` 后，角标可能改用更远祖先或初始包含块，位置因此改变。

### 2. 固定定位与变换祖先

`fixed` 通常相对视口定位，但 `transform` 等属性可以让祖先为它建立包含块。某些 `filter`、`contain`、`will-change` 情况也需要按属性规则检查。

以下局部声明会改变祖先的参考作用，即使变换看上去没有位移：

```css
.panel { transform: translate(0); }
.badge { position: fixed; top: 8px; right: 8px; }
```

角标可能随面板滚动，不再保持在视口右上角。应检查祖先的有效属性，而不是因为值看起来“没有变化”就排除其影响。规则见 [MDN 包含块](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Display/Containing_block)。

## 三、百分比参照什么

百分比参考随属性变化。以水平书写模式下的常见情况为例：

| 属性 | 主要参考 |
|------|----------|
| `width`、左右偏移 | 包含块宽度 |
| `height`、上下定位偏移 | 对应的包含块高度规则 |
| 百分比内边距及外边距 | 通常参照包含块的行内尺寸，即此处宽度 |
| `translateX(%)` | 自身变换参考框，不是定位包含块 |

常规流元素 `height: 50%` 若没有可确定的参考高度，不能简单算成父元素最后内容高度的一半。绝对定位等情况还有不同的尺寸解析规则。

下面是局部样式，假设 `.child` 在 `.parent` 中，无额外边框和内边距：

```css
.parent { height: 200px; }
.child { height: 50%; }
```

在普通块级条件下，子级高度可得到 `100px`。移除父级明确高度后，原先的百分比计算前提不再成立，应检查自动尺寸与内容高度。

::: tip 先找参考量，再做乘法
“百分比 × 父尺寸”只有在祖先、参考区域、属性规则和确定性条件都正确时才能使用。包含块不是“父元素”的别名。
:::

## 四、sticky 的两个约束

`sticky` 同时受**最近滚动参考区域**与自身**包含块范围**约束。滚动达到偏移阈值后，它尝试保持相应位置；不能越过包含块允许的范围无限粘附。

以下是局部样式，假设 `.heading` 位于有足够内容的 `.scroller` 内：

```css
.scroller { height: 240px; overflow: auto; }
.heading { position: sticky; top: 0; background: white; }
```

滚动 `.scroller` 时标题在其顶部粘附。若祖先使用 `overflow: hidden` 等值形成了滚动容器，滚动参考可能改变，即使那个祖先没有用户可见的滚动条。

sticky 没达到预期时，依次检查：

1. 目标轴是否设置了非 `auto` 的偏移，如 `top: 0`。
2. 实际滚动的是哪个祖先；是否被另一个 `overflow` 祖先截住。
3. 容器是否有足够可滚动内容及粘附空间。
4. 项目是否因 Flex/Grid 拉伸而占满包含块，导致没有移动余地。

定位与粘附的正式定义见 [CSS Positioned Layout](https://www.w3.org/TR/css-position-3/)。
