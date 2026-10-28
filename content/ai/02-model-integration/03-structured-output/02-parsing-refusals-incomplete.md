---
title: "解析、拒绝与未完成响应"
tags:
  - OpenAI API
  - Pydantic
  - Python
excerpt: "使用 Responses SDK 将结构化输出解析为类型对象，并按响应状态、拒绝、未完成、解析失败和业务规则的固定顺序处理结果。"
date: 2026-09-28
---

# 解析、拒绝与未完成响应

结构化请求不保证每次都产生业务对象。应用可能收到完成结果、安全拒绝、未完成响应、解析错误或结构合法但违反业务规则的数据。正确处理方式是建立互斥分支，**先判断响应状态和拒绝，再读取解析对象**。

本文继续使用工单分类场景，通过 Pydantic 类型模型读取成功结果，并用固定响应夹具验证四类分支。

## 一、结果分支

### 1. 判定顺序

结果处理按以下顺序进行：

1. 检查 Response 是否为 `completed`；
2. 非完成状态读取 `incomplete_details` 或错误信息；
3. 遍历输出内容，识别拒绝内容；
4. 读取 SDK 的类型化解析结果；
5. 执行业务不变量校验；
6. 只有全部通过才提交业务对象。

顺序很重要。直接执行 `json.loads(response.output_text)` 会把“没有文本”“安全拒绝”和“文本损坏”压缩为相似的解析异常，丢失真正原因。

### 2. 分支语义

| 分支 | 接口证据 | 应用结果 |
|------|----------|----------|
| 成功 | `completed`、无拒绝、有解析对象 | 继续业务校验 |
| 拒绝 | 输出内容包含拒绝 | 记录安全分支，不重试改写规避 |
| 未完成 | `status == incomplete` | 根据原因调整限制或返回待处理 |
| 解析失败 | 已完成但没有可用类型对象 | 记录契约异常并隔离结果 |
| 业务冲突 | 类型对象合法但违反领域规则 | 转人工或返回业务错误 |

::: tip 保留原始分支原因
领域层可以统一返回失败结果，但日志和指标必须保留 `refusal`、`incomplete`、`parse_error` 与 `business_conflict` 的区别，否则无法判断问题来自安全策略、输出上限、接口兼容还是业务规则。
:::

## 二、类型化解析

### 1. Pydantic 模型

Python SDK 3.19.2 提供 `client.responses.parse(text_format=...)`。SDK 根据 Pydantic 模型生成结构约束，并把成功结果放入类型化解析字段。

::: details 查看工单分类类型模型

```python
from typing import Literal
from pydantic import BaseModel


class CaseClassification(BaseModel):
    """定义客服工单分类的结构化结果。"""

    category: Literal["billing", "delivery", "technical", "other"]
    priority: Literal["low", "medium", "high"]
    summary: str
    requires_human_review: bool
```

:::

类型模型负责数据结构，不应包含网络调用、权限判断或数据库写入。业务规则可以通过独立函数执行，以便离线测试。

### 2. 解析入口

```python
response = client.responses.parse(
    model=model,
    input=feedback,
    text_format=CaseClassification,
)
classification = response.output_parsed
```

`output_parsed` 是 SDK 的便捷聚合结果。需要诊断拒绝、多个输出项或内容类型时，仍要检查完整 `response.output`，不能只依赖便捷属性。

## 三、业务校验

Schema 可以保证 `priority` 是合法枚举，但不能表达所有跨字段业务规则。本文规定：账务类高优先级工单必须人工复核。

```python
def validate_business_rules(result: CaseClassification) -> None:
    """验证工单分类的跨字段业务不变量。"""
    if result.category == "billing" and result.priority == "high":
        if not result.requires_human_review:
            raise ValueError("high-priority billing cases require human review")
```

业务规则应具有稳定输入和确定性结果。不要让模型在同一次生成中既定义规则又判断自己是否满足规则。

## 四、分支处理器

下面的完整程序把 SDK 对象先转换为最小领域快照。固定快照使拒绝与未完成分支可以离线重复验证，不需要故意发送危险内容或依赖服务端随机截断。

::: details 查看结果分支完整实现

```python
# structured_result.py
from dataclasses import dataclass
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ValidationError


class CaseClassification(BaseModel):
    """定义客服工单分类的结构化结果。"""

    category: Literal["billing", "delivery", "technical", "other"]
    priority: Literal["low", "medium", "high"]
    summary: str
    requires_human_review: bool


class ResultKind(StrEnum):
    """列出业务层必须区分的结果类型。"""

    SUCCESS = "success"
    REFUSAL = "refusal"
    INCOMPLETE = "incomplete"
    PARSE_ERROR = "parse_error"
    BUSINESS_CONFLICT = "business_conflict"


@dataclass(frozen=True)
class ResponseSnapshot:
    """保存处理分支所需的最小响应证据。"""

    status: str
    parsed: dict | None = None
    refusal: str | None = None
    incomplete_reason: str | None = None


@dataclass(frozen=True)
class ClassifiedResult:
    """向业务层返回互斥结果和诊断原因。"""

    kind: ResultKind
    value: CaseClassification | None = None
    reason: str | None = None


def validate_business_rules(value: CaseClassification) -> None:
    """验证结构约束之外的跨字段业务规则。"""
    if value.category == "billing" and value.priority == "high":
        if not value.requires_human_review:
            raise ValueError("high-priority billing cases require human review")


def classify_snapshot(snapshot: ResponseSnapshot) -> ClassifiedResult:
    """按固定顺序把响应快照转换为领域结果。

    Args:
        snapshot: 包含状态、拒绝、未完成原因和可选解析数据的快照。

    Returns:
        唯一结果分支；失败原因保留用于日志和指标。
    """
    if snapshot.status == "incomplete":
        return ClassifiedResult(
            ResultKind.INCOMPLETE,
            reason=snapshot.incomplete_reason or "unknown",
        )
    if snapshot.status != "completed":
        return ClassifiedResult(ResultKind.PARSE_ERROR, reason=snapshot.status)
    if snapshot.refusal:
        return ClassifiedResult(ResultKind.REFUSAL, reason=snapshot.refusal)
    if snapshot.parsed is None:
        return ClassifiedResult(ResultKind.PARSE_ERROR, reason="missing parsed value")

    try:
        value = CaseClassification.model_validate(snapshot.parsed)
        validate_business_rules(value)
    except ValidationError as exc:
        return ClassifiedResult(ResultKind.PARSE_ERROR, reason=str(exc))
    except ValueError as exc:
        return ClassifiedResult(ResultKind.BUSINESS_CONFLICT, reason=str(exc))
    return ClassifiedResult(ResultKind.SUCCESS, value=value)


def main() -> None:
    """验证成功、拒绝、未完成和业务冲突四条路径。"""
    fixtures = [
        ResponseSnapshot(
            "completed",
            parsed={
                "category": "technical",
                "priority": "medium",
                "summary": "导出任务停在处理中。",
                "requires_human_review": False,
            },
        ),
        ResponseSnapshot("completed", refusal="request refused"),
        ResponseSnapshot("incomplete", incomplete_reason="max_output_tokens"),
        ResponseSnapshot(
            "completed",
            parsed={
                "category": "billing",
                "priority": "high",
                "summary": "订单出现重复扣款。",
                "requires_human_review": False,
            },
        ),
    ]
    results = [classify_snapshot(item) for item in fixtures]
    assert [item.kind for item in results] == [
        ResultKind.SUCCESS,
        ResultKind.REFUSAL,
        ResultKind.INCOMPLETE,
        ResultKind.BUSINESS_CONFLICT,
    ]
    print("kinds=" + ",".join(item.kind for item in results))


if __name__ == "__main__":
    main()
```

:::

安装依赖并运行：

```powershell
python -m pip install pydantic==2.12.5
python structured_result.py
```

预期输出：

```text
kinds=success,refusal,incomplete,business_conflict
```

该测试证明四条路径互斥，并且拒绝和未完成不会落入 JSON 解析异常。

## 五、SDK 对象映射

### 1. 拒绝内容

拒绝是输出内容的一种明确类型。应用应遍历消息内容并识别 `refusal`，保留安全分支的文本或代码，同时按隐私规则控制日志范围。

```python
def find_refusal(response) -> str | None:
    """从完整响应中提取首个拒绝内容。"""
    for item in response.output:
        for part in getattr(item, "content", []):
            if getattr(part, "type", None) == "refusal":
                return part.refusal
    return None
```

不要通过提示词要求模型隐藏或改写拒绝标记，也不要把拒绝当作临时网络错误自动重试。

### 2. 未完成原因

当状态为 `incomplete` 时，读取 `response.incomplete_details`。输出上限导致的未完成可以调整任务范围或限制；内容策略、模型能力或兼容端点差异则需要各自处理。

```python
reason = getattr(response.incomplete_details, "reason", "unknown")
```

任何情况下都不应把已经截断的 JSON 尾部自行补上括号后提交。语法被修复不代表缺失字段值真实存在。

### 3. 成功解析

在线成功路径可以使用下面的调用。完整异常和分支处理应复用前面的领域处理器，而不是直接打印对象。

::: details 查看 SDK 类型化调用

```python
import os
from typing import Literal

from openai import OpenAI
from pydantic import BaseModel


class CaseClassification(BaseModel):
    """定义客服工单分类的结构化结果。"""

    category: Literal["billing", "delivery", "technical", "other"]
    priority: Literal["low", "medium", "high"]
    summary: str
    requires_human_review: bool


client = OpenAI()
response = client.responses.parse(
    model=os.environ.get("OPENAI_MODEL", "gpt-6-luna"),
    input="订单 ORD-2048 重复扣款，请生成工单分类。",
    text_format=CaseClassification,
)
if response.status != "completed":
    raise RuntimeError(f"unexpected status: {response.status}")
if response.output_parsed is None:
    raise RuntimeError("response has no parsed value")
print(response.output_parsed.model_dump_json(indent=2))
```

:::

## 六、错误处理

| 错误写法 | 丢失的信息 | 正确处理 |
|----------|------------|----------|
| 直接 `json.loads(output_text)` | 拒绝类型、输出项和状态 | 先检查状态与完整输出 |
| 所有异常统一重试 | 永久 Schema 错误与安全拒绝 | 按原因分类 |
| 解析成功立即写数据库 | 跨字段业务冲突 | 再执行领域规则 |
| 截断 JSON 手动补齐 | 缺失内容的真实性 | 调整请求并重新生成 |
| 只记录完整原文 | 可能泄露客户数据 | 记录状态、类型和脱敏标识 |

::: warning 解析失败不是单一故障
解析失败可能来自兼容端点不支持、SDK 升级、输出项变化或本地类型模型变更。日志至少保留模型、Response ID、状态、输出项类型和异常类别，但不记录密钥与完整敏感输入。
:::

## 七、验证结论

稳定的结构化消费不是一次 `json.loads()`，而是一条有顺序的判定链：状态、拒绝、解析、结构、业务规则。离线夹具验证了四种关键结果不会互相混淆；在线调用用于证明当前 SDK 能生成类型化成功对象。

全文没有模拟真实安全拒绝或强制制造服务端截断。此类分支使用固定快照验证控制逻辑，并明确区分于在线服务端证据。

## 八、参考资料

- [Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Error codes](https://developers.openai.com/api/docs/guides/error-codes)
