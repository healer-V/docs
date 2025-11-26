# 状态管理

## 一、什么是状态管理？

::: tip 状态管理定义
状态管理是指在 React 应用中管理和共享组件状态的方式。当应用变得复杂时，组件间的状态共享和同步变得困难，需要专门的状态管理方案。
:::

## 二、状态管理的场景

### 1、本地状态（Local State）

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

**适用场景**：组件内部使用的状态

### 2、提升状态（Lifting State Up）

```jsx
function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <Counter count={count} onIncrement={() => setCount(count + 1)} />
      <Display count={count} />
    </div>
  );
}
```

**适用场景**：需要在兄弟组件间共享状态

### 3、全局状态管理

当状态需要在多个组件间共享，或者应用变得复杂时，需要使用全局状态管理。

## 三、Context API

### 1、基本使用

```jsx
import React, { createContext, useContext, useState } from 'react';

// 创建 Context
const ThemeContext = createContext();

// Provider 组件
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 自定义 Hook
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// 使用
function App() {
  return (
    <ThemeProvider>
      <Header />
      <Main />
    </ThemeProvider>
  );
}

function Header() {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className={theme}>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </header>
  );
}
```

### 2、多个 Context

```jsx
const ThemeContext = createContext();
const UserContext = createContext();

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <Header />
      </UserProvider>
    </ThemeProvider>
  );
}
```

## 四、Redux

### 1、安装

```bash
npm install redux react-redux
```

### 2、基本概念

- **Store**：存储应用状态
- **Action**：描述发生了什么
- **Reducer**：根据 action 更新 state

### 3、基本使用

```jsx
// actions.js
export const increment = () => ({
  type: 'INCREMENT'
});

export const decrement = () => ({
  type: 'DECREMENT'
});

// reducer.js
const initialState = { count: 0 };

function counterReducer(state = initialState, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 };
    case 'DECREMENT':
      return { count: state.count - 1 };
    default:
      return state;
  }
}

export default counterReducer;

// store.js
import { createStore } from 'redux';
import counterReducer from './reducer';

const store = createStore(counterReducer);
export default store;

// App.js
import { Provider } from 'react-redux';
import store from './store';

function App() {
  return (
    <Provider store={store}>
      <Counter />
    </Provider>
  );
}

// Counter.js
import { useSelector, useDispatch } from 'react-redux';
import { increment, decrement } from './actions';

function Counter() {
  const count = useSelector(state => state.count);
  const dispatch = useDispatch();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => dispatch(increment())}>+</button>
      <button onClick={() => dispatch(decrement())}>-</button>
    </div>
  );
}
```

### 4、Redux Toolkit（推荐）

```bash
npm install @reduxjs/toolkit
```

```jsx
// store.js
import { configureStore, createSlice } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { count: 0 },
  reducers: {
    increment: (state) => {
      state.count += 1;
    },
    decrement: (state) => {
      state.count -= 1;
    },
  },
});

export const { increment, decrement } = counterSlice.actions;

const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
  },
});

export default store;

// Counter.js
import { useSelector, useDispatch } from 'react-redux';
import { increment, decrement } from './store';

function Counter() {
  const count = useSelector(state => state.counter.count);
  const dispatch = useDispatch();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => dispatch(increment())}>+</button>
      <button onClick={() => dispatch(decrement())}>-</button>
    </div>
  );
}
```

## 五、Zustand

### 1、安装

```bash
npm install zustand
```

### 2、基本使用

```jsx
import create from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

function Counter() {
  const { count, increment, decrement, reset } = useStore();

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

### 3、选择器优化

```jsx
const useStore = create((set) => ({
  count: 0,
  name: 'John',
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// 只订阅 count，name 变化不会触发重新渲染
function Counter() {
  const count = useStore((state) => state.count);
  const increment = useStore((state) => state.increment);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
    </div>
  );
}
```

## 六、Recoil

### 1、安装

```bash
npm install recoil
```

### 2、基本使用

```jsx
import { RecoilRoot, atom, useRecoilState } from 'recoil';

// 定义 atom
const countState = atom({
  key: 'countState',
  default: 0,
});

function Counter() {
  const [count, setCount] = useRecoilState(countState);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}

function App() {
  return (
    <RecoilRoot>
      <Counter />
    </RecoilRoot>
  );
}
```

## 七、状态管理方案选择

::: info 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **Context API** | 内置，无需安装，简单易用 | 性能问题，不适合频繁更新 | 主题、用户信息等不频繁更新的状态 |
| **Redux** | 功能强大，生态丰富，时间旅行调试 | 样板代码多，学习曲线陡 | 大型应用，需要复杂状态管理 |
| **Zustand** | 轻量级，API 简单，性能好 | 生态相对较小 | 中小型应用，需要简单状态管理 |
| **Recoil** | Facebook 开发，与 React 集成好 | 相对较新，生态还在发展 | 需要细粒度状态管理的应用 |

:::

## 八、实际应用示例

### 1、用户认证状态管理

```jsx
// store/auth.js (Zustand)
import create from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      isAuthenticated: () => {
        const state = useAuthStore.getState();
        return !!state.token;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

// 使用
function Login() {
  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    const { user, token } = await authenticate();
    login(user, token);
  };

  return <button onClick={handleLogin}>Login</button>;
}
```

## 总结

::: tip 选择建议
状态管理是 React 应用开发的重要部分。根据应用规模和需求选择合适的方案：
- **简单应用**：使用 Context API 或本地状态
- **中型应用**：使用 Zustand 或 Recoil
- **大型应用**：使用 Redux 或 Redux Toolkit
:::
