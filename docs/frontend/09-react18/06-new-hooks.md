---
title: "新增 Hooks"
category: "前端 · React 18"
tags:
  - React
excerpt: "React 18 新增了 useId、useDeferredValue、useSyncExternalStore、useInsertionEffect 四个 Hooks，分别解决服务端渲染 ID 一致性、并发模式下的性能优化、外部状态同步和动态样式注入等问题。"
date: 2026-03-17
---

# 新增 Hooks

## 一、新 Hooks 总览

React 18 新增了以下四个 Hooks，每个都针对特定的使用场景：

| Hook | 用途 | 主要场景 |
|------|------|----------|
| `useId` | 生成稳定唯一的 ID | 无障碍属性、表单标签关联 |
| `useDeferredValue` | 延迟派生值更新 | 并发优化、搜索过滤 |
| `useSyncExternalStore` | 订阅外部数据源 | 状态管理库、浏览器 API |
| `useInsertionEffect` | DOM 变更前注入样式 | CSS-in-JS 库 |

## 二、useId

`useId` 生成一个在服务端和客户端渲染之间保持稳定一致的唯一 ID。

### 1. 解决的问题

在 SSR（服务端渲染）场景中，如果使用 `Math.random()` 或全局计数器生成 ID，服务端和客户端生成的值会不一致，导致 hydration 错误。`useId` 通过追踪组件在 React 树中的位置来生成 ID，保证两端完全一致。

### 2. 基本用法

::: details useId 表单标签关联示例

```jsx{3,7-10}
// src/components/LoginForm.jsx
import { useId } from 'react';

function LoginForm() {
  const emailId = useId();
  const passwordId = useId();

  return (
    <form>
      <div className="field">
        <label htmlFor={emailId}>邮箱地址</label>
        <input
          id={emailId}
          type="email"
          autoComplete="email"
        />
      </div>
      <div className="field">
        <label htmlFor={passwordId}>密码</label>
        <input
          id={passwordId}
          type="password"
          autoComplete="current-password"
        />
      </div>
    </form>
  );
}
```

:::

### 3. 用于 ARIA 属性

`useId` 非常适合需要关联多个元素的 ARIA 无障碍属性：

::: details useId 用于 ARIA 属性

```jsx{4-5,10,14,17}
// src/components/Accordion.jsx
import { useState, useId } from 'react';

function AccordionItem({ title, children }) {
  const [open, setOpen] = useState(false);
  const headingId = useId();
  const panelId = useId();

  return (
    <div>
      <h3>
        <button
          id={headingId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(v => !v)}
        >
          {title}
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={headingId}
        hidden={!open}
      >
        {children}
      </div>
    </div>
  );
}
```

:::

::: tip useId 生成的格式
`useId` 生成的 ID 格式类似 `:r0:`、`:r1:`，包含冒号（`:`）。这些 ID 不能用作 CSS 选择器（CSS 中冒号有特殊含义），但可以用于 HTML 属性（如 `id`、`htmlFor`、`aria-*`）。
:::

::: warning 不要用于列表 key
`useId` 是组件级别的，每次调用返回的 ID 基于该组件实例。不要将其用于列表项的 `key`，列表 key 应来自数据本身（如数据 ID）。
:::

## 三、useDeferredValue

`useDeferredValue` 接受一个值并返回其"延迟版本"——原始值变化时，延迟版本会等到浏览器空闲再更新，从而让基于该值的昂贵计算不阻塞用户交互。

### 1. 基本用法

::: details useDeferredValue 优化搜索列表渲染

```jsx{5,7-10}
// src/components/SearchResults.jsx
import { useState, useDeferredValue, useMemo } from 'react';

function SearchResults({ items }) {
  const [query, setQuery] = useState('');
  // deferredQuery 的更新会"落后"于 query，让用户输入不卡顿
  const deferredQuery = useDeferredValue(query);

  // 昂贵的过滤计算基于 deferredQuery 而非 query
  const filteredItems = useMemo(() => {
    if (!deferredQuery.trim()) return items;
    return items.filter(item =>
      item.title.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(deferredQuery.toLowerCase())
    );
  }, [items, deferredQuery]);

  // 通过比较判断是否处于"陈旧"状态
  const isStale = query !== deferredQuery;

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="搜索..."
      />
      <div
        style={{
          opacity: isStale ? 0.6 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        <p>共 {filteredItems.length} 条结果</p>
        <ItemList items={filteredItems} />
      </div>
    </div>
  );
}
```

:::

### 2. 与 useTransition 对比

| 维度 | `useTransition` | `useDeferredValue` |
|------|-----------------|-------------------|
| 操作对象 | 状态更新（setState） | 值（任意变量） |
| 适用场景 | 你控制状态触发的地方 | 只有值、不控制触发点 |
| 加载状态 | `isPending` 布尔值 | 手动比较新旧值 |
| 典型用例 | onClick / onChange 中的耗时更新 | 接收 props 的子组件优化 |

## 四、useSyncExternalStore

`useSyncExternalStore` 是专为**订阅外部数据源**设计的 Hook，解决了并发模式下外部状态"撕裂（tearing）"的问题。

### 1. 什么是状态撕裂

并发渲染可能中断和恢复渲染，在两次渲染之间，外部存储的状态可能已经发生变化，导致同一次渲染中不同组件读取到不同版本的数据——这就是"撕裂"。`useSyncExternalStore` 通过同步快照机制解决了这个问题。

### 2. 订阅浏览器原生 API

::: details useSyncExternalStore 订阅网络状态

```jsx{3,6-15}
// src/hooks/useOnlineStatus.js
import { useSyncExternalStore } from 'react';

function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

// 服务端快照（SSR 时调用）
function getServerSnapshot() {
  return true; // 服务端默认在线
}

export function useOnlineStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// 使用
function NetworkBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;
  return (
    <div className="offline-banner">
      当前处于离线状态，数据可能不是最新的
    </div>
  );
}
```

:::

### 3. 自定义状态管理

::: details 用 useSyncExternalStore 构建轻量状态管理

```jsx{3,8-10,14,22}
// src/store/cartStore.js
import { useSyncExternalStore } from 'react';

// 外部 store 的实现
function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    getState: () => state,
    setState: (updater) => {
      state = typeof updater === 'function' ? updater(state) : updater;
      listeners.forEach(listener => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// 创建购物车 store
const cartStore = createStore({ items: [], total: 0 });

// 绑定 Hook
export function useCart() {
  return useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getState,
    () => ({ items: [], total: 0 }) // SSR 初始状态
  );
}

export const cartActions = {
  addItem: (item) => {
    cartStore.setState(state => ({
      items: [...state.items, item],
      total: state.total + item.price,
    }));
  },
  removeItem: (itemId) => {
    cartStore.setState(state => {
      const item = state.items.find(i => i.id === itemId);
      return {
        items: state.items.filter(i => i.id !== itemId),
        total: state.total - (item?.price ?? 0),
      };
    });
  },
};
```

```jsx
// 在组件中使用
function CartButton() {
  const { items, total } = useCart();
  return (
    <button>
      购物车 ({items.length}) — ¥{total.toFixed(2)}
    </button>
  );
}
```

:::

### 4. API 签名说明

```ts
const value = useSyncExternalStore(
  subscribe,        // (callback: () => void) => () => void  订阅函数，返回取消订阅函数
  getSnapshot,      // () => T  返回当前快照（客户端）
  getServerSnapshot // () => T  返回 SSR 快照（可选）
);
```

::: warning 快照必须稳定
`getSnapshot` 每次调用应返回相同的值（或引用相等的对象），除非外部 store 确实发生了变化。否则 React 会陷入无限重渲染循环。
:::

## 五、useInsertionEffect

`useInsertionEffect` 的执行时机在 React 完成 DOM 变更**之前**，比 `useLayoutEffect` 更早。它专为 **CSS-in-JS 库**设计，用于在渲染前注入动态生成的样式，避免样式闪烁。

### 1. 执行时机对比

| Hook | 执行时机 |
|------|----------|
| `useInsertionEffect` | DOM 变更之前（无法读取 DOM） |
| `useLayoutEffect` | DOM 变更之后、浏览器绘制之前 |
| `useEffect` | 浏览器绘制之后 |

### 2. 在 CSS-in-JS 中使用

::: details useInsertionEffect 动态注入样式

```jsx{3,11-22}
// 这是一个简化版的 CSS-in-JS 实现，展示 useInsertionEffect 的用途
import { useInsertionEffect } from 'react';

const insertedRules = new Set();

function injectStyle(rule) {
  if (insertedRules.has(rule)) return;
  insertedRules.add(rule);
  const styleEl = document.createElement('style');
  styleEl.textContent = rule;
  document.head.appendChild(styleEl);
}

function useCSS(styles) {
  // useInsertionEffect 在 DOM 变更前执行，样式先于内容插入
  useInsertionEffect(() => {
    const className = `css-${hashCode(styles)}`;
    injectStyle(`.${className} { ${styles} }`);
  });

  return `css-${hashCode(styles)}`;
}

// 组件使用
function StyledButton({ children, color }) {
  const className = useCSS(`
    background-color: ${color};
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
  `);

  return <button className={className}>{children}</button>;
}
```

:::

::: warning useInsertionEffect 的限制
- 不能读取或修改 DOM（此时 DOM 还未更新）
- 不能调用 `setState`
- 普通应用代码**不应该**使用这个 Hook，它只适合 CSS-in-JS 库的内部实现
:::

## 六、实战：组合使用新 Hooks

以下示例展示了在一个搜索组件中综合使用新 Hooks：

::: details 综合使用 useId + useDeferredValue + useSyncExternalStore

```jsx
// src/components/GlobalSearch.jsx
import { useId, useState, useDeferredValue } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus'; // 基于 useSyncExternalStore
import { useRecentSearches } from '../hooks/useRecentSearches';

function GlobalSearch() {
  const inputId = useId();
  const labelId = useId();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const isOnline = useOnlineStatus();
  const { searches, addSearch } = useRecentSearches();

  const isStale = query !== deferredQuery;

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim() && isOnline) {
      addSearch(query.trim());
      // 跳转到搜索结果页
    }
  };

  return (
    <div role="search" aria-labelledby={labelId}>
      <label id={labelId} htmlFor={inputId}>全站搜索</label>
      <form onSubmit={handleSearch}>
        <input
          id={inputId}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={isOnline ? '搜索商品、品牌...' : '离线模式，仅搜索本地缓存'}
          disabled={!isOnline && query.length === 0}
        />
        <button type="submit" disabled={!query.trim()}>搜索</button>
      </form>

      {/* 搜索建议：使用 deferredQuery，不阻塞输入 */}
      {deferredQuery && (
        <SearchSuggestions
          query={deferredQuery}
          style={{ opacity: isStale ? 0.5 : 1 }}
        />
      )}

      {!query && searches.length > 0 && (
        <RecentSearches searches={searches} onSelect={setQuery} />
      )}
    </div>
  );
}
```

:::
