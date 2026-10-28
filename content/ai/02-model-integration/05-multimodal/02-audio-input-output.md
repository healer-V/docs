---
title: "音频输入与输出"
tags:
  - OpenAI API
  - Speech to Text
  - Text to Speech
excerpt: "区分文件转写、语音生成与实时语音会话，完成非敏感测试语音的生成、格式检查和回转写验证，并说明各链路的时延与状态边界。"
date: 2026-09-28
---

# 音频输入与输出

音频应用至少包含三类不同链路：文件转写把音频变成文本，语音生成把文本变成音频，Realtime 会话持续处理双向音频和中断。它们的输入、时延和状态不同，**不能把两个离线接口串起来就宣称具备实时语音 Agent 能力**。

本文使用文字转语音生成一段虚构客服回复，再把生成的 WAV 文件提交转写，核对关键短语。整个过程不使用真实客服录音。

## 一、能力选择

### 1. 三类链路

| 任务 | 输入 | 输出 | 交互特征 | 适用场景 |
|------|------|------|----------|----------|
| 文件转写 | 完整或分段音频文件 | 文本、时间戳或说话人信息 | 有界请求 | 录音整理、字幕、质检 |
| 语音生成 | 文本、音色和表达要求 | MP3、WAV 等音频 | 有界请求，可流式播放 | 播报、无障碍、通知 |
| Realtime | 持续音频与会话事件 | 增量音频、文本和工具事件 | 长连接、可打断 | 低时延语音助手 |

已有文本 Agent 需要增加语音界面时，可以使用“转写 → 文本 Agent → 语音生成”链路。需要自然打断、连续会话和低延迟轮次时，应评估 Realtime API。

### 2. 时延组成

离线串联链路的总时延包括：录音结束、上传、转写、文本推理、语音生成和下载。实时系统还要处理音频分片、语音活动检测、播放缓冲和打断取消。

只测模型处理时间会低估用户实际等待。生产观测应分别记录首个转写事件、文本结果、首个音频字节和播放完成时间。

## 二、文件与格式

### 1. 转写输入

转写端点接收文件上传。支持格式和大小限制应以当前 File transcription 文档为准。应用需要在上传前检查：

- 文件扩展名与真实编码一致；
- 时长和大小在当前模型限制内；
- 声道、采样率和语言适合任务；
- 音频不包含未经授权的真实个人数据；
- 长录音已采用可追踪分段策略。

### 2. 语音输出

语音生成需要模型、voice、文本和输出格式。本文选择 WAV，便于用 Python 标准库读取声道、采样率和帧数。

```python
with client.audio.speech.with_streaming_response.create(
    model="gpt-4o-mini-tts",
    voice="coral",
    input="工单 CASE-1042 已转交导出支持队列。",
    response_format="wav",
) as response:
    response.stream_to_file("case-reply.wav")
```

生成语音面向终端用户时，应明确披露声音由 AI 生成。自定义声音还涉及说话人同意和额外资格要求，不能使用他人录音私自克隆。

::: danger 录音具有个人数据风险
真实通话可能包含身份、账户和支付信息。采集前必须确认告知与同意，上传前执行最小化和脱敏，并为原音频、转写文本和生成音频分别设置访问与删除策略。
:::

## 三、环境准备

创建独立目录并固定 SDK：

::: code-group

```powershell [PowerShell]
mkdir audio-roundtrip-demo
cd audio-roundtrip-demo
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install openai==3.19.2
```

```bash [Bash]
mkdir audio-roundtrip-demo && cd audio-roundtrip-demo
python3 -m venv .venv
source .venv/bin/activate
python -m pip install openai==3.19.2
```

:::

配置测试凭据。若组织或兼容服务没有对应音频模型权限，调用会返回能力或权限错误，不能自动换成未记录的模型。

```powershell
$env:OPENAI_API_KEY = "<你的测试项目密钥>"
$env:OPENAI_TTS_MODEL = "gpt-4o-mini-tts"
$env:OPENAI_TRANSCRIBE_MODEL = "gpt-transcribe"
```

::: info 当前环境未完成音频在线闭环
SDK 3.19.2 的转写与语音生成签名已核对，完整程序也通过 Python 语法检查。但当前兼容端点在 2026-09-28 对 WAV 请求返回 `200 text/html` 而不是音频，使用同一凭据连接官方端点又发生超时。因此本篇不能声称已经得到可播放 WAV 或真实转写结果；运行时必须先核对 HTTP `Content-Type` 与文件签名。
:::

## 四、往返验证

完整程序先生成 WAV，再读取文件属性，最后转写并核对工单号和队列名称。回转写不能证明声音自然，但能验证音频文件有效且关键内容可识别。

::: details 查看语音生成与转写完整程序

```python
# audio_roundtrip.py
import os
import wave
from dataclasses import dataclass
from pathlib import Path

from openai import OpenAI


@dataclass(frozen=True)
class WaveInfo:
    """保存 WAV 文件的基本可播放属性。"""

    channels: int
    sample_rate: int
    frames: int
    duration_seconds: float


def generate_speech(
    client: OpenAI,
    model: str,
    text: str,
    output_path: Path,
) -> None:
    """把非敏感客服文本生成 WAV 文件。

    Args:
        client: 已配置测试凭据的 OpenAI 客户端。
        model: 支持语音生成的模型标识。
        text: 需要播报的非空文本，不得包含真实客户数据。
        output_path: 目标 WAV 路径，将被新内容覆盖。

    Returns:
        无返回值；成功时完整写入 WAV 文件。
    """
    if not text.strip():
        raise ValueError("speech text must not be empty")
    with client.audio.speech.with_streaming_response.create(
        model=model,
        voice="coral",
        input=text,
        instructions="使用清晰、平静的普通话客服语气。",
        response_format="wav",
    ) as response:
        response.stream_to_file(output_path)


def inspect_wave(path: Path) -> WaveInfo:
    """读取 WAV 属性并计算时长。

    Args:
        path: 已存在的 PCM WAV 文件。

    Returns:
        声道、采样率、帧数和秒数。
    """
    with wave.open(str(path), "rb") as audio:
        frames = audio.getnframes()
        rate = audio.getframerate()
        return WaveInfo(
            channels=audio.getnchannels(),
            sample_rate=rate,
            frames=frames,
            duration_seconds=frames / rate,
        )


def transcribe_audio(client: OpenAI, model: str, path: Path) -> str:
    """转写 WAV 文件并返回文本。

    Args:
        client: 已配置测试凭据的 OpenAI 客户端。
        model: 支持文件转写的模型标识。
        path: 需要转写的非敏感 WAV 文件。

    Returns:
        去除首尾空白后的转写文本。
    """
    with path.open("rb") as audio_file:
        result = client.audio.transcriptions.create(
            model=model,
            file=audio_file,
            language="zh",
        )
    return result.text.strip()


def main() -> None:
    """生成测试语音，检查文件并执行回转写验证。"""
    client = OpenAI()
    output = Path("case-reply.wav")
    expected = "工单 CASE-1042 已转交 EXPORT-OPS 队列。"
    generate_speech(
        client,
        os.environ.get("OPENAI_TTS_MODEL", "gpt-4o-mini-tts"),
        expected,
        output,
    )
    info = inspect_wave(output)
    assert info.channels >= 1 and info.sample_rate > 0 and info.frames > 0

    transcript = transcribe_audio(
        client,
        os.environ.get("OPENAI_TRANSCRIBE_MODEL", "gpt-transcribe"),
        output,
    )
    normalized = transcript.upper().replace(" ", "")
    assert "CASE-1042" in normalized or "CASE1042" in normalized
    assert "EXPORT-OPS" in normalized or "EXPORTOPS" in normalized
    print(
        f"channels={info.channels} rate={info.sample_rate} "
        f"duration={info.duration_seconds:.2f}s"
    )
    print(f"transcript={transcript}")


if __name__ == "__main__":
    main()
```

:::

执行：

```powershell
python audio_roundtrip.py
```

成功输出应包含正数声道、采样率和时长，并在转写中保留 `CASE-1042` 与 `EXPORT-OPS`。标点、空格和大小写可能变化，因此校验只针对稳定业务标识。

## 五、结果判断

### 1. 转写质量

转写不能只看“有文本”。至少检查：

| 维度 | 核对方法 |
|------|----------|
| 关键实体 | 工单号、产品名、金额和日期是否保留 |
| 语言 | 是否识别为预期语言，混合语言是否丢失 |
| 完整性 | 开头、结尾和静音附近是否截断 |
| 时间信息 | 需要字幕时是否请求并校验时间戳 |
| 说话人 | 多人场景是否需要说话人分离模型 |

自动化测试可以使用合成固定短句；真实质量评测需要代表性噪声、口音、设备和专业词样本。

### 2. 语音质量

文件可播放只证明编码链路成功。自然度、清晰度、语速、情绪和品牌一致性仍需人工或专项评测。涉及数字、缩写和代码时，应重点核对发音是否可理解。

### 3. 实时边界

Realtime 会话还需要处理：

- 输入音频增量与输出音频增量；
- 会话状态和轮次边界；
- 语音活动检测；
- 用户打断与输出取消；
- 工具调用期间的占位反馈；
- WebRTC、WebSocket 或电话连接。

这些能力不能从文件转写与语音生成的成功结果推导出来。

## 六、失败诊断

| 现象 | 常见原因 | 处理 |
|------|----------|------|
| 文件无法打开 | 容器格式或编码损坏 | 用标准解码器检查真实格式 |
| 转写实体错误 | 发音、噪声或领域词不足 | 提供合法提示词、建立实体评测 |
| 生成文件为空 | 调用失败或流未完整写入 | 检查异常、文件大小和关闭流程 |
| WAV 读取失败 | 实际返回格式不是 WAV | 核对 `response_format` 与扩展名 |
| 延迟过高 | 串联阶段多或文件过长 | 分段、流式或评估 Realtime |
| 语音被当作真人 | 缺少 AI 声音披露 | 在交互和产品政策中明确标识 |

## 七、验证结论

文件转写、语音生成和 Realtime 是三个不同能力。本文的往返示例验证了 TTS 输出文件、WAV 编码属性、转写调用和关键实体保留，适合作为离线语音功能的最小接入闭环。

当前环境只完成 SDK 签名、程序语法和本地文件判据检查，在线往返仍受端点能力阻塞。即使在支持端点完成往返，也不能据此证明生产通话质量、实时打断或多人会话能力；上线前仍需针对真实声学条件建立独立评测，并完成隐私和声音披露要求。

## 八、参考资料

- [Audio and voice](https://developers.openai.com/api/docs/guides/audio)
- [File transcription](https://developers.openai.com/api/docs/guides/speech-to-text)
- [Text to speech](https://developers.openai.com/api/docs/guides/text-to-speech)
