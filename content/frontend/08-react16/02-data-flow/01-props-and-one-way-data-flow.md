---
title: "Props 与单向数据流"
tags:
  - React
  - Props
  - React 16.8
excerpt: "从最小函数组件开始，讲解 Props 的传递、读取、默认值、只读约束以及父组件到子组件的单向数据流。"
date: 2026-07-30
---

# Props 与单向数据流

## 一、函数组件基础

### 1. 定义函数组件

函数组件是一个返回 React 可渲染值的 JavaScript 函数。组件名称必须以大写字母开头，否则 JSX 会把它当成浏览器原生标签。

**基本形式：**

::: details 查看基本形式：完整代码
```jsx
/**
 * 描述一个静态任务卡片。
 * @returns {React.ReactElement} 任务卡片对应的 React 元素。
 */
function TaskCard() {
  return (
    <article>
      <h2>核对订单</h2>
      <p>状态：进行中</p>
    </article>
  );
}
```
:::

这里的 `TaskCard` 是组件定义，调用结果还没有进入页面。函数返回 JSX，JSX 再转换为 React 元素。

组件可以返回一个 React 元素、Fragment 或 `null`，不能返回多个没有共同父级的并列元素。

### 2. 使用组件

组件通过 JSX 标签使用：

```jsx
const pageElement = (
  <main>
    <h1>任务中心</h1>
    <TaskCard />
  </main>
);

ReactDOM.render(pageElement, document.getElementById("root"));
```

React 遇到 `<TaskCard />` 时会调用 `TaskCard`，再继续处理函数返回的 `article`。页面显示：

```text
任务中心
核对订单
状态：进行中
```

大写名称表示自定义组件，小写名称表示宿主元素：

| JSX | React 的处理 |
|-----|--------------|
| `<TaskCard />` | 调用 `TaskCard` 函数 |
| `<article />` | 创建浏览器 `article` 元素 |
| `<task-card />` | 尝试创建名为 `task-card` 的自定义 DOM 标签 |

不要写 `TaskCard()` 代替 `<TaskCard />`。直接调用只是普通函数调用，会绕过 React 对组件身份和 Hooks 调用的管理。

## 二、Props

### 1. Props 是组件输入

Props 是父组件传给子组件的输入数据。JSX 上的属性会被 React 整理成一个对象，并作为函数组件的第一个参数。

**定义形式：**

```jsx
/**
 * 显示由 Props 提供的任务标题。
 * @param {{title: string}} props 组件输入，title 为任务标题。
 * @returns {React.ReactElement} 任务标题元素。
 */
function TaskTitle(props) {
  return <h2>{props.title}</h2>;
}
```

**使用形式：**

```jsx
const titleElement = <TaskTitle title="核对订单" />;
```

React 形成的调用关系可以理解为：

```text
<TaskTitle title="核对订单" />
→ React 创建 { title: "核对订单" }
→ React 调用 TaskTitle(props)
→ 组件读取 props.title
```

Props 对象由 React 提供，不需要开发者手动调用组件函数。

### 2. 解构 Props

Props 是普通对象，因此可以使用参数解构直接取得字段：

::: details 查看解构 Props的示例代码
```jsx
/**
 * 显示任务标题和状态。
 * @param {{title: string, status: string}} props 任务展示数据。
 * @returns {React.ReactElement} 任务摘要元素。
 */
function TaskSummary({ title, status }) {
  return (
    <article>
      <h2>{title}</h2>
      <p>状态：{status}</p>
    </article>
  );
}
```
:::

解构不会改变数据来源，只是省略重复的 `props.`。字段较少且名称明确时适合直接解构；需要把完整输入继续传递或区分同名变量时，可以保留 `props` 对象。

## 三、传递 Props

### 1. 传递不同类型的值

组件属性与普通 JSX 属性使用相同的数据规则。字符串字面量可以使用引号，其他 JavaScript 值使用大括号。

| 数据 | 传递形式 |
|------|----------|
| 固定字符串 | `title="核对订单"` |
| 字符串变量 | `title={task.title}` |
| 数字 | `priority={3}` |
| 布尔值 | `completed={false}` |
| 对象 | `assignee={task.assignee}` |
| 数组 | `tags={task.tags}` |
| 函数 | `onSelect={handleSelect}` |
| React 元素 | `icon={<TaskIcon />}` |

下面的父组件准备数据并传给子组件：

::: details 查看传递不同类型的值的示例代码
```jsx
/**
 * 根据输入数据显示任务详情。
 * @param {{
 *   title: string,
 *   priority: number,
 *   completed: boolean,
 *   assignee: {name: string}
 * }} props 任务详情输入。
 * @returns {React.ReactElement} 任务详情元素。
 */
function TaskDetail({ title, priority, completed, assignee }) {
  return (
    <article>
      <h2>{title}</h2>
      <p>负责人：{assignee.name}</p>
      <p>优先级：{priority}</p>
      <p>状态：{completed ? "已完成" : "进行中"}</p>
    </article>
  );
}

/**
 * 准备任务数据并渲染 TaskDetail。
 * @returns {React.ReactElement} 任务详情页面。
 */
function TaskPage() {
  const task = {
    title: "核对订单",
    priority: 3,
    completed: false,
    assignee: { name: "林晓" }
  };

  return (
    <TaskDetail
      title={task.title}
      priority={task.priority}
      completed={task.completed}
      assignee={task.assignee}
    />
  );
}
```
:::

属性名决定子组件中的字段名。父组件写 `priority={task.priority}`，子组件就从 `props.priority` 读取。

### 2. 传递回调

函数也可以作为 Props。父组件提供回调，子组件在用户操作发生时调用它，用于把“用户做了什么”通知数据所有者。

::: details 查看传递回调的示例代码
```jsx
/**
 * 提供一个可选择的任务按钮。
 * @param {{taskId: string, onSelect: (taskId: string) => void}} props
 * taskId 为任务 ID，onSelect 接收被选择的任务 ID。
 * @returns {React.ReactElement} 任务选择按钮。
 */
function TaskButton({ taskId, onSelect }) {
  // 点击时把当前任务 ID 交给父组件提供的回调。
  const handleClick = () => {
    onSelect(taskId);
  };

  return (
    <button type="button" onClick={handleClick}>
      选择任务
    </button>
  );
}

/**
 * 处理子组件报告的任务选择。
 * @param {string} taskId 被选择的任务 ID。
 * @returns {void} 只记录选择结果。
 */
function handleTaskSelect(taskId) {
  console.log(`选择任务：${taskId}`);
}

const buttonElement = (
  <TaskButton
    taskId="task-104"
    onSelect={handleTaskSelect}
  />
);
```
:::

点击后控制台输出 `选择任务：task-104`。回调仍然由父级定义，子组件只决定何时报告用户意图。状态提升将在 2.5 中完整展开。

## 四、单向数据流

### 1. 数据从父组件流向子组件

React 组件树中的普通数据沿 Props 从上到下传递：

```text
父组件拥有数据
→ JSX 属性传递数据
→ 子组件接收 Props
→ 子组件根据 Props 生成界面
```

子组件可以读取 Props、基于 Props 计算内容，也可以把 Props 继续传给更深层组件，但不能反向修改父组件的数据。

### 2. Props 是只读输入

组件不能修改 Props 对象或其中的数据：

::: details 查看Props 是只读输入的示例代码
```jsx
/**
 * 错误示例：尝试修改组件输入。
 * @param {{title: string}} props 任务输入。
 * @returns {React.ReactElement} 任务标题元素。
 */
function InvalidTaskTitle(props) {
  // 错误：组件不拥有 title，不能修改父组件传入的 Props。
  props.title = "已被子组件修改";

  return <h2>{props.title}</h2>;
}
```
:::

直接赋值破坏了父组件对数据的所有权，也会让其他读取同一数据的组件得到不可预测结果。正确做法是让父组件更新自己拥有的数据，再通过新的 Props 重新渲染子组件。

“只读”指组件不能修改输入，并不表示对象在 JavaScript 中一定被冻结。React 依赖的是开发约定和数据所有权，而不是自动拦截每一次赋值。

## 五、默认值

### 1. 使用参数默认值

Props 缺失或值为 `undefined` 时，可以通过参数解构默认值提供回退内容：

::: details 查看使用参数默认值的示例代码
```jsx
/**
 * 显示任务状态，缺少 status 时使用“未开始”。
 * @param {{title: string, status?: string}} props 任务展示输入。
 * @returns {React.ReactElement} 带默认状态的任务元素。
 */
function TaskStatus({ title, status = "未开始" }) {
  return (
    <p>
      {title}：{status}
    </p>
  );
}

const statusElement = <TaskStatus title="核对订单" />;
```
:::

页面显示“核对订单：未开始”。

默认值只在属性缺失或显式传入 `undefined` 时生效，传入 `null`、空字符串或 `0` 时不会使用默认值：

| 传入方式 | `status` 结果 |
|----------|--------------|
| `<TaskStatus />` | `"未开始"` |
| `status={undefined}` | `"未开始"` |
| `status={null}` | `null` |
| `status=""` | `""` |

### 2. React 16.8 的 `defaultProps`

React 16.8 也支持给函数组件设置 `defaultProps`：

::: details 查看React 16.8 的 `defaultProps`的示例代码
```jsx
/**
 * 显示任务优先级。
 * @param {{priority?: string}} props 优先级输入。
 * @returns {React.ReactElement} 优先级文本。
 */
function TaskPriority({ priority }) {
  return <p>优先级：{priority}</p>;
}

TaskPriority.defaultProps = {
  priority: "普通"
};
```
:::

参数默认值更接近普通 JavaScript，单个函数组件中通常更直接；维护 React 16.8 历史代码时仍需要认识 `defaultProps`。

## 六、Props 契约

### 1. 使用 `PropTypes`

`PropTypes` 在开发环境运行时检查 Props，适合 JavaScript 项目发现传值类型错误。React 16.8 需要单独安装 `prop-types` 包。

::: details 查看使用 `PropTypes`的示例代码
```jsx
import PropTypes from "prop-types";

/**
 * 显示具有运行时输入检查的任务。
 * @param {{title: string, priority?: number}} props 任务输入。
 * @returns {React.ReactElement} 任务摘要。
 */
function TaskSummary({ title, priority = 1 }) {
  return (
    <p>
      {title}，优先级 {priority}
    </p>
  );
}

TaskSummary.propTypes = {
  title: PropTypes.string.isRequired,
  priority: PropTypes.number
};
```
:::

开发环境中传入 `priority="high"` 会产生控制台警告，但 `PropTypes` 不会自动转换数据，也不会在生产环境替代业务校验。

### 2. 使用 TypeScript 约束

TypeScript 在编译和编辑阶段检查 Props：

::: details 查看使用 TypeScript 约束的示例代码
```tsx
interface TaskSummaryProps {
  title: string;
  priority?: number;
}

/**
 * 显示具有编译期输入约束的任务。
 * @param props 任务输入，priority 缺失时使用 1。
 * @returns 任务摘要元素。
 */
function TaskSummary({
  title,
  priority = 1
}: TaskSummaryProps) {
  return <p>{title}，优先级 {priority}</p>;
}
```
:::

`PropTypes` 与 TypeScript 都用于描述输入契约，但都不会改变 Props 的单向流动和只读规则。接口返回的数据仍需要运行时校验，不能只依赖 TypeScript。

## 七、传递边界

### 1. 只传子组件需要的数据

组件只需要标题和状态时，显式传递这两个字段比传入完整页面模型更清楚：

```jsx
// 推荐：组件接口直接说明它依赖哪些数据。
const summaryElement = (
  <TaskSummary
    title={task.title}
    status={task.status}
  />
);
```

传入完整 `task` 对象不是语法错误，但会隐藏依赖并扩大耦合。对象本身就是子组件需要的稳定业务实体时可以整体传递；否则优先提供最小接口。

### 2. 谨慎展开 Props

组件属性支持对象展开：

```jsx
const summaryProps = {
  title: "核对订单",
  status: "进行中"
};

const summaryElement = <TaskSummary {...summaryProps} />;
```

展开适合字段已经经过筛选、与组件契约完全一致的对象。不要把接口响应或页面对象直接展开给组件，否则无关字段和覆盖顺序难以确认。

`children` 也是 React 提供的特殊 Props，表示组件标签之间的内容。

## 八、完整示例

下面的片段形成完整 Props 数据流：

::: details 查看完整示例代码
```jsx
/**
 * 显示单个任务的只读摘要。
 * @param {{title: string, owner: string, completed: boolean}} props 任务输入。
 * @returns {React.ReactElement} 任务摘要元素。
 */
function TaskSummary({ title, owner, completed }) {
  return (
    <article>
      <h2>{title}</h2>
      <p>负责人：{owner}</p>
      <p>状态：{completed ? "已完成" : "进行中"}</p>
    </article>
  );
}

/**
 * 拥有任务数据并向子组件传递。
 * @returns {React.ReactElement} 任务页面。
 */
function TaskPage() {
  const task = {
    title: "核对订单",
    owner: "林晓",
    completed: false
  };

  return (
    <main>
      <h1>任务详情</h1>
      <TaskSummary
        title={task.title}
        owner={task.owner}
        completed={task.completed}
      />
    </main>
  );
}

ReactDOM.render(<TaskPage />, document.getElementById("root"));
```
:::

页面显示：

```text
任务详情
核对订单
负责人：林晓
状态：进行中
```

`TaskPage` 拥有数据，`TaskSummary` 只读取输入并生成界面。

## 九、知识检查

| 检查项 | 正确结论 |
|--------|----------|
| 函数组件名称为什么大写 | 让 JSX 区分组件和宿主标签 |
| Props 从哪里产生 | React 根据父组件 JSX 上的属性生成 |
| 子组件能否修改 Props | 不能，Props 是只读输入 |
| 数据的基本流向 | 从拥有数据的父组件流向子组件 |
| 属性缺失时怎样提供默认值 | 使用参数默认值或 React 16.8 的 `defaultProps` |
| `PropTypes` 与 TypeScript 是否改变数据流 | 不改变，只负责检查输入契约 |
| 是否应该展开完整接口对象 | 不应该，先筛选组件真正需要的字段 |

## 十、参考资料

- [React 旧版文档：Components and Props](https://legacy.reactjs.org/docs/components-and-props.html)
- [React 旧版文档：Typechecking With PropTypes](https://legacy.reactjs.org/docs/typechecking-with-proptypes.html)
