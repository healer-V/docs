---
title: "Electron 集成前端框架"
category: "跨端 · Electron"
tags:
  - Electron
  - Vue
  - React
  - 集成
date: 2026-03-17
---

# Electron 集成前端框架

将 Electron 与现代前端框架（Vue 3、React）结合，能以 Web 开发的方式构建桌面应用，同时享有 HMR 热更新、TypeScript 支持等现代开发体验。

## 一、Electron + Vue 3（electron-vite 方案）

[electron-vite](https://electron-vite.org/) 是目前最推荐的 Electron + Vue 3 构建工具，基于 Vite 构建，开发体验极佳。

### 1. 脚手架初始化

::: details electron-vite 创建 Vue 3 项目

```bash
# 创建项目（选择 vue 模板）
npm create @quick-start/electron my-vue-app -- --template=vue-ts

cd my-vue-app
npm install
npm run dev    # 启动开发模式（支持 HMR）
```

生成的项目结构：

```
my-vue-app/
├── src/
│   ├── main/
│   │   └── index.ts         # 主进程入口
│   ├── preload/
│   │   └── index.ts         # Preload 脚本
│   └── renderer/
│       ├── src/             # Vue 3 应用代码
│       │   ├── App.vue
│       │   ├── main.ts
│       │   └── components/
│       └── index.html
├── electron.vite.config.ts  # electron-vite 配置
├── tsconfig.json
└── package.json
```

:::

### 2. 主进程配置

::: details src/main/index.ts — 主进程

```ts
// src/main/index.ts
import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // 在默认浏览器中打开外部链接（而不是在 Electron 窗口中）
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 开发环境加载 Vite dev server，生产环境加载打包后的 HTML
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // electron-toolkit 工具：设置 AppUserModelId（Windows）、快捷键优化等
  electronApp.setAppUserModelId('com.example.my-vue-app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

:::

### 3. 渲染进程（Vue 3 应用）

::: details src/renderer/src/App.vue — 调用原生 API

```vue
<!-- src/renderer/src/App.vue -->
<script setup lang="ts">
import { ref } from 'vue'

// 使用 Preload 脚本暴露的 API（通过 window.api 访问）
const filePath = ref<string>('')
const fileContent = ref<string>('')

async function openFile() {
  // 调用文件选择对话框（通过 IPC）
  const paths = await window.api.openFileDialog()
  if (paths && paths.length > 0) {
    filePath.value = paths[0]
    fileContent.value = await window.api.readFile(paths[0])
  }
}
</script>

<template>
  <div class="app">
    <button @click="openFile">打开文件</button>
    <p v-if="filePath">{{ filePath }}</p>
    <pre v-if="fileContent">{{ fileContent }}</pre>
  </div>
</template>
```

为 `window.api` 添加 TypeScript 类型声明：

```ts
// src/renderer/src/env.d.ts
/// <reference types="vite/client" />

interface Window {
  api: {
    openFileDialog: () => Promise<string[] | null>
    readFile: (filePath: string) => Promise<string>
    // 其他 API...
  }
}
```

:::

## 二、Electron + React

### 1. 使用 Vite 模板（推荐）

::: details electron-vite 创建 React + TypeScript 项目

```bash
npm create @quick-start/electron my-react-app -- --template=react-ts

cd my-react-app
npm install
npm run dev
```

:::

### 2. 使用 CRA（Create React App）集成

::: details CRA + electron-is-dev 手动集成

```bash
npx create-react-app my-app
cd my-app
npm install -D electron electron-is-dev concurrently wait-on
```

调整 `package.json`：

```json
{
  "main": "public/electron.js",
  "scripts": {
    "electron:dev": "concurrently \"npm start\" \"wait-on http://localhost:3000 && electron .\"",
    "electron:build": "npm run build && electron-builder"
  }
}
```

```js
// public/electron.js — CRA 方式的主进程入口
const { app, BrowserWindow } = require('electron')
const isDev = require('electron-is-dev')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // 开发环境加载 CRA dev server，生产环境加载打包后的 index.html
  win.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  )
}

app.whenReady().then(createWindow)
```

:::

## 三、路由处理

在 Electron 中，生产环境使用 `file://` 协议加载 HTML，URL 中没有域名，因此需要特别处理路由。

### 1. Hash 模式（推荐）

Hash 路由（`/#/path`）不依赖服务器，在 `file://` 协议下直接可用，是 Electron 中最简单的路由方案。

::: details Vue Router 使用 hash 模式

```ts
// src/renderer/src/router/index.ts
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(), // 使用 hash 模式
  routes: [
    { path: '/', component: () => import('../views/Home.vue') },
    { path: '/settings', component: () => import('../views/Settings.vue') },
  ],
})

export default router
```

:::

### 2. Memory 模式

Memory 路由（`createMemoryHistory`）将路由状态保存在内存中，URL 不变，适合不需要深链接的应用：

::: details React Router 使用 memory 模式

```tsx
// src/renderer/src/App.tsx
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Settings from './pages/Settings'

function App() {
  return (
    <MemoryRouter initialEntries={['/']} initialIndex={0}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </MemoryRouter>
  )
}
```

:::

| 路由模式 | 特点 | 适用场景 |
|----------|------|----------|
| Hash 模式 | URL 包含 `#`，无需服务器配置 | 大多数 Electron 应用 |
| Memory 模式 | URL 不变化，无法分享/书签 | 纯本地应用，不需要深链接 |
| HTML5 History | 需要 `loadURL` 而非 `loadFile` | 使用本地 HTTP 服务器 |

## 四、数据持久化

### 1. electron-store（轻量级键值存储）

`electron-store` 基于 JSON 文件实现持久化存储，适合存储用户偏好、配置等少量数据。

::: details electron-store 使用示例

```bash
npm install electron-store
```

```ts
// src/main/store.ts
import Store from 'electron-store'

interface AppConfig {
  theme: 'light' | 'dark'
  language: 'zh-CN' | 'en-US'
  windowBounds: { x: number; y: number; width: number; height: number }
  recentFiles: string[]
}

// 创建带类型和默认值的 store 实例
const store = new Store<AppConfig>({
  defaults: {
    theme: 'light',
    language: 'zh-CN',
    windowBounds: { x: 0, y: 0, width: 1200, height: 800 },
    recentFiles: [],
  },
  // 数据验证 schema（可选）
  schema: {
    theme: { type: 'string', enum: ['light', 'dark'] },
    recentFiles: { type: 'array', items: { type: 'string' } },
  },
})

export { store }
```

```ts
// src/main/index.ts — 注册 IPC 处理器
import { ipcMain } from 'electron'
import { store } from './store'

ipcMain.handle('store:get', (_, key: keyof AppConfig) => store.get(key))
ipcMain.handle('store:set', (_, key: keyof AppConfig, value: unknown) => {
  store.set(key, value)
})
ipcMain.handle('store:delete', (_, key: keyof AppConfig) => store.delete(key))
ipcMain.handle('store:clear', () => store.clear())
```

:::

### 2. better-sqlite3（本地 SQLite 数据库）

适合存储结构化数据、需要查询的场景。

::: details better-sqlite3 集成示例

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

```ts
// src/main/database.ts
import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'

// 数据库文件存储在 userData 目录
const dbPath = path.join(app.getPath('userData'), 'app.db')
const db = new Database(dbPath)

// 初始化：创建表（使用 WAL 模式提升性能）
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// 预编译常用语句（提升性能）
const statements = {
  getAllNotes: db.prepare('SELECT * FROM notes ORDER BY updated_at DESC'),
  getNoteById: db.prepare('SELECT * FROM notes WHERE id = ?'),
  insertNote: db.prepare('INSERT INTO notes (title, content) VALUES (@title, @content)'),
  updateNote: db.prepare('UPDATE notes SET title = @title, content = @content, updated_at = CURRENT_TIMESTAMP WHERE id = @id'),
  deleteNote: db.prepare('DELETE FROM notes WHERE id = ?'),
}

export { db, statements }
```

```ts
// src/main/index.ts — 注册数据库 IPC 处理器
import { ipcMain } from 'electron'
import { statements } from './database'

ipcMain.handle('notes:getAll', () => statements.getAllNotes.all())
ipcMain.handle('notes:create', (_, note: { title: string; content: string }) =>
  statements.insertNote.run(note)
)
ipcMain.handle('notes:update', (_, note: { id: number; title: string; content: string }) =>
  statements.updateNote.run(note)
)
ipcMain.handle('notes:delete', (_, id: number) =>
  statements.deleteNote.run(id)
)
```

:::

::: tip electron-store vs better-sqlite3 选择

| 场景 | 推荐方案 |
|------|----------|
| 用户设置、配置项（少量键值对） | `electron-store` |
| 结构化数据、需要查询/排序 | `better-sqlite3` |
| 大量数据、复杂关系 | `better-sqlite3` |
| 需要数据同步/云端备份 | 自定义 API + 本地缓存 |

:::
