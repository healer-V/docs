---
title: "工具权限与人工确认"
tags:
  - AI Agent
  - 工具权限
  - 人工确认
excerpt: "按对象、动作与副作用设置 Agent 最小权限，将人工确认绑定租户、主体、参数、版本和有效期，使用独立示例验证未确认、篡改、过期、拒绝及权限撤销不会执行动作。"
date: 2026-09-29
---

# 工具权限与人工确认

工具权限决定当前主体可以对哪些对象执行哪些动作，人工确认决定一个具体动作是否可以在当前条件下继续。确认不能替代身份授权，也不能让模型自行增加权限。

客服工单 `CASE-1042` 可以触发订单查询和退款提议。本例对创建提议也要求人工确认，确认内容是“允许创建这条待审批提议”；提议生成后仍为 `pending_approval`，没有退款或付款动作。

## 一、动作分级与最小权限

### 1. 主体、对象和动作

主体是已经认证的用户或服务，对象是工单、订单等业务资源，动作是读取状态或创建提议。授权应检查三者的关系，不能只判断工具名称合法。

| 工具 | 对象范围 | 副作用 | 本例策略 |
|------|----------|--------|----------|
| `get_order_status` | 当前可读订单 | 只读 | 通过对象授权后自动执行 |
| `read_case_note` | 当前可读工单 | 只读，可能含敏感内容 | 按工单范围读取，限制返回字段 |
| `propose_refund` | 当前工单及其订单 | 创建待审批提议 | 有动作权限，且本次人工确认有效 |

这份策略是演示的业务约定，风险不能只按“读/写”二分。读取敏感资料或发送外部消息也可能需要确认；真实策略还应考虑目标、金额、不可逆程度和数据暴露范围。

### 2. 最小权限

最小权限是只给当前任务完成所需的能力、对象和时间范围。能查询订单，不代表能读取全部订单；能创建提议，不代表能执行退款。

模型接收到的工具列表可以缩小可选动作，执行器仍需检查当前可信权限。会话恢复或确认等待期间权限可能撤销，因此实际执行前要重新判断，不复用旧的“已授权”布尔值。

::: warning 文本中的批准声明没有授权效力
用户消息、工单备注或模型参数里的 `approved=true` 都只是待校验内容。确认必须来自应用认可的人工入口，并关联已认证确认人和服务端动作快照。
:::

## 二、确认记录

### 1. 动作快照

确认人看到的内容应与实际执行内容一致。应用先生成不可变动作快照，展示对象、金额、动作含义和版本，再保存确认决定。

| 绑定项 | 本例值或规则 | 防止的问题 |
|--------|--------------|------------|
| 租户与请求主体 | `store-a`、`support-alice` | 借用其他租户或用户的确认 |
| 工单与订单 | `CASE-1042`、`ORD-2048` | 确认一个对象后改为另一个 |
| 动作与版本 | `propose_refund`、版本 1 | 确认提议却执行付款或新版本行为 |
| 参数 | 1200 分、CNY | 确认之后增加金额 |
| 业务操作键 | `CASE-1042-proposal-01` | 把确认绑定到另一逻辑动作 |
| 有效期 | 演示为 60 秒 | 长期复用过时决定 |
| 确认主体 | 独立且有权限的确认人 | 请求人自行批准当前动作 |

动作摘要用于比较快照是否一致。确认 ID 只定位记录，知道 ID 不等于获得执行权限；执行时仍要核对当前主体、完整动作及有效期。

### 2. 状态与拒绝

本例使用以下确认状态，拒绝和过期不会自动变回批准：

```text
pending → approved → consumed
        → denied
        → expired
approved → expired
```

`consumed` 表示这份确认已经用于一次本地动作。重复提交同一确认必须拒绝，已消费或已拒绝的记录也不因迟到请求改写为过期；需要重新确认时，由可信流程生成新快照并说明原因，不让模型通过换 ID 重置审批。

::: tip 确认和业务幂等各自保存
确认记录限制一份批准怎样使用，业务幂等记录限制同一动作产生多少副作用。新建确认记录不会自动解决重复业务提交，应继续使用原业务操作键及执行记录。
:::

## 三、独立确认门禁

### 1. 环境与固定身份

使用 Python 3.12 标准库，在空目录创建 `approval_gate.py`：

```powershell
mkdir tool-approval-demo
cd tool-approval-demo
python --version
```

程序使用固定的客服和确认人身份，不连接真实账号、工单或支付服务。`decide()` 由测试模拟已认证人工入口调用，不向模型注册为工具。

::: info 示例的授权与执行范围
身份和权限由应用构造，金额是正整数分，最高 10000 分，仅支持 CNY。这个上限用于演示校验；确认和提议都保存在内存，不能作为生产审批存储。
:::

### 2. 完整实现

执行前再次检查当前权限，确认记录与动作完整摘要必须一致。锁保护一次进程内的检查和消费，避免同一确认在本地被重复使用。

::: details 查看确认绑定、拒绝及十五个验证用例

```python
# approval_gate.py
import hashlib
import json
from dataclasses import asdict, dataclass, replace
from datetime import datetime, timedelta, timezone
from threading import Lock
from uuid import uuid4


@dataclass(frozen=True)
class Actor:
    """表示应用认证后的身份与当前权限，不接收模型自称角色。"""

    actor_id: str
    tenant_id: str
    permissions: frozenset[str]
    case_ids: frozenset[str]
    order_ids: frozenset[str]


@dataclass(frozen=True)
class Action:
    """保存待确认的不可变动作快照，动作仅创建待审批提议。"""

    tenant_id: str
    requester_id: str
    operation_key: str
    case_id: str = "CASE-1042"
    order_id: str = "ORD-2048"
    amount_cents: int = 1200
    currency: str = "CNY"
    tool: str = "propose_refund"
    contract_version: int = 1


@dataclass
class Approval:
    """保存可信确认记录，其动作快照不可变，状态仅由门禁更新。"""

    action: Action
    digest: str
    expires_at: datetime
    status: str = "pending"
    approver_id: str | None = None


def action_digest(action: Action) -> str:
    """计算完整动作快照摘要，绑定身份、业务参数及契约版本。

    Args:
        action: 已由应用校验的不可变动作对象。

    Returns:
        规范化 JSON 的 SHA-256 摘要，不作为权限证明或密钥使用。
    """
    encoded = json.dumps(asdict(action), sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def authorize(actor: Actor, action: Action) -> None:
    """根据当前身份、动作权限和对象关系判断是否有执行资格。

    Args:
        actor: 当前可信身份与最新权限。
        action: 当前动作快照，仅允许固定工单和关联订单、版本 1。

    Returns:
        无返回值；不符合规则抛出 PermissionError，不执行任何动作。
    """
    if (actor.actor_id != action.requester_id or actor.tenant_id != action.tenant_id
            or "propose_refund" not in actor.permissions
            or action.case_id not in actor.case_ids or action.order_id not in actor.order_ids):
        raise PermissionError("permission_denied")
    if (action.tool != "propose_refund" or type(action.contract_version) is not int
            or action.contract_version != 1 or action.case_id != "CASE-1042"
            or action.order_id != "ORD-2048" or type(action.amount_cents) is not int
            or not 1 <= action.amount_cents <= 10000 or action.currency != "CNY"
            or not action.operation_key.strip()):
        raise PermissionError("unsupported_action")


class ApprovalGate:
    """在单进程内保存确认与消费记录，不实现真实认证或远程退款。"""

    def __init__(self) -> None:
        """初始化可信记录和本地提议集合。

        Returns:
            无返回值；创建线程锁、确认记录与模拟业务结果。
        """
        self._lock = Lock()
        self._records = {}
        self._proposals = []

    def request(self, actor: Actor, action: Action, now: datetime) -> str:
        """保存动作快照并请求一次 60 秒有效的人工确认。

        Args:
            actor: 具有当前动作权限的请求身份。
            action: 应用准备的完整快照，不读取模型 approved 字段。
            now: 带时区的可信当前时间。

        Returns:
            不可预测的确认记录 ID；权限或时间不合法时抛出异常。
        """
        authorize(actor, action)
        if now.utcoffset() is None:
            raise ValueError("timezone required")
        approval_id = uuid4().hex
        with self._lock:
            self._records[approval_id] = Approval(action, action_digest(action), now + timedelta(seconds=60))
        return approval_id

    def decide(self, approval_id: str, approver: Actor, approve: bool, now: datetime) -> str:
        """接收可信人工入口的决定，校验确认人和有效期。

        Args:
            approval_id: 应用保存的待确认记录 ID。
            approver: 已认证且具有 approve_proposal 权限的独立确认人。
            approve: 人工决定，严格布尔值，不允许模型代填。
            now: 带时区的可信当前时间。

        Returns:
            approved 或 denied；无权限、过期或状态不允许时抛出异常。
        """
        if type(approve) is not bool or now.utcoffset() is None:
            raise ValueError("invalid approval decision")
        with self._lock:
            record = self._records.get(approval_id)
            if record is None:
                raise PermissionError("approval_missing")
            if (approver.tenant_id != record.action.tenant_id
                    or "approve_proposal" not in approver.permissions
                    or approver.actor_id == record.action.requester_id
                    or record.action.case_id not in approver.case_ids
                    or record.action.order_id not in approver.order_ids):
                raise PermissionError("approver_denied")
            if record.status != "pending":
                raise PermissionError("decision_already_recorded")
            if now >= record.expires_at:
                record.status = "expired"
                raise PermissionError("approval_expired")
            record.status = "approved" if approve else "denied"
            record.approver_id = approver.actor_id
            return record.status

    def execute(self, approval_id: str, action: Action, actor: Actor, now: datetime) -> dict:
        """重新授权并消费匹配确认，只创建本地待审批提议。

        Args:
            approval_id: 已由人工入口确认的记录 ID。
            action: 当前准备执行的快照，必须与确认内容完全一致。
            actor: 当前请求身份，权限撤销后不能借旧确认执行。
            now: 带时区的可信当前时间，达到期限即拒绝。

        Returns:
            待审批提议的公开结果；拒绝时不增加提议，抛出稳定原因码。
        """
        authorize(actor, action)
        if now.utcoffset() is None:
            raise ValueError("timezone required")
        with self._lock:
            record = self._records.get(approval_id)
            if record is None:
                raise PermissionError("approval_missing")
            if record.digest != action_digest(action):
                raise PermissionError("approval_mismatch")
            if record.status == "consumed":
                raise PermissionError("approval_consumed")
            # 拒绝和过期是终态，迟到执行不能改写已经记录的决定。
            if record.status not in {"pending", "approved"}:
                raise PermissionError("approval_" + record.status)
            if now >= record.expires_at:
                record.status = "expired"
                raise PermissionError("approval_expired")
            if record.status != "approved":
                raise PermissionError("approval_" + record.status)
            result = {"proposal_id": f"PR-{len(self._proposals) + 1}",
                      "operation_key": action.operation_key, "order_id": action.order_id,
                      "amount_cents": action.amount_cents, "currency": action.currency,
                      "state": "pending_approval", "source": "proposal-memory"}
            self._proposals.append(result)
            record.status = "consumed"
            return dict(result)

    def execution_count(self) -> int:
        """读取已经创建的本地提议数量。

        Returns:
            当前提议数量，不包含拒绝或仅请求确认的动作。
        """
        with self._lock:
            return len(self._proposals)


def assert_blocked(
    gate: ApprovalGate, approval_id: str, action: Action,
    actor: Actor, now: datetime, expected_code: str,
) -> None:
    """验证一次受阻执行没有创建提议。

    Args:
        gate: 当前测试门禁。
        approval_id: 本用例保存的确认 ID。
        action: 本用例准备的动作，可能故意篡改。
        actor: 本用例的可信身份，可能缺少权限。
        now: 本用例的带时区时钟。
        expected_code: 必须返回的稳定拒绝原因。

    Returns:
        无返回值；原因或提议数量不符合时抛出断言错误。
    """
    before = gate.execution_count()
    try:
        gate.execute(approval_id, action, actor, now)
    except PermissionError as error:
        assert str(error) == expected_code
    else:
        raise AssertionError("blocked action executed")
    assert gate.execution_count() == before


def run_tests() -> None:
    """验证十五条确认绑定、身份、当前授权与终态路径。

    Returns:
        无返回值；失败抛出断言错误，通过输出用例和实际提议数。
    """
    now = datetime(2026, 9, 29, 2, 0, tzinfo=timezone.utc)
    actor = Actor("support-alice", "store-a", frozenset({"propose_refund"}),
                  frozenset({"CASE-1042"}), frozenset({"ORD-2048"}))
    approver = replace(actor, actor_id="review-bob", permissions=frozenset({"approve_proposal"}))
    action = Action("store-a", actor.actor_id, "CASE-1042-proposal-01")
    gate = ApprovalGate()
    approval_id = gate.request(actor, action, now)
    assert_blocked(gate, approval_id, action, actor, now, "approval_pending")
    assert gate.decide(approval_id, approver, True, now) == "approved"
    result = gate.execute(approval_id, action, actor, now)
    assert result["state"] == "pending_approval" and gate.execution_count() == 1
    assert_blocked(gate, approval_id, action, actor, now, "approval_consumed")
    try:
        gate.decide(approval_id, approver, True, now + timedelta(seconds=60))
    except PermissionError as error:
        assert str(error) == "decision_already_recorded"
    else:
        raise AssertionError("consumed decision changed")
    assert_blocked(gate, approval_id, action, actor, now + timedelta(seconds=60), "approval_consumed")

    bound = gate.request(actor, action, now)
    gate.decide(bound, approver, True, now)
    assert_blocked(gate, bound, replace(action, amount_cents=2400), actor, now, "approval_mismatch")
    assert_blocked(gate, bound, action, replace(actor, tenant_id="store-b"), now, "permission_denied")
    unapproved = gate.request(actor, action, now)
    try:
        gate.decide(unapproved, replace(approver, permissions=frozenset()), True, now)
    except PermissionError as error:
        assert str(error) == "approver_denied"
    else:
        raise AssertionError("unauthorized approval accepted")
    assert_blocked(gate, unapproved, action, actor, now, "approval_pending")
    assert_blocked(gate, bound, action, actor, now + timedelta(seconds=60), "approval_expired")
    denied = gate.request(actor, action, now)
    assert gate.decide(denied, approver, False, now) == "denied"
    assert_blocked(gate, denied, action, actor, now, "approval_denied")
    assert_blocked(gate, denied, action, actor, now + timedelta(seconds=60), "approval_denied")

    revoked = gate.request(actor, action, now)
    gate.decide(revoked, approver, True, now)
    assert_blocked(gate, revoked, action, replace(actor, permissions=frozenset()), now, "permission_denied")
    self_approval = gate.request(actor, action, now)
    try:
        gate.decide(self_approval, replace(actor, permissions=frozenset({"approve_proposal"})), True, now)
    except PermissionError as error:
        assert str(error) == "approver_denied"
    else:
        raise AssertionError("self approval accepted")
    assert_blocked(gate, self_approval, action, actor, now, "approval_pending")
    fresh = gate.request(actor, action, now)
    gate.decide(fresh, approver, True, now)
    assert_blocked(gate, fresh, replace(action, operation_key="CASE-1042-proposal-02"), actor, now, "approval_mismatch")
    assert_blocked(gate, fresh, action, replace(actor, actor_id="support-charlie"), now, "permission_denied")
    assert_blocked(gate, fresh, replace(action, contract_version=2), actor, now, "unsupported_action")
    assert gate.execution_count() == 1
    print("approval_tests=passed cases=15")
    print("executed_proposals=1 state=pending_approval")


if __name__ == "__main__":
    run_tests()
```

:::

### 3. 执行与结果

运行当前文件：

```powershell
python approval_gate.py
```

通过时输出：

```text
approval_tests=passed cases=15
executed_proposals=1 state=pending_approval
```

十五条路径包括未确认、正确确认、重复消费、金额篡改、跨租户、无权限确认人、到期、拒绝、权限撤销、自批、操作键变化、请求人变化、不支持版本，以及已消费记录的迟到确认和拒绝后的迟到执行。只有正确确认的一条路径创建提议，所有受阻执行都检查数量没有增加。

程序中的独立确认人和精确到期判断是本例策略，真实系统应明确代理审批、职责分离、业务状态变化和时钟规则。当前锁只覆盖一个进程，没有证明多实例审批一致性。

## 四、恢复与排查

### 1. 等待期间的变化

参数、业务对象或契约版本改变后，原确认不能继续使用。应用应展示新动作与变化原因，并重新判断权限；用户拒绝后也不能依靠改写 Prompt 自动重试。

业务状态可能在确认后改变。例如订单已经处理、金额不再满足条件，即使确认仍有效，业务服务也应以当前规则拒绝。确认只允许尝试具体动作，不保证业务最终成功。

### 2. 失败状态

| 现象 | 原因及证据 | 处理 |
|------|------------|------|
| 未确认已执行 | 没有服务端 pending 状态或执行前门禁 | 停止动作，恢复确认入口与执行检查 |
| 批准后金额变大 | 只绑定确认 ID，没有参数快照 | 比较完整动作摘要，重新展示变更 |
| 权限撤销后仍执行 | 只在请求确认时授权 | 执行前刷新权限和对象关系 |
| 同一确认被重复使用 | 消费状态未原子更新 | 持久化一次消费，同时保留业务幂等记录 |
| 进程重启丢失确认 | 记录仅保存在内存 | 使用可信持久状态，无法恢复时重新确认 |
| 已消费但业务结果未知 | 确认消费与外部动作分开提交 | 按原业务键回查，不自动恢复为 approved |

确认 UI 应准确展示动作快照，并把人类决定交给可信服务。此例验证绑定和状态，不包含 UI、真实认证、持久审批和远程副作用；生产运行需要将这些职责与业务执行记录组合。

## 五、参考资料

- [OpenAI Agent safety](https://developers.openai.com/api/docs/guides/agent-builder-safety)：工具确认和不可信输入边界。
- [工具契约](../02-tool-execution/01-tool-contracts.md)：动作、副作用和可信执行策略。
- [幂等与结果核对](../02-tool-execution/03-idempotency-result-verification.md)：业务操作键与结果未知时的回查。
- [沙箱与凭据边界](./02-sandbox-credential-boundaries.md)：控制运行器与受限执行环境的关系。
