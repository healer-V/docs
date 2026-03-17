---
title: "LangChain Agent 与工具使用"
category: "AI · LangChain"
tags:
  - LangChain
  - Agent
  - 工具
  - ReAct
date: 2026-03-17
excerpt: "深入讲解 LangChain Agent 的工具定义、内置工具、Agent 类型选择、AgentExecutor 配置，以及内存与状态管理的完整实践方案。"
---

# LangChain Agent 与工具使用

Agent 是 LangChain 中最强大的抽象层，它赋予 LLM 自主决策和使用工具的能力。本文从工具定义出发，系统讲解 Agent 的构建与配置。

## 一、Tool 定义

### 1. 使用 @tool 装饰器

`@tool` 装饰器是最简洁的工具定义方式，函数的 docstring 会自动成为工具描述，供 LLM 理解何时调用该工具。

::: tip 工具描述至关重要
LLM 依赖工具的描述来决定何时以及如何调用。描述应简洁准确，说明工具的用途、输入参数的含义和预期输出。
:::

::: details @tool 装饰器定义工具示例

```python
# src/langchain/tools/custom_tools.py
from langchain_core.tools import tool
from typing import Annotated
import httpx
import json

@tool
def get_stock_price(symbol: str) -> str:
    """
    获取指定股票的实时价格。

    Args:
        symbol: 股票代码，如 AAPL（苹果）、TSLA（特斯拉）、600519（贵州茅台）

    Returns:
        包含股票价格、涨跌幅的字符串
    """
    # 模拟 API 调用（实际中替换为真实股票 API）
    mock_data = {
        "AAPL": {"price": 182.5, "change": "+1.2%"},
        "TSLA": {"price": 245.3, "change": "-0.8%"},
    }
    data = mock_data.get(symbol.upper(), {"price": 0, "change": "N/A"})
    return f"{symbol}: 价格 ${data['price']}, 涨跌幅 {data['change']}"

@tool
def calculate_compound_interest(
    principal: Annotated[float, "本金（元）"],
    rate: Annotated[float, "年利率（小数，如 0.05 表示 5%）"],
    years: Annotated[int, "投资年数"],
) -> str:
    """
    计算复利收益，适用于评估长期投资回报。

    Returns:
        最终金额和总收益的详细计算结果
    """
    final_amount = principal * (1 + rate) ** years
    profit = final_amount - principal
    return (
        f"本金：{principal:,.0f} 元\n"
        f"年利率：{rate:.1%}，投资 {years} 年\n"
        f"最终金额：{final_amount:,.2f} 元\n"
        f"总收益：{profit:,.2f} 元（{profit/principal:.1%}）"
    )

# 查看工具元数据
print(get_stock_price.name)         # get_stock_price
print(get_stock_price.description)  # 获取指定股票的实时价格...
print(get_stock_price.args)         # {'symbol': {'title': 'Symbol', 'type': 'string'}}
```
:::

### 2. 自定义 Tool 类

当需要更复杂的工具逻辑（带状态、异步支持、自定义验证）时，继承 `BaseTool` 类。

::: details 继承 BaseTool 的自定义工具

```python
# src/langchain/tools/database_tool.py
from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field
from typing import Optional, Type
import sqlite3

class DatabaseQueryInput(BaseModel):
    """数据库查询工具的输入 Schema"""
    sql: str = Field(description="要执行的 SQL 查询语句（只允许 SELECT）")
    limit: int = Field(default=10, description="返回结果数量上限，最大 100", le=100)

class DatabaseQueryTool(BaseTool):
    """安全的数据库查询工具，只允许 SELECT 操作"""

    name: str = "database_query"
    description: str = (
        "查询 SQLite 数据库中的数据。"
        "只支持 SELECT 语句，不允许 INSERT/UPDATE/DELETE 等写操作。"
        "适用于查询用户数据、订单记录、产品信息等。"
    )
    args_schema: Type[BaseModel] = DatabaseQueryInput
    db_path: str = "data/app.db"

    def _run(self, sql: str, limit: int = 10) -> str:
        """同步执行（必须实现）"""
        # 安全检查：只允许 SELECT
        if not sql.strip().upper().startswith("SELECT"):
            return "错误：只允许执行 SELECT 查询"

        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(f"{sql.rstrip(';')} LIMIT {limit}")
            rows = cursor.fetchall()
            conn.close()

            if not rows:
                return "查询结果为空"

            # 格式化输出
            columns = rows[0].keys()
            result = [dict(row) for row in rows]
            return f"查询到 {len(result)} 条记录：\n{result}"

        except Exception as e:
            return f"查询失败：{str(e)}"

    async def _arun(self, sql: str, limit: int = 10) -> str:
        """异步执行（可选实现）"""
        import aiosqlite
        if not sql.strip().upper().startswith("SELECT"):
            return "错误：只允许执行 SELECT 查询"

        async with aiosqlite.connect(self.db_path) as conn:
            conn.row_factory = aiosqlite.Row
            async with conn.execute(f"{sql.rstrip(';')} LIMIT {limit}") as cursor:
                rows = await cursor.fetchall()
                return f"查询到 {len(rows)} 条记录"

# 实例化工具
db_tool = DatabaseQueryTool(db_path="data/production.db")
```
:::

---

## 二、内置工具

### 1. 常用内置工具清单

LangChain 提供了丰富的内置工具，安装对应依赖后即可使用：

| 工具 | 包 | 用途 |
|------|-----|------|
| `TavilySearchResults` | `langchain-community` | 联网搜索（推荐） |
| `DuckDuckGoSearchRun` | `langchain-community` | 免费搜索 |
| `WikipediaQueryRun` | `langchain-community` | 维基百科查询 |
| `Calculator` | `langchain-community` | 数学计算 |
| `PythonREPLTool` | `langchain-experimental` | Python 代码执行 |
| `ShellTool` | `langchain-community` | Shell 命令执行 |
| `RequestsGetTool` | `langchain-community` | HTTP GET 请求 |

::: danger PythonREPLTool 和 ShellTool 安全风险
这两个工具会在本地执行任意代码/命令，生产环境中必须在沙箱（Docker 容器）内运行，绝对不能直接暴露给不可信用户。
:::

::: details 内置工具使用示例

```python
# src/langchain/tools/builtin_tools.py
# 安装：pip install langchain-community tavily-python

from langchain_community.tools import TavilySearchResults, WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper
from langchain_experimental.tools import PythonREPLTool

# --- Tavily 搜索（需要 API Key）---
search_tool = TavilySearchResults(
    max_results=5,
    search_depth="advanced",  # basic 或 advanced
    include_raw_content=False,
)

result = search_tool.invoke("2026年最新的大语言模型排行榜")

# --- Wikipedia 查询 ---
wiki_api = WikipediaAPIWrapper(
    lang="zh",          # 中文维基
    top_k_results=2,    # 返回前2个结果
    doc_content_chars_max=500  # 每个结果最多500字
)
wiki_tool = WikipediaQueryRun(api_wrapper=wiki_api)

result = wiki_tool.invoke("神经网络")

# --- Python REPL（沙箱环境中使用）---
python_tool = PythonREPLTool()
result = python_tool.invoke("""
import pandas as pd
data = {'月份': ['1月', '2月', '3月'], '销售额': [15000, 18000, 22000]}
df = pd.DataFrame(data)
print(df.describe())
print(f"总销售额: {df['销售额'].sum():,}")
""")
```
:::

---

## 三、Agent 类型

### 1. 主流 Agent 类型对比

| Agent 类型 | 适用场景 | 特点 | 推荐程度 |
|-----------|---------|------|---------|
| ReAct Agent | 通用工具调用 | 推理与行动交织，可解释性强 | ★★★★★ |
| OpenAI Functions Agent | OpenAI 模型 + 工具 | 原生函数调用，稳定可靠 | ★★★★☆ |
| OpenAI Tools Agent | OpenAI 模型（推荐） | 支持并行工具调用 | ★★★★★ |
| Plan-and-Execute | 复杂多步骤任务 | 先规划再执行，适合长任务 | ★★★☆☆ |

### 2. 创建 ReAct Agent

::: details 使用 create_react_agent 创建 Agent

```python
# src/langchain/agents/react_agent.py
from langchain import hub
from langchain.agents import AgentExecutor, create_react_agent
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_community.tools import TavilySearchResults

# 1. 定义工具
@tool
def get_current_time() -> str:
    """获取当前日期和时间"""
    from datetime import datetime
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

search = TavilySearchResults(max_results=3)
tools = [search, get_current_time]

# 2. 初始化模型
llm = ChatOpenAI(model="gpt-4o", temperature=0)

# 3. 加载 ReAct Prompt 模板（或自定义）
prompt = hub.pull("hwchase17/react")

# 4. 创建 Agent
agent = create_react_agent(llm, tools, prompt)

# 5. 创建 AgentExecutor
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,      # 打印推理过程
    max_iterations=10, # 防止无限循环
    handle_parsing_errors=True  # 优雅处理解析错误
)

# 6. 执行任务
result = agent_executor.invoke({
    "input": "今天是几号？最近有什么关于AI的重大新闻？"
})
print(result["output"])
```
:::

### 3. 创建 OpenAI Tools Agent（推荐）

::: details create_openai_tools_agent 完整示例

```python
# src/langchain/agents/openai_tools_agent.py
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool

@tool
def search_products(query: str, category: str = "all") -> str:
    """
    搜索商品信息。

    Args:
        query: 搜索关键词
        category: 商品分类（electronics/clothing/food/all）
    """
    # 模拟商品搜索
    return f"找到关于'{query}'的商品：[商品A - ¥299, 商品B - ¥199]"

@tool
def get_order_status(order_id: str) -> str:
    """查询订单状态，需要提供订单号（格式：ORD-XXXXXXXX）"""
    return f"订单 {order_id} 状态：已发货，预计明天送达"

tools = [search_products, get_order_status]
llm = ChatOpenAI(model="gpt-4o", temperature=0)

# 自定义 Prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个电商平台的智能客服助手，帮助用户查询商品和订单信息。"),
    MessagesPlaceholder("chat_history", optional=True),  # 支持多轮对话历史
    ("human", "{input}"),
    MessagesPlaceholder("agent_scratchpad"),  # Agent 的推理暂存区（必须）
])

agent = create_openai_tools_agent(llm, tools, prompt)
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    max_iterations=5,
    return_intermediate_steps=True  # 返回中间推理步骤
)

result = agent_executor.invoke({"input": "帮我查一下订单ORD-12345678的状态"})
```
:::

---

## 四、AgentExecutor 配置

### 1. 关键配置项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `max_iterations` | int | 15 | 最大迭代次数，防止死循环 |
| `max_execution_time` | float | None | 最大执行时间（秒） |
| `early_stopping_method` | str | `"force"` | 超限后的停止方式：`force`/`generate` |
| `handle_parsing_errors` | bool/str | False | 解析错误处理方式 |
| `return_intermediate_steps` | bool | False | 是否返回中间步骤 |
| `verbose` | bool | False | 是否打印推理过程 |

::: details AgentExecutor 高级配置与错误处理

```python
# src/langchain/agents/executor_config.py
from langchain.agents import AgentExecutor

def create_robust_executor(agent, tools) -> AgentExecutor:
    """创建生产级 AgentExecutor"""
    return AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        max_iterations=8,
        max_execution_time=30.0,  # 30 秒超时

        # 当模型输出无法解析为工具调用时的处理
        handle_parsing_errors=(
            "输出格式有误，请按照规定格式重新输出工具调用。"
        ),

        # 超时后让模型生成最终答案（而不是直接报错）
        early_stopping_method="generate",

        # 返回中间步骤用于调试
        return_intermediate_steps=True,
    )

# 使用示例（带错误处理）
executor = create_robust_executor(agent, tools)

try:
    result = executor.invoke(
        {"input": "分析最近三个月的销售趋势"},
        config={"run_name": "sales-analysis-001"}  # 用于 LangSmith 追踪
    )

    # 访问中间步骤
    for step in result.get("intermediate_steps", []):
        action, observation = step
        print(f"工具：{action.tool}")
        print(f"输入：{action.tool_input}")
        print(f"结果：{observation[:200]}")

except Exception as e:
    print(f"Agent 执行失败：{e}")
```
:::

---

## 五、内存与状态管理

### 1. 内存类型对比

| 内存类型 | 原理 | 优点 | 缺点 | 适用场景 |
|---------|------|------|------|---------|
| `ConversationBufferMemory` | 保存所有对话原文 | 完整上下文 | Token 消耗随对话增长 | 短会话 |
| `ConversationBufferWindowMemory` | 只保留最近 k 轮 | 控制 Token 用量 | 丢失远期上下文 | 中等长度会话 |
| `ConversationSummaryMemory` | 定期摘要旧对话 | 长会话支持好 | 摘要可能丢失细节 | 长会话 |
| `VectorStoreRetrieverMemory` | 向量检索相关历史 | 按语义检索上下文 | 实现复杂 | 知识密集型会话 |

### 2. ConversationBufferMemory

::: details ConversationBufferMemory 与 Agent 集成

```python
# src/langchain/memory/buffer_memory.py
from langchain.memory import ConversationBufferMemory, ConversationBufferWindowMemory
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

llm = ChatOpenAI(model="gpt-4o", temperature=0)

# --- 方式一：ConversationBufferMemory（保留所有历史）---
memory = ConversationBufferMemory(
    memory_key="chat_history",   # 对应 Prompt 中的变量名
    return_messages=True,         # 返回消息对象（ChatPromptTemplate 需要）
    output_key="output"           # Agent 输出的 key
)

# --- 方式二：ConversationBufferWindowMemory（只保留最近5轮）---
window_memory = ConversationBufferWindowMemory(
    k=5,
    memory_key="chat_history",
    return_messages=True,
    output_key="output"
)

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个智能助手，记住对话上下文为用户提供连贯服务。"),
    MessagesPlaceholder("chat_history"),  # 注入历史消息
    ("human", "{input}"),
    MessagesPlaceholder("agent_scratchpad"),
])

agent = create_openai_tools_agent(llm, tools, prompt)

agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    memory=memory,
    verbose=True,
    return_intermediate_steps=False
)

# 多轮对话
agent_executor.invoke({"input": "我叫张三，我在北京工作。"})
agent_executor.invoke({"input": "我刚才说我在哪里工作？"})
# Agent 能正确回忆：北京
```
:::

### 3. VectorStoreRetrieverMemory

::: details 向量存储记忆实现长期上下文

```python
# src/langchain/memory/vector_memory.py
from langchain.memory import VectorStoreRetrieverMemory
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
import faiss

# 初始化向量存储
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# 使用 FAISS 作为向量数据库（本地，无需部署）
# 安装：pip install faiss-cpu
index = faiss.IndexFlatL2(1536)  # text-embedding-3-small 维度为 1536
vectorstore = FAISS(
    embedding_function=embeddings,
    index=index,
    docstore={},
    index_to_docstore_id={}
)

retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

memory = VectorStoreRetrieverMemory(
    retriever=retriever,
    memory_key="relevant_history",
    return_messages=False
)

# 手动添加历史记忆（模拟之前的对话）
memory.save_context(
    {"input": "我对量子计算很感兴趣"},
    {"output": "量子计算是利用量子力学原理进行信息处理的计算模式"}
)
memory.save_context(
    {"input": "我最近在学习 Python"},
    {"output": "Python 是数据科学和 AI 领域最流行的编程语言"}
)

# 当用户问到相关问题时，自动检索相关历史
relevant = memory.load_memory_variables({"prompt": "量子比特和经典比特有什么区别？"})
print(relevant["relevant_history"])
# 会检索到之前关于量子计算的对话
```
:::

::: tip 生产环境中的内存持久化
上述内存实现默认保存在内存中，进程重启后丢失。生产环境中需要将对话历史持久化到数据库（Redis/PostgreSQL），推荐使用 `RedisChatMessageHistory` 或 `SQLChatMessageHistory`。

```python
from langchain_community.chat_message_histories import RedisChatMessageHistory
from langchain.memory import ConversationBufferMemory

history = RedisChatMessageHistory(
    session_id="user-12345",
    url="redis://localhost:6379"
)
memory = ConversationBufferMemory(
    chat_memory=history,
    return_messages=True
)
```
:::
