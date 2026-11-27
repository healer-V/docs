---
title: "Agent手撕与系统设计面试题"
category: "面试题"
tags:
  - Agent
  - 手撕代码
  - 系统设计
excerpt: "按国内大厂 Agent 开发岗面经整理：不依赖框架手写最小 ReAct Agent、工具调用死循环检测器、上下文滑动窗口与摘要裁剪、带超时重试的多 Agent 路由器，以及企业知识库、电商客服、代码评审和运维排障 Agent 的系统设计。代码可在 Python 3.9 及以上直接运行。"
---

# Agent手撕与系统设计面试题

Agent 岗的手撕分为两类：通用算法题照常考（接雨水、岛屿数量、最长有效括号等，见各公司面经），以及 2026 年明显增多的 Agent 工程手撕，例如“脱离框架手写一个最小 ReAct Agent”“判断调用轨迹是否陷入死循环”。系统设计题常作为压轴题，要求从链路、上下文、工具、安全和评测几个角度完整展开。

::: info 代码运行方式
本篇代码只使用 Python 标准库，在空目录中保存为对应文件名后执行 `python3 文件名.py` 即可运行，已在 Python 3.9.6 上验证输出。示例用“脚本化模型”代替真实大模型，方便离线验证控制逻辑；接入真实 API 时只需替换模型决策部分。
:::

## 一、Agent 手撕

### 1. 不依赖框架，手写一个最小 ReAct Agent

**最小 Agent 需要四个部分：工具注册表、模型决策、循环控制和终止条件，外加工具异常处理。** 面试时先说明设计，再写代码：工具用装饰器登记到字典中，按名称分派；每一步由模型返回“调用工具”或“最终回答”；工具异常转成错误信息回传给模型；运行时用最大步数和重复调用次数保证一定会结束，并返回终止原因。

在空目录创建 `react_agent.py`。`ScriptedModel` 按预设顺序返回决策，模拟一个先查订单、再查库存、最后回答的模型：

::: details 查看 react_agent.py 的完整实现

```python
import json

TOOLS = {}


def tool(func):
    """把函数登记到工具表；返回原函数，供模型按名称调用。"""
    TOOLS[func.__name__] = func
    return func


@tool
def get_order(order_id):
    """查询订单状态；返回包含状态和支付日期的字典。"""
    orders = {"1001": {"status": "paid", "paid_days": 7}}
    if order_id not in orders:
        raise ValueError("订单不存在，请向用户确认订单号")
    return orders[order_id]


@tool
def get_stock(order_id):
    """查询订单商品的仓库状态；返回库存状态字典。"""
    return {"stock": "out_of_stock"}


class ScriptedModel:
    """按预设顺序返回决策的模拟模型，接入真实 API 时替换 decide 方法。"""

    def __init__(self, decisions):
        self.decisions = list(decisions)

    def decide(self, messages):
        """根据消息历史返回下一步决策：工具调用或最终回答。"""
        return self.decisions.pop(0)


def run_agent(model, question, max_steps=5, max_repeats=2):
    """执行有界的 ReAct 循环；返回 (终止原因, 最终回答或 None, 消息轨迹)。"""
    messages = [{"role": "user", "content": question}]
    seen = {}
    for _ in range(max_steps):
        decision = model.decide(messages)
        if decision["type"] == "final":
            return "completed", decision["content"], messages
        name, args = decision["name"], decision["args"]
        key = name + json.dumps(args, sort_keys=True)
        seen[key] = seen.get(key, 0) + 1
        if seen[key] > max_repeats:
            return "repeated_call", None, messages
        if name not in TOOLS:
            result = {"error": "未知工具 " + name}
        else:
            try:
                result = TOOLS[name](**args)
            except Exception as error:  # 工具错误回传给模型，让它修正
                result = {"error": str(error)}
        messages.append({"role": "tool", "name": name, "content": json.dumps(result, ensure_ascii=False)})
    return "max_steps_exceeded", None, messages


if __name__ == "__main__":
    model = ScriptedModel([
        {"type": "tool", "name": "get_order", "args": {"order_id": "1001"}},
        {"type": "tool", "name": "get_stock", "args": {"order_id": "1001"}},
        {"type": "final", "content": "订单已支付 7 天，因缺货暂未发货"},
    ])
    reason, answer, trace = run_agent(model, "订单 1001 为什么还没发货？")
    print(reason, answer)
    for message in trace[1:]:
        print(message["name"], message["content"])
    looping = ScriptedModel([{"type": "tool", "name": "get_order", "args": {"order_id": "9"}}] * 5)
    print(run_agent(looping, "查订单 9")[0])
```

:::

执行 `python3 react_agent.py`，输出如下：

```text
completed 订单已支付 7 天，因缺货暂未发货
get_order {"status": "paid", "paid_days": 7}
get_stock {"stock": "out_of_stock"}
repeated_call
```

前三行表示正常路径：调用两个工具后得到最终回答，终止原因为 `completed`。最后一行是第二个模型反复用相同参数查询不存在的订单，第三次时触发重复调用限制，返回 `repeated_call` 而不是无限循环。工具抛出的“订单不存在”被转为错误结果回传，没有让程序崩溃。

面试官常见追问：接入真实模型时，`decide` 改为调用模型 API，把 `TOOLS` 转换为工具的 JSON Schema 随请求发送，模型返回的工具调用解析为 `name` 和 `args`；还需要补充 Token 预算、总超时、参数 Schema 校验和高风险工具的人工确认。

参考：[Yao et al.：ReAct](https://arxiv.org/abs/2210.03629)、[OpenAI：函数调用](https://developers.openai.com/api/docs/guides/function-calling)。

### 2. 给定工具调用轨迹，判断 Agent 是否陷入死循环

**题目：给定调用轨迹 `calls`（每项包含 `tool` 和 `args`），如果最近 `window` 次调用中，同一工具带相同参数出现了 `k` 次及以上，就判定为死循环。** 关键点是参数的规范化：`{"a": 1, "b": 2}` 和 `{"b": 2, "a": 1}` 是相同的参数，比较前要按键排序后序列化。

在空目录创建 `loop_detector.py`：

::: details 查看 loop_detector.py 的完整实现

```python
import json
from collections import Counter


def is_looping(calls, window=5, k=3):
    """判断最近 window 次调用中，同一工具加相同参数是否出现 k 次及以上；返回布尔值。"""
    recent = calls[-window:]
    keys = [c["tool"] + json.dumps(c["args"], sort_keys=True, ensure_ascii=False) for c in recent]
    return any(count >= k for count in Counter(keys).values())


if __name__ == "__main__":
    weather = {"tool": "search", "args": {"q": "天气"}}
    other = {"tool": "search", "args": {"q": "新闻"}}
    print(is_looping([weather, other, weather, other, weather]))
    print(is_looping([weather, other, weather, other]))
    print(is_looping([{"tool": "f", "args": {"a": 1, "b": 2}}, {"tool": "f", "args": {"b": 2, "a": 1}},
                      {"tool": "f", "args": {"a": 1, "b": 2}}]))
```

:::

执行后依次输出 `True`、`False`、`True`：第一组最近 5 次中 `search(q="天气")` 出现 3 次；第二组只有 4 次调用，重复 2 次未达到阈值；第三组参数顺序不同但内容相同，规范化后被识别为同一调用。时间复杂度为 O(window)。

面试官常追问“只检测完全相同的参数够吗”：实际中模型可能在几个参数之间来回切换（A → B → A → B），或者参数只有细微差别，可以补充检测“最近 N 步没有产生新信息”（工具结果与之前相同），以及总步数和预算上限作为最后的保障。

参考：[OpenAI：Safety in building agents](https://developers.openai.com/api/docs/guides/agent-builder-safety)。

### 3. 手写上下文裁剪：给定消息列表和 Token 上限，决定保留和摘要的部分

**要求：系统提示始终保留；从最近的消息往前尽量多地保留原文；放不下的早期消息交给摘要函数压缩；工具调用和对应的工具结果必须一起保留或一起压缩。** 预算中预留一部分给摘要和模型输出，不能把窗口用满。

在空目录创建 `context_window.py`，示例用一个简单的 lambda 代替调用模型生成摘要：

::: details 查看 context_window.py 的完整实现

```python
def estimate_tokens(text):
    """粗略估算 Token 数：按每 2 个字符 1 个 Token 计算，生产环境应改用模型的分词器；返回整数。"""
    return max(1, len(text) // 2)


def group_turns(messages):
    """把工具调用与紧随其后的工具结果合并为一组，避免裁剪时拆散；返回分组列表。"""
    groups = []
    for message in messages:
        if message["role"] == "tool" and groups:
            groups[-1].append(message)
        else:
            groups.append([message])
    return groups


def fit_context(system, messages, budget, summarize):
    """保留系统提示和尽量多的最近消息，更早的部分交给 summarize 压缩；返回新的消息列表。"""
    used = estimate_tokens(system["content"])
    kept = []
    groups = group_turns(messages)
    while groups:
        cost = sum(estimate_tokens(m["content"]) for m in groups[-1])
        if used + cost > budget * 0.8:  # 预留 20% 给摘要和模型输出
            break
        kept = groups.pop() + kept
        used += cost
    older = [m for group in groups for m in group]
    if not older:
        return [system] + kept
    summary = {"role": "system", "content": "历史摘要：" + summarize(older)}
    return [system, summary] + kept


if __name__ == "__main__":
    system = {"role": "system", "content": "你是订单助手"}
    history = [
        {"role": "user", "content": "我的订单号是 1001，帮我查一下物流" * 3},
        {"role": "assistant", "content": "调用 get_order"},
        {"role": "tool", "content": "{\"status\": \"shipped\"}" * 3},
        {"role": "user", "content": "那预计什么时候到"},
        {"role": "assistant", "content": "预计明天送达"},
    ]
    result = fit_context(system, history, budget=60, summarize=lambda ms: f"{len(ms)} 条早期消息，订单号 1001")
    for message in result:
        print(message["role"], message["content"][:30])
```

:::

执行后输出如下，第一条较长的用户消息被压缩为摘要，`assistant` 的工具调用和随后的 `tool` 结果作为一组被完整保留：

```text
system 你是订单助手
system 历史摘要：1 条早期消息，订单号 1001
assistant 调用 get_order
tool {"status": "shipped"}{"status"
user 那预计什么时候到
assistant 预计明天送达
```

示例中的 Token 估算只是近似，生产环境应使用对应模型的分词器计数。面试官常追问“摘要什么时候生成”：可以在会话空闲时或子任务完成时异步生成并缓存，避免每次请求都同步调用模型增加延迟；摘要应按固定字段生成，并保留订单号、文件路径等关键实体。

参考：[Anthropic：Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)。

### 4. 手写多 Agent 消息路由器，处理超时和失败重试

**要求：按能力把任务分发给对应的子 Agent；没有对应 Agent 时拒绝；子 Agent 超时后按指数退避重试，超过次数返回失败；多个任务并行执行，一个任务失败不影响其他任务。**

在空目录创建 `router.py`。其中物流 Agent 被设计为前两次调用超时、第三次成功，用于验证重试逻辑：

::: details 查看 router.py 的完整实现

```python
import asyncio


async def billing_agent(task):
    """模拟账单子 Agent：处理账单类任务；返回处理结论字符串。"""
    await asyncio.sleep(0.1)
    return "账单已核对：" + task


async def logistics_agent(task):
    """模拟物流子 Agent：前两次调用超时，第三次成功；返回处理结论字符串。"""
    logistics_agent.calls += 1
    await asyncio.sleep(2 if logistics_agent.calls < 3 else 0.1)
    return "物流已查询：" + task


logistics_agent.calls = 0
ROUTES = {"billing": billing_agent, "logistics": logistics_agent}


async def dispatch(capability, task, timeout=0.5, retries=2):
    """按能力把任务分发给子 Agent，超时后重试；返回 (状态, 结果或错误说明)。"""
    agent = ROUTES.get(capability)
    if agent is None:
        return "rejected", "没有能处理 " + capability + " 的 Agent"
    for attempt in range(retries + 1):
        try:
            return "ok", await asyncio.wait_for(agent(task), timeout)
        except asyncio.TimeoutError:
            if attempt == retries:
                return "failed", f"{capability} 重试 {retries} 次后仍超时"
            await asyncio.sleep(0.05 * 2 ** attempt)  # 指数退避


async def main():
    """并行分发三个子任务并打印各自的状态；无返回值。"""
    results = await asyncio.gather(
        dispatch("billing", "订单 1001"),
        dispatch("logistics", "订单 1001"),
        dispatch("refund", "订单 1001"),
    )
    for status, detail in results:
        print(status, detail)


if __name__ == "__main__":
    asyncio.run(main())
```

:::

执行后约 1 秒内输出三行：`ok 账单已核对：订单 1001`、`ok 物流已查询：订单 1001`（第三次尝试成功）、`rejected 没有能处理 refund 的 Agent`。`asyncio.gather` 让三个任务并行执行，`dispatch` 内部捕获超时并返回状态，所以单个任务失败不会让其他任务中断。

需要说明的是，`asyncio.wait_for` 超时会取消协程，但如果子 Agent 内部调用的是阻塞的同步代码或已经发出的外部请求，取消并不能撤回已产生的副作用，重试前要确认操作是幂等的。生产环境中路由依据通常来自意图识别模型或 Agent Card 中声明的能力，而不是固定的字典。

参考：[Python：asyncio.wait_for](https://docs.python.org/3/library/asyncio-task.html#asyncio.wait_for)。

## 二、系统设计

### 1. 设计一个企业内部知识问答 Agent

**先明确需求：回答员工关于制度、流程、产品文档的问题，必须给出出处，不同部门只能看到有权限的文档，资料不足时要拒答。** 方案按离线入库、在线问答、权限和评测四部分展开。

| 部分 | 设计要点 |
|------|----------|
| 离线入库 | 对接 Wiki、网盘、工单系统；版面分析解析 PDF 和表格；按标题结构切分并补充标题路径；写入向量索引和 BM25 索引，元数据包含部门、密级、更新时间 |
| 在线问答 | 结合对话历史改写问题；混合检索 + RRF 融合 + 重排序；按用户权限过滤；要求依据资料回答并标注引用；检索相关度低于阈值时直接拒答 |
| 权限 | 用户身份来自统一登录，检索时把用户所属部门和角色作为过滤条件；文档权限变更时同步更新索引元数据 |
| 更新 | 按文档 ID 和内容哈希增量更新；更换 Embedding 模型时新建索引，验证后通过别名切换 |
| 评测与运营 | 评测集分别统计检索召回率、忠实度和拒答准确率；收集点踩的问题补充到评测集和知识库 |

面试官常追问“文档中的表格和图片怎么处理”“新旧两版制度冲突怎么办”：表格转为 Markdown 保留结构，图片用多模态模型生成描述；元数据中保留生效时间，检索时优先最新版本，或让模型指出版本差异。

参考：[OpenAI：文件检索](https://developers.openai.com/api/docs/guides/tools-file-search)。

### 2. 设计一个电商客服 Agent

**目标是自动解决查询订单、物流、退换货等常见问题，用户表达模糊时能主动澄清，涉及退款等资金操作必须有规则约束和人工兜底。核心指标是问题解决率和转人工率，同时监控用户满意度和错误操作次数。**

1. **意图识别与澄清：** 用模型识别意图并抽取订单号、商品等槽位；信息不足时追问，例如“请问是哪一笔订单？”，并直接列出用户最近的订单供选择，降低表达能力差异的影响。
2. **路由：** 查询类问题走确定性的 Workflow（查订单 → 查物流 → 组织回答）；复杂问题（多订单、投诉）交给 Agent 处理。
3. **工具：** 查询订单、查询物流、查询退货政策（RAG）、提交退货申请；工具以当前用户身份执行，只能访问本人订单。
4. **规则约束：** 退款金额、是否符合退货条件由业务规则引擎判断，模型只负责解释结果，不能自行承诺。
5. **人工兜底：** 用户情绪激烈、连续两次未解决、涉及赔偿时转人工，并把对话摘要和已查询的信息一并交给客服人员。

参考：[OpenAI：Safety in building agents](https://developers.openai.com/api/docs/guides/agent-builder-safety)。

### 3. 设计一个代码评审 Agent：输入一个 PR，怎么保证它只提意见、不改代码？

**整体流程是获取 PR 变更 → 收集相关上下文 → 分文件或分维度评审 → 去重和过滤 → 以评论形式发布。** “只提意见不改代码”要靠权限控制实现，而不是靠提示词约束。

| 环节 | 设计要点 |
|------|----------|
| 输入 | 获取 diff、PR 描述、关联需求；按文件拆分，超大 PR 提示拆分或只评审核心文件 |
| 上下文 | 按需检索被修改函数的调用方、相关测试和项目编码规范，而不是把整个仓库放入上下文 |
| 评审 | 按安全、正确性、性能、可维护性等维度分别检查；可以先运行静态检查和测试，把结果作为依据 |
| 过滤 | 去除重复和低价值意见，每条意见要求给出具体行号、问题和建议，置信度低的不发布 |
| 权限 | 只授予读取代码和发表评论的权限，不提供写入仓库、推送和合并的工具；在沙箱中运行检查命令 |
| 评测 | 用历史 PR 中人工评审发现的问题作为标注，统计意见的命中率和误报率；跟踪开发者对评论的采纳率 |

面试官常追问“误报太多开发者不看怎么办”：宁可少报也不要误报，设置置信度阈值，对同一类被开发者多次忽略的意见降低优先级，并定期用采纳率数据调整评审提示。

参考：[Anthropic：Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents)。

### 4. 设计一个运维排障 Agent：支付接口超时，它怎么完成排查，高危操作如何管控？

**排障 Agent 按“确认现象 → 收集证据 → 缩小范围 → 给出结论和建议”的流程工作，所有查询类操作可以自动执行，所有变更类操作（重启、回滚、扩容）必须人工审批。**

1. **确认现象：** 查询监控，确认支付接口超时的开始时间、影响比例、涉及哪些实例和地区。
2. **关联变更：** 查询告警时间附近的发布记录和配置变更，这是最常见的根因。
3. **分层排查：** 按链路追踪定位慢在哪一层：应用自身（CPU、GC、线程池）、数据库（慢查询、连接池）、下游支付渠道（响应时间、错误率）。
4. **给出结论：** 输出根因假设、支撑证据和建议操作，例如“14:02 发布后数据库慢查询增加，建议回滚到上一版本”。
5. **执行变更：** 回滚等操作生成审批单，由值班人员确认后执行，执行后继续观察指标是否恢复。

高危操作的管控方式：只开放预定义的操作模板，不允许执行任意 shell 命令；操作范围有白名单（如只能操作指定服务）；生产环境变更需要人工审批并留存审计记录；Agent 使用只读账号做排查，执行变更时才通过审批流程获得临时权限。

参考：[Google SRE：有效的故障排查](https://sre.google/sre-book/effective-troubleshooting/)、[OWASP：LLM06 过度代理](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/)。
