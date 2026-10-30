---
title: "Hooks 调用模型与使用规则"
tags:
  - React
  - Hooks
  - React 16.8
excerpt: "解释 Hook 如何让函数组件使用状态和生命周期能力，重点讲解固定调用顺序、顶层调用规则、渲染闭包和规则检查。"
date: 2026-07-31
---

# Hooks 调用模型与使用规则

## 一、Hook

### 1. Hook 的作用

Hook 是以 `use` 开头的 React 函数 API。它让函数组件能够使用 State、Effect、Context、Ref 等 React 能力。

React 16.8 内置的主要 Hook 包括：

| Hook | 作用 |
|------|------|
| `useState` | 保存组件局部状态 |
| `useEffect` | 在提交后与外部系统同步 |
| `useContext` | 读取最近的 Context Provider |
| `useReducer` | 使用 Reducer 管理状态转换 |
| `useRef` | 保存跨渲染可变值或 DOM 引用 |
| `useMemo` | 缓存计算结果 |
| `useCallback` | 缓存函数引用 |
| `useLayoutEffect` | 在 DOM 提交后、浏览器绘制前同步执行 |
| `useImperativeHandle` | 定制父组件通过 Ref 读取的命令式接口 |

Hook 只能在 React 渲染函数组件或执行自定义 Hook 时发挥作用。它不是可以在任意 JavaScript 函数中调用的普通工具函数。

### 2. Hook 状态属于组件实例

`useState` 返回的状态不保存在函数局部变量里，也不保存在 Hook 函数本身。React 根据组件在树中的身份和 Hook 调用位置保存状态。

::: details 查看Hook 状态属于组件实例的示例代码
```jsx
/**
 * 显示独立计数器。
 * @returns {React.ReactElement} 计数按钮。
 */
function Counter() {
  const [count, setCount] = React.useState(0);

  /**
   * 把当前计数增加 1。
   * @returns {void}
   */
  function handleIncrement() {
    setCount(
      /**
       * 根据前一计数计算下一值。
       * @param {number} previousCount 前一计数。
       * @returns {number} 下一计数。
       */
      (previousCount) => previousCount + 1
    );
  }

  return (
    <button type="button" onClick={handleIncrement}>
      {count}
    </button>
  );
}
```
:::

页面渲染两个 `<Counter />` 时，React 为它们保存两份独立 State：

```jsx
<>
  <Counter />
  <Counter />
</>
```

单击第一个按钮不会改变第二个按钮。组件复用同一函数实现，不代表共享同一份状态。

## 二、调用顺序

### 1. React 按位置匹配 Hook

函数组件每次渲染都会重新执行。React 通过 Hook 在函数中的调用顺序，把当前调用与上一轮状态槽位对应起来。

```jsx
// 按固定顺序声明编辑器需要的状态与 DOM Ref。
function TaskEditor() {
  const [title, setTitle] = React.useState("");       // 第 1 个 Hook
  const [priority, setPriority] = React.useState(1);  // 第 2 个 Hook
  const inputRef = React.useRef(null);                // 第 3 个 Hook
  // 省略渲染代码
}
```

React 可以把调用顺序理解为：

```text
TaskEditor 当前组件身份
├─ Hook 1 → title State
├─ Hook 2 → priority State
└─ Hook 3 → inputRef
```

Hook 没有传入显式名称，因此顺序必须在所有渲染之间保持一致。

### 2. 不能放在条件中

条件改变后，后续 Hook 的位置会偏移：

::: details 查看不能放在条件中的示例代码
```jsx
function InvalidTaskEditor({ canSetPriority }) {
  const [title, setTitle] = React.useState("");

  if (canSetPriority) {
    // 错误：条件变化会改变 Hook 调用数量。
    const [priority, setPriority] = React.useState(1);
  }

  const inputRef = React.useRef(null);
  // 省略渲染代码
}
```
:::

第一次 `canSetPriority` 为 `true` 时，`inputRef` 是第 3 个 Hook；下一次为 `false` 时，它变成第 2 个。React 无法再把槽位与状态正确对应。

正确方式是始终调用 Hook，把条件放到 Hook 结果的使用位置：

::: details 查看不能放在条件中的示例代码
```jsx
function TaskEditor({ canSetPriority }) {
  const [title, setTitle] = React.useState("");
  const [priority, setPriority] = React.useState(1);
  const inputRef = React.useRef(null);

  return (
    <form>
      <input ref={inputRef} value={title} readOnly />
      {canSetPriority && <span>优先级：{priority}</span>}
    </form>
  );
}
```
:::

### 3. 不能放在循环和嵌套函数中

数组长度、循环次数或回调执行时机都可能变化，因此以下位置不能调用 Hook：

::: details 查看不能放在循环和嵌套函数中的示例代码
```jsx
// 错误：循环次数由 tasks.length 决定。
tasks.forEach(
  // 遍历任务的回调不能调用 Hook。
  (task) => {
    const [selected, setSelected] = React.useState(false);
  }
);

// 错误：事件发生时组件渲染已经结束。
function handleClick() {
  const [open, setOpen] = React.useState(false);
}
```
:::

需要为每条任务保存独立状态时，应提取子组件，让每个子组件在自身顶层调用 Hook：

::: details 查看不能放在循环和嵌套函数中的示例代码
```jsx
/**
 * 为单条任务保存选中状态。
 * @param {{ task: { id: number, title: string } }} props 组件属性。
 * @returns {React.ReactElement} 可选任务项。
 */
function SelectableTask({ task }) {
  const [selected, setSelected] = React.useState(false);

  /**
   * 切换任务选中状态。
   * @returns {void}
   */
  function handleToggle() {
    setSelected(
      /**
       * 反转前一选中状态。
       * @param {boolean} previousSelected 前一状态。
       * @returns {boolean} 下一状态。
       */
      (previousSelected) => !previousSelected
    );
  }

  return (
    <button type="button" aria-pressed={selected} onClick={handleToggle}>
      {task.title}
    </button>
  );
}
```
:::

## 三、两条使用规则

### 1. 只在顶层调用 Hook

Hook 必须位于函数组件或自定义 Hook 的顶层，不能放在：

- 条件语句；
- 循环；
- 事件处理函数；
- `map`、`forEach` 等回调；
- `try`、`catch`、`finally`；
- 提前返回之后；
- 普通嵌套函数。

“顶层”是指每次组件执行时，Hook 都以相同顺序无条件到达。

### 2. 只在 React 函数中调用

合法调用位置只有：

- 函数组件；
- 自定义 Hook。

::: details 查看只在 React 函数中调用的示例代码
```jsx
/**
 * 自定义 Hook：保存布尔状态及切换操作。
 * @param {boolean} initialValue 初始布尔值。
 * @returns {[boolean, () => void]} 当前值和切换函数。
 */
function useToggle(initialValue) {
  const [value, setValue] = React.useState(initialValue);

  /**
   * 反转当前值。
   * @returns {void}
   */
  function toggle() {
    setValue(
      /**
       * 反转前一值。
       * @param {boolean} previousValue 前一值。
       * @returns {boolean} 下一值。
       */
      (previousValue) => !previousValue
    );
  }

  return [value, toggle];
}
```
:::

普通工具函数不能调用 Hook：

```jsx
// 错误：formatStatus 不是组件，也不是自定义 Hook。
function formatStatus(status) {
  const context = React.useContext(StatusContext);
  return `${context.prefix}${status}`;
}
```

如果函数只进行数据转换，就把需要的值作为普通参数传入；如果它组合 Hook 逻辑，则改为以 `use` 开头的自定义 Hook。

## 四、渲染闭包

### 1. 每次渲染拥有自己的值

函数组件每次执行都会创建新的局部变量和事件函数。事件函数会捕获创建它的那次渲染中的 Props 和 State。

::: details 查看每次渲染拥有自己的值的示例代码
```jsx
/**
 * 在延迟后显示当前渲染的任务标题。
 * @param {{ title: string }} props 组件属性。
 * @returns {React.ReactElement} 提示按钮。
 */
function DelayedTitle({ title }) {
  /**
   * 三秒后显示当前渲染捕获的 title。
   * @returns {void}
   */
  function handleShowLater() {
    window.setTimeout(
      /**
       * 显示创建定时器时捕获的标题。
       * @returns {void}
       */
      () => {
        window.alert(title);
      },
      3000
    );
  }

  return (
    <button type="button" onClick={handleShowLater}>
      三秒后显示标题
    </button>
  );
}
```
:::

按钮单击后即使父组件更新了 `title`，已创建的定时器仍读取单击那次渲染的值。这不是 State 更新失败，而是 JavaScript 闭包行为。

### 2. 不通过修改局部变量保存状态

局部变量在下一次渲染时会重新初始化：

::: details 查看不通过修改局部变量保存状态的示例代码
```jsx
function InvalidCounter() {
  let count = 0;

  /**
   * 修改局部变量，但不会安排 React 更新。
   * @returns {void}
   */
  function handleClick() {
    count += 1;
  }

  return <button onClick={handleClick}>{count}</button>;
}
```
:::

需要影响界面的跨渲染数据使用 State；不影响渲染但需要跨渲染保存的值使用 Ref。

## 五、规则检查

### 1. eslint-plugin-react-hooks

`eslint-plugin-react-hooks` 能检查两类问题：

| 规则 | 检查内容 |
|------|----------|
| `react-hooks/rules-of-hooks` | Hook 是否只在合法位置调用 |
| `react-hooks/exhaustive-deps` | Effect、Memo、Callback 的依赖是否完整 |

常见 ESLint 配置：

```json
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

Create React App 的 React 16.8 项目需要根据自身版本确认是否已经包含该插件。手动接入时应让插件版本与当前 ESLint 工具链兼容。

### 2. 不规避规则

禁用规则不会修复调用顺序或陈旧依赖。遇到警告时应调整代码结构：

- 条件 Hook 改为始终调用，再在内部判断；
- 循环 Hook 提取为子组件或自定义 Hook；
- 缺失依赖补齐依赖，或重构 Effect 的职责；
- 事件逻辑移回事件处理函数。

Hook 规则不是风格约定，而是 React 能正确匹配组件状态的前提。
