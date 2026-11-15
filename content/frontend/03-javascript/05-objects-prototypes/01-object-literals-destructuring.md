---
title: "对象字面量、属性访问与解构"
tags:
  - JavaScript
  - 对象
  - 解构
  - 属性
excerpt: "说明属性简写、计算属性名与方法定义，区分点访问和方括号访问、in 与 Object.hasOwn 的判断范围，并给出对象解构、数组解构、默认值、别名、剩余属性与嵌套解构的观察页。"
date: 2026-11-15
---

# 对象字面量、属性访问与解构

对象字面量用键值对描述数据。键可以简写、可以在运行时计算，方法可以省略 `function`。读取属性有点访问和方括号访问两种写法，判断属性是否存在则要看用 `in` 还是 `Object.hasOwn`：前者会查到继承属性，后者只查自有属性。

解构赋值从对象或数组中一次取出多个值。默认值只在对应位置是 `undefined` 时生效，别名把取出的值绑定到新名字，剩余属性收集没有取走的字段，嵌套解构按层级展开。解构让读取配置和函数参数更直接，但解构 `null` 或 `undefined` 会抛错。

本篇先说明字面量的几种写法与属性判断，再介绍对象和数组解构，最后用页面核对结果。

::: info 本篇的范围
本篇讲对象的创建与读取，不展开展开运算符、可选链和原型链查找。展开与可选链见“可选链、空值合并与展开”，原型链见“原型链与继承”。
:::

## 一、对象字面量

### 1. 属性简写

变量名与属性名相同时，可以只写一次，称为属性简写。简写不会复制变量本身，值仍按普通属性保存；之后修改变量不会改变对象里的值。

```js
const name = "Ada";
const age = 30;
const user = { name, age };
console.log(user); // { name: "Ada", age: 30 }
```

### 2. 计算属性名

方括号包住表达式时，属性名在对象创建时计算。表达式的结果会转成字符串作为键，因此可以用变量或拼接结果命名属性。键名拼写错误会直接抛错，因为表达式中的标识符必须先存在。

```js
const key = "score";
const record = { [key]: 90 };
console.log(record.score); // 90
```

### 3. 方法定义

对象中的函数可以写成方法简写，省略 `function` 关键字和冒号。方法名后直接跟参数列表和函数体，调用时用 `对象.方法()`。

```js
const calculator = {
  add(a, b) {
    return a + b;
  },
};
console.log(calculator.add(2, 3)); // 5
```

## 二、属性访问与判断

### 1. 点与方括号

点访问书写短，要求键名是合法标识符；方括号接受字符串表达式，适合键名来自变量的情况。两种写法读取同一个属性，读取不存在的属性都返回 `undefined`。

```js
const record = { score: 90 };
console.log(record.score); // 90
console.log(record["score"]); // 90
console.log(record.missing); // undefined
```

### 2. in 与 hasOwn 的范围

`in` 检查属性是否存在于对象及其原型链上，`Object.hasOwn()` 只检查自有属性。判断配置项是否存在时用后者，避免把 `toString` 这类继承属性当成业务字段。`Object.hasOwn` 于 ES2022 引入，旧环境可改用 `Object.prototype.hasOwnProperty.call(obj, key)`。

```js
const empty = {};
console.log("toString" in empty); // true
console.log(Object.hasOwn(empty, "toString")); // false
```

### 3. 属性值为 undefined 不等于属性不存在

自有属性的值可以是 `undefined`，此时 `in` 和 `hasOwn` 都返回 `true`，但读取结果是 `undefined`。需要区分“没有这个键”和“键存在但值为空”时，不能只看读取结果。

```js
const data = { note: undefined };
console.log("note" in data); // true
console.log(data.note); // undefined
```

## 三、对象与数组解构

### 1. 对象解构与默认值

解构用与对象结构相同的模式声明变量。默认值只在对应属性是 `undefined` 或缺失时生效，`null` 不会触发默认值。解构源为 `null` 或 `undefined` 时直接抛错。

```js
const config = { server: { host: "localhost", port: 8080 }, user: { name: "Ada" } };
const {
  server: { host, port = 80 },
  user: { name: nickname, email = "未填写" },
  timeout = 3000,
} = config;
console.log(host, port, nickname, email, timeout); // localhost 8080 Ada 未填写 3000
```

### 2. 别名与嵌套

`属性: 新变量名` 的写法给取出的值换一个本地名字。嵌套解构按层级展开，只取需要的字段；中间层缺失时读取会抛错，需要为中间层提供默认值或先判断。

```js
const config = { user: { name: "Ada" } };
const { user: { name: nickname } } = config;
console.log(nickname); // "Ada"
```

### 3. 剩余属性与数组解构

对象剩余属性用 `...others` 收集没有显式取走的字段，得到一个普通对象。数组解构按位置取值，默认值同样只在 `undefined` 时生效，剩余元素收集为数组；多余元素会被忽略。

```js
const config = { server: "local", user: "Ada", debug: false };
const { server, ...others } = config;
console.log(Object.keys(others)); // ["user", "debug"]
const [first, second = "b", ...rest] = ["a"];
console.log(first, second, rest); // a b []
```

## 四、从空目录观察属性与解构

### 1. 创建页面

新建空目录 `js-destructuring`，创建 `index.html`。脚本从嵌套配置中解构主机、端口、别名与缺失字段，收集剩余属性，并对照 `in` 与 `Object.hasOwn` 对继承属性的结果，最后把结果写入表格。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>对象访问与解构观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>对象访问与解构观察</h1>
  <table id="output">
    <thead><tr><th>表达式</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const key = "score";
    const record = { [key]: 90, name: "Ada" };

    const config = {
      server: { host: "localhost", port: 8080 },
      user: { name: "Ada" },
      debug: false,
    };

    const {
      server: { host, port = 80 },
      user: { name: nickname, email = "未填写" },
      timeout = 3000,
    } = config;

    const { server, ...others } = config;

    const [first, second = "b", ...rest] = ["a"];
    const [x, y] = [1, 2, 3];

    const counted = { count: null };
    const { count = 10 } = counted;

    const empty = {};
    const own = { ownKey: 1 };

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
      if (value === undefined) return "undefined";
      return JSON.stringify(value);
    }

    const samples = [
      ["record.score", record.score, "计算属性名"],
      ["record[key]", record[key], "方括号读取"],
      ["host", host, "嵌套解构"],
      ["port", port, "存在值不取默认"],
      ["timeout", timeout, "缺失字段取默认值"],
      ["email", email, "缺失字段取默认值"],
      ["nickname", nickname, "别名"],
      ["first", first, "数组解构"],
      ["second", second, "缺省位置取默认值"],
      ["rest", rest, "没有剩余元素"],
      ["[x, y]", [x, y], "多余的数组元素被忽略"],
      ["others", others, "剩余属性"],
      ["count", count, "null 不触发默认值"],
      ['"toString" in empty', "toString" in empty, "in 查到继承属性"],
      ['Object.hasOwn(empty, "toString")', Object.hasOwn(empty, "toString"), "hasOwn 只查自有属性"],
      ['Object.hasOwn(own, "ownKey")', Object.hasOwn(own, "ownKey"), "自有属性"],
    ];

    const body = document.querySelector("#output tbody");
    for (const [label, value, extra] of samples) {
      const row = document.createElement("tr");
      const cells = [label, show(value), extra];
      for (const text of cells) {
        const cell = document.createElement("td");
        cell.textContent = text;
        row.append(cell);
      }
      body.append(row);
    }

    console.log("host/port", host, port);
    console.log("timeout", timeout);
    console.log("others keys", Object.keys(others).join(","));
    console.log("in toString", "toString" in empty);
    console.log("hasOwn toString", Object.hasOwn(empty, "toString"));
    console.log("count", count);
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有十六行。计算属性名得到 `90`；解构出的 `host`、`port`、`timeout`、`email` 分别来自已有值和默认值；别名 `nickname` 为 `Ada`；数组解构的剩余部分为空数组；`others` 含 `user` 与 `debug`；值为 `null` 的 `count` 不取默认值；`in` 对继承的 `toString` 返回 `true`，`Object.hasOwn` 返回 `false`。控制台六条输出与表格一致。

| 表达式 | 结果 | 说明 |
|--------|------|------|
| `record.score` | `90` | 计算属性名 |
| `record[key]` | `90` | 方括号读取 |
| `host` | `"localhost"` | 嵌套解构 |
| `port` | `8080` | 存在值不取默认 |
| `timeout` | `3000` | 缺失字段取默认值 |
| `email` | `"未填写"` | 缺失字段取默认值 |
| `nickname` | `"Ada"` | 别名 |
| `first` | `"a"` | 数组解构 |
| `second` | `"b"` | 缺省位置取默认值 |
| `rest` | `[]` | 没有剩余元素 |
| `[x, y]` | `[1,2]` | 多余的数组元素被忽略 |
| `others` | `{"user":{"name":"Ada"},"debug":false}` | 剩余属性 |
| `count` | `null` | `null` 不触发默认值 |
| `"toString" in empty` | `true` | `in` 查到继承属性 |
| `Object.hasOwn(empty, "toString")` | `false` | `hasOwn` 只查自有属性 |
| `Object.hasOwn(own, "ownKey")` | `true` | 自有属性 |

### 3. 失败分支

创建 `destructure-null.html`，写入 `const { name } = null;`。解构源必须是对象，`null` 不满足要求，Console 显示 `TypeError: Cannot destructure property 'name' of 'null' as it is null.`。修复是先判断值是否存在，或提供空对象作为默认值：`const { name } = null ?? {};`。

创建 `computed-typo.html`，把计算属性名写成 `[kye]`。`kye` 是未声明的标识符，Console 显示 `ReferenceError: kye is not defined`。计算属性名里的表达式会先求值，拼写错误不会生成空键，而是直接报错。

## 五、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格十六行与控制台六条输出与正文一致；`destructure-null.html` 得到 `TypeError: Cannot destructure property 'name' of 'null' as it is null.`，`computed-typo.html` 得到 `ReferenceError: kye is not defined`。三个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有展开展开运算符、可选链、默认值右侧的表达式求值时机和原型链查找；`Object.hasOwn` 的兼容范围需要按目标环境确认。
