---
title: "useContext 与跨层通信"
tags:
  - React
  - Hooks
  - Context
excerpt: "讲解 Context 的创建、Provider、默认值和 useContext 读取方式，并说明 Provider 范围、更新传播、对象值和滥用边界。"
date: 2026-07-31
---

# useContext 与跨层通信

## 一、Context

### 1. Context 解决的问题

Context 让组件读取上层提供的共享值，而不必让每一层中间组件都声明并转发相同 Props。

适合 Context 的数据通常具有明确作用域：

- 当前登录用户；
- 主题、语言和时区；
- 一组复合组件的共享状态；
- 页面子树中的权限或配置；
- 状态容器提供的 State 与操作。

只跨一两层传递的数据继续使用 Props 更清晰。Context 会隐藏数据来源，也会扩大更新影响范围。

### 2. 创建 Context

`React.createContext(defaultValue)` 在组件外部创建 Context 对象：

```jsx
const ThemeContext = React.createContext("light");
```

| 项目 | 含义 |
|------|------|
| `defaultValue` | 没有匹配 Provider 时的读取结果 |
| 返回值 | 包含 `Provider` 和 `Consumer` 的 Context 对象 |
| 创建位置 | 模块顶层，避免每次渲染创建新 Context |

默认值不会与 Provider 的值合并。Provider 明确传入 `value={undefined}` 时，消费者读取到 `undefined`，不会退回默认值。

## 二、Provider

### 1. 提供值

`Context.Provider` 使用 `value` 属性向后代提供当前值：

::: details 查看提供值的示例代码
```jsx
/**
 * 为页面子树提供主题。
 * @returns {React.ReactElement} 主题 Provider。
 */
function Application() {
  return (
    <ThemeContext.Provider value="dark">
      <TaskPage />
    </ThemeContext.Provider>
  );
}
```
:::

`TaskPage` 以及其所有后代都可以读取 `"dark"`，除非中间存在另一个 `ThemeContext.Provider`。

### 2. 最近 Provider 生效

Context 按组件树查找最近的同一 Context Provider：

```jsx
<ThemeContext.Provider value="light">
  <Header />
  <ThemeContext.Provider value="dark">
    <TaskPanel />
  </ThemeContext.Provider>
</ThemeContext.Provider>
```

`Header` 读取 `"light"`，`TaskPanel` 读取 `"dark"`。不同 Context 对象即使默认值相同，也不是同一个数据通道。

## 三、useContext

### 1. 调用形式

```text
const value = React.useContext(ContextObject);
```

| 参数或返回值 | 含义 |
|--------------|------|
| `ContextObject` | `React.createContext` 返回的对象 |
| 返回值 | 最近 Provider 的当前 `value`，没有 Provider 时为默认值 |

::: details 查看调用形式的示例代码
```jsx
/**
 * 根据当前主题显示任务面板。
 * @returns {React.ReactElement} 带主题类名的面板。
 */
function TaskPanel() {
  const theme = React.useContext(ThemeContext);

  return (
    <section className={`task-panel task-panel--${theme}`}>
      任务内容
    </section>
  );
}
```
:::

不要把 `Context.Provider`、`Context.Consumer` 或普通对象传给 `useContext`，参数必须是 Context 对象本身。

### 2. Provider 变化触发渲染

Provider 的 `value` 变化时，读取该 Context 的后代会重新渲染。Context 更新不依赖中间组件是否转发 Props。

::: details 查看Provider 变化触发渲染的示例代码
```jsx
/**
 * 提供可切换主题。
 * @param {{ children: React.ReactNode }} props 组件属性。
 * @returns {React.ReactElement} 主题 Provider 和切换按钮。
 */
function ThemeProvider({ children }) {
  const [theme, setTheme] = React.useState("light");

  /**
   * 切换亮色和暗色主题。
   * @returns {void}
   */
  function handleToggleTheme() {
    setTheme(
      /**
       * 根据前一主题返回下一主题。
       * @param {string} previousTheme 前一主题。
       * @returns {string} 下一主题。
       */
      (previousTheme) => (
        previousTheme === "light" ? "dark" : "light"
      )
    );
  }

  return (
    <ThemeContext.Provider value={theme}>
      <button type="button" onClick={handleToggleTheme}>
        切换主题
      </button>
      {children}
    </ThemeContext.Provider>
  );
}
```
:::

单击按钮后，所有读取 `ThemeContext` 的后代使用新主题重新渲染。

## 四、共享状态与操作

### 1. 提供对象值

Context 可以同时提供 State 和操作：

::: details 查看提供对象值的示例代码
```jsx
const TaskSelectionContext = React.createContext(null);

/**
 * 提供当前选中任务和选择操作。
 * @param {{ children: React.ReactNode }} props 组件属性。
 * @returns {React.ReactElement} 任务选择 Provider。
 */
function TaskSelectionProvider({ children }) {
  const [selectedTaskId, setSelectedTaskId] = React.useState(null);

  const contextValue = {
    selectedTaskId,
    selectTask: setSelectedTaskId
  };

  return (
    <TaskSelectionContext.Provider value={contextValue}>
      {children}
    </TaskSelectionContext.Provider>
  );
}
```
:::

消费者读取：

::: details 查看提供对象值的示例代码
```jsx
/**
 * 显示并选择任务。
 * @param {{ task: { id: number, title: string } }} props 组件属性。
 * @returns {React.ReactElement} 任务按钮。
 */
function SelectTaskButton({ task }) {
  const context = React.useContext(TaskSelectionContext);

  if (context === null) {
    throw new Error("SelectTaskButton 必须放在 TaskSelectionProvider 内部");
  }

  /**
   * 选择当前任务。
   * @returns {void}
   */
  function handleSelect() {
    context.selectTask(task.id);
  }

  return (
    <button
      type="button"
      aria-pressed={context.selectedTaskId === task.id}
      onClick={handleSelect}
    >
      {task.title}
    </button>
  );
}
```
:::

使用 `null` 默认值并主动报错，可以快速定位缺失 Provider。若默认值本身具有真实含义，则可以直接使用有效默认值。

### 2. 对象引用影响更新

`contextValue` 在 Provider 每次渲染时都会创建新对象。即使字段值没有变化，消费者也会看到新引用。

Provider 更新频繁且消费者较多时，可以：

- 把不同变化频率的数据拆成多个 Context；
- 用 `useMemo` 稳定对象值；
- 用 `useCallback` 稳定放入对象的业务回调；
- 缩小 Provider 覆盖范围；
- 把只需一处使用的数据改回 Props。

记忆化具有依赖和比较成本，应在确认无关更新造成实际问题后使用。

## 五、Context 设计

### 1. 按职责拆分

不要把用户、主题、路由、表单、通知和所有操作放入一个巨大 Context。任何字段变化都会让读取该对象的消费者得到新值。

更清晰的方式是按稳定职责拆分：

```text
CurrentUserContext
ThemeContext
TaskSelectionContext
NotificationContext
```

组件只读取完成自身职责所需的 Context。

### 2. Context 不代替全部状态管理

Context 只负责把值传到后代，不提供：

- 状态转换规则；
- 请求缓存和失效；
- 时间旅行调试；
- 选择器订阅；
- 表单校验；
- 持久化策略。

简单共享状态可以把 `useState` 或 `useReducer` 与 Context 组合；复杂需求再评估专用工具。

### 3. Props 与 Context 选择

| 场景 | 推荐方式 |
|------|----------|
| 父子或少量层级传递 | Props |
| 中间组件确实需要这份数据 | Props |
| 大量后代读取同一作用域配置 | Context |
| 多个组件共享复杂状态转换 | Context + Reducer 或状态库 |
| 服务端数据缓存 | 请求缓存工具，不只使用 Context |

## 六、常见问题

| 问题 | 原因 | 处理方式 |
|------|------|----------|
| 读取到默认值 | 组件不在对应 Provider 后代中 | 检查组件树和 Context 对象 |
| Provider 传 `undefined` 后没有默认值 | `undefined` 是明确 value | 提供有效值或主动报错 |
| 大量组件频繁渲染 | Provider 对象引用持续变化 | 拆分 Context 或稳定 value |
| 数据来源难追踪 | 小范围数据也改用 Context | 恢复显式 Props |
| Context 文件重复导致读取失败 | Provider 和消费者使用了不同 Context 对象 | 从同一模块导入 Context |
| 组件脱离 Provider 后静默异常 | 默认值掩盖错误嵌套 | 使用 `null` 并检查 |

`useContext` 解决的是跨层读取，不会改变单向数据流：Provider 仍然拥有值，消费者只能读取并调用 Provider 暴露的操作。
