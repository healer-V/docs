---
title: "CSS3 滤镜与混合模式"
category: "前端 · CSS"
tags:
  - CSS3
  - filter
  - backdrop-filter
  - mix-blend-mode
date: 2026-03-17
---

# CSS3 滤镜与混合模式

CSS3 的滤镜（filter）和混合模式（blend mode）为前端开发者带来了过去只能在图像编辑软件中实现的视觉效果。本文介绍 `filter`、`backdrop-filter`、`mix-blend-mode` 和 `background-blend-mode` 的用法与实战案例。

## 一、filter 属性

`filter` 对元素本身（包括其子元素）应用图像处理效果，多个滤镜用空格分隔、按顺序叠加。

### 1. 常用滤镜函数一览

| 函数 | 说明 | 默认值 |
|------|------|--------|
| `blur(radius)` | 高斯模糊，单位 px | `0` |
| `brightness(amount)` | 亮度，1 为原始 | `1` |
| `contrast(amount)` | 对比度，1 为原始 | `1` |
| `grayscale(amount)` | 灰度，1 为完全灰度 | `0` |
| `hue-rotate(angle)` | 色相旋转，单位 deg | `0deg` |
| `invert(amount)` | 反色，1 为完全反色 | `0` |
| `opacity(amount)` | 透明度，1 为完全不透明 | `1` |
| `saturate(amount)` | 饱和度，0 为灰色 | `1` |
| `sepia(amount)` | 棕褐色，1 为完全棕褐 | `0` |
| `drop-shadow(x y blur color)` | 投影（作用于内容形状） | - |

### 2. 基础滤镜示例

::: details 各类滤镜效果示例

```css{3,9,15,21,27,33}
/* 图片模糊 */
.img-blur {
  filter: blur(4px);
}

/* 降低亮度（变暗） */
.img-dim {
  filter: brightness(0.6);
}

/* 增强对比度 */
.img-contrast {
  filter: contrast(1.5);
}

/* 完全灰度（常用于禁用状态） */
.img-grayscale {
  filter: grayscale(1);
}

/* 色相旋转 180° */
.img-hue {
  filter: hue-rotate(180deg);
}

/* 棕褐色复古风格 */
.img-sepia {
  filter: sepia(0.8);
}

/* 反色（夜间模式图片翻转） */
.img-invert {
  filter: invert(1);
}
```

:::

### 3. drop-shadow 与 box-shadow 的区别

`filter: drop-shadow()` 作用于元素的实际内容形状（包括透明区域），而 `box-shadow` 只作用于矩形盒子边界。

::: details drop-shadow 对比 box-shadow

```css{3,9}
/* box-shadow：阴影是矩形 */
.icon-box-shadow {
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.3);
}

/* drop-shadow：阴影紧贴 PNG 图标轮廓 */
.icon-drop-shadow {
  filter: drop-shadow(4px 4px 8px rgba(0, 0, 0, 0.3));
}
```

:::

### 4. 多个滤镜组合

::: details 组合滤镜示例

```css{3-7,12-15}
/* 图片悬停：颜色增强 */
.photo:hover {
  filter:
    brightness(1.1)
    contrast(1.1)
    saturate(1.2);
  transition: filter 0.3s ease;
}

/* 禁用状态：灰度 + 半透明 */
.disabled {
  filter: grayscale(1) opacity(0.5);
  cursor: not-allowed;
}
```

:::

## 二、backdrop-filter 背景滤镜

`backdrop-filter` 作用于元素**背后**的内容，不影响元素自身，常用于实现毛玻璃（Frosted Glass）效果。

### 1. 基本用法

::: details 毛玻璃效果实现

```css{5-8}
/* 毛玻璃卡片 */
.glass-card {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border-radius: 16px;
  padding: 24px;
}

/* 毛玻璃导航栏 */
.navbar-glass {
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}
```

:::

### 2. 浏览器兼容性

| 浏览器 | 支持情况 |
|--------|----------|
| Chrome 76+ | 支持 |
| Safari 9+ | 支持（需 `-webkit-` 前缀） |
| Firefox 103+ | 支持（需开启标志位直至 103 版本） |
| Edge 79+ | 支持 |
| IE | 不支持 |

::: warning 兼容性处理
始终同时写 `-webkit-backdrop-filter` 和 `backdrop-filter`，并为不支持的浏览器提供降级背景色：

```css
.glass-panel {
  /* 降级方案：不透明背景 */
  background: rgba(255, 255, 255, 0.9);

  /* 支持时启用毛玻璃 */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

@supports (backdrop-filter: blur(1px)) {
  .glass-panel {
    background: rgba(255, 255, 255, 0.15);
  }
}
```

:::

## 三、mix-blend-mode 混合模式

`mix-blend-mode` 控制元素与其**下方内容**的混合方式，类似 Photoshop 的图层混合模式。

### 1. 常用混合模式

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| `normal` | 默认，无混合 | - |
| `multiply` | 正片叠底，结果变暗 | 阴影效果、去除白色背景 |
| `screen` | 滤色，结果变亮 | 高光效果、去除黑色背景 |
| `overlay` | 叠加，增强对比 | 增强图片纹理 |
| `darken` | 取更暗的值 | 混合深色元素 |
| `lighten` | 取更亮的值 | 混合浅色元素 |
| `color-dodge` | 颜色减淡 | 高光效果 |
| `color-burn` | 颜色加深 | 阴影效果 |
| `hard-light` | 强光 | 纹理叠加 |
| `soft-light` | 柔光 | 轻微纹理 |
| `difference` | 差值，产生反色效果 | 特殊艺术效果 |
| `exclusion` | 排除，类似差值但更柔和 | 特殊艺术效果 |
| `color` | 使用混合层的色相和饱和度 | 图片着色 |
| `luminosity` | 使用混合层的亮度 | 保留纹理的着色 |

### 2. 实用场景示例

::: details mix-blend-mode 实用示例

```css{4,15,22}
/* multiply：Logo 与彩色背景融合（去除白色背景） */
.logo-on-color {
  background: linear-gradient(135deg, #667eea, #764ba2);
}
.logo-on-color img {
  mix-blend-mode: multiply;
}

/* screen：光效叠加到图片上 */
.photo-with-light {
  position: relative;
}
.photo-with-light::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 30%, rgba(255, 220, 100, 0.6), transparent);
  mix-blend-mode: screen;
}

/* difference：颜色反转文字（在任意背景上保持可见） */
.contrast-text {
  color: #fff;
  mix-blend-mode: difference;
}
```

:::

## 四、background-blend-mode 背景混合模式

`background-blend-mode` 控制同一元素内多个背景层之间的混合方式：

::: details background-blend-mode 示例

```css{5,14}
/* 渐变与图片混合 */
.blended-bg {
  background:
    linear-gradient(135deg, rgba(102, 126, 234, 0.8), rgba(118, 75, 162, 0.8)),
    url('/images/photo.jpg') center / cover;
  background-blend-mode: multiply;
}

/* 纹理与颜色叠加 */
.texture-overlay {
  background:
    url('/images/noise.png') repeat,
    #4a90e2;
  background-blend-mode: overlay;
}
```

:::

## 五、实用案例

### 1. 图片悬停滤镜效果

::: details 图片悬停交互效果

```css
/* 图片库交互效果 */
.gallery-item {
  overflow: hidden;
  border-radius: 12px;
}

.gallery-item img {
  width: 100%;
  display: block;
  filter: grayscale(0.3) brightness(0.9);
  transform: scale(1);
  transition: filter 0.4s ease, transform 0.4s ease;
}

.gallery-item:hover img {
  filter: grayscale(0) brightness(1.05) saturate(1.2);
  transform: scale(1.05);
}
```

:::

### 2. 毛玻璃弹窗卡片

::: details 毛玻璃弹窗完整示例

```css
/* 全屏遮罩层 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 毛玻璃弹窗 */
.modal-glass {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border-radius: 20px;
  padding: 32px;
  width: 400px;
  color: #fff;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.modal-glass .title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
}
```

:::

::: tip 滤镜的性能影响
`filter` 和 `backdrop-filter` 会创建新的合成层，对复杂场景有一定性能影响。避免在大量元素上同时使用模糊滤镜，必要时可使用 `will-change: filter` 提示浏览器提前优化。
:::
