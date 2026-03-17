---
title: "CSS3 渐变与背景增强"
category: "前端 · CSS"
tags:
  - CSS3
  - 渐变
  - background
  - linear-gradient
date: 2026-03-17
---

# CSS3 渐变与背景增强

CSS3 的渐变函数让你无需图片即可实现丰富的色彩过渡效果，配合 `background` 的多项增强属性，可以精确控制背景的尺寸、定位和裁剪方式。

## 一、linear-gradient 线性渐变

### 1. 基本语法

```
linear-gradient([direction], color-stop1, color-stop2, ...)
```

方向可以用关键词或角度值指定：

| 值 | 说明 |
|----|------|
| `to right` | 从左到右 |
| `to bottom` | 从上到下（默认） |
| `to bottom right` | 对角线方向 |
| `45deg` | 45° 角（正值顺时针） |

::: details 线性渐变基本示例

```css{2,7,12,17}
/* 默认：从上到下 */
.gradient-top-bottom {
  background: linear-gradient(#667eea, #764ba2);
}

/* 从左到右 */
.gradient-left-right {
  background: linear-gradient(to right, #f093fb, #f5576c);
}

/* 45° 角方向 */
.gradient-diagonal {
  background: linear-gradient(45deg, #4facfe, #00f2fe);
}

/* 多色渐变 */
.gradient-rainbow {
  background: linear-gradient(
    to right,
    #ff6b6b,
    #ffd93d,
    #6bcb77,
    #4d96ff
  );
}
```

:::

### 2. 颜色断点控制

颜色断点可以指定具体位置，实现精确的色彩分布：

::: details 颜色断点示例

```css{3-8,13-17}
/* 指定断点位置 */
.gradient-stops {
  background: linear-gradient(
    to right,
    #ff6b6b 0%,
    #ff6b6b 30%,    /* 前 30% 纯红色 */
    #ffd93d 30%,    /* 突变切换 */
    #ffd93d 70%,
    #6bcb77 70%
  );
}

/* 渐变进度不均匀 */
.gradient-uneven {
  background: linear-gradient(
    to right,
    #667eea 20%,   /* 在 20% 前完成第一色 */
    #764ba2 80%    /* 在 80% 才开始第二色 */
  );
}
```

:::

### 3. repeating-linear-gradient 重复线性渐变

`repeating-linear-gradient` 会将渐变图案无限重复，常用于条纹背景：

::: details 重复线性渐变示例

```css{2,10,19}
/* 斜纹条纹背景 */
.stripes {
  background: repeating-linear-gradient(
    45deg,
    #f0f0f0,
    #f0f0f0 10px,
    #fff 10px,
    #fff 20px
  );
}

/* 进度条效果 */
.progress-bar {
  background: repeating-linear-gradient(
    -45deg,
    #4a90e2,
    #4a90e2 10px,
    #357abd 10px,
    #357abd 20px
  );
  animation: move-stripes 1s linear infinite;
}

@keyframes move-stripes {
  from { background-position: 0 0; }
  to   { background-position: 28px 0; }
}
```

:::

## 二、radial-gradient 径向渐变

### 1. 基本语法

```
radial-gradient([shape size at position], color-stop1, color-stop2, ...)
```

| 参数 | 可选值 | 说明 |
|------|--------|------|
| `shape` | `circle` / `ellipse` | 形状，默认 `ellipse` |
| `size` | `closest-side` / `farthest-corner` 等 | 渐变终止边界 |
| `position` | `at center` / `at 30% 40%` 等 | 渐变中心点 |

### 2. 形状与位置

::: details 径向渐变示例

```css{2,8,14,22}
/* 默认椭圆，居中 */
.radial-default {
  background: radial-gradient(#ff6b6b, #764ba2);
}

/* 正圆渐变 */
.radial-circle {
  background: radial-gradient(circle, #4facfe, #00f2fe);
}

/* 自定义中心点 */
.radial-offset {
  background: radial-gradient(circle at 30% 70%, #ffd93d, #ff6b6b);
}

/* 光晕效果 */
.spotlight {
  background: radial-gradient(
    circle at 50% 0%,
    rgba(255, 255, 255, 0.3) 0%,
    transparent 60%
  ),
  #1a1a2e;
}
```

:::

### 3. size 关键词说明

| 关键词 | 说明 |
|--------|------|
| `closest-side` | 渐变边缘到最近的边 |
| `closest-corner` | 渐变边缘到最近的角 |
| `farthest-side` | 渐变边缘到最远的边 |
| `farthest-corner` | 渐变边缘到最远的角（默认） |

### 4. repeating-radial-gradient 重复径向渐变

::: details 重复径向渐变示例

```css{2}
/* 同心圆波纹 */
.ripple {
  background: repeating-radial-gradient(
    circle,
    transparent,
    transparent 10px,
    rgba(74, 144, 226, 0.15) 10px,
    rgba(74, 144, 226, 0.15) 20px
  );
}
```

:::

## 三、conic-gradient 锥形渐变

`conic-gradient` 是沿着中心点旋转的渐变，天然适合饼图、色轮等场景。

### 1. 基本语法

```
conic-gradient([from angle] [at position], color-stop1, color-stop2, ...)
```

::: details 锥形渐变示例

```css{2,9,16,26}
/* 基本色轮 */
.color-wheel {
  border-radius: 50%;
  background: conic-gradient(
    red, yellow, lime, aqua, blue, magenta, red
  );
}

/* 饼图（三个扇形） */
.pie-chart {
  border-radius: 50%;
  background: conic-gradient(
    #ff6b6b 0% 30%,     /* 红色占 30% */
    #ffd93d 30% 70%,    /* 黄色占 40% */
    #6bcb77 70% 100%    /* 绿色占 30% */
  );
}

/* 仪表盘进度 */
.gauge {
  border-radius: 50%;
  background: conic-gradient(
    from -90deg,
    #4a90e2 0% 75%,    /* 进度 75% */
    #e0e0e0 75% 100%
  );
}

/* 棋盘格（结合 repeating-conic-gradient） */
.checkerboard {
  background: repeating-conic-gradient(
    #f0f0f0 0% 25%,
    #fff 0% 50%
  ) 0 0 / 40px 40px;
}
```

:::

::: tip 浏览器支持
`conic-gradient` 在 Chrome 69+、Firefox 83+、Safari 12.1+ 中支持。需要兼容更旧版本时可考虑使用 SVG 或 Canvas 方案。
:::

## 四、background 属性增强

### 1. background-size

| 值 | 说明 |
|----|------|
| `cover` | 等比缩放，覆盖整个容器，可能裁剪 |
| `contain` | 等比缩放，完整显示，可能留白 |
| `100% 100%` | 拉伸填充，可能变形 |
| `200px 150px` | 固定尺寸 |
| `50% auto` | 宽度 50%，高度等比 |

::: details background-size 示例

```css{3,9,15}
/* 背景图铺满容器 */
.hero-cover {
  background: url('/images/hero.jpg') center / cover no-repeat;
}

/* 背景图完整显示 */
.logo-bg {
  background: url('/images/logo.png') center / contain no-repeat;
}

/* 背景图案平铺 */
.pattern {
  background: url('/images/tile.png') 0 0 / 40px 40px repeat;
}
```

:::

### 2. background-origin

控制背景图片的定位原点：

| 值 | 说明 |
|----|------|
| `border-box` | 从边框左上角开始 |
| `padding-box` | 从内边距左上角开始（默认） |
| `content-box` | 从内容区左上角开始 |

### 3. background-clip

控制背景的绘制区域：

| 值 | 说明 |
|----|------|
| `border-box` | 绘制到边框（默认） |
| `padding-box` | 绘制到内边距边缘 |
| `content-box` | 只在内容区绘制 |
| `text` | 裁剪到文字形状（实现渐变文字） |

::: details 渐变文字效果（background-clip: text）

```css{4-7}
/* 渐变文字效果 */
.gradient-text {
  font-size: 48px;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent; /* 非 WebKit 浏览器的回退 */
}
```

:::

::: warning 兼容性提示
`background-clip: text` 需要 `-webkit-` 前缀（`-webkit-background-clip: text`），同时配合 `-webkit-text-fill-color: transparent` 使用，普通 `color: transparent` 作为降级回退。
:::

## 五、多背景叠加

CSS3 允许在同一元素上叠加多个背景层，用逗号分隔，先声明的在最上层。

### 1. 语法格式

```css
background:
  [layer1],
  [layer2],
  [layer3 / 最底层];
```

### 2. 实用案例

::: details 多背景叠加示例

```css{2-8,13-19,25-30}
/* 图案 + 纯色底 */
.pattern-bg {
  background:
    url('/images/dots.png') 0 0 / 20px 20px repeat,
    linear-gradient(135deg, #667eea, #764ba2);
}

/* 多层渐变叠加（光晕效果） */
.glow-bg {
  background:
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3), transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 107, 107, 0.3), transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(255, 217, 61, 0.1), transparent 60%),
    #0f0f1a;
}

/* 噪点纹理 + 渐变 */
.texture-gradient {
  background:
    url('/images/noise.png') repeat,
    linear-gradient(to bottom, #f8f9fa, #e9ecef);
  background-blend-mode: multiply, normal;
}
```

:::

::: tip 多背景的每个 background-size
当使用多背景时，`background-size`、`background-position` 等属性的值也需要用逗号分隔，与背景层一一对应：

```css
.multi-bg {
  background-image: url('a.png'), url('b.png');
  background-size: 100px 100px, cover;
  background-position: top left, center;
}
```

:::
