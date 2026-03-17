---
title: "TypeScript 泛型"
category: "前端 · TypeScript"
tags:
  - TypeScript
excerpt: "泛型是 TypeScript 中实现代码复用的核心机制，允许你编写与具体类型无关的通用代码。本文介绍泛型函数、泛型接口、泛型类和泛型约束的用法，以及常见的泛型设计模式。"
date: 2026-03-17
---

# TypeScript 泛型

泛型（Generics）允许你编写可适用于多种类型的代码，同时保持类型安全。与使用 `any` 不同，泛型在保留类型信息的同时提供了灵活性。

## 一、泛型函数

### 1. 基础泛型语法

::: details 从 any 到泛型的演进

```ts{9-11}
// 问题：使用 any 丢失了类型信息
function firstAny(arr: any[]): any {
  return arr[0]
}
const result = firstAny([1, 2, 3])  // result 类型为 any，丢失了 number 信息

// 解决：使用泛型保留类型信息
// T 是类型参数，调用时由 TypeScript 自动推断
function first<T>(arr: T[]): T | undefined {
  return arr[0]
}

const num = first([1, 2, 3])          // 推断为 number | undefined
const str = first(['a', 'b', 'c'])    // 推断为 string | undefined
const user = first([{ id: 1 }])       // 推断为 { id: number } | undefined

// 显式指定类型参数（通常不需要，TypeScript 能自动推断）
const explicit = first<string>(['hello', 'world'])
```

:::

### 2. 多类型参数

::: details 多个类型参数的使用

```ts
// 两个类型参数
function zip<T, U>(arr1: T[], arr2: U[]): [T, U][] {
  const length = Math.min(arr1.length, arr2.length)
  return Array.from({ length }, (_, i) => [arr1[i], arr2[i]])
}

const pairs = zip([1, 2, 3], ['one', 'two', 'three'])
// 类型为 [number, string][]
console.log(pairs) // [[1, 'one'], [2, 'two'], [3, 'three']]

// 对象属性提取：K extends keyof T 确保 key 合法
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    result[key] = obj[key]
  })
  return result
}

interface Article {
  id: number
  title: string
  content: string
  author: string
  publishedAt: Date
}

const summary = pick(article, ['id', 'title', 'author'])
// 类型为 Pick<Article, 'id' | 'title' | 'author'>
```

:::

## 二、泛型接口与泛型类型

### 1. 泛型接口

::: details 通用 API 响应接口

```ts
// 通用 API 响应结构
interface ApiResponse<T> {
  data: T
  status: number
  message: string
  timestamp: string
}

// 分页数据接口
interface PageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// 使用泛型接口
interface Product {
  id: number
  name: string
  price: number
}

async function fetchProducts(page: number): Promise<ApiResponse<PageResult<Product>>> {
  const res = await fetch(`/api/products?page=${page}`)
  return res.json()
}

const response = await fetchProducts(1)
// response.data.items 类型为 Product[]
// response.data.total 类型为 number
response.data.items.forEach(product => {
  console.log(`${product.name}: ¥${product.price}`)
})
```

:::

### 2. 泛型类型别名

::: details 泛型工具类型定义

```ts
// 可空类型
type Nullable<T> = T | null
type Optional<T> = T | undefined
type Maybe<T> = T | null | undefined

// 带加载状态的异步数据
type AsyncData<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

// 使用示例
type UserState = AsyncData<{ id: number; name: string }>

let state: UserState = { status: 'loading' }

// 后来更新为成功状态
state = { status: 'success', data: { id: 1, name: '张三' } }

if (state.status === 'success') {
  console.log(state.data.name) // 类型安全
}
```

:::

## 三、泛型类

::: details 泛型栈（Stack）数据结构

```ts
class Stack<T> {
  private items: T[] = []

  push(item: T): void {
    this.items.push(item)
  }

  pop(): T | undefined {
    return this.items.pop()
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1]
  }

  get size(): number {
    return this.items.length
  }

  isEmpty(): boolean {
    return this.items.length === 0
  }

  toArray(): T[] {
    return [...this.items]
  }
}

// 字符串栈
const browserHistory = new Stack<string>()
browserHistory.push('https://example.com')
browserHistory.push('https://example.com/about')
browserHistory.push('https://example.com/contact')

console.log(browserHistory.peek())  // https://example.com/contact
console.log(browserHistory.pop())   // https://example.com/contact（后退）
console.log(browserHistory.size)    // 2

// 数字栈
const undoStack = new Stack<{ action: string; data: unknown }>()
undoStack.push({ action: 'insert', data: { id: 1, text: 'Hello' } })
```

:::

## 四、泛型约束

### 1. extends 约束

使用 `extends` 限制类型参数必须满足某些条件：

::: details 泛型约束示例

```ts{1,8,15}
// 约束：T 必须有 length 属性
function getLength<T extends { length: number }>(value: T): number {
  return value.length
}

getLength('hello')        // 5
getLength([1, 2, 3])      // 3
getLength({ length: 10 }) // 10
// getLength(42)           // 报错：number 没有 length 属性

// keyof 约束：确保 key 是 obj 的合法属性名
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

const product = { id: 1, name: '手机', price: 3999 }
const name = getProperty(product, 'name')    // 类型为 string
const price = getProperty(product, 'price')  // 类型为 number
// getProperty(product, 'stock')             // 报错：stock 不是合法属性名
```

:::

### 2. 条件约束与默认类型参数

::: details 泛型默认参数

```ts
// 带默认类型参数
interface EventEmitter<T = Record<string, unknown>> {
  on<K extends keyof T>(event: K, handler: (data: T[K]) => void): void
  emit<K extends keyof T>(event: K, data: T[K]): void
}

// 定义事件映射
interface AppEvents {
  'user:login': { userId: number; timestamp: Date }
  'user:logout': { userId: number }
  'product:view': { productId: number; duration: number }
}

// 使用类型化的事件系统
declare const emitter: EventEmitter<AppEvents>

emitter.on('user:login', ({ userId, timestamp }) => {
  // userId: number，timestamp: Date - 类型安全
  console.log(`用户 ${userId} 于 ${timestamp} 登录`)
})

emitter.emit('product:view', { productId: 101, duration: 30 })
// emitter.emit('product:view', { productId: 101 })  // 报错：缺少 duration
```

:::

## 五、常用泛型模式

### 1. 工厂函数模式

::: details 泛型工厂函数

```ts
// 类型安全的对象克隆
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// 带转换的映射函数
function mapObject<T, U>(
  obj: Record<string, T>,
  transform: (value: T, key: string) => U
): Record<string, U> {
  const result: Record<string, U> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[key] = transform(value, key)
  }
  return result
}

const prices = { apple: 5.5, banana: 3.2, cherry: 12.0 }
const discounted = mapObject(prices, (price) => price * 0.9)
// { apple: 4.95, banana: 2.88, cherry: 10.8 }
```

:::

### 2. Builder 模式

::: details 泛型 Builder 模式

```ts
class QueryBuilder<T extends object> {
  private filters: Partial<T> = {}
  private sortField?: keyof T
  private sortOrder: 'asc' | 'desc' = 'asc'
  private limitCount?: number

  where(filter: Partial<T>): this {
    Object.assign(this.filters, filter)
    return this
  }

  orderBy(field: keyof T, order: 'asc' | 'desc' = 'asc'): this {
    this.sortField = field
    this.sortOrder = order
    return this
  }

  limit(count: number): this {
    this.limitCount = count
    return this
  }

  build(): { filters: Partial<T>; sort?: { field: keyof T; order: string }; limit?: number } {
    return {
      filters: this.filters,
      sort: this.sortField ? { field: this.sortField, order: this.sortOrder } : undefined,
      limit: this.limitCount
    }
  }
}

interface User {
  id: number
  name: string
  role: string
  age: number
}

const query = new QueryBuilder<User>()
  .where({ role: 'admin' })
  .orderBy('name', 'asc')
  .limit(10)
  .build()
```

:::

::: tip 泛型的最佳实践
- 类型参数名使用单个大写字母（`T`、`U`、`K`、`V`）或有意义的短名（`TData`、`TError`）
- 当只有一个类型参数时用 `T`，有多个时选择有语义的名称
- 避免过度使用泛型，简单场景直接用具体类型更清晰
:::
