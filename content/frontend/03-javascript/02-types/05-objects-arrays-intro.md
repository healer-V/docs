---
title: "对象与数组的初步使用"
tags:
  - JavaScript
  - 对象
  - 数组
  - 引用
excerpt: "说明对象字面量的键值结构、点访问与方括号访问、嵌套对象和数组的索引与 length，解释对象赋值为什么共享引用、展开复制为什么只复制顶层，并给出可复现的观察页。"
date: 2026-11-15
---

# 对象与数组的初步使用

对象和数组用来组织一组相关的值。对象用键值对描述一个事物，数组用带下标的序列保存一组同类的值。两者都是对象，都可以嵌套，也都可以通过字面量直接创建。

对象变量保存的是引用，不是对象本身。把一个对象赋给另一个变量，两个变量指向同一份数据；用展开运算符复制，只复制顶层属性，嵌套对象仍然共享。理解这一点，才能解释“我只改了副本，原对象怎么变了”。

本篇先介绍对象和数组字面量及访问方式，再说明引用与浅复制，最后用页面核对读取和修改结果。

::: info 本篇的范围
本篇讲对象与数组的基本组织方式，不展开构造函数、属性描述符、原型链和数组的迭代方法。原型见“原型链与继承”，`map`、`filter` 等方法见“数组方法”。
:::

## 一、对象字面量

### 1. 键与值

对象用花括号创建，内部是逗号分隔的键值对。键在字面量中可以不加引号，但最终都是字符串；值可以是任意类型，包括另一个对象或数组。读取方式有点访问和方括号访问两种。

```js
const user = { id: 1, name: "Ada", active: true };
console.log(user.name); // "Ada"
console.log(user["name"]); // "Ada"
```

### 2. 点访问与方括号访问

点访问要求键名是合法的标识符，写法短；方括号接受字符串表达式，适合键名在运行时才确定的情况。两种写法读取的是同一个属性。

```js
const key = "name";
console.log(user[key]); // "Ada"
console.log(user.age); // undefined
```

访问不存在的属性不会抛错，而是得到 `undefined`。这与访问未声明变量不同。

### 3. 嵌套对象

值可以继续是对象，形成多层结构。读取时按层级写下去：`task.owner.name` 先取 `task.owner`，再从结果中取 `name`。如果中间某一层是 `undefined`，再往下读属性就会抛 `TypeError`。

```js
const task = { owner: { name: "Ada", team: "设计" } };
console.log(task.owner.name); // "Ada"
console.log(task.owner); // { name: "Ada", team: "设计" }
```

## 二、数组字面量

### 1. 索引与 length

数组用方括号创建，元素按位置从 `0` 开始编号。`length` 是元素个数，最后一个元素的下标是 `length - 1`。数组可以混合存放不同类型，但通常保存同类数据。

```js
const tags = ["文档", "紧急"];
console.log(tags[0]); // "文档"
console.log(tags.length); // 2
```

### 2. 越界索引得到 undefined

读取超出范围的下标不会抛错，返回 `undefined`；继续在这个结果上访问属性才会出错。写入越界下标会扩大数组，中间留下空位，这种写法容易掩盖错误。

```js
console.log(tags[10]); // undefined
console.log(tags[10].toUpperCase()); // TypeError
```

### 3. 数组也是对象

`typeof []` 是 `"object"`，判断数组要用 `Array.isArray()`。数组的键是数字索引，`Object.keys(tags)` 返回 `["0", "1"]` 这样的字符串键。

```js
console.log(Array.isArray(tags)); // true
console.log(Object.keys(tags)); // ["0", "1"]
```

## 三、引用与复制

### 1. 赋值不复制对象

`const alias = task` 只是让两个变量指向同一个对象，不会创建新对象。通过任一变量修改属性，另一个变量看到的结果都会改变；用 `===` 比较两者为 `true`，因为引用相同。

```js
const task = { title: "完成报告", done: false };
const alias = task;
alias.done = true;
console.log(task.done); // true
console.log(alias === task); // true
```

### 2. 展开复制只复制顶层

`{ ...task }` 创建一个新对象，把原对象的顶层属性逐个复制过去。修改副本的顶层属性不影响原对象；但属性值如果是对象，复制过去的仍是同一个引用，改嵌套属性会同时影响原对象。

```js
const task = { title: "完成报告", owner: { name: "Ada" } };
const shallow = { ...task };
shallow.title = "已改名";
console.log(task.title); // "完成报告"
shallow.owner.name = "Grace";
console.log(task.owner.name); // "Grace"
```

需要完全独立的深层副本时，要逐层复制或使用专门的深复制方法；展开运算符本身只做浅复制。

### 3. 用 === 比较的是引用

两个内容相同的对象并不相等，因为它们是不同引用。比较对象内容需要逐个属性判断，或序列化后比较；序列化比较受属性顺序和类型影响，不能当作通用的深比较。

```js
console.log({ a: 1 } === { a: 1 }); // false
const same = { a: 1 };
console.log(same === same); // true
```

## 四、从空目录观察对象与数组

### 1. 创建页面

新建空目录 `js-objects`，创建 `index.html`。脚本先给 `task` 建立别名并修改 `done`，再用展开运算符创建浅副本，修改顶层 `title` 和嵌套的 `owner.name`，最后把所有读取结果写入表格。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>对象与数组观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>对象与数组观察</h1>
  <table id="output">
    <thead><tr><th>表达式</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const task = {
      id: 7,
      title: "完成报告",
      done: false,
      owner: { name: "Ada", team: "设计" },
      tags: ["文档", "紧急"],
    };

    const alias = task;
    alias.done = true;

    const shallow = { ...task };
    shallow.title = "已改名";
    shallow.owner.name = "Grace";

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
      if (value !== null && typeof value === "object") return JSON.stringify(value);
      return String(value);
    }

    const samples = [
      ["task.title", task.title, "点访问"],
      ['task["title"]', task["title"], "方括号访问"],
      ["task.owner.name", task.owner.name, "嵌套对象"],
      ["task.tags[0]", task.tags[0], "数组第一个元素"],
      ["task.tags.length", task.tags.length, "元素个数"],
      ["task.missing", task.missing, "不存在的属性"],
      ["task.tags[10]", task.tags[10], "越界索引"],
      ["alias.done", alias.done, "alias = task 后修改"],
      ["task.done", task.done, "原对象也随之改变"],
      ["shallow.title", shallow.title, "展开复制后修改顶层"],
      ["task.title", task.title, "原对象未变"],
      ["shallow.owner.name", shallow.owner.name, "嵌套对象仍共享"],
      ["task.owner.name", task.owner.name, "原对象被一起改动"],
      ["Object.keys(task)", Object.keys(task), "顶层键"],
      ["Array.isArray(task.tags)", Array.isArray(task.tags), "—"],
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

    console.log("task.done", task.done);
    console.log("task.title", task.title);
    console.log("task.owner.name", task.owner.name);
    console.log("tags 越界", task.tags[10]);
    console.log("JSON.stringify(task)", JSON.stringify(task));
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有十五行。`alias.done` 和 `task.done` 都是 `true`，说明别名修改影响了原对象；`shallow.title` 是 `"已改名"`，而 `task.title` 仍是 `"完成报告"`，说明顶层复制生效；`shallow.owner.name` 和 `task.owner.name` 都是 `"Grace"`，说明嵌套对象仍共享。控制台应显示 `task.done` 为 `true`、`task.title` 为 `完成报告`、`task.owner.name` 为 `Grace`、越界读取为 `undefined`，以及序列化后的完整对象。

| 表达式 | 结果 | 说明 |
|--------|------|------|
| `task.title` | `"完成报告"` | 点访问 |
| `task["title"]` | `"完成报告"` | 方括号访问 |
| `task.owner.name` | `"Grace"` | 嵌套对象，已被浅副本的修改影响 |
| `task.tags[0]` | `"文档"` | 数组第一个元素 |
| `task.tags.length` | `2` | 元素个数 |
| `task.missing` | `undefined` | 不存在的属性 |
| `task.tags[10]` | `undefined` | 越界索引 |
| `alias.done` | `true` | 通过别名修改 |
| `task.done` | `true` | 原对象随之改变 |
| `shallow.title` | `"已改名"` | 修改副本顶层 |
| `task.title` | `"完成报告"` | 原对象未变 |
| `shallow.owner.name` | `"Grace"` | 嵌套对象仍共享 |
| `task.owner.name` | `"Grace"` | 原对象被一起改动 |
| `Object.keys(task)` | `["id","title","done","owner","tags"]` | 顶层键 |
| `Array.isArray(task.tags)` | `true` | — |

### 3. 失败分支

创建 `missing-element.html`，写入 `const task = { tags: ["文档"] }; console.log(task.tags[3].toUpperCase());`。越界读取先得到 `undefined`，再调用 `.toUpperCase()` 时 Console 显示 `TypeError: Cannot read properties of undefined (reading 'toUpperCase')`。修复是先检查元素是否存在，或使用可选链 `task.tags[3]?.toUpperCase()`。

另一个常见错误是把 `const copy = task` 当成复制。它只是新增一个引用，修改变量 `copy` 的属性仍会改到原对象；需要独立副本时应使用展开运算符，并注意嵌套对象仍是共享的。

## 五、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格十五行与控制台五条输出与正文一致；`missing-element.html` 得到 `TypeError: Cannot read properties of undefined (reading 'toUpperCase')`。两个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有展开深复制、`Object.freeze`、稀疏数组和数组迭代方法；需要独立深层副本时，应按目标环境支持的复制方式核对。
