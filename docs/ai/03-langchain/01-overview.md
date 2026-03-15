---
title: "LangChain 概述"
category: "AI · LangChain"
tags:
  - LangChain
  - Python
  - LLM
excerpt: "LangChain 通过模块化设计将 LLM 调用、提示词管理、记忆系统和工具集成等能力组合，快速构建智能应用。"
date: 2026-03-15
---

# LangChain 概述

LangChain 是当前最流行的大语言模型应用开发框架之一，它提供了一套模块化、可组合的工具集，帮助你将 LLM 的能力快速集成到实际应用中。无论是构建一个简单的问答机器人，还是复杂的多步推理 Agent，LangChain 都能提供开箱即用的解决方案。

## 一、什么是 LangChain

LangChain 由 Harrison Chase 于 2022 年创建，核心理念是将 LLM 应用的各个环节标准化为可复用的组件，并通过"链"（Chain）的方式将它们串联起来。

::: tip 核心价值
LangChain 解决的核心问题是：单独调用 LLM API 只能完成简单的文本生成，而真实应用往往需要多步处理、外部数据接入和上下文管理。LangChain 将这些能力封装为标准接口，大幅降低了开发复杂度。
:::

LangChain 生态包含以下几个关键部分：

| 组件 | 说明 |
|------|------|
| `langchain-core` | 核心抽象和 LCEL 表达式语言 |
| `langchain` | 链、Agent、检索策略等高级组件 |
| `langchain-community` | 第三方集成（向量数据库、工具等） |
| `langchain-openai` | OpenAI 模型的官方集成包 |
| `langserve` | 将链部署为 REST API 的工具 |
| `langsmith` | 调试、测试和监控平台 |

## 二、核心概念

LangChain 的架构围绕五个核心模块展开，理解它们是掌握整个框架的关键。

### 1. Models（模型）

Models 是 LangChain 对不同 LLM 提供商的统一抽象。你可以通过相同的接口调用 OpenAI、Anthropic、本地模型等不同后端，切换模型只需修改一行配置。

LangChain 将模型分为两类：

| 类型 | 接口 | 说明 |
|------|------|------|
| **LLM** | `BaseLLM` | 文本输入 → 文本输出，适合补全类任务 |
| **Chat Model** | `BaseChatModel` | 消息列表输入 → 消息输出，适合对话类任务 |

::: warning 注意
目前主流使用的是 Chat Model，大多数新模型（如 GPT-4、Claude 3）都采用对话格式。纯文本补全的 LLM 接口正在逐步被弃用。
:::

### 2. Prompts（提示词模板）

Prompts 模块提供了结构化管理提示词的能力，支持变量注入、消息角色设定和模板复用。

常用的提示词模板类型：

- **PromptTemplate**：简单字符串模板，适合单轮文本生成
- **ChatPromptTemplate**：对话格式模板，支持 system/human/ai 等角色消息
- **FewShotPromptTemplate**：少样本提示模板，内置示例管理

### 3. Chains（链）

Chain 是 LangChain 的核心设计模式，将多个组件按顺序串联形成处理流水线。例如：接收用户输入 → 填充提示词模板 → 调用 LLM → 解析输出结果。

### 4. Agents（智能体）

Agent 让 LLM 自主决策执行哪些操作。与 Chain 的固定流程不同，Agent 根据用户输入动态选择工具并规划执行步骤，适合处理开放式、不确定的任务场景。

### 5. Memory（记忆）

Memory 模块为对话和链式调用提供上下文记忆能力。常见的记忆策略包括：

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| `ConversationBufferMemory` | 保存完整对话历史 | 短对话 |
| `ConversationBufferWindowMemory` | 只保留最近 N 轮对话 | 长对话、控制 Token 用量 |
| `ConversationSummaryMemory` | 用 LLM 总结历史对话 | 超长对话 |
| `ConversationTokenBufferMemory` | 按 Token 数量截断历史 | 精确控制上下文长度 |

## 三、安装与配置

### 1. 安装依赖

::: details 安装 LangChain 及常用依赖

```bash
# 安装核心包
pip install langchain langchain-core

# 安装 OpenAI 集成
pip install langchain-openai

# 安装社区集成包（包含向量数据库、文档加载器等）
pip install langchain-community

# 可选：安装 LangSmith 用于调试追踪
pip install langsmith
```

:::

### 2. 配置环境变量

你需要根据所使用的模型提供商配置相应的 API Key。

::: details 环境变量配置

```bash
# .env 文件
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_BASE_URL=https://api.openai.com/v1

# 如果使用 Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key

# 如果使用 LangSmith 追踪
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your-langsmith-api-key
```

:::

::: details 在 Python 中加载环境变量

```python
# src/config.py
import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
```

:::

## 四、基础链式调用

下面通过一个完整示例演示如何使用 LangChain 构建最基础的链式调用。

### 1. 创建简单的 LLM 调用

::: details 直接调用 Chat Model

```python
# src/basic_chat.py
from langchain_openai import ChatOpenAI

# 初始化模型
chat_model = ChatOpenAI(
    model="gpt-4o",
    temperature=0.7,  # 控制生成的随机性，0 最确定，1 最随机
    max_tokens=1024
)

# 直接调用
response = chat_model.invoke("请用一句话解释什么是 RESTful API")
print(response.content)
# 输出: RESTful API 是一种基于 HTTP 协议、遵循 REST 架构风格的接口设计规范...
```

:::

### 2. 使用提示词模板

提示词模板让你将固定的指令与动态输入分离，提升复用性和可维护性。

::: details 提示词模板示例

```python{5-9,14}
# src/prompt_template.py
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

# 定义提示词模板
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一位资深的{role}，请用通俗易懂的语言回答问题。"),
    ("human", "{question}")
])

chat_model = ChatOpenAI(model="gpt-4o", temperature=0.7)

# 填充模板并调用模型
chain = prompt | chat_model
response = chain.invoke({
    "role": "前端工程师",
    "question": "Vue 3 的 Composition API 相比 Options API 有什么优势？"
})

print(response.content)
```

:::

### 3. 添加输出解析器

输出解析器将 LLM 的自由文本输出转换为结构化数据，方便后续处理。

::: details 使用输出解析器

```python{6,9-14,19}
# src/output_parser.py
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

# JSON 输出解析器
parser = JsonOutputParser()

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一位技术分析师。请以 JSON 格式返回分析结果，包含以下字段："
               "name（技术名称）、category（分类）、difficulty（难度 1-5）、"
               "description（一句话描述）"),
    ("human", "请分析这项技术：{technology}")
])

chat_model = ChatOpenAI(model="gpt-4o", temperature=0)

# 组装完整链：提示词 → 模型 → 解析器
chain = prompt | chat_model | parser

result = chain.invoke({"technology": "WebAssembly"})
print(result)
# 输出: {'name': 'WebAssembly', 'category': 'Web 技术', 'difficulty': 4, 'description': '...'}
```

:::

## 五、LCEL 表达式语言

LCEL（LangChain Expression Language）是 LangChain 推荐的链式组合方式，使用管道操作符 `|` 将各组件串联，语法简洁且内置支持流式输出、异步调用和批量处理。

### 1. 基本语法

LCEL 的核心是 `Runnable` 接口，所有组件（提示词模板、模型、解析器等）都实现了该接口，因此可以自由组合。

::: details LCEL 基本语法

```python{8}
# src/lcel_basic.py
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_template("将以下内容翻译成{target_language}：\n\n{text}")
model = ChatOpenAI(model="gpt-4o")
output_parser = StrOutputParser()

# 使用 | 操作符组合链
chain = prompt | model | output_parser

result = chain.invoke({
    "target_language": "英语",
    "text": "LangChain 是构建大语言模型应用的主流框架"
})
print(result)
```

:::

### 2. 流式输出

LCEL 原生支持流式输出，用户无需等待完整响应即可看到逐步生成的内容。

::: details 流式输出示例

```python{10-12}
# src/lcel_streaming.py
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_template("请详细介绍 {topic}")
model = ChatOpenAI(model="gpt-4o", streaming=True)
chain = prompt | model | StrOutputParser()

# 流式输出 —— 逐 Token 返回
for chunk in chain.stream({"topic": "微前端架构"}):
    print(chunk, end="", flush=True)
```

:::

### 3. 批量调用

当你需要对多组输入执行相同的链时，`batch` 方法支持并发批量处理。

::: details 批量调用示例

```python
# src/lcel_batch.py
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_template("用一句话解释 {concept}")
model = ChatOpenAI(model="gpt-4o")
chain = prompt | model | StrOutputParser()

# 批量处理多个输入
concepts = [
    {"concept": "闭包（Closure）"},
    {"concept": "事件循环（Event Loop）"},
    {"concept": "虚拟 DOM（Virtual DOM）"}
]

results = chain.batch(concepts, config={"max_concurrency": 3})
for concept, result in zip(concepts, results):
    print(f"{concept['concept']}: {result}\n")
```

:::

### 4. 异步调用

在 Web 服务中，异步调用可以避免阻塞事件循环，提升并发处理能力。

::: details 异步调用示例

```python
# src/lcel_async.py
import asyncio
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_template("请为 {product_name} 写一段 50 字以内的广告语")
model = ChatOpenAI(model="gpt-4o")
chain = prompt | model | StrOutputParser()

async def generate_ad_copy():
    # 异步调用
    result = await chain.ainvoke({"product_name": "智能代码助手"})
    print(result)

    # 异步流式输出
    async for chunk in chain.astream({"product_name": "AI 写作平台"}):
        print(chunk, end="", flush=True)

asyncio.run(generate_ad_copy())
```

:::

## 六、记忆系统实战

Memory 模块让你的对话链具备上下文记忆能力，以下示例演示如何构建一个有记忆的对话机器人。

::: details 带记忆的对话链

```python{7-8,11-17,20-21}
# src/memory_chat.py
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

# 存储每个会话的聊天历史
session_store = {}

def get_session_history(session_id: str):
    """根据会话 ID 获取或创建聊天历史"""
    if session_id not in session_store:
        session_store[session_id] = InMemoryChatMessageHistory()
    return session_store[session_id]

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一位友好的技术助手，擅长解答编程问题。"),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{input}")
])

model = ChatOpenAI(model="gpt-4o", temperature=0.7)
chain = prompt | model

# 包装为带记忆的链
chain_with_history = RunnableWithMessageHistory(
    chain,
    get_session_history,
    input_messages_key="input",
    history_messages_key="history"
)

# 模拟多轮对话
config = {"configurable": {"session_id": "user_001"}}

response1 = chain_with_history.invoke(
    {"input": "我正在学习 React，请推荐学习路线"},
    config=config
)
print(f"助手: {response1.content}\n")

response2 = chain_with_history.invoke(
    {"input": "你刚才推荐的第一步具体应该怎么做？"},
    config=config
)
print(f"助手: {response2.content}")
# 模型能够记住上一轮对话内容，给出连贯的回答
```

:::

::: tip 生产环境建议
在生产环境中，建议使用 Redis 或数据库替代 `InMemoryChatMessageHistory`，确保会话历史在服务重启后不会丢失。
:::

## 七、总结

本章介绍了 LangChain 的核心概念和基本用法，关键要点如下：

| 要点 | 说明 |
|------|------|
| 模块化架构 | Models、Prompts、Chains、Agents、Memory 五大模块各司其职 |
| LCEL 表达式 | 使用 `\|` 操作符组合组件，内置流式、异步、批量支持 |
| 提示词模板 | 将指令与动态输入分离，提升复用性 |
| 输出解析器 | 将自由文本转换为结构化数据 |
| 记忆系统 | 为对话链提供多轮上下文记忆能力 |

下一章将深入介绍 [RAG 检索增强生成](./02-rag.md)，学习如何让 LLM 结合外部知识库生成更准确的回答。
