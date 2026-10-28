---
title: "嵌入与相似度"
tags:
  - RAG
  - Embedding
  - NumPy
excerpt: "解释文本嵌入空间、维度、查询编码与归一化，比较点积、余弦相似度和欧氏距离，使用本地中文 BGE 模型从空目录生成真实向量，验证排序与异常输入，说明相似度分数的适用边界。"
date: 2026-09-29
---

# 嵌入与相似度

文本嵌入（Embedding）把文本转换为固定长度的数值向量，使应用能够比较查询与知识片段的相关程度。嵌入模型输出向量，生成模型输出回答；检索到相关片段后，应用仍需要核对来源、权限与事实。

用户问“发货后多久送到”，配送政策写的是“标准配送在发货后需要三至五个工作日”。两句话没有完全相同的词序，向量检索可以根据模型学到的文本关系寻找候选，但不能据此确认这条政策对当前订单一定适用。

## 一、嵌入空间与输入

### 1. 向量与维度

向量是一组有顺序的数值；维度是其中数值的数量。512 维文本向量包含 512 个坐标，不是 512 个字符，也不是 512 条事实。单个坐标通常没有可独立解释的业务含义，需要整体计算关系。

模型训练形成一套坐标空间。来自同一兼容编码方案的查询和文档可以比较；不同模型即使都输出 512 维，坐标含义也可能不同。只检查数组长度，不能发现所有模型混用。

| 条件 | 检索影响 | 处理 |
|------|----------|------|
| 模型或权重改变 | 文档与查询可能不在同一空间 | 保留模型制品版本，重算并验证索引 |
| 维度不一致 | 无法计算对应坐标关系 | 写入和查询时拒绝不兼容向量 |
| 分词或输入规则改变 | 相同文本也可能得到不同向量 | 记录分词器、输入处理与查询规则 |
| 语言或领域不适合模型 | 相关片段可能排在后面 | 用实际查询与人工相关性标签评测 |

维度更大通常增加存储与运算成本，但不保证检索质量更好。模型训练、语料、查询类型和片段设计都会影响结果。

### 2. 查询与文档编码

部分模型要求查询和文档采用不同的前缀或编码入口。应遵循具体模型的说明，不能给所有模型统一添加 `query:` 或同一句检索指令。

本例使用中文模型 `BAAI/bge-small-zh-v1.5`。文档保持原文；短查询按模型说明添加“为这个句子生成表示以用于检索相关文章：”。同一查询规则用于演示和之后的索引查询，避免运行时悄悄改变输入。

::: warning 截断会改变被表示的内容
本模型的输入长度上限为 512 个 Token，FastEmbed 的对应实现会截断长输入。字符数不能直接等同于 Token 数；生产切分应按实际分词器检查，不能因为向量成功生成就认定全文都参与了编码。
:::

## 二、相似度计算

### 1. 点积与余弦

点积把对应坐标相乘后求和，同时受到方向与向量长度影响。余弦相似度把点积除以两个向量的长度，比较方向关系；非零向量的理论取值在 -1 到 1 之间，浮点计算存在误差。

下面的 `x`、`y` 是非零向量，`||x||` 表示欧氏长度，即坐标平方和的平方根：

```text
dot(x, y) = Σ x[i] × y[i]
cosine(x, y) = dot(x, y) / (||x|| × ||y||)
normalize(x) = x / ||x||
```

把每个向量归一化为长度 1 后，点积等于余弦相似度。矩阵每一行保存一个文档向量时，`documents @ query` 可以同时计算所有文档的分数；`@` 是 NumPy 的矩阵乘法运算符。

归一化不应改变空向量、非有限值或错误维度的意义。零向量无法定义余弦，NaN 和无穷大也不能用于可靠排序，写入或查询时应明确拒绝。

### 2. 距离与排序方向

| 计算方式 | 排序方向 | 边界 |
|----------|----------|------|
| 余弦相似度 | 越大越近 | 不表示事实正确率 |
| 点积 | 越大越近 | 未归一化时长度也影响分数 |
| 欧氏距离 | 越小越近 | 坐标尺度与归一化状态影响结果 |

两个单位向量的欧氏距离平方等于 `2 - 2 × cosine`，因此在同一单位向量集合中按这两种方式排序等价。未归一化时不能直接使用这个关系。

::: tip 分数阈值由数据决定
余弦 0.8 不表示“80% 可信”，也不是所有模型通用的相关性界线。应结合当前模型、数据分布及任务错误成本选择阈值，并检查被误收与被漏掉的片段。
:::

## 三、本地中文嵌入

### 1. 环境与模型文件

使用 Python 3.12、FastEmbed 0.7.4、NumPy 2.2.6 和 CPU 推理。FastEmbed 基于 ONNX Runtime 加载嵌入模型；本例不启动向量数据库，也不需要模型 API 密钥。

在空目录准备独立环境，命令使用 Windows PowerShell：

```powershell
mkdir rag-embedding-demo
cd rag-embedding-demo
python --version
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install "fastembed==0.7.4" "numpy==2.2.6" "onnxruntime==1.30.0" "huggingface-hub==0.36.0" "tokenizers==0.23.2"
```

从 FastEmbed 0.7.4 模型清单登记的官方备用源下载 ONNX 制品，并解压到当前目录的 `model/`。`--strip-components 1` 去掉压缩包中的外层目录：

```powershell
mkdir model
curl.exe --http1.1 --fail --location --output bge-small-zh-v1.5.tar.gz "https://qdrant-fastembed.storage.googleapis.com/fast-bge-small-zh-v1.5.tar.gz"
if ($LASTEXITCODE -ne 0) { throw "模型下载失败" }
if ((Get-FileHash bge-small-zh-v1.5.tar.gz -Algorithm SHA256).Hash -ne "BF023219B6029148FDDF764D248808816C0CA1F107F058231BB1AE0FA526F83F") { throw "模型制品不一致" }
tar -xzf bge-small-zh-v1.5.tar.gz -C model --strip-components 1
Test-Path model/model_optimized.onnx
```

最后一条命令应输出 `True`。下载地址使用官方备用源同一存储桶的域名形式；校验值是 2026-09-29 实测制品的 SHA-256，用于固定本例文件，不是发布者签名。压缩包约 52 MiB，解压后还包含分词器和模型配置。

程序通过 `specific_model_path` 加载这一完整本地目录，不依赖默认下载位置；不能只复制一个权重文件而遗漏分词器。下载中断后可以用 curl 的 `--continue-at -` 对相同文件续传，校验通过后再解压。

::: info 首次准备需要联网
联网用于安装依赖及下载公开模型文件，文本推理在本机进行。准备失败时先检查下载状态和模型目录，不用手写向量替代模型结果。
:::

### 2. 完整实现

在当前目录创建 `embeddings_similarity.py`。三条虚构政策分别涉及配送、退款确认和客服渠道。二维向量只用于核对公式，实际政策排序使用本地模型生成的 512 维向量。

程序把数值统一为 float32，即每个数值占 4 字节的 32 位浮点表示。NumPy 负责数组与矩阵计算，FastEmbed 负责实际文本编码，两者的职责不同。

::: details 查看本地嵌入、余弦排序与十二个验证用例

```python
# embeddings_similarity.py
from pathlib import Path

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


def load_model() -> TextEmbedding:
    """加载当前目录的完整中文 ONNX 模型，缺失文件时停止。

    Returns:
        使用两个 CPU 线程的 FastEmbed 模型；不调用在线嵌入接口。
    """
    if not Path("model/model_optimized.onnx").is_file():
        raise FileNotFoundError("prepare model directory first")
    return TextEmbedding(model_name=MODEL, specific_model_path="model",
                         providers=["CPUExecutionProvider"], threads=2)


def normalize_rows(vectors: np.ndarray, dimensions: int) -> np.ndarray:
    """校验二维非零向量矩阵，并把每行归一化为单位向量。

    Args:
        vectors: 每行一个向量，所有值必须有限，至少有一行。
        dimensions: 约定的正整数维度，必须与列数一致。

    Returns:
        float32 单位向量矩阵；维度错误、零向量或非有限值抛出异常。
    """
    matrix = np.asarray(vectors, dtype=np.float32)
    if (type(dimensions) is not int or dimensions <= 0 or matrix.ndim != 2
            or matrix.shape[0] == 0 or matrix.shape[1] != dimensions):
        raise ValueError("dimension_mismatch")
    if not np.isfinite(matrix).all():
        raise ValueError("non_finite_vector")
    lengths = np.linalg.norm(matrix, axis=1, keepdims=True)
    # 低于此数值的长度无法作为本演示中稳定的归一化分母。
    if (lengths <= 1e-12).any() or not np.isfinite(lengths).all():
        raise ValueError("zero_or_invalid_norm")
    return matrix / lengths


def embed_texts(model: TextEmbedding, texts: list[str], is_query: bool = False) -> np.ndarray:
    """按本篇固定查询规则编码短文本，再校验和归一化。

    Args:
        model: load_model 返回的同一个 BGE 模型实例。
        texts: 非空字符串列表；本演示限制每条不超过 180 个 Unicode 字符。
        is_query: True 时添加 BGE 查询前缀，文档保持原文。

    Returns:
        与输入顺序对应的 N×512 float32 单位向量矩阵。
    """
    if not texts or any(type(text) is not str or not text.strip() or len(text) > 180 for text in texts):
        raise ValueError("invalid_demo_text")
    inputs = [QUERY_PREFIX + text if is_query else text for text in texts]
    vectors = normalize_rows(np.asarray(list(model.embed(inputs))), DIMENSIONS)
    if vectors.shape[0] != len(texts):
        raise ValueError("embedding_count_mismatch")
    return vectors


def run_demo() -> None:
    """验证十二项数学、真实嵌入、排序与异常行为，输出当前演示结果。"""
    arithmetic = normalize_rows(np.array([[3, 4], [0, 5]]), 2)
    assert np.allclose(arithmetic @ np.array([0, 1]), [0.8, 1.0])
    model = load_model()
    documents = embed_texts(model, [text for _, text in PASSAGES])
    query = embed_texts(model, ["标准配送在发货后需要几个工作日？"], True)[0]
    assert documents.shape == (3, DIMENSIONS) and query.shape == (DIMENSIONS,)
    assert np.allclose(np.linalg.norm(documents, axis=1), 1.0, atol=1e-5)
    scores = documents @ query
    assert np.isfinite(scores).all() and (np.abs(scores) <= 1.00001).all()
    ranking = np.argsort(-scores, kind="stable")
    assert PASSAGES[int(ranking[0])][0] == "shipping-policy"
    cosine = (documents @ query) / (np.linalg.norm(documents, axis=1) * np.linalg.norm(query))
    assert np.allclose(scores, cosine, atol=1e-5)
    scaled_query = query * 3
    scaled_cosine = (documents @ scaled_query) / (np.linalg.norm(documents, axis=1) * np.linalg.norm(scaled_query))
    assert np.allclose(scores, scaled_cosine, atol=1e-5)
    failures = [
        (np.zeros((1, 2)), 2, "zero_or_invalid_norm"),
        (np.array([[np.nan, 1]]), 2, "non_finite_vector"),
        (documents, 384, "dimension_mismatch"),
    ]
    for vectors, dimensions, reason in failures:
        try:
            normalize_rows(vectors, dimensions)
        except ValueError as error:
            assert str(error) == reason
        else:
            raise AssertionError("invalid vector accepted")
    for texts in ([" "], ["配" * 181]):
        try:
            embed_texts(model, texts)
        except ValueError as error:
            assert str(error) == "invalid_demo_text"
        else:
            raise AssertionError("invalid text accepted")
    print("embedding_tests=passed cases=12")
    print(f"model={MODEL}")
    print(f"dimensions={DIMENSIONS} passages=3 top={PASSAGES[int(ranking[0])][0]}")


if __name__ == "__main__":
    run_demo()
```

:::

180 字符是本篇短文本夹具的输入约束，不是模型的 Token 限制，也不是通用切分长度。真实长文档需要使用实际分词器判断输入长度并保留来源范围。

### 3. 执行与结果

运行当前文件：

```powershell
.\.venv\Scripts\python.exe embeddings_similarity.py
```

通过时输出如下，模型启动还可能输出 ONNX Runtime 的环境提示：

```text
embedding_tests=passed cases=12
model=BAAI/bge-small-zh-v1.5
dimensions=512 passages=3 top=shipping-policy
```

十二项验证包含二维公式、真实向量形状、单位长度、有效分数、首位候选、点积与余弦等价、缩放不改变余弦、零向量、NaN、维度不匹配、空文本和超出演示长度。首位结果只说明这一个查询在三条政策中的排序符合预期，不能作为整体召回率或回答正确率。

## 四、异常与模型变更

| 现象 | 原因与证据 | 处理 |
|------|------------|------|
| 找不到模型或分词器 | 下载失败、解压层级错误、只复制了权重 | 检查命令状态，重新准备完整 `model/` |
| 维度不匹配 | 文档与查询使用了不同配置 | 对照模型和索引契约，拒绝混用后重算 |
| 同维度排序异常 | 模型制品或查询规则改变 | 核对模型哈希、分词器及输入处理，重新评测 |
| 长文生成向量但关键事实未召回 | 编码输入被截断或片段主题过多 | 检查实际 Token 与原文范围，调整切分 |
| 无关内容也有较高分数 | 当前模型的分数分布不是概率 | 用有标签的业务查询检查相对排序与阈值 |

本例完成真实本地嵌入和精确分数计算。它没有评测大规模检索、语言迁移、领域偏差或回答事实支持，也没有把手写数学夹具作为模型质量证据。

## 五、参考资料

- [BGE 中文模型说明](https://huggingface.co/BAAI/bge-small-zh-v1.5)：模型、查询指令、长度与分数边界。
- [FastEmbed 模型清单](https://qdrant.github.io/fastembed/examples/Supported_Models/)：支持的维度、语言与模型类型。
- [FastEmbed 0.7.4](https://pypi.org/project/fastembed/0.7.4/)：本篇固定依赖版本。
- [FastEmbed 0.7.4 模型登记](https://github.com/qdrant/fastembed/blob/v0.7.4/fastembed/text/onnx_embedding.py)：本篇 ONNX 制品与备用下载源。
- [NumPy 2.2 norm](https://numpy.org/doc/2.2/reference/generated/numpy.linalg.norm.html)：向量长度与按行计算。
- [NumPy 2.2 dot](https://numpy.org/doc/2.2/reference/generated/numpy.dot.html)：点积与矩阵运算。
