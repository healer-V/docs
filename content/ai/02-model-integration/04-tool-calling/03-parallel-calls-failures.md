---
title: "并行调用与失败处理"
tags:
  - OpenAI API
  - Function Calling
  - 并发
excerpt: "处理同一 Response 中的多个函数调用，按 call_id 保持结果对应，并通过超时、局部失败和副作用约束决定并行或串行执行。"
date: 2026-09-28
---

# 并行调用与失败处理

一个 Response 可以包含零个、一个或多个函数调用。多个调用不等于都应并行：只有互相独立、可安全重试且不存在顺序依赖的读取操作，才适合同时执行。无论执行顺序如何，结果都必须使用原始 `call_id` 回传，不能按完成先后猜测对应关系。

本文模拟两个订单状态查询：一个成功，一个受控超时。批次执行保留成功结果，把失败编码为明确工具结果，再将两项结果一次性回传给模型。

## 一、调用集合

### 1. 完整提取

应用应遍历 `response.output`，收集所有 `function_call` 项。只取第一个调用会静默丢失后续请求。

```python
calls = [item for item in response.output if item.type == "function_call"]
```

每个调用至少包含名称、JSON 参数和 `call_id`。`call_id` 是协议关联键；输出项 ID、数组下标和工具名称都不能替代它。

### 2. 对应关系

| 字段 | 是否可作回传关联键 | 原因 |
|------|--------------------|------|
| `call_id` | 是 | API 明确要求工具结果引用它 |
| `item.id` | 否 | 标识输出项，不是结果回传字段 |
| 数组下标 | 否 | 并发完成顺序会变化 |
| 函数名称 | 否 | 同一函数可以被调用多次 |
| 参数内容 | 否 | 参数可能相同，也可能被规范化 |

::: warning 完成顺序不是调用顺序
并发任务通常先完成较快的调用。回传结果可以按稳定顺序整理，但每条 `function_call_output` 必须保留自己的 `call_id`，不能用 `zip(calls, completed_results)` 依赖完成先后。
:::

## 二、并行条件

### 1. 可并行操作

下列条件同时满足时，才适合并行：

- 调用之间没有数据依赖；
- 工具为只读或具有可靠幂等语义；
- 单个失败不会破坏其他调用的有效性；
- 每个调用有独立超时与错误结果；
- 下游允许部分成功。

查询两个不同订单、读取两个独立库存位置通常可以并行。

### 2. 必须串行

以下情况应保持顺序：

- 第二个调用参数依赖第一个结果；
- 调用会修改同一资源；
- 操作需要事务性全成或全败；
- 权限确认只对特定步骤有效；
- 服务端有严格限流或顺序约束。

“模型同时提出”只是输入事实，不是并发安全证明。

## 三、失败模型

### 1. 局部失败

单个工具失败不应抛出到批次顶层并丢失所有成功结果。执行器应把每个调用转换为统一结果：

| 状态 | 结果内容 | 是否可继续 |
|------|----------|------------|
| 成功 | 业务数据与稳定状态 | 是 |
| 参数无效 | 可公开的校验错误代码 | 是，让模型说明缺失条件 |
| 超时 | `tool_timeout` 与可重试标记 | 视任务要求 |
| 未知工具 | `unknown_tool` | 否，属于契约错误 |
| 权限拒绝 | `permission_denied` | 进入人工或拒绝分支 |

工具输出是发回模型的数据，不是内部异常堆栈。不要把凭据、数据库错误、文件路径或完整 Traceback 放入输出。

### 2. 批次失败

只有以下情况才应终止整个批次：

- Response 对象损坏，无法确定调用关联；
- 调用集合违反不变量，例如 `call_id` 重复；
- 业务要求原子执行而当前执行器不提供事务保证；
- 进程正在关闭，无法可靠记录任何结果。

可预期的工具超时或单项不存在不属于批次基础设施失败。

## 四、批次执行器

下面的离线程序使用线程池执行两个只读工具。固定延迟用于稳定制造一个局部超时，不依赖真实网络服务。

::: details 查看并行调用完整实现

```python
# parallel_tools.py
import json
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from dataclasses import dataclass
from typing import Callable


@dataclass(frozen=True)
class FunctionCall:
    """保存模型提出的最小函数调用。"""

    call_id: str
    name: str
    arguments: str


@dataclass(frozen=True)
class ToolResult:
    """保存与 call_id 绑定的公开工具结果。"""

    call_id: str
    payload: dict


def get_order_status(order_id: str) -> dict:
    """查询虚构订单状态。

    Args:
        order_id: 格式为 ORD- 加四位数字的虚构订单号。

    Returns:
        可序列化的订单状态；ORD-9999 用于受控慢调用。
    """
    if order_id == "ORD-9999":
        time.sleep(0.2)
    records = {
        "ORD-2048": {"status": "in_transit"},
        "ORD-9999": {"status": "processing"},
    }
    if order_id not in records:
        return {"ok": False, "error": "order_not_found"}
    return {"ok": True, "order_id": order_id, **records[order_id]}


def execute_call(call: FunctionCall) -> ToolResult:
    """校验并执行白名单中的单个函数调用。

    Args:
        call: 包含稳定 call_id、名称和 JSON 参数的调用。

    Returns:
        与原 call_id 绑定的成功或公开错误结果。
    """
    if call.name != "get_order_status":
        return ToolResult(call.call_id, {"ok": False, "error": "unknown_tool"})
    try:
        arguments = json.loads(call.arguments)
        order_id = arguments["order_id"]
    except (json.JSONDecodeError, KeyError, TypeError):
        return ToolResult(call.call_id, {"ok": False, "error": "invalid_arguments"})
    return ToolResult(call.call_id, get_order_status(order_id))


def execute_batch(
    calls: list[FunctionCall],
    timeout_seconds: float,
    executor_factory: Callable[..., ThreadPoolExecutor] = ThreadPoolExecutor,
) -> list[ToolResult]:
    """并发执行独立只读调用，并隔离每项超时。

    Args:
        calls: 已判断可并行的函数调用集合，call_id 必须唯一。
        timeout_seconds: 每个结果允许等待的秒数，必须大于 0。
        executor_factory: 线程池工厂，便于测试替换执行环境。

    Returns:
        按原调用顺序排列、与 call_id 明确绑定的结果列表。

    Raises:
        ValueError: call_id 重复或超时配置无效。
    """
    if timeout_seconds <= 0:
        raise ValueError("timeout_seconds must be positive")
    if len({call.call_id for call in calls}) != len(calls):
        raise ValueError("duplicate call_id")

    with executor_factory(max_workers=len(calls) or 1) as executor:
        futures = {call.call_id: executor.submit(execute_call, call) for call in calls}
        results: list[ToolResult] = []
        for call in calls:
            try:
                results.append(futures[call.call_id].result(timeout=timeout_seconds))
            except TimeoutError:
                results.append(
                    ToolResult(call.call_id, {"ok": False, "error": "tool_timeout"})
                )
        return results


def to_outputs(results: list[ToolResult]) -> list[dict]:
    """转换为 Responses API 接受的工具输出项。"""
    return [
        {
            "type": "function_call_output",
            "call_id": result.call_id,
            "output": json.dumps(result.payload, ensure_ascii=False),
        }
        for result in results
    ]


def main() -> None:
    """验证一个成功和一个超时结果不会错配。"""
    calls = [
        FunctionCall("call_fast", "get_order_status", '{"order_id":"ORD-2048"}'),
        FunctionCall("call_slow", "get_order_status", '{"order_id":"ORD-9999"}'),
    ]
    results = execute_batch(calls, timeout_seconds=0.05)
    outputs = to_outputs(results)
    assert outputs[0]["call_id"] == "call_fast"
    assert json.loads(outputs[0]["output"])["ok"] is True
    assert outputs[1]["call_id"] == "call_slow"
    assert json.loads(outputs[1]["output"])["error"] == "tool_timeout"
    print(json.dumps(outputs, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
```

:::

运行：

```powershell
python parallel_tools.py
```

输出包含两个独立项：`call_fast` 为成功订单状态，`call_slow` 为 `tool_timeout`。即使慢任务稍后结束，当前批次也只使用已记录的超时结果；存在副作用的工具还需要取消协作或幂等隔离，不能照搬该线程示例。

## 五、结果回传

### 1. 一次性提交

收集所有工具结果后，通过第二次 Responses 请求提交。每个结果保留自己的 `call_id`：

```python
final = client.responses.create(
    model=model,
    previous_response_id=initial.id,
    input=to_outputs(results),
)
```

模型可以根据成功与失败结果生成综合说明。应用仍应在最终文本外保存结构化工具结果，便于审计哪些数据真实查询成功。

### 2. 失败表达

错误输出应稳定、最小且可判断：

```json
{
  "ok": false,
  "error": "tool_timeout",
  "retryable": true
}
```

不要把工具失败伪装成空成功，也不要让模型根据错误堆栈推断是否重试。重试资格由应用策略决定。

## 六、副作用边界

并行读取与并行写入不是同一风险等级。对退款、发信、删除或发布操作，需要额外满足：

- 每次调用有稳定业务幂等键；
- 权限和人工确认分别绑定到具体动作；
- 超时后可以查询真实执行状态；
- 重放不会产生第二次副作用；
- 部分成功具有明确补偿或人工处理流程。

不能满足时，应串行执行或拒绝自动执行。

## 七、验证结论

多调用处理的核心不是启动多少线程，而是保持集合完整、关联稳定和失败隔离。离线示例验证了一个成功、一个超时仍可生成两条与原始 `call_id` 对应的输出。

本文只对独立只读工具证明局部失败策略；跨服务事务、分布式取消和 Agent 调度属于后续架构范围。

## 八、参考资料

- [Function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [Error codes](https://developers.openai.com/api/docs/guides/error-codes)
