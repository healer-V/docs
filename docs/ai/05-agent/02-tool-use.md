---
title: "AI Agent 工具使用与集成"
category: "AI · Agent"
tags:
  - Agent
  - 工具
  - 函数调用
  - 自动化
date: 2026-03-17
excerpt: "系统讲解 AI Agent 工具设计原则、常见工具类型、Observe-Think-Act 调用循环、工具结果处理与错误恢复，以及动态工具选择策略。"
---

# AI Agent 工具使用与集成

工具（Tool）是 AI Agent 与现实世界交互的桥梁。设计良好的工具系统能让 Agent 完成搜索、计算、数据库操作、API 调用等复杂任务。

## 一、工具设计原则

### 1. 核心设计原则

| 原则 | 说明 | 反例 |
|------|------|------|
| 单一职责 | 每个工具只做一件事 | `do_everything(task)` 包含所有逻辑 |
| 幂等性 | 多次调用结果相同（GET 类操作） | 每次调用都修改状态的工具缺少去重保护 |
| 错误透明 | 失败时返回清晰的错误信息，而非静默失败 | 返回空字符串不说明原因 |
| 参数简洁 | 只暴露必要参数，用默认值处理次要参数 | 超过 5 个必填参数的工具 |
| 描述准确 | 描述说明工具的用途、边界和预期输入 | "执行操作" 这样的模糊描述 |

### 2. 工具描述规范

良好的工具描述帮助模型准确判断何时以及如何调用工具：

::: details 工具描述对比示例

```python
# 差：描述模糊，缺少边界说明
@tool
def query_db(sql: str) -> str:
    """查询数据库"""
    pass

# 好：描述清晰，说明能力与限制
@tool
def query_customer_database(
    query: str,
    limit: int = 10
) -> str:
    """
    查询客户数据库中的客户信息。

    适用场景：查询客户姓名、联系方式、订单历史、会员等级等信息。
    不适用于：修改数据、查询非客户相关数据（如商品、库存）。

    Args:
        query: 自然语言查询，如 "查找购买过iPhone的VIP用户"
        limit: 返回结果数量上限（1-50），默认 10

    Returns:
        JSON 格式的客户列表，包含 id、name、email、order_count 字段。
        若无匹配结果，返回 "未找到匹配的客户记录"。
    """
    pass
```
:::

### 3. 工具安全边界

::: warning 破坏性操作需要特殊保护
删除、修改、发送等不可逆操作，应要求模型在调用前明确确认，或设计为两步操作（先预览再执行）。

```python
@tool
def delete_records(
    table: str,
    condition: str,
    dry_run: bool = True  # 默认为演练模式，不实际删除
) -> str:
    """
    删除数据库记录。

    重要：默认为 dry_run=True（演练模式），只预览将删除的记录数，不实际删除。
    设置 dry_run=False 才会真正执行删除，请确认后再执行。
    """
    if dry_run:
        count = estimate_delete_count(table, condition)
        return f"演练模式：将删除 {count} 条记录（设置 dry_run=False 以执行实际删除）"
    else:
        count = execute_delete(table, condition)
        return f"已删除 {count} 条记录"
```
:::

---

## 二、常见工具类型

### 1. 搜索与信息检索

::: details 多源搜索工具实现

```python
# src/agent/tools/search_tools.py
from langchain_core.tools import tool
from langchain_community.tools import TavilySearchResults, WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper
import httpx

# --- 互联网搜索 ---
web_search = TavilySearchResults(
    max_results=5,
    search_depth="advanced",
    include_answer=True,       # 包含 AI 生成的摘要答案
    include_raw_content=False, # 不返回原始 HTML
)

# --- 维基百科搜索 ---
wiki_tool = WikipediaQueryRun(
    api_wrapper=WikipediaAPIWrapper(lang="zh", top_k_results=2)
)

# --- 内部知识库搜索（RAG）---
@tool
def search_internal_docs(query: str, doc_type: str = "all") -> str:
    """
    搜索公司内部文档库（产品手册、FAQ、技术文档）。

    Args:
        query: 搜索关键词或问题
        doc_type: 文档类型（product/faq/technical/all）

    Returns:
        最相关的文档片段列表
    """
    # 实际中调用向量数据库检索
    results = vector_db.similarity_search(
        query,
        k=3,
        filter={"type": doc_type} if doc_type != "all" else None
    )
    if not results:
        return "未找到相关文档"

    return "\n\n".join([
        f"[{r.metadata.get('title', '未知')}]\n{r.page_content}"
        for r in results
    ])
```
:::

### 2. 代码执行

::: details 安全沙箱代码执行工具

```python
# src/agent/tools/code_executor.py
import subprocess
import tempfile
import os
import signal
from langchain_core.tools import tool

@tool
def execute_python(
    code: str,
    timeout: int = 15
) -> str:
    """
    在安全沙箱中执行 Python 代码。

    适用于：数据分析、数学计算、字符串处理、算法验证。
    不支持：网络请求、文件系统访问（沙箱限制）。

    Args:
        code: 要执行的 Python 代码
        timeout: 超时时间（秒），最大 30 秒

    Returns:
        代码的标准输出，或错误信息
    """
    timeout = min(timeout, 30)  # 强制最大 30 秒

    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".py", delete=False, encoding="utf-8"
    ) as f:
        f.write(code)
        temp_file = f.name

    try:
        result = subprocess.run(
            ["python", "-c",
             # 限制危险模块
             "import sys; sys.modules['os'] = None; sys.modules['subprocess'] = None; " +
             f"exec(open('{temp_file}').read())"],
            capture_output=True,
            text=True,
            timeout=timeout,
        )

        if result.returncode == 0:
            output = result.stdout.strip()
            return output if output else "（代码执行成功，无输出）"
        else:
            error = result.stderr.strip()
            # 只返回最后3行错误（通常是关键信息）
            error_lines = error.split("\n")[-3:]
            return f"执行错误：\n" + "\n".join(error_lines)

    except subprocess.TimeoutExpired:
        return f"执行超时（超过 {timeout} 秒），请优化代码或减少计算量"
    finally:
        os.unlink(temp_file)
```
:::

### 3. 数据库操作

::: details 结构化数据库查询工具

```python
# src/agent/tools/database_tools.py
from langchain_core.tools import tool
import sqlite3
import json

@tool
def query_orders(
    customer_id: str = "",
    status: str = "all",
    days: int = 30,
    limit: int = 10
) -> str:
    """
    查询订单数据库。

    Args:
        customer_id: 客户 ID（可选，为空时查询所有）
        status: 订单状态（pending/shipped/completed/cancelled/all）
        days: 查询最近 N 天的订单，最大 365
        limit: 返回数量上限，最大 50

    Returns:
        JSON 格式的订单列表
    """
    days = min(days, 365)
    limit = min(limit, 50)

    conn = sqlite3.connect("data/orders.db")
    conn.row_factory = sqlite3.Row

    conditions = [f"created_at >= datetime('now', '-{days} days')"]
    params = []

    if customer_id:
        conditions.append("customer_id = ?")
        params.append(customer_id)

    if status != "all":
        conditions.append("status = ?")
        params.append(status)

    sql = f"""
        SELECT order_id, customer_id, total_amount, status, created_at
        FROM orders
        WHERE {' AND '.join(conditions)}
        ORDER BY created_at DESC
        LIMIT {limit}
    """

    try:
        rows = conn.execute(sql, params).fetchall()
        conn.close()

        if not rows:
            return "未找到符合条件的订单"

        orders = [dict(row) for row in rows]
        return json.dumps(orders, ensure_ascii=False, indent=2)

    except Exception as e:
        conn.close()
        return f"查询失败：{str(e)}"
```
:::

### 4. 文件系统操作

::: details 受限文件系统工具

```python
# src/agent/tools/file_tools.py
from langchain_core.tools import tool
from pathlib import Path
import json

# 只允许在特定工作目录内操作，防止路径穿越
WORKSPACE_DIR = Path("/app/workspace").resolve()

def _safe_path(file_path: str) -> Path:
    """验证文件路径在工作目录内（防止 ../../../etc/passwd 攻击）"""
    target = (WORKSPACE_DIR / file_path).resolve()
    if not str(target).startswith(str(WORKSPACE_DIR)):
        raise ValueError(f"禁止访问工作目录外的文件：{file_path}")
    return target

@tool
def read_file(file_path: str) -> str:
    """
    读取工作目录中的文件内容。

    Args:
        file_path: 相对于工作目录的文件路径，如 "data/report.txt"
    """
    try:
        path = _safe_path(file_path)
        if not path.exists():
            return f"文件不存在：{file_path}"
        if path.stat().st_size > 1024 * 1024:  # 限制 1MB
            return "文件过大（超过1MB），请指定读取范围"
        return path.read_text(encoding="utf-8")
    except ValueError as e:
        return str(e)

@tool
def write_file(file_path: str, content: str, mode: str = "write") -> str:
    """
    向工作目录写入文件。

    Args:
        file_path: 相对于工作目录的文件路径
        content: 要写入的内容
        mode: write（覆盖写入）或 append（追加）
    """
    try:
        path = _safe_path(file_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        write_mode = "a" if mode == "append" else "w"
        path.write_text(content, encoding="utf-8") if mode == "write" else \
            open(path, "a", encoding="utf-8").write(content)
        return f"成功写入文件：{file_path}（{len(content)} 字符）"
    except ValueError as e:
        return str(e)
```
:::

### 5. API 调用

::: details 外部 API 调用工具

```python
# src/agent/tools/api_tools.py
from langchain_core.tools import tool
import httpx
import json

@tool
def call_weather_api(city: str, days: int = 1) -> str:
    """
    查询城市天气预报（调用外部天气 API）。

    Args:
        city: 城市名称（中文），如：北京、上海
        days: 预报天数（1-7）
    """
    days = min(max(days, 1), 7)

    try:
        # 实际替换为真实天气 API
        response = httpx.get(
            "https://api.weatherapi.com/v1/forecast.json",
            params={
                "key": "your_api_key",
                "q": city,
                "days": days,
                "lang": "zh"
            },
            timeout=10.0
        )
        response.raise_for_status()
        data = response.json()

        # 格式化输出
        current = data["current"]
        return (
            f"{city} 当前天气：{current['condition']['text']}，"
            f"气温 {current['temp_c']}°C，"
            f"湿度 {current['humidity']}%，"
            f"风速 {current['wind_kph']} km/h"
        )

    except httpx.TimeoutException:
        return f"请求超时，无法获取 {city} 的天气信息"
    except httpx.HTTPStatusError as e:
        return f"API 请求失败：HTTP {e.response.status_code}"
    except Exception as e:
        return f"获取天气信息失败：{str(e)}"
```
:::

---

## 三、工具调用循环（Observe-Think-Act）

### 1. 循环模式

```
初始任务
  ↓
Observe（观察）：分析当前状态和可用信息
  ↓
Think（思考）：决定是否需要工具，选择哪个工具，准备什么参数
  ↓
Act（行动）：调用工具
  ↓
Observe（观察工具结果）
  ↓
Think：结果是否足够？是否需要继续调用其他工具？
  ↓
... 循环直到任务完成
  ↓
Final Answer（最终回答）
```

### 2. 实现完整的工具调用循环

::: details 手动实现工具调用循环

```python
# src/agent/tool_loop.py
import openai
import json
from typing import List, Dict, Callable

client = openai.OpenAI()

class ToolCallingLoop:
    """
    实现 Observe-Think-Act 循环的工具调用引擎

    支持：多工具、并行调用、最大迭代限制、调用日志
    """

    def __init__(
        self,
        tools: List[Dict],           # OpenAI 格式的工具定义
        tool_functions: Dict[str, Callable],  # 工具名 → 实际函数的映射
        model: str = "gpt-4o",
        max_iterations: int = 10
    ):
        self.tools = tools
        self.tool_functions = tool_functions
        self.model = model
        self.max_iterations = max_iterations
        self.call_log = []  # 记录所有工具调用

    def run(self, user_message: str, system_prompt: str = "") -> dict:
        """执行完整的工具调用循环"""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": user_message})

        iterations = 0
        while iterations < self.max_iterations:
            iterations += 1

            # --- Think：调用模型决策 ---
            response = client.chat.completions.create(
                model=self.model,
                messages=messages,
                tools=self.tools,
                tool_choice="auto"
            )

            message = response.choices[0].message
            finish_reason = response.choices[0].finish_reason

            # --- 判断是否完成 ---
            if finish_reason == "stop" or not message.tool_calls:
                return {
                    "answer": message.content,
                    "iterations": iterations,
                    "tool_calls": self.call_log
                }

            # --- Act：执行工具调用 ---
            messages.append(message)
            tool_results = []

            for tool_call in message.tool_calls:
                func_name = tool_call.function.name
                func_args = json.loads(tool_call.function.arguments)

                # Observe：记录调用
                log_entry = {
                    "tool": func_name,
                    "args": func_args,
                    "iteration": iterations
                }

                # 执行工具
                if func_name in self.tool_functions:
                    try:
                        result = self.tool_functions[func_name](**func_args)
                        log_entry["result"] = str(result)[:200]  # 只记录前200字
                        log_entry["status"] = "success"
                    except Exception as e:
                        result = f"工具执行失败：{str(e)}"
                        log_entry["status"] = "error"
                        log_entry["error"] = str(e)
                else:
                    result = f"工具 '{func_name}' 不存在"
                    log_entry["status"] = "not_found"

                self.call_log.append(log_entry)

                tool_results.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": str(result)
                })

            # --- Observe：将工具结果加入上下文 ---
            messages.extend(tool_results)

        return {
            "answer": "已达到最大迭代次数，任务可能未完成",
            "iterations": iterations,
            "tool_calls": self.call_log
        }
```
:::

---

## 四、工具结果处理与错误恢复

### 1. 错误处理策略

| 错误类型 | 处理方式 | 示例 |
|---------|---------|------|
| 工具超时 | 返回超时提示，Agent 换其他方式获取信息 | "天气API超时，请稍后重试" |
| 参数错误 | 返回清晰的参数校验错误 | "city 参数不能为空" |
| 权限不足 | 返回权限说明，提示需要授权 | "需要管理员权限才能执行此操作" |
| 数据不存在 | 明确说明而非返回空值 | "未找到 ID 为 xxx 的订单" |
| 外部服务故障 | 返回服务状态，建议重试或替代方案 | "天气服务暂时不可用，建议查询其他来源" |

### 2. 结构化错误响应

::: details 统一错误响应格式

```python
# src/agent/tools/base_tool.py
from dataclasses import dataclass
from typing import Optional, Any
import json
import traceback

@dataclass
class ToolResult:
    """工具执行结果的统一格式"""
    success: bool
    data: Any = None
    error: Optional[str] = None
    error_code: Optional[str] = None  # 错误码，便于 Agent 决策
    suggestion: Optional[str] = None  # 给 Agent 的建议

    def to_string(self) -> str:
        """转换为 Agent 可理解的字符串"""
        if self.success:
            return json.dumps(self.data, ensure_ascii=False) if isinstance(self.data, (dict, list)) \
                else str(self.data)
        else:
            parts = [f"错误：{self.error}"]
            if self.error_code:
                parts.append(f"错误码：{self.error_code}")
            if self.suggestion:
                parts.append(f"建议：{self.suggestion}")
            return "\n".join(parts)

def safe_tool_execution(func, *args, **kwargs) -> str:
    """
    安全执行工具函数，捕获所有异常并返回结构化错误

    确保工具调用循环不会因单个工具失败而中断
    """
    try:
        result = func(*args, **kwargs)
        if isinstance(result, ToolResult):
            return result.to_string()
        return str(result)

    except ValueError as e:
        return ToolResult(
            success=False,
            error=str(e),
            error_code="INVALID_INPUT",
            suggestion="请检查输入参数是否正确"
        ).to_string()

    except PermissionError as e:
        return ToolResult(
            success=False,
            error="权限不足",
            error_code="PERMISSION_DENIED",
            suggestion="该操作需要管理员权限，请联系管理员"
        ).to_string()

    except TimeoutError:
        return ToolResult(
            success=False,
            error="操作超时",
            error_code="TIMEOUT",
            suggestion="服务响应超时，可以稍后重试或尝试其他工具"
        ).to_string()

    except Exception as e:
        return ToolResult(
            success=False,
            error=f"未知错误：{type(e).__name__}: {str(e)}",
            error_code="UNKNOWN_ERROR",
            suggestion="如问题持续存在，请检查工具配置"
        ).to_string()
```
:::

---

## 五、动态工具选择

### 1. 工具过多的问题

当工具数量超过 20 个时，模型的工具选择准确率会显著下降。动态工具选择通过预筛选，只向模型提供最相关的工具子集。

::: details 基于语义相似度的动态工具选择

```python
# src/agent/dynamic_tool_selector.py
from langchain_openai import OpenAIEmbeddings
import numpy as np
from typing import List, Dict, Any
import json

class DynamicToolSelector:
    """
    动态工具选择器

    根据用户输入的语义相似度，从大量工具中筛选最相关的工具子集
    """

    def __init__(self, tools: List[Dict], top_k: int = 5):
        """
        Args:
            tools: OpenAI 格式的工具定义列表
            top_k: 每次选择的工具数量上限
        """
        self.tools = tools
        self.top_k = top_k
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        self._tool_embeddings = None

    def _get_tool_description(self, tool: Dict) -> str:
        """提取工具的完整描述用于向量化"""
        func = tool.get("function", {})
        return f"{func.get('name', '')} {func.get('description', '')}"

    def _build_index(self):
        """预计算所有工具的嵌入向量（懒加载）"""
        if self._tool_embeddings is not None:
            return

        descriptions = [self._get_tool_description(t) for t in self.tools]
        self._tool_embeddings = np.array(
            self.embeddings.embed_documents(descriptions)
        )

    def select_tools(self, user_query: str) -> List[Dict]:
        """
        根据用户查询选择最相关的工具子集

        Args:
            user_query: 用户的输入或当前 Agent 的目标

        Returns:
            最相关的 top_k 个工具定义
        """
        self._build_index()

        # 计算查询向量
        query_embedding = np.array(self.embeddings.embed_query(user_query))

        # 余弦相似度
        norms = np.linalg.norm(self._tool_embeddings, axis=1)
        similarities = np.dot(self._tool_embeddings, query_embedding) / (
            norms * np.linalg.norm(query_embedding)
        )

        # 选取最相关的 top_k 个工具
        top_indices = np.argsort(similarities)[-self.top_k:][::-1]
        selected = [self.tools[i] for i in top_indices]

        return selected

# 使用示例
all_tools = [...]  # 50 个工具
selector = DynamicToolSelector(all_tools, top_k=5)

# 每次调用前先筛选
relevant_tools = selector.select_tools("帮我查询北京的天气")
# 只会返回天气相关的 5 个工具，而非全部 50 个

response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    tools=relevant_tools  # 只传入相关工具
)
```
:::

### 2. 基于规则的工具路由

::: details 意图识别 + 规则路由

```python
# src/agent/tool_router.py
import re
from typing import List, Dict

# 意图 → 工具集映射
INTENT_TOOL_MAP = {
    "weather": ["get_weather", "get_weather_forecast"],
    "search": ["web_search", "wiki_search", "search_internal_docs"],
    "database": ["query_orders", "query_customers", "query_products"],
    "calculation": ["execute_python", "calculator"],
    "file": ["read_file", "write_file", "list_files"],
}

# 意图关键词
INTENT_KEYWORDS = {
    "weather": ["天气", "气温", "下雨", "晴", "温度"],
    "search": ["搜索", "查找", "找一下", "查询", "了解"],
    "database": ["订单", "客户", "用户", "记录", "数据"],
    "calculation": ["计算", "算", "多少", "结果", "数学"],
    "file": ["文件", "读取", "保存", "写入", "文档"],
}

def detect_intent(user_input: str) -> List[str]:
    """基于关键词检测用户意图"""
    detected = []
    for intent, keywords in INTENT_KEYWORDS.items():
        if any(kw in user_input for kw in keywords):
            detected.append(intent)
    return detected or ["search"]  # 默认使用搜索

def route_tools(user_input: str, all_tools: Dict[str, Dict]) -> List[Dict]:
    """根据意图筛选相关工具"""
    intents = detect_intent(user_input)
    selected_names = set()
    for intent in intents:
        selected_names.update(INTENT_TOOL_MAP.get(intent, []))

    return [
        tool for name, tool in all_tools.items()
        if name in selected_names
    ]
```
:::
