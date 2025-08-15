# React 16 学习笔记

## 一、React 基础入门

### 1.1 React 简介

:::tip 什么是React
- `React` 是一个用于构建用户界面的 JavaScript 库
- 由 Facebook 开发并维护，用于构建大型、复杂的 Web 应用
- React 只关注视图层，采用组件化开发模式
- 核心特点：声明式、组件化、一次学习，随处编写
:::

### 1.2 React 核心概念

:::tip 核心概念
- **JSX**：JavaScript 的语法扩展，用于描述 UI 结构
- **组件**：React 应用的基本构建块，可复用的 UI 片段
- **Props**：组件间传递数据的方式，从父组件流向子组件
- **State**：组件内部的状态数据，状态变化会触发重新渲染
- **虚拟DOM**：React 在内存中维护的 DOM 表示，提高渲染性能
:::

### 1.3 第一个 React 应用

::: details 创建第一个React组件
```jsx
// 1. 引入React
import React from 'react';
import ReactDOM from 'react-dom';

// 2. 创建函数组件
function App() {
  return (
    <div>
      <h1>Hello, React!</h1>
      <p>我的第一个React应用</p>
    </div>
  );
}

// 3. 渲染到DOM
ReactDOM.render(<App />, document.getElementById('root'));
```

```jsx
// 类组件写法
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

class App extends Component {
  render() {
    return (
      <div>
        <h1>Hello, React!</h1>
        <p>我的第一个React应用</p>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
```
:::

## 二、JSX 语法详解

### 2.1 JSX 基础

:::tip JSX特点
- JSX 是 JavaScript 的语法扩展
- JSX 让我们可以用类似 HTML 的语法来编写 JavaScript 代码
- JSX 最终会被 Babel 编译成 `React.createElement()` 调用
- JSX 可以防止注入攻击，在渲染前会对内容进行转义
:::

### 2.2 JSX 使用规则

::: details JSX基本语法
```jsx
// 1. 基本使用
const element = <h1>Hello, World!</h1>;

// 2. 嵌入JavaScript表达式
const name = 'React';
const element = <h1>Hello, {name}!</h1>;

// 3. 使用表达式
function formatName(user) {
  return user.firstName + ' ' + user.lastName;
}

const user = {
  firstName: 'John',
  lastName: 'Doe'
};

const element = (
  <h1>
    Hello, {formatName(user)}!
  </h1>
);

// 4. JSX也是表达式
function getGreeting(user) {
  if (user) {
    return <h1>Hello, {formatName(user)}!</h1>;
  }
  return <h1>Hello, Stranger.</h1>;
}

// 5. 使用属性
const element = <div tabIndex="0"></div>;
const element = <img src={user.avatarUrl}></img>;

// 6. 使用子元素
const element = (
  <div>
    <h1>Hello!</h1>
    <h2>Good to see you here.</h2>
  </div>
);

// 7. JSX防止注入攻击
const title = response.potentiallyMaliciousInput;
// 直接使用是安全的
const element = <h1>{title}</h1>;
```
:::

### 2.3 JSX 注意事项

:::tip JSX注意事项
- JSX 必须有一个根元素
- JSX 标签必须闭合
- JSX 中的 class 要写成 className
- JSX 中的 style 要写成对象形式
- JSX 中的注释要使用 `{/* 注释内容 */}`
:::

::: details JSX注意事项示例
```jsx
// 正确：必须有根元素
function App() {
  return (
    <div>
      <h1>标题1</h1>
      <h2>标题2</h2>
    </div>
  );
}

// 错误：没有根元素
function App() {
  return (
    <h1>标题1</h1>
    <h2>标题2</h2>
  );
}

// 正确：标签闭合
<img src="avatar.jpg" />
<input type="text" />

// 正确：class -> className
<div className="container">内容</div>

// 正确：style 对象
<div style={{ color: 'red', fontSize: '16px' }}>红色文字</div>

// 正确：注释
<div>
  {/* 这是一个注释 */}
  <p>内容</p>
</div>
```
:::

## 三、组件与Props

### 3.1 函数组件

:::tip 函数组件
- 最简单的组件形式
- 接收 props 作为参数
- 返回 JSX 元素
- 没有状态和生命周期
:::

::: details 函数组件示例
```jsx
// 基本函数组件
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}

// 使用组件
function App() {
  return (
    <div>
      <Welcome name="Sara" />
      <Welcome name="Cahal" />
      <Welcome name="Edite" />
    </div>
  );
}

// ES6箭头函数
const Welcome = (props) => {
  return <h1>Hello, {props.name}</h1>;
};

// 更简洁的箭头函数
const Welcome = props => <h1>Hello, {props.name}</h1>;

// 解构props
const Welcome = ({ name }) => <h1>Hello, {name}</h1>;
```
:::

### 3.2 类组件

:::tip 类组件
- 通过继承 React.Component 创建
- 有自己的状态（state）
- 有生命周期方法
- 更强大但更复杂
:::

::: details 类组件示例
```jsx
import React, { Component } from 'react';

// 基本类组件
class Welcome extends Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}

// 带构造函数的类组件
class Welcome extends Component {
  constructor(props) {
    super(props);
    // 在这里可以初始化state
    this.state = {
      count: 0
    };
  }

  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}

// 使用类组件
function App() {
  return (
    <div>
      <Welcome name="Sara" />
      <Welcome name="Cahal" />
      <Welcome name="Edite" />
    </div>
  );
}
```
:::

### 3.3 Props 详解

:::tip Props特点
- Props 是只读的，不能修改
- Props 可以是任何类型（字符串、数字、对象、函数等）
- Props 可以设置默认值
- Props 可以进行类型检查
:::

::: details Props使用示例
```jsx
// 传递不同类型的props
function UserProfile(props) {
  return (
    <div>
      <h2>{props.name}</h2>
      <p>年龄: {props.age}</p>
      <p>是否管理员: {props.isAdmin ? '是' : '否'}</p>
      <p>爱好: {props.hobbies.join(', ')}</p>
      <button onClick={props.onLogout}>退出登录</button>
    </div>
  );
}

// 使用组件
function App() {
  const handleLogout = () => {
    console.log('用户退出登录');
  };

  return (
    <UserProfile
      name="张三"
      age={25}
      isAdmin={true}
      hobbies={['读书', '运动', '编程']}
      onLogout={handleLogout}
    />
  );
}

// Props默认值
function Welcome({ name = 'Guest' }) {
  return <h1>Hello, {name}</h1>;
}

// 类组件的Props默认值
class Welcome extends Component {
  static defaultProps = {
    name: 'Guest'
  };

  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}

// Props类型检查（需要引入prop-types）
import PropTypes from 'prop-types';

function Welcome({ name }) {
  return <h1>Hello, {name}</h1>;
}

Welcome.propTypes = {
  name: PropTypes.string.isRequired
};
```
:::

## 四、State与生命周期

### 4.1 State 基础

:::tip State特点
- State 是组件内部的状态数据
- State 改变会触发组件重新渲染
- State 只能在类组件中使用（React 16.8之前）
- State 必须通过 setState() 方法修改
:::

::: details State使用示例
```jsx
import React, { Component } from 'react';

class Counter extends Component {
  constructor(props) {
    super(props);
    // 初始化state
    this.state = {
      count: 0
    };
  }

  // 正确修改state
  increment = () => {
    this.setState(prevState => ({
      count: prevState.count + 1
    }));
  };

  decrement = () => {
    this.setState(prevState => ({
      count: prevState.count - 1
    }));
  };

  render() {
    return (
      <div>
        <h1>计数器: {this.state.count}</h1>
        <button onClick={this.increment}>+1</button>
        <button onClick={this.decrement}>-1</button>
      </div>
    );
  }
}

// 复杂的state
class UserProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: {
        name: '张三',
        age: 25,
        email: 'zhangsan@example.com'
      },
      loading: false,
      error: null
    };
  }

  updateUserName = (newName) => {
    this.setState(prevState => ({
      user: {
        ...prevState.user,
        name: newName
      }
    }));
  };

  render() {
    const { user, loading, error } = this.state;
    
    if (loading) {
      return <div>加载中...</div>;
    }

    if (error) {
      return <div>错误: {error.message}</div>;
    }

    return (
      <div>
        <h2>{user.name}</h2>
        <p>年龄: {user.age}</p>
        <p>邮箱: {user.email}</p>
      </div>
    );
  }
}
```
:::

### 4.2 生命周期方法

:::tip 生命周期
生命周期是组件从创建到销毁的整个过程，React提供了不同的生命周期方法让我们在特定阶段执行代码。
:::

#### 4.2.1 挂载阶段

::: details 挂载阶段生命周期
```jsx
class LifeCycleDemo extends Component {
  constructor(props) {
    super(props);
    console.log('1. constructor - 组件实例化');
    this.state = { count: 0 };
  }

  static getDerivedStateFromProps(props, state) {
    console.log('2. getDerivedStateFromProps - 从props获取state');
    return null;
  }

  render() {
    console.log('3. render - 渲染组件');
    return (
      <div>
        <h1>生命周期演示</h1>
        <p>计数: {this.state.count}</p>
        <button onClick={() => this.setState({ count: this.state.count + 1 })}>
          增加
        </button>
      </div>
    );
  }

  componentDidMount() {
    console.log('4. componentDidMount - 组件挂载完成');
    // 在这里可以进行：
    // - DOM操作
    // - 网络请求
    // - 订阅事件
    // - 设置定时器
  }
}
```
:::

#### 4.2.2 更新阶段

::: details 更新阶段生命周期
```jsx
class UpdateLifeCycle extends Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }

  static getDerivedStateFromProps(props, state) {
    console.log('1. getDerivedStateFromProps - 从props获取state');
    return null;
  }

  shouldComponentUpdate(nextProps, nextState) {
    console.log('2. shouldComponentUpdate - 是否应该更新');
    // 返回true继续更新，返回false取消更新
    return nextState.count !== this.state.count;
  }

  render() {
    console.log('3. render - 重新渲染');
    return (
      <div>
        <h1>更新生命周期</h1>
        <p>计数: {this.state.count}</p>
        <button onClick={() => this.setState({ count: this.state.count + 1 })}>
          增加
        </button>
      </div>
    );
  }

  getSnapshotBeforeUpdate(prevProps, prevState) {
    console.log('4. getSnapshotBeforeUpdate - 获取更新前快照');
    // 可以返回一个值，传递给componentDidUpdate
    return null;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    console.log('5. componentDidUpdate - 更新完成');
    // 在这里可以进行：
    // - DOM操作
    // - 网络请求（根据条件）
    // - 清理工作
  }
}
```
:::

#### 4.2.3 卸载阶段

::: details 卸载阶段生命周期
```jsx
class UnmountLifeCycle extends Component {
  componentDidMount() {
    console.log('组件挂载完成');
    // 设置定时器
    this.timer = setInterval(() => {
      console.log('定时器执行');
    }, 1000);
    
    // 添加事件监听
    window.addEventListener('resize', this.handleResize);
  }

  handleResize = () => {
    console.log('窗口大小改变');
  };

  componentWillUnmount() {
    console.log('组件即将卸载');
    // 清理定时器
    clearInterval(this.timer);
    
    // 移除事件监听
    window.removeEventListener('resize', this.handleResize);
    
    // 取消网络请求
    // 清理订阅
  }

  render() {
    return <div>卸载生命周期演示</div>;
  }
}
```
:::

### 4.3 错误边界

:::tip 错误边界
错误边界是React组件，可以捕获子组件树中的JavaScript错误，记录错误并显示降级UI。
:::

::: details 错误边界示例
```jsx
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // 更新state，让下一次渲染显示降级UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // 可以在这里上报错误到服务器
    console.error('捕获到错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>出错了！</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>错误详情</summary>
            <p>{this.state.error && this.state.error.toString()}</p>
            <p>{this.state.errorInfo && this.state.errorInfo.componentStack}</p>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// 使用错误边界
function App() {
  return (
    <ErrorBoundary>
      <BuggyComponent />
    </ErrorBoundary>
  );
}

// 一个会出错的组件
class BuggyComponent extends Component {
  state = { counter: 0 };

  handleClick = () => {
    this.setState(({ counter }) => ({
      counter: counter + 1
    }));
  };

  render() {
    if (this.state.counter === 5) {
      // 模拟一个错误
      throw new Error('我崩溃了！');
    }
    return (
      <div>
        <h1>{this.state.counter}</h1>
        <button onClick={this.handleClick}>增加</button>
      </div>
    );
  }
}
```
:::

## 五、条件渲染与列表渲染

### 5.1 条件渲染

:::tip 条件渲染
- 使用 if 语句进行条件渲染
- 使用三元运算符进行条件渲染
- 使用逻辑与运算符进行条件渲染
- 使用 switch 语句进行复杂条件渲染
:::

::: details 条件渲染示例
```jsx
// 1. 使用if语句
function Greeting(props) {
  const isLoggedIn = props.isLoggedIn;
  
  if (isLoggedIn) {
    return <h1>欢迎回来！</h1>;
  }
  return <h1>请登录。</h1>;
}

// 2. 使用三元运算符
function Greeting(props) {
  const isLoggedIn = props.isLoggedIn;
  
  return (
    <div>
      {isLoggedIn ? (
        <h1>欢迎回来！</h1>
      ) : (
        <h1>请登录。</h1>
      )}
    </div>
  );
}

// 3. 使用逻辑与运算符
function Mailbox(props) {
  const unreadMessages = props.unreadMessages;
  
  return (
    <div>
      <h1>你好！</h1>
      {unreadMessages.length > 0 && (
        <h2>
          你有 {unreadMessages.length} 条未读消息。
        </h2>
      )}
    </div>
  );
}

// 4. 使用变量存储元素
function LoginControl(props) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  let button;
  if (isLoggedIn) {
    button = <LogoutButton onClick={() => setIsLoggedIn(false)} />;
  } else {
    button = <LoginButton onClick={() => setIsLoggedIn(true)} />;
  }

  return (
    <div>
      <Greeting isLoggedIn={isLoggedIn} />
      {button}
    </div>
  );
}

// 5. 阻止组件渲染
function WarningBanner(props) {
  if (!props.warn) {
    return null;
  }

  return (
    <div className="warning">
      警告！
    </div>
  );
}
```
:::

### 5.2 列表渲染

:::tip 列表渲染
- 使用 map() 方法渲染列表
- 为列表项设置唯一的 key
- 使用 index 作为 key 的注意事项
:::

::: details 列表渲染示例
```jsx
// 1. 基本列表渲染
function NumberList(props) {
  const numbers = props.numbers;
  const listItems = numbers.map((number) =>
    <li key={number.toString()}>
      {number}
    </li>
  );
  
  return (
    <ul>{listItems}</ul>
  );
}

// 使用组件
const numbers = [1, 2, 3, 4, 5];
ReactDOM.render(
  <NumberList numbers={numbers} />,
  document.getElementById('root')
);

// 2. 更简洁的写法
function NumberList(props) {
  return (
    <ul>
      {props.numbers.map((number) =>
        <li key={number.toString()}>
          {number}
        </li>
      )}
    </ul>
  );
}

// 3. 渲染对象列表
function UserList(props) {
  const users = props.users;
  
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          <h3>{user.name}</h3>
          <p>年龄: {user.age}</p>
          <p>邮箱: {user.email}</p>
        </li>
      ))}
    </ul>
  );
}

// 4. 嵌套列表渲染
function Menu(props) {
  const menuItems = props.menuItems;
  
  return (
    <ul>
      {menuItems.map(item => (
        <li key={item.id}>
          {item.name}
          {item.children && item.children.length > 0 && (
            <ul>
              {item.children.map(child => (
                <li key={child.id}>
                  {child.name}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

// 5. 条件列表渲染
function FilteredList(props) {
  const items = props.items;
  const filterText = props.filterText;
  
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(filterText.toLowerCase())
  );
  
  return (
    <ul>
      {filteredItems.map(item => (
        <li key={item.id}>
          {item.name}
        </li>
      ))}
    </ul>
  );
}
```
:::

### 5.3 Key 的正确使用

:::tip Key的作用
- Key 帮助 React 识别哪些元素改变了
- Key 应该在列表内具有唯一性
- Key 不需要全局唯一，只需要在同一个列表中唯一
- 使用 index 作为 key 可能导致问题
:::

::: details Key使用示例
```jsx
// 正确：使用唯一ID
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          {todo.text}
        </li>
      ))}
    </ul>
  );
}

// 错误：使用index作为key（当列表顺序可能变化时）
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo, index) => (
        <li key={index}>
          {todo.text}
        </li>
      ))}
    </ul>
  );
}

// 正确：组合多个字段创建key
function UserList({ users }) {
  return (
    <ul>
      {users.map(user => (
        <li key={`${user.id}-${user.name}`}>
          {user.name}
        </li>
      ))}
    </ul>
  );
}

// 正确：在嵌套列表中使用key
function CommentList({ comments }) {
  return (
    <div>
      {comments.map(comment => (
        <div key={comment.id}>
          <h4>{comment.author}</h4>
          <p>{comment.text}</p>
          <div>
            {comment.replies.map(reply => (
              <div key={reply.id}>
                <h5>{reply.author}</h5>
                <p>{reply.text}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```
:::

## 六、表单处理

### 6.1 受控组件

:::tip 受控组件
- 表单数据由 React 组件状态管理
- 表单值的变化通过 onChange 事件更新状态
- 状态的变化会重新渲染表单
- React 完全控制表单的行为
:::

::: details 受控组件示例
```jsx
// 1. 基本受控组件
class NameForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: '' };
  }

  handleChange = (event) => {
    this.setState({ value: event.target.value });
  };

  handleSubmit = (event) => {
    alert('提交的名字: ' + this.state.value);
    event.preventDefault();
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          名字:
          <input
            type="text"
            value={this.state.value}
            onChange={this.handleChange}
          />
        </label>
        <input type="submit" value="提交" />
      </form>
    );
  }
}

// 2. 多个表单元素
class Reservation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isGoing: true,
      numberOfGuests: 2
    };
  }

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  };

  render() {
    return (
      <form>
        <label>
          参与:
          <input
            name="isGoing"
            type="checkbox"
            checked={this.state.isGoing}
            onChange={this.handleInputChange}
          />
        </label>
        <br />
        <label>
          来宾人数:
          <input
            name="numberOfGuests"
            type="number"
            value={this.state.numberOfGuests}
            onChange={this.handleInputChange}
          />
        </label>
      </form>
    );
  }
}

// 3. textarea标签
class EssayForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '请撰写一篇关于你喜欢的 DOM 元素的文章。'
    };
  }

  handleChange = (event) => {
    this.setState({ value: event.target.value });
  };

  handleSubmit = (event) => {
    alert('提交的文章: ' + this.state.value);
    event.preventDefault();
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          文章:
          <textarea
            value={this.state.value}
            onChange={this.handleChange}
          />
        </label>
        <input type="submit" value="提交" />
      </form>
    );
  }
}

// 4. select标签
class FlavorForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: 'coconut' };
  }

  handleChange = (event) => {
    this.setState({ value: event.target.value });
  };

  handleSubmit = (event) => {
    alert('你喜欢的风味是: ' + this.state.value);
    event.preventDefault();
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          选择你喜欢的风味:
          <select value={this.state.value} onChange={this.handleChange}>
            <option value="grapefruit">葡萄柚</option>
            <option value="lime">酸橙</option>
            <option value="coconut">椰子</option>
            <option value="mango">芒果</option>
          </select>
        </label>
        <input type="submit" value="提交" />
      </form>
    );
  }
}
```
:::

### 6.2 非受控组件

:::tip 非受控组件
- 表单数据由 DOM 自身管理
- 使用 ref 获取表单值
- 不需要为每个表单元素编写事件处理
- 适用于简单的表单场景
:::

::: details 非受控组件示例
```jsx
// 1. 基本非受控组件
class NameForm extends React.Component {
  constructor(props) {
    super(props);
    this.inputRef = React.createRef();
  }

  handleSubmit = (event) => {
    alert('提交的名字: ' + this.inputRef.current.value);
    event.preventDefault();
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          名字:
          <input
            type="text"
            ref={this.inputRef}
          />
        </label>
        <input type="submit" value="提交" />
      </form>
    );
  }
}

// 2. 默认值
class NameForm extends React.Component {
  constructor(props) {
    super(props);
    this.inputRef = React.createRef();
  }

  handleSubmit = (event) => {
    alert('提交的名字: ' + this.inputRef.current.value);
    event.preventDefault();
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          名字:
          <input
            defaultValue="张三"
            type="text"
            ref={this.inputRef}
          />
        </label>
        <input type="submit" value="提交" />
      </form>
    );
  }
}

// 3. 文件输入
class FileInput extends React.Component {
  constructor(props) {
    super(props);
    this.fileInputRef = React.createRef();
  }

  handleSubmit = (event) => {
    event.preventDefault();
    alert(
      `选择的文件 - ${
        this.fileInputRef.current.files[0].name
      }`
    );
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          上传文件:
          <input type="file" ref={this.fileInputRef} />
        </label>
        <br />
        <button type="submit">提交</button>
      </form>
    );
  }
}
```
:::

## 七、组件通信

### 7.1 父子组件通信

:::tip 父子通信
- 父传子：通过 props 传递数据
- 子传父：通过回调函数传递数据
- 父组件通过 props 控制子组件行为
- 子组件通过回调函数通知父组件状态变化
:::

::: details 父子通信示例
```jsx
// 父组件
class Parent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      parentMessage: '来自父组件的消息',
      childMessage: ''
    };
  }

  handleChildMessage = (message) => {
    this.setState({ childMessage: message });
  };

  render() {
    return (
      <div>
        <h2>父组件</h2>
        <p>子组件的消息: {this.state.childMessage}</p>
        <Child
          message={this.state.parentMessage}
          onMessageChange={this.handleChildMessage}
        />
      </div>
    );
  }
}

// 子组件
class Child extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: ''
    };
  }

  handleChange = (event) => {
    const value = event.target.value;
    this.setState({ inputValue: value });
    
    // 通知父组件
    this.props.onMessageChange(value);
  };

  render() {
    return (
      <div>
        <h3>子组件</h3>
        <p>父组件的消息: {this.props.message}</p>
        <input
          type="text"
          value={this.state.inputValue}
          onChange={this.handleChange}
          placeholder="输入消息给父组件"
        />
      </div>
    );
  }
}
```
:::

### 7.2 兄弟组件通信

:::tip 兄弟通信
- 通过状态提升：将共享状态提升到最近的公共父组件
- 父组件作为中间人，管理共享状态
- 兄弟组件通过父组件进行间接通信
:::

::: details 兄弟通信示例
```jsx
// 父组件
class Parent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sharedData: '',
      siblingAData: '',
      siblingBData: ''
    };
  }

  handleSiblingAChange = (data) => {
    this.setState({ 
      sharedData: data,
      siblingAData: data 
    });
  };

  handleSiblingBChange = (data) => {
    this.setState({ 
      sharedData: data,
      siblingBData: data 
    });
  };

  render() {
    return (
      <div>
        <h2>父组件</h2>
        <p>共享数据: {this.state.sharedData}</p>
        <div style={{ display: 'flex' }}>
          <SiblingA
            data={this.state.siblingAData}
            onDataChange={this.handleSiblingAChange}
          />
          <SiblingB
            data={this.state.siblingBData}
            onDataChange={this.handleSiblingBChange}
          />
        </div>
      </div>
    );
  }
}

// 兄弟组件A
class SiblingA extends React.Component {
  handleChange = (event) => {
    this.props.onDataChange(event.target.value);
  };

  render() {
    return (
      <div style={{ margin: '10px', padding: '10px', border: '1px solid #ccc' }}>
        <h3>兄弟组件A</h3>
        <input
          type="text"
          value={this.props.data}
          onChange={this.handleChange}
          placeholder="输入数据"
        />
      </div>
    );
  }
}

// 兄弟组件B
class SiblingB extends React.Component {
  handleChange = (event) => {
    this.props.onDataChange(event.target.value);
  };

  render() {
    return (
      <div style={{ margin: '10px', padding: '10px', border: '1px solid #ccc' }}>
        <h3>兄弟组件B</h3>
        <input
          type="text"
          value={this.props.data}
          onChange={this.handleChange}
          placeholder="输入数据"
        />
      </div>
    );
  }
}
```
:::

### 7.3 跨级组件通信

:::tip 跨级通信
- 使用 Context API 进行跨级通信
- 避免通过层层传递 props
- 适用于全局配置、主题、用户信息等场景
:::

::: details 跨级通信示例
```jsx
// 1. 创建Context
const ThemeContext = React.createContext('light');

// 2. 提供者组件
class ThemeProvider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      theme: 'light',
      toggleTheme: () => {
        this.setState(prevState => ({
          theme: prevState.theme === 'light' ? 'dark' : 'light'
        }));
      }
    };
  }

  render() {
    return (
      <ThemeContext.Provider value={this.state}>
        {this.props.children}
      </ThemeContext.Provider>
    );
  }
}

// 3. 消费者组件（类组件）
class ThemedButton extends React.Component {
  static contextType = ThemeContext;

  render() {
    const { theme, toggleTheme } = this.context;
    
    return (
      <button
        onClick={toggleTheme}
        style={{
          backgroundColor: theme === 'light' ? '#fff' : '#333',
          color: theme === 'light' ? '#333' : '#fff',
          border: `1px solid ${theme === 'light' ? '#333' : '#fff'}`
        }}
      >
        切换主题
      </button>
    );
  }
}

// 4. 消费者组件（函数组件）
function ThemedText() {
  return (
    <ThemeContext.Consumer>
      {({ theme }) => (
        <p style={{
          color: theme === 'light' ? '#333' : '#fff',
          backgroundColor: theme === 'light' ? '#fff' : '#333'
        }}>
          当前主题: {theme}
        </p>
      )}
    </ThemeContext.Consumer>
  );
}

// 5. 使用Context
function App() {
  return (
    <ThemeProvider>
      <div>
        <ThemedText />
        <ThemedButton />
      </div>
    </ThemeProvider>
  );
}
```
:::

## 八、Hooks 基础

### 8.1 Hooks 简介

:::tip Hooks特点
- Hooks 是 React 16.8 引入的新特性
- 让你在不编写 class 的情况下使用 state 以及其他的 React 特性
- Hooks 是向下兼容的，可以逐步采用
- Hooks 解决了 class 组件的一些痛点
:::

### 8.2 useState

:::tip useState
- useState 是最常用的 Hook
- 用于在函数组件中添加 state
- 返回一个状态值和更新该状态的函数
- 可以多次调用 useState 来创建多个状态
:::

::: details useState示例
```jsx
// 1. 基本使用
import React, { useState } from 'react';

function Counter() {
  // 声明一个新的 state 变量，我们称之为 "count"
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>你点击了 {count} 次</p>
      <button onClick={() => setCount(count + 1)}>
        点击我
      </button>
    </div>
  );
}

// 2. 多个状态
function UserProfile() {
  const [name, setName] = useState('张三');
  const [age, setAge] = useState(25);
  const [isOnline, setIsOnline] = useState(false);

  return (
    <div>
      <h2>{name}</h2>
      <p>年龄: {age}</p>
      <p>状态: {isOnline ? '在线' : '离线'}</p>
      <button onClick={() => setIsOnline(!isOnline)}>
        切换状态
      </button>
    </div>
  );
}

// 3. 函数式更新
function Counter() {
  const [count, setCount] = useState(0);

  function handleIncrement() {
    // 使用函数式更新，确保获取到最新的 state
    setCount(prevCount => prevCount + 1);
  }

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={handleIncrement}>增加</button>
    </div>
  );
}

// 4. 复杂状态
function UserProfile() {
  const [user, setUser] = useState({
    name: '张三',
    age: 25,
    email: 'zhangsan@example.com'
  });

  function updateName(newName) {
    setUser(prevUser => ({
      ...prevUser,
      name: newName
    }));
  }

  return (
    <div>
      <h2>{user.name}</h2>
      <p>年龄: {user.age}</p>
      <p>邮箱: {user.email}</p>
      <button onClick={() => updateName('李四')}>
        修改名字
      </button>
    </div>
  );
}

// 5. 惰性初始state
function Counter({ initialCount }) {
  const [count, setCount] = useState(() => {
    // 只在初始渲染时计算一次
    return initialCount * 2;
  });

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>增加</button>
    </div>
  );
}
```
:::

### 8.3 useEffect

:::tip useEffect
- useEffect 用于处理副作用
- 可以看作 componentDidMount、componentDidUpdate 和 componentWillUnmount 这三个函数的组合
- 在组件渲染后执行
- 可以返回一个函数用于清理
:::

::: details useEffect示例
```jsx
// 1. 基本使用
import React, { useState, useEffect } from 'react';

function Example() {
  const [count, setCount] = useState(0);

  // 类似于 componentDidMount 和 componentDidUpdate:
  useEffect(() => {
    // 使用浏览器的 API 更新页面标题
    document.title = `你点击了 ${count} 次`;
  });

  return (
    <div>
      <p>你点击了 {count} 次</p>
      <button onClick={() => setCount(count + 1)}>
        点击我
      </button>
    </div>
  );
}

// 2. 条件执行
function Example() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('张三');

  // 只有 count 变化时才执行
  useEffect(() => {
    document.title = `你点击了 ${count} 次`;
  }, [count]); // 仅在 count 更改时更新

  return (
    <div>
      <p>你点击了 {count} 次</p>
      <p>名字: {name}</p>
      <button onClick={() => setCount(count + 1)}>
        点击我
      </button>
      <button onClick={() => setName(name === '张三' ? '李四' : '张三')}>
        切换名字
      </button>
    </div>
  );
}

// 3. 清理副作用
function FriendStatus(props) {
  const [isOnline, setIsOnline] = useState(null);

  function handleStatusChange(status) {
    setIsOnline(status.isOnline);
  }

  useEffect(() => {
    ChatAPI.subscribeToFriendStatus(props.friend.id, handleStatusChange);
    
    // 清理函数
    return () => {
      ChatAPI.unsubscribeFromFriendStatus(props.friend.id, handleStatusChange);
    };
  }, [props.friend.id]); // 仅在 props.friend.id 发生变化时，重新订阅

  if (isOnline === null) {
    return 'Loading...';
  }
  return isOnline ? 'Online' : 'Offline';
}

// 4. 只运行一次的effect
function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // 只在组件挂载时执行一次
    fetchData().then(response => {
      setData(response.data);
    });
  }, []); // 空数组表示只在挂载时执行

  if (!data) {
    return 'Loading...';
  }

  return (
    <div>
      {/* 渲染数据 */}
    </div>
  );
}

// 5. 多个effects
function FriendStatusWithCounter(props) {
  const [count, setCount] = useState(0);
  const [isOnline, setIsOnline] = useState(null);

  useEffect(() => {
    document.title = `你点击了 ${count} 次`;
  });

  useEffect(() => {
    ChatAPI.subscribeToFriendStatus(props.friend.id, handleStatusChange);
    return () => {
      ChatAPI.unsubscribeFromFriendStatus(props.friend.id, handleStatusChange);
    };
  });

  function handleStatusChange(status) {
    setIsOnline(status.isOnline);
  }

  return (
    <div>
      <p>你点击了 {count} 次</p>
      <button onClick={() => setCount(count + 1)}>
        点击我
      </button>
      <p>
        {isOnline === null
          ? 'Loading...'
          : isOnline
            ? 'Online'
            : 'Offline'}
      </p>
    </div>
  );
}
```
:::

### 8.4 useContext

:::tip useContext
- useContext 用于接收一个 context 对象
- 订阅 context 的变化
- 在函数组件中读取 context 的值
- 可以简化 Context 的使用
:::

::: details useContext示例
```jsx
// 1. 创建Context
const ThemeContext = React.createContext('light');

// 2. 提供者组件
function App() {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <Toolbar />
    </ThemeContext.Provider>
  );
}

// 3. 中间组件
function Toolbar() {
  return (
    <div>
      <ThemedButton />
    </div>
  );
}

// 4. 消费者组件
function ThemedButton() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      style={{
        backgroundColor: theme === 'light' ? '#fff' : '#333',
        color: theme === 'light' ? '#333' : '#fff'
      }}
    >
      切换主题
    </button>
  );
}

// 5. 多个Context
const UserContext = React.createContext();
const ThemeContext = React.createContext();

function App() {
  const [user, setUser] = useState({ name: '张三' });
  const [theme, setTheme] = useState('light');

  return (
    <UserContext.Provider value={user}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <Layout />
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
}

function Layout() {
  return (
    <div>
      <Profile />
      <ThemeSwitcher />
    </div>
  );
}

function Profile() {
  const user = useContext(UserContext);
  return <div>用户: {user.name}</div>;
}

function ThemeSwitcher() {
  const { theme, setTheme } = useContext(ThemeContext);
  
  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      切换主题
    </button>
  );
}
```
:::

### 8.5 useReducer

:::tip useReducer
- useReducer 是 useState 的替代方案
- 适用于复杂的状态逻辑
- 接收一个 reducer 函数和初始状态
- 返回当前状态和 dispatch 函数
- 适合处理多个相关状态的变化
:::

::: details useReducer示例
```jsx
// 1. 基本使用
import React, { useReducer } from 'react';

// 定义 reducer 函数
function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    default:
      throw new Error();
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  return (
    <div>
      计数: {state.count}
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
    </div>
  );
}

// 2. 复杂状态管理
function todoReducer(state, action) {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        todos: [...state.todos, { id: Date.now(), text: action.text, completed: false }]
      };
    case 'TOGGLE_TODO':
      return {
        todos: state.todos.map(todo =>
          todo.id === action.id ? { ...todo, completed: !todo.completed } : todo
        )
      };
    case 'DELETE_TODO':
      return {
        todos: state.todos.filter(todo => todo.id !== action.id)
      };
    default:
      return state;
  }
}

function TodoApp() {
  const [state, dispatch] = useReducer(todoReducer, { todos: [] });
  const [inputValue, setInputValue] = useState('');

  const addTodo = () => {
    if (inputValue.trim()) {
      dispatch({ type: 'ADD_TODO', text: inputValue });
      setInputValue('');
    }
  };

  return (
    <div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="添加新任务"
      />
      <button onClick={addTodo}>添加</button>
      
      <ul>
        {state.todos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => dispatch({ type: 'TOGGLE_TODO', id: todo.id })}
            />
            <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
              {todo.text}
            </span>
            <button onClick={() => dispatch({ type: 'DELETE_TODO', id: todo.id })}>
              删除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 3. 惰性初始化
function init(initialCount) {
  return { count: initialCount };
}

function Counter({ initialCount }) {
  const [state, dispatch] = useReducer(reducer, initialCount, init);

  return (
    <div>
      计数: {state.count}
      <button onClick={() => dispatch({ type: 'reset', initialCount })}>
        重置
      </button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
    </div>
  );
}
```
:::

### 8.6 useCallback

:::tip useCallback
- useCallback 用于缓存函数
- 避免在每次渲染时创建新的函数实例
- 接收一个回调函数和依赖项数组
- 依赖项变化时才重新创建函数
- 主要用于性能优化，避免子组件不必要的重新渲染
:::

::: details useCallback示例
```jsx
// 1. 基本使用
import React, { useState, useCallback } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  // 使用 useCallback 缓存函数
  const increment = useCallback(() => {
    setCount(prevCount => prevCount + 1);
  }, []); // 空依赖数组，函数永远不会重新创建

  const decrement = useCallback(() => {
    setCount(prevCount => prevCount - 1);
  }, []);

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={increment}>+1</button>
      <button onClick={decrement}>-1</button>
    </div>
  );
}

// 2. 带有依赖的函数
function SearchResults({ query }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // 使用 useCallback 缓存搜索函数
  const search = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${query}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  }, [query]); // query 变化时才重新创建函数

  return (
    <div>
      <button onClick={search}>搜索</button>
      {loading ? (
        <p>加载中...</p>
      ) : (
        <ul>
          {results.map(result => (
            <li key={result.id}>{result.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// 3. 传递给子组件的函数
function Parent() {
  const [count, setCount] = useState(0);

  // 使用 useCallback 避免子组件不必要的重新渲染
  const handleIncrement = useCallback(() => {
    setCount(prevCount => prevCount + 1);
  }, []);

  return (
    <div>
      <p>父组件计数: {count}</p>
      <Child onIncrement={handleIncrement} />
    </div>
  );
}

// 子组件使用 React.memo 优化
const Child = React.memo(function Child({ onIncrement }) {
  console.log('子组件渲染');
  return <button onClick={onIncrement}>增加计数</button>;
});
```
:::

### 8.7 useMemo

:::tip useMemo
- useMemo 用于缓存计算结果
- 避免在每次渲染时进行昂贵的计算
- 接收一个创建函数和依赖项数组
- 依赖项变化时才重新计算
- 主要用于性能优化，避免重复计算
:::

::: details useMemo示例
```jsx
// 1. 基本使用
import React, { useState, useMemo } from 'react';

function ExpensiveCalculation({ a, b }) {
  const [count, setCount] = useState(0);

  // 使用 useMemo 缓存计算结果
  const result = useMemo(() => {
    console.log('进行昂贵的计算...');
    // 模拟昂贵的计算
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += a + b;
    }
    return sum;
  }, [a, b]); // a 或 b 变化时才重新计算

  return (
    <div>
      <p>计算结果: {result}</p>
      <p>计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        增加计数（不会触发重新计算）
      </button>
    </div>
  );
}

// 2. 过滤和排序数据
function UserList({ users, filter }) {
  // 使用 useMemo 缓存过滤和排序结果
  const filteredAndSortedUsers = useMemo(() => {
    console.log('过滤和排序用户...');
    return users
      .filter(user => user.name.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, filter]);

  return (
    <ul>
      {filteredAndSortedUsers.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// 3. 复杂对象的记忆化
function UserProfile({ userId }) {
  const [theme, setTheme] = useState('light');

  // 使用 useMemo 缓存用户配置对象
  const userConfig = useMemo(() => {
    return {
      theme,
      permissions: calculatePermissions(userId),
      preferences: loadPreferences(userId)
    };
  }, [userId, theme]);

  return (
    <div className={userConfig.theme}>
      {/* 使用 userConfig */}
    </div>
  );
}

// 4. 避免重复创建对象
function Component() {
  const [count, setCount] = useState(0);

  // 使用 useMemo 避免每次渲染都创建新对象
  const style = useMemo(() => ({
    color: count > 5 ? 'red' : 'blue',
    fontSize: '16px'
  }), [count]);

  return (
    <div style={style}>
      <p>计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>增加</button>
    </div>
  );
}
```
:::

### 8.8 useRef

:::tip useRef
- useRef 返回一个可变的 ref 对象
- ref 对象的 current 属性可以被修改
- 修改 current 不会触发重新渲染
- 主要用于访问 DOM 元素和存储可变值
- 在整个组件生命周期内保持不变
:::

::: details useRef示例
```jsx
// 1. 访问 DOM 元素
import React, { useRef } from 'react';

function TextInputWithFocusButton() {
  const inputRef = useRef(null);

  const onButtonClick = () => {
    // current 指向挂载到 input 元素上的 DOM 节点
    inputRef.current.focus();
  };

  return (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={onButtonClick}>聚焦输入框</button>
    </div>
  );
}

// 2. 存储可变值
function Timer() {
  const [count, setCount] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCount(prevCount => prevCount + 1);
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
    };
  }, []);

  const stopTimer = () => {
    clearInterval(timerRef.current);
  };

  return (
    <div>
      <p>计时: {count}</p>
      <button onClick={stopTimer}>停止计时</button>
    </div>
  );
}

// 3. 存储上一次的值
function PreviousValue({ value }) {
  const prevValueRef = useRef();

  useEffect(() => {
    prevValueRef.current = value;
  }, [value]);

  return (
    <div>
      <p>当前值: {value}</p>
      <p>上一次的值: {prevValueRef.current}</p>
    </div>
  );
}

// 4. 与第三方库集成
function ChartComponent({ data }) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      // 初始化图表
      chartInstanceRef.current = new Chart(chartRef.current, {
        type: 'bar',
        data: data
      });
    }

    return () => {
      // 清理图表
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [data]);

  return <canvas ref={chartRef} />;
}
```
:::

### 8.9 useImperativeHandle

:::tip useImperativeHandle
- useImperativeHandle 用于自定义暴露给父组件的实例值
- 通常与 forwardRef 一起使用
- 让父组件可以通过 ref 调用子组件的方法
- 控制子组件暴露给父组件的接口
:::

::: details useImperativeHandle示例
```jsx
// 1. 基本使用
import React, { useRef, useImperativeHandle, forwardRef } from 'react';

const CustomInput = forwardRef((props, ref) => {
  const inputRef = useRef();

  // 自定义暴露给父组件的值
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current.focus();
    },
    clear: () => {
      inputRef.current.value = '';
    },
    getValue: () => {
      return inputRef.current.value;
    }
  }));

  return <input ref={inputRef} type="text" {...props} />;
});

function Parent() {
  const inputRef = useRef();

  const handleFocus = () => {
    inputRef.current.focus();
  };

  const handleClear = () => {
    inputRef.current.clear();
  };

  const handleGetValue = () => {
    const value = inputRef.current.getValue();
    alert(`输入框的值: ${value}`);
  };

  return (
    <div>
      <CustomInput ref={inputRef} placeholder="输入内容" />
      <button onClick={handleFocus}>聚焦</button>
      <button onClick={handleClear}>清空</button>
      <button onClick={handleGetValue}>获取值</button>
    </div>
  );
}

// 2. 复杂的子组件接口
const VideoPlayer = forwardRef((props, ref) => {
  const videoRef = useRef();
  const [isPlaying, setIsPlaying] = useState(false);

  useImperativeHandle(ref, () => ({
    play: () => {
      videoRef.current.play();
      setIsPlaying(true);
    },
    pause: () => {
      videoRef.current.pause();
      setIsPlaying(false);
    },
    isPlaying: () => isPlaying,
    getCurrentTime: () => videoRef.current.currentTime,
    setCurrentTime: (time) => {
      videoRef.current.currentTime = time;
    }
  }));

  return (
    <div>
      <video ref={videoRef} src={props.src} />
      <p>{isPlaying ? '播放中' : '已暂停'}</p>
    </div>
  );
});

function VideoApp() {
  const videoRef = useRef();

  const handlePlay = () => {
    videoRef.current.play();
  };

  const handlePause = () => {
    videoRef.current.pause();
  };

  const handleStatus = () => {
    const status = videoRef.current.isPlaying() ? '播放中' : '已暂停';
    alert(`当前状态: ${status}`);
  };

  return (
    <div>
      <VideoPlayer ref={videoRef} src="video.mp4" />
      <button onClick={handlePlay}>播放</button>
      <button onClick={handlePause}>暂停</button>
      <button onClick={handleStatus}>检查状态</button>
    </div>
  );
}
```
:::

### 8.10 useLayoutEffect

:::tip useLayoutEffect
- useLayoutEffect 与 useEffect 类似
- 在所有 DOM 变更之后同步调用
- 会阻塞浏览器的绘制
- 适用于需要读取 DOM 布局并同步触发重绘的情况
- 优先使用 useEffect，只在必要时使用 useLayoutEffect
:::

::: details useLayoutEffect示例
```jsx
// 1. 基本使用
import React, { useState, useLayoutEffect, useRef } from 'react';

function MeasureExample() {
  const [width, setWidth] = useState(0);
  const divRef = useRef();

  useLayoutEffect(() => {
    // 在浏览器绘制之前读取布局信息
    const rect = divRef.current.getBoundingClientRect();
    setWidth(rect.width);
  }, []);

  return (
    <div ref={divRef} style={{ width: '100px', height: '100px' }}>
      Div 宽度: {width}px
    </div>
  );
}

// 2. 同步修改样式
function Tooltip({ text, children }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef();
  const triggerRef = useRef();

  useLayoutEffect(() => {
    if (triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      // 计算工具提示位置
      let left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      let top = triggerRect.top - tooltipRect.height - 10;
      
      // 确保工具提示不超出视窗
      left = Math.max(0, Math.min(left, window.innerWidth - tooltipRect.width));
      top = Math.max(0, top);
      
      setPosition({ top, left });
    }
  }, [text]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div ref={triggerRef} style={{ display: 'inline-block' }}>
        {children}
      </div>
      {text && (
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            backgroundColor: 'black',
            color: 'white',
            padding: '5px',
            borderRadius: '3px',
            fontSize: '14px'
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}

// 3. 动画相关
function SmoothAnimation() {
  const [count, setCount] = useState(0);
  const divRef = useRef();

  useLayoutEffect(() => {
    if (divRef.current) {
      // 同步修改样式，避免闪烁
      divRef.current.style.transform = `translateX(${count * 100}px)`;
    }
  }, [count]);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>移动</button>
      <div
        ref={divRef}
        style={{
          width: '100px',
          height: '100px',
          backgroundColor: 'blue',
          transition: 'transform 0.3s ease'
        }}
      />
    </div>
  );
}
```
:::

### 8.11 useDebugValue

:::tip useDebugValue
- useDebugValue 用于在 React 开发者工具中显示自定义 hook 的标签
- 帮助调试自定义 hook
- 可以接受格式化函数来延迟格式化值
- 主要用于自定义 hook 的开发
:::

::: details useDebugValue示例
```jsx
// 1. 基本使用
import React, { useState, useDebugValue } from 'react';

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 在开发者工具中显示标签
  useDebugValue(isOnline ? '在线' : '离线');

  return isOnline;
}

function StatusIndicator() {
  const isOnline = useOnlineStatus();

  return <div>状态: {isOnline ? '在线' : '离线'}</div>;
}

// 2. 延迟格式化
function useFriendStatus(friendID) {
  const [isOnline, setIsOnline] = useState(null);

  useEffect(() => {
    function handleStatusChange(status) {
      setIsOnline(status.isOnline);
    }

    ChatAPI.subscribeToFriendStatus(friendID, handleStatusChange);
    return () => {
      ChatAPI.unsubscribeFromFriendStatus(friendID, handleStatusChange);
    };
  }, [friendID]);

  // 使用格式化函数延迟计算
  useDebugValue(isOnline, (isOnline) => {
    return isOnline ? '在线' : '离线';
  });

  return isOnline;
}

// 3. 复杂的调试信息
function useTodos() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);

  // 显示多个调试信息
  useDebugValue(`任务数: ${todos.length}, 加载中: ${loading}`);

  const addTodo = (text) => {
    setTodos(prevTodos => [...prevTodos, { id: Date.now(), text, completed: false }]);
  };

  const toggleTodo = (id) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  return { todos, loading, addTodo, toggleTodo };
}

// 4. 自定义 Hook 组合
function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // 显示认证状态
  useDebugValue(user ? `已登录: ${user.name}` : '未登录');

  const login = (username, password) => {
    // 登录逻辑
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return { user, token, login, logout };
}
```
:::

### 8.12 自定义 Hooks

:::tip 自定义Hooks
- 自定义 Hook 是一个函数，其名称以 "use" 开头
- 可以调用其他 Hook
- 用于复用组件间的状态逻辑
- 遵循 Hook 的使用规则
- 让组件逻辑更加模块化和可复用
:::

::: details 自定义Hooks示例
```jsx
// 1. 基本自定义 Hook
import { useState, useEffect } from 'react';

function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(initialValue);

  return { count, increment, decrement, reset };
}

// 使用自定义 Hook
function Counter() {
  const { count, increment, decrement, reset } = useCounter(10);

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={increment}>+1</button>
      <button onClick={decrement}>-1</button>
      <button onClick={reset}>重置</button>
    </div>
  );
}

// 2. 数据获取 Hook
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
}

// 使用数据获取 Hook
function UserList() {
  const { data: users, loading, error } = useFetch('https://api.example.com/users');

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// 3. 本地存储 Hook
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('读取本地存储失败:', error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('写入本地存储失败:', error);
    }
  };

  return [storedValue, setValue];
}

// 使用本地存储 Hook
function App() {
  const [name, setName] = useLocalStorage('userName', '访客');

  return (
    <div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="输入你的名字"
      />
      <p>你好, {name}!</p>
    </div>
  );
}

// 4. 防抖 Hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 使用防抖 Hook
function SearchInput() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm) {
      // 执行搜索
      console.log('搜索:', debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="搜索..."
    />
  );
}

// 5. 权限检查 Hook
function usePermission(permission) {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    // 检查用户权限
    const checkPermission = async () => {
      try {
        const response = await fetch(`/api/check-permission?permission=${permission}`);
        const result = await response.json();
        setHasPermission(result.hasPermission);
      } catch (error) {
        console.error('检查权限失败:', error);
        setHasPermission(false);
      }
    };

    checkPermission();
  }, [permission]);

  return hasPermission;
}

// 使用权限检查 Hook
function AdminPanel() {
  const canEdit = usePermission('edit');
  const canDelete = usePermission('delete');

  return (
    <div>
      <h2>管理面板</h2>
      {canEdit && <button>编辑</button>}
      {canDelete && <button>删除</button>}
    </div>
  );
}
```
:::

## 九、React 16 最佳实践

### 9.1 组件设计原则

:::tip 组件设计
- **单一职责**：每个组件只负责一个功能
- **可复用性**：设计可复用的组件，避免重复代码
- **可组合性**：组件应该易于组合成更复杂的组件
- **可控性**：通过 props 控制组件的行为
:::

### 9.2 性能优化

:::tip 性能优化
- **使用 shouldComponentUpdate**：在类组件中避免不必要的渲染
- **使用 React.memo**：在函数组件中避免不必要的渲染
- **使用 useCallback 和 useMemo**：避免重复创建函数和计算值
- **合理使用 key**：在列表渲染中使用稳定的 key
:::

### 9.3 代码组织

:::tip 代码组织
- **按功能分组**：将相关的组件、样式和逻辑放在一起
- **使用绝对路径**：避免深层级的相对路径导入
- **命名规范**：组件名使用大驼峰命名，文件名使用小驼峰或 kebab-case
- **文件结构**：保持一致的文件结构，便于维护
:::

## 十、总结

React 16 是一个重要的版本，引入了许多关键特性：

1. **Fiber架构**：为异步渲染和并发特性奠定了基础
2. **错误边界**：提高了应用的稳定性
3. **新的生命周期方法**：提供了更安全的状态管理方式
4. **Context API改进**：简化了跨组件数据传递
5. **Hooks**：彻底改变了函数组件的编写方式

掌握React 16的核心概念和语法是学习React的基础，通过本教程的学习，你已经掌握了：

- JSX语法和组件基础
- State和生命周期管理
- 条件渲染和列表渲染
- 表单处理和组件通信
- Hooks的基本使用

这些知识为你进一步学习React 18和其他高级特性打下了坚实的基础。