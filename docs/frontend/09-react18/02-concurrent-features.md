# 并发特性

## 一、什么是并发渲染？

::: tip 并发渲染定义
并发渲染是 React 18 的核心特性，它允许 React 中断渲染工作，处理更高优先级的更新，然后再继续之前的工作。这使得 React 能够保持 UI 的响应性。
:::

## 二、并发渲染的优势

### 1、可中断渲染
- React 可以暂停当前渲染
- 处理紧急更新
- 然后继续之前的工作

### 2、优先级调度
- 紧急更新优先处理
- 非紧急更新可以延迟
- 保持 UI 流畅

### 3、更好的用户体验
- 避免 UI 卡顿
- 保持交互响应
- 渐进式渲染

## 三、并发模式 vs 传统模式

### 1、传统模式（同步渲染）

```jsx
// React 17 及之前：同步渲染
function App() {
  return (
    <div>
      <HeavyComponent /> {/* 阻塞渲染 */}
      <InteractiveComponent /> {/* 必须等待 */}
    </div>
  );
}
```

**问题**：
- 长时间渲染会阻塞 UI
- 用户交互无响应
- 体验差

### 2、并发模式（可中断渲染）

```jsx
// React 18：并发渲染
function App() {
  return (
    <div>
      <Suspense fallback={<Loading />}>
        <HeavyComponent /> {/* 可中断 */}
      </Suspense>
      <InteractiveComponent /> {/* 保持响应 */}
    </div>
  );
}
```

**优势**：
- 渲染可中断
- UI 保持响应
- 体验更好

## 四、使用并发特性

### 1、启用并发模式

```jsx
import { createRoot } from 'react-dom/client';

// 使用 createRoot 自动启用并发模式
const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

### 2、Suspense 与并发

```jsx
import { Suspense } from 'react';

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DataComponent />
    </Suspense>
  );
}

function DataComponent() {
  // 数据获取会触发 Suspense
  const data = use(fetchData());
  return <div>{data}</div>;
}
```

## 五、实际应用示例

### 1、大型列表渲染

```jsx
import { useState, useTransition } from 'react';

function LargeList() {
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState('');

  const handleFilterChange = (e) => {
    // 标记为非紧急更新
    startTransition(() => {
      setFilter(e.target.value);
    });
  };

  return (
    <div>
      <input
        value={filter}
        onChange={handleFilterChange}
        placeholder="搜索..."
      />
      {isPending && <div>搜索中...</div>}
      <FilteredList filter={filter} />
    </div>
  );
}
```

### 2、数据获取

```jsx
import { Suspense } from 'react';
import { use } from 'react'; // React 18 新 API

function UserProfile({ userId }) {
  const user = use(fetchUser(userId));
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<div>加载用户信息...</div>}>
      <UserProfile userId={1} />
    </Suspense>
  );
}
```

### 3、路由切换

```jsx
import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));

function App() {
  return (
    <Suspense fallback={<div>加载页面...</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Suspense>
  );
}
```

## 六、性能优化

### 1、使用 useTransition

```jsx
import { useTransition } from 'react';

function SearchBox() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');

  const handleChange = (e) => {
    setQuery(e.target.value); // 紧急更新
    startTransition(() => {
      // 非紧急更新：搜索过滤
      setFilteredResults(filterResults(e.target.value));
    });
  };

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending && <span>搜索中...</span>}
    </div>
  );
}
```

### 2、使用 useDeferredValue

```jsx
import { useDeferredValue } from 'react';

function SearchResults({ query }) {
  const deferredQuery = useDeferredValue(query);
  
  // deferredQuery 更新会延迟，保持 UI 响应
  const results = useMemo(() => {
    return search(deferredQuery);
  }, [deferredQuery]);

  return <ResultsList results={results} />;
}
```

## 七、并发渲染的限制

### 1、副作用处理
- 某些副作用可能执行多次
- 需要确保副作用是幂等的

### 2、第三方库兼容性
- 某些库可能不兼容并发模式
- 需要检查库的兼容性

### 3、调试复杂性
- 渲染可能被中断和恢复
- 调试可能更复杂

## 八、最佳实践

### 1、使用 Suspense 包装异步组件

```jsx
<Suspense fallback={<Loading />}>
  <AsyncComponent />
</Suspense>
```

### 2、区分紧急和非紧急更新

```jsx
// 紧急更新：用户输入
setInputValue(value);

// 非紧急更新：搜索结果
startTransition(() => {
  setSearchResults(results);
});
```

### 3、使用 useDeferredValue 延迟非关键值

```jsx
const deferredValue = useDeferredValue(value);
```

## 九、总结

并发渲染是 React 18 的核心特性，它通过可中断渲染和优先级调度，显著提升了应用的性能和用户体验。合理使用 useTransition 和 useDeferredValue 可以进一步优化应用性能。
