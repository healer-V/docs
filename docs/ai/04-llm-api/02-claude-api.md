---
title: "Claude API"
category: "AI · LLM API"
tags:
  - Claude
  - Anthropic
  - API
excerpt: "Claude API 由 Anthropic 提供，支持 Messages API、流式输出和 Tool Use 等特性，以安全性和长上下文处理见长。"
date: 2026-03-15
---

# Claude API

Claude 是 Anthropic 推出的大语言模型，其 API 提供了丰富的能力，包括多轮对话、流式输出、函数调用（Tool Use）、图像理解和扩展思考等。本文将带你从 SDK 安装到高级特性逐步掌握 Claude API 的使用方法。

## 一、SDK 安装与配置

Claude API 提供了官方的 Node.js 和 Python SDK，你可以根据项目技术栈选择对应的 SDK。

### 1. 获取 API Key

前往 [Anthropic Console](https://console.anthropic.com/) 注册账号并创建 API Key。API Key 是访问 Claude API 的唯一凭证，请妥善保管，不要将其提交到代码仓库中。

::: warning
API Key 一旦泄露，他人可以使用你的额度调用 API。建议将 Key 存储在环境变量中，而非硬编码在源码里。
:::

### 2. 安装 SDK

::: code-group

```bash [Node.js]
npm install @anthropic-ai/sdk
```

```bash [Python]
pip install anthropic
```

:::

### 3. 初始化客户端

::: details Node.js 初始化示例

```js
// src/lib/claude-client.js
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // [!code highlight]
});

export default client;
```

:::

::: details Python 初始化示例

```python
# src/lib/claude_client.py
import anthropic

client = anthropic.Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY"),  # [!code highlight]
)
```

:::

::: tip
SDK 默认会读取环境变量 `ANTHROPIC_API_KEY`，如果你已设置该环境变量，可以省略 `apiKey` 参数直接初始化。
:::

## 二、Messages API 基础调用

Messages API 是 Claude 的核心接口，支持单轮和多轮对话。

### 1. 基本请求结构

每次请求需要指定模型名称、最大输出 token 数和消息列表。消息列表中的每条消息包含角色（`user` 或 `assistant`）和内容。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | `string` | 是 | 模型标识，如 `claude-sonnet-4-20250514` |
| `max_tokens` | `number` | 是 | 最大输出 token 数，不同模型上限不同 |
| `messages` | `array` | 是 | 对话消息列表 |
| `system` | `string` | 否 | 系统提示词，用于设定 Claude 的行为和角色 |
| `temperature` | `number` | 否 | 采样温度，范围 0-1，默认 1 |

### 2. 单轮对话

::: details 单轮对话调用示例

```js
// src/examples/simple-message.js
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

async function askClaude(question) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      { role: "user", content: question }
    ],
  });

  return response.content[0].text; // [!code highlight]
}

const answer = await askClaude("什么是 RESTful API？请用简洁的语言解释。");
console.log(answer);
```

:::

### 3. 多轮对话

多轮对话需要将历史消息依次传入 `messages` 数组，Claude 会根据完整的对话上下文生成回复。

::: details 多轮对话示例

```js
// src/examples/multi-turn.js
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const conversationHistory = [];

async function chat(userMessage) {
  conversationHistory.push({ role: "user", content: userMessage });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: "你是一位经验丰富的前端架构师，擅长 React 和 Vue 技术栈。",
    messages: conversationHistory, // [!code highlight]
  });

  const assistantMessage = response.content[0].text;
  conversationHistory.push({ role: "assistant", content: assistantMessage });

  return assistantMessage;
}

await chat("Vue 3 的响应式原理是什么？");
await chat("和 Vue 2 的实现有什么区别？"); // Claude 能理解这里的"它"指 Vue 3
```

:::

## 三、System Prompt 系统提示词

System Prompt 用于在对话开始前为 Claude 设定角色、行为规范和输出格式，它不出现在对话消息中，但会影响 Claude 的所有回复。

### 1. 使用场景

| 场景 | 示例 |
|------|------|
| 角色设定 | "你是一位资深 TypeScript 开发者" |
| 输出格式 | "请始终使用 JSON 格式输出" |
| 行为约束 | "回答限制在 200 字以内" |
| 领域限定 | "仅回答与前端开发相关的问题" |

### 2. 最佳实践

::: details System Prompt 使用示例

```js
// src/examples/system-prompt.js
const response = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 2048,
  system: `你是一位代码审查专家，具备以下特点：
1. 重点关注代码的可读性、性能和安全性
2. 对每个问题给出严重程度评级：🔴 严重 / 🟡 建议 / 🟢 良好
3. 给出具体的修改建议和修改后的代码示例
4. 使用中文回复`, // [!code highlight]
  messages: [
    {
      role: "user",
      content: `请审查以下代码：
\`\`\`js
app.get('/user', async (req, res) => {
  const userId = req.query.id;
  const result = await db.query('SELECT * FROM users WHERE id = ' + userId);
  res.json(result);
});
\`\`\``
    }
  ],
});
```

:::

::: danger
上面示例中的被审查代码存在 SQL 注入漏洞。在实际开发中，永远不要用字符串拼接构建 SQL 查询，应使用参数化查询。
:::

## 四、流式输出

流式输出让 Claude 的回复像打字一样逐步呈现，大幅提升用户体验，尤其适合长文本生成场景。

### 1. Node.js 流式调用

::: details Node.js 流式输出示例

```js
// src/examples/streaming.js
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

async function streamChat(userMessage) {
  const stream = await client.messages.stream({ // [!code highlight]
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [{ role: "user", content: userMessage }],
  });

  for await (const event of stream) { // [!code highlight]
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      process.stdout.write(event.delta.text);
    }
  }

  const finalMessage = await stream.finalMessage();
  console.log("\n\n使用 token:", finalMessage.usage);
}

await streamChat("请详细介绍 JavaScript 的事件循环机制。");
```

:::

### 2. Python 流式调用

::: details Python 流式输出示例

```python
# src/examples/streaming.py
import anthropic

client = anthropic.Anthropic()

with client.messages.stream(
    model="claude-sonnet-4-20250514",
    max_tokens=2048,
    messages=[{"role": "user", "content": "请详细介绍 Python 的 GIL 机制。"}],
) as stream:  # [!code highlight]
    for text in stream.text_stream:  # [!code highlight]
        print(text, end="", flush=True)
```

:::

## 五、Tool Use（函数调用）

Tool Use 允许 Claude 在对话过程中调用你预定义的外部工具（函数），实现查询数据库、调用 API、执行计算等操作。

### 1. 工作流程

Tool Use 遵循以下流程：

1. 你在请求中定义可用的工具（名称、描述、参数 schema）
2. Claude 根据用户提问判断是否需要调用工具
3. 如果需要，Claude 返回 `tool_use` 类型的内容块，包含工具名和参数
4. 你的代码执行对应的函数，将结果以 `tool_result` 消息返回
5. Claude 根据工具返回结果生成最终回复

### 2. 完整示例

::: details Tool Use 完整示例

```js
// src/examples/tool-use.js
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// 定义工具
const tools = [
  {
    name: "get_weather",
    description: "获取指定城市的当前天气信息，包括温度、湿度和天气状况",
    input_schema: { // [!code highlight]
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "城市名称，如 '北京'、'上海'",
        },
        unit: {
          type: "string",
          enum: ["celsius", "fahrenheit"],
          description: "温度单位",
        },
      },
      required: ["city"],
    },
  },
  {
    name: "search_products",
    description: "根据关键词搜索商品列表",
    input_schema: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "搜索关键词" },
        maxPrice: { type: "number", description: "最高价格" },
        category: { type: "string", description: "商品分类" },
      },
      required: ["keyword"],
    },
  },
];

// 模拟工具执行
function executeTool(toolName, toolInput) {
  if (toolName === "get_weather") {
    return { city: toolInput.city, temperature: 22, humidity: 65, condition: "晴" };
  }
  if (toolName === "search_products") {
    return {
      results: [
        { name: "TypeScript 编程指南", price: 79.9, rating: 4.8 },
        { name: "深入理解 JavaScript", price: 99.0, rating: 4.9 },
      ],
    };
  }
}

async function chatWithTools(userMessage) {
  let messages = [{ role: "user", content: userMessage }];

  // 第一次请求：Claude 决定是否需要调用工具
  let response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    tools,
    messages,
  });

  // 如果 Claude 需要调用工具
  while (response.stop_reason === "tool_use") { // [!code highlight]
    const toolUseBlock = response.content.find((b) => b.type === "tool_use");
    const toolResult = executeTool(toolUseBlock.name, toolUseBlock.input);

    messages.push({ role: "assistant", content: response.content });
    messages.push({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: toolUseBlock.id,
          content: JSON.stringify(toolResult),
        },
      ],
    });

    response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      tools,
      messages,
    });
  }

  return response.content[0].text;
}

const answer = await chatWithTools("北京今天天气怎么样？适合户外运动吗？");
console.log(answer);
```

:::

## 六、Vision 图像理解

Claude 支持在对话中传入图像，实现图像描述、OCR、图表分析等能力。图像可以通过 Base64 编码或 URL 方式传入。

### 1. 支持的图像格式

| 格式 | MIME 类型 | 说明 |
|------|-----------|------|
| JPEG | `image/jpeg` | 常见照片格式 |
| PNG | `image/png` | 支持透明通道 |
| GIF | `image/gif` | 支持静态和动态 |
| WebP | `image/webp` | 高效压缩格式 |

### 2. 图像输入示例

::: details Base64 图像输入示例

```js
// src/examples/vision.js
import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";

const client = new Anthropic();

async function analyzeImage(imagePath, question) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");
  const mimeType = imagePath.endsWith(".png") ? "image/png" : "image/jpeg";

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image", // [!code highlight]
            source: {
              type: "base64",
              media_type: mimeType,
              data: base64Image,
            },
          },
          {
            type: "text",
            text: question,
          },
        ],
      },
    ],
  });

  return response.content[0].text;
}

const description = await analyzeImage(
  path.resolve("assets/architecture-diagram.png"),
  "请分析这张系统架构图，描述各模块之间的关系。"
);
console.log(description);
```

:::

::: tip
URL 方式传入图片时，将 `source` 中的 `type` 改为 `"url"`，并提供 `url` 字段即可，无需 Base64 编码。
:::

## 七、Extended Thinking 扩展思考

Extended Thinking 让 Claude 在回复之前进行深度推理，适合复杂的数学、逻辑和编程问题。开启后，Claude 会先输出思考过程（thinking block），再输出最终回答。

### 1. 使用方式

::: details 扩展思考示例

```js
// src/examples/extended-thinking.js
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

async function deepReasoning(question) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16000,
    thinking: { // [!code highlight]
      type: "enabled",
      budget_tokens: 10000, // 思考过程的最大 token 数
    },
    messages: [{ role: "user", content: question }],
  });

  // 解析思考过程和最终回答
  for (const block of response.content) {
    if (block.type === "thinking") {
      console.log("=== 思考过程 ===");
      console.log(block.thinking);
    }
    if (block.type === "text") {
      console.log("\n=== 最终回答 ===");
      console.log(block.text);
    }
  }
}

await deepReasoning(
  "设计一个支持百万级并发的 WebSocket 消息推送系统，请给出完整的架构方案。"
);
```

:::

::: warning
开启 Extended Thinking 会消耗更多 token。`budget_tokens` 设置的是思考过程的上限，`max_tokens` 必须大于 `budget_tokens`。建议仅在需要深度推理的场景中使用。
:::

### 2. 适用场景

| 场景 | 说明 |
|------|------|
| 复杂算法设计 | 需要多步推理的算法问题 |
| 系统架构设计 | 需要权衡多种因素的技术方案 |
| 代码调试 | 追踪复杂 Bug 的根因分析 |
| 数学证明 | 需要严格逻辑推导的数学问题 |

## 八、错误处理与最佳实践

### 1. 常见错误码

| 状态码 | 错误类型 | 处理方式 |
|--------|----------|----------|
| 400 | `invalid_request_error` | 检查请求参数格式 |
| 401 | `authentication_error` | 检查 API Key 是否正确 |
| 429 | `rate_limit_error` | 降低请求频率或使用指数退避重试 |
| 500 | `api_error` | Anthropic 服务端错误，稍后重试 |
| 529 | `overloaded_error` | API 过载，使用退避策略重试 |

### 2. 重试机制

::: details 带重试的请求封装

```js
// src/utils/claude-request.js
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

async function createMessageWithRetry(params, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await client.messages.create(params);
    } catch (error) {
      if (error instanceof Anthropic.RateLimitError && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 指数退避：2s, 4s, 8s
        console.warn(`请求被限流，${delay / 1000}s 后重试（第 ${attempt} 次）`);
        await new Promise((resolve) => setTimeout(resolve, delay)); // [!code highlight]
        continue;
      }
      throw error;
    }
  }
}

export { createMessageWithRetry };
```

:::

### 3. Token 用量优化

- 精简 System Prompt，避免冗余描述
- 多轮对话中定期裁剪早期不再需要的历史消息
- 使用 `max_tokens` 限制输出长度，避免生成过长的回复
- 对于批量处理任务，使用 Batch API 降低成本（价格为标准 API 的 50%）

::: tip
每次请求的响应中都会返回 `usage` 字段，包含 `input_tokens` 和 `output_tokens`，你可以据此监控和优化 token 消耗。
:::
