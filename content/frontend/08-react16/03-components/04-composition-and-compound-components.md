---
title: "组合模式与复合组件"
tags:
  - React
  - 组件组合
  - Context
excerpt: "讲解普通组合、具名区域和受控组合，并使用 Context.Provider 与 Context.Consumer 构建具有明确协作协议的复合组件。"
date: 2026-07-31
---

# 组合模式与复合组件

## 一、组合模式

### 1. 通过 Props 组合能力

组件组合是把多个职责单一的组件连接成更完整的界面。组件之间通过数据 Props、事件 Props 和 React 节点 Props 协作。

下面的筛选区由输入组件和状态选择组件组成：

```jsx
/**
 * 显示任务筛选区域。
 * @param {{
 *   query: string,
 *   status: string,
 *   onQueryChange: (query: string) => void,
 *   onStatusChange: (status: string) => void
 * }} props 组件属性。
 * @returns {React.ReactElement} 任务筛选控件。
 */
function TaskFilters({
  query,
  status,
  onQueryChange,
  onStatusChange
}) {
  /**
   * 把搜索词变化报告给状态所有者。
   * @param {React.ChangeEvent<HTMLInputElement>} event 输入事件。
   * @returns {void}
   */
  function handleQueryChange(event) {
    onQueryChange(event.target.value);
  }

  /**
   * 把状态筛选变化报告给状态所有者。
   * @param {React.ChangeEvent<HTMLSelectElement>} event 选择事件。
   * @returns {void}
   */
  function handleStatusChange(event) {
    onStatusChange(event.target.value);
  }

  return (
    <div className="task-filters">
      <input
        value={query}
        onChange={handleQueryChange}
        aria-label="搜索任务"
      />
      <select value={status} onChange={handleStatusChange}>
        <option value="all">全部</option>
        <option value="pending">待处理</option>
        <option value="completed">已完成</option>
      </select>
    </div>
  );
}
```

这个组件不保存筛选 State，而是组合两个控件并统一事件接口。调用者决定状态位置和筛选逻辑。

### 2. 通过 React 节点开放区域

容器需要允许调用者替换一整片结构时，可以接收具名 React 节点：

```jsx
/**
 * 显示带操作区的工具栏。
 * @param {{ title: React.ReactNode, actions?: React.ReactNode }} props 组件属性。
 * @returns {React.ReactElement} 工具栏。
 */
function Toolbar({ title, actions }) {
  return (
    <header className="toolbar">
      <div className="toolbar__title">{title}</div>
      <div className="toolbar__actions">{actions}</div>
    </header>
  );
}

const element = (
  <Toolbar
    title={<h2>客户任务</h2>}
    actions={
      <button type="button">
        新建
      </button>
    }
  />
);
```

调用者控制标题和操作区内容，`Toolbar` 控制稳定布局。只有在结构确实需要开放时才接收 React 节点；普通文本仍优先使用字符串 Props。

## 二、受控组合

### 1. 状态由组合者管理

一组组件需要共享状态时，可以让上层组件保存状态，再把当前值和操作分别传给子组件。

```jsx
/**
 * 显示可切换的任务视图。
 * @returns {React.ReactElement} 视图切换按钮和当前内容。
 */
function TaskView() {
  const [mode, setMode] = React.useState("list");

  /**
   * 切换到列表视图。
   * @returns {void}
   */
  function showList() {
    setMode("list");
  }

  /**
   * 切换到看板视图。
   * @returns {void}
   */
  function showBoard() {
    setMode("board");
  }

  return (
    <section>
      <ViewSwitcher
        mode={mode}
        onShowList={showList}
        onShowBoard={showBoard}
      />
      {mode === "list" ? <TaskListView /> : <TaskBoardView />}
    </section>
  );
}
```

共享状态范围较小时，显式 Props 最容易理解。只有多层嵌套导致大量中间组件被迫透传时，才需要 Context。

### 2. 明确受控协议

受控组件通常同时接收当前值和变化回调：

```jsx
<ViewSwitcher
  mode={mode}
  onModeChange={setMode}
/>
```

`mode` 决定当前渲染，`onModeChange` 报告用户选择。只传 `mode` 不提供回调会让组件无法修改；只传回调不传当前值则无法保持单一数据源。

## 三、复合组件

### 1. 复合组件的结构

复合组件是一组必须协同使用、共同完成一个控件的组件。调用形式通常接近自然标记结构：

```jsx
<Tabs defaultValue="pending">
  <Tabs.List>
    <Tabs.Tab value="pending">待处理</Tabs.Tab>
    <Tabs.Tab value="completed">已完成</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="pending">待处理内容</Tabs.Panel>
  <Tabs.Panel value="completed">已完成内容</Tabs.Panel>
</Tabs>
```

`Tabs` 保存当前值，`Tabs.Tab` 读取并修改该值，`Tabs.Panel` 根据该值决定是否显示。调用者只负责组合标签，不需要手动连接每个 Props。

复合组件适合以下场景：

- 子组件必须共享同一状态；
- 子组件只有放在特定父组件中才有意义；
- 调用者需要自由安排子组件结构；
- 显式 Props 透传会显著增加噪声。

### 2. 创建共享 Context

React 16.8 可以使用 `React.createContext(defaultValue)` 创建 Context：

```jsx
const TabsContext = React.createContext(null);
```

| 参数或返回值 | 含义 |
|--------------|------|
| `defaultValue` | 组件树中找不到匹配 Provider 时读取的值 |
| 返回值 | 包含 `Provider` 和 `Consumer` 的 Context 对象 |
| `Provider value` | 提供给后代消费者的当前值 |
| `Consumer` | 通过函数子节点读取最近 Provider 的值 |

使用 `null` 作为默认值可以让子组件识别错误嵌套，而不是悄悄使用一份看似有效的默认状态。

### 3. 实现 Tabs 容器

```jsx
/**
 * 为标签页子组件提供当前值和切换操作。
 * @param {{
 *   defaultValue: string,
 *   children: React.ReactNode
 * }} props 组件属性。
 * @returns {React.ReactElement} Tabs Provider。
 */
function Tabs({ defaultValue, children }) {
  const [activeValue, setActiveValue] = React.useState(defaultValue);

  const contextValue = {
    activeValue,
    setActiveValue
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}
```

`Provider` 的 `value` 同时包含当前值和更新函数。后代消费者会读取组件树中距离自己最近的 Provider。

### 4. 实现 Tab

`Context.Consumer` 的子内容必须是一个函数。React 会把当前 Context 值作为参数传入该函数。

```jsx
/**
 * 渲染一个可以切换当前标签的按钮。
 * @param {{ value: string, children: React.ReactNode }} props 组件属性。
 * @returns {React.ReactElement} Context Consumer。
 */
function Tab({ value, children }) {
  /**
   * 根据 Tabs Context 渲染标签按钮。
   * @param {{
   *   activeValue: string,
   *   setActiveValue: (value: string) => void
   * } | null} context 当前 Tabs Context。
   * @returns {React.ReactElement} 标签按钮。
   */
  function renderTab(context) {
    if (context === null) {
      throw new Error("Tabs.Tab 必须放在 Tabs 内部");
    }

    const selected = context.activeValue === value;

    /**
     * 把当前标签值设为活动值。
     * @returns {void}
     */
    function handleSelect() {
      context.setActiveValue(value);
    }

    return (
      <button
        type="button"
        role="tab"
        aria-selected={selected}
        onClick={handleSelect}
      >
        {children}
      </button>
    );
  }

  return <TabsContext.Consumer>{renderTab}</TabsContext.Consumer>;
}
```

### 5. 实现 Panel

```jsx
/**
 * 仅在自身 value 为活动值时显示内容。
 * @param {{ value: string, children: React.ReactNode }} props 组件属性。
 * @returns {React.ReactElement} Context Consumer。
 */
function TabPanel({ value, children }) {
  /**
   * 根据 Tabs Context 决定面板内容。
   * @param {{ activeValue: string } | null} context 当前 Tabs Context。
   * @returns {React.ReactElement} 标签面板。
   */
  function renderPanel(context) {
    if (context === null) {
      throw new Error("Tabs.Panel 必须放在 Tabs 内部");
    }

    const hidden = context.activeValue !== value;

    return (
      <div role="tabpanel" hidden={hidden}>
        {children}
      </div>
    );
  }

  return <TabsContext.Consumer>{renderPanel}</TabsContext.Consumer>;
}

Tabs.Tab = Tab;
Tabs.Panel = TabPanel;
```

把子组件挂到 `Tabs` 静态属性上形成统一命名空间。这只是 JavaScript API 组织方式，不会改变组件之间的 React 父子关系。

## 四、Context 更新边界

### 1. Provider value 的引用

`Tabs` 每次渲染都会创建新的 `contextValue` 对象，因此 Consumer 也会收到新的值。对小型复合组件通常可以接受；当 Provider 包含大量消费者且更新频繁时，应先测量，再考虑稳定对象引用或拆分 Context。

不能为了避免对象变化而把 `contextValue` 放到组件外部，因为它包含每个 `Tabs` 实例自己的状态和更新函数。

### 2. Provider 范围

Context 值只在对应 Provider 的后代树中可见。多个 `Tabs` 实例各自提供值，因此状态互不共享：

```jsx
<>
  <Tabs defaultValue="pending">{/* 第一组内容 */}</Tabs>
  <Tabs defaultValue="today">{/* 第二组内容 */}</Tabs>
</>
```

每个 `Tabs` 都拥有独立 State。自定义组件共享同一个 Context 对象，不代表它们共享同一份 Provider 值。

## 五、模式选择

| 场景 | 推荐方式 |
|------|----------|
| 只有一个可替换主体区域 | `children` |
| 有标题区、操作区、主体区 | 具名 React 节点 Props |
| 少量直接子组件共享状态 | 上层 State 与显式 Props |
| 多层协作组件共享隐式协议 | 复合组件与 Context |
| 只是复用状态逻辑 | 自定义 Hook |
| 需要增强任意外部组件 | HOC 或 Render Props，主要用于维护旧模式 |

复合组件不应成为默认设计。只有组件确实构成一套协作协议时，隐式 Context 才比显式 Props 更容易理解。
