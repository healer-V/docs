---
title: "数字与精度"
tags:
  - JavaScript
  - 数字
  - 浮点数
  - BigInt
excerpt: "解释 JavaScript 数字的双精度表示、0.1 + 0.2 的误差来源、安全整数边界与 BigInt 的使用条件，说明 Number、parseInt、parseFloat 的解析差异，并给出可复现的精度观察页。"
date: 2026-11-15
---

# 数字与精度

JavaScript 只有一种数字类型 `number`，它按 IEEE 754 双精度浮点格式存储。整数和小数共用这一种表示，因此 `1` 和 `1.5` 的 `typeof` 都是 `"number"`。这带来的直接后果是：部分十进制小数无法精确表示，超出安全范围的整数会丢失精度。

`NaN`、`Infinity` 和 `-0` 也是 `number`，但它们有特殊的比较和判断规则。`BigInt` 提供了任意精度整数，却不能和普通数字直接做算术运算。

本篇先说明数字的表示与特殊值，再解释浮点误差、安全整数和正确的比较方式，随后介绍 `BigInt` 与字符串解析，最后用页面逐项核对结果。

::: info 本篇的范围
本篇讲数字的表示、精度和解析，不展开 `Math` 的全部方法、日期计算和金额格式化。`Date` 与 `Math` 的常用方法见“内置对象：JSON、Date 与 Math”，类型转换通则见“类型转换与相等性”。
:::

## 一、数字只有一种类型

### 1. 双精度浮点表示

`number` 使用 64 位双精度格式：符号位、指数位和尾数位共同表示一个值。它能表示很大的范围，但尾数只有 52 位，不能精确表示所有十进制小数。超出范围时得到 `Infinity`。

```js
console.log(1); // 1
console.log(1.5); // 1.5
console.log(typeof 1); // "number"
console.log(1 / 0); // Infinity
```

### 2. 整数与小数共用类型

没有单独的整数类型。`Number.isInteger()` 判断一个数字是否没有小数部分，但 `1.0` 和 `1` 是同一个值，打印和比较都无法区分写法。

```js
console.log(Number.isInteger(1)); // true
console.log(Number.isInteger(1.5)); // false
```

### 3. 特殊值 NaN、Infinity 与 -0

`NaN` 表示“不是有效数字”，例如 `0 / 0` 或失败的数值转换。它不等于任何值，包括自己；判断要用 `Number.isNaN()`。`Infinity` 表示超出可表示范围；`Number.isFinite()` 可以排除它。`-0` 在大多数运算中与 `0` 相同，只有 `Object.is()` 能区分。

```js
console.log(NaN === NaN); // false
console.log(Number.isNaN(NaN)); // true
console.log(Number.isFinite(Infinity)); // false
console.log(Object.is(0, -0)); // false
```

## 二、精度边界

### 1. 0.1 + 0.2 的误差

`0.1` 和 `0.2` 在二进制中都是无限循环小数，只能近似存储。两个近似值相加后，结果是最接近 `0.3` 的另一个近似值，打印为 `0.30000000000000004`，严格比较不等于 `0.3`。

```js
console.log(0.1 + 0.2); // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3); // false
```

这不是 JavaScript 独有的问题，任何使用二进制浮点的语言都会遇到。金额计算应改用整数分或 `BigInt`，不要直接用浮点比较。

### 2. 安全整数边界

`Number.MAX_SAFE_INTEGER` 是 `9007199254740991`，即 `2 ** 53 - 1`。在这个范围内，整数可以唯一表示，相邻整数不会合并。超过后，`+1` 和 `+2` 可能得到同一个值。

```js
console.log(Number.MAX_SAFE_INTEGER + 1); // 9007199254740992
console.log(Number.MAX_SAFE_INTEGER + 2); // 9007199254740992
console.log(Number.isSafeInteger(2 ** 53)); // false
```

需要更大的整数时用 `BigInt`。`Number.isSafeInteger()` 同时检查类型是数字、是整数且落在安全范围内。

### 3. 浮点比较的正确方式

不要用 `===` 直接比较两个浮点结果。一种做法是判断差值是否小于允许误差，另一种是把值转换成整数单位后再比较。`Number.EPSILON` 是 `1` 与下一个可表示数之间的差，适用于接近 `1` 的量级；对很大的值直接用固定 EPSILON 并不充分。

```js
const close = Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON;
console.log(close); // true
```

::: warning 金额不要用浮点累加
`0.1 + 0.2` 的误差会随着累加放大。金额应统一用“分”为单位的整数，或用 `BigInt` 表示最小货币单位，展示时再除以 100。
:::

## 三、BigInt

### 1. 字面量与转换

`BigInt` 用 `n` 后缀或 `BigInt()` 创建，表示任意精度整数。`typeof 1n` 是 `"bigint"`，与 `"number"` 不同。`BigInt("9007199254740993")` 能完整保留超出安全范围的整数。

```js
const big = 9007199254740993n;
console.log(typeof big); // "bigint"
console.log(BigInt("9007199254740993")); // 9007199254740993n
```

### 2. 不能与普通数字混算

`BigInt` 与 `number` 不能直接做算术运算，必须显式统一类型。比较运算可以在两者之间进行，但算术和 `Math` 方法不接受 `BigInt`。

```js
console.log(1n + 1); // TypeError: Cannot mix BigInt and other types
console.log(Math.round(1n)); // TypeError: Cannot convert a BigInt value to a number
```

### 3. 转换可能丢失精度

把 `BigInt` 转成 `number` 会按双精度舍入。`Number(9007199254740993n)` 得到 `9007199254740992`，最后一位丢失。只有在确认值落在安全范围内时，才应做这种转换。

```js
console.log(Number(9007199254740993n)); // 9007199254740992
```

## 四、字符串转数字

### 1. Number() 要求整串有效

`Number()` 去掉首尾空白后，整个字符串必须能表示一个数字。`"0b101"` 按二进制解析为 `5`，`"0x10"` 按十六进制解析为 `16`，`"12px"` 因为带了单位而得到 `NaN`。空字符串得到 `0`，这是容易忽略的边界。

```js
console.log(Number("0b101")); // 5
console.log(Number("12px")); // NaN
console.log(Number.isNaN(Number("12px"))); // true
```

### 2. parseInt 与 parseFloat 从左到右读取

`parseInt()` 读取到第一个不能组成整数的字符为止，因此能把 `"12px"` 读成 `12`；`parseFloat()` 类似，但接受小数点和指数。它们适合从带单位的文本中取数值，不适合校验输入是否完整合法。

```js
console.log(parseInt("12px", 10)); // 12
console.log(parseFloat("3.14abc")); // 3.14
console.log(parseInt("0x10", 16)); // 16
```

`parseInt()` 应显式传入进制，避免不同前缀和旧环境带来的歧义。需要确认整串都是数字时，先用 `Number()` 并检查 `Number.isNaN()`。

### 3. isNaN 与 Number.isNaN 的区别

全局 `isNaN()` 会先把参数转成数字，因此 `isNaN("abc")` 为 `true`；`Number.isNaN()` 只对真正的 `NaN` 返回 `true`。判断转换结果时用后者，避免把非数字字符串也当成 `NaN`。

```js
console.log(isNaN("abc")); // true
console.log(Number.isNaN("abc")); // false
```

## 五、从空目录观察数字结果

### 1. 创建页面

新建空目录 `js-numbers`，创建 `index.html`。脚本把精度、特殊值、`BigInt` 和解析结果写入表格，并在控制台输出 `isNaN` 与 `Number.isNaN` 的差异。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>数字与精度观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>数字与精度观察</h1>
  <table id="output">
    <thead><tr><th>表达式</th><th>结果</th><th>补充判断</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const samples = [
      ["0.1 + 0.2", 0.1 + 0.2, String(0.1 + 0.2 === 0.3)],
      ["Number.MAX_SAFE_INTEGER", Number.MAX_SAFE_INTEGER, String(Number.isSafeInteger(Number.MAX_SAFE_INTEGER))],
      ["Number.MAX_SAFE_INTEGER + 1", Number.MAX_SAFE_INTEGER + 1, String(Number.isSafeInteger(Number.MAX_SAFE_INTEGER + 1))],
      ["Number.MAX_SAFE_INTEGER + 2", Number.MAX_SAFE_INTEGER + 2, String(Number.isSafeInteger(Number.MAX_SAFE_INTEGER + 2))],
      ["1 / 0", 1 / 0, String(Number.isFinite(1 / 0))],
      ["0 / 0", 0 / 0, String(Number.isNaN(0 / 0))],
      ["2 ** 53", 2 ** 53, String(Number.isSafeInteger(2 ** 53))],
      ["Number(\"12px\")", Number("12px"), String(Number.isNaN(Number("12px")))],
      ["Number(\"0b101\")", Number("0b101"), "—"],
      ["parseInt(\"12px\", 10)", parseInt("12px", 10), "—"],
      ["parseFloat(\"3.14abc\")", parseFloat("3.14abc"), "—"],
      ["parseInt(\"0x10\", 16)", parseInt("0x10", 16), "—"],
      ["BigInt(\"9007199254740993\")", BigInt("9007199254740993"), "—"],
      ["Number(9007199254740993n)", Number(9007199254740993n), "—"],
      ["0.1 + 0.2 是否等于 0.3", 0.1 + 0.2 === 0.3, "—"],
      ["Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON", Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON, "—"],
    ];

    const body = document.querySelector("#output tbody");
    for (const [label, value, extra] of samples) {
      const row = document.createElement("tr");
      for (const text of [label, String(value), extra]) {
        const cell = document.createElement("td");
        cell.textContent = text;
        row.append(cell);
      }
      body.append(row);
    }

    console.log("isNaN(\"abc\")", isNaN("abc"));
    console.log("Number.isNaN(\"abc\")", Number.isNaN("abc"));
    console.log("Number.EPSILON", Number.EPSILON);
    console.log("BigInt typeof", typeof 1n);
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有十六行。重点核对三组：`0.1 + 0.2` 不等于 `0.3`；安全整数加一和加二得到同一个值；`Number("12px")` 为 `NaN`，而 `parseInt("12px", 10)` 为 `12`。控制台应显示 `isNaN("abc")` 为 `true`、`Number.isNaN("abc")` 为 `false`、`Number.EPSILON` 为 `2.220446049250313e-16`、`typeof 1n` 为 `bigint`。

| 表达式 | 结果 | 判断 |
|--------|------|------|
| `0.1 + 0.2` | `0.30000000000000004` | `=== 0.3` 为 `false` |
| `Number.MAX_SAFE_INTEGER` | `9007199254740991` | 安全整数为 `true` |
| `Number.MAX_SAFE_INTEGER + 1` | `9007199254740992` | 安全整数为 `false` |
| `Number.MAX_SAFE_INTEGER + 2` | `9007199254740992` | 与前一行相同 |
| `1 / 0` | `Infinity` | `Number.isFinite` 为 `false` |
| `0 / 0` | `NaN` | `Number.isNaN` 为 `true` |
| `2 ** 53` | `9007199254740992` | 安全整数为 `false` |
| `Number("12px")` | `NaN` | `Number.isNaN` 为 `true` |
| `Number("0b101")` | `5` | — |
| `parseInt("12px", 10)` | `12` | — |
| `parseFloat("3.14abc")` | `3.14` | — |
| `parseInt("0x10", 16)` | `16` | — |
| `BigInt("9007199254740993")` | `9007199254740993` | — |
| `Number(9007199254740993n)` | `9007199254740992` | 末位丢失 |
| `0.1 + 0.2 === 0.3` | `false` | — |
| `Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON` | `true` | — |

### 3. 失败分支

创建 `bigint-math.html`，写入 `const rounded = Math.round(1n);`，Console 显示 `TypeError: Cannot convert a BigInt value to a number`。`Math` 方法只接受 `number`，需要先确认值在安全范围内再转换，或改用 `BigInt` 支持的整数运算。

另一个常见失败是直接比较 `0.1 + 0.2 === 0.3` 并据此判定金额不相等。页面中的结果已经是 `false`；修复不是改写成 `==`，而是改用整数单位或允许误差，并把判断条件写进代码注释。

## 六、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格十六行与控制台四条输出与正文一致；`bigint-math.html` 得到 `TypeError: Cannot convert a BigInt value to a number`。两个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有展开 `Intl.NumberFormat` 的货币格式化、`BigInt` 的位运算和任意精度小数库；`Number.EPSILON` 的用法只适用于示例量级，不能当作所有浮点比较的通用容差。
