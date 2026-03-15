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

::: tip Fiber 架构优势
- 全新的协调算法
- 支持增量渲染
- 更好的性能表现
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

## 五、第一个 React 组件

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

## 六、React 开发工具

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

## 七、学习路径

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

## 八、总结

::: tip 学习建议
React 16 是一个成熟的版本，引入了 Fiber 架构和错误边界等新特性，为 React 的后续发展奠定了基础。通过学习 React 16，你可以掌握现代前端开发的核心技能。
:::
