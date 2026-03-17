---
title: "路由配置"
category: "前端 · React 16"
tags:
  - React
  - React Router
excerpt: "React Router 5 是 React 16 时代最主流的路由方案，提供 BrowserRouter、Route、Switch、Link 等核心组件，支持动态路由、嵌套路由、路由守卫和编程式导航。"
date: 2026-03-17
---

# 路由配置

## 一、什么是路由？

::: tip 路由与单页应用
路由是单页应用（SPA）实现页面切换的核心机制。React Router 5 通过监听 URL 变化，匹配对应的组件进行渲染，整个过程无需刷新页面。
:::

**安装 React Router 5：**

```bash
npm install react-router-dom@5
```

## 二、Router 类型

React Router 5 提供两种路由模式：

| Router 类型 | URL 形式 | 适用场景 |
|-------------|----------|----------|
| `BrowserRouter` | `/users/profile` | 有服务端配置支持的项目（需要服务端处理 404） |
| `HashRouter` | `/#/users/profile` | 静态文件部署，无需服务端配置 |
| `MemoryRouter` | 不显示在 URL 中 | 测试、React Native 等非浏览器环境 |

::: details 查看 BrowserRouter 基础配置

```jsx
// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById('root')
);
```

:::

## 三、核心组件

### 1. Route 和 Switch

`Route` 用于匹配 URL 并渲染对应组件，`Switch` 确保只渲染第一个匹配的路由（避免多个 Route 同时渲染）。

::: warning exact 的重要性
在 React Router 5 中，`/` 路径会匹配所有以 `/` 开头的 URL。必须加 `exact` 属性才能做精确匹配，否则首页组件会在所有页面都渲染。
:::

::: details 查看 Switch 和 exact 用法

```jsx
// src/App.jsx
import React from 'react';
import { Switch, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import UserDetail from './pages/UserDetail';
import NotFound from './pages/NotFound';

function App() {
  return (
    <div>
      <Switch>
        {/* exact 确保精确匹配 / */}
        <Route exact path="/" component={Home} />
        <Route path="/about" component={About} />
        {/* 动态路由参数 */}
        <Route path="/users/:id" component={UserDetail} />
        {/* 放最后作为 404 兜底 */}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

export default App;
```

:::

### 2. Link 和 NavLink

`Link` 用于声明式导航，`NavLink` 在匹配当前路由时会自动添加激活样式。

::: details 查看导航栏示例

```jsx
// src/components/Navbar.jsx
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      {/* Link：基础链接，不添加激活样式 */}
      <Link to="/" className="logo">MyApp</Link>

      <div className="nav-links">
        {/* NavLink：匹配时自动添加 active 类名 */}
        <NavLink exact to="/" activeClassName="active">
          首页
        </NavLink>
        <NavLink to="/products" activeClassName="active">
          产品
        </NavLink>
        <NavLink to="/about" activeClassName="active">
          关于
        </NavLink>
        {/* 自定义激活样式 */}
        <NavLink
          to="/contact"
          activeStyle={{ color: '#e74c3c', fontWeight: 'bold' }}
        >
          联系我们
        </NavLink>
      </div>
    </nav>
  );
}

export default Navbar;
```

:::

### 3. Redirect

`Redirect` 用于声明式重定向，常用于路由别名和登录跳转。

```jsx
import { Redirect } from 'react-router-dom';

function App() {
  return (
    <Switch>
      <Route exact path="/" component={Home} />
      {/* 旧路径重定向到新路径 */}
      <Redirect from="/old-about" to="/about" />
      <Route path="/about" component={About} />
    </Switch>
  );
}
```

## 四、动态路由与路由参数

### 1. URL 参数

通过 `:参数名` 定义动态路由段，在组件中通过 `match.params` 获取。

::: details 查看动态路由完整示例

```jsx
// src/pages/ArticleDetail.jsx
import React, { useState, useEffect } from 'react';

// React Router 5 通过 props 注入 match、location、history
function ArticleDetail({ match }) {
  const { id } = match.params;
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/articles/${id}`)
      .then(res => res.json())
      .then(data => {
        setArticle(data);
        setLoading(false);
      });
  }, [id]); // id 变化时重新请求

  if (loading) return <div>加载中...</div>;
  if (!article) return <div>文章不存在</div>;

  return (
    <div className="article-detail">
      <h1>{article.title}</h1>
      <p className="meta">作者：{article.author} · {article.date}</p>
      <div className="content">{article.content}</div>
    </div>
  );
}

export default ArticleDetail;
```

:::

### 2. 查询参数（Query String）

React Router 5 不直接解析查询参数，需要借助 `location.search` 和 `URLSearchParams`。

::: details 查看查询参数示例

```jsx
// src/pages/SearchPage.jsx
import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

function SearchPage() {
  const history = useHistory();
  const location = useLocation();

  // 解析查询参数
  const searchParams = new URLSearchParams(location.search);
  const keyword = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const [results, setResults] = useState([]);

  useEffect(() => {
    if (keyword) {
      fetch(`/api/search?q=${keyword}&page=${page}`)
        .then(res => res.json())
        .then(data => setResults(data));
    }
  }, [keyword, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    const value = e.target.elements.keyword.value;
    // 更新 URL 查询参数
    history.push(`/search?q=${encodeURIComponent(value)}&page=1`);
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input name="keyword" defaultValue={keyword} placeholder="搜索..." />
        <button type="submit">搜索</button>
      </form>
      <ul>
        {results.map(item => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default SearchPage;
```

:::

## 五、编程式导航

React Router 5 通过 `history` 对象进行编程式导航，可通过 props 注入或 `useHistory` Hook 获取。

::: details 查看编程式导航示例

```jsx
// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

function LoginPage() {
  const history = useHistory();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(credentials.username, credentials.password);
      // 登录成功后跳转，replace 不保留登录页历史
      history.replace('/dashboard');
    } catch (err) {
      setError('用户名或密码错误');
    }
  };

  return (
    <div className="login-page">
      <h2>登录</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="用户名"
          value={credentials.username}
          onChange={e => setCredentials({ ...credentials, username: e.target.value })}
        />
        <input
          type="password"
          placeholder="密码"
          value={credentials.password}
          onChange={e => setCredentials({ ...credentials, password: e.target.value })}
        />
        <button type="submit">登录</button>
        <button type="button" onClick={() => history.goBack()}>返回</button>
      </form>
    </div>
  );
}

export default LoginPage;
```

:::

**history 常用方法：**

| 方法 | 说明 |
|------|------|
| `history.push('/path')` | 跳转并保留历史记录 |
| `history.replace('/path')` | 跳转并替换当前历史记录 |
| `history.goBack()` | 返回上一页 |
| `history.goForward()` | 前进到下一页 |
| `history.go(-2)` | 后退 2 步 |

## 六、嵌套路由

### 1. 嵌套路由配置

React Router 5 的嵌套路由在子组件内部声明，而非集中配置。

::: details 查看嵌套路由完整示例

```jsx
// src/pages/UserCenter.jsx
import React from 'react';
import { Switch, Route, Link, useRouteMatch } from 'react-router-dom';
import UserProfile from './UserProfile';
import UserOrders from './UserOrders';
import UserSettings from './UserSettings';

function UserCenter() {
  // useRouteMatch 获取当前路由的匹配信息
  const { path, url } = useRouteMatch();

  return (
    <div className="user-center">
      <aside>
        <nav>
          <Link to={`${url}/profile`}>个人信息</Link>
          <Link to={`${url}/orders`}>我的订单</Link>
          <Link to={`${url}/settings`}>账户设置</Link>
        </nav>
      </aside>
      <main>
        <Switch>
          {/* 默认重定向到 profile */}
          <Route exact path={path}>
            <Redirect to={`${path}/profile`} />
          </Route>
          <Route path={`${path}/profile`} component={UserProfile} />
          <Route path={`${path}/orders`} component={UserOrders} />
          <Route path={`${path}/settings`} component={UserSettings} />
        </Switch>
      </main>
    </div>
  );
}

export default UserCenter;
```

:::

## 七、路由守卫

React Router 5 没有内置路由守卫，通过封装组件实现权限控制。

### 1. 封装 PrivateRoute

::: details 查看路由守卫实现

```jsx
// src/components/PrivateRoute.jsx
import React from 'react';
import { Route, Redirect } from 'react-router-dom';

// 从 localStorage 或 Context 中获取认证状态
function isAuthenticated() {
  return !!localStorage.getItem('token');
}

function PrivateRoute({ component: Component, ...rest }) {
  return (
    <Route
      {...rest}
      render={(props) => {
        if (isAuthenticated()) {
          return <Component {...props} />;
        }
        // 未登录：重定向到登录页，并携带来源页面信息
        return (
          <Redirect
            to={{
              pathname: '/login',
              state: { from: props.location },
            }}
          />
        );
      }}
    />
  );
}

export default PrivateRoute;

// src/App.jsx 中使用
function App() {
  return (
    <Switch>
      <Route exact path="/" component={Home} />
      <Route path="/login" component={Login} />
      {/* 需要登录才能访问的页面 */}
      <PrivateRoute path="/dashboard" component={Dashboard} />
      <PrivateRoute path="/profile" component={UserProfile} />
    </Switch>
  );
}
```

:::

### 2. 登录后跳回来源页

```jsx
// src/pages/Login.jsx
function Login({ location, history }) {
  const handleLogin = async () => {
    await loginRequest();
    // 登录成功后跳转回来源页，默认首页
    const { from } = location.state || { from: { pathname: '/' } };
    history.replace(from);
  };
  // ...
}
```

## 八、withRouter 高阶组件

对于非路由直接渲染的组件（没有通过 `<Route component>` 渲染），需要使用 `withRouter` 注入路由 props。

```jsx
// src/components/BackButton.jsx
import React from 'react';
import { withRouter } from 'react-router-dom';

function BackButton({ history }) {
  return (
    <button onClick={() => history.goBack()}>
      返回上一页
    </button>
  );
}

// 通过 withRouter 注入 history、match、location
export default withRouter(BackButton);
```

::: tip withRouter vs Hooks
在函数组件中，推荐直接使用 Hooks：`useHistory`、`useLocation`、`useParams`、`useRouteMatch`，代码更简洁，无需使用 `withRouter`。
:::

## 九、路由懒加载

结合 `React.lazy` 和 `Suspense` 实现按需加载，减少首屏包体积。

::: details 查看懒加载路由配置

```jsx
// src/App.jsx
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

// 使用 lazy 实现路由级别的代码分割
const Home = lazy(() => import('./pages/Home'));
const ProductList = lazy(() => import('./pages/ProductList'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      {/* Suspense 提供加载中的 fallback UI */}
      <Suspense fallback={<LoadingSpinner />}>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/products" component={ProductList} />
          <Route path="/products/:id" component={ProductDetail} />
          <PrivateRoute path="/dashboard" component={Dashboard} />
        </Switch>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
```

:::

## 十、常用 Hooks 汇总

React Router 5.1+ 提供以下 Hooks，只能在函数组件中使用：

| Hook | 返回值 | 说明 |
|------|--------|------|
| `useHistory()` | history 对象 | 编程式导航 |
| `useLocation()` | location 对象 | 当前 URL 信息（pathname、search、hash） |
| `useParams()` | params 对象 | 当前路由的动态参数 |
| `useRouteMatch()` | match 对象 | 当前路由匹配信息，可传入路径进行测试匹配 |

::: details 查看 Hooks 综合使用示例

```jsx
// src/pages/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useHistory, useLocation } from 'react-router-dom';

function ProductDetail() {
  const { id } = useParams();             // 获取 :id 动态参数
  const history = useHistory();           // 编程式导航
  const location = useLocation();        // 当前路由信息
  const [product, setProduct] = useState(null);

  // 解析查询参数（如 ?color=red）
  const searchParams = new URLSearchParams(location.search);
  const color = searchParams.get('color');

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(setProduct);
  }, [id]);

  if (!product) return <div>加载中...</div>;

  return (
    <div>
      <h1>{product.name}</h1>
      {color && <p>选中颜色：{color}</p>}
      <button onClick={() => history.push('/products')}>
        返回列表
      </button>
    </div>
  );
}

export default ProductDetail;
```

:::

## 十一、总结

::: tip 学习建议
React Router 5 的核心是理解 `Switch`/`Route` 的匹配规则（`exact`、顺序匹配）、三种路由 props（`match`、`location`、`history`）以及嵌套路由的声明方式。掌握这些后，路由守卫和懒加载都是自然的扩展。
:::
