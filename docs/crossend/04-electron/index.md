# Electron

Electron 是一款使用 JavaScript、HTML 和 CSS 构建跨平台桌面应用程序的开源框架，由 GitHub 开发和维护。

## 简介

Electron 允许开发者使用 Web 技术构建能够在 Windows、macOS 和 Linux 上运行的桌面应用程序。许多知名应用，如 Visual Studio Code、Slack、Discord 等，都是使用 Electron 开发的。

## 核心特性

- **跨平台**：使用同一套代码库构建 Windows、macOS 和 Linux 应用
- **Web 技术**：使用 HTML、CSS 和 JavaScript 进行开发
- **原生功能**：通过 Node.js 访问原生系统功能
- **自动更新**：内置应用自动更新功能
- **丰富的生态系统**：大量的 npm 包和插件可供使用
- **开发效率高**：利用前端开发工具和工作流程

## 工作原理

Electron 基于 Chromium 和 Node.js，由以下三个主要部分组成：

- **主进程（Main Process）**：负责应用的生命周期管理、窗口创建、原生功能调用等
- **渲染进程（Renderer Process）**：负责应用的 UI 渲染，每个窗口对应一个渲染进程
- **预加载脚本（Preload Script）**：在渲染进程加载前执行，用于安全地暴露 API 给渲染进程

## 快速开始

### 安装 Electron

```bash
# 创建新项目
mkdir my-electron-app
cd my-electron-app
npm init -y

# 安装 Electron
npm install --save-dev electron
```

### 创建主进程文件

创建 `main.js` 文件，作为应用的主进程：

```javascript
const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow () {
  // 创建浏览器窗口
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // 出于安全考虑，默认禁用
      contextIsolation: true // 启用上下文隔离
    }
  })

  // 加载应用的 index.html
  win.loadFile('index.html')

  // 打开开发者工具（可选）
  // win.webContents.openDevTools()
}

// 当 Electron 完成初始化并准备创建浏览器窗口时调用
app.whenReady().then(() => {
  createWindow()

  // 在 macOS 上，点击dock图标并且没有其他窗口打开时，重新创建一个窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 当所有窗口都关闭时退出应用（Windows & Linux）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
```

### 创建预加载脚本

创建 `preload.js` 文件，用于在渲染进程和主进程之间安全地通信：

```javascript
const { contextBridge, ipcRenderer } = require('electron')

// 安全地暴露API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  setTitle: (title) => ipcRenderer.send('set-title', title),
  openFile: () => ipcRenderer.invoke('dialog:openFile')
})
```

### 创建渲染进程文件

创建 `index.html` 文件，作为应用的 UI：

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Hello Electron!</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body>
    <h1>Hello Electron!</h1>
    <p>欢迎使用 Electron 开发桌面应用程序。</p>
    <button id="openFile">打开文件</button>
    <div id="fileContent"></div>
    <script src="./renderer.js"></script>
  </body>
</html>
```

### 创建渲染进程脚本

创建 `renderer.js` 文件，处理 UI 交互：

```javascript
const openFileBtn = document.getElementById('openFile')
const fileContent = document.getElementById('fileContent')

// 调用主进程的打开文件对话框
openFileBtn.addEventListener('click', async () => {
  const filePath = await window.electronAPI.openFile()
  if (filePath) {
    // 读取并显示文件内容
    fetch(`file://${filePath}`)
      .then(response => response.text())
      .then(text => {
        fileContent.textContent = text
      })
  }
})
```

### 更新 package.json

更新 `package.json` 文件，添加启动脚本：

```json
{
  "name": "my-electron-app",
  "version": "1.0.0",
  "description": "我的第一个 Electron 应用",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  },
  "keywords": ["electron"],
  "author": "Your Name",
  "license": "MIT",
  "devDependencies": {
    "electron": "^22.0.0"
  }
}
```

### 运行应用

```bash
npm start
```

## 主进程与渲染进程通信

Electron 提供了多种方式实现主进程和渲染进程之间的通信：

### 1. IPC 通信

#### 主进程发送消息到渲染进程

```javascript
// main.js
const { ipcMain, BrowserWindow } = require('electron')
let win

function createWindow() {
  win = new BrowserWindow({...})
  // ...
}

// 监听渲染进程发送的消息
ipcMain.on('message-from-renderer', (event, arg) => {
  console.log(arg) // 打印：Hello from renderer!
  
  // 回复渲染进程
  event.reply('message-from-main', 'Hello from main!')
})
```

#### 渲染进程发送消息到主进程

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message) => ipcRenderer.send('message-from-renderer', message),
  onMessageReceived: (callback) => ipcRenderer.on('message-from-main', callback)
})

// renderer.js
window.electronAPI.sendMessage('Hello from renderer!')

window.electronAPI.onMessageReceived((event, arg) => {
  console.log(arg) // 打印：Hello from main!
})
```

### 2. 异步通信（invoke/handle）

```javascript
// main.js
const { ipcMain } = require('electron')

// 处理渲染进程的异步请求
ipcMain.handle('get-app-info', async (event) => {
  return {
    name: app.name,
    version: app.getVersion(),
    electronVersion: process.versions.electron
  }
})

// preload.js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getAppInfo: () => ipcRenderer.invoke('get-app-info')
})

// renderer.js
async function getInfo() {
  const appInfo = await window.electronAPI.getAppInfo()
  console.log(appInfo)
}

getInfo()
```

## 原生功能访问

### 文件系统访问

```javascript
// main.js
const { ipcMain, dialog } = require('electron')
const fs = require('fs')

ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  
  if (!canceled) {
    return filePaths[0]
  }
})

ipcMain.handle('save-file', async (event, content) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    filters: [
      { name: 'Text Files', extensions: ['txt'] }
    ]
  })
  
  if (!canceled) {
    fs.writeFileSync(filePath, content)
    return filePath
  }
})
```

### 系统托盘

```javascript
// main.js
const { app, Tray, Menu, BrowserWindow } = require('electron')
const path = require('path')
let tray = null

app.whenReady().then(() => {
  // 创建系统托盘图标
  tray = new Tray(path.join(__dirname, 'tray-icon.png'))
  
  // 创建托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示窗口', click: () => {
      if (!mainWindow) createWindow()
      mainWindow.show()
    }},
    { type: 'separator' },
    { label: '退出', click: () => app.quit() }
  ])
  
  // 设置托盘菜单
  tray.setContextMenu(contextMenu)
  
  // 点击托盘图标显示/隐藏窗口
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
    }
  })
})
```

### 通知

```javascript
// main.js
const { ipcMain, Notification } = require('electron')

ipcMain.on('show-notification', (event, title, body) => {
  new Notification({
    title,
    body,
    icon: path.join(__dirname, 'notification-icon.png')
  }).show()
})
```

## 应用打包

### 使用 Electron Forge

```bash
# 安装 Electron Forge
npm install --save-dev @electron-forge/cli
npx electron-forge import

# 打包应用
npm run make
```

### 使用 Electron Builder

```bash
# 安装 Electron Builder
npm install --save-dev electron-builder

# 更新 package.json
# "scripts": {
#   "dist": "electron-builder"
# }

# 打包应用
npm run dist
```

## 性能优化

### 渲染性能

- **减少 DOM 操作**：使用虚拟列表处理大量数据
- **优化 JavaScript**：避免阻塞主线程，使用 Web Workers 处理复杂计算
- **图片优化**：使用适当大小的图片，考虑使用 WebP 格式
- **CSS 优化**：避免使用复杂的选择器，减少重排和重绘

### 内存管理

- **避免内存泄漏**：及时清理事件监听器和定时器
- **合理使用缓存**：缓存常用数据，但避免过度缓存
- **监控内存使用**：使用 Chrome DevTools 监控内存使用情况

```javascript
// 防止内存泄漏的示例
function createWindow() {
  const win = new BrowserWindow({...})
  
  // 正确清理事件监听器
  win.on('closed', () => {
    // 清理窗口引用
    win = null
    
    // 移除所有事件监听器
    ipcMain.removeAllListeners('some-event')
  })
  
  return win
}
```

### 启动性能

- **减少应用大小**：只打包必要的依赖
- **延迟加载**：非关键资源延迟加载
- **优化主进程代码**：减少主进程的同步操作

## 安全最佳实践

### 1. 启用上下文隔离和禁用 Node.js 集成

```javascript
// main.js
const { BrowserWindow } = require('electron')

const win = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false, // 禁用 Node.js 集成
    contextIsolation: true, // 启用上下文隔离
    preload: path.join(__dirname, 'preload.js') // 使用预加载脚本
  }
})
```

### 2. 使用预加载脚本安全地暴露 API

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron')

// 只暴露必要的 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 安全的 API 方法
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog')
  // 不要暴露完整的 ipcRenderer 或其他危险 API
})
```

### 3. 内容安全策略（CSP）

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;">
```

### 4. 验证外部内容

```javascript
// 验证从外部加载的内容
const { shell } = require('electron')

// 在默认浏览器中打开链接，而不是在应用内打开
win.webContents.on('will-navigate', (event, url) => {
  // 只允许导航到特定域名
  if (!url.startsWith('https://trusted-domain.com')) {
    event.preventDefault()
    shell.openExternal(url)
  }
})

// 拦截新窗口创建
win.webContents.setWindowOpenHandler(({ url }) => {
  // 在默认浏览器中打开外部链接
  if (url.startsWith('http')) {
    shell.openExternal(url)
    return { action: 'deny' }
  }
  return { action: 'allow' }
})
```

## 自动更新

### 使用 Electron Updater

```bash
# 安装依赖
npm install electron-updater
```

```javascript
// main.js
const { autoUpdater } = require('electron-updater')
const { app, dialog } = require('electron')

// 配置自动更新
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'your-github-username',
  repo: 'your-repository-name',
  releaseType: 'release'
})

// 检查更新
app.whenReady().then(() => {
  autoUpdater.checkForUpdatesAndNotify()
})

// 更新可用时
autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: '更新可用',
    message: '有新版本可用，是否立即更新？',
    buttons: ['是', '否']
  }).then(result => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate()
    }
  })
})

// 更新下载完成
autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    title: '更新下载完成',
    message: '更新已下载完成，是否立即安装并重启应用？',
    buttons: ['是', '稍后']
  }).then(result => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall()
    }
  })
})
```

## 常用第三方库

### UI 框架

- **React**：`npm install react react-dom`
- **Vue**：`npm install vue`
- **Angular**：`npm install @angular/core`
- **Svelte**：`npm install svelte`

### 状态管理

- **Redux**：`npm install redux react-redux`
- **Vuex**：`npm install vuex`
- **MobX**：`npm install mobx mobx-react`

### UI 组件库

- **Ant Design**：`npm install antd`
- **Material-UI**：`npm install @mui/material`
- **Element Plus**：`npm install element-plus`
- **Bootstrap**：`npm install bootstrap`

### 工具库

- **axios**：HTTP 客户端，`npm install axios`
- **lodash**：实用工具库，`npm install lodash`
- **moment**：日期处理，`npm install moment`
- **electron-store**：持久化数据存储，`npm install electron-store`

## 调试技巧

### 主进程调试

```bash
# 使用 --inspect 标志启动应用
npx electron --inspect=5858 .

# 然后在 Chrome 中打开 chrome://inspect 进行调试
```

### 渲染进程调试

1. 在应用中使用 `Ctrl+Shift+I`（Windows/Linux）或 `Cmd+Option+I`（macOS）打开开发者工具
2. 或者在主进程中调用 `win.webContents.openDevTools()`

### 性能分析

- **渲染性能**：使用 Chrome DevTools 的 Performance 面板
- **内存使用**：使用 Chrome DevTools 的 Memory 面板
- **网络请求**：使用 Chrome DevTools 的 Network 面板

## 学习资源

- [Electron 官方文档](https://www.electronjs.org/docs)
- [Electron API 参考](https://www.electronjs.org/docs/api)
- [Electron 示例应用](https://github.com/electron/electron-api-demos)
- [Electron Forge 文档](https://www.electronforge.io/)
- [Electron Builder 文档](https://www.electron.build/)

## 总结

Electron 是一款强大的跨平台桌面应用开发框架，允许开发者使用熟悉的 Web 技术构建原生桌面应用。它的主要优势包括：

- **开发效率高**：利用现有的 Web 开发技能和工具
- **跨平台兼容性好**：一套代码运行在多个平台
- **原生功能丰富**：通过 Node.js 访问系统功能
- **生态系统成熟**：大量的库和工具可供使用

然而，Electron 应用也存在一些挑战，如应用体积较大、性能可能不如原生应用等。但随着技术的发展，这些问题正在逐步得到改善。

对于需要快速开发跨平台桌面应用，特别是团队已经具备 Web 开发经验的情况，Electron 是一个非常理想的选择。