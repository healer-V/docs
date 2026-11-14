---
title: "媒体来源 source 与字幕 track"
tags:
  - HTML
  - 媒体
  - source
  - track
  - WebVTT
excerpt: "说明 src 与嵌套 source 的优先关系、type 与候选顺序如何决定实际资源，并用 WebM、MP4 与两份 WebVTT 完成候选选择、字幕显示和失败诊断。"
date: 2026-11-14
---

# 媒体来源 source 与字幕 track

同一段视频可以用不同容器或编码发布，浏览器按自己的解码能力挑选一个；视频还可能需要字幕或画面描述，这些文字以单独的文本轨道提供。`source` 负责前者，`track` 负责后者。

这两件事都容易被“看起来能播”掩盖：页面播放成功，不代表浏览器选中的是你以为的那个文件；字幕没有出现，也不一定是时间写错。下面用两个真实候选文件和两份 WebVTT 把选择结果与文本状态读出来。

::: info 本篇的范围
本篇讲 `audio`/`video` 内嵌 `source` 的候选选择，以及 `track` 与 WebVTT 的基本用法。单来源音频、视频与封面见[音频 audio](./01-audio.md)、[视频 video](./02-video.md)。字幕编辑软件、音视频转码、播放器开发、跨来源授权配置和 WebVTT 样式扩展不在本篇展开。
:::

## 一、单来源与候选来源的关系

### 1. src 属性只给一个资源

`src` 属性写在 `audio` 或 `video` 的开始标签上，直接指定唯一资源：

```html
<video src="flower.mp4" controls width="480" height="270"></video>
```

它的优点是简单，缺点是浏览器没有第二个候选可选；资源不可解码时就只能失败。

### 2. 子元素 source 提供候选

不写 `src` 属性，改为在元素内部放多个 `source`，每个给出一个候选地址与类型：

```html
<video controls width="480" height="270">
  <source src="flower.webm" type="video/webm">
  <source src="flower.mp4" type="video/mp4">
</video>
```

浏览器按文档顺序逐个判断，选出一个它认为可以使用的资源。候选的 `src` 是相对页面解析的 URL，和 `src` 属性一样受路径影响。

### 3. src 与 source 不能混用

一旦元素上写了 `src` 属性，嵌套的 `source` 就不再参与选择。两者同时出现不仅没有“先试 src 再试 source”的效果，标记本身也不符合内容模型：

::: warning src 属性存在时不要嵌套 source
本次用 `src="flower.mp4"` 加一个 `source` 子元素做对照，浏览器只请求了 `flower.mp4`，没有请求 `source` 中的地址；本地 Nu 检查器报告“Element source not allowed as child of element video in this context”。需要候选时删掉 `src` 属性。
:::

## 二、source 的 type 与选择顺序

### 1. 浏览器按顺序尝试

`source` 的顺序就是尝试顺序。把 WebM 放在前面，支持 WebM 的浏览器会先选它；不支持时再考虑后面的 MP4。顺序不是“越靠前越优先”，而是“第一个能用的胜出”。

### 2. type 是提示，不是保证

`type="video/webm"` 帮助浏览器在发起请求前判断是否值得尝试，避免下载一个明显不支持的资源。它不能保证文件内容真的符合该类型，也不能保证浏览器解码成功；声明错误时，浏览器可能跳过可用资源，或请求后才发现无法播放。

### 3. 实际选择看 currentSrc 与请求

元素当前的 `currentSrc` 返回浏览器最终选中的绝对地址，Network 面板则显示实际请求了哪些文件。两者结合才能证明“选中了哪个候选”，只看页面能播放是不够的。

```js
const clip = document.getElementById('clip');
clip.currentSrc;
```

### 4. 播放中途失败不会自动换下一个

候选选择发生在开始加载阶段。已经选定的资源在播放中途出错时，浏览器通常不会自动回退到下一个 `source`；需要重新加载并重新选择，或由应用自行处理。不要把 `source` 列表当成运行期容错机制。

## 三、track 的用途与语言声明

### 1. kind 区分文本轨道的用途

`track` 的 `kind` 描述这条轨道的用途：`captions` 是包含声音信息的字幕，`subtitles` 是对话翻译，`descriptions` 是画面描述，`chapters` 是章节，`metadata` 供脚本使用。用途不同，辅助技术与默认显示策略也不同。

### 2. src、srclang 与 label

`src` 指向 WebVTT 文件，`srclang` 声明文本语言，`label` 是用户在轨道菜单中看到的名称。`srclang` 对 `subtitles` 轨道是必需的；其他用途也建议写明，避免语言信息只存在于文件名里。

### 3. default 决定初始轨道

带 `default` 的轨道在加载后默认启用。没有 `default` 时，轨道通常处于禁用状态，用户需要从控件菜单中手动选择；不能用 CSS 或 `autoplay` 代替这个声明。

### 4. 文本轨道需要同源

`track` 的 `src` 默认要求与页面同源；跨来源加载需要相应的 CORS 许可。把字幕放在另一个域名下却没有配置响应头时，媒体可能正常播放而字幕始终不出现。这一点本篇未做跨域实测，按标准要求说明。

## 四、WebVTT 时间段与验证

### 1. WEBVTT 文件头

WebVTT 文件以 `WEBVTT` 开头，后面可以跟空行与提示信息。缺少这一行时，浏览器不会把它当成有效文本轨道，常见表现是轨道存在但没有任何 cue。

### 2. 时间戳与文本

每条 cue 由时间行和文本组成，时间格式为 `时:分:秒.毫秒 --> 时:分:秒.毫秒`，箭头两侧各留空格。文本可以多行，空行分隔下一条 cue；时间必须递增且不能重叠到无法解释的程度。

### 3. 创建两份 VTT

在 `html-tracks` 目录创建 `captions.vtt` 与 `descriptions.vtt`。示例视频没有对白，因此字幕内容明确写成演示说明，不冒充原声翻译：

::: details 查看 captions.vtt 完整内容

```text [captions.vtt]
WEBVTT

00:00:00.000 --> 00:00:02.000
演示字幕：花朵在画面中轻微摇动。

00:00:02.000 --> 00:00:05.000
演示字幕：素材来自公开示例视频，没有对白。
```

:::

::: details 查看 descriptions.vtt 完整内容

```text [descriptions.vtt]
WEBVTT

00:00:00.000 --> 00:00:05.000
画面描述：浅色背景前有一朵花，花茎随风摆动。
```

:::

### 4. 观察字幕按时间段出现

页面声明两条轨道，字幕设为默认显示：

::: details 查看 tracks.html 完整内容

```html [tracks.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>候选来源与文本轨道</title>
</head>
<body>
  <h1>候选来源与文本轨道</h1>
  <video id="clip" controls width="480" height="270" preload="metadata" playsinline>
    <source src="flower.webm" type="video/webm">
    <source src="flower.mp4" type="video/mp4">
    <track kind="captions" src="captions.vtt" srclang="zh" label="中文字幕" default>
    <track kind="descriptions" src="descriptions.vtt" srclang="zh" label="画面描述">
    你的浏览器不支持 video 元素，请直接下载 flower.mp4 播放。
  </video>
</body>
</html>
```

:::

下载两个候选文件并启动服务：

```bash
curl -L -o flower.webm https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm
curl -L -o flower.mp4 https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4
python3 -m http.server 8000
```

访问 `http://localhost:8000/tracks.html` 并点击播放。前两秒应显示第一条字幕，约两秒后切换为第二条；打开控件中的字幕菜单，可以看到“中文字幕”和“画面描述”两个名称。

在 Console 中读取轨道与当前资源：

```js
const clip = document.getElementById('clip');
clip.currentSrc;
Array.from(clip.textTracks).map((t) => [t.kind, t.label, t.language, t.mode]);
```

本次读到 `currentSrc` 为 `flower.webm`，字幕轨道 `mode` 为 `showing` 且有 2 条 cue，画面描述轨道 `mode` 为 `disabled`。播放到 0.79 秒和 1.59 秒时活动 cue 是第一条，2.39 秒后变为第二条。

| 观察项 | 表达式或操作 | 本次结果 |
|--------|--------------|----------|
| 选中候选 | `currentSrc` | `flower.webm` |
| 实际请求 | Network | 只请求 `flower.webm` 与 `captions.vtt`，没有请求 MP4 |
| 默认字幕 | `textTracks[0].mode` | `showing`，2 条 cue |
| 未选轨道 | `textTracks[1].mode` | `disabled` |
| 字幕切换 | 播放到约 2 秒 | 第一条切换为第二条 |

## 五、失败资源与跨来源限制

### 1. VTT 路径错误

把字幕 `src` 改成 `missing.vtt` 后刷新：Network 出现 404，轨道仍处于 `showing` 状态但 cue 数为 0，Console 报告资源加载失败。这说明“轨道已启用”不等于“文本已加载”，判断时要同时看请求与 cue 数量。

### 2. 缺少 WEBVTT 头或时间写错

去掉文件首行 `WEBVTT`，或把时间写成 `00:00:02 --> 00:00:03` 之类不符合要求的格式，轨道可能加载成功但没有可显示内容。修复应从文件内容入手，而不是反复调整 `track` 属性。

### 3. type 声明与实际文件不符

把 WebM 候选的 `type` 写成 `video/mp4`，浏览器可能基于错误提示跳过或尝试后失败。应让 `type` 与实际容器一致；不确定时，宁可省略 `type` 让浏览器请求后判断，也不要随意填写。

| 注入的问题 | 现象 | 判断与处理 |
|------------|------|------------|
| 子元素 `source` 与 `src` 属性并存 | 只请求 `src`，Nu 报告结构错误 | 删除 `src`，只保留候选 |
| VTT 路径错误 | 404，轨道 `mode` 为 `showing` 但 cue 为 0 | 修正同源路径 |
| 缺少 `WEBVTT` 头 | 轨道无 cue | 补回文件头 |
| `type` 与实际容器不符 | 候选被跳过或加载失败 | 改对类型或省略 `type` |

### 4. 验证记录

以上文件于 2026-11-14 在 macOS 的 Chrome 157.0.8103.79 中核对。两个候选从 MDN 交互示例的公开 CC0 地址下载，分别为 WebM 554,058 字节与 MP4 1,128,375 字节；页面通过 `python3 -m http.server` 同源访问。实际选中 `flower.webm`，Network 只出现该媒体与 `captions.vtt` 请求；字幕在 0.79、1.59 秒为第一条，2.39 秒起为第二条；默认轨道 `showing`、另一条 `disabled`。

`src` 与 `source` 并存的对照只请求 `flower.mp4`，且 Nu 报告结构错误；`missing.vtt` 对照得到 404 与 0 条 cue。`tracks.html` 经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。本次没有验证跨来源字幕、其他浏览器、字幕样式、章节轨道或媒体中途失败后的恢复行为。
