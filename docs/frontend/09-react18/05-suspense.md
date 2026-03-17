---
title: "Suspense 增强"
category: "前端 · React 18"
tags:
  - React
excerpt: "React 18 对 Suspense 进行了重要增强：在并发模式下支持数据获取、改进了服务端流式渲染，并新增了 SuspenseList 组件用于协调多个异步组件的显示顺序，让加载体验更加流畅可控。"
date: 2026-03-17
---

# Suspense 增强

## 一、Suspense 的演进

`<Suspense>` 在 React 16.6 中首次引入，当时仅支持**代码分割**（`React.lazy`）场景。在 React 18 中，Suspense 得到了全面增强：

| 版本 | Suspense 能力 |
|------|--------------|
| React 16.6 | 仅支持 `React.lazy` 懒加载 |
| React 18 | 支持数据获取、SSR 流式渲染、并发渲染协作 |

::: tip Suspense 的本质
`<Suspense>` 是一个**加载边界**——当其子树中的某个组件"挂起"（抛出 Promise）时，Suspense 捕获这个信号，显示 `fallback`，等 Promise resolve 后再渲染实际内容。
:::

## 二、基础用法：代码分割

代码分割是 Suspense 最常见的用途，配合 `React.lazy` 实现按需加载组件：

::: details 路由级别的代码分割

```jsx{3-6,14-20}
// src/App.jsx
import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// 懒加载页面组件，不会在初始 bundle 中包含这些代码
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

function App() {
  return (
    <Suspense fallback={<PageLoadingSpinner />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </Suspense>
  );
}

// 加载指示器组件
function PageLoadingSpinner() {
  return (
    <div className="page-loading">
      <div className="spinner" />
      <p>页面加载中...</p>
    </div>
  );
}
```

:::

## 三、并发模式下的 Suspense

在 React 18 的并发模式下，Suspense 有一个重要的行为变化：**Transition 期间不会立即切换到 fallback**。

这解决了一个经典的 UI 闪烁问题——当用户快速切换内容时，旧内容会保持可见，直到新内容准备就绪，避免了内容频繁消失-出现的闪烁感。

::: details 并发模式下 Suspense 的行为差异

```jsx{8,14}
// 场景：用户点击 Tab，切换到一个需要异步加载数据的 Tab

// React 17 行为：
// 1. 点击 Tab → 立即显示 Suspense fallback（loading 闪烁）
// 2. 数据加载完成 → 显示新内容

// React 18（并发模式）+ startTransition 行为：
// 1. 点击 Tab → 旧 Tab 内容保持显示（不出现 loading）
// 2. 数据加载完成 → 直接切换到新内容（无闪烁）

function Tabs({ tabId }) {
  const [isPending, startTransition] = useTransition();

  const switchTab = (id) => {
    // 标记为 transition，Suspense 不会立即显示 fallback
    startTransition(() => setTabId(id));
  };

  return (
    <div>
      <TabBar onChange={switchTab} isPending={isPending} />
      <Suspense fallback={<TabSkeleton />}>
        {/* transition 期间，这里仍显示旧 Tab，不切换到 TabSkeleton */}
        <TabContent tabId={tabId} />
      </Suspense>
    </div>
  );
}
```

:::

::: warning 关键行为说明
只有在 `startTransition` 包裹的更新中，Suspense 才会保持旧内容。**普通的 setState 更新**仍会立即切换到 fallback。
:::

## 四、数据获取与 Suspense

React 18 支持将数据获取与 Suspense 结合，但目前官方推荐通过框架（如 Next.js、Remix）或数据获取库（如 React Query、SWR）来实现，而非直接在组件中手写。

### 1. 使用 React Query + Suspense

React Query 5 原生支持 Suspense 模式：

::: details React Query + Suspense 数据获取

```jsx{2,7,15-17}
// src/components/UserDashboard.jsx
import { Suspense } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';

// 组件内直接使用数据，不需要处理 loading 状态
function UserStats({ userId }) {
  // useSuspenseQuery 会在数据未就绪时"挂起"组件
  const { data: stats } = useSuspenseQuery({
    queryKey: ['user-stats', userId],
    queryFn: () => fetch(`/api/users/${userId}/stats`).then(r => r.json()),
  });

  return (
    <div className="stats-grid">
      <StatCard label="订单数" value={stats.orderCount} />
      <StatCard label="收藏数" value={stats.favoriteCount} />
      <StatCard label="积分" value={stats.points} />
    </div>
  );
}

// 父组件用 Suspense 包裹，处理加载状态
function UserDashboard({ userId }) {
  return (
    <div>
      <h1>用户中心</h1>
      <Suspense fallback={<StatsSkeleton />}>
        <UserStats userId={userId} />
      </Suspense>
    </div>
  );
}
```

:::

### 2. 手动实现 Suspense 兼容的数据获取（了解原理）

::: details wrapPromise 工具函数原理

```jsx{3-21}
// 这是一种教学性的写法，了解 Suspense 的工作原理
// 生产环境请使用 React Query / SWR 等成熟方案

function wrapPromise(promise) {
  let status = 'pending';
  let result;

  const suspender = promise.then(
    (data) => { status = 'success'; result = data; },
    (error) => { status = 'error'; result = error; }
  );

  return {
    read() {
      if (status === 'pending') throw suspender;  // 抛出 Promise，触发 Suspense
      if (status === 'error') throw result;        // 抛出 Error，触发 ErrorBoundary
      return result;                               // 返回数据
    },
  };
}

// 使用示例
const userResource = wrapPromise(fetch('/api/user/1').then(r => r.json()));

function UserCard() {
  const user = userResource.read(); // 数据未就绪时会抛出 Promise
  return <div>{user.name}</div>;
}

function App() {
  return (
    <Suspense fallback={<div>加载用户...</div>}>
      <UserCard />
    </Suspense>
  );
}
```

:::

## 五、嵌套 Suspense 与渐进加载

合理嵌套 Suspense 可以实现页面的渐进式加载体验——关键内容先显示，次要内容后加载：

::: details 渐进式加载页面布局

```jsx{8,13,18}
// src/pages/ProductDetailPage.jsx
function ProductDetailPage({ productId }) {
  return (
    <div className="product-detail">
      {/* 商品基本信息：最优先加载，单独一个 Suspense */}
      <Suspense fallback={<ProductInfoSkeleton />}>
        <ProductInfo productId={productId} />
      </Suspense>

      {/* 规格和库存：次优先 */}
      <Suspense fallback={<SpecsSkeleton />}>
        <ProductSpecs productId={productId} />
      </Suspense>

      {/* 评价列表：最后加载，不影响主内容显示 */}
      <Suspense fallback={<ReviewsSkeleton count={3} />}>
        <ProductReviews productId={productId} />
      </Suspense>
    </div>
  );
}
```

:::

::: tip 嵌套 Suspense 的原则
- 将**关键内容**和**次要内容**分开包裹
- fallback 使用**骨架屏**而非 loading 文字，减少布局抖动
- 不要过度嵌套，通常 2-3 层足够
:::

## 六、SuspenseList

`SuspenseList` 是 React 18 提供的实验性组件，用于**协调多个并列 Suspense 组件的显示顺序**，避免内容在不同时间点随机"弹出"。

::: details SuspenseList 使用示例

```jsx{2,7-9}
// 注意：SuspenseList 目前仍是实验性 API
import { Suspense, SuspenseList } from 'react';

function NewsFeed() {
  return (
    // revealOrder="forwards"：按顺序从上到下依次显示，不会乱序弹出
    <SuspenseList revealOrder="forwards" tail="collapsed">
      <Suspense fallback={<ArticleSkeleton />}>
        <FeaturedArticle />
      </Suspense>
      <Suspense fallback={<ArticleSkeleton />}>
        <LatestNews />
      </Suspense>
      <Suspense fallback={<ArticleSkeleton />}>
        <TrendingTopics />
      </Suspense>
    </SuspenseList>
  );
}
```

**`revealOrder` 取值**：
- `"forwards"` —— 从上到下按顺序显示，即使后面的先准备好，也等前面的先显示
- `"backwards"` —— 从下到上按顺序显示
- `"together"` —— 所有内容同时显示（等全部准备好才显示）

**`tail` 取值**：
- `"collapsed"` —— 只显示紧跟在上一个已显示内容后面的那一个 fallback
- `"hidden"` —— 隐藏所有尚未开始加载的 fallback

:::

::: warning SuspenseList 状态
`SuspenseList` 目前仍是实验性 API，在生产环境中谨慎使用，API 可能在未来版本中调整。
:::

## 七、Suspense 与错误处理

Suspense 只处理"加载中"状态，加载**失败**的情况需要配合 `ErrorBoundary`：

::: details Suspense + ErrorBoundary 完整组合

```jsx{4,14-16}
// src/components/AsyncSection.jsx
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="error-state">
      <p>加载失败：{error.message}</p>
      <button onClick={resetErrorBoundary}>重试</button>
    </div>
  );
}

function AsyncSection({ children, skeleton }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={skeleton}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// 使用
function ProductPage({ id }) {
  return (
    <div>
      <AsyncSection skeleton={<ProductInfoSkeleton />}>
        <ProductInfo id={id} />
      </AsyncSection>
      <AsyncSection skeleton={<ReviewsSkeleton />}>
        <ProductReviews id={id} />
      </AsyncSection>
    </div>
  );
}
```

:::

## 八、服务端流式渲染

React 18 的 `renderToPipeableStream` 支持 SSR 场景下的流式输出，Suspense 边界内的内容可以在服务端数据准备好后再流式发送给客户端：

::: details 服务端流式渲染示例

```jsx
// server.js
import { renderToPipeableStream } from 'react-dom/server';

app.get('/', (req, res) => {
  const { pipe } = renderToPipeableStream(
    <App />,
    {
      // 首屏 shell（含 Suspense fallback）准备好时开始发送 HTML
      onShellReady() {
        res.setHeader('Content-Type', 'text/html');
        pipe(res);
      },
      onError(error) {
        console.error(error);
      },
    }
  );
});
```

流式渲染的工作流程：
1. 服务端先发送 HTML shell（包含 Suspense 的 fallback 内容）
2. 客户端开始显示 fallback，同时继续接收 HTML 流
3. 当异步数据就绪后，服务端追加实际内容到流中
4. 客户端接收到新内容，替换对应的 fallback

:::
