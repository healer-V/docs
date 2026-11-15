---
title: "变量、声明与命名"
tags:
  - JavaScript
  - 变量
  - 作用域
  - 严格模式
excerpt: "解释 var、let、const 的作用域与重新赋值规则，说明重复声明、暂时性死区和严格模式下的隐式全局，并给出可复现的作用域观察页与五类声明错误。"
date: 2026-11-15
---

# 变量、声明与命名

变量把值绑定到一个名字上。JavaScript 提供 `var`、`let`、`const` 三种声明方式，它们的作用域、能否重新赋值、能否重复声明各不相同。选错声明方式，变量可能泄漏到块外，或者在声明前访问时得到意外结果。

命名同样受语言规则约束：标识符不能以数字开头，不能使用保留字，不能包含连字符。合法但含义模糊的名字不会报错，却会让后续维护变难。

本篇先比较三种声明的作用域与赋值规则，再说明命名限制和暂时性死区，最后用页面观察块级作用域、常量重新赋值以及严格模式下的隐式全局。

::: info 本篇的范围
本篇讲声明、作用域和命名的基本规则，不展开完整的提升机制、闭包和 `this`。提升与暂时性死区的执行细节见“作用域、提升与暂时性死区”，闭包见“闭包”。
:::

## 一、声明决定变量的作用域

### 1. var 属于函数或全局

`var` 声明的变量属于最近的函数作用域；在函数外声明时属于全局。它不受 `{}` 块限制，在块内声明也会泄漏到块外。

```js
{
  var functionValue = "块外仍可见";
}
console.log(functionValue); // "块外仍可见"
```

### 2. let 与 const 属于块

`let` 和 `const` 声明的变量属于最近的 `{}` 块。块结束后，名字不再可见。块外直接访问会得到 `ReferenceError`；用 `typeof` 检查不存在的名字则返回 `"undefined"`，因为 `typeof` 对未声明的标识符不抛错。

```js
{
  let blockValue = "块内可见";
}
console.log(typeof blockValue); // "undefined"
console.log(blockValue); // ReferenceError
```

### 3. 同一作用域的重复声明

`let` 和 `const` 不允许在同一作用域重复声明同一个名字，重复声明是语法错误，整个脚本不会执行。`var` 允许重复声明，后一次声明不会清空已有的值。

```js
let count = 1;
let count = 2; // SyntaxError: Identifier 'count' has already been declared
```

`var` 与 `let` 混用同名变量也会报错。重复声明检查发生在代码执行之前，因此错误不会留到运行阶段才出现。

## 二、let、const 与 var 的选择

### 1. 默认使用 const

`const` 表示绑定不能重新指向另一个值，而不是值本身不可变。对象和数组用 `const` 声明后，仍然可以修改属性或追加元素。

```js
const list = [];
list.push(1); // 允许
console.log(list); // [1]
list = []; // TypeError: Assignment to constant variable.
```

需要表达“这个绑定不会换值”时用 `const`；它能防止误赋值，也让读者知道后续不需要追踪重新赋值。

### 2. 需要重新赋值时用 let

循环计数、累加器和状态切换需要改变绑定时用 `let`。`const` 声明必须带初始化值，`let` 可以只声明、稍后赋值。

```js
let total = 0;
for (const value of [1, 2, 3]) {
  total += value;
}
console.log(total); // 6
```

### 3. 什么时候还会遇到 var

旧代码、部分浏览器环境和某些历史教程仍使用 `var`。阅读时要记住它的函数作用域和重复声明行为；新代码默认用 `const`，需要重新赋值时用 `let`，不需要为了兼容而主动选择 `var`。

::: tip 从 const 开始
先写 `const`，只有当代码确实需要重新赋值时才改成 `let`。这样声明本身就说明了绑定是否会变化，阅读时不需要逐行查找赋值语句。
:::

## 三、命名规则与可读性

### 1. 合法标识符

标识符首字符可以是字母、下划线或美元符号，后续字符还可以是数字。中文等 Unicode 字母在语法上可用，但团队协作时通常使用英文单词。连字符 `-` 是减号，不能出现在名字中。

```js
const userName = "Ada";
const _cache = new Map();
const $button = document.querySelector("button");
const 总数 = 3; // 语法允许，团队规范通常不采用
```

### 2. 保留字与上下文关键字

保留字不能作为变量名，例如 `class`、`return`、`if`、`new`。`let`、`static`、`yield` 等在某些上下文中也有特殊含义。写错时浏览器给出语法错误，脚本整体不执行。

```js
let class = 1; // SyntaxError: Unexpected token 'class'
```

以数字开头的名字同样非法：

```js
let 1abc = 1; // SyntaxError: Invalid or unexpected token
```

### 3. 命名表达意图

名字应说明值代表什么，而不是它是什么类型。`count`、`totalPrice`、`isVisible` 比 `a`、`data1`、`flag` 更容易判断用途。函数名通常以动词开头，布尔值常用 `is`、`has`、`can` 前缀；这些是团队约定，不是语法要求。

## 四、声明前访问与严格模式

### 1. var 的 undefined

`var` 声明会被提升到作用域顶部，但初始化仍留在原位置。声明前访问得到 `undefined`，不会报错。这种“变量存在但还没有值”的状态容易掩盖顺序错误。

```js
console.log(value); // undefined
var value = 1;
```

### 2. let 与 const 的暂时性死区

`let` 和 `const` 也会被提升，但在初始化之前处于暂时性死区。从进入块到执行声明语句之间，访问该名字会抛出 `ReferenceError`，`typeof` 也一样。

```js
console.log(value); // ReferenceError: Cannot access 'value' before initialization
let value = 1;
```

### 3. 隐式全局与严格模式

非严格模式下，给未声明的名字赋值会创建一个全局变量：

```js
accidental = "非严格模式创建";
console.log(window.accidental); // "非严格模式创建"
```

严格模式下同样的写法抛出 `ReferenceError: strictAccidental is not defined`。`"use strict"` 指令让当前脚本进入严格模式；ES Module 和 `class` 内部默认就是严格模式。模块中的验证结果同样是 `ReferenceError`。

```js
"use strict";
try {
  strictAccidental = "不会成功";
} catch (error) {
  console.log(error.name); // "ReferenceError"
}
```

严格模式不会阻止有意声明的全局变量，只阻止未声明的隐式赋值。需要全局共享时，应显式声明并说明用途，而不是依赖隐式创建。

::: warning 不要依赖隐式全局
隐式全局会污染 `window`，与其他脚本的同名变量冲突，并且在模块中直接报错。看到 `x is not defined` 时，先检查是否漏写 `let`、`const` 或 `var`，而不是关闭严格模式。
:::

## 五、从空目录观察声明行为

### 1. 创建页面

新建空目录 `js-declarations`，创建 `index.html`。页面在一个脚本中观察块级作用域、`const` 重新赋值和非严格模式隐式全局，在第二个严格模式脚本中观察隐式赋值的结果。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>变量声明与作用域观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>变量声明与作用域观察</h1>
  <ol id="output"></ol>
  <script>
    const results = [];
    const record = (text) => results.push(text);

    {
      let blockValue = "块内可见";
      var functionValue = "块外仍可见";
      record("块内 let：" + blockValue);
    }
    record("块外 typeof blockValue：" + typeof blockValue);
    record("块外 var：" + functionValue);

    const fixed = 10;
    try {
      fixed = 20;
    } catch (error) {
      record("重新赋值 const：" + error.name + " - " + error.message);
    }

    accidental = "非严格模式创建";
    record("非严格模式隐式全局：" + window.accidental);
  </script>
  <script>
    "use strict";
    try {
      strictAccidental = "不会成功";
    } catch (error) {
      record("严格模式隐式全局：" + error.name + " - " + error.message);
    }
    record("严格模式后 window.strictAccidental：" + String(window.strictAccidental));

    window.addEventListener("load", () => {
      const output = document.getElementById("output");
      for (const text of results) {
        const item = document.createElement("li");
        item.textContent = text;
        output.append(item);
      }
    });
  </script>
</body>
</html>
```

:::

### 2. 读取结果

直接打开 `index.html`，页面列出七条记录。重点看三组对照：`let` 在块外不可见，`var` 在块外仍可见；`const` 重新赋值抛出 `TypeError`；非严格模式的隐式赋值写入 `window`，严格模式则抛出 `ReferenceError`。

| 观察项 | 本次结果 |
|--------|----------|
| 块内 `let` | 块内可见 |
| 块外 `typeof blockValue` | `undefined` |
| 块外 `var` | 块外仍可见 |
| 重新赋值 `const` | `TypeError - Assignment to constant variable.` |
| 非严格模式隐式全局 | 非严格模式创建 |
| 严格模式隐式全局 | `ReferenceError - strictAccidental is not defined` |
| 严格模式后的全局值 | `undefined` |

### 3. 五类声明错误

分别创建下面的页面或脚本片段，打开后查看 Console：

| 写法 | 本次错误 |
|------|----------|
| `console.log(value); let value = 1;` | `ReferenceError: Cannot access 'value' before initialization` |
| `let count = 1; let count = 2;` | `SyntaxError: Identifier 'count' has already been declared` |
| `const total;` | `SyntaxError: Missing initializer in const declaration` |
| `let 1abc = 1;` | `SyntaxError: Invalid or unexpected token` |
| `let class = 1;` | `SyntaxError: Unexpected token 'class'` |

前三类都与声明规则有关：暂时性死区在运行时报错，重复声明和缺少初始化在解析时报错。后两类是命名错误，整个脚本都不会执行。修复后刷新页面，Console 不再出现对应错误。

## 六、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。`index.html` 的七条记录与观察表一致；五个失败页面分别得到表中错误，页面均未执行后续脚本。模块中的隐式赋值另在 `http://127.0.0.1:8121/` 的模块页面中核对，结果为 `ReferenceError - moduleAccidental is not defined`。

六个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。本文没有验证其他浏览器和旧版本环境，也没有展开 `var` 提升的完整机制；`var` 与 `let` 在循环中的差异、函数声明的提升位置见“作用域、提升与暂时性死区”。
