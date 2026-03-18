---
title: "Node.js 模块系统"
category: "后端 · Node.js"
tags:
  - Node.js
  - CommonJS
  - ES Module
excerpt: "Node.js 支持 CommonJS 和 ES Module 两种模块系统，用于组织和复用代码。理解模块加载机制、导入导出语法以及两者的区别是 Node.js 开发的基础。"
date: 2024-01-16
---

# Node.js 模块系统

## 一、模块系统概述

Node.js 使用模块化组织代码，每个文件都是独立的模块，拥有自己的作用域。

### 1. 两种模块系统

| 模块系统 | 语法 | 加载方式 | 文件扩展名 |
|---------|------|---------|-----------|
| **CommonJS** | `require()` / `module.exports` | 同步加载 | `.js` `.cjs` |
| **ES Module** | `import` / `export` | 异步加载 | `.mjs` `.js`（需配置） |

### 2. 模块类型

- **核心模块**：Node.js 内置模块（如 `fs`、`http`）
- **文件模块**：用户自定义模块
- **第三方模块**：通过 npm 安装的模块

## 二、CommonJS 模块

### 1. 导出模块

::: code-group
```js [单个导出]
// math.js
function add(a, b) {
  return a + b
}

module.exports = add
```

```js [多个导出]
// utils.js
function add(a, b) {
  return a + b
}

function subtract(a, b) {
  return a - b
}

module.exports = {
  add,
  subtract
}
```

```js [exports 简写]
// logger.js
exports.log = function(msg) {
  console.log(`[LOG] ${msg}`)
}

exports.error = function(msg) {
  console.error(`[ERROR] ${msg}`)
}
```
:::

> [!warning]
> 不能直接给 `exports` 赋值（如 `exports = {}`），这会切断与 `module.exports` 的引用关系。

### 2. 导入模块

::: details 导入示例
```js
// 导入核心模块
const fs = require('fs')
const path = require('path')

// 导入文件模块（相对路径）
const math = require('./math')
const utils = require('./utils')

// 导入第三方模块
const express = require('express')

// 使用
console.log(math(2, 3))           // 5
console.log(utils.add(2, 3))      // 5
console.log(utils.subtract(5, 2)) // 3
```
:::

### 3. 模块缓存

模块首次加载后会被缓存，再次 `require` 时直接返回缓存对象：

::: details 缓存机制
```js
// counter.js
let count = 0

module.exports = {
  increment() {
    count++
  },
  getCount() {
    return count
  }
}
```

```js
// app.js
const counter1 = require('./counter')
const counter2 = require('./counter')

counter1.increment()
console.log(counter1.getCount()) // 1
console.log(counter2.getCount()) // 1（共享同一实例）

// 清除缓存
delete require.cache[require.resolve('./counter')]
```
:::

### 4. 模块加载顺序

```js
// 1. 缓存优先
// 2. 核心模块
// 3. 文件模块（./、../、/开头）
// 4. node_modules 查找（逐级向上）
```

::: details 路径解析规则
```js
require('express')
// 查找顺序：
// 1. 当前目录 node_modules/express
// 2. 父目录 ../node_modules/express
// 3. 祖先目录 ../../node_modules/express
// 4. 全局 node_modules

require('./utils')
// 查找顺序：
// 1. ./utils.js
// 2. ./utils.json
// 3. ./utils.node
// 4. ./utils/index.js
```
:::

## 三、ES Module

### 1. 启用 ES Module

在 `package.json` 中配置：

```json
{
  "type": "module"
}
```

或使用 `.mjs` 扩展名。

### 2. 导出模块

::: code-group
```js [命名导出]
// math.mjs
export function add(a, b) {
  return a + b
}

export function subtract(a, b) {
  return a - b
}

export const PI = 3.14159
```

```js [默认导出]
// logger.mjs
export default class Logger {
  log(msg) {
    console.log(`[LOG] ${msg}`)
  }
}
```

```js [混合导出]
// utils.mjs
export function helper() {
  return 'helper'
}

export default {
  version: '1.0.0'
}
```
:::

### 3. 导入模块

::: details 导入语法
```js
// 命名导入
import { add, subtract } from './math.mjs'

// 重命名导入
import { add as sum } from './math.mjs'

// 导入全部
import * as math from './math.mjs'
console.log(math.add(2, 3))

// 默认导入
import Logger from './logger.mjs'

// 混合导入
import utils, { helper } from './utils.mjs'

// 动态导入
const module = await import('./math.mjs')
console.log(module.add(2, 3))
```
:::

### 4. 导入核心模块

::: details Node.js 核心模块
```js
// 使用 node: 协议（推荐）
import fs from 'node:fs'
import path from 'node:path'
import { readFile } from 'node:fs/promises'

// 或省略协议
import fs from 'fs'
```
:::

## 四、CommonJS vs ES Module

| 特性 | CommonJS | ES Module |
|------|----------|-----------|
| **语法** | `require()` / `module.exports` | `import` / `export` |
| **加载时机** | 运行时同步加载 | 编译时静态分析 |
| **动态导入** | 支持（`require(variable)`） | 需使用 `import()` |
| **顶层 await** | 不支持 | 支持 |
| **this 指向** | `module.exports` | `undefined` |
| **Tree Shaking** | 不支持 | 支持 |
| **循环依赖** | 返回未完成的副本 | 报错或返回 undefined |

### 1. 互操作性

::: code-group
```js [ESM 导入 CJS]
// cjs-module.cjs
module.exports = { name: 'CJS' }

// esm-file.mjs
import cjsModule from './cjs-module.cjs'
console.log(cjsModule.name) // 'CJS'
```

```js [CJS 导入 ESM]
// esm-module.mjs
export const name = 'ESM'

// cjs-file.cjs
;(async () => {
  const esmModule = await import('./esm-module.mjs')
  console.log(esmModule.name) // 'ESM'
})()
```
:::

### 2. 选择建议

- **新项目**：优先使用 ES Module
- **库开发**：提供双模块支持（通过 `exports` 字段）
- **旧项目**：逐步迁移或保持 CommonJS

## 五、模块解析

### 1. package.json 的 exports 字段

::: details 条件导出
```json
{
  "name": "my-package",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./utils": {
      "import": "./dist/utils.mjs",
      "require": "./dist/utils.cjs"
    }
  }
}
```

使用：
```js
// ESM
import pkg from 'my-package'
import { helper } from 'my-package/utils'

// CJS
const pkg = require('my-package')
const { helper } = require('my-package/utils')
```
:::

### 2. 路径别名

使用 `subpath imports` 定义内部路径：

```json
{
  "imports": {
    "#utils/*": "./src/utils/*.js",
    "#config": "./src/config/index.js"
  }
}
```

```js
import { helper } from '#utils/helper'
import config from '#config'
```

## 六、最佳实践

1. **统一模块系统**：项目内保持一致，避免混用
2. **使用 node: 协议**：导入核心模块时加上 `node:` 前缀
3. **避免循环依赖**：重构代码结构，提取公共模块
4. **明确导出**：使用命名导出而非默认导出，便于 Tree Shaking
5. **类型声明**：TypeScript 项目配置 `moduleResolution: "node16"`

> [!tip]
> 使用 ES Module 时，文件扩展名不能省略（`.js`、`.mjs` 必须写全）。
