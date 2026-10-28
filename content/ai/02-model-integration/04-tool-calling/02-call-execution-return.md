---
title: "调用执行与结果回传"
tags:
  - OpenAI API
  - Tool Calling
  - Python
excerpt: "使用 Responses API 完成函数调用识别、参数校验、本地执行与结果回传，理解 call_id 的关联作用和工具执行的安全边界。"
date: 2026-09-28
---

# 调用执行与结果回传

函数工具调用是一套由模型和应用共同完成的协议：模型根据输入提出函数名和参数，应用决定是否允许执行、执行哪个本地函数，再把结果交还模型生成面向用户的答复。**模型只提出调用请求，不会替应用执行 Python 函数。**

本文使用虚构订单 `ORD-20260928-001` 完成一次查询闭环。应用只开放 `get_order_status`，本地数据返回物流状态、承运商和预计送达日期；模型只能依据回传结果组织答复，不能猜测订单状态。

::: tip 工具调用的最小闭环
第一次响应必须包含 `function_call`；应用必须校验并执行它；`function_call_output` 必须携带同一个 `call_id`；第二次响应完成且文本非空，才能得到最终答复。
:::

## 一、调用协议

工具调用跨越模型服务和应用进程。先明确每个对象的责任，才能判断参数错误、执行失败或结果错配发生在哪一层。

### 1. 参与对象

| 对象 | 产生方 | 主要内容 | 应用责任 |
|------|--------|----------|----------|
| 工具定义 | 应用 | 函数名、描述、参数 Schema | 只暴露必要能力，限制字段与类型 |
| `function_call` | 模型 | `name`、JSON `arguments`、`call_id` | 识别输出项，不把参数视为可信输入 |
| 本地函数结果 | 应用 | 查询结果或受控错误 | 执行允许的函数，避免任意代码调用 |
| `function_call_output` | 应用 | `call_id`、序列化结果 | 与原调用准确关联并继续请求 |
| 最终响应 | 模型 | 面向用户的文本 | 验证状态与内容，再交给业务层 |

工具定义中的 JSON Schema 能约束模型生成的参数形状，但参数仍来自模型输出。应用侧校验不能因为启用了 `strict` 而省略。

### 2. 两阶段请求

一次工具闭环至少包含两次模型请求，中间插入一次应用执行：

```text
用户问题
  → 第一次 Responses 请求
  → function_call(name, arguments, call_id)
  → 应用校验并执行本地函数
  → function_call_output(call_id, output)
  → 第二次 Responses 请求
  → 最终文本答复
```

第一次请求让模型决定需要哪个工具；第二次请求让模型读取工具结果并继续回答。把两次请求压缩成“一次模型调用”，会掩盖应用实际承担的执行责任。

### 3. `call_id` 关联

`call_id` 标识一次具体函数调用。应用回传结果时必须原样使用对应调用的 `call_id`，不能改用响应 ID、工具名或自行生成的业务编号。

| 标识 | 作用 | 能否替代 `call_id` |
|------|------|--------------------|
| Response `id` | 标识整次响应 | 否 |
| 工具 `name` | 标识函数类型 | 否；同一响应可多次调用同一工具 |
| 订单号 | 标识业务对象 | 否；它属于函数参数 |
| `call_id` | 关联调用项与返回项 | 是，必须一一对应 |

本文强制只产生一个调用，便于看清协议。多个并行调用需要为每个调用分别执行并回传，不能把多个结果绑定到同一个 `call_id`。

## 二、执行边界

模型输出不能直接映射为任意 Python 可调用对象。稳定的执行器至少要完成函数白名单、JSON 解析、字段集合、字段类型和业务对象五层校验。

### 1. 允许函数

本文使用显式判断，只允许 `get_order_status`。生产代码可以使用静态注册表，但不能通过 `globals()`、动态导入或 `eval()` 按模型返回的名称寻找函数。

```python
if name != "get_order_status":
    raise ValueError(f"不允许的工具：{name}")
```

这个判断解决的是**可调用能力边界**。即使攻击者让模型输出 `delete_order`，应用也会在进入业务函数前拒绝请求。

### 2. 参数校验

工具参数在响应中是 JSON 字符串。应用需要先反序列化，再确认它是对象、只包含允许字段，并验证字段类型和值域。

```python
arguments = json.loads(arguments_json)
if not isinstance(arguments, dict) or set(arguments) != {"order_id"}:
    raise ValueError("工具参数必须且只能包含 order_id")
```

拒绝额外字段能够防止模型把未声明数据悄悄带入执行层。订单是否存在则由本地数据源判断，不能依赖模型自行确认。

::: danger 工具参数不是授权凭证
订单号格式正确，不代表当前用户有权查询该订单。本文使用单条虚构数据，只演示协议闭环；真实系统还必须在工具执行前校验用户身份、租户和资源权限。
:::

### 3. 结果边界

工具结果应只包含模型完成当前回答所需的字段。不要把数据库整行、内部备注、凭据或调试对象直接序列化回传。

本文回传五个字段：订单号、状态、承运商、预计送达日期。结果通过 `json.dumps(..., ensure_ascii=False)` 转换为 JSON 字符串，保证 `function_call_output.output` 接收到明确的数据格式。

## 三、环境与依赖

示例从空目录开始，使用 Python 3.12、OpenAI Python SDK 3.19.2 和当前项目可用的文本模型。

### 1. 创建环境

::: code-group

```powershell [PowerShell]
mkdir tool-call-demo
cd tool-call-demo
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
```

```bash [Bash]
mkdir tool-call-demo && cd tool-call-demo
python3.12 -m venv .venv
source .venv/bin/activate
```

:::

安装并核对 SDK：

```bash
python -m pip install "openai==3.19.2"
python -c "import openai; print(openai.__version__)"
```

版本查询应输出 `3.19.2`。如果结果不同，应先核对 `python -m pip --version` 指向的解释器，再继续运行示例。

### 2. 配置凭据

`OPENAI_API_KEY` 是必需变量，`OPENAI_MODEL` 可以覆盖默认模型。不要把真实 Key 写入源码、Markdown 或命令历史文件。

::: code-group

```powershell [PowerShell]
$env:OPENAI_API_KEY = "替换为你的 API Key"
$env:OPENAI_MODEL = "gpt-6-luna"
```

```bash [Bash]
export OPENAI_API_KEY="替换为你的 API Key"
export OPENAI_MODEL="gpt-6-luna"
```

:::

::: info 验证基线
本文在线闭环在 Python 3.12.14、OpenAI Python SDK 3.19.2 和 `gpt-6-luna` 下执行。更换 SDK、模型或兼容网关后，必须重新验证工具对象、工具选择和回传字段。
:::

## 四、完整实现

在示例目录中新建 `tool_call_demo.py`。程序提供两个入口：不带参数时运行真实 API 闭环；传入 `--self-test` 时只验证本地执行器，不需要 API Key。

::: details 查看工具调用完整代码

```python
# tool_call_demo.py
from __future__ import annotations

import json
import os
import sys
from collections.abc import Sequence

from openai import APIConnectionError, APIStatusError, OpenAI


ORDER_RECORDS = {
    "ORD-20260928-001": {
        "status": "shipped",
        "carrier": "Northwind Express",
        "estimated_delivery": "2026-09-30",
    }
}

ORDER_TOOL = {
    "type": "function",
    "name": "get_order_status",
    "description": "按订单号查询当前物流状态、承运商和预计送达日期。",
    "parameters": {
        "type": "object",
        "properties": {
            "order_id": {
                "type": "string",
                "description": "格式为 ORD-YYYYMMDD-NNN 的订单号。",
            }
        },
        "required": ["order_id"],
        "additionalProperties": False,
    },
    "strict": True,
}


def get_order_status(order_id: str) -> dict[str, str]:
    """查询虚构订单状态。

    Args:
        order_id: 订单号，必须是示例数据中存在的非空字符串。

    Returns:
        可安全回传给模型的订单状态副本。

    Raises:
        ValueError: 订单号不存在。
    """
    record = ORDER_RECORDS.get(order_id)
    if record is None:
        raise ValueError(f"未知订单：{order_id}")
    return {"order_id": order_id, **record}


def execute_tool(name: str, arguments_json: str) -> dict[str, str]:
    """校验模型提出的函数调用，并只执行允许的本地函数。

    Args:
        name: 模型返回的函数名，只允许 get_order_status。
        arguments_json: 模型返回的 JSON 参数字符串，必须只含 order_id。

    Returns:
        工具执行结果，字段可以序列化为 JSON。

    Raises:
        ValueError: 函数名、JSON、字段集合或订单号不符合约束。
    """
    if name != "get_order_status":
        raise ValueError(f"不允许的工具：{name}")
    try:
        arguments = json.loads(arguments_json)
    except json.JSONDecodeError as error:
        raise ValueError("工具参数不是有效 JSON") from error
    if not isinstance(arguments, dict) or set(arguments) != {"order_id"}:
        raise ValueError("工具参数必须且只能包含 order_id")
    order_id = arguments["order_id"]
    if not isinstance(order_id, str) or not order_id.strip():
        raise ValueError("order_id 必须是非空字符串")
    return get_order_status(order_id.strip())


def run_self_test() -> int:
    """离线验证允许路径、非法 JSON、未知工具和未知订单。

    Returns:
        全部断言通过时返回 0；断言失败时由 Python 抛出异常。
    """
    result = execute_tool(
        "get_order_status",
        '{"order_id":"ORD-20260928-001"}',
    )
    assert result["status"] == "shipped"
    invalid_cases = [
        ("delete_order", '{"order_id":"ORD-20260928-001"}'),
        ("get_order_status", "not-json"),
        ("get_order_status", '{"order_id":"ORD-20990101-999"}'),
    ]
    for name, arguments_json in invalid_cases:
        try:
            execute_tool(name, arguments_json)
        except ValueError:
            continue
        raise AssertionError(f"失败分支未被拒绝：{name}")
    print("self_test=passed cases=4")
    return 0


def run_online() -> int:
    """执行两阶段工具调用，并输出脱敏后的调用证据。

    Returns:
        闭环完成时返回 0，配置、API 或响应契约失败时返回非零值。
    """
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("缺少环境变量：OPENAI_API_KEY", file=sys.stderr)
        return 2
    model = os.getenv("OPENAI_MODEL", "gpt-6-luna").strip() or "gpt-6-luna"
    client = OpenAI(api_key=api_key)
    user_input = "订单 ORD-20260928-001 到哪里了？请用一句中文回复。"
    instructions = "你是订单助手。需要订单事实时调用工具，不得猜测物流状态。"

    try:
        first = client.responses.create(
            model=model,
            instructions=instructions,
            input=user_input,
            tools=[ORDER_TOOL],
            tool_choice="required",
            store=False,
        )
        calls = [item for item in first.output if item.type == "function_call"]
        if len(calls) != 1:
            print(f"调用数量异常：count={len(calls)}", file=sys.stderr)
            return 5

        call = calls[0]
        tool_result = execute_tool(call.name, call.arguments)
        continued_input = [
            {"role": "user", "content": user_input},
            *first.output,
            {
                "type": "function_call_output",
                "call_id": call.call_id,
                "output": json.dumps(tool_result, ensure_ascii=False),
            },
        ]
        second = client.responses.create(
            model=model,
            instructions=instructions,
            input=continued_input,
            tools=[ORDER_TOOL],
            tool_choice="none",
            store=False,
        )
    except (APIConnectionError, APIStatusError) as error:
        print(f"API 调用失败：{error}", file=sys.stderr)
        return 3
    except ValueError as error:
        print(f"工具执行失败：{error}", file=sys.stderr)
        return 4

    final_text = second.output_text.strip()
    if second.status != "completed" or not final_text:
        print(f"最终响应无效：status={second.status}", file=sys.stderr)
        return 6
    evidence = {
        "model": second.model,
        "first_status": first.status,
        "tool_call": {
            "name": call.name,
            "call_id": f"{call.call_id.split('_', 1)[0]}_***",
            "arguments": json.loads(call.arguments),
        },
        "tool_result": tool_result,
        "second_status": second.status,
        "answer": final_text,
    }
    print(json.dumps(evidence, ensure_ascii=False, indent=2))
    return 0


def main(arguments: Sequence[str]) -> int:
    """根据命令行参数运行离线自测或在线工具调用。

    Args:
        arguments: 不含程序名的参数序列；仅支持可选的 --self-test。

    Returns:
        子流程的进程退出码。
    """
    if list(arguments) == ["--self-test"]:
        return run_self_test()
    if arguments:
        print("用法：python tool_call_demo.py [--self-test]", file=sys.stderr)
        return 64
    return run_online()


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
```

:::

### 1. 调用识别

第一次响应的 `output` 可以包含文本、推理或函数调用等不同输出项。程序按 `item.type == "function_call"` 过滤，而不是假定第一个输出项一定是工具调用。

```python
calls = [item for item in first.output if item.type == "function_call"]
if len(calls) != 1:
    print(f"调用数量异常：count={len(calls)}", file=sys.stderr)
    return 5
```

本文只有一个工具且设置 `tool_choice="required"`，因此要求恰好一个调用。生产系统是否允许零个或多个调用，应由请求策略明确决定。

### 2. 结果回传

应用保留用户输入和第一次响应的全部输出项，再追加 `function_call_output`。保留全部输出项可以避免遗漏同一响应中的必要上下文。

```python
{
    "type": "function_call_output",
    "call_id": call.call_id,
    "output": json.dumps(tool_result, ensure_ascii=False),
}
```

第二次请求设置 `tool_choice="none"`，使当前示例进入最终答复阶段。它适合固定的一步查询，不代表通用 Agent 可以永久禁止后续工具调用。

## 五、运行验证

先运行不依赖网络的执行器测试，再运行真实 API 闭环。这样可以把本地校验错误与模型服务错误分开定位。

### 1. 本地校验

```bash
python tool_call_demo.py --self-test
```

实际输出为：

```text
self_test=passed cases=4
```

四个用例分别覆盖正常订单、未知工具、非法 JSON 和未知订单。任一失败分支未被拒绝，程序都会抛出断言错误并返回非零退出码。

### 2. 在线闭环

```bash
python tool_call_demo.py
```

下面是一次真实运行的脱敏结果。`call_id` 只保留类型前缀，其他字段来自同一次两阶段调用。

::: details 查看工具调用实际结果

```json
{
  "model": "gpt-6-luna",
  "first_status": "completed",
  "tool_call": {
    "name": "get_order_status",
    "call_id": "call_***",
    "arguments": {
      "order_id": "ORD-20260928-001"
    }
  },
  "tool_result": {
    "order_id": "ORD-20260928-001",
    "status": "shipped",
    "carrier": "Northwind Express",
    "estimated_delivery": "2026-09-30"
  },
  "second_status": "completed",
  "answer": "订单已发出，由 Northwind Express 承运，预计 2026 年 9 月 30 日送达。"
}
```

:::

结果证明四个关键关系同时成立：模型选择了允许的工具；参数中的订单号与用户输入一致；应用返回了本地记录；最终答复中的物流事实来自工具结果。

## 六、失败处理

工具链中的失败不能统一改写为“模型调用失败”。应用需要保留发生阶段和可观察证据。

| 失败阶段 | 证据 | 本文处理 | 生产处理方向 |
|----------|------|----------|----------------|
| API 请求 | `APIConnectionError`、`APIStatusError` | 返回退出码 `3` | 记录请求 ID，按错误类别决定是否重试 |
| 调用数量 | `function_call` 为零个或多个 | 返回退出码 `5` | 按工具选择策略处理 |
| 参数解析 | 非法 JSON、字段越界 | 抛出 `ValueError` | 回传受控错误或终止调用 |
| 权限与业务校验 | 未授权资源、未知订单 | 拒绝执行 | 审计并返回最小错误信息 |
| 结果回传 | `call_id` 丢失或错配 | API 无法正确续接 | 保留调用集合与对应关系 |
| 最终响应 | 状态非 `completed` 或文本为空 | 返回退出码 `6` | 转入未完成响应处理 |

::: warning 不要静默修正模型参数
模型返回未知订单号或多余字段时，应用不应猜测正确值后继续执行。可恢复错误应作为明确的工具结果回传；权限错误和高风险动作应直接终止或转人工。
:::

本文的 `execute_tool()` 让所有校验失败都进入同一个受控异常边界，但没有把错误再次回传给模型。并行调用、局部失败和错误结果回传需要单独设计调用集合与恢复策略。

## 七、适用边界

本示例适用于无副作用的一步查询，用来建立工具协议的最小心智模型。以下能力需要在此闭环之外补充：

- **身份与授权**：校验当前用户是否有权访问目标订单；
- **幂等控制**：写操作必须有业务幂等键和重复执行保护；
- **并行调用**：为每个 `call_id` 独立保存状态、结果和错误；
- **超时与取消**：区分模型请求超时、本地工具超时和未知执行结果；
- **审计与脱敏**：记录工具名、调用状态和耗时，不记录凭据或敏感结果；
- **循环终止**：多步调用必须限制最大步数、工具次数和总预算。

模型负责根据语义提出调用，应用负责能力、参数、权限和副作用。只有这条责任边界保持清晰，工具调用才能从演示代码进入可控的业务链路。

## 八、参考资料

- [OpenAI Function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [OpenAI Responses API reference](https://developers.openai.com/api/reference/resources/responses/methods/create)
- [OpenAI Error codes](https://developers.openai.com/api/docs/guides/error-codes)
