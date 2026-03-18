---
title: "Node.js 文件系统"
category: "后端 · Node.js"
tags:
  - Node.js
  - fs
  - 文件操作
excerpt: "Node.js 的 fs 模块提供文件系统操作能力，支持同步、异步回调和 Promise 三种 API 风格，可进行文件读写、目录管理、文件监听等操作。"
date: 2024-01-17
---

# Node.js 文件系统

## 一、fs 模块概述

`fs`（File System）模块提供文件和目录操作功能。

### 1. 三种 API 风格

| 风格 | 导入方式 | 特点 |
|------|---------|------|
| **回调** | `require('fs')` | 异步，使用回调函数 |
| **同步** | `require('fs')` | 阻塞主线程，方法名带 `Sync` |
| **Promise** | `require('fs/promises')` | 异步，返回 Promise |

::: code-group
```js [Promise（推荐）]
import { readFile } from 'fs/promises'

const data = await readFile('file.txt', 'utf-8')
console.log(data)
```

```js [回调]
const fs = require('fs')

fs.readFile('file.txt', 'utf-8', (err, data) => {
  if (err) throw err
  console.log(data)
})
```

```js [同步]
const fs = require('fs')

const data = fs.readFileSync('file.txt', 'utf-8')
console.log(data)
```
:::

## 二、文件读取

### 1. 读取文本文件

::: details 完整示例
```js
import { readFile } from 'fs/promises'

try {
  // 读取 UTF-8 文本
  const text = await readFile('data.txt', 'utf-8')
  console.log(text)

  // 读取 JSON 文件
  const json = JSON.parse(await readFile('config.json', 'utf-8'))
  console.log(json)
} catch (err) {
  console.error('读取失败:', err.message)
}
```
:::

### 2. 读取二进制文件

::: details Buffer 操作
```js
import { readFile } from 'fs/promises'

// 读取图片
const buffer = await readFile('image.png')
console.log(buffer) // <Buffer 89 50 4e 47 ...>

// 转换为 Base64
const base64 = buffer.toString('base64')
console.log(base64)
```
:::

### 3. 流式读取（大文件）

::: details 使用 Stream
```js
import { createReadStream } from 'fs'

const stream = createReadStream('large-file.txt', {
  encoding: 'utf-8',
  highWaterMark: 64 * 1024 // 64KB 缓冲区
})

stream.on('data', (chunk) => {
  console.log('读取块:', chunk.length)
})

stream.on('end', () => {
  console.log('读取完成')
})

stream.on('error', (err) => {
  console.error('读取错误:', err)
})
```
:::

## 三、文件写入

### 1. 写入文本

::: details 覆盖写入
```js
import { writeFile } from 'fs/promises'

// 写入字符串
await writeFile('output.txt', 'Hello Node.js', 'utf-8')

// 写入 JSON
const data = { name: 'Node', version: '20.0.0' }
await writeFile('data.json', JSON.stringify(data, null, 2))
```
:::

### 2. 追加内容

::: details appendFile
```js
import { appendFile } from 'fs/promises'

await appendFile('log.txt', `${new Date().toISOString()} - 日志信息\n`)
```
:::

### 3. 流式写入

::: details 使用 WriteStream
```js
import { createWriteStream } from 'fs'

const stream = createWriteStream('output.txt')

stream.write('第一行\n')
stream.write('第二行\n')
stream.end('最后一行\n')

stream.on('finish', () => {
  console.log('写入完成')
})
```
:::

## 四、目录操作

### 1. 创建目录

::: details mkdir
```js
import { mkdir } from 'fs/promises'

// 创建单层目录
await mkdir('new-dir')

// 递归创建多层目录
await mkdir('path/to/deep/dir', { recursive: true })
```
:::

### 2. 读取目录

::: details readdir
```js
import { readdir } from 'fs/promises'

// 读取文件名列表
const files = await readdir('.')
console.log(files) // ['file1.txt', 'file2.js', ...]

// 读取详细信息
const entries = await readdir('.', { withFileTypes: true })
for (const entry of entries) {
  console.log(entry.name, entry.isDirectory() ? '目录' : '文件')
}
```
:::

### 3. 删除目录

::: details rmdir / rm
```js
import { rmdir, rm } from 'fs/promises'

// 删除空目录
await rmdir('empty-dir')

// 递归删除目录及内容
await rm('dir-with-files', { recursive: true, force: true })
```
:::

## 五、文件信息

### 1. 检查文件是否存在

::: details access
```js
import { access, constants } from 'fs/promises'

try {
  await access('file.txt', constants.F_OK)
  console.log('文件存在')
} catch {
  console.log('文件不存在')
}
```
:::

### 2. 获取文件状态

::: details stat
```js
import { stat } from 'fs/promises'

const stats = await stat('file.txt')

console.log('文件大小:', stats.size, 'bytes')
console.log('是否为文件:', stats.isFile())
console.log('是否为目录:', stats.isDirectory())
console.log('创建时间:', stats.birthtime)
console.log('修改时间:', stats.mtime)
```
:::

## 六、文件操作

### 1. 复制文件

::: details copyFile
```js
import { copyFile, constants } from 'fs/promises'

await copyFile('source.txt', 'destination.txt')

// 如果目标文件存在则失败
await copyFile('source.txt', 'dest.txt', constants.COPYFILE_EXCL)
```
:::

### 2. 移动/重命名

::: details rename
```js
import { rename } from 'fs/promises'

// 重命名
await rename('old-name.txt', 'new-name.txt')

// 移动文件
await rename('file.txt', 'subdir/file.txt')
```
:::

### 3. 删除文件

::: details unlink
```js
import { unlink } from 'fs/promises'

await unlink('file-to-delete.txt')
```
:::

## 七、路径处理

配合 `path` 模块使用：

::: details path 模块
```js
import path from 'path'
import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'

// ES Module 中获取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 拼接路径
const filePath = path.join(__dirname, 'data', 'config.json')

// 解析路径
console.log(path.dirname(filePath))  // 目录名
console.log(path.basename(filePath)) // 文件名
console.log(path.extname(filePath))  // 扩展名

// 规范化路径
const normalized = path.normalize('/path//to/../file.txt')
console.log(normalized) // /path/file.txt
```
:::

## 八、实用示例

### 1. 递归读取目录

::: details 遍历所有文件
```js
import { readdir } from 'fs/promises'
import path from 'path'

async function* walkDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      yield* walkDir(fullPath)
    } else {
      yield fullPath
    }
  }
}

// 使用
for await (const file of walkDir('.')) {
  console.log(file)
}
```
:::

### 2. 复制目录

::: details 递归复制
```js
import { readdir, mkdir, copyFile } from 'fs/promises'
import path from 'path'

async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true })

  const entries = await readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath)
    } else {
      await copyFile(srcPath, destPath)
    }
  }
}

await copyDir('source-dir', 'dest-dir')
```
:::

## 九、最佳实践

1. **优先使用 Promise API**：代码更简洁，易于错误处理
2. **避免同步方法**：除非在启动脚本中，否则会阻塞事件循环
3. **使用流处理大文件**：避免内存溢出
4. **正确处理路径**：使用 `path` 模块，避免硬编码分隔符
5. **错误处理**：始终使用 try-catch 捕获错误

> [!warning]
> 不要在生产环境使用 `existsSync()` 后再操作文件，应直接操作并捕获错误（避免 TOCTOU 问题）。