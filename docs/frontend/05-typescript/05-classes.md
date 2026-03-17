---
title: "TypeScript 类与面向对象"
category: "前端 · TypeScript"
tags:
  - TypeScript
excerpt: "TypeScript 在 ES6 类的基础上增加了访问修饰符、抽象类、接口实现等特性，使面向对象编程更加规范。本文介绍类的核心用法，包括继承、多态、访问控制和设计模式实践。"
date: 2026-03-17
---

# TypeScript 类与面向对象

## 一、类的基础

### 1. 属性与构造函数

TypeScript 的类需要在使用属性前先声明其类型：

::: details 类的基础定义

```ts{3-6}
class User {
  // 属性声明（必须在 constructor 之前）
  id: number
  name: string
  email: string
  private passwordHash: string

  constructor(id: number, name: string, email: string, password: string) {
    this.id = id
    this.name = name
    this.email = email
    this.passwordHash = this.hashPassword(password)
  }

  private hashPassword(password: string): string {
    // 实际项目中使用 bcrypt 等库
    return Buffer.from(password).toString('base64')
  }

  getDisplayName(): string {
    return `${this.name} <${this.email}>`
  }
}

const user = new User(1, '张三', 'zhangsan@example.com', 'secret123')
console.log(user.getDisplayName()) // 张三 <zhangsan@example.com>
```

:::

### 2. 参数属性简写

TypeScript 允许在构造函数参数上使用访问修饰符，自动创建并初始化类属性：

::: details 参数属性简写

```ts{3-7}
// 等价于上方的完整写法，但更简洁
class User {
  constructor(
    public readonly id: number,
    public name: string,
    public email: string,
    private passwordHash: string
  ) {}

  getDisplayName(): string {
    return `${this.name} <${this.email}>`
  }
}

// 参数属性同样支持可选和默认值
class ApiClient {
  constructor(
    private baseUrl: string,
    private timeout: number = 5000,
    private headers: Record<string, string> = {}
  ) {}
}
```

:::

## 二、访问修饰符

### 1. 三种修饰符

| 修饰符 | 可访问范围 | 说明 |
|--------|-----------|------|
| `public` | 任何地方 | 默认值，可以省略 |
| `private` | 仅类内部 | 子类也不能访问 |
| `protected` | 类内部及子类 | 子类可以访问 |
| `readonly` | 读取不限，赋值仅构造函数 | 与上述修饰符配合使用 |

::: details 访问修饰符示例

```ts
class BankAccount {
  public readonly id: string
  public owner: string
  private balance: number         // 余额只能通过方法操作
  protected currency: string      // 子类可访问货币类型

  constructor(owner: string, initialBalance: number) {
    this.id = crypto.randomUUID()
    this.owner = owner
    this.balance = initialBalance
    this.currency = 'CNY'
  }

  public deposit(amount: number): void {
    if (amount <= 0) throw new Error('存款金额必须大于 0')
    this.balance += amount
  }

  public withdraw(amount: number): void {
    if (amount > this.balance) throw new Error('余额不足')
    this.balance -= amount
  }

  public getBalance(): number {
    return this.balance
  }
}

class SavingsAccount extends BankAccount {
  private interestRate: number

  constructor(owner: string, initialBalance: number, rate: number) {
    super(owner, initialBalance)
    this.interestRate = rate
  }

  applyInterest(): void {
    const interest = this.getBalance() * this.interestRate
    this.deposit(interest)
    console.log(`已存入利息 ${interest} ${this.currency}`) // protected 属性可访问
  }
}
```

:::

### 2. ES 私有字段 #

TypeScript 4.3+ 支持使用 `#` 前缀的真正私有字段（运行时私有，而非仅编译时）：

::: details # 私有字段 vs private 关键字

```ts
class Counter {
  #count: number = 0  // 运行时真正私有

  increment(): void {
    this.#count++
  }

  get value(): number {
    return this.#count
  }
}

const counter = new Counter()
counter.increment()
console.log(counter.value) // 1
// counter.#count           // 语法错误，运行时也无法访问
```

:::

## 三、继承与多态

### 1. 类继承

::: details 继承与方法重写

```ts
abstract class Shape {
  abstract area(): number
  abstract perimeter(): number

  describe(): string {
    return `面积: ${this.area().toFixed(2)}，周长: ${this.perimeter().toFixed(2)}`
  }
}

class Circle extends Shape {
  constructor(private radius: number) {
    super()
  }

  area(): number {
    return Math.PI * this.radius ** 2
  }

  perimeter(): number {
    return 2 * Math.PI * this.radius
  }
}

class Rectangle extends Shape {
  constructor(private width: number, private height: number) {
    super()
  }

  area(): number {
    return this.width * this.height
  }

  perimeter(): number {
    return 2 * (this.width + this.height)
  }
}

// 多态：统一处理不同子类
const shapes: Shape[] = [new Circle(5), new Rectangle(4, 6)]
shapes.forEach(shape => console.log(shape.describe()))
// 面积: 78.54，周长: 31.42
// 面积: 24.00，周长: 20.00
```

:::

## 四、抽象类

### 1. 抽象类的定义与用途

抽象类不能直接实例化，只能作为基类使用。它可以包含抽象方法（只有声明没有实现）和具体方法（有实现）：

::: details 抽象类设计数据访问层

```ts{1,4-5}
// 抽象基类定义通用数据访问接口
abstract class BaseRepository<T extends { id: number }> {
  protected items: T[] = []

  // 抽象方法：子类必须实现
  abstract validate(item: T): boolean

  // 具体方法：子类继承后直接使用
  findById(id: number): T | undefined {
    return this.items.find(item => item.id === id)
  }

  findAll(): T[] {
    return [...this.items]
  }

  save(item: T): T {
    if (!this.validate(item)) {
      throw new Error('数据验证失败')
    }
    const index = this.items.findIndex(i => i.id === item.id)
    if (index >= 0) {
      this.items[index] = item
    } else {
      this.items.push(item)
    }
    return item
  }

  delete(id: number): boolean {
    const index = this.items.findIndex(i => i.id === id)
    if (index >= 0) {
      this.items.splice(index, 1)
      return true
    }
    return false
  }
}

interface Product {
  id: number
  name: string
  price: number
}

// 具体子类只需实现验证逻辑
class ProductRepository extends BaseRepository<Product> {
  validate(product: Product): boolean {
    return product.name.length > 0 && product.price > 0
  }

  findByPriceRange(min: number, max: number): Product[] {
    return this.items.filter(p => p.price >= min && p.price <= max)
  }
}

const repo = new ProductRepository()
repo.save({ id: 1, name: '手机', price: 3999 })
repo.save({ id: 2, name: '平板', price: 2499 })
console.log(repo.findByPriceRange(2000, 4000)) // [手机, 平板]
```

:::

## 五、接口实现

### 1. implements 关键字

类可以实现一个或多个接口，接口描述契约，类提供具体实现：

::: details 接口实现示例

```ts
interface Serializable {
  serialize(): string
  deserialize(data: string): this
}

interface Comparable<T> {
  compareTo(other: T): number
}

class Money implements Serializable, Comparable<Money> {
  constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {}

  serialize(): string {
    return JSON.stringify({ amount: this.amount, currency: this.currency })
  }

  deserialize(data: string): this {
    const parsed = JSON.parse(data)
    // 使用 Object.assign 返回同类型实例
    return Object.assign(Object.create(Object.getPrototypeOf(this)), parsed)
  }

  compareTo(other: Money): number {
    if (this.currency !== other.currency) {
      throw new Error('不能比较不同货币')
    }
    return this.amount - other.amount
  }

  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`
  }
}

const price1 = new Money(99.9, 'CNY')
const price2 = new Money(199.0, 'CNY')
console.log(price1.compareTo(price2)) // -99.1（price1 < price2）

const json = price1.serialize()
console.log(json) // {"amount":99.9,"currency":"CNY"}
```

:::

## 六、Getter 与 Setter

::: details 使用 getter/setter 控制属性访问

```ts
class Temperature {
  private _celsius: number

  constructor(celsius: number) {
    this._celsius = celsius
  }

  // getter
  get celsius(): number {
    return this._celsius
  }

  // setter 中可以加入验证逻辑
  set celsius(value: number) {
    if (value < -273.15) {
      throw new Error('温度不能低于绝对零度 (-273.15°C)')
    }
    this._celsius = value
  }

  // 派生属性
  get fahrenheit(): number {
    return this._celsius * 9 / 5 + 32
  }

  get kelvin(): number {
    return this._celsius + 273.15
  }
}

const temp = new Temperature(100)
console.log(temp.fahrenheit) // 212
console.log(temp.kelvin)     // 373.15
temp.celsius = -10
console.log(temp.fahrenheit) // 14
```

:::

::: warning 抽象类 vs 接口的选择
- 使用**接口**：只需要定义契约（方法签名），不需要共享实现逻辑时
- 使用**抽象类**：需要在基类中提供部分实现，或共享状态（属性）时

一个类可以实现多个接口，但只能继承一个抽象类。
:::
