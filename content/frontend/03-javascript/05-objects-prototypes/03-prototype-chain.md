---
title: "原型链与继承"
tags:
  - JavaScript
  - 原型
  - 原型链
  - 继承
excerpt: "说明每个对象的内置原型、Object.getPrototypeOf 与 Object.create 的用法，解释属性查找如何沿原型链进行、同名属性如何遮蔽、instanceof 如何判断，以及原型共享状态和修改内建原型的风险。"
date: 2026-11-15
---

# 原型链与继承

每个对象都有一个内置原型，读取属性时先找对象自身，找不到就沿原型向上查找，直到 `Object.prototype`，再往上为 `null`。这条路径叫原型链。对象之间因此可以共享方法和默认值，而不必每个实例复制一份。

`Object.create(proto)` 直接指定新对象的原型；构造函数的 `prototype` 属性则是它创建的实例的原型。`instanceof` 沿原型链判断实例是否来自某个构造函数。原型适合放方法，不适合放会被修改的数组或对象，因为所有实例共享同一份。

本篇先说明原型链的查找与终点，再介绍创建继承关系的两种方式，随后列出常见错误，最后用页面核对。

::: info 本篇的范围
本篇讲原型链与属性查找，不展开 `class` 语法、私有字段和混入模式。`class` 与原型的关系见“class 与实例”，属性描述符见“属性描述符、复制与不可变”。
:::

## 一、原型与原型链

### 1. 内置原型与 getPrototypeOf

每个普通对象在创建时都会关联一个原型，对象字面量的原型是 `Object.prototype`。`Object.getPrototypeOf(obj)` 返回这个原型对象；`Object.create` 可以指定任意对象作为原型，形成多层结构。

```js
const base = { type: "基础" };
const middle = Object.create(base);
middle.level = 2;
const leaf = Object.create(middle);
leaf.name = "叶子";
console.log(Object.getPrototypeOf(leaf) === middle); // true
```

### 2. 原型链的终点

`Object.prototype` 的原型是 `null`，这是查找的终点。到达 `null` 仍未找到属性时，读取返回 `undefined`，不会继续查找。所有普通对象最终都连到这条链上，因此都能使用 `toString`、`hasOwnProperty` 等方法。

```js
const base = {};
console.log(Object.getPrototypeOf(base) === Object.prototype); // true
console.log(Object.getPrototypeOf(Object.prototype)); // null
```

### 3. 属性查找与遮蔽

读取属性时先查自有属性，再逐层向上。自有属性与原型属性同名时，自有属性遮蔽原型属性；删除自有属性后，读取回退到原型。给对象赋值只创建或修改自有属性，不会改动原型。

```js
const base = { type: "基础" };
const leaf = Object.create(base);
console.log(leaf.type); // "基础"
leaf.type = "叶子类型";
console.log(leaf.type, base.type); // "叶子类型" "基础"
delete leaf.type;
console.log(leaf.type); // "基础"
```

## 二、创建继承关系

### 1. Object.create 指定原型

`Object.create(proto)` 创建一个新对象，并把参数设为它的原型。新对象自身没有属性，读取时会沿指定原型查找。这适合创建轻量的“基于某个模板”的对象，不需要定义构造函数。

```js
const config = { debug: false };
const custom = Object.create(config);
custom.name = "自定义";
console.log(custom.debug); // false
console.log(Object.hasOwn(custom, "debug")); // false
```

### 2. 构造函数的 prototype

用 `new` 调用构造函数时，新实例的原型是构造函数的 `prototype` 属性。把方法写在 `Person.prototype` 上，所有实例共享同一份函数，而不是每个实例各存一份。实例自身的 `prototype` 属性不存在，只有构造函数才有。

```js
function Person(name) {
  this.name = name;
}
Person.prototype.greet = function () {
  return "你好，" + this.name;
};
const person = new Person("Ada");
console.log(person.greet()); // "你好，Ada"
console.log(typeof person.prototype); // "undefined"
```

### 3. instanceof 的基本判断

`instanceof` 检查构造函数的 `prototype` 是否出现在对象的原型链上。实例对构造函数为 `true`，对所有祖先构造函数也为 `true`；它判断的是原型关系，不是对象自身有哪些属性。

```js
function Person(name) { this.name = name; }
const person = new Person("Ada");
console.log(person instanceof Person); // true
console.log(person instanceof Object); // true
```

## 三、常见错误

### 1. 混淆 prototype 与实例

`Person.prototype` 是实例的原型对象，`person.prototype` 不存在。想访问实例的原型，用 `Object.getPrototypeOf(person)` 或直接调用从原型继承的方法；在实例上写 `.prototype` 通常意味着把两者弄反了。

```js
function Person(name) { this.name = name; }
const person = new Person("Ada");
console.log(typeof Person.prototype); // "object"
console.log(typeof person.prototype); // "undefined"
```

### 2. 原型上的可变共享状态

原型上的数组、对象会被所有实例共享。一个实例修改它，其他实例读到的都是修改后的结果。原型只应放方法或不可变的默认值；每个实例自己的数据应在构造函数中初始化。

```js
function Team() {}
Team.prototype.members = [];
const teamA = new Team();
const teamB = new Team();
teamA.members.push("Ada");
console.log(teamB.members); // ["Ada"]
```

### 3. 修改内建原型

给 `Object.prototype`、`Array.prototype` 添加属性会污染所有对象和数组，可能覆盖同名业务字段，也会让 `for...in` 遍历到额外属性。不要修改内建原型；需要工具函数时定义独立函数或使用静态方法。

```js
Object.prototype.polluted = "yes";
console.log({}.polluted); // "yes"
```

## 四、从空目录观察原型链

### 1. 创建页面

新建空目录 `js-prototypes`，创建 `index.html`。脚本用 `Object.create` 建立三层原型链，观察查找、遮蔽、删除后的回退，并对照构造函数的 `prototype`、`instanceof`、原型共享数组和 `prototype` 误用。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>原型链观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>原型链观察</h1>
  <table id="output">
    <thead><tr><th>表达式</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const base = {
      type: "基础",
      describe() {
        return this.type + "：" + this.name;
      },
    };
    const middle = Object.create(base);
    middle.level = 2;
    const leaf = Object.create(middle);
    leaf.name = "叶子";

    const fallbackType = leaf.type;
    leaf.type = "叶子类型";
    const shadowType = leaf.type;
    delete leaf.type;
    const afterDelete = leaf.type;

    function Person(name) {
      this.name = name;
    }
    Person.prototype.greet = function () {
      return "你好，" + this.name;
    };
    const person = new Person("Ada");

    function Team() {}
    Team.prototype.members = [];
    const teamA = new Team();
    const teamB = new Team();
    teamA.members.push("Ada");

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
      if (value === undefined) return "undefined";
      return JSON.stringify(value);
    }

    const samples = [
      ["leaf.type（添加前）", fallbackType, "沿原型链找到 base"],
      ["leaf.level", leaf.level, "中间层自有属性"],
      ["leaf.describe()", leaf.describe(), "this 指向 leaf"],
      ["leaf.type（遮蔽后）", shadowType, "自有属性遮蔽原型"],
      ["base.type", base.type, "原型未被修改"],
      ["leaf.type（删除后）", afterDelete, "回退到原型"],
      ['"type" in leaf', "type" in leaf, "包含继承属性"],
      ['Object.hasOwn(leaf, "type")', Object.hasOwn(leaf, "type"), "不是自有属性"],
      ["getPrototypeOf(leaf) === middle", Object.getPrototypeOf(leaf) === middle, "上一层"],
      ["getPrototypeOf(middle) === base", Object.getPrototypeOf(middle) === base, "再上一层"],
      ["getPrototypeOf(base) === Object.prototype", Object.getPrototypeOf(base) === Object.prototype, "终点之前的原型"],
      ["getPrototypeOf(Object.prototype)", Object.getPrototypeOf(Object.prototype), "原型链终点"],
      ["person.greet()", person.greet(), "实例读取原型方法"],
      ["getPrototypeOf(person) === Person.prototype", Object.getPrototypeOf(person) === Person.prototype, "实例原型"],
      ["person.constructor === Person", person.constructor === Person, "constructor 来自原型"],
      ["person instanceof Person", person instanceof Person, "基本判断"],
      ["typeof person.prototype", typeof person.prototype, "实例没有 prototype 属性"],
      ["teamB.members", teamB.members, "原型上的数组被共享"],
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

    console.log("leaf.type 初始", fallbackType);
    console.log("describe", leaf.describe());
    console.log("原型链终点", Object.getPrototypeOf(Object.prototype));
    console.log("person instanceof Person", person instanceof Person);
    console.log("teamB.members", JSON.stringify(teamB.members));
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有十八行。`leaf` 通过原型链读到 `base.type`；设置自有 `type` 后遮蔽原型，删除后回退；`getPrototypeOf` 的三层判断与终点 `null` 一致；`Person` 实例的方法来自原型，`person.prototype` 是 `undefined`；`teamB.members` 随 `teamA` 的修改变成 `["Ada"]`。控制台五条输出与表格一致。

| 表达式 | 结果 | 说明 |
|--------|------|------|
| `leaf.type`（添加前） | `"基础"` | 沿原型链找到 `base` |
| `leaf.level` | `2` | 中间层自有属性 |
| `leaf.describe()` | `"基础：叶子"` | `this` 指向 `leaf` |
| `leaf.type`（遮蔽后） | `"叶子类型"` | 自有属性遮蔽原型 |
| `base.type` | `"基础"` | 原型未被修改 |
| `leaf.type`（删除后） | `"基础"` | 回退到原型 |
| `"type" in leaf` | `true` | 包含继承属性 |
| `Object.hasOwn(leaf, "type")` | `false` | 不是自有属性 |
| `getPrototypeOf(leaf) === middle` | `true` | 上一层 |
| `getPrototypeOf(middle) === base` | `true` | 再上一层 |
| `getPrototypeOf(base) === Object.prototype` | `true` | 终点之前的原型 |
| `getPrototypeOf(Object.prototype)` | `null` | 原型链终点 |
| `person.greet()` | `"你好，Ada"` | 实例读取原型方法 |
| `getPrototypeOf(person) === Person.prototype` | `true` | 实例原型 |
| `person.constructor === Person` | `true` | `constructor` 来自原型 |
| `person instanceof Person` | `true` | 基本判断 |
| `typeof person.prototype` | `"undefined"` | 实例没有 `prototype` 属性 |
| `teamB.members` | `["Ada"]` | 原型上的数组被共享 |

### 3. 失败分支

创建 `prototype-confuse.html`，在实例上读取 `.prototype.greet()`。实例没有 `prototype` 属性，访问得到 `undefined`，再调用方法时 Console 显示 `TypeError: Cannot read properties of undefined (reading 'greet')`。修复是直接调用 `person.greet()`，或通过 `Object.getPrototypeOf(person)` 取原型。

创建 `pollute.html`，给 `Object.prototype` 添加属性后读取普通对象和数组的同名属性。控制台分别输出 `yes`、`yes`，`"polluted" in {}` 也是 `true`。这演示了内建原型被污染的后果，实际项目中不要这样写；该页面只在独立文档中打开，不与其他代码共享环境。

## 五、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格十八行与控制台五条输出与正文一致；`prototype-confuse.html` 得到 `TypeError: Cannot read properties of undefined (reading 'greet')`，`pollute.html` 输出 `yes`、`yes` 和 `in` 判断 `true`。三个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有展开 `class` 语法、`Symbol.hasInstance` 的自定义和原型链的性能；修改内建原型的页面仅用于说明风险，不应在生产代码中使用。
