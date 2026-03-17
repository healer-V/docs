---
title: "Electron 进程间通信"
category: "跨端 · Electron"
tags:
  - Electron
  - IPC
  - Main Process
  - Renderer Process
date: 2026-03-17
---

# Electron 进程间通信

主进程与渲染进程运行在相互隔离的上下文中，它们之间的数据交换必须通过 IPC（Inter-Process Communication，进程间通信）机制完成。正确理解 IPC 通信模型是构建 Electron 应用的核心。

## 一、IPC 通信模型

Electron 提供了两个核心模块实现 IPC 通信：

- `ipcMain`：在主进程中监听来自渲染进程的消息
- `ipcRenderer`：在渲染进程中向主进程发送消息或接收主进程消息

渲染进程**不能直接**访问 `ipcMain`，主进程也不能直接访问 `ipcRenderer`。安全的通信路径是：

```
渲染进程
   ↓  ipcRenderer.invoke / send
Preload 脚本（contextBridge 暴露 API）
   ↓
主进程 ipcMain.handle / on
```

## 二、invoke/handle（双向通信，推荐）

`invoke/handle` 是基于 Promise 的请求-响应模式，渲染进程发起请求，主进程处理后返回结果。适合需要等待处理结果的场景。

::: details invoke/handle 完整示例

```js
// src/main/index.js — 主进程
const { ipcMain, dialog } = require('electron')
const fs = require('fs')
const path = require('path')

// 注册处理器：读取文件
ipcMain.handle('file:read', async (event, filePath) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8')
    return { success: true, content }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 注册处理器：打开文件选择对话框
ipcMain.handle('dialog:openFile', async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt', 'md'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })

  if (canceled) return null
  return filePaths[0]
})
```

```js
// src/main/preload.js — Preload 脚本
const { contextBridge, ipcRenderer } = require('electron')

// 通过 contextBridge 安全地暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
})
```

```js
// src/renderer/app.js — 渲染进程
// 通过 window.electronAPI 访问暴露的 API（不直接接触 ipcRenderer）
async function openAndReadFile() {
  // 调用对话框选择文件
  const filePath = await window.electronAPI.openFileDialog()
  if (!filePath) return

  // 读取文件内容
  const result = await window.electronAPI.readFile(filePath)
  if (result.success) {
    document.getElementById('content').textContent = result.content
  } else {
    console.error('读取文件失败:', result.error)
  }
}
```

:::

## 三、send/on（单向通信）

`send/on` 是单向消息推送模式，不需要等待响应。适合通知类场景（如进度更新、状态变化）。

### 1. 渲染进程 → 主进程（单向）

::: details 渲染进程向主进程发送通知

```js
// src/main/preload.js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // 发送单向消息（不等待响应）
  logMessage: (message) => ipcRenderer.send('app:log', message),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
})
```

```js
// src/main/index.js
const { ipcMain, BrowserWindow } = require('electron')

// 监听渲染进程消息
ipcMain.on('app:log', (event, message) => {
  console.log('[Renderer Log]:', message)
  // event.sender 是发送消息的 WebContents
})

ipcMain.on('window:minimize', (event) => {
  BrowserWindow.fromWebContents(event.sender).minimize()
})
```

:::

### 2. 主进程 → 渲染进程（主动推送）

主进程可以通过 `webContents.send` 向渲染进程主动推送消息：

::: details 主进程推送消息到渲染进程

```js
// src/main/index.js — 主进程推送下载进度
const { BrowserWindow, ipcMain } = require('electron')

function simulateDownload(mainWindow) {
  let progress = 0
  const timer = setInterval(() => {
    progress += 10
    // 向渲染进程推送进度
    mainWindow.webContents.send('download:progress', { progress, total: 100 })

    if (progress >= 100) {
      clearInterval(timer)
      mainWindow.webContents.send('download:complete', { filename: 'file.zip' })
    }
  }, 500)
}

ipcMain.handle('download:start', (event) => {
  const mainWindow = BrowserWindow.fromWebContents(event.sender)
  simulateDownload(mainWindow)
  return { started: true }
})
```

```js
// src/main/preload.js — 暴露监听 API
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  startDownload: () => ipcRenderer.invoke('download:start'),
  // 注册下载进度回调
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download:progress', (event, data) => callback(data))
  },
  onDownloadComplete: (callback) => {
    ipcRenderer.once('download:complete', (event, data) => callback(data))
  },
  // 移除监听器（避免内存泄漏）
  removeDownloadListeners: () => {
    ipcRenderer.removeAllListeners('download:progress')
    ipcRenderer.removeAllListeners('download:complete')
  },
})
```

```js
// src/renderer/downloader.js — 渲染进程
const progressBar = document.getElementById('progress-bar')
const statusText = document.getElementById('status')

async function startDownload() {
  // 注册进度监听
  window.electronAPI.onDownloadProgress(({ progress, total }) => {
    progressBar.style.width = `${(progress / total) * 100}%`
    statusText.textContent = `下载中... ${progress}/${total}`
  })

  window.electronAPI.onDownloadComplete(({ filename }) => {
    statusText.textContent = `${filename} 下载完成`
    window.electronAPI.removeDownloadListeners() // 清理监听器
  })

  await window.electronAPI.startDownload()
}
```

:::

::: warning 避免内存泄漏
渲染进程中通过 `ipcRenderer.on` 注册的监听器，在组件卸载时必须通过 `ipcRenderer.removeListener` 或 `removeAllListeners` 移除，否则每次组件挂载都会累积新的监听器。
:::

## 四、contextBridge 暴露安全 API

`contextBridge` 是 Preload 脚本向渲染进程暴露 API 的唯一安全方式。它在主世界（Main World）和隔离世界（Isolated World）之间建立一个安全通道。

::: details 完整的 Preload 脚本设计模式

```js
// src/main/preload.js
const { contextBridge, ipcRenderer } = require('electron')
const { shell } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // ===== 窗口控制 =====
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },

  // ===== 文件系统 =====
  fs: {
    readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
    openDialog: (options) => ipcRenderer.invoke('dialog:openFile', options),
    saveDialog: (options) => ipcRenderer.invoke('dialog:saveFile', options),
  },

  // ===== 系统集成 =====
  shell: {
    // 使用系统默认浏览器打开链接（安全方式，直接暴露 shell.openExternal）
    openExternal: (url) => shell.openExternal(url),
  },

  // ===== 事件监听 =====
  on: (channel, callback) => {
    // 白名单机制：只允许监听指定频道
    const allowedChannels = ['app:update', 'app:notification', 'menu:action']
    if (allowedChannels.includes(channel)) {
      const subscription = (event, ...args) => callback(...args)
      ipcRenderer.on(channel, subscription)
      // 返回取消监听函数
      return () => ipcRenderer.removeListener(channel, subscription)
    }
  },
})
```

:::

## 五、Preload 安全实践

### 1. 安全配置清单

```js
// src/main/index.js
new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,   // 必须开启：隔离上下文，防止渲染进程访问 Electron 内部
    nodeIntegration: false,   // 必须关闭：禁止渲染进程直接使用 Node.js
    sandbox: false,           // Preload 脚本需要 Node.js 时设为 false
    webSecurity: true,        // 保持默认：开启同源策略
    allowRunningInsecureContent: false, // 禁止 HTTPS 页面加载 HTTP 内容
  },
})
```

### 2. 安全实践原则

| 原则 | 说明 |
|------|------|
| 最小权限暴露 | 只通过 `contextBridge` 暴露渲染进程实际需要的 API |
| 输入验证 | 主进程处理 `ipcMain` 消息时，验证参数类型和范围 |
| 白名单 channel | 在 Preload 中限制可监听的 IPC channel 列表 |
| 避免暴露原始 ipcRenderer | 不要把 `ipcRenderer` 对象直接暴露给渲染进程 |
| 路径安全 | 文件操作时验证路径，防止路径穿越攻击 |

## 六、通信最佳实践与常见错误

### 1. 最佳实践

::: tip 使用命名空间组织 IPC channel

IPC channel 名称推荐使用 `模块:操作` 格式（如 `file:read`、`window:minimize`），避免命名冲突：

```js
// 推荐的 channel 命名规范
'window:minimize'    // 窗口最小化
'window:maximize'    // 窗口最大化
'fs:readFile'        // 读取文件
'fs:writeFile'       // 写入文件
'dialog:openFile'    // 打开文件对话框
'app:getVersion'     // 获取应用版本
'store:get'          // 读取持久化数据
'store:set'          // 写入持久化数据
```

:::

### 2. 常见错误排查

| 错误现象 | 原因 | 解决方案 |
|----------|------|----------|
| `window.electronAPI is undefined` | Preload 脚本未正确加载 | 检查 `webPreferences.preload` 路径是否为绝对路径 |
| `contextBridge` 暴露的方法返回 `undefined` | `contextIsolation: false` 时不能用 `contextBridge` | 保持 `contextIsolation: true` |
| IPC 调用没有响应 | `ipcMain.handle` 中抛出了未捕获的错误 | 在 handle 中包裹 try/catch 并返回错误信息 |
| 渲染进程无法访问 Node.js | `nodeIntegration: false`（正确行为） | 通过 Preload + contextBridge 暴露所需 API |
| 内存持续增长 | 渲染进程中 `ipcRenderer.on` 监听器未清理 | 在组件卸载时调用 `removeListener` |

::: details IPC 错误处理完整示例

```js
// src/main/index.js — 主进程带错误处理的 handle
ipcMain.handle('fs:readFile', async (event, filePath) => {
  // 输入验证：确保路径在允许的目录内
  const allowedDir = path.join(app.getPath('userData'), 'documents')
  const resolvedPath = path.resolve(filePath)

  if (!resolvedPath.startsWith(allowedDir)) {
    throw new Error('访问路径不在允许范围内')
  }

  try {
    const content = await fs.promises.readFile(resolvedPath, 'utf-8')
    return content
  } catch (error) {
    // 将错误信息序列化后返回（IPC 只能传输可序列化的数据）
    throw new Error(`读取文件失败: ${error.message}`)
  }
})
```

```js
// src/renderer/app.js — 渲染进程错误处理
async function readDocument(filePath) {
  try {
    const content = await window.electronAPI.fs.readFile(filePath)
    return content
  } catch (error) {
    // invoke 调用抛出的错误会传递到渲染进程
    console.error('文件读取错误:', error.message)
    showErrorToast(error.message)
  }
}
```

:::
