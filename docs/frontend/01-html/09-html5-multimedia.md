---
title: "HTML5 多媒体"
category: "前端 · HTML"
tags:
  - HTML
  - HTML5
  - 多媒体
excerpt: "HTML5 引入原生音视频标签，彻底告别 Flash 时代。本文系统讲解 video、audio、picture 标签的属性配置、JavaScript 控制、响应式图片适配以及媒体事件的完整用法。"
date: 2026-03-17
---

# HTML5 多媒体

## 一、多媒体元素概述

### 1. 为什么抛弃 Flash，选择原生多媒体

在 HTML5 之前，网页播放音视频必须依赖第三方插件（主要是 Adobe Flash），这带来了一系列问题：

| 问题 | 说明 |
|------|------|
| 安全漏洞多 | Flash 长期是黑客攻击的高发目标 |
| 移动端不支持 | iOS 系统从未支持 Flash，移动互联网时代致命缺陷 |
| 性能差 | Flash 是独立进程，内存占用高、耗电严重 |
| 无障碍差 | 屏幕阅读器无法识别 Flash 内容 |
| SEO 不友好 | 搜索引擎爬虫无法抓取 Flash 内容 |

HTML5 原生多媒体彻底解决了上述问题，Adobe 于 2020 年 12 月 31 日正式停止 Flash 支持。

### 2. `<audio>` 与 `<video>` 的共同特性

两个标签共享一套属性和 JavaScript API：

- 均支持 `<source>` 子元素提供多格式备用
- 均继承自 `HTMLMediaElement` 接口
- 均支持相同的媒体事件（play/pause/ended 等）
- 均可通过 JavaScript 完整控制播放行为

---

## 二、`<video>` 视频元素

### 1. 基本用法

在页面中嵌入一个带控制栏的视频播放器：

```html{1}
<!-- src/pages/video-demo.html -->
<video src="./videos/intro.mp4" controls width="800" height="450">
  你的浏览器不支持 HTML5 视频，请升级浏览器。
</video>
```

### 2. 常用属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `src` | string | 视频文件 URL |
| `controls` | boolean | 显示浏览器默认控制栏 |
| `autoplay` | boolean | 自动播放（需配合 `muted`）|
| `muted` | boolean | 静音（自动播放必须静音） |
| `loop` | boolean | 循环播放 |
| `poster` | string | 视频加载前显示的封面图 URL |
| `preload` | string | 预加载策略：`none` / `metadata` / `auto` |
| `width` / `height` | number | 播放器尺寸（CSS 控制更灵活） |
| `playsinline` | boolean | iOS 内联播放，禁止全屏自动播放 |

::: warning autoplay 限制
现代浏览器要求视频必须同时设置 `muted` 才能自动播放，否则会被浏览器策略阻止。这是防止页面打开时突然出声扰民的保护措施。
:::

### 3. 视频格式与 `<source>` 兼容写法

用 `<source>` 标签提供多格式备用，浏览器会选择第一个支持的格式：

```html{2-4}
<video controls poster="./images/cover.jpg">
  <source src="./videos/intro.webm" type="video/webm" />
  <source src="./videos/intro.mp4" type="video/mp4" />
  <source src="./videos/intro.ogv" type="video/ogg" />
  <p>你的浏览器不支持 HTML5 视频，<a href="./videos/intro.mp4">点击下载</a>。</p>
</video>
```

### 4. JavaScript 控制播放

`HTMLVideoElement` 继承自 `HTMLMediaElement`，提供完整的 JS 控制接口：

::: details JavaScript 控制视频播放示例

```javascript{5,9,13}
// src/scripts/video-controller.js
const video = document.getElementById('myVideo')

// 播放
video.play().catch(err => {
  console.error('播放失败:', err)
})

// 暂停
video.pause()

// 跳转到指定时间（秒）
video.currentTime = 30

// 设置音量（0 ~ 1）
video.volume = 0.5

// 静音切换
video.muted = !video.muted

// 播放速率（0.5 倍速 ~ 2 倍速）
video.playbackRate = 1.5

// 监听播放进度
video.addEventListener('timeupdate', () => {
  const progress = (video.currentTime / video.duration) * 100
  console.log(`播放进度: ${progress.toFixed(1)}%`)
})
```

:::

### 5. 自定义播放器

::: details 完整自定义播放器实现

以下实现一个包含播放/暂停、进度条、音量控制的自定义播放器：

```html
<!-- src/components/custom-player.html -->
<div class="player-wrapper">
  <video id="player" src="./videos/demo.mp4" class="player-video">
    你的浏览器不支持 HTML5 视频
  </video>

  <div class="player-controls">
    <!-- 播放/暂停按钮 -->
    <button id="playBtn" class="play-btn">播放</button>

    <!-- 进度条 -->
    <div class="progress-wrapper">
      <input type="range" id="progressBar" min="0" max="100" value="0" step="0.1" />
      <span id="timeDisplay">0:00 / 0:00</span>
    </div>

    <!-- 音量 -->
    <input type="range" id="volumeBar" min="0" max="1" value="1" step="0.05" />

    <!-- 全屏 -->
    <button id="fullscreenBtn">全屏</button>
  </div>
</div>

<script>
  const player = document.getElementById('player')
  const playBtn = document.getElementById('playBtn')
  const progressBar = document.getElementById('progressBar')
  const volumeBar = document.getElementById('volumeBar')
  const timeDisplay = document.getElementById('timeDisplay')

  // 播放/暂停
  playBtn.addEventListener('click', () => {
    if (player.paused) {
      player.play()
      playBtn.textContent = '暂停'
    } else {
      player.pause()
      playBtn.textContent = '播放'
    }
  })

  // 更新进度条
  player.addEventListener('timeupdate', () => {
    const pct = (player.currentTime / player.duration) * 100
    progressBar.value = isNaN(pct) ? 0 : pct

    const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
    timeDisplay.textContent = `${fmt(player.currentTime)} / ${fmt(player.duration || 0)}`
  })

  // 拖动进度条
  progressBar.addEventListener('input', () => {
    player.currentTime = (progressBar.value / 100) * player.duration
  })

  // 音量控制
  volumeBar.addEventListener('input', () => {
    player.volume = volumeBar.value
  })

  // 全屏
  document.getElementById('fullscreenBtn').addEventListener('click', () => {
    player.requestFullscreen?.()
  })

  // 播放结束
  player.addEventListener('ended', () => {
    playBtn.textContent = '播放'
    progressBar.value = 0
  })
</script>
```

:::

---

## 三、`<audio>` 音频元素

### 1. 基本用法

```html
<audio src="./audios/background.mp3" controls>
  你的浏览器不支持 HTML5 音频
</audio>
```

### 2. 常用属性与格式兼容

`<audio>` 与 `<video>` 共享大部分属性，主要差异是没有 `poster`、`width`、`height` 等视觉属性。

| 音频格式 | MIME 类型 | Chrome | Firefox | Safari |
|---------|----------|--------|---------|--------|
| MP3 | `audio/mpeg` | 支持 | 支持 | 支持 |
| OGG Vorbis | `audio/ogg` | 支持 | 支持 | 不支持 |
| WAV | `audio/wav` | 支持 | 支持 | 支持 |
| AAC | `audio/aac` | 支持 | 支持 | 支持 |
| WebM Opus | `audio/webm` | 支持 | 支持 | 部分支持 |

```html
<audio controls>
  <source src="./audios/music.ogg" type="audio/ogg" />
  <source src="./audios/music.mp3" type="audio/mpeg" />
  你的浏览器不支持 HTML5 音频
</audio>
```

### 3. JavaScript 控制音频

::: details 音频播放器 JavaScript 控制示例

```javascript
// src/scripts/audio-player.js
const audio = document.getElementById('bgMusic')

// 播放/暂停切换
function togglePlay() {
  if (audio.paused) {
    audio.play()
  } else {
    audio.pause()
  }
}

// 淡入效果（从 0 音量渐变到目标音量）
function fadeIn(targetVolume = 1, duration = 1000) {
  audio.volume = 0
  audio.play()

  const steps = 20
  const stepTime = duration / steps
  const stepVolume = targetVolume / steps

  const timer = setInterval(() => {
    if (audio.volume + stepVolume >= targetVolume) {
      audio.volume = targetVolume
      clearInterval(timer)
    } else {
      audio.volume += stepVolume
    }
  }, stepTime)
}

// 监听加载完成
audio.addEventListener('loadedmetadata', () => {
  console.log(`音频时长: ${audio.duration.toFixed(2)} 秒`)
})

// 监听播放错误
audio.addEventListener('error', (e) => {
  console.error('音频加载失败:', e.target.error)
})
```

:::

---

## 四、`<picture>` 与响应式图片

### 1. `<picture>` + `<source>` 用法

`<picture>` 元素允许你为不同条件提供不同图片，浏览器选择第一个匹配的 `<source>`，无匹配时回退到 `<img>`：

```html{2-5}
<picture>
  <!-- 大屏幕加载高清大图 -->
  <source media="(min-width: 1200px)" srcset="./images/hero-1920.webp" />
  <!-- 中等屏幕加载中等图片 -->
  <source media="(min-width: 768px)" srcset="./images/hero-1024.webp" />
  <!-- 默认小图（必须保留，作为兜底） -->
  <img src="./images/hero-480.jpg" alt="首页英雄区横幅" />
</picture>
```

### 2. `srcset` 和 `sizes` 属性

`srcset` 提供一组候选图片，`sizes` 告诉浏览器在不同视口宽度下图片实际占用的显示宽度：

```html
<img
  src="./images/product.jpg"
  srcset="
    ./images/product-480.jpg  480w,
    ./images/product-800.jpg  800w,
    ./images/product-1200.jpg 1200w
  "
  sizes="
    (max-width: 600px) 100vw,
    (max-width: 1024px) 50vw,
    33vw
  "
  alt="商品展示图"
/>
```

### 3. 不同分辨率适配

::: code-group

```html [按屏幕宽度适配]
<!-- 根据视口宽度加载不同尺寸的图片，节省流量 -->
<picture>
  <source media="(min-width: 1024px)" srcset="./images/banner-lg.webp" />
  <source media="(min-width: 480px)" srcset="./images/banner-md.webp" />
  <img src="./images/banner-sm.webp" alt="活动横幅" />
</picture>
```

```html [按像素密度适配]
<!-- 视网膜屏幕（2x/3x）加载高清图 -->
<img
  src="./images/logo.png"
  srcset="
    ./images/logo@1x.png 1x,
    ./images/logo@2x.png 2x,
    ./images/logo@3x.png 3x
  "
  alt="网站 Logo"
/>
```

```html [格式降级适配]
<!-- 支持 WebP 的浏览器加载 WebP，否则回退到 JPG -->
<picture>
  <source type="image/avif" srcset="./images/photo.avif" />
  <source type="image/webp" srcset="./images/photo.webp" />
  <img src="./images/photo.jpg" alt="风景照片" />
</picture>
```

:::

::: tip WebP 格式使用建议
WebP 相比 JPEG 平均减少 25-35% 的文件体积，相比 PNG 减少 25-45%，同时保持相近的视觉质量。目前所有主流浏览器均已支持 WebP，推荐在生产项目中使用 `<picture>` + WebP 格式，并保留 JPEG/PNG 作为兜底。
:::

---

## 五、媒体事件与 API

### 1. 常用媒体事件

| 事件名 | 触发时机 |
|--------|---------|
| `loadstart` | 开始加载媒体数据 |
| `loadedmetadata` | 媒体元数据（时长、尺寸）加载完成 |
| `loadeddata` | 当前帧数据可以播放 |
| `canplay` | 可以开始播放（但可能会中途缓冲） |
| `canplaythrough` | 可以流畅播放到结尾（无需缓冲） |
| `play` | 媒体开始播放 |
| `pause` | 媒体暂停 |
| `ended` | 媒体播放到末尾 |
| `timeupdate` | 播放位置（`currentTime`）发生变化 |
| `volumechange` | 音量或静音状态改变 |
| `seeking` | 开始跳转到指定时间点 |
| `seeked` | 跳转完成 |
| `error` | 媒体加载或播放出错 |
| `waiting` | 因数据不足而暂停等待 |

### 2. 媒体属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `duration` | number | 媒体总时长（秒），未加载时为 `NaN` |
| `currentTime` | number | 当前播放位置（秒），可赋值跳转 |
| `paused` | boolean | 是否处于暂停状态 |
| `ended` | boolean | 是否播放结束 |
| `volume` | number | 音量（0~1） |
| `muted` | boolean | 是否静音 |
| `playbackRate` | number | 播放速率（默认 1.0） |
| `readyState` | number | 加载就绪状态（0~4） |
| `buffered` | TimeRanges | 已缓冲的时间范围 |
| `networkState` | number | 网络加载状态 |

### 3. 进度条实现

::: details 带缓冲显示的进度条实现

以下实现一个同时显示播放进度和缓冲进度的进度条：

```html
<!-- src/components/progress-bar.html -->
<div class="progress-container" style="position: relative; height: 6px; background: #ddd; cursor: pointer;">
  <!-- 缓冲进度（灰色） -->
  <div id="bufferBar" style="position: absolute; height: 100%; background: #aaa; width: 0;"></div>
  <!-- 播放进度（红色） -->
  <div id="playBar" style="position: absolute; height: 100%; background: #e00; width: 0;"></div>
</div>

<script>
  const video = document.getElementById('myVideo')
  const bufferBar = document.getElementById('bufferBar')
  const playBar = document.getElementById('playBar')

  // 更新播放进度
  video.addEventListener('timeupdate', () => {
    const pct = (video.currentTime / video.duration) * 100
    playBar.style.width = `${pct}%`
  })

  // 更新缓冲进度
  video.addEventListener('progress', () => {
    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1)
      const pct = (bufferedEnd / video.duration) * 100
      bufferBar.style.width = `${pct}%`
    }
  })

  // 点击进度条跳转
  document.querySelector('.progress-container').addEventListener('click', (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    video.currentTime = ratio * video.duration
  })
</script>
```

:::
