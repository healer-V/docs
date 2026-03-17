---
title: "Electron 原生 API 集成"
category: "跨端 · Electron"
tags:
  - Electron
  - 原生API
  - 系统集成
  - 文件系统
date: 2026-03-17
---

# Electron 原生 API 集成

Electron 的核心价值在于通过原生 API 突破 Web 的能力边界，访问操作系统级别的功能。本文介绍菜单、系统托盘、对话框、通知等常用原生 API 的用法。

## 一、菜单（Menu/MenuItem）

Electron 提供了 `Menu` 和 `MenuItem` 用于创建应用菜单和上下文菜单。

### 1. 应用菜单

::: details 自定义应用菜单（含快捷键）

```js
// src/main/menu.js
const { Menu, MenuItem, app, BrowserWindow, shell } = require('electron')

function createAppMenu() {
  const isMac = process.platform === 'darwin'

  const template = [
    // macOS 需要第一项为应用名称菜单
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },         // "关于 xxx"
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),

    // 文件菜单
    {
      label: '文件',
      submenu: [
        {
          label: '新建',
          accelerator: 'CmdOrCtrl+N',   // 快捷键（跨平台自动适配）
          click: () => {
            const win = BrowserWindow.getFocusedWindow()
            win?.webContents.send('menu:newFile')
          },
        },
        {
          label: '打开...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const { dialog } = require('electron')
            const { filePaths } = await dialog.showOpenDialog({
              properties: ['openFile'],
            })
            if (filePaths.length > 0) {
              const win = BrowserWindow.getFocusedWindow()
              win?.webContents.send('menu:openFile', filePaths[0])
            }
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },

    // 编辑菜单（使用内置 role）
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' },
      ],
    },

    // 帮助菜单
    {
      label: '帮助',
      submenu: [
        {
          label: '官方文档',
          click: () => shell.openExternal('https://electronjs.org/docs'),
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu) // 设置为应用菜单
}

module.exports = { createAppMenu }
```

:::

### 2. 上下文菜单（右键菜单）

::: details 右键上下文菜单

```js
// src/main/preload.js — 暴露上下文菜单 API
contextBridge.exposeInMainWorld('electronAPI', {
  showContextMenu: (items) => ipcRenderer.invoke('menu:showContext', items),
})
```

```js
// src/main/index.js
const { ipcMain, Menu, BrowserWindow } = require('electron')

ipcMain.handle('menu:showContext', (event, items) => {
  const template = items.map(item => {
    if (item.type === 'separator') return { type: 'separator' }
    return {
      label: item.label,
      enabled: item.enabled !== false,
      click: () => {
        // 通知渲染进程用户点击了哪个菜单项
        event.sender.send('menu:contextAction', item.id)
      },
    }
  })

  const menu = Menu.buildFromTemplate(template)
  const win = BrowserWindow.fromWebContents(event.sender)
  menu.popup({ window: win }) // 在窗口中弹出菜单
})
```

```js
// src/renderer/editor.js — 在渲染进程中触发右键菜单
const editor = document.getElementById('editor')

editor.addEventListener('contextmenu', async (e) => {
  e.preventDefault()

  await window.electronAPI.showContextMenu([
    { id: 'cut', label: '剪切' },
    { id: 'copy', label: '复制' },
    { id: 'paste', label: '粘贴' },
    { type: 'separator' },
    { id: 'selectAll', label: '全选' },
  ])
})

// 监听菜单动作
window.electronAPI.on('menu:contextAction', (actionId) => {
  if (actionId === 'copy') document.execCommand('copy')
  if (actionId === 'paste') document.execCommand('paste')
})
```

:::

## 二、系统托盘（Tray）

系统托盘允许应用在操作系统任务栏/菜单栏中保持常驻图标，即使主窗口关闭后仍可通过托盘访问。

::: details 系统托盘完整实现

```js
// src/main/tray.js
const { Tray, Menu, app, BrowserWindow, nativeImage } = require('electron')
const path = require('path')

let tray = null

function createTray(mainWindow) {
  // 托盘图标（建议提供 @2x/@3x 高分辨率版本）
  const iconPath = path.join(__dirname, '../../assets/tray-icon.png')
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })

  tray = new Tray(icon)
  tray.setToolTip('My Application') // 鼠标悬停提示文字

  // 托盘右键菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      },
    },
    {
      label: '设置',
      click: () => {
        mainWindow.show()
        mainWindow.webContents.send('navigate', '/settings')
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)

  // Windows：双击托盘图标显示窗口
  tray.on('double-click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

module.exports = { createTray }
```

```js
// src/main/index.js — 关闭窗口时最小化到托盘
mainWindow.on('close', (event) => {
  if (!app.isQuitting) {
    event.preventDefault() // 阻止窗口关闭
    mainWindow.hide()       // 隐藏到托盘
  }
})
```

:::

## 三、对话框（dialog）

`dialog` 模块提供了原生系统对话框，包括文件选择、保存、消息框等。

### 1. 文件打开对话框

::: details showOpenDialog 使用示例

```js
// src/main/index.js
const { ipcMain, dialog } = require('electron')

ipcMain.handle('dialog:openFile', async (event, options = {}) => {
  const result = await dialog.showOpenDialog({
    title: '选择文件',
    defaultPath: app.getPath('documents'),
    buttonLabel: '选择',
    filters: [
      { name: '图片', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] },
      { name: '文档', extensions: ['txt', 'md', 'pdf', 'docx'] },
      { name: '所有文件', extensions: ['*'] },
    ],
    properties: [
      'openFile',       // 允许选择文件
      'multiSelections', // 允许多选
      // 'openDirectory', // 允许选择目录
    ],
    ...options,
  })

  if (result.canceled) return null
  return result.filePaths
})
```

:::

### 2. 文件保存对话框

::: details showSaveDialog 使用示例

```js
// src/main/index.js
ipcMain.handle('dialog:saveFile', async (event, { content, defaultName }) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: '保存文件',
    defaultPath: path.join(app.getPath('documents'), defaultName || 'untitled.txt'),
    filters: [
      { name: '文本文件', extensions: ['txt', 'md'] },
    ],
  })

  if (canceled || !filePath) return { success: false }

  await fs.promises.writeFile(filePath, content, 'utf-8')
  return { success: true, filePath }
})
```

:::

### 3. 消息对话框

::: details showMessageBox 使用示例

```js
// src/main/index.js
ipcMain.handle('dialog:confirm', async (event, { title, message, detail }) => {
  const result = await dialog.showMessageBox({
    type: 'question',            // none | info | warning | error | question
    title: title || '确认',
    message: message,
    detail: detail,              // 附加说明文字（较小字体）
    buttons: ['确认', '取消'],   // 按钮标签
    defaultId: 0,                // 默认选中按钮的索引
    cancelId: 1,                 // 按 Esc 时触发的按钮索引
    checkboxLabel: '不再提示',    // 可选：显示复选框
    checkboxChecked: false,
  })

  return {
    confirmed: result.response === 0,    // 点击"确认"返回 true
    checkboxChecked: result.checkboxChecked, // 复选框状态
  }
})
```

:::

## 四、通知（Notification）

系统原生通知，即使应用在后台也能显示。

::: details 发送系统通知

```js
// src/main/index.js
const { Notification, ipcMain } = require('electron')

ipcMain.handle('notification:show', (event, { title, body, icon }) => {
  // 检查系统是否支持通知
  if (!Notification.isSupported()) {
    return { success: false, reason: 'not supported' }
  }

  const notification = new Notification({
    title,
    body,
    icon: icon || path.join(__dirname, '../../assets/icon.png'),
    silent: false,   // 是否静默（不播放声音）
  })

  notification.on('click', () => {
    // 用户点击通知时聚焦到应用窗口
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      win.show()
      win.focus()
    }
  })

  notification.show()
  return { success: true }
})
```

:::

## 五、剪贴板（clipboard）

::: details 剪贴板读写示例

```js
// src/main/preload.js
const { contextBridge, clipboard } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  clipboard: {
    // 读取文本
    readText: () => clipboard.readText(),
    // 写入文本
    writeText: (text) => clipboard.writeText(text),
    // 读取 HTML
    readHTML: () => clipboard.readHTML(),
    // 写入 HTML
    writeHTML: (html) => clipboard.writeHTML(html),
    // 读取图片（返回 NativeImage）
    readImage: () => {
      const image = clipboard.readImage()
      return image.toDataURL() // 转为 base64 data URL
    },
    // 清空剪贴板
    clear: () => clipboard.clear(),
  },
})
```

:::

## 六、系统信息

### 1. 应用路径（app.getPath）

::: details 常用系统路径获取

```js
// src/main/index.js
const { app } = require('electron')

// 获取各类系统路径
const paths = {
  home: app.getPath('home'),         // 用户主目录：/Users/username
  appData: app.getPath('appData'),   // 应用数据：~/Library/Application Support（macOS）
  userData: app.getPath('userData'), // 用户数据：appData/appName，推荐存储用户数据
  temp: app.getPath('temp'),         // 临时目录
  downloads: app.getPath('downloads'), // 下载目录
  documents: app.getPath('documents'), // 文档目录
  desktop: app.getPath('desktop'),   // 桌面
  exe: app.getPath('exe'),           // 当前可执行文件路径
  logs: app.getPath('logs'),         // 日志目录
}
```

:::

### 2. 系统信息（os 模块）

```js
// src/main/index.js
const os = require('os')
const { app } = require('electron')

ipcMain.handle('system:info', () => ({
  platform: process.platform,      // 'darwin' | 'win32' | 'linux'
  arch: process.arch,              // 'x64' | 'arm64' | ...
  osVersion: os.release(),         // 操作系统版本号
  hostname: os.hostname(),         // 主机名
  cpus: os.cpus().length,          // CPU 核心数
  totalMemory: os.totalmem(),      // 总内存（字节）
  freeMemory: os.freemem(),        // 可用内存（字节）
  appVersion: app.getVersion(),    // 应用版本号
  electronVersion: process.versions.electron,
  nodeVersion: process.versions.node,
  chromeVersion: process.versions.chrome,
}))
```

## 七、自动更新（autoUpdater）

`autoUpdater` 模块提供了检查和安装应用更新的能力，通常配合 `electron-updater` 使用（功能更完整）。

::: details electron-updater 自动更新示例

```bash
npm install electron-updater
```

```js
// src/main/updater.js
const { autoUpdater } = require('electron-updater')
const { ipcMain, BrowserWindow } = require('electron')

function setupAutoUpdater(mainWindow) {
  // 配置更新服务器（GitHub Releases）
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'your-username',
    repo: 'your-repo',
    private: false,
  })

  // 关闭自动下载，改为手动触发
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  // 监听更新事件
  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('update:checking')
  })

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update:available', {
      version: info.version,
      releaseNotes: info.releaseNotes,
    })
  })

  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('update:notAvailable')
  })

  autoUpdater.on('download-progress', (progressInfo) => {
    mainWindow.webContents.send('update:progress', {
      percent: Math.round(progressInfo.percent),
      transferred: progressInfo.transferred,
      total: progressInfo.total,
      speed: progressInfo.bytesPerSecond,
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('update:downloaded', { version: info.version })
  })

  autoUpdater.on('error', (error) => {
    mainWindow.webContents.send('update:error', error.message)
  })

  // IPC 处理器
  ipcMain.handle('update:check', () => autoUpdater.checkForUpdates())
  ipcMain.handle('update:download', () => autoUpdater.downloadUpdate())
  ipcMain.handle('update:install', () => autoUpdater.quitAndInstall(false, true))
}

module.exports = { setupAutoUpdater }
```

:::

::: tip 自动更新注意事项
- macOS 应用必须经过代码签名才能使用自动更新
- Windows 使用 NSIS 安装包时，更新会静默安装新版本后重启
- 开发环境中 `autoUpdater` 不会实际触发，需要打包后测试
:::
