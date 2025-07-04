# 一、Javascript基础

## 1、数据类型

JavaScript 有七种基本的数据类型：
>[!TIP]
>JavaScript 中的数据类型分为：
>1. 基本数据类型：包括`Number`、`String`、`Boolean`、`null`、`undefined`、`Symbol`。
>2. 复杂数据类型：包括`Object`、`Array`、`Function`。
>
>**[注:]**
> - ES6 新增了 `Symbol` 数据类型。(解决属性名冲突问题,以及实现私有属性和方法)
> - ES11 新增了 `BigInt` 数据类型。(解决 Number类型的安全整数范围有限的问题)

### 1.1、Number类型
#### 1.1.1、定义
:::tip Number类型
JavaScript中的Number类型用于表示`整数`和`浮点数`，采用IEEE 754标准的双精度浮点数格式存储。
:::

#### 1.1.2、特性
>[!NOTE]
>- 整数范围：-2^53到2^53（安全整数）
>- 浮点数精度问题：0.1 + 0.2 !== 0.3
>- 特殊值：`Infinity`、`-Infinity`、`NaN`
>- ES6新增：`Number.isInteger()` (判断是否为整数)、`Number.isSafeInteger()` (判断是否为安全整数)。

#### 1.1.3、Number类型方法

| 方法名称      | 描述                                                         |
| ------------- | ------------------------------------------------------------ |
| `toFixed(n)`    | 返回指定位数小数的字符串表示，会四舍五入(n: 0-20)            |
| `toString(radix)`| 返回指定基数(radix: 2-36)的字符串表示，默认十进制             |
| `valueOf()`     | 返回Number对象的原始数值                                      |
| `toExponential(n)`| 返回指数表示法的字符串形式(n: 小数位数)                      |
| `toPrecision(n)` | 返回指定位数有效数字的字符串表示(n: 有效数字位数)             |

#### 1.1.4、使用示例
```javascript
// 安全整数检查
Number.isSafeInteger(9007199254740991) // true
Number.isSafeInteger(9007199254740992) // false

// 浮点数精度问题
0.1 + 0.2 // 0.30000000000000004

// 方法使用
(123.456).toFixed(2) // "123.46"
(10).toString(2) // "1010"
```
### 1.2、Boolean类型
#### 1.2.1、定义
:::tip Boolean类型
JavaScript中的Boolean类型表示逻辑实体，只有两个值：`true` 和 `false`。常用于条件判断和控制流程。
:::

#### 1.2.2、特性
>[!NOTE]
>- 类型转换规则：
>  - `false`值：`false`、`0`、`""`、`null`、`undefined`、`NaN`
>  - 其他所有值都会转换为`true`
>- 严格相等(===)不会进行类型转换
>- Boolean对象与原始布尔值的区别

#### 1.2.3、常用方法
| 方法名称      | 描述                                                         |
| ------------- | ------------------------------------------------------------ |
| toString()    | 返回布尔值的字符串表示("true"或"false")                      |
| valueOf()     | 返回布尔值的原始值                                           |

#### 1.2.4、示例
```javascript
// 类型转换示例
Boolean(0) // false
Boolean("hello") // true

// 严格比较
false == 0 // true
false === 0 // false

// Boolean对象
let boolObj = new Boolean(false)
if(boolObj) {
  console.log("This will execute") // 因为对象总是truthy
}
```

### 1.3、String类型
#### 1.3.1、定义
:::tip String类型
JavaScript中的String类型表示文本数据，是不可变的原始值。可以使用单引号(')、双引号(")或反引号(`)创建。
:::

#### 1.3.2、特性
>[!NOTE]
>- 字符串是不可变的(immutable)
>- ES6新增模板字符串功能
>- 字符串长度通过length属性获取
>- 支持Unicode字符

#### 1.3.3、常用方法
| 方法名称          | 描述                                                         |
| ----------------- | ------------------------------------------------------------ |
| charAt(index)     | 返回指定位置的字符                                           |
| charCodeAt(index) | 返回指定位置字符的UTF-16编码                                 |
| includes(str)     | 判断是否包含指定字符串                                       |
| endsWith(str)     | 判断是否以指定字符串结尾                                     |
| indexOf(str)      | 返回指定字符串首次出现的位置                                 |
| lastIndexOf(str)   | 返回指定字符串最后一次出现的位置                             |
| match(regexp)     | 使用正则表达式匹配字符串                                     |
| padEnd(length, str)| 用指定字符串填充到指定长度(从末尾)                          |
| padStart(length, str)| 用指定字符串填充到指定长度(从开头)                        |
| repeat(count)     | 重复字符串指定次数                                           |
| replace(search, replace)| 替换字符串中的内容                                      |
| slice(start, end) | 提取字符串片段                                               |
| split(separator)  | 按分隔符分割字符串为数组                                     |
| startsWith(str)   | 判断是否以指定字符串开头                                     |
| substring(start, end)| 提取字符串片段(类似slice)                                |
| toLowerCase()     | 转换为小写                                                   |
| toUpperCase()     | 转换为大写                                                   |
| trim()            | 去除两端空白                                                 |
| trimStart()       | 去除开头空白                                                 |
| trimEnd()         | 去除末尾空白                                                 |

#### 1.3.4、示例
```javascript
// 模板字符串
let name = "John"
console.log(`Hello ${name}!`) // Hello John!

// 字符串方法
let str = "Hello World"
str.includes("World") // true
str.repeat(2) // "Hello WorldHello World"

// Unicode支持
let heart = "❤️"
heart.length // 2 (某些表情符号占用多个代码单元)
```

### 1.4、Array类型
#### 1.4.1、定义
:::tip Array类型
JavaScript中的Array类型是用于存储有序数据集合的高阶对象。可以包含不同类型的元素，长度动态可变。
:::

#### 1.4.2、特性
>[!NOTE]
>- 数组是对象类型
>- 长度通过length属性获取和设置
>- 稀疏数组(含有空位)的处理
>- ES6新增的数组特性：解构赋值、扩展运算符等

#### 1.4.3、核心方法
| 方法名称  | 描述                                                         |
| --------- | ------------------------------------------------------------ |
| push(...items) | 添加元素到数组末尾，返回新长度                               |
| pop()     | 移除并返回数组最后一个元素                                   |
| shift()   | 移除并返回数组第一个元素                                      |
| unshift(...items)| 添加元素到数组开头，返回新长度                              |
| splice(start, deleteCount, ...items)| 从指定位置添加/删除元素，返回被删除元素数组         |
| reverse() | 反转数组元素顺序                                             |
| sort([compareFunction])| 对数组元素排序                                             |

#### 1.4.4、迭代方法
| 方法名称      | 描述                                                         |
| ------------- | ------------------------------------------------------------ |
| forEach(callback) | 对每个元素执行回调函数                                       |
| map(callback) | 对每个元素执行回调函数，返回新数组                           |
| filter(callback) | 过滤元素，返回满足条件的元素组成的新数组                     |
| reduce(callback, initialValue)| 从左到右对每个元素执行回调函数，累计结果                  |
| reduceRight(callback, initialValue)| 从右到左对每个元素执行回调函数，累计结果                |
| some(callback) | 测试是否至少有一个元素通过测试                               |
| every(callback) | 测试是否所有元素都通过测试                                  |
| find(callback) | 返回第一个满足条件的元素                                     |
| findIndex(callback) | 返回第一个满足条件的元素的索引                              |

#### 1.4.5、静态方法
| 方法名称        | 描述                                                         |
| --------------- | ------------------------------------------------------------ |
| Array.from(arrayLike) | 从类数组或可迭代对象创建新数组                              |
| Array.of(...items) | 根据参数创建新数组                                          |
| Array.isArray(value) | 判断值是否为数组                                           |

#### 1.4.6、示例
```javascript
// 数组解构
let [a, b] = [1, 2] // a=1, b=2

// 扩展运算符
let arr1 = [1, 2, 3]
let arr2 = [...arr1, 4, 5] // [1, 2, 3, 4, 5]

// 数组方法
let numbers = [1, 2, 3, 4, 5]
numbers.filter(n => n > 3) // [4, 5]
numbers.reduce((sum, n) => sum + n, 0) // 15

// 类数组转换
Array.from(document.querySelectorAll('div')) // 将NodeList转为数组
```






### 1.5、Object类型
#### 1.5.1、定义
:::tip Object类型
JavaScript中的Object类型是键值对的集合，用于存储复杂数据结构。它是所有对象的基类，几乎所有对象都是Object的实例。
:::

#### 1.5.2、特性
>[!NOTE]
>- 对象是引用类型
>- 属性可以是任意数据类型
>- 属性名可以是字符串或Symbol
>- ES6新增特性：属性简写、计算属性名、方法简写等
>- 原型链机制实现继承

#### 1.5.3、创建方式
| 方式                | 示例                                                         |
| ------------------- | ------------------------------------------------------------ |
| 对象字面量          | `let obj = {name: 'John', age: 30}`                          |
| new Object()        | `let obj = new Object(); obj.name = 'John'`                  |
| Object.create()     | `let obj = Object.create(proto)`                             |
| 构造函数            | `function Person(name) {this.name = name}`                   |
| ES6类               | `class Person {constructor(name) {this.name = name}}`        |

#### 1.5.4、常用方法
| 方法名称                | 描述                                                         |
| ----------------------- | ------------------------------------------------------------ |
| Object.keys(obj)        | 返回对象自身可枚举属性组成的数组                             |
| Object.values(obj)      | 返回对象自身可枚举属性值组成的数组                           |
| Object.entries(obj)     | 返回对象自身可枚举键值对组成的数组                           |
| Object.assign(target, ...sources)| 复制源对象属性到目标对象                                    |
| Object.freeze(obj)      | 冻结对象，使其不可修改                                       |
| Object.seal(obj)        | 密封对象，防止添加/删除属性                                  |
| Object.defineProperty(obj, prop, descriptor)| 定义或修改对象属性                                      |
| Object.getPrototypeOf(obj)| 返回对象的原型                                              |
| Object.setPrototypeOf(obj, proto)| 设置对象的原型                                            |

#### 1.5.5、示例
```javascript
// 对象创建
let person = {
  name: 'John',
  age: 30,
  greet() {
    console.log(`Hello, I'm ${this.name}`);
  }
};

// 属性访问
console.log(person.name); // "John"
console.log(person['age']); // 30

// 方法调用
person.greet(); // "Hello, I'm John"

// ES6特性
let prop = 'age';
let obj = {
  [prop]: 30, // 计算属性名
  greet() {   // 方法简写
    console.log('Hi');
  }
};

// 对象合并
let defaults = {mode: 'standard'};
let config = Object.assign({}, defaults, {mode: 'advanced'});
```

## 2、运算符

### 2.1、算术运算符
:::tip 算术运算符
用于执行数学运算：
- `+` 加法
- `-` 减法  
- `*` 乘法
- `/` 除法
- `%` 取模（余数）
- `++` 自增
- `--` 自减
- `**` 指数（ES2016新增）
:::

 **示例**
```javascript
let x = 10, y = 3;
console.log(x + y);  // 13
console.log(x % y);  // 1
console.log(x ** y); // 1000
```

### 2.2、赋值运算符
:::tip 赋值运算符
用于给变量赋值：
- `=` 简单赋值
- `+=` 加后赋值
- `-=` 减后赋值  
- `*=` 乘后赋值
- `/=` 除后赋值
- `%=` 取模后赋值
:::

 **示例**
```javascript
let a = 5;
a += 3; // 等同于 a = a + 3
console.log(a); // 8
```

### 2.3、比较运算符
:::tip 比较运算符
用于比较值的大小：
- `==` 相等（会类型转换）
- `===` 严格相等（值和类型都相同）
- `!=` 不等  
- `!==` 严格不等
- `>` 大于
- `<` 小于
- `>=` 大于等于
- `<=` 小于等于
:::

>[!NOTE]
>- 推荐使用严格相等(`===`)和严格不等(`!==`)
>- 比较不同类型的值时，会先进行类型转换

 **示例**
```javascript
'5' == 5   // true
'5' === 5  // false
null == undefined // true
null === undefined // false
```

### 2.4、逻辑运算符
:::tip 逻辑运算符
用于逻辑运算：
- `&&` 逻辑与
- `||` 逻辑或  
- `!` 逻辑非
- `??` 空值合并（ES2020新增）
:::

 **示例**
```javascript
true && false // false
true || false // true
!true // false

let name = null;
console.log(name ?? '匿名'); // '匿名'
```

### 2.5、位运算符
:::tip 位运算符
对二进制位进行操作：
- `&` 按位与
- `|` 按位或  
- `^` 按位异或
- `~` 按位非
- `<<` 左移
- `>>` 右移
- `>>>` 无符号右移
:::

 **示例**
```javascript
let a = 5;        // 0101
let b = 3;        // 0011
console.log(a & b); // 0001 (1)
console.log(a | b); // 0111 (7)
```

### 2.6、其他运算符
:::tip 其他运算符
- `typeof` 返回变量类型
- `instanceof` 检查对象类型
- `?:` 三元条件运算符
- `,` 逗号运算符
- `delete` 删除对象属性
- `in` 检查属性是否存在
:::

 **示例**
```javascript
let age = 20;
let status = age >= 18 ? '成人' : '未成年';

let obj = {x: 1};
console.log('x' in obj); // true
delete obj.x;
console.log('x' in obj); // false
```

## 3、注释

### 3.1、单行注释
:::tip 单行注释
以`//`开头，直到行尾：
```javascript
// 这是单行注释
let x = 5; // 声明变量x
```
:::

### 3.2、多行注释
:::tip 多行注释

1. 以`/*`开头，以`*/`结尾：
2. 可跨越多行
:::
```javascript
/*
这是多行注释
可以跨越多行
*/
let y = 10;
```

>[!NOTE]
>- 注释应清晰简洁，说明代码意图而非实现细节
>- 重要函数应使用JSDoc风格注释

### 3.3、文档注释
:::tip JSDoc 文档注释
1. 使用`/**`开头，以`*/`结尾，
2. 包含函数、类、变量、参数、返回值等信息
3. 使用`@`作为标记，后跟信息类型，如`@param`、`@returns`等
:::
```javascript
/**
 * 计算两数之和
 * @param {number} a 第一个加数
 * @param {number} b 第二个加数
 * @returns {number} 两数之和
 */
function add(a, b) {
  return a + b;
}
```

## 4、变量

### 4.1、变量定义
:::tip 变量
用于存储数据的命名容器：
- 使用`let`、`const`或`var`声明
- 命名应具有描述性
- 区分大小写
:::

### 4.2、变量声明方式

#### 4.2.1、var
:::warning var声明
- 函数作用域或全局作用域
- 存在变量提升
- 可重复声明
- 不推荐在现代代码中使用
:::

#### 4.2.2、let
:::tip let声明
- 块级作用域
- 不可重复声明
- 可重新赋值
- 推荐用于可变变量
:::

#### 4.2.3、const
:::tip const声明
- 块级作用域
- 不可重复声明
- 不可重新赋值
- 必须初始化
- 推荐用于常量
:::

>[!NOTE]
>- 优先使用`const`，需要重新赋值时使用`let`
>- 避免使用`var`

### 4.3、变量命名规范
:::tip 命名规则
1. 可包含：字母、数字、`_`、`$`
2. 不能以数字开头
3. 区分大小写
4. 不能使用保留字
5. 推荐使用驼峰命名法
:::

**命名示例**
```javascript
// 好的命名
let userName = 'John';
const MAX_SIZE = 100;

// 不好的命名
let a = 10; // 无意义
let 1stPlace = 'first'; // 数字开头
```

### 4.4、变量作用域
:::tip 作用域类型
1. 全局作用域：在任何地方可访问
2. 函数作用域：在函数内部可访问
3. 块级作用域：在代码块`{}`内部可访问
:::

 **示例**
```javascript
let globalVar = '全局'; // 全局作用域

function test() {
  let functionVar = '函数'; // 函数作用域
  
  if (true) {
    let blockVar = '块级'; // 块级作用域
    console.log(functionVar); // 可访问
  }
  
  console.log(blockVar); // 报错
}
```

### 4.5、变量提升
:::warning 变量提升
- `var`声明会被提升到作用域顶部
- `let`和`const`存在暂时性死区
- 函数声明也会被提升
:::

 **示例**
```javascript
console.log(x); // undefined (变量提升)
var x = 5;

console.log(y); // 报错 (暂时性死区)
let y = 10;
```

### 4.6、最佳实践
:::tip 变量使用建议
1. 始终声明变量（避免隐式全局变量）
2. 优先使用`const`
3. 使用有意义的命名
4. 每个变量单独声明
5. 初始化时赋值
:::


## 5、作用域

>[!TIP] JS作用域分为
>1. 全局作用域：是指在`函数外部`定义的变量和函数。
>2. 函数作用域：是指在`函数内部`定义的变量和函数。  
>3. 块作用域：是指在`代码块中`定义的变量和函数。


## 6、严格模式

### 6.1、严格模式概述
:::tip 严格模式
严格模式是ES5引入的一种限制性更强的JavaScript变体，它通过抛出错误来消除一些静默错误，并修复了一些导致JavaScript引擎难以优化的缺陷。
:::

#### 启用方式
```javascript
// 整个脚本文件启用
'use strict';

// 函数内部启用
function strictFunc() {
  'use strict';
  // 函数体
}
```

### 6.2、严格模式的主要变化
>[!NOTE]
>- 变量必须声明后才能使用
>- 禁止删除不可删除的属性
>- 函数参数名不能重复
>- 禁止使用`with`语句
>- 禁止使用`arguments.callee`
>- `this`在全局作用域中为`undefined`而非`window`
>- 禁止八进制字面量(如010)

#### 示例
```javascript
'use strict';

// 变量必须声明
x = 10; // ReferenceError

// 参数名不能重复
function dupParam(a, a) {} // SyntaxError

// 删除不可删除属性
delete Object.prototype; // TypeError
```

### 6.3、严格模式的优势
:::tip 使用严格模式的好处
1. 使代码更安全，避免意外创建全局变量
2. 消除一些静默错误，转为显式抛出错误
3. 禁止使用一些可能在未来版本中定义的语法
4. 提高编译器效率，帮助JavaScript引擎优化代码
::>

## 7、事件

### 7.1、事件概述
:::tip JavaScript事件
事件是文档或浏览器窗口中发生的特定交互瞬间，JavaScript可以通过事件处理器对这些交互做出响应。
:::

### 7.2、事件类型分类

#### 7.2.1、鼠标事件
| 事件类型 | 描述 |
|---------|------|
| click | 单击事件 |
| dblclick | 双击事件 |
| mousedown | 鼠标按下 |
| mouseup | 鼠标释放 |
| mousemove | 鼠标移动 |
| mouseover | 鼠标移入元素 |
| mouseout | 鼠标移出元素 |
| contextmenu | 右键菜单 |

#### 7.2.2、键盘事件
| 事件类型 | 描述 |
|---------|------|
| keydown | 按键按下 |
| keyup | 按键释放 |
| keypress | 按键按下并释放 |

#### 7.2.3、表单事件
| 事件类型 | 描述 |
|---------|------|
| submit | 表单提交 |
| change | 表单值改变 |
| input | 输入事件 |
| focus | 获取焦点 |
| blur | 失去焦点 |

#### 7.2.4、窗口事件
| 事件类型 | 描述 |
|---------|------|
| load | 页面加载完成 |
| unload | 页面卸载 |
| resize | 窗口大小改变 |
| scroll | 滚动事件 |

### 7.3、事件处理方式
:::tip 事件处理
1. HTML属性：`<button onclick="handleClick()">`
2. DOM属性：`element.onclick = function() {}`
3. 事件监听：`element.addEventListener('click', handler)`
:::

#### 示例
```javascript
// 推荐使用addEventListener
document.getElementById('btn').addEventListener('click', function(e) {
  console.log('按钮被点击', e);
});

// 事件对象包含有用信息
document.addEventListener('mousemove', function(e) {
  console.log(`鼠标位置: X=${e.clientX}, Y=${e.clientY}`);
});
```

## 8、函数高级特性

### 8.1、函数作用域
:::tip 函数作用域
函数内部声明的变量在函数外部不可访问，形成独立作用域：
```javascript
function test() {
  var innerVar = '内部变量';
}
console.log(innerVar); // ReferenceError
```
:::

### 8.2、闭包
:::tip 闭包
函数可以记住并访问所在的词法作用域，即使函数是在当前词法作用域之外执行：
```javascript
function createCounter() {
  let count = 0;
  return function() {
    return ++count;
  };
}
const counter = createCounter();
counter(); // 1
counter(); // 2
```
:::

### 8.3、arguments对象
:::tip arguments
函数内部可用的类数组对象，包含所有传入参数：
```javascript
function sum() {
  let total = 0;
  for(let i = 0; i < arguments.length; i++) {
    total += arguments[i];
  }
  return total;
}
sum(1, 2, 3); // 6
```
:::

### 8.4、IIFE模式
:::tip 立即执行函数
定义后立即执行的函数表达式，用于创建独立作用域：
```javascript
(function() {
  var privateVar = '私有变量';
})();
```

## 9、面向对象

### 9.1、构造函数
:::tip 构造函数
用于创建对象的特殊函数，通常首字母大写：
```javascript
function Person(name) {
  this.name = name;
  this.sayHi = function() {
    console.log('Hi, I am ' + this.name);
  };
}
const john = new Person('John');
```
:::

### 9.2、原型链
:::tip 原型继承
每个对象都有原型对象，形成原型链用于属性查找：
```javascript
Person.prototype.greet = function() {
  console.log('Hello from prototype');
};
john.greet(); // 调用原型方法
```
:::

### 9.3、继承实现
:::tip 组合继承
结合构造函数和原型链的继承方式：
```javascript
function Student(name, grade) {
  Person.call(this, name);
  this.grade = grade;
}
Student.prototype = Object.create(Person.prototype);
Student.prototype.constructor = Student;
```

## 10、this绑定

### 10.1、默认绑定
:::tip 独立函数调用
非严格模式下指向全局对象，严格模式为undefined：
```javascript
function showThis() {
  console.log(this);
}
showThis(); // window/undefined
```
:::

### 10.2、隐式绑定
:::tip 方法调用
指向调用该方法的对象：
```javascript
obj.method(); // this指向obj
```
:::

### 10.3、显式绑定
:::tip call/apply/bind
强制指定this指向：
```javascript
func.call(obj, arg1, arg2);
func.apply(obj, [arg1, arg2]);
const boundFunc = func.bind(obj);
```
:::

### 10.4、new绑定
:::tip 构造函数调用
指向新创建的对象：
```javascript
const obj = new Constructor();
```
:::

## 11、错误处理

### 11.1、try-catch-finally
:::tip 定义
-  用于`捕获和处理`代码块中发生的`异常`

:::
```javascript
try {
  // 可能抛出错误的代码
  throw new Error('这是一个自定义错误');
} catch (error) {
  // 错误发生时执行
  console.error('捕获到错误:', error.message);
} finally {
  // 无论是否有错误都会执行
  console.log('finally 代码块始终执行');
}
```

### 11.2、Error类型
:::tip ES5 内置了 6 种错误类型,都继承自Error对象
1. `Error`: 基础错误类型
2. `SyntaxError`: 语法错误
3. `TypeError`: 类型错误
4. `ReferenceError`: 引用错误
5. `RangeError`: 数值范围错误
6. `URIError`: URI 编码 / 解码错误
:::

### 11.3、自定义错误
:::tip 自定义错误
- 继承自Error对象
- 包含自定义信息
- 通过构造函数创建自定义错误类型
:::

::: details 自定义错误示例
```js
function ValidationError(message) {
  this.name = 'ValidationError';
  this.message = message || '验证失败';
  this.stack = (new Error()).stack; // 可选：捕获堆栈信息
}
ValidationError.prototype = Object.create(Error.prototype);
ValidationError.prototype.constructor = ValidationError;

// 使用自定义错误
try {
  throw new ValidationError('用户名不能为空');
} catch (error) {
  console.error(error.name + ': ' + error.message);
}
```
:::

### 11.4、异步错误处理
>[!tip]
> - 异步代码中，错误处理需要单独处理，不能使用try-catch。
> - 在 ES5 的回调函数中，错误通常作为第一个参数传递给回调函数。
> - 在 ES6 的 Promise 中，错误通过 Promise 的 reject() 方法传递。
> - 在 ES7 的 async/await 中，错误通过 try...catch 捕获。




### 11.5、注意事项
:::tip 注意事项
1. **不要捕获所有错误**：避免在全局范围使用try-catch掩盖真正的问题。
2. **异步代码需单独处理**：try-catch无法捕获异步回调中的错误。
3. **自定义错误继承**：确保自定义错误继承自Error以保留其特性。
:::


## 12、JSON处理

### 12.1、JSON.stringify
:::tip 对象序列化
将JavaScript对象转换为JSON字符串：
```javascript
JSON.stringify({name: 'John', age: 30});
```
:::

### 12.2、JSON.parse
:::tip JSON解析
将JSON字符串转换为JavaScript对象：
```javascript
JSON.parse('{"name":"John","age":30}');
```
:::


## 13、DOM

### 13.1、DOM概述
:::tip 文档对象模型(DOM)
DOM是HTML和XML文档的编程接口，它将文档表示为节点树，允许JavaScript动态访问和更新文档内容、结构和样式。
:::

### 13.2、DOM核心方法

#### 13.2.1、节点查询
| 方法 | 描述 |
|------|------|
| getElementById() | 通过ID获取元素 |
| getElementsByClassName() | 通过类名获取元素集合 |
| getElementsByTagName() | 通过标签名获取元素集合 |
| querySelector() | 通过CSS选择器获取第一个匹配元素 |
| querySelectorAll() | 通过CSS选择器获取所有匹配元素 |

#### 13.2.2、节点操作
| 方法 | 描述 |
|------|------|
| createElement() | 创建元素节点 |
| createTextNode() | 创建文本节点 |
| appendChild() | 添加子节点 |
| removeChild() | 移除子节点 |
| replaceChild() | 替换子节点 |
| cloneNode() | 克隆节点 |

#### 13.2.3、属性操作
| 方法 | 描述 |
|------|------|
| getAttribute() | 获取属性值 |
| setAttribute() | 设置属性值 |
| removeAttribute() | 移除属性 |
| hasAttribute() | 检查属性是否存在 |

### 13.3、DOM示例
```javascript
// 创建并添加元素
const div = document.createElement('div');
div.textContent = '新创建的div';
document.body.appendChild(div);

// 修改样式
const box = document.getElementById('box');
box.style.backgroundColor = 'red';
box.classList.add('active');

// 事件委托
document.getElementById('list').addEventListener('click', function(e) {
  if(e.target.tagName === 'LI') {
    console.log('点击了:', e.target.textContent);
  }
});
```

## 14、BOM

### 14.1、BOM概述
:::tip 浏览器对象模型(BOM)
BOM提供了与浏览器窗口交互的对象，包括window、navigator、screen、history、location等。
:::

### 14.2、BOM核心对象

#### 14.2.1、window对象
| 属性/方法 | 描述 |
|----------|------|
| innerWidth/innerHeight | 窗口内部宽高 |
| open()/close() | 打开/关闭窗口 |
| setTimeout()/setInterval() | 定时器 |
| alert()/confirm()/prompt() | 对话框 |

#### 14.2.2、location对象
| 属性/方法 | 描述 |
|----------|------|
| href | 完整URL |
| protocol | 协议 |
| host | 主机名和端口 |
| pathname | 路径部分 |
| search | 查询字符串 |
| reload() | 重新加载页面 |

#### 14.2.3、history对象
| 属性/方法 | 描述 |
|----------|------|
| length | 历史记录数 |
| back()/forward() | 后退/前进 |
| go() | 跳转到指定历史记录 |
| pushState()/replaceState() | 修改历史记录(HTML5) |

### 14.3、BOM示例
```javascript
// 获取浏览器信息
console.log('用户代理:', navigator.userAgent);
console.log('屏幕尺寸:', screen.width, 'x', screen.height);

// 操作URL
if(location.search.includes('debug=true')) {
  console.log('调试模式');
}

// 添加历史记录
history.pushState({page: 1}, 'Page 1', '?page=1');
```
