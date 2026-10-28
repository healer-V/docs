---
title: "事件绑定"
tags:
  - React
  - 事件
  - React 16.8
excerpt: "讲解 React 16.8 中的事件属性、处理函数、合成事件、事件池、默认行为与传播控制，建立完整的 JSX 事件使用基础。"
date: 2026-07-30
---

# 事件绑定

## 一、事件绑定

### 1. 使用事件属性

React 通过 JSX 事件属性声明元素应该响应什么事件。事件属性以 `on` 开头，并使用 camelCase 命名。

**语法形式：**

```jsx
<Element onEventName={handlerFunction} />
```

| 组成部分 | 含义 |
|----------|------|
| `Element` | 能接收该事件的 React 元素 |
| `onEventName` | React 事件属性，例如 `onClick` |
| `handlerFunction` | 事件发生后由 React 调用的函数 |

常见事件属性如下：

| 用户操作 | JSX 事件属性 | 常见元素 |
|----------|--------------|----------|
| 单击 | `onClick` | `button`、`a`、可交互区域 |
| 双击 | `onDoubleClick` | 需要区分双击的元素 |
| 输入值变化 | `onChange` | `input`、`textarea`、`select` |
| 提交表单 | `onSubmit` | `form` |
| 获得焦点 | `onFocus` | 表单控件、可聚焦元素 |
| 失去焦点 | `onBlur` | 表单控件、可聚焦元素 |
| 按下键盘按键 | `onKeyDown` | 当前获得焦点的元素 |
| 鼠标进入 | `onMouseEnter` | 需要悬停反馈的元素 |

React 事件属性不是 HTML 字符串属性。HTML 中的 `onclick="submitTask()"` 不能直接搬到 JSX：

```jsx
// 错误：属性名不是 camelCase，属性值也不是函数。
const invalidButton = (
  <button onclick="submitTask()">提交</button>
);
```

正确写法是传入函数：

```jsx
// 处理任务提交按钮的点击事件。
function handleSubmitClick() {
  console.log("开始提交任务");
}

const submitButton = (
  <button type="button" onClick={handleSubmitClick}>
    提交
  </button>
);
```

单击按钮后，控制台输出：

```text
开始提交任务
```

### 2. 传递函数引用

事件属性需要的是函数引用。React 保存这个函数，等事件真正发生时再调用它。

```jsx
onClick={handleSubmitClick}
```

不要在渲染 JSX 时直接调用函数：

```jsx
// 错误：渲染到这里时就会执行函数，并把返回值交给 onClick。
const invalidButton = (
  <button type="button" onClick={handleSubmitClick()}>
    提交
  </button>
);
```

如果 `handleSubmitClick()` 没有显式返回函数，`onClick` 最终得到 `undefined`。结果是函数在渲染阶段提前执行，真正点击时反而没有处理函数。

需要在点击时执行一段调用表达式，可以传入箭头函数：

```jsx
// 点击时才调用日志函数。
const submitButton = (
  <button
    type="button"
    onClick={() => console.log("开始提交任务")}
  >
    提交
  </button>
);
```

页面渲染时不会打印日志，只有单击按钮后才会输出。这种写法创建的是一个新的事件回调，适合逻辑很短的场景。

## 二、事件处理函数

### 1. 接收事件对象

React 调用事件处理函数时，会把当前事件对象作为第一个参数传入。处理函数可以通过它读取事件类型、触发目标、键盘按键或鼠标位置。

**调用关系：**

```text
用户触发事件
→ React 调用 handler(event)
→ 处理函数读取事件或执行操作
```

处理函数不需要使用事件对象时可以省略形参；需要读取事件信息时再声明形参。

```jsx
/**
 * 输出当前点击事件的类型。
 * @param {React.SyntheticEvent} event React 提供的合成事件对象。
 * @returns {void} 只记录事件信息，不返回界面数据。
 */
function handleDetailClick(event) {
  console.log(event.type);
}

const detailButton = (
  <button type="button" onClick={handleDetailClick}>
    查看详情
  </button>
);
```

单击按钮后，控制台输出：

```text
click
```

事件处理函数的返回值不会自动渲染，也不会自动阻止浏览器行为。界面更新需要通过 State，默认行为需要显式调用 `preventDefault()`。

### 2. 传递自定义参数

业务处理通常还需要任务 ID、列表位置等自定义参数。事件属性本身只接收一个函数，因此可以用箭头函数包住真正的处理函数。

**语法形式：**

```jsx
<Element onClick={(event) => handler(customValue, event)} />
```

真正的处理函数可以同时接收业务参数和事件对象：

```jsx
/**
 * 打开指定任务，并记录触发操作的元素。
 * @param {string} taskId 要打开的任务 ID，不能为空。
 * @param {React.SyntheticEvent} event React 提供的点击事件。
 * @returns {void} 只输出任务信息，不修改界面。
 */
function openTask(taskId, event) {
  console.log(taskId);
  console.log(event.currentTarget.textContent);
}

const taskId = "task-104";

// 箭头函数负责把业务参数与 React 事件一起传给 openTask。
const detailButton = (
  <button
    type="button"
    onClick={(event) => openTask(taskId, event)}
  >
    查看任务
  </button>
);
```

单击后，控制台依次输出：

```text
task-104
查看任务
```

如果处理函数不需要事件对象，可以省略箭头函数的 `event` 参数：

```jsx
/**
 * 记录被选择的任务。
 * @param {string} taskId 被选择的任务 ID，不能为空。
 * @returns {void} 只记录任务 ID。
 */
function selectTask(taskId) {
  console.log(`选择任务：${taskId}`);
}

// 点击时把固定业务 ID 传给 selectTask。
const selectButton = (
  <button
    type="button"
    onClick={() => selectTask("task-104")}
  >
    选择任务
  </button>
);
```

不要写成 `onClick={selectTask("task-104")}`，那仍然是在渲染阶段直接调用函数。

### 3. 选择外部函数或内联函数

两种写法都能正确绑定事件，选择依据是逻辑长度和复用需求：

| 写法 | 适用情况 | 注意点 |
|------|----------|--------|
| 外部命名函数 | 逻辑较长、需要复用或便于单独阅读 | 直接传函数引用 |
| 内联箭头函数 | 调用简单、需要包裹自定义参数 | 不要在其中堆叠多步业务逻辑 |

下面两种按钮的点击结果相同：

```jsx
// 记录固定的刷新操作。
function handleRefresh() {
  console.log("刷新任务");
}

const controls = (
  <div>
    <button type="button" onClick={handleRefresh}>
      外部函数
    </button>

    {/* 内联回调只包含一条容易读懂的操作。 */}
    <button
      type="button"
      onClick={() => console.log("刷新任务")}
    >
      内联函数
    </button>
  </div>
);
```

这里的区别是代码组织方式，不是 React 事件能力差异。`useCallback` 解决的是组件重新渲染时的函数身份与缓存问题，不是事件能否绑定的问题。

## 三、合成事件

### 1. 认识 `SyntheticEvent`

React 传给处理函数的不是浏览器原生事件对象本身，而是 `SyntheticEvent`（合成事件）对象。它为不同浏览器提供一致的常用属性和方法，同时保留访问原生事件的入口。

| 能力 | 常用成员 | 作用 |
|------|----------|------|
| 事件信息 | `type`、`timeStamp` | 判断事件类型和发生时间 |
| 目标元素 | `target`、`currentTarget` | 确认事件来源和当前处理元素 |
| 默认行为 | `preventDefault()`、`defaultPrevented` | 阻止并检查默认行为 |
| 传播控制 | `stopPropagation()`、`isPropagationStopped()` | 阻止并检查事件传播 |
| 原生事件 | `nativeEvent` | 访问底层浏览器事件 |
| React 16.8 事件池 | `persist()` | 让合成事件不在回调后被复用 |

多数业务代码直接使用合成事件提供的成员即可。只有第三方库或浏览器专属能力确实要求原生事件时，才读取 `nativeEvent`。

```jsx
/**
 * 读取 React 合成事件的常用信息。
 * @param {React.SyntheticEvent} event React 提供的点击事件。
 * @returns {void} 只在控制台输出事件信息。
 */
function inspectEvent(event) {
  console.log(event.type);
  console.log(event.currentTarget.tagName);
  console.log(event.nativeEvent instanceof Event);
}

const inspectButton = (
  <button type="button" onClick={inspectEvent}>
    检查事件
  </button>
);
```

在浏览器中单击后，控制台会输出类似结果：

```text
click
BUTTON
true
```

### 2. 区分 `target` 与 `currentTarget`

`target` 是事件最初发生的元素，`currentTarget` 是当前处理函数绑定的元素。事件从内部元素冒泡到外部元素时，两者可能不同。

```jsx
/**
 * 对比事件来源与当前绑定事件的元素。
 * @param {React.SyntheticEvent} event React 提供的点击事件。
 * @returns {void} 只输出两个元素的标签名。
 */
function inspectClickTarget(event) {
  console.log(`target: ${event.target.tagName}`);
  console.log(`currentTarget: ${event.currentTarget.tagName}`);
}

const taskButton = (
  <button type="button" onClick={inspectClickTarget}>
    <span>查看任务</span>
  </button>
);
```

直接单击文字所在的 `span` 时，结果是：

```text
target: SPAN
currentTarget: BUTTON
```

需要读取“用户实际点到哪个后代元素”时使用 `target`；需要读取“当前处理函数属于哪个元素”时使用 `currentTarget`。按钮的业务 ID 通常应从 `currentTarget.dataset` 读取，避免点击内部图标后目标发生变化。

```jsx
/**
 * 从绑定事件的按钮读取稳定的任务 ID。
 * @param {React.SyntheticEvent} event React 提供的点击事件。
 * @returns {void} 只输出按钮保存的任务 ID。
 */
function readTaskId(event) {
  console.log(event.currentTarget.dataset.taskId);
}

const taskButton = (
  <button
    type="button"
    data-task-id="task-104"
    onClick={readTaskId}
  >
    <span>查看任务</span>
  </button>
);
```

无论点击按钮文字还是内部 `span`，控制台都输出 `task-104`。

## 四、React 16.8 事件池

### 1. 理解事件对象复用

在 React DOM 16.8 中，合成事件使用事件池。处理函数同步执行结束后，React 会清空事件对象的属性并复用该对象，以减少对象创建。

执行过程如下：

```text
事件发生
→ React 创建或复用 SyntheticEvent
→ 同步调用处理函数
→ 处理函数返回
→ React 清空事件属性并把对象放回事件池
```

因此，事件对象适合在当前处理函数中同步读取。把整个事件对象交给 `setTimeout`、Promise 或其他异步任务后再读，可能得到 `null`，并看到事件已被释放的警告。

```jsx
/**
 * 演示 React 16.8 中异步读取事件对象的问题。
 * @param {React.SyntheticEvent} event React 提供的输入事件。
 * @returns {void} 安排异步日志，不返回界面数据。
 */
function handleAsyncInput(event) {
  // 该回调在事件处理函数返回后才执行。
  setTimeout(() => {
    console.log(event.target.value);
  }, 100);
}

const searchInput = (
  <input
    type="search"
    onChange={handleAsyncInput}
    placeholder="输入任务名称"
  />
);
```

在 React 16.8 开发环境中，异步回调可能读取到 `null`，并出现类似警告：

```text
This synthetic event is reused for performance reasons
```

### 2. 提前保存需要的值

最直接的处理方式是在同步阶段把需要的普通值保存到局部变量。异步代码只读取这个值，不继续依赖事件对象。

```jsx
/**
 * 在同步阶段保存输入值，再交给异步任务使用。
 * @param {React.SyntheticEvent} event React 提供的输入事件。
 * @returns {void} 安排异步日志，不返回界面数据。
 */
function handleAsyncInput(event) {
  const inputValue = event.target.value;

  // 异步回调读取普通字符串，不再访问已回收的合成事件。
  setTimeout(() => {
    console.log(inputValue);
  }, 100);
}

const searchInput = (
  <input
    type="search"
    onChange={handleAsyncInput}
    placeholder="输入任务名称"
  />
);
```

用户输入“订单”后，异步日志仍能稳定输出：

```text
订单
```

这也是优先推荐的方式，因为异步任务通常只需要少数字段，而不是整个事件对象。

### 3. 使用 `event.persist()`

如果异步逻辑确实需要继续访问多个事件属性，可以在同步处理函数中调用 `event.persist()`。它会让当前合成事件退出事件池，不在回调结束后被清空。

**调用形式：**

```js
event.persist();
```

`persist()` 没有参数，也不返回业务数据。它只改变当前合成事件的生命周期。

```jsx
/**
 * 保留当前合成事件，供异步任务继续读取。
 * @param {React.SyntheticEvent} event React 提供的输入事件。
 * @returns {void} 保留事件并安排异步日志。
 */
function handlePersistedInput(event) {
  event.persist();

  // persist() 使 React 16.8 不再回收当前事件对象。
  setTimeout(() => {
    console.log(event.type);
    console.log(event.target.value);
  }, 100);
}

const searchInput = (
  <input
    type="search"
    onChange={handlePersistedInput}
    placeholder="输入任务名称"
  />
);
```

输入“订单”后，异步日志可以读取到 `change` 和 `订单`。

::: warning 版本边界
事件池是 React DOM 16 及更早版本需要特别处理的行为。本文以 React 16.8 为准，因此必须理解 `persist()` 和提前保存值；不要用较新 React 版本取消事件池后的表现反推 React 16.8。
:::

## 五、默认行为

### 1. 调用 `preventDefault()`

部分浏览器事件带有默认行为，例如：

- 表单提交会请求目标地址或刷新页面；
- 链接单击会跳转到 `href`；
- 复选框单击会切换选中状态。

处理函数调用 `event.preventDefault()` 可以阻止当前事件的默认行为。

```jsx
/**
 * 阻止表单刷新页面，并读取表单中的查询词。
 * @param {React.SyntheticEvent} event React 提供的表单提交事件。
 * @returns {void} 阻止默认提交并输出查询词。
 */
function handleSearchSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const query = form.elements.query.value;

  console.log(`搜索：${query}`);
}

const searchForm = (
  <form onSubmit={handleSearchSubmit}>
    <label htmlFor="task-query">任务名称</label>
    <input id="task-query" name="query" type="search" />
    <button type="submit">搜索</button>
  </form>
);
```

输入“订单”并提交后，页面不会刷新，控制台输出：

```text
搜索：订单
```

`event.defaultPrevented` 可以判断默认行为是否已经被阻止。

### 2. `return false` 不会阻止默认行为

在部分传统 DOM 或 jQuery 代码中，处理函数返回 `false` 可能同时阻止默认行为和传播。React 事件不采用这条约定，返回 `false` 只是普通返回值。

```jsx
/**
 * 演示错误的默认行为处理方式。
 * @param {React.SyntheticEvent} event React 提供的链接点击事件。
 * @returns {boolean} 返回 false，但 React 不会据此阻止跳转。
 */
function handleInvalidLink(event) {
  console.log(event.type);
  return false;
}

const invalidLink = (
  <a href="/tasks" onClick={handleInvalidLink}>
    任务列表
  </a>
);
```

单击后，浏览器仍会尝试跳转到 `/tasks`。正确写法必须显式调用 `preventDefault()`：

```jsx
/**
 * 阻止链接的默认跳转。
 * @param {React.SyntheticEvent} event React 提供的链接点击事件。
 * @returns {void} 阻止跳转并记录操作。
 */
function handleTaskLink(event) {
  event.preventDefault();
  console.log("由应用处理任务列表导航");
}

const taskLink = (
  <a href="/tasks" onClick={handleTaskLink}>
    任务列表
  </a>
);
```

单击后地址不会因该链接发生变化，控制台输出“由应用处理任务列表导航”。

## 六、事件传播

### 1. 理解捕获与冒泡

当目标元素位于其他元素内部时，同一个事件会沿 DOM 树传播：

```text
捕获阶段：外层元素 → 内层目标
目标阶段：到达实际目标
冒泡阶段：内层目标 → 外层元素
```

React 中普通的 `onClick` 处理函数在冒泡阶段执行；带 `Capture` 后缀的 `onClickCapture` 在捕获阶段执行。

```jsx
// 记录外层区域捕获阶段的点击。
function handlePanelCapture() {
  console.log("1. 外层捕获");
}

// 记录按钮冒泡阶段的点击。
function handleButtonClick() {
  console.log("2. 按钮冒泡");
}

// 记录外层区域冒泡阶段的点击。
function handlePanelClick() {
  console.log("3. 外层冒泡");
}

const taskPanel = (
  <section
    onClickCapture={handlePanelCapture}
    onClick={handlePanelClick}
  >
    <button type="button" onClick={handleButtonClick}>
      查看任务
    </button>
  </section>
);
```

单击按钮后，控制台顺序是：

```text
1. 外层捕获
2. 按钮冒泡
3. 外层冒泡
```

捕获适合在子元素处理之前统一观察事件。普通业务交互优先使用冒泡阶段，只有确实需要从外到内处理时才使用 `Capture`。

### 2. 调用 `stopPropagation()`

`event.stopPropagation()` 阻止事件继续向传播路径中的其他元素移动。它不阻止当前元素的浏览器默认行为。

```jsx
// 处理整个任务卡片的点击。
function handleCardClick() {
  console.log("打开任务详情");
}

/**
 * 处理卡片内部按钮，并阻止点击继续冒泡到卡片。
 * @param {React.SyntheticEvent} event React 提供的点击事件。
 * @returns {void} 阻止传播并记录独立操作。
 */
function handleArchiveClick(event) {
  event.stopPropagation();
  console.log("归档任务");
}

const taskCard = (
  <article onClick={handleCardClick}>
    <h2>核对订单</h2>
    <button type="button" onClick={handleArchiveClick}>
      归档
    </button>
  </article>
);
```

单击“归档”只输出：

```text
归档任务
```

外层卡片的 `onClick` 不会执行。单击卡片其他区域仍会输出“打开任务详情”。

不要把 `stopPropagation()` 当作默认写法。父子交互互不相关，并且冒泡确实会触发错误操作时才阻止传播；大量阻断会使统一埋点、快捷行为和外层交互难以工作。

### 3. 分清默认行为与传播

两个方法控制不同问题：

| 方法 | 控制对象 | 示例 |
|------|----------|------|
| `preventDefault()` | 浏览器对当前事件的默认动作 | 阻止表单提交刷新 |
| `stopPropagation()` | 事件在元素树中的继续传播 | 阻止按钮点击冒泡到卡片 |

有些场景需要同时调用，但不能互相替代：

```jsx
/**
 * 在卡片内处理链接，既不跳转，也不触发卡片点击。
 * @param {React.SyntheticEvent} event React 提供的链接点击事件。
 * @returns {void} 阻止默认行为和冒泡，并记录操作。
 */
function handleInlineLink(event) {
  event.preventDefault();
  event.stopPropagation();
  console.log("在当前区域打开任务摘要");
}

// 记录未被内部元素阻止的卡片点击。
function handleSummaryCardClick() {
  console.log("打开任务详情");
}

const taskCard = (
  <article onClick={handleSummaryCardClick}>
    <a href="/tasks/task-104" onClick={handleInlineLink}>
      查看摘要
    </a>
  </article>
);
```

单击链接后不会跳转，也不会执行卡片点击，只输出“在当前区域打开任务摘要”。示例中外层内联回调只用于观察传播结果。

## 七、使用边界

### 1. JSX 事件与原生监听器

普通 React 界面优先使用 JSX 事件属性。它与元素结构放在一起，并由 React 统一管理：

```jsx
// 处理 React 元素声明的点击行为。
function handleReactClick() {
  console.log("React 点击事件");
}

const button = (
  <button type="button" onClick={handleReactClick}>
    查看任务
  </button>
);
```

`addEventListener` 属于浏览器原生 DOM API，通常用于以下边界：

- 监听 `window`、`document` 等 React 树外对象；
- 接入只提供原生 DOM 事件的第三方库；
- 使用 React 事件系统没有暴露的特殊监听选项。

原生监听器需要在组件建立同步时注册，并在同步结束时移除。不要在 JSX 求值过程中调用 `addEventListener`，否则每次渲染都可能增加新的监听器。

### 2. 绑定检查表

出现事件未执行、提前执行或行为重复时，按以下顺序检查：

| 现象 | 检查项 | 正确处理 |
|------|--------|----------|
| 页面渲染时就执行 | 是否写成 `onClick={handler()}` | 改为 `onClick={handler}` 或箭头函数 |
| 点击后没有执行 | 事件属性是否使用 camelCase、值是否为函数 | 使用 `onClick={handler}` |
| 自定义参数传不进去 | 是否直接调用了处理函数 | 用箭头函数延迟调用 |
| 异步读取事件为 `null` | 是否在 React 16.8 回调结束后读取事件 | 提前保存值或调用 `persist()` |
| 表单仍然刷新 | 是否只写了 `return false` | 调用 `preventDefault()` |
| 内层按钮触发外层事件 | 是否需要阻止冒泡 | 在内层按需调用 `stopPropagation()` |
| 读取到错误元素 | 是否把 `target` 当成绑定元素 | 使用 `currentTarget` |

## 八、参考资料

- [React 旧版文档：Handling Events](https://legacy.reactjs.org/docs/handling-events.html)
- [React 旧版文档：SyntheticEvent](https://legacy.reactjs.org/docs/events.html)
