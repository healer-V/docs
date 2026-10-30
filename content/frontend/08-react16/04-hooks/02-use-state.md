---
title: "useState 与状态更新"
tags:
  - React
  - Hooks
  - useState
excerpt: "详细讲解 useState 的初始值、惰性初始化、更新函数、相同值跳过、对象数组更新、状态拆分和重置方式。"
date: 2026-07-31
---

# useState 与状态更新

## 一、useState

### 1. 调用形式

`useState` 为函数组件声明一项局部 State。

```text
const [state, setState] = React.useState(initialState);
```

| 组成部分 | 含义 |
|----------|------|
| `initialState` | 首次渲染使用的初始值，或惰性初始化函数 |
| `state` | 当前渲染对应的状态值 |
| `setState` | 提交下一状态并安排更新的函数 |
| 返回值 | 长度为 2 的数组，通常使用数组解构 |

::: details 查看调用形式的示例代码
```jsx
/**
 * 显示任务标题编辑框。
 * @returns {React.ReactElement} 受控输入框。
 */
function TaskTitleEditor() {
  const [title, setTitle] = React.useState("");

  /**
   * 同步输入框内容。
   * @param {React.ChangeEvent<HTMLInputElement>} event 输入事件。
   * @returns {void}
   */
  function handleChange(event) {
    setTitle(event.target.value);
  }

  return <input value={title} onChange={handleChange} />;
}
```
:::

每个 `TaskTitleEditor` 实例拥有独立 `title`。更新函数名称可以自定义，惯例是 `set` 加状态名称。

### 2. 初始值只用于首次渲染

后续渲染仍会计算调用表达式，但 React 会忽略新的普通初始值，继续返回当前 State。

```jsx
function TaskEditor({ initialTitle }) {
  const [title, setTitle] = React.useState(initialTitle);
  // initialTitle 后续变化不会自动覆盖 title。
}
```

`initialTitle` 表达“初始值”，不等于受控值。需要始终由父组件控制时，应直接读取 Props 并通过回调修改父组件状态。

## 二、惰性初始化

### 1. 初始化函数

初始值计算昂贵时，可以向 `useState` 传入函数。React 只在组件首次挂载时调用它。

::: details 查看初始化函数的示例代码
```jsx
/**
 * 从本地存储读取初始筛选条件。
 * @returns {string} 已保存的筛选条件。
 */
function readInitialFilter() {
  return window.localStorage.getItem("task-filter") || "all";
}

/**
 * 显示当前筛选条件。
 * @returns {React.ReactElement} 筛选条件文本。
 */
function TaskFilterState() {
  const [filter, setFilter] = React.useState(readInitialFilter);
  return <p>当前筛选：{filter}</p>;
}
```
:::

注意传入函数本身，而不是立即调用：

```jsx
// 每次渲染都会先执行函数，再把结果传给 useState。
React.useState(readInitialFilter());

// React 只在首次挂载时调用初始化函数。
React.useState(readInitialFilter);
```

初始化函数应保持纯粹，不修改外部数据。开发环境工具可能为了检查纯度而执行额外调用，业务逻辑不应依赖调用次数。

### 2. 保存函数值

如果 State 本身要保存一个函数，需要使用包装函数，否则 React 会把传入函数当作初始化器：

::: details 查看保存函数值的示例代码
```jsx
/**
 * 默认任务格式化函数。
 * @param {string} title 任务标题。
 * @returns {string} 格式化后的标题。
 */
function defaultFormatter(title) {
  return title.trim();
}

const [formatter, setFormatter] = React.useState(
  /**
   * 返回要保存的函数值。
   * @returns {(title: string) => string} 默认格式化函数。
   */
  () => defaultFormatter
);
```
:::

## 三、更新 State

### 1. 直接传入下一值

下一值不依赖旧 State 时，直接调用更新函数：

```jsx
const [status, setStatus] = React.useState("pending");

/**
 * 把状态设置为已完成。
 * @returns {void}
 */
function handleComplete() {
  setStatus("completed");
}
```

更新函数不会返回下一 State，也不能通过其返回值判断提交是否完成。

### 2. 函数式更新

下一值依赖旧 State 时，传入 updater 函数：

::: details 查看函数式更新的示例代码
```jsx
const [retryCount, setRetryCount] = React.useState(0);

/**
 * 增加一次重试计数。
 * @returns {void}
 */
function handleRetry() {
  setRetryCount(
    /**
     * 根据前一计数计算下一值。
     * @param {number} previousCount 前一计数。
     * @returns {number} 下一计数。
     */
    (previousCount) => previousCount + 1
  );
}
```
:::

updater 的参数是更新队列中的前一结果，不一定等于当前事件闭包读取到的 State。

连续提交三次函数式更新：

::: details 查看函数式更新的示例代码
```jsx
/**
 * 根据前一值增加计数。
 * @param {number} previousCount 前一计数。
 * @returns {number} 下一计数。
 */
function addOne(previousCount) {
  return previousCount + 1;
}

setRetryCount(addOne);
setRetryCount(addOne);
setRetryCount(addOne);
```
:::

初始值为 `0` 时，下一次结果为 `3`。

### 3. 更新函数没有回调参数

函数组件的 State 更新函数不支持类组件 `setState` 的第二个提交回调：

```jsx
// 错误：第二个参数不会作为提交后回调执行。
setStatus("completed", handleAfterComplete);
```

提交后需要与外部系统同步时使用 Effect；由当前用户操作直接引起的业务行为通常直接放在事件处理函数中。

## 四、更新结果

### 1. 当前渲染仍读取旧值

调用更新函数后，当前事件函数中的 State 仍是当前渲染快照：

::: details 查看当前渲染仍读取旧值的示例代码
```jsx
const [count, setCount] = React.useState(0);

/**
 * 提交下一计数并输出当前快照。
 * @returns {void}
 */
function handleClick() {
  console.log(count); // 0
  setCount(count + 1);
  console.log(count); // 仍是 0
}
```
:::

更新会让 React 创建新的渲染。新渲染中的 `count` 才是 `1`。

### 2. 相同值可以跳过更新

如果下一 State 与当前 State 使用 `Object.is` 比较相同，React 可以跳过对子树的重新渲染。

```jsx
setStatus("pending"); // 当前已经是 "pending" 时没有可见变化
```

直接修改对象后把同一引用传回更新函数，既破坏不可变约束，也可能被视为相同值：

```jsx
// 错误
task.completed = true;
setTask(task);

// 正确
setTask({
  ...task,
  completed: true
});
```

### 3. React 16.8 批处理

React 管理的事件中，多项 State 更新通常会在事件结束后统一处理。React 16.8 不具备 React 18 覆盖 Promise、定时器等来源的默认自动批处理范围。

业务代码应使用函数式更新表达先后关系，不依赖固定的重新渲染次数。

## 五、对象 State

### 1. Hook 更新会替换整个值

`useState` 更新函数不会像类组件 `setState` 那样浅合并对象。提交新对象时必须保留需要的字段。

::: details 查看Hook 更新会替换整个值的示例代码
```jsx
const [task, setTask] = React.useState({
  title: "核对订单",
  priority: "normal",
  completed: false
});

/**
 * 更新任务标题并保留其他字段。
 * @param {React.ChangeEvent<HTMLInputElement>} event 输入事件。
 * @returns {void}
 */
function handleTitleChange(event) {
  const nextTitle = event.target.value;

  setTask(
    /**
     * 复制前一任务并替换标题。
     * @param {{ title: string, priority: string, completed: boolean }} previousTask 前一任务。
     * @returns {{ title: string, priority: string, completed: boolean }} 下一任务。
     */
    (previousTask) => ({
      ...previousTask,
      title: nextTitle
    })
  );
}
```
:::

若调用 `setTask({ title: nextTitle })`，`priority` 和 `completed` 不会自动保留。

### 2. 拆分相关性较低的 State

总是一起变化的字段可以放在一个对象中；变化原因不同的值可以拆成多项 State：

```jsx
const [task, setTask] = React.useState({
  title: "",
  priority: "normal"
});
const [saving, setSaving] = React.useState(false);
const [error, setError] = React.useState(null);
```

任务草稿、请求状态和错误信息具有不同变化时机，拆分后更新不需要反复复制无关字段。

## 六、数组 State

### 1. 添加和删除

::: details 查看添加和删除的示例代码
```jsx
const [tasks, setTasks] = React.useState([]);

/**
 * 追加一条任务。
 * @param {{ id: number, title: string }} task 新任务。
 * @returns {void}
 */
function addTask(task) {
  setTasks(
    /**
     * 在前一数组末尾追加任务。
     * @param {Array<{ id: number, title: string }>} previousTasks 前一任务数组。
     * @returns {Array<{ id: number, title: string }>} 下一任务数组。
     */
    (previousTasks) => [...previousTasks, task]
  );
}

/**
 * 删除指定任务。
 * @param {number} taskId 任务 ID。
 * @returns {void}
 */
function removeTask(taskId) {
  setTasks(
    /**
     * 过滤掉目标任务。
     * @param {Array<{ id: number, title: string }>} previousTasks 前一任务数组。
     * @returns {Array<{ id: number, title: string }>} 下一任务数组。
     */
    (previousTasks) => previousTasks.filter(
      // 保留非目标任务。
      (task) => task.id !== taskId
    )
  );
}
```
:::

### 2. 更新数组项

::: details 查看更新数组项的示例代码
```jsx
/**
 * 把指定任务标记为已完成。
 * @param {number} taskId 任务 ID。
 * @returns {void}
 */
function completeTask(taskId) {
  setTasks(
    /**
     * 替换目标任务对象。
     * @param {Array<{ id: number, title: string, completed: boolean }>} previousTasks 前一数组。
     * @returns {Array<{ id: number, title: string, completed: boolean }>} 下一数组。
     */
    (previousTasks) => previousTasks.map(
      // 只为目标任务创建新对象。
      (task) => (
        task.id === taskId
          ? { ...task, completed: true }
          : task
      )
    )
  );
}
```
:::

不要对 State 数组直接调用 `push`、`splice`、`sort` 或 `reverse`。确实需要排序时先复制数组。

## 七、重置 State

### 1. 显式恢复初始值

::: details 查看显式恢复初始值的示例代码
```jsx
const initialDraft = {
  title: "",
  priority: "normal"
};

const [draft, setDraft] = React.useState(initialDraft);

/**
 * 恢复空白草稿。
 * @returns {void}
 */
function resetDraft() {
  setDraft(initialDraft);
}
```
:::

常量对象不能在其他位置被修改，否则重置值也会被污染。

### 2. 通过 Key 重建组件

父组件给子组件提供不同 `key` 时，React 会把它视为新组件并重新执行 State 初始化：

```jsx
<TaskEditor key={selectedTaskId} taskId={selectedTaskId} />
```

这种方式适合“切换实体后整份局部状态都应重置”的场景。只需重置一个字段时，显式更新更清楚。

## 八、常见问题

| 问题 | 原因 | 处理方式 |
|------|------|----------|
| 连续计数丢失 | 多次更新都使用同一闭包值 | 使用函数式更新 |
| 更新对象后字段消失 | Hook 更新替换整个值 | 展开前一对象 |
| 修改数组后界面不更新 | 复用同一数组引用 | 创建新数组 |
| Props 变化但 State 不变 | 初始值只在首次挂载使用 | 改为受控值、显式同步或使用 Key |
| 想使用第二个回调参数 | Hook setter 不支持提交回调 | 使用 Effect 或事件逻辑 |
| State 之间持续同步 | 保存了可以计算的派生数据 | 渲染时直接计算 |

`useState` 的重点不是“保存一个变量”，而是让 React 管理跨渲染状态，并通过更新函数创建下一次渲染。
