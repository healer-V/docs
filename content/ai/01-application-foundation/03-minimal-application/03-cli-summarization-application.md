---
title: "CLI 摘要应用"
tags:
  - AI 应用开发
  - Python
  - CLI
excerpt: "实现一个可从命令行接收客户反馈的摘要应用，覆盖输入校验、Responses API 调用、退出码设计、错误处理和自动化测试。"
date: 2026-09-28
---

# CLI 摘要应用

一个可用的最小 AI 应用不只是“一段能够调用模型的代码”。它还需要明确输入边界、输出契约、失败分类和进程退出码，使人工用户与自动化脚本都能判断执行结果。

本文从空目录实现 `feedback_summary.py`。程序接收一条客户反馈，调用 Responses API 生成一句中文摘要，并在输入、配置、连接、API 或响应异常时返回不同的非零退出码。

::: tip 最小应用的完成条件
正常请求必须输出非空摘要并返回 `0`；错误必须写入标准错误流并返回稳定的非零退出码。终端中“出现了一段文字”不是充分的成功判据。
:::

## 一、应用契约

### 1. 输入契约

程序通过位置参数接收一条客户反馈。输入在发送到 API 前必须满足：

- 去除首尾空白后不为空；
- 长度不超过 `2,000` 个字符；
- 作为数据传入请求，不拼接额外业务事实；
- 不在错误日志中完整回显。

字符上限是应用边界，用于阻止明显异常输入。模型上下文仍应使用 Token 预算单独管理。

### 2. 输出契约

正常结果是一句非空中文摘要。模型输出必须经过两项基础校验：

1. `response.status` 等于 `completed`。
2. `response.output_text.strip()` 非空。

这两项只证明响应结构可用。摘要中的版本、时间和状态是否正确，仍应由事实校验和业务流程负责。

### 3. 退出码

程序为每类失败分配稳定退出码，调用方无需解析中文错误文字即可判断结果。

| 退出码 | 含义 | 典型证据 |
|-------:|------|----------|
| `0` | 成功 | 输出非空摘要 |
| `2` | 输入错误 | 空输入或超过字符上限 |
| `3` | 客户端配置错误 | 缺少 API Key |
| `4` | 网络连接错误 | DNS、代理、TLS 或超时 |
| `5` | API 状态错误 | HTTP 状态与请求 ID |
| `6` | 响应契约错误 | 未完成或空文本 |

退出码属于程序对调用方的接口。修改含义时需要同步脚本、测试和运维规则。

## 二、项目准备

### 1. 文件结构

新建空目录 `feedback-summary-cli`，最终包含程序、测试和依赖文件：

```text
feedback-summary-cli/
├── .venv/
├── feedback_summary.py
├── requirements.txt
└── test_feedback_summary.py
```

`.venv` 是本地生成目录，不提交到版本库。其余三个文件都在本文给出，不依赖文档仓库中的其他代码。

### 2. Python 环境

创建并激活 Python 3.12 虚拟环境。

::: code-group

```powershell [PowerShell]
mkdir feedback-summary-cli
cd feedback-summary-cli
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
```

```bash [Bash]
mkdir feedback-summary-cli && cd feedback-summary-cli
python3.12 -m venv .venv
source .venv/bin/activate
```

:::

在 `requirements.txt` 中固定本文验证版本：

```text
openai==3.19.2
```

安装并核对版本：

```bash
python -m pip install -r requirements.txt
python -c "import openai; print(openai.__version__)"
```

### 3. 凭据变量

只在当前终端会话中设置 Key。模型变量可选，未设置时程序使用 `gpt-6-luna`。

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

::: danger 不在命令参数中传递 API Key
命令参数可能被进程列表和终端历史记录。Key 应由环境变量或受控 Secret 系统提供，程序也不得把它写入错误信息。
:::

## 三、程序实现

### 1. 完整代码

在项目根目录新建 `feedback_summary.py`。代码使用依赖注入保留测试边界：生产运行使用 `OpenAI` 创建客户端，测试可以替换为不访问网络的模拟客户端。

::: details 查看 CLI 摘要应用完整代码

```python
# feedback_summary.py
from __future__ import annotations

import argparse
import os
import sys
from collections.abc import Callable, Sequence
from typing import Any, Protocol

from openai import APIConnectionError, APIStatusError, OpenAI, OpenAIError

DEFAULT_MODEL = "gpt-6-luna"
MAX_INPUT_CHARS = 2_000


class ResponseClient(Protocol):
    """描述摘要函数实际依赖的 Responses 客户端接口。"""

    responses: Any


def validate_feedback(feedback_text: str) -> str:
    """校验并规范化客户反馈文本。

    Args:
        feedback_text: 命令行传入的原始反馈，允许首尾包含空白字符。

    Returns:
        去除首尾空白后的反馈文本。

    Raises:
        ValueError: 反馈为空或超过应用定义的最大字符数。
    """
    normalized = feedback_text.strip()
    if not normalized:
        raise ValueError("客户反馈不能为空")
    if len(normalized) > MAX_INPUT_CHARS:
        raise ValueError(f"客户反馈不能超过 {MAX_INPUT_CHARS} 个字符")
    return normalized


def summarize_feedback(
    client: ResponseClient,
    model: str,
    feedback_text: str,
) -> str:
    """调用 Responses API 并验证摘要响应。

    Args:
        client: 提供 responses.create 方法的已配置客户端。
        model: 当前 API 项目可调用的文本模型标识。
        feedback_text: 已通过本地校验的非空客户反馈。

    Returns:
        去除首尾空白后的单句摘要。

    Raises:
        RuntimeError: 响应未完成或完成后没有文本。
    """
    response = client.responses.create(
        model=model,
        instructions="将客户反馈压缩为一句中文摘要，不补充输入中没有的事实。",
        input=f"客户反馈：{feedback_text}",
        max_output_tokens=120,
    )
    if response.status != "completed":
        raise RuntimeError(f"响应未完成：id={response.id}, status={response.status}")

    summary = response.output_text.strip()
    if not summary:
        raise RuntimeError(f"响应文本为空：id={response.id}")
    return summary


def build_parser() -> argparse.ArgumentParser:
    """创建客户反馈摘要命令行参数解析器。"""
    parser = argparse.ArgumentParser(description="把一条客户反馈压缩为一句中文摘要")
    parser.add_argument("feedback", help=f"客户反馈，最多 {MAX_INPUT_CHARS} 个字符")
    parser.add_argument(
        "--model",
        default=os.getenv("OPENAI_MODEL", DEFAULT_MODEL),
        help="文本模型，默认读取 OPENAI_MODEL",
    )
    return parser


def main(
    argv: Sequence[str] | None = None,
    client_factory: Callable[[], ResponseClient] = OpenAI,
) -> int:
    """执行输入校验、API 调用和错误分类。

    Args:
        argv: 待解析的命令行参数；None 表示读取当前进程参数。
        client_factory: 创建 Responses 客户端的工厂，测试时可替换为模拟客户端。

    Returns:
        进程退出码；0 表示成功，2～6 分别表示输入、配置、连接、API 或响应错误。
    """
    args = build_parser().parse_args(argv)
    try:
        feedback_text = validate_feedback(args.feedback)
    except ValueError as error:
        print(f"输入错误：{error}", file=sys.stderr)
        return 2

    try:
        client = client_factory()
    except OpenAIError as error:
        print(f"客户端配置错误：{error}", file=sys.stderr)
        return 3

    try:
        summary = summarize_feedback(client, args.model, feedback_text)
    except APIConnectionError as error:
        print(f"网络连接失败：{error}", file=sys.stderr)
        return 4
    except APIStatusError as error:
        request_id = error.request_id or "unknown"
        print(
            f"API 请求失败：status={error.status_code}, request_id={request_id}",
            file=sys.stderr,
        )
        return 5
    except RuntimeError as error:
        print(f"响应错误：{error}", file=sys.stderr)
        return 6

    print(summary)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

:::

### 2. 输入校验

`validate_feedback()` 在客户端创建前执行。空输入和超长输入不会消耗 API 请求，也不会被模型自行解释。

```python
normalized = feedback_text.strip()
if not normalized:
    raise ValueError("客户反馈不能为空")
if len(normalized) > MAX_INPUT_CHARS:
    raise ValueError(f"客户反馈不能超过 {MAX_INPUT_CHARS} 个字符")
```

字符限制属于应用策略。若允许更长输入，还需结合当前模型进行 Token 计数和输出预算检查。

### 3. API 调用

`summarize_feedback()` 只承担模型请求和响应契约校验。固定指令与业务输入分开传递，输出上限显式设置为 `120` Token。

```python
response = client.responses.create(
    model=model,
    instructions="将客户反馈压缩为一句中文摘要，不补充输入中没有的事实。",
    input=f"客户反馈：{feedback_text}",
    max_output_tokens=120,
)
```

函数依赖的是 `ResponseClient` 协议，而不是在函数内部创建客户端，因此测试可以提供相同接口的模拟对象。

### 4. 错误分类

`main()` 把错误转换为退出码：本地输入和配置错误在调用前处理，连接与 HTTP 错误依据 SDK 异常处理，响应状态和文本错误由应用契约处理。

错误信息写入 `stderr`，正常摘要写入 `stdout`。调用方可以分别重定向两条输出流，避免把错误提示误当作摘要。

## 四、正常执行

### 1. 命令参数

先查看程序帮助，确认参数入口：

```bash
python feedback_summary.py --help
```

`feedback` 是必填位置参数，`--model` 可以临时覆盖环境变量中的模型。

### 2. 实际调用

使用经过验证的客户反馈运行：

::: code-group

```powershell [PowerShell]
python .\feedback_summary.py "升级到 4.2.0 后，批量导出恢复正常，但首次打开报表仍需等待约 8 秒。"
$LASTEXITCODE
```

```bash [Bash]
python ./feedback_summary.py "升级到 4.2.0 后，批量导出恢复正常，但首次打开报表仍需等待约 8 秒。"
echo $?
```

:::

### 3. 实际结果

本文在 Python 3.12.14、OpenAI Python SDK 3.19.2 和 `gpt-6-luna` 下真实运行，输出为：

```text
升级至 4.2.0 后，批量导出已恢复正常，但首次打开报表仍需等待约 8 秒。
```

进程退出码为 `0`。结果保留了版本、批量导出状态和等待时间，但生产应用仍应执行事实与业务校验。

## 五、失败处理

### 1. 空输入

传入只包含空格的反馈：

```bash
python feedback_summary.py "   "
```

程序在创建客户端前输出：

```text
输入错误：客户反馈不能为空
```

退出码为 `2`，并且不会发送 API 请求。

### 2. 配置与连接

缺少 `OPENAI_API_KEY` 时，客户端创建失败并返回 `3`。这类错误应通过设置当前进程变量解决，不能把 Key 写进源代码。

`APIConnectionError` 返回 `4`，表示客户端没有获得可作为 API 状态处理的响应。排查重点是 DNS、代理、TLS、出口网络和超时，而不是 Prompt 内容。

### 3. API 状态

API 返回错误 HTTP 状态时，程序返回 `5`，并输出状态码和 `request_id`。

| 状态 | 优先检查 |
|------|----------|
| `401` | Key 是否有效、是否已撤销 |
| `403` | 项目和资源权限 |
| `404` | 模型名称和项目可见性 |
| `429` | 额度、限流和请求频率 |

状态码只是定位入口，最终判断还需要结合错误体、请求 ID 和项目控制台信息。

### 4. 响应错误

请求完成传输后仍可能不满足应用契约。`status` 不是 `completed` 或文本为空时，程序返回 `6`。

::: warning 不把空输出当作正常摘要
程序不能因为 HTTP 请求成功就返回 `0`。响应状态和文本都通过校验后，结果才进入正常输出流。
:::

## 六、自动化验证

### 1. 测试边界

自动化测试不应调用真实 API。本文用模拟客户端覆盖两个关键分支：

1. 空输入在客户端创建前失败，退出码为 `2`。
2. 状态完成但文本为空，退出码为 `6`。

真实 API 连通性已经通过正常执行单独验证，两类验证承担不同责任。

### 2. 测试代码

在项目根目录新建 `test_feedback_summary.py`：

::: details 查看 CLI 摘要应用测试代码

```python
# test_feedback_summary.py
from __future__ import annotations

import unittest
from types import SimpleNamespace
from typing import Any

from feedback_summary import main


def create_empty_response(**_: Any) -> SimpleNamespace:
    """模拟状态完成但文本为空的 Responses API 结果。"""
    return SimpleNamespace(id="resp_empty", status="completed", output_text="   ")


def empty_client_factory() -> SimpleNamespace:
    """创建只返回空文本响应的测试客户端。"""
    return SimpleNamespace(responses=SimpleNamespace(create=create_empty_response))


def forbidden_client_factory() -> SimpleNamespace:
    """在输入校验未阻止客户端创建时立即暴露测试失败。"""
    raise AssertionError("空输入不应创建 API 客户端")


class FeedbackSummaryTests(unittest.TestCase):
    """验证 CLI 的本地输入和响应契约分支。"""

    def test_blank_input_returns_two(self) -> None:
        """空白输入应在请求前返回退出码 2。"""
        exit_code = main(["   "], client_factory=forbidden_client_factory)
        self.assertEqual(exit_code, 2)

    def test_empty_output_returns_six(self) -> None:
        """完成但无文本的响应应返回退出码 6。"""
        exit_code = main(["客户反馈"], client_factory=empty_client_factory)
        self.assertEqual(exit_code, 6)


if __name__ == "__main__":
    unittest.main()
```

:::

### 3. 测试结果

先执行语法编译，再运行单元测试：

```bash
python -m py_compile feedback_summary.py test_feedback_summary.py
python -m unittest -v test_feedback_summary.py
```

本文实际结果为：

```text
Ran 2 tests in 0.002s

OK
```

语法编译和两项测试均通过。测试证明错误分支不依赖真实网络，同时不会把无效响应误判为成功。

## 七、参考资料

- [OpenAI API 快速开始](https://developers.openai.com/api/docs/quickstart)
- [OpenAI SDKs](https://developers.openai.com/api/docs/libraries)
- [Responses API 参考](https://developers.openai.com/api/reference/resources/responses/methods/create)
- [OpenAI Python SDK 错误处理](https://github.com/openai/openai-python#error-handling)
