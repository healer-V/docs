---
title: "函数声明、表达式与调用"
tags:
  - JavaScript
  - 函数
  - 箭头函数
  - 回调
excerpt: "说明函数声明、函数表达式、箭头函数与方法简写的形式差异，解释函数为什么也是对象、函数名如何推断、调用和回调如何传递函数，并给出可复现的函数形式观察页。"
date: 2026-11-15
---

# 函数声明、表达式与调用

函数把一段可复用的逻辑包装起来，调用时传入参数、取回结果。JavaScript 有多种定义形式：函数声明、函数表达式、箭头函数和对象方法简写。它们都能调用，但在提升时机、`this` 绑定和能否作为构造函数上有区别。

函数也是对象，可以赋给变量、作为参数传给另一个函数、作为返回值。把函数作为参数传入，是回调和事件处理的基础。函数名不是必需的，但有了名字，错误堆栈和调试信息更容易读懂。

本篇先介绍三种基本写法和方法简写，再解释函数名、函数对象和调用方式，最后用页面核对结果。

::: info 本篇的范围
本篇讲函数的定义形式与调用，不展开参数默认值、剩余参数、作用域、闭包和 `this` 绑定。这些内容分别见后续文章；箭头函数与 `this` 的关系见“this、call/apply/bind 与箭头函数”。
:::

## 一、函数的三种写法

### 1. 函数声明

`function` 关键字加函数名构成函数声明。它以语句形式出现，可以在声明位置之前调用，因为声明会在代码执行前先建立。函数体用 `return` 返回结果，没有 `return` 时得到 `undefined`。

```js
function add(a, b) {
  return a + b;
}
console.log(add(2, 3)); // 5
```

### 2. 函数表达式

把匿名或具名函数赋给变量，就是函数表达式。函数在赋值语句执行后才可用，在赋值之前调用会报错。变量声明方式决定错误类型：`const` 得到 `ReferenceError`，`var` 得到 `TypeError`。

```js
const add = function (a, b) {
  return a + b;
};
console.log(add(2, 3)); // 5
```

### 3. 箭头函数

箭头函数用 `=>` 定义，适合短小的回调和单表达式计算。只有一个表达式时可以省略花括号和 `return`；返回对象字面量时要用括号包住，否则花括号会被当成函数体。

```js
const add = (a, b) => a + b;
const makeUser = (name) => ({ name });
console.log(add(2, 3)); // 5
console.log(makeUser("Ada")); // { name: "Ada" }
```

## 二、方法简写与函数对象

### 1. 对象方法简写

对象字面量中的方法可以省略 `function` 关键字和冒号，直接写方法名和参数列表。简写方法仍然是函数，调用时用 `对象.方法()` 的形式。

```js
const calculator = {
  add(a, b) {
    return a + b;
  },
};
console.log(calculator.add(4, 5)); // 9
```

### 2. 函数名的推断

函数声明的名字就是函数名。函数表达式和箭头函数如果直接赋给变量，运行时会把变量名推断为函数名；直接写匿名函数再调用，名字是空字符串。名字用于错误堆栈和调试，不影响调用结果。

```js
const fn = function () {};
const arrow = () => {};
console.log(fn.name); // "fn"
console.log(arrow.name); // "arrow"
console.log((() => 1).name); // ""
```

### 3. 函数也是对象

`typeof` 对函数返回 `"function"`，但函数可以像对象一样拥有属性，也可以赋给变量或放进数组。这一点让函数能作为数据传递，而不只是被直接调用。

```js
function greet(name) {
  return "你好，" + name;
}
const actions = [greet];
console.log(typeof greet); // "function"
console.log(actions[0]("Ada")); // "你好，Ada"
```

## 三、调用与回调

### 1. 调用表达式

函数名后加括号即调用，括号内是实参。调用时把实参按位置绑定到形参，执行函数体，遇到 `return` 返回结果。同一个函数可以用不同参数调用任意次，每次调用互不影响局部变量。

```js
function double(n) {
  return n * 2;
}
console.log(double(3)); // 6
console.log(double(10)); // 20
```

### 2. 把函数作为参数

函数可以作为实参传给另一个函数。接收方在需要时调用它，这种函数参数通常叫回调。回调让调用方决定“做什么”，接收方只负责“什么时候做”。

```js
function calculate(operation, a, b) {
  return operation(a, b);
}
console.log(calculate((a, b) => a * b, 3, 4)); // 12
```

### 3. 回调的上下文问题

把对象方法直接作为回调传递，会失去原来的调用位置，方法内部的 `this` 不再指向原对象。这个问题与 `this` 的绑定规则有关，本篇不展开，详见“this、call/apply/bind 与箭头函数”。在此之前，回调优先使用不依赖 `this` 的函数。

## 四、从空目录观察函数

### 1. 创建页面

新建空目录 `js-functions`，创建 `index.html`。脚本用同一加法分别写成函数声明、函数表达式、箭头函数和方法简写，再把函数作为参数传入另一个函数，并把调用结果和函数名写入表格。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>函数形式与调用观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>函数形式与调用观察</h1>
  <table id="output">
    <thead><tr><th>表达式</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    function addDeclaration(a, b) {
      return a + b;
    }

    const addExpression = function (a, b) {
      return a + b;
    };

    const addArrow = (a, b) => a + b;

    const calculator = {
      add(a, b) {
        return a + b;
      },
    };

    function calculate(operation, a, b) {
      return operation(a, b);
    }

    const samples = [
      ["addDeclaration(2, 3)", addDeclaration(2, 3), "函数声明"],
      ["addExpression(2, 3)", addExpression(2, 3), "函数表达式"],
      ["addArrow(2, 3)", addArrow(2, 3), "箭头函数"],
      ["calculator.add(4, 5)", calculator.add(4, 5), "方法简写"],
      ["calculate(addArrow, 2, 3)", calculate(addArrow, 2, 3), "函数作为参数"],
      ["typeof addArrow", typeof addArrow, "函数也是对象"],
      ["addDeclaration.name", addDeclaration.name, "声明带名字"],
      ["addExpression.name", addExpression.name, "变量名被推断为函数名"],
      ["addArrow.name", addArrow.name, "同上"],
      ["(() => 1).name", (() => 1).name, "匿名函数没有推断名"],
    ];

    const body = document.querySelector("#output tbody");
    for (const [label, value, extra] of samples) {
      const row = document.createElement("tr");
      for (const text of [label, show(value), extra]) {
        const cell = document.createElement("td");
        cell.textContent = text;
        row.append(cell);
      }
      body.append(row);
    }

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
      return String(value);
    }

    console.log("三种写法结果", addDeclaration(2, 3), addExpression(2, 3), addArrow(2, 3));
    console.log("作为参数传入", calculate(addDeclaration, 10, 20));
    console.log("typeof 函数", typeof addArrow);
    console.log("函数名", addDeclaration.name, addExpression.name, addArrow.name);
    console.log("匿名函数名", JSON.stringify((() => 1).name));
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有十行。前五行分别验证三种写法和方法简写，结果都是参数之和；`typeof` 一行显示 `"function"`；三个具名函数的 `name` 与变量名一致；直接写的匿名箭头函数名为空字符串。控制台应显示三次加法结果均为 `5`、作为参数传入得到 `30`、`typeof` 为 `function`、三个函数名，以及匿名函数名为 `""`。

| 表达式 | 结果 | 说明 |
|--------|------|------|
| `addDeclaration(2, 3)` | `5` | 函数声明 |
| `addExpression(2, 3)` | `5` | 函数表达式 |
| `addArrow(2, 3)` | `5` | 箭头函数 |
| `calculator.add(4, 5)` | `9` | 方法简写 |
| `calculate(addArrow, 2, 3)` | `5` | 函数作为参数 |
| `typeof addArrow` | `"function"` | 函数也是对象 |
| `addDeclaration.name` | `"addDeclaration"` | 声明带名字 |
| `addExpression.name` | `"addExpression"` | 变量名被推断为函数名 |
| `addArrow.name` | `"addArrow"` | 同上 |
| `(() => 1).name` | `""` | 匿名函数没有推断名 |

### 3. 失败分支

创建 `call-before-expression.html`，在函数表达式赋值之前调用它。`const add` 处于暂时性死区，Console 显示 `ReferenceError: Cannot access 'add' before initialization`。需要提前调用时，改用函数声明，或把调用移到赋值之后。

创建 `arrow-new.html`，对箭头函数使用 `new`。箭头函数没有自己的构造行为，Console 显示 `TypeError: add is not a constructor`。需要构造实例时使用普通函数或 `class`，这部分见“class 与实例”。

事件回调中把方法直接传出而丢失上下文，也是常见问题。它属于 `this` 绑定，本篇不演示，留到“this、call/apply/bind 与箭头函数”核对。

## 五、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格十行与控制台五条输出与正文一致；`call-before-expression.html` 得到 `ReferenceError: Cannot access 'add' before initialization`，`arrow-new.html` 得到 `TypeError: add is not a constructor`。三个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有展开函数提升的完整过程、参数传递、闭包和 `this` 绑定；这些内容在后续文章分别核对。
