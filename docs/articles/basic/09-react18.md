---
title: "React 18 学习笔记"
category: "基础知识"
tags:
  - React
excerpt: "React 18 是 React 的最新主要版本，于 2022 年 3 月发布。这个版本带来了许多新特性和改进，重点是提升用户体验和开发者体验。React 18 引入了并发渲染（Concurrent Rendering）机制，这是自 Rea..."
---

# React 18 学习笔记

## 一、React 18 简介

:::tip 简介
React 18 是 React 的最新主要版本，于 2022 年 3 月发布。这个版本带来了许多新特性和改进，重点是提升用户体验和开发者体验。React 18 引入了并发渲染（Concurrent Rendering）机制，这是自 React 16 引入 Fiber 架构以来最重要的变化。
:::

## 二、React 18 与 React 16 的核心差异

### 2.1 渲染机制对比

| 特性   | React 16       | React 18    |
|------|----------------|-------------|
| 渲染模式 | 同步渲染           | 并发渲染        |
| 渲染控制 | 不可中断           | 可中断、可恢复     |
| 批处理  | 仅在事件处理程序中自动批处理 | 所有状态更新自动批处理 |
| 优先级  | 无优先级概念         | 支持优先级调度     |

:::tip 并发渲染
React 18 的并发渲染允许 React 中断渲染过程，处理更重要的任务，然后再回来继续渲染。这意味着：
- 用户交互可以立即响应，不会被渲染阻塞
- React 可以根据任务重要性分配优先级
- 应用在大量数据渲染时仍保持流畅
:::

### 2.2 新的根节点 API

**React 16 的根节点创建方式：**
```jsx
import ReactDOM from 'react-dom';

ReactDOM.render(<App />, document.getElementById('root'));
```

**React 18 的新方式：**
```jsx
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
```

:::warning 重要变化
React 18 的 `createRoot` API 是启用并发特性的关键。如果继续使用旧的 `ReactDOM.render`，将无法使用 React 18 的新特性。
:::

## 三、React 18 新特性详解

### 3.1 自动批处理 (Automatic Batching)

**React 16:**
```jsx
// 只在事件处理程序中自动批处理
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
  // React 16: 只会重新渲染一次
}

// 在 Promise、setTimeout、原生事件处理程序中不会批处理
function fetchData() {
  fetchData().then(() => {
    setCount(c => c + 1);  // 重新渲染
    setFlag(f => !f);     // 再次重新渲染
  });
}
```

**React 18:**
```jsx
// 所有状态更新都会自动批处理
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
  // React 18: 只会重新渲染一次
}

function fetchData() {
  fetchData().then(() => {
    setCount(c => c + 1);  // 批处理
    setFlag(f => !f);     // 不会立即重新渲染
  });
  // React 18: 只会重新渲染一次
}
```

### 3.2 过渡 (Transitions)

:::tip 过渡概念
过渡允许你将 UI 更新标记为非紧急的，让 React 知道这些更新可以被中断。这对于区分紧急更新（如输入、点击）和非紧急更新（如搜索结果列表）非常有用。
:::

**使用 `startTransition`:**
```jsx
import { startTransition } from 'react';

// 紧急更新：立即响应用户输入
setInputValue(input);

// 标记为过渡：可以延迟更新
startTransition(() => {
  setSearchQuery(input);
});
```

**使用 `useTransition` Hook:**
```jsx
import { useTransition } from 'react';

function SearchPage() {
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState('');

  const handleChange = (e) => {
    // 紧急更新：立即显示输入
    setFilter(e.target.value); 
    
    // 非紧急更新：过渡更新搜索结果
    startTransition(() => {
      setFilterQuery(e.target.value);
    });
  };

  return (
    <div>
      <input type="text" value={filter} onChange={handleChange} />
      {isPending && <p>更新中...</p>}
      <SearchResults query={filterQuery} />
    </div>
  );
}
```

### 3.3 Suspense 改进

**React 16 的 Suspense:**
```jsx
// 主要用于代码分割
<Suspense fallback={<div>Loading...</div>}>
  <LazyComponent />
</Suspense>
```

**React 18 的 Suspense:**
```jsx
// 支持服务器端渲染的 Suspense
<Suspense fallback={<Spinner />}>
  <Comments />
</Suspense>

// 支持并发特性的 Suspense
<Suspense fallback={<Skeleton />}>
  <DetailPage />
</Suspense>
```

:::tip React 18 Suspense 的新能力
1. **并发模式下的 Suspense**：可以更好地处理数据获取和代码分割
2. **服务器端渲染支持**：支持流式 HTML 渲染
3. **选择性水合**：可以优先水合用户交互的区域
:::

### 3.4 新的 Hooks

#### 3.4.1 `useId`

:::tip useId 用途
生成唯一 ID，主要用于需要唯一 ID 的可访问性属性（如 `aria-describedby`），避免服务器和客户端生成的 ID 不匹配。
:::

```jsx
import { useId } from 'react';

function Checkbox() {
  const id = useId();
  return (
    <>
      <label htmlFor={id}>选择选项</label>
      <input id={id} type="checkbox" name="选项" />
    </>
  );
}
```

#### 3.4.2 `useDeferredValue`

:::tip useDeferredValue 用途
延迟更新 UI 的某些部分，允许你推迟非紧急的更新，保持关键交互的响应性。
:::

```jsx
import { useDeferredValue, useState } from 'react';

function SearchResults({ query }) {
  const deferredQuery = useDeferredValue(query);
  
  // 使用延迟值进行搜索
  const results = useMemo(() => {
    return searchResults(deferredQuery);
  }, [deferredQuery]);

  return (
    <ul>
      {results.map(result => (
        <li key={result.id}>{result.title}</li>
      ))}
    </ul>
  );
}
```

#### 3.4.3 `useSyncExternalStore`

:::tip useSyncExternalStore 用途
用于订阅外部数据源，确保在并发渲染下数据的一致性。主要用于库的作者，而不是普通应用开发。
:::

```jsx
import { useSyncExternalStore } from 'react';

function useOnlineStatus() {
  return useSyncExternalStore(
    (callback) => {
      // 订阅函数
      window.addEventListener('online', callback);
      window.addEventListener('offline', callback);
      return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
      };
    },
    () => navigator.onLine, // 获取当前值的函数
    () => true // 服务器端渲染时的值
  );
}

function OnlineStatus() {
  const isOnline = useOnlineStatus();
  return <h1>{isOnline ? '✅ 在线' : '❌ 离线'}</h1>;
}
```

#### 3.4.4 `useInsertionEffect`

:::tip useInsertionEffect 用途
主要用于 CSS-in-JS 库，在 DOM 更新之前同步注入样式。这个 Hook 在浏览器绘制之前运行，可以避免布局抖动。
:::

```jsx
import { useInsertionEffect } from 'react';

function useCSS(rule) {
  useInsertionEffect(() => {
    // 在 DOM 更新之前注入样式
    const style = document.createElement('style');
    style.innerHTML = rule;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [rule]);
}
```

## 四、React 18 严格模式的变化

React 18 的严格模式引入了新的开发行为，帮助开发者发现潜在问题：

### 4.1 双重挂载组件

:::tip 双重挂载目的
React 18 严格模式会故意挂载、卸载、再挂载组件，以确保组件能够正确处理多次挂载和卸载的情况，为未来的可复用组件特性做准备。
:::

**示例：**
```jsx
// 开发模式下，React 18 会：
// 1. 挂载组件
// 2. 立即卸载组件
// 3. 再次挂载组件

function MyComponent() {
  useEffect(() => {
    console.log('组件挂载');
    return () => {
      console.log('组件卸载');
    };
  }, []);
  
  // 开发模式下会看到：
  // "组件挂载"
  // "组件卸载"
  // "组件挂载"
}
```

### 4.2 useEffect 检查

严格模式会检查 `useEffect` 是否正确清理副作用，避免内存泄漏。

## 五、React 18 最佳实践

### 5.1 迁移到 React 18

1. **更新依赖：**
```bash
npm install react@18 react-dom@18
```

2. **更新根节点 API：**
```jsx
// 旧方式
ReactDOM.render(<App />, container);

// 新方式
const root = createRoot(container);
root.render(<App />);
```

3. **移除 UNSAFE_ 生命周期方法：**
```jsx
// 替换 UNSAFE_componentWillMount
function Example() {
  useEffect(() => {
    // 组件挂载逻辑
  }, []);
}

// 替换 UNSAFE_componentWillReceiveProps
function Example({ data }) {
  useEffect(() => {
    // props 更新逻辑
  }, [data]);
}
```

### 5.2 使用并发特性

**识别紧急和非紧急更新：**
```jsx
function Typeahead() {
  const [value, setValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    // 紧急更新：立即更新输入框
    setValue(e.target.value);
    
    // 非紧急更新：延迟搜索
    startTransition(() => {
      setSearchQuery(e.target.value);
    });
  };

  return (
    <div>
      <input value={value} onChange={handleChange} />
      {isPending && <Spinner />}
      <Results query={searchQuery} />
    </div>
  );
}
```

### 5.3 性能优化策略

1. **使用过渡优化列表渲染：**
```jsx
function BigList({ items }) {
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState('');

  const updateFilter = (value) => {
    // 立即更新输入
    setFilter(value);
    
    // 过渡更新列表
    startTransition(() => {
      setFilter(value);
    });
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);

  return (
    <div>
      <input 
        type="text" 
        value={filter} 
        onChange={(e) => updateFilter(e.target.value)} 
      />
      {isPending && <div>更新中...</div>}
      <ul>
        {filteredItems.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

2. **使用 useDeferredValue 优化搜索：**
```jsx
function SearchComponent() {
  const [inputValue, setInputValue] = useState('');
  const deferredValue = useDeferredValue(inputValue);
  
  // 使用延迟值进行昂贵的计算
  const filteredList = useMemo(() => {
    return bigList.filter(item => 
      item.includes(deferredValue)
    );
  }, [deferredValue]);

  return (
    <div>
      <input 
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        list={filteredList}
      />
    </div>
  );
}
```

## 六、React 16 到 React 18 的迁移指南

### 6.1 必要的更改

1. **更新 package.json：**
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

2. **更新渲染 API：**
```jsx
// 替换所有 ReactDOM.render 调用
// 旧代码
ReactDOM.render(<App />, document.getElementById('root'));

// 新代码
const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

3. **卸载根节点：**
```jsx
// 旧方式
ReactDOM.unmountComponentAtNode(container);

// 新方式
root.unmount();
```

### 6.2 可选的改进

1. **使用自动批处理：**
```jsx
// React 16 中需要手动批处理
function handleClick() {
  unstable_batchedUpdates(() => {
    setCount(c => c + 1);
    setFlag(f => !f);
  });
}

// React 18 中自动批处理
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
}
```

2. **添加并发特性：**
```jsx
// 使用过渡优化用户体验
function App() {
  const [isPending, startTransition] = useTransition();
  const [resource, setResource] = useState(initialResource);

  return (
    <div>
      <button 
        onClick={() => {
          startTransition(() => {
            const nextResource = fetchResource();
            setResource(nextResource);
          });
        }}
        disabled={isPending}
      >
        {isPending ? '加载中...' : '下一个'}
      </button>
      <Suspense fallback={<Spinner />}>
        <ResourceComponent resource={resource} />
      </Suspense>
    </div>
  );
}
```

## 七、React 18 与 React 16 的性能对比

### 7.1 渲染性能

| 场景 | React 16 | React 18 |
|------|----------|----------|
| 大列表渲染 | 可能阻塞主线程 | 可中断，保持响应 |
| 多状态更新 | 部分批处理 | 全自动批处理 |
| 用户输入响应 | 可能延迟 | 优先处理，即时响应 |

### 7.2 内存使用

- **React 16**: 每个更新周期完整执行，内存使用较稳定
- **React 18**: 并发特性可能增加内存使用，但通过可中断渲染减少峰值内存使用

### 7.3 开发体验

- **React 16**: 成熟稳定，文档丰富
- **React 18**: 新特性需要学习，但提供更好的开发工具和错误提示

## 八、总结

React 18 是一个重要的里程碑版本，引入了并发渲染机制，彻底改变了 React 的渲染方式。主要改进包括：

1. **并发渲染**：可中断的渲染过程，提升用户体验
2. **自动批处理**：减少不必要的重新渲染
3. **过渡机制**：区分紧急和非紧急更新
4. **新的 Hooks**：提供更强大的状态管理和副作用处理能力
5. **改进的 Suspense**：更好的数据获取和代码分割体验

对于开发者来说，迁移到 React 18 需要一些工作，但带来的性能和用户体验提升是显著的。建议逐步迁移，先更新 API，然后逐步采用并发特性，最终充分利用 React 18 的全部功能。