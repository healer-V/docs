---
title: "ES 模块与元编程"
category: "前端 · ECMAScript"
tags:
  - ECMAScript
  - ESModule
  - Proxy
  - Reflect
  - Symbol
date: 2026-03-17
excerpt: "深入 ES 模块的导入导出机制、动态 import() 与 import.meta，并系统讲解 Symbol、Proxy、Reflect 三大元编程工具的使用场景与配合方式，助你写出更具扩展性的代码。"
---

# ES 模块与元编程

## 一、ES Module

### 1. 命名导出与默认导出

ES Module 有两种导出方式，可以混合使用，但一个模块只能有一个默认导出。

::: details 导出与导入示例

```js
// src/utils/math.js —— 命名导出
export const PI = 3.14159;

export function add(a, b) {
  return a + b;
}

export function multiply(a, b) {
  return a * b;
}

// 也可以集中导出
const subtract = (a, b) => a - b;
export { subtract };

// 导出时重命名
export { subtract as minus };
```

```js
// src/utils/logger.js —— 默认导出
export default class Logger {
  constructor(prefix) {
    this.prefix = prefix;
  }
  log(msg) {
    console.log(`[${this.prefix}] ${msg}`);
  }
}
```

```js
// src/main.js —— 导入
import Logger from './utils/logger.js';          // 默认导出，名称自定义
import { PI, add, minus } from './utils/math.js'; // 命名导出
import { add as sum } from './utils/math.js';     // 导入时重命名
import * as MathUtils from './utils/math.js';     // 命名空间导入

const logger = new Logger('App');
logger.log(`PI = ${PI}`);
logger.log(`1 + 2 = ${add(1, 2)}`);
logger.log(`MathUtils.PI = ${MathUtils.PI}`);
```
:::

### 2. 动态 import()

`import()` 返回 Promise，实现按需加载模块，是代码分割（Code Splitting）的核心机制。

::: details 动态 import() 示例

```js{7,18}
// src/router.js —— 路由级别懒加载
const routes = [
  {
    path: '/dashboard',
    // 点击路由时才加载模块
    component: () => import('./pages/Dashboard.js'),
  },
  {
    path: '/settings',
    component: () => import('./pages/Settings.js'),
  },
];

// 条件加载：根据用户权限决定加载哪个模块
async function loadAdminModule(user) {
  if (user.role === 'admin') {
    const { AdminPanel } = await import('./modules/AdminPanel.js');
    return new AdminPanel(user);
  }
  const { UserPanel } = await import('./modules/UserPanel.js');
  return new UserPanel(user);
}

// 并行动态导入
async function loadPlugins(pluginNames) {
  const modules = await Promise.all(
    pluginNames.map((name) => import(`./plugins/${name}.js`))
  );
  return modules.map((m) => m.default);
}
```
:::

### 3. import.meta

`import.meta` 是当前模块的元信息对象，常用属性因运行环境而异。

::: details import.meta 示例

```js
// 浏览器环境
console.log(import.meta.url); // 'https://example.com/src/main.js'

// 获取当前模块所在目录（浏览器）
const currentDir = new URL('.', import.meta.url).href;

// Node.js 环境（ESM）
console.log(import.meta.url);      // 'file:///project/src/main.mjs'
console.log(import.meta.filename); // '/project/src/main.mjs'（Node 21.2+）
console.log(import.meta.dirname);  // '/project/src'（Node 21.2+）

// Vite 项目中的环境变量
console.log(import.meta.env.MODE);      // 'development' 或 'production'
console.log(import.meta.env.VITE_API_URL);

// 热模块替换（Vite/webpack）
if (import.meta.hot) {
  import.meta.hot.accept('./module.js', (newModule) => {
    // 模块更新时的处理逻辑
  });
}
```
:::

### 4. CommonJS vs ESM 对比

| 对比项 | CommonJS（CJS） | ES Module（ESM） |
|--------|----------------|-----------------|
| 语法 | `require()` / `module.exports` | `import` / `export` |
| 加载时机 | 运行时动态加载 | 编译时静态分析 |
| 加载方式 | 同步 | 异步 |
| 导出内容 | 值的拷贝 | 值的实时绑定（live binding） |
| 循环依赖 | 部分支持，可能获取未完成的导出 | 支持，但需注意初始化顺序 |
| Tree Shaking | 不支持 | 支持（静态结构可分析） |
| 顶层 `this` | `module.exports` | `undefined` |
| 文件扩展名 | `.js`（Node 默认） | `.mjs` 或配置 `"type":"module"` |
| 适用场景 | Node.js 旧项目 | 现代前端项目、新 Node.js 项目 |

::: tip 实时绑定（live binding）
ESM 导出的是变量的实时引用，而非值的拷贝。导出模块修改变量后，导入方能实时看到最新值。这与 CJS 的拷贝语义不同。
:::

---

## 二、Symbol

### 1. 基本使用与内置 Symbol

`Symbol` 创建唯一标识符，即使描述相同，两个 Symbol 也不相等。内置 Symbol 用于自定义对象行为。

::: details Symbol 基本示例

```js{5}
const s1 = Symbol('描述');
const s2 = Symbol('描述');
console.log(s1 === s2); // false（每次创建都是唯一值）

// 全局 Symbol 注册表（Symbol.for 相同 key 返回同一个）
const gs1 = Symbol.for('global-key');
const gs2 = Symbol.for('global-key');
console.log(gs1 === gs2); // true

// 作为对象属性键，避免属性名冲突
const ID = Symbol('id');
const user = {
  [ID]: 12345,
  name: '张三',
};
console.log(user[ID]);         // 12345
console.log(Object.keys(user)); // ['name']（Symbol 不在 keys 中）
console.log(Object.getOwnPropertySymbols(user)); // [Symbol(id)]
```
:::

### 2. Symbol.iterator 实现可迭代

实现 `Symbol.iterator` 方法，使自定义对象可以被 `for...of`、展开运算符等迭代。

::: details 自定义可迭代对象

```js{4}
class Range {
  constructor(start, end, step = 1) {
    this.start = start;
    this.end = end;
    this.step = step;
  }

  [Symbol.iterator]() {
    let current = this.start;
    const { end, step } = this;
    return {
      next() {
        if (current <= end) {
          const value = current;
          current += step;
          return { value, done: false };
        }
        return { value: undefined, done: true };
      },
    };
  }
}

const range = new Range(1, 10, 2);

// 支持 for...of
for (const n of range) {
  process.stdout.write(n + ' '); // 1 3 5 7 9
}

// 支持展开运算符
console.log([...new Range(1, 5)]); // [1, 2, 3, 4, 5]

// 支持解构赋值
const [first, second, ...rest] = new Range(10, 50, 10);
console.log(first, second, rest); // 10 20 [30, 40, 50]
```
:::

### 3. Symbol.toPrimitive

控制对象在参与类型转换（数字运算、字符串拼接、比较）时的行为。

::: details Symbol.toPrimitive 示例

```js{3}
class Money {
  constructor(amount, currency) {
    this.amount = amount;
    this.currency = currency;
  }

  [Symbol.toPrimitive](hint) {
    switch (hint) {
      case 'number': return this.amount;          // 数字转换
      case 'string': return `${this.amount} ${this.currency}`; // 字符串转换
      default:       return this.amount;          // 默认（如比较时）
    }
  }
}

const price = new Money(99.9, 'CNY');

console.log(+price);         // 99.9（数字转换）
console.log(`价格: ${price}`); // '价格: 99.9 CNY'（字符串转换）
console.log(price > 50);     // true（默认转换）
console.log(price + 0.1);    // 100（默认转换后加法）
```
:::

---

## 三、Proxy

### 1. 基本概念与常用 Trap

`Proxy` 拦截对象的基本操作，允许你自定义读取、写入、删除等行为。

| Trap | 拦截的操作 | 示例场景 |
|------|-----------|----------|
| `get(target, prop, receiver)` | 属性读取 | 默认值、只读属性 |
| `set(target, prop, value, receiver)` | 属性写入 | 数据校验、响应式 |
| `has(target, prop)` | `in` 运算符 | 隐藏私有属性 |
| `deleteProperty(target, prop)` | `delete` 操作 | 保护属性不被删除 |
| `apply(target, thisArg, args)` | 函数调用 | 函数拦截、日志 |
| `construct(target, args)` | `new` 操作符 | 单例模式、参数校验 |

::: details Proxy 常用 Trap 示例

```js
// get trap：属性不存在时返回默认值
const withDefaults = (target, defaults) =>
  new Proxy(target, {
    get(obj, prop) {
      return prop in obj ? obj[prop] : defaults[prop];
    },
  });

const config = withDefaults({ theme: 'dark' }, { lang: 'zh', fontSize: 14 });
console.log(config.theme);    // 'dark'（来自原对象）
console.log(config.lang);     // 'zh'（来自默认值）
console.log(config.fontSize); // 14（来自默认值）
```

```js{8,13}
// set trap：数据类型校验
function createTypedObject(schema) {
  return new Proxy({}, {
    set(target, prop, value) {
      if (!(prop in schema)) throw new Error(`不允许的属性: ${prop}`);
      const expectedType = schema[prop];
      if (typeof value !== expectedType) {
        throw new TypeError(`${prop} 必须是 ${expectedType} 类型`);
      }
      target[prop] = value;
      return true; // set trap 必须返回 true 表示成功
    },
  });
}

const user = createTypedObject({ name: 'string', age: 'number' });
user.name = '张三';   // OK
user.age  = 28;       // OK
// user.age = '28';   // TypeError: age 必须是 number 类型
// user.email = '..'; // Error: 不允许的属性: email
```
:::

### 2. apply Trap：函数调用拦截

::: details apply trap 示例

```js{5}
function multiply(a, b) {
  return a * b;
}

const loggedMultiply = new Proxy(multiply, {
  apply(target, thisArg, args) {
    console.log(`调用 multiply，参数: [${args.join(', ')}]`);
    const result = Reflect.apply(target, thisArg, args);
    console.log(`返回值: ${result}`);
    return result;
  },
});

loggedMultiply(3, 7);
// 调用 multiply，参数: [3, 7]
// 返回值: 21
```
:::

### 3. 实际使用场景

::: details 响应式数据代理（Vue 3 响应式原理简化版）

```js
// 简化版响应式实现
function reactive(obj) {
  const handlers = new Map(); // 存储属性对应的副作用函数

  return new Proxy(obj, {
    get(target, prop, receiver) {
      track(handlers, prop); // 收集依赖
      const value = Reflect.get(target, prop, receiver);
      // 嵌套对象也代理
      return typeof value === 'object' && value !== null
        ? reactive(value)
        : value;
    },
    set(target, prop, value, receiver) {
      const result = Reflect.set(target, prop, value, receiver);
      trigger(handlers, prop); // 触发更新
      return result;
    },
  });
}

function track(handlers, prop) {
  // 收集当前正在执行的副作用函数（实际实现需要全局活动副作用栈）
}

function trigger(handlers, prop) {
  // 执行所有与 prop 关联的副作用函数
}
```
:::

---

## 四、Reflect

### 1. Reflect 与 Proxy 配合

`Reflect` 提供与 Proxy trap 一一对应的静态方法，在 trap 中调用 `Reflect` 方法来执行默认行为，同时加入自定义逻辑。

::: tip 为什么要用 Reflect 而不是直接操作 target
直接写 `target[prop]` 在某些情况下会丢失 `receiver`（代理对象本身），导致继承链上的 getter/setter 行为异常。使用 `Reflect.get(target, prop, receiver)` 可以正确传递接收者。
:::

::: details Reflect 与 Proxy 配合示例

```js{10,16}
const handler = {
  get(target, prop, receiver) {
    console.log(`读取属性: ${prop}`);
    // 使用 Reflect 保留默认行为，并正确传递 receiver
    return Reflect.get(target, prop, receiver);
  },
  set(target, prop, value, receiver) {
    console.log(`设置属性: ${prop} = ${value}`);
    return Reflect.set(target, prop, value, receiver);
  },
  deleteProperty(target, prop) {
    if (prop.startsWith('_')) {
      throw new Error(`不允许删除私有属性: ${prop}`);
    }
    return Reflect.deleteProperty(target, prop);
  },
};

const obj = new Proxy({ name: '张三', _secret: '私密数据' }, handler);
obj.name = '李四';         // 设置属性: name = 李四
console.log(obj.name);    // 读取属性: name → '李四'
delete obj.name;           // OK
// delete obj._secret;     // Error: 不允许删除私有属性
```
:::

### 2. Reflect vs Object 方法对比

`Reflect` 将 `Object` 的部分命令式操作改为函数式，行为更一致、返回值更可预期。

| 操作 | Object 方式 | Reflect 方式 | 区别 |
|------|-------------|--------------|------|
| 定义属性 | `Object.defineProperty(obj, k, desc)` | `Reflect.defineProperty(obj, k, desc)` | Object 失败时抛异常；Reflect 返回 `boolean` |
| 删除属性 | `delete obj[key]` | `Reflect.deleteProperty(obj, key)` | 运算符 vs 函数，Reflect 返回 `boolean` |
| 检查属性 | `key in obj` | `Reflect.has(obj, key)` | 运算符 vs 函数 |
| 获取属性 | `obj[key]` | `Reflect.get(obj, key, receiver)` | Reflect 可传 receiver |
| 设置属性 | `obj[key] = val` | `Reflect.set(obj, key, val, receiver)` | Reflect 返回 `boolean` |
| 获取原型 | `Object.getPrototypeOf(obj)` | `Reflect.getPrototypeOf(obj)` | 基本相同 |
| 调用函数 | `fn.apply(ctx, args)` | `Reflect.apply(fn, ctx, args)` | 更安全，fn 被篡改时不受影响 |
| new 操作 | `new Fn(...args)` | `Reflect.construct(Fn, args)` | 支持指定 `new.target` |

::: details Reflect 错误处理优势示例

```js{5,12}
const obj = Object.freeze({ x: 1 });

// Object.defineProperty 在严格模式下失败时抛出异常
try {
  Object.defineProperty(obj, 'y', { value: 2 });
} catch (e) {
  console.error('定义失败:', e.message);
}

// Reflect.defineProperty 失败时返回 false，不抛异常
const success = Reflect.defineProperty(obj, 'y', { value: 2 });
console.log('是否成功:', success); // false（更适合在逻辑中判断）
```
:::
