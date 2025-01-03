# ECMAScript6 (2015)

## 一、ES6 新增特性
:::warning 汇总
1. 变量声明`let/const`
2. 模板字符串
3. 箭头函数
4. 默认参数
5. 异步函数
6. 展开运算符
7. 解构赋值
8. 类
9. 模块
10. 迭代器
11. 生成器
12. `Promise`
:::
### 1、变量声明
> ES6 允许在声明变量时，用 let 和 const 关键字来声明变量。
### 1.1、 let 声明
::: tip 特性

- let 声明的变量只在块级作用域内有效，在代码块外不可引用。
- let 声明的变量不能重复声明。
- let 声明的变量可以修改。
- let 声明的变量可以不用声明初始化值，但不能访问未初始化的变量。
- 暂时性死区（Temporal Dead Zone，简称 TDZ）：在声明变量之前，不能访问该变量。
- 语法：
   - `let 变量名 = 值;`
:::

### 1.2、 const 声明
::: tip 特性

- const 声明的变量也只在块级作用域内有效，在代码块外不可引用。
- const 声明的变量`不能重复声明`。
- const 声明的变量的值`不能改变`。
- const 声明的变量必须初始化赋值。
- 语法：
   - `const 变量名 = 值;`
:::

### 2、字符串
::: tip 特性

- ES6 新增了字符串的多行模板字符串，允许在字符串中嵌入变量。
- 语法：
   - `const 变量名 = `
   - `  多行字符串`
   - `  ${变量名}`
   - `  ${表达式}`
   - `  ${函数调用}`
   - `  字符串`;
:::


### 3、箭头函数
::: tip 特性
- 箭头函数是一种新的函数语法，它使用 `=>` 而不是 `function` 关键字。
- 箭头函数没有自己的 `this`，它会捕获其所在上下文的 `this` 值。
- 箭头函数没有自己的 `arguments` 对象，它会捕获其所在上下文的 `arguments` 值。
- 箭头函数没有自己的 `super` 关键字，它会捕获其所在上下文的 `super` 值。
- 箭头函数没有自己的 `new.target` 关键字，它会捕获其所在上下文的 `new.target` 值。
- 箭头函数没有自己的 `prototype` 属性，它会捕获其所在上下文的 `prototype` 值。
:::

### 4、 默认参数
::: tip 特性
- ES6 允许给函数的参数设置默认值，这样就不用在函数调用时再传入参数了。
- 语法：
   - `function 函数名(参数名 = 默认值) { }`
:::

### 5、异步函数
::: tip 特性
- ES6 新增了异步函数（async function）语法，可以用来处理异步操作。
- 语法：
   - `async function 函数名() { }`
   - `await 表达式`
:::

### 6、 展开运算符
::: tip 特性
- 展开运算符（`...`）是三个点，它可以将数组或者对象转换为可迭代的元素。
- 语法：
   - `const 变量名 = [元素1, 元素2,...数组或对象]`
   - `const 变量名 = {属性1: 值1, 属性2: 值2,...对象}`
:::

### 7、解构赋值
::: tip 特性
- 解构赋值允许将数组或者对象中的值，按照对应位置，分别赋值给变量。
- 语法：
   - `const [变量1, 变量2, 变量3] = [值1, 值2, 值3]`
   - `const {变量1: 变量2, 变量3: 变量4} = {属性1: 值1, 属性2: 值2}`
:::

### 8、 类
::: tip 特性
- ES6 新增了类（class）语法，可以用来创建对象。
- 语法：
   - `class 类名 { }`
   - `constructor() { }`
   - `方法名() { }`
:::

### 9、模块
::: tip 特性
- ES6 新增了模块（module）语法，可以将代码分割成多个文件，并通过模块的导入和导出来使用。
- 语法：
   - `import 模块名 from '模块路径';`
   - `export { 变量名1, 变量名2 };`
   - `export default 变量名;`
:::

### 10、迭代器
::: tip 特性
- ES6 新增了迭代器（iterator）语法，可以用来遍历数组或者其他可迭代对象。
- 语法：
   - `const 变量名 = 数组或对象[Symbol.iterator]()`
   - `变量名.next()`
:::

### 11、生成器
::: tip 特性
- ES6 新增了生成器（generator）语法，可以用来生成迭代器。
- 语法：
   - `function* 函数名() { }`
   - `yield 表达式`
:::

### 12、 Promise
::: tip 特性
- ES6 新增了 Promise（承诺）语法，可以用来处理异步操作。
- 语法：
   - `const 变量名 = new Promise((resolve, reject) => { }`
   - `resolve(值)`
   - `reject(原因)`
:::

二、ES6 常用 API
::: warning 汇总
1. Array
2. Object
3. String
4. Number
5. Math
6. Date
7. RegExp
8. Map
9. Set
10. WeakMap
11. WeakSet
12. Proxy
13. Reflect
14. JSON
15. Error
16. Symbol
17. Iterator
18. Generator
19. Promise
20. Async/Await
:::

### 1、Array
::: tip 特性
- ES6 新增了数组方法，可以用来操作数组。
- 语法：
   - `Array.from(可迭代对象)`
   - `Array.of(元素1, 元素2)`
   - `数组.fill(值, 起始索引, 结束索引)`
   - `数组.flat(深度)`
   - `数组.flatMap(回调函数)`
   - `数组.entries()`
   - `数组.keys()`
   - `数组.values()`
   - `数组.reduce(回调函数, 初始值)`
   - `数组.reduceRight(回调函数, 初始值)`
   - `数组.splice(起始索引, 删除数量, 元素1, 元素2)`
:::

### 2、Object
::: tip 特性
- ES6 新增了对象方法，可以用来操作对象。
- 语法：
   - `Object.assign(目标对象, 源对象1, 源对象2)`
   - `Object.create(原型对象, 实例属性)`
   - `Object.defineProperties(对象, 属性描述符)`
   - `Object.defineProperty(对象, 属性名, 属性描述符)`
   - `Object.entries(对象)`
   - `Object.freeze(对象)`
   - `Object.fromEntries(键值对数组)`
   - `Object.getOwnPropertyDescriptor(对象, 属性名)`
   - `Object.getOwnPropertyNames(对象)`
   - `Object.getOwnPropertySymbols(对象)`
   - `Object.getPrototypeOf(对象)`
   - `Object.is(值1, 值2)`
   - `Object.isExtensible(对象)`
   - `Object.isFrozen(对象)`
   - `Object.isSealed(对象)`
   - `Object.keys(对象)`
   - `Object.preventExtensions(对象)`
   - `Object.seal(对象)`
   - `Object.setPrototypeOf(对象, 原型对象)`
   - `Object.values(对象)`
:::

### 3、String
::: tip 特性
- ES6 新增了字符串方法，可以用来操作字符串。
- 语法：
   - `字符串.codePointAt(索引)`
   - `字符串.normalize(NormalizationForm)`
   - `字符串.padEnd(长度, 填充字符)`    
   - `字符串.padStart(长度, 填充字符)`
   - `字符串.repeat(次数)`
:::
