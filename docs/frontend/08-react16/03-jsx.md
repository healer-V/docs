---
title: "JSX 语法"
category: "前端 · React 16"
tags:
  - React
excerpt: "JSX（JavaScript XML）是 React 的语法扩展，它允许我们在 JavaScript 中写类似 HTML 的代码。JSX 会被编译成 React.createElement() 调用。 在 JSX 中，不能使用 class ..."
---

# JSX 语法

## 一、什么是 JSX？

::: tip JSX 定义
JSX（JavaScript XML）是 React 的语法扩展，它允许我们在 JavaScript 中写类似 HTML 的代码。JSX 会被编译成 `React.createElement()` 调用。
:::

## 二、JSX 基础语法

### 1、基本示例

```jsx
const element = <h1>Hello, World!</h1>;
```

### 2、在 JSX 中使用表达式

```jsx
const name = 'React';
const element = <h1>Hello, {name}!</h1>;

// 可以使用任何 JavaScript 表达式
const element2 = <h1>1 + 1 = {1 + 1}</h1>;
```

### 3、JSX 也是表达式

```jsx
function getGreeting(user) {
  if (user) {
    return <h1>Hello, {user.name}!</h1>;
  }
  return <h1>Hello, Stranger.</h1>;
}
```

## 三、JSX 属性

### 1、使用引号指定字符串字面量

```jsx
const element = <div tabIndex="0"></div>;
```

### 2、使用大括号嵌入 JavaScript 表达式

```jsx
const element = <img src={user.avatarUrl} alt={user.name} />;
```

### 3、注意：className 而不是 class

::: warning 重要提示
在 JSX 中，不能使用 `class` 作为属性名，因为 `class` 是 JavaScript 的保留字。必须使用 `className` 代替。
:::

```jsx
// ❌ 错误
const element = <div class="container"></div>;

// ✅ 正确
const element = <div className="container"></div>;
```

## 四、JSX 中的条件渲染

### 1、使用 if/else

```jsx
function Greeting({ isLoggedIn }) {
  if (isLoggedIn) {
    return <h1>Welcome back!</h1>;
  }
  return <h1>Please sign up.</h1>;
}
```

### 2、使用三元运算符

```jsx
function Greeting({ isLoggedIn }) {
  return (
    <div>
      {isLoggedIn ? (
        <h1>Welcome back!</h1>
      ) : (
        <h1>Please sign up.</h1>
      )}
    </div>
  );
}
```

### 3、使用逻辑 && 运算符
>[!tip] 逻辑 && 运算符的作用
>逻辑 && 运算符在 JSX 中用于条件渲染。当左侧表达式为 `true` 时，返回右侧的 JSX 元素；当左侧为 `false` 时，返回 `false`（React 不会渲染 `false`）。
>
>**工作原理**：
>- `条件 && <元素>` - 如果条件为真，渲染元素；否则不渲染
>- 比三元运算符更简洁，适合只需要"有或无"的场景


```jsx
function Mailbox({ unreadMessages }) {
  return (
    <div>
      <h1>Hello!</h1>
      {/* 只有当 unreadMessages.length > 0 为 true 时，才渲染 h2 元素 */}
      {unreadMessages.length > 0 && (
        <h2>You have {unreadMessages.length} unread messages.</h2>
      )}
    </div>
  );
}
```

::: details 点击查看更多示例

```jsx
// 示例 1：显示加载状态
function Component({ isLoading }) {
  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {!isLoading && <div>Content loaded</div>}
    </div>
  );
}

// 示例 2：显示错误信息
function Form({ error }) {
  return (
    <form>
      <input type="text" />
      {error && <div className="error">{error}</div>}
    </form>
  );
}

// 示例 3：显示用户信息
function UserProfile({ user }) {
  return (
    <div>
      {user && (
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
      )}
    </div>
  );
}
```

:::

>[!warning] 注意事项
>使用逻辑 && 运算符时要注意：
>- 左侧表达式为 `0` 时，会渲染 `0`（因为 0 是 falsy 但会被渲染）
>- 左侧表达式为 `""` 时，不会渲染任何内容
>- 确保左侧表达式返回布尔值，避免意外的渲染

```jsx
// ❌ 错误：如果 count 为 0，会渲染 0
{count && <div>Count: {count}</div>}

// ✅ 正确：明确转换为布尔值
{count > 0 && <div>Count: {count}</div>}
```

## 五、JSX 中的列表渲染

### 1、使用 map() 方法

```jsx
const numbers = [1, 2, 3, 4, 5];
const listItems = numbers.map((number) => (
  <li key={number.toString()}>{number}</li>
));

function NumberList() {
  return <ul>{listItems}</ul>;
}
```

### 2、使用 key 属性

::: warning 重要提示
- key 应该是唯一的
- 不要使用数组索引作为 key（除非列表不会改变）
- key 不会传递给组件，如果需要使用，请用其他 prop 名
:::

```jsx
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}
```

## 六、JSX 中的事件处理

### 1、基本事件处理

```jsx
function Button() {
  function handleClick() {
    alert('Button clicked!');
  }

  return <button onClick={handleClick}>Click me</button>;
}
```

### 2、传递参数

```jsx
function ItemList({ items }) {
  function handleDelete(id) {
    console.log('Delete item:', id);
  }

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          {item.name}
          <button onClick={() => handleDelete(item.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

## 七、JSX 中的样式

### 1、内联样式

```jsx
const divStyle = {
  color: 'blue',
  fontSize: '16px',
  backgroundColor: 'yellow'
};

function StyledDiv() {
  return <div style={divStyle}>Hello, World!</div>;
}
```

### 2、使用 CSS 类

```jsx
function StyledDiv() {
  return <div className="container">Hello, World!</div>;
}
```

## 八、JSX 中的注释

```jsx
function Component() {
  return (
    <div>
      {/* 这是 JSX 中的注释 */}
      <h1>Hello, World!</h1>
      {/* 
        多行注释
        也可以这样写
      */}
    </div>
  );
}
```

## 九、JSX 中的 Fragment

### 1、使用 Fragment 避免额外 DOM 节点

::: tip Fragment 优势
Fragment 允许你返回多个元素而不需要额外的 DOM 节点，这有助于保持 DOM 结构的简洁。
:::

```jsx
function List() {
  return (
    <>
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </>
  );
}

// 或者使用 React.Fragment
function List() {
  return (
    <React.Fragment>
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </React.Fragment>
  );
}
```

## 十、JSX 编译过程

::: details 点击查看编译过程

#### 1.1、JSX 代码

```jsx
const element = (
  <h1 className="greeting">
    Hello, World!
  </h1>
);
```

#### 1.2、编译后的代码

```javascript
const element = React.createElement(
  'h1',
  { className: 'greeting' },
  'Hello, World!'
);
```

:::

## 十一、JSX 注意事项

### 1、JSX 必须有一个根元素

::: warning 常见错误

```jsx
// ❌ 错误
function Component() {
  return (
    <h1>Title</h1>
    <p>Content</p>
  );
}

// ✅ 正确
function Component() {
  return (
    <div>
      <h1>Title</h1>
      <p>Content</p>
    </div>
  );
}
```

:::

### 2、所有标签必须闭合

```jsx
// ❌ 错误
<img src="image.jpg">

// ✅ 正确
<img src="image.jpg" />
```

### 3、使用 camelCase 命名属性

```jsx
// ❌ 错误
<div tabindex="0"></div>

// ✅ 正确
<div tabIndex="0"></div>
```

### 4、防止 XSS 攻击

::: tip 安全性
React 会自动转义内容，防止 XSS 攻击。所有用户输入的内容都会被转义，确保应用的安全性。
:::

```jsx
// React 会自动转义内容，防止 XSS 攻击
const userInput = '<script>alert("XSS")</script>';
const element = <div>{userInput}</div>; // 安全，会被转义
```

## 十二、总结

::: tip 学习建议
JSX 是 React 的核心语法，它让编写 UI 组件变得更加直观和高效。掌握 JSX 语法是学习 React 的基础。
:::
