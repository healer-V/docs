---
title: "高阶组件与 Render Props"
tags:
  - React
  - 高阶组件
  - Render Props
excerpt: "讲解高阶组件和 Render Props 的定义、参数、Props 透传、Ref 与静态属性边界，并说明它们与自定义 Hook 的选择关系。"
date: 2026-07-31
---

# 高阶组件与 Render Props

## 一、高阶组件

### 1. 定义

高阶组件（Higher-Order Component，HOC）是接收一个组件并返回新组件的函数。

```text
const EnhancedComponent = higherOrderComponent(WrappedComponent);
```

| 组成部分 | 含义 |
|----------|------|
| `WrappedComponent` | 被增强的原组件 |
| `higherOrderComponent` | 负责组合逻辑的普通函数 |
| `EnhancedComponent` | 可以在 JSX 中使用的新组件 |

HOC 不是 React 专用语法，而是一种组件组合模式。React 只负责渲染 HOC 返回的组件。

### 2. 权限 HOC

下面的 HOC 为任意组件增加权限判断：

```jsx
/**
 * 为组件增加权限检查。
 * @param {React.ComponentType<any>} WrappedComponent 被保护的组件。
 * @returns {React.ComponentType<any>} 带权限判断的增强组件。
 */
function withPermission(WrappedComponent) {
  /**
   * 根据 allowed 决定是否渲染原组件。
   * @param {{ allowed: boolean, [key: string]: unknown }} props 增强组件属性。
   * @returns {React.ReactElement} 权限提示或原组件。
   */
  function WithPermission({ allowed, ...restProps }) {
    if (!allowed) {
      return <p>没有操作权限</p>;
    }

    return <WrappedComponent {...restProps} />;
  }

  const wrappedName = WrappedComponent.displayName || WrappedComponent.name || "Component";
  WithPermission.displayName = `withPermission(${wrappedName})`;

  return WithPermission;
}
```

使用：

```jsx
/**
 * 显示删除任务按钮。
 * @param {{ taskId: number, onDelete: (taskId: number) => void }} props 组件属性。
 * @returns {React.ReactElement} 删除按钮。
 */
function DeleteTaskButton({ taskId, onDelete }) {
  /**
   * 报告当前任务删除操作。
   * @returns {void}
   */
  function handleDelete() {
    onDelete(taskId);
  }

  return (
    <button type="button" onClick={handleDelete}>
      删除任务
    </button>
  );
}

const ProtectedDeleteTaskButton = withPermission(DeleteTaskButton);

const element = (
  <ProtectedDeleteTaskButton
    allowed={false}
    taskId={17}
    onDelete={handleDeleteTask}
  />
);
```

`allowed` 由 HOC 使用，其他 Props 通过 `restProps` 原样传给 `DeleteTaskButton`。

## 二、HOC 设计规则

### 1. 不修改原组件

HOC 应返回一个新组件，不修改传入组件的原型、生命周期或静态字段。

```jsx
// 错误：直接覆盖传入类组件的方法。
function invalidEnhance(WrappedComponent) {
  WrappedComponent.prototype.componentDidMount = function componentDidMount() {
    console.log("已挂载");
  };

  return WrappedComponent;
}
```

多个 HOC 修改同一原组件时会互相覆盖，也无法安全应用于函数组件。正确方式是在新组件中组合原组件。

### 2. 透传无关 Props

HOC 只消费自身协议字段，其余 Props 应传给原组件：

```jsx
function WithLoading({ loading, ...wrappedProps }) {
  if (loading) {
    return <p>加载中</p>;
  }

  return <WrappedComponent {...wrappedProps} />;
}
```

如果 HOC 忘记透传 `className`、事件回调或业务数据，增强组件会改变原组件接口。

### 3. 避免 Props 冲突

HOC 注入的 Props 可能与调用者传入字段同名。应明确覆盖策略：

```jsx
// injectedUser 放在后面，会覆盖调用者提供的 user。
<WrappedComponent {...props} user={currentUser} />
```

更稳妥的方式是使用具有业务含义且不易冲突的字段，或在公共 API 中明确该字段由 HOC 拥有。

### 4. 不在 render 中创建 HOC

```jsx
function InvalidPage() {
  // 错误：每次渲染都创建新的组件类型。
  const EnhancedList = withPermission(TaskList);
  return <EnhancedList allowed />;
}
```

新类型会让 React 卸载旧子树并挂载新子树，内部 State 也会重置。HOC 应在模块顶层创建。

## 三、HOC 边界

### 1. Ref 不会作为普通 Props 透传

`ref` 是 React 特殊属性，`<EnhancedComponent ref={ref} />` 默认指向 HOC 外层组件，而不是被包装组件。

需要把 Ref 转发到内部组件时，HOC 本身必须使用 `React.forwardRef` 并约定独立属性名：

```jsx
/**
 * 为组件增加日志并转发 Ref。
 * @param {React.ComponentType<any>} WrappedComponent 被包装组件。
 * @returns {React.ForwardRefExoticComponent<any>} 支持 Ref 的增强组件。
 */
function withLog(WrappedComponent) {
  const WithLog = React.forwardRef(
    /**
     * 记录渲染并把 forwardedRef 传给原组件。
     * @param {object} props 增强组件属性。
     * @param {React.Ref<any>} forwardedRef 外部 Ref。
     * @returns {React.ReactElement} 原组件元素。
     */
    (props, forwardedRef) => {
      console.log("渲染增强组件");
      return <WrappedComponent {...props} ref={forwardedRef} />;
    }
  );

  return WithLog;
}
```

原组件必须能够接收 Ref，例如类组件或另一个 `forwardRef` 组件。

### 2. 静态属性不会自动复制

```jsx
TaskList.pageSize = 20;
const EnhancedTaskList = withPermission(TaskList);
```

`EnhancedTaskList.pageSize` 不会自动存在。确实需要保留自定义静态字段时，可以显式复制，或使用 `hoist-non-react-statics` 等经过验证的工具。React 自身的 `displayName`、`propTypes` 等静态字段不能盲目全部复制。

### 3. 包装层级

多个 HOC 组合会产生较深组件树：

```jsx
const EnhancedTaskList = withPermission(
  withLoading(
    withTracking(TaskList)
  )
);
```

React DevTools 中会看到多个包装层，Props 类型和错误栈也更复杂。维护旧代码时先确认每层实际职责，再决定是否迁移。

## 四、Render Props

### 1. 定义

Render Props 是把一个返回 React 内容的函数作为 Props，让逻辑组件把状态和操作交给调用者决定如何渲染。

```text
<LogicComponent render={(state) => <View state={state} />} />
```

函数也可以通过 `children` 传入：

```jsx
<LogicComponent>
  {(state) => <View state={state} />}
</LogicComponent>
```

### 2. 任务选择示例

逻辑组件管理选中任务，不决定列表外观：

```jsx
/**
 * 管理选中任务并通过 render 暴露状态。
 * @param {{
 *   initialTaskId?: number,
 *   render: (state: {
 *     selectedTaskId: number | null,
 *     selectTask: (taskId: number) => void
 *   }) => React.ReactNode
 * }} props 组件属性。
 * @returns {React.ReactNode} render 函数返回的内容。
 */
function TaskSelection({ initialTaskId = null, render }) {
  const [selectedTaskId, setSelectedTaskId] = React.useState(initialTaskId);

  /**
   * 选择指定任务。
   * @param {number} taskId 任务 ID。
   * @returns {void}
   */
  function selectTask(taskId) {
    setSelectedTaskId(taskId);
  }

  return render({
    selectedTaskId,
    selectTask
  });
}
```

调用者决定界面：

```jsx
/**
 * 根据任务选择状态渲染按钮列表。
 * @param {{
 *   selectedTaskId: number | null,
 *   selectTask: (taskId: number) => void
 * }} selection 当前选择状态。
 * @returns {React.ReactElement} 任务按钮列表。
 */
function renderTaskSelection(selection) {
  return (
    <ul>
      {tasks.map(
        // 为每条任务创建选择按钮。
        (task) => {
          /**
           * 选择当前任务。
           * @returns {void}
           */
          function handleSelect() {
            selection.selectTask(task.id);
          }

          return (
            <li key={task.id}>
              <button
                type="button"
                aria-pressed={selection.selectedTaskId === task.id}
                onClick={handleSelect}
              >
                {task.title}
              </button>
            </li>
          );
        }
      )}
    </ul>
  );
}

const element = <TaskSelection render={renderTaskSelection} />;
```

### 3. children 函数

```jsx
<TaskSelection>
  {renderTaskSelection}
</TaskSelection>
```

组件必须明确 `children` 是函数，而不是普通 React 节点，并在实现中调用 `children(state)`。

## 五、Render Props 边界

### 1. 函数引用

在 JSX 中内联创建 Render Props 函数时，每次父组件渲染都会产生新引用。只有逻辑组件使用 `PureComponent` 或记忆化比较时，这才可能导致额外渲染；应通过测量决定是否提取或使用 `useCallback`。

普通组件本来就会随父组件重新渲染，此时稳定函数引用不会自动减少工作。优化前需要先确认 Render Props 函数引用确实破坏了已有的浅比较边界。

### 2. 嵌套层级

多个 Render Props 组合会形成嵌套：

```jsx
<CurrentUser>
  {(user) => (
    <TaskSelection>
      {(selection) => (
        <TaskList user={user} selection={selection} />
      )}
    </TaskSelection>
  )}
</CurrentUser>
```

嵌套会增加缩进和变量作用域。自定义 Hook 可以让函数组件在同一层读取这些逻辑结果。

## 六、模式选择

| 场景 | HOC | Render Props | 自定义 Hook |
|------|-----|--------------|-------------|
| 增强无法修改的旧组件 | 适合 | 可以 | 组件内部无法接入时不适用 |
| 调用者决定渲染结构 | 间接 | 适合 | 由组件直接渲染 |
| 复用 Hook 状态逻辑 | 包装层较多 | 嵌套较多 | 函数组件优先 |
| 需要支持类组件调用者 | 适合 | 适合 | 类组件不能直接调用 |
| 维护旧 React 代码 | 常见 | 常见 | 可渐进迁移 |

HOC 和 Render Props 在 React 16.8 仍是有效模式，尤其用于维护类组件和第三方库接口。新函数组件复用状态逻辑时，自定义 Hook 通常具有更少包装层。
