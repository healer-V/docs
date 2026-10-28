---
title: "Virtual DOM 与协调过程"
tags:
  - React
  - 协调
  - Virtual DOM
excerpt: "讲解 React 元素树与浏览器 DOM 的关系，以及协调过程如何根据元素类型、位置和 Key 更新属性、复用组件或替换子树。"
date: 2026-07-31
---

# Virtual DOM 与协调过程

## 一、React 元素树

### 1. React 元素是界面描述

JSX 会产生 React 元素。元素是包含类型、Props、Key 等信息的只读 JavaScript 对象，不是浏览器 DOM 节点。

```jsx
const element = (
  <article className="task-card">
    <h2>核对订单</h2>
  </article>
);
```

可以把结果简化理解为：

```js
{
  type: "article",
  props: {
    className: "task-card",
    children: {
      type: "h2",
      props: {
        children: "核对订单"
      }
    }
  }
}
```

React 每次渲染产生新的元素描述，再与上一次结果协调。

### 2. Virtual DOM 的边界

“Virtual DOM”通常指 React 在内存中维护的界面描述与工作结构。它不是浏览器 DOM 的完整复制，也不保证所有场景都比直接 DOM 操作更快。

React 的价值是让应用声明下一界面，框架根据规则计算宿主环境需要发生的变化。

## 二、协调假设

通用树比较成本很高。React 使用两个主要假设把比较控制在线性范围：

1. 不同类型的元素会产生不同子树；
2. 开发者可以用 `key` 标识同一层级中稳定的子元素。

协调结果决定：

- 复用现有 DOM 或组件实例；
- 更新属性；
- 插入、移动或删除节点；
- 保留或重置组件 State。

## 三、不同元素类型

### 1. 宿主元素类型变化

从 `div` 变为 `section` 时，React 会删除旧 `div` 子树并创建新 `section` 子树：

```jsx
// 前一次
<div>
  <TaskEditor />
</div>

// 下一次
<section>
  <TaskEditor />
</section>
```

根类型不同，内部 `TaskEditor` 也会被卸载和重新挂载，其局部 State 重置。

### 2. 组件类型变化

```jsx
// 前一次
<CompactTaskList tasks={tasks} />

// 下一次
<DetailedTaskList tasks={tasks} />
```

两个组件函数不同，即使输出相似 DOM，React 也视为不同子树。旧组件执行清理，新组件重新初始化 State。

## 四、相同宿主元素

### 1. 更新变化属性

类型相同的 DOM 元素会复用节点，只更新变化的属性：

```jsx
// 前一次
<button className="task-button" disabled={false}>
  保存
</button>

// 下一次
<button className="task-button task-button--saving" disabled>
  保存中
</button>
```

React 保留原 `button` DOM，更新 `class`、`disabled` 和文本。

### 2. 样式对象

`style` 变化时，React 比较样式字段并更新需要变化的部分：

```jsx
// 前一次
<div style={{ color: "black", fontSize: 14 }} />

// 下一次
<div style={{ color: "red", fontSize: 14 }} />
```

浏览器只需修改 `color`。但每次创建新对象仍会产生 Props 引用变化，是否影响组件优化取决于使用位置。

## 五、相同组件类型

### 1. 保留组件身份

同一位置仍是同一组件类型时，React 保留类实例或函数组件 Hook 状态，并用新 Props 执行更新。

```jsx
// 前一次
<TaskEditor taskId={17} />

// 下一次
<TaskEditor taskId={28} />
```

`TaskEditor` 的局部 State 默认保留。若切换 `taskId` 后草稿应重置，需要显式处理，或使用与任务 ID 对应的 `key`。

### 2. 类组件更新

类组件会在同一实例上接收新 Props，处理更新队列并执行更新生命周期。React 不会因为 Props 对象是新对象就自动创建新实例。

实例字段和 State 因此能够跨更新保留。只有元素类型、父级位置或 Key 改变导致组件身份变化时，旧实例才会卸载。

### 3. 函数组件更新

React 再次调用组件函数，并把保存的 Hook 状态按调用顺序提供给本次渲染。函数对象和局部变量重新创建，Hook State 不会因此消失。

每轮调用形成新的 Props 和 State 快照，事件函数会闭包捕获所属轮次的值。React 保存的是 Fiber 上的 Hook 状态链，不是上一次函数调用的局部执行环境。

## 六、子元素比较

### 1. 没有 Key 的同层比较

React 默认按同层位置比较子元素。

在列表末尾追加通常只需插入一个节点：

```text
旧：[A, B]
新：[A, B, C]
```

在开头插入且没有稳定 Key 时，位置对应关系全部变化：

```text
旧：[A, B]
新：[C, A, B]
```

React 可能把旧 A 当作新 C、旧 B 当作新 A，再插入 B。带局部 State 的列表项会出现身份错位。

### 2. Key 建立身份

```jsx
<ul>
  {tasks.map(
    // 使用业务 ID 标识同一条任务。
    (task) => <TaskRow key={task.id} task={task} />
  )}
</ul>
```

Key 只需在当前同级数组中唯一。React 用它匹配移动前后的同一列表项。

## 七、Key 与位置

### 1. Key 不是全局 ID

两个不同列表都可以使用相同任务 ID：

```jsx
<PendingList tasks={pendingTasks} />
<CompletedList tasks={completedTasks} />
```

每个列表只在自身兄弟集合中比较 Key。

### 2. Key 不作为 Props

`key` 由 React 协调使用，组件内部不能读取 `props.key`。组件也需要业务 ID 时应额外传入：

```jsx
<TaskRow key={task.id} taskId={task.id} task={task} />
```

### 3. 更换 Key 重置子树

```jsx
<TaskEditor key={selectedTaskId} taskId={selectedTaskId} />
```

`selectedTaskId` 变化后，React 认为旧编辑器与新编辑器身份不同，执行卸载和挂载，全部局部 State 重新初始化。

## 八、条件分支

JSX 写在不同代码分支中，不代表一定是不同位置。React 观察最终返回树。

```jsx
return (
  <section>
    {compact
      ? <TaskEditor mode="compact" />
      : <TaskEditor mode="full" />}
  </section>
);
```

两种结果在 `section` 的同一子位置都是 `TaskEditor`，因此 State 默认保留。

需要重置时可以：

```jsx
{compact
  ? <TaskEditor key="compact" mode="compact" />
  : <TaskEditor key="full" mode="full" />}
```

## 九、协调与性能

### 1. 组件执行不等于 DOM 重建

父组件重新渲染会使普通子组件再次执行，但协调可以复用原 DOM，只提交变化属性。React 性能分析应区分：

- 组件是否执行；
- Render 计算耗时；
- Commit 修改了哪些 DOM；
- 浏览器布局和绘制耗时。

### 2. 不依赖内部树结构

协调规则是应用设计依据，Fiber 字段、内部标记和遍历顺序不是公共 API。业务代码应依赖元素类型、Props、State 和 Key 等公开模型。

| 问题 | 原因 | 处理方式 |
|------|------|----------|
| 输入框内容跑到另一行 | 列表使用索引 Key，顺序变化 | 使用稳定业务 ID |
| 切换任务后草稿仍保留 | 同类型同位置保留 State | 使用 Key 或显式重置 |
| 小改动导致整片状态丢失 | 外层元素或组件类型变化 | 保持稳定类型结构 |
| 认为重新渲染会重建全部 DOM | 混淆 Render 与 Commit | 检查实际提交 |
| 给随机 Key 解决警告 | 每次都创建新身份 | 使用数据中的稳定 ID |

协调过程以类型、位置和 Key 判断身份，再决定复用、更新或替换。State 是否保留也是这套身份规则的结果。
