---
title: "错误边界与降级界面"
tags:
  - React
  - 错误边界
  - 类组件
excerpt: "讲解 React 16.8 错误边界的捕获范围、类生命周期 API、降级界面、日志和恢复方式，并区分事件、请求和服务端错误。"
date: 2026-07-31
---

# 错误边界与降级界面

## 一、错误边界

### 1. 作用

错误边界是捕获后代组件渲染错误、记录错误并显示降级界面的 React 组件。它可以阻止一处界面故障破坏整个应用页面。

React 16.8 中，错误边界必须是实现以下至少一个生命周期 API 的类组件：

- `static getDerivedStateFromError(error)`；
- `componentDidCatch(error, info)`。

函数组件和普通 `try...catch` 不能替代 React 渲染错误边界。

### 2. 捕获范围

错误边界可以捕获后代组件中的：

- `render()` 或函数组件执行错误；
- 构造函数错误；
- 生命周期方法错误；
- 懒组件动态导入拒绝产生的渲染错误。

错误边界不捕获：

| 错误来源 | 处理位置 |
|----------|----------|
| 边界自身的错误 | 更上层错误边界 |
| 事件处理函数 | 事件函数中的 `try...catch` 和业务错误 State |
| `setTimeout`、Promise 等异步回调 | 对应异步流程的异常处理 |
| 服务端渲染错误 | 服务端渲染入口 |
| 普通网络失败 | 请求状态和错误界面 |

## 二、生命周期 API

### 1. getDerivedStateFromError

```text
static getDerivedStateFromError(error)
```

| 项目 | 含义 |
|------|------|
| `error` | 后代抛出的错误 |
| 返回值 | 要合并到边界 State 的状态片段 |
| 执行阶段 | Render 阶段 |
| 适合工作 | 选择降级界面 |

它是静态方法，没有实例 `this`，也不应执行日志上报等副作用。

### 2. componentDidCatch

```text
componentDidCatch(error, info)
```

| 参数 | 含义 |
|------|------|
| `error` | 捕获到的错误对象 |
| `info.componentStack` | React 提供的组件栈文本 |

它在 Commit 阶段执行，适合调用日志服务。日志中应包含业务位置、组件栈和关联标识，但不能上报密码、Token、完整表单或客户敏感数据。

## 三、完整错误边界

### 1. 定义组件

```jsx
class ErrorBoundary extends React.Component {
  /**
   * 创建错误边界实例。
   * @param {{
   *   children: React.ReactNode,
   *   fallback?: React.ReactNode,
   *   onError?: (error: Error, info: { componentStack: string }) => void
   * }} props 组件属性。
   */
  constructor(props) {
    super(props);

    this.state = {
      error: null
    };
  }

  /**
   * 根据渲染错误切换到降级状态。
   * @param {Error} error 捕获到的错误。
   * @returns {{ error: Error }} 下一状态片段。
   */
  static getDerivedStateFromError(error) {
    return {
      error
    };
  }

  /**
   * 在提交降级界面后记录错误。
   * @param {Error} error 捕获到的错误。
   * @param {{ componentStack: string }} info React 组件栈信息。
   * @returns {void}
   */
  componentDidCatch(error, info) {
    if (this.props.onError) {
      this.props.onError(error, info);
    }
  }

  /**
   * 清除当前错误，尝试重新渲染子树。
   * @returns {void}
   */
  handleRetry = () => {
    this.setState({
      error: null
    });
  };

  /**
   * 返回正常子树或降级界面。
   * @returns {React.ReactNode} 子内容或错误提示。
   */
  render() {
    if (this.state.error !== null) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <section role="alert">
          <h2>当前区域暂时不可用</h2>
          <button type="button" onClick={this.handleRetry}>
            重试
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}
```

使用：

```jsx
<ErrorBoundary onError={reportRenderError}>
  <TaskReports />
</ErrorBoundary>
```

### 2. 重试边界

清除边界 State 只会让 React 再次尝试渲染同一子树。如果错误原因没有消失，边界会立即再次捕获。

有效恢复可能需要：

- 重新请求数据；
- 重置导致错误的局部 State；
- 更换子树 `key`，创建新组件实例；
- 跳转到安全页面；
- 刷新已经部署新资源的页面。

重试按钮必须执行真正的恢复动作，而不只是反复清空错误标志。

## 四、边界粒度

### 1. 按故障区域放置

只在应用根部放一个错误边界，可以避免整个页面空白，但任何错误都会替换全部应用。更合理的边界通常位于：

- 路由页面；
- 报表、编辑器等独立大功能；
- 第三方小部件；
- 允许单独刷新或降级的区域。

```jsx
<ApplicationErrorBoundary>
  <PageLayout>
    <Navigation />
    <ErrorBoundary>
      <TaskWorkspace />
    </ErrorBoundary>
  </PageLayout>
</ApplicationErrorBoundary>
```

任务区域失败时，导航仍可以使用；边界自身失败时，外层应用边界继续兜底。

### 2. 不为每个小组件加边界

边界过多会产生重复降级界面、日志和恢复逻辑。只有一组 UI 具备独立失败和恢复能力时，才需要单独边界。

合理边界通常对应页面主体、独立工作区或可选侧栏。边界范围应保证降级后剩余界面仍然有意义，而不是留下依赖已失败区域的残缺操作。

## 五、降级界面

### 1. 面向用户的信息

降级界面应说明：

- 哪个区域不可用；
- 用户数据是否已保存；
- 可以执行什么操作；
- 是否能够重试、返回或刷新。

不要直接显示错误堆栈、接口地址或内部模块名。

### 2. 保持关键导航

根级错误界面至少应保留返回首页、重新加载或联系支持的入口。局部错误界面应尽量保持周围页面可操作。

恢复按钮本身不应继续依赖已经失败的子树。重新加载、返回列表等操作应由边界或其外层提供，避免一点击恢复入口就再次触发同一渲染错误。

### 3. 防止日志循环

日志上报函数本身必须捕获失败，不能因为日志服务错误再次破坏边界：

```jsx
/**
 * 安全上报渲染错误。
 * @param {Error} error 捕获到的错误。
 * @param {{ componentStack: string }} info React 组件栈。
 * @returns {void}
 */
function reportRenderError(error, info) {
  try {
    errorReporter.capture({
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack
    });
  } catch (reportError) {
    console.error("错误日志上报失败", reportError);
  }
}
```

## 六、事件与请求错误

### 1. 事件错误

事件处理函数中的错误不会被错误边界捕获：

```jsx
/**
 * 删除任务并显示业务错误。
 * @returns {Promise<void>} 删除完成后的 Promise。
 */
async function handleDelete() {
  try {
    await deleteTask(taskId);
  } catch (error) {
    setDeleteError("删除失败，请重试");
  }
}
```

事件错误有明确触发点和恢复入口，应保存在对应业务 State 中。

### 2. 请求错误

HTTP 失败、超时和取消是可预期运行状态，不应通过 `throw` 交给错误边界统一显示。组件需要区分加载、空数据、请求失败和成功。

只有请求结果导致渲染代码出现未预期异常时，错误边界才作为最后隔离层。

## 七、lazy 与 Suspense

```jsx
<ErrorBoundary fallback={<p>报表加载失败</p>}>
  <React.Suspense fallback={<p>正在加载报表</p>}>
    <TaskReports />
  </React.Suspense>
</ErrorBoundary>
```

`Suspense` 负责等待动态模块，错误边界负责模块加载拒绝或组件渲染错误。两种状态需要不同提示。

## 八、常见问题

| 问题 | 原因 | 处理方式 |
|------|------|----------|
| 单击事件错误未被捕获 | 错误边界不捕获事件函数 | 在事件中处理 |
| 边界自身错误导致页面崩溃 | 边界不捕获自身 | 增加更上层边界 |
| 重试后立即再次报错 | 根因没有消除 | 重置数据、实例或重新加载 |
| 所有页面都显示同一错误 | 边界粒度过大 | 按独立故障区域划分 |
| 生产页面泄露堆栈 | 直接显示内部错误 | 用户提示与开发日志分离 |
| Promise 拒绝未捕获 | 异步错误不属于渲染阶段 | 在异步流程处理 |

错误边界是不可预期渲染故障的隔离层，不是所有错误的统一处理器。
