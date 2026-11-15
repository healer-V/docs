---
title: "class 与实例"
tags:
  - JavaScript
  - class
  - 继承
  - 私有字段
excerpt: "说明 class 声明、constructor、实例字段、原型方法与静态成员，解释 extends 与 super() 的调用顺序、方法重写与 super.method() 的用法，以及私有 # 字段和类体严格模式的边界。"
date: 2026-11-15
---

# class 与实例

`class` 提供了一种声明对象类型的语法。`constructor` 定义实例的初始化过程，实例字段声明在类体中，方法定义在原型上，`static` 成员属于类本身。用 `new` 调用类得到实例，实例共享原型方法。

`extends` 建立子类与父类的关系。子类构造器必须先调用 `super()` 才能使用 `this`，方法可以重写，并可通过 `super.method()` 调用父类实现。以 `#` 开头的私有字段只能在类内部访问，类外写 `obj.#field` 是语法错误。

本篇先说明类的基本结构，再介绍继承与静态成员，随后处理私有字段和访问器，最后用页面核对。

::: info 本篇的范围
本篇讲 `class` 语法及其与原型的关系，不展开装饰器提案和多重继承模拟。原型链的查找机制见“原型链与继承”，`this` 的规则见“this、call/apply/bind 与箭头函数”。
:::

## 一、类的定义与实例

### 1. class 声明

类用 `class` 加类名声明，类体内部的方法之间不加逗号。类本身是函数，必须用 `new` 调用；直接调用类会抛出 `TypeError`。类声明不会被提升到可用状态，声明前使用会报错。

```js
class Shape {
  constructor(name) {
    this.name = name;
  }
  area() {
    return 0;
  }
}
const shape = new Shape("形状");
console.log(shape.name); // "形状"
```

### 2. 实例字段

实例字段在类体中直接写名字和初始值，每个实例创建时执行一次。字段属于实例自身，修改一个实例不影响其他实例。字段初始化在构造器逻辑之前执行，可用于声明默认值。

```js
class Counter {
  count = 0;
  increment() {
    return ++this.count;
  }
}
const counter = new Counter();
console.log(counter.increment()); // 1
```

### 3. 原型方法

类体中定义的方法位于类的 `prototype` 上，不在实例自身。所有实例共享同一份方法，因此修改类的方法会影响已有实例。实例字段则在每个实例上各有一份。

```js
const shape = new Shape("形状");
console.log(Object.hasOwn(shape, "area")); // false
console.log(typeof Shape.prototype.area); // "function"
```

## 二、继承

### 1. extends 与 super()

`class 子类 extends 父类` 建立继承。子类构造器中必须先调用 `super(...)`，它执行父类构造逻辑并初始化 `this`；在 `super()` 之前访问 `this` 会抛 `ReferenceError`。父类构造器需要参数时，把参数传给 `super()`。

```js
class Circle extends Shape {
  constructor(radius) {
    super("圆");
    this.radius = radius;
  }
  area() {
    return Math.round(Math.PI * this.radius ** 2);
  }
}
console.log(new Circle(2).area()); // 13
```

### 2. 方法重写与 super.method()

子类定义同名方法即重写父类方法。在子类方法中调用 `super.method()` 可以执行父类实现，再补充自己的逻辑。`super` 只能在类的方法中使用，不能单独取出保存。

```js
class Shape {
  describe() { return "形状"; }
}
class Circle extends Shape {
  describe() { return super.describe() + "：圆"; }
}
console.log(new Circle().describe()); // "形状：圆"
```

### 3. 静态成员

`static` 方法属于类本身，通过 `类名.方法()` 调用，不需要实例。静态成员也会沿 `extends` 继承，子类可以调用父类的静态方法。静态方法适合做工厂函数或工具函数。

```js
class Point {
  constructor(x, y) { this.x = x; this.y = y; }
  static origin() { return new Point(0, 0); }
}
console.log(Point.origin().x); // 0
```

## 三、私有字段与访问器

### 1. 私有 # 字段

以 `#` 开头的字段是私有字段，只能在声明它的类内部读写。类外读取、`in` 判断、`Object.keys` 都看不到它；在类外直接写 `obj.#field` 会触发语法错误，而不是返回 `undefined`。

```js
class Account {
  #balance = 0;
  deposit(amount) { return (this.#balance += amount); }
  get balance() { return this.#balance; }
}
const account = new Account();
account.deposit(50);
console.log(account.balance); // 50
console.log("#balance" in account); // false
```

### 2. get 与 set

类中的 `get`、`set` 定义访问器属性，读取和赋值时执行对应方法。它们适合在读写私有字段时做校验或转换。只定义 getter 时，赋值在严格模式下抛错，而类体始终处于严格模式。

```js
class Temperature {
  #celsius = 0;
  get celsius() { return this.#celsius; }
  set celsius(value) {
    if (typeof value !== "number") throw new TypeError("需要数字");
    this.#celsius = value;
  }
}
const temperature = new Temperature(); temperature.celsius = 25;
console.log(temperature.celsius); // 25
```

### 3. 类体的严格模式

类体内部始终按严格模式执行，与脚本是否写了 `"use strict"` 无关。方法单独取出调用时 `this` 是 `undefined`，读写实例属性会抛 `TypeError`。把方法作为回调传递前，应确认它是否需要绑定。

```js
class Circle {
  constructor(radius) { this.radius = radius; }
  area() { return this.radius * 2; }
}
const circle = new Circle(2);
const area = circle.area;
area(); // TypeError: Cannot read properties of undefined (reading 'radius')
```

## 四、从空目录观察类

### 1. 创建页面

新建空目录 `js-classes`，创建 `index.html`。脚本定义基类与子类、实例字段、静态工厂方法和私有字段，创建实例后读取名称、重写方法的面积、父类方法拼接结果和静态方法返回值，并写入表格。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>class 与实例观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>class 与实例观察</h1>
  <table id="output">
    <thead><tr><th>表达式</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    class Shape {
      #name;
      constructor(name) {
        this.#name = name;
      }
      get name() {
        return this.#name;
      }
      area() {
        return 0;
      }
      describe() {
        return this.#name + " 面积 " + this.area();
      }
      static create(name) {
        return new Shape(name);
      }
    }

    class Circle extends Shape {
      constructor(radius) {
        super("圆");
        this.radius = radius;
      }
      area() {
        return Math.round(Math.PI * this.radius ** 2);
      }
      describe() {
        return super.describe() + "（圆形）";
      }
    }

    class Counter {
      count = 0;
      increment() {
        this.count++;
        return this.count;
      }
    }

    const circle = new Circle(2);
    const created = Shape.create("形状");
    const counter = new Counter();
    const initialCount = counter.count;
    const firstCount = counter.increment();

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
      if (value === undefined) return "undefined";
      return JSON.stringify(value);
    }

    const samples = [
      ["circle.name", circle.name, "访问器读取私有字段"],
      ["circle.radius", circle.radius, "子类自有属性"],
      ["circle.area()", circle.area(), "子类重写方法"],
      ["circle.describe()", circle.describe(), "super.method() 调用父类"],
      ["created.name", created.name, "静态方法创建实例"],
      ["circle instanceof Circle", circle instanceof Circle, "—"],
      ["circle instanceof Shape", circle instanceof Shape, "—"],
      ["getPrototypeOf(Circle) === Shape", Object.getPrototypeOf(Circle) === Shape, "静态成员沿类继承"],
      ["Object.hasOwn(circle, \"area\")", Object.hasOwn(circle, "area"), "方法在原型上"],
      ["Object.hasOwn(circle, \"radius\")", Object.hasOwn(circle, "radius"), "实例字段是自有属性"],
      ['"#name" in circle', "#name" in circle, "私有字段不出现在常规键中"],
      ["counter.count", initialCount, "实例字段初始值"],
      ["counter.increment()", firstCount, "修改实例字段"],
      ["counter.count（调用后）", counter.count, "—"],
    ];

    const body = document.querySelector("#output tbody");
    for (const [label, value, extra] of samples) {
      const row = document.createElement("tr");
      for (const text of [label, show(value), extra]) {
        const cell = document.createElement("td");
        cell.textContent = text;
        row.append(cell);
      }
      body.append(row);
    }

    console.log("circle.name", circle.name);
    console.log("circle.area()", circle.area());
    console.log("circle.describe()", circle.describe());
    console.log("created.name", created.name);
    console.log("counter.increment()", firstCount);
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有十四行。`circle.name` 通过 getter 读到 `圆`；`area()` 返回 `13`，`describe()` 拼接出 `圆 面积 13（圆形）`；静态方法创建的实例名为 `形状`；`instanceof` 对子类和父类都为 `true`；`area` 不在实例自身，`radius` 是自有属性；`#name` 不出现在常规键中；实例字段从 `0` 递增到 `1`。控制台五条输出与表格一致。

| 表达式 | 结果 | 说明 |
|--------|------|------|
| `circle.name` | `"圆"` | 访问器读取私有字段 |
| `circle.radius` | `2` | 子类自有属性 |
| `circle.area()` | `13` | 子类重写方法 |
| `circle.describe()` | `"圆 面积 13（圆形）"` | `super.method()` 调用父类 |
| `created.name` | `"形状"` | 静态方法创建实例 |
| `circle instanceof Circle` | `true` | — |
| `circle instanceof Shape` | `true` | — |
| `getPrototypeOf(Circle) === Shape` | `true` | 静态成员沿类继承 |
| `Object.hasOwn(circle, "area")` | `false` | 方法在原型上 |
| `Object.hasOwn(circle, "radius")` | `true` | 实例字段是自有属性 |
| `"#name" in circle` | `false` | 私有字段不出现在常规键中 |
| `counter.count` | `0` | 实例字段初始值 |
| `counter.increment()` | `1` | 修改实例字段 |
| `counter.count`（调用后） | `1` | — |

### 3. 失败分支

创建 `this-before-super.html`，在子类构造器中先给 `this.y` 赋值，再调用 `super()`。子类实例尚未初始化，Console 显示 `ReferenceError: Must call super constructor in derived class before accessing 'this' or returning from derived constructor`。忘记调用 `super()` 时同样得到这个错误；把 `super()` 放到构造器第一行即可。

创建 `private-access.html`，在类外读取 `shape.#name`。私有字段只在类体内可见，这段代码在解析阶段就被拒绝，Console 显示 `SyntaxError: Private field '#name' must be declared in an enclosing class`。需要对外暴露时，定义 getter 或普通方法。

## 五、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格十四行与控制台五条输出与正文一致；`this-before-super.html` 得到 `ReferenceError: Must call super constructor in derived class before accessing 'this' or returning from derived constructor`，`private-access.html` 得到 `SyntaxError: Private field '#name' must be declared in an enclosing class`。三个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有展开访问器与字段的初始化顺序、`Symbol.species`、装饰器提案和多重继承模拟；私有字段的语法需要目标环境支持。
