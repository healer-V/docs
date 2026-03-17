---
title: "Transitions"
category: "前端 · React 18"
tags:
  - React
excerpt: "Transitions 是 React 18 区分「紧急更新」与「非紧急更新」的机制。通过 useTransition 和 startTransition，你可以告诉 React 某个状态更新优先级较低，让 React 在处理用户交互时不卡顿。"
date: 2026-03-17
---

# Transitions

## 一、为什么需要 Transitions

在构建搜索、过滤、Tab 切换等功能时，你经常会遇到这样的问题：用户每次输入一个字符，都会触发一次昂贵的重新渲染（如过滤上万条数据），导致输入框卡顿、用户体验变差。

根本原因在于，React 并不知道哪些更新是"用户正在等待立即反馈"的（如输入框显示字符），哪些是"可以稍后处理"的（如搜索结果更新）。Transitions 就是让你**显式区分这两类更新**的机制。

::: tip 两类更新
- **紧急更新（Urgent Update）**：用户直接交互，期望立即看到反馈。如输入框键入、按钮点击视觉反馈。
- **Transition 更新（非紧急）**：UI 状态的切换，允许短暂延迟。如搜索结果列表、Tab 内容切换。
:::

## 二、useTransition

`useTransition` 是一个 Hook，返回 `[isPending, startTransition]` 元组：
- `startTransition(callback)` —— 把 `callback` 中的状态更新标记为低优先级 transition
- `isPending` —— 布尔值，当 transition 仍在处理中时为 `true`

### 1. 基本用法

::: details useTransition 基础示例

```jsx{4,12,15-17}
// src/components/CountryFilter.jsx
import { useState, useTransition } from 'react';

function CountryFilter({ countries }) {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [filtered, setFiltered] = useState(countries);

  const handleChange = (e) => {
    const value = e.target.value;

    // 紧急更新：输入框立即响应，用户看到自己键入的内容
    setQuery(value);

    // Transition：过滤列表不紧急，可以被打断
    startTransition(() => {
      setFiltered(
        countries.filter(c =>
          c.name.toLowerCase().includes(value.toLowerCase())
        )
      );
    });
  };

  return (
    <div>
      <input value={query} onChange={handleChange} placeholder="搜索国家..." />
      {isPending ? (
        <p>筛选中...</p>
      ) : (
        <ul>
          {filtered.map(c => <li key={c.code}>{c.name}</li>)}
        </ul>
      )}
    </div>
  );
}
```

:::

### 2. Tab 切换场景

Tab 切换是 Transitions 最典型的使用场景：切换 Tab 本身需要立即响应（高亮激活状态），但加载 Tab 内容可以稍后完成。

::: details Tab 切换完整实现

```jsx{6,17-21,31-33}
// src/components/ProductTabs.jsx
import { useState, useTransition, memo } from 'react';

const TABS = ['详情', '规格', '评价'];

// 用 memo 包裹昂贵的 Tab 内容，减少无效渲染
const ReviewsPanel = memo(function ReviewsPanel({ productId }) {
  // 假设这里有复杂的计算和大量 DOM
  const reviews = computeReviews(productId); // 耗时操作
  return (
    <ul>
      {reviews.map(r => <li key={r.id}>{r.content}</li>)}
    </ul>
  );
});

function ProductTabs({ productId }) {
  const [activeTab, setActiveTab] = useState(0);
  const [isPending, startTransition] = useTransition();

  const switchTab = (index) => {
    startTransition(() => {
      setActiveTab(index);
    });
  };

  return (
    <div>
      <div role="tablist">
        {TABS.map((tab, index) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === index}
            onClick={() => switchTab(index)}
            // Tab 按钮样式立即切换，不受 isPending 影响
            className={activeTab === index ? 'tab-active' : 'tab'}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* isPending 时降低不透明度，而非完全隐藏，避免闪烁 */}
      <div style={{ opacity: isPending ? 0.6 : 1 }}>
        {activeTab === 0 && <DetailsPanel productId={productId} />}
        {activeTab === 1 && <SpecsPanel productId={productId} />}
        {activeTab === 2 && <ReviewsPanel productId={productId} />}
      </div>
    </div>
  );
}
```

:::

## 三、startTransition（独立函数）

如果你需要在**非组件代码**（如工具函数、路由回调）中标记 transition，可以直接导入 `startTransition` 函数使用，无需 `useTransition` Hook：

::: details startTransition 在路由回调中的使用

```jsx{2,11-13}
// src/components/NavMenu.jsx
import { startTransition } from 'react';
import { useNavigate } from 'react-router-dom';

function NavMenu() {
  const navigate = useNavigate();

  const goTo = (path) => {
    // 路由跳转标记为非紧急，避免在加载新页面时卡住当前页面
    startTransition(() => {
      navigate(path);
    });
  };

  return (
    <nav>
      <button onClick={() => goTo('/products')}>商品列表</button>
      <button onClick={() => goTo('/orders')}>我的订单</button>
      <button onClick={() => goTo('/profile')}>个人中心</button>
    </nav>
  );
}
```

:::

::: warning startTransition 的限制
`startTransition` 的回调必须是**同步**的。如果你在回调中使用了 `await`，`await` 之后的代码将不会被标记为 transition。
:::

## 四、isPending 加载状态的最佳实践

`isPending` 为 `true` 时说明有 transition 正在进行。有几种展示策略：

### 1. 降低透明度（推荐）

在内容上叠加半透明效果，用户知道内容即将更新，但旧内容仍然可读：

```jsx{5}
<div style={{
  opacity: isPending ? 0.6 : 1,
  transition: 'opacity 0.2s',
  pointerEvents: isPending ? 'none' : 'auto'
}}>
  {content}
</div>
```

### 2. 显示独立的加载指示器

适合内容区域较大，或切换内容差异明显的场景：

```jsx{2,4}
{isPending && (
  <div className="transition-spinner">加载中...</div>
)}
<div>{content}</div>
```

### 3. 骨架屏

结合 Suspense 使用，pending 期间展示骨架屏占位：

::: details Transitions + Suspense 组合使用

```jsx{5,15-19}
// src/components/ArticleList.jsx
import { useState, useTransition, Suspense } from 'react';

function ArticleList({ allCategories }) {
  const [category, setCategory] = useState('all');
  const [isPending, startTransition] = useTransition();

  const switchCategory = (cat) => {
    startTransition(() => {
      setCategory(cat);
    });
  };

  return (
    <div>
      <CategoryButtons
        categories={allCategories}
        active={category}
        onChange={switchCategory}
      />
      {/* 当 transition 进行中时，Suspense 的 fallback 不会显示 */}
      {/* 旧内容会保持显示，直到新内容就绪 */}
      <Suspense fallback={<ArticleSkeleton />}>
        <ArticleContent category={category} isPending={isPending} />
      </Suspense>
    </div>
  );
}
```

:::

## 五、使用限制与注意事项

### 1. 不适合标记为 transition 的更新

::: warning 这些场景不应使用 startTransition
- 用户直接输入（`input.value`、`textarea.value`）
- 表单提交的验证反馈
- 按钮点击后的视觉状态（如 active 样式）
- 弹窗/Toast 的显示

这些场景用户期望**立即响应**，标记为 transition 会导致明显的延迟感。
:::

### 2. 不能在 startTransition 中放异步操作

```jsx
// ❌ 错误：await 后的代码不在 transition 中
startTransition(async () => {
  const data = await fetchData();
  setData(data); // 这里不是 transition 更新！
});

// ✅ 正确：先 await，再包裹更新
const data = await fetchData();
startTransition(() => {
  setData(data); // 这里是 transition 更新 ✅
});
```

### 3. transition 的中断行为

如果用户在一个 transition 仍在进行中时触发了新的 transition，React 会丢弃旧的 transition，处理最新的更新。这对搜索场景非常有用：

```jsx
// 用户快速连续输入：React 会跳过中间的搜索，直接处理最新的输入
```

## 六、与 useDeferredValue 的选择

| 场景 | 推荐方案 |
|------|----------|
| 有状态更新的触发点（如 onChange） | `useTransition` |
| 只有值，没有触发点（如从 props 接收） | `useDeferredValue` |
| 需要展示加载状态（isPending） | `useTransition` |
| 优化基于某值的昂贵计算 | `useDeferredValue` |
