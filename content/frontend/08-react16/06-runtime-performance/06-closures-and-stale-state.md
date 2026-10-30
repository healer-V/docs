---
title: "闭包、快照与陈旧状态"
tags:
  - React
  - 闭包
  - State
excerpt: "解释每次渲染如何创建独立闭包，以及事件、定时器、Promise 和 Effect 为什么读取旧值，并比较 updater、依赖和 Ref 的修复边界。"
date: 2026-07-31
---

# 闭包、快照与陈旧状态

## 一、JavaScript 闭包

函数可以读取定义位置作用域中的变量，即使函数稍后才执行：

::: details 查看JavaScript 闭包的示例代码
```js
/**
 * 创建显示指定标题的函数。
 * @param {string} title 要显示的标题。
 * @returns {() => void} 显示标题的函数。
 */
function createTitleLogger(title) {
  /**
   * 输出创建时捕获的 title。
   * @returns {void}
   */
  function logTitle() {
    console.log(title);
  }

  return logTitle;
}

const logger = createTitleLogger("核对订单");
logger(); // 核对订单
```
:::

`logTitle` 捕获了这次 `createTitleLogger` 调用中的 `title`。

## 二、渲染闭包

### 1. 每次渲染是一次函数调用

函数组件每次渲染都会创建新的 Props 参数、局部变量和事件函数：

```text
第 1 次渲染：count = 0，创建 handleClick #1
第 2 次渲染：count = 1，创建 handleClick #2
第 3 次渲染：count = 2，创建 handleClick #3
```

每个 `handleClick` 捕获对应渲染的 `count`。

### 2. 延迟读取

::: details 查看延迟读取的示例代码
```jsx
/**
 * 延迟显示单击时的计数。
 * @returns {React.ReactElement} 计数和延迟提示按钮。
 */
function DelayedCounter() {
  const [count, setCount] = React.useState(0);

  /**
   * 增加计数。
   * @returns {void}
   */
  function handleIncrement() {
    setCount(
      /**
       * 根据前一计数增加 1。
       * @param {number} previousCount 前一计数。
       * @returns {number} 下一计数。
       */
      (previousCount) => previousCount + 1
    );
  }

  /**
   * 三秒后显示当前渲染捕获的计数。
   * @returns {void}
   */
  function handleShowLater() {
    window.setTimeout(
      /**
       * 显示单击时的 count。
       * @returns {void}
       */
      () => {
        window.alert(count);
      },
      3000
    );
  }

  return (
    <div>
      <p>{count}</p>
      <button type="button" onClick={handleIncrement}>增加</button>
      <button type="button" onClick={handleShowLater}>延迟显示</button>
    </div>
  );
}
```
:::

在 `count=2` 时单击“延迟显示”，之后继续增加到 `5`，弹窗仍显示 `2`。回调读取的是单击那次渲染的快照。

## 三、更新旧 State

### 1. updater 解决状态计算

异步回调要根据执行时的最新队列结果更新 State，使用函数式 updater：

::: details 查看updater 解决状态计算的示例代码
```jsx
window.setTimeout(
  /**
   * 延迟后基于最新队列状态增加计数。
   * @returns {void}
   */
  () => {
    setCount(
      /**
       * 根据执行更新时的前一计数计算下一值。
       * @param {number} previousCount 前一计数。
       * @returns {number} 下一计数。
       */
      (previousCount) => previousCount + 1
    );
  },
  3000
);
```
:::

updater 解决的是“如何从最新状态计算下一状态”，不是让回调中的所有变量自动变成最新值。

### 2. 多个值的关系

如果下一 State 同时依赖多个不断变化的值，可以：

- 把相关字段放进一个 Reducer；
- 在事件发生时把需要的值作为参数传入；
- 重新设计状态所有权；
- 必要时使用 Ref 读取最新但非响应式值。

不要通过嵌套多个 setter 让更新顺序变得隐含。

## 四、Effect 陈旧值

### 1. 缺失依赖

::: details 查看缺失依赖的示例代码
```jsx
function InvalidStatusLogger({ status }) {
  React.useEffect(
    /**
     * 错误：始终捕获首次渲染的 status。
     * @returns {() => void} 清除定时器的函数。
     */
    () => {
      const timerId = window.setInterval(
        /**
         * 输出旧 status。
         * @returns {void}
         */
        () => {
          console.log(status);
        },
        1000
      );

      // Effect 清理时停止持续读取旧状态的定时器。
      return () => {
        window.clearInterval(timerId);
      };
    },
    []
  );
}
```
:::

Effect 使用了 `status`，依赖却为空。正确处理取决于同步目标：

- 状态变化后应重建定时器：依赖 `[status]`；
- 定时器持续存在但读取最新状态：使用 Ref；
- 日志只需在状态变化时输出：移除定时器，Effect 依赖 `[status]`。

### 2. useCallback 也有闭包

```jsx
const handleSave = React.useCallback(
  /**
   * 保存当前 title。
   * @returns {void}
   */
  () => {
    saveTask(title);
  },
  []
);
```

空依赖让函数永久捕获首次 `title`。`useCallback` 只缓存函数引用，不会让闭包自动读取最新值。应依赖 `[title]`，或调整函数参数。

## 五、Promise 与请求

### 1. 旧请求覆盖新请求

```text
请求 A 开始
→ 参数变为 B
→ 请求 B 开始
→ B 先完成并显示
→ A 后完成，覆盖为旧结果
```

这是异步完成顺序问题，不只是闭包问题。解决方式：

- 使用 `AbortController` 取消 A；
- 在 Effect cleanup 中把 A 标记为失效；
- 比较请求 ID，只接受最新请求；
- 使用具备缓存键与竞态管理的请求库。

### 2. 保存请求序号

::: details 查看保存请求序号的示例代码
```jsx
const requestIdRef = React.useRef(0);

/**
 * 加载指定任务，只接受最后一次请求。
 * @param {number} taskId 任务 ID。
 * @returns {Promise<void>} 请求完成后的 Promise。
 */
async function loadTask(taskId) {
  requestIdRef.current += 1;
  const currentRequestId = requestIdRef.current;
  const task = await fetchTask(taskId);

  if (currentRequestId === requestIdRef.current) {
    setTask(task);
  }
}
```
:::

每次请求捕获自己的 ID，完成时与 Ref 中最新 ID 比较。旧请求结果不会提交。

## 六、读取最新值

### 1. Ref 模式

::: details 查看Ref 模式的示例代码
```jsx
const latestStatusRef = React.useRef(status);

React.useEffect(
  /**
   * 每次提交后保存最新状态。
   * @returns {void}
   */
  () => {
    latestStatusRef.current = status;
  },
  [status]
);
```
:::

长期存在的回调读取 `latestStatusRef.current` 可以得到最新提交值。

### 2. Ref 的代价

Ref 读取绕过响应式依赖：

- 值变化不会重建 Effect；
- 值变化不会触发渲染；
- 代码更难从依赖数组判断同步条件；
- 可能掩盖本应重新同步的逻辑。

只有回调必须保持订阅身份、同时确实需要最新值时才使用。

## 七、类组件对比

类方法通常通过 `this.state` 读取当前实例状态，因此异步回调执行时可能读到最新值；函数组件回调则捕获具体渲染。

两种模型没有绝对优劣：

- 类实例值可变，容易误判某个操作对应哪个历史状态；
- 函数闭包固定，因果关系清晰，但需要正确处理最新值需求。

迁移类组件时不能假设异步方法改为函数组件后读取时机完全相同。

## 八、问题选择

| 目标 | 处理方式 |
|------|----------|
| 根据最新旧 State 计算下一 State | 函数式 updater |
| Effect 随值变化重新同步 | 完整依赖数组 |
| 长期回调读取最新值但不重建资源 | Ref |
| 请求参数变化 | Effect cleanup、取消或请求 ID |
| 用户操作需要当时的值 | 直接使用事件闭包 |
| 纯函数需要当前值 | 作为参数传入 |

| 错误修复 | 为什么不正确 |
|----------|--------------|
| 全部依赖改成 `[]` | 永久捕获首次值 |
| 所有值都放 Ref | 绕过渲染和依赖模型 |
| `useCallback(fn, [])` | 只稳定旧闭包 |
| 用定时器等待 State 更新 | 不能保证提交时机 |
| 关闭 ESLint 依赖规则 | 问题仍然存在 |

陈旧状态来自“回调属于哪一次渲染”。先确定业务需要历史快照还是最新值，再选择 updater、依赖、参数或 Ref。
