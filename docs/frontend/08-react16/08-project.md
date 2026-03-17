---
title: "项目实战"
category: "前端 · React 16"
tags:
  - React
excerpt: "我们将构建一个完整的待办事项（Todo）应用，涵盖 React 16 的核心概念。 ✅ 添加待办事项 ✅ 标记完成/未完成 ✅ 删除待办事项 ✅ 筛选待办事项（全部/进行中/已完成） ✅ 本地存储持久化 通过这个项目，我们实践了： ✅ 组件..."
---

# 项目实战

## 一、项目概述

::: tip 项目介绍
我们将构建一个完整的待办事项（Todo）应用，涵盖 React 16 的核心概念。
:::

## 二、项目功能

::: info 功能列表
- ✅ 添加待办事项
- ✅ 标记完成/未完成
- ✅ 删除待办事项
- ✅ 筛选待办事项（全部/进行中/已完成）
- ✅ 本地存储持久化
:::

## 三、项目结构

```
todo-app/
├── src/
│   ├── components/
│   │   ├── TodoForm.jsx
│   │   ├── TodoList.jsx
│   │   ├── TodoItem.jsx
│   │   └── Filter.jsx
│   ├── hooks/
│   │   └── useLocalStorage.js
│   ├── App.jsx
│   └── index.js
├── package.json
└── README.md
```

## 四、完整代码实现

### 1、安装依赖

```bash
npx create-react-app todo-app
cd todo-app
npm install
```

### 2、自定义 Hook - useLocalStorage

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

### 3、TodoItem 组件

```jsx
// src/components/TodoItem.jsx
import React from 'react';

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

### 4、TodoList 组件

```jsx
// src/components/TodoList.jsx
import React from 'react';
import TodoItem from './TodoItem';

function TodoList({ todos, onToggle, onDelete }) {
  if (todos.length === 0) {
    return <div className="empty-state">暂无待办事项</div>;
  }

  return (
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
  );
}

export default TodoList;
```

### 5、TodoForm 组件

```jsx
// src/components/TodoForm.jsx
import React, { useState } from 'react';

function TodoForm({ onAdd }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text.trim());
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="todo-form">
      <input
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

### 6、Filter 组件

```jsx
// src/components/Filter.jsx
import React from 'react';

const filters = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'completed', label: '已完成' },
];

function Filter({ currentFilter, onFilterChange }) {
  return (
    <div className="filter">
      {filters.map(filter => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
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

### 7、App 组件

```jsx
// src/App.jsx
import React, { useState, useMemo } from 'react';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import Filter from './components/Filter';
import useLocalStorage from './hooks/useLocalStorage';
import './App.css';

function App() {
  const [todos, setTodos] = useLocalStorage('todos', []);
  const [filter, setFilter] = useState('all');

  // 添加待办事项
  const handleAdd = (text) => {
    const newTodo = {
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTodos([...todos, newTodo]);
  };

  // 切换完成状态
  const handleToggle = (id) => {
    setTodos(
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // 删除待办事项
  const handleDelete = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // 筛选待办事项
  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter(todo => !todo.completed);
      case 'completed':
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  // 统计信息
  const stats = useMemo(() => {
    return {
      total: todos.length,
      active: todos.filter(todo => !todo.completed).length,
      completed: todos.filter(todo => todo.completed).length,
    };
  }, [todos]);

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">待办事项</h1>
        
        <div className="stats">
          <span>总计: {stats.total}</span>
          <span>进行中: {stats.active}</span>
          <span>已完成: {stats.completed}</span>
        </div>

        <TodoForm onAdd={handleAdd} />
        
        <Filter currentFilter={filter} onFilterChange={setFilter} />
        
        <TodoList
          todos={filteredTodos}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}

export default App;
```

### 8、样式文件

```css
/* src/App.css */
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.container {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.title {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 5px;
}

.stats span {
  font-weight: bold;
  color: #666;
}

.todo-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.todo-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 5px;
  font-size: 16px;
}

.todo-input:focus {
  outline: none;
  border-color: #667eea;
}

.add-btn {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
}

.add-btn:hover {
  background: #5568d3;
}

.filter {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.filter-btn {
  flex: 1;
  padding: 10px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.filter-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.todo-list {
  list-style: none;
  padding: 0;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  margin-bottom: 10px;
  background: #f9f9f9;
  border-radius: 5px;
  transition: all 0.3s;
}

.todo-item:hover {
  background: #f0f0f0;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: #999;
}

.todo-text {
  flex: 1;
  font-size: 16px;
}

.delete-btn {
  padding: 5px 15px;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.delete-btn:hover {
  background: #ff3838;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 18px;
}
```

## 五、错误边界（Error Boundaries）

错误边界是 React 16 引入的类组件特性，用于捕获子组件树中的 JavaScript 错误，防止整个应用崩溃，并渲染降级 UI。

::: warning 错误边界的限制
错误边界**不能**捕获以下错误：
- 事件处理函数中的错误（需用 try/catch）
- 异步代码（setTimeout、Promise）
- 服务端渲染
- 错误边界组件自身的错误
:::

### 1、实现错误边界

::: details 查看错误边界组件实现

```jsx
// src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  // 在渲染出错后更新 state，显示降级 UI
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // 记录错误详情，可上报到监控平台
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // 上报到错误监控服务（如 Sentry）
    console.error('ErrorBoundary caught:', error, errorInfo);
    // reportError(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // 自定义降级 UI
      return (
        <div className="error-boundary">
          <h2>页面出现了一些问题</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={this.handleReset}>重试</button>
          {process.env.NODE_ENV === 'development' && (
            <details>
              <summary>错误详情（仅开发环境可见）</summary>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

:::

### 2、使用错误边界

建议在应用中多层级部署错误边界，粒度越细，错误隔离效果越好：

::: details 查看错误边界部署策略

```jsx
// src/App.jsx
import React from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import Widget from './components/Widget';

function App() {
  return (
    // 顶层兜底：捕获所有未处理的组件错误
    <ErrorBoundary>
      <div className="layout">
        {/* 侧边栏独立错误边界：侧边栏出错不影响主内容 */}
        <ErrorBoundary>
          <Sidebar />
        </ErrorBoundary>

        <main>
          <MainContent />
          {/* 小组件独立错误边界：某个 Widget 崩溃不影响整个 main */}
          <ErrorBoundary>
            <Widget />
          </ErrorBoundary>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
```

:::

## 六、性能优化

### 1、React.memo 避免无效渲染

`React.memo` 是高阶组件，对函数组件进行浅比较，props 未变化时跳过渲染。

::: details 查看 React.memo 使用示例

```jsx
// src/components/TodoItem.jsx
import React, { memo, useCallback } from 'react';

// 包裹后，只有 todo 或回调函数引用变化时才重新渲染
const TodoItem = memo(function TodoItem({ todo, onToggle, onDelete }) {
  console.log(`TodoItem ${todo.id} rendered`);

  return (
    <li className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span>{todo.text}</span>
      <button onClick={() => onDelete(todo.id)}>删除</button>
    </li>
  );
});

export default TodoItem;

// src/App.jsx
function App() {
  const [todos, setTodos] = useState([]);

  // useCallback 保持函数引用稳定，配合 memo 防止子组件重渲染
  const handleToggle = useCallback((id) => {
    setTodos(prev =>
      prev.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo)
    );
  }, []);

  const handleDelete = useCallback((id) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }, []);

  return (
    <ul>
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      ))}
    </ul>
  );
}
```

:::

### 2、代码分割（Code Splitting）

通过 `React.lazy` + `Suspense` 实现按需加载，减少首屏 JavaScript 体积。

::: details 查看代码分割实现

```jsx
// src/App.jsx
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';

// 路由级代码分割：每个页面单独打包为一个 chunk
const Home = lazy(() => import('./pages/Home'));
const ProductList = lazy(() => import('./pages/ProductList'));
// 命名 chunk：便于在构建报告中识别
const Dashboard = lazy(() =>
  import(/* webpackChunkName: "dashboard" */ './pages/Dashboard')
);

// 自定义加载 UI
function PageLoader() {
  return (
    <div className="page-loader">
      <div className="spinner" />
      <p>页面加载中...</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/products" component={ProductList} />
          <Route path="/dashboard" component={Dashboard} />
        </Switch>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
```

:::

::: tip 代码分割最佳实践
- **路由级别**是最推荐的分割粒度，粒度过细会增加请求次数
- 对首屏不需要立即呈现的重型组件（如富文本编辑器、图表库）也可以懒加载
- 配合 `webpackPrefetch`/`webpackPreload` 注释可以预加载下一页资源
:::

## 七、功能扩展

### 1、编辑功能

```jsx
// 在 TodoItem 中添加编辑功能
const [isEditing, setIsEditing] = useState(false);
const [editText, setEditText] = useState(todo.text);

const handleEdit = () => {
  if (isEditing && editText.trim()) {
    onUpdate(todo.id, editText.trim());
  }
  setIsEditing(!isEditing);
};
```

### 2、拖拽排序

```bash
npm install react-beautiful-dnd
```

### 3、分类标签

```jsx
const [categories, setCategories] = useState(['工作', '生活', '学习']);
```

## 八、部署

### 1、构建生产版本

```bash
npm run build
```

### 2、部署到 Vercel

```bash
npm install -g vercel
vercel
```

## 九、总结

::: tip 项目收获
通过这个项目，我们实践了：
- ✅ 组件化开发
- ✅ Hooks 使用（useState, useMemo）
- ✅ 自定义 Hooks
- ✅ 本地存储
- ✅ 状态管理
- ✅ 性能优化

这是一个完整的 React 16 应用示例，涵盖了核心概念和最佳实践。
:::
