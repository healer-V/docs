---
title: "MCP 概述"
category: "AI · MCP"
tags:
  - MCP
  - Anthropic
  - Protocol
excerpt: "MCP 通过统一的协议规范，让 AI 应用能够安全地连接和使用各种外部工具、数据源和服务。"
date: 2026-03-15
---

# MCP 概述

MCP（Model Context Protocol）定义了 AI 应用与外部服务之间的标准通信方式。本文将深入介绍 MCP 的协议架构、三大核心能力、传输层机制，并通过实际代码带你开发一个 MCP Server 和 Client。

## 一、协议架构

MCP 采用客户端-服务端架构，包含三个核心角色：Host、Client 和 Server。

### 1. 三层角色模型

| 角色 | 职责 | 实例 |
|------|------|------|
| Host | 面向用户的 AI 应用，管理多个 Client | Claude Desktop、Cursor、自研 AI 产品 |
| Client | 协议客户端，与 Server 保持一对一连接 | 由 Host 内部创建和管理 |
| Server | 提供具体能力的轻量级服务 | 文件系统 Server、数据库 Server、GitHub Server |

### 2. 通信流程

一次典型的 MCP 交互流程如下：

1. Host 启动时根据配置初始化一个或多个 Client
2. 每个 Client 与对应的 Server 建立连接并完成能力协商
3. 用户发送请求，Host 将其发送给 LLM
4. LLM 判断需要调用工具，Host 通过对应的 Client 向 Server 发送请求
5. Server 执行操作并返回结果
6. Host 将工具结果传回 LLM，生成最终回复

### 3. 能力协商

Client 和 Server 在建立连接时会进行能力协商（Capability Negotiation），双方各自声明支持的能力：

::: details 能力协商示例

```json
// Server 声明的能力
{
  "capabilities": {
    "tools": { "listChanged": true },
    "resources": { "subscribe": true, "listChanged": true },
    "prompts": { "listChanged": true }
  }
}
```

```json
// Client 声明的能力
{
  "capabilities": {
    "roots": { "listChanged": true },
    "sampling": {}
  }
}
```

:::

## 二、核心能力

MCP Server 通过三种原语向 Client 暴露能力：Resources、Tools 和 Prompts。

### 1. Resources（资源）

Resources 是 Server 暴露给 AI 的数据源，采用 URI 方式标识。AI 可以读取资源内容，但不会修改它们。

| 属性 | 类型 | 说明 |
|------|------|------|
| `uri` | `string` | 资源唯一标识，如 `file:///path/to/doc.md` |
| `name` | `string` | 资源显示名称 |
| `description` | `string` | 资源描述 |
| `mimeType` | `string` | 内容类型，如 `text/plain`、`application/json` |

Resources 分为两种类型：

- **静态资源**：通过 `resources/list` 列出的固定资源
- **动态资源**：通过 URI 模板（Resource Template）按需生成的资源，如 `db://users/{userId}`

### 2. Tools（工具）

Tools 是 Server 暴露给 AI 的可调用函数，LLM 可以根据用户需求自动选择并调用。每个 Tool 包含名称、描述和输入参数的 JSON Schema。

::: warning
Tools 是 MCP 中最强大也最需要谨慎对待的能力。Tool 调用可能产生副作用（如写入数据库、发送消息），Host 应在执行前向用户确认。
:::

### 3. Prompts（提示模板）

Prompts 是 Server 预定义的提示词模板，用于引导 AI 完成特定任务。它们通常由用户主动选择触发，而非 LLM 自动调用。

| 属性 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | 提示模板名称 |
| `description` | `string` | 模板描述 |
| `arguments` | `array` | 模板参数列表 |

## 三、传输层

MCP 支持多种传输方式，不同场景下选择不同的传输层。

### 1. 传输方式对比

| 传输方式 | 通信模型 | 适用场景 | 特点 |
|----------|----------|----------|------|
| stdio | 标准输入/输出 | 本地进程 | 最简单，Host 直接启动 Server 进程 |
| Streamable HTTP | HTTP + SSE | 远程服务 | 支持无状态和有状态两种模式 |
| SSE（旧版） | HTTP + SSE | 远程服务（兼容） | 已被 Streamable HTTP 取代 |

### 2. stdio 传输

stdio 是最常用的本地传输方式。Host 以子进程方式启动 Server，通过标准输入（stdin）发送请求，通过标准输出（stdout）接收响应。

::: tip
stdio 传输方式下，Server 的 stderr 用于输出日志信息，不会干扰协议通信。调试时可以将日志输出到 stderr。
:::

### 3. Streamable HTTP 传输

Streamable HTTP 适用于远程部署的 MCP Server。Client 通过 HTTP POST 发送请求，Server 可以返回普通 JSON 响应或 SSE 流式响应。

## 四、MCP Server 开发

下面使用官方 TypeScript SDK 开发一个提供天气查询和城市信息的 MCP Server。

### 1. 项目初始化

::: details 项目初始化步骤

```bash
mkdir weather-mcp-server && cd weather-mcp-server
npm init -y
npm install @modelcontextprotocol/sdk zod
npm install -D typescript @types/node
npx tsc --init
```

:::

### 2. 实现 Server

::: details 完整 MCP Server 实现

```ts
// src/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 创建 MCP Server 实例
const server = new McpServer({ // [!code highlight]
  name: "weather-server",
  version: "1.0.0",
});

// 模拟天气数据
const weatherDatabase: Record<string, { temperature: number; humidity: number; condition: string }> = {
  北京: { temperature: 18, humidity: 45, condition: "晴" },
  上海: { temperature: 22, humidity: 72, condition: "多云" },
  广州: { temperature: 28, humidity: 80, condition: "阵雨" },
  深圳: { temperature: 27, humidity: 78, condition: "多云" },
};

// 注册 Tool：查询天气
server.tool( // [!code highlight]
  "get_weather",
  "获取指定城市的当前天气信息，包括温度、湿度和天气状况",
  {
    city: z.string().describe("城市名称，如 '北京'、'上海'"),
  },
  async ({ city }) => {
    const weather = weatherDatabase[city];

    if (!weather) {
      return {
        content: [
          {
            type: "text",
            text: `未找到城市 "${city}" 的天气数据。支持的城市：${Object.keys(weatherDatabase).join("、")}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `${city}当前天气：${weather.condition}，温度 ${weather.temperature}°C，湿度 ${weather.humidity}%`,
        },
      ],
    };
  }
);

// 注册 Tool：天气对比
server.tool(
  "compare_weather",
  "对比两个城市的天气情况",
  {
    cityA: z.string().describe("第一个城市名称"),
    cityB: z.string().describe("第二个城市名称"),
  },
  async ({ cityA, cityB }) => {
    const weatherA = weatherDatabase[cityA];
    const weatherB = weatherDatabase[cityB];

    if (!weatherA || !weatherB) {
      return {
        content: [{ type: "text", text: "请输入有效的城市名称" }],
      };
    }

    const tempDiff = Math.abs(weatherA.temperature - weatherB.temperature);
    return {
      content: [
        {
          type: "text",
          text: [
            `${cityA} vs ${cityB} 天气对比：`,
            `- ${cityA}：${weatherA.condition}，${weatherA.temperature}°C，湿度 ${weatherA.humidity}%`,
            `- ${cityB}：${weatherB.condition}，${weatherB.temperature}°C，湿度 ${weatherB.humidity}%`,
            `- 温差：${tempDiff}°C`,
          ].join("\n"),
        },
      ],
    };
  }
);

// 注册 Resource：城市列表
server.resource( // [!code highlight]
  "cities",
  "weather://cities",
  { description: "获取支持查询天气的城市列表", mimeType: "application/json" },
  async () => ({
    contents: [
      {
        uri: "weather://cities",
        mimeType: "application/json",
        text: JSON.stringify(Object.keys(weatherDatabase)),
      },
    ],
  })
);

// 注册 Prompt：天气报告模板
server.prompt( // [!code highlight]
  "weather_report",
  "生成指定城市的详细天气播报",
  { city: z.string().describe("城市名称") },
  ({ city }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `请为 ${city} 生成一份详细的天气播报，包括：
1. 当前天气概况
2. 出行建议
3. 穿衣推荐
请使用亲切自然的播报风格。`,
        },
      },
    ],
  })
);

// 启动 Server
async function main() {
  const transport = new StdioServerTransport(); // [!code highlight]
  await server.connect(transport);
  console.error("Weather MCP Server 已启动"); // 日志输出到 stderr
}

main().catch(console.error);
```

:::

### 3. 配置与运行

编译 TypeScript 后，你需要在 Host 中配置该 Server。以 Claude Desktop 为例：

::: details Claude Desktop 配置文件

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
// %APPDATA%\Claude\claude_desktop_config.json (Windows)
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["/absolute/path/to/weather-mcp-server/dist/index.js"]
    }
  }
}
```

:::

::: tip
对于 Claude Code，配置方式略有不同。你可以在项目根目录的 `.mcp.json` 文件中配置 MCP Server，参考 Claude Code 文档获取详细配置方法。
:::

## 五、MCP Client 集成

如果你正在开发自己的 AI 应用并希望接入 MCP Server，你需要实现 MCP Client。

### 1. 基本 Client 实现

::: details TypeScript MCP Client 实现

```ts
// src/client.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function createMcpClient() {
  const transport = new StdioClientTransport({ // [!code highlight]
    command: "node",
    args: ["./dist/index.js"],
  });

  const client = new Client(
    { name: "my-ai-app", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport); // [!code highlight]

  return client;
}

async function main() {
  const client = await createMcpClient();

  // 列出可用工具
  const { tools } = await client.listTools(); // [!code highlight]
  console.log("可用工具：");
  tools.forEach((tool) => {
    console.log(`  - ${tool.name}: ${tool.description}`);
  });

  // 调用工具
  const result = await client.callTool({ // [!code highlight]
    name: "get_weather",
    arguments: { city: "北京" },
  });
  console.log("天气查询结果：", result.content);

  // 列出可用资源
  const { resources } = await client.listResources();
  console.log("可用资源：", resources);

  // 读取资源
  const citiesResource = await client.readResource({ uri: "weather://cities" });
  console.log("支持的城市：", citiesResource.contents[0].text);

  // 列出可用提示模板
  const { prompts } = await client.listPrompts();
  console.log("可用提示模板：", prompts);

  // 使用提示模板
  const promptResult = await client.getPrompt({
    name: "weather_report",
    arguments: { city: "上海" },
  });
  console.log("提示模板内容：", promptResult.messages);

  await client.close();
}

main().catch(console.error);
```

:::

### 2. 与 LLM 结合使用

在实际 AI 应用中，你需要将 MCP 工具转化为 LLM 可理解的 Tool 定义，并在 LLM 请求工具调用时通过 MCP Client 执行。

::: details 将 MCP 工具与 Claude API 结合

```ts
// src/app.ts
import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  // 1. 初始化 MCP Client
  const transport = new StdioClientTransport({
    command: "node",
    args: ["./dist/index.js"],
  });
  const mcpClient = new Client({ name: "demo-app", version: "1.0.0" }, { capabilities: {} });
  await mcpClient.connect(transport);

  // 2. 获取 MCP 工具并转换为 Claude API 格式
  const { tools: mcpTools } = await mcpClient.listTools();
  const claudeTools = mcpTools.map((tool) => ({ // [!code highlight]
    name: tool.name,
    description: tool.description || "",
    input_schema: tool.inputSchema,
  }));

  // 3. 调用 Claude API
  const anthropic = new Anthropic();
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: "北京和上海哪个城市更热？" },
  ];

  let response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    tools: claudeTools,
    messages,
  });

  // 4. 处理工具调用循环
  while (response.stop_reason === "tool_use") { // [!code highlight]
    const toolUseBlock = response.content.find(
      (block): block is Anthropic.ContentBlock & { type: "tool_use" } =>
        block.type === "tool_use"
    );

    if (!toolUseBlock) break;

    // 通过 MCP Client 执行工具调用
    const toolResult = await mcpClient.callTool({ // [!code highlight]
      name: toolUseBlock.name,
      arguments: toolUseBlock.input as Record<string, unknown>,
    });

    messages.push({ role: "assistant", content: response.content });
    messages.push({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: toolUseBlock.id,
          content: toolResult.content as string,
        },
      ],
    });

    response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      tools: claudeTools,
      messages,
    });
  }

  // 5. 输出最终结果
  const textBlock = response.content.find((block) => block.type === "text");
  if (textBlock && textBlock.type === "text") {
    console.log(textBlock.text);
  }

  await mcpClient.close();
}

main().catch(console.error);
```

:::

## 六、安全性考量

MCP 协议在设计上内置了多层安全机制，在开发和部署时你需要注意以下要点。

### 1. 安全原则

| 原则 | 说明 |
|------|------|
| 用户确认 | 涉及副作用的 Tool 调用必须经用户确认 |
| 最小权限 | Server 只暴露必要的能力，避免过度授权 |
| 数据隔离 | 不同 Server 之间的数据不应互相可见 |
| 输入校验 | Server 必须严格校验所有输入参数 |
| 传输安全 | 远程部署时使用 HTTPS 和认证机制 |

### 2. 认证与授权

对于远程部署的 MCP Server，建议使用 OAuth 2.0 进行认证：

- Server 在 `/.well-known/oauth-authorization-server` 暴露 OAuth 元数据
- Client 通过授权码流程获取访问令牌
- 每次请求在 HTTP Header 中携带 Bearer Token

::: danger
永远不要在 MCP Server 中硬编码数据库密码、API Key 等敏感信息。使用环境变量或密钥管理服务来管理凭证。
:::

## 七、调试与排错

### 1. 调试工具

MCP 官方提供了 Inspector 工具，可以可视化地测试和调试 MCP Server：

::: details 使用 MCP Inspector

```bash
# 安装并启动 Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

:::

Inspector 会启动一个 Web 界面，你可以在其中：

- 查看 Server 暴露的所有 Tools、Resources 和 Prompts
- 手动调用工具并查看返回结果
- 查看完整的协议通信日志

### 2. 常见问题

| 问题 | 可能原因 | 排查方法 |
|------|----------|----------|
| Server 无法启动 | 路径配置错误 | 检查 `command` 和 `args` 的绝对路径 |
| 工具列表为空 | 能力协商失败 | 检查 Server 的 capabilities 声明 |
| 工具调用超时 | Server 处理耗时过长 | 添加超时机制和日志 |
| 连接断开 | 进程崩溃或 stderr 输出混入 stdout | 确保日志输出到 stderr |

::: tip
开发阶段建议在 Server 代码中添加详细的 `console.error` 日志，stdio 传输模式下 stderr 的输出不会影响协议通信，但能帮助你快速定位问题。
:::
