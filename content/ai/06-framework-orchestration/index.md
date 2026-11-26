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

### 2. LangChain 核心 {#02-langchain-core}

使用 LangChain 统一模型、消息、工具、结构化结果，并构建与控制 Agent 运行时。

| 序号 | 文章 |
|-----:|------|
| 2.1 | 模型、消息与工具 |
| 2.2 | Agent 构建与运行时 |

### 3. LangGraph 基础 {#03-langgraph-foundation}

使用 State、节点、Reducer、路由和循环表达工作流。

| 序号 | 文章 |
|-----:|------|
| 3.1 | State 与 Schema |
| 3.2 | 节点与 Reducer |
| 3.3 | 路由与循环 |

### 4. 持久执行 {#04-durable-execution}

使用 Thread 和 Checkpoint 支持中断恢复，并控制重放副作用。

| 序号 | 文章 |
|-----:|------|
| 4.1 | Thread 与 Checkpoint |
| 4.2 | 人工中断与恢复 |
| 4.3 | 副作用、重放与重试 |

### 5. 图组合 {#05-graph-composition}

组合并行、动态路由和子图，并选择合适的图 API。

| 序号 | 文章 |
|-----:|------|
| 5.1 | 并行与动态路由 |
| 5.2 | 子图与 API 选择 |

### 6. 测试与交付 {#06-testing-delivery}

测试和诊断图执行，并处理服务部署中的状态兼容。

| 序号 | 文章 |
|-----:|------|
| 6.1 | 图测试与诊断 |
| 6.2 | 服务部署与状态兼容 |

## 三、衔接关系

框架实现完成后进入[应用架构](../07-application-architecture/index.md)，将模型能力和工作流放入真实的服务、会话与任务边界。
