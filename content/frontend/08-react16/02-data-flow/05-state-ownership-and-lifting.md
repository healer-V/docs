---
title: "状态归属与提升"
tags:
  - React
  - State
  - 组件通信
excerpt: "说明如何根据数据使用者和修改者确定 State 所有者，通过状态提升、Props 和业务回调组织父子及兄弟组件的数据流。"
date: 2026-07-30
---

# 状态归属与提升

组件只管理自己使用的数据时，State 可以留在组件内部。多个组件需要读取或修改同一份数据时，必须先确定唯一所有者，再通过 Props 和回调连接组件。

## 一、状态所有者

### 1. 谁应该拥有 State

State 的所有者负责保存数据、执行更新并把结果传给使用者。判断时回答三个问题：

1. 哪些组件读取这份数据？
2. 哪些用户操作会修改它？
3. 哪个组件能够同时覆盖这些读取者和修改入口？

| 使用情况 | 建议位置 |
|----------|----------|
| 只有一个组件使用 | 保留在该组件内部 |
| 父组件和一个子组件使用 | 通常放在父组件 |
| 多个兄弟组件使用 | 放在最近共同祖先 |
| 大量远距离组件使用 | 先判断组合是否足够，再考虑 Context |

不是所有 State 都应该放在页面根组件。所有者越高，依赖范围通常越大。

## 二、单一数据源

### 1. 同一事实只保存一份

父组件和子组件分别保存同一任务状态，会产生两个可能不一致的值：

```text
父组件 completed = false
子组件 completed = true
→ 页面无法确定哪一份代表真实状态
```

正确结构是父组件保存 `completed`，子组件通过 Props 读取：

```text
父组件 State
├─ completed → 状态文本组件
└─ completed → 操作按钮组件
```

当父组件更新 State，两个子组件在同一次渲染中接收一致数据。

### 2. 不复制 Props 到 State

下面的组件只在首次渲染时使用 `initialTitle`：

```jsx
/**
 * 演示 Props 只用于初始化 State。
 * @param {{initialTitle: string}} props 初始标题。
 * @returns {React.ReactElement} 当前 State 中的标题。
 */
function TaskEditor({ initialTitle }) {
  const [title, setTitle] = useState(initialTitle);

  return <input value={title} onChange={
    /**
     * 同步编辑值。
     * @param {React.ChangeEvent<HTMLInputElement>} event 输入事件。
     * @returns {void} 更新本地标题。
     */
    (event) => setTitle(event.currentTarget.value)
  } />;
}
```

父组件以后传入新的 `initialTitle`，现有 `title` 不会自动重置。`useState` 的初始值只用于建立状态。若子组件不需要独立编辑，应直接显示 Props；若确实需要草稿，应明确保存、取消和切换记录时的重置规则。

## 三、判断归属

### 1. 从最小可用位置开始

状态放置遵循“覆盖所有使用者的最近位置”：

```text
只有 TaskSearch 使用 query
→ query 放在 TaskSearch

TaskSearch 修改 query，TaskList 使用 query
→ query 提升到两者共同父组件 TaskPage
```

如果数据能够从现有 Props 或 State 直接计算，它没有独立所有者，因为不需要成为 State。

### 2. 区分事实与派生结果

假设已有 `tasks` 和 `query`：

```jsx
// 每次渲染从源数据计算筛选结果。
const visibleTasks = tasks.filter(
  // 只保留标题包含查询词的任务。
  (task) => task.title.includes(query)
);
```

`tasks` 与 `query` 是源数据，`visibleTasks` 是派生结果。不要再使用 `setVisibleTasks` 同步第三份 State，否则任何源数据变化都可能造成过期结果。

## 四、状态提升

### 1. 提升到最近共同祖先

状态提升包含三个步骤：

1. 从原组件移除共享 State；
2. 在最近共同祖先创建 State；
3. 通过 Props 把值和业务回调传给子组件。

```jsx
/**
 * 显示受父组件控制的搜索框。
 * @param {{query: string, onQueryChange: (query: string) => void}} props
 * query 为当前查询词，onQueryChange 接收下一查询词。
 * @returns {React.ReactElement} 受控搜索框。
 */
function TaskSearch({ query, onQueryChange }) {
  /**
   * 把输入值报告给数据所有者。
   * @param {React.ChangeEvent<HTMLInputElement>} event 输入变化事件。
   * @returns {void} 调用父组件回调。
   */
  function handleChange(event) {
    onQueryChange(event.currentTarget.value);
  }

  return (
    <input
      type="search"
      value={query}
      onChange={handleChange}
      placeholder="搜索任务"
    />
  );
}
```

`TaskSearch` 不再拥有 `query`，它由父组件控制。

## 五、回调传递操作意图

### 1. 子组件不修改父级数据

子组件通过回调报告业务意图，而不是取得父组件的更新函数后随意组织数据：

```jsx
/**
 * 提供完成任务的操作入口。
 * @param {{taskId: string, onComplete: (taskId: string) => void}} props
 * taskId 为目标任务，onComplete 表示完成意图。
 * @returns {React.ReactElement} 完成按钮。
 */
function CompleteButton({ taskId, onComplete }) {
  // 把当前任务 ID 报告给父组件。
  const handleClick = () => {
    onComplete(taskId);
  };

  return (
    <button type="button" onClick={handleClick}>
      完成任务
    </button>
  );
}
```

`onComplete(taskId)` 比直接传 `setTasks` 更稳定。父组件保留如何更新任务、是否校验和是否记录日志的决定权。

## 六、兄弟组件协作

### 1. 通过共同父组件连接

兄弟组件不能直接读取彼此的局部 State。共同父组件保存共享数据：

```text
TaskPage 拥有 query
├─ TaskSearch 读取 query，报告新查询词
└─ TaskList 读取根据 query 计算的任务
```

一个组件负责输入，另一个负责展示，父组件负责数据编排。

## 七、完整示例

```jsx
/**
 * 显示任务数组。
 * @param {{tasks: Array<{id: string, title: string}>}} props 可见任务。
 * @returns {React.ReactElement} 列表或空状态。
 */
function TaskList({ tasks }) {
  if (tasks.length === 0) {
    return <p>没有匹配任务。</p>;
  }

  return (
    <ul>
      {tasks.map(
        // 把每个任务转换为列表项。
        (task) => <li key={task.id}>{task.title}</li>
      )}
    </ul>
  );
}

/**
 * 拥有查询 State，并协调搜索框和列表。
 * @returns {React.ReactElement} 可筛选任务页面。
 */
function TaskPage() {
  const [query, setQuery] = useState("");
  const tasks = [
    { id: "task-104", title: "核对订单" },
    { id: "task-105", title: "复核退款" },
    { id: "task-106", title: "联系客户" }
  ];

  // 从源数据和查询词计算当前可见任务。
  const visibleTasks = tasks.filter(
    (task) => task.title.includes(query)
  );

  /**
   * 接收搜索组件报告的查询词。
   * @param {string} nextQuery 下一查询词。
   * @returns {void} 更新共享查询 State。
   */
  function handleQueryChange(nextQuery) {
    setQuery(nextQuery);
  }

  return (
    <main>
      <h1>任务中心</h1>
      <TaskSearch
        query={query}
        onQueryChange={handleQueryChange}
      />
      <p>匹配数量：{visibleTasks.length}</p>
      <TaskList tasks={visibleTasks} />
    </main>
  );
}
```

输入“订单”后，`TaskSearch` 把新值交给 `TaskPage`，父组件更新 `query`、重新计算 `visibleTasks`，`TaskList` 最终只显示“核对订单”。查询词只有一份 State。

## 八、提升边界

### 1. 状态过低或过高

| 问题 | 表现 | 调整 |
|------|------|------|
| 状态过低 | 兄弟组件无法读取，出现同步副本 | 提升到最近共同祖先 |
| 状态过高 | 无关组件也依赖页面级数据 | 下移到真正使用它的子树 |
| 保存过多 | 源数据和派生数据需要同步 | 删除可计算的 State |
| Props 层层传递 | 大量远距离组件需要同一数据 | 第 4 章评估 Context |
| 更新逻辑复杂 | 多个动作修改关联字段 | 第 4 章评估 Reducer |

状态提升是数据所有权调整，不等于所有状态全局化。

## 九、知识检查

| 检查项 | 正确结论 |
|--------|----------|
| State 所有者怎样确定 | 覆盖全部读取者和修改入口的最近组件 |
| 同一业务事实保存几份 | 一份 |
| 兄弟组件怎样共享状态 | 提升到共同父组件 |
| 子组件怎样请求修改 | 调用父组件传入的业务回调 |
| 筛选结果是否需要 State | 通常不需要，可从源数据计算 |
| Props 作为初始值后会自动同步吗 | 不会，只在状态初始化时使用 |
| 是否把所有 State 放根组件 | 不应该，只提升到必要位置 |

## 十、参考资料

- [React 旧版文档：Lifting State Up](https://legacy.reactjs.org/docs/lifting-state-up.html)
- [React 旧版文档：Thinking in React](https://legacy.reactjs.org/docs/thinking-in-react.html)
