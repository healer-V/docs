---
title: "表单结构与控件标签"
tags:
  - HTML
  - 表单
  - 标签关联
excerpt: "解释 form、输入控件和字段的关系，区分 id、name 与可见标签，说明 label 的两种关联方式及 fieldset、legend 的分组职责，并验证标签点击、键盘路径和关联错误的修复。"
date: 2026-11-14
---

# 表单结构与控件标签

表单是一组供用户输入或选择数据的界面。文本框、单选框等可以操作的元素称为**表单控件**；控件表达的数据项通常称为**字段**。例如，“姓名”是字段的含义，文本框接收填写内容，而旁边的文字需要通过标签关联告诉浏览器：这段说明属于哪个控件。

HTML 用 `form` 组织表单，用 `label` 为具体控件提供说明，用 `fieldset` 和 `legend` 表达一组控件的共同问题。仅把文字和输入框摆在相近位置，不能建立这些关系。

下面先说明表单范围和字段身份，再比较两种标签关联，最后用独立文件检查分组与键盘路径。

::: info 本篇的范围
本篇讲 `form`、`label`、`fieldset` 和 `legend` 的结构关系。`action`/`method` 的完整请求行为见[表单提交与数据编码](./05-submission-encoding.md)；按钮类型、默认值和禁用状态见[按钮与控件状态](./04-buttons-control-state.md)；具体输入类型见[input 基本输入控件](./02-basic-inputs.md)。`placeholder`、`form` 属性关联和原生校验分别归第 5 章。
:::

## 一、表单的范围与字段

### 1. form 把相关控件组织在一起

在没有另行指定关联的普通结构中，控件放在所属的 `form` 内。下面是可放进文档 `body` 的局部内容：

```html
<form id="identity-form">
  <p><label>姓名：<input type="text" name="person_name"></label></p>
</form>
```

`form` 不是给控件画边框的标签。它建立表单范围，使有关联的控件能够作为一组参与提交等操作；输入框本身则决定用户可以填写什么。

控件也能出现在 `form` 外，再通过 `form` 属性关联到某个表单；“页面上有一个输入框”和“它属于某个表单”是两项分别判断的事实。本篇只使用直接放在表单内的控件，避免把归属规则与标签关联混在一起。

### 2. 控件、字段名与字段值

一个控件要参与表单数据，通常需要非空的 `name`。`name` 是字段的数据名称，用户填写或选择的当前状态则是字段值。例如，下面的文本框名称为 `person_name`，用户输入“林”后，提交数据中才可能形成相应条目：

```html
<input type="text" name="person_name" value="林">
```

`value` 在这里提供初始文字，用户编辑后当前值可以与它不同。控件是否最终进入请求，还取决于是否禁用、是否选中以及提交方式等条件；这些规则由[表单提交与数据编码](./05-submission-encoding.md)集中说明。

### 3. 一个 form 不能嵌套另一个 form

一个页面可以有多个并列的表单，但**不能在一个 `form` 中嵌套另一个 `form`**。内层标签不会可靠地形成作者设想的独立表单，浏览器修复后的范围还可能改变。

```html
<!-- 错误示例：form 不能嵌套 -->
<form id="outer">
  <form id="inner">
    <input name="query">
  </form>
</form>
```

需要两组数据时，应把两个表单分别完整关闭，或者只保留一个表单并在内部做逻辑分组。依据见 [form 的内容模型](https://html.spec.whatwg.org/multipage/forms.html#the-form-element)。

::: warning 表单范围不能靠视觉边界推断
给一块区域加边框、标题或背景色，不会自动建立 `form`。检查控件属于哪个表单时，看源码中的开始与结束标签，或在 Elements 中查看表单归属；不要只凭控件在页面上的位置判断。
:::

## 二、标签怎样关联控件

### 1. for 按 id 找到控件

显式关联把标签和控件分别书写，并用 `for` 指向控件的 `id`：

```html
<label for="person-name">姓名：</label>
<input id="person-name" type="text" name="person_name">
```

`for="person-name"` 寻找的是同一文档树中相应的元素标识，不是字段的 `name`。该目标还必须是允许被标签关联的控件，例如这里的文本输入框；给普通 `div` 起相同的 id，不会把它变成文本框。

`id` 必须在当前文档中唯一，`for` 的值应与它精确一致。浏览器在通常的桌面交互中会把标签点击转交给相应控件；具体激活方式仍与控件及平台有关。规则见 [label 的关联与激活行为](https://html.spec.whatwg.org/multipage/forms.html#the-label-element)。

### 2. name 不是面向用户的说明

`name` 是控件的数据名称；对于文本输入框，用户填写的文字构成它的当前值。字段具备参与提交的条件时，名称和值共同表达数据，例如名称为 `person_name`、值为“林”。

`label` 中的“姓名”则是给用户理解的说明，也是计算控件无障碍名称的重要来源。**无障碍名称**是浏览器向辅助技术提供、用于识别控件的名称；它不要求与程序使用的数据名称相同。把 `name="person_name"` 写好，不会自动给文本框显示“姓名”，也不会代替标签关联。[WAI 控件标签说明](https://www.w3.org/WAI/tutorials/forms/labels/)解释了可见标签与程序关联的配合。

| 标记 | 当前例子中的职责 | 不能代替的内容 |
|------|------------------|----------------|
| `id="person-name"` | 唯一识别页面中的控件，供 `for` 等引用 | 字段的数据名称 |
| `name="person_name"` | 为控件的数据命名 | 可见标签及其关联 |
| `label` 的文字与 `for` | 告诉用户字段含义，并关联目标控件 | 用户填写的值 |
| `value` | 文本控件的初始值或选项的数据值 | 字段名称与可见说明 |

### 3. 包裹式标签直接包含控件

不使用 `for` 时，可以把控件放在 `label` 内，形成包裹式关联：

```html
<label>称呼：<input type="text" name="preferred_name"></label>
```

此时关联来自标签内部的控件，不必为了关联另写 id。若控件还需要被其他位置引用，仍可以设置唯一 id；两种写法的选择不改变字段的 `name` 职责。

一个标签应清楚说明一个控件，不应包住多个需要分别填写的输入框，也不能嵌套另一个 `label`。若已经写了 `for`，就要核对它的目标，不能期待错误的 `for` 自动退回包裹式关联。标签内也不宜混入另有用途的链接或按钮，避免把操作入口与控件说明混在一起。

### 4. 外观相邻不构成关联

`<p>姓名：<input type="text"></p>` 只是把文字和输入框放在同一段中，没有声明标签关系。浏览器不会因为两者相邻、颜色相同或宽度对齐，就自动把文字作为控件的名称。

需要关联时，把说明写入 `label`，再用 `for` 指向控件，或让 `label` 包住控件。间距和布局只影响呈现，不能替代结构。

::: tip 一个控件一条清楚的标签
标签文字应说明用户要填什么，例如“姓名：”“配送方式”。不要用“请输入”“必填”这类没有字段含义的文字单独充当标签；必要提示可以放在标签文字或说明中，但不能让控件失去可识别的名称。
:::

## 三、fieldset 与 legend 表达共同问题

### 1. 共同问题与单个选项分开表达

当多个控件共同回答一个问题时，可以用 `fieldset` 包住它们，再以位于开头的 `legend` 说明这一组的含义。以下局部片段中，“配送方式”是共同问题，“快递”和“自取”分别是选项：

```html
<fieldset>
  <legend>配送方式</legend>
  <p><label><input type="radio" name="delivery" value="courier">快递</label></p>
  <p><label><input type="radio" name="delivery" value="pickup">自取</label></p>
</fieldset>
```

`legend` 说明整组，单个选项仍需要自己的标签。只有“快递”“自取”而没有共同问题时，用户未必知道它们是在选择配送、退货还是其他事项；只有一个“配送方式”标签，又不能分别说明两个控件。

### 2. 分组结构不等于建立单选互斥

浏览器常给 `fieldset` 绘制边框，但分组关系不依赖边框是否显示。相反，只给 `div` 加边框，也不会自动得到同样的分组说明。

`fieldset` 本身不负责建立单选互斥：这里的单选控件使用共同 `name`，其选择规则由 input 类型决定。把两个选项放进同一个 `fieldset`、却没有共同 `name`，它们仍不会成为一个互斥组。依据见 [fieldset 与 legend](https://html.spec.whatwg.org/multipage/form-elements.html#the-fieldset-element)和 [WAI 控件分组](https://www.w3.org/WAI/tutorials/forms/grouping/)。

### 3. legend 要位于分组的开头

`legend` 是 `fieldset` 的组标题，应作为它的第一个元素子项出现。把标题写在分组中间或末尾，既不符合内容模型，也不能稳定地表达“这组控件回答什么问题”。

分组标题与控件标签承担不同层级：`legend` 说明一组选项的共同主题，`label` 说明其中某个控件。两者都省略时，用户只能从选项文字猜测上下文；只写 `legend` 而不给每个选项标签，也无法分别操作和识别它们。

| 结构 | 回答的问题 | 例子 |
|------|------------|------|
| `form` | 这些控件一起参与哪次提交 | 身份信息表单 |
| `fieldset` + `legend` | 这组控件共同回答什么 | 配送方式 |
| `label` | 这个控件具体填什么 | 快递 |
| `name` | 数据以什么字段名发送 | `delivery` |

## 四、独立观察标签与分组

### 1. 创建完整文件

新建空目录 `html-labels`，创建 `labels.html`，以 UTF-8 保存。文件不依赖 CSS、脚本、服务器或其他文章材料；两个文本框分别验证显式与包裹式关联，配送选项验证共同问题与单个标签。

::: details 查看 labels.html 完整内容

```html [labels.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>标签与分组观察</title>
</head>
<body>
  <h1>标签与分组观察</h1>
  <form id="identity-form">
    <p>
      <label for="person-name">姓名：</label>
      <input id="person-name" type="text" name="person_name">
    </p>
    <p>
      <label>称呼：<input id="preferred-name" type="text" name="preferred_name"></label>
    </p>
    <fieldset>
      <legend>配送方式</legend>
      <p><label><input id="courier" type="radio" name="delivery" value="courier">快递</label></p>
      <p><label><input id="pickup" type="radio" name="delivery" value="pickup">自取</label></p>
    </fieldset>
  </form>
</body>
</html>
```

:::

### 2. 点击标签并检查焦点路径

双击打开文件，点击“姓名”文字，观察输入焦点进入对应文本框；点击“称呼”文字，再观察另一个文本框。两项都应能够输入文字，说明关联并不取决于标签和控件必须分开还是必须包在一起。

在“姓名”框中按 `Tab`，焦点移动到“称呼”；按 `Shift+Tab` 返回。继续用 `Tab` 进入配送单选组后，可用方向键在选项间移动并选择。单选组的 Tab 入口与当前选中项有关，不能把它理解成每个选项都固定占用一次 Tab 停靠；具体键盘表现应在目标环境检查。

Chrome 开发者工具可用 `F12` 打开，macOS 可用 `Option+Command+I`。在 Elements 中检查文本框的 `id`、`name` 和对应标签，再查看 Accessibility 中的名称；“配送方式”应作为组的说明，而不是两个选项的数据名称。

| 观察项 | 操作或位置 | 预期结果 |
|--------|------------|----------|
| 显式标签 | 点击“姓名” | 焦点进入姓名文本框 |
| 包裹式标签 | 点击“称呼” | 焦点进入称呼文本框 |
| 正向移动 | 在姓名框按 Tab | 焦点移到称呼框 |
| 反向移动 | 按 Shift+Tab | 焦点回到姓名框 |
| 分组名称 | 可访问性信息 | “配送方式”属于组，不是选项数据名 |
| 字段名称 | Elements | `person_name`、`preferred_name`、`delivery` |

### 3. 制造错配并恢复

把完整文件复制为 `invalid.html`，只将第一个标签改为 `for="missing-name"`，保留文本框的 `id="person-name"`。重新打开，点击“姓名”文字不再把焦点转交给原文本框，因为文档中不存在它引用的控件；直接点击文本框仍可以输入。

把这个完整版本上传 [Nu HTML Checker](https://validator.w3.org/nu/)，根据报告检查 `for` 指向的目标。修复时恢复 `for="person-name"`，保存为 `repaired.html`，再检查标签点击、无障碍名称与检查器结果。

| 注入的问题 | 观察 | 恢复 |
|------------|------|------|
| `for` 指向不存在的 id | 点击标签无焦点转移，Nu 报告目标无效 | 恢复正确 `for`，核对对应 `id` |
| 两个控件重复使用同一 id | 标签关联不明确，检查器报告重复 id | 为各控件分配唯一 id，并更新所有引用 |
| 用 `name` 的值填进 `for` | 找不到目标（除非 id 恰好相同） | `for` 只写目标控件的 `id` |
| 多个输入框包进一个 `label` | 关联对象不唯一，结构非法 | 拆成一条标签对应一个控件 |
| 只把文字放在输入框旁边 | 没有关联，点击文字无反应 | 改为显式或包裹式标签 |

若错误来自重复 id，应先把各控件改为唯一 id，再分别更新标签引用；不要给不同输入框重复使用一个 id 来省事。

### 4. 验证记录

本例于 2026-11-14 在 macOS 的 Chrome 157.0.8103.79 中核对：两种标签都能把焦点转交给对应文本框，Tab 与反向移动、单选组方向键选择符合上述观察；浏览器提供了两个文本框的标签名称及“配送方式”组名。正常和修复文件通过 Nu 检查，错配文件被报告为标签未引用有效目标。

本次重写只补充正文层次、注释和观察项，`labels.html` 的结构与实测条件未变；这里没有测试屏幕阅读器的实际朗读，也没有验证表单提交或服务器接收。
