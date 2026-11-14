---
title: "选择控件与文本域"
tags:
  - HTML
  - 表单
  - 选择控件
  - 文本域
excerpt: "区分候选项的显示文字、取值与选中状态，解释 select、option、optgroup 和多选的关系，以及 textarea 的初始内容、当前文本、换行和输入区域，并用独立文件验证常见误用。"
date: 2026-11-14
---

# 选择控件与文本域

`select` 让用户从已有候选项中选择，`textarea` 让用户输入多行自由文本。两者都可以带有可见标签，但它们产生内容的方式不同：选择控件依赖 `option` 的选中状态，文本域保留用户编辑的文字和换行。

候选内容固定时，选择控件可以限制输入范围；需要写一段说明时，多行文本域更合适。把文本域画得像下拉框，或把下拉框显示成多行，都不会改变这种区别。

下面先拆开选项的文字、值和状态，再说明分组与多选，最后用独立页面观察选择控件和文本域。

::: info 本篇的范围
本篇讲 `select`、`option`、`optgroup` 与 `textarea` 的常见结构。默认值与重置见[按钮与控件状态](./04-buttons-control-state.md)；多选值如何编码进请求见[表单提交与数据编码](./05-submission-encoding.md)；`datalist` 与 `output` 归第 5 章。CSS 定制下拉、自定义选择器和前端搜索组件不在本篇。
:::

## 一、选项的文字、值与选中状态

### 1. select 包含候选项，option 提供选项

下面是可放在 `body` 中的局部内容。`label` 的 `for` 对应 `select` 的 `id`，使“区域”成为控件的可见标签：

```html
<label for="region">区域</label>
<select id="region" name="region">
  <option value="north">北部</option>
  <option value="south" selected>南部</option>
</select>
```

“北部”和“南部”是用户看到的文字，`north` 和 `south` 是选项的值。选择“南部”时，读取这个选择控件的 `.value` 会得到 `south`，不会因为界面使用中文就自动返回“南部”。`name` 是参与表单数据时的字段名称，不能代替 `id` 与标签的关联。

### 2. 显示文字与提交值可以不同

`option` 的开始与结束标签之间是显示文字，`value` 是选中后使用的数据值。两者分开，才能在不改变数据含义的情况下调整界面措辞。

```html
<option value="south">南部地区</option>
```

这里显示“南部地区”，提交值为 `south`。如果接收端和前端约定使用 `south`，修改显示文字不会改变字段值；把 `value` 一起改掉，则可能影响接收端识别。

### 3. selected 声明默认选中状态

`selected` 声明选项的默认选中状态。这里的单选框初始选择“南部”；用户选择“北部”后，当前选择会改变，源码中的默认声明不因此改写。

默认状态、当前状态与重置的完整关系由[按钮与控件状态](./04-buttons-control-state.md)负责。读取当前选择应看控件的 `.value` 或选项的 `.selected`，不能只看源码里哪个 `option` 带有 `selected`。

在没有 `multiple` 的选择控件中，不应给多个 `option` 同时写 `selected`。对于普通、显示大小为 1 的单选框，如果没有选中项且有可用选项，浏览器会选中首个可用选项；这不是所有列表式选择控件都必须存在一个选择的通则。定义见 [HTML：select](https://html.spec.whatwg.org/multipage/form-elements.html#the-select-element)与 [option](https://html.spec.whatwg.org/multipage/form-elements.html#the-option-element)。

### 4. 没有 value 时会使用选项文本

`option` 可以不声明 `value`。例如，在一个普通 `select` 中写入下面的局部选项：

```html
<option>未分类</option>
```

这个选项的值来自自身文本，本例是 `未分类`。它不是没有值，也不会自动生成一个数字编号。若显示名称需要修改，而数据含义要保持稳定，可以显式声明一个稳定的 `value`；否则修改显示文字也会改变这个选项的值。

`value=""` 则明确声明空字符串，与省略属性后采用文本不同。没有任何选中项时，选择控件的 `.value` 也会返回空字符串，因此只看 `.value === ''` 不能区分“选中了空值项”与“没有选中项”。需要判断当前选择时，还应查看 `selectedOptions` 或选项的选中状态。

| 写法 | 显示文字 | 当前值 |
|------|----------|--------|
| `<option value="south">南部</option>` | 南部 | `south` |
| `<option>未分类</option>` | 未分类 | `未分类` |
| `<option value="">请选择</option>` | 请选择 | 空字符串 |
| 没有选中项 | — | 空字符串，但原因不同 |

## 二、分组、单选与多选

### 1. optgroup 为选项提供分组名称

候选项存在清楚分类时，可以用 `optgroup` 分组。下面仍是放在 `body` 中的局部内容：

```html
<label for="area">区域分类</label>
<select id="area" name="area">
  <optgroup label="北方">
    <option value="n1">区域一</option>
    <option value="n2">区域二</option>
  </optgroup>
</select>
```

`optgroup` 的 `label` 提供组名；用户实际选择的仍是其中的 `option`，不会把“北方”作为一个额外选项。组名也不能代替整个控件的可见标签：前者说明候选项之间的关系，后者说明用户正在回答什么问题。

普通选择控件中，把同组 `option` 放在对应的 `optgroup` 内，不嵌套 `optgroup` 来模拟任意深度的目录。依据见 [HTML：optgroup](https://html.spec.whatwg.org/multipage/form-elements.html#the-optgroup-element)。

### 2. multiple 控制能否多选，size 控制显示大小

`multiple` 是布尔属性，有这个属性就允许选择零个或多个选项。`size` 用正整数表达期望显示的选项数量，不决定是否允许多选。例如，在 `body` 中放入以下局部内容：

```html
<label for="languages">可阅读的语言</label>
<select id="languages" name="language" multiple size="3">
  <option value="zh" selected>中文</option>
  <option value="en">英文</option>
  <option value="fr">法文</option>
</select>
```

这里最多有三项可供选择，初始选中中文。`size="3"` 不表示最多只能选三项；即使候选项更多，它也主要影响显示区域。只写 `size="3"` 而不写 `multiple`，仍然是单选。`multiple="false"` 也不会关闭多选，应删除整个布尔属性。

### 3. 多选控件的 value 只返回首个选中项

多选框的 `.value` **只返回按文档顺序排列的首个当前选中项的值**，不是所有值，也不是最后一次点击的值。`selectedOptions` 才是全部当前选中项的集合。

进入表单数据时，这些选项可以形成多个同名条目，编码和接收方式由[表单提交与数据编码](./05-submission-encoding.md)讲解；这里不把多值拼成一个逗号字符串。接口依据见 [HTML：select 的接口与选中项](https://html.spec.whatwg.org/multipage/form-elements.html#dom-select-selectedoptions)。

| 读取方式 | 返回内容 | 典型误判 |
|----------|----------|----------|
| `.value` | 首个选中项的值 | 以为英文没有选中 |
| `.selectedOptions` | 全部当前选中项 | 只读取第一项而漏掉其他值 |
| `option.selected` | 某个选项当前是否选中 | 把源码 `selected` 当当前状态 |

### 4. 多选操作依赖平台和输入方式

原生多选界面受操作系统和浏览器影响。桌面环境常用按住 Command（macOS）或 Ctrl（Windows）再点击来切换不连续选项，Shift 可用于连续选择。键盘、触控及辅助技术的具体操作不能只凭一个平台推定。

提供操作说明时，应同时保留可见标签和选择目的；不能只写“按住 Ctrl 多选”而假设所有用户都使用同一种设备。文件选择、列表多选和单选组的方向键行为也各不相同，应按控件类型分别观察。

::: tip 多选不等于“多个同名控件”
`select multiple` 是一个控件内部的多个选中项；多个同名单选框则是一组控件。两者都可能产生多个同名条目，但交互方式和代码结构不同，不能互相替代。
:::

## 三、textarea 的初始内容与输入区域

### 1. 初始文字写在标签之间

`textarea` 有开始标签和结束标签，初始文字写在两者之间。下面是局部内容：

```html
<label for="note">说明</label>
<textarea id="note" name="note" rows="3" cols="24">第一行初稿
第二行初稿</textarea>
```

与文本 `input` 不同，`textarea value="初稿"` 不是设置初始内容的合法写法。用户编辑后，读取 `.value` 才能得到当前文本；不要只检查标签之间的原始文字来判断用户现在输入了什么。

### 2. 换行与空白由内容和解析规则共同决定

文本域保留实际输入的换行。窗口太窄而产生的视觉折行，与用户按 Enter 写入的换行不是一回事；不能按屏幕上显示了几行来推算文本中有几个换行字符。通过 `.value` 读取时，换行使用 `\n`。

源码缩进也可能成为初始内容。HTML 解析会忽略紧跟 `textarea` 开始标签的一个换行，但不会替作者清除后面的所有空白；需要精确初稿时，按上例直接排列文字。若要显示 `<p>文字</p>` 这样的代码文本，可在文本域中写 `&lt;p&gt;文字&lt;/p&gt;`，而不是期待其中的标签形成正文段落。

空白与字符引用的基础规则见 [HTML 注释、空白与字符引用](../01-foundation/07-comments-whitespace-references.md)，`textarea` 的定义见 [HTML：textarea](https://html.spec.whatwg.org/multipage/form-elements.html#the-textarea-element)。

### 3. rows 与 cols 不是输入长度限制

`rows` 表达期望显示的行数，`cols` 表达期望的行宽，两者使用正整数。它们用于输入区域的尺寸提示，不分别表示“最多输入几行”和“最多输入几个字符”。字体、浏览器及 CSS 仍会影响最终区域大小。

上述 `rows="3" cols="24"` 的文本域仍可输入第四行，也可输入长于 24 个字符的一行。内容超出可见区域时，需要滚动或出现视觉折行。长度与必填等约束由第 5 章校验主题负责，不能靠缩小区域来限制数据。

::: warning rows 和 cols 只影响显示区域
把 `rows="2"` 当成“最多两行”、把 `cols="20"` 当成“最多二十字”，会让作者误以为已经限制了输入。真正的内容长度限制需要校验规则，且服务端仍需重新检查。
:::

## 四、固定候选还是自由输入

### 1. 按候选范围选择控件

如果用户只能从已知候选中选择，使用 `select`；如果用户需要输入一段没有固定候选的文字，使用 `textarea`；如果候选只是建议、仍允许自由输入，应使用第 5 章的 `datalist`，而不是强行把 `select` 改成可输入控件。

| 内容需求 | 考虑使用 | 原因 |
|----------|----------|------|
| 从固定地区中选择一个 | `select` | 候选项有限，选择结果可枚举 |
| 从固定语言中选多个 | `select multiple` | 同一个控件内允许多选 |
| 写一段多行说明 | `textarea` | 保留自由文字和用户换行 |
| 输入时给出建议但允许新值 | `datalist`（第 5 章） | 建议不限制最终输入 |
| 只显示不可修改的结果 | 普通文字，或只读控件 | 不需要让用户误以为可以编辑 |

### 2. 不要把外观当成控件职责

把 `select` 的 `size` 调大，不会让它变成多行文本输入；给 `textarea` 加样式，也不会让它的内容变成固定候选。控件的职责由元素和属性决定，CSS 只改变呈现。

同样，不能因为想要一个“看起来像下拉框”的界面，就把一组链接或 `div` 拼成选择控件。原生控件提供键盘操作、选中状态和表单数据构造，这些行为不会由外观自动获得。

## 五、从空目录观察选择与文本

### 1. 创建独立页面

新建空目录 `html-choices`，在其中创建 `choices.html`，以 UTF-8 保存以下完整内容。页面只比较三个控件，无脚本、样式、外部资源或服务依赖。

::: details 查看 choices.html 完整内容

```html [choices.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>选择与文本观察</title>
</head>
<body>
  <h1>选择与文本观察</h1>
  <form>
    <p><label for="region">区域</label></p>
    <select id="region" name="region">
      <optgroup label="方向">
        <option value="north">北部</option>
        <option value="south" selected>南部</option>
      </optgroup>
      <optgroup label="其他">
        <option>未分类</option>
      </optgroup>
    </select>
    <p><label for="languages">可阅读的语言（可多选）</label></p>
    <select id="languages" name="language" multiple size="3">
      <option value="zh" selected>中文</option>
      <option value="en">英文</option>
      <option value="fr">法文</option>
    </select>
    <p><label for="note">多行说明</label></p>
    <textarea id="note" name="note" rows="3" cols="24">第一行初稿
第二行初稿</textarea>
  </form>
</body>
</html>
```

:::

双击打开文件。区域初始为“南部”，语言初始选中中文，文本域显示两行初稿。点击“多行说明”标签，输入焦点应进入对应文本域；按 Tab 也能依页面顺序在这些控件之间移动。

### 2. 核对当前值与全部选中项

打开浏览器开发者工具的 Console，执行下面的只读表达式。它读取区域当前值，不提交表单，也不修改内容：

```js
document.getElementById('region').value
```

初始结果是 `south`。选择“北部”后结果是 `north`；选择“未分类”后结果是 `未分类`，因为该选项没有声明 `value`。

在语言控件保留中文，再用当前系统支持的多选方式增加英文。下面两个表达式分别读取单个值和全部值；第二个表达式把每个选中 `option` 的 `.value` 取出，返回一个值数组，不改变选择：

```js
document.getElementById('languages').value
Array.from(document.getElementById('languages').selectedOptions,
  option => option.value)
```

此时分别得到 `zh` 与 `['zh', 'en']`。如果只看第一行，会误以为英文没有选中。键盘观察可以先选中文，再按住 Shift 按向下方向键，观察连续选择是否增加英文；具体快捷键按当前平台核对。

在文本域中改成三行文字，再读取 `document.getElementById('note').value`。结果包含新输入的内容与换行，而不是始终返回两行初稿。继续输入超过三行、并让其中一行超过 24 个字符，可以确认 `rows`、`cols` 没有限制内容长度。

| 观察项 | 操作或表达式 | 预期结果 |
|--------|--------------|----------|
| 区域初始值 | `.value` | `south` |
| 选择“北部” | `.value` | `north` |
| 选择无 value 的选项 | `.value` | `未分类` |
| 多选单值 | `.value` | `zh`，只是首个选中项 |
| 多选全部值 | `selectedOptions` | 包含 `zh`、`en` |
| 文本域当前文本 | `.value` | 用户编辑后的文字与换行 |

### 3. 修复错误的文本域初始值

先保留正确文件，再把其中的整个 `textarea` 临时换为下列局部错误标记：

```html
<!-- 错误示例：textarea 不用 value 属性设置初始文字 -->
<textarea id="note" name="note" rows="3" cols="24"
          value="第一行初稿"></textarea>
```

刷新后文本域没有这份初稿，`.value` 为空字符串；浏览器不会把未知的内容属性自动当成这个控件的初始文本。将错误文件上传到 [Nu HTML Checker](https://validator.w3.org/nu/)，可定位到 `textarea` 上不允许的 `value` 属性。

修复时删除这个属性，并把两行初稿恢复到开始标签与结束标签之间，再刷新、读取当前值并复检。若多选未生效，检查的是 `select` 是否确实声明 `multiple`，以及平台操作是否只替换了原选择；不能通过给多个选项写 `selected` 来代替用户多选机制。

| 注入的问题 | 观察 | 恢复 |
|------------|------|------|
| 给 `textarea` 写 `value` 属性 | 初始文本为空，Nu 报告不允许的属性 | 删除属性，文字放标签之间 |
| 单选 `select` 给多个 `option` 写 `selected` | 实际只保留一个选中项，源码意图不明确 | 只保留一个默认选项 |
| `multiple="false"` | 仍然是多选 | 删除整个布尔属性 |
| 用 `size` 控制可选数量 | 可选数量不变，只影响显示区域 | 多选用 `multiple`，长度另设校验 |
| 用 `.value` 读取多选全部值 | 只得到首个选中项 | 读取 `selectedOptions` |

### 4. 验证记录

以上独立文件于 2026-11-14 在 macOS 的 Chrome 157.0.8103.79 中实测：区域文字与值、无 `value` 的文本取值、多选集合与单个 `.value`、标签焦点、键盘连续选择、文本域换行及超出显示行列后的内容均已核对。正常文档与恢复后的文档经 Nu 检查无错误、无警告，错误的 `textarea value` 报告对应属性错误。

本次重写只补充正文层次、注释和观察项，`choices.html` 的结构、属性与预期值未变；这里未验证触控、真实屏幕阅读器、其他浏览器及提交编码。
