---
title: "回调与 Promise"
tags:
  - JavaScript
  - Promise
  - 异步
  - 错误处理
excerpt: "说明错误优先回调的写法与嵌套回调的问题，解释 Promise 的三种状态、状态不可逆与值传递规则，对照 then 返回新 Promise、catch 与 finally 的行为，并给出 all、allSettled、race、any 在部分失败时的实际结果。"
date: 2026-11-15
---

# 回调与 Promise

异步操作的结果不能直接返回，早期写法是把回调函数传进去，等操作完成再调用。回调层层嵌套后，错误处理分散、流程难以阅读，这就是常说的回调地狱。Node.js 风格的约定把错误作为回调的第一个参数，成功结果放在第二个参数。

Promise 表示一个尚未完成的操作，有 pending、fulfilled、rejected 三种状态，只能从未完成变到其中一种，之后不再改变。`then` 返回新的 Promise，值沿链传递；`catch` 捕获链上的拒绝，`finally` 不改变值。`all`、`allSettled`、`race`、`any` 用来组合多个 Promise，失败时的行为各不相同。

本篇先讲回调写法与问题，再讲 Promise 状态与链式调用，最后对照组合方法并用页面核对。

::: info 本篇的范围
本篇讲 Promise 的基本模型与常用组合，不实现 Promise polyfill，也不讨论并发调度算法。`async`/`await` 与任务顺序见“async/await 与异步错误处理”和“事件循环、宏任务与微任务”。
:::

## 一、回调与错误优先约定

### 1. 回调的基本形态

把函数作为参数传给异步操作，操作完成时调用它并传入结果，这就是回调。回调在未来的某个时刻执行，调用方无法用 `return` 拿到结果，只能在回调里继续处理。

```js
function loadUser(id, onDone) {
  setTimeout(() => onDone({ id, name: "Ada" }), 10);
}
loadUser(1, (user) => console.log(user.name)); // "Ada"
```

### 2. 错误优先约定

Node.js 风格的回调把错误放在第一个参数：成功时错误为 `null`，失败时错误为 `Error` 对象、结果为空。调用方必须先检查错误再使用结果，否则失败时读到的是 `undefined`。

```js
function readConfig(onDone) {
  setTimeout(() => onDone(new Error("文件不存在"), null), 10);
}
readConfig((error, config) => {
  if (error) {
    console.log("失败", error.message); // 失败 文件不存在
    return;
  }
  console.log(config);
});
```

### 3. 嵌套回调的问题

多个异步步骤依次依赖时，回调只能嵌在上一层里，形成向右延伸的缩进。每个层级都要重复错误判断，任意一步出错都要单独处理；想加入并发、超时或重试时，改动会扩散到每一层。

```js
const loadUser = (id, done) => setTimeout(() => done({ id }), 5);
const loadOrders = (id, done) => setTimeout(() => done(["订单 1"]), 5);
const saveOrders = (list, done) => setTimeout(() => done("保存 " + list.length + " 条"), 5);
loadUser(1, (user) => {
  loadOrders(user.id, (orders) => {
    saveOrders(orders, (result) => console.log(result)); // "保存 1 条"
  });
});
```

## 二、Promise 的状态

### 1. 三种状态

Promise 创建时处于 pending，调用 `resolve` 后变为 fulfilled，调用 `reject` 后变为 rejected。`then` 的第一个回调处理成功值，第二个回调或 `catch` 处理拒绝原因。状态变化后，后续的 `resolve`、`reject` 调用都被忽略。

```js
const task = new Promise((resolve) => {
  setTimeout(() => resolve("完成"), 10);
});
task.then((value) => console.log(value)); // "完成"
```

### 2. 状态不可逆

一个 Promise 一旦落定，结果就不再改变。先 `resolve` 再 `reject`，或者反过来，只有第一次生效。这个性质保证了同一个 Promise 的多个 `then` 拿到一致的结果，也意味着“重试”必须创建新的 Promise。

```js
const once = new Promise((resolve, reject) => {
  resolve("第一次");
  reject(new Error("第二次"));
});
once.then((value) => console.log(value)); // "第一次"
```

### 3. 值的传递

`then` 的回调收到上一个 Promise 的值，返回值成为下一个 Promise 的值。返回普通值时直接传递；返回 Promise 时会被展开，链上收到的是它落定后的值而不是 Promise 对象。

```js
Promise.resolve(1)
  .then((value) => value + 1)
  .then((value) => Promise.resolve(value * 2))
  .then((value) => console.log(value)); // 4
```

## 三、链式调用

### 1. then 返回新 Promise

每次调用 `then` 都返回一个新的 Promise，原 Promise 不受影响。链式写法把多层嵌套变成纵向排列，每一步只关心上一步的结果，错误可以统一交给末尾的 `catch`。

```js
const first = Promise.resolve("值");
const second = first.then((value) => value);
console.log(first === second); // false
```

### 2. catch 与 finally

`catch` 等价于 `then(undefined, onRejected)`，捕获链上任意一步的拒绝，返回的 Promise 继续可用。`finally` 不接收值也不改变值，常用于关闭连接、清理状态；它返回的 Promise 会等待，但返回值被忽略。

```js
Promise.resolve("结果")
  .finally(() => console.log("清理"))
  .then((value) => console.log(value)); // 清理 → 结果
```

### 3. 忘记 return 与抛错

`then` 的回调写成块体时忘记 `return`，下一环收到的是 `undefined`，而不是上一步的结果。回调中抛出的错误不会被同步 `try...catch` 捕获，而是让返回的 Promise 变为 rejected，交给后续的 `catch`。

```js
Promise.resolve(1)
  .then((value) => {
    value + 1;
  })
  .then((value) => console.log(value)); // undefined
```

## 四、组合方法

### 1. Promise.all

`all` 接收一组 Promise，全部成功时按输入顺序返回结果数组，任意一个失败就立即以该原因拒绝。适合“所有步骤都成功才有意义”的场景；部分成功的信息在拒绝时丢失，需要保留时改用 `allSettled`。

```js
Promise.all([Promise.resolve("a"), Promise.resolve("b")]).then((values) => {
  console.log(values); // ["a", "b"]
});
```

### 2. Promise.allSettled

`allSettled` 等所有 Promise 落定，返回每项的状态与值或原因，不会因为某一项失败而整体拒绝。需要汇总批量请求、统计成功与失败数量时使用它。

```js
Promise.allSettled([Promise.resolve("a"), Promise.reject(new Error("失败"))]).then((entries) => {
  console.log(entries.map((entry) => entry.status)); // ["fulfilled", "rejected"]
});
```

### 3. race 与 any

`race` 返回第一个落定的 Promise，无论成功还是失败；`any` 返回第一个成功的，全部失败时以 `AggregateError` 拒绝，`errors` 里保存各次失败原因。实现超时用 `race`，实现“多个来源取最快成功”用 `any`。

```js
Promise.race([Promise.reject(new Error("先失败")), new Promise(() => {})]).catch((error) => {
  console.log(error.message); // "先失败"
});
```

## 五、从空目录观察 Promise

### 1. 创建页面

新建空目录 `js-promise`，创建 `index.html`。脚本用延时函数模拟异步步骤，把链式调用的各阶段值记录下来，逐项验证状态不可逆、`then` 返回新 Promise、`finally` 不改变值，并对照 `all`、`allSettled`、`race`、`any` 在成功与部分失败时的结果。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>回调与 Promise 观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>回调与 Promise 观察</h1>
  <table id="output">
    <thead><tr><th>观察项</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    function delay(value, ms = 5) {
      return new Promise((resolve) => setTimeout(() => resolve(value), ms));
    }
    function fail(message, ms = 5) {
      return new Promise((resolve, reject) => setTimeout(() => reject(new Error(message)), ms));
    }

    const results = {};
    const tasks = [];

    tasks.push(
      delay("用户")
        .then((user) => {
          results.user = user;
          return delay("订单");
        })
        .then((orders) => {
          results.orders = orders;
          return delay("已保存");
        })
        .then((saved) => {
          results.saved = saved;
        }),
    );

    tasks.push(delay(1).then((value) => value + 1).then((value) => value * 2).then((value) => {
      results.chainValue = value;
    }));

    const first = Promise.resolve("原 Promise");
    const second = first.then((value) => value);
    results.newPromise = first !== second;
    tasks.push(second);

    tasks.push(
      fail("读取失败")
        .then((value) => value)
        .catch((error) => {
          results.caught = error.message;
        }),
    );

    tasks.push(
      Promise.resolve("保留")
        .finally(() => "被忽略")
        .then((value) => {
          results.afterFinally = value;
        }),
    );

    tasks.push(
      new Promise((resolve, reject) => {
        resolve("第一次");
        reject(new Error("第二次"));
      })
        .then((value) => {
          results.irreversible = value;
        })
        .catch((error) => {
          results.irreversible = error.message;
        }),
    );

    tasks.push(
      Promise.all([delay("a"), delay("b")]).then((values) => {
        results.allOk = values;
      }),
    );

    tasks.push(
      Promise.all([delay("a"), fail("第二个失败")])
        .then((values) => {
          results.allFail = values;
        })
        .catch((error) => {
          results.allFail = error.message;
        }),
    );

    tasks.push(
      Promise.allSettled([delay("a"), fail("失败")]).then((entries) => {
        results.settled = entries.map((entry) => entry.status);
      }),
    );

    tasks.push(
      Promise.race([delay("快的", 1), delay("慢的", 20)]).then((value) => {
        results.race = value;
      }),
    );

    tasks.push(
      Promise.any([fail("第一个错误", 1), delay("第一个成功", 10)]).then((value) => {
        results.any = value;
      }),
    );

    tasks.push(
      Promise.any([fail("错误一", 1), fail("错误二", 1)]).catch((error) => {
        results.anyFail = error.name + ":" + error.errors.length;
      }),
    );

    tasks.push(
      Promise.resolve(1)
        .then((value) => {
          value + 1;
        })
        .then((value) => {
          results.missingReturn = value;
        }),
    );

    tasks.push(
      Promise.resolve()
        .then(() => {
          throw new Error("then 中抛出");
        })
        .catch((error) => {
          results.thrownInThen = error.message;
        }),
    );

    tasks.push(
      Promise.resolve(1)
        .then(() => Promise.resolve(2))
        .then((value) => {
          results.nestedResolve = value;
        }),
    );

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
      if (value === undefined) return "undefined";
      if (Array.isArray(value)) {
        const items = value.map((item) => (item === undefined ? "undefined" : JSON.stringify(item)));
        return "[" + items.join(",") + "]";
      }
      return JSON.stringify(value);
    }

    function render() {
      const rows = [
        ["链式 then 的各阶段值", [results.user, results.orders, results.saved], "每步返回下一阶段的值"],
        ["连续 then 的计算结果", results.chainValue, "值按顺序传递"],
        ["then 是否返回新 Promise", results.newPromise, "原 Promise 不变"],
        ["catch 捕获的错误", results.caught, "链上的拒绝被接管"],
        ["finally 之后的值", results.afterFinally, "返回值被忽略"],
        ["resolve 后再 reject", results.irreversible, "状态不可逆"],
        ["Promise.all 全部成功", results.allOk, "按顺序返回结果"],
        ["Promise.all 有一个失败", results.allFail, "整体拒绝"],
        ["Promise.allSettled 的状态", results.settled, "逐项记录结果"],
        ["Promise.race 的结果", results.race, "第一个落定者胜出"],
        ["Promise.any 的结果", results.any, "第一个成功者胜出"],
        ["Promise.any 全部失败", results.anyFail, "AggregateError 汇总"],
        ["then 中忘记 return", results.missingReturn, "下一环收到 undefined"],
        ["then 中抛错", results.thrownInThen, "由后面的 catch 捕获"],
        ["then 返回 Promise", results.nestedResolve, "Promise 被展开"],
      ];
      const body = document.querySelector("#output tbody");
      for (const [label, value, extra] of rows) {
        const row = document.createElement("tr");
        for (const text of [label, show(value), extra]) {
          const cell = document.createElement("td");
          cell.textContent = text;
          row.append(cell);
        }
        body.append(row);
      }
      console.log("chain", JSON.stringify([results.user, results.orders, results.saved]));
      console.log("chainValue", results.chainValue);
      console.log("any", results.any, "anyFail", results.anyFail);
      console.log("missingReturn", results.missingReturn);
    }

    Promise.allSettled(tasks).then(render);
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有十五行。链式各阶段依次得到 `用户`、`订单`、`已保存`；连续 `then` 的计算结果为 `4`；`then` 确实返回新 Promise；`catch` 捕获到 `读取失败`，`finally` 之后的值仍为 `保留`；先 `resolve` 再 `reject` 的结果是 `第一次`；`all` 成功返回 `["a","b"]`，有一项失败时整体以 `第二个失败` 拒绝；`allSettled` 状态为 `["fulfilled","rejected"]`；`race` 得到 `快的`，`any` 得到 `第一个成功`，全部失败时为 `AggregateError:2`；忘记 `return` 的下一环收到 `undefined`；`then` 中抛出的错误被 `catch` 捕获；`then` 返回的 Promise 被展开为 `2`。控制台四条输出与表格一致。

| 观察项 | 结果 | 说明 |
|--------|------|------|
| 链式 `then` 的各阶段值 | `["用户","订单","已保存"]` | 每步返回下一阶段的值 |
| 连续 `then` 的计算结果 | `4` | 值按顺序传递 |
| `then` 是否返回新 Promise | `true` | 原 Promise 不变 |
| `catch` 捕获的错误 | `"读取失败"` | 链上的拒绝被接管 |
| `finally` 之后的值 | `"保留"` | 返回值被忽略 |
| `resolve` 后再 `reject` | `"第一次"` | 状态不可逆 |
| `Promise.all` 全部成功 | `["a","b"]` | 按顺序返回结果 |
| `Promise.all` 有一个失败 | `"第二个失败"` | 整体拒绝 |
| `Promise.allSettled` 的状态 | `["fulfilled","rejected"]` | 逐项记录结果 |
| `Promise.race` 的结果 | `"快的"` | 第一个落定者胜出 |
| `Promise.any` 的结果 | `"第一个成功"` | 第一个成功者胜出 |
| `Promise.any` 全部失败 | `"AggregateError:2"` | `AggregateError` 汇总 |
| `then` 中忘记 `return` | `undefined` | 下一环收到 `undefined` |
| `then` 中抛错 | `"then 中抛出"` | 由后面的 `catch` 捕获 |
| `then` 返回 Promise | `2` | Promise 被展开 |

### 3. 失败分支

创建 `unhandled.html`，注册 `unhandledrejection` 监听后直接 `Promise.reject(new Error("没有 catch"))`。控制台输出 `未处理的拒绝 没有 catch`，同时浏览器把它记录为未捕获的错误。链上任何一环漏掉 `catch`，拒绝都会以这种方式暴露；在页面里应给每条链挂上错误处理，或在全局监听中集中上报。

另外两种偏差不会抛异常。`then` 中忘记 `return` 时，链条不会中断，只是下一环拿到 `undefined`，往往到很后面才表现为数据缺失；把 `race` 当作“取最快成功”使用，遇到第一个失败就会整体拒绝，需要“最快成功”时应使用 `any`。

## 六、验证记录与边界

以上页面于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格十五行与控制台四条输出与正文一致；`unhandled.html` 输出 `未处理的拒绝 没有 catch` 并产生 `Error: 没有 catch`。两个 HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器和旧版本环境，也没有展开 thenable 的完整判定、`Promise.all` 在超大数组上的行为、取消机制与并发上限控制；这些内容需要按目标环境与具体需求核对。
