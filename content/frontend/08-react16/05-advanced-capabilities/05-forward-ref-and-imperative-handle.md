---
title: "Ref 转发与命令式 API"
tags:
  - React
  - forwardRef
  - useImperativeHandle
excerpt: "讲解 React.forwardRef 和 useImperativeHandle 的参数、Ref 转发方式和命令接口边界，并说明第三方 DOM 库的初始化与销毁。"
date: 2026-07-31
---

# Ref 转发与命令式 API

## 一、Ref 转发

### 1. 为什么需要 forwardRef

`ref` 是 React 特殊属性，不会像普通 Props 一样传给函数组件：

```jsx
<TaskInput ref={inputRef} />
```

普通 `TaskInput` 无法通过 `props.ref` 读取该值。需要让父组件访问内部 DOM 时，使用 `React.forwardRef`。

### 2. 调用形式

```text
const Component = React.forwardRef(render);
```

`render` 函数接收两个参数：

```text
(props, ref) => ReactNode
```

| 参数或返回值 | 含义 |
|--------------|------|
| `props` | 普通组件属性，不包含 `key` 和 `ref` |
| `ref` | 父组件传入的 Ref |
| 返回值 | 组件要渲染的 React 内容 |
| `forwardRef` 返回值 | 可以接收 `ref` 的组件类型 |

### 3. 转发到 DOM

```jsx
const TaskInput = React.forwardRef(
  /**
   * 把外部 Ref 转发到内部 input。
   * @param {{ label: string, value: string, onChange: Function }} props 组件属性。
   * @param {React.Ref<HTMLInputElement>} ref 外部 Ref。
   * @returns {React.ReactElement} 标签和输入框。
   */
  function TaskInput({ label, value, onChange }, ref) {
    return (
      <label>
        <span>{label}</span>
        <input ref={ref} value={value} onChange={onChange} />
      </label>
    );
  }
);
```

父组件使用：

```jsx
/**
 * 显示并聚焦任务标题输入框。
 * @returns {React.ReactElement} 任务输入区域。
 */
function TaskEditor() {
  const [title, setTitle] = React.useState("");
  const inputRef = React.useRef(null);

  /**
   * 同步任务标题。
   * @param {React.ChangeEvent<HTMLInputElement>} event 输入事件。
   * @returns {void}
   */
  function handleTitleChange(event) {
    setTitle(event.target.value);
  }

  /**
   * 聚焦内部 input。
   * @returns {void}
   */
  function handleFocus() {
    inputRef.current.focus();
  }

  return (
    <div>
      <TaskInput
        ref={inputRef}
        label="任务标题"
        value={title}
        onChange={handleTitleChange}
      />
      <button type="button" onClick={handleFocus}>
        聚焦
      </button>
    </div>
  );
}
```

此时 `inputRef.current` 是内部 `input` DOM 节点。

## 二、转发边界

### 1. Ref 是组件 API

转发 Ref 会让调用者依赖组件内部节点。若 `TaskInput` 将内部 `input` 改成第三方编辑器，调用者直接使用的 DOM API 可能失效。

公共组件应先考虑声明式 Props：

```jsx
<TaskInput autoFocus error={error} />
```

只有聚焦、滚动、文本选择、媒体控制等命令式操作确实无法用数据 Props 表达时，才开放 Ref。

### 2. HOC 中的 Ref

HOC 包装 `forwardRef` 组件时必须继续显式转发 Ref。`{...props}` 不包含外部 `ref`，不能自动穿透包装层。

包装层需要接收第二个 `ref` 参数，并把它传给内部组件的 `ref` 属性。若漏掉这一步，父组件拿到的是 `null`，或 Ref 意外指向 HOC 自己的类实例。

### 3. 显示名称

匿名 forwardRef 组件在 DevTools 中名称不清晰。使用具名 render 函数或设置 `displayName`：

```jsx
TaskInput.displayName = "TaskInput";
```

## 三、useImperativeHandle

### 1. 作用与形式

`useImperativeHandle` 定制父组件通过 Ref 读取的值，而不是直接暴露内部 DOM。

```text
React.useImperativeHandle(ref, createHandle, dependencies?)
```

| 参数 | 含义 |
|------|------|
| `ref` | `forwardRef` 收到的外部 Ref |
| `createHandle` | 返回要暴露对象的函数 |
| `dependencies` | 创建接口所读取的响应式值 |
| 返回值 | `undefined` |

### 2. 暴露最小接口

```jsx
const TaskInput = React.forwardRef(
  /**
   * 暴露聚焦、清空和读取值的有限接口。
   * @param {{ initialValue?: string }} props 组件属性。
   * @param {React.Ref<{ focus: Function, clear: Function, getValue: Function }>} ref 外部 Ref。
   * @returns {React.ReactElement} 任务输入框。
   */
  function TaskInput({ initialValue = "" }, ref) {
    const [value, setValue] = React.useState(initialValue);
    const inputRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      /**
       * 创建父组件可调用的命令接口。
       * @returns {{ focus: () => void, clear: () => void, getValue: () => string }} 命令对象。
       */
      () => ({
        /**
         * 聚焦内部输入框。
         * @returns {void}
         */
        focus() {
          inputRef.current.focus();
        },

        /**
         * 清空输入值。
         * @returns {void}
         */
        clear() {
          setValue("");
        },

        /**
         * 读取当前输入值。
         * @returns {string} 当前值。
         */
        getValue() {
          return value;
        }
      }),
      [value]
    );

    /**
     * 同步输入值。
     * @param {React.ChangeEvent<HTMLInputElement>} event 输入事件。
     * @returns {void}
     */
    function handleChange(event) {
      setValue(event.target.value);
    }

    return <input ref={inputRef} value={value} onChange={handleChange} />;
  }
);
```

父组件：

```jsx
const taskInputRef = React.useRef(null);

/**
 * 清空并重新聚焦任务输入框。
 * @returns {void}
 */
function handleResetInput() {
  taskInputRef.current.clear();
  taskInputRef.current.focus();
}
```

父组件只能调用组件明确暴露的三个方法，不依赖内部 DOM 的其他属性。

### 3. 依赖

`createHandle` 读取 `value`，因此依赖数组包含 `[value]`。值变化后，React 更新 Ref 上的命令对象。

只暴露不读取响应式数据的稳定方法时，可以使用空数组；方法仍可通过函数式更新操作 State。

## 四、第三方库同步

### 1. DOM 容器与实例 Ref

非 React 图表库通常需要一个 DOM 容器和一个命令式实例：

```jsx
/**
 * 把任务统计同步到第三方图表。
 * @param {{ data: Array<{ label: string, value: number }> }} props 组件属性。
 * @returns {React.ReactElement} 图表容器。
 */
function TaskChart({ data }) {
  const containerRef = React.useRef(null);
  const chartRef = React.useRef(null);

  React.useEffect(
    /**
     * 创建图表实例并在卸载时销毁。
     * @returns {() => void} 销毁图表的清理函数。
     */
    () => {
      chartRef.current = createChart(containerRef.current);

      /**
       * 销毁第三方图表实例。
       * @returns {void}
       */
      function cleanupChart() {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      return cleanupChart;
    },
    []
  );

  React.useEffect(
    /**
     * 把最新数据同步到已创建图表。
     * @returns {void}
     */
    () => {
      chartRef.current.setData(data);
    },
    [data]
  );

  return <div ref={containerRef} className="task-chart" />;
}
```

第一个 Effect 管理实例生命周期，第二个 Effect 管理数据同步。`chartRef` 不参与渲染，因此不使用 State。

### 2. 初始化顺序

React 按 Hook 声明顺序执行同一组件的 Effect。创建实例的 Effect 写在数据同步 Effect 之前，首次提交时 `chartRef.current` 已经存在。

更稳妥的第三方适配层还应处理：

- 容器尺寸变化；
- 配置变更是否支持增量更新；
- 实例创建失败；
- `destroy()` 是否允许重复调用；
- 服务端不存在 DOM；
- StrictMode 开发检查下建立与清理是否对称。

## 五、声明式与命令式

| 需求 | 优先方式 |
|------|----------|
| 显示值、禁用、错误状态 | Props |
| 用户操作改变界面 | State 与回调 |
| 聚焦、选择文本、滚动 | Ref 命令 |
| 调用第三方实例方法 | Ref + Effect |
| 父组件读取子组件内部 State | 重新设计数据所有权，不通过 Ref |
| 公开整个内部 DOM | 避免，暴露最小命令接口 |

Ref 转发和命令式 API 是必要逃生舱，但会增加组件耦合。接口越小，组件内部越容易调整。

## 六、常见问题

| 问题 | 原因 | 处理方式 |
|------|------|----------|
| 函数组件收到 Ref 警告 | 没有使用 `forwardRef` | 包装 render 函数 |
| `{...props}` 后 Ref 仍未传入 | `ref` 不是普通 Props | 显式接收并转发 |
| 父组件依赖大量 DOM 细节 | 直接暴露内部节点 | 使用 `useImperativeHandle` |
| 命令对象读取旧 State | 依赖数组缺少值 | 补齐依赖或使用正确闭包 |
| 第三方实例重复创建 | 初始化 Effect 依赖不稳定 | 分离实例生命周期与数据同步 |
| 卸载后资源残留 | 没有调用第三方销毁方法 | 在 cleanup 中销毁 |

命令式接口只应暴露声明式数据流难以表达的操作，不能用来绕过 Props、State 和组件职责。
