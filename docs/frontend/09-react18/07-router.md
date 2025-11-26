# 路由配置

## 一、React 18 中的路由

::: tip 路由改进
React 18 的路由配置与 React 16 基本相同，但可以更好地利用并发特性和 Suspense。
:::

## 二、基本路由配置

### 1、使用 React Router v6

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

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

## 三、结合 Suspense

### 1、路由懒加载

```jsx
import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>加载页面...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

### 2、嵌套 Suspense

```jsx
function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<AppSkeleton />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={
            <Suspense fallback={<DashboardSkeleton />}>
              <Dashboard />
            </Suspense>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

## 四、使用 useTransition 优化路由切换

### 1、平滑的路由切换

```jsx
import { useTransition } from 'react';
import { useNavigate } from 'react-router-dom';

function Navigation() {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();

  const handleNavigate = (path) => {
    startTransition(() => {
      navigate(path);
    });
  };

  return (
    <nav>
      {isPending && <div>切换中...</div>}
      <button onClick={() => handleNavigate('/')}>Home</button>
      <button onClick={() => handleNavigate('/about')}>About</button>
    </nav>
  );
}
```

## 五、数据加载路由

### 1、结合 use Hook

```jsx
import { use, Suspense } from 'react';
import { useParams } from 'react-router-dom';

function fetchUser(id) {
  return fetch(`/api/users/${id}`).then(r => r.json());
}

function UserProfile() {
  const { id } = useParams();
  const user = use(fetchUser(id));

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/users/:id" element={
          <Suspense fallback={<div>加载用户...</div>}>
            <UserProfile />
          </Suspense>
        } />
      </Routes>
    </BrowserRouter>
  );
}
```

## 六、路由守卫

### 1、受保护的路由

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
```

## 七、实际应用示例

### 1、完整的路由配置

```jsx
import { Suspense, lazy, useTransition } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function Navigation() {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();

  const handleNavigate = (path) => {
    startTransition(() => {
      navigate(path);
    });
  };

  return (
    <nav>
      {isPending && <div>切换中...</div>}
      <Link to="/" onClick={() => handleNavigate('/')}>Home</Link>
      <Link to="/about" onClick={() => handleNavigate('/about')}>About</Link>
      <Link to="/dashboard" onClick={() => handleNavigate('/dashboard')}>Dashboard</Link>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Suspense fallback={<div>加载页面...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

## 八、总结

React 18 的路由配置可以更好地利用 Suspense 和 useTransition，提供更流畅的路由切换体验和更好的加载状态管理。
