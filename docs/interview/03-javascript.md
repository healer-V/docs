# Javascript面试题
## 深度篇
### 1、原型的作用
>[!tip] 原型
>- **为了实现面向对象。**
>   - 实现面向对象的两种途径： **类型元数据**（基于类的）和**原型链**（基于原型）。
>- 一个能支持面向对象的语言必须做到一点：能判定实例的类型。
>- 原型的存在避免了类型丢失。


### 2、原型链的理解
>[!tip] 原型链
>- 每一个函数都由一个属性：`prototype`,它的值是一个对象。
>- 这个`prototype`属性中有一个属性：`constructor`，它的值是原本的这个函数（也就是说`constructor`指向构造函数本身）。
>- 原型链之间的链接点是`__proto__`（隐式原型）,是实例对象的一个属性，通过`__proto__`可以指向构造函数的`prototype`属性



::: details 原型链示例
```javascript

function Test(name){
  this.name = name;
  this.age = 18;
}
Test.prototype.b = 2;
Object.prototype.c = 3;

obj = new Test("xiaoming");
console.log(obj.constructor === Test); // true

console.log(obj.__proto__ === Test.prototype); // true
console.log(Test.prototype.__proto__ === Object.prototype) // true
console.log(Object.prototype.__proto__ === null) // true

/**
 * 
 * obj (){
 *  __proto__: Test.prototype = {
 *    b: 2,
 *    __proto__: Object.prototype = {
 *       c: 3,
 *       __proto__: null
 *   }
 * }
 * }
 *  查找规则：
 *  1. 先从自身查找，如果有则返回。
 *  2. 再从`__proto__`中查找，如果有则返回。
 *  
 */

```
:::


### 3、Promise 解决了什么问题
>[!tip] 为了统一JS中的异步编程方案。
>- Promise 无法消除回调，他只不过是通过脸是调用的方式让回调变得可控。
>- 它提供了统一的接口，使得异步操作更加容易管理。
>- 回调地狱产生的原因是因为过去异步实现方案的不统一，无法使互操作。

### 4、JS中的计时器是否精确
>[!important] 计时器不精确
> 1. **硬件**：计算机的计时是基于CPU的寄存器，它只能计时到一定的精度。 最精确的硬件计时器是**原子钟**。
> 2. **操作系统**：操作系统中有一些任务调度，而且有可能被其他进程打断，导致计时不准确。
> 3. **web标准**：计时器的嵌套层次大于等于五层时，会有至少四毫秒的延迟。
> 4. **事件循环**：受事件循环的影响，计时器的回调函数只能在主线程空闲时运行，因此又带来了偏差。
> 5. **浏览器层面**：浏览器规则，当标签页失活状态下时，计时会被延迟到一秒钟。

### 5、如何理解异步
>[!tip] 异步
>- JS是一门单线程的语言，这是因为它运行在浏览器的渲染主线程中，而渲染主线程只有一个。
>- 渲染主线程承担着诸多的工作，渲染页面、执行 JS 都在其中运行。
>- 如果使用同步的方式，就极有可能导致主线程产生阻塞，从而导致消息队列中的很多其他任务无法得到执行。这样一来，一方面会导致繁忙的主线程白白的消耗时间，另一方面导致页面无法及时更新，给用户造成卡死现象。
>- 所以浏览器采用异步的方式来避免。具体做法是当某些任务发生时，比如计时器、网络、事件监听，主线程将任务交给其他线程去处理，自身立即结束任务的执行，转而执行后续代码。当其他线程完成时，将事先传递的回调函数包装成任务，加入到消息队列的末尾排队，等待主线程调度执行。
>- 在这种异步模式下，浏览器永不阻塞，从而最大限度的保证了单线程的流畅运行。

### 6、事件循环
>[!tip] 事件循环
>- 事件循环又叫做消息循环，是浏览器**渲染主线程的工作方式**。
>- 在 Chrome 的源码中，它开启一个不会结束的 for 循环，每次循环从消息队列中取出第一个任务执行，而其他线程只需要在合适的时候将任务加入到队列末尾即可。
>- 过去把消息队列简单分为宏队列和微队列，这种说法目前已无法满足复杂的浏览器环境，取而代之的是一种更加灵活多变的处理方式。

>[!note] W3C 官方解释
>- 每个任务有不同的类型，同类型的任务必须在同一个队列，不同的任务可以属于不同的队列。
>- 不同任务队列有不同的优先级，在一次事件循环中，由浏览器自行决定取哪一个队列的任务。
>- 浏览器必须有一个微队列，微队列的任务一定具有最高的优先级，必须优先调度执行。




### 7、消息队列
>[!tip] 消息队列
>- 任务没有优先级，在消息队列中先进先出。
>- 但消息队列是有优先级的。
>- 优先级：
>- 1. 每个任务都有一个任务类型，同一个类型的任务必须在一个队列，不同类型的任务可以分属于不同的队列。在一次事件循环中，浏览器可以根据实际情况从不同的队列中取出任务执行。
>- 2. 浏览器必须准备好一个微队列，微队列中的任务优先所有其他任务执行


### 8、闭包
>[!tip] 闭包
>- 闭包是指有权访问另一个函数作用域中的变量的函数。
>- **闭包的作用：**
>   - 它可以保存函数执行期间的状态，即使函数已经执行完毕。
>   - 它可以访问函数外部的变量。
>- **闭包的实现：**
>   1. 主要是通过**函数嵌套**来实现的。
>   2. 内部函数可以访问外部函数的局部变量，而外部函数的返回值也可以作为内部函数的返回值。
>   3. 内部函数可以访问外部函数的作用域，即使外部函数已经执行完毕。

### 9、垃圾回收机制
>[!tip] 垃圾回收机制
>- 垃圾回收机制是 JS 运行机制的重要组成部分。
>- 它负责自动释放不再使用的内存，以防止内存泄漏。
>- **垃圾回收机制的工作原理：**
>   - 首先，标记清除：遍历所有对象，标记活动对象，标记非活动对象。
>   - 然后，内存整理：移动活动对象，并更新引用。
>   - 最后，清除非活动对象。
>- **垃圾回收机制的优点：**
>   1. 自动释放内存，避免内存泄漏。
>   2. 减少内存占用，因为它可以自动释放不再使用的内存。

### 10、事件循环有哪些优点？
>- 事件循环的优点主要有以下几点：
>- 1.异步编程模型：事件循环的异步编程模型使得代码编写起来更加简单、易读、易维护。
>- 2.避免阻塞：事件循环的设计避免了线程的阻塞，使得浏览器可以更好地处理其他任务。
>- 3.节省资源：事件循环的设计可以节省不必要的资源，比如内存占用和 CPU 开销。
>- 4.高效率：事件循环的高效率使得浏览器可以更好地利用 CPU 资源，提高页面的响应速度。



## 类型篇
### 1、JavaScript 的数据类型

>[!tip] 原始类型
>1. `Undefined`：表示变量未初始化。一个变量声明后但未赋值时，它的默认值是 undefined。 
>2. `Null`：表示一个空的值或一个不存在的对象。`null` 是一个特殊的关键字，它代表“**无值**”。 
>3. `Boolean`：只有两个值：`true` 和 `false`，用于逻辑判断。 
>4. `Number`：表示**双精度 64 位浮点数**。特殊值包括 `NaN`（Not a Number）和 `Infinity`。 
>5. `String`：表示字符序列，可以用单引号、双引号或反引号括起来的文本。 
>6. `Symbol`：用来创建**唯一且不可变**的值，主要用于对象属性的唯一标识，避免属性名冲突`(ES6)`。 
>7. `BigInt`：用于表示**任意精度的大整数**，允许操作超过 Number 能表示的范围的整数 `(ES11)`。

>[!tip] 引用类型
> `Object`: 表示一个对象，可以包含多个键值对，每个**键**都是一个**字符串**，值可以是任意类型。

 1.1、两者区别

:::tip 存储区别
1. 原始类型存储在栈（stack）中，值直接保存在变量访问的位置，由于其大小固定且频繁使用，存储在栈中具有更高的性能。 
2. 引用类型存储在堆（heap）中，占用空间较大且大小不固定，变量保存的是对实际对象的引用（即指针），这些引用存储在栈中。 
:::
:::tip 赋值方式区别
1. 原始类型：复制的是值本身。例:将一个 number 类型的变量赋值给另一个变量，两个变量互不影响。 
2. 引用类型：复制的是引用（指针）。多个变量引用同一个对象时，一个变量的修改会影响其他变量。
:::
 1.2、类型检测

::: details typeof 类型检测 原始类型
```javascript
typeof undefined // "undefined"
typeof null // "object"
typeof true // "boolean"
typeof 1 // "number"
typeof "hello" // "string"
typeof Symbol() // "symbol"
typeof BigInt(100) // "bigint"

typeof {} // "object"
typeof [] // "object"
typeof function() {} // "function" 

```
:::

::: details instanceof 类型检测 引用类型
```javascript
[] instanceof Array // true
{} instanceof Object // true
() instanceof Function // true
```
:::

 1.3、类型转换
:::tip 说明
 （1）`自动类型转换`：如字符串与数字相加时，数字会被转换为字符串。 <br>
 （2）`显式类型转换`：使用 Number()、String()、Boolean() 等函数将值转换为指定类型。 <br>
:::
 1.4、堆和栈
:::tip 说明
 （1）`栈`：内存分配效率高，自动管理（由编译器分配和释放）。 <br>
 （2）`堆`：内存分配灵活，但需要由开发者手动管理内存（通过垃圾回收机制）。<br>
:::


###  2、判断数组的方法
>[!tip] 四个常见方法
>1. `Array.isArray()`： 用于判断某个变量是否为数组，返回一个布尔值。
>2. `instanceof`： 用于检测某个对象是否是另一个对象的实例，返回一个布尔值。
>3. `Object.prototype.toString.call()`：使用该方法后，会返回一个类似 `[object Array]` 的字符串。
>4. `Array.prototype`：检查对象的原型链是否指向 Array.prototype。
>5. `Array.prototype.isPrototypeOf()`：用于检查某个对象是否是另一个对象的原型链的一部分，返回一个布尔值。

 2.1、 `Array.isArray`
:::tip 说明
Array.isArray() 是 ES6 新增的方法，用于判断某个变量是否为数组，返回一个布尔值。
:::
示例如下：
```javascript
let arr = [1, 2, 3];
Array.isArray(obj); // true
```

2.2、 `instanceof` 
:::tip 说明
- 用于检测某个对象是否是另一个对象的实例，返回一个布尔值。
- 语法：`obj instanceof constructor`
- 参数：
  - `obj`：待检测的对象。
  - `constructor`：构造函数，用于创建对象的类型。
:::

::: details 示例
```javascript
let arr = [1, 2, 3];
arr instanceof Array; // true
```
:::


 2.3、 `Object.prototype.toString.call`

:::tip 说明
- 适用于**判断各种数据类型**。
- Object.prototype.toString.call(test) 会返回一个类似 `[object Array]` 的字符串。
:::

::: details 示例
```javascript
let arr = [1, 2, 3];
Object.prototype.toString.call(arr).slice(8,-1) === 'Array'; // true
```
:::

 2.4、 `Array.prototype`
:::tip 说明
- 检查对象的原型链是否指向 Array.prototype，来判断其是否为数组，返回一个布尔值。
- 但是直接访问 `proto` 不推荐，因为它是非标准属性，虽然现在大多数浏览器都支持。
:::
::: details 示例
```javascript
let arr = [1, 2, 3];
arr.__proto__ === Array.prototype; // true
```
:::

 2.5、 `Array.prototype.isPrototypeOf` 
:::tip 说明
- 检查 `Array.prototype` **是否存在于对象的原型链中** ，来判断其是否为数组，返回一个布尔值。
- 该方法是 ES6 新增的方法，需要注意兼容性。
:::

::: details 示例

```javascript
let obj = [1, 2, 3];
Array.prototype.isPrototypeOf(obj); // true
```
:::



### 3、JS 中判断数据类型的方式

>[!tip] typeof 
> `typeof` 操作符 : 可以用来判断一个变量的基本数据类型（除了 null，它会返回 "object"）

:::details typeof 示例
```javascript
typeof 42; // "number"
typeof "hello"; // "string"
typeof true; // "boolean"
typeof undefined; // "undefined"
typeof null; // "object" （注意这是一个历史遗留问题，null被错误地归类为对象）
typeof {}; // "object"
typeof []; // "object" （数组也是对象的一种特殊形式）
typeof function() {}; // "function"
```
:::

>[!tip] instanceof 
> `instanceof` 操作符 : 可以用来判断一个变量是否属于某个对象的实例，返回一个布尔值。

::: details instanceof 示例
```javascript
let arr = [];
arr instanceof Array; // true
arr instanceof Object; // true，因为数组也是对象的一种
```
:::

>[!tip] Object.prototype.toString.call() 
> `Object.prototype.toString.call()`  : 返回一个表示对象的内部属性 [[Class]] 的字符串，通过它可以准确判断对象的类型。

::: details Object.prototype.toString.call() 示例

```javascript
Object.prototype.toString.call(42); // "[object Number]"
Object.prototype.toString.call("hello"); // "[object String]"
Object.prototype.toString.call(true); // "[object Boolean]"
Object.prototype.toString.call(undefined); // "[object Undefined]"
Object.prototype.toString.call(null); // "[object Null]"
Object.prototype.toString.call({}); // "[object Object]"
Object.prototype.toString.call([]); // "[object Array]"
Object.prototype.toString.call(function() {}); // "[object Function]"
```
:::


>[!tip] Array.isArray() 
> `Array.isArray()` 方法 : 用于判断某个变量是否为数组，返回一个布尔值。

::: details Array.isArray() 示例

```javascript
Array.isArray([]); // true
Array.isArray({}); // false
```
:::



### 4、null 和 undefined 的区别

>[!tip] 区别
>- `undefined` 表示变量**声明了但未赋值**。
>- `null` 表示一个**空对象引用**。


:::tip 比较操作区别
- `undefined` 和 `null` 使用双等号 `==` 比较时会被认为`相等`，因为它们都代表“没有值”的概念。 
- 使用严格等号 `===` 比较时，它们是`不相等`的，因为它们是不同类型的值。
:::


::: details undefined 和 null 的比较​
```javascript
//  undefined 和 null 的比较​
console.log(undefined == null);  // true（宽松相等，JS 特殊规则）
console.log(undefined === null); // false（类型不同，严格不相等）


// undefined 和 undefined 的比较​
console.log(undefined == undefined); // true（宽松相等，JS 特殊规则）
console.log(undefined === undefined); // true（严格相等）


// null 和 null 的比较​
console.log(null == null); // true（宽松相等，JS 特殊规则）
console.log(null === null); // true（严格相等）

```
:::


### 5、typeof null 是 "object"的原因

:::tip 原因分析
1. JavaScript 在最初设计时，使用了32位系统。为了优化性能，JavaScript 的值被存储为二进制数据，低位用来表示数据的类型。 
2. 对象的类型标识符是 000，而 null 被认为是一个空指针（即零地址），它的二进制表示全是 0，也即 00000000。 
3. 由于 null 的二进制表示和对象的类型标识符相同，typeof null 结果就被错误地设置为 "object"。
4. 尽管这个错误很早就被发现，但为了保持向后兼容性，修复这个错误会导致大量现有代码出错。因此，这个行为被保留下来了。
:::


### 6、typeof 和 instanceof 有什么区别？

::: tip 区别
1. 检测类型的范围：typeof 主要用于检测基本数据类型（如 number，string，boolean 等）以及函数、未定义类型和 symbol，而 instanceof 主要用于检测对象的具体类型，检查某个对象是否是某个构造函数的实例。 

2. 检测基本类型和引用类型：typeof 对于基本类型非常有用，但对于复杂引用类型（如数组、对象字面量）只会返回 "object"，而 instanceof 只能用于引用类型，不能用于检测基本数据类型。 

3. 特殊情况：typeof null 返回 "object"，这是一个 JavaScript 语言的历史遗留问题，而 instanceof 可以用来检测自定义对象的类型，通过检查原型链来确认实例关系。
:::


5,1、typeof
>[!tip] 检测变量的数据类型。
> typeof 操作符用于检测变量的数据类型，返回一个字符串。 
> 1. 检测基本类型，如 number、string、boolean 等。 
> 2. 检测函数、未定义类型和 symbol。 
> 3. 对于复杂类型（如数组、对象字面量），返回 "object"。 
> 4. 对于 null，返回 "object"。 

5.2、instanceof
>[!tip] 检测某个对象是否继承自某个构造函数的原型链。
> instanceof 操作符用于检测某个对象是否是另一个对象（构造函数）的实例，返回一个布尔值。 
> 1. 用于检测复杂类型，比如对象、数组、函数等。 
> 2. 检测某个对象是否继承自某个构造函数的原型链。 
 

::: details instanceof 示例

```javascript
console.log({} instanceof Object);           // true
console.log([] instanceof Array);            // true
console.log(function(){} instanceof Function); // true
console.log(new Date() instanceof Date);     // true

function MyClass() {}
let myInstance = new MyClass();
console.log(myInstance instanceof MyClass);  // true
```
:::




### 7、为什么 0.1 + 0.2 !== 0.3，如何让其相等？
>[!important] 原因
>- **存储不精确**：计算机只能存储二进制数字，在十进制转成二进制时，有些数字小数部分无限位数，无法精确表示。 
>- **显示不精确**：非常长的二进制数无法用十进制表示时会做近似处理。 
>- **计算不精确**：可能会放大或者缩小不精确做近似处理。 

::: tip 如何让其相等？
1. 使用 Number.EPSILON 作为误差范围，表示可接受的最小误差范围。
2. 使用 Number.toPrecision() 方法*指定精确位数*。
3. 使用toFixed() 方法，将结果四舍五入到指定的小数位数。
:::

::: details 解决方案示例
```javascript
//  1. 使用 Number.EPSILON 作为误差范围，表示可接受的最小误差范围。
function numbersAreEqual(num1, num2) {
  return Math.abs(num1 - num2) < Number.EPSILON;
}
console.log(numbersAreEqual(0.1 + 0.2, 0.3)); // 输出: true


//  2. 使用 Number.toPrecision() 方法指定精确位数。
let sum = 0.1 + 0.2;
let preciseSum = Number(sum.toPrecision(12)); // 12 是常用的精度位数
console.log(preciseSum === 0.3); // 输出: true


//  3. 使用toFixed() 方法，将结果四舍五入到指定的小数位数。
let sum = 0.1 + 0.2;
let roundedSum = Number(sum.toFixed(1)); // 注意: toFixed 返回字符串，所以需要转换为数字
console.log(roundedSum === 0.3); // 输出: true

```
:::


### 8、`==` 的强制类型转换规则

>[!note] 强制转换规则
>1. **null 和 undefined**：`null` 和 `undefined` 仅相等于自身和对方。
>2. **Boolean 类型**：如果有一个操作数是布尔值，JavaScript 会将布尔值转换为数字，然后再进行比较。
>3. **字符串和数字**：如果是字符串和数字比较，JavaScript 会将字符串转换为数字，然后再进行比较。
>4. **对象和原始类型**：如果有一个操作数是对象，另一个是原始类型，JS 会尝试调用对象的 `toPrimitive` 方法（`valueOf` 或 `toString`）将对象转换为原始类型，再进行比较。
>5. **符号和其他类型**：Symbol 类型只能与 Symbol 类型进行比较，与其他类型的比较总是返回 `false`。

>[!caution] 注意事项
>1. 空字符串：空字符串会被转换为数字 0 进行比较。 


::: details 强制转换示例
```javascript
console.log('' == 0); // true
console.log('' == false); // true

console.log(null == undefined); // true
console.log(null == null); // true
console.log(undefined == undefined); // true
console.log(null == 0); // false
console.log(undefined == 0); // false

console.log(true == 1); // true
console.log(false == 0); // true
console.log(true == 2); // false

console.log('42' == 42); // true
console.log('42' == '42'); // true
console.log('42' == 43); // false
console.log('0' == false); // true

console.log([1, 2] == '1,2'); // true
console.log([1] == 1); // true
console.log({} == '[object Object]'); // true

console.log(Symbol() == Symbol()); // false
console.log(Symbol() == 'symbol'); // false
console.log(Symbol() == false); // false
```
:::



### 9、其他类型的值转换成字符串的转换规则
>[!tip] 转换规则
>1. **null 和 undefined**：转换为字符串 "null" 和 "undefined"。
>2. **Boolean 类型**：true 转换为字符串 "true"，false 转换为字符串 "false"。
>3. **数字类型**：数字直接转换为字符串。
>4. **Symbol 类型**：Symbol 值只能显式转换为字符串，隐式转换会抛出错误。
>5. **对象类型**：调用对象的 `toString()` 方法，如果该方法返回非字符串值，则会递归调用 `toString()` 方法，直到返回一个字符串值。
>6. **函数类型**：调用函数的 `toString()` 方法，返回函数的代码字符串。

::: details 转换示例
```javascript
console.log(String(null));      // "null"
console.log(String(undefined)); // "undefined"

console.log(String(true));  // "true"
console.log(String(false)); // "false"

console.log(String(42));       // "42"
console.log(String(3.14));     // "3.14"
console.log(String(1e21));     // "1e+21"
console.log(String(1 / 7));    // "0.14285714285714285"

let sym = Symbol('desc');
console.log(String(sym));   // "Symbol(desc)"
console.log(sym.toString()); // "Symbol(desc)"
// console.log(sym + "");    // TypeError: Cannot convert a Symbol value to a string

let obj = {};
console.log(String(obj)); // "[object Object]"

let objWithToString = {
  toString() {
    return "custom object";
  }
};
console.log(String(objWithToString)); // "custom object"

function foo() {
  return "bar";
}
console.log(String(foo)); // "function foo() { return "bar"; }"
```
:::


### 10、其他类型的值转换成数值的转换规则
>[!tip] 转换规则
>1. **null 和 undefined**：转换为数字 0。
>2. **Boolean 类型**：true 转换为数字 1，false 转换为数字 0。
>3. **字符串类型**：字符串按照 Number() 函数进行转换。如果字符串包含非数字字符，则转换为 NaN，空字符串转换为 0。
>4. **Symbol 类型**：Symbol 值不能转换为数字，会抛出 TypeError。
>5. **对象类型**：调用对象的 valueOf() 方法，如果该方法返回基本类型值，则使用该值进行强制类型转换。如果没有 valueOf() 方法或其返回值不是基本类型，则使用 toString() 方法的返回值进行转换。如果 valueOf() 和 toString() 均不返回基本类型值，会产生 TypeError 错误。
>6. **数组类型**：数组在转换为数字时，会被首先转换为字符串，然后再根据字符串的转换规则进行转换。如果数组包含多个元素，结果通常为 NaN，因为转换后的字符串包含逗号分隔的元素。

::: details 转换示例
```javascript
console.log(Number(null));      // 0
console.log(Number(undefined)); // 0

console.log(Number(true));  // 1
console.log(Number(false)); // 0

console.log(Number("42"));        // 42
console.log(Number("3.14"));      // 3.14
console.log(Number(""));          // 0
console.log(Number("hello"));     // NaN
console.log(Number("42abc"));     // NaN

let sym = Symbol("desc");
console.log(Number(sym)); // TypeError: Cannot convert a Symbol value to a number

let obj1 = {
  valueOf() {
    return 42;
  }
};
console.log(Number(obj1)); // 42

let obj2 = {
  toString() {
    return "3.14";
  }
};
console.log(Number(obj2)); // 3.14

let obj3 = {
  valueOf() {
    return {};
  },
  toString() {
    return {};
  }
};
// console.log(Number(obj3)); // TypeError: Cannot convert object to primitive value

console.log(Number([1, 2, 3]));  // NaN
console.log(Number([42]));       // 42
console.log(Number([]));         // 0
console.log(Number(["3.14"]));   // 3.14
```
:::


:::tip 对象转换成数字

- 对象（包括数组）会首先被转换为相应的基本类型值，然后再根据基本类型值的转换规则进行强制转换。

1. JavaScript 尝试将对象转换为基本类型值。内部会首先检查该对象是否有 valueOf() 方法。
2. 如果 valueOf() 存在并返回基本类型值，则使用该值进行强制类型转换。
3. 如果没有 valueOf() 方法或其返回值不是基本类型，则使用 toString() 方法的返回值进行转换。
4. 如果 valueOf() 和 toString() 均不返回基本类型值，会产生 TypeError 错误。
:::


:::tip 数组的转换

数组在转换为数字时，会被首先转换为字符串，然后再根据字符串的转换规则进行转换。如果数组包含多个元素，结果通常为 NaN，因为转换后的字符串包含逗号分隔的元素。
:::


### 11、其他类型的值转换成布尔值的转换规则
>[!tip] 转换规则
>1. **null 和 undefined**：转换为布尔值 false。
>2. **Boolean 类型**：直接返回对应的布尔值。
>3. **数字类型**：除了 0 和 NaN 外，其他数字都转换为 true。
>4. **字符串类型**：除了空字符串外，其他字符串都转换为 true。
>5. **Symbol 类型**：Symbol 值不能转换为布尔值，会抛出 TypeError。
>6. **对象类型**：除了 null 和 undefined 外，其他对象都转换为 true。
>7. **数组类型**：除了空数组外，其他数组都转换为 true。
>8. **函数类型**：除了 null 和 undefined 外，其他函数都转换为 true。

>[!caution] 以下值转为布尔值时为 false
>1. `undefined`
>2. `null`
>3. `false`
>4. +0
>5. -0
>6. NaN
>7. ""（空字符串）

>[!important] 除了上述之外的所有值，在转换为布尔值时都会被转换为 true。包括：
>1. 非空字符串
>2. 非零数字（包括正数和负数）
>3. 对象（包括空对象）
>4. 数组（包括空数组）
>5. 函数

::: details 转换布尔值 示例
```javascript
//  布尔值为false的情况
console.log(Boolean(undefined)); // false
console.log(Boolean(null));      // false
console.log(Boolean(false));     // false
console.log(Boolean(0));         // false
console.log(Boolean(-0));        // false
console.log(Boolean(NaN));       // false
console.log(Boolean(""));        // false

//  布尔值为true的情况
console.log(Boolean("hello"));     // true
console.log(Boolean(42));          // true
console.log(Boolean(-42));         // true
console.log(Boolean({}));          // true
console.log(Boolean([]));          // true
console.log(Boolean(function(){}));// true

```
:::



### 12、JS 中 || 和 && 操作符的返回值是什么

::: tip 逻辑或 (||)
逻辑 或 || 会在找到第一个真值时立即返回该值。如果所有操作数都为假值，则返回最后一个操作数。具体规则如下：

1. 对第一个操作数进行条件判断。
2. 如果第一个操作数的条件判断结果为 true，则返回第一个操作数的值。
3. 如果第一个操作数的条件判断结果为 false，则返回第二个操作数的值。
:::

:::details 示例代码

```javascript
console.log(false || true);       // true
console.log(0 || 42);             // 42
console.log('' || 'default');     // "default"
console.log(null || 'fallback');  // "fallback"
console.log(undefined || 'ok');   // "ok"
console.log(false || 0 || 'foo'); // "foo"
console.log('' || 0 || NaN);      // NaN
```
:::

:::tip 逻辑与操作符 (&&)

逻辑与操作符 && 会在找到第一个假值时立即返回该值。如果所有操作数都为真值，则返回最后一个操作数。具体规则如下：

1. 对第一个操作数进行条件判断。
2. 如果第一个操作数的条件判断结果为 false，则返回第一个操作数的值。
3. 如果第一个操作数的条件判断结果为 true，则返回第二个操作数的值。
:::

:::details 示例代码
```javascript
console.log(true && false);       // false
console.log(42 && 0);             // 0
console.log('foo' && 'bar');      // "bar"
console.log('hello' && 123);      // 123
console.log(true && 'ok');        // "ok"
console.log(1 && 2 && 3);         // 3
console.log('' && 'fallback');    // ""
console.log(null && 'should not reach'); // null
```
:::

:::tip  两者区别
1. `|| 操作符`：返回第一个真值，或者在所有操作数均为假值时返回最后一个操作数。
2. `&& 操作符`：返回第一个假值，或者在所有操作数均为真值时返回最后一个操作数。
:::


### 13、Object.is() 与比较操作符 == 和 === 的区别是什么？

>[!tip] 双等号（==）
>双等号进行相等判断时，如果两边的类型不一致，则会进行类型转换后再进行比较，规则如下：
>1. 如果类型不同，会进行类型转换。
>2. 将 null 和 undefined 视为相等。
>3. 将布尔值转换为数字再进行比较。
>4. 将字符串和数字进行比较时，会将字符串转换为数字。
>5. 对象与原始类型进行比较时，会将对象转换为原始类型。

示例如下：

```javascript
console.log(2 == '2');       // true
console.log(null == undefined); // true
console.log(true == 1);      // true
console.log(false == 0);     // true
console.log('' == 0);        // true
console.log([1, 2] == '1,2'); // true
```

>[!tip] 三等号（===）
> 三等号进行相等判断时，不会进行类型转换。如果两边的类型不一致，则直接返回 false，规则如下：
>1. 如果类型不同，返回 false。
>2. 如果类型相同，再进行值的比较。

示例如下：

```javascript
console.log(2 === '2');       // false
console.log(null === undefined); // false
console.log(true === 1);      // false
console.log(false === 0);     // false
console.log('' === 0);        // false
console.log([1, 2] === '1,2'); // false
```

>[!tip] Object.is()

>Object.is() 在大多数情况下与三等号的行为相同，但它处理了一些特殊情况，如 -0 和 +0，以及 NaN，规则如下：
>1. 如果类型不同，返回 false。
>2. 如果类型相同，再进行值的比较。
>3. 特殊情况：-0 和 +0 不相等，两个 NaN 是相等的。

示例如下：

```javascript
console.log(Object.is(2, '2'));       // false
console.log(Object.is(null, undefined)); // false
console.log(Object.is(true, 1));      // false
console.log(Object.is(false, 0));     // false
console.log(Object.is('', 0));        // false
console.log(Object.is([1, 2], '1,2')); // false

console.log(Object.is(NaN, NaN));     // true
console.log(Object.is(+0, -0));       // false
console.log(Object.is(-0, -0));       // true
console.log(Object.is(+0, +0));       // true
```

>[!tip] 区别总结
>1. ==：进行类型转换后再比较，适用于宽松相等性判断。 
>2. ===：不进行类型转换，直接比较，适用于严格相等性判断。 
>3. Object.is()：与 === 类似，但处理了一些特殊情况，如 NaN 和 -0。



### 14、JS 中的包装类型
>[!tip] 定义
> - JS 中，原始值没有方法或属性，但为了能够使用方法和属性，JavaScript 提供了包装类型，使得原始值可以像对象一样被操作。
> - 当我们试图访问一个**原始值**的属性或方法时，JS 会在后台自动创建一个对应的包装对象，然后在该对象上调用方法或访问属性。一旦操作完成，这个临时创建的对象就会被销毁。
> - 包装类型包括 String、Number、Boolean 等。


::: details 包装类型示例
```javascript
let str = "hello";
console.log(str.toUpperCase()); // "HELLO"

let num = 42;
console.log(num.toFixed(2)); // "42.00"

let bool = true;
console.log(bool.toString()); // "true"


// 原始值和包装对象的类型是不同的
let strPrimitive = "hello";
let strObject = new String("hello");

console.log(typeof strPrimitive); // "string"
console.log(typeof strObject);    // "object"

console.log(strPrimitive === strObject); // false
console.log(strPrimitive == strObject);  // tr

```
:::

::: tip 原始值和包装对象的区别

- 虽然包装类型使得原始值可以像对象一样操作，但它们本质上是不同的。
- 原始值是不可变的，而包装对象是可变的。
- 原始值是原始类型的值，而包装对象是对应的对象类型，类型上是不同的。
:::


### 15、JavaScript 中如何进行隐式类型转换？
>[!tip] 定义
>- 隐式类型转换 : 也称为**类型强制转换**，是指 JS 在表达式求值时自动将一种数据类型转换为另一种数据类型的过程。

>[!tip] 隐式类型转换规则
>1. 转换为字符串 ：当 +运算符的一个操作数是字符串时，另一个操作数会被转换为字符串
>2. 转换为数字 ：在算术运算（除了 +）或比较运算中，值会被转换为数字
>3. 布尔上下文中的转换 ：在 `if`、`while`、`||`、`&&`、`!`、`for`等布尔上下文中，值会被转换为布尔值
>4. 相等比较 `==` 的转换 ：在相等比较中，值会被转换为相同的类型

::: details 隐式类型转换示例
```js

//  1. 转换为字符串
console.log(5 + "5"); // "55"（字符串拼接）
console.log("5" + 5); // "55"（字符串拼接）
console.log(5 + 5);   // 10（数值相加）
console.log(5 - "2"); // 3
console.log("6" * "2"); // 12
console.log("8" / 2); // 4
console.log("10" % 3); // 1

//  2. 转换为数字
console.log("5" - 2); // 3
console.log("5" * "2"); // 10
console.log("5" / 2); // 2.5
console.log(true + 1); // 2
console.log(null + 1); // 1
console.log(undefined + 1); // NaN

// 3. 布尔上下文中的转换

console.log(!0); // true（0 被转换为 false，然后取反为 true）
console.log(!1); // false（1 被转换为 true，然后取反为 false）
console.log(!""); // true（空字符串被转换为 false，然后取反为 true）
console.log(!"hello"); // false（非空字符串被转换为 true，然后取反为 false）
// 逻辑||
console.log(0 || 1); // 1（0 被转换为 false，因此返回第二个操作数 1）
console.log(1 || 0); // 1（1 被转换为 true，因此返回第一个操作数 1）
console.log(0 && 1); // 0（0 被转换为 false，因此返回第一个操作数 0）
console.log(1 && 2); // 2（1 被转换为 true，因此返回第二个操作数 2）
// 逻辑&&
console.log(0 || 1); // 1（0 被转换为 false，因此返回第二个操作数 1）
console.log(1 || 0); // 1（1 被转换为 true，因此返回第一个操作数 1）
console.log(0 && 1); // 0（0 被转换为 false，因此返回第一个操作数 0）
console.log(1 && 2); // 2（1 被转换为 true，因此返回第二个操作数 2）




// 4. 相等比较 == 的转换
console.log(1 == "1"); // true（字符串 "1" 被转换为数字 1）
console.log(0 == false); // true（false 被转换为数字 0）
console.log(1 == true); // true（true 被转换为数字 1）
console.log(null == undefined); // true
// 三等号 ===
console.log(5 === "5"); // false
console.log(false === 0); // false
console.log(true === 1); // false
console.log(null === undefined); // false


// 5. 其他隐式类型转换
console.log(5 > "2"); // true
console.log("6" < "12"); // false（字符串比较）
console.log("8" >= 8); // true
console.log("10" <= 20); // true
```
:::


### 16、Object.assign 和对象扩展运算符的区别
>[!important] 定义
>- Object.assign() 方法用于将所有可枚举属性的值从一个或多个源对象复制到目标对象，并返回目标对象。
>- 对象扩展运算符（...）是 ES6 引入的语法，它好比 rest 参数的逆运算，将一个数组转为用逗号分隔的参数序列。
>- Object.assign 和对象扩展运算符 ... 都是执行浅拷贝，即只复制对象的第一层属性，不会递归复制整个对象结构。对于需要深拷贝的情况，需要额外的处理逻辑来实现。



:::tip Object.assign

- Object.assign(target, ...sources)：将一个或多个源对象的所有可枚举属性复制到目标对象，并返回目标对象。也可以用于合并对象或复制对象属性到一个新的对象。 
- Object.assign 执行的是浅拷贝，即它只会复制对象的第一层属性。如果源对象的属性值是对象或数组等引用类型，只复制引用，不会递归复制整个引用对象。
- 如果多个源对象具有相同的属性，后续对象的属性会覆盖之前对象的属性。 
- 返回的是目标对象本身，而不是新创建的对象，示例如下：

:::

::: details Object.assign 示例
```javascript
const obj1 = { a: 1, b: { c: 2 } };
const obj2 = { b: { d: 3 }, e: 4 };

const mergedObj = Object.assign({}, obj1, obj2);
console.log(mergedObj); // { a: 1, b: { d: 3 }, e: 4 }
console.log(obj1.b === mergedObj.b); // true，浅拷贝只复制了对象的引用
```
:::

:::tip 对象扩展运算符
- 对象扩展运算符通常用于创建新的对象字面量或复制现有对象的属性到新对象中。也可以用于对象字面量、对象解构赋值、函数参数等场景。 
- 对象扩展运算符也执行浅拷贝。它只复制对象的第一层属性。 
- 如果多个源对象具有相同的属性，后续对象的属性会覆盖之前对象的属性。 
- 对象扩展运算符在对象字面量和对象解构赋值中使用时，会创建一个新的对象，示例如下：

:::

::: details 对象扩展运算符示例

```javascript
const obj1 = { a: 1, b: { c: 2 } };
const obj2 = { b: { d: 3 }, e: 4 };

const mergedObj = { ...obj1, ...obj2 };
console.log(mergedObj); // { a: 1, b: { d: 3 }, e: 4 }
console.log(obj1.b === mergedObj.b); // true，浅拷贝只复制了对象的引用
```
:::


:::tip 两者区别

- 无论是 Object.assign 还是对象扩展运算符 ...，它们都执行的是浅拷贝。这意味着它们只复制对象的第一层属性，对于对象属性值是对象或数组的情况，只复制引用，不会递归复制整个引用对象。
- 如果需要进行深拷贝（即递归复制整个对象树），则需要额外的逻辑来实现，比如自定义递归函数或使用第三方库（如 lodash 的 cloneDeep 方法）来实现深拷贝操作。

:::



## 语法篇

### 17、Map和Object的区别

|          | Map                        | Object                          |
| -------- | -------------------------- | ------------------------------- |
| 意外的键 | Map默认情况不包含任何键，只包含显式插入的键。                | Object 有一个原型, 原型链上的键名有可能和自己在对象上的设置的键名产生冲突。 |
| 键的类型 | Map的键可以是任意值，包括函数、对象或任意基本类型。          | 键只能是字符串或 Symbols（ES6 引入），对象的属性名会被自动转换为字符串类型。 |
| 键的顺序 | Map 中的 key 是有序的。因此，当迭代的时候， Map 对象以插入的顺序返回键值。 | 对象的属性没有固定的顺序，属性在内部存储时是无序的。         |
| Size     | Map 的键值对个数可以轻易地通过size 属性获取，大小和性能通常比对象更加可预测，因为 Map 是专为存储键值对而设计的数据结构。 | 在大多数情况下，对象的属性数量没有明确的限制。               |
| 迭代     | Map 是 iterable 的，所以可以直接被迭代。也提供了一些专门用于遍历和操作的方法，如 Map.prototype.keys(), Map.prototype.values(), Map.prototype.entries() 等。 | 迭代Object需要通过 Object.keys(), Object.values(), Object.entries() 等方法来遍历对象的属性。 |
| 性能     | 在频繁增删键值对的场景下表现更好。                           | 在频繁添加和删除键值对的场景下未作出优化。                   |

::: details obj 示例
```javascript
let obj = {
  name: 'Alice',
  age: 30,
};

obj.city = 'New York'; // 添加新属性
console.log(obj); // { name: 'Alice', age: 30, city: 'New York' }

delete obj.age; // 删除属性
console.log(obj); // { name: 'Alice', city: 'New York' }
```
:::

::: details map 示例

```javascript
let map = new Map();

map.set('name', 'Bob');
map.set(42, 'answer');
map.set(obj, 'object value');

console.log(map.get('name')); // 'Bob'
console.log(map.get(42)); // 'answer'
console.log(map.get(obj)); // 'object value'

map.delete('name');
console.log(map.has('name')); // false
```
:::



### 18、常用正则表达式

::: details 常用正则表达式
```js
// 1. 验证邮箱地址
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 2. 验证电话号码
const phoneRegex = /^\d{10}$/;

// 3. 验证邮政编码
const postalCodeRegex = /^[1-9]\d{5}$/;

// 4. 验证 URL
const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})(\/[\w .-]*)*\/?$/;

// 5. 验证日期（格式：YYYY-MM-DD）
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// 6. 匹配全是数字的字符串
const numberRegex = /^\d+$/;

// 7. 匹配全是字母的字符串
const alphabetRegex = /^[A-Za-z]+$/;

// 8. 验证密码（至少8个字符，且包括至少一个数字和一个字母）
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
```
:::

::: tip 扩展知识

（1）正则表达式的基本语法：

- `^` 表示字符串的开始，`$` 表示字符串的结束。
- `\d` 匹配一个数字，等价于 `[0-9]`。
- `\w` 匹配一个字母或数字字符，等价于 `[A-Za-z0-9_]`。
- `+` 匹配前面的子表达式一次或多次。例如，`\d+` 匹配一个或多个数字。

（2）常用正则表达式修饰符：

- `i`：执行不区分大小写的匹配。
- `g`：执行全局匹配（查找所有而非第一个匹配项）。
- `m`：执行多行匹配。

（3）JavaScript 中使用正则表达式的方法：

- `test()` 方法：在字符串中测试是否匹配一个模式，返回 `true` 或 `false`。
- `exec()` 方法：在字符串中执行一个搜索匹配，返回一个结果数组或 `null`。
- 字符串方法：www
  - `match()`：找到一个或多个正则表达式匹配。
  - `replace()`：在字符串中替换与正则表达式匹配的子串。
  - `split()`：使用正则表达式分隔字符串。


:::




### 19、什么是 DOM 和 BOM？

:::tip DOM（Document Object Model）文档对象模型。
- 是一个编程接口，它将 HTML 或 XML 文档表示为树结构。是把网页内容转换成 JavaScript 可以操作的对象。

1. DOM 的主要特点：
   - 它将文档解析为一个由节点和对象组成的结构集合。
   - 它定义了文档的结构，以及如何访问和操作文档。
2. DOM 的作用：
   - 允许程序和脚本动态地访问和更新文档的内容、结构和样式。
   - 提供了一种标准化的方式来操作网页内容。
3. 常见的 DOM 操作：
   - 获取元素：document.getElementById()、document.querySelector() 等
   - 修改元素内容：element.innerHTML、element.textContent 等
   - 修改元素样式：element.style.property
   - 添加或删除元素：document.createElement()、element.appendChild() 等
:::

:::tip BOM（Browser Object Model）浏览器对象模型。
- 提供了独立于内容的、可以与浏览器窗口进行互动的对象结构。是浏览器提供的用于操作浏览器的接口。


1. BOM 的主要组成部分：
   - window 对象：JavaScript 层级中的顶层对象，表示浏览器窗口。
   - navigator 对象：包含有关浏览器的信息。
   - location 对象：包含当前 URL 的信息。
   - history 对象：包含浏览器的历史记录。
   - screen 对象：包含有关用户屏幕的信息。
2. BOM 的作用：
   - 提供了与浏览器交互的方法和接口。
   - 允许 JavaScript 与浏览器对话。
3. 常见的 BOM 操作：
   - 打开新窗口：window.open()
   - 移动、调整窗口大小：window.moveTo()、window.resizeTo()
   - 导航到其他 URL：window.location.href = "[http://example.com](http://example.com/)"
   - 获取浏览器信息：navigator.userAgent
   - 操作浏览历史：history.back()、history.forward()
:::

:::tip DOM 和 BOM 的主要区别：

1. DOM 主要处理网页内容，而 BOM 处理浏览器窗口和功能。
2. DOM 是 W3C 标准，而 BOM 没有相关标准。
3. DOM 可以在任何支持 XML 的环境中使用，而 BOM 只能在浏览器环境中使用。
:::



### 20、如何判断一个对象是否属于某个类？

#### 1）instanceof 运算符

instanceof 运算符用于检测构造函数的 prototype 属性是否出现在某个实例对象的原型链上。

```javascript
class Animal {}
class Dog extends Animal {}

const dog = new Dog();

console.log(dog instanceof Dog);     // true
console.log(dog instanceof Animal);  // true
console.log(dog instanceof Object);  // true
```

#### 2）constructor 属性

每个对象都有一个 constructor 属性，指向创建该对象的构造函数。

```javascript
console.log(dog.constructor === Dog);  // true
```

#### 3）Object.prototype.isPrototypeOf() 方法

这个方法用于测试一个对象是否存在于另一个对象的原型链上。

```javascript
console.log(Dog.prototype.isPrototypeOf(dog));    // true
console.log(Animal.prototype.isPrototypeOf(dog)); // true
```

#### 4）Object.getPrototypeOf() 方法

这个方法返回指定对象的原型。

```javascript
console.log(Object.getPrototypeOf(dog) === Dog.prototype);  // true
```

#### 5）自定义类型检查函数

有时候，我们可能需要更精确的类型检查。这时可以自定义一个函数：

```javascript
function isDog(obj) {
  return obj && typeof obj === 'object' && obj.constructor === Dog;
}

console.log(isDog(dog));  // true
```

#### 6）Symbol.hasInstance

ES6 引入了 `Symbol.hasInstance` 方法，允许类自定义 `instanceof` 的行为。

```javascript
class MyClass {
  static [Symbol.hasInstance](instance) {
    return Array.isArray(instance);
  }
}

console.log([] instanceof MyClass);  // true
```

需要注意的是，这些方法各有优缺点：

- `instanceof` 和 `isPrototypeOf()` 可以检查整个原型链，但可能会受到原型链被修改的影响。
- `constructor` 属性可以被重写，因此不总是可靠。
- `Object.getPrototypeOf()` 更可靠，但只检查直接原型。
- 自定义函数可以提供最精确的检查，但需要为每个类型单独实现。

在实际开发中，选择哪种方法取决于具体的需求和上下文。通常，`instanceof` 是最常用的方法，因为它简单直观，并且能够处理继承关系。



###  21、isNaN 和 Number.isNaN 函数有什么区别？
:::tip
- isNaN 函数会先尝试将传入的参数转换为数字，然后检查转换后的值是否为 NaN。
- 它不仅检测 NaN 本身，还会将那些不能转换为有效数字的值视为 NaN。
- Number.isNaN 函数不会进行类型转换，只会在参数本身是 NaN 的情况下返回 true。它更为严格，只有传入的值是 NaN 时才会返回 true。
:::


```javascript
console.log(isNaN(NaN));          // 输出: true
console.log(isNaN('hello'));      // 输出: true
console.log(isNaN(undefined));    // 输出: true
console.log(isNaN({}));           // 输出: true
console.log(isNaN(123));          // 输出: false
console.log(isNaN('123'));        // 输出: false
```


```javascript
console.log(Number.isNaN(NaN));          // 输出: true
console.log(Number.isNaN('hello'));      // 输出: false
console.log(Number.isNaN(undefined));    // 输出: false
console.log(Number.isNaN({}));           // 输出: false
console.log(Number.isNaN(123));          // 输出: false
console.log(Number.isNaN('123'));        // 输出: false
```





### 22、ajax、axios、fetch 的区别是什么？

Ajax、axios 和 fetch 是用于进行 HTTP 请求的三种常见方式。

::: tip Ajax

Ajax 不是一种单一的技术，而是一种使用现有技术集合的方法。它最常见的实现是使用 XMLHttpRequest (XHR) 对象。

- 是最早的异步请求解决方案
- 可以与服务器交换数据并更新部分网页内容，而无需重新加载整个页面
- 使用回调函数处理响应
- 不支持 Promise
:::


::: details Ajax  XMLHttpRequest 示例
```javascript
var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://api.example.com/data', true);
xhr.onreadystatechange = function() {
  if (xhr.readyState == 4 && xhr.status == 200) {
    console.log(xhr.responseText);
  }
};
xhr.send();
```
:::

::: tip Fetch
- Fetch 是较新的 API，旨在替代 XMLHttpRequest。它是基于 Promise 的。
- 语法更简洁，使用起来更加直观
- 基于 Promise，支持 async/await
- 原生支持，不需要额外的库
- 不会自动拒绝 HTTP 错误状态
:::

::: details Fetch 示例

```javascript
fetch('https://api.example.com/data')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```
:::

::: tip Axios

- Axios 是一个基于 Promise 的 HTTP 客户端，可以用于浏览器和 Node.js。 特点：
- 支持浏览器和 Node.js
- 自动转换 JSON 数据
- 可以拦截请求和响应
- 可以取消请求
- 自动转换 JSON 数据
- 客户端支持防御 XSRF
:::


::: details Axios 示例

```javascript
axios.get('https://api.example.com/data')
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

:::


>[!important] Ajax 、 Axios 、 Fetch 三者的主要区别
>- 语法和使用方式
>   - Ajax 使用回调函数
>   - Fetch 使用 Promise
>   - Axios 也使用 Promise，但提供了更简洁的 API
>- 错误处理
>   - Fetch 不会自动抛出错误，即使响应状态为 404 或 500
>   - Axios 会在响应状态不在 2xx 范围内时自动抛出错误
>- 请求取消
>   - Fetch 需要使用 AbortController
>   - Axios 提供了取消请求的方法
>- 浏览器支持
>   - Ajax (XMLHttpRequest) 支持所有现代浏览器
>   - Fetch 不支持一些旧版浏览器（如 IE11）
>   - Axios 通过适当的 polyfill 可以支持更广泛的浏览器
>- 功能丰富度
>   - Axios 提供了更多的功能，如拦截器、自动转换 JSON 等
>   - Fetch 可能就足够了。如果需要更多功能和更好的错误处理，Axios 是一个很好的选择。



### 23、mouseover 和 mouseenter 事件的区别是什么？

>[!note] mouseover 和 mouseenter 的区别
>- **事件冒泡**
>   - `mouseover` 会冒泡，即当鼠标指针从子元素移出到父元素时也会触发；
>   - `mouseenter` 不会冒泡，即只在进入元素时触发，不影响其它元素的事件。
>- **触发条件**
>   - `mouseover` 在鼠标指针进入元素或元素的子元素时会触发，即当鼠标指针从元素外部移入元素边界时触发；
>   - `mouseenter` 只在鼠标指针进入元素时触发，不会在进入元素的子元素时触发。
>- **使用场景**
>   - 如果希望在鼠标进入元素及其子元素时都触发事件，可以使用 mouseover。
>   - 如果只想在鼠标进入元素本身时触发事件，可以使用 mouseenter。


>[!caution] 当鼠标从父元素移动到子元素时
>- `mouseover` 会在子元素和父元素上都触发
>- `mouseenter` 只会在最初进入父元素时触发一次


:::details mouseover 和 mouseenter 示例
```javascript
const parent = document.getElementById('parent');
const child = document.getElementById('child');

parent.addEventListener('mouseover', () => {
  console.log('Parent mouseover');
});

parent.addEventListener('mouseenter', () => {
  console.log('Parent mouseenter');
});

child.addEventListener('mouseover', () => {
  console.log('Child mouseover');
});

child.addEventListener('mouseenter', () => {
  console.log('Child mouseenter');
});
```
:::





