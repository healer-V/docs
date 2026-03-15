---
title: "项目实战"
category: "前端 · React 18"
tags:
  - React
excerpt: "我们将构建一个使用 React 18 新特性的待办事项应用，展示并发渲染、Suspense、useTransition 等新特性的实际应用。 ✅ 添加待办事项 ✅ 标记完成/未完成 ✅ 删除待办事项 ✅ 搜索过滤（使用 useTransit..."
---

# 项目实战

## 一、项目概述

::: tip 项目介绍
我们将构建一个使用 React 18 新特性的待办事项应用，展示并发渲染、Suspense、useTransition 等新特性的实际应用。
:::

## 二、项目功能

- ✅ 添加待办事项
- ✅ 标记完成/未完成
- ✅ 删除待办事项
- ✅ 搜索过滤（使用 useTransition）
- ✅ 延迟搜索（使用 useDeferredValue）
- ✅ 路由懒加载（使用 Suspense）
- ✅ 本地存储持久化

## 三、项目结构

```
todo-app-react18/
├── src/
│   ├── components/
│   │   ├── TodoForm.jsx
│   │   ├── TodoList.jsx
│   │   ├── TodoItem.jsx
│   │   ├── SearchBox.jsx
│   │   └── Filter.jsx
│   ├── hooks/
│   │   ├── useLocalStorage.js
│   │   └── useTodos.js
│   ├── pages/
│   │   ├── Home.jsx
│   │   └── About.jsx
│   ├── App.jsx
│   └── index.js
├── package.json
└── README.md
```

## 四、完整代码实现

### 1、安装依赖

```bash
npx create-react-app todo-app-react18
cd todo-app-react18
npm install react-router-dom
```

### 2、自定义 Hooks

```jsx
// src/hooks/useLocalStorage.js
import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

export default useLocalStorage;
```

```jsx
// src/hooks/useTodos.js
import { useState, useTransition, useDeferredValue, useMemo } from 'react';
import useLocalStorage from './useLocalStorage';

function useTodos() {
  const [todos, setTodos] = useLocalStorage('todos', []);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredTodos = useMemo(() => {
    let result = todos;

    // 应用搜索过滤
    if (deferredSearchQuery) {
      result = result.filter(todo =>
        todo.text.toLowerCase().includes(deferredSearchQuery.toLowerCase())
      );
    }

    // 应用状态过滤
    switch (filter) {
      case 'active':
        result = result.filter(todo => !todo.completed);
        break;
      case 'completed':
        result = result.filter(todo => todo.completed);
        break;
      default:
        break;
    }

    return result;
  }, [todos, filter, deferredSearchQuery]);

  const addTodo = (text) => {
    const newTodo = {
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTodos(prev => [...prev, newTodo]);
  };

  const toggleTodo = (id) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    startTransition(() => {
      // 过滤会在后台进行
    });
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    startTransition(() => {
      // 搜索会在后台进行
    });
  };

  return {
    todos: filteredTodos,
    allTodos: todos,
    filter,
    searchQuery,
    isPending,
    addTodo,
    toggleTodo,
    deleteTodo,
    handleFilterChange,
    handleSearchChange,
  };
}

export default useTodos;
```

### 3. 组件实现

```jsx
// src/components/SearchBox.jsx
import { useId } from 'react';

function SearchBox({ value, onChange, isPending }) {
  const id = useId();
  const htmlId = id.replace(/:/g, '-');

  return (
    <div className="search-box">
      <label htmlFor={htmlId}>搜索</label>
      <input
        id={htmlId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="搜索待办事项..."
        className="search-input"
      />
      {isPending && <span className="search-indicator">搜索中...</span>}
    </div>
  );
}

export default SearchBox;
```

```jsx
// src/components/TodoForm.jsx
import { useId } from 'react';

function TodoForm({ onAdd }) {
  const [text, setText] = useState('');
  const id = useId();
  const htmlId = id.replace(/:/g, '-');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text.trim());
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="todo-form">
      <label htmlFor={htmlId}>添加待办</label>
      <input
        id={htmlId}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="添加新的待办事项..."
        className="todo-input"
      />
      <button type="submit" className="add-btn">添加</button>
    </form>
  );
}

export default TodoForm;
```

```jsx
// src/components/TodoItem.jsx
function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <li className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span className="todo-text">{todo.text}</span>
      <button onClick={() => onDelete(todo.id)} className="delete-btn">
        删除
      </button>
    </li>
  );
}

export default TodoItem;
```

```jsx
// src/components/TodoList.jsx
import { Suspense } from 'react';
import TodoItem from './TodoItem';

function TodoList({ todos, onToggle, onDelete }) {
  if (todos.length === 0) {
    return <div className="empty-state">暂无待办事项</div>;
  }

  return (
    <Suspense fallback={<div>加载中...</div>}>
      <ul className="todo-list">
        {todos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </Suspense>
  );
}

export default TodoList;
```

```jsx
// src/components/Filter.jsx
import { useTransition } from 'react';

const filters = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'completed', label: '已完成' },
];

function Filter({ currentFilter, onFilterChange }) {
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (filter) => {
    startTransition(() => {
      onFilterChange(filter);
    });
  };

  return (
    <div className="filter">
      {isPending && <div className="filter-loading">过滤中...</div>}
      {filters.map(filter => (
        <button
          key={filter.key}
          onClick={() => handleFilterChange(filter.key)}
          className={`filter-btn ${currentFilter === filter.key ? 'active' : ''}`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

export default Filter;
```

### 4. 主应用组件

```jsx
// src/App.jsx
import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useTodos from './hooks/useTodos';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import SearchBox from './components/SearchBox';
import Filter from './components/Filter';
import './App.css';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));

function TodoApp() {
  const {
    todos,
    allTodos,
    filter,
    searchQuery,
    isPending,
    addTodo,
    toggleTodo,
    deleteTodo,
    handleFilterChange,
    handleSearchChange,
  } = useTodos();

  const stats = {
    total: allTodos.length,
    active: allTodos.filter(todo => !todo.completed).length,
    completed: allTodos.filter(todo => todo.completed).length,
  };

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">待办事项 (React 18)</h1>
        
        <div className="stats">
          <span>总计: {stats.total}</span>
          <span>进行中: {stats.active}</span>
          <span>已完成: {stats.completed}</span>
        </div>

        <TodoForm onAdd={addTodo} />
        
        <SearchBox
          value={searchQuery}
          onChange={handleSearchChange}
          isPending={isPending}
        />
        
        <Filter currentFilter={filter} onFilterChange={handleFilterChange} />
        
        <TodoList
          todos={todos}
          onToggle={toggleTodo}
          onDelete={deleteTodo}
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>加载应用...</div>}>
        <Routes>
          <Route path="/" element={<TodoApp />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
```

### 5. 页面组件

```jsx
// src/pages/Home.jsx
function Home() {
  return <div>Home Page</div>;
}

export default Home;
```

```jsx
// src/pages/About.jsx
function About() {
  return <div>About Page</div>;
}

export default About;
```

## React 18 特性应用

### 1. useTransition
- 搜索和过滤使用 useTransition
- 保持 UI 响应性

### 2. useDeferredValue
- 搜索查询使用 useDeferredValue
- 延迟搜索计算

### 3. Suspense
- 路由懒加载
- 组件加载状态

### 4. useId
- 表单标签关联
- 无障碍支持

## 总结

这个项目展示了 React 18 的核心特性：
- ✅ 并发渲染
- ✅ 自动批处理
- ✅ useTransition
- ✅ useDeferredValue
- ✅ Suspense
- ✅ useId

通过这些特性，我们构建了一个高性能、用户体验良好的待办事项应用。
