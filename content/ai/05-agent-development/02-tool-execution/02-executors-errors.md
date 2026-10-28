---
title: "执行器与错误"
tags:
  - AI Agent
  - Python
  - asyncio
excerpt: "使用 Python 标准库构建只读工具执行器，在执行前校验名称、参数及对象权限，在执行中处理超时与取消，并以确定性用例验证错误映射、输出校验和脱敏轨迹。"
date: 2026-09-29
---

# 执行器与错误

工具执行器接收模型提出的调用，将它转换成应用允许的函数执行。它负责名称分派、参数校验、授权、时间限制和结果检查，向运行器返回稳定结果，并保存可以定位失败的最小轨迹。

模型提供的工具名称与参数都属于待校验输入。即使工具已向模型声明，执行器仍须根据当前身份和对象范围判断这一次调用能否执行。

## 一、执行顺序

### 1. 白名单分派

白名单是应用维护的允许工具集合，名称必须精确匹配注册项。实现使用明确的名称到函数映射，不把模型文本交给 `eval`、动态导入或任意属性查找。

本例只注册 `get_order_status` 和 `read_case_note`。两个实现读取固定虚构资料，不提供写订单、退款或运行系统命令的入口。

执行链路如下；参数与权限拒绝发生在调用函数之前：

```text
接收调用 → 匹配白名单 → 校验 JSON 与参数 → 检查对象权限
  → 进入工具 → 限时等待 → 校验输出 → 返回观察
                     ├─ 超时/异常 → 稳定错误
                     └─ 外部取消 → 清理并传播取消
```

### 2. 参数与对象授权

参数校验回答“输入是否符合契约”，授权回答“当前主体是否能访问这个对象”。格式合法的 `ORD-4040` 仍可能不存在；存在的 `ORD-2048` 也可能不属于当前主体的允许集合。

示例把认证后的订单集合与工单集合放入 `ExecutionContext`。它由应用构造，不能从模型 JSON 中读取。真实服务需要从可信身份与业务关系获得这些集合，并在执行时处理权限变更。

::: info 示例的执行条件
使用 Python 3.12 标准库，无需 API Key、第三方包或订单服务。身份、权限和业务数据都是固定夹具，仅验证执行器边界，不包含真实登录或授权平台。
:::

## 二、错误与取消

### 1. 稳定错误映射

运行器需要依据错误类型判断补充参数、结束任务或恢复，而不是解析异常中的自然语言。公开结果使用稳定原因码，内部异常不会原样返回给模型。

| 原因码 | 执行状态 | 运行器可采取的动作 |
|--------|----------|--------------------|
| `unknown_tool` | `not_started` | 检查工具列表或结束不支持的动作 |
| `invalid_json`、`invalid_arguments` | `not_started` | 补充合法参数；不能绕过校验 |
| `permission_denied` | `not_started` | 返回权限不足，不借重试扩大访问范围 |
| `not_found` | `confirmed` | 查询已确认无此演示对象，核对标识 |
| `tool_timeout`、`tool_unavailable` | `unknown` | 结合只读性、幂等状态和预算决定恢复 |
| `invalid_tool_result`、`internal_tool_error` | `unknown` | 保留失败证据，排查实现或上游契约 |

这里的 `confirmed` 表示该次业务判断已经明确，不等于成功。`unknown` 表示未取得可采信的最终结果；如果换成写工具，不能据此认定后端没有执行。

### 2. 协作式超时

Python 的 `asyncio.timeout()` 在期限到达时取消当前任务，并在退出超时上下文时转换为 `TimeoutError`。工具必须在异步等待点响应取消，并在 `finally` 中释放资源。

::: warning 超时不能强制停止所有工作
示例只处理协作式异步函数。同步阻塞、吞掉 `CancelledError` 的协程以及已经发送到远程服务的动作，不能靠这个超时上下文保证停止。外部写动作还需独立查询业务执行状态。
:::

### 3. 外部取消

任务取消与工具失败具有不同含义。外部调用方取消 Agent 运行时，执行器清理并记录 `cancelled`，随后重新抛出 `CancelledError`，让运行器停止当前任务。

把取消吞掉并转成“可重试工具错误”，可能让本应停止的任务继续执行。取消发生时是否已有业务动作，同样需要依据执行记录判断；本例只演示只读协程的清理。

## 三、独立执行器

### 1. 建立运行目录

在空目录中准备 Python 3.12：

```powershell
mkdir tool-executor-demo
cd tool-executor-demo
python --version
```

创建 `tool_executor.py`。文件包含两个只读实现、注册表、执行器及十四个验证用例。测试通过替换应用持有的注册实现注入超时、内部错误和损坏输出，模型参数不能替换实现。

### 2. 完整实现

授权拒绝不进入函数；执行后只接受对应工具的结果字段与来源。轨迹不保存参数正文、工单备注或异常文本。

::: details 查看白名单执行器和十四个验证用例

```python
# tool_executor.py
import asyncio
import json
import re
from dataclasses import dataclass, replace
from datetime import datetime
from time import monotonic
from typing import Awaitable, Callable


@dataclass(frozen=True)
class ExecutionContext:
    """保存应用认证后的对象范围，不能由模型参数替代。"""

    order_ids: frozenset[str]
    case_ids: frozenset[str]


@dataclass(frozen=True)
class ToolSpec:
    """绑定只读实现、参数格式、权限类别及协作式超时。"""

    argument: str
    pattern: str
    scope: str
    handler: Callable[[dict], Awaitable[dict]]
    source: str
    timeout_seconds: float = 0.2


class ToolUnavailable(Exception):
    """表示演示工具后端暂时不可用，异常正文不会对模型公开。"""


class ToolNotFound(Exception):
    """表示业务查询确认无此对象，避免把实现中的 KeyError 误判为业务拒绝。"""


async def get_order_status(arguments: dict) -> dict:
    """读取固定订单状态，不改变业务数据。

    Args:
        arguments: 已校验且已授权的 order_id 参数对象。

    Returns:
        公开订单事实；不存在时抛出 ToolNotFound。
    """
    await asyncio.sleep(0)
    if arguments["order_id"] != "ORD-2048":
        raise ToolNotFound("order not found")
    return {
        "order_id": "ORD-2048", "status": "in_transit",
        "updated_at": "2026-09-29T02:00:00+00:00", "source": "orders-memory",
    }


async def read_case_note(arguments: dict) -> dict:
    """读取固定工单备注，备注内容仅作为数据返回。

    Args:
        arguments: 已校验且已授权的 case_id 参数对象。

    Returns:
        公开备注和来源；不存在时抛出 ToolNotFound。
    """
    await asyncio.sleep(0)
    if arguments["case_id"] != "CASE-1042":
        raise ToolNotFound("case not found")
    return {
        "case_id": "CASE-1042", "note": "Please check the shipping status.",
        "updated_at": "2026-09-29T02:00:00+00:00", "source": "cases-memory",
    }


def create_registry() -> dict[str, ToolSpec]:
    """构造应用白名单，不接受模型动态增加工具。

    Returns:
        包含两个只读工具的注册表，测试可由应用替换其实现。
    """
    return {
        "get_order_status": ToolSpec("order_id", r"ORD-[0-9]{4}", "order",
                                     get_order_status, "orders-memory"),
        "read_case_note": ToolSpec("case_id", r"CASE-[0-9]{4}", "case",
                                   read_case_note, "cases-memory"),
    }


def failure(tool: str, call_id: str, code: str, retryable: bool, outcome: str) -> dict:
    """构造不含底层异常正文的公开错误。

    Args:
        tool: 已登记工具名；未登记输入统一使用 unregistered。
        call_id: 经应用校验的本次调用标识。
        code: 当前执行器约定的稳定原因码。
        retryable: 错误是否具有临时性，不表示自动重试许可。
        outcome: not_started、unknown 或 confirmed。

    Returns:
        ok 为 False、data 为 None 的统一结果对象。
    """
    return {
        "ok": False, "data": None,
        "error": {"code": code, "retryable": retryable, "outcome": outcome},
        "meta": {"tool": tool, "contract_version": 1, "execution_id": call_id},
    }


def valid_result(spec: ToolSpec, arguments: dict, data: object) -> bool:
    """检查演示工具的输出形状、对象、来源和时间格式。

    Args:
        spec: 当前白名单中的工具约定。
        arguments: 当前已经校验并授权的参数。
        data: 工具原始返回值，不能假定是字典。

    Returns:
        所有演示约束成立时为 True；不证明业务时效或外部来源真实性。
    """
    value_field = "status" if spec.scope == "order" else "note"
    required = {spec.argument, value_field, "updated_at", "source"}
    if not isinstance(data, dict) or set(data) != required:
        return False
    if any(type(data[field]) is not str for field in required):
        return False
    if data[spec.argument] != arguments[spec.argument] or data["source"] != spec.source:
        return False
    if spec.scope == "order" and data["status"] not in {"in_transit", "delivered"}:
        return False
    if not data[value_field]:
        return False
    try:
        observed = datetime.fromisoformat(data["updated_at"])
        return observed.utcoffset() is not None
    except ValueError:
        return False


async def execute_tool(
    name: str, raw_arguments: str, context: ExecutionContext,
    registry: dict[str, ToolSpec], trace: list[dict], call_id: str,
) -> dict:
    """校验并执行一个只读工具，传播外部取消。

    Args:
        name: 模型提出的名称，仅允许白名单精确匹配。
        raw_arguments: 模型 JSON 参数文本，长度最多 4096 个字符。
        context: 应用认证后的对象读取范围。
        registry: 应用持有的白名单，模型不能修改。
        trace: 当前运行的脱敏事件列表，不保存输入或异常正文。
        call_id: 应用取得的调用标识，格式为 call_ 加字母、数字、下划线或短横线。

    Returns:
        统一成功或错误对象；外部取消重新抛出 CancelledError，并追加轨迹。
    """
    if not isinstance(call_id, str) or not re.fullmatch(r"call_[A-Za-z0-9_-]{1,64}", call_id):
        raise ValueError("invalid application call id")
    spec = registry.get(name) if isinstance(name, str) else None
    tool = name if spec is not None else "unregistered"
    started = monotonic()
    result = None
    cancelled = False
    try:
        if spec is None:
            result = failure(tool, call_id, "unknown_tool", False, "not_started")
            return result
        if not isinstance(raw_arguments, str) or len(raw_arguments) > 4096:
            result = failure(tool, call_id, "invalid_arguments", False, "not_started")
            return result
        try:
            arguments = json.loads(raw_arguments)
        except json.JSONDecodeError:
            result = failure(tool, call_id, "invalid_json", False, "not_started")
            return result
        if (not isinstance(arguments, dict) or set(arguments) != {spec.argument}
                or type(arguments[spec.argument]) is not str
                or not re.fullmatch(spec.pattern, arguments[spec.argument])):
            result = failure(tool, call_id, "invalid_arguments", False, "not_started")
            return result
        allowed = context.order_ids if spec.scope == "order" else context.case_ids
        if arguments[spec.argument] not in allowed:
            result = failure(tool, call_id, "permission_denied", False, "not_started")
            return result
        # 只包裹协作式异步执行，不把超时解释为业务动作一定未发生。
        try:
            async with asyncio.timeout(spec.timeout_seconds):
                data = await spec.handler(arguments)
        except asyncio.CancelledError:
            cancelled = True
            raise
        except TimeoutError:
            result = failure(tool, call_id, "tool_timeout", True, "unknown")
            return result
        except ToolUnavailable:
            result = failure(tool, call_id, "tool_unavailable", True, "unknown")
            return result
        except ToolNotFound:
            result = failure(tool, call_id, "not_found", False, "confirmed")
            return result
        except Exception:
            result = failure(tool, call_id, "internal_tool_error", False, "unknown")
            return result
        if not valid_result(spec, arguments, data):
            result = failure(tool, call_id, "invalid_tool_result", False, "unknown")
            return result
        result = {
            "ok": True, "data": data, "error": None,
            "meta": {"tool": tool, "contract_version": 1, "execution_id": call_id},
        }
        return result
    finally:
        trace.append({
            "tool": tool, "execution_id": call_id,
            "status": "cancelled" if cancelled else ("success" if result and result["ok"] else "error"),
            "code": result["error"]["code"] if result and result["error"] else None,
            "elapsed_ms": round((monotonic() - started) * 1000, 3),
        })


async def run_tests() -> None:
    """注入十四种正常或失败路径，核对清理、取消和公开轨迹。

    Returns:
        无返回值；失败抛出断言错误，通过时输出用例数。
    """
    registry = create_registry()
    context = ExecutionContext(frozenset({"ORD-2048", "ORD-4040"}), frozenset({"CASE-1042"}))
    trace = []
    order_args = '{"order_id":"ORD-2048"}'
    result = await execute_tool("get_order_status", order_args, context, registry, trace, "call_1")
    assert result["ok"] and result["data"]["status"] == "in_transit"
    note = await execute_tool("read_case_note", '{"case_id":"CASE-1042"}', context,
                              registry, trace, "call_2")
    assert note["ok"] and note["data"]["source"] == "cases-memory"
    cases = 2
    rejected = [
        ("delete_order", "{}", "unknown_tool"),
        ("get_order_status", "{", "invalid_json"),
        ("get_order_status", "{}", "invalid_arguments"),
        ("get_order_status", '{"order_id":"ORD-2048","approved":true}', "invalid_arguments"),
        ("get_order_status", '{"order_id":true}', "invalid_arguments"),
        ("get_order_status", '{"order_id":"ORD-9999"}', "permission_denied"),
        ("get_order_status", '{"order_id":"ORD-4040"}', "not_found"),
    ]
    for index, (name, raw, code) in enumerate(rejected):
        result = await execute_tool(name, raw, context, registry, trace, f"call_reject_{index}")
        assert result["error"]["code"] == code
        expected_outcome = "confirmed" if code == "not_found" else "not_started"
        assert result["error"]["outcome"] == expected_outcome
        cases += 1

    async def unavailable(arguments: dict) -> dict:
        """注入暂时不可用；arguments 为已校验参数，无返回值而是抛出演示异常。"""
        raise ToolUnavailable("private backend information")

    async def broken(arguments: dict) -> dict:
        """注入实现异常；arguments 为已校验参数，无返回值而是抛出演示异常。"""
        raise RuntimeError("private token must not appear")

    async def wrong_result(arguments: dict) -> dict:
        """注入错对象结果；arguments 为已校验参数，返回损坏的公开结果夹具。"""
        return {"order_id": "ORD-9999", "status": "in_transit",
                "updated_at": "2026-09-29T02:00:00+00:00", "source": "orders-memory"}

    for index, (handler, code) in enumerate([
        (unavailable, "tool_unavailable"), (broken, "internal_tool_error"),
        (wrong_result, "invalid_tool_result"),
    ]):
        changed = {**registry, "get_order_status": replace(registry["get_order_status"], handler=handler)}
        result = await execute_tool("get_order_status", order_args, context, changed,
                                    trace, f"call_fault_{index}")
        assert result["error"]["code"] == code and result["error"]["outcome"] == "unknown"
        assert "private" not in json.dumps(result)
        cases += 1

    entered = asyncio.Event()
    cleaned = asyncio.Event()

    async def waiting(arguments: dict) -> dict:
        """注入可取消等待；arguments 为已校验参数，无正常返回，取消时标记清理完成。"""
        entered.set()
        try:
            await asyncio.Event().wait()
        finally:
            cleaned.set()

    slow = {**registry, "get_order_status": replace(registry["get_order_status"],
                                                     handler=waiting, timeout_seconds=0.05)}
    result = await execute_tool("get_order_status", order_args, context, slow, trace, "call_timeout")
    assert result["error"]["code"] == "tool_timeout" and cleaned.is_set()
    cases += 1
    entered.clear()
    cleaned.clear()
    cancellable = {**registry, "get_order_status": replace(slow["get_order_status"], timeout_seconds=10)}
    task = asyncio.create_task(execute_tool("get_order_status", order_args, context,
                                            cancellable, trace, "call_cancel"))
    await entered.wait()
    task.cancel()
    try:
        await task
        raise AssertionError("cancellation was swallowed")
    except asyncio.CancelledError:
        assert cleaned.is_set() and trace[-1]["status"] == "cancelled"
    cases += 1
    assert len(trace) == cases == 14
    assert all(set(event) == {"tool", "execution_id", "status", "code", "elapsed_ms"} for event in trace)
    assert "private" not in json.dumps(trace)
    print(f"executor_tests=passed cases={cases}")


if __name__ == "__main__":
    asyncio.run(run_tests())
```

:::

### 3. 执行与观察

在当前目录运行：

```powershell
python tool_executor.py
```

通过时输出：

```text
executor_tests=passed cases=14
```

十四条路径包括两个成功工具、未知名称、损坏 JSON、缺失字段、额外字段、错误类型、无权限、对象不存在、暂时不可用、内部异常、错对象输出、超时和外部取消。超时用例还检查清理完成；取消用例等待工具确实进入后再取消，避免把“未启动”误当“取消成功”。

输出只表示执行器用例通过。测试数据中的时间固定用于结果格式检查，没有进行新鲜度判断或真实业务查询。

## 四、结果检查与运行器接入

### 1. 格式与事实

`valid_result()` 检查字段集合、字符串类型、当前对象、来源标识及带时区的时间格式。它拒绝把另一个订单的结果作为当前证据，也拒绝缺字段或未登记来源的返回。

这里仍信任应用注册的实现。若实现被替换、上游返回陈旧数据或业务状态变化，仅凭结果内的 `source` 和格式检查无法证明当前事实。写操作应进一步核对持久执行记录，关键只读结果应按业务要求回查权威服务。

### 2. 接入 Agent 循环

运行器负责把统一结果序列化，并以当前模型调用的 `call_id` 回传；执行器不调用模型，也不决定整个任务是否完成。

结果处理可以遵循以下约定：

| 执行器结果 | 运行器责任 |
|------------|------------|
| 成功 | 保存当前对象证据，再继续模型步骤或核对最终输出 |
| 输入失败 | 回传原因，允许在预算内修正参数 |
| 权限失败 | 明确访问不足，不自动添加权限 |
| 结果未知 | 查询执行状态或按只读策略恢复 |
| 外部取消 | 停止运行并保存已有轨迹 |

是否重试、最多尝试几次以及何时转人工由运行策略决定。本例没有自动重试，避免将临时性标记误解释为通用重放策略。

## 五、失败排查

| 现象 | 定位证据 | 处理 |
|------|----------|------|
| 合法名称仍被拒绝 | 注册表没有对应名称 | 同步模型工具列表与执行白名单 |
| 参数符合 Schema 但无权限 | 原因码 `permission_denied` | 检查可信上下文与业务对象关系 |
| 超时后工具仍在工作 | 工具阻塞或不响应取消 | 使用可取消 I/O，外部动作查询执行状态 |
| Agent 被取消却继续执行 | 取消被转换成普通错误 | 清理后传播 `CancelledError` |
| `ok=true` 仍输出错误订单 | 输出对象与当前参数未核对 | 在保存证据之前验证输出契约 |
| 日志包含凭据或备注 | 保存了参数/异常原文 | 改用关联 ID、原因码和受控内部日志 |

执行器建立的是单次调用边界。真实认证、写操作审批、网络隔离、持久状态和业务幂等仍需要独立实现；当前只读示例没有提供这些能力。

## 六、参考资料

- [Python asyncio 任务与取消](https://docs.python.org/3.12/library/asyncio-task.html)：`asyncio.timeout`、任务取消与清理。
- [OpenAI Function calling](https://developers.openai.com/api/docs/guides/function-calling)：应用执行函数并回传调用结果。
- [工具契约](./01-tool-contracts.md)：输入、输出、副作用与公开错误约定。
- [幂等与结果核对](./03-idempotency-result-verification.md)：执行状态未知时的持久记录与回查。
