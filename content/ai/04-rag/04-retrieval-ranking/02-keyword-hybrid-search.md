---
title: "关键词与混合检索"
tags:
  - RAG
  - SQLite
  - 混合检索
excerpt: "解释倒排检索、FTS5 分词和 BM25 排名，以中文政策及产品型号比较关键词与真实向量候选，使用 RRF 融合排名并验证去重、短查询和授权边界，说明混合检索的收益判断。"
date: 2026-09-29
---

# 关键词与混合检索

关键词检索依据文字命中寻找资料，向量检索依据嵌入空间寻找相关内容。混合检索同时取得两类候选，再融合排名，使精确标识与语义表达都有机会进入证据范围。

例如，产品型号 `SHIP-2048` 需要准确命中，用户说“寄出后还要等多久”则可能没有复用政策中的“发货后三至五个工作日”。是否采用混合检索，要在相同资料、授权条件和候选预算下比较结果；增加一个检索通道本身不证明质量提高。

## 一、关键词索引与排名

### 1. 倒排索引与分词

倒排索引记录每个词或片段出现在哪些资料中，查询时从这些记录找到命中对象。分词器决定索引的单位：完整单词、词干或连续字符片段都可能成为检索单位，选择不同会改变哪些查询能够命中。

SQLite FTS5 是提供全文检索的虚拟表模块。其默认 `unicode61` 分词并不等同于中文词语切分；连续中文段落不能直接按读者理解的词边界匹配。本例采用 `trigram`，以连续三个 Unicode 字符支持子串查找，适合演示较长中文短语和型号命中。

| 输入 | 本例方式 | 边界 |
|------|----------|------|
| `SHIP-2048` | 带引号的字面短语 | 保留连字符，不把查询文本当作布尔语法 |
| `发货后` | 三字符子串 | 只能匹配该字面片段，不能自动理解“寄出后” |
| `退款` | 不进入 trigram 的全文查询 | 少于三个字符时本例交给语义通道，或由业务另设精确字段查询 |
| 多个关键词 | 各自转义后用 OR 组合 | 组合规则由应用规定，不由用户文本任意改变 |

trigram 不提供通用中文语义分词。两个字的业务词、繁简差异、领域缩写和型号字段需要根据数据选择专门策略；不能为获取结果而对全库无条件扫描或取消授权。

### 2. BM25 与分数方向

BM25 是根据词频、词的区分程度及资料长度排序的相关性方法。高频出现同一个词会增加匹配证据，但长度和词频调整避免简单地把最长、重复最多的资料永远排在前面。

FTS5 的 `bm25()` 使用适合升序排序的分数表示，**值越小，排名越靠前**。这一方向不同于本例向量余弦的“越大越靠前”，不能只把两种原始值相加后排序。具体字段权重也应按任务验证，而非认为标题总比正文重要。

以下是完整实现中的查询方式示意，`MATCH` 表达式及租户均通过参数绑定传入：

```sql
SELECT c.chunk_id, bm25(policy_fts) AS score
FROM policy_fts JOIN chunks AS c ON c.rowid = policy_fts.rowid
WHERE policy_fts MATCH ? AND c.tenant_id = ?
  AND c.visibility = 'public' AND c.active = 1
ORDER BY score ASC, c.chunk_id ASC;
```

本例再按可信资源集合筛选，之后才截取 k 条。FTS5 的统计仍基于整个演示索引；需要严格统计隔离或防范分数侧信道的系统，应独立设计租户索引及返回字段，不能仅凭结果过滤声称完成全面隔离。

## 二、排名融合

### 1. RRF 与候选去重

倒数排名融合（Reciprocal Rank Fusion，RRF）把各通道中的排名转换为贡献值，累加同一片段的贡献。它只使用排序位置，避免直接比较不同尺度的 BM25 与余弦值。排名从 1 开始，没有出现在某通道的片段在该通道贡献为零。

本例用平滑常数 c 表示公式中的参数，避免与最终候选数 k 混淆：

```text
RRF(d) = Σ 1 / (c + rank_channel(d))
c = 60；最终候选数量另由 k 决定
```

同一通道重复返回某个片段，只能贡献一次。不同通道同时找到它，则分别贡献；这反映多种检索方式的共同支持，不表示有多份独立事实。去重使用带版本含义的片段标识，不能只按正文相同就合并不同来源或条件。

::: tip 融合常数与候选数量分别调节
平滑常数影响各位置的相对贡献，通道候选数量决定哪些片段有机会参与融合。示例采用 60 作为明确的基线，不把论文中的参数推广为所有数据的最优值。
:::

### 2. 混合收益与降级

比较三种策略时，保持资料版本、可见范围和最终候选数量一致。可以观察某条已标注相关政策是否进入候选；完整评测还需要不同问题类型、足够样本及统一指标，不能用一次命中推断总体收益。

| 情况 | 可采取的策略 | 需要保留的观察 |
|------|--------------|----------------|
| 关键词为空、向量有候选 | 仅融合向量列表 | 空列表原因与实际候选来源 |
| 短词不能使用 trigram | 使用语义或已授权精确字段查询 | 不把词法缺失解释为无资料 |
| 某通道服务失败 | 按明确策略降级或失败 | 错误与降级标记，不能伪装正常空结果 |
| 融合挤掉相关候选 | 调整通道预算或方法 | 各原始排名及融合后的变化 |

如果两种策略已经取得相同证据，融合增加的调用可能没有收益。应同时比较证据覆盖、延迟和资源开销，再决定是否保留额外通道。

## 三、本地混合检索

### 1. 独立环境

使用 Python 3.12，实际验证 SQLite 3.53.1 的 FTS5 与 trigram。FTS5 是否编译进运行时不能只由 Python 版本推断；程序建表失败时明确停止并给出准备原因。

在空目录使用 PowerShell 安装固定依赖：

```powershell
mkdir rag-hybrid-demo
cd rag-hybrid-demo
python --version
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install "fastembed==0.7.4" "numpy==2.2.6" "onnxruntime==1.30.0" "huggingface-hub==0.36.0" "tokenizers==0.23.2"
```

准备当前示例的完整本地模型：

```powershell
mkdir model
curl.exe --http1.1 --fail --location --output bge-small-zh-v1.5.tar.gz "https://qdrant-fastembed.storage.googleapis.com/fast-bge-small-zh-v1.5.tar.gz"
if ($LASTEXITCODE -ne 0) { throw "模型下载失败" }
if ((Get-FileHash bge-small-zh-v1.5.tar.gz -Algorithm SHA256).Hash -ne "BF023219B6029148FDDF764D248808816C0CA1F107F058231BB1AE0FA526F83F") { throw "模型制品不一致" }
tar -xzf bge-small-zh-v1.5.tar.gz -C model --strip-components 1
Test-Path model/model_optimized.onnx
```

最后输出为 `True`。首次安装与约 52 MiB 模型下载需要联网；模型、分词器和配置齐全后，本例推理不向在线接口发送正文。

### 2. 完整实现

创建 `hybrid_search.py`。四条店铺 A 资料仍为配送、退款、客服与产品配送说明；另一租户及内部资料用于检查范围。型号是产品代码，不是订单号。

原问题用于语义编码，词法通道使用应用明确提供的关键词列表。这里的词选择是固定输入，不是模型改写。为了缩小示例，向量按可见资料现场编码；生产系统应使用契约一致的预计算索引。

::: details 查看 FTS5、真实语义检索与 RRF 完整实现

```python
# hybrid_search.py
import math
import sqlite3
from dataclasses import dataclass, replace
from pathlib import Path

import numpy as np
from fastembed import TextEmbedding

PREFIX = "为这个句子生成表示以用于检索相关文章："


@dataclass(frozen=True)
class Principal:
    """应用提供的租户与资源授权夹具。"""
    tenant_id: str
    allowed_ids: frozenset[str]


def prepare():
    """创建资料及 FTS5 索引并加载实际本地模型。

    Returns:
        SQLite 连接与 FastEmbed 模型；不支持 FTS5 时停止。
    """
    if not Path("model/model_optimized.onnx").is_file():
        raise FileNotFoundError("prepare model directory first")
    connection = sqlite3.connect(":memory:")
    connection.execute("CREATE TABLE chunks (chunk_id TEXT UNIQUE, tenant_id TEXT, "
                       "visibility TEXT, active INTEGER, text TEXT)")
    try:
        connection.execute("CREATE VIRTUAL TABLE policy_fts USING fts5(text, tokenize='trigram')")
    except sqlite3.OperationalError as error:
        connection.close()
        raise RuntimeError("FTS5 with trigram is required") from error
    records = [
        ("shipping-v1-01", "shop-a", "public", 1, "标准配送在发货后需要三至五个工作日。"),
        ("refund-v1-01", "shop-a", "public", 1, "退款必须经过人工确认，不得直接承诺退款。"),
        ("contact-v1-01", "shop-a", "public", 1, "客户可以通过商店帮助表单联系售后客服。"),
        ("sku-v1-01", "shop-a", "public", 1, "型号 SHIP-2048 采用标准配送，发货后三至五个工作日送达。"),
        ("hidden-v1-01", "shop-a", "internal", 1, "SHIP-2048 的内部调查备注。"),
        ("other-v1-01", "shop-b", "public", 1, "SHIP-2048 采用另一租户的配送约定。"),
    ]
    for row in records:
        cursor = connection.execute("INSERT INTO chunks VALUES (?,?,?,?,?)", row)
        connection.execute("INSERT INTO policy_fts(rowid,text) VALUES (?,?)", (cursor.lastrowid, row[4]))
    connection.commit()
    model = TextEmbedding(model_name="BAAI/bge-small-zh-v1.5", specific_model_path="model",
                          providers=["CPUExecutionProvider"], threads=2)
    return connection, model


def visible_rows(connection, principal):
    """先取得当前授权且有效的资料。

    Args:
        connection: 本篇创建的资料连接。
        principal: 来自应用的可信租户与允许片段集合。
    Returns:
        片段 ID 与正文列表；无可见资料时为空。
    """
    rows = connection.execute("SELECT chunk_id,text FROM chunks WHERE tenant_id=? "
                              "AND visibility='public' AND active=1 ORDER BY chunk_id",
                              (principal.tenant_id,))
    return [(identity, text) for identity, text in rows if identity in principal.allowed_ids]


def lexical(connection, principal, terms, k):
    """用应用构造的字面短语检索，按 FTS5 BM25 升序排名。

    Args:
        connection: 已创建 trigram 索引的连接。
        principal: 可信身份及当前允许集合。
        terms: 最多八个非空字符串，每项最多四十个字符；短于三字符的项跳过。
        k: 1 至 20 的严格整数候选上限。
    Returns:
        片段 ID 与原始 BM25 分数列表；有效词为空时返回空列表。
    """
    if type(k) is not int or not 1 <= k <= 20:
        raise ValueError("invalid_k")
    if not isinstance(terms, (list, tuple)) or len(terms) > 8:
        raise ValueError("invalid_terms")
    phrases = []
    for term in terms:
        if not isinstance(term, str) or not term.strip() or len(term) > 40:
            raise ValueError("invalid_term")
        if len(term.strip()) >= 3:
            # SQL 参数之外还约束 FTS 查询语法，双引号按其规则转义。
            phrases.append('"' + term.strip().replace('"', '""') + '"')
    if not phrases:
        return []
    rows = connection.execute("SELECT c.chunk_id,bm25(policy_fts) FROM policy_fts "
                              "JOIN chunks c ON c.rowid=policy_fts.rowid WHERE policy_fts MATCH ? "
                              "AND c.tenant_id=? AND c.visibility='public' AND c.active=1 "
                              "ORDER BY bm25(policy_fts),c.chunk_id",
                              (" OR ".join(phrases), principal.tenant_id))
    return [(identity, score) for identity, score in rows if identity in principal.allowed_ids][:k]


def dense(connection, model, principal, question, k):
    """对可见资料与原问题执行实际语义排序。

    Args:
        connection: 当前演示资料库。
        model: 本篇加载的 512 维中文模型。
        principal: 可信身份及授权范围。
        question: 1 至 180 个字符的演示短问题；不是模型 Token 上限。
        k: 1 至 20 的严格整数候选上限。
    Returns:
        ID 与归一化余弦分数列表；空范围不生成文档向量。
    """
    if type(k) is not int or not 1 <= k <= 20:
        raise ValueError("invalid_k")
    if not isinstance(question, str) or not question.strip() or len(question) > 180:
        raise ValueError("invalid_question")
    rows = visible_rows(connection, principal)
    if not rows:
        return []
    matrix = np.asarray(list(model.embed([text for _, text in rows])), dtype=np.float32)
    query = np.asarray(next(model.embed([PREFIX + question])), dtype=np.float32)
    lengths = np.linalg.norm(matrix, axis=1)
    query_length = float(np.linalg.norm(query))
    if (matrix.shape != (len(rows), 512) or query.shape != (512,) or
            not np.isfinite(matrix).all() or not np.isfinite(query).all() or
            (lengths <= 0).any() or not np.isfinite(lengths).all() or
            query_length <= 0 or not math.isfinite(query_length)):
        raise ValueError("invalid_embedding")
    scores = (matrix / lengths[:, None]) @ (query / query_length)
    ranked = [(rows[index][0], float(score)) for index, score in enumerate(scores)]
    # 回调返回负分数和 ID，保证降序与稳定同分顺序。
    ranked.sort(key=lambda item: (-item[1], item[0]))
    return ranked[:k]


def fuse(rankings, k, smoothing=60):
    """按不同通道的排名融合，单一通道中的重复 ID 只贡献一次。

    Args:
        rankings: 已授权的 ID 排名列表集合，每个通道按最佳到最差排列。
        k: 1 至 20 的严格整数最终候选数。
        smoothing: 正整数平滑常数，与 k 分别调节。
    Returns:
        ID 与 RRF 分数列表；所有通道为空时返回空列表。
    """
    if type(k) is not int or not 1 <= k <= 20 or type(smoothing) is not int or smoothing <= 0:
        raise ValueError("invalid_fusion_parameter")
    scores = {}
    for ranking in rankings:
        unique = list(dict.fromkeys(ranking))
        for position, identity in enumerate(unique, 1):
            scores[identity] = scores.get(identity, 0.0) + 1.0 / (smoothing + position)
    # 回调返回负融合分数和 ID，避免同分结果随输入次序漂移。
    return sorted(scores.items(), key=lambda item: (-item[1], item[0]))[:k]


def run_checks():
    """验证词法、真实语义、排名融合及输入和授权边界。

    Returns:
        无返回值；输出实际观察并关闭连接。
    """
    connection, model = prepare()
    try:
        principal = Principal("shop-a", frozenset({"shipping-v1-01", "refund-v1-01", "contact-v1-01", "sku-v1-01",
                                                  "hidden-v1-01", "other-v1-01"}))
        keyword = lexical(connection, principal, ["SHIP-2048"], 3)
        assert [identity for identity, _ in keyword] == ["sku-v1-01"]
        assert lexical(connection, principal, ["退款"], 3) == []
        assert lexical(connection, principal, ['SHIP-2048" OR "人工确认'], 3) == []
        assert lexical(connection, replace(principal, allowed_ids=frozenset()), ["SHIP-2048"], 3) == []
        matches = lexical(connection, principal, ["发货后"], 3)
        assert {identity for identity, _ in matches} == {"shipping-v1-01", "sku-v1-01"}
        assert all(matches[index][1] <= matches[index + 1][1] for index in range(len(matches) - 1))
        semantic = dense(connection, model, principal, "标准配送在发货后需要几个工作日？", 3)
        assert semantic[0][0] == "shipping-v1-01"
        assert dense(connection, model, replace(principal, tenant_id="shop-c"), "标准配送", 3) == []
        # 固定排名可独立核对融合规则，不冒充语义模型质量证据。
        fixture = fuse([("shipping", "refund", "shipping"), ("refund", "contact")], 3)
        assert fixture[0][0] == "refund"
        assert math.isclose(fixture[0][1], 0.03252247488101534, rel_tol=1e-12)
        assert len(fixture) == 3 and math.isclose(dict(fixture)["shipping"], 0.01639344262295082)
        assert fuse([(), ()], 3) == []
        assert [identity for identity, _ in fuse([(), ("shipping", "refund")], 3)] == ["shipping", "refund"]
        absent_keyword = lexical(connection, principal, ["寄出后"], 3)
        assert absent_keyword == []
        combined = fuse([[identity for identity, _ in absent_keyword], [identity for identity, _ in semantic]], 3)
        assert combined[0][0] == "shipping-v1-01"
        for invalid_terms in ("发货后", [""], [1]):
            try:
                lexical(connection, principal, invalid_terms, 3)
            except ValueError:
                pass
            else:
                raise AssertionError("invalid terms accepted")
        for invalid in (0, True):
            try:
                fuse([("shipping",)], invalid)
            except ValueError:
                pass
            else:
                raise AssertionError("invalid fusion limit accepted")
        print("hybrid_checks=passed")
        print("sku_keyword=sku-v1-01 semantic_top=shipping-v1-01 empty_lexical=0 fused_top=shipping-v1-01")
    finally:
        connection.close()


if __name__ == "__main__":
    run_checks()
```

:::

### 3. 执行与结果

在当前目录运行：

```powershell
.\.venv\Scripts\python.exe hybrid_search.py
```

检查通过时输出如下；型号命中来自 FTS5，配送排名来自实际本地模型：

```text
hybrid_checks=passed
sku_keyword=sku-v1-01 semantic_top=shipping-v1-01 empty_lexical=0 fused_top=shipping-v1-01
```

`寄出后` 在当前资料中没有字面命中，但配送语义候选进入了融合结果。固定排名夹具证明重复 ID 不重复计分及通道为空时的行为；它不证明 RRF 在真实业务上优于单通道。

将候选用作生成证据前，仍需要当前授权及资料状态检查。混合检索没有新增权限，也没有验证每条候选都足以支撑回答。

## 四、分词与融合排查

| 现象 | 证据与原因 | 处理 |
|------|------------|------|
| 中文段落存在却不命中 | 检查实际分词单位与查询长度 | 选择合适的词法方案，短词使用明确的替代策略 |
| 型号查询报语法错误 | 连字符或引号未按 MATCH 规则处理 | 参数绑定之外构造受控字面短语 |
| BM25 好结果排在末尾 | 把 FTS5 分数按降序排列 | 使用升序，并独立核对实际命中 |
| 融合只剩一个通道 | 检查通道错误、短词及原始候选 | 明确降级，保留候选来源 |
| 重复正文挤占候选数 | 检查片段标识、版本与通道去重 | 同片段合并贡献，不盲目合并不同事实 |

保留原始通道排名和最终排名，比只保存融合分数更有助于定位损失。如果新增通道没有带来相关证据，应允许回退到更简洁的检索策略。

## 五、参考资料

- [SQLite FTS5](https://sqlite.org/fts5.html)：本例使用的虚拟表、trigram、MATCH 与 BM25 行为。
- [RRF 原始论文](https://cormack.uwaterloo.ca/cormacksigir09-rrf.pdf)：倒数排名融合公式及研究范围。
- [向量检索与过滤](./01-vector-search-filtering.md)：候选集合及授权条件。
