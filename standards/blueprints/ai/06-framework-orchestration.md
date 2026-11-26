---
title: "框架与编排模块蓝图"
tags:
  - AI 应用开发
  - 模块蓝图
  - LangGraph
excerpt: "落实已确认的六章十五篇目录，规划 LangChain 与 LangGraph 的知识归属、依赖、逐篇职责和验证方案，以人工中断与恢复作为样板候选。"
date: 2026-11-18
---

# 框架与编排模块蓝图

框架与编排负责把第 5 章已经讲清的 Agent 循环、工具执行、状态与工作流，映射到 LangChain 与 LangGraph 的具体抽象上，并说明框架接管了什么、仍需应用负责什么。知识讲解沿用 HTML、JavaScript 已确认的方式：先建立框架对象与运行机制，再给出可观察证据和失败边界；每篇示例从读者新建的空目录独立复现，不使用贯穿工程或统一业务场景。

目录原于 2026-11-15 由用户确认（7 章 18 篇），2026-11-23 经用户审查调整为 6 章 15 篇（将原 02 章 LangChain 基础与原 03 章 LangChain 运行时合并为新 02 章 LangChain 核心，从 5 篇缩减至 2 篇）；本蓝图已同步更新，**待用户确认**。正文尚未编写，下文所有执行证据均为计划验证，不表示已经运行。

## 一、教学契约与边界

| 字段 | 内容 |
|------|------|
| 模块 | AI06 框架与编排 |
| 位置 | `content/ai/06-framework-orchestration/` |
| 主方向 | AI 工程：应用与工作流层；框架对象、状态化执行、持久化与图组合 |
| 辅助方向 | Python 类型注解、`TypedDict` 与 pytest；只解释当前示例所需部分 |
| 读者基线 | 已完成 AI02 工具调用与结构化输出、AI05 控制循环、状态与检查点；能读写 Python 并运行 pytest |
| 当前方向起点 | LangChain、LangGraph 的包结构、消息对象、图、Reducer、Checkpointer、中断等框架概念均从零解释 |
| 最终能力 | 能判断何时引入框架，用 LangChain 构建带工具与 Middleware 的 Agent，用 LangGraph 表达带路由、循环、并行、子图、检查点与人工中断的工作流，并能测试图、诊断失败、处理状态 Schema 变更 |
| 执行基线 | Python 3.12.16；langchain 1.5.0、langchain-core 1.8.1、langchain-openai 1.8.0、langgraph 1.2.22、langgraph-checkpoint 4.3.2、langgraph-checkpoint-sqlite 3.1.3、pytest 9.2.0（PyPI 2026-11-18 核对，尚未在空目录安装验证） |
| 在线模型基线 | 涉及真实模型的文章使用 `langchain-openai` 接 Responses API 方向；具体模型名、账户可用性在相应文章开始前锁定并实测 |
| 范围排除 | 不重讲 Prompt、RAG、Agent 通用原理和工具调用协议；不做框架 API 全量手册；不展开 LangSmith 平台、LangGraph Platform 托管部署、JavaScript 版本与 DSH 预留 |
| 风格约束 | 每篇自带最小图或 Agent；图逻辑优先用纯函数和假模型实现，必须使用真实模型时单独说明；术语首次出现即解释 |

外部基础入口为 [Python typing](https://docs.python.org/3.12/library/typing.html) 与 [pytest 文档](https://docs.pytest.org/en/stable/)。跨模块前置以 [Agent 开发模块蓝图](./05-agent-development.md) 的知识项 ID 引用；本模块只做框架映射，不重复讲解通用机制。

唯一主讲约定：工作流与多 Agent 的设计原理归 AI05，本模块只讲图模型如何实现已知工作流；Trace 归 AI08，本模块只讲框架自带的流式事件与状态历史；服务部署归 AI10，本模块只讲框架交付约束与状态兼容。

## 二、来源与执行状态

下列来源于 2026-11-18 核对可访问性与页面主题。LangChain 文档站存在重定向：`langgraph/durable-execution` 当前落在 Persistence 页，`langgraph/choosing-apis` 当前落在 Functional API 页，因此下表引用实际承载内容的页面。

| ID | 来源 | 支撑范围 |
|----|------|----------|
| S01 | [LangChain overview](https://docs.langchain.com/oss/python/langchain/overview)、[LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) | 两个库的定位与分层 |
| S02 | [LangChain v1 release notes](https://docs.langchain.com/oss/python/releases/langchain-v1) | `create_agent`、`langchain-classic` 迁移边界 |
| S03 | [Versioning](https://docs.langchain.com/oss/python/versioning)、[Release policy](https://docs.langchain.com/oss/python/release-policy) | 版本语义、弃用与升级 |
| S04 | [Models](https://docs.langchain.com/oss/python/langchain/models)、[Messages](https://docs.langchain.com/oss/python/langchain/messages) | `init_chat_model`、消息与内容块 |
| S05 | [Tools](https://docs.langchain.com/oss/python/langchain/tools)、[Structured output](https://docs.langchain.com/oss/python/langchain/structured-output) | 工具定义、`bind_tools`、结构化结果 |
| S06 | [Agents](https://docs.langchain.com/oss/python/langchain/agents) | `create_agent` 参数、循环与输出 |
| S07 | [Runtime](https://docs.langchain.com/oss/python/langchain/runtime)、[Short-term memory](https://docs.langchain.com/oss/python/langchain/short-term-memory) | 运行时上下文、`ToolRuntime` 与 Agent 状态 |
| S08 | [Middleware overview](https://docs.langchain.com/oss/python/langchain/middleware)、[Custom middleware](https://docs.langchain.com/oss/python/langchain/middleware/custom)、[Prebuilt middleware](https://docs.langchain.com/oss/python/langchain/middleware/built-in) | 钩子、执行顺序与预置中间件 |
| S09 | [Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)、[Build checklist for the Graph API](https://docs.langchain.com/oss/python/langgraph/use-graph-api) | State、节点、边、Reducer、`Command`、`Send`、递归上限 |
| S10 | [Persistence](https://docs.langchain.com/oss/python/langgraph/persistence)、[Checkpointers](https://docs.langchain.com/oss/python/langgraph/checkpointers) | Thread、Checkpoint、状态历史、durability、SQLite 后端 |
| S11 | [Interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts)、[Human-in-the-loop](https://docs.langchain.com/oss/python/langchain/human-in-the-loop) | `interrupt()`、`Command(resume=...)` 与 HITL 中间件 |
| S12 | [Fault tolerance](https://docs.langchain.com/oss/python/langgraph/fault-tolerance) | `RetryPolicy`、幂等与恢复 |
| S13 | [Subgraphs](https://docs.langchain.com/oss/python/langgraph/use-subgraphs)、[Functional API overview](https://docs.langchain.com/oss/python/langgraph/functional-api) | 子图状态映射、`@entrypoint` 与 `@task`、API 选择 |
| S14 | [LangGraph test](https://docs.langchain.com/oss/python/langgraph/test)、[LangChain test](https://docs.langchain.com/oss/python/langchain/test)、[Streaming](https://docs.langchain.com/oss/python/langgraph/streaming) | 图测试、假模型与流模式诊断 |
| S15 | [Deployment](https://docs.langchain.com/oss/python/langgraph/deploy)、[Run a local server](https://docs.langchain.com/oss/python/langgraph/local-server) | 服务化交付的框架约束 |
| S16 | PyPI JSON（2026-11-18） | 第一节执行基线的版本号与 `requires_python` |

框架文档会随小版本更新且不标注页面版本，正文写作前必须对照锁定版本的 API 参考与实际运行结果，以运行结果为准；与文档不一致时在文章中标注差异，不按文档猜测。

## 三、知识项与覆盖矩阵

每项拥有唯一主讲文章。“AI05：AG-0xx”表示跨模块前置；本模块所有项当前均为未覆盖、计划验证。

| ID | 知识项 | 分类 | 必要前置 | 来源 | 主讲文章 | 目标深度 | 证据与状态 |
|----|--------|------|----------|------|----------|----------|------------|
| FW01 | 框架解决的问题与引入成本 | 基础 | AI05：AG-003 | S01 | AI06-A01-01 | 解释 | 同一任务原生与框架实现对照；未覆盖 |
| FW02 | 原生 SDK、LangChain、LangGraph 选型条件 | 设计 | FW01 | S01、S13 | AI06-A01-01 | 设计 | 选型决策表与反例；未覆盖 |
| FW03 | `create_agent` 构建于 LangGraph 运行时的分层关系 | 基础 | FW01 | S01、S02 | AI06-A01-02 | 解释 | 打印 Agent 图结构；未覆盖 |
| FW04 | 包结构：核心、集成、编排与检查点包 | 基础 | FW03 | S01、S03 | AI06-A01-02 | 认识 | 依赖树观察；未覆盖 |
| FW05 | 版本锁定、依赖解析与升级验证 | 工程 | FW04 | S03、S16 | AI06-A01-03 | 使用 | 锁定文件与升级前后测试；未覆盖 |
| FW06 | v1 迁移、弃用与 `langchain-classic` 边界 | 演进 | FW05 | S02、S03 | AI06-A01-03 | 诊断 | 旧导入报错与修复；未覆盖 |
| FW07 | `init_chat_model` 与提供商集成包 | 核心 | FW04 | S04 | AI06-A02-01 | 使用 | 空目录一次模型调用；未覆盖 |
| FW08 | 消息类型、内容块与用量元数据 | 核心 | FW07 | S04 | AI06-A02-01 | 解释 | 消息对象字段输出；未覆盖 |
| FW09 | `@tool` 定义、`bind_tools` 与 `tool_calls` | 核心 | FW08、AI02 工具调用 | S05 | AI06-A02-01 | 使用 | 工具调用项与回传；未覆盖 |
| FW10 | 结构化结果与校验失败 | 核心 | FW09 | S05 | AI06-A02-01 | 使用 | Pydantic 结果与失败分支；未覆盖 |
| FW11 | `create_agent` 参数与内置循环 | 核心 | FW09、AI05：AG-005 | S06 | AI06-A02-02 | 使用 | Agent 消息轨迹；未覆盖 |
| FW12 | Agent 输出、终止与递归上限 | 机制 | FW11 | S06、S09 | AI06-A02-02 | 诊断 | 超限异常与终止原因；未覆盖 |
| FW13 | 运行时上下文 `context_schema` | 机制 | FW11 | S07 | AI06-A02-02 | 解释 | 同一 Agent 不同上下文对照；未覆盖 |
| FW14 | Agent 状态扩展与 `ToolRuntime` 访问 | 机制 | FW13 | S07 | AI06-A02-02 | 使用 | 工具读写状态输出；未覆盖 |
| FW15 | Middleware 钩子与执行顺序 | 机制 | FW11、FW14 | S08 | AI06-A02-02 | 解释 | 钩子调用顺序日志；未覆盖 |
| FW16 | 预置调用上限、重试、回退与 HITL 中间件 | 工程 | FW15 | S08、S11 | AI06-A02-02 | 使用 | 限额触发与回退输出；未覆盖 |
| FW17 | `StateGraph` 状态 Schema 与输入输出 Schema | 基础 | FW03 | S09 | AI06-A03-01 | 解释 | 无模型图运行输出；未覆盖 |
| FW18 | 节点部分更新与状态合并语义 | 机制 | FW17 | S09 | AI06-A03-01 | 解释 | 更新前后状态对照；未覆盖 |
| FW19 | 节点函数、`START`、`END` 与普通边 | 核心 | FW17 | S09 | AI06-A03-02 | 使用 | 顺序图执行；未覆盖 |
| FW20 | Reducer、`add_messages` 与并发写冲突 | 机制 | FW18、FW19 | S09 | AI06-A03-02 | 诊断 | `InvalidUpdateError` 反例；未覆盖 |
| FW21 | 条件边与 `Command` 路由 | 核心 | FW19 | S09 | AI06-A03-03 | 使用 | 分支路径断言；未覆盖 |
| FW22 | 循环终止与 `recursion_limit` | 机制 | FW21、AI05：AG-004 | S09 | AI06-A03-03 | 诊断 | `GraphRecursionError` 反例；未覆盖 |
| FW23 | Checkpointer、`thread_id` 与 super-step 检查点 | 机制 | FW19、AI05：AG-017 | S10 | AI06-A04-01 | 解释 | 检查点序列输出；未覆盖 |
| FW24 | 状态读取、历史与 SQLite 持久化 | 工程 | FW23 | S10 | AI06-A04-01 | 使用 | 进程重启后续接；未覆盖 |
| FW25 | `interrupt()` 与 `Command(resume=...)` | 机制 | FW23、AI05：AG-013 | S11 | AI06-A04-02 | 使用 | 暂停、批准与拒绝三条路径；未覆盖 |
| FW26 | 恢复时节点重新执行与中断点规则 | 机制 | FW25 | S11 | AI06-A04-02 | 诊断 | 中断前副作用重复反例；未覆盖 |
| FW27 | durability 模式与 `@task` 结果记录 | 机制 | FW24、FW26 | S10、S12、S13 | AI06-A04-03 | 解释 | 失败后重放计数；未覆盖 |
| FW28 | `RetryPolicy`、幂等键与副作用重放 | 工程 | FW27、AI05：AG-010 | S12 | AI06-A04-03 | 诊断 | 重试与重复写入测试；未覆盖 |
| FW29 | 扇出扇入与 super-step 并行汇合 | 机制 | FW20 | S09 | AI06-A05-01 | 解释 | 并行分支写入同一 Reducer；未覆盖 |
| FW30 | `Send` 动态派生 | 核心 | FW29 | S09 | AI06-A05-01 | 使用 | 数量不定的子任务输出；未覆盖 |
| FW31 | 子图、状态映射与子图检查点 | 设计 | FW23、FW29 | S13 | AI06-A05-02 | 使用 | 共享键与转换函数两种接法；未覆盖 |
| FW32 | Graph API 与 Functional API 选择 | 设计 | FW31 | S13 | AI06-A05-02 | 设计 | 同一流程双实现对照；未覆盖 |
| FW33 | 节点单测、整图测试与假模型 | 质量 | FW21、FW25 | S14 | AI06-A06-01 | 使用 | pytest 通过与失败输出；未覆盖 |
| FW34 | 流模式与状态历史诊断 | 质量 | FW24、FW33 | S10、S14 | AI06-A06-01 | 诊断 | `updates`、`values` 事件与历史定位；未覆盖 |
| FW35 | 图服务化的框架交付约束 | 工程 | FW24 | S15 | AI06-A06-02 | 认识 | 约束清单与本地服务配置读取；未覆盖 |
| FW36 | State Schema 变更与旧检查点兼容 | 演进 | FW24、FW35 | S10、S15 | AI06-A06-02 | 诊断 | 旧检查点加载新图的成败对照；未覆盖 |

## 四、依赖与章节职责

| 章节 | 规划路径 | 必要依赖 | 目标与排除 | 验证方式 |
|------|----------|----------|------------|----------|
| 01 框架边界 | `01-framework-boundary/` | AI05 控制循环 | 判断是否引入框架、理解两库分层并锁定版本；不讲具体 API 细节 | 选型决策表、依赖树、升级前后测试 |
| 02 LangChain 核心 | `02-langchain-core/` | FW04、AI02 工具与结构化输出 | 统一模型、消息、工具与 Agent 运行时；不重讲协议、不扩成安全治理 | 在线调用、工具回传、Agent 轨迹、钩子顺序、限额触发 |
| 03 LangGraph 基础 | `03-langgraph-foundation/` | FW03 | State、节点、Reducer、路由与循环；不涉及持久化 | 无模型图运行、冲突与递归反例 |
| 04 持久执行 | `04-durable-execution/` | 第 3 章、AI05 检查点与人工确认 | Thread、检查点、中断恢复与副作用；不讲数据库选型 | 重启续接、三条恢复路径、重放计数 |
| 05 图组合 | `05-graph-composition/` | FW20、FW23 | 并行、动态派生、子图与 API 选择；不重讲多 Agent 设计原理 | 并行汇合、动态任务、双 API 对照 |
| 06 测试与交付 | `06-testing-delivery/` | 第 3—5 章 | 图测试、诊断与状态兼容；部署平台和容器归 AI10 | pytest、流事件诊断、Schema 兼容实验 |

依赖无循环。第 2 章与第 3 章都只依赖第 1 章，可以并行阅读；目录先排 LangChain，是因为 `create_agent` 让读者先看到熟悉的 Agent 循环，再拆开它底层的图。第 4 章必须在第 3 章之后，因为检查点按 super-step 记录图状态；第 5 章的并行依赖 Reducer，子图依赖检查点。同章内按"对象—机制—故障"排序，例如 FW25 先于 FW26，才能解释恢复为何重新执行节点。

## 五、逐篇文章职责

文件路径均相对于模块根目录。每篇示例从新建空目录开始，自带依赖清单、入口和预期输出，不复用其他文章的代码。

### 1. AI06-A01-01 原生 SDK 与框架

| 字段 | 契约 |
|------|------|
| 文件与章节 | `01-framework-boundary/01-native-sdk-frameworks.md` |
| 唯一问题 | 什么条件下应从原生 SDK 转向 LangChain 或 LangGraph？ |
| 主类型与深度 | 设计与实践；设计 |
| 主讲与前置 | 主讲 FW01、FW02；前置 AI05：AG-003 |
| 大纲与必须覆盖 | 框架接管的职责（模型适配、循环、状态、持久化）；引入成本（抽象、升级、调试面）；按状态、分支、中断、恢复需求选择；保留原生实现的条件 |
| 明确不覆盖 | 不比较其他框架产品，不展开任何 API 用法 |
| 证据、入口与观察 | 同一“查询后回答”任务的原生循环与框架实现行数、职责对照表；三个场景的选型决策与一个“过早引入框架”反例 |
| 失败边界 | 框架不提供业务正确性和权限决策；代码更短不等于更可控 |
| 来源、版本与状态 | S01、S13；对照代码只作结构说明，若可运行须按第一节基线验证；未写 |

### 2. AI06-A01-02 LangChain 与 LangGraph

| 字段 | 契约 |
|------|------|
| 文件与章节 | `01-framework-boundary/02-langchain-langgraph.md` |
| 唯一问题 | LangChain 与 LangGraph 分别负责什么，二者如何分层？ |
| 主类型与深度 | 基础概念；解释 |
| 主讲与前置 | 主讲 FW03、FW04；前置 FW01 |
| 大纲与必须覆盖 | `langchain` 的高层 Agent 与集成抽象；`langgraph` 的低层编排运行时；`create_agent` 返回已编译图；`langchain-core`、集成包、检查点包的职责 |
| 明确不覆盖 | 不讲 LangSmith、托管平台与 JavaScript 版本 |
| 证据、入口与观察 | 空目录安装基线包，打印 `create_agent` 返回对象类型与节点名，使用 `pip show` 或依赖树观察包关系；Agent 使用假模型，不需要 API Key |
| 失败边界 | 节点名和内部图结构属于实现细节，版本升级可能变化，不能作为业务依赖 |
| 来源、版本与状态 | S01、S02、S03；第一节基线，计划验证；未写 |

### 3. AI06-A01-03 依赖与版本

| 字段 | 契约 |
|------|------|
| 文件与章节 | `01-framework-boundary/03-dependencies-versions.md` |
| 唯一问题 | 怎样锁定框架依赖，并在升级时发现破坏性变化？ |
| 主类型与深度 | 测试与排障；诊断 |
| 主讲与前置 | 主讲 FW05、FW06；前置 FW04 |
| 大纲与必须覆盖 | 版本语义与弃用政策；锁定直接与传递依赖；升级流程：锁定、运行测试、对照变更记录；v1 后旧导入与 `langchain-classic` |
| 明确不覆盖 | 不讲通用包管理器教程，不覆盖 v0 全量迁移 |
| 证据、入口与观察 | 空目录生成锁定文件；运行一组冒烟测试；故意使用已迁出的旧导入路径，记录真实报错并修复 |
| 失败边界 | 只锁顶层包不能保证可复现；`requires_python` 不满足时安装失败，不能降级 Python 绕过 |
| 来源、版本与状态 | S02、S03、S16；旧导入路径须在写作时实测确认；未写 |

### 4. AI06-A02-01 模型、消息与工具

| 字段 | 契约 |
|------|------|
| 文件与章节 | `02-langchain-core/01-models-messages-tools.md` |
| 唯一问题 | LangChain 怎样统一模型初始化、消息表示与工具绑定？ |
| 主类型与深度 | 语法与 API；使用 |
| 主讲与前置 | 主讲 FW07、FW08、FW09、FW10；前置 FW04；AI02 工具调用与 JSON Schema 输出 |
| 大纲与必须覆盖 | `init_chat_model` 与提供商参数；消息类型与内容块；`@tool`、`bind_tools`、`tool_calls`；`ToolMessage` 回传；`with_structured_output` 与 Pydantic 模型；校验失败 |
| 明确不覆盖 | 不比较提供商，不讲 Agent 自动循环，不重讲函数调用协议 |
| 证据、入口与观察 | 空目录一次真实调用，打印消息类型与用量；手动完成"模型提出调用—应用执行—回传"；结构化结果成功与字段缺失失败 |
| 失败边界 | 不同提供商元数据字段不完全一致；结构化结果通过校验不代表事实正确 |
| 来源、版本与状态 | S04、S05；需在线调用；未写 |

### 5. AI06-A02-02 Agent 构建与运行时

| 字段 | 契约 |
|------|------|
| 文件与章节 | `02-langchain-core/02-agent-runtime.md` |
| 唯一问题 | `create_agent` 如何构建循环，运行时上下文与 Middleware 怎样控制行为？ |
| 主类型与深度 | 运行机制；使用 |
| 主讲与前置 | 主讲 FW11、FW12、FW13、FW14、FW15、FW16；前置 FW09；AI05：AG-005 |
| 大纲与必须覆盖 | `create_agent` 参数与消息轨迹；递归上限与异常；`context_schema` 与 `ToolRuntime`；四个 Middleware 钩子与执行顺序；调用上限、重试、回退与 HITL 中间件 |
| 明确不覆盖 | 风险分级归 AI09，PII 归 AI09，不讲 LangGraph 低层图 |
| 证据、入口与观察 | 在线 Agent 两步工具任务与消息轨迹；假模型超限异常；自定义日志中间件记录钩子顺序；限额触发与回退输出 |
| 失败边界 | 中间件顺序改变语义；重试包裹有副作用的工具会重复执行 |
| 来源、版本与状态 | S06、S07、S08、S09、S11；在线与离线；未写 |

### 6. AI06-A03-01 State 与 Schema

| 字段 | 契约 |
|------|------|
| 文件与章节 | `03-langgraph-foundation/01-state-schema.md` |
| 唯一问题 | LangGraph 用什么描述工作流共享状态，节点返回值如何改变状态？ |
| 主类型与深度 | 运行机制；解释 |
| 主讲与前置 | 主讲 FW17、FW18；前置 FW03 |
| 大纲与必须覆盖 | `StateGraph` 与 `TypedDict` 状态；输入、输出与内部 Schema；节点返回部分更新；默认覆盖语义；Pydantic 状态的校验代价 |
| 明确不覆盖 | 不讲 Reducer、路由与持久化 |
| 证据、入口与观察 | 两节点无模型图，打印每步更新与最终状态；输出 Schema 过滤内部字段 |
| 失败边界 | 返回未声明字段或类型不符时的行为须实测记录；状态不是数据库 |
| 来源、版本与状态 | S09；离线；未写 |

### 7. AI06-A03-02 节点与 Reducer

| 字段 | 契约 |
|------|------|
| 文件与章节 | `03-langgraph-foundation/02-nodes-reducers.md` |
| 唯一问题 | 节点如何连接，多个更新写同一字段时怎样合并？ |
| 主类型与深度 | 运行机制；诊断 |
| 主讲与前置 | 主讲 FW19、FW20；前置 FW17、FW18 |
| 大纲与必须覆盖 | 节点函数签名、`START`、`END`、普通边；`Annotated` Reducer；`operator.add` 与 `add_messages`；同一 super-step 写冲突 |
| 明确不覆盖 | 不讲条件路由与动态派生 |
| 证据、入口与观察 | 无 Reducer 时两分支写同字段的 `InvalidUpdateError`，加入 Reducer 后的合并结果；`add_messages` 按 ID 替换的输出 |
| 失败边界 | Reducer 必须对合并顺序给出确定结果，否则并行结果不可复现 |
| 来源、版本与状态 | S09；离线；未写 |

### 8. AI06-A03-03 路由与循环

| 字段 | 契约 |
|------|------|
| 文件与章节 | `03-langgraph-foundation/03-routing-loops.md` |
| 唯一问题 | 图怎样依据状态选择下一步，并保证循环终止？ |
| 主类型与深度 | 语法与 API；诊断 |
| 主讲与前置 | 主讲 FW21、FW22；前置 FW19；AI05：AG-004 |
| 大纲与必须覆盖 | `add_conditional_edges` 与路由函数；节点返回 `Command(goto=..., update=...)`；循环退出条件；`recursion_limit` 与 `GraphRecursionError` |
| 明确不覆盖 | 不讲工作流设计原理（AI05 主讲） |
| 证据、入口与观察 | “生成—检查—修正”无模型循环，分别在第 1、3 次通过；缺少退出条件时的递归异常 |
| 失败边界 | 递归上限是保护网，不是业务终止条件；路由函数返回未知节点名的报错 |
| 来源、版本与状态 | S09；离线；未写 |

### 9. AI06-A04-01 Thread 与 Checkpoint

| 字段 | 契约 |
|------|------|
| 文件与章节 | `04-durable-execution/01-threads-checkpoints.md` |
| 唯一问题 | LangGraph 如何按 Thread 保存执行状态，并在进程重启后续接？ |
| 主类型与深度 | 运行机制；解释 |
| 主讲与前置 | 主讲 FW23、FW24；前置 FW19；AI05：AG-017 |
| 大纲与必须覆盖 | Checkpointer、`thread_id`、super-step 检查点；`get_state` 与 `get_state_history`；`InMemorySaver` 与 `SqliteSaver`；从指定检查点重新执行 |
| 明确不覆盖 | 不讲 Postgres 运维与 Store 长期记忆 |
| 证据、入口与观察 | SQLite 文件持久化，第一次运行后退出进程，第二次以同一 `thread_id` 续接；打印检查点序列 |
| 失败边界 | `InMemorySaver` 进程退出即丢失；不同 Thread 状态不共享 |
| 来源、版本与状态 | S10；离线；未写 |

### 10. AI06-A04-02 人工中断与恢复

| 字段 | 契约 |
|------|------|
| 文件与章节 | `04-durable-execution/02-human-interrupt-resume.md` |
| 唯一问题 | 怎样在节点中暂停等待人工决定，并按决定恢复执行？ |
| 主类型与深度 | 运行机制；使用 |
| 主讲与前置 | 主讲 FW25、FW26；前置 FW23；AI05：AG-013 |
| 大纲与必须覆盖 | `interrupt()` 的载荷与返回值；`Command(resume=...)`；批准、修改、拒绝三种恢复；恢复时节点从头重新执行；中断点前副作用、多个中断的顺序规则 |
| 明确不覆盖 | 确认的风险分级归 AI09，审批界面不实现 |
| 证据、入口与观察 | 无模型图在执行前暂停，分别以三种决定恢复并断言最终状态；中断前写日志的节点在恢复后被执行两次的反例与修正 |
| 失败边界 | 无 Checkpointer 时首次运行仍返回中断但无法恢复；恢复使用错误 `thread_id` 得到新运行；中断前的不幂等副作用会重复 |
| 来源、版本与状态 | S10、S11；离线；样板；已写待评审（langgraph 1.2.22，2026-11-18 实测），未接入导航 |

### 11. AI06-A04-03 副作用、重放与重试

| 字段 | 契约 |
|------|------|
| 文件与章节 | `04-durable-execution/03-side-effects-replay-retries.md` |
| 唯一问题 | 失败重试或从检查点恢复时，怎样避免外部副作用重复发生？ |
| 主类型与深度 | 测试与排障；诊断 |
| 主讲与前置 | 主讲 FW27、FW28；前置 FW24、FW26；AI05：AG-010 |
| 大纲与必须覆盖 | durability 模式（`exit`、`async`、`sync`）的取舍；`@task` 记录结果避免重复执行；`RetryPolicy` 的重试条件；幂等键与外部系统去重 |
| 明确不覆盖 | 不讲分布式事务，不重复 AI05 恢复矩阵 |
| 证据、入口与观察 | 计数器模拟外部写入：节点失败重试、进程中断后恢复两种情况下的写入次数，加入 `@task` 与幂等键后的对照 |
| 失败边界 | 框架只能避免自己记录过的重放；外部系统未持久化幂等键时仍会重复 |
| 来源、版本与状态 | S10、S12、S13；durability 取值须按基线实测；未写 |

### 12. AI06-A05-01 并行与动态路由

| 字段 | 契约 |
|------|------|
| 文件与章节 | `05-graph-composition/01-parallel-dynamic-routing.md` |
| 唯一问题 | 怎样并行执行多个分支并在结果汇合时保持确定？ |
| 主类型与深度 | 运行机制；使用 |
| 主讲与前置 | 主讲 FW29、FW30；前置 FW20 |
| 大纲与必须覆盖 | 一点到多点的扇出与 super-step；汇合节点等待；Reducer 汇总；`Send` 按数据数量派生任务；一个分支失败对整步的影响 |
| 明确不覆盖 | 不讲多 Agent 拓扑原理（AI05 主讲） |
| 证据、入口与观察 | 固定列表与可变列表两种扇出，打印分支执行与汇合结果；一个分支抛错时的整步表现 |
| 失败边界 | 并行不保证完成顺序；汇总依赖顺序时须排序 |
| 来源、版本与状态 | S09；离线；未写 |

### 13. AI06-A05-02 子图与 API 选择

| 字段 | 契约 |
|------|------|
| 文件与章节 | `05-graph-composition/02-subgraphs-api-selection.md` |
| 唯一问题 | 何时拆分子图，何时改用 Functional API？ |
| 主类型与深度 | 设计与实践；设计 |
| 主讲与前置 | 主讲 FW31、FW32；前置 FW23、FW29 |
| 大纲与必须覆盖 | 子图作为节点（共享键）与在节点中调用（转换状态）；子图检查点与中断传播；`@entrypoint`、`@task`；两种 API 的选择条件 |
| 明确不覆盖 | 不讲远程图与托管平台 |
| 证据、入口与观察 | 同一流程的子图两种接法输出；同一流程用 Graph API 与 Functional API 实现的对照表 |
| 失败边界 | 状态键不匹配导致数据静默丢失；为复用而拆子图会增加调试层次 |
| 来源、版本与状态 | S13；离线；未写 |

### 14. AI06-A06-01 图测试与诊断

| 字段 | 契约 |
|------|------|
| 文件与章节 | `06-testing-delivery/01-graph-testing-diagnostics.md` |
| 唯一问题 | 怎样测试图的路由与恢复，并定位执行偏离的节点？ |
| 主类型与深度 | 测试与排障；诊断 |
| 主讲与前置 | 主讲 FW33、FW34；前置 FW21、FW24、FW25 |
| 大纲与必须覆盖 | 节点纯函数单测；整图测试与内存检查点；假模型固定输出；`stream_mode` 的 `updates`、`values`；用状态历史定位错误节点 |
| 明确不覆盖 | Trace 平台与 OpenTelemetry 归 AI08；模型质量评测归 AI08 |
| 证据、入口与观察 | pytest 测试路由、中断与恢复；故意破坏路由后通过流事件定位失败节点 |
| 失败边界 | 假模型只验证编排，不能证明真实模型行为 |
| 来源、版本与状态 | S10、S14；pytest 9.2.0；离线；未写 |

### 15. AI06-A06-02 服务部署与状态兼容

| 字段 | 契约 |
|------|------|
| 文件与章节 | `06-testing-delivery/02-service-deployment-state-compatibility.md` |
| 唯一问题 | 把图交付为服务时，框架对持久化与状态 Schema 有哪些约束？ |
| 主类型与深度 | 设计与实践；诊断 |
| 主讲与前置 | 主讲 FW35、FW36；前置 FW24 |
| 大纲与必须覆盖 | 生产需持久 Checkpointer；请求与 `thread_id` 映射；本地服务配置的作用（只读认识）；新增、删除、改名状态字段对旧检查点的影响与迁移方式 |
| 明确不覆盖 | 容器、扩缩容、灰度与回滚归 AI10；托管平台操作不展开 |
| 证据、入口与观察 | 用旧版图写入 SQLite 检查点，以新增字段、删除字段、改名字段三版图续接，记录成败与修复 |
| 失败边界 | 改名字段不会自动迁移；运行中 Thread 跨版本恢复须先验证 |
| 来源、版本与状态 | S10、S15；本地实验离线，服务化部分只作约束说明；未写 |

## 六、能力覆盖与样板选择

| 最终能力 | 支撑知识 | 负责文章 | 验证方案 | 本轮状态 |
|----------|----------|----------|----------|----------|
| 判断是否引入框架并锁定版本 | FW01—FW06 | A01-01—A01-03 | 决策表、依赖树、升级反例 | 未写 |
| 用 LangChain 构建并控制 Agent | FW07—FW16 | A02-01、A02-02 | 在线调用、工具回传、Agent 轨迹、钩子顺序、限额触发 | 未写；在线基线待锁定 |
| 用图表达工作流 | FW17—FW22 | A03-01—A03-03 | 无模型图、冲突与递归反例 | 未写 |
| 持久执行与人工中断 | FW23—FW28 | A04-01—A04-03 | 重启续接、三种恢复、副作用计数 | 未写 |
| 组合复杂图 | FW29—FW32 | A05-01、A05-02 | 并行汇合、子图接法、双 API 对照 | 未写 |
| 测试与交付 | FW33—FW36 | A06-01、A06-02 | pytest、流事件定位、Schema 兼容 | 未写 |

样板候选为 `AI06-A04-02 人工中断与恢复`。它同时涉及 Checkpointer、Thread、`interrupt()`、`Command(resume=...)` 和"恢复时节点重新执行"这一最易误解的机制，失败边界清晰且可完全离线验证，能校准运行机制类文章的深度。最简单的概述篇（A01-02）不适合作样板。若用户希望样板覆盖在线模型，第二候选为 `AI06-A02-02 Agent 构建与运行时`。

## 七、文件影响与验收

| 文件 | 本轮动作 |
|------|----------|
| 本蓝图 | 目录调整（7 章 18 篇 → 6 章 15 篇，原 02、03 章合并为新 02 章） |
| `standards/blueprints/ai/directory.md` | AI06 行已更新为 6 章 15 篇 |
| `.vitepress/themeConfig/catalogs/ai.js` | AI06 章节已同步为 6 章 15 篇 |
| `content/ai/06-framework-orchestration/` 正文与导航 | 不改动；正文在蓝图确认和样板认可后逐章生成 |

| 门禁 | 结论 | 说明 |
|------|------|------|
| 范围 | 通过 | 框架映射与通用机制分离，部署、Trace、风险模型均有外部唯一主讲 |
| 版本 | 待验证 | 版本号已于 2026-11-18 从 PyPI 核对，空目录安装与 API 签名尚未实测 |
| 验收证据 | 计划验证 | 12 篇可离线验证，A02-01、A02-02 需在线模型 |
