---
title: "LangChain LCEL 与链构建"
category: "AI · LangChain"
tags:
  - LangChain
  - LCEL
  - Chain
  - Runnable
date: 2026-03-17
excerpt: "系统讲解 LangChain Expression Language（LCEL）的管道操作符、Runnable 接口体系、流式输出、批处理以及 LangSmith 追踪调试的完整实践。"
---

# LangChain LCEL 与链构建

LCEL（LangChain Expression Language）是 LangChain v0.1 引入的声明式链构建方式，通过 `|` 管道操作符将各组件串联，实现流式、批处理、异步等能力的统一接口。

## 一、LCEL 核心概念

### 1. 管道操作符（|）

`|` 操作符将左侧组件的输出作为右侧组件的输入，构成一个可执行的链（Chain）。

```python
# 最简单的链：Prompt | LLM | 输出解析器
chain = prompt | llm | output_parser

# 等价于
output = output_parser.invoke(llm.invoke(prompt.invoke(input)))
```

### 2. 所有组件都是 Runnable

LCEL 的核心是 `Runnable` 接口，所有组件（LLM、Prompt、工具、解析器）都实现了这个接口：

| 方法 | 说明 |
|------|------|
| `invoke(input)` | 单次同步调用 |
| `ainvoke(input)` | 单次异步调用 |
| `stream(input)` | 同步流式输出 |
| `astream(input)` | 异步流式输出 |
| `batch(inputs)` | 批量同步调用 |
| `abatch(inputs)` | 批量异步调用 |

::: details LCEL 基础链构建示例

```python
# src/langchain/lcel/basic_chain.py
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o", temperature=0)

# --- 基础链：问答链 ---
qa_prompt = ChatPromptTemplate.from_template(
    "用简洁的中文回答以下问题，不超过3句话：\n\n{question}"
)
qa_chain = qa_prompt | llm | StrOutputParser()

result = qa_chain.invoke({"question": "什么是向量数据库？"})
print(result)

# --- 带 JSON 输出的链 ---
from pydantic import BaseModel
from typing import List

class MovieReview(BaseModel):
    title: str
    rating: float  # 1-10
    pros: List[str]
    cons: List[str]

review_prompt = ChatPromptTemplate.from_template("""
分析电影《{movie_name}》，以 JSON 格式输出：
- title: 电影名
- rating: 评分（1-10）
- pros: 优点列表
- cons: 缺点列表
""")

review_chain = review_prompt | llm | JsonOutputParser(pydantic_object=MovieReview)
review = review_chain.invoke({"movie_name": "星际穿越"})
print(f"评分: {review['rating']}")
```
:::

---

## 二、Runnable 组合工具

### 1. RunnableParallel

`RunnableParallel` 并行执行多个子链，将各自结果合并为字典输出。

::: details RunnableParallel 并行执行示例

```python
# src/langchain/lcel/parallel_chain.py
from langchain_core.runnables import RunnableParallel, RunnablePassthrough
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")

# 并行生成摘要和关键词
summarize_prompt = ChatPromptTemplate.from_template(
    "用3句话总结以下文本：\n{text}"
)
keywords_prompt = ChatPromptTemplate.from_template(
    "从以下文本提取5个关键词，用逗号分隔：\n{text}"
)

# 两条链并行执行，节省时间
parallel_chain = RunnableParallel(
    summary=summarize_prompt | llm | StrOutputParser(),
    keywords=keywords_prompt | llm | StrOutputParser(),
    original=RunnablePassthrough()  # 透传原始输入
)

result = parallel_chain.invoke({
    "text": "大语言模型（LLM）是基于 Transformer 架构的深度学习模型..."
})

print("摘要:", result["summary"])
print("关键词:", result["keywords"])
print("原文长度:", len(result["original"]["text"]))
```
:::

### 2. RunnableLambda

`RunnableLambda` 将任意 Python 函数包装为 `Runnable`，用于在链中插入自定义逻辑。

::: details RunnableLambda 自定义处理步骤

```python
# src/langchain/lcel/lambda_chain.py
from langchain_core.runnables import RunnableLambda
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")

# 将 Python 函数包装为 Runnable
def preprocess_text(input_data: dict) -> dict:
    """预处理：清理文本并截断超长内容"""
    text = input_data.get("text", "").strip()
    # 截断超过 2000 字的文本
    if len(text) > 2000:
        text = text[:2000] + "...[已截断]"
    return {"text": text, "length": len(text)}

def postprocess_output(output: str) -> dict:
    """后处理：格式化输出并添加元数据"""
    return {
        "result": output,
        "word_count": len(output.split()),
        "status": "success"
    }

preprocess = RunnableLambda(preprocess_text)
postprocess = RunnableLambda(postprocess_output)

prompt = ChatPromptTemplate.from_template("分析以下文本（共 {length} 字）：\n{text}")

chain = preprocess | prompt | llm | StrOutputParser() | postprocess

result = chain.invoke({"text": "这是一段需要分析的很长的文本内容..."})
print(result)
# {"result": "...", "word_count": 150, "status": "success"}
```
:::

### 3. RunnablePassthrough

`RunnablePassthrough` 透传输入数据，常用于在并行链中保留原始输入，或在链的某一步添加/合并字段。

::: details RunnablePassthrough 使用场景

```python
# src/langchain/lcel/passthrough_chain.py
from langchain_core.runnables import RunnableParallel, RunnablePassthrough
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 场景：RAG 链中同时传递 question 和 context
def retrieve_context(query: str) -> str:
    """模拟从向量数据库检索相关文档"""
    return "相关文档内容：向量数据库是一种..."

retrieve = RunnablePassthrough.assign(
    context=lambda x: retrieve_context(x["question"])
)

rag_prompt = ChatPromptTemplate.from_template("""
根据以下上下文回答问题：

上下文：{context}

问题：{question}

回答：
""")

llm = ChatOpenAI(model="gpt-4o")

rag_chain = (
    retrieve         # 输入: {"question": "..."} → 输出: {"question": "...", "context": "..."}
    | rag_prompt     # 使用 question 和 context 构建 Prompt
    | llm
    | StrOutputParser()
)

result = rag_chain.invoke({"question": "什么是向量数据库？"})
```
:::

---

## 三、流式输出

### 1. 同步流式（stream）

流式输出允许在模型生成的同时逐步返回内容，显著改善用户体验。

::: details 同步流式输出示例

```python
# src/langchain/lcel/streaming.py
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o", streaming=True)
prompt = ChatPromptTemplate.from_template("写一篇关于{topic}的200字介绍。")
chain = prompt | llm | StrOutputParser()

# --- 同步流式 ---
print("开始生成：", end="", flush=True)
for chunk in chain.stream({"topic": "量子计算"}):
    print(chunk, end="", flush=True)
print()  # 换行

# --- 流式输出并收集完整结果 ---
full_output = ""
for chunk in chain.stream({"topic": "人工智能"}):
    full_output += chunk
    # 实时展示（Web 场景中发送 SSE 事件）
    print(chunk, end="", flush=True)
```
:::

### 2. 异步流式（astream）

Web 应用场景（FastAPI/Flask）中，使用异步流式输出：

::: details FastAPI 集成异步流式输出

```python
# src/api/streaming_endpoint.py
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
import asyncio

app = FastAPI()
llm = ChatOpenAI(model="gpt-4o", streaming=True)
prompt = ChatPromptTemplate.from_template("{question}")
chain = prompt | llm | StrOutputParser()

async def generate_stream(question: str):
    """异步生成器，逐块产出内容"""
    async for chunk in chain.astream({"question": question}):
        # SSE 格式：data: <内容>\n\n
        yield f"data: {chunk}\n\n"
    yield "data: [DONE]\n\n"  # 结束标记

@app.get("/chat/stream")
async def chat_stream(question: str):
    return StreamingResponse(
        generate_stream(question),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"  # 禁用 Nginx 缓冲
        }
    )

# 前端 JavaScript 接收示例：
# const eventSource = new EventSource('/chat/stream?question=你好');
# eventSource.onmessage = (e) => {
#   if (e.data === '[DONE]') { eventSource.close(); return; }
#   document.getElementById('output').textContent += e.data;
# };
```
:::

### 3. astream_events（事件流）

`astream_events` 返回链中每个步骤的详细事件，适合调试复杂链：

::: details astream_events 监听链事件

```python
# src/langchain/lcel/stream_events.py
import asyncio
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-4o")
chain = ChatPromptTemplate.from_template("{input}") | llm | StrOutputParser()

async def monitor_chain():
    async for event in chain.astream_events(
        {"input": "解释一下梯度下降"},
        version="v2"
    ):
        kind = event["event"]
        if kind == "on_chat_model_stream":
            # LLM 生成的每个 Token
            chunk = event["data"]["chunk"].content
            print(chunk, end="", flush=True)
        elif kind == "on_chain_start":
            print(f"\n[链开始] {event['name']}")
        elif kind == "on_chain_end":
            print(f"\n[链结束] {event['name']}")

asyncio.run(monitor_chain())
```
:::

---

## 四、批处理（batch）

### 1. 批量调用原理

`batch` 方法并发处理多个输入，默认使用线程池，可通过 `max_concurrency` 控制并发数。

::: details 批处理与性能对比

```python
# src/langchain/lcel/batch_processing.py
import time
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
prompt = ChatPromptTemplate.from_template("将以下词翻译为英文：{word}")
chain = prompt | llm | StrOutputParser()

words = ["苹果", "香蕉", "橙子", "葡萄", "西瓜", "草莓", "蓝莓", "芒果"]

# --- 串行调用 ---
start = time.time()
serial_results = [chain.invoke({"word": w}) for w in words]
serial_time = time.time() - start
print(f"串行耗时：{serial_time:.2f}s")

# --- 批量调用（并发）---
start = time.time()
batch_inputs = [{"word": w} for w in words]
batch_results = chain.batch(
    batch_inputs,
    config={"max_concurrency": 4}  # 最多同时 4 个请求
)
batch_time = time.time() - start
print(f"批量耗时：{batch_time:.2f}s（约 {serial_time/batch_time:.1f}x 加速）")

# --- 异步批量（性能最佳）---
import asyncio

async def async_batch():
    start = time.time()
    results = await chain.abatch(
        batch_inputs,
        config={"max_concurrency": 8}
    )
    print(f"异步批量耗时：{time.time() - start:.2f}s")
    return results

asyncio.run(async_batch())
```
:::

---

## 五、LangSmith 追踪调试

### 1. 快速接入

LangSmith 是 LangChain 官方提供的 LLM 可观测性平台，无需修改代码即可追踪所有链的执行详情。

```bash
# 设置环境变量即可启用
export LANGCHAIN_TRACING_V2=true
export LANGCHAIN_API_KEY=<your_api_key>
export LANGCHAIN_PROJECT=my-project-name  # 可选，默认为 "default"
```

::: details LangSmith 调试与评估示例

```python
# src/langchain/debug/langsmith_tracing.py
import os
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
from langchain_core.tracers import LangChainTracer
from langsmith import Client

# 方式一：环境变量全局开启（推荐）
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "your_api_key"

llm = ChatOpenAI(model="gpt-4o")
chain = ChatPromptTemplate.from_template("{input}") | llm | StrOutputParser()

# 每次调用都会自动追踪到 LangSmith
result = chain.invoke(
    {"input": "解释 LCEL 的优势"},
    config={
        "run_name": "explain-lcel",   # 自定义运行名称
        "tags": ["production", "v2"], # 标签便于筛选
        "metadata": {"user_id": "u_123", "session": "s_456"}  # 附加元数据
    }
)

# 方式二：在特定调用中临时开启追踪
tracer = LangChainTracer(project_name="debug-session")
result = chain.invoke(
    {"input": "什么是 RAG？"},
    config={"callbacks": [tracer]}
)

# --- 使用 LangSmith Client 读取追踪数据 ---
client = Client()

# 获取最近的运行记录
runs = list(client.list_runs(
    project_name="my-project-name",
    run_type="chain",
    limit=10
))

for run in runs:
    print(f"运行名：{run.name}")
    print(f"状态：{'成功' if run.error is None else '失败'}")
    print(f"耗时：{(run.end_time - run.start_time).total_seconds():.2f}s")
    print(f"Token 用量：{run.total_tokens}")
```
:::

### 2. 追踪信息说明

| 信息项 | 用途 |
|--------|------|
| 输入/输出 | 查看每步的数据流 |
| 延迟分解 | 定位链中的性能瓶颈 |
| Token 用量 | 监控和优化成本 |
| 错误追踪 | 快速定位失败原因 |
| 运行对比 | A/B 测试不同版本 |

---

## 六、自定义 Chain 实现

### 1. 使用 LCEL 组合自定义链

::: details 构建完整的 RAG 链

```python
# src/langchain/chains/rag_chain.py
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

# 构建向量存储（模拟）
def build_vectorstore():
    embeddings = OpenAIEmbeddings()
    docs = [
        Document(page_content="LangChain 是一个用于构建 LLM 应用的框架"),
        Document(page_content="LCEL 使用管道操作符连接各组件"),
        Document(page_content="RAG 通过检索外部文档增强模型回答质量"),
    ]
    return FAISS.from_documents(docs, embeddings)

vectorstore = build_vectorstore()
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

# 格式化检索到的文档
def format_docs(docs: list) -> str:
    return "\n\n".join(f"[文档{i+1}] {doc.page_content}" for i, doc in enumerate(docs))

# RAG Prompt
rag_prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个问答助手，根据提供的上下文回答问题。如果上下文中没有相关信息，请明确说明。"),
    ("human", """上下文：
{context}

问题：{question}""")
])

llm = ChatOpenAI(model="gpt-4o", temperature=0)

# 完整的 RAG 链
rag_chain = (
    RunnableParallel(
        context=retriever | RunnableLambda(format_docs),
        question=RunnablePassthrough()
    )
    | rag_prompt
    | llm
    | StrOutputParser()
)

# 使用（支持所有 Runnable 方法）
result = rag_chain.invoke("什么是 LCEL？")

# 流式输出
for chunk in rag_chain.stream("LangChain 有什么特点？"):
    print(chunk, end="", flush=True)
```
:::

### 2. 链的调试技巧

::: tip 使用 .with_config() 临时开启 verbose

```python
# 为特定链开启详细日志，无需全局设置
debug_chain = chain.with_config({"verbose": True, "run_name": "debug-run"})
result = debug_chain.invoke({"input": "测试输入"})
```
:::

::: details 添加中间步骤日志的 tap 模式

```python
# src/langchain/debug/chain_tap.py
from langchain_core.runnables import RunnableLambda

def tap(label: str):
    """在链的任意位置插入日志节点，不改变数据流"""
    def log_and_pass(data):
        print(f"[{label}] 类型: {type(data).__name__}")
        if isinstance(data, str):
            print(f"[{label}] 内容（前100字）: {data[:100]}")
        elif isinstance(data, dict):
            print(f"[{label}] Keys: {list(data.keys())}")
        return data  # 原样透传
    return RunnableLambda(log_and_pass)

# 在链中插入 tap 节点
debuggable_chain = (
    prompt
    | tap("prompt_output")   # 查看 Prompt 格式化后的结果
    | llm
    | tap("llm_output")      # 查看 LLM 原始输出
    | StrOutputParser()
    | tap("final_output")    # 查看最终字符串
)
```
:::
