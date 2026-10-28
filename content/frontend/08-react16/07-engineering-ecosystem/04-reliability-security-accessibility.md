---
title: "可靠性、安全与无障碍"
category: "前端 · React 16.8"
tags:
  - React
  - Error Boundary
  - Web 安全
  - 无障碍
excerpt: "区分业务错误、异步错误和渲染异常，说明 React 16.8 StrictMode、XSS 边界、语义化结构、键盘操作与焦点管理。"
date: 2026-07-31
---

# 可靠性、安全与无障碍

## 一、按错误来源选择处理方式

错误处理的目标不是统一弹出“操作失败”，而是把错误限制在合适范围，并给用户提供与原因匹配的恢复方式。

| 错误来源 | 例子 | 处理位置 | 恢复方式 |
|----------|------|----------|----------|
| 表单校验 | 标题为空、日期格式错误 | 字段或表单状态 | 修正输入后再次提交 |
| 业务拒绝 | 权限不足、任务已关闭 | 操作附近的业务状态 | 返回、刷新或联系管理员 |
| 请求失败 | 断网、超时、HTTP 503 | 请求状态或缓存库 | 重试或继续查看旧数据 |
| 渲染异常 | 组件读取了不存在的字段 | Error Boundary | 局部降级、刷新或返回 |
| 资源加载失败 | 图片 404、懒加载 chunk 失败 | 资源事件或加载边界 | 使用占位资源或重新加载 |

可预期错误应成为显式状态。错误边界只负责隔离渲染树中的未知异常，不能替代表单校验、Promise `catch` 和请求错误状态。

## 二、可预期错误的界面表达

错误信息需要回答发生了什么，以及用户接下来能做什么。字段错误紧跟字段，请求错误靠近依赖该请求的区域，页面级权限错误才占据整个页面。

```jsx
import React from 'react';
import { updateTask } from './taskApi';

// 保存任务标题，并分别展示字段错误和服务端错误。
function TaskTitleForm({ task }) {
  const [title, setTitle] = React.useState(task.title);
  const [fieldError, setFieldError] = React.useState('');
  const [submitError, setSubmitError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  // 同步标题草稿，并清除需要重新判断的字段错误。
  function handleChange(event) {
    setTitle(event.target.value);
    setFieldError('');
  }

  // 校验标题后提交；失败时保留用户草稿。
  async function handleSubmit(event) {
    event.preventDefault();
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setFieldError('请输入任务标题。');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      await updateTask(task.id, { title: normalizedTitle });
    } catch (error) {
      setSubmitError(error.message || '保存失败，请重试。');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="task-title">任务标题</label>
      <input
        id="task-title"
        value={title}
        onChange={handleChange}
        aria-invalid={Boolean(fieldError)}
        aria-describedby="task-title-error"
      />
      <p id="task-title-error" role="alert">
        {fieldError}
      </p>

      <button type="submit" disabled={submitting}>
        {submitting ? '正在保存…' : '保存'}
      </button>
      {submitError && <p role="alert">{submitError}</p>}
    </form>
  );
}
```

提交失败后没有清空 `title`，用户可以修改或直接重试。`finally` 保证成功和失败都恢复按钮状态。错误内容通过 `role="alert"` 暴露给辅助技术，但频繁变化的提示不应滥用该角色。

## 三、错误边界的捕获范围

React 16.8 的错误边界必须使用类组件实现。类通过 `getDerivedStateFromError` 切换降级界面，通过 `componentDidCatch` 记录错误和组件栈。

错误边界可以捕获其子树在以下阶段抛出的错误：

- 子组件构造函数；
- 子组件渲染；
- 子组件生命周期方法。

它不能捕获以下错误：

- 事件处理函数中的异常；
- `setTimeout`、Promise 和异步请求中的异常；
- 服务端渲染异常；
- 错误边界自身抛出的异常。

```jsx
import React from 'react';

// 隔离任务详情子树中的渲染异常，并提供局部恢复界面。
class TaskPanelErrorBoundary extends React.Component {
  state = {
    hasError: false
  };

  // 渲染异常发生后切换到降级状态。
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  /**
   * 记录渲染异常及 React 提供的组件栈。
   * @param {Error} error 捕获到的渲染错误。
   * @param {{ componentStack: string }} info React 组件栈信息。
   * @returns {void} 该生命周期只执行错误上报副作用。
   */
  componentDidCatch(error, info) {
    this.props.reportError(error, {
      componentStack: info.componentStack,
      area: 'task-panel'
    });
  }

  // 根据错误状态渲染任务区域或降级内容。
  render() {
    if (this.state.hasError) {
      return (
        <section role="alert">
          <h2>任务信息暂时无法显示</h2>
          <p>可以刷新页面，或返回任务列表后重试。</p>
        </section>
      );
    }

    return this.props.children;
  }
}
```

边界应围绕能够独立降级的区域放置。只在应用根部放一个边界，任一局部错误都会替换整个应用；为每个小按钮都放边界，又会增加结构噪声和错误上报重复。

事件处理函数中的错误使用普通 `try...catch`：

```jsx
// 导出当前任务；失败时更新操作级错误状态。
async function handleExport() {
  try {
    await exportTask(taskId);
    setMessage('任务已导出。');
  } catch (error) {
    setMessage(error.message || '导出失败，请重试。');
  }
}
```

## 四、StrictMode 在 React 16.8 中的作用

`React.StrictMode` 不渲染额外 DOM，只在开发环境为其子树启用额外检查。React 16.8 中，它用于发现不安全生命周期、旧字符串 Ref、`findDOMNode`、旧 Context 和渲染阶段副作用等问题。

```jsx
// 仅增强开发期检查，不改变生产构建的渲染结果。
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
```

StrictMode 可能在开发环境中重复调用函数组件主体、类组件 `constructor`、`render`、`shouldComponentUpdate`，以及传给 `useState`、`useMemo`、`useReducer` 的函数。这样可以让渲染阶段副作用更容易暴露。

渲染必须保持纯粹。下面的代码在组件函数中写日志服务，重复渲染会产生重复记录：

```jsx
// 错误：渲染阶段向外部系统写入数据。
function TaskPage({ taskId }) {
  auditService.recordVisit(taskId);
  return <TaskDetail taskId={taskId} />;
}
```

外部同步应进入 Effect，并提供清理或幂等保证：

```jsx
// 页面提交后记录访问，并让渲染本身保持纯函数。
function TaskPage({ taskId }) {
  React.useEffect(() => {
    auditService.recordVisit(taskId);
  }, [taskId]);

  return <TaskDetail taskId={taskId} />;
}
```

::: warning React 18 行为不能倒推到 16.8
React 18 在开发环境中新增了 Effect 的模拟卸载和重新挂载检查。React 16.8 没有这一检查。排查 React 16.8 行为时，应区分渲染阶段函数重复调用与 React 18 的 Effect 重建机制。
:::

## 五、React 的文本转义边界

React 会在 JSX 插值中转义字符串。用户输入即使包含 `<script>`，作为普通文本渲染时也不会被解释为 HTML：

```jsx
// comment.content 会作为文本节点输出，不会作为 HTML 执行。
function Comment({ comment }) {
  return <p>{comment.content}</p>;
}
```

这个保护只适用于 React 管理的文本插值。以下边界仍需单独处理：

- `dangerouslySetInnerHTML` 插入 HTML；
- 把不可信值写入 URL；
- 第三方脚本和 DOM 库直接操作页面；
- 服务端模板在 React 挂载点外输出内容；
- 客户端暴露令牌、密钥和敏感配置。

## 六、富文本与 dangerouslySetInnerHTML

`dangerouslySetInnerHTML` 接收 `{ __html: string }`，并把字符串作为真实 HTML 插入 DOM。它适用于后端富文本、Markdown 转换结果等明确需要 HTML 语义的内容，但输入必须经过可信清洗器处理。

```jsx
import React from 'react';
import DOMPurify from 'dompurify';

// 清洗富文本，只把净化后的 HTML 交给 React。
function TaskDescription({ html }) {
  const sanitizedHtml = React.useMemo(
    () => DOMPurify.sanitize(html),
    [html]
  );

  return (
    <div
      className="task-description"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
```

正则表达式无法可靠解析和清洗 HTML。允许标签、属性和 URL 协议应根据业务白名单配置；前端清洗也不能替代服务端存储、输出和内容安全策略。

::: danger 不要信任“内部数据”
数据库内容、运营后台输入和第三方接口都可能包含恶意或历史脏数据。是否需要清洗由数据是否可信决定，而不是由数据来自“外部用户”还是“内部系统”决定。
:::

## 七、URL 与外部链接安全

React 对文本转义不等于 URL 安全。攻击者可能提供 `javascript:` 等危险协议。把用户提供的地址用于 `href` 前，应只允许业务需要的协议。

```js
/**
 * 校验并规范化外部链接。
 * @param {string} rawUrl 未经信任的链接字符串。
 * @param {string} baseUrl 用于解析相对地址的可信站点基准地址。
 * @returns {string|null} 可安全使用的 URL；协议不允许时返回 null。
 */
export function normalizeExternalUrl(rawUrl, baseUrl) {
  try {
    const url = new URL(rawUrl, baseUrl);
    const allowedProtocols = new Set(['http:', 'https:']);

    return allowedProtocols.has(url.protocol) ? url.href : null;
  } catch (error) {
    return null;
  }
}
```

使用 `target="_blank"` 打开外部页面时添加 `rel="noopener noreferrer"`，避免新页面通过 `window.opener` 控制原页面，并减少来源信息泄露：

```jsx
/**
 * 只在链接通过协议校验后提供可点击入口。
 * @param {{ href: string, children: React.ReactNode }} props 外部地址与链接内容。
 * @returns {React.ReactElement} 安全链接或不可点击文本。
 */
function ExternalLink({ href, children }) {
  const safeHref = normalizeExternalUrl(href, window.location.origin);

  if (!safeHref) {
    return <span>{children}</span>;
  }

  return (
    <a href={safeHref} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
```

客户端环境变量会进入构建产物，不能保存数据库密码、私钥或永久访问令牌。真正的秘密必须保留在服务端。

## 八、语义化结构与可访问名称

无障碍的起点是使用符合行为的原生元素。原生元素自带键盘行为、焦点能力和辅助技术语义：

| 用户意图 | 应使用 | 不应替代为 |
|----------|--------|------------|
| 执行操作 | `<button>` | 带点击事件的 `<div>` |
| 页面导航 | `<a>` 或 Router `Link` | 通过按钮模拟链接 |
| 输入文本 | 带 `<label>` 的 `<input>` | 只有 placeholder 的输入框 |
| 选择一个选项 | 单选框、选择框 | 无语义的自定义列表 |
| 展示主内容结构 | `main`、`nav`、`section`、标题 | 全部使用 `<div>` |

图标按钮没有可见文字时，需要可访问名称：

```jsx
// aria-label 为只显示图标的按钮提供操作名称。
<button type="button" aria-label="删除任务" onClick={handleDelete}>
  <TrashIcon aria-hidden="true" />
</button>
```

有可见文字时通常不需要重复设置 `aria-label`。错误的 ARIA 可能覆盖清晰文字，因此应优先使用原生语义，再补充必要属性。

## 九、键盘操作与焦点管理

所有可点击操作都应能通过键盘完成。使用原生按钮和链接可以直接获得 Tab 聚焦、Enter 或 Space 激活行为。自定义交互若不能使用原生元素，才需要自行实现 `tabIndex`、键盘事件、角色和状态属性。

弹窗打开后，焦点应进入弹窗；关闭后，焦点应回到触发按钮。弹窗还需要阻止焦点离开其交互范围，并支持 Escape 关闭。下面展示焦点进入与恢复的关键部分：

```jsx
import React from 'react';
import ReactDOM from 'react-dom';

/**
 * 在弹窗挂载时接管焦点，并在卸载时恢复原焦点。
 * @param {{ title: string, onConfirm: () => void, onCancel: () => void }} props 弹窗标题与操作回调。
 * @returns {React.ReactPortal} 挂载到 document.body 的确认弹窗。
 */
function ConfirmDialog({ title, onConfirm, onCancel }) {
  const dialogRef = React.useRef(null);

  React.useEffect(() => {
    const previousFocus = document.activeElement;

    if (dialogRef.current) {
      dialogRef.current.focus();
    }

    // 弹窗关闭后将焦点还给原来的触发位置。
    return () => {
      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
      }
    };
  }, []);

  // Escape 表示取消当前模态操作。
  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      onCancel();
    }
  }

  return ReactDOM.createPortal(
    <div className="dialog-backdrop">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        tabIndex="-1"
        onKeyDown={handleKeyDown}
      >
        <h2 id="confirm-dialog-title">{title}</h2>
        <button type="button" onClick={onConfirm}>
          确认
        </button>
        <button type="button" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>,
    document.body
  );
}
```

上例只展示焦点进入、Escape 和恢复逻辑。完整模态框还必须实现焦点循环、背景不可交互、滚动锁定和多弹窗层级管理，生产项目应优先复用经过无障碍验证的对话框组件。

## 十、动态状态通知

视觉变化不一定会被屏幕阅读器感知。异步保存结果、后台刷新等非焦点区域变化可以使用 live region：

```jsx
// polite 会等待当前朗读结束，再播报不紧急的状态变化。
<p aria-live="polite">
  {saving ? '正在保存任务。' : saveMessage}
</p>
```

紧急错误可以使用 `role="alert"`，它相当于更强的即时通知。频繁更新的计数器、输入提示和每次按键结果不适合使用 alert，否则会打断用户。

可靠性、安全和无障碍不是三个独立的收尾检查。错误恢复需要可访问的提示与焦点，富文本降级需要安全输出，弹窗异常也必须恢复页面交互。组件从一开始就使用正确语义和清晰状态，后续验证才有稳定基础。
