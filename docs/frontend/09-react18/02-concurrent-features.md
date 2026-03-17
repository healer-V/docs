---
title: "并发特性"
category: "前端 · React 18"
tags:
  - React
excerpt: "并发渲染是 React 18 的核心基础，它让 React 能够中断正在进行的渲染，优先处理更紧急的更新，再恢复之前的工作。理解可中断渲染与优先级调度是掌握 React 18 所有新特性的关键。"
date: 2026-03-17
---

# 并发特性

## 一、什么是并发渲染

在 React 18 之前，渲染是**同步且不可中断**的——一旦 React 开始渲染组件树，这个过程必须一直运行到结束，中间无法处理任何用户交互或更高优先级的更新。这在渲染复杂 UI 时容易导致卡顿。

React 18 引入的**并发渲染（Concurrent Rendering）**改变了这一模型：React 可以在渲染过程中暂停，去处理更紧急的任务（如用户输入），然后再继续之前中断的渲染工作。

::: tip 并发 ≠ 多线程
JavaScript 仍然是单线程的。并发渲染是通过时间切片（Time Slicing）实现的：React 将渲染工作拆分为小单元，在每个单元之间检查是否有更高优先级的任务需要处理。
:::

## 二、核心概念

### 1. 可中断渲染

React 18 将渲染工作拆分为"工作单元"（fiber），每完成一个工作单元后，React 会检查是否有更紧急的任务。如果有，则暂停当前渲染，处理紧急任务，之后再恢复。

::: details 可中断渲染的工作原理示意

```jsx{6,14}
// 同步模式（React 17）：整棵树必须一次性渲染完成
function App() {
  return (
    <div>
      {/* 假设 HeavyList 包含 10000 个节点，整个渲染会阻塞约 500ms */}
      <HeavyList items={hugeDataSet} />
      {/* 在 HeavyList 渲染期间，用户的任何交互都无法被响应 */}
      <UserInput />
    </div>
  );
}

// 并发模式（React 18）：渲染可以中断
// React 在渲染 HeavyList 的过程中，如果用户点击了按钮，
// React 会暂停 HeavyList 的渲染，先响应用户点击，再继续渲染
```

:::

### 2. 优先级调度

并发渲染的关键是给不同的更新分配优先级。React 18 内部维护了一套优先级系统：

| 优先级 | 场景 | 示例 |
|--------|------|------|
| 最高（Immediate） | 同步需要立即处理 | `flushSync` 包裹的更新 |
| 高（UserBlocking） | 用户交互 | 输入框键入、按钮点击 |
| 普通（Normal） | 默认优先级 | 普通 `setState` |
| 低（Transition） | 非紧急 UI 更新 | `startTransition` 包裹的更新 |
| 最低（Idle） | 后台任务 | 预渲染 |

### 3. 并发特性 API

并发渲染本身是底层机制，开发者通过以下 API 来利用它：

| API | 类型 | 作用 |
|-----|------|------|
| `useTransition` | Hook | 标记状态更新为低优先级 transition |
| `startTransition` | 函数 | 在非组件代码中标记 transition |
| `useDeferredValue` | Hook | 延迟派生值的更新 |
| `<Suspense>` | 组件 | 声明异步内容的加载边界 |

## 三、启用并发模式

将入口从 `ReactDOM.render` 改为 `createRoot` 即可启用并发模式：

::: details 启用并发模式

```jsx{5,8}
// src/index.jsx
import { createRoot } from 'react-dom/client';
import App from './App';

// 使用 createRoot 自动启用并发模式
const root = createRoot(document.getElementById('root'));
root.render(<App />);

// 启用后，所有并发特性（useTransition、useDeferredValue 等）均可使用
```

:::

## 四、useTransition 实战

`useTransition` 是最常用的并发特性 API，它允许你把某个状态更新标记为"不紧急的 transition"，让 React 在用户交互繁忙时可以延迟处理该更新。

### 1. 基本用法

::: details useTransition 搜索过滤示例

```jsx{4,13,16}
// src/components/ProductSearch.jsx
import { useState, useTransition, useMemo } from 'react';

function ProductSearch({ products }) {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [filteredProducts, setFilteredProducts] = useState(products);

  const handleChange = (e) => {
    const value = e.target.value;

    // 紧急更新：立即更新输入框，保证用户看到自己的输入
    setQuery(value);

    // 非紧急更新：过滤大列表，可以被更高优先级任务中断
    startTransition(() => {
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(value.toLowerCase()) ||
        p.category.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredProducts(filtered);
    });
  };

  return (
    <div>
      <input
        value={query}
        onChange={handleChange}
        placeholder="搜索商品名称或分类..."
      />
      {/* isPending 为 true 时说明 transition 还未完成 */}
      {isPending && <span className="loading-hint">筛选中...</span>}
      <ul>
        {filteredProducts.map(product => (
          <li key={product.id}>{product.name} — {product.category}</li>
        ))}
      </ul>
    </div>
  );
}
```

:::

### 2. isPending 的使用

`isPending` 是一个布尔值，表示 transition 是否还在进行中。利用它可以展示加载状态，避免 UI 出现空白期：

::: details 利用 isPending 实现平滑的 Tab 切换

```jsx{5,10,17-19}
// src/components/TabPanel.jsx
import { useState, useTransition } from 'react';

const TAB_CONTENTS = {
  overview: <OverviewTab />,
  reviews: <ReviewsTab />,    // 假设这是一个渲染开销大的组件
  specs: <SpecsTab />,
};

function TabPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isPending, startTransition] = useTransition();

  const switchTab = (tab) => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  return (
    <div>
      <nav>
        {Object.keys(TAB_CONTENTS).map(tab => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            // 当前 tab 仍高亮，不因 isPending 而变灰
            style={{ opacity: isPending ? 0.7 : 1 }}
          >
            {tab}
          </button>
        ))}
      </nav>
      {/* 旧 tab 内容先保持显示，新内容就绪后再切换 */}
      <div style={{ opacity: isPending ? 0.5 : 1 }}>
        {TAB_CONTENTS[activeTab]}
      </div>
    </div>
  );
}
```

:::

## 五、useDeferredValue 实战

`useDeferredValue` 接受一个值，返回该值的"延迟版本"。当原始值频繁变化时，延迟版本会在浏览器空闲时才更新，适合用于衍生计算（而非状态更新本身）。

::: details useDeferredValue 优化搜索结果渲染

```jsx{6,9-11}
// src/components/SearchPage.jsx
import { useState, useDeferredValue, useMemo } from 'react';

function SearchPage({ allItems }) {
  const [query, setQuery] = useState('');
  // deferredQuery 的更新会滞后，但 query 本身立即更新
  const deferredQuery = useDeferredValue(query);

  // 耗时计算基于 deferredQuery，不阻塞输入框响应
  const results = useMemo(() => {
    if (!deferredQuery) return allItems;
    return allItems.filter(item =>
      item.title.toLowerCase().includes(deferredQuery.toLowerCase())
    );
  }, [allItems, deferredQuery]);

  // 可以通过比较 query 和 deferredQuery 判断是否"过时"
  const isStale = query !== deferredQuery;

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="搜索..."
      />
      <div style={{ opacity: isStale ? 0.6 : 1 }}>
        <p>找到 {results.length} 条结果</p>
        <ResultList items={results} />
      </div>
    </div>
  );
}
```

:::

## 六、useTransition 与 useDeferredValue 的对比

| 维度 | `useTransition` | `useDeferredValue` |
|------|-----------------|-------------------|
| 控制粒度 | 控制**状态更新** | 控制**派生值** |
| 使用场景 | 你拥有状态的控制权 | 值来自 props 或无法修改的外部 |
| 加载状态 | 提供 `isPending` | 需自行通过值比较判断 |
| 典型用例 | 按钮触发的耗时更新 | 实时搜索、过滤计算 |

::: tip 如何选择
- 如果你可以在触发更新的地方包裹 `startTransition`，优先用 `useTransition`
- 如果更新来自 props 或外部输入，你只能拿到值而非触发函数，用 `useDeferredValue`
:::

## 七、并发渲染的注意事项

### 1. 副作用可能执行多次

并发模式下，组件可能被渲染多次（包括中断后的重新渲染）。确保你的副作用（`useEffect` 中的逻辑）是幂等的，并提供正确的清理函数。

::: danger 不安全的副作用写法
```jsx
// 危险：没有清理函数，并发中断时可能导致多个定时器并存
useEffect(() => {
  const timer = setInterval(() => fetchData(), 1000);
  // 缺少 return () => clearInterval(timer)
}, []);
```
:::

### 2. startTransition 中不能放异步操作

`startTransition` 的回调必须是同步的，异步操作（如 `await fetch`）不会被标记为 transition：

::: details 正确处理异步 + transition

```jsx{10-14}
// 错误示例：await 之后的更新不在 transition 中
startTransition(async () => {
  const data = await fetchProducts(); // ❌ await 之后的代码不是 transition
  setProducts(data);
});

// 正确示例：先完成异步，再用 startTransition 包裹同步更新
const data = await fetchProducts();
startTransition(() => {
  setProducts(data); // ✅ 这才是真正被标记为 transition 的更新
});
```

:::

### 3. 第三方库兼容性

使用了直接操作 DOM 或不兼容 React 并发模式的第三方库时，可能会出现"撕裂（tearing）"问题。这类库应使用 `useSyncExternalStore` 进行适配。
