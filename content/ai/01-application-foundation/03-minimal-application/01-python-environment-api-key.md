---
title: "Python 环境与 API Key"
tags:
  - Python
  - OpenAI API
  - API Key
excerpt: "从空目录创建 Python 虚拟环境，安装并核对 OpenAI SDK，安全配置 API Key，并通过检查程序定位解释器、依赖和凭据问题。"
date: 2026-09-28
---

# Python 环境与 API Key

调用模型 API 之前，需要先建立可重复的 Python 运行环境，并让凭据只在运行进程中可用。环境配置的目标不是“命令没有报错”，而是能够证明解释器、SDK 和 API Key 都来自预期位置。

本文使用 Python 3.12 和 OpenAI Python SDK 3.19.2 建立最小环境。示例不发送 API 请求，只验证后续调用所需的本地条件。

::: danger API Key 属于敏感凭据
不要把真实 Key 写进 Python 文件、Markdown、命令历史截图或 Git 仓库。发现泄露后应立即在平台撤销并创建新 Key，删除文件不能消除已经进入 Git 历史或日志的凭据。
:::

## 一、环境基线

### 1. 软件版本

本文使用以下经过验证的基线：

| 组件 | 验证版本 | 作用 |
|------|----------|------|
| Python | `3.12.14` | 运行示例程序和虚拟环境 |
| OpenAI Python SDK | `3.19.2` | 调用 Responses API |
| 操作终端 | PowerShell 或 Bash | 创建环境、设置进程变量 |

Python 3.12 是本文的复现基线，不表示其他受支持版本不能运行。更换 Python 或 SDK 版本后，应重新执行本文检查和后续 API 示例。

### 2. 目录边界

从空目录 `ai-python-env` 开始。虚拟环境、检查程序和后续示例都位于该目录中，但 `.venv` 不应提交到版本库。

```text
ai-python-env/
├── .venv/
└── environment_check.py
```

虚拟环境只隔离 Python 解释器和依赖，不负责保护 API Key。凭据仍需通过环境变量或专用密钥管理系统提供。

### 3. 凭据边界

本文使用 `OPENAI_API_KEY` 环境变量。SDK 在创建客户端时读取该变量，源代码无需出现真实凭据。

| 环境 | 推荐方式 |
|------|----------|
| 本地临时验证 | 当前终端会话的环境变量 |
| CI/CD | 平台 Secret 注入 |
| 生产运行时 | 云密钥服务或受控 Secret 管理器 |
| 浏览器前端 | 不放置长期 API Key，由后端代理调用 |

环境变量本身不是完整的生产密钥管理方案。生产环境还需要访问控制、轮换、审计和泄露响应。

## 二、虚拟环境

### 1. 版本确认

创建环境前先确认可用的 Python 3.12 解释器。

::: code-group

```powershell [PowerShell]
py -3.12 --version
```

```bash [Bash]
python3.12 --version
```

:::

预期输出的主次版本为 `3.12`，例如：

```text
Python 3.12.14
```

命令不存在时，应先安装 Python 3.12 或使用系统中明确可用的 Python 版本，再记录实际基线。不要在未知解释器上继续安装依赖。

### 2. 环境创建

下面的命令创建项目目录和 `.venv`。Windows 与类 Unix 系统的激活脚本不同。

::: code-group

```powershell [PowerShell]
mkdir ai-python-env
cd ai-python-env
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
```

```bash [Bash]
mkdir ai-python-env && cd ai-python-env
python3.12 -m venv .venv
source .venv/bin/activate
```

:::

命令提示符是否显示 `(.venv)` 只能作为视觉提示。真正的证据是 `python` 和 `pip` 指向该目录中的解释器。

### 3. 路径核对

激活后查询解释器和 pip 的实际位置。

::: code-group

```powershell [PowerShell]
Get-Command python | Select-Object -ExpandProperty Source
python -m pip --version
```

```bash [Bash]
command -v python
python -m pip --version
```

:::

两条输出都应包含当前 `ai-python-env/.venv` 路径。若 pip 指向系统 Python，后续即使安装成功，当前程序仍可能无法导入 SDK。

## 三、SDK 安装

### 1. 精确安装

使用当前虚拟环境的解释器安装本文验证版本：

```bash
python -m pip install "openai==3.19.2"
```

`python -m pip` 明确使用当前 `python` 对应的 pip，比直接执行 `pip` 更容易避免解释器错位。

### 2. 版本核对

安装完成后直接从 Python 导入包并输出版本：

```bash
python -c "import openai; print(openai.__version__)"
```

预期输出为：

```text
3.19.2
```

只看安装日志不足以证明程序将使用这个版本；版本查询必须由后续实际运行的同一个 `python` 执行。

### 3. 依赖记录

为了在其他环境复现，可以新建 `requirements.txt`：

```text
openai==3.19.2
```

然后使用以下命令安装：

```bash
python -m pip install -r requirements.txt
```

固定版本可以保持教学示例一致。生产项目还应结合依赖更新、漏洞修复和回归测试制定升级策略，不能永久停留在某个版本。

## 四、凭据配置

### 1. 会话变量

把 Key 设置在将要运行程序的同一个终端会话中。下面的占位值必须替换为自己的真实凭据。

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

`OPENAI_MODEL` 是本文示例使用的可选模型变量；`OPENAI_API_KEY` 是 SDK 创建客户端所需的凭据变量。

### 2. 安全检查

检查 Key 是否存在时只输出布尔结果，不打印实际值。

::: code-group

```powershell [PowerShell]
[bool]$env:OPENAI_API_KEY
```

```bash [Bash]
test -n "$OPENAI_API_KEY" && echo true || echo false
```

:::

预期结果为 `True` 或 `true`。如果结果为假，先检查变量是否设置在当前终端，不要把 Key 写进程序作为兜底。

### 3. 生产注入

生产环境应由部署平台把 Secret 注入运行进程，应用账号只获得读取所需密钥的最小权限。

推荐控制包括：

- 为开发、测试和生产使用不同项目或凭据；
- 限制 Key 的权限与可用范围；
- 定期轮换并保留撤销流程；
- 在日志、错误和监控中执行脱敏；
- 记录访问审计，不记录凭据本身。

前端代码会分发到用户设备，不能安全保存长期服务端 API Key。浏览器应用应调用自己的后端，由后端完成授权和模型请求。

## 五、环境检查

### 1. 检查程序

在 `ai-python-env` 目录中新建 `environment_check.py`。程序输出 Python、SDK 和 Key 配置状态，但不会输出 Key 内容，也不会发送网络请求。

::: details 查看环境检查完整代码

```python
# environment_check.py
from __future__ import annotations

import importlib.metadata
import os
import sys


def main() -> int:
    """检查 Python、OpenAI SDK 和 API Key 是否满足示例前置条件。"""
    python_version = ".".join(map(str, sys.version_info[:3]))
    sdk_version = importlib.metadata.version("openai")
    has_api_key = bool(os.getenv("OPENAI_API_KEY", "").strip())

    print(f"Python: {python_version}")
    print(f"OpenAI SDK: {sdk_version}")
    print(f"OPENAI_API_KEY configured: {has_api_key}")
    return 0 if has_api_key else 2


if __name__ == "__main__":
    raise SystemExit(main())
```

:::

### 2. 正常结果

在已经激活环境并设置 Key 的终端运行：

```bash
python environment_check.py
```

本文实际验证结果为：

```text
Python: 3.12.14
OpenAI SDK: 3.19.2
OPENAI_API_KEY configured: True
```

进程退出码为 `0`。该结果只证明本地环境满足调用前提，不证明 Key 权限、网络或模型可用性。

### 3. 缺少凭据

在没有 `OPENAI_API_KEY` 的独立进程中运行，程序输出：

```text
Python: 3.12.14
OpenAI SDK: 3.19.2
OPENAI_API_KEY configured: False
```

进程退出码为 `2`。非零退出码可以让脚本或 CI 在发送请求前阻止错误配置继续运行。

## 六、故障诊断

### 1. 解释器错误

出现版本不符或包安装到错误位置时，依次执行：

1. 查询 `python --version`。
2. 查询 Python 命令的实际路径。
3. 查询 `python -m pip --version`。
4. 确认三者都指向当前 `.venv`。
5. 在正确环境中重新安装依赖。

不要通过全局重复安装同一个包掩盖路径问题。

### 2. 模块缺失

出现下面错误表示当前解释器找不到 OpenAI SDK：

```text
ModuleNotFoundError: No module named 'openai'
```

先确认虚拟环境已经激活，再使用 `python -m pip install "openai==3.19.2"`。如果安装日志显示成功但仍无法导入，通常是安装和运行使用了不同解释器。

### 3. 凭据缺失

SDK 创建客户端时如果找不到 API Key，会产生配置错误。优先检查：

| 检查项 | 正确状态 |
|--------|----------|
| 变量名称 | `OPENAI_API_KEY`，拼写与大小写正确 |
| 进程范围 | 设置变量和运行程序使用同一终端 |
| 内容 | 非空，没有只包含空白字符 |
| 日志 | 不输出真实 Key |

Key 已设置但 API 返回 `401` 时，问题已经从“变量不存在”转为“凭据无效或不可用”。应撤销错误 Key、创建有效凭据并检查项目归属，而不是打印 Key 比对。

## 七、参考资料

- [OpenAI Python SDK](https://github.com/openai/openai-python)
- [OpenAI SDKs](https://developers.openai.com/api/docs/libraries)
- [OpenAI API 快速开始](https://developers.openai.com/api/docs/quickstart)
- [OpenAI 生产实践](https://developers.openai.com/api/docs/guides/production-best-practices)
