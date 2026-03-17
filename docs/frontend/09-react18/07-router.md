---
title: "路由配置"
category: "前端 · React 18"
tags:
  - React
  - React Router
excerpt: "React Router 6 是目前 React 应用的标准路由方案，引入了 Routes/Route 新 API、Outlet 嵌套路由和 Data Router 数据加载模式。结合 React 18 的 Suspense 与 useTransition，可以实现流畅无闪烁的路由切换体验。"
date: 2026-03-17
---

# 路由配置

## 一、React Router 6 核心变化

React Router 6 相比 v5 有较大的 API 调整，主要变化如下：

| 特性 | React Router 5 | React Router 6 |
|------|----------------|----------------|
| 路由匹配 | `<Switch>` | `<Routes>`（精确匹配，无需 `exact`） |
| 路由定义 | `<Route component={Page} />` | `<Route element={<Page />} />` |
| 嵌套路由 | 在子组件中再写 `<Route>` | 在父路由中定义，用 `<Outlet>` 渲染子内容 |
| 编程导航 | `useHistory().push()` | `useNavigate()` |
| 路由参数 | `useParams()` | `useParams()`（相同） |
| 数据加载 | 组件内 `useEffect` 请求 | `loader` 函数（Data Router） |

## 二、基本安装与配置

::: code-group
```bash [npm]
npm install react-router-dom
```
```bash [pnpm]
pnpm add react-router-dom
```
:::

## 三、基础路由配置

### 1. 简单路由

::: details 基础路由配置示例

```jsx{4-12}
// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';

const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          {/* 重定向 */}
          <Route path="/home" element={<Navigate to="/" replace />} />
          {/* 404 页面 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

:::

### 2. 嵌套路由与 Outlet

`<Outlet>` 是 React Router 6 的核心概念，用于在父路由组件中渲染子路由的内容：

::: details 嵌套路由 + Outlet 示例

```jsx{8-12,25}
// src/App.jsx —— 路由配置
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout 路由：包含导航栏、侧边栏等公共 UI */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="orders" element={<OrdersPage />} />
          {/* 嵌套的后台路由 */}
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="login" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

// src/layouts/MainLayout.jsx —— 父路由组件
import { Outlet } from 'react-router-dom';

function MainLayout() {
  return (
    <div className="app-layout">
      <Header />
      <aside className="sidebar">
        <SideNav />
      </aside>
      <main className="main-content">
        {/* 子路由的内容在这里渲染 */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
```

:::

## 四、useNavigate 编程导航

### 1. 基本导航

::: details useNavigate 常见用法

```jsx{2,5,14-19}
// src/components/LoginForm.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  // 登录后跳转到来源页，若无来源则跳首页
  const from = location.state?.from?.pathname ?? '/';

  const handleLogin = async (credentials) => {
    setLoading(true);
    try {
      await authService.login(credentials);
      navigate(from, { replace: true }); // replace 避免用户点返回回到登录页
    } catch (err) {
      setLoading(false);
      showError(err.message);
    }
  };

  return (
    <form onSubmit={e => {
      e.preventDefault();
      handleLogin({ email: e.target.email.value, password: e.target.password.value });
    }}>
      <input name="email" type="email" placeholder="邮箱" />
      <input name="password" type="password" placeholder="密码" />
      <button type="submit" disabled={loading}>
        {loading ? '登录中...' : '登录'}
      </button>
    </form>
  );
}
```

:::

### 2. 结合 useTransition 实现平滑路由切换

::: details useTransition + useNavigate 平滑切换

```jsx{4,10-14}
// src/components/Navigation.jsx
import { useNavigate } from 'react-router-dom';
import { useTransition } from 'react';

function Navigation() {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();

  const goTo = (path) => {
    // 将导航标记为低优先级，避免路由切换卡住当前页面
    startTransition(() => {
      navigate(path);
    });
  };

  return (
    <nav>
      {isPending && <div className="nav-loading-bar" />}
      <ul>
        {[
          { path: '/', label: '首页' },
          { path: '/products', label: '商品' },
          { path: '/orders', label: '订单' },
          { path: '/profile', label: '个人中心' },
        ].map(({ path, label }) => (
          <li key={path}>
            <button onClick={() => goTo(path)}>{label}</button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

:::

## 五、路由守卫

### 1. 认证守卫

::: details 受保护路由的实现

```jsx{9-14,22-28}
// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children, requiredRole }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // 未登录：跳转到登录页，并记录当前路径
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 已登录但权限不足
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}

// 在路由配置中使用
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route
            path="orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/*"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminRoutes />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

:::

## 六、Data Router 与 loader

React Router 6.4+ 引入了 Data Router 模式，允许在路由配置中定义 `loader` 函数，在渲染组件之前预先加载数据：

### 1. createBrowserRouter 配置

::: details Data Router + loader 数据预加载

```jsx{6,16-23,29,36}
// src/router.jsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// loader 函数：在路由激活时自动执行，数据准备好才渲染组件
async function productLoader({ params }) {
  const product = await fetch(`/api/products/${params.id}`).then(r => {
    if (!r.ok) throw new Response('商品不存在', { status: 404 });
    return r.json();
  });
  return product;
}

async function productsLoader({ request }) {
  const url = new URL(request.url);
  const page = url.searchParams.get('page') ?? '1';
  const products = await fetch(`/api/products?page=${page}`).then(r => r.json());
  return products;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'products',
        element: <ProductsPage />,
        loader: productsLoader,
      },
      {
        path: 'products/:id',
        element: <ProductDetailPage />,
        loader: productLoader,
        errorElement: <ProductErrorPage />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
```

:::

### 2. 在组件中使用 useLoaderData

::: details 组件中消费 loader 数据

```jsx{2,5}
// src/pages/ProductDetailPage.jsx
import { useLoaderData, useNavigation } from 'react-router-dom';

function ProductDetailPage() {
  // 直接获取 loader 返回的数据，不需要 useEffect + useState
  const product = useLoaderData();

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <span>¥{product.price}</span>
    </div>
  );
}
```

:::

::: tip Data Router 的优势
- 数据加载与路由跳转**并行**：在路由切换的同时加载数据，不需要先渲染组件再触发 `useEffect`
- 更好地支持 `<Suspense>` 和流式渲染
- 内置错误处理（`errorElement`）
:::

## 七、常用路由 Hooks 速查

| Hook | 作用 | 常见用法 |
|------|------|----------|
| `useNavigate()` | 返回导航函数 | `navigate('/path')` |
| `useParams()` | 获取动态路由参数 | `const { id } = useParams()` |
| `useSearchParams()` | 读写 URL 查询参数 | `const [params, setParams] = useSearchParams()` |
| `useLocation()` | 获取当前路由信息 | `location.pathname`、`location.state` |
| `useMatch(pattern)` | 测试当前路径是否匹配 | 用于导航链接激活状态 |
| `useLoaderData()` | 获取 loader 返回的数据 | Data Router 模式专用 |
| `useNavigation()` | 获取导航状态 | `navigation.state`（`idle`/`loading`/`submitting`） |
