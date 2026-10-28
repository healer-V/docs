---
title: "请求选项与兼容性"
tags:
  - OpenAI API
  - Responses API
  - 兼容性
excerpt: "按路由、输出、生命周期、存储和能力划分 Responses 请求选项，建立官方文档、SDK 签名与端点实测三层兼容性判断。"
date: 2026-09-28
---

# 请求选项与兼容性

Responses 请求不仅包含模型和输入，还可能配置输出上限、存储、元数据、结构化结果、工具、流式或后台执行。问题不在于记住全部字段，而在于确认**某个模型通过某个端点调用时，是否真正支持当前选项组合**。

本文以虚构工单摘要为例，构造一组保守请求，并用一个迁移错误证明“不在 Responses 契约中的字段”应在发出 HTTP 请求前失败。

::: tip 兼容性的三个条件
选项出现在官方 API 文档中、当前 SDK 可以表达它、目标端点与模型实测符合语义，三个条件同时满足后，应用才能把该选项登记为可用能力。
:::

## 一、选项分类

### 1. 路由选项

`model` 决定实际调用的模型。模型名称只是路由入口，不能单独证明结构化输出、工具、视觉或后台任务等能力。

模型选择至少需要绑定：

- API 类型，例如 Responses；
- 端点或提供商；
- 已验证的能力集合；
- 核验日期和测试用例。

只保存一个模型字符串，会让调用代码在遇到兼容网关、模型升级或能力下线时缺少诊断依据。

### 2. 输入选项

`instructions` 和 `input` 构成当前请求的主要上下文。前者提供系统或开发者级约束，后者承载用户消息、媒体和其他输入项。

| 字段 | 主要责任 | 本文边界 |
|------|----------|----------|
| `instructions` | 提供当前调用的高层约束 | 不讨论 Prompt 优化 |
| `input` | 提供任务数据和输入项 | 结构见[输入项与内容类型](./01-input-items-content-types.md) |
| `previous_response_id` | 续接已有 Response | 由会话状态文章负责 |
| `conversation` | 加入持久 Conversation | 由会话状态文章负责 |

### 3. 输出选项

`max_output_tokens` 是生成 Token 的上限，包含可见输出和推理 Token。它不是“最多多少个汉字”，也不保证每个兼容端点都正确执行。

`text` 用于配置文本格式或详细程度；结构化输出通过 `text.format` 表达，而不是照搬 Chat Completions 的 `response_format`。

### 4. 生命周期选项

`stream` 改变结果交付方式，`background` 改变长任务的执行与获取方式。它们会影响返回对象、终止条件和恢复逻辑，不能被当作无副作用的显示开关。

本文只做分类。流式事件、取消、后台状态和 Webhook 分别由响应生命周期章节处理。

### 5. 存储与追踪

官方 Responses API 在省略 `store` 时默认保存响应。无持久化需求或数据策略不允许保存时，应显式设置 `store=False`。

`metadata` 可以附加有限的键值对，用于查询或关联对象。它不应包含密钥、完整客户文本或其他不必要的敏感数据。

::: warning 默认存储必须显式评估
是否保存模型响应是数据治理决策，不是 SDK 细节。生产代码应根据数据分类明确设置 `store`，不要依赖默认值。
:::

### 6. 能力选项

工具、结构化输出、图像、文件和推理配置都属于能力选项。字段存在并不意味着所有模型均支持。

| 能力 | 代表字段 | 还需核对的条件 |
|------|----------|----------------|
| 结构化输出 | `text.format` | 模型支持的 Schema 子集 |
| 函数工具 | `tools`、`tool_choice` | 模型、严格参数和调用协议 |
| 内置工具 | `tools` | 账户、地区、模型和工具权限 |
| 多模态 | `input_image`、`input_file` | 模型能力、格式和大小限制 |
| 后台执行 | `background` | 模型与端点支持、查询和取消接口 |

## 二、兼容性证据

### 1. 官方契约

官方 API 参考回答“OpenAI Responses API 当前声明哪些字段和取值”。它是字段语义的首要依据，但不能证明兼容网关完整实现了同一契约。

2026-09-28 核对到的关键规则包括：

- `input` 支持文本、图像或文件输入；
- `max_output_tokens` 同时包含可见输出与推理 Token；
- `store` 省略时默认为 `true`；
- `temperature` 与 `top_p` 通常只调整其中一个；
- `truncation="disabled"` 是默认策略，超出上下文时返回错误，而不是自动丢弃开头内容。

这些规则仍需与具体模型说明一起阅读。

### 2. SDK 签名

SDK 签名回答“当前客户端版本能否表达这个字段”。字段若已经从 Responses API 移除，SDK 可以在网络请求前直接拒绝。

官方迁移指南明确说明 Responses 移除了 Chat Completions 的 `n` 参数，一次调用只生成一个响应。Python SDK 3.19.2 实测结果是：

```text
stage=sdk_argument_check
error_type=TypeError
message=Responses.create() got an unexpected keyword argument 'n'
```

这类错误不能通过更换模型解决。应删除 `n`，需要多个候选时由应用明确发起多次调用，并分别记录成本和结果。

### 3. 端点实测

端点实测回答“目标环境是否按声明的语义执行”。当前兼容端点在同一模型上得到以下结果：

| 选项组合 | 结果 | 能确认的结论 |
|----------|------|----------------|
| `model + instructions + input` | `completed` | 基础文本调用可用 |
| `max_output_tokens=256` | `completed` | 字段被接受 |
| `store=False` | `completed` | 无存储请求未被拒绝 |
| `metadata` | `completed` | 当前键值对形状可用 |
| `max_output_tokens=16` | 返回 429 个输出 Token | 当前端点未按官方上限语义执行 |
| `conversation` | `400 Unsupported parameter` | 官方字段未被该端点实现 |

最后两项是当前兼容端点的限定结论，不代表官方 API 的通用行为。应用应把它们登记为能力差异，而不是偷偷忽略。

## 三、能力配置

### 1. 配置维度

兼容性不应散落在异常处理代码中。可以为每个“提供商 + 端点 + 模型”维护一份能力配置。

| 字段 | 示例值 | 证据来源 |
|------|--------|----------|
| `api_style` | `responses` | 官方契约 |
| `model` | `gpt-6-luna` | 环境配置 |
| `supports_metadata` | `true` | 在线调用 |
| `enforces_output_limit` | `false` | 受控小上限调用 |
| `supports_conversation` | `false` | `400` 错误 |
| `verified_at` | `2026-09-28` | 验证记录 |

配置中的布尔值只对绑定的版本和环境有效。模型别名、网关或 SDK 变更后，需要重新执行契约测试。

### 2. 保守交集

应用初次接入时应先使用最小字段集合：

```python
request = {
    "model": model,
    "instructions": "用一句话概括故障现象，不推测原因。",
    "input": "客户反馈：导出任务一直停在处理中。",
    "max_output_tokens": 256,
    "store": False,
}
```

基础请求稳定后，再逐项启用结构化输出、工具或媒体。一次加入多个能力时，失败后很难判断是哪一个字段、模型还是端点造成不兼容。

## 四、验证环境

### 1. 运行条件

本例使用 Python 3.12.14、OpenAI Python SDK 3.19.2 和 `gpt-6-luna`。环境变量与“输入项与内容类型”一致。

创建独立目录并安装固定版本：

::: code-group

```powershell [PowerShell]
mkdir request-options-demo
cd request-options-demo
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install openai==3.19.2
```

```bash [Bash]
mkdir request-options-demo
cd request-options-demo
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install openai==3.19.2
```

:::

## 五、完整实现

程序先执行应用自己的参数边界校验，再分别验证受支持字段组合和已移除的 `n` 参数。

::: details 查看 request_options_demo.py 完整代码

```python
# request_options_demo.py
import argparse
import json
import os
from typing import Any

from openai import OpenAI


def build_request(
    model: str,
    task_input: str,
    max_output_tokens: int,
    store: bool,
) -> dict[str, Any]:
    """构造经过应用边界校验的请求。

    Args:
        model: 已验证可用的模型标识，不能为空。
        task_input: 待处理的虚构工单文本，不能为空。
        max_output_tokens: 应用允许的输出上限，范围为 64～2048。
        store: 是否允许 API 保存本次响应。

    Returns:
        可展开传给 responses.create 的请求字典。
    """
    if not model.strip() or not task_input.strip():
        raise ValueError("model 和 task_input 不能为空")
    if not 64 <= max_output_tokens <= 2048:
        raise ValueError("max_output_tokens 必须处于应用限定的 64～2048")
    return {
        "model": model,
        "instructions": "用一句话概括故障现象，不推测原因。",
        "input": task_input,
        "max_output_tokens": max_output_tokens,
        "store": store,
        "metadata": {"case_id": "CASE-1042", "scenario": "request-options"},
    }


def main() -> None:
    """执行成功组合、迁移错误或应用边界测试。"""
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["supported", "unsupported", "self-test"])
    args = parser.parse_args()
    if args.mode == "self-test":
        for value in (63, 2049):
            try:
                build_request("gpt-6-luna", "工单文本", value, False)
            except ValueError:
                continue
            raise AssertionError(f"无效上限未被拒绝：{value}")
        print("self_test=passed cases=2")
        return

    client = OpenAI()
    model = os.getenv("OPENAI_MODEL", "gpt-6-luna")
    if args.mode == "unsupported":
        try:
            client.responses.create(model=model, input="返回两个答案", n=2)
        except TypeError as error:
            result = {"stage": "sdk_argument_check", "message": str(error)}
        else:
            raise RuntimeError("不支持的 n 选项意外通过")
    else:
        request = build_request(
            model,
            "客户反馈：导出任务一直停在处理中。",
            256,
            False,
        )
        response = client.responses.create(**request)
        result = {
            "request_fields": sorted(request.keys()),
            "status": response.status,
            "model": response.model,
            "output_text": response.output_text,
        }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
```

:::

### 1. 执行入口

```powershell
python .\request_options_demo.py self-test
python .\request_options_demo.py supported
python .\request_options_demo.py unsupported
```

自检只验证应用自定义的 64～2048 范围，不把这个范围描述成 API 的统一限制。

## 六、验证结果

### 1. 保守请求

在线请求实际返回：

::: details 查看保守请求的脱敏结果

```json
{
  "request_fields": [
    "input",
    "instructions",
    "max_output_tokens",
    "metadata",
    "model",
    "store"
  ],
  "status": "completed",
  "model": "gpt-6-luna",
  "output_text": "导出任务一直处于处理中状态。"
}
```

:::

结果证明这组字段在当前环境中可以共同使用。它不证明 `max_output_tokens` 的所有边界值都被正确执行；小上限对照已经发现语义偏差。

### 2. 无效选项

`n=2` 在 SDK 参数检查阶段返回 `TypeError`，没有发出 HTTP 请求。修正方式是迁移到 Responses 的单结果模型，而不是捕获异常后重试。

### 3. 应用边界

```text
self_test=passed cases=2
```

`63` 和 `2049` 都被应用策略拒绝。边界测试证明配置校验有效，但这些数值只是示例业务约束，生产范围应依据任务长度、模型和成本预算制定。

## 七、失败定位

### 1. 失败阶段

先判断错误发生在哪一层，可以减少无效重试。

| 阶段 | 常见证据 | 处理方向 |
|------|----------|----------|
| 应用校验 | `ValueError` | 修正业务配置 |
| SDK 参数检查 | `TypeError` | 核对 SDK 版本与方法签名 |
| HTTP 参数校验 | `400` | 核对 API 类型、字段和端点能力 |
| 模型能力校验 | 不支持工具、媒体或格式 | 更换模型或关闭能力 |
| 运行过程 | `failed`、`incomplete` | 读取状态详情后决定恢复方式 |

参数错误和能力不兼容通常不可通过原样重试恢复。

### 2. 迁移字段

从 Chat Completions 迁移时，不要把旧请求对象直接展开到 `responses.create`。

| Chat Completions 概念 | Responses 对应方式 |
|-----------------------|--------------------|
| `messages` | `input` Items |
| `choices[0]` | `output` Items 或 `output_text` |
| `n` | 已移除；一次调用一个结果 |
| `response_format` | `text.format` |
| 函数嵌套定义 | Responses 工具对象 |

迁移不是只替换 URL；请求字段、输出对象和会话状态都需要分别调整。

## 八、上线约束

### 1. 变更门禁

以下变化应触发兼容性复验：

1. SDK 升级或降级；
2. 模型名称、快照或别名变化；
3. API 端点或兼容网关变化；
4. 新增工具、媒体、结构化输出或后台模式；
5. 已有字段的结果不再符合声明语义。

复验至少包含一个成功用例、一个不支持用例和一个边界用例，并保存脱敏的状态、错误类型和关键字段。

### 2. 降级策略

能力不兼容时应显式选择替代路径，例如关闭可选能力、切换已验证模型或返回清晰错误。不能静默删除影响业务语义的字段，也不能把未执行的输出上限标记为已生效。

::: warning 接受字段不等于执行语义
当前兼容端点接受 `max_output_tokens=16` 后仍返回超过 400 个输出 Token。只有核对响应用量和状态，才能发现这种“请求成功但约束未生效”的兼容性问题。
:::

参考资料：

- [Create a model response](https://developers.openai.com/api/reference/resources/responses/methods/create)
- [Migrate to the Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses)
