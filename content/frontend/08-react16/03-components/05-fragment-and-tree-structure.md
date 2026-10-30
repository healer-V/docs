---
title: "Fragment 与组件树结构"
tags:
  - React
  - Fragment
  - 组件树
excerpt: "讲解 Fragment 的短语法、显式语法和 Key，并说明 Fragment 对组件树、DOM 结构、语义标签和 CSS 布局的影响。"
date: 2026-07-31
---

# Fragment 与组件树结构

## 一、Fragment

### 1. Fragment 的作用

组件需要返回多个并列元素时，Fragment 可以把这些元素组成一个 React 返回结果，同时不创建额外 DOM 节点。

::: details 查看Fragment 的作用的示例代码
```jsx
/**
 * 显示任务标题和状态。
 * @param {{ title: string, status: string }} props 组件属性。
 * @returns {React.ReactElement} 包含两个并列元素的 Fragment。
 */
function TaskSummary({ title, status }) {
  return (
    <React.Fragment>
      <h2>{title}</h2>
      <p>{status}</p>
    </React.Fragment>
  );
}
```
:::

浏览器 DOM 中只有 `h2` 和 `p`：

```html
<h2>核对订单</h2>
<p>处理中</p>
```

Fragment 存在于 React 元素树中，但不会对应一个浏览器元素。

### 2. 短语法

不需要设置 `key` 时，可以使用 `<>...</>`：

::: details 查看短语法的示例代码
```jsx
/**
 * 显示任务的两个描述字段。
 * @returns {React.ReactElement} Fragment。
 */
function TaskMeta() {
  return (
    <>
      <dt>负责人</dt>
      <dd>林晨</dd>
    </>
  );
}
```
:::

短语法不能接收属性。需要 `key` 时必须写显式的 `<React.Fragment>`。

| 写法 | 适用场景 |
|------|----------|
| `<>...</>` | 普通分组，不需要任何属性 |
| `<React.Fragment>...</React.Fragment>` | 需要 `key`，或希望明确展示 Fragment |

React 16.8 的 Fragment 只支持 `key`，不能设置 `className`、事件或其他 DOM 属性。

## 二、带 Key 的 Fragment

### 1. 列表项包含多个并列节点

数组中的每条数据需要生成多个并列节点时，Fragment 本身应作为列表项并接收 `key`。

::: details 查看列表项包含多个并列节点的示例代码
```jsx
const tasks = [
  { id: 17, title: "核对订单", owner: "林晨" },
  { id: 28, title: "联系客户", owner: "周宁" }
];

/**
 * 把任务转换为术语列表中的标题与内容。
 * @param {{ id: number, title: string, owner: string }} task 当前任务。
 * @returns {React.ReactElement} 带 Key 的 Fragment。
 */
function renderTaskMeta(task) {
  return (
    <React.Fragment key={task.id}>
      <dt>{task.title}</dt>
      <dd>负责人：{task.owner}</dd>
    </React.Fragment>
  );
}

/**
 * 显示任务说明列表。
 * @returns {React.ReactElement} 任务术语列表。
 */
function TaskDescriptionList() {
  return <dl>{tasks.map(renderTaskMeta)}</dl>;
}
```
:::

`key` 放在数组直接返回的 Fragment 上，而不是分别放到 `dt` 和 `dd`。React 把一组标题和内容视为同一条任务对应的列表项。

### 2. 短语法不能设置 Key

下面的写法无法满足列表身份要求：

```jsx
tasks.map(
  // 错误：短 Fragment 不能接收 key。
  (task) => (
    <>
      <dt>{task.title}</dt>
      <dd>{task.owner}</dd>
    </>
  )
);
```

如果控制台出现列表 Key 警告，应检查数组回调直接返回的最外层元素，而不是只查看其内部子元素。

## 三、组件树与 DOM 树

### 1. 两棵树不完全相同

React 组件树描述组件和 React 元素之间的关系；DOM 树只包含实际提交给浏览器的宿主元素与文本节点。

::: details 查看两棵树不完全相同的完整输出
```text
React 组件树
TaskPage
└─ TaskSummary
   └─ Fragment
      ├─ h2
      └─ p

浏览器 DOM 树
main
├─ h2
└─ p
```
:::

函数组件和 Fragment 都不会自动创建同名 DOM。只有小写宿主元素，如 `main`、`h2`、`p`，才会形成浏览器节点。

### 2. Fragment 不提供布局盒子

Fragment 没有 DOM 节点，因此不能承担以下职责：

- 设置 `display: flex` 或 `display: grid`；
- 提供边距、背景和边框；
- 接收点击事件；
- 提供 `role`、`aria-label` 等无障碍语义；
- 作为 DOM 查询或 Ref 的目标。

需要这些能力时，应使用真实且语义合适的元素：

::: details 查看Fragment 不提供布局盒子的示例代码
```jsx
/**
 * 使用真实容器建立工具栏布局。
 * @returns {React.ReactElement} 工具栏。
 */
function TaskToolbar() {
  return (
    <div className="task-toolbar" role="toolbar" aria-label="任务操作">
      <button type="button">新增</button>
      <button type="button">批量完成</button>
    </div>
  );
}
```
:::

如果改用 Fragment，两个按钮仍会渲染，但工具栏布局和语义都没有承载节点。

## 四、语义结构

### 1. 不为了减少 DOM 删除语义

额外 DOM 节点并不总是无意义。`section`、`article`、`ul`、`fieldset` 等元素能够表达内容关系或提供浏览器行为。

| 需求 | 应选择 |
|------|--------|
| 仅满足 JSX 单一返回结果 | Fragment |
| 表示独立文章或区域 | `article`、`section` |
| 表示一组列表项 | `ul` 或 `ol` |
| 表示一组表单控件 | `fieldset` |
| 提供布局、样式或事件边界 | 合适的真实元素 |

### 2. 避免无效 HTML 嵌套

Fragment 可以避免为了包裹而生成破坏 HTML 结构的元素。例如表格行中必须直接包含单元格：

::: details 查看避免无效 HTML 嵌套的示例代码
```jsx
/**
 * 返回一行中的两个单元格。
 * @param {{ title: string, status: string }} props 组件属性。
 * @returns {React.ReactElement} 单元格 Fragment。
 */
function TaskCells({ title, status }) {
  return (
    <>
      <td>{title}</td>
      <td>{status}</td>
    </>
  );
}

const row = (
  <tr>
    <TaskCells title="核对订单" status="处理中" />
  </tr>
);
```
:::

若 `TaskCells` 返回 `div`，浏览器会得到 `tr > div > td` 的无效表格结构。Fragment 让 `td` 保持为 `tr` 的直接子元素。

## 五、Fragment 与数组

数组也能作为 React 返回值，但每个数组元素都需要 Key，而且书写嵌套结构时可读性较低。

```jsx
/**
 * 使用元素数组返回两个节点。
 * @returns {React.ReactElement[]} 带 Key 的元素数组。
 */
function TaskArray() {
  return [
    <h2 key="title">任务摘要</h2>,
    <p key="status">处理中</p>
  ];
}
```

普通并列 JSX 优先使用 Fragment；数据集合使用数组转换；需要布局或语义时使用真实容器。

| 问题 | 原因 | 处理方式 |
|------|------|----------|
| Fragment 上的 `className` 不生效 | Fragment 不生成 DOM 且不接收该属性 | 改用真实元素 |
| 列表仍提示缺少 Key | Key 没放在回调直接返回的 Fragment 上 | 使用显式 Fragment 并设置 Key |
| CSS 子选择器结果变化 | 删除容器后 DOM 层级改变 | 检查布局和选择器依赖 |
| 无障碍分组语义丢失 | Fragment 无语义 | 使用 `section`、`fieldset` 等元素 |

Fragment 解决的是 React 返回结构问题，不是所有容器元素的替代品。
