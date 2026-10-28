---
title: "类组件、Props 与 State"
tags:
  - React
  - 类组件
  - State
excerpt: "讲解 React.Component 子类的定义、构造函数、Props、State、render、事件方法绑定和实例字段，建立类组件维护基础。"
date: 2026-07-31
---

# 类组件、Props 与 State

## 一、类组件

### 1. 定义类组件

类组件是继承 `React.Component` 并实现 `render()` 方法的 JavaScript 类。React 创建并保存类实例，在更新时再次调用同一实例的 `render()`。

```jsx
class TaskCard extends React.Component {
  /**
   * 返回当前任务卡片的界面描述。
   * @returns {React.ReactElement} 任务卡片。
   */
  render() {
    return <article>{this.props.title}</article>;
  }
}

const element = <TaskCard title="核对订单" />;
```

| 组成部分 | 含义 |
|----------|------|
| `extends React.Component` | 继承 React 类组件基类 |
| `this.props` | 当前实例接收到的只读 Props |
| `this.state` | 当前实例保存的 State |
| `render()` | 返回本次渲染的 React 可渲染值 |

组件名称同样必须以大写字母开头。

### 2. 类实例由 React 管理

不要手动使用 `new TaskCard()` 创建组件实例。React 需要控制实例创建、Props 更新、State 队列和生命周期调用。

```jsx
// 正确：由 React 创建并管理实例。
const card = <TaskCard title="核对订单" />;

// 错误：手动实例不在 React 组件树中。
const invalidCard = new TaskCard({ title: "核对订单" });
```

## 二、Props

### 1. 通过 this.props 读取

React 在创建组件和后续更新时把 Props 提供给实例。类方法通过 `this.props` 读取当前值：

```jsx
class TaskOwner extends React.Component {
  /**
   * 返回负责人信息。
   * @returns {React.ReactElement} 负责人段落。
   */
  render() {
    const { name, department } = this.props;
    return <p>{name} · {department}</p>;
  }
}
```

Props 仍然只读。类组件也不能给 `this.props.name` 重新赋值或修改传入对象。

### 2. 默认 Props

`defaultProps` 为缺失或显式为 `undefined` 的属性提供默认值：

```jsx
class TaskBadge extends React.Component {
  /**
   * 返回任务状态徽标。
   * @returns {React.ReactElement} 状态徽标。
   */
  render() {
    return <span className={`badge badge--${this.props.tone}`}>{this.props.label}</span>;
  }
}

TaskBadge.defaultProps = {
  tone: "normal"
};
```

`tone={null}` 不会使用默认值，因为 `null` 是调用者明确传入的值。

### 3. 运行时 Props 校验

项目安装 `prop-types` 后，可以为公共组件声明运行时契约：

```jsx
import PropTypes from "prop-types";

TaskBadge.propTypes = {
  label: PropTypes.string.isRequired,
  tone: PropTypes.oneOf(["normal", "warning", "success"])
};
```

`PropTypes` 在开发环境输出警告，不会替代业务校验，也不会阻止错误值继续渲染。

## 三、State

### 1. 在构造函数中初始化

需要根据 Props 初始化实例或绑定方法时，可以定义构造函数：

```jsx
class TaskEditor extends React.Component {
  /**
   * 创建任务编辑器实例。
   * @param {{ initialTitle?: string }} props 初始组件属性。
   */
  constructor(props) {
    super(props);

    this.state = {
      title: props.initialTitle || "",
      saving: false
    };
  }

  /**
   * 返回任务编辑表单。
   * @returns {React.ReactElement} 编辑表单。
   */
  render() {
    return (
      <form>
        <input value={this.state.title} readOnly />
        <button type="submit" disabled={this.state.saving}>
          保存
        </button>
      </form>
    );
  }
}
```

`super(props)` 必须在访问 `this` 之前调用。它完成父类构造，并让构造函数中的 `this.props` 可用。

### 2. 使用类字段初始化

不需要访问构造参数时，也可以使用类字段：

```jsx
class TaskToggle extends React.Component {
  state = {
    expanded: false
  };

  /**
   * 返回展开状态。
   * @returns {React.ReactElement} 展开按钮。
   */
  render() {
    return (
      <button type="button">
        {this.state.expanded ? "收起" : "展开"}
      </button>
    );
  }
}
```

类字段语法需要项目构建工具支持。Create React App 的常见 React 16.8 项目通常已配置相应 Babel 转换。

### 3. 不把所有实例数据放入 State

State 只保存会影响渲染、并且需要触发更新的数据。不会参与渲染的可变值可以放在实例字段中。

```jsx
class SearchBox extends React.Component {
  state = {
    query: ""
  };

  requestController = null;

  /**
   * 返回搜索输入框。
   * @returns {React.ReactElement} 搜索输入框。
   */
  render() {
    return <input value={this.state.query} readOnly />;
  }
}
```

`query` 影响界面，因此放入 State；`requestController` 只用于取消请求，不需要触发渲染，因此保留为实例字段。

## 四、render 方法

### 1. render 保持纯粹

`render()` 可以读取 `this.props`、`this.state` 和 Context，并返回 React 内容。它不应：

- 调用 `setState`；
- 发起网络请求；
- 注册订阅或定时器；
- 修改 DOM；
- 修改 Props、State 或外部变量。

`render()` 可能因父组件更新、State 更新或 Context 变化而多次执行。副作用应放入合适的生命周期方法。

### 2. render 返回值

类组件可返回 React 元素、Fragment、字符串、数字、数组或 `null`。下面根据权限选择空渲染：

```jsx
class AdminActions extends React.Component {
  /**
   * 根据权限返回管理操作。
   * @returns {React.ReactElement | null} 管理按钮或空渲染。
   */
  render() {
    if (!this.props.allowed) {
      return null;
    }

    return <button type="button">删除任务</button>;
  }
}
```

## 五、方法与 this

### 1. 原型方法需要绑定

JavaScript 类方法不会自动绑定 `this`。把实例方法直接作为事件处理函数传入时，调用环境可能丢失实例：

```jsx
class InvalidTaskToggle extends React.Component {
  state = {
    completed: false
  };

  /**
   * 切换完成状态。
   * @returns {void}
   */
  handleToggle() {
    this.setState({ completed: !this.state.completed });
  }

  /**
   * 返回切换按钮。
   * @returns {React.ReactElement} 切换按钮。
   */
  render() {
    // 错误：handleToggle 被调用时 this 可能是 undefined。
    return <button onClick={this.handleToggle}>切换</button>;
  }
}
```

可以在构造函数中绑定：

```jsx
class BoundTaskToggle extends React.Component {
  /**
   * 创建组件并绑定事件方法。
   * @param {object} props 组件属性。
   */
  constructor(props) {
    super(props);
    this.state = { completed: false };
    this.handleToggle = this.handleToggle.bind(this);
  }

  /**
   * 切换完成状态。
   * @returns {void}
   */
  handleToggle() {
    this.setState(
      /**
       * 根据前一状态计算下一状态。
       * @param {{ completed: boolean }} previousState 前一状态。
       * @returns {{ completed: boolean }} 下一状态片段。
       */
      (previousState) => ({
        completed: !previousState.completed
      })
    );
  }

  /**
   * 返回切换按钮。
   * @returns {React.ReactElement} 切换按钮。
   */
  render() {
    return <button onClick={this.handleToggle}>切换</button>;
  }
}
```

### 2. 类字段箭头函数

类字段箭头函数会捕获实例 `this`，不需要在构造函数中绑定：

```jsx
class FieldTaskToggle extends React.Component {
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
       * 根据前一状态切换 completed。
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
    return <button onClick={this.handleToggle}>切换</button>;
  }
}
```

不要在 `render()` 中使用 `onClick={this.handleToggle.bind(this)}` 或每次创建包装箭头函数作为默认写法，因为每次渲染都会生成新函数，也会让参数传递和调试更分散。

## 六、实例数据分类

| 数据 | 保存位置 | 原因 |
|------|----------|------|
| 父组件输入 | `this.props` | 由调用者拥有，只读 |
| 影响渲染的组件数据 | `this.state` | 通过 `setState` 安排更新 |
| DOM 节点引用 | Ref 实例字段 | 不参与渲染 |
| 定时器 ID、请求控制器 | 普通实例字段 | 用于资源管理，不需要触发渲染 |
| 可由 Props 和 State 计算的值 | `render()` 中计算 | 避免重复数据源 |

类组件的核心是持久实例：Props 会更新，State 通过队列更新，普通字段随实例存在，生命周期方法负责管理实例与外部系统的关系。
