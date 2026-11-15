---
title: "类型转换与相等性"
tags:
  - JavaScript
  - 类型转换
  - 相等性
  - 原始值
excerpt: "解释 JavaScript 在运算和比较时怎样转换值：显式与隐式转换的触发位置，对象到原始值的 ToPrimitive 过程，+ 与 == 的规则，以及 === 与 Object.is 的差异，并给出可从空目录复现的观察页。"
date: 2026-11-15
---

# 类型转换与相等性

JavaScript 的每个值都有类型，运算符却只接受特定类型：算术需要数字，拼接需要字符串，条件需要布尔。当两侧类型不匹配时，语言会按固定规则先转换，再完成运算。转换结果决定了表达式返回什么，也决定了两个值是否相等。

转换分两类。显式转换由代码直接调用 `Number()`、`String()`、`Boolean()` 等方法；隐式转换由运算符和上下文触发，例如 `1 + "2"`、`if ("0")`、`[] == false`。后者不会报错，只会按规则给出结果，因此更需要理解规则本身。

相等判断有三套算法：抽象相等 `==` 允许转换，严格相等 `===` 要求类型和值都相同，`Object.is()` 则在 `NaN` 与正负零上给出不同答案。本篇先说明转换在哪里发生，再解释原始值和对象各自的转换路径，最后用可运行的页面逐行核对结果。

::: info 本篇的范围
本篇讲类型转换与相等判断，不展开原型链、`Symbol` 的元编程用法和 JSON 序列化。对象结构见“对象与数组的初步使用”，原型查找见“原型链与继承”，这些内容不在本篇重复。
:::

## 一、转换发生在运算符需要某种类型时

### 1. 值有类型，运算要求类型

`+` 既可能是加法也可能是字符串拼接，比较运算符需要能比较的值，条件语句需要布尔。运算符不能直接处理所有类型，所以语言在运算前调用转换规则。转换发生在运算符内部，不会改变原变量的值。

```js
const count = "2";
console.log(count * 3); // 6，字符串先转成数字
console.log(count); // "2"，原变量仍是字符串
```

显式转换让读者一眼看出这里发生了类型变化。处理表单输入、查询参数和外部数据时，先转成需要的类型，再做判断和计算，可以避免依赖隐式规则。

```js
const raw = "12";
const value = Number(raw);
console.log(value === 12); // true
```

`Number()` 是严格转换：整个字符串必须能表示一个数字，否则得到 `NaN`。这一点在第二节展开。

### 2. 隐式转换由运算符和上下文触发

常见的隐式转换有三类：算术运算符把操作数转成数字，`+` 在任一方是字符串时转成字符串拼接，条件语句把值转成布尔。它们不会抛出异常，因此错误往往表现为结果不对，而不是程序中断。

```js
console.log("5" * 2); // 10
console.log("5" + 2); // "52"
console.log(Boolean("0")); // true
```

`"5" * 2` 和 `"5" + 2` 的差异不是运算符优先级，而是 `*` 只做数值乘法，`+` 在发现字符串后改为拼接。

### 3. 对象先变成原始值，再参与转换

对象不能直接参与算术和比较。转换前先执行“对象到原始值”的过程，得到一个原始值，再按原始值的规则继续。数组、普通对象和包装对象的默认结果不同，这也是 `[] == false` 为 `true` 的来源。

```js
console.log([1] + 1); // "11"
console.log([1] - 1); // 0
```

同一个数组在 `+` 和 `-` 中得到不同结果：`+` 在转换后遇到字符串，执行拼接；`-` 只做数值减法，把 `"1"` 再转成数字。

## 二、原始值的显式转换

### 1. String() 产生可读文本

`String()` 把值转成字符串，`null` 和 `undefined` 分别得到 `"null"` 与 `"undefined"`，`NaN` 得到 `"NaN"`。`-0` 转成 `"0"`，因为字符串表示不保留负零的符号。

```js
console.log(String(null)); // "null"
console.log(String(undefined)); // "undefined"
console.log(String(-0)); // "0"
```

### 2. Number() 只接受完整的数字写法

`Number()` 会先去掉首尾空白。空字符串和只有空白的字符串转换成 `0`，这是一个容易漏掉的边界；带单位的字符串得到 `NaN`；十六进制字符串按对应进制解析。

```js
console.log(Number("")); // 0
console.log(Number("  ")); // 0
console.log(Number("0x10")); // 16
console.log(Number("12px")); // NaN
console.log(parseInt("12px", 10)); // 12
```

`parseInt()` 从左到右读取，遇到不能组成数字的字符就停止，因此能把 `"12px"` 读成 `12`。两者用途不同：需要整串都是数字时用 `Number()`，需要从带单位的文本中取整数时才用 `parseInt()`，并显式传入进制。

### 3. Boolean() 只认假值集合

只有 `false`、`0`、`-0`、`0n`、空字符串、`null`、`undefined` 和 `NaN` 转换成 `false`，其余值都是 `true`，包括字符串 `"0"`、空数组和空对象。判断“有没有内容”不能只依赖真值转换。

```js
console.log(Boolean("0")); // true
console.log(Boolean([])); // true
console.log(Boolean({})); // true
```

### 4. 转换表

在 Chrome 中对同一组值分别调用三个转换函数，得到下表。`Boolean(new Boolean(false))` 为 `true`，因为包装对象本身是对象，不是假值。

| 值 | `String()` | `Number()` | `Boolean()` |
|----|-----------|-----------|-------------|
| `undefined` | `"undefined"` | `NaN` | `false` |
| `null` | `"null"` | `0` | `false` |
| `true` | `"true"` | `1` | `true` |
| `0` | `"0"` | `0` | `false` |
| `""` | `""` | `0` | `false` |
| `"0"` | `"0"` | `0` | `true` |
| `NaN` | `"NaN"` | `NaN` | `false` |
| `[]` | `""` | `0` | `true` |
| `[1]` | `"1"` | `1` | `true` |
| `{}` | `"[object Object]"` | `NaN` | `true` |
| `new Boolean(false)` | `"false"` | `0` | `true` |

表格里的结果已经包含对象转换。要解释数组和对象为什么得到这些值，需要看下一节的转换路径。

## 三、对象到原始值的路径

### 1. ToPrimitive 与 hint

对象转换为原始值时，语言提供一个“期望类型”提示（hint）：`number`、`string` 或 `default`。`+` 和 `==` 使用 `default`，模板字面量和 `String()` 使用 `string`，数值转换使用 `number`。提示决定先尝试哪个方法。

`ToPrimitive` 是规范中的内部操作，代码不能直接调用。能观察到的是它按顺序调用了对象自己的 `valueOf()` 和 `toString()`。普通对象在 `number` 或 `default` 提示下先调用 `valueOf()`；如果返回原始值就采用它，否则再调用 `toString()`。`string` 提示把顺序反过来，先调用 `toString()`。

```js
const mixed = {
  valueOf: () => 42,
  toString: () => "mixed",
};

console.log(String(mixed)); // "mixed"，先调用 toString
console.log(mixed + 1); // 43，先调用 valueOf
```

同一个对象在两种提示下得到不同结果，说明“对象会转成字符串”并不是一条无条件规则。`Date` 的 `default` 提示按 `string` 处理，所以日期在 `+` 和 `String()` 中更容易得到文本结果。

### 2. 数组、对象与包装对象的默认结果

数组没有自定义 `valueOf()`，继承的 `valueOf()` 返回数组本身，于是继续调用 `toString()`，得到用逗号连接的元素。普通对象最终得到 `"[object Object]"`。包装对象的 `valueOf()` 返回内部原始值，因此 `Number(new Boolean(false))` 为 `0`，但 `Boolean(new Boolean(false))` 仍为 `true`。

```js
console.log(String([])); // ""
console.log(String([1, 2])); // "1,2"
console.log(String({})); // "[object Object]"
console.log(Number(new Boolean(false))); // 0
```

`Symbol.toPrimitive` 可以接管整个转换过程，按 hint 返回不同原始值。它属于元编程能力，本篇只说明存在与优先级：定义了该方法的对象不再按 `valueOf()`、`toString()` 的顺序转换。业务代码中直接修改内建对象的转换方法会影响所有使用者，不应作为常规写法。

## 四、加号与抽象相等

### 1. + 在任一方是字符串时拼接

`+` 先对两个操作数执行 `ToPrimitive`（`default` 提示）。只要其中一个是字符串，就执行字符串拼接；否则执行数值加法。数组和对象转换为字符串后，`+` 很容易变成拼接。

```js
console.log(1 + "2"); // "12"
console.log([] + []); // ""
console.log([] + {}); // "[object Object]"
console.log([1, 2] + [3]); // "1,23"
```

`[1, 2] + [3]` 的结果是 `"1,23"`：两个数组分别转成 `"1,2"` 和 `"3"`，然后拼接，不是元素级相加。

### 2. == 只在必要时转换

抽象相等 `==` 的规则按操作数类型分支：

| 两侧类型 | 处理 |
|----------|------|
| 相同类型 | 按严格相等比较，但 `NaN` 不等于自身 |
| `null` 与 `undefined` | 互相相等，且都不等于其他值 |
| 数字与字符串 | 字符串转成数字再比较 |
| 布尔与其他类型 | 布尔先转成数字，再按剩余规则比较 |
| 对象与原始值 | 对象先转成原始值，再比较 |
| `BigInt` 与字符串或数字 | 按 BigInt 的专门规则比较，不与普通数字混算 |

规则本身不复杂，难的是组合后的结果。布尔值先转数字这一步，会让 `false` 参与比较时变成 `0`；对象转原始值又可能得到空字符串或 `"[object Object]"`。

### 3. 反直觉组合的推导

| 比较 | `==` | `===` | `Object.is` | 推导 |
|------|------|-------|-------------|------|
| `null` 与 `undefined` | `true` | `false` | `false` | `==` 对这两个空值有专门规则 |
| `0` 与 `""` | `true` | `false` | `false` | 空字符串转成数字 `0` |
| `0` 与 `-0` | `true` | `true` | `false` | 三者只有 `Object.is` 区分符号 |
| `NaN` 与 `NaN` | `false` | `false` | `true` | 只有 `Object.is` 认为两个 `NaN` 相同 |
| `[]` 与 `false` | `true` | `false` | `false` | `false` 转成 `0`，空数组转成 `""` 再转成 `0` |
| `[1]` 与 `1` | `true` | `false` | `false` | 数组转成 `"1"`，再转成数字 `1` |
| `"1"` 与 `1` | `true` | `false` | `false` | 字符串转成数字 |
| `null` 与 `false` | `false` | `false` | `false` | `false` 转成 `0`，`null` 不等于 `0` |

### 4. 默认使用严格相等

严格相等不做类型转换，结果只取决于类型和值，读代码时不需要在脑中执行转换规则。默认使用 `===` 和 `!==`；需要判断“值为 `null` 或 `undefined`”时，可以单独使用 `value == null` 这一种写法，因为 `==` 对这两个值有明确规则，其他值都不会命中。

```js
const value = null;
console.log(value == null); // true，同时覆盖 null 与 undefined
console.log(value === null); // true，只匹配 null
```

::: warning 不要用 == 代替显式转换
`input == 0` 在 `input` 为空字符串时也为 `true`。如果空输入应被视为“未填写”，应先检查字符串是否为空，再用 `Number()` 转换并判断 `NaN`，而不是让 `==` 隐式决定。
:::

## 五、严格相等与 Object.is

### 1. === 要求类型和值都相同

严格相等先比较类型；类型不同直接返回 `false`，类型相同再比较值。`"1" === 1` 为 `false`，`[] === []` 为 `false`，因为两个数组是不同的对象引用。

```js
console.log("1" === 1); // false
console.log([] === []); // false
console.log(0 === -0); // true
```

严格相等有两个需要单独记住的边界：`NaN === NaN` 为 `false`，判断 `NaN` 应使用 `Number.isNaN()`；`0 === -0` 为 `true`，严格相等不区分正负零。

```js
console.log(NaN === NaN); // false
console.log(Number.isNaN(NaN)); // true
console.log(0 === -0); // true
```

`Number.isNaN()` 只对真正的 `NaN` 返回 `true`；全局 `isNaN()` 会先转换参数，`isNaN("abc")` 也是 `true`，不能用来判断一个值是否本来就是 `NaN`。

### 2. Object.is 判断“同一个值”

`Object.is()` 在 `NaN` 和正负零上采用不同规则：两个 `NaN` 视为相同，`0` 与 `-0` 视为不同；其余情况与 `===` 一致。它适合需要精确区分这两个边界的场景，例如测试断言和状态比较。

```js
console.log(Object.is(NaN, NaN)); // true
console.log(Object.is(0, -0)); // false
console.log(Object.is("1", 1)); // false
```

`Object.is()` 于 ES2015 引入。需要支持更旧环境时，应先按兼容数据确认，或用等价的 `NaN` 与正负零判断代替，不要假定目标环境一定支持。

### 3. 选择表

| 场景 | 推荐写法 | 原因 |
|------|----------|------|
| 一般值比较 | `===` | 不做转换，结果可预测 |
| 判断 `NaN` | `Number.isNaN(value)` | 只有真正 `NaN` 返回 `true` |
| 区分 `0` 与 `-0` | `Object.is(value, -0)` | `===` 无法区分符号 |
| 同时判断 `null` 与 `undefined` | `value == null` | 只此一种宽松相等写法有明确语义 |
| 外部输入参与计算 | 先显式转换，再比较 | 避免字符串、空值和布尔混入 |

::: tip 先转换，再比较
把“输入是什么类型”和“值是否相等”分开处理：先对输入做一次显式转换并检查是否失败，再用严格相等比较。这样比较表达式本身不需要读者回忆转换规则。
:::

## 六、从空目录观察转换与相等

### 1. 创建 conversion.html 与 app.js

新建空目录 `js-conversion`，创建两个 UTF-8 文件。页面只放两张表和一行状态文本，脚本用 `textContent` 写入单元格，避免把转换结果当成 HTML 解析。

::: details 查看 conversion.html 与 app.js 完整内容

```html [conversion.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>类型转换与相等性观察</title>
  <style>
    table { border-collapse: collapse; margin-block: 1rem; }
    th, td { border: 1px solid #999; padding: 4px 8px; text-align: left; }
  </style>
</head>
<body>
  <h1>类型转换与相等性观察</h1>
  <p id="summary" role="status">正在生成表格……</p>

  <table id="conversion">
    <caption>显式转换结果</caption>
    <thead>
      <tr><th>值</th><th>String()</th><th>Number()</th><th>Boolean()</th></tr>
    </thead>
    <tbody></tbody>
  </table>

  <table id="equality">
    <caption>三种相等判断</caption>
    <thead>
      <tr><th>比较</th><th>==</th><th>===</th><th>Object.is</th></tr>
    </thead>
    <tbody></tbody>
  </table>

  <script src="app.js"></script>
</body>
</html>
```

```js [app.js]
/** 向表格追加一行，单元格内容全部用 textContent 写入。 */
function addRow(table, cells) {
  const row = document.createElement("tr");
  for (const text of cells) {
    const cell = document.createElement("td");
    cell.textContent = text;
    row.append(cell);
  }
  table.querySelector("tbody").append(row);
}

/** 让值的显示结果稳定，便于逐行核对。 */
function show(value) {
  if (typeof value === "string") return JSON.stringify(value);
  if (Object.is(value, -0)) return "-0";
  if (Array.isArray(value)) return "[" + value.join(", ") + "]";
  if (value instanceof Boolean) return "Boolean(" + value.valueOf() + ")";
  if (typeof value === "object" && value !== null) return "{}";
  return String(value);
}

const samples = [
  ["undefined", undefined],
  ["null", null],
  ["true", true],
  ["0", 0],
  ['""', ""],
  ['"0"', "0"],
  ["NaN", NaN],
  ["[]", []],
  ["[1]", [1]],
  ["{}", {}],
  ["new Boolean(false)", new Boolean(false)],
];

for (const [label, value] of samples) {
  addRow(
    document.getElementById("conversion"),
    [label, show(String(value)), show(Number(value)), show(Boolean(value))],
  );
}

const pairs = [
  ["null 与 undefined", null, undefined],
  ['0 与 ""', 0, ""],
  ["0 与 -0", 0, -0],
  ["NaN 与 NaN", NaN, NaN],
  ["[] 与 false", [], false],
  ["[1] 与 1", [1], 1],
  ['"1" 与 1', "1", 1],
  ["null 与 false", null, false],
];

for (const [label, left, right] of pairs) {
  addRow(
    document.getElementById("equality"),
    [label, String(left == right), String(left === right), String(Object.is(left, right))],
  );
}

document.getElementById("summary").textContent =
  "已生成 " + samples.length + " 行转换结果和 " + pairs.length + " 行相等判断。";
```

:::

在文件管理器中双击 `conversion.html`，或在浏览器地址栏打开该文件的本地路径。页面标题下应显示“已生成 11 行转换结果和 8 行相等判断。”，随后出现两张表。打开开发者工具的 Console，不应出现错误。

### 2. 逐行核对

第一张表用于核对显式转换，第二张表用于核对三套相等判断。重点检查以下几个位置：`Boolean("0")` 为 `true`；`Number("")` 为 `0`；`[]` 行在 `String()` 下为空字符串；`NaN` 行只有 `Object.is` 为 `true`；`0 与 -0` 行在 `===` 下为 `true`、在 `Object.is` 下为 `false`。

| 观察项 | 操作 | 本次结果 |
|--------|------|----------|
| 状态文本 | 打开页面 | “已生成 11 行转换结果和 8 行相等判断。” |
| 空字符串转数字 | 查看 `""` 行的 `Number()` | `0` |
| 字符串零的真值 | 查看 `"0"` 行的 `Boolean()` | `true` |
| 空数组转字符串 | 查看 `[]` 行的 `String()` | `""` |
| 包装对象真值 | 查看 `new Boolean(false)` 行 | `Boolean()` 为 `true`，`Number()` 为 `0` |
| `NaN` 比较 | 查看 `NaN 与 NaN` 行 | `==` 与 `===` 为 `false`，`Object.is` 为 `true` |
| 正负零 | 查看 `0 与 -0` 行 | `===` 为 `true`，`Object.is` 为 `false` |
| 控制台错误 | 打开 Console | 无错误 |

### 3. 失败分支：把空输入当成 0

把下面的文件另存为 `check.html` 并在同一目录打开，输入框留空后点击按钮：

::: details 查看 check.html 完整内容

```html [check.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>数量检查</title>
</head>
<body>
  <label>数量：<input id="count" value=""></label>
  <button id="run" type="button">检查</button>
  <p id="result" role="status"></p>
  <script>
    document.getElementById("run").addEventListener("click", () => {
      const text = document.getElementById("count").value;
      const result = document.getElementById("result");
      if (Number(text) === 0) {
        result.textContent = "数量为 0，可以提交。";
      } else {
        result.textContent = "数量无效，请重新填写。";
      }
    });
  </script>
</body>
</html>
```

:::

输入框留空时点击按钮，页面显示“数量为 0，可以提交。”，因为 `Number("")` 为 `0`，空输入被当成了合法数量；输入 `abc` 显示“数量无效，请重新填写。”。修复方法是先判断是否为空，再转换：

```js
const text = document.getElementById("count").value.trim();
const result = document.getElementById("result");
if (text === "") {
  result.textContent = "请填写数量。";
} else if (Number.isNaN(Number(text))) {
  result.textContent = "数量必须是数字。";
} else {
  result.textContent = "数量为 " + Number(text) + "，可以提交。";
}
```

修复后重新点击，空输入显示“请填写数量。”，输入 `abc` 显示“数量必须是数字。”，输入 `0` 显示“数量为 0，可以提交。”。这个分支说明：显式转换并不自动解决空值和格式问题，转换前后的检查同样重要。

## 七、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中核对。页面通过 `file://` 直接打开，状态文本为“已生成 11 行转换结果和 8 行相等判断。”，两张表的结果与正文一致，Console 没有错误。同一组相等判断与 `Number(null)`、`Number(undefined)`、`Boolean(new Boolean(false))` 在 Node.js v22.23.4 中执行，结果一致。

失败分支的 `check.html` 在同一环境执行：输入留空显示“数量为 0，可以提交。”，输入 `abc` 显示“数量无效，请重新填写。”；替换为修复片段后复测，空输入显示“请填写数量。”，`abc` 显示“数量必须是数字。”，`0` 显示“数量为 0，可以提交。”。修复后的文件与原页面除脚本外结构相同，未在正文中重复列出。

`conversion.html`、`check.html` 与修复后的页面经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。本文没有验证 Firefox、Safari 和移动端浏览器，也没有展开 `BigInt` 与字符串、数字之间的全部比较规则；这些内容在需要时应按 ECMA-262 与 MDN 的对应条目单独核对。自定义 `Symbol.toPrimitive` 的返回值优先级只按规范描述，未编写运行示例。
