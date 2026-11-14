---
title: "视频 video"
tags:
  - HTML
  - 媒体
  - video
excerpt: "用一段本地 MP4 说明 video 的单来源声明、显示尺寸与原始分辨率的区别、封面与预加载属性，并核对播放、控制、比例缩放和资源失败的实际表现。"
date: 2026-11-14
---

# 视频 video

`video` 把一段视频放进页面，并可以让浏览器提供播放控制。它和 `audio` 共享大部分媒体属性，但多了一件必须分清的事：**元素在页面上占多大，和视频文件本身有多少像素，是两件事**。声明 480×270 不会把 960×540 的视频重新编码成小文件，只是改变显示尺寸。

本篇先讲单来源视频的声明，再讲尺寸、封面与播放属性，最后用官方演示素材完成下载、播放和错误对照。

::: info 本篇的范围
本篇讲单来源视频、显示尺寸、封面和基本播放属性。音频的加载属性与状态接口见[音频 audio](./01-audio.md)，多来源候选与字幕见[媒体来源 source 与字幕 track](./03-sources-tracks.md)。视频转码、HLS/DASH、DRM、自定义播放器界面和编码参数优化不在本篇展开。
:::

## 一、视频资源与 video 元素

### 1. src 与 controls 声明单来源视频

最小可用声明是一个地址加原生控件：

```html
<video src="flower.mp4" controls width="480" height="270"></video>
```

`src` 指向资源 URL，`controls` 让浏览器提供播放、进度、音量和全屏入口。与音频一样，没有 `controls` 时元素只是不显示控件，并不会因此停止加载或禁止脚本播放。

### 2. 标签内文字仍只是回退内容

开始标签与结束标签之间的文字，只在用户代理不支持 `video` 元素时提供替代信息。正常浏览器里看不到它；资源 404、编码不支持或自动播放被拒时，也不会自动显示这段文字。

### 3. 单来源先把播放跑通

`video` 也可以嵌套多个 `source` 提供候选格式，但那属于来源选择问题。先用一个 `src` 确认资源可解码、路径正确、控件可用，再增加候选，能把“资源问题”和“选择逻辑问题”分开。

## 二、显示尺寸与原始分辨率

### 1. width 与 height 是显示尺寸

`width` 和 `height` 是 HTML 属性，决定元素在页面中的显示尺寸，单位是 CSS 像素。它们同时帮助浏览器在视频加载前预留空间，减少布局跳动。

### 2. videoWidth 与 videoHeight 是像素数据尺寸

`videoWidth` 和 `videoHeight` 读取的是解码后视频帧的像素尺寸。加载元数据后即可读取，与元素声明多大无关。本例素材是 960×540，声明 480×270 后仍读到 960×540。

### 3. CSS 缩放不改变像素数据

用 CSS 把元素宽度改成 240 像素，元素显示变小，但 `videoWidth` 仍是 960。放大到超过原始尺寸也不会增加细节，只会让像素变大。要真正改变文件分辨率，需要重新编码，而不是改属性。

### 4. 声明尺寸与画面比例要匹配

只改 `width` 不改 `height`，或比例与素材不一致时，画面会被拉伸或留边。保持 16:9 的比例可以让 960×540 的素材按预期显示；确需裁切或留边时，应由 CSS 的 `object-fit` 明确表达，而不是靠随手写一个高度。

::: warning 声明尺寸不等于压缩
把 `width` 改成 240 不会让网络少下载字节，也不会让移动端更省流量。需要小文件时应在发布前转码，或提供另一份资源。
:::

## 三、封面、预加载与播放属性

### 1. poster 是播放前的一张图

`poster` 指定一张图片，在视频尚未播放或没有可用画面时显示。它不是视频的第一帧，也不是视频本身；封面可以单独替换，视频内容不变。没有 `poster` 时，浏览器可能显示空白或第一帧，具体取决于实现。

### 2. preload、loop 与 muted

`preload` 仍是提示：`none`、`metadata`、`auto` 表达希望预加载的程度，浏览器可以按网络与平台策略调整。`loop` 让播放结束后回到开头，`muted` 让元素以静音开始。这些属性的含义与音频一致，见[音频 audio](./01-audio.md)。

### 3. autoplay 与 playsinline

`autoplay` 请求自动开始播放，能否成功取决于浏览器与系统的自动播放策略；有声自动播放通常需要用户交互或更高权限。`playsinline` 用于提示移动端在页面内播放，而不是自动进入全屏；它不保证所有平台都按同一方式处理。

::: warning 自动播放不能当作功能前提
移动端浏览器还可能要求静音、要求用户手势，或直接忽略 `autoplay`。需要用户观看的内容应提供明确的播放按钮，并在播放失败时给出可见提示，而不是假定页面一打开就会播放。
:::

### 4. 播放状态读数

`paused`、`currentTime`、`duration`、`readyState`、`networkState` 与 `error` 的用法与音频相同。视频额外提供 `videoWidth`、`videoHeight` 描述当前帧尺寸，`poster` 读取封面地址。判断“是否真的在播放”要看 `paused` 与 `currentTime` 是否增长，而不是只看控件图标。

## 四、从空目录取得素材并播放

### 1. 下载官方演示视频

新建空目录 `html-video`，在其中下载 MDN 交互示例使用的 CC0 演示视频。该地址是公开素材入口，文件为 MP4 容器：

```bash
curl -L -o flower.mp4 https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4
```

本次下载得到 1,128,375 字节的文件。外部地址可能调整；下载失败时应改用自己录制或已有的视频，而不是把失效链接当成页面代码问题。素材仅用于本地观察，不再分发。

### 2. 创建 poster.svg 与 video.html

在同一目录创建封面 `poster.svg`，它是一份独立的矢量图，不依赖图片生成工具：

::: details 查看 poster.svg 完整内容

```xml [poster.svg]
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270" role="img" aria-label="视频封面：等待播放">
  <rect width="480" height="270" fill="#e8eef5"/>
  <circle cx="240" cy="135" r="36" fill="#336699"/>
  <path d="M228 115 L228 155 L262 135 Z" fill="#ffffff"/>
  <text x="240" y="215" text-anchor="middle" font-size="18" fill="#33475b">点击播放</text>
</svg>
```

:::

再创建页面，声明单来源、显示尺寸、封面与内联播放：

::: details 查看 video.html 完整内容

```html [video.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>单来源视频</title>
</head>
<body>
  <h1>单来源视频</h1>
  <video id="clip" src="flower.mp4" controls width="480" height="270"
         poster="poster.svg" preload="metadata" playsinline>
    你的浏览器不支持 video 元素，请直接下载 flower.mp4 播放。
  </video>
</body>
</html>
```

:::

### 3. 启动服务并手动播放

在 `html-video` 目录启动静态服务：

```bash
python3 -m http.server 8000
```

访问 `http://localhost:8000/video.html`。页面应先显示封面与播放控件，控件上显示总时长约 5 秒。点击播放后画面开始移动，进度与时间同步变化；这说明请求、解码与播放链路都正常。

### 4. 观察尺寸与播放状态

在 Console 中读取尺寸和状态：

```js
const clip = document.getElementById('clip');
clip.videoWidth;
clip.videoHeight;
clip.duration;
clip.readyState;
clip.canPlayType('video/mp4');
```

本次加载后读到 `videoWidth` 为 `960`、`videoHeight` 为 `540`、`duration` 为 `5.055`、`readyState` 为 `4`，`canPlayType('video/mp4')` 返回 `"maybe"`。把元素 CSS 宽度设为 `240px` 后，显示宽度变为 240，`videoWidth` 仍为 960。

| 观察项 | 表达式或操作 | 本次结果 |
|--------|--------------|----------|
| 像素尺寸 | `videoWidth` / `videoHeight` | `960` / `540` |
| 时长 | `duration` | `5.055` 秒 |
| 数据准备 | `readyState` | `4` |
| 类型支持 | `canPlayType('video/mp4')` | `"maybe"` |
| 声明尺寸 | `width` / `height` 属性 | 显示为 480×270 |
| CSS 缩小 | 元素宽度改为 240 | 显示 240，`videoWidth` 仍为 960 |
| 播放 | 点击后读取 `currentTime` | 约 0.9 秒后为 `0.87`，`paused` 为 `false` |

## 五、定位编码、路径与自动播放问题

### 1. 请求 404 先查路径

把 `src` 改成不存在的 `missing.mp4` 后刷新，Network 中应看到 404，元素进入错误状态：本次 `error.code` 为 `4`，`networkState` 为 `3`。这与音频一致：`4` 表示来源不可用，不专指编码错误。

### 2. 编码与容器都要匹配

`.mp4` 只是容器后缀，内部编码仍需浏览器支持。一个后缀正确但编码不受支持的文件，可能加载元数据失败或播放时报解码错误。`canPlayType()` 返回 `"maybe"` 只说明浏览器认为自己可能支持该类型字符串，不能替代实际播放测试。

### 3. 尺寸异常先看声明与比例

画面被拉伸时，先检查 `width` 与 `height` 的比例是否与素材一致；画面模糊时，检查是否把 CSS 尺寸放得远大于原始分辨率。把封面当成第一帧、把显示尺寸当成压缩，都会导致错误判断。

| 注入的问题 | 现象 | 判断与处理 |
|------------|------|------------|
| `src` 路径错误 | 404，`error.code` 为 `4` | 修正路径，核对同源目录 |
| 容器可识别但编码不支持 | 元数据或解码失败 | 换用可解码的编码或转码 |
| `width` 与 `height` 比例不符 | 画面拉伸 | 按素材比例声明，或用 `object-fit` |
| 依赖 `autoplay` | 可能保持暂停 | 提供手动播放入口与失败提示 |
| 缺少 `poster` | 播放前可能空白 | 用封面图明确初始状态 |

### 4. 验证记录

以上文件于 2026-11-14 在 macOS 的 Chrome 157.0.8103.79 中核对。素材从 MDN 交互示例的公开 CC0 地址下载，得到 MP4 文件 1,128,375 字节；页面通过 `python3 -m http.server` 同源访问，`poster.svg` 与 `flower.mp4` 均返回 200，封面在播放前可见，点击页面后在 Console 调用 `play()` 使 `currentTime` 增至约 0.87 秒，`paused` 为 `false`。

CSS 宽度改为 240 后元素显示宽度为 240，`videoWidth` 保持 960；缺失路径产生 404、`error.code` 为 `4`、`networkState` 为 `3`。`video.html` 以 HTML 模式、`poster.svg` 以 SVG 模式经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查，均无错误、无警告。本次没有验证其他浏览器、移动端 `playsinline` 行为、全屏、字幕或不同编码的兼容范围。
