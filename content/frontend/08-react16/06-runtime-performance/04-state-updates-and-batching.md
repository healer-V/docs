---
title: "State 更新与批处理"
tags:
  - React
  - State
  - 批处理
excerpt: "从更新队列和渲染快照解释函数组件与类组件 State 更新，并明确 React 16.8 在 React 事件、定时器和 Promise 中的批处理边界。"
date: 2026-07-31
---

# State 更新与批处理

## 一、更新不是立即赋值

调用 State 更新函数会创建一项更新并加入组件队列。当前事件函数仍使用创建它的那次渲染中的 State。

::: details 查看更新不是立即赋值的示例代码
```jsx
const [count, setCount] = React.useState(0);

/**
 * 提交下一计数并输出当前快照。
 * @returns {void}
 */
function handleClick() {
  console.log(count); // 0
  setCount(count + 1);
  console.log(count); // 仍是 0
}
```
:::

更新过程：

```text
当前渲染 count = 0
→ 提交“下一值为 1”
→ 事件函数继续读取 count = 0
→ React 处理队列
→ 新渲染 count = 1
```

State 快照保证一次渲染中的事件函数看到一致值。

## 二、函数组件更新队列

### 1. 替换值

```jsx
setCount(5);
```

可以理解为把“用 5 替换当前值”的更新加入队列。

### 2. updater

```jsx
setCount(
  /**
   * 根据队列前一结果增加 1。
   * @param {number} previousCount 前一结果。
   * @returns {number} 下一结果。
   */
  (previousCount) => previousCount + 1
);
```

updater 接收队列中前一项计算结果，而不是固定读取事件闭包的 `count`。

### 3. 队列组合

初始值为 `0`，同一事件依次提交：

::: details 查看队列组合的示例代码
```jsx
setCount(
  /**
   * 先增加 1。
   * @param {number} previousCount 前一结果。
   * @returns {number} 下一结果。
   */
  (previousCount) => previousCount + 1
);
setCount(10);
setCount(
  /**
   * 再把替换后的值增加 1。
   * @param {number} previousCount 前一结果。
   * @returns {number} 下一结果。
   */
  (previousCount) => previousCount + 1
);
```
:::

队列结果：

```text
0
→ updater：1
→ 替换值：10
→ updater：11
```

最终 State 为 `11`。

## 三、类组件更新队列

### 1. 状态片段浅合并

类组件对象形式提交的是状态片段：

```jsx
this.setState({ saving: true });
this.setState({ error: null });
```

React 处理队列时把片段浅合并到当前 State。函数组件 Hook setter 则替换对应 Hook 的整个值。

### 2. 函数式 setState

::: details 查看函数式 setState的示例代码
```jsx
this.setState(
  /**
   * 根据前一 State 和当前 Props 计算状态片段。
   * @param {{ page: number }} previousState 前一状态。
   * @param {{ totalPages: number }} props 当前属性。
   * @returns {{ page: number }} 下一状态片段。
   */
  (previousState, props) => ({
    page: Math.min(previousState.page + 1, props.totalPages)
  })
);
```
:::

返回片段仍会浅合并。返回 `null` 可以跳过该项更新。

## 四、React 16.8 批处理

### 1. React 管理的边界

React 16.8 主要在以下执行范围批处理更新：

- React 合成事件处理函数；
- React 生命周期方法；
- React 自身控制的更新流程。

批处理表示 React 先收集多项更新，处理完当前边界后再统一渲染和提交。

```jsx
/**
 * 同时更新任务状态和提示。
 * @returns {void}
 */
function handleComplete() {
  setStatus("completed");
  setMessage("任务已完成");
}
```

在 React 单击事件中，两项更新通常形成一次提交，用户不会看到只更新状态但提示尚未更新的中间界面。

### 2. 定时器和 Promise

React 16.8 默认不会把所有异步来源统一纳入自动批处理：

::: details 查看定时器和 Promise的示例代码
```jsx
window.setTimeout(
  /**
   * 在 React 16.8 中，两项更新可能分别触发渲染。
   * @returns {void}
   */
  () => {
    setStatus("completed");
    setMessage("任务已完成");
  },
  0
);
```
:::

Promise 回调、原生事件监听和其他外部回调具有相同边界问题。React 18 扩展了自动批处理范围，不能用 React 18 结果解释 React 16.8。

### 3. 不依赖渲染次数

批处理是性能和一致性策略，不是业务事务。代码不应依赖两次更新之间一定出现一次 DOM 提交。

如果状态必须原子变化，可以：

- 把相关字段放入同一对象 State；
- 使用一个 Reducer Action；
- 让一次更新产生完整下一状态。

## 五、外部事件集成

### 1. 原生事件

::: details 查看原生事件的示例代码
```jsx
React.useEffect(
  /**
   * 监听外部系统发出的任务完成事件。
   * @returns {() => void} 移除监听的函数。
   */
  () => {
    /**
     * 同步外部任务完成状态。
     * @returns {void}
     */
    function handleExternalComplete() {
      setStatus("completed");
      setMessage("外部系统已完成任务");
    }

    window.addEventListener("task-complete", handleExternalComplete);

    /**
     * 移除外部事件监听。
     * @returns {void}
     */
    function cleanupExternalEvent() {
      window.removeEventListener("task-complete", handleExternalComplete);
    }

    return cleanupExternalEvent;
  },
  []
);
```
:::

React 16.8 中原生监听回调的多项更新可能分别渲染。第三方状态库集成可使用 `ReactDOM.unstable_batchedUpdates` 包装通知，但该 API 名称明确表示不稳定，不应在普通业务事件中到处调用。

### 2. 用 Reducer表达一次业务动作

```jsx
dispatch({
  type: "taskCompleted",
  taskId
});
```

Reducer 一次返回同时包含状态和提示的下一对象，比依赖外部批处理更容易保证业务一致。

## 六、更新优先关系

### 1. 同一状态的顺序

同一批中的更新按加入队列的顺序计算。替换值会覆盖之前结果，后续 updater 则从替换值继续计算。

因此 `setCount(1)` 后再执行 `setCount((count) => count + 1)`，候选结果是 `2`。调整两次更新的顺序可能得到不同结果。

### 2. 不同状态

不同 `useState` 拥有不同队列，但 React 在同一批中处理并形成候选树。组件函数在下一次渲染中读取各队列的最终结果。

两个状态之间存在必须同时成立的业务约束时，使用一个对象 State 或 Reducer 表达单次转换，通常比依赖多个独立队列更清楚。

### 3. 相同值跳过

Hook State 的下一值与当前值使用 `Object.is` 比较相同后，React 可以跳过对子树的更新。直接修改对象并传回同一引用可能因此不更新。

对象内部字段即使已经改变，只要外层引用不变，React 仍无法从引用比较中识别这次变化。正确做法是保留未变字段并创建新的对象或数组。

## 七、同步 DOM 读取

调用 State 更新后立即读取 DOM，读到的通常仍是提交前内容：

```jsx
/**
 * 展开详情并错误地立即读取高度。
 * @returns {void}
 */
function handleExpand() {
  setExpanded(true);
  console.log(panelRef.current.offsetHeight);
}
```

需要在更新提交后读取布局时使用 `useLayoutEffect`，或在明确的提交后生命周期中处理。不要通过定时器猜测 React 何时提交。

## 八、常见问题

| 问题 | 原因 | 处理方式 |
|------|------|----------|
| 连续计数只增加一次 | 多项更新都使用同一快照 | 使用 updater |
| Hook 对象字段丢失 | setter 替换整个值 | 显式复制对象 |
| React 16.8 异步回调渲染多次 | 不在默认批处理边界 | 合并状态或由集成层批处理 |
| 业务依赖固定提交次数 | 把调度当作业务协议 | 使用完整下一状态 |
| 更新后立即读取旧 DOM | Commit 尚未发生 | 使用布局 Effect |
| 直接修改对象后无更新 | 下一值引用相同 | 使用不可变更新 |

更新队列表达“如何从当前状态得到下一状态”，批处理只决定何时统一计算和提交这些更新。
