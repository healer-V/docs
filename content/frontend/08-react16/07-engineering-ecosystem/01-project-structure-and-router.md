---
title: "项目结构、路由与样式组织"
category: "前端 · React 16.8"
tags:
  - React
  - React Router
  - CSS Modules
excerpt: "说明 React 16.8 应用如何按页面与业务能力组织代码，并使用 React Router 5 完成路由匹配、参数读取、页面导航和 404 处理。"
date: 2026-07-31
---

# 项目结构、路由与样式组织

## 一、项目代码的职责边界

React 组件最终会形成一棵组件树，但代码目录不应机械复制这棵树。目录需要表达代码的职责、复用范围和变更原因，使页面、业务能力与通用基础设施能够分别维护。

常见代码可以分成四层：

| 层次 | 负责内容 | 典型代码 |
|------|----------|----------|
| 应用层 | 应用入口、全局 Provider、顶层路由 | `index.js`、`App.js` |
| 页面层 | 与 URL 对应的页面，以及页面级数据装配 | `TaskListPage.js`、`TaskDetailPage.js` |
| 业务层 | 围绕一项业务能力组织的组件、Hook 和数据访问 | `features/tasks/` |
| 共享层 | 不包含具体业务含义的组件和工具 | `shared/components/`、`shared/utils/` |

页面组件负责连接路由、数据和页面布局。业务组件负责完成具体操作，例如编辑任务、切换状态。共享组件只表达稳定的界面能力，例如按钮、弹窗和加载提示。

下面的结构适合包含列表页、详情页和设置页的中小型应用：

```text
src/
├─ index.js
├─ App.js
├─ pages/
│  ├─ TaskListPage.js
│  ├─ TaskDetailPage.js
│  ├─ SettingsPage.js
│  └─ NotFoundPage.js
├─ features/
│  └─ tasks/
│     ├─ components/
│     ├─ hooks/
│     └─ taskApi.js
├─ shared/
│  ├─ components/
│  └─ utils/
└─ styles/
   └─ global.css
```

当一个组件只在某个页面内使用时，可以先放在该页面附近。只有当它形成稳定职责，或确实被多个页面复用时，再移动到 `features` 或 `shared`。过早建立大量公共目录，会让查找代码需要跨越更多文件。

## 二、React Router 5 的路由模型

React 16.8 本身不包含路由。浏览器应用通常使用 `react-router-dom` 将当前 URL 映射为 React 元素，并在不刷新整页的情况下切换界面。

本文使用 React Router 5.3.4。该版本的核心组成如下：

| API | 作用 | 关键行为 |
|-----|------|----------|
| `BrowserRouter` | 监听浏览器地址并提供路由上下文 | 使用 History API，需要服务器支持回退到入口 HTML |
| `Switch` | 从子路由中选出第一个匹配项 | 路由顺序会影响结果 |
| `Route` | 声明路径与页面组件的映射 | 默认使用前缀匹配 |
| `Link`、`NavLink` | 在应用内导航 | 更新 history，不触发整页刷新 |
| `Redirect` | 将当前地址重定向到另一个地址 | 常用于默认页和旧地址兼容 |
| `useParams` | 读取动态路径参数 | 参数值均来自 URL 字符串 |
| `useHistory` | 执行命令式导航 | 适用于提交成功等由业务结果触发的跳转 |
| `useLocation` | 读取当前路径、查询串和导航状态 | `search` 仍需使用 URL API 解析 |

安装时应固定主版本，避免直接得到 API 完全不同的 React Router 6：

```bash
npm install react-router-dom@5.3.4
```

## 三、挂载路由上下文

`BrowserRouter` 必须位于所有路由组件和导航组件的上层。一个应用通常只挂载一个浏览器路由器；嵌套路由使用更多 `Route`，而不是重复创建 `BrowserRouter`。

入口文件负责将路由上下文提供给应用：

```jsx
// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// 将应用挂载到 HTML 中 id 为 root 的容器。
ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById('root')
);
```

使用 `BrowserRouter` 时，直接访问 `/tasks/42` 会先到达 Web 服务器。服务器必须把无法命中静态文件的前端路径回退到 `index.html`，再由 React Router 完成页面匹配。若部署环境无法配置回退，可以评估 `HashRouter`，其地址形如 `/#/tasks/42`。

## 四、声明页面路由

`Route` 的 `path` 表示匹配规则，`component` 表示匹配后创建的页面组件。React Router 5 默认执行前缀匹配，因此 `/tasks` 也能匹配 `/tasks/42`。需要完整匹配时使用 `exact`。

`Switch` 按书写顺序检查子路由，并只渲染第一个匹配项。具体路径应放在宽泛路径之前，无路径的 404 路由放在最后。

```jsx
// src/App.js
import React from 'react';
import { NavLink, Route, Switch } from 'react-router-dom';
import TaskListPage from './pages/TaskListPage';
import TaskDetailPage from './pages/TaskDetailPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

// 声明应用的固定导航和页面路由。
function App() {
  return (
    <div className="app-shell">
      <nav aria-label="主导航">
        <NavLink exact to="/tasks" activeClassName="is-active">
          任务
        </NavLink>
        <NavLink to="/settings" activeClassName="is-active">
          设置
        </NavLink>
      </nav>

      <main>
        <Switch>
          <Route path="/tasks/:taskId" component={TaskDetailPage} />
          <Route exact path="/tasks" component={TaskListPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFoundPage} />
        </Switch>
      </main>
    </div>
  );
}

export default App;
```

上例把 `/tasks/:taskId` 放在 `/tasks` 之前，即使后者忘记写 `exact`，详情页也不会先被列表路由截获。为宽泛路由明确添加 `exact`，仍然能让匹配意图更清楚。

`render` 属性适合向页面额外传值，但不要同时设置 `component` 和 `render`：

```jsx
// 当前用户由应用层注入页面，routeProps 保留 history、location 和 match。
<Route
  path="/settings"
  render={(routeProps) => (
    <SettingsPage {...routeProps} currentUser={currentUser} />
  )}
/>
```

每次父组件渲染都向 `component` 属性传入内联函数，会创建新的组件类型并导致页面卸载后重新挂载。需要内联逻辑时使用 `render`，需要直接渲染组件时使用 `component={SettingsPage}`。

## 五、读取路径参数和查询参数

动态片段以冒号开头，例如 `/tasks/:taskId`。`useParams()` 返回当前匹配到的参数对象。参数来自 URL，即使看起来是数字也仍然是字符串，使用前需要校验和转换。

```jsx
// src/pages/TaskDetailPage.js
import React from 'react';
import { useParams } from 'react-router-dom';

// 根据 URL 中的任务 ID 渲染任务详情入口。
function TaskDetailPage() {
  const { taskId } = useParams();
  const normalizedTaskId = Number(taskId);

  if (!Number.isInteger(normalizedTaskId) || normalizedTaskId <= 0) {
    return <p role="alert">任务编号无效。</p>;
  }

  return <TaskDetail taskId={normalizedTaskId} />;
}

export default TaskDetailPage;
```

查询参数不属于 `useParams()`。例如 `/tasks?status=open&page=2` 中的 `status` 和 `page` 位于 `location.search`，可以交给浏览器的 `URLSearchParams` 解析：

```jsx
import React from 'react';
import { useLocation } from 'react-router-dom';

// 从查询串中读取任务筛选条件，并提供明确默认值。
function TaskListPage() {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const status = query.get('status') || 'all';
  const page = Math.max(Number(query.get('page')) || 1, 1);

  return <TaskList status={status} page={page} />;
}
```

URL 中可分享、可刷新后恢复的状态，适合放在路径或查询参数中，例如详情对象 ID、筛选条件和分页位置。弹窗是否展开、输入框是否聚焦等短暂界面状态通常保留在组件 State 中。

## 六、声明式导航与命令式导航

用户点击链接前往另一个页面时，优先使用 `Link` 或 `NavLink`。它们会渲染为可访问的 `<a>` 元素，支持复制地址、在新标签页打开和键盘操作。

```jsx
import React from 'react';
import { Link } from 'react-router-dom';

// 渲染可进入任务详情页的任务标题。
function TaskLink({ task }) {
  return <Link to={`/tasks/${task.id}`}>{task.title}</Link>;
}
```

命令式导航用于跳转时机取决于业务结果的情况，例如表单保存成功后进入详情页。`history.push()` 添加一条历史记录，用户可以返回；`history.replace()` 替换当前记录，适合登录完成后离开登录页。

```jsx
import React from 'react';
import { useHistory } from 'react-router-dom';
import { createTask } from '../features/tasks/taskApi';

// 提交创建请求，并在成功后进入新任务详情页。
function CreateTaskForm() {
  const history = useHistory();
  const [title, setTitle] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  // 同步受控输入框的标题草稿。
  function handleTitleChange(event) {
    setTitle(event.target.value);
  }

  // 创建任务；失败时留在当前页面并显示可恢复错误。
  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const task = await createTask({ title });
      history.push(`/tasks/${task.id}`);
    } catch (requestError) {
      setError(requestError.message || '任务创建失败，请重试。');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        任务标题
        <input value={title} onChange={handleTitleChange} />
      </label>
      <button type="submit" disabled={submitting || !title.trim()}>
        {submitting ? '正在创建…' : '创建任务'}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
```

## 七、重定向与 404 页面

重定向表达“这个地址应当转到另一个地址”，404 页面表达“没有任何页面负责这个地址”。两者不能混用，否则无效地址可能被静默送回首页，用户也无法判断原链接已经失效。

根路径需要默认进入任务列表时，可以使用 `Redirect`：

```jsx
import { Redirect, Route, Switch } from 'react-router-dom';

// 根路径使用 exact，避免把所有页面都重定向到任务列表。
<Switch>
  <Route exact path="/">
    <Redirect to="/tasks" />
  </Route>
  <Route exact path="/tasks" component={TaskListPage} />
  <Route component={NotFoundPage} />
</Switch>
```

404 路由不设置 `path`，因此只有前面的路由都未匹配时才会渲染：

```jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// 展示未匹配地址，并提供返回有效页面的入口。
function NotFoundPage() {
  const location = useLocation();

  return (
    <section>
      <h1>页面不存在</h1>
      <p>
        未找到地址：<code>{location.pathname}</code>
      </p>
      <Link to="/tasks">返回任务列表</Link>
    </section>
  );
}
```

## 八、样式的作用域与组织

React 不规定样式方案。样式组织需要解决两个独立问题：全局基础规则放在哪里，以及组件样式如何避免意外影响其他页面。

| 样式类型 | 适合内容 | 注意事项 |
|----------|----------|----------|
| 全局 CSS | 字体、颜色变量、页面背景、基础重置 | 控制选择器范围，避免覆盖业务组件 |
| CSS Modules | 页面和组件的静态样式 | 构建工具需要支持 `.module.css` |
| CSS-in-JS | 样式依赖 Props、主题或运行时状态 | 需要评估运行时代价和库版本 |
| 内联 `style` | 少量由数据计算出的数值 | 不适合伪类、媒体查询和大段静态规则 |

CSS Modules 会把本地类名转换为构建后的唯一类名。组件通过导入对象引用样式，不需要依赖容易冲突的全局命名：

```css
/* src/features/tasks/components/TaskCard.module.css */
.card {
  border: 1px solid #d9dde3;
  padding: 12px;
}

.completed {
  opacity: 0.65;
}
```

```jsx
// src/features/tasks/components/TaskCard.js
import React from 'react';
import styles from './TaskCard.module.css';

// 根据完成状态组合任务卡片的局部类名。
function TaskCard({ task }) {
  const className = [
    styles.card,
    task.completed ? styles.completed : ''
  ]
    .filter(Boolean)
    .join(' ');

  return <article className={className}>{task.title}</article>;
}
```

运行时数值可以通过 `style` 传入对象。React 会将多数数字属性追加 `px`，但无单位属性如 `opacity`、`zIndex` 不会追加：

```jsx
// 百分比宽度属于动态数据，静态外观仍由 CSS 类负责。
<div
  className={styles.progress}
  style={{ width: `${completionRate}%` }}
  aria-valuenow={completionRate}
  aria-valuemin="0"
  aria-valuemax="100"
  role="progressbar"
/>
```

目录结构、路由和样式需要围绕相同的职责边界：页面处理地址和页面装配，业务模块处理领域行为，共享层只承载稳定复用能力。只要变更原因不同，就不应因为“代码看起来相似”而强行放进同一个文件。
