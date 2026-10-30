---
title: "自定义 Hook 与逻辑复用"
tags:
  - React
  - Hooks
  - 自定义 Hook
excerpt: "讲解自定义 Hook 的命名、参数、返回值和状态隔离，并通过在线状态订阅示例说明如何封装状态逻辑与资源生命周期。"
date: 2026-07-31
---

# 自定义 Hook 与逻辑复用

## 一、自定义 Hook

### 1. 定义

自定义 Hook 是名称以 `use` 开头、可以调用其他 Hook 的 JavaScript 函数。它复用状态逻辑和外部同步方式，不复用组件界面。

::: details 查看定义的示例代码
```jsx
/**
 * 保存布尔值并提供切换函数。
 * @param {boolean} initialValue 初始布尔值。
 * @returns {[boolean, () => void]} 当前值和切换函数。
 */
function useToggle(initialValue) {
  const [value, setValue] = React.useState(initialValue);

  /**
   * 反转当前布尔值。
   * @returns {void}
   */
  function toggle() {
    setValue(
      /**
       * 反转前一值。
       * @param {boolean} previousValue 前一值。
       * @returns {boolean} 下一值。
       */
      (previousValue) => !previousValue
    );
  }

  return [value, toggle];
}
```
:::

组件使用：

::: details 查看定义的示例代码
```jsx
/**
 * 显示可展开详情。
 * @returns {React.ReactElement} 展开按钮和详情。
 */
function TaskDetails() {
  const [expanded, toggleExpanded] = useToggle(false);

  return (
    <section>
      <button type="button" onClick={toggleExpanded}>
        {expanded ? "收起" : "展开"}
      </button>
      {expanded && <p>任务详细内容</p>}
    </section>
  );
}
```
:::

### 2. 名称必须以 use 开头

`use` 前缀让 React Hook 规则检查工具识别函数内部允许调用 Hook，也提醒调用者该函数受 Hook 规则约束。

```jsx
// 错误：规则工具无法把 toggleState 识别为自定义 Hook。
function toggleState() {
  return React.useState(false);
}
```

只有真正调用 Hook 的函数才需要 `use` 前缀。普通格式化、校验和数据转换函数保持普通名称。

## 二、状态隔离

### 1. 每次调用拥有独立状态

自定义 Hook 不会创建全局共享 State。两个组件调用 `useToggle(false)` 时，React 为两个组件分别保存 Hook 状态。

::: details 查看每次调用拥有独立状态的示例代码
```jsx
// 使用 useToggle 保存第一块面板自己的展开状态。
function FirstPanel() {
  const [open, toggleOpen] = useToggle(false);
  // 第一份状态
}

// 使用同一自定义 Hook 保存第二块面板的独立状态。
function SecondPanel() {
  const [open, toggleOpen] = useToggle(false);
  // 第二份状态
}
```
:::

共享的是实现逻辑，不是数据。

### 2. 共享数据需要共同所有者

多个组件必须读写同一值时，应把状态放在共同父组件、Context 或外部状态容器。自定义 Hook 可以封装对该共享来源的访问，但不能仅靠相同函数名让 State 自动共享。

共享来源应保持唯一，Hook 只负责提供读取和更新入口。若每个 Hook 调用内部又创建一份 State，组件看到的仍然是彼此独立的数据副本。

## 三、封装外部同步

### 1. 在线状态 Hook

浏览器在线状态包含：

- 初始读取 `navigator.onLine`；
- 监听 `online`；
- 监听 `offline`；
- 卸载时移除监听。

这些步骤构成一个完整生命周期契约，适合封装为自定义 Hook：

::: details 查看在线状态 Hook的示例代码
```jsx
/**
 * 读取并订阅浏览器在线状态。
 * @returns {boolean} 当前是否在线。
 */
function useOnlineStatus() {
  const [online, setOnline] = React.useState(
    /**
     * 读取首次渲染的浏览器在线状态。
     * @returns {boolean} 当前在线状态。
     */
    () => navigator.onLine
  );

  React.useEffect(
    /**
     * 建立在线和离线事件监听。
     * @returns {() => void} 移除监听的清理函数。
     */
    () => {
      /**
       * 把状态更新为在线。
       * @returns {void}
       */
      function handleOnline() {
        setOnline(true);
      }

      /**
       * 把状态更新为离线。
       * @returns {void}
       */
      function handleOffline() {
        setOnline(false);
      }

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      /**
       * 移除浏览器网络状态监听。
       * @returns {void}
       */
      function cleanupNetworkListeners() {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }

      return cleanupNetworkListeners;
    },
    []
  );

  return online;
}
```
:::

两个组件可以用不同界面复用同一逻辑：

::: details 查看在线状态 Hook的示例代码
```jsx
/**
 * 显示网络状态徽标。
 * @returns {React.ReactElement} 网络状态文本。
 */
function NetworkBadge() {
  const online = useOnlineStatus();
  return <span>{online ? "在线" : "离线"}</span>;
}

/**
 * 离线时禁用保存按钮。
 * @returns {React.ReactElement} 保存按钮。
 */
function SaveButton() {
  const online = useOnlineStatus();
  return (
    <button type="button" disabled={!online}>
      保存
    </button>
  );
}
```
:::

两个调用仍会分别建立监听。如果应用中大量组件都需要同一在线状态，可以在一个 Provider 中调用 Hook，再通过 Context 分发结果。

## 四、参数设计

### 1. 参数表达外部输入

自定义 Hook 的参数应完整表达逻辑依赖：

::: details 查看参数表达外部输入的示例代码
```jsx
/**
 * 订阅指定任务的消息。
 * @param {TaskChannel} channel 消息频道实例。
 * @param {number} taskId 任务 ID。
 * @returns {Array<TaskMessage>} 当前任务消息。
 */
function useTaskMessages(channel, taskId) {
  const [messages, setMessages] = React.useState([]);

  React.useEffect(
    /**
     * 订阅当前 taskId 的消息。
     * @returns {() => void} 取消订阅的函数。
     */
    () => channel.subscribe(taskId, setMessages),
    [channel, taskId]
  );

  return messages;
}
```
:::

参数变化后 Hook 内部 Effect 会按依赖重新同步。不要把隐式模块变量当作输入，否则调用者无法判断 Hook 依赖。

### 2. 参数过多

多个参数总是共同描述同一配置时，可以接收配置对象：

```jsx
useTaskRequest({
  taskId,
  enabled,
  retryCount
});
```

Hook 内应读取具体字段作为 Effect 依赖，不能只依赖每次渲染新建的整个对象。

## 五、返回值设计

### 1. 数组返回值

返回项数量少、位置稳定且调用者通常自定义名称时，可以返回数组：

```jsx
const [open, toggleOpen] = useToggle(false);
```

数组适合类似 `useState` 的紧密值对。返回项增多后，位置含义会变得难记。

### 2. 对象返回值

存在多个具名状态和操作时，返回对象更清晰：

::: details 查看对象返回值的示例代码
```jsx
/**
 * 管理任务请求状态。
 * @param {number} taskId 任务 ID。
 * @returns {{
 *   task: object | null,
 *   loading: boolean,
 *   error: Error | null,
 *   reload: () => void
 * }} 请求状态和重新加载操作。
 */
function useTaskRequest(taskId) {
  // 省略请求 State、Effect 和 reload 实现。
  return {
    task,
    loading,
    error,
    reload
  };
}
```
:::

返回值应隐藏不必要的内部 setter。调用者需要“重新加载”时暴露 `reload`，不直接暴露所有内部 State 更新函数。

## 六、职责边界

### 1. 自定义 Hook 复用逻辑

适合提取的内容包括：

- 多个组件重复的 State 和事件组合；
- 订阅、清理和状态映射；
- 请求状态、取消和竞态处理；
- 浏览器 API 的读取与监听；
- Context 的读取和错误检查；
- Reducer 与业务操作封装。

### 2. 不提取无意义转发

下面的 Hook 没有减少重复或隐藏复杂度：

```jsx
/**
 * 无意义示例：只转发 useState。
 * @param {unknown} initialValue 初始值。
 * @returns {[unknown, Function]} State 和更新函数。
 */
function useValue(initialValue) {
  return React.useState(initialValue);
}
```

只有一处使用、逻辑简单且没有独立概念时，保留在组件中更容易理解。

### 3. 不渲染 JSX

自定义 Hook 返回数据和操作，不返回要直接渲染的 JSX。需要封装界面时创建组件；需要同时复用逻辑与不同界面时，自定义 Hook 比 HOC 或 Render Props 更直接。

Hook 可以返回 React 元素所需的数据、事件处理函数和状态标记，由调用组件决定最终结构。这样同一逻辑能够服务列表、弹窗等不同界面，而不把展示层固定在 Hook 内。

## 七、测试边界

纯计算应提取为普通函数并单独测试；Hook 行为需要在 React 组件环境中验证：

- 初始返回值；
- 参数变化后的状态；
- 事件或请求成功、失败；
- Effect 清理；
- 多次调用是否状态隔离；
- 卸载后是否停止更新。

测试应观察 Hook 对组件可见的行为，不依赖 React 内部 Hook 槽位。

## 八、常见问题

| 问题 | 原因 | 处理方式 |
|------|------|----------|
| 两个组件没有共享 State | 自定义 Hook 只共享逻辑 | 提升状态或使用 Context |
| Hook 内读取旧参数 | Effect 依赖不完整 | 补齐参数依赖 |
| 调用者能任意破坏内部状态 | 返回了底层 setter | 暴露业务操作 |
| Hook 名称没有 `use` | 规则工具无法识别 | 使用 `useXxx` |
| 普通工具函数被改成 Hook | 实际没有调用 Hook | 保持普通函数 |
| 一个 Hook 管理多个无关系统 | 职责过大、清理复杂 | 按同步目标拆分 |

自定义 Hook 的价值是把状态、事件和生命周期组成稳定契约，让组件只负责选择如何展示结果。
