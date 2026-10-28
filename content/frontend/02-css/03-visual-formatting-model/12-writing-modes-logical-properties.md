---
title: "CSS 书写模式与逻辑属性"
tags:
  - CSS
  - 逻辑属性
  - 布局
excerpt: "解释行内方向、块方向、writing-mode 与文本方向的关系，比较逻辑尺寸、间距和起止对齐在横排、RTL 与竖排中的映射，并说明物理属性混用造成的冲突。"
---

# CSS 书写模式与逻辑属性

**书写模式**决定文字沿哪个方向排列、行沿哪个方向堆叠。**逻辑属性**按行内方向与块方向描述尺寸和间距，让规则随书写方向映射到实际的上下左右。

物理属性 `left` 始终指左侧；逻辑属性 `inline-start` 指一行内容的起点。两者在 LTR 横排中可能恰好相同，在 RTL 或竖排中则未必相同。

## 一、两条逻辑方向

### 1. inline 与 block

**行内方向**（inline）沿文字排列方向，**块方向**（block）沿行的堆叠方向：

| 模式 | 行内轴 | 块的堆叠 |
|------|--------|----------|
| `horizontal-tb` | 水平 | 从上到下 |
| `vertical-rl` | 竖直 | 从右到左 |
| `vertical-lr` | 竖直 | 从左到右 |

`writing-mode` 设置这类模式；文本的起止方向还与 HTML 的 `dir` 和 CSS `direction` 有关。方向是内容属性时，优先使用 HTML 的 `dir="rtl"`、`dir="ltr"`，必要时可用 `dir="auto"` 让浏览器依据内容判断。

### 2. 方向变化影响布局

Flex 的 `row` 沿行内轴，Grid 的列也与行内方向有关。竖排后，`row` 不应继续解释为固定的水平排列。

::: info 书写模式与旋转不是同一件事
`writing-mode` 改变文字与布局的方向规则；`transform: rotate()` 主要改变布局后的视觉表现，原来的布局占位仍按原规则计算。
:::

## 二、逻辑尺寸与间距

| 物理写法 | 逻辑写法 | 表达的含义 |
|----------|----------|------------|
| `width` / `height` | `inline-size` / `block-size` | 沿行内轴 / 块轴的尺寸 |
| 左右边距 | `margin-inline` | 行内起止两侧间距 |
| 上下内边距 | `padding-block` | 块起止两侧间距 |
| 起始侧边框 | `border-inline-start` | 一行起点侧的边框 |
| 起始侧定位 | `inset-inline-start` | 行内起点侧的偏移 |
| `text-align: left` | `text-align: start` | 按当前文字起点对齐 |

这张表中 width/height 的对应以横排为例。竖排后，`inline-size` 控制竖直尺寸，`block-size` 控制水平尺寸，逻辑含义始终一致。

下面是局部样式，假设 `.label` 内有正文文字：

```css
.label {
  inline-size: 12rem;
  padding-inline: 16px;
  padding-block: 8px;
  border-inline-start: 4px solid green;
  text-align: start;
}
```

这表达“行长 `12rem`，文字起始侧有边框”，不是“永远左边有边框”。在 `dir="rtl"` 的横排区域中，边框映射到右侧；竖排 LTR 中则映射到顶部。

## 三、核对横排、RTL 与竖排

以下是局部 HTML，复用上一节样式，省略文档外壳：

```html
<p class="label" dir="ltr">从文字起点排列。</p>
<p class="label" dir="rtl">مرحبا بالعالم</p>
<p class="label vertical" dir="ltr">竖排文字。</p>
```

再添加这条局部规则：

```css
.vertical { writing-mode: vertical-rl; }
```

依次观察：

1. 第一段边框在左侧，文字从左侧起点排列。
2. 第二段边框在右侧，文字方向由 RTL 决定。
3. 第三段行内尺寸沿竖直方向，边框在文字起始侧，而不再固定在左侧。

使用真实 RTL 文字验证时，还应检查数字与混合语言的双向文本表现；CSS 几何正确不能证明所有语言内容都已正确国际化。

::: tip 按意图选择物理或逻辑属性
装饰必须固定在屏幕左侧时可以用物理属性；内容需要跟随阅读起点时使用逻辑属性。不是所有 `left` 都必须机械替换成 `inline-start`。
:::

## 四、物理与逻辑属性的冲突

同一元素上的逻辑与物理属性可能映射到同一实际边，届时仍按层叠处理。以下是局部声明：

```css
.label {
  margin-left: 20px;
  margin-inline-start: 8px;
}
```

在 LTR 横排中两项指向左侧，后一项可能胜出；在 RTL 横排中，两项分别指向左侧和右侧，变成两个不同边距。这样混用会让方向切换产生意外结果。

::: warning 重构要按同一边界整体检查
修改尺寸、边距、边框和定位时，同时核对它们的物理与逻辑声明，以及简写覆盖关系。只替换一个属性，可能留下另一条仍然生效的物理规则。
:::

映射规则见 [CSS Logical Properties](https://www.w3.org/TR/css-logical-1/)，书写方向见 [CSS Writing Modes](https://www.w3.org/TR/css-writing-modes-3/)。
