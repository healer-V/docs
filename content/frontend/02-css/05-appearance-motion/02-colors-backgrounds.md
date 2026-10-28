---
title: "CSS 颜色、背景与渐变"
tags:
  - CSS
  - 颜色
  - 背景
excerpt: "介绍颜色语法、透明通道与 currentColor，解释背景图片的尺寸、定位、绘制范围和多层顺序，通过渐变与资源失效片段说明背景组合和可读回退。"
---

# CSS 颜色、背景与渐变

**颜色**是属性使用的值，**背景**是绘制在内容后方的颜色和图片层。渐变属于生成的图像，可以用于背景，但不能代替任意颜色值使用。

## 一、颜色的表示与继承关系

| 形式 | 示例 | 含义 |
|------|------|------|
| 关键字 | `green`、`transparent` | 预定义颜色或透明 |
| 十六进制 | `#166534`、`#16653480` | RGB 分量，可包含透明通道 |
| RGB | `rgb(22 101 52 / 0.5)` | 红绿蓝与透明通道 |
| HSL | `hsl(144 64% 24%)` | 色相、饱和度与亮度 |
| 感知颜色空间 | `oklch(55% 0.12 150)` | 亮度、色度与色相，需要核对支持及色域 |

透明通道控制**这个颜色**的透明程度，而 `opacity` 作用于元素整体，包括其后代内容。半透明背景通常用颜色透明通道，避免同时让文字变淡。

`currentColor` 表示当前元素的 `color` 值，适合让边框或装饰跟随文字：

```css
.status {
  color: #166534;
  border: 1px solid currentColor;
  background-color: rgb(22 101 52 / 0.08);
}
```

这是局部样式，假设 `.status` 已存在。文字与边框同色，背景独立半透明。颜色定义见 [CSS Color](https://www.w3.org/TR/css-color-4/)。

::: warning 状态不能只通过颜色表达
成功、警告和错误应有文字或其他可辨认信息。透明背景的实际对比还依赖下方颜色，不能只检查色值本身。
:::

## 二、背景的尺寸与绘制范围

### 1. 图片与纯色

`background-color` 在图片层后方绘制；图片加载失败时，它仍可作为底色。`background-image` 不会为盒子提供内容尺寸，也没有图片元素那样的 `alt` 语义。

| 属性 | 判断问题 |
|------|----------|
| `background-position` | 图片放在参考区域哪里 |
| `background-size` | 图片以多大尺寸绘制 |
| `background-repeat` | 是否平铺，按哪个方向重复 |
| `background-origin` | 定位和尺寸的参考区域，通常默认 padding-box |
| `background-clip` | 背景绘制到哪个边界，通常默认 border-box |

`cover` 保持比例覆盖参考区域，可能裁掉部分图像；`contain` 保持比例完整放入，可能留下空白。需要检查实际对象细节时，不应无条件使用 `cover`。

### 2. 背景不会自动变成内容图片

内容本身有含义时通常使用 `<img>` 并提供 `alt`；纯装饰才适合背景。下面是局部故障演示，故意引用不存在的文件：

```css
.banner {
  color: #202124;
  background: #e5e7eb url("missing-background.png") center / cover no-repeat;
}
```

图片请求失败，纯色仍能显示。如果失败后文字无法阅读，说明回退颜色或对比选择不成立；应恢复正确资源路径，并保留合理底色。

::: tip 分开判断加载与绘制
资源没加载，检查路径和请求；加载了却看不见，再检查盒尺寸、位置、尺寸、层顺序和裁剪。重复调 `background-size` 不能修复请求失败。
:::

## 三、多背景与渐变

### 1. 多层顺序

多个背景图片以逗号分隔，**最先写的位于最前面**。背景颜色在最后方；多层简写的颜色只能出现在最后一层中。

以下局部样式不依赖外部资源，给 `.pattern` 绘制两层背景：

```css
.pattern {
  background-image:
    linear-gradient(90deg, rgb(0 0 0 / 0.12) 1px, transparent 1px),
    linear-gradient(#e7f6ee, #ffffff);
  background-size: 16px 100%, auto;
  background-repeat: repeat, no-repeat;
}
```

第一层形成重复竖线，位于第二层底色渐变前方。多值列表按背景层配对；修改层数后应同步检查各项尺寸、位置和重复方式。

### 2. 渐变类型与色标

| 函数 | 变化方式 | 常见用途 |
|------|----------|----------|
| `linear-gradient()` | 沿直线变化 | 方向色带、遮罩式背景 |
| `radial-gradient()` | 从中心向外变化 | 圆形或椭圆形色带 |
| `conic-gradient()` | 围绕中心按角度变化 | 角度图形，需要另有文本说明 |
| `repeating-*` | 重复指定的渐变段 | 条纹等重复装饰 |

色标指定颜色及其位置，多个相同位置的色标可形成硬边界。以下是局部背景值，不是 `color` 的合法取值：

```css
.band {
  background-image: linear-gradient(to right, #166534 50%, #e5e7eb 50%);
}
```

盒子左右分别呈现两种颜色，边界在宽度的 50% 处。盒子尺寸变化会改变实际像素位置，但不会生成新的布局尺寸。

## 四、背景简写与结果判断

`background` 会同时设置颜色、图像、位置、尺寸、重复和绘制范围等子项。只想修改颜色时用 `background-color`，避免清掉图片。

::: info 背景观察顺序
1. 盒子有无可见尺寸。
2. 资源或渐变是否形成有效图像。
3. 最前面的背景层是否遮住后层。
4. 定位参考与绘制边界是否符合预期。
5. 资源失败、强制颜色和不同尺寸下，文字是否仍可读。
:::

背景层与简写规则见 [CSS Backgrounds and Borders](https://www.w3.org/TR/css-backgrounds-3/)，渐变定义见 [CSS Images](https://www.w3.org/TR/css-images-3/)。
