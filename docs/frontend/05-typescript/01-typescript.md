---
title: "TypeScript 概述"
category: "前端 · TypeScript"
tags:
  - TypeScript
excerpt: "TypeScript 是 JavaScript 的超集，添加了静态类型系统。本文介绍 TypeScript 的核心优势、安装配置流程以及 tsconfig.json 关键配置项，帮助你快速搭建 TypeScript 开发环境。"
date: 2026-03-17
---

# TypeScript 概述

TypeScript 是由微软开发并维护的开源语言，它是 JavaScript 的超集——所有合法的 JavaScript 代码都是合法的 TypeScript 代码。TypeScript 在编译阶段通过静态类型检查捕获潜在错误，最终编译为纯 JavaScript 运行在任何环境中。

## 一、为什么使用 TypeScript

### 1. TypeScript 与 JavaScript 的核心差异

| 特性 | JavaScript | TypeScript |
|------|-----------|-----------|
| 类型系统 | 动态类型，运行时检查 | 静态类型，编译时检查 |
| 错误发现时机 | 运行时 | 编译时 |
| IDE 支持 | 基础补全 | 完整的智能提示和重构 |
| 适用场景 | 小型脚本、快速原型 | 中大型项目、团队协作 |

### 2. 核心优势

- **类型安全**：在代码运行前发现类型不匹配、属性不存在等错误
- **智能提示**：IDE 能基于类型信息提供精准的自动补全
- **重构友好**：重命名变量、提取函数时，IDE 能安全地追踪所有引用
- **自文档化**：函数签名本身就是最好的文档

::: tip 什么时候值得引入 TypeScript
项目规模超过 3 人协作，或代码量超过 5000 行时，TypeScript 带来的收益会明显超过学习成本。
:::

## 二、安装与初始化

### 1. 全局安装

::: details 安装 TypeScript 编译器

```bash
# 全局安装（用于命令行编译）
npm install -g typescript

# 查看版本
tsc --version
```

:::

### 2. 项目内安装（推荐）

将 TypeScript 作为项目开发依赖安装，保证团队使用同一版本：

::: details 项目初始化流程

```bash
# 初始化 npm 项目
mkdir my-ts-project && cd my-ts-project
npm init -y

# 安装 TypeScript 和 Node.js 类型声明
npm install -D typescript @types/node

# 生成默认的 tsconfig.json
npx tsc --init
```

:::

### 3. 编译与运行

::: code-group

```bash [手动编译]
# 将 src/index.ts 编译为 dist/index.js
npx tsc

# 监听文件变化，自动重新编译
npx tsc --watch
```

```bash [使用 ts-node（开发阶段）]
# 安装 ts-node，直接运行 TypeScript 文件无需预编译
npm install -D ts-node

npx ts-node src/index.ts
```

```bash [使用 tsx（更快）]
# tsx 使用 esbuild 编译，速度更快
npm install -D tsx

npx tsx src/index.ts
```

:::

## 三、tsconfig.json 配置详解

### 1. 基础配置结构

`tsconfig.json` 控制 TypeScript 编译器的行为。以下是一个适合现代项目的基础配置：

::: details 推荐的 tsconfig.json 配置

```json{4,8,12}
{
  "compilerOptions": {
    // 编译目标：生成 ES2020 兼容的代码
    "target": "ES2020",

    // 模块系统：Node.js 项目用 CommonJS，前端项目用 ESNext
    "module": "ESNext",

    // 启用严格模式（强烈推荐）
    "strict": true,

    // 输出目录
    "outDir": "./dist",

    // 源码根目录
    "rootDir": "./src",

    // 生成 source map，方便调试
    "sourceMap": true,

    // 允许导入 JSON 文件
    "resolveJsonModule": true,

    // 跳过第三方库的类型检查，加快编译速度
    "skipLibCheck": true,

    // 模块解析策略
    "moduleResolution": "bundler"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

:::

### 2. 关键配置项说明

| 配置项 | 推荐值 | 说明 |
|--------|--------|------|
| `target` | `ES2020` | 编译后的 JavaScript 版本，决定哪些语法会被降级 |
| `strict` | `true` | 开启所有严格检查，包含 `strictNullChecks`、`noImplicitAny` 等 |
| `moduleResolution` | `bundler` | 使用 Vite/webpack 等打包工具时选此项 |
| `baseUrl` | `"."` | 配合 `paths` 使用，支持路径别名 |
| `paths` | 见下方 | 配置模块路径别名，如 `@/` 映射到 `src/` |

### 3. 路径别名配置

::: details 配置 @/ 路径别名

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"]
    }
  }
}
```

```ts
// src/pages/Home.ts - 使用别名导入，而不是 ../../../components/Button
import { Button } from '@/components/Button'
import { formatDate } from '@/utils/date'
```

:::

::: warning strict 模式的影响
开启 `strict: true` 后，`null` 和 `undefined` 需要显式处理，`any` 类型不能隐式推断。旧项目迁移时可以先关闭，逐步开启。
:::

## 四、第一个 TypeScript 程序

::: details 从 JavaScript 到 TypeScript 的迁移示例

```ts
// src/user.ts

// 定义用户类型
interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
}

// 带类型注解的函数，IDE 能提示参数类型和返回值类型
function getUserDisplayName(user: User): string {
  return `${user.name} (${user.role})`
}

// 编译器会在这里报错：'guest' 不在联合类型中
const admin: User = {
  id: 1,
  name: '张三',
  email: 'zhangsan@example.com',
  role: 'admin'
}

console.log(getUserDisplayName(admin)) // 输出：张三 (admin)
```

:::

::: tip 推荐的学习路径
如果你已熟悉 JavaScript，建议按以下顺序学习：基础类型 → 接口与类型别名 → 泛型 → 高级类型。不必追求一次性掌握所有特性，在实际项目中遇到问题再深入研究效果更好。
:::
