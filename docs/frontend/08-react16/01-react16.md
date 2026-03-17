---
title: "React 16 概述"
category: "前端 · React 16"
tags:
  - React
excerpt: "React 是由 Facebook（现 Meta）开发的一个用于构建用户界面的 JavaScript 库。它采用组件化开发模式，让开发者可以构建可复用的 UI 组件。 函数组件：使用函数定义的组件，简洁高效 类组件：使用 ES6 类定义的组..."
---

# React 16 概述

## 一、什么是 React？

::: tip React 定义
React 是由 Facebook（现 Meta）开发的一个用于构建用户界面的 JavaScript 库。它采用组件化开发模式，让开发者可以构建可复用的 UI 组件。
:::

## 二、React 16 核心特性

### 1、组件化开发

::: info 组件化优势
- **函数组件**：使用函数定义的组件，简洁高效
- **类组件**：使用 ES6 类定义的组件，功能更强大
- **组件复用**：通过组合组件构建复杂的用户界面
:::

### 2、虚拟 DOM（Virtual DOM）

::: tip 虚拟 DOM 的作用
- React 使用虚拟 DOM 来提高性能
- 通过 diff 算法最小化 DOM 操作
- 批量更新 DOM，提高渲染效率
:::

### 3、单向数据流

::: info 数据流向
- 数据从父组件流向子组件
- 通过 props 传递数据
- 通过回调函数处理子组件事件
:::

### 4、JSX 语法

::: tip JSX 特点
- JavaScript 的语法扩展
- 允许在 JavaScript 中写类似 HTML 的代码
- 编译后转换为 React.createElement 调用
:::

## 三、React 16 新特性

### 1、Fiber 架构

::: tip Fiber 架构简介
Fiber 是 React 16 对核心协调算法（Reconciler）的完整重写。在 React 15 及以前，渲染过程是同步且不可中断的——一旦开始更新，就必须一口气完成，期间无法响应用户交互，在复杂场景下会导致页面卡顿。

Fiber 架构将渲染工作分解为多个可中断的小单元（Fiber 节点），每个 Fiber 节点对应一个组件或 DOM 元素。React 可以在执行完一个单元后暂停，让浏览器处理其他任务（如用户输入），之后再恢复继续渲染，这就是**增量渲染（Incremental Rendering）**。
:::

**Fiber 架构的核心优势：**

| 特性 | React 15（Stack） | React 16（Fiber） |
|------|-------------------|-------------------|
| 渲染方式 | 同步、不可中断 | 异步、可中断恢复 |
| 优先级调度 | 不支持 | 支持任务优先级 |
| 错误处理 | 异常导致应用崩溃 | 支持错误边界 |
| 动画性能 | 容易掉帧 | 配合 requestIdleCallback 更流畅 |

**Fiber 两个工作阶段：**

- **Render 阶段（可中断）**：遍历 Fiber 树，计算出需要做哪些 DOM 变更，生成 effect 列表，此阶段可被高优先级任务打断。
- **Commit 阶段（不可中断）**：将 effect 列表中的变更同步提交到真实 DOM，此阶段必须一次性完成。

::: details 查看渲染流程图示

```
用户触发更新
    ↓
Render 阶段（可中断）
  ├── beginWork：自顶向下处理每个 Fiber 节点
  ├── completeWork：自底向上收集副作用
  └── 生成 effectList
    ↓
Commit 阶段（不可中断）
  ├── before mutation：执行 getSnapshotBeforeUpdate
  ├── mutation：操作真实 DOM
  └── layout：执行 componentDidMount/componentDidUpdate
```

:::

### 2、错误边界（Error Boundaries）

::: warning 错误边界的作用
- 捕获子组件树中的错误
- 防止整个应用崩溃
- 提供降级 UI
:::

### 3、Fragment

::: info Fragment 用途
- 无需额外 DOM 节点
- 可以返回多个元素
- 简化组件结构
:::

### 4、Portal

::: tip Portal 应用场景
- 将子节点渲染到 DOM 树的不同位置
- 用于模态框、工具提示等场景
:::

### 5、改进的生命周期

::: info 生命周期改进
- 新增 `getDerivedStateFromProps`
- 新增 `getSnapshotBeforeUpdate`
- 废弃部分不安全的生命周期方法
:::

## 四、安装 React

### 1、使用 Create React App

::: details 点击查看安装步骤

```bash
# 创建新的 React 应用
npx create-react-app my-app

# 进入项目目录
cd my-app

# 启动开发服务器
npm start
```

:::

### 2、使用 CDN

::: details 点击查看 CDN 方式

```html
<!DOCTYPE html>
<html>
<head>
  <script crossorigin src="https://unpkg.com/react@16/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    function App() {
      return <h1>Hello, React!</h1>;
    }
    ReactDOM.render(<App />, document.getElementById('root'));
  </script>
</body>
</html>
```

:::

## 五、React 渲染机制

### 1、Virtual DOM 工作原理

React 不直接操作真实 DOM，而是维护一棵内存中的虚拟 DOM 树。每次状态更新时，React 会：

1. 根据新的 state/props 生成新的虚拟 DOM 树
2. 与上一次的虚拟 DOM 树进行 **Diff 对比**
3. 找出最小差异集合
4. 将差异批量更新到真实 DOM

::: tip 为什么需要 Virtual DOM？
直接操作真实 DOM 的代价很高——每次修改都可能触发浏览器的重排（reflow）和重绘（repaint）。Virtual DOM 通过批量合并更新，将多次 DOM 操作合并为一次，从而减少性能开销。
:::

### 2、Diff 算法规则

React 的 Diff 算法有三个核心策略：

- **树级别对比**：只对比同层节点，不跨层移动，时间复杂度从 O(n³) 降至 O(n)
- **组件类型对比**：类型不同的组件直接销毁重建，不复用
- **key 属性**：列表渲染中使用 key 标识节点身份，帮助 React 判断节点是否可复用

::: warning key 的正确使用
列表中的 key 必须在兄弟节点中唯一，且稳定不变。不要使用数组 index 作为 key——当列表发生增删排序时，index 会变化，导致 React 错误地复用节点，引发渲染 bug。
:::

### 3、批量更新（Batch Update）

在 React 合成事件和生命周期方法中，多次 `setState` 会被合并为一次更新，避免多次渲染：

::: details 查看批量更新示例

```jsx
// src/components/BatchUpdateDemo.jsx
class BatchUpdateDemo extends React.Component {
  state = { count: 0 };

  handleClick = () => {
    // 在合成事件中，以下三次 setState 会被批量合并，只触发一次渲染
    this.setState({ count: this.state.count + 1 });
    this.setState({ count: this.state.count + 1 });
    this.setState({ count: this.state.count + 1 });
    // 最终 count 只加了 1，而非 3
  };

  handleAsyncClick = () => {
    // 在异步回调中，批量更新失效，每次 setState 都会触发渲染
    setTimeout(() => {
      this.setState({ count: this.state.count + 1 });
      this.setState({ count: this.state.count + 1 });
      // count 加了 2
    }, 0);
  };

  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={this.handleClick}>同步更新</button>
        <button onClick={this.handleAsyncClick}>异步更新</button>
      </div>
    );
  }
}
```

:::

## 六、第一个 React 组件

### 1、函数组件示例

```jsx
function Welcome(props) {
  return <h1>Hello, {props.name}!</h1>;
}

// 使用组件
<Welcome name="React" />
```

### 2、类组件示例

```jsx
class Welcome extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}!</h1>;
  }
}

// 使用组件
<Welcome name="React" />
```

## 七、React 开发工具

### 1、React Developer Tools

::: tip 开发工具
- Chrome/Firefox 浏览器扩展
- 用于调试 React 组件
- 查看组件树和状态
:::

### 2、推荐编辑器

::: info 编辑器推荐
- **VS Code**：推荐使用
- **WebStorm**：功能强大
- 安装 React 相关插件
:::

### 3、代码格式化

::: tip 代码规范工具
- ESLint：代码检查
- Prettier：代码格式化
- 使用 `.eslintrc` 和 `.prettierrc` 配置
:::

## 八、学习路径

::: details 点击查看完整学习路径

1. **基础篇**
   - JSX 语法
   - 组件开发
   
2. **核心概念**
   - 生命周期
   - Hooks 基础
   
3. **进阶应用**
   - 路由配置
   - 状态管理
   
4. **实战**
   - 项目实战

:::

## 九、总结

::: tip 学习建议
React 16 是一个成熟的版本，引入了 Fiber 架构和错误边界等新特性，为 React 的后续发展奠定了基础。通过学习 React 16，你可以掌握现代前端开发的核心技能。
:::
