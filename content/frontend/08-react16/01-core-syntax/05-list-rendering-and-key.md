---
title: "列表渲染与 Key"
tags:
  - React
  - JSX
  - Key
excerpt: "讲解 React 16.8 如何使用 map、filter 和排序生成列表，并系统说明 Key 的作用、选择、位置、作用域及元素身份。"
date: 2026-07-30
---

# 列表渲染与 Key

## 一、列表渲染

### 1. 从数据数组到元素数组

列表渲染是把数组中的每一项数据转换为 React 元素，再把这些元素放入共同的父元素。

```text
数据数组
→ 遍历并转换每一项
→ React 元素数组
→ 放入 ul、ol、section 等父元素
→ 浏览器 DOM
```

数据数组与元素数组承担不同职责：

| 数组 | 内容 | 作用 |
|------|------|------|
| 数据数组 | 普通对象、字符串、数字 | 保存业务数据 |
| 元素数组 | React 元素 | 描述每项数据对应的界面 |

React 可以把元素数组作为子内容，并按数组顺序渲染：

::: details 查看从数据数组到元素数组的示例代码
```jsx
const taskElements = [
  <li key="task-104">核对订单</li>,
  <li key="task-105">复核退款</li>,
  <li key="task-106">联系客户</li>
];

const taskList = (
  <ul>
    {taskElements}
  </ul>
);
```
:::

浏览器 DOM 的主要结构是：

```html
<ul>
  <li>核对订单</li>
  <li>复核退款</li>
  <li>联系客户</li>
</ul>
```

手写元素数组只能处理固定内容。数据来自接口或会变化时，应使用数组方法完成转换。

### 2. 保持数据与结构对应

每项数据应只生成它对应的元素，不要在转换过程中修改原数据。这样可以从页面元素反向找到数据来源。

::: details 查看保持数据与结构对应的示例代码
```jsx
const tasks = [
  { id: "task-104", title: "核对订单" },
  { id: "task-105", title: "复核退款" },
  { id: "task-106", title: "联系客户" }
];

// 把每个任务对象转换为一个列表项。
const taskElements = tasks.map((task) => (
  <li key={task.id}>{task.title}</li>
));

const taskList = <ul>{taskElements}</ul>;
```
:::

`tasks[0]` 对应第一个 `li`，后续项保持相同关系。页面结果与上一例相同，但现在只需修改数据数组，列表结构会随转换结果变化。

## 二、`map` 转换

### 1. 理解 `map`

`Array.prototype.map` 会按顺序调用回调函数，并用每次回调的返回值组成一个新数组。它不修改原数组的项，也不会改变原数组长度。

**调用形式：**

```js
array.map(callback(currentValue, index, array), thisArg)
```

| 参数 | 是否必需 | 含义 |
|------|----------|------|
| `callback` | 是 | 为每个数组项计算新值的函数 |
| `currentValue` | 是 | 当前正在处理的数组项 |
| `index` | 否 | 当前项在原数组中的索引 |
| `array` | 否 | 调用 `map` 的原数组 |
| `thisArg` | 否 | 执行回调时使用的 `this`，箭头函数不会使用它 |

`map` 返回与原数组等长的新数组。React 列表渲染只要求回调最终返回 React 可渲染值。

```jsx
const taskTitles = ["核对订单", "复核退款"];

// 把每个标题字符串转换为一个列表项。
const taskElements = taskTitles.map((title) => (
  <li key={title}>{title}</li>
));

const taskList = <ul>{taskElements}</ul>;
```

`taskTitles` 仍然是两个字符串，`taskElements` 是两个 React 元素。页面显示两个列表项。

### 2. 返回 JSX

箭头函数使用圆括号包裹 JSX 时，会隐式返回该 JSX：

::: details 查看返回 JSX的示例代码
```jsx
const tasks = [
  { id: "task-104", title: "核对订单" },
  { id: "task-105", title: "复核退款" }
];

// 圆括号表达式会成为回调的返回值。
const taskElements = tasks.map((task) => (
  <li key={task.id}>
    <strong>{task.title}</strong>
  </li>
));
```
:::

箭头函数使用花括号后，花括号表示函数体，必须显式写 `return`：

::: details 查看返回 JSX的示例代码
```jsx
const tasks = [
  { id: "task-104", title: "核对订单", completed: false },
  { id: "task-105", title: "复核退款", completed: true }
];

// 函数体先计算状态文本，再显式返回列表项。
const taskElements = tasks.map((task) => {
  const statusText = task.completed ? "已完成" : "进行中";

  return (
    <li key={task.id}>
      {task.title}：{statusText}
    </li>
  );
});
```
:::

忘记 `return` 时，每次回调结果都是 `undefined`：

```jsx
const tasks = [
  { id: "task-104", title: "核对订单" }
];

// 错误：函数体没有 return，列表不会产生可见内容。
const missingElements = tasks.map((task) => {
  <li key={task.id}>{task.title}</li>;
});
```

这段代码通常不会抛出“JSX 语法错误”，但 `missingElements` 是 `[undefined]`，页面没有列表项。遇到数据存在但列表为空时，应先检查 `map` 回调是否返回了 JSX。

### 3. 直接在 JSX 中调用

元素数组可以先保存到变量，也可以直接在 JSX 大括号中调用 `map`。两种写法结果相同。

::: details 查看直接在 JSX 中调用的示例代码
```jsx
const tasks = [
  { id: "task-104", title: "核对订单" },
  { id: "task-105", title: "复核退款" }
];

const taskList = (
  <ul>
    {/* 把每个任务转换为 ul 的直接子元素。 */}
    {tasks.map((task) => (
      <li key={task.id}>{task.title}</li>
    ))}
  </ul>
);
```
:::

直接调用适合转换很短、只使用一次的情况。转换包含筛选、排序或多步计算时，先保存中间结果更容易检查数据与渲染结果。

## 三、筛选与排序

### 1. 先筛选，再转换

`filter` 根据回调返回的布尔结果保留数组项，并返回一个新数组。列表只显示部分数据时，先 `filter` 得到目标数据，再用 `map` 转换成元素。

**处理顺序：**

```text
完整数据
→ filter 选择需要的项
→ map 转换为 React 元素
```

::: details 查看先筛选，再转换的示例代码
```jsx
const tasks = [
  { id: "task-104", title: "核对订单", completed: false },
  { id: "task-105", title: "复核退款", completed: true },
  { id: "task-106", title: "联系客户", completed: false }
];

// 只保留尚未完成的任务。
const pendingTasks = tasks.filter((task) => !task.completed);

// 把筛选结果转换为列表项。
const pendingTaskElements = pendingTasks.map((task) => (
  <li key={task.id}>{task.title}</li>
));

const pendingTaskList = (
  <section>
    <h2>待处理任务</h2>
    <ul>{pendingTaskElements}</ul>
  </section>
);
```
:::

页面只显示“核对订单”和“联系客户”。原始 `tasks` 数组仍然包含三项。

两个步骤较短时可以链式调用：

::: details 查看先筛选，再转换的示例代码
```jsx
const pendingTaskList = (
  <ul>
    {tasks
      .filter(
        // 第一个回调只保留待处理任务。
        (task) => !task.completed
      )
      .map(
        // 第二个回调把筛选结果转换为 li。
        (task) => (
          <li key={task.id}>{task.title}</li>
        )
      )}
  </ul>
);
```
:::

链式写法仍然先产生筛选后的数据数组，再产生元素数组，并不是 React 特有语法。

### 2. 复制后排序

`Array.prototype.sort` 会原地修改调用它的数组。直接对业务数据排序会改变原数组，后续代码看到的顺序也会被改变。

下面的写法会修改 `tasks`：

```js
// 不推荐：sort 直接改变原数组。
const sortedTasks = tasks.sort(compareTaskPriority);
```

需要保留原顺序时，先复制数组，再排序：

::: details 查看复制后排序的示例代码
```jsx
const tasks = [
  { id: "task-104", title: "核对订单", priority: 2 },
  { id: "task-105", title: "复核退款", priority: 3 },
  { id: "task-106", title: "联系客户", priority: 1 }
];

/**
 * 按优先级从高到低比较两个任务。
 * @param {{priority: number}} left 左侧任务，priority 为有效数字。
 * @param {{priority: number}} right 右侧任务，priority 为有效数字。
 * @returns {number} 负数表示 left 排在前面，正数表示 right 排在前面。
 */
function compareTaskPriority(left, right) {
  return right.priority - left.priority;
}

const sortedTasks = [...tasks].sort(compareTaskPriority);

// 把排序后的任务转换为列表项。
const taskElements = sortedTasks.map((task) => (
  <li key={task.id}>
    {task.title}（优先级 {task.priority}）
  </li>
));

const taskList = <ol>{taskElements}</ol>;
```
:::

页面顺序是“复核退款”“核对订单”“联系客户”，原 `tasks` 数组仍保持初始顺序。React 只渲染最终数组顺序；复制数组是为了遵守后续 State 不可变更新所依赖的数据规则。

## 四、空列表

### 1. 空数组不会生成列表项

空数组是合法的 React 子内容。它没有元素，因此不会生成任何对应 DOM。

```jsx
const tasks = [];

// 空数组经过 map 后仍是空数组。
const taskElements = tasks.map((task) => (
  <li key={task.id}>{task.title}</li>
));

const taskList = <ul>{taskElements}</ul>;
```

最终 DOM 只剩一个空容器：

```html
<ul></ul>
```

这不是渲染错误，而是数组转换的正常结果。但空 `ul` 通常不能告诉用户为什么没有内容。

### 2. 明确显示空状态

先检查数据长度，再在列表和空状态之间选择：

::: details 查看明确显示空状态的示例代码
```jsx
const tasks = [];

// 非空时才把任务转换为列表项。
const taskContent = tasks.length > 0
  ? (
    <ul>
      {/* 非空时把每个任务转换为列表项。 */}
      {tasks.map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  )
  : <p>当前没有待处理任务。</p>;

const taskSection = (
  <section>
    <h2>待处理任务</h2>
    {taskContent}
  </section>
);
```
:::

页面显示“当前没有待处理任务”。列表渲染负责把每项数据变成元素，条件渲染负责在“有列表”和“没有数据”之间选择界面。

## 五、Key

### 1. Key 表示列表项身份

`key` 是 React 用于识别同一层列表项的特殊字段。列表发生插入、删除或排序时，React 会用 Key 判断哪些元素仍然对应原来的数据，哪些元素需要新增或移除。

```text
上一次元素列表的 Key
↕ 对比
下一次元素列表的 Key
→ 识别保留、移动、新增、删除
```

Key 解决的是“这个元素对应哪项数据”，不是“这个元素现在排在第几位”。

没有 Key 时，React 16.8 开发环境会给出警告：

```jsx
const tasks = [
  { id: "task-104", title: "核对订单" },
  { id: "task-105", title: "复核退款" }
];

// 错误：数组中的两个 li 都没有 key。
const taskElements = tasks.map((task) => (
  <li>{task.title}</li>
));
```

控制台警告类似：

```text
Each child in a list should have a unique "key" prop.
```

正确写法把任务的稳定 ID 作为 Key：

```jsx
// 每个列表项使用对应任务的稳定 ID。
const taskElements = tasks.map((task) => (
  <li key={task.id}>{task.title}</li>
));
```

警告消失，并且 React 能用 `task-104`、`task-105` 识别两项任务。

### 2. 同层唯一且跨次稳定

一个有效 Key 同时满足两条规则：

| 规则 | 含义 |
|------|------|
| 同层唯一 | 同一个元素数组中的兄弟项不能使用相同 Key |
| 跨次稳定 | 同一项数据在不同渲染中继续使用相同 Key |

Key 只在当前兄弟集合中比较。不同列表可以重复使用相同 ID：

::: details 查看同层唯一且跨次稳定的示例代码
```jsx
const pendingTask = { id: "task-104", title: "核对订单" };
const completedTask = { id: "task-104", title: "核对订单归档记录" };

const dashboard = (
  <main>
    <section>
      <h2>待处理</h2>
      <ul>
        <li key={pendingTask.id}>{pendingTask.title}</li>
      </ul>
    </section>

    <section>
      <h2>已完成</h2>
      <ul>
        <li key={completedTask.id}>{completedTask.title}</li>
      </ul>
    </section>
  </main>
);
```
:::

两个 `li` 属于不同 `ul` 的子元素，不在同一个兄弟集合中，因此 Key 可以相同。

### 3. Key 不会写入 DOM

`key` 服务于 React 元素比较，不是普通 DOM 属性。浏览器最终生成的 `li` 上不会出现 `key="task-104"`。

```jsx
const taskItem = (
  <li key="task-104" data-task-id="task-104">
    核对订单
  </li>
);
```

浏览器 DOM 是：

```html
<li data-task-id="task-104">核对订单</li>
```

需要在 DOM 中保留业务 ID 时，单独使用 `data-task-id`。不要通过 DOM 查询 Key，React 没有把它暴露为 DOM 属性。

## 六、选择 Key

### 1. 优先使用业务 ID

Key 最可靠的来源是数据本身携带的稳定唯一标识，例如任务 ID、订单 ID、数据库主键或后端生成的 UUID。

```jsx
const tasks = [
  { id: "task-104", title: "核对订单" },
  { id: "task-105", title: "复核退款" }
];

// 任务 ID 在增删和排序后仍代表同一任务。
const taskElements = tasks.map((task) => (
  <li key={task.id}>{task.title}</li>
));
```

显示名称通常不适合作为 Key，因为名称可能重复或被修改。Key 不要求是数字，也不要求在整个应用中唯一，只需在当前兄弟集合中稳定且唯一。

### 2. 组合多个稳定字段

单个字段无法唯一识别数据时，可以组合多个稳定字段。组合边界必须明确，避免不同数据生成同一字符串。

::: details 查看组合多个稳定字段的示例代码
```jsx
const orderLines = [
  { orderId: "order-7", lineId: "1", productName: "键盘" },
  { orderId: "order-7", lineId: "2", productName: "鼠标" }
];

/**
 * 为订单明细生成当前列表内唯一的稳定 Key。
 * @param {string} orderId 订单 ID，不能包含分隔符冒号。
 * @param {string} lineId 订单内的明细 ID，不能包含分隔符冒号。
 * @returns {string} 由订单与明细共同组成的 Key。
 */
function buildOrderLineKey(orderId, lineId) {
  return `${orderId}:${lineId}`;
}

// 每个明细使用订单 ID 与明细 ID 的组合。
const lineElements = orderLines.map((line) => (
  <li key={buildOrderLineKey(line.orderId, line.lineId)}>
    {line.productName}
  </li>
));
```
:::

生成的 Key 分别是 `order-7:1` 和 `order-7:2`。组合字段必须都来自稳定业务数据，不能混入当前数组索引或每次变化的时间值。

### 3. 限制索引 Key 的使用

`map` 回调提供的 `index` 表示当前数组位置。把它作为 Key，等于告诉 React“第 0 个位置始终是同一个元素”。

::: details 查看限制索引 Key 的使用的示例代码
```jsx
const taskTitles = ["核对订单", "复核退款"];

/**
 * 使用位置生成列表项，仅用于永不变化的静态说明列表。
 * @param {string} title 当前说明文本。
 * @param {number} index 当前文本在固定数组中的位置。
 * @returns {React.ReactElement} 带位置 Key 的列表项。
 */
function buildStaticItem(title, index) {
  return <li key={index}>{title}</li>;
}

const staticItems = taskTitles.map(buildStaticItem);
```
:::

只有同时满足以下条件时，索引 Key 才可接受：

- 列表内容完全静态；
- 不会插入、删除或重新排序；
- 列表项没有需要随业务数据保留的输入值或组件状态；
- 数据没有可用的稳定标识。

任务、订单、消息等业务列表通常会变化，不应使用索引 Key。

### 4. 不在渲染时生成 Key

`Math.random()`、`Date.now()` 或每次调用都变化的 UUID 会让同一项数据在每次渲染时得到新 Key。

```jsx
const tasks = [
  { title: "核对订单" },
  { title: "复核退款" }
];

// 错误：每次执行 map 都会生成新的 Key。
const unstableElements = tasks.map((task) => (
  <li key={Math.random()}>{task.title}</li>
));
```

React 会把所有列表项视为新元素，已有 DOM 或组件状态无法按原身份保留。Key 应在数据创建时生成并保存，而不是在渲染时临时生成。

选择顺序可以概括为：

| 优先级 | Key 来源 | 结论 |
|--------|----------|------|
| 1 | 稳定业务 ID | 首选 |
| 2 | 多个稳定字段的明确组合 | 单字段不唯一时使用 |
| 3 | 固定静态列表的索引 | 受严格条件限制 |
| 禁止 | 随机数、当前时间、每次新建的 UUID | 跨次不稳定 |

## 七、Key 的位置

### 1. 写在数组直接返回的元素上

Key 应放在 `map` 回调直接返回的最外层 React 元素上。React 比较的是这个元素数组中的兄弟项。

::: details 查看写在数组直接返回的元素上的示例代码
```jsx
const tasks = [
  { id: "task-104", title: "核对订单" },
  { id: "task-105", title: "复核退款" }
];

// 正确：key 位于 map 直接返回的 li 上。
const taskElements = tasks.map((task) => (
  <li key={task.id}>
    <strong>{task.title}</strong>
  </li>
));
```
:::

把 Key 放到内部元素不能标识外层兄弟项：

```jsx
// 错误：map 返回的是没有 key 的 li，strong 上的 key 层级过深。
const invalidTaskElements = tasks.map((task) => (
  <li>
    <strong key={task.id}>{task.title}</strong>
  </li>
));
```

React 仍会报告列表项缺少 Key，因为需要比较的是 `li` 数组。

以后把列表项提取为组件时，Key 仍放在 `map` 直接返回的组件元素上：

```jsx
// TaskRow 表示已经提取出的任务行组件，key 仍放在数组直接返回的位置。
const taskRows = tasks.map((task) => (
  <TaskRow key={task.id} task={task} />
));
```

Key 属于 `TaskRow` 在当前数组中的身份，不应藏到 `TaskRow` 内部返回的 DOM 元素上。

### 2. Fragment 列表使用显式写法

一项数据需要返回多个并列元素，又不希望增加额外 DOM 容器时，可以使用 Fragment。Fragment 简写 `<>...</>` 不能接收 Key，因此列表中必须使用显式 `React.Fragment`。

::: details 查看Fragment 列表使用显式写法的示例代码
```jsx
const tasks = [
  {
    id: "task-104",
    title: "核对订单",
    description: "检查金额与付款记录"
  },
  {
    id: "task-105",
    title: "复核退款",
    description: "确认退款原因与审批记录"
  }
];

// 每项任务返回标题行和说明行，由显式 Fragment 提供 Key。
const taskRows = tasks.map((task) => (
  <React.Fragment key={task.id}>
    <dt>{task.title}</dt>
    <dd>{task.description}</dd>
  </React.Fragment>
));

const taskDescriptions = <dl>{taskRows}</dl>;
```
:::

最终 DOM 中没有 Fragment 包装标签，只生成两组 `dt` 和 `dd`。下面的简写无法设置 Key，不适合当前数组：

```jsx
// 错误：Fragment 简写没有位置传递 key。
const invalidRows = tasks.map((task) => (
  <>
    <dt>{task.title}</dt>
    <dd>{task.description}</dd>
  </>
));
```

## 八、Key 与 Props

### 1. Key 是 React 特殊字段

JSX 中的普通属性会进入 React 元素的 `props`，但 `key` 和 `ref` 由 React 单独处理，不属于普通 Props。

::: details 查看Key 是 React 特殊字段的示例代码
```jsx
const taskItem = (
  <li
    key="task-104"
    data-task-id="task-104"
    title="核对订单"
  >
    核对订单
  </li>
);

console.log(taskItem.key);
console.log(taskItem.props.key);
console.log(taskItem.props.title);
console.log(taskItem.props["data-task-id"]);
```
:::

控制台结果是：

```text
task-104
undefined
核对订单
task-104
```

React 元素自己保存 Key，`props.key` 不存在。`title` 与 `data-task-id` 是普通属性，保存在 `props` 中并可继续传到 DOM。

### 2. 单独传递业务标识

组件既需要列表身份，又需要在业务逻辑中读取 ID 时，应把同一个数据字段分别传给 `key` 和普通属性：

```jsx
// key 供 React 识别列表身份，taskId 供组件业务代码读取。
const taskRows = tasks.map((task) => (
  <TaskRow
    key={task.id}
    taskId={task.id}
    title={task.title}
  />
));
```

`TaskRow` 可以通过 Props 读取 `taskId`，但不能读取 `key`。这不是重复字段：两个属性来源相同，职责不同。

如果普通 DOM 元素需要暴露 ID，则使用 `data-*`：

```jsx
// key 供 React 使用，data-task-id 最终进入浏览器 DOM。
const taskElements = tasks.map((task) => (
  <li key={task.id} data-task-id={task.id}>
    {task.title}
  </li>
));
```

## 九、嵌套列表

### 1. 每一层分别设置 Key

嵌套数据会产生多个兄弟集合。外层数组和每个内层数组都要在自己的直接返回元素上设置 Key。

::: details 查看每一层分别设置 Key的示例代码
```jsx
const taskGroups = [
  {
    id: "pending",
    title: "待处理",
    tasks: [
      { id: "task-104", title: "核对订单" },
      { id: "task-105", title: "复核退款" }
    ]
  },
  {
    id: "completed",
    title: "已完成",
    tasks: [
      { id: "task-106", title: "联系客户" }
    ]
  }
];

/**
 * 把单个任务转换为内层列表项。
 * @param {{id: string, title: string}} task 当前任务。
 * @returns {React.ReactElement} 使用任务 ID 作为 Key 的 li。
 */
function buildTaskItem(task) {
  return <li key={task.id}>{task.title}</li>;
}

/**
 * 把任务分组转换为外层区域。
 * @param {{id: string, title: string, tasks: Array}} group 当前任务分组。
 * @returns {React.ReactElement} 使用分组 ID 作为 Key 的 section。
 */
function buildTaskGroup(group) {
  return (
    <section key={group.id}>
      <h2>{group.title}</h2>
      <ul>{group.tasks.map(buildTaskItem)}</ul>
    </section>
  );
}

const groupedTaskList = (
  <main>
    {taskGroups.map(buildTaskGroup)}
  </main>
);
```
:::

这里有两个 Key 作用域：

| 层级 | 兄弟集合 | Key |
|------|----------|-----|
| 外层 | 两个 `section` | `group.id` |
| 内层 | 每个分组中的 `li` | `task.id` |

不同分组中的任务 ID 可以相同，只要同一分组内不重复。若任务会在分组之间移动，稳定任务 ID 仍能表示业务身份，但它只在新的兄弟集合中参与比较。

## 十、元素身份

### 1. 稳定 Key 跟随数据

列表排序变化时，稳定业务 Key 会跟随对应数据，而不是固定在某个位置。

第一次渲染：

| 位置 | Key | 任务 |
|------|-----|------|
| 0 | `task-104` | 核对订单 |
| 1 | `task-105` | 复核退款 |

交换顺序后：

| 位置 | Key | 任务 |
|------|-----|------|
| 0 | `task-105` | 复核退款 |
| 1 | `task-104` | 核对订单 |

React 能判断两个元素仍然存在，只是顺序改变。

::: details 查看稳定 Key 跟随数据的示例代码
```jsx
const tasks = [
  { id: "task-104", title: "核对订单" },
  { id: "task-105", title: "复核退款" }
];

/**
 * 把单个任务转换为使用业务 ID 的可输入列表项。
 * @param {{id: string, title: string}} task 当前任务。
 * @returns {React.ReactElement} 以任务 ID 为 Key 的列表项。
 */
function buildStableTaskItem(task) {
  return (
    <li key={task.id}>
      <label>
        {task.title}
        <input defaultValue="" />
      </label>
    </li>
  );
}

/**
 * 使用稳定业务 ID 生成可输入的任务列表。
 * @param {Array<{id: string, title: string}>} taskList 要显示的任务数组。
 * @returns {React.ReactElement} 每项以任务 ID 为 Key 的列表。
 */
function buildStableTaskList(taskList) {
  return (
    <ul>
      {taskList.map(buildStableTaskItem)}
    </ul>
  );
}

const root = document.getElementById("root");
ReactDOM.render(buildStableTaskList(tasks), root);
```
:::

首次渲染后，分别在“核对订单”和“复核退款”的输入框中填写不同备注。保留当前页面，再在同一执行环境中运行下面两行：

```jsx
const reorderedTasks = [tasks[1], tasks[0]];
ReactDOM.render(buildStableTaskList(reorderedTasks), root);
```

排序后输入框会随任务身份移动。`task-104` 的 DOM 与其输入值继续对应“核对订单”。

### 2. 索引 Key 跟随位置

索引 Key 表示位置。相同排序过程下，Key `0` 始终留在第一个位置，即使第一个位置已经换成另一项数据。

下面使用同样的两项数据，但把数组索引作为 Key：

::: details 查看索引 Key 跟随位置的示例代码
```jsx
const indexedTasks = [
  { id: "task-104", title: "核对订单" },
  { id: "task-105", title: "复核退款" }
];

/**
 * 使用数组索引生成任务列表，用于观察身份错位。
 * @param {Array<{id: string, title: string}>} taskList 要显示的任务数组。
 * @returns {React.ReactElement} 每项以当前位置为 Key 的列表。
 */
function buildIndexedTaskList(taskList) {
  return (
    <ul>
      {taskList.map(
        /**
         * 把任务转换为使用位置 Key 的列表项。
         * @param {{id: string, title: string}} task 当前任务。
         * @param {number} index 当前任务在数组中的位置。
         * @returns {React.ReactElement} 以索引为 Key 的列表项。
         */
        (task, index) => (
          <li key={index}>
            <label>
              {task.title}
              <input defaultValue="" />
            </label>
          </li>
        )
      )}
    </ul>
  );
}

const indexedRoot = document.getElementById("root");
ReactDOM.render(buildIndexedTaskList(indexedTasks), indexedRoot);
```
:::

同样先在两个输入框中填写不同备注，再运行：

```jsx
const reorderedIndexedTasks = [indexedTasks[1], indexedTasks[0]];
ReactDOM.render(
  buildIndexedTaskList(reorderedIndexedTasks),
  indexedRoot
);
```

交换顺序后，第一位置仍使用 Key `0`。React 复用第一位置原有 DOM，任务标题变成“复核退款”，但此前输入的 DOM 值可能仍留在第一位置，造成备注与任务错位。

可观察结果可以概括为：

| Key 策略 | 排序后身份依据 | 结果 |
|----------|----------------|------|
| `task.id` | 业务数据 | DOM 和局部状态随任务移动 |
| `index` | 数组位置 | DOM 和局部状态留在位置，可能与任务错位 |
| 随机值 | 每次都是新身份 | 原元素被视为移除，新元素重新创建 |

这就是 Key 不能只满足“没有控制台警告”的原因。它必须准确表达业务身份。

## 十一、完整列表

### 1. 组合筛选、排序、空状态与 Key

下面的示例先筛选待处理任务，再复制并排序，最后根据结果渲染空状态或列表，并为每一项使用稳定 ID。

::: details 查看组合筛选、排序、空状态与 Key的示例代码
```jsx
const tasks = [
  {
    id: "task-104",
    title: "核对订单",
    priority: 2,
    completed: false
  },
  {
    id: "task-105",
    title: "复核退款",
    priority: 3,
    completed: true
  },
  {
    id: "task-106",
    title: "联系客户",
    priority: 1,
    completed: false
  }
];

// 只保留未完成任务。
const pendingTasks = tasks.filter((task) => !task.completed);
const orderedTasks = [...pendingTasks].sort(compareTaskPriority);

const taskContent = orderedTasks.length > 0
  ? (
    <ol>
      {/* 把排序后的任务转换为带稳定 Key 的列表项。 */}
      {orderedTasks.map((task) => (
        <li key={task.id}>
          <strong>{task.title}</strong>
          <span>，优先级 {task.priority}</span>
        </li>
      ))}
    </ol>
  )
  : <p>当前没有待处理任务。</p>;

const taskSection = (
  <section>
    <h1>待处理任务</h1>
    {taskContent}
  </section>
);

ReactDOM.render(taskSection, document.getElementById("root"));
```
:::

`compareTaskPriority` 使用第三节已经定义的比较函数。页面显示：

```text
待处理任务
1. 核对订单，优先级 2
2. 联系客户，优先级 1
```

已完成的“复核退款”被筛除；两项待处理任务按优先级排列；Key 分别保持为 `task-104` 和 `task-106`。把两项任务都改为已完成后，页面会显示空状态。

## 十二、知识检查

关键规则如下：

| 检查项 | 正确结论 |
|--------|----------|
| `map` 返回什么 | 与原数组等长的新数组 |
| 箭头函数使用花括号时需要什么 | 显式 `return` |
| 筛选与转换的顺序 | 先 `filter`，再 `map` |
| 排序前为什么复制数组 | `sort` 会原地修改数组 |
| 空数组渲染是否报错 | 不报错，但不会生成列表项 |
| Key 表示什么 | 同一兄弟集合中列表项的稳定身份 |
| Key 是否需要全局唯一 | 不需要，只需同层唯一 |
| Key 是否进入 DOM 或 `props.key` | 都不会 |
| Key 放在哪里 | `map` 直接返回的最外层元素上 |
| 何时可以使用索引 Key | 内容和顺序永久固定的静态列表 |
| 是否可以渲染时使用随机 Key | 不可以，同一数据会失去稳定身份 |
| Fragment 简写能否接收 Key | 不能，应使用显式 `React.Fragment` |

## 十三、参考资料

- [React 旧版文档：Lists and Keys](https://legacy.reactjs.org/docs/lists-and-keys.html)
- [React 旧版文档：Reconciliation](https://legacy.reactjs.org/docs/reconciliation.html)
