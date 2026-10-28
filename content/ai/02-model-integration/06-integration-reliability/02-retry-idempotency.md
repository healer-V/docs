---
title: "重试与幂等"
tags:
  - OpenAI API
  - 重试
  - 幂等
excerpt: "为临时故障设置有限指数退避、抖动和 Retry-After 处理，并用业务幂等键保证工具或回调副作用在重复请求下只执行一次。"
date: 2026-09-28
---

# 重试与幂等

重试解决临时可恢复故障，幂等解决重复执行副作用。两者不能互相替代：请求最终成功不代表动作只发生一次，而幂等动作也不应无限重试。可靠策略必须同时限制重试资格、尝试次数、总等待时间和业务执行键。

本文用受控调用序列验证两条路径：临时 `429` 在第二次恢复；相同退款申请键重复提交时，底层副作用只执行一次。

## 一、重试资格

### 1. 决策表

| 失败 | 是否重试 | 前提 |
|------|----------|------|
| 临时 `429` / `slow_down` | 是 | 遵守 `Retry-After`，有限次数 |
| `503` / 模型过载 | 是 | 指数退避与随机抖动 |
| `500` 服务端错误 | 通常是 | 请求可安全重放 |
| 网络连接失败 | 有条件 | 判断请求是否可能已到达服务端 |
| 客户端读取超时 | 有条件 | 先判断结果未知和副作用 |
| `400` 参数错误 | 否 | 修复请求后才可重新发起 |
| `401` / `403` | 否 | 修复凭据或权限 |
| 配额、余额、支出限制 | 否 | 人工调整账户状态 |

重试判断应复用错误分类结果。调用层不能看到 `429` 就自动重放。

### 2. 流式与工具边界

流式响应已经产生部分内容后，自动重放会产生第二份不同输出。工具已经执行但回传超时后，重放可能再次触发副作用。两类请求都需要比普通只读文本生成更保守的策略。

::: warning 结果未知时先查状态
网络断开和读取超时无法证明服务端未处理请求。若存在 Response ID、任务 ID 或业务幂等记录，先查询状态；没有查询能力的高风险副作用应转人工处理。
:::

## 二、退避算法

### 1. 指数退避

第 `n` 次重试的基础等待可以表示为：

```text
delay = min(max_delay, base_delay × 2^n)
```

多个客户端同时失败时，如果都按相同间隔重试，会形成同步流量峰值。应在基础等待上加入随机抖动。

### 2. `Retry-After`

服务端提供 `Retry-After` 时，把它作为最低等待时间，再叠加少量抖动。该请求头只说明临时错误的建议等待，不会让配额耗尽或参数错误变成可重试。

### 3. 总预算

重试循环至少需要三项上限：

- 最大尝试次数；
- 单次等待上限；
- 总耗时或业务截止时间。

任一上限到达即停止。前台请求通常使用较短预算，后台任务可以更长，但仍不能无限运行。

## 三、SDK 与应用重试

OpenAI Python SDK 3.19.2 客户端的默认 `max_retries` 为 `2`。如果应用外层再执行三次尝试，最坏请求次数不是三次，而可能是每次应用尝试都触发 SDK 内部重试。

二选一建立清晰责任：

1. 只使用 SDK 重试，应用不再包装同类错误；
2. 把客户端设为 `max_retries=0`，由应用统一处理 `Retry-After`、业务截止时间和指标。

```python
client = OpenAI(max_retries=0)
```

需要业务幂等、统一预算或跨服务观测时，第二种方式更容易证明真实尝试次数。

## 四、业务幂等

### 1. 稳定执行键

幂等键必须表示同一个业务意图，而不是每次 HTTP 请求的随机 ID。例如：

```text
refund:CASE-1042:ORD-2048:duplicate-charge:v1
```

相同意图重试使用同一键；用户修改金额、原因或目标后必须产生新版本键。

### 2. 原子状态

持久化记录至少需要：

| 字段 | 作用 |
|------|------|
| `idempotency_key` | 唯一业务执行键 |
| `status` | `processing`、`succeeded`、`failed` |
| `request_hash` | 防止同一键对应不同参数 |
| `result` | 成功结果或可公开错误 |
| `updated_at` | 判断陈旧处理中状态 |

“先查询再插入”在并发下仍会重复执行。生产实现必须依赖数据库唯一约束、事务或等价原子操作取得执行权。

### 3. 结果缓存

同一键已经成功时，返回之前保存的结果，不再次调用副作用系统。相同键但请求哈希不同应直接拒绝，不能复用旧结果或覆盖记录。

## 五、完整验证

下面的单文件程序以确定性替身验证重试和幂等。`sleep` 与随机数都通过参数注入，因此测试不会真实等待，也不会产生不稳定输出。

::: details 查看重试与幂等完整实现

```python
# retry_idempotency.py
import hashlib
import json
from dataclasses import dataclass
from typing import Callable


class RetryableError(Exception):
    """表示已经分类为可重试的临时失败。"""

    def __init__(self, message: str, retry_after: float | None = None) -> None:
        """创建临时错误并保存服务端最低等待时间。"""
        super().__init__(message)
        self.retry_after = retry_after


def call_with_retry(
    operation: Callable[[], str],
    max_attempts: int,
    sleep: Callable[[float], None],
    jitter: Callable[[], float],
) -> str:
    """在有限预算内执行已确认可安全重放的操作。

    Args:
        operation: 无参数调用；临时失败时抛出 RetryableError。
        max_attempts: 包含首次调用的最大尝试数，必须大于 0。
        sleep: 等待函数，测试中可注入记录器避免真实暂停。
        jitter: 返回 0 到 0.25 秒随机抖动的函数。

    Returns:
        首次成功的字符串结果。

    Raises:
        ValueError: 最大尝试数无效。
        RetryableError: 用尽预算后仍失败。
    """
    if max_attempts <= 0:
        raise ValueError("max_attempts must be positive")
    for attempt in range(max_attempts):
        try:
            return operation()
        except RetryableError as error:
            if attempt + 1 == max_attempts:
                raise
            exponential = min(8.0, 0.5 * (2**attempt))
            minimum = error.retry_after or 0.0
            sleep(max(exponential, minimum) + jitter())
    raise AssertionError("unreachable")


@dataclass(frozen=True)
class StoredResult:
    """保存幂等动作的请求哈希和公开结果。"""

    request_hash: str
    result: dict


class IdempotencyStore:
    """演示单进程幂等记录；生产环境必须使用持久化原子存储。"""

    def __init__(self) -> None:
        """创建空记录表。"""
        self._records: dict[str, StoredResult] = {}

    def execute_once(
        self,
        key: str,
        payload: dict,
        action: Callable[[], dict],
    ) -> dict:
        """对同一键和参数只执行一次副作用。

        Args:
            key: 稳定业务意图键，不得每次重试随机生成。
            payload: 参与一致性校验的业务参数。
            action: 真正的副作用函数，仅在首次请求时调用。

        Returns:
            首次执行结果或之前缓存的同一结果。

        Raises:
            ValueError: 键为空，或同一键对应不同参数。
        """
        if not key:
            raise ValueError("idempotency key must not be empty")
        request_hash = hashlib.sha256(
            json.dumps(payload, sort_keys=True).encode("utf-8")
        ).hexdigest()
        existing = self._records.get(key)
        if existing:
            if existing.request_hash != request_hash:
                raise ValueError("idempotency key reused with different payload")
            return existing.result
        result = action()
        self._records[key] = StoredResult(request_hash, result)
        return result


def main() -> None:
    """验证临时失败恢复和重复副作用只执行一次。"""
    attempts = 0
    waits: list[float] = []

    def temporary_operation() -> str:
        """首次抛出受控 429，第二次返回成功。"""
        nonlocal attempts
        attempts += 1
        if attempts == 1:
            raise RetryableError("slow_down", retry_after=1.0)
        return "completed"

    assert call_with_retry(temporary_operation, 3, waits.append, lambda: 0.1) == "completed"
    assert attempts == 2 and waits == [1.1]

    store = IdempotencyStore()
    executions = 0

    def submit_refund() -> dict:
        """模拟一次需要幂等保护的退款申请副作用。"""
        nonlocal executions
        executions += 1
        return {"refund_id": "RF-731", "status": "submitted"}

    payload = {"order_id": "ORD-2048", "reason": "duplicate_charge"}
    first = store.execute_once("refund:CASE-1042:ORD-2048:v1", payload, submit_refund)
    second = store.execute_once("refund:CASE-1042:ORD-2048:v1", payload, submit_refund)
    assert first == second and executions == 1
    print(f"attempts={attempts} waits={waits} side_effects={executions}")


if __name__ == "__main__":
    main()
```

:::

运行：

```powershell
python retry_idempotency.py
```

预期输出：

```text
attempts=2 waits=[1.1] side_effects=1
```

首次临时错误等待至少一秒并在第二次成功；相同退款键提交两次，副作用计数仍为 1。

## 六、故障边界

| 失败模式 | 产生原因 | 防护 |
|----------|----------|------|
| 重试风暴 | 无抖动、无总预算 | 指数退避、抖动和截止时间 |
| 尝试次数放大 | SDK 与应用同时重试 | 明确单一重试责任 |
| 重复退款 | 每次重试生成新键 | 以业务意图生成稳定键 |
| 键误复用 | 参数变化但键不变 | 保存并比较请求哈希 |
| 永久错误反复请求 | 只看 HTTP 状态 | 使用错误代码与领域分类 |
| 未知结果直接重放 | 超时被误认为未执行 | 先查询任务或幂等记录 |

## 七、验证结论

重试策略只处理已分类的临时故障，并受次数、时间和延迟约束；幂等策略使用稳定业务键和原子记录保护副作用。离线测试分别证明临时错误可以恢复、重复提交不会重复执行动作。

示例中的内存幂等表只用于解释语义，不具备多进程和崩溃恢复能力。生产实现必须使用持久化唯一约束，并定义长期 `processing` 记录的恢复流程。

## 八、参考资料

- [Rate limits](https://developers.openai.com/api/docs/guides/rate-limits)
- [Error codes](https://developers.openai.com/api/docs/guides/error-codes)
- [Webhooks](https://developers.openai.com/api/docs/guides/webhooks)
