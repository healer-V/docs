# ES6 核心特性

## ES6 新增特性汇总
:::warning 特性汇总
1. 变量声明`let/const`
2. 模板字符串
3. 箭头函数
4. 默认参数
5. 异步函数
6. 扩展运算符
7. 解构赋值
8. 类
9. 模块
10. 迭代器
11. 生成器
12. `Promise`
13. `Symbol`
14. `Set` 和 `Map`新容器
:::


## 一、`let` 和 `const`

### 1.1 `let` 命令
>[!tip] 特点
>1. 不存在变量提升
>2. 暂时性死区(TDZ)  
>3. 不允许重复声明
>4. 块级作用域
>5. 声明时可以不初始化赋值。



#### 基本用法

::: details 点击查看示例用法
```javascript
//  不存在变量提升
console.log(foo); // undefined
var foo = 2;

console.log(bar); // ReferenceError
let bar = 2;

// 暂时性死区(TDZ)
if (true) {
  console.log(baz); // ReferenceError
  let baz = 2;
}

// 不允许重复声明
let foo = 1;
let foo = 2; // SyntaxError: Identifier 'foo' has already been declared

// 块级作用域与函数声明
// ES6 环境
function f() { console.log('I am outside!'); }

(function () {
  if (false) {
    // 重复声明一次函数f
    function f() { console.log('I am inside!'); }
  }
  f();
}());
// Uncaught TypeError: f is not a function
```
:::

### 1.2 `const` 命令
> [!tip] 特点
> 1. 不允许修改值
> 2. 块级作用域
> 3. 不允许重复声明
> 4. 声明时必须初始化

#### 基本用法

::: details 点击查看示例用法
```javascript
// 不允许修改值
const PI = 3.1415;
PI = 3; // TypeError: Assignment to constant variable

const foo = {};
// 为 foo 添加一个属性，可以成功
foo.prop = 123;

// 将 foo 指向另一个对象，就会报错
foo = {}; // TypeError: "foo" is read-only

// 块级作用域
if (true) {
  const x = 1;
}
console.log(x); // ReferenceError: x is not defined

// 声明时必须初始化
const foo; // SyntaxError: Missing initializer in const declaration

```

:::

### 1.3 顶层对象
>[!tip]
> ES6 引入了顶层对象的概念，在代码的任何位置都可以访问的变量和函数。
> 顶层对象的属性和方法可以在代码的任何位置使用
> 浏览器环境中的顶层对象是 `window`，Node.js 环境中的顶层对象是 `global`。

#### `window` 对象
> [!tip]
> 浏览器环境中的顶层对象是 `window`，它是一个全局对象，代表了浏览器窗口或标签页。

::: warning 特点。
1. 全局变量自动成为 `window` 的属性。
2. 全局函数自动成为 `window` 的方法。
3. `let/const` 声明不绑定到 `window`。
4. `window` 对象提供了操作浏览器窗口的方法和属性。
5. `window` 对象是访问文档（document）和操作 `DOM` 的入口。
6. 提供客户端存储机制。
7. 控制浏览器的导航行为。
8. 包含各种浏览器原生 API。
9. 全局作用域中的 `this` 指向顶层对象。
:::


#### `globalThis` 对象
> [!tip] 定义
> ES2020（ES11）引入的标准顶层对象，旨在统一不同 JavaScript 环境（`浏览器、Node.js、Web Worker` 等）中全局对象的访问方式
```javascript
// 方法一
(typeof window !== 'undefined'
   ? window
   : (typeof process === 'object' &&
      typeof require === 'function' &&
      typeof global === 'object')
     ? global
     : this);

// 方法二
var getGlobal = function () {
  if (typeof self !== 'undefined') { return self; }
  if (typeof window !== 'undefined') { return window; }
  if (typeof global !== 'undefined') { return global; }
  throw new Error('unable to locate global object');
};
```

## 二、模板字符串

::: tip 概念
模板字符串是ES6新增的字符串语法，使用`反引号`(`)标识。
:::

::: danger 特点
1. 支持多行字符串
2. 支持字符串`插值`(嵌入表达式)
3. 支持标签模板功能
:::

:::details 模板字符串使用示例

```javascript
let name = "Bob";
let time = "today";
// 模板字符串
console.log(`Hello ${name}, how are you ${time}?`);


// 多行字符串
console.log(`string text line 1
string text line 2`);

// 标签模板 
let a = 5;
let b = 10;

function tag(strings, ...values) {
  console.log(strings[0]); // "Hello "
  console.log(strings[1]); // " world "
  console.log(values[0]);  // 15
  console.log(values[1]);  // 50

  return "Bazinga!";
}

tag`Hello ${ a + b } world ${ a * b }`;
// "Bazinga!"

```
:::

## 三、箭头函数

::: tip 概念
箭头函数是ES6中引入的一种更简洁的`函数`语法。
:::

::: danger 特点
1. 使用`=>`符号定义。
2. 没有自己的 `this、arguments、super` 或 `new.target`。
3. 不能用作构造函数。
4. 适合非方法函数和使用this的场景。
:::

::: warning 注意事项
1. 箭头函数没有自己的`this、arguments、super`或`new.target`。
2. 箭头函数没有`prototype`属性。
3. 箭头函数不能用作构造函数。
4. 箭头函数不能使用`new`命令。
5. 箭头函数不可以使用`yield`命令。
6. 箭头函数不能使用`arguments`对象，该对象在非严格模式下可读，但在严格模式下不可读。
:::


::: details 箭头函数使用示例
```javascript
/**** 传统函数 与 箭头函数 对比 ***/
// 传统函数
function add(x, y) {
  return x + y;
}
// 箭头函数
let add = (x, y) => x + y;

// 箭头函数可以隐式返回
let f = () => 1;

// 箭头函数可以访问外部变量
let a = 1;
let f = () => a;
console.log(f()); // 1

// 箭头函数可以作为回调函数
setTimeout(() => console.log('Hello, world!'), 1000);

// 箭头函数可以与数组方法结合使用
let numbers = [1, 2, 3];
numbers.map(x => x * 2); // [2, 4, 6]

// this指向 没有自己的this
function Person() {
  this.age = 0;

  setInterval(() => {
    this.age++; // this正确地指向person对象
  }, 1000);
}

var p = new Person();

```
:::




## 四、默认参数

>[!tip]
> 允许在函数定义时为参数指定默认值。
> 当函数调用时未提供该参数或参数值为 undefined 时，会使用默认值。

::: warning 注意事项
1. 默认参数必须是`常量表达式`，不能引用其他变量或函数。
2. 默认参数通常放在参数列表末尾，避免混淆。
3. 默认参数只在函数定义时执行一次，而不是每次调用时执行。
4. 默认参数可以与解构赋值结合使用。
:::

::: danger 特点
1. 简化函数调用。
2. 提高代码可读性。
3. 可以与解构赋值结合使用。
:::

**默认参数示例**
```javascript
function multiply(a, b = 1) {
  return a * b;
}

multiply(5); // 5
```


## 五、解构赋值
>[!tip] 概念
> 允许从数组或对象中提取值，并赋值给变量，无需逐个访问元素。
> 解构赋值可以与默认参数结合使用。

::: warning 注意事项
1. 解构需要右侧有可解构的值
2. 当解构的值为 undefined 时，使用默认值
3. 变量名必须与对象属性名一致。
4. 剩余参数必须在最后。  
:::

::: details 解构赋值示例
```javascript
// 基本语法
const [a, b] = [1, 2];
console.log(a); // 1
console.log(b); // 2

// 跳过元素
const [, , c] = [1, 2, 3];
console.log(c); // 3

// 剩余参数
const [d, ...rest] = [1, 2, 3, 4];
console.log(rest); // [2, 3, 4]

// 默认值
const [e = 10, f = 20] = [5];
console.log(e); // 5
console.log(f); // 20（未提供时使用默认值）

// 解构赋值与默认参数结合使用
function funcName([a, b] = [1, 2], {c, d} = {c: 3, d: 4}) {
  // 函数体
}
```
:::

## 六、扩展运算符

::: tip 概念
`扩展运算符(...)`可以将一个`可迭代对象`展开为多个元素，主要用途:
1. 函数调用时展开数组`作为参数`。
2. 数组字面量中展开另一个`数组`。
3. 对象字面量中展开另一个`对象`。
4. 替代`apply`方法。
5. `复制`数组或对象（`浅拷贝`）。
6. `合并`多个数组或对象。
:::

::: details 扩展运算符示例
```javascript
// 数组展开
let parts = ['shoulders', 'knees'];
let lyrics = ['head', ...parts, 'and', 'toes'];
// ['head', 'shoulders', 'knees', 'and', 'toes']


//  函数调用
function f(x, y, z) { }
let args = [0, 1, 2];
f(...args);


//  对象展开
let obj1 = { foo: 'bar', x: 42 };
let obj2 = { foo: 'baz', y: 13 };

// 浅拷贝
let clonedObj = { ...obj1 };
// { foo: "bar", x: 42 }

// 合并对象
let mergedObj = { ...obj1, ...obj2 };
// { foo: "baz", x: 42, y: 13 }


```
:::

## 七、类`class`

::: tip 概念
ES6的`类（Class）`语法提供了更接近传统面向对象语言的写法，本质上是`基于原型的语法糖`。
:::

::: warning 特点
1. 使用`class`关键字定义类。
2. 使用`constructor`定义构造函数。
3. 支持`extends`实现继承。
4. 支持`static`定义静态方法。
5. 方法之间不需要逗号分隔。
:::

::: details 类示例

```javascript
// 类的基础语法
class Rectangle {
  constructor(height, width) {
    this.height = height;
    this.width = width;
  }
  
  get area() {
    return this.calcArea();
  }
  
  calcArea() {
    return this.height * this.width;
  }
}

const square = new Rectangle(10, 10);
console.log(square.area); // 100


// 类的继承
class Animal { 
  constructor(name) {
    this.name = name;
  }
  
  speak() {
    console.log(`${this.name} makes a noise.`);
  }
}

class Dog extends Animal {
  constructor(name) {
    super(name);
  }

  speak() {
    console.log(`${this.name} barks.`);
  }
}

let d = new Dog('Mitzie');
d.speak(); // Mitzie barks.


// 静态方法
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  static distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }
}

const p1 = new Point(5, 5);
const p2 = new Point(10, 10);
console.log(Point.distance(p1, p2)); // 7.0710678118654755
```
:::


## 八、模块

::: tip 概念
模块是JavaScript代码的基本单位，用于实现代码的封装、重用和管理。
:::

::: warning 特点
1. 使用`export`导出模块接口。
2. 使用`import`导入其他模块。
3. 模块自动采用严格模式。
4. 模块顶层的 this 指向 undefined。
5. 支持`静态分析`和 `tree shaking`。
:::


::: details 模块示例
```javascript
// 1. 导出

// lib.js
export const sqrt = Math.sqrt;
export function square(x) {
  return x * x;
}
export function diag(x, y) {
  return sqrt(square(x) + square(y));
}

// 或者统一导出
export { sqrt, square, diag };


// 2. 导入

// main.js
import { square, diag } from './lib';
console.log(square(11)); // 121
console.log(diag(4, 3)); // 5

// 或者导入全部
import * as lib from './lib';
console.log(lib.square(11)); // 121


// 3. 默认导出

// myFunc.js
export default function() { 
  console.log('hello!');
}

// main.js
import myFunc from './myFunc';
myFunc(); // hello!
```
:::


## 九、迭代器

::: tip 定义
- 迭代器是一个对象，它定义一个序列，并在终止时可能附带一个返回值。
- 迭代器通过使用 next() 方法实现了迭代器协议的任何一个对象，该方法返回具有两个属性的对象。
  - value: 迭代序列的下一个值（返回值）。
  - done: 布尔值，表示是否迭代到序列中的最后一个值。
- 迭代器还会保存一个内部指针，用来指向当前集合中值的位置，每调用一次next()方法，都会返回下一个可用的值。
:::

::: warning 特点
1. 实现了`Symbol.iterator`属性，可以被`for...of`循环遍历。
2. 迭代器对象可以被`next()`方法调用，返回一个包含value和done两个属性的对象。
3. 迭代器对象可以被`return()`方法调用，终止迭代。
4. 迭代器对象可以被`throw()`方法调用，抛出错误。  
:::

[迭代器 MDN链接](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Iterators_and_generators)
::: details 迭代器示例
```javascript

function makeRangeIterator(start = 0, end = Infinity, step = 1) {
  let nextIndex = start;
  let iterationCount = 0;

  const rangeIterator = {
    next() {
      let result;
      if (nextIndex < end) {
        result = { value: nextIndex, done: false };
        nextIndex += step;
        iterationCount++;
        return result;
      }
      return { value: iterationCount, done: true };
    },
  };
  return rangeIterator;
}


// 使用迭代器 
let it = makeRangeIterator(1, 10, 2);

let result = it.next();
while (!result.done) {
  console.log(result.value); // 1 3 5 7 9
  result = it.next();
}

console.log(`已迭代序列的大小：${result.value}`); // 5
```
:::

### 9.1 可迭代协议
::: tip 定义
1. `迭代器协议`规定对象（包括`数组、Map、Set、字符串`等）是否可以被`for...of`循环遍历。
2. 只能迭代一次的可迭代对象通常从它们的 `[Symbol.iterator]()` 方法中返回 `this`，
3. 可以多次迭代的方法必须在每次调用 `[Symbol.iterator]()` 时返回一个新的迭代器。
:::


::: details 可迭代协议示例
```javascript
let iterable = {
  [Symbol.iterator]() {
    let step = 0;
    let iterator = {
      next() {
        step++;
        if (step === 1) {
          return { value: 'hello', done: false};
        } else if (step === 2) {
          return { value: 'world', done: false};
        }
        return { value: undefined, done: true };
      }
    };
    return iterator;
  }
};

for (let x of iterable) {
  console.log(x);
}
// hello
// world
```
:::


## 十、生成器

::: tip 定义
生成器是一种特殊的函数，可以暂停执行和恢复执行，
:::

::: warning 特点
1. 使用`function*`定义
2. 使用yield暂停执行并返回值
3. 返回一个迭代器对象
4. 适合实现异步操作和惰性求值
:::

::: details 斐波那契数列生成器示例
```javascript
function* fibonacci() {
  let current = 0;
  let next = 1;
  while (true) {
    const reset = yield current;
    [current, next] = [next, next + current];
    if (reset) {
      current = 0;
      next = 1;
    }
  }
}

const sequence = fibonacci();
console.log(sequence.next().value); // 0
console.log(sequence.next().value); // 1
console.log(sequence.next().value); // 1
console.log(sequence.next().value); // 2
console.log(sequence.next().value); // 3
console.log(sequence.next().value); // 5
console.log(sequence.next().value); // 8
console.log(sequence.next(true).value); // 0
console.log(sequence.next().value); // 1
console.log(sequence.next().value); // 1
console.log(sequence.next().value); // 2
```

:::
### 10.1 基本语法
```javascript
function* generator() {
  yield 1;
  yield 2;
  yield 3;
}

const gen = generator();
console.log(gen.next().value); // 1
console.log(gen.next().value); // 2
console.log(gen.next().value); // 3
```

### 10.2 生成器与迭代器
```javascript
function* makeRangeIterator(start = 0, end = Infinity, step = 1) {
  for (let i = start; i < end; i += step) {
    yield i;
  }
}

let it = makeRangeIterator(1, 10, 2);
let result = it.next();
while (!result.done) {
 console.log(result.value); // 1, 3, 5, 7, 9
 result = it.next();
}
```

### 10.3 yield*
>[!tip]
> `yield*` 用于在生成器函数中迭代另一个生成器函数。
> 
> 注意：`yield*` 语句只能在生成器函数中使用，不能在普通函数中使用。
```javascript
function* generator1() {
  yield 1;
  yield 2;
}

function* generator2() {
  yield* generator1();
  yield 3;
  yield 4;
}

const iterator = generator2();
console.log(iterator.next()); // {value: 1, done: false}
console.log(iterator.next()); // {value: 2, done: false}
console.log(iterator.next()); // {value: 3, done: false}
console.log(iterator.next()); // {value: 4, done: false}
```

## 十一、Promise

::: tip 定义
- Promise 是一个代表异步操作最终完成（或失败）及其结果值的对象。
- 是异步编程的一种解决方案
:::
::: warning 特点

1. 代表一个异步操作的最终完成或失败
2. 有三种状态: pending, fulfilled, rejected
3. 状态一旦改变就不会再变
4. 支持链式调用
5. 解决了回调地狱问题
:::

### 11.2 基本用法
```javascript
const promise = new Promise((resolve, reject) => {
  if (success) {
    resolve(value);
  } else {
    reject(error);
  }
});

promise.then(
  value => { /* 成功处理 */ },
  error => { /* 错误处理 */ }
);
```
uu



## 十二、Symbol
::: tip 定义
- Symbol是ES6新增的基本数据类型
- `Symbol()` 函数会返回`symbol`类型的值，该类型具有静态属性和静态方法。
:::

::: warning 特点
1. 表示独一无二的值
2. 通过`Symbol()`函数创建
3. 可以用作对象属性的键
4. 内置`Symbol`值用于实现语言内部行为
5. 不支持`new`操作符
:::

::: tip 语法
- `Symbol([description])`
- description 为可选参数，字符串类型，用于描述 Symbol 的用途。
:::

::: details Symbol 使用示例
```javascript
// 创建 Symbol
let s1 = Symbol();
let s2 = Symbol('foo');
let s3 = Symbol('foo');

console.log(s2 === s3); // false

// 作为属性名
let obj = {
  [s1]: 'Hello!'
};

// 定义常量
const COLOR_RED = Symbol();
const COLOR_GREEN = Symbol();

// 内置 Symbol 值
class MyClass {
  [Symbol.hasInstance](foo) {
    return foo instanceof Array;
  }
}

// 消除魔术字符串
const shapeType = {
  triangle: Symbol(),
  circle: Symbol()
};
```
:::

::: warning 注意事项
1. Symbol 值不能使用 `new` 命令
2. Symbol 作为属性名时不能使用点运算符
3. Symbol 作为属性名时不会被常规方法遍历到
4. 可以使用 `Object.getOwnPropertySymbols()` 获取 Symbol 属性
5. `Symbol.for()` 可以创建全局共享的 Symbol
:::

::: tip 内置 Symbol 值
1. `Symbol.iterator`: 为对象定义默认的迭代器
2. `Symbol.hasInstance`: 改变instanceof的行为
3. `Symbol.toStringTag`: 自定义对象的toString标签
4. `Symbol.species`: 创建派生对象时使用的构造函数
5. `Symbol.match`: 自定义字符串匹配行为
:::


### 12.1 静态属性
::: tip 定义
- `Symbol.species` 是一个静态属性，它返回一个构造函数，用来创建派生对象。
- 该属性在创建派生对象时会被调用。
:::
**使用示例**
::: details Symbol.species 静态属性用示例
```javascript
class MySet extends Set {
  static get [Symbol.species]() {
    return MySet;
  }
}

let set1 = new MySet([1, 2, 3]);
let set2 = set1.map(x => x * 2);

console.log(set2 instanceof MySet); // true
console.log(set2 instanceof Set); // true
```
:::

### 12.2 静态方法
::: tip 定义
- 如果 Symbol 已存在，则返回该 Symbol。
- 如果 Symbol 不存在，则会新建一个 Symbol，并将其注册到全局 Symbol 注册表中。
:::

**使用示例**
::: details Symbol.for 静态方法用示例
```javascript
let s1 = Symbol.for('foo');
let s2 = Symbol.for('foo');

console.log(s1 === s2); // true
```
:::

## 十三、Set和Map


### 13.1 Set 集合
>[!tip] 定义
> `Set` 是一种`无序`且`唯一`的数据集合，集合中的元素不会重复。

>[!tip] 特点
>1. **元素唯一性**：Set 里不会有重复的元素，重复添加相同元素时会被忽略。
>2. **无序性**：Set 中的元素没有特定的顺序，无法通过索引来访问元素,`Set的遍历顺序就是插入顺序`。
>3. **任意类型元素**：Set 可以存储任何类型的数据，像原始值、对象、函数等都可以。
>4. **迭代支持**：Set 支持 for...of 循环以及 forEach 方法进行遍历。


#### 13.1.1 实例属性
>[!tip]
> - `Set.prototype.constructor` 返回构造函数，即 `Set`函数。

#### 13.1.2 实例方法
>[!tip] 操作方法
> - `Set.prototype.add(value)`: 向 Set 实例添加一个元素，返回 Set 实例。
> - `Set.prototype.delete(value)`: 从 Set 实例中删除一个元素，返回一个布尔值。
> - `Set.prototype.has(value)`: 返回一个布尔值，表示该值是否为 Set 实例的元素。
> - `Set.prototype.clear()`: 清空 Set 实例，返回 undefined。

**操作方法示例**
::: details 点击查看操作方法
```javascript
let mySet = new Set();

mySet.add(1); // Set [ 1 ]
mySet.add(5); // Set [ 1, 5 ]
mySet.add(5); // Set [ 1, 5 ] (重复值被忽略)

console.log(mySet.has(1)); // true
console.log(mySet.size); // 2

mySet.delete(5); // true
console.log(mySet.has(5)); // false

mySet.clear(); // undefined
console.log(mySet.size); // 0

```

:::

>[!tip] 遍历方法
> - `Set.prototype.keys()`：返回`键名`的遍历器
> - `Set.prototype.values()`：返回`键值`的遍历器
> - `Set.prototype.entries()`：返回`键值对`的遍历器
> - `Set.prototype.forEach()`：使用回调函数`遍历每个成员`

**遍历方法示例**
::: details 点击查看遍历方法
```javascript
let mySet = new Set([1, 2, 3, 4, 5]);

// 遍历键名
for (let key of mySet.keys()) {
  console.log(key);
}
// 1
// 2
// 3
// 4
// 5

// 遍历键值
for (let value of mySet.values()) {
  console.log(value);
}
// 1
// 2
// 3
// 4
// 5

// 遍历键值对
for (let [key, value] of mySet.entries()) {
  console.log(key, value);
}
// 1 1
// 2 2
// 3 3
// 4 4
// 5 5

// forEach方法
mySet.forEach(value => console.log(value));
// 1
// 2
// 3
// 4
// 5
```
:::
#### 13.1.3 集合运算
>[!tip]ES2025 添加集合运算方法。
>- `Set.prototype.intersection(other)`：交集
>- `Set.prototype.union(other)`：并集
>- `Set.prototype.difference(other)`：差集
>- `Set.prototype.symmetricDifference(other)`：对称差集
>- `Set.prototype.isSubsetOf(other)`：判断是否为子集
>- `Set.prototype.isSupersetOf(other)`：判断是否为超集
>- `Set.prototype.isDisjointFrom(other)`：判断是否不相交

### 13.3 Map 字典
>[!tip]  定义
> `Map`是一种`键值对`的集合，其中的键和值都可以是任意类型，并且键具有唯一性
> `Map`的迭代顺序与添加顺序一致。

>[!tip] 特点
>1. **键值对唯一性**：Map 里不会有重复的键值对，重复添加相同键值对时会被忽略。
>2. **键唯一性**：Map 中的键必须是唯一的，重复添加相同键时会被忽略。
>3. **任意类型键值对**：Map 可以存储任意类型的数据，键可以是原始值、对象、函数等。
>4. **迭代支持**：Map 支持 for...of 循环以及 forEach 方法进行遍历。

#### 13.3.1 实例属性
>[!tip]
> - `Map.prototype.constructor` 返回构造函数，即 `Map`函数。

#### 13.3.2 实例方法
>[!tip] 操作方法
> - `Map.prototype.set(key, value)`: 设置 Map 实例的键值对，返回 Map 实例。
> - `Map.prototype.get(key)`: 获取 Map 实例的指定键对应的值，返回对应的值。
> - `Map.prototype.has(key)`: 返回一个布尔值，表示 Map 实例是否包含指定的键。
> - `Map.prototype.delete(key)`: 从 Map 实例中删除指定键，返回一个布尔值。
> - `Map.prototype.clear()`: 清空 Map 实例，返回 undefined。

**操作方法示例**
::: details 点击查看操作方法
```javascript
let myMap = new Map();

let keyObj = {};
let keyFunc = function() {};

// 添加键值对
myMap.set(keyObj, "value associated with keyObj");
myMap.set(keyFunc, "value associated with keyFunc");

console.log(myMap.get(keyObj)); // "value associated with keyObj"
console.log(myMap.get(keyFunc)); // "value associated with keyFunc"

// 删除键值对
myMap.delete(keyObj);
console.log(myMap.has(keyObj)); // false

// 清空 Map 实例
myMap.clear();
console.log(myMap.size); // 0
```
:::

>[!tip] 遍历方法
> - `Map.prototype.keys()`：返回`键名`的遍历器
> - `Map.prototype.values()`：返回`键值`的遍历器
> - `Map.prototype.entries()`：返回`键值对`的遍历器
> - `Map.prototype.forEach()`：使用回调函数`遍历每个成员`

**遍历方法示例**
::: details 点击查看遍历方法
```javascript
let myMap = new Map([
  [1, 'a'],
  [2, 'b'],
  [3, 'c']
]);

// 遍历键名
for (let key of myMap.keys()) {
  console.log(key);
}
// 1
// 2
// 3

// 遍历键值
for (let value of myMap.values()) {
  console.log(value);
}
// "a"
// "b"
// "c"

// 遍历键值对
for (let [key, value] of myMap.entries()) {
  console.log(key, value);
}
// 1 "a" 
// 2 "b" 
// 3 "c" 

// forEach方法
myMap.forEach((value, key) => console.log(key, value));
// 1 "a" 
// 2 "b" 
// 3 "c" 
```
:::

#### 13.3.3 集合运算
>[!tip]ES2025 添加集合运算方法。
>- `Map.prototype.keys()`：返回键名的遍历器
>- `Map.prototype.values()`：返回键值的遍历器
>- `Map.prototype.entries()`：返回键值对的遍历器
>- `Map.prototype.forEach()`：使用回调函数遍历每个成员
>- `Map.prototype.has(key)`：判断是否存在指定键
>- `Map.prototype.get(key)`：获取指定键对应的值



**示例**
::: details 点击查看示例
```javascript
let myMap = new Map();

let keyObj = {};
let keyFunc = function() {};

// 添加键
myMap.set(keyObj, "value associated with keyObj");
myMap.set(keyFunc, "value associated with keyFunc");

console.log(myMap.get(keyObj)); // "value associated with keyObj"
console.log(myMap.get(keyFunc)); // "value associated with keyFunc"
```
:::

### 13.4 Set和Map区别
::: tip
Set和Map的区别主要在于:
1. 键的类型不同
2. 值的类型不同
3. 键值对个数不同
4. 迭代顺序不同
5. 内存占用不同
:::


### 13.5 WeakSet和WeakMap
```javascript
let ws = new WeakSet();
let obj = {};
ws.add(obj);
console.log(ws.has(obj)); // true

let wm = new WeakMap();
let key = {};
wm.set(key, "value");
console.log(wm.get(key)); // "value"
```
### 13.6 WeakSet和WeakMap区别
::: tip
WeakSet和WeakMap的区别主要在于:
1. 键只能是对象
2. 键的生命周期受垃圾回收机制控制
3. 键值对个数不同
4. 迭代顺序不同
5. 内存占用不同
:::
