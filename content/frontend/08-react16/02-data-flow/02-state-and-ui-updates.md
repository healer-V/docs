---
title: "State 与界面更新"
tags:
  - React
  - State
  - useState
excerpt: "说明组件为什么需要 State，并通过 useState 的初始值、当前值和更新函数建立从用户操作到界面更新的基础闭环。"
date: 2026-07-30
---

# State 与界面更新

Props 负责接收外部输入，但组件还需要记住用户操作产生的变化。State 是组件内部会随时间变化、并且会影响渲染结果的数据。

## 一、为什么需要 State

### 1. 普通变量不会驱动更新

组件中的普通局部变量会在每次函数执行时重新创建。修改变量既不会通知 React，也不会让组件自动重新执行。

```jsx
/**
 * 演示普通变量无法驱动界面更新。
 * @returns {React.ReactElement} 一个不会正确更新计数的按钮。
 */
function InvalidCounter() {
  let count = 0;

  // 点击只修改当前函数调用留下的变量，不会请求 React 重新渲染。
  const handleClick = () => {
    count += 1;
    console.log(count);
  };

  return (
    <button type="button" onClick={handleClick}>
      点击次数：{count}
    </button>
  );
}
```

点击后控制台中的数字会变化，但按钮仍显示“点击次数：0”。React 不知道 `count` 发生了变化。

### 2. State 需要同时满足两个条件

一份数据通常在同时满足以下条件时进入 State：

1. 数据需要在多次渲染之间保留；
2. 数据变化后需要更新界面。

| 数据 | 是否适合 State | 原因 |
|------|----------------|------|
| 当前是否展开详情 | 是 | 用户操作会改变，并影响界面 |
| 输入框当前内容 | 是 | 需要保留并显示 |
| 从 Props 直接计算的任务数量 | 否 | 每次渲染可以直接计算 |
| 固定标题 `"任务中心"` | 否 | 不会变化 |
| 仅供事件函数使用的临时变量 | 通常否 | 不影响渲染 |

State 不是存放所有变量的容器，只保存组件需要记住的最小变化数据。

## 二、`useState`

### 1. API 作用与形式

`useState` 是 React 16.8 提供的 Hook，用于给函数组件添加 State。

**调用形式：**

```js
const [state, setState] = useState(initialState);
```

| 部分 | 含义 |
|------|------|
| `initialState` | 当前组件实例首次创建状态时使用的初始值 |
| `state` | 当前这次渲染读取到的状态值 |
| `setState` | 提交新状态并安排后续渲染的函数 |
| 返回数组 | 固定包含状态值和对应更新函数 |

变量名由业务含义决定，不要求必须叫 `state`：

```jsx
const [completed, setCompleted] = useState(false);
const [query, setQuery] = useState("");
const [taskCount, setTaskCount] = useState(0);
```

命名惯例是 `[value, setValue]`，让当前值和更新函数容易对应。

### 2. 在组件顶层调用

`useState` 必须在函数组件顶层调用：

```jsx
import React, { useState } from "react";

/**
 * 保存任务是否完成。
 * @returns {React.ReactElement} 任务状态文本。
 */
function TaskStatus() {
  const [completed] = useState(false);

  return <p>{completed ? "已完成" : "进行中"}</p>;
}
```

不要在 `if`、循环、事件处理函数或普通嵌套函数中调用。Hook 必须保持固定的顶层调用顺序。

## 三、读取 State

### 1. State 属于当前渲染

调用 `useState` 后，组件可以像读取普通变量一样在 JSX 中读取当前值：

```jsx
/**
 * 根据 State 描述任务界面。
 * @returns {React.ReactElement} 任务状态与操作按钮。
 */
function TaskCard() {
  const [completed] = useState(false);

  return (
    <article>
      <h2>核对订单</h2>
      <p className={completed ? "is-completed" : "is-pending"}>
        {completed ? "已完成" : "进行中"}
      </p>
      <button type="button" disabled={completed}>
        {completed ? "无需处理" : "标记完成"}
      </button>
    </article>
  );
}
```

首次渲染时 `completed` 是 `false`，因此页面显示“进行中”，按钮可用并显示“标记完成”。

State 可以同时决定文本、属性、类名和条件内容。React 会使用同一次渲染中的同一个状态值计算整棵组件子树。

## 四、更新 State

### 1. 调用更新函数

更新函数接收下一次渲染要使用的新值：

```js
setState(nextState);
```

更新通常发生在事件处理函数中：

```jsx
/**
 * 提供可以标记完成的任务。
 * @returns {React.ReactElement} 可交互任务卡片。
 */
function TaskCard() {
  const [completed, setCompleted] = useState(false);

  // 点击后提交新的完成状态。
  const handleComplete = () => {
    setCompleted(true);
  };

  return (
    <article>
      <h2>核对订单</h2>
      <p>{completed ? "已完成" : "进行中"}</p>
      <button
        type="button"
        disabled={completed}
        onClick={handleComplete}
      >
        {completed ? "已完成" : "标记完成"}
      </button>
    </article>
  );
}
```

首次页面显示“进行中”。点击按钮后，下一次渲染读取到 `completed === true`，文本和按钮同时变成“已完成”，按钮也被禁用。

### 2. 更新函数不会改写当前变量

调用 `setCompleted(true)` 是向 React 提交下一状态，不是给当前 `completed` 变量赋值：

```jsx
// 记录点击时当前渲染看到的状态，并提交下一状态。
const handleComplete = () => {
  console.log(completed);
  setCompleted(true);
  console.log(completed);
};
```

一次点击中的两条日志都是 `false`。事件处理函数仍然读取触发该事件的那次渲染值；React 随后重新执行组件，新的执行才得到 `true`。

这里可以确认：更新函数不会改写当前事件处理函数已经读取到的状态值。

## 五、更新流程

### 1. 从事件到 DOM

一次基础更新经过以下步骤：

```text
1. 用户单击按钮
2. React 调用事件处理函数
3. 处理函数调用 setCompleted(true)
4. React 安排 TaskCard 再次渲染
5. TaskCard 读取 completed === true
6. 组件返回新的 React 元素
7. ReactDOM 更新发生变化的 DOM
```

更新函数不会直接查找并修改 `<p>`。组件只声明“当前 State 对应什么界面”，React 负责把新旧结果同步到 DOM。

### 2. State 与声明式界面

不推荐手动执行以下命令式操作：

```js
statusElement.textContent = "已完成";
button.disabled = true;
button.textContent = "已完成";
```

这种写法需要开发者逐项维护 DOM，很容易遗漏。State 写法只改变数据：

```js
setCompleted(true);
```

文本、禁用状态和按钮内容都由 JSX 根据 State 重新计算。

## 六、组件局部状态

### 1. 每个组件实例独立保存 State

同一个组件在树中使用两次，会创建两个独立实例，每个实例拥有自己的 State：

```jsx
/**
 * 保存独立点击次数。
 * @param {{label: string}} props 按钮标签。
 * @returns {React.ReactElement} 独立计数按钮。
 */
function Counter({ label }) {
  const [count, setCount] = useState(0);

  // 基于当前计数提交下一数值。
  const handleClick = () => {
    setCount(count + 1);
  };

  return (
    <button type="button" onClick={handleClick}>
      {label}：{count}
    </button>
  );
}

const counters = (
  <div>
    <Counter label="待处理" />
    <Counter label="已完成" />
  </div>
);
```

点击“待处理”不会改变“已完成”的数字。两个组件类型相同，但位于组件树中的两个位置，因此拥有独立状态。

### 2. 区分 Props、State 与局部变量

| 数据 | 来源 | 能否由当前组件更新 | 是否驱动渲染 |
|------|------|--------------------|--------------|
| Props | 父组件 | 不能直接修改 | 新 Props 会参与渲染 |
| State | 当前组件 | 通过更新函数 | 会 |
| 局部变量 | 当前函数执行 | 可以普通赋值 | 不会主动触发 |

Props 是外部输入，State 是组件记忆，局部变量用于本次计算。三者都可以在 JSX 中读取，但所有权和更新方式不同。

## 七、多个状态值

### 1. 多次调用 `useState`

组件可以保存多个相互独立的状态：

```jsx
/**
 * 保存任务完成状态和备注显示状态。
 * @returns {React.ReactElement} 带两个独立状态的任务卡片。
 */
function TaskCard() {
  const [completed, setCompleted] = useState(false);
  const [showNote, setShowNote] = useState(false);

  // 切换任务完成状态。
  const handleToggleCompleted = () => {
    setCompleted(!completed);
  };

  // 切换备注是否可见。
  const handleToggleNote = () => {
    setShowNote(!showNote);
  };

  return (
    <article>
      <h2>核对订单</h2>
      <p>{completed ? "已完成" : "进行中"}</p>
      {showNote && <p>备注：检查付款记录。</p>}
      <button type="button" onClick={handleToggleCompleted}>
        切换状态
      </button>
      <button type="button" onClick={handleToggleNote}>
        {showNote ? "隐藏备注" : "显示备注"}
      </button>
    </article>
  );
}
```

两个更新函数分别改变对应状态。状态应该拆开还是合并，将结合对象更新和状态职责在第 4 章继续讨论。

## 八、完整示例

下面的片段组合 Props、State 和事件：

```jsx
/**
 * 显示并更新单个任务状态。
 * @param {{title: string}} props 父组件提供的任务标题。
 * @returns {React.ReactElement} 可切换状态的任务。
 */
function TaskItem({ title }) {
  const [completed, setCompleted] = useState(false);

  // 将完成状态切换为当前值的相反值。
  const handleToggle = () => {
    setCompleted(!completed);
  };

  return (
    <article>
      <h2>{title}</h2>
      <p>状态：{completed ? "已完成" : "进行中"}</p>
      <button type="button" onClick={handleToggle}>
        {completed ? "恢复任务" : "完成任务"}
      </button>
    </article>
  );
}

/**
 * 提供任务标题并渲染任务组件。
 * @returns {React.ReactElement} 任务页面。
 */
function TaskPage() {
  return (
    <main>
      <h1>任务中心</h1>
      <TaskItem title="核对订单" />
    </main>
  );
}

ReactDOM.render(<TaskPage />, document.getElementById("root"));
```

点击前：

```text
核对订单
状态：进行中
完成任务
```

点击后：

```text
核对订单
状态：已完成
恢复任务
```

标题来自父组件 Props，完成状态由 `TaskItem` 自己拥有。

## 九、知识检查

| 检查项 | 正确结论 |
|--------|----------|
| 普通变量为什么不能替代 State | 修改变量不会请求 React 重新渲染 |
| 什么数据适合进入 State | 需要跨渲染保留且影响界面的变化数据 |
| `useState` 返回什么 | 当前状态值和对应更新函数组成的数组 |
| 更新函数是否直接修改当前变量 | 不会，它提交下一状态 |
| 更新后组件发生什么 | React 重新执行组件并同步 DOM 差异 |
| 两个相同组件是否共享局部 State | 不共享，每个组件实例独立保存 |
| Props 与 State 的主要区别 | Props 来自父级且只读，State 由当前组件管理 |

## 十、参考资料

- [React 旧版文档：Hooks at a Glance](https://legacy.reactjs.org/docs/hooks-overview.html)
- [React 旧版文档：Using the State Hook](https://legacy.reactjs.org/docs/hooks-state.html)
