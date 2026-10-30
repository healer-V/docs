---
title: "children 与组件组合"
tags:
  - React
  - children
  - 组件组合
excerpt: "讲解 children 的来源、可接受内容和 React.Children API，并通过普通区域、具名区域和元素增强说明组件组合的边界。"
date: 2026-07-31
---

# children 与组件组合

## 一、children

### 1. children 的来源

组件标签开始与结束之间的内容会通过 `props.children` 传入组件。组件不需要预先知道子内容的具体结构，只需决定把它放在什么位置。

```jsx
<Panel>
  <p>待处理任务：3</p>
</Panel>
```

上面的 `<p>` React 元素就是 `Panel` 的 `children`。

```jsx
/**
 * 为任意子内容提供面板结构。
 * @param {{ children: React.ReactNode }} props 组件属性。
 * @returns {React.ReactElement} 包含子内容的面板。
 */
function Panel({ children }) {
  return <section className="panel">{children}</section>;
}
```

页面最终生成：

```html
<section class="panel">
  <p>待处理任务：3</p>
</section>
```

### 2. children 可以包含的值

`children` 可以是 React 能够渲染的任意内容，而不只是一项 React 元素。

| 内容 | 示例 | 渲染结果 |
|------|------|----------|
| 文本 | `<Label>待处理</Label>` | 文本节点 |
| 数字 | `<Count>3</Count>` | 文本节点 |
| React 元素 | `<Panel><TaskList /></Panel>` | 元素子树 |
| 多个并列内容 | `<Panel><h2 /><p /></Panel>` | 多个子节点 |
| `null`、`undefined`、布尔值 | `<Panel>{null}</Panel>` | 不产生可见节点 |
| 元素数组 | `<List>{items}</List>` | 按数组顺序渲染 |

组件如果只接收文本，应通过明确的 Props 表达约束；如果需要允许调用者传入结构，再使用 `children`。

```jsx
// title 只能表达标题数据。
<TaskHeader title="今日任务" />

// children 允许调用者组合标题、操作按钮等结构。
<TaskHeader>
  <h2>今日任务</h2>
  <button type="button">新建</button>
</TaskHeader>
```

### 3. children 不是普通数组

有多个子节点时，`children` 可能表现为数组；只有一个子节点时，它通常就是该值本身；没有子节点时通常是 `undefined`。不要直接依赖 `children.length` 或调用 `children.map`。

React 提供 `React.Children` 统一处理这些形态：

| API | 参数 | 返回值 | 作用 |
|-----|------|--------|------|
| `React.Children.count(children)` | 子内容 | 数字 | 统计子节点数量 |
| `React.Children.map(children, fn)` | 子内容、转换函数 | 数组或 `null` | 转换每个子节点并保留 Key 关系 |
| `React.Children.forEach(children, fn)` | 子内容、访问函数 | `undefined` | 遍历但不创建结果数组 |
| `React.Children.toArray(children)` | 子内容 | 数组 | 把不透明子内容转换为扁平数组 |
| `React.Children.only(children)` | 单个 React 元素 | 该元素 | 断言只有一个有效 React 元素 |

下面为每个子节点增加列表包装：

::: details 查看children 不是普通数组的示例代码
```jsx
/**
 * 把一个子节点包装为列表项。
 * @param {React.ReactNode} child 当前子节点。
 * @param {number} index 子节点位置，只用于生成展示序号。
 * @returns {React.ReactElement} 包含序号的列表项。
 */
function wrapChild(child, index) {
  return (
    <li>
      <span>{index + 1}. </span>
      {child}
    </li>
  );
}

/**
 * 把任意数量的子内容显示为编号列表。
 * @param {{ children: React.ReactNode }} props 组件属性。
 * @returns {React.ReactElement} 编号列表。
 */
function NumberedList({ children }) {
  return <ol>{React.Children.map(children, wrapChild)}</ol>;
}
```
:::

调用：

```jsx
<NumberedList>
  <span>核对订单</span>
  <span>联系客户</span>
</NumberedList>
```

页面显示两项编号内容。即使调用者只传一个子节点，`React.Children.map` 也能正确处理。

## 二、普通组合

### 1. 容器决定布局

组合模式让容器负责外层结构，让调用者负责实际内容。容器不需要读取子组件内部数据。

::: details 查看容器决定布局的示例代码
```jsx
/**
 * 显示带标题和主体区域的卡片。
 * @param {{ title: string, children: React.ReactNode }} props 组件属性。
 * @returns {React.ReactElement} 卡片结构。
 */
function Card({ title, children }) {
  return (
    <article className="card">
      <h2>{title}</h2>
      <div className="card__content">{children}</div>
    </article>
  );
}

const element = (
  <Card title="任务详情">
    <p>负责人：林晨</p>
    <p>截止时间：17:30</p>
  </Card>
);
```
:::

`Card` 只定义标题和主体布局，不需要增加 `owner`、`deadline` 等业务 Props。调用者可以把任何合法 React 内容放入主体区域。

### 2. 组合优于继承

React 组件通常通过 Props 和 `children` 组合差异，不使用类继承建立“特殊组件”。

下面通过 Props 组合警告样式和内容：

::: details 查看组合优于继承的示例代码
```jsx
/**
 * 显示不同语气的消息区域。
 * @param {{ tone?: "normal" | "warning", children: React.ReactNode }} props 组件属性。
 * @returns {React.ReactElement} 消息区域。
 */
function Message({ tone = "normal", children }) {
  return (
    <div className={`message message--${tone}`}>
      {children}
    </div>
  );
}

const warning = (
  <Message tone="warning">
    <strong>任务即将超时</strong>
  </Message>
);
```
:::

这里不需要创建继承 `Message` 的 `WarningMessage` 类。差异通过 `tone` 和 `children` 清晰表达。

## 三、具名区域

### 1. 多个内容位置

一个组件需要多个可替换区域时，仅使用 `children` 无法区分每段内容的目标位置。可以使用值为 React 节点的具名 Props。

::: details 查看多个内容位置的示例代码
```jsx
/**
 * 显示包含标题、操作区和主体的页面区域。
 * @param {{
 *   heading: React.ReactNode,
 *   actions?: React.ReactNode,
 *   children: React.ReactNode
 * }} props 组件属性。
 * @returns {React.ReactElement} 页面区域。
 */
function PageSection({ heading, actions, children }) {
  return (
    <section>
      <header>
        <div>{heading}</div>
        <div>{actions}</div>
      </header>
      <div>{children}</div>
    </section>
  );
}

const element = (
  <PageSection
    heading={<h2>客户任务</h2>}
    actions={<button type="button">新增任务</button>}
  >
    <p>当前共有 3 项任务。</p>
  </PageSection>
);
```
:::

`heading`、`actions` 和 `children` 分别对应固定位置。调用者仍然控制各区域内部的元素结构。

### 2. 数据 Props 与结构 Props

Props 可以传数据，也可以传 React 节点。选择依据是组件由谁控制展示结构：

| 需求 | 推荐接口 |
|------|----------|
| 组件统一决定标题标签和样式 | `title="客户任务"` |
| 调用者需要放入图标、徽标或链接 | `heading={<TaskHeading />}` |
| 只有一个主要内容区域 | `children` |
| 有多个明确内容区域 | 具名 React 节点 Props |

如果只需要字符串却允许任意 React 节点，组件的展示约束会变弱；如果调用者确实需要组合结构，只接收字符串又会产生大量特例 Props。

## 四、限制子内容

### 1. 要求单个元素

某些组件必须把属性附加到唯一子元素上，可以使用 `React.Children.only` 进行运行时断言。

```jsx
/**
 * 要求调用者只传入一个 React 元素。
 * @param {{ children: React.ReactElement }} props 组件属性。
 * @returns {React.ReactElement} 唯一的子元素。
 */
function SingleChild({ children }) {
  return React.Children.only(children);
}
```

传入两个并列元素时，`React.Children.only` 会抛出错误。它要求的是一个 React 元素，字符串即使只有一个也不符合要求。

```jsx
// 正确
<SingleChild>
  <button type="button">保存</button>
</SingleChild>

// 错误：存在两个子元素
<SingleChild>
  <button type="button">保存</button>
  <button type="button">取消</button>
</SingleChild>
```

### 2. 增强已有元素

`React.cloneElement(element, props, ...children)` 可以基于已有 React 元素创建一个新元素，并合并新的 Props。

| 参数 | 含义 |
|------|------|
| `element` | 要复制的 React 元素 |
| `props` | 要覆盖或新增的 Props |
| `...children` | 可选的新子内容 |
| 返回值 | 新的 React 元素，原元素不被修改 |

下面统一给唯一按钮增加禁用状态：

::: details 查看增强已有元素的示例代码
```jsx
/**
 * 根据权限禁用唯一子按钮。
 * @param {{ allowed: boolean, children: React.ReactElement }} props 组件属性。
 * @returns {React.ReactElement} 合并 disabled 属性后的按钮元素。
 */
function PermissionGuard({ allowed, children }) {
  const child = React.Children.only(children);
  return React.cloneElement(child, {
    disabled: child.props.disabled || !allowed
  });
}
```
:::

`cloneElement` 会让父组件了解子元素 Props，容易形成隐式协议。简单场景更适合直接使用明确 Props；只有包装器确实需要协调子元素时才使用元素克隆。

## 五、组合边界

### 1. 容器不读取子组件内部状态

`children` 只是 React 内容描述。父容器不能通过 `children` 直接读取子组件运行后的 State，也不能修改子组件实例内部数据。

需要协调状态时，应选择明确的数据流：

- 父组件保存 State，通过 Props 传给子组件；
- 子组件通过回调报告用户意图；
- 多层组件共享状态时使用 Context；
- 一组组件具有固定协作协议时使用复合组件。

### 2. 常见问题

| 问题 | 原因 | 处理方式 |
|------|------|----------|
| 直接执行 `children.map` 报错 | 单个 children 不一定是数组 | 使用 `React.Children.map` |
| 容器 Props 越来越多 | 每种子内容都被设计为专用字段 | 使用 `children` 或具名 React 节点 |
| 调用者无法定制区域结构 | 组件只接收字符串或数据 | 把需要开放的区域设计为 React 节点 |
| `cloneElement` 协议难以追踪 | 父组件隐式覆盖子元素 Props | 优先改为显式 Props 或 Context |
| Fragment 被误当作布局容器 | Fragment 不生成 DOM | 需要布局和语义时使用真实元素 |

组合的关键是划分结构控制权：容器控制稳定布局，调用者控制可变内容，跨组件状态仍通过明确的数据和事件接口流动。
