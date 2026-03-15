---
title: "Suspense 新特性"
category: "前端 · React 18"
tags:
  - React
excerpt: "Suspense 是 React 18 中改进的特性，它允许组件在等待某些内容加载时\"暂停\"渲染，并显示一个 fallback UI。 可以在组件中直接使用数据获取 自动处理加载状态 更好的用户体验 支持服务器端 Suspense 渐进式内..."
---

# Suspense 新特性

## 一、Suspense 概述

::: tip Suspense 定义
Suspense 是 React 18 中改进的特性，它允许组件在等待某些内容加载时"暂停"渲染，并显示一个 fallback UI。
:::

## 二、React 18 中 Suspense 的改进

### 1、支持数据获取
- 可以在组件中直接使用数据获取
- 自动处理加载状态
- 更好的用户体验

### 2、流式服务器渲染
- 支持服务器端 Suspense
- 渐进式内容加载
- 更快的首屏渲染

### 3、并发渲染集成
- 与并发渲染完美配合
- 可中断的数据获取
- 优先级调度

## 三、基本使用

### 1、代码分割

```jsx
import { Suspense, lazy } from 'react';

const LazyComponent = lazy(() => import('./LazyComponent'));

function App() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

### 2、数据获取（实验性）

```jsx
import { Suspense, use } from 'react';

// 数据获取函数
function fetchUser(id) {
  return fetch(`/api/users/${id}`).then(r => r.json());
}

function UserProfile({ userId }) {
  // use Hook 会触发 Suspense
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

## 四、use Hook（实验性）

### 1、基本使用

```jsx
import { use } from 'react';

function DataComponent({ dataPromise }) {
  // use Hook 会等待 Promise 解决
  const data = use(dataPromise);
  return <div>{data}</div>;
}

function App() {
  const dataPromise = fetch('/api/data').then(r => r.json());
  
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <DataComponent dataPromise={dataPromise} />
    </Suspense>
  );
}
```

### 2、处理 Context

```jsx
import { createContext, use } from 'react';

const ThemeContext = createContext();

function ThemedButton() {
  // use Hook 可以读取 Context
  const theme = use(ThemeContext);
  return <button className={theme}>Button</button>;
}
```

## 五、嵌套 Suspense

### 1、多级加载

```jsx
function App() {
  return (
    <Suspense fallback={<div>加载应用...</div>}>
      <Header />
      <Suspense fallback={<div>加载内容...</div>}>
        <MainContent />
      </Suspense>
      <Suspense fallback={<div>加载侧边栏...</div>}>
        <Sidebar />
      </Suspense>
    </Suspense>
  );
}
```

### 2、渐进式加载

```jsx
function Page() {
  return (
    <div>
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>
      <Suspense fallback={<ContentSkeleton />}>
        <MainContent />
      </Suspense>
      <Suspense fallback={<FooterSkeleton />}>
        <Footer />
      </Suspense>
    </div>
  );
}
```

## 六、实际应用示例

### 1、路由懒加载

```jsx
import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

function App() {
  return (
    <Suspense fallback={<div>加载页面...</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Suspense>
  );
}
```

### 2、数据获取

```jsx
import { Suspense, use } from 'react';

// 缓存数据
const cache = new Map();

function fetchData(key) {
  if (!cache.has(key)) {
    cache.set(key, fetch(`/api/${key}`).then(r => r.json()));
  }
  return cache.get(key);
}

function UserProfile({ userId }) {
  const user = use(fetchData(`users/${userId}`));
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<div>加载用户...</div>}>
      <UserProfile userId={1} />
    </Suspense>
  );
}
```

### 3、图片加载

```jsx
import { Suspense, use } from 'react';

function Image({ src }) {
  const image = use(
    new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.src = src;
    })
  );
  
  return <img src={src} alt="" />;
}

function App() {
  return (
    <Suspense fallback={<div>加载图片...</div>}>
      <Image src="/large-image.jpg" />
    </Suspense>
  );
}
```

## 七、错误处理

### 1、Error Boundary

```jsx
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <h2>出错了</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>重试</button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<div>加载中...</div>}>
        <MyComponent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

## 八、服务器端 Suspense

### 1、流式渲染

```jsx
// 服务器端
import { renderToPipeableStream } from 'react-dom/server';

function App() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <AsyncComponent />
    </Suspense>
  );
}

const stream = renderToPipeableStream(<App />);
stream.pipe(response);
```

## 九、最佳实践

### 1、提供有意义的 fallback

```jsx
// ✅ 好的做法
<Suspense fallback={<UserSkeleton />}>
  <UserProfile />
</Suspense>

// ❌ 不好的做法
<Suspense fallback={<div>Loading...</div>}>
  <UserProfile />
</Suspense>
```

### 2、合理使用嵌套 Suspense

```jsx
// ✅ 好的做法：渐进式加载
<Suspense fallback={<HeaderSkeleton />}>
  <Header />
</Suspense>
<Suspense fallback={<ContentSkeleton />}>
  <Content />
</Suspense>
```

### 3、结合 Error Boundary

```jsx
<ErrorBoundary>
  <Suspense fallback={<Loading />}>
    <Component />
  </Suspense>
</ErrorBoundary>
```

## 十、性能优化

### 1、预加载

```jsx
// 预加载组件
const LazyComponent = lazy(() => import('./LazyComponent'));

// 在需要时预加载
function PreloadButton() {
  const handleMouseEnter = () => {
    import('./LazyComponent');
  };
  
  return (
    <button onMouseEnter={handleMouseEnter}>
      Hover to preload
    </button>
  );
}
```

### 2、缓存数据

```jsx
const cache = new Map();

function fetchData(key) {
  if (!cache.has(key)) {
    cache.set(key, fetch(`/api/${key}`).then(r => r.json()));
  }
  return cache.get(key);
}
```

## 总结

Suspense 是 React 18 的重要特性，它通过暂停渲染和显示 fallback，提供了更好的加载体验。结合 use Hook 和并发渲染，Suspense 为 React 应用带来了更强大的异步处理能力。
