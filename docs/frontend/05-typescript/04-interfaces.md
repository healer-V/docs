---
title: "TypeScript 接口与类型别名"
category: "前端 · TypeScript"
tags:
  - TypeScript
excerpt: "TypeScript 提供了 interface 和 type 两种定义类型的方式。本文讲解两者的语法、可选属性、只读属性、索引签名的用法，以及何时选择 interface 何时选择 type。"
date: 2026-03-17
---

# TypeScript 接口与类型别名

## 一、接口（Interface）

### 1. 基础语法

`interface` 用于描述对象的形状（Shape），定义对象应该具备哪些属性和方法：

::: details 接口基础定义

```ts
// 定义商品接口
interface Product {
  id: number
  name: string
  price: number
  description: string
}

// 使用接口约束对象
const smartphone: Product = {
  id: 1001,
  name: 'TypePhone Pro',
  price: 5999,
  description: '高性能智能手机'
}

// 接口中定义方法
interface Repository<T> {
  findById(id: number): Promise<T | null>
  findAll(): Promise<T[]>
  save(entity: T): Promise<T>
  delete(id: number): Promise<void>
}
```

:::

### 2. 可选属性与只读属性

::: details 可选与只读修饰符

```ts{5,6,7}
interface UserProfile {
  id: number
  name: string
  email: string
  // 可选属性：使用 ? 修饰
  avatar?: string
  bio?: string
  // 只读属性：创建后不可修改
  readonly createdAt: Date
}

const user: UserProfile = {
  id: 1,
  name: '李四',
  email: 'lisi@example.com',
  createdAt: new Date()
  // avatar 和 bio 可以不提供
}

// user.createdAt = new Date() // 报错：Cannot assign to 'createdAt' because it is a read-only property
user.bio = '前端开发工程师'    // OK，bio 可选但可修改
```

:::

### 3. 索引签名

当对象的键不确定时，使用索引签名定义动态属性：

::: details 索引签名的使用场景

```ts
// 字符串索引签名：适合 key-value 映射
interface Dictionary<T> {
  [key: string]: T
}

const translations: Dictionary<string> = {
  hello: '你好',
  world: '世界',
  typescript: '类型脚本'
}

// 数字索引签名：适合类数组结构
interface NumberArray {
  [index: number]: string
  length: number
}

// 混合签名：有固定属性也有动态属性
interface Config {
  name: string                    // 固定属性
  [key: string]: string | number  // 动态属性（类型必须兼容固定属性）
}

const serverConfig: Config = {
  name: 'production',
  host: 'api.example.com',
  port: 443,
  timeout: 5000
}
```

:::

### 4. 接口继承

接口支持单继承和多继承，用于复用和扩展类型：

::: details 接口继承示例

```ts
interface Entity {
  id: number
  createdAt: Date
  updatedAt: Date
}

interface Named {
  name: string
}

// 多重继承
interface Category extends Entity, Named {
  slug: string
  parentId?: number
}

// 继承并扩展
interface Article extends Entity, Named {
  content: string
  categoryId: number
  tags: string[]
  publishedAt?: Date
}

const article: Article = {
  id: 1,
  name: 'TypeScript 入门指南',
  content: '...',
  categoryId: 2,
  tags: ['TypeScript', '前端'],
  createdAt: new Date(),
  updatedAt: new Date()
}
```

:::

### 5. 接口合并（声明合并）

同名的 `interface` 会自动合并，这是接口特有的能力：

::: details 接口声明合并

```ts
// 第一次声明
interface Window {
  customTheme: 'light' | 'dark'
}

// 第二次声明（自动合并）
interface Window {
  analyticsId: string
}

// 最终 Window 接口包含两次声明的所有属性
// 常用于扩展第三方库的类型定义

// 扩展 Express 的 Request 类型
declare global {
  namespace Express {
    interface Request {
      currentUser?: { id: number; role: string }
    }
  }
}
```

:::

## 二、类型别名（Type Alias）

### 1. 基础语法

`type` 可以为任何类型创建别名，不仅限于对象类型：

::: details 类型别名的多种用法

```ts
// 原始类型别名
type UserId = number
type Email = string

// 联合类型别名
type Theme = 'light' | 'dark' | 'system'
type Status = 'pending' | 'active' | 'suspended'

// 对象类型别名
type Point = {
  x: number
  y: number
}

// 函数类型别名
type EventHandler<T = Event> = (event: T) => void
type AsyncTask<T> = () => Promise<T>

// 元组类型别名
type Pair<T> = [T, T]
type RGB = [red: number, green: number, blue: number]

// 复杂组合
type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: number }
```

:::

### 2. 类型别名与接口的交叉扩展

`type` 通过 `&` 实现类型扩展：

::: details type 扩展示例

```ts
type BaseEntity = {
  id: number
  createdAt: Date
}

type User = BaseEntity & {
  username: string
  email: string
  role: 'admin' | 'user'
}

// 条件类型（只有 type 支持）
type NonNullable<T> = T extends null | undefined ? never : T
type Awaited<T> = T extends Promise<infer R> ? R : T

// 映射类型（只有 type 支持）
type Readonly<T> = {
  readonly [K in keyof T]: T[K]
}
```

:::

## 三、interface vs type 的选择

### 1. 差异对比

| 特性 | `interface` | `type` |
|------|-------------|--------|
| 声明合并 | 支持 | 不支持 |
| 扩展语法 | `extends` | `&` 交叉类型 |
| 联合类型 | 不支持 | 支持 |
| 元组类型 | 不支持 | 支持 |
| 条件类型 | 不支持 | 支持 |
| 映射类型 | 不支持 | 支持 |
| 递归类型 | 支持（直接） | 支持（有限制） |
| 错误提示 | 更友好 | 有时展开为匿名类型 |

### 2. 推荐选择策略

::: tip 实践建议
- **优先使用 `interface`** 定义对象类型和类的契约，特别是公共 API 的类型定义
- **使用 `type`** 处理联合类型、元组、条件类型、映射类型等复杂场景
- 在同一项目中保持一致性，避免混用两种风格
:::

::: details 选择参考示例

```ts
// 对象类型 → 推荐 interface
interface HttpClient {
  get<T>(url: string): Promise<T>
  post<T>(url: string, data: unknown): Promise<T>
}

// 联合类型、字面量类型 → 必须用 type
type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
type Nullable<T> = T | null
type Optional<T> = T | undefined

// 工具类型、条件类型 → 必须用 type
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// 扩展第三方库类型 → 必须用 interface（利用声明合并）
declare module 'express' {
  interface Request {
    user?: AuthUser
  }
}
```

:::

## 四、实用接口模式

### 1. 函数接口

::: details 描述函数签名的接口

```ts
// 描述可调用对象
interface Formatter {
  (value: number): string
  precision: number  // 额外属性
}

const currencyFormatter: Formatter = (value) => `¥${value.toFixed(currencyFormatter.precision)}`
currencyFormatter.precision = 2

console.log(currencyFormatter(1234.5)) // ¥1234.50
```

:::

### 2. 泛型接口

::: details 泛型接口实现通用数据结构

```ts
// 分页响应接口
interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// 树形结构
interface TreeNode<T> {
  value: T
  children?: TreeNode<T>[]
  parent?: TreeNode<T>
}

// 使用泛型接口
async function fetchProducts(page: number): Promise<PaginatedResponse<Product>> {
  const res = await fetch(`/api/products?page=${page}`)
  return res.json()
}

const result = await fetchProducts(1)
console.log(`共 ${result.pagination.total} 个商品`)
result.data.forEach(p => console.log(p.name))
```

:::
