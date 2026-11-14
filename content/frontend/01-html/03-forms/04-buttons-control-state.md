---
title: "按钮与控件状态"
tags:
  - HTML
  - 表单
  - 按钮
  - 控件状态
excerpt: "解释普通表单中的提交、重置和普通按钮，按现行标准区分省略 type 的条件；通过默认值与当前状态说明重置，再用编辑、键盘焦点和分组传播比较 disabled 与 readonly。"
date: 2026-11-14
---

# 按钮与控件状态

按钮文字描述用户看到的操作，`type` 决定普通表单中的基础行为。写着“查看”的按钮，如果实际属于提交按钮，仍然会触发表单提交；写着“清空”的重置按钮，也可能把输入恢复成已有初稿。

判断这些行为，需要同时看按钮的类型、所属表单，以及控件的默认值和当前状态。控件显示为灰色不等于已经禁用，源码写有 `checked` 也不等于用户现在仍然选中它。

下面按按钮职责、默认值、重置和禁用状态分组，最后用独立页面比较编辑、重置与焦点路径。

::: info 本篇的范围
本篇讲 `button` 与 `input` 按钮类型、默认值和控件状态。字段是否进入请求由[表单提交与数据编码](./05-submission-encoding.md)集中说明；基础输入类型见[input 基本输入控件](./02-basic-inputs.md)；选择控件见[选择控件与文本域](./03-select-textarea.md)。`formaction` 等按钮级覆盖属性归第 5 章，`command`/`commandfor`、对话框和事件体系不在本篇展开。
:::

## 一、按钮的三种基础职责

### 1. 显式声明 submit、reset 和 button

在普通表单中，下面三种写法分别承担不同职责。这是放在已有 `form` 内部的局部内容：

```html
<button type="submit">提交</button>
<button type="reset">恢复默认</button>
<button type="button">查看</button>
```

提交按钮请求提交所属表单；是否最终发生导航，还取决于表单状态、校验及事件处理等条件。重置按钮请求恢复所属表单中可重置控件的默认状态。普通按钮没有提交或重置的默认动作；本例没有脚本或命令声明，所以点击“查看”不会自动显示一份结果。

按钮只有关联到表单，才能通过这些表单行为操作对应的表单。不能仅凭它在页面上离某个输入框很近，就认定两者属于同一个表单。这里使用直接写在 `form` 内的按钮；表单归属的基础关系由[表单结构与控件标签](./01-form-structure-labels.md)负责。

### 2. button 与 input 按钮的写法不同

`input` 也有 `type="submit"`、`type="reset"` 和 `type="button"`，基础职责可作相应对照，但它是空元素，按钮文字由 `value` 提供。例如下面两种局部写法都可表示提交入口：

```html
<input type="submit" value="提交">
<button type="submit">提交</button>
```

`button` 的内容可以包含合适的文字级标记，但不能在里面再放链接、输入框等交互后代，也不能包含指定了 `tabindex` 的后代。按钮内容和交互边界见 [HTML：button](https://html.spec.whatwg.org/multipage/form-elements.html#the-button-element)；相关 `input` 类型见 [提交按钮](https://html.spec.whatwg.org/multipage/input.html#submit-button-state-(type=submit))。

### 3. 按钮文字不是浏览器行为

“提交”“清空”“查看”只是作者写的文字，浏览器不会读取中文含义来决定动作。真正决定基础行为的是按钮类型和所属表单；即使把提交按钮的文字改成“取消”，点击后仍可能提交。

反过来，普通按钮可以显示“提交”字样，却因为没有提交类型而不触发表单提交。界面文字应与实际行为一致，但判断行为时必须以元素和属性为准。

| 写法 | 基础行为 | 文字来源 |
|------|----------|----------|
| `<button type="submit">提交</button>` | 请求提交所属表单 | 元素内容 |
| `<button type="reset">恢复默认</button>` | 请求重置所属表单 | 元素内容 |
| `<button type="button">查看</button>` | 没有提交或重置的默认动作 | 元素内容 |
| `<input type="submit" value="提交">` | 请求提交所属表单 | `value` 属性 |

## 二、省略 type 与意外提交

### 1. 普通表单中的 Auto 状态

普通表单中，下面这种写法容易造成意外提交：

```html
<button>查看</button>
```

现行标准把缺失或无效的 `type` 归入 **Auto 状态**。Auto 状态下，若按钮没有 `command`、`commandfor` 属性，且父节点不是 `select`，它属于提交按钮。因此，在本篇普通表单条件下省略 `type`，点击后会触发提交流程；写错为 `type="normal"` 也不是关闭提交的方法。

这条条件比“任何位置的按钮默认都提交”更准确。现行标准还有选择控件与命令相关的按钮场景，不能把普通表单的结果无条件推广过去；这些增强能力不在这里展开。默认状态的依据见 [button 的 type 定义与提交按钮条件](https://html.spec.whatwg.org/multipage/form-elements.html#attr-button-type)。

### 2. 普通操作按钮应显式写 type

当按钮只准备交给脚本处理、不承担提交或重置职责时，显式声明 `type="button"`，避免把其文字含义误认为浏览器行为。删除 `type` 可以是合法 HTML，所以检查器通过也不能证明按钮行为符合作者意图。

```html
<!-- 推荐：普通操作按钮显式声明类型 -->
<button type="button">查看</button>
```

### 3. 表单中的第一个提交按钮与隐式提交

在支持隐式提交的平台上，文本控件获得焦点后按 Enter，可以触发默认提交按钮。默认按钮是按树顺序属于该表单的第一个提交按钮；它必须能被激活且未禁用。

`textarea` 中的 Enter 用于换行，不会触发提交；没有提交按钮、或有多个文本输入框时，也不能保证按 Enter 一定提交。隐式提交的完整条件由[表单提交与数据编码](./05-submission-encoding.md)说明。

::: warning 省略 type 不是“没有行为”
`<button>` 在普通表单中通常按提交按钮处理，点击可能导致页面导航。只想执行脚本动作时写 `type="button"`；不要依赖检查器是否报错来判断按钮的实际行为。
:::

## 三、默认声明与当前状态

### 1. 文本的初始值不等于当前输入

对于文本 `input`，`value` 内容属性提供默认值；用户编辑后，控件的当前 `.value` 可以与这个默认值不同。例如，下面是 `body` 中的局部标记：

```html
<label for="draft">短文本</label>
<input id="draft" type="text" name="draft" value="原始初稿">
```

用户把文字改为“修改稿”后，当前 `.value` 是修改稿，`.defaultValue` 仍为原始初稿。Elements 面板中看到的 `value="原始初稿"` 记录的是内容属性，不能据此判断用户尚未修改。对于这里的文本输入，读取 `.value` 才是在读取当前值。

`textarea` 的默认文字来自标签之间的内容，`.defaultValue` 表示默认文本，`.value` 表示当前文本。它没有用于设置初稿的 `value` 内容属性；二者的书写方式不能混用。基本写法见[选择控件与文本域](./03-select-textarea.md)。

### 2. 选中状态也有默认和当前两层

复选框和单选按钮使用 `checked` 声明默认选中状态。用户操作改变 `.checked`，不会因为取消勾选就自动删除源码中的 `checked`。单选组改变选择时，还会影响同组的其他按钮，不能只看某一个标签的初始属性。

选择控件对应的是每个 `option` 的状态：`selected` 声明默认选择，`.selected` 表示当前是否选中。下面按本篇使用的控件对照读取位置：

| 控件 | 默认声明与默认属性 | 当前状态 |
|------|--------------------|----------|
| 文本 `input` | `value` 内容属性，`.defaultValue` | `.value` |
| `textarea` | 标签间的文本，`.defaultValue` | `.value` |
| 复选框、单选按钮 | `checked` 内容属性，`.defaultChecked` | `.checked` |
| `option` | `selected` 内容属性，`.defaultSelected` | `.selected` |

默认声明不只是文字记录，它还参与初始化与重置。脚本或开发者工具也能修改默认声明；因此“默认值”不应理解为浏览器永远保留的一份首次加载快照。这里先固定默认声明，只观察用户编辑当前状态；理解两层状态后，才能解释为什么重置会回到初稿，而不是回到空值。

## 四、重置恢复什么

### 1. 重置回到各控件的默认状态

点击关联表单的重置按钮时，浏览器按各控件自己的重置规则处理当前状态：文本回到默认文本，复选框和单选按钮回到默认勾选，选项回到默认选择并满足单选等约束。

文本原本有初稿时，重置后仍有初稿；原本默认勾选的项目，重置后重新勾选。它不是统一清空，也不是把页面恢复到刚打开时的所有视觉状态。

### 2. 不同控件有不同恢复规则

`reset` 不是“把所有值都设成空字符串”。例如，文件控件会清空已选文件，而不是给文件路径恢复一个文本 `value`。选择控件会回到默认选项，隐藏字段回到默认值；各控件的具体步骤在其元素定义中规定。

表单的重置流程见 [HTML：重置表单](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#resetting-a-form)。

重置不会自动删除 `disabled` 或 `readonly`，不会撤销已经发送到服务器的数据，更不是删除本地存储或重新加载页面的通用命令。若脚本已经改写了默认值，重置会按当时的默认声明恢复，而不是保证回到最初磁盘文件的状态。

因此，重置只适合作者为表单提供的“恢复默认填写”操作。需要清空、取消或撤销业务流程时，应设计相应动作，不能把原生重置当成通用撤销。

::: warning 重置会丢弃尚未保存的编辑
原生重置按钮没有“先保存再恢复”的含义。是否提供该入口，应考虑误触后编辑内容丢失的影响；本例用它观察状态，不构成每个实际表单都应添加重置按钮的建议。
:::

## 五、禁用、只读与键盘焦点

### 1. disabled 停用控件

`disabled` 可以用于 `input`、`button`、`select`、`textarea` 等原生控件，使它们进入禁用状态。对于本篇的文本输入，用户不能编辑，普通 Tab 导航也会跳过它；禁用按钮不能按正常用户操作触发其行为。

禁用控件通常也不参与表单数据构造，但具体条目规则由[表单提交与数据编码](./05-submission-encoding.md)说明。视觉上的灰色只是常见呈现，判断状态应看属性或匹配结果。

### 2. readonly 限制编辑，但保留焦点

`readonly` 用于支持只读机制的文本类 `input` 和 `textarea`。它限制用户编辑，但控件仍可接收焦点，文字仍可选择和复制。在这里使用的类型中，`input type="text"` 支持只读，复选框、单选按钮和各种按钮不支持，`select` 也没有 `readonly` 机制。

其他日期、数值等输入类型的适用范围需按各自定义核对，不把“所有 input 都支持”作为规则。依据见 [HTML：readonly](https://html.spec.whatwg.org/multipage/input.html#the-readonly-attribute)。

### 3. 布尔属性只能通过移除来关闭

两种属性都是布尔属性。`disabled="false"` 仍声明禁用，`readonly="false"` 也仍声明只读；解除状态要移除相应属性。控件是否进入提交数据还有独立规则：禁用控件被排除，只读控件不会仅因只读而被排除。

| 本篇普通文本控件 | 用户编辑 | 普通 Tab 焦点 | 是否参与提交 |
|------------------|----------|---------------|--------------|
| 正常文本输入 | 可以 | 可以到达 | 按当前值参与 |
| `disabled` 文本输入 | 不可以 | 跳过 | 不参与 |
| `readonly` 文本输入 | 不可以 | 可以到达 | 按当前值参与 |

### 4. fieldset 的禁用会传播给组内控件

`fieldset disabled` 会使组内相应控件禁用，但它的**第一个 `legend` 元素子项内部**是这次传播的例外。这个例外允许组标题中的控件保留操作；不表示其他来源的禁用也被解除。具体条件见 [HTML：控件禁用规则](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#enabling-and-disabling-form-controls:-the-disabled-attribute)。

因此，组内输入框即使自己没有 `disabled` 属性，也可以实际处于禁用状态。在开发者工具中只数属性是不够的：`.disabled` 反映自身属性，不能概括所有继承自禁用分组的结果。需要核对实际状态时，可用 `element.matches(':disabled')`，它判断当前元素是否匹配禁用状态。

::: warning 禁用和只读不是安全机制
它们限制的是当前浏览器中的用户操作，不是数据防篡改机制。脚本仍能修改控件值，用户也能修改自己浏览器里的标记；服务器不能把客户端提交的禁用或只读状态当作可信依据。
:::

## 六、独立核对按钮与状态变化

### 1. 创建状态观察页

新建空目录 `html-states`，创建 `states.html`，以 UTF-8 保存以下完整内容。直接打开即可使用，无脚本、外部资源和服务依赖。表单的 `action="#sent"` 把提交目标设为当前文件的片段，`method="get"` 用于观察导航；它不表示有服务器接收或保存数据。

::: details 查看 states.html 完整内容

```html [states.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>按钮与状态观察</title>
</head>
<body>
  <h1>按钮与状态观察</h1>
  <form id="states" action="#sent" method="get">
    <p><label for="draft">短文本</label>
      <input id="draft" type="text" name="draft" value="原始初稿"></p>
    <p><label><input id="flag" type="checkbox" name="flag"
                     value="yes" checked>默认勾选</label></p>
    <fieldset>
      <legend>单选状态</legend>
      <label><input id="first" type="radio" name="position"
                    value="first" checked>第一项</label>
      <label><input id="second" type="radio" name="position"
                    value="second">第二项</label>
    </fieldset>
    <p><label for="mode">选择状态</label></p>
    <select id="mode" name="mode" size="2">
      <option id="option-a" value="a" selected>选项 A</option>
      <option id="option-b" value="b">选项 B</option>
    </select>
    <p><label for="note">多行文本</label></p>
    <textarea id="note" name="note" rows="2" cols="24">第一行初稿
第二行初稿</textarea>
    <p><label for="inactive">禁用文本</label>
      <input id="inactive" type="text" name="inactive"
             value="暂不可用" disabled></p>
    <p><label for="fixed">只读文本</label>
      <input id="fixed" type="text" name="fixed"
             value="可选择但不可编辑" readonly></p>
    <p><label for="fixed-note">只读文本域</label></p>
    <textarea id="fixed-note" name="fixed-note" rows="2"
              cols="24" readonly>只读的说明</textarea>
    <fieldset disabled>
      <legend>禁用分组
        <label><input id="legend-control" type="checkbox">标题内例外控件</label>
      </legend>
      <p><label for="grouped">组内文本</label>
        <input id="grouped" type="text" value="组内初稿"></p>
    </fieldset>
    <p>
      <button id="plain" type="button">普通按钮</button>
      <button id="restore" type="reset">恢复默认</button>
      <button id="send" type="submit">提交到本页目标</button>
    </p>
  </form>
  <h2 id="sent">本页提交目标</h2>
  <p>这里只标记同页目标，不接收或保存数据。</p>
</body>
</html>
```

:::

“选择状态”设置 `size="2"` 以同时显示两个选项，它仍是单选。示例中的控件分别服务于状态对照，没有额外的保存逻辑。

### 2. 编辑后比较默认和当前状态

打开页面，把短文本改为“修改稿”，取消默认勾选，选择单选第二项与选项 B，并修改多行文本。点击普通按钮，这些编辑应保留，地址也不会因本例按钮而发生提交导航。

在开发者工具的 Console 中执行以下只读表达式，每行返回相应状态。`getAttribute` 读取内容属性，`.value`、`.checked`、`.selected` 则读取这里需要观察的当前状态：

```js
document.getElementById('draft').getAttribute('value')
document.getElementById('draft').value
document.getElementById('flag').defaultChecked
document.getElementById('flag').checked
document.getElementById('option-a').defaultSelected
document.getElementById('option-a').selected
```

按上述操作后，结果依次为 `原始初稿`、`修改稿`、`true`、`false`、`true`、`false`。

### 3. 重置并观察恢复范围

点击“恢复默认”，短文本回到原始初稿，复选框重新勾选，单选回到第一项，选择控件回到 A，文本域回到两行初稿。

禁用和只读属性仍然存在。如果要另外验证“重置不解除禁用”，可在 Console 执行 `document.getElementById('plain').disabled = true`，它会禁用普通按钮；点击恢复默认后，该按钮仍禁用。完成观察后执行 `document.getElementById('plain').disabled = false`，解除本次临时设置。

| 观察项 | 重置前 | 重置后 |
|--------|--------|--------|
| 短文本 | 修改稿 | 原始初稿 |
| 复选框 | 未勾选 | 重新勾选 |
| 单选组 | 第二项 | 第一项 |
| 选择控件 | 选项 B | 选项 A |
| 多行文本 | 用户修改后的内容 | 两行初稿 |
| 普通按钮的 `disabled` | 脚本设为 `true` | 仍为 `true` |

### 4. 观察禁用、只读与分组传播

点击多行文本域，再按 Tab。本篇主测环境会跳过禁用文本，进入只读文本；再按 Tab 可到只读文本域，之后到禁用分组首个 `legend` 内的复选框。继续移动时，组内禁用文本被跳过。

尝试输入文字，只读值保持不变，标题内例外复选框则仍可切换。Console 中读取 `document.getElementById('grouped').disabled` 得到 `false`，而读取 `document.getElementById('grouped').matches(':disabled')` 得到 `true`：前者没有发现自身属性，后者包含了分组造成的实际状态。

### 5. 区分意外提交与非法属性

先保留正确文件。点击提交按钮，浏览器会导航到当前文件的目标，地址含查询部分与 `#sent`。这里没有接收程序，只能据此确认本地表单导航，不能声称提交内容已经被远端保存。

回到原始 `states.html`，把普通按钮的 `type="button"` 删除，保存、刷新，再点击它。在本篇没有命令属性、父节点为 `p` 且关联到表单的条件下，它会按提交按钮处理，也导航到本页目标。恢复 `type="button"` 后重新打开原始文件，点击它应保留当前地址和编辑。这个误用符合语法，Nu 不会把省略类型本身报为错误。

另一个错误对照是给选择控件添加 `readonly`：

```html
<!-- 错误示例：select 不支持 readonly -->
<select id="mode" name="mode" size="2" readonly>
```

这只是替换完整页面中该控件开始标签的局部标记，其余选项与结束标签不变。刷新后该控件仍可选择；在本例列表式单选中，聚焦后用向下方向键仍可从 A 选择 B。上传到 [Nu HTML Checker](https://validator.w3.org/nu/)会报告 `select` 不允许 `readonly` 属性。

修复时先判断需求：需要暂停选择，可以使用 `disabled`，并接受相应焦点与数据规则；只是展示一个不可修改的既定结果，也可以直接输出文字。这里恢复原来的可编辑示例，即删除错误属性，再确认选择与重置仍正常。

| 注入的问题 | 观察 | 恢复 |
|------------|------|------|
| 删除普通按钮的 `type` | 点击后触发提交导航，Nu 不报错 | 恢复 `type="button"` |
| 给 `select` 加 `readonly` | 仍可选择，Nu 报告不支持该属性 | 删除属性；按需改用 `disabled` 或纯文字 |
| 用 `disabled="false"` 解除禁用 | 仍然禁用 | 移除整个 `disabled` 属性 |
| 认为 `.disabled` 能反映分组状态 | 组内控件显示 `false`，实际匹配 `:disabled` | 用 `matches(':disabled')` 核对实际状态 |
| 把重置当成清空 | 文字回到初稿，不是空值 | 按默认声明解释结果，不把 reset 当通用清空 |

### 6. 验证记录

以上独立页面于 2026-11-14 在 macOS 的 Chrome 157.0.8103.79 中实测。普通按钮、显式提交、遗漏类型后的提交、默认与当前状态、重置、只读输入、禁用焦点跳过、`fieldset` 的例外与继承状态均有实际观察。正常与恢复版本经 Nu 检查无错误、无警告，`select readonly` 得到对应属性错误；省略普通按钮类型的对照也通过语法检查。

本次重写只补充正文层次、注释和观察项，`states.html` 的结构、属性与实测条件未变；这里未验证真实屏幕阅读器、其他浏览器、命令按钮和服务端数据处理。
