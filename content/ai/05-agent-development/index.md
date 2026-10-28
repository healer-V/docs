---
title: "Agent 开发"
tags:
  - AI 应用开发
  - Agent
  - MCP
excerpt: "从 Agent 控制循环和工具契约出发，系统学习权限隔离、状态记忆、工作流协作、MCP 集成与生产控制。"
date: 2026-09-28
prev: false
next: false
---

# Agent 开发

Agent 允许模型在受控循环中选择工具和下一步动作，但模型不应直接获得无限权限。应用仍需负责工具契约、身份授权、状态持久化、失败恢复和终止条件。

::: info 正文状态
本页展示当前章节安排，内容按知识依赖、可靠资料和示例验证持续核对。未提供链接的标题尚未生成正文，通过内容与示例验收后才开放阅读。
:::

## 一、模块边界

| 项目 | 内容 |
|------|------|
| 主讲 | 控制循环、工具执行、权限、状态、协作、MCP 和生产约束 |
| 前置 | [模型接入](../02-model-integration/01-request-response/01-input-items-content-types.md)中的请求响应契约与工具调用 |
| 不展开 | LangChain/LangGraph API 细节和企业统一安全治理 |
| 学习结果 | 能构建有权限边界、可恢复、可终止的工具型 Agent |

## 二、章节目录

### 1. Agent 模型 {#01-agent-model}

区分 Agent 与确定性工作流，理解受控的观察与行动循环。

| 序号 | 文章 |
|-----:|------|
| 1.1 | [Agent 与工作流](./01-agent-model/01-agent-workflows.md) |
| 1.2 | [控制循环](./01-agent-model/02-control-loop.md) |
| 1.3 | [首个 Agent 与结果验证](./01-agent-model/03-first-agent-validation.md) |

### 2. 工具执行 {#02-tool-execution}

以明确契约执行工具，并处理失败、幂等和结果核对。

| 序号 | 文章 |
|-----:|------|
| 2.1 | [工具契约](./02-tool-execution/01-tool-contracts.md) |
| 2.2 | [执行器与错误](./02-tool-execution/02-executors-errors.md) |
| 2.3 | [幂等与结果核对](./02-tool-execution/03-idempotency-result-verification.md) |

### 3. 权限与隔离 {#03-permissions-isolation}

限制工具权限、凭据暴露和高风险动作，提供人工确认。

| 序号 | 文章 |
|-----:|------|
| 3.1 | [工具权限与人工确认](./03-permissions-isolation/01-tool-permissions-human-approval.md) |
| 3.2 | [沙箱与凭据边界](./03-permissions-isolation/02-sandbox-credential-boundaries.md) |

### 4. 状态与记忆 {#04-state-memory}

管理任务状态、检查点、记忆和可恢复执行。

| 序号 | 文章 |
|-----:|------|
| 4.1 | [任务状态与检查点](./04-state-memory/01-task-state-checkpoints.md) |
| 4.2 | [Agent 记忆](./04-state-memory/02-agent-memory.md) |
| 4.3 | [失败恢复](./04-state-memory/03-failure-recovery.md) |

### 5. 流程与协作 {#05-workflows-collaboration}

组合工作流、委派和多 Agent 协作，并处理结果冲突。

| 序号 | 文章 |
|-----:|------|
| 5.1 | [工作流编排](./05-workflows-collaboration/01-workflow-orchestration.md) |
| 5.2 | [委派与多 Agent](./05-workflows-collaboration/02-delegation-multi-agent.md) |
| 5.3 | [结果合并与冲突](./05-workflows-collaboration/03-result-merging-conflicts.md) |

### 6. MCP {#06-mcp}

理解 MCP 原语、连接方式、授权和版本兼容边界。

| 序号 | 文章 |
|-----:|------|
| 6.1 | MCP 架构与原语 |
| 6.2 | 本地 MCP 集成 |
| 6.3 | 远程授权与版本兼容 |

### 7. 生产控制 {#07-production-control}

限制步骤和预算，并管理 Agent 版本、发布和恢复。

| 序号 | 文章 |
|-----:|------|
| 7.1 | 步数、预算与终止 |
| 7.2 | Agent 版本与发布恢复 |

## 三、衔接关系

理解 Agent 的通用机制后进入[框架与编排](../06-framework-orchestration/index.md)，再使用 LangChain 与 LangGraph 实现状态化工作流。
