---
title: "组件开发"
category: "前端 · React 16"
tags:
  - React
excerpt: "组件是 React 应用的基本构建块。组件将 UI 拆分为独立、可复用的部分，每个部分都可以独立思考和设计。 可以使用生命周期方法 可以维护内部状态（state） 可以使用 refs 在 React 16.8 之前，函数式组件是无状态组件，..."
---

# 组件开发

## 一、什么是组件？

::: tip 组件定义
组件是 React 应用的基本构建块。组件将 UI 拆分为独立、可复用的部分，每个部分都可以独立思考和设计。
:::

## 二、函数组件

### 1、基本函数组件

```jsx
function Welcome(props) {
  return <h1>Hello, {props.name}!</h1>;
}
```

### 2、使用箭头函数

```jsx
const Welcome = (props) => {
  return <h1>Hello, {props.name}!</h1>;
};
```

### 3、简化写法（单行返回）

```jsx
const Welcome = (props) => <h1>Hello, {props.name}!</h1>;
```

## 三、类组件

### 1、基本类组件

```jsx
class Welcome extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}!</h1>;
  }
}
```

### 2、类组件的优势

::: info 类组件特点
- 可以使用生命周期方法
- 可以维护内部状态（state）
- 可以使用 refs
:::

## 四、函数组件 vs 类组件

### 1、函数式组件生命周期

::: tip 函数式组件与生命周期
- 在 React 16.8 之前，函数式组件是**无状态组件**，不能使用生命周期方法。
- 但从 React 16.8 开始，通过 **Hooks**（如 `useEffect`），函数式组件可以实现类似生命周期方法的功能。

**生命周期方法对应关系**：
- `componentDidMount` → `useEffect(() => {}, [])`
- `componentDidUpdate` → `useEffect(() => {}, [deps])`
- `componentWillUnmount` → `useEffect(() => { return () => {} }, [])`
:::

```jsx
// 类组件：使用生命周期方法
class MyComponent extends React.Component {
  componentDidMount() {
    console.log('组件挂载');
  }
  
  componentWillUnmount() {
    console.log('组件卸载');
  }
}

// 函数组件：使用 Hooks 实现类似功能
function MyComponent() {
  useEffect(() => {
    console.log('组件挂载');
    return () => {
      console.log('组件卸载');
    };
  }, []);
}
```

### 2、函数式组件与类组件对比


| 特性 | 函数式组件 | 类组件 |
|------|-----------|--------|
| **语法** | 简洁，函数式 | 需要 class 语法 |
| **代码量** | 更少，无样板代码 | 更多，需要 constructor、render 等 |
| **this 绑定** | 无需 this | 需要处理 this 绑定 |
| **状态管理** | 使用 `useState` Hook | 使用 `this.state` |
| **生命周期** | 使用 `useEffect` Hook | 直接使用生命周期方法 |
| **性能** | 通常更好（React 优化） | 稍差（需要实例化） |
| **逻辑复用** | 自定义 Hooks 更灵活 | HOC 或 Render Props |
| **学习曲线** | 较简单 | 较复杂 |
| **测试** | 更容易（纯函数） | 需要 mock this |
| **TypeScript** | 类型推断更好 | 需要更多类型定义 |


#### 2.1、函数式组件的优点

::: tip 函数式组件的优势

1. **代码简洁**
   - 无需 class 语法
   - 无需处理 this 绑定
   - 代码量更少

2. **性能更好**
   - React 对函数组件优化更好
   - 无需实例化类
   - 更容易被编译器优化

3. **逻辑复用**
   - 自定义 Hooks 更灵活
   - 更容易提取和复用逻辑
   - 组合性更好

4. **易于测试**
   - 纯函数，输入输出明确
   - 无需 mock this
   - 测试更简单

5. **TypeScript 支持更好**
   - 类型推断更准确
   - 类型定义更简洁

:::

#### 2.2、函数式组件的缺点

::: warning 函数式组件的局限性

1. **需要 Hooks 支持**
   - React 16.8 之前无法使用状态和生命周期
   - 需要学习 Hooks API

2. **某些高级特性**
   - Error Boundaries 需要使用类组件
   - 某些第三方库可能依赖类组件

:::

#### 2.3、类组件的优点

::: info 类组件的优势

1. **完整的生命周期支持**
   - 直接使用生命周期方法
   - 更直观的生命周期控制

2. **成熟稳定**
   - React 早期就支持
   - 生态更成熟
   - 文档和示例更多

3. **某些高级特性**
   - Error Boundaries 必须使用类组件
   - 某些第三方库需要类组件

4. **团队熟悉度**
   - 面向对象编程思维
   - 更容易理解（对于熟悉 OOP 的开发者）

:::

#### 2.4、类组件的缺点

::: warning 类组件的局限性

1. **代码冗长**
   - 需要写很多样板代码
   - constructor、render 等必须方法

2. **this 绑定问题**
   - 容易出错
   - 需要手动绑定或使用箭头函数

3. **性能稍差**
   - 需要实例化类
   - 内存占用更多

4. **逻辑复用困难**
   - 需要使用 HOC 或 Render Props
   - 代码嵌套深，可读性差

5. **学习曲线陡**
   - 需要理解 this、super、bind 等概念
   - 对新手不友好

:::

### 3、何时使用函数式组件

::: tip 推荐使用函数式组件

- ✅ **新项目**：优先使用函数式组件 + Hooks
- ✅ **简单组件**：展示型组件
- ✅ **需要逻辑复用**：使用自定义 Hooks
- ✅ **性能敏感**：函数组件性能更好
- ✅ **团队协作**：代码更简洁，易于维护

:::

### 4、何时使用类组件

::: info 仍需要使用类组件

- ⚠️ **Error Boundaries**：必须使用类组件
- ⚠️ **遗留代码**：现有类组件可以继续使用
- ⚠️ **特定库要求**：某些第三方库需要类组件
- ⚠️ **团队偏好**：如果团队更熟悉类组件

:::

## 五、Props（属性）

### 1、传递 Props

```jsx
function UserCard({ name, age, email }) {
  return (
    <div>
      <h2>{name}</h2>
      <p>Age: {age}</p>
      <p>Email: {email}</p>
    </div>
  );
}

// 使用组件
<UserCard name="John" age={25} email="john@example.com" />
```

### 2、Props 的只读性

::: warning 重要提示
Props 是只读的，不能在组件内部修改 props。如果需要修改，应该使用 state。
:::

```jsx
// ❌ 错误：不要修改 props
function Component(props) {
  props.name = 'New Name'; // 错误！
  return <div>{props.name}</div>;
}

// ✅ 正确：props 是只读的
function Component(props) {
  return <div>{props.name}</div>;
}
```

### 3、默认 Props

```jsx
function Greeting({ name = 'Guest' }) {
  return <h1>Hello, {name}!</h1>;
}

// 或者使用 defaultProps
function Greeting(props) {
  return <h1>Hello, {props.name}!</h1>;
}

Greeting.defaultProps = {
  name: 'Guest'
};
```

### 4、Props 类型检查（PropTypes）

::: tip 类型检查
使用 PropTypes 可以在开发时检查 props 的类型，帮助发现潜在问题。
:::

```jsx
import PropTypes from 'prop-types';

function UserCard({ name, age, email }) {
  return (
    <div>
      <h2>{name}</h2>
      <p>Age: {age}</p>
      <p>Email: {email}</p>
    </div>
  );
}

UserCard.propTypes = {
  name: PropTypes.string.isRequired,
  age: PropTypes.number.isRequired,
  email: PropTypes.string.isRequired
};
```

## 六、State（状态）

### 1、类组件中的 State

```jsx
class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      count: 0
    };
  }

  increment = () => {
    this.setState({ count: this.state.count + 1 });
  };

  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={this.increment}>Increment</button>
      </div>
    );
  }
}
```

### 2、使用类属性语法

```jsx
class Counter extends React.Component {
  state = {
    count: 0
  };

  increment = () => {
    this.setState({ count: this.state.count + 1 });
  };

  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={this.increment}>Increment</button>
      </div>
    );
  }
}
```

### 3、setState 的正确使用

::: warning 重要提示
不要直接修改 state，应该使用 setState 方法。如果需要基于前一个 state 更新，使用函数式更新。
:::

```jsx
// ✅ 正确：使用函数式更新
this.setState((prevState) => ({
  count: prevState.count + 1
}));

// ✅ 正确：直接更新
this.setState({ count: 1 });

// ❌ 错误：不要直接修改 state
this.state.count = 1; // 错误！
```

## 七、组件组合

### 1、组合组件

```jsx
function App() {
  return (
    <div>
      <Header />
      <MainContent />
      <Footer />
    </div>
  );
}

function Header() {
  return <header>Header</header>;
}

function MainContent() {
  return <main>Main Content</main>;
}

function Footer() {
  return <footer>Footer</footer>;
}
```

### 2、使用 children prop

::: tip children 的用途
children prop 允许组件接收子元素，这是组件组合的强大方式。
:::

```jsx
function Card({ title, children }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="card-content">
        {children}
      </div>
    </div>
  );
}

// 使用
<Card title="My Card">
  <p>This is the card content.</p>
</Card>
```

## 八、组件提取

### 1、提取可复用组件

::: details 点击查看组件提取示例

```jsx
// 原始组件
function UserList({ users }) {
  return (
    <div>
      {users.map(user => (
        <div key={user.id}>
          <img src={user.avatar} alt={user.name} />
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>
      ))}
    </div>
  );
}

// 提取后的组件
function UserCard({ user }) {
  return (
    <div>
      <img src={user.avatar} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}

function UserList({ users }) {
  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

:::

## 九、受控组件与非受控组件

### 1、受控组件

::: tip 受控组件
受控组件的值由 React 的 state 控制，每次值变化都会触发重新渲染。
:::

```jsx
class Form extends React.Component {
  state = {
    inputValue: ''
  };

  handleChange = (e) => {
    this.setState({ inputValue: e.target.value });
  };

  render() {
    return (
      <input
        type="text"
        value={this.state.inputValue}
        onChange={this.handleChange}
      />
    );
  }
}
```

### 2、非受控组件

::: info 非受控组件
非受控组件的值由 DOM 自身管理，使用 ref 来获取值。
:::

```jsx
class Form extends React.Component {
  inputRef = React.createRef();

  handleSubmit = (e) => {
    e.preventDefault();
    console.log(this.inputRef.current.value);
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <input type="text" ref={this.inputRef} />
        <button type="submit">Submit</button>
      </form>
    );
  }
}
```

## 十、组件通信

### 1、父子组件通信

::: details 点击查看通信示例

```jsx
// 父组件向子组件传递数据
function Parent() {
  const data = 'Hello from parent';
  return <Child message={data} />;
}

function Child({ message }) {
  return <p>{message}</p>;
}

// 子组件向父组件传递数据
function Parent() {
  const handleChildClick = (data) => {
    console.log('Data from child:', data);
  };

  return <Child onChildClick={handleChildClick} />;
}

function Child({ onChildClick }) {
  return (
    <button onClick={() => onChildClick('Hello from child')}>
      Click me
    </button>
  );
}
```

:::

## 总结

::: tip 学习建议
组件是 React 的核心概念，通过函数组件和类组件，我们可以构建可复用、可维护的 UI。掌握组件的使用是学习 React 的关键。
:::
