---
title: "JavaScript面试题"
category: "面试题"
tags:
  - JavaScript
excerpt: "围绕 JavaScript 类型与转换、原型与闭包、异步调度、对象复制、内存管理和浏览器 API 等面试问题，解释结论成立的条件、代码输出及常见误区，帮助准确回答机制与场景追问。"
---

# JavaScript面试题

JavaScript 的行为由语言规则与运行环境共同决定。类型转换、作用域和原型属于语言规则；DOM（文档对象模型）、计时器和网络请求由浏览器等宿主环境提供。分析一道题时，应先确定操作对象和运行条件，再推导结果。

## 一、类型与转换

类型与转换题需要先判断值的类型，再按当前操作的规则推导结果。原始值、对象身份、相等和布尔判断各有规则，不能混用一个判断方法。

### 1. 原始值与对象的本质区别是什么，函数属于哪一类？

#### 1.1 类型分类与可变性

1. **JavaScript 有七种原始类型，以及 Object 类型。** 原始值不可变；对象可以保存属性，数组和函数都是对象的特殊形式。

   | 类别 | 类型 | 代表值与含义 |
   |------|------|----------------|
   | 原始类型 | Undefined、Null | `undefined`、`null`，分别表示未提供值与明确的空值 |
   | 原始类型 | Boolean、String | 布尔判断和文本 |
   | 原始类型 | Number | 数值，包括 `NaN`、无穷大 |
   | 原始类型 | BigInt | 任意精度整数，如 `9007199254740993n` |
   | 原始类型 | Symbol | 唯一标识，常用于属性键 |
   | 对象类型 | Object | 普通对象、数组、函数、日期、集合等 |

#### 1.2 对象身份与实际选型

1. **分类依据：** 原始值本身不可变；对象具有身份，可以保存可变属性。对象属性键可以是字符串或 Symbol，数字键会按规则转成字符串。函数是可调用对象，`typeof` 返回 `"function"` 不意味着语言增加了第九种类型。

2. **选型边界：** 订单金额还要明确单位和舍入规则；超出安全整数范围的编号可考虑字符串或 BigInt。BigInt 与 Number 不能直接混合做加法，接口与 JSON 的表示也要统一。

参考：[MDN：JavaScript 数据类型](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Data_structures)。

### 2. 原始值和对象的赋值、传参有何区别？

#### 2.1 赋值和传参的实际行为

1. **赋值和传参都传递值；对象的值使多个变量能够指向同一个对象。** 修改共享对象与重新给变量赋值是两种操作，不能把 JavaScript 说成“对象按引用传参”。

   以下代码可在现代浏览器控制台执行，观察属性修改与变量重赋值：

   ::: details 查看对象传参的完整验证代码

   ```javascript
   const order = { status: "pending" };
   /** 修改传入订单后重赋局部参数；无返回值，会改变原对象的 status。 */
   function updateOrder(currentOrder) {
     currentOrder.status = "paid";
     currentOrder = { status: "cancelled" };
   }
   updateOrder(order);
   console.log(order.status); // paid
   let quantity = 1;
   const copiedQuantity = quantity;
   quantity = 2;
   console.log(copiedQuantity); // 1
   ```

   :::

#### 2.2 共享对象与局部重赋

1. 函数内重新赋值只改变局部参数，不会把调用方的 `order` 改成新对象；修改属性则作用于双方共享的对象。给对象套一层 `const` 也只限制变量重赋值，不限制属性修改。

   ::: warning 内存位置不是语言层面的固定承诺
   “原始值都在栈、对象都在堆”不能作为规范结论。闭包、优化和引擎表示方式会影响实际存储，应以可观察的复制与共享行为解释题目。
   :::

参考：[MDN：函数参数](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions#function_parameters)。

### 3. null 与 undefined 有何区别，为什么 typeof null 是 object？

#### 3.1 两个空值的语义

1. **`undefined` 常表示没有提供值，`null` 常表示主动表达空值；两者都是原始值。** `typeof null === "object"` 是保留至今的历史行为，不能据此认定 null 是对象。

   | 场景 | 常见结果 |
   |------|----------|
   | 声明变量但未赋值、读取不存在的属性 | `undefined` |
   | 函数没有显式返回、缺少实参 | `undefined` |
   | 主动清空当前选择 | 应用可约定为 `null` |
   | `null == undefined` | `true`，宽松相等的特殊规则 |
   | `null === undefined` | `false`，类型不同 |

#### 3.2 历史行为与业务判断

1. 例如“尚未获取订单”和“已获取但没有订单”可以用不同状态表达，不能只凭一个空值推断业务过程。判断 null 使用 `value === null`，不要用 `typeof` 单独判断。

2. 读取完全未声明的变量通常会抛出 ReferenceError，不能与“已声明、值为 undefined”混淆；`typeof` 对未声明标识符有特殊规则，对暂时性死区中的变量仍会报错。

参考：[MDN：null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null)、[MDN：typeof](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof)。

### 4. typeof、instanceof 和 constructor 能准确判断什么？

#### 4.1 各检测方法能证明什么

1. **`typeof` 判断粗粒度类型，通常的 `instanceof` 检查构造函数原型是否出现在原型链，`constructor` 只是可被修改的属性。** 应按检测目的选方法。

   | 方法 | 能确认什么 | 主要边界 |
   |------|------------|----------|
   | `typeof value` | 原始类型、可调用函数等 | null、数组、普通对象都可能显示 object |
   | `value instanceof Constructor` | 通常确认原型链关系 | 跨窗口、原型修改、`Symbol.hasInstance` 会影响结果 |
   | `Object.getPrototypeOf(value)` | 直接原型 | 不自动检查整个继承链 |
   | `Prototype.isPrototypeOf(value)` | 原型是否在链上 | 判断的是关系，不是业务数据是否合法 |
   | `value.constructor` | 当前查到的 constructor 属性 | 可以缺失或被重写，不能当作可信身份 |

#### 4.2 跨环境与业务数据边界

1. 例如从 iframe 获得的数组不一定通过当前窗口的 `instanceof Array`，因为两边的 Array 构造函数不同。校验接口对象是否包含订单号，应检查字段和约束，而不是只看它是否属于 Object。

2. `Object.prototype.toString.call()` 可辅助分类，但 `Symbol.toStringTag` 可以影响标签。原型检测、内置类型检测与业务结构校验是不同任务。

参考：[MDN：instanceof](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof)。

### 5. 为什么判断数组优先使用 Array.isArray()？

#### 5.1 数组身份的验证

1. **`Array.isArray()` 判断对象是否具有数组身份，能够正确处理跨窗口数组。** 它不只是比较构造函数，也不会把“看起来像数组”的对象算作数组。

   下面的独立片段可在现代浏览器控制台执行：

   ```javascript
   console.log(Array.isArray([])); // true
   console.log(Array.isArray({ 0: "订单", length: 1 })); // false
   console.log(Array.isArray(Object.create(Array.prototype))); // false
   console.log(Array.isArray(new Uint8Array(2))); // false
   ```

#### 5.2 类数组与可迭代对象的边界

1. 类数组对象有索引和长度，但不因此成为 Array；TypedArray（类型化数组）也有独立身份。`Array.isArray` 从 ES5 开始提供，不是 ES6 才新增。

2. 业务如果只需要遍历，还应判断是否可迭代，或通过 `Array.from()` 转换。不要把“不是数组”直接等同于“不能按顺序处理”。

参考：[MDN：Array.isArray()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray)。

### 6. String() 如何转换原始值和对象？

#### 6.1 原始值和对象的转换过程

1. **`String()` 将值转换为文本，对象会先尝试转成原始值。** 字符串提示下，先考虑 `Symbol.toPrimitive`，普通对象通常先尝试 `toString()`，再尝试 `valueOf()`；不是无限递归调用同一个方法。

   可在控制台验证以下结果：

   ```javascript
   console.log(String(null)); // "null"
   console.log(String(undefined)); // "undefined"
   console.log(String([1, 2])); // "1,2"
   console.log(String({})); // "[object Object]"
   console.log(String(Symbol("order"))); // "Symbol(order)"
   ```

#### 6.2 Symbol 与结构化数据的边界

1. 显式 `String(symbol)` 可用，但直接将 Symbol 与字符串拼接会抛出 TypeError。数组的默认字符串形式不是 JSON，普通对象默认输出也不包含完整字段。

2. 展示订单信息应明确选择字段；记录结构化数据可用适合该数据的序列化方式。不要用 `String(order)` 代替对象内容，也不要把序列化和类型转换视为同一过程。

参考：[MDN：String()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/String)。

### 7. Number() 与 parseInt()、parseFloat() 为何会解析出不同结果？

#### 7.1 整体转换与前缀解析的结果

1. **`Number()` 按完整输入转换，`parseInt()`、`parseFloat()` 可以读取开头的有效数字部分。** 接收用户输入时，需要区分格式合法性与能否解析出一个数字。

   | 表达式 | 结果 | 原因 |
   |--------|------|------|
   | `Number(null)` | `0` | null 的数值转换规则 |
   | `Number(undefined)` | `NaN` | undefined 不能转换为有效 Number |
   | `Number("")`、`Number("   ")` | `0` | 空或纯空白字符串 |
   | `Number("12px")` | `NaN` | 整体不是合法数值文本 |
   | `parseInt("12px", 10)` | `12` | 读取开头十进制整数部分 |
   | `parseFloat("12.5px")` | `12.5` | 读取开头小数部分 |

#### 7.2 输入校验为何不能只看解析结果

1. **机制：** `Number()` 要转换整个字符串，`parseInt()` 和 `parseFloat()` 从开头读取可解析部分。因此 `Number("12px")` 为 NaN，而 `parseInt("12px", 10)` 为 12。对象先转成原始值；Symbol 转数字会抛错，BigInt 显式转 Number 可能丢失精度。

2. **业务判断：** 订单数量不能为空时，先检查原文本，再转换并验证有限性、整数性与范围。`Number("") === 0` 不能证明用户填写了零；`parseInt("12px", 10) === 12` 也不能证明输入格式合法。

::: warning 可解析不等于输入合法
解析器接受数字前缀，是为了从文本中提取数字；表单校验要验证整个输入及业务范围。把 `parseInt` 的结果直接当作合法数量，会把 `12px` 误收为 12。
:::

参考：[MDN：Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)、[MDN：parseInt()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt)。

### 8. 哪些值是假值，空数组和 Symbol 会转换成什么？

#### 8.1 哪些值是假值

条件表达式会将参与判断的值转换为布尔值。除下面这些值和浏览器历史例外 `document.all` 外，其余值都是真值。

::: tip 假值
- `false`
- `undefined`
- `null`
- `0`、`-0`
- `0n`
- `NaN`
- 空字符串 `""`
:::

真值不等于“有内容”。以下值在条件判断中都会转换为 `true`：

::: tip 常见真值
- 空数组 `[]`、空对象 `{}`
- 非空字符串，包括 `"0"` 和 `"false"`
- 非零数字与非零 BigInt
- 任意 Symbol 值
:::

#### 8.2 空数组和 Symbol 为什么是真值

1. **空数组和空对象：** 它们是对象。布尔转换判断对象时，不检查数组长度、对象属性或包装的内容，所以 `Boolean([])` 与 `Boolean({})` 都是 `true`。
2. **Symbol：** 它虽是原始值，但不属于任何假值。描述文字是否为空，也不影响它的真假值。
3. **转换规则：** 布尔转换不会先调用对象的 `valueOf()` 或 `toString()`。不要把 `[] == false` 的宽松相等结果，当作空数组是假值的证据；相等比较使用了另一套转换规则。

在现代浏览器控制台运行以下代码，可分别观察对象、字符串、Symbol 和 BigInt 的转换结果：

```javascript
console.log(Boolean([])); // true
console.log(Boolean({})); // true
console.log(Boolean("false")); // true
console.log(Boolean(Symbol("order"))); // true
console.log(Boolean(0n)); // false
```

::: warning document.all 是浏览器历史例外
`document.all` 是具有特殊布尔转换行为的浏览器对象，结果为假值。它不能推翻普通对象均为真值的判断规则，也不应作为业务数据结构使用。
:::

#### 8.3 业务代码如何判断空值

1. **数组是否为空：** 已确认 `orders` 是数组时，使用 `orders.length === 0`；`if (orders)` 即使在空数组时也会进入分支。如果值来自接口且类型不可信，先验证它确实是数组。
2. **字符串是否只有空白：** 已确认输入是字符串时，可用 `input.trim().length === 0`。空格字符串本身是真值，但去除首尾空白后可能为空。
3. **数字零是否有效：** 数量为 `0` 不等于“未填写”。需要仅在 `null` 或 `undefined` 时提供默认值，可使用 `quantity ?? defaultQuantity`，不要直接用 `quantity || defaultQuantity` 覆盖合法的零。

参考：[MDN：Boolean 转换](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean#boolean_coercion)、[MDN：Falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy)。

### 9. 隐式类型转换发生在什么情况下？

#### 9.1 隐式转换的触发规则

1. **运算符会按自己的规则转换操作数，并不存在一条适用于全部运算的“统一转数字”规则。** `+` 还可能表示字符串拼接，比较和条件判断也使用不同规则。

   | 表达式 | 结果 | 推导重点 |
   |--------|------|----------|
   | `1 + "2"` | `"12"` | 转换后有字符串，发生拼接 |
   | `"5" - 2` | `3` | 数值运算 |
   | `"10" < "2"` | `true` | 两个字符串按字符序列比较 |
   | `"10" < 2` | `false` | 此处进行数值比较 |
   | `[] + 1` | `"1"` | 数组默认转成空字符串再拼接 |

#### 9.2 表达式推导与业务约束

1. 对象的原始值转换会优先考虑 `Symbol.toPrimitive`，不存在该方法时按提示选择 `valueOf` 与 `toString` 的顺序。两者都返回对象时会失败，而不是持续递归直到成功。

2. 表单输入通常是字符串。先明确接口和业务要求，显式转换并校验，再运算；仅把减号换成加号，就可能把总数量变成拼接文本。

参考：[MDN：类型强制转换](https://developer.mozilla.org/en-US/docs/Glossary/Type_coercion)。

### 10. ==、=== 与 Object.is() 为什么会得出不同结果？

#### 10.1 三种比较规则

1. **`==` 允许规则规定的类型转换，`===` 不做类型转换，`Object.is()` 进一步区分正负零并将 NaN 视为相同。** 它们都不会递归比较两个对象的字段。

   | 比较 | `==` | `===` | `Object.is` |
   |------|------|-------|-------------|
   | `1` 与 `"1"` | true | false | false |
   | `null` 与 `undefined` | true | false | false |
   | `NaN` 与 `NaN` | false | false | true |
   | `0` 与 `-0` | true | true | false |
   | 两个分别创建的 `{}` | false | false | false |

#### 10.2 类型转换与特殊值的边界

1. **差异来源：** 宽松相等按操作数类型决定是否转换：布尔值可转数字，字符串与数字可按数值比较，对象与原始值可先转原始值。`[] == 0` 因此为 true，但 `[] === 0` 为 false；`Object.is(NaN, NaN)` 为 true，`Object.is(0, -0)` 为 false。

2. **选择方式：** 业务值先规范类型，再优先用严格相等。`value == null` 可有意同时匹配 null 和 undefined，但必须明确这一特定规则。订单对象应按订单号或需要比较的字段判断内容，而非依赖对象身份比较。

::: tip 先确定比较的是值、身份还是业务等价
三个操作都不会递归比较对象字段。两个内容相同的新对象也有不同身份；只有先定义业务上的“相同”指什么，才能选对比较方式。
:::

参考：[MDN：相等比较](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness)。

### 11. ||、&& 和 ?? 返回布尔值吗？

#### 11.1 短路运算的返回规则

1. **通常返回某个操作数的原值，而不是统一返回布尔值，并且会短路。** 短路表示已经能确定结果时，不再计算后面的表达式。

   | 运算符 | 返回规则 | 示例 |
   |--------|----------|------|
   | `a \|\| b` | a 为真值时返回 a，否则返回 b | `0 \|\| 10` 为 10 |
   | `a && b` | a 为假值时返回 a，否则返回 b | `"订单" && 3` 为 3 |
   | `a ?? b` | a 为 null 或 undefined 时返回 b，否则返回 a | `0 ?? 10` 为 0 |

#### 11.2 默认值与空值的选择

1. 数量零是合法值时，默认值应考虑 `quantity ?? 1`；使用 `||` 会把零替换掉。`??` 是 ES2020 特性，不属于 ES2015。

2. 短路会影响副作用，例如前面失败时后面的请求不会发出。`??` 与 `||`、`&&` 混用需用括号明确组合，不能直接无括号混写。需要真正的布尔值时可使用 `Boolean(value)`。

参考：[MDN：逻辑或](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_OR)、[MDN：空值合并](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)。

### 12. isNaN() 与 Number.isNaN() 有何区别？

#### 12.1 两种 NaN 检测的差异

1. **全局 `isNaN()` 先做数值转换，`Number.isNaN()` 只检查传入值是否就是 NaN。** NaN 是 Number 类型中的特殊值，不等于“所有非数字内容”。

   以下独立片段可在控制台执行：

   ```javascript
   console.log(isNaN("订单")); // true
   console.log(Number.isNaN("订单")); // false
   console.log(isNaN("")); // false，先转换为 0
   console.log(Number.isNaN(Number("订单"))); // true
   console.log(typeof NaN); // "number"
   ```

#### 12.2 输入转换与错误判断

1. 判断已计算出的数字结果是否是 NaN，优先使用 `Number.isNaN`。判断输入能否成为有限数字，应先处理空值，再转换，并使用 `Number.isFinite` 等规则。

2. `NaN !== NaN`，所以不能用 `value === NaN` 检测。`isNaN(Symbol())` 会在转换阶段抛错，也不是对任意输入都返回布尔值。

参考：[MDN：Number.isNaN()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN)。

### 13. 为什么 0.1 + 0.2 不等于 0.3，金额应如何处理？

#### 13.1 浮点计算的实际结果

1. **Number 使用 IEEE 754 双精度二进制浮点表示，一些十进制小数不能精确保存。** 运算在近似值上进行，结果是 `0.30000000000000004`，不只是打印格式问题。

   | 目标 | 方案 | 限制 |
   |------|------|------|
   | 展示固定小数位 | `toFixed()` | 返回字符串，不消除计算误差 |
   | 科学或测量计算的近似比较 | 按业务尺度设置绝对、相对容差 | `Number.EPSILON` 不是任意量级的通用阈值 |
   | 金额等精确规则 | 最小货币单位的安全整数，或十进制计算库 | 需定义舍入方式、币种精度和整数范围 |

   控制台可验证最小单位计算：

   ```javascript
   console.log(0.1 + 0.2); // 0.30000000000000004
   console.log((0.1 + 0.2).toFixed(2)); // "0.30"
   const totalCents = 10 + 20;
   console.log(totalCents); // 30
   ```

#### 13.2 误差来源与金额处理

1. 示例中的整数是已经规范化的分值，不是任意十进制输入简单乘 100 就一定准确。金额来源、税费和折扣应按明确规则解析与舍入；超过安全整数范围还要更换表示方式。

参考：[MDN：Number 的精度](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)。

### 14. 为什么字符串能调用方法，包装对象有哪些陷阱？

#### 14.1 原始值调用方法的过程

1. **访问 String、Number、Boolean 等原始值的方法时，语言提供对应包装行为。** 这不把原始值永久变成对象；null 和 undefined 不能这样访问属性。

   独立片段可在控制台执行：

   ```javascript
   console.log("order".toUpperCase()); // ORDER
   console.log(typeof "order"); // string
   console.log(typeof new String("order")); // object
   console.log(Boolean(new Boolean(false))); // true
   console.log(new Number(1) === 1); // false
   ```

#### 14.2 包装对象的判断陷阱

1. `new Boolean(false)` 是对象，所以条件判断仍为真；包装对象与原始值严格比较也不同。日常业务优先使用原始值和显式转换，避免用 `new String` 等保存基础数据。

2. 给原始字符串临时加属性不会形成可持续保存的业务状态，严格模式下还会报错。引擎可以优化包装过程，不必假设每次访问都真的分配并立即销毁一个可观察对象。

参考：[MDN：原始值](https://developer.mozilla.org/en-US/docs/Glossary/Primitive)。

## 二、对象与函数

对象与函数题围绕属性从哪里来、多个变量共享什么、函数保留什么环境以及调用时的上下文展开。应把对象自身属性、原型关联、词法变量和 this 分开解释。

### 1. prototype 与对象的原型有什么区别？

#### 1.1 构造函数属性与对象原型

1. **对象的原型是属性查找所使用的内部关联；构造函数的 `prototype` 属性通常提供新实例的原型。** 函数本身的原型与它的 prototype 属性不是同一个概念。

   以下独立代码可在控制台验证：

   ```javascript
   /** 创建具有独立编号的订单实例；由 new 调用，初始化 id，无显式返回值。 */
   function Order(id) { this.id = id; }
   const order = new Order("A-42");
   console.log(Object.getPrototypeOf(order) === Order.prototype); // true
   console.log(Object.getPrototypeOf(Order) === Function.prototype); // true
   console.log(order.id); // A-42
   ```

#### 1.2 原型关系的验证边界

1. 把方法放在 `Order.prototype` 上，可以由多个实例通过查找共享，避免每个实例重复保存同一方法。不是所有函数都有用于构造的 prototype，例如箭头函数不能通过 new 创建实例。

2. 读取原型优先使用 `Object.getPrototypeOf`。不要修改 Object.prototype 来给全站对象增加业务字段，这会扩大影响并污染属性查找。

参考：[MDN：继承与原型链](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain)。

### 2. 原型链如何查找属性，链的终点是什么？

#### 2.1 沿原型链查找属性

1. **先找对象自身属性，没找到就沿原型逐级查找，直到原型为 null。** 对普通对象，链通常经过 Object.prototype；Object.prototype 本身不是 null。

   以下片段可直接在控制台执行：

   ```javascript
   const defaults = { currency: "CNY" };
   const order = Object.create(defaults);
   order.id = "A-42";
   console.log(order.currency); // CNY，来自原型
   console.log(Object.hasOwn(order, "currency")); // false
   console.log(Object.getPrototypeOf(Object.prototype)); // null
   console.log(Object.getPrototypeOf(Object.create(null))); // null
   ```

#### 2.2 链终点与遮蔽行为

1. `Object.create(null)` 创建没有原型的对象，说明不是每个对象都继承 Object.prototype。自身属性会遮蔽原型同名属性；删除自身属性后，继承值可重新被读取。

2. 读取不存在的属性得到 undefined，但这不说明链上一定没有该属性，因为属性自身也可以保存 undefined。区分自身是否存在使用 `Object.hasOwn`，检查链上存在性可使用 `in`。

参考：[MDN：Object.hasOwn()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn)。

### 3. 闭包为何能保留外层变量，何时才会造成内存问题？

#### 3.1 闭包保存的是什么

1. **闭包是函数与它所引用的词法环境的组合。** 词法环境由定义位置决定；函数仍可达时，其需要的外层变量可以继续被保留，不要求外层调用仍在执行。

   在空目录创建 `closure.mjs`，安装 Node.js 22 或更高版本后运行：

   ```powershell
   node closure.mjs
   ```

   文件内容如下，两个计数器各自保存独立状态：

   ::: details 查看 closure.mjs 的完整代码

   ```javascript
   // closure.mjs
   /** 创建独立订单计数器；返回每次调用后递增的计数函数。 */
   function createOrderCounter() {
     let count = 0;
     /** 记录一笔订单；返回当前累计数量。 */
     function recordOrder() {
       count += 1;
       return count;
     }
     return recordOrder;
   }
   const firstCounter = createOrderCounter();
   const secondCounter = createOrderCounter();
   console.log(firstCounter(), firstCounter(), secondCounter());
   ```

   :::

   预期输出如下，证明状态被保留且两个外层调用互不混用：

   ```text
   1 2 1
   ```

#### 3.2 引用保留与内存释放

1. 闭包捕获的是变量关联，不是一律拍摄旧值快照。多个回调共享同一个 var 循环变量时，会看到同一最终值；使用 let 循环绑定可避免该类问题。

   ::: warning 闭包不会必然造成内存泄漏
   长期存活的回调若持有已不用的大对象，才会造成不必要的保留。清理订阅、计时器和缓存引用，应以可达关系及实际内存证据判断。
   :::

参考：[MDN：闭包](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)。

### 4. this 如何确定，call、apply、bind 有何区别？

#### 4.1 this 的确定规则

1. **普通函数的 this 通常由调用方式决定，箭头函数则使用定义处外层的 this。** `call`、`apply` 立即调用，`bind` 创建新函数；bind 本身不是异步操作。

   | 调用方式 | this 的主要规则 |
   |----------|------------------|
   | `order.method()` | 通常为 order |
   | 严格模式独立调用 | 通常为 undefined |
   | `method.call(order, a, b)` | 指定 this，逐个传入参数 |
   | `method.apply(order, [a, b])` | 指定 this，用数组或类数组提供参数 |
   | `method.bind(order, a)` | 返回绑定 this 和部分参数的新函数 |
   | `new Constructor()` | 为构造中的新实例，不能简单套用普通调用 |

   在控制台执行以下片段：

   ```javascript
   /** 读取调用上下文的订单号；返回编号，不修改订单。 */
   function readOrderId() { return this.id; }
   const order = { id: "A-42" };
   const readBoundId = readOrderId.bind(order);
   console.log(readOrderId.call(order)); // A-42
   console.log(readOrderId.apply(order, [])); // A-42
   console.log(readBoundId()); // A-42
   ```

#### 4.2 显式绑定与箭头函数边界

1. 把对象方法单独传作回调会丢失原来的调用接收者，可按场景绑定或包装。call、apply、bind 不能改变箭头函数捕获的 this，绑定函数被 new 调用时也有独立构造规则。

参考：[MDN：this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)、[MDN：bind()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)。

### 5. Object.assign() 与对象展开都是深拷贝吗？

#### 5.1 浅复制的行为

1. **都只是复制源对象的可枚举自身属性，嵌套对象仍共享引用。** Object.assign 修改并返回目标对象；对象展开在对象字面量中创建属性。

   以下独立片段可在控制台执行：

   ```javascript
   const order = { id: "A-42", address: { city: "深圳" } };
   const copied = { ...order };
   copied.address.city = "杭州";
   console.log(order.address.city); // 杭州
   console.log(copied === order); // false
   console.log(copied.address === order.address); // true
   ```

#### 5.2 嵌套对象共享与覆盖顺序

1. 两者都可以复制可枚举的 Symbol 键，都可能读取源 getter。Object.assign 对目标做赋值，因此可触发目标 setter；对象展开定义自身数据属性，不会以相同方式触发目标 setter。

2. 后面的同名属性覆盖前面的值，不做递归合并。它们也不完整复制原型、不可枚举属性和属性描述符，不能当作任意实例的完整克隆。

参考：[MDN：Object.assign()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)。

### 6. 深拷贝可以直接使用 JSON.parse(JSON.stringify()) 吗？

#### 6.1 JSON 往返的可观察结果

1. **只适合符合 JSON 数据模型且允许其转换行为的数据。** 深拷贝方案需要先明确值类型、循环引用、原型和资源所有权。

   | 方案 | 能力 | 边界 |
   |------|------|------|
   | JSON 序列化再解析 | 普通 JSON 结构 | 丢失部分值，日期变文本，循环引用和 BigInt 会失败 |
   | `structuredClone()` | 支持多种内置类型和循环引用 | 函数、DOM 节点等不能这样克隆，也不保留任意类行为 |
   | 领域复制函数或合适库 | 可按业务规则处理特殊数据 | 需定义共享引用、原型等策略并验证 |

#### 6.2 数据丢失与替代方案

1. 在支持 structuredClone 的现代浏览器中执行：

   ```javascript
   const order = { address: { city: "深圳" } };
   const copied = structuredClone(order);
   copied.address.city = "杭州";
   console.log(order.address.city); // 深圳
   console.log(copied.address === order.address); // false
   ```

2. 这个结果证明普通嵌套数据独立，不能证明任何对象都可克隆。转移 ArrayBuffer 等资源还会改变原资源可用性，应区分复制与 transfer。

参考：[MDN：structuredClone()](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone)。

### 7. Map 与 Object 分别适合哪些键值数据？

#### 7.1 键的身份与集合行为

1. **Object 适合字段已知的记录，Map 适合动态键值集合，键可以是任意值。** 不应只用“Map 总比对象快”决定方案。

   | 维度 | Object | Map |
   |------|--------|-----|
   | 键 | 字符串、Symbol | 任意值，包括对象 |
   | 数量 | 通常通过键列表统计 | `size` |
   | 遍历 | 选择 Object.keys、entries 等 | 直接可迭代，按插入顺序 |
   | 原型 | 普通对象有继承属性 | 条目与对象原型属性分离 |
   | JSON | 普通记录可直接序列化 | 需要明确转换规则 |

#### 7.2 业务场景中的选择

1. `Map` 的对象键按对象身份匹配，两个字段相同的新对象不是同一个键。普通 Object 的键顺序也有规范规则，不能说它完全无序。

2. 订单 DTO（数据传输对象）可用普通记录；以 DOM 节点为键保存状态可考虑 Map 或 WeakMap。频繁增删性能应使用目标引擎和真实数据验证，规范不强制固定的内部数据结构。

参考：[MDN：Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)。

## 三、异步与内存

运行机制题需要明确当前代码何时执行、后续代码由谁调度，以及哪些引用让资源继续存活。异步、并发、线程和垃圾回收不是同一个概念。

### 1. JavaScript 是单线程，浏览器就没有其他线程吗？

1. **同一 JavaScript 执行代理中的代码通常按调用栈顺序运行，但浏览器不是只有一个线程。** 网络、渲染相关工作和 Worker 可以由不同线程或进程参与。

2. 主线程运行大量计算会阻塞输入响应和相关页面更新，即使函数标记为 async 也一样。浏览器可以将部分 CPU 密集计算放到 Web Worker，主线程与 Worker 通过消息通信。

   | 工作 | 主要约束 |
   |------|----------|
   | 主线程 DOM 更新 | 同一页面中顺序处理，长任务影响交互 |
   | 网络等待 | 环境异步处理，完成后安排后续回调 |
   | Web Worker 计算 | 独立执行环境，不能直接操作页面 DOM |

3. 单线程简化了常见 DOM 共享访问，但不代表整个应用不会发生竞态。两个异步搜索请求完成顺序倒置，仍需要取消、编号或状态校验。

参考：[MDN：执行模型](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model)、[MDN：Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)。

### 2. 异步是否表示代码一定在其他线程执行？

1. **不表示。异步意味着结果在当前调用之后通过约定的机制交付，不保证所有计算都并行。** 回调、Promise 和 async 函数中的普通 JavaScript 仍可能在主线程执行。

2. 例如 fetch 发出请求后，当前代码继续运行；响应到达后，消费结果的回调由相应调度机制执行。相反，耗时的同步循环不会因为被包在 Promise 中就自动转移线程。

   在控制台执行以下独立片段，executor 先同步执行：

   ```javascript
   console.log("开始");
   /** 初始化 Promise；立即调用 resolve，无返回值。 */
   function prepareOrder(resolve) { console.log("执行器"); resolve("订单"); }
   const result = new Promise(prepareOrder);
   /** 异步处理完成值；无返回值，只输出结果。 */
   function reportOrder(value) { console.log(value); }
   result.then(reportOrder);
   console.log("结束");
   ```

   输出顺序为“开始、执行器、结束、订单”。要减少主线程计算压力，应拆分工作或使用 Worker；仅改写成异步语法不会降低计算本身的成本。

参考：[MDN：Promise 构造函数](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise)。

### 3. 事件循环为何先处理微任务，界面何时获得渲染机会？

#### 3.1 任务与微任务的执行顺序

1. **调用栈执行当前代码，任务执行完成后的微任务检查点处理微任务，浏览器再按条件处理后续任务和渲染。** 不能简单描述成“一个队列永远先进先出”。

2. **调度依据：** 计时器回调和用户事件等属于任务；Promise 后续处理、`queueMicrotask` 属于微任务。当前任务结束后进入微任务检查点，持续清空队列，再由浏览器决定是否渲染和执行后续任务；跨任务来源没有可依赖的固定全局顺序。

   在空目录创建 `event-loop.mjs`，用 Node.js 22 或更高版本运行 `node event-loop.mjs`。这里仅使用与浏览器同样可验证的 Promise、显式微任务和计时器顺序，不涉及 Node 专有的 nextTick：

   ::: details 查看 event-loop.mjs 的完整代码

   ```javascript
   // event-loop.mjs
   /** 计时器就绪后报告执行；无返回值。 */
   function reportTimer() { console.log("计时器任务"); }
   /** Promise 完成后报告执行；无返回值。 */
   function reportPromise() { console.log("Promise 微任务"); }
   /** 显式微任务检查点中报告执行；无返回值。 */
   function reportMicrotask() { console.log("显式微任务"); }
   console.log("开始");
   setTimeout(reportTimer, 0);
   Promise.resolve().then(reportPromise);
   queueMicrotask(reportMicrotask);
   console.log("结束");
   ```

   :::

   预期输出如下，也可把文件代码放到现代浏览器控制台观察：

   ```text
   开始
   结束
   Promise 微任务
   显式微任务
   计时器任务
   ```

#### 3.2 输出推断与渲染边界

1. **推断输出：** 先看同步调用栈，再看这一轮的微任务，最后看有机会执行的后续任务。浏览器不保证每轮任务后都绘制；Node 与浏览器的完整调度模型也不同，不能把一个计时器示例推广到所有环境。

::: warning 微任务优先不代表更适合长计算
微任务检查点会处理执行中继续加入的微任务。递归安排微任务会推迟输入处理和绘制；需要分批计算时，应让出任务执行机会或移到 Worker。
:::

参考：[WHATWG：事件循环](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)。

### 4. 微任务是不是越多越好，为什么会阻塞页面？

1. **微任务检查点会持续处理队列，新加入的微任务也会被处理。** 因而不断追加微任务可以延迟后续任务和渲染，并不是性能优化的通用方案。

2. 如果 Promise 回调继续安排下一个 Promise 回调，直到大量数据全部处理完，浏览器可能迟迟没有机会处理输入。`await Promise.resolve()` 通常也只是把继续执行放到微任务中，不保证给浏览器一个绘制机会。

   | 目标 | 判断方向 |
   |------|----------|
   | 同步代码结束后完成少量收尾 | 微任务可以合适 |
   | 分批处理长计算 | 需要让出到后续任务或采用调度 API |
   | 大量纯计算 | 评估 Worker 和数据传输成本 |

3. 观察 Performance 面板中的长任务、帧和输入延迟，再决定分批大小。渲染并非每个任务后都会发生，所以不要用一次零延迟计时器作为“页面必然已绘制”的证明。

参考：[MDN：微任务指南](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)。

### 5. Promise 如何组织异步结果与错误，为什么不能直接取消操作？

#### 5.1 Promise 链的结果传播

1. **Promise 统一表达未来的成功值或失败原因，并支持链式组合与错误传播。** 它减少嵌套回调的组织困难，但不消除回调，也不自带通用取消能力。

2. **结果模型：** Promise 有 pending、fulfilled、rejected 三种状态；确定后不可逆。`then` 返回新 Promise，回调返回值和抛错决定后续结果。`resolve` 还可采用另一个 Promise 的最终结果，因此调用它不总是立即 fulfilled。

   | 链中行为 | 后续结果 |
   |----------|----------|
   | 回调返回普通值 | 下一个 then 接收该值 |
   | 回调返回 Promise | 等待它的结果 |
   | 回调抛出错误 | 后续进入拒绝处理路径 |
   | catch 返回普通值 | 从这个位置恢复为成功链 |

#### 5.2 取消请求与取消回调的区别

1. **取消边界：** Promise 只表示结果，不拥有网络请求等底层操作。取消请求需底层 API 支持，如 `AbortController`；`Promise.race` 仅提前确定组合结果，不会停止其他操作。资源清理与业务上的“取消成功”还需分别定义。

2. 具体链式代码及组合规则见 [ES6 的 Promise 题目](./04-ES6.md)，两者的规则不能与“某个带 then 的对象就是内置 Promise 实例”混同。

::: info 取消等待与取消工作是两件事
让调用方不再等待某个 Promise，不等于请求、计时器或服务端写入已停止。面试中应分别说明结果状态、底层取消机制和旧结果写回的防护。
:::

参考：[MDN：Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)。

### 6. setTimeout 的延迟为什么不精确，setInterval 会准点执行吗？

1. **延迟表示达到等待条件后可以安排回调，不保证在那个时刻开始执行。** 主线程长任务、微任务、页面后台节流和浏览器规则都会影响实际时间。

2. `setTimeout(callback, 0)` 不会立即打断当前 JavaScript。浏览器嵌套计时器的层级超过规范阈值时，较小延迟会被限制为至少 4ms；后台策略还随浏览器和状态变化，不能统一写成“都是一秒”。

3. 例如倒计时不应简单在每次 interval 回调中减一，而应按当前时间与目标时间重新计算剩余量。任务处理很慢时，可以在上一次处理完成后再安排下一次 timeout，避免业务重入。

   ::: tip 区分显示刷新与业务计时
   动画可考虑 requestAnimationFrame，并使用提供的时间戳；它通常在后台暂停，也不是服务器时间依据。页面销毁或任务结束时要清理不再需要的计时器。
   :::

参考：[WHATWG：计时器](https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers)、[MDN：setTimeout()](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout)。

### 7. 垃圾回收为什么仍会出现内存泄漏？

#### 7.1 可达性与垃圾回收

1. **垃圾回收主要根据可达关系回收对象，不会自动识别“业务上已经没用”。** 对象如果仍被全局变量、缓存、订阅或闭包引用，就可能继续占用内存。

2. 现代引擎采用基于可达性的回收并配合分代、增量等优化，具体整理和回收策略不应写成所有实现必走的固定三步。两个互相引用但整体不可达的对象仍可以回收。

   | 保留来源 | 场景 | 处理 |
   |----------|------|------|
   | 全局事件监听 | 页面组件卸载后仍引用旧数据 | 移除监听或中止对应 signal |
   | 计时器、订阅 | 回调持续存活 | 在结束或卸载时清理 |
   | 无界缓存 | 每次搜索都保存结果 | 定义数量、时效和淘汰策略 |
   | 脱离文档的 DOM | 节点删除但 JS 仍引用 | 清理不再需要的引用与相关资源 |

#### 7.2 泄漏场景与定位方法

1. 定位时重复执行同一创建与销毁操作，比较堆快照及保留路径。一次内存峰值不等于泄漏；回收时机也不应由业务代码假定。弱引用可帮助某些关联场景，但不替代资源生命周期管理。

参考：[MDN：内存管理](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management)。

## 四、浏览器与文本处理

浏览器 API 题应区分语言能力、宿主 API 和第三方库，并按输入、执行结果、失败和清理来判断。文本格式正确也不能代替业务数据校验。

### 1. 正则校验为什么会误判，g 标志有什么陷阱？

#### 1.1 正则状态与重复校验

1. **正则适合匹配已明确的文本模式，不能单靠格式匹配证明数据真实有效。** 验证整段输入通常要使用边界，并考虑长度、字符集和业务规则。

   下面验证六位数字验证码，可直接在控制台执行：

   ```javascript
   const codePattern = /^[0-9]{6}$/;
   console.log(codePattern.test("001234")); // true
   console.log(codePattern.test("001234x")); // false
   const repeatedPattern = /order/g;
   console.log(repeatedPattern.test("order")); // true
   console.log(repeatedPattern.test("order")); // false
   ```

#### 1.2 输入边界与回溯成本

1. 带 `g` 或 `y` 的重复测试会受 `lastIndex` 影响，校验时通常不需要这两个标志。日期格式符合 YYYY-MM-DD，不代表月份和日期组合真的存在。

2. URL、邮箱、手机号的完整规则远比简单模板复杂，应按目标用途用 URL 解析器、原生约束或领域校验。无上限输入与高回溯模式还会带来性能风险，不能把一个示例正则称为万能验证器。

参考：[MDN：正则表达式](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions)。

### 2. DOM 与 BOM 分别负责什么，BOM 没有标准吗？

1. **DOM 表达文档节点与操作，BOM 是浏览器窗口及相关环境 API 的习惯性统称。** BOM 并非一套独立统一标准，但其中的 History、Location 等能力各自有标准。

   | 范围 | 代表操作 |
   |------|----------|
   | DOM | 查询元素、修改 textContent、创建节点、监听节点事件 |
   | 浏览器环境 | location 导航、history 记录、navigator 能力等 |

2. 例如更新订单标题属于 DOM 操作，改变站内路由地址涉及 History API。Node 的 JavaScript 语言规则相同，但通常不直接提供浏览器 document，因此“JavaScript 语法可运行”不代表页面 API 可运行。

3. 不可信文字写入页面时优先使用 textContent；innerHTML 解析标记，不能直接插入用户输入。浏览器能力也可能受到安全上下文和权限限制，应按具体 API 判断。

参考：[MDN：DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model)、[MDN：History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API)。

### 3. Ajax、XMLHttpRequest、fetch 与 Axios 分别处于哪一层？

#### 3.1 请求 API 的职责层次

1. **Ajax 是局部异步更新页面的方法，XMLHttpRequest 和 fetch 是请求 API，Axios 是 HTTP 客户端库。** 它们不是三个同层级的内置对象。

   | 方案 | 返回与特点 | 错误和边界 |
   |------|------------|------------|
   | XMLHttpRequest | 事件式 API，支持上传进度等 | 可以包装成 Promise，不能说 Ajax 不支持 Promise |
   | fetch | 返回 Promise，可处理流式响应 | 404、500 通常不使 Promise 自动拒绝，需查 status/ok |
   | Axios | 提供拦截器、配置和转换等 | 默认按配置拒绝非成功状态，行为还受 validateStatus 与适配器影响 |

#### 3.2 异常、状态码与取消行为

1. **错误边界：** 网络失败、HTTP 状态失败、JSON 解析失败和业务失败是不同层次。`fetch` 通常仅在网络失败等情况下拒绝；拿到 404/500 响应后应检查 `response.ok`。响应体读取也是异步操作，跨源请求仍受 CORS（跨源资源共享）限制。

2. 在有 `/api/orders/42` 接口的浏览器页面中，可以使用以下局部 `app.js` 片段；这里只展示读取边界，接口实现省略：

   ```javascript
   // app.js
   /** 读取固定订单接口；返回订单数据，HTTP 或解析失败时拒绝。 */
   async function loadOrder() {
     const response = await fetch("/api/orders/42");
     if (!response.ok) {
       throw new Error(`HTTP ${response.status}`);
     }
     return response.json();
   }
   // 调用方还需捕获失败，并决定加载、错误与重试界面的状态。
   ```

3. 请求超时、取消或重试并不证明写操作没有到达服务器，提交订单等操作还需服务端幂等策略。选择客户端要看请求封装需求，而不是仅比较语法长短。

::: warning HTTP 失败不等于网络请求失败
`fetch` 收到 HTTP 404 或 500 时通常仍会兑现为 Response；只写 `.catch()` 会漏掉这类状态。应检查状态码，并单独处理响应解析与业务错误。
:::

参考：[MDN：使用 Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)、[Axios：错误处理](https://axios-http.com/docs/handling_errors)。

### 4. mouseover 与 mouseenter 有何区别，事件委托该选哪个？

1. **mouseover 会冒泡，mouseenter 不冒泡，并且后者按是否跨入元素及其后代所组成的边界判断。** 从父元素移入子元素时，父级 mouseover 监听可能再次收到子级事件，父级 mouseenter 不因此重复。

   | 需求 | 选择与处理 |
   |------|------------|
   | 单个区域进入时触发一次 | 使用 mouseenter，离开使用 mouseleave |
   | 父级统一代理多个子项 | 使用可冒泡事件，如 mouseover，并筛选目标 |
   | 区分真正跨越区域边界 | 查看 relatedTarget，判断它是否仍在区域内 |

2. 事件委托还需区分 target（实际目标）与 currentTarget（当前监听者）。进入子元素时子元素本身也可以收到自己的 mouseenter，不能说 mouseenter 永远只触发父元素。

3. 悬停不能承担唯一的操作反馈，触屏和键盘不使用同样的输入路径。统一处理多种指针可评估 pointerover、pointerenter，但它们的冒泡差异同样需要判断。

参考：[MDN：mouseenter](https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseenter_event)、[MDN：mouseover](https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseover_event)。

## 五、作用域与对象行为

### 1. 词法作用域如何决定变量查找，闭包与作用域链是什么关系？

**函数能访问哪些外部变量，在函数定义位置确定，而不是在调用位置确定。** 执行时先查当前作用域，找不到再沿外层词法环境查找；闭包让函数在离开外层调用后仍可访问所需的外层绑定。

1. 把回调传给另一模块调用，不会让它自动读取调用方的局部变量；它仍沿定义时的环境查找。
2. `let`、`const` 有块级作用域，声明前处于暂时性死区；`var` 的函数作用域与提升行为不同。
3. 闭包保留的是**绑定**而非创建时的值快照。循环中共享一个 `var` 绑定会看到循环结束后的值；每次迭代的 `let` 则建立各自绑定。

面试追问“闭包是否必然内存泄漏”时，说明只要函数仍可达、且引用着外层对象，该对象才可能持续保留；函数不再可达后即可被回收。应从引用链分析，而非把闭包本身判为泄漏。

参考：[MDN：闭包](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)、[MDN：作用域](https://developer.mozilla.org/en-US/docs/Glossary/Scope)。

### 2. `new` 调用普通函数时，原型与返回值如何决定最终对象？

**`new` 创建新对象并连接到构造函数的 `prototype`，再以该对象为 `this` 执行构造函数。** 构造函数显式返回对象或函数时使用返回值；返回原始值时仍使用新对象。

1. 因而 `new Order()` 通常满足 `instanceof Order`，但如果 `Order` 显式返回另一对象，这个判断不一定成立。
2. `class` 构造器要求通过 `new` 调用，不能像普通函数那样直接调用；箭头函数没有用于构造的 `prototype`，不能作构造函数。
3. 原型上的方法被实例共享，构造函数里创建的数组等可变字段通常属于各实例。误把可变字段放在共享原型上，会导致实例之间互相影响。

面试手写实现参见[手写 new 的核心规则](./11-Handwriting.md#十一、手写-new-时-返回对象与构造函数返回值如何取舍)。

参考：[MDN：new](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new)。

### 3. 自有属性、可枚举属性和属性描述符有什么关系？

**“对象上有这个属性”与“某种遍历能看到它”不是同一件事。** 属性描述符可以控制 `value`、`writable`、`enumerable`、`configurable`，或用 getter/setter 定义访问行为。

| 检查方式 | 主要范围 |
|----------|----------|
| `Object.hasOwn(obj, key)` | 对象自身是否有该键，不要求可枚举 |
| `Object.keys(obj)` | 自身可枚举的字符串键 |
| `for...in` | 自身及原型链上可枚举的字符串键 |
| `Reflect.ownKeys(obj)` | 自身字符串键与 Symbol 键，包括不可枚举项 |

例如通过 `Object.defineProperty` 定义的属性若未指定 `enumerable: true`，默认不会出现在 `Object.keys` 中。序列化和浅拷贝也各有自己的键筛选规则；诊断“对象里有字段但展开后消失”时，先查描述符与属性所在位置。

参考：[MDN：属性描述符](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)、[MDN：属性可枚举性](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Enumerability_and_ownership_of_properties)。

### 4. `Object.create(null)` 为什么适合纯字典，也会失去什么？

**它创建没有 `Object.prototype` 的对象，因此不会从该原型继承 `toString` 等属性。** 对外部字符串键做字典映射时，可避免把继承属性误当作数据。

1. 普通对象仍可用 `Object.hasOwn()` 做安全判断，现代代码常根据是否需要对象语义或任意键选择普通对象、无原型对象或 `Map`。
2. 无原型对象没有继承的 `toString`、`hasOwnProperty`，直接调用这些方法会失败；调试与依赖普通对象原型方法的库也可能需要适配。
3. `Map` 能使用对象等任意值作为键，并提供明确的 `size` 与迭代顺序；纯字典不是所有键值场景的默认答案。

::: warning 无原型对象不替代输入校验
它减少原型链带来的混淆，但接口字段仍要做业务校验，使用普通对象的其他位置仍可能受到不安全合并的影响。
:::

参考：[MDN：Object.create](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create)、[MDN：Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)。

## 六、事件与请求

### 1. 捕获、冒泡、事件委托和阻止默认行为分别作用在哪一步？

**事件沿传播路径经过捕获和冒泡阶段；事件委托利用传播在祖先处统一处理子项事件。** `preventDefault()` 阻止可取消事件的默认动作，`stopPropagation()` 阻止继续传播，两者作用不同。

1. 在订单列表容器监听点击，依据 `event.target.closest()` 找到对应操作按钮，再确认它属于当前容器。`currentTarget` 是绑定监听器的容器，`target` 是实际起点。
2. 如果按钮在表单内，阻止冒泡不会自动阻止提交；若它只是执行页面命令，应声明 `type="button"`。反过来，阻止默认行为也不会自动停止其他监听器执行。
3. 委托适合动态增删的同类元素，但焦点、鼠标进入等事件的传播规则不同，应先确认所选事件是否能满足代理需求。

::: tip 先回答传播，再回答业务动作
面试常把“阻止冒泡”和“阻止跳转”混用。先指出触发路径，随后判断是否存在可取消的默认行为，最后决定是否需要阻止。
:::

参考：[MDN：事件冒泡](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling)、[MDN：preventDefault](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)。

### 2. `AbortController` 取消 `fetch` 后，服务端操作是否也会撤销？

**取消会使客户端停止等待或读取相应操作，但不能保证已发送的请求在服务端没有执行。** 这一区别决定了搜索与支付请求必须采用不同策略。

1. 搜索建议中，新输入出现时中止旧请求，并在接收结果时核对查询词；这能减少无用客户端工作和旧结果覆盖。
2. 创建订单时，超时或取消后应查询最终状态，或用服务端幂等键按协议重试，不能把 `AbortError` 当成“订单一定未创建”。
3. 一个 `AbortSignal` 可传给支持取消的 API；使用同一信号时要注意一次 `abort()` 会影响所有监听该信号的工作。

面试结论要落在**取消的是本地异步操作的等待与资源消耗，业务副作用由服务端协议决定**。

参考：[MDN：AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)、[MDN：fetch](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch)。

