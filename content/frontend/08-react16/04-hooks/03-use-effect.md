---
title: "useEffect 与副作用"
tags:
  - React
  - Hooks
  - useEffect
excerpt: "讲解 useEffect 的作用、调用形式和执行时机，区分外部系统同步、事件逻辑与派生计算，并给出订阅和请求示例。"
date: 2026-07-31
---

# useEffect 与副作用

## 一、副作用

### 1. 什么是副作用

渲染只负责根据 Props、State 和 Context 计算 React 元素。修改 React 之外的系统属于副作用，例如：

- 修改 `document.title`；
- 订阅浏览器事件或消息通道；
- 启动定时器；
- 发起网络请求；
- 操作非 React 管理的 DOM；
- 初始化地图、图表等第三方实例；
- 写入 `localStorage`。

这些操作不能在组件函数体中直接执行，因为函数体属于 Render 阶段，可能执行多次，也可能在提交前被放弃。

### 2. Effect 的作用

`useEffect` 让组件在 React 已经把渲染结果提交后，与外部系统保持同步。

```text
React.useEffect(setup, dependencies?)
```

| 参数或返回值 | 含义 |
|--------------|------|
| `setup` | 提交后执行的副作用函数 |
| `dependencies` | 决定 Effect 何时需要重新同步的依赖数组 |
| `setup` 返回值 | 可选清理函数，用于撤销当前同步 |
| `useEffect` 返回值 | `undefined` |

下面把任务数量同步到浏览器标题：

::: details 查看Effect 的作用的示例代码
```jsx
/**
 * 在浏览器标题中显示待处理任务数量。
 * @param {{ pendingCount: number }} props 组件属性。
 * @returns {React.ReactElement} 页面标题。
 */
function TaskPageTitle({ pendingCount }) {
  React.useEffect(
    /**
     * 把当前数量同步到 document.title。
     * @returns {void}
     */
    () => {
      document.title = `待处理任务：${pendingCount}`;
    },
    [pendingCount]
  );

  return <h1>任务中心</h1>;
}
```
:::

首次提交后标题被设置；`pendingCount` 变化并再次提交后，Effect 使用新值重新设置标题。

## 二、执行时机

### 1. 在提交后执行

函数组件执行与 Effect 执行属于不同阶段：

```text
State 或 Props 变化
→ React 执行组件并计算元素树
→ React 提交 DOM 变更
→ 浏览器绘制
→ useEffect 执行
```

`useEffect` 通常不会阻塞浏览器绘制，适合大多数外部同步。需要在绘制前读取布局并同步修改 DOM 时，才考虑 `useLayoutEffect`。

### 2. 默认每次提交后执行

省略依赖数组时，Effect 在组件每次提交后执行：

```jsx
React.useEffect(
  /**
   * 记录每次已提交渲染。
   * @returns {void}
   */
  () => {
    console.log("组件已提交");
  }
);
```

这不是“只执行一次”。如果 Effect 内部无条件更新 State，会形成反复更新。

### 3. 空数组只关联挂载周期

传入空依赖数组时，setup 在挂载提交后执行一次，清理函数在卸载时执行：

::: details 查看空数组只关联挂载周期的示例代码
```jsx
React.useEffect(
  /**
   * 组件挂载后注册在线状态监听。
   * @returns {() => void} 卸载时移除监听的清理函数。
   */
  () => {
    window.addEventListener("online", handleOnline);

    /**
     * 移除在线状态监听。
     * @returns {void}
     */
    function cleanupOnlineListener() {
      window.removeEventListener("online", handleOnline);
    }

    return cleanupOnlineListener;
  },
  []
);
```
:::

空数组不是“关闭依赖检查”，而是声明 setup 不读取任何会随渲染变化的值。若实际读取 Props 或 State，空数组会把首次渲染值永久保留在闭包中。

### 4. 指定依赖

传入 `[taskId]` 时，首次提交后执行，`taskId` 变化后重新执行，其他更新不会触发这项同步。

```jsx
React.useEffect(
  /**
   * 当前任务变化时记录访问。
   * @returns {void}
   */
  () => {
    console.log(`查看任务 ${taskId}`);
  },
  [taskId]
);
```

React 比较当前依赖和上一次依赖。依赖数量和顺序必须保持固定。

## 三、哪些逻辑需要 Effect

### 1. 与外部系统同步

以下问题通常需要 Effect：

| 外部系统 | Effect 工作 |
|----------|-------------|
| 浏览器事件 | 注册并移除监听 |
| WebSocket | 连接、订阅和关闭 |
| 定时器 | 启动和清除 |
| 网络资源 | 请求、取消或忽略旧结果 |
| 第三方组件 | 创建实例、更新实例和销毁 |
| DOM API | 根据提交后的节点执行同步 |

Effect 应围绕一个同步目标组织。例如“同步任务订阅”与“同步页面标题”是两个不同目标，应使用两个 Effect。

### 2. 派生数据不需要 Effect

能够由 Props 和 State 计算的数据应在渲染期间直接计算：

::: details 查看派生数据不需要 Effect的示例代码
```jsx
// 错误：重复保存可见任务，并需要额外同步。
const [visibleTasks, setVisibleTasks] = React.useState([]);

React.useEffect(
  /**
   * 根据查询词同步派生列表。
   * @returns {void}
   */
  () => {
    setVisibleTasks(
      tasks.filter(
        // 过滤包含查询词的任务。
        (task) => task.title.includes(query)
      )
    );
  },
  [tasks, query]
);
```
:::

正确方式：

```jsx
const visibleTasks = tasks.filter(
  // 当前渲染直接计算可见任务。
  (task) => task.title.includes(query)
);
```

直接计算少一次提交，不会产生短暂的旧列表，也无需维护同步依赖。

### 3. 用户操作逻辑通常不需要 Effect

“单击保存后发送请求”由明确事件触发，应放在事件处理函数中：

::: details 查看用户操作逻辑通常不需要 Effect的示例代码
```jsx
/**
 * 提交当前任务表单。
 * @param {React.FormEvent<HTMLFormElement>} event 表单提交事件。
 * @returns {Promise<void>} 保存完成后的 Promise。
 */
async function handleSubmit(event) {
  event.preventDefault();
  setSaving(true);

  try {
    await saveTask(draft);
    setMessage("保存成功");
  } catch (error) {
    setMessage("保存失败");
  } finally {
    setSaving(false);
  }
}
```
:::

如果先设置 `submitted=true`，再让 Effect 观察它并发请求，事件原因会被拆散，还需要处理重复触发和标志重置。

## 四、订阅

### 1. 建立和清理

下面根据 `taskId` 订阅任务消息：

::: details 查看建立和清理的示例代码
```jsx
/**
 * 显示指定任务的在线状态。
 * @param {{ taskId: number, taskChannel: TaskChannel }} props 组件属性。
 * @returns {React.ReactElement} 在线状态文本。
 */
function TaskPresence({ taskId, taskChannel }) {
  const [online, setOnline] = React.useState(false);

  React.useEffect(
    /**
     * 订阅当前任务状态。
     * @returns {() => void} 取消当前订阅的清理函数。
     */
    () => {
      /**
       * 同步频道推送的在线状态。
       * @param {boolean} nextOnline 下一在线状态。
       * @returns {void}
       */
      function handlePresenceChange(nextOnline) {
        setOnline(nextOnline);
      }

      const unsubscribe = taskChannel.subscribe(taskId, handlePresenceChange);

      /**
       * 取消对应 taskId 的订阅。
       * @returns {void}
       */
      function cleanupSubscription() {
        unsubscribe();
      }

      return cleanupSubscription;
    },
    [taskChannel, taskId]
  );

  return <span>{online ? "在线" : "离线"}</span>;
}
```
:::

`taskId` 变化时，React 先调用旧 Effect 的清理函数，再使用新 `taskId` 建立订阅。卸载时也会执行最后一次清理。

### 2. 同一函数引用

浏览器监听器和部分订阅 API 要求清理时提供建立时的同一函数引用。把处理函数定义在 Effect 内部，可以让 setup 和 cleanup 共享该闭包中的函数。

`removeEventListener` 还需要使用相同的事件名称和捕获选项。若清理阶段重新创建处理函数，即使函数体相同，引用不同也无法移除原监听器。

## 五、数据请求

### 1. Effect 函数不能直接声明为 async

Effect setup 只能返回清理函数或 `undefined`。`async` 函数总会返回 Promise，因此不能直接作为 setup：

```jsx
// 错误：返回 Promise，不是清理函数。
React.useEffect(async () => {
  const task = await fetchTask(taskId);
  setTask(task);
}, [taskId]);
```

可以在 Effect 内定义并调用异步函数：

::: details 查看Effect 函数不能直接声明为 async的示例代码
```jsx
/**
 * 加载并显示指定任务。
 * @param {{ taskId: number }} props 组件属性。
 * @returns {React.ReactElement} 请求状态或任务标题。
 */
function TaskDetails({ taskId }) {
  const [request, setRequest] = React.useState({
    status: "loading",
    task: null,
    error: null
  });

  React.useEffect(
    /**
     * 请求当前任务，并让过期请求结果失效。
     * @returns {() => void} 标记当前请求失效的清理函数。
     */
    () => {
      let active = true;

      /**
       * 执行任务请求。
       * @returns {Promise<void>} 请求完成后的 Promise。
       */
      async function loadTask() {
        setRequest({
          status: "loading",
          task: null,
          error: null
        });

        try {
          const task = await fetchTask(taskId);

          if (active) {
            setRequest({
              status: "success",
              task,
              error: null
            });
          }
        } catch (error) {
          if (active) {
            setRequest({
              status: "error",
              task: null,
              error
            });
          }
        }
      }

      loadTask();

      /**
       * 阻止已过期请求继续提交结果。
       * @returns {void}
       */
      function cleanupRequest() {
        active = false;
      }

      return cleanupRequest;
    },
    [taskId]
  );

  if (request.status === "loading") {
    return <p>加载中</p>;
  }

  if (request.status === "error") {
    return <p role="alert">加载失败</p>;
  }

  return <h2>{request.task.title}</h2>;
}
```
:::

`active` 让旧请求结果失效，但不会真正取消网络传输。请求 API 支持 `AbortController` 时应同时取消。

## 六、拆分 Effect

### 1. 一个 Effect 对应一个同步目标

下面两个操作触发条件不同：

- 页面标题随 `pendingCount` 变化；
- 任务订阅随 `taskId` 变化。

应使用两个 Effect：

::: details 查看一个 Effect 对应一个同步目标的示例代码
```jsx
React.useEffect(
  /**
   * 同步页面标题。
   * @returns {void}
   */
  () => {
    document.title = `待处理：${pendingCount}`;
  },
  [pendingCount]
);

React.useEffect(
  /**
   * 订阅当前任务。
   * @returns {() => void} 取消订阅的清理函数。
   */
  () => {
    const unsubscribe = taskChannel.subscribe(taskId);
    return unsubscribe;
  },
  [taskChannel, taskId]
);
```
:::

把无关逻辑合并会让任一依赖变化都重启全部同步，也增加清理遗漏风险。

### 2. 常见问题

| 问题 | 原因 | 处理方式 |
|------|------|----------|
| Effect 无限更新 | 每次执行都无条件更新其依赖 State | 移除重复 State 或增加真实条件 |
| 读取旧 Props 或 State | 依赖数组缺失值 | 补齐依赖或重构同步目标 |
| 订阅重复、监听泄漏 | 没有返回清理函数 | 对称撤销资源 |
| 请求结果覆盖新页面 | 旧请求晚于新请求完成 | 取消请求或让旧结果失效 |
| 首屏短暂显示旧派生数据 | 用 Effect 同步可计算值 | 渲染时直接计算 |
| 单击行为绕到 Effect | 把事件原因转成标志 State | 直接在事件处理函数执行 |

Effect 用于让已提交界面与外部系统一致，不是函数组件中所有逻辑的默认放置位置。
