---
title: "JSON Schema 输出"
tags:
  - OpenAI API
  - JSON Schema
  - Python
excerpt: "通过 Responses API 的 text.format 提交严格 JSON Schema，约束工单分类结果的字段、类型和枚举，并区分结构保证与业务正确性。"
date: 2026-09-28
---

# JSON Schema 输出

普通文本适合直接展示，业务程序则需要稳定字段。Responses API 的 Structured Outputs 可以通过 `text.format` 提交 JSON Schema，使成功生成的文本遵循声明的结构。它解决“结果能否按固定形状读取”，**不保证分类结论符合业务规则**。

本文把一条虚构客户反馈转换为工单分类对象，固定输出 `category`、`priority`、`summary` 和 `requires_human_review` 四个字段。

## 一、结构契约

### 1. 输出对象

工单分类结果采用以下业务契约：

| 字段 | JSON 类型 | 约束 | 用途 |
|------|-----------|------|------|
| `category` | string | `billing`、`delivery`、`technical`、`other` | 路由处理队列 |
| `priority` | string | `low`、`medium`、`high` | 决定响应时限 |
| `summary` | string | 非空摘要 | 列表展示与人工复核 |
| `requires_human_review` | boolean | `true` 或 `false` | 控制自动提交边界 |

Schema 应只包含下游真正需要的字段。把解释过程、冗余原文或不稳定自由字段一起放入结构，会增加 Token 消耗和业务兼容成本。

### 2. 严格模式

严格 Schema 通常需要：

- 根节点明确为 `object`；
- 所有业务字段列入 `properties`；
- 所有字段列入 `required`；
- 对象设置 `additionalProperties: false`；
- 有限取值使用 `enum`。

::: tip 让无效状态无法生成
能用枚举表达的业务状态不要退化为任意字符串；确定不接受的扩展字段应通过 `additionalProperties: false` 关闭。Schema 越接近真实业务契约，下游防御性分支越少。
:::

### 3. Schema 定义

::: details 查看工单分类 JSON Schema

```python
SUPPORT_CASE_SCHEMA = {
    "type": "object",
    "properties": {
        "category": {
            "type": "string",
            "enum": ["billing", "delivery", "technical", "other"],
        },
        "priority": {
            "type": "string",
            "enum": ["low", "medium", "high"],
        },
        "summary": {"type": "string", "minLength": 1},
        "requires_human_review": {"type": "boolean"},
    },
    "required": [
        "category",
        "priority",
        "summary",
        "requires_human_review",
    ],
    "additionalProperties": False,
}
```

:::

Structured Outputs 支持 JSON Schema 的一个子集。新增复杂关键字前必须核对当前官方支持列表，而不是假定完整 JSON Schema 规范都可用。

## 二、请求配置

### 1. `text.format`

Responses API 在 `text.format` 中声明结构。`name` 是该结构的稳定标识，`schema` 保存 JSON Schema，`strict` 开启严格约束。

```python
text={
    "format": {
        "type": "json_schema",
        "name": "support_case_classification",
        "strict": True,
        "schema": SUPPORT_CASE_SCHEMA,
    }
}
```

Chat Completions 示例常使用 `response_format`。不能把两种端点的字段直接互换；本文只以 Responses API 为准。

### 2. 指令与 Schema

Schema 负责形状，指令负责语义。请求仍需说明分类依据、输入数据和不确定情况。例如，高风险退款诉求应进入人工复核，这不是 JSON 类型系统能够自动推导的规则。

```text
根据客户反馈生成工单分类。涉及退款、账户归属或事实不足时，
requires_human_review 必须为 true。只依据给定反馈，不补造订单事实。
```

不要在指令中重复整份 Schema；重复维护容易造成字段名或枚举不一致。

## 三、环境与依赖

示例从空目录开始，使用 Python 3.12、OpenAI Python SDK 3.19.2 和支持 Structured Outputs 的模型。

::: code-group

```powershell [PowerShell]
mkdir structured-output-demo
cd structured-output-demo
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install openai==3.19.2 jsonschema==4.25.1
```

```bash [Bash]
mkdir structured-output-demo && cd structured-output-demo
python3 -m venv .venv
source .venv/bin/activate
python -m pip install openai==3.19.2 jsonschema==4.25.1
```

:::

配置非生产凭据和实际兼容模型：

```powershell
$env:OPENAI_API_KEY = "<你的测试项目密钥>"
$env:OPENAI_MODEL = "gpt-6-luna"
```

模型和兼容网关可能支持不同能力。若请求返回不支持 `text.format`，应更换兼容模型或端点，不能退回到“让模型自行输出 JSON”后仍声称具备 Schema 保证。

## 四、完整实现

::: details 查看工单分类完整程序

```python
# classify_case.py
import json
import os

from jsonschema import validate
from openai import OpenAI


SUPPORT_CASE_SCHEMA = {
    "type": "object",
    "properties": {
        "category": {
            "type": "string",
            "enum": ["billing", "delivery", "technical", "other"],
        },
        "priority": {
            "type": "string",
            "enum": ["low", "medium", "high"],
        },
        "summary": {"type": "string", "minLength": 1},
        "requires_human_review": {"type": "boolean"},
    },
    "required": [
        "category",
        "priority",
        "summary",
        "requires_human_review",
    ],
    "additionalProperties": False,
}


def classify_case(client: OpenAI, model: str, feedback: str) -> dict:
    """将客户反馈转换为结构固定的工单分类。

    Args:
        client: 已配置测试凭据的 OpenAI 客户端。
        model: 支持 Responses Structured Outputs 的模型标识。
        feedback: 非空且已完成敏感信息处理的客户反馈。

    Returns:
        通过服务端 Schema 约束和本地 JSON Schema 复核的字典。

    Raises:
        ValueError: 输入为空，或响应没有可用文本。
        jsonschema.ValidationError: 返回对象未通过本地 Schema 复核。
    """
    if not feedback.strip():
        raise ValueError("feedback must not be empty")

    response = client.responses.create(
        model=model,
        instructions=(
            "根据客户反馈生成工单分类。涉及退款、账户归属或事实不足时，"
            "requires_human_review 必须为 true。只依据给定反馈。"
        ),
        input=feedback,
        text={
            "format": {
                "type": "json_schema",
                "name": "support_case_classification",
                "strict": True,
                "schema": SUPPORT_CASE_SCHEMA,
            }
        },
    )
    if response.status != "completed" or not response.output_text:
        raise ValueError(f"response unavailable: status={response.status}")

    result = json.loads(response.output_text)
    validate(instance=result, schema=SUPPORT_CASE_SCHEMA)
    return result


def main() -> None:
    """调用结构化分类并输出稳定 JSON。"""
    result = classify_case(
        OpenAI(),
        os.environ.get("OPENAI_MODEL", "gpt-6-luna"),
        "订单 ORD-2048 重复扣款，我需要确认退款进度。",
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
```

:::

程序在服务端结构约束之外再次进行本地校验。重复校验不是为了怀疑 API，而是让固定响应测试、兼容端点和后续数据转换都经过同一业务入口。

运行程序：

```powershell
python classify_case.py
```

符合契约的结果形状如下；具体摘要措辞可以变化：

```json
{
  "category": "billing",
  "priority": "high",
  "summary": "客户反馈订单重复扣款并询问退款进度。",
  "requires_human_review": true
}
```

## 五、结果验收

### 1. 结构检查

成功输出必须同时满足：

1. 文本可以解析为单个 JSON 对象；
2. 四个字段全部存在；
3. 字段类型与 Schema 一致；
4. 分类与优先级属于枚举；
5. 没有额外字段。

只检查 `json.loads()` 成功远远不够。合法 JSON 可以缺字段、使用错误枚举或包含下游无法处理的额外属性。

### 2. 业务检查

结构通过后，还要验证业务不变量。例如：

| 业务规则 | 结构层能否保证 | 应用处理 |
|----------|----------------|----------|
| 优先级必须属于固定枚举 | 能 | Schema `enum` |
| 摘要不能为空 | 部分能 | `minLength` 加本地规范化 |
| 重复扣款必须人工复核 | 不能 | 领域规则或人工审核 |
| 摘要不得泄露敏感字段 | 不能 | 数据治理与输出检查 |
| 分类是否符合真实事实 | 不能 | 证据校验与评测 |

::: warning 结构正确不等于业务正确
Schema 只能约束“长什么样”，不能证明“说得对”。业务提交必须在结构校验之后继续执行领域规则、权限和事实核对。
:::

## 六、失败定位

| 现象 | 常见原因 | 处理方式 |
|------|----------|----------|
| 请求参数不受支持 | 模型或兼容端点不支持 Structured Outputs | 核对模型能力与端点字段 |
| Schema 被拒绝 | 使用了不支持的关键字或严格规则不完整 | 对照支持子集简化 Schema |
| Response 为 `incomplete` | 输出上限或其他生成条件中断 | 读取未完成原因，不直接解析 |
| 输出包含拒绝对象 | 安全拒绝不是普通结构化文本 | 先处理拒绝分支 |
| 本地业务校验失败 | 结构合法但语义不满足业务规则 | 转人工或进入修正流程 |

拒绝、未完成和类型化解析由[解析、拒绝与未完成响应](./02-parsing-refusals-incomplete.md)负责。当前文章的成功路径只在 Response 完成且存在结构化文本时成立。

## 七、验证结论

`text.format` 把工单结果的字段、类型、枚举和额外属性变成显式接口契约。完整示例从空目录创建环境，发起严格 Schema 请求，并用同一 Schema 在本地复核结果。

该闭环证明应用能够稳定读取结果形状；它不证明模型分类准确率、安全性或业务策略正确，这些仍需要领域校验与评测。

## 八、参考资料

- [Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Responses API reference](https://developers.openai.com/api/reference/resources/responses)
