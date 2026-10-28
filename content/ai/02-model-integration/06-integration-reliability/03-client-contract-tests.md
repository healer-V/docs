---
title: "客户端封装与契约测试"
tags:
  - OpenAI API
  - 契约测试
  - Python
excerpt: "将 OpenAI SDK 对象隔离在适配器内部，以领域请求、结果和错误作为稳定边界，并通过离线契约测试与少量在线冒烟验证升级影响。"
date: 2026-09-28
---

# 客户端封装与契约测试

业务代码直接读取 SDK Response、输出项和异常类，会把外部接口变化扩散到整个应用。稳定做法是在接入层建立适配器：输入领域请求，输出领域结果或领域错误；SDK 对象只存在于适配器内部。契约测试验证的是这个公开边界，不是 Mock 被调用了几次。

本文实现一个工单摘要客户端，离线验证成功、未完成和异常映射，并说明在线冒烟测试的最小范围。

## 一、封装边界

### 1. 领域对象

业务层只需要稳定信息：工单标识、反馈文本、摘要、模型、Response ID 和用量。

::: details 查看领域请求与结果对象

```python
@dataclass(frozen=True)
class SummaryRequest:
    case_id: str
    feedback: str


@dataclass(frozen=True)
class SummaryResult:
    case_id: str
    summary: str
    model: str
    response_id: str
    total_tokens: int | None
```

:::

领域对象不导入 `openai.types`。这样业务测试不需要构造复杂 SDK 模型，升级 SDK 时也只审查适配器。

### 2. 端口与适配器

调用方依赖 `ModelClient` 协议，生产环境注入 OpenAI 适配器，测试环境可以注入确定性替身。

```text
业务服务 → ModelClient 协议 → OpenAIModelClient → OpenAI SDK → API
                    └──────→ FakeModelClient（业务测试）
```

协议只包含业务需要的方法。不要把 `responses.create(**kwargs)` 原样暴露，否则调用方仍然依赖供应商参数。

### 3. 配置注入

模型、超时和重试配置通过构造函数注入。适配器不在方法内部读取散落的环境变量，避免测试和多租户场景出现隐式状态。

## 二、结果映射

### 1. 成功结果

适配器检查 Response 状态和文本，再构造 `SummaryResult`。业务层不需要知道 `output` 中存在 reasoning、message 或其他项。

### 2. 失败结果

外部异常映射为少量领域异常：

| 领域异常 | 来源 | 调用方动作 |
|----------|------|------------|
| `InvalidModelRequest` | 参数、模型或结构不兼容 | 修复配置，不重试 |
| `ModelUnavailable` | 临时服务、网络或超时 | 进入有限重试或降级 |
| `ModelAccessDenied` | 认证与权限 | 停止并告警 |
| `ModelResultIncomplete` | Response 非完成或无文本 | 保留状态并转待处理 |

异常信息不包含密钥和完整客户文本。

## 三、完整实现

下面使用两个文件形成独立示例。`model_client.py` 是生产适配器，`test_model_client.py` 使用最小 SDK 形状替身验证公开契约。

:::: details 查看客户端适配器与契约测试

::: code-group

```python [model_client.py]
# model_client.py
from dataclasses import dataclass
from typing import Protocol

import openai
from openai import OpenAI


@dataclass(frozen=True)
class SummaryRequest:
    """表示业务层提交的工单摘要请求。"""

    case_id: str
    feedback: str


@dataclass(frozen=True)
class SummaryResult:
    """表示业务层可以稳定消费的模型结果。"""

    case_id: str
    summary: str
    model: str
    response_id: str
    total_tokens: int | None


class ModelClientError(Exception):
    """表示模型客户端公开错误的基类。"""


class InvalidModelRequest(ModelClientError):
    """表示请求或模型配置需要修复，不能原样重试。"""


class ModelUnavailable(ModelClientError):
    """表示经过上层策略判断后可以重试的临时故障。"""


class ModelAccessDenied(ModelClientError):
    """表示认证或权限配置阻止调用。"""


class ModelResultIncomplete(ModelClientError):
    """表示响应没有形成可提交的完成文本。"""


class ModelClient(Protocol):
    """定义工单服务依赖的稳定模型端口。"""

    def summarize(self, request: SummaryRequest) -> SummaryResult:
        """生成工单摘要，失败时抛出领域异常。"""
        ...


class OpenAIModelClient:
    """把 OpenAI Responses SDK 适配为领域端口。"""

    def __init__(self, sdk: OpenAI, model: str) -> None:
        """创建适配器。

        Args:
            sdk: 已配置超时、凭据和重试策略的 SDK 客户端。
            model: 已验证支持文本 Responses 的模型标识。

        Returns:
            无返回值；配置只保存在适配器实例中。
        """
        if not model:
            raise ValueError("model must not be empty")
        self._sdk = sdk
        self._model = model

    def summarize(self, request: SummaryRequest) -> SummaryResult:
        """生成并映射工单摘要。

        Args:
            request: 包含稳定工单 ID 和非空反馈文本的请求。

        Returns:
            不包含 SDK 对象的领域结果。

        Raises:
            InvalidModelRequest: 输入无效或 API 拒绝请求形状。
            ModelUnavailable: 出现临时服务、网络或超时故障。
            ModelAccessDenied: 凭据或权限无效。
            ModelResultIncomplete: 响应未完成或没有文本。
        """
        if not request.case_id or not request.feedback.strip():
            raise InvalidModelRequest("case_id and feedback are required")
        try:
            response = self._sdk.responses.create(
                model=self._model,
                instructions="将客户反馈压缩为一句事实摘要，不补造处理结果。",
                input=request.feedback,
            )
        except (openai.AuthenticationError, openai.PermissionDeniedError) as exc:
            raise ModelAccessDenied("model access denied") from exc
        except openai.BadRequestError as exc:
            raise InvalidModelRequest("model request rejected") from exc
        except (
            openai.RateLimitError,
            openai.InternalServerError,
            openai.APIConnectionError,
            openai.APITimeoutError,
        ) as exc:
            raise ModelUnavailable("model temporarily unavailable") from exc

        if response.status != "completed" or not response.output_text:
            raise ModelResultIncomplete(f"response status={response.status}")
        total_tokens = getattr(response.usage, "total_tokens", None)
        return SummaryResult(
            case_id=request.case_id,
            summary=response.output_text,
            model=response.model,
            response_id=response.id,
            total_tokens=total_tokens,
        )
```

```python [test_model_client.py]
# test_model_client.py
from types import SimpleNamespace

import pytest

from model_client import (
    ModelResultIncomplete,
    OpenAIModelClient,
    SummaryRequest,
)


class FakeResponses:
    """返回固定 Response 形状，不模拟 SDK 内部实现。"""

    def __init__(self, response) -> None:
        """保存下一次 create 返回的公开形状。"""
        self._response = response

    def create(self, **_kwargs):
        """返回固定响应，参数只用于兼容适配器调用。"""
        return self._response


class FakeSDK:
    """提供适配器实际使用的 responses 属性。"""

    def __init__(self, response) -> None:
        """使用固定响应创建测试 SDK。"""
        self.responses = FakeResponses(response)


def response_fixture(status: str, text: str):
    """构造适配器所需的最小 Response 公开形状。

    Args:
        status: 需要测试的响应状态。
        text: 聚合文本，可以为空。

    Returns:
        只包含适配器读取字段的命名空间对象。
    """
    return SimpleNamespace(
        id="resp_fixture_001",
        status=status,
        output_text=text,
        model="gpt-6-luna",
        usage=SimpleNamespace(total_tokens=42),
    )


def test_completed_response_maps_to_domain_result() -> None:
    """完成响应应映射为不含 SDK 类型的领域结果。"""
    client = OpenAIModelClient(
        FakeSDK(response_fixture("completed", "客户反馈导出任务停滞。")),
        "gpt-6-luna",
    )
    result = client.summarize(SummaryRequest("CASE-1042", "导出一直处理中。"))
    assert result.case_id == "CASE-1042"
    assert result.response_id == "resp_fixture_001"
    assert result.total_tokens == 42


def test_incomplete_response_maps_to_domain_error() -> None:
    """未完成响应不能作为空摘要返回。"""
    client = OpenAIModelClient(
        FakeSDK(response_fixture("incomplete", "")),
        "gpt-6-luna",
    )
    with pytest.raises(ModelResultIncomplete, match="incomplete"):
        client.summarize(SummaryRequest("CASE-1042", "导出一直处理中。"))
```

:::

::::

安装并运行：

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install openai==3.19.2 pytest==8.4.2
pytest -q
```

预期结果：

```text
2 passed
```

测试断言领域结果和领域错误，没有断言 SDK 内部方法调用次数、私有字段或序列化细节。

## 四、契约测试范围

### 1. 必测契约

| 类别 | 测试内容 |
|------|----------|
| 成功 | 文本、模型、Response ID 和用量映射 |
| 非完成 | `incomplete`、`failed`、`cancelled` 不返回成功对象 |
| 空输出 | 完成但没有文本进入契约错误 |
| 永久异常 | 请求、认证、权限映射正确 |
| 临时异常 | 限流、服务端、网络和超时映射正确 |
| 配置 | 空模型、空工单和空反馈被本地拒绝 |

固定夹具应覆盖适配器真正读取的公开字段。复制整个在线响应 JSON 会让测试臃肿，也可能保存敏感输入。

### 2. 不应测试

- SDK 内部调用栈和私有属性；
- 模型每次生成完全相同文本；
- Mock 恰好被调用一次而不检查领域结果；
- 供应商服务器的内部重试实现；
- 与当前客户端契约无关的完整 Response 字段。

## 五、在线冒烟

离线契约测试不能证明凭据、模型权限和当前端点仍然可用。发布前可以运行少量在线冒烟：

1. 使用测试项目和非敏感固定输入；
2. 只调用一个低成本请求；
3. 断言领域结果非空、模型与 Response ID 可记录；
4. 不断言自然语言逐字相等；
5. 与离线测试分组，默认开发测试不消耗 API。

在线测试失败时先判断是环境不可用还是契约变化，不能让它替代确定性离线测试。

## 六、升级策略

SDK 升级按以下顺序执行：

1. 在独立分支更新依赖；
2. 运行全部离线契约测试；
3. 检查类型签名和公开字段变化；
4. 修订适配器，保持领域端口不变；
5. 运行测试项目在线冒烟；
6. 对比错误映射、用量和响应状态后发布。

如果升级迫使业务代码大量修改，说明 SDK 对象已经越过适配器边界，应先收紧封装。

## 七、验证结论

客户端封装的价值不是减少代码行数，而是把外部变化集中到一个可测试边界。示例用领域请求、结果和异常隔离 SDK，并通过成功与未完成夹具验证公开契约。

离线夹具不证明真实服务可用，因此仍保留少量在线冒烟；在线调用不具备确定性，也不能替代错误分支的契约测试。

## 八、参考资料

- [Responses API reference](https://developers.openai.com/api/reference/resources/responses)
- [Error codes](https://developers.openai.com/api/docs/guides/error-codes)
- [Production best practices](https://developers.openai.com/api/docs/guides/production-best-practices)
