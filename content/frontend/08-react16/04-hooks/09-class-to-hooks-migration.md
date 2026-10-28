---
title: "类组件迁移到 Hooks"
tags:
  - React
  - Hooks
  - 类组件
excerpt: "说明如何以行为等价为前提，把类组件的 State、实例字段和生命周期重组为 Hook，并保留 React 16.8 中必须使用类实现的错误边界。"
date: 2026-07-31
---

# 类组件迁移到 Hooks

## 一、迁移目标

类组件迁移不是把每个生命周期方法替换为一个同名 Hook，而是保持组件外部行为不变，重新组织状态、事件和外部同步。

迁移前需要记录：

| 行为 | 需要确认的内容 |
|------|----------------|
| Props 契约 | 必填值、默认值、回调参数 |
| State | 初始值、更新入口、字段关系 |
| 渲染分支 | 加载、空状态、错误和正常内容 |
| 外部同步 | 请求、订阅、定时器、DOM、第三方实例 |
| 清理 | 哪些资源在更新或卸载时撤销 |
| 实例字段 | 是否影响渲染、是否保存 DOM 或资源 |
| 错误处理 | 是否承担错误边界职责 |

没有行为测试时，应先补充组件关键交互测试，避免迁移只比较代码外观。

## 二、State 迁移

### 1. 简单字段

类组件：

```jsx
class TaskToggle extends React.Component {
  state = {
    completed: false
  };

  /**
   * 切换完成状态。
   * @returns {void}
   */
  handleToggle = () => {
    this.setState(
      /**
       * 反转前一完成状态。
       * @param {{ completed: boolean }} previousState 前一状态。
       * @returns {{ completed: boolean }} 下一状态片段。
       */
      (previousState) => ({
        completed: !previousState.completed
      })
    );
  };

  /**
   * 返回切换按钮。
   * @returns {React.ReactElement} 切换按钮。
   */
  render() {
    return (
      <button type="button" onClick={this.handleToggle}>
        {this.state.completed ? "已完成" : "待处理"}
      </button>
    );
  }
}
```

函数组件：

```jsx
/**
 * 显示可切换完成状态的按钮。
 * @returns {React.ReactElement} 切换按钮。
 */
function TaskToggle() {
  const [completed, setCompleted] = React.useState(false);

  /**
   * 切换完成状态。
   * @returns {void}
   */
  function handleToggle() {
    setCompleted(
      /**
       * 反转前一完成状态。
       * @param {boolean} previousCompleted 前一状态。
       * @returns {boolean} 下一状态。
       */
      (previousCompleted) => !previousCompleted
    );
  }

  return (
    <button type="button" onClick={handleToggle}>
      {completed ? "已完成" : "待处理"}
    </button>
  );
}
```

函数组件不需要 `this` 和方法绑定。

### 2. 多字段 State

类 `setState` 浅合并对象，Hook setter 替换整个值。迁移时需要选择：

- 相关字段保留为一个对象，并显式复制；
- 变化原因不同的字段拆为多个 `useState`；
- 转换规则复杂时使用 `useReducer`。

不要把类 State 对象机械复制成一个巨大 `useState`，也不要为了形式把每个字段都拆开。

## 三、实例字段迁移

| 类实例字段用途 | Hook 迁移方式 |
|----------------|---------------|
| 影响渲染的数据 | `useState` 或 `useReducer` |
| DOM 节点 | `useRef` |
| 计时器 ID、请求控制器 | `useRef` |
| 模块级固定配置 | 模块常量 |
| 可由 Props 和 State 计算 | 渲染中直接计算 |
| 绑定后的事件方法 | 普通组件内函数 |

类字段：

```jsx
class TaskTimer extends React.Component {
  timerId = null;
}
```

Hook：

```jsx
const timerRef = React.useRef(null);
```

Ref 变化不触发渲染，符合计时器 ID 的用途。

## 四、生命周期迁移

### 1. 按同步目标拆分

类组件可能在同一个 `componentDidMount` 中同时修改标题、订阅任务和启动定时器：

```jsx
// 组件挂载后同步三个彼此独立的外部系统。
componentDidMount() {
  document.title = this.props.title;
  this.unsubscribe = channel.subscribe(this.props.taskId, this.handleMessage);
  this.timerId = window.setInterval(this.refresh, 30000);
}
```

函数组件应按三个外部系统拆成 Effect，而不是创建一个“挂载 Effect”：

```jsx
React.useEffect(
  /**
   * 同步页面标题。
   * @returns {void}
   */
  () => {
    document.title = title;
  },
  [title]
);

React.useEffect(
  /**
   * 订阅当前任务消息。
   * @returns {() => void} 取消订阅的函数。
   */
  () => channel.subscribe(taskId, handleMessage),
  [channel, taskId, handleMessage]
);

React.useEffect(
  /**
   * 启动定时刷新。
   * @returns {() => void} 清除定时器的函数。
   */
  () => {
    const timerId = window.setInterval(refresh, 30000);

    /**
     * 清除刷新定时器。
     * @returns {void}
     */
    function cleanupTimer() {
      window.clearInterval(timerId);
    }

    return cleanupTimer;
  },
  [refresh]
);
```

每个 Effect 的依赖和清理都只对应一个同步目标。

### 2. 常见映射

| 类生命周期用途 | Hook 方式 |
|----------------|-----------|
| 挂载后建立资源 | `useEffect` setup |
| Props 变化后重建资源 | Effect 依赖 |
| 卸载清理 | Effect cleanup |
| DOM 更新前读取快照 | `useLayoutEffect` 与 Ref |
| 更新后比较旧值 | 依赖直接表达变化，或 Ref 保存旧值 |
| 根据 Props 计算显示值 | 渲染中计算 |
| 控制是否渲染 | `React.memo`，仅在需要时 |

不存在 `componentDidMount`、`componentDidUpdate`、`componentWillUnmount` 与三个独立 Hook 的一一对应关系。一个 Effect 同时描述建立、更新和清理。

## 五、完整迁移示例

### 1. 类组件

```jsx
class TaskPresence extends React.Component {
  state = {
    online: false
  };

  /**
   * 首次挂载后建立订阅。
   * @returns {void}
   */
  componentDidMount() {
    this.subscribe(this.props.taskId);
  }

  /**
   * 任务变化后重建订阅。
   * @param {{ taskId: number }} prevProps 前一组属性。
   * @returns {void}
   */
  componentDidUpdate(prevProps) {
    if (prevProps.taskId !== this.props.taskId) {
      this.unsubscribe();
      this.subscribe(this.props.taskId);
    }
  }

  /**
   * 卸载前取消订阅。
   * @returns {void}
   */
  componentWillUnmount() {
    this.unsubscribe();
  }

  /**
   * 建立指定任务的在线状态订阅。
   * @param {number} taskId 任务 ID。
   * @returns {void}
   */
  subscribe(taskId) {
    this.unsubscribe = this.props.channel.subscribe(
      taskId,
      /**
       * 同步在线状态。
       * @param {boolean} online 下一在线状态。
       * @returns {void}
       */
      (online) => {
        this.setState({ online });
      }
    );
  }

  /**
   * 返回在线状态。
   * @returns {React.ReactElement} 在线状态文本。
   */
  render() {
    return <span>{this.state.online ? "在线" : "离线"}</span>;
  }
}
```

### 2. 函数组件

```jsx
/**
 * 显示指定任务的在线状态。
 * @param {{ taskId: number, channel: TaskChannel }} props 组件属性。
 * @returns {React.ReactElement} 在线状态文本。
 */
function TaskPresence({ taskId, channel }) {
  const [online, setOnline] = React.useState(false);

  React.useEffect(
    /**
     * 建立当前任务订阅。
     * @returns {() => void} 取消当前订阅的函数。
     */
    () => {
      /**
       * 同步频道推送的在线状态。
       * @param {boolean} nextOnline 下一在线状态。
       * @returns {void}
       */
      function handleOnlineChange(nextOnline) {
        setOnline(nextOnline);
      }

      return channel.subscribe(taskId, handleOnlineChange);
    },
    [channel, taskId]
  );

  return <span>{online ? "在线" : "离线"}</span>;
}
```

函数组件用一个 Effect 同时表达首次订阅、参数变化后的重订阅和卸载清理。

## 六、错误边界

React 16.8 没有用 Hook 实现错误边界的官方 API。具有 `getDerivedStateFromError` 或 `componentDidCatch` 的错误边界必须保留类组件。

可以让函数组件作为错误边界的子组件，也可以封装类错误边界供函数组件树使用，但不能伪造一个 `useErrorBoundary` 代替 React 的渲染错误捕获机制。

## 七、渐进迁移

### 1. 保持组件接口

迁移时尽量保持 Props、回调参数和渲染结果不变。父组件无需同时修改，变更范围更容易验证。

迁移前应记录默认值、错误状态和回调触发时机，并用行为测试保护这些契约。内部实现改用 Hook 后，相同输入仍应产生相同的可观察结果。

### 2. 拆分高风险迁移

复杂组件可以分阶段处理：

1. 补充行为测试；
2. 清理不安全生命周期和直接 State 修改；
3. 提取纯计算函数；
4. 提取可独立复用的子组件；
5. 把类组件改为函数组件；
6. 按同步目标迁移生命周期；
7. 对比交互、请求、清理和错误状态。

### 3. 不为迁移而迁移

稳定类组件没有必须立即改写的版本要求。以下情况可以保留：

- 组件是错误边界；
- 迁移缺少测试保护；
- 组件即将下线；
- 改写成本明显高于维护收益；
- 所依赖的旧库只提供类组件接口。

迁移完成的判断标准是行为、清理和错误边界保持正确，而不是代码中不再出现 `class`。
