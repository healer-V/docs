# 变量扩展

## 一、概述

ECMAScript 2015 (ES6) 引入了变量声明和操作的新特性，极大地增强了JavaScript的变量处理能力。

::: tip ES6变量扩展的主要特性
1. **块级作用域**：通过let和const引入了真正的块级作用域
2. **声明方式**：新增let和const关键字，与var形成三种声明方式
3. **解构赋值**：支持从数组或对象中提取数据并赋值给变量
4. **变量声明提升**：let和const与var在变量提升方面有显著差异
5. **全局对象属性**：let和const声明的全局变量不再是全局对象的属性
:::

## 二、let关键字

### 2.1 let关键字的基本概念

::: tip let关键字的特点
1. **块级作用域**：let声明的变量只在其所在的代码块内有效
2. **无变量提升**：let声明的变量不会被提升到作用域顶部
3. **暂时性死区**：在let声明之前使用变量会抛出ReferenceError
4. **不允许重复声明**：在同一作用域内不能重复声明同一个变量
:::

### 2.2 基本语法

```javascript
let 变量名 = 值;
```

### 2.3 示例
::: details 点击查看示例代码
```javascript
// 块级作用域示例
function test() {
  if (true) {
    let x = 10;
    console.log(x); // 10
  }
  // console.log(x); // ReferenceError: x is not defined
}

test();

// 暂时性死区示例
function tempDeadZone() {
  // console.log(y); // ReferenceError: Cannot access 'y' before initialization
  let y = 20;
  console.log(y); // 20
}

tempDeadZone();

// 不允许重复声明
// let z = 30;
// let z = 40; // SyntaxError: Identifier 'z' has already been declared
```
:::

## 三、const关键字

### 3.1 const关键字的基本概念

::: tip const关键字的特点
1. **常量声明**：用于声明常量，一旦赋值后不能重新赋值
2. **块级作用域**：与let一样，具有块级作用域
3. **无变量提升**：与let一样，不会被提升到作用域顶部
4. **暂时性死区**：与let一样，存在暂时性死区
5. **必须初始化**：声明时必须赋值，否则会抛出语法错误
6. **引用类型的可变性**：const声明的引用类型变量，其引用不可变，但内容可以修改
:::

### 3.2 基本语法

```javascript
const 常量名 = 值;
```

### 3.3 示例
::: details 点击查看示例代码
```javascript
// 基本常量
const PI = 3.14159;
// PI = 3.14; // TypeError: Assignment to constant variable.

// 块级作用域
if (true) {
  const MAX = 100;
  console.log(MAX); // 100
}
// console.log(MAX); // ReferenceError: MAX is not defined

// 引用类型常量
const person = { name: 'John', age: 30 };
person.age = 31; // 允许修改对象属性
console.log(person); // { name: 'John', age: 31 }

// person = { name: 'Jane' }; // TypeError: Assignment to constant variable.

// 冻结对象，使其内容也不可修改
const frozen = Object.freeze({ value: 1 });
// frozen.value = 2; // 严格模式下抛出错误，非严格模式下静默失败
```
:::

## 四、var、let和const的区别

### 4.1 作用域对比

::: tip 三种声明方式的作用域差异
1. **var**：函数作用域，在整个函数内有效
2. **let**：块级作用域，只在当前代码块内有效
3. **const**：块级作用域，与let相同
:::

### 4.2 变量提升对比

::: info 变量提升行为
1. **var**：会被提升到作用域顶部，初始值为undefined
2. **let**：不会被提升，存在暂时性死区
3. **const**：不会被提升，存在暂时性死区，且必须初始化
:::

### 4.3 重复声明对比

::: tip 重复声明规则
1. **var**：允许在同一作用域内重复声明
2. **let**：不允许在同一作用域内重复声明
3. **const**：不允许在同一作用域内重复声明
:::

### 4.4 示例对比
::: details 点击查看示例代码
```javascript
// var的特性
function varTest() {
  console.log(a); // undefined（变量提升）
  var a = 1;
  console.log(a); // 1
  if (true) {
    var a = 2; // 同一作用域，覆盖原值
    console.log(a); // 2
  }
  console.log(a); // 2（影响外部同名变量）
}

// let的特性
function letTest() {
  // console.log(b); // ReferenceError（无变量提升）
  let b = 1;
  console.log(b); // 1
  if (true) {
    let b = 2; // 新的块级作用域
    console.log(b); // 2
  }
  console.log(b); // 1（不影响外部同名变量）
}

// const的特性
function constTest() {
  const c = 1;
  console.log(c); // 1
  // c = 2; // TypeError（不能重新赋值）
  if (true) {
    const c = 2; // 新的块级作用域
    console.log(c); // 2
  }
}
```
:::

## 五、解构赋值

### 5.1 解构赋值的基本概念

::: info 解构赋值定义
1. **模式匹配**：按照一定模式，从数组或对象中提取值
2. **简化代码**：使代码更简洁易读
3. **多变量赋值**：一次可以为多个变量赋值
4. **支持默认值**：可以为变量设置默认值
5. **嵌套解构**：支持嵌套的数组和对象解构
:::

### 5.2 数组解构

```javascript
// 基本数组解构
const [a, b, c] = [1, 2, 3];
console.log(a, b, c); // 1 2 3

// 跳过某些元素
const [d, , e] = [4, 5, 6];
console.log(d, e); // 4 6

// 剩余元素
const [f, ...rest] = [7, 8, 9];
console.log(f, rest); // 7 [8, 9]

// 默认值
const [g, h = 10] = [11];
console.log(g, h); // 11 10

// 嵌套数组解构
const [i, [j, k]] = [12, [13, 14]];
console.log(i, j, k); // 12 13 14
```

### 5.3 对象解构

```javascript
// 基本对象解构
const { name, age } = { name: 'Alice', age: 25 };
console.log(name, age); // Alice 25

// 重命名变量
const { name: username, age: userage } = { name: 'Bob', age: 30 };
console.log(username, userage); // Bob 30

// 默认值
const { city, country = 'Unknown' } = { city: 'Beijing' };
console.log(city, country); // Beijing Unknown

// 剩余属性
const { title, ...otherProps } = { title: 'Book', author: 'Tom', year: 2020 };
console.log(title, otherProps); // Book { author: 'Tom', year: 2020 }

// 嵌套对象解构
const { user: { firstname, lastname } } = { user: { firstname: 'John', lastname: 'Doe' } };
console.log(firstname, lastname); // John Doe
```

### 5.4 复杂解构示例

:::details 混合解构和高级应用
```javascript
// 函数参数解构
function calculate({ x = 0, y = 0, operation = 'add' }) {
  switch (operation) {
    case 'add': return x + y;
    case 'subtract': return x - y;
    case 'multiply': return x * y;
    case 'divide': return x / y;
    default: return NaN;
  }
}

console.log(calculate({ x: 10, y: 5, operation: 'multiply' })); // 50
console.log(calculate({ x: 10 })); // 10 (y默认为0，operation默认为add)

// 数组和对象混合解构
const data = {
  users: [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ],
  meta: { total: 2, page: 1 }
};

const { users: [firstUser, secondUser], meta: { total } } = data;
console.log(firstUser.name, secondUser.name, total); // Alice Bob 2

// 交换变量
let x = 1, y = 2;
[x, y] = [y, x];
console.log(x, y); // 2 1

// 解构函数返回值
function getValues() {
  return [1, 2, 3];
}

const [val1, val2, val3] = getValues();
console.log(val1, val2, val3); // 1 2 3
```
:::

## 六、模板字符串中的变量插值

### 6.1 模板字符串的基本概念

::: info 模板字符串特性
1. **反引号语法**：使用反引号(`)而不是单引号或双引号
2. **变量插值**：通过${}插入变量或表达式
3. **多行字符串**：可以直接包含换行符
4. **嵌套模板**：支持在${}中嵌套其他模板字符串
:::

### 6.2 基本语法

```javascript
const 模板字符串 = `字符串内容${变量或表达式}字符串内容`;
```

### 6.3 示例

```javascript
// 基本变量插值
const name = 'World';
const greeting = `Hello, ${name}!`;
console.log(greeting); // Hello, World!

// 表达式插值
const a = 5, b = 3;
const result = `${a} + ${b} = ${a + b}`;
console.log(result); // 5 + 3 = 8

// 多行字符串
const multiLine = `
  First line
  Second line
  Third line
`;
console.log(multiLine);

// 函数调用插值
function getFullName(first, last) {
  return `${first} ${last}`;
}

const fullName = `${getFullName('John', 'Smith')}`;
console.log(fullName); // John Smith

// 嵌套模板
const outerVar = 'outer';
const nested = `${outerVar} ${`${'inner'}`}`;
console.log(nested); // outer inner
```

## 七、全局对象属性

### 7.1 全局对象属性的差异

::: tip 全局变量与全局对象的关系
1. **var**：在全局作用域中使用var声明的变量会成为全局对象的属性
2. **let/const**：在全局作用域中使用let/const声明的变量不会成为全局对象的属性
3. **可配置性**：var声明的全局变量是可配置的，可以使用delete删除
4. **let/const**：全局作用域中的let/const变量不可配置
:::

### 7.2 示例

```javascript
// 浏览器环境中测试（全局对象为window）

// var声明的全局变量
var globalVar = 'var global';
console.log(window.globalVar); // 'var global'
console.log('globalVar' in window); // true

// let声明的全局变量
let globalLet = 'let global';
console.log(window.globalLet); // undefined
console.log('globalLet' in window); // false

// const声明的全局变量
const globalConst = 'const global';
console.log(window.globalConst); // undefined
console.log('globalConst' in window); // false

// 直接赋值给全局对象的属性
window.globalProp = 'global property';
console.log(globalProp); // 'global property'（浏览器环境）
```

## 八、实际应用建议

### 8.1 变量声明最佳实践

::: tip 变量声明推荐
1. **优先使用const**：对于不会重新赋值的变量，优先使用const
2. **其次使用let**：对于需要重新赋值的变量，使用let
3. **避免使用var**：除非有特殊原因，尽量避免使用var
4. **最小作用域**：变量应在最小必要的作用域内声明
5. **明确初始值**：尽可能在声明时就初始化变量
:::

### 8.2 解构赋值的使用场景

::: info 解构赋值适用场景
1. **函数参数**：方便地提取对象参数中的属性
2. **模块导入**：从模块中导入特定的导出项
3. **API响应处理**：从复杂的API返回数据中提取需要的字段
4. **配置对象**：处理默认配置和用户配置的合并
5. **状态管理**：从复杂状态对象中提取需要的数据
:::

### 8.3 性能和注意事项

::: warning 注意事项
1. **解构性能**：过度使用嵌套解构可能会影响性能，特别是在循环中
2. **默认值计算**：默认值表达式会在每次解构时重新计算，复杂表达式可能影响性能
3. **暂时性死区**：需要注意在let/const声明之前不要使用变量
4. **const与引用类型**：记住const只保证引用不变，不保证内容不变
5. **内存泄漏**：解构时创建的变量引用可能导致意外的内存泄漏
:::

### 8.4 高级应用示例

:::details 变量扩展的高级应用
```javascript
// 使用let和const重构旧代码
// 旧代码（使用var）
function oldStyle() {
  var result = [];
  for (var i = 0; i < 5; i++) {
    result.push(function() { return i; });
  }
  // 所有函数返回5，因为i在循环结束后是5
  return result;
}

// 新代码（使用let）
function newStyle() {
  const result = [];
  for (let i = 0; i < 5; i++) {
    // 每次迭代创建新的i绑定
    result.push(function() { return i; });
  }
  // 函数分别返回0, 1, 2, 3, 4
  return result;
}

// 使用解构进行配置合并
function setup(options = {}) {
  const { 
    width = 800, 
    height = 600, 
    theme = 'light',
    plugins = [] 
  } = options;
  
  console.log(`Width: ${width}, Height: ${height}, Theme: ${theme}`);
  console.log(`Plugins: ${plugins.length}`);
}

// 使用模板字符串构建复杂字符串
function generateReport(data) {
  const { title, items, author, date } = data;
  
  return `
    # ${title}
    
    *Generated by ${author} on ${date}*
    
    ## Items
    ${items.map(item => `- ${item.name}: ${item.value}`).join('\n    ')}
    
    ## Summary
    Total items: ${items.length}
    Total value: ${items.reduce((sum, item) => sum + item.value, 0)}
  `;
}
```
:::