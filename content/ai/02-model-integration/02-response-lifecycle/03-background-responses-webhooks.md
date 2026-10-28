---
title: "后台响应与 Webhook"
tags:
  - OpenAI API
  - Webhook
  - Python
excerpt: "使用后台 Response 承载长耗时生成，通过查询和 Webhook 接收终态，并以验签、快速确认和事件去重保证业务结果只提交一次。"
date: 2026-09-28
---

# 后台响应与 Webhook

后台响应把“等待模型完成”从一次长连接改为可查询的服务端任务；Webhook 则在状态变化时主动通知应用。两者解决的是交付方式，不自动保证业务只处理一次：**回调必须先验签，再按事件标识去重，并把耗时处理移出 HTTP 请求**。

本文以虚构工单 `CASE-1042` 为例：应用创建后台摘要请求，保存 Response ID；完成事件到达后，接收器验证签名、登记 `webhook-id`，立即返回 `2xx`，后台工作器再查询完整 Response 并提交结果。

## 一、后台生命周期

### 1. 创建与查询

创建请求时设置 `background=True`，API 会返回包含 `id` 和当前 `status` 的 Response。应用应立即保存该 ID 与本地任务的映射。

```python
response = client.responses.create(
    model=model,
    input="生成 CASE-1042 的处理摘要。",
    background=True,
)
print(response.id, response.status)
```

后续通过 `client.responses.retrieve(response.id)` 查询状态。后台模式用于执行时间可能超过普通请求等待窗口的任务，不应被当作通用队列或定时调度器。

### 2. 状态转换

```text
create
  → queued
  → in_progress
  ├─→ completed
  ├─→ failed
  ├─→ incomplete
  └─→ cancelled
```

只有终态能够决定本轮处理结果。Webhook 通知包含事件和资源标识，业务仍应查询完整 Response，不能假定通知正文等于完整模型输出。

### 3. 存储边界

后台执行需要服务端在执行期间保存响应数据。即使请求设置 `store=false`，官方文档也说明后台数据会为异步执行和轮询临时保存。具有严格零数据保留要求的系统必须在架构评审中单独核对这一边界。

::: warning 后台模式不是零存储通道
不要仅凭 `store=false` 推断后台请求从未落盘。应依据当前官方保留规则和组织数据策略判断后台模式是否可用。
:::

## 二、轮询交付

Webhook 不可用时，可以使用有限次数、带间隔的轮询。轮询必须设置业务截止时间，避免无限占用工作器。

::: details 查看后台创建与轮询完整代码

```python
# background_case.py
import os
import time

from openai import OpenAI


TERMINAL_STATUSES = {"completed", "failed", "cancelled", "incomplete"}


def poll_response(client: OpenAI, response_id: str, timeout_seconds: float):
    """在业务期限内查询后台 Response。

    Args:
        client: 已配置非生产凭据的 OpenAI 客户端。
        response_id: 后台创建返回的 Response ID。
        timeout_seconds: 最大轮询秒数，必须大于 0。

    Returns:
        最后读取的 Response；调用方必须继续检查 status。
    """
    deadline = time.monotonic() + timeout_seconds
    current = client.responses.retrieve(response_id)
    while current.status not in TERMINAL_STATUSES:
        if time.monotonic() >= deadline:
            return current
        time.sleep(1.0)
        current = client.responses.retrieve(response_id)
    return current


def main() -> None:
    """创建虚构工单后台摘要，并输出最终可判断状态。"""
    client = OpenAI()
    created = client.responses.create(
        model=os.environ.get("OPENAI_MODEL", "gpt-6-luna"),
        input=(
            "工单 CASE-1042：客户反馈导出报表一直显示处理中。"
            "请给出不超过 80 字的客服处理摘要。"
        ),
        background=True,
    )
    print(f"created id={created.id} status={created.status}")

    final = poll_response(client, created.id, timeout_seconds=60.0)
    print(f"observed id={final.id} status={final.status}")
    if final.status == "completed":
        print(f"output={final.output_text}")
    else:
        print("output unavailable; keep task pending or inspect terminal details")


if __name__ == "__main__":
    main()
```

:::

安装并运行：

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install openai==3.19.2
$env:OPENAI_MODEL = "gpt-6-luna"
python background_case.py
```

正常路径至少应出现相同 Response ID 的创建记录和终态记录。文本内容可以变化，验收重点是 ID 不变、状态为 `completed`，并且只有终态后才读取输出。

::: info 当前端点未通过后台冒烟
Python SDK 3.19.2 的后台方法签名与官方文档已经核对，但本项目当前兼容端点在 2026-09-28 返回 `400 Unsupported parameter: background`。轮询代码因此属于已编译、未完成服务端运行的示例；迁移到支持后台模式的端点后，需要重新记录创建状态、Response ID 和终态。
:::

## 三、Webhook 接收

### 1. 验签顺序

Webhook 请求来自公网，不能只根据 `User-Agent` 或源 IP 信任。接收器需要保留原始请求体并使用 Webhook Secret 验证签名。

处理顺序必须固定：

1. 读取原始请求体和签名头；
2. 调用 SDK 的 `client.webhooks.unwrap()` 完成验签与事件解析；
3. 以 `webhook-id` 或事件 ID 尝试登记去重记录；
4. 将已验证事件放入内部工作队列；
5. 在几秒内返回成功状态；
6. 工作器查询资源并执行耗时业务逻辑。

::: danger 不要先解析再验签
如果框架先修改 JSON 空白、字段顺序或字符编码，签名校验可能失败。验签函数应接收未经修改的原始字符串或字节，以及原始请求头。
:::

### 2. 快速确认

OpenAI 会重试没有及时返回成功状态的 Webhook。回调请求中直接调用模型、写多个外部系统或执行长事务，会增加超时和重复投递概率。

接收器的职责是“验证并接收”，工作器的职责才是“查询并提交业务结果”。HTTP `2xx` 表示事件已被可靠接收，不表示后台业务已经完成。

### 3. 重复投递

Webhook 采用至少一次式交付思路：同一事件可能重复到达。去重键应来自 `webhook-id`，并通过数据库唯一约束或原子写入保证只有一个接收者获得处理权。

仅在内存 `set` 中去重只适合单进程演示；进程重启或多实例部署后会失效。生产环境应使用持久化存储。

## 四、去重处理器

下面的示例把传输层验签与业务层去重拆开。为了可以在空目录离线复现，测试使用已经验签后的事件对象；真实 Web 入口仍必须调用 SDK 的 `unwrap()`。

::: details 查看事件去重与异步处理完整代码

```python
# webhook_delivery.py
from dataclasses import dataclass
from typing import Callable


@dataclass(frozen=True)
class VerifiedEvent:
    """表示已经完成签名验证的最小事件。"""

    webhook_id: str
    event_type: str
    response_id: str


class EventInbox:
    """演示以事件标识实现原子去重的收件箱。"""

    def __init__(self) -> None:
        """创建空收件箱；生产环境应替换为持久化唯一约束。"""
        self._accepted: set[str] = set()

    def accept_once(self, event: VerifiedEvent) -> bool:
        """只接受首次出现的事件。

        Args:
            event: 已验签且包含稳定 webhook_id 的事件。

        Returns:
            首次登记返回 True，重复事件返回 False。
        """
        if event.webhook_id in self._accepted:
            return False
        self._accepted.add(event.webhook_id)
        return True


def receive_event(
    event: VerifiedEvent,
    inbox: EventInbox,
    enqueue: Callable[[VerifiedEvent], None],
) -> int:
    """登记事件并交给异步工作器。

    Args:
        event: 已由传输层验证签名的事件。
        inbox: 提供原子去重语义的收件箱。
        enqueue: 快速入队函数，不在回调中执行耗时业务。

    Returns:
        应返回给 Webhook 发送方的 HTTP 状态码。
    """
    if inbox.accept_once(event):
        enqueue(event)
    return 200


def main() -> None:
    """重复投递同一事件，并验证只入队一次。"""
    inbox = EventInbox()
    queued: list[VerifiedEvent] = []
    event = VerifiedEvent("wh_demo_001", "response.completed", "resp_demo_001")

    first = receive_event(event, inbox, queued.append)
    second = receive_event(event, inbox, queued.append)

    assert first == second == 200
    assert len(queued) == 1
    print(f"statuses={first},{second} queued={len(queued)}")


if __name__ == "__main__":
    main()
```

:::

运行离线验证：

```powershell
python webhook_delivery.py
```

预期输出：

```text
statuses=200,200 queued=1
```

重复事件仍返回 `200`，因为接收器已经处理过该事件；返回错误会促使发送方继续重试。业务队列长度为 1，证明去重控制的是业务处理次数，而不是网络投递次数。

## 五、真实验签入口

以下 Flask 局部示例只展示接收边界。`persist_and_enqueue` 必须由应用实现为持久化去重与快速入队；它不是可直接运行的完整服务。

::: details 查看 Flask Webhook 验签入口

```python
from flask import Flask, request
from openai import OpenAI

app = Flask(__name__)
client = OpenAI()


@app.post("/openai/webhook")
def openai_webhook():
    """验证 OpenAI Webhook，并把事件交给内部队列。"""
    event = client.webhooks.unwrap(request.get_data(as_text=True), request.headers)
    persist_and_enqueue(request.headers["webhook-id"], event)  # 由业务实现
    return "", 200
```

:::

Webhook Secret 应通过环境变量或密钥服务注入。不要把它写入源码、日志、测试夹具或文档截图。

## 六、工作器提交

工作器收到 `response.completed` 后仍需完成以下判断：

| 检查 | 失败时动作 |
|------|------------|
| 事件类型是否受支持 | 记录并忽略未知类型 |
| Response ID 是否映射到本地任务 | 隔离事件并告警，不猜测归属 |
| 查询结果是否为 `completed` | 按实际终态进入失败或待定分支 |
| 输出是否通过业务校验 | 标记需复核，不提交错误记录 |
| 本地任务是否已经完成 | 幂等返回，不重复写业务系统 |

`response.failed`、`response.incomplete` 和 `response.cancelled` 也应进入显式分支。只订阅完成事件会让失败任务长期停留在“处理中”。

## 七、交付策略

| 条件 | 轮询 | Webhook |
|------|------|---------|
| 本地开发与短期脚本 | 简单直接 | 需要公网入口，不一定值得 |
| 大量长任务 | 会产生持续查询流量 | 更适合作为状态通知 |
| 防火墙限制入站 | 可用 | 可能不可用 |
| 低延迟通知 | 受轮询间隔影响 | 通常更及时 |
| 可靠性要求 | 需要查询退避与截止时间 | 需要验签、去重和异步工作器 |

实际系统可以组合两者：Webhook 作为主要通知，定时轮询作为丢失通知后的对账手段。两条路径必须汇入同一幂等提交函数，避免分别写入业务结果。

## 八、验证结论

后台 Response 提供可持久化的任务标识和服务端状态；Webhook 提供状态变化通知。可靠闭环成立的条件是：创建时保存映射、通知先验签、接收器快速返回、事件持久化去重、工作器重新查询完整资源、业务提交再次幂等。

本文的离线测试已实际运行，证明相同 `webhook-id` 重复投递只入队一次。当前兼容端点不支持后台参数，且没有配置公网 Webhook，因此后台终态与真实签名投递均未在线验证；迁移到支持环境后必须补录这两项证据。

## 九、参考资料

- [Background mode](https://developers.openai.com/api/docs/guides/background)
- [Webhooks](https://developers.openai.com/api/docs/guides/webhooks)
- [Responses API reference](https://developers.openai.com/api/reference/resources/responses)
