---
title: "TypeScript 基础语法"
category: "前端 · TypeScript"
tags:
  - TypeScript
excerpt: "本文介绍 TypeScript 的基础语法，包括变量声明、原始类型、数组与元组、枚举、函数类型注解以及类型断言，是掌握 TypeScript 的必备基础知识。"
date: 2026-03-17
---

# TypeScript 基础语法

## 一、变量声明与类型注解

### 1. 类型注解语法

TypeScript 使用 `: 类型` 的语法为变量添加类型注解。类型注解是可选的，编译器能在大多数情况下自动推断类型。

::: details 变量声明示例

```ts{3,6,9}
// 显式类型注解
const username: string = '张三'
const age: number = 28
const isActive: boolean = true

// 类型推断：TypeScript 根据初始值自动推断类型
const email = 'zhangsan@example.com' // 推断为 string
const score = 95.5                    // 推断为 number

// 推荐：有初始值时依赖类型推断，减少冗余注解
```

:::

### 2. let、const 与类型

::: details let 与 const 的类型差异

```ts
// const 声明的字面量类型更窄
const direction = 'north'       // 类型为字面量 "north"，而不是 string
let currentDir = 'north'        // 类型为 string（可重赋值）

// 需要字面量类型时，使用 as const
const config = {
  host: 'localhost',
  port: 3000
} as const
// config.port 的类型为 3000，而不是 number
```

:::

## 二、基本类型

### 1. 原始类型

TypeScript 的原始类型与 JavaScript 一一对应，并增加了编译时检查：

| 类型 | 示例 | 说明 |
|------|------|------|
| `string` | `'hello'` | 字符串 |
| `number` | `42`、`3.14` | 整数和浮点数统一为 number |
| `boolean` | `true`、`false` | 布尔值 |
| `null` | `null` | 空值（开启 strictNullChecks 后需显式处理） |
| `undefined` | `undefined` | 未定义 |
| `bigint` | `9007199254740993n` | 大整数 |
| `symbol` | `Symbol('id')` | 唯一标识符 |

### 2. any 与 unknown

::: details any 与 unknown 的对比

```ts
// any：关闭类型检查，等同于"跳过 TypeScript"
// 应该尽量避免使用
let rawData: any = fetchFromAPI()
rawData.nonExistent.deep.access // 不报错，但运行时可能崩溃

// unknown：类型安全的 any，使用前必须做类型收窄
let response: unknown = fetchFromAPI()

// 必须先检查类型才能使用
if (typeof response === 'string') {
  console.log(response.toUpperCase()) // OK，此处 response 类型为 string
}

if (response !== null && typeof response === 'object' && 'data' in response) {
  console.log(response.data) // 类型安全地访问属性
}
```

:::

::: warning 关于 any 的使用原则
在项目中约定：禁止在业务代码中直接使用 `any`。必须绕过类型检查时，优先使用 `unknown` 配合类型守卫，或使用 `as` 类型断言并添加注释说明原因。
:::

### 3. void 与 never

::: details void 与 never 的使用场景

```ts
// void：函数没有返回值
function logMessage(message: string): void {
  console.log(`[LOG] ${message}`)
  // 不需要 return 语句
}

// never：函数永远不会正常结束（抛出异常或无限循环）
function throwError(message: string): never {
  throw new Error(message)
}

// never 用于穷举检查
type Shape = 'circle' | 'square' | 'triangle'

function getArea(shape: Shape): number {
  switch (shape) {
    case 'circle': return Math.PI * 100
    case 'square': return 100
    case 'triangle': return 50
    default:
      // 如果新增了 Shape 类型但忘记处理，编译器会在这里报错
      const exhausted: never = shape
      throw new Error(`未处理的形状: ${exhausted}`)
  }
}
```

:::

## 三、数组、元组与枚举

### 1. 数组类型

::: details 数组类型声明

```ts
// 两种等价的写法
const productIds: number[] = [101, 102, 103]
const productNames: Array<string> = ['手机', '平板', '笔记本']

// 只读数组：防止数组被修改
const WEEKDAYS: readonly string[] = ['周一', '周二', '周三', '周四', '周五']
// WEEKDAYS.push('周六') // 报错：Property 'push' does not exist on type 'readonly string[]'
```

:::

### 2. 元组（Tuple）

元组是长度固定、每个位置类型确定的数组，常用于函数返回多个值：

::: details 元组的使用场景

```ts
// 定义 [经度, 纬度] 元组
type Coordinate = [number, number]
const location: Coordinate = [116.397, 39.916] // 北京坐标

// 函数返回元组，类似 React 的 useState
function useCounter(initial: number): [number, () => void, () => void] {
  let count = initial
  const increment = () => count++
  const decrement = () => count--
  return [count, increment, decrement]
}

const [count, inc, dec] = useCounter(0)

// 带标签的元组（TypeScript 4.0+），提升可读性
type Range = [start: number, end: number]
```

:::

### 3. 枚举（Enum）

::: details 数字枚举与字符串枚举

```ts
// 数字枚举：默认从 0 开始递增
enum OrderStatus {
  Pending,    // 0
  Processing, // 1
  Shipped,    // 2
  Delivered,  // 3
  Cancelled   // 4
}

function getStatusText(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.Pending: return '待处理'
    case OrderStatus.Delivered: return '已送达'
    default: return '其他状态'
  }
}

// 字符串枚举：更推荐，值具有可读性，调试方便
enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
}

async function request(url: string, method: HttpMethod) {
  return fetch(url, { method })
}

request('/api/users', HttpMethod.GET)
```

:::

::: tip 枚举 vs 联合类型
在现代 TypeScript 中，很多场景可以用字符串字面量联合类型代替枚举：`type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'`。联合类型更轻量，不会生成额外的 JavaScript 代码。
:::

## 四、函数类型

### 1. 参数与返回值类型

::: details 函数类型注解示例

```ts
// 基础函数类型注解
function formatPrice(price: number, currency: string = 'CNY'): string {
  return `${currency} ${price.toFixed(2)}`
}

// 可选参数（必须放在必填参数后面）
function createUser(name: string, email: string, avatar?: string): object {
  return { name, email, avatar: avatar ?? '/default-avatar.png' }
}

// 剩余参数
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0)
}

// 函数类型别名
type Comparator<T> = (a: T, b: T) => number

const compareByAge: Comparator<{ age: number }> = (a, b) => a.age - b.age
```

:::

### 2. 函数重载

当函数根据参数类型返回不同类型时，使用重载声明：

::: details 函数重载示例

```ts{1-4}
// 先声明重载签名
function parseInput(input: string): number
function parseInput(input: number): string
// 再写实现签名（实现签名不对外暴露）
function parseInput(input: string | number): string | number {
  if (typeof input === 'string') {
    return parseInt(input, 10)
  }
  return input.toString()
}

const num = parseInput('42')    // 类型推断为 number
const str = parseInput(42)      // 类型推断为 string
```

:::

## 五、类型断言

当你比编译器更了解某个值的类型时，可以使用类型断言：

::: details 类型断言的正确用法

```ts
// as 语法（推荐）
const canvas = document.getElementById('myCanvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!  // ! 是非空断言，断言值不为 null/undefined

// 从 unknown 断言到具体类型
async function fetchUser(id: number): Promise<unknown> {
  const res = await fetch(`/api/users/${id}`)
  return res.json()
}

interface User {
  id: number
  name: string
}

const user = await fetchUser(1) as User
console.log(user.name)

// 双重断言（慎用，通常意味着类型设计有问题）
const value = 'hello' as unknown as number // 强制转换，会丢失类型安全
```

:::

::: danger 类型断言不是类型转换
`as` 只是告诉编译器"相信我，我知道这个类型"，它不会在运行时做任何转换。错误地使用类型断言可能导致运行时错误，因此务必确保断言是准确的。
:::
