---
title: "控制循环"
tags:
  - AI Agent
  - 状态机
  - 工具调用
excerpt: "解释 Agent 观察、决策、行动与反馈的循环，区分模型步骤和工具调用，以可运行的事件状态机验证关联标识、成功证据、错误传播和最大步数终止。"
date: 2026-09-29
---

# 控制循环

Agent 控制循环把“模型决定下一步”变成应用可以检查的状态转移。应用每次提供当前任务及已有观察，模型返回动作或最终结果；应用执行允许的动作，把实际结果反馈给模型，直到成功条件成立或进入明确终态。

循环中的反馈必须来自实际执行。模型自己写出的“工具已经完成”不是工具结果，模型声明“任务完成”也不是业务验收。**控制循环同时管理继续执行的条件和停止执行的理由。**

## 一、观察、决策与行动

### 1. 四个环节

| 环节 | 当前输入 | 产生的内容 | 应用的检查 |
|------|----------|------------|------------|
| 观察 | 用户目标、历史和工具结果 | 当前可用的事实与限制 | 来源、范围和时效性 |
| 决策 | 当前观察和工具定义 | 工具调用或最终结果 | 响应状态、输出类型 |
| 行动 | 工具名称及参数 | 实际成功结果或错误 | 白名单、参数、权限和预算 |
| 反馈 | 实际执行结果 | 与原调用关联的新观察 | 调用标识、结果结构和脱敏 |

在工单 `CASE-1042` 中，目标是核对 `ORD-2048` 的状态。模型先提出 `get_order_status`，应用执行查询，得到 `in_transit`，再把该事实提供给模型。最终结果还要由应用与查询证据核对。

观察不等于全部历史。已经失效的资料、其他租户数据和敏感日志不能因为存在于记录中就自动进入下一次模型输入。

### 2. 调用标识与输入历史

一次函数调用有自己的 `call_id`。工具结果必须使用同一个标识回传，才能表示它回答的是哪个调用。相同工具在同一步被调用两次时，仅靠名称无法建立关联。

使用 Responses API 的显式历史时，应保留该轮需要续接的模型输出项，再追加 `function_call_output`。不能只拼接最后的文本，否则函数调用和结果之间的关系会丢失；涉及推理输出项的模型还需要保留接口要求的相关输出项。

::: warning 工具错误也是观察，但不是成功证据
参数不合法、对象不存在或执行超时，都应形成明确错误供应用决定恢复或结束。失败结果可以帮助模型调整路径，却不能支撑一个本来需要成功查询的最终状态。
:::

## 二、状态与终止

### 1. 运行状态

状态是应用保存的事实，不是从模型的自然语言中推测出来的。至少需要知道已经发出多少次模型请求、是否有未完成工具调用、已经获得什么证据，以及当前是否允许继续。

| 字段 | 示例 | 用途 |
|------|------|------|
| `phase` | `ready`、`awaiting_model`、`awaiting_tool` | 判断下一事件是否允许 |
| `steps` / `max_steps` | `2` / `4` | 限制模型请求次数 |
| `pending_call` | `call_1` | 防止错配或重复反馈 |
| `evidence` | 当前订单的成功查询结果 | 最终事实验收 |
| `termination` | `completed`、`failed`、`max_steps` | 明确停止原因 |

一次模型请求记为一个步骤。工具调用数单独统计，因为同一个响应可以提出多个调用；时间、Token 和费用也不能由步骤数代替。

### 2. 结束条件

模型响应完成只表示当前生成过程结束，不表示 Agent 任务完成。包含函数调用的 `completed` Response 仍要求应用执行工具，再决定是否调用模型。

| 条件 | 应用决策 | 对用户的含义 |
|------|----------|--------------|
| 最终结果与任务和成功证据一致 | `completed` | 当前目标已经通过验收 |
| 结果不合法或证据不足 | `failed` 或显式不足状态 | 没有形成可提交结果 |
| 下一次请求将超过上限 | `max_steps` | 预算内未完成 |
| 动作需要人工批准 | `approval_required` | 等待具体动作的确认 |
| 用户取消任务 | `cancelled` | 不再发起新动作 |

进入终态后不应继续执行工具。对外返回的结果应保留终止原因，避免把预算耗尽和资料不足都包装为“成功答复”。

下面是核心循环的伪代码，省略持久化、并行调度及协议细节，不是可执行程序：

::: details 查看控制循环伪代码

```text
在任务通过本地校验后建立运行状态
循环：
    如果请求预算已耗尽，终止为未完成
    将任务与有效观察交给模型
    如果响应失败，按错误策略结束或恢复
    如果响应提出工具调用：
        校验名称、参数、授权和工具预算
        执行允许的动作并记录真实结果
        将结果关联到原调用后继续
    否则：
        依据业务条件和工具证据校验最终结果
        返回通过结果或明确失败
```

:::

## 三、事件状态机验证

### 1. 环境和事件约定

在空目录中创建 `loop_state.py`，使用 Python 3.12，程序只依赖标准库。它是控制循环的确定性状态验证器，不调用模型，也不查询真实订单。

下面的实现每步只接受一个只读调用，目的是观察事件顺序与终止条件；真实的多调用响应需要把单个 `pending_call` 扩展为调用集合，并为每项独立核对关联关系。

```powershell
mkdir loop-state-demo
cd loop-state-demo
python --version
```

`model_requested` 增加步骤，`tool_called` 建立待返回调用，`tool_returned` 提供结果，`answer_returned` 验收最终字段。模型请求失败由 `model_failed` 表示。

### 2. 完整实现

状态机拒绝错序事件和错误 `call_id`。工具失败后允许模型再处理一次错误，但无成功证据的最终回答不能通过。

::: details 查看事件状态机及五个确定性用例

```python
# loop_state.py
from dataclasses import dataclass


@dataclass
class LoopState:
    """保存单工具演示的阶段、步骤、待返回调用和成功证据。"""

    max_steps: int = 2
    phase: str = "ready"
    steps: int = 0
    pending_call: str | None = None
    evidence: dict | None = None


def transition(state: LoopState, event: str, payload: dict) -> None:
    """根据单个运行事件更新状态，不执行模型或工具。

    Args:
        state: 当前状态，max_steps 必须为正整数；终态不可继续修改。
        event: 本示例支持的模型请求、工具调用、结果或失败事件名。
        payload: 事件数据；调用和返回需包含同一个非空 call_id。

    Returns:
        无返回值；原地更新 state，终态再次接收事件时抛出 ValueError。
    """
    if state.max_steps <= 0:
        raise ValueError("max_steps must be positive")
    if state.phase in {"completed", "failed", "max_steps"}:
        raise ValueError("terminal state cannot continue")
    if event == "model_requested" and state.phase == "ready":
        if state.steps >= state.max_steps:
            state.phase = "max_steps"
        else:
            state.steps += 1
            state.phase = "awaiting_model"
    elif event == "tool_called" and state.phase == "awaiting_model":
        if payload.get("name") != "get_order_status" or not payload.get("call_id"):
            state.phase = "failed"
        else:
            state.pending_call = payload["call_id"]
            state.phase = "awaiting_tool"
    elif event == "tool_returned" and state.phase == "awaiting_tool":
        if payload.get("call_id") != state.pending_call:
            state.phase = "failed"
            return
        result = payload.get("result", {})
        if result.get("ok") is True and result.get("order_id") == "ORD-2048":
            state.evidence = dict(result)
        state.pending_call = None
        state.phase = "ready"
    elif event == "answer_returned" and state.phase == "awaiting_model":
        accepted = (
            state.evidence is not None
            and set(payload) == {"order_id", "status"}
            and payload["order_id"] == state.evidence["order_id"]
            and payload["status"] == state.evidence["status"]
        )
        state.phase = "completed" if accepted else "failed"
    else:
        # 未完成响应和不满足阶段约束的事件均不能驱动新动作。
        state.phase = "failed"


def run_events(events: list[tuple[str, dict]], max_steps: int = 2) -> LoopState:
    """回放固定事件列表，返回其最终状态。

    Args:
        events: 按发生顺序排列的事件和数据，不得在终态后继续追加事件。
        max_steps: 正整数模型请求上限，不包含工具执行次数。

    Returns:
        已回放全部事件的 LoopState；非法终态续接由 transition 抛出异常。
    """
    state = LoopState(max_steps=max_steps)
    for event, payload in events:
        transition(state, event, payload)
    return state


def main() -> None:
    """验证正常路径、失败证据、关联错配、步数耗尽和响应失败。

    Returns:
        无返回值；断言失败抛出异常，通过时输出五个用例的结果。
    """
    prefix = [
        ("model_requested", {}),
        ("tool_called", {"name": "get_order_status", "call_id": "c1"}),
    ]
    success = {"ok": True, "order_id": "ORD-2048", "status": "in_transit"}
    final = {"order_id": "ORD-2048", "status": "in_transit"}
    ready = prefix + [("tool_returned", {"call_id": "c1", "result": success})]
    complete = ready + [("model_requested", {}), ("answer_returned", final)]
    assert run_events(complete).phase == "completed"
    failed_tool = prefix + [
        ("tool_returned", {"call_id": "c1", "result": {"ok": False}}),
        ("model_requested", {}),
        ("answer_returned", final),
    ]
    assert run_events(failed_tool).phase == "failed"
    mismatched = prefix + [("tool_returned", {"call_id": "c2", "result": success})]
    assert run_events(mismatched).phase == "failed"
    limited = run_events(ready + [("model_requested", {})], max_steps=1)
    assert limited.phase == "max_steps" and limited.steps == 1
    assert run_events([("model_requested", {}), ("model_failed", {})]).phase == "failed"
    print("loop_tests=passed cases=5 completed_steps=2")


if __name__ == "__main__":
    main()
```

:::

### 3. 执行与观察

在创建文件的目录运行：

```powershell
python loop_state.py
```

实际验证输出：

```text
loop_tests=passed cases=5 completed_steps=2
```

正常路径使用两次模型请求，工具执行夹在中间。错误 `call_id` 被拒绝；成功格式的最终字段也不能覆盖失败工具结果；步数上限阻止第二次请求。断言失败会给出非零退出码，应先检查事件顺序和对应数据，而不是提高预算掩盖错误。

::: info 事件测试的证明范围
这组用例证明应用状态判断可独立于模型验证，未证明模型会选择正确工具，也未测试真实超时、网络取消、权限或并发。模型接口和工具实际执行需要单独验证。
:::

## 四、失败传播与诊断

### 1. 明确失败所属层次

模型请求、工具执行和最终验收是不同失败来源。把它们统一变成一段“发生错误”，会丢失恢复所需的证据。

| 失败 | 判断证据 | 当前动作 |
|------|----------|----------|
| 响应未完成 | Response 状态、缺失输出 | 不执行未经确认的动作 |
| 工具参数错误 | 校验错误码、原调用标识 | 回传明确错误或终止 |
| 执行结果未知 | 请求已经发出，但没有确认返回 | 查询动作记录，不能直接当作未执行 |
| 最终结果不受证据支持 | 字段与查询记录不一致 | 判定失败，保留已取得事实 |
| 预算耗尽 | 当前步数达到应用上限 | 返回未完成，不继续发起请求 |

对只读查询，重试主要影响成本和时效；对写操作，重试还可能重复副作用。因此“继续循环”不能代替业务层的恢复判断。

### 2. 保留最小诊断信息

记录任务标识、步骤、Response ID、工具名称、`call_id`、成功标记和终止原因，可以还原模型选择与执行反馈的对应关系。日志无需复制完整模型输入或工具返回正文；敏感字段应按实际用途脱敏。

应用应能回答：这一轮取得了什么可信事实，为什么允许下一步，最终为何停止。不能从事件记录回答这些问题时，应先完善状态与证据，而不是增加循环次数。

## 五、参考资料

- [首个 Agent 与结果验证](./03-first-agent-validation.md)：使用 Responses API 的独立可运行工具循环。
- [OpenAI Function calling](https://developers.openai.com/api/docs/guides/function-calling)：调用项、结果回传及多步工具交互。
- [Responses 响应对象](https://developers.openai.com/api/reference/python/resources/responses/methods/create)：响应状态与输入、输出项目。
