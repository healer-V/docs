---
title: "OpenAI API"
category: "AI · LLM API"
tags:
  - OpenAI
  - GPT
  - API
excerpt: "OpenAI API 提供了 Chat Completions、Embeddings、Function Calling 等核心接口，是构建 AI 应用最广泛使用的 API。"
date: 2026-03-15
---

# OpenAI API

OpenAI API 是当前使用最广泛的大语言模型接口，提供了 Chat Completions、Embeddings、Function Calling 等核心能力。本章将从 API Key 配置到实际业务集成，帮助你掌握 OpenAI API 的完整开发流程。

## 一、API Key 配置

### 1. 获取 API Key

你需要在 [OpenAI Platform](https://platform.openai.com/) 注册账号并创建 API Key。建议为不同项目创建独立的 Key，便于追踪用量和控制权限。

### 2. 环境变量配置

::: danger 安全警告
永远不要将 API Key 硬编码在代码中或提交到版本控制系统。使用环境变量或密钥管理服务来存储。
:::

::: details 配置环境变量

::: code-group

```bash [.env 文件]
# .env
OPENAI_API_KEY=sk-proj-your-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
```

```python [Python 加载]
# src/config.py
import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")

if not OPENAI_API_KEY:
    raise ValueError("请设置 OPENAI_API_KEY 环境变量")
```

```javascript [Node.js 加载]
// src/config.js
import dotenv from 'dotenv'
dotenv.config()

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY
export const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'

if (!OPENAI_API_KEY) {
  throw new Error('请设置 OPENAI_API_KEY 环境变量')
}
```

:::

### 3. 安装 SDK

::: details 安装官方 SDK

::: code-group

```bash [Python]
pip install openai
```

```bash [Node.js]
npm install openai
```

:::

## 二、Chat Completions API

Chat Completions 是 OpenAI 最核心的接口，支持单轮和多轮对话。

### 1. 模型选择

| 模型 | 上下文窗口 | 特点 | 价格（输入/输出） |
|------|-----------|------|-------------------|
| `gpt-4o` | 128K | 最新旗舰模型，综合能力最强 | $2.50 / $10.00 per 1M |
| `gpt-4o-mini` | 128K | 性价比极高，适合大部分场景 | $0.15 / $0.60 per 1M |
| `gpt-4-turbo` | 128K | 上一代旗舰，稳定可靠 | $10.00 / $30.00 per 1M |
| `o1` | 200K | 推理能力强，适合复杂逻辑任务 | $15.00 / $60.00 per 1M |

::: tip 模型选择建议
- 日常对话和内容生成：`gpt-4o-mini`（成本低、速度快）
- 复杂分析和代码生成：`gpt-4o`（综合能力最强）
- 数学推理和逻辑任务：`o1`（深度思考能力突出）
:::

### 2. 基础调用

::: details 基础 Chat Completions 调用

::: code-group

```python [Python]
# src/openai_basic.py
from openai import OpenAI

client = OpenAI()  # 自动读取 OPENAI_API_KEY 环境变量

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {
            "role": "system",
            "content": "你是一位资深的前端工程师，擅长用通俗的语言解释技术概念。"
        },
        {
            "role": "user",
            "content": "请解释 JavaScript 中的事件循环机制"
        }
    ],
    temperature=0.7,   # 控制随机性，0 最确定，2 最随机
    max_tokens=1024,   # 最大输出 Token 数
    top_p=1.0,         # 核采样参数
)

# 获取回答内容
answer = response.choices[0].message.content
print(answer)

# 查看 Token 用量
usage = response.usage
print(f"输入 Token: {usage.prompt_tokens}")
print(f"输出 Token: {usage.completion_tokens}")
print(f"总计 Token: {usage.total_tokens}")
```

```javascript [Node.js]
// src/openaiBasic.js
import OpenAI from 'openai'

const client = new OpenAI()  // 自动读取 OPENAI_API_KEY 环境变量

async function chat() {
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: '你是一位资深的前端工程师，擅长用通俗的语言解释技术概念。'
      },
      {
        role: 'user',
        content: '请解释 JavaScript 中的事件循环机制'
      }
    ],
    temperature: 0.7,
    max_tokens: 1024
  })

  const answer = response.choices[0].message.content
  console.log(answer)

  // 查看 Token 用量
  const { prompt_tokens, completion_tokens, total_tokens } = response.usage
  console.log(`输入: ${prompt_tokens}, 输出: ${completion_tokens}, 总计: ${total_tokens}`)
}

chat()
```

:::

### 3. 多轮对话

多轮对话的关键是维护完整的消息历史，每次请求都将之前的对话记录一并发送。

::: details 多轮对话实现

::: code-group

```python [Python]
# src/openai_multi_turn.py
from openai import OpenAI

client = OpenAI()

# 维护对话历史
conversation_history = [
    {"role": "system", "content": "你是一位友好的编程导师，帮助用户学习 Python。"}
]

def chat(user_message: str) -> str:
    """发送消息并获取回复，自动维护对话历史"""
    conversation_history.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=conversation_history,
        temperature=0.7,
        max_tokens=1024
    )

    assistant_message = response.choices[0].message.content
    conversation_history.append({"role": "assistant", "content": assistant_message})

    return assistant_message

# 模拟多轮对话
print(chat("我想学习 Python 的装饰器，应该从哪里开始？"))
print(chat("你能给我一个实际的例子吗？"))
print(chat("如果我想给装饰器传递参数呢？"))
# 每轮对话都能基于之前的上下文给出连贯回答
```

```javascript [Node.js]
// src/openaiMultiTurn.js
import OpenAI from 'openai'

const client = new OpenAI()

const conversationHistory = [
  { role: 'system', content: '你是一位友好的编程导师，帮助用户学习 Python。' }
]

async function chat(userMessage) {
  conversationHistory.push({ role: 'user', content: userMessage })

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: conversationHistory,
    temperature: 0.7,
    max_tokens: 1024
  })

  const assistantMessage = response.choices[0].message.content
  conversationHistory.push({ role: 'assistant', content: assistantMessage })

  return assistantMessage
}

// 多轮对话
console.log(await chat('我想学习 Python 的装饰器，应该从哪里开始？'))
console.log(await chat('你能给我一个实际的例子吗？'))
console.log(await chat('如果我想给装饰器传递参数呢？'))
```

:::

## 三、流式响应

流式响应（Streaming）让你在模型生成过程中逐步接收内容，大幅减少用户的等待感。在面向用户的应用中，流式输出是必备能力。

### 1. 基础流式调用

::: details 流式响应实现

::: code-group

```python [Python]
# src/openai_streaming.py
from openai import OpenAI

client = OpenAI()

stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "user", "content": "请详细介绍 TypeScript 的类型体操"}
    ],
    stream=True  # 开启流式输出
)

# 逐块接收并输出
full_response = ""
for chunk in stream:
    content = chunk.choices[0].delta.content
    if content is not None:
        print(content, end="", flush=True)
        full_response += content

print(f"\n\n完整回答长度: {len(full_response)} 字符")
```

```javascript [Node.js]
// src/openaiStreaming.js
import OpenAI from 'openai'

const client = new OpenAI()

async function streamChat() {
  const stream = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'user', content: '请详细介绍 TypeScript 的类型体操' }
    ],
    stream: true
  })

  let fullResponse = ''
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || ''
    process.stdout.write(content)
    fullResponse += content
  }

  console.log(`\n\n完整回答长度: ${fullResponse.length} 字符`)
}

streamChat()
```

:::

### 2. SSE 服务端实现

在 Web 应用中，通常使用 Server-Sent Events（SSE）将流式响应转发给前端。

::: details Express + SSE 流式转发

```javascript{14-16,22-31}
// src/server/streamRoute.js
import express from 'express'
import OpenAI from 'openai'

const router = express.Router()
const client = new OpenAI()

router.post('/api/chat/stream', async (req, res) => {
  const { messages } = req.body

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const stream = await client.chat.completions.create({
      model: 'gpt-4o',
      messages,
      stream: true
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        // 以 SSE 格式发送数据
        res.write(`data: ${JSON.stringify({ content })}\n\n`)
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
    res.end()
  }
})

export default router
```

:::

::: details 前端接收 SSE 流式响应

```javascript
// src/client/streamClient.js
async function streamChat(messages, onChunk, onDone) {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  })

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)

      if (data === '[DONE]') {
        onDone?.()
        return
      }

      const parsed = JSON.parse(data)
      if (parsed.content) {
        onChunk(parsed.content)
      }
    }
  }
}

// 使用示例
const chatMessages = [
  { role: 'user', content: '请解释 React 的 Fiber 架构' }
]

let fullText = ''
streamChat(
  chatMessages,
  (chunk) => {
    fullText += chunk
    document.getElementById('output').textContent = fullText
  },
  () => console.log('生成完成')
)
```

:::

## 四、Function Calling / Tool Use

Function Calling 让 LLM 能够调用你预定义的函数，是构建 AI Agent 的基础能力。模型会根据用户输入判断是否需要调用函数，并生成符合函数签名的参数。

### 1. 工作流程

Function Calling 的执行流程如下：

1. 你定义可用的函数（工具）列表，包含函数名称、描述和参数 Schema
2. 将函数列表和用户消息一起发送给模型
3. 模型判断是否需要调用函数，如果需要则返回函数名和参数
4. 你在本地执行函数，获取结果
5. 将函数执行结果返回给模型，模型基于结果生成最终回答

### 2. 完整示例

::: details Function Calling 完整实现

::: code-group

```python [Python]
# src/openai_function_calling.py
import json
from openai import OpenAI

client = OpenAI()

# 定义工具函数
def get_weather(city: str, unit: str = "celsius") -> dict:
    """模拟获取天气数据（实际应用中调用天气 API）"""
    weather_data = {
        "北京": {"temp": 22, "condition": "晴", "humidity": 45},
        "上海": {"temp": 26, "condition": "多云", "humidity": 72},
        "深圳": {"temp": 30, "condition": "阵雨", "humidity": 85},
    }
    data = weather_data.get(city, {"temp": 20, "condition": "未知", "humidity": 50})
    if unit == "fahrenheit":
        data["temp"] = data["temp"] * 9 / 5 + 32
    return {"city": city, "unit": unit, **data}

def search_products(keyword: str, max_price: float = None) -> list:
    """模拟商品搜索（实际应用中查询数据库）"""
    products = [
        {"name": "机械键盘 K8 Pro", "price": 599, "category": "外设"},
        {"name": "4K 显示器 U2723QE", "price": 3299, "category": "显示器"},
        {"name": "降噪耳机 WH-1000XM5", "price": 2299, "category": "音频"},
    ]
    results = [p for p in products if keyword.lower() in p["name"].lower()]
    if max_price:
        results = [p for p in results if p["price"] <= max_price]
    return results

# 工具列表注册到函数映射
available_functions = {
    "get_weather": get_weather,
    "search_products": search_products,
}

# 定义工具 Schema
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
                        "description": "城市名称，如 北京、上海"
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "温度单位，默认摄氏度"
                    }
                },
                "required": ["city"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_products",
            "description": "根据关键词搜索商品",
            "parameters": {
                "type": "object",
                "properties": {
                    "keyword": {
                        "type": "string",
                        "description": "搜索关键词"
                    },
                    "max_price": {
                        "type": "number",
                        "description": "最高价格限制（可选）"
                    }
                },
                "required": ["keyword"]
            }
        }
    }
]

def run_conversation(user_message: str) -> str:
    """执行带 Function Calling 的对话"""
    messages = [
        {"role": "system", "content": "你是一个智能助手，可以查询天气和搜索商品。"},
        {"role": "user", "content": user_message}
    ]

    # 第一次调用：模型决定是否需要调用函数
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        tools=tools,
        tool_choice="auto"  # 让模型自行决定是否调用工具
    )

    response_message = response.choices[0].message

    # 如果模型决定调用函数
    if response_message.tool_calls:
        messages.append(response_message)

        # 依次执行每个函数调用
        for tool_call in response_message.tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)

            # 执行对应的函数
            function_result = available_functions[function_name](**function_args)

            # 将函数结果添加到消息中
            messages.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "content": json.dumps(function_result, ensure_ascii=False)
            })

        # 第二次调用：模型基于函数结果生成最终回答
        final_response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages
        )
        return final_response.choices[0].message.content
    else:
        return response_message.content

# 使用示例
print(run_conversation("北京今天天气怎么样？"))
print(run_conversation("帮我搜索一下 3000 元以内的键盘"))
```

```javascript [Node.js]
// src/openaiToolUse.js
import OpenAI from 'openai'

const client = new OpenAI()

// 定义工具函数
function getWeather(city, unit = 'celsius') {
  const weatherData = {
    '北京': { temp: 22, condition: '晴', humidity: 45 },
    '上海': { temp: 26, condition: '多云', humidity: 72 },
    '深圳': { temp: 30, condition: '阵雨', humidity: 85 }
  }
  const data = weatherData[city] || { temp: 20, condition: '未知', humidity: 50 }
  if (unit === 'fahrenheit') {
    data.temp = data.temp * 9 / 5 + 32
  }
  return { city, unit, ...data }
}

const availableFunctions = { get_weather: getWeather }

const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: '获取指定城市的当前天气信息',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: '城市名称' },
          unit: { type: 'string', enum: ['celsius', 'fahrenheit'] }
        },
        required: ['city']
      }
    }
  }
]

async function runConversation(userMessage) {
  const messages = [
    { role: 'system', content: '你是一个智能助手，可以查询天气信息。' },
    { role: 'user', content: userMessage }
  ]

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages,
    tools,
    tool_choice: 'auto'
  })

  const responseMessage = response.choices[0].message

  if (responseMessage.tool_calls) {
    messages.push(responseMessage)

    for (const toolCall of responseMessage.tool_calls) {
      const functionName = toolCall.function.name
      const functionArgs = JSON.parse(toolCall.function.arguments)
      const result = availableFunctions[functionName](...Object.values(functionArgs))

      messages.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        content: JSON.stringify(result)
      })
    }

    const finalResponse = await client.chat.completions.create({
      model: 'gpt-4o',
      messages
    })
    return finalResponse.choices[0].message.content
  }

  return responseMessage.content
}

console.log(await runConversation('北京和上海今天天气怎么样？'))
```

:::

## 五、Embeddings API

Embeddings API 将文本转换为高维向量表示，用于语义搜索、文本分类、聚类等场景。

### 1. 模型对比

| 模型 | 维度 | 价格 (per 1M tokens) | 特点 |
|------|------|---------------------|------|
| `text-embedding-3-small` | 1536 | $0.02 | 性价比最高，适合大部分场景 |
| `text-embedding-3-large` | 3072 | $0.13 | 精度更高，适合对质量要求极高的场景 |

### 2. 基础调用

::: details Embeddings API 调用

::: code-group

```python [Python]
# src/openai_embeddings.py
from openai import OpenAI
import numpy as np

client = OpenAI()

def get_embedding(text: str, model: str = "text-embedding-3-small") -> list[float]:
    """获取文本的向量表示"""
    response = client.embeddings.create(input=text, model=model)
    return response.data[0].embedding

def cosine_similarity(vec_a: list, vec_b: list) -> float:
    """计算两个向量的余弦相似度"""
    a = np.array(vec_a)
    b = np.array(vec_b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# 生成向量
embedding_react = get_embedding("React 是一个用于构建用户界面的 JavaScript 库")
embedding_vue = get_embedding("Vue 是一个渐进式的 JavaScript 框架")
embedding_python = get_embedding("Python 是一种通用编程语言，广泛用于数据科学")

# 计算语义相似度
sim_react_vue = cosine_similarity(embedding_react, embedding_vue)
sim_react_python = cosine_similarity(embedding_react, embedding_python)

print(f"React vs Vue 相似度: {sim_react_vue:.4f}")     # 较高（都是前端框架）
print(f"React vs Python 相似度: {sim_react_python:.4f}")  # 较低（不同领域）
```

```javascript [Node.js]
// src/openaiEmbeddings.js
import OpenAI from 'openai'

const client = new OpenAI()

async function getEmbedding(text, model = 'text-embedding-3-small') {
  const response = await client.embeddings.create({ input: text, model })
  return response.data[0].embedding
}

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

const embReact = await getEmbedding('React 是一个用于构建用户界面的 JavaScript 库')
const embVue = await getEmbedding('Vue 是一个渐进式的 JavaScript 框架')
const embPython = await getEmbedding('Python 是一种通用编程语言')

console.log(`React vs Vue: ${cosineSimilarity(embReact, embVue).toFixed(4)}`)
console.log(`React vs Python: ${cosineSimilarity(embReact, embPython).toFixed(4)}`)
```

:::

### 3. 语义搜索实现

Embeddings 最常见的应用是构建语义搜索，根据用户查询找到最相关的文档。

::: details 简易语义搜索

```python{20-30}
# src/openai_semantic_search.py
from openai import OpenAI
import numpy as np

client = OpenAI()

# 知识库文档
documents = [
    "Vite 使用原生 ES Module 实现快速的开发服务器启动",
    "Webpack 通过 Loader 和 Plugin 机制处理各种类型的资源文件",
    "React 18 引入了并发渲染模式，提升了大型应用的用户体验",
    "Vue 3 的 Composition API 允许按功能组织代码逻辑",
    "TypeScript 的类型系统可以在编译时捕获潜在的错误",
    "Node.js 使用事件驱动和非阻塞 I/O 模型，适合高并发场景",
    "Nginx 是高性能的反向代理服务器，常用于负载均衡",
    "Docker 通过容器化技术实现应用的一致性部署"
]

# 预计算所有文档的向量
doc_embeddings = []
for doc in documents:
    response = client.embeddings.create(input=doc, model="text-embedding-3-small")
    doc_embeddings.append(response.data[0].embedding)

def search(query: str, top_k: int = 3) -> list[tuple[str, float]]:
    """语义搜索：返回最相关的 top_k 个文档"""
    query_response = client.embeddings.create(input=query, model="text-embedding-3-small")
    query_embedding = np.array(query_response.data[0].embedding)

    # 计算与所有文档的相似度
    similarities = []
    for i, doc_emb in enumerate(doc_embeddings):
        similarity = np.dot(query_embedding, np.array(doc_emb)) / (
            np.linalg.norm(query_embedding) * np.linalg.norm(np.array(doc_emb))
        )
        similarities.append((documents[i], float(similarity)))

    # 按相似度降序排列
    similarities.sort(key=lambda x: x[1], reverse=True)
    return similarities[:top_k]

# 搜索测试
results = search("前端构建工具的区别")
for doc, score in results:
    print(f"[{score:.4f}] {doc}")
```

:::

## 六、Token 计数与成本控制

在生产环境中，精确控制 Token 用量对成本管理至关重要。

### 1. Token 计数

::: details 使用 tiktoken 计算 Token 数量

```python
# src/openai_token_count.py
import tiktoken

def count_tokens(text: str, model: str = "gpt-4o") -> int:
    """计算文本的 Token 数量"""
    encoding = tiktoken.encoding_for_model(model)
    return len(encoding.encode(text))

def estimate_cost(
    prompt_tokens: int,
    completion_tokens: int,
    model: str = "gpt-4o"
) -> float:
    """估算 API 调用成本（美元）"""
    pricing = {
        "gpt-4o":      {"input": 2.50 / 1_000_000, "output": 10.00 / 1_000_000},
        "gpt-4o-mini": {"input": 0.15 / 1_000_000, "output": 0.60 / 1_000_000},
        "gpt-4-turbo": {"input": 10.00 / 1_000_000, "output": 30.00 / 1_000_000},
    }
    price = pricing.get(model, pricing["gpt-4o"])
    return prompt_tokens * price["input"] + completion_tokens * price["output"]

# 使用示例
text = "Vue 3 的 Composition API 通过 setup 函数将逻辑按功能组织"
tokens = count_tokens(text)
print(f"文本 Token 数: {tokens}")

cost = estimate_cost(prompt_tokens=500, completion_tokens=1000, model="gpt-4o")
print(f"预估成本: ${cost:.6f}")
```

:::

### 2. 成本优化策略

| 策略 | 实现方式 | 节省幅度 |
|------|----------|----------|
| 选择合适模型 | 非关键场景使用 `gpt-4o-mini` | 90%+ |
| 缓存响应 | 相同请求使用 Redis 缓存结果 | 取决于命中率 |
| 控制输出长度 | 设置合理的 `max_tokens` | 10-50% |
| 精简提示词 | 去除冗余指令，提炼核心要求 | 10-30% |
| 批量处理 | 合并多个小请求为一个大请求 | 减少固定开销 |

## 七、错误处理

生产环境中，健壮的错误处理和重试机制不可或缺。

### 1. 常见错误类型

| 错误 | HTTP 状态码 | 原因 | 处理方式 |
|------|------------|------|----------|
| `AuthenticationError` | 401 | API Key 无效或过期 | 检查密钥配置 |
| `RateLimitError` | 429 | 请求频率超限 | 指数退避重试 |
| `APIConnectionError` | - | 网络连接失败 | 重试或切换网络 |
| `BadRequestError` | 400 | 请求参数错误 | 检查请求内容 |
| `InternalServerError` | 500 | OpenAI 服务端故障 | 等待后重试 |

### 2. 指数退避重试

::: details 健壮的错误处理实现

::: code-group

```python [Python]
# src/openai_error_handling.py
import time
from openai import OpenAI, RateLimitError, APIConnectionError, InternalServerError

client = OpenAI()

def chat_with_retry(
    messages: list,
    model: str = "gpt-4o",
    max_retries: int = 3,
    base_delay: float = 1.0
) -> str:
    """带指数退避重试的 API 调用"""
    for attempt in range(max_retries + 1):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=1024
            )
            return response.choices[0].message.content

        except RateLimitError as error:
            if attempt == max_retries:
                raise
            delay = base_delay * (2 ** attempt)  # 1s, 2s, 4s
            print(f"频率限制，{delay}s 后重试 (第 {attempt + 1} 次)")
            time.sleep(delay)

        except (APIConnectionError, InternalServerError) as error:
            if attempt == max_retries:
                raise
            delay = base_delay * (2 ** attempt)
            print(f"服务异常: {error}，{delay}s 后重试")
            time.sleep(delay)

        except Exception as error:
            # 非暂时性错误，直接抛出
            print(f"不可重试的错误: {error}")
            raise

# 使用示例
result = chat_with_retry([
    {"role": "user", "content": "请解释什么是微服务架构"}
])
print(result)
```

```javascript [Node.js]
// src/openaiErrorHandling.js
import OpenAI from 'openai'

const client = new OpenAI()

async function chatWithRetry(messages, { model = 'gpt-4o', maxRetries = 3, baseDelay = 1000 } = {}) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages,
        max_tokens: 1024
      })
      return response.choices[0].message.content

    } catch (error) {
      const isRetryable = error.status === 429 || error.status === 500 || error.status === 503

      if (!isRetryable || attempt === maxRetries) {
        throw error
      }

      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`请求失败 (${error.status})，${delay}ms 后重试`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

const result = await chatWithRetry([
  { role: 'user', content: '请解释什么是微服务架构' }
])
console.log(result)
```

:::

## 八、总结

本章完整介绍了 OpenAI API 的核心功能和开发实践，关键要点如下：

| 能力 | 核心接口 | 典型场景 |
|------|----------|----------|
| 对话生成 | Chat Completions | 聊天机器人、内容生成 |
| 流式输出 | Stream | 实时对话、打字机效果 |
| 工具调用 | Function Calling | AI Agent、外部系统集成 |
| 语义表示 | Embeddings | 语义搜索、文档检索 |
| 成本控制 | Token 计数 + 缓存 | 生产环境成本优化 |

::: tip 最佳实践回顾
- 始终使用环境变量管理 API Key，通过后端代理转发请求
- 面向用户的场景务必开启流式输出
- 生产环境必须实现指数退避重试机制
- 监控 Token 用量，选择合适的模型规格控制成本
- Function Calling 是构建 AI Agent 的基础，建议优先掌握
:::
