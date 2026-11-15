---
title: "数组创建与增删改查"
tags:
  - JavaScript
  - 数组
  - splice
  - 浅复制
excerpt: "说明数组字面量与 Array.from 的创建方式、索引读写与 length 的可写性，对照 push/pop、unshift/shift、splice/slice 的返回值与副作用，并解释 delete 留下的空位和浅复制的共享问题。"
date: 2026-11-15
---

# 数组创建与增删改查

数组是有序的值集合，用下标访问，`length` 表示元素个数。`push`、`pop` 在末尾增删，`unshift`、`shift` 在开头增删，`splice` 在任意位置增删改，`slice` 返回一段副本。区分这些方法的关键是：返回什么，以及是否修改原数组。

`length` 可写，改小会截断数组，改大会补空位；`delete` 删除元素但不改变长度，留下空位。`indexOf` 和 `includes` 查找元素的规则不同，对 `NaN` 的结果相反。切片和展开都只复制一层，元素是对象时仍共享引用。

本篇先说明创建方式，再对照增删方法，随后处理长度、空位与复制边界，最后用页面核对。

::: info 本篇的范围
本篇讲数组的基础增删改查，不展开 `map`、`filter`、`reduce` 等高阶方法和性能比较。迭代方法见“数组迭代与高阶方法”，`Map`/`Set` 见“Map、Set 与 Weak 集合”。
:::

## 一、创建数组

### 1. 数组字面量

方括号内用逗号分隔元素即可创建数组，元素可以是任意类型，也可以嵌套。下标从 `0` 开始，读取越界返回 `undefined`，写入越界会扩大数组并在中间留下空位。

```js
const list = ["a", "b", "c"];
console.log(list[0]); // "a"
list[1] = "B";
console.log(list); // ["a", "B", "c"]
```

### 2. Array.from

`Array.from` 从可迭代对象或类数组对象创建新数组，第二个参数是映射函数。它可以把字符串拆成字符数组，也可以按长度生成序列；与 `new Array(n)` 不同，`Array.from` 的结果没有空位。

```js
console.log(Array.from("abc")); // ["a", "b", "c"]
console.log(Array.from({ length: 3 }, (_, i) => i * 2)); // [0, 2, 4]
```

### 3. 索引写入与长度

给不存在的下标赋值会扩展数组，中间未赋值的索引成为空位。`length` 自动等于最大下标加一，空位读取为 `undefined`，但不会被 `Object.keys` 或 `forEach` 访问到。

```js
const list = [];
list[2] = "c";
console.log(list.length); // 3
console.log(list[0]); // undefined
```

## 二、增删操作

### 1. push 与 pop

`push` 在末尾添加一个或多个元素，返回新长度；`pop` 移除并返回末尾元素，数组为空时返回 `undefined`。两者都直接修改原数组，并且只影响末尾。

```js
const list = ["a"];
console.log(list.push("b")); // 2
console.log(list.pop()); // "b"
console.log(list); // ["a"]
```

### 2. unshift 与 shift

`unshift` 在开头插入元素，返回新长度；`shift` 移除并返回开头元素。它们会移动其余元素的下标，数据量大时比末尾操作更耗时，但用法与 `push`/`pop` 对称。

```js
const list = ["b"];
console.log(list.unshift("a")); // 2
console.log(list.shift()); // "a"
console.log(list); // ["b"]
```

### 3. splice 增删改

`splice(开始下标, 删除个数, ...插入元素)` 修改原数组，返回被删除元素组成的新数组。删除个数为 `0` 时只插入不删除，省略后续参数时只删除。插入元素写在第三个参数之后，可以一次插入多个。

```js
const list = ["a", "b", "c"];
console.log(list.splice(1, 1, "B")); // ["b"]
console.log(list); // ["a", "B", "c"]
const inserted = ["a", "c"];
console.log(inserted.splice(1, 0, "b")); // []
console.log(inserted); // ["a", "b", "c"]
```

### 4. slice 返回副本

`slice(开始, 结束)` 返回新数组，包含开始下标、不包含结束下标，原数组不变。省略结束下标时取到末尾，支持负下标从末尾计算。需要保留原数组时用 `slice`，需要修改原数组时用 `splice`。

```js
const list = ["a", "B", "c"];
console.log(list.slice(0, 2)); // ["a", "B"]
console.log(list.slice(-1)); // ["c"]
console.log(list); // ["a", "B", "c"]
```

## 三、查找、长度与复制

### 1. indexOf 与 includes

`indexOf` 用严格相等查找，返回下标或 `-1`；`includes` 用 SameValueZero 比较，能找到 `NaN`。两者对 `NaN` 的结果不同，查找数值时要注意这个差异；`includes` 还接受起始位置参数。

```js
const values = [NaN, 1];
console.log(values.indexOf(NaN)); // -1
console.log(values.includes(NaN)); // true
```

### 2. 修改 length 的后果

给 `length` 赋一个更小的值会截断数组，被截掉的元素无法恢复；赋更大的值会在末尾补空位。截断是原地修改，不会返回被删除的元素，误操作时很难恢复数据。

```js
const list = ["a", "b", "c"];
list.length = 1;
console.log(list); // ["a"]
console.log(list.length); // 1
```

### 3. delete 留下空位

`delete list[i]` 删除该索引上的元素，但 `length` 不变，位置变成空位。空位与值为 `undefined` 的元素不同：空位不在 `Object.keys` 中，迭代方法通常会跳过它。删除元素应使用 `splice`。

```js
const list = ["a", "b", "c"];
delete list[1];
console.log(list.length); // 3
console.log(list[1]); // undefined
console.log(Object.keys(list)); // ["0", "2"]
```

### 4. slice 与展开的浅复制

`slice()` 和 `[...list]` 都创建新数组，但只复制第一层。元素是对象时，新数组与原数组共享同一个对象，修改副本中的对象会影响原数组。需要独立副本时使用 `structuredClone` 或逐层复制。

```js
const items = [{ id: 1 }];
const copy = items.slice();
copy[0].id = 2;
console.log(items[0].id); // 2
```

## 四、从空目录观察数组操作

### 1. 创建页面

新建空目录 `js-arrays`，创建 `index.html`。脚本对同一个数组依次执行 `push`、`pop`、`unshift`、`shift`、`splice`、`slice`，记录每次的返回值与数组状态，并对照 `indexOf` 与 `includes`、`length` 截断、`delete` 空位和浅复制。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>数组操作观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>数组操作观察</h1>
  <table id="output">
    <thead><tr><th>表达式</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const list = ["a", "b", "c"];
    const afterPush = list.push("d");
    const popped = list.pop();
    const afterUnshift = list.unshift("z");
    const shifted = list.shift();
    const removed = list.splice(1, 1, "B");
    const afterSplice = [...list];
    const sliced = list.slice(0, 2);
    const afterSliceList = [...list];
    const noRemove = list.splice(1, 0, "X");
    const afterNoRemove = [...list];

    const numbers = [NaN, 1];
    const indexOfNaN = numbers.indexOf(NaN);
    const includesNaN = numbers.includes(NaN);

    const shrink = ["a", "b", "c"];
    shrink.length = 1;

    const holes = ["a", "b", "c"];
    delete holes[1];

    const fromString = Array.from("abc");
    const fromLength = Array.from({ length: 3 }, (_, i) => i * 2);

    const items = [{ id: 1 }];
    const shallow = items.slice();
    shallow[0].id = 2;

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
      if (value === undefined) return "undefined";
      return JSON.stringify(value);
    }

    const samples = [
      ["push(\"d\") 返回值", afterPush, "新长度"],
      ["pop() 返回值", popped, "被移除的末尾元素"],
      ["unshift(\"z\") 返回值", afterUnshift, "新长度"],
      ["shift() 返回值", shifted, "被移除的开头元素"],
      ["splice(1, 1, \"B\")", removed, "返回被删除的元素"],
      ["splice 后的 list", afterSplice, "原数组被修改"],
      ["slice(0, 2)", sliced, "返回新数组"],
      ["list 未被 slice 修改", afterSliceList, "—"],
      ["splice(1, 0, \"X\")", noRemove, "删除 0 个，返回空数组"],
      ["splice(1, 0, \"X\") 后的 list", afterNoRemove, "插入了 X"],
      ["[NaN, 1].indexOf(NaN)", indexOfNaN, "找不到 NaN"],
      ["[NaN, 1].includes(NaN)", includesNaN, "能找到 NaN"],
      ["length = 1 后的 shrink", shrink, "末尾元素被丢弃"],
      ["delete holes[1] 后的 length", holes.length, "长度不变"],
      ["holes[1]", holes[1], "留下空位"],
      ["Object.keys(holes)", Object.keys(holes), "索引 1 不在键中"],
      ["Array.from(\"abc\")", fromString, "从字符串创建"],
      ["Array.from({ length: 3 }, ...)", fromLength, "映射函数生成"],
      ["shallow[0].id 修改后 items[0].id", items[0].id, "浅复制共享对象"],
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

    console.log("push 返回", afterPush);
    console.log("splice 删除", JSON.stringify(removed));
    console.log("splice 后", JSON.stringify(afterSplice));
    console.log("indexOf NaN", indexOfNaN, "includes NaN", includesNaN);
    console.log("holes keys", JSON.stringify(Object.keys(holes)));
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有十九行。`push`、`unshift` 返回新长度，`pop`、`shift` 返回被移除的元素；`splice` 返回被删除的元素并修改原数组，`slice` 不修改原数组；`splice(1, 0, "X")` 返回空数组但插入了元素；`indexOf(NaN)` 为 `-1`，`includes(NaN)` 为 `true`；`length = 1` 后只剩一个元素；`delete` 后长度为 `3`，索引 `1` 不在键中；`Array.from` 生成两个数组；浅复制后原对象的值被改为 `2`。控制台五条输出与表格一致。

| 表达式 | 结果 | 说明 |
|--------|------|------|
| `push("d")` 返回值 | `4` | 新长度 |
| `pop()` 返回值 | `"d"` | 被移除的末尾元素 |
| `unshift("z")` 返回值 | `4` | 新长度 |
| `shift()` 返回值 | `"z"` | 被移除的开头元素 |
| `splice(1, 1, "B")` | `["b"]` | 返回被删除的元素 |
| `splice` 后的 `list` | `["a","B","c"]` | 原数组被修改 |
| `slice(0, 2)` | `["a","B"]` | 返回新数组 |
| `list` 未被 `slice` 修改 | `["a","B","c"]` | — |
| `splice(1, 0, "X")` | `[]` | 删除 `0` 个，返回空数组 |
| `splice(1, 0, "X")` 后的 `list` | `["a","X","B","c"]` | 插入了 `X` |
| `[NaN, 1].indexOf(NaN)` | `-1` | 找不到 `NaN` |
| `[NaN, 1].includes(NaN)` | `true` | 能找到 `NaN` |
| `length = 1` 后的 `shrink` | `["a"]` | 末尾元素被丢弃 |
| `delete holes[1]` 后的 `length` | `3` | 长度不变 |
| `holes[1]` | `undefined` | 留下空位 |
| `Object.keys(holes)` | `["0","2"]` | 索引 `1` 不在键中 |
| `Array.from("abc")` | `["a","b","c"]` | 从字符串创建 |
| `Array.from({ length: 3 }, ...)` | `[0,2,4]` | 映射函数生成 |
| `shallow[0].id` 修改后 `items[0].id` | `2` | 浅复制共享对象 |

### 3. 失败分支

创建 `truncate.html`，把数组的 `length` 改为 `1`。控制台输出截断前 `["a","b","c"]`、截断后 `["a"]`，长度变为 `1`，被截掉的元素没有返回值，也无法从数组恢复。需要保留数据时先复制数组，再对副本截断。

另一个常见错误是 `splice` 参数顺序写反，或在只想插入时误传了删除个数。页面中的 `splice(1, 0, "X")` 返回空数组，说明删除个数为 `0`；如果写成 `splice(1, 1, "X")`，会同时删掉一个元素。调用前先明确“从哪开始、删几个、插入什么”。

## 五、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格十九行与控制台五条输出与正文一致；`truncate.html` 输出截断前后与长度，未产生运行时错误。两个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有展开 `map`、`filter`、`reduce` 等迭代方法、稀疏数组的全部行为和数组性能比较；需要处理空位或大规模数据时，应按具体方法与目标环境核对。
