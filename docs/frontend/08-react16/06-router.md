---
title: "路由配置"
category: "前端 · React 16"
tags:
  - React
excerpt: "路由是单页应用（SPA）中实现页面导航的机制。React Router 是 React 最流行的路由库。 使用 useParams Hook 可以获取 URL 中的动态参数。 使用路由守卫可以保护需要认证的页面，未登录用户会被重定向到登录页..."
---

# 路由配置

## 一、什么是路由？

::: tip 路由定义
路由是单页应用（SPA）中实现页面导航的机制。React Router 是 React 最流行的路由库。
:::

## 二、安装 React Router

```bash
npm install react-router-dom
```

## 三、基本路由配置

### 1、BrowserRouter

```jsx
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 2、HashRouter

```jsx
import { HashRouter } from 'react-router-dom';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </HashRouter>
  );
}
```

## 四、路由组件

### 1、Route

```jsx
import { Route, Routes } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/users" element={<Users />} />
      <Route path="/users/:id" element={<UserDetail />} />
    </Routes>
  );
}
```

### 2、Link

```jsx
import { Link } from 'react-router-dom';

function Navigation() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
      <Link to="/contact">Contact</Link>
    </nav>
  );
}
```

### 3、NavLink

```jsx
import { NavLink } from 'react-router-dom';

function Navigation() {
  return (
    <nav>
      <NavLink 
        to="/" 
        className={({ isActive }) => isActive ? 'active' : ''}
      >
        Home
      </NavLink>
      <NavLink 
        to="/about"
        style={({ isActive }) => ({
          color: isActive ? 'red' : 'blue'
        })}
      >
        About
      </NavLink>
    </nav>
  );
}
```

## 五、路由参数

### 1、URL 参数

::: tip 获取路由参数
使用 `useParams` Hook 可以获取 URL 中的动态参数。
:::

```jsx
// 路由配置
<Route path="/users/:id" element={<UserDetail />} />

// 组件中获取参数
import { useParams } from 'react-router-dom';

function UserDetail() {
  const { id } = useParams();
  
  return <div>User ID: {id}</div>;
}
```

### 2、查询参数

```jsx
import { useSearchParams } from 'react-router-dom';

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q');

  return (
    <div>
      <input
        value={query || ''}
        onChange={(e) => setSearchParams({ q: e.target.value })}
      />
      <p>Searching for: {query}</p>
    </div>
  );
}
```

## 六、编程式导航

### 1、useNavigate

```jsx
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    // 登录逻辑
    await login();
    // 导航到首页
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1); // 返回上一页
  };

  return (
    <div>
      <button onClick={handleLogin}>Login</button>
      <button onClick={handleGoBack}>Go Back</button>
    </div>
  );
}
```

## 七、嵌套路由

### 1、基本嵌套路由

```jsx
function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="users" element={<Users />}>
          <Route index element={<UserList />} />
          <Route path=":id" element={<UserDetail />} />
        </Route>
      </Route>
    </Routes>
  );
}

function Layout() {
  return (
    <div>
      <Navigation />
      <Outlet /> {/* 子路由在这里渲染 */}
    </div>
  );
}
```

### 2、Outlet

```jsx
import { Outlet } from 'react-router-dom';

function Layout() {
  return (
    <div>
      <header>Header</header>
      <main>
        <Outlet /> {/* 子路由组件在这里渲染 */}
      </main>
      <footer>Footer</footer>
    </div>
  );
}
```

## 八、路由守卫

### 1、受保护的路由

::: warning 路由保护
使用路由守卫可以保护需要认证的页面，未登录用户会被重定向到登录页。
:::

```jsx
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuth(); // 假设的认证 hook

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// 使用
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### 2、重定向

```jsx
import { Navigate } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/old-path" element={<Navigate to="/new-path" replace />} />
      <Route path="/new-path" element={<NewPage />} />
    </Routes>
  );
}
```

## 九、路由配置

### 1、路由配置文件

```jsx
// routes.js
export const routes = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/about',
    element: <About />,
  },
  {
    path: '/users',
    element: <Users />,
    children: [
      {
        index: true,
        element: <UserList />,
      },
      {
        path: ':id',
        element: <UserDetail />,
      },
    ],
  },
];

// App.js
import { useRoutes } from 'react-router-dom';
import { routes } from './routes';

function App() {
  const element = useRoutes(routes);
  return element;
}
```

## 十、路由懒加载

### 1、React.lazy 和 Suspense

```jsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Suspense>
  );
}
```

## 十一、获取路由信息

### 1、useLocation

```jsx
import { useLocation } from 'react-router-dom';

function CurrentPath() {
  const location = useLocation();
  
  return (
    <div>
      <p>Current path: {location.pathname}</p>
      <p>Search: {location.search}</p>
      <p>Hash: {location.hash}</p>
    </div>
  );
}
```

### 2、useMatch

```jsx
import { useMatch } from 'react-router-dom';

function UserDetail() {
  const match = useMatch('/users/:id');
  
  if (match) {
    return <div>User ID: {match.params.id}</div>;
  }
  
  return null;
}
```

## 十二、实际应用示例

### 1、完整的路由配置

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

## 总结

::: tip 学习建议
React Router 提供了强大的路由功能，包括嵌套路由、路由参数、路由守卫等。掌握路由配置是构建单页应用的关键技能。
:::
