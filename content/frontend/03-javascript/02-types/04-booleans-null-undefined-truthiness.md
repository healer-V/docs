---
title: "布尔、null、undefined 与真值判断"
tags:
  - JavaScript
  - 布尔
  - null
  - undefined
  - 真值
excerpt: "列出条件判断中全部为假的值，区分 null 与 undefined 的来源和序列化差异，说明默认参数、逻辑或与空值合并运算符的不同表现，并给出可复现的真假值观察页。"
date: 2026-11-15
---

# 布尔、null、undefined 与真值判断

布尔只有 `true` 和 `false` 两个值，但 `if` 和逻辑运算符接受任何值，并把它转换成布尔结果。转换规则是固定的：`false`、`0`、`-0`、`0n`、空字符串、`null`、`undefined` 和 `NaN` 为假，其余值都是真。空数组和空对象是对象，条件中为真。

`null` 和 `undefined` 都表示“没有值”，来源却不同。`undefined` 多由语言自动产生：未赋值的变量、缺失的属性、没有返回值的函数；`null` 通常由代码或接口显式给出，表示“有意为空”。两者在默认参数、逻辑运算符和 JSON 序列化中的表现并不一致。

本篇先列出真假值规则，再区分两种空值的来源，随后说明默认值与空值判断的写法，最后用页面逐项核对。

::: info 本篇的范围
本篇讲真假转换与空值使用，不展开可选链和空值合并表达式的完整语法，也不逐条推导 `==` 的转换规则。相等性算法见“类型转换与相等性”。
:::

## 一、布尔值与真值转换

### 1. 两个布尔字面量

布尔值只有 `true` 和 `false`，`typeof` 结果为 `"boolean"`。比较运算和逻辑运算产生布尔值，`Boolean()` 把任意值显式转换。

```js
console.log(typeof true); // "boolean"
console.log(1 < 2); // true
console.log(Boolean("")); // false
```

### 2. 条件中为假的值

条件判断内部执行布尔转换。为假的只有固定几种：`false`、`0`、`-0`、`0n`、空字符串 `""`、`null`、`undefined` 和 `NaN`。其余值一律为真，包括 `"0"`、`" "`、空数组 `[]` 和空对象 `{}`。

```js
if ("0") console.log("字符串 0 为真"); // 输出
if ([]) console.log("空数组为真"); // 输出
if (0) console.log("不会输出");
```

`0` 与 `"0"`、空字符串与含空格的字符串、空数组与空字符串，是判断中最容易混淆的三组。

### 3. Boolean() 与隐式转换一致

`Boolean(value)` 的结果与条件中的转换完全一致，可以先用它观察再写判断。`!!value` 是同样效果的简写，但可读性不如 `Boolean()`。

```js
console.log(Boolean([])); // true
console.log(Boolean("")); // false
console.log(!!NaN); // false
```

## 二、null 与 undefined 的来源

### 1. undefined 由语言产生

未声明的变量读取会抛错，但已声明未赋值的变量值为 `undefined`。访问对象上不存在的属性、调用没有返回值的函数、读取没有传入的参数，也都得到 `undefined`。

```js
let name;
console.log(name); // undefined
const user = { id: 1 };
console.log(user.age); // undefined
```

### 2. null 表示有意为空

`null` 需要显式写出，表示“这里本该有值，但当前为空”。查询接口、DOM 查询和 JSON 数据常用 `null`。不要把 `null` 当作 `undefined` 的同义词随意替换，二者在默认参数和序列化中行为不同。

```js
const selected = document.querySelector("#missing"); // null
const profile = { nickname: null }; // 明确没有昵称
```

### 3. typeof 与 JSON 中的差异

`typeof null` 返回 `"object"`，`typeof undefined` 返回 `"undefined"`，判断空值应直接比较。`JSON.stringify()` 会省略值为 `undefined` 的对象属性，而 `null` 会被保留；数组中的 `undefined` 会变成 `null`。

```js
console.log(typeof null); // "object"
console.log(JSON.stringify({ a: undefined, b: null })); // {"b":null}
console.log(JSON.stringify([undefined])); // [null]
```

## 三、默认值与空值判断

### 1. 默认参数只对 undefined 生效

函数参数默认值在传入 `undefined` 或不传时启用，传入 `null` 时不会启用。`greet(null)` 得到 `"你好，null"`，如果业务上 `null` 也算缺失，需要在函数内部再判断。

```js
function greet(name = "访客") {
  return "你好，" + name;
}
console.log(greet()); // "你好，访客"
console.log(greet(null)); // "你好，null"
```

### 2. 逻辑或与空值合并

`||` 在左值为假时取右值，因此 `0` 和 `""` 会被替换掉；`??` 只在左值为 `null` 或 `undefined` 时取右值。需要保留 `0`、`false` 和空字符串时用 `??`。

```js
const count = 0;
console.log(count || 10); // 10
console.log(count ?? 10); // 0
```

### 3. == null 的适用范围

`value == null` 对 `null` 和 `undefined` 都为真，对其他假值为假，是同时判断两种空值的固定写法。但它不能识别 `0` 和空字符串；如果这些值在业务上也算“没有”，需要单独判断。

```js
console.log(undefined == null); // true
console.log(0 == null); // false
console.log("" == null); // false
```

## 四、从空目录观察真假值

### 1. 创建页面

新建空目录 `js-truthiness`，创建 `index.html`。脚本把十二个值分别送入 `Boolean()`、条件判断和 `??`，并在控制台输出默认参数、JSON 序列化和空值比较的结果。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>真假值与空值观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>真假值与空值观察</h1>
  <table id="output">
    <thead><tr><th>值</th><th>Boolean(value)</th><th>条件中的结果</th><th>value ?? "默认"</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    function show(value) {
      if (typeof value === "string") return value === "" ? '""' : JSON.stringify(value);
      const text = String(value);
      return text === "" ? "（空文本）" : text;
    }

    const samples = [
      ["false", false],
      ["0", 0],
      ["-0", -0],
      ["0n", 0n],
      ['""', ""],
      ['"0"', "0"],
      ['" "', " "],
      ["[]", []],
      ["{}", {}],
      ["null", null],
      ["undefined", undefined],
      ["NaN", NaN],
    ];

    const body = document.querySelector("#output tbody");
    for (const [label, value] of samples) {
      const row = document.createElement("tr");
      const cells = [
        label,
        String(Boolean(value)),
        value ? "真" : "假",
        show(value ?? "默认"),
      ];
      for (const text of cells) {
        const cell = document.createElement("td");
        cell.textContent = text;
        row.append(cell);
      }
      body.append(row);
    }

    function greet(name = "访客") {
      return "你好，" + name;
    }

    console.log("greet()", greet());
    console.log("greet(undefined)", greet(undefined));
    console.log("greet(null)", greet(null));
    console.log("greet('')", greet(""));
    console.log("JSON.stringify 省略 undefined", JSON.stringify({ a: undefined, b: null }));
    const user = { name: "Ada" };
    console.log("缺失属性", user.age);
    console.log("0 == null", 0 == null);
    console.log("undefined == null", undefined == null);
    console.log("'' == null", "" == null);
    console.log("-0 与 0", Object.is(-0, 0));
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有十二行。八个假值和四个真值组成了这张表；注意 `[]` 一行在最后一列显示“（空文本）”，因为空数组转成字符串是空文本，`??` 不会替换它。控制台应显示未传参、传 `undefined` 都得到 `"你好，访客"`，传 `null` 得到 `"你好，null"`，传空字符串得到 `"你好，"`；JSON 序列化结果为 `{"b":null}`，缺失属性为 `undefined`，`undefined == null` 为 `true`，`0 == null` 与 `"" == null` 为 `false`，`Object.is(-0, 0)` 为 `false`。

| 值 | `Boolean(value)` | 条件中的结果 | `value ?? "默认"` |
|----|------------------|--------------|-------------------|
| `false` | `false` | 假 | `false` |
| `0` | `false` | 假 | `0` |
| `-0` | `false` | 假 | `0`（`String(-0)` 不显示符号） |
| `0n` | `false` | 假 | `0` |
| `""` | `false` | 假 | `""` |
| `"0"` | `true` | 真 | `"0"` |
| `" "` | `true` | 真 | `" "` |
| `[]` | `true` | 真 | `（空文本）` |
| `{}` | `true` | 真 | `[object Object]` |
| `null` | `false` | 假 | `"默认"` |
| `undefined` | `false` | 假 | `"默认"` |
| `NaN` | `false` | 假 | `NaN` |

### 3. 失败分支

创建 `null-property.html`，写入 `const user = { name: "Ada" }; console.log(user.address.city);`。读取 `user.address` 已得到 `undefined`，再读 `.city` 时 Console 显示 `TypeError: Cannot read properties of undefined (reading 'city')`。修复是先判断中间对象，或使用可选链 `user.address?.city`，让缺失时得到 `undefined` 而不是抛错。

另一个常见问题是用 `||` 提供默认值。创建 `falsy-default.html`，脚本输出 `count || 10` 为 `10`、`count ?? 10` 为 `0`。当 `count` 合法地等于 `0` 时，`||` 会把它替换成默认值；这类字段应使用 `??`。

## 五、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格十二行与控制台十条输出与正文一致；`null-property.html` 得到 `TypeError: Cannot read properties of undefined (reading 'city')`，`falsy-default.html` 输出 `10` 与 `0`。`JSON.stringify([undefined])` 得到 `[null]`，该结果在 Node.js v22.23.4 中核对。三个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有展开 `document.all` 这一历史特例、可选链与空值合并的完整优先级规则；这些内容按目标环境与后续文章核对。
