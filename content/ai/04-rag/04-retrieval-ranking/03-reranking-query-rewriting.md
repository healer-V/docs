---
title: "重排与查询改写"
tags:
  - RAG
  - 重排
  - 查询改写
excerpt: "区分召回、重排与查询改写的职责，解释成对打分、候选预算及输入限制，以独立契约程序验证重排结果、原问题约束和权限变化，说明改写漂移、回退及真实质量评测的边界。"
date: 2026-09-29
---

# 重排与查询改写

重排对已经召回的候选再次判断相关性，改变它们的顺序；查询改写把用户表达转换为更适合检索的文字，影响哪些候选被找到。两者作用于不同位置，不能用更好的排序补偿从未进入候选集的资料。

用户询问订单 `ORD-2048` 的标准配送时效，表达可能同时带有日期和“发货后”的条件。改写应帮助检索保留这些约束，重排应依据原问题判断证据；业务对象、授权范围和最终要回答的问题仍由应用保持。

## 一、召回与重排

### 1. 成对打分

嵌入检索分别编码问题与片段，再比较向量。Cross-Encoder（交叉编码器）则把问题和片段共同输入模型，为这一对文本打分，因此可以利用成对文本的交互；它不提供可供全库直接比较的独立文档向量。

应用通常先用较低成本的方法召回若干候选，再对每个“原问题、候选正文”组合打分并取前几条。这里的分数排序方向、范围、输出字段与截断规则由具体模型或服务决定，不能默认所有分数都在 0～1，也不能将其解释为事实可信度。

| 对象 | 检索候选 | 重排候选 |
|------|----------|----------|
| 输入范围 | 允许访问的索引集合 | 本次已经召回的片段 |
| 运算对象 | 查询表示与索引 | 问题和候选成对输入 |
| 结果职责 | 找到可能有用的资料 | 在现有候选中选择更相关的资料 |
| 失败边界 | 相关资料未入选 | 入选资料排序不佳或打分失败 |

重排模型不能创建新片段或更改片段原文。适配器返回的 ID 应逐一对应输入候选；陌生 ID、重复 ID、缺失结果或非有限分数都需要按契约处理，不能继续作为有效排名。

### 2. 预算与截断

候选数、成对输入长度、批次大小及模型速度共同决定重排成本。增加候选让模型有更多选择，也增加成对运算；若输入包含大量重复或已经失效的资料，这部分成本不会带来有效证据。

长度限制应按实际重排模型的分词器与成对输入规则确认，给问题和片段各自保留空间。截断恰好删除政策中的否定词或条件时，模型看到的内容已经变化。可以在索引阶段形成更合适的完整片段，或标记该候选不适合当前模型，不能悄悄截断后继续引用全文。

::: warning 重排效果受候选集限制
若正确政策根本没有被召回，重排只能在错误或不足的候选中重新排序。排查时同时保留原始候选和重排结果，先确认相关资料是否入选，再判断排序质量。
:::

## 二、查询改写与原问题

### 1. 何时改写

改写适合消解已经有可信上下文的指代、展开已确认的缩写，或把问句组织为检索表达。例如当前对话已明确 `ORD-2048`，“这个订单”可以在应用绑定对象后展开；缺少对象时应澄清，而不是让模型猜一个订单号。

| 改写方式 | 适用条件 | 风险控制 |
|----------|----------|----------|
| 指代展开 | 当前任务已经绑定唯一对象 | 明确对象来源，缺少对象时澄清 |
| 术语展开 | 业务词表或语境足够明确 | 保留原始表达，检查新增含义 |
| 多个检索表达 | 同一个问题确实需要多个角度 | 限制数量和成本，保留原问题通道 |
| 生成假设文本辅助检索 | 允许实验且有独立评测 | 生成内容是检索线索，不能当作事实证据 |

改写不需要出现在每次请求里。型号、错误码或已经清晰的短问题通常应先尝试原始检索，再通过对照评测判断改写是否带来收益。

### 2. 应用持有的约束

应用保留原问题、可信身份、绑定对象、时间范围及其他已确认条件。改写器只提出文字或结构化建议，不能填写新的权限过滤条件。最终回答仍围绕原问题，不把改写文字当作用户重新授权。

本例要求保留订单号、日期、意图标签及明确词组。格式及值检查能够拒绝已知漂移，但不能证明全文语义等价；同一字段也可能被放入错误的句子。因此对于复杂问题，需要原始查询并行召回、语义评测或人工确认，保留回退到原文的路径。

::: tip 不合格改写可以回退到原问题
订单号、日期或关键条件不一致时，记录原因并使用原问题，或请求澄清。不要通过删除原问题中的条件让改写检查“通过”；身份和范围始终由应用提供。
:::

## 三、排序与改写契约验证

### 1. 环境与固定输入

在空目录创建文件，使用 Python 3.12 标准库，命令为 PowerShell：

```powershell
mkdir rag-rerank-demo
cd rag-rerank-demo
python --version
```

本例采用三条虚构候选和**明确的固定打分夹具**，验证适配器与应用之间的契约；不安装重排模型，也不把这些分数声称为模型实测。实际接入时，替换打分函数并按具体模型核对成对输入和 Token 限制，继续执行相同边界检查。

示例的候选数上限 20 和正文 180 字符上限仅约束这份小型夹具，不是重排模型的输入规范。长度超限直接拒绝，原文及来源始终保留，不做静默截断。

### 2. 完整实现

创建 `rerank_contract.py`。原问题包含订单、日期和配送条件，改写对象不含租户或授权字段。重排器收到原问题和授权候选，并返回每个候选的 ID 与分数；应用验证后再次检查当前允许集合。

::: details 查看重排结果、改写漂移与当前授权完整验证

```python
# rerank_contract.py
import math
import re
from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class Query:
    """应用保存的原问题及绑定业务约束，日期来自已确认输入。"""
    text: str
    order_id: str
    from_date: str
    to_date: str
    intent: str
    required_terms: tuple[str, ...]


@dataclass(frozen=True)
class Candidate:
    """检索取得的不可变原文与来源，重排器没有修改权限。"""
    chunk_id: str
    text: str
    source: str


def check_rewrite(original, proposal):
    """检查本例已知约束，拒绝改写中的对象与范围漂移。

    Args:
        original: 可信原问题，绑定唯一订单和起止日期。
        proposal: 仅含 text、order_id、from_date、to_date、intent 的建议对象。
    Returns:
        合格检索文字；失败抛出 ValueError，调用方可回退原问题。
    """
    expected = {"text", "order_id", "from_date", "to_date", "intent"}
    if not isinstance(proposal, dict) or set(proposal) != expected:
        raise ValueError("rewrite_fields")
    if any(not isinstance(proposal[key], str) for key in expected):
        raise ValueError("rewrite_types")
    for key in expected - {"text"}:
        if proposal[key] != getattr(original, key):
            raise ValueError("rewrite_constraints")
    if date.fromisoformat(proposal["from_date"]) > date.fromisoformat(proposal["to_date"]):
        raise ValueError("date_order")
    text = proposal["text"]
    if not text.strip() or len(text) > 180:
        raise ValueError("rewrite_length")
    if set(re.findall(r"ORD-[0-9]+", text)) != {original.order_id}:
        raise ValueError("rewrite_order_mentions")
    dates = set(re.findall(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", text))
    if dates != {original.from_date, original.to_date}:
        raise ValueError("rewrite_date_mentions")
    if any(term not in text for term in original.required_terms):
        raise ValueError("rewrite_required_terms")
    return text


def rerank(original, candidates, scorer, allowed_ids, k):
    """验证打分器契约，原问题评分后按当前授权筛选。

    Args:
        original: 应用保存的原问题，不能被改写覆盖。
        candidates: 最多二十条 Candidate，ID 唯一、正文非空且不超过一百八十字符。
        scorer: 接收原问题文本和候选列表，返回每个输入 ID 的有限数值分数；高分优先。
        allowed_ids: 应用维护的当前允许 ID 集合；测试中可在评分期间发生撤权。
        k: 1 至 20 的严格整数最终候选上限。
    Returns:
        Candidate 有序列表；无授权候选时不调用 scorer。
    """
    if type(k) is not int or not 1 <= k <= 20 or len(candidates) > 20:
        raise ValueError("rerank_budget")
    if len({item.chunk_id for item in candidates}) != len(candidates):
        raise ValueError("duplicate_candidate")
    if any(not item.text.strip() or len(item.text) > 180 or not item.source for item in candidates):
        raise ValueError("candidate_content")
    selected = [item for item in candidates if item.chunk_id in frozenset(allowed_ids)]
    if not selected:
        return []
    scores = scorer(original.text, selected)
    expected = {item.chunk_id for item in selected}
    received = []
    values = {}
    for identity, score in scores:
        if identity not in expected or identity in values:
            raise ValueError("score_identity")
        if type(score) not in (int, float) or not math.isfinite(score):
            raise ValueError("invalid_score")
        received.append(identity)
        values[identity] = float(score)
    if set(received) != expected:
        raise ValueError("missing_score")
    # 回调返回负分数与 ID，同分时使用稳定片段次序。
    selected.sort(key=lambda item: (-values[item.chunk_id], item.chunk_id))
    return [item for item in selected if item.chunk_id in allowed_ids][:k]


def fixture_scores(question, candidates):
    """返回固定测试分数，仅用于验证排序与契约。

    Args:
        question: 评分入口收到的原始问题文本。
        candidates: 当前允许参与评分的固定候选。
    Returns:
        与输入候选一一对应的 ID 和分数，不是模型输出。
    """
    if "ORD-2048" not in question:
        raise ValueError("original_question_lost")
    values = {"shipping-v1-01": 0.9, "refund-v1-01": 0.2, "contact-v1-01": 0.1}
    return [(item.chunk_id, values[item.chunk_id]) for item in candidates]


def run_checks():
    """运行固定候选、结果损坏、改写漂移与撤权验证。

    Returns:
        无返回值；所有断言通过后输出契约检查结论。
    """
    original = Query("ORD-2048 在 2026-09-01 至 2026-09-29 的标准配送发货后需要几个工作日？",
                     "ORD-2048", "2026-09-01", "2026-09-29", "delivery_time", ("标准配送", "发货后"))
    candidates = [
        Candidate("refund-v1-01", "退款必须经过人工确认。", "refund-policy@1:approval"),
        Candidate("shipping-v1-01", "标准配送在发货后需要三至五个工作日。", "shipping-policy@1:delivery"),
        Candidate("contact-v1-01", "客户通过商店帮助表单联系售后客服。", "contact-policy@1:channel"),
    ]
    allowed = {item.chunk_id for item in candidates}
    result = rerank(original, candidates, fixture_scores, allowed, 2)
    assert result[0] == candidates[1] and result[1] == candidates[0]
    assert result[0].source == "shipping-policy@1:delivery"
    assert rerank(original, candidates, fixture_scores, set(), 2) == []
    proposal = {"text": "检索 ORD-2048 在 2026-09-01 至 2026-09-29 标准配送发货后的时效规则",
                "order_id": original.order_id, "from_date": original.from_date,
                "to_date": original.to_date, "intent": original.intent}
    assert check_rewrite(original, proposal).startswith("检索 ORD-2048")
    invalid_proposals = [
        {**proposal, "order_id": "ORD-9999"},
        {**proposal, "text": proposal["text"].replace("2026-09-29", "2026-10-29")},
        {**proposal, "text": proposal["text"].replace("发货后", "发货前")},
        {**proposal, "text": proposal["text"] + " ORD-9999"},
        {**proposal, "tenant_id": "shop-b"},
        {key: value for key, value in proposal.items() if key != "intent"},
    ]
    for invalid in invalid_proposals:
        try:
            check_rewrite(original, invalid)
        except ValueError:
            pass
        else:
            raise AssertionError("drifting rewrite accepted")
    for bad_scores in ([('unknown', 1.0)], [],
                       [(item.chunk_id, float("nan")) for item in candidates],
                       [(item.chunk_id, True) for item in candidates],
                       [(item.chunk_id, 1.0) for item in candidates] + [(candidates[0].chunk_id, 1.0)]):
        def broken_scorer(question, selected):
            """注入损坏的评分结果，验证契约拒绝。

            Args:
                question: 当前原问题，不修改。
                selected: 应用筛选的候选，不修改。
            Returns:
                当前循环中的固定损坏结果。
            """
            return bad_scores
        try:
            rerank(original, candidates, broken_scorer, allowed, 2)
        except ValueError:
            pass
        else:
            raise AssertionError("broken scores accepted")

    def revoke_during_scoring(question, selected):
        """在评分期间撤回所有允许 ID，验证后续使用被阻止。

        Args:
            question: 应用原问题。
            selected: 评分开始前已经可见的候选。
        Returns:
            有效固定分数；副作用是清空测试授权集合。
        """
        allowed.clear()
        return fixture_scores(question, selected)

    assert rerank(original, candidates, revoke_during_scoring, allowed, 2) == []
    try:
        rerank(original, [Candidate("long", "配" * 181, "policy@1")], fixture_scores, {"long"}, 1)
    except ValueError:
        pass
    else:
        raise AssertionError("oversized candidate accepted")
    print("rerank_contract_checks=passed")
    print("fixture_top=shipping-v1-01 rewrite_drift=rejected revoked_after_scoring=0")


if __name__ == "__main__":
    run_checks()
```

:::

### 3. 执行与证据

执行当前文件：

```powershell
python rerank_contract.py
```

检查通过时输出如下，`fixture_top` 明确表示固定夹具的排名：

```text
rerank_contract_checks=passed
fixture_top=shipping-v1-01 rewrite_drift=rejected revoked_after_scoring=0
```

程序拒绝对象、日期及条件漂移，以及异常 ID、缺失或重复评分、NaN 和布尔分数。评分期间撤权后，结果不能进入下一步；已经发送给外部重排器的资料无法靠这次检查撤回，因此发送前的授权及外部服务数据策略同样必要。

契约通过只证明输入与输出边界。真实重排和改写质量需要安装或接入实际模型，并在固定相关性标签下比较原问题检索、改写检索与重排；本例没有执行这部分模型质量实验。

## 四、漂移与排序排查

| 现象 | 判断证据 | 处理 |
|------|----------|------|
| 排名改变但回答仍错误 | 正确资料是否在原候选中 | 先修正召回与过滤，再调整重排 |
| 改写遗漏订单或日期 | 绑定字段与正文实体 | 拒绝改写，保留原问题或澄清 |
| 重排输入删除了否定条件 | 实际成对输入与原文 | 调整片段或预算，停止引用被错误截断的内容 |
| 新模型分数方向相反 | 适配器文档及已知正反样本 | 按真实契约统一为应用排序方向 |
| 权限撤销后仍使用候选 | 发送前与证据使用前的检查 | 当前授权失败就丢弃，保留清晰原因 |

策略上线前保留原问题基线和回退开关。改写或重排提高成本却没有改善证据质量时，回退可避免把额外模型步骤变成固定负担。

## 五、参考资料

- [Sentence Transformers Cross-Encoder](https://sbert.net/examples/cross_encoder/applications/README.html)：成对文本评分及与嵌入检索的职责区别。
- [关键词与混合检索](./02-keyword-hybrid-search.md)：候选召回与排名融合。
- [证据组织与生成](../05-evidence-answers/01-evidence-grounded-generation.md)：原文、来源及生成前校验。
