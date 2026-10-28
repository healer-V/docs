---
title: "流式事件"
tags:
  - OpenAI API
  - SSE
  - Python
excerpt: "按 Responses API 的 SSE 事件消费文本增量，聚合完整内容，并以 response.completed 而不是连接结束判断请求成功。"
date: 2026-09-28
---

# 流式事件

流式响应把一次完整结果拆成按顺序到达的 Server-Sent Events（SSE，服务器发送事件）。应用可以在模型仍在生成时展示文本增量，但**收到过文本不等于响应已经成功完成**；只有处理终止事件并验证最终状态，业务层才能提交完整结果。

本文流式生成一句虚构客户反馈摘要。程序会逐段输出文本、统计事件类型，并在 `response.completed` 到达后核对增量聚合文本与最终 Response 的 `output_text`。

::: tip 流式成功的最小判据
事件迭代正常结束、收到且只采用有效的 `response.completed`、最终状态为 `completed`，并且按顺序拼接的文本与完成响应一致。缺少完成事件时，即使界面已经显示部分文字，也不能提交业务结果。
:::

## 一、事件模型

普通同步请求返回一个完整 Response；流式请求返回事件迭代器。两者最终描述同一次响应，但应用获得信息的时间和处理方式不同。

### 1. SSE 传输

设置 `stream=True` 后，服务端通过 SSE 按生成过程推送事件。每个事件都有 `type`，不同类型携带不同字段。

```python
stream = client.responses.create(
    model=model,
    input="客户反馈：导出已经恢复。",
    stream=True,
)
```

SSE 是服务器到客户端的单向事件流。本文不涉及浏览器 `EventSource`、WebSocket 双向通信或实时音频协议；Python SDK 已负责解析底层 SSE 帧，应用消费的是类型化事件对象。

### 2. 生命周期事件

一次成功的文本流不只包含文本增量。实际事件序列还会表示响应建立、输出项建立、内容建立和各层完成。

| 事件类型 | 关键字段 | 应用用途 |
|----------|----------|----------|
| `response.created` | 初始 Response | 确认响应对象已创建 |
| `response.in_progress` | 当前 Response | 表示服务端正在处理 |
| `response.output_item.added` | 输出项 | 跟踪新增消息、工具调用等输出 |
| `response.content_part.added` | 内容部分 | 跟踪某个输出项中的内容 |
| `response.output_text.delta` | `delta` | 按到达顺序展示和聚合文本 |
| `response.output_text.done` | 完整文本信息 | 表示文本部分结束，不替代整次响应完成 |
| `response.completed` | 最终 `response` | 验证最终状态、文本和用量 |
| `error` | 错误对象 | 终止正常路径并保存错误证据 |

::: warning 文本结束不等于响应结束
`response.output_text.done` 只说明一个文本内容部分完成。响应还可能包含其他输出项；业务成功应以 `response.completed` 中的最终 Response 为准。
:::

### 3. 事件顺序

文本增量必须按接收顺序拼接。不要按字符串内容排序，也不要因为连续两个增量很短就丢弃其中一个。

```text
response.created
  → response.in_progress
  → response.output_item.added
  → response.content_part.added
  → response.output_text.delta × N
  → response.output_text.done
  → response.completed
```

`N` 不固定。相同输入在不同模型、负载或网络条件下可能产生不同数量和大小的增量，因此业务逻辑不能依赖“每个汉字一个事件”或固定事件数量。

## 二、消费状态

流式消费者需要同时维护增量、事件统计和最终响应。只用一个不断增长的字符串，无法区分“文本已经出现”和“响应已经确认完成”。

### 1. 最小状态

| 状态 | 初始值 | 更新时机 | 完成条件 |
|------|--------|----------|----------|
| `chunks` | 空列表 | 每个文本增量到达 | 按原顺序拼接 |
| `counts` | 空计数器 | 每个事件到达 | 用于诊断实际事件序列 |
| `completed_response` | `None` | 收到 `response.completed` | 必须存在且状态完成 |

列表比每次重新连接长字符串更适合累计大量增量，最终通过 `"".join(chunks)` 一次合并。事件计数不影响业务文本，但能证明消费者实际看到了哪些生命周期事件。

### 2. 完成判断

消费者在迭代结束后执行三项检查：

1. 必须收到 `response.completed`；
2. 最终 `response.status` 必须为 `completed`；
3. 增量拼接结果必须等于最终 `response.output_text`。

第三项是本文的验证策略，用于发现消费者漏掉、重复或错序处理增量。生产系统如果同时处理多输出项，应按 `output_index`、`content_index` 或输出项 ID 分组，不能把所有文本无条件拼进一个字符串。

### 3. 错误与中断

显式 `error` 事件、SDK 异常和没有终止事件的连接结束是不同证据：

| 现象 | 可以确认的事实 | 不应假定的事实 |
|------|----------------|----------------|
| 收到 `error` 事件 | 服务端报告流式错误 | 已显示文本仍然完整 |
| SDK 抛出连接异常 | 客户端未继续收到事件 | 服务端一定停止生成 |
| 迭代结束但无 `completed` | 客户端缺少成功终止证据 | 连接结束等于成功 |
| 收到 `completed` | 获得最终 Response | 内容已经通过业务校验 |

流中断后的服务端状态、是否重试和怎样恢复属于取消与超时策略。本文只执行保守判断：没有完成事件就返回失败。

## 三、环境与依赖

示例从空目录开始，使用 Python 3.12 和 OpenAI Python SDK 3.19.2。

### 1. 创建环境

::: code-group

```powershell [PowerShell]
mkdir streaming-demo
cd streaming-demo
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
```

```bash [Bash]
mkdir streaming-demo && cd streaming-demo
python3.12 -m venv .venv
source .venv/bin/activate
```

:::

安装 SDK：

```bash
python -m pip install "openai==3.19.2"
python -c "import openai; print(openai.__version__)"
```

查询结果应为 `3.19.2`。随后在当前终端设置 `OPENAI_API_KEY`，并可用 `OPENAI_MODEL` 覆盖默认的 `gpt-6-luna`。

::: danger 不要在流式日志中输出敏感输入
增量日志会产生大量、分散且难以统一撤回的记录。生产系统应在进入日志管道前完成脱敏，并避免把 API Key、用户身份信息或完整私密对话写入每个事件日志。
:::

::: info 验证基线
本文在 Python 3.12.14、OpenAI Python SDK 3.19.2 和 `gpt-6-luna` 下完成真实流式调用。事件名称和字段属于接口契约，事件数量和每段文本长度只是本次运行证据。
:::

## 四、完整实现

在示例目录新建 `streaming_demo.py`。`--self-test` 使用固定事件验证正常结束和缺少完成事件两条路径；不带参数时运行真实流式请求。

::: details 查看流式事件完整代码

```python
# streaming_demo.py
from __future__ import annotations

import json
import os
import sys
from collections import Counter
from collections.abc import Callable, Iterable, Sequence
from types import SimpleNamespace
from typing import Any

from openai import APIConnectionError, APIStatusError, OpenAI


def consume_events(
    events: Iterable[Any],
    write_delta: Callable[[str], Any],
) -> dict[str, Any]:
    """按事件类型聚合文本，并以 completed 事件确认流式成功。

    Args:
        events: Responses API 事件迭代器或等价测试事件序列。
        write_delta: 接收每段文本增量的输出函数；不得改变增量内容。

    Returns:
        包含事件计数、最终状态和聚合文本的结果。

    Raises:
        RuntimeError: 收到错误事件、缺少完成事件或聚合文本不一致。
    """
    counts: Counter[str] = Counter()
    chunks: list[str] = []
    completed_response = None
    for event in events:
        counts[event.type] += 1
        if event.type == "response.output_text.delta":
            chunks.append(event.delta)
            write_delta(event.delta)
        elif event.type == "error":
            raise RuntimeError(f"流式错误：{event.error}")
        elif event.type == "response.completed":
            completed_response = event.response

    if completed_response is None:
        raise RuntimeError("流结束但未收到 response.completed")
    aggregated_text = "".join(chunks)
    if completed_response.status != "completed":
        raise RuntimeError(f"最终状态不是 completed：{completed_response.status}")
    if aggregated_text != completed_response.output_text:
        raise RuntimeError("增量聚合文本与完成响应不一致")
    return {
        "event_counts": dict(sorted(counts.items())),
        "status": completed_response.status,
        "text": aggregated_text,
    }


def run_self_test() -> int:
    """用固定事件验证正常聚合和缺少完成事件两条路径。

    Returns:
        两条路径符合预期时返回 0。
    """
    completed = SimpleNamespace(status="completed", output_text="订单已发货。")
    events = [
        SimpleNamespace(type="response.output_text.delta", delta="订单已"),
        SimpleNamespace(type="response.output_text.delta", delta="发货。"),
        SimpleNamespace(type="response.completed", response=completed),
    ]
    captured: list[str] = []
    result = consume_events(events, captured.append)
    assert result["text"] == "订单已发货。"
    try:
        consume_events(events[:-1], captured.append)
    except RuntimeError as error:
        assert "未收到 response.completed" in str(error)
    else:
        raise AssertionError("缺少完成事件时不应返回成功")
    print("self_test=passed cases=2")
    return 0


def run_online() -> int:
    """请求流式工单回复并输出事件聚合证据。

    Returns:
        收到有效完成事件时返回 0，其他情况返回非零值。
    """
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("缺少环境变量：OPENAI_API_KEY", file=sys.stderr)
        return 2
    model = os.getenv("OPENAI_MODEL", "gpt-6-luna").strip() or "gpt-6-luna"
    client = OpenAI(api_key=api_key)
    try:
        stream = client.responses.create(
            model=model,
            instructions="把客户反馈压缩为一句中文，不补充输入中没有的事实。",
            input="客户反馈：导出已经恢复，但首次打开报表仍需等待约 8 秒。",
            stream=True,
            store=False,
        )
        print("text=", end="", flush=True)
        result = consume_events(stream, sys.stdout.write)
        print()
    except (APIConnectionError, APIStatusError, RuntimeError) as error:
        print(f"流式请求失败：{error}", file=sys.stderr)
        return 3
    result["model"] = model
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


def main(arguments: Sequence[str]) -> int:
    """根据命令行参数运行离线事件测试或在线流式请求。

    Args:
        arguments: 不含程序名的参数序列；仅支持可选的 --self-test。

    Returns:
        子流程的进程退出码。
    """
    if list(arguments) == ["--self-test"]:
        return run_self_test()
    if arguments:
        print("用法：python streaming_demo.py [--self-test]", file=sys.stderr)
        return 64
    return run_online()


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
```

:::

### 1. 事件分派

程序先对所有事件计数，再处理与当前目标有关的三类事件。未知但合法的生命周期事件仍被记录，不会因为消费者没有专门分支而导致失败。

```python
if event.type == "response.output_text.delta":
    chunks.append(event.delta)
    write_delta(event.delta)
elif event.type == "error":
    raise RuntimeError(f"流式错误：{event.error}")
```

这段分派把展示与聚合使用同一个 `delta`。如果 UI 层需要节流，可以延迟刷新界面，但不能改变写入聚合结果的顺序。

### 2. 终止校验

循环结束只是 Python 迭代器没有更多元素，不能代替 API 终止状态。程序在循环外集中检查完成响应和聚合一致性。

```python
if completed_response is None:
    raise RuntimeError("流结束但未收到 response.completed")
if completed_response.status != "completed":
    raise RuntimeError(f"最终状态不是 completed：{completed_response.status}")
```

聚合文本与 `output_text` 不一致通常说明消费者漏处理、重复处理或错误合并了增量。这是客户端实现问题，不应通过使用其中任意一个文本继续掩盖。

## 五、运行验证

### 1. 受控事件

先运行离线测试：

```bash
python streaming_demo.py --self-test
```

实际输出为：

```text
self_test=passed cases=2
```

第一个用例证明两个增量按顺序组成最终文本；第二个用例移除 `response.completed`，验证消费者必须返回失败。

### 2. 真实事件

设置 API Key 后运行：

```bash
python streaming_demo.py
```

下面是一次真实调用的输出。事件计数是本次运行数据，不是固定协议要求。

::: details 查看流式事件实际结果

```text
text=导出已恢复，但首次打开报表仍需等待约 8 秒。
{
  "event_counts": {
    "response.completed": 1,
    "response.content_part.added": 1,
    "response.content_part.done": 1,
    "response.created": 1,
    "response.in_progress": 1,
    "response.output_item.added": 1,
    "response.output_item.done": 1,
    "response.output_text.delta": 17,
    "response.output_text.done": 1
  },
  "status": "completed",
  "text": "导出已恢复，但首次打开报表仍需等待约 8 秒。",
  "model": "gpt-6-luna"
}
```

:::

本次响应包含 17 个文本增量，最终只产生一句摘要。另一次运行可能把同一句话拆成不同数量的增量，但完成状态和聚合一致性仍应成立。

## 六、中断处理

流式 UI 可以展示“暂存文本”，但业务提交必须等待完成事件。推荐把两个状态显式分开：

| 状态 | 数据用途 | 中断时处理 |
|------|----------|------------|
| 暂存文本 | 屏幕逐字展示 | 标记未完成，可以清除或保留为失败草稿 |
| 已完成文本 | 业务保存、后续解析 | 仅在完成状态与校验通过后产生 |

连接中断时，不要自动把暂存文本写入正式工单。若请求可能仍在服务端运行，应依据响应 ID、后台模式或幂等策略决定查询、取消还是重新提交，而不是无条件重试。

::: warning 部分文本可能语义不完整
一个增量可能停在词语、数字或 JSON 结构中间。前端可以显示它，但解析器、审核器和业务规则应等待足够的完整边界；结构化输出尤其不能对每个增量单独执行 `json.loads()`。
:::

异常记录至少应包含模型、已知响应 ID、最后事件类型、已接收增量数量和异常类别。不要把全部用户内容复制到错误日志，诊断证据与数据最小化需要同时满足。

## 七、适用边界

流式响应主要改善首字延迟和交互反馈，不会自动降低总生成时间，也不会改变模型输出的事实性。本文没有覆盖：

- 浏览器或移动端的增量渲染与 Markdown 安全处理；
- WebSocket 实时语音与双向媒体事件；
- 客户端主动取消和服务端后台响应；
- 多输出项、工具调用增量和结构化 JSON 的分组聚合；
- 断线重连、跨进程事件总线和多副本消费；
- 内容审核、业务校验和正式结果提交事务。

应用选择流式模式后，需要把生命周期状态提升为一等对象。只把同步调用改成 `for event in stream`，而不设计完成和中断条件，会让更快的界面反馈掩盖不完整结果。

## 八、参考资料

- [OpenAI Streaming API responses](https://developers.openai.com/api/docs/guides/streaming-responses)
- [OpenAI Responses API reference](https://developers.openai.com/api/reference/resources/responses/methods/create)
- [OpenAI Error codes](https://developers.openai.com/api/docs/guides/error-codes)
