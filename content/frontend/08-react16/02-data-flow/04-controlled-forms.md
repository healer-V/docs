---
title: "受控表单"
tags:
  - React
  - 表单
  - State
excerpt: "讲解 input、textarea、select、单选和复选控件的受控方式，以及多字段更新、校验、提交、重置和模式边界。"
date: 2026-07-30
---

# 受控表单

受控表单把控件当前值保存在 State 中。用户输入先触发事件，事件更新 State，React 再把新值传回控件。

## 一、受控与非受控

### 1. 受控控件

文本输入的 `value` 由 State 决定，`onChange` 负责同步输入：

::: details 查看受控控件的示例代码
```jsx
/**
 * 管理受控任务标题。
 * @returns {React.ReactElement} 受控输入框和当前值。
 */
function TaskTitleField() {
  const [title, setTitle] = useState("");

  /**
   * 同步用户输入。
   * @param {React.ChangeEvent<HTMLInputElement>} event 输入变化事件。
   * @returns {void} 提交新的标题。
   */
  function handleChange(event) {
    setTitle(event.currentTarget.value);
  }

  return (
    <div>
      <input value={title} onChange={handleChange} />
      <p>当前标题：{title}</p>
    </div>
  );
}
```
:::

输入“核对订单”后，State 和页面文本都变成该值。

### 2. 非受控控件

`defaultValue` 只设置初始 DOM 值，后续输入由浏览器维护：

```jsx
const uncontrolledInput = (
  <input defaultValue="核对订单" />
);
```

| 模式 | 值来源 | 常用属性 |
|------|--------|----------|
| 受控 | React State | `value`、`checked` |
| 非受控 | 浏览器 DOM | `defaultValue`、`defaultChecked` |

同一个控件生命周期内不要在两种模式之间切换。

## 二、文本与选择控件

### 1. `input` 与 `textarea`

两者都使用 `value` 和 `onChange`：

::: details 查看`input` 与 `textarea`的示例代码
```jsx
const [form, setForm] = useState({
  title: "",
  description: ""
});

/**
 * 更新任务标题。
 * @param {React.ChangeEvent<HTMLInputElement>} event 文本输入事件。
 * @returns {void} 提交新的表单对象。
 */
function handleTitleChange(event) {
  const title = event.currentTarget.value;
  setForm((previousForm) => ({ ...previousForm, title }));
}

/**
 * 更新任务说明。
 * @param {React.ChangeEvent<HTMLTextAreaElement>} event 多行输入事件。
 * @returns {void} 提交新的表单对象。
 */
function handleDescriptionChange(event) {
  const description = event.currentTarget.value;
  setForm((previousForm) => ({ ...previousForm, description }));
}
```
:::

`textarea` 在 JSX 中不使用标签子文本设置当前值，应使用 `value` 或 `defaultValue`。

### 2. `select`

受控 `select` 在元素自身设置 `value`：

::: details 查看`select`的示例代码
```jsx
const [priority, setPriority] = useState("normal");

/**
 * 更新任务优先级。
 * @param {React.ChangeEvent<HTMLSelectElement>} event 选择变化事件。
 * @returns {void} 提交选中的值。
 */
function handlePriorityChange(event) {
  setPriority(event.currentTarget.value);
}

const priorityField = (
  <select value={priority} onChange={handlePriorityChange}>
    <option value="low">低</option>
    <option value="normal">普通</option>
    <option value="high">高</option>
  </select>
);
```
:::

React 不需要在 `option` 上设置 `selected`，当前选项由 `select.value` 决定。

## 三、单选与复选

### 1. 单选按钮

一组单选按钮共享一个 State，每个按钮比较自己的 `value`：

::: details 查看单选按钮的示例代码
```jsx
const [priority, setPriority] = useState("normal");

/**
 * 选择优先级。
 * @param {React.ChangeEvent<HTMLInputElement>} event 单选变化事件。
 * @returns {void} 提交当前选项值。
 */
function handlePriorityChange(event) {
  setPriority(event.currentTarget.value);
}

const highPriority = (
  <label>
    <input
      type="radio"
      name="priority"
      value="high"
      checked={priority === "high"}
      onChange={handlePriorityChange}
    />
    高
  </label>
);
```
:::

### 2. 复选框

复选框读取 `checked`，不是 `value`：

::: details 查看复选框的示例代码
```jsx
const [urgent, setUrgent] = useState(false);

/**
 * 同步紧急任务开关。
 * @param {React.ChangeEvent<HTMLInputElement>} event 复选框变化事件。
 * @returns {void} 提交选中状态。
 */
function handleUrgentChange(event) {
  setUrgent(event.currentTarget.checked);
}

const urgentField = (
  <input
    type="checkbox"
    checked={urgent}
    onChange={handleUrgentChange}
  />
);
```
:::

## 四、多个字段

### 1. 根据字段名更新对象

多个文本类字段可以使用 `name` 找到目标字段：

::: details 查看根据字段名更新对象的示例代码
```jsx
const initialForm = {
  title: "",
  owner: "",
  priority: "normal",
  urgent: false
};

const [form, setForm] = useState(initialForm);

/**
 * 更新文本、选择或复选字段。
 * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement>} event
 * 表单控件变化事件，name 必须对应 initialForm 字段。
 * @returns {void} 提交更新后的表单对象。
 */
function handleFieldChange(event) {
  const { name, type, value } = event.currentTarget;
  const nextValue = type === "checkbox"
    ? event.currentTarget.checked
    : value;

  setForm((previousForm) => ({
    ...previousForm,
    [name]: nextValue
  }));
}
```
:::

动态字段名减少重复，但要求 `name` 与 State 字段严格对应。字段转换或业务规则复杂时，独立处理函数更清楚。

## 五、提交与校验

### 1. 在 `onSubmit` 统一处理

表单提交应绑定在 `form` 上，这样按钮和键盘回车都走同一入口：

::: details 查看在 `onSubmit` 统一处理的示例代码
```jsx
const [errorMessage, setErrorMessage] = useState("");

/**
 * 校验并提交任务表单。
 * @param {React.FormEvent<HTMLFormElement>} event 表单提交事件。
 * @returns {void} 阻止页面刷新并输出有效数据。
 */
function handleSubmit(event) {
  event.preventDefault();

  const trimmedTitle = form.title.trim();
  if (!trimmedTitle) {
    setErrorMessage("任务标题不能为空");
    return;
  }

  setErrorMessage("");
  console.log({
    ...form,
    title: trimmedTitle
  });
}
```
:::

校验失败时显示错误并停止提交；成功时再构造业务数据。不要把错误提示、提交中等展示状态直接混进接口模型。

### 2. 重置 State

受控表单通过恢复 State 重置：

```jsx
// 恢复所有受控字段和错误提示。
const handleReset = () => {
  setForm(initialForm);
  setErrorMessage("");
};
```

直接执行 `event.currentTarget.reset()` 只修改 DOM，下一次渲染时受控值仍会由 State 写回。

## 六、模式边界

### 1. 避免受控状态切换

受控文本值应从字符串开始：

```jsx
const [title, setTitle] = useState("");
```

不要先使用 `undefined`，之后再改成字符串。React 会警告控件从非受控切换为受控。数值输入的 DOM 值仍是字符串，需要在提交或明确时机转换。

### 2. 文件输入

`<input type="file">` 的值不能由 React 设置，属于非受控控件。需要通过 DOM 的 `files` 读取选择结果；具体 `useRef` 用法在第 4 章讲解。

选择文件后，可以在 `onChange` 中读取 `event.target.files`，并把文件对象交给上传逻辑。清空选择时应重置输入节点或在用户操作中设置其 DOM 值为空，不能通过 `value={fileName}` 控制文件路径。

## 七、完整示例

::: details 查看完整示例代码
```jsx
/**
 * 管理任务创建表单。
 * @returns {React.ReactElement} 可输入、校验、提交和重置的表单。
 */
function TaskForm() {
  const initialForm = { title: "", priority: "normal", urgent: false };
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  /**
   * 同步任意已声明字段。
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement>} event 控件事件。
   * @returns {void} 提交新的表单对象。
   */
  function handleChange(event) {
    const { name, type, value, checked } = event.currentTarget;
    setForm((previousForm) => ({
      ...previousForm,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  /**
   * 校验并输出表单数据。
   * @param {React.FormEvent<HTMLFormElement>} event 提交事件。
   * @returns {void} 阻止刷新并处理当前 State。
   */
  function handleSubmit(event) {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("请输入任务标题");
      return;
    }
    setError("");
    console.log(form);
  }

  // 恢复表单初始状态。
  const handleReset = () => {
    setForm(initialForm);
    setError("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        标题
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
        />
      </label>
      <label>
        优先级
        <select
          name="priority"
          value={form.priority}
          onChange={handleChange}
        >
          <option value="normal">普通</option>
          <option value="high">高</option>
        </select>
      </label>
      <label>
        <input
          name="urgent"
          type="checkbox"
          checked={form.urgent}
          onChange={handleChange}
        />
        紧急任务
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit">创建任务</button>
      <button type="button" onClick={handleReset}>重置</button>
    </form>
  );
}
```
:::

空标题提交会显示错误；有效输入提交时控制台得到当前数据；重置后所有控件恢复初始值。

## 八、知识检查

| 控件 | 受控属性 | 事件读取 |
|------|----------|----------|
| 文本输入、`textarea` | `value` | `currentTarget.value` |
| `select` | `value` | `currentTarget.value` |
| 单选按钮 | `checked` | 当前选项的 `value` |
| 复选框 | `checked` | `currentTarget.checked` |
| 文件输入 | 非受控 | DOM `files` |

## 九、参考资料

- [React 旧版文档：Forms](https://legacy.reactjs.org/docs/forms.html)
- [React 旧版文档：Uncontrolled Components](https://legacy.reactjs.org/docs/uncontrolled-components.html)
