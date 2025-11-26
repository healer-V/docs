# 状态管理

## 一、React 18 中的状态管理

::: tip 状态管理改进
React 18 的状态管理方案与 React 16 基本相同，但可以更好地利用并发特性和新的 Hooks。
:::

## 二、Context API

### 1、基本使用

```jsx
import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### 2、结合 useTransition

```jsx
import { useTransition } from 'react';

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [isPending, startTransition] = useTransition();

  const toggleTheme = () => {
    startTransition(() => {
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isPending }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

## 三、Zustand

### 1、基本使用

```jsx
import create from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

function Counter() {
  const { count, increment, decrement } = useStore();
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}
```

### 2、结合 useSyncExternalStore

```jsx
import { useSyncExternalStore } from 'react';
import create from 'zustand';

const store = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

function Counter() {
  const count = useSyncExternalStore(
    store.subscribe,
    () => store.getState().count
  );
  const increment = store.getState().increment;

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
    </div>
  );
}
```

## 四、Redux Toolkit

### 1、基本使用

```jsx
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider, useSelector, useDispatch } from 'react-redux';

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

function Counter() {
  const count = useSelector((state) => state.counter.count);
  const dispatch = useDispatch();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => dispatch(increment())}>+</button>
      <button onClick={() => dispatch(decrement())}>-</button>
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <Counter />
    </Provider>
  );
}
```

## 五、使用 useTransition 优化状态更新

### 1、非紧急状态更新

```jsx
import { useTransition } from 'react';
import { useStore } from './store';

function SearchBox() {
  const [isPending, startTransition] = useTransition();
  const { query, setQuery, results, setResults } = useStore();

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value); // 紧急更新
    
    startTransition(() => {
      const filtered = search(value);
      setResults(filtered); // 非紧急更新
    });
  };

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending && <div>搜索中...</div>}
      <ResultsList results={results} />
    </div>
  );
}
```

## 六、使用 useDeferredValue 优化

### 1、延迟值更新

```jsx
import { useDeferredValue } from 'react';
import { useStore } from './store';

function SearchResults() {
  const query = useStore((state) => state.query);
  const deferredQuery = useDeferredValue(query);
  
  const results = useMemo(() => {
    return search(deferredQuery);
  }, [deferredQuery]);

  return <ResultsList results={results} />;
}
```

## 七、实际应用示例

### 1、完整的状态管理方案

```jsx
import { create } from 'zustand';
import { useTransition, useDeferredValue } from 'react';

// 状态管理
const useAppStore = create((set) => ({
  user: null,
  todos: [],
  filter: 'all',
  setUser: (user) => set({ user }),
  addTodo: (todo) => set((state) => ({
    todos: [...state.todos, todo]
  })),
  setFilter: (filter) => set({ filter }),
}));

// 组件
function TodoApp() {
  const { todos, filter, setFilter } = useAppStore();
  const [isPending, startTransition] = useTransition();
  const deferredFilter = useDeferredValue(filter);

  const filteredTodos = useMemo(() => {
    switch (deferredFilter) {
      case 'active':
        return todos.filter(todo => !todo.completed);
      case 'completed':
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  }, [todos, deferredFilter]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter); // 紧急更新
    startTransition(() => {
      // 过滤会在后台进行
    });
  };

  return (
    <div>
      {isPending && <div>过滤中...</div>}
      <FilterButtons filter={filter} onChange={handleFilterChange} />
      <TodoList todos={filteredTodos} />
    </div>
  );
}
```

## 八、总结

React 18 的状态管理可以更好地利用并发特性，通过 useTransition 和 useDeferredValue 优化状态更新，提供更好的用户体验。
