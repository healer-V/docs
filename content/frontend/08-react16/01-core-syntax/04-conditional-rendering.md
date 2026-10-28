---
title: "条件渲染"
tags:
  - React
  - JSX
  - 条件渲染
excerpt: "讲解 React 16.8 条件渲染中的 if、三元表达式、逻辑与、空渲染、提前返回、多状态界面及隐藏与移除。"
date: 2026-07-30
---

# 条件渲染

## 一、条件渲染

### 1. 条件决定界面结果

条件渲染是根据当前数据选择要生成的文本、属性、React 元素或整片界面。React 没有单独的条件模板语法，判断仍然使用 JavaScript 的 `if`、三元表达式、逻辑运算符和 `switch`。

条件可以控制不同范围：

| 控制范围 | 示例 | 常用写法 |
|----------|------|----------|
| 一段文本 | “已完成”或“进行中” | 三元表达式、`if` |
| 一个属性 | 按钮是否禁用 | 三元表达式、布尔表达式 |
| 一个附加元素 | 有错误时显示提示 | `&&` |
| 两个互斥元素 | 成功提示或失败提示 | 三元表达式、`if` |
| 整片界面 | 加载页、错误页、内容页 | 提前返回、`switch` |

条件渲染的结果仍然是普通可渲染值：

```text
条件数据
→ JavaScript 选择分支
→ 分支产生字符串、React 元素、null 等值
→ React 渲染选中的值
```

```jsx
const isCompleted = true;
const statusText = isCompleted ? "已完成" : "进行中";

const taskStatus = (
  <p>
    任务状态：{statusText}
  </p>
);
```

页面显示“任务状态：已完成”。React 并没有执行新的模板指令；JavaScript 三元表达式先选择字符串，JSX 再渲染该字符串。

### 2. 先确定变化范围

选择条件写法之前，先判断“条件变化时，界面的哪一部分不同”。只变化一段文本时，不需要复制整个结构；整个区域互斥时，也不应把每个子元素分别写条件。

下面两种状态只有文字和类名不同，保留共同结构更清晰：

```jsx
const isCompleted = false;
const statusText = isCompleted ? "已完成" : "进行中";
const statusClassName = isCompleted
  ? "task-status task-status--completed"
  : "task-status task-status--pending";

const taskElement = (
  <article>
    <h2>核对订单</h2>
    <p className={statusClassName}>{statusText}</p>
  </article>
);
```

页面显示“进行中”，并使用 `task-status task-status--pending` 类名。若两个分支的结构完全不同，应选择完整元素或提前返回，而不是在同一结构内布置大量零散条件。

## 二、`if` 分支

### 1. 在 JSX 外计算结果

`if` 是 JavaScript 语句，不能直接放入 JSX 大括号。它适合在渲染 JSX 之前处理多步判断，并把结果保存为变量。

**基本形式：**

```js
let result;

if (condition) {
  result = valueWhenTrue;
} else {
  result = valueWhenFalse;
}
```

结果可以是字符串、数字、React 元素或其他可渲染值。

```jsx
const task = {
  title: "核对订单",
  completed: false
};

let statusText;

if (task.completed) {
  statusText = "已完成";
} else {
  statusText = "进行中";
}

const taskElement = (
  <article>
    <h2>{task.title}</h2>
    <p>{statusText}</p>
  </article>
);
```

页面显示任务标题和“进行中”。这里先完成分支选择，JSX 只负责使用最终结果。

### 2. 选择不同 React 元素

`if` 分支也可以为变量分配不同的 React 元素。适合两个分支结构不同，或每个分支需要多行内容的情况。

```jsx
const requestState = "error";
let resultElement;

if (requestState === "loading") {
  resultElement = <p role="status">正在加载任务...</p>;
} else if (requestState === "error") {
  resultElement = (
    <div role="alert">
      <h2>加载失败</h2>
      <p>请检查网络后重试。</p>
    </div>
  );
} else {
  resultElement = <p>任务加载完成。</p>;
}

const pageElement = (
  <main>
    <h1>任务中心</h1>
    {resultElement}
  </main>
);
```

当前 `requestState` 为 `"error"`，页面显示“加载失败”和处理提示。`else if` 适合按优先级逐项检查多个互斥条件；命中一个分支后，后续分支不再执行。

## 三、三元表达式

### 1. 在两个值之间选择

三元表达式会根据条件在两个值中选择一个。它本身是表达式，因此可以直接放入 JSX 大括号。

**语法形式：**

```js
condition ? valueWhenTrue : valueWhenFalse
```

| 部分 | 含义 |
|------|------|
| `condition` | 会被转换为布尔值的条件 |
| `valueWhenTrue` | 条件为真时的结果 |
| `valueWhenFalse` | 条件为假时的结果 |

三元表达式适合清晰的二选一，不适合承载大量语句。

```jsx
const isCompleted = true;

const taskElement = (
  <article>
    <h2>核对订单</h2>
    <p>{isCompleted ? "已完成" : "进行中"}</p>
    <button type="button" disabled={isCompleted}>
      {isCompleted ? "无需处理" : "标记完成"}
    </button>
  </article>
);
```

页面显示“已完成”，按钮文本是“无需处理”且处于禁用状态。文本和属性都由同一个布尔条件选择。

### 2. 在两个元素之间选择

三元表达式的两个结果可以是完整 React 元素：

```jsx
const hasPermission = false;

const permissionResult = (
  <section>
    {hasPermission ? (
      <button type="button">导出任务</button>
    ) : (
      <p role="alert">当前账号没有导出权限。</p>
    )}
  </section>
);
```

当前页面显示权限提示，不生成导出按钮。多行 JSX 分支使用括号包裹，能清楚标识每个结果的边界。

### 3. 避免嵌套三元表达式

三元表达式可以嵌套，但连续嵌套会让条件与结果难以对应：

```jsx
const status = "error";

// 不推荐：需要逐层寻找每个问号与冒号的对应关系。
const statusText = status === "loading"
  ? "加载中"
  : status === "error"
    ? "加载失败"
    : "加载完成";
```

多于两个互斥状态时，优先使用 `if...else if` 或 `switch`：

```jsx
const status = "error";
let statusText;

if (status === "loading") {
  statusText = "加载中";
} else if (status === "error") {
  statusText = "加载失败";
} else {
  statusText = "加载完成";
}

const statusElement = <p>{statusText}</p>;
```

页面仍显示“加载失败”，但分支顺序和兜底结果更加明确。

## 四、逻辑与运算

### 1. 按条件增加内容

逻辑与 `&&` 会先计算左侧。如果左侧为真值，返回右侧；如果左侧为假值，直接返回左侧。

**语法形式：**

```js
condition && valueWhenTrue
```

在 JSX 中，它适合表达“条件满足时增加一个元素，否则不显示”的单分支需求：

```jsx
const hasValidationError = true;
const errorMessage = "订单金额不能为空";

const formField = (
  <div>
    <label htmlFor="order-amount">订单金额</label>
    <input id="order-amount" name="amount" />
    {hasValidationError && (
      <p role="alert">{errorMessage}</p>
    )}
  </div>
);
```

左侧为 `true`，表达式返回右侧 `p` 元素，因此页面显示错误信息。左侧为 `false` 时，表达式结果是 `false`，React 不会为它生成可见内容。

### 2. 避免数字 `0` 被显示

逻辑与返回的是操作数本身，不保证返回布尔值。数字 `0` 是假值，但 React 会把数字作为文本渲染。

下面的代码在空数组时会显示一个意外的 `0`：

```jsx
const tasks = [];

// 错误：tasks.length 为 0 时，整个表达式结果也是数字 0。
const taskSummary = (
  <section>
    {tasks.length && <p>共有 {tasks.length} 个任务</p>}
  </section>
);
```

DOM 中会出现文本：

```text
0
```

把左侧条件明确转换成布尔结果：

```jsx
const tasks = [];

const taskSummary = (
  <section>
    {tasks.length > 0 && (
      <p>共有 {tasks.length} 个任务</p>
    )}
  </section>
);
```

`tasks.length > 0` 的结果是布尔值 `false`，因此空数组时不会显示任何内容。类似地，可能为 `0` 或 `NaN` 的数值都不应直接作为 `&&` 左操作数。

## 五、不渲染内容

### 1. 使用 `null`

React 接受 `null` 作为渲染结果，并且不为它生成 DOM。它是最明确的“这里不渲染内容”表达。

```jsx
const hasNotice = false;
const noticeElement = hasNotice
  ? <p role="status">任务已更新。</p>
  : null;

const pageElement = (
  <main>
    <h1>任务中心</h1>
    {noticeElement}
  </main>
);
```

页面只显示“任务中心”，提示位置不生成元素。

普通函数也可以通过返回 `null` 表示没有结果：

```jsx
/**
 * 根据开关生成任务提示。
 * @param {boolean} isVisible 是否需要显示提示。
 * @returns {React.ReactElement|null} 可见时返回提示元素，否则返回 null。
 */
function buildTaskNotice(isVisible) {
  if (!isVisible) {
    return null;
  }

  return <p role="status">任务已更新。</p>;
}

const pageElement = (
  <main>
    <h1>任务中心</h1>
    {buildTaskNotice(false)}
  </main>
);
```

函数返回 `null` 后，React 同样不生成提示 DOM。组件也可以返回 `null`，表示本次渲染不输出任何界面节点。

### 2. 区分空值的语义

多个值都可能没有可见结果，但含义并不完全相同：

| 值 | 可见结果 | 推荐语义 |
|----|----------|----------|
| `null` | 无 | 明确表示“不渲染” |
| `undefined` | 无 | 常见于变量缺值，不建议作为主动分支结果 |
| `false`、`true` | 无 | 常见于逻辑表达式结果 |
| `""` | 无可见字符 | 仍然是字符串，只是内容为空 |
| `[]` | 无列表项 | 表示没有子元素的数组 |

条件分支需要主动表达“不生成内容”时，优先返回 `null`。这能让读者区分“有意不渲染”和“变量意外没有值”。

```jsx
const isReadonly = true;
const editControl = isReadonly
  ? null
  : <button type="button">编辑任务</button>;

const taskElement = (
  <article>
    <h2>核对订单</h2>
    {editControl}
  </article>
);
```

当前不会生成编辑按钮。`null` 清楚表明这是只读状态下的预期结果。

## 六、提前返回

### 1. 在入口处处理前置状态

当不同条件控制整片界面时，可以在生成主内容之前提前返回。它把加载、失败、权限等前置状态放在函数开头，避免主内容被多层条件包裹。

**基本结构：**

```text
检查阻断主内容的状态
→ 命中时立即返回对应界面
→ 所有检查通过后生成主内容
```

```jsx
/**
 * 根据任务页状态生成一整片界面。
 * @param {{isLoading: boolean, error: string|null, title: string}} pageState
 * 当前页面状态；error 为 null 表示没有错误。
 * @returns {React.ReactElement} 加载、错误或正常内容中的一个。
 */
function buildTaskPage(pageState) {
  if (pageState.isLoading) {
    return <p role="status">正在加载任务...</p>;
  }

  if (pageState.error) {
    return <p role="alert">加载失败：{pageState.error}</p>;
  }

  return (
    <article>
      <h2>{pageState.title}</h2>
      <p>任务已经可以处理。</p>
    </article>
  );
}

const pageState = {
  isLoading: false,
  error: "网络连接中断",
  title: ""
};

const pageElement = buildTaskPage(pageState);
```

函数在错误分支提前结束，因此不会继续生成正常内容，页面显示“加载失败：网络连接中断”。

### 2. 安排判断顺序

提前返回的顺序表示状态优先级。先判断越基础、越能阻断后续内容的条件：

| 建议顺序 | 状态 | 原因 |
|----------|------|------|
| 1 | 无权限或必要参数缺失 | 后续请求和内容都没有意义 |
| 2 | 加载中 | 数据尚不可用 |
| 3 | 加载失败 | 无法生成正常内容 |
| 4 | 空数据 | 请求成功但没有内容 |
| 5 | 正常内容 | 前置状态均已排除 |

如果多个布尔值可能同时为 `true`，顺序会隐式决定最终界面。更稳妥的方式是使用单一状态字段直接表示互斥阶段。

```jsx
/**
 * 按明确优先级生成任务区域。
 * @param {{hasPermission: boolean, status: string, taskCount: number}} view
 * 任务区域状态；status 只接受 loading、error 或 success。
 * @returns {React.ReactElement|null} 返回当前唯一界面；无权限时返回 null。
 */
function buildTaskRegion(view) {
  if (!view.hasPermission) {
    return null;
  }

  if (view.status === "loading") {
    return <p role="status">正在加载...</p>;
  }

  if (view.status === "error") {
    return <p role="alert">加载失败。</p>;
  }

  if (view.taskCount === 0) {
    return <p>当前没有任务。</p>;
  }

  return <p>共有 {view.taskCount} 个任务。</p>;
}
```

这段函数把权限、请求阶段、空数据和正常数据按依赖顺序排列。每次调用只会返回一个结果。

## 七、多状态界面

### 1. 区分请求状态与数据状态

常见数据界面至少包含四种结果：

| 界面结果 | 请求状态 | 数据 | 应显示内容 |
|----------|----------|------|------------|
| 加载中 | `loading` | 尚不可用 | 进度或等待提示 |
| 加载失败 | `error` | 不可信或不可用 | 错误原因与恢复入口 |
| 成功但为空 | `success` | 空数组 | 空状态说明 |
| 成功且有数据 | `success` | 非空数组 | 正常内容 |

“空数据”不是“加载失败”。只有请求成功后，才根据数据长度选择空状态或正常内容。

```jsx
/**
 * 根据请求阶段和任务数组生成任务区域。
 * @param {{status: string, errorMessage: string, tasks: string[]}} view
 * status 只接受 loading、error 或 success。
 * @returns {React.ReactElement} 当前请求状态对应的界面。
 */
function buildTaskResult(view) {
  if (view.status === "loading") {
    return <p role="status">正在加载任务...</p>;
  }

  if (view.status === "error") {
    return <p role="alert">加载失败：{view.errorMessage}</p>;
  }

  if (view.tasks.length === 0) {
    return <p>当前没有待处理任务。</p>;
  }

  return <p>待处理任务：{view.tasks.join("、")}</p>;
}

const view = {
  status: "success",
  errorMessage: "",
  tasks: ["核对订单", "复核退款"]
};

const resultElement = buildTaskResult(view);
```

页面显示“待处理任务：核对订单、复核退款”。把 `tasks` 改为空数组后，页面显示明确的空状态，而不是错误信息。

### 2. 使用单一状态字段

下面的三个布尔值可能产生矛盾组合：

```js
const isLoading = true;
const hasError = true;
const isSuccess = true;
```

代码必须额外约定谁优先，仍无法阻止不合法状态出现。互斥阶段更适合使用一个字段：

```js
const requestStatus = "loading";
```

允许值可以限定为：

```text
idle | loading | error | success
```

`switch` 适合把一个状态字段映射为多个互斥结果：

```jsx
/**
 * 使用单一状态字段生成请求提示。
 * @param {"idle"|"loading"|"error"|"success"} status 当前请求阶段。
 * @returns {React.ReactElement|null} 对应提示；idle 阶段不显示内容。
 */
function buildRequestNotice(status) {
  switch (status) {
    case "idle":
      return null;
    case "loading":
      return <p role="status">正在加载...</p>;
    case "error":
      return <p role="alert">加载失败。</p>;
    case "success":
      return <p role="status">加载完成。</p>;
    default:
      throw new Error(`未知请求状态：${status}`);
  }
}

const noticeElement = buildRequestNotice("success");
```

页面显示“加载完成”。`default` 分支让意外状态尽早暴露，而不是静默生成错误界面。

## 八、隐藏与移除

### 1. 保留 DOM 的隐藏方式

HTML `hidden` 属性和 CSS `display: none` 都会让元素不可见，但元素仍然存在于 DOM 中。

```jsx
const isVisible = false;

const taskDetails = (
  <section hidden={!isVisible}>
    <h2>任务详情</h2>
    <input defaultValue="核对订单" />
  </section>
);
```

当前 `section` 不可见，但仍能通过 DOM 查询找到。它内部的输入值等 DOM 状态也仍然存在。

使用动态类名控制 `display` 也是相同类别：

```jsx
const isVisible = false;
const detailsClassName = isVisible
  ? "task-details"
  : "task-details task-details--hidden";

const taskDetails = (
  <section className={detailsClassName}>
    <h2>任务详情</h2>
  </section>
);
```

CSS 中若把 `task-details--hidden` 设置为 `display: none`，元素仍保留在 DOM。

### 2. 条件渲染会移除内容

返回 `null` 或选择不包含该元素的分支时，React 不会保留这片 DOM：

```jsx
const isVisible = false;

const taskDetails = isVisible
  ? (
    <section>
      <h2>任务详情</h2>
      <input defaultValue="核对订单" />
    </section>
  )
  : null;
```

当前 DOM 中没有任务详情 `section`。以后条件变为 `true` 时，React 会创建新的 DOM 节点，原节点上的焦点、输入值等 DOM 状态不会自动保留。

两种方式的差异如下：

| 方式 | 是否可见 | DOM 是否存在 | 适用情况 |
|------|----------|--------------|----------|
| `hidden` | 否 | 是 | 需要暂时隐藏且保留 DOM |
| CSS `display: none` | 否 | 是 | 由样式规则控制显示 |
| 条件返回 `null` | 否 | 否 | 当前状态不应存在这片内容 |

组件 State 是否保留还取决于组件身份与树位置，不能只根据 CSS 可见性判断。

## 九、写法选择

### 1. 按条件复杂度选择

没有一种写法适合所有条件。优先选择能直接表达当前关系的最简单形式：

| 需求 | 推荐写法 | 判断依据 |
|------|----------|----------|
| 两段短文本二选一 | 三元表达式 | 两个结果都简单 |
| 满足条件时增加一个元素 | `&&` | 没有“否则”内容 |
| 多步判断后得到一个局部值 | JSX 外 `if` | 需要语句或中间变量 |
| 多个互斥阶段 | `if...else if` 或 `switch` | 状态超过两个 |
| 整片界面被前置状态阻断 | 提前返回 | 能减少主内容嵌套 |
| 明确不生成内容 | `null` | 表达主动空渲染 |

代码首先要让状态与结果的对应关系清楚。不要为了缩短行数，把多状态界面压进嵌套三元表达式。

### 2. 完整选择示例

下面的示例把不同写法放在各自适合的位置：

```jsx
/**
 * 生成任务摘要界面。
 * @param {{
 *   status: "loading"|"error"|"success",
 *   errorMessage: string,
 *   task: {title: string, completed: boolean, warning: string}
 * }} view 当前任务界面数据。
 * @returns {React.ReactElement} 当前状态对应的任务摘要。
 */
function buildTaskSummary(view) {
  if (view.status === "loading") {
    return <p role="status">正在加载任务...</p>;
  }

  if (view.status === "error") {
    return <p role="alert">加载失败：{view.errorMessage}</p>;
  }

  const statusText = view.task.completed ? "已完成" : "进行中";

  return (
    <article>
      <h2>{view.task.title}</h2>
      <p>状态：{statusText}</p>
      {view.task.warning && (
        <p role="alert">{view.task.warning}</p>
      )}
    </article>
  );
}

const view = {
  status: "success",
  errorMessage: "",
  task: {
    title: "核对订单",
    completed: false,
    warning: "订单金额与付款记录不一致"
  }
};

const pageElement = buildTaskSummary(view);
ReactDOM.render(pageElement, document.getElementById("root"));
```

浏览器页面显示：

```text
核对订单
状态：进行中
订单金额与付款记录不一致
```

示例使用提前返回处理整页状态，用三元表达式选择短文本，用 `&&` 添加可选警告。每种写法只负责自己最适合的条件范围。

## 十、知识检查

关键规则如下：

| 检查项 | 正确结论 |
|--------|----------|
| `if` 能否直接放入 JSX 大括号 | 不能，它是语句；应在 JSX 外执行 |
| 何时使用三元表达式 | 两个清晰结果之间二选一 |
| `&&` 左侧为 `0` 会怎样 | 返回数字 `0`，React 会显示它 |
| 怎样明确表示不渲染 | 使用 `null` |
| 加载失败与空数据是否相同 | 不同；空数据必须建立在请求成功之上 |
| 多个互斥状态怎样表示 | 优先使用单一状态字段 |
| 提前返回解决什么问题 | 处理整片界面的前置状态并减少嵌套 |
| `hidden` 与 `null` 的主要区别 | 前者保留 DOM，后者不生成 DOM |

## 十一、参考资料

- [React 旧版文档：Conditional Rendering](https://legacy.reactjs.org/docs/conditional-rendering.html)
- [React 旧版文档：JSX In Depth](https://legacy.reactjs.org/docs/jsx-in-depth.html)
