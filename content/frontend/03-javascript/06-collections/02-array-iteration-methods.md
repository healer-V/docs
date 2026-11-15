---
title: "数组迭代与高阶方法"
tags:
  - JavaScript
  - 数组
  - map
  - reduce
  - sort
excerpt: "说明迭代方法回调收到的参数与返回值差异，对照 map、filter、find、some、every 的返回结果，讲解 reduce 的累加器与初始值、flat/flatMap 的展开层数、sort 默认的字符串比较与原地修改，并给出回调副作用与漏写 return 的观察页。"
date: 2026-11-15
---

# 数组迭代与高阶方法

数组的迭代方法接收一个回调，对每个元素执行一次。`map` 返回等长的新数组，`filter` 返回满足条件的子集，`find` 返回第一个匹配的元素，`some` 和 `every` 返回布尔值，`forEach` 没有返回值。选错方法通常不报错，只是拿到 `undefined` 或错误的结构。

`reduce` 把数组归并成一个值，累加器的初始值决定空数组时是否抛错。`sort` 默认按字符串比较，`[10, 9, 1].sort()` 得到 `[1, 10, 9]`；它还直接修改原数组并返回同一个数组。`flat` 按层展开，`flatMap` 先映射再展开一层。

本篇先说明回调与返回值，再对照筛选、查找与断言，随后讲归并、展开和排序，最后处理副作用并用页面核对。

::: info 本篇的范围
本篇讲迭代方法的返回值与常见用法，不重复 `for`、`for...of` 的语法，不讨论惰性求值与性能基准。数组的增删改查见“数组创建与增删改查”，迭代器见“迭代器与生成器”。
:::

## 一、回调参数与返回值

### 1. 回调收到的三个参数

多数迭代方法传给回调三个参数：当前元素、当前下标和原数组。只用元素时可以省略后两个；需要位置信息时按下标取。回调的返回值决定方法的行为，例如 `map` 收集它，`filter` 用它判断是否保留。

```js
const tasks = [{ id: 1 }, { id: 2 }];
const labels = tasks.map((task, index, array) => index + "/" + array.length + "/" + task.id);
console.log(labels); // ["0/2/1", "1/2/2"]
```

### 2. map 返回新数组

`map` 对每个元素调用回调，把返回值按原顺序组成新数组，长度不变。原数组不被修改；如果回调没有返回值，新数组对应位置就是 `undefined`。

```js
const titles = ["write", "fix"];
console.log(titles.map((title) => title.toUpperCase())); // ["WRITE", "FIX"]
console.log(titles); // ["write", "fix"]
```

### 3. forEach 只负责执行

`forEach` 对每个元素执行回调，忽略回调的返回值，自身返回 `undefined`。它适合执行有副作用的操作，例如打印或写外部数组；需要结果时应当使用 `map`，否则把 `forEach` 的返回值赋给变量只会得到 `undefined`。

```js
const titles = ["write", "fix"];
const upper = titles.map((title) => title.toUpperCase());
const ignored = titles.forEach((title) => title.toUpperCase());
console.log(upper); // ["WRITE", "FIX"]
console.log(ignored); // undefined
```

## 二、筛选、查找与断言

### 1. filter 保留满足条件的元素

`filter` 用回调的返回值判断每个元素是否保留，返回由保留元素组成的新数组，原数组不变。回调返回真值的元素进入结果，返回假值的被丢弃；结果长度小于或等于原长度。

```js
const numbers = [1, 2, 3, 4];
console.log(numbers.filter((n) => n % 2 === 0)); // [2, 4]
console.log(numbers); // [1, 2, 3, 4]
```

### 2. find 与 findIndex

`find` 返回第一个满足条件的元素，找不到时返回 `undefined`；`findIndex` 返回它的下标，找不到时返回 `-1`。两者都在命中后立即停止，适合查找唯一对象；需要全部匹配项时用 `filter`。

```js
const users = [{ name: "Ada" }, { name: "Bob" }];
console.log(users.find((user) => user.name === "Bob")); // { name: "Bob" }
console.log(users.findIndex((user) => user.name === "Bob")); // 1
console.log(users.find((user) => user.name === "Cy")); // undefined
```

### 3. some 与 every 的短路

`some` 在遇到第一个满足条件的元素时返回 `true`，`every` 在遇到第一个不满足条件的元素时返回 `false`，两者都会提前停止遍历。因此回调执行的次数可能少于数组长度；空数组上 `some` 返回 `false`，`every` 返回 `true`。

```js
let calls = 0;
const found = [1, 2, 3].some((n) => {
  calls += 1;
  return n > 1;
});
console.log(found, calls); // true 2
```

## 三、归并、展开与排序

### 1. reduce 的累加器

`reduce` 把数组压缩成一个值。回调收到累加器、当前元素、下标和原数组，返回值成为下一轮的累加器。每轮必须返回累加器，漏写时下一轮拿到 `undefined`，随后通常在读取属性时抛错。

```js
const byId = [{ id: 1, title: "写文档" }, { id: 2, title: "修缺陷" }].reduce((acc, task) => {
  acc[task.id] = task.title;
  return acc;
}, {});
console.log(byId); // { "1": "写文档", "2": "修缺陷" }
```

### 2. 提供初始值

第二个参数是累加器的初始值。省略时用第一个元素作为初始累加器，从第二个元素开始遍历；空数组且没有初始值会抛 `TypeError`。给出初始值能让空数组得到确定结果，也能固定累加器的类型。

```js
console.log([1, 2, 3].reduce((sum, n) => sum + n, 0)); // 6
console.log([].reduce((sum, n) => sum + n, 0)); // 0
```

### 3. flat 与 flatMap

`flat` 按给定深度展开嵌套数组，默认深度为 `1`，传入 `Infinity` 可完全展开；它会跳过空位。`flatMap` 先用回调映射每个元素，再把结果展开一层，等价于 `map` 后接 `flat()`，但只展开一层。

```js
console.log([1, [2, [3]]].flat()); // [1, 2, [3]]
console.log([1, [2, [3]]].flat(2)); // [1, 2, 3]
console.log(["a b", "c d"].flatMap((text) => text.split(" "))); // ["a", "b", "c", "d"]
```

### 4. sort 默认按字符串比较

不传比较函数时，`sort` 把元素转成字符串再按 UTF-16 码元比较。`[10, 9, 1, 100]` 的顺序因此变成 `[1, 10, 100, 9]`，数字比较必须传入比较函数。比较函数返回负数表示第一个元素排在前，返回正数表示排在后。

```js
const numbers = [10, 9, 1, 100];
console.log([...numbers].sort()); // [1, 10, 100, 9]
console.log([...numbers].sort((a, b) => a - b)); // [1, 9, 10, 100]
```

### 5. sort 原地修改

`sort` 直接重排原数组，并把同一个数组作为返回值。用 `const sorted = list.sort()` 之后，`sorted` 和 `list` 是同一个引用，改动其一另一处也会变化。需要保留原顺序时先复制：`[...list].sort(...)` 或 `list.slice().sort(...)`。

```js
const numbers = [3, 1, 2];
const sorted = numbers.sort((a, b) => a - b);
console.log(sorted); // [1, 2, 3]
console.log(sorted === numbers); // true
```

## 四、链式调用与副作用

### 1. 链式调用

迭代方法返回数组时可以继续调用下一个方法，形成一条处理链。`filter` 先缩小范围，`map` 再转换结构，`reduce` 最后汇总；每一段只做一件事，链条从左到右阅读，中间结果不落地。链条过长时拆成具名中间变量更易调试。

```js
const tasks = [
  { title: "写文档", done: true },
  { title: "修缺陷", done: false },
];
const undone = tasks.filter((task) => !task.done).map((task) => task.title);
console.log(undone); // ["修缺陷"]
```

### 2. 用 forEach 累积外部结果

`forEach` 的回调可以修改外部数组，把结果推入其中。这种写法能工作，但结果依赖回调之外的变量，复用和测试都更麻烦；同样的任务用 `filter` 加 `map` 表达，结果直接由返回值给出。

```js
const result = [];
[1, 2, 3].forEach((n) => result.push(n * 2));
console.log(result); // [2, 4, 6]
console.log([1, 2, 3].map((n) => n * 2)); // [2, 4, 6]
```

### 3. 漏写 return

箭头函数写成块体 `{ }` 时，必须显式 `return`；写成表达式体时才自动返回。块体里只写 `n * 2;` 不会报错，但每个元素都映射为 `undefined`。发现结果是 `undefined` 数组时，先检查回调的写法。

```js
const doubled = [1, 2, 3].map((n) => {
  n * 2;
});
console.log(doubled); // [undefined, undefined, undefined]
```

## 五、从空目录观察迭代方法

### 1. 创建页面

新建空目录 `js-iteration`，创建 `index.html`。脚本用同一组任务数据依次执行 `map`、`filter`、`find`、`some`、`every`、`reduce`，并对照 `forEach` 的返回值、带下标的 `map`、字符串比较的 `sort`、原地排序、`flat` 与 `flatMap`，以及漏写 `return` 的回调。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>数组迭代方法观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>数组迭代方法观察</h1>
  <table id="output">
    <thead><tr><th>表达式</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const tasks = [
      { id: 1, title: "写文档", done: true, priority: 2 },
      { id: 2, title: "修缺陷", done: false, priority: 1 },
      { id: 3, title: "评审代码", done: false, priority: 3 },
      { id: 4, title: "发布", done: true, priority: 1 },
    ];

    const titles = tasks.map((task) => task.title);
    const doneTitles = tasks.filter((task) => task.done).map((task) => task.title);
    const firstUndone = tasks.find((task) => !task.done);
    const missing = tasks.find((task) => task.id === 99);
    const anyUndone = tasks.some((task) => !task.done);
    const allDone = tasks.every((task) => task.done);
    const totalPriority = tasks.reduce((sum, task) => sum + task.priority, 0);
    const titlesById = tasks.reduce((acc, task) => {
      acc[task.id] = task.title;
      return acc;
    }, {});
    const forEachResult = tasks.forEach(() => {});
    const indexOrder = tasks.map((task, index) => index + ":" + task.id);

    const numbers = [10, 9, 1, 100];
    const defaultSorted = [...numbers].sort();
    const numericSorted = [...numbers].sort((a, b) => a - b);
    const inPlace = [3, 1, 2];
    const sortedReturn = inPlace.sort((a, b) => a - b);

    const nested = [1, [2, [3]]];
    const flatOnce = nested.flat();
    const flatTwice = nested.flat(2);
    const flatMapped = ["a b", "c d"].flatMap((text) => text.split(" "));

    const noReturn = [1, 2, 3].map((value) => {
      value * 2;
    });

    const pushed = [];
    tasks.filter((task) => !task.done).forEach((task) => pushed.push(task.title));

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
      if (value === undefined) return "undefined";
      if (Array.isArray(value)) {
        const items = value.map((item) => (item === undefined ? "undefined" : JSON.stringify(item)));
        return "[" + items.join(",") + "]";
      }
      return JSON.stringify(value);
    }

    const samples = [
      ["map 取标题", titles, "返回等长新数组"],
      ["filter 后 map", doneTitles, "只保留已完成"],
      ["find 第一个未完成", firstUndone.title, "返回元素本身"],
      ["find 找不到", missing, "返回 undefined"],
      ["some 存在未完成", anyUndone, "找到真值即返回"],
      ["every 全部完成", allDone, "遇到假值即返回 false"],
      ["reduce 累加 priority", totalPriority, "提供初始值 0"],
      ["reduce 构造对象", titlesById, "累加器需要 return"],
      ["forEach 返回值", forEachResult, "总是 undefined"],
      ["map 可读 index", indexOrder, "第二个参数是下标"],
      ["[...numbers].sort()", defaultSorted, "默认按字符串比较"],
      ["[...numbers].sort((a, b) => a - b)", numericSorted, "提供数值比较函数"],
      ["numbers 是否被改变", numbers, "排序的是副本"],
      ["sort 的返回值", sortedReturn, "返回排好序的数组"],
      ["返回值 === inPlace", sortedReturn === inPlace, "返回的是原数组本身"],
      ["[1, [2, [3]]].flat()", flatOnce, "只展开一层"],
      ["[1, [2, [3]]].flat(2)", flatTwice, "展开两层"],
      ["flatMap 拆分字符串", flatMapped, "映射后再展开一层"],
      ["箭头函数体漏写 return", noReturn, "得到 undefined"],
      ["在 forEach 中 push", pushed, "修改了外部数组"],
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

    console.log("titles", JSON.stringify(titles));
    console.log("doneTitles", JSON.stringify(doneTitles));
    console.log("totalPriority", totalPriority);
    console.log("defaultSorted", JSON.stringify(defaultSorted));
    console.log("numericSorted", JSON.stringify(numericSorted));
    console.log("flatOnce", JSON.stringify(flatOnce));
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有二十行。`map` 返回等长新数组，`filter` 加 `map` 只留下已完成的两项；`find` 返回元素本身，找不到时为 `undefined`；`some` 为 `true`、`every` 为 `false`；`reduce` 的累加结果为 `7`，构造出的对象以 `id` 为键；`forEach` 返回 `undefined`；默认 `sort` 得到 `[1,10,100,9]`，数值比较得到 `[1,9,10,100]`，且排序副本后 `numbers` 未变；`sort` 的返回值与原数组是同一引用；`flat()` 只展开一层；漏写 `return` 的映射结果是三个 `undefined`。控制台六条输出与表格一致。

| 表达式 | 结果 | 说明 |
|--------|------|------|
| `map` 取标题 | `["写文档","修缺陷","评审代码","发布"]` | 返回等长新数组 |
| `filter` 后 `map` | `["写文档","发布"]` | 只保留已完成 |
| `find` 第一个未完成 | `"修缺陷"` | 返回元素本身 |
| `find` 找不到 | `undefined` | 返回 `undefined` |
| `some` 存在未完成 | `true` | 找到真值即返回 |
| `every` 全部完成 | `false` | 遇到假值即返回 `false` |
| `reduce` 累加 `priority` | `7` | 提供初始值 `0` |
| `reduce` 构造对象 | `{"1":"写文档","2":"修缺陷","3":"评审代码","4":"发布"}` | 累加器需要 `return` |
| `forEach` 返回值 | `undefined` | 总是 `undefined` |
| `map` 可读 `index` | `["0:1","1:2","2:3","3:4"]` | 第二个参数是下标 |
| `[...numbers].sort()` | `[1,10,100,9]` | 默认按字符串比较 |
| `[...numbers].sort((a, b) => a - b)` | `[1,9,10,100]` | 提供数值比较函数 |
| `numbers` 是否被改变 | `[10,9,1,100]` | 排序的是副本 |
| `sort` 的返回值 | `[1,2,3]` | 返回排好序的数组 |
| 返回值 `=== inPlace` | `true` | 返回的是原数组本身 |
| `[1, [2, [3]]].flat()` | `[1,2,[3]]` | 只展开一层 |
| `[1, [2, [3]]].flat(2)` | `[1,2,3]` | 展开两层 |
| `flatMap` 拆分字符串 | `["a","b","c","d"]` | 映射后再展开一层 |
| 箭头函数体漏写 `return` | `[undefined,undefined,undefined]` | 得到 `undefined` |
| 在 `forEach` 中 `push` | `["修缺陷","评审代码"]` | 修改了外部数组 |

### 3. 失败分支

创建 `reduce-empty.html`，写入 `[].reduce((sum, value) => sum + value);`。数组为空又没有初始值，`reduce` 没有可用的累加器，Console 显示 `TypeError: Reduce of empty array with no initial value`。修复是补上初始值，或先判断数组是否为空。

另一类问题不产生异常。`sort` 不传比较函数时按字符串排序，数字会得到 `[1, 10, 100, 9]` 这种顺序；回调漏写 `return` 时 `map` 得到 `undefined` 数组。两者都正常结束，只能靠核对结果发现，所以表格中的返回值比“有没有报错”更值得关注。

## 六、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格二十行与控制台六条输出与正文一致；`reduce-empty.html` 得到 `TypeError: Reduce of empty array with no initial value`。两个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有展开 `toSorted`、`toReversed` 等较新方法、稀疏数组在不同迭代方法中的处理差异，以及大数组上的性能比较；需要这些能力时，应按目标环境核对可用性与实际表现。
