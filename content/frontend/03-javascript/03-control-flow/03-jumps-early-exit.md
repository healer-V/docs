---
title: "跳转与提前退出"
tags:
  - JavaScript
  - break
  - continue
  - 提前返回
excerpt: "说明 break 与 continue 如何改变循环路径、无标签 break 为什么只退出内层、标签语句怎样结束嵌套循环，以及函数中的提前 return 如何替代深层嵌套，并给出可复现的路径观察页。"
date: 2026-11-15
---

# 跳转与提前退出

`break` 立即结束循环，`continue` 跳过本次迭代进入下一次，`return` 结束整个函数。三者都改变执行路径，但作用范围不同：前两个只影响所在循环，标签语句可以指定外层循环；`return` 直接离开函数，循环也随之结束。

嵌套循环中最容易出错的是 `break` 的作用范围。无标签的 `break` 只退出最内层循环，外层继续执行；需要一次退出多层时，给外层循环加标签。把 `break` 写进 `forEach` 回调则是语法错误，因为回调不是循环语句。

本篇先说明 `break` 与 `continue`，再处理嵌套循环和标签，随后介绍提前返回，最后用页面核对各条路径。

::: info 本篇的范围
本篇讲循环与函数中的跳转语句，不把标签语句当作通用控制流技巧，也不讨论用异常做跳转。循环语法见“循环与迭代”，函数定义见“函数声明、表达式与调用”。
:::

## 一、break 与 continue

### 1. break 退出当前循环

`break` 在循环体内遇到时立即结束循环，不再判断条件，也不执行剩余的迭代。循环后的代码继续执行。常见用途是找到目标后停止搜索。

```js
for (let i = 1; i <= 5; i++) {
  if (i === 3) break;
  console.log(i); // 输出 1、2
}
```

### 2. continue 跳过本次迭代

`continue` 结束当前这一轮，直接进入下一轮的条件判断。循环本身不结束，只是跳过它后面的语句。筛选数据、跳过无效项时使用。

```js
for (let i = 1; i <= 5; i++) {
  if (i % 2 === 0) continue;
  console.log(i); // 输出 1、3、5
}
```

### 3. 两者只作用于所在循环

`break` 和 `continue` 不能跨出函数边界，也不能作用于其他循环。它们只结束或跳过自己所在的那一层循环；在 `for` 的更新表达式之前使用 `continue`，更新仍会执行，而在 `while` 中手动递增的语句会被跳过，需要放在 `continue` 之前。

```js
let n = 0;
while (n < 3) {
  n++; // 放在 continue 之前，避免死循环
  if (n === 2) continue;
  console.log(n); // 输出 1、3
}
```

## 二、嵌套循环与标签

### 1. 无标签 break 只退出内层

内层循环中的 `break` 结束后，外层循环继续下一轮。若本意是“找到就全部停止”，只写 `break` 会得到多余的结果。

```js
for (let row = 1; row <= 2; row++) {
  for (let col = 1; col <= 3; col++) {
    if (col === 2) break;
    console.log(row + "-" + col); // 输出 1-1、2-1
  }
}
```

### 2. 标签 break 退出外层

在循环前写一个标签，`break 标签名` 会结束带该标签的循环。标签只对紧邻的循环语句有效，通常只用于嵌套循环的一次性退出。

```js
outer: for (let row = 1; row <= 2; row++) {
  for (let col = 1; col <= 3; col++) {
    if (col === 2) break outer;
    console.log(row + "-" + col); // 只输出 1-1
  }
}
```

### 3. 标签的适用边界

标签语句能减少嵌套退出时的标志变量，但会让控制流跳转不明显。只有多层循环需要一起退出时才使用，并在标签名中写明意图。单层循环用普通 `break`，函数内的退出用 `return`。

```js
let found = false;
for (const row of [[1, 2], [3, 4]]) {
  for (const value of row) {
    if (value === 3) {
      found = true;
      break;
    }
  }
  if (found) break;
}
```

## 三、函数中的提前返回

### 1. 用 return 结束函数

`return` 结束当前函数，循环也随之停止。函数可以返回一个值表示结果；没有显式返回时得到 `undefined`。查找类函数常用返回索引、返回 `-1` 表示未找到。

```js
function firstNegative(numbers) {
  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] < 0) return i;
  }
  return -1;
}
console.log(firstNegative([3, -2, -5])); // 1
console.log(firstNegative([1, 2])); // -1
```

### 2. 提前返回降低嵌套

把异常情况和边界条件放在函数开头处理，可以避免把主逻辑包在多层 `if` 里。提前返回后，后续代码默认前置条件已满足，读起来是一条直线。

```js
function displayName(user) {
  if (!user) return "无用户";
  if (!user.active) return "未激活";
  return user.name;
}
console.log(displayName({ active: false, name: "Ada" })); // "未激活"
```

### 3. 循环与提前返回的选择

只需要知道“有没有”或“第一个匹配项”时，用提前 `return` 比用 `break` 加标志变量更直接。需要收集全部结果时，让循环完整执行，不要在第一次命中时返回。

```js
function collectEven(numbers) {
  const result = [];
  for (const n of numbers) {
    if (n % 2 === 0) result.push(n);
  }
  return result;
}
console.log(collectEven([1, 2, 3, 4])); // [2, 4]
```

## 四、从空目录观察跳转

### 1. 创建页面

新建空目录 `js-jumps`，创建 `index.html`。脚本把 `break`、`continue`、嵌套循环、标签和提前返回的结果写入表格，并在控制台输出其中五条结果。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>跳转与提前退出观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>跳转与提前退出观察</h1>
  <table id="output">
    <thead><tr><th>表达式</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    function breakAtThree() {
      const out = [];
      let stoppedAt = null;
      for (let i = 1; i <= 5; i++) {
        if (i === 3) {
          stoppedAt = i;
          break;
        }
        out.push(i);
      }
      return JSON.stringify({ out: out.join(","), stoppedAt });
    }

    function skipEven() {
      const out = [];
      for (let i = 1; i <= 5; i++) {
        if (i % 2 === 0) continue;
        out.push(i);
      }
      return out.join(",");
    }

    function nestedPlain() {
      const hits = [];
      for (let row = 1; row <= 2; row++) {
        for (let col = 1; col <= 3; col++) {
          if (col === 2) break;
          hits.push(row + "-" + col);
        }
      }
      return hits.join(",");
    }

    function nestedLabeled() {
      const hits = [];
      outer: for (let row = 1; row <= 2; row++) {
        for (let col = 1; col <= 3; col++) {
          if (col === 2) break outer;
          hits.push(row + "-" + col);
        }
      }
      return hits.join(",");
    }

    function nestedContinue() {
      const hits = [];
      for (let row = 1; row <= 2; row++) {
        for (let col = 1; col <= 3; col++) {
          if (col === 2) continue;
          hits.push(row + "-" + col);
        }
      }
      return hits.join(",");
    }

    function firstNegative(numbers) {
      for (let i = 0; i < numbers.length; i++) {
        if (numbers[i] < 0) return i;
      }
      return -1;
    }

    const samples = [
      ["break 在 3 处退出", breakAtThree(), "记录退出时的值"],
      ["continue 跳过偶数", skipEven(), "保留奇数"],
      ["嵌套循环中的 break", nestedPlain(), "只退出内层"],
      ["标签 break outer", nestedLabeled(), "退出外层"],
      ["嵌套循环中的 continue", nestedContinue(), "只跳过内层本次"],
      ["firstNegative([3, -2, -5])", firstNegative([3, -2, -5]), "提前返回索引"],
      ["firstNegative([1, 2])", firstNegative([1, 2]), "循环结束返回 -1"],
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

    console.log("break 结果", breakAtThree());
    console.log("continue 结果", skipEven());
    console.log("嵌套 break 结果", nestedPlain());
    console.log("标签 break 结果", nestedLabeled());
    console.log("firstNegative", firstNegative([3, -2, -5]));
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有七行。`break` 一行在 `3` 处停止，收集到 `1,2`；`continue` 跳过偶数，得到 `1,3,5`；嵌套 `break` 得到 `1-1,2-1`，说明外层继续执行；标签 `break outer` 只得到 `1-1`；嵌套 `continue` 保留每行的 `1` 和 `3`；`firstNegative` 对含负数的数组返回索引 `1`，对全正数数组返回 `-1`。控制台五条输出与表格一致。

| 表达式 | 结果 | 说明 |
|--------|------|------|
| `break` 在 `3` 处退出 | `{"out":"1,2","stoppedAt":3}` | 记录退出时的值 |
| `continue` 跳过偶数 | `1,3,5` | 保留奇数 |
| 嵌套循环中的 `break` | `1-1,2-1` | 只退出内层 |
| 标签 `break outer` | `1-1` | 退出外层 |
| 嵌套循环中的 `continue` | `1-1,1-3,2-1,2-3` | 只跳过内层本次 |
| `firstNegative([3, -2, -5])` | `1` | 提前返回索引 |
| `firstNegative([1, 2])` | `-1` | 循环结束返回 `-1` |

### 3. 失败分支

创建 `foreach-break.html`，在 `forEach` 回调里写 `break`。回调是函数而不是循环，`break` 没有可结束的循环，Console 显示 `SyntaxError: Illegal break statement`。需要提前结束时改用 `for...of` 加 `break`，或用 `some()`、`find()` 这类会在返回真值时停止的方法。

另一个常见错误是以为嵌套循环里的 `break` 会退出外层。页面中的“嵌套循环中的 break”一行已经给出结果：内层退出后外层继续，最终收集到两行。需要一次退出全部循环时使用标签，或把查找逻辑抽成函数提前 `return`。

## 五、验证记录与边界

以上文件于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格七行与控制台五条输出与正文一致；`foreach-break.html` 得到 `SyntaxError: Illegal break statement`。两个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有展开标签 `continue`、异常控制流和数组迭代方法的内部实现；标签语句只在多层退出场景使用，其他场景优先用函数提前返回。
