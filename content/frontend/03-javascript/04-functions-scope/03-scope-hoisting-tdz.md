---
title: "作用域、提升与暂时性死区"
tags:
  - JavaScript
  - 作用域
  - 提升
  - 暂时性死区
excerpt: "区分全局、函数与块级作用域，解释作用域链如何由内向外查找、同名变量如何遮蔽，说明 var 与函数声明的提升、let/const 的暂时性死区以及严格模式下块内函数声明的差异。"
date: 2026-11-15
---

# 作用域、提升与暂时性死区

作用域决定一个变量在哪些位置可以被访问。JavaScript 有全局作用域、函数作用域和块级作用域：`var` 属于函数作用域，`let`、`const` 属于块级作用域。函数内部可以读取外层变量，外层不能读取内层变量，查找顺序沿作用域链由内向外。

声明在代码执行前会先被处理，这叫提升。`var` 提升后初始化为 `undefined`，函数声明整体提升，可以在声明前调用；`let` 和 `const` 也会被提升，但在声明执行前处于暂时性死区，访问会抛出 `ReferenceError`。

本篇先区分三种作用域，再解释作用域链与遮蔽，随后说明提升和暂时性死区，最后用页面核对。

::: info 本篇的范围
本篇讲标识符的可见性与声明时机，不展开闭包、`this` 绑定和执行上下文的内部结构。闭包见“闭包”，`this` 见“this、call/apply/bind 与箭头函数”。
:::

## 一、作用域的种类

### 1. 全局作用域

脚本最外层声明的变量在整个脚本中可见。浏览器中顶层 `var` 和函数声明会成为全局对象的属性，顶层 `let`、`const` 不会；无论哪种，后续代码都可以直接按名字访问。全局变量应尽量少用，避免不同脚本之间互相覆盖。

```js
var siteName = "示例站点";
let version = 1;
function readConfig() {
  return siteName + " v" + version;
}
console.log(readConfig()); // "示例站点 v1"
```

### 2. 函数作用域

函数内部声明的变量只在函数内可见。用 `var` 在函数内的任何位置声明，都只作用于整个函数，不受块限制；函数执行结束后，这些局部变量通常不再可访问。

```js
function run() {
  var message = "函数内";
  return message;
}
console.log(run()); // "函数内"
console.log(typeof message); // "undefined"
```

### 3. 块级作用域

花括号形成的块（`if`、`for`、单独的 `{}`）内用 `let`、`const` 声明的变量只在该块内可见。`var` 不受块限制，会泄漏到外层函数或全局。用 `let` 可以避免循环变量和临时变量污染外层。

```js
{
  let block = "块内";
  var leaked = "var 不受块限制";
  console.log(block); // "块内"
}
console.log(typeof block); // "undefined"
console.log(leaked); // "var 不受块限制"
```

## 二、作用域链与遮蔽

### 1. 由内向外查找

函数内部访问一个变量时，先在自己的作用域找，找不到再到外层函数，最后到全局。这条查找路径叫作用域链。链在函数定义时就确定，与调用位置无关。

```js
const outer = "外";
function chain() {
  const inner = "内";
  return outer + "-" + inner;
}
console.log(chain()); // "外-内"
```

### 2. 同名变量遮蔽

内层作用域声明与外层同名的变量时，内层变量遮蔽外层变量。内层代码访问到的是内层变量，外层变量本身不变；内层作用域结束后，外层名字恢复为原来的绑定。

```js
const name = "外层";
function show() {
  const name = "内层";
  return name;
}
console.log(show()); // "内层"
console.log(name); // "外层"
```

### 3. 赋值不会创建新绑定

在函数内给一个未声明的名字赋值，非严格模式下会创建全局变量；严格模式下抛出 `ReferenceError`。需要局部变量时先声明，不要依赖隐式创建。

```js
function assign() {
  "use strict";
  implicit = 1; // ReferenceError: implicit is not defined
}
```

## 三、提升与暂时性死区

### 1. var 提升为 undefined

`var` 声明会提升到所在函数或全局作用域的顶部，但赋值留在原位置。因此在声明语句之前访问，得到 `undefined` 而不是报错。这种“可以先访问后赋值”的行为容易掩盖错误。

```js
console.log(typeof hoisted); // "undefined"
var hoisted = 1;
```

### 2. 函数声明整体提升

函数声明会连同函数体一起提升，可以在声明位置之前调用。函数表达式只提升变量声明，赋值仍然按顺序执行，所以提前调用会报错。

```js
console.log(declared()); // "声明提升"
function declared() {
  return "声明提升";
}
```

### 3. let 与 const 的暂时性死区

`let` 和 `const` 也会被提升，但在声明执行前处于暂时性死区。从进入作用域到声明语句执行之间，访问该变量会抛出 `ReferenceError`，`typeof` 也不例外。这与未声明标识符不同：对未声明标识符使用 `typeof` 返回 `"undefined"`。

```js
try {
  console.log(value);
} catch (error) {
  console.log(error.name); // "ReferenceError"
}
let value = 1;
```

### 4. 块内函数声明的严格模式差异

非严格模式下，浏览器为兼容旧代码，把块内函数声明提升到外层函数或全局作用域（规范附录 B 的行为）；严格模式下，块内函数声明按块级作用域处理，块外不可访问。

```js
if (true) {
  function blockFn() { return "块内函数"; }
}
console.log(typeof blockFn); // 非严格模式："function"
```

在严格模式脚本中，同样的代码在块外调用 `blockFn()` 会得到 `ReferenceError: blockFn is not defined`。新代码应显式使用 `let`/`const` 保存函数，避免依赖这种差异。

## 四、从空目录观察作用域

### 1. 创建页面

新建空目录 `js-scope`，创建 `index.html`。脚本在赋值前读取 `var` 变量、在声明前调用函数、在暂时性死区中访问 `let`，并对照 `var` 与 `let` 的块级行为、作用域链、遮蔽和块内函数声明。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>作用域与提升观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>作用域与提升观察</h1>
  <table id="output">
    <thead><tr><th>表达式</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    let tdzMessage = "未触发";
    try {
      console.log(tdzValue);
    } catch (error) {
      tdzMessage = error.name + ": " + error.message;
    }
    let tdzValue = 1;

    var outerVar = "外";

    function declared() {
      return "声明提升";
    }

    function varScope() {
      if (true) {
        var inner = "var 在块内";
      }
      return inner;
    }

    function letScope() {
      if (true) {
        let inner = "let 在块内";
      }
      return typeof inner;
    }

    const name = "外层";

    function showShadow() {
      const name = "内层";
      return name;
    }

    function chain() {
      const innerVar = "内";
      return outerVar + "-" + innerVar;
    }

    if (true) {
      function blockFn() {
        return "块内函数";
      }
    }

    const varTypeBefore = typeof varHoisted;
    const samples = [
      ["varHoisted 赋值前", varTypeBefore, "声明提升为 undefined"],
      ["declared() 声明前调用", declared(), "函数声明整体提升"],
      ["tdzValue 声明前访问", tdzMessage, "暂时性死区"],
      ["varScope()", varScope(), "var 不受块限制"],
      ["letScope()", letScope(), "let 块外不可访问"],
      ["chain()", chain(), "作用域链读取外层变量"],
      ["showShadow()", showShadow(), "内层同名变量遮蔽外层"],
      ["name（外层）", name, "外层变量未被修改"],
      ["typeof blockFn", typeof blockFn, "非严格模式块内函数"],
    ];

    var varHoisted = "已赋值";

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

    console.log("varHoisted 赋值前", varTypeBefore);
    console.log("declared()", declared());
    console.log("TDZ", tdzMessage);
    console.log("varScope()", varScope());
    console.log("blockFn()", typeof blockFn === "function" ? blockFn() : "不可调用");
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有九行。赋值前的 `varHoisted` 类型是 `undefined`；声明前的 `declared()` 正常返回；暂时性死区一行记录 `ReferenceError`；`varScope()` 能读到块内的 `var`，`letScope()` 得到 `undefined`；作用域链返回 `外-内`；遮蔽后外层仍是 `外层`；非严格模式下 `typeof blockFn` 为 `function`。控制台五条输出与表格一致。

| 表达式 | 结果 | 说明 |
|--------|------|------|
| `varHoisted` 赋值前 | `undefined` | 声明提升为 `undefined` |
| `declared()` 声明前调用 | `声明提升` | 函数声明整体提升 |
| `tdzValue` 声明前访问 | `ReferenceError: Cannot access 'tdzValue' before initialization` | 暂时性死区 |
| `varScope()` | `var 在块内` | `var` 不受块限制 |
| `letScope()` | `undefined` | `let` 块外不可访问 |
| `chain()` | `外-内` | 作用域链读取外层变量 |
| `showShadow()` | `内层` | 内层同名变量遮蔽外层 |
| `name`（外层） | `外层` | 外层变量未被修改 |
| `typeof blockFn` | `function` | 非严格模式块内函数 |

### 3. 失败分支

创建 `strict-block.html`，在脚本开头写 `"use strict"`，再在 `if` 块中声明函数，块外调用。严格模式下函数只在块内可见，Console 显示 `ReferenceError: blockFn is not defined`。修复是把函数声明移到块外，或在块外先用 `let` 声明并赋值。

另一个常见错误是认为 `let` 也会像 `var` 一样初始化为 `undefined`。在声明前读取 `let` 变量会直接抛错，`typeof` 也会抛错；需要先声明再使用，把声明放在作用域开头。

## 五、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格九行与控制台五条输出与正文一致；`strict-block.html` 得到 `ReferenceError: blockFn is not defined`。两个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有展开闭包、模块顶层作用域和 `eval` 对作用域的影响；块内函数声明的非严格模式行为属于兼容旧代码的规范附录，不应在新代码中依赖。
