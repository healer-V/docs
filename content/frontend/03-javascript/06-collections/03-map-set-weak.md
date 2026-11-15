---
title: "Map、Set 与 Weak 集合"
tags:
  - JavaScript
  - Map
  - Set
  - WeakMap
excerpt: "说明 Map 用任意值作键、按引用匹配对象键与保留插入顺序的特性，对照普通对象的字符串键强制转换，讲解 Set 的 SameValueZero 去重与迭代顺序，并给出 WeakMap/WeakSet 的键限制、不可枚举和回收边界观察页。"
date: 2026-11-15
---

# Map、Set 与 Weak 集合

`Map` 保存键值对，键可以是任意值：对象、数组、函数都能直接当键，查找时按引用比较。`Set` 保存一组不重复的值。两者都按插入顺序迭代，`size` 表示条目数，用 `get`、`has` 等方法访问，而不是方括号。

普通对象的键一律转成字符串或符号，两个内容相同的对象会被写成同一个 `"[object Object]"`。`Set` 用 SameValueZero 判等，`NaN` 算相同、`0` 与 `-0` 算相同，两个内容相同的对象仍是两个元素。

`WeakMap`、`WeakSet` 的键只能是对象，不能枚举、不能迭代，也没有 `size`，键不再被引用时对应条目可被回收。本篇先讲 `Map`，再讲 `Set`，随后说明弱集合的边界，最后用页面核对。

::: info 本篇的范围
本篇讲集合类型的键、判等与迭代方式，不实现缓存框架，也不承诺垃圾回收发生的时刻。对象的属性规则见“对象字面量、属性访问与解构”，数组方法见“数组创建与增删改查”。
:::

## 一、Map 的基本操作

### 1. 创建与 set/get

`new Map()` 创建空映射，也可以在构造时传入键值对数组。`set(key, value)` 写入并返回映射本身，支持链式调用；键已存在时覆盖原来的值。`get(key)` 按键读取，键不存在时返回 `undefined`。

```js
const user = { id: 1 };
const map = new Map();
map.set(user, "用户一").set("role", "admin");
console.log(map.get(user)); // "用户一"
console.log(map.get("missing")); // undefined
```

### 2. has/delete/size

`has(key)` 判断键是否存在，`delete(key)` 删除条目并在成功时返回 `true`，`clear()` 清空整个映射。条目数用 `size` 读取，它是属性而不是方法，`map.length` 不存在。

```js
const map = new Map([["a", 1]]);
map.set("b", 2);
console.log(map.has("a")); // true
console.log(map.delete("a")); // true
console.log(map.get("b")); // 2
console.log(map.size); // 1
```

### 3. 对象键按引用匹配

对象作为键时，比较的是引用而不是内容。同一个对象总能取回值；另建一个内容相同的对象，即使属性完全一致，也被视为另一个键。需要按内容查找时，把标识字段（如 `id`）作为键，或改用数组加 `find`。

```js
const user = { id: 1 };
const map = new Map();
map.set(user, "命中");
console.log(map.get({ id: 1 })); // undefined
console.log(map.get(user)); // "命中"
```

## 二、Map 与普通对象的差异

### 1. 键不转字符串

普通对象的下标会被转成字符串：`obj[1]` 与 `obj["1"]` 是同一个属性，`obj[user]` 的键是 `"[object Object]"`。`Map` 保留键的原始类型，数字 `1` 与字符串 `"1"` 是两个不同的键。

```js
const map = new Map();
map.set(1, "number");
map.set("1", "string");
console.log(map.size); // 2
const plain = {};
plain[1] = "number";
plain["1"] = "string";
console.log(Object.keys(plain)); // ["1"]
```

### 2. 访问必须用方法

`Map` 的条目不是对象属性，`map["key"]` 读的是实例上的普通属性，与条目无关，结果通常是 `undefined`。读取值只能用 `get`，判断存在只能用 `has`；需要遍历用 `for...of`、`forEach` 或展开。

```js
const map = new Map([["key", "值"]]);
console.log(map["key"]); // undefined
console.log(map.get("key")); // "值"
```

### 3. 插入顺序与迭代

`Map` 按插入顺序保存条目，先插入的先被迭代；覆盖已有键不改变它原来的位置。`keys()`、`values()`、`entries()` 返回迭代器，展开成数组可以查看顺序，`for...of` 默认迭代 `[key, value]` 对。

```js
const map = new Map([["b", 2], ["a", 1]]);
console.log([...map.keys()]); // ["b", "a"]
for (const [key, value] of map) {
  console.log(key, value);
}
```

## 三、Set 去重与迭代

### 1. 创建与去重

`new Set(iterable)` 从可迭代对象创建集合，重复值只保留第一个。`add` 添加值并返回集合本身，`has` 判断存在，`delete` 删除，`size` 是元素个数。集合没有下标，不能用 `set[0]` 取第一个元素。

```js
const tags = new Set(["js", "web", "js"]);
tags.add("dom");
console.log(tags.size); // 3
console.log(tags.has("web")); // true
console.log([...tags]); // ["js", "web", "dom"]
```

### 2. SameValueZero 的比较规则

`Set` 用 SameValueZero 判断两个值是否相同：`NaN` 与 `NaN` 相同，`0` 与 `-0` 相同，对象按引用比较。因此 `new Set([NaN, NaN])` 只有一个元素，两个内容相同的对象却是两个元素。

```js
console.log(new Set([NaN, NaN]).size); // 1
console.log(new Set([0, -0]).size); // 1
console.log([...new Set([{ id: 1 }, { id: 1 }])].length); // 2
```

### 3. 插入顺序与转数组

`Set` 按插入顺序迭代，重复值不改变首次出现的位置。用展开语法转成数组是最常用的去重写法；需要按内容去重对象时，先把要比较的字段映射出来，或借助 `Map` 按字段建键。

```js
const words = ["b", "a", "b", "c"];
const unique = [...new Set(words)];
console.log(unique); // ["b", "a", "c"]
```

## 四、WeakMap 与 WeakSet

### 1. 键必须是对象

`WeakMap` 的键只能是对象（包括数组和函数），字符串、数字等原始值会抛 `TypeError`；`WeakSet` 的元素同样只能是对象。键被弱引用，不会阻止对象被回收。

```js
const cache = new WeakMap();
const key = {};
cache.set(key, "值");
console.log(cache.get(key)); // "值"
console.log(cache.size); // undefined
```

### 2. 不可枚举、不可迭代

弱集合没有 `size`、`keys`、`values`、`forEach`，也不能展开或用 `for...of` 遍历，`Object.keys` 返回空数组。这是因为回收时机不确定，枚举结果无法稳定；需要遍历键时只能用 `Map`。

```js
const cache = new WeakMap();
cache.set({ id: 1 }, "值");
console.log(Object.keys(cache).length); // 0
console.log(typeof cache[Symbol.iterator]); // "undefined"
```

### 3. 回收边界与合适用途

键对象不再被其他代码引用后，弱集合中的条目可能被回收，但回收时刻由垃圾回收器决定，无法观测也无法预测。弱集合适合给对象附加额外数据或标记，例如缓存计算结果、记录已处理的对象；需要统计数量或遍历时，改用 `Map` 或 `Set`。

## 五、从空目录观察集合

### 1. 创建页面

新建空目录 `js-collections`，创建 `index.html`。脚本用两个内容相同的对象分别作为 `Map` 键，对照普通对象的下标转换；记录 `size`、`has`、`delete` 与键的插入顺序；用 `Set` 观察去重、`NaN` 与 `0`/`-0`；最后检查弱集合的 `size`、枚举与迭代能力。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>Map、Set 与 Weak 集合观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>Map、Set 与 Weak 集合观察</h1>
  <table id="output">
    <thead><tr><th>表达式</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const user = { id: 1 };
    const other = { id: 1 };

    const map = new Map();
    map.set(user, "用户一");
    map.set(other, "用户二");
    map.set("key", "字符串键");
    map.set(1, "数字键");

    const sizeBefore = map.size;
    const gotUser = map.get(user);
    const gotLookalike = map.get({ id: 1 });
    const hasKey = map.has("key");
    const deleted = map.delete("key");
    const sizeAfter = map.size;
    const keysInOrder = [...map.keys()];

    const typed = new Map();
    typed.set(1, "number");
    typed.set("1", "string");

    const plain = {};
    plain[user] = "用户一";
    const plainKeys = Object.keys(plain);

    const setFromList = new Set([1, 2, 2, 3]);
    const setNaN = new Set([NaN, NaN]);
    const setZero = new Set([0, -0]);
    const setOrder = [...new Set(["b", "a", "b"])];

    const weakMap = new WeakMap();
    weakMap.set(user, "用户一");
    const weakSet = new WeakSet();
    weakSet.add(user);

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
      if (value === undefined) return "undefined";
      if (value instanceof Map || value instanceof Set) {
        return value.constructor.name + "(" + value.size + ")";
      }
      return JSON.stringify(value);
    }

    const samples = [
      ["map.size（四组键值）", sizeBefore, "一个键值对计 1"],
      ["map.get(user)", gotUser, "对象键按引用查找"],
      ["map.get({ id: 1 })", gotLookalike, "新对象不等于原对象"],
      ["map.has(\"key\")", hasKey, "按原值匹配"],
      ["map.delete(\"key\")", deleted, "删除成功返回 true"],
      ["删除后的 map.size", sizeAfter, "少了一项"],
      ["[...map.keys()]", keysInOrder, "按插入顺序返回"],
      ["数字键与字符串键的数量", typed.size, "1 与 \"1\" 是两个键"],
      ["plain[user] 的键", plainKeys, "对象被转成 \"[object Object]\""],
      ["new Set([1, 2, 2, 3]).size", setFromList.size, "自动去重"],
      ["new Set([NaN, NaN]).size", setNaN.size, "SameValueZero 视为相同"],
      ["new Set([0, -0]).size", setZero.size, "0 与 -0 视为相同"],
      ["[...new Set([\"b\", \"a\", \"b\"])]", setOrder, "保留首次插入顺序"],
      ["weakMap.size", weakMap.size, "WeakMap 没有 size"],
      ["Object.keys(weakMap)", Object.keys(weakMap), "不能枚举"],
      ["weakMap.get(user)", weakMap.get(user), "键仍可读取"],
      ["weakSet.has(user)", weakSet.has(user), "WeakSet 只记录对象"],
      ["typeof weakMap[Symbol.iterator]", typeof weakMap[Symbol.iterator], "不可迭代"],
      ["map[\"key\"]", map["key"], "属性访问读不到条目"],
      ["map.length", map.length, "长度用 size"],
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

    console.log("map.size", sizeBefore, "after", sizeAfter);
    console.log("keys", JSON.stringify(keysInOrder));
    console.log("typed.size", typed.size);
    console.log("plain keys", JSON.stringify(plainKeys));
    console.log("set order", JSON.stringify(setOrder));
    console.log("weak size", weakMap.size);
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有二十行。两个内容相同的对象是两个键，`map.get(user)` 取到 `用户一`，用新对象读取得到 `undefined`；删除后 `size` 从 `4` 变为 `3`；`[...map.keys()]` 按插入顺序返回两个对象和数字 `1`；数字键与字符串键共两个条目；普通对象的键被转成 `"[object Object]"`；`Set` 去重后长度为 `3`，`NaN` 与 `0`/`-0` 各只保留一个；弱集合的 `size`、`keys`、迭代器都不可用；`map["key"]` 与 `map.length` 均为 `undefined`。控制台六条输出与表格一致。

| 表达式 | 结果 | 说明 |
|--------|------|------|
| `map.size`（四组键值） | `4` | 一个键值对计 `1` |
| `map.get(user)` | `"用户一"` | 对象键按引用查找 |
| `map.get({ id: 1 })` | `undefined` | 新对象不等于原对象 |
| `map.has("key")` | `true` | 按原值匹配 |
| `map.delete("key")` | `true` | 删除成功返回 `true` |
| 删除后的 `map.size` | `3` | 少了一项 |
| `[...map.keys()]` | `[{"id":1},{"id":1},1]` | 按插入顺序返回 |
| 数字键与字符串键的数量 | `2` | `1` 与 `"1"` 是两个键 |
| `plain[user]` 的键 | `["[object Object]"]` | 对象被转成 `"[object Object]"` |
| `new Set([1, 2, 2, 3]).size` | `3` | 自动去重 |
| `new Set([NaN, NaN]).size` | `1` | SameValueZero 视为相同 |
| `new Set([0, -0]).size` | `1` | `0` 与 `-0` 视为相同 |
| `[...new Set(["b", "a", "b"])]` | `["b","a"]` | 保留首次插入顺序 |
| `weakMap.size` | `undefined` | `WeakMap` 没有 `size` |
| `Object.keys(weakMap)` | `[]` | 不能枚举 |
| `weakMap.get(user)` | `"用户一"` | 键仍可读取 |
| `weakSet.has(user)` | `true` | `WeakSet` 只记录对象 |
| `typeof weakMap[Symbol.iterator]` | `"undefined"` | 不可迭代 |
| `map["key"]` | `undefined` | 属性访问读不到条目 |
| `map.length` | `undefined` | 长度用 `size` |

### 3. 失败分支

创建 `weak-key.html`，写入 `new WeakMap().set("key", "值")`。字符串是原始值，不能作为弱集合的键，Console 显示 `TypeError: Invalid value used as weak map key`。修复是把键改成对象，例如先建一个对象保存数据，再以它为键。

创建 `weak-iterate.html`，对已写入条目的 `WeakMap` 使用 `[...weakMap]`。弱集合没有迭代器，Console 显示 `TypeError: weakMap is not iterable`。需要遍历键值对时改用 `Map`；弱集合只适合按已知对象键读取。

另一类错误不抛异常：用 `map["key"]` 读取条目得到 `undefined`，或把 `map.length` 当作条目数。`Map` 不是普通对象，读写都要走方法，条目数用 `size`。

## 六、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格二十行与控制台六条输出与正文一致；`weak-key.html` 得到 `TypeError: Invalid value used as weak map key`，`weak-iterate.html` 得到 `TypeError: weakMap is not iterable`。三个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有观测弱集合条目的实际回收时刻、集合在不同数据规模下的性能，以及 `Map` 与普通对象在序列化上的差异；这些行为需要按目标环境和具体数据核对。
