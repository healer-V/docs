---
title: "Agent架构与框架面试题"
category: "面试题"
tags:
  - Agent
  - ReAct
  - LangGraph
  - Spring AI
excerpt: "按国内大厂 Agent 开发岗面经整理：Agent 的定义与核心模块、Agent 与 Workflow 的选型、Agent Loop 的执行链路与终止条件、ReAct、Plan-and-Execute 与 Reflection 的区别，以及 LangChain、LangGraph、Spring AI 等框架的对比与取舍。"
---

# Agent架构与框架面试题

“什么是 Agent，为什么不直接调大模型”“Agent 和 Workflow 怎么选”“ReAct 和 Plan-and-Execute 的区别”几乎是每场 Agent 岗面试的开场题，阿里的一份面经统计中，后两题各有 14 篇面经问到。这些题的难点不在定义，而在于能否说清楚选型依据，并用自己的项目举例。

## 一、Agent 基础

### 1. 什么是 Agent，和直接调用大模型有什么区别？

**Agent 是让大模型在循环中自主决定下一步动作的系统：模型根据目标和当前观察选择调用哪个工具、传什么参数，应用执行工具并把结果反馈给模型，直到任务完成。** 常见的概括是“Agent = 大模型 + 规划 + 记忆 + 工具”。

直接调用大模型是一问一答：模型只能基于训练知识和本次输入生成文本，不能查询实时数据、不能执行操作，也不会根据结果调整做法。Agent 则可以多步执行，例如“帮我查一下订单为什么还没发货，如果超过 3 天就申请催单”，需要查询订单、查询物流、判断时间、调用催单接口，每一步依赖上一步的结果。

面试中常要求“用非技术人员能听懂的话解释 Agent”：普通大模型像一个只能回答问题的顾问，Agent 像一个能自己打电话、查系统、办手续的助理，但要给它划定权限，并在关键操作前请示。

参考：[Anthropic：Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)、[Lilian Weng：LLM Powered Autonomous Agents](https://lilianweng.github.io/posts/2023-06-23-agent/)。

### 2. Agent 和 Workflow 有什么区别，单次提示词、Workflow 和 Agent 怎么选？

**Workflow 由代码预先定义执行路径，模型只在固定步骤中完成子任务；Agent 由模型在运行时决定执行路径。** 选型的依据是任务路径能否预先确定，以及出错的代价有多大。

| 方案 | 适用任务 | 优点 | 缺点 |
|------|----------|------|------|
| 单次提示词 | 一步就能完成，如分类、摘要、抽取 | 最便宜、最快、最稳定 | 不能多步执行 |
| Workflow | 步骤明确，如“提取字段 → 校验 → 入库 → 通知” | 可预测、易测试、成本可控 | 遇到未预料的情况无法灵活处理 |
| Agent | 步骤无法预先枚举，如开放式故障排查、代码修改 | 灵活，能根据中间结果调整 | 成本和延迟波动大，难以测试 |

原则是从简单方案开始，只有简单方案无法满足时才升级。很多生产系统是两者结合：整体用 Workflow 控制主流程，在某个需要灵活决策的节点内部使用 Agent。面试官追问“你的项目为什么用 Agent 而不用 Workflow”时，要说出具体哪一步无法预先确定路径，而不是只说“Agent 更智能”。

参考：[Anthropic：Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)。

### 3. Agent 的核心模块和完整执行链路是什么？

**Agent 系统由模型、运行时（Harness）、工具、记忆和状态组成：模型负责决策，运行时负责循环控制、工具执行、权限检查和终止判断，工具负责与外部系统交互。**

一次任务的执行链路如下：

1. 运行时组装上下文：系统提示、工具定义、相关记忆、对话历史和当前任务。
2. 调用模型，模型返回最终回答，或者返回一个或多个工具调用请求。
3. 运行时校验工具名和参数，检查权限，高风险操作暂停等待人工确认。
4. 执行工具，把结果与对应的调用 ID 关联后追加到上下文中。
5. 检查终止条件：任务完成、达到最大步数、超出 Token 预算、超时或连续失败。
6. 未终止则回到第 1 步；结束时记录终止原因和完整轨迹。

面试官常追问“模型、Runtime 和工具分别负责哪些环节”：模型只“提议”下一步，不直接执行任何代码；执行、权限和终止都由运行时负责。这条边界是 Agent 安全和稳定的基础。

参考：[OpenAI：函数调用](https://developers.openai.com/api/docs/guides/function-calling)。

### 4. Agent Loop 如何判断继续还是结束，怎样避免无限循环？

**模型返回不含工具调用的最终回答时正常结束；但终止不能只依赖模型自己决定，运行时必须设置多重硬性限制。**

| 终止条件 | 防止的问题 |
|----------|------------|
| 最大步数 | 模型反复调用工具不收敛 |
| Token 或费用预算 | 单个任务成本失控 |
| 总超时时间 | 用户长时间等待 |
| 重复调用检测 | 同一工具、相同参数在短时间内重复调用 |
| 连续错误次数 | 工具持续失败时继续盲目重试 |

死循环的常见原因有：工具返回的错误信息模糊，模型不知道如何修正参数；任务目标本身无法完成，但模型没有“放弃”的选项；上下文被压缩后丢失了“这一步已经做过”的信息。除了硬性限制，还应在提示中允许模型在无法完成时报告失败，并让工具返回明确的错误原因。结束时要记录终止原因，“达到最大步数”不能作为成功返回给用户。

参考：[OpenAI：Safety in building agents](https://developers.openai.com/api/docs/guides/agent-builder-safety)。

## 二、Agent 范式

### 1. ReAct 是什么，工作流程和优缺点是什么？

**ReAct（Reasoning + Acting）让模型交替进行推理和行动：每一轮先输出思考（Thought），再给出行动（Action）调用工具，工具结果作为观察（Observation）反馈回来，循环直到模型给出最终答案。**

```text
Thought: 用户问订单为什么没发货，需要先查订单状态
Action: get_order(order_id="1001")
Observation: {"status": "paid", "paid_at": "2026-11-20"}
Thought: 已支付 7 天未发货，需要查仓库状态
Action: get_warehouse_status(order_id="1001")
Observation: {"status": "out_of_stock"}
Final Answer: 订单因缺货暂未发货……
```

优点是每一步的推理过程可见，便于调试；能根据新的观察随时调整方向。缺点是每一步都要调用一次模型，步数多时成本和延迟高；缺少全局规划，复杂任务容易在局部绕圈。现在的模型原生支持函数调用，ReAct 的“Action”通常直接用结构化的工具调用实现，而不再解析文本中的 `Action:` 格式。

参考：[Yao et al.：ReAct](https://arxiv.org/abs/2210.03629)。

### 2. ReAct 和 Plan-and-Execute 有什么区别，怎么选？

**Plan-and-Execute 先由规划器生成完整的步骤列表，再由执行器逐步执行，必要时根据执行结果重新规划（Plan-Execute-Replan）；ReAct 没有预先的全局计划，每一步根据最新观察决定下一步。**

| 维度 | ReAct | Plan-and-Execute |
|------|-------|------------------|
| 规划方式 | 边做边想 | 先规划后执行 |
| 适合任务 | 步骤少、依赖实时反馈的任务 | 步骤多、可以提前分解的复杂任务 |
| 成本 | 每步都调用强模型 | 规划用强模型，执行可用小模型 |
| 风险 | 缺乏全局视角，容易绕圈 | 计划可能过时，需要重新规划机制 |

实际系统常常结合两者：先做一次全局规划，每个步骤内部用 ReAct 执行，执行结果偏离预期时触发重新规划。面经中的追问“为什么 Plan-Execute-Replan 需要一个监管角色”，答案是需要有一个环节对照原始目标检查进度，判断计划是否仍然有效，否则执行器会机械地执行一个已经不合适的计划。

参考：[Wang et al.：Plan-and-Solve Prompting](https://arxiv.org/abs/2305.04091)、[LangGraph：Plan-and-Execute 教程](https://langchain-ai.github.io/langgraph/tutorials/plan-and-execute/plan-and-execute/)。

### 3. Reflection 模式是什么，有什么局限？

**Reflection（反思）让 Agent 在完成一次尝试后评估自己的结果，找出问题并把反思结论作为下一次尝试的输入，常见实现有 Reflexion、Self-Refine。** 适合有明确评判标准的任务，例如代码能否通过测试、答案是否满足约束。

反思最有效的情况是有外部反馈：代码的测试结果、编译错误、工具返回的校验信息。仅靠模型自我评价时，模型往往无法发现自己的错误，甚至会把正确答案改错。所以设计时应优先让反思基于可执行的检查结果，并限制反思轮数，避免成本无限增加。

参考：[Shinn et al.：Reflexion](https://arxiv.org/abs/2303.11366)、[Madaan et al.：Self-Refine](https://arxiv.org/abs/2303.17651)。

## 三、框架选型

### 1. LangChain 和 LangGraph 有什么区别，各有什么缺点？

**LangChain 提供模型、提示、工具、检索等组件的统一抽象，适合快速搭建链式调用；LangGraph 用有状态的图描述流程，节点是处理步骤，边是流转条件，支持循环、分支、检查点持久化和人工中断，适合需要精细控制的 Agent。** LangChain 1.x 的 `create_agent` 已经构建在 LangGraph 运行时之上。

| 维度 | LangChain | LangGraph |
|------|-----------|-----------|
| 抽象方式 | 组件和链 | 状态 + 节点 + 边构成的图 |
| 控制粒度 | 较粗，内部逻辑被封装 | 细，每个节点和转移都显式定义 |
| 状态与恢复 | 需要自行处理 | 内置检查点，可按线程恢复、回溯历史状态 |
| 适合场景 | 原型、简单 RAG 和工具调用 | 长流程、多 Agent、需要人工审批 |

面经中常问的缺点包括：LangChain 抽象层次多，出问题时难以定位是哪一层的行为；版本迭代快，接口变动频繁；简单功能也要引入较重的依赖。LangGraph 的学习成本较高，简单任务用它显得繁琐。面试官追问“为什么不自己写”时，可以说明：简单 Agent Loop 自己写更透明，需要检查点、人工中断和可视化调试时再引入框架。

参考：[LangChain：Agents](https://docs.langchain.com/oss/python/langchain/agents)、[LangGraph：持久化](https://docs.langchain.com/oss/python/langgraph/persistence)。

### 2. LangGraph 的状态和检查点是怎么实现的？

**LangGraph 用一个共享的状态对象在节点之间传递数据，每个节点读取状态并返回需要更新的字段；配置检查点（checkpointer）后，每一步执行完都会把状态快照保存下来，按 `thread_id` 区分不同会话。**

检查点带来了三个能力：中断后从最后一个快照恢复执行；人工审批时在某个节点前暂停（interrupt），收到确认后继续；查看和回到历史快照（time travel），用于调试和重试。生产环境中检查点通常保存在 PostgreSQL、Redis 等持久化存储中，而不是内存。

需要注意的是，恢复执行会重放检查点之后的节点，如果这些节点调用了有副作用的工具（如下单），工具本身必须是幂等的，或者在状态中记录已执行的操作。

参考：[LangGraph：持久化](https://docs.langchain.com/oss/python/langgraph/persistence)、[LangGraph：人工介入](https://docs.langchain.com/oss/python/langgraph/interrupts)。

### 3. Java 技术栈做 Agent，Spring AI 和 LangChain4j 怎么选？

**Spring AI 是 Spring 官方项目，用 Spring Boot 的自动配置和依赖注入方式接入模型，提供 ChatClient、Advisor 拦截链、`@Tool` 工具注解、向量存储和 MCP 支持；LangChain4j 借鉴 LangChain 的设计，提供 AI Services 等声明式接口，不依赖 Spring。** 国内还有 Spring AI Alibaba，在 Spring AI 基础上集成了通义千问等阿里云服务和图编排能力。

| 维度 | Spring AI | LangChain4j |
|------|-----------|-------------|
| 生态 | Spring 官方，与 Spring Boot 深度集成 | 独立框架，也提供 Spring Boot Starter |
| 编程风格 | ChatClient 流式 API、Advisor 链 | AI Services 接口 + 注解 |
| 适合团队 | 已全面使用 Spring Boot 的团队 | 非 Spring 项目或偏好 LangChain 风格的团队 |

选型时看团队现有技术栈、需要接入的模型供应商是否被支持、框架版本是否稳定。面试官追问“为什么选 Spring AI”时，可以从与现有 Spring 项目的配置、监控、事务集成更自然这一点展开，并说明框架只负责调用和编排，Agent 的稳定性仍取决于自己设计的工具、上下文和兜底策略。

参考：[Spring AI：工具调用](https://docs.spring.io/spring-ai/reference/api/tools.html)、[LangChain4j 文档](https://docs.langchain4j.dev/)、[Spring AI Alibaba](https://github.com/alibaba/spring-ai-alibaba)。

### 4. Agent 项目和传统后端项目在架构上有什么差异？

**传统后端的逻辑是确定的：同样的输入走同样的代码路径；Agent 的执行路径由模型在运行时决定，同样的输入可能产生不同的步骤和结果。** 这个差异影响了测试、性能、成本和稳定性设计。

| 维度 | 传统后端 | Agent 系统 |
|------|----------|------------|
| 正确性验证 | 单元测试断言固定输出 | 评测集统计通过率，检查执行轨迹 |
| 延迟 | 毫秒级，可预估 | 秒到分钟级，取决于步数 |
| 成本 | 主要是机器成本 | 按 Token 计费，随步数波动 |
| 交互方式 | 请求-响应 | 长任务，需要流式输出、取消和断点恢复 |
| 失败模式 | 异常和错误码 | 还包括幻觉、选错工具、格式错误、死循环 |

所以 Agent 项目需要额外建设：执行轨迹记录与回放、评测体系、Token 预算控制、流式推送与取消机制、检查点恢复，以及高风险操作的人工确认。

参考：[Anthropic：Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)。
