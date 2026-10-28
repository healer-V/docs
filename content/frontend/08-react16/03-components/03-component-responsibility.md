---
title: "组件职责与状态归属"
tags:
  - React
  - 组件设计
  - State
excerpt: "说明如何从界面职责、数据使用者和用户操作确定组件边界与状态位置，并设计清晰的数据 Props 和事件 Props。"
date: 2026-07-31
---

# 组件职责与状态归属

## 一、组件职责

### 1. 组件负责什么

组件职责是组件对外承诺完成的一组相关工作。一个组件通常承担以下职责中的一种或少数几种：

| 职责 | 示例 |
|------|------|
| 展示数据 | 显示任务标题、状态和负责人 |
| 收集输入 | 编辑任务标题并报告输入变化 |
| 组织结构 | 把标题区、筛选区和列表区组合成页面 |
| 编排状态 | 保存筛选条件并计算可见任务 |
| 连接外部系统 | 订阅浏览器 API 或请求数据 |

组件并非只能做一件极小的事。判断职责是否集中，要看内部代码是否围绕同一业务概念和变化原因。

例如，任务列表负责选择空状态或列表、遍历任务并组织列表结构，这些工作都围绕“显示一组任务”：

```jsx
/**
 * 显示单条任务。
 * @param {{ task: { id: number, title: string, completed: boolean } }} props 组件属性。
 * @returns {React.ReactElement} 任务列表项。
 */
function TaskRow({ task }) {
  return (
    <li>
      <span>{task.title}</span>
      <span>{task.completed ? "已完成" : "待处理"}</span>
    </li>
  );
}

/**
 * 根据任务数组显示空状态或任务列表。
 * @param {{ tasks: Array<{ id: number, title: string, completed: boolean }> }} props 组件属性。
 * @returns {React.ReactElement} 空状态或任务列表。
 */
function TaskList({ tasks }) {
  if (tasks.length === 0) {
    return <p>暂无任务</p>;
  }

  return (
    <ul>
      {tasks.map(
        // 使用任务 ID 保持列表项身份稳定。
        (task) => <TaskRow key={task.id} task={task} />
      )}
    </ul>
  );
}
```

### 2. 展示与编排

展示组件主要通过 Props 接收数据和回调，不决定数据从哪里获取。编排组件保存页面状态、组合派生数据并把结果传给展示组件。

这不是必须采用的组件分类，而是一种检查职责的方法：

```text
TaskPage
├─ 保存 tasks 和 filter
├─ 计算 visibleTasks
└─ 把数据与操作传给子组件
   ├─ TaskFilter
   └─ TaskList
```

当一个展示组件开始发请求、读取路由、修改全局状态并处理大量布局时，它的复用范围和测试边界都会变得模糊。

## 二、状态归属

### 1. 根据使用者确定位置

State 应由能够覆盖全部读取者和修改入口的最近公共组件拥有。

判断一份数据的位置时，依次检查：

1. 哪些组件显示这份数据；
2. 哪些组件触发对它的修改；
3. 哪个共同父组件能同时连接这些组件；
4. 这份数据是否可以由已有 Props 或 State 计算得到。

| 使用范围 | 合适位置 |
|----------|----------|
| 只有输入框自身需要草稿 | 输入框组件内部 |
| 筛选器修改条件，列表读取条件 | 两者的共同父组件 |
| 多层页面都需要登录用户 | 页面上层或 Context Provider |
| 可以由任务和筛选条件计算的列表 | 渲染时计算，不另建 State |

### 2. 唯一数据源

同一业务值不应在多个组件中分别保存。重复 State 会产生同步问题：一个组件更新后，其他副本可能仍是旧值。

下面由 `TaskSearch` 保存查询词，列表也保存一个查询词，两个值没有可靠同步关系：

```jsx
// 错误结构
<TaskSearch />  // 内部保存 query
<TaskList />    // 内部也保存 query
```

正确结构是把查询词放到共同父组件：

```jsx
/**
 * 显示任务搜索和筛选结果。
 * @param {{ tasks: Array<{ id: number, title: string }> }} props 组件属性。
 * @returns {React.ReactElement} 搜索框和过滤后的任务列表。
 */
function SearchableTaskList({ tasks }) {
  const [query, setQuery] = React.useState("");

  const visibleTasks = tasks.filter(
    // 使用当前查询词过滤任务标题。
    (task) => task.title.includes(query)
  );

  /**
   * 同步搜索输入。
   * @param {React.ChangeEvent<HTMLInputElement>} event 输入事件。
   * @returns {void}
   */
  function handleQueryChange(event) {
    setQuery(event.target.value);
  }

  return (
    <section>
      <input
        value={query}
        onChange={handleQueryChange}
        aria-label="搜索任务"
      />
      <TaskList tasks={visibleTasks} />
    </section>
  );
}
```

`query` 只有一个来源，输入框读取它，列表结果也由它计算。

### 3. 不保存派生数据

如果数据可以从当前 Props 和 State 完整计算得到，通常不应再保存一份 State。

```jsx
// 不建议：visibleTasks 需要和 tasks、query 持续同步。
const [visibleTasks, setVisibleTasks] = React.useState([]);

// 建议：当前渲染直接计算。
const visibleTasks = tasks.filter(
  // 返回标题中包含查询词的任务。
  (task) => task.title.includes(query)
);
```

直接计算避免了缺失更新、更新顺序和重复数据源问题。只有计算确实昂贵并经过测量时，再考虑记忆化。

## 三、组件接口

### 1. 数据 Props

数据 Props 描述组件渲染所需的输入。接口名称应表达业务含义，而不是暴露调用者内部结构。

```jsx
// 接口过宽：组件能读取整个 pageModel。
<TaskBadge pageModel={pageModel} />

// 接口明确：只传递徽标需要的值。
<TaskBadge count={pageModel.pendingCount} tone="warning" />
```

对象 Props 并非错误。任务行确实需要任务的大部分字段时，传入 `task` 比拆成十个字段更清晰。关键是对象本身应与组件职责一致。

### 2. 事件 Props

子组件不应通过修改 Props 控制父组件数据，而应调用回调报告用户意图。事件 Props 通常使用 `on` 开头，名称描述已经发生或请求执行的业务动作。

```jsx
/**
 * 显示可完成的任务行。
 * @param {{
 *   task: { id: number, title: string, completed: boolean },
 *   onComplete: (taskId: number) => void
 * }} props 组件属性。
 * @returns {React.ReactElement} 可操作的任务行。
 */
function CompletableTaskRow({ task, onComplete }) {
  /**
   * 把当前任务 ID 报告给数据所有者。
   * @returns {void}
   */
  function handleComplete() {
    onComplete(task.id);
  }

  return (
    <li>
      <span>{task.title}</span>
      <button
        type="button"
        onClick={handleComplete}
        disabled={task.completed}
      >
        标记完成
      </button>
    </li>
  );
}
```

`onComplete` 传递的是业务意图和任务 ID，而不是把 `setTasks` 直接暴露给子组件。父组件可以决定如何更新、记录日志或拒绝操作。

### 3. 控制细节的层级

接口应把稳定职责封装在组件内部，把调用者确实需要控制的差异暴露为 Props。

| 差异 | 接口方式 |
|------|----------|
| 文本内容变化 | 字符串或数据 Props |
| 点击后的业务动作变化 | 回调 Props |
| 整片结构需要替换 | `children` 或具名 React 节点 |
| 内部实现细节 | 不暴露 |
| DOM 命令必须由父组件触发 | Ref，仅用于必要的命令式操作 |

## 四、拆分判断

### 1. 变化边界

如果两片界面由不同数据驱动、以不同频率变化或需要独立复用，拆成组件通常更合适。

例如任务统计只依赖任务数量，编辑表单依赖草稿字段。把两者拆开能让接口和更新原因更清楚，但不会自动阻止渲染；是否需要性能优化仍应测量。

### 2. 过度拆分

以下信号说明组件可能拆得过细：

- 组件名称无法表达独立含义；
- 组件只转发所有 Props，没有封装结构或行为；
- 修改一项需求必须同时改动多个极小文件；
- 父组件为了组合子组件而维护大量只使用一次的中间 Props；
- 阅读一段简单界面需要频繁跳转文件。

### 3. 设计检查

| 检查问题 | 合理结果 |
|----------|----------|
| 组件为什么存在 | 能用一个明确职责回答 |
| 状态由谁拥有 | 只有一个数据源 |
| 子组件如何修改数据 | 通过业务回调报告意图 |
| Props 是否最小 | 只包含职责需要的数据和操作 |
| 派生值是否重复保存 | 可以计算的值不放入 State |
| 拆分是否降低复杂度 | 边界比拆分前更容易理解 |

组件设计的核心不是文件数量，而是让数据所有权、修改入口和界面职责都能从接口中直接看出来。
