---
title: "候选列表 datalist 与结果输出 output"
tags:
  - HTML
  - 表单
  - datalist
  - output
excerpt: "解释 datalist 建议与 select 固定选择的区别，说明 output 的计算来源、表单归属和名称，用独立页面实现两个数相加，并核对空值、数值转换、关联错误与结果不进入提交字段的边界。"
date: 2026-11-14
---

# 候选列表 datalist 与结果输出 output

输入建议和固定选项解决不同问题。`datalist` 给输入控件提供候选值，用户仍可以填写列表外内容；`select` 则让用户从声明的选项中选择。`output` 又是另一种职责：它表达计算或用户操作的结果，不是另一个供用户填写的文本框。

这两个元素已包含在 [2014 年 HTML5 的表单定义](https://www.w3.org/TR/2014/REC-html5-20141028/forms.html#the-datalist-element)中。下面按现行 HTML Standard 讲解关联与运行行为，不由“HTML5”这个名称推定各浏览器拥有完全相同的候选界面。

::: info 本篇的范围
本篇讲 `datalist` 的建议关联，以及 `output` 的来源声明、表单归属和不进入提交数据的行为。固定选择与文本域见[选择控件与文本域](../03-forms/03-select-textarea.md)，标签关联见[表单结构与控件标签](../03-forms/01-form-structure-labels.md)，提交条目与编码见[表单提交与数据编码](../03-forms/05-submission-encoding.md)。自动补全算法、远程搜索接口和框架状态管理不在本篇展开。
:::

## 一、候选建议的声明与关联

### 1. list 按 id 关联候选列表

下面是可以放在 `body` 中的局部内容。输入框仍是普通文本输入，`list` 指向 `datalist` 的唯一 `id`：

```html
<label for="colour">颜色名称</label>
<input id="colour" type="text" name="colour" list="colours">
<datalist id="colours">
  <option value="red"></option>
  <option value="green"></option>
  <option value="blue"></option>
</datalist>
```

`label` 说明输入框的用途，`list="colours"` 提供候选来源，两者不能互相代替。`datalist` 本身不会像普通列表一样在正文中展开，它的内容供相关输入控件使用。

### 2. option 的 value 构成候选值

这里各 `option` 的 `value` 是可采用的候选值。候选可以另带标签文字，但输入时使用的值与界面如何组合显示值和标签，不能混为一谈。本例只声明值，避免依赖某一种显示格式。非禁用且值非空的选项才构成相应建议；完整规则见 [HTML：datalist](https://html.spec.whatwg.org/multipage/form-elements.html#the-datalist-element)和 [input 的 list 属性](https://html.spec.whatwg.org/multipage/input.html#attr-input-list)。

### 3. 候选值不是允许值清单

输入 `violet` 后，即使候选列表只列出 `red`、`green` 和 `blue`，文本框仍能保留 `violet`。`list` 不会自动产生“必须命中某个选项”的约束。若数据必须属于固定候选范围，应考虑 `select` 或另行定义明确的校验规则，不能只靠显示建议来限制数据。

这不表示“带 `datalist` 的输入永远有效”。输入类型、必填、格式等其他约束仍有自己的作用；这里只说明**不在候选列表内**本身不会被 `datalist` 直接判为错误。

### 4. 候选界面随环境变化

是否显示下拉入口、何时筛选、键盘怎样选择，以及辅助技术如何提供建议，会受浏览器、输入类型和平台影响。核心内容不要只写在候选弹层里；输入框应保留可见标签，必要格式说明也应直接可见。

::: info 建议列表的正确性由作者负责
`datalist` 只负责提供建议，不检查候选值是否仍然有效、是否重复或是否符合业务规则。候选来源变化时，需要同时更新列表和接收端的判断。
:::

## 二、output 的职责与关联

### 1. output 表示计算结果

`output` 表示应用完成计算或用户操作后得到的结果。它区别于 `samp` 引用的其他程序既有输出，也区别于准备让用户填写的 `input`。写入 `output` 不会自动执行计算，仍需由应用明确产生结果。

### 2. for 说明来源，不是算式

以下是放在一个已有 `form id="sum-form"` 内的局部声明，前提是其中已存在两个分别为 `left`、`right` 的输入控件：

```html
<label for="sum">合计</label>
<output id="sum" for="left right" name="total">尚未计算</output>
```

`output` 的 `for` 是用空格分隔的唯一元素 id 集合，说明哪些元素参与或影响结果。它不是算式，也不会自动监听这些输入。外面的 `label for="sum"` 则为结果提供名称“合计”，不能把两种 `for` 当作相同职责。

### 3. 标签内文字是初始内容

初始结果文字写在标签之间。`output` 没有用来设置初稿的 `value` 内容属性；脚本中的 `.value` 是操作当前结果的 DOM 接口，不能据此反推可以在开始标签上任意添加同名属性。

### 4. form 与 name 能找到，但不提交

`name` 提供表单元素集合中的名称，`form` 可以显式指定所属表单的 id。因此，`output` 放在 `form` 外时，也可以用 `form="sum-form"` 关联它。关联成立后，可以通过表单的元素集合找到这个结果，但它的值**不会作为普通字段进入表单提交数据**，即使已经写了 `name` 也一样。依据见 [HTML：output](https://html.spec.whatwg.org/multipage/form-elements.html#the-output-element)。

::: warning 页面上的合计不是服务端结论
显示出一个合计也不意味着服务器可以信任这个结果。浏览器里的标记和脚本都可被修改；需要由接收端据输入重新判断的内容，不能把 `output` 的文字当成最终证明。
:::

## 三、从空目录比较建议与固定选择

### 1. 创建 datalist.html

新建空目录 `html-suggestions`，创建 UTF-8 文件 `datalist.html`。两个控件使用相同的一组候选，仅比较输入建议与固定选择，无脚本或服务依赖。

::: details 查看 datalist.html 完整内容

```html [datalist.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>候选建议与固定选择</title>
</head>
<body>
  <h1>候选建议与固定选择</h1>
  <p><label for="colour">颜色名称：可选择建议，也可自行填写</label></p>
  <input id="colour" type="text" name="colour" list="colours">
  <datalist id="colours">
    <option value="red"></option>
    <option value="green"></option>
    <option value="blue"></option>
  </datalist>
  <p><label for="fixed-colour">固定颜色：从现有选项选择</label></p>
  <select id="fixed-colour" name="fixed_colour">
    <option value="red">red</option>
    <option value="green">green</option>
    <option value="blue">blue</option>
  </select>
</body>
</html>
```

:::

### 2. 输入列表之外的文本

双击打开页面，点击颜色名称标签并输入 `violet`，按 Tab 离开，文字应仍被保留。固定选择里没有 `violet` 这个选项，不能通过相同的自由文本方式增加它。候选界面可按当前浏览器提供的方式打开，再观察建议项；不要把某一组快捷键当作所有平台的统一要求。

### 3. 检查关联读数

在开发者工具 Console 中执行以下只读表达式，分别读取当前文本和实际关联的列表：

```js
document.getElementById('colour').value
document.getElementById('colour').list
```

第一项得到 `violet`，第二项应指向 `datalist#colours`。若把输入框的 `list` 临时改为 `missing-colours`，关联读数会变为 `null`，但文本框本身仍可输入。恢复为 `colours` 后刷新，关联应恢复；候选不出现时，应先核对这一关系，再检查目标环境的支持与交互方式。

| 观察项 | 表达式或操作 | 预期结果 |
|--------|--------------|----------|
| 列表外文本 | 输入 `violet` 后离开 | 文字保留 |
| 关联对象 | `.list` | 指向 `datalist#colours` |
| 断开的关联 | `list="missing-colours"` 后读 `.list` | `null`，输入仍可用 |
| 恢复关联 | 改回 `colours` 并刷新 | `.list` 重新指向候选列表 |

## 四、用脚本更新计算结果

### 1. 创建独立计算页面

在另一个新建空目录 `html-output` 中创建 UTF-8 文件 `output.html`，直接打开即可运行。它与颜色建议示例互相独立，不需要复制其他文件。两个数值输入初始为 3 和 4，结果放在表单外，通过 `form` 关联回来。

::: info 动态部分只需要最小 JavaScript 基础
需要认识变量保存元素引用、读取和赋值、数值转换、简单条件判断，以及事件发生时调用函数。下面解释本例的每个关键步骤；系统学习可从 [MDN：JavaScript 初步](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting)和[事件入门](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Events)进入。静态的候选列表不依赖这些脚本基础。
:::

::: details 查看 output.html 完整内容

```html [output.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>计算结果与关联</title>
</head>
<body>
  <h1>计算结果与关联</h1>
  <form id="sum-form">
    <p><label for="left">左数</label>
      <input id="left" type="number" name="left" value="3"></p>
    <p><label for="right">右数</label>
      <input id="right" type="number" name="right" value="4"></p>
  </form>
  <p><label for="sum">合计</label>：
    <output id="sum" for="left right" form="sum-form"
            name="total">尚未计算</output></p>
  <script>
    const left = document.getElementById("left");
    const right = document.getElementById("right");
    const result = document.getElementById("sum");

    /** 根据当前两个输入更新结果；无返回值，只修改 output 的显示值。 */
    function updateTotal() {
      if (left.value === "" || right.value === "") {
        result.value = "请填入两个数";
        return;
      }
      const total = Number(left.value) + Number(right.value);
      if (!Number.isFinite(total)) {
        result.value = "暂时无法计算";
        return;
      }
      result.value = String(total);
    }

    left.addEventListener("input", updateTotal);
    right.addEventListener("input", updateTotal);
    updateTotal();
  </script>
</body>
</html>
```

:::

打开后初始结果为 `7`，把左数改为 `8`，结果变为 `12`。清空任意一个输入，结果改为“请填入两个数”；重新填写后恢复数值结果。这里没有提交、服务器或真正业务结算过程，只观察结果元素与输入的关系。

### 2. 数值相加而不是字符串拼接

`const` 为查到的元素引用起名，`.value` 读取当前输入的字符串。`Number(...)` 把字符串转成数值，再执行数值加法；若直接写 `left.value + right.value`，两个字符串会拼成字符串 `34`，不是数值 7。本例后面的有限数值检查还会拒绝这个字符串，不能把字符串拼接当作计算完成。

数值转换的规则可对照 [ECMAScript：Number](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-number-constructor)及 [Number.isFinite](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-number.isfinite)。

### 3. 空值与无法计算分开处理

空字符串经 `Number` 转换会得到 0，因此脚本先检查空值。`||` 表示任一条件成立，`return` 在显示提示后结束这次函数调用。随后，`Number.isFinite` 排除非有限数值结果，`!` 表示“不满足”；不能把无法计算的结果当成正常合计展示。`String(total)` 把正常结果转成显示文字。

### 4. 事件监听与初始计算

`input` 事件在用户编辑时触发，两个 `addEventListener` 分别注册同一个计算函数；这里传入函数引用，没有在注册时立即调用。最后单独调用一次 `updateTotal()`，使页面初始值也得到计算。脚本放在控件之后，执行时所需元素已存在。

`for`、`form` 和 `name` 都不负责替代这个计算过程。若移除整个 `script`，页面仍有正确的关联声明，但会保留“尚未计算”；改变两个输入不会自行更新结果。写入 `output.value` 则把结果作为文字呈现，不会把字符串解析成一组 HTML 标签。

### 5. 核对表单归属与数据边界

在正常页面的 Console 中执行以下只读观察，第一行读取结果所属表单，第二行按名称从表单元素集合中找到结果，第三行仅构造当前字段数据，不发送网络请求：

```js
document.getElementById('sum').form.id
document.getElementById('sum-form').elements.namedItem('total').id
Array.from(new FormData(document.getElementById('sum-form')).entries())
```

初始状态下，前两项分别为 `sum-form` 和 `sum`，字段数据只有 `left=3` 与 `right=4`，没有 `total`。这证明结果虽然有关联和名称，也没有作为普通提交字段进入这个集合；并不表示结果在页面里不存在。

| 观察项 | 表达式 | 预期结果 |
|--------|--------|----------|
| 结果所属表单 | `.form.id` | `sum-form` |
| 按名称找到结果 | `elements.namedItem('total').id` | `sum` |
| 提交字段数据 | `FormData` 条目 | 只有 `left` 与 `right`，没有 `total` |

## 五、定位关联、属性与计算错误

### 1. 制造 list 断链

保留正常文件，给 `datalist.html` 的输入框制造前述 `list` 错配，再使用[官方独立版 Nu 工具](https://validator.github.io/validator/)检查完整文档。修复时让 `list` 重新指向现有 `datalist` 的 id，而不是给输入增加更多颜色文字来掩盖断开的关联。

### 2. 制造 output 的关联与属性错误

对 `output.html`，可以临时把结果的 `for="left right"` 改为 `for="left missing"`。脚本仍按自己的元素引用计算，但关联声明引用了不存在的元素。本次使用的 Nu 没有报告这个错配，需要按 `for` 中的 id 逐一核对真实元素；例如读取 `document.getElementById('missing')` 得到 `null`。恢复实际 id 后重新检查，不能用“数值碰巧算对了”或“工具没有报错”证明关联也正确。

再给 `output` 的开始标签临时加上 `value="7"`，会得到不允许的内容属性错误。修复是删除这个属性，保留标签内初始文字和脚本中的 `.value` 赋值；不要混淆 HTML 内容属性与 DOM 接口。

### 3. 制造字符串拼接错误

再把脚本中的 `Number(left.value) + Number(right.value)` 临时改为 `left.value + right.value`，刷新后结果提示“暂时无法计算”：这个表达式产生字符串 `34`，被后面的有限数值检查拒绝。在 Console 直接读取 `document.getElementById('left').value + document.getElementById('right').value`，可以核对拼接结果。这类错误属于运行逻辑，HTML 标记检查不会替代执行 JavaScript。恢复数值转换后重新打开，并检查初始、编辑、空值与恢复输入四种状态。

| 注入的问题 | 观察 | 恢复 |
|------------|------|------|
| `list="missing-colours"` | `.list` 为 `null`，候选不出现 | 指向现有的 `datalist` id |
| `for="left missing"` | 检查器未报告，需人工核对 id | 恢复为真实元素 id |
| `output` 上写 `value="7"` | 不允许的内容属性错误 | 删除属性，保留标签内文字 |
| 字符串直接相加 | 得到 `34`，提示无法计算 | 改用 `Number(...)` 相加 |

### 4. 验证记录

以上独立文件于 2026-11-14 在 macOS 的 Chrome 157.0.8103.79 中核对。列表外文本与键盘焦点、候选关联、结果计算和空值处理、移除脚本后的静态状态、输出的表单归属及非提交字段边界均已实际观察。正常与修复文档经本地 Nu 26.11.9（0f0f1f9）检查无错误、无警告；错误的 `list` 关联和 `output value` 属性得到相应报告，`output for` 的缺失目标仍需人工核对。候选弹层的完整原生交互、跨浏览器界面、屏幕阅读器实际通告和服务端计算不在本次验证范围内。
