---
title: "HTML4 与 HTML5 全面对比"
category: "前端 · HTML"
tags:
  - HTML
  - HTML5
excerpt: "从文档结构、语义标签、多媒体支持、表单功能到 Web API 能力，全面对比 HTML4 与 HTML5 的差异，帮助你理解 HTML5 革命性改进背后的设计思路，以及如何正确处理废弃特性和兼容性问题。"
date: 2026-03-17
---

# HTML4 与 HTML5 全面对比

## 一、版本背景

### 1. 发展历史

| 版本 | 发布年份 | 主要特点 |
|------|---------|---------|
| HTML 2.0 | 1995 | 第一个正式规范 |
| HTML 3.2 | 1997 | 添加表格、脚本支持 |
| HTML 4.01 | 1999 | 最后一个经典 HTML 版本，区分 Strict/Transitional/Frameset |
| XHTML 1.0 | 2000 | 用 XML 语法重写 HTML4，更严格但实际推广失败 |
| XHTML 2.0 | 放弃 | W3C 与 WHATWG 路线分歧，WHATWG 另起炉灶做 HTML5 |
| HTML5 | 2014 | W3C 正式发布，WHATWG 维护 Living Standard，持续演进至今 |

### 2. 为什么需要 HTML5

HTML5 的诞生背景是 Web 应用化趋势与移动互联网的崛起：

- **Web 应用化**：Gmail（2004）、Google Maps（2005）等 Web 应用出现，证明浏览器可以替代桌面软件，但 HTML4 的能力远远不够
- **移动端崛起**：iPhone（2007）不支持 Flash，倒逼行业寻找原生多媒体替代方案
- **Flash 困局**：Flash 性能差、安全漏洞多、无法被搜索引擎索引，开发者需要退出机制
- **标准滞后**：HTML4 发布后 W3C 转向 XHTML 路线，长达 10 年没有更新 HTML 标准

::: tip HTML5 是「活标准」
HTML5 发布后，W3C 和 WHATWG 均维护其规范，但 WHATWG 的 Living Standard 是真正持续演进的版本。这意味着 HTML5 没有终态，新特性（如 `<dialog>`、`popover` API）持续加入，浏览器跟进实现。
:::

---

## 二、文档结构变化

### 1. DOCTYPE 声明对比

::: code-group

```html [HTML5]
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>页面标题</title>
  </head>
  <body>
    <!-- 内容 -->
  </body>
</html>
```

```html [HTML4.01 Strict]
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"
  "http://www.w3.org/TR/html4/strict.dtd">
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>页面标题</title>
  </head>
  <body>
    <!-- 内容 -->
  </body>
</html>
```

```html [HTML4.01 Transitional]
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
  "http://www.w3.org/TR/html4/loose.dtd">
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>页面标题</title>
  </head>
  <body>
    <!-- 内容 -->
  </body>
</html>
```

:::

HTML5 的 `<!DOCTYPE html>` 是历史上最短的 DOCTYPE，它告诉浏览器使用标准模式渲染，不再引用 DTD 文件。

### 2. 字符集声明简化

| 版本 | 声明语法 |
|------|---------|
| HTML4 | `<meta http-equiv="Content-Type" content="text/html; charset=utf-8">` |
| HTML5 | `<meta charset="UTF-8">` |

### 3. `lang` 属性规范

HTML5 规范推荐在 `<html>` 元素上声明语言，有助于屏幕阅读器、翻译工具和搜索引擎正确处理内容：

```html
<html lang="zh-CN">  <!-- 简体中文 -->
<html lang="zh-TW">  <!-- 繁体中文 -->
<html lang="en-US">  <!-- 美式英语 -->
```

---

## 三、语义化标签对比

### 1. HTML4 vs HTML5 语义标签对照

| HTML4 写法 | HTML5 替代标签 | 语义含义 |
|-----------|--------------|---------|
| `<div id="header">` | `<header>` | 页眉/区块头部 |
| `<div id="nav">` | `<nav>` | 导航区域 |
| `<div id="main">` | `<main>` | 页面主体（唯一） |
| `<div class="article">` | `<article>` | 独立完整的内容单元 |
| `<div class="section">` | `<section>` | 内容分区 |
| `<div id="sidebar">` | `<aside>` | 附属/侧边内容 |
| `<div id="footer">` | `<footer>` | 页脚/区块尾部 |
| `<div class="figure">` | `<figure>` | 独立媒体块 |
| `<span class="time">` | `<time>` | 日期/时间 |
| `<span class="mark">` | `<mark>` | 高亮文本 |

### 2. 完整页面结构对比

::: code-group

```html [HTML5 语义化结构]
<!-- 结构清晰，标签即语义 -->
<body>
  <header>
    <h1>网站名称</h1>
    <nav>
      <ul>
        <li><a href="/">首页</a></li>
        <li><a href="/about">关于</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <article>
      <header>
        <h2>文章标题</h2>
        <time datetime="2026-03-17">2026年3月17日</time>
      </header>
      <section>
        <h3>第一节</h3>
        <p>内容...</p>
      </section>
    </article>

    <aside>
      <h3>相关文章</h3>
      <ul>...</ul>
    </aside>
  </main>

  <footer>
    <p>&copy; 2026 版权所有</p>
  </footer>
</body>
```

```html [HTML4 div 嵌套结构]
<!-- 无语义，全靠 id/class 约定 -->
<body>
  <div id="header">
    <h1>网站名称</h1>
    <div id="nav">
      <ul>
        <li><a href="/">首页</a></li>
        <li><a href="/about">关于</a></li>
      </ul>
    </div>
  </div>

  <div id="main">
    <div class="article">
      <div class="article-header">
        <h2>文章标题</h2>
        <span class="date">2026年3月17日</span>
      </div>
      <div class="section">
        <h3>第一节</h3>
        <p>内容...</p>
      </div>
    </div>

    <div id="sidebar">
      <h3>相关文章</h3>
      <ul>...</ul>
    </div>
  </div>

  <div id="footer">
    <p>&copy; 2026 版权所有</p>
  </div>
</body>
```

:::

---

## 四、多媒体支持对比

### 1. 视频嵌入对比

HTML4 时代嵌入视频需要借助 Flash 的 `<object>`/`<embed>` 标签，代码复杂且有大量浏览器兼容性处理：

::: code-group

```html [HTML5 原生视频]
<!-- 简洁、无插件依赖 -->
<video controls poster="./cover.jpg">
  <source src="./video.webm" type="video/webm" />
  <source src="./video.mp4" type="video/mp4" />
  <p>你的浏览器不支持 HTML5 视频</p>
</video>
```

```html [HTML4 Flash 嵌入视频]
<!-- 需要用户安装 Flash 插件，代码冗长 -->
<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"
        codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=8,0,0,0"
        width="800" height="450">
  <param name="movie" value="./player.swf" />
  <param name="flashvars" value="file=./video.flv" />
  <embed src="./player.swf"
         type="application/x-shockwave-flash"
         width="800" height="450"
         flashvars="file=./video.flv">
  </embed>
</object>
```

:::

---

## 五、表单功能对比

### 1. input type 新增列表

HTML5 新增的 input type 让浏览器原生提供输入控件和校验：

| HTML4 的替代方案 | HTML5 新 type | 原生能力 |
|----------------|--------------|---------|
| `type="text"` + JS 校验 | `type="email"` | 格式校验 + 移动端邮件键盘 |
| `type="text"` + JS 校验 | `type="url"` | URL 格式校验 |
| `type="text"` + JS 限制 | `type="number"` | 只允许数字 + 步进控件 |
| `type="text"` + JS 日历 | `type="date"` | 原生日期选择器 |
| `type="text"` + JS 滑块 | `type="range"` | 原生滑块控件 |
| 无 | `type="color"` | 原生颜色选择器 |
| `type="text"` + JS | `type="tel"` | 移动端电话键盘 |
| `type="text"` | `type="search"` | 带清除按钮的搜索框 |

### 2. 验证方式对比

::: code-group

```html [HTML5 原生验证]
<!-- 零 JS 代码实现常见验证 -->
<form>
  <input
    type="email"
    name="email"
    required
    placeholder="请输入邮箱"
  />
  <input
    type="text"
    name="phone"
    pattern="^1[3-9]\d{9}$"
    title="请输入11位手机号"
    required
  />
  <input
    type="number"
    name="age"
    min="18"
    max="120"
    step="1"
  />
  <button type="submit">提交</button>
</form>
```

```html [HTML4 全靠 JavaScript 验证]
<!-- 需要手写所有验证逻辑 -->
<form onsubmit="return validateForm()">
  <input type="text" name="email" id="email" />
  <input type="text" name="phone" id="phone" />
  <input type="text" name="age" id="age" />
  <button type="submit">提交</button>
</form>

<script>
function validateForm() {
  const email = document.getElementById('email').value
  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailReg.test(email)) {
    alert('请输入有效邮箱')
    return false
  }

  const phone = document.getElementById('phone').value
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    alert('请输入11位手机号')
    return false
  }

  const age = parseInt(document.getElementById('age').value)
  if (isNaN(age) || age < 18 || age > 120) {
    alert('年龄须在 18-120 之间')
    return false
  }

  return true
}
</script>
```

:::

---

## 六、图形与动画对比

HTML4 没有任何原生图形绘制能力，需要依赖图片或 Flash；HTML5 内置了 Canvas 和 SVG 两套图形技术：

| 能力 | HTML4 | HTML5 |
|------|-------|-------|
| 位图绘制 | 无（依赖 Flash/Java Applet） | Canvas 2D API |
| 矢量图形 | 需引用外部 SVG 文件 | `<svg>` 直接内联 |
| 动画 | 只能用 GIF 图 / Flash | Canvas 动画 + CSS3 动画 + SVG 动画 |
| 图表 | Flash 图表库（如 FusionCharts） | ECharts / D3.js（基于 Canvas/SVG） |
| 粒子效果 | Flash | Canvas + requestAnimationFrame |

---

## 七、API 能力对比

| 功能需求 | HTML4 实现方式 | HTML5 原生 API |
|---------|--------------|--------------|
| 客户端存储 | Cookie（4KB，随请求发送） | localStorage / sessionStorage / IndexedDB |
| 实时双向通信 | 轮询（setInterval + Ajax） | WebSocket |
| 服务器推送 | 长轮询（Long Polling） | Server-Sent Events（SSE） |
| 后台多线程计算 | 无（单线程，阻塞 UI） | Web Workers |
| 设备地理位置 | 无 | Geolocation API |
| 访问摄像头/麦克风 | 无 | getUserMedia（MediaDevices API） |
| 系统通知 | 无 | Notifications API |
| 文件读取 | 无（需服务端中转） | File API + FileReader |
| 原生拖拽 | 无（需手动实现 mousemove） | Drag and Drop API |
| 离线应用 | 无 | Service Worker + Cache API |
| 页面可见性检测 | 无 | Page Visibility API |
| 剪贴板操作 | 无 | Clipboard API |

---

## 八、废弃与移除的特性

::: danger 以下标签和属性在 HTML5 中已废弃，不应再使用

**废弃的表现类标签**（职责应交由 CSS 处理）：

| 废弃标签 | HTML5 替代方案 |
|---------|--------------|
| `<center>` | CSS `text-align: center` |
| `<font>` | CSS `font-family`、`font-size`、`color` |
| `<big>` | CSS `font-size: larger` |
| `<small>` | CSS `font-size: smaller`（注意：`<small>` 标签保留但语义改为免责声明/版权） |
| `<strike>` / `<s>` | CSS `text-decoration: line-through`（`<s>` 保留但语义为不再准确） |
| `<u>` | CSS `text-decoration: underline`（`<u>` 保留但语义为注音/专名线） |
| `<tt>` | `<code>` 或 `<kbd>` |
| `<acronym>` | `<abbr>` |
| `<applet>` | `<object>` 或 JS 模块 |
| `<frameset>` / `<frame>` | CSS 布局 + `<iframe>` |
| `<noframes>` | 直接移除 |

**废弃的表现类属性**（样式属性应写在 CSS 中）：

| 废弃属性 | 影响标签 | CSS 替代 |
|---------|---------|---------|
| `align` | `div`、`p`、`table` | `text-align` / `margin: auto` |
| `bgcolor` | `body`、`table`、`td` | CSS `background-color` |
| `border` | `table`、`img` | CSS `border` |
| `cellpadding` / `cellspacing` | `table` | CSS `padding` / `border-spacing` |
| `width` / `height` | `table`、`td`、`img`（部分情况） | CSS `width` / `height` |
| `valign` | `td`、`th` | CSS `vertical-align` |
| `hspace` / `vspace` | `img` | CSS `margin` |

:::

---

## 九、浏览器兼容性处理

### 1. HTML5 新特性的 polyfill 方案

Polyfill 是用 JavaScript 为旧浏览器补充缺失的 HTML5 原生 API 的代码库：

| 需要 polyfill 的特性 | 常用库 |
|---------------------|--------|
| HTML5 语义化标签（IE8） | `html5shiv` |
| CSS 媒体查询（IE8） | `respond.js` |
| `Promise` | `es6-promise` |
| `fetch` API | `whatwg-fetch` |
| `IntersectionObserver` | `intersection-observer` |
| `localStorage` | `localstorage-polyfill` |

### 2. 特性检测（Modernizr）

相比 `navigator.userAgent` 嗅探浏览器版本，特性检测更加可靠：

```javascript
// 不推荐：通过 UserAgent 判断
if (navigator.userAgent.indexOf('MSIE') !== -1) {
  // IE 特有处理
}

// 推荐：直接检测特性是否存在
if ('geolocation' in navigator) {
  navigator.geolocation.getCurrentPosition(pos => {
    console.log(pos.coords.latitude, pos.coords.longitude)
  })
} else {
  console.log('浏览器不支持 Geolocation API')
}

// 检测 Canvas 支持
function supportsCanvas() {
  const canvas = document.createElement('canvas')
  return !!(canvas.getContext && canvas.getContext('2d'))
}
```

::: details 使用 Modernizr 检测 Canvas 支持

Modernizr 是专业的特性检测库，一次检测数十种 HTML5/CSS3 特性：

```html
<!-- 在 <head> 中引入 Modernizr（建议按需定制构建） -->
<script src="https://cdn.jsdelivr.net/npm/modernizr@3.11.7/modernizr.min.js"></script>

<script>
  // Modernizr.canvas 为 true/false
  if (Modernizr.canvas) {
    console.log('支持 Canvas，加载 Canvas 相关代码')
    initCanvasApp()
  } else {
    console.log('不支持 Canvas，降级显示静态图片')
    document.getElementById('canvasContainer').innerHTML =
      '<img src="./fallback.png" alt="统计图表" />'
  }

  // 批量检测
  const features = {
    canvas: Modernizr.canvas,
    webgl: Modernizr.webgl,
    geolocation: Modernizr.geolocation,
    localStorage: Modernizr.localstorage,
    websocket: Modernizr.websockets,
  }
  console.table(features)
</script>
```

:::

---

## 十、HTML5 核心价值总结

| 对比维度 | HTML4 | HTML5 |
|---------|-------|-------|
| 文档声明 | 冗长的 DTD 声明（3种模式） | `<!DOCTYPE html>` 一行搞定 |
| 字符集声明 | `meta http-equiv` 长格式 | `<meta charset="UTF-8">` |
| 页面结构 | 全靠 `<div>` + id/class 约定 | 语义标签：header/nav/main/article/footer |
| 多媒体 | 依赖 Flash/Java Applet 插件 | `<audio>`/`<video>` 原生支持 |
| 表单验证 | 完全依赖 JavaScript | 原生 type/required/pattern/min/max 属性 |
| 图形绘制 | 无原生能力 | Canvas 2D + WebGL + SVG |
| 客户端存储 | Cookie（4KB，随请求发送） | localStorage/sessionStorage/IndexedDB |
| 实时通信 | 轮询（低效高延迟） | WebSocket（全双工低延迟） |
| 多线程 | 无（单线程阻塞 UI） | Web Workers（后台线程） |
| 离线应用 | 无 | Service Worker + Cache API（PWA） |
| 设备能力 | 无 | 地理位置/摄像头/麦克风/传感器 |
| 响应式图片 | 无（只能 CSS 缩放） | `<picture>` + `srcset`/`sizes` |
| 脚本加载 | 同步阻塞渲染 | `defer`/`async` 异步加载 |
| 废弃方向 | 表现与结构混杂 | 结构语义化，样式交给 CSS |
