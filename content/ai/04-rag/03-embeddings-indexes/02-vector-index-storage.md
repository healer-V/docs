---
title: "向量索引与存储"
tags:
  - RAG
  - 向量索引
  - SQLite
excerpt: "区分向量存储、精确扫描与近似索引，说明模型制品、输入规则和片段版本的一致性要求，使用本地中文嵌入与 SQLite 原子保存正文和向量，验证持久恢复、错误维度、配置冲突及事务回滚。"
date: 2026-09-29
---

# 向量索引与存储

向量存储保存片段向量及其身份、来源和版本；向量索引组织这些向量，使查询能够找到相近的候选。保存一个数值数组，不等于已经具备高效、可追溯的知识检索。

配送政策更新后，正文和向量必须对应同一个版本。如果数据库展示“三至五个工作日”，向量却来自已经失效的旧政策，分数计算即使没有报错，检索仍在比较错误资料。

## 一、存储对象与一致性

### 1. 片段记录

| 对象 | 需要保存的信息 | 用途 |
|------|----------------|------|
| 文档身份 | 来源文档 ID 与版本 | 定位权威来源及当前版本 |
| 片段身份 | 稳定片段 ID、正文与来源范围 | 从候选还原可引用内容 |
| 内容摘要 | 当前正文的哈希 | 检查嵌入任务是否携带相同正文 |
| 向量 | 维度、数值类型、字节序与数值 | 按明确格式恢复计算 |
| 可见范围 | 租户及业务授权属性 | 限定当前主体能检索哪些资料 |
| 索引契约 | 模型、制品、编码规则和索引版本 | 拒绝不兼容写入与查询 |

本例只处理三个完整短政策，各政策形成一个片段。实际切分得到的原文范围与稳定标识由[切分与元数据](../02-document-processing/02-chunking-metadata.md)说明，不应为了建立向量索引丢掉这些信息。

### 2. 索引契约

只保存模型名还不够。相同名称的制品可能更新，分词器、查询前缀或编码实现也会影响向量。本例记录七个模型文件的 SHA-256、运行库版本、512 维、L2 归一化、余弦计算、查询前缀和输入规则。

哈希用于发现制品变化，不证明模型质量。正文哈希也不能反推向量一定由该正文生成；应用需要可信的嵌入生产过程，把输入版本、输入哈希、模型契约与输出一起绑定。

::: warning 同维度不代表同一空间
索引由模型 A 构建，查询由模型 B 编码，即使两者都是 512 维也不能直接比较。配置不匹配时明确拒绝，不能截短、补零或改标签后继续使用。
:::

## 二、精确扫描与近似索引

### 1. 精确扫描

精确扫描为当前允许的全部候选逐个计算距离或相似度，再排序。本例使用 NumPy 对完整候选矩阵求点积，没有近似搜索结构，也没有 SQLite 向量扩展。

候选数为 `N`、维度为 `d` 时，单次全量分数计算约需要 `N × d` 个坐标级运算。float32 是每个数值占 4 字节的 32 位浮点表示，每条 512 维向量的原始数值占 2048 字节；一百万条约占 1.91 GiB，尚未计算正文、元数据、数据库和索引开销。

精确扫描适合小规模学习、低查询量场景及近似索引的对照基线。大规模场景还要测实际候选数量、并发、内存和尾延迟，不能从三个片段推出生产吞吐量。

### 2. 近似近邻搜索

近似近邻搜索（Approximate Nearest Neighbor，ANN）通过减少比较范围提高搜索效率，同时允许结果与精确排序不同。它在速度、内存、构建成本和召回之间做取舍，不保证返回精确的最近邻。

| 方式 | 基本组织 | 主要取舍 |
|------|----------|----------|
| 精确扫描 | 比较全部允许候选 | 结果作为当前距离定义的基线，计算量随候选数增长 |
| HNSW，分层可导航小世界图 | 构建分层邻近图，逐层寻找更近节点 | 图结构占额外内存，搜索参数影响时间与召回 |
| IVF，倒排文件索引 | 把向量分到聚类分区，查询部分分区 | 减少扫描范围，分区选择与探查数量影响漏召回 |
| 向量量化 | 用更紧凑的编码近似表示数值 | 节省内存，距离估计会增加误差，可与其他索引组合 |

HNSW、IVF 和量化属于不同维度的设计，不能把它们当作互斥产品名称。实际数据库的默认参数、过滤行为、更新方式和持久化保证应按具体实现验证。

评测 ANN 时，用相同模型、数据版本、可见候选和距离定义比较精确结果，同时记录延迟及资源。近似索引找到了若干相近片段，仍不证明它们足够支持业务回答。

## 三、持久写入与读取

### 1. 提交边界

先生成向量并绑定输入版本，再在存储事务内保存正文、版本、哈希和向量。模型计算发生在事务外；若来源在计算期间改变，入库端需要核对版本并决定重算或拒绝。

本例用同一行原子保存片段信息，事务失败时整行回滚。它没有实现跨存储索引发布或异步任务调度，不能承诺关系数据库与外部向量服务共享这份事务。

### 2. 读取边界

查询先检查当前索引契约，按可信租户读取候选，校验正文摘要与向量字节，再进行精确排序。模型配置冲突属于索引不兼容，不应伪装成“没有检索结果”。

::: info 租户过滤只是演示范围
示例假定本租户三个政策均可读，身份由应用固定。实际知识库还需检查角色、对象权限、撤回和当前版本，不能把租户 ID 当成完整授权；相关范围见[数据来源与权限](../01-knowledge-boundary/02-data-sources-permissions.md)。
:::

## 四、独立索引示例

### 1. 环境与模型准备

使用 Python 3.12，从空目录安装本篇依赖：

```powershell
mkdir rag-index-demo
cd rag-index-demo
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install "fastembed==0.7.4" "numpy==2.2.6" "onnxruntime==1.30.0" "huggingface-hub==0.36.0" "tokenizers==0.23.2"
```

下载完整中文 ONNX 制品。下面的 SHA-256 是 2026-09-29 实测版本，校验不一致时停止，不自动接受其他模型文件：

```powershell
mkdir model
curl.exe --http1.1 --fail --location --output bge-small-zh-v1.5.tar.gz "https://qdrant-fastembed.storage.googleapis.com/fast-bge-small-zh-v1.5.tar.gz"
if ($LASTEXITCODE -ne 0) { throw "模型下载失败" }
if ((Get-FileHash bge-small-zh-v1.5.tar.gz -Algorithm SHA256).Hash -ne "BF023219B6029148FDDF764D248808816C0CA1F107F058231BB1AE0FA526F83F") { throw "模型制品不一致" }
tar -xzf bge-small-zh-v1.5.tar.gz -C model --strip-components 1
Test-Path model/model_optimized.onnx
```

最后应输出 `True`。模型文件约 52 MiB 压缩大小，首次安装与下载需要联网，之后的文本推理与 SQLite 检索在本机完成。

### 2. 完整实现

创建 `vector_index.py`。SQLite 的 BLOB 是二进制数据字段；本例以小端 float32 保存每条 512 维向量，读取时按同一格式恢复。所有向量来自本篇加载的真实模型。

::: details 查看模型契约、持久索引与十二个验证用例

```python
# vector_index.py
import hashlib
import json
import sqlite3
from importlib.metadata import version
from pathlib import Path
from tempfile import TemporaryDirectory

import numpy as np
from fastembed import TextEmbedding

MODEL = "BAAI/bge-small-zh-v1.5"
DIMENSIONS = 512
QUERY_PREFIX = "为这个句子生成表示以用于检索相关文章："
PASSAGES = [
    ("shipping-policy", "标准配送在发货后需要三至五个工作日。"),
    ("refund-policy", "退款必须经过人工确认，不得直接承诺退款。"),
    ("contact-policy", "客户可以通过商店帮助表单联系售后客服。"),
]


def current_space(model_dir: Path) -> dict:
    """记录完整制品与编码规则，返回当前演示的索引契约。"""
    artifacts = {}
    for name in ("config.json", "model_optimized.onnx", "ort_config.json", "special_tokens_map.json",
                 "tokenizer.json", "tokenizer_config.json", "vocab.txt"):
        artifacts[name] = hashlib.sha256((model_dir / name).read_bytes()).hexdigest()
    return {"schema_version": 1, "index_generation": "policies-v1", "model": MODEL,
            "artifacts": artifacts, "dimensions": DIMENSIONS, "dtype": "float32-le",
            "normalization": "l2", "metric": "cosine", "query_prefix": QUERY_PREFIX,
            "text_rule": "short-raw-zh-v1", "fastembed": version("fastembed"),
            "onnxruntime": version("onnxruntime"), "tokenizers": version("tokenizers"),
            "numpy": version("numpy")}


def checked_vector(vector: np.ndarray, dimensions: int = DIMENSIONS) -> np.ndarray:
    """拒绝错误维度、零向量和非有限值，并返回单位向量。

    Args:
        vector: 一维数值向量，来自当前模型输出或查询。
        dimensions: 正整数预期维度，默认本模型的 512 维。

    Returns:
        小端 float32 单位向量，可直接按字节保存。
    """
    values = np.asarray(vector, dtype=np.float32)
    if type(dimensions) is not int or dimensions <= 0 or values.shape != (dimensions,):
        raise ValueError("dimension_mismatch")
    length = np.linalg.norm(values)
    if not np.isfinite(values).all() or not np.isfinite(length) or length <= 1e-12:
        raise ValueError("invalid_vector")
    return (values / length).astype("<f4")


def encode(model: TextEmbedding, text: str, query: bool = False) -> np.ndarray:
    """按固定规则编码一条短政策或查询，不读取其他文章的文件。

    Args:
        model: 使用当前本地制品的 BGE 模型。
        text: 非空字符串，本演示最多 180 个 Unicode 字符。
        query: True 时添加中文查询前缀，文档保持原文。

    Returns:
        已校验的 512 维单位向量。
    """
    if type(text) is not str or not text.strip() or len(text) > 180:
        raise ValueError("invalid_demo_text")
    vectors = list(model.embed([QUERY_PREFIX + text if query else text]))
    if len(vectors) != 1:
        raise ValueError("embedding_count_mismatch")
    return checked_vector(vectors[0])


def open_store(path: Path) -> sqlite3.Connection:
    """打开演示索引库，返回需调用方关闭的自动提交连接。"""
    connection = sqlite3.connect(path, isolation_level=None)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys=ON")
    connection.executescript("""
        CREATE TABLE IF NOT EXISTS indexes (
            tenant_id TEXT NOT NULL, index_id TEXT NOT NULL, space TEXT NOT NULL,
            PRIMARY KEY(tenant_id, index_id));
        CREATE TABLE IF NOT EXISTS chunks (
            tenant_id TEXT NOT NULL, index_id TEXT NOT NULL, chunk_id TEXT NOT NULL,
            document_id TEXT NOT NULL, document_version TEXT NOT NULL,
            text TEXT NOT NULL, source_hash TEXT NOT NULL, vector BLOB NOT NULL,
            PRIMARY KEY(tenant_id, index_id, chunk_id),
            FOREIGN KEY(tenant_id,index_id) REFERENCES indexes(tenant_id,index_id));
    """)
    return connection


def assert_space(connection: sqlite3.Connection, tenant: str, index_id: str, space: dict) -> None:
    """拒绝不存在的索引或不兼容契约，避免把配置错误当作空召回。

    Args:
        connection: 已初始化的索引库。
        tenant: 可信应用的当前租户。
        index_id: 当前租户内的索引身份。
        space: 当前模型及编码配置，不从模型文本获取。

    Returns:
        无返回值；缺少索引或契约不一致时抛出异常。
    """
    row = connection.execute("SELECT space FROM indexes WHERE tenant_id=? AND index_id=?",
                             (tenant, index_id)).fetchone()
    if row is None:
        raise LookupError("index_missing")
    if json.loads(row["space"]) != space:
        raise ValueError("embedding_space_conflict")


def put_chunk(connection: sqlite3.Connection, tenant: str, index_id: str, space: dict,
              chunk: dict, vector: np.ndarray, inject_failure: bool = False) -> None:
    """在同一事务写正文、版本、输入哈希与向量，失败整行回滚。

    Args:
        connection: 索引库自动提交连接，不允许嵌套事务。
        tenant: 来自可信应用的租户。
        index_id: 当前租户内的既有索引。
        space: 生成向量时使用的完整索引契约。
        chunk: 本例生产器给出的 ID、文档版本、正文及嵌入输入哈希。
        vector: 对应当前 chunk 正文的真实嵌入，维度必须匹配。
        inject_failure: 测试开关，写入后、提交前抛出异常。

    Returns:
        无返回值；成功提交整行，异常时保留原记录。
    """
    connection.execute("BEGIN IMMEDIATE")
    try:
        assert_space(connection, tenant, index_id, space)
        if hashlib.sha256(chunk["text"].encode()).hexdigest() != chunk["source_hash"]:
            raise ValueError("stale_embedding_input")
        values = checked_vector(vector, space["dimensions"])
        connection.execute("""INSERT INTO chunks VALUES (?,?,?,?,?,?,?,?)
            ON CONFLICT(tenant_id,index_id,chunk_id) DO UPDATE SET
            document_id=excluded.document_id, document_version=excluded.document_version,
            text=excluded.text, source_hash=excluded.source_hash, vector=excluded.vector""",
            (tenant, index_id, chunk["chunk_id"], chunk["document_id"], chunk["document_version"],
             chunk["text"], chunk["source_hash"], values.tobytes()))
        if inject_failure:
            raise RuntimeError("injected before index commit")
        connection.commit()
    except BaseException:
        connection.rollback()
        raise


def search(connection: sqlite3.Connection, tenant: str, index_id: str,
           space: dict, query: np.ndarray, limit: int = 2) -> list[dict]:
    """读取当前租户的全部候选并精确排序，不使用 ANN。

    Args:
        connection: 已初始化的索引库。
        tenant: 可信当前租户；本例假定租户内三个政策均可读。
        index_id: 当前租户内的索引身份。
        space: 查询编码所用契约，必须与存储一致。
        query: 当前模型生成的查询向量。
        limit: 正整数返回上限，不接受布尔值。

    Returns:
        含片段、文档版本、正文、来源摘要及分数的候选列表。
    """
    if type(limit) is not int or limit < 1:
        raise ValueError("invalid limit")
    assert_space(connection, tenant, index_id, space)
    query = checked_vector(query, space["dimensions"])
    rows = connection.execute("SELECT * FROM chunks WHERE tenant_id=? AND index_id=? ORDER BY chunk_id",
                              (tenant, index_id)).fetchall()
    if not rows:
        return []
    vectors = []
    for row in rows:
        if hashlib.sha256(row["text"].encode()).hexdigest() != row["source_hash"]:
            raise ValueError("corrupt_stored_text")
        if len(row["vector"]) != space["dimensions"] * 4:
            raise ValueError("corrupt_stored_bytes")
        values = np.frombuffer(row["vector"], dtype="<f4")
        if not np.isfinite(values).all() or not np.isclose(np.linalg.norm(values), 1.0, atol=1e-5):
            raise ValueError("corrupt_stored_vector")
        vectors.append(values)
    scores = np.vstack(vectors) @ query
    ranking = np.argsort(-scores, kind="stable")[:limit]
    results = []
    for position in ranking:
        row = rows[int(position)]
        results.append({"chunk_id": row["chunk_id"], "document_id": row["document_id"],
                        "document_version": row["document_version"], "text": row["text"],
                        "source_hash": row["source_hash"], "score": float(scores[int(position)])})
    return results


def run_tests() -> None:
    """验证十二项持久化、契约、输入绑定、维度与事务行为。"""
    model_dir = Path("model")
    space = current_space(model_dir)
    model = TextEmbedding(model_name=MODEL, specific_model_path=str(model_dir),
                          providers=["CPUExecutionProvider"], threads=2)
    query = encode(model, "标准配送在发货后需要几个工作日？", True)
    with TemporaryDirectory(prefix="vector-index-") as directory:
        path = Path(directory) / "policies.sqlite"
        connection = open_store(path)
        tenant, index_id = "store-a", "support-policies"
        try:
            connection.execute("INSERT INTO indexes VALUES (?,?,?)", (tenant, index_id, json.dumps(space)))
            originals = {}
            for document_id, text in PASSAGES:
                chunk = {"chunk_id": document_id + "-1", "document_id": document_id,
                         "document_version": "v1", "text": text,
                         "source_hash": hashlib.sha256(text.encode()).hexdigest()}
                vector = encode(model, text)
                put_chunk(connection, tenant, index_id, space, chunk, vector)
                originals[document_id] = (chunk, vector)
            assert connection.execute("SELECT COUNT(*) FROM chunks").fetchone()[0] == 3
            row = connection.execute("SELECT * FROM chunks WHERE document_id='shipping-policy'").fetchone()
            assert len(row["vector"]) == DIMENSIONS * 4
            assert np.allclose(np.frombuffer(row["vector"], dtype="<f4"), originals["shipping-policy"][1])
            connection.close()
            connection = open_store(path)
            results = search(connection, tenant, index_id, space, query)
            assert results[0]["document_id"] == "shipping-policy" and results[0]["document_version"] == "v1"
            for wrong_space, wrong_query, reason in (
                (space, np.ones(384), "dimension_mismatch"),
                ({**space, "model": "other-model-same-dimensions"}, query, "embedding_space_conflict"),
                ({**space, "query_prefix": "other query rule"}, query, "embedding_space_conflict"),
            ):
                try:
                    search(connection, tenant, index_id, wrong_space, wrong_query)
                except ValueError as error:
                    assert str(error) == reason
                else:
                    raise AssertionError("incompatible query accepted")
            chunk, vector = originals["shipping-policy"]
            for wrong_chunk, wrong_vector, reason in (
                ({**chunk, "text": "标准配送需要重新核对。"}, vector, "stale_embedding_input"),
                (chunk, np.zeros(DIMENSIONS), "invalid_vector"),
                (chunk, np.ones(384), "dimension_mismatch"),
                (chunk, np.full(DIMENSIONS, np.nan), "invalid_vector"),
            ):
                try:
                    put_chunk(connection, tenant, index_id, space, wrong_chunk, wrong_vector)
                except ValueError as error:
                    assert str(error) == reason
                else:
                    raise AssertionError("invalid write accepted")
                assert search(connection, tenant, index_id, space, query) == results
            revised_text = "标准配送在发货后需要四至六个工作日。"
            revised = {**chunk, "document_version": "v2", "text": revised_text,
                       "source_hash": hashlib.sha256(revised_text.encode()).hexdigest()}
            try:
                put_chunk(connection, tenant, index_id, space, revised, encode(model, revised_text), True)
            except RuntimeError as error:
                assert str(error) == "injected before index commit"
            else:
                raise AssertionError("fault not injected")
            assert search(connection, tenant, index_id, space, query) == results
            connection.execute("INSERT INTO indexes VALUES (?,?,?)", ("store-b", index_id, json.dumps(space)))
            assert search(connection, "store-b", index_id, space, query) == []
            assert connection.execute("SELECT COUNT(*) FROM chunks").fetchone()[0] == 3
            print("index_tests=passed cases=12")
            print("reopened=true stored_vector_bytes=2048 top=shipping-policy")
        finally:
            connection.close()


if __name__ == "__main__":
    run_tests()
```

:::

保存时的嵌入输入哈希由生产器与向量一起提供，入库端对比当前正文，防止旧任务携带不同输入。例子中的正文、输入哈希和向量按同一对象生成；它没有通过哈希证明任意外部向量的来源。

### 3. 执行与结果

运行当前文件：

```powershell
.\.venv\Scripts\python.exe vector_index.py
```

通过时输出如下：

```text
index_tests=passed cases=12
reopened=true stored_vector_bytes=2048 top=shipping-policy
```

十二项检查覆盖三条片段写入、向量字节回读、关闭后检索、查询维度、同维度模型冲突、查询规则冲突、旧输入拒绝、零向量、提交回滚、租户隔离、写入维度和非有限值。回滚后正文仍为版本 `v1`，检索结果与修改前一致。

这份程序证明小规模精确扫描与同数据库持久一致性，没有测 ANN 召回率或吞吐量，也没有实现完整权限、跨存储发布及百万级容量。

## 五、选型与故障判断

| 现象或约束 | 判断与处理 |
|------------|------------|
| 配置冲突，但维度相同 | 对照制品、分词器及查询规则；构建新兼容索引，不直接改旧标签 |
| 向量能读，正文来源错误 | 检查生产任务绑定、文档版本和摘要，不只检查 BLOB 长度 |
| 写入失败后正文已变、向量未变 | 核对提交边界；同存储原子写入，跨存储使用明确发布流程 |
| 小集合、低查询量且需要可检查基线 | 可以先用精确扫描，测清规模增长的成本 |
| 大集合或高查询量 | 对照精确基线评测 ANN、过滤、更新成本与尾延迟 |
| 检索返回已撤回资料 | 从当前读取及索引可见性处理，分数高不能绕过撤回 |

索引选择应围绕数据规模、查询负载、更新频率、权限过滤与质量要求。先明确接受的错误与运行成本，再选择实现；单凭模型维度或某个索引名称不能完成架构判断。

## 六、参考资料

- [HNSW 原始论文](https://arxiv.org/abs/1603.09320)：分层图近似搜索机制。
- [Faiss 索引比较](https://github.com/facebookresearch/faiss/wiki/Faiss-indexes)：Flat、IVF、HNSW 和量化的结构及资源差异。
- [Python sqlite3](https://docs.python.org/3.12/library/sqlite3.html)：BLOB、参数绑定及事务。
- [SQLite 事务](https://www.sqlite.org/lang_transaction.html)：提交、回滚与存储边界。
- [FastEmbed 0.7.4 模型登记](https://github.com/qdrant/fastembed/blob/v0.7.4/fastembed/text/onnx_embedding.py)：本例完整模型制品与 CPU 加载实现。
- [嵌入与相似度](./01-embeddings-similarity.md)：输入规则、归一化及分数解释。
