---
title: "this、call/apply/bind 与箭头函数"
tags:
  - JavaScript
  - this
  - call
  - bind
  - 箭头函数
excerpt: "说明 this 在普通调用、方法调用、call/apply、bind 与构造调用中的不同取值，解释严格模式下普通调用为什么是 undefined，以及箭头函数如何捕获外层 this、为什么不能用作构造函数。"
date: 2026-11-15
---

# this、call/apply/bind 与箭头函数

`this` 的值由函数的调用方式决定，而不是由定义位置决定。普通调用在非严格模式下指向全局对象，方法调用指向调用它的对象，`call`、`apply`、`bind` 可以显式指定，`new` 调用创建一个新对象。同一个函数换一种调用方式，`this` 就可能不同。

箭头函数是例外。它没有自己的 `this`，定义时捕获外层作用域的 `this`；它也不能用作构造函数，没有自己的 `arguments`。把箭头函数直接写成对象方法，拿到的不是该对象。

本篇先说明四种调用位置，再介绍显式绑定和构造调用，随后解释箭头函数的差异，最后用页面核对。

::: info 本篇的范围
本篇讲 `this` 的绑定规则，不展开类字段初始化顺序和框架提供的绑定语法。类语法见“class 与实例”，`arguments` 与剩余参数见“参数、默认值与返回值”。
:::

## 一、this 由调用方式决定

### 1. 普通调用

直接以 `函数名()` 调用时，`this` 在非严格模式的经典脚本中指向全局对象。浏览器里的全局对象是 `window`，因此普通函数可以直接读到全局变量。这个默认值容易让函数意外读写全局状态。

```js
function whoAmI() {
  return this === window ? "window" : this.label;
}
console.log(whoAmI()); // "window"
```

### 2. 方法调用

以 `对象.方法()` 调用时，`this` 指向点号左边的对象。方法内部读写 `this` 的属性，实际操作的是该对象。把方法取出来单独调用，调用位置消失，绑定规则随调用方式改变。

```js
const obj = { label: "obj", whoAmI };
console.log(obj.whoAmI()); // "obj"
```

### 3. 严格模式下的普通调用

严格模式不把 `this` 替换成全局对象。普通调用时 `this` 是 `undefined`，在 `this` 上读属性会抛出 `TypeError`。模块代码默认处于严格模式，因此这一行为在现代代码中很常见。

```js
function strictThis() {
  "use strict";
  return this;
}
console.log(strictThis()); // undefined
```

## 二、显式绑定

### 1. call 与 apply

`call` 和 `apply` 都立即调用函数，并把第一个参数指定为 `this`。区别只在后续实参：`call` 逐个传入，`apply` 接收一个数组。它们适合临时改变调用对象，不改动原函数。

```js
const other = { label: "other" };
function greet(greeting) {
  return greeting + "，" + this.label;
}
console.log(greet.call(other, "你好")); // "你好，other"
console.log(greet.apply(other, ["嗨"])); // "嗨，other"
```

### 2. bind 创建绑定函数

`bind` 不调用函数，而是返回一个永久绑定了 `this` 的新函数。原函数不受影响，新函数无论怎样调用，`this` 都是绑定时指定的对象。回调需要固定上下文时使用。

```js
const bound = whoAmI.bind(other);
console.log(bound()); // "other"
console.log(whoAmI.call(obj)); // "obj"，原函数不受影响
```

### 3. 重复 bind 不改变已有绑定

对一个已经绑定的函数再次 `bind`，新函数仍使用第一次绑定的 `this`。绑定时传入的参数也会固定下来，后续调用只能补充其余参数。

```js
const boundAgain = bound.bind(obj);
console.log(boundAgain()); // "other"
```

## 三、构造调用与箭头函数

### 1. new 调用

用 `new` 调用函数时，引擎创建一个新对象，把它作为 `this` 传入函数，函数返回对象以外的东西时返回这个新对象。这就是构造函数创建实例的过程；用 `class` 定义时规则相同。

```js
function Person(name) {
  this.name = name;
}
const person = new Person("Ada");
console.log(person.name); // "Ada"
```

### 2. 箭头函数捕获外层 this

箭头函数没有自己的 `this`，在定义它的位置沿作用域链取外层 `this`，并且之后不再改变。在方法内部定义箭头函数，箭头函数里的 `this` 就是该方法的 `this`，适合作为回调。

```js
const counter = {
  count: 0,
  start() {
    const add = () => { this.count++; };
    add();
    return this.count;
  },
};
console.log(counter.start()); // 1
```

### 3. 箭头函数的限制

箭头函数不能用作构造函数，`new` 一个箭头函数会抛出 `TypeError`；它也没有自己的 `arguments`。把箭头函数直接写成对象方法时，它捕获的是定义位置的外层 `this`，不是该对象，因此方法内部读写不到对象属性。

```js
const arrowObj = {
  label: "arrowObj",
  arrow: () => this.label,
};
console.log(arrowObj.arrow()); // 非严格经典脚本中为 undefined
```

## 四、从空目录观察 this

### 1. 创建页面

新建空目录 `js-this`，创建 `index.html`。脚本把同一个函数分别放在普通调用、方法调用、`call`、`apply`、`bind` 和 `new` 中，并对照严格模式函数、箭头函数属性与箭头函数回调的 `this`，把结果写入表格。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>this 绑定观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>this 绑定观察</h1>
  <table id="output">
    <thead><tr><th>表达式</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    function whoAmI() {
      return this === window ? "window" : this.label;
    }

    function greet(greeting) {
      return greeting + "，" + this.label;
    }

    function strictThis() {
      "use strict";
      return this;
    }

    function Person(name) {
      this.name = name;
    }

    const obj = { label: "obj", whoAmI };
    const other = { label: "other" };
    const boundFirst = whoAmI.bind(other);
    const boundSecond = boundFirst.bind(obj);

    const arrowObj = {
      label: "arrowObj",
      arrow: () => this.tag,
      method() {
        return this.label;
      },
    };

    const counter = {
      count: 0,
      start() {
        const add = () => {
          this.count++;
        };
        add();
        add();
        return this.count;
      },
    };

    const person = new Person("Ada");
    const counterResult = counter.start();

    const samples = [
      ["whoAmI()", whoAmI(), "普通调用，非严格模式指向 window"],
      ["obj.whoAmI()", obj.whoAmI(), "方法调用指向调用对象"],
      ["whoAmI.call(other)", whoAmI.call(other), "call 显式指定"],
      ["greet.call(other, \"你好\")", greet.call(other, "你好"), "call 逐个传参"],
      ["greet.apply(obj, [\"嗨\"])", greet.apply(obj, ["嗨"]), "apply 用数组传参"],
      ["boundFirst()", boundFirst(), "bind 绑定 other"],
      ["boundSecond()", boundSecond(), "再次 bind 不改变已有绑定"],
      ["new Person(\"Ada\").name", person.name, "构造调用创建实例"],
      ["strictThis()", strictThis(), "严格模式下普通调用为 undefined"],
      ["arrowObj.arrow()", arrowObj.arrow(), "箭头函数不绑定调用对象"],
      ["arrowObj.method()", arrowObj.method(), "普通方法指向对象"],
      ["counter.start()", counterResult, "箭头函数继承外层 this"],
    ];

    const body = document.querySelector("#output tbody");
    for (const [label, value, extra] of samples) {
      const row = document.createElement("tr");
      for (const text of [label, value === undefined ? "undefined" : String(value), extra]) {
        const cell = document.createElement("td");
        cell.textContent = text;
        row.append(cell);
      }
      body.append(row);
    }

    console.log("whoAmI()", whoAmI());
    console.log("whoAmI.call(other)", whoAmI.call(other));
    console.log("boundSecond()", boundSecond());
    console.log("counter.start()", counterResult);
    console.log("person.name", person.name);
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有十二行。普通调用返回 `window`，方法调用返回对象标签；`call`、`apply` 和 `bind` 都得到 `other` 或 `obj`；再次 `bind` 仍为 `other`；构造调用得到实例的 `name`；严格模式的普通调用为 `undefined`；箭头函数属性读到 `undefined`，普通方法读取 `arrowObj`；方法内的箭头回调累加两次得到 `2`。控制台五条输出与表格一致。

| 表达式 | 结果 | 说明 |
|--------|------|------|
| `whoAmI()` | `window` | 普通调用，非严格模式指向 `window` |
| `obj.whoAmI()` | `obj` | 方法调用指向调用对象 |
| `whoAmI.call(other)` | `other` | `call` 显式指定 |
| `greet.call(other, "你好")` | `你好，other` | `call` 逐个传参 |
| `greet.apply(obj, ["嗨"])` | `嗨，obj` | `apply` 用数组传参 |
| `boundFirst()` | `other` | `bind` 绑定 `other` |
| `boundSecond()` | `other` | 再次 `bind` 不改变已有绑定 |
| `new Person("Ada").name` | `Ada` | 构造调用创建实例 |
| `strictThis()` | `undefined` | 严格模式下普通调用为 `undefined` |
| `arrowObj.arrow()` | `undefined` | 箭头函数不绑定调用对象 |
| `arrowObj.method()` | `arrowObj` | 普通方法指向对象 |
| `counter.start()` | `2` | 箭头函数继承外层 `this` |

### 3. 失败分支

创建 `callback-this.html`，把对象方法赋给变量后单独调用。调用位置不再是对象，严格模式下 `this` 为 `undefined`，Console 显示 `TypeError: Cannot read properties of undefined (reading 'count')`。修复是用 `bind` 固定上下文，或把调用写成 `counter.increment()`。

创建 `arrow-method.html`，在严格模式的函数里返回一个用箭头函数做 `increment` 的对象。箭头函数捕获的是外层函数的 `this`，普通调用该外层函数时它是 `undefined`，因此调用 `increment()` 得到同样的 `TypeError`。对象方法应使用普通方法简写，需要回调时再在方法内部定义箭头函数。

## 五、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格十二行与控制台五条输出与正文一致；`callback-this.html` 与 `arrow-method.html` 均得到 `TypeError: Cannot read properties of undefined (reading 'count')`。三个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有展开类的字段初始化、事件监听中的 `this`、`bind` 固定参数的完整规则和框架的绑定语法；`this` 的表现依赖严格模式与调用方式，迁移代码时应逐项核对。
