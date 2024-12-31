# JS基础面试题



## 1、JavaScript 有哪些数据类型？它们的区别是什么？

> JavaScript 有八种基本数据类型，分为原始类型（Primitive Types）和引用类型（Reference Types）：

#### 原始类型

1）Undefined：表示变量未初始化。一个变量声明后但未赋值时，它的默认值是 undefined。 
2）Null：表示一个空的值或一个不存在的对象。null 是一个特殊的关键字，它代表“无值”。 
3）Boolean：只有两个值：true 和 false，用于逻辑判断。 
4）Number：表示双精度 64 位二进制格式的浮点数，可以表示整数和浮点数。特殊值包括 NaN（Not a Number）和 Infinity。 
5）String：表示字符序列，可以用单引号、双引号或反引号括起来的文本。 
6）Symbol：用来创建唯一且不可变的值，主要用于对象属性的唯一标识，避免属性名冲突。 
7）BigInt：用于表示任意精度的大整数，允许操作超过 Number 能表示的范围的整数。

#### 引用类型

Object（包括普通对象、数组、函数等）

#### 两者区别

##### **存储区别** 

1）原始类型存储在栈（stack）中，值直接保存在变量访问的位置，由于其大小固定且频繁使用，存储在栈中具有更高的性能。 
2）引用类型存储在堆（heap）中，占用空间较大且大小不固定，变量保存的是对实际对象的引用（即指针），这些引用存储在栈中。 

##### **赋值方式区别** 

1）原始类型：复制的是值本身。例如，将一个 number 类型的变量赋值给另一个变量，两个变量互不影响。 
2）引用类型：复制的是引用（指针）。多个变量引用同一个对象时，一个变量的修改会影响其他变量。

#### 扩展知识点

**类型检测** 
1）使用 typeof 检查原始类型（例如：typeof 123 === "number"）。

2）使用 instanceof 检查引用类型（例如：[] instanceof Array === true） 

3）null 是一个特殊情况，typeof null 返回 "object"，这是 JavaScript 早期实现中的一个 bug，但被保留了下来。 

**类型转换** 
1）自动类型转换：如字符串与数字相加时，数字会被转换为字符串。 
2）显式类型转换：使用 Number()、String()、Boolean() 等函数将值转换为指定类型。 

**堆和栈的区别** 
1）栈：内存分配效率高，自动管理（由编译器分配和释放）。 
2）堆：内存分配灵活，但需要由开发者手动管理内存（通过垃圾回收机制）。



##  2、如何判断 JavaScript 变量是数组？

1）使用 **Object.prototype.toString.call()** 做判断 这是一个通用的类型判断方法，适用于判断各种数据类型，Object.prototype.toString.call(obj) 会返回一个类似 [object Array]· 的字符串，通过切片操作获取其中的类型部分并与 'Array' 比较，示例如下：

```javascript
Object.prototype.toString.call(obj).slice(8,-1) === 'Array';
```

2）通过原型链做判断 通过检查对象的原型链是否指向 Array.prototype，但是直接访问 **proto** 不推荐，因为它是非标准属性，虽然现在大多数浏览器都支持，示例如下：

```javascript
obj.__proto__ === Array.prototype;
```

3）使用 ES6 的 **Array.isArray()** 判断 这是 ES6 中新增的方法，专门用于判断一个变量是否为数组，非常简洁且可靠，示例如下：

```javascript
  Array.isArray(obj);
```

4）使用 **instanceof** 做判断 比较常用的原型链判断方法，示例如下：

```javascript
obj instanceof Array
```

5）使用 **Array.prototype.isPrototypeOf** 检查 Array.prototype 是否存在于对象的原型链中，示例如下：

```javascript
Array.prototype.isPrototypeOf(obj)
```



## 3、null 和 undefined 的区别是什么？

undefined 是 JavaScript 的一种内置数据类型，表示变量声明了但未赋值。null 同样是一种内置数据类型，表示一个空对象引用。

#### 两者区别

##### **类型检测** 

1）使用 typeof 检测 undefined 会返回 "undefined"。 

2）使用 typeof 检测 null 会返回 "object"，这是一个历史遗留问题。

```javascript
console.log(typeof undefined); // 输出: "undefined"
console.log(typeof null); // 输出: "object"
```

##### **比较操作** 

1）undefined 和 null 使用双等号 == 比较时会被认为相等，因为它们都代表“没有值”的概念。 

2）使用严格等号 === 比较时，它们是不相等的，因为它们是不同类型的值。

```javascript
console.log(undefined == null); // 输出: true
console.log(undefined === null); // 输出: false
```

##### **变量赋值** 

1）undefined 是 JavaScript 引擎自动赋予未赋值变量的值，而 null 是开发者显式赋值以表示变量没有值。

```javascript
let x; // 未赋值，默认是 undefined
let y = null; // 明确赋值为 null
```



## 4、为什么 typeof null 是 "object"？

1）JavaScript 在最初设计时，使用了32位系统。为了优化性能，JavaScript 的值被存储为二进制数据，低位用来表示数据的类型。 

2）对象的类型标识符是 000，而 null 被认为是一个空指针（即零地址），它的二进制表示全是 0，也即 00000000。 

3）由于 null 的二进制表示和对象的类型标识符相同，typeof null 结果就被错误地设置为 "object"。

4）尽管这个错误很早就被发现，但为了保持向后兼容性，修复这个错误会导致大量现有代码出错。因此，这个行为被保留下来了。

#### 运行示例

```javascript
console.log(typeof null); // 输出: "object
```

#### 判断 null 的正确方法

1）**直接比较** 最简单的方法是直接使用严格相等 === 进行比较，示例如下：

```javascript
let value = null;
console.log(value === null); // 输出: true
```

2）使用 == 比较 使用 == 也可以，但不推荐，因为它会进行类型转换，示例如下：

```javascript
let value = null;
console.log(value == null); // 输出: true
```



## 5、typeof 和 instanceof 有什么区别？

typeof 和 instanceof 是 JavaScript 中用于检查变量类型的两个关键字，但它们的使用场景和功能有所不同。

#### typeof

typeof 操作符用于检测变量的类型，返回一个字符串，表示操作数的数据类型，常见的返回值如下： 

1）"undefined"：表示值未定义。 

2）"boolean"：表示布尔值。 

3）"number"：表示数字。 

4）"string"：表示字符串。 

5）"object"：表示对象（包括 null，数组，对象字面量等）。 

6）"function"：表示函数。 

7）"symbol"：表示符号（ES6 引入）。 

8）"bigint"：表示大整数（ES11 引入）。 示例如下：

```javascript
console.log(typeof undefined); // "undefined"
console.log(typeof true);      // "boolean"
console.log(typeof 42);        // "number"
console.log(typeof "hello");   // "string"
console.log(typeof {});        // "object"
console.log(typeof []);        // "object"
console.log(typeof null);      // "object" (特殊情况)
console.log(typeof function(){}); // "function"
console.log(typeof Symbol());  // "symbol"
console.log(typeof 10n);       // "bigint"
```

#### instanceof

instanceof 操作符用于检测某个对象是否是另一个对象（构造函数）的实例，返回一个布尔值，一些使用场景如下： 

1）用于检测复杂类型，比如对象、数组、函数等。 

2）检测某个对象是否继承自某个构造函数的原型链。 示例如下：

```javascript
console.log({} instanceof Object);           // true
console.log([] instanceof Array);            // true
console.log(function(){} instanceof Function); // true
console.log(new Date() instanceof Date);     // true

function MyClass() {}
let myInstance = new MyClass();
console.log(myInstance instanceof MyClass);  // true
```

#### 两者区别

1）检测类型的范围：typeof 主要用于检测基本数据类型（如 number，string，boolean 等）以及函数、未定义类型和 symbol，而 instanceof 主要用于检测对象的具体类型，检查某个对象是否是某个构造函数的实例。 

2）检测基本类型和引用类型：typeof 对于基本类型非常有用，但对于复杂引用类型（如数组、对象字面量）只会返回 "object"，而 instanceof 只能用于引用类型，不能用于检测基本数据类型。 

3）特殊情况：typeof null 返回 "object"，这是一个 JavaScript 语言的历史遗留问题，而 instanceof 可以用来检测自定义对象的类型，通过检查原型链来确认实例关系。

#### 示例代码

```javascript
let num = 42;
console.log(typeof num);          // "number"
console.log(num instanceof Number); // false (因为 num 是基本类型)

let str = new String("hello");
console.log(typeof str);          // "object"
console.log(str instanceof String); // true (因为 str 是 String 对象的实例)

let arr = [1, 2, 3];
console.log(typeof arr);          // "object"
console.log(arr instanceof Array); // true
```



## 6、为什么 JavaScript 中 0.1 + 0.2 !== 0.3，如何让其相等？

在 JavaScript 中，数字是以二进制浮点数表示的。这种表示方式会导致某些十进制小数在二进制下无法精确表示，例如 0.1 和 0.2。它们在二进制中是无限循环的小数，示例如下：

```
0.1 的二进制表示约为：0.0001100110011001100110011001100110011001100110011001101...

0.2 的二进制表示约为：0.001100110011001100110011001100110011001100110011001101...
```

将这些二进制数相加时，由于精度限制，结果不能完全精确地表示为 0.3，而是一个非常接近的值：0.30000000000000004。

#### 如何让其相等？

1）使用误差范围 一个常见的解决方案是设置一个误差范围，通常称为“机器精度”。在 JavaScript 中，这个值为 Number.EPSILON，它表示可接受的最小误差范围，示例如下：

```javascript
function numbersAreEqual(num1, num2) {
  return Math.abs(num1 - num2) < Number.EPSILON;
}
console.log(numbersAreEqual(0.1 + 0.2, 0.3)); // 输出: true
```

2）使用 toFixed() 方法 将结果四舍五入到指定的小数位数。toFixed() 方法会返回一个字符串类型的结果，因此需要注意类型转换，示例如下：

```javascript
let sum = 0.1 + 0.2;
let roundedSum = Number(sum.toFixed(1)); // 注意: toFixed 返回字符串，所以需要转换为数字
console.log(roundedSum === 0.3); // 输出: true
```

3）使用 Number.toPrecision() 方法 toPrecision() 方法也可以用于格式化数字并减少精度问题，示例如下：

```javascript
let sum = 0.1 + 0.2;
let preciseSum = Number(sum.toPrecision(12)); // 12 是常用的精度位数
console.log(preciseSum === 0.3); // 输出: true
```



## 7、如何获取安全的 undefined 值？

使用 void 运算符对其后的表达式进行求值，然后返回 undefined。因为 void 运算符总是返回 undefined，而且 0 是一个非常短的常量表达式，所以 void 0 是一种简洁且安全的方式来获得 undefined，示例如下：

```javascript
let safeUndefined = void 0;

console.log(safeUndefined); // 输出: undefined
```



## 8、== 操作符的强制类型转换规则是什么？

== 会在比较两个值时进行强制类型转换。这种类型转换遵循一套规则，使得不同类型的值可以相互比较。

#### 强制转换规则

1）null 和 undefined：null 和 undefined 仅相等于自身和对方，示例如下：

```javascript
console.log(null == undefined); // true
console.log(null == null); // true
console.log(undefined == undefined); // true
console.log(null == 0); // false
console.log(undefined == 0); // false
```

3）Boolean 类型：如果有一个操作数是布尔值，JavaScript 会将布尔值转换为数字，然后再进行比较，示例如下：

```javascript
console.log(true == 1); // true
console.log(false == 0); // true
console.log(true == 2); // false
```

4）字符串和数字：如果是字符串和数字比较，JavaScript 会将字符串转换为数字，然后再进行比较，示例如下：

```javascript
console.log('42' == 42); // true
console.log('42' == '42'); // true
console.log('42' == 43); // false
console.log('0' == false); // true
```

5）对象和原始类型：如果有一个操作数是对象，另一个是原始类型（字符串、数字、布尔值），JavaScript 会尝试调用对象的 toPrimitive 方法（valueOf 或 toString）将对象转换为原始类型，然后再进行比较，示例如下：

```javascript
console.log([1, 2] == '1,2'); // true
console.log([1] == 1); // true
console.log({} == '[object Object]'); // true
```

6）符号和其他类型：Symbol 类型只能与 Symbol 类型进行比较，与其他类型的比较总是返回 false，示例如下：

```javascript
console.log(Symbol() == Symbol()); // false
console.log(Symbol() == 'symbol'); // false
console.log(Symbol() == false); // false
```

#### 特殊情况

1）空字符串：空字符串会被转换为数字 0 进行比较，示例如下：

```javascript
console.log('' == 0); // true
console.log('' == false); // true
```

2）对象转换为原始类型：对象的比较会触发类型转换，通过调用 toPrimitive 方法（valueOf 或 toString），转换为原始类型后再比较，示例如下：

```javascript
let obj = { toString: () => '42' };
console.log(obj == '42'); // true
console.log(obj == 42); // true
```

#### 拓展知识

== 操作符在比较两个不同类型的值时，会根据上述规则进行类型转换。这些规则可以导致一些意想不到的结果，因此在进行值比较时，需要格外小心。如果希望避免这些复杂的类型转换规则，推荐使用严格相等操作符 ===，它不进行类型转换，仅在值和类型都相等时才返回 true 。



## 9、其他类型的值转换成字符串的转换规则是什么？

#### A、基本数据类型转换成字符串

1）Null 和 Undefined 类型 null 转换为字符串 "null"，undefined 转换为字符串 "undefined"，示例如下：

```javascript
console.log(String(null));      // "null"
console.log(String(undefined)); // "undefined"
```

2）Boolean 类型 true 转换为字符串 "true"，false 转换为字符串 "false"，示例如下：

```javascript
console.log(String(true));  // "true"
console.log(String(false)); // "false"
```

3）Number 类型 数字直接转换为字符串，极小或极大的数字使用指数形式，示例如下：

```javascript
console.log(String(42));       // "42"
console.log(String(3.14));     // "3.14"
console.log(String(1e21));     // "1e+21"
console.log(String(1 / 7));    // "0.14285714285714285"
```

4）Symbol 类型 Symbol 值只能显式转换为字符串，隐式转换会抛出错误，示例如下：

```javascript
let sym = Symbol('desc');
console.log(String(sym));   // "Symbol(desc)"
console.log(sym.toString()); // "Symbol(desc)"
// console.log(sym + "");    // TypeError: Cannot convert a Symbol value to a string
```

#### **B、对象转换成字符串**

1）普通对象 如果对象没有自定义 toString() 方法，会调用 Object.prototype.toString() 返回 "[object Object]"。如果对象有自己的 toString() 方法，字符串化时会调用该方法并使用其返回值，示例如下：

```javascript
let obj = {};
console.log(String(obj)); // "[object Object]"

let objWithToString = {
  toString() {
    return "custom object";
  }
};
console.log(String(objWithToString)); // "custom object"
```

2）数组对象 数组调用默认的 toString() 方法，会将数组元素转换为字符串并以逗号分隔，示例如下：

```javascript
let arr = [1, 2, 3];
console.log(String(arr)); // "1,2,3"
```

3）日期对象 日期对象调用 toString() 方法，会返回日期的字符串表示，示例如下：

```javascript
let date = new Date();
console.log(String(date)); // "Wed Jun 28 2023 10:30:45 GMT+0200 (Central European Summer Time)"
```

4）函数对象 调用 Function.prototype.toString()，返回函数的代码字符串，示例如下：

```javascript
function foo() {
  return "bar";
}
console.log(String(foo)); // "function foo() { return "bar"; }"
```



## 10、 其他值到数字值的转换规则是什么？

#### 基本数据类型转换成数字

1）Undefined 类型 undefined 转换为 NaN，示例如下：

```javascript
console.log(Number(undefined)); // NaN
```

2）Null 类型 null 转换为 0，示例如下：

```javascript
console.log(Number(null)); // 0
```

3）Boolean 类型 true 转换为 1，false 转换为 0，示例如下：

```javascript
console.log(Number(true));  // 1
console.log(Number(false)); // 0
```

4）String 类型 字符串按照 Number() 函数进行转换。如果字符串包含非数字字符，则转换为 NaN，空字符串转换为 0，示例如下：

```javascript
console.log(Number("42"));        // 42
console.log(Number("3.14"));      // 3.14
console.log(Number(""));          // 0
console.log(Number("hello"));     // NaN
console.log(Number("42abc"));     // NaN
```

5）Symbol 类型 Symbol 值不能转换为数字，会抛出 TypeError，示例如下：

```javascript
let sym = Symbol("desc");
// console.log(Number(sym)); // TypeError: Cannot convert a Symbol value to a number
```

#### 对象转换成数字

对象（包括数组）会首先被转换为相应的基本类型值，然后再根据基本类型值的转换规则进行强制转换，步骤如下：

1. JavaScript 尝试将对象转换为基本类型值。内部会首先检查该对象是否有 valueOf() 方法。
2. 如果 valueOf() 存在并返回基本类型值，则使用该值进行强制类型转换。
3. 如果没有 valueOf() 方法或其返回值不是基本类型，则使用 toString() 方法的返回值进行转换。
4. 如果 valueOf() 和 toString() 均不返回基本类型值，会产生 TypeError 错误。

示例代码如下：

```javascript
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
```

#### 数组的转换

数组在转换为数字时，会被首先转换为字符串，然后再根据字符串的转换规则进行转换。如果数组包含多个元素，结果通常为 NaN，因为转换后的字符串包含逗号分隔的元素，示例如下：

```javascript
console.log(Number([1, 2, 3]));  // NaN
console.log(Number([42]));       // 42
console.log(Number([]));         // 0
console.log(Number(["3.14"]));   // 3.14
```



## 11、其他值到布尔值的转换规则是什么？

以下值在转换为布尔值时会被转换为 false：

1. undefined
2. null
3. false
4. +0
5. -0
6. NaN
7. ""（空字符串）

示例代码如下：

```javascript
console.log(Boolean(undefined)); // false
console.log(Boolean(null));      // false
console.log(Boolean(false));     // false
console.log(Boolean(0));         // false
console.log(Boolean(-0));        // false
console.log(Boolean(NaN));       // false
console.log(Boolean(""));        // false
```

除了上述之外的所有值，在转换为布尔值时都会被转换为 true。这包括：

1. 非空字符串
2. 非零数字（包括正数和负数）
3. 对象（包括空对象）
4. 数组（包括空数组）
5. 函数

示例代码如下：

```javascript
console.log(Boolean("hello"));     // true
console.log(Boolean(42));          // true
console.log(Boolean(-42));         // true
console.log(Boolean({}));          // true
console.log(Boolean([]));          // true
console.log(Boolean(function(){}));// true
```



##  12、JavaScript 中 || 和 && 操作符的返回值是什么

#### 逻辑或操作符 (||)

逻辑或操作符 || 会在找到第一个真值时立即返回该值。如果所有操作数都为假值，则返回最后一个操作数。具体规则如下：

1. 对第一个操作数进行条件判断。
2. 如果第一个操作数的条件判断结果为 true，则返回第一个操作数的值。
3. 如果第一个操作数的条件判断结果为 false，则返回第二个操作数的值。

示例代码如下：

```javascript
console.log(false || true);       // true
console.log(0 || 42);             // 42
console.log('' || 'default');     // "default"
console.log(null || 'fallback');  // "fallback"
console.log(undefined || 'ok');   // "ok"
console.log(false || 0 || 'foo'); // "foo"
console.log('' || 0 || NaN);      // NaN
```

#### 逻辑与操作符 (&&)

逻辑与操作符 && 会在找到第一个假值时立即返回该值。如果所有操作数都为真值，则返回最后一个操作数。具体规则如下：

1. 对第一个操作数进行条件判断。
2. 如果第一个操作数的条件判断结果为 false，则返回第一个操作数的值。
3. 如果第一个操作数的条件判断结果为 true，则返回第二个操作数的值。

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

#### 两者区别

1）|| 操作符：返回第一个真值，或者在所有操作数均为假值时返回最后一个操作数。

2）&& 操作符：返回第一个假值，或者在所有操作数均为真值时返回最后一个操作数。



## 13、Object.is() 与比较操作符 == 和 === 的区别是什么？

### 双等号（==）

双等号进行相等判断时，如果两边的类型不一致，则会进行类型转换后再进行比较，规则如下：

1. 如果类型不同，会进行类型转换。
2. 将 null 和 undefined 视为相等。
3. 将布尔值转换为数字再进行比较。
4. 将字符串和数字进行比较时，会将字符串转换为数字。
5. 对象与原始类型进行比较时，会将对象转换为原始类型。

示例如下：

```javascript
console.log(2 == '2');       // true
console.log(null == undefined); // true
console.log(true == 1);      // true
console.log(false == 0);     // true
console.log('' == 0);        // true
console.log([1, 2] == '1,2'); // true
```

### 三等号（===）

三等号进行相等判断时，不会进行类型转换。如果两边的类型不一致，则直接返回 false，规则如下：

1. 如果类型不同，返回 false。
2. 如果类型相同，再进行值的比较。

示例如下：

```javascript
console.log(2 === '2');       // false
console.log(null === undefined); // false
console.log(true === 1);      // false
console.log(false === 0);     // false
console.log('' === 0);        // false
console.log([1, 2] === '1,2'); // false
```

### Object.is()

Object.is() 在大多数情况下与三等号的行为相同，但它处理了一些特殊情况，如 -0 和 +0，以及 NaN，规则如下：

1. 如果类型不同，返回 false。
2. 如果类型相同，再进行值的比较。
3. 特殊情况：-0 和 +0 不相等，两个 NaN 是相等的。

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

#### 区别总结

1）==：进行类型转换后再比较，适用于宽松相等性判断。 

2）===：不进行类型转换，直接比较，适用于严格相等性判断。 

3）Object.is()：与 === 类似，但处理了一些特殊情况，如 NaN 和 -0。



## 14、什么是 JavaScript 中的包装类型？

JavaScript 中，原始值没有方法或属性，但为了能够使用方法和属性，JavaScript 提供了包装类型，使得原始值可以像对象一样被操作。

#### 概念

包装类型是 JavaScript 中的一种机制，它允许原始值临时拥有对象的属性和方法。JavaScript 提供了三个包装类型：

1. String
2. Number
3. Boolean

这些包装类型分别对应于原始值 string、number 和 boolean。

#### 包装类型的行为

> 当你试图访问一个原始值的属性或方法时，JavaScript 会在后台自动创建一个对应的包装对象，然后在该对象上调用方法或访问属性。一旦操作完成，这个临时创建的对象就会被销毁，示例如下：

```javascript
let str = "hello";
console.log(str.toUpperCase()); // "HELLO"

let num = 42;
console.log(num.toFixed(2)); // "42.00"

let bool = true;
console.log(bool.toString()); // "true"
```

#### 原始值和包装对象的区别

虽然包装类型使得原始值可以像对象一样操作，但它们本质上是不同的，示例如下：

```javascript
let strPrimitive = "hello";
let strObject = new String("hello");

console.log(typeof strPrimitive); // "string"
console.log(typeof strObject);    // "object"

console.log(strPrimitive === strObject); // false
console.log(strPrimitive == strObject);  // tr
```

这个例子中，strPrimitive 是一个原始值，而 strObject 是一个 String 对象。它们在类型上是不同的，严格相等（`===`）比较时会返回 false，但宽松相等（`==`）比较时会返回 true，因为 strObject 会被转换为原始值进行比较。



## 15、JavaScript 中如何进行隐式类型转换？

> 隐式类型转换也称为类型强制转换，是指 JavaScript 在表达式求值时自动将一种数据类型转换为另一种数据类型的过程。隐式类型转换主要发生在以下三种情况下：
>
> 算术运算、比较运算和逻辑运算。常见的隐式类型转换规则如下： 

1）算术运算 在算术运算中，JavaScript 会将操作数转换为数字类型，示例如下：

```js
console.log(5 + "5"); // "55"（字符串拼接）
console.log("5" + 5); // "55"（字符串拼接）
console.log(5 + 5);   // 10（数值相加）
console.log(5 - "2"); // 3
console.log("6" * "2"); // 12
console.log("8" / 2); // 4
console.log("10" % 3); // 1
```

2）比较运算 在比较运算中，JavaScript 会将操作数转换为相同的类型再进行比较，示例如下：

```js
// 双等号 ==
console.log(5 == "5"); // true（字符串 "5" 被转换为数字 5）
console.log(false == 0); // true（false 被转换为数字 0）
console.log(true == 1); // true（true 被转换为数字 1）
console.log(null == undefined); // true
// 三等号 ===
console.log(5 === "5"); // false
console.log(false === 0); // false
console.log(true === 1); // false
console.log(null === undefined); // false
```

3）其他比较运算符 对于其他比较运算符（>、<、>=、<=），操作数会被转换为数字或字符串，示例如下：

```js
console.log(5 > "2"); // true
console.log("6" < "12"); // false（字符串比较）
console.log("8" >= 8); // true
console.log("10" <= 20); // true
```

4）逻辑运算

```js
// 逻辑！
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
```

5）字符串与数字之间的转换 字符串和数字之间的隐式转换在很多情况下都会发生，示例如下：

```javascript
console.log("5" - 2); // 3（"5" 被转换为数字 5，然后 5 - 2 = 3）
console.log("5" * "2"); // 10（两个字符串都被转换为数字）
console.log("5" / 2); // 2.5（"5" 被转换为数字 5，然后 5 / 2 = 2.5）
```



## 16、Object.assign 和对象扩展运算符的区别

Object.assign 和对象扩展运算符 ... 都是执行浅拷贝，即只复制对象的第一层属性，不会递归复制整个对象结构。对于需要深拷贝的情况，需要额外的处理逻辑来实现。

#### Object.assign

##### **1）用法**

 Object.assign(target, ...sources)：将一个或多个源对象的所有可枚举属性复制到目标对象，并返回目标对象。也可以用于合并对象或复制对象属性到一个新的对象。 

##### **2）深浅拷贝** 

Object.assign 执行的是浅拷贝，即它只会复制对象的第一层属性。如果源对象的属性值是对象或数组等引用类型，只复制引用，不会递归复制整个引用对象。

#####  **3）覆盖属性** 

如果多个源对象具有相同的属性，后续对象的属性会覆盖之前对象的属性。 

##### **4）返回值** 

返回的是目标对象本身，而不是新创建的对象，示例如下：

```javascript
const obj1 = { a: 1, b: { c: 2 } };
const obj2 = { b: { d: 3 }, e: 4 };

const mergedObj = Object.assign({}, obj1, obj2);
console.log(mergedObj); // { a: 1, b: { d: 3 }, e: 4 }
console.log(obj1.b === mergedObj.b); // true，浅拷贝只复制了对象的引用
```

#### 对象扩展运算符 ...

##### **1）用法** 

对象扩展运算符通常用于创建新的对象字面量或复制现有对象的属性到新对象中。也可以用于对象字面量、对象解构赋值、函数参数等场景。 

##### **2）深浅拷贝** 

与 Object.assign 一样，对象扩展运算符也执行浅拷贝。它只复制对象的第一层属性。 

##### **3）覆盖属性** 

与 Object.assign 类似，如果多个源对象具有相同的属性，后续对象的属性会覆盖之前对象的属性。 

##### **4）返回值** 

对象扩展运算符在对象字面量和对象解构赋值中使用时，会创建一个新的对象，示例如下：

```javascript
const obj1 = { a: 1, b: { c: 2 } };
const obj2 = { b: { d: 3 }, e: 4 };

const mergedObj = { ...obj1, ...obj2 };
console.log(mergedObj); // { a: 1, b: { d: 3 }, e: 4 }
console.log(obj1.b === mergedObj.b); // true，浅拷贝只复制了对象的引用
```

#### 两者区别

无论是 Object.assign 还是对象扩展运算符 ...，它们都执行的是浅拷贝。这意味着它们只复制对象的第一层属性，对于对象属性值是对象或数组的情况，只复制引用，不会递归复制整个引用对象。如果需要进行深拷贝（即递归复制整个对象树），则需要额外的逻辑来实现，比如自定义递归函数或使用第三方库（如 lodash 的 cloneDeep 方法）来实现深拷贝操作。



## 17、Map和Object的区别

|          | Map                                                          | Object                                                       |
| -------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 意外的键 | Map默认情况不包含任何键，只包含显式插入的键。                | Object 有一个原型, 原型链上的键名有可能和自己在对象上的设置的键名产生冲突。 |
| 键的类型 | Map的键可以是任意值，包括函数、对象或任意基本类型。          | 键只能是字符串或 Symbols（ES6 引入），对象的属性名会被自动转换为字符串类型。 |
| 键的顺序 | Map 中的 key 是有序的。因此，当迭代的时候， Map 对象以插入的顺序返回键值。 | 对象的属性没有固定的顺序，属性在内部存储时是无序的。         |
| Size     | Map 的键值对个数可以轻易地通过size 属性获取，大小和性能通常比对象更加可预测，因为 Map 是专为存储键值对而设计的数据结构。 | 在大多数情况下，对象的属性数量没有明确的限制。               |
| 迭代     | Map 是 iterable 的，所以可以直接被迭代。也提供了一些专门用于遍历和操作的方法，如 Map.prototype.keys(), Map.prototype.values(), Map.prototype.entries() 等。 | 迭代Object需要通过 Object.keys(), Object.values(), Object.entries() 等方法来遍历对象的属性。 |
| 性能     | 在频繁增删键值对的场景下表现更好。                           | 在频繁添加和删除键值对的场景下未作出优化。                   |

1）Object 用法

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

2）Map 用法

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



## 18、JavaScript 中判断数据类型的方式有哪些？

#### 1）typeof 

typeof 操作符 typeof 操作符可以用来判断一个变量的基本数据类型（除了 null，它会返回 "object"），示例如下：

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

#### 2）instanceof

instanceof  操作符 instanceof 操作符用来判断一个对象是否是某个构造函数的实例，也可以用来判断是否是某个对象的子类实例，示例如下：

```javascript
let arr = [];
arr instanceof Array; // true
arr instanceof Object; // true，因为数组也是对象的一种
```

#### 3）Object.prototype.toString.call()

Object.prototype.toString.call() 方法 Object.prototype.toString.call() 方法返回一个表示对象的内部属性 [[Class]] 的字符串，通过它可以准确判断对象的类型，示例如下：

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

#### 4）Array.isArray() 

 Array.isArray() 方法用来判断一个对象是否为数组，示例如下：

```javascript
Array.isArray([]); // true
Array.isArray({}); // false
```

#### 5）typeof 与 instanceof 结合使用 

结合 typeof 和 instanceof 可以更精确地判断某些复杂类型，如函数和正则表达式，示例如下：

```javascript
typeof /regex/; // "object"
/regex/ instanceof RegExp; // true
```



## 19、JavaScript 有哪些内置对象？



1）**Object**：这是所有对象的基类，其他所有对象都继承自它。常用方法有 `Object.keys()`, `Object.values()`, `Object.entries()`等。

2）**Array**：用于存储有序集合，并提供了一系列操作方法，如 `push()`, `pop()`, `forEach()`, `map()`, `filter()` 等。

3）**String**：用于处理文本字符串。例如 `length`, `indexOf()`, `slice()`, `toUpperCase()`, `toLowerCase()` 等。

4）**Number**：用于表示和处理数值的对象，包括浮点数和整数。常见方法有 `parseInt()`, `parseFloat()`, `toFixed()`, `toString()`等。

5）**Boolean**：用于表示 true 和 false 值，非常简单但常用。

6）**Function**：这是 JavaScript 的一等公民，每个函数其实是 `Function` 对象的实例。常见方法有 `call()`, `apply()`, `bind()`等。

7）**Date**：用于处理日期和时间的对象，可以精确到毫秒。常见方法有 `getDate()`, `getDay()`, `getFullYear()`, `getHours()`, `getMinutes()`等。

8）**RegExp**：用于处理正则表达式的对象，强大且灵活。常见方法有 `exec()`, `test()`, `match()`, `replace()`等。

9）**Math**：提供数学计算的常用工具，如 `Math.random()`, `Math.floor()`, `Math.ceil()`, `Math.max()`, `Math.min()`等。

10）**JSON**：用于解析和格式化 JSON 格式的数据。方法包括 `JSON.parse()` 和 `JSON.stringify()`。

11）**Symbol**：一个独特且不可变的基本类型，常用于对象属性的唯一标识符。

12）**Map**：用于存储键/值对，且可以记住键值对的插入顺序。常见方法有 `set()`, `get()`, `has()`, `delete()` 等。

13）**Set**：用于存储独一无二的值，不管值是原始值还是对象引用。常见方法包括 `add()`, `has()`, `delete()`, `clear()`等。

14）**WeakMap**：与 `Map` 类似，但其键必须是对象，且该对象引用的键是弱引用，因此并不会阻止垃圾回收。

15）**WeakSet**：与 `Set` 类似，但其值必须是对象，且这些对象优点是弱引用的特点。

16）**Promise**：用于处理异步操作的对象，极大简化了异步编程。常见方法有 `then()`, `catch()`, `finally()`，还有静态的 `Promise.resolve()`, `Promise.reject()`, `Promise.all()`, 和 `Promise.race()` 等。



## 20、JavaScript 中常用的正则表达式有哪些？

常用正则

1）验证邮箱地址：

```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

2）验证电话号码：

```javascript
const phoneRegex = /^\d{10}$/;  // 这只是简单的例子，实际可能更复杂
```

3）验证邮政编码（中国）：

```javascript
const postalCodeRegex = /^[1-9]\d{5}$/;
```

4）验证 URL：

```javascript
const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})(\/[\w .-]*)*\/?$/;
```

5）验证日期（格式：YYYY-MM-DD）：

```javascript
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
```

6）匹配全是数字的字符串：

```javascript
const numberRegex = /^\d+$/;
```

7）匹配全是字母的字符串：

```javascript
const alphabetRegex = /^[A-Za-z]+$/;
```

8）验证密码（至少8个字符，且包括至少一个数字和一个字母）：

```javascript
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
```

#### 扩展知识

1）正则表达式的基本语法：

- `^` 表示字符串的开始，`$` 表示字符串的结束。
- `\d` 匹配一个数字，等价于 `[0-9]`。
- `\w` 匹配一个字母或数字字符，等价于 `[A-Za-z0-9_]`。
- `+` 匹配前面的子表达式一次或多次。例如，`\d+` 匹配一个或多个数字。

2）常用正则表达式修饰符：

- `i`：执行不区分大小写的匹配。
- `g`：执行全局匹配（查找所有而非第一个匹配项）。
- `m`：执行多行匹配。

3）JavaScript 中使用正则表达式的方法：

- `test()` 方法：在字符串中测试是否匹配一个模式，返回 `true` 或 `false`。
- `exec()` 方法：在字符串中执行一个搜索匹配，返回一个结果数组或 `null`。
- 字符串方法：www
  - `match()`：找到一个或多个正则表达式匹配。
  - `replace()`：在字符串中替换与正则表达式匹配的子串。
  - `split()`：使用正则表达式分隔字符串。

4）在实际开发中，有很多场景会用到正则表达式，比如表单验证，爬虫环境数据解析等。熟练掌握正则表达式不仅利于解决这些常见问题，还能提高工作效率。

5）推荐学习工具：

- 正则表达式在线测试工具（如 Regex101）有助于了解和测试正则表达式。
- 学习正则表达式的书籍，例如《正则表达式必知必会》。



## 21、JavaScript 脚本延迟加载的方式有哪些？

1）使用`async`属性 

2）使用`defer`属性 

3）动态创建脚本元素 

4）使用模块化加载工具

#### 详解以及应用场景

##### 1）`async`属性： 

`async`属性用于让脚本尽可能地异步加载。它不会阻塞HTML解析，脚本一旦下载完成就立即执行。但是需要注意，如果有多个`async`脚本，它们的执行顺序是不确定的。通常用于独立性较高的脚本，比如第三方的统计代码、广告代码等。

```html
<script src="example.js" async></script>
```

##### 2）`defer`属性：

 `defer`属性同样用于脚本延迟加载，但是它保证了所有`defer`脚本会按照在文档中出现的顺序执行，并且是在HTML解析完成后才执行。因此，适合于依赖于HTML结构的脚本，比如需要操作DOM的脚本。

```html
<script src="example.js" defer></script>
```

##### 3）动态创建脚本元素： 

通过JavaScript动态创建`<script>`标签并插入到文档中。这种方式可以较为灵活地控制脚本的加载和执行时机。常在需要某些条件触发时才加载的场景中使用。

```javascript
var script = document.createElement('script');
script.src = 'example.js';
document.head.appendChild(script);
```

##### 4）使用模块化加载工具：

现在有很多前端模块化工具，比如RequireJS，Webpack的动态加载等等。这些工具提供了更为强大的依赖管理和延迟加载功能。适用于大型项目中，解决代码拆分和按需加载的问题。

```javascript
// 以Webpack的动态加载为例
import('example.js').then(module => {
    // 使用加载的模块
});
```



## 22、什么是 JavaScript 的类数组对象？如何转化为数组？

JavaScript 的类数组对象（Array-like Object）是指具有类似数组特性，但并不是数组的对象。它们通常具备 `length` 属性和按索引存储的元素（例如 `arguments` 对象、DOM 方法返回的集合如 `NodeList`）。要将类数组对象转换为真正的数组，可以使用以下几种方法：

1）使用 `Array.prototype.slice.call()` 方法：

```javascript
const arrayLike = {0: 'a', 1: 'b', length: 2};
const realArray = Array.prototype.slice.call(arrayLike);
```

2）使用 `Array.from()` 方法（ES6 引入）：

```javascript
const arrayLike = {0: 'a', 1: 'b', length: 2};
const realArray = Array.from(arrayLike);
```

3）使用扩展运算符（spread operator）：

```javascript
const arrayLike = {0: 'a', 1: 'b', length: 2};
const realArray = [...arrayLike];
```

#### 扩展知识

类数组对象和数组的主要区别在于类数组对象没有数组的方法（如 `push`、`pop` 等）。转换为数组后，可以更方便地使用这些方法对数据进行操作。

1）`Array.prototype.slice.call()`：这种方法在 ES5 之前非常常见，利用 `slice` 方法将类数组对象切片成真正的数组。不过，它需要写得较为复杂，而且效率稍低。 

2）`Array.from()` 方法：这是 ES6 提供的新方法，更加简洁直观。`Array.from` 还可以接受第二个参数用来处理每一个元素，非常有用。 

3）扩展运算符：这是 ES6 引入的语法糖，最为简洁且可读性强，但需要确保类数组对象的结构完整（包括 `length` 属性）。



## 23、数组的原生方法 

数组的原生方法很多，可以分类来说： 

1 ) 数组和字符串的转换方法：toString()、toLocalString()、join() 其中 join() 方法可以指定转换为字符串时的分隔符。

```javascript
const fruits = ["apple", "banana", "orange"];
const fruitString = fruits.toString();
console.log(fruitString); // 输出: "apple,banana,orange"

const numbers = [12345.67, 56789.12];
const numberString = numbers.toLocaleString('zh-CN'); 
console.log(numberString); // 输出: "12,345.67,56,789.12" (中文环境下)

const colors = ["red", "green", "blue"];
const colorString = colors.join(" - ");
console.log(colorString); // 输出: "red - green - blue" 
```

2 ) 数组尾部操作的方法 pop() 和 push()，push 方法可以传入多个参数。

```javascript
let arr = [1, 2, 3];
arr.push(4); // arr 现在是 [1, 2, 3, 4]
arr.pop(); // 返回 4，arr 现在是 [1, 2, 3]
```

3 ) unshift() 和 shift()： 这两个方法用于在数组开头添加或删除元素。

```javascript
arr.unshift(0); // arr 现在是 [0, 1, 2, 3]
arr.shift(); // 返回 0，arr 现在是 [1, 2, 3]
```

4）数组连接的方法 concat() ，返回的是拼接好的数组，不影响原数组。排序方法 sort

```javascript
array1.concat(array2, array3, ..., arrayN)
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const arr3 = [7, 8, 9];

const combinedArray = arr1.concat(arr2, arr3);

console.log(combinedArray); // 输出: [1, 2, 3, 4, 5, 6, 7, 8, 9]

console.log(arr1); // 输出: [1, 2, 3]，原数组未改变
```

5） forEach()： 用于遍历数组的每个元素。map()： 创建一个新数组，其结果是该数组中的每个元素都调用一个提供的函数后的返回值。

```javascript
arr.forEach(item => console.log(item));
let doubled = arr.map(item => item * 2);
```

6）find() 和 findIndex()： 返回数组中满足提供的测试函数的第一个元素的值或其索引。some() 和 every()： 测试是否至少有一个元素通过由提供的函数实现的测试，或者是否所有元素都通过测试。flat() 和 flatMap()： 创建一个新数组，其中所有子数组元素递归地连接到指定的深度。

```javascript
const arr = [1, 2, 4]
arr.find(item => item > 2); // 返回 3
arr.some(item => item > 2); // 返回 true
let nested = [1, [2, 3]];
nested.flat(); // 返回 [1, 2, 3]
```



## 24、什么是 DOM 和 BOM？

> DOM（ 全拼是：Document Object Model）文档对象模型。
>
> BOM（全拼是：Browser Object Model）浏览器对象模型。



#### DOM 

是一个编程接口，它将 HTML 或 XML 文档表示为树结构。是把网页内容转换成 JavaScript 可以操作的对象。

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

#### BOM 

> 提供了独立于内容的、可以与浏览器窗口进行互动的对象结构。是浏览器提供的用于操作浏览器的接口。

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

#### DOM 和 BOM 的主要区别：

1. DOM 主要处理网页内容，而 BOM 处理浏览器窗口和功能。
2. DOM 是 W3C 标准，而 BOM 没有相关标准。
3. DOM 可以在任何支持 XML 的环境中使用，而 BOM 只能在浏览器环境中使用。

在实际开发中，我们经常同时使用 DOM 和 BOM。例如，我们可能会使用 DOM 来更新页面内容，同时使用 BOM 来获取用户的屏幕大小或者改变 URL。



## 25、JavaScript 如何判断一个对象是否属于某个类？

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



##  26、isNaN 和 Number.isNaN 函数有什么区别？

isNaN 函数会先尝试将传入的参数转换为数字，然后检查转换后的值是否为 NaN。这意味着它不仅检测 NaN 本身，还会将那些不能转换为有效数字的值视为 NaN，示例如下：

```javascript
console.log(isNaN(NaN));          // 输出: true
console.log(isNaN('hello'));      // 输出: true
console.log(isNaN(undefined));    // 输出: true
console.log(isNaN({}));           // 输出: true
console.log(isNaN(123));          // 输出: false
console.log(isNaN('123'));        // 输出: false
```

Number.isNaN 函数不会进行类型转换，只会在参数本身是 NaN 的情况下返回 true。它更为严格，只有传入的值是 NaN 时才会返回 true，示例如下：

```javascript
console.log(Number.isNaN(NaN));          // 输出: true
console.log(Number.isNaN('hello'));      // 输出: false
console.log(Number.isNaN(undefined));    // 输出: false
console.log(Number.isNaN({}));           // 输出: false
console.log(Number.isNaN(123));          // 输出: false
console.log(Number.isNaN('123'));        // 输出: false
```

#### 拓展知识

1）当你想检查一个值是否为无法被解析为数字时，可以使用 isNaN。例如，在用户输入需要被转换为数字的情况下，这个函数可以帮助检测非法输入。 2）当你明确地想检查某个值是否为 NaN，而不希望任何类型转换干扰判断结果时，应使用 Number.isNaN。



## 27、ajax、axios、fetch 的区别是什么？

Ajax、axios 和 fetch 是用于进行 HTTP 请求的三种常见方式。它们各有优缺点和适用场景

### Ajax (Asynchronous JavaScript and XML)

Ajax 不是一种单一的技术，而是一种使用现有技术集合的方法。它最常见的实现是使用 XMLHttpRequest (XHR) 对象。 特点：

- 是最早的异步请求解决方案
- 可以与服务器交换数据并更新部分网页内容，而无需重新加载整个页面
- 使用回调函数处理响应
- 不支持 Promise

示例：

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

### Fetch

Fetch 是较新的 API，旨在替代 XMLHttpRequest。它是基于 Promise 的。 特点：

- 语法更简洁，使用起来更加直观
- 基于 Promise，支持 async/await
- 原生支持，不需要额外的库
- 不会自动拒绝 HTTP 错误状态

示例：

```javascript
fetch('https://api.example.com/data')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### Axios

Axios 是一个基于 Promise 的 HTTP 客户端，可以用于浏览器和 Node.js。 特点：

- 支持浏览器和 Node.js
- 自动转换 JSON 数据
- 可以拦截请求和响应
- 可以取消请求
- 自动转换 JSON 数据
- 客户端支持防御 XSRF

示例：

```javascript
axios.get('https://api.example.com/data')
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### 主要区别：

#### 语法和使用方式：

- Ajax 使用回调函数
- Fetch 使用 Promise
- Axios 也使用 Promise，但提供了更简洁的 API

#### 错误处理：

- Fetch 不会自动抛出错误，即使响应状态为 404 或 500
- Axios 会在响应状态不在 2xx 范围内时自动抛出错误

#### 请求取消：

- Fetch 需要使用 AbortController
- Axios 提供了取消请求的方法

#### 浏览器支持：

- Ajax (XMLHttpRequest) 支持所有现代浏览器
- Fetch 不支持一些旧版浏览器（如 IE11）
- Axios 通过适当的 polyfill 可以支持更广泛的浏览器

#### 功能丰富度：

- Axios 提供了更多的功能，如拦截器、自动转换 JSON 等

对于简单的请求，Fetch 可能就足够了。如果需要更多功能和更好的错误处理，Axios 是一个很好的选择。



## 28、 forEach 和 map 方法有什么区别

> forEach 和 map 方法都是用来遍历数组的，最关键的区别在于它们的返回值

#### 返回值区别

1. forEach 方法没有返回值，它只是对数组的每个元素执行一次对应的函数。
2. map 方法会返回一个新数组，这个新数组由原数组中的每个元素经过指定函数处理后的值组成。



## 29、mouseover 和 mouseenter 事件的区别是什么？

> mouseover 会冒泡，mouseenter 不会。 mouseover 和 mouseenter 都是鼠标事件，它们的区别在于：

#### 触发条件不同

- mouseover 在鼠标指针进入元素或元素的子元素时会触发，即当鼠标指针从元素外部移入元素边界时触发；
- mouseenter 只在鼠标指针进入元素时触发，不会在进入元素的子元素时触发。

#### 事件冒泡不同

- mouseover 会冒泡，即当鼠标指针从子元素移出到父元素时也会触发；
- mouseenter 不会冒泡，即只在进入元素时触发，不影响其它元素的事件。

#### 使用场景

- 如果希望在鼠标进入元素及其子元素时都触发事件，可以使用 mouseover。
- 如果只想在鼠标进入元素本身时触发事件，可以使用 mouseenter。

示例代码：

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

当鼠标从父元素移动到子元素时：

- mouseover 会在子元素和父元素上都触发
- mouseenter 只会在最初进入父元素时触发一次



## 30、== 和 === 有什么区别？

== 和 === 是 JavaScript 中两种不同的相等性比较操作符，它们之间最主要区别是 是否进行类型转换

#### 类型转换

- == ：在比较之前会进行类型转换。如果操作数的类型不同，会尝试将它们转换为相同类型再进行比较。
- === ：不会进行类型转换。如果操作数的类型不同，直接返回 false。

```javascript
console.log(5 == "5");   // 输出: true
console.log(5 === "5");  // 输出: false
```

在这个例子中，== 会将字符串 "5" 转换为数字后再比较，而 === 则直接比较，发现类型不同就返回 false == 运算符进行比较时，会先进行类型转换，然后再比较两个值是否相等。类型转换的规则比较复杂，但可以简单地概括为以下几点：

1. 如果两个值类型相同，则直接比较它们的值。
2. 如果一个值是 null，另一个值是 undefined，则它们相等。
3. 如果一个值是数字，另一个值是字符串，则将字符串转换为数字后再比较。
4. 如果一个值是布尔值，另一个值是非布尔值，则将布尔值转换为数字后再比较。
5. 如果一个值是对象，另一个值是数字、字符串或布尔值，则将对象转换为原始值后再比较。

#### 性能

由于 === 不需要进行类型转换，所以通常会比 == 的执行速度更快。不过在现代 JavaScript 引擎中，这种性能差异通常是微不足道的

#### 可预测性

=== 的行为更加可预测。因为它不进行类型转换，所以不会出现一些令人困惑的结果。比如：

```javascript
console.log(0 == false);   // 输出: true
console.log(0 === false);  // 输出: false

console.log(null == undefined);   // 输出: true
console.log(null === undefined);  // 输出: false
```

这些例子展示了 == 在进行类型转换时可能产生的一些反直觉的结果

注意： NaN 的特殊情况 值得注意的是，NaN 是唯一一个不等于自身的值，无论是用 == 还是 ===：

```javascript
console.log(NaN == NaN);   // 输出: false
console.log(NaN === NaN);  // 输出: false
```

如果需要检查一个值是否为 NaN，应该使用 isNaN() 函数或 Number.isNaN() 方法

建议在代码中尽量使用 ===，这样可以避免很多潜在的 bug，使代码更加健壮和可维护。同时，理解 == 的行为也很重要，因为你可能会在一些旧代码或特定场景中遇到它。



## 31、 substring 和 substr 函数的区别是什么

