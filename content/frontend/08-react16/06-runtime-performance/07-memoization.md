---
title: "React.memo、useMemo 与 useCallback"
tags:
  - React
  - 性能优化
  - 记忆化
excerpt: "讲解 React.memo、useMemo 和 useCallback 分别缓存组件结果、计算值和函数引用，并说明依赖、比较成本及无效使用场景。"
date: 2026-07-31
---

# React.memo、useMemo 与 useCallback

## 一、记忆化

记忆化根据输入复用以前的结果，避免重复执行某项工作。React 提供三类常用工具：

| API | 缓存对象 | 典型用途 |
|-----|----------|----------|
| `React.memo` | 函数组件上一次渲染结果 | Props 不变时跳过子组件渲染 |
| `useMemo` | 一项计算结果 | 避免重复昂贵计算，或稳定对象引用 |
| `useCallback` | 函数引用 | 向记忆化子组件传递稳定回调 |

记忆化会增加依赖维护、比较、缓存和调试成本。只有测量证明重复工作有实际影响时才使用。

## 二、React.memo

### 1. 调用形式

```text
const MemoizedComponent = React.memo(Component, areEqual?)
```

| 参数或返回值 | 含义 |
|--------------|------|
| `Component` | 要记忆化的函数组件 |
| `areEqual` | 可选自定义 Props 比较函数 |
| 返回值 | 记忆化组件 |

默认情况下，React 对每个 Props 使用类似 `Object.is` 的浅比较。

```jsx
/**
 * 显示任务统计。
 * @param {{ pendingCount: number }} props 组件属性。
 * @returns {React.ReactElement} 任务统计。
 */
function TaskCount({ pendingCount }) {
  return <p>待处理：{pendingCount}</p>;
}

const MemoizedTaskCount = React.memo(TaskCount);
```

父组件重新渲染但 `pendingCount` 没有变化时，React 可以复用上一次结果。

### 2. 自身 State 和 Context 仍会更新

`React.memo` 只比较父组件传入的 Props。以下变化仍会触发组件渲染：

- 组件自己的 State；
- 组件读取的 Context；
- 祖先导致的其他内部订阅更新。

它不是让组件“永远只渲染一次”。

### 3. 对象和函数 Props

```jsx
<MemoizedTaskList
  filters={{ status: "pending" }}
  onSelect={(taskId) => setSelectedTaskId(taskId)}
/>
```

对象和函数每次父组件渲染都会创建新引用，因此浅比较判定 Props 变化，`memo` 失效。

可以：

- 直接传基本字段；
- 在父组件用 `useMemo` 稳定对象；
- 用 `useCallback` 稳定函数；
- 让子组件接收更小的业务接口。

不要为了让 `memo` 生效而把所有值都缓存。先确认子组件渲染确实昂贵。

## 三、自定义比较

### 1. areEqual

::: details 查看areEqual的示例代码
```jsx
const MemoizedTaskRow = React.memo(
  TaskRow,
  /**
   * 比较前后任务行 Props。
   * @param {{ task: { id: number, title: string, completed: boolean } }} previousProps 前一 Props。
   * @param {{ task: { id: number, title: string, completed: boolean } }} nextProps 下一 Props。
   * @returns {boolean} true 表示可以跳过渲染。
   */
  (previousProps, nextProps) => (
    previousProps.task.id === nextProps.task.id
    && previousProps.task.title === nextProps.task.title
    && previousProps.task.completed === nextProps.task.completed
  )
);
```
:::

`areEqual` 返回 `true` 表示 Props 相等、跳过渲染；这与类组件 `shouldComponentUpdate` 返回 `true` 表示继续更新相反。

### 2. 必须比较所有影响输出的 Props

遗漏函数 Props 可能让子组件继续使用旧闭包：

```jsx
// 错误比较：忽略 onSelect。
function areEqual(previousProps, nextProps) {
  return previousProps.task.id === nextProps.task.id;
}
```

自定义深比较可能比重新渲染更慢。只有数据结构有限、比较成本已知时使用。

## 四、useMemo

### 1. 调用形式

```text
const value = React.useMemo(calculateValue, dependencies);
```

| 参数或返回值 | 含义 |
|--------------|------|
| `calculateValue` | 返回要缓存结果的纯函数 |
| `dependencies` | 计算读取的响应式值 |
| 返回值 | 依赖未变时复用的结果 |

::: details 查看调用形式的示例代码
```jsx
const visibleTasks = React.useMemo(
  /**
   * 根据任务和筛选条件计算可见列表。
   * @returns {Array<Task>} 可见任务。
   */
  () => tasks.filter(
    // 保留符合当前筛选的任务。
    (task) => filter === "all" || task.status === filter
  ),
  [tasks, filter]
);
```
:::

只有 `tasks` 或 `filter` 变化时重新计算。

### 2. 适用情况

- 对大型数据执行已测量的昂贵过滤、排序或转换；
- 计算结果作为 `memo` 子组件 Props，需要稳定引用；
- 计算结果作为其他 Hook 依赖，需要避免无意义变化。

普通字符串拼接、少量数组遍历和简单条件不需要默认缓存。

### 3. 保持计算纯粹

`calculateValue` 在 Render 阶段执行，不能发请求、修改 DOM 或改变传入数据：

::: details 查看保持计算纯粹的示例代码
```jsx
// 错误：sort 直接修改 tasks。
const sortedTasks = React.useMemo(
  () => tasks.sort(comparePriority),
  [tasks]
);

// 正确：复制后排序。
const sortedTasks = React.useMemo(
  () => [...tasks].sort(comparePriority),
  [tasks]
);
```
:::

### 4. 不能依赖缓存保证正确性

`useMemo` 是性能优化，不是语义保证。代码即使重新计算也必须正确。需要跨渲染持久保存可变值时使用 Ref，需要保存影响界面的值时使用 State。

校验、权限判断和副作用触发不能依赖“计算只执行一次”。移除 `useMemo` 后行为应保持正确，变化的只能是计算成本。

## 五、useCallback

### 1. 调用形式

```text
const callback = React.useCallback(fn, dependencies);
```

`useCallback` 返回传入的函数引用，依赖未变时复用旧函数。

::: details 查看调用形式的示例代码
```jsx
const handleSelectTask = React.useCallback(
  /**
   * 选择指定任务。
   * @param {number} taskId 任务 ID。
   * @returns {void}
   */
  (taskId) => {
    setSelectedTaskId(taskId);
  },
  []
);
```
:::

State 更新函数引用稳定，因此依赖数组不需要包含 `setSelectedTaskId`。

### 2. useMemo 关系

以下两种写法概念上等价：

::: details 查看useMemo 关系的示例代码
```jsx
const handleSelect = React.useCallback(
  /**
   * 选择任务。
   * @param {number} taskId 任务 ID。
   * @returns {void}
   */
  (taskId) => setSelectedTaskId(taskId),
  []
);

const handleSelectWithMemo = React.useMemo(
  /**
   * 返回选择任务函数。
   * @returns {(taskId: number) => void} 选择函数。
   */
  () => (
    /**
     * 选择任务。
     * @param {number} taskId 任务 ID。
     * @returns {void}
     */
    (taskId) => setSelectedTaskId(taskId)
  ),
  []
);
```
:::

`useCallback` 只是缓存函数的专用写法，不会阻止函数在代码中被创建，也不会让调用结果自动缓存。

### 3. 依赖与闭包

```jsx
const handleSave = React.useCallback(
  /**
   * 保存当前草稿。
   * @returns {Promise<void>} 保存完成后的 Promise。
   */
  () => saveTask(draft),
  [draft]
);
```

缺少 `draft` 会让函数继续使用旧草稿。稳定引用不能以错误闭包为代价。

## 六、三者配合

父组件过滤列表并向记忆化子组件传操作：

::: details 查看三者配合的示例代码
```jsx
const visibleTasks = React.useMemo(
  /**
   * 计算可见任务。
   * @returns {Array<Task>} 可见任务。
   */
  () => filterTasks(tasks, filter),
  [tasks, filter]
);

const handleSelect = React.useCallback(
  /**
   * 选择任务。
   * @param {number} taskId 任务 ID。
   * @returns {void}
   */
  (taskId) => {
    setSelectedTaskId(taskId);
  },
  []
);

return (
  <MemoizedTaskList
    tasks={visibleTasks}
    onSelect={handleSelect}
  />
);
```
:::

只有在 `MemoizedTaskList` 渲染昂贵且父组件经常因无关状态更新时，这套组合才有明显价值。

## 七、记忆化失效

| 原因 | 示例 |
|------|------|
| 一个 Props 每次都是新对象 | `options={ { mode: "compact" } }` |
| JSX children 每次创建新元素 | `<Panel><TaskList /></Panel>` |
| 依赖包含每次新建对象 | `useMemo(fn, [options])` |
| 自定义比较遗漏字段 | 旧界面或旧回调 |
| 组件自身 State 更新 | 与 Props 比较无关 |
| Context value 变化 | 消费者必须更新 |

## 八、选择原则

| 问题 | 首选处理 |
|------|----------|
| 状态放得太高导致大树更新 | 状态下沉或拆分组件 |
| 列表数据量过大 | 分页或虚拟化 |
| 单次计算昂贵 | `useMemo` |
| 昂贵子组件收到相同 Props | `React.memo` |
| memo 子组件因回调引用更新 | `useCallback` |
| 没有测量到性能问题 | 不增加记忆化 |

记忆化应该减少已确认的重复成本。若组件渲染本身很轻，比较和维护缓存可能只会增加复杂度。
