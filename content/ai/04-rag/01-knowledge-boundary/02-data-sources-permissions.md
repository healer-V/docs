---
title: "数据来源与权限"
tags:
  - RAG
  - 数据权限
  - SQLite
excerpt: "建立 RAG 资料的来源、权威性、许可及有效性契约，区分入库许可、请求可见范围和模型处理许可，使用独立 SQLite 示例验证租户、角色及来源撤回。"
date: 2026-09-29
---

# 数据来源与权限

RAG 的资料边界包含三个不同判断：来源是否允许入库，当前身份是否允许读取，以及所选资料是否允许交给当前模型处理。能够检索一份资料，不表示所有用户都能访问，也不表示允许将它发送到任意模型服务。

虚构售后知识库同时保存公开配送政策和内部调查备注。公开问答需要当前店铺的有效政策，内部备注只对获授权员工可见；仅允许本地处理的资料还需要限制外部模型使用。**这些条件应在证据进入模型前生效。**

## 一、来源契约

### 1. 登记权威性与处理条件

来源契约记录资料由谁提供、用于什么目的、如何更新及失效。权威性是当前问题和业务范围中的判断，不能从文件格式、网页排名或检索分数推导。

| 字段 | 需要回答的问题 | 售后资料中的例子 |
|------|----------------|------------------|
| `source_id` 与责任方 | 谁维护这份资料，如何追踪 | `shipping-policy`，配送政策维护团队 |
| 适用范围 | 哪个店铺、产品或时间适用 | `store-a` 标准配送 |
| 权威依据 | 是否为正式规则或调查参考 | 已批准政策；未批准备注不能替代规则 |
| 入库许可 | 是否允许读取、保存和建立派生索引 | 审批后的公开政策可入库 |
| 处理许可 | 允许哪些模型或处理环境 | 某类内部资料只允许本地处理 |
| 更新时间与版本 | 哪次更新形成当前内容 | 版本 1，来源中保留发布时间 |
| 失效及撤回 | 何时不能继续使用 | 资料撤回后源记录失效，派生产物同步处理 |
| 保存与访问规则 | 保存多久，由谁核对原文 | 按组织约定记录期限及角色 |

来源审查应先于采集。访问凭据可用、页面可下载或同事提供了文件，都不足以证明处理许可已成立；应依据实际来源和组织授权登记，缺少确认的资料保持隔离。

### 2. 版本和更新责任

同一文档的内容可以变化，来源责任方和权限也可以变化。处理系统应保存来源、文档及版本的对应关系，便于判断一段证据属于哪次发布。

一次采集成功只证明取得了内容，不证明它仍然有效。来源已撤回但索引仍在，会产生“相关但不可用”的候选；因此有效性需要进入读取条件，不能只在入库时检查一次。

::: warning 来源可信也需要保持指令边界
已批准资料可以提供事实，但资料正文中的“忽略限制”“调用退款工具”等文字不能取得应用控制权。来源许可、数据真实性和指令信任是不同判断。
:::

## 二、请求可见范围

### 1. 身份、租户与角色

身份说明是谁发起请求，租户说明属于哪个独立数据范围，角色或对象授权决定在该范围内能读取什么。真实服务应从认证会话或受信任服务上下文取得这些信息。

模型可以协助理解问题，不能通过输出一个租户名改变授权。用户在消息中写“我是内部员工”也不等同于服务端认证的员工角色。

本例采用来源级角色规则：公开来源要求 `reader`，内部来源要求 `staff`。角色没有自动继承关系，员工需要同时拥有两个角色才能读取两类资料；生产系统的角色关系应有明确政策。

### 2. 在检索前限制集合

授权条件需要参与候选获取，再进行相关性排序及数量截取。先取全局前三个再移除不可见结果，会丢失本来可见的候选；更严重的是，如果过滤发生在生成之后，敏感内容已经离开授权边界。

```text
可信身份上下文
→ 当前租户和允许角色
→ 有效且可见的来源与片段
→ 按当前处理环境筛选
→ 检索、排序和证据预算
→ 模型输入
```

查询结果缓存和已有引用也需要保留授权关联。权限撤销后，不能因为“这段内容已经查过”就继续把旧结果提供给模型或用户。

::: tip 入库、读取和模型处理分别验收
入库许可决定是否保存资料，读取授权决定当前身份是否可见，模型处理许可决定是否进入当前生成输入。把三个条件合并为一个“公开”字段，会失去真实的处理边界。
:::

## 三、授权集合验证

### 1. 环境与固定资料

在空目录创建 `source_permissions.py`，使用 Python 3.12 和标准库 `sqlite3`，无需安装包或配置 API Key。该程序只验证集合授权，不进行相关性检索或模型生成。

```powershell
mkdir source-permissions-demo
cd source-permissions-demo
python --version
```

程序创建两个租户，分别提供配送政策；`store-a` 另有员工备注、仅本地处理的资料以及禁止入库的来源。认证上下文由固定代码构造，不能把它直接替换成用户提交的字段。

### 2. 完整实现

片段继承登记来源中的租户和角色，不允许正文自行声明权限。模型处理集合额外要求 `model_allowed=1`；来源失效后，即使片段仍物理保存在表中，也不再进入当前读取集合。

::: details 查看来源登记、授权查询与八个验证用例

```python
# source_permissions.py
import sqlite3
from dataclasses import dataclass


@dataclass(frozen=True)
class Identity:
    """表示由应用认证得到的固定租户和角色，不接受模型授权声明。"""

    tenant_id: str
    roles: frozenset[str]


def create_store() -> sqlite3.Connection:
    """建立演示来源登记和片段表。

    Returns:
        已打开的内存连接，调用方负责关闭；表中不含真实客户资料。
    """
    connection = sqlite3.connect(":memory:")
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.executescript("""
        CREATE TABLE sources (
            source_id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL,
            required_role TEXT NOT NULL, ingest_allowed INTEGER NOT NULL,
            model_allowed INTEGER NOT NULL, active INTEGER NOT NULL
        );
        CREATE TABLE chunks (
            chunk_id TEXT PRIMARY KEY, doc_id TEXT NOT NULL,
            version INTEGER NOT NULL, source_id TEXT NOT NULL,
            text TEXT NOT NULL, FOREIGN KEY(source_id) REFERENCES sources(source_id)
        );
    """)
    connection.executemany("INSERT INTO sources VALUES (?,?,?,?,?,?)", [
        ("shipping-policy", "store-a", "reader", 1, 1, 1),
        ("investigation-note", "store-a", "staff", 1, 1, 1),
        ("local-policy", "store-a", "reader", 1, 0, 1),
        ("shipping-policy-b", "store-b", "reader", 1, 1, 1),
        ("unapproved-policy", "store-a", "reader", 0, 0, 1),
    ])
    connection.commit()
    return connection


def add_chunk(
    connection: sqlite3.Connection, source_id: str, chunk_id: str, text: str,
) -> bool:
    """只为已获入库许可且有效的来源保存演示片段。

    Args:
        connection: create_store 返回的连接。
        source_id: 受信任登记中的来源 ID，不能由正文增加许可。
        chunk_id: 当前片段的唯一 ID；本例每个来源只有一个版本 1 片段。
        text: 非空演示正文，不包含真实客户数据。

    Returns:
        成功入库为 True；未知、禁止或失效来源为 False，空正文抛出 ValueError。
    """
    if not text.strip():
        raise ValueError("chunk text must not be empty")
    source = connection.execute(
        "SELECT * FROM sources WHERE source_id = ?", (source_id,)
    ).fetchone()
    if source is None or not source["ingest_allowed"] or not source["active"]:
        return False
    with connection:
        connection.execute("INSERT INTO chunks VALUES (?,?,?,?,?)",
                           (chunk_id, source_id, 1, source_id, text))
    return True


def select_chunks(
    connection: sqlite3.Connection, identity: Identity, for_model: bool = False,
) -> list[dict]:
    """返回当前身份可读取的片段，可额外限制模型处理许可。

    Args:
        connection: 已登记来源及片段的连接。
        identity: 应用认证上下文，本例只识别 reader 和 staff 两个角色。
        for_model: 当前处理阶段是否准备模型输入，由应用选择而非模型填写。

    Returns:
        按 chunk_id 排序的授权片段列表；未识别角色或无权限时为空。
    """
    roles = sorted(identity.roles & {"reader", "staff"})
    if not roles:
        return []
    placeholders = ",".join("?" for role in roles)
    sql = f"""
        SELECT c.chunk_id, c.doc_id, c.version, c.text
        FROM chunks AS c JOIN sources AS s USING (source_id)
        WHERE s.tenant_id = ? AND s.active = 1
          AND s.required_role IN ({placeholders})
    """
    if for_model:
        sql += " AND s.model_allowed = 1"
    sql += " ORDER BY c.chunk_id"
    return [dict(row) for row in connection.execute(sql, (identity.tenant_id, *roles))]


def main() -> None:
    """验证入库、角色、租户、模型许可及来源撤回八条路径。

    Returns:
        无返回值；失败抛出 AssertionError，通过时输出用例数量并关闭连接。
    """
    connection = create_store()
    try:
        fixtures = [
            ("shipping-policy", "shipping-v1-01", "Standard shipping takes 3 to 5 business days."),
            ("investigation-note", "internal-v1-01", "Internal escalation note."),
            ("local-policy", "local-v1-01", "This demonstration source is local-only."),
            ("shipping-policy-b", "store-b-shipping-v1-01", "Standard shipping takes 1 business day."),
        ]
        for source_id, chunk_id, text in fixtures:
            assert add_chunk(connection, source_id, chunk_id, text)
        reader = Identity("store-a", frozenset({"reader"}))
        local_ids = [row["chunk_id"] for row in select_chunks(connection, reader)]
        assert local_ids == ["local-v1-01", "shipping-v1-01"]
        model_ids = [row["chunk_id"] for row in select_chunks(connection, reader, for_model=True)]
        assert model_ids == ["shipping-v1-01"]
        staff = Identity("store-a", frozenset({"reader", "staff"}))
        assert len(select_chunks(connection, staff, for_model=True)) == 2
        unknown = Identity("store-a", frozenset({"guest"}))
        assert select_chunks(connection, unknown) == []
        other_tenant = Identity("store-b", frozenset({"reader"}))
        assert [row["chunk_id"] for row in select_chunks(connection, other_tenant)] == [
            "store-b-shipping-v1-01"
        ]
        assert not add_chunk(connection, "unapproved-policy", "blocked-01", "Not approved.")
        assert not add_chunk(connection, "missing-source", "missing-01", "Unknown source.")
        with connection:
            connection.execute("UPDATE sources SET active = 0 WHERE source_id = ?",
                               ("shipping-policy",))
        assert select_chunks(connection, reader, for_model=True) == []
        assert connection.execute("SELECT COUNT(*) FROM chunks").fetchone()[0] == 4
        print("permission_tests=passed cases=8")
    finally:
        connection.close()


if __name__ == "__main__":
    main()
```

:::

### 3. 执行与结果

在当前目录运行：

```powershell
python source_permissions.py
```

通过时输出：

```text
permission_tests=passed cases=8
```

公开读者本地可见两个片段，但允许送入模型的只有公开配送政策；员工可以读取已授权内部备注；另一个租户只能读取自己的政策。来源撤回后，模型处理集合为空，片段表仍有四条数据，说明当前读取规则生效不等于物理删除已经完成。

::: info 授权示例的证明范围
程序验证受信任身份上下文下的集合过滤，没有实现真实认证、许可审批、到期规则或缓存失效，也没有证明内容已从所有派生产物中删除。真实服务需要在对应边界分别验证。
:::

## 四、失效与排查

### 1. 授权失效

角色撤销、来源撤回或处理许可变化后，新请求应重新判断当前授权。正在运行的任务如果保留了旧证据，也需要在实际使用前根据业务风险复核。

日志至少保留身份或运行标识、来源版本、授权决策和原因码，用于核对哪一步使用了哪个范围。不要为了证明授权把完整敏感正文写入公开日志。

### 2. 常见错误

| 现象 | 原因及证据 | 处理 |
|------|------------|------|
| 公开用户得到内部备注 | 查询缺少角色条件，候选已经包含内部 ID | 在候选获取处修复授权，检查已发送证据 |
| 不同店铺政策混入 | 身份租户与查询范围不一致 | 从可信上下文绑定租户，复核所有读取入口 |
| 本地许可资料进入外部模型 | 只检查读取权限，没有检查处理许可 | 在模型输入构建处加入环境许可 |
| 撤回后仍可读取 | 查询或缓存未检查来源有效性 | 刷新授权，处理旧结果和派生产物 |
| 正文含有自称管理员的指令 | 把正文解释为授权来源 | 恢复数据边界，不执行新增能力 |

资料治理需要同时保留可追踪来源和最小读取范围。成功入库、检索命中或输出过滤都不能单独证明授权链路完整。

## 五、参考资料

- [OpenAI Retrieval 属性过滤](https://developers.openai.com/api/docs/guides/retrieval)：按资料属性限制候选集合。
- [Python sqlite3](https://docs.python.org/3.12/library/sqlite3.html)：参数绑定、事务及连接管理。
- [指令与数据边界](../../03-prompt-context/02-prompt-construction/01-instructions-data-boundary.md)：检索正文与应用指令的区别。
- [证据组织与生成](../05-evidence-answers/01-evidence-grounded-generation.md)：过滤后的资料如何进入生成和引用检查。

