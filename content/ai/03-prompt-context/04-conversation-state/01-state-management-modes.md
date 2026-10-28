---
title: "会话状态模式"
tags:
  - OpenAI API
  - Conversation State
  - Python
excerpt: "对比手工历史、previous_response_id 与 Conversations API 的续接方式、存储责任、Token 计费和清理边界。"
date: 2026-09-28
---

# 会话状态模式

多轮对话的核心不是“模型记住了什么”，而是应用如何把前一轮信息交给下一次响应。Responses API 支持三种常见方式：应用手工重传历史、使用 `previous_response_id` 续接响应链，以及使用 Conversations API 维护持久会话。

本文使用同一条两轮工单验证状态连续性。第一轮声明“客户要求加急，当前不能承诺退款”，第二轮只问“这个工单的处理边界是什么”。如果状态正确续接，第二轮应同时保留“可以确认加急诉求”和“不能承诺退款”两个事实。

::: tip 模式选择先看状态责任
三种模式都可能得到连续回答，差别主要在历史由谁保存、怎样引用、保留多久、如何删除和怎样调试。`previous_response_id` 减少客户端传输代码，不会让此前输入 Token 免费。
:::

## 一、状态责任

会话状态由输入项和服务端对象承载，不是模型进程中的永久记忆。每次请求都需要通过某种方式确定当前响应能看到哪些先前内容。

### 1. 三种模式

| 模式 | 下一轮怎样续接 | 主要存储责任 | 典型场景 |
|------|----------------|--------------|----------|
| 手工历史 | 重新发送用户输入与模型输出项 | 应用 | 需要完全控制、裁剪、迁移或自建存储 |
| `previous_response_id` | 引用上一条 Response ID | Responses 服务 | 短链路、单分支连续交互 |
| Conversations API | 每次请求引用 Conversation ID | Conversations 服务 | 跨会话、跨任务或长期持久状态 |

这三种模式只管理模型调用需要的上下文。工单状态、订单权限、退款资格等权威业务数据仍应由应用数据库保存，不能因为出现在模型历史里就成为事实来源。

### 2. 两轮状态

本文只验证一个必要事实能否跨轮保留：

```text
第一轮：工单 CASE-20260928-031，客户要求加急，当前不能承诺退款。
第二轮：这个工单的处理边界是什么？
预期：确认加急诉求，但不能承诺退款。
```

第二轮问题没有重复工单编号或退款边界，因此模型必须从续接状态中获得这些信息。输出措辞可以变化，但不能新增退款授权或丢失禁止承诺的约束。

### 3. 指令重申

`instructions` 只作用于当前 Response 请求。使用 `previous_response_id` 时，前一轮的 `instructions` 不会自动作为当前请求的指令继承；应用应在每轮明确传入当前版本的指令。

```python
second = client.responses.create(
    model=model,
    instructions=INSTRUCTIONS,
    input=SECOND_TURN,
    previous_response_id=first.id,
)
```

重复当前指令与重复全部历史不是同一件事。前者维持当前任务约束，后者取决于选用的状态模式。

## 二、模式机制

### 1. 手工历史

应用先发送第一轮，再把原始用户输入、第一轮 `output` 和第二轮用户输入组成新的输入列表。

```python
history = [
    {"role": "user", "content": FIRST_TURN},
    *first.output,
    {"role": "user", "content": SECOND_TURN},
]
```

保留完整 `first.output` 比只保存 `output_text` 更稳妥，因为 Response 可能包含推理项、消息项或其他输出类型。示例设置 `store=False`，并请求 `reasoning.encrypted_content`，使需要推理项的模型可以在无服务端存储模式下把必要状态交还应用续传。

手工历史的优势是边界清晰：应用可以在下一轮前删除无关内容、压缩旧历史或迁移到其他提供商。代价是应用必须正确保存顺序、角色和输出项，并自行承担数据生命周期。

### 2. 响应续接

`previous_response_id` 让下一次请求引用上一条 Response。应用不需要把完整历史重新放入 `input`，但引用链依赖服务端保存的 Response 对象。

```python
second = client.responses.create(
    model=model,
    instructions=INSTRUCTIONS,
    input=SECOND_TURN,
    previous_response_id=first.id,
    store=True,
)
```

Response 对象默认保存 30 天；`store=False` 可以关闭普通响应存储，但这与 Conversations 的持久项不是同一保留规则。本文显式使用 `store=True`，运行后再调用删除接口清理两轮响应。

::: warning 续接不会减少历史计费
官方会话状态指南明确说明，使用 `previous_response_id` 时，链上的先前输入 Token 仍按输入 Token 计费。它简化的是状态传递方式，不是上下文长度或费用。
:::

响应链天然接近单父节点结构。需要从同一历史分叉、跨工作流复用或统一管理长期状态时，应用应评估手工历史或 Conversation，而不是把任意 Response ID 当作业务会话主键。

### 3. 持久会话

Conversations API 先创建一个 Conversation，再让多次 Response 引用同一个 Conversation ID。该对象可以跨会话、设备或任务继续使用。

```python
conversation = client.conversations.create()
first = client.responses.create(
    model=model,
    conversation=conversation.id,
    instructions=INSTRUCTIONS,
    input=FIRST_TURN,
)
```

Conversation 中的项目不会套用普通 Response 对象的 30 天生存期。持久性越强，应用越需要明确会话归属、删除入口、数据分类和访问权限。本文在 `finally` 中删除演示会话，避免测试数据长期保留。

## 三、模式选择

选择依据不应只看代码行数。存储责任、分支能力、删除要求和提供商兼容性都会改变工程成本。

| 约束 | 手工历史 | `previous_response_id` | Conversations API |
|------|----------|------------------------|-------------------|
| 应用掌握完整历史 | 最强 | 需要另行读取或记录 | 需要通过会话接口管理 |
| 请求体简洁 | 较弱 | 强 | 强 |
| 自定义裁剪与压缩 | 直接 | 受响应链结构影响 | 需结合会话项管理 |
| 短期单链续接 | 可用 | 最合适 | 可以但偏重 |
| 跨任务持久状态 | 需自建 | 不适合作为长期主线 | 最合适 |
| 兼容非官方网关 | 相对最好 | 取决于网关 | 取决于网关 |
| 清理责任 | 删除应用记录 | 删除已存 Response | 删除 Conversation |

如果应用已经有受治理的会话数据库，手工历史通常最容易和业务状态、权限、审计及多提供商路由结合。若只需要短链连续响应，`previous_response_id` 可以减少输入组装。Conversation 适合明确接受服务端持久状态并需要跨任务续接的场景。

## 四、环境与实现

示例从空目录开始，使用 Python 3.12 和 OpenAI Python SDK 3.19.2。三种模式放在同一个文件中，通过命令行参数分别运行，避免某个服务端能力不可用时阻塞其他模式验证。

### 1. 运行环境

::: code-group

```powershell [PowerShell]
mkdir state-modes-demo
cd state-modes-demo
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
```

```bash [Bash]
mkdir state-modes-demo && cd state-modes-demo
python3.12 -m venv .venv
source .venv/bin/activate
```

:::

安装精确 SDK：

```bash
python -m pip install "openai==3.19.2"
python -c "import openai; print(openai.__version__)"
```

设置 `OPENAI_API_KEY` 和可选的 `OPENAI_MODEL`。如果环境中还设置了 `OPENAI_BASE_URL`，请求可能进入兼容网关；运行服务端状态模式前，应确认该网关明确支持 `previous_response_id`、Responses `conversation` 参数和 Conversations API。

::: info 验证基线与限制
手工历史模式已在 Python 3.12.14、SDK 3.19.2 和 `gpt-6-luna` 下完成真实两轮调用。当前验证环境预设的兼容网关不支持另外两种服务端状态能力；正文分别保留了实际 `400` 证据。它们的请求字段与生命周期依据 OpenAI 官方文档和 SDK 3.19.2 签名核对，但未在本环境完成官方端点闭环。
:::

### 2. 完整程序

新建 `state_modes_demo.py`。程序接受 `manual`、`previous`、`conversation` 或 `all`，每种模式都输出两轮文本和 Token 用量。

::: details 查看会话状态模式完整代码

```python
# state_modes_demo.py
from __future__ import annotations

import json
import os
import sys
from collections.abc import Iterable, Sequence
from typing import Any

from openai import APIConnectionError, APIStatusError, OpenAI


INSTRUCTIONS = """你是客服工单助手。
只依据会话中明确出现的事实回答，不得承诺退款。
回答当前问题时使用一句中文。"""
FIRST_TURN = "工单 CASE-20260928-031：客户要求加急，当前不能承诺退款。请确认收到。"
SECOND_TURN = "这个工单的处理边界是什么？"


def response_summary(response: Any) -> dict[str, Any]:
    """提取会话对照所需的文本和 Token 用量。

    Args:
        response: OpenAI SDK 返回的 Response 对象，必须包含状态和文本。

    Returns:
        不含完整响应 ID 的状态、文本和 Token 用量摘要。

    Raises:
        RuntimeError: 响应未完成、文本为空或缺少用量。
    """
    text = response.output_text.strip()
    if response.status != "completed" or not text or response.usage is None:
        raise RuntimeError(f"响应不满足会话验证条件：status={response.status}")
    return {
        "status": response.status,
        "text": text,
        "input_tokens": response.usage.input_tokens,
        "output_tokens": response.usage.output_tokens,
    }


def run_manual_history(client: OpenAI, model: str) -> dict[str, Any]:
    """由应用显式保存并重传两轮输入与模型输出。

    Args:
        client: 已使用有效 API Key 初始化的 OpenAI 客户端。
        model: 当前项目可用的模型名称。

    Returns:
        手工历史模式的两轮结果与存储说明。
    """
    first = client.responses.create(
        model=model,
        instructions=INSTRUCTIONS,
        input=FIRST_TURN,
        include=["reasoning.encrypted_content"],
        store=False,
    )
    history = [
        {"role": "user", "content": FIRST_TURN},
        *first.output,
        {"role": "user", "content": SECOND_TURN},
    ]
    second = client.responses.create(
        model=model,
        instructions=INSTRUCTIONS,
        input=history,
        include=["reasoning.encrypted_content"],
        store=False,
    )
    return {
        "mode": "manual_history",
        "storage": "application",
        "first": response_summary(first),
        "second": response_summary(second),
    }


def delete_responses(client: OpenAI, response_ids: Iterable[str]) -> bool:
    """删除 previous_response_id 模式产生的已存储响应。

    Args:
        client: 已使用有效 API Key 初始化的 OpenAI 客户端。
        response_ids: 需要删除的响应 ID，按后创建先删除的顺序提供。

    Returns:
        全部删除成功时返回 True；任一删除失败时返回 False。
    """
    deleted = True
    for response_id in response_ids:
        try:
            client.responses.delete(response_id)
        except APIStatusError:
            deleted = False
    return deleted


def run_previous_response(client: OpenAI, model: str) -> dict[str, Any]:
    """使用 previous_response_id 续接两轮响应并清理记录。

    Args:
        client: 已使用有效 API Key 初始化的 OpenAI 客户端。
        model: 当前项目可用的模型名称。

    Returns:
        响应续接模式的两轮结果与清理状态。
    """
    response_ids: list[str] = []
    try:
        first = client.responses.create(
            model=model,
            instructions=INSTRUCTIONS,
            input=FIRST_TURN,
            store=True,
        )
        response_ids.append(first.id)
        second = client.responses.create(
            model=model,
            instructions=INSTRUCTIONS,
            input=SECOND_TURN,
            previous_response_id=first.id,
            store=True,
        )
        response_ids.append(second.id)
        result = {
            "mode": "previous_response_id",
            "storage": "response_chain",
            "first": response_summary(first),
            "second": response_summary(second),
        }
    finally:
        cleanup_succeeded = delete_responses(client, reversed(response_ids))
    result["cleanup_succeeded"] = cleanup_succeeded
    return result


def run_conversation(client: OpenAI, model: str) -> dict[str, Any]:
    """使用 Conversations API 保存两轮状态并删除会话。

    Args:
        client: 已使用有效 API Key 初始化的 OpenAI 客户端。
        model: 当前项目可用的模型名称。

    Returns:
        持久会话模式的两轮结果与清理状态。
    """
    conversation = client.conversations.create()
    cleanup_succeeded = False
    try:
        first = client.responses.create(
            model=model,
            conversation=conversation.id,
            instructions=INSTRUCTIONS,
            input=FIRST_TURN,
        )
        second = client.responses.create(
            model=model,
            conversation=conversation.id,
            instructions=INSTRUCTIONS,
            input=SECOND_TURN,
        )
        result = {
            "mode": "conversation",
            "storage": "conversation",
            "first": response_summary(first),
            "second": response_summary(second),
        }
    finally:
        deleted = client.conversations.delete(conversation.id)
        cleanup_succeeded = deleted.deleted
    result["cleanup_succeeded"] = cleanup_succeeded
    return result


def main(arguments: Sequence[str]) -> int:
    """运行指定的会话状态模式并输出对照结果。

    Args:
        arguments: 不含程序名的参数序列；必须指定 manual、previous、
            conversation 或 all。

    Returns:
        指定模式全部完成时返回 0，配置或 API 失败时返回非零值。
    """
    if len(arguments) != 1 or arguments[0] not in {
        "manual",
        "previous",
        "conversation",
        "all",
    }:
        print(
            "用法：python state_modes_demo.py <manual|previous|conversation|all>",
            file=sys.stderr,
        )
        return 64
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("缺少环境变量：OPENAI_API_KEY", file=sys.stderr)
        return 2
    model = os.getenv("OPENAI_MODEL", "gpt-6-luna").strip() or "gpt-6-luna"
    client = OpenAI(api_key=api_key)
    runners = {
        "manual": run_manual_history,
        "previous": run_previous_response,
        "conversation": run_conversation,
    }
    selected = list(runners) if arguments[0] == "all" else [arguments[0]]
    try:
        results = [runners[name](client, model) for name in selected]
    except (APIConnectionError, APIStatusError, RuntimeError) as error:
        print(f"会话验证失败：{error}", file=sys.stderr)
        return 3
    print(json.dumps({"model": model, "results": results}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
```

:::

### 3. 清理顺序

`previous_response_id` 模式按“后创建先删除”清理响应，避免依赖关系仍被后续对象引用。`finally` 保证第二轮失败时也尝试删除第一轮已保存响应。

Conversation 同样在 `finally` 中删除。生产系统不应在每次响应后删除仍需续接的会话，而应根据会话关闭、用户删除请求、数据保留策略或测试结束事件执行清理。

## 五、运行结果

### 1. 手工历史

运行已经在当前环境验证的模式：

```bash
python state_modes_demo.py manual
```

::: details 查看手工历史实际结果

```json
{
  "model": "gpt-6-luna",
  "results": [
    {
      "mode": "manual_history",
      "storage": "application",
      "first": {
        "status": "completed",
        "text": "已收到工单 CASE-20260928-031，客户要求加急，当前不能承诺退款。",
        "input_tokens": 66,
        "output_tokens": 27
      },
      "second": {
        "status": "completed",
        "text": "处理边界是确认客户要求加急，但不能承诺退款。",
        "input_tokens": 108,
        "output_tokens": 49
      }
    }
  ]
}
```

:::

第二轮没有重复业务事实，结果仍保留了“加急”和“不能承诺退款”，证明本次手工输入列表成功续接必要状态。第二轮输入 Token 从 66 增至 108，也反映历史重新进入当前请求。

### 2. 响应续接

标准 OpenAI API-key 账户可使用以下命令验证：

```bash
python state_modes_demo.py previous
```

当前环境通过兼容网关执行时，第一轮普通响应能够创建，第二轮在使用 `previous_response_id` 时返回：

```text
Error code: 400 - previous_response_id requires an OpenAI API-key account for HTTP requests
```

这个结果证明当前凭据与网关组合不满足该模式的服务端条件，不能据此否定官方 API 的能力，也不能把本模式标记为已完成在线验证。程序会在失败后尝试删除第一轮已存 Response。

### 3. 持久会话

标准端点下运行：

```bash
python state_modes_demo.py conversation
```

当前兼容网关在 Responses 请求中返回：

```text
Error code: 400 - Unsupported parameter: conversation
```

这说明兼容网关即使暴露了部分 SDK 路径，也没有实现 Responses 的 `conversation` 参数。接入兼容服务时必须逐项验证接口能力，不能只根据 SDK 中存在方法就假定远端实现完整。

::: warning 未验证结果不能写成预期事实
本文没有给出另外两种模式的伪造成功输出。切换到支持这些能力的官方端点后，应记录两轮真实文本、Token 用量和删除结果，再把验证状态更新为“已运行”。
:::

## 六、存储与计费

状态模式的主要差异集中在数据位置和生命周期。下表描述的是接口责任，不代表任何组织的数据保留合规结论。

| 模式 | 服务端普通 Response 存储 | 历史数据位置 | Token 处理 | 清理入口 |
|------|---------------------------|--------------|------------|----------|
| 手工历史 | 本文 `store=False` | 应用保存并重传 | 重传内容进入当前输入 | 删除应用记录 |
| `previous_response_id` | 本文显式 `store=True` | Response 链 | 先前输入仍计费 | `responses.delete()` |
| Conversation | Conversation 项持久保存 | Conversation | 会话项作为后续上下文 | `conversations.delete()` |

普通 Response 默认保存 30 天；设置 `store=False` 可以关闭该保存行为。Conversation 项不受这个 30 天 Response 生存期限制，应按更长期的持久数据治理。

Token 用量与“请求体是否重复发送”不是同一概念。服务端引用可以减少客户端组装和传输历史的代码，但模型仍需处理进入上下文的先前内容。

::: danger 会话 ID 不是访问控制
获得 Response ID 或 Conversation ID 不代表调用者有权访问对应业务会话。应用必须把服务端对象与自己的用户、租户和授权记录绑定，并在每次读取或续接前验证权限。
:::

## 七、失败诊断

状态续接失败时，先确定问题属于本地历史、服务端对象还是兼容层，而不是立即增加 Prompt 内容。

| 现象 | 优先证据 | 判断方向 |
|------|----------|----------|
| 第二轮遗忘事实 | 实际传入的历史项、顺序和角色 | 手工历史是否漏项或被裁剪 |
| `previous_response_id` 无效 | HTTP 状态、错误类型、Response 是否保存 | ID、保留期、账户或网关能力 |
| `conversation` 参数不支持 | 实际 Base URL 与兼容矩阵 | 当前端点是否实现 Conversations |
| 输入 Token 持续增长 | 每轮 `usage.input_tokens` | 历史是否需要裁剪或压缩 |
| 删除失败 | 删除接口状态与对象类型 | ID 错误、权限或仍有生命周期约束 |
| 指令行为变化 | 每轮实际 `instructions` 版本 | 当前指令是否遗漏或发生变更 |

如果环境设置了 `OPENAI_BASE_URL`，首先确认请求是否仍发送到官方端点。SDK 版本只能说明客户端支持哪些参数，不能证明兼容网关已经实现相同语义。

## 八、适用边界

本文只比较模型上下文的三种续接方式，没有覆盖：

- 工单、订单和权限等权威应用状态的数据库设计；
- 上下文压缩、摘要失真和关键事实连续性验证；
- Agent 的任务状态、检查点、长期记忆和恢复执行；
- 多分支会话合并、并发写入和跨区域一致性；
- 企业数据保留、Zero Data Retention 和法律合规判断；
- Token 成本优化、缓存和长上下文模型选型。

状态模式选定后，应用仍要独立设计业务状态与模型上下文之间的投影。模型历史用于帮助生成下一次响应，不能反向覆盖数据库中的权威事实。

## 九、参考资料

- [OpenAI Conversation state](https://developers.openai.com/api/docs/guides/conversation-state)
- [OpenAI Responses API migration guide](https://developers.openai.com/api/docs/guides/migrate-to-responses)
- [OpenAI Data controls](https://developers.openai.com/api/docs/guides/your-data)
