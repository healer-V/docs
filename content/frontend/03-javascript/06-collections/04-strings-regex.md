---
title: "字符串处理与正则表达式"
tags:
  - JavaScript
  - 字符串
  - 正则表达式
  - RegExp
excerpt: "对照 slice 与 substring 对负下标的处理、split/trim/startsWith 等字符串方法，说明 length 按 UTF-16 码元计数的后果，讲解正则的 test/exec/match/matchAll/replace、g 与 lastIndex 的关系、命名分组与 i/m/s 标志，并给出用文本提取日期与替换的观察页。"
date: 2026-11-15
---

# 字符串处理与正则表达式

字符串是不可变的，所有方法都返回新字符串，原字符串不变。`slice` 支持负下标，`substring` 把负值当作 `0`；`split` 按分隔符切分，`trim` 去掉两端空白，`startsWith`、`includes` 判断前缀和子串。`length` 按 UTF-16 码元计数，一个 emoji 的长度是 `2`。

正则用于查找、校验和替换。`test` 返回布尔值，`exec` 返回匹配详情，`match` 按有无 `g` 标志返回不同结构，`matchAll` 返回全部匹配的迭代器，`replace` 支持字符串和函数两种替换值。带 `g` 的正则会在 `lastIndex` 上记录位置，重复调用时从上次结束处继续。

本篇先讲字符串方法，再讲码元边界，随后进入正则的创建、匹配与替换，最后用一段文本核对结果。

::: info 本篇的范围
本篇讲常用字符串方法与正则的最小用法，不写完整的正则语法课程，也不分析回溯性能。字符串的表示与转义见“字符串与模板字面量”，迭代器见“迭代器与生成器”。
:::

## 一、字符串的常用方法

### 1. 截取：slice 与 substring

`slice(start, end)` 按位置截取，负下标从末尾计算；`substring(start, end)` 位置相同时行为类似，但负值被当作 `0`，两个参数还会自动交换大小。需要“从末尾取几位”时只能用 `slice`。

```js
console.log("abcdef".slice(-3)); // "def"
console.log("abcdef".slice(1, 3)); // "bc"
console.log("abcdef".substring(-3)); // "abcdef"
```

### 2. 切分与清理

`split` 按字符串或正则切分，连续分隔符会产生空字符串；`trim` 去掉两端空白，`trimStart`、`trimEnd` 只处理一侧。读取用户输入或文件行时，先 `trim` 再判断，能避免首尾空白造成的比较失败。

```js
const line = "  name=Ada  ";
const trimmed = line.trim();
console.log(trimmed.split("=")); // ["name", "Ada"]
console.log("a,b,,c".split(",")); // ["a", "b", "", "c"]
```

### 3. 查找与大小写

`startsWith`、`endsWith`、`includes` 返回布尔值，`indexOf` 返回下标或 `-1`，找不到时不会抛错。`toUpperCase`、`toLowerCase` 返回新字符串，对非字母字符不产生影响。

```js
const file = "readme.md";
console.log(file.startsWith("read")); // true
console.log(file.includes("me")); // true
console.log("Hello".toUpperCase()); // "HELLO"
```

## 二、按字符还是按码元

### 1. length 与码点

`length` 统计的是 UTF-16 码元个数，不是视觉字符个数。基本平面外的字符（如多数 emoji）占两个码元，因此 `"👍".length` 为 `2`；`slice`、`substring` 也按码元截取，切在中间会得到半个字符。

```js
const emoji = "👍";
console.log(emoji.length); // 2
console.log([...emoji].length); // 1
console.log(emoji.slice(0, 1)); // 半个代理项，无法正常显示
```

### 2. 遍历完整字符

用 `for...of` 或展开语法遍历字符串时，按码点逐个取出，emoji 不会被拆开。需要按视觉字符计数、截断或反转时，先转成数组处理，再拼回字符串。

```js
const text = "a👍b";
console.log([...text]); // ["a", "👍", "b"]
console.log([...text].length); // 3
```

## 三、正则的创建与测试

### 1. 字面量与 RegExp 构造

正则字面量 `/pattern/flags` 在代码中固定不变，书写直观；`new RegExp(pattern, flags)` 接收字符串，适合拼接变量。`\d` 表示数字，`\w` 表示字母数字下划线，`{4}` 表示重复四次，量词与分组写在同一对斜杠之间。

```js
const text = "版本 2024-05-12 发布";
console.log(/2024-\d{2}-\d{2}/.test(text)); // true
console.log(text.match(/\d+/g)); // ["2024", "05", "12"]
```

### 2. test 与 lastIndex

`test` 判断是否存在匹配并返回布尔值。带 `g` 标志时，匹配成功后 `lastIndex` 指向匹配结束位置，下次调用从那里继续；匹配失败后 `lastIndex` 归零。不带 `g` 时 `lastIndex` 始终为 `0`，每次从头查找。

```js
const re = /\d+/g;
let match;
while ((match = re.exec("a1b22")) !== null) {
  console.log(match[0], re.lastIndex);
}
// 1 2
// 22 5
```

### 3. 从用户输入构造正则

`new RegExp` 的字符串参数会被当作正则源码，用户输入中的 `.`、`+`、`*` 等字符会变成元字符，导致匹配范围意外扩大。把输入拼进正则前必须先转义；不确定内容是否安全时，改用 `includes` 等字符串方法。

```js
const input = "1+1";
console.log(new RegExp(input).test("11")); // true，+ 被当成量词
console.log(new RegExp(input).test("1+1")); // false
console.log(new RegExp("1\\+1").test("1+1")); // true
```

## 四、匹配、分组与替换

### 1. match 与全局标志

`match` 的结果结构取决于 `g` 标志：不带 `g` 时返回首个匹配的数组，附带 `index` 和 `input`，捕获组按下标排列；带 `g` 时只返回所有匹配的字符串，不包含位置与分组信息。

```js
const text = "订单 A-2024-05-12";
console.log(text.match(/\d{4}-\d{2}-\d{2}/)); // ["2024-05-12"]，index 为 5
console.log(text.match(/\d{4}-\d{2}-\d{2}/g)); // ["2024-05-12"]
```

### 2. matchAll 与命名分组

`matchAll` 必须带 `g` 标志，返回包含全部匹配详情的迭代器，每个元素都有 `index` 和 `groups`。命名分组写成 `(?<name>...)`，通过 `groups.name` 读取，比按数字下标更易读。

```js
const text = "2024-05-12";
const result = /(?<year>\d{4})-(?<month>\d{2})/.exec(text);
console.log(result.groups); // { year: "2024", month: "05" }
```

### 3. replace 与替换函数

`replace` 只替换第一个匹配，`replaceAll` 或带 `g` 的 `replace` 替换全部。替换值可以是字符串，`$1` 引用捕获组；也可以是函数，参数依次是匹配内容、各捕获组、位置和原字符串，返回值作为替换结果。

```js
console.log("a1b2".replace(/\d/g, "#")); // "a#b#"
console.log("a1b2".replace(/(\d)/g, (match, digit) => "[" + digit + "]")); // "a[1]b[2]"
```

### 4. 标志 i、m、s

`i` 忽略大小写，`m` 让 `^`、`$` 匹配每一行的开头和结尾，`s` 让 `.` 匹配换行符。`. ` 默认不匹配换行，跨行文本要提取内容时容易漏掉最后一行，这时加 `s` 或改用 `[\s\S]` 这类写法。

```js
console.log(/abc/i.test("ABC")); // true
console.log(/^b/m.test("a\nb")); // true
console.log(/a.b/s.test("a\nb")); // true
```

## 五、从空目录观察字符串与正则

### 1. 创建页面

新建空目录 `js-strings-regex`，创建 `index.html`。脚本对一段包含订单号与金额的文本执行截取、切分、查找与码点计数，再用正则测试、提取日期、读取命名分组、替换日期与金额，并记录带 `g` 与不带 `g` 的 `exec` 后 `lastIndex` 的变化。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>字符串与正则观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>字符串与正则观察</h1>
  <table id="output">
    <thead><tr><th>表达式</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const text = "订单 A-2024-05-12 金额 128 元，订单 B-2024-06-03 金额 256 元";

    const trimmed = "  hi  ".trim();
    const sliceNegative = "abcdef".slice(-3);
    const substringNegative = "abcdef".substring(-3);
    const splitComma = "a,b,,c".split(",");
    const splitDigit = "a1b2c".split(/\d/);
    const upper = "Hello".toUpperCase();
    const startsWithRead = "readme.md".startsWith("read");
    const includesMe = "readme.md".includes("me");

    const emoji = "👍";
    const emojiLength = emoji.length;
    const emojiPoints = [...emoji].length;

    const hasDate = /2024-05-12/.test(text);
    const allDates = text.match(/\d{4}-\d{2}-\d{2}/g);
    const firstDate = text.match(/\d{4}-\d{2}-\d{2}/);
    const dateIndex = firstDate.index;
    const named = [...text.matchAll(/(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/g)];
    const firstNamed = named[0].groups;

    const masked = text.replace(/\d{4}-\d{2}-\d{2}/g, "[日期]");
    const doubled = text.replace(/(\d+) 元/g, (match, amount) => Number(amount) * 2 + " 元");

    const gRe = /\d+/g;
    const firstExec = gRe.exec("a1b22");
    const firstLastIndex = gRe.lastIndex;
    const secondExec = gRe.exec("a1b22");
    const secondLastIndex = gRe.lastIndex;
    gRe.exec("a1b22");
    const thirdLastIndex = gRe.lastIndex;

    const plainRe = /\d+/;
    plainRe.exec("a1b22");
    const plainFirstIndex = plainRe.lastIndex;
    plainRe.exec("a1b22");
    const plainSecondIndex = plainRe.lastIndex;

    const dotDefault = /a.b/.test("a\nb");
    const dotAll = /a.b/s.test("a\nb");
    const unescaped = new RegExp("1+1").test("11");
    const escaped = new RegExp("1\\+1").test("11");

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
      if (value === undefined) return "undefined";
      if (value === null) return "null";
      if (Array.isArray(value)) {
        const items = value.map((item) => (item === undefined ? "undefined" : JSON.stringify(item)));
        return "[" + items.join(",") + "]";
      }
      return JSON.stringify(value);
    }

    const samples = [
      ["\"  hi  \".trim()", trimmed, "去掉两端空白"],
      ["\"abcdef\".slice(-3)", sliceNegative, "负下标从末尾算"],
      ["\"abcdef\".substring(-3)", substringNegative, "负值当作 0"],
      ["\"a,b,,c\".split(\",\")", splitComma, "连续分隔符留下空字符串"],
      ["\"a1b2c\".split(/\\d/)", splitDigit, "按正则切分"],
      ["\"Hello\".toUpperCase()", upper, "转大写"],
      ["\"readme.md\".startsWith(\"read\")", startsWithRead, "前缀判断"],
      ["\"readme.md\".includes(\"me\")", includesMe, "子串判断"],
      ["\"👍\".length", emojiLength, "按 UTF-16 码元计数"],
      ["[...\"👍\"].length", emojiPoints, "按码点计数"],
      ["/2024-05-12/.test(text)", hasDate, "返回布尔值"],
      ["text.match(/\\d{4}-\\d{2}-\\d{2}/g)", allDates, "带 g 返回全部匹配"],
      ["text.match(/\\d{4}-\\d{2}-\\d{2}/)", firstDate, "不带 g 返回首个匹配"],
      ["matchAll 的命名分组", firstNamed, "按名字读取分组"],
      ["replace 遮蔽日期", masked, "替换所有匹配"],
      ["replace 用函数翻倍金额", doubled, "回调返回替换值"],
      ["/g 的第一次 exec", firstExec, "从开头查找"],
      ["第一次 exec 后的 lastIndex", firstLastIndex, "停在匹配之后"],
      ["第二次 exec", secondExec, "从 lastIndex 继续"],
      ["第三次 exec 后的 lastIndex", thirdLastIndex, "匹配失败后归零"],
      ["两次无 g exec 后 lastIndex", plainSecondIndex, "始终为 0"],
      ["/a.b/ 匹配换行", dotDefault, ". 默认不匹配换行"],
      ["/a.b/s 匹配换行", dotAll, "s 标志让 . 匹配换行"],
      ["new RegExp(\"1+1\").test(\"11\")", unescaped, "+ 被当成量词"],
      ["new RegExp(\"1\\\\+1\").test(\"11\")", escaped, "转义后按字面匹配"],
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

    console.log("allDates", JSON.stringify(allDates));
    console.log("firstDate", firstDate[0], firstDate.index);
    console.log("named", JSON.stringify(firstNamed));
    console.log("masked", masked);
    console.log("doubled", doubled);
    console.log("lastIndex", firstLastIndex, secondLastIndex, thirdLastIndex);
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有二十五行。`trim` 去掉两端空白，`slice(-3)` 得到 `def` 而 `substring(-3)` 返回 `abcdef`；`split(",")` 在连续分隔符处留下空字符串；emoji 的 `length` 为 `2`，按码点计数为 `1`；`match` 带 `g` 返回两个日期，不带 `g` 返回首个匹配；命名分组得到 `year`、`month`、`day`；替换后日期被遮蔽、金额翻倍；带 `g` 的 `exec` 依次返回 `["1"]`、`["22"]` 并在失败后把 `lastIndex` 归零，不带 `g` 时始终为 `0`；`.` 默认不匹配换行，`s` 标志下匹配；未转义的 `1+1` 把 `+` 当成量词。控制台六条输出与表格一致。

| 表达式 | 结果 | 说明 |
|--------|------|------|
| `"  hi  ".trim()` | `"hi"` | 去掉两端空白 |
| `"abcdef".slice(-3)` | `"def"` | 负下标从末尾算 |
| `"abcdef".substring(-3)` | `"abcdef"` | 负值当作 `0` |
| `"a,b,,c".split(",")` | `["a","b","","c"]` | 连续分隔符留下空字符串 |
| `"a1b2c".split(/\d/)` | `["a","b","c"]` | 按正则切分 |
| `"Hello".toUpperCase()` | `"HELLO"` | 转大写 |
| `"readme.md".startsWith("read")` | `true` | 前缀判断 |
| `"readme.md".includes("me")` | `true` | 子串判断 |
| `"👍".length` | `2` | 按 UTF-16 码元计数 |
| `[...emoji].length` | `1` | 按码点计数 |
| `/2024-05-12/.test(text)` | `true` | 返回布尔值 |
| `text.match(/\d{4}-\d{2}-\d{2}/g)` | `["2024-05-12","2024-06-03"]` | 带 `g` 返回全部匹配 |
| `text.match(/\d{4}-\d{2}-\d{2}/)` | `["2024-05-12"]` | 不带 `g` 返回首个匹配 |
| `matchAll` 的命名分组 | `{"year":"2024","month":"05","day":"12"}` | 按名字读取分组 |
| `replace` 遮蔽日期 | `"订单 A-[日期] 金额 128 元，订单 B-[日期] 金额 256 元"` | 替换所有匹配 |
| `replace` 用函数翻倍金额 | `"订单 A-2024-05-12 金额 256 元，订单 B-2024-06-03 金额 512 元"` | 回调返回替换值 |
| `/g` 的第一次 `exec` | `["1"]` | 从开头查找 |
| 第一次 `exec` 后的 `lastIndex` | `2` | 停在匹配之后 |
| 第二次 `exec` | `["22"]` | 从 `lastIndex` 继续 |
| 第三次 `exec` 后的 `lastIndex` | `0` | 匹配失败后归零 |
| 两次无 `g` `exec` 后 `lastIndex` | `0` | 始终为 `0` |
| `/a.b/` 匹配换行 | `false` | `.` 默认不匹配换行 |
| `/a.b/s` 匹配换行 | `true` | `s` 标志让 `.` 匹配换行 |
| `new RegExp("1+1").test("11")` | `true` | `+` 被当成量词 |
| `new RegExp("1\\+1").test("11")` | `false` | 转义后按字面匹配 |

### 3. 失败分支

创建 `lastindex.html`，写入 `const re = /a/g;`，然后连续三次调用 `re.test("a")`。控制台依次输出 `true 1`、`false 0`、`true 1`：第二次从 `lastIndex = 1` 开始，长度为 `1` 的字符串已经没有可匹配内容，返回 `false` 并重置，第三次又从头匹配。同一个带 `g` 的正则反复用于不同字符串时，结果会随调用次数变化；每次都验证同一段文本时，去掉 `g` 或每次新建正则。

另外两种偏差不抛异常。把用户输入直接传进 `new RegExp` 时，输入里的 `+`、`.`、`(` 会被当作元字符，匹配范围与预期不同，甚至因括号不配对抛 `SyntaxError`；用 `.` 匹配多行文本时会漏掉换行后的内容，需要 `s` 标志或显式字符类。

## 六、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格二十五行与控制台六条输出与正文一致；`lastindex.html` 依次输出 `true 1`、`false 0`、`true 1`。两个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有展开 Unicode 属性转义、`v` 标志、后行断言与回溯性能；正则写法的兼容范围与极端输入的表现需要按目标环境核对。
