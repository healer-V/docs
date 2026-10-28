---
title: "首个 Agent 与结果验证"
tags:
  - AI Agent
  - OpenAI API
  - Python
excerpt: "使用 Responses API 实现受最大步数约束的工具型 Agent，以本轮工具证据校验最终结构化结果，记录调用轨迹，并验证正常完成、参数失败、伪造结果和步数终止。"
date: 2026-09-29
---

# 首个 Agent 与结果验证

Agent 不是“让模型一直调用工具”，而是由应用维护的有界控制循环。每一步由模型返回最终文本或函数调用；应用校验并执行工具，把结果作为新观察回传，再决定是否继续。**完成、失败、等待确认和预算耗尽都必须成为明确终止状态。**

本文实现一个虚构订单调查 Agent。它只拥有只读工具 `get_order_status`，最多执行 4 次模型调用，并保存每次 Response、工具调用和终止原因。在线路径查询 `ORD-2048`，离线自测同时检查工具错误、结果伪造和步数终止。

::: tip 最小 Agent 的成立条件
模型能选择动作，应用能执行并反馈，循环可以继续至少一步，并且应用能依据显式条件终止。只有单次模型回答或固定函数调用的程序不需要称为 Agent。
:::

## 一、运行模型

### 1. 参与对象

| 对象 | 职责 | 不承担的职责 |
|------|------|--------------|
| 用户任务 | 描述目标和已知约束 | 不直接授权任意工具 |
| 模型 | 根据当前观察提出工具调用或最终答复 | 不执行本地函数，不决定最终权限 |
| Agent 运行器 | 维护步骤、状态、工具列表和终止条件 | 不补造工具结果 |
| 工具执行器 | 校验名称与参数，执行允许函数 | 不接收任意代码或隐藏权限 |
| 轨迹 | 保存可审计事件和关联标识 | 不保存密钥与完整敏感输入 |

模型输出只是下一步建议。即使模型生成了 `function_call`，应用仍可以因参数、权限、预算或人工确认拒绝执行。

### 2. 控制循环

```text
接收任务
  → 调用模型
  ├─→ 最终文本 → 校验结果 → completed
  ├─→ 函数调用 → 校验与执行 → 回传观察 → 再次调用模型
  ├─→ 不支持的输出 → failed
  └─→ 达到步数/时间/成本限制 → max_steps 或 budget_exhausted
```

本文把一次 `responses.create` 计为一个步骤。工具执行次数单独记录，因为同一步可能包含多个调用；生产系统还应分别限制工具次数、总时长和 Token。

### 3. 状态转换

| 状态 | 进入条件 | 允许的后续 |
|------|----------|------------|
| `running` | 任务通过本地校验 | 模型调用、工具执行 |
| `completed` | 完成 Response 的最终 JSON 与本轮成功工具证据一致 | 返回结果 |
| `max_steps` | 下一次模型调用会超过上限 | 返回未完成，不伪造答案 |
| `failed` | 响应形状或运行时不变量失效 | 记录证据并停止 |

高风险写工具还需要 `approval_required`，长任务还需要 `cancelled` 和恢复状态。当前单文件示例只处理只读查询，不包含这些生产能力。

## 二、工具边界

### 1. 只读工具

Agent 只获得一个虚构内存查询工具。工具返回稳定状态码，不返回数据库连接、内部异常或真实客户信息。

::: details 查看订单状态工具定义

```python
ORDER_STATUS_TOOL = {
    "type": "function",
    "name": "get_order_status",
    "description": (
        "查询消息中已经提供的虚构订单号；只读取状态，"
        "不修改订单、不退款、不发送通知。"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "order_id": {
                "type": "string",
                "pattern": "^ORD-[0-9]{4}$",
            }
        },
        "required": ["order_id"],
        "additionalProperties": False,
    },
    "strict": True,
}
```

:::

工具描述中的“只读”是给模型的选择信息。真正的执行器仍要使用名称白名单和本地参数校验。

### 2. 参数校验

运行器不直接执行 `json.loads()` 的任意结果。它依次检查：

1. JSON 可以解析为对象；
2. 只包含 `order_id`；
3. 订单号符合 `ORD-0000` 格式；
4. 名称等于允许的 `get_order_status`；
5. 工具返回可序列化的公开结果。

失败也要形成工具结果并使用原 `call_id` 回传，使模型能够向用户解释条件不足。未知工具属于运行时契约错误，本文返回受控错误后允许模型收束，不执行任何动态名称。

### 3. 结果与历史回传

每个工具结果使用 `function_call_output`：

```python
{
    "type": "function_call_output",
    "call_id": call.call_id,
    "output": json.dumps(result, ensure_ascii=False),
}
```

`call_id` 必须来自当前函数调用项。数组下标、工具名称或 Response ID 都不能替代它。

本文把用户输入、模型输出项和工具结果组成显式历史，再作为下一次请求的 `input`。这种写法不依赖服务端保存上一轮 Response，适用于无状态调用和不支持 `previous_response_id` 的兼容端点。若使用服务端续接，也必须确认数据保留、租户隔离和过期策略符合应用要求。

## 三、轨迹与验收

### 1. 轨迹事件

本文记录以下事件，不保存完整 Prompt 或敏感参数：

| 事件 | 字段 | 观察重点 |
|------|------|----------|
| `model_response` | 步数、Response ID、状态 | 模型调用是否完成 |
| `tool_call` | 步数、名称、`call_id` | 选择了什么能力 |
| `tool_result` | 步数、`call_id`、成功标记 | 应用执行是否成功 |
| `final_answer` | 步数、Response ID | 哪个响应形成最终结果 |
| `terminated` | 步数、终止原因 | 为什么停止 |

轨迹服务于诊断和评测，不应保存密钥、完整附件或无脱敏的客户数据。

### 2. 结果校验

模型给出最终结果后，运行器仍需验证当前任务的成功条件。本文要求输出仅包含 `order_id` 和 `status` 的 JSON 对象；两项必须与当前任务、本轮成功执行的工具结果分别一致。例如：

```json
{"order_id":"ORD-2048","status":"in_transit"}
```

运行器只把 `ok=True` 且订单号匹配的查询记录为证据。无工具调用、失败工具输出、不同订单的结果以及模型自行给出的状态都不能成为完成依据。检查在调用完成后进行，JSON 格式正确不表示事实正确。

::: warning 最终文本不能覆盖工具事实
如果最终结果与工具证据冲突，或者本轮根本没有取得成功证据，应标记为 `failed`。只检查答复是否包含订单号和状态词，会把“无法查询，但状态仍是 in_transit”这样的伪造结果误判为成功。
:::

## 四、环境与依赖

示例从空目录开始，使用 Python 3.12 和 OpenAI Python SDK 3.19.2。

::: code-group

```powershell [PowerShell]
mkdir first-agent-demo
cd first-agent-demo
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install openai==3.19.2
```

```bash [Bash]
mkdir first-agent-demo && cd first-agent-demo
python3 -m venv .venv
source .venv/bin/activate
python -m pip install openai==3.19.2
```

:::

设置测试项目凭据和已验证支持函数工具的模型：

```powershell
$env:OPENAI_API_KEY = "<你的测试项目密钥>"
$env:OPENAI_MODEL = "gpt-6-luna"
```

示例不会连接真实订单系统。更换模型或兼容网关后，应重新验证函数调用对象、工具选择和终止行为。

## 五、完整实现

在当前目录创建 `first_agent.py`。程序通过 `--self-test` 运行确定性夹具；不带参数时执行在线工具闭环。

::: details 查看受控 Agent 完整程序

```python
# first_agent.py
import argparse
import json
import os
import re
from dataclasses import dataclass, field
from enum import StrEnum
from types import SimpleNamespace
from typing import Any

from openai import APIError, OpenAI


ORDER_STATUS_TOOL = {
    "type": "function",
    "name": "get_order_status",
    "description": (
        "查询消息中已经提供的虚构订单号；只读取状态，"
        "不修改订单、不退款、不发送通知。"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "order_id": {
                "type": "string",
                "pattern": "^ORD-[0-9]{4}$",
            }
        },
        "required": ["order_id"],
        "additionalProperties": False,
    },
    "strict": True,
}


class Termination(StrEnum):
    """表示一次 Agent 运行的明确终止原因。"""

    COMPLETED = "completed"
    MAX_STEPS = "max_steps"
    FAILED = "failed"


@dataclass(frozen=True)
class TraceEvent:
    """保存不含敏感正文的最小运行事件。"""

    event: str
    step: int
    response_id: str | None = None
    call_id: str | None = None
    tool: str | None = None
    ok: bool | None = None


@dataclass
class AgentResult:
    """保存最终文本、终止原因、步数和完整事件轨迹。"""

    termination: Termination
    steps: int
    answer: str | None = None
    trace: list[TraceEvent] = field(default_factory=list)


def get_order_status(order_id: str) -> dict:
    """查询固定内存中的虚构订单。

    Args:
        order_id: 格式为 ORD- 加四位数字的订单号。

    Returns:
        包含 ok、订单号、状态和更新时间的公开结果；不存在时返回错误码。
    """
    records = {
        "ORD-2048": {
            "status": "in_transit",
            "updated_at": "2026-09-28T09:30:00Z",
        }
    }
    record = records.get(order_id)
    if record is None:
        return {"ok": False, "error": "order_not_found", "order_id": order_id}
    return {"ok": True, "order_id": order_id, **record}


def execute_tool(name: str, arguments: str) -> dict:
    """校验并执行白名单中的工具。

    Args:
        name: 模型提出的函数名称。
        arguments: JSON 编码的函数参数。

    Returns:
        可安全回传给模型的成功数据或公开错误对象。
    """
    if name != "get_order_status":
        return {"ok": False, "error": "unknown_tool"}
    try:
        parsed = json.loads(arguments)
    except json.JSONDecodeError:
        return {"ok": False, "error": "invalid_json"}
    if not isinstance(parsed, dict) or set(parsed) != {"order_id"}:
        return {"ok": False, "error": "invalid_arguments"}
    order_id = parsed["order_id"]
    if not isinstance(order_id, str) or not re.fullmatch(r"ORD-[0-9]{4}", order_id):
        return {"ok": False, "error": "invalid_order_id"}
    return get_order_status(order_id)


def verify_answer(answer: str, expected_order_id: str, evidence: dict | None) -> bool:
    """用本轮成功工具证据核对最终 JSON，阻止无证据的伪完成。

    Args:
        answer: 模型生成的 JSON 文本，只允许 order_id 和 status 两个字段。
        expected_order_id: 任务指定的虚构订单号。
        evidence: 当前任务成功查询的公开结果；没有证据时为 None。

    Returns:
        结构合法且订单号、状态与本轮证据一致时返回 True，否则返回 False。
    """
    if evidence is None or evidence.get("ok") is not True:
        return False
    try:
        parsed = json.loads(answer)
    except json.JSONDecodeError:
        return False
    return (
        isinstance(parsed, dict)
        and set(parsed) == {"order_id", "status"}
        and parsed["order_id"] == expected_order_id == evidence.get("order_id")
        and parsed["status"] == evidence.get("status")
    )


def to_input_item(item: Any) -> dict:
    """把模型输出项转换为下一次请求可接受的输入项。

    Args:
        item: OpenAI SDK 输出对象，或自检使用的 SimpleNamespace。

    Returns:
        可追加到 Responses API input 数组的字典。
    """
    if hasattr(item, "model_dump"):
        return item.model_dump(exclude_none=True)
    if item.type == "function_call":
        return {
            "type": "function_call",
            "name": item.name,
            "arguments": item.arguments,
            "call_id": item.call_id,
        }
    raise ValueError(f"unsupported response item: {item.type}")


class AgentRunner:
    """执行受最大步数约束的 Responses 工具循环。"""

    def __init__(self, client: Any, model: str, max_steps: int = 4) -> None:
        """创建 Agent 运行器。

        Args:
            client: 提供 responses.create 的 SDK 客户端或测试替身。
            model: 支持函数工具的模型标识。
            max_steps: 最大模型调用次数，必须大于 0。

        Returns:
            无返回值；运行状态在 run 方法内创建。
        """
        if not model:
            raise ValueError("model must not be empty")
        if max_steps <= 0:
            raise ValueError("max_steps must be positive")
        self._client = client
        self._model = model
        self._max_steps = max_steps

    def run(self, task: str, expected_order_id: str) -> AgentResult:
        """执行任务直到完成、失败或达到最大步数。

        Args:
            task: 非空用户任务，不得包含真实客户数据。
            expected_order_id: 最终结果必须保留的虚构订单号。

        Returns:
            包含终止原因、答案和脱敏轨迹的 AgentResult。
        """
        if not task.strip():
            raise ValueError("task must not be empty")
        trace: list[TraceEvent] = []
        evidence: dict | None = None
        history: list[dict] = [
            {
                "role": "user",
                "content": [{"type": "input_text", "text": task}],
            }
        ]

        for step in range(1, self._max_steps + 1):
            request = {
                "model": self._model,
                "instructions": (
                    "你是只读订单调查 Agent。订单事实必须调用工具取得；"
                    "成功后只返回 JSON 对象，字段为 order_id 和 status，"
                    "值必须来自工具结果。不添加 Markdown 围栏。"
                    "工具失败时说明失败原因，不编造状态。"
                    "不得声称退款、改址或发送通知。"
                ),
                "input": history,
                "tools": [ORDER_STATUS_TOOL],
            }
            try:
                response = self._client.responses.create(**request)
            except APIError:
                # 请求失败不能伪装为工具观察，轨迹也不输出含地址的异常正文。
                trace.append(TraceEvent("terminated", step))
                return AgentResult(Termination.FAILED, step, trace=trace)
            trace.append(
                TraceEvent("model_response", step, response_id=response.id)
            )
            if response.status != "completed":
                trace.append(TraceEvent("terminated", step, response_id=response.id))
                return AgentResult(Termination.FAILED, step, trace=trace)

            calls = [item for item in response.output if item.type == "function_call"]
            if calls:
                outputs = []
                for call in calls:
                    trace.append(
                        TraceEvent(
                            "tool_call",
                            step,
                            response_id=response.id,
                            call_id=call.call_id,
                            tool=call.name,
                        )
                    )
                    result = execute_tool(call.name, call.arguments)
                    if result.get("ok") is True and result.get("order_id") == expected_order_id:
                        evidence = dict(result)
                    trace.append(
                        TraceEvent(
                            "tool_result",
                            step,
                            response_id=response.id,
                            call_id=call.call_id,
                            tool=call.name,
                            ok=result.get("ok", False),
                        )
                    )
                    outputs.append(
                        {
                            "type": "function_call_output",
                            "call_id": call.call_id,
                            "output": json.dumps(result, ensure_ascii=False),
                        }
                    )
                # 显式保存本轮模型输出，兼容不支持 previous_response_id 的端点。
                history.extend(to_input_item(item) for item in response.output)
                history.extend(outputs)
                continue

            answer = response.output_text
            if answer and verify_answer(answer, expected_order_id, evidence):
                trace.append(
                    TraceEvent("final_answer", step, response_id=response.id)
                )
                return AgentResult(Termination.COMPLETED, step, answer, trace)
            trace.append(TraceEvent("terminated", step, response_id=response.id))
            return AgentResult(Termination.FAILED, step, answer, trace)

        trace.append(TraceEvent("terminated", self._max_steps))
        return AgentResult(Termination.MAX_STEPS, self._max_steps, trace=trace)


class FakeResponses:
    """按顺序返回固定 Response，并记录后续工具输出。"""

    def __init__(self, responses: list[Any]) -> None:
        """保存固定响应序列。

        Args:
            responses: 按预期请求顺序排列的 Response 测试替身。

        Returns:
            无返回值；初始化响应队列和请求记录。
        """
        self._responses = list(responses)
        self.requests: list[dict] = []

    def create(self, **kwargs):
        """记录请求并返回下一个固定 Response。

        Args:
            kwargs: 运行器提交的模型请求字段，本夹具只保存而不发送。

        Returns:
            下一项固定 Response；队列为空时抛出 AssertionError。
        """
        self.requests.append(kwargs)
        if not self._responses:
            raise AssertionError("unexpected model call")
        return self._responses.pop(0)


def fake_call(response_id: str, name: str, arguments: str, call_id: str):
    """构造包含一个函数调用的最小完成 Response。

    Args:
        response_id: 自检响应标识。
        name: 待调用的工具名称。
        arguments: JSON 编码的工具参数。
        call_id: 工具调用标识。

    Returns:
        与运行器所需字段一致的测试替身。
    """
    return SimpleNamespace(
        id=response_id,
        status="completed",
        output=[
            SimpleNamespace(
                type="function_call",
                name=name,
                arguments=arguments,
                call_id=call_id,
            )
        ],
        output_text="",
    )


def fake_answer(response_id: str, text: str):
    """构造只包含最终文本的最小完成 Response。

    Args:
        response_id: 自检响应标识。
        text: 模拟的最终文本。

    Returns:
        与运行器所需字段一致的测试替身。
    """
    return SimpleNamespace(
        id=response_id,
        status="completed",
        output=[],
        output_text=text,
    )


def run_self_test() -> None:
    """验证九条分支，包括工具错误、证据不足、结果冲突和步数终止。

    Returns:
        无返回值；失败时抛出 AssertionError，通过时输出用例数量。
    """
    success_responses = FakeResponses(
        [
            fake_call(
                "resp_1",
                "get_order_status",
                '{"order_id":"ORD-2048"}',
                "call_1",
            ),
            fake_answer("resp_2", '{"order_id":"ORD-2048","status":"in_transit"}'),
        ]
    )
    success = AgentRunner(
        SimpleNamespace(responses=success_responses),
        "fixture-model",
    ).run("查询 ORD-2048", "ORD-2048")
    assert success.termination == Termination.COMPLETED and success.steps == 2
    returned = success_responses.requests[1]["input"][-1]
    assert returned["call_id"] == "call_1"
    assert json.loads(returned["output"])["status"] == "in_transit"
    assert success_responses.requests[1]["input"][-2]["type"] == "function_call"

    invalid_responses = FakeResponses(
        [
            fake_call("resp_3", "get_order_status", "{}", "call_2"),
            fake_answer("resp_4", '{"order_id":"ORD-2048","status":"in_transit"}'),
        ]
    )
    invalid = AgentRunner(
        SimpleNamespace(responses=invalid_responses),
        "fixture-model",
    ).run("查询 ORD-2048", "ORD-2048")
    tool_output = invalid_responses.requests[1]["input"][-1]["output"]
    assert json.loads(tool_output)["error"] == "invalid_arguments"
    assert invalid.termination == Termination.FAILED

    unknown_responses = FakeResponses(
        [
            fake_call("resp_5", "delete_order", "{}", "call_3"),
            fake_answer("resp_6", '{"order_id":"ORD-2048","status":"in_transit"}'),
        ]
    )
    unknown = AgentRunner(
        SimpleNamespace(responses=unknown_responses),
        "fixture-model",
    ).run("删除 ORD-2048", "ORD-2048")
    unknown_output = unknown_responses.requests[1]["input"][-1]["output"]
    assert json.loads(unknown_output)["error"] == "unknown_tool"
    assert unknown.termination == Termination.FAILED

    limited_responses = FakeResponses(
        [
            fake_call(
                "resp_7",
                "get_order_status",
                '{"order_id":"ORD-2048"}',
                "call_4",
            )
        ]
    )
    limited = AgentRunner(
        SimpleNamespace(responses=limited_responses),
        "fixture-model",
        max_steps=1,
    ).run("查询 ORD-2048", "ORD-2048")
    assert limited.termination == Termination.MAX_STEPS

    final_payloads = [
        '{"order_id":"ORD-2048","status":"delivered"}',
        '{"order_id":"ORD-9999","status":"in_transit"}',
        "订单 ORD-2048 状态为 in_transit。",
    ]
    for index, payload in enumerate(final_payloads):
        responses = FakeResponses([
            fake_call(f"conflict_{index}", "get_order_status", '{"order_id":"ORD-2048"}', f"c_{index}"),
            fake_answer(f"final_{index}", payload),
        ])
        result = AgentRunner(SimpleNamespace(responses=responses), "fixture-model").run(
            "查询 ORD-2048", "ORD-2048"
        )
        assert result.termination == Termination.FAILED

    no_tool = FakeResponses([
        fake_answer("no_tool", '{"order_id":"ORD-2048","status":"in_transit"}')
    ])
    result = AgentRunner(SimpleNamespace(responses=no_tool), "fixture-model").run(
        "查询 ORD-2048", "ORD-2048"
    )
    assert result.termination == Termination.FAILED

    not_found = FakeResponses([
        fake_call("missing", "get_order_status", '{"order_id":"ORD-9999"}', "c_missing"),
        fake_answer("invented", '{"order_id":"ORD-9999","status":"in_transit"}'),
    ])
    result = AgentRunner(SimpleNamespace(responses=not_found), "fixture-model").run(
        "查询 ORD-9999", "ORD-9999"
    )
    assert result.termination == Termination.FAILED
    print("self_test=passed cases=9")


def run_online() -> None:
    """执行非敏感在线订单查询并输出脱敏轨迹。

    Returns:
        无返回值；输出结果与轨迹，未完成时以退出码 1 结束进程。
    """
    runner = AgentRunner(
        OpenAI(max_retries=0, timeout=30.0),
        os.environ.get("OPENAI_MODEL", "gpt-6-luna"),
        max_steps=4,
    )
    result = runner.run(
        "工单 CASE-1042：请查询订单 ORD-2048 的当前状态，并只依据工具结果答复。",
        "ORD-2048",
    )
    print(
        f"termination={result.termination} steps={result.steps} "
        f"events={len(result.trace)}"
    )
    for event in result.trace:
        print(
            f"event={event.event} step={event.step} "
            f"tool={event.tool} call_id={event.call_id} ok={event.ok}"
        )
    print(f"answer={result.answer}")
    if result.termination != Termination.COMPLETED:
        raise SystemExit(1)


def main() -> None:
    """根据命令行参数运行离线自测或在线闭环。

    Returns:
        无返回值；按命令行参数执行验证并输出结果。
    """
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        run_self_test()
    else:
        run_online()


if __name__ == "__main__":
    main()
```

:::

## 六、运行验证

### 1. 离线分支

先运行不访问网络的确定性自测：

```powershell
python first_agent.py --self-test
```

预期输出：

```text
self_test=passed cases=9
```

九个用例验证正常完成、空参数、未知工具、步数耗尽、状态冲突、错误订单号、非 JSON 输出、无工具证据和订单不存在。正常路径还核对工具输出的 `call_id` 与模型调用项的保留；失败工具之后即使生成字段正确的答案，也必须返回 `failed`。

### 2. 在线闭环

运行在线路径：

```powershell
python first_agent.py
```

一次通过验证的运行应具备以下事件关系，Response ID 和自然语言文本每次可以不同：

```text
termination=completed steps=2 events=5
event=model_response step=1 tool=None call_id=None ok=None
event=tool_call step=1 tool=get_order_status call_id=call_... ok=None
event=tool_result step=1 tool=get_order_status call_id=call_... ok=True
event=model_response step=2 tool=None call_id=None ok=None
event=final_answer step=2 tool=None call_id=None ok=None
answer={"order_id":"ORD-2048","status":"in_transit"}
```

验收重点是：工具名称在白名单中，调用与结果使用同一 `call_id`，运行在有限步内终止，最终 JSON 与当前订单的成功工具证据一致。字段顺序和 JSON 空白不影响校验。

::: tip 2026-09-29 在线验证结果
在 Python 3.12.14、OpenAI Python SDK 3.19.2 和当前测试模型上，修订后的示例于第 2 步完成，记录 5 个事件；最终 JSON 的订单号与状态均通过本轮成功工具证据校验。离线九个用例也全部通过。模型、网关或 SDK 版本变化后需重新验证。
:::

## 七、失败定位

| 现象 | 证据 | 处理 |
|------|------|------|
| 第一步直接给结果 | 轨迹无成功 `tool_result`，终态为 `failed` | 本任务要求实时查询证据，不能接受模型猜测 |
| 重复调用同一工具 | 多步参数完全相同 | 增加已观察结果与重复调用终止规则 |
| 参数错误 | `tool_result.ok=False` | 保留错误结果，让模型补充条件或收束 |
| 最终状态与工具冲突 | 结果校验失败 | 标记失败，以工具证据为准 |
| 达到最大步数 | `termination=max_steps` | 保存轨迹，返回未完成或转人工 |
| 网络或 API 异常 | 没有完整 `model_response` | 按错误类别和幂等状态决定恢复 |

### 1. 循环失控

只设置 Prompt “不要循环太久”不能形成运行保证。最大步数、时间和工具预算必须由应用代码检查。发现重复调用时，可以基于工具名、规范化参数和结果哈希终止，但不能误伤确有分页或重试需要的任务。

### 2. 结果冲突

最终 JSON 的状态与本轮成功工具结果不一致时，本文返回 `failed`；没有成功证据时也一样。这条判断证明演示中的订单号与状态一致，不证明来源权限、时效性、财务规则或其他业务字段已经得到验证。

## 八、适用边界

这个最小 Agent 适合解释原生控制循环，不是生产运行时。它尚未实现：

- 高风险工具的人工作业确认；
- 持久化检查点和进程崩溃恢复；
- Token、时间和成本预算；
- 工具超时、取消与业务幂等存储；
- 多 Agent 委派与结果冲突；
- MCP 连接和远程授权；
- 完整 Trace 平台与离线评测。

这些能力需要独立的运行策略、持久化和业务约束。当前程序的通过结果只代表固定只读订单查询闭环成立。

## 九、验证结论

本文把 Agent 的最小闭环落实为应用控制的状态机：模型提出动作，白名单执行器产生观察，运行器回传结果并依据显式条件终止。离线用例提供确定性失败证据，在线路径证明当前模型能够完成两步工具循环。

只要应用无法说明当前步骤、已执行动作、剩余预算和终止原因，就还没有建立可控 Agent 运行时。

## 十、参考资料

- [Agents](https://developers.openai.com/api/docs/guides/agents)
- [Function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [Safety in building agents](https://developers.openai.com/api/docs/guides/agent-builder-safety)
