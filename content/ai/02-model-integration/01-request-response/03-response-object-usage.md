---
title: "响应对象与用量"
tags:
  - OpenAI API
  - Responses API
  - Token
excerpt: "解析 Responses API 的状态、输出项、文本便利属性、错误与未完成详情，并通过真实响应和固定夹具验证结果判断与 Token 用量读取。"
date: 2026-09-28
---

# 响应对象与用量

Responses API 返回的是类型化 Response 对象，不是单一文本。它同时包含请求标识、生成状态、输出项、错误或未完成详情以及 Token 用量。`output_text` 只是 SDK 汇总文本的便利属性，**不能替代完整响应判断**。

本文发送一条虚构工单分析请求，遍历实际输出项并读取用量；随后用受控小上限检查端点语义，再用 SDK 类型化固定响应验证 `incomplete` 分支。

::: tip 三个判断必须分开
“存在文本”只说明可以读取字符；“状态完成”说明生成生命周期完成；“业务可用”还需要类型、内容和业务规则校验。三者不能互相替代。
:::

## 一、响应结构

### 1. 对象标识

`id` 是 Response 的唯一标识，可用于日志关联、后续查询或会话续接。应用应记录它，但不要把它当作业务幂等键，也不要在公开错误页面暴露完整内部诊断信息。

`object` 标识资源类型，`model` 记录实际响应模型。兼容端点可能对模型别名进行路由，因此请求模型和响应模型都值得保留。

### 2. 生成状态

官方响应状态包括：

| 状态 | 含义 | 业务处理 |
|------|------|----------|
| `queued` | 等待执行 | 继续查询或等待回调 |
| `in_progress` | 正在生成 | 不提交最终结果 |
| `completed` | 生成完成 | 继续检查输出类型和业务规则 |
| `incomplete` | 未完成 | 读取 `incomplete_details.reason` |
| `failed` | 生成失败 | 读取 `error` 并分类 |
| `cancelled` | 已取消 | 按取消语义结束或恢复 |

同步文本请求通常直接返回终态，但后台响应可能先返回 `queued` 或 `in_progress`。调用方式不同，允许出现的中间状态也不同。

### 3. 失败详情

`error` 描述响应生成失败；`incomplete_details` 描述响应为什么没有完整生成。两者解决的问题不同：

- `failed` 表示生成过程失败；
- `incomplete` 表示已有响应对象，但生成未达到完整结束；
- HTTP 异常可能在 SDK 返回 Response 之前发生。

错误分类、重试资格和退避由接入可靠性章节负责。本文只确保这些状态不会被文本便利属性掩盖。

## 二、输出项

### 1. 类型化数组

`output` 是按顺序排列的输出 Item 数组。数组长度和类型取决于模型行为，不能假定 `output[0]` 永远是助手消息。

本次在线调用实际得到：

```text
output_types=["reasoning", "message"]
```

`reasoning` 和 `message` 是两个独立 Item。工具调用时还可能出现 `function_call`；因此通用客户端必须按 `item.type` 分派，而不是硬编码数组位置。

### 2. 文本便利属性

OpenAI SDK 的 `response.output_text` 会汇总响应中的文本输出，适合只关心最终文本的简单调用。

```python
if response.status == "completed":
    print(response.output_text)
```

它不会表达以下信息：

- 响应是否包含推理或工具调用项；
- 是否出现拒绝或其他内容类型；
- 响应是否未完成；
- Token 用量和缓存明细；
- 业务字段是否有效。

只有应用契约明确规定“完成的纯文本响应”时，才可以在状态检查后直接使用它。

### 3. 类型分派

通用解析器应先识别 Item 类型，再进入对应处理器。

| Item 类型 | 处理方式 | 不应执行的操作 |
|-----------|----------|----------------|
| `message` | 遍历内容部件，读取文本或拒绝 | 假定所有内容都是文本 |
| `reasoning` | 按接口允许范围保存摘要或关联信息 | 依赖隐藏推理内容 |
| `function_call` | 校验工具名、参数和 `call_id` | 直接把参数当业务结果 |
| 其他类型 | 进入显式扩展或未知类型分支 | 静默丢弃后仍标记成功 |

新增 API 能力时，未知 Item 类型应保留诊断信息并触发兼容性评审。

## 三、用量字段

### 1. Token 总量

`usage` 记录本次响应的 Token 用量。常用字段包括：

| 字段 | 含义 |
|------|------|
| `input_tokens` | 本次计入输入的 Token |
| `input_tokens_details.cached_tokens` | 输入中命中缓存的 Token |
| `output_tokens` | 输出侧使用的 Token |
| `output_tokens_details.reasoning_tokens` | 输出中用于推理的 Token |
| `total_tokens` | 输入与输出总量 |

实际费用仍取决于模型价格、缓存计价和服务层级。不能只用 `total_tokens` 乘一个固定单价覆盖所有模型。

### 2. 输出上限

`max_output_tokens` 同时约束可见输出和推理 Token。对于推理模型，过小的上限可能在生成可见文本之前就被消耗。

::: warning 用响应验证约束是否生效
当前兼容端点实测接受 `max_output_tokens=16`，却返回 `429` 个输出 Token 和 `completed`。调用没有报错，但上限语义没有生效。生产系统必须用 `usage` 和状态做契约监测。
:::

### 3. 用量缺失

某些中间事件、失败路径或兼容实现可能没有完整 `usage`。解析器应允许字段为空，并把“缺少计量证据”与“实际用量为零”区分开。

## 四、判断顺序

### 1. 状态优先

响应处理应按固定顺序执行：

1. 记录脱敏请求关联信息和 `response.id`；
2. 检查 `status`；
3. 对 `failed` 读取 `error`；
4. 对 `incomplete` 读取 `incomplete_details`；
5. 只有 `completed` 才遍历 `output`；
6. 按业务契约校验文本、结构或工具结果；
7. 记录 `usage`，再决定提交、降级或重试。

先读 `output_text` 再补查状态，容易让部分文本提前进入业务记录。

### 2. 业务可用性

`completed` 只证明模型生成完成。以下情况仍不能直接提交：

- 响应类型与调用契约不一致；
- 结构化结果缺少业务必填字段；
- 工具调用尚未执行或结果未回传；
- 文本包含禁止承诺、敏感信息或无证据结论；
- 结果没有通过当前任务的质量规则。

接口状态判断属于接入层，内容质量判断属于上层应用。

## 五、验证环境

### 1. 运行条件

本例使用 Python 3.12.14、OpenAI Python SDK 3.19.2 和 `gpt-6-luna`。创建空目录并安装依赖：

::: code-group

```powershell [PowerShell]
mkdir response-object-demo
cd response-object-demo
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install openai==3.19.2
```

```bash [Bash]
mkdir response-object-demo
cd response-object-demo
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install openai==3.19.2
```

:::

环境变量沿用前两篇。程序输出 Response ID 时应在共享日志或文档中脱敏。

## 六、完整实现

程序执行两次在线请求：一次使用正常上限，一次使用极小上限。由于当前端点没有产生未完成状态，程序再从真实对象结构构造一个类型化固定夹具，验证应用的 `incomplete` 分支。

::: details 查看 response_object_usage_demo.py 完整代码

```python
# response_object_usage_demo.py
import json
import os
from typing import Any

from openai import OpenAI
from openai.types.responses import Response


def summarize_response(response: Response) -> dict[str, Any]:
    """提取状态、输出类型和 Token 用量。

    Args:
        response: OpenAI Python SDK 返回的 Response 对象。

    Returns:
        可用于日志和测试断言的响应摘要。
    """
    usage = response.usage
    input_details = getattr(usage, "input_tokens_details", None) if usage else None
    output_details = getattr(usage, "output_tokens_details", None) if usage else None
    incomplete = response.incomplete_details
    error = response.error
    return {
        "response_id": response.id,
        "status": response.status,
        "incomplete_reason": getattr(incomplete, "reason", None),
        "error_code": getattr(error, "code", None),
        "output_types": [item.type for item in response.output],
        "output_text": response.output_text,
        "usage": {
            "input_tokens": getattr(usage, "input_tokens", None),
            "cached_tokens": getattr(input_details, "cached_tokens", None),
            "output_tokens": getattr(usage, "output_tokens", None),
            "reasoning_tokens": getattr(output_details, "reasoning_tokens", None),
            "total_tokens": getattr(usage, "total_tokens", None),
        },
    }


def create_response(client: OpenAI, model: str, limit: int) -> Response:
    """发送受控工单请求。

    Args:
        client: 已从环境变量读取认证信息的客户端。
        model: 当前环境可用的模型标识。
        limit: 包含可见输出和推理 Token 的生成上限，必须大于 0。

    Returns:
        SDK 返回的类型化 Response 对象。
    """
    if limit <= 0:
        raise ValueError("limit 必须大于 0")
    return client.responses.create(
        model=model,
        instructions="列出故障现象、已知事实和下一步检查，禁止编造根因。",
        input="工单 CASE-1042：导出任务一直停在处理中。请给出五条分析。",
        max_output_tokens=limit,
        store=False,
    )


def build_incomplete_fixture(source: Response) -> Response:
    """构造只用于状态分支测试的未完成响应。

    Args:
        source: 在线调用得到的真实 Response，用于保留当前 SDK 字段结构。

    Returns:
        状态为 incomplete 的类型化固定响应。
    """
    data = source.model_dump(mode="json")
    data["status"] = "incomplete"
    data["incomplete_details"] = {"reason": "max_output_tokens"}
    data["output"] = []
    return Response.model_validate(data)


def main() -> None:
    """输出正常、受限和固定未完成响应的摘要。"""
    client = OpenAI()
    model = os.getenv("OPENAI_MODEL", "gpt-6-luna")
    normal = create_response(client, model, 512)
    limited = create_response(client, model, 16)
    result = {
        "normal_live": summarize_response(normal),
        "limited_live": summarize_response(limited),
        "fixed_incomplete": summarize_response(build_incomplete_fixture(normal)),
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
```

:::

固定夹具复用真实 Response 的字段结构，只修改状态、未完成原因和输出数组。它证明应用分支可以确定性测试，**不代表当前端点真实返回过该结果**。

### 1. 执行入口

```powershell
python .\response_object_usage_demo.py
```

## 七、验证结果

### 1. 正常响应

正常上限请求的脱敏摘要为：

::: details 查看正常响应的脱敏摘要

```json
{
  "response_id": "<已脱敏>",
  "status": "completed",
  "incomplete_reason": null,
  "error_code": null,
  "output_types": ["reasoning", "message"],
  "usage": {
    "input_tokens": 60,
    "cached_tokens": 0,
    "output_tokens": 404,
    "reasoning_tokens": 65,
    "total_tokens": 464
  }
}
```

:::

`60 + 404 = 464`，总量与分项一致。`output_tokens` 已包含 `reasoning_tokens` 明细，不能再次相加。

### 2. 受限响应

使用 `max_output_tokens=16` 的在线请求仍返回：

```json
{
  "status": "completed",
  "incomplete_reason": null,
  "output_types": ["reasoning", "message"],
  "output_tokens": 429,
  "reasoning_tokens": 65,
  "total_tokens": 489
}
```

结果没有满足官方字段语义，因此当前端点的能力配置应标记“输出上限未验证通过”。应用不能因为 HTTP 成功就宣称约束生效。

### 3. 未完成夹具

确定性夹具进入以下分支：

```json
{
  "status": "incomplete",
  "incomplete_reason": "max_output_tokens",
  "output_types": [],
  "output_text": ""
}
```

这个分支不得继续解析业务答案。调用方应根据任务性质选择增大上限后重新请求、缩短输入、降级输出要求或直接返回可诊断错误。

## 八、故障定位

### 1. 空文本

`output_text` 为空可能来自多种情况，不能统一解释为模型没有回答。

| 状态或输出 | 可能原因 | 检查入口 |
|------------|----------|----------|
| `completed` + 工具调用项 | 模型请求应用执行工具 | 遍历 `output` |
| `incomplete` | 输出上限或其他终止条件 | `incomplete_details` |
| `failed` | 生成失败 | `error` |
| `completed` + 消息项 | 内容可能是拒绝或非文本部件 | 遍历消息内容 |
| 无 Response 对象 | HTTP、认证或连接异常 | SDK 异常 |

### 2. 用量异常

发现 Token 用量超出请求约束时，按以下顺序处理：

1. 保存脱敏请求字段、响应状态和用量；
2. 核对当前端点是否为官方 API 或兼容实现；
3. 使用最小输入重复契约测试；
4. 比较 SDK 序列化的实际请求；
5. 在能力配置中禁用不可信约束；
6. 通过应用侧超时、预算或路由规则提供保护。

不要静默把服务端报告的用量改写为预期值。

## 九、适用范围

本文完成了响应接口层的判断闭环：

- `id` 用于请求关联；
- `status` 决定生命周期分支；
- `output` 按 Item 类型处理；
- `output_text` 只作为文本便利属性；
- `error` 和 `incomplete_details` 分别处理；
- `usage` 提供用量证据并暴露兼容性偏差。

流式事件需要从终止事件取得最终 Response；结构化输出、工具调用和业务质量分别在后续章节建立自己的输出契约。

参考资料：

- [Create a model response](https://developers.openai.com/api/reference/resources/responses/methods/create)
- [Migrate to the Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses)
