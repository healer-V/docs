# 函数

## 一、概述

函数是JavaScript中的基础构建块，它允许你封装可重用的代码块。

::: tip 函数的基本概念
1. **自包含代码块**：函数是一组执行特定任务的语句
2. **可重用性**：定义一次，可以在多处调用
3. **参数传递**：可以接收输入数据
4. **返回值**：可以产生输出结果
5. **一等公民**：在JavaScript中，函数可以像变量一样使用
:::

## 二、函数声明

函数声明是定义函数的最基本方式。

### 2.1 语法格式

```javascript
function 函数名(参数1, 参数2, ...) {
  // 函数体
  return 返回值;
}
```

### 2.2 示例

```javascript
// 定义一个计算两数之和的函数
function add(a, b) {
  return a + b;
}

// 调用函数
const result = add(5, 3);
console.log(result); // 8
```

## 三、函数表达式

函数表达式是将函数赋值给变量的定义方式。

### 3.1 语法格式

```javascript
const 变量名 = function(参数1, 参数2, ...) {
  // 函数体
  return 返回值;
};
```

### 3.2 特点

::: info 函数表达式特点
1. **匿名函数**：可以使用匿名函数（没有名称的函数）
2. **变量提升**：与函数声明不同，函数表达式不会被提升
3. **作用域限制**：函数表达式仅在赋值语句执行后可用
:::

### 3.3 示例

```javascript
// 匿名函数表达式
const multiply = function(a, b) {
  return a * b;
};

// 命名函数表达式
const divide = function divideNumbers(a, b) {
  return a / b;
};

console.log(multiply(4, 6)); // 24
console.log(divide(10, 2)); // 5
```

## 四、箭头函数

箭头函数是ES6引入的更简洁的函数表达式语法。

### 4.1 语法格式

```javascript
const 变量名 = (参数1, 参数2, ...) => {
  // 函数体
  return 返回值;
};

// 单参数可以省略括号
const 变量名 = 参数 => {
  // 函数体
  return 返回值;
};

// 单行返回可以省略大括号和return
const 变量名 = (参数1, 参数2, ...) => 返回值;
```

### 4.2 特点

::: tip 箭头函数特点
1. **更简洁的语法**：减少代码冗余
2. **没有自己的this**：箭头函数不绑定自己的this，继承自父作用域
3. **不能用作构造函数**：不能使用new关键字
4. **没有arguments对象**：但可以使用剩余参数
5. **没有prototype属性**
:::

### 4.3 示例

```javascript
// 基本箭头函数
const sum = (a, b) => a + b;
console.log(sum(2, 3)); // 5

// 单参数省略括号
const square = x => x * x;
console.log(square(4)); // 16

// 多行箭头函数
const calculate = (a, b) => {
  const sum = a + b;
  const product = a * b;
  return { sum, product };
};

console.log(calculate(3, 4)); // { sum: 7, product: 12 }
```

## 五、函数参数

JavaScript函数的参数处理非常灵活。

### 5.1 基本参数

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet('World')); // Hello, World!
```

### 5.2 默认参数        

ES6引入了默认参数值的特性。

```javascript
function greet(name = 'Guest') {
  return `Hello, ${name}!`;
}

console.log(greet()); // Hello, Guest!
console.log(greet('John')); // Hello, John!
```

### 5.3 剩余参数

剩余参数允许你将多个参数收集到一个数组中。

```javascript
function sum(...numbers) {
  return numbers.reduce((total, num) => total + num, 0);
}

console.log(sum(1, 2, 3, 4)); // 10
```

## 六、函数返回值

### 6.1 基本返回

```javascript
function square(x) {
  return x * x;
}
```

### 6.2 多返回值

虽然JavaScript函数只能返回一个值，但可以通过对象或数组返回多个值。

```javascript
function getDimensions(width, height) {
  return {
    area: width * height,
    perimeter: 2 * (width + height)
  };
}

const result = getDimensions(5, 4);
console.log(result.area); // 20
console.log(result.perimeter); // 18
```

## 七、函数作用域

### 7.1 局部变量

在函数内部声明的变量具有局部作用域，仅在函数内部可见。

```javascript
function test() {
  const localVar = 'I am local';
  console.log(localVar); // 可以访问
}

test();
// console.log(localVar); // 错误：未定义
```

### 7.2 全局变量

在函数外部声明的变量或在函数内部未使用关键字声明的变量具有全局作用域。

```javascript
let globalVar = 'I am global';

function test() {
  console.log(globalVar); // 可以访问
  noKeyword = 'Becomes global'; // 不推荐这样做
}

test();
console.log(noKeyword); // 可以访问（不推荐）
```

## 八、闭包

闭包是指函数能够访问其词法作用域之外的变量。

### 8.1 闭包的概念

::: info 闭包解释
1. **词法作用域**：函数在定义时决定了它可以访问哪些变量
2. **引用保留**：闭包会保留对外部变量的引用，即使外部函数已经执行完毕
3. **数据封装**：可以用于创建私有变量和方法
:::

### 8.2 示例

```javascript
function createCounter() {
  let count = 0; // 私有变量
  
  return {
    increment: function() {
      count++;
      return count;
    },
    decrement: function() {
      count--;
      return count;
    },
    getCount: function() {
      return count;
    }
  };
}

const counter = createCounter();
console.log(counter.increment()); // 1
console.log(counter.increment()); // 2
console.log(counter.decrement()); // 1
console.log(counter.getCount()); // 1
```

## 九、函数作为一等公民

在JavaScript中，函数是一等公民，意味着它们可以像其他值一样使用。

### 9.1 函数作为参数

```javascript
function processArray(array, processor) {
  return array.map(item => processor(item));
}

const numbers = [1, 2, 3, 4];
const doubled = processArray(numbers, x => x * 2);
console.log(doubled); // [2, 4, 6, 8]
```

### 9.2 函数作为返回值

```javascript
function createMultiplier(multiplier) {
  return function(number) {
    return number * multiplier;
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5)); // 10
console.log(triple(5)); // 15
```

## 十、 高阶函数

高阶函数是接收函数作为参数或返回函数的函数。

### 10.1 常见的高阶函数示例

:::details 常见高阶函数详解
```javascript
// map - 转换数组中的每个元素
const numbers = [1, 2, 3, 4];
const squared = numbers.map(x => x * x);
console.log(squared); // [1, 4, 9, 16]

// filter - 筛选符合条件的元素
const evenNumbers = numbers.filter(x => x % 2 === 0);
console.log(evenNumbers); // [2, 4]

// reduce - 累积处理数组元素
const sum = numbers.reduce((total, current) => total + current, 0);
console.log(sum); // 10

// forEach - 遍历数组并执行操作
numbers.forEach(x => console.log(x));

// sort - 排序数组
const sorted = [...numbers].sort((a, b) => b - a);
console.log(sorted); // [4, 3, 2, 1]

// every - 检查所有元素是否满足条件
const allPositive = numbers.every(x => x > 0);
console.log(allPositive); // true

// some - 检查是否至少有一个元素满足条件
const hasEven = numbers.some(x => x % 2 === 0);
console.log(hasEven); // true
```
:::

## 十一、 函数构造器

不推荐使用函数构造器，但了解它很重要。

```javascript
const add = new Function('a', 'b', 'return a + b');
console.log(add(2, 3)); // 5
```

## 十二、 函数的其他特性

### 12.1 arguments对象

在普通函数中，arguments是一个类数组对象，包含所有传递给函数的参数。

```javascript
function logArgs() {
  console.log(arguments);
  console.log(arguments.length);
}

logArgs(1, 'hello', true);
```

### 12.2 this关键字

this的值取决于函数的调用方式，而不是定义方式。

:::details this在不同场景下的使用
```javascript
// 1. 全局环境中的this
console.log(this); // 浏览器中是window，Node.js中是global

// 2. 普通函数中的this
function test() {
  console.log(this); // 严格模式下是undefined，非严格模式下是全局对象
}

test();

// 3. 对象方法中的this
const obj = {
  value: 42,
  getValue: function() {
    return this.value;
  }
};

console.log(obj.getValue()); // 42

// 4. 使用call/apply/bind改变this
function greet() {
  return `Hello, ${this.name}!`;
}

const person = { name: 'John' };
console.log(greet.call(person)); // Hello, John!

// 5. 箭头函数中的this
const arrowTest = () => {
  console.log(this); // 继承自父作用域的this
};
```
:::

### 12.3 严格模式

在严格模式下，函数有一些不同的行为。

```javascript
'use strict';

function strictFunction() {
  // this在严格模式下不会自动绑定到全局对象
  console.log(this); // undefined
}

strictFunction();
```

## 十三、 函数性能优化

### 13.1 优化建议

::: tip 函数性能优化技巧
1. **避免不必要的闭包**：过度使用闭包可能导致内存问题
2. **缓存函数**：对于频繁调用的计算密集型函数，可以缓存结果
3. **避免在循环中定义函数**：这会导致每次迭代都创建新函数
4. **合理使用箭头函数**：注意this绑定的差异
5. **使用适当的函数类型**：根据需要选择函数声明、表达式或箭头函数
:::

### 13.2 缓存示例

```javascript
function memoize(fn) {
  const cache = {};
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache[key]) {
      return cache[key];
    }
    const result = fn.apply(this, args);
    cache[key] = result;
    return result;
  };
}

// 使用缓存优化斐波那契数列计算
const fibonacci = memoize(function(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});

console.log(fibonacci(40)); // 快速计算大数，不会重复计算
```