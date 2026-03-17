---
title: "Electron 打包与分发"
category: "跨端 · Electron"
tags:
  - Electron
  - 打包
  - 分发
  - 自动更新
date: 2026-03-17
---

# Electron 打包与分发

将 Electron 应用打包为各平台的安装包并安全分发给用户，是应用上线的最后一步。本文介绍 `electron-builder` 配置、代码签名、自动更新和 CI/CD 流程。

## 一、electron-builder 配置

`electron-builder` 是功能最完整的 Electron 打包工具，支持 Windows（NSIS/MSI）、macOS（DMG/PKG）、Linux（AppImage/deb/rpm）等多种打包格式。

### 1. 安装与基础配置

```bash
npm install -D electron-builder
```

::: details electron-builder 完整配置（package.json 方式）

```json
// package.json
{
  "name": "my-electron-app",
  "version": "1.0.0",
  "description": "My Electron Application",
  "main": "dist/main/index.js",
  "scripts": {
    "build": "electron-vite build",
    "pack": "npm run build && electron-builder --dir",
    "dist": "npm run build && electron-builder",
    "dist:win": "npm run build && electron-builder --win",
    "dist:mac": "npm run build && electron-builder --mac",
    "dist:linux": "npm run build && electron-builder --linux"
  },
  "build": {
    "appId": "com.example.my-electron-app",
    "productName": "My Application",
    "copyright": "Copyright © 2026 Example Corp.",
    "directories": {
      "output": "release/${version}",   // 输出目录（含版本号）
      "buildResources": "build"          // 图标等资源目录
    },
    "files": [
      "dist/**/*",         // 编译后的文件
      "!dist/**/*.map",    // 排除 Source Map
      "node_modules/**/*",
      "!node_modules/**/{CHANGELOG.md,README.md,test,tests,*.test.js}"
    ],
    "extraResources": [
      {
        "from": "resources/",   // 将额外资源打包进 app（可通过 process.resourcesPath 访问）
        "to": "resources/"
      }
    ]
  }
}
```

:::

### 2. 各平台打包配置

::: details Windows（NSIS）打包配置

```json
// package.json build 字段内
{
  "win": {
    "target": [
      {
        "target": "nsis",       // NSIS 安装包（最常用）
        "arch": ["x64", "ia32"] // 64位 和 32位
      },
      {
        "target": "portable",   // 绿色免安装版
        "arch": ["x64"]
      }
    ],
    "icon": "build/icon.ico",   // Windows 图标（.ico 格式）
    "publisherName": "Example Corp.",
    "verifyUpdateCodeSignature": false // 关闭签名验证（未签名时设置）
  },
  "nsis": {
    "oneClick": false,              // false 显示安装向导，true 一键静默安装
    "allowToChangeInstallationDirectory": true, // 允许用户选择安装目录
    "createDesktopShortcut": true,  // 创建桌面快捷方式
    "createStartMenuShortcut": true, // 创建开始菜单快捷方式
    "shortcutName": "My Application",
    "installerIcon": "build/installer.ico",
    "installerHeaderIcon": "build/installer.ico",
    "include": "build/installer.nsh", // 自定义 NSIS 脚本（可选）
    "language": "2052"  // 中文界面（2052 = 简体中文）
  }
}
```

:::

::: details macOS（DMG）打包配置

```json
// package.json build 字段内
{
  "mac": {
    "target": [
      { "target": "dmg", "arch": ["x64", "arm64"] },  // Intel + Apple Silicon
      { "target": "zip", "arch": ["x64", "arm64"] }   // 用于自动更新
    ],
    "icon": "build/icon.icns",     // macOS 图标（.icns 格式）
    "category": "public.app-category.productivity",
    "darkModeSupport": true,
    "hardenedRuntime": true,       // 强化运行时（公证必须开启）
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist",
    "gatekeeperAssess": false
  },
  "dmg": {
    "title": "${productName} ${version}",
    "icon": "build/dmg-icon.icns",
    "window": { "width": 540, "height": 380 },
    "contents": [
      { "x": 150, "y": 185, "type": "file" },           // 应用图标位置
      { "x": 390, "y": 185, "type": "link", "path": "/Applications" } // Applications 链接
    ]
  }
}
```

:::

::: details Linux 打包配置

```json
// package.json build 字段内
{
  "linux": {
    "target": [
      { "target": "AppImage", "arch": ["x64"] }, // 通用 Linux 格式（推荐）
      { "target": "deb", "arch": ["x64"] },      // Debian/Ubuntu
      { "target": "rpm", "arch": ["x64"] }       // RHEL/CentOS/Fedora
    ],
    "icon": "build/icon.png",
    "category": "Office",
    "desktop": {
      "Name": "My Application",
      "Comment": "My awesome application"
    }
  }
}
```

:::

## 二、应用签名

未签名的应用在 Windows 会弹出 SmartScreen 警告，在 macOS 无法打开。生产环境必须签名。

### 1. Windows 代码签名

::: details Windows 代码签名配置

购买证书后，将证书文件和密码配置为环境变量：

```json
// package.json build.win 字段内
{
  "win": {
    "certificateFile": "certificate.pfx",
    "certificatePassword": "${env.WIN_CSC_KEY_PASSWORD}",
    // 或使用时间戳服务
    "rfc3161TimeStampServer": "http://timestamp.digicert.com"
  }
}
```

使用 Azure Key Vault（推荐 CI/CD 环境）：

```json
{
  "win": {
    "sign": "./build/sign.js"   // 自定义签名脚本
  }
}
```

:::

### 2. macOS 公证（Notarization）

::: details macOS 公证配置

macOS 10.15+ 要求应用经过 Apple 公证才能在用户电脑上运行：

```bash
npm install -D @electron/notarize
```

```js
// build/notarize.js — afterSign 钩子
const { notarize } = require('@electron/notarize')

module.exports = async function (context) {
  const { electronPlatformName, appOutDir, packager } = context

  if (electronPlatformName !== 'darwin') return // 仅 macOS 需要公证

  const appName = packager.appInfo.productFilename
  const appPath = `${appOutDir}/${appName}.app`

  console.log(`正在公证 ${appPath}...`)

  await notarize({
    appBundleId: 'com.example.my-electron-app',
    appPath,
    appleId: process.env.APPLE_ID,           // Apple ID
    appleIdPassword: process.env.APPLE_ID_PASSWORD, // App 专用密码
    teamId: process.env.APPLE_TEAM_ID,       // Team ID
  })

  console.log('公证完成')
}
```

```json
// package.json build.mac 字段内
{
  "mac": {
    "afterSign": "build/notarize.js"
  }
}
```

```xml
<!-- build/entitlements.mac.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>com.apple.security.cs.allow-jit</key><true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key><true/>
    <key>com.apple.security.cs.disable-library-validation</key><true/>
  </dict>
</plist>
```

:::

## 三、自动更新

### 1. electron-updater + GitHub Releases

::: details 完整自动更新方案

```bash
npm install electron-updater
```

```json
// package.json build 字段内
{
  "publish": [
    {
      "provider": "github",
      "owner": "your-username",
      "repo": "your-repo",
      "releaseType": "release"   // 发布为正式 Release（非 Draft）
    }
  ]
}
```

```ts
// src/main/updater.ts — 完整的更新管理器
import { autoUpdater } from 'electron-updater'
import { BrowserWindow, ipcMain } from 'electron'
import log from 'electron-log'

// 配置日志
autoUpdater.logger = log
autoUpdater.autoDownload = false          // 手动触发下载
autoUpdater.autoInstallOnAppQuit = true   // 退出时自动安装

export function setupUpdater(mainWindow: BrowserWindow): void {
  const send = (channel: string, data?: unknown) =>
    mainWindow.webContents.send(channel, data)

  autoUpdater.on('checking-for-update', () => send('updater:checking'))
  autoUpdater.on('update-available', (info) => send('updater:available', info))
  autoUpdater.on('update-not-available', () => send('updater:not-available'))
  autoUpdater.on('download-progress', (progress) => send('updater:progress', progress))
  autoUpdater.on('update-downloaded', (info) => send('updater:downloaded', info))
  autoUpdater.on('error', (err) => send('updater:error', err.message))

  ipcMain.handle('updater:check', () => autoUpdater.checkForUpdates())
  ipcMain.handle('updater:download', () => autoUpdater.downloadUpdate())
  ipcMain.handle('updater:install', () => autoUpdater.quitAndInstall(false, true))

  // 应用启动 10 秒后自动检查更新（避免影响启动速度）
  setTimeout(() => autoUpdater.checkForUpdates(), 10_000)
}
```

:::

### 2. 自托管更新服务器

::: details 使用 Hazel/update.electronjs.org 自托管

```json
// package.json build.publish 字段
{
  "publish": [
    {
      "provider": "generic",
      "url": "https://updates.example.com/",  // 自托管服务器地址
      "channel": "latest"
    }
  ]
}
```

服务器目录结构：

```
updates.example.com/
├── latest.yml          # Windows 更新描述文件（electron-builder 自动生成）
├── latest-mac.yml      # macOS 更新描述文件
├── latest-linux.yml    # Linux 更新描述文件
├── my-app-1.2.0.exe    # Windows 安装包
├── my-app-1.2.0.dmg    # macOS 安装包
└── my-app-1.2.0.AppImage # Linux 安装包
```

:::

## 四、打包体积优化

### 1. asarUnpack 配置

某些原生模块（`.node` 文件）不能放入 asar 归档，需要通过 `asarUnpack` 排除：

```json
// package.json build 字段
{
  "asarUnpack": [
    "**/*.node",                          // 所有原生模块
    "node_modules/better-sqlite3/**/*"   // sqlite3 等原生依赖
  ]
}
```

### 2. 排除不必要的文件

::: details 精细化 files 配置减小体积

```json
// package.json build 字段
{
  "files": [
    "dist/**/*",
    "!dist/**/*.map",              // 排除 Source Map
    "node_modules/**/*",
    "!node_modules/**/{README,CHANGELOG,CONTRIBUTING,SECURITY}.md",
    "!node_modules/**/{test,tests,spec,specs,__tests__}/**/*",
    "!node_modules/**/*.{ts,coffee,gyp}",
    "!node_modules/.bin/**/*",
    "!node_modules/electron/**/*"  // electron 本体不需要打包进去
  ],
  "electronVersion": "29.0.0"      // 固定 electron 版本，避免意外升级
}
```

:::

| 优化手段 | 节省空间 | 说明 |
|----------|----------|------|
| 排除测试文件和文档 | 10~30MB | `!node_modules/**/{test,*.md}` |
| 排除 Source Map | 5~20MB | `!dist/**/*.map` |
| 使用 nativeImage 替代大图片 | 若干 MB | 使用 SVG 或合适尺寸的图标 |
| 按需引入第三方库 | 视情况 | 避免引入整个 lodash、moment 等 |

## 五、CI/CD 自动化打包（GitHub Actions）

::: details GitHub Actions 多平台自动打包配置

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'   # 推送 v 开头的标签时触发

jobs:
  release:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]

    runs-on: ${{ matrix.os }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Electron app
        run: npm run build

      - name: Package & Publish (Windows)
        if: matrix.os == 'windows-latest'
        run: npm run dist:win
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          WIN_CSC_LINK: ${{ secrets.WIN_CSC_LINK }}             # 证书 base64
          WIN_CSC_KEY_PASSWORD: ${{ secrets.WIN_CSC_KEY_PASSWORD }}

      - name: Package & Publish (macOS)
        if: matrix.os == 'macos-latest'
        run: npm run dist:mac
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CSC_LINK: ${{ secrets.MAC_CSC_LINK }}                 # 证书 base64
          CSC_KEY_PASSWORD: ${{ secrets.MAC_CSC_KEY_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}

      - name: Package & Publish (Linux)
        if: matrix.os == 'ubuntu-latest'
        run: npm run dist:linux
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: release-${{ matrix.os }}
          path: release/${{ github.ref_name }}/*
```

:::

::: tip CI/CD 打包工作流建议

1. 在 GitHub 仓库的 **Settings → Secrets** 中配置证书和 Apple 账号
2. 创建 Release 标签（`git tag v1.2.0 && git push origin v1.2.0`）自动触发打包
3. `GH_TOKEN` 使用内置的 `secrets.GITHUB_TOKEN`，无需额外配置
4. macOS 打包必须在 macOS Runner 上执行（Apple 签名工具链依赖）

:::
