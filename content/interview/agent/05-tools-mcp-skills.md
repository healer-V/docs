---
title: "工具调用、MCP与Skills面试题"
category: "面试题"
tags:
  - Function Calling
  - MCP
  - Agent Skills
  - A2A
excerpt: "按国内大厂 Agent 开发岗面经整理：Function Calling 的原理与参数错误处理、工具设计、MCP 的架构与通信方式、获取工具列表的流程、MCP 与 Function Calling 的区别、Agent Skills 与渐进式披露、Function Call/MCP/Skills/A2A 的边界，以及上百个工具时如何选准。"
---

# 工具调用、MCP与Skills面试题

工具调用是 Agent 面经中最集中的一块。“MCP 是什么”“MCP 和 Function Calling 的区别”在字节、腾讯、阿里、京东、百度等公司都被问过；“MCP 和 Skills 的区别”是 2026 年新出现的高频题，字节、腾讯、美团、京东、小红书的面经中都能看到。回答这组题的关键是讲清楚各自处在哪一层、解决什么问题。

## 一、Function Calling

### 1. Function Calling 的原理是什么，模型如何知道该调用哪个工具？

**Function Calling 是模型经过训练获得的能力：应用在请求中提供工具的名称、描述和参数 JSON Schema，模型判断需要使用工具时，输出结构化的调用请求（工具名、参数和调用 ID），由应用执行后把结果返回给模型。模型本身不执行任何代码。**

工具定义会被服务端以特定格式注入到模型的上下文中，模型根据用户问题与工具描述的匹配程度决定是否调用、调用哪个。所以工具的名称和描述写得是否清楚，直接决定模型能否选对工具。

1. 应用发送用户消息和工具定义。
2. 模型返回工具调用请求，例如 `get_order` 及参数 `{"order_id": "1001"}`。
3. 应用校验参数并执行函数。
4. 应用把执行结果与相同的调用 ID 一起追加到消息中，再次请求模型。
5. 模型根据结果生成回答或继续调用其他工具。

模型可能在一次回复中请求多个工具调用（并行调用），应用需要全部执行并逐一返回结果；缺少任何一个调用的结果，下一次请求通常会报错。

参考：[OpenAI：函数调用](https://developers.openai.com/api/docs/guides/function-calling)。

### 2. 模型返回的工具参数格式不对，工程上怎么处理？

**参数错误分为格式错误（不是合法 JSON、缺少必填字段、类型不对）和语义错误（格式正确但值不合理，如不存在的订单号），处理方式不同。**

| 问题 | 处理方式 |
|------|----------|
| 不是合法 JSON | 开启严格模式的结构化输出（strict schema），从源头约束；仍失败时尝试修复常见问题（如多余的逗号）后再解析 |
| 缺少字段或类型错误 | 用 Pydantic、JSON Schema 等校验，把具体错误信息作为工具结果返回给模型，让它修正后重试 |
| 值不合理 | 工具内部做业务校验，返回“订单号不存在，请向用户确认”这样可理解的错误 |
| 重试仍失败 | 限制重试次数，超过后降级：返回固定提示、转人工或改用确定性流程 |

关键原则是：错误要返回给模型而不是直接抛异常终止，让模型有机会自我修正；同时重试次数由程序控制，避免无限重试。模型给出不存在的工具名时，返回错误，绝不能动态执行。

参考：[OpenAI：结构化输出](https://developers.openai.com/api/docs/guides/structured-outputs)。

### 3. 如何设计一个好的工具？

**工具的名称、描述和参数是模型决定如何调用它的唯一依据，要像写给新同事的接口文档一样清楚；工具的实现要像对外接口一样校验输入、控制权限并返回明确的结果。**

1. **描述清楚边界：** 写明做什么、什么时候用、什么时候不该用，例如“查询订单状态，不能用于修改订单”。
2. **约束参数：** 用枚举限制取值，标明格式（日期为 `YYYY-MM-DD`），必填项明确。
3. **按任务设计粒度：** 不要把数据库每张表都暴露成工具，而是按业务动作设计，如“查询用户最近的订单”。
4. **控制返回内容：** 只返回模型需要的字段，大结果分页或摘要，避免撑爆上下文。
5. **写操作幂等：** 支持幂等键，标记风险等级，高风险操作需要人工确认。

参考：[Anthropic：Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents)。

## 二、MCP

### 1. MCP 是什么，解决了什么问题？

**MCP（Model Context Protocol）是连接 AI 应用与外部工具、数据源的开放协议，由 Anthropic 于 2024 年发布。工具提供方实现一次 MCP 服务器，任何支持 MCP 的客户端（IDE、桌面助手、自研 Agent）都能直接使用。**

没有 MCP 时，每个 AI 应用都要为每个外部系统（GitHub、数据库、企业内部系统）单独编写集成代码，M 个应用接 N 个系统需要 M×N 套集成；有了统一协议后变成 M+N。常见的比喻是“AI 应用的 USB-C 接口”。

MCP 有三个角色：宿主（Host）是用户使用的 AI 应用；客户端（Client）是宿主内部负责与某个服务器通信的组件；服务器（Server）对外提供能力。消息格式基于 JSON-RPC 2.0。

参考：[MCP：架构概览](https://modelcontextprotocol.io/docs/learn/architecture)。

### 2. MCP 服务器提供哪些能力，通信方式有哪些？

**MCP 服务器提供三种核心原语：工具（Tools）由模型决定调用；资源（Resources）由应用决定读取，提供上下文数据；提示（Prompts）由用户选择，是预定义的提示模板。**

| 原语 | 控制方 | 例子 |
|------|--------|------|
| Tools | 模型 | `create_issue`、`query_orders` |
| Resources | 应用 | 文件内容、数据库表结构 |
| Prompts | 用户 | “生成周报”模板 |

标准传输方式有两种：stdio 由客户端以子进程启动本地服务器，通过标准输入输出通信，适合本地工具；Streamable HTTP 通过 HTTP 访问远程服务器，适合多用户共享的服务。早期的 HTTP+SSE 传输已被弃用。远程服务器的授权基于 OAuth 2.1，服务器必须校验访问令牌确实是签发给自己的。

参考：[MCP 规范：服务器原语](https://modelcontextprotocol.io/specification/2026-07-28/server)、[MCP 规范：传输](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports)、[MCP 规范：授权](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)。

### 3. Agent 通过 MCP 获取工具列表并调用工具的完整流程是什么？

**客户端连接服务器后调用 `tools/list` 获取工具的名称、描述和输入 Schema，宿主把它们转换为模型的工具定义；模型发起调用后，客户端向服务器发送 `tools/call` 请求，把结果返回给模型。**

1. 宿主根据配置连接 MCP 服务器（本地启动子进程，或连接远程 HTTP 地址并完成授权）。
2. 客户端请求 `tools/list`，得到工具清单。
3. 宿主把工具清单转换为模型 API 要求的函数定义格式，随请求一起发送给模型。
4. 模型返回工具调用请求，宿主找到对应的服务器，发送 `tools/call`，携带工具名和参数。
5. 服务器执行并返回结果，宿主把结果作为工具输出交还模型。

协议版本有差异需要注意：2025-11-25 及更早版本中，通信开始时先进行 `initialize` 握手协商能力并建立会话；2026-07-28 版本改为无状态协议，取消握手和会话 ID，每个请求自带协议版本和客户端信息，需要提前了解服务器能力时可调用可选的 `server/discover`，工具列表结果还带有缓存时长提示。

参考：[MCP 规范：工具](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)、[MCP 博客：The 2026-07-28 Specification](https://blog.modelcontextprotocol.io/posts/2026-07-28/)。

### 4. MCP 和 Function Calling 有什么区别？

**Function Calling 是模型与应用之间的能力：模型输出“调用哪个函数、传什么参数”；MCP 是应用与工具提供方之间的协议：规定工具如何被发现、描述和调用。两者处在不同层次，是配合关系而不是替代关系。**

| 维度 | Function Calling | MCP |
|------|------------------|-----|
| 所处层次 | 模型 ↔ 应用 | 应用 ↔ 工具服务 |
| 解决的问题 | 让模型输出结构化的调用意图 | 让工具能被不同应用复用 |
| 工具定义位置 | 写在应用代码中，随请求发送 | 由 MCP 服务器提供，运行时发现 |
| 标准化程度 | 各模型厂商格式不同 | 统一的开放协议 |

典型流程中两者同时出现：应用从 MCP 服务器拿到工具列表，转换为 Function Calling 的格式交给模型；模型通过 Function Calling 表达调用意图，应用再通过 MCP 执行。面试官追问“没有 MCP 之前怎么做”：每个应用在自己的代码中定义函数并编写调用逻辑，工具无法跨应用复用。

参考：[MCP：架构概览](https://modelcontextprotocol.io/docs/learn/architecture)、[OpenAI：函数调用](https://developers.openai.com/api/docs/guides/function-calling)。

### 5. MCP 如何兼顾扩展性和安全性，MCP 已经过时了吗？

**MCP 的主要安全风险来自三方面：第三方服务器提供的工具描述中可能藏有恶意指令（工具投毒）；工具权限过大，被提示注入诱导后造成破坏；远程服务器的认证和令牌管理不当。**

| 措施 | 做法 |
|------|------|
| 来源管控 | 只接入经过审核的服务器，固定版本，变更后重新审核工具描述 |
| 最小权限 | 按 Agent 和用户分配可访问的服务器和工具，只读任务不提供写工具 |
| 高风险确认 | 写操作和对外发送操作执行前人工确认 |
| 认证隔离 | 令牌只用于签发它的服务器，服务器不把客户端令牌转发给下游 |
| 审计 | 记录每次工具调用的参数、结果和调用方 |

关于“MCP 是否过时”的讨论，主要源于两点：大量工具定义一次性放入上下文消耗很多 Token，于是出现了让 Agent 写代码调用工具、按需加载 Skills 等方式；部分简单场景直接写函数更轻量。但 MCP 解决的是工具接入的标准化问题，这个需求仍然存在，2026 年它还发布了无状态核心等重要更新。更准确的说法是：MCP 负责“连接”，Skills 和按需加载负责“节省上下文”，两者互补。

参考：[MCP 规范：安全最佳实践](https://modelcontextprotocol.io/specification/2026-07-28/basic/security_best_practices)、[Anthropic：Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)。

## 三、Skills 与 A2A

### 1. Agent Skills 是什么，为什么能减少 Token 消耗？

**Agent Skills 是把完成某类任务所需的指令、脚本和参考资料打包成一个目录，核心是一个 `SKILL.md` 文件：开头的 YAML 元数据包含 `name` 和 `description`，正文是详细的操作说明，目录中还可以包含脚本（`scripts/`）、参考文档（`references/`）和模板等资源。** 它由 Anthropic 提出，现已作为开放规范发布。

减少 Token 的关键是渐进式披露（progressive disclosure），按需分三层加载：

| 层级 | 何时加载 | 大小 |
|------|----------|------|
| 元数据（name、description） | 启动时加载所有 Skill 的元数据 | 每个约 100 Token |
| `SKILL.md` 正文 | 模型判断任务需要该 Skill 时加载 | 建议少于 5000 Token |
| 脚本和参考资料 | 执行过程中需要时才读取或运行 | 按需 |

即使安装了上百个 Skill，初始上下文中也只有它们的简短描述，而不是全部内容。相比之下，把所有工具的完整定义和使用说明一次性放进系统提示，会在每次请求中都占用大量 Token。脚本由 Agent 运行，只把输出放入上下文，代码本身不占用上下文。

参考：[Agent Skills 规范](https://agentskills.io/specification)、[Anthropic：Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)。

### 2. Function Call、MCP、Skills 和 A2A 的边界在哪？

**四者分别解决不同的问题：Function Call 让模型表达调用意图，MCP 让工具以统一协议接入，Skills 让 Agent 按需获得完成任务的流程知识，A2A 让不同的 Agent 之间相互通信和协作。**

| 概念 | 回答的问题 | 内容形式 |
|------|------------|----------|
| Function Call | 模型怎样告诉应用“我要调用这个函数” | 模型输出的结构化调用请求 |
| MCP | 工具和数据源怎样被不同 AI 应用接入 | 协议：服务器暴露 Tools、Resources、Prompts |
| Skills | Agent 怎样知道完成某类任务的步骤和规范 | 文件夹：说明文档 + 脚本 + 资料 |
| A2A | 一个 Agent 怎样把任务委托给另一个 Agent | 协议：Agent Card、任务、消息、产物 |

可以用一个例子串起来：一个“写周报”的 Skill 说明了周报格式和数据来源；Agent 按 Skill 的指引，通过 MCP 连接的项目管理系统查询本周任务；查询动作由模型通过 Function Call 发起；需要财务数据时，通过 A2A 把子任务委托给财务部门的 Agent。

面试官常追问“Skill 和 Rule（如项目规则文件）有什么区别”：Rule 每次都完整加载，适合始终需要遵守的规范；Skill 只在任务相关时加载，适合特定任务的操作流程。

参考：[Agent Skills 规范](https://agentskills.io/specification)、[A2A：A2A 与 MCP](https://a2a-protocol.org/latest/topics/a2a-and-mcp/)。

### 3. A2A 协议是什么，和 MCP 是什么关系？

**A2A（Agent2Agent）是让不同厂商、不同框架构建的 Agent 相互发现和协作的开放协议，由 Google 于 2025 年发起，现由 Linux 基金会托管。** 它基于 HTTP、JSON-RPC 2.0 和 SSE 等现有标准。

A2A 的核心概念包括：Agent Card 是 Agent 的自我描述，一般发布在 `/.well-known/agent-card.json`，声明名称、能力、技能和认证方式；任务（Task）是一次协作的工作单元，有提交、执行中、需要输入、完成、失败等状态，支持长时间运行和人工介入；消息（Message）在双方之间传递，结果以产物（Artifact）返回。

与 MCP 的关系是：MCP 连接 Agent 与工具，工具是被动执行的函数；A2A 连接 Agent 与 Agent，对方是有自主决策能力的智能体，可以多轮交互、追问和长时间处理。一个 Agent 内部可以用 MCP 调用工具，对外用 A2A 与其他 Agent 协作。

参考：[A2A 协议规范](https://a2a-protocol.org/latest/specification/)、[A2A：A2A 与 MCP](https://a2a-protocol.org/latest/topics/a2a-and-mcp/)。

### 4. 注册了上百个工具或 Skill，Agent 怎么选准？

**工具越多，模型选错工具的概率越高，工具定义占用的上下文也越多。解决思路是不让模型同时面对全部工具，而是先缩小候选范围。**

| 方法 | 做法 |
|------|------|
| 工具检索 | 把工具描述向量化，按用户问题检索最相关的十几个工具放入上下文 |
| 分层路由 | 先由路由模型或规则判断业务领域，再加载该领域的工具子集 |
| 渐进式披露 | 只放 Skill 和工具组的简短描述，选中后再展开详细定义 |
| 子 Agent 分组 | 按领域拆成多个子 Agent，每个只持有少量工具 |
| 优化描述 | 区分相似工具的描述，写明何时不应使用 |

提高稳定性还需要评测：建立“问题 → 应调用的工具”标注集，统计工具选择准确率，修改工具描述或检索策略后回归测试。面试官追问“怎么保证稳定”时，要说出具体的评测方式和指标，而不只是“优化提示词”。

参考：[Anthropic：Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents)、[Agent Skills 规范](https://agentskills.io/specification)。
