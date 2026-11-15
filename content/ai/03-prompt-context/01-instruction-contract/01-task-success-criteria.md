---
title: "任务与成功标准"
tags:
  - AI 应用开发
  - Prompt
  - 任务设计
excerpt: "把客服工单诉求写成包含输入、输出消费者、成功标准和不可接受结果的任务卡，并用离线检查验证可判定条件。"
date: 2026-11-15
---

# 任务与成功标准

任务卡先于 Prompt。它说明模型要完成什么动作、输入允许来自哪里、输出交给谁，以及什么结果算成功；Prompt 只是这份契约的一种实现。缺少任务卡时，团队只能凭“读起来不错”判断输出，无法比较两个 Prompt 版本，也无法在业务规则变化时判断旧行为是否仍然合格。

本文继续使用客户服务工单场景，把“处理客户反馈”收敛为可执行任务：对反馈分类、定级并生成简短回复。任务卡不绑定具体模型或 API；它约束输入、输出和验收，Prompt 构造、模型选择和结构化输出分别由相邻文章承担。

::: tip 任务卡的最小判断
任务动作要能用动词和对象描述；输入要写明允许的字段与未知值；输出要指明消费者；每条成功标准都要有观察对象、合格条件和证据。四项缺一项，后面的 Prompt 比较就失去基线。
:::

## 一、任务卡：从业务诉求到可执行对象

### 1. 任务动作与输入边界

任务动作描述模型要完成的行为，而不是业务部门的笼统目标。“处理客户反馈”无法判断完成与否；“对客户反馈分类、定级并生成简短回复”把动作拆成了三个可观察结果。动作越具体，后面的成功标准越容易落到字段上。

输入边界回答模型允许看到什么。本文的工单任务只接收两个字段：

| 字段 | 含义 | 允许值或范围 | 设计原因 |
|------|------|--------------|----------|
| `feedback_text` | 客户反馈原文 | 非空，最多 2000 字符 | 本次要分析的对象 |
| `order_status` | 订单状态 | `shipped`、`delivered`、`processing`、`unknown` | 支撑物流类判断 |

`unknown` 是合法输入，不是缺失数据。它表示当前系统没有可用状态，任务必须处理这种情况：模型不能把未知状态写成已知事实，回复应转人工或说明需要进一步核实。很多任务卡只写了“正常订单”，样本也只覆盖 `shipped`，于是模型在 `unknown` 上的行为从未被验收。

输入边界还要写明不接收什么。用户身份、支付流水、内部备注和完整聊天记录不在本文的输入范围内；即使业务系统能提供，也不应该因为“可能有帮助”就送进模型。输入越多，授权、隐私和上下文预算问题越复杂，这些内容分别属于应用架构、安全和性能模块。

::: info 输入边界不是 Prompt 的排版问题
字段是否允许进入模型，应由应用的数据授权和任务契约决定。Prompt 里写“不要使用用户身份”不能替代输入侧的最小化；模型看不到的数据，才不会被输出。
:::

### 2. 输出消费者

输出消费者决定字段和格式。同一个分类任务，交给客服坐席和交给工单路由系统，需要的输出并不相同：

| 消费者 | 需要的输出 | 不需要的输出 |
|--------|------------|--------------|
| 客服坐席 | 类别、优先级、简短回复、是否转人工 | 长篇推理过程 |
| 工单路由 | 稳定的类别与优先级枚举 | 自然语言解释 |
| 客户 | 可读的回复文本 | 内部优先级和路由字段 |

本文同时服务坐席和路由，因此输出对象包含 `category`、`priority`、`reply` 和 `needs_human`。`reply` 不是直接发送给客户的最终文案，而是给坐席确认的草稿；这个消费者关系决定了回复可以简短，但不能包含未经授权的承诺。

缺少消费者定义时，团队容易把所有“看起来有用”的内容都塞进输出：分析、建议、置信度、引用和下一步动作。字段越多，模型越难稳定生成，下游也不知道哪些字段可以依赖。每个输出字段都应该能回答“谁在什么流程里使用它”；回答不了，就删掉。

### 3. 成功与失败标准

成功标准必须能落到观察对象上。本文的任务卡使用四条成功标准和一组不可接受结果：

| 标准 | 观察对象 | 合格条件 | 证据 |
|------|----------|----------|------|
| 类别 | `category` | 属于物流、退款、产品缺陷、其他之一 | 结构化字段 |
| 优先级 | `priority` | 属于 `P0`～`P3` | 结构化字段 |
| 回复长度 | `reply` | 不超过 120 字符 | 字符串长度 |
| 人工接管 | `needs_human` | 退款诉求或未知订单状态为 `true` | 布尔字段 |
| 事实一致 | `claims` | 每条声明都能在输入事实中找到 | 事实键值表 |

失败标准描述“即使文字流畅也不能接受”的结果：承诺退款、编造订单状态、类别或优先级超出允许集合、退款或未知状态没有转人工。这些结果不是风格问题，而是业务权限和下游流程问题。把它们写在任务卡里，评审时就不需要争论“这句话算不算友好”。

::: warning 成功标准不能由模型自己判断
把“输出是否符合标准”交给同一个模型，会把待验证对象变成裁判。成功标准应由应用侧检查、固定样本或人工评审执行；模型可以生成候选结果，但不能单独证明自己合格。
:::

## 二、成功标准：从形容词到观察项

### 1. 形容词的问题

“准确、专业、友好”是常见的任务描述，却不是可执行标准。两位评审者对同一句回复是否“友好”可能给出不同结论；换一个 Prompt 版本后，也无法判断分数变化来自措辞、模型还是样本。

把形容词改写成观察项，需要指明看哪个字段、满足什么条件、用什么证据判断：

| 模糊标准 | 问题 | 可观察改写 |
|----------|------|------------|
| 回答准确 | 无法定位哪一部分准确 | `category` 属于允许集合，`claims` 可由输入支持 |
| 语气友好 | 没有统一阈值 | 回复不超过 120 字符，包含处理动作；语气由人工评审 |
| 处理及时 | 与模型输出无关 | `needs_human` 在退款或未知状态下为 `true` |

第三行说明了一个重要边界：有些业务目标不属于模型输出。“及时”取决于工单排队、坐席响应和服务水平，不应写成 Prompt 的成功标准。任务卡只约束模型能影响的部分，其余目标由工作流和监控承担。

### 2. 三类固定样本

成功标准需要样本才能落地。本文先选三类工单，覆盖正常路径、边界条件和多问题冲突：

| 样本 | 输入特征 | 期望输出 | 检查点 |
|------|----------|----------|--------|
| 正常物流延迟 | 订单状态为 `shipped`，反馈只问物流 | 类别物流，优先级 `P2`，回复说明正在查询 | 类别、优先级、回复长度 |
| 退款且状态未知 | 反馈含退款，`order_status=unknown` | 类别退款，优先级 `P1`，`needs_human=true` | 转人工条件、事实声明 |
| 多问题反馈 | 同时提到物流慢和退款 | 类别取退款，优先级 `P1`，回复覆盖两个问题 | 冲突时的类别优先级 |

第三类样本要求任务卡先定义多问题规则。本文的规则是“取风险最高的类别，回复中说明另一个问题”；如果没有这条规则，模型可能按先提到的物流分类，导致退款工单进入普通物流队列。任务卡不定义这条规则，样本就无法给出一致期望。

三类样本只是设计起点，不是完整评测集。正常样本证明主路径可用，边界样本证明失败分支存在，多问题样本证明规则冲突时有明确取舍。更大规模的固定样本、重复运行和回归门禁属于 Prompt 生命周期文章。

### 3. 不可接受结果

不可接受结果是任务卡的硬边界，不能靠更长的回复或更礼貌的语气抵消：

| 结果 | 为什么不可接受 | 检查方式 |
|------|----------------|----------|
| 承诺退款 | 越过业务权限，可能造成实际损失 | 退款关键词与转人工条件；承诺语义由[输出边界](03-output-boundaries.md)检查 |
| 编造订单状态 | 把未知事实写成已知，误导客户 | `claims` 与输入事实比对 |
| 类别或优先级超出枚举 | 下游路由无法处理 | 枚举检查 |
| 退款或未知状态未转人工 | 高风险工单进入自动流程 | 布尔条件检查 |

这些结果与“回复是否好听”无关。一个结构完整、语气得体的回复，只要承诺了退款，仍然是不合格输出。任务卡把它们写成硬失败，是为了让检查器和人工评审有共同的拒绝理由。

## 三、离线检查：把可判定部分写成代码

### 1. 契约字段与检查分工

任务卡中的条件并不都能由脚本判断。本文把检查分成两层：

| 检查层 | 本文脚本负责 | 仍需人工判断 |
|--------|--------------|--------------|
| 字段完整性 | 任务卡必填字段 | 字段是否覆盖真实业务 |
| 枚举与长度 | `category`、`priority`、`reply` | 类别选择是否符合多问题规则、回复是否有帮助 |
| 转人工条件 | 退款、未知订单状态 | 证据是否真的不足 |
| 事实声明 | `claims` 与输入事实 | 未声明的事实、隐含承诺 |

脚本的价值在于把“字段齐全、枚举合法、该转人工时转了”这类条件固定下来，避免每次评审靠记忆。它不能判断回复是否专业，也不能证明模型理解了政策；这些仍需人工语义评审和更大样本。

### 2. 完整程序

示例从空目录开始，只使用 Python 标准库，不需要 API 密钥。新建 `task_contract_demo.py`，把下面的代码保存进去。

程序先校验任务卡字段，再用四条固定结果检查枚举、长度、转人工条件和事实声明。`claims` 是本文的简化事实声明机制：回复中每条事实以 `键=值` 表示，脚本只接受能在输入事实中找到的声明。生产系统可以用结构化输出表达同样的信息。

::: details 查看任务卡与结果检查完整代码

```python
# task_contract_demo.py
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List


@dataclass(frozen=True)
class SuccessCriterion:
    """一条成功标准：说明观察对象、合格条件和证据来源。"""

    name: str
    observable: str
    rule: str
    evidence: str


@dataclass(frozen=True)
class TaskContract:
    """工单处理任务的可执行契约。"""

    task_id: str
    action: str
    input_fields: List[str]
    output_consumer: str
    success_criteria: List[SuccessCriterion]
    failure_criteria: List[str]
    unacceptable_results: List[str]


@dataclass(frozen=True)
class CaseOutput:
    """一次工单处理结果。"""

    case_id: str
    category: str
    priority: str
    reply: str
    needs_human: bool
    claims: List[str] = field(default_factory=list)


ALLOWED_CATEGORIES = {"物流", "退款", "产品缺陷", "其他"}
ALLOWED_PRIORITIES = {"P0", "P1", "P2", "P3"}
REFUND_WORDS = ("退款", "退货", "返还")


def validate_contract(contract: TaskContract) -> List[str]:
    """检查任务卡是否具备可执行所需字段。

    Args:
        contract: 待检查的任务卡。

    Returns:
        错误信息列表；为空表示结构完整。
    """
    errors: List[str] = []
    if not contract.task_id.strip():
        errors.append("task_id 不能为空")
    if not contract.action.strip():
        errors.append("action 不能为空")
    if not contract.input_fields:
        errors.append("input_fields 不能为空")
    if not contract.output_consumer.strip():
        errors.append("output_consumer 不能为空")
    if len(contract.success_criteria) < 2:
        errors.append("至少需要两条成功标准")
    if not contract.failure_criteria:
        errors.append("至少需要一条失败标准")
    if not contract.unacceptable_results:
        errors.append("至少需要一条不可接受结果")
    for criterion in contract.success_criteria:
        if not criterion.observable.strip() or not criterion.evidence.strip():
            errors.append(f"成功标准 {criterion.name} 缺少观察对象或证据")
    return errors


def known_facts(feedback: str, order_status: str) -> Dict[str, str]:
    """从输入中提取回复允许引用的最小事实集合。

    Args:
        feedback: 客户反馈原文。
        order_status: 订单状态；unknown 表示当前没有可用状态。

    Returns:
        事实键值表；回复声明的每条事实都必须能在这里找到。
    """
    facts = {"refund_requested": "true" if "退款" in feedback else "false"}
    if order_status != "unknown":
        facts["order_status"] = order_status
    return facts


def check_output(output: CaseOutput, feedback: str, order_status: str) -> List[str]:
    """执行可以确定性判断的契约检查。

    Args:
        output: 待检查的处理结果。
        feedback: 客户反馈原文，用于判断是否提到退款。
        order_status: 订单状态；unknown 表示当前没有可用状态。

    Returns:
        违规信息列表；为空表示通过确定性检查。
    """
    violations: List[str] = []
    if output.category not in ALLOWED_CATEGORIES:
        violations.append(f"category 不在允许集合：{output.category}")
    if output.priority not in ALLOWED_PRIORITIES:
        violations.append(f"priority 不在允许集合：{output.priority}")
    if len(output.reply) > 120:
        violations.append("reply 超过 120 字符")
    if any(word in output.reply for word in REFUND_WORDS) and not output.needs_human:
        violations.append("回复涉及退款但未转人工")
    if ("退款" in feedback or order_status == "unknown") and not output.needs_human:
        violations.append("退款诉求或未知订单状态必须转人工")
    facts = known_facts(feedback, order_status)
    for claim in output.claims:
        key, _, value = claim.partition("=")
        if facts.get(key) != value:
            violations.append(f"无法由输入支持的事实声明：{claim}")
    return violations


def main() -> int:
    """校验任务卡并对四条固定结果执行契约检查。

    Returns:
        任务卡结构与四条结果的预期判定全部成立时返回 0，否则返回 1。
    """
    contract = TaskContract(
        task_id="CASE-20260928-031",
        action="对客户反馈分类、定级并生成简短回复",
        input_fields=["feedback_text", "order_status"],
        output_consumer="客服坐席与工单路由",
        success_criteria=[
            SuccessCriterion("类别", "category", "属于四个允许类别之一", "结构化字段"),
            SuccessCriterion("优先级", "priority", "属于 P0～P3", "结构化字段"),
            SuccessCriterion("回复长度", "reply", "不超过 120 字符", "字符串长度"),
            SuccessCriterion("人工接管", "needs_human", "退款诉求或未知订单状态为 true", "布尔字段"),
        ],
        failure_criteria=["无法判断类别时输出其他并转人工"],
        unacceptable_results=["承诺退款", "编造订单状态", "类别或优先级超出允许集合"],
    )
    errors = validate_contract(contract)
    print(f"contract_check={'passed' if not errors else 'failed'}")
    for error in errors:
        print(f"  contract_error: {error}")

    feedback = "导出很慢，而且我要求退款。"
    order_status = "unknown"
    outputs = [
        CaseOutput(
            "good", "退款", "P1",
            "已记录退款诉求，将由人工核实订单状态后处理。",
            True, ["refund_requested=true"],
        ),
        CaseOutput("vague", "其他", "P2", "我们会尽快处理，请放心。", False),
        CaseOutput(
            "overreach", "退款", "P0",
            "已为您办理全额退款。",
            False, ["refund_requested=true"],
        ),
        CaseOutput(
            "invented", "物流", "P2",
            "您的订单已发货。",
            False, ["order_status=shipped"],
        ),
    ]
    expectations = {"good": False, "vague": True, "overreach": True, "invented": True}
    failed = bool(errors)
    for output in outputs:
        violations = check_output(output, feedback, order_status)
        should_fail = expectations[output.case_id]
        expectation_met = bool(violations) == should_fail
        result = "failed" if violations else "passed"
        print(
            f"output[{output.case_id}]={result} "
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

`validate_contract()` 检查任务卡是否留下了空字段；`known_facts()` 把输入中允许引用的事实提取成键值表；`check_output()` 执行枚举、长度、转人工和事实声明检查；`main()` 用四条固定结果验证“合格通过、越界被拦截”的预期是否成立。

### 3. 运行结果

在保存文件的目录执行：

```bash
python3 task_contract_demo.py
```

脚本输出如下。退出码为 `0`，因为四条结果的通过或失败都与预期一致；这不表示四条结果都可以接受，只表示检查器按设计工作。

::: details 查看任务卡检查实际输出

```text
contract_check=passed
output[good]=passed expectation=met
output[vague]=failed expectation=met
  退款诉求或未知订单状态必须转人工
output[overreach]=failed expectation=met
  回复涉及退款但未转人工
  退款诉求或未知订单状态必须转人工
output[invented]=failed expectation=met
  退款诉求或未知订单状态必须转人工
  无法由输入支持的事实声明：order_status=shipped
self_test=passed
```

:::

四条结果分别说明：

- `good` 记录退款诉求并转人工，类别和优先级合法，事实声明能在输入中找到，因此通过。
- `vague` 没有提到退款，但客户反馈含退款且订单状态未知，`needs_human=false` 触发转人工检查。脚本只发现缺少转人工，不能判断“我们会尽快处理”是否有帮助。
- `overreach` 的字段结构合法，但回复承诺退款且未转人工，触发两条违规。它说明结构正确不等于语义安全。
- `invented` 声称 `order_status=shipped`，而输入状态为 `unknown`，触发事实声明检查。

`vague` 和 `overreach` 的失败原因不同：前者是转人工条件缺失，后者是业务承诺越界。把它们都归为“回复质量差”会掩盖修复方向；任务卡的价值就在于把不同失败拆成可定位的检查项。

## 四、任务卡的使用边界

### 1. 任务卡不是 Prompt

任务卡是设计和验收文件，Prompt 是运行时实现。任务卡描述“要完成什么、输出给谁、什么算成功”，Prompt 负责把其中与模型相关的部分转成指令、输入结构和示例。把任务卡整段粘贴进 Prompt，既会让指令变得冗长，也会把验收语言和运行时语言混在一起。

任务卡可以保持稳定，而 Prompt 的措辞、示例和变量组织发生变化。反过来，如果任务动作、输出消费者或不可接受结果改变，应先修改任务卡和固定样本，再修改 Prompt。否则，Prompt 变更可能通过旧测试，却悄悄改变了业务行为。

### 2. 任务卡不是模型选择表

[任务与模型选择](../../01-application-foundation/01-application-model-boundaries/03-task-model-selection.md)同样从输入、输出和质量门槛开始，但它的目标是比较候选模型，维度包括能力、上下文、时延、成本和风险。本文的任务卡服务于 Prompt 设计和验收，不重复模型选型过程。

| 问题 | 本文 | 任务与模型选择 |
|------|------|----------------|
| 任务是什么 | 任务卡 | 任务定义 |
| 输出给谁 | 输出消费者 | 输出契约与质量门槛 |
| 选哪个模型 | 不覆盖 | 候选、约束、对照和决策矩阵 |
| 如何验收 Prompt | 固定样本与检查脚本 | 模型对照与回退条件 |

两篇文章共享“先定义任务”的原则，但主讲责任不同。本文不展开模型参数、候选筛选和时延成本；这些内容属于 AI 应用基础模块。

### 3. 变更时先改任务卡

业务规则变化时，任务卡是第一个需要更新的对象。例如，业务决定“退款请求可以由模型直接回复标准话术”，那么 `needs_human` 的条件、不可接受结果和固定样本都要先改，Prompt 才能跟着改。否则，模型行为已经变化，测试却仍在验证旧规则。

代码评审时，任务卡的 diff 比 Prompt 的措辞 diff 更容易判断影响：新增一个输出消费者、删除一条失败标准、改变一个枚举值，都会直接影响下游。把任务卡纳入版本控制，并在变更说明中记录原因，可以让 Prompt 的生命周期管理有稳定基线。

## 五、失败边界与适用范围

任务卡本身也会失效。常见问题及定位方式如下：

| 现象 | 定位证据 | 修复 |
|------|----------|------|
| 评审意见不一致 | 成功标准含“准确”“友好”等形容词 | 改写为观察项，或移到人工评审 |
| 样本通过但线上失败 | 输入边界遗漏未知状态、多问题或空反馈 | 补边界样本和输入规则 |
| 输出无法路由 | 消费者未定义枚举或必填字段 | 补输出消费者和字段契约 |
| 测试通过但业务拒绝 | 任务卡与 Prompt 已漂移 | 先改任务卡和测试，再改 Prompt |
| 脚本通过但回复无用 | 只检查了结构和枚举 | 保留人工语义评审，不把脚本当完整验收 |

本文覆盖单轮工单分类与回复的任务契约，不展开 Prompt 的具体写法、模型选择、JSON Schema 语法、完整评测集和提示注入防护。文中的脚本只验证确定性条件；它不能证明回复有帮助、政策解释正确或模型在真实工单分布上稳定。

::: info 验证记录与边界
2026-11-15 在 macOS 25.5.0、Python 3.9.6 下，从空目录保存 `task_contract_demo.py` 并执行 `python3 task_contract_demo.py`，得到上述输出，退出码为 `0`。示例只使用标准库，未在 Python 3.12.14 下复跑，也未调用真实模型。脚本未覆盖回复帮助性、语气、承诺退款的改写、未声明的事实和复杂政策判断；承诺模式检查见[输出边界](03-output-boundaries.md)。
:::

## 六、参考资料

- [OpenAI Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [任务与模型选择](../../01-application-foundation/01-application-model-boundaries/03-task-model-selection.md)
- [非确定性与事实校验](../../01-application-foundation/02-generation-mechanics/03-nondeterminism-factuality.md)
- [JSON Schema 输出](../../02-model-integration/03-structured-output/01-json-schema-output.md)
- [指令层级](02-instruction-hierarchy.md)
- [输出边界](03-output-boundaries.md)
- [指令与数据边界](../02-prompt-construction/01-instructions-data-boundary.md)
