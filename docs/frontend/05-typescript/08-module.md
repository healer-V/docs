---
title: "TypeScript 模块与命名空间"
category: "前端 · TypeScript"
tags:
  - TypeScript
excerpt: "TypeScript 的模块系统基于 ES 模块规范，同时支持 CommonJS。本文介绍模块的导入导出语法、声明文件（.d.ts）的编写、命名空间的使用场景，以及如何为第三方库编写类型声明。"
date: 2026-03-17
---

# TypeScript 模块与命名空间

## 一、ES 模块基础

### 1. 导出与导入

TypeScript 的模块语法与 ES 模块完全兼容，支持命名导出和默认导出：

::: details 导出语法详解

```ts
// src/utils/math.ts

// 命名导出：可导出多个
export function add(a: number, b: number): number {
  return a + b
}

export function multiply(a: number, b: number): number {
  return a * b
}

// 导出类型（type-only export，编译后不产生 JS 代码）
export type MathOperation = (a: number, b: number) => number

// 导出接口
export interface Calculator {
  add: MathOperation
  subtract: MathOperation
  multiply: MathOperation
  divide: MathOperation
}

// 默认导出：每个模块只能有一个
export default class MathUtils {
  static round(n: number, decimals: number = 0): number {
    return Number(n.toFixed(decimals))
  }
}
```

```ts
// src/main.ts

// 导入命名导出
import { add, multiply, type MathOperation } from './utils/math'

// 导入默认导出
import MathUtils from './utils/math'

// 混合导入
import MathUtils, { add, type Calculator } from './utils/math'

// 重命名导入，避免命名冲突
import { add as mathAdd } from './utils/math'

// 命名空间导入：将所有导出聚合为一个对象
import * as Math from './utils/math'
Math.add(1, 2)
Math.multiply(3, 4)

console.log(add(1, 2))          // 3
console.log(MathUtils.round(3.14159, 2)) // 3.14
```

:::

### 2. 重新导出

::: details 模块聚合（桶文件）模式

```ts
// src/components/index.ts - 统一导出所有组件

// 重新导出
export { Button } from './Button'
export { Input } from './Input'
export { Modal } from './Modal'

// 重新导出并重命名
export { DatePicker as DateInput } from './DatePicker'

// 重新导出所有
export * from './icons'

// 重新导出默认导出为命名导出
export { default as Form } from './Form'

// 使用方只需从一个路径导入
// import { Button, Input, Modal } from '@/components'
```

:::

## 二、类型导入导出

### 1. 类型专用导入

TypeScript 3.8+ 支持 `import type`，确保在编译后不产生实际的 JS 导入语句：

::: details import type 的作用

```ts
// 只导入类型，编译后完全消失
import type { User, Product } from './types'
import type { FC, ReactNode } from 'react'

// 混合导入中使用 type 标记
import { useState, type Dispatch, type SetStateAction } from 'react'

// 为什么要用 import type？
// 1. 明确区分运行时代码和类型代码
// 2. 避免循环依赖问题
// 3. 在某些打包工具优化中更友好
```

:::

## 三、声明文件（.d.ts）

### 1. 什么是声明文件

声明文件只包含类型信息，不包含具体实现，文件扩展名为 `.d.ts`：

::: details 声明文件基础结构

```ts
// src/types/api.d.ts

// 声明接口
export interface LoginRequest {
  username: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  token: string
  refreshToken: string
  expiresIn: number
  user: {
    id: number
    name: string
    role: string
  }
}

// 声明函数签名
export declare function login(request: LoginRequest): Promise<LoginResponse>

// 声明类
export declare class AuthService {
  login(request: LoginRequest): Promise<LoginResponse>
  logout(): Promise<void>
  refreshToken(token: string): Promise<string>
}
```

:::

### 2. 为第三方库编写声明

当第三方库没有提供类型声明时，可以手动编写：

::: details 为无类型第三方库编写声明

```ts
// src/types/legacy-lib.d.ts
// 为假设的旧版 JavaScript 库 "legacy-utils" 编写声明

declare module 'legacy-utils' {
  export interface FormatOptions {
    locale?: string
    currency?: string
    decimals?: number
  }

  export function formatCurrency(amount: number, options?: FormatOptions): string
  export function formatDate(date: Date | string, format?: string): string
  export function parseQueryString(query: string): Record<string, string>

  // 默认导出
  const utils: {
    format: typeof formatCurrency
    date: typeof formatDate
    query: typeof parseQueryString
  }
  export default utils
}
```

:::

### 3. 扩展全局类型

::: details 扩展 Window 和全局类型

```ts
// src/types/global.d.ts

// 扩展 Window 对象
interface Window {
  // 注入的全局配置
  __APP_CONFIG__: {
    apiBaseUrl: string
    version: string
    features: Record<string, boolean>
  }
  // 第三方脚本注入的对象
  gtag: (command: string, ...args: unknown[]) => void
}

// 声明全局变量（由 webpack DefinePlugin 或 Vite define 注入）
declare const __DEV__: boolean
declare const __APP_VERSION__: string

// 扩展 NodeJS 的 ProcessEnv
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test'
    VITE_API_URL: string
    VITE_APP_TITLE: string
  }
}
```

:::

## 四、命名空间

### 1. 命名空间的使用

命名空间（`namespace`）是 TypeScript 特有的特性，主要用于组织相关类型，避免全局命名冲突：

::: details 命名空间组织类型

```ts
// 在声明文件中使用命名空间组织类型
namespace API {
  export namespace User {
    export interface CreateRequest {
      name: string
      email: string
      password: string
    }

    export interface UpdateRequest {
      name?: string
      email?: string
    }

    export interface Response {
      id: number
      name: string
      email: string
      createdAt: string
    }
  }

  export namespace Product {
    export interface CreateRequest {
      name: string
      price: number
      categoryId: number
    }

    export interface Response {
      id: number
      name: string
      price: number
      category: string
    }
  }
}

// 使用命名空间中的类型
async function createUser(data: API.User.CreateRequest): Promise<API.User.Response> {
  const res = await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(data)
  })
  return res.json()
}
```

:::

::: tip 命名空间的适用场景
在模块化的 TypeScript 项目中，应该优先使用 ES 模块（`import/export`）来组织代码。命名空间主要适用于以下场景：
- 编写声明文件时组织类型（如扩展第三方库）
- 处理没有模块系统的旧代码
- 在 `declare global` 中扩展全局类型
:::

## 五、模块解析与路径配置

### 1. 路径别名

::: details 配置路径别名

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@api/*": ["src/api/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"]
    }
  }
}
```

```ts
// 使用路径别名导入
import { UserService } from '@api/user'
import { Button, Input } from '@components'
import { formatDate } from '@utils/date'
import type { User } from '@types/user'

// 替代冗长的相对路径
// import { UserService } from '../../../api/user'
```

:::

### 2. 模块扩充（Module Augmentation）

::: details 扩充第三方模块的类型

```ts
// 扩充 axios 的配置类型
import 'axios'

declare module 'axios' {
  interface AxiosRequestConfig {
    // 添加自定义配置项
    skipAuth?: boolean
    retryCount?: number
  }
}

// 扩充 Vue Router 的路由元数据
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    roles?: string[]
    icon?: string
  }
}

// 在路由配置中使用扩充后的类型
const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
    meta: {
      title: '控制台',
      requiresAuth: true,
      roles: ['admin', 'editor']
    }
  }
]
```

:::
