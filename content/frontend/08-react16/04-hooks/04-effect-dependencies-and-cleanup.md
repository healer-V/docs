---
title: "Effect 依赖、清理与执行时机"
tags:
  - React
  - useEffect
  - useLayoutEffect
excerpt: "详细讲解 Effect 依赖比较、函数与对象依赖、清理顺序、订阅和请求竞态，并比较 useEffect 与 useLayoutEffect。"
date: 2026-07-31
---

# Effect 依赖、清理与执行时机

## 一、依赖数组

### 1. 依赖表示同步输入

Effect setup 中读取的组件 Props、State、组件内函数和组件内变量，都属于当前渲染的响应式值。它们变化后，外部同步通常需要重新建立。

```jsx
React.useEffect(
  /**
   * 根据当前任务和频道建立订阅。
   * @returns {() => void} 取消当前订阅的清理函数。
   */
  () => {
    const unsubscribe = channel.subscribe(taskId);
    return unsubscribe;
  },
  [channel, taskId]
);
```

`channel` 和 `taskId` 都由组件渲染提供，因此都必须列入依赖。

### 2. 比较方式

React 按数组位置使用 `Object.is` 比较当前依赖与上一次依赖。

| 依赖值 | 常见结果 |
|--------|----------|
| 字符串、数字、布尔值 | 值不变时视为相同 |
| State 更新函数 | React 保证引用稳定，可省略 |
| `useRef` 返回对象 | 引用稳定，可省略 |
| 渲染中创建的对象 | 每次都是新引用 |
| 渲染中创建的函数 | 每次都是新引用 |

依赖数组长度和顺序必须固定，不能根据条件动态拼接。

### 3. 三种依赖形式

| 写法 | 执行条件 |
|------|----------|
| 不传数组 | 每次提交后 |
| `[]` | 挂载后 setup，卸载时 cleanup |
| `[a, b]` | 挂载后，以及 `a` 或 `b` 变化后 |

空数组只适合 setup 完全不读取会变化的渲染值。它不是 `componentDidMount` 的机械替代。

## 二、完整依赖

### 1. 缺失依赖产生陈旧闭包

下面的定时器一直读取首次渲染的 `count`：

```jsx
// 展示依赖缺失时定时器持续读取旧状态的问题。
function InvalidCounterLog() {
  const [count, setCount] = React.useState(0);

  React.useEffect(
    /**
     * 错误示例：定时器捕获首次渲染的 count。
     * @returns {() => void} 清除定时器的函数。
     */
    () => {
      const timerId = window.setInterval(
        /**
         * 输出闭包中的 count。
         * @returns {void}
         */
        () => {
          console.log(count);
        },
        1000
      );

      /**
       * 清除定时器。
       * @returns {void}
       */
      function cleanupTimer() {
        window.clearInterval(timerId);
      }

      return cleanupTimer;
    },
    []
  );

  // 省略按钮代码
}
```

如果目标是每次 `count` 变化后重建定时器，应把 `count` 加入依赖。如果目标是定时器始终读取最新值且不重建，则可以用 Ref 保存最新值，但要明确 Ref 绕过了响应式更新。

### 2. 不通过禁用规则解决

`eslint-plugin-react-hooks` 的 `exhaustive-deps` 警告说明 Effect 声明的同步输入与实际读取不一致。处理方法包括：

- 补齐依赖；
- 把不需要 Effect 的派生计算移回渲染；
- 把用户操作移回事件处理函数；
- 把只供 Effect 使用的函数移入 Effect；
- 使用函数式 State 更新减少对旧 State 的读取；
- 拆分承担多个目标的 Effect。

## 三、函数依赖

### 1. 组件内函数每次重建

```jsx
// 根据任务 ID 创建连接配置并同步外部连接。
function TaskConnection({ taskId }) {
  /**
   * 根据当前 Props 创建连接配置。
   * @returns {{ endpoint: string, taskId: number }} 连接配置。
   */
  function createOptions() {
    return {
      endpoint: "/task-channel",
      taskId
    };
  }

  React.useEffect(
    /**
     * 根据配置建立连接。
     * @returns {() => void} 关闭连接的清理函数。
     */
    () => {
      const connection = connect(createOptions());
      connection.open();

      /**
       * 关闭当前连接。
       * @returns {void}
       */
      function cleanupConnection() {
        connection.close();
      }

      return cleanupConnection;
    },
    [createOptions]
  );
}
```

`createOptions` 每次渲染都是新函数，因此 Effect 每次都重启。

### 2. 把函数移入 Effect

函数只被 Effect 使用时，放入 setup 内部：

```jsx
React.useEffect(
  /**
   * 为当前 taskId 建立连接。
   * @returns {() => void} 关闭连接的清理函数。
   */
  () => {
    const options = {
      endpoint: "/task-channel",
      taskId
    };
    const connection = connect(options);
    connection.open();

    /**
     * 关闭当前连接。
     * @returns {void}
     */
    function cleanupConnection() {
      connection.close();
    }

    return cleanupConnection;
  },
  [taskId]
);
```

Effect 的真实输入只剩 `taskId`。

### 3. 稳定共享函数

函数同时传给记忆化子组件或多个 Hook 时，可以使用 `useCallback` 稳定引用。但 `useCallback` 不是删除依赖，它自身也必须声明完整依赖。

只有引用稳定能够减少 Effect 重启或记忆化子组件渲染时，`useCallback` 才提供实际收益。函数仅在一个 Effect 中使用时，直接定义到 Effect 内通常拥有更小的依赖面。

## 四、对象依赖

### 1. 渲染中新建对象

```jsx
const options = {
  endpoint: "/task-channel",
  taskId
};

React.useEffect(
  /**
   * 根据 options 建立连接。
   * @returns {() => void} 关闭连接的函数。
   */
  () => {
    const connection = connect(options);
    connection.open();
    // 依赖变化或组件卸载时关闭旧连接。
    return () => {
      connection.close();
    };
  },
  [options]
);
```

每次渲染都会创建新 `options`，导致 Effect 重启。优先把对象移入 Effect，并依赖组成对象的基本值。

### 2. 接收对象 Props

父组件传入的对象可能频繁改变引用。如果 Effect 只读取其中两个字段，应直接依赖字段：

```jsx
const { endpoint, taskId } = connectionConfig;

React.useEffect(
  /**
   * 根据稳定字段建立连接。
   * @returns {() => void} 关闭连接的函数。
   */
  () => {
    const connection = connect({ endpoint, taskId });
    connection.open();
    // 任一连接字段变化前关闭当前连接。
    return () => {
      connection.close();
    };
  },
  [endpoint, taskId]
);
```

不要用 `JSON.stringify(object)` 作为通用依赖修复。序列化有成本、忽略不可序列化值，也掩盖了 Effect 真正读取哪些字段。

## 五、清理顺序

### 1. 依赖变化

依赖变化后的顺序为：

```text
使用旧依赖完成的提交
→ 执行旧 cleanup
→ 执行新 setup
→ 保存新 cleanup
```

卸载时只执行最后一次已建立同步的 cleanup。

清理函数闭包读取的是对应 setup 那次渲染的值，因此能准确撤销旧订阅：

```jsx
React.useEffect(
  /**
   * 订阅当前任务。
   * @returns {() => void} 取消当前任务订阅。
   */
  () => {
    channel.subscribe(taskId);

    /**
     * 取消建立 setup 时对应 taskId 的订阅。
     * @returns {void}
     */
    function cleanupTaskSubscription() {
      channel.unsubscribe(taskId);
    }

    return cleanupTaskSubscription;
  },
  [channel, taskId]
);
```

### 2. 清理不是只在卸载时执行

只要依赖变化，旧 cleanup 就会执行。清理函数不能把正常的依赖切换误当作“页面永久关闭”。

例如请求清理可以取消旧请求，但不应清空整个应用级缓存。

## 六、请求竞态

### 1. 竞态表现

用户先选择任务 A，再快速选择任务 B。B 请求先完成，A 请求后完成。如果没有保护，A 的旧结果会覆盖 B。

界面上的证据是地址或选中项已经指向 B，详情却显示 A。解决重点不是预测响应顺序，而是让旧请求在依赖变化后失去提交结果的资格。

### 2. AbortController

```jsx
React.useEffect(
  /**
   * 请求当前任务并在依赖变化时取消旧请求。
   * @returns {() => void} 中止请求的清理函数。
   */
  () => {
    const controller = new AbortController();

    /**
     * 执行任务请求。
     * @returns {Promise<void>} 请求完成后的 Promise。
     */
    async function loadTask() {
      setStatus("loading");

      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const task = await response.json();
        setTask(task);
        setStatus("success");
      } catch (error) {
        if (error.name !== "AbortError") {
          setStatus("error");
        }
      }
    }

    loadTask();

    /**
     * 中止当前 taskId 对应的未完成请求。
     * @returns {void}
     */
    function cleanupRequest() {
      controller.abort();
    }

    return cleanupRequest;
  },
  [taskId]
);
```

请求库不支持取消时，至少使用闭包标志忽略过期结果。取消网络传输和忽略结果解决的是两个层面的问题。

## 七、useLayoutEffect

### 1. 调用形式

`useLayoutEffect` 的参数和清理规则与 `useEffect` 相同：

```text
React.useLayoutEffect(setup, dependencies?)
```

区别在执行时机：

```text
Render
→ Commit DOM
→ useLayoutEffect
→ 浏览器绘制
→ useEffect
```

`useLayoutEffect` 同步阻塞浏览器绘制。它适合读取提交后的 DOM 布局并立即修正界面，普通订阅、请求和日志仍应使用 `useEffect`。

### 2. 测量 DOM

下面在绘制前测量提示元素高度：

```jsx
/**
 * 显示并测量提示内容。
 * @param {{ message: string }} props 组件属性。
 * @returns {React.ReactElement} 提示及高度信息。
 */
function MeasuredNotice({ message }) {
  const noticeRef = React.useRef(null);
  const [height, setHeight] = React.useState(0);

  React.useLayoutEffect(
    /**
     * DOM 提交后、绘制前读取真实高度。
     * @returns {void}
     */
    () => {
      const nextHeight = noticeRef.current.getBoundingClientRect().height;
      setHeight(nextHeight);
    },
    [message]
  );

  return (
    <div>
      <p ref={noticeRef}>{message}</p>
      <span>提示高度：{height}px</span>
    </div>
  );
}
```

React 会在浏览器绘制前处理 `setHeight` 引起的同步更新，用户不会先看到未测量状态再看到修正状态。

### 3. 服务端边界

服务端没有 DOM 布局，`useLayoutEffect` 无法在服务端执行。支持 SSR 的组件应避免在服务端渲染路径依赖布局读取，或只在客户端挂载后显示需要布局测量的内容。

服务端与客户端首次渲染还要输出一致结构，否则 hydrate 会产生不匹配警告。布局测量结果应在客户端提交后再写入 State，不能伪造成服务端已知值。

## 八、选择与排查

| 情况 | 使用方式 |
|------|----------|
| 同步请求、订阅、标题、存储 | `useEffect` |
| 读取布局并在绘制前修正 | `useLayoutEffect` |
| 由 Props 和 State 计算结果 | 不使用 Effect |
| 用户单击直接触发操作 | 事件处理函数 |
| 依赖警告 | 补齐依赖或重构职责 |
| Effect 每次重启 | 检查函数和对象引用 |
| 旧请求覆盖新请求 | 清理时取消或让结果失效 |

依赖数组不是手动选择“何时执行”的开关，而是 Effect 所读取响应式输入的完整声明。
