---
title: "任务状态与检查点"
tags:
  - AI Agent
  - 检查点
  - SQLite
excerpt: "区分 Agent 任务状态、事件日志和模型上下文，使用独立 SQLite 程序原子保存事件与检查点，验证重启恢复、版本校验、陈旧写入、事务回滚和人工等待，明确外部动作的恢复边界。"
date: 2026-09-29
---

# 任务状态与检查点

任务状态是应用记录的执行事实，检查点是能够用于恢复的一份已提交状态。模型历史只能说明模型看过什么，不能证明工具是否执行、确认是否有效或任务是否完成。

工单 `CASE-1042` 的调查可能在订单查询后中断，也可能等待创建退款提议的人工确认。恢复入口需要知道当前步骤、未完成调用、已验证证据及等待对象，才能决定继续、暂停还是回查业务结果。

## 一、状态、事件与上下文

### 1. 三类记录

| 记录 | 本例用途 | 不能代替的内容 |
|------|----------|----------------|
| 当前状态 | 判断任务现在能接受哪种事件 | 业务系统中的权威订单或提议记录 |
| 事件日志 | 解释状态怎样变化、处理到哪个位置 | 重新执行事件中描述的动作 |
| 模型上下文 | 为一次请求组装任务和有效观察 | 执行记录、权限与人工确认 |

事件是已经观察到的变化，例如发出模型请求、保存工具调用或接收到成功结果。恢复时读取事件，不等于再次请求模型或再次执行工具；这些动作必须由运行器重新判断。

本例同时保存当前状态和事件日志。每次提交一条事件，更新状态中的 `sequence`，使恢复入口知道哪些变化已经可靠处理。日志可用于审计和诊断，当前状态避免每次恢复都从第一条事件重算。

### 2. 检查点字段

| 字段 | 含义与约束 |
|------|------------|
| `tenant_id`、`run_id` | 可信应用绑定的租户与任务身份 |
| `schema_version`、`policy_version` | 快照结构与执行策略版本；本例只接受版本 1 |
| `sequence` | 已提交事件的连续序号，从 0 开始 |
| `step` | 已发出的模型请求次数，与工具调用数分开 |
| `status`、`phase` | 任务生命周期与当前执行阶段 |
| `pending_call` | 调用 ID、工具、参数和原业务操作键 |
| `pending_approval` | 确认记录 ID、动作摘要、业务键及有效期引用 |
| `evidence`、`final_answer` | 已校验工具证据与通过验收的最终结果 |

检查点应保存恢复所需的最小信息。大文件、原始密钥和全量日志不适合直接塞进快照；可以保存受权限控制的对象引用，但恢复时仍要确认对象存在、版本匹配且当前可读。

::: warning 快照中的权限不能作为当前权限
快照可以保留当时使用的策略版本与确认引用，执行前仍需重新获取当前身份、授权及确认状态。读到 `pending_approval` 只表示任务在等待，不表示动作已经获准。
:::

## 二、状态转移与提交边界

### 1. 生命周期与阶段

`status` 表示任务整体是运行、等待还是结束；`phase` 表示控制循环现在等待模型还是工具。两个维度避免把“本轮模型完成”误写成“任务完成”。

本例的正常路径如下，只有实际工具证据才能支撑最终完成：

```text
running/ready → awaiting_model → awaiting_tool → ready
             → awaiting_model → completed/ended
             → awaiting_model → waiting_approval/waiting_approval
运行或等待 → cancelled/ended
运行或等待 → failed/ended
```

等待确认是一份可恢复状态。本例只保存等待引用，不实现批准后执行；取消与失败保留未完成调用，以便诊断是否还需回查外部动作。进入终态后不再接受新执行事件。

### 2. 事件与快照原子提交

如果事件已写入而快照未更新，恢复入口可能重复处理；如果快照前进而事件未写入，诊断又会缺少变化依据。本例把事件与当前状态放在同一数据库事务中提交：

```text
取得写事务 → 读取当前快照 → 核对预期序号
  → 校验状态转移 → 写入下一条事件 → 更新快照 → 提交
任一环节失败 → 事件与快照一起回滚
```

预期序号表示调用方基于哪份状态准备提交。当前序号已经改变时，旧调用方必须重新读取并判断，而不是覆盖新状态。这是乐观并发控制：允许先读取，提交时检查依据是否仍有效。

::: tip 原子范围以存储边界为准
同一 SQLite 事务只覆盖本数据库的事件与快照。HTTP 请求、外部工具动作和远端模型输出不在这个事务内；恢复外部副作用仍需业务操作键和权威结果回查。
:::

## 三、独立检查点存储

### 1. 环境与固定事件

使用 Python 3.12 标准库，在空目录创建 `task_checkpoints.py`：

```powershell
mkdir task-checkpoint-demo
cd task-checkpoint-demo
python --version
```

程序使用虚构订单、固定的控制器事件和临时 SQLite 文件，不调用模型或真实业务服务。事件是本篇的应用记录格式，不是 Responses API 的完整输出项；模型协议续接仍应保留接口要求的输入和输出。

::: info 示例的状态范围
每轮只处理一个 `get_order_status` 调用，订单固定为 `ORD-2048`。人工等待只保存可信确认记录的引用，程序不会自动批准、创建退款提议或执行退款。
:::

### 2. 完整实现

所有恢复读取都按租户与任务定位，验证快照版本和序号一致性。故障注入发生在事件写入后、快照更新前，用于观察整个提交是否回滚。

::: details 查看事件状态机、检查点与十二个验证用例

```python
# task_checkpoints.py
import json
import sqlite3
from pathlib import Path
from tempfile import TemporaryDirectory


def open_store(path: Path) -> sqlite3.Connection:
    """打开本篇的持久状态库，写入由调用方显式开启事务。

    Args:
        path: 临时验证目录中的 SQLite 文件，不使用生产状态。

    Returns:
        自动提交连接；调用方负责关闭。
    """
    connection = sqlite3.connect(path, isolation_level=None)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.executescript("""
        CREATE TABLE IF NOT EXISTS runs (
            tenant_id TEXT NOT NULL, run_id TEXT NOT NULL,
            sequence INTEGER NOT NULL, snapshot TEXT NOT NULL,
            PRIMARY KEY(tenant_id, run_id)
        );
        CREATE TABLE IF NOT EXISTS events (
            tenant_id TEXT NOT NULL, run_id TEXT NOT NULL,
            sequence INTEGER NOT NULL, event TEXT NOT NULL,
            PRIMARY KEY(tenant_id, run_id, sequence),
            FOREIGN KEY(tenant_id, run_id) REFERENCES runs(tenant_id, run_id)
        );
    """)
    return connection


def create_run(connection: sqlite3.Connection, tenant_id: str, run_id: str) -> dict:
    """创建不含调用、确认与结果的新任务快照。

    Args:
        connection: 已初始化的状态库。
        tenant_id: 可信应用绑定的非空租户 ID，不由模型指定。
        run_id: 当前租户内唯一的非空任务 ID。

    Returns:
        初始快照；重复身份由数据库唯一约束拒绝。
    """
    if not tenant_id.strip() or not run_id.strip():
        raise ValueError("empty run identity")
    state = {"schema_version": 1, "policy_version": 1,
             "tenant_id": tenant_id, "run_id": run_id, "sequence": 0,
             "step": 0, "status": "running", "phase": "ready",
             "pending_call": None, "pending_approval": None,
             "evidence": None, "final_answer": None}
    connection.execute("INSERT INTO runs VALUES (?,?,?,?)",
                       (tenant_id, run_id, 0, json.dumps(state)))
    return state


def load_run(connection: sqlite3.Connection, tenant_id: str, run_id: str) -> dict:
    """读取已提交快照，拒绝未知身份、版本及不一致序号。

    Args:
        connection: 已初始化的状态库。
        tenant_id: 当前请求的可信租户范围。
        run_id: 该租户内需要恢复的任务 ID。

    Returns:
        独立反序列化的快照；不存在或版本不支持时抛出异常。
    """
    row = connection.execute("SELECT sequence, snapshot FROM runs WHERE tenant_id=? AND run_id=?",
                             (tenant_id, run_id)).fetchone()
    if row is None:
        raise LookupError("run_missing")
    state = json.loads(row["snapshot"])
    if (type(state.get("schema_version")) is not int or state["schema_version"] != 1
            or type(state.get("policy_version")) is not int or state["policy_version"] != 1):
        raise ValueError("unsupported snapshot version")
    if (state["tenant_id"] != tenant_id or state["run_id"] != run_id
            or state["sequence"] != row["sequence"]):
        raise ValueError("inconsistent snapshot")
    return state


def apply_event(state: dict, event: dict) -> dict:
    """校验本篇控制器事件并生成新状态，不执行事件描述的工具。

    Args:
        state: 已校验版本的当前快照，只支持本篇单调用状态机。
        event: 来自控制器的 JSON 事件，包含 type 及该事件所需字段。

    Returns:
        新快照；非法顺序、错配结果或终态事件抛出 ValueError。
    """
    updated = json.loads(json.dumps(state))
    if state["status"] in {"completed", "failed", "cancelled"}:
        raise ValueError("terminal run")
    kind, phase = event.get("type"), state["phase"]
    if kind == "model_requested" and phase == "ready":
        updated["step"] += 1
        updated["phase"] = "awaiting_model"
    elif kind == "tool_called" and phase == "awaiting_model":
        if (event.get("tool") != "get_order_status" or event.get("order_id") != "ORD-2048"
                or type(event.get("call_id")) is not str or not event["call_id"].strip()):
            raise ValueError("invalid tool call")
        updated["pending_call"] = {"call_id": event["call_id"], "tool": event["tool"],
                                   "arguments": {"order_id": event["order_id"]},
                                   "operation_key": event.get("operation_key")}
        updated["phase"] = "awaiting_tool"
    elif kind == "tool_returned" and phase == "awaiting_tool":
        result = event.get("result")
        if (event.get("call_id") != state["pending_call"]["call_id"]
                or result != {"order_id": "ORD-2048", "status": "in_transit", "source": "order-memory"}):
            raise ValueError("unverified tool result")
        updated["evidence"] = result
        updated["pending_call"] = None
        updated["phase"] = "ready"
    elif kind == "answer_returned" and phase == "awaiting_model":
        evidence = state["evidence"]
        if (evidence is None or event.get("answer") !=
                {"order_id": evidence["order_id"], "status": evidence["status"]}):
            raise ValueError("unverified answer")
        updated.update(status="completed", phase="ended", final_answer=event["answer"])
    elif kind == "approval_required" and phase == "awaiting_model":
        approval = event.get("approval")
        required = {"approval_id", "action_digest", "operation_key", "expires_at"}
        if (type(approval) is not dict or set(approval) != required
                or any(type(value) is not str or not value.strip() for value in approval.values())):
            raise ValueError("invalid approval reference")
        updated.update(status="waiting_approval", phase="waiting_approval", pending_approval=approval)
    elif kind in {"failed", "cancelled"}:
        updated.update(status=kind, phase="ended")
    else:
        raise ValueError("invalid event order")
    updated["sequence"] += 1
    return updated


def save_event(connection: sqlite3.Connection, tenant_id: str, run_id: str,
               expected_sequence: int, event: dict, inject_failure: bool = False) -> dict:
    """在同一事务中提交事件和快照，并拒绝基于旧状态的写入。

    Args:
        connection: 自动提交连接，不允许嵌套事务。
        tenant_id: 可信请求租户。
        run_id: 当前租户内的任务 ID。
        expected_sequence: 调用方读取到的非负整数序号，不接受布尔值。
        event: 要提交的已观察事件，不触发外部动作。
        inject_failure: 测试开关，在写事件后、写快照前抛出异常。

    Returns:
        已提交新快照；失败回滚事件和快照，原样传播异常。
    """
    if type(expected_sequence) is not int or expected_sequence < 0:
        raise ValueError("invalid expected sequence")
    connection.execute("BEGIN IMMEDIATE")
    try:
        state = load_run(connection, tenant_id, run_id)
        if state["sequence"] != expected_sequence:
            raise RuntimeError("revision_conflict")
        updated = apply_event(state, event)
        connection.execute("INSERT INTO events VALUES (?,?,?,?)",
                           (tenant_id, run_id, updated["sequence"], json.dumps(event)))
        if inject_failure:
            raise RuntimeError("injected before snapshot")
        connection.execute("UPDATE runs SET sequence=?, snapshot=? WHERE tenant_id=? AND run_id=?",
                           (updated["sequence"], json.dumps(updated), tenant_id, run_id))
        connection.commit()
        return updated
    except BaseException:
        connection.rollback()
        raise


def run_tests() -> None:
    """验证十二项初始、提交、恢复、拒绝、回滚及等待状态行为。

    Returns:
        无返回值；失败抛出断言错误，通过输出实测状态。
    """
    with TemporaryDirectory(prefix="task-checkpoints-") as directory:
        path = Path(directory) / "runs.sqlite"
        connection = open_store(path)
        tenant, run_id = "store-a", "CASE-1042-run-01"
        try:
            initial = create_run(connection, tenant, run_id)
            assert initial["sequence"] == initial["step"] == 0 and initial["phase"] == "ready"
            save_event(connection, tenant, run_id, 0, {"type": "model_requested"})
            planned = save_event(connection, tenant, run_id, 1,
                                 {"type": "tool_called", "tool": "get_order_status",
                                  "call_id": "call_1", "order_id": "ORD-2048"})
            assert planned["pending_call"]["call_id"] == "call_1" and planned["step"] == 1
            connection.close()
            connection = open_store(path)
            assert load_run(connection, tenant, run_id) == planned
            result = {"order_id": "ORD-2048", "status": "in_transit", "source": "order-memory"}
            failures = [
                (0, {"type": "tool_returned", "call_id": "call_1", "result": result}, False,
                 RuntimeError, "revision_conflict"),
                (2, {"type": "tool_returned", "call_id": "other_call", "result": result}, False,
                 ValueError, "unverified tool result"),
                (2, {"type": "tool_returned", "call_id": "call_1", "result": result}, True,
                 RuntimeError, "injected before snapshot"),
            ]
            for sequence, event, injected, error_type, reason in failures:
                try:
                    save_event(connection, tenant, run_id, sequence, event, injected)
                except error_type as error:
                    assert str(error) == reason
                else:
                    raise AssertionError("invalid commit accepted")
                assert load_run(connection, tenant, run_id) == planned
                assert connection.execute("SELECT COUNT(*) FROM events").fetchone()[0] == 2
            returned = save_event(connection, tenant, run_id, 2,
                                  {"type": "tool_returned", "call_id": "call_1", "result": result})
            assert returned["pending_call"] is None and returned["evidence"] == result
            save_event(connection, tenant, run_id, 3, {"type": "model_requested"})
            final = save_event(connection, tenant, run_id, 4,
                               {"type": "answer_returned", "answer": {"order_id": "ORD-2048", "status": "in_transit"}})
            assert final["status"] == "completed" and final["step"] == 2 and final["sequence"] == 5
            try:
                save_event(connection, tenant, run_id, 5, {"type": "model_requested"})
            except ValueError as error:
                assert str(error) == "terminal run"
            else:
                raise AssertionError("terminal run continued")
            try:
                load_run(connection, "store-b", run_id)
            except LookupError as error:
                assert str(error) == "run_missing"
            else:
                raise AssertionError("cross-tenant run loaded")
            create_run(connection, tenant, "waiting-run")
            save_event(connection, tenant, "waiting-run", 0, {"type": "model_requested"})
            reference = {"approval_id": "AP-1042", "action_digest": "demo-action-digest",
                         "operation_key": "CASE-1042-proposal-01", "expires_at": "2026-09-29T10:01:00Z"}
            waiting = save_event(connection, tenant, "waiting-run", 1,
                                 {"type": "approval_required", "approval": reference})
            connection.close()
            connection = open_store(path)
            restored = load_run(connection, tenant, "waiting-run")
            assert restored == waiting and restored["status"] == "waiting_approval"
            cancelled = save_event(connection, tenant, "waiting-run", 2, {"type": "cancelled"})
            assert cancelled["status"] == "cancelled" and cancelled["pending_approval"] == reference
            create_run(connection, tenant, "version-run")
            incompatible = load_run(connection, tenant, "version-run")
            incompatible["schema_version"] = 2
            connection.execute("UPDATE runs SET snapshot=? WHERE tenant_id=? AND run_id=?",
                               (json.dumps(incompatible), tenant, "version-run"))
            try:
                load_run(connection, tenant, "version-run")
            except ValueError as error:
                assert str(error) == "unsupported snapshot version"
            else:
                raise AssertionError("incompatible version loaded")
            print("checkpoint_tests=passed cases=12")
            print("completed_sequence=5 model_steps=2 waiting_state=restored")
        finally:
            connection.close()


if __name__ == "__main__":
    run_tests()
```

:::

### 3. 执行与结果

运行当前文件：

```powershell
python task_checkpoints.py
```

通过时输出：

```text
checkpoint_tests=passed cases=12
completed_sequence=5 model_steps=2 waiting_state=restored
```

十二项检查覆盖初始状态、调用提交、关闭后恢复、陈旧写入、错配结果、事务回滚、成功工具结果、最终验收、终态拒绝、租户隔离、人工等待与取消，以及不兼容版本拒绝。其中等待与取消作为同一生命周期用例检查。

成功任务提交五条事件，发出两次模拟模型请求。故障注入后事件仍只有两条，快照保持原调用等待状态；等待任务重启后保留原确认引用，没有执行提议。

## 四、恢复读取与排查

恢复按以下顺序进行，不能先启动工具再读取任务状态：

1. 从可信请求确定租户和任务身份，读取已提交快照。
2. 核对结构与策略版本；不兼容时进入明确迁移或人工处理流程。
3. 重新获取当前权限、确认状态及必要业务事实。
4. 根据阶段选择继续模型调用、等待确认、回查未决动作或返回终态。
5. 提交后续事件时携带实际读取的序号，冲突时重新读取并判断。

| 现象 | 原因与证据 | 处理 |
|------|------------|------|
| 重启后重复执行 | 把事件日志当作动作清单重放 | 先读当前阶段，按业务操作键核对已执行动作 |
| 状态被旧请求覆盖 | 没有检查预期序号 | 保留现有提交，重新读取后决定是否继续 |
| 日志前进但快照不变 | 两项没有原子提交 | 回滚不完整写入，恢复同事务边界 |
| 错工具结果完成任务 | 未关联 `call_id` 或未验收证据 | 拒绝错配结果，保留未决调用 |
| 确认等待被自动批准 | 把保存的引用当作有效决定 | 查询可信确认记录，重新判断当前状态 |
| 老版本快照无法读取 | 状态字段或策略已经改变 | 使用显式迁移并验证，不能默认补字段后执行 |

本程序证明单数据库内的事件与快照提交、陈旧写入拒绝和确定性恢复。它没有实现多实例调度租约、外部动作原子提交、真实认证或模型协议持久化；这些能力需要相应执行与恢复策略。

## 五、参考资料

- [Python sqlite3](https://docs.python.org/3.12/library/sqlite3.html)：显式事务与连接生命周期。
- [SQLite 事务](https://www.sqlite.org/lang_transaction.html)：写事务、提交与回滚。
- [控制循环](../01-agent-model/02-control-loop.md)：模型请求、工具反馈及任务终止。
- [工具权限与人工确认](../03-permissions-isolation/01-tool-permissions-human-approval.md)：当前授权与具体确认绑定。
- [幂等与结果核对](../02-tool-execution/03-idempotency-result-verification.md)：未决动作的业务操作键及回查。
