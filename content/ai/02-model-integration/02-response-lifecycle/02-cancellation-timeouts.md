---
title: "取消与超时"
tags:
  - OpenAI API
  - 超时
  - Python
excerpt: "区分客户端超时、流式中断与后台响应取消，依据服务端状态判断查询、终止或重新提交，避免把停止等待误认为停止执行。"
date: 2026-09-28
---

# 取消与超时

超时只证明客户端没有在期限内得到结果，**不能单独证明服务端已经停止执行**。应用必须分别记录等待边界、连接状态和 Response 状态，再决定继续查询、请求取消还是重新提交。

本文使用虚构工单摘要请求说明三种情况：同步请求等待超时、流式连接提前结束、后台响应取消。三者都表现为“当前没有完整结果”，但恢复方式并不相同。

::: warning 未知结果不能直接重放副作用
查询或摘要请求通常可以重新提交；发送通知、创建退款等副作用在执行结果未知时不能无条件重放。必须先查询业务幂等记录，或使用稳定执行键确认动作是否已经完成。
:::

## 一、超时边界

一次模型调用至少跨越应用、SDK、网络和 API 服务。不同层的超时只约束各自的等待过程。

### 1. 等待阶段

| 阶段 | 常见现象 | 已知事实 | 未知事实 |
|------|----------|----------|----------|
| 建立连接前 | 连接超时 | 客户端未建立可用连接 | 服务端是否收到请求 |
| 已发送请求后 | 读取超时 | 客户端未在期限内读到响应 | 服务端是否仍在生成 |
| 流式读取中 | 增量后中断 | 客户端只持有部分事件 | 最终 Response 是否完成 |
| 后台轮询中 | 查询尚未完成 | Response 仍处于非终态 | 还需等待多久 |

SDK 的 `timeout` 控制客户端等待，不是模型执行时限。业务层还应有自己的截止时间，用于决定是否继续占用请求线程、切换后台处理或向用户返回可恢复的任务标识。

### 2. 终态与非终态

Response 状态决定服务端已经确认的生命周期结果。应用不能用本地异常名称替代服务端状态。

| 状态 | 含义 | 默认动作 |
|------|------|----------|
| `queued` | 已受理，等待执行 | 继续查询或等待通知 |
| `in_progress` | 正在执行 | 继续等待，必要时请求取消 |
| `completed` | 已成功完成 | 校验输出后提交业务结果 |
| `failed` | 服务端确认失败 | 读取错误信息并判断是否重试 |
| `cancelled` | 服务端确认取消 | 不消费输出；按业务需要重新提交 |
| `incomplete` | 生成未完整结束 | 检查 `incomplete_details` 后决定调整请求 |

同步连接断开后，如果没有可查询的已存储 Response ID，应用通常无法从该连接恢复最终对象。长任务需要可靠查询与取消时，应在创建时使用后台模式。

## 二、客户端超时

### 1. SDK 配置

Python SDK 可以为客户端或单次请求配置超时。下面的局部代码只展示配置位置；它不保证一定触发超时，因为实际响应速度取决于网络和服务状态。

```python
from openai import OpenAI

client = OpenAI(timeout=30.0)
response = client.with_options(timeout=5.0).responses.create(
    model="gpt-6-luna",
    input="将这条虚构工单压缩为一句话：导出报表长时间停在处理中。",
)
```

客户端级配置适合统一默认值，`with_options` 适合少量特殊请求。业务代码应捕获 SDK 的 `APITimeoutError`，不要通过匹配错误字符串识别超时。

### 2. 故障注入

真实网络超时难以稳定复现。测试应把“调用模型”隔离为可替换函数，用受控替身确认超时分支不会误提交结果。

::: details 查看超时分类测试完整代码

```python
# timeout_policy.py
from dataclasses import dataclass
from enum import StrEnum
from typing import Callable


class Outcome(StrEnum):
    """表示客户端本次等待得到的可观察结果。"""

    COMPLETED = "completed"
    TIMED_OUT = "timed_out"
    FAILED = "failed"


@dataclass(frozen=True)
class AttemptResult:
    """保存一次调用的结果分类和可选响应标识。"""

    outcome: Outcome
    response_id: str | None = None


def invoke_with_boundary(call: Callable[[], str]) -> AttemptResult:
    """执行可替换调用，并将等待超时转换为领域结果。

    Args:
        call: 无参数调用；成功时返回响应标识，超时时抛出 TimeoutError。

    Returns:
        可供恢复策略使用的结果；本函数不自动重试。
    """
    try:
        return AttemptResult(Outcome.COMPLETED, call())
    except TimeoutError:
        return AttemptResult(Outcome.TIMED_OUT)
    except Exception:
        return AttemptResult(Outcome.FAILED)


def raise_timeout() -> str:
    """稳定触发本地超时分支，不依赖真实网络速度。"""
    raise TimeoutError("controlled read timeout")


def main() -> None:
    """验证超时只产生未知结果，不伪造服务端终态。"""
    result = invoke_with_boundary(raise_timeout)
    assert result == AttemptResult(Outcome.TIMED_OUT)
    print(f"outcome={result.outcome} response_id={result.response_id}")


if __name__ == "__main__":
    main()
```

:::

运行测试：

```powershell
python timeout_policy.py
```

预期输出表明本地只知道等待超时，没有可查询的响应标识：

```text
outcome=timed_out response_id=None
```

::: tip 将超时转换为领域状态
控制器应返回“结果未知”或“仍在处理”等业务状态，而不是把所有超时包装成“模型失败”。只有服务端终态或明确的请求前失败，才能支持更强的结论。
:::

## 三、流式中断

### 1. 部分输出

流式消费者可以在完成事件前收到多个 `response.output_text.delta`。连接中断后，这些增量只适合临时展示，不能作为已完成业务结果保存。

```text
response.created
response.output_text.delta: "用户"
response.output_text.delta: "反馈导出"
<connection closed>
```

此时应用知道响应曾经开始生成，但缺少 `response.completed` 或其他终止事件。界面可以保留“生成中断”的提示，持久化层则应把本轮标记为失败或未知，而不是 `completed`。

### 2. 主动停止读取

关闭本地流或退出事件循环会停止客户端继续消费。它不构成服务端取消确认；如果动作存在费用、审计或副作用，不能根据“客户端已关闭”推导“服务端未执行”。

流式恢复需要根据请求模式选择：

1. 普通同步流没有可靠恢复标识时，丢弃部分输出并重新发起只读请求；
2. 后台流创建时同时启用 `background=True` 与 `stream=True`，可以基于响应标识继续查询，并按官方能力恢复事件；
3. 副作用工具已经被提出或执行时，先检查工具幂等记录，再决定是否继续模型流程。

## 四、后台取消

后台响应提供可查询的 Response ID。取消动作本身也是一次 API 请求，应用应在取消后重新读取对象，直到获得明确终态。

::: details 查看后台创建、查询与取消代码

```python
# cancel_background.py
import os
import time

from openai import OpenAI


TERMINAL_STATUSES = {"completed", "failed", "cancelled", "incomplete"}


def wait_for_terminal(client: OpenAI, response_id: str, timeout_seconds: float):
    """轮询后台响应，直到终态或业务等待期限到达。

    Args:
        client: 已配置凭据的 OpenAI 客户端。
        response_id: 创建后台响应后得到的稳定标识。
        timeout_seconds: 业务允许轮询的最长秒数，必须大于 0。

    Returns:
        最后一次读取到的 Response；到期时仍可能是非终态。
    """
    deadline = time.monotonic() + timeout_seconds
    response = client.responses.retrieve(response_id)
    while response.status not in TERMINAL_STATUSES and time.monotonic() < deadline:
        time.sleep(1.0)
        response = client.responses.retrieve(response_id)
    return response


def main() -> None:
    """创建后台请求，并演示基于服务端状态的取消判断。"""
    client = OpenAI()
    response = client.responses.create(
        model=os.environ.get("OPENAI_MODEL", "gpt-6-luna"),
        input="为虚构工单 CASE-1042 生成三段处理建议。",
        background=True,
    )
    print(f"created id={response.id} status={response.status}")

    current = wait_for_terminal(client, response.id, timeout_seconds=2.0)
    if current.status not in TERMINAL_STATUSES:
        current = client.responses.cancel(response.id)
        print(f"cancel requested status={current.status}")

    final = wait_for_terminal(client, response.id, timeout_seconds=30.0)
    print(f"final id={final.id} status={final.status}")


if __name__ == "__main__":
    main()
```

:::

执行前设置非生产 API Key 和兼容模型，然后运行：

```powershell
$env:OPENAI_MODEL = "gpt-6-luna"
python cancel_background.py
```

短请求可能在取消前已经完成，这是正常竞争条件。程序只有在对象仍为非终态时才调用取消，并始终以最后一次查询到的状态作为证据。

::: info 当前环境的验证边界
Python SDK 3.19.2 已确认提供后台创建、查询和取消方法，但本项目当前兼容端点在 2026-09-28 对 `background` 返回 `400 Unsupported parameter`。因此本节代码已完成语法与 SDK 签名核对，未在该端点取得真实取消终态；使用其他模型或端点时必须重新运行本节程序。
:::

## 五、恢复决策

恢复动作必须同时考虑是否有 Response ID、服务端状态和业务副作用。

| 当前证据 | 只读生成 | 有副作用动作 |
|----------|----------|------------|
| 请求发送前失败 | 可以重新提交 | 可以重新提交 |
| 客户端超时，无 Response ID | 可以按重试策略重提 | 先查业务幂等记录 |
| 有 ID，状态为非终态 | 继续查询或请求取消 | 继续查询，不并行重放 |
| `cancelled` 或 `failed` | 按错误类型决定重提 | 确认工具是否执行后再处理 |
| `completed` | 校验并使用输出 | 校验工具记录与最终输出 |
| `incomplete` | 检查原因并调整限制 | 不自动重放已发生的动作 |

### 1. 重提条件

重新提交前至少回答三个问题：

1. 原请求是否确认没有完成；
2. 同一业务动作是否具备幂等键；
3. 新请求是否会与旧后台响应并发产生冲突。

缺少任一答案时，默认进入人工或延迟复核，而不是扩大重试范围。

### 2. 观察字段

诊断日志应保留请求时间、Response ID、客户端超时类型、最后状态和业务执行键。不得记录 API Key、完整客户文本或未经脱敏的附件内容。

## 六、验证结论

本文的本地故障注入已实际运行，证明等待超时只能产生客户端结果分类，不能伪造服务端终态。后台示例把 Response ID、查询和取消放在同一状态判断中；当前兼容端点不支持后台参数，因此没有伪造取消输出。实际取消是否抢在完成前取决于响应耗时，必须读取最终状态，而不能把 `cancel()` 调用成功等同于对象已经取消。

生产系统还需要统一重试预算、幂等存储和任务调度，这些属于接入可靠性与应用架构范围。

## 七、参考资料

- [Background mode](https://developers.openai.com/api/docs/guides/background)
- [Streaming API responses](https://developers.openai.com/api/docs/guides/streaming-responses)
- [Error codes](https://developers.openai.com/api/docs/guides/error-codes)
