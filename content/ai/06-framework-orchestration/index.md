---
title: "框架与编排"
tags:
  - AI 应用开发
  - LangChain
  - LangGraph
excerpt: "比较原生 SDK、LangChain 与 LangGraph 的边界，学习模型工具封装、状态图、持久执行、图组合和交付测试。"
date: 2026-09-28
prev: false
next: false
---

# 框架与编排

框架用于承载已经明确的模型调用、工具和工作流需求。LangChain 提供模型、消息、工具和 Agent 的常用抽象；LangGraph 使用状态图表达需要分支、循环、持久化和恢复的流程。

::: info 正文状态
本页展示已确认的章节规划。未提供链接的标题尚未生成正文，通过内容与示例验收后才开放阅读。
:::

## 一、模块边界

| 项目 | 内容 |
|------|------|
| 主讲 | LangChain、LangGraph、持久执行、图组合和框架交付 |
| 前置 | [Agent 开发](../05-agent-development/index.md)中的控制循环、状态与工具执行 |
| 不展开 | 重复讲解 Prompt、RAG 和 Agent 的通用原理 |
| 学习结果 | 能选择适当抽象并实现可测试、可恢复的状态化工作流 |

## 二、章节目录

### 1. 框架边界 {#01-framework-boundary}

依据复杂度选择原生 SDK、LangChain 或 LangGraph，并控制版本。

| 序号 | 文章 |
|-----:|------|
| 1.1 | 原生 SDK 与框架 |
| 1.2 | LangChain 与 LangGraph |
| 1.3 | 依赖与版本 |

### 2. LangChain 基础 {#02-langchain-foundation}

使用 LangChain 统一模型、消息、工具、结构化结果和 Agent。

| 序号 | 文章 |
|-----:|------|
| 2.1 | 模型与消息 |
| 2.2 | 工具与结构化结果 |
| 2.3 | Agent 构建 |

### 3. LangChain 运行时 {#03-langchain-runtime}

在运行时传递上下文、状态并通过 Middleware 控制行为。

| 序号 | 文章 |
|-----:|------|
| 3.1 | 上下文与状态 |
| 3.2 | Middleware 与动态控制 |

### 4. LangGraph 基础 {#04-langgraph-foundation}

使用 State、节点、Reducer、路由和循环表达工作流。

| 序号 | 文章 |
|-----:|------|
| 4.1 | State 与 Schema |
| 4.2 | 节点与 Reducer |
| 4.3 | 路由与循环 |

### 5. 持久执行 {#05-durable-execution}

使用 Thread 和 Checkpoint 支持中断恢复，并控制重放副作用。

| 序号 | 文章 |
|-----:|------|
| 5.1 | Thread 与 Checkpoint |
| 5.2 | 人工中断与恢复 |
| 5.3 | 副作用、重放与重试 |

### 6. 图组合 {#06-graph-composition}

组合并行、动态路由和子图，并选择合适的图 API。

| 序号 | 文章 |
|-----:|------|
| 6.1 | 并行与动态路由 |
| 6.2 | 子图与 API 选择 |

### 7. 测试与交付 {#07-testing-delivery}

测试和诊断图执行，并处理服务部署中的状态兼容。

| 序号 | 文章 |
|-----:|------|
| 7.1 | 图测试与诊断 |
| 7.2 | 服务部署与状态兼容 |

## 三、衔接关系

框架实现完成后进入[应用架构](../07-application-architecture/index.md)，将模型能力和工作流放入真实的服务、会话与任务边界。
