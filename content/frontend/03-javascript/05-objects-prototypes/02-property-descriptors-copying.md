---
title: "属性描述符、复制与不可变"
tags:
  - JavaScript
  - 属性描述符
  - 浅拷贝
  - Object.freeze
excerpt: "说明 writable、enumerable、configurable 三个属性特征与访问器属性，解释展开和 Object.assign 为什么只做浅复制、structuredClone 能复制什么，以及 Object.freeze 只冻结一层的边界。"
date: 2026-11-15
---

# 属性描述符、复制与不可变

对象上的每个属性都有一组特征：值、是否可写、是否可枚举、是否可重新配置。普通赋值创建可写、可枚举、可配置的数据属性；`Object.defineProperty` 可以改变这些特征，也可以定义由 getter 和 setter 组成的访问器属性。

复制对象时，展开运算符和 `Object.assign` 只复制自有且可枚举的属性，并且只复制一层：嵌套对象仍是共享引用。`structuredClone` 能递归复制多数内置数据结构，但不能复制函数和 DOM 节点。`Object.freeze` 冻结的也只是对象自身，嵌套对象仍可修改。

本篇先说明属性描述符与访问器，再对照浅复制、深复制和冻结的边界，最后用页面核对。

::: info 本篇的范围
本篇讲属性特征、复制与冻结，不实现不可变数据结构，也不讨论代理和反射元编程。原型链见“原型链与继承”，对象展开见“可选链、空值合并与展开”。
:::

## 一、属性描述符

### 1. 数据属性的四个特征

数据属性由 `value`、`writable`、`enumerable`、`configurable` 描述。`writable` 控制能否赋值，`enumerable` 控制能否被 `for...in`、`Object.keys` 等枚举，`configurable` 控制能否删除或重新定义。普通字面量属性的三项布尔特征都是 `true`。

```js
const user = { name: "Ada" };
console.log(Object.getOwnPropertyDescriptor(user, "name"));
// { value: "Ada", writable: true, enumerable: true, configurable: true }
```

### 2. defineProperty 定义不可见属性

`Object.defineProperty` 接收对象、属性名和描述符。未写出的特征默认为 `false`，因此只写 `value` 会得到不可写、不可枚举、不可配置的属性。这样的属性仍可直接读取，但不会出现在 `Object.keys` 中。

```js
const settings = {};
Object.defineProperty(settings, "hidden", {
  value: "秘密",
  enumerable: false,
  writable: false,
  configurable: false,
});
console.log(settings.hidden); // "秘密"
```

### 3. 枚举与全部自有属性

`Object.keys` 和 `for...in` 只看可枚举属性；`Object.getOwnPropertyNames` 返回全部自有属性名，包括不可枚举的。上面的 `hidden` 不出现在 `keys` 中，但能被 `getOwnPropertyNames` 找到。

```js
const settings = {};
Object.defineProperty(settings, "hidden", { value: "秘密" });
console.log(Object.keys(settings)); // []
console.log(Object.getOwnPropertyNames(settings)); // ["hidden"]
```

## 二、访问器属性

### 1. getter 计算属性值

描述符中写 `get` 函数时，读取属性会调用它，返回值作为属性值。getter 适合由其他属性推导出的值，不需要单独存储，也不会随底层属性自动缓存。

```js
const person = {
  first: "Ada",
  last: "Lovelace",
  get fullName() {
    return this.first + " " + this.last;
  },
};
console.log(person.fullName); // "Ada Lovelace"
```

### 2. setter 接收赋值

描述符中写 `set` 函数时，给属性赋值会调用它，赋入的值作为参数。setter 通常用来拆分或校验输入；只定义 getter 时，赋值在非严格模式下被忽略，严格模式下抛错。

```js
const account = {
  owner: "",
  set name(value) {
    this.owner = value.trim();
  },
};
account.name = "  Ada  ";
console.log(account.owner); // "Ada"
```

### 3. 访问器与数据属性的区别

访问器属性没有 `value` 和 `writable`，描述符中是 `get`、`set`、`enumerable`、`configurable`。每次读取都执行 getter，因此不要在其中放置有副作用的操作，也不要依赖它缓存结果。

```js
const account = { set name(value) { this.owner = value; } };
const descriptor = Object.getOwnPropertyDescriptor(account, "name");
console.log(typeof descriptor.set); // "function"
console.log("value" in descriptor); // false
```

## 三、复制与冻结

### 1. 展开与 Object.assign 是浅复制

展开运算符和 `Object.assign({}, source)` 都复制自有且可枚举的属性。复制出的顶层属性互不影响，但属性值是对象时，复制的是同一个引用，修改嵌套属性会同时改变原对象。

```js
const original = { name: "配置", nested: { value: 1 } };
const copy = { ...original };
copy.nested.value = 2;
console.log(original.nested.value); // 2
console.log(copy === original); // false
```

### 2. structuredClone 递归复制

`structuredClone` 按结构化克隆算法递归复制对象，嵌套对象、数组、`Map`、`Set`、`Date` 等会得到独立副本。它能处理循环引用，但复制能力和运行环境有关，使用前应确认目标环境支持。

```js
const original = { name: "配置", nested: { value: 2 } };
const deep = structuredClone(original);
deep.nested.value = 3;
console.log(original.nested.value); // 2
console.log(deep.nested.value); // 3
```

### 3. 不能克隆的类型

函数、DOM 节点、`WeakMap` 等不能被结构化克隆，传入 `structuredClone` 会抛出 `DataCloneError`。需要复制这类对象时，只能手动重建或改用对应的专用方法。

```js
structuredClone(() => 1); // DataCloneError
```

### 4. Object.freeze 只冻结一层

`Object.freeze` 把对象的所有自有属性设为不可写、不可配置，并返回同一个对象。它不会递归冻结嵌套对象，因此 `frozen.nested.value` 仍可修改。需要完全不可变时，要逐层冻结或使用其他方案。

```js
const frozen = Object.freeze({ name: "固定", nested: { value: 1 } });
frozen.name = "改写";
console.log(frozen.name); // "固定"
frozen.nested.value = 2;
console.log(frozen.nested.value); // 2
```

## 四、从空目录观察属性与复制

### 1. 创建页面

新建空目录 `js-descriptors`，创建 `index.html`。脚本定义一个不可枚举、不可写的属性，定义带 getter 和 setter 的访问器，分别用展开和 `structuredClone` 复制嵌套对象，并观察冻结对象的内外层修改结果。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>属性描述符与复制观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>属性描述符与复制观察</h1>
  <table id="output">
    <thead><tr><th>表达式</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const settings = {};
    Object.defineProperty(settings, "hidden", {
      value: "秘密",
      enumerable: false,
      writable: false,
      configurable: false,
    });
    settings.hidden = "改写";

    const person = {
      first: "Ada",
      last: "Lovelace",
      get fullName() {
        return this.first + " " + this.last;
      },
      set fullName(value) {
        [this.first, this.last] = value.split(" ");
      },
    };
    person.fullName = "Grace Hopper";

    const original = { name: "配置", nested: { value: 1 } };
    const spreadCopy = { ...original };
    spreadCopy.nested.value = 2;

    const deepCopy = structuredClone(original);
    deepCopy.nested.value = 3;

    const frozen = Object.freeze({ name: "固定", nested: { value: 1 } });
    frozen.name = "改写";
    frozen.nested.value = 2;

    const descriptor = Object.getOwnPropertyDescriptor(settings, "hidden");

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
      if (value === undefined) return "undefined";
      return JSON.stringify(value);
    }

    const samples = [
      ["settings.hidden", settings.hidden, "不可写，赋值无效"],
      ["Object.keys(settings)", Object.keys(settings), "可枚举属性"],
      ["Object.getOwnPropertyNames(settings)", Object.getOwnPropertyNames(settings), "全部自有属性"],
      ["descriptor.enumerable", descriptor.enumerable, "不可枚举"],
      ["descriptor.writable", descriptor.writable, "不可写"],
      ["descriptor.configurable", descriptor.configurable, "不可重新配置"],
      ["person.fullName", person.fullName, "调用 getter"],
      ["person.first / last", [person.first, person.last], "setter 拆分并赋值"],
      ["spreadCopy.nested.value", spreadCopy.nested.value, "浅复制共享嵌套对象"],
      ["original.nested.value", original.nested.value, "原对象被一起修改"],
      ["deepCopy.nested.value", deepCopy.nested.value, "深复制独立"],
      ["frozen.name", frozen.name, "冻结后赋值无效"],
      ["frozen.nested.value", frozen.nested.value, "嵌套对象未被冻结"],
      ["Object.isFrozen(frozen)", Object.isFrozen(frozen), "顶层已冻结"],
      ["Object.isFrozen(frozen.nested)", Object.isFrozen(frozen.nested), "内层未冻结"],
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

    console.log("settings.hidden", settings.hidden);
    console.log("keys", JSON.stringify(Object.keys(settings)));
    console.log("names", JSON.stringify(Object.getOwnPropertyNames(settings)));
    console.log("fullName", person.fullName);
    console.log("original.nested.value", original.nested.value);
    console.log("frozen.name", frozen.name, "nested", frozen.nested.value);
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有十五行。`hidden` 可读但不可写，赋值后仍是 `秘密`；`Object.keys` 为空，`getOwnPropertyNames` 能找到它；三个布尔特征都是 `false`。setter 把 `fullName` 拆分后，`first` 和 `last` 变成 `Grace` 与 `Hopper`。浅复制后原对象的嵌套值变为 `2`，深复制保持独立；冻结对象顶层不变，内层仍被改为 `2`。控制台六条输出与表格一致。

| 表达式 | 结果 | 说明 |
|--------|------|------|
| `settings.hidden` | `"秘密"` | 不可写，赋值无效 |
| `Object.keys(settings)` | `[]` | 可枚举属性 |
| `Object.getOwnPropertyNames(settings)` | `["hidden"]` | 全部自有属性 |
| `descriptor.enumerable` | `false` | 不可枚举 |
| `descriptor.writable` | `false` | 不可写 |
| `descriptor.configurable` | `false` | 不可重新配置 |
| `person.fullName` | `"Grace Hopper"` | 调用 getter |
| `person.first / last` | `["Grace","Hopper"]` | setter 拆分并赋值 |
| `spreadCopy.nested.value` | `2` | 浅复制共享嵌套对象 |
| `original.nested.value` | `2` | 原对象被一起修改 |
| `deepCopy.nested.value` | `3` | 深复制独立 |
| `frozen.name` | `"固定"` | 冻结后赋值无效 |
| `frozen.nested.value` | `2` | 嵌套对象未被冻结 |
| `Object.isFrozen(frozen)` | `true` | 顶层已冻结 |
| `Object.isFrozen(frozen.nested)` | `false` | 内层未冻结 |

### 3. 失败分支

创建 `frozen-strict.html`，在严格模式脚本中给冻结对象的属性赋值。冻结属性不可写，Console 显示 `TypeError: Cannot assign to read only property 'name' of object '#<Object>'`。非严格模式下同样的赋值会被静默忽略，不会报错，这也是它容易被忽略的原因。

创建 `clone-function.html`，把函数传给 `structuredClone`。函数不可被结构化克隆，Console 显示 `DataCloneError: Failed to execute 'structuredClone' on 'Window': () => 1 could not be cloned.`。需要复制函数时，只能重新定义函数或复制其行为。

## 五、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格十五行与控制台六条输出与正文一致；`frozen-strict.html` 得到 `TypeError: Cannot assign to read only property 'name' of object '#<Object>'`，`clone-function.html` 得到 `DataCloneError: Failed to execute 'structuredClone' on 'Window': () => 1 could not be cloned.`。三个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有展开 `structuredClone` 的完整支持类型、可转移对象和循环引用的处理细节，没有实现递归冻结；`structuredClone` 的可用范围需要按目标环境确认。
