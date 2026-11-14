---
title: "音频 audio"
tags:
  - HTML
  - 媒体
  - audio
excerpt: "从生成一段本地 WAV 开始，解释 audio 的 src、controls、preload、loop、muted 与 autoplay，区分加载、播放和错误状态，并核对自动播放策略与缺失资源的实际表现。"
date: 2026-11-14
---

# 音频 audio

`audio` 把一段音频资源放进页面，并允许浏览器提供播放控制。它本身不合成声音、不转换编码，也不保证某个资源一定能被当前浏览器解码；它只声明“这里有一段音频，请按下面的设置加载和播放”。

理解这个元素要分清三层：资源地址（`src`）、播放设置（`controls`、`preload`、`loop`、`muted`、`autoplay`），以及播放后的状态（是否暂停、播放到第几秒、加载失败没有）。本篇用一段自行生成的 WAV 完成手动播放、循环与失败诊断。

::: info 本篇的范围
本篇讲单来源音频的声明、播放属性与最小状态观察。同一媒体提供多个来源、字幕与文本轨道见[媒体来源 source 与字幕 track](./03-sources-tracks.md)；视频的显示尺寸与封面见[视频 video](./02-video.md)。Web Audio 合成、编码转换、播放器界面开发和自动播放策略的内部实现不在本篇展开。
:::

## 一、音频元素与资源的关系

### 1. src 指向一个音频资源

最小声明只需要一个地址：

```html
<audio src="tone.wav" controls></audio>
```

`src` 里写的是资源 URL，不是音频数据本身。浏览器据此发起请求，再由自身的解码能力判断能否播放；地址返回 200 也不等于内容一定可解码。

### 2. controls 提供原生操作入口

没有 `controls` 时，`audio` 元素默认不显示任何界面。加上它以后，浏览器提供一套自己的播放、暂停、进度和音量控件。控件的外观、快捷键和额外菜单由浏览器与平台决定，不能要求各环境长得一样。

### 3. 无声元素不等于没有加载

没有 `controls` 的音频不会在页面上占出可见区域，但它仍可能按 `preload` 的提示请求资源。需要用户操作的音频应保留 `controls`，或者由页面提供自己的按钮并调用播放接口。

## 二、加载提示与播放属性

### 1. preload 是提示，不是保证

`preload` 可以取 `none`、`metadata` 或 `auto`，表达作者希望浏览器在播放前预先加载到什么程度。它是一项提示：浏览器可以按网络状况、流量设置或平台策略改变实际行为，不能把 `preload="none"` 理解成“绝不会发出请求”，也不能把 `preload="auto"` 理解成“一定下载完整文件”。

### 2. loop 与 muted 是播放设置

`loop` 让播放到结尾后回到开头继续；`muted` 让元素以静音状态开始。两者都不改变文件内容，也不影响资源能否解码。`loop` 在很短的素材上会频繁回到开头，观察时容易误以为时间没有前进。

### 3. autoplay 是请求，不是保证

`autoplay` 表示希望资源就绪后自动开始播放。浏览器通常会限制没有用户交互的有声自动播放，移动端还可能要求内联播放或静音；这些规则属于平台策略，不属于 HTML 语法。

::: warning 不要依赖自动播放完成关键操作
自动播放可能被拒绝，且拒绝方式不一定表现为可见错误。需要用户确认的播放应保留 `controls` 或提供明确的播放按钮；不能把“页面打开就会响”当成交互设计的前提。
:::

### 4. 标签内文字只是回退内容

`audio` 开始标签与结束标签之间的文字，是给**不支持该元素**的用户代理准备的替代内容。它不会在正常浏览器里显示，也不会在资源 404、解码失败或自动播放被拒时自动出现。

::: warning 回退文本不是错误提示
把“音频加载失败”写在 `audio` 标签内部，正常浏览器不会显示它。资源失败需要脚本监听 `error` 事件，或在页面中另设状态区域。
:::

## 三、播放状态的最小接口

### 1. play() 返回 Promise

`play()` 请求开始播放，并返回一个 Promise。调用被策略拒绝时会进入失败分支，例如 `NotAllowedError`；忽略这个 Promise 会让失败变得无声无息。

```js
const audio = document.getElementById('tone');
audio.play().catch((error) => {
  console.log('播放未开始：', error.name);
});
```

### 2. paused、currentTime 与 duration

`paused` 表示当前是否暂停，`currentTime` 是播放位置（秒），`duration` 是资源时长。刚加载完元数据时 `duration` 就可用，`currentTime` 从 0 开始；播放过程中它应随时间增长，暂停后停止增长。

### 3. readyState 与 networkState 分属两层

`readyState` 描述当前可播放的数据准备程度，`networkState` 描述网络加载状态。两者不能互相替代：数据已足够播放时，网络可能仍在加载后面的部分；网络已停止请求时，也可能只是暂时不需要更多数据。

| 读数 | 含义 | 常见取值 |
|------|------|----------|
| `readyState` | 已缓冲到可以做什么 | `0` 无信息、`1` 有元数据、`2` 有当前帧、`3` 有未来数据、`4` 足够播放到结尾 |
| `networkState` | 网络加载处于什么阶段 | `0` 空、`1` 空闲、`2` 加载中、`3` 无可用来源 |

### 4. 加载失败看 error

资源不可用时，元素会进入错误状态，`error.code` 给出大类：`1` 中止、`2` 网络错误、`3` 解码错误、`4` 来源不支持。**`4` 不专指“文件格式写错”**：404 返回的错误页面无法当作媒体解码，同样会落到这一类。

## 四、从空目录生成并播放提示音

### 1. 生成 WAV 文件

新建空目录 `html-audio`，在其中创建 `make_tone.py`。这个脚本只用 Python 3.9 及以上标准库写出 1.2 秒、440 Hz、低音量的单声道 PCM WAV；不需要读懂采样算法，也不需要安装音频库：

::: details 查看 make_tone.py 完整内容

```python [make_tone.py]
import math
import struct
import wave

SAMPLE_RATE = 44100
DURATION = 1.2
FREQUENCY = 440
AMPLITUDE = 0.2

frames = bytearray()
total = int(SAMPLE_RATE * DURATION)
for index in range(total):
    value = AMPLITUDE * math.sin(2 * math.pi * FREQUENCY * index / SAMPLE_RATE)
    frames += struct.pack("<h", int(value * 32767))

with wave.open("tone.wav", "wb") as wav:
    wav.setnchannels(1)
    wav.setsampwidth(2)
    wav.setframerate(SAMPLE_RATE)
    wav.writeframes(frames)
```

:::

在 `html-audio` 目录执行：

```bash
python3 make_tone.py
```

生成 `tone.wav`，本次得到的文件为 105,884 字节，采样率 44100 Hz、16 位、单声道、52920 帧，时长 1.2 秒。音量已压到较低水平，但仍建议先调低系统音量再试听。

### 2. 创建 audio.html

在同一目录创建 `audio.html`，使用单来源、原生控件与循环播放：

::: details 查看 audio.html 完整内容

```html [audio.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>单来源音频</title>
</head>
<body>
  <h1>单来源音频</h1>
  <p>播放一段约 1.2 秒的低音量提示音。</p>
  <audio id="tone" src="tone.wav" controls preload="metadata" loop>
    你的浏览器不支持 audio 元素，请直接下载 tone.wav 播放。
  </audio>
</body>
</html>
```

:::

### 3. 启动本地服务

在 `html-audio` 目录启动静态服务，再访问页面：

```bash
python3 -m http.server 8000
```

浏览器打开 `http://localhost:8000/audio.html`。直接双击 HTML 用 `file://` 打开时音频通常也能播放，但通过 HTTP 访问可以让资源请求在开发者工具中按正常状态码出现，便于定位路径问题；本篇后续观察都基于这个地址。

::: tip 为什么不用外部音频地址
示例只使用当前目录生成的 `tone.wav`，不依赖站内文件、示例工程或第三方链接。外部地址一旦失效，页面现象会从“属性问题”变成“网络问题”，不利于初学者判断原因。
:::

### 4. 观察状态与错误

点击原生控件的播放按钮，应听到提示音；观察进度走完 1.2 秒后回到开头继续，因为声明了 `loop`。在 Console 中读取状态：

```js
const audio = document.getElementById('tone');
audio.duration;
audio.readyState;
audio.networkState;
audio.canPlayType('audio/wav');
```

本次加载完成后读到 `duration` 为 `1.2`、`readyState` 为 `4`、`networkState` 为 `1`，`canPlayType('audio/wav')` 返回 `"maybe"`。`"maybe"` 只表示浏览器认为可能可以播放，不是成功保证。

再点击暂停，`audio.paused` 应为 `true`；继续播放时 `audio.currentTime` 恢复增长。随后把 `src` 改成不存在的 `missing.wav` 并刷新，Network 中应出现 404，元素进入错误状态：

| 观察项 | 表达式或操作 | 本次结果 |
|--------|--------------|----------|
| 时长 | `audio.duration` | `1.2` |
| 数据准备 | `audio.readyState` | `4` |
| 网络状态 | `audio.networkState` | `1` |
| 类型支持 | `audio.canPlayType('audio/wav')` | `"maybe"` |
| 循环播放 | 播放到结尾后继续观察 | `1.01` 秒后回到 `0.01` 秒继续播放 |
| 缺失资源 | `src="missing.wav"` | 请求 404，`error.code` 为 `4`，`networkState` 为 `3` |

## 五、定位路径、格式与自动播放问题

### 1. 404 先从请求地址查起

资源不响应时，先看 Network 中请求的完整路径与状态码，再对照文件实际位置和大小写。把 `src` 改成相对路径后，浏览器按页面地址解析，目录层级写错不会因为文件名正确而自动修复。

### 2. 格式问题看解码，不看后缀

文件后缀不能证明容器和编码。一个后缀为 `.wav` 的文件如果是别的编码，浏览器仍可能解码失败并给出 `error.code` 为 `3`；反过来，404 的 HTML 错误页会得到 `4`。判断时结合实际响应、文件头和浏览器读数，而不是只看扩展名。

### 3. 自动播放要看当前策略

创建两个副本，一个给 `audio` 加 `autoplay`，另一个再加 `muted`，在不点击页面的情况下分别打开。本次观察中，未静音的版本始终处于暂停，静音版本在加载后约 2 秒开始播放；这只记录当前环境的结果，不能当作所有浏览器的规则。

| 注入的问题 | 现象 | 判断与处理 |
|------------|------|------------|
| `src` 文件名写错 | 404，`error.code` 为 `4` | 修正路径，不看后缀猜原因 |
| 内容与后缀不符 | 解码失败，`error.code` 为 `3` | 换用真实可解码的资源 |
| 未静音 `autoplay` | 保持 `paused` | 改为用户手动播放或静音自动播放 |
| 标签内写错误提示 | 页面上看不到 | 用脚本监听 `error` 另设状态区域 |

### 4. 验证记录

以上两个文件于 2026-11-14 在 macOS 的 Chrome 157.0.8103.79 中核对。WAV 参数与时长来自生成后的文件读取；页面通过 `python3 -m http.server` 于同源地址访问，点击页面后在 Console 调用 `play()` 观察播放位置增长、`pause()` 后停止、`loop` 在 1.2 秒处回绕，以及缺失资源时的 404、`error.code` 与 `networkState`。

自动播放的两个副本也在同一环境观察：未静音版本保持暂停，静音版本在加载后约 2 秒开始，未据此推断其他浏览器或移动端的策略。`audio.html` 经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。本次没有逐像素操作原生控件，没有验证其他浏览器、移动端内联播放、Web Audio 或真实业务播放器。
