---
title: "工作流编排"
tags:
  - Agent
  - 工作流
  - Python
excerpt: "解释顺序、分支、并行汇合和有限循环的编排规则，区分模型分类与应用路由，使用独立售后工单程序验证节点失败、截止时间、事实验收与修订上限，说明取消和恢复的边界。"
date: 2026-09-29
---

# 工作流编排

工作流编排由应用规定任务节点、依赖、允许的路径和完成条件。节点可以调用模型，但模型结果只成为路由或验收的输入，不能自行添加节点、扩大工具权限或取消业务条件。

工单 `CASE-1042` 需要调查订单 `ORD-2048` 的配送情况。应用可以先核对身份与对象，再并行读取订单和配送政策，汇合后生成结构化调查结果。缺少订单就澄清，查询失败就停止，涉及退款就进入确认流程；这些路径均可由代码明确规定。

## 一、节点与依赖

### 1. 顺序与分支

节点是一个有明确输入、输出及失败含义的处理单元。后一个节点需要前一个节点的结果时，应顺序执行。例如授权必须先于订单读取，不能因为读取更快就把授权改成后置检查。

分支依据已经校验的条件选择有限路径。本例把分类标签限制为配送、退款和其他；标签来自模型或普通分类器都可以，但只有应用能把合法标签映射到实际路径。

| 条件 | 固定路径 | 结果含义 |
|------|----------|----------|
| 工单没有绑定订单 | 请求补充 | 没有猜测订单或查询其他对象 |
| 配送问题 | 读取订单与政策 | 取得两类必要事实后验收 |
| 退款问题 | 等待确认 | 尚未授权退款，也没有创建业务动作 |
| 其他明确类别 | 人工处理 | 当前流程没有合适路径 |
| 未知或损坏标签 | 返回路由错误 | 不把任意标签变成函数名 |

模型分类正确率需要独立评测。Schema 中枚举合法，不证明该工单确实属于所选类别；因此高风险路径应有业务条件检查，模糊问题也需要澄清分支。

### 2. 并行与汇合

订单状态和配送政策互不依赖，可以并行读取。汇合节点等待必要分支全部完成，再验收它们的对象、来源和版本；一个必要分支失败时，不能用另一分支的结果假装完整调查成功。

并行不是让多个节点随意修改同一状态。每个节点最好返回独立结果，由汇合节点统一写入任务状态。若存在共享写入，就需要明确冲突、事务和恢复规则，而不是依赖“谁先完成”决定最终值。

本例用 Python 3.12 的 `asyncio.TaskGroup` 组织协程任务。非取消异常会使尚未结束的同组任务收到取消，并以异常组传播；已完成操作不会因此撤回。适用对象是能够协作等待和取消的异步调用。

## 二、路由与有限循环

### 1. 模型建议与应用转移

应用在模型输出进入编排状态前检查类型、标签及对象关系。若让模型直接返回 Python 函数名、SQL 或执行命令，再原样调用，就把路由输入变成了执行权限。

下面是本例实际状态路径的简化表示，表示执行关系，不是文章目录：

```text
核对身份与对象 → 校验分类
配送 → 并行读取订单、政策 → 汇合验收 → 生成候选 → 结果检查
退款 → 等待确认；缺少订单 → 澄清；其他 → 人工处理
候选失败 → 有限修订；预算或节点失败 → 明确停止
```

外部业务写入不放在候选生成节点内。模型生成了“已经退款”也不能改变业务记录；工具授权与实际结果分别核对，详见[工具权限与人工确认](../03-permissions-isolation/01-tool-permissions-human-approval.md)。

### 2. 修订上限与截止时间

循环需要明确的继续条件和结束条件。生成结果未通过事实校验时，可以给出有限反馈后再次生成；达到上限仍不合格，应返回未完成原因，不把最后一稿默认为成功。

本例最多两次候选生成，每次都与已经取得的事实比较。第二次不是重新读取业务资料，也不重新执行副作用；真实流程若需要刷新证据，应另设明确节点及预算。

::: warning 取消不等于回滚
截止时间限制应用继续等待，协程取消限制本地后续执行。已经提交的业务操作、远端模型计算及已结束请求不会自动撤销；有副作用的节点还需使用原操作键回查和恢复。
:::

## 三、工单调查流程

### 1. 独立环境与夹具

在空目录创建文件，使用 Python 3.12 标准库，命令为 PowerShell：

```powershell
mkdir agent-workflow-demo
cd agent-workflow-demo
python --version
```

示例中的订单服务、政策服务、分类标签和候选生成均为明确的确定性夹具。它们用来验证控制路径与失败传播，没有调用在线模型、支付或真实工单系统。

0.2 秒截止时间只用于本地故障检查，不是业务服务的生产配置。异步等待与节点事件用于观察两项读取确实同时启动，不能据此宣称真实服务的速度提高了多少。

### 2. 完整实现

创建 `case_workflow.py`。订单查询与政策读取都是只读节点，必要事实缺失就停止；候选结果必须与两份来源对应，允许一次修订机会。

::: details 查看固定节点、并行汇合与失败验证完整实现

```python
# case_workflow.py
import asyncio
from dataclasses import dataclass, replace


@dataclass(frozen=True)
class Case:
    """应用绑定的演示工单和订单，模型分类不能更改身份或对象。"""
    tenant_id: str
    case_id: str
    order_id: str | None


async def read_order(case, events, fail=False):
    """模拟只读订单节点，并记录开始与结束。

    Args:
        case: 已通过流程授权的固定工单。
        events: 当前运行的观察列表，不作为生产持久事件日志。
        fail: 是否在一次协作等待后注入服务失败。
    Returns:
        订单状态与来源字典；失败抛出 RuntimeError。
    """
    events.append("start:order")
    await asyncio.sleep(0)
    if fail:
        events.append("failed:order")
        raise RuntimeError("order_unavailable")
    events.append("end:order")
    return {"order_id": case.order_id, "state": "in_transit", "source": "orders/ORD-2048@7"}


async def read_policy(case, events, fault=None):
    """模拟与订单查询独立的政策节点。

    Args:
        case: 当前已授权工单，固定使用标准配送政策。
        events: 运行观察列表，取消时保留原因事件。
        fault: None、failure 或 timeout，后者等待取消。
    Returns:
        工作日范围与来源字典；服务失败或取消向调用方传播。
    """
    events.append("start:policy")
    try:
        await asyncio.sleep(0)
        if fault == "failure":
            events.append("failed:policy")
            raise RuntimeError("policy_unavailable")
        if fault == "timeout":
            await asyncio.Event().wait()
        events.append("end:policy")
        return {"min_days": 3, "max_days": 5, "unit": "business_day", "source": "shipping-policy@1:delivery"}
    except asyncio.CancelledError:
        events.append("cancelled:policy")
        raise


async def draft_result(order, policy, attempt, invalid_drafts):
    """返回固定候选，按参数注入错误事实以验证修订。

    Args:
        order: 已成功读取的订单事实。
        policy: 已成功读取的配送政策。
        attempt: 从 1 开始的当前生成次数。
        invalid_drafts: 前多少次返回错误订单状态；只是测试夹具。
    Returns:
        待校验的结构化候选，不改变业务或工具状态。
    """
    await asyncio.sleep(0)
    return {"order_id": order["order_id"],
            "state": "delivered" if attempt <= invalid_drafts else order["state"],
            "min_days": policy["min_days"], "max_days": policy["max_days"],
            "sources": [order["source"], policy["source"]]}


def valid_result(candidate, order, policy):
    """检查本例结构化事实与来源，拒绝生成的伪完成。

    Args:
        candidate: 生成节点返回的候选对象。
        order: 当前成功读取的订单事实。
        policy: 当前成功读取的政策事实。
    Returns:
        是否满足本例字段与事实约束；不验证任意自然语言含义。
    """
    expected = {"order_id": order["order_id"], "state": order["state"],
                "min_days": policy["min_days"], "max_days": policy["max_days"],
                "sources": [order["source"], policy["source"]]}
    return (type(candidate) is dict and set(candidate) == set(expected)
            and all(type(candidate[key]) is type(value) and candidate[key] == value
                    for key, value in expected.items()))


async def workflow(case, model_label, max_attempts=2, fault=None, invalid_drafts=0, deadline=0.2):
    """按固定图执行工单调查，模型标签只在允许路由中使用。

    Args:
        case: 可信夹具工单，只允许 shop-a 的 CASE-1042 与 ORD-2048。
        model_label: 配送 delivery、退款 refund 或其他 other 的分类建议。
        max_attempts: 1 或 2 的严格整数候选生成上限。
        fault: None、order、policy 或 timeout，用于注入只读节点故障。
        invalid_drafts: 非负整数，指定生成夹具前几次事实错误。
        deadline: 正数秒数，控制整个协作式运行等待时间。
    Returns:
        明确的状态、原因及事件；只有事实验收通过才返回 completed。
    """
    if type(max_attempts) is not int or not 1 <= max_attempts <= 2:
        raise ValueError("invalid_attempt_limit")
    if type(invalid_drafts) is not int or invalid_drafts < 0:
        raise ValueError("invalid_draft_fixture")
    if type(deadline) not in (int, float) or not 0 < deadline <= 60:
        raise ValueError("invalid_deadline")
    events = ["authorize"]
    if case.tenant_id != "shop-a" or case.case_id != "CASE-1042":
        return {"status": "blocked", "reason": "case_scope", "events": events}
    if case.order_id is None:
        return {"status": "clarify", "reason": "missing_order", "events": events}
    if case.order_id != "ORD-2048":
        return {"status": "blocked", "reason": "order_scope", "events": events}
    if model_label not in ("delivery", "refund", "other"):
        return {"status": "failed", "reason": "invalid_route", "events": events}
    events.append("route:" + model_label)
    if model_label == "refund":
        return {"status": "waiting_approval", "reason": "refund_review", "events": events}
    if model_label == "other":
        return {"status": "manual", "reason": "unsupported_category", "events": events}
    try:
        async with asyncio.timeout(deadline):
            async with asyncio.TaskGroup() as group:
                order_task = group.create_task(read_order(case, events, fail=fault == "order"))
                policy_fault = "timeout" if fault == "timeout" else "failure" if fault == "policy" else None
                policy_task = group.create_task(read_policy(case, events, fault=policy_fault))
            order, policy = order_task.result(), policy_task.result()
            events.append("join")
            for attempt in range(1, max_attempts + 1):
                events.append(f"draft:{attempt}")
                candidate = await draft_result(order, policy, attempt, invalid_drafts)
                if valid_result(candidate, order, policy):
                    events.append("completed")
                    return {"status": "completed", "result": candidate, "events": events}
                events.append(f"rejected:{attempt}")
            return {"status": "failed", "reason": "validation_limit", "events": events}
    except TimeoutError:
        return {"status": "failed", "reason": "deadline", "events": events}
    except ExceptionGroup:
        # 不使用单个成功分支填补必要事实，失败节点由事件定位。
        return {"status": "failed", "reason": "node_failed", "events": events}


async def run_checks():
    """验证路径、并行启动、故障、有限循环与对象授权。

    Returns:
        无返回值；所有控制断言通过后输出结果。
    """
    case = Case("shop-a", "CASE-1042", "ORD-2048")
    normal = await workflow(case, "delivery")
    assert normal["status"] == "completed" and normal["result"]["state"] == "in_transit"
    order = await read_order(case, [])
    policy = await read_policy(case, [])
    for field, value in (("min_days", 3.0), ("max_days", True), ("state", "delivered")):
        damaged = dict(normal["result"])
        damaged[field] = value
        assert not valid_result(damaged, order, policy)
    events = normal["events"]
    assert max(events.index("start:order"), events.index("start:policy")) < min(events.index("end:order"), events.index("end:policy"))
    assert (await workflow(replace(case, order_id=None), "delivery"))["status"] == "clarify"
    assert (await workflow(case, "refund"))["status"] == "waiting_approval"
    assert (await workflow(case, "other"))["status"] == "manual"
    assert (await workflow(case, "run_shell"))["reason"] == "invalid_route"
    assert (await workflow(replace(case, tenant_id="shop-b"), "delivery"))["status"] == "blocked"
    assert (await workflow(replace(case, order_id="ORD-9999"), "delivery"))["status"] == "blocked"
    for fault in ("order", "policy"):
        failed = await workflow(case, "delivery", fault=fault)
        assert failed["reason"] == "node_failed" and "join" not in failed["events"]
        assert "failed:" + fault in failed["events"]
    repaired = await workflow(case, "delivery", invalid_drafts=1)
    assert repaired["status"] == "completed" and "rejected:1" in repaired["events"]
    exhausted = await workflow(case, "delivery", invalid_drafts=2)
    assert exhausted["reason"] == "validation_limit" and "draft:3" not in exhausted["events"]
    timed_out = await workflow(case, "delivery", fault="timeout", deadline=0.01)
    assert timed_out["reason"] == "deadline" and "cancelled:policy" in timed_out["events"]
    for invalid_limit in (0, True, 3):
        try:
            await workflow(case, "delivery", max_attempts=invalid_limit)
        except ValueError:
            pass
        else:
            raise AssertionError("invalid loop limit accepted")
    print("workflow_checks=passed")
    print("normal=completed missing_order=clarify repair_attempts=2 timeout=deadline")


if __name__ == "__main__":
    asyncio.run(run_checks())
```

:::

### 3. 执行与观察

运行当前文件：

```powershell
python case_workflow.py
```

检查通过时输出如下：

```text
workflow_checks=passed
normal=completed missing_order=clarify repair_attempts=2 timeout=deadline
```

两个 `start` 事件先于任一 `end`，证明当前异步夹具并行启动。必要节点失败没有进入汇合成功路径；第一次错误候选可修订，第二次仍错误则明确停止；超时节点收到取消并保留事件。

本例不持久化任务，也不跨进程恢复。长任务可以在已经定义的节点边界保存[检查点](../04-state-memory/01-task-state-checkpoints.md)，恢复时继续核对业务事实；不能把这份内存事件列表当作生产审计或恢复机制。

## 四、编排失败定位

| 现象 | 定位证据 | 处理 |
|------|----------|------|
| 分支走向错误 | 分类原值、校验结果与路由事件 | 改进分类或增加澄清，不扩大标签对应权限 |
| 并行分支返回不完整 | 每个节点终态及汇合条件 | 必要事实缺失就失败，按明确策略处理可选分支 |
| 修订一直继续 | 尝试次数及验收原因 | 设置上限并返回停止原因 |
| 超时后仍有外部效果 | 服务请求、操作键和业务流水 | 权威回查，按恢复规则判断重试 |
| 重启后节点重复执行 | 检查点、节点版本与幂等记录 | 固定恢复位置，有副作用时先核对旧结果 |

执行路径越固定，越容易定位具体失败节点。只有动态选择确有价值时才增加模型自由度，仍需保留明确的成功条件和预算。

## 五、参考资料

- [Python 3.12 协程与任务](https://docs.python.org/3.12/library/asyncio-task.html)：TaskGroup、超时与协作取消。
- [Anthropic 工作流模式](https://www.anthropic.com/engineering/building-effective-agents)：顺序、路由、并行与动态分解的对照。
- [Agent 与工作流](../01-agent-model/01-agent-workflows.md)：控制方式的选择依据。
- [失败恢复](../04-state-memory/03-failure-recovery.md)：取消、结果未知与副作用回查。
