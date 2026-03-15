---
title: "Agent 基础"
category: "AI · Agent"
tags:
  - Agent
  - ReAct
  - Tool Use
excerpt: "AI Agent 通过感知、推理、决策和行动的循环，结合工具调用能力，实现复杂任务的自动化处理。"
date: 2026-03-15
---

# Agent 基础

AI Agent 是一种能够自主感知环境、进行推理决策并采取行动的智能系统。本文将从 Agent 的基本架构讲起，深入介绍 ReAct 框架、工具调用模式、记忆系统和多 Agent 协作，帮助你理解和构建自己的 Agent 应用。

## 一、什么是 AI Agent

AI Agent（智能体）的核心思想是让大语言模型不仅仅"回答问题"，而是"完成任务"。一个 Agent 会接收用户的高层目标，自动拆解为多个子任务，通过反复调用工具和推理来逐步完成，直到最终达成目标。

### 1. Agent 与 Chatbot 的区别

| 维度 | Chatbot | AI Agent |
|------|---------|----------|
| 交互模式 | 用户主导每一步 | Agent 自主驱动 |
| 任务粒度 | 单轮问答 | 多步骤复合任务 |
| 外部交互 | 仅文本输入输出 | 可调用 API、数据库、文件系统 |
| 错误处理 | 依赖用户纠正 | 自我反思与重试 |
| 状态管理 | 无状态或简单上下文 | 完整的记忆系统 |

### 2. Agent 的典型工作流

一个 Agent 处理任务的完整流程如下：

1. **接收目标**：用户以自然语言描述期望达成的目标
2. **任务规划**：Agent 将目标分解为有序的子任务列表
3. **逐步执行**：依次执行每个子任务，根据需要调用工具
4. **观察结果**：分析工具返回的结果，判断是否符合预期
5. **调整策略**：如果结果不理想，重新规划或重试
6. **输出结果**：所有子任务完成后，汇总并输出最终结果

## 二、Agent 架构

一个标准的 Agent 系统由四个核心模块组成：感知模块、推理模块、行动模块和记忆模块。

### 1. 感知模块（Perception）

感知模块负责接收和理解外部输入，包括：

- 用户的自然语言指令
- 工具执行后返回的结果
- 环境状态变化的通知

### 2. 推理模块（Reasoning）

推理模块是 Agent 的"大脑"，由大语言模型驱动，负责：

- 理解当前任务的上下文
- 判断下一步应该执行什么操作
- 选择合适的工具和参数
- 评估执行结果是否满足预期

### 3. 行动模块（Action）

行动模块负责将推理结果转化为实际操作：

- 调用外部 API（天气查询、搜索引擎等）
- 执行数据库查询或写入
- 读写文件系统
- 运行代码片段

### 4. 记忆模块（Memory）

记忆模块为 Agent 提供上下文信息，分为短期记忆和长期记忆（详见本文第五节）。

## 三、ReAct 框架

ReAct（Reasoning + Acting）是目前最主流的 Agent 框架之一，它将推理和行动交替进行，形成"思考-行动-观察"的循环。

### 1. ReAct 循环

ReAct 的每一轮迭代包含三个步骤：

- **Thought（思考）**：Agent 分析当前状态，推理下一步应该做什么
- **Action（行动）**：根据思考结果，选择并调用一个工具
- **Observation（观察）**：获取工具的执行结果，作为下一轮思考的输入

这个循环不断重复，直到 Agent 认为任务已经完成。

### 2. ReAct 与其他框架的对比

| 框架 | 特点 | 适用场景 |
|------|------|----------|
| ReAct | 推理与行动交替进行 | 通用任务处理 |
| Plan-and-Execute | 先完整规划，再按计划执行 | 复杂多步骤任务 |
| Reflexion | 增加自我反思环节 | 需要高准确率的场景 |
| LATS | 结合树搜索的 Agent | 决策空间大的探索任务 |

### 3. ReAct 实现示例

::: details 使用 LangChain 实现 ReAct Agent

```js
// src/agents/react-agent.js
import { ChatAnthropic } from "@langchain/anthropic";
import { AgentExecutor, createReactAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import { DynamicTool } from "@langchain/core/tools";

// 定义工具
const searchTool = new DynamicTool({
  name: "web_search",
  description: "搜索互联网上的实时信息，输入搜索关键词",
  func: async (query) => { // [!code highlight]
    // 实际项目中接入搜索 API，如 SerpAPI、Tavily
    const response = await fetch(
      `https://api.tavily.com/search?query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Bearer ${process.env.TAVILY_API_KEY}` } }
    );
    const data = await response.json();
    return JSON.stringify(data.results.slice(0, 3));
  },
});

const calculatorTool = new DynamicTool({
  name: "calculator",
  description: "执行数学计算，输入数学表达式，如 '(15 * 24) + 380'",
  func: async (expression) => {
    try {
      const result = new Function(`return ${expression}`)();
      return String(result);
    } catch {
      return "计算表达式无效，请检查格式";
    }
  },
});

// 创建 Agent
const llm = new ChatAnthropic({
  model: "claude-sonnet-4-20250514",
  temperature: 0,
});

const prompt = await pull("hwchase17/react-chat");
const tools = [searchTool, calculatorTool];

const agent = await createReactAgent({ llm, tools, prompt }); // [!code highlight]
const agentExecutor = new AgentExecutor({ agent, tools, verbose: true });

// 执行任务
const result = await agentExecutor.invoke({
  input: "查一下特斯拉当前股价，然后计算买 100 股需要多少钱",
});

console.log(result.output);
```

:::

::: tip
设置 `verbose: true` 可以在控制台看到 Agent 的完整思考过程（Thought/Action/Observation），这对调试和优化 Agent 行为非常有帮助。
:::

## 四、Tool Use 工具调用模式

工具调用是 Agent 实现"行动"能力的基础。你需要定义一组工具的描述和参数格式，让 LLM 根据当前任务自动选择和调用合适的工具。

### 1. 工具定义规范

一个好的工具定义应包含：

- **名称**：简洁且有语义，使用 snake_case 命名
- **描述**：清楚说明工具的功能和使用场景，这是 LLM 选择工具的依据
- **参数 Schema**：使用 JSON Schema 定义输入参数的类型和约束

::: warning
工具描述的质量直接影响 Agent 的调用准确率。描述应该具体明确，避免模糊表述。例如，"查询信息"不如"根据订单号查询订单的物流状态、预计送达时间和当前位置"。
:::

### 2. 自定义工具集示例

::: details 电商场景工具集定义

```js
// src/agents/tools/ecommerce-tools.js
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const queryOrderTool = new DynamicStructuredTool({
  name: "query_order",
  description: "根据订单号查询订单详情，包括商品信息、金额、状态和物流进度",
  schema: z.object({ // [!code highlight]
    orderId: z.string().describe("订单号，格式如 ORD-20260315-001"),
  }),
  func: async ({ orderId }) => {
    // 实际项目中查询数据库
    const orderData = await db.orders.findOne({ id: orderId });
    return JSON.stringify(orderData);
  },
});

const searchProductsTool = new DynamicStructuredTool({
  name: "search_products",
  description: "根据关键词和筛选条件搜索商品列表，返回商品名称、价格和评分",
  schema: z.object({
    keyword: z.string().describe("搜索关键词"),
    minPrice: z.number().optional().describe("最低价格"),
    maxPrice: z.number().optional().describe("最高价格"),
    sortBy: z
      .enum(["price_asc", "price_desc", "rating", "sales"])
      .optional()
      .describe("排序方式"),
  }),
  func: async ({ keyword, minPrice, maxPrice, sortBy }) => {
    const products = await db.products.search({ keyword, minPrice, maxPrice, sortBy });
    return JSON.stringify(products.slice(0, 5));
  },
});

const createRefundTool = new DynamicStructuredTool({
  name: "create_refund",
  description: "为指定订单创建退款申请，需要提供订单号和退款原因",
  schema: z.object({
    orderId: z.string().describe("订单号"),
    reason: z.string().describe("退款原因"),
    amount: z.number().optional().describe("退款金额，默认全额退款"),
  }),
  func: async ({ orderId, reason, amount }) => {
    const refund = await db.refunds.create({ orderId, reason, amount });
    return JSON.stringify({ refundId: refund.id, status: "pending" });
  },
});

export const ecommerceTools = [queryOrderTool, searchProductsTool, createRefundTool];
```

:::

### 3. 工具调用的安全性

在生产环境中，你需要对工具调用做好以下防护：

- **参数校验**：对 LLM 生成的参数做严格的类型和范围校验
- **权限控制**：危险操作（删除、支付）必须要求用户二次确认
- **速率限制**：防止 Agent 在循环中无限调用同一工具
- **超时处理**：为每个工具调用设置合理的超时时间

::: danger
永远不要让 Agent 直接执行未经审查的代码或 SQL 语句。所有涉及数据修改的工具必须经过参数校验和权限检查。
:::

## 五、记忆系统

记忆是 Agent 维持上下文连贯性和积累经验的关键能力，分为短期记忆和长期记忆。

### 1. 短期记忆

短期记忆即当前对话的上下文，包括用户输入、Agent 的思考过程和工具调用结果。受限于 LLM 的上下文窗口大小，短期记忆有容量限制。

常用的短期记忆管理策略：

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| 滑动窗口 | 保留最近 N 轮对话 | 简单对话场景 |
| Token 限制 | 保留最近 N 个 token 的内容 | 精确控制上下文大小 |
| 摘要压缩 | 用 LLM 将历史对话压缩为摘要 | 长对话场景 |
| 重要性过滤 | 保留关键信息，丢弃冗余内容 | 任务导向型 Agent |

### 2. 长期记忆

长期记忆将重要信息持久化存储，使 Agent 能够跨会话保留知识。通常使用向量数据库实现。

::: details 使用向量数据库实现长期记忆

```js
// src/agents/memory/long-term-memory.js
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";

class AgentLongTermMemory {
  constructor() {
    this.embeddings = new OpenAIEmbeddings();
    this.vectorStore = null;
  }

  async initialize() {
    this.vectorStore = new MemoryVectorStore(this.embeddings);
  }

  // 存储记忆
  async saveMemory(content, metadata = {}) { // [!code highlight]
    await this.vectorStore.addDocuments([
      {
        pageContent: content,
        metadata: {
          timestamp: Date.now(),
          ...metadata,
        },
      },
    ]);
  }

  // 检索相关记忆
  async recallMemories(query, topK = 5) { // [!code highlight]
    const results = await this.vectorStore.similaritySearch(query, topK);
    return results.map((doc) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
    }));
  }
}

// 使用示例
const memory = new AgentLongTermMemory();
await memory.initialize();

// Agent 完成任务后保存经验
await memory.saveMemory(
  "用户偏好：回复使用中文，代码示例使用 TypeScript",
  { type: "user_preference" }
);

// 新会话中检索相关记忆
const relevantMemories = await memory.recallMemories("用户的语言偏好");
```

:::

## 六、多 Agent 系统

当任务足够复杂时，单个 Agent 可能难以胜任。多 Agent 系统通过让多个专业化的 Agent 协作来解决问题。

### 1. 协作模式

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| 主从模式 | 一个主 Agent 分配任务给子 Agent | 任务可明确拆分 |
| 对等协作 | 多个 Agent 平等讨论和协作 | 需要多角度分析 |
| 流水线 | Agent 按顺序处理，上游输出是下游输入 | 有明确处理流程 |
| 竞争模式 | 多个 Agent 独立完成同一任务，择优选取 | 需要高质量结果 |

### 2. 多 Agent 协作示例

::: details 主从模式多 Agent 示例

```python
# src/agents/multi_agent.py
from langchain.chat_models import ChatAnthropic
from langchain.agents import AgentExecutor, create_react_agent

class MultiAgentSystem:
    def __init__(self):
        self.llm = ChatAnthropic(model="claude-sonnet-4-20250514")
        self.agents = {}

    def register_agent(self, name, tools, system_prompt):
        """注册一个专业 Agent"""
        agent = create_react_agent(
            llm=self.llm,
            tools=tools,
            prompt=system_prompt,
        )
        self.agents[name] = AgentExecutor(agent=agent, tools=tools)

    async def orchestrate(self, task):  # [!code highlight]
        """主 Agent 协调子 Agent 完成任务"""
        # 1. 主 Agent 分析任务并制定计划
        plan = await self.llm.ainvoke(
            f"请将以下任务拆解为子任务，并指定负责的 Agent：\n{task}\n"
            f"可用 Agent：{list(self.agents.keys())}"
        )

        # 2. 按计划分配子任务
        results = {}
        for subtask in plan.subtasks:
            agent_name = subtask.assigned_agent
            result = await self.agents[agent_name].ainvoke(
                {"input": subtask.description}
            )
            results[subtask.id] = result

        # 3. 汇总结果
        summary = await self.llm.ainvoke(
            f"请根据以下子任务结果，生成最终报告：\n{results}"
        )
        return summary

# 使用示例
system = MultiAgentSystem()
system.register_agent("researcher", research_tools, "你是一位研究分析师...")
system.register_agent("coder", coding_tools, "你是一位高级开发工程师...")
system.register_agent("reviewer", review_tools, "你是一位代码审查专家...")

result = await system.orchestrate(
    "调研 React Server Components 的最新进展，编写一个示例项目，并进行代码审查"
)
```

:::

::: warning
多 Agent 系统的复杂度远高于单 Agent。在开发初期，建议先用单 Agent 验证可行性，只在单 Agent 确实无法满足需求时才引入多 Agent 架构。
:::

## 七、Agent 开发最佳实践

### 1. 设计原则

- **最小权限原则**：每个工具只暴露必要的操作权限
- **失败优雅**：工具调用失败时，Agent 应能自行重试或选择替代方案
- **可观测性**：记录 Agent 的每一步思考和行动，便于调试和优化
- **人机协作**：关键决策节点（如资金操作）设置人工确认环节

### 2. 常见问题与解决方案

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| Agent 陷入死循环 | 工具返回结果不符合预期 | 设置最大迭代次数，添加循环检测 |
| 工具选择错误 | 工具描述不够清晰 | 优化工具描述，添加使用示例 |
| 上下文溢出 | 对话历史过长 | 使用摘要压缩或滑动窗口策略 |
| 幻觉问题 | LLM 编造工具返回结果 | 严格校验工具输出格式 |
| 响应延迟高 | 多轮工具调用累积延迟 | 并行执行独立的工具调用 |

::: tip
建议为 Agent 添加详细的日志记录，包括每轮的 Thought、Action、Observation 内容，以及工具调用的耗时和返回值。这些日志在排查问题时非常有价值。
:::
