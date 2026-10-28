---
title: "AI 导航新增 LangChain 专题设计"
tags:
  - AI
  - LangChain
  - 知识目录
excerpt: "在现有 AI 应用开发知识体系中增加独立 LangChain 专题，明确其与 Agent、RAG、模型接入及 LangGraph 的职责边界，并保持既有专题路径稳定。"
date: 2026-09-22
---

# AI 导航新增 LangChain 专题设计

当前 AI 导航将 LangGraph 单独放在“编排框架”分组，但缺少位于通用 Agent 知识与低层图编排之间的 LangChain 实现层。LangChain 提供模型、消息、工具、结构化结果、Agent Harness 和 Middleware 等高层开发接口；LangGraph 则负责显式状态、分支循环、持久执行、中断恢复等低层编排能力。两者应作为相邻但职责不同的专题。

## 一、目标与范围

### 1. 调整目标

| 目标 | 验收结果 |
|------|----------|
| 增加 LangChain 专题 | AI 顶部导航和侧栏能够展示独立的 LangChain 学习入口 |
| 明确框架层次 | 导航顺序为 LangChain → LangGraph，读者先学习高层应用框架，再按需要进入低层编排 |
| 避免内容重复 | LangChain 只主讲框架 API 与工程落地，不重复 Agent、RAG、模型接入和评测专题的通用原理 |
| 保持现有入口稳定 | 不移动或重命名现有 LangGraph、AI Infra 等专题路径 |
| 不创建空正文 | 本次只生成专题目录页和目录规划，不创建 15 个空 Markdown 文章文件 |

### 2. 修改边界

本次修改 AI 目录数据、导航分组名称和新增 LangChain 专题首页。以下内容不在本次范围内：

- 不编写 15 篇 LangChain 正文；
- 不迁移现有 LangGraph 专题路径；
- 不修改 Agent、RAG、模型接入和评测专题的现有章节；
- 不整理或删除旧 AI 目录；
- 不提交或推送 Git 变更。

## 二、导航与路径

### 1. 导航分组

“编排框架”调整为“框架与编排”，专题顺序如下：

| 顺序 | 专题 | 定位 |
|----:|------|------|
| 1 | LangChain | 使用高层框架接口组合模型、工具、Agent 与 Middleware |
| 2 | LangGraph | 使用低层图运行时表达状态、路由、循环、持久化与恢复 |

### 2. 标识与路径

新专题使用以下稳定标识：

| 项目 | 值 |
|------|----|
| 模块 ID | `AI10` |
| 专题目录 | `content/ai/10-langchain/` |
| 专题首页 | `content/ai/10-langchain/index.md` |
| 页面路径 | `/ai/10-langchain/` |
| 导航分组 | 框架与编排 |

采用 `AI10` 和 `10-langchain` 是为了避免重编号导致现有 LangGraph、评测、AI Infra 和应用开发入口发生迁移。模块 ID 用于稳定识别，实际学习顺序由目录数据和导航顺序表达。

## 三、LangChain 章节目录

LangChain 专题规划为 5 章、15 篇文章。

| 章节 | 文章 | 章节职责 |
|------|------|----------|
| 第 1 章：LangChain 入门 | 1.1 LangChain 定位与技术栈<br>1.2 环境与第一个应用<br>1.3 包结构与版本边界 | 区分 LangChain、LangGraph 与 LangSmith，建立可运行的最小 LangChain 应用，并识别核心包与集成包。 |
| 第 2 章：模型与消息 | 2.1 模型初始化与调用<br>2.2 消息与内容块<br>2.3 流式响应与调用信息 | 使用 LangChain 统一模型接口处理消息、内容块、流式事件和调用元数据。 |
| 第 3 章：工具与结构化结果 | 3.1 工具定义与参数 Schema<br>3.2 工具运行上下文<br>3.3 结构化结果 | 将函数定义为可验证工具，传递运行上下文，并把模型结果约束为程序可消费的结构。 |
| 第 4 章：Agent 与中间件 | 4.1 `create_agent` 与执行循环<br>4.2 Agent 状态与运行上下文<br>4.3 Middleware 与动态控制 | 使用 Agent Harness 组合模型、工具、状态与 Middleware，并根据运行条件调整模型、工具和执行策略。 |
| 第 5 章：工程集成 | 5.1 模型与工具适配<br>5.2 Agent 测试与故障诊断<br>5.3 从 LangChain 进入 LangGraph | 处理集成边界、测试和诊断，并判断何时从高层 Agent 接口下沉到 LangGraph 编排。 |

文章编号使用 `AI10-A<章号>-<篇号>`，章节目录和文件名使用两位连续编号、小写英文及连字符。目录数据先保留规划标题；正文完成并通过验收后再增加 `publishedLink`。

## 四、专题边界

| 相邻专题 | LangChain 主讲 | 相邻专题继续主讲 |
|----------|----------------|------------------|
| 模型接入 | LangChain 模型抽象、初始化方式和适配接口 | 原生模型请求、响应协议、错误、重试、限流和能力契约 |
| Agent | `create_agent`、运行上下文和 Middleware 的具体使用 | Agent 循环、工具安全、记忆、协作、MCP、Skills 与生产测评的通用原理 |
| RAG | 嵌入模型、检索器或工具的最小接入方式 | 文档处理、索引、检索、引用、评测、优化和知识库演进的完整链路 |
| LangGraph | 何时需要下沉，以及 LangChain 组件如何作为图节点使用 | State、Reducer、路由、循环、持久化、中断恢复、子图与图服务 |
| 评测与安全 | 为测试与诊断暴露可观察结果 | 评测数据、回归比较、信任边界、发布门禁和线上反馈 |

::: warning 不把 LangChain 写成全部 AI 能力的总入口

LangChain 是实现选择，不是模型接口、RAG、Agent 和评测知识的替代品。专题正文只解释框架特有的 API、组合方式和工程边界；通用原理链接到对应主讲专题，并保留理解当前示例所需的最小上下文。

:::

## 五、官方基线

| 资料 | 本设计采用的事实边界 |
|------|----------------------|
| [LangChain 概览](https://docs.langchain.com/oss/python/langchain/overview) | LangChain 提供可配置的 Agent Harness、统一模型接口、工具与 Middleware；其 Agent 构建在 LangGraph 之上 |
| [LangChain Agents](https://docs.langchain.com/oss/python/langchain/agents) | `create_agent` 围绕模型、工具、提示和 Middleware 组织 Agent 执行循环 |
| [LangGraph 概览](https://docs.langchain.com/oss/python/langgraph/overview) | LangGraph 是面向长时间、有状态 Agent 的低层编排框架与运行时，负责持久执行、流式、人工介入和状态管理 |

目录只采用上述稳定职责划分，不在目录页写入具体模型名称、短期版本排行或尚未验证的 API 行为。正文生成时仍需重新核对目标版本和对应官方 API。

## 六、数据与页面调整

| 文件 | 调整内容 |
|------|----------|
| `.vitepress/themeConfig/catalogs/ai.js` | 目录版本升级；在 LangGraph 前增加 AI10；将 LangChain 与 LangGraph 的分组统一为“框架与编排” |
| `content/ai/10-langchain/index.md` | 新增专题目标、章节职责、15 篇规划文章和官方资料入口 |
| `scripts/docs/__tests__/topic-navigation.test.mjs` | 更新已批准的专题顺序、目录总量、导航分组和 LangChain 章节契约 |

侧栏与顶部导航继续由现有目录生成器产生，不手写重复导航项。未完成文章没有 `publishedLink`，因此侧栏只显示标题，不开放无效链接。

## 七、验证方案

| 顺序 | 验证项 | 通过条件 |
|----:|--------|----------|
| 1 | 目录数据加载 | AI 目录包含 10 个专题、52 章、159 篇文章，模块 ID、目录和文件名无重复 |
| 2 | 导航顺序 | 顶部导航出现“框架与编排”，其中 LangChain 位于 LangGraph 前 |
| 3 | 链接有效性 | `/ai/10-langchain/` 对应真实 `index.md`，不存在指向未创建正文的链接 |
| 4 | 文档规范检查 | 专题首页 Frontmatter、标题层级、章节编号和容器语法正确 |
| 5 | 自动化测试 | `pnpm docs:test` 通过 |
| 6 | 构建与页面检查 | AI 所属构建单元通过，复用现有本地服务检查顶部导航、侧栏和专题首页 |

## 八、实施顺序

| 顺序 | 操作 |
|----:|------|
| 1 | 在 AI 目录数据中加入 AI10 的 5 章、15 篇规划条目 |
| 2 | 调整 LangChain 与 LangGraph 的导航分组和显示顺序 |
| 3 | 新建 LangChain 专题首页，不创建空正文文件 |
| 4 | 执行目录一致性、链接、测试、构建和浏览器检查 |

实施只修改本设计列出的目录数据和新增专题首页。若验证发现现有旧目录冲突，只记录问题，不借本次任务迁移或删除历史文件。
