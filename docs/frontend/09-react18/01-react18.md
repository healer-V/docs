---
title: "React 18 概述"
category: "前端 · React 18"
tags:
  - React
excerpt: "React 18 是 React 的重大版本更新，引入了并发渲染、自动批处理、Transitions、Suspense 数据获取等核心特性，通过 createRoot 新 API 开启并发模式，为应用带来更好的性能与用户体验。"
date: 2026-03-17
---

# React 18 概述

## 一、React 18 简介

React 18 于 2022 年 3 月正式发布，是 React 迄今为止最重要的版本之一。它的核心改进是引入了**并发渲染（Concurrent Rendering）**——一种让 React 能够同时准备多个 UI 版本的新机制。

与之前版本不同，React 18 的大部分新特性都是**渐进式可选**的，你无需修改已有代码即可完成升级，然后按需启用新特性。

::: tip 核心变化
React 18 最关键的改变是渲染模型的升级：从同步不可中断的渲染，升级为可中断、有优先级的并发渲染。这一改变是所有新特性的底层基础。
:::

## 二、核心新特性一览

| 特性 | 描述 | 主要 API |
|------|------|----------|
| 并发渲染 | 可中断、有优先级的渲染机制 | `createRoot` |
| 自动批处理 | 任意场景下自动合并多次状态更新 | 默认开启 |
| Transitions | 区分紧急与非紧急更新 | `useTransition`、`startTransition` |
| Suspense 改进 | 支持数据获取与服务端流式渲染 | `<Suspense>` |
| 新 Hooks | 并发辅助工具 | `useId`、`useDeferredValue` 等 |

## 三、升级到 React 18

### 1. 安装新版本

::: code-group
```bash [npm]
npm install react@18 react-dom@18
```
```bash [pnpm]
pnpm add react@18 react-dom@18
```
```bash [yarn]
yarn add react@18 react-dom@18
```
:::

### 2. 迁移入口文件

React 18 引入了新的根 API `createRoot`，替代原来的 `ReactDOM.render`。这一步是**开启并发模式**的必要操作。

::: details 入口文件迁移示例

```jsx{8-10}
// src/index.jsx

// React 17 写法（仍可用，但无法获得并发特性）
import ReactDOM from 'react-dom';
ReactDOM.render(<App />, document.getElementById('root'));

// React 18 新写法（推荐）
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

:::

::: warning 注意
`ReactDOM.render` 在 React 18 中已被标记为过时（deprecated），控制台会出现警告。虽然仍能运行，但无法使用任何并发特性，建议尽早迁移。
:::

### 3. TypeScript 项目的额外步骤

如果你的项目使用 TypeScript，需要同时更新类型定义：

```bash
npm install @types/react@18 @types/react-dom@18
```

React 18 对 TypeScript 类型做了一处破坏性变更：`children` 从 `FC` 类型的 Props 中移除，需要显式声明：

::: details TypeScript 类型变更示例

```tsx{5,12}
// React 17 写法（children 隐式包含在 FC 中）
const MyComponent: React.FC = () => <div>Hello</div>;

// React 18 写法（需显式声明 children）
const MyComponent: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);

// 或者不使用 React.FC，直接声明 Props 类型
interface Props {
  title: string;
  children?: React.ReactNode;
}
const MyComponent = ({ title, children }: Props) => <div>{children}</div>;
```

:::

## 四、createRoot 与 hydrateRoot

### 1. createRoot

`createRoot` 是客户端渲染的新入口，调用后返回一个 root 对象，通过 `root.render()` 挂载应用。

::: details createRoot 完整用法

```jsx{4,7,10}
// src/index.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);

// 推荐在开发环境包裹 StrictMode
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// 后续可调用 root.render() 更新内容
// 也可调用 root.unmount() 卸载应用
```

:::

### 2. hydrateRoot

用于服务端渲染（SSR）场景，将已有的服务端 HTML 与客户端 React 树进行关联（hydration）：

::: details hydrateRoot 用法

```jsx{5,8}
// src/client.jsx（SSR 应用的客户端入口）
import { hydrateRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

// hydrateRoot 会复用服务端已渲染的 DOM
hydrateRoot(container, <App />);
```

:::

## 五、StrictMode 的新行为

React 18 的 `StrictMode` 在开发环境下会对每个组件额外执行一次挂载-卸载-重新挂载的流程，用于检测副作用是否可以安全地被中断和恢复。

::: warning 开发环境行为变化
在 React 18 的 `StrictMode` 下，`useEffect` 会在开发环境执行两次（挂载 → 卸载 → 重新挂载）。这是**刻意设计**，用于帮助你发现副作用清理不完整的问题，生产环境不受影响。
:::

::: details StrictMode 副作用双调用示例

```jsx{8-14}
import { useEffect, useState } from 'react';

function WebSocketComponent() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // 在 StrictMode 下，这段代码会执行两次
    const ws = new WebSocket('wss://example.com/chat');
    ws.onmessage = (e) => setMessages(prev => [...prev, e.data]);

    // 必须提供清理函数，否则会导致连接泄漏
    return () => {
      ws.close();
    };
  }, []);

  return <ul>{messages.map((msg, i) => <li key={i}>{msg}</li>)}</ul>;
}
```

:::

## 六、并发模式的开启方式

并发模式并非一个"开关"，而是通过使用并发特性 API 来逐步启用。使用 `createRoot` 后，你可以按需使用以下特性：

| API | 作用 | 启用方式 |
|-----|------|----------|
| `useTransition` | 标记低优先级更新 | 在组件中调用 |
| `useDeferredValue` | 延迟非关键值的更新 | 在组件中调用 |
| `<Suspense>` | 声明异步加载边界 | 包裹异步组件 |
| `startTransition` | 在非组件代码中标记低优先级更新 | 直接调用 |

::: tip 渐进迁移
你不需要一次性改造整个应用。可以先完成 `createRoot` 迁移，然后在性能瓶颈处逐步引入并发特性。
:::

## 七、版本兼容性

### 1. 向后兼容

- 现有组件代码无需修改即可运行
- class 组件完全支持
- 旧版 Context API 继续有效

### 2. 破坏性变更

| 变更项 | 影响 | 解决方案 |
|--------|------|----------|
| `ReactDOM.render` 废弃 | 控制台警告 | 迁移到 `createRoot` |
| TypeScript 中 `FC` 不含 `children` | 类型报错 | 显式声明 `children` 类型 |
| StrictMode 双调用 Effect | 副作用执行两次（仅开发环境） | 确保 Effect 有正确的清理函数 |
| `unmountComponentAtNode` 废弃 | 控制台警告 | 使用 `root.unmount()` |
