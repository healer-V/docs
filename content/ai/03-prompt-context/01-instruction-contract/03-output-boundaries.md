---
title: "输出边界"
tags:
  - AI 应用开发
  - Prompt
  - 输出契约
excerpt: "为工单回复定义允许结论、禁止承诺和人工接管条件，并用离线检查区分结构合法与语义越界的输出。"
date: 2026-11-15
---

# 输出边界

结构化输出可以保证字段齐全、类型正确，却不能保证回复没有越过业务权限。一个通过 JSON Schema 校验的对象，仍然可以把“已为您办理全额退款”放进 `reply` 字段。输出边界约束的是语义：允许得出哪些结论、禁止作出哪些承诺、证据不足时如何表达、什么条件下必须转人工。

本文为工单回复定义一份语义契约，并用离线脚本检查其中可以确定性判断的部分。Schema 语法、结构化输出请求和解析属于模型接入；本文只讨论输出内容的业务边界。

::: tip 核心判断
先定义输出对象和消费者，再列允许结论、禁止承诺和转人工条件；格式检查、语义检查、业务授权和人工评审是四层，不要用一层代替另一层。
:::

## 一、输出契约

### 1. 输出对象与消费者

输出契约先规定有哪些字段、每个字段给谁使用。本文的工单回复包含五个字段：

| 字段 | 含义 | 允许值 | 消费者用途 |
|------|------|--------|------------|
| `category` | 工单类别 | 物流、退款、产品缺陷、其他 | 工单路由 |
| `priority` | 优先级 | `P0`～`P3` | 排队与升级 |
| `reply` | 给客户的简短回复 | 不超过 120 字符 | 坐席确认后发送 |
| `needs_human` | 是否转人工 | `true`、`false` | 自动流程闸门 |
| `claims` | 回复声明的事实 | `键=值` 列表 | 事实校验 |

`reply` 是草稿，不是直接发送给客户的最终文案。这个消费者关系决定了回复可以简短，但不能包含未经授权的承诺；坐席确认和业务系统授权仍然是发送前的必要步骤。

每个字段都必须有消费者。没有下游使用的字段会增加模型负担，也会让输出契约难以判断：字段存在但没人使用，失败时无法定位影响。设计时可以先列出消费者，再决定字段，而不是先让模型“多输出一些信息”。

### 2. 允许结论与禁止承诺

输出边界不是禁止所有涉及退款的文字，而是区分“记录诉求”和“承诺结果”：

| 类型 | 例子 | 判断 |
|------|------|------|
| 允许：记录诉求 | “已记录退款诉求，将转人工核实” | 不承诺结果 |
| 允许：说明已知事实 | “当前订单状态为运输中” | 事实来自输入 |
| 禁止：承诺退款 | “已为您办理全额退款” | 越过业务权限 |
| 禁止：承诺时限 | “今天一定退款” | 没有业务依据 |
| 禁止：编造状态 | “您的订单已发货” | 输入没有该事实 |

“已记录退款诉求”包含“退款”两个字，却是允许的：它描述的是应用已经收到的信息，没有承诺退款结果。“已为您办理全额退款”则把应用没有执行、也没有权限执行的动作写成了既成事实。关键词检查如果只匹配“退款”，会把前者误判；如果完全不检查承诺模式，又会放过后者。

允许结论必须有输入事实支持。模型可以说“订单状态为运输中”，前提是输入里确实有这个状态；模型不能说“仓库已安排补发”，除非输入提供了补发记录。输出契约中的 `claims` 字段用于声明回复引用了哪些事实，检查器再与输入事实比对。生产系统可以用结构化输出、引用字段或检索证据实现同样的约束。

### 3. 证据不足与人工接管

证据不足时，正确的输出不是“猜一个答案”，而是明确转人工。本文的转人工条件包括：

| 条件 | 要求 | 原因 |
|------|------|------|
| 客户提到退款 | `needs_human=true` | 涉及资金和业务权限 |
| 订单状态为 `unknown` | `needs_human=true` | 没有足够事实支持物流判断 |
| 输入事实互相冲突 | `needs_human=true` | 不能替业务选择 |
| 政策未覆盖当前诉求 | `needs_human=true` | 需要人工解释 |

`needs_human` 是契约字段，不是给模型的建议。应用必须在发送前读取它：为 `true` 时进入人工队列，为 `false` 时才允许自动流程继续。如果应用忽略这个字段，模型即使正确标记了转人工，工单仍可能被自动发送。

::: info 输出契约与任务卡的分工
[任务与成功标准](01-task-success-criteria.md)定义任务、输入、消费者和成功标准；本文把其中的输出部分展开为语义契约和检查器。任务卡回答“要完成什么”，输出边界回答“哪些结果不能出现”。
:::

## 二、结构正确与语义安全

### 1. Schema 保证什么

JSON Schema 可以约束字段是否存在、类型是否正确、枚举是否合法、是否允许额外字段。它不能判断 `reply` 中的业务承诺是否越权，也不能证明 `claims` 与输入事实一致。一个对象可以完全通过 Schema 校验，同时包含一句“已为您办理全额退款”。

```json
{
  "category": "退款",
  "priority": "P0",
  "reply": "已为您办理全额退款。",
  "needs_human": false,
  "claims": ["refund_requested=true"]
}
```

这段对象的结构没有问题：类别和优先级都在枚举内，`reply` 是字符串，`needs_human` 是布尔值。它的问题在语义层：回复承诺了退款，且没有转人工。结构化输出的语法和请求方式见 [JSON Schema 输出](../../02-model-integration/03-structured-output/01-json-schema-output.md)；本文不重复 Schema 定义。

::: warning Schema 不是业务授权
Schema 只证明输出符合约定形状。它不证明回复真实、合规或有权执行。把 Schema 校验通过当成“可以发送”，会把结构正确误当成语义安全。
:::

### 2. 业务权限

模型输出是提案，不是授权。是否退款、是否补发、是否发送给客户，应由应用代码、业务规则和人工确认决定。模型可以建议“转人工”，但不能自己批准退款；模型可以生成回复草稿，但不能绕过坐席确认。

| 层 | 回答的问题 | 负责方 |
|----|------------|--------|
| 输出检查 | 是否包含禁止承诺、是否满足转人工条件 | 应用代码 |
| 业务规则 | 当前工单是否允许该动作、金额和权限是否匹配 | 业务系统 |
| 人工确认 | 复杂政策、异常诉求、高风险动作 | 坐席或审核人员 |

`needs_human=false` 只表示模型认为可以自动处理，不表示业务系统已经授权。应用不能用这个布尔值替代权限判断；它只是自动流程的一个输入。

### 3. 检查分层

输出安全需要多层检查，每层发现的问题不同：

| 层 | 检查 | 能发现 | 不能发现 |
|----|------|--------|----------|
| 结构 | JSON Schema | 缺字段、类型错误、枚举越界 | 语义越界 |
| 语义 | 本文脚本 | 明确禁止短语、转人工条件、未支持声明 | 改写、隐含承诺 |
| 业务 | 应用规则 | 权限、金额、订单状态 | 文本质量 |
| 人工 | 坐席或评审 | 语气、帮助性、复杂政策 | 规模化 |

没有一层能单独保证安全。Schema 通过不代表语义正确，关键词检查通过不代表业务授权，人工确认也不能覆盖所有自动流程。分层的目的是让每类失败都有对应的拦截位置。

## 三、离线检查

### 1. 契约字段

示例把输出契约拆成三个对象：

| 对象 | 作用 | 关键字段 |
|------|------|----------|
| `OutputContract` | 规定允许值和禁止模式 | 类别、优先级、长度、禁止正则、转人工开关 |
| `CaseFacts` | 提供当前工单的已知事实 | 是否提到退款、订单状态、事实键值表 |
| `Reply` | 待检查的结构化回复 | 类别、优先级、文本、是否转人工、事实声明 |

`claims` 是简化的事实声明机制。回复中每条事实写成 `键=值`，检查器只在 `CaseFacts.known_facts` 中查找；找不到或值不一致就报告违规。生产系统可以把 `claims` 换成结构化引用、检索证据 ID 或字段级来源标记。

### 2. 检查函数

`check_reply()` 执行五类确定性检查：

1. `category` 和 `priority` 是否在允许集合内；
2. `reply` 是否超过长度限制；
3. `reply` 是否命中禁止承诺正则；
4. 退款诉求或未知订单状态是否要求转人工；
5. `claims` 是否都能由输入事实支持。

禁止模式只覆盖明确写法，例如“已办理退款”“保证退款”“一定退款”。它们能拦截本文的越界样本，但不能覆盖所有自然语言改写。回复“我们会把款项原路退回”可能不命中这些模式，却仍然是一种退款承诺。

::: warning 关键词检查不能证明安全
正则表达式只能发现它见过的表达。改写、反问、多语言、上下文暗示和长回复中的隐含承诺都可能绕过。关键词检查是低成本闸门，不是语义安全的完整证明；高风险业务仍需语义分类、业务授权和人工评审。
:::

### 3. 完整程序

示例从空目录开始，只使用 Python 标准库。新建 `output_contract_demo.py`，保存下面的代码。

::: details 查看输出契约检查完整代码

```python
# output_contract_demo.py
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, List, Set


@dataclass(frozen=True)
class OutputContract:
    """工单回复的语义契约。"""

    allowed_categories: Set[str]
    allowed_priorities: Set[str]
    max_reply_chars: int
    forbidden_patterns: List[str]
    escalate_on_refund: bool
    escalate_on_unknown_status: bool


@dataclass(frozen=True)
class CaseFacts:
    """当前工单中可以被回复引用的事实。"""

    mentions_refund: bool
    order_status: str
    known_facts: Dict[str, str]


@dataclass(frozen=True)
class Reply:
    """待检查的结构化回复。"""

    category: str
    priority: str
    text: str
    needs_human: bool
    claims: List[str] = field(default_factory=list)


def check_reply(reply: Reply, facts: CaseFacts, contract: OutputContract) -> List[str]:
    """检查回复的结构、禁止承诺、转人工条件和事实声明。

    Args:
        reply: 待检查的回复对象。
        facts: 当前工单的已知事实。
        contract: 当前任务的输出契约。

    Returns:
        违规信息列表；为空表示通过确定性检查。
    """
    violations: List[str] = []
    if reply.category not in contract.allowed_categories:
        violations.append(f"category 不在允许集合：{reply.category}")
    if reply.priority not in contract.allowed_priorities:
        violations.append(f"priority 不在允许集合：{reply.priority}")
    if len(reply.text) > contract.max_reply_chars:
        violations.append(f"回复超过 {contract.max_reply_chars} 字符")
    for pattern in contract.forbidden_patterns:
        if re.search(pattern, reply.text):
            violations.append(f"回复命中禁止承诺：{pattern}")
    if contract.escalate_on_refund and facts.mentions_refund and not reply.needs_human:
        violations.append("退款诉求必须转人工")
    if (
        contract.escalate_on_unknown_status
        and facts.order_status == "unknown"
        and not reply.needs_human
    ):
        violations.append("未知订单状态必须转人工")
    for claim in reply.claims:
        key, _, value = claim.partition("=")
        if facts.known_facts.get(key) != value:
            violations.append(f"无法由输入支持的事实声明：{claim}")
    return violations


def main() -> int:
    """用四条固定回复演示结构正确与语义越界的区别。

    Returns:
        合格回复通过且三条越界回复都被拦截时返回 0，否则返回 1。
    """
    contract = OutputContract(
        allowed_categories={"物流", "退款", "产品缺陷", "其他"},
        allowed_priorities={"P0", "P1", "P2", "P3"},
        max_reply_chars=120,
        forbidden_patterns=[r"已(为您)?办理.*退款", r"保证.*退款", r"一定.*退款"],
        escalate_on_refund=True,
        escalate_on_unknown_status=True,
    )
    facts = CaseFacts(
        mentions_refund=True,
        order_status="unknown",
        known_facts={"refund_requested": "true"},
    )
    replies = [
        Reply(
            "退款", "P1",
            "已记录退款诉求，将由人工核实订单状态后处理。",
            True, ["refund_requested=true"],
        ),
        Reply(
            "退款", "P0",
            "已为您办理全额退款。",
            False, ["refund_requested=true"],
        ),
        Reply("其他", "P2", "我们会尽快处理。", False),
        Reply(
            "物流", "P2",
            "您的订单已发货。",
            False, ["order_status=shipped"],
        ),
    ]
    expectations = [False, True, True, True]
    failed = False
    for index, reply in enumerate(replies):
        violations = check_reply(reply, facts, contract)
        should_fail = expectations[index]
        expectation_met = bool(violations) == should_fail
        label = "good" if index == 0 else f"case{index + 1}"
        result = "failed" if violations else "passed"
        print(
            f"reply[{label}]={result} "
            f"expectation={'met' if expectation_met else 'not_met'}"
        )
        for violation in violations:
            print(f"  {violation}")
        failed = failed or not expectation_met
    print(f"self_test={'passed' if not failed else 'failed'}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
```

:::

`check_reply()` 先做结构和枚举检查，再检查禁止承诺与转人工条件，最后比对事实声明。`main()` 用一条合格回复和三条越界回复验证检查器：合格回复应通过，三条越界回复应分别因承诺、缺少转人工和编造事实被拦截。

### 4. 运行结果

在保存文件的目录执行：

```bash
python3 output_contract_demo.py
```

脚本输出如下。退出码为 `0`，表示四条回复的通过或失败都与预期一致。

::: details 查看输出契约检查实际输出

```text
reply[good]=passed expectation=met
reply[case2]=failed expectation=met
  回复命中禁止承诺：已(为您)?办理.*退款
  退款诉求必须转人工
  未知订单状态必须转人工
reply[case3]=failed expectation=met
  退款诉求必须转人工
  未知订单状态必须转人工
reply[case4]=failed expectation=met
  退款诉求必须转人工
  未知订单状态必须转人工
  无法由输入支持的事实声明：order_status=shipped
self_test=passed
```

:::

四条结果的核心区别如下：

- `good` 提到退款，但只是记录诉求并转人工，没有命中禁止承诺，事实声明也能由输入支持。
- `case2` 的结构合法，但“已为您办理全额退款”命中禁止模式；同时它没有转人工，触发退款和未知状态两条检查。这是“格式正确、语义越界”的典型。
- `case3` 没有承诺退款，但回复没有转人工，触发退款和未知状态检查。它说明“不越界”不等于“满足流程要求”。
- `case4` 回复“订单已发货”，但输入状态是 `unknown`；它同时缺少转人工，并声明了输入无法支持的事实。

`case3` 和 `case4` 的文本都很短，也没有明显冒犯；它们失败的原因是流程和事实边界，而不是语气。人工评审仍然需要判断回复是否有帮助，脚本只负责把确定性违规固定下来。

## 四、失败边界与适用范围

输出契约的常见失效点如下：

| 现象 | 定位证据 | 修复 |
|------|----------|------|
| 改写绕过关键词 | 回复用“原路退回”等表达承诺退款 | 增加语义分类或人工评审，不只扩关键词 |
| Schema 通过但承诺越界 | 字段齐全，`reply` 含禁止承诺 | 语义检查与业务权限控制 |
| 转人工标志被忽略 | `needs_human=true` 但应用仍自动发送 | 应用层强制闸门 |
| 未声明的事实 | `claims` 为空，回复却编造状态 | 要求事实声明或引用；接入证据校验 |
| 检查器误报 | 合法回复被禁止模式拦截 | 调整模式或人工复核，记录误报 |
| 多语言或长上下文绕过 | 其他语言、历史轮次中的承诺 | 多语言样本与会话级检查 |

本文覆盖单轮工单回复的语义契约和离线检查，不展开 JSON Schema 语法、结构化输出请求、提示注入防护、完整评测平台和法律合规判断。文中的脚本只能验证本文列出的确定性条件；它不能证明回复真实、合规或在所有业务场景下安全。

::: info 验证记录与边界
2026-11-15 在 macOS 25.5.0、Python 3.9.6 下，从空目录保存 `output_contract_demo.py` 并执行 `python3 output_contract_demo.py`，四条预期判定全部成立，退出码为 `0`。未验证：真实模型输出、Python 3.12.14、改写与多语言绕过、生产业务授权链路和人工评审一致性。
:::

## 五、参考资料

- [OpenAI Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [OpenAI Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [JSON Schema 输出](../../02-model-integration/03-structured-output/01-json-schema-output.md)
- [任务与成功标准](01-task-success-criteria.md)
- [指令层级](02-instruction-hierarchy.md)
- [指令与数据边界](../02-prompt-construction/01-instructions-data-boundary.md)
