---
title: "TypeScript 高级类型"
category: "前端 · TypeScript"
tags:
  - TypeScript
excerpt: "TypeScript 的高级类型特性包括条件类型、映射类型、模板字面量类型和内置工具类型。掌握这些特性可以编写出更强大、更精确的类型定义，大幅减少重复的类型代码。"
date: 2026-03-17
---

# TypeScript 高级类型

## 一、条件类型

### 1. 基础语法

条件类型的语法类似于三元表达式：`T extends U ? X : Y`，当 `T` 能赋值给 `U` 时，结果为 `X`，否则为 `Y`：

::: details 条件类型基础

```ts
// 判断类型是否为字符串
type IsString<T> = T extends string ? true : false

type A = IsString<string>   // true
type B = IsString<number>   // false
type C = IsString<'hello'>  // true（字符串字面量也是 string 的子类型）

// 提取函数返回类型（类似内置的 ReturnType）
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never

type Fn = (x: number) => string
type R = MyReturnType<Fn>  // string

// 提取 Promise 的解析类型
type Awaited<T> = T extends Promise<infer R> ? Awaited<R> : T

type P1 = Awaited<Promise<string>>           // string
type P2 = Awaited<Promise<Promise<number>>>  // number
```

:::

### 2. infer 关键字

`infer` 用于在条件类型中声明一个类型变量，用于捕获推断的类型：

::: details infer 的实用示例

```ts
// 提取函数参数类型（类似内置的 Parameters）
type MyParameters<T extends (...args: any[]) => any> =
  T extends (...args: infer P) => any ? P : never

type Params = MyParameters<(id: number, name: string) => void>
// [id: number, name: string]

// 提取数组元素类型
type ElementType<T> = T extends (infer E)[] ? E : never

type NumEl = ElementType<number[]>    // number
type StrEl = ElementType<string[]>    // string

// 提取对象的值类型
type ValueOf<T> = T[keyof T]

interface Config {
  host: string
  port: number
  ssl: boolean
}

type ConfigValue = ValueOf<Config>  // string | number | boolean

// 提取构造函数的实例类型
type InstanceOf<T> = T extends new (...args: any[]) => infer I ? I : never

class UserService {}
type UserServiceInstance = InstanceOf<typeof UserService>  // UserService
```

:::

### 3. 分布式条件类型

当条件类型作用于联合类型时，会自动分发到每个成员：

::: details 分布式条件类型

```ts{4}
// 从联合类型中排除某些类型（类似内置的 Exclude）
type MyExclude<T, U> = T extends U ? never : T

type Result = MyExclude<'a' | 'b' | 'c', 'b'>  // 'a' | 'c'

// 过滤联合类型（类似内置的 Extract）
type MyExtract<T, U> = T extends U ? T : never

type Nums = MyExtract<string | number | boolean, number | bigint>  // number

// 非空类型
type NonNullable<T> = T extends null | undefined ? never : T

type Safe = NonNullable<string | null | undefined>  // string

// 防止分布：用 [] 包裹防止分布式行为
type IsUnion<T> = [T] extends [T] ? 'no distribution' : never
```

:::

## 二、映射类型

### 1. 基础映射类型

映射类型通过遍历已有类型的键来创建新类型：

::: details 映射类型基础

```ts{2}
// 将对象所有属性变为可选（类似内置的 Partial）
type MyPartial<T> = {
  [K in keyof T]?: T[K]
}

// 将对象所有属性变为必填（类似内置的 Required）
type MyRequired<T> = {
  [K in keyof T]-?: T[K]  // -? 移除可选修饰符
}

// 将对象所有属性变为只读（类似内置的 Readonly）
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K]
}

// 使用示例
interface UserForm {
  name: string
  email: string
  age?: number
}

type UserFormPartial = MyPartial<UserForm>
// { name?: string; email?: string; age?: number }

type UserFormRequired = MyRequired<UserForm>
// { name: string; email: string; age: number }
```

:::

### 2. 键重映射（Key Remapping）

TypeScript 4.1+ 支持使用 `as` 在映射类型中重命名键：

::: details 键重映射示例

```ts
// 将所有键转为 getter 方法名
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]
}

interface User {
  id: number
  name: string
  email: string
}

type UserGetters = Getters<User>
// {
//   getId: () => number;
//   getName: () => string;
//   getEmail: () => string;
// }

// 过滤键：值为 never 时该键被移除
type FilterByValueType<T, ValueType> = {
  [K in keyof T as T[K] extends ValueType ? K : never]: T[K]
}

interface Mixed {
  id: number
  name: string
  price: number
  description: string
}

type StringFields = FilterByValueType<Mixed, string>
// { name: string; description: string }
```

:::

## 三、模板字面量类型

### 1. 基础语法

TypeScript 4.1+ 支持在类型层面使用模板字符串：

::: details 模板字面量类型

```ts
type Greeting = `Hello, ${string}!`
const g1: Greeting = 'Hello, World!'  // OK
// const g2: Greeting = 'Hi there'    // 报错

// 联合类型的组合
type CSSUnit = 'px' | 'em' | 'rem' | 'vw' | 'vh'
type CSSValue = `${number}${CSSUnit}`

// 生成事件名称
type EventName = 'click' | 'focus' | 'blur'
type HandlerName = `on${Capitalize<EventName>}`
// 'onClick' | 'onFocus' | 'onBlur'

// 实际应用：类型安全的 CSS-in-JS
type StyleProp = 'margin' | 'padding' | 'border'
type StyleSide = 'Top' | 'Right' | 'Bottom' | 'Left'
type StyleProperty = StyleProp | `${StyleProp}${StyleSide}`
// 'margin' | 'padding' | 'border' | 'marginTop' | ... 等16个值
```

:::

## 四、内置工具类型

TypeScript 提供了一系列开箱即用的工具类型：

### 1. 对象操作工具类型

| 工具类型 | 说明 | 示例 |
|---------|------|------|
| `Partial<T>` | 所有属性变可选 | `Partial<User>` |
| `Required<T>` | 所有属性变必填 | `Required<Config>` |
| `Readonly<T>` | 所有属性变只读 | `Readonly<State>` |
| `Pick<T, K>` | 取出指定属性 | `Pick<User, 'id' \| 'name'>` |
| `Omit<T, K>` | 排除指定属性 | `Omit<User, 'password'>` |
| `Record<K, V>` | 键值对类型 | `Record<string, number>` |

### 2. 联合类型工具类型

| 工具类型 | 说明 | 示例 |
|---------|------|------|
| `Exclude<T, U>` | 从 T 中排除 U | `Exclude<string \| number, number>` |
| `Extract<T, U>` | 从 T 中提取 U | `Extract<string \| number, number>` |
| `NonNullable<T>` | 移除 null/undefined | `NonNullable<string \| null>` |

### 3. 函数工具类型

| 工具类型 | 说明 |
|---------|------|
| `ReturnType<T>` | 提取函数返回类型 |
| `Parameters<T>` | 提取函数参数类型（元组） |
| `ConstructorParameters<T>` | 提取构造函数参数类型 |
| `InstanceType<T>` | 提取构造函数实例类型 |

::: details 工具类型实战应用

```ts
interface UserFormData {
  id: number
  name: string
  email: string
  password: string
  createdAt: Date
  updatedAt: Date
}

// 创建表单时不需要 id、时间戳字段
type CreateUserDto = Omit<UserFormData, 'id' | 'createdAt' | 'updatedAt'>

// 更新表单时所有字段都是可选的（除了 id）
type UpdateUserDto = Partial<Omit<UserFormData, 'id' | 'createdAt' | 'updatedAt'>> & {
  id: number
}

// 安全展示用户信息时，排除密码
type SafeUserProfile = Omit<UserFormData, 'password'>

// API 响应中所有字段为只读
type UserResponse = Readonly<SafeUserProfile>

// 使用 Record 创建权限映射
type Permission = 'read' | 'write' | 'delete' | 'admin'
type RolePermissions = Record<string, Permission[]>

const roles: RolePermissions = {
  admin: ['read', 'write', 'delete', 'admin'],
  editor: ['read', 'write'],
  viewer: ['read']
}
```

:::

## 五、自定义高级工具类型

### 1. 深度 Partial

::: details 递归实现深度可选类型

```ts
// 内置 Partial 只处理第一层，DeepPartial 递归处理所有层
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T

interface AppConfig {
  server: {
    host: string
    port: number
    ssl: {
      enabled: boolean
      cert: string
    }
  }
  database: {
    url: string
    poolSize: number
  }
}

// 允许部分覆盖深层配置
function mergeConfig(base: AppConfig, override: DeepPartial<AppConfig>): AppConfig {
  return { ...base, ...override } as AppConfig
}
```

:::

### 2. 类型安全的 Omit

::: details StrictOmit 避免误删不存在的键

```ts
// 标准 Omit 允许传入不存在的键，不会报错
// StrictOmit 要求键必须存在于 T 中
type StrictOmit<T, K extends keyof T> = Omit<T, K>

interface Product {
  id: number
  name: string
  price: number
}

type ProductWithoutPrice = StrictOmit<Product, 'price'>     // OK
// type Bad = StrictOmit<Product, 'nonExistent'>             // 报错
```

:::

::: tip 何时需要高级类型
高级类型主要用于**类型库**和**工具函数**的类型定义，帮助使用者获得更好的类型推断。在普通业务代码中，保持类型简单明了比追求类型的"优雅"更重要。
:::
