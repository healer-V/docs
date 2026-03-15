---
title: "RAG 检索增强生成"
category: "AI · LangChain"
tags:
  - RAG
  - 向量数据库
  - LangChain
excerpt: "RAG 通过检索外部知识库增强大语言模型的生成能力，有效解决模型幻觉和知识时效性问题。"
date: 2026-03-15
---

# RAG 检索增强生成

RAG（Retrieval-Augmented Generation，检索增强生成）是当前 LLM 应用中最重要的技术模式之一。它通过在生成回答前先从外部知识库中检索相关信息，将检索到的内容作为上下文提供给模型，从而显著提升回答的准确性和时效性。

## 一、什么是 RAG

### 1. 核心问题

大语言模型存在两个根本性限制：

- **知识截止**：模型的训练数据有时间截止点，无法回答训练数据之后的问题
- **模型幻觉**：当模型缺乏相关知识时，可能会"编造"看似合理但实际错误的回答

RAG 通过引入外部知识库来解决这两个问题，让模型基于真实数据生成回答。

### 2. RAG 与微调的对比

| 维度 | RAG | 微调（Fine-tuning） |
|------|-----|---------------------|
| 知识更新 | 只需更新知识库，实时生效 | 需要重新训练模型，成本高 |
| 开发成本 | 较低，无需 GPU 资源 | 较高，需要大量训练数据和算力 |
| 可解释性 | 高，可追溯回答来源 | 低，知识内化在模型参数中 |
| 适用场景 | 知识密集型问答、文档检索 | 风格调整、特定任务优化 |
| 准确性 | 依赖检索质量 | 依赖训练数据质量 |

::: tip 实践建议
在大多数企业场景中，RAG 是首选方案。它不需要训练模型，知识更新成本低，并且可以清晰地追溯每个回答的信息来源。只有当 RAG 无法满足需求时（如需要模型学习特定的回答风格），才考虑微调。
:::

## 二、RAG 架构

一个完整的 RAG 系统包含两个阶段：**索引阶段**和**查询阶段**。

### 1. 索引阶段（离线处理）

索引阶段将原始文档处理为可检索的向量数据，包括以下步骤：

1. **文档加载**：从各种数据源（PDF、网页、数据库等）读取原始文档
2. **文本分割**：将长文档切分为合适大小的文本块（Chunk）
3. **向量嵌入**：使用 Embedding 模型将文本块转换为向量表示
4. **向量存储**：将向量和原始文本存入向量数据库

### 2. 查询阶段（在线处理）

查询阶段根据用户问题从知识库中检索相关内容并生成回答：

1. **问题向量化**：将用户的问题转换为向量
2. **相似度检索**：在向量数据库中查找与问题最相似的文本块
3. **上下文组装**：将检索到的文本块拼接为上下文
4. **LLM 生成**：将上下文和用户问题一起提交给 LLM 生成回答

## 三、文档加载

LangChain 提供了丰富的文档加载器（Document Loader），支持从各种数据源读取内容。

### 1. 常用加载器

| 加载器 | 数据源 | 安装依赖 |
|--------|--------|----------|
| `TextLoader` | 纯文本文件 | 无 |
| `PyPDFLoader` | PDF 文件 | `pypdf` |
| `Docx2txtLoader` | Word 文档 | `docx2txt` |
| `CSVLoader` | CSV 文件 | 无 |
| `WebBaseLoader` | 网页 | `beautifulsoup4` |
| `DirectoryLoader` | 整个目录 | 无 |

### 2. 加载文档示例

::: details 加载不同类型的文档

```python
# src/rag/document_loader.py
from langchain_community.document_loaders import (
    TextLoader,
    PyPDFLoader,
    WebBaseLoader,
    DirectoryLoader
)

# 加载单个文本文件
text_loader = TextLoader("./data/company_handbook.txt", encoding="utf-8")
text_docs = text_loader.load()
print(f"文本文件加载了 {len(text_docs)} 个文档")

# 加载 PDF 文件（每页作为一个文档）
pdf_loader = PyPDFLoader("./data/technical_report.pdf")
pdf_docs = pdf_loader.load()
print(f"PDF 加载了 {len(pdf_docs)} 页")

# 加载网页内容
web_loader = WebBaseLoader("https://docs.python.org/3/tutorial/index.html")
web_docs = web_loader.load()
print(f"网页加载了 {len(web_docs)} 个文档")

# 加载整个目录下的所有 .md 文件
dir_loader = DirectoryLoader(
    "./data/docs/",
    glob="**/*.md",
    loader_cls=TextLoader,
    loader_kwargs={"encoding": "utf-8"}
)
dir_docs = dir_loader.load()
print(f"目录加载了 {len(dir_docs)} 个文档")
```

:::

## 四、文本分割

文档加载后通常是大段的文本，需要切分为适当大小的块（Chunk）。分块策略直接影响检索质量。

### 1. 分割策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| `RecursiveCharacterTextSplitter` | 按层级分隔符递归分割 | 通用文本，最常用 |
| `CharacterTextSplitter` | 按单一分隔符分割 | 结构简单的文本 |
| `MarkdownHeaderTextSplitter` | 按 Markdown 标题层级分割 | Markdown 文档 |
| `TokenTextSplitter` | 按 Token 数量分割 | 需要精确控制 Token 长度 |
| `HTMLHeaderTextSplitter` | 按 HTML 标签层级分割 | HTML 文档 |

### 2. 分割参数调优

文本分割的两个关键参数：

- **chunk_size**：每个块的最大字符数。太大会导致检索不精确，太小会丢失上下文
- **chunk_overlap**：相邻块的重叠字符数。适当的重叠可以避免在块边界处丢失关键信息

::: warning 分割大小建议
- 通用问答场景：`chunk_size=500`，`chunk_overlap=100`
- 代码文档场景：`chunk_size=1000`，`chunk_overlap=200`
- 精确检索场景：`chunk_size=300`，`chunk_overlap=50`

具体数值需要根据你的数据和业务场景进行实验调优。
:::

### 3. 分割示例

::: details 使用 RecursiveCharacterTextSplitter

```python{5-10,15}
# src/rag/text_splitter.py
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader

# 创建文本分割器
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,       # 每个块最多 500 个字符
    chunk_overlap=100,    # 相邻块重叠 100 个字符
    separators=["\n\n", "\n", "。", "，", " ", ""],  # 中文优化的分隔符
    length_function=len
)

# 加载并分割文档
loader = PyPDFLoader("./data/technical_report.pdf")
chunks = loader.load_and_split(text_splitter=splitter)

print(f"分割后得到 {len(chunks)} 个文本块")
for i, chunk in enumerate(chunks[:3]):
    print(f"\n--- 块 {i+1} (长度: {len(chunk.page_content)}) ---")
    print(chunk.page_content[:200])
    print(f"元数据: {chunk.metadata}")
```

:::

## 五、向量嵌入

向量嵌入（Embedding）是将文本转换为高维向量的过程，语义相似的文本在向量空间中距离更近。

### 1. 常用 Embedding 模型

| 模型 | 提供商 | 维度 | 特点 |
|------|--------|------|------|
| `text-embedding-3-small` | OpenAI | 1536 | 性价比高，适合大部分场景 |
| `text-embedding-3-large` | OpenAI | 3072 | 精度更高，成本更高 |
| `BAAI/bge-large-zh` | HuggingFace | 1024 | 中文效果优秀，可本地部署 |
| `moka-ai/m3e-base` | HuggingFace | 768 | 中文轻量模型，适合资源受限场景 |

### 2. 生成 Embedding

::: details 使用 OpenAI Embedding

```python
# src/rag/embedding.py
from langchain_openai import OpenAIEmbeddings

# 初始化 Embedding 模型
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# 为单个文本生成向量
query_vector = embeddings.embed_query("什么是 React 的虚拟 DOM？")
print(f"向量维度: {len(query_vector)}")  # 输出: 1536

# 批量生成向量
texts = [
    "React 使用虚拟 DOM 来优化渲染性能",
    "Vue 3 使用 Proxy 实现响应式系统",
    "Angular 采用脏检查机制检测数据变化"
]
doc_vectors = embeddings.embed_documents(texts)
print(f"生成了 {len(doc_vectors)} 个文档向量")
```

:::

## 六、向量存储

向量数据库用于存储文本块的向量表示，并支持高效的相似度检索。

### 1. 主流向量数据库

| 数据库 | 类型 | 特点 | 适用场景 |
|--------|------|------|----------|
| **Chroma** | 嵌入式 | 轻量、零配置、支持持久化 | 开发测试、小规模应用 |
| **FAISS** | 内存库 | Meta 出品、检索速度极快 | 大规模高性能检索 |
| **Pinecone** | 云服务 | 全托管、自动扩缩 | 生产环境、免运维需求 |
| **Milvus** | 分布式 | 开源、支持水平扩展 | 企业级大规模场景 |
| **Weaviate** | 云/自部署 | 内置向量化、GraphQL 接口 | 需要混合搜索的场景 |

### 2. 使用 Chroma

Chroma 是最适合入门和开发测试的向量数据库，无需额外部署。

::: details Chroma 完整示例

```python{12-17,20-24}
# src/rag/vector_store_chroma.py
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import DirectoryLoader, TextLoader

# 1. 加载文档
loader = DirectoryLoader("./data/knowledge_base/", glob="**/*.md", loader_cls=TextLoader)
documents = loader.load()

# 2. 分割文档
splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
chunks = splitter.split_documents(documents)
print(f"共 {len(chunks)} 个文本块")

# 3. 创建向量存储（自动生成 Embedding 并存储）
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vector_store = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./data/chroma_db",  # 持久化到磁盘
    collection_name="knowledge_base"
)

# 4. 相似度检索
query = "Vue 3 的响应式原理是什么？"
results = vector_store.similarity_search(query, k=3)  # 返回最相似的 3 个文本块

for i, doc in enumerate(results):
    print(f"\n--- 结果 {i+1} ---")
    print(f"内容: {doc.page_content[:200]}")
    print(f"来源: {doc.metadata.get('source', '未知')}")
```

:::

### 3. 使用 FAISS

FAISS 是 Meta 开源的高性能向量检索库，适合对检索速度有较高要求的场景。

::: details FAISS 完整示例

```python
# src/rag/vector_store_faiss.py
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader

# 加载并分割文档
loader = PyPDFLoader("./data/api_documentation.pdf")
splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
chunks = loader.load_and_split(text_splitter=splitter)

# 创建 FAISS 向量存储
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vector_store = FAISS.from_documents(chunks, embeddings)

# 保存到本地
vector_store.save_local("./data/faiss_index")

# 从本地加载（后续使用无需重新计算 Embedding）
loaded_store = FAISS.load_local(
    "./data/faiss_index",
    embeddings,
    allow_dangerous_deserialization=True
)

# 带分数的相似度检索
results_with_scores = loaded_store.similarity_search_with_score("如何处理 API 错误？", k=5)
for doc, score in results_with_scores:
    print(f"[相似度: {score:.4f}] {doc.page_content[:100]}")
```

:::

## 七、构建检索链

将前面的组件组合在一起，构建完整的 RAG 检索链。

### 1. 基础 RAG 链

::: details 完整的 RAG 问答链

```python{18-24,27-33}
# src/rag/rag_chain.py
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

# 初始化组件
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
chat_model = ChatOpenAI(model="gpt-4o", temperature=0)

# 加载已有的向量存储
vector_store = Chroma(
    persist_directory="./data/chroma_db",
    embedding_function=embeddings
)

# 创建检索器
retriever = vector_store.as_retriever(
    search_type="similarity",
    search_kwargs={
        "k": 4  # 返回最相关的 4 个文本块
    }
)

# 定义 RAG 提示词模板
rag_prompt = ChatPromptTemplate.from_template("""
你是一位专业的技术顾问。请根据以下参考资料回答用户的问题。
如果参考资料中没有相关信息，请明确告知用户你无法从现有资料中找到答案。

参考资料：
{context}

用户问题：{question}

请给出准确、详细的回答：
""")

# 辅助函数：将检索到的文档格式化为字符串
def format_docs(docs):
    return "\n\n---\n\n".join(
        f"[来源: {doc.metadata.get('source', '未知')}]\n{doc.page_content}"
        for doc in docs
    )

# 组装 RAG 链
rag_chain = (
    {
        "context": retriever | format_docs,
        "question": RunnablePassthrough()
    }
    | rag_prompt
    | chat_model
    | StrOutputParser()
)

# 使用 RAG 链回答问题
question = "Vue 3 的 Composition API 如何管理组件状态？"
answer = rag_chain.invoke(question)
print(answer)
```

:::

### 2. 带来源引用的 RAG 链

在实际应用中，用户往往需要知道回答的信息来源，以便验证准确性。

::: details 返回来源引用的 RAG 链

```python{15-22,35-42}
# src/rag/rag_with_sources.py
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
chat_model = ChatOpenAI(model="gpt-4o", temperature=0)

vector_store = Chroma(
    persist_directory="./data/chroma_db",
    embedding_function=embeddings
)

retriever = vector_store.as_retriever(search_kwargs={"k": 4})

rag_prompt = ChatPromptTemplate.from_template("""
根据以下参考资料回答问题。请以 JSON 格式返回，包含两个字段：
- answer：完整的回答内容
- sources：引用的参考资料来源列表

参考资料：
{context}

问题：{question}
""")

def format_docs_with_id(docs):
    formatted = []
    for i, doc in enumerate(docs):
        source = doc.metadata.get("source", f"文档 {i+1}")
        formatted.append(f"[{source}]\n{doc.page_content}")
    return "\n\n---\n\n".join(formatted)

def retrieve_and_answer(question: str):
    """检索相关文档并生成带来源的回答"""
    # 检索相关文档
    relevant_docs = retriever.invoke(question)

    # 格式化上下文
    context = format_docs_with_id(relevant_docs)

    # 生成回答
    chain = rag_prompt | chat_model | JsonOutputParser()
    result = chain.invoke({"context": context, "question": question})

    return result

# 使用示例
result = retrieve_and_answer("如何优化 Webpack 打包速度？")
print(f"回答：{result['answer']}")
print(f"\n参考来源：")
for source in result["sources"]:
    print(f"  - {source}")
```

:::

### 3. 对话式 RAG

将 RAG 与对话记忆结合，支持多轮问答，用户可以基于上一轮回答继续追问。

::: details 带对话记忆的 RAG 链

```python
# src/rag/conversational_rag.py
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.runnables import RunnablePassthrough

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
chat_model = ChatOpenAI(model="gpt-4o", temperature=0)
vector_store = Chroma(persist_directory="./data/chroma_db", embedding_function=embeddings)
retriever = vector_store.as_retriever(search_kwargs={"k": 3})

# 问题重写提示词：将对话中的指代词替换为具体含义
contextualize_prompt = ChatPromptTemplate.from_messages([
    ("system", "根据聊天记录，将用户最新的问题重写为一个独立、完整的问题。"
               "不要回答问题，只进行重写。如果问题已经是独立的，原样返回。"),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{input}")
])

# RAG 回答提示词
answer_prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一位技术助手。请根据以下参考资料回答问题。\n\n参考资料：\n{context}"),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{input}")
])

session_store = {}

def get_session_history(session_id: str):
    if session_id not in session_store:
        session_store[session_id] = InMemoryChatMessageHistory()
    return session_store[session_id]

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

# 组装链：先重写问题，再检索，最后生成回答
rewrite_chain = contextualize_prompt | chat_model | StrOutputParser()

def retrieve_with_rewrite(input_dict):
    rewritten_question = rewrite_chain.invoke(input_dict)
    docs = retriever.invoke(rewritten_question)
    return format_docs(docs)

rag_chain = (
    RunnablePassthrough.assign(context=retrieve_with_rewrite)
    | answer_prompt
    | chat_model
    | StrOutputParser()
)

conversational_rag = RunnableWithMessageHistory(
    rag_chain,
    get_session_history,
    input_messages_key="input",
    history_messages_key="history"
)

# 多轮对话演示
config = {"configurable": {"session_id": "session_001"}}

answer1 = conversational_rag.invoke({"input": "Vite 有哪些核心特性？"}, config=config)
print(f"回答 1：{answer1}\n")

answer2 = conversational_rag.invoke({"input": "它和 Webpack 相比有什么优势？"}, config=config)
print(f"回答 2：{answer2}")
# "它" 会被重写为 "Vite"，确保检索到正确的文档
```

:::

## 八、RAG 优化策略

基础 RAG 在实际应用中可能遇到检索不准确、回答质量不稳定等问题。以下是常见的优化方向。

### 1. 检索优化

| 优化策略 | 说明 | 效果 |
|----------|------|------|
| 混合检索 | 向量检索 + 关键词检索（BM25）结合 | 兼顾语义理解和精确匹配 |
| 重排序（Rerank） | 检索后用 Rerank 模型重新排序结果 | 显著提升 Top-K 的相关性 |
| 多查询检索 | 用 LLM 将原始问题改写为多个变体分别检索 | 提升召回率 |
| 父文档检索 | 用小块检索，返回所在的大块上下文 | 保留更完整的上下文 |

### 2. 分块优化

::: warning 分块策略的重要性
分块是 RAG 系统中最容易被忽视但影响最大的环节。不合理的分块会直接导致：
- 块太大：检索结果不精确，包含大量无关内容
- 块太小：丢失上下文，模型无法生成连贯回答
- 边界不当：关键信息被切断，分布在两个块中

建议针对你的数据特点进行多组实验，选择最优的分块参数。
:::

### 3. 提示词优化

良好的 RAG 提示词应该包含以下要素：

- 明确指示模型基于参考资料回答
- 要求模型在资料不足时明确说明
- 指定回答的格式和详细程度
- 要求标注信息来源

## 九、总结

本章完整介绍了 RAG 系统的构建流程和优化策略，关键要点如下：

| 环节 | 核心工具 | 关键参数 |
|------|----------|----------|
| 文档加载 | `PyPDFLoader`、`DirectoryLoader` | 数据源类型、编码格式 |
| 文本分割 | `RecursiveCharacterTextSplitter` | `chunk_size`、`chunk_overlap` |
| 向量嵌入 | `OpenAIEmbeddings` | 模型选择、向量维度 |
| 向量存储 | Chroma、FAISS | 持久化路径、检索参数 |
| 检索链 | LCEL 组合 | Top-K、检索类型 |

::: tip 下一步
在掌握了基础 RAG 之后，你可以进一步探索 Agent 工具调用、多模态 RAG（处理图片和表格）、以及 Graph RAG（基于知识图谱的检索）等高级主题。
:::
