---
title: "State 更新规则"
tags:
  - React
  - State
  - 不可变更新
excerpt: "讲解基本值、对象和数组 State 的正确更新方式，以及函数式更新、派生数据和禁止直接修改 State 的原因。"
date: 2026-07-30
---

# State 更新规则

更新 State 的核心不是“改掉原值”，而是根据当前数据提交下一份状态。

## 一、State 视为只读

### 1. 通过更新函数提交变化

当前渲染读取到的 State 不应直接修改。基本值使用更新函数传入下一值：

```jsx
const [status, setStatus] = useState("pending");

// 提交下一状态，不直接给 status 赋值。
const handleComplete = () => {
  setStatus("completed");
};
```

不要写 `status = "completed"`。状态变量来自数组解构，即使改成其他声明方式，普通赋值也不会通知 React。

### 2. 当前渲染值不会立即改变

更新函数安排后续渲染，当前事件处理函数仍读取当前渲染的值：

```jsx
// 演示更新前后当前闭包中的值保持不变。
const handleComplete = () => {
  console.log(status);
  setStatus("completed");
  console.log(status);
};
```

若点击前 `status` 是 `"pending"`，两条日志都是 `"pending"`。下一次组件执行才会读取 `"completed"`。

## 二、更新基本值

### 1. 直接传入下一值

下一值与旧值无关时，直接提交值：

```jsx
const [selectedTab, setSelectedTab] = useState("pending");

// 选择固定的已完成标签。
const handleShowCompleted = () => {
  setSelectedTab("completed");
};
```

字符串、数字、布尔值和 `null` 都可以直接作为下一状态。

### 2. 根据旧值更新

下一值依赖旧值时，传入更新函数：

```jsx
const [count, setCount] = useState(0);

// 根据 React 提供的上一状态计算下一数值。
const handleIncrement = () => {
  setCount((previousCount) => previousCount + 1);
};
```

更新函数接收 React 处理到当前更新时的上一状态，并返回下一状态。切换布尔值、累计数量时优先使用这种形式：

```jsx
// 根据上一状态切换布尔值。
const handleToggle = () => {
  setCompleted((previousCompleted) => !previousCompleted);
};
```

## 三、更新对象

### 1. 创建新对象

`useState` 的更新函数会替换整个状态值，不会自动合并对象。更新一个字段时需要保留其他字段：

```jsx
const [task, setTask] = useState({
  title: "核对订单",
  priority: 2,
  completed: false
});

// 复制原对象并覆盖 completed 字段。
const handleComplete = () => {
  setTask((previousTask) => ({
    ...previousTask,
    completed: true
  }));
};
```

新对象的 `completed` 是 `true`，`title` 和 `priority` 保持不变。展开必须写在覆盖字段之前，否则旧值会覆盖新值。

下面的写法会丢失其他字段：

```jsx
// 错误：下一状态只剩 completed。
setTask({ completed: true });
```

### 2. 嵌套对象逐层复制

只要某一层对象包含发生变化的后代，该层就需要创建新对象：

```jsx
const [task, setTask] = useState({
  title: "核对订单",
  assignee: {
    id: "user-7",
    name: "林晓"
  }
});

// 同时复制 task 和发生变化的 assignee。
const handleRename = () => {
  setTask((previousTask) => ({
    ...previousTask,
    assignee: {
      ...previousTask.assignee,
      name: "周宁"
    }
  }));
};
```

未变化的字段可以复用，变化路径上的对象必须产生新引用。

## 四、更新数组

### 1. 新增和删除

使用展开创建包含新项的新数组，使用 `filter` 创建删除后的新数组：

```jsx
const [tasks, setTasks] = useState([
  { id: "task-104", title: "核对订单" }
]);

// 在数组末尾增加新任务。
const handleAdd = () => {
  const newTask = { id: "task-105", title: "复核退款" };
  setTasks((previousTasks) => [...previousTasks, newTask]);
};

/**
 * 删除指定任务。
 * @param {string} taskId 要删除的任务 ID。
 * @returns {void} 提交删除后的任务数组。
 */
function removeTask(taskId) {
  setTasks(
    // 只保留 ID 不等于目标值的任务。
    (previousTasks) => previousTasks.filter(
      (task) => task.id !== taskId
    )
  );
}
```

不要对 State 数组调用 `push`、`pop`、`splice`，这些方法会修改原数组。

### 2. 修改数组中的一项

使用 `map` 保留未变化项，只替换目标对象：

```jsx
/**
 * 切换指定任务的完成状态。
 * @param {string} taskId 要更新的任务 ID。
 * @returns {void} 提交包含新任务对象的数组。
 */
function toggleTask(taskId) {
  setTasks(
    // 目标任务创建新对象，其他任务继续复用。
    (previousTasks) => previousTasks.map(
      (task) => task.id === taskId
        ? { ...task, completed: !task.completed }
        : task
    )
  );
}
```

新数组引用告诉 React 列表发生变化，新任务对象表示具体哪一项变化。

### 3. 复制后排序

`sort` 会修改原数组，因此先复制：

```jsx
// 复制数组后按标题排序。
const handleSort = () => {
  setTasks((previousTasks) => (
    [...previousTasks].sort(
      /**
       * 按中文标题进行本地化比较。
       * @param {{title: string}} left 左侧任务。
       * @param {{title: string}} right 右侧任务。
       * @returns {number} 排序比较结果。
       */
      (left, right) => left.title.localeCompare(right.title)
    )
  ));
};
```

## 五、直接修改为什么错误

### 1. 同一引用不能表达变化

下面的写法同时修改原对象并把同一引用传回：

```jsx
// 错误：修改 React 当前使用的对象。
const handleInvalidComplete = () => {
  task.completed = true;
  setTask(task);
};
```

问题包括：

- 旧渲染引用的数据被篡改；
- 新旧状态使用同一对象引用；
- React 可能跳过本次更新；
- 其他共享该对象的代码会看到意外变化；
- 历史日志和调试结果无法还原。

正确方式是根据旧数据创建能够表示变化的新对象或新数组。

## 六、派生结果

### 1. 能计算的值不重复存储

待处理数量可以从 `tasks` 计算，不需要另建 State：

```jsx
const [tasks, setTasks] = useState(initialTasks);

// 每次渲染直接从当前任务计算待处理数量。
const pendingCount = tasks.filter(
  (task) => !task.completed
).length;
```

如果同时保存 `tasks` 和 `pendingCount`，每次任务变化都要同步更新两份 State，容易产生不一致。State 只保存最小事实，统计、筛选和格式化结果在渲染中计算。

## 七、完整示例

```jsx
/**
 * 管理任务的新增、切换和删除。
 * @returns {React.ReactElement} 可更新的任务列表。
 */
function TaskList() {
  const [tasks, setTasks] = useState([
    { id: "task-104", title: "核对订单", completed: false }
  ]);

  // 增加一项新任务。
  const handleAdd = () => {
    setTasks((previousTasks) => [
      ...previousTasks,
      { id: "task-105", title: "复核退款", completed: false }
    ]);
  };

  /**
   * 切换指定任务。
   * @param {string} taskId 目标任务 ID。
   * @returns {void} 提交更新后的数组。
   */
  function handleToggle(taskId) {
    setTasks((previousTasks) => previousTasks.map(
      // 只替换目标任务对象。
      (task) => task.id === taskId
        ? { ...task, completed: !task.completed }
        : task
    ));
  }

  return (
    <section>
      <p>待处理：{tasks.filter(
        // 统计仍未完成的任务。
        (task) => !task.completed
      ).length}</p>
      <button type="button" onClick={handleAdd}>增加任务</button>
      <ul>
        {tasks.map(
          // 为每项任务生成带稳定 Key 的按钮。
          (task) => (
            <li key={task.id}>
              <button
                type="button"
                onClick={
                  // 点击时把当前任务 ID 传给更新函数。
                  () => handleToggle(task.id)
                }
              >
                {task.completed ? "恢复" : "完成"} {task.title}
              </button>
            </li>
          )
        )}
      </ul>
    </section>
  );
}
```

新增会创建新数组，切换会同时创建新数组和目标任务对象，待处理数量始终从当前任务计算。

## 八、知识检查

| 场景 | 正确方式 |
|------|----------|
| 下一值依赖旧值 | 传入函数式更新 |
| 更新对象字段 | 展开旧对象并覆盖字段 |
| 更新嵌套字段 | 变化路径逐层复制 |
| 数组新增 | 数组展开或 `concat` |
| 数组删除 | `filter` |
| 修改数组项 | `map` |
| 数组排序 | 复制后 `sort` |
| 统计和筛选结果 | 从当前 Props、State 直接计算 |

## 九、参考资料

- [React 旧版文档：Using the State Hook](https://legacy.reactjs.org/docs/hooks-state.html)
- [React 旧版文档：Immutability Helpers](https://legacy.reactjs.org/docs/update.html)
