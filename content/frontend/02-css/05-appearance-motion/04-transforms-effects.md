---
title: "CSS 变换与视觉效果"
tags:
  - CSS
  - transform
  - filter
excerpt: "解释变换的视觉位置、组合顺序和变换原点，比较整体透明度、滤镜、背景滤镜、混合与裁剪，说明占位、包含块、层叠副作用及不支持效果时的可读回退。"
---

# CSS 变换与视觉效果

**变换**改变盒子布局后的视觉坐标与形状。透明度、滤镜和混合等效果则改变绘制结果；它们通常不会像修改宽高那样重新安排相邻常规流盒子。

视觉位置改变仍可能影响滚动溢出、点击区域和测量结果。因此“没有重新安排占位”不等于“不会影响其他行为”。

## 一、位移、旋转与缩放

### 1. transform 与原占位

| 函数 | 作用 | 常见参考 |
|------|------|----------|
| `translate(x, y)` | 位移 | 百分比通常参照自身变换参考框 |
| `rotate(angle)` | 旋转 | 围绕变换原点 |
| `scale(x, y)` | 缩放 | 围绕变换原点，可能造成视觉重叠 |

以下是局部样式，假设 `.box` 位于普通块级内容中：

```css
.box {
  width: 100px;
  height: 60px;
  transform: translateX(50%);
}
```

在普通 HTML 盒子默认参考条件下，它向右移动自身宽度的一半，即 `50px`；后续块仍按未移动时的占位排列。`getBoundingClientRect()` 反映移动后的位置。

### 2. 组合顺序与原点

`transform` 列表按顺序组合矩阵；分析几何点的最终位置时，可以从右向左推导效果。下面两条局部规则结果不同：

```css
.a { transform: translateX(80px) rotate(90deg); }
.b { transform: rotate(90deg) translateX(80px); }
```

第一条的位移沿原来的水平轴；第二条中位移向量受前面的旋转影响。不能把一组函数当成可以任意交换的独立声明。

`transform-origin` 设置原点，HTML 盒子通常默认居中。旋转或缩放时改为 `left top`，边界运动轨迹会变化。独立属性 `translate`、`rotate`、`scale` 也可以使用，但与 `transform` 共存时有固定的组合规则，见 [CSS Transforms](https://www.w3.org/TR/css-transforms-2/)。

::: warning 变换会带来层级与定位副作用
非 `none` 的变换可能建立层叠上下文及后代定位包含块。即使 `translate(0)` 没有可见移动，也要检查这两个影响。
:::

## 二、透明度与滤镜

### 1. opacity 作用于整体

`opacity: 0.5` 对元素及其内容形成整体透明效果；后代再写 `opacity: 1` 不能抵消父级整体透明。

只想让背景半透明时，应使用 `background: rgb(... / 0.5)`，保留文字不透明。元素 `opacity: 0` 也不自动移除占位或交互目标，不能直接作为完整的隐藏方案。

### 2. filter 与 drop-shadow

`filter` 可对元素绘制结果使用 `blur()`、`brightness()`、`grayscale()` 等函数。函数的组合顺序可能改变结果，模糊还会扩大可见范围并可能被裁剪。

以下是局部效果声明，省略元素结构：

```css
.muted { filter: grayscale(100%); }
.shape { filter: drop-shadow(0 2px 4px rgb(0 0 0 / 0.2)); }
```

`drop-shadow()` 根据输入图像的透明轮廓形成阴影，适合不规则图像；`box-shadow` 根据盒轮廓绘制，二者不应只按数值相同就当成等价效果。

## 三、背景滤镜、混合与隔离

### 1. backdrop-filter

`backdrop-filter` 处理元素后面的背景图像。元素完全不透明时，处理后的背景可能被遮住；还需有可观察的背景变化，而不是在纯色背景上期待明显模糊。

下面是局部增强样式，基础回退保持可读：

```css
.overlay { background: #ffffff; color: #202124; }
@supports (backdrop-filter: blur(8px)) {
  .overlay {
    background: rgb(255 255 255 / 0.85);
    backdrop-filter: blur(8px);
  }
}
```

不支持时使用不透明白底；支持时可看到背后的模糊效果。背景根等绘制边界还会影响取样范围，具体限制见 [MDN backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter)。

### 2. 混合的两种范围

`background-blend-mode` 混合元素自己的背景层；`mix-blend-mode` 混合元素内容与背后内容。需要控制后一种效果的局部范围时，可以在合适祖先上设置 `isolation: isolate`。

混合结果依赖背景，页面换色后可能不可读。关键信息应保留明确颜色与正常模式回退，不能依赖某一张背景图碰巧产生足够对比。

## 四、裁剪与遮罩

`clip-path` 按形状限定绘制区域；`mask` 根据遮罩透明度或亮度等规则控制可见程度。它们不直接改变常规布局占位，且可能建立额外绘制边界。

以下是局部裁剪声明，假设盒子本身具有非零尺寸：

```css
.avatar {
  clip-path: circle(50%);
}
```

可见内容限制在圆形范围内，但相邻盒子仍按原来的矩形布局。圆形裁剪与 `border-radius` 的适用对象及交互影响不完全相同。

::: info 效果检查的三个层面
1. 布局占位是否仍符合预期。
2. 可见边界、文字对比和裁剪是否正确。
3. 层叠上下文、包含块及性能是否受到影响。
:::

滤镜与混合的规则见 [Filter Effects](https://www.w3.org/TR/filter-effects-1/) 和 [Compositing and Blending](https://www.w3.org/TR/compositing-1/)。
