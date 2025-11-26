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

## 五、功能扩展

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

## 六、部署

### 1、构建生产版本

```bash
npm run build
```

### 2、部署到 Vercel

```bash
npm install -g vercel
vercel
```

## 七、总结

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
