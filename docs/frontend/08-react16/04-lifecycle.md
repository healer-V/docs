# 生命周期

## 一、什么是生命周期？

::: tip 生命周期定义
组件的生命周期是指组件从创建到销毁的整个过程。React 为类组件提供了生命周期方法，让我们可以在组件的不同阶段执行特定的操作。
:::

## 二、生命周期三个阶段

### 1、挂载（Mounting）
组件被创建并插入到 DOM 中

### 2、更新（Updating）
组件的 props 或 state 发生变化时

### 3、卸载（Unmounting）
组件从 DOM 中移除

## 三、完整的生命周期流程图

::: details 点击查看完整流程图

```
挂载阶段：
constructor → getDerivedStateFromProps → render → componentDidMount

更新阶段：
getDerivedStateFromProps → shouldComponentUpdate → render → 
getSnapshotBeforeUpdate → componentDidUpdate

卸载阶段：
componentWillUnmount
```

:::

## 四、挂载阶段

### 1、constructor

```jsx
class MyComponent extends React.Component {
  constructor(props) {
    super(props);
    // 初始化 state
    this.state = {
      count: 0
    };
    // 绑定方法
    this.handleClick = this.handleClick.bind(this);
  }
}
```

::: info 使用场景
- 初始化 state
- 绑定事件处理函数
:::

### 2、getDerivedStateFromProps（静态方法）

```jsx
class MyComponent extends React.Component {
  static getDerivedStateFromProps(props, state) {
    // 根据 props 更新 state
    if (props.value !== state.value) {
      return {
        value: props.value
      };
    }
    return null; // 不更新 state
  }
}
```

::: warning 使用建议
- 当 props 变化时更新 state
- 很少使用，通常有更好的替代方案
:::

### 3、render

```jsx
class MyComponent extends React.Component {
  render() {
    return <div>Hello, World!</div>;
  }
}
```

::: info 使用场景
- 返回 JSX
- 必须返回有效的 React 元素
:::

### 4、componentDidMount

```jsx
class MyComponent extends React.Component {
  componentDidMount() {
    // 组件挂载后执行
    // 适合进行：
    // - API 调用
    // - 订阅事件
    // - 操作 DOM
    fetch('/api/data')
      .then(res => res.json())
      .then(data => this.setState({ data }));
  }
}
```

::: tip 使用场景
- API 数据获取
- 设置订阅
- 操作 DOM 节点
:::

## 五、更新阶段

### 1、getDerivedStateFromProps

在更新阶段也会调用（同挂载阶段）

### 2、shouldComponentUpdate

```jsx
class MyComponent extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    // 返回 true 表示需要更新，false 表示跳过更新
    if (this.props.value !== nextProps.value) {
      return true;
    }
    return false;
  }
}
```

::: tip 使用场景
- 性能优化
- 控制组件是否重新渲染
:::

### 3、render

更新阶段也会调用 render 方法

### 4、getSnapshotBeforeUpdate

```jsx
class MyComponent extends React.Component {
  getSnapshotBeforeUpdate(prevProps, prevState) {
    // 在更新前捕获一些信息（如滚动位置）
    if (prevProps.list.length < this.props.list.length) {
      const list = this.listRef.current;
      return list.scrollHeight - list.scrollTop;
    }
    return null;
  }
}
```

::: info 使用场景
- 捕获更新前的 DOM 信息
- 很少使用
:::

### 5、componentDidUpdate

```jsx
class MyComponent extends React.Component {
  componentDidUpdate(prevProps, prevState, snapshot) {
    // 组件更新后执行
    if (this.props.userID !== prevProps.userID) {
      // 当 userID 变化时，重新获取数据
      this.fetchData(this.props.userID);
    }

    // 使用 snapshot
    if (snapshot !== null) {
      const list = this.listRef.current;
      list.scrollTop = list.scrollHeight - snapshot;
    }
  }
}
```

::: tip 使用场景
- 根据 props/state 变化执行操作
- 网络请求
- DOM 操作
:::

## 六、卸载阶段

### 1、componentWillUnmount

```jsx
class MyComponent extends React.Component {
  componentDidMount() {
    // 订阅事件
    this.timer = setInterval(() => {
      console.log('Tick');
    }, 1000);
  }

  componentWillUnmount() {
    // 清理工作
    clearInterval(this.timer);
    // 取消订阅
    // 清理定时器
    // 取消网络请求
  }
}
```

::: warning 重要提示
必须在 componentWillUnmount 中清理所有订阅、定时器和网络请求，防止内存泄漏。
:::

## 七、已废弃的生命周期方法

::: danger 已废弃的方法
以下方法在 React 16.3+ 中被标记为不安全，将在未来版本中移除：

- `componentWillMount`
- `componentWillReceiveProps`
- `componentWillUpdate`

**替代方案**：
- 使用 `getDerivedStateFromProps` 替代 `componentWillReceiveProps`
- 使用 `componentDidMount` 替代 `componentWillMount`
- 使用 `componentDidUpdate` 替代 `componentWillUpdate`
:::

## 八、实际应用示例

### 1、数据获取

::: details 点击查看完整示例

```jsx
class UserProfile extends React.Component {
  state = {
    user: null,
    loading: true,
    error: null
  };

  componentDidMount() {
    this.fetchUser(this.props.userId);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.userId !== this.props.userId) {
      this.fetchUser(this.props.userId);
    }
  }

  componentWillUnmount() {
    // 取消未完成的请求
    if (this.controller) {
      this.controller.abort();
    }
  }

  fetchUser = async (userId) => {
    this.setState({ loading: true, error: null });
    try {
      const response = await fetch(`/api/users/${userId}`);
      const user = await response.json();
      this.setState({ user, loading: false });
    } catch (error) {
      this.setState({ error: error.message, loading: false });
    }
  };

  render() {
    const { user, loading, error } = this.state;

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!user) return null;

    return (
      <div>
        <h1>{user.name}</h1>
        <p>{user.email}</p>
      </div>
    );
  }
}
```

:::

### 2、订阅和清理

::: details 点击查看完整示例

```jsx
class ChatRoom extends React.Component {
  state = {
    messages: []
  };

  componentDidMount() {
    // 订阅消息
    this.subscription = subscribeToMessages((message) => {
      this.setState(prevState => ({
        messages: [...prevState.messages, message]
      }));
    });
  }

  componentWillUnmount() {
    // 取消订阅
    unsubscribeFromMessages(this.subscription);
  }

  render() {
    return (
      <div>
        {this.state.messages.map(msg => (
          <div key={msg.id}>{msg.text}</div>
        ))}
      </div>
    );
  }
}
```

:::

## 九、总结

::: tip 学习建议
生命周期方法让我们可以在组件的不同阶段执行特定操作。虽然 React 16.8+ 引入了 Hooks，但理解生命周期对于使用类组件和迁移到 Hooks 都很重要。
:::
