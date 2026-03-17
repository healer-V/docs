---
title: "Electron 环境搭建"
category: "跨端 · Electron"
tags:
  - Electron
  - 桌面应用
  - 环境搭建
  - 项目初始化
date: 2026-03-17
---

# Electron 环境搭建

Electron 是由 GitHub 开发的开源框架，它将 Chromium 渲染引擎和 Node.js 运行时嵌入应用，让你使用 HTML、CSS、JavaScript 构建跨平台桌面应用。

## 一、Electron 架构

### 1. 三层进程模型

Electron 应用由三种进程组成，各司其职：

```
┌─────────────────────────────────────────┐
│              Electron 应用               │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │         主进程（Main Process）    │    │
│  │    Node.js + Electron Native API │    │
│  │  管理应用生命周期、创建窗口、原生API │    │
│  └────────────┬────────────────────┘    │
│               │ IPC 通信                 │
│    ┌──────────┴──────────┐              │
│    │   Preload 脚本       │              │
│    │  Node.js + 受限 API  │              │
│    │  安全桥接主进程与渲染进程 │           │
│    └──────────┬──────────┘              │
│               │                         │
│  ┌────────────┴────────────────────┐    │
│  │       渲染进程（Renderer Process）│    │
│  │      Chromium（Web 标准 API）     │    │
│  │     负责 UI 渲染，可有多个窗口     │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

| 进程 | 运行环境 | 职责 |
|------|----------|------|
| 主进程 | Node.js + Electron API | 应用生命周期管理、BrowserWindow 创建、原生 API 调用 |
| 渲染进程 | Chromium（Web 环境） | UI 渲染，每个窗口对应一个渲染进程 |
| Preload 脚本 | Node.js（受限）+ Web API | 安全地将主进程能力暴露给渲染进程 |

### 2. Chromium + Node.js 运行时

Electron 将 Chromium 和 Node.js 集成到同一运行时中：

- **Chromium**：提供完整的 Web 渲染能力，支持最新的 Web 标准
- **Node.js**：提供文件系统、网络、原生模块等系统级能力
- **两者共享同一个 V8 引擎**：性能开销小，可以在同一上下文中混用 Web API 和 Node.js API

::: warning 安全隔离原则
出于安全考虑，渲染进程默认禁止直接访问 Node.js API（`nodeIntegration: false`）。应通过 Preload 脚本和 `contextBridge` 安全地暴露需要的能力。
:::

## 二、项目初始化

### 1. 手动创建项目

::: details 手动初始化 Electron 项目

```bash
# 创建项目目录
mkdir my-electron-app && cd my-electron-app

# 初始化 package.json
npm init -y
```

```json
// package.json — Electron 项目必要配置
{
  "name": "my-electron-app",
  "version": "1.0.0",
  "description": "My Electron Application",
  "main": "src/main/index.js",    // 主进程入口，必须配置
  "scripts": {
    "start": "electron .",        // 启动应用
    "dev": "electron . --inspect" // 启动并开启调试
  },
  "devDependencies": {
    "electron": "^29.0.0"
  }
}
```

```bash
npm install -D electron
```

:::

### 2. 项目目录结构（推荐）

```
my-electron-app/
├── src/
│   ├── main/
│   │   ├── index.js        # 主进程入口
│   │   └── preload.js      # Preload 脚本
│   └── renderer/
│       ├── index.html      # 渲染进程 HTML
│       ├── index.js        # 渲染进程 JS
│       └── style.css
├── package.json
└── .gitignore
```

### 3. package.json 关键字段说明

| 字段 | 说明 |
|------|------|
| `main` | 主进程入口文件路径，Electron 启动时读取此文件 |
| `scripts.start` | 开发启动命令 |
| `scripts.build` | 打包命令（需配合 electron-builder） |
| `author` | 应用作者（打包时使用） |
| `description` | 应用描述 |

## 三、BrowserWindow 创建与配置

`BrowserWindow` 是创建和控制浏览器窗口的核心 API。

::: details 完整主进程示例（src/main/index.js）

```js
// src/main/index.js
const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')

// 判断是否为开发环境
const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,            // 窗口宽度
    height: 800,            // 窗口高度
    minWidth: 800,          // 最小宽度
    minHeight: 600,         // 最小高度
    center: true,           // 窗口居中显示
    title: 'My Application',

    // 窗口外观
    titleBarStyle: 'hiddenInset', // macOS 隐藏标题栏（保留控制按钮）
    backgroundColor: '#ffffff',

    // 安全配置
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Preload 脚本路径
      contextIsolation: true,   // 开启上下文隔离（推荐）
      nodeIntegration: false,   // 关闭渲染进程的 Node.js 访问（推荐）
      sandbox: false,           // 沙箱模式（true 时限制 preload 能力）
    },
  })

  // 加载页面
  if (isDev) {
    // 开发环境加载 dev server 地址（配合 Vite/webpack-dev-server）
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools() // 自动打开开发者工具
  } else {
    // 生产环境加载本地 HTML 文件
    mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'))
  }

  // 窗口加载完成后显示（避免白屏闪烁）
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
}

// 应用就绪后创建窗口
app.whenReady().then(() => {
  createWindow()

  // macOS：点击 Dock 图标时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 所有窗口关闭时退出应用（Windows/Linux）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
```

:::

### 1. BrowserWindow 常用配置项

| 配置项 | 类型 | 说明 |
|--------|------|------|
| `width` / `height` | `number` | 窗口初始宽高（像素） |
| `minWidth` / `minHeight` | `number` | 窗口最小宽高限制 |
| `resizable` | `boolean` | 是否允许调整窗口大小 |
| `frame` | `boolean` | `false` 创建无边框窗口 |
| `titleBarStyle` | `string` | 标题栏样式（macOS：`default/hidden/hiddenInset`） |
| `show` | `boolean` | 创建后是否立即显示（默认 `true`） |
| `icon` | `string` | 应用图标路径 |
| `backgroundColor` | `string` | 背景色，避免加载时白屏 |
| `webPreferences.preload` | `string` | Preload 脚本绝对路径 |
| `webPreferences.contextIsolation` | `boolean` | 上下文隔离（强烈推荐 `true`） |
| `webPreferences.nodeIntegration` | `boolean` | 渲染进程访问 Node.js（推荐 `false`） |

## 四、开发者工具

### 1. 内置开发者工具

Electron 内置 Chromium 开发者工具，与浏览器 DevTools 完全一致：

```js
// 打开开发者工具
mainWindow.webContents.openDevTools()

// 指定开发者工具位置
mainWindow.webContents.openDevTools({ mode: 'right' }) // left | right | bottom | detach

// 关闭开发者工具
mainWindow.webContents.closeDevTools()
```

### 2. 安装 Vue/React DevTools

::: details 安装前端框架 DevTools 扩展

```bash
npm install -D electron-devtools-installer
```

```js
// src/main/index.js
const { default: installExtension, VUEJS3_DEVTOOLS, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer')

app.whenReady().then(async () => {
  if (isDev) {
    // 安装 Vue DevTools
    await installExtension(VUEJS3_DEVTOOLS)
    // 或安装 React DevTools
    // await installExtension(REACT_DEVELOPER_TOOLS)
  }
  createWindow()
})
```

:::

## 五、工具链选择

| 工具 | 定位 | 优点 | 适用场景 |
|------|------|------|----------|
| **Electron Forge** | 官方脚手架 | 开箱即用，内置打包、发布 | 快速起步，中小型项目 |
| **electron-builder** | 第三方打包工具 | 配置灵活，功能强大 | 企业级项目，需要精细控制 |
| **electron-vite** | 基于 Vite 的构建工具 | HMR 速度快，现代化体验 | 新项目，技术栈偏向 Vite |
| **手动配置** | 自定义构建 | 完全控制 | 特殊需求 |

### 1. 使用 Electron Forge 创建项目

::: details Electron Forge 快速上手

```bash
# 使用官方模板创建项目
npm create electron-app@latest my-app -- --template=vite

# 进入项目并启动
cd my-app
npm start
```

Forge 生成的项目结构：

```
my-app/
├── src/
│   ├── main.js          # 主进程
│   ├── preload.js       # Preload 脚本
│   └── renderer.js      # 渲染进程
├── forge.config.js      # Forge 配置
├── package.json
└── vite.*.config.mjs    # Vite 配置
```

:::

### 2. 使用 electron-vite 创建项目

::: details electron-vite 快速上手

```bash
# 创建项目（支持 Vue3/React/Vanilla 模板）
npm create @quick-start/electron my-app -- --template=vue

cd my-app
npm install
npm run dev   # 启动开发模式（支持 HMR）
npm run build # 打包生产版本
```

electron-vite 将主进程、preload、渲染进程分别用 Vite 构建，开发体验接近纯 Web 开发。

:::
