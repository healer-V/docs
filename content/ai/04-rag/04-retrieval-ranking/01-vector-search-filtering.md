---
title: "向量检索与过滤"
tags:
  - RAG
  - 向量检索
  - NumPy
excerpt: "解释查询向量、候选数量、过滤顺序与空结果，使用本地中文嵌入完成授权集合内的精确检索，并以可复现反例验证先截取再过滤的召回损失、当前权限及异常向量。"
date: 2026-09-29
---

# 向量检索与过滤

向量检索用查询的嵌入表示寻找相关知识片段。过滤规定哪些片段允许参与当前查询，排名决定这些片段中哪些更相关；两者共同形成候选集，但相似度不能代替授权、有效版本或事实核对。

用户询问“标准配送发货后要等几个工作日”，应用需要返回当前店铺可见的配送政策。另一个租户的政策即使得分更高，也不能进入回答证据。**检索应在可信身份确定的可见集合内取候选，并在资料交给模型前核对当前权限。**

## 一、查询与候选集

### 1. 查询表示与 Top-k

查询和文档必须使用兼容的模型空间、维度及输入规则。文档向量可以预先生成；每次请求生成查询向量，与可用文档比较。向量的定义和归一化见[嵌入与相似度](../03-embeddings-indexes/01-embeddings-similarity.md)。

Top-k 表示按检索排名最多保留 k 条候选，不表示必然有 k 条有效证据。若只有两条可见资料，k 为 5 仍最多返回两条；若采用相关性阈值，还可以返回更少甚至零条。

| 参数 | 影响 | 使用边界 |
|------|------|----------|
| 候选数 k | 后续重排可选择的范围与成本 | 过小会漏掉证据，过大增加读取及重排工作 |
| 最小相似度 | 排除低分候选 | 由当前模型和业务样本校准，不采用通用可信度阈值 |
| 相同分数的顺序 | 结果能否稳定复现 | 使用片段标识作为第二排序条件 |
| 当前资料版本 | 哪些内容仍可使用 | 已停用片段不能靠较高分数重新入选 |

本例为精确检索：对可见向量逐条计算分数，取得该集合中的实际前 k 条。近似近邻索引以速度换取近邻查找的近似性，过滤还会影响候选搜索过程；不能把本例的结果保证直接套到近似索引。

### 2. 空结果与阈值

相关性筛选与身份筛选导致的空结果含义不同。没有授权资料时，不能重试查询其他租户；有可见资料但都低于阈值时，可以检查查询表达、索引版本及阈值选择。

本例默认不设相似度阈值，用结果观察模型行为。测试中的阈值 1.0 仅用于构造确定的空结果，不是配送问答的推荐值。真正的拒答条件还要判断候选是否足以回答原问题，而非仅检查列表非空。

::: warning 更多候选不能扩大资料权限
扩大 k 或降低相关性阈值，只能扩大已经授权集合内的候选范围。空结果不能触发取消租户或可见性过滤，否则检索策略会变成越权路径。
:::

## 二、过滤的位置

### 1. 截取前过滤

假设全库排名前三条都是内部备注，第四条是当前用户可见的政策。先取全库前三条再删除内部备注，会得到空列表；在可见集合中取前三条则可以找到政策。前一种实现即使没有泄漏正文，也已经丢失召回机会。

这个反例与使用精确还是近似相似度计算无关。问题来自“哪些资料竞争候选名额”，应在检索请求中明确过滤条件。向量服务怎样在索引内部实现过滤，需要按服务及索引文档确认，不能由一个 `filter` 参数推断物理执行顺序。

本例的 SQL 先取得授权且有效的片段，再用 NumPy 排序。下面是完整实现中的筛选规则示意，不是独立程序：

```sql
SELECT chunk_id, text, vector FROM chunks
WHERE tenant_id = ? AND visibility = 'public' AND active = 1;
```

租户值来自可信请求上下文。SQL 参数绑定避免把值拼接进 SQL，随后按应用持有的 `allowed_ids` 再限制资源范围；模型不参与填写这两个授权字段。

### 2. 当前权限与版本

检索结束到生成开始之间，权限和资料状态可能变化。初次过滤只证明检索时的条件，不能保证旧候选永远可用。应用在组装证据前应再查当前资料状态，并按当前身份核对授权。

二次检查不能恢复初次召回遗漏，只能移除已经失效的候选。本例保留原排名，重新读取当前正文与元数据；全部失效就返回空列表。真实服务还需控制检查与使用之间的竞态，并把授权策略版本或同一快照语义纳入设计。

::: info 演示身份来自固定可信夹具
示例用两个租户及明确的片段集合说明过滤，不实现登录系统。生产请求应从认证与授权组件取得范围，不能直接把用户提供的 `tenant_id` 或片段 ID 当作可信授权。
:::

## 三、可见集合内的精确检索

### 1. 环境与模型

使用 Python 3.12、FastEmbed 0.7.4、NumPy 2.2.6 和 CPU 推理。在新的空目录执行以下 PowerShell 命令：

```powershell
mkdir rag-filter-demo
cd rag-filter-demo
python --version
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install "fastembed==0.7.4" "numpy==2.2.6" "onnxruntime==1.30.0" "huggingface-hub==0.36.0" "tokenizers==0.23.2"
```

从官方 FastEmbed 存储桶下载完整中文模型制品，校验后解压到当前目录的 `model/`：

```powershell
mkdir model
curl.exe --http1.1 --fail --location --output bge-small-zh-v1.5.tar.gz "https://qdrant-fastembed.storage.googleapis.com/fast-bge-small-zh-v1.5.tar.gz"
if ($LASTEXITCODE -ne 0) { throw "模型下载失败" }
if ((Get-FileHash bge-small-zh-v1.5.tar.gz -Algorithm SHA256).Hash -ne "BF023219B6029148FDDF764D248808816C0CA1F107F058231BB1AE0FA526F83F") { throw "模型制品不一致" }
tar -xzf bge-small-zh-v1.5.tar.gz -C model --strip-components 1
Test-Path model/model_optimized.onnx
```

最后输出应为 `True`。制品约 52 MiB，摘要固定本例实测版本；它不是发布者签名。首次安装和下载需要网络，之后文本编码在本地进行。解压不完整或下载中断时，先重新准备模型文件。

### 2. 完整实现

创建 `vector_filter.py`。政策向量来自真实 `BAAI/bge-small-zh-v1.5`，512 维，查询使用该模型的中文检索前缀。程序把过滤后的资料编码为单位向量，保存在内存 SQLite 中，以便观察查询与撤权行为；索引持久化由[向量索引与存储](../03-embeddings-indexes/02-vector-index-storage.md)主讲。

过滤顺序反例另外使用明确的固定分数夹具，让排名及损失可独立算出。它只证明截取顺序，不用于声称语义模型的质量。

::: details 查看真实向量检索、权限复核与完整验证

```python
# vector_filter.py
import sqlite3
from dataclasses import dataclass, replace
from pathlib import Path

import numpy as np
from fastembed import TextEmbedding

MODEL = "BAAI/bge-small-zh-v1.5"
PREFIX = "为这个句子生成表示以用于检索相关文章："
DIMENSIONS = 512


@dataclass(frozen=True)
class Principal:
    """应用认证后给出的租户与资源集合，模型不能修改。"""
    tenant_id: str
    allowed_ids: frozenset[str]


def unit_vector(values, dimensions):
    """检查有限非零向量并归一化。

    Args:
        values: 一维数值数组，拒绝布尔值、字符串与非有限值。
        dimensions: 预期维度，必须是正整数。
    Returns:
        长度为 1 的 float32 数组；不合法输入抛出 ValueError。
    """
    if type(dimensions) is not int or dimensions <= 0:
        raise ValueError("invalid_dimensions")
    original = np.asarray(values)
    if original.dtype.kind not in "iuf" or original.shape != (dimensions,):
        raise ValueError("invalid_vector")
    array = original.astype(np.float32)
    length = float(np.linalg.norm(array))
    if not np.isfinite(array).all() or not np.isfinite(length) or length <= 0:
        raise ValueError("invalid_vector")
    return array / length


def prepare_store():
    """加载本地模型并创建演示政策库。

    Returns:
        SQLite 连接与本地模型；只包含文中虚构资料。
    """
    if not Path("model/model_optimized.onnx").is_file():
        raise FileNotFoundError("prepare model directory first")
    model = TextEmbedding(model_name=MODEL, specific_model_path="model",
                          providers=["CPUExecutionProvider"], threads=2)
    records = [
        ("shipping-v1-01", "shop-a", "public", 1, "标准配送在发货后需要三至五个工作日。"),
        ("refund-v1-01", "shop-a", "public", 1, "退款必须经过人工确认，不得直接承诺退款。"),
        ("contact-v1-01", "shop-a", "public", 1, "客户可以通过商店帮助表单联系售后客服。"),
        ("internal-v1-01", "shop-a", "internal", 1, "配送调查的内部沟通记录。"),
        ("shipping-v0-01", "shop-a", "public", 0, "已经停用的旧配送政策。"),
        ("shipping-b-01", "shop-b", "public", 1, "标准配送在发货后需要两个工作日。"),
    ]
    connection = sqlite3.connect(":memory:")
    connection.execute("CREATE TABLE chunks (chunk_id TEXT PRIMARY KEY, tenant_id TEXT, "
                       "visibility TEXT, active INTEGER, text TEXT, vector BLOB)")
    vectors = model.embed([row[4] for row in records])
    for row, vector in zip(records, vectors, strict=True):
        data = unit_vector(vector, DIMENSIONS).astype("<f4").tobytes()
        connection.execute("INSERT INTO chunks VALUES (?,?,?,?,?,?)", (*row, data))
    connection.commit()
    return connection, model


def search(connection, principal, query, k, minimum=None):
    """在当前授权且有效的集合内精确排序。

    Args:
        connection: prepare_store 创建的演示连接。
        principal: 应用持有的可信租户与允许 ID 集合。
        query: 已使用同一模型生成的一维 512 维查询向量。
        k: 1 至 20 的严格整数候选上限。
        minimum: 可选有限相似度下限，范围为 -1 至 1。
    Returns:
        片段 ID 与分数的有序列表；授权集合为空时返回空列表。
    """
    if type(k) is not int or not 1 <= k <= 20:
        raise ValueError("invalid_k")
    if minimum is not None and (type(minimum) not in (int, float) or
                               not np.isfinite(minimum) or not -1 <= minimum <= 1):
        raise ValueError("invalid_minimum")
    query = unit_vector(query, DIMENSIONS)
    rows = connection.execute("SELECT chunk_id, vector FROM chunks WHERE tenant_id=? "
                              "AND visibility='public' AND active=1", (principal.tenant_id,))
    results = []
    for chunk_id, data in rows:
        if chunk_id not in principal.allowed_ids:
            continue
        if len(data) != DIMENSIONS * 4:
            raise ValueError("damaged_vector")
        vector = unit_vector(np.frombuffer(data, dtype="<f4"), DIMENSIONS)
        score = float(vector @ query)
        if minimum is None or score >= minimum:
            results.append((chunk_id, score))
    # 排序回调返回负分数与 ID，保证高分优先且同分次序稳定。
    results.sort(key=lambda item: (-item[1], item[0]))
    return results[:k]


def current_evidence(connection, principal, ranked):
    """按当前权限与资料状态重新读取正文。

    Args:
        connection: 当前资料库连接。
        principal: 使用证据时的可信身份，允许集合可已变化。
        ranked: search 返回的 ID 与分数列表，保持原顺序。
    Returns:
        当前仍可见的 ID 与正文列表，不恢复已经失去的召回名额。
    """
    evidence = []
    for chunk_id, _ in ranked:
        if chunk_id not in principal.allowed_ids:
            continue
        row = connection.execute("SELECT text FROM chunks WHERE chunk_id=? AND tenant_id=? "
                                 "AND visibility='public' AND active=1",
                                 (chunk_id, principal.tenant_id)).fetchone()
        if row:
            evidence.append((chunk_id, row[0]))
    return evidence


def run_checks():
    """验证语义检索、授权、截取顺序及失败边界。

    Returns:
        无返回值；断言通过后输出观察结果，关闭演示连接。
    """
    connection, model = prepare_store()
    try:
        principal = Principal("shop-a", frozenset({"shipping-v1-01", "refund-v1-01", "contact-v1-01",
                                                  "internal-v1-01", "shipping-v0-01", "shipping-b-01"}))
        query = next(model.embed([PREFIX + "标准配送发货后要等几个工作日？"]))
        ranked = search(connection, principal, query, 3)
        assert ranked[0][0] == "shipping-v1-01" and len(ranked) == 3
        assert {item[0] for item in ranked} == {"shipping-v1-01", "refund-v1-01", "contact-v1-01"}
        assert search(connection, replace(principal, allowed_ids=frozenset()), query, 3) == []
        assert search(connection, replace(principal, tenant_id="shop-c"), query, 3) == []
        assert search(connection, principal, query, 3, 1.0) == []
        assert len(search(connection, principal, query, 20)) == 3
        revoked = replace(principal, allowed_ids=frozenset({"refund-v1-01"}))
        assert [item[0] for item in current_evidence(connection, revoked, ranked)] == ["refund-v1-01"]
        connection.execute("UPDATE chunks SET active=0 WHERE chunk_id='refund-v1-01'")
        assert current_evidence(connection, revoked, ranked) == []
        # 两个不可见项占据全库前两名，后过滤会丢失本来可见的政策。
        fixture = [("hidden-1", 1.0, False), ("hidden-2", 0.9, False), ("shipping", 0.8, True)]
        assert [item for item in fixture[:2] if item[2]] == []
        assert [item[0] for item in fixture if item[2]][:2] == ["shipping"]
        for values in (np.zeros(DIMENSIONS), [float("nan")] * DIMENSIONS, [1.0, 2.0]):
            try:
                search(connection, principal, values, 3)
            except ValueError:
                pass
            else:
                raise AssertionError("invalid vector accepted")
        for invalid_k in (0, True):
            try:
                search(connection, principal, query, invalid_k)
            except ValueError:
                pass
            else:
                raise AssertionError("invalid k accepted")
        try:
            search(connection, principal, query, 3, float("nan"))
        except ValueError:
            pass
        else:
            raise AssertionError("invalid threshold accepted")
        print("filter_checks=passed")
        print("semantic_top=shipping-v1-01 postfilter_fixture=0 prefilter_fixture=1 revoked_evidence=0")
    finally:
        connection.close()


if __name__ == "__main__":
    run_checks()
```

:::

### 3. 执行与观察

在当前目录运行：

```powershell
.\.venv\Scripts\python.exe vector_filter.py
```

检查通过时输出如下，配送政策是实际模型的首个候选：

```text
filter_checks=passed
semantic_top=shipping-v1-01 postfilter_fixture=0 prefilter_fixture=1 revoked_evidence=0
```

固定反例中，后过滤得到零条，先过滤得到一条。撤权及停用之后，旧候选不再进入证据。程序同时检查空范围、其他租户、过高阈值、错误维度、零向量、NaN 及非法 k。

本例只证明固定政策上的语义排序与本地过滤，不代表真实业务召回率、完整授权系统或生产容量。身份查询、策略缓存与向量空间的生产维护仍需独立设计。

## 四、召回损失排查

| 现象 | 定位证据 | 处理 |
|------|----------|------|
| 全库有结果，当前身份没有 | 授权范围、租户、有效版本 | 保持权限边界，确认是否确实缺少可用资料 |
| 限制 k 后几乎为空 | 过滤前后候选 ID 与数量 | 检查是否先截取全库结果再过滤 |
| 相关政策始终排在后面 | 模型制品、查询前缀、相关样本 | 检查空间兼容与文本表达，再评估索引策略 |
| 阈值提高后大量漏召回 | 分数分布与被删除的相关片段 | 使用业务标注校准阈值，保留对照数据 |
| 旧候选仍能生成回答 | 证据读取时的权限与资料状态 | 重新授权并读取，失效就停止使用 |

诊断时分别记录可见集合大小、检索候选数和最终证据数。三者不同，才能定位损失来自权限、召回还是后续证据选择；不要只观察生成文字是否流畅。

## 五、参考资料

- [Qdrant 过滤条件](https://qdrant.tech/documentation/search/filtering/)：实际向量服务的过滤表达，具体索引行为需另行核对。
- [BGE 中文模型](https://huggingface.co/BAAI/bge-small-zh-v1.5)：本例模型与查询输入约定。
- [数据来源与权限](../01-knowledge-boundary/02-data-sources-permissions.md)：可信身份与资料集合。
- [证据组织与生成](../05-evidence-answers/01-evidence-grounded-generation.md)：候选进入生成前的证据组织。
