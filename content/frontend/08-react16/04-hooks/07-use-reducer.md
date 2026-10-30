---
title: "useReducer 与复杂状态"
tags:
  - React
  - Hooks
  - useReducer
excerpt: "讲解 useReducer 的 Reducer、State、Action、dispatch 和惰性初始化，并说明如何集中复杂状态转换及其与 useState 的选择边界。"
date: 2026-07-31
---

# useReducer 与复杂状态

## 一、useReducer

### 1. 调用形式

`useReducer` 使用一个纯 Reducer 函数集中计算 State 的下一值。

```text
const [state, dispatch] = React.useReducer(reducer, initialArg, init?)
```

| 参数或返回值 | 含义 |
|--------------|------|
| `reducer` | 接收当前 State 和 Action，返回下一 State 的纯函数 |
| `initialArg` | 初始参数 |
| `init` | 可选惰性初始化函数，接收 `initialArg` |
| `state` | 当前渲染的 State |
| `dispatch` | 提交 Action 的稳定函数 |

Reducer 的基本形式：

::: details 查看调用形式的示例代码
```jsx
/**
 * 根据操作计算下一计数。
 * @param {number} state 当前计数。
 * @param {{ type: string }} action 当前操作。
 * @returns {number} 下一计数。
 */
function counterReducer(state, action) {
  switch (action.type) {
    case "increment":
      return state + 1;
    case "decrement":
      return state - 1;
    default:
      throw new Error(`未知操作：${action.type}`);
  }
}
```
:::

组件使用：

::: details 查看调用形式的示例代码
```jsx
/**
 * 显示可增加和减少的计数器。
 * @returns {React.ReactElement} 计数器控件。
 */
function Counter() {
  const [count, dispatch] = React.useReducer(counterReducer, 0);

  /**
   * 提交增加操作。
   * @returns {void}
   */
  function handleIncrement() {
    dispatch({ type: "increment" });
  }

  /**
   * 提交减少操作。
   * @returns {void}
   */
  function handleDecrement() {
    dispatch({ type: "decrement" });
  }

  return (
    <div>
      <button type="button" onClick={handleDecrement}>-</button>
      <span>{count}</span>
      <button type="button" onClick={handleIncrement}>+</button>
    </div>
  );
}
```
:::

`dispatch` 不直接描述下一 State，而是描述“发生了什么”。Reducer 决定这个操作如何转换状态。

## 二、Reducer

### 1. 保持纯粹

Reducer 可以：

- 读取 `state` 和 `action`；
- 使用普通计算和条件判断；
- 创建并返回新对象或数组；
- 对相同输入返回相同结果。

Reducer 不应：

- 修改传入的 State；
- 发请求；
- 读写 DOM；
- 生成依赖时间或随机数的业务结果；
- 调用其他 State 更新函数；
- 写入模块级变量。

副作用由事件处理函数或 Effect 执行，Reducer 只描述状态转换。

### 2. 必须返回完整 State

Hook Reducer 的返回值会替换整个 State，不进行浅合并。

```jsx
const initialState = {
  title: "",
  priority: "normal",
  saving: false,
  error: null
};
```

错误写法：

```jsx
case "titleChanged":
  // 错误：其他字段全部丢失。
  return { title: action.title };
```

正确写法：

```jsx
case "titleChanged":
  return {
    ...state,
    title: action.title
  };
```

### 3. 未知 Action

开发阶段遇到未知 Action 时应主动抛错，避免 Reducer 静默返回错误状态：

```jsx
default:
  throw new Error(`不支持的 Action：${action.type}`);
```

第三方扩展确实允许未知 Action 时，也可以返回原 State，但必须是明确协议。

## 三、Action

### 1. 使用 type 描述操作

Action 通常是包含 `type` 的普通对象：

```js
{
  type: "titleChanged",
  title: "联系客户"
}
```

`type` 描述业务事件，其他字段提供执行转换需要的数据。

| Action | 含义 |
|--------|------|
| `{ type: "titleChanged", title }` | 标题输入发生变化 |
| `{ type: "priorityChanged", priority }` | 选择新的优先级 |
| `{ type: "saveStarted" }` | 保存请求开始 |
| `{ type: "saveSucceeded" }` | 保存完成 |
| `{ type: "saveFailed", message }` | 保存失败 |
| `{ type: "reset", task }` | 用指定任务重置编辑器 |

Action 应描述事实或意图，不直接暴露“把整个 State 设置成某对象”的底层实现。

### 2. 任务编辑 Reducer

::: details 查看任务编辑 Reducer的示例代码
```jsx
const initialEditorState = {
  title: "",
  priority: "normal",
  saving: false,
  error: null
};

/**
 * 计算任务编辑器的下一状态。
 * @param {{
 *   title: string,
 *   priority: string,
 *   saving: boolean,
 *   error: string | null
 * }} state 当前编辑器状态。
 * @param {{
 *   type: string,
 *   title?: string,
 *   priority?: string,
 *   message?: string,
 *   task?: { title: string, priority: string }
 * }} action 编辑器操作。
 * @returns {object} 下一编辑器状态。
 */
function taskEditorReducer(state, action) {
  switch (action.type) {
    case "titleChanged":
      return {
        ...state,
        title: action.title,
        error: null
      };

    case "priorityChanged":
      return {
        ...state,
        priority: action.priority
      };

    case "saveStarted":
      return {
        ...state,
        saving: true,
        error: null
      };

    case "saveSucceeded":
      return {
        ...state,
        saving: false
      };

    case "saveFailed":
      return {
        ...state,
        saving: false,
        error: action.message
      };

    case "reset":
      return {
        title: action.task.title,
        priority: action.task.priority,
        saving: false,
        error: null
      };

    default:
      throw new Error(`不支持的 Action：${action.type}`);
  }
}
```
:::

所有转换集中后，可以脱离 React 直接用输入和输出测试 Reducer。

## 四、组件使用

### 1. dispatch 用户操作

::: details 查看dispatch 用户操作的示例代码
```jsx
/**
 * 显示使用 Reducer 管理的任务编辑器。
 * @param {{ onSave: (task: { title: string, priority: string }) => Promise<void> }} props 组件属性。
 * @returns {React.ReactElement} 任务编辑表单。
 */
function TaskEditor({ onSave }) {
  const [state, dispatch] = React.useReducer(
    taskEditorReducer,
    initialEditorState
  );

  /**
   * 提交标题变化。
   * @param {React.ChangeEvent<HTMLInputElement>} event 输入事件。
   * @returns {void}
   */
  function handleTitleChange(event) {
    dispatch({
      type: "titleChanged",
      title: event.target.value
    });
  }

  /**
   * 提交优先级变化。
   * @param {React.ChangeEvent<HTMLSelectElement>} event 选择事件。
   * @returns {void}
   */
  function handlePriorityChange(event) {
    dispatch({
      type: "priorityChanged",
      priority: event.target.value
    });
  }

  /**
   * 执行保存，并把请求结果转换为 Action。
   * @param {React.FormEvent<HTMLFormElement>} event 表单提交事件。
   * @returns {Promise<void>} 保存完成后的 Promise。
   */
  async function handleSubmit(event) {
    event.preventDefault();

    if (state.title.trim() === "") {
      dispatch({
        type: "saveFailed",
        message: "请输入任务标题"
      });
      return;
    }

    dispatch({ type: "saveStarted" });

    try {
      await onSave({
        title: state.title,
        priority: state.priority
      });
      dispatch({ type: "saveSucceeded" });
    } catch (error) {
      dispatch({
        type: "saveFailed",
        message: "保存失败，请重试"
      });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={state.title} onChange={handleTitleChange} />
      <select value={state.priority} onChange={handlePriorityChange}>
        <option value="normal">普通</option>
        <option value="high">紧急</option>
      </select>
      <button type="submit" disabled={state.saving}>
        {state.saving ? "保存中" : "保存"}
      </button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
```
:::

请求属于副作用，仍由事件函数执行；Reducer 只接收请求开始、成功和失败的结果。

## 五、惰性初始化

### 1. 第三个参数

初始 State 需要根据参数计算时，使用 `init`：

```text
React.useReducer(reducer, initialArg, init)
```

::: details 查看第三个参数的示例代码
```jsx
/**
 * 根据任务创建编辑器初始状态。
 * @param {{ title: string, priority: string } | null} task 初始任务。
 * @returns {object} 编辑器初始状态。
 */
function createEditorState(task) {
  return {
    title: task ? task.title : "",
    priority: task ? task.priority : "normal",
    saving: false,
    error: null
  };
}

const [state, dispatch] = React.useReducer(
  taskEditorReducer,
  initialTask,
  createEditorState
);
```
:::

React 首次挂载时调用 `createEditorState(initialTask)`。后续 `initialTask` 变化不会自动重置 State。

### 2. 复用初始化逻辑重置

Reducer 可以在 `reset` Action 中调用同一纯初始化函数：

```jsx
case "reset":
  return createEditorState(action.task);
```

这样首次初始化和显式重置遵守同一规则。

## 六、useState 与 useReducer

| 情况 | `useState` | `useReducer` |
|------|------------|--------------|
| 少量独立基本值 | 更直接 | 结构偏重 |
| 多字段经常一起变化 | 容易分散更新 | 集中转换 |
| 下一状态依赖复杂操作 | 多个处理函数重复逻辑 | Action 明确表达 |
| 需要独立测试状态转换 | 需要提取函数 | Reducer 天然可测试 |
| 只需简单开关或输入 | 推荐 | 通常不需要 |
| 多组件共享相同转换 | 可提取自定义 Hook | Reducer 可与 Context 组合 |

`useReducer` 不会自动提升 State，也不会让多个组件共享数据。每次调用仍创建独立 State；共享时需要把 `[state, dispatch]` 放到共同所有者或 Context。

## 七、常见问题

| 问题 | 原因 | 处理方式 |
|------|------|----------|
| State 字段更新后丢失 | Reducer 返回值替换整个 State | 返回完整下一状态 |
| Reducer 发请求 | 把状态转换和副作用混在一起 | 在事件或 Effect 中执行请求 |
| Action 只有 `setState` | 没有表达业务语义 | 使用明确操作名称 |
| 所有简单 State 都改成 Reducer | 抽象成本高于收益 | 简单值继续使用 `useState` |
| Props 变化后 State 未重置 | 初始参数只在挂载时使用 | dispatch reset 或使用 Key |
| Reducer 直接修改数组 | 旧引用被污染 | 返回新对象和新数组 |

Reducer 的价值是把“什么操作如何改变状态”集中为可预测的纯函数，而不是减少代码行数。
