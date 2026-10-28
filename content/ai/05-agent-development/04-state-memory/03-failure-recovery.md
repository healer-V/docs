---
title: "失败恢复"
tags:
  - AI Agent
  - 故障恢复
  - 幂等
excerpt: "按模型、工具、进程和人工等待区分 Agent 失败，使用独立故障注入程序验证提交前中断、响应丢失与检查点丢失，恢复原业务操作键并重新检查当前权限，说明重试、回查和人工接管的边界。"
date: 2026-09-29
---

# 失败恢复

Agent 失败恢复是在中断后，根据已提交任务状态和当前业务事实决定如何继续。网络超时只说明调用方没有及时收到结果，不能证明动作未发生；进程重启也不会自动撤销已经提交的业务操作。

工单 `CASE-1042` 创建待审批退款提议时，业务系统可能已经保存提议，Agent 却在更新检查点前退出。恢复应回查原提议、核对参数并补记结果；再次生成一个新操作键会制造重复动作。

## 一、失败位置与恢复动作

### 1. 故障分类

恢复策略依赖故障发生的位置、调用是否有副作用以及结果能否可靠回查。不能把所有异常都交给同一套自动重试。

| 故障位置 | 典型现象 | 恢复动作 | 必须保留的依据 |
|----------|----------|----------|----------------|
| 模型请求 | 超时、限流、无有效终态 | 判断是否可重试，保留原请求状态并限制尝试次数 | 输入、协议续接状态、已经处理的调用 |
| 只读工具 | 查询超时、暂时不可用 | 在当前权限下重新查询，判断观察是否仍新鲜 | 查询对象、身份、观察时间 |
| 业务写入 | 响应丢失、执行结果未知 | 用原业务键回查；满足幂等契约才考虑重试 | 原操作键、参数摘要、业务结果 |
| 进程与检查点 | 退出、写入失败、版本变化 | 读取已提交状态，核对业务记录与版本 | 原任务身份、阶段、未决调用 |
| 人工确认 | 等待、拒绝、到期或撤回 | 保持等待或停止；执行前重新读取决定 | 具体动作绑定的可信确认记录 |

模型重试也有边界。已经返回并执行过的工具调用不能因为模型响应处理失败就全部重放；需要记录输出处理位置和已提交动作，按协议恢复未完成部分。

### 2. 重试与停止

暂时性的请求故障可以采用有限次数的重试和退避，即等待一段时间再尝试；输入错误、权限拒绝、版本冲突需要修正条件。等待确认不应通过反复调用模型“催出一个批准”。

::: warning 未知副作用先回查
对于创建、支付、发送等动作，超时后不能直接重新执行。即使查询没有发现结果，远端原请求也可能仍在处理；只有业务服务明确保证同键幂等且当前执行条件满足时，重试才有依据。
:::

## 二、检查点与业务提交

### 1. 两份记录的顺序

本例用两个 SQLite 文件表示两个存储边界：任务库保存恢复状态，业务库保存提议和人工确认。业务副作用就是创建一条 `pending_approval` 提议，没有真实退款或支付。

```text
任务库标记 uncertain → 业务库原子创建提议并消费确认
  → 返回业务结果 → 任务库标记 completed
中断后：按原键读业务库 → 核对摘要 → 补记任务结果
```

`uncertain` 表示调用可能发生过。先提交这一状态，使进程在业务调用前后退出时都能保留原业务键；它不表示成功，也不表示失败。

业务库把提议与确认消费放在同一事务内。任务库的完成状态不属于这个事务，所以业务提交成功与任务检查点丢失可以同时发生。

### 2. 当前授权与既有结果

重新创建提议需要当前写权限及未过期、已批准、参数匹配的确认。回查已提交结果需要当前读权限，但不应因为原确认已被成功消费就否认既有业务记录。

| 回查结果 | 处理 |
|----------|------|
| 已存在且参数一致 | 接受当前可信业务记录，补记完成，不再创建 |
| 已存在但参数冲突 | 暂停并人工核对，不能覆盖或改写记录 |
| 不存在，服务支持原键幂等 | 检查当前写权限和确认，再用原键提交 |
| 不存在，未知动作不具备幂等保证 | 保留未知状态，转人工核对 |
| 当前没有读权限 | 停止回查，不返回受保护结果 |
| 任务已取消 | 返回取消状态，不发起新动作 |

::: tip 完成的对象是当前任务
示例的 `completed` 仅表示“创建待审批提议”已核对完成。提议本身仍为 `pending_approval`，没有批准退款，更没有执行退款。
:::

## 三、独立故障注入

### 1. 环境与夹具

使用 Python 3.12 标准库，在空目录创建 `failure_recovery.py`：

```powershell
mkdir agent-recovery-demo
cd agent-recovery-demo
python --version
```

程序使用固定 UTC Unix 秒、虚构的 1200 分 CNY 提议及可信权限夹具。人工确认直接由测试代码写入业务库，模拟可信确认系统；模型不能提供身份、权限或批准状态。

### 2. 完整实现

恢复入口先读取原任务与业务结果，再决定是否需要执行。三个故障点分别位于业务调用前、业务提交后及任务完成检查点前。

::: details 查看双存储恢复与十四个故障用例

```python
# failure_recovery.py
import hashlib
import json
import sqlite3
from dataclasses import asdict, dataclass, replace
from pathlib import Path
from tempfile import TemporaryDirectory

NOW = 1_800_000_000


@dataclass(frozen=True)
class Action:
    """应用冻结的提议动作；恢复必须保留身份、参数和操作键。"""
    tenant_id: str
    run_id: str
    operation_key: str = "CASE-1042-proposal-01"
    case_id: str = "CASE-1042"
    order_id: str = "ORD-2048"
    amount_cents: int = 1200
    currency: str = "CNY"
    contract_version: int = 1


@dataclass(frozen=True)
class Access:
    """认证层提供的当前权限夹具，不由模型或恢复快照决定。"""
    tenant_id: str
    can_read: bool = True
    can_write: bool = True


def digest(action: Action) -> str:
    """计算本篇固定动作的规范化摘要；摘要不证明授权。

    Returns:
        规范化动作的 SHA-256 十六进制字符串。
    """
    encoded = json.dumps(asdict(action), sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(encoded.encode()).hexdigest()


def open_store(path: Path, business: bool) -> sqlite3.Connection:
    """分别建立任务库或业务库，两个连接不能共享事务。

    Args:
        path: 本例临时目录中的独立 SQLite 文件。
        business: True 建业务表，False 建任务状态表。

    Returns:
        自动提交连接；调用方负责关闭。
    """
    connection = sqlite3.connect(path, isolation_level=None)
    connection.row_factory = sqlite3.Row
    if business:
        connection.executescript("""
            CREATE TABLE IF NOT EXISTS proposals (
                tenant_id TEXT, operation_key TEXT, action_digest TEXT,
                result TEXT, PRIMARY KEY(tenant_id, operation_key));
            CREATE TABLE IF NOT EXISTS approvals (
                tenant_id TEXT, operation_key TEXT, action_digest TEXT,
                decision TEXT, expires_at INTEGER,
                PRIMARY KEY(tenant_id, operation_key));
        """)
    else:
        connection.execute("""CREATE TABLE IF NOT EXISTS runs (
            tenant_id TEXT, run_id TEXT, action_digest TEXT, status TEXT,
            result TEXT, PRIMARY KEY(tenant_id, run_id))""")
    return connection


def set_status(state: sqlite3.Connection, action: Action, status: str, result: dict | None = None) -> str:
    """提交任务阶段，不改变冻结动作或业务记录。

    Args:
        state: 任务库自动提交连接。
        action: 当前任务的冻结动作。
        status: 由恢复器确定的状态。
        result: 已核对业务结果；没有结果时为 None。

    Returns:
        已提交状态字符串。
    """
    state.execute("UPDATE runs SET status=?, result=? WHERE tenant_id=? AND run_id=?",
                  (status, json.dumps(result) if result is not None else None,
                   action.tenant_id, action.run_id))
    return status


def read_proposal(business: sqlite3.Connection, action: Action, access: Access) -> dict | None:
    """在当前读权限下回查原业务键，并拒绝参数冲突。

    Args:
        business: 可信业务库连接，不接受模型提供的结果代替读取。
        action: 原任务的冻结动作。
        access: 当前认证层给出的租户和读权限。

    Returns:
        已有提议；不存在时为 None，越权或摘要冲突时抛出异常。
    """
    if access.tenant_id != action.tenant_id or not access.can_read:
        raise PermissionError("read_revoked")
    row = business.execute("SELECT * FROM proposals WHERE tenant_id=? AND operation_key=?",
                           (action.tenant_id, action.operation_key)).fetchone()
    if row is None:
        return None
    if row["action_digest"] != digest(action):
        raise ValueError("business_action_conflict")
    result = json.loads(row["result"])
    expected = {"proposal_id": "PR-1042", "case_id": action.case_id,
                "order_id": action.order_id, "amount_cents": action.amount_cents,
                "currency": action.currency, "state": "pending_approval"}
    if result != expected:
        raise ValueError("business_result_conflict")
    return result


def submit_proposal(business: sqlite3.Connection, action: Action, access: Access, now: int) -> dict:
    """用原键原子创建提议并消费确认，重复键返回原记录。

    Args:
        business: 可信业务库自动提交连接。
        action: 固定合法提议，契约版本 1、正整数分与 CNY。
        access: 当前读写权限，租户必须与动作一致。
        now: 可信应用当前 Unix 秒，等于到期时间即失效。

    Returns:
        pending_approval 提议；权限与确认不满足时抛出 PermissionError。
    """
    if (action.contract_version != 1 or type(action.amount_cents) is not int
            or not 0 < action.amount_cents <= 10000 or action.currency != "CNY"):
        raise ValueError("invalid action")
    business.execute("BEGIN IMMEDIATE")
    try:
        existing = read_proposal(business, action, access)
        if existing is not None:
            business.commit()
            return existing
        if not access.can_write:
            raise PermissionError("write_revoked")
        approval = business.execute("SELECT * FROM approvals WHERE tenant_id=? AND operation_key=?",
                                    (action.tenant_id, action.operation_key)).fetchone()
        if (approval is None or approval["decision"] != "approved"
                or approval["action_digest"] != digest(action) or approval["expires_at"] <= now):
            raise PermissionError("approval_unavailable")
        result = {"proposal_id": "PR-1042", "case_id": action.case_id,
                  "order_id": action.order_id, "amount_cents": action.amount_cents,
                  "currency": action.currency, "state": "pending_approval"}
        business.execute("INSERT INTO proposals VALUES (?,?,?,?)",
                         (action.tenant_id, action.operation_key, digest(action), json.dumps(result)))
        business.execute("UPDATE approvals SET decision='consumed' WHERE tenant_id=? AND operation_key=?",
                         (action.tenant_id, action.operation_key))
        business.commit()
        return result
    except BaseException:
        business.rollback()
        raise


def recover(state: sqlite3.Connection, business: sqlite3.Connection, action: Action,
            access: Access, now: int, idempotent: bool = True, fault: str = "") -> str:
    """先核对业务结果，再按当前条件继续；故障保持已提交状态。

    Args:
        state: 当前任务库连接。
        business: 独立业务库连接。
        action: 原冻结动作，不能恢复时换键或参数。
        access: 当前可信身份和权限。
        now: 可信应用当前 Unix 秒。
        idempotent: 业务服务是否承诺同键幂等；由适配器配置决定。
        fault: 测试故障点，空值或 before_call、after_commit、before_checkpoint。

    Returns:
        已提交任务状态；模拟进程中断及超时直接抛出异常。
    """
    row = state.execute("SELECT * FROM runs WHERE tenant_id=? AND run_id=?",
                        (action.tenant_id, action.run_id)).fetchone()
    if row is None or row["action_digest"] != digest(action):
        raise ValueError("snapshot_action_conflict")
    if row["status"] in {"cancelled", "manual"}:
        return row["status"]
    try:
        existing = read_proposal(business, action, access)
    except PermissionError:
        return set_status(state, action, "blocked")
    except ValueError:
        return set_status(state, action, "manual")
    if existing is not None:
        return set_status(state, action, "completed", existing)
    if row["status"] == "completed" or (row["status"] == "uncertain" and not idempotent):
        return set_status(state, action, "manual")
    set_status(state, action, "uncertain")
    if fault == "before_call":
        raise RuntimeError("injected before business call")
    try:
        result = submit_proposal(business, action, access, now)
    except PermissionError as error:
        return set_status(state, action, "blocked" if str(error) != "approval_unavailable" else "waiting_approval")
    if fault == "after_commit":
        raise TimeoutError("response lost after business commit")
    if fault == "before_checkpoint":
        raise RuntimeError("injected before completion checkpoint")
    return set_status(state, action, "completed", result)


def retry_allowed(error_kind: str, attempts: int, max_attempts: int = 2) -> bool:
    """判断尚未涉及副作用的请求故障是否还有尝试额度。

    Args:
        error_kind: 控制器分类的 timeout、rate_limit 或其他错误。
        attempts: 已发出的尝试次数，包含首次请求。
        max_attempts: 总尝试次数上限，默认 2 仅用于演示。

    Returns:
        暂时性错误且次数未耗尽时为 True；不授权业务写入重试。
    """
    return error_kind in {"timeout", "rate_limit"} and 0 <= attempts < max_attempts


def setup_case(root: Path, label: str, decision: str = "approved", expires_at: int = NOW + 60) -> tuple:
    """为每个验证用例建立两份独立持久记录及可信夹具。

    Args:
        root: 本次验证的空临时目录。
        label: 唯一用例名，用于区分数据库和任务 ID。
        decision: 测试代码模拟的人工决定，不来自模型。
        expires_at: 可信确认到期 Unix 秒。

    Returns:
        任务连接、业务连接、冻结动作及当前权限。
    """
    state = open_store(root / f"{label}-state.sqlite", False)
    business = open_store(root / f"{label}-business.sqlite", True)
    action = Action("store-a", f"run-{label}")
    state.execute("INSERT INTO runs VALUES (?,?,?,?,?)",
                  (action.tenant_id, action.run_id, digest(action), "ready", None))
    business.execute("INSERT INTO approvals VALUES (?,?,?,?,?)",
                     (action.tenant_id, action.operation_key, digest(action), decision, expires_at))
    return state, business, action, Access("store-a")


def run_tests() -> None:
    """验证十四项恢复、授权、确认、冲突、取消与重试分类行为。

    Returns:
        无返回值；输出验证结果，结束关闭连接并清理临时数据库。
    """
    connections = []
    with TemporaryDirectory(prefix="agent-recovery-") as directory:
        root = Path(directory)
        try:
            state, business, action, access = setup_case(root, "normal")
            connections.extend((state, business))
            assert recover(state, business, action, access, NOW) == "completed"
            assert recover(state, business, action, access, NOW) == "completed"
            assert business.execute("SELECT COUNT(*) FROM proposals").fetchone()[0] == 1
            for fault in ("before_call", "after_commit", "before_checkpoint"):
                state, business, action, access = setup_case(root, fault)
                try:
                    recover(state, business, action, access, NOW, fault=fault)
                except (RuntimeError, TimeoutError):
                    assert state.execute("SELECT status FROM runs").fetchone()[0] == "uncertain"
                else:
                    raise AssertionError("fault not injected")
                state.close()
                business.close()
                state = open_store(root / f"{fault}-state.sqlite", False)
                business = open_store(root / f"{fault}-business.sqlite", True)
                connections.extend((state, business))
                # 已提交动作可在确认过期后回查；尚未执行的动作仍需有效确认。
                recovery_time = NOW if fault == "before_call" else NOW + 120
                assert recover(state, business, action, access, recovery_time) == "completed"
                assert business.execute("SELECT COUNT(*) FROM proposals").fetchone()[0] == 1
            for label, decision, expiry, can_write, expected in (
                ("revoked", "approved", NOW + 60, False, "blocked"),
                ("expired", "approved", NOW, True, "waiting_approval"),
                ("pending", "pending", NOW + 60, True, "waiting_approval"),
            ):
                state, business, action, access = setup_case(root, label, decision, expiry)
                connections.extend((state, business))
                assert recover(state, business, action, replace(access, can_write=can_write), NOW) == expected
                assert business.execute("SELECT COUNT(*) FROM proposals").fetchone()[0] == 0
            state, business, action, access = setup_case(root, "nonidempotent")
            connections.extend((state, business))
            set_status(state, action, "uncertain")
            assert recover(state, business, action, access, NOW, idempotent=False) == "manual"
            assert business.execute("SELECT COUNT(*) FROM proposals").fetchone()[0] == 0
            try:
                recover(state, business, replace(action, amount_cents=2400), access, NOW)
            except ValueError as error:
                assert str(error) == "snapshot_action_conflict"
            else:
                raise AssertionError("changed action recovered")
            state, business, action, access = setup_case(root, "cancelled")
            connections.extend((state, business))
            set_status(state, action, "cancelled")
            assert recover(state, business, action, access, NOW) == "cancelled"
            assert business.execute("SELECT COUNT(*) FROM proposals").fetchone()[0] == 0
            assert retry_allowed("timeout", 1) and not retry_allowed("timeout", 2)
            assert not retry_allowed("permission_denied", 0)
            state, business, action, access = setup_case(root, "conflict")
            connections.extend((state, business))
            business.execute("INSERT INTO proposals VALUES (?,?,?,?)",
                             (action.tenant_id, action.operation_key, "wrong-digest", "{}"))
            assert recover(state, business, action, access, NOW) == "manual"
            state, business, action, access = setup_case(root, "result-conflict")
            connections.extend((state, business))
            assert recover(state, business, action, access, NOW) == "completed"
            business.execute("UPDATE proposals SET result='{}'")
            assert recover(state, business, action, access, NOW) == "manual"
            print("recovery_tests=passed cases=14")
            print("duplicate_proposals=0 nonidempotent_unknown=manual expired_state=waiting_approval")
        finally:
            for connection in connections:
                connection.close()


if __name__ == "__main__":
    run_tests()
```

:::

### 3. 执行与结果

运行当前文件：

```powershell
python failure_recovery.py
```

通过时输出如下，到期确认没有产生写入，任务状态为 `waiting_approval`：

```text
recovery_tests=passed cases=14
duplicate_proposals=0 nonidempotent_unknown=manual expired_state=waiting_approval
```

十四项检查覆盖正常创建、重复恢复、三个进程或响应故障、写权限撤回、确认到期、确认等待、不具备幂等保证的未知动作、快照参数冲突、取消、重试分类、业务摘要冲突与结果字段损坏。

三个故障场景都关闭并重新打开两份数据库。恢复后每个逻辑动作只有一条提议；已经消费且到期的确认不妨碍有读权限的应用核对既有结果，也不会授权再次创建。

本例没有实现调度租约、真实网络传输或远端服务幂等保证。`manual` 只标记需要人工处理的状态，实际工单交接、证据归档和人工操作入口仍需应用实现。故障注入证明本地恢复决策与两个提交边界的行为，不能推广为跨系统恰好一次执行。

## 四、人工接管与排查

当动作结果不可核对、参数冲突或自动恢复条件不足时，人工接管需要原任务身份、原操作键、最后已提交阶段、实际错误、业务回查结果及尚未确定的事项。不得把模型的成功总结当作人工接管的事实依据。

| 现象 | 判断与处理 |
|------|------------|
| 重启出现第二条提议 | 核对操作键是否变化、幂等记录是否过期，停止继续创建并查明原结果 |
| 已有提议却一直等待确认 | 先回查既有业务记录；确认消费状态不能代替结果读取 |
| 无结果且服务不支持幂等 | 保留未知事实，人工查询业务流水，不自动换键重做 |
| 任务库说完成，业务记录不存在 | 转人工核对撤回、保留期限及数据损坏，不能默认重建 |
| 恢复后权限已撤回 | 获取当前权限，停止对应读取或写入，保留可审计状态 |
| 失败请求无限循环 | 按故障类别设置有限尝试，额度耗尽后明确停止原因 |

人工接管后再次启动，也要使用明确的状态转移和新的授权依据。不能通过手工把状态改成 `ready` 绕过原动作冲突、取消或未知结果。

## 五、参考资料

- [SQLite 事务](https://www.sqlite.org/lang_transaction.html)：单数据库原子提交及其边界。
- [任务状态与检查点](./01-task-state-checkpoints.md)：状态读取、版本和陈旧写入。
- [幂等与结果核对](../02-tool-execution/03-idempotency-result-verification.md)：操作键、参数摘要与权威回查。
- [工具权限与人工确认](../03-permissions-isolation/01-tool-permissions-human-approval.md)：具体动作的当前授权。
- [重试与幂等](../../02-model-integration/06-integration-reliability/02-retry-idempotency.md)：模型接口故障的处理边界。
