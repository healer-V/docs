---
title: "Key 与组件身份"
tags:
  - React
  - Key
  - 组件身份
excerpt: "讲解 React 如何根据父级位置、元素类型和 Key 判断组件身份，并说明 State 保留、主动重置、列表移动和嵌套定义问题。"
date: 2026-07-31
---

# Key 与组件身份

## 一、组件身份

React 把 State 与组件在渲染树中的身份关联。身份主要由以下信息决定：

```text
父级中的位置 + 元素类型 + Key
```

JSX 变量名、组件函数参数和代码分支名称不会直接决定身份。

### 1. 同类型同位置

::: details 查看同类型同位置的示例代码
```jsx
/**
 * 根据模式显示任务编辑器。
 * @param {{ compact: boolean }} props 组件属性。
 * @returns {React.ReactElement} 编辑器区域。
 */
function TaskArea({ compact }) {
  return (
    <section>
      {compact
        ? <TaskEditor mode="compact" />
        : <TaskEditor mode="full" />}
    </section>
  );
}
```
:::

两种分支最终都在 `section` 的第一个子位置渲染 `TaskEditor`。React 保留同一个组件身份，因此编辑器 State 默认保留，只更新 `mode` Props。

### 2. 类型变化

```jsx
{editable
  ? <TaskEditor />
  : <TaskDetails />}
```

同一位置从 `TaskEditor` 变为 `TaskDetails`，React 卸载旧组件并挂载新组件。旧 State 和 Effect 被清理。

## 二、父级结构

### 1. 外层元素变化会替换子树

```jsx
// 前一次
<section>
  <TaskEditor />
</section>

// 下一次
<div>
  <TaskEditor />
</div>
```

父级宿主元素类型从 `section` 变为 `div`，其内部子树也会重新创建。即使 `TaskEditor` JSX 相同，祖先身份变化仍会重置它。

### 2. 保持稳定骨架

需要保留内部状态时，让条件只改变 Props 或局部内容，不随意改变外层类型：

```jsx
<section className={compact ? "task-area--compact" : "task-area--full"}>
  <TaskEditor mode={compact ? "compact" : "full"} />
</section>
```

稳定结构同时减少不必要的 DOM 替换。

## 三、Key

### 1. Key 补充位置信息

默认位置是“父级中的第几个子节点”。提供 `key` 后，React 使用 Key 区分同级组件。

```jsx
{selectedTaskId === 17
  ? <TaskEditor key="task-17" taskId={17} />
  : <TaskEditor key="task-28" taskId={28} />}
```

类型和位置相同，但 Key 不同，因此切换时 State 重置。

### 2. 主动重置表单

```jsx
<TaskEditor
  key={selectedTask.id}
  initialTask={selectedTask}
/>
```

选择不同任务后，React 创建新编辑器，`useState(initialTask.title)` 重新执行。适合整份局部草稿都属于特定实体的场景。

只需更新一个字段时，不必通过 Key 重建整个子树；显式 State 更新更精确。

## 四、列表身份

### 1. 稳定业务 ID

```jsx
<ul>
  {tasks.map(
    // 使用业务 ID 匹配同一任务。
    (task) => <TaskRow key={task.id} task={task} />
  )}
</ul>
```

排序、插入和删除后，具有同一 `task.id` 的 `TaskRow` 保持身份。

### 2. 索引 Key

```jsx
tasks.map(
  // 不稳定列表中不应使用位置作为身份。
  (task, index) => <TaskRow key={index} task={task} />
);
```

在开头插入任务后，旧索引 `0` 的组件会被复用于新的第一项。输入值、展开状态等局部 State 可能跟到错误数据。

索引只适合列表顺序固定、永不插入删除且条目没有独立 State 的静态集合。即使当前满足，也应优先使用已有业务 ID。

### 3. 随机 Key

```jsx
<TaskRow key={Math.random()} task={task} />
```

每次渲染 Key 都不同，React 每次卸载旧组件并挂载新组件：

- State 无法保留；
- 输入焦点丢失；
- Effect 反复清理和建立；
- DOM 被不必要替换。

Key 必须来自数据中的稳定身份，不应在渲染时生成。

## 五、条件位置

### 1. JSX 分支不等于树位置

```jsx
if (loading) {
  return <TaskPanel loading />;
}

return <TaskPanel loading={false} />;
```

两次返回的根位置和组件类型相同，State 可以保留。React 只比较最终元素树，不关心 JSX 写在哪个 `if` 分支。

### 2. 不同位置不会共享 State

```jsx
return (
  <main>
    {showPrimary && <TaskEditor />}
    {showSecondary && <TaskEditor />}
  </main>
);
```

两个编辑器位于两个兄弟位置，各自拥有独立 State。即使永远只显示其中一个，它们也不是同一默认位置。

需要显式表达同一槽位时：

```jsx
return (
  <main>
    {showPrimary
      ? <TaskEditor source="primary" />
      : <TaskEditor source="secondary" />}
  </main>
);
```

## 六、组件定义位置

### 1. 嵌套定义创建新类型

::: details 查看嵌套定义创建新类型的示例代码
```jsx
function TaskPage() {
  /**
   * 错误：每次 TaskPage 渲染都会创建新函数类型。
   * @returns {React.ReactElement} 编辑器。
   */
  function TaskEditor() {
    const [title, setTitle] = React.useState("");
    return <input value={title} readOnly />;
  }

  return <TaskEditor />;
}
```
:::

外层每次执行都会产生新的 `TaskEditor` 函数引用，React 把它视为不同组件类型，内部 State 重置。

组件应定义在模块顶层：

::: details 查看嵌套定义创建新类型的示例代码
```jsx
/**
 * 显示任务编辑器。
 * @returns {React.ReactElement} 标题输入框。
 */
function TaskEditor() {
  const [title, setTitle] = React.useState("");
  return <input value={title} readOnly />;
}

function TaskPage() {
  return <TaskEditor />;
}
```
:::

## 七、身份与资源

身份变化会触发完整卸载和挂载：

```text
旧组件
→ Effect cleanup
→ 类 componentWillUnmount
→ DOM 删除
→ 新组件 State 初始化
→ 新 DOM 提交
→ 挂载生命周期与 Effect
```

改变 Key 不只是“刷新数据”，还会丢失焦点、滚动位置和子树所有局部状态。使用前应确认这是期望行为。

## 八、判断表

| 前后结果 | State |
|----------|-------|
| 同一父级位置、同类型、同 Key | 保留 |
| 同一位置、不同组件类型 | 重置 |
| 祖先类型变化 | 子树重置 |
| 同类型但 Key 变化 | 重置 |
| 列表项稳定 Key 移动 | 随对应 Key 保留 |
| 嵌套定义产生新函数类型 | 重置 |

| 问题 | 原因 | 处理方式 |
|------|------|----------|
| 切换任务后旧草稿残留 | 同身份保留 State | 使用实体 Key 或显式重置 |
| 排序后输入值错行 | 使用索引 Key | 使用业务 ID |
| 每次渲染输入框清空 | 随机 Key 或嵌套组件定义 | 稳定 Key 和组件类型 |
| 改了外层标签后子状态消失 | 祖先子树被替换 | 保持稳定树骨架 |

Key 的本质是参与组件身份判断，不只是消除列表警告。
