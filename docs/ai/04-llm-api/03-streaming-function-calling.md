---
title: "LLM 流式输出与函数调用"
category: "AI · LLM API"
tags:
  - LLM
  - 流式输出
  - 函数调用
  - Tool Use
date: 2026-03-17
excerpt: "深入讲解 LLM 流式响应的 SSE 原理、OpenAI 和 Claude 的流式调用方式、函数调用与工具调用机制，以及结构化输出和 Token 成本控制策略。"
---

# LLM 流式输出与函数调用

流式输出和函数调用是构建现代 LLM 应用的两大核心能力。前者解决交互体验问题，后者赋予模型与外部系统交互的能力。

## 一、SSE 流式响应原理

### 1. 什么是 SSE

SSE（Server-Sent Events）是一种基于 HTTP 的单向推送协议，服务端可持续向客户端发送数据，无需建立 WebSocket 连接。LLM 的流式输出正是基于此协议实现。

```
传统请求/响应：
Client ──请求──▶ Server ──等待模型生成完毕──▶ 一次性返回完整响应

SSE 流式推送：
Client ──请求──▶ Server ──▶ Token1 ──▶ Token2 ──▶ Token3 ──▶ ... ──▶ [DONE]
```

### 2. SSE 数据格式

```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache

data: {"id":"chatcmpl-xxx","choices":[{"delta":{"content":"你"},"finish_reason":null}]}

data: {"id":"chatcmpl-xxx","choices":[{"delta":{"content":"好"},"finish_reason":null}]}

data: [DONE]
```

| 字段 | 说明 |
|------|------|
| `data:` | 每个事件的数据字段 |
| 空行 | 事件分隔符（两个 `\n`） |
| `[DONE]` | 流结束标记 |
| `event:` | 可选，事件类型（Claude API 使用） |

---

## 二、OpenAI 流式调用

### 1. 基础流式调用

::: details OpenAI stream=True 完整示例

```python
# src/llm/openai_streaming.py
import openai

client = openai.OpenAI()

# --- 同步流式 ---
def stream_chat(user_message: str, system_prompt: str = "") -> str:
    """
    流式调用 OpenAI API，逐步打印输出

    Returns:
        完整的输出文本
    """
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": user_message})

    full_content = ""
    usage_data = None

    with client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        stream=True,
        stream_options={"include_usage": True}  # 流式模式下也返回 Token 用量
    ) as stream:
        for chunk in stream:
            # 处理内容增量
            if chunk.choices and chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                full_content += content
                print(content, end="", flush=True)

            # 最后一个 chunk 包含用量信息
            if chunk.usage:
                usage_data = chunk.usage

    print()  # 换行

    if usage_data:
        print(f"\n[用量] 输入: {usage_data.prompt_tokens} tokens, "
              f"输出: {usage_data.completion_tokens} tokens")

    return full_content

result = stream_chat("用Python写一个快速排序算法并解释原理")
```
:::

### 2. 异步流式（生产推荐）

::: details AsyncOpenAI 异步流式调用

```python
# src/llm/openai_async_streaming.py
import asyncio
from openai import AsyncOpenAI

client = AsyncOpenAI()

async def async_stream_chat(messages: list) -> str:
    """异步流式调用，适合高并发 Web 服务"""
    full_content = ""

    async with client.chat.completions.stream(
        model="gpt-4o",
        messages=messages,
    ) as stream:
        async for text in stream.text_stream:
            full_content += text
            print(text, end="", flush=True)

        # 获取最终完整消息（包含工具调用信息）
        final_message = await stream.get_final_message()
        usage = final_message.usage
        print(f"\n[Token 用量] 输入: {usage.prompt_tokens}, 输出: {usage.completion_tokens}")

    return full_content

# 运行
asyncio.run(async_stream_chat([
    {"role": "user", "content": "讲解一下 Transformer 架构"}
]))
```
:::

---

## 三、Claude 流式调用

### 1. Claude 流式 API 特点

Claude 使用不同于 OpenAI 的事件类型系统：

| 事件类型 | 说明 |
|---------|------|
| `message_start` | 消息开始，包含模型信息 |
| `content_block_start` | 内容块开始（文本/工具调用） |
| `content_block_delta` | 内容增量（`text_delta`/`input_json_delta`） |
| `content_block_stop` | 内容块结束 |
| `message_delta` | 消息级别增量（包含 stop_reason） |
| `message_stop` | 消息结束 |

::: details Claude 流式调用完整示例

```python
# src/llm/claude_streaming.py
import anthropic

client = anthropic.Anthropic()

# --- 方式一：with 语法（推荐）---
def stream_with_claude(prompt: str) -> str:
    """使用 context manager 流式调用 Claude"""
    full_text = ""

    with client.messages.stream(
        model="claude-opus-4-5",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
        system="你是一位专业的技术讲师，用清晰简洁的中文解释技术概念。"
    ) as stream:
        for text in stream.text_stream:
            full_text += text
            print(text, end="", flush=True)

        # 获取最终消息（包含完整 usage 信息）
        final_message = stream.get_final_message()
        usage = final_message.usage
        print(f"\n[Token] 输入: {usage.input_tokens}, 输出: {usage.output_tokens}")

    return full_text

# --- 方式二：原始 SSE 事件处理 ---
def stream_with_events(prompt: str):
    """处理 Claude 的原始 SSE 事件"""
    with client.messages.stream(
        model="claude-opus-4-5",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    ) as stream:
        for event in stream:
            event_type = type(event).__name__

            if event_type == "RawContentBlockDeltaEvent":
                if hasattr(event.delta, "text"):
                    print(event.delta.text, end="", flush=True)

            elif event_type == "RawMessageDeltaEvent":
                if event.delta.stop_reason:
                    print(f"\n[停止原因: {event.delta.stop_reason}]")

# --- 异步版本 ---
async def async_stream_claude(prompt: str) -> str:
    async with client.messages.stream(
        model="claude-opus-4-5",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    ) as stream:
        full_text = ""
        async for text in stream.text_stream:
            full_text += text
            print(text, end="", flush=True)
        return full_text
```
:::

---

## 四、函数调用 / 工具调用原理

### 1. 核心机制

函数调用（Function Calling）让模型可以"请求"调用特定函数，而不是直接生成答案。整个过程由应用层控制，模型只负责决策调用哪个函数以及传递什么参数。

```
用户输入
    ↓
模型决策：是否需要调用工具？
    ├── 不需要 → 直接生成文本回答
    └── 需要 → 输出 tool_call（工具名 + 参数 JSON）
                    ↓
              应用层执行实际函数
                    ↓
              将结果作为 tool 消息传回模型
                    ↓
              模型基于工具结果生成最终回答
```

### 2. OpenAI 函数调用

::: details OpenAI 工具调用完整实现

```python
# src/llm/openai_function_calling.py
import openai
import json
import math
from datetime import datetime

client = openai.OpenAI()

# --- 工具定义（JSON Schema 格式）---
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "获取指定城市的当前天气信息",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "城市名称（中文），如：北京、上海、广州"
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "温度单位，默认摄氏度"
                    }
                },
                "required": ["city"],
                "additionalProperties": False
            },
            "strict": True  # 严格模式：确保参数完全符合 Schema
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculate",
            "description": "计算数学表达式",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "数学表达式，如：sqrt(144) 或 2**10"
                    }
                },
                "required": ["expression"]
            }
        }
    }
]

# --- 本地函数实现 ---
def get_weather(city: str, unit: str = "celsius") -> dict:
    """模拟天气 API"""
    mock_data = {
        "北京": {"temp": 15, "condition": "晴天", "humidity": 45},
        "上海": {"temp": 22, "condition": "多云", "humidity": 70},
        "广州": {"temp": 28, "condition": "小雨", "humidity": 85},
    }
    data = mock_data.get(city, {"temp": 20, "condition": "未知", "humidity": 60})
    if unit == "fahrenheit":
        data["temp"] = data["temp"] * 9/5 + 32
    data["unit"] = "°F" if unit == "fahrenheit" else "°C"
    return data

def calculate(expression: str) -> dict:
    """安全地计算数学表达式"""
    try:
        # 只允许安全的数学操作
        allowed_names = {k: v for k, v in math.__dict__.items() if not k.startswith("__")}
        result = eval(expression, {"__builtins__": {}}, allowed_names)
        return {"result": result, "expression": expression}
    except Exception as e:
        return {"error": str(e)}

FUNCTION_MAP = {"get_weather": get_weather, "calculate": calculate}

# --- 完整的工具调用循环 ---
def chat_with_tools(user_message: str) -> str:
    messages = [{"role": "user", "content": user_message}]

    while True:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            tools=tools,
            tool_choice="auto"  # auto/none/required/指定工具
        )

        message = response.choices[0].message
        finish_reason = response.choices[0].finish_reason

        if finish_reason == "stop":
            # 模型直接生成文本（不需要工具）
            return message.content

        elif finish_reason == "tool_calls":
            # 模型请求调用工具
            messages.append(message)  # 将 assistant 消息加入历史

            for tool_call in message.tool_calls:
                func_name = tool_call.function.name
                func_args = json.loads(tool_call.function.arguments)

                # 执行本地函数
                result = FUNCTION_MAP[func_name](**func_args)

                # 将工具结果传回
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result, ensure_ascii=False)
                })
        else:
            break

    return "处理失败"

# 使用示例
print(chat_with_tools("北京今天天气怎么样？另外 2 的 10 次方是多少？"))
```
:::

### 3. Claude 工具调用（Tool Use）

::: details Claude Tool Use 完整示例

```python
# src/llm/claude_tool_use.py
import anthropic
import json

client = anthropic.Anthropic()

# Claude 工具定义格式（与 OpenAI 略有差异）
tools = [
    {
        "name": "search_knowledge_base",
        "description": "搜索内部知识库，获取产品文档、FAQ 等信息",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "搜索查询词"
                },
                "category": {
                    "type": "string",
                    "enum": ["product", "faq", "tutorial", "api"],
                    "description": "文档类别"
                }
            },
            "required": ["query"]
        }
    }
]

def search_knowledge_base(query: str, category: str = "all") -> str:
    """模拟知识库搜索"""
    return f"找到关于'{query}'的{category}文档：[示例文档内容...]"

def claude_chat_with_tools(user_message: str) -> str:
    messages = [{"role": "user", "content": user_message}]

    while True:
        response = client.messages.create(
            model="claude-opus-4-5",
            max_tokens=2048,
            tools=tools,
            messages=messages
        )

        if response.stop_reason == "end_turn":
            # 提取文本内容
            for block in response.content:
                if block.type == "text":
                    return block.text
            return ""

        elif response.stop_reason == "tool_use":
            # 处理工具调用
            messages.append({"role": "assistant", "content": response.content})
            tool_results = []

            for block in response.content:
                if block.type == "tool_use":
                    result = search_knowledge_base(**block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result
                    })

            messages.append({"role": "user", "content": tool_results})
        else:
            break

    return "处理失败"
```
:::

---

## 五、并行工具调用

当用户的问题涉及多个独立查询时，模型可以一次性返回多个工具调用，显著减少往返次数。

::: details 并行工具调用处理示例

```python
# src/llm/parallel_tool_calls.py
import openai
import json
from concurrent.futures import ThreadPoolExecutor

client = openai.OpenAI()

def process_tool_calls_parallel(tool_calls: list) -> list:
    """
    并行执行多个工具调用，减少总耗时

    例：同时查询北京和上海的天气，而不是串行查询
    """
    def execute_single_tool(tool_call):
        func_name = tool_call.function.name
        func_args = json.loads(tool_call.function.arguments)

        # 执行工具（实际调用 API 或本地函数）
        result = FUNCTION_MAP[func_name](**func_args)

        return {
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": json.dumps(result, ensure_ascii=False)
        }

    # 使用线程池并行执行
    with ThreadPoolExecutor(max_workers=len(tool_calls)) as executor:
        results = list(executor.map(execute_single_tool, tool_calls))

    return results

# 演示：模型会并行调用两个天气查询
messages = [{"role": "user", "content": "分别告诉我北京和上海今天的天气"}]

response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    tools=tools
)

message = response.choices[0].message
if message.tool_calls and len(message.tool_calls) > 1:
    print(f"模型请求并行调用 {len(message.tool_calls)} 个工具")

    messages.append(message)
    # 并行执行所有工具调用
    tool_results = process_tool_calls_parallel(message.tool_calls)
    messages.extend(tool_results)

    # 获取最终回答
    final = client.chat.completions.create(model="gpt-4o", messages=messages)
    print(final.choices[0].message.content)
```
:::

---

## 六、结构化输出

### 1. JSON 模式 vs Structured Outputs

| 方式 | 保证 | 适用场景 |
|------|------|---------|
| `response_format: json_object` | 合法 JSON，但不保证字段结构 | 结构不确定的 JSON 输出 |
| `response_format: json_schema` | 严格符合 JSON Schema | 固定结构的数据提取 |
| Pydantic + `parse()` | 自动解析为 Python 对象 | Python 应用强类型需求 |

::: details 三种结构化输出方式对比

```python
# src/llm/structured_outputs.py
import openai
import json
from pydantic import BaseModel
from typing import List, Optional

client = openai.OpenAI()

# --- 方式一：JSON 模式（宽松）---
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "始终以 JSON 格式输出结果。"},
        {"role": "user", "content": "提取信息：苹果公司，市值3万亿美元，CEO蒂姆·库克"}
    ],
    response_format={"type": "json_object"}
)
data = json.loads(response.choices[0].message.content)

# --- 方式二：JSON Schema（严格）---
schema = {
    "type": "object",
    "properties": {
        "company_name": {"type": "string"},
        "market_cap": {"type": "string"},
        "ceo": {"type": "string"},
        "founded_year": {"type": ["integer", "null"]}
    },
    "required": ["company_name", "market_cap", "ceo"],
    "additionalProperties": False
}

response = client.chat.completions.create(
    model="gpt-4o-2024-08-06",
    messages=[{"role": "user", "content": "提取：苹果公司，市值3万亿美元，CEO蒂姆·库克，1976年成立"}],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "company_info",
            "schema": schema,
            "strict": True
        }
    }
)

# --- 方式三：Pydantic 直接解析（最推荐）---
class CompanyInfo(BaseModel):
    company_name: str
    market_cap: str
    ceo: str
    founded_year: Optional[int] = None
    products: Optional[List[str]] = None

response = client.beta.chat.completions.parse(
    model="gpt-4o-2024-08-06",
    messages=[{"role": "user", "content": "提取：苹果公司，市值3万亿美元，CEO蒂姆·库克，1976年成立，主要产品有iPhone、Mac、iPad"}],
    response_format=CompanyInfo
)

company = response.choices[0].message.parsed  # 直接是 CompanyInfo 实例
print(f"{company.company_name} - CEO: {company.ceo} - 成立于: {company.founded_year}")
```
:::

---

## 七、Token 计算与成本控制

### 1. Token 与成本关系

不同模型的定价差异悬殊，选型时需结合任务复杂度与成本预算综合考虑：

| 模型 | 输入价格（$/1M tokens） | 输出价格（$/1M tokens） | 适用场景 |
|------|----------------------|----------------------|---------|
| gpt-4o | $2.50 | $10.00 | 复杂推理、代码生成 |
| gpt-4o-mini | $0.15 | $0.60 | 日常任务、分类 |
| claude-opus-4-5 | $15.00 | $75.00 | 最复杂任务 |
| claude-haiku-3-5 | $0.80 | $4.00 | 高频简单任务 |

### 2. Token 计算工具

::: details 使用 tiktoken 精确计算 Token 数

```python
# src/llm/token_counter.py
# 安装：pip install tiktoken

import tiktoken
from typing import List, Dict

def count_tokens(text: str, model: str = "gpt-4o") -> int:
    """计算文本的 Token 数量"""
    try:
        encoding = tiktoken.encoding_for_model(model)
    except KeyError:
        encoding = tiktoken.get_encoding("cl100k_base")  # 通用备选
    return len(encoding.encode(text))

def count_chat_tokens(messages: List[Dict], model: str = "gpt-4o") -> int:
    """
    精确计算 Chat 格式消息的 Token 数
    包含每条消息的额外固定开销
    """
    encoding = tiktoken.encoding_for_model(model)
    num_tokens = 3  # 每次对话的固定开销

    for message in messages:
        num_tokens += 4  # 每条消息的固定开销（role + content 标记）
        for key, value in message.items():
            num_tokens += len(encoding.encode(str(value)))

    return num_tokens

def estimate_cost(
    input_tokens: int,
    output_tokens: int,
    model: str = "gpt-4o"
) -> dict:
    """估算 API 调用成本"""
    pricing = {
        "gpt-4o":          {"input": 2.50, "output": 10.00},
        "gpt-4o-mini":     {"input": 0.15, "output": 0.60},
        "gpt-3.5-turbo":   {"input": 0.50, "output": 1.50},
    }

    if model not in pricing:
        return {"error": f"未知模型: {model}"}

    price = pricing[model]
    input_cost = input_tokens * price["input"] / 1_000_000
    output_cost = output_tokens * price["output"] / 1_000_000

    return {
        "model": model,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "input_cost_usd": round(input_cost, 6),
        "output_cost_usd": round(output_cost, 6),
        "total_cost_usd": round(input_cost + output_cost, 6)
    }

# 使用示例
messages = [
    {"role": "system", "content": "你是一个助手"},
    {"role": "user", "content": "请解释一下什么是 Transformer 架构？"}
]
token_count = count_chat_tokens(messages)
cost = estimate_cost(token_count, 500, "gpt-4o")
print(f"预估费用：${cost['total_cost_usd']:.4f}")
```
:::

### 3. 成本控制策略

| 策略 | 实现方式 | 节省幅度 |
|------|---------|---------|
| 模型分级 | 简单任务用小模型，复杂任务用大模型 | 50-90% |
| Prompt 压缩 | 使用 LLMLingua 等工具压缩长上下文 | 30-70% |
| 缓存相同请求 | 对相同 Prompt 的结果缓存（OpenAI Prompt Caching） | 50% 输入成本 |
| 控制输出长度 | 设置合理的 `max_tokens` 避免过长输出 | 10-30% |
| 批处理 | 使用 Batch API（异步），享受 50% 折扣 | 50% |

::: details 使用 OpenAI Batch API 降低成本

```python
# src/llm/batch_api.py
import openai
import json

client = openai.OpenAI()

# --- 准备批处理任务 ---
requests = [
    {"custom_id": f"task-{i}", "method": "POST", "url": "/v1/chat/completions",
     "body": {
         "model": "gpt-4o-mini",
         "messages": [{"role": "user", "content": f"将'{word}'翻译为英文，只输出翻译结果"}],
         "max_tokens": 20
     }}
    for i, word in enumerate(["苹果", "香蕉", "橙子", "西瓜"])
]

# 写入 JSONL 文件
with open("/tmp/batch_requests.jsonl", "w") as f:
    for req in requests:
        f.write(json.dumps(req, ensure_ascii=False) + "\n")

# 上传文件
with open("/tmp/batch_requests.jsonl", "rb") as f:
    batch_file = client.files.create(file=f, purpose="batch")

# 创建批处理任务
batch = client.batches.create(
    input_file_id=batch_file.id,
    endpoint="/v1/chat/completions",
    completion_window="24h"  # 24小时内完成（享受50%折扣）
)
print(f"批处理任务 ID: {batch.id}")

# 轮询任务状态（实际使用中用定时任务轮询）
import time
while True:
    batch_status = client.batches.retrieve(batch.id)
    if batch_status.status in ["completed", "failed", "cancelled"]:
        break
    print(f"状态: {batch_status.status}，等待中...")
    time.sleep(30)

# 下载结果
if batch_status.status == "completed":
    result_file = client.files.content(batch_status.output_file_id)
    for line in result_file.text.split("\n"):
        if line:
            result = json.loads(line)
            content = result["response"]["body"]["choices"][0]["message"]["content"]
            print(f"{result['custom_id']}: {content}")
```
:::
