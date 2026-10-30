---
title: "React 元素与 JSX"
category: "前端 · React 16.8"
tags:
  - React
  - JSX
  - ReactDOM
excerpt: "介绍 JSX 的基本写法、React 元素、JSX 转换关系和 ReactDOM.render，说明 React 16.8 如何描述并渲染静态界面。"
date: 2026-07-29
---

# React 元素与 JSX

## 一、JSX

JSX 是 React 代码中描述界面结构的常用写法。它使用标签、属性和子内容组织界面，并可以通过 Fragment 表示多个并列元素。

### 1. JSX 是什么

JSX 是 JavaScript 的语法扩展，允许在 JavaScript 表达式中书写类似 HTML 的标签结构。它的作用是描述界面应该包含哪些元素，以及这些元素之间是什么关系。

**语法形式**

```text
const element = (
  <标签名 属性名="静态值">
    子内容
  </标签名>
);
```

这段结构包含三个部分：

| 部分 | 作用 |
|------|------|
| 标签名 | 描述元素类型，例如 `h1`、`article` |
| 属性 | 描述元素配置，例如类名、ID |
| 子内容 | 描述标签内部的文本或其他元素 |

JSX 不是 HTML 字符串，也不是浏览器原生支持的 JavaScript 语法。项目构建时，Babel、TypeScript 等编译工具会把 JSX 转换为普通 JavaScript 调用。本文针对 React 16.8 使用经典 JSX 转换，转换结果会调用 `React.createElement`。

JSX 适合描述具有嵌套关系的界面。相比连续调用多个函数，标签结构能够直接反映父元素和子元素的关系。

**示例：创建标题元素**

```jsx
const pageTitle = <h1>任务中心</h1>;
```

执行这行代码会得到一个 React 元素并保存到 `pageTitle`，但此时浏览器页面还不会自动出现标题。元素需要交给 ReactDOM 才能进入浏览器页面。

### 2. JSX 基本写法

JSX 使用开始标签和结束标签包裹子内容：

```text
<标签名>子内容</标签名>
```

没有子内容的标签使用自闭合形式：

```text
<标签名 />
```

属性写在开始标签中。静态字符串使用引号：

```text
<标签名 属性名="静态值">子内容</标签名>
```

JSX 标签之间可以继续嵌套 JSX，形成父子结构。例如 `article` 可以包含标题和段落。下面示例中的属性值均为静态字符串。

JSX 标签名称区分大小写：

| 写法 | React 的解释 |
|------|--------------|
| `<article>` | 小写名称表示浏览器宿主标签 |
| `<TaskCard>` | 大写名称表示当前作用域中的 React 组件 |

小写名称表示浏览器宿主标签，大写名称表示 React 组件。

**示例：描述任务卡片**

```jsx
const taskCard = (
  <article className="task-card">
    <h2>整理 React 笔记</h2>
    <p>状态：进行中</p>
    <hr />
  </article>
);
```

这个 JSX 表达式描述了以下结构：

```text
article
├── h2
├── p
└── hr
```

`article` 是父元素，`h2`、`p` 和 `hr` 是它的子元素。`hr` 没有子内容，因此使用 `/>` 闭合。

### 3. JSX 结构规则

JSX 必须形成完整、明确的结构。编译器需要根据标签位置确定元素之间的父子关系。

主要规则如下：

| 规则 | 说明 |
|------|------|
| 一个完整表达式 | 一段 JSX 需要产生一个顶层结果 |
| 标签必须闭合 | 普通标签需要结束标签，空标签使用 `/>` |
| 标签必须正确嵌套 | 后打开的标签应先关闭 |
| 多行 JSX 使用括号 | 括号明确表达式范围，也能避免换行造成歧义 |
| JSX 注释写在大括号中 | 使用 `{/* 注释内容 */}` |

“一个顶层结果”不等于页面最终只能产生一个 DOM 节点。多个并列元素可以使用有语义的容器，也可以使用不额外生成 DOM 节点的 Fragment。

**示例：正确结构与错误结构对比**

::: code-group

```jsx [正确写法]
const taskHeader = (
  <header>
    {/* 页面主标题 */}
    <h1>任务中心</h1>
    <p>查看待处理任务</p>
  </header>
);
```

```jsx [多个顶层元素]
// 错误：赋值右侧出现两个并列的顶层结果。
const taskHeader = (
  <h1>任务中心</h1>
  <p>查看待处理任务</p>
);
```

```jsx [标签未闭合]
// 错误：img 没有使用自闭合形式。
const avatar = <img src="/images/avatar.png" alt="用户头像">;
```

```jsx [嵌套顺序错误]
// 错误：strong 在 p 之前打开，却在 p 之后关闭。
const status = <p><strong>进行中</p></strong>;
```

:::

这些错误会发生在 JSX 编译阶段。修正标签结构后，代码才能继续转换为普通 JavaScript。

### 4. Fragment

Fragment 用于组织多个并列元素，同时不向浏览器 DOM 增加额外容器。

**语法形式**

::: code-group

```jsx [简写]
<>
  <h1>任务中心</h1>
  <p>查看待处理任务</p>
</>
```

```jsx [完整写法]
<React.Fragment>
  <h1>任务中心</h1>
  <p>查看待处理任务</p>
</React.Fragment>
```

:::

是否使用 Fragment，应根据页面结构决定：

| 需求 | 选择 |
|------|------|
| 需要 `header`、`main` 等语义 | 使用对应的 HTML 标签 |
| 需要设置样式、布局或无障碍属性 | 使用合适的 HTML 标签 |
| 只需要组织多个并列元素 | 使用 Fragment |

Fragment 只参与 React 元素结构，不会产生对应的 DOM 节点。

**示例：使用 Fragment 组织并列元素**

```jsx
const taskHeader = (
  <>
    <h1>任务中心</h1>
    <p>查看待处理任务</p>
  </>
);
```

渲染后，对应的主要 DOM 为：

```html
<h1>任务中心</h1>
<p>查看待处理任务</p>
```

DOM 中没有额外的 Fragment 标签。如果这里改用 `<header>`，DOM 中就会保留 `header` 节点。

### 5. JSX 示例

组合标签、属性和子内容后，可以用 JSX 描述一段完整的静态结构。下面的代码只创建 JSX，不进行页面渲染。

**示例：静态任务摘要**

::: details 查看静态任务摘要完整代码
```jsx
const taskSummary = (
  <main>
    <header>
      <h1>任务中心</h1>
      <p>查看当前学习任务</p>
    </header>

    <article className="task-card">
      <h2>学习 React 元素</h2>
      <p>状态：进行中</p>
      <hr />
    </article>
  </main>
);
```
:::

代码使用了：

- 一个顶层 `main`；
- 正确闭合和嵌套的标签；
- `className` 静态属性；
- `hr` 自闭合标签；
- 多行 JSX 外层括号。

`taskSummary` 保存的是 React 元素描述。只有把它提交给 ReactDOM 后，浏览器才会创建对应 DOM。

## 二、React 元素

JSX 表达式的结果是 React 元素。React 元素是 React 用来描述界面节点的普通 JavaScript 对象。

### 1. React 元素是什么

React 元素是一个描述界面的普通 JavaScript 对象。它记录元素类型、属性和子内容，表示“这个位置的界面应该是什么”。

React 元素具有以下特点：

- React 元素是界面描述，不是真实 DOM；
- 创建元素不会自动修改浏览器页面；
- React 元素创建后不应修改，应通过创建新元素表达新的界面；
- ReactDOM 会读取元素描述并创建或更新 DOM。

**示例：观察 React 元素**

```jsx
const pageTitle = <h1>任务中心</h1>;

console.log(pageTitle.type);
console.log(pageTitle.props.children);
```

控制台输出：

```text
h1
任务中心
```

`type` 表示元素类型，`props.children` 表示元素包含的子内容。此时页面仍然不会因为 `console.log` 或变量赋值而发生变化。

### 2. React 元素的组成

理解 React 元素时，重点关注 `type` 和 `props`：

| 字段 | 含义 | 当前示例 |
|------|------|----------|
| `type` | 元素类型 | `"article"` |
| `props` | 元素接收的属性集合 | `className`、`children` |
| `props.children` | 当前元素的子内容 | `h2` 和 `p` 元素 |

`children` 不是独立于 `props` 的顶层字段，它通常保存在 `props.children` 中。子内容可以是文本、React 元素或元素数组。

**示例：读取元素的类型和属性**

```jsx
const taskCard = (
  <article className="task-card">
    <h2>学习 React 元素</h2>
    <p>状态：进行中</p>
  </article>
);

console.log(taskCard.type);
console.log(taskCard.props.className);
console.log(taskCard.props.children.length);
```

控制台输出：

```text
article
task-card
2
```

这里的 `taskCard` 描述一个 `article`，具有一个静态类名，并包含两个子元素。

### 3. `React.createElement`

`React.createElement` 是 React 提供的元素创建 API。它根据元素类型、属性和子内容返回一个 React 元素。

**调用形式**

```text
React.createElement(type, props, ...children)
```

返回值是 React 元素，不是 DOM 节点。正常开发通常使用 JSX，因为 JSX 更容易表达嵌套结构；本文的 React 16.8 示例采用经典 JSX 转换，编译结果会生成 `React.createElement` 调用。

**示例：创建标题元素**

```jsx
const pageTitle = React.createElement(
  "h1",
  null,
  "任务中心"
);
```

这段代码得到的仍然是 React 元素。`"h1"` 表示元素类型，`null` 表示没有额外属性，`"任务中心"` 是子内容。

### 4. `createElement` 参数

`React.createElement` 接收以下参数：

| 参数 | 是否必需 | 含义 | 常见取值 |
|------|----------|------|----------|
| `type` | 必需 | 要创建的元素类型 | `"div"`、`"h1"` 或组件变量 |
| `props` | 可选 | 传给元素的属性对象 | `{ className: "task-card" }` 或 `null` |
| `...children` | 可选 | 元素包含的子内容 | 字符串、React 元素、元素数组 |

参数顺序必须保持不变：

```text
元素类型
→ 属性对象
→ 一个或多个子内容
```

没有属性但存在子内容时，第二个参数仍然需要传入 `null`，否则 React 会把第二个参数当作属性对象处理。

**示例：使用三个参数创建任务卡片**

```jsx
const taskCard = React.createElement(
  "article",
  { className: "task-card" },
  React.createElement("h2", null, "学习 React 元素"),
  React.createElement("p", null, "状态：进行中")
);
```

参数对应关系如下：

| 当前调用内容 | 作用 |
|--------------|------|
| `"article"` | 创建 `article` 类型的 React 元素 |
| `{ className: "task-card" }` | 设置静态类名 |
| 第一个嵌套调用 | 创建 `h2` 子元素 |
| 第二个嵌套调用 | 创建 `p` 子元素 |

嵌套的 `createElement` 调用最终形成一棵 React 元素树。

### 5. React 元素与 DOM

React 元素与浏览器 DOM 节点承担不同职责：

| React 元素 | DOM 节点 |
|------------|----------|
| 描述界面应该是什么 | 浏览器页面中的真实节点 |
| 由 JSX 或 `React.createElement` 创建 | 由 ReactDOM 提交后创建或更新 |
| 是轻量的 JavaScript 对象 | 具有浏览器 DOM API |
| 不能直接调用 `focus()`、`appendChild()` | 可以调用对应 DOM 方法 |
| 创建后不应直接修改 | 可以由浏览器或 ReactDOM 更新 |

**错误示例：对 React 元素调用 DOM 方法**

```jsx
const titleElement = <h1>任务中心</h1>;

// 错误：React 元素没有 focus 方法。
titleElement.focus();
```

在 JavaScript 中执行时会出现类似错误：

```text
TypeError: titleElement.focus is not a function
```

如果业务需要操作真实 DOM，应在元素渲染后通过 Ref 获取节点。React 元素本身不是 DOM。

### 6. React 元素示例

下面不使用 JSX，直接通过 `React.createElement` 描述同一段任务摘要。

**示例：使用 `createElement` 描述静态任务**

::: details 查看使用 `createElement` 描述静态任务完整代码
```jsx
const taskSummary = React.createElement(
  "main",
  null,
  React.createElement(
    "header",
    null,
    React.createElement("h1", null, "任务中心"),
    React.createElement("p", null, "查看当前学习任务")
  ),
  React.createElement(
    "article",
    { className: "task-card" },
    React.createElement("h2", null, "学习 React 元素"),
    React.createElement("p", null, "状态：进行中"),
    React.createElement("hr", null)
  )
);
```
:::

这段代码同样产生一棵 React 元素树，但嵌套关系比 JSX 更难直接阅读。两种写法的对应关系如下：

## 三、JSX 与 React 元素

JSX 是创建 React 元素的一种语法形式。理解两者关系后，才能分清“开发时书写的标签”和“React 实际接收的元素描述”。

### 1. JSX 的转换结果

本文面向 React 16.8，采用经典 JSX 转换。编译工具会把 JSX 标签转换为 `React.createElement` 调用，因此包含 JSX 的文件需要让 `React` 处于当前作用域。

转换过程为：

```text
JSX 源码
→ 编译工具转换
→ React.createElement 调用
→ React 元素
```

**示例：标题元素的转换结果**

::: code-group

```jsx [JSX 源码]
import React from "react";

const pageTitle = <h1 className="page-title">任务中心</h1>;
```

```jsx [经典转换结果]
import React from "react";

const pageTitle = React.createElement(
  "h1",
  { className: "page-title" },
  "任务中心"
);
```

:::

JSX 不是运行时生成的 HTML 字符串。它会先转换成元素创建调用，再由 React 创建元素描述。

### 2. 结构对应关系

JSX 与 `createElement` 的主要对应关系如下：

| JSX 结构 | `createElement` 参数 |
|----------|-----------------------|
| 标签名称 | `type` |
| 标签属性 | `props` |
| 标签子内容 | `...children` |

嵌套 JSX 会转换为嵌套的 `createElement` 调用。外层标签创建父元素，内层标签先创建子元素，再作为 `children` 传给父元素。

**示例：嵌套结构的参数对应关系**

::: code-group

```jsx [JSX]
const taskCard = (
  <article className="task-card">
    <h2>学习 React 元素</h2>
  </article>
);
```

```jsx [createElement]
const taskCard = React.createElement(
  "article",
  { className: "task-card" },
  React.createElement(
    "h2",
    null,
    "学习 React 元素"
  )
);
```

:::

对应关系为：

```text
article → 父元素 type
className → 父元素 props
h2 元素 → 父元素 children
"学习 React 元素" → h2 元素的 children
```

### 3. 对照示例

**示例：两种写法描述同一界面**

::: code-group

```jsx [JSX]
const taskSummary = (
  <section className="task-summary">
    <h1>任务中心</h1>
    <p>状态：进行中</p>
  </section>
);
```

```jsx [createElement]
const taskSummary = React.createElement(
  "section",
  { className: "task-summary" },
  React.createElement("h1", null, "任务中心"),
  React.createElement("p", null, "状态：进行中")
);
```

:::

两种写法都会产生类型为 `section`、类名为 `task-summary`，并包含 `h1` 和 `p` 子元素的 React 元素。

实际开发通常优先使用 JSX。`createElement` 的价值在于解释 JSX 的转换结果，以及在不使用 JSX 的场景中直接创建元素。

## 四、React 元素渲染

React 元素只存在于 JavaScript 中。要让它描述的界面出现在浏览器中，还需要准备宿主节点，并通过 ReactDOM 提交元素。

### 1. 宿主节点

宿主节点是 `index.html` 中已经存在的 DOM 元素。React 会管理该节点内部的内容，但不会替应用创建 `html`、`head` 或 `body`。

**示例：准备并获取宿主节点**

```html
<!-- index.html -->
<div id="root"></div>
```

JavaScript 使用 DOM API 获取该节点：

```jsx
const root = document.getElementById("root");
```

如果 HTML 中不存在相同 ID，`root` 的值就是 `null`，ReactDOM 无法把元素提交到目标位置。

入口代码还需要检查查询结果：

```jsx
const root = document.getElementById("root");

if (!root) {
  throw new Error("未找到 #root 宿主节点，请检查 index.html");
}
```

明确检查 `root` 可以把“页面空白”转成具体错误信息，便于定位 HTML 与入口代码的连接问题。

### 2. ReactDOM 的职责

`react` 与 `react-dom` 的职责不同：

| 包 | 当前阶段的职责 |
|----|----------------|
| `react` | 创建和组织 React 元素 |
| `react-dom` | 把 React 元素提交到浏览器 DOM |

React 元素本身不依赖浏览器，可以表示界面结构。ReactDOM 面向浏览器环境，负责读取元素描述并创建或更新真实 DOM。

职责关系可以概括为：

```text
React：界面应该是什么
ReactDOM：把界面提交到浏览器
```

### 3. `ReactDOM.render`

React 16.8 使用 `ReactDOM.render` 把 React 元素渲染到指定宿主节点。

**调用形式**

```text
ReactDOM.render(element, container, callback?)
```

该 API 会让 React 管理 `container` 内部的 DOM。宿主节点本身仍然保留，React 创建的内容会出现在宿主节点内部。

第三个参数 `callback` 是可选回调，在渲染或更新完成后执行。基础渲染通常不需要传入。业务代码也不应依赖 `ReactDOM.render` 的返回值，应通过组件数据或 DOM 结果判断界面状态。

::: warning React 版本边界
本文基于 React 16.8，因此使用 `ReactDOM.render`。React 18 改用 `createRoot`，不能把 React 18 的根 API 直接套入 React 16.8 示例。
:::

**示例：渲染标题元素**

```jsx
const pageTitle = <h1>任务中心</h1>;
const root = document.getElementById("root");

if (!root) {
  throw new Error("未找到 #root 宿主节点");
}

ReactDOM.render(pageTitle, root);
```

执行后，`h1` 会出现在 `#root` 内部。

### 4. `render` 参数

`ReactDOM.render` 的参数如下：

| 参数 | 是否必需 | 含义 |
|------|----------|------|
| `element` | 必需 | 当前需要显示的 React 元素 |
| `container` | 必需 | 接收 React 内容的真实 DOM 节点 |
| `callback` | 可选 | 渲染或更新完成后执行的回调 |

前两个参数不能交换：

```text
React 元素在前
→ DOM 宿主节点在后
```

**示例：分别准备元素和宿主节点**

::: details 查看分别准备元素和宿主节点完整代码
```jsx
const taskSummary = (
  <section>
    <h1>任务中心</h1>
    <p>状态：进行中</p>
  </section>
);

const root = document.getElementById("root");

if (!root) {
  throw new Error("未找到 #root 宿主节点");
}

ReactDOM.render(taskSummary, root);
```
:::

其中 `taskSummary` 是 React 元素，`root` 是真实 DOM 节点。ReactDOM 根据前者描述的结构，更新后者内部的内容。

### 5. 完整渲染流程

一段 JSX 显示到页面需要经过以下步骤：

| 顺序 | 输入 | 处理结果 |
|------|------|----------|
| 1 | JSX 源码 | 编译为 `React.createElement` 调用 |
| 2 | `createElement` 调用 | 创建 React 元素 |
| 3 | React 元素和宿主节点 | 传给 `ReactDOM.render` |
| 4 | ReactDOM 提交 | 浏览器创建或更新真实 DOM |

完整链路为：

```text
JSX
→ React.createElement
→ React 元素
→ ReactDOM.render
→ 浏览器 DOM
```

这条链路区分了三种不同对象：

| 对象 | 所在位置 | 作用 |
|------|----------|------|
| JSX | 源代码 | 方便开发者描述结构 |
| React 元素 | JavaScript 运行时 | 描述当前界面 |
| DOM 节点 | 浏览器页面 | 承载最终可见内容 |

### 6. 完整示例

下面的示例使用一个 HTML 宿主节点和一个入口代码片段完成静态渲染。

**示例：渲染静态任务页面**

宿主节点：

```html
<!-- index.html -->
<div id="root"></div>
```

入口代码：

::: details 查看 src/index.jsx 完整代码
```jsx
// src/index.jsx
import React from "react";
import ReactDOM from "react-dom";

const root = document.getElementById("root");

if (!root) {
  throw new Error("未找到 #root 宿主节点");
}

const taskPage = (
  <main>
    <header>
      <h1>任务中心</h1>
      <p>查看当前学习任务</p>
    </header>

    <article className="task-card">
      <h2>学习 React 元素</h2>
      <p>状态：进行中</p>
      <hr />
    </article>
  </main>
);

ReactDOM.render(taskPage, root);
```
:::

页面显示：

```text
任务中心
查看当前学习任务

学习 React 元素
状态：进行中
```

浏览器中的主要 DOM 结构为：

::: details 查看完整示例代码
```html
<div id="root">
  <main>
    <header>
      <h1>任务中心</h1>
      <p>查看当前学习任务</p>
    </header>
    <article class="task-card">
      <h2>学习 React 元素</h2>
      <p>状态：进行中</p>
      <hr>
    </article>
  </main>
</div>
```
:::

示例中的执行关系为：

1. JSX 描述 `main`、`header` 和任务卡片结构；
2. 经典 JSX 转换把标签转换为 `React.createElement` 调用；
3. React 根据调用创建 `taskPage` 元素；
4. `ReactDOM.render` 把元素提交到 `#root`；
5. 浏览器在 `#root` 内创建对应 DOM。

## 五、参考资料

- [React 旧版文档：Introducing JSX](https://legacy.reactjs.org/docs/introducing-jsx.html)
- [React 旧版文档：JSX In Depth](https://legacy.reactjs.org/docs/jsx-in-depth.html)
- [React 旧版文档：Rendering Elements](https://legacy.reactjs.org/docs/rendering-elements.html)
- [ReactDOM API](https://legacy.reactjs.org/docs/react-dom.html)
