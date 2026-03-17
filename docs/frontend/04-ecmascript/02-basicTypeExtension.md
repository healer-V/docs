---
title: "基本类型扩展"
category: "前端 · ECMAScript"
excerpt: "模板字符串：使用反引号(`)创建的字符串，可以包含变量插值 字符串方法增强：新增了多个实用的字符串处理方法 Unicode支持：更好地支持Unicode字符集 字符串遍历：支持使用for...of循环遍历字符串 原始字符串：通过String..."
---

# 基本类型扩展

## 一、字符串的扩展

### 1.1 字符串扩展的基本概念

::: tip 字符串扩展特性概述
1. **模板字符串**：使用反引号(`)创建的字符串，可以包含变量插值
2. **字符串方法增强**：新增了多个实用的字符串处理方法
3. **Unicode支持**：更好地支持Unicode字符集
4. **字符串遍历**：支持使用for...of循环遍历字符串
5. **原始字符串**：通过String.raw()获取原始字符串
:::

### 1.2 模板字符串

::: info 模板字符串定义
1. **语法**：使用反引号(`)而不是单引号或双引号
2. **变量插值**：使用${}语法在字符串中嵌入变量或表达式
3. **多行字符串**：可以直接在字符串中包含换行符
4. **嵌套模板**：支持在${}中嵌套其他模板字符串
:::

#### 基本语法

```javascript
const 模板字符串 = `字符串内容${变量或表达式}字符串内容`;
```

示例

::: details 点击查看模板字符串示例
```javascript
// 基本变量插值
const name = 'JavaScript';
const message = `Hello, ${name}!`;
console.log(message); // "Hello, JavaScript!"

// 表达式插值
const a = 10, b = 5;
const result = `${a} + ${b} = ${a + b}`;
console.log(result); // "10 + 5 = 15"

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

const fullName = `Name: ${getFullName('John', 'Doe')}`;
console.log(fullName); // "Name: John Doe"

// 嵌套模板
const outer = 'outer';
const nested = `${outer} ${`${'inner'}`}`;
console.log(nested); // "outer inner"
```
:::

### 1.3 新增字符串方法

::: tip 字符串新增方法
1. **includes()**：判断字符串是否包含指定字符
2. **startsWith()**：判断字符串是否以指定字符开头
3. **endsWith()**：判断字符串是否以指定字符结尾
4. **repeat()**：将字符串重复指定次数
5. **padStart()**：在字符串开头填充指定字符
6. **padEnd()**：在字符串结尾填充指定字符
7. **trimStart()**：移除字符串开头的空白字符
8. **trimEnd()**：移除字符串结尾的空白字符
:::

示例

```javascript
// includes()
const str = 'Hello world';
console.log(str.includes('world')); // true
console.log(str.includes('JavaScript')); // false

// startsWith()
console.log(str.startsWith('Hello')); // true
console.log(str.startsWith('world')); // false

// endsWith()
console.log(str.endsWith('world')); // true
console.log(str.endsWith('Hello')); // false

// repeat()
console.log('JS'.repeat(3)); // "JSJSJS"

// padStart()
console.log('123'.padStart(5, '0')); // "00123"

// padEnd()
console.log('123'.padEnd(5, '0')); // "12300"

// trimStart()
console.log('  hello  '.trimStart()); // "hello  "

// trimEnd()
console.log('  hello  '.trimEnd()); // "  hello"
```

### 1.4 字符串遍历和Unicode支持

::: info Unicode支持特性
1. **for...of循环**：可以正确遍历字符串中的Unicode字符
2. **codePointAt()**：获取字符的码点
3. **String.fromCodePoint()**：根据码点创建字符
4. **normalize()**：Unicode标准化
:::

示例

::: details 点击查看Unicode支持示例
```javascript
// for...of循环遍历字符串
for (const char of 'hello') {
  console.log(char); // 依次输出: h, e, l, l, o
}

// 处理Unicode字符
const text = '\u{1F600}'; // 😀
console.log(text.length); // 2 (UTF-16编码占用2个码元)

// codePointAt()
console.log('\u{1F600}'.codePointAt(0).toString(16)); // "1f600"

// String.fromCodePoint()
console.log(String.fromCodePoint(0x1F600)); // "😀"

// normalize()
const s1 = '\u00E9'; // é
const s2 = '\u0065\u0301'; // e + 组合重音符号
console.log(s1); // "é"
console.log(s2); // "é"
console.log(s1 === s2); // false
console.log(s1.normalize() === s2.normalize()); // true
```
:::

### 1.5 原始字符串

::: tip 原始字符串定义
1. **String.raw()**：返回字符串的原始形式，不会处理转义字符
2. **模板标签函数**：可以作为模板字符串的标签函数
:::

示例

```javascript
// String.raw()
console.log(String.raw`\n`); // "\\n"（不会被转义为换行符）
console.log(String.raw`C:\Users\Documents`); // "C:\\Users\\Documents"

// 作为模板标签函数
const path = String.raw`C:\Users\${'username'}\Desktop`;
console.log(path); // "C:\\Users\\username\\Desktop"
```

## 二、数值的扩展

### 2.1 数值扩展的基本概念

::: tip 数值扩展特性概述
1. **二进制和八进制字面量**：使用0b和0o前缀表示二进制和八进制
2. **数值分隔符**：使用下划线(_)分隔数字，提高可读性
3. **全局对象Math扩展**：新增了多个数学计算方法
4. **Number对象扩展**：新增了静态方法和属性
5. **安全整数处理**：提供了处理安全整数的方法
:::

### 2.2 二进制和八进制字面量

::: info 二进制和八进制语法
1. **二进制**：使用0b或0B前缀
2. **八进制**：使用0o或0O前缀
3. **转换**：可以使用Number()或parseInt()进行转换
:::

示例

```javascript
// 二进制字面量
const binary = 0b1010;
console.log(binary); // 10

// 八进制字面量
const octal = 0o777;
console.log(octal); // 511

// 转十进制
console.log(Number('0b1010')); // 10
console.log(parseInt('1010', 2)); // 10
```

### 2.3 数值分隔符

::: tip 数值分隔符规则
1. **语法**：使用下划线(_)分隔数字
2. **位置**：可以放在整数部分或小数部分，但不能放在开头、结尾或小数点旁边
3. **用途**：提高大数字的可读性
:::

示例

```javascript
// 整数部分分隔
const largeNumber = 1_000_000_000;
console.log(largeNumber); // 1000000000

// 小数部分分隔
const pi = 3.141_592_653;
console.log(pi); // 3.141592653

// 科学计数法分隔
const scientific = 1.6e-19;
console.log(scientific); // 1.6e-19

// 二进制分隔
const binaryWithSeparator = 0b1010_1010;
console.log(binaryWithSeparator); // 170
```

### 2.4 Number对象扩展

::: info Number对象新方法
1. **Number.isFinite()**：检查是否为有限数值
2. **Number.isNaN()**：检查是否为NaN
3. **Number.isInteger()**：检查是否为整数
4. **Number.parseInt()**：与全局parseInt()相同
5. **Number.parseFloat()**：与全局parseFloat()相同
6. **Number.EPSILON**：表示JavaScript中能表示的最小精度
7. **Number.MAX_SAFE_INTEGER**：最大安全整数
8. **Number.MIN_SAFE_INTEGER**：最小安全整数
9. **Number.isSafeInteger()**：检查是否为安全整数
:::

示例

```javascript
// Number.isFinite()
console.log(Number.isFinite(10)); // true
console.log(Number.isFinite(Infinity)); // false

// Number.isNaN()
console.log(Number.isNaN(NaN)); // true
console.log(Number.isNaN('NaN')); // false

// Number.isInteger()
console.log(Number.isInteger(10)); // true
console.log(Number.isInteger(10.0)); // true
console.log(Number.isInteger(10.1)); // false

// Number.parseInt()
console.log(Number.parseInt('10px')); // 10

// Number.EPSILON
console.log(Number.EPSILON); // 2.220446049250313e-16

// 安全整数
console.log(Number.MAX_SAFE_INTEGER); // 9007199254740991
console.log(Number.MIN_SAFE_INTEGER); // -9007199254740991
console.log(Number.isSafeInteger(9007199254740991)); // true
console.log(Number.isSafeInteger(9007199254740992)); // false
```

### 2.5 Math对象扩展

::: tip Math对象新方法
1. **Math.trunc()**：去除小数部分，返回整数部分
2. **Math.sign()**：判断数值的符号
3. **Math.cbrt()**：计算立方根
4. **Math.clz32()**：返回数字的32位二进制表示中前导零的个数
5. **Math.imul()**：返回两个数的32位整数乘法结果
6. **Math.fround()**：返回数字的单精度浮点数表示
7. **Math.hypot()**：返回所有参数的平方和的平方根
8. **Math.expm1()**：计算e^x - 1
9. **Math.log1p()**：计算自然对数(1 + x)
10. **Math.log10()**：计算以10为底的对数
:::

示例

::: details 点击查看Math扩展方法示例
```javascript
// Math.trunc()
console.log(Math.trunc(10.9)); // 10
console.log(Math.trunc(-10.9)); // -10

// Math.sign()
console.log(Math.sign(10)); // 1
console.log(Math.sign(-10)); // -1
console.log(Math.sign(0)); // 0
console.log(Math.sign(-0)); // -0

// Math.cbrt()
console.log(Math.cbrt(8)); // 2
console.log(Math.cbrt(-8)); // -2

// Math.clz32()
console.log(Math.clz32(1)); // 31
console.log(Math.clz32(1000)); // 22

// Math.imul()
console.log(Math.imul(0x7fffffff, 0x7fffffff)); // 1

// Math.fround()
console.log(Math.fround(1.337)); // 1.3370000123977661

// Math.hypot()
console.log(Math.hypot(3, 4)); // 5
console.log(Math.hypot(5, 12)); // 13

// Math.expm1()
console.log(Math.expm1(1)); // 1.718281828459045

// Math.log1p()
console.log(Math.log1p(1)); // 0.6931471805599453

// Math.log10()
console.log(Math.log10(100)); // 2
```
:::

## 三、正则的扩展

### 3.1 正则扩展的基本概念

::: tip 正则扩展特性概述
1. **y修饰符**：粘性匹配，从目标字符串的当前位置开始匹配
2. **u修饰符**：Unicode模式，正确处理Unicode字符
3. **s修饰符**：dotAll模式，允许.匹配任何字符，包括换行符
4. **RegExp构造函数增强**：允许使用正则表达式字面量作为参数
5. **正则表达式的flags属性**：获取正则表达式的修饰符
6. **后行断言**：支持先行断言和后行断言
:::

### 3.2 `u`修饰符（Unicode模式）

::: info u修饰符特点
1. **正确处理Unicode字符**：将码点大于0xFFFF的字符视为一个字符
2. **大括号表示法**：支持使用{...}表示Unicode字符
3. **Unicode属性转义**：支持Unicode属性的正则匹配
:::

示例

```javascript
// u修饰符处理Unicode字符
const text = '\u{1F600}'; // 😀
const regex1 = /^.$/;
const regex2 = /^.$/u;
console.log(regex1.test(text)); // false (将Unicode字符视为两个字符)
console.log(regex2.test(text)); // true (将Unicode字符视为一个字符)

// 大括号表示法
const regex3 = /\u{1F600}/u;
console.log(regex3.test(text)); // true

// Unicode属性转义 (ES2018)
const regex4 = /\p{L}/u; // 匹配任何Unicode字母
console.log(regex4.test('a')); // true
console.log(regex4.test('你')); // true
```

### 3.3 `y`修饰符（粘性匹配）

::: tip y修饰符特点
1. **粘性匹配**：从目标字符串的当前位置开始匹配
2. **lastIndex属性**：记录下一次匹配的起始位置
3. **严格匹配**：必须从lastIndex位置开始匹配成功
:::

示例

```javascript
// y修饰符粘性匹配
const text = 'aaa_aa_a';
const regex1 = /a+/g;
const regex2 = /a+/y;

console.log(regex1.exec(text)); // ["aaa"]
console.log(regex1.lastIndex); // 3
console.log(regex1.exec(text)); // ["aa"]
console.log(regex1.lastIndex); // 6

console.log(regex2.exec(text)); // ["aaa"]
console.log(regex2.lastIndex); // 3
console.log(regex2.exec(text)); // null (在位置3处匹配失败，因为是下划线)

// 重置lastIndex
regex2.lastIndex = 4;
console.log(regex2.exec(text)); // ["aa"]
console.log(regex2.lastIndex); // 6
```

### 3.4 `s`修饰符（dotAll模式）

::: info s修饰符特点
1. **dotAll模式**：允许.匹配任何字符，包括换行符
2. **s修饰符**：使正则表达式的.元字符能够匹配所有字符
:::

示例

```javascript
// s修饰符dotAll模式
const text = 'Hello\nWorld';
const regex1 = /Hello.World/;
const regex2 = /Hello.World/s;

console.log(regex1.test(text)); // false (默认情况下.不匹配换行符)
console.log(regex2.test(text)); // true (s修饰符使.匹配换行符)
```

### 3.5 正则表达式的flags属性

::: tip flags属性
1. **获取修饰符**：返回正则表达式的所有修饰符
2. **只读属性**：flags属性是只读的
3. **按字母排序**：返回的修饰符按字母顺序排列
:::

示例

```javascript
// flags属性
const regex1 = /abc/gim;
console.log(regex1.flags); // "gim"

const regex2 = /xyz/yus;
console.log(regex2.flags); // "suy" (按字母排序)
```

### 3.6 断言

::: info 断言的类型
1. **先行断言**：x(?=y)，匹配x仅当x后面跟着y
2. **先行否定断言**：x(?!y)，匹配x仅当x后面不跟着y
3. **后行断言**：(?<=y)x，匹配x仅当x前面是y
4. **后行否定断言**：(?<!y)x，匹配x仅当x前面不是y
:::

示例

::: details 点击查看断言示例
```javascript
// 先行断言
const regex1 = /\d+(?=元)/;
console.log(regex1.exec('价格是100元')); // ["100"]

// 先行否定断言
const regex2 = /\d+(?!元)/;
console.log(regex2.exec('价格是100美元')); // ["100"]

// 后行断言 (ES2018)
const regex3 = /(?<=￥)\d+/;
console.log(regex3.exec('价格是￥100')); // ["100"]

// 后行否定断言 (ES2018)
const regex4 = /(?<!￥)\d+/;
console.log(regex4.exec('价格是$100')); // ["100"]

// 实际应用示例
const text = 'The price is $100 and $200';
const regex5 = /\$(\d+)/g;
let match;
const prices = [];
while ((match = regex5.exec(text)) !== null) {
  prices.push(match[1]);
}
console.log(prices); // ["100", "200"]
```
:::

## 四、运算符的扩展

### 4.1 运算符扩展的基本概念

::: tip 运算符扩展特性概述
1. **展开运算符**：使用...将数组或对象展开
2. **剩余参数**：使用...接收函数的剩余参数
3. **指数运算符**：使用**进行指数运算
4. **空值合并运算符**：使用??处理null和undefined
5. **可选链运算符**：使用?.安全地访问对象的属性
6. **逻辑赋值运算符**：结合逻辑运算符和赋值运算符
:::

### 4.2 展开运算符

::: info 展开运算符特点
1. **语法**：使用三个点(...)
2. **数组展开**：将数组元素展开为单独的值
3. **对象展开**：将对象属性展开为键值对
4. **函数调用**：在函数调用时展开参数
:::

示例

```javascript
// 数组展开
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5];
console.log(arr2); // [1, 2, 3, 4, 5]

// 数组复制
const arr3 = [...arr1];
console.log(arr3); // [1, 2, 3]

// 合并数组
const arr4 = [1, 2];
const arr5 = [3, 4];
const merged = [...arr4, ...arr5];
console.log(merged); // [1, 2, 3, 4]

// 字符串转数组
const str = 'hello';
const chars = [...str];
console.log(chars); // ["h", "e", "l", "l", "o"]

// 对象展开 (ES2018)
const obj1 = { a: 1, b: 2 };
const obj2 = { ...obj1, c: 3 };
console.log(obj2); // { a: 1, b: 2, c: 3 }

// 对象合并
const obj3 = { a: 1, b: 2 };
const obj4 = { b: 3, c: 4 };
const mergedObj = { ...obj3, ...obj4 };
console.log(mergedObj); // { a: 1, b: 3, c: 4 }
```

### 4.3 剩余参数

::: tip 剩余参数特点
1. **语法**：在函数参数中使用...参数名
2. **收集剩余参数**：将函数的剩余参数收集到一个数组中
3. **与arguments区别**：剩余参数是数组，arguments是类数组对象
4. **只能放在最后**：剩余参数必须是函数的最后一个参数
:::

示例

```javascript
// 基本用法
function sum(...numbers) {
  return numbers.reduce((total, num) => total + num, 0);
}

console.log(sum(1, 2, 3, 4)); // 10

// 结合其他参数
function greet(name, ...messages) {
  console.log(`Hello, ${name}!`);
  messages.forEach(msg => console.log(msg));
}

greet('John', 'Welcome!', 'How are you?');
// Hello, John!
// Welcome!
// How are you?

// 解构与剩余参数
function destructuring({ a, b, ...rest }) {
  console.log(a, b, rest);
}

destructuring({ a: 1, b: 2, c: 3, d: 4 }); // 1 2 { c: 3, d: 4 }
```

### 4.4 指数运算符

::: info 指数运算符特点
1. **语法**：使用**运算符
2. **右结合性**：从右到左计算
3. **与Math.pow()相同**：结果等同于Math.pow()
:::

示例

```javascript
// 基本用法
console.log(2 ** 3); // 8
console.log(3 ** 2); // 9

// 右结合性
console.log(2 ** 3 ** 2); // 512 (等同于2 ** (3 ** 2))

// 与Math.pow()比较
console.log(2 ** 10); // 1024
console.log(Math.pow(2, 10)); // 1024

// 赋值运算符
let x = 2;
x **= 3;
console.log(x); // 8
```

### 4.5 空值合并运算符

::: tip 空值合并运算符特点
1. **语法**：使用??运算符
2. **左侧为null或undefined时返回右侧**：否则返回左侧
3. **与||区别**：??只对null和undefined敏感，||对所有假值都敏感
4. **短路运算**：如果左侧不为null或undefined，右侧不会求值
:::

示例

```javascript
// 基本用法
console.log(null ?? 'default'); // "default"
console.log(undefined ?? 'default'); // "default"
console.log('value' ?? 'default'); // "value"

// 与||的区别
console.log(0 || 'default'); // "default" (0是假值)
console.log(0 ?? 'default'); // 0 (0不是null或undefined)

console.log('' || 'default'); // "default" (空字符串是假值)
console.log('' ?? 'default'); // "" (空字符串不是null或undefined)

console.log(false || 'default'); // "default" (false是假值)
console.log(false ?? 'default'); // false (false不是null或undefined)

// 实际应用
function processOptions(options) {
  const timeout = options.timeout ?? 3000;
  const retries = options.retries ?? 3;
  console.log(timeout, retries);
}

processOptions({ timeout: 5000 }); // 5000 3
processOptions({ timeout: 0 }); // 0 3 (0不会被替换为默认值)
```

### 4.6 可选链运算符

::: info 可选链运算符特点
1. **语法**：使用?.运算符
2. **安全访问属性**：如果左侧对象为null或undefined，直接返回undefined而不报错
3. **支持嵌套属性**：可以链式访问多层属性
4. **支持函数调用**：可以安全地调用可能不存在的方法
5. **支持数组索引**：可以安全地访问数组元素
:::

示例

::: details 点击查看可选链运算符示例
```javascript
// 基本用法
const user = {
  name: 'John',
  address: {
    city: 'New York'
  }
};

console.log(user.address?.city); // "New York"
console.log(user.contact?.phone); // undefined (不会报错)

// 嵌套属性
const data = {
  user: {
    profile: {
      avatar: 'avatar.jpg'
    }
  }
};

console.log(data.user?.profile?.avatar); // "avatar.jpg"
console.log(data.user?.settings?.theme); // undefined

// 函数调用
const api = {
  fetchData() {
    return 'data';
  }
};

console.log(api.fetchData?.()); // "data"
console.log(api.fetchUsers?.()); // undefined

// 数组索引
const list = [1, 2, 3];
console.log(list?.[0]); // 1
console.log(list?.[5]); // undefined

const emptyList = null;
console.log(emptyList?.[0]); // undefined

// 结合空值合并运算符
const config = {
  theme: {
    // color未定义
  }
};

const color = config.theme?.color ?? 'default';
console.log(color); // "default"

// 实际应用示例
function getUserInfo(userId) {
  const user = fetchUserById(userId); // 可能返回undefined
  return {
    id: userId,
    name: user?.name ?? 'Unknown',
    email: user?.contact?.email ?? 'No email',
    permissions: user?.getPermissions?.() ?? []
  };
}
```
:::

### 4.7 逻辑赋值运算符

::: tip 逻辑赋值运算符特点
1. **语法**：结合逻辑运算符和赋值运算符
2. **类型**：包括||=、&&=、??=
3. **短路运算**：遵循逻辑运算符的短路规则
4. **简化代码**：替代常见的条件赋值模式
:::

示例

```javascript
// 逻辑或赋值 (||=)
let x = 0;
x ||= 10;
console.log(x); // 10 (等同于x = x || 10)

let y = 5;
y ||= 10;
console.log(y); // 5 (因为5是真值)

// 逻辑与赋值 (&&=)
let a = 10;
a &&= 5;
console.log(a); // 5 (等同于a = a && 5)

let b = 0;
b &&= 5;
console.log(b); // 0 (因为0是假值)

// 空值合并赋值 (??=)
let c = null;
c ??= 20;
console.log(c); // 20 (等同于c = c ?? 20)

let d = 0;
d ??= 20;
console.log(d); // 0 (因为0不是null或undefined)

// 实际应用
function updateConfig(config) {
  // 仅当不存在时才设置默认值
  config.timeout ??= 3000;
  config.retries ??= 3;
  config.debug ||= false;
  return config;
}

const defaultConfig = updateConfig({});
console.log(defaultConfig); // { timeout: 3000, retries: 3, debug: false }

const customConfig = updateConfig({ timeout: 5000, debug: true });
console.log(customConfig); // { timeout: 5000, retries: 3, debug: true }
```

