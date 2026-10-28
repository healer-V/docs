---
title: "函数定义与选择"
tags:
  - OpenAI API
  - Function Calling
  - JSON Schema
excerpt: "定义名称明确、参数严格的函数工具，通过 tool_choice 控制模型是否调用，并在暴露工具前收紧能力与副作用边界。"
date: 2026-09-28
---

# 函数定义与选择

函数工具是模型可以提出调用的能力描述。工具定义决定模型看见哪些名称、用途和参数，`tool_choice` 决定本轮允许或要求怎样选择；两者都不执行真实函数。**应用只有在完成名称白名单、参数校验和权限检查后，才能执行模型提出的调用。**

本文定义一个只读订单状态查询工具，并比较自动、禁止、必须和指定函数四种选择策略。函数执行与结果回传由[调用执行与结果回传](./02-call-execution-return.md)负责。

## 一、工具契约

### 1. 定义字段

Responses API 的函数工具至少包含以下信息：

| 字段 | 作用 | 设计要求 |
|------|------|----------|
| `type` | 标识函数工具 | 使用 `function` |
| `name` | 稳定调用名称 | 使用业务动词，升级时考虑兼容 |
| `description` | 说明何时调用及返回什么 | 写清适用条件与边界 |
| `parameters` | 参数 JSON Schema | 只暴露执行必需字段 |
| `strict` | 开启严格参数约束 | 配合完整 `required` 与关闭额外属性 |

名称是应用分派的协议键，不是展示文案。不要随意把 `get_order_status` 改成另一名称，否则旧测试、审计记录和缓存夹具会失去对应关系。

### 2. 严格参数

::: details 查看只读订单工具定义

```python
ORDER_STATUS_TOOL = {
    "type": "function",
    "name": "get_order_status",
    "description": (
        "根据已经出现在客户消息中的虚构订单号查询配送状态。"
        "只执行读取，不修改订单，也不承诺退款或补偿。"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "order_id": {
                "type": "string",
                "pattern": "^ORD-[0-9]{4}$",
                "description": "格式为 ORD- 加四位数字的订单号。",
            }
        },
        "required": ["order_id"],
        "additionalProperties": False,
    },
    "strict": True,
}
```

:::

严格 Schema 能减少缺字段和多字段，但应用仍要验证订单号是否属于当前用户、调用者是否有权限，以及工具是否允许在当前业务阶段执行。

### 3. 描述边界

描述应回答三个问题：

1. 什么时候应使用工具；
2. 每个参数从哪里获得；
3. 工具返回什么，不会做什么。

不要把“查询订单并在异常时自动退款”合并为一个宽泛工具。读取与写入具有不同权限、审计和重试语义，应拆成不同能力并为写入增加人工确认。

::: warning 工具描述不是授权
模型根据描述选择工具，但描述不能替代身份认证、对象归属校验和最小权限。即使参数完全符合 Schema，应用也可以拒绝执行。
:::

## 二、选择策略

### 1. 自动选择

`tool_choice="auto"` 允许模型在文本回答与可用工具之间选择，适合工具确实可选的场景。

```python
response = client.responses.create(
    model=model,
    input="订单 ORD-2048 到哪里了？",
    tools=[ORDER_STATUS_TOOL],
    tool_choice="auto",
)
```

自动选择不是确定性路由。业务必须同时处理零个、一个和多个函数调用，也不能因为消息包含订单号就断言模型必定调用工具。

### 2. 禁止与必须

| 策略 | 行为边界 | 适用场景 |
|------|----------|----------|
| `none` | 本轮不得调用工具 | 只允许解释已有证据 |
| `auto` | 模型自行选择文本或工具 | 工具可选的正常交互 |
| `required` | 本轮至少选择一个工具 | 业务入口必须先取得外部数据 |
| 指定函数 | 只要求特定函数 | 已由确定性逻辑选定能力 |

指定函数的 Responses API 形状如下：

```python
tool_choice={"type": "function", "name": "get_order_status"}
```

强制调用只应在应用已经确定需要该能力时使用。对缺少订单号的消息强制查询，会诱导模型猜测参数或产生无效调用。

### 3. 选择与路由

确定性条件应优先由代码处理。例如，订单详情页已经持有可信 `order_id` 时，可以由应用直接查询，再把结果作为上下文交给模型，不必让模型重新提取并选择相同工具。

函数调用适合需要模型从自然语言判断意图或组合参数的场景，不应替代普通条件分支。

## 三、暴露范围

### 1. 最小工具集

工具定义会占用输入上下文，工具越多，名称相似和误选概率越高。每轮只提供当前任务需要的能力。

| 用户意图 | 暴露工具 | 不暴露工具 |
|----------|----------|------------|
| 查询物流 | `get_order_status` | 退款、改址、管理工具 |
| 解释退款政策 | 无，提供政策上下文 | 任意写工具 |
| 提交退款申请 | 先校验资格，再暴露受控申请工具 | 直接打款工具 |

工具数量的具体阈值需要通过评测确定，不能把软建议写成统一硬限制。

### 2. 敏感能力

以下内容不应直接暴露给模型：

- 可以执行任意 SQL 或 Shell 的通用入口；
- 接收原始凭据、访问令牌或管理员身份的参数；
- 绕过人工确认的退款、删除、发布等高风险动作；
- 允许模型自行指定任意 URL、文件路径或命令的宽泛工具；
- 仅靠描述约束、缺少应用侧授权的内部管理 API。

高风险动作应拆成“提议”和“确认执行”两个阶段，并由应用保存待确认状态。

## 四、完整请求

::: details 查看工具选择检查程序

```python
# choose_tool.py
import os

from openai import OpenAI


ORDER_STATUS_TOOL = {
    "type": "function",
    "name": "get_order_status",
    "description": "查询消息中已有虚构订单号的配送状态；只读，不修改订单。",
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


def request_choice(client: OpenAI, model: str, message: str, choice):
    """请求模型在给定策略下选择函数工具。

    Args:
        client: 已配置测试凭据的 OpenAI 客户端。
        model: 支持函数工具的模型标识。
        message: 不包含真实客户数据的用户消息。
        choice: Responses API 支持的工具选择策略。

    Returns:
        完整 Response，用于检查所有输出项。
    """
    return client.responses.create(
        model=model,
        input=message,
        tools=[ORDER_STATUS_TOOL],
        tool_choice=choice,
    )


def function_names(response) -> list[str]:
    """提取响应中的函数调用名称，保留零个或多个结果。"""
    return [
        item.name
        for item in response.output
        if item.type == "function_call"
    ]


def main() -> None:
    """比较自动选择与禁止工具两种请求。"""
    client = OpenAI()
    model = os.environ.get("OPENAI_MODEL", "gpt-6-luna")
    auto = request_choice(client, model, "订单 ORD-2048 到哪里了？", "auto")
    none = request_choice(client, model, "解释什么是配送状态。", "none")
    print(f"auto_calls={function_names(auto)}")
    print(f"none_calls={function_names(none)} text={bool(none.output_text)}")


if __name__ == "__main__":
    main()
```

:::

运行程序：

```powershell
python -m pip install openai==3.19.2
$env:OPENAI_MODEL = "gpt-6-luna"
python choose_tool.py
```

验收时不比较自然语言措辞，而是检查：禁止策略没有 `function_call`；自动策略若产生调用，其名称必须为白名单工具，参数由后续执行层再次校验。

## 五、失败诊断

| 现象 | 原因 | 修正 |
|------|------|------|
| 模型经常不调用 | 描述不清或任务无需外部数据 | 明确触发条件，核对是否真需工具 |
| 模型调用错误工具 | 同时暴露过多相似能力 | 缩小工具集并区分名称与描述 |
| 参数包含额外字段 | Schema 过宽或未启用严格约束 | 关闭额外属性并保留应用校验 |
| 缺少订单号仍被强制查询 | `required` 或指定函数使用错误 | 改为 `auto` 或先由代码补齐条件 |
| 高风险动作未经确认 | 把选择误当授权 | 增加权限与人工确认状态 |

## 六、验证结论

函数工具定义承担的是模型可见契约，`tool_choice` 承担本轮选择边界。安全执行仍由应用控制。一个可用定义应具有稳定名称、清晰描述、严格最小参数和明确的只读或副作用语义。

本文只验证模型是否提出允许的调用；参数反序列化、真实函数执行和 `call_id` 回传在后续单调用闭环中完成。

## 七、参考资料

- [Function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
