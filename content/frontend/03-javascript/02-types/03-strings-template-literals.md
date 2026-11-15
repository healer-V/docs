---
title: "字符串与模板字面量"
tags:
  - JavaScript
  - 字符串
  - 模板字面量
  - Unicode
excerpt: "说明字符串的引号、转义与模板字面量写法，解释 length 按 UTF-16 码元计数、emoji 与组合字符的长度差异，并给出码点遍历、规范化与安全截取的可复现观察。"
date: 2026-11-15
---

# 字符串与模板字面量

字符串表示文本。单引号、双引号和反引号都能创建字符串，区别主要在转义和插值：前两者需要转义内部引号，反引号支持多行和 `${}` 插值。模板字面量不会改变字符串的本质，它只是更直接的写法。

字符串的长度按 UTF-16 码元计算，而不是按用户看到的字符计算。一个 emoji 可能占两个码元，带组合符号的字母也可能占两个码元。按 `.length` 截取或计数，会在这些字符上出错。

本篇先说明三种写法与转义，再解释码元、码点和组合字符的区别，最后用页面核对长度、插值、规范化与截断结果。

::: info 本篇的范围
本篇讲字符串的表示和基本只读操作，不展开正则表达式与完整的 `String` 方法清单。字符串处理与正则见“字符串处理与正则表达式”，类型转换见“类型转换与相等性”。
:::

## 一、字符串的写法

### 1. 单引号、双引号与转义

单引号和双引号创建的字符串没有区别。字符串内部出现同种引号时需要转义；反斜杠本身也要写成 `\\`。换行、制表符等控制字符用 `\n`、`\t` 表示。

```js
const single = '他说："你好"';
const double = "他说：\"你好\"";
const path = "C:\\temp\\file.txt";
console.log(single === double); // true
```

`single` 用单引号包住双引号，不需要转义；`double` 用双引号包住双引号，内部引号必须转义。

### 2. 模板字面量

反引号创建模板字面量。它支持多行文本和 `${expression}` 插值，插值结果会先转成字符串再拼接。模板里可以直接写换行，不需要 `\n`。

```js
const price = 12;
const count = 3;
const message = `总价：${price * count} 元`;
console.log(message); // "总价：36 元"
```

### 3. 多行文本与缩进

模板字面量保留源码中的换行和缩进。为了让缩进不进入结果，可以把内容顶格书写，或在拼接后处理。缩进不是语法问题，但会影响显示和比较。

```js
const text = `第一行
第二行`;
console.log(JSON.stringify(text)); // "第一行\n第二行"
```

## 二、长度与字符

### 1. length 按 UTF-16 码元计数

JavaScript 字符串是 UTF-16 码元序列。常用汉字通常占一个码元，基本拉丁字母占一个码元，而 emoji 等辅助平面字符占两个码元（一个代理对）。`"😀".length` 因此是 `2`，不是 `1`。

```js
console.log("hello".length); // 5
console.log("😀".length); // 2
```

### 2. 按码点遍历

需要按用户看到的字符处理时，用 `for...of`、展开运算符或 `Array.from()`，它们按码点迭代。`[...str].length` 得到码点数量，而不是码元数量。

```js
console.log([..."😀"].length); // 1
console.log(Array.from("😀").length); // 1
```

按 `.length` 或 `slice()` 截取可能把一个代理对切成两半，得到无法单独显示的码元。截断用户可见文本时，应按码点切分。

### 3. 组合字符与规范化

有些字符有“预组合”和“基字母 + 组合符号”两种表示。`"é"`（U+00E9）长度为 `1`，`"e\u0301"`（`e` 加组合重音）长度为 `2`，两者直接比较不相等，但规范化后相等。

```js
const composed = "é";
const decomposed = "e\u0301";
console.log(composed === decomposed); // false
console.log(composed.normalize() === decomposed.normalize()); // true
```

`normalize()` 默认使用 NFC 形式，把可组合的字符合成一个码点。比较用户输入或来自不同系统的文本时，先规范化再比较。

## 三、常用只读操作

### 1. 切片与查找

`slice(start, end)` 按索引截取，不修改原字符串；`indexOf()` 和 `includes()` 查找子串。索引仍按码元计算，遇到代理对时同样需要注意。

```js
console.log("abcdef".slice(1, 4)); // "bcd"
console.log("abcdef".includes("cd")); // true
```

### 2. at 从末尾取值

`at()` 接受负索引，`-1` 表示最后一个码元。它于 ES2022 引入，旧环境需要按兼容数据确认或改用 `charAt()` 与长度计算。

```js
console.log("abc".at(-1)); // "c"
console.log("abc".at(0)); // "a"
```

### 3. 字符串不可变

字符串方法返回新字符串，原值不变。按下标赋值不会改变字符串，严格模式下还会抛出错误。需要修改文本时，用返回值重新赋值。

```js
let text = "abc";
console.log(text.toUpperCase()); // "ABC"
console.log(text); // "abc"
```

## 四、从空目录观察字符串

### 1. 创建页面

新建空目录 `js-strings`，创建 `index.html`。脚本把长度、码点、规范化、插值和截取结果写入表格，并在控制台输出 emoji 的码元数与码点数。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>字符串与模板字面量观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>字符串与模板字面量观察</h1>
  <table id="output">
    <thead><tr><th>表达式</th><th>结果</th><th>补充</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const multiline = `第一行
第二行`;
    const composed = "é";
    const decomposed = "e\u0301";
    const face = "😀";
    const samples = [
      ['"hello".length', "hello".length, "—"],
      ['"😀".length', face.length, "UTF-16 码元数"],
      ["[...'😀'].length", [...face].length, "码点数"],
      ["Array.from('😀').length", Array.from(face).length, "码点数"],
      ['"é".length', composed.length, "预组合字符"],
      ['"e\\u0301".length', decomposed.length, "基字母加组合符号"],
      ['"é" === "e\\u0301"', composed === decomposed, "未规范化"],
      ["normalize() 后相等", composed.normalize() === decomposed.normalize(), "规范化"],
      ['`总价：${12 * 3}`', `总价：${12 * 3}`, "模板插值"],
      ["多行模板", JSON.stringify(multiline), "保留换行"],
      ['"\\u{1F600}".length', "\u{1F600}".length, "转义写法"],
      ['"abc".at(-1)', "abc".at(-1), "从末尾取字符"],
      ['"abc".includes("b")', "abc".includes("b"), "—"],
      ["😀.slice(0, 1) 的码元", face.slice(0, 1).charCodeAt(0), "只取到高位代理"],
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

    console.log("emoji length", face.length);
    console.log("emoji code points", [...face].length);
    console.log("normalize equal", composed.normalize() === decomposed.normalize());
    console.log("multiline", JSON.stringify(multiline));
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有十四行。注意区分“预组合字符”和“基字母加组合符号”两行：它们显示效果相似，长度和比较结果不同。控制台应显示 emoji 长度为 `2`、码点数为 `1`、规范化后相等为 `true`，多行文本为 `"第一行\n第二行"`。

| 表达式 | 结果 | 补充 |
|--------|------|------|
| `"hello".length` | `5` | — |
| `"😀".length` | `2` | UTF-16 码元数 |
| `[...'😀'].length` | `1` | 码点数 |
| `Array.from('😀').length` | `1` | 码点数 |
| `"é".length`（预组合） | `1` | 单个码点 |
| `"e\u0301".length`（基字母加重音） | `2` | 两个码点 |
| `"é" === "e\u0301"` | `false` | 未规范化 |
| `normalize()` 后相等 | `true` | 规范化 |
| `` `总价：${12 * 3}` `` | `总价：36` | 模板插值 |
| 多行模板 | `"第一行\n第二行"` | 保留换行 |
| `"\u{1F600}".length` | `2` | 码点转义仍是代理对 |
| `"abc".at(-1)` | `c` | 从末尾取字符 |
| `"abc".includes("b")` | `true` | — |
| `😀.slice(0, 1)` 的码元 | `55357` | 只取到高位代理 |

### 3. 失败分支

创建 `bad-quote.html`，写入 `const text = "他说："你好"";`。字符串在第二个双引号处结束，后面的内容被当成新标识符，Console 显示 `SyntaxError: Unexpected identifier '你好'`。修复是改用单引号、转义内部引号，或使用反引号。

另一个失败是按 `.length` 截断 emoji。`"😀".slice(0, 1)` 只保留高位代理，长度显示为 `1`，但不能组成完整字符。需要截断时按码点切分：

```js
const characters = [...text];
const first = characters[0] ?? "";
```

## 五、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格十四行与观察表一致，控制台四条输出与正文一致；`bad-quote.html` 得到 `SyntaxError: Unexpected identifier '你好'`。两个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有展开正则表达式、`Intl.Segmenter` 的字素分割和完整的 Unicode 规范化形式；按用户可见字符处理复杂文本时，应按目标环境的实际行为核对。
