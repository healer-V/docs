---
title: "原始类型与 typeof"
tags:
  - JavaScript
  - 原始类型
  - typeof
  - 包装对象
excerpt: "说明七种原始类型与对象的分界，逐项列出 typeof 的八种返回值，解释 null、数组和包装对象为什么都返回 object，并给出数组、空值与日期等类型判断的组合方式。"
date: 2026-11-15
---

# 原始类型与 typeof

JavaScript 的值分成两类：原始值和对象。原始值包括 `undefined`、`null`、布尔、数字、`BigInt`、字符串和 `Symbol`；对象包括普通对象、数组、日期、函数等。原始值不可变，对象通过引用传递。

`typeof` 是最常用的类型判断运算符，但它只返回八种字符串，其中 `null` 和数组都返回 `"object"`。把 `typeof` 当成万能判断，会在空值和集合类型上出错。理解它为什么这样返回，才能选择正确的组合判断。

本篇先列出原始类型和对象的分界，再逐项观察 `typeof` 的返回值，随后解释包装对象与属性访问，最后给出判断数组、空值和日期的可靠写法。

::: info 本篇的范围
本篇讲值的分类和类型判断，不展开类型转换、对象原型和属性描述符。转换与相等性见“类型转换与相等性”，原型链见“原型链与继承”。
:::

## 一、值分成原始类型与对象

### 1. 七种原始类型

原始类型是不可再拆分的值。`undefined` 表示未赋值，`null` 表示有意为空，布尔只有 `true` 和 `false`，数字统一是双精度浮点数，`BigInt` 表示任意精度整数，字符串是 UTF-16 码元序列，`Symbol` 用于唯一标识。

```js
console.log(typeof undefined); // "undefined"
console.log(typeof null); // "object"
console.log(typeof true); // "boolean"
console.log(typeof 1); // "number"
console.log(typeof 1n); // "bigint"
console.log(typeof "a"); // "string"
console.log(typeof Symbol("id")); // "symbol"
```

`null` 的 `typeof` 结果是历史遗留，不代表它属于对象。判断空值应直接写 `value === null`。

### 2. 对象、数组与函数

除原始值外都是对象。数组是对象的一种，日期和正则也是对象；函数在 `typeof` 中单独返回 `"function"`，但它仍然可以作为对象拥有属性。

```js
console.log(typeof []); // "object"
console.log(typeof new Date()); // "object"
console.log(typeof function () {}); // "function"
```

### 3. 原始值不可变

字符串和数字没有可修改的内部状态。对字符串调用方法会返回新字符串，原值不变；对象则可以修改属性，多个变量可以指向同一个对象。

```js
let name = "Ada";
name.toUpperCase();
console.log(name); // "Ada"
name = name.toUpperCase();
console.log(name); // "ADA"
```

## 二、typeof 的八种返回值

### 1. 八种字符串

`typeof` 只可能返回 `"undefined"`、`"object"`、`"boolean"`、`"number"`、`"bigint"`、`"string"`、`"symbol"` 和 `"function"`。前七种对应原始类型和 `null` 的历史行为，最后一种是函数。

| 值 | `typeof` 结果 | 说明 |
|----|---------------|------|
| `undefined` | `"undefined"` | 未赋值的变量或缺失的属性 |
| `null` | `"object"` | 历史遗留，不能据此判断为空值 |
| `true` | `"boolean"` | 布尔 |
| `0`、`NaN` | `"number"` | `NaN` 也是数字类型 |
| `1n` | `"bigint"` | 任意精度整数 |
| `""` | `"string"` | 空字符串仍是字符串 |
| `Symbol("id")` | `"symbol"` | 唯一标识 |
| 函数 | `"function"` | 可调用对象 |
| 数组、日期、普通对象 | `"object"` | 需要进一步判断 |

### 2. null 返回 object 的历史原因

早期实现把值的类型标记放在低位，`null` 的标记恰好与对象相同，这个行为被标准保留下来。修复会破坏已有代码，因此 `typeof null` 至今仍是 `"object"`。

```js
const value = null;
console.log(typeof value); // "object"
console.log(value === null); // true
```

### 3. 对未声明标识符使用 typeof

`typeof` 对未声明的名字返回 `"undefined"`，不会抛出 `ReferenceError`。这适合检查某个全局接口是否存在，但对暂时性死区中的 `let` 变量仍会抛错。

```js
console.log(typeof notDeclared); // "undefined"
```

## 三、包装对象与属性访问

### 1. 属性访问时临时包装

字符串、数字和布尔是原始值，却能访问方法。读取 `"abc".length` 时，引擎临时创建一个包装对象，读取属性后丢弃，原始值本身不变。

```js
console.log("abc".length); // 3
console.log("abc".toUpperCase()); // "ABC"
```

### 2. 显式创建包装对象

`new String()`、`new Number()`、`new Boolean()` 创建的是对象，不是原始值。它们的 `typeof` 是 `"object"`，可以添加属性，但一般不用于业务代码。

```js
const wrapper = new String("abc");
console.log(typeof wrapper); // "object"
console.log(wrapper.valueOf()); // "abc"
console.log(wrapper.length); // 3
```

### 3. 包装对象的真值

包装对象是对象，布尔转换时一律为 `true`，即使内部值是 `false`、`0` 或空字符串。这与原始值的真值规则不同。

```js
console.log(Boolean(new Boolean(false))); // true
console.log(Boolean(new String(""))); // true
```

需要原始值时调用 `valueOf()` 或 `String()`、`Number()` 转换。比较包装对象与原始值还会触发转换，容易产生额外规则，因此不推荐在业务代码中显式创建包装对象。

## 四、类型判断的组合方式

### 1. typeof 的适用范围

`typeof` 适合判断原始类型和函数：`typeof value === "string"`、`typeof callback === "function"`。它不适合区分 `null`、数组、日期和普通对象，因为四者都可能返回 `"object"`。

```js
/** 判断值是否为原始类型；对象和函数返回 false。 */
function isPrimitive(value) {
  return value === null || (typeof value !== "object" && typeof value !== "function");
}
```

### 2. 空值与数组

判断空值直接写 `value === null`；判断数组使用 `Array.isArray(value)`，它不受原型链修改影响，也能识别来自其他框架环境的数组。

```js
console.log(Array.isArray([])); // true
console.log(Array.isArray({ length: 0 })); // false
console.log(value === null); // 只对 null 为 true
```

### 3. Object.prototype.toString 的边界

`Object.prototype.toString.call(value)` 返回 `"[object Array]"`、`"[object Date]"` 等字符串，可用于区分内建对象。它不是所有自定义类型的可靠标签，也可能被对象自己的 `Symbol.toStringTag` 改变，因此只作为补充手段。

```js
console.log(Object.prototype.toString.call([])); // "[object Array]"
console.log(Object.prototype.toString.call(new Date())); // "[object Date]"
```

::: tip 按问题选择判断方式
只需要区分字符串、数字、函数时用 `typeof`；判断空值用 `=== null`；判断数组用 `Array.isArray`。不要用一个 `typeof` 表达式同时承担四类判断。
:::

## 五、从空目录观察类型

### 1. 创建页面

新建空目录 `js-typeof`，创建 `index.html`。脚本把每个值的 `typeof` 结果和补充判断写入表格，并在控制台输出包装对象与未声明标识符的检查结果。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>typeof 观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>typeof 观察</h1>
  <table id="output">
    <thead><tr><th>值</th><th>typeof</th><th>补充判断</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const samples = [
      ["undefined", undefined],
      ["null", null],
      ["true", true],
      ["0", 0],
      ["NaN", NaN],
      ["1n", 1n],
      ['""', ""],
      ['Symbol("id")', Symbol("id")],
      ["function () {}", function () {}],
      ["[]", []],
      ["{}", {}],
      ["new Date()", new Date()],
      ['new String("abc")', new String("abc")],
    ];

    const body = document.querySelector("#output tbody");
    for (const [label, value] of samples) {
      const row = document.createElement("tr");
      const cells = [
        label,
        typeof value,
        Array.isArray(value) ? "Array.isArray → true" : value === null ? "value === null → true" : "—",
      ];
      for (const text of cells) {
        const cell = document.createElement("td");
        cell.textContent = text;
        row.append(cell);
      }
      body.append(row);
    }

    const wrapper = new String("abc");
    console.log("包装对象 typeof", typeof wrapper);
    console.log("包装对象 valueOf", wrapper.valueOf());
    console.log("原始值长度", "abc".length);
    console.log("未声明标识符 typeof", typeof notDeclared);
    console.log("Object.prototype.toString", Object.prototype.toString.call([]), Object.prototype.toString.call(new Date()));
  </script>
</body>
</html>
```

:::

### 2. 读取结果

直接打开页面，表格应有十三行。`null`、数组、日期和包装对象的 `typeof` 都是 `"object"`，只有补充判断列能区分它们。控制台应显示包装对象类型为 `object`、`valueOf()` 为 `abc`、字符串长度为 `3`、未声明标识符为 `undefined`，以及 `[object Array]` 和 `[object Date]`。

| 值 | `typeof` | 补充判断 |
|----|----------|----------|
| `undefined` | `"undefined"` | — |
| `null` | `"object"` | `value === null → true` |
| `true` | `"boolean"` | — |
| `0`、`NaN` | `"number"` | — |
| `1n` | `"bigint"` | — |
| `""` | `"string"` | — |
| `Symbol("id")` | `"symbol"` | — |
| 函数 | `"function"` | — |
| `[]` | `"object"` | `Array.isArray → true` |
| `{}`、`new Date()` | `"object"` | — |
| `new String("abc")` | `"object"` | — |

### 3. 失败分支

创建 `new-symbol.html`，写入 `const id = new Symbol("id");`，Console 显示 `TypeError: Symbol is not a constructor`。`Symbol` 只能作为函数调用，`Symbol("id")` 才返回新值。

创建 `mix-bigint.html`，写入 `const total = 1n + 1;`，Console 显示 `TypeError: Cannot mix BigInt and other types, use explicit conversions`。`BigInt` 与普通数字不能直接做算术运算，需要显式用 `BigInt(1)` 统一类型，或把 `BigInt` 转成数字后再算。

## 六、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格十三行与观察表一致，控制台五条输出与正文一致；`new-symbol.html` 与 `mix-bigint.html` 分别得到上述 `TypeError`，页面后续脚本未执行。三个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有展开 `Symbol` 的元编程用途、`BigInt` 的全部运算规则和跨框架数组判断；这些内容在对应主题中单独核对。
