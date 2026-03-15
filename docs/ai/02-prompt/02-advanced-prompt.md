---
title: "高级 Prompt 技巧"
category: "AI · Prompt"
tags:
  - Prompt
  - CoT
  - LLM
excerpt: "高级 Prompt 技巧通过链式思考、自我反思和结构化输出等策略，显著提升大语言模型的推理能力和输出质量。"
date: 2026-03-15
---

# 高级 Prompt 技巧

掌握了 Prompt 的基础构成后，你可以通过高级技巧进一步释放大语言模型的潜力。本章介绍的技巧在复杂推理、代码生成、数据分析等场景中效果显著，能帮助你解决 Zero-shot 和 Few-shot 无法胜任的高难度任务。

## 一、链式思考（Chain of Thought）

链式思考（Chain of Thought，简称 CoT）是最具影响力的 Prompt 技巧之一。它通过引导模型"一步一步思考"，将复杂问题分解为多个推理步骤，显著提升模型在数学计算、逻辑推理和多步骤任务中的表现。

### 1. 基本原理

普通 Prompt 要求模型直接给出最终答案，而 CoT 要求模型展示完整的推理过程。这类似于数学考试中"要求写出解题步骤"——过程本身帮助模型避免跳步导致的错误。

| 对比维度 | 普通 Prompt | CoT Prompt |
|----------|-------------|------------|
| 输出方式 | 直接给答案 | 展示推理过程后给答案 |
| 准确率 | 简单任务高，复杂任务低 | 复杂任务显著提升 |
| Token 消耗 | 少 | 较多（包含推理过程） |
| 适用场景 | 事实性问答、翻译 | 数学、逻辑、代码调试 |

### 2. Zero-shot CoT

最简单的 CoT 实现方式是在 Prompt 末尾添加"让我们一步一步思考"这句话。

::: details Zero-shot CoT 示例
```text
一个电商系统在促销期间的并发请求量是平时的 8 倍。平时的 QPS 是 500，
每个请求平均处理时间是 200ms，服务器有 4 个 CPU 核心。
如果要确保促销期间 99% 的请求在 1 秒内得到响应，至少需要多少台相同配置的服务器？

让我们一步一步思考。
```

模型会按步骤输出：
1. 计算促销期间的 QPS：500 * 8 = 4000
2. 计算单台服务器的处理能力：4 核心 / 0.2s = 20 并发
3. 计算单台服务器的 QPS 上限：20 * (1000ms / 200ms) = 100
4. 考虑 99% 响应时间在 1s 内的约束...
5. 得出最终结论
:::

### 3. Few-shot CoT

通过提供包含推理过程的示例，引导模型以相同的方式推理新问题。

::: details Few-shot CoT 示例
```text
我会给你一段代码，请分析它的时间复杂度。请按以下步骤推理：

## 示例

代码：
function findDuplicate(nums) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] === nums[j]) return nums[i]
    }
  }
  return -1
}

分析过程：
- 第一步：识别循环结构。外层循环遍历数组，从 0 到 n-1，执行 n 次。
- 第二步：分析内层循环。内层从 i+1 开始到 n-1，平均执行 n/2 次。
- 第三步：计算嵌套关系。两层循环嵌套，总执行次数为 n * (n-1) / 2。
- 第四步：提取最高阶项。忽略常数和低阶项，时间复杂度为 O(n²)。

结论：时间复杂度为 O(n²)，空间复杂度为 O(1)。

---

现在请分析以下代码的时间复杂度：

function buildIndex(documents) {
  const index = new Map()
  for (const doc of documents) {
    const words = doc.content.split(' ')
    for (const word of words) {
      if (!index.has(word)) {
        index.set(word, [])
      }
      index.get(word).push(doc.id)
    }
  }
  return index
}
```
:::

::: tip CoT 使用建议
CoT 对于需要多步推理的任务效果最佳。对于简单的事实性问答（如"Vue 3 的最新版本号是多少？"），使用 CoT 反而会增加不必要的 Token 消耗而无明显收益。
:::

## 二、思维树（Tree of Thought）

思维树（Tree of Thought，简称 ToT）是 CoT 的扩展。CoT 是单一的线性推理链，而 ToT 允许模型同时探索多条推理路径，评估每条路径的可行性，最终选择最优方案。

### 1. 核心思想

ToT 模拟人类面对复杂问题时的思维方式——先列出多种可能方案，评估各方案的优劣，再选择最优方案深入执行。

### 2. 实现方式

::: details 思维树 Prompt 示例
```text
你需要为一个高并发的实时聊天系统选择消息存储方案。

请按照以下思维树流程进行分析：

## 第一步：列出候选方案
列出至少 3 种可行的消息存储方案。

## 第二步：逐一评估
对每种方案从以下维度打分（1-5 分）：
- 写入性能
- 读取性能
- 数据可靠性
- 水平扩展能力
- 运维复杂度（分数越高越简单）

## 第三步：排除不可行方案
根据评估结果，排除明显不适合的方案，说明排除理由。

## 第四步：深入分析最优方案
对得分最高的方案进行详细的架构设计，包括：
- 数据模型设计
- 读写分离策略
- 缓存方案
- 容灾备份
```
:::

### 3. ToT 与 CoT 的对比

| 特征 | CoT | ToT |
|------|-----|-----|
| 推理路径 | 单一线性 | 多路径并行 |
| 决策方式 | 顺序推导 | 评估后选择最优 |
| Token 消耗 | 中等 | 较高 |
| 适用场景 | 有明确解题路径的问题 | 开放性设计、方案选型 |
| 实现难度 | 简单 | 较复杂 |

## 三、ReAct 模式

ReAct（Reasoning + Acting）是一种结合推理和行动的 Prompt 模式。模型在每一步先进行推理（Thought），再决定执行什么操作（Action），然后根据操作结果（Observation）继续推理。

### 1. ReAct 的工作流程

```
Thought → Action → Observation → Thought → Action → Observation → ... → Final Answer
```

这种模式在 AI Agent 的构建中广泛使用，它让模型能够与外部工具交互，而不仅仅依赖自身的知识库。

### 2. 实现示例

::: details ReAct 模式 Prompt 示例
```text
你是一个能调用工具的编程助手。请使用 Thought/Action/Observation 模式解决问题。

可用工具：
- search_npm(package_name): 搜索 npm 包信息
- read_file(file_path): 读取项目文件内容
- run_test(test_command): 运行测试命令

问题：项目中的 axios 请求偶尔返回 undefined，请排查原因。

---

Thought: 首先我需要查看项目中 axios 的配置和拦截器设置，这通常是响应处理出问题的
常见原因。

Action: read_file("src/utils/request.ts")

Observation: [文件内容显示响应拦截器中有一个条件分支没有 return 语句]

Thought: 发现问题了。响应拦截器中当 response.data.code 不等于 200 时，
执行了 ElMessage.error() 但没有 return 或 throw，导致 Promise resolve 了
undefined。我需要确认这个判断来修复它。

Action: read_file("src/api/user.ts")

Observation: [API 调用代码显示直接使用了 const data = await getUserInfo()
没有做 undefined 检查]

Thought: 问题确认。需要在响应拦截器的错误分支中添加 return Promise.reject()，
同时建议 API 调用处添加错误处理。

Final Answer: [给出具体的修复方案和代码]
```
:::

::: warning ReAct 的局限性
ReAct 模式依赖模型正确地决定"下一步该做什么"。在实际的 Agent 系统中，你需要配合函数调用（Function Calling）能力来实现真正的工具调用，而不是模拟输出。
:::

## 四、自我一致性（Self-Consistency）

自我一致性是通过让模型对同一问题生成多个不同的推理路径，然后取多数一致的结果作为最终答案。这种方法类似于"三人投票"——多数人同意的答案更可能是正确的。

### 1. 实现方式

::: details 自我一致性 Prompt 示例
```text
请用 3 种不同的思路分析以下代码的输出结果，然后给出你最终的确定答案。

const result = ['1', '2', '3'].map(parseInt)
console.log(result)

## 思路一
（从 map 回调参数的角度分析）

## 思路二
（从 parseInt 的参数签名角度分析）

## 思路三
（通过手动展开每次调用来验证）

## 最终答案
（综合三种思路，给出确定的输出结果）
```
:::

### 2. 适用场景

自我一致性在以下场景中特别有效：

- **有明确正确答案的问题**：数学计算、代码输出预测、逻辑推理
- **模型容易"翻车"的问题**：JavaScript 类型转换、作用域陷阱等
- **面试题解答**：确保分析的严谨性和准确性

## 五、结构化输出

结构化输出是指引导模型以特定的数据格式（如 JSON、XML、YAML）返回结果，便于程序直接解析和使用。

### 1. JSON 输出

::: details JSON 输出 Prompt 示例
```text
分析以下 package.json 的依赖项，识别可能存在安全风险或版本过旧的包。

请严格按照以下 JSON 格式返回结果，不要包含任何其他文本：

{
  "totalDependencies": number,
  "issues": [
    {
      "packageName": "string",
      "currentVersion": "string",
      "latestVersion": "string",
      "severity": "high" | "medium" | "low",
      "reason": "string",
      "suggestion": "string"
    }
  ],
  "summary": "string"
}

package.json:
{
  "dependencies": {
    "vue": "^3.2.0",
    "axios": "^0.21.1",
    "lodash": "^4.17.15",
    "moment": "^2.29.1",
    "node-fetch": "^2.6.0"
  }
}
```
:::

### 2. 表格输出

::: details 表格输出 Prompt 示例
```text
对比以下 5 个 Node.js ORM 框架，以 Markdown 表格格式输出。

对比维度：
- TypeScript 支持程度
- 学习曲线
- 性能表现
- 社区活跃度
- 支持的数据库

框架：Prisma、TypeORM、Sequelize、Drizzle ORM、Knex.js
```
:::

### 3. 确保格式严格性的技巧

| 技巧 | 说明 | 示例 |
|------|------|------|
| 提供完整的 Schema | 给出 JSON Schema 或 TypeScript 接口定义 | `interface Output { ... }` |
| 明确禁止额外内容 | 告诉模型不要输出 JSON 之外的文字 | "只输出 JSON，不要包含 ```json 标记" |
| 提供填充示例 | 给出一个完整的示例 JSON | Few-shot + JSON 模板 |
| 使用 API 的 JSON 模式 | 部分 API 支持强制 JSON 输出 | OpenAI 的 `response_format: { type: "json_object" }` |

::: tip API 调用中的结构化输出
如果你通过 API 调用模型，建议优先使用模型原生的结构化输出能力（如 OpenAI 的 JSON Mode 或 Function Calling），而不是仅依赖 Prompt 约束。原生能力可以保证 100% 输出有效的 JSON。
:::

## 六、Prompt 链（Prompt Chaining）

Prompt 链是将一个复杂任务拆分为多个子任务，每个子任务使用独立的 Prompt 完成，前一个 Prompt 的输出作为后一个 Prompt 的输入。

### 1. 为什么需要 Prompt 链

单个 Prompt 处理复杂任务时容易出现以下问题：

- **注意力分散**：任务要求过多，模型遗漏部分细节
- **质量下降**：输出越长，后半部分质量越低
- **难以调试**：出错时不知道是哪个环节的问题

Prompt 链通过"分而治之"解决这些问题。

### 2. 实现示例

以"自动生成 API 文档"为例，展示一个三步 Prompt 链：

::: details 步骤一：提取 API 信息
```text
分析以下 Express 路由代码，提取所有 API 端点信息。
以 JSON 数组格式返回，每个端点包含：method、path、description、parameters。

// routes/userRoutes.ts
router.get('/api/users', UserController.getList)
router.get('/api/users/:id', UserController.getById)
router.post('/api/users', UserController.create)
router.put('/api/users/:id', UserController.update)
router.delete('/api/users/:id', UserController.delete)
```
:::

::: details 步骤二：补充请求/响应模型
```text
基于以下 API 端点信息，为每个端点补充完整的请求参数类型和响应数据类型。
使用 TypeScript interface 格式定义。

[步骤一的 JSON 输出粘贴于此]
```
:::

::: details 步骤三：生成最终文档
```text
基于以下 API 端点信息和类型定义，生成完整的 API 文档（Markdown 格式）。
每个端点包含：描述、请求方法、URL、请求参数表格、响应字段表格、curl 示例。

[步骤二的输出粘贴于此]
```
:::

### 3. Prompt 链的设计原则

- **每步职责单一**：每个 Prompt 只完成一个明确的子任务
- **输出格式标准化**：使用 JSON 等结构化格式传递中间结果
- **可独立验证**：每步的输出都可以单独检查是否正确
- **错误可回溯**：出问题时只需重新执行对应步骤

## 七、角色扮演（Role-Playing）

角色扮演是一种通过设定具体的人物角色来引导模型输出的高级技巧。与简单的角色设定不同，高级角色扮演会设定详细的背景、性格、知识边界和行为规则。

### 1. 深度角色设定

::: details 深度角色扮演示例
```text
# 角色设定

你是张明，一位在阿里巴巴工作了 8 年的高级前端技术专家（P7）。

## 专业背景
- 主导过 3 个日活超百万的中后台系统
- 精通 React 全家桶，对 Vue 也有深入了解
- 在性能优化方面有丰富经验，曾将首屏加载时间从 5s 优化到 1.2s
- 熟悉微前端架构，负责过基于 qiankun 的微前端改造

## 行为规则
- 回答问题时会结合实际项目经验，给出"踩坑"教训
- 对于不确定的技术点会坦诚说明，不会编造答案
- 倾向于给出经过生产验证的方案，而非理论最优方案
- 会主动提醒面试者容易忽略的边界情况

## 当前场景
你正在面试一位 3 年经验的前端开发者，评估其是否达到高级前端工程师的水平。
请根据候选人的回答，给出评价和追问。
```
:::

### 2. 多角色协作

你可以在一个 Prompt 中设定多个角色，让它们围绕一个话题进行讨论或辩论。

::: details 多角色协作示例
```text
请模拟以下三位工程师对"是否应该将单体应用拆分为微服务"的技术讨论：

- 架构师李工（支持微服务）：有 10 年分布式系统经验
- 开发主管王工（谨慎派）：关注团队能力和交付效率
- 运维工程师赵工（反对派）：担心运维复杂度

## 讨论背景
- 当前单体应用代码量 50 万行，团队 15 人
- 日活 20 万，核心业务响应时间 P99 达到 3 秒
- 每两周一次发布，经常因为模块耦合导致发布回滚

请让三位工程师各陈述观点（每人 3-4 段），然后得出一个团队共识。
```
:::

### 3. 角色扮演的适用场景

| 场景 | 角色设定方向 | 价值 |
|------|-------------|------|
| 模拟面试 | 面试官 / 候选人 | 提前准备、查漏补缺 |
| 方案评审 | 不同立场的技术专家 | 全面考虑方案的优劣 |
| 代码审查 | 严格的代码审查者 | 发现潜在问题和改进点 |
| 用户体验 | 不同技术水平的用户 | 优化文档和 API 设计 |
| 教学辅导 | 耐心的导师 | 逐步引导理解复杂概念 |

## 八、综合实践

在实际工作中，你往往需要组合使用多种技巧。以下是一个综合示例，结合了角色设定、CoT、结构化输出和约束限制。

::: details 综合实践示例
```text
# System Prompt

你是一个高级代码审查助手，拥有 OWASP Top 10 安全知识。

## 审查流程（请严格按此顺序执行）

### 第一步：理解代码意图
用一句话概括这段代码的业务目的。

### 第二步：逐行安全分析
对每个潜在风险点，按以下思路链进行分析：
1. 识别风险点 → 2. 分析攻击向量 → 3. 评估影响范围 → 4. 给出修复方案

### 第三步：输出结构化报告
以 JSON 格式输出，Schema 如下：
{
  "codeIntent": "string",
  "riskLevel": "critical" | "high" | "medium" | "low" | "safe",
  "findings": [{
    "line": number,
    "category": "string (OWASP 分类)",
    "description": "string",
    "impact": "string",
    "fix": "string",
    "fixedCode": "string"
  }],
  "overallSuggestion": "string"
}

## 约束
- 只关注安全问题，不评价代码风格
- 每个 finding 的 description 不超过 50 字
- fixedCode 只包含修改的代码片段，不需要完整文件

---

# User Prompt

请审查以下 Node.js API 代码：

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`
  const user = await db.query(query)
  if (user.length > 0) {
    const token = jwt.sign({ userId: user[0].id }, 'my-secret-key')
    res.json({ token })
  } else {
    res.status(401).json({ message: '登录失败' })
  }
})
```
:::

::: warning 技巧选择指南
不是每个任务都需要复杂的 Prompt 技巧。选择合适的技巧取决于任务的复杂度：
- **简单任务**（翻译、格式转换）：直接指令即可
- **中等任务**（代码生成、内容创作）：角色设定 + 格式约束
- **复杂任务**（架构设计、安全审计）：CoT + 结构化输出 + Prompt 链
- **开放性任务**（方案选型、技术辩论）：ToT + 多角色协作
:::
