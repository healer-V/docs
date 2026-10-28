---
title: "JSX 数据、属性与样式"
tags:
  - React
  - JSX
  - React 16.8
excerpt: "说明 JavaScript 数据如何进入 JSX，系统讲解可渲染值、DOM 属性、className、style、子内容与内容安全边界。"
date: 2026-07-30
---

# JSX 数据、属性与样式

## 一、JSX 表达式

### 1. 使用大括号

JSX 使用一对大括号 `{}` 切换到 JavaScript 表达式。大括号中的表达式会先求值，求值结果再成为元素的属性值或子内容。

大括号常见于两个位置：

| 位置 | 语法形式 | 作用 |
|------|----------|------|
| 标签之间 | `<p>{expression}</p>` | 把表达式结果作为子内容 |
| 属性等号之后 | `<img src={expression} />` | 把表达式结果作为属性值 |

静态字符串属性直接使用引号，动态值才使用大括号：

```jsx
const taskTitle = "核对订单";
const isUrgent = true;

const taskElement = (
  <article data-source="dashboard">
    <h2>{taskTitle}</h2>
    <span aria-label={isUrgent ? "紧急任务" : "普通任务"}>
      {isUrgent ? "紧急" : "普通"}
    </span>
  </article>
);
```

上例中，`"dashboard"` 是固定字符串；`taskTitle` 和条件表达式会在 JavaScript 中求值。页面最终显示“核对订单”和“紧急”。

::: warning 不要把动态值写进字符串
`title="{taskTitle}"` 的属性值是字面量字符串 `{taskTitle}`，不会读取变量。动态属性应写成 `title={taskTitle}`。
:::

### 2. 区分表达式与语句

JSX 大括号接收的是表达式。表达式能够产生一个值，语句负责控制程序执行流程，不能直接放入大括号。

| 可以放入大括号 | 结果 |
|----------------|------|
| 变量 `taskTitle` | 变量当前保存的值 |
| 属性访问 `task.owner.name` | 对象字段值 |
| 运算 `completedCount + 1` | 运算结果 |
| 三元表达式 `done ? "完成" : "进行中"` | 两个值中的一个 |
| 函数调用 `formatDate(createdAt)` | 函数返回值 |
| 数组转换 `tasks.map(...)` | 转换后的数组 |

以下内容属于语句，不能直接写在 JSX 大括号中：

- `if...else`
- `switch`
- `for`
- `while`
- 变量声明 `const`、`let`

需要使用语句时，应先在 JSX 外计算结果，再把结果放入 JSX：

```jsx
const task = {
  title: "核对订单",
  priority: 3
};

let priorityText;

if (task.priority >= 3) {
  priorityText = "高优先级";
} else {
  priorityText = "普通优先级";
}

const taskElement = (
  <article>
    <h2>{task.title}</h2>
    <p>{priorityText}</p>
  </article>
);
```

这个示例先由 `if` 语句生成 `priorityText`，JSX 只接收最终字符串。

### 3. 使用常见表达式

表达式不只用于读取变量，还可以在渲染前完成轻量计算。适合直接写入 JSX 的计算应当短小、没有副作用，并且能从表达式本身看出结果。

```jsx
const task = {
  title: "核对订单",
  assignee: {
    name: "林晓"
  },
  completedSteps: 3,
  totalSteps: 5,
  tags: ["订单", "复核"]
};

const taskElement = (
  <article>
    <h2>{task.title}</h2>
    <p>负责人：{task.assignee.name}</p>
    <p>进度：{task.completedSteps}/{task.totalSteps}</p>
    <p>剩余：{task.totalSteps - task.completedSteps} 步</p>
    <p>标签：{task.tags.join("、")}</p>
  </article>
);
```

页面会得到“负责人：林晓”“进度：3/5”“剩余：2 步”和“标签：订单、复核”。如果计算包含多层判断或修改数据，应移到 JSX 外，避免结构和业务逻辑混在一起。

## 二、可渲染值

### 1. 不同值的渲染结果

表达式产生的值不一定都会显示成文本。React 会根据值的类型决定怎样处理它。

| 值 | 能否作为子内容 | 页面结果 |
|----|----------------|----------|
| 字符串 | 可以 | 显示字符串 |
| 数字 | 可以 | 转成文本后显示，包括 `0` |
| React 元素 | 可以 | 渲染该元素 |
| React 元素数组 | 可以 | 按顺序渲染数组中的元素 |
| `null`、`undefined` | 可以 | 不生成可见内容 |
| `true`、`false` | 可以 | 不生成可见内容 |
| 普通对象 | 不可以 | 抛出“对象不能作为 React 子节点”错误 |

布尔值不显示，不等于它们没有用途。布尔表达式经常用于选择属性或控制某段 JSX 是否出现。

```jsx
const heading = <h2>今日任务</h2>;
const taskItems = [
  <li key="order-review">核对订单</li>,
  <li key="refund-review">复核退款</li>
];

const content = (
  <section>
    {heading}
    <p>待处理：{0}</p>
    <p>{false}</p>
    <p>{null}</p>
    <ul>{taskItems}</ul>
  </section>
);
```

页面会显示标题、“待处理：0”和两个列表项。`false` 与 `null` 对应的位置不会产生可见内容；元素数组会按数组顺序渲染。渲染数组时还需要为元素设置稳定的 `key`，用于标识列表项。

### 2. 普通对象不能直接渲染

普通对象用于组织数据，但 React 不知道应该把整个对象显示成什么文本，因此不能把对象本身作为子内容。

下面的写法会报错：

```jsx
const assignee = {
  name: "林晓",
  department: "客服中心"
};

// 错误：普通对象不能直接作为 React 子内容。
const invalidElement = <p>{assignee}</p>;
```

React 16.8 会给出类似下面的错误：

```text
Objects are not valid as a React child
```

正确做法是选择需要显示的字段，或先把对象转换成有明确含义的字符串：

```jsx
const assignee = {
  name: "林晓",
  department: "客服中心"
};

const assigneeElement = (
  <p>
    负责人：{assignee.name}（{assignee.department}）
  </p>
);
```

页面显示“负责人：林晓（客服中心）”。调试时可以使用 `JSON.stringify(assignee)` 临时观察对象，但它通常不适合作为面向用户的界面文本。

## 三、JSX 属性

### 1. 设置静态属性与动态属性

JSX 属性用于描述最终 DOM 元素的属性和行为。固定字符串使用引号，变量、数字、布尔值、对象或其他表达式使用大括号。

```jsx
const taskId = "task-104";
const tabOrder = 0;
const detailUrl = "/tasks/task-104";

const taskLink = (
  <a
    id="current-task"
    href={detailUrl}
    tabIndex={tabOrder}
    data-task-id={taskId}
  >
    查看任务
  </a>
);
```

属性名整体上接近 DOM 属性，但 React DOM 使用 JavaScript 风格命名。常见差异如下：

| HTML 写法 | JSX 写法 | 原因 |
|-----------|----------|------|
| `class` | `className` | `class` 是 JavaScript 关键字，React 使用 DOM 属性名 |
| `for` | `htmlFor` | 对应 DOM 的 `htmlFor` 属性 |
| `tabindex` | `tabIndex` | 多单词属性使用 camelCase |
| `readonly` | `readOnly` | 多单词属性使用 camelCase |
| `maxlength` | `maxLength` | 多单词属性使用 camelCase |

属性名写错时，React 可能发出控制台警告，属性也可能无法按预期工作。事件属性同样采用 camelCase，例如 `onClick`。

### 2. 使用布尔属性与自定义属性

`disabled`、`checked`、`readOnly` 等布尔属性应接收布尔值。值为 `true` 时启用该属性，值为 `false` 时不启用。

```jsx
const isLocked = true;
const isSelected = false;

const controls = (
  <section>
    <button disabled={isLocked}>提交审核</button>
    <input
      type="checkbox"
      checked={isSelected}
      readOnly
      aria-label="选择当前任务"
    />
  </section>
);
```

第一项按钮不可点击；复选框未选中并且为只读。不要写 `disabled="false"`，因为这是非空字符串，不是布尔值 `false`。

需要给 DOM 保存业务标识时使用 `data-*`，提供无障碍信息时使用 `aria-*`。这两类属性继续保持带连字符的小写形式：

```jsx
const taskRow = (
  <article
    data-task-id="task-104"
    data-priority="high"
    aria-labelledby="task-104-title"
  >
    <h2 id="task-104-title">核对订单</h2>
  </article>
);
```

浏览器 DOM 中会保留这三个属性。`data-*` 不能替代 React 的数据流；它主要服务于 DOM 查询、测试定位或需要读取 DOM 数据的外部代码。

### 3. 展开属性

展开语法 `{...object}` 会把对象中的可枚举字段依次作为 JSX 属性传入。它适合一组名称已经明确、确实都属于目标元素的属性。

**语法形式：**

```jsx
<Element {...attributeObject} />
```

属性按照从左到右的顺序处理，后出现的同名属性覆盖前面的值：

```jsx
const baseAttributes = {
  className: "task-link",
  href: "/tasks/task-104",
  "data-source": "task-list"
};

const taskLink = (
  <a
    {...baseAttributes}
    className="task-link task-link--active"
  >
    查看当前任务
  </a>
);
```

最终 `className` 是 `"task-link task-link--active"`，其他两个属性来自 `baseAttributes`。如果把 `{...baseAttributes}` 放到显式 `className` 后面，展开对象中的类名就会覆盖显式值。

不要为了省事把完整业务对象展开到 DOM：

```jsx
const task = {
  id: "task-104",
  title: "核对订单",
  internalStatusCode: 17
};

// 不推荐：业务字段会被尝试写入 DOM，并可能触发未知属性警告。
const invalidElement = <article {...task}>{task.title}</article>;

// 推荐：只传递该 DOM 元素真正需要的属性。
const validElement = (
  <article data-task-id={task.id}>
    {task.title}
  </article>
);
```

属性展开解决的是重复书写问题，不负责筛选数据。对象来源不明确时，显式列出属性更容易确认最终 DOM 和覆盖顺序。

## 四、样式处理

### 1. 使用 `className`

在 JSX 中设置 CSS 类名使用 `className`，它接收一个字符串。多个类名仍然使用空格分隔。

**语法形式：**

```jsx
<Element className="class-name" />
<Element className={classNameExpression} />
```

动态类名通常先由条件表达式生成，再传给 `className`：

```jsx
const isUrgent = true;
const taskClassName = isUrgent
  ? "task-card task-card--urgent"
  : "task-card";

const taskElement = (
  <article className={taskClassName}>
    <h2>核对订单</h2>
  </article>
);
```

当 `isUrgent` 为 `true` 时，最终 DOM 的 `class` 属性是 `task-card task-card--urgent`。这里的 CSS 规则需要在项目样式文件中另行定义，React 只负责设置类名。

简单条件也可以写在模板字符串中，但要避免产生多余的 `"false"` 或 `"undefined"`：

```jsx
const isCompleted = false;

const statusElement = (
  <span className={`task-status ${isCompleted ? "is-completed" : "is-pending"}`}>
    {isCompleted ? "已完成" : "待处理"}
  </span>
);
```

页面显示“待处理”，元素类名为 `task-status is-pending`。

### 2. 使用 `style` 对象

`style` 属性接收 JavaScript 对象，不接收 CSS 字符串。对象的键是 CSS 属性名，值是该属性的值。

**语法形式：**

```jsx
<Element style={styleObject} />
```

JSX 中的 CSS 属性名使用 camelCase：

| CSS | `style` 对象 |
|-----|--------------|
| `background-color` | `backgroundColor` |
| `font-size` | `fontSize` |
| `margin-top` | `marginTop` |
| `z-index` | `zIndex` |
| `--task-color` | `"--task-color"` |

数值属性会按 React 的规则处理。大多数长度属性的数字会自动补 `px`；部分无单位属性直接保留数字。

```jsx
const progress = 60;
const progressStyle = {
  width: `${progress}%`,
  height: 8,
  opacity: 0.85,
  backgroundColor: "#13795b"
};

const progressElement = (
  <div
    style={progressStyle}
    role="progressbar"
    aria-valuenow={progress}
    aria-valuemin={0}
    aria-valuemax={100}
  />
);
```

最终宽度为 `60%`，高度为 `8px`，透明度为 `0.85`。百分比、`rem`、`vh` 等带单位的值必须写成字符串；`opacity`、`zIndex`、`lineHeight` 等属性可以使用无单位数字。

::: warning `style` 不是 CSS 文本
`style="color: red"` 是 HTML 写法，在 JSX 中不正确。应写成 `style={ { color: "red" } }`：外层大括号进入 JavaScript，内层大括号创建对象；空格只用于避免文档引擎把双大括号识别成模板插值。
:::

### 3. 选择类名或内联样式

`className` 与 `style` 都能影响样式，但职责不同：

| 情况 | 优先选择 | 原因 |
|------|----------|------|
| 可复用的视觉规则 | `className` | 便于维护、覆盖伪类和媒体查询 |
| 多个元素共享同一状态样式 | `className` | 样式规则集中在 CSS 中 |
| 运行时计算的尺寸或坐标 | `style` | 值直接来自当前数据 |
| CSS 自定义属性的动态值 | `style` | 可以把变量传入现有 CSS 规则 |
| `:hover`、`:focus`、媒体查询 | `className` | 内联样式无法直接描述这些规则 |

下面的示例把固定视觉规则交给类名，把运行时进度交给 CSS 自定义属性：

```jsx
const progress = 60;

const taskProgress = (
  <div
    className="task-progress"
    style={{ "--task-progress": `${progress}%` }}
  >
    已完成 {progress}%
  </div>
);
```

`task-progress` 负责固定样式，`--task-progress` 只传递动态值。CSS Modules、CSS-in-JS 和 Styled Components 属于工程级样式组织方案，不属于 JSX 的语法规则。

## 五、子内容

### 1. 组合文本、元素与表达式

开始标签与结束标签之间的内容会成为 `children`。子内容可以是文本、React 元素、表达式结果，也可以混合出现。

```jsx
const task = {
  title: "核对订单",
  assignee: "林晓",
  completedSteps: 3,
  totalSteps: 5
};

const taskElement = (
  <article>
    <h2>{task.title}</h2>
    <p>
      负责人：<strong>{task.assignee}</strong>
    </p>
    <p>
      进度：
      <span>{task.completedSteps}</span>
      /
      <span>{task.totalSteps}</span>
    </p>
  </article>
);
```

页面会把文本、`strong`、`span` 和表达式结果按书写顺序组合。每一个 JSX 元素都是独立子节点，普通文本也会成为文本节点。

### 2. 处理 JSX 空白

JSX 会去掉行首、行尾的空白，并压缩只用于排版的换行。把文本和元素拆到多行时，不要依赖源码缩进产生可见空格。

下面的姓名与括号之间可能没有期望的间隔：

```jsx
const assigneeName = "林晓";

const compactText = (
  <p>
    负责人：
    <strong>{assigneeName}</strong>
    （客服中心）
  </p>
);
```

需要明确空格时，使用 `{" "}`：

```jsx
const assigneeName = "林晓";

const readableText = (
  <p>
    负责人：
    <strong>{assigneeName}</strong>
    {" "}
    （客服中心）
  </p>
);
```

`{" "}` 的表达式结果是一个空格字符串，因此空格不再依赖 JSX 的换行处理规则。中文标点通常不需要额外空格，示例只是展示需要控制英文或混合排版时的写法。

## 六、内容安全

### 1. 默认按文本转义

字符串进入 JSX 时，React 会把具有 HTML 含义的字符转义后作为文本输出，不会把字符串当成 HTML 标签执行。这是 JSX 默认的 XSS 防护边界。

```jsx
const externalTitle = '<img src="invalid" onerror="alert(1)">核对订单';

const safeElement = (
  <article>
    <h2>{externalTitle}</h2>
  </article>
);
```

页面会原样显示字符串中的 `<img ...>` 文本，不会创建 `img` 元素，也不会执行 `onerror`。在浏览器 DOM 中，特殊字符会以安全的文本节点形式存在。

默认转义只保护通过普通 JSX 表达式输出的文本。把不可信数据用于 `href`、样式、第三方 DOM API 或其他执行上下文时，仍需按照对应上下文校验。

### 2. 使用 `dangerouslySetInnerHTML`

只有确实需要把 HTML 字符串解析成 DOM 时，才使用 `dangerouslySetInnerHTML`。它接收一个包含 `__html` 字段的对象：

```jsx
<Element dangerouslySetInnerHTML={{ __html: htmlString }} />
```

| 部分 | 含义 |
|------|------|
| `dangerouslySetInnerHTML` | React 提供的显式 HTML 注入入口 |
| `__html` | 保存待解析 HTML 字符串的固定字段 |
| `htmlString` | 必须已经确认可信或经过可靠净化的数据 |

使用该属性时，元素不能同时声明普通子内容，因为两者都试图控制同一片 DOM：

```jsx
const trustedHelpHtml = "<strong>提示：</strong>请核对订单金额。";

const helpElement = (
  <aside dangerouslySetInnerHTML={{ __html: trustedHelpHtml }} />
);
```

页面会创建一个 `strong` 元素，并显示后续文本。这里使用的是代码中受控的固定字符串。

下面的写法存在安全风险：

```jsx
const htmlFromUser = '<img src="invalid" onerror="alert(document.cookie)">';

// 危险：不可信 HTML 会绕过 React 的默认文本转义。
const unsafeElement = (
  <div dangerouslySetInnerHTML={{ __html: htmlFromUser }} />
);
```

不可信 HTML 必须在进入渲染层之前，使用经过验证的 HTML 净化方案处理。仅删除 `<script>` 标签或使用正则替换不能构成可靠防护。不能确认内容来源与净化过程时，应继续使用普通 JSX 表达式按文本显示。

::: tip 判断原则
如果需求只是显示用户输入、接口文本或日志内容，使用 `{text}`。只有业务明确要求保留受控富文本标签，并且内容已经过可信净化时，才考虑 `dangerouslySetInnerHTML`。
:::

## 七、知识检查

关键规则如下：

| 检查项 | 正确结论 |
|--------|----------|
| 动态值怎样进入 JSX | 在子内容或属性位置使用 `{expression}` |
| 大括号能否直接放 `if` | 不能；先在 JSX 外执行语句并保存结果 |
| 数字 `0` 是否显示 | 显示为文本 `0` |
| 布尔值、`null`、`undefined` 是否显示 | 不产生可见内容 |
| 普通对象能否直接作为子内容 | 不能；选择字段或转换为字符串 |
| JSX 中的 CSS 类属性 | `className` |
| `style` 接收什么 | 使用 camelCase 属性名的 JavaScript 对象 |
| 属性展开如何处理同名值 | 从左到右，后面的属性覆盖前面的属性 |
| 普通字符串是否会作为 HTML 执行 | 不会，React 默认按文本转义 |
| 何时使用 `dangerouslySetInnerHTML` | 仅用于可信或已可靠净化的 HTML |

## 八、参考资料

- [React 旧版文档：Introducing JSX](https://legacy.reactjs.org/docs/introducing-jsx.html)
- [React 旧版文档：JSX In Depth](https://legacy.reactjs.org/docs/jsx-in-depth.html)
- [React 旧版文档：DOM Elements](https://legacy.reactjs.org/docs/dom-elements.html)
