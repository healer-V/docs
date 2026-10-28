---
title: "useRef 与 DOM 操作"
tags:
  - React
  - Hooks
  - useRef
excerpt: "讲解 useRef 返回对象、current 的持久性和非响应式特征，并说明 DOM 聚焦、测量、计时器保存和回调 Ref 的正确用法。"
date: 2026-07-31
---

# useRef 与 DOM 操作

## 一、useRef

### 1. 调用形式

`useRef` 返回一个在组件整个挂载期间保持同一引用的对象：

```text
const ref = React.useRef(initialValue);
```

返回对象的结构为：

```js
{
  current: initialValue
}
```

| 项目 | 含义 |
|------|------|
| `initialValue` | 首次创建 Ref 对象时的 `current` 值 |
| `ref.current` | 可以读取和修改的当前值 |
| Ref 对象身份 | 组件多次渲染之间保持稳定 |
| 修改 `current` | 不会安排重新渲染 |

下面使用 Ref 保存计时器 ID：

```jsx
/**
 * 提供启动和停止延迟任务的按钮。
 * @returns {React.ReactElement} 计时器控制按钮。
 */
function DelayedTask() {
  const timerRef = React.useRef(null);

  /**
   * 启动三秒延迟任务。
   * @returns {void}
   */
  function handleStart() {
    timerRef.current = window.setTimeout(
      /**
       * 延迟结束后输出完成信息。
       * @returns {void}
       */
      () => {
        console.log("任务已执行");
        timerRef.current = null;
      },
      3000
    );
  }

  /**
   * 清除当前计时器。
   * @returns {void}
   */
  function handleCancel() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  return (
    <div>
      <button type="button" onClick={handleStart}>启动</button>
      <button type="button" onClick={handleCancel}>取消</button>
    </div>
  );
}
```

计时器 ID 不参与界面渲染，因此不需要 State。

### 2. Ref 与 State

| 对比项 | State | Ref |
|--------|-------|-----|
| 多次渲染之间保留 | 是 | 是 |
| 修改后安排渲染 | 是 | 否 |
| 当前渲染中的读取 | 对应渲染快照 | 读取可变 `current` |
| 适合保存 | 影响界面的数据 | DOM、计时器、第三方实例、最新值 |

如果数据变化后页面应该更新，就使用 State。把可见计数放在 Ref 中，界面不会自动刷新：

```jsx
function InvalidCounter() {
  const countRef = React.useRef(0);

  /**
   * 修改 Ref，但不会触发重新渲染。
   * @returns {void}
   */
  function handleClick() {
    countRef.current += 1;
  }

  return <button onClick={handleClick}>{countRef.current}</button>;
}
```

## 二、DOM Ref

### 1. 获取宿主元素

把 Ref 对象传给宿主元素的 `ref` 属性后，React 在提交阶段把 DOM 节点写入 `current`。卸载时会恢复为 `null`。

```jsx
/**
 * 提供可以主动聚焦的任务标题输入框。
 * @returns {React.ReactElement} 输入框和聚焦按钮。
 */
function TaskTitleInput() {
  const inputRef = React.useRef(null);

  /**
   * 聚焦已提交的输入框。
   * @returns {void}
   */
  function handleFocus() {
    inputRef.current.focus();
  }

  return (
    <div>
      <input ref={inputRef} aria-label="任务标题" />
      <button type="button" onClick={handleFocus}>
        聚焦标题
      </button>
    </div>
  );
}
```

首次渲染函数执行时 DOM 还没有提交，因此 `inputRef.current` 为 `null`。事件发生时节点已经挂载，可以调用 `focus()`。

### 2. 空值检查

元素可能因条件渲染而不存在，也可能已卸载。访问 DOM API 前应检查：

```jsx
/**
 * 在输入框存在时聚焦。
 * @returns {void}
 */
function focusInput() {
  if (inputRef.current !== null) {
    inputRef.current.focus();
  }
}
```

### 3. 读取布局

需要在提交后读取尺寸时，可以在事件、`useLayoutEffect` 或 `useEffect` 中访问 DOM：

```jsx
const panelRef = React.useRef(null);

React.useLayoutEffect(
  /**
   * DOM 提交后读取面板宽度。
   * @returns {void}
   */
  () => {
    const width = panelRef.current.getBoundingClientRect().width;
    console.log(`面板宽度：${width}`);
  },
  []
);
```

测量结果需要影响当前绘制布局时使用 `useLayoutEffect`；只记录指标时使用 `useEffect` 即可。

## 三、跨渲染可变值

### 1. 保存前一次值

Effect 在提交后把当前值写入 Ref，下一次渲染可以读取上一次提交值：

```jsx
/**
 * 显示当前状态和上一次状态。
 * @param {{ status: string }} props 组件属性。
 * @returns {React.ReactElement} 状态对比文本。
 */
function StatusHistory({ status }) {
  const previousStatusRef = React.useRef();

  React.useEffect(
    /**
     * 提交后保存当前状态，供下一次渲染读取。
     * @returns {void}
     */
    () => {
      previousStatusRef.current = status;
    },
    [status]
  );

  return (
    <p>
      当前：{status}；上一次：{previousStatusRef.current || "无"}
    </p>
  );
}
```

首次渲染没有上一次值，因此为 `undefined`。

### 2. 保存最新值

异步回调需要读取最新值、但不希望因值变化而重建外部资源时，可以用 Ref 保存最新值：

```jsx
function LatestStatusLogger({ status }) {
  const latestStatusRef = React.useRef(status);

  React.useEffect(
    /**
     * 每次状态提交后更新最新值。
     * @returns {void}
     */
    () => {
      latestStatusRef.current = status;
    },
    [status]
  );

  React.useEffect(
    /**
     * 建立一个持续读取最新状态的定时器。
     * @returns {() => void} 清除定时器的函数。
     */
    () => {
      const timerId = window.setInterval(
        /**
         * 输出 Ref 中保存的最新状态。
         * @returns {void}
         */
        () => {
          console.log(latestStatusRef.current);
        },
        1000
      );

      /**
       * 清除状态日志定时器。
       * @returns {void}
       */
      function cleanupTimer() {
        window.clearInterval(timerId);
      }

      return cleanupTimer;
    },
    []
  );

  return null;
}
```

这种写法会绕过 Effect 的响应式依赖，只适合明确需要“读取最新值但不重建资源”的场景。缺失依赖不能默认用 Ref 掩盖。

## 四、回调 Ref

### 1. 获取动态节点

对象 Ref 的 `current` 只保存一个值。需要维护多项 DOM 节点时，可以使用回调 Ref 和 Map：

```jsx
/**
 * 显示任务列表并允许按 ID 聚焦按钮。
 * @param {{ tasks: Array<{ id: number, title: string }> }} props 组件属性。
 * @returns {React.ReactElement} 任务按钮列表。
 */
function FocusableTaskList({ tasks }) {
  const buttonMapRef = React.useRef(new Map());

  /**
   * 为指定任务创建节点注册函数。
   * @param {number} taskId 任务 ID。
   * @returns {(node: HTMLButtonElement | null) => void} Ref 回调。
   */
  function createButtonRef(taskId) {
    /**
     * 在节点挂载或卸载时更新 Map。
     * @param {HTMLButtonElement | null} node 当前 DOM 节点。
     * @returns {void}
     */
    function registerButton(node) {
      if (node === null) {
        buttonMapRef.current.delete(taskId);
      } else {
        buttonMapRef.current.set(taskId, node);
      }
    }

    return registerButton;
  }

  /**
   * 聚焦指定任务按钮。
   * @param {number} taskId 任务 ID。
   * @returns {void}
   */
  function focusTask(taskId) {
    const button = buttonMapRef.current.get(taskId);
    if (button) {
      button.focus();
    }
  }

  return (
    <ul>
      {tasks.map(
        // 为每条任务渲染并注册按钮节点。
        (task) => (
          <li key={task.id}>
            <button ref={createButtonRef(task.id)} type="button">
              {task.title}
            </button>
          </li>
        )
      )}
    </ul>
  );
}
```

回调 Ref 在节点提交时接收 DOM 节点，在节点移除时接收 `null`。

### 2. 回调身份

渲染中创建的新 Ref 回调可能让 React 用 `null` 调用旧回调，再用节点调用新回调。大型动态列表需要稳定回调时，应根据实际性能证据设计节点注册结构，不要提前复杂化。

Ref 回调必须能够正确处理 `null`，及时从节点表中删除已卸载元素。否则列表删除后仍保留旧 DOM 引用，后续聚焦或测量可能操作已经脱离页面的节点。

## 五、使用边界

### 1. 不在渲染期间随意读写

除可预测的一次性初始化外，不应在渲染期间修改 `ref.current`。Render 阶段应保持纯粹，直接读写共享可变值会让结果依赖执行次数和顺序。

DOM Ref 更不能在渲染期间读取，因为节点尚未提交或仍指向上一次 DOM。

### 2. 自定义组件 Ref

普通函数组件不会自动接收 `ref`：

```jsx
// TaskInput 是函数组件时，ref 不会作为普通 Props 传入。
<TaskInput ref={inputRef} />
```

需要把 Ref 转发到内部 DOM 时使用 `React.forwardRef`；需要限制父组件可调用的方法时使用 `useImperativeHandle`。

### 3. 常见问题

| 问题 | 原因 | 处理方式 |
|------|------|----------|
| 修改 `current` 后页面不变 | Ref 不触发渲染 | 改用 State |
| 首次渲染访问 DOM 报错 | DOM 尚未提交 | 在事件或 Effect 中读取 |
| 卸载后仍操作节点 | Ref 已变为 `null` | 进行空值检查并清理异步任务 |
| 用 Ref 修复所有依赖警告 | 绕过响应式同步 | 先补齐依赖和拆分 Effect |
| 函数组件收不到 Ref | `ref` 是特殊属性 | 使用 `forwardRef` |

Ref 是 React 的逃生舱：它允许保存非响应式值和访问 DOM，但不应替代 State 与声明式数据流。
