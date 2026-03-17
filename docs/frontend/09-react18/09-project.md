---
title: "项目实战"
category: "前端 · React 18"
tags:
  - React
excerpt: "React 18 升级指南与性能优化实践：包含从 React 17 的完整迁移步骤、常见升级问题处理、生产环境性能优化策略，以及 React Server Components 的概念与适用场景介绍。"
date: 2026-03-17
---

# 项目实战

## 一、React 18 升级指南

### 1. 升级前的准备工作

在升级到 React 18 之前，建议先完成以下检查：

- 将项目中所有 `React.FC` 的使用改为显式声明 `children` 类型（TypeScript 项目）
- 检查是否有依赖 `ReactDOM.render` 的第三方库，查看其是否已支持 React 18
- 确认你使用的 CSS-in-JS 库（如 styled-components、Emotion）已升级到 React 18 兼容版本

### 2. 分步升级流程

::: details 第一步：更新依赖

```bash
# 升级 React 和 ReactDOM
npm install react@18 react-dom@18

# TypeScript 项目同步更新类型
npm install @types/react@18 @types/react-dom@18

# 若使用 Create React App
npm install react-scripts@latest
```

:::

::: details 第二步：迁移入口文件

```jsx{5-10}
// src/index.tsx — 修改前（React 17）
import ReactDOM from 'react-dom';
ReactDOM.render(<App />, document.getElementById('root'));

// src/index.tsx — 修改后（React 18）
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

:::

::: details 第三步：处理 TypeScript 类型错误

```tsx
// 错误：Property 'children' does not exist on type 'IntrinsicAttributes & {}'
// 原因：React 18 的 React.FC 不再包含隐式的 children

// 修复方案 A：显式声明 children
interface Props {
  title: string;
  children?: React.ReactNode;
}
const Card: React.FC<Props> = ({ title, children }) => (
  <div>
    <h2>{title}</h2>
    {children}
  </div>
);

// 修复方案 B：不使用 React.FC，直接标注 Props 类型
const Card = ({ title, children }: Props) => (
  <div>
    <h2>{title}</h2>
    {children}
  </div>
);
```

:::

### 3. 常见升级问题处理

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| useEffect 执行两次 | StrictMode 新行为 | 确保 Effect 有正确清理函数 |
| 第三方弹窗闪烁 | 并发渲染批处理变化 | 升级该库或提 issue |
| 状态更新时机不符合预期 | 自动批处理范围扩大 | 需要立即更新时用 `flushSync` |
| `ReactDOM.render` 警告 | API 已废弃 | 迁移到 `createRoot` |
| Context 频繁重渲染 | 并非 React 18 引入，升级后更明显 | 拆分 Context 或使用状态管理库 |

## 二、性能优化实践

### 1. 用 Transition 优化耗时交互

将**非紧急**的状态更新标记为 transition，是 React 18 中最有效的性能优化手段之一：

::: details 大型列表过滤优化

```jsx{8,14-16}
// src/components/InventoryManager.jsx
import { useState, useTransition, useDeferredValue, useMemo } from 'react';

function InventoryManager({ products }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [isPending, startTransition] = useTransition();

  // 将过滤/排序参数的合并计算延迟
  const deferredQuery = useDeferredValue(searchQuery);
  const deferredCategory = useDeferredValue(category);
  const deferredSortBy = useDeferredValue(sortBy);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (deferredQuery) {
      result = result.filter(p =>
        p.name.includes(deferredQuery) || p.sku.includes(deferredQuery)
      );
    }
    if (deferredCategory !== 'all') {
      result = result.filter(p => p.category === deferredCategory);
    }
    result = [...result].sort((a, b) =>
      deferredSortBy === 'price' ? a.price - b.price : a.name.localeCompare(b.name)
    );

    return result;
  }, [products, deferredQuery, deferredCategory, deferredSortBy]);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    // category 本身立即更新（用于按钮高亮），但列表过滤延迟
    startTransition(() => {
      // 触发 deferredCategory 更新
    });
  };

  return (
    <div>
      <input
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="搜索商品或 SKU..."
      />
      <CategoryTabs
        active={category}
        onChange={handleCategoryChange}
        isPending={isPending}
      />
      <SortSelect value={sortBy} onChange={setSortBy} />
      <div style={{ opacity: isPending ? 0.7 : 1 }}>
        <p>共 {filteredProducts.length} 件商品</p>
        <ProductTable products={filteredProducts} />
      </div>
    </div>
  );
}
```

:::

### 2. 组件懒加载策略

::: details 细粒度懒加载配置

```jsx{4-12}
// src/router/routes.jsx
import { lazy, Suspense } from 'react';

// 路由级别：主要页面
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const OrdersPage = lazy(() => import('../pages/OrdersPage'));

// 功能模块级别：大型图表库、富文本编辑器等
const SalesChart = lazy(() =>
  import('../components/SalesChart').then(m => ({
    default: m.SalesChart, // 支持具名导出
  }))
);

// 配合预加载：鼠标悬停时触发预加载
const preloadOrderDetail = () => import('../pages/OrderDetailPage');

function OrderRow({ order }) {
  return (
    <tr
      onMouseEnter={preloadOrderDetail} // 用户意图加载时预取
    >
      <td>{order.id}</td>
      <td>{order.status}</td>
    </tr>
  );
}
```

:::

### 3. 避免 Context 导致的无效重渲染

::: details Context 性能优化方案

```jsx{15-20}
// 问题：一个 Context 包含多种数据，任意字段变化都导致所有消费者重渲染

// 优化方案：按职责拆分 Context
const UserContext = createContext(null);
const ThemeContext = createContext(null);
const NotificationContext = createContext(null);

// 或者使用 useMemo 稳定 Context 值
function AppProviders({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');

  // user 变化不影响 themeValue，themeValue 使用旧引用
  const themeValue = useMemo(
    () => ({ theme, setTheme }),
    [theme]
  );

  const userValue = useMemo(
    () => ({ user, setUser }),
    [user]
  );

  return (
    <UserContext.Provider value={userValue}>
      <ThemeContext.Provider value={themeValue}>
        {children}
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
}
```

:::

### 4. React.memo 与 useCallback 的正确使用

::: details memo 与 useCallback 组合优化

```jsx{3,9,13,22}
// src/components/ProductCard.jsx
import { memo, useCallback } from 'react';

// memo：只有 props 变化时才重渲染
const ProductCard = memo(function ProductCard({ product, onAddToCart, onToggleFavorite }) {
  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>¥{product.price}</p>
      <button onClick={() => onAddToCart(product)}>加入购物车</button>
      <button onClick={() => onToggleFavorite(product.id)}>
        {product.isFavorite ? '取消收藏' : '收藏'}
      </button>
    </div>
  );
});

// 父组件：用 useCallback 稳定回调函数引用，避免破坏 memo 效果
function ProductList({ products }) {
  const { addToCart } = useCartStore();
  const { toggleFavorite } = useFavoriteStore();

  // 这些回调没有依赖变化，引用稳定
  const handleAddToCart = useCallback((product) => {
    addToCart(product);
    showToast(`${product.name} 已加入购物车`);
  }, [addToCart]);

  const handleToggleFavorite = useCallback((id) => {
    toggleFavorite(id);
  }, [toggleFavorite]);

  return (
    <div className="product-grid">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={handleAddToCart}
          onToggleFavorite={handleToggleFavorite}
        />
      ))}
    </div>
  );
}
```

:::

## 三、Server Components 介绍

### 1. 什么是 React Server Components

React Server Components（RSC）是 React 团队提出的新架构，允许部分组件**只在服务端运行**，从而减少发送到客户端的 JavaScript 体积，同时可以直接访问数据库和文件系统。

::: tip 当前状态
RSC 目前主要通过 **Next.js App Router**（13.4+）使用。React 本身提供底层能力，但需要框架层面的集成。直接用 CRA 或 Vite 创建的项目暂不支持 RSC。
:::

### 2. Server Component vs Client Component

| 维度 | Server Component | Client Component |
|------|-----------------|-----------------|
| 运行环境 | 仅服务端 | 客户端（和服务端 SSR） |
| 状态 | 不能用 useState/useEffect | 可以使用所有 Hooks |
| 数据获取 | 直接 async/await | 需要 useEffect 或数据获取库 |
| 交互 | 不支持事件处理 | 支持所有交互 |
| JS 包体积 | 不计入客户端 bundle | 计入客户端 bundle |
| 使用场景 | 数据展示、静态内容 | 交互组件、实时更新 |

### 3. Next.js App Router 中的 Server Components

::: details Server Component 直接查询数据库

```tsx{1-5}
// app/products/page.tsx（默认就是 Server Component）
// 可以直接 async/await，不需要 useEffect
import { db } from '@/lib/db';

export default async function ProductsPage() {
  // 直接在服务端查询数据库，这段代码不会发送到客户端
  const products = await db.product.findMany({
    where: { status: 'active' },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <main>
      <h1>商品列表</h1>
      <div className="product-grid">
        {products.map(product => (
          // ProductCard 是 Server Component，纯展示
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
```

:::

::: details Client Component：交互部分

```tsx{1}
// app/products/AddToCartButton.tsx
'use client'; // 必须标注 'use client' 才能使用 Hooks 和事件

import { useState } from 'react';
import { addToCart } from '@/actions/cart';

export function AddToCartButton({ productId, productName }: { productId: string; productName: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await addToCart(productId);
    setLoading(false);
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? '添加中...' : '加入购物车'}
    </button>
  );
}
```

:::

### 4. RSC 的性能优势

::: details Server Components 减少 bundle 体积的示例

```tsx
// 在 Server Component 中使用重型库，不增加客户端 bundle
import { marked } from 'marked';        // 重型 Markdown 解析库
import hljs from 'highlight.js';        // 代码高亮库
import sanitize from 'isomorphic-dompurify'; // HTML 净化库

// 这些库全部在服务端执行，不发送到客户端
export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);

  // 服务端解析 Markdown，客户端只收到 HTML 字符串
  const htmlContent = sanitize(marked(article.content));

  return (
    <article>
      <h1>{article.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </article>
  );
}
```

:::

## 四、实战项目：电商后台

以下是一个综合运用 React 18 新特性的电商后台项目结构：

::: details 项目结构

```
admin-dashboard/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── AsyncSection.jsx     # Suspense + ErrorBoundary 封装
│   │   │   └── PageTransition.jsx   # useTransition 路由切换
│   │   └── products/
│   │       ├── ProductTable.jsx     # React.memo 优化
│   │       └── ProductSearch.jsx    # useDeferredValue 搜索
│   ├── hooks/
│   │   ├── useOnlineStatus.js       # useSyncExternalStore 示例
│   │   └── useLocalStorage.js
│   ├── store/
│   │   ├── index.js                 # Redux configureStore
│   │   ├── authSlice.js
│   │   └── productsApi.js           # RTK Query
│   ├── router/
│   │   └── index.jsx                # React Router 6 + lazy
│   └── App.jsx
└── package.json
```

:::

::: details 核心 App.jsx

```jsx
// src/App.jsx
import { createRoot } from 'react-dom/client';
import { StrictMode, Suspense } from 'react';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from './store';
import { router } from './router';

function App() {
  return (
    <StrictMode>
      <Provider store={store}>
        {/* Data Router 提供内置的 Suspense 和错误处理 */}
        <RouterProvider router={router} />
      </Provider>
    </StrictMode>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

:::

## 五、升级后的检查清单

完成 React 18 升级后，建议逐项验证以下内容：

- 入口文件已迁移至 `createRoot`
- 所有 `useEffect` 均提供清理函数（StrictMode 双调用验证）
- TypeScript 类型错误（`children` 相关）已全部修复
- 依赖的第三方库均已升级到 React 18 兼容版本
- 性能敏感的大型列表或搜索功能已应用 `useTransition` / `useDeferredValue`
- Suspense 边界已覆盖所有异步组件，并提供合理的 `fallback`
