---
title: "TypeScript 装饰器"
category: "前端 · TypeScript"
tags:
  - TypeScript
excerpt: "装饰器是 TypeScript 中用于修改类和类成员行为的语法糖，广泛用于 NestJS、Angular 等框架。本文介绍类装饰器、方法装饰器、属性装饰器和参数装饰器的原理与实战用法。"
date: 2026-03-17
---

# TypeScript 装饰器

装饰器（Decorator）是一种特殊的声明，可以附加到类、方法、属性或参数上，用于修改其行为或添加元数据。装饰器本质上是一个函数，在类定义时执行。

## 一、启用装饰器

### 1. 配置 tsconfig.json

装饰器目前是 TC39 Stage 3 提案，需要在 `tsconfig.json` 中开启：

::: details 开启装饰器配置

```json
// tsconfig.json
{
  "compilerOptions": {
    // TypeScript 5.0+ 的原生装饰器（推荐）
    "experimentalDecorators": true,

    // 如果使用 reflect-metadata（如 NestJS），还需要开启
    "emitDecoratorMetadata": true
  }
}
```

```bash
# 如果需要运行时元数据反射，安装 reflect-metadata
npm install reflect-metadata
```

:::

::: warning 装饰器的现状
TypeScript 同时支持旧版实验性装饰器（`experimentalDecorators: true`）和 TC39 标准装饰器（TypeScript 5.0+）。本文介绍的是旧版装饰器，因为 NestJS 等主流框架仍在使用。新项目建议了解新版标准后再做选择。
:::

## 二、类装饰器

### 1. 基础类装饰器

类装饰器接收构造函数作为参数，可以修改或替换类的定义：

::: details 类装饰器示例

```ts{1-4}
// 装饰器工厂：返回一个装饰器函数
function Injectable(options?: { singleton?: boolean }) {
  return function<T extends new (...args: any[]) => object>(constructor: T) {
    // 在构造函数上添加元数据
    Reflect.defineMetadata('injectable', true, constructor)
    Reflect.defineMetadata('singleton', options?.singleton ?? false, constructor)

    console.log(`${constructor.name} 已注册为可注入服务`)
    return constructor
  }
}

// 扩展类的装饰器
function Serializable<T extends new (...args: any[]) => object>(constructor: T) {
  return class extends constructor {
    serialize(): string {
      return JSON.stringify(this)
    }

    static deserialize(json: string): InstanceType<T> {
      return Object.assign(new constructor(), JSON.parse(json))
    }
  }
}

@Serializable
class User {
  constructor(
    public id: number,
    public name: string,
    public email: string
  ) {}
}

const user = new User(1, '张三', 'zhangsan@example.com')
// @ts-ignore - serialize 方法由装饰器添加
console.log(user.serialize())
// {"id":1,"name":"张三","email":"zhangsan@example.com"}
```

:::

### 2. 日志装饰器

::: details 记录类实例化日志

```ts
function LogClass(prefix: string) {
  return function<T extends new (...args: any[]) => object>(constructor: T) {
    return class extends constructor {
      constructor(...args: any[]) {
        console.log(`[${prefix}] 创建 ${constructor.name} 实例，参数:`, args)
        super(...args)
        console.log(`[${prefix}] ${constructor.name} 实例创建完成`)
      }
    }
  }
}

@LogClass('DEBUG')
class OrderService {
  constructor(private orderId: string) {}
}

const service = new OrderService('ORD-2026-001')
// [DEBUG] 创建 OrderService 实例，参数: ['ORD-2026-001']
// [DEBUG] OrderService 实例创建完成
```

:::

## 三、方法装饰器

方法装饰器接收三个参数：目标对象、方法名和属性描述符：

### 1. 性能监控装饰器

::: details 测量方法执行时间

```ts{2-3}
function MeasureTime(target: object, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value

  descriptor.value = async function (...args: unknown[]) {
    const start = performance.now()
    const result = await originalMethod.apply(this, args)
    const duration = performance.now() - start
    console.log(`${propertyKey} 执行耗时: ${duration.toFixed(2)}ms`)
    return result
  }

  return descriptor
}

class DataService {
  @MeasureTime
  async fetchUserList(page: number): Promise<object[]> {
    const res = await fetch(`/api/users?page=${page}`)
    return res.json()
  }
}

const dataService = new DataService()
await dataService.fetchUserList(1)
// fetchUserList 执行耗时: 234.56ms
```

:::

### 2. 错误处理装饰器

::: details 自动捕获和处理方法错误

```ts
function HandleError(errorHandler?: (error: unknown) => void) {
  return function (target: object, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      try {
        return await originalMethod.apply(this, args)
      } catch (error) {
        if (errorHandler) {
          errorHandler(error)
        } else {
          console.error(`[${target.constructor.name}.${propertyKey}] 错误:`, error)
        }
        throw error  // 重新抛出，让调用方处理
      }
    }

    return descriptor
  }
}

class UserController {
  @HandleError((err) => {
    // 发送错误到监控平台
    console.error('用户创建失败，已上报:', err)
  })
  async createUser(data: { name: string; email: string }): Promise<object> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }
}
```

:::

### 3. 防抖装饰器

::: details 方法调用防抖

```ts
function Debounce(delay: number) {
  return function (target: object, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    let timer: ReturnType<typeof setTimeout>

    descriptor.value = function (...args: unknown[]) {
      clearTimeout(timer)
      timer = setTimeout(() => {
        originalMethod.apply(this, args)
      }, delay)
    }

    return descriptor
  }
}

class SearchComponent {
  @Debounce(300)
  search(keyword: string): void {
    console.log(`搜索: ${keyword}`)
    // 实际发起 API 请求
  }
}

const search = new SearchComponent()
search.search('TypeScript')  // 300ms 内连续调用只执行最后一次
search.search('TypeScript d')
search.search('TypeScript decorator')
// 最终只执行一次搜索：'TypeScript decorator'
```

:::

## 四、属性装饰器

属性装饰器接收目标对象和属性名两个参数，常用于添加元数据：

::: details 属性验证装饰器

```ts
// 注册需要验证的属性
const validationMetadata = new Map<object, Map<string, ((v: unknown) => boolean)[]>>()

function Validate(validator: (value: unknown) => boolean) {
  return function (target: object, propertyKey: string) {
    if (!validationMetadata.has(target)) {
      validationMetadata.set(target, new Map())
    }
    const classValidators = validationMetadata.get(target)!
    if (!classValidators.has(propertyKey)) {
      classValidators.set(propertyKey, [])
    }
    classValidators.get(propertyKey)!.push(validator)
  }
}

// 预定义验证器
const isEmail = (v: unknown) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const isPositive = (v: unknown) => typeof v === 'number' && v > 0
const notEmpty = (v: unknown) => typeof v === 'string' && v.trim().length > 0

class ProductForm {
  @Validate(notEmpty)
  name: string = ''

  @Validate(isPositive)
  price: number = 0

  @Validate(isEmail)
  contactEmail: string = ''
}
```

:::

## 五、参数装饰器

参数装饰器接收目标对象、方法名和参数索引三个参数：

::: details 参数注入装饰器（类似 NestJS）

```ts
const PARAM_METADATA = 'param:metadata'

// 标记需要从请求中提取的参数
function Body() {
  return function (target: object, methodName: string, paramIndex: number) {
    const existing = Reflect.getMetadata(PARAM_METADATA, target, methodName) || []
    existing[paramIndex] = { source: 'body' }
    Reflect.defineMetadata(PARAM_METADATA, existing, target, methodName)
  }
}

function Param(name: string) {
  return function (target: object, methodName: string, paramIndex: number) {
    const existing = Reflect.getMetadata(PARAM_METADATA, target, methodName) || []
    existing[paramIndex] = { source: 'param', name }
    Reflect.defineMetadata(PARAM_METADATA, existing, target, methodName)
  }
}

class UserController {
  async getUser(@Param('id') id: string): Promise<object> {
    return fetch(`/api/users/${id}`).then(r => r.json())
  }

  async createUser(@Body() body: { name: string; email: string }): Promise<object> {
    return fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(body)
    }).then(r => r.json())
  }
}
```

:::

## 六、装饰器执行顺序

::: details 多个装饰器的执行顺序验证

```ts
function log(label: string) {
  console.log(`[工厂] ${label} 执行`)
  return function (target: object, key?: string) {
    console.log(`[装饰器] ${label} 执行`)
  }
}

@log('类装饰器')  // 最后执行
class Example {
  @log('属性装饰器')  // 第一个执行
  prop = 'value'

  @log('方法装饰器 1')  // 工厂从上到下，装饰器从下到上
  @log('方法装饰器 2')
  method() {}
}

// 执行顺序：
// [工厂] 属性装饰器 执行
// [装饰器] 属性装饰器 执行
// [工厂] 方法装饰器 1 执行
// [工厂] 方法装饰器 2 执行
// [装饰器] 方法装饰器 2 执行（从下到上）
// [装饰器] 方法装饰器 1 执行
// [工厂] 类装饰器 执行
// [装饰器] 类装饰器 执行
```

:::

::: tip 装饰器执行规律
- **同一类中**：属性装饰器 → 方法装饰器 → 类装饰器
- **同一元素上叠加多个装饰器**：工厂函数从上到下执行，装饰器本身从下到上执行
- **类装饰器**：始终最后执行
:::
