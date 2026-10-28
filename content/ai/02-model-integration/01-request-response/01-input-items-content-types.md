---
title: "输入项与内容类型"
tags:
  - OpenAI API
  - Responses API
  - Python
excerpt: "解释 Responses API 的字符串输入、消息项和内容部件，给出文本、图像与文件类型的选择边界，并通过三种真实请求形状验证输入契约。"
date: 2026-09-28
---

# 输入项与内容类型

Responses API 的 `input` 既可以接收字符串，也可以接收由多个输入项组成的数组。数组中的消息项还可以继续拆成多个内容部件，使文本、图像和文件进入同一次请求。**输入结构应由数据类型和组合需求决定，而不是把所有内容都拼成一段字符串。**

本文使用虚构工单 `CASE-1042` 对比三种文本请求形状。图像和文件只说明接口边界；它们的上传、格式限制和 Token 成本由“多模态接口”章节展开。

::: tip 输入结构的最小判断
只有一段普通文本时使用字符串；需要角色或多轮消息时使用输入项数组；同一条消息需要组合文本、图像或文件时，再把 `content` 展开为内容部件数组。
:::

## 一、输入对象

### 1. 字符串简写

字符串是单条用户文本的简写形式。它适合一次性摘要、分类或改写等不需要表达角色和媒体组合的请求。

```python
response = client.responses.create(
    model=model,
    input="工单 CASE-1042：导出任务一直停在处理中。",
)
```

SDK 会把这段文本作为当前请求的用户输入。简写减少了结构噪声，但不能为同一请求表达多条消息，也不能在消息内部组合不同内容类型。

### 2. 输入项数组

输入项（Input Item）是 Responses API 的基本输入单位。消息只是其中一种 Item；后续还可能出现工具结果等其他类型，因此应用不应把 Item 永久等同于聊天消息。

```python
input_items = [
    {
        "role": "user",
        "content": "工单 CASE-1042：导出任务一直停在处理中。",
    }
]
```

消息项至少表达角色和内容。数组顺序就是模型接收上下文的顺序，不能在序列化后随意排序。

### 3. 内容部件

当一条消息同时包含多个输入对象时，`content` 从字符串变为内容部件数组。每个部件用 `type` 声明自己的解释方式。

```python
"content": [
    {"type": "input_text", "text": "工单编号：CASE-1042"},
    {"type": "input_text", "text": "客户反馈：导出任务一直停在处理中。"},
]
```

内容部件属于消息项，消息项又属于 `input` 数组。三层结构分别解决“请求包含哪些项”“这一项由谁提供”“这一条消息包含什么数据”。

## 二、请求形状

### 1. 单文本输入

单文本输入最紧凑，适用于没有角色差异、附件或历史消息的请求。

```json
{
  "input": "工单 CASE-1042：导出任务一直停在处理中。请用一句话概括问题。"
}
```

应用仍可通过顶层 `instructions` 提供任务约束。`instructions` 与 `input` 的信息职责属于 Prompt 设计，不在本文展开。

### 2. 消息项输入

消息项输入显式保留角色，适合需要组织多条消息或继续已有历史的调用。

```json
{
  "input": [
    {
      "role": "user",
      "content": "工单 CASE-1042：导出任务一直停在处理中。请用一句话概括问题。"
    }
  ]
}
```

这里只使用一条 `user` 消息。把普通业务数据标成更高权威的角色不会让数据更可信，反而会混淆指令边界。

### 3. 多部件输入

多部件输入保留同一消息中每段内容的类型。以下请求仍然只有一条用户消息，但包含两个文本部件。

::: details 查看多部件请求对象

```json
{
  "input": [
    {
      "type": "message",
      "role": "user",
      "content": [
        {
          "type": "input_text",
          "text": "工单编号：CASE-1042"
        },
        {
          "type": "input_text",
          "text": "客户反馈：导出任务一直停在处理中。请用一句话概括问题。"
        }
      ]
    }
  ]
}
```

:::

显式的 `type: "message"` 便于与工具结果等其他 Item 区分。只有消息内部需要组合内容部件时，才值得展开这一层结构。

## 三、内容类型

### 1. 文本部件

`input_text` 承载可直接解释的文本。字段名是 `text`，不能写成输出对象使用的 `output_text`。

文本部件适合：

- 把任务数据按业务字段分段；
- 与图像或文件共同构成一条消息；
- 在序列化前按类型执行长度、敏感信息或空值校验。

分成多个文本部件不会自动提高模型理解质量。若内容之间没有类型或校验差异，使用一个文本部件通常更清晰。

### 2. 图像部件

`input_image` 表示需要视觉能力处理的图像。图像可以来自受支持的 URL、文件标识或编码数据，具体字段取决于 API 当前定义。

::: warning 先核对模型视觉能力
输入对象结构合法不代表所选模型支持图像。应用必须同时核对模型能力、端点支持和图像格式；任一条件不满足都应在调用前或错误处理分支中明确失败。
:::

### 3. 文件部件

`input_file` 表示文件输入。官方 Responses API 支持文件标识、外部 URL 或编码数据等方式；PDF 在支持视觉的模型上可以同时提供文本和页面图像，非 PDF 文档通常只提取文本。

文件输入不等于检索系统。一次请求直接传入文件适合范围明确的小型资料；大规模知识库的切分、检索与权限控制属于 RAG 模块。

### 4. 类型组合

同一消息可以组合多个内容部件，但组合顺序仍有语义。常见结构是先提供材料，再给出针对材料的任务说明；应用还应为每类部件分别验证来源和大小。

| 任务数据 | 推荐形状 | 原因 |
|----------|----------|------|
| 一段短文本 | 字符串 | 结构最少，语义完整 |
| 多条带角色消息 | 输入项数组 | 保留消息顺序和角色 |
| 文本与图片 | 消息项 + 内容部件 | 明确区分文本和视觉输入 |
| 文本与文档 | 消息项 + 内容部件 | 文件由 `input_file` 独立承载 |
| 工具执行结果 | 专用输入项 | 需要保留调用标识，不应伪装成用户文本 |

## 四、类型边界

### 1. 输入与输出类型

输入和输出对象使用不同的类型名。名称相近不代表可以互换。

| 所在位置 | 合法示例 | 错误替换 | 后果 |
|----------|----------|----------|------|
| 输入消息内容 | `input_text` | `output_text` | 请求参数错误 |
| 响应消息内容 | `output_text` | `input_text` | 解析逻辑错误 |
| 工具调用结果 | `function_call_output` | 普通用户消息 | 丢失 `call_id` 关联 |

2026-09-28 的当前兼容端点实测把 `output_text` 放入输入后返回 `400 invalid_value`，错误定位到 `input[0].content[0]`。这证明字段类型应在客户端先校验，而不是等待模型解释错误结构。

### 2. 端点能力

官方资料定义的是 OpenAI API 契约；兼容网关可能增加、缺少或改变内容类型。当前端点的错误消息还列出了 `scoped_content` 和 `input_audio`，但这不能证明所有官方模型或其他网关都支持它们。

应用应把“文档声明支持”“SDK 可以序列化”“当前端点实测成功”记录为三类证据，不能用其中一类替代其余两类。

## 五、验证环境

### 1. 运行条件

本例在 2026-09-28 使用 Python 3.12.14、OpenAI Python SDK 3.19.2 和文本模型 `gpt-6-luna` 验证。凭据通过环境变量读取。

| 环境变量 | 必填 | 用途 |
|----------|------|------|
| `OPENAI_API_KEY` | 是 | API 身份认证 |
| `OPENAI_MODEL` | 否 | 覆盖默认模型 |
| `OPENAI_BASE_URL` | 兼容端点需要 | 指向经过授权的 API 端点 |

不要把密钥、真实客户内容或生产端点写入源码和运行输出。

### 2. 创建环境

::: code-group

```powershell [PowerShell]
mkdir input-items-demo
cd input-items-demo
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install openai==3.19.2
```

```bash [Bash]
mkdir input-items-demo
cd input-items-demo
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install openai==3.19.2
```

:::

## 六、完整实现

程序支持 `string`、`message`、`parts` 和 `invalid` 四种模式。前三种发送真实请求，最后一种保留服务端错误证据。

::: details 查看 input_items_demo.py 完整代码

```python
# input_items_demo.py
import argparse
import json
import os
from typing import Any

from openai import BadRequestError, OpenAI

ALLOWED_TYPES = {"input_text", "input_image", "input_file"}


def build_input(mode: str, case_id: str, feedback: str) -> str | list[dict[str, Any]]:
    """构造指定形状的输入。

    Args:
        mode: 输入形状，可选 string、message 或 parts。
        case_id: 虚构工单编号，不能为空。
        feedback: 虚构客户反馈，不能为空。

    Returns:
        可直接传给 input 参数的字符串或输入项数组。
    """
    if not case_id.strip() or not feedback.strip():
        raise ValueError("case_id 和 feedback 不能为空")
    text = f"工单 {case_id}：{feedback} 请用一句话概括问题。"
    if mode == "string":
        return text
    if mode == "message":
        return [{"role": "user", "content": text}]
    if mode == "parts":
        return [{
            "type": "message",
            "role": "user",
            "content": [
                {"type": "input_text", "text": f"工单编号：{case_id}"},
                {"type": "input_text", "text": f"客户反馈：{feedback}"},
            ],
        }]
    raise ValueError(f"未知输入模式：{mode}")


def validate_content_types(items: list[dict[str, Any]]) -> None:
    """校验本文示例允许的内容类型。

    Args:
        items: 待检查的输入项数组。

    Returns:
        无返回值；遇到错误类型时抛出 ValueError。
    """
    for item in items:
        content = item.get("content")
        if not isinstance(content, list):
            continue
        for part in content:
            if part.get("type") not in ALLOWED_TYPES:
                raise ValueError(f"输入内容类型不受支持：{part.get('type')}")


def main() -> None:
    """发送指定输入并输出脱敏结果。"""
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["string", "message", "parts", "invalid"])
    args = parser.parse_args()
    client = OpenAI()
    model = os.getenv("OPENAI_MODEL", "gpt-6-luna")
    if args.mode == "invalid":
        request_input = [{"role": "user", "content": [
            {"type": "output_text", "text": "错误的输入类型"}
        ]}]
    else:
        request_input = build_input(args.mode, "CASE-1042", "导出任务一直停在处理中。")
        if isinstance(request_input, list):
            validate_content_types(request_input)
    try:
        response = client.responses.create(
            model=model,
            instructions="只陈述输入中已有的事实。",
            input=request_input,
            max_output_tokens=256,
            store=False,
        )
        result = {
            "status": response.status,
            "output_types": [item.type for item in response.output],
            "output_text": response.output_text,
        }
    except BadRequestError as error:
        result = {"http_status": error.status_code, "error": str(error)}
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
```

:::

`build_input` 只负责选择请求形状，`validate_content_types` 负责本文允许类型的应用校验，API 调用只消费已经构造好的对象。媒体能力增加时，应更新独立能力配置，而不是在调用处散落条件分支。

### 1. 执行入口

依次运行三种合法输入和一个错误输入：

```powershell
python .\input_items_demo.py string
python .\input_items_demo.py message
python .\input_items_demo.py parts
python .\input_items_demo.py invalid
```

## 七、验证结果

### 1. 合法输入

三种请求在同一环境中均返回 `completed`，输出项类型都是 `message`。

| 输入模式 | 状态 | 实际输出 |
|----------|------|----------|
| `string` | `completed` | 工单 CASE-1042 的导出任务一直停在处理中。 |
| `message` | `completed` | 工单 CASE-1042 的导出任务一直停在处理中。 |
| `parts` | `completed` | 工单 CASE-1042 的客户反馈：导出任务一直停在处理中。 |

三个结果语义接近，证明这些形状都能表达当前文本任务；它不证明任意任务都应优先使用最复杂的结构。

### 2. 错误类型

把 `output_text` 放入输入内容后，端点返回以下关键信息：

```text
http_status=400
code=invalid_value
message=Invalid value: 'output_text'
param=input[0].content[0]
```

错误发生在模型生成之前。正确处理是把部件类型改为 `input_text`，而不是重试同一请求。

## 八、故障定位

### 1. 结构错误

| 现象 | 定位证据 | 处理方式 |
|------|----------|----------|
| `400 invalid_value` | 错误参数指向内容部件 | 核对 `type` 与字段名 |
| `400 missing_required_parameter` | 消息或部件缺少必填字段 | 对照当前 API Schema 补齐字段 |
| 本地 `ValueError` | 应用输入校验失败 | 修正业务对象，不发送 HTTP 请求 |
| 请求成功但模型忽略附件 | 响应正常，无媒体证据 | 核对模型能力和附件是否真正进入请求 |

结构错误通常不应重试。只有请求对象正确、错误又属于临时服务或限流问题时，才进入重试判断。

### 2. 解析边界

合法输入只说明 API 接受了请求。应用仍需检查 Response 状态、输出项类型和业务规则，不能看到 `output_text` 非空就认定结果可提交。完整响应判断由“响应对象与用量”负责。

## 九、适用范围

本文建立的是 Responses API 输入契约：

- 字符串、消息项与内容部件的结构关系已经实测；
- 文本、图像和文件的类型选择边界已经说明；
- 图像与文档的格式、大小和处理细节留在多模态章节；
- 指令层级、模板和上下文排序留在 Prompt 与上下文模块；
- 工具结果等非消息 Item 留在工具调用章节。

参考资料：

- [Create a model response](https://developers.openai.com/api/reference/resources/responses/methods/create)
- [Migrate to the Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses)
- [File inputs](https://developers.openai.com/api/docs/guides/file-inputs)
