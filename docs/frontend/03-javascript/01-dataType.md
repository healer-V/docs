---
title: "JavaScript 数据类型"
category: "前端 · JavaScript"
tags:
  - JavaScript
  - Java
excerpt: "基本数据类型 数字（Number）：用于表示数值，包括整数和浮点数。 字符串（String）：用于表示文本，由字符组成。 布尔值（Boolean）：用于表示真或假。 空值（Null）：表示空对象引用。 未定义（Undefined）：表示变量..."
---

# JavaScript 数据类型


>[!tip] 基本数据类型
> 1. 数字（Number）：用于表示数值，包括整数和浮点数。
> 2. 字符串（String）：用于表示文本，由字符组成。
> 3. 布尔值（Boolean）：用于表示真或假。
> 4. 空值（Null）：表示空对象引用。
> 5. 未定义（Undefined）：表示变量未赋值。
> 6. 符号（Symbol）：用于创建唯一的标识符。
> 7. 大整数（BigInt）：用于表示大于 2^53-1 的整数。

>[!tip] 引用数据类型
> 1. 数组（Array）：用于存储多个值的容器。
> 2. 对象（Object）：用于存储多个属性的容器。
> 3. 函数（Function）：用于执行特定任务的代码块。


## 一、 基本数据类型
### 1、Number

>[!tip] 数字类型：用于表示数值，包括整数和浮点数。
> 1. 整数：没有小数点的数值。
> 2. 浮点数：包含小数点的数值，取值范围为 -2^53-1 到 2^53-1。
> 3. 特殊数值：`Infinity`（无穷大）、`-Infinity`（负无穷大）和 `NaN`（非数值）。<hr/>
> **【注】**：数值范围：`Number.MIN_VALUE`（最小正值）到 `Number.MAX_VALUE`（最大正值）。

#### 1.1 数值转换
- **Number()**：将其他类型转换为数字
  ```javascript
  Number('123'); // 123
  Number('123abc'); // NaN
  Number(true); // 1
  Number(false); // 0
  Number(null); // 0
  Number(undefined); // NaN
  ```
- **parseInt()**：将字符串转换为整数
  ```javascript
  parseInt('123'); // 123
  parseInt('123.45'); // 123
  parseInt('123abc'); // 123
  parseInt('abc123'); // NaN
  ```
- **parseFloat()**：将字符串转换为浮点数
  ```javascript
  parseFloat('123.45'); // 123.45
  parseFloat('123'); // 123
  parseFloat('123.45abc'); // 123.45
  ```

#### 1.2 精度问题
- JavaScript 中的数字使用 IEEE 754 双精度浮点数表示，存在精度问题
  ```javascript
  0.1 + 0.2; // 0.30000000000000004
  0.1 + 0.2 === 0.3; // false
  ```
- 解决方法：使用整数运算或指定精度
  ```javascript
  (0.1 * 10 + 0.2 * 10) / 10; // 0.3
  Number((0.1 + 0.2).toFixed(1)); // 0.3
  ```

#### 1.3 NaN 特性
- **NaN**（Not a Number）表示非数值
- NaN 与任何值比较都不相等，包括它自己
  ```javascript
  NaN === NaN; // false
  ```
- 使用 **isNaN()** 或 **Number.isNaN()** 检测 NaN
  ```javascript
  isNaN(NaN); // true
  isNaN('abc'); // true (有问题，会先转换)
  Number.isNaN(NaN); // true
  Number.isNaN('abc'); // false (更准确)
  ```

### 2、String
>[!tip] 字符串类型：用于表示文本，由字符组成。
> 1. 字符串：由字符组成的序列，用于表示文本。
> 2. 字符串拼接：使用 `+` 运算符将多个字符串连接起来。
> 3. 字符串长度：使用 `length` 属性获取字符串的长度。


#### 2.1 模板字符串
- 使用反引号（`` ` ``）创建，支持变量插值和多行字符串
  ```javascript
  const name = 'JavaScript';
  const greeting = `Hello, ${name}!`; // 'Hello, JavaScript!'
  
  const multiLine = `第一行
    第二行
    第三行`;
  ```

#### 2.2 转义字符
- 使用反斜杠（`\`）转义特殊字符
  ```javascript
  \n // 换行
  \t // 制表符
  \" // 双引号
  \' // 单引号
  \\ // 反斜杠
  ```
#### 2.3 字符串方法
- **访问和查找**
::: details 点击查看 访问和查找方法
1. **charAt()**：返回指定索引位置的字符
2. **indexOf()**：返回首次出现的索引，未找到返回 -1
3. **lastIndexOf()**：返回最后一次出现的索引，未找到返回 -1
4. **includes()**：判断字符串是否包含指定子字符串
5. **startsWith()**：判断字符串是否以指定子字符串开头
6. **endsWith()**：判断字符串是否以指定子字符串结尾
:::

- **截取和分割**
::: details 点击查看 截取和分割方法
1. **substring()**：提取字符串中指定索引之间的字符（不包括结束索引）
2. **slice()**：提取字符串中指定索引之间的字符（包括结束索引）
3. **split()**：将字符串分割为数组，根据指定分隔符
4. **join()**：将数组元素连接为字符串，使用指定分隔符
:::

- **转换**
::: details 点击查看 转换方法
1. **toUpperCase()**：将字符串转换为大写
2. **toLowerCase()**：将字符串转换为小写
3. **trim()**：去除字符串首尾空白
4. **trimStart()**：去除字符串开头空白
5. **trimEnd()**：去除字符串结尾空白
6. **charCodeAt()**：返回指定索引位置的字符的 Unicode 编码
7. **repeat()**：重复字符串指定次数
8. **padStart()**：在字符串开头填充指定字符，直到达到指定长度
9. **padEnd()**：在字符串结尾填充指定字符，直到达到指定长度
:::


- **替换**
::: details 点击查看 替换方法
1. **replace()**：替换字符串中的指定子字符串
2. **replaceAll()**：全局替换字符串中的指定子字符串
:::



### 3、Boolean
>[!tip] 布尔值类型：用于表示真或假。
> 1. 布尔值：只有两个可能的取值，`true`（真）和 `false`（假）。
> 2. 逻辑运算符：用于对布尔值进行逻辑操作，包括 `&&`（与）、`||`（或）和 `!`（非）。

#### 3.1 布尔转换
- **Boolean()**：将其他类型转换为布尔值
  ```javascript
  Boolean(1); // true
  Boolean(0); // false
  Boolean('hello'); // true
  Boolean(''); // false
  Boolean(null); // false
  Boolean(undefined); // false
  Boolean([]); // true
  Boolean({}); // true
  Boolean(NaN); // false
  ```

#### 3.2 真值与假值
- **假值**（Falsy Values）：在布尔上下文中会转换为 false 的值
  1. `false`
  2. `0`, `-0`, `0n` (BigInt零)
  3. `''`, `""` (空字符串)
  4. `null`
  5. `undefined`
  6. `NaN`

- **真值**（Truthy Values）：除假值外的所有值都被视为真值

#### 3.3 逻辑运算符的高级用法
- **逻辑与（&&）**：短路求值，左侧为假时直接返回左侧，否则返回右侧
  ```javascript
  false && '右侧'; // false
  true && '右侧'; // '右侧'
  ```
- **逻辑或（||）**：短路求值，左侧为真时直接返回左侧，否则返回右侧
  ```javascript
  '左侧' || '右侧'; // '左侧'
  '' || '右侧'; // '右侧'
  ```
- **逻辑非（!）**：将值转换为布尔值后取反
  ```javascript
  !true; // false
  !false; // true
  !0; // true
  !!0; // false (双重否定，相当于Boolean())
  ```
- **空值合并运算符（??）**：左侧为null或undefined时返回右侧，否则返回左侧
  ```javascript
  null ?? '默认值'; // '默认值'
  undefined ?? '默认值'; // '默认值'
  '' ?? '默认值'; // ''
  0 ?? '默认值'; // 0
  ```
- **可选链运算符（?.）**：安全地访问对象属性，避免空引用错误
  ```javascript
  const obj = null;
  obj?.name; // undefined (不会抛出错误)
  ```


### 4、Null
>[!tip] 空值类型：用于表示空对象引用。
> 1. 空值：表示空对象引用，使用 `null` 表示。
> 2. 空值与未定义的区别：`null` 表示空值，而 `undefined` 表示变量未赋值。

#### 4.1 Null的特点
- `null` 是一个特殊的字面量，表示空对象引用
- 使用 `typeof null` 会返回 `'object'`（这是JavaScript的一个历史遗留bug）
- `null` 转换为数字时是 0

```javascript
const x = null;
console.log(typeof x); // 'object'
console.log(Number(null)); // 0
console.log(null == undefined); // true
console.log(null === undefined); // false
```

### 5、Undefined
>[!tip] 未定义类型
> 1. 未定义：表示变量未赋值，使用 `undefined` 表示。

#### 5.1 Undefined的特点
- `undefined` 是一个全局属性，表示未定义的值
- 使用 `typeof undefined` 会返回 `'undefined'`
- `undefined` 转换为数字时是 `NaN`

```javascript
let x;
console.log(x); // undefined
console.log(typeof x); // 'undefined'
console.log(Number(undefined)); // NaN
```

### 6、Null和Undefined的区别与使用场景

#### 6.1 主要区别
| 特性 | Null | Undefined |
|------|------|-----------|
| 类型 | 空对象引用 | 未定义 |
| typeof | 'object' | 'undefined' |
| 转数字 | 0 | NaN |
| 显式赋值 | 需要显式赋值为null | 变量声明但未赋值时的默认值 |
| 函数参数 | 可作为参数传递表示"无" | 函数未传递参数时的默认值 |
| 属性访问 | 对象属性不存在时返回undefined | - |

#### 6.2 推荐使用场景
- **Null**：
  - 表示"无"、"空"或"不存在"的对象值
  - 显式清除变量的内容
  - 作为函数参数传递，表示有意提供一个空值
  - 作为原型链的终点

```javascript
// 显式清除对象引用
let obj = { name: 'test' };
obj = null; // 释放对象引用

// 作为函数参数表示无值
function processData(data = null) {
  // 处理数据，data可能为null
}
```

- **Undefined**：
  - 变量声明但未初始化时的默认值
  - 函数未提供参数时的参数值
  - 对象不存在的属性值
  - 函数没有返回值时的默认返回值

```javascript
let x; // x === undefined
function foo(a, b) {
  console.log(b); // undefined
}
foo(1);

const obj = {};
console.log(obj.nonExistent); // undefined

function noReturn() {}
console.log(noReturn()); // undefined
```

#### 6.3 最佳实践
- 使用 `===` 进行严格比较，避免隐式类型转换
- 对于可能为null或undefined的值，使用空值合并运算符 `??` 提供默认值
- 避免显式赋值undefined，这被认为是不好的实践
- 使用可选链运算符 `?.` 安全地访问可能为null或undefined的对象属性

```javascript
// 不推荐
let value = undefined;

// 推荐
let value = null;

// 安全的默认值处理
const result = potentiallyUndefinedValue ?? 'default';

// 安全的属性访问
const name = user?.profile?.name ?? 'Anonymous';
```

### 6、Symbol
>[!tip] 符号类型：用于创建唯一的标识符。
> 1. 唯一性：每次调用 `Symbol()` 都会创建一个唯一的值。
> 2. 用作属性名：Symbol 值可以用作对象的属性名。
> 3. 不可枚举：Symbol 作为属性名时，不会出现在 `for...in` 循环中。

#### 6.1 Symbol的基本特性
- Symbol是JavaScript的第七种基本数据类型
- Symbol值是通过`Symbol()`函数创建的，不能使用new操作符
- 每个Symbol都是唯一的，即使使用相同的描述
- Symbol可以有一个描述字符串，但这个描述不会影响Symbol的唯一性

```javascript
// 创建Symbol
const sym1 = Symbol();
const sym2 = Symbol('description');
const sym3 = Symbol('description');

console.log(sym2 === sym3); // false，即使描述相同也是不同的Symbol
console.log(sym2.toString()); // "Symbol(description)"
```

#### 6.2 Symbol的主要用途

##### 6.2.1 作为对象的唯一属性名
::: details 点击查看 作为对象的唯一属性名
```javascript
// 使用Symbol作为对象属性名
const uniqueId = Symbol('id');
const obj = {
  [uniqueId]: '私有标识符',
  name: '公开属性'
};

// 访问Symbol属性
console.log(obj[uniqueId]); // '私有标识符'

// Symbol属性不会出现在常规遍历中
console.log(Object.keys(obj)); // ['name']
console.log(Object.values(obj)); // ['公开属性']
console.log(for (const key in obj) {...}); // 只会遍历到'name'

// 专门获取Symbol属性
console.log(Object.getOwnPropertySymbols(obj)); // [Symbol(id)]
```
::: 

##### 6.2.2 防止属性名冲突
```javascript
// 在多人协作的大型项目中避免属性冲突
const x = Symbol('x');
const module1 = { [x]: '模块1' };
const module2 = { [x]: '模块2' }; // 这里不会覆盖module1的x属性
```

##### 6.2.3 定义对象的"私有"属性
::: details 点击查看 定义对象的"私有"属性
```javascript
// 使用Symbol创建半私有的属性（不完全私有，但不容易被意外访问）
const _privateData = Symbol('private');

class MyClass {
  constructor() {
    this[_privateData] = '私有数据';
  }
  
  getData() {
    return this[_privateData];
  }
}

const instance = new MyClass();
console.log(instance.getData()); // 可以通过方法访问
console.log(instance[_privateData]); // 但仍可通过Symbol直接访问，不是真正的私有
```
:::

#### 6.3 Symbol.for 和 Symbol.keyFor 方法

##### 6.3.1 Symbol.for()
- 创建或重用Symbol实例
- 接受一个字符串键，在全局Symbol注册表中查找
- 如果找到则返回该Symbol，否则创建新Symbol并注册

```javascript
// Symbol.for会查找全局注册表
const globalSymbol = Symbol.for('global');
const anotherGlobal = Symbol.for('global');
console.log(globalSymbol === anotherGlobal); // true

// 与普通Symbol的区别
const localSymbol = Symbol('global');
console.log(globalSymbol === localSymbol); // false
```

##### 6.3.2 Symbol.keyFor()
- 获取全局注册表中Symbol的键
- 只适用于通过Symbol.for()创建的Symbol
- 对于普通Symbol或未注册的Symbol返回undefined

```javascript
const sym = Symbol.for('test');
console.log(Symbol.keyFor(sym)); // 'test'

const localSym = Symbol('test');
console.log(Symbol.keyFor(localSym)); // undefined
```

#### 6.4 内置Symbol
JavaScript提供了一系列内置Symbol，用于控制对象的行为：

##### 6.4.1 Symbol.iterator
- 定义对象的默认迭代器
- 使对象可用于for...of循环
::: details 点击查看 定义对象的默认迭代器
```javascript
const iterableObject = {
  [Symbol.iterator]() {
    let step = 0;
    return {
      next() {
        step++;
        if (step <= 3) {
          return { value: step, done: false };
        } else {
          return { done: true };
        }
      }
    };
  }
};

for (const value of iterableObject) {
  console.log(value); // 1, 2, 3
}
```
:::

##### 6.4.2 Symbol.toStringTag
- 自定义对象的字符串表示
- 影响Object.prototype.toString.call()的返回值

```javascript
const myObject = {
  [Symbol.toStringTag]: 'MyCustomObject'
};

console.log(Object.prototype.toString.call(myObject)); // '[object MyCustomObject]'
```

##### 6.4.3 Symbol.species
- 用于创建派生对象的构造函数
- 主要用于内置对象如Array、Map等

```javascript
class MyArray extends Array {
  static get [Symbol.species]() {
    return Array;
  }
}

const myArray = new MyArray(1, 2, 3);
const mapped = myArray.map(x => x * 2);

console.log(mapped instanceof MyArray); // false
console.log(mapped instanceof Array); // true
```

##### 6.4.4 其他重要内置Symbol
- `Symbol.hasInstance`: 用于判断对象是否为构造函数的实例
- `Symbol.isConcatSpreadable`: 控制对象在Array.prototype.concat()中是否被展开
- `Symbol.match`: 定义正则匹配行为
- `Symbol.replace`: 定义替换字符串的行为
- `Symbol.search`: 定义搜索字符串的行为
- `Symbol.split`: 定义分割字符串的行为
- `Symbol.toPrimitive`: 控制对象到原始值的转换

### 7、BigInt
>[!tip] 大整数类型：用于表示大于 2^53-1 的整数。
> 1. 大整数：用于表示大于 2^53-1 的整数，使用 `BigInt()` 函数创建。
> 2. 大整数的操作：大整数支持普通整数的所有操作，包括加减乘除等。
> 3. 大整数的比较：大整数可以使用 `>`、`<`、`>=`、`<=` 等运算符进行比较。

#### 7.1 BigInt的基本特性
- BigInt是JavaScript的第八种基本数据类型
- 用于表示任意精度的整数，可以存储和操作任意大小的整数
- 创建方式：使用`BigInt()`构造函数或在数字后添加`n`后缀
- 不能与Number类型直接进行混合运算

```javascript
// 创建BigInt
const big1 = BigInt(123);
const big2 = 123n;
const big3 = BigInt('12345678901234567890');

console.log(typeof big1); // 'bigint'
console.log(big1 === big2); // true
console.log(big3.toString()); // '12345678901234567890'
```

#### 7.2 BigInt的使用限制

##### 7.2.1 不能与Number混合运算
```javascript
// 不允许的操作
// const result = 10 + 10n; // TypeError: Cannot mix BigInt and other types

// 必须进行显式类型转换
const num = 10;
const bigNum = 10n;
const result1 = BigInt(num) + bigNum; // 20n
const result2 = num + Number(bigNum); // 20
```

##### 7.2.2 不支持一元加号运算符
```javascript
// 不允许
// +10n; // TypeError: Cannot convert a BigInt value to a number

// 可以使用一元减号
-10n; // -10n
```

##### 7.2.3 不能用于Math对象的方法
```javascript
// 不允许
// Math.sqrt(25n); // TypeError

// 需要手动转换
Math.sqrt(Number(25n)); // 5
```

##### 7.2.4 不能与JSON序列化
```javascript
const obj = { value: 10n };
// JSON.stringify(obj); // TypeError

// 需要自定义toJSON方法
BigInt.prototype.toJSON = function() {
  return this.toString();
};
const obj2 = { value: 10n };
console.log(JSON.stringify(obj2)); // '{"value":"10"}'
```

##### 7.2.5 某些操作符行为不同
```javascript
// 除法操作会自动向下取整
console.log(10n / 3n); // 3n 而不是 3.333...
console.log(10 / 3); // 3.333...
```

#### 7.3 BigInt的适用场景

##### 7.3.1 处理超出安全整数范围的数值
```javascript
// JavaScript的安全整数范围是 -(2^53 - 1) 到 2^53 - 1
const maxSafeNumber = Number.MAX_SAFE_INTEGER; // 9007199254740991

// 超出安全范围的计算会失去精度
console.log(maxSafeNumber + 1 === maxSafeNumber + 2); // true，意外结果！

// 使用BigInt避免精度丢失
const bigMax = BigInt(maxSafeNumber);
console.log(bigMax + 1n === bigMax + 2n); // false，正确结果
```

##### 7.3.2 金融和货币计算
```javascript
// 金融计算需要精确的大整数运算
function calculateInterest(principal, rate, years) {
  // 避免浮点数精度问题，使用整数处理
  const principalBig = BigInt(principal * 100); // 转换为分
  const rateBig = BigInt(rate * 10000); // 转换为基点
  const yearsBig = BigInt(years);
  
  // 使用BigInt进行精确计算
  const interest = (principalBig * rateBig * yearsBig) / 1000000n;
  return interest;
}
```

##### 7.3.3 密码学和哈希计算
```javascript
// 密码学算法中需要处理非常大的整数
function modPow(base, exponent, mod) {
  // 使用BigInt处理大指数运算
  let result = 1n;
  base = base % mod;
  while (exponent > 0n) {
    if (exponent % 2n === 1n) {
      result = (result * base) % mod;
    }
    exponent = exponent / 2n;
    base = (base * base) % mod;
  }
  return result;
}
```

##### 7.3.4 大型数据库ID处理
```javascript
// 处理大型数据库中的64位ID
const databaseId = 1234567890123456789n;

// 在应用中正确比较和处理这些ID
function findRecord(id) {
  // 确保使用BigInt类型进行比较
  return records.find(record => record.id === BigInt(id));
}
```

#### 7.4 BigInt与Number的转换

```javascript
// Number转BigInt
const num = 123;
const bigNum = BigInt(num);

// BigInt转Number
const big = 456n;
const number = Number(big);

// 注意：超出Number安全范围的BigInt转Number会失去精度
const veryBig = 123456789012345678901234567890n;
const converted = Number(veryBig); // 可能失去精度

// 安全的转换检查
function safeBigIntToNumber(bigInt) {
  if (bigInt > BigInt(Number.MAX_SAFE_INTEGER) || 
      bigInt < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new Error('BigInt超出Number安全范围');
  }
  return Number(bigInt);
}
```

#### 7.5 浏览器兼容性和最佳实践

##### 7.5.1 兼容性考虑
- BigInt在现代浏览器中支持良好，但在IE和某些旧浏览器中不支持
- 在需要兼容旧环境时，考虑使用polyfill或第三方库

##### 7.5.2 最佳实践
- 只在需要处理超出Number安全范围的整数时使用BigInt
- 避免频繁在BigInt和Number之间转换，可能导致性能问题
- 在类型转换时注意精度损失问题
- 使用BigInt时始终添加`n`后缀以明确区分


## 二、引用数据类型

### 1、Object

#### 1.1 对象创建方法
- **对象字面量**
  ```javascript
  const person = {
    name: '张三',
    age: 25,
    sayHello: function() {
      console.log(`Hello, I'm ${this.name}`);
    }
  };
  ```
- **构造函数**
  ```javascript
  const person = new Object();
  person.name = '张三';
  person.age = 25;
  ```
- **Object.create()**
  ```javascript
  const person = Object.create(null);
  person.name = '张三';
  ```

#### 1.2 属性操作
- **访问属性**
  ```javascript
  person.name; // 点语法
  person['age']; // 方括号语法
  ```
- **添加/修改属性**
  ```javascript
  person.gender = 'male'; // 添加
  person.age = 26; // 修改
  ```
- **删除属性**
  ```javascript
  delete person.age;
  ```
- **检查属性**
  ```javascript
  'name' in person; // true
  person.hasOwnProperty('name'); // true (检查自有属性)
  ```

#### 1.3 对象方法
- **Object.keys()/values()/entries()**
  ```javascript
  Object.keys(person); // ['name', 'gender', 'sayHello']
  Object.values(person); // ['张三', 'male', function...]
  Object.entries(person); // [['name', '张三'], ...]
  ```
- **Object.assign()**
  ```javascript
  const newPerson = Object.assign({}, person, { city: '北京' });
  ```
- **Object.freeze()/seal()/preventExtensions()**
  ```javascript
  Object.freeze(person); // 冻结对象，不能添加、删除或修改属性
  ```

### 2、Array

#### 2.1 数组创建
- **数组字面量**
  ```javascript
  const arr = [1, 2, 3, 4, 5];
  ```
- **构造函数**
  ```javascript
  const arr = new Array(5); // 创建长度为5的空数组
  const arr = new Array(1, 2, 3); // 创建包含元素的数组
  ```

#### 2.2 常用数组方法
- **添加/删除元素**
  ```javascript
  arr.push(6); // 末尾添加
  arr.pop(); // 末尾删除
  arr.unshift(0); // 开头添加
  arr.shift(); // 开头删除
  arr.splice(2, 1, 'a'); // 从索引2开始删除1个元素，插入'a'
  ```
- **数组遍历**
  ```javascript
  arr.forEach(item => console.log(item));
  const newArr = arr.map(item => item * 2);
  const filtered = arr.filter(item => item > 2);
  const sum = arr.reduce((acc, item) => acc + item, 0);
  ```
- **数组查找**
  ```javascript
  arr.indexOf(3); // 2
  arr.includes(3); // true
  arr.find(item => item > 2); // 3
  arr.findIndex(item => item > 2); // 2
  ```
- **数组变换**
  ```javascript
  arr.join(','); // '1,2,3,4,5'
  arr.concat([6, 7]); // [1,2,3,4,5,6,7]
  arr.slice(1, 3); // [2,3]
  arr.reverse(); // 反转数组
  arr.sort(); // 排序
  ```

### 3、Function

#### 3.1 函数定义
- **函数声明**
  ```javascript
  function sayHello(name) {
    return `Hello, ${name}!`;
  }
  ```
- **函数表达式**
  ```javascript
  const sayHello = function(name) {
    return `Hello, ${name}!`;
  };
  ```
- **箭头函数**
  ```javascript
  const sayHello = (name) => {
    return `Hello, ${name}!`;
  };
  // 简写
  const sayHello = name => `Hello, ${name}!`;
  ```

#### 3.2 函数特性
- **参数**
  ```javascript
  function sum(...args) { // 剩余参数
    return args.reduce((acc, num) => acc + num, 0);
  }
  sum(1, 2, 3); // 6
  ```
- **this指向**
  ```javascript
  // 普通函数中的this由调用方式决定
  // 箭头函数中的this由定义时的上下文决定
  ```
- **闭包**
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

#### 3.3 函数方法
- **call()/apply()/bind()**
  ```javascript
  function greet(greeting) {
    return `${greeting}, ${this.name}!`;
  }
  const person = { name: '张三' };
  greet.call(person, 'Hello'); // 'Hello, 张三!'
  greet.apply(person, ['Hello']); // 'Hello, 张三!'
  const greetPerson = greet.bind(person);
greetPerson('Hello'); // 'Hello, 张三!'
  
## 三、类型检测方法
::: tip 解释
JavaScript中常用的类型检测方法有三种：
1. typeof
2. instanceof
3. Object.prototype.toString()。
:::



### 1、typeof 运算符
:::tip 
- 返回一个表示操作数类型的字符串
- **优点**：简单、快速
- **缺点**：对于引用类型，除了函数外，都返回'object'
:::

```javascript
typeof 42; // 'number'
typeof 'hello'; // 'string'
typeof true; // 'boolean'
typeof undefined; // 'undefined'
typeof null; // 'object' (历史遗留问题)
typeof Symbol(); // 'symbol'
typeof 1n; // 'bigint'
typeof {}; // 'object'
typeof []; // 'object'
typeof function() {}; // 'function'
```

### 2、instanceof 运算符
:::tip 
- **作用**: 用于检测构造函数的 `prototype` 属性是否出现在某个实例对象的原型链上
- **优点**：可以区分不同的引用类型
- **缺点**：不能准确检测基本数据类型，且受原型链影响
:::

```javascript
[] instanceof Array; // true
[] instanceof Object; // true
{} instanceof Object; // true
function() {} instanceof Function; // true
new Date() instanceof Date; // true

// 不能检测基本类型
'hello' instanceof String; // false
42 instanceof Number; // false

// 可以通过包装对象检测
new String('hello') instanceof String; // true
```

### 3、Object.prototype.toString() 方法
:::tip 
- **作用**: 返回对象的内部 `[[Class]]` 属性的字符串表示
- **优点**：最准确和全面的类型检测方法
- **缺点**：需要调用和处理返回字符串
:::

```javascript
Object.prototype.toString.call(42); // '[object Number]'
Object.prototype.toString.call('hello'); // '[object String]'
Object.prototype.toString.call(true); // '[object Boolean]'
Object.prototype.toString.call(null); // '[object Null]'
Object.prototype.toString.call(undefined); // '[object Undefined]'
Object.prototype.toString.call(Symbol()); // '[object Symbol]'
Object.prototype.toString.call(1n); // '[object BigInt]'
Object.prototype.toString.call([]); // '[object Array]'
Object.prototype.toString.call({}); // '[object Object]'
Object.prototype.toString.call(function() {}); // '[object Function]'
Object.prototype.toString.call(new Date()); // '[object Date]'
Object.prototype.toString.call(/regex/); // '[object RegExp]'
```

### 4、类型检测最佳实践

```javascript
// 检测基本数据类型
function getType(value) {
  if (value === null) return 'null';
  if (typeof value !== 'object') return typeof value;
  
  // 处理引用类型
  const className = Object.prototype.toString.call(value).slice(8, -1);
  return className.toLowerCase();
}

// 使用示例
getType(42); // 'number'
getType(null); // 'null'
getType([]); // 'array'
getType({}); // 'object'
getType(new Date()); // 'date'
```

## 四、隐式类型转换规则

### 1、字符串连接
:::tip 
- **作用**: 当 `+` 运算符的一侧是字符串时，另一侧会被转换为字符串
- **优点**：方便拼接字符串
- **缺点**：其他情况通常转换为数字
:::

```javascript
'5' + 5; // '55' (字符串连接)
5 + '5'; // '55' (字符串连接)
5 + 5; // 10 (加法)
'' + 123; // '123'
'' + true; // 'true'
'' + null; // 'null'
'' + undefined; // 'undefined'
'' + {}; // '[object Object]'
'' + []; // ''
```

### 2、算术运算
:::tip 
- **作用**: 当 `+` 运算符的一侧是字符串时，另一侧会被转换为字符串
- **优点**：方便拼接字符串
- **缺点**：其他情况通常转换为数字
:::

```javascript
'5' - 3; // 2 (5 - 3)
'5' * 3; // 15 (5 * 3)
'5' / 3; // 1.666...
'10' % 3; // 1
true - 1; // 0 (1 - 1)
false - 1; // -1 (0 - 1)
null - 1; // -1 (0 - 1)
undefined - 1; // NaN
'hello' - 1; // NaN
```

### 3、比较运算
:::tip 解释
- **作用**: 用于比较两个值的大小或相等性
- **运算符**：`==`、`!=`、`>`、`<`、`>=`、`<=`
- `==` 和 `!=` 会进行类型转换后比较
- `===` 和 `!==` 不会进行类型转换，严格比较
- `>`、`<`、`>=`、`<=` 通常转换为数字或字符串进行比较
:::

**示例**
```javascript
// == 转换规则
5 == '5'; // true (字符串转数字)
true == 1; // true (布尔值转数字)
null == undefined; // true (特殊情况)
'' == 0; // true (空字符串转数字0)
[] == ''; // true ([]转空字符串)
[] == 0; // true ([]转空字符串，再转数字0)
{} == '[object Object]'; // true (对象转字符串)

// === 严格比较
5 === '5'; // false
true === 1; // false
null === undefined; // false

// 关系运算符
'10' > '5'; // false (按字符串Unicode编码比较)
10 > '5'; // true (字符串转数字)
```

### 4、布尔上下文中的转换
:::tip 解释
- **作用**: 在if语句、循环条件、逻辑运算符等布尔上下文中，值会被转换为布尔值
- **优点**：方便进行条件判断
- **缺点**：可能导致意外的结果
:::

```javascript
// 以下条件判断中，值会被隐式转换为布尔值
if (value) { ... }
while (condition) { ... }
!value; // 先转布尔值再取反
truthy && expression; // 短路求值
truthy || expression; // 短路求值
```

### 5、对象到原始值的转换
:::tip 解释
- **作用**: 对象在需要原始值的上下文中（如算术运算、字符串连接）会经历以下步骤：
  1. 调用 `[Symbol.toPrimitive]` 方法（如果存在）
  2. 调用 `valueOf()` 方法（如果存在且返回原始值）
  3. 调用 `toString()` 方法（如果存在且返回原始值）
  4. 抛出 TypeError
:::

```javascript
const obj = {
  [Symbol.toPrimitive](hint) {
    if (hint === 'string') return '对象的字符串';
    if (hint === 'number') return 123;
    return true;
  }
};

String(obj); // '对象的字符串'
Number(obj); // 123
obj + 1; // 124 (hint为'default')
```

### 6、常见的隐式类型转换陷阱
::: details 点击查看
```javascript
// 1. NaN 不等于任何值，包括它自己
NaN == NaN; // false
NaN === NaN; // false

// 2. 0 和 -0 相等
0 == -0; // true
0 === -0; // true

// 3. 浮点数精度问题
0.1 + 0.2 == 0.3; // false

// 4. 数组转原始值
[] + []; // '' (两个空数组都转为空字符串)
[] + {}; // '[object Object]'
{} + []; // 0 (在某些环境中，{}被当作代码块，相当于 +[])

// 5. null 和 0 的比较
null > 0; // false
null == 0; // false
null >= 0; // true (因为 null 转换为 0)
```

### 7、避免隐式转换问题的最佳实践
:::tip 解释
- **作用**: 为了避免隐式类型转换导致的错误和意外行为，建议使用严格相等运算符 `===` 和 `!==`
- **优点**：避免类型转换带来的不一致性
- **缺点**：可能需要更多的代码来处理类型转换
:::



