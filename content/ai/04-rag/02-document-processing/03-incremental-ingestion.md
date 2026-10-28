---
title: "增量采集"
tags:
  - RAG
  - 增量采集
  - SQLite
excerpt: "使用有序变更流、内容哈希和持久游标识别资料变化，以独立 SQLite 示例验证重复读取、版本更新、删除标记、事务回滚、响应丢失及恢复，避免漏处理和重复片段。"
date: 2026-09-29
---

# 增量采集

增量采集只处理来源中新增、修改或删除的资料，并保存已经可靠处理到哪个位置。它需要同时解决变化识别和失败恢复：既不能重复发布同一内容，也不能在处理失败后跳过尚未完成的事件。

售后政策变更流中可能出现同一正文的重复通知、配送时效更新及联系方式撤回。应用应区分“读到变化”“保存资料”和“发布到检索索引”三个状态；当前示例验证采集存储与游标，不实现索引发布。

## 一、变化与游标

### 1. 有序变更流

变更流按来源约定提供事件。本例中每个事件具有递增序号、文档 ID、操作类型和正文；序号从 1 开始且连续，已发布事件内容不可变。真实连接器的游标可能是页标记、日志位置或时间窗口，必须按提供方语义处理。

| 概念 | 本例表示 | 约束 |
|------|----------|------|
| 事件位置 | `sequence` | 当前流中的连续正整数，不当作通用来源规则 |
| 处理游标 | `checkpoint` | 已原子提交的最后事件位置 |
| 正文变化 | 处理摘要 | 正文或处理器版本变化才重新处理 |
| 删除 | `delete` 事件 | 显式失效，不把列表中暂未出现当作删除 |

游标不是“最近看过的序号”。只有对应资料与状态可靠提交后才能推进，否则程序重启会从错误位置继续，永久漏掉失败事件。

### 2. 内容哈希与版本

内容哈希用于识别正文是否变化，处理摘要还应包含影响结果的解析或切分规则版本。同正文的重复通知可以推进事件游标而不增加文档版本。

正文改变时创建新版本并失效旧片段。来源权限改变即使没有正文变化，也需要更新当前授权；不能只比较正文摘要就认定所有元数据和处理条件都相同。

::: tip 摘要相同与事件相同分别判断
相同事件重放依赖游标和来源不可变约定；不同事件却有相同处理摘要时，可以不重新生成片段。两种判断不能用一个“重复”标记代替。
:::

## 二、提交与恢复

### 1. 原子处理边界

本例把文档、片段有效性和游标放在同一 SQLite 事务内：

```text
读取下一事件 → 校验事件字段与正文 → 开始写事务
  → 核对当前游标与序号 → 保存资料或删除标记 → 保存片段有效性 → 推进游标 → 提交
失败 → 回滚资料与游标 → 使用原事件重试
```

事件按当前流顺序处理。在取得写事务后读取当前游标，再判断重放或缺口，使判断与状态写入属于同一个事务边界。序号小于等于游标表示已提交重放；序号大于期望的下一项时明确失败，不用排序或跳跃掩盖缺失事件。

### 2. 响应丢失

提交成功后，调用方可能没有收到确认。重试同一事件时，已保存游标会识别重放，避免重复版本和片段。

这条保证依赖本例的同数据库事务及来源序号契约。如果正文存储、向量索引和外部确认分别提交，应定义可恢复的发布状态，例如先保存待索引记录，再重试索引并核对版本；不能把本例事务扩展成跨系统保证。

### 3. 删除与恢复

删除标记也称 tombstone，即记录“这个逻辑资料已删除”的状态。本例将文档和所有历史片段设为失效，保留记录用于验证重放和恢复。

失效后的同正文重新出现仍创建新版本，因为有效性状态发生了变化。物理删除、缓存失效和派生产物撤回属于另一组维护动作；当前状态过滤不证明所有副本已删除。

## 三、独立采集存储

### 1. 环境与数据

使用 Python 3.12 标准库，在空目录创建 `ingest_policies.py`：

```powershell
mkdir policy-ingestion-demo
cd policy-ingestion-demo
python --version
```

固定变更流只包含 `store-a` 的配送政策和售后联系方式。正文已规范化，以空行划分简单段落；示例不连接真实来源、不抓取网页，也不复用其他文章程序。

::: info 流语义是本例的前提
事件序号连续、内容不可变，来源范围由应用固定。真实接口若只提供更新时间，需处理时间相同、迟到事件及分页快照；不能照搬 `sequence=checkpoint+1` 作为通用连接器规则。
:::

### 2. 完整实现

数据库保存不可变版本的片段和当前文档状态，只有有效文档的有效片段进入查询。测试在写资料之后、写游标之前注入错误，验证整个处理事务回滚。

::: details 查看增量处理、持久游标和十个验证用例

```python
# ingest_policies.py
import hashlib
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from tempfile import TemporaryDirectory


@dataclass(frozen=True)
class Change:
    """表示固定来源中一个不可变且有序的资料变更。"""

    sequence: int
    doc_id: str
    operation: str
    text: str | None = None


def open_store(path: Path) -> sqlite3.Connection:
    """打开持久采集存储并初始化本例的固定流。

    Args:
        path: 测试临时目录中的 SQLite 文件，不使用生产资料。

    Returns:
        自动提交连接，写操作自行开启事务，调用方负责关闭。
    """
    connection = sqlite3.connect(path, isolation_level=None)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.executescript("""
        CREATE TABLE IF NOT EXISTS checkpoints (
            feed_id TEXT PRIMARY KEY, sequence INTEGER NOT NULL
        );
        INSERT OR IGNORE INTO checkpoints VALUES ('support-policies', 0);
        CREATE TABLE IF NOT EXISTS documents (
            tenant_id TEXT NOT NULL, doc_id TEXT NOT NULL, version INTEGER NOT NULL,
            processing_hash TEXT, active INTEGER NOT NULL, last_sequence INTEGER NOT NULL,
            PRIMARY KEY(tenant_id, doc_id)
        );
        CREATE TABLE IF NOT EXISTS chunks (
            tenant_id TEXT NOT NULL, doc_id TEXT NOT NULL, version INTEGER NOT NULL,
            chunk_id TEXT NOT NULL, text TEXT NOT NULL, active INTEGER NOT NULL,
            PRIMARY KEY(tenant_id, chunk_id),
            FOREIGN KEY(tenant_id, doc_id) REFERENCES documents(tenant_id, doc_id)
        );
    """)
    return connection


def checkpoint(connection: sqlite3.Connection) -> int:
    """读取当前流已经可靠提交的位置。

    Args:
        connection: 已初始化的采集存储连接。

    Returns:
        连续事件的最后提交序号，尚未处理时为 0。
    """
    return connection.execute("SELECT sequence FROM checkpoints WHERE feed_id = ?",
                              ("support-policies",)).fetchone()[0]


def apply_change(connection: sqlite3.Connection, change: Change, inject_failure: bool = False) -> str:
    """原子提交单个事件的资料状态和游标，识别重放及相同正文。

    Args:
        connection: 自动提交连接，不允许嵌套其他事务。
        change: 连续正整数序号，仅允许固定资料的 upsert/delete 事件。
        inject_failure: 应用测试开关，在写资料之后、写游标之前抛出异常。

    Returns:
        replayed、unchanged、updated 或 deleted；失败回滚并抛出异常。
    """
    if (type(change.sequence) is not int or change.sequence < 1
            or change.doc_id not in {"shipping-policy", "support-contact"}
            or change.operation not in {"upsert", "delete"}):
        raise ValueError("invalid source event")
    if change.operation == "upsert" and (type(change.text) is not str or not change.text.strip()):
        raise ValueError("empty source content")
    if change.operation == "delete" and change.text is not None:
        raise ValueError("delete event must not contain content")
    connection.execute("BEGIN IMMEDIATE")
    try:
        position = checkpoint(connection)
        if change.sequence <= position:
            connection.commit()
            return "replayed"
        if change.sequence != position + 1:
            raise ValueError("source event gap")
        document = connection.execute("SELECT * FROM documents WHERE tenant_id = ? AND doc_id = ?",
                                      ("store-a", change.doc_id)).fetchone()
        if change.operation == "delete":
            if document is None:
                connection.execute("INSERT INTO documents VALUES (?,?,?,?,?,?)",
                                   ("store-a", change.doc_id, 0, None, 0, change.sequence))
            else:
                connection.execute("UPDATE documents SET active = 0, last_sequence = ? "
                                   "WHERE tenant_id = ? AND doc_id = ?",
                                   (change.sequence, "store-a", change.doc_id))
            connection.execute("UPDATE chunks SET active = 0 WHERE tenant_id = ? AND doc_id = ?",
                               ("store-a", change.doc_id))
            result = "deleted"
        else:
            digest = hashlib.sha256(("paragraphs-v1\n" + change.text).encode("utf-8")).hexdigest()
            if document is not None and document["active"] and document["processing_hash"] == digest:
                connection.execute("UPDATE documents SET last_sequence = ? WHERE tenant_id = ? AND doc_id = ?",
                                   (change.sequence, "store-a", change.doc_id))
                result = "unchanged"
            else:
                version = document["version"] + 1 if document is not None else 1
                connection.execute("""
                    INSERT INTO documents VALUES (?,?,?,?,?,?)
                    ON CONFLICT(tenant_id, doc_id) DO UPDATE SET
                    version=excluded.version, processing_hash=excluded.processing_hash,
                    active=excluded.active, last_sequence=excluded.last_sequence
                """, ("store-a", change.doc_id, version, digest, 1, change.sequence))
                connection.execute("UPDATE chunks SET active = 0 WHERE tenant_id = ? AND doc_id = ?",
                                   ("store-a", change.doc_id))
                paragraphs = [part.strip() for part in change.text.split("\n\n") if part.strip()]
                for index, text in enumerate(paragraphs, start=1):
                    chunk_id = f"{change.doc_id}:v{version}:{index:02d}"
                    connection.execute("INSERT INTO chunks VALUES (?,?,?,?,?,?)",
                                       ("store-a", change.doc_id, version, chunk_id, text, 1))
                result = "updated"
        if inject_failure:
            raise RuntimeError("injected before checkpoint")
        connection.execute("UPDATE checkpoints SET sequence = ? WHERE feed_id = ?",
                           (change.sequence, "support-policies"))
        connection.commit()
        return result
    except BaseException:
        connection.rollback()
        raise


def active_chunks(connection: sqlite3.Connection) -> list[dict]:
    """读取当前有效文档版本的有效片段，不返回删除或历史版本。

    Args:
        connection: 已完成采集提交的存储连接。

    Returns:
        固定租户中按片段 ID 排序的当前集合；不实现真实身份授权或索引检索。
    """
    return [dict(row) for row in connection.execute("""
        SELECT c.* FROM chunks AS c JOIN documents AS d
        ON c.tenant_id = d.tenant_id AND c.doc_id = d.doc_id AND c.version = d.version
        WHERE c.tenant_id = ? AND c.active = 1 AND d.active = 1 ORDER BY c.chunk_id
    """, ("store-a",))]


def run_tests() -> None:
    """验证十条增量处理、失败恢复及删除路径。

    Returns:
        无返回值；失败抛出断言错误，通过输出当前游标、版本与片段数量。
    """
    with TemporaryDirectory(prefix="policy-ingestion-") as directory:
        path = Path(directory) / "policies.sqlite"
        connection = open_store(path)
        try:
            shipping = "Standard shipping takes 3 to 5 business days after dispatch."
            contact = "Contact support through the store help form."
            first = Change(1, "shipping-policy", "upsert", shipping)
            second = Change(2, "support-contact", "upsert", contact)
            assert apply_change(connection, first) == apply_change(connection, second) == "updated"
            assert checkpoint(connection) == 2 and len(active_chunks(connection)) == 2
            connection.close()
            connection = open_store(path)
            assert checkpoint(connection) == 2 and len(active_chunks(connection)) == 2
            assert apply_change(connection, first) == "replayed"
            assert checkpoint(connection) == 2
            assert apply_change(connection, Change(3, "shipping-policy", "upsert", shipping)) == "unchanged"
            assert connection.execute("SELECT COUNT(*) FROM chunks").fetchone()[0] == 2
            changed = "Standard shipping takes 5 to 7 business days.\n\nCampaign rules apply to campaign orders."
            assert apply_change(connection, Change(4, "shipping-policy", "upsert", changed)) == "updated"
            assert {row["version"] for row in active_chunks(connection) if row["doc_id"] == "shipping-policy"} == {2}
            assert len(active_chunks(connection)) == 3
            assert apply_change(connection, Change(5, "support-contact", "delete")) == "deleted"
            assert all(row["doc_id"] != "support-contact" for row in active_chunks(connection))

            next_change = Change(6, "shipping-policy", "upsert", "Standard shipping takes 7 to 9 business days.")
            try:
                apply_change(connection, next_change, inject_failure=True)
                raise AssertionError("fault injection did not fail")
            except RuntimeError as error:
                assert str(error) == "injected before checkpoint"
            assert checkpoint(connection) == 5
            assert {row["version"] for row in active_chunks(connection)} == {2}
            assert connection.execute("SELECT COUNT(*) FROM chunks").fetchone()[0] == 4
            assert apply_change(connection, next_change) == "updated"
            assert checkpoint(connection) == 6

            lost = Change(8, "shipping-policy", "upsert", next_change.text)
            try:
                apply_change(connection, lost)
                raise AssertionError("event gap accepted")
            except ValueError as error:
                assert str(error) == "source event gap"
            assert checkpoint(connection) == 6
            assert apply_change(connection, Change(7, "support-contact", "upsert", contact)) == "updated"
            restored = [row for row in active_chunks(connection) if row["doc_id"] == "support-contact"]
            assert len(restored) == 1 and restored[0]["version"] == 2
            apply_change(connection, lost)
            assert apply_change(connection, lost) == "replayed" and checkpoint(connection) == 8
            assert connection.execute("SELECT COUNT(*) FROM chunks").fetchone()[0] == 6
            assert len(active_chunks(connection)) == 2
            version = next(row["version"] for row in active_chunks(connection) if row["doc_id"] == "shipping-policy")
            print("ingestion_tests=passed cases=10")
            print(f"cursor={checkpoint(connection)} active_chunks=2 shipping_version={version}")
        finally:
            connection.close()


if __name__ == "__main__":
    run_tests()
```

:::

### 3. 执行与结果

运行当前程序：

```powershell
python ingest_policies.py
```

通过时输出：

```text
ingestion_tests=passed cases=10
cursor=8 active_chunks=2 shipping_version=3
```

十项检查包括首次采集、持久重启、已提交重放、相同正文、正文更新、删除、回滚后重试、序号缺口、资料恢复和提交后响应丢失。最终保留两条有效片段，配送政策为版本 3；历史与删除片段仍在表中，但不进入当前集合。

失败注入后游标仍为 5、配送版本仍为 2，片段总数不增加。重试原事件后才推进到 6；直接提交事件 8 会报缺口，处理事件 7 后才能继续。这些观察分别证明回滚和顺序约束生效。

## 四、排查与恢复

| 现象 | 定位证据 | 处理 |
|------|----------|------|
| 失败后资料永久缺失 | 游标已推进而资料未提交 | 恢复到可靠位置，原子提交资料与游标 |
| 每次通知都增加版本 | 正文摘要相同仍重新处理 | 比较处理摘要，同时更新必要来源元数据 |
| 删除资料继续命中 | 当前文档与片段有效性不一致 | 修复当前读取，再处理索引、缓存和派生产物 |
| 收到序号缺口 | 当前游标与事件位置不连续 | 向来源补取缺失事件，核对连接器契约 |
| 来源正文为空 | 内容校验失败，游标未推进 | 重新读取并核对来源；确为坏事件时人工处理或使用明确隔离策略 |
| 重启后重复发布 | 游标只保存在内存 | 使用持久检查点，响应丢失时核对已有提交 |

生产连接器还需要分页一致性、来源限流和可恢复的失败队列。只靠更新时间通常不能确认删除；定期全量对账应基于完整快照和来源契约，避免把暂时读取失败的资料失效。

## 五、验证边界

程序证明固定连续流与单数据库事务下的去重、版本和恢复，没有实现向量索引切换、物理撤回或真实身份授权。片段序号在本例不可变版本内保持稳定，真实切分策略及处理配置仍应持久保存。

跨存储发布时，需要分别记录资料已提交、索引待更新及索引已验证等状态。只有查询实际使用的版本与来源规则一致，才能把采集结果视为可用知识。

## 六、参考资料

- [Python sqlite3](https://docs.python.org/3.12/library/sqlite3.html)：显式事务、参数绑定和持久连接。
- [SQLite 事务](https://www.sqlite.org/lang_transaction.html)：写事务、回滚及提交边界。
- [切分与元数据](./02-chunking-metadata.md)：不可变文档版本及片段身份。
- [数据来源与权限](../01-knowledge-boundary/02-data-sources-permissions.md)：来源范围与撤回的授权判断。
