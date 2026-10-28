---
title: "API 错误分类"
tags:
  - OpenAI API
  - 错误处理
  - Python
excerpt: "依据 HTTP 状态、SDK 异常类和错误代码区分认证、权限、请求、限流、配额、服务端、网络与超时故障，并选择修复、重试或终止。"
date: 2026-09-28
---

# API 错误分类

模型调用失败后，应用首先需要判断错误是否会随时间自行恢复。认证失败、参数错误和配额耗尽即使重复请求也不会修复；临时限流、服务过载和部分网络错误才有条件进入重试。**只看 HTTP `429` 或异常文本不足以决定策略，还要检查错误代码、请求阶段和副作用状态。**

本文建立统一错误分类，把 OpenAI Python SDK 异常转换为领域错误，同时控制日志中的请求标识与敏感内容。

## 一、错误证据

### 1. 三层信息

| 证据 | 示例 | 用途 |
|------|------|------|
| HTTP 状态 | `400`、`401`、`429`、`503` | 判断协议级类别 |
| SDK 异常类 | `BadRequestError`、`RateLimitError` | 稳定捕获客户端行为 |
| API 错误代码 | `slow_down`、`credit_balance_exhausted` | 区分同一状态下的原因 |

同一个 `429` 既可能表示临时请求速率限制，也可能表示信用余额、组织支出或用量限制。前者可延迟重试，后者需要人工调整账户或限额。

### 2. 请求标识

SDK 异常和成功响应可能提供请求 ID。请求 ID、时间、模型和错误代码是联系支持或关联服务日志的关键证据。

日志不应包含：

- API Key 或 Authorization 请求头；
- 完整客户输入和附件内容；
- 未脱敏工具参数；
- 服务端完整响应体中的敏感字段；
- 本地环境变量和凭据路径。

可以记录脱敏业务标识、输入长度、模型、状态、错误代码、请求 ID 和重试次数。

## 二、分类与动作

### 1. 永久错误

| 类别 | 常见证据 | 默认动作 |
|------|----------|----------|
| 认证 | `401`、`AuthenticationError` | 停止请求，轮换或修复凭据 |
| 权限 | `403`、`PermissionDeniedError` | 检查项目、模型和区域授权 |
| 请求校验 | `400`、`BadRequestError` | 修复字段、模型兼容或 Schema |
| 资源不存在 | `404`、`NotFoundError` | 修复 ID 或资源生命周期 |
| 配额与余额 | `429` 加配额、余额或支出代码 | 调整限额或充值，不自动重试 |

永久错误是相对于“原请求不变”而言。修复配置、权限或请求内容后可以重新发起，但不能由自动退避循环反复消耗资源。

### 2. 临时错误

| 类别 | 常见证据 | 重试条件 |
|------|----------|----------|
| 速率限制 | `429`、`RateLimitError`、`slow_down` | 遵守 `Retry-After`，限制次数 |
| 模型过载 | `503`、`InternalServerError`、`server_is_overloaded` | 延迟并加入抖动 |
| 服务端错误 | `500`～`599` | 请求可安全重放且未超预算 |
| 连接失败 | `APIConnectionError` | 确认请求副作用和网络状态 |
| 客户端超时 | `APITimeoutError` | 结果未知时先判断幂等 |

::: warning 临时错误也不是无限重试
重试必须受最大次数、总耗时和业务截止时间约束。流式请求已经产生部分输出后，不应自动整请求重放；副作用工具结果未知时，必须先执行幂等查询。
:::

## 三、领域错误

### 1. 统一模型

业务层不应到处捕获 SDK 的十几种异常。适配层可以映射为少量稳定领域类别，同时保留诊断证据。

::: details 查看领域错误枚举

```python
class ErrorKind(StrEnum):
    AUTH = "auth"
    PERMISSION = "permission"
    INVALID_REQUEST = "invalid_request"
    NOT_FOUND = "not_found"
    THROTTLED = "throttled"
    QUOTA = "quota"
    TRANSIENT = "transient"
    NETWORK = "network"
    TIMEOUT = "timeout"
    UNKNOWN = "unknown"
```

:::

`retryable` 应由分类器计算，而不是由调用方凭异常名称猜测。

### 2. 错误代码优先

遇到 `429` 时，先检查 `error.code`：

- `slow_down` 或请求速率限制可以退避；
- `credit_balance_exhausted` 不能通过等待恢复；
- `organization_spend_limit_exceeded` 和 `project_spend_limit_exceeded` 需要调整支出限制；
- `organization_usage_limit_exceeded` 需要提高获批用量。

同一 HTTP 状态进入不同领域类别，是分类器必须存在的主要原因。

## 四、完整分类器

下面的程序使用 SDK 异常类与可选错误代码生成稳定结果。固定异常夹具用于离线验证，不向真实 API 发送无效密钥。

::: details 查看 API 错误分类完整实现

```python
# api_error_policy.py
from dataclasses import dataclass
from enum import StrEnum

import openai


class ErrorKind(StrEnum):
    """表示模型接入层对业务公开的错误类别。"""

    AUTH = "auth"
    PERMISSION = "permission"
    INVALID_REQUEST = "invalid_request"
    NOT_FOUND = "not_found"
    THROTTLED = "throttled"
    QUOTA = "quota"
    TRANSIENT = "transient"
    NETWORK = "network"
    TIMEOUT = "timeout"
    UNKNOWN = "unknown"


@dataclass(frozen=True)
class ErrorDecision:
    """保存错误类别、重试资格和可公开诊断字段。"""

    kind: ErrorKind
    retryable: bool
    code: str | None = None
    request_id: str | None = None


QUOTA_CODES = {
    "credit_balance_exhausted",
    "organization_spend_limit_exceeded",
    "project_spend_limit_exceeded",
    "organization_usage_limit_exceeded",
}


def read_error_code(error: Exception) -> str | None:
    """从 SDK 异常响应中安全读取 API 错误代码。"""
    body = getattr(error, "body", None)
    if not isinstance(body, dict):
        return None
    nested = body.get("error", body)
    return nested.get("code") if isinstance(nested, dict) else None


def classify_error(error: Exception) -> ErrorDecision:
    """把 SDK 异常映射为稳定领域决策。

    Args:
        error: 模型客户端抛出的异常；未知异常也会安全分类。

    Returns:
        包含类别、重试资格、错误代码和请求 ID 的决策。
    """
    code = read_error_code(error)
    request_id = getattr(error, "request_id", None)
    if isinstance(error, openai.AuthenticationError):
        return ErrorDecision(ErrorKind.AUTH, False, code, request_id)
    if isinstance(error, openai.PermissionDeniedError):
        return ErrorDecision(ErrorKind.PERMISSION, False, code, request_id)
    if isinstance(error, openai.BadRequestError):
        return ErrorDecision(ErrorKind.INVALID_REQUEST, False, code, request_id)
    if isinstance(error, openai.NotFoundError):
        return ErrorDecision(ErrorKind.NOT_FOUND, False, code, request_id)
    if isinstance(error, openai.RateLimitError):
        if code in QUOTA_CODES:
            return ErrorDecision(ErrorKind.QUOTA, False, code, request_id)
        return ErrorDecision(ErrorKind.THROTTLED, True, code, request_id)
    if isinstance(error, openai.InternalServerError):
        return ErrorDecision(ErrorKind.TRANSIENT, True, code, request_id)
    if isinstance(error, openai.APITimeoutError):
        return ErrorDecision(ErrorKind.TIMEOUT, True, code, request_id)
    if isinstance(error, openai.APIConnectionError):
        return ErrorDecision(ErrorKind.NETWORK, True, code, request_id)
    return ErrorDecision(ErrorKind.UNKNOWN, False, code, request_id)


@dataclass(frozen=True)
class ControlledError(Exception):
    """为离线测试提供与分类器无关的最小错误夹具。"""

    status: int
    code: str | None


def classify_fixture(error: ControlledError) -> ErrorDecision:
    """验证关键状态与错误代码组合，不构造 SDK 内部对象。"""
    if error.status == 429 and error.code in QUOTA_CODES:
        return ErrorDecision(ErrorKind.QUOTA, False, error.code)
    if error.status == 429:
        return ErrorDecision(ErrorKind.THROTTLED, True, error.code)
    if error.status >= 500:
        return ErrorDecision(ErrorKind.TRANSIENT, True, error.code)
    return ErrorDecision(ErrorKind.INVALID_REQUEST, False, error.code)


def main() -> None:
    """验证相同 429 状态可以产生不同重试决策。"""
    temporary = classify_fixture(ControlledError(429, "slow_down"))
    quota = classify_fixture(ControlledError(429, "credit_balance_exhausted"))
    invalid = classify_fixture(ControlledError(400, "invalid_value"))
    assert temporary.retryable is True
    assert quota.retryable is False
    assert invalid.retryable is False
    print(
        f"temporary={temporary.kind}:{temporary.retryable} "
        f"quota={quota.kind}:{quota.retryable} "
        f"invalid={invalid.kind}:{invalid.retryable}"
    )


if __name__ == "__main__":
    main()
```

:::

运行：

```powershell
python -m pip install openai==3.19.2
python api_error_policy.py
```

预期输出：

```text
temporary=throttled:True quota=quota:False invalid=invalid_request:False
```

该验证证明 HTTP 状态相同不代表恢复策略相同。

## 五、受控在线错误

若测试项目允许，可以用不存在的模型标识触发资源或请求错误，验证请求 ID 和异常类。但不要故意使用错误密钥：认证失败测试容易污染安全监控，也不能把密钥值写入命令历史。

```python
try:
    client.responses.create(model="model-does-not-exist", input="ping")
except openai.APIError as error:
    decision = classify_error(error)
    print(decision.kind, decision.code, decision.request_id)
```

在线错误的具体状态取决于账户、网关和模型路由，因此文档不伪造固定输出。确定性分类规则由离线夹具验证。

## 六、日志边界

推荐结构化日志字段：

| 字段 | 示例 | 说明 |
|------|------|------|
| `operation` | `classify_support_case` | 稳定业务操作名 |
| `model` | `gpt-6-luna` | 实际请求模型 |
| `error_kind` | `throttled` | 领域类别 |
| `error_code` | `slow_down` | API 代码，可为空 |
| `request_id` | 脱敏后的请求 ID | 支持关联排障 |
| `attempt` | `2` | 当前尝试次数 |
| `input_chars` | `128` | 只记录长度，不记录原文 |

异常堆栈可以进入受控内部日志，但必须经过秘密和个人数据过滤。

## 七、验证结论

可靠错误处理需要组合 SDK 异常类、HTTP 状态和 API 错误代码。本文分类器把稳定领域决策与 SDK 细节隔离，并通过固定夹具证明临时限流、配额耗尽和无效请求进入不同策略。

重试次数、等待时间和副作用幂等由[重试与幂等](./02-retry-idempotency.md)负责；当前文章只决定“是否具备重试资格”，不直接启动重试循环。

## 八、参考资料

- [Error codes](https://developers.openai.com/api/docs/guides/error-codes)
- [Rate limits](https://developers.openai.com/api/docs/guides/rate-limits)
- [Spend limits](https://developers.openai.com/api/docs/guides/spend-limits)
