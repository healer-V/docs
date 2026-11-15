---
title: "内置对象：JSON、Date 与 Math"
tags:
  - JavaScript
  - JSON
  - Date
  - Math
excerpt: "说明 JSON.stringify 会省略或转换哪些值、reviver 与 replacer 的最小用法、循环引用为什么报错，解释 Date 的时间戳与本地/UTC 差异、字符串解析不一致，以及 Math 的舍入和随机数边界。"
date: 2026-11-15
---

# 内置对象：JSON、Date 与 Math

`JSON` 负责在字符串与值之间转换，常用于存储和网络传输。它只支持有限的值类型：对象属性值为 `undefined`、函数或 `Symbol` 时会被省略，数组中的这些值变成 `null`，`NaN` 和 `Infinity` 也变成 `null`。日期会被序列化成字符串，解析回来不会自动变成 `Date`。

`Date` 内部保存时间戳，提供本地时区和 UTC 两套读取方法。纯日期字符串按 UTC 解析，带斜杠的写法按本地时间解析，同一个日期可能差出时区偏移。`Math` 提供舍入和随机数，`Math.round` 对负数的方向与直觉不同，`Math.random` 不能用于安全场景。

本篇先说明 JSON 的转换规则，再介绍 Date 的读取与解析，随后处理 Math 的边界，最后用页面核对。

::: info 本篇的范围
本篇讲这三个内置对象的基础用法，不实现日期库和格式化课程，也不讨论加密随机数。浮点精度见“数字与精度”，对象复制见“属性描述符、复制与不可变”。
:::

## 一、JSON

### 1. stringify 的转换规则

`JSON.stringify` 把值转成 JSON 字符串。对象中值为 `undefined`、函数或 `Symbol` 的属性会被省略；数组中这些值变成 `null`；`NaN` 和 `Infinity` 也变成 `null`。日期对象会调用自身的 `toJSON()`，得到 ISO 字符串。

```js
console.log(JSON.stringify({ a: undefined, b: null, c: NaN, d: Infinity }));
// {"b":null,"c":null,"d":null}
console.log(JSON.stringify([undefined, function () {}, Symbol("x")]));
// [null,null,null]
console.log(JSON.stringify(new Date(0)));
// "1970-01-01T00:00:00.000Z"
```

### 2. 解析与 reviver

`JSON.parse` 把 JSON 字符串还原成值。默认情况下，日期字符串仍然是字符串，类型信息已经丢失。第二个参数 `reviver` 会在每个键值对上调用，可以按需把特定字段还原成对象。

```js
const text = '{"created":"2024-03-01T00:00:00.000Z"}';
const plain = JSON.parse(text);
console.log(typeof plain.created); // "string"
const parsed = JSON.parse(text, (key, value) =>
  key === "created" ? new Date(value) : value
);
console.log(parsed.created instanceof Date); // true
```

### 3. replacer 过滤字段

`JSON.stringify` 的第二个参数 `replacer` 可以返回 `undefined` 来省略属性，适合在输出前移除密码、令牌等敏感字段。它只影响序列化结果，不修改原对象。

```js
const account = { name: "Ada", secret: "123456", token: "abc" };
const safe = JSON.stringify(account, (key, value) =>
  key === "secret" || key === "token" ? undefined : value
);
console.log(safe); // {"name":"Ada"}
```

## 二、Date

### 1. 时间戳与 UTC 读取

`Date` 保存的是毫秒时间戳，`getTime()` 返回它。`toISOString()` 按 UTC 输出固定格式；`getUTCFullYear()`、`getUTCHours()` 等方法读取 UTC 字段，不受本地时区影响。同一时刻用不同方法读到的年月日或小时可能不同。

```js
const date = new Date("2024-03-01T00:00:00Z");
console.log(date.getTime()); // 1709251200000
console.log(date.toISOString()); // "2024-03-01T00:00:00.000Z"
console.log(date.getUTCHours()); // 0
```

### 2. 本地字段与时区偏移

`getHours()`、`getFullYear()` 等本地方法按运行环境的时区返回。`getTimezoneOffset()` 返回本地时间与 UTC 的分钟差，UTC 东八区为 `-480`。跨时区展示时间时，应明确使用 UTC 还是本地字段。

```js
const date = new Date("2024-03-01T00:00:00Z");
console.log(date.getUTCHours(), date.getHours()); // 0 8（UTC+8 环境）
console.log(date.getTimezoneOffset()); // -480（UTC+8 环境）
```

### 3. 字符串解析的差异

`new Date("2024-03-01")` 这种严格 ISO 日期格式按 UTC 解析；`new Date("2024/03/01")` 不是标准格式，Chrome 按本地时间解析。两者在 UTC+8 环境中相差 8 小时。解析日期字符串时应使用 ISO 8601 格式，或显式传入年月日和时间。

```js
console.log(new Date("2024-03-01").toISOString()); // "2024-03-01T00:00:00.000Z"
console.log(new Date("2024/03/01").toISOString()); // "2024-02-29T16:00:00.000Z"（UTC+8）
```

## 三、Math

### 1. 舍入方法

`Math.round` 四舍五入到最接近的整数，`.5` 时向正无穷方向取整；`Math.floor` 向下取整，`Math.ceil` 向上取整，`Math.trunc` 直接去掉小数部分。选择哪个取决于业务对负数和边界的要求。

```js
console.log(Math.round(1.5)); // 2
console.log(Math.floor(1.9)); // 1
console.log(Math.ceil(1.1)); // 2
console.log(Math.trunc(1.9)); // 1
```

### 2. 负数的舍入

`Math.round(-1.5)` 得到 `-1`，不是 `-2`；它按“向正无穷方向”处理 `.5`。`Math.floor(-1.1)` 得到 `-2`，`Math.trunc(-1.9)` 得到 `-1`。涉及负数金额或坐标时，先确认期望的舍入方向。

```js
console.log(Math.round(-1.5)); // -1
console.log(Math.round(-1.6)); // -2
console.log(Math.floor(-1.1)); // -2
console.log(Math.trunc(-1.6)); // -1
```

### 3. 随机数与浮点格式

`Math.random()` 返回 `[0, 1)` 区间的数，包含 `0` 但不包含 `1`，不能用于密码、令牌等安全场景；需要安全随机数时使用运行环境提供的加密随机接口。格式化小数用 `toFixed`，它返回字符串，并会按位数舍入。

```js
const value = Math.random();
console.log(value >= 0 && value < 1); // true
console.log((0.1 + 0.2).toFixed(2)); // "0.30"
```

## 四、从空目录观察内置对象

### 1. 创建页面

新建空目录 `js-builtins`，创建 `index.html`。脚本序列化含特殊值的对象与数组，用 `reviver` 还原日期、用 `replacer` 移除敏感字段，读取同一时刻的 UTC 与本地字段，并对照两种日期字符串解析和几个 `Math` 结果。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>JSON、Date 与 Math 观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>JSON、Date 与 Math 观察</h1>
  <table id="output">
    <thead><tr><th>表达式</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const serialized = JSON.stringify({ a: undefined, b: null, c: NaN, d: Infinity });
    const arraySerialized = JSON.stringify([undefined, function () {}, Symbol("x")]);
    const dateSerialized = JSON.stringify(new Date(0));
    const roundTrip = JSON.parse(JSON.stringify({ created: new Date(0) }));

    const parsed = JSON.parse('{"created":"2024-03-01T00:00:00.000Z"}', (key, value) =>
      key === "created" ? new Date(value) : value
    );

    const account = { name: "Ada", secret: "123456", token: "abc" };
    const safe = JSON.stringify(account, (key, value) =>
      key === "secret" || key === "token" ? undefined : value
    );

    const date = new Date("2024-03-01T00:00:00Z");

    let inRange = true;
    for (let i = 0; i < 1000; i++) {
      const value = Math.random();
      if (value < 0 || value >= 1) inRange = false;
    }

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
      if (value === undefined) return "undefined";
      return JSON.stringify(value);
    }

    const samples = [
      ["JSON.stringify 包含 undefined/NaN", serialized, "属性被省略或转为 null"],
      ["JSON.stringify 数组中的特殊值", arraySerialized, "都转为 null"],
      ["JSON.stringify(new Date(0))", dateSerialized, "日期转为 ISO 字符串"],
      ["JSON.parse 后 created 的类型", typeof roundTrip.created, "类型丢失"],
      ["reviver 后 instanceof Date", parsed.created instanceof Date, "还原为日期对象"],
      ["reviver 后 toISOString()", parsed.created.toISOString(), "—"],
      ["replacer 过滤敏感字段", safe, "secret 与 token 被移除"],
      ["date.getTime()", date.getTime(), "时间戳"],
      ["date.toISOString()", date.toISOString(), "UTC 表示"],
      ["date.getUTCHours()", date.getUTCHours(), "UTC 小时"],
      ["date.getHours()", date.getHours(), "本地小时（UTC+8 环境）"],
      ["date.getTimezoneOffset()", date.getTimezoneOffset(), "本地与 UTC 的分钟差"],
      ["new Date(\"2024-03-01\").toISOString()", new Date("2024-03-01").toISOString(), "纯日期按 UTC 解析"],
      ["new Date(\"2024/03/01\").toISOString()", new Date("2024/03/01").toISOString(), "斜杠写法按本地时间解析"],
      ["Math.round(1.5)", Math.round(1.5), "—"],
      ["Math.round(-1.5)", Math.round(-1.5), "向正无穷方向取整"],
      ["Math.round(-1.6)", Math.round(-1.6), "—"],
      ["Math.trunc(-1.6)", Math.trunc(-1.6), "直接去掉小数部分"],
      ["(0.1 + 0.2).toFixed(2)", (0.1 + 0.2).toFixed(2), "按位数格式化"],
      ["Math.random() 1000 次范围", inRange, "都在 [0, 1) 内"],
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

    console.log("serialized", serialized);
    console.log("array", arraySerialized);
    console.log("safe", safe);
    console.log("date iso", date.toISOString());
    console.log("local hours", date.getHours(), "utc hours", date.getUTCHours());
    console.log("random in range", inRange);
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有二十行。序列化结果中 `undefined` 属性被省略，`NaN` 和 `Infinity` 变成 `null`；数组中的三个特殊值都变成 `null`；日期往返后是字符串，`reviver` 能还原为 `Date`；`replacer` 只留下 `name`；`getTime()` 为 `1709251200000`，UTC 小时为 `0`，本地小时为 `8`，偏移为 `-480`；纯日期与斜杠写法的 ISO 结果不同；`Math.round(-1.5)` 为 `-1`；1000 次随机数都在 `[0, 1)` 内。控制台六条输出与表格一致。

| 表达式 | 结果 | 说明 |
|--------|------|------|
| `JSON.stringify` 含 `undefined`/`NaN` | `{"b":null,"c":null,"d":null}` | 属性被省略或转为 `null` |
| 数组中的特殊值 | `[null,null,null]` | 都转为 `null` |
| `JSON.stringify(new Date(0))` | `"1970-01-01T00:00:00.000Z"` | 日期转为 ISO 字符串 |
| `JSON.parse` 后 `created` 的类型 | `"string"` | 类型丢失 |
| `reviver` 后 `instanceof Date` | `true` | 还原为日期对象 |
| `reviver` 后 `toISOString()` | `"2024-03-01T00:00:00.000Z"` | — |
| `replacer` 过滤敏感字段 | `{"name":"Ada"}` | `secret` 与 `token` 被移除 |
| `date.getTime()` | `1709251200000` | 时间戳 |
| `date.toISOString()` | `"2024-03-01T00:00:00.000Z"` | UTC 表示 |
| `date.getUTCHours()` | `0` | UTC 小时 |
| `date.getHours()` | `8` | 本地小时（UTC+8 环境） |
| `date.getTimezoneOffset()` | `-480` | 本地与 UTC 的分钟差 |
| `new Date("2024-03-01").toISOString()` | `"2024-03-01T00:00:00.000Z"` | 纯日期按 UTC 解析 |
| `new Date("2024/03/01").toISOString()` | `"2024-02-29T16:00:00.000Z"` | 斜杠写法按本地时间解析 |
| `Math.round(1.5)` | `2` | — |
| `Math.round(-1.5)` | `-1` | 向正无穷方向取整 |
| `Math.round(-1.6)` | `-2` | — |
| `Math.trunc(-1.6)` | `-1` | 直接去掉小数部分 |
| `(0.1 + 0.2).toFixed(2)` | `"0.30"` | 按位数格式化 |
| `Math.random()` 1000 次范围 | `true` | 都在 `[0, 1)` 内 |

### 3. 失败分支

创建 `circular-json.html`，让对象的 `self` 属性指向自己，再调用 `JSON.stringify`。循环结构无法展开，Console 显示 `TypeError: Converting circular structure to JSON`，并在后续行指出从哪个属性开始闭合成环。序列化前应移除循环引用，或为这类字段提供替代值。

创建 `bad-json.html`，解析 `{a: 1}` 这种非标准 JSON。键必须用双引号包住，Console 显示 `SyntaxError: Expected property name or '}' in JSON at position 1 (line 1 column 2)`。解析外部数据前先校验格式，并捕获 `SyntaxError`。

## 五、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。运行环境时区为 UTC+8，本地小时与偏移结果依赖该设置。表格二十行与控制台六条输出与正文一致；`circular-json.html` 得到 `TypeError: Converting circular structure to JSON` 并附带闭环路径，`bad-json.html` 得到 `SyntaxError: Expected property name or '}' in JSON at position 1 (line 1 column 2)`。三个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器、其他时区和旧版本环境，也没有展开 `Date` 的全部方法、`Intl` 格式化、`toFixed` 的浮点边界和加密随机数接口；日期字符串解析在其他环境可能不同，应优先使用 ISO 8601 格式并显式指定时区。
