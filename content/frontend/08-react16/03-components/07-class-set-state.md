---
title: "setState 更新模型"
tags:
  - React
  - 类组件
  - setState
excerpt: "详细讲解类组件 setState 的对象形式、函数形式、浅合并、更新队列、批处理和提交回调，并说明对象与数组的不可变更新。"
date: 2026-07-31
---

# setState 更新模型

## 一、setState

### 1. 作用与调用形式

`this.setState` 向 React 提交一项状态更新，并安排组件重新渲染。它不会立即改写当前代码正在读取的 `this.state`。

```text
this.setState(stateChange[, callback])
```

`stateChange` 有两种形式：

| 形式 | 参数 | 适用场景 |
|------|------|----------|
| 对象 | 下一状态片段 | 新值与旧 State 无关 |
| 函数 | `previousState`、`props` | 新值依赖旧 State 或当前 Props |

可选的 `callback` 会在更新提交并完成重新渲染后执行。通用的提交后逻辑通常更适合放在 `componentDidUpdate`，回调适合只与某一次更新直接相关的工作。

### 2. 对象形式

新状态与旧值无关时，可以传入对象：

::: details 查看对象形式的示例代码
```jsx
class TaskRequest extends React.Component {
  state = {
    loading: false,
    error: null
  };

  /**
   * 把请求状态切换为加载中。
   * @returns {void}
   */
  startLoading = () => {
    this.setState({
      loading: true,
      error: null
    });
  };

  /**
   * 返回请求状态。
   * @returns {React.ReactElement} 请求状态文本。
   */
  render() {
    return <p>{this.state.loading ? "加载中" : "等待操作"}</p>;
  }
}
```
:::

调用 `startLoading` 后，React 把更新加入队列，并在合适时机重新执行 `render()`。

## 二、浅合并

### 1. 合并顶层字段

类组件 `setState` 会把提交的对象浅合并到当前 State，而不是完全替换整个 State。

初始 State：

```jsx
this.state = {
  title: "核对订单",
  completed: false,
  saving: false
};
```

只更新 `saving`：

```jsx
this.setState({
  saving: true
});
```

下一状态为：

```js
{
  title: "核对订单",
  completed: false,
  saving: true
}
```

没有提交的顶层字段会保留。

### 2. 嵌套对象不会深合并

浅合并只发生在 State 第一层。更新嵌套对象时必须显式复制需要保留的字段：

::: details 查看嵌套对象不会深合并的示例代码
```jsx
class AssigneeEditor extends React.Component {
  state = {
    assignee: {
      id: 7,
      name: "林晨",
      department: "客服"
    }
  };

  /**
   * 更新负责人姓名并保留其他字段。
   * @param {string} name 新姓名。
   * @returns {void}
   */
  updateAssigneeName(name) {
    this.setState(
      /**
       * 根据前一状态复制并更新 assignee。
       * @param {{ assignee: { id: number, name: string, department: string } }} previousState 前一状态。
       * @returns {{ assignee: { id: number, name: string, department: string } }} 下一状态片段。
       */
      (previousState) => ({
        assignee: {
          ...previousState.assignee,
          name
        }
      })
    );
  }
}
```
:::

如果只提交 `{ assignee: { name } }`，`id` 和 `department` 会丢失，因为整个 `assignee` 字段被新对象覆盖。

## 三、函数式更新

### 1. 依赖前一状态

计数、切换布尔值、追加数组等操作依赖前一状态，应使用函数形式。

::: details 查看依赖前一状态的示例代码
```jsx
class RetryCounter extends React.Component {
  state = {
    retryCount: 0
  };

  /**
   * 把重试次数增加 1。
   * @returns {void}
   */
  incrementRetry = () => {
    this.setState(
      /**
       * 根据队列中的前一结果计算下一次数。
       * @param {{ retryCount: number }} previousState 前一状态。
       * @returns {{ retryCount: number }} 下一状态片段。
       */
      (previousState) => ({
        retryCount: previousState.retryCount + 1
      })
    );
  };

  /**
   * 返回重试按钮。
   * @returns {React.ReactElement} 重试按钮。
   */
  render() {
    return (
      <button type="button" onClick={this.incrementRetry}>
        已重试 {this.state.retryCount} 次
      </button>
    );
  }
}
```
:::

更新函数的完整签名为：

```text
(previousState, props) => stateChange | null
```

| 参数或返回值 | 含义 |
|--------------|------|
| `previousState` | 该项更新执行时队列中的前一状态 |
| `props` | 该项更新执行时的当前 Props |
| 状态对象 | 要浅合并的下一状态片段 |
| `null` | 跳过这项状态更新 |

### 2. 多项更新按队列计算

React 管理的事件中，多次 `setState` 通常会被批处理。对象形式如果反复读取同一个 `this.state`，可能只得到一次增加：

```jsx
// 错误：三次调用都可能读取同一个 retryCount。
this.setState({ retryCount: this.state.retryCount + 1 });
this.setState({ retryCount: this.state.retryCount + 1 });
this.setState({ retryCount: this.state.retryCount + 1 });
```

函数式更新会依次接收前一次计算结果：

::: details 查看多项更新按队列计算的示例代码
```jsx
/**
 * 根据前一状态增加重试次数。
 * @param {{ retryCount: number }} previousState 前一状态。
 * @returns {{ retryCount: number }} 下一状态片段。
 */
function addRetry(previousState) {
  return {
    retryCount: previousState.retryCount + 1
  };
}

this.setState(addRetry);
this.setState(addRetry);
this.setState(addRetry);
```
:::

如果初始值为 `0`，下一次提交结果为 `3`。

### 3. 根据 Props 计算

更新函数可以读取当前 Props：

::: details 查看根据 Props 计算的示例代码
```jsx
/**
 * 把当前页码向后移动，但不超过 totalPages。
 * @returns {void}
 */
goToNextPage = () => {
  this.setState(
    /**
     * 根据前一页码和当前总页数计算下一页。
     * @param {{ page: number }} previousState 前一状态。
     * @param {{ totalPages: number }} props 当前组件属性。
     * @returns {{ page: number }} 下一状态片段。
     */
    (previousState, props) => ({
      page: Math.min(previousState.page + 1, props.totalPages)
    })
  );
};
```
:::

不要把 Props 复制到 State 后再同步；能在更新时读取 Props，就不需要创建重复数据源。

## 四、更新时机

### 1. 当前读取仍是旧值

`setState` 提交更新后，当前事件处理函数中的 `this.state` 不会立刻改变：

```jsx
/**
 * 提交完成状态并演示当前读取值。
 * @returns {void}
 */
handleComplete = () => {
  console.log(this.state.completed); // false
  this.setState({ completed: true });
  console.log(this.state.completed); // 当前调用栈中仍可能是 false
};
```

State 表示某次已提交渲染的数据快照。不要根据 `setState` 后的立即读取判断更新是否完成。

### 2. 提交后回调

某一次更新提交后必须执行命令式操作时，可以传入回调：

::: details 查看提交后回调的示例代码
```jsx
/**
 * 在打开编辑器后聚焦输入框。
 * @returns {void}
 */
openEditor = () => {
  this.setState(
    { editing: true },
    /**
     * DOM 已提交后聚焦输入框。
     * @returns {void}
     */
    () => {
      this.titleInput.focus();
    }
  );
};
```
:::

回调不接收 State 参数，通过 `this.state` 读取已提交结果。需要对所有相关更新执行同步逻辑时，应使用 `componentDidUpdate` 并比较旧值。

### 3. React 16.8 的批处理范围

React 16.8 主要对 React 管理的事件处理函数和生命周期中的更新进行批处理。原生事件、`setTimeout`、Promise 回调等异步边界通常不会自动获得与 React 18 相同的统一批处理行为。

业务代码不应依赖“中间状态一定提交几次”。正确逻辑应使用函数式更新表达状态关系，再让 React 决定如何调度提交。

## 五、对象与数组更新

### 1. 更新数组项

不要使用 `push`、`splice` 或直接赋值修改 State 数组。使用 `map`、`filter` 和展开语法创建新数组。

::: details 查看更新数组项的示例代码
```jsx
/**
 * 把指定任务标记为已完成。
 * @param {number} taskId 任务 ID。
 * @returns {void}
 */
completeTask(taskId) {
  this.setState(
    /**
     * 创建包含更新任务的新数组。
     * @param {{ tasks: Array<{ id: number, title: string, completed: boolean }> }} previousState 前一状态。
     * @returns {{ tasks: Array<{ id: number, title: string, completed: boolean }> }} 下一状态片段。
     */
    (previousState) => ({
      tasks: previousState.tasks.map(
        // 只替换目标任务，其他任务保持原引用。
        (task) => (
          task.id === taskId
            ? { ...task, completed: true }
            : task
        )
      )
    })
  );
}
```
:::

### 2. 删除数组项

::: details 查看删除数组项的示例代码
```jsx
/**
 * 删除指定任务。
 * @param {number} taskId 任务 ID。
 * @returns {void}
 */
removeTask(taskId) {
  this.setState(
    /**
     * 过滤掉目标任务。
     * @param {{ tasks: Array<{ id: number }> }} previousState 前一状态。
     * @returns {{ tasks: Array<{ id: number }> }} 下一状态片段。
     */
    (previousState) => ({
      tasks: previousState.tasks.filter(
        // 保留 ID 不等于目标值的任务。
        (task) => task.id !== taskId
      )
    })
  );
}
```
:::

不可变更新让新旧引用能够表达“哪些数据发生了变化”，也避免其他持有旧对象的代码被意外修改。

## 六、常见错误

| 错误 | 结果 | 正确处理 |
|------|------|----------|
| `this.state.count += 1` | 绕过 React 更新队列 | 调用 `setState` |
| 使用对象形式基于旧值计算 | 批处理时可能丢失更新 | 使用函数式更新 |
| 认为 `setState` 后能立即读到新值 | 当前调用栈仍读取旧快照 | 在下一次渲染或提交后处理 |
| 只提交嵌套对象的一个字段 | 其他嵌套字段被覆盖 | 复制旧嵌套对象 |
| 在 `render` 中调用 `setState` | 形成重复渲染或无限循环 | 放入事件或生命周期 |
| 依赖固定提交次数 | 不同更新来源的批处理范围不同 | 根据状态关系编写逻辑 |

`setState` 是向 React 描述状态变化，不是对实例字段执行立即赋值。对象形式表达独立新值，函数形式表达与前一状态的关系。
