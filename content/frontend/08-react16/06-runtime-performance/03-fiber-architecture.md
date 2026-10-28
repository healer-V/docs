---
title: "Fiber 架构"
tags:
  - React
  - Fiber
  - 渲染机制
excerpt: "从工作单元、父子兄弟关系、当前树与工作树解释 Fiber 架构，并区分可重新执行的 Render 阶段和同步不可中断的 Commit 阶段。"
date: 2026-07-31
---

# Fiber 架构

## 一、Fiber

### 1. Fiber 是工作单元

React 元素描述“希望得到什么界面”，Fiber 节点记录 React 为实现和更新这段界面需要维护的工作。

一个 Fiber 概念上关联：

- 元素或组件类型；
- 当前 Props 和待处理 Props；
- 组件 State 或 Hook 状态；
- 父节点、第一个子节点和下一个兄弟节点；
- 对应 DOM 或类组件实例；
- 本次更新需要提交的变更标记；
- 更新优先级和待处理工作。

这些内部字段不是公共 API，业务代码不能读取或修改。理解它们的目的，是解释 React 为什么区分工作阶段，以及组件为什么必须保持纯渲染。

### 2. 树关系

Fiber 使用父、子、兄弟指针表示组件树：

```text
TaskPage
└─ TaskPanel
   ├─ TaskFilters
   └─ TaskList
      ├─ TaskRow A
      └─ TaskRow B
```

可以简化为：

```text
TaskPanel.child   → TaskFilters
TaskFilters.sibling → TaskList
TaskList.child    → TaskRow A
TaskRow A.sibling → TaskRow B
```

React 能以工作单元为粒度遍历树，而不必依赖递归调用一次完成全部工作。

## 二、React 元素与 Fiber

### 1. 元素是一次描述

```jsx
<TaskRow task={task} />
```

这个 React 元素只描述类型和 Props。每次渲染都可以创建新元素对象。

### 2. Fiber 跨更新存在

当类型、位置和 Key 仍表示同一组件身份时，React 可以复用对应 Fiber，并保存：

- 类组件实例；
- Hook 状态链；
- 更新队列；
- DOM 节点引用；
- Effect 信息。

元素对象重新创建不等于组件 State 重置。组件身份变化才会创建不同 Fiber。

## 三、当前树与工作树

### 1. current

当前树表示已经提交到页面、用户正在看到的界面状态。

其中的 Fiber 关联现有 DOM、组件 State 和已生效的 Effect。工作树尚未提交前，事件处理和页面读取仍以 current 对应的已提交结果为准。

### 2. work-in-progress

收到更新后，React 基于当前树构建工作树。工作树保存候选结果和待提交变更，但不会立即成为页面。

```text
当前树 current
       │
       ├─ 收到 State 更新
       ↓
工作树 work-in-progress
       │
       ├─ Render 完成
       ↓
Commit 后成为新的 current
```

如果 Render 失败，当前树仍然是已提交的一致界面。React 不会把只计算一半的工作树显示给用户。

## 四、Render 工作

### 1. 处理组件

Render 阶段遍历 Fiber 工作单元，大致完成：

1. 处理当前组件更新队列；
2. 执行函数组件或类组件 `render()`；
3. 得到新的子元素；
4. 与旧子 Fiber 协调；
5. 创建或复用子 Fiber；
6. 标记需要提交的变更。

这段过程不应修改 DOM。

### 2. 可以重新执行

Fiber 架构允许 React 把 Render 工作拆成单元，并为优先级、中断和恢复提供基础。即使 React 16.8 的传统根主要以同步方式提交应用，业务代码也不能依赖 Render 只执行一次。

以下代码都必须纯粹：

- 函数组件函数体；
- 类组件 `render()`；
- `getDerivedStateFromProps`；
- State updater；
- Reducer；
- `useMemo` 计算函数。

### 3. 为什么不能在 Render 中副作用

```jsx
function InvalidTaskPage() {
  // 错误：组件执行次数不等于提交次数。
  analytics.track("TaskPageRendered");
  return <TaskList />;
}
```

如果 Render 重试或最终未提交，日志已经发生，外部系统与实际页面不一致。应把提交同步放入 Effect，把用户行为日志放入事件处理函数。

## 五、Commit 工作

### 1. 提交已完成结果

Render 完成后，React 进入 Commit 阶段：

```text
提交前快照
→ 应用 DOM 插入、更新和删除
→ 更新 Ref
→ 调用挂载与更新生命周期
→ 执行布局 Effect
→ 安排被动 Effect
```

Commit 同步执行，不能中途暂停后让用户看到不完整 DOM。

### 2. 变更标记

Render 阶段为需要处理的 Fiber 标记工作，例如：

- 插入节点；
- 更新属性；
- 删除子树；
- 更新 Ref；
- 执行 Effect。

Commit 只遍历和应用已经确定的变更，而不重新决定组件应该渲染什么。

## 六、Hook 与 Fiber

函数组件没有持久 JavaScript 实例。React 把 Hook 状态与函数组件 Fiber 关联，并按调用顺序形成状态链。

```text
TaskEditor Fiber
├─ Hook 1：title State
├─ Hook 2：priority State
├─ Hook 3：input Ref
└─ Hook 4：Effect
```

条件调用 Hook 会改变链的位置，因此 React 无法把下一次调用与正确状态匹配。

类组件则由 Fiber 指向持久类实例，State 更新队列也与对应 Fiber 关联。

## 七、优先级边界

Fiber 架构为更新优先级和可中断 Render 奠定基础，但不能把 React 18 并发根的应用行为直接套到 React 16.8。

React 16.8 应用仍需遵守面向未来的约束：

- Render 保持纯粹；
- 不依赖组件执行次数；
- 不在不安全生命周期执行副作用；
- State 更新使用队列语义；
- DOM 操作放在 Commit 之后；
- 不读取 React 私有 Fiber 字段。

## 八、可观察结果

Fiber 本身不是业务调试 API，可以通过公开工具观察其效果：

| 现象 | 工具 |
|------|------|
| 哪些组件参与渲染 | React DevTools Profiler |
| 一次提交耗时 | Profiler 提交记录 |
| 哪些 DOM 实际变化 | 浏览器 Elements、Mutation 工具 |
| Effect 与清理顺序 | 控制台日志或测试 |
| State 是否因身份变化重置 | DevTools State 与 Key 检查 |

| 误区 | 正确结论 |
|------|----------|
| Fiber 就是 Virtual DOM 的新名称 | Fiber 是 React 工作与状态的数据结构 |
| 使用 Fiber 后所有更新自动异步 | React 16.8 传统根仍有明确同步边界 |
| Render 完成一半会显示半个页面 | 只有完整工作树进入 Commit |
| 可以读取 `_reactInternals` 完成功能 | 私有字段不稳定，不能作为业务 API |
| 组件函数执行一次就提交一次 | Render 可以执行而不产生 DOM 变更 |

Fiber 把树中的组件工作变成可管理单元，同时用 current 与工作树隔离已提交界面和候选界面。
