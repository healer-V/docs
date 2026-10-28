---
title: "Responses API 调用"
tags:
  - OpenAI API
  - Responses API
  - Python
excerpt: "使用 OpenAI Python SDK 完成一次文本请求，理解请求与响应结构，并依据状态、文本、Token 用量和错误证据判断调用结果。"
date: 2026-09-28
---

# Responses API 调用

Responses API 接收应用输入并返回结构化响应。应用不能只检查终端是否打印了文字，还需要确认响应已经完成、文本不为空，并保留响应 ID 和 Token 用量作为运行证据。

本文使用一个固定场景：把一段虚构的客户反馈压缩为一句中文摘要。示例只处理单次、非流式文本请求，不涉及多轮对话、结构化输出、工具调用或自动重试。

::: tip 请求成功的最小判据
`status` 为 `completed`、`output_text` 非空、`usage` 存在，并且程序以退出码 `0` 结束。这四项只能证明接口调用完成，不能证明摘要已经满足业务要求。
:::

## 一、请求模型

一次调用由应用、SDK 和模型服务共同完成。先区分各对象的责任，再查看代码，才能判断错误发生在本地配置、网络请求、API 服务还是响应校验阶段。

### 1. 调用链

客户反馈从 Python 应用进入 SDK，SDK 将请求发送到 Responses API。API 返回 `Response` 对象后，应用读取字段并决定本次结果是否可以继续使用。

```text
客户反馈
  → Python 应用
  → OpenAI Python SDK
  → Responses API
  → Response 对象
  → 状态、文本与用量校验
```

这条链路包含两个不同的成功条件：

1. **请求执行成功**：SDK 收到 API 响应，没有连接异常或 HTTP 错误。
2. **响应符合应用约束**：状态完成、文本非空、用量存在，程序才输出摘要。

请求执行成功不等于业务结果正确。事实、格式和业务规则仍需要应用单独校验。

### 2. 请求结构

`client.responses.create()` 的三个输入承担不同责任。稳定的任务约束与每次变化的业务数据应当分开，避免把整段请求拼成难以维护的字符串。

| 参数 | 本文取值 | 责任 |
|------|----------|------|
| `model` | `OPENAI_MODEL`，默认 `gpt-6-luna` | 选择当前 API 项目可用的文本模型 |
| `instructions` | 一句摘要任务与事实边界 | 定义模型应完成的任务，不承载客户数据 |
| `input` | 当前客户反馈 | 提供本次请求需要处理的业务内容 |

`instructions` 是发送给模型的指令，不是确定性校验规则。即使已经要求“不补充输入中没有的事实”，应用仍不能跳过输出核对。

### 3. 响应结构

Responses API 返回 `Response` 对象。本文读取六个字段，其中 `output_text` 是 Python SDK 为文本结果提供的便捷属性。

| 字段 | 作用 | 本文判据 |
|------|------|----------|
| `id` | 标识本次响应 | 写入诊断信息，便于定位具体请求 |
| `status` | 表示执行状态 | 必须为 `completed` |
| `model` | 记录实际响应模型 | 用于核对服务端返回值，不只依赖本地配置 |
| `output_text` | 聚合文本输出 | 去除首尾空白后必须非空 |
| `usage.input_tokens` | 记录输入 Token | 用于观察输入占用 |
| `usage.output_tokens` / `total_tokens` | 记录输出与总用量 | 用于观察本次调用成本和规模 |

::: info 本文验证基线
示例已在 Python 3.12.14、OpenAI Python SDK 3.19.2 和 `gpt-6-luna` 下完成真实调用。更换 SDK 或模型后，应重新核对请求参数、响应字段和实际输出。
:::

OpenAI 当前建议新项目使用 Responses API。官方迁移文档同时说明，Responses API 返回的是带有状态与输出项的响应对象，不是一段可以直接当作业务结果的裸文本。

## 二、环境配置

示例从空目录开始，只依赖 Python 3.12、OpenAI Python SDK、有效的 API Key 和一个当前项目可用的文本模型。

### 1. Python 环境

虚拟环境隔离示例依赖，避免系统 Python 中的其他包影响验证结果。先创建 `ai-response-demo` 目录，再创建并激活 `.venv`。

::: code-group

```powershell [PowerShell]
mkdir ai-response-demo
cd ai-response-demo
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
```

```bash [Bash]
mkdir ai-response-demo && cd ai-response-demo
python3.12 -m venv .venv
source .venv/bin/activate
```

:::

激活后检查解释器版本：

```bash
python --version
```

预期主版本为 Python 3.12，例如：

```text
Python 3.12.14
```

如果版本不是 3.12，说明终端没有使用刚创建的虚拟环境，或创建环境时选用了其他 Python 解释器。

### 2. SDK 安装

安装本文真实验证过的 SDK 精确版本，并立即查询实际安装结果。精确版本让代码、字段和运行证据处于同一基线。

::: code-group

```powershell [PowerShell]
python -m pip install "openai==3.19.2"
python -c "import openai; print(openai.__version__)"
```

```bash [Bash]
python -m pip install "openai==3.19.2"
python -c "import openai; print(openai.__version__)"
```

:::

版本查询应输出：

```text
3.19.2
```

安装命令成功但版本不同，通常表示约束没有生效或终端使用了另一个解释器。此时先检查 `python -m pip --version` 显示的 Python 路径，再重新安装。

### 3. API 凭据

::: danger API Key 不得进入源码和版本库
只在当前终端会话中设置真实 Key。不要把 Key 写入 Python 文件、Markdown、截图或 Git 历史；一旦泄露，应立即在 OpenAI 平台撤销并重新创建。
:::

`OPENAI_API_KEY` 是必需变量，`OPENAI_MODEL` 是可选覆盖项。示例值必须替换为自己的凭据。

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

检查变量是否存在时只输出判断结果，不打印 Key：

::: code-group

```powershell [PowerShell]
if ($env:OPENAI_API_KEY) { "OPENAI_API_KEY 已设置" } else { "OPENAI_API_KEY 未设置" }
```

```bash [Bash]
test -n "$OPENAI_API_KEY" && echo "OPENAI_API_KEY 已设置" || echo "OPENAI_API_KEY 未设置"
```

:::

变量必须设置在运行程序的同一终端进程中。新开终端后变量消失属于预期行为，不应通过把 Key 写入源码解决。

## 三、请求实现

在示例目录中新建 `response_demo.py`。下面是本文唯一的完整程序；后续小节展示的局部片段都来自这份代码。

::: details 查看 Responses API 调用完整代码

```python
# response_demo.py
from __future__ import annotations

import json
import os
import sys

from openai import APIConnectionError, APIStatusError, OpenAI


def require_environment(name: str) -> str:
    """读取必需的环境变量，并阻止程序在配置缺失时继续请求。

    Args:
        name: 环境变量名称，必须对应当前进程可见的非空字符串。

    Returns:
        去除首尾空白后的环境变量值。

    Raises:
        RuntimeError: 环境变量不存在或仅包含空白字符。
    """
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"缺少环境变量：{name}")
    return value


def main() -> int:
    """发送摘要请求，验证响应状态并输出可观察的调用结果。

    Returns:
        进程退出码；0 表示响应完成且文本、用量均有效，其他值表示失败类型。
    """
    try:
        api_key = require_environment("OPENAI_API_KEY")
    except RuntimeError as error:
        print(error, file=sys.stderr)
        return 2

    client = OpenAI(api_key=api_key)
    model = os.getenv("OPENAI_MODEL", "gpt-6-luna").strip() or "gpt-6-luna"
    feedback_text = "升级到 4.2.0 后，批量导出恢复正常，但首次打开报表仍需等待约 8 秒。"

    try:
        response = client.responses.create(
            model=model,
            instructions="将客户反馈压缩为一句中文摘要，不补充输入中没有的事实。",
            input=f"客户反馈：{feedback_text}",
        )
    except APIConnectionError as error:
        print(f"网络连接失败：{error}", file=sys.stderr)
        return 3
    except APIStatusError as error:
        request_id = error.request_id or "unknown"
        print(
            f"API 请求失败：status={error.status_code}, request_id={request_id}",
            file=sys.stderr,
        )
        return 4

    if response.status != "completed":
        print(f"响应未完成：id={response.id}, status={response.status}", file=sys.stderr)
        return 5

    output_text = response.output_text.strip()
    if not output_text:
        print(f"响应文本为空：id={response.id}", file=sys.stderr)
        return 6
    if response.usage is None:
        print(f"响应缺少用量信息：id={response.id}", file=sys.stderr)
        return 7

    result = {
        "response_id": response.id,
        "status": response.status,
        "model": response.model,
        "usage": {
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
            "total_tokens": response.usage.total_tokens,
        },
        "summary": output_text,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

:::

### 1. 客户端初始化

程序先读取必需的 `OPENAI_API_KEY`。`require_environment()` 会拒绝不存在或只包含空白字符的变量，使配置错误在发送网络请求之前暴露。

```python
api_key = require_environment("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)
model = os.getenv("OPENAI_MODEL", "gpt-6-luna").strip() or "gpt-6-luna"
```

客户端显式接收 `api_key`，模型名称则允许环境变量覆盖。这样可以在不修改源码的情况下更换当前项目可用模型，同时保留一个可复现的默认值。

### 2. 请求参数

客户反馈是每次变化的业务数据，任务要求则保持稳定。程序把反馈保存在 `feedback_text`，并在发送请求时直接提供 `instructions`。

```python
feedback_text = "升级到 4.2.0 后，批量导出恢复正常，但首次打开报表仍需等待约 8 秒。"
```

任务指令不随客户反馈变化，因此它不应拼接额外业务事实。下一小节展示的调用代码会把固定指令和当前反馈分别传入 API。

### 3. 请求发送

`responses.create()` 在默认同步调用方式下返回一个 `Response` 对象。程序必须保留整个对象，不能只保存文本，因为状态、模型、用量和响应 ID 都来自它。

```python
response = client.responses.create(
    model=model,
    instructions="将客户反馈压缩为一句中文摘要，不补充输入中没有的事实。",
    input=f"客户反馈：{feedback_text}",
)
```

`model` 决定调用哪个模型，`input` 只包含当前客户反馈。本文不设置流式或后台参数，因此程序在调用返回后继续执行响应验证。

### 4. 异常捕获

SDK 将“没有收到有效 HTTP 响应”和“API 返回错误状态”表示为不同异常。两者的诊断证据不同，不能合并为一句“调用失败”。

```python
except APIConnectionError as error:
    print(f"网络连接失败：{error}", file=sys.stderr)
    return 3
except APIStatusError as error:
    request_id = error.request_id or "unknown"
    print(
        f"API 请求失败：status={error.status_code}, request_id={request_id}",
        file=sys.stderr,
    )
    return 4
```

`APIConnectionError` 指向 DNS、代理、TLS 或网络可达性；`APIStatusError` 提供 HTTP 状态码，并尽可能保留 `request_id`。程序使用不同退出码，便于脚本或运行平台区分失败来源。

## 四、响应验证

请求返回后，程序按照状态、文本、用量的顺序验证 Response。任何一步不满足条件，都应停止正常输出并返回非零退出码。

### 1. 完成状态

`status` 是响应生命周期的直接证据。本文只接受 `completed`，其他状态不能沿用正常结果处理。

```python
if response.status != "completed":
    print(f"响应未完成：id={response.id}, status={response.status}", file=sys.stderr)
    return 5
```

错误信息同时输出 `id` 和实际 `status`。相比只打印“响应失败”，这两个字段能够说明是哪一次响应、停在什么状态。

### 2. 文本输出

状态完成后仍需验证文本。`strip()` 去除首尾空白，避免把只包含空格或换行的内容误判为有效摘要。

```python
output_text = response.output_text.strip()
if not output_text:
    print(f"响应文本为空：id={response.id}", file=sys.stderr)
    return 6
```

::: tip `output_text` 是文本便捷属性
一个 Response 可以包含多个输出项和不同内容类型。Python SDK 的 `output_text` 会聚合文本输出，适合本文的单次文本请求；处理工具调用、结构化内容或多模态结果时，应读取完整 `output` 结构。
:::

### 3. Token 用量

`usage` 记录本次请求的输入、输出和总 Token。程序拒绝缺少用量信息的响应，并把三个计数写入最终 JSON。

```python
"usage": {
    "input_tokens": response.usage.input_tokens,
    "output_tokens": response.usage.output_tokens,
    "total_tokens": response.usage.total_tokens,
},
```

Token 用量可以帮助观察请求规模与成本，但不能证明摘要准确。不同模型、SDK 版本和服务端行为可能产生不同数值，不能把本文记录的数值当作固定基准。

### 4. 实际响应

运行程序后检查进程退出码。成功时 PowerShell 的 `$LASTEXITCODE` 与 Bash 的 `$?` 都应为 `0`。

::: code-group

```powershell [PowerShell]
python .\response_demo.py
$LASTEXITCODE
```

```bash [Bash]
python ./response_demo.py
echo $?
```

:::

下面是经过脱敏的一次真实运行结果。响应 ID 只保留类型前缀；摘要、模型和用量来自同一次请求。

::: details 查看实际响应摘要

```json
{
  "response_id": "resp_***",
  "status": "completed",
  "model": "gpt-6-luna",
  "usage": {
    "input_tokens": 60,
    "output_tokens": 34,
    "total_tokens": 94
  },
  "summary": "升级至 4.2.0 后，批量导出已恢复正常，但首次打开报表仍需等待约 8 秒。"
}
```

:::

这次运行同时满足四项最小判据：状态为 `completed`、摘要非空、`usage` 存在、退出码为 `0`。它证明调用链可以工作，但还没有验证摘要是否符合具体业务规则。

## 五、错误诊断

失败时先依据异常类型、HTTP 状态和程序退出码定位边界，再决定处理方式。没有证据时直接修改 Prompt 或切换模型，会掩盖真正的配置或网络问题。

| 错误类别 | 程序证据 | 退出码 |
|----------|----------|-------:|
| 配置错误 | 缺少 `OPENAI_API_KEY` | `2` |
| 连接错误 | `APIConnectionError` | `3` |
| API 状态错误 | `APIStatusError`、HTTP 状态、`request_id` | `4` |
| 响应契约错误 | 未完成、空文本或缺少用量 | `5`～`7` |

### 1. 配置错误

程序在创建客户端前检查 Key，因此缺少凭据不会产生网络请求。该失败分支已经使用未设置 Key 的独立进程真实验证。

```text
缺少环境变量：OPENAI_API_KEY
```

进程退出码为 `2`。如果已经设置变量但仍出现此错误，应确认设置变量与运行程序使用的是同一个终端，而不是把 Key 打印出来排查。

虚拟环境未激活属于另一类本地配置错误。出现 `ModuleNotFoundError: No module named 'openai'` 时，先核对 `python -m pip --version` 与 `python --version` 的路径，再重新安装依赖。

### 2. 连接错误

`APIConnectionError` 表示 SDK 没有收到可作为 API 状态处理的响应。常见边界包括 DNS、代理、TLS 证书和出口网络。

建议按证据顺序检查：

1. 确认当前主机能够访问 API 服务，而不是只检查其他网站。
2. 核对当前终端使用的代理变量和企业网络策略。
3. 保存 SDK 输出的底层连接错误，再判断是 DNS、连接超时还是 TLS 失败。

本文只记录连接错误并返回退出码 `3`，不自动重试。重试次数、退避和请求预算属于模型接入模块的调用可靠性范围。

### 3. API 状态错误

API 已返回 HTTP 响应时，SDK 抛出 `APIStatusError`。程序输出状态码和 `request_id`，但不输出客户反馈或 API Key。

| HTTP 状态 | 优先检查 | 处理方向 |
|-----------|----------|----------|
| `401` | Key 是否有效 | 更换已撤销或错误的凭据 |
| `403` | 项目和资源权限 | 核对 Key 所属项目及访问权限 |
| `404` | 模型名称与资源可见性 | 核对 `OPENAI_MODEL` 和当前项目可用模型 |
| `429` | 额度和速率限制 | 查看项目额度、限流信息与请求频率 |

这些状态是诊断方向，不是本文主动制造的运行结果。实际处理时还应结合错误响应和项目控制台信息，不能只依据状态码猜测。

### 4. 响应契约错误

HTTP 请求成功后，Response 仍可能不满足本文定义的应用契约。程序为每种情况保留不同证据：

| 条件 | 输出证据 | 退出码 |
|------|----------|-------:|
| `status != "completed"` | 响应 ID 与实际状态 | `5` |
| `output_text` 为空 | 响应 ID | `6` |
| `usage` 缺失 | 响应 ID | `7` |

契约错误不能通过“有文字就继续”的方式忽略。应保存响应 ID，检查完整 Response 结构，并根据具体 API 行为决定是否重新请求、转人工处理或终止业务流程。

::: warning 本文不实现自动重试
连接失败、限流和服务端错误是否可以重试，取决于幂等性、请求预算和退避策略。本文只保留失败证据，不把重复请求隐藏在基础示例中。
:::

## 六、调用边界

Responses API 调用只是 AI 应用中的一个外部能力边界。程序必须区分接口完成、内容有效和业务可用三个层次。

### 1. 成功条件

本文程序只有同时满足以下条件才返回 `0`：

1. SDK 没有抛出连接异常或 API 状态异常。
2. `response.status` 等于 `completed`。
3. `response.output_text.strip()` 得到非空文本。
4. `response.usage` 存在并可以读取用量。

任一条件失败都会产生非零退出码。退出码为自动化调用提供稳定判断，错误文字则为人工排查提供上下文。

### 2. 业务校验

接口层完成只证明模型服务返回了符合最小结构的结果。摘要是否可以写入业务系统，还需要结合具体规则判断。

| 校验层次 | 本文是否覆盖 | 示例 |
|----------|--------------|------|
| 传输与 API 状态 | 是 | 连接异常、HTTP 状态、`completed` |
| 输出存在性 | 是 | 非空文本、`usage` 存在 |
| 事实一致性 | 否 | 摘要中的版本、功能和等待时间是否来自输入 |
| 格式约束 | 否 | 字数、字段结构、禁用内容是否满足业务要求 |
| 业务动作 | 否 | 是否允许自动保存、展示或触发后续流程 |

即使状态为 `completed`，应用也不应把模型输出直接写入高风险业务记录。需要确定性保证的字段，应由规则、数据源或人工审核完成。

### 3. 未覆盖能力

本文没有覆盖以下能力：

- 流式事件、请求取消、超时和后台任务；
- 多轮对话与服务端状态管理；
- JSON Schema 结构化输出；
- 工具调用与外部动作执行；
- 自动重试、限流、并发和提供商适配；
- 生产日志脱敏、密钥管理和业务质量评测。

这些能力会改变请求生命周期、响应结构或生产责任，因此不能直接叠加到本文的最小调用程序中。

## 七、参考资料

- [OpenAI API 快速开始](https://developers.openai.com/api/docs/quickstart)
- [OpenAI SDKs](https://developers.openai.com/api/docs/libraries)
- [迁移到 Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses)
- [OpenAI 生产实践](https://developers.openai.com/api/docs/guides/production-best-practices)
