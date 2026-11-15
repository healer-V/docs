---
title: "可选链、空值合并与展开"
tags:
  - JavaScript
  - 可选链
  - 空值合并
  - 展开语法
excerpt: "说明 ?. 对 null 与 undefined 的短路、?.[] 与 ?.() 的写法、它只保护紧邻层级的原因，区分 ?? 与 || 对假值的处理，并给出对象与数组展开、覆盖顺序和浅复制边界的观察页。"
date: 2026-11-15
---

# 可选链、空值合并与展开

读取深层属性时，中间某一层可能是 `null` 或 `undefined`，直接点下去会抛错。可选链 `?.` 在这个位置短路，返回 `undefined` 而不是继续访问。它只保护紧邻的那一层，`user?.profile.name` 在 `profile` 为空时仍会抛错。

空值合并 `??` 只在左值为 `null` 或 `undefined` 时取右值，能保留 `0`、空字符串和 `false`；逻辑或 `||` 会把它们都当成假值替换掉。展开语法把对象或数组的元素复制到新结构中，后面的属性覆盖前面的同名属性，但只复制一层。

本篇先说明可选链的短路范围，再区分 `??` 和 `||`，随后介绍展开与覆盖顺序，最后用页面核对。

::: info 本篇的范围
本篇讲这三个运算符的用法，不把可选链当作普遍的错误处理，也不展开函数剩余参数。解构见“对象字面量、属性访问与解构”，浅复制与深复制见“属性描述符、复制与不可变”。
:::

## 一、可选链

### 1. ?. 的短路

`obj?.prop` 在 `obj` 为 `null` 或 `undefined` 时直接返回 `undefined`，不再读取 `prop`；`obj` 是其他值时按普通属性访问处理。它适合读取可能缺失的中间节点，而不是用来掩盖数据结构错误。

```js
const user = { profile: { name: "Ada" } };
console.log(user.profile?.name); // "Ada"
console.log(user.account?.email); // undefined
```

### 2. ?.[] 与 ?.()

方括号可选链写成 `obj?.[key]`，适合键名是变量；函数可选链写成 `fn?.()`，只在函数存在时调用，否则返回 `undefined`。调用不存在的普通函数会抛错，加可选链后不会。

```js
const key = "name";
const user = { profile: { name: "Ada" } };
console.log(user.profile?.[key]); // "Ada"
const handlers = { save() { return "已保存"; } };
console.log(handlers.save?.()); // "已保存"
console.log(handlers.remove?.()); // undefined
```

### 3. 只保护紧邻层级

可选链只对 `?.` 所在的位置生效。`user?.profile.name` 只保护 `user`，如果 `user` 存在而 `profile` 为 `null`，访问 `.name` 仍会抛 `TypeError`。需要保护整条路径时，每一层都要判断，或先确认数据完整。

```js
const user = { profile: null };
console.log(user?.profile.name); // TypeError: Cannot read properties of null
```

## 二、空值合并

### 1. ?? 只对空值回退

`left ?? right` 只在 `left` 是 `null` 或 `undefined` 时返回 `right`，其他值一律返回 `left`。因此 `0`、`""`、`false` 都不会被替换，适合处理计数、开关和允许空字符串的字段。

```js
const settings = { count: 0, label: "" };
console.log(settings.count ?? 10); // 0
console.log(settings.label ?? "默认"); // ""
console.log(settings.missing ?? "默认"); // "默认"
```

### 2. ?? 与 || 的差异

`||` 在左值为任意假值时取右值，包括 `0`、`""`、`false` 和 `NaN`。需要保留这些合法值时用 `??`；只有明确希望把所有假值都当作缺失时，才使用 `||`。

```js
const settings = { count: 0, label: "" };
console.log(settings.count || 10); // 10
console.log(settings.label || "默认"); // "默认"
```

### 3. 不能与 &&、|| 无括号混用

`??` 不能直接和 `&&`、`||` 混用，必须加括号说明分组，否则是语法错误。这个限制避免优先级歧义；写混合表达式时，显式括号比依赖优先级更清楚。

```js
const value = 0 ?? 1 || 2; // SyntaxError: Unexpected token '||'
const safe = (0 ?? 1) || 2; // 2
```

## 三、展开

### 1. 对象展开与覆盖顺序

对象展开 `{ ...source }` 把源对象的自有可枚举属性复制到新对象。多个属性同名时，后写的覆盖先写的；展开的位置决定它是被覆盖还是覆盖别人。

```js
const defaults = { theme: "light", lang: "zh" };
const custom = { ...defaults, theme: "dark" };
console.log(custom); // { theme: "dark", lang: "zh" }
const reversed = { theme: "dark", ...defaults };
console.log(reversed.theme); // "light"
```

### 2. 数组展开

数组展开把可迭代对象的元素依次放入新数组，可以插入到任意位置，也可以用来复制数组。展开不是深复制，元素是对象时仍共享引用。

```js
const merged = [0, ...[1, 2], 3];
console.log(merged); // [0, 1, 2, 3]
```

### 3. 浅复制边界

展开复制只作用于第一层。修改副本的顶层属性不影响原对象，但修改嵌套对象会同时影响两边。需要独立深层副本时，使用 `structuredClone` 或逐层复制。

```js
const original = { nested: { value: 1 } };
const copy = { ...original };
copy.nested.value = 2;
console.log(original.nested.value); // 2
```

## 四、从空目录观察可选链与展开

### 1. 创建页面

新建空目录 `js-optional`，创建 `index.html`。脚本读取存在的嵌套属性、缺失的中间节点和可选方法，对照 `||` 与 `??` 对 `0` 和空字符串的处理，并展开对象与数组观察覆盖顺序和浅复制。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>可选链、空值合并与展开观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>可选链、空值合并与展开观察</h1>
  <table id="output">
    <thead><tr><th>表达式</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const user = { profile: { name: "Ada" } };
    const handlers = {
      save() {
        return "已保存";
      },
    };
    const settings = { count: 0, label: "" };
    const defaults = { theme: "light", lang: "zh" };
    const custom = { ...defaults, theme: "dark" };
    const reversed = { theme: "dark", ...defaults };
    const merged = [0, ...[1, 2], 3];
    const original = { nested: { value: 1 } };
    const shallow = { ...original };
    shallow.nested.value = 2;

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
      if (value === undefined) return "undefined";
      return JSON.stringify(value);
    }

    const samples = [
      ["user.profile?.name", user.profile?.name, "存在时正常读取"],
      ["user.account?.email", user.account?.email, "缺失中间节点返回 undefined"],
      ['user.profile?.["name"]', user.profile?.["name"], "方括号可选链"],
      ["handlers.save?.()", handlers.save?.(), "方法存在则调用"],
      ["handlers.remove?.()", handlers.remove?.(), "方法缺失返回 undefined"],
      ["settings.count || 10", settings.count || 10, "0 被当成假值"],
      ["settings.count ?? 10", settings.count ?? 10, "只有空值才回退"],
      ["settings.label || \"默认\"", settings.label || "默认", "空字符串被替换"],
      ["settings.label ?? \"默认\"", settings.label ?? "默认", "空字符串保留"],
      ["null ?? \"默认\"", null ?? "默认", "null 触发回退"],
      ["custom", custom, "后面的属性覆盖前面"],
      ["reversed", reversed, "展开放在后面则覆盖前面"],
      ["merged", merged, "数组展开插入中间"],
      ["shallow.nested.value", shallow.nested.value, "浅复制共享嵌套对象"],
      ["original.nested.value", original.nested.value, "原对象被一起修改"],
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

    console.log("optional name", user.profile?.name);
    console.log("missing", user.account?.email);
    console.log("call", handlers.save?.());
    console.log("count ??", settings.count ?? 10);
    console.log("label ??", settings.label ?? "默认");
    console.log("custom", JSON.stringify(custom));
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有十五行。`user.profile?.name` 读到 `Ada`，缺失的 `account` 返回 `undefined`；可选方法存在时返回 `已保存`，缺失时返回 `undefined`；`||` 把 `0` 和空字符串替换掉，`??` 保留它们；对象展开的覆盖顺序符合预期；数组展开得到 `[0,1,2,3]`；浅复制后原对象的嵌套值也被改成 `2`。控制台六条输出与表格一致。

| 表达式 | 结果 | 说明 |
|--------|------|------|
| `user.profile?.name` | `"Ada"` | 存在时正常读取 |
| `user.account?.email` | `undefined` | 缺失中间节点返回 `undefined` |
| `user.profile?.["name"]` | `"Ada"` | 方括号可选链 |
| `handlers.save?.()` | `"已保存"` | 方法存在则调用 |
| `handlers.remove?.()` | `undefined` | 方法缺失返回 `undefined` |
| `settings.count \|\| 10` | `10` | `0` 被当成假值 |
| `settings.count ?? 10` | `0` | 只有空值才回退 |
| `settings.label \|\| "默认"` | `"默认"` | 空字符串被替换 |
| `settings.label ?? "默认"` | `""` | 空字符串保留 |
| `null ?? "默认"` | `"默认"` | `null` 触发回退 |
| `custom` | `{"theme":"dark","lang":"zh"}` | 后面的属性覆盖前面 |
| `reversed` | `{"theme":"light","lang":"zh"}` | 展开放在后面则覆盖前面 |
| `merged` | `[0,1,2,3]` | 数组展开插入中间 |
| `shallow.nested.value` | `2` | 浅复制共享嵌套对象 |
| `original.nested.value` | `2` | 原对象被一起修改 |

### 3. 失败分支

创建 `partial-chain.html`，写入 `const user = { profile: null }; user?.profile.name;`。可选链只保护 `user`，`profile` 为 `null` 时继续读取 `.name`，Console 显示 `TypeError: Cannot read properties of null (reading 'name')`。修复是把保护放到实际可能为空的层级：`user.profile?.name`。

创建 `nullish-mix.html`，写入 `0 ?? 1 || 2`。`??` 与 `||` 不能无括号混用，Console 显示 `SyntaxError: Unexpected token '||'`。加上括号明确分组后即可运行，例如 `(0 ?? 1) || 2`。

## 五、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格十五行与控制台六条输出与正文一致；`partial-chain.html` 得到 `TypeError: Cannot read properties of null (reading 'name')`，`nullish-mix.html` 得到 `SyntaxError: Unexpected token '||'`。三个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有展开可选链与 `delete`、赋值目标的组合限制、展开对稀疏数组和类数组的处理；可选链的兼容范围需要按目标环境确认。
