# MCP 协议

## 核心优势

- **标准化协议**：为 AI 模型与外部工具之间的通信提供统一规范，解决集成碎片化问题
- **安全可控**：内置权限控制和安全机制，确保 AI 工具调用的安全性
- **生态丰富**：支持 Claude、VS Code 等主流平台，社区提供大量现成的 MCP Server

## 适用场景

MCP 协议适用于以下场景：

- 开发 AI 工具插件，让模型能访问数据库、文件系统等外部资源
- 构建标准化的 AI 集成方案，避免为每个模型单独适配
- 企业级 AI 应用中的工具编排和权限管理

## 技术栈

- **协议**：MCP（Model Context Protocol）
- **开发语言**：TypeScript、Python
- **SDK**：@modelcontextprotocol/sdk
- **传输层**：stdio、Streamable HTTP

## 学习路线

1. **MCP 入门**：理解协议架构（Host、Client、Server），核心能力（Resources、Tools、Prompts），开发第一个 MCP Server
