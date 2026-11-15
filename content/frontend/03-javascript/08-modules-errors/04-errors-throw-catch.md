---
title: "错误类型、抛出与捕获"
tags:
  - JavaScript
  - 错误处理
  - Error
  - try catch
excerpt: "说明 Error 的 name、message、stack 与常见子类，解释 throw 任意值带来的问题、try/catch/finally 的执行顺序与 finally 中 return 覆盖异常的风险，讲解 cause、自定义错误类、async 函数中的捕获以及未处理拒绝与全局 error 事件。"
date: 2026-11-15
---

# 错误类型、抛出与捕获

运行时错误都是 `Error` 的实例或它的子类，带有 `name`、`message` 和 `stack`。常见子类包括 `TypeError`、`RangeError`、`SyntaxError`、`ReferenceError`，`name` 说明类别，`message` 说明具体原因，排查时两者都要看。

`throw` 可以抛出任何值，但抛字符串或数字会丢失栈信息，捕获方也无法按错误类型分支。`try...catch` 捕获同步异常，`finally` 无论是否出错都会执行；在 `finally` 中 `return` 会覆盖正在抛出的异常，这是最容易埋掉错误的位置。

本篇先讲错误对象与子类，再讲抛出捕获与 `finally`，随后讲错误上下文与异步错误，最后用页面核对。

::: info 本篇的范围
本篇讲错误的分类、构造与捕获，不建立完整的监控平台，也不讨论跨域脚本错误的细节。异步流程本身见“回调与 Promise”和“async/await 与异步错误处理”。
:::

## 一、Error 与常见子类

### 1. Error 的字段

`new Error(message)` 创建一个错误对象，`name` 默认是 `"Error"`，`message` 是传入的描述，`stack` 记录抛出位置的调用链。捕获后应同时记录这两个字段，只打印 `message` 会丢失错误类别，只打印 `name` 又缺少具体原因。

```js
const error = new Error("读取失败");
console.log(error.name); // "Error"
console.log(error.message); // "读取失败"
```

### 2. 内置子类

访问 `null` 的属性抛 `TypeError`，数组长度为负数抛 `RangeError`，`JSON.parse` 解析非法文本抛 `SyntaxError`，访问未声明变量抛 `ReferenceError`。这些子类都由引擎在对应场景自动抛出，捕获时可以根据 `name` 或 `instanceof` 区分处理。

```js
const cases = [() => null.value, () => new Array(-1), () => JSON.parse("{bad}"), () => missingName];
for (const run of cases) {
  try {
    run();
  } catch (error) {
    console.log(error.name);
  }
}
// TypeError → RangeError → SyntaxError → ReferenceError
```

### 3. 根据 name 区分

不同错误需要不同处理时，用 `name` 或 `instanceof` 分支：输入格式错误提示用户修改，程序缺陷写日志并上报。只看 `message` 文本字符串匹配，改动文案就会破坏逻辑。

```js
try {
  JSON.parse("{bad}");
} catch (error) {
  if (error instanceof SyntaxError) {
    console.log("输入不是合法 JSON");
  } else {
    throw error;
  }
}
```

## 二、抛出与捕获

### 1. throw 任意值

`throw` 后面可以跟任何值，字符串、数字、普通对象都能抛。但非 `Error` 值没有 `stack`，`catch` 里访问 `error.message` 得到 `undefined`，也无法用 `instanceof` 判断类型。抛出的值应始终是 `Error` 或其子类的实例。

```js
try {
  throw "配置缺失";
} catch (error) {
  console.log(typeof error); // "string"
  console.log(error.message); // undefined
}
```

### 2. try/catch

`try` 块中的同步异常会被 `catch` 捕获，`catch` 执行完后流程继续。捕获后要么处理，要么重新抛出；静默吞掉错误会让问题在更远的地方以更难排查的方式出现。

```js
try {
  console.log("执行");
  throw new Error("出错");
} catch (error) {
  console.log("捕获", error.message); // 捕获 出错
} finally {
  console.log("收尾");
}
```

### 3. finally 的陷阱

`finally` 中的 `return` 会覆盖 `try` 中正在抛出的异常，函数正常返回，错误彻底消失。同样的规则适用于 `break`、`continue`。清理逻辑不应包含 `return`；需要返回值时在 `try` 或 `catch` 中返回。

```js
function finallyReturn() {
  try {
    throw new Error("原始错误");
  } finally {
    return "被 finally 覆盖";
  }
}
console.log(finallyReturn()); // "被 finally 覆盖"
```

## 三、错误上下文

### 1. cause

`new Error(message, { cause })` 把底层错误挂在 `cause` 上，保留原始原因。包装错误时用它而不是把原因拼进 `message`：外层说明业务语义，内层保留技术细节，两层都能单独记录和判断。

```js
try {
  throw new Error("保存失败", { cause: new Error("磁盘已满") });
} catch (error) {
  console.log(error.message, "←", error.cause.message); // 保存失败 ← 磁盘已满
}
```

### 2. 自定义错误类

继承 `Error` 并设置 `name`，可以定义业务错误类型。自定义错误既是 `Error` 实例，也能用 `instanceof` 精确判断；在构造函数中保存额外字段（例如出错字段名），调用方不必解析 `message` 字符串。

```js
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}
throw new ValidationError("字段不能为空", "name");
```

### 3. 错误信息应包含什么

`message` 写清“在哪一步、因为什么失败”，例如“保存用户 42 失败：邮箱格式不合法”，而不是“出错了”。不要把密码、令牌等敏感值写进错误信息，因为错误日志常被多处收集和展示。

## 四、异步错误

### 1. async 函数中的捕获

`async` 函数返回 Promise，内部抛出的错误成为拒绝原因。调用方用 `await` 加 `try...catch`，或给返回的 Promise 挂 `catch`。忘记处理时错误不会同步抛出，而是变成未处理的拒绝。

```js
async function load() {
  throw new Error("加载失败");
}
load().catch((error) => console.log("捕获", error.message)); // 捕获 加载失败
```

### 2. 未处理的拒绝

Promise 拒绝后没有 `catch`，会触发 `unhandledrejection` 事件。页面可以监听该事件做统一上报，把它当作最后一道防线，而不是替代逐处的错误处理。

```js
window.addEventListener("unhandledrejection", (event) => {
  console.log("未处理的拒绝", event.reason.message);
});
Promise.reject(new Error("后台失败"));
```

### 3. 全局 error 事件

未被捕获的同步错误会触发 `window` 的 `error` 事件，`event.message` 包含错误描述，例如 `Uncaught Error: 未捕获的同步错误`。脚本、图片等资源加载失败也会触发 `error` 事件，但事件对象不同，处理时要区分。

```js
window.addEventListener("error", (event) => {
  console.log("全局错误", event.message);
});
setTimeout(() => {
  throw new Error("未捕获的同步错误");
}, 0);
```

## 五、从空目录观察错误

### 1. 创建页面

新建空目录 `js-errors`，创建 `index.html`。脚本分别触发四种内置错误与一次自定义错误，记录 `name`、`message`、`cause` 与 `instanceof` 结果，验证 `throw` 字符串后 `message` 为 `undefined`、`finally` 中 `return` 覆盖异常，并注册全局 `error` 与 `unhandledrejection` 监听观察未处理错误。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>错误类型与捕获观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>错误类型与捕获观察</h1>
  <table id="output">
    <thead><tr><th>观察项</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    class ValidationError extends Error {
      constructor(message, field) {
        super(message);
        this.name = "ValidationError";
        this.field = field;
      }
    }

    const results = {};

    function capture(run) {
      try {
        run();
        return "没有抛出";
      } catch (error) {
        return { name: error.name, message: error.message };
      }
    }

    results.basic = capture(() => {
      throw new Error("基础错误");
    });
    results.type = capture(() => {
      null.value;
    });
    results.range = capture(() => {
      new Array(-1);
    });
    results.syntax = capture(() => {
      JSON.parse("{bad}");
    });
    results.reference = capture(() => {
      missingName;
    });

    let stringCaught = null;
    try {
      throw "只是一个字符串";
    } catch (error) {
      stringCaught = { type: typeof error, message: error.message };
    }
    results.stringCaught = stringCaught;

    results.cause = capture(() => {
      throw new Error("外层错误", { cause: new Error("内层原因") });
    });
    let causeMessage = null;
    try {
      throw new Error("外层错误", { cause: new Error("内层原因") });
    } catch (error) {
      causeMessage = error.cause ? error.cause.message : "没有 cause";
    }
    results.causeMessage = causeMessage;

    results.custom = capture(() => {
      throw new ValidationError("字段不能为空", "name");
    });
    let customInstance = null;
    try {
      throw new ValidationError("字段不能为空", "name");
    } catch (error) {
      customInstance = error instanceof ValidationError && error instanceof Error;
    }
    results.customInstance = customInstance;

    function finallyReturn() {
      try {
        throw new Error("原始错误");
      } finally {
        return "被 finally 覆盖";
      }
    }
    results.finallyValue = finallyReturn();

    window.addEventListener("error", (event) => {
      results.globalError = event.message;
    });
    window.addEventListener("unhandledrejection", (event) => {
      results.globalRejection = event.reason.message;
    });
    setTimeout(() => {
      throw new Error("未捕获的同步错误");
    }, 0);
    Promise.reject(new Error("未处理的拒绝"));

    function show(value) {
      if (typeof value === "string") return JSON.stringify(value);
      if (value === undefined) return "undefined";
      if (value === null) return "null";
      if (Array.isArray(value)) {
        const items = value.map((item) => (item === undefined ? "undefined" : JSON.stringify(item)));
        return "[" + items.join(",") + "]";
      }
      if (typeof value === "object" && "name" in value && "message" in value) {
        return "{ name: " + JSON.stringify(value.name) + ", message: " + JSON.stringify(value.message) + " }";
      }
      return JSON.stringify(value);
    }

    function render() {
      const rows = [
        ["new Error 的 name 与 message", results.basic, "基础错误对象"],
        ["访问 null 属性的错误", results.type, "TypeError"],
        ["new Array(-1) 的错误", results.range, "RangeError"],
        ["JSON.parse 非法文本的错误", results.syntax, "SyntaxError"],
        ["访问未声明变量的错误", results.reference, "ReferenceError"],
        ["throw 字符串后 catch 到的类型", results.stringCaught.type, "不是 Error 对象"],
        ["throw 字符串后 error.message", results.stringCaught.message, "undefined"],
        ["cause 指向的原因", results.causeMessage, "嵌套错误"],
        ["自定义错误是否继承 Error", results.customInstance, "instanceof 检查"],
        ["自定义错误的 name", results.custom.name, "构造时指定"],
        ["finally 中 return 的结果", results.finallyValue, "异常被覆盖"],
        ["全局 error 事件的消息", results.globalError, "未捕获的同步错误"],
        ["unhandledrejection 的消息", results.globalRejection, "未处理的拒绝"],
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
      console.log("basic", JSON.stringify(results.basic));
      console.log("string", JSON.stringify(results.stringCaught));
      console.log("finally", results.finallyValue);
      console.log("global", results.globalError, results.globalRejection);
    }

    setTimeout(render, 200);
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有十三行。`new Error` 得到 `name` 为 `Error`、`message` 为 `基础错误`；四种内置错误依次为 `TypeError`、`RangeError`、`SyntaxError`、`ReferenceError`；`throw` 字符串后 `typeof` 为 `string`、`error.message` 为 `undefined`；`cause` 指向 `内层原因`；自定义错误同时是 `ValidationError` 和 `Error` 的实例；`finally` 中 `return` 使函数返回 `被 finally 覆盖`；全局事件分别收到 `Uncaught Error: 未捕获的同步错误` 与 `未处理的拒绝`。控制台四条输出与表格一致。

| 观察项 | 结果 | 说明 |
|--------|------|------|
| `new Error` 的 `name` 与 `message` | `{ name: "Error", message: "基础错误" }` | 基础错误对象 |
| 访问 `null` 属性 | `TypeError` | 属性访问失败 |
| `new Array(-1)` | `RangeError` | 参数超出范围 |
| `JSON.parse("{bad}")` | `SyntaxError` | 非法 JSON |
| 访问未声明变量 | `ReferenceError` | 变量不存在 |
| `throw` 字符串后的类型 | `"string"` | 不是 `Error` 对象 |
| `throw` 字符串后的 `message` | `undefined` | 没有该字段 |
| `cause` 指向的原因 | `"内层原因"` | 嵌套错误 |
| 自定义错误是否继承 `Error` | `true` | `instanceof` 检查 |
| 自定义错误的 `name` | `"ValidationError"` | 构造时指定 |
| `finally` 中 `return` 的结果 | `"被 finally 覆盖"` | 异常被覆盖 |
| 全局 `error` 事件的消息 | `"Uncaught Error: 未捕获的同步错误"` | 未捕获的同步错误 |
| `unhandledrejection` 的消息 | `"未处理的拒绝"` | 未处理的拒绝 |

### 3. 失败分支

`catch` 中什么都不做是最常见的错误：异常被吞掉，调用方以为成功，问题在别处以数据缺失的形式出现。至少记录 `name`、`message` 与 `stack`，无法处理时重新抛出。

`finally` 中的 `return` 会覆盖异常，页面中的 `finallyReturn()` 返回字符串而不是抛出错误。清理逻辑只应清理，不应改变返回值或吞掉异常。异步场景同理：没有 `await` 也没有 `catch` 的调用只剩 `unhandledrejection` 一条线索。

## 六、验证记录与边界

以上页面于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格十三行与控制台四条输出与正文一致；页面同时产生 `Error: 未捕获的同步错误` 与 `Error: 未处理的拒绝` 两条未捕获错误记录。HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器与旧版本环境，也没有展开跨域脚本错误的屏蔽行为、资源加载错误的 `error` 事件差异、错误上报采样与 `AggregateError` 的处理；这些内容需要按目标环境与监控方案核对。
