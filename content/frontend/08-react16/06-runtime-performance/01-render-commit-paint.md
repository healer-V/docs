---
title: "ReactDOM、渲染、提交与浏览器绘制"
tags:
  - React
  - ReactDOM
  - 渲染机制
excerpt: "讲解 React 16.8 中 React 与 ReactDOM 的职责、render、hydrate、卸载和服务端输出，并区分 Render、Commit 与浏览器绘制。"
date: 2026-07-31
---

# ReactDOM、渲染、提交与浏览器绘制

## 一、React 与 ReactDOM

### 1. 职责划分

`react` 包负责组件、React 元素、Context、Hooks 等与宿主平台无关的模型；`react-dom` 负责把 React 结果连接到浏览器 DOM。

| 包 | 主要职责 |
|----|----------|
| `react` | `createElement`、组件、Fragment、Context、Hooks、`lazy`、`Suspense` |
| `react-dom` | 浏览器根渲染、激活、卸载、Portal、DOM 查找 |
| `react-dom/server` | 在服务端把 React 元素转换为 HTML 字符串 |

```jsx
import React from "react";
import ReactDOM from "react-dom";

const element = <h1>任务中心</h1>;
const container = document.getElementById("root");

ReactDOM.render(element, container);
```

React 元素只是界面描述；`ReactDOM.render` 才把它交给浏览器宿主环境。

## 二、ReactDOM.render

### 1. 调用形式

```text
ReactDOM.render(element, container[, callback])
```

| 参数 | 含义 |
|------|------|
| `element` | 要渲染的 React 元素 |
| `container` | 接收 React 子树的 DOM 容器 |
| `callback` | 可选，提交完成后调用 |

```jsx
/**
 * 在根界面提交后记录结果。
 * @returns {void}
 */
function handleRootCommitted() {
  console.log("任务页面已提交");
}

ReactDOM.render(
  <TaskApplication />,
  document.getElementById("root"),
  handleRootCommitted
);
```

首次调用会在容器中建立 React 根。对同一容器再次调用会更新现有根，而不是创建并列应用。

### 2. 容器边界

React 管理容器内部的子节点，不管理容器元素本身：

```html
<div id="root" data-page="tasks"></div>
```

`data-page` 属于容器自身，不会由根元素自动接管。不要用其他 DOM 代码随意修改 React 已管理的容器子树。

### 3. 返回值边界

React 16.8 的 `ReactDOM.render` 在类组件作为根元素时可能返回组件实例，但业务代码不应依赖这个返回值。需要命令式访问时使用 Ref；根渲染 API 的职责是提交应用，而不是暴露内部实例。

函数组件没有可返回的组件实例，不同根元素类型也会让返回值语义变化。把启动逻辑建立在该返回值上，会使组件类型调整变成应用入口的破坏性变更。

## 三、服务端输出与 hydrate

### 1. ReactDOMServer

服务端可以把 React 元素输出为 HTML 字符串：

```jsx
import ReactDOMServer from "react-dom/server";

const html = ReactDOMServer.renderToString(
  <TaskPage tasks={tasks} />
);
```

| API | 结果 |
|-----|------|
| `renderToString(element)` | 包含 React 激活所需标记的 HTML 字符串 |
| `renderToStaticMarkup(element)` | 静态 HTML，不用于客户端 React 激活 |

服务端输出只生成 HTML，不执行浏览器 Effect，也没有 `window`、`document` 和布局信息。

### 2. ReactDOM.hydrate

客户端已有服务端生成的 HTML 时，使用：

```text
ReactDOM.hydrate(element, container[, callback])
```

```jsx
ReactDOM.hydrate(
  <TaskPage tasks={window.__INITIAL_TASKS__} />,
  document.getElementById("root")
);
```

Hydration（客户端激活）会复用现有 DOM，并连接事件与组件状态。首个客户端渲染必须与服务端 HTML 匹配。

常见不一致来源：

- 渲染时直接读取当前时间或随机数；
- 服务端和客户端使用不同初始数据；
- 渲染期间读取浏览器尺寸；
- 无效 HTML 被浏览器自动修正；
- 条件分支依赖 `window` 是否存在。

React 可能对文本差异进行有限修正，但不应把警告当作可忽略行为。结构不一致会让事件和 DOM 复用结果不可预测。

## 四、卸载

### 1. unmountComponentAtNode

```text
ReactDOM.unmountComponentAtNode(container)
```

它从容器中卸载 React 根，执行类组件卸载生命周期和 Effect 清理，并移除 React 创建的 DOM。

```jsx
const container = document.getElementById("task-widget");
const removed = ReactDOM.unmountComponentAtNode(container);
```

返回布尔值表示该容器是否存在可卸载的 React 组件。

微前端、小部件或测试环境销毁根时必须显式卸载，不能只使用 `container.innerHTML = ""`。直接清空 DOM 会绕过订阅、定时器和第三方实例清理。

## 五、Render 阶段

### 1. 计算下一棵树

Render 阶段负责：

- 调用函数组件；
- 调用类组件 `render()`；
- 执行 State 更新队列；
- 读取 Context；
- 创建和比较 React 元素；
- 确定需要提交的变更。

Render 阶段的输出是“下一棵界面树及变更计划”，不是立即修改浏览器 DOM。

```text
Props / State / Context 更新
→ 执行组件
→ 产生 React 元素
→ 协调新旧树
→ 标记需要提交的变更
```

### 2. 必须保持纯粹

Render 工作可能重复、被跳过或因错误中止。组件函数、`render()`、State updater、Reducer 和 `useMemo` 计算都应保持纯粹。

渲染期间发请求、修改 DOM 或写入外部变量，会让外部环境与最终是否提交脱节。

## 六、Commit 阶段

### 1. 应用已确认变更

Commit 阶段把 Render 阶段确定的变更应用到宿主环境：

- 创建、插入、更新或删除 DOM；
- 更新 Ref；
- 调用相关类生命周期；
- 执行 `useLayoutEffect`；
- 安排 `useEffect`。

Commit 是同步且不可被拆分的阶段，避免用户看到只提交一半的界面。

### 2. 生命周期时机

| 时机 | 类组件或 Hook |
|------|---------------|
| DOM 修改前 | `getSnapshotBeforeUpdate` |
| DOM 修改后、绘制前 | `componentDidMount`、`componentDidUpdate`、`useLayoutEffect` |
| DOM 删除前 | `componentWillUnmount`、布局 Effect 清理 |
| 浏览器绘制后 | `useEffect` |

`useEffect` 的清理与 setup 由 React 在被动 Effect 阶段处理，不应使用它阻止首次绘制。

## 七、浏览器绘制

React 提交 DOM 后，浏览器还要完成：

```text
样式计算
→ 布局
→ 绘制
→ 合成
```

React 渲染耗时和浏览器绘制耗时是两类性能成本：

- 组件计算和协调慢，应分析 React Render；
- DOM 数量、复杂样式或布局抖动慢，应分析浏览器性能工具；
- 图片和字体加载慢，应分析网络与资源；
- `useLayoutEffect` 工作过重会阻塞绘制。

## 八、一次更新的完整过程

```text
用户单击
→ 事件处理函数提交 State 更新
→ React 处理更新队列
→ Render：执行组件并协调元素树
→ Commit：修改 DOM、更新 Ref、运行布局生命周期
→ 浏览器：计算布局并绘制
→ React：运行 useEffect
```

组件函数执行不等于 DOM 一定变化。协调发现结果相同或只有部分属性变化时，Commit 只应用必要变更。

## 九、版本边界

React 16.8 使用 `ReactDOM.render` 和 `ReactDOM.hydrate`。React 18 的 `createRoot`、`hydrateRoot`、自动批处理和并发根行为不适用于 React 16.8。

| 问题 | 原因 | 处理方式 |
|------|------|----------|
| 直接清空容器后资源泄漏 | 绕过 React 卸载 | 使用 `unmountComponentAtNode` |
| Hydration 警告 | 服务端与客户端首屏不同 | 保证确定性渲染和相同数据 |
| 在 render 中读 DOM | DOM 尚未提交或仍是旧值 | 使用生命周期或布局 Effect |
| 误把组件执行当作 DOM 更新 | Render 与 Commit 是不同阶段 | 分别观察渲染和提交 |
| Effect 里修正首屏布局闪烁 | Effect 通常在绘制后执行 | 必要时使用 `useLayoutEffect` |

ReactDOM 负责把声明式 React 树可靠地提交到浏览器；理解阶段边界能判断代码应放在渲染、事件还是 Effect 中。
