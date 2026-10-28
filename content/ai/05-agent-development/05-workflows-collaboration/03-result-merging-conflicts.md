---
title: "结果合并与冲突"
tags:
  - Agent
  - 证据
  - 冲突处理
excerpt: "按业务对象、字段、来源和版本合并专家结果，区分互补事实、重复证据与真实冲突；通过独立可运行示例验证来源绑定、当前版本、权威来源规则、必要结果缺失和冲突停止。"
date: 2026-09-29
---

# 结果合并与冲突

结果合并是把多个执行者取得的事实组织成可验收的业务结果。它需要回答每个结论属于哪个对象、由什么证据支持、是否仍有效，以及不同结果出现分歧时如何处理。

订单专家报告 `ORD-2048` 正在运输，政策专家报告标准配送需要 3 至 5 个工作日，两者属于互补事实。若另一个执行者报告同一订单已经送达，才需要检查观察时间、来源版本与字段定义，判断是否真的冲突。不能把两个专家的文字直接拼成“订单正在运输且已送达”。

## 一、事实身份与来源

### 1. 对象、字段与取值

合并键应由业务对象和字段共同组成。例如 `("ORD-2048", "state")` 与 `("standard-delivery", "delivery_days")` 分别表示订单状态和配送政策范围。不同对象恰好使用同名字段，不构成同一个事实。

字段还应有明确的语义和类型。工作日与自然日不能直接比较；订单状态与预计到达时间不能互相代替。一个政策范围应作为同一版本下的整体核对，不能取旧版本的最小值和新版本的最大值拼成新规则。

| 信息 | 本例表示 | 用途 |
|------|----------|------|
| 委派身份 | `job-order`、`job-policy` | 核对结果属于应用签发的任务 |
| 事实身份 | 对象 ID 与字段 | 判断两个结果是否描述同一事实 |
| 事实值 | `in_transit`、`[3, 5]` | 按字段契约验收类型和边界 |
| 证据引用 | `orders/ORD-2048@7` | 找到本轮实际读取的原始事实 |
| 来源版本 | 订单记录版本 7 | 在同一来源的版本体系内检查有效性 |
| 原始来源 | `orders/ORD-2048` | 识别多个转述是否来自同一记录 |

### 2. 可信证据与专家输出

专家可以提出“这个值来自某来源”，应用仍要核对来源确实由受控工具取得、属于当前租户和对象，并且支持该值。一个格式正确的来源字符串不能证明事实成立。

本例由应用持有证据登记表，保存本轮工具观察的值、版本和原始来源；专家只能提交引用及取值。登记表是可信工具适配器的输出边界，不能由模型任意写入。示例用固定资料构造登记表，以验证合并规则，没有连接真实订单服务。

::: warning 相同来源的多次转述不增加证据独立性
两个专家引用同一订单记录，通常只是重复观察。应保留引用与任务关联、按原始来源去重，不能将转述次数当作多数票或置信度提升。
:::

## 二、分歧判断与决策

### 1. 版本与权威来源

版本号只有在同一个版本体系内才可比较。订单记录版本 7 和仓库记录版本 9 没有“9 更可信”的通用关系；服务器时间、采集时间与业务生效时间也承担不同职责。

本例为每个来源类别和对象配置应用确认的当前版本。旧版本仍可用于历史调查，但不能混入“当前状态”结果。生产中的当前版本应来自可信服务或经过验证的索引状态，而不能由专家自行宣布。

权威规则按字段制定：订单服务对本例的订单状态具有优先权，配送政策对工作日范围具有优先权。某个来源对一个字段有权威，不意味着它能决定所有字段。低优先级来源与权威来源不一致时，应记录被排除的证据及理由，必要时继续调查。

### 2. 冲突与未完成

同一对象、字段和有效范围内，最高优先级证据支持不同值时，本例返回 `conflict`，不产生完成结果。处理方式可以是重新读取权威服务、核对业务事件或交给人工，选择哪一种取决于服务能力和业务风险。

| 情况 | 判断 | 本例处理 |
|------|------|----------|
| 不同对象或不同字段 | 互补信息 | 分别保留 |
| 相同值、相同原始来源 | 重复转述 | 合并引用，不增加独立来源数 |
| 已确认的旧版本 | 当前问题的过期证据 | 记录排除理由，检查是否仍缺必要事实 |
| 权威来源与辅助来源分歧 | 可按明确业务规则决策 | 保留权威值与排除记录 |
| 同级有效权威证据冲突 | 不能按现有规则唯一确定 | 返回冲突并停止发布 |
| 必要专家或必要字段缺失 | 证据不足 | 返回 `incomplete` |
| 不存在的来源或跨对象引用 | 未通过委派验收 | 返回 `rejected` |

::: tip 摘要在事实验收之后生成
模型可以把已验收事实组织成易读文字，不能通过重新措辞消除事实冲突。本例只输出结构化合并结果；若增加摘要步骤，应约束对象、状态、范围及来源，并再次检查摘要没有新增业务结论。
:::

## 三、可运行的合并器

### 1. 环境与资料

在空目录使用 Python 3.12，程序只依赖标准库，不需要密钥或外部服务。以下命令使用 PowerShell：

```powershell
mkdir agent-merge-demo
cd agent-merge-demo
python --version
```

工单资料限定为租户 `shop-a` 的订单 `ORD-2048` 与标准配送政策。冲突、旧版本和辅助来源都是明确的测试夹具，用于证明控制规则，不表示真实业务查询结果。

### 2. 完整实现

创建 `merge_results.py`。应用把可信 `Task` 与对应报告一起交给合并器。报告中的任务 ID 只用于核对；它不能替代应用签发的身份，也不能使报告获得新的租户或对象权限。

合并器先验收每条事实，再检查必要任务、版本和来源优先级。配送范围要求两个严格整数，拒绝把布尔值当作整数，并核对最小值不大于最大值。

::: details 查看事实验收、版本筛选、合并与冲突测试

```python
# merge_results.py
from dataclasses import dataclass, replace


@dataclass(frozen=True)
class Task:
    """管理者持有的可信委派，不允许报告自行更改身份。"""
    job_id: str
    role: str
    tenant: str
    subject: str


@dataclass(frozen=True)
class Evidence:
    """可信工具观察的不可变事实；本例登记表由固定夹具构造。"""
    source: str
    tenant: str
    subject: str
    field: str
    value: object
    kind: str
    version: int
    origin: str


TASKS = {
    "job-order": Task("job-order", "order", "shop-a", "ORD-2048"),
    "job-policy": Task("job-policy", "policy", "shop-a", "standard-delivery"),
}
EVIDENCE = {
    "orders/ORD-2048@7": Evidence("orders/ORD-2048@7", "shop-a", "ORD-2048", "state",
                                  "in_transit", "orders", 7, "orders/ORD-2048"),
    "orders/ORD-2048@7:copy": Evidence("orders/ORD-2048@7:copy", "shop-a", "ORD-2048", "state",
                                       "in_transit", "orders", 7, "orders/ORD-2048"),
    "orders/ORD-2048@6": Evidence("orders/ORD-2048@6", "shop-a", "ORD-2048", "state",
                                  "packed", "orders", 6, "orders/ORD-2048"),
    "warehouse/ORD-2048@9": Evidence("warehouse/ORD-2048@9", "shop-a", "ORD-2048", "state",
                                     "delivered", "warehouse", 9, "warehouse/ORD-2048"),
    "orders/ORD-2048@7:conflict": Evidence("orders/ORD-2048@7:conflict", "shop-a", "ORD-2048", "state",
                                           "delivered", "orders", 7, "orders/ORD-2048"),
    "shipping-policy@1:delivery": Evidence("shipping-policy@1:delivery", "shop-a", "standard-delivery",
                                           "delivery_days", (3, 5), "policy", 1, "shipping-policy"),
}
CURRENT = {("orders", "ORD-2048"): 7, ("warehouse", "ORD-2048"): 9,
           ("policy", "standard-delivery"): 1}
PRIORITY = {("state", "orders"): 2, ("state", "warehouse"): 1,
            ("delivery_days", "policy"): 2}
FIELDS = {"order": "state", "policy": "delivery_days"}
REQUIRED = {("ORD-2048", "state"), ("standard-delivery", "delivery_days")}


def normalize_value(field, value):
    """按业务字段核对严格类型，保持一个政策范围属于同一事实。

    Args:
        field: state 或 delivery_days，其他字段不支持。
        value: 状态字符串或两个工作日整数；范围为 1 至 30 且递增。
    Returns:
        状态字符串或规范化元组；不符合契约时抛出 ValueError。
    """
    if field == "state" and type(value) is str and value in {"packed", "in_transit", "delivered"}:
        return value
    if (field == "delivery_days" and type(value) in (list, tuple) and len(value) == 2
            and all(type(item) is int and 1 <= item <= 30 for item in value)
            and value[0] <= value[1]):
        return tuple(value)
    raise ValueError("invalid_fact_value")


def validate_report(task, report, registry):
    """核对可信委派与工具证据，拒绝来源伪造和跨对象引用。

    Args:
        task: 管理者从 TASKS 取得的不可变委派。
        report: 不可信报告，字段只能是 job_id、subject、facts。
        registry: 应用取得的证据表，不能由专家任意新增记录。
    Returns:
        去除相同引用的已验收 Evidence 列表；违规时抛出明确异常。
    """
    if TASKS.get(task.job_id) != task:
        raise PermissionError("unissued_task")
    if type(report) is not dict or set(report) != {"job_id", "subject", "facts"}:
        raise ValueError("invalid_report_shape")
    if report["job_id"] != task.job_id or report["subject"] != task.subject:
        raise PermissionError("report_binding")
    facts = report["facts"]
    if type(facts) is not list or len(facts) > 8:
        raise ValueError("invalid_fact_count")
    accepted = {}
    for fact in facts:
        if type(fact) is not dict or set(fact) != {"field", "value", "source"}:
            raise ValueError("invalid_fact_shape")
        if type(fact["source"]) is not str or fact["field"] != FIELDS[task.role]:
            raise ValueError("invalid_fact_identity")
        evidence = registry.get(fact["source"])
        if evidence is None:
            raise ValueError("unobserved_source")
        if (evidence.source != fact["source"] or evidence.tenant != task.tenant
                or evidence.subject != task.subject or evidence.field != fact["field"]):
            raise PermissionError("evidence_scope")
        if type(evidence.version) is not int or evidence.version <= 0:
            raise ValueError("invalid_source_version")
        proposed = normalize_value(fact["field"], fact["value"])
        observed = normalize_value(evidence.field, evidence.value)
        if proposed != observed:
            raise ValueError("unsupported_fact")
        accepted[evidence.source] = replace(evidence, value=observed)
    return list(accepted.values())


def merge_reports(reports, registry, current_versions):
    """验收两个必要任务，以字段规则合并当前事实并保留决策依据。

    Args:
        reports: 可信 Task 与不可信报告组成的序列，每个任务只能出现一次。
        registry: 当前请求的可信工具证据表。
        current_versions: 来源类别与对象到当前版本的可信映射。
    Returns:
        completed、conflict、incomplete 或 rejected 的结构化结果；没有业务写入。
    """
    seen, groups, decisions = set(), {}, []
    try:
        for task, report in reports:
            if task.job_id in seen:
                raise ValueError("duplicate_job")
            accepted = validate_report(task, report, registry)
            seen.add(task.job_id)
            for evidence in accepted:
                if current_versions.get((evidence.kind, evidence.subject)) != evidence.version:
                    decisions.append((evidence.source, "not_current"))
                    continue
                key = (evidence.subject, evidence.field)
                if (evidence.field, evidence.kind) not in PRIORITY:
                    raise ValueError("missing_authority_rule")
                groups.setdefault(key, []).append(evidence)
    except (ValueError, PermissionError) as error:
        return {"status": "rejected", "reason": str(error)}
    missing_jobs = sorted(set(TASKS) - seen)
    missing_fields = sorted(REQUIRED - set(groups))
    if missing_jobs or missing_fields:
        return {"status": "incomplete", "missing_jobs": missing_jobs, "missing_fields": missing_fields,
                "decisions": sorted(decisions)}
    merged, conflicts = [], []
    for key in sorted(groups):
        evidence_list = groups[key]
        best = max(PRIORITY[(item.field, item.kind)] for item in evidence_list)
        winners = [item for item in evidence_list if PRIORITY[(item.field, item.kind)] == best]
        values = {item.value for item in winners}
        sources = sorted(item.source for item in winners)
        decisions.extend((item.source, "lower_authority") for item in evidence_list if item not in winners)
        if len(values) != 1:
            conflicts.append({"subject": key[0], "field": key[1], "sources": sources})
            continue
        merged.append({"subject": key[0], "field": key[1], "value": winners[0].value,
                       "sources": sources,
                       "independent_origins": len({item.origin for item in winners})})
    return {"status": "conflict" if conflicts else "completed", "facts": merged,
            "conflicts": conflicts, "decisions": sorted(decisions)}


def report_for(job_id, source_ids):
    """从明确夹具构造测试报告，生产报告仍须经过 validate_report。

    Args:
        job_id: TASKS 中存在的测试任务 ID。
        source_ids: EVIDENCE 中存在的夹具来源，不使用真实客户资料。
    Returns:
        可信任务与独立报告对象，便于注入报告故障。
    """
    task = TASKS[job_id]
    facts = [{"field": EVIDENCE[source].field, "value": EVIDENCE[source].value, "source": source}
             for source in source_ids]
    return task, {"job_id": job_id, "subject": task.subject, "facts": facts}


def run_checks():
    """验证互补、去重、版本、权威分歧、真实冲突和缺失停止。

    Returns:
        无返回值；所有断言通过后输出实际合并状态。
    """
    order = report_for("job-order", ["orders/ORD-2048@7"])
    policy = report_for("job-policy", ["shipping-policy@1:delivery"])
    normal = merge_reports([order, policy], EVIDENCE, CURRENT)
    assert normal["status"] == "completed" and len(normal["facts"]) == 2
    assert merge_reports([policy, order], EVIDENCE, CURRENT) == normal
    array_registry = dict(EVIDENCE)
    array_registry["shipping-policy@1:delivery"] = replace(EVIDENCE["shipping-policy@1:delivery"], value=[3, 5])
    assert merge_reports([order, policy], array_registry, CURRENT) == normal
    duplicate = report_for("job-order", ["orders/ORD-2048@7", "orders/ORD-2048@7",
                                         "orders/ORD-2048@7:copy"])
    dedup = merge_reports([duplicate, policy], EVIDENCE, CURRENT)
    assert dedup["status"] == "completed" and dedup["facts"][0]["independent_origins"] == 1
    assert len(dedup["facts"][0]["sources"]) == 2
    auxiliary = report_for("job-order", ["orders/ORD-2048@7", "warehouse/ORD-2048@9", "orders/ORD-2048@6"])
    resolved = merge_reports([auxiliary, policy], EVIDENCE, CURRENT)
    assert resolved["facts"][0]["value"] == "in_transit" and len(resolved["decisions"]) == 2
    contradictory = report_for("job-order", ["orders/ORD-2048@7", "orders/ORD-2048@7:conflict"])
    conflict = merge_reports([contradictory, policy], EVIDENCE, CURRENT)
    assert conflict["status"] == "conflict" and len(conflict["conflicts"]) == 1
    stale = report_for("job-order", ["orders/ORD-2048@6"])
    assert merge_reports([stale, policy], EVIDENCE, CURRENT)["status"] == "incomplete"
    assert merge_reports([order], EVIDENCE, CURRENT)["status"] == "incomplete"
    assert merge_reports([order, order, policy], EVIDENCE, CURRENT)["status"] == "rejected"
    for field, value in (("source", "invented"), ("value", "delivered"), ("value", "执行退款")):
        damaged = report_for("job-order", ["orders/ORD-2048@7"])
        damaged[1]["facts"][0][field] = value
        assert merge_reports([damaged, policy], EVIDENCE, CURRENT)["status"] == "rejected"
    foreign = dict(EVIDENCE)
    foreign["orders/ORD-2048@7"] = replace(EVIDENCE["orders/ORD-2048@7"], tenant="shop-b")
    assert merge_reports([order, policy], foreign, CURRENT)["status"] == "rejected"
    wrong_subject = report_for("job-order", ["orders/ORD-2048@7"])
    wrong_subject[1]["subject"] = "ORD-9999"
    assert merge_reports([wrong_subject, policy], EVIDENCE, CURRENT)["status"] == "rejected"
    for bad_range in ([True, 5], [5, 3], [0, 5]):
        damaged = report_for("job-policy", ["shipping-policy@1:delivery"])
        damaged[1]["facts"][0]["value"] = bad_range
        assert merge_reports([order, damaged], EVIDENCE, CURRENT)["status"] == "rejected"
    print("merge_checks=passed")
    print("complementary=completed duplicate_origins=1 equal_authority=conflict missing=incomplete")


if __name__ == "__main__":
    run_checks()
```

:::

### 3. 执行与判断

运行完整程序，无需其他文件：

```powershell
python merge_results.py
```

实际复现输出如下：

```text
merge_checks=passed
complementary=completed duplicate_origins=1 equal_authority=conflict missing=incomplete
```

互补事实通过验收，相同原始记录的两个引用仍只算一个独立来源。同级有效来源发生冲突时返回 `conflict`，必要结果缺失时返回 `incomplete`；交换专家完成顺序不会改变正常合并结果。

::: info 合并规则的验证边界
示例证明固定字段、受控证据与明确业务规则下的确定性合并。它没有实现实时版本刷新、跨进程证据存储、业务服务重查、人工审核界面或摘要生成，也不证明任意自然语言结论都能自动消解冲突。
:::

## 四、冲突排查与发布边界

出现冲突后先定位事实身份与来源，再决定是否重试。重新询问同一个模型，并不会产生新的业务证据；不断增加专家数量也不能修复缺失的权威服务观察。

1. 核对租户、对象与字段，排除把其他订单或不同语义混为一谈。
2. 检查每个引用的真实工具结果、版本及业务有效范围，区分过期资料与当前事实。
3. 按字段的权威规则核对来源，记录采用与排除原因；缺少规则时停止自动选择。
4. 同级有效证据仍冲突时，重新读取可信服务或进入人工处理，保留原始证据和调查记录。
5. 必要字段全部通过验收后再形成对外结果；如果业务允许部分回答，必须明确哪些事实仍未确定。

| 现象 | 定位依据 | 正确处理 |
|------|----------|----------|
| 两个来源值相同但证据被重复计数 | 原始来源与引用链 | 去除重复权重，保留来源关联 |
| 更大的版本号覆盖了订单服务 | 来源类别与版本体系 | 只在同一体系内比较版本，按字段制定权威规则 |
| 合并出不存在的政策范围 | 两个端点的来源版本 | 将范围作为完整事实验收，不能跨版本拼接 |
| 专家称已完成但没有必要事实 | 必要任务、字段和真实工具来源 | 返回未完成，禁止补造事实 |
| 摘要抹去了冲突或添加了承诺 | 结构化事实与摘要对照 | 保留未确定项，拒绝无依据的时间或赔付承诺 |

## 五、参考资料

- [委派与多 Agent](./02-delegation-multi-agent.md)：独立专家上下文、工具范围及必要结果验收。
- [幂等与结果核对](../02-tool-execution/03-idempotency-result-verification.md)：模型结束与业务成功的区别。
- [任务状态与检查点](../04-state-memory/01-task-state-checkpoints.md)：未完成、等待与恢复状态的保存边界。
- [Python dataclasses](https://docs.python.org/3.12/library/dataclasses.html)：本例不可变任务与证据的数据表示。
