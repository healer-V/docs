# 移动端项目要点

## 一、响应式布局基础

### 1. 核心概念

| 概念 | 说明 | 示例 |
| --- | --- | --- |
| 屏幕分辨率 | 屏幕物理像素的长宽值，单位 `px` | iPhone 8：1334 × 750 |
| 屏幕像素密度（PPI） | 每英寸包含的像素数，`PPI = 分辨率 / 屏幕尺寸` | iPhone 8：326ppi |
| 设备独立像素（DIP） | CSS 中使用的虚拟像素，与物理像素无关 | `width: 375px` |
| 设备像素比（DPR） | `DPR = 物理像素 / CSS像素`，可通过 `window.devicePixelRatio` 获取 | iPhone 8：DPR = 2 |
| 屏幕尺寸 | 屏幕对角线长度，单位英寸（1in = 2.54cm） | iPhone 8：4.7in |

### 2. 视口配置

```html
<meta name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

::: tip 各字段含义
- `width=device-width` — 视口宽度等于设备宽度
- `initial-scale=1.0` — 初始缩放比例 1:1
- `maximum-scale=1.0` — 最大缩放比例（禁止放大）
- `user-scalable=no` — 禁止用户手动缩放
:::

## 二、适配方案

### 1. rem 方案

通过动态设置根元素 `font-size`，让所有使用 `rem` 的尺寸自动适配。

```js
// 设置根字号，以 375px 设计稿为基准
function setRem() {
  const baseSize = 16
  const scale = document.documentElement.clientWidth / 375
  document.documentElement.style.fontSize = baseSize * scale + 'px'
}
setRem()
window.addEventListener('resize', setRem)
```

::: warning 注意
rem 方案在 PC 端和超大屏上容易出现元素过大的问题，需要设置最大宽度限制。
:::

### 2. vw/vh 方案 {#vw-vh}

直接使用视口单位，无需 JS 计算，是目前更推荐的方案。

```css
/* 设计稿 375px 下，100px 对应的 vw 值 */
.box {
  width: 26.67vw;   /* 100 / 375 * 100 */
  font-size: 4.267vw; /* 16 / 375 * 100 */
}
```

配合 PostCSS 插件自动转换：

```js
// postcss.config.js
module.exports = {
  plugins: {
    'postcss-px-to-viewport': {
      viewportWidth: 375,
      unitPrecision: 5,
      viewportUnit: 'vw',
      minPixelValue: 1,
    }
  }
}
```

### 3. 媒体查询

针对不同断点编写样式，适合处理布局层面的差异。

```css
/* 小屏手机 */
@media (max-width: 375px) {
  .container { padding: 12px; }
}
/* 普通手机 */
@media (min-width: 376px) and (max-width: 750px) {
  .container { padding: 16px; }
}
/* 平板 */
@media (min-width: 751px) {
  .container { padding: 24px; }
}
```

### 4. 方案对比

| 方案 | 优点 | 缺点 |
| --- | --- | --- |
| rem | 兼容性好，支持老浏览器 | 需要 JS 动态计算根字号 |
| vw/vh | 纯 CSS 方案，无需 JS | 需要 PostCSS 插件辅助开发 |
| 媒体查询 | 精确控制断点样式 | 维护成本高，不够灵活 |

## 三、1px 边框问题

在高 DPR 设备上，CSS 的 `1px` 会被渲染为 2 或 3 个物理像素，看起来偏粗。

### 1. 解决方案：`transform` 缩放

```css
.border-1px {
  position: relative;
}
.border-1px::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 1px;
  background: #ccc;
  transform: scaleY(0.5);
  transform-origin: 0 0;
}

/* DPR 3 的设备 */
@media (-webkit-min-device-pixel-ratio: 3) {
  .border-1px::after {
    transform: scaleY(0.333);
  }
}
```

## 四、图片适配

### 1. 多倍图

根据 DPR 提供不同分辨率的图片，避免模糊或浪费带宽。

```html
<img
  src="image@1x.png"
  srcset="image@2x.png 2x, image@3x.png 3x"
  alt="示例图片"
/>
```

### 2. 使用 `<picture>` 按条件加载

```html
<picture>
  <source media="(max-width: 375px)" srcset="small.webp" type="image/webp" />
  <source media="(max-width: 750px)" srcset="medium.webp" type="image/webp" />
  <img src="large.jpg" alt="响应式图片" />
</picture>
```

## 五、移动端事件处理

### 1. 点击延迟

移动端浏览器在 `click` 事件上有 **300ms 延迟**（用于判断双击缩放）。

::: code-group
```html [方案一：meta 禁用缩放]
<!-- 现代浏览器会自动消除延迟 -->
<meta name="viewport" content="width=device-width" />
```

```css [方案二：touch-action]
html {
  touch-action: manipulation; /* 禁用双击缩放，消除延迟 */
}
```
:::

### 2. 常用手势事件

```js
// 触摸事件
element.addEventListener('touchstart', onTouchStart)  // 手指按下
element.addEventListener('touchmove', onTouchMove)    // 手指移动
element.addEventListener('touchend', onTouchEnd)      // 手指抬起

// 判断滑动方向
function getDirection(startX, startY, endX, endY) {
  const dx = endX - startX
  const dy = endY - startY
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left'
  }
  return dy > 0 ? 'down' : 'up'
}
```

## 六、性能优化

### 1. 首屏加载

::: details 关键优化手段
- **路由懒加载** — 按需加载页面组件，减少首屏体积
- **图片懒加载** — 使用 `loading="lazy"` 或 IntersectionObserver
- **资源预加载** — 对关键资源使用 `<link rel="preload">`
- **代码分割** — 利用动态 `import()` 拆分 vendor 和业务代码
- **CDN 加速** — 静态资源部署到 CDN 节点
:::

### 2. 渲染性能

```css
/* 使用 transform 代替 top/left 做动画 */
.animate {
  /* ❌ 触发重排 */
  /* top: 100px; */

  /* ✅ GPU 加速，仅触发合成 */
  transform: translateY(100px);
  will-change: transform;
}
```

::: warning 避免的操作
- 频繁读写 DOM 导致强制重排（如在循环中读取 `offsetHeight`）
- 大量使用 `box-shadow`、`filter` 等耗性能属性
- 滚动事件未做节流/防抖处理
:::

### 3. 网络优化

| 策略 | 做法 |
| --- | --- |
| 请求合并 | 使用雪碧图、字体图标、SVG Sprite |
| 缓存策略 | 合理配置 `Cache-Control`、`ETag`，离线使用 Service Worker |
| 资源压缩 | 开启 Gzip/Brotli，压缩图片（WebP 格式） |
| 按需加载 | 接口分页、图片懒加载、组件异步加载 |

## 七、兼容性处理

### 1. 安全区域适配

针对 iPhone X 及以上的刘海屏和底部横条：

```css
/* 设置安全区域 */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* 底部固定栏适配 */
.fixed-bottom {
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
}
```

::: tip
需要在 `<meta name="viewport">` 中添加 `viewport-fit=cover` 才能生效。
:::

### 2. 常见兼容问题

| 问题 | 解决方案 |
| --- | --- |
| iOS 滚动不流畅 | 添加 `-webkit-overflow-scrolling: touch` |
| iOS 输入框弹起页面不回落 | 输入框失焦时执行 `window.scrollTo(0, 0)` |
| Android 键盘遮挡输入框 | 监听 `resize` 事件，滚动输入框到可视区域 |
| 系统字体大小影响布局 | 使用 `text-size-adjust: 100%` 阻止系统缩放 |

## 八、调试工具

### 1. 移动端调试面板

::: code-group
```html [vConsole]
<!-- 移动端调试面板 -->
<script src="https://unpkg.com/vconsole/dist/vconsole.min.js"></script>
<script>new window.VConsole()</script>
```

```html [Eruda]
<!-- 另一个移动端调试工具 -->
<script src="https://cdn.jsdelivr.net/npm/eruda"></script>
<script>eruda.init()</script>
```
:::

### 2. 其他调试方式

- **Chrome DevTools** — 移动端模拟 + USB 远程调试
- **Charles / Whistle** — 抓包代理，查看接口请求
- **Safari Web Inspector** — iOS 真机调试
