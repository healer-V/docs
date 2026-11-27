---
title: "Prompt、上下文与Harness工程面试题"
category: "面试题"
tags:
  - Prompt
  - 上下文工程
  - Harness
excerpt: "按国内大厂 Agent 开发岗面经整理：Prompt、Context 与 Harness Engineering 的区别，提示词结构与指令层级，上下文窗口的限制，上下文压缩与大结果卸载，长任务目标迷失，Claude Code 一类编码 Agent 的上下文管理思路，以及上下文污染的处理。"
---

# Prompt、上下文与Harness工程面试题

2026 年 Agent 岗面经的明显变化是：问法从“提示词怎么写”转向“上下文怎么管”和“Harness 怎么设计”。字节、钉钉、快手等公司的面经里，“Prompt、Context、Harness 三者区别”“上下文快超限时怎么处理”“Claude Code 怎么压缩上下文”都是高频题，并且通常紧跟一句“你项目里具体怎么做的”。

## 一、概念演进

### 1. Prompt Engineering、Context Engineering 和 Harness Engineering 有什么区别？

**三者是范围逐步扩大的关系：Prompt Engineering 关注单次请求中指令怎么写；Context Engineering 关注每一步调用模型时放入哪些信息、以什么顺序组织；Harness Engineering 关注模型之外的整个运行系统，包括工具、循环控制、状态、权限、评测和反馈机制。**

| 层次 | 关注的问题 | 典型工作 |
|------|------------|----------|
| Prompt | 这条指令怎样写模型才能理解 | 角色设定、输出格式、少样本示例 |
| Context | 这一步模型应该看到什么 | 检索、记忆召回、历史压缩、工具结果裁剪 |
| Harness | 模型在什么系统里工作 | Agent Loop、工具注册与权限、沙箱、检查点、评测与可观测 |

一种常见的说法是“Agent = 模型 + Harness”：模型决定能力上限，Harness 决定稳定性的下限。OpenAI 在介绍用 Codex 构建产品的文章中也使用了 Harness Engineering 这个说法，强调当 Agent 做不好时，工程师应补充它缺少的工具、约束和反馈，而不是只改提示词。

面试官常追问“Harness 做的事 LangChain 一直在做，为什么现在才火”：框架提供的是可复用的组件，Harness 强调的是围绕具体任务把这些组件组装成可靠系统的工程方法；Agent 开始执行长任务、写代码和操作真实系统后，失败的主要原因从“模型不会”变成了“上下文和反馈机制不对”，这个方向因此受到重视。

参考：[OpenAI：Harness engineering](https://openai.com/index/harness-engineering/)、[Anthropic：Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)。

### 2. 一个好的系统提示词应该包含哪些部分？

**清楚的系统提示词说明角色与目标、可用资源与约束、工作流程、输出格式，并用分隔符把指令和数据区分开。** 写法应具体、可检验：“回复不超过 3 句话”比“简洁一点”更容易被遵守和验证。

| 组成部分 | 例子 |
|----------|------|
| 角色与目标 | “你是售后客服，判断退货申请是否符合政策” |
| 约束 | “只依据提供的政策回答；不得承诺退款金额” |
| 工具使用规则 | “查询订单前先确认订单号；退款操作必须等用户确认” |
| 输出格式 | “输出 JSON，包含 eligible 和 reason 字段” |
| 示例 | 一个符合条件和一个不符合条件的申请 |

用 XML 标签或 Markdown 标题包裹用户内容和资料，例如 `<order_info>...</order_info>`，可以让模型分清哪些是指令、哪些是数据，也便于程序模板化填充。系统提示中不要放密钥和内部配置，用户可能诱导模型复述出来。

参考：[Anthropic：提示词工程概览](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)、[OpenAI：提示词工程](https://developers.openai.com/api/docs/guides/prompt-engineering)。

### 3. 思维链和少样本示例在什么时候使用？

**少样本示例适合格式复杂或判断标准难以用文字描述的任务；思维链（让模型先写推理步骤再给答案）能提升普通模型在多步推理任务上的准确率，推理模型已在内部完成这一过程，一般不需要再要求“一步一步思考”。**

少样本示例要覆盖边界情况、答案分布要多样，否则模型会模仿示例中的偏向；示例会占用每次请求的 Token，数量多时可以按用户输入检索最相似的几个动态插入。思维链会增加输出 Token 和延迟，简单任务不值得使用，而且模型写出的推理过程不一定是它得出结论的真实原因，关键结果仍需代码验证。

参考：[Wei et al.：Chain-of-Thought Prompting](https://arxiv.org/abs/2201.11903)。

## 二、上下文管理

### 1. 上下文窗口是什么，为什么上下文越长效果反而可能越差？

**上下文窗口是模型单次请求能处理的最大 Token 数，包括系统提示、工具定义、历史对话、检索资料、工具结果和模型输出。** 窗口的物理限制来自注意力计算量随长度平方增长、KV Cache 占用显存，以及模型训练时见过的序列长度。

上下文越长效果越不稳定，原因有三个：研究发现模型对长上下文中间部分的信息利用率低于开头和结尾（Lost in the Middle）；无关和过期的内容会分散注意力，甚至与当前任务相互矛盾；Agent 中大量工具输出会淹没最初的任务目标。所以“窗口足够大就把所有内容都放进去”是错误的做法。

这也解释了“指令在上下文中的位置为什么会影响效果”：关键指令放在开头的系统提示中，当前任务和约束在末尾再次强调，比埋在中间的效果更好。

参考：[Liu et al.：Lost in the Middle](https://arxiv.org/abs/2307.03172)、[Chroma：Context Rot](https://research.trychroma.com/context-rot)。

### 2. Agent 上下文快超过窗口时怎么处理？

**处理方式分为裁剪、压缩、卸载和隔离四类，通常组合使用，并在达到窗口的一定比例（而不是完全用满）时提前触发。**

| 方式 | 做法 | 牺牲了什么 |
|------|------|------------|
| 滑动窗口 | 只保留最近 N 轮对话 | 早期信息完全丢失 |
| 摘要压缩 | 把早期对话和步骤总结成摘要，近期保留原文 | 细节丢失，摘要可能出错 |
| 工具结果清理 | 已经用过的旧工具输出替换为简短说明 | 需要时要重新调用工具 |
| 大结果卸载 | 大段结果写入文件或存储，上下文只保留路径和摘要 | 读取需要额外的工具调用 |
| 子 Agent 隔离 | 把探索性子任务交给独立上下文执行，只带回结论 | 增加调用次数和 Token 总量 |

裁剪时必须保持消息结构完整：工具调用和对应的工具结果要成对保留或成对删除，否则请求会报错或让模型误解。面试官常追问“滑动窗口和摘要各自牺牲了什么”，回答时要说出：滑动窗口牺牲早期信息但不会引入错误，摘要保留了要点但可能遗漏或歪曲细节。

参考：[Anthropic：Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)。

### 3. 如果让你设计上下文压缩，会怎么设计？

**压缩要回答三个问题：什么时候压、压什么、怎样保证不丢关键信息。**

1. **触发时机：** 设置阈值（例如窗口的 70%～80%）提前压缩，并在任务的自然边界（一个子任务完成后）执行，避免在模型正在处理时打断。
2. **分层保留：** 系统提示、当前任务目标和用户明确提出的约束永远不压缩；最近几轮保留原文；更早的内容压缩为摘要。
3. **结构化摘要：** 摘要不写成自由文本，而是按固定字段生成：任务目标、已完成步骤、关键决定及原因、待办事项、重要的文件路径和 ID、用户偏好。
4. **先清理后摘要：** 先用规则删除可以重新获取的大段工具输出，最后才调用模型做摘要，降低成本。
5. **校验摘要：** 检查关键实体（订单号、文件路径、数字）在摘要中是否仍然存在，缺失则补回或重新生成。

面试官常追问“怎样判断摘要没有遗漏影响后续决策的信息”：可以建立评测集，用压缩前和压缩后的上下文分别让模型完成后续任务，比较成功率；线上记录压缩后出现的“重复已完成步骤”“询问已知信息”等现象作为遗漏信号。

参考：[Anthropic：Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)。

### 4. Claude Code 这类编码 Agent 是怎么管理上下文的？

**以 Claude Code 公开的文档和使用方式为例，它组合了项目说明文件、按需读取、自动压缩、旧工具结果清理和子 Agent 隔离。** 具体内部实现没有完全公开，回答时应以文档说明的行为为准。

| 机制 | 作用 |
|------|------|
| `CLAUDE.md` 项目说明 | 把项目约定、常用命令等长期信息写成文件，每次会话自动加载 |
| 按需读取 | 不预先把整个代码库放入上下文，而是由 Agent 用搜索和读文件工具按需获取 |
| 自动压缩（compaction） | 上下文接近上限时把历史对话总结后替换，也可以手动执行 `/compact` |
| 清理旧工具结果 | 已使用过的工具输出从上下文中移除，减少占用 |
| 子 Agent | 把搜索、调研等子任务交给独立上下文，主对话只接收结论 |

这体现了一个通用思路：不要追求把所有信息塞进窗口，而是让 Agent 在需要时通过工具“即时检索”信息，并把需要跨会话保留的知识写入文件。面经中出现的“三层压缩”等说法属于社区总结，不同来源的描述并不一致，引用时应说明是自己的理解。

参考：[Claude Code 文档：管理成本与上下文](https://docs.anthropic.com/en/docs/claude-code/costs)、[Anthropic：Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)。

### 5. 多轮长任务如何避免“任务目标迷失”？

**目标迷失是指 Agent 执行多步之后，被大量中间结果带偏，忘记原始目标或约束，开始做无关的事情。** 根本原因是原始任务在上下文中的占比越来越小，并且离当前位置越来越远。

处理方法包括：把任务目标和约束固定在系统提示中，不参与压缩；让 Agent 维护一份显式的计划或待办列表（写入状态或文件），每步执行后更新，并在每次调用时放在上下文末尾；在关键步骤后增加检查，让模型对照原始目标判断当前进展；任务过长时拆分为多个子任务，每个子任务在干净的上下文中执行。

参考：[Anthropic：Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)。

### 6. 上下文跑偏或被污染时，应继续修正还是新开会话？

**上下文污染是指上下文中混入了错误结论、失败的尝试或无关信息，导致模型持续沿错误方向工作；工具污染是指某个工具返回了错误或误导性的结果，被模型当作事实使用。**

如果模型已经多次在同一个错误结论上打转，继续在原会话中纠正往往效果有限，因为错误内容仍在上下文中。更有效的做法是总结出正确的已知信息和需要避免的方向，新开一个干净的会话继续。工具污染则需要从源头修复工具，并在工具结果中标注可信度和数据来源，让模型能够区分。

面试官常追问“怎样区分两者”：查看执行轨迹，若错误最早出现在某次工具返回中，是工具污染；若工具结果正确，但模型从早期的错误推断开始一路偏离，是上下文污染。

参考：[Anthropic：Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)。

### 7. 提示缓存如何影响上下文的组织方式？

**提示缓存复用与之前请求完全相同的前缀部分，命中缓存的输入更便宜、首 Token 更快；前缀中任何一个字符变化，之后的部分都无法命中。**

因此上下文应按变化频率从低到高排列：系统提示、工具定义和固定示例放在最前，其次是相对稳定的资料，最后是用户问题和每次变化的内容。常见错误是把当前时间、请求 ID 放在系统提示开头，或者每次调整工具列表的顺序，导致缓存完全失效。上下文压缩会改写历史，压缩后的第一次请求必然缓存未命中，这也是压缩不能过于频繁的原因之一。

参考：[OpenAI：提示缓存](https://developers.openai.com/api/docs/guides/prompt-caching)、[Anthropic：提示缓存](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)。
