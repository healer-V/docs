---
title: "类组件生命周期"
tags:
  - React
  - 类组件
  - 生命周期
excerpt: "按照挂载、更新、卸载和错误阶段讲解 React 16.8 类组件生命周期，包括触发条件、参数、资源管理、快照和不安全方法。"
date: 2026-07-31
---

# 类组件生命周期

## 一、生命周期阶段

类组件实例从进入组件树到离开组件树，会经历挂载、更新和卸载。渲染或生命周期发生错误时，还可能进入错误处理阶段。

| 阶段 | 主要方法 | 作用 |
|------|----------|------|
| 挂载 | `constructor`、`getDerivedStateFromProps`、`render`、`componentDidMount` | 创建实例并首次提交 DOM |
| 更新 | `getDerivedStateFromProps`、`shouldComponentUpdate`、`render`、`getSnapshotBeforeUpdate`、`componentDidUpdate` | 根据新 Props 或 State 更新界面 |
| 卸载 | `componentWillUnmount` | 在 DOM 删除前清理资源 |
| 错误 | `getDerivedStateFromError`、`componentDidCatch` | 捕获后代渲染错误并显示降级界面 |

Render 阶段的方法必须保持纯粹；Commit 阶段方法可以读取 DOM、建立订阅或执行其他副作用。

## 二、挂载

### 1. constructor

`constructor(props)` 在实例创建时执行，适合初始化 State、创建实例字段和绑定方法。

::: details 查看constructor的示例代码
```jsx
class TaskTimer extends React.Component {
  /**
   * 创建计时器组件实例。
   * @param {{ initialSeconds?: number }} props 初始组件属性。
   */
  constructor(props) {
    super(props);

    this.state = {
      seconds: props.initialSeconds || 0
    };
    this.timerId = null;
  }
}
```
:::

构造函数不能发请求、订阅事件或访问尚未挂载的 DOM。

### 2. render

`render()` 根据当前 Props、State 和 Context 返回 React 内容。挂载和每次允许的更新都会调用它。

```jsx
/**
 * 返回计时器文本。
 * @returns {React.ReactElement} 秒数文本。
 */
render() {
  return <p>已用时：{this.state.seconds} 秒</p>;
}
```

`render()` 不能调用 `setState` 或执行副作用。

### 3. componentDidMount

`componentDidMount()` 在首次内容提交到 DOM 后执行一次，适合：

- 发起初始数据请求；
- 注册事件监听和订阅；
- 启动定时器；
- 读取或操作已挂载 DOM；
- 集成需要 DOM 容器的第三方库。

::: details 查看componentDidMount的示例代码
```jsx
class TaskTimer extends React.Component {
  state = {
    seconds: 0
  };

  timerId = null;

  /**
   * DOM 首次提交后启动定时器。
   * @returns {void}
   */
  componentDidMount() {
    this.timerId = window.setInterval(
      /**
       * 每秒提交一次计时更新。
       * @returns {void}
       */
      () => {
        this.setState(
          /**
           * 根据前一秒数计算下一值。
           * @param {{ seconds: number }} previousState 前一状态。
           * @returns {{ seconds: number }} 下一状态片段。
           */
          (previousState) => ({
            seconds: previousState.seconds + 1
          })
        );
      },
      1000
    );
  }

  /**
   * 组件卸载前停止定时器。
   * @returns {void}
   */
  componentWillUnmount() {
    window.clearInterval(this.timerId);
  }

  /**
   * 返回计时器文本。
   * @returns {React.ReactElement} 秒数文本。
   */
  render() {
    return <p>已用时：{this.state.seconds} 秒</p>;
  }
}
```
:::

资源的建立和清理必须成对出现。否则组件卸载后定时器仍会运行。

## 三、更新

### 1. 更新来源

以下情况会让类组件进入更新过程：

- 父组件传入新的 Props；
- 调用 `setState`；
- 组件读取的 Context 变化；
- 调用 `forceUpdate()`。

默认情况下，父组件重新渲染也会让子类组件执行 `render()`，即使 Props 引用没有变化。

### 2. shouldComponentUpdate

`shouldComponentUpdate(nextProps, nextState)` 在更新渲染前执行，返回 `false` 可以跳过当前组件及其后代的本次渲染。

::: details 查看shouldComponentUpdate的示例代码
```jsx
class TaskLabel extends React.Component {
  /**
   * 只在标题或完成状态变化时重新渲染。
   * @param {{ title: string, completed: boolean }} nextProps 下一组属性。
   * @returns {boolean} 是否继续本次更新。
   */
  shouldComponentUpdate(nextProps) {
    return (
      nextProps.title !== this.props.title
      || nextProps.completed !== this.props.completed
    );
  }

  /**
   * 返回任务标签。
   * @returns {React.ReactElement} 任务标签。
   */
  render() {
    return (
      <span>
        {this.props.title}
        {this.props.completed ? "（已完成）" : ""}
      </span>
    );
  }
}
```
:::

它是性能优化入口，不是阻止业务逻辑执行的可靠机制。比较遗漏字段会让界面停留在旧值。普通场景优先保持正确渲染，确认性能问题后再优化。

### 3. componentDidUpdate

`componentDidUpdate(prevProps, prevState, snapshot)` 在更新已经提交到 DOM 后执行，不会在首次挂载后执行。

必须比较旧值和当前值，再决定是否执行副作用：

::: details 查看componentDidUpdate的示例代码
```jsx
class TaskDetails extends React.Component {
  /**
   * 任务 ID 变化后加载对应详情。
   * @param {{ taskId: number }} prevProps 前一组属性。
   * @returns {void}
   */
  componentDidUpdate(prevProps) {
    if (prevProps.taskId !== this.props.taskId) {
      this.loadTask(this.props.taskId);
    }
  }

  /**
   * 请求指定任务详情。
   * @param {number} taskId 任务 ID。
   * @returns {void}
   */
  loadTask(taskId) {
    // 请求完成后的 setState 与异常处理在实际数据层中实现。
    console.log(`加载任务 ${taskId}`);
  }
}
```
:::

如果不比较 `taskId`，每次更新都请求并再次 `setState`，可能形成无限更新循环。

### 4. getSnapshotBeforeUpdate

`getSnapshotBeforeUpdate(prevProps, prevState)` 在 React 计算完新界面、真正修改 DOM 之前执行。返回值会作为第三个参数传给 `componentDidUpdate`。

它适合读取即将变化的 DOM 状态，例如在消息追加前记录滚动位置：

::: details 查看getSnapshotBeforeUpdate的示例代码
```jsx
class MessageList extends React.Component {
  listRef = React.createRef();

  /**
   * 在 DOM 更新前记录列表底部距离。
   * @param {{ messages: Array<{ id: number, text: string }> }} prevProps 前一组属性。
   * @returns {number | null} 底部距离；消息数量未变化时返回 null。
   */
  getSnapshotBeforeUpdate(prevProps) {
    if (prevProps.messages.length === this.props.messages.length) {
      return null;
    }

    const list = this.listRef.current;
    return list.scrollHeight - list.scrollTop;
  }

  /**
   * DOM 更新后恢复用户相对底部的位置。
   * @param {object} prevProps 前一组属性。
   * @param {object} prevState 前一状态。
   * @param {number | null} bottomDistance 更新前的底部距离。
   * @returns {void}
   */
  componentDidUpdate(prevProps, prevState, bottomDistance) {
    if (bottomDistance === null) {
      return;
    }

    const list = this.listRef.current;
    list.scrollTop = list.scrollHeight - bottomDistance;
  }

  /**
   * 返回消息列表。
   * @returns {React.ReactElement} 可滚动消息列表。
   */
  render() {
    return (
      <ul ref={this.listRef}>
        {this.props.messages.map(
          // 把消息转换为带稳定 Key 的列表项。
          (message) => <li key={message.id}>{message.text}</li>
        )}
      </ul>
    );
  }
}
```
:::

快照方法必须与 `componentDidUpdate` 配合。直接在 `render()` 读取 DOM 无法保证读取和提交之间的一致性。

## 四、卸载

### 1. componentWillUnmount

`componentWillUnmount()` 在组件从 DOM 中移除前执行一次，负责撤销组件建立的外部资源：

| 已建立资源 | 卸载时处理 |
|------------|------------|
| `setInterval`、`setTimeout` | 清除计时器 |
| `addEventListener` | 使用相同目标、事件名和函数移除 |
| WebSocket、订阅 | 关闭连接或取消订阅 |
| 未完成请求 | 取消请求或让结果失效 |
| 第三方组件实例 | 调用销毁方法 |

卸载阶段不能通过 `setState` 恢复界面，因为实例即将离开组件树。

### 2. 对称清理

::: details 查看对称清理的示例代码
```jsx
class WindowWidth extends React.Component {
  state = {
    width: window.innerWidth
  };

  /**
   * DOM 挂载后监听窗口尺寸。
   * @returns {void}
   */
  componentDidMount() {
    window.addEventListener("resize", this.handleResize);
  }

  /**
   * 卸载前移除同一个监听函数。
   * @returns {void}
   */
  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  /**
   * 同步当前窗口宽度。
   * @returns {void}
   */
  handleResize = () => {
    this.setState({
      width: window.innerWidth
    });
  };

  /**
   * 返回窗口宽度。
   * @returns {React.ReactElement} 窗口宽度文本。
   */
  render() {
    return <p>窗口宽度：{this.state.width}</p>;
  }
}
```
:::

如果监听时和移除时使用两个不同的箭头函数，浏览器不会移除原监听器。因此处理函数应保存为稳定实例方法。

## 五、派生 State 方法

### 1. getDerivedStateFromProps

`static getDerivedStateFromProps(props, state)` 在首次渲染和后续更新的 Render 阶段执行，返回状态片段或 `null`。

它没有实例 `this`，也不能执行副作用。这个 API 只适合少量 State 必须随 Props 变化的场景，通常应优先选择：

- 直接在 `render()` 中计算派生值；
- 通过 Key 重置组件；
- 让父组件完全控制该值；
- 在事件中同时更新相关 State。

把所有 Props 复制进 State 会制造两个数据源。

## 六、错误阶段

`static getDerivedStateFromError(error)` 可以根据后代错误返回降级 State，`componentDidCatch(error, info)` 可以记录错误和组件栈。只有类组件能够在 React 16.8 中实现错误边界。

错误边界捕获范围、降级设计和恢复方式需要与普通生命周期区分：错误方法用于隔离后代渲染故障，不用于处理事件回调或网络请求错误。

## 七、不安全生命周期

以下旧方法在异步渲染模型下可能被多次调用或中断，不应在新代码中使用：

- `componentWillMount` / `UNSAFE_componentWillMount`；
- `componentWillReceiveProps` / `UNSAFE_componentWillReceiveProps`；
- `componentWillUpdate` / `UNSAFE_componentWillUpdate`。

| 旧用途 | 替代方式 |
|--------|----------|
| 挂载后发请求或订阅 | `componentDidMount` |
| Props 变化后执行副作用 | `componentDidUpdate` 比较旧 Props |
| DOM 更新前读取布局 | `getSnapshotBeforeUpdate` |
| 根据 Props 计算显示值 | `render()` 中直接计算 |
| 少量同步派生 State | `getDerivedStateFromProps`，谨慎使用 |

类组件生命周期的基本约束是：Render 阶段只计算，Commit 阶段同步外部系统，卸载阶段对称清理。
