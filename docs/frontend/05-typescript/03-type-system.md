---
title: "TypeScript 类型系统"
category: "前端 · TypeScript"
tags:
  - TypeScript
excerpt: "深入理解 TypeScript 类型系统的核心机制，包括联合类型、交叉类型、类型推断、类型守卫和结构化类型，掌握这些概念是写好 TypeScript 的关键。"
date: 2026-03-17
---

# TypeScript 类型系统

TypeScript 的类型系统采用**结构化类型**（Structural Typing）而非名义类型，即两个类型是否兼容取决于它们的结构，而非名称。理解这一点是掌握 TypeScript 类型系统的关键。

## 一、联合类型与交叉类型

### 1. 联合类型（Union Types）

联合类型表示一个值可以是多种类型之一，使用 `|` 连接：

::: details 联合类型的常见用法

```ts
// 基础联合类型
type StringOrNumber = string | number
type ID = string | number

function printId(id: ID): void {
  // 使用前需要收窄类型
  if (typeof id === 'string') {
    console.log(`字符串 ID: ${id.toUpperCase()}`)
  } else {
    console.log(`数字 ID: ${id.toFixed(0)}`)
  }
}

// 字面量联合类型：限制取值范围
type Direction = 'north' | 'south' | 'east' | 'west'
type StatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 500

function move(direction: Direction, steps: number): void {
  console.log(`向 ${direction} 移动 ${steps} 步`)
}

move('north', 3)   // OK
// move('up', 3)   // 报错：'up' 不在联合类型中

// 可辨识联合（Discriminated Unions）：每个成员都有一个字面量类型的公共字段
type ApiResponse =
  | { status: 'success'; data: unknown }
  | { status: 'error'; message: string; code: number }

function handleResponse(response: ApiResponse): void {
  if (response.status === 'success') {
    console.log(response.data)        // 类型安全，data 存在
  } else {
    console.log(response.message)     // 类型安全，message 存在
    console.log(response.code)
  }
}
```

:::

### 2. 交叉类型（Intersection Types）

交叉类型将多个类型合并为一个，使用 `&` 连接，结果类型同时拥有所有成员：

::: details 交叉类型的组合模式

```ts
interface Timestamped {
  createdAt: Date
  updatedAt: Date
}

interface Identified {
  id: number
}

interface Named {
  name: string
  description?: string
}

// 组合多个接口：Product 同时拥有三个接口的所有属性
type Product = Identified & Named & Timestamped

const laptop: Product = {
  id: 1,
  name: '笔记本电脑',
  description: '高性能笔记本',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-03-01')
}

// 交叉类型常用于 Mixin 模式
type WithLogging<T> = T & {
  log: (message: string) => void
}
```

:::

::: tip 联合类型 vs 交叉类型
- **联合类型 `A | B`**：值是 A 或 B 之一，使用时需要做类型收窄
- **交叉类型 `A & B`**：值同时满足 A 和 B，拥有两者的所有属性
:::

## 二、类型推断

### 1. 自动推断规则

TypeScript 能在大多数情况下自动推断变量的类型，无需显式注解：

::: details 类型推断的几种场景

```ts
// 变量初始化时推断
const count = 0           // number
const title = 'TypeScript' // string
const items = [1, 2, 3]   // number[]
const mixed = [1, 'hello'] // (string | number)[]

// 函数返回值推断
function getFullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}` // 推断返回类型为 string
}

// 对象字面量推断
const config = {
  host: 'localhost', // string
  port: 3000,        // number
  ssl: false         // boolean
}
// config 的类型被推断为 { host: string; port: number; ssl: boolean }

// 上下文类型推断：根据使用环境推断类型
const numbers = [3, 1, 4, 1, 5, 9]
numbers.sort((a, b) => a - b) // a 和 b 被推断为 number，无需注解
```

:::

### 2. 最宽泛公共类型

当数组包含多种类型时，TypeScript 推断最宽泛的公共类型：

::: details 最宽泛公共类型推断

```ts
class Animal { name = '' }
class Dog extends Animal { bark() {} }
class Cat extends Animal { meow() {} }

// 推断为 (Dog | Cat)[]
const pets = [new Dog(), new Cat()]

// 有时需要显式注解来得到期望的类型
const animals: Animal[] = [new Dog(), new Cat()]
```

:::

## 三、类型收窄

类型收窄（Type Narrowing）是指在代码块中将联合类型缩小为更具体的类型。

### 1. typeof 收窄

::: details typeof 类型守卫

```ts
function formatValue(value: string | number | boolean): string {
  if (typeof value === 'string') {
    return value.trim()          // value: string
  } else if (typeof value === 'number') {
    return value.toFixed(2)      // value: number
  } else {
    return value ? '是' : '否'   // value: boolean
  }
}
```

:::

### 2. instanceof 收窄

::: details instanceof 类型守卫

```ts
class NetworkError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
  }
}

class ValidationError extends Error {
  constructor(public fields: string[], message: string) {
    super(message)
  }
}

function handleError(error: unknown): void {
  if (error instanceof NetworkError) {
    console.log(`网络错误 ${error.statusCode}: ${error.message}`)
  } else if (error instanceof ValidationError) {
    console.log(`验证错误，字段: ${error.fields.join(', ')}`)
  } else if (error instanceof Error) {
    console.log(`未知错误: ${error.message}`)
  }
}
```

:::

### 3. in 操作符收窄

::: details in 操作符类型守卫

```ts
interface AdminUser {
  role: 'admin'
  permissions: string[]
  adminLevel: number
}

interface RegularUser {
  role: 'user'
  email: string
}

type User = AdminUser | RegularUser

function getUserInfo(user: User): string {
  if ('adminLevel' in user) {
    // user: AdminUser
    return `管理员，权限数量: ${user.permissions.length}`
  } else {
    // user: RegularUser
    return `普通用户，邮箱: ${user.email}`
  }
}
```

:::

### 4. 自定义类型守卫

使用返回类型为 `参数 is 类型` 的函数来实现复杂的类型收窄：

::: details 自定义类型守卫函数

```ts{5}
interface Product {
  id: number
  name: string
  price: number
}

// is 关键字定义类型谓词
function isProduct(value: unknown): value is Product {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'price' in value &&
    typeof (value as Product).price === 'number'
  )
}

async function loadProduct(id: number): Promise<void> {
  const data: unknown = await fetch(`/api/products/${id}`).then(r => r.json())

  if (isProduct(data)) {
    // 此处 data 类型为 Product，可以安全访问所有属性
    console.log(`商品: ${data.name}，价格: ¥${data.price}`)
  } else {
    console.error('响应数据格式不正确')
  }
}
```

:::

## 四、结构化类型系统

### 1. 鸭子类型（Duck Typing）

TypeScript 判断类型兼容性基于结构，而非名称：

::: details 结构化类型兼容性示例

```ts
interface Point2D {
  x: number
  y: number
}

interface Point3D {
  x: number
  y: number
  z: number
}

// Point3D 结构上兼容 Point2D（有更多属性），可以赋值给 Point2D
const point3d: Point3D = { x: 1, y: 2, z: 3 }
const point2d: Point2D = point3d  // OK

// 反过来不行：Point2D 缺少 z 属性
// const p3: Point3D = { x: 1, y: 2 }  // 报错

// 函数参数也遵循结构化类型
function drawPoint(point: Point2D): void {
  console.log(`(${point.x}, ${point.y})`)
}

drawPoint(point3d)  // OK，Point3D 包含 Point2D 所需的所有属性
```

:::

### 2. 多余属性检查

对象字面量直接赋值时，TypeScript 会进行严格的多余属性检查：

::: details 多余属性检查的边界

```ts
interface UserOptions {
  name: string
  age?: number
}

// 直接赋值对象字面量：报错，有多余属性 email
// const user: UserOptions = { name: '张三', email: 'test@example.com' }

// 通过变量赋值：不报错（结构化类型兼容）
const data = { name: '张三', email: 'test@example.com' }
const user: UserOptions = data  // OK

// 通过类型断言绕过（慎用）
const user2: UserOptions = { name: '张三', email: 'test@example.com' } as UserOptions
```

:::

::: tip 何时会触发多余属性检查
只有在对象字面量**直接赋值**给某个类型时才会触发多余属性检查。通过变量中转、类型断言或函数参数传入时均不触发。
:::
