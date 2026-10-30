---
title: "函数组件与组件拆分"
tags:
  - React
  - 组件
  - JSX
excerpt: "讲解 React 16.8 函数组件的定义、Props 参数、返回值和纯渲染约束，并说明如何按照职责和变化边界拆分组件。"
date: 2026-07-31
---

# 函数组件与组件拆分

## 一、函数组件

### 1. 定义函数组件

函数组件是一个接收 Props、返回 React 可渲染值的 JavaScript 函数。React 根据组件返回值构造当前组件对应的元素树。

**基本形式：**

```jsx
// 接收内容 Props，并返回用于描述界面的 React 元素。
function ComponentName(props) {
  return <div>{props.content}</div>;
}
```

| 组成部分 | 含义 |
|----------|------|
| `ComponentName` | 组件名称，必须以大写字母开头 |
| `props` | 父组件传入的只读属性对象 |
| `return` | 当前渲染要交给 React 的界面描述 |

下面定义一个任务状态组件。`status` 决定组件显示的文本：

```jsx
/**
 * 显示任务当前状态。
 * @param {{ status: string }} props 组件属性，status 为任务状态。
 * @returns {React.ReactElement} 状态文本元素。
 */
function TaskStatus(props) {
  return <span>状态：{props.status}</span>;
}

const element = <TaskStatus status="处理中" />;
```

页面结果为：

```text
状态：处理中
```

组件名称如果以小写字母开头，JSX 会把它当作浏览器原生标签，而不是调用当前作用域中的函数。

```jsx
// React 会把 taskStatus 当作自定义 DOM 标签名。
function taskStatus() {
  return <span>处理中</span>;
}

const element = <taskStatus />;
```

### 2. 组件调用由 React 管理

在 JSX 中使用 `<TaskStatus />` 时，React 负责调用组件、保存组件状态并把返回值纳入组件树。不要把组件当作普通函数直接执行：

```jsx
// 正确：React 能识别 TaskStatus 的组件身份。
const statusElement = <TaskStatus status="已完成" />;

// 错误：绕过 React，Hooks 和组件身份都无法得到正确管理。
const invalidElement = TaskStatus({ status: "已完成" });
```

直接调用在没有 Hook 时可能暂时得到相似的 React 元素，但组件边界已经消失。一旦函数内部使用 Hook，调用顺序还会归入调用者，破坏组件的状态归属。

### 3. 可返回的内容

React 16.8 函数组件可以返回 React 元素、Fragment、字符串、数字、元素数组或 `null`。最常见的返回值仍然是一个 JSX 元素。

| 返回值 | 结果 |
|--------|------|
| `<article>...</article>` | 渲染一个元素及其子树 |
| `<>...</>` | 渲染多个并列节点，不增加额外 DOM |
| `"暂无任务"` | 渲染文本节点 |
| `null` | 当前组件不输出界面节点 |
| 元素数组 | 渲染数组中的元素，列表项需要稳定 `key` |

下面的组件在没有任务时返回 `null`：

::: details 查看可返回的内容的示例代码
```jsx
/**
 * 仅在存在错误时显示错误信息。
 * @param {{ message?: string }} props 组件属性，message 为空时不渲染。
 * @returns {React.ReactElement | null} 错误提示或空渲染。
 */
function ErrorMessage({ message }) {
  if (!message) {
    return null;
  }

  return <p role="alert">{message}</p>;
}
```
:::

`return` 后如果需要换行书写 JSX，应使用括号包裹。否则 JavaScript 自动分号插入可能让函数提前返回 `undefined`。

::: details 查看可返回的内容的示例代码
```jsx
/**
 * 演示正确的多行 JSX 返回方式。
 * @returns {React.ReactElement} 任务摘要。
 */
function TaskSummary() {
  return (
    <section>
      <h2>任务摘要</h2>
      <p>待处理 3 项</p>
    </section>
  );
}
```
:::

## 二、渲染函数

### 1. 每次渲染都会重新执行

父组件重新渲染、组件 State 更新或读取的 Context 变化时，函数组件会再次执行。函数体中的局部变量也会重新计算。

::: details 查看每次渲染都会重新执行的示例代码
```jsx
/**
 * 根据任务列表计算未完成数量。
 * @param {{ tasks: Array<{ id: number, completed: boolean }> }} props 组件属性。
 * @returns {React.ReactElement} 未完成任务数量。
 */
function PendingCount({ tasks }) {
  const pendingCount = tasks.filter(
    // 只保留未完成任务，用于计算当前渲染的派生数据。
    (task) => !task.completed
  ).length;

  return <p>待处理：{pendingCount}</p>;
}
```
:::

`pendingCount` 可以直接根据 Props 计算，不需要放入 State。每次渲染重新计算能保证它始终与 `tasks` 一致。

### 2. 渲染必须保持纯粹

纯渲染表示在 Props、State 和 Context 相同的情况下，组件应返回相同的界面描述。渲染期间可以读取数据和计算结果，但不能执行会改变外部环境的操作。

| 可以在渲染期间执行 | 不应在渲染期间执行 |
|--------------------|--------------------|
| 读取 Props、State、Context | 发起网络请求 |
| 使用 `map`、`filter` 计算数据 | 修改传入对象或全局变量 |
| 创建 React 元素 | 注册事件监听或定时器 |
| 格式化文本和数值 | 直接操作 DOM |

下面的组件直接修改了 Props 中的数组，调用者持有的数据也会被改变：

::: details 查看渲染必须保持纯粹的示例代码
```jsx
/**
 * 错误示例：排序会直接修改传入的 tasks 数组。
 * @param {{ tasks: Array<{ id: number, priority: number }> }} props 组件属性。
 * @returns {React.ReactElement} 排序后的任务列表。
 */
function InvalidTaskList({ tasks }) {
  tasks.sort(
    /**
     * 按优先级降序排列任务。
     * @param {{ priority: number }} left 左侧任务。
     * @param {{ priority: number }} right 右侧任务。
     * @returns {number} 排序比较结果。
     */
    (left, right) => right.priority - left.priority
  );

  return <p>第一项任务编号：{tasks[0].id}</p>;
}
```
:::

正确方式是复制数组后再排序：

::: details 查看渲染必须保持纯粹的示例代码
```jsx
/**
 * 在不修改 Props 的前提下取得最高优先级任务。
 * @param {{ tasks: Array<{ id: number, priority: number }> }} props 组件属性。
 * @returns {React.ReactElement} 最高优先级任务编号。
 */
function HighestPriorityTask({ tasks }) {
  const sortedTasks = [...tasks].sort(
    /**
     * 按优先级降序排列复制后的任务。
     * @param {{ priority: number }} left 左侧任务。
     * @param {{ priority: number }} right 右侧任务。
     * @returns {number} 排序比较结果。
     */
    (left, right) => right.priority - left.priority
  );

  return <p>第一项任务编号：{sortedTasks[0].id}</p>;
}
```
:::

## 三、组件拆分

### 1. 按独立职责拆分

组件拆分的目标是让一个组件只负责一组紧密相关的数据和界面行为。出现以下情况时，可以考虑提取子组件：

- 一片界面具有明确业务名称；
- 一片界面拥有独立 Props 契约；
- 同一结构在多个位置重复出现；
- 子区域的变化频率与父区域明显不同；
- 父组件同时承担数据编排和大量展示细节。

下面的 `TaskPanel` 同时包含标题、统计和列表。统计与列表都有清晰职责，因此可以提取：

::: details 查看按独立职责拆分的示例代码
```jsx
/**
 * 显示任务数量。
 * @param {{ total: number }} props 组件属性，total 为任务总数。
 * @returns {React.ReactElement} 任务数量文本。
 */
function TaskCount({ total }) {
  return <p>共 {total} 项任务</p>;
}

/**
 * 显示单条任务。
 * @param {{ title: string }} props 组件属性，title 为任务标题。
 * @returns {React.ReactElement} 任务列表项。
 */
function TaskItem({ title }) {
  return <li>{title}</li>;
}

/**
 * 显示任务面板。
 * @param {{ tasks: Array<{ id: number, title: string }> }} props 组件属性。
 * @returns {React.ReactElement} 包含统计和列表的任务面板。
 */
function TaskPanel({ tasks }) {
  return (
    <section>
      <h2>今日任务</h2>
      <TaskCount total={tasks.length} />
      <ul>
        {tasks.map(
          // 把每条任务转换为具有稳定 key 的 TaskItem。
          (task) => <TaskItem key={task.id} title={task.title} />
        )}
      </ul>
    </section>
  );
}
```
:::

`TaskPanel` 负责组织区域，`TaskCount` 负责统计展示，`TaskItem` 负责单项结构。三个组件通过明确 Props 连接，不共享隐藏的可变数据。

### 2. 设计最小接口

子组件只应接收完成职责所需的数据。传入整个页面模型会扩大耦合范围，使子组件依赖调用者的内部结构。

```jsx
// 不建议：TaskTitle 被迫了解 task 对象结构。
<TaskTitle task={task} />

// 建议：组件接口直接表达所需数据。
<TaskTitle title={task.title} urgent={task.priority === "high"} />
```

最小接口不是参数越少越好，而是每个参数都与组件职责直接相关。多个始终一起使用的字段可以保留为领域对象；只读取一两个字段时通常应显式传递。

### 3. 避免机械拆分

只有一行 JSX 不代表必须提取组件。以下情况通常保留在父组件中更清晰：

- 结构只出现一次且没有独立含义；
- 提取后仍需透传大量父组件数据；
- 子组件只包装一个原生标签，没有新增语义或行为；
- 拆分导致读者频繁跨文件才能理解一段简单结构。

组件边界应服务于职责、复用和变化管理，而不是追求组件数量或文件长度。

## 四、组件定义位置

### 1. 不在组件内部定义组件

在函数组件内部定义另一个组件时，外层组件每次渲染都会创建新的组件类型。React 会把新类型视为不同身份，导致其 State 被重置。

::: details 查看不在组件内部定义组件的示例代码
```jsx
/**
 * 错误示例：InnerEditor 会在每次渲染时变成新的组件类型。
 * @returns {React.ReactElement} 包含内部组件的面板。
 */
function InvalidPanel() {
  /**
   * 显示任务编辑框。
   * @returns {React.ReactElement} 文本输入框。
   */
  function InnerEditor() {
    const [title, setTitle] = React.useState("");

    /**
     * 同步输入框内容。
     * @param {React.ChangeEvent<HTMLInputElement>} event 输入事件。
     * @returns {void}
     */
    function handleChange(event) {
      setTitle(event.target.value);
    }

    return <input value={title} onChange={handleChange} />;
  }

  return <InnerEditor />;
}
```
:::

应把 `InnerEditor` 定义在模块顶层，再通过 Props 传入需要的数据。这样组件类型在多次渲染之间保持稳定。

### 2. 导出公共组件

只在当前文件使用的组件可以保留为模块内部函数；被多个模块使用的组件再使用具名导出或默认导出。导出方式不会改变 React 行为，选择应与项目模块规范保持一致。

```jsx
/**
 * 显示公共空状态。
 * @param {{ message: string }} props 组件属性，message 为提示文本。
 * @returns {React.ReactElement} 空状态段落。
 */
export function EmptyState({ message }) {
  return <p>{message}</p>;
}
```

## 五、常见问题

| 问题 | 原因 | 处理方式 |
|------|------|----------|
| 组件没有被 React 识别 | 组件名以小写字母开头 | 使用大写字母开头的名称 |
| 多行 JSX 返回 `undefined` | `return` 后立即换行 | 使用括号包裹 JSX |
| 父组件数据被意外改变 | 渲染期间修改 Props 对象或数组 | 复制后计算，保持 Props 只读 |
| 子组件 State 反复重置 | 在父组件函数内部定义组件类型 | 把组件定义移到模块顶层 |
| 拆分后 Props 层层透传 | 组件边界与数据职责不匹配 | 重新确定状态所有者和组件接口 |

函数组件不是简单的“返回 JSX 的工具函数”。它在 React 树中拥有稳定身份，受 React 的渲染、状态和生命周期规则管理。
