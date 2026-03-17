---
title: "HTML5 Canvas 绘图"
category: "前端 · HTML"
tags:
  - HTML
  - HTML5
  - Canvas
excerpt: "Canvas 是 HTML5 提供的位图绘图 API，通过 JavaScript 在 2D 画布上绘制图形、文字、图像，并实现动画效果。本文从基础图形到动画，系统讲解 Canvas 的核心 API 和实战应用。"
date: 2026-03-17
---

# HTML5 Canvas 绘图

## 一、Canvas 概述

### 1. Canvas 与 SVG 的核心区别

Canvas 和 SVG 都是 Web 图形技术，但底层机制截然不同：

| 对比维度 | Canvas | SVG |
|---------|--------|-----|
| 渲染方式 | 位图（像素点阵） | 矢量（数学描述） |
| 缩放效果 | 放大会失真 | 任意缩放不失真 |
| DOM 结构 | 无 DOM 元素，画完即像素 | 每个图形是独立 DOM 节点 |
| 事件绑定 | 需手动计算坐标判断 | 直接给图形元素绑定事件 |
| 性能特点 | 适合大量动态对象（游戏、粒子） | 适合少量静态或交互图形 |
| 文字处理 | 文字渲染为像素，无法选中 | 文字保留语义，可选中搜索 |
| 动画方式 | 逐帧重绘整个画布 | 修改 DOM 属性，浏览器增量渲染 |
| 文件导出 | 可导出为 PNG/JPG | 可导出为 SVG 文件 |
| 无障碍 | 较差，需手动添加 ARIA | 较好，图形具备语义 |

### 2. 适用场景

| 场景 | 推荐技术 | 原因 |
|------|---------|------|
| 游戏开发 | Canvas | 每帧重绘，高性能 |
| 数据可视化（大量数据点） | Canvas | 万级节点性能更优 |
| 图片编辑器、滤镜 | Canvas | 像素级操作能力 |
| 图标、Logo、插图 | SVG | 矢量不失真 |
| 数据可视化（少量交互图形） | SVG | 图形可绑定事件 |
| 地图矢量图层 | Canvas + SVG 混用 | 底图 Canvas，交互层 SVG |

---

## 二、Canvas 基础

### 1. 创建 Canvas

在 HTML 中创建一个画布元素，必须指定宽高（CSS 设置的宽高会拉伸画布，导致变形）：

```html{1}
<!-- src/pages/canvas-demo.html -->
<!-- 通过 HTML 属性设置画布分辨率，不要用 CSS 设置 -->
<canvas id="myCanvas" width="800" height="600">
  你的浏览器不支持 Canvas，请升级浏览器。
</canvas>
```

::: warning 区分 Canvas 尺寸与 CSS 尺寸
`width`/`height` 属性设置的是**画布分辨率**（实际像素）；CSS 的 `width`/`height` 设置的是**显示尺寸**。如果两者不一致，图形会被拉伸或压缩变形。视网膜屏幕（devicePixelRatio=2）需要将画布分辨率设为显示尺寸的 2 倍并用 `scale(2, 2)` 处理。
:::

### 2. 获取绘图上下文

所有绘图操作都通过 2D 渲染上下文对象完成：

```javascript{3-4}
// src/scripts/canvas-init.js
const canvas = document.getElementById('myCanvas')
// 获取 2D 渲染上下文
const ctx = canvas.getContext('2d')

// 高清屏适配（可选）
function setupHDPI(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1
  const { width, height } = canvas.getBoundingClientRect()
  canvas.width = width * dpr
  canvas.height = height * dpr
  ctx.scale(dpr, dpr)
}
```

### 3. 坐标系统

Canvas 坐标系以**左上角为原点**，X 轴向右为正，Y 轴向下为正：

```
(0,0) ─────────────→ X+
  │
  │
  ↓
  Y+
```

---

## 三、基本图形绘制

### 1. 矩形

矩形是 Canvas 中唯一有独立绘制方法的图形：

```javascript{4-8}
// src/scripts/draw-rect.js
const ctx = document.getElementById('myCanvas').getContext('2d')

ctx.fillStyle = '#4A90E2'
ctx.fillRect(50, 50, 200, 100)      // 填充矩形：x, y, width, height

ctx.strokeStyle = '#E24A4A'
ctx.lineWidth = 3
ctx.strokeRect(300, 50, 200, 100)   // 描边矩形

ctx.clearRect(80, 80, 50, 50)       // 清除指定区域（变为透明）
```

### 2. 路径绘制

路径是 Canvas 绘图的核心，所有复杂图形都通过路径实现：

```javascript{3-10}
const ctx = document.getElementById('myCanvas').getContext('2d')

ctx.beginPath()           // 开始新路径（必须调用，否则路径会累积）
ctx.moveTo(100, 100)      // 移动到起点（不画线）
ctx.lineTo(200, 100)      // 从当前点画直线到目标点
ctx.lineTo(150, 200)      // 继续画线
ctx.closePath()           // 闭合路径（连接终点到起点）

ctx.fillStyle = '#7ED321'
ctx.fill()                // 填充路径内部
ctx.strokeStyle = '#417505'
ctx.lineWidth = 2
ctx.stroke()              // 描边路径
```

### 3. 圆形（arc）

`arc(x, y, radius, startAngle, endAngle, anticlockwise)` 绘制圆弧或圆：

```javascript
const ctx = document.getElementById('myCanvas').getContext('2d')

// 绘制完整圆形
ctx.beginPath()
ctx.arc(200, 200, 80, 0, Math.PI * 2)  // 圆心(200,200)，半径80，0到360度
ctx.fillStyle = '#F5A623'
ctx.fill()

// 绘制半圆
ctx.beginPath()
ctx.arc(450, 200, 80, 0, Math.PI)       // 0 到 180 度（下半圆）
ctx.strokeStyle = '#9B59B6'
ctx.lineWidth = 4
ctx.stroke()
```

### 4. 贝塞尔曲线

```javascript
const ctx = document.getElementById('myCanvas').getContext('2d')

// 二次贝塞尔曲线：quadraticCurveTo(控制点x, 控制点y, 终点x, 终点y)
ctx.beginPath()
ctx.moveTo(50, 200)
ctx.quadraticCurveTo(200, 50, 350, 200)
ctx.stroke()

// 三次贝塞尔曲线：bezierCurveTo(cp1x, cp1y, cp2x, cp2y, 终点x, 终点y)
ctx.beginPath()
ctx.moveTo(50, 400)
ctx.bezierCurveTo(100, 250, 300, 550, 350, 400)
ctx.strokeStyle = '#E74C3C'
ctx.stroke()
```

::: details 综合图形绘制示例

以下绘制一个包含矩形、圆形、三角形和曲线的综合图形：

```javascript
// src/scripts/shapes-demo.js
const canvas = document.getElementById('myCanvas')
const ctx = canvas.getContext('2d')

// 清空画布
ctx.clearRect(0, 0, canvas.width, canvas.height)

// 1. 填充矩形（蓝色）
ctx.fillStyle = '#3498DB'
ctx.fillRect(20, 20, 120, 80)

// 2. 描边矩形（带圆角效果用路径模拟）
ctx.beginPath()
ctx.roundRect?.(200, 20, 120, 80, 10) // Chrome 99+ 支持 roundRect
ctx.strokeStyle = '#2ECC71'
ctx.lineWidth = 3
ctx.stroke()

// 3. 圆形（橙色）
ctx.beginPath()
ctx.arc(420, 60, 40, 0, Math.PI * 2)
ctx.fillStyle = '#F39C12'
ctx.fill()

// 4. 等边三角形
ctx.beginPath()
const cx = 100, cy = 200, r = 50
for (let i = 0; i < 3; i++) {
  const angle = (Math.PI * 2 / 3) * i - Math.PI / 2
  const x = cx + r * Math.cos(angle)
  const y = cy + r * Math.sin(angle)
  i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
}
ctx.closePath()
ctx.fillStyle = '#9B59B6'
ctx.fill()
```

:::

---

## 四、样式与颜色

### 1. `fillStyle` 与 `strokeStyle`

两个属性都接受颜色值、渐变对象或图案对象：

```javascript
const ctx = canvas.getContext('2d')

// 纯色
ctx.fillStyle = '#FF6B6B'
ctx.fillStyle = 'rgba(255, 107, 107, 0.5)'

// 线性渐变
const linearGrad = ctx.createLinearGradient(0, 0, 400, 0)  // 起点到终点
linearGrad.addColorStop(0, '#667EEA')
linearGrad.addColorStop(1, '#764BA2')
ctx.fillStyle = linearGrad

// 径向渐变
const radialGrad = ctx.createRadialGradient(200, 200, 10, 200, 200, 100)
radialGrad.addColorStop(0, '#FFF')
radialGrad.addColorStop(1, '#FF6B6B')
ctx.fillStyle = radialGrad
```

### 2. 线条样式

| 属性 | 说明 | 可选值 |
|------|------|--------|
| `lineWidth` | 线条宽度（像素） | 数值，默认 1 |
| `lineCap` | 线条端点样式 | `butt`（平）/ `round`（圆）/ `square`（方） |
| `lineJoin` | 线条连接处样式 | `miter`（尖）/ `round`（圆）/ `bevel`（斜切） |
| `setLineDash()` | 虚线样式 | `[实线长, 间隔长]` |
| `lineDashOffset` | 虚线偏移量 | 数值（可用于动画） |

### 3. 阴影效果

```javascript
ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
ctx.shadowBlur = 15        // 阴影模糊半径
ctx.shadowOffsetX = 5      // 水平偏移
ctx.shadowOffsetY = 5      // 垂直偏移

ctx.fillStyle = '#3498DB'
ctx.fillRect(100, 100, 200, 150)

// 绘制完后清除阴影（避免影响后续绘制）
ctx.shadowColor = 'transparent'
```

---

## 五、文字渲染

### 1. `fillText` 与 `strokeText`

```javascript
ctx.font = 'bold 32px "PingFang SC", Arial, sans-serif'
ctx.fillStyle = '#2C3E50'

// 填充文字：fillText(文字, x, y, 最大宽度)
ctx.fillText('Hello Canvas', 100, 100)

// 描边文字
ctx.strokeStyle = '#E74C3C'
ctx.lineWidth = 1
ctx.strokeText('描边文字', 100, 160)
```

### 2. 字体设置

`font` 属性遵循 CSS font 简写语法：

```javascript
// 格式：[font-style] [font-weight] font-size[/line-height] font-family
ctx.font = 'italic bold 24px/1.5 Arial'
ctx.font = '16px "Helvetica Neue", Helvetica, Arial, sans-serif'
```

### 3. 文字测量（measureText）

`measureText()` 返回 `TextMetrics` 对象，可获取文字的渲染宽度：

```javascript{3-5}
ctx.font = '24px Arial'

const metrics = ctx.measureText('待测量文字')
const textWidth = metrics.width

// 文字居中对齐
const canvasWidth = canvas.width
ctx.textAlign = 'center'          // left | right | center | start | end
ctx.textBaseline = 'middle'       // top | middle | bottom | alphabetic
ctx.fillText('居中标题', canvasWidth / 2, 50)
```

---

## 六、图像处理

### 1. `drawImage` 绘制与缩放

`drawImage` 支持 3 种调用形式：

```javascript
const img = new Image()
img.src = './images/photo.jpg'

img.onload = () => {
  // 形式1：原始大小绘制
  ctx.drawImage(img, 50, 50)

  // 形式2：指定位置和尺寸（缩放）
  ctx.drawImage(img, 50, 200, 300, 200)  // x, y, width, height

  // 形式3：裁剪后绘制（9个参数）
  // drawImage(img, 源x, 源y, 源width, 源height, 目标x, 目标y, 目标width, 目标height)
  ctx.drawImage(img, 100, 50, 200, 150, 50, 450, 200, 150)
}
```

### 2. `getImageData` 与 `putImageData`

通过像素数组直接读写画布内容：

```javascript
// 读取画布像素数据
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
const pixels = imageData.data  // Uint8ClampedArray，每4个值为一个像素的 RGBA

// pixels[i]   = R（红，0-255）
// pixels[i+1] = G（绿，0-255）
// pixels[i+2] = B（蓝，0-255）
// pixels[i+3] = A（透明度，0-255）

// 修改后写回画布
ctx.putImageData(imageData, 0, 0)
```

### 3. 图片灰度滤镜

::: details 实现图片灰度滤镜

以下将一张彩色图片转换为灰度效果：

```javascript{10-14}
// src/scripts/grayscale-filter.js
const canvas = document.getElementById('filterCanvas')
const ctx = canvas.getContext('2d')

const img = new Image()
img.crossOrigin = 'anonymous'  // 跨域图片需要设置
img.src = './images/colorful-photo.jpg'

img.onload = () => {
  canvas.width = img.width
  canvas.height = img.height
  ctx.drawImage(img, 0, 0)

  // 获取像素数据
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    // 使用亮度加权公式（人眼对绿色更敏感）
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    data[i] = gray      // R
    data[i + 1] = gray  // G
    data[i + 2] = gray  // B
    // data[i+3] 透明度不变
  }

  ctx.putImageData(imageData, 0, 0)
}
```

:::

---

## 七、动画实现

### 1. requestAnimationFrame

Canvas 动画的标准实现方式是 `requestAnimationFrame`，相比 `setInterval` 的优势：

- 与显示器刷新频率同步（通常 60fps）
- 页面隐藏时自动暂停，节省性能
- 动画更加平滑，无丢帧问题

```javascript{5-15}
// src/scripts/animation-base.js
let x = 0
let animationId = null

function animate() {
  const ctx = canvas.getContext('2d')

  // 1. 清空上一帧
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 2. 绘制当前帧
  ctx.fillStyle = '#3498DB'
  ctx.beginPath()
  ctx.arc(x, 100, 30, 0, Math.PI * 2)
  ctx.fill()

  // 3. 更新状态
  x = (x + 2) % (canvas.width + 30)

  // 4. 请求下一帧
  animationId = requestAnimationFrame(animate)
}

// 开始动画
animate()

// 停止动画
function stopAnimation() {
  cancelAnimationFrame(animationId)
}
```

### 2. 粒子动画

::: details 粒子动画完整示例

以下实现一个在画布上飘散的粒子效果：

```javascript
// src/scripts/particle-system.js
const canvas = document.getElementById('particleCanvas')
const ctx = canvas.getContext('2d')
canvas.width = window.innerWidth
canvas.height = window.innerHeight

// 粒子类
class Particle {
  constructor() {
    this.reset()
  }

  reset() {
    this.x = Math.random() * canvas.width
    this.y = Math.random() * canvas.height
    this.radius = Math.random() * 4 + 1
    this.vx = (Math.random() - 0.5) * 2    // X 方向速度
    this.vy = (Math.random() - 0.5) * 2    // Y 方向速度
    this.alpha = Math.random() * 0.8 + 0.2 // 透明度
    this.color = `hsl(${Math.random() * 360}, 70%, 60%)`
  }

  update() {
    this.x += this.vx
    this.y += this.vy

    // 超出边界则重置
    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
      this.reset()
    }
  }

  draw() {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fillStyle = this.color
    ctx.globalAlpha = this.alpha
    ctx.fill()
    ctx.globalAlpha = 1
  }
}

// 创建 200 个粒子
const particles = Array.from({ length: 200 }, () => new Particle())

function animate() {
  ctx.fillStyle = 'rgba(10, 10, 20, 0.15)'  // 半透明覆盖制造拖尾效果
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  particles.forEach(p => {
    p.update()
    p.draw()
  })

  requestAnimationFrame(animate)
}

animate()
```

:::

---

## 八、SVG vs Canvas 选型指南

综合多个维度，帮助你做出正确的技术选型：

| 对比维度 | Canvas | SVG | 胜出 |
|---------|--------|-----|------|
| 大量对象性能（>1000） | 高（固定开销） | 低（每个节点占内存） | Canvas |
| 少量对象性能 | 相当 | 相当 | 平手 |
| 缩放/响应式 | 失真 | 完美矢量 | SVG |
| 交互事件 | 需手动计算 | 原生 DOM 事件 | SVG |
| 像素操作 | 支持 | 不支持 | Canvas |
| 文字渲染质量 | 受分辨率影响 | 矢量清晰 | SVG |
| 动画性能 | 高（手动控制） | 中（CSS/SMIL动画） | Canvas |
| 可访问性 | 需 ARIA 补充 | 原生语义 | SVG |
| 文件大小 | 固定（像素数据） | 随复杂度增加 | 视场景 |
| 学习成本 | 中（需掌握绘图API） | 低（类 HTML 标签） | SVG |

::: tip 实际项目建议
- **游戏 / 粒子 / 实时数据流**：选 Canvas
- **图标 / 插图 / 数据图表（ECharts/D3）**：选 SVG（ECharts 内部两者都用）
- **图片编辑器 / 滤镜处理**：必须用 Canvas
- **复杂交互图形（流程图/思维导图）**：SVG 更易维护
:::
