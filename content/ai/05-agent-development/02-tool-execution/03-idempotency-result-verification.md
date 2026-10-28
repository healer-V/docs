---
title: "幂等与结果核对"
tags:
  - AI Agent
  - 幂等
  - SQLite
excerpt: "以待审批退款提议说明业务操作键与模型调用 ID 的区别，使用 SQLite 原子记录验证重复提交、参数冲突、事务回滚及响应丢失，并回查来源、业务字段和结果时效。"
date: 2026-09-29
---

# 幂等与结果核对

工具幂等是对同一个逻辑动作重复提交时，业务效果保持一致的约定。结果核对则确认返回对象确实对应当前动作，并且来源、业务字段与时间满足当前任务要求。两者共同处理 Agent 重试、恢复以及工具返回不可信结果的问题。

本例为工单 `CASE-1042` 和订单 `ORD-2048` 创建一条待审批退款提议。无论模型换了调用 ID，还是提交后响应丢失，同一业务操作键都只能对应一条提议。程序不执行退款或付款。

## 一、逻辑动作与执行记录

### 1. 业务操作键

业务操作键由应用根据当前任务和动作确定，用于识别“这次提议”。重试时保留该键，主动创建另一项业务动作时才使用新键。

| 对象 | 演示值 | 约束 |
|------|--------|------|
| 租户 | `store-a` | 来自可信应用上下文 |
| 业务操作键 | `CASE-1042-proposal-01` | 同一动作恢复时保持稳定 |
| 模型调用 ID | `call_1`、`call_2` | 关联不同调用，不决定是否重复创建 |
| 契约版本 | `1` | 与输入、输出及副作用约定绑定 |
| 业务参数 | 工单、订单、1200 分、CNY | 同键换参数必须报冲突 |

用每次新生成的 UUID 作为重试键，会让业务存储无法识别重复动作。只使用工单号也不够：一个工单可能存在多个不同提议，需要明确动作范围及序号。

### 2. 参数摘要

参数摘要是规范化参数的哈希值。示例先按固定字段与键顺序序列化，再计算 SHA-256；键顺序和 JSON 空白变化不会让同一个请求变成不同动作。

摘要用于比较参数一致性，不证明权限或防止篡改。它包含契约版本、工单、订单、金额及货币；租户与业务操作键作为记录的查询范围。敏感参数的摘要也不应默认公开。

::: warning 保留时间也是幂等契约
幂等记录被删除后，迟到重试可能再次执行。生产服务必须说明键的有效期、记录保留时间及过期后的恢复规则。本例在测试数据库生命周期内保留记录，没有实现过期清理。
:::

## 二、提交与响应丢失

### 1. 单数据库原子提交

示例将提议记录和执行记录放在同一个 SQLite 数据库中，在同一个事务内提交。唯一约束限制租户内的操作键，重复调用先读取已有执行记录，再比较摘要。

```text
开始写事务 → 查询租户与操作键
  ├─ 已存在 → 比较参数摘要 → 返回原提议或冲突
  └─ 不存在 → 写提议 → 写执行记录 → 提交 → 返回结果
```

在写提议后、写执行记录前注入错误，事务会回滚，两张表都不留下半条动作。示例使用 `BEGIN IMMEDIATE` 在事务开始取得写入资格；竞争写入还可能等待或报忙，调用方应结合执行记录处理，不能把所有数据库异常都当作未执行。

### 2. 未知结果回查

数据库提交成功后，应用可能在返回响应前崩溃。此时“调用方没收到结果”和“业务动作没有发生”是不同事实。

恢复时使用原租户与原操作键回查。已有执行记录且参数摘要一致时，返回原提议；不存在记录时，也只能根据该业务系统的原子性和查询可靠性决定是否可以重做。

::: warning 本地事务不保证远程动作只执行一次
这份程序的业务副作用就是同数据库中的提议记录。若动作改成调用支付服务，本地执行记录与远程退款之间不能共享这份 SQLite 事务。需要支付方幂等键、结果查询和未知状态处理，不能宣称本例已实现跨系统“恰好一次”。
:::

## 三、结果的采信条件

### 1. 回查可信记录

工具返回 `ok=true`，或者模型说“提议已经提交”，都不足以确认业务动作。运行器应从可信执行记录定位原提议，再比较返回对象。

本例核对以下条件：

| 条件 | 检查方式 | 防止的问题 |
|------|----------|------------|
| 当前动作 | 用可信租户与操作键查询执行记录 | 接受另一个动作的结果 |
| 当前参数 | 参数摘要一致 | 同键换金额或对象 |
| 业务字段 | ID、工单、订单、金额、货币、状态一致 | 伪造或错误提议 |
| 来源与版本 | 来源固定，契约版本与持久记录一致 | 错来源、旧版本混用 |
| 时间 | 回查时间带时区，不在未来且未超过时效窗口 | 采信陈旧观察 |

来源字段必须与实际读取路径绑定。复制 `source="proposal-store"` 不会让一个手写 JSON 自动变成可信业务记录。

### 2. 创建时间与观察时间

创建时间表示动作何时提交，观察时间表示何时重新查询状态。一个昨天创建的提议可以拥有刚刚回查的观察时间；不能只因为创建时间早就判定记录无法使用。

示例采用固定带时区 UTC 时间，并把观察时效设为 30 秒。该窗口只用于展示测试边界，实际时效应根据状态变化和业务风险确定。核对失败时重新回查或暂停，不让模型自行改写时间。

## 四、独立持久化示例

### 1. 环境与约束

使用 Python 3.12 和标准库 `sqlite3`，从空目录创建程序：

```powershell
mkdir proposal-idempotency-demo
cd proposal-idempotency-demo
python --version
```

创建 `idempotent_proposals.py`。程序在系统临时目录建立 SQLite 数据库，验证完成后自动清理；不会依赖其他文章的文件。两个租户、业务对象与金额规则均为虚构夹具。

::: info 金额与授权范围
演示仅允许 CNY、正整数分，最高 10000 分；这是测试约束，不是退款政策。可信租户、操作键和对象关系由调用代码固定，未实现真实认证、审批或支付权限。
:::

### 2. 完整实现

程序通过九条用例验证重复提交、参数冲突、跨租户键、持久恢复、伪造结果、陈旧时间、未来时间、事务回滚和响应丢失回查。

::: details 查看幂等提议、业务回查和九个故障验证用例

```python
# idempotent_proposals.py
import hashlib
import json
import sqlite3
from dataclasses import dataclass, replace
from datetime import datetime, timedelta, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
from uuid import uuid4


@dataclass(frozen=True)
class ProposalRequest:
    """保存应用绑定的动作范围和已校验业务输入，不含实际退款指令。"""

    tenant_id: str
    operation_key: str
    case_id: str = "CASE-1042"
    order_id: str = "ORD-2048"
    amount_cents: int = 1200
    currency: str = "CNY"
    contract_version: int = 1


class IdempotencyConflict(Exception):
    """表示同一租户与业务操作键绑定了不同参数。"""


def open_store(database_path: Path) -> sqlite3.Connection:
    """打开持久演示数据库并初始化结构。

    Args:
        database_path: 当前测试临时目录内的数据库文件路径。

    Returns:
        启用外键和自动提交模式的连接；写操作自行开启事务，调用方负责关闭。
    """
    connection = sqlite3.connect(database_path, isolation_level=None, timeout=1)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.executescript("""
        CREATE TABLE IF NOT EXISTS proposals (
            proposal_id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL,
            operation_key TEXT NOT NULL, case_id TEXT NOT NULL, order_id TEXT NOT NULL,
            amount_cents INTEGER NOT NULL, currency TEXT NOT NULL, state TEXT NOT NULL,
            contract_version INTEGER NOT NULL, created_at TEXT NOT NULL,
            UNIQUE(tenant_id, operation_key)
        );
        CREATE TABLE IF NOT EXISTS executions (
            tenant_id TEXT NOT NULL, operation_key TEXT NOT NULL,
            request_digest TEXT NOT NULL, proposal_id TEXT NOT NULL,
            PRIMARY KEY(tenant_id, operation_key),
            FOREIGN KEY(proposal_id) REFERENCES proposals(proposal_id)
        );
    """)
    return connection


def request_digest(request: ProposalRequest) -> str:
    """验证演示参数并生成稳定摘要。

    Args:
        request: 应用绑定的租户和非空操作键，仅支持固定对象、CNY 和版本 1。

    Returns:
        规范化业务参数的 SHA-256 十六进制摘要；不合法时抛出 ValueError。
    """
    if (request.tenant_id not in {"store-a", "store-b"}
            or type(request.operation_key) is not str or not request.operation_key.strip()
            or request.case_id != "CASE-1042" or request.order_id != "ORD-2048"
            or type(request.amount_cents) is not int or not 1 <= request.amount_cents <= 10000
            or request.currency != "CNY" or type(request.contract_version) is not int
            or request.contract_version != 1):
        raise ValueError("invalid demonstration request")
    payload = {"case_id": request.case_id, "order_id": request.order_id,
               "amount_cents": request.amount_cents, "currency": request.currency,
               "contract_version": request.contract_version}
    normalized = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def read_proposal(connection: sqlite3.Connection, request: ProposalRequest, now: datetime) -> dict | None:
    """按可信动作范围回查提议，并核对原请求摘要。

    Args:
        connection: open_store 返回的连接。
        request: 当前可信租户、原操作键与原业务参数。
        now: 带时区的当前回查时间，本例由固定 UTC 时钟提供。

    Returns:
        带来源和观察时间的持久结果；无记录为 None，参数不一致抛出冲突。
    """
    if now.utcoffset() is None:
        raise ValueError("timezone required")
    digest = request_digest(request)
    row = connection.execute("""
        SELECT p.*, e.request_digest FROM executions AS e
        JOIN proposals AS p ON p.proposal_id = e.proposal_id
        WHERE e.tenant_id = ? AND e.operation_key = ?
          AND p.tenant_id = e.tenant_id AND p.operation_key = e.operation_key
    """, (request.tenant_id, request.operation_key)).fetchone()
    if row is None:
        return None
    if row["request_digest"] != digest:
        raise IdempotencyConflict("same operation key with different parameters")
    result = dict(row)
    del result["request_digest"]
    result.update(source="proposal-store", observed_at=now.isoformat())
    return result


def create_proposal(
    connection: sqlite3.Connection, request: ProposalRequest, now: datetime,
    inject_failure: bool = False,
) -> dict:
    """以单数据库事务原子创建提议和执行记录，重复提交返回原提议。

    Args:
        connection: 自动提交连接，不允许嵌套已有事务。
        request: 应用绑定的租户、操作键及业务参数。
        now: 带时区的动作时间与回查时间。
        inject_failure: 测试专用，在写提议后注入异常；模型不能设置。

    Returns:
        从持久记录回查的提议对象；失败回滚，冲突或故障向调用方抛出。
    """
    digest = request_digest(request)
    if now.utcoffset() is None:
        raise ValueError("timezone required")
    connection.execute("BEGIN IMMEDIATE")
    try:
        existing = read_proposal(connection, request, now)
        if existing is not None:
            connection.commit()
            return existing
        proposal_id = f"PR-{uuid4().hex}"
        connection.execute("INSERT INTO proposals VALUES (?,?,?,?,?,?,?,?,?,?)", (
            proposal_id, request.tenant_id, request.operation_key, request.case_id,
            request.order_id, request.amount_cents, request.currency, "pending_approval",
            request.contract_version, now.isoformat(),
        ))
        if inject_failure:
            raise RuntimeError("injected before execution record")
        connection.execute("INSERT INTO executions VALUES (?,?,?,?)", (
            request.tenant_id, request.operation_key, digest, proposal_id,
        ))
        connection.commit()
    except BaseException:
        # 取消或其他中断同样清理本地未提交事务；已提交动作仍需回查。
        connection.rollback()
        raise
    result = read_proposal(connection, request, now)
    if result is None:
        raise RuntimeError("committed proposal cannot be read")
    return result


def verify_result(
    connection: sqlite3.Connection, request: ProposalRequest, candidate: object,
    now: datetime, max_age: timedelta = timedelta(seconds=30),
) -> bool:
    """通过业务回查验证候选结果的对象、来源及观察时效。

    Args:
        connection: 可信提议存储连接。
        request: 原动作范围与业务参数，不取自候选结果。
        candidate: 待采信的工具结果，不能假定形状合法。
        now: 带时区的当前校验时间。
        max_age: 非负观察时效窗口，演示默认 30 秒。

    Returns:
        候选与持久记录一致且观察时间有效为 True，否则为 False。
    """
    if now.utcoffset() is None or max_age < timedelta(0):
        raise ValueError("invalid verification clock")
    if not isinstance(candidate, dict):
        return False
    try:
        actual = read_proposal(connection, request, now)
    except IdempotencyConflict:
        return False
    if actual is None or set(candidate) != set(actual):
        return False
    for field, value in actual.items():
        if field != "observed_at" and (type(candidate[field]) is not type(value) or candidate[field] != value):
            return False
    if type(candidate["observed_at"]) is not str:
        return False
    try:
        observed = datetime.fromisoformat(candidate["observed_at"])
        return observed.utcoffset() is not None and timedelta(0) <= now - observed <= max_age
    except ValueError:
        return False


def run_tests() -> None:
    """验证九条幂等、持久恢复与结果核对路径。

    Returns:
        无返回值；失败抛出断言错误，成功输出数量并清理临时数据库。
    """
    now = datetime(2026, 9, 29, 2, 0, tzinfo=timezone.utc)
    request = ProposalRequest("store-a", "CASE-1042-proposal-01")
    with TemporaryDirectory(prefix="proposal-idempotency-") as directory:
        database_path = Path(directory) / "proposals.sqlite"
        connection = open_store(database_path)
        try:
            first = create_proposal(connection, request, now)
            repeated = create_proposal(connection, request, now)
            assert repeated == first and verify_result(connection, request, first, now)
            assert connection.execute("SELECT COUNT(*) FROM proposals").fetchone()[0] == 1

            try:
                create_proposal(connection, replace(request, amount_cents=2400), now)
                raise AssertionError("parameter conflict was accepted")
            except IdempotencyConflict:
                pass
            other = create_proposal(connection, replace(request, tenant_id="store-b"), now)
            assert other["proposal_id"] != first["proposal_id"]

            connection.close()
            connection = open_store(database_path)
            recovered = read_proposal(connection, request, now)
            assert recovered == first

            forged = {**first, "amount_cents": 1}
            assert not verify_result(connection, request, forged, now)
            stale = {**first, "observed_at": (now - timedelta(seconds=31)).isoformat()}
            assert not verify_result(connection, request, stale, now)
            future = {**first, "observed_at": (now + timedelta(seconds=1)).isoformat()}
            assert not verify_result(connection, request, future, now)

            failed = replace(request, operation_key="CASE-1042-proposal-02")
            try:
                create_proposal(connection, failed, now, inject_failure=True)
                raise AssertionError("fault injection did not fail")
            except RuntimeError as error:
                assert str(error) == "injected before execution record"
            assert read_proposal(connection, failed, now) is None
            assert connection.execute("SELECT COUNT(*) FROM proposals").fetchone()[0] == 2
            assert connection.execute("SELECT COUNT(*) FROM executions").fetchone()[0] == 2

            # 模拟提交后响应丢失：丢弃返回值，以原键恢复查询，避免盲目新建动作。
            lost = replace(request, operation_key="CASE-1042-proposal-03")
            create_proposal(connection, lost, now)
            checked = read_proposal(connection, lost, now + timedelta(seconds=5))
            assert checked is not None and verify_result(connection, lost, checked, now + timedelta(seconds=5))
            replay = create_proposal(connection, lost, now + timedelta(seconds=5))
            assert replay["proposal_id"] == checked["proposal_id"]
            assert connection.execute("SELECT COUNT(*) FROM proposals").fetchone()[0] == 3
            print("idempotency_tests=passed cases=9")
        finally:
            connection.close()


if __name__ == "__main__":
    run_tests()
```

:::

### 3. 执行与结果

运行程序：

```powershell
python idempotent_proposals.py
```

通过时输出：

```text
idempotency_tests=passed cases=9
```

重复提交后仍只有一条提议。同键换金额产生冲突；另一个租户使用相同键时得到独立记录；连接关闭后重新打开仍能查到原提议。注入错误后两张表的记录数都不增加，提交后丢弃响应则能以原键回查并复用原提议。

示例中的提议 ID 每次首次创建时不同，用例验证的是同一动作的 ID 保持一致，不要求与某个固定文本相等。

## 五、恢复判断与适用边界

### 1. 常见失败

| 现象 | 原因及定位证据 | 处理 |
|------|----------------|------|
| 超时后生成两条提议 | 每次重试使用新操作键 | 恢复原动作键并查询已有记录 |
| 同键不同金额被接受 | 只查询键，未比较参数摘要 | 绑定参数与版本，冲突时停止 |
| 提议存在但执行记录缺失 | 两次写入分开提交 | 在可行的同存储场景使用原子事务 |
| 返回成功但金额错误 | 候选结果未与持久记录核对 | 按可信动作范围回查并比较字段 |
| 旧状态被误认为当前状态 | 没有观察时间或时效规则 | 重新查询，区分创建与观察时间 |
| SQLite 报忙后盲目重做 | 把存储异常等同于动作未执行 | 先确认执行记录，按原键恢复 |

### 2. 能够证明的范围

程序证明单数据库提议写入与执行记录可以原子提交，原键重复提交能够复用结果，候选结果能与当前回查记录核对。它还验证了回滚与提交后响应丢失两种不同恢复路径。

当前未测试多进程并发、磁盘故障、真实认证与审批，也未实现远程支付、执行记录过期或分布式事务。业务回查只证明查询时刻的状态；从核对到实际使用之间若状态发生变化，仍需业务版本、条件更新或再次核对。

::: tip 把模型答复与业务完成分开
只有可信业务结果满足当前动作的成功条件，运行器才能把动作标记为完成。模型可以组织解释，不能把 `pending_approval` 改成已退款，也不能替未知结果补造成功状态。
:::

## 六、参考资料

- [Python sqlite3](https://docs.python.org/3.12/library/sqlite3.html)：参数绑定、事务控制和连接管理。
- [SQLite 事务](https://www.sqlite.org/lang_transaction.html)：`BEGIN IMMEDIATE`、提交、回滚和写竞争。
- [工具契约](./01-tool-contracts.md)：副作用、调用 ID、业务键和版本含义。
- [执行器与错误](./02-executors-errors.md)：执行前拒绝与结果未知的区别。
