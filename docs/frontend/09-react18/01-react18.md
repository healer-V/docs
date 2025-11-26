# React 18 概述

## 一、React 18 简介

::: tip React 18 简介
React 18 是 React 的最新主要版本，引入了并发渲染、自动批处理、Suspense 改进等新特性，为 React 应用的性能和用户体验带来了显著提升。
:::

## 二、React 18 核心特性

### 1、并发渲染（Concurrent Rendering）
- 可中断的渲染过程
- 优先级调度
- 更好的用户体验

### 2、自动批处理（Automatic Batching）
- 自动合并多个状态更新
- 减少不必要的重新渲染
- 提升性能

### 3、Transitions
- 区分紧急和非紧急更新
- 保持 UI 响应性
- 改善用户体验

### 4、Suspense 改进
- 支持数据获取
- 流式服务器渲染
- 更好的加载状态

### 5、新的 Hooks
- `useId`：生成唯一 ID
- `useTransition`：标记非紧急更新
- `useDeferredValue`：延迟更新值
- `useSyncExternalStore`：外部存储同步

### 6、服务端组件（Server Components）
- 在服务器上运行组件
- 减少客户端 JavaScript
- 提升性能

## 三、升级到 React 18

### 1、安装

```bash
npm install react@18 react-dom@18
```

### 2、新的根 API

```jsx
// React 17 及之前
import ReactDOM from 'react-dom';
ReactDOM.render(<App />, document.getElementById('root'));

// React 18
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

### 3、自动批处理

```jsx
// React 17：会触发两次重新渲染
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
}

// React 18：自动批处理，只触发一次重新渲染
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
}
```

## 四、React 18 新 API

### 1、createRoot

```jsx
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
```

### 2、hydrateRoot

```jsx
import { hydrateRoot } from 'react-dom/client';

const container = document.getElementById('root');
hydrateRoot(container, <App />);
```

## 五、性能改进

### 1、更快的渲染
- 并发渲染机制
- 优先级调度
- 可中断渲染

### 2、更少的重新渲染
- 自动批处理
- 智能更新
- 优化算法

### 3、更好的用户体验
- 保持 UI 响应
- 流畅的交互
- 渐进式加载

## 六、兼容性

### 1、向后兼容
- 大部分现有代码无需修改
- 渐进式升级
- 新特性可选使用

### 2、破坏性变更
- 新的根 API（createRoot）
- 某些生命周期方法的行为变化
- TypeScript 类型更新

## 七、学习路径

1. **基础篇**
   - React 18 概述
   - 并发特性

2. **核心新特性**
   - Automatic Batching
   - Transitions
   - Suspense 新特性
   - 新 Hooks

3. **进阶应用**
   - 路由配置
   - 状态管理

4. **实战**
   - 项目实战

## 总结

React 18 带来了并发渲染、自动批处理、Suspense 改进等新特性，显著提升了 React 应用的性能和用户体验。虽然大部分现有代码可以无缝升级，但建议逐步迁移到新的 API 以获得最佳性能。

