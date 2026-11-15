---
title: "条件分支"
tags:
  - JavaScript
  - 条件分支
  - switch
excerpt: "说明 if/else 与 switch 的表达方式，解释分支顺序为何会让后面的条件不可达、switch 为什么按严格相等匹配、break 与 default 位置怎样影响落空行为，并给出可复现的分支观察页。"
date: 2026-11-15
---

# 条件分支

条件分支让同一段代码根据输入走不同路径。`if` 判断任意条件表达式，`switch` 把同一个值与多个 `case` 逐一比较。两者都能表达多分支，选择依据是匹配方式：`if` 适合范围和组合条件，`switch` 适合枚举值。

分支代码最常见的错误不是语法，而是顺序和落空。把宽泛条件写在前面，后面的具体条件永远不会执行；`switch` 漏写 `break`，会继续执行下一个分支；把 `default` 放在中间，落空后的走向容易看错。

本篇先说明 `if`/`else` 与提前返回，再介绍条件表达式和 `switch` 的匹配与落空规则，最后用页面核对结果。

::: info 本篇的范围
本篇讲同步代码中的条件结构，不展开异常处理与异步流程。真值转换规则见“布尔、null、undefined 与真值判断”，相等性算法见“类型转换与相等性”。
:::

## 一、if 与 else

### 1. 条件与语句块

`if` 的条件会被转换成布尔值，为真时执行语句块。只有一条语句时可以省略花括号，但加上花括号能避免后续添加语句时出错。`else` 覆盖条件不成立的情况。

```js
const score = 75;
if (score >= 60) {
  console.log("及格");
} else {
  console.log("不及格");
}
```

### 2. else if 的顺序

多个条件用 `else if` 串联时，从上到下依次判断，命中一个就跳过其余分支。条件应从具体到宽泛排列；如果宽泛条件在前，后面的具体条件不可达。

```js
function checkOrder(score) {
  if (score >= 60) return "及格";
  if (score >= 90) return "优秀"; // 永远不会命中
  return "不及格";
}
console.log(checkOrder(95)); // "及格"
```

### 3. 提前返回替代嵌套

函数中符合条件的处理可以提前 `return`，让后续代码只处理剩余情况。这比层层嵌套的 `if` 更容易阅读，也减少缩进层级。提前返回适合参数校验和边界处理。

```js
function grade(score) {
  if (typeof score !== "number") return "无效分数";
  if (score >= 90) return "优秀";
  if (score >= 60) return "及格";
  return "不及格";
}
console.log(grade("95")); // "无效分数"
```

## 二、条件表达式

### 1. 三元写法

条件表达式 `condition ? a : b` 根据条件取值，常用于给变量赋两种可能的值。它和 `if` 的区别在于返回值，适合只有一两个分支的简单选择。

```js
const score = 75;
const result = score >= 60 ? "通过" : "未通过";
console.log(result); // "通过"
```

### 2. 只用于取值

条件表达式嵌套多层会降低可读性，分支多于两个时应改用 `if` 或 `switch`。它也不适合包含副作用的多条语句，因为两个分支只能是表达式。

```js
const score = 75;
const label = score >= 90 ? "优秀" : score >= 60 ? "及格" : "不及格";
console.log(label); // "及格"
```

## 三、switch

### 1. 严格相等匹配

`switch` 把表达式的值与每个 `case` 用严格相等比较，类型不同就不匹配。数字 `1` 不会命中 `case "1"`，最终进入 `default`。这与 `if (value == "1")` 的宽松比较不同。

```js
function matchOne(value) {
  switch (value) {
    case "1":
      return "字符串一";
    default:
      return "无匹配";
  }
}
console.log(matchOne(1)); // "无匹配"
console.log(matchOne("1")); // "字符串一"
```

### 2. 共用 case 与 break

多个 `case` 共用同一段处理时，可以连续写多个 `case` 标签，只在最后写处理语句。每个分支结束要写 `break` 或 `return`；漏写 `break` 会继续执行下一个分支的语句，形成落空。

```js
function fallThrough(value) {
  const steps = [];
  switch (value) {
    case 1: steps.push("一");
    case 2: steps.push("二"); break;
  }
  return steps.join(",");
}
console.log(fallThrough(1)); // "一,二"
console.log(fallThrough(2)); // "二"
```

### 3. default 的位置与落空

`default` 只在没有任何 `case` 匹配时进入，位置可以写在任意处，通常放在末尾便于阅读。如果 `default` 放在中间且没有 `break`，进入后会继续执行后面的 `case` 语句。

```js
function defaultMiddle(value) {
  switch (value) {
    default: console.log("默认");
    case "a": console.log("a"); break;
    case "b": console.log("b"); break;
  }
}
defaultMiddle("zzz"); // 先输出 默认，再输出 a
defaultMiddle("b"); // 只输出 b
```

在 `case` 中声明 `let` 或 `const` 时，所有 `case` 共享同一个块级作用域。不同分支声明同名变量会报错，需要给分支加上花括号。

## 四、从空目录观察分支

### 1. 创建页面

新建空目录 `js-conditionals`，创建 `index.html`。脚本把分数判断、条件表达式、`switch` 匹配、落空和不可达分支的结果写入表格，并在控制台输出其中五个结果。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>条件分支观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>条件分支观察</h1>
  <table id="output">
    <thead><tr><th>表达式</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    function grade(score) {
      if (typeof score !== "number") return "无效分数";
      if (score >= 90) return "优秀";
      if (score >= 60) return "及格";
      return "不及格";
    }

    function describe(day) {
      switch (day) {
        case "sat":
        case "sun":
          return "周末";
        case "mon":
          return "周一";
        default:
          return "工作日";
      }
    }

    function fallThrough(value) {
      const steps = [];
      switch (value) {
        case 1:
          steps.push("一");
        case 2:
          steps.push("二");
          break;
        case 3:
          steps.push("三");
          break;
      }
      return steps.join(",");
    }

    function defaultMiddle(value) {
      const hits = [];
      switch (value) {
        default:
          hits.push("默认");
        case "a":
          hits.push("a");
          break;
        case "b":
          hits.push("b");
          break;
      }
      return hits.join(",");
    }

    function checkOrder(score) {
      if (score >= 60) return "及格";
      if (score >= 90) return "优秀";
      return "不及格";
    }

    function matchOne(value) {
      switch (value) {
        case "1":
          return "字符串一";
        default:
          return "无匹配";
      }
    }

    const samples = [
      ["grade(95)", grade(95), "第一个条件命中"],
      ["grade(75)", grade(75), "第二个条件命中"],
      ["grade(40)", grade(40), "落到 else 分支"],
      ["grade(\"95\")", grade("95"), "提前返回拦截非数字"],
      ["75 >= 60 ? \"通过\" : \"未通过\"", 75 >= 60 ? "通过" : "未通过", "条件表达式"],
      ["describe(\"sat\")", describe("sat"), "两个 case 共用分支"],
      ["describe(\"mon\")", describe("mon"), "—"],
      ["describe(\"wed\")", describe("wed"), "default 命中"],
      ["describe(1)", describe(1), "数字不匹配字符串 case"],
      ["fallThrough(1)", fallThrough(1), "缺少 break，继续落到 case 2"],
      ["fallThrough(2)", fallThrough(2), "有 break，立即退出"],
      ["defaultMiddle(\"zzz\")", defaultMiddle("zzz"), "default 不在末尾时落空"],
      ["defaultMiddle(\"b\")", defaultMiddle("b"), "匹配 case 时不进入 default"],
      ["checkOrder(95)", checkOrder(95), "前面的条件已拦截，后面的分支不可达"],
      ["matchOne(1)", matchOne(1), "严格相等，不匹配 \"1\""],
      ["matchOne(\"1\")", matchOne("1"), "字符串匹配"],
    ];

    const body = document.querySelector("#output tbody");
    for (const [label, value, extra] of samples) {
      const row = document.createElement("tr");
      for (const text of [label, String(value), extra]) {
        const cell = document.createElement("td");
        cell.textContent = text;
        row.append(cell);
      }
      body.append(row);
    }

    console.log("grade(75)", grade(75));
    console.log("describe(1)", describe(1));
    console.log("fallThrough(1)", fallThrough(1));
    console.log("defaultMiddle('zzz')", defaultMiddle("zzz"));
    console.log("checkOrder(95)", checkOrder(95));
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有十六行。重点核对四组：`grade(95)` 为 `优秀`，而 `grade("95")` 被类型检查拦下；`describe(1)` 没有匹配字符串 `case`，落到 `default`；`fallThrough(1)` 得到 `一,二`，说明漏写 `break` 会继续执行；`checkOrder(95)` 返回 `及格`，后面的 `优秀` 分支不可达。控制台五条输出与表格一致。

| 表达式 | 结果 | 说明 |
|--------|------|------|
| `grade(95)` | `优秀` | 第一个条件命中 |
| `grade(75)` | `及格` | 第二个条件命中 |
| `grade(40)` | `不及格` | 落到最后的分支 |
| `grade("95")` | `无效分数` | 提前返回拦截非数字 |
| `75 >= 60 ? "通过" : "未通过"` | `通过` | 条件表达式 |
| `describe("sat")` | `周末` | 两个 `case` 共用分支 |
| `describe("mon")` | `周一` | — |
| `describe("wed")` | `工作日` | `default` 命中 |
| `describe(1)` | `工作日` | 数字不匹配字符串 `case` |
| `fallThrough(1)` | `一,二` | 缺少 `break`，继续落到 `case 2` |
| `fallThrough(2)` | `二` | 有 `break`，立即退出 |
| `defaultMiddle("zzz")` | `默认,a` | `default` 不在末尾时落空 |
| `defaultMiddle("b")` | `b` | 匹配 `case` 时不进入 `default` |
| `checkOrder(95)` | `及格` | 后面的分支不可达 |
| `matchOne(1)` | `无匹配` | 严格相等，不匹配 `"1"` |
| `matchOne("1")` | `字符串一` | 字符串匹配 |

### 3. 失败分支

创建 `case-declare.html`，在两个 `case` 中分别声明 `let label`。两个分支共享同一个 `switch` 块作用域，Console 显示 `SyntaxError: Identifier 'label' has already been declared`。修复是给每个分支加花括号，或在不同分支使用不同变量名。

另一个常见错误是分支顺序。把 `score >= 60` 写在 `score >= 90` 前面，函数对 `95` 返回 `及格`，`优秀` 分支永远不会执行。这类问题不会报错，只能通过覆盖边界值的用例发现，例如同时测试 `59`、`60`、`89` 和 `90`。

## 五、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格十六行与控制台五条输出与正文一致；`case-declare.html` 得到 `SyntaxError: Identifier 'label' has already been declared`。两个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有展开异常处理、异步分支和表驱动写法；分支顺序与边界值需要在具体业务规则下逐项核对。
