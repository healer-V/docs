---
title: "Automatic Batching"
category: "前端 · React 18"
tags:
  - React
excerpt: "Automatic Batching（自动批处理）是 React 18 的性能优化特性，将多次状态更新自动合并为一次渲染。React 18 将批处理范围从事件处理器扩展到了 setTimeout、Promise、原生事件等所有场景。"
date: 2026-03-17
---

# Automatic Batching

## 一、什么是批处理

**批处理（Batching）**是指 React 将多次 `setState` 调用合并为一次重新渲染的优化机制。减少渲染次数可以降低 DOM 操作开销，提升应用性能。

React 17 及之前已有批处理，但仅限于 React 事件处理器内部。React 18 将其扩展为**自动批处理（Automatic Batching）**，覆盖所有异步场景。

## 二、React 17 批处理的局限

### 1. 事件处理器内部会批处理

::: details React 17 事件处理器批处理

```jsx{6,7}
// React 17：事件处理器内的多次 setState 会被批处理，只触发一次渲染
function Counter() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  function handleClick() {
    setCount(c => c + 1); // 不会立即触发渲染
    setFlag(f => !f);      // 不会立即触发渲染
    // React 在这里批量执行：仅触发一次渲染 ✅
  }

  return <button onClick={handleClick}>Click ({count})</button>;
}
```

:::

### 2. 异步场景下不会批处理

::: details React 17 异步场景不批处理（问题示例）

```jsx{6,7,13,14}
// React 17：setTimeout 内的 setState 不会批处理
function DataLoader() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  function loadData() {
    setTimeout(() => {
      setLoading(false); // 触发第一次渲染 ❌
      setData({ name: '张三', age: 28 }); // 触发第二次渲染 ❌
    }, 1000);
  }

  // Promise 回调也同样不批处理
  async function fetchData() {
    const result = await fetch('/api/user').then(r => r.json());
    setLoading(false); // 触发第一次渲染 ❌
    setData(result);   // 触发第二次渲染 ❌
  }
}
```

:::

## 三、React 18 的自动批处理

React 18 中，**所有场景**下的多次 `setState` 都会被自动批处理，包括：
- React 事件处理器（原有支持）
- `setTimeout` / `setInterval`
- `Promise.then` / `async/await`
- 原生 DOM 事件监听器

### 1. 对比演示

::: details React 17 vs React 18 批处理对比

```jsx
// ======= 场景：Promise 回调中多次 setState =======

// React 17：触发两次渲染
async function handleSave() {
  const result = await saveUser(formData);
  setSaving(false);      // 第 1 次渲染
  setUser(result.user);  // 第 2 次渲染
}

// React 18：自动批处理，只触发一次渲染
async function handleSave() {
  const result = await saveUser(formData);
  setSaving(false);      // 合并
  setUser(result.user);  // 合并 → 第 1 次渲染（共 1 次）
}
```

:::

### 2. 异步数据加载的完整示例

::: details 自动批处理在数据加载中的应用

```jsx{15-18}
// src/components/UserProfile.jsx
import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadUserData() {
      try {
        const [userData, postsData] = await Promise.all([
          fetch(`/api/users/${userId}`).then(r => r.json()),
          fetch(`/api/users/${userId}/posts`).then(r => r.json()),
        ]);

        // React 18：以下 3 次 setState 被自动批处理为 1 次渲染
        setUser(userData);
        setPosts(postsData);
        setLoading(false);
      } catch (err) {
        // 这 2 次 setState 也被批处理
        setError(err.message);
        setLoading(false);
      }
    }

    loadUserData();
  }, [userId]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>加载失败：{error}</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>发帖数：{posts.length}</p>
    </div>
  );
}
```

:::

### 3. 表单提交场景

::: details 表单提交中的自动批处理

```jsx{18-22}
// src/components/RegisterForm.jsx
import { useState } from 'react';

function RegisterForm() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const result = await fetch('/api/register', {
        method: 'POST',
        body: JSON.stringify(form),
        headers: { 'Content-Type': 'application/json' },
      }).then(r => r.json());

      // React 18：以下 3 次 setState 自动合并为 1 次渲染
      setSubmitting(false);
      setSubmitResult({ success: true, message: '注册成功！' });
      setForm({ username: '', email: '', password: '' });
    } catch (err) {
      // 这 2 次也会被批处理
      setSubmitting(false);
      setSubmitResult({ success: false, message: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={form.username}
        onChange={handleChange('username')}
        placeholder="用户名"
      />
      <input
        value={form.email}
        onChange={handleChange('email')}
        placeholder="邮箱"
      />
      <input
        type="password"
        value={form.password}
        onChange={handleChange('password')}
        placeholder="密码"
      />
      <button type="submit" disabled={submitting}>
        {submitting ? '提交中...' : '注册'}
      </button>
      {submitResult && (
        <p style={{ color: submitResult.success ? 'green' : 'red' }}>
          {submitResult.message}
        </p>
      )}
    </form>
  );
}
```

:::

## 四、退出自动批处理：flushSync

大多数情况下你不需要关心批处理，但有时需要在某个 `setState` 后**立即读取 DOM**，此时可以用 `flushSync` 强制同步刷新：

### 1. flushSync 基本用法

::: details flushSync 强制同步更新示例

```jsx{3,12,17}
// src/components/ScrollableList.jsx
import { useState, useRef } from 'react';
import { flushSync } from 'react-dom';

function ScrollableList({ initialItems }) {
  const [items, setItems] = useState(initialItems);
  const listRef = useRef(null);

  const addItemAndScroll = () => {
    const newItem = { id: Date.now(), text: `新条目 ${items.length + 1}` };

    // flushSync 强制 React 同步执行渲染，执行完后 DOM 已更新
    flushSync(() => {
      setItems(prev => [...prev, newItem]);
    });

    // 此时 DOM 已更新，可以安全地读取最新的 scrollHeight
    listRef.current.scrollTop = listRef.current.scrollHeight;
  };

  return (
    <div>
      <button onClick={addItemAndScroll}>添加并滚动到底部</button>
      <ul ref={listRef} style={{ height: 200, overflowY: 'auto' }}>
        {items.map(item => (
          <li key={item.id}>{item.text}</li>
        ))}
      </ul>
    </div>
  );
}
```

:::

### 2. flushSync 的开销

`flushSync` 会强制退出批处理，导致额外的渲染。每次调用 `flushSync` 都会触发一次完整的渲染周期，因此：

::: warning 谨慎使用 flushSync
- 只在真正需要立即读取 DOM 的场景使用
- 避免在循环或频繁触发的事件中调用
- 不要在 `useEffect` 或其他生命周期钩子中调用
:::

## 五、性能影响与最佳实践

### 1. 渲染次数对比

| 场景 | React 17 | React 18 |
|------|----------|----------|
| 事件处理器中 3 次 setState | 1 次渲染 | 1 次渲染 |
| setTimeout 中 3 次 setState | 3 次渲染 | 1 次渲染 |
| Promise 回调中 3 次 setState | 3 次渲染 | 1 次渲染 |
| 原生事件中 3 次 setState | 3 次渲染 | 1 次渲染 |

### 2. 状态设计建议

自动批处理减少了将多个状态合并为一个对象的必要性，但如果多个状态**在语义上总是一起变化**，合并为一个状态对象仍然是好的设计：

::: details 状态设计对比

```jsx
// 方案 A：多个独立状态（React 18 下自动批处理，可接受）
const [loading, setLoading] = useState(false);
const [data, setData] = useState(null);
const [error, setError] = useState(null);

// 方案 B：合并为一个状态对象（语义更清晰，适合关联性强的状态）
const [fetchState, setFetchState] = useState({
  loading: false,
  data: null,
  error: null,
});

// 更新时只需一次 setState
setFetchState({ loading: false, data: result, error: null });
```

:::
