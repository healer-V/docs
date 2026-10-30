---
title: "lazy、Suspense 与代码分割"
tags:
  - React
  - Suspense
  - 代码分割
excerpt: "讲解 React.lazy、动态 import 和 Suspense fallback 的参数与加载过程，并说明默认导出、错误边界、分包粒度和 React 16.8 限制。"
date: 2026-07-31
---

# lazy、Suspense 与代码分割

## 一、代码分割

### 1. 解决的问题

静态导入会让构建工具把依赖纳入初始加载图：

```jsx
import TaskReports from "./TaskReports";
```

如果报表页面体积较大且用户不一定访问，可以使用动态 `import()` 创建独立代码块：

```jsx
import("./TaskReports");
```

动态导入返回 Promise。Webpack 等构建工具识别该语法后，会把模块生成独立资源，并在代码真正执行时请求。

### 2. 分割边界

适合延迟加载的边界包括：

- 路由页面；
- 低频打开的报表或设置；
- 体积较大的编辑器、图表；
- 只对特定权限用户开放的功能。

每个小组件都单独分包会增加请求数量、加载状态和失败处理。分包粒度应结合资源体积、访问概率和网络环境决定。

## 二、React.lazy

### 1. 调用形式

```text
const LazyComponent = React.lazy(load);
```

| 参数或返回值 | 含义 |
|--------------|------|
| `load` | 返回动态导入 Promise 的函数 |
| Promise 结果 | 必须是包含 `default` React 组件的模块对象 |
| 返回值 | 可在 JSX 中使用的懒加载组件 |

```jsx
const TaskReports = React.lazy(
  /**
   * 动态加载任务报表模块。
   * @returns {Promise<{ default: React.ComponentType<any> }>} 模块 Promise。
   */
  () => import("./TaskReports")
);
```

`TaskReports` 应定义在模块顶层。若在组件渲染中调用 `React.lazy`，每次渲染都会创建新组件类型并重置子树。

### 2. 默认导出要求

懒加载模块需要默认导出：

```jsx
// src/pages/TaskReports.jsx

/**
 * 显示任务报表页面。
 * @returns {React.ReactElement} 报表页面。
 */
export default function TaskReports() {
  return <h1>任务报表</h1>;
}
```

只有具名导出时，可以创建中间模块重新导出默认值。也可以让动态导入 Promise 映射模块：

::: details 查看默认导出要求的示例代码
```jsx
const TaskReports = React.lazy(
  /**
   * 加载模块并把具名导出映射为 default。
   * @returns {Promise<{ default: React.ComponentType<any> }>} 映射后的模块 Promise。
   */
  () => import("./TaskReports").then(
    /**
     * 选择 TaskReports 具名导出。
     * @param {{ TaskReports: React.ComponentType<any> }} module 模块对象。
     * @returns {{ default: React.ComponentType<any> }} React.lazy 所需模块对象。
     */
    (module) => ({
      default: module.TaskReports
    })
  )
);
```
:::

中间模块通常更利于构建工具静态分析导出关系。

## 三、Suspense

### 1. fallback

懒组件首次渲染但代码尚未加载时会挂起。最近的 `Suspense` 使用 `fallback` 渲染临时界面。

```jsx
<React.Suspense fallback={<p>正在加载报表</p>}>
  <TaskReports />
</React.Suspense>
```

| Props | 含义 |
|-------|------|
| `fallback` | 子树挂起时显示的 React 内容 |
| `children` | 可能包含懒组件的正常内容 |

模块加载成功后，React 用真实组件替换 fallback。

### 2. 边界范围

Suspense 边界决定加载时被替换的界面范围：

```jsx
<PageLayout>
  <PageNavigation />
  <React.Suspense fallback={<PageContentSkeleton />}>
    <TaskReports />
  </React.Suspense>
</PageLayout>
```

导航和布局保持可见，只有页面内容区域显示骨架。把边界放在应用根部可能导致一个低频组件加载时替换整个页面。

多个懒组件可以共享一个边界，也可以分别提供 fallback：

```jsx
<React.Suspense fallback={<ReportSkeleton />}>
  <TaskSummaryReport />
</React.Suspense>

<React.Suspense fallback={<ChartSkeleton />}>
  <TaskTrendChart />
</React.Suspense>
```

选择依据是这些内容是否应该作为一个整体进入可用状态。

## 四、条件加载

懒组件只有进入当前渲染树时才开始加载：

::: details 查看条件加载的示例代码
```jsx
/**
 * 按需打开任务报表。
 * @returns {React.ReactElement} 打开按钮和报表区域。
 */
function ReportsPanel() {
  const [open, setOpen] = React.useState(false);

  /**
   * 打开报表。
   * @returns {void}
   */
  function handleOpen() {
    setOpen(true);
  }

  return (
    <section>
      <button type="button" onClick={handleOpen}>
        打开报表
      </button>

      {open && (
        <React.Suspense fallback={<p>正在加载报表</p>}>
          <TaskReports />
        </React.Suspense>
      )}
    </section>
  );
}
```
:::

单击前报表模块通常不会请求；单击后组件进入元素树，React 执行加载函数并显示 fallback。

路由级懒加载同样通过路由匹配结果决定组件是否进入渲染树。

## 五、加载失败

### 1. Suspense 不处理错误

`fallback` 只表示等待代码加载，不处理动态导入失败。网络错误、资源 404 或发布后旧页面请求已删除代码块时，Promise 会拒绝。

错误需要由错误边界捕获：

```jsx
<ErrorBoundary fallback={<p>报表加载失败</p>}>
  <React.Suspense fallback={<p>正在加载报表</p>}>
    <TaskReports />
  </React.Suspense>
</ErrorBoundary>
```

| 状态 | 负责组件 |
|------|----------|
| 模块仍在加载 | `Suspense` |
| 模块加载失败 | 错误边界 |
| 模块加载成功 | 懒组件 |

### 2. 重试

同一个 `React.lazy` 组件内部会保存加载结果。简单地重新渲染同一懒组件不一定重新执行失败的动态导入。

生产系统可以：

- 提供刷新页面操作；
- 在部署时保留一段时间的旧代码块；
- 使用构建版本检测提示用户刷新；
- 用经过验证的加载封装实现显式重试。

不要无条件自动刷新，否则持续网络错误会形成刷新循环。

## 六、加载体验

### 1. fallback 要与区域匹配

合适的 fallback 应：

- 保持区域尺寸稳定，减少布局跳动；
- 说明当前正在加载；
- 不伪装成已经可操作的内容；
- 避免全屏遮挡无关功能；
- 对屏幕阅读器提供必要状态。

```jsx
function ReportSkeleton() {
  return (
    <div role="status" aria-live="polite">
      正在加载报表
    </div>
  );
}
```

### 2. 预加载

React 16.8 的 `React.lazy` 没有公开的通用预加载 API。项目可以在用户悬停导航、浏览器空闲或路由预测时主动执行相同动态导入，但需要让预加载缓存与实际 `lazy` 加载共享模块 Promise，避免重复封装。

预加载是性能策略，应根据导航概率和网络成本决定，不是所有懒组件的默认行为。

## 七、React 16.8 边界

React 16.8 中 Suspense 的稳定用途是配合 `React.lazy` 进行客户端代码分割。不要把较新 React 版本或特定框架中的 Suspense 数据请求能力直接套入 React 16.8。

服务端渲染也不能使用后来流式 Suspense 的行为解释 React 16.8。React 16.8 应为懒加载页面设计明确的客户端加载边界。

## 八、常见问题

| 问题 | 原因 | 处理方式 |
|------|------|----------|
| 提示模块缺少 default | 懒模块只有具名导出 | 增加默认导出或映射模块 |
| 每次更新都重置懒组件 | 在组件内部调用 `React.lazy` | 移到模块顶层 |
| 加载失败一直显示空白 | 只有 Suspense，没有错误边界 | 增加错误边界 |
| 一个小组件加载替换全屏 | Suspense 边界过大 | 缩小到可独立等待的区域 |
| 初始包仍然很大 | 动态模块被其他静态导入引用 | 检查依赖图和构建产物 |
| 请求数量过多 | 分包粒度过细 | 按路由或较大功能合并 |

代码分割的目标是减少不必要的初始下载，同时保持加载、失败和恢复状态完整。
