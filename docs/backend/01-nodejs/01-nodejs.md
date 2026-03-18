---
title: "Node.js 概述"
category: "后端 · Node.js"
tags:
  - Node.js
  - JavaScript
  - 后端
excerpt: "Node.js 是基于 Chrome V8 引擎的 JavaScript 运行时，采用事件驱动、非阻塞 I/O 模型，适合构建高并发、数据密集型应用。"
date: 2024-01-15
---

# Node.js 概述

## 一、什么是 Node.js

Node.js 是一个开源、跨平台的 JavaScript 运行时环境，让 JavaScript 可以脱离浏览器在服务器端运行。

### 1. 核心特性

| 特性 | 说明 |
|------|------|
| **V8 引擎** | 使用 Chrome 的 V8 引擎编译执行 JavaScript，性能强劲 |
| **事件驱动** | 基于事件循环机制处理并发请求 |
| **非阻塞 I/O** | 异步 I/O 操作不会阻塞主线程 |
| **单线程** | 主线程单线程运行，通过事件循环实现高并发 |
| **跨平台** | 支持 Windows、macOS、Linux 等操作系统 |

### 2. 适用场景

- **实时应用**：聊天室、协作工具、在线游戏
- **API 服务**：RESTful API、GraphQL 服务
- **微服务架构**：轻量级服务节点
- **工具链**：构建工具、脚手架、自动化脚本
- **SSR 应用**：服务端渲染（Next.js、Nuxt.js）

> [!warning]
> Node.js 不适合 CPU 密集型任务（如图像处理、视频编码），因为单线程模型会阻塞事件循环。

## 二、安装与版本管理

### 1. 官方安装

访问 [nodejs.org](https://nodejs.org) 下载安装包：

- **LTS 版本**：长期支持版，生产环境推荐
- **Current 版本**：最新特性版，尝鲜使用

::: details 验证安装
```bash
# 查看 Node.js 版本
node -v

# 查看 npm 版本
npm -v

# 运行 REPL 交互环境
node
```
:::

### 2. 版本管理工具

使用 `nvm`（Node Version Manager）管理多版本：

::: code-group
```bash [macOS/Linux]
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装指定版本
nvm install 20.10.0

# 切换版本
nvm use 20.10.0

# 设置默认版本
nvm alias default 20.10.0
```

```powershell [Windows]
# 使用 nvm-windows
# 下载：https://github.com/coreybutler/nvm-windows/releases

# 安装版本
nvm install 20.10.0

# 使用版本
nvm use 20.10.0
```
:::

## 三、第一个 Node.js 程序

### 1. Hello World

::: details 创建并运行
```js
// hello.js
console.log('Hello, Node.js!')

// 输出系统信息
console.log('Node 版本:', process.version)
console.log('平台:', process.platform)
console.log('架构:', process.arch)
```

运行：
```bash
node hello.js
```
:::

### 2. 创建 HTTP 服务器

::: details 基础 HTTP 服务
```js
// server.js
const http = require('http')

const server = http.createServer((req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.end('你好，Node.js！')
})

const PORT = 3000
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
})
```

访问 `http://localhost:3000` 查看结果。
:::

## 四、核心概念

### 1. 事件循环（Event Loop）

Node.js 通过事件循环处理异步操作，主要阶段：

```
   ┌───────────────────────────┐
┌─>│           timers          │  执行 setTimeout/setInterval 回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │  执行延迟到下一轮的 I/O 回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │  内部使用
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           poll            │  检索新的 I/O 事件
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           check           │  执行 setImmediate 回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤      close callbacks      │  关闭回调（如 socket.on('close')）
   └───────────────────────────┘
```

### 2. 全局对象

| 对象 | 说明 |
|------|------|
| `global` | 全局命名空间对象（类似浏览器的 `window`） |
| `process` | 进程信息和控制 |
| `console` | 控制台输出 |
| `Buffer` | 二进制数据处理 |
| `__dirname` | 当前模块所在目录的绝对路径 |
| `__filename` | 当前模块文件的绝对路径 |

::: details 常用 process 属性
```js
// 环境变量
console.log(process.env.NODE_ENV)

// 命令行参数
console.log(process.argv)

// 当前工作目录
console.log(process.cwd())

// 退出进程
process.exit(0)

// 监听未捕获异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err)
  process.exit(1)
})
```
:::

## 五、包管理器

### 1. npm（Node Package Manager）

Node.js 自带的包管理工具：

```bash
# 初始化项目
npm init -y

# 安装依赖
npm install express

# 安装开发依赖
npm install --save-dev nodemon

# 全局安装
npm install -g pm2

# 卸载包
npm uninstall express
```

### 2. package.json

项目配置文件：

::: details 示例配置
```json
{
  "name": "my-app",
  "version": "1.0.0",
  "description": "我的 Node.js 应用",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```
:::

### 3. 其他包管理器

- **yarn**：Facebook 开发，速度快、离线缓存
- **pnpm**：节省磁盘空间，使用硬链接共享依赖

```bash
# yarn
yarn add express
yarn remove express

# pnpm
pnpm add express
pnpm remove express
```

## 六、开发工具

### 1. 调试

::: code-group
```bash [Chrome DevTools]
# 启动调试模式
node --inspect index.js

# 在第一行断点
node --inspect-brk index.js

# 打开 chrome://inspect 连接调试
```

```js [VS Code]
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "启动程序",
      "program": "${workspaceFolder}/index.js"
    }
  ]
}
```
:::

### 2. 热重载

使用 `nodemon` 自动重启：

```bash
# 安装
npm install -g nodemon

# 使用
nodemon index.js

# 配置文件 nodemon.json
{
  "watch": ["src"],
  "ext": "js,json",
  "ignore": ["node_modules"],
  "exec": "node index.js"
}
```

## 七、最佳实践

1. **使用 LTS 版本**：生产环境选择长期支持版本
2. **环境变量管理**：使用 `.env` 文件配合 `dotenv` 包
3. **错误处理**：捕获未处理的 Promise 拒绝和异常
4. **日志记录**：使用 `winston` 或 `pino` 替代 `console.log`
5. **进程管理**：生产环境使用 `pm2` 管理进程
6. **安全更新**：定期运行 `npm audit` 检查漏洞

> [!tip]
> 使用 `nvm` 管理多版本 Node.js，方便在不同项目间切换。
