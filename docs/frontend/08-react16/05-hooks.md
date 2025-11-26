# Hooks 基础

## 一、什么是 Hooks？

::: tip Hooks 定义
Hooks 是 React 16.8 引入的新特性，它允许你在函数组件中使用 state 和其他 React 特性，而无需编写类组件。
:::

## 二、为什么需要 Hooks？

### 1、类组件的问题

::: info 类组件的局限性
1. **复杂的生命周期逻辑**：相关逻辑分散在不同生命周期方法中
2. **难以复用状态逻辑**：需要使用 HOC 或 Render Props
3. **this 绑定问题**：容易出错
4. **代码冗长**：需要写很多样板代码
:::

### 2、Hooks 的优势

::: tip Hooks 的优势
1. **简化代码**：函数组件更简洁
2. **逻辑复用**：自定义 Hooks 更容易复用
3. **更好的性能**：函数组件性能更好
4. **易于测试**：纯函数更容易测试
:::

## 三、使用 Hooks 的规则

### 1、只在顶层调用 Hooks

::: warning 重要规则
Hooks 必须在组件的顶层调用，不能在条件语句、循环或嵌套函数中调用。
:::

```jsx
// ❌ 错误：在条件语句中调用
function Component() {
  if (condition) {
    const [count, setCount] = useState(0); // 错误！
  }
}

// ✅ 正确：在顶层调用
function Component() {
  const [count, setCount] = useState(0);
  if (condition) {
    // 使用 count
  }
}
```

### 2、只在 React 函数中调用 Hooks

```jsx
// ✅ 正确：在函数组件中
function Component() {
  const [count, setCount] = useState(0);
}

// ✅ 正确：在自定义 Hook 中
function useCustomHook() {
  const [count, setCount] = useState(0);
}

// ❌ 错误：在普通函数中
function regularFunction() {
  const [count, setCount] = useState(0); // 错误！
}
```

## 四、useState

### 1、基本使用

```jsx
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
```

### 2、函数式更新

::: tip 函数式更新
当新的 state 依赖于旧的 state 时，使用函数式更新可以确保获取到最新的 state 值。
:::

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  // 使用函数式更新
  const increment = () => {
    setCount(prevCount => prevCount + 1);
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

### 3、多个 state

```jsx
function Form() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState(0);

  return (
    <form>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="number"
        value={age}
        onChange={(e) => setAge(Number(e.target.value))}
        placeholder="Age"
      />
    </form>
  );
}
```

### 4、对象 state

```jsx
function Form() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: 0
  });

  const handleChange = (field, value) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  return (
    <form>
      <input
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        placeholder="Name"
      />
      <input
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        placeholder="Email"
      />
    </form>
  );
}
```

## 五、useEffect

### 1、基本使用

```jsx
import React, { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 组件挂载或更新时执行
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => setUser(data));
  });

  if (!user) return <div>Loading...</div>;

  return <div>{user.name}</div>;
}
```

### 2、依赖数组

::: tip 依赖数组的作用
依赖数组控制 useEffect 何时执行：
- 空数组 `[]`：只在挂载时执行一次
- 有依赖：依赖变化时执行
- 无数组：每次渲染都执行（不推荐）
:::

```jsx
// 只在挂载时执行一次
useEffect(() => {
  console.log('Component mounted');
}, []); // 空依赖数组

// 当 userId 变化时执行
useEffect(() => {
  fetchUser(userId);
}, [userId]); // 依赖 userId

// 每次渲染都执行（不推荐）
useEffect(() => {
  console.log('Component rendered');
}); // 没有依赖数组
```

### 3、清理函数

::: warning 重要提示
如果 useEffect 返回一个函数，这个函数会在组件卸载时执行，用于清理副作用（如定时器、订阅等）。
:::

```jsx
function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    // 清理函数：组件卸载时执行
    return () => {
      clearInterval(interval);
    };
  }, []);

  return <div>Seconds: {seconds}</div>;
}
```

### 4、多个 useEffect

```jsx
function Component() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');

  // 处理 count 变化
  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);

  // 处理 name 变化
  useEffect(() => {
    console.log('Name changed:', name);
  }, [name]);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      <input value={name} onChange={(e) => setName(e.target.value)} />
    </div>
  );
}
```

## 六、useContext

### 1、基本使用

```jsx
import React, { createContext, useContext } from 'react';

// 创建 Context
const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}

function Toolbar() {
  return <ThemedButton />;
}

function ThemedButton() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Themed Button</button>;
}
```

## 七、useReducer

### 1、基本使用

```jsx
import React, { useReducer } from 'react';

const initialState = { count: 0 };

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    case 'reset':
      return initialState;
    default:
      throw new Error();
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
    </div>
  );
}
```

## 八、useMemo

### 1、基本使用

::: tip 性能优化
useMemo 用于缓存计算结果，只有当依赖项变化时才重新计算，可以优化性能。
:::

```jsx
import React, { useState, useMemo } from 'react';

function ExpensiveComponent({ items }) {
  const [filter, setFilter] = useState('');

  // 只有 items 或 filter 变化时才重新计算
  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);

  return (
    <div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter"
      />
      <ul>
        {filteredItems.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## 九、useCallback

### 1、基本使用

::: tip 性能优化
useCallback 用于缓存函数，只有当依赖项变化时才重新创建函数，可以配合 React.memo 优化子组件渲染。
:::

```jsx
import React, { useState, useCallback } from 'react';

function Parent() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');

  // 只有 count 变化时才重新创建函数
  const handleClick = useCallback(() => {
    setCount(count + 1);
  }, [count]);

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <Child onClick={handleClick} />
    </div>
  );
}

const Child = React.memo(({ onClick }) => {
  console.log('Child rendered');
  return <button onClick={onClick}>Click me</button>;
});
```

## 十、自定义 Hooks

### 1、创建自定义 Hook

::: details 点击查看完整示例

```jsx
// useCounter.js
import { useState } from 'react';

function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(initialValue);

  return { count, increment, decrement, reset };
}

// 使用
function Counter() {
  const { count, increment, decrement, reset } = useCounter(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

:::

### 2、数据获取 Hook

::: details 点击查看完整示例

```jsx
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [url]);

  return { data, loading, error };
}

// 使用
function UserProfile({ userId }) {
  const { data, loading, error } = useFetch(`/api/users/${userId}`);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{data.name}</div>;
}
```

:::

## 十一、总结

::: tip 学习建议
Hooks 让函数组件具备了类组件的所有能力，同时代码更简洁、逻辑更易复用。掌握常用的 Hooks（useState、useEffect、useContext、useReducer、useMemo、useCallback）是学习 React 的关键。
:::
