---
title: "Canvas 绘图基础"
tags:
  - HTML
  - Canvas
  - 图形
excerpt: "解释 canvas 的位图尺寸与显示尺寸、2D 上下文和最小绘制步骤，用独立页面画出矩形、圆和文字，并核对缩放、尺寸变更后的清空与替代信息边界。"
date: 2026-11-14
---

# Canvas 绘图基础

`canvas` 在页面中提供一块位图绘图区。它本身不描述图形，只提供一个可被脚本绘制的像素画布；矩形、圆和文字都是脚本调用绘图接口后写入像素的结果。因此，“页面上看到图”不等于“文档里有对应的元素”。

使用它要分清三个尺寸与两层结构：元素的 `width`、`height` 属性决定**位图有多少像素**，CSS 决定**这块位图在页面上显示多大**，而 `getContext("2d")` 取得的是往位图上绘制的接口。

::: info 本篇的范围
本篇讲 Canvas 的位图尺寸、2D 上下文与最小静态绘制。内联 SVG 的结构化图形见[内联 SVG](./05-inline-svg.md)；图片元素的基础见[图片 img](../02-content-elements/05-images.md)。动画循环、像素处理、WebGL、图像滤镜、图表库和高分屏适配的完整方案不在本篇展开。
:::

## 一、Canvas 元素与位图模型

### 1. canvas 声明一块位图区域

最小声明只需要元素本身：

```html
<canvas id="board" width="600" height="300"></canvas>
```

没有脚本时，这块区域是透明的，页面上看不到任何图形。`canvas` 不会根据标签内文字自动画图，也不会把 HTML 子元素渲染进位图。

### 2. width 与 height 是位图尺寸

`canvas` 的 `width`、`height` 是内容属性，单位是像素，决定位图的实际分辨率。省略时默认是 300×150。它们与 CSS 的 `width`、`height` 不是同一套东西：前者改变像素数量，后者只改变显示大小。

### 3. 标签内文字是回退内容

开始标签与结束标签之间的文字，只在用户代理不支持 `canvas` 时作为替代内容出现。正常浏览器不会显示它，也不会把它交给辅助技术代替图形；图形的可理解信息需要另找位置表达。

## 二、位图尺寸与显示尺寸

### 1. CSS 尺寸只改变显示

给 `canvas` 写 `width: 300px`，元素在页面上变窄，但 `canvas.width` 仍是 600。位图没有被重新采样成更小的文件，只是每个像素被压得更小显示。

### 2. 放大缩小都不增加细节

把 600 像素宽的位图显示成 1200 像素宽，画面会变模糊；显示成 300 像素宽，细节被压缩。两种情况下位图数据都不变。需要更清晰的图形，应增加位图尺寸并重新绘制，而不是只改 CSS。

### 3. 修改 width/height 会重置位图

给 `canvas.width` 或 `canvas.height` 赋新值，会把位图清空为透明，绘图状态也回到初始值。这不是“缩放现有内容”，而是换了一块新画布；**修改尺寸后必须重新绘制**。

```js
canvas.width = 300;   // 位图被清空
draw();               // 按新尺寸重新画
```

### 4. 高分屏需要自行处理像素比

设备像素比大于 1 时，一个 CSS 像素对应多个物理像素。只按 CSS 尺寸设置位图会让图形显得模糊，常见做法是按比例放大位图再用 CSS 缩回。本篇示例不处理这一点，相关数值与显示效果未在本次验证中覆盖。

## 三、取得上下文并绘制

### 1. getContext("2d") 可能返回 null

绘图前先取得上下文，并检查它是否可用：

```js
const canvas = document.getElementById("board");
const context = canvas.getContext("2d");

if (context === null) {
  document.body.insertAdjacentText("beforeend", "当前浏览器没有提供 2D 绘图上下文。");
} else {
  draw();
}
```

上下文不存在时继续调用绘图方法会报错，因此要先判断再使用。`"2d"` 是上下文类型，写错类型同样会得到 `null`。

### 2. 坐标原点在左上角

2D 上下文的坐标原点在位图左上角，x 向右增大，y 向下增大。`fillRect(40, 60, 180, 120)` 表示从 `(40, 60)` 开始画一个宽 180、高 120 的矩形，而不是以中心为基准。

### 3. fillStyle 与 fillRect

`fillStyle` 设置填充颜色，`fillRect` 按给定位置和尺寸填入实心矩形。颜色可以是 CSS 颜色字符串；设置后对后续填充生效，直到再次修改。

```js
context.fillStyle = "#336699";
context.fillRect(40, 60, 180, 120);
```

### 4. beginPath、arc 与 stroke

画圆需要先开始一条路径，再用 `arc` 描述圆弧，最后填充或描边：

```js
context.beginPath();
context.arc(400, 140, 70, 0, Math.PI * 2);
context.fillStyle = "#e07b39";
context.fill();
context.strokeStyle = "#33475b";
context.lineWidth = 4;
context.stroke();
```

`arc` 的参数依次是圆心 x、圆心 y、半径、起始角、结束角和方向；`Math.PI * 2` 表示一整圈。路径只在当前绘制中有效，新的 `beginPath` 会丢弃未使用的旧路径。

### 5. clearRect 与重绘

`clearRect(0, 0, canvas.width, canvas.height)` 把整块位图清成透明。重绘前先清空可以避免旧图形残留；`fillRect` 只覆盖自己占用的区域，不会自动擦掉其他像素。

## 四、从空目录绘制并核对

### 1. 创建 canvas.html

新建空目录 `html-canvas`，创建 UTF-8 文件 `canvas.html`。页面绘制矩形、圆和文字，并提供三个按钮对照显示尺寸与位图尺寸：

::: details 查看 canvas.html 完整内容

```html [canvas.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>Canvas 绘图</title>
  <style>
    canvas { border: 1px solid #33475b; }
    .scaled { width: 300px; height: 150px; }
  </style>
</head>
<body>
  <h1>Canvas 绘图</h1>
  <p>图中有两个图形：左侧蓝色矩形，右侧橙色圆；下方写着 Canvas。</p>
  <canvas id="board" width="600" height="300" aria-label="蓝色矩形与橙色圆的示意图">
    你的浏览器不支持 canvas，图形内容见上方文字说明。
  </canvas>
  <p>
    <button id="shrink" type="button">把位图改成 300×150 并重绘</button>
    <button id="restore" type="button">恢复 600×300 并重绘</button>
    <button id="stretch" type="button">只用 CSS 缩小显示</button>
  </p>
  <script>
    const canvas = document.getElementById("board");
    const context = canvas.getContext("2d");

    /** 按当前位图尺寸重绘固定坐标的图形；无返回值。 */
    function draw() {
      context.clearRect(0, 0, canvas.width, canvas.height);

      context.fillStyle = "#336699";
      context.fillRect(40, 60, 180, 120);

      context.beginPath();
      context.arc(400, 140, 70, 0, Math.PI * 2);
      context.fillStyle = "#e07b39";
      context.fill();
      context.strokeStyle = "#33475b";
      context.lineWidth = 4;
      context.stroke();

      context.fillStyle = "#222222";
      context.font = "28px sans-serif";
      context.fillText("Canvas", 40, 240);
    }

    if (context === null) {
      document.body.insertAdjacentText("beforeend", "当前浏览器没有提供 2D 绘图上下文。");
    } else {
      draw();
    }

    document.getElementById("shrink").addEventListener("click", () => {
      canvas.width = 300;
      canvas.height = 150;
      draw();
    });

    document.getElementById("restore").addEventListener("click", () => {
      canvas.width = 600;
      canvas.height = 300;
      draw();
    });

    document.getElementById("stretch").addEventListener("click", () => {
      canvas.classList.add("scaled");
    });
  </script>
</body>
</html>
```

:::

### 2. 核对像素与尺寸

双击打开页面，应看到左侧蓝色矩形、右侧橙色圆和下方 `Canvas` 文字。在 Console 读取尺寸与像素：

```js
const board = document.getElementById("board");
const context = board.getContext("2d");
board.width;
board.height;
context.getImageData(60, 80, 1, 1).data;
context.getImageData(400, 140, 1, 1).data;
context.getImageData(10, 10, 1, 1).data;
```

本次读到位图尺寸为 `600`×`300`；矩形内部像素为 `rgba(51,102,153,255)`，对应 `#336699`；圆内部为 `rgba(224,123,57,255)`，对应 `#e07b39`；左上角背景为 `rgba(0,0,0,0)`，即透明。

### 3. 依次做三种尺寸对照

1. 点击“只用 CSS 缩小显示”：元素显示宽度约为 300 像素，`board.width` 仍为 600；画面整体缩小。
2. 点击“把位图改成 300×150 并重绘”：`board.width` 变为 300，绘制坐标不变，右侧圆落在位图之外，因此看不到；矩形仍在原位。
3. 点击“恢复 600×300 并重绘”：位图重新变大并重绘，两个图形都回来。

若在修改尺寸后不调用 `draw()`，整块位图会是透明的，这就是“改尺寸会清空”的直接证据。

| 观察项 | 表达式或操作 | 本次结果 |
|--------|--------------|----------|
| 位图尺寸 | `board.width` / `board.height` | `600` / `300` |
| 矩形像素 | `getImageData(60, 80, …)` | `rgba(51,102,153,255)` |
| 圆像素 | `getImageData(400, 140, …)` | `rgba(224,123,57,255)` |
| 背景像素 | `getImageData(10, 10, …)` | `rgba(0,0,0,0)` |
| 仅 CSS 缩小 | 点击对应按钮 | 显示宽度约 300，`board.width` 仍为 600 |
| 改位图尺寸 | 设为 300×150 并重绘 | 圆超出范围消失，矩形保留 |
| 改尺寸不重绘 | 赋值后直接读像素 | 位图变为透明 |

### 4. 检查上下文不可用时的分支

在 Console 执行 `board.getContext("not-a-context")`，应得到 `null`；这与页面中 `getContext("2d")` 返回对象的情况不同。把页面脚本里的 `"2d"` 临时改成这个错误类型，刷新后页面应显示那段替代文字，而不是抛出后续绘图错误。改回 `"2d"` 后恢复图形。

## 五、图形的替代信息与适用边界

### 1. 位图没有 DOM 语义

画进位图的矩形、圆和文字都不是文档节点，选择器查不到它们，辅助技术也无法从像素推断结构。`canvas` 元素本身可有一个可访问名称，但图形内部不因此获得描述。

### 2. 相邻文字与可访问名称

本例在图形上方用文字说明“左侧蓝色矩形，右侧橙色圆”，并给 `canvas` 加了 `aria-label`。这两处信息独立于像素，即使图形不可见也能读到；标签内文字只在元素不被支持时才有意义，不能当作常规说明。

### 3. 何时不该用 Canvas

需要可选中文字、可缩放不失真、可被搜索或需要单独交互的图形，通常更适合 HTML 或 SVG。Canvas 适合大量像素绘制、逐帧重绘或需要像素级控制的场景；本篇只覆盖静态绘制，不据此推断动画与性能表现。

| 需求 | Canvas 的表现 | 更合适的做法 |
|------|----------------|--------------|
| 图形随容器缩放不失真 | 位图放大会模糊 | 增加位图尺寸重绘，或改用 SVG |
| 图形内部可访问、可搜索 | 像素不提供结构 | 相邻文字、SVG 或 HTML |
| 少量静态示意图 | 需要脚本才能出现 | 直接用 HTML/SVG |
| 大量像素逐帧绘制 | 适合，但涉及动画循环 | 超出本篇范围，另行学习 |

### 4. 验证记录

以上文件于 2026-11-14 在 macOS 的 Chrome 157.0.8103.79 中核对。页面为独立静态 HTML，无外部资源；位图 600×300，矩形与圆内部像素值、透明背景、CSS 缩小后位图尺寸不变、改位图尺寸后圆消失、改尺寸不重绘时位图清空，以及错误上下文类型返回 `null`，均按上表实际读取。

`canvas.html` 经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。本次未验证动画、高分屏像素比处理、其他浏览器、像素级字体差异或辅助技术的实际朗读。
