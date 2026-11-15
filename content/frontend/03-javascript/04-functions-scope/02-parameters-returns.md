---
title: "参数、默认值与返回值"
tags:
  - JavaScript
  - 函数参数
  - 默认参数
  - 剩余参数
excerpt: "说明形参与实参的绑定、默认参数为什么只对 undefined 生效、剩余参数与 arguments 的差异，以及没有 return 时的结果、返回对象做链式调用和对象参数共享引用的观察。"
date: 2026-11-15
---

# 参数、默认值与返回值

调用函数时，实参按位置绑定到形参。多传的参数不会报错，少传的参数得到 `undefined`。默认参数只在对应位置是 `undefined` 时启用，传入 `null`、`0` 或空字符串都不会触发默认值。

剩余参数 `...rest` 把多余实参收集成真正的数组；`arguments` 是函数内部的历史遗留对象，类数组但不是数组，箭头函数中不存在。函数没有显式 `return` 时返回 `undefined`，返回对象可以继续调用方法形成链式写法。

本篇先说明参数绑定和默认值，再对比剩余参数与 `arguments`，随后介绍返回值和引用传递，最后用页面核对结果。

::: info 本篇的范围
本篇讲函数参数与返回值，不展开闭包、`this` 绑定和柯里化设计模式。参数中传入对象后的共享问题见“对象与数组的初步使用”，`this` 见“this、call/apply/bind 与箭头函数”。
:::

## 一、形参与实参

### 1. 按位置绑定

函数定义中的参数叫形参，调用时传入的值叫实参。实参按顺序绑定：第一个实参给第一个形参，第二个给第二个，依此类推。形参在函数内部相当于用 `let` 声明的局部变量。

```js
function introduce(name, age) {
  return name + " 今年 " + age + " 岁";
}
console.log(introduce("Ada", 30)); // "Ada 今年 30 岁"
```

### 2. 数量不一致

实参少于形参时，未传的形参是 `undefined`；实参多于形参时，多出的值不会报错，只是没有对应的形参接收。需要收集多余实参时使用剩余参数。

```js
function show(name, age) {
  return name + "/" + age;
}
console.log(show("Ada")); // "Ada/undefined"
console.log(show("Ada", 30, "多余")); // "Ada/30"
```

### 3. 参数是局部绑定

形参是函数内部的局部变量。给形参重新赋值只改变这个局部绑定，不影响调用方的变量；但如果形参接收的是对象，通过形参修改属性会作用到同一个对象上。

```js
function replace(user) {
  user = { name: "Grace" };
  return user.name;
}
const bob = { name: "Ada" };
replace(bob);
console.log(bob.name); // "Ada"
```

## 二、默认值与剩余参数

### 1. 默认参数只对 undefined 生效

形参后面写 `= 默认值`，当对应实参是 `undefined` 或没有传时使用默认值。显式传入 `undefined` 与不传效果相同；传入 `null` 不会触发默认值，因为 `null` 不是 `undefined`。

```js
function greet(name = "访客") {
  return "你好，" + name;
}
console.log(greet()); // "你好，访客"
console.log(greet(undefined)); // "你好，访客"
console.log(greet(null)); // "你好，null"
```

### 2. 剩余参数收集为数组

形参列表最后写 `...numbers`，所有多余实参收集成一个真正的数组，可以直接使用 `length` 和循环。剩余参数只能有一个，且必须放在最后。

```js
function sum(...numbers) {
  let total = 0;
  for (const n of numbers) total += n;
  return total;
}
console.log(sum()); // 0
console.log(sum(1, 2, 3)); // 6
```

### 3. arguments 的边界

`arguments` 是普通函数内部可用的类数组对象，保存本次调用的全部实参。它有 `length` 和下标，但不是数组，没有 `map`、`filter` 等方法；箭头函数没有自己的 `arguments`，在箭头函数中引用它会沿作用域向外查找，通常得到未定义错误。新代码优先使用剩余参数。

```js
function legacy() {
  return arguments.length + ":" + [...arguments].join(",");
}
console.log(legacy(1, 2, 3)); // "3:1,2,3"
```

## 三、返回值

### 1. 没有 return 得到 undefined

函数执行到末尾没有 `return`，或者 `return` 后没有表达式，调用结果都是 `undefined`。`return` 会立即结束函数，后面的语句不执行。只执行副作用、不需要结果的函数可以省略返回值。

```js
function noReturn() {}
function early(value) {
  if (value < 0) return;
  return value * 2;
}
console.log(noReturn()); // undefined
console.log(early(-1)); // undefined
console.log(early(3)); // 6
```

### 2. 返回对象与链式调用

函数可以返回对象，对象的方法再返回同一个对象，就能连续调用。链式调用的前提是每一步都返回可继续调用的对象，而不是 `undefined`。

```js
function makeBuilder() {
  const parts = [];
  const builder = {
    add(part) { parts.push(part); return builder; },
    result() { return parts.join("-"); },
  };
  return builder;
}
console.log(makeBuilder().add("a").add("b").result()); // "a-b"
```

### 3. 引用传递与重新赋值

对象实参传入函数后，形参与外部变量指向同一个对象，修改属性会互相可见。给形参重新赋一个新对象，只是让形参指向别处，外部变量仍指向原对象。需要避免修改调用方数据时，在函数内先复制再改。

```js
function rename(user) {
  user.name = "Grace";
}
const alice = { name: "Ada" };
rename(alice);
console.log(alice.name); // "Grace"
```

## 四、从空目录观察参数与返回值

### 1. 创建页面

新建空目录 `js-parameters`，创建 `index.html`。脚本用不同数量实参调用同一组函数，收集默认参数、剩余参数、`arguments`、返回值、链式调用和对象引用的结果，并写入表格。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>参数与返回值观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>参数与返回值观察</h1>
  <table id="output">
    <thead><tr><th>表达式</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    function greet(name = "访客", greeting = "你好") {
      return greeting + "，" + name;
    }

    function sum(...numbers) {
      let total = 0;
      for (const n of numbers) total += n;
      return total;
    }

    function legacy() {
      return arguments.length + ":" + [...arguments].join(",");
    }

    function show(a, ...rest) {
      return JSON.stringify({ a, rest, argCount: arguments.length });
    }

    function noReturn() {}

    function makePoint(x, y) {
      return { x, y };
    }

    function makeBuilder() {
      const parts = [];
      const builder = {
        add(part) {
          parts.push(part);
          return builder;
        },
        result() {
          return parts.join("-");
        },
      };
      return builder;
    }

    function rename(user) {
      user.name = "Grace";
    }

    function replace(user) {
      user = { name: "Grace" };
    }

    const alice = { name: "Ada" };
    rename(alice);
    const bob = { name: "Ada" };
    replace(bob);

    function showValue(value) {
      if (typeof value === "string") return JSON.stringify(value);
      if (value === undefined) return "undefined";
      return JSON.stringify(value);
    }

    const samples = [
      ["greet()", greet(), "两个参数都用默认值"],
      ["greet(\"Ada\")", greet("Ada"), "第二个参数用默认值"],
      ["greet(\"Ada\", \"嗨\")", greet("Ada", "嗨"), "两个参数都传入"],
      ["greet(null)", greet(null), "默认值对 null 不生效"],
      ["sum()", sum(), "没有参数，得到 0"],
      ["sum(1, 2, 3)", sum(1, 2, 3), "剩余参数收集为数组"],
      ["legacy(1, 2, 3)", legacy(1, 2, 3), "arguments 是类数组"],
      ["show(1, 2, 3)", show(1, 2, 3), "剩余参数与 arguments 同时存在"],
      ["noReturn()", noReturn(), "没有 return 得到 undefined"],
      ["makePoint(1, 2)", makePoint(1, 2), "返回对象"],
      ["makeBuilder().add(\"a\").add(\"b\").result()", makeBuilder().add("a").add("b").result(), "链式调用"],
      ["rename(alice) 后 alice.name", alice.name, "参数共享引用"],
      ["replace(bob) 后 bob.name", bob.name, "重新赋值不影响外部"],
    ];

    const body = document.querySelector("#output tbody");
    for (const [label, value, extra] of samples) {
      const row = document.createElement("tr");
      for (const text of [label, showValue(value), extra]) {
        const cell = document.createElement("td");
        cell.textContent = text;
        row.append(cell);
      }
      body.append(row);
    }

    console.log("greet()", greet());
    console.log("greet(null)", greet(null));
    console.log("sum(1, 2, 3)", sum(1, 2, 3));
    console.log("legacy", legacy(1, 2, 3));
    console.log("alice.name", alice.name, "bob.name", bob.name);
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有十三行。默认参数在前四行验证：不传和传 `null` 的结果不同；`sum()` 返回 `0`；`legacy(1, 2, 3)` 得到 `"3:1,2,3"`；`show(1, 2, 3)` 同时显示剩余参数数组和 `arguments.length`；`noReturn()` 为 `undefined`；链式调用得到 `"a-b"`；`rename` 修改了 `alice`，`replace` 没有修改 `bob`。控制台五条输出与表格一致。

| 表达式 | 结果 | 说明 |
|--------|------|------|
| `greet()` | `"你好，访客"` | 两个参数都用默认值 |
| `greet("Ada")` | `"你好，Ada"` | 第二个参数用默认值 |
| `greet("Ada", "嗨")` | `"嗨，Ada"` | 两个参数都传入 |
| `greet(null)` | `"你好，null"` | 默认值对 `null` 不生效 |
| `sum()` | `0` | 没有参数，得到 `0` |
| `sum(1, 2, 3)` | `6` | 剩余参数收集为数组 |
| `legacy(1, 2, 3)` | `"3:1,2,3"` | `arguments` 是类数组 |
| `show(1, 2, 3)` | `{"a":1,"rest":[2,3],"argCount":3}` | 显示为带引号的字符串 |
| `noReturn()` | `undefined` | 没有 `return` 得到 `undefined` |
| `makePoint(1, 2)` | `{"x":1,"y":2}` | 返回对象 |
| `makeBuilder().add("a").add("b").result()` | `"a-b"` | 链式调用 |
| `rename(alice)` 后 `alice.name` | `"Grace"` | 参数共享引用 |
| `replace(bob)` 后 `bob.name` | `"Ada"` | 重新赋值不影响外部 |

### 3. 失败分支

创建 `arrow-arguments.html`，在箭头函数中读取 `arguments`。箭头函数没有自己的 `arguments`，Console 显示 `ReferenceError: arguments is not defined`。需要在箭头函数中处理全部实参时，改用剩余参数 `(...args)`。

剩余参数与 `arguments` 混用时，两者来源不同：`arguments` 包含本次调用的全部实参，剩余参数只包含对应位置之后的部分。页面中的 `show(1, 2, 3)` 一行已经给出对照，新代码只保留其中一种写法。

## 五、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格十三行与控制台五条输出与正文一致；`arrow-arguments.html` 得到 `ReferenceError: arguments is not defined`。两个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有展开参数默认值的求值顺序、`Function.prototype.length` 的完整规则和柯里化；严格模式下的 `arguments` 行为与参数默认值组合另有细节，需要时按目标环境核对。
