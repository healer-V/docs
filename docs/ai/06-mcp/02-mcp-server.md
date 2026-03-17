---
title: "MCP Server 开发实践"
category: "AI · MCP"
tags:
  - MCP
  - Server
  - 工具
  - 资源
date: 2026-03-17
excerpt: "从零到一讲解 MCP Server 的完整开发流程，包括 Resources/Tools/Prompts 架构、Python SDK 实现、JSON Schema 工具定义、资源提供、传输层配置及错误处理。"
---

# MCP Server 开发实践

MCP（Model Context Protocol）Server 是为 AI 助手提供扩展能力的服务程序。通过实现 MCP Server，你可以让 Claude 等 AI 工具访问你的数据库、调用你的 API、操作你的文件系统。

## 一、MCP Server 架构

### 1. 三大核心能力

| 能力 | 说明 | 典型场景 |
|------|------|---------|
| **Tools** | AI 可调用的函数/操作 | 查询数据库、发送邮件、执行代码 |
| **Resources** | AI 可读取的数据/文件 | 读取配置文件、获取数据库记录 |
| **Prompts** | 预定义的提示词模板 | 标准化任务提示、工作流模板 |

### 2. 通信流程

```
AI 客户端（Claude Desktop）
    ↕  MCP 协议（JSON-RPC 2.0）
MCP Server
    ├── list_tools()      → 返回工具清单
    ├── call_tool()       → 执行工具并返回结果
    ├── list_resources()  → 返回资源清单
    ├── read_resource()   → 返回资源内容
    ├── list_prompts()    → 返回提示词模板清单
    └── get_prompt()      → 返回指定提示词
```

### 3. 传输层

| 传输方式 | 适用场景 | 特点 |
|---------|---------|------|
| `stdio` | 本地进程（Claude Desktop） | 最简单，进程间通过标准输入输出通信 |
| `SSE`（HTTP） | 网络服务 | 支持远程访问，需要 HTTP 服务器 |

---

## 二、Python SDK 开发 MCP Server

### 1. 环境准备

```bash
# 安装 MCP Python SDK
pip install mcp

# 项目结构
my-mcp-server/
  ├── server.py       # 主服务文件
  ├── tools/          # 工具实现
  ├── resources/      # 资源提供
  └── pyproject.toml  # 项目配置
```

### 2. 基础 Server 框架

::: details 完整的 MCP Server 骨架

```python
# server.py
import asyncio
import logging
from mcp.server import Server
from mcp.server.models import InitializationOptions
from mcp.server.stdio import stdio_server
from mcp import types

# 配置日志（写入文件，避免污染 stdio 通信）
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("mcp-server.log")]
)
logger = logging.getLogger("my-mcp-server")

# 创建 Server 实例
server = Server("my-mcp-server")

# ===== 工具注册 =====
@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    """返回所有可用工具的清单"""
    return [
        types.Tool(
            name="query_database",
            description="查询应用数据库，支持客户、订单、产品信息查询",
            inputSchema={
                "type": "object",
                "properties": {
                    "table": {
                        "type": "string",
                        "enum": ["customers", "orders", "products"],
                        "description": "要查询的数据表"
                    },
                    "condition": {
                        "type": "string",
                        "description": "查询条件（SQL WHERE 子句格式，如 'age > 18'）"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "返回结果数量上限",
                        "default": 10,
                        "maximum": 100
                    }
                },
                "required": ["table"]
            }
        ),
        types.Tool(
            name="send_notification",
            description="向用户发送通知消息（邮件或短信）",
            inputSchema={
                "type": "object",
                "properties": {
                    "recipient": {"type": "string", "description": "收件人邮箱或手机号"},
                    "message": {"type": "string", "description": "通知内容"},
                    "channel": {
                        "type": "string",
                        "enum": ["email", "sms"],
                        "description": "发送渠道"
                    }
                },
                "required": ["recipient", "message", "channel"]
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(
    name: str,
    arguments: dict | None
) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
    """执行工具调用"""
    logger.info(f"调用工具: {name}, 参数: {arguments}")
    args = arguments or {}

    if name == "query_database":
        result = await query_database(
            table=args.get("table"),
            condition=args.get("condition", ""),
            limit=args.get("limit", 10)
        )
        return [types.TextContent(type="text", text=result)]

    elif name == "send_notification":
        result = await send_notification(
            recipient=args["recipient"],
            message=args["message"],
            channel=args["channel"]
        )
        return [types.TextContent(type="text", text=result)]

    else:
        raise ValueError(f"未知工具: {name}")

# ===== 资源注册 =====
@server.list_resources()
async def handle_list_resources() -> list[types.Resource]:
    """返回所有可用资源的清单"""
    return [
        types.Resource(
            uri="config://app/settings",
            name="应用配置",
            description="读取应用的当前配置信息",
            mimeType="application/json"
        ),
        types.Resource(
            uri="db://stats/summary",
            name="数据库统计摘要",
            description="获取数据库中各表的记录数统计",
            mimeType="application/json"
        )
    ]

@server.read_resource()
async def handle_read_resource(uri: str) -> str:
    """返回资源内容"""
    import json

    if uri == "config://app/settings":
        settings = {
            "app_name": "MyApp",
            "version": "2.1.0",
            "environment": "production",
            "features": {"dark_mode": True, "beta_features": False}
        }
        return json.dumps(settings, ensure_ascii=False, indent=2)

    elif uri == "db://stats/summary":
        stats = await get_db_statistics()
        return json.dumps(stats, ensure_ascii=False, indent=2)

    else:
        raise ValueError(f"未知资源: {uri}")

# ===== 提示词注册 =====
@server.list_prompts()
async def handle_list_prompts() -> list[types.Prompt]:
    return [
        types.Prompt(
            name="analyze_customer",
            description="分析客户数据并生成洞察报告",
            arguments=[
                types.PromptArgument(
                    name="customer_id",
                    description="客户 ID",
                    required=True
                ),
                types.PromptArgument(
                    name="time_range",
                    description="分析时间范围（如 30d/90d/1y）",
                    required=False
                )
            ]
        )
    ]

@server.get_prompt()
async def handle_get_prompt(
    name: str,
    arguments: dict | None
) -> types.GetPromptResult:
    args = arguments or {}

    if name == "analyze_customer":
        customer_id = args.get("customer_id", "")
        time_range = args.get("time_range", "30d")

        return types.GetPromptResult(
            description="客户分析提示词",
            messages=[
                types.PromptMessage(
                    role="user",
                    content=types.TextContent(
                        type="text",
                        text=f"""请分析客户 {customer_id} 在最近 {time_range} 内的行为数据：

1. 使用 query_database 工具查询该客户的订单历史
2. 分析消费频次、金额趋势和产品偏好
3. 给出客户画像和营销建议

开始分析："""
                    )
                )
            ]
        )

    raise ValueError(f"未知提示词: {name}")

# ===== 工具实现 =====
import sqlite3
import json

async def query_database(table: str, condition: str = "", limit: int = 10) -> str:
    """实际的数据库查询逻辑"""
    allowed_tables = ["customers", "orders", "products"]
    if table not in allowed_tables:
        return f"错误：不允许查询表 '{table}'"

    sql = f"SELECT * FROM {table}"
    if condition:
        sql += f" WHERE {condition}"
    sql += f" LIMIT {limit}"

    try:
        conn = sqlite3.connect("data/app.db")
        conn.row_factory = sqlite3.Row
        rows = conn.execute(sql).fetchall()
        conn.close()

        if not rows:
            return "查询结果为空"

        result = [dict(row) for row in rows]
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"数据库查询失败: {e}")
        return f"查询失败：{str(e)}"

async def send_notification(recipient: str, message: str, channel: str) -> str:
    """发送通知（示例实现）"""
    logger.info(f"发送{channel}通知 → {recipient}: {message[:50]}")
    # 实际中调用邮件/短信 API
    return f"通知已发送：{channel.upper()} → {recipient}"

async def get_db_statistics() -> dict:
    """获取数据库统计信息"""
    conn = sqlite3.connect("data/app.db")
    stats = {}
    for table in ["customers", "orders", "products"]:
        try:
            count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            stats[table] = count
        except Exception:
            stats[table] = "N/A"
    conn.close()
    return stats

# ===== 启动服务 =====
async def main():
    logger.info("MCP Server 启动中...")
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="my-mcp-server",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=None,
                    experimental_capabilities={}
                )
            )
        )

if __name__ == "__main__":
    asyncio.run(main())
```
:::

---

## 三、工具定义（JSON Schema）

### 1. Schema 类型支持

MCP 工具的 `inputSchema` 遵循 JSON Schema Draft 7 规范：

| JSON Schema 类型 | Python 对应 | 示例 |
|-----------------|------------|------|
| `string` | `str` | `{"type": "string"}` |
| `integer` | `int` | `{"type": "integer", "minimum": 0}` |
| `number` | `float` | `{"type": "number"}` |
| `boolean` | `bool` | `{"type": "boolean"}` |
| `array` | `list` | `{"type": "array", "items": {"type": "string"}}` |
| `object` | `dict` | `{"type": "object", "properties": {...}}` |
| 枚举 | `Literal` | `{"type": "string", "enum": ["a", "b"]}` |

::: details 复杂工具 Schema 示例

```python
# 复杂输入 Schema：支持嵌套对象、数组和可选字段
types.Tool(
    name="create_report",
    description="生成数据分析报告",
    inputSchema={
        "type": "object",
        "properties": {
            "report_type": {
                "type": "string",
                "enum": ["sales", "inventory", "customer"],
                "description": "报告类型"
            },
            "date_range": {
                "type": "object",
                "description": "日期范围",
                "properties": {
                    "start": {
                        "type": "string",
                        "format": "date",
                        "description": "开始日期（YYYY-MM-DD）"
                    },
                    "end": {
                        "type": "string",
                        "format": "date",
                        "description": "结束日期（YYYY-MM-DD）"
                    }
                },
                "required": ["start", "end"]
            },
            "metrics": {
                "type": "array",
                "items": {
                    "type": "string",
                    "enum": ["revenue", "orders", "customers", "avg_order_value"]
                },
                "description": "要包含的指标列表",
                "minItems": 1,
                "maxItems": 4
            },
            "format": {
                "type": "string",
                "enum": ["json", "csv", "markdown"],
                "default": "json",
                "description": "输出格式"
            }
        },
        "required": ["report_type", "date_range", "metrics"],
        "additionalProperties": False
    }
)
```
:::

---

## 四、资源提供

### 1. 资源 URI 设计规范

资源 URI 没有强制规范，但推荐使用语义化的自定义 scheme：

```
# 配置类
config://app/settings
config://feature-flags

# 数据库类
db://users/12345          # 特定记录
db://products/list        # 列表
db://stats/daily          # 统计

# 文件类
file:///reports/2026/q1   # 文件路径
file:///templates/email   # 模板文件

# API 类
api://weather/beijing      # 外部 API 数据
api://stock/AAPL           # 股票数据
```

### 2. 动态资源（支持 URI 模板）

::: details 动态资源实现（按 ID 读取不同记录）

```python
# 动态资源：通过 URI 参数返回不同内容
@server.list_resources()
async def handle_list_resources() -> list[types.Resource]:
    # 列出资源模板（不是具体资源）
    return [
        types.Resource(
            uri="db://customers/list",
            name="客户列表",
            description="获取所有客户的基本信息列表",
            mimeType="application/json"
        ),
        # 动态资源用 URI 模板描述
        types.Resource(
            uri="db://customers/{id}",  # {id} 是占位符
            name="客户详情",
            description="获取指定 ID 客户的详细信息",
            mimeType="application/json"
        )
    ]

@server.read_resource()
async def handle_read_resource(uri: str) -> str:
    import re, json

    # 匹配客户列表
    if uri == "db://customers/list":
        customers = await get_all_customers()
        return json.dumps(customers, ensure_ascii=False, indent=2)

    # 匹配客户详情（动态 ID）
    match = re.match(r"db://customers/(\d+)", uri)
    if match:
        customer_id = int(match.group(1))
        customer = await get_customer_by_id(customer_id)
        if customer:
            return json.dumps(customer, ensure_ascii=False, indent=2)
        raise ValueError(f"客户 ID {customer_id} 不存在")

    # 文件资源
    if uri.startswith("file:///reports/"):
        file_path = uri.replace("file:///", "")
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        except FileNotFoundError:
            raise ValueError(f"文件不存在: {file_path}")

    raise ValueError(f"不支持的资源 URI: {uri}")
```
:::

---

## 五、传输层

### 1. stdio 传输（本地）

stdio 是最常见的传输方式，适合 Claude Desktop 等本地客户端：

```python
# 使用 stdio 传输（已在上方 main() 函数中展示）
from mcp.server.stdio import stdio_server

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, init_options)
```

### 2. SSE 传输（网络服务）

::: details 基于 Starlette 的 SSE MCP Server

```python
# server_sse.py
# 安装：pip install mcp starlette uvicorn

from mcp.server.sse import SseServerTransport
from starlette.applications import Starlette
from starlette.routing import Mount, Route
from starlette.requests import Request
from starlette.responses import Response
import uvicorn

# 创建 SSE 传输层
sse_transport = SseServerTransport("/messages")

async def handle_sse(request: Request) -> Response:
    """SSE 连接处理（AI 客户端连接此端点）"""
    async with sse_transport.connect_sse(
        request.scope,
        request.receive,
        request._send
    ) as streams:
        await server.run(
            streams[0],
            streams[1],
            InitializationOptions(
                server_name="my-mcp-server",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=None,
                    experimental_capabilities={}
                )
            )
        )

# 创建 Starlette 应用
app = Starlette(
    routes=[
        Route("/sse", endpoint=handle_sse),
        Mount("/messages", app=sse_transport.handle_post_message),
    ]
)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
```

SSE 传输的 Claude Desktop 配置：
```json
{
  "mcpServers": {
    "my-server": {
      "url": "http://localhost:8080/sse"
    }
  }
}
```
:::

---

## 六、错误处理与日志

### 1. 错误处理规范

MCP Server 中的错误处理需要区分两类：工具级错误和协议级错误。

::: details 完整错误处理实现

```python
# 工具级错误：工具执行失败，返回错误信息给 AI
@server.call_tool()
async def handle_call_tool(name: str, arguments: dict | None) -> list:
    args = arguments or {}

    try:
        if name == "risky_operation":
            result = await perform_risky_operation(**args)
            return [types.TextContent(type="text", text=result)]

    except ValueError as e:
        # 参数错误：返回友好错误信息，让 AI 能够理解并纠正
        logger.warning(f"工具 {name} 参数错误: {e}")
        return [types.TextContent(
            type="text",
            text=f"参数错误：{str(e)}。请检查参数格式后重试。"
        )]

    except PermissionError:
        return [types.TextContent(
            type="text",
            text="权限不足：执行此操作需要管理员权限。"
        )]

    except TimeoutError:
        logger.error(f"工具 {name} 执行超时")
        return [types.TextContent(
            type="text",
            text="操作超时，服务可能暂时不可用，请稍后重试。"
        )]

    except Exception as e:
        # 未知错误：记录完整堆栈，返回简化错误给 AI
        logger.exception(f"工具 {name} 执行异常: {e}")
        return [types.TextContent(
            type="text",
            text=f"工具执行失败：{type(e).__name__}。已记录错误日志。"
        )]

    # 协议级错误：未知工具名（直接抛出异常）
    raise ValueError(f"未知工具: {name}")

# 全局异常处理（捕获所有未处理的异常）
import sys

def handle_uncaught_exception(exc_type, exc_value, exc_traceback):
    if issubclass(exc_type, KeyboardInterrupt):
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
        return
    logger.critical("未处理的异常", exc_info=(exc_type, exc_value, exc_traceback))

sys.excepthook = handle_uncaught_exception
```
:::

### 2. 结构化日志配置

::: details 生产级日志配置

```python
# logging_config.py
import logging
import logging.handlers
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    """JSON 格式日志，便于日志系统解析"""
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry, ensure_ascii=False)

def setup_logging(log_file: str = "mcp-server.log", level: str = "INFO"):
    """配置生产级日志"""
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level))

    # 文件日志（JSON 格式，按大小滚动）
    file_handler = logging.handlers.RotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
        encoding="utf-8"
    )
    file_handler.setFormatter(JSONFormatter())
    root_logger.addHandler(file_handler)

    # 注意：不要向 stderr 输出（会干扰 stdio 传输）
    # 如果需要调试，使用文件日志

setup_logging()
```
:::

::: tip 开发调试技巧
开发 MCP Server 时，绝对不能向 stdout 输出任何调试信息（`print()`），这会破坏 stdio 传输的 JSON-RPC 协议。所有日志必须写入文件或使用 stderr（但 stdio 模式下也应避免使用 stderr）。
:::
