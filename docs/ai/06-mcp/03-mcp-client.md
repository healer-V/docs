---
title: "MCP Client 集成指南"
category: "AI · MCP"
tags:
  - MCP
  - Client
  - Claude
  - 集成
date: 2026-03-17
excerpt: "完整讲解 MCP Client 的集成方式，包括 Claude Desktop 配置、Python Client 调用、工具发现与调用、资源读取、MCP Inspector 调试及常见集成场景。"
---

# MCP Client 集成指南

MCP Client 负责连接 MCP Server，发现并调用其提供的工具和资源。本文介绍从 Claude Desktop 配置到编程集成的完整 Client 使用方案。

## 一、Claude Desktop 配置 MCP Server

### 1. 配置文件位置

Claude Desktop 使用 `claude_desktop_config.json` 管理 MCP Server 连接：

| 操作系统 | 配置文件路径 |
|---------|------------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

### 2. 配置文件结构

::: details 完整的 claude_desktop_config.json 配置示例

```json
{
  "mcpServers": {
    "my-database-server": {
      "command": "python",
      "args": ["/path/to/my-mcp-server/server.py"],
      "env": {
        "DATABASE_URL": "sqlite:///data/app.db",
        "LOG_LEVEL": "INFO"
      }
    },

    "filesystem-server": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/yourname/Documents"
      ]
    },

    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your_brave_api_key"
      }
    },

    "remote-server": {
      "url": "http://localhost:8080/sse"
    }
  }
}
```
:::

### 3. 配置字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `command` | 是（stdio） | 启动命令（python/node/npx） |
| `args` | 否 | 命令行参数数组 |
| `env` | 否 | 环境变量（API Key 等敏感配置） |
| `url` | 是（SSE） | SSE 服务地址（与 command 二选一） |

::: tip 配置生效方式
修改配置文件后，需要完全退出并重新启动 Claude Desktop 才能生效。重启后，如果 Server 正常连接，在 Claude 对话界面右下角会显示锤子图标（工具）。
:::

::: warning 路径使用绝对路径
`args` 中的文件路径必须使用绝对路径，相对路径会导致 Server 启动失败（因为工作目录不确定）。
:::

---

## 二、Python Client 调用 MCP Server

### 1. 基础连接

::: details Python 客户端连接本地 MCP Server（stdio）

```python
# src/mcp_client/basic_client.py
# 安装：pip install mcp

import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def connect_to_server():
    """连接到本地 MCP Server 并列出所有工具"""
    server_params = StdioServerParameters(
        command="python",                   # 启动命令
        args=["server.py"],                 # 脚本路径
        env={"DATABASE_URL": "sqlite:///data/app.db"}  # 环境变量
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            # 初始化连接
            await session.initialize()
            print(f"已连接到 MCP Server")

            # 列出所有工具
            tools_result = await session.list_tools()
            print(f"\n可用工具（共 {len(tools_result.tools)} 个）：")
            for tool in tools_result.tools:
                print(f"  - {tool.name}: {tool.description}")

            # 列出所有资源
            resources_result = await session.list_resources()
            print(f"\n可用资源（共 {len(resources_result.resources)} 个）：")
            for resource in resources_result.resources:
                print(f"  - {resource.uri}: {resource.name}")

asyncio.run(connect_to_server())
```
:::

### 2. 连接远程 Server（SSE）

::: details Python 客户端连接远程 SSE Server

```python
# src/mcp_client/sse_client.py
import asyncio
from mcp import ClientSession
from mcp.client.sse import sse_client

async def connect_to_remote_server(server_url: str = "http://localhost:8080/sse"):
    """连接到远程 SSE MCP Server"""
    async with sse_client(server_url) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = await session.list_tools()
            print(f"远程 Server 工具数量：{len(tools.tools)}")
            return session

asyncio.run(connect_to_remote_server())
```
:::

---

## 三、工具发现（list_tools）

### 1. 获取完整工具信息

::: details 工具元数据解析示例

```python
# src/mcp_client/tool_discovery.py
import asyncio
import json
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def discover_tools():
    """发现并解析所有工具的详细信息"""
    server_params = StdioServerParameters(
        command="python", args=["server.py"]
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.list_tools()

            tools_info = []
            for tool in result.tools:
                tool_info = {
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": tool.inputSchema
                }

                # 提取必填参数
                required = tool.inputSchema.get("required", [])
                properties = tool.inputSchema.get("properties", {})

                print(f"\n工具：{tool.name}")
                print(f"  描述：{tool.description}")
                print(f"  必填参数：{required}")
                print(f"  所有参数：")
                for param_name, param_schema in properties.items():
                    is_required = "（必填）" if param_name in required else "（可选）"
                    param_type = param_schema.get("type", "any")
                    param_desc = param_schema.get("description", "")
                    print(f"    - {param_name} [{param_type}] {is_required}: {param_desc}")

                tools_info.append(tool_info)

            return tools_info

asyncio.run(discover_tools())
```
:::

---

## 四、工具调用（call_tool）

### 1. 基础调用

::: details 调用工具并处理不同类型的返回值

```python
# src/mcp_client/tool_calling.py
import asyncio
import json
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp.types import TextContent, ImageContent, EmbeddedResource

async def call_tools_demo():
    server_params = StdioServerParameters(
        command="python", args=["server.py"]
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # --- 调用文本工具 ---
            result = await session.call_tool(
                name="query_database",
                arguments={
                    "table": "customers",
                    "condition": "age > 25",
                    "limit": 5
                }
            )

            # 处理返回值（可能是多种类型）
            for content in result.content:
                if isinstance(content, TextContent):
                    print(f"文本结果：\n{content.text}")

                elif isinstance(content, ImageContent):
                    # 处理图片（Base64 编码）
                    print(f"图片类型：{content.mimeType}")
                    # 保存图片：
                    # import base64
                    # with open("output.png", "wb") as f:
                    #     f.write(base64.b64decode(content.data))

                elif isinstance(content, EmbeddedResource):
                    print(f"嵌入资源：{content.resource.uri}")

            # 检查是否有错误
            if result.isError:
                print(f"工具执行失败：{result.content[0].text}")

asyncio.run(call_tools_demo())
```
:::

### 2. 与 LLM 集成的完整工具调用循环

::: details MCP + OpenAI 工具调用集成

```python
# src/mcp_client/llm_integration.py
import asyncio
import json
import openai
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

openai_client = openai.AsyncOpenAI()

def mcp_tools_to_openai_format(mcp_tools) -> list:
    """将 MCP 工具定义转换为 OpenAI function calling 格式"""
    return [
        {
            "type": "function",
            "function": {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.inputSchema
            }
        }
        for tool in mcp_tools
    ]

async def mcp_llm_agent(user_message: str):
    """
    结合 MCP Server 和 OpenAI 的完整 Agent

    流程：
    1. 连接 MCP Server，获取工具列表
    2. 将工具描述传给 LLM
    3. LLM 决定调用哪些工具
    4. 通过 MCP Client 执行工具调用
    5. 将结果传回 LLM 生成最终回答
    """
    server_params = StdioServerParameters(
        command="python", args=["server.py"]
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # 获取 MCP 工具并转换格式
            mcp_tools_result = await session.list_tools()
            openai_tools = mcp_tools_to_openai_format(mcp_tools_result.tools)

            messages = [{"role": "user", "content": user_message}]

            # Agent 循环
            max_iterations = 10
            for _ in range(max_iterations):
                response = await openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=messages,
                    tools=openai_tools if openai_tools else None,
                    tool_choice="auto"
                )

                message = response.choices[0].message
                finish_reason = response.choices[0].finish_reason

                if finish_reason == "stop":
                    return message.content

                if finish_reason == "tool_calls":
                    messages.append(message)

                    for tool_call in message.tool_calls:
                        func_name = tool_call.function.name
                        func_args = json.loads(tool_call.function.arguments)

                        # 通过 MCP Client 调用工具
                        mcp_result = await session.call_tool(
                            name=func_name,
                            arguments=func_args
                        )

                        # 提取结果文本
                        result_text = "\n".join([
                            c.text for c in mcp_result.content
                            if hasattr(c, "text")
                        ])

                        if mcp_result.isError:
                            result_text = f"工具执行失败：{result_text}"

                        messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "content": result_text
                        })

            return "已达到最大迭代次数"

# 运行示例
result = asyncio.run(mcp_llm_agent("查询年龄大于30岁的客户列表，并统计数量"))
print(result)
```
:::

---

## 五、资源读取（read_resource）

::: details 资源发现与读取示例

```python
# src/mcp_client/resource_reading.py
import asyncio
import json
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def read_resources_demo():
    server_params = StdioServerParameters(
        command="python", args=["server.py"]
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # 列出所有资源
            resources = await session.list_resources()
            print(f"可用资源（{len(resources.resources)} 个）：")
            for resource in resources.resources:
                print(f"  URI: {resource.uri}")
                print(f"  名称: {resource.name}")
                print(f"  类型: {resource.mimeType}")
                print()

            # 读取特定资源
            for resource in resources.resources:
                try:
                    content = await session.read_resource(resource.uri)

                    print(f"资源内容 [{resource.uri}]：")
                    for item in content.contents:
                        if hasattr(item, "text"):
                            # 文本资源
                            text = item.text
                            if resource.mimeType == "application/json":
                                # JSON 资源格式化展示
                                try:
                                    data = json.loads(text)
                                    print(json.dumps(data, ensure_ascii=False, indent=2))
                                except json.JSONDecodeError:
                                    print(text[:500])
                            else:
                                print(text[:500])

                        elif hasattr(item, "blob"):
                            # 二进制资源
                            print(f"  二进制资源，大小：{len(item.blob)} bytes")

                except Exception as e:
                    print(f"读取资源失败 {resource.uri}: {e}")

asyncio.run(read_resources_demo())
```
:::

---

## 六、调试 MCP 连接（MCP Inspector）

### 1. MCP Inspector 介绍

MCP Inspector 是官方提供的图形化调试工具，可以：
- 连接任意 MCP Server
- 可视化浏览工具、资源、提示词
- 手动调用工具并查看结果
- 检查协议通信日志

### 2. 安装与使用

```bash
# 安装（需要 Node.js）
npm install -g @modelcontextprotocol/inspector

# 启动 Inspector 并连接到本地 Server
mcp-inspector --server "python server.py"

# 连接到远程 SSE Server
mcp-inspector --server-url "http://localhost:8080/sse"

# Inspector 会在 http://localhost:5173 启动 Web UI
```

### 3. 常见调试场景

| 问题 | 调试方法 |
|------|---------|
| Server 启动失败 | 检查 Inspector 的错误输出，确认 Python 路径和依赖 |
| 工具不显示 | 确认 `list_tools` 返回了正确的工具定义 |
| 工具调用返回空 | 在 Inspector 中手动调用工具，查看原始返回 |
| JSON Schema 错误 | 在 Inspector 中查看工具的 inputSchema 是否合法 |
| 认证失败 | 检查环境变量是否正确传递到 Server |

::: details 使用 Python 脚本调试 MCP 通信

```python
# src/mcp_client/debug_client.py
import asyncio
import json
import logging
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# 开启详细日志
logging.basicConfig(level=logging.DEBUG)

async def debug_mcp_server(server_script: str):
    """完整调试一个 MCP Server 的所有功能"""
    server_params = StdioServerParameters(
        command="python",
        args=[server_script],
        env={"LOG_LEVEL": "DEBUG"}
    )

    print("=" * 60)
    print(f"调试 MCP Server: {server_script}")
    print("=" * 60)

    try:
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                # 初始化
                init_result = await session.initialize()
                print(f"\n[初始化成功]")
                print(f"Server 名称：{init_result.serverInfo.name}")
                print(f"Server 版本：{init_result.serverInfo.version}")
                print(f"支持的能力：{init_result.capabilities}")

                # 调试工具
                print("\n[工具列表]")
                tools = await session.list_tools()
                for t in tools.tools:
                    print(f"  ✓ {t.name}: {t.description[:60]}...")

                    # 尝试用空参数调用（测试错误处理）
                    result = await session.call_tool(t.name, {})
                    status = "✓ 正常返回" if not result.isError else "✗ 返回错误"
                    print(f"    空参数调用：{status}")

                # 调试资源
                print("\n[资源列表]")
                resources = await session.list_resources()
                for r in resources.resources:
                    print(f"  ✓ {r.uri}: {r.name}")
                    try:
                        content = await session.read_resource(r.uri)
                        print(f"    读取成功，内容长度：{len(str(content.contents[0]))} 字符")
                    except Exception as e:
                        print(f"    读取失败：{e}")

                # 调试提示词
                print("\n[提示词列表]")
                prompts = await session.list_prompts()
                for p in prompts.prompts:
                    print(f"  ✓ {p.name}: {p.description}")

                print("\n[调试完成] Server 运行正常")

    except Exception as e:
        print(f"\n[连接失败] {type(e).__name__}: {e}")
        raise

asyncio.run(debug_mcp_server("server.py"))
```
:::

---

## 七、常见集成场景

### 1. 场景一：IDE 插件集成

通过 MCP 为代码编辑器提供智能辅助能力：

```python
# IDE 插件通过 MCP 调用代码分析工具
async def analyze_code_with_mcp(file_path: str) -> str:
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # 读取文件资源
            file_content = await session.read_resource(f"file:///{file_path}")
            code = file_content.contents[0].text

            # 调用代码分析工具
            result = await session.call_tool("analyze_code", {
                "code": code,
                "language": "python",
                "checks": ["security", "performance", "style"]
            })
            return result.content[0].text
```

### 2. 场景二：企业知识库集成

::: details 将企业文档接入 Claude 的完整流程

```python
# src/mcp_client/enterprise_kb.py
# 企业知识库 MCP Server 接入示例

import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from anthropic import Anthropic

anthropic_client = Anthropic()

async def query_knowledge_base(question: str) -> str:
    """
    使用 MCP 接入企业知识库，让 Claude 回答内部问题
    """
    server_params = StdioServerParameters(
        command="python",
        args=["enterprise_kb_server.py"],
        env={
            "KB_URL": "https://internal.company.com/kb",
            "KB_API_KEY": "your_kb_api_key"
        }
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # 获取工具列表
            tools_result = await session.list_tools()

            # 构建 Anthropic 格式的工具定义
            claude_tools = [
                {
                    "name": tool.name,
                    "description": tool.description,
                    "input_schema": tool.inputSchema
                }
                for tool in tools_result.tools
            ]

            messages = [{"role": "user", "content": question}]

            # Agent 循环
            while True:
                response = anthropic_client.messages.create(
                    model="claude-opus-4-5",
                    max_tokens=2048,
                    tools=claude_tools,
                    messages=messages
                )

                if response.stop_reason == "end_turn":
                    for block in response.content:
                        if block.type == "text":
                            return block.text
                    return ""

                elif response.stop_reason == "tool_use":
                    messages.append({"role": "assistant", "content": response.content})
                    tool_results = []

                    for block in response.content:
                        if block.type == "tool_use":
                            # 通过 MCP 调用企业知识库工具
                            mcp_result = await session.call_tool(
                                name=block.name,
                                arguments=block.input
                            )
                            result_text = mcp_result.content[0].text if mcp_result.content else ""

                            tool_results.append({
                                "type": "tool_result",
                                "tool_use_id": block.id,
                                "content": result_text
                            })

                    messages.append({"role": "user", "content": tool_results})

# 使用
answer = asyncio.run(query_knowledge_base("我们公司的年假政策是什么？"))
print(answer)
```
:::

### 3. 场景三：自动化运维

::: tip 运维场景的安全建议
将运维工具接入 MCP 时，务必实现：
1. 权限分级（只读 vs 读写 vs 危险操作）
2. 操作审计日志（记录所有工具调用和操作者）
3. 危险操作二次确认（如重启服务、删除数据）
4. 白名单机制（限制可操作的服务器/数据库范围）
:::

```python
# 运维 MCP Server 的工具设计示例（只展示工具定义，不展示实现）
DEVOPS_TOOLS = [
    # 只读工具（低风险）
    {"name": "get_service_status", "description": "查看服务运行状态"},
    {"name": "get_system_metrics", "description": "获取系统资源使用情况（CPU/内存/磁盘）"},
    {"name": "get_recent_logs", "description": "获取最近的服务日志"},

    # 写操作工具（中等风险，需要确认）
    {"name": "restart_service", "description": "重启指定服务（需要确认）"},
    {"name": "scale_replicas", "description": "调整服务副本数量"},

    # 危险操作（高风险，需要双重确认）
    {"name": "rollback_deployment", "description": "回滚部署版本（不可逆操作，需要双重确认）"},
]
```
