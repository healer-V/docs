---
title: "input 基本输入控件"
tags:
  - HTML
  - input
  - 文件选择
excerpt: "解释 input 的基本类型，区分文本、密码、隐藏字段、单选、复选和文件选择，说明 name、value 与选中状态的关系，并用独立文件核对类型回退、单选分组及文件路径边界。"
date: 2026-11-14
---

# input 基本输入控件

`input` 根据 `type` 提供不同的输入方式：文本框接收文字，单选框和复选框表达选择，文件框让用户指定本地文件。选择类型时要先确定数据的含义，而不是只挑一个看起来合适的外观。

同样的 `value` 写在不同类型上，职责并不完全相同。文本框显示可编辑的文字，单选和复选框则用它标识选项；文件框保存的是用户选择的文件列表，不能由作者预先指定任意本地路径。

下面按类型、文本类控件、选择类控件和文件选择分组，最后用独立文件核对值、状态与错误回退。

::: info 本篇的范围
本篇讲 `input` 的基础类型。按钮类型的提交、重置行为见[按钮与控件状态](./04-buttons-control-state.md)；字段如何进入请求见[表单提交与数据编码](./05-submission-encoding.md)；`email`、`number`、日期、范围、颜色等增强类型归第 5 章；标签关联与分组见[表单结构与控件标签](./01-form-structure-labels.md)。
:::

## 一、type 决定控件形态与规则

### 1. input 是空元素，type 选择状态

`input` 是空元素，没有 `</input>`，类型写在开始标签的 `type` 属性中。下面是可放进 `body` 的局部片段；两项都提供单行文本输入：

```html
<p><label>普通文本：<input type="text" name="plain_text"></label></p>
<p><label>默认类型：<input name="default_text"></label></p>
```

省略 `type` 时，默认使用 `text`。两种写法都创建文本输入框，但显式写出类型更能说明作者意图，也便于阅读和检查。

### 2. 无效 type 会回退，但仍是作者错误

属性值无效时浏览器也按文本状态处理，但这种回退不意味着拼错的类型符合标准。例如，`type="textt"` 仍能显示文本框，作者应修正拼写，而不是据外观认定配置有效。

```html
<!-- 错误示例：无效类型被浏览器回退为文本，但源码仍然错误 -->
<input type="textt" name="plain_text">
```

检查时要把“浏览器当前显示了什么”和“源码声明了什么”分开。Nu 等检查器会发现无效类型，浏览器则可能为了让页面继续工作而采用回退行为。依据见 [input 的 type 状态](https://html.spec.whatwg.org/multipage/input.html#attr-input-type)。

### 3. name 与 label 不能互相替代

`name` 为控件的数据命名；可见说明使用关联的 `label`。把 `name="plain_text"` 写好，不会在页面上显示“普通文本”，也不会自动建立标签关系；反过来，标签文字也不会成为提交字段名。

标签、唯一 id 与分组结构见[表单结构与控件标签](./01-form-structure-labels.md)。这里使用基础类型说明填写行为；不能从“页面上可操作”直接推断“已经发送了数据”。

## 二、文本、密码与隐藏字段

### 1. text 接收单行文字

`type="text"` 用于一般单行文本，例如名称或简短说明；需要多行文字时应使用 `textarea`。`value` 可以提供文本的初始内容，用户编辑后控件具有相应的当前值。

初始值、当前值和重置的区别由[按钮与控件状态](./04-buttons-control-state.md)展开。这里只需记住：源码中的 `value="..."` 是默认声明，用户在页面里输入的文字才是当前值。

### 2. password 只遮挡显示，不加密

`type="password"` 同样接收文字，但通常以圆点等符号遮挡显示，适合降低旁观者直接看见输入内容的机会。下面只是局部的非敏感演示，不要填写真实密码：

```html
<label>演示口令：<input type="password" name="demo_secret"></label>
```

遮挡属于显示处理，不是加密。控件的当前文字仍能被本页脚本读取，也能在开发者工具中查看；是否通过加密连接传输，取决于 HTTPS 等传输条件。不能因为选了密码类型，就把普通 HTTP 当作加密通道。

文本与密码状态的规则见 [HTML input 定义](https://html.spec.whatwg.org/multipage/input.html#text-(type=text)-state-and-search-state-(type=search))与[密码状态](https://html.spec.whatwg.org/multipage/input.html#password-state-(type=password))。

### 3. hidden 声明没有可见界面的数据

`type="hidden"` 声明一个不提供可见填写界面的控件，适合携带页面已知的数据。例如，以下局部字段标记内容版本：

```html
<input type="hidden" name="document_version" value="draft-1">
```

它不是“把一个普通输入框缩小”，也不会正常进入 Tab 填写路径。隐藏输入不属于可由 `label` 关联的控件，不能借给它增加标签来提供可见填写入口。定义见 [Hidden 状态](https://html.spec.whatwg.org/multipage/input.html#hidden-state-(type=hidden))。

### 4. 三种文本类控件的可见性不同

| 类型 | 有可见输入界面 | 普通 Tab 可到达 | 值的用途 |
|------|----------------|-----------------|----------|
| `text` | 是 | 是 | 用户可见、可编辑的单行文字 |
| `password` | 是，字符被遮挡 | 是 | 用户输入的文字，显示被遮挡 |
| `hidden` | 否 | 否 | 页面预置、随表单发送的数据 |

可见性、可编辑性和保密性不是同一件事。密码框可见但遮挡，隐藏字段不可见但仍存在于文档中；两者都不能作为服务器信任数据的依据。

::: warning 隐藏与遮挡都不提供保密保证
`hidden` 的属性和值仍在页面中，使用开发者工具就能查看或修改。服务器不能仅凭字段隐藏就信任其值；密码框也只遮挡显示，不能据此认定文字不可读取或传输已加密。
:::

## 三、单选与复选表达不同选择关系

### 1. radio 的共同 name 建立互斥组

单选框用于一组选项中至多选一项。普通结构下，同一文档树内、属于同一个表单且 `name` 相同的 radio 构成一组；没有所属表单的 radio 也能按同树、同名等条件成组。`name` 应为非空值，不能只把控件放在同一个边框内就期待互斥。

以下是某个表单内的局部控件组。两个控件的 `name` 相同，`value` 则区分选择结果：

```html
<fieldset>
  <legend>显示密度</legend>
  <p><label><input type="radio" name="density" value="compact" checked>紧凑</label></p>
  <p><label><input type="radio" name="density" value="spacious">宽松</label></p>
</fieldset>
```

`checked` 在这里声明初始选中的选项；用户选“宽松”后，“紧凑”会取消选中。`fieldset` 与 `legend` 表达共同问题，`name` 建立单选组，`value` 标识具体选项，这三项职责不能混为一谈。

不同表单中相同的 `name` 不会因此形成同一组。反过来，把同一问题的两个选项误写成不同 `name`，浏览器就不会把它们作为这一个互斥组。完整分组条件见 [Radio Button 状态](https://html.spec.whatwg.org/multipage/input.html#radio-button-state-(type=radio))。

### 2. checked 只声明初始状态

`checked` 是布尔属性，声明页面初始化时的选中状态，不表示用户现在一定仍选中它。用户切换到另一项后，源码里的 `checked` 不会被浏览器删除。

读取当前状态应看 `.checked`，而不是只看 Elements 中的属性。重置时，控件会回到默认声明；用户修改与默认声明的两层关系由[按钮与控件状态](./04-buttons-control-state.md)说明。

### 3. checkbox 保持各自的勾选状态

复选框适合独立开关或允许多选的候选项。相同 `name` 的多个复选框仍然可以同时勾选，不会像 radio 一样自动互斥。下面两项分别表示两种可独立开启的文字功能：

```html
<label><input type="checkbox" name="feature" value="wrap">自动换行</label>
<label><input type="checkbox" name="feature" value="spellcheck">拼写检查</label>
```

复选框的选项值和选中状态是两项信息：上例的 `value="wrap"` 不会在取消勾选后自动变成 `false`。当前是否选中由选中状态表达；数据是否进入提交内容还要按提交规则判断。

### 4. 选择控件应明确写出 value

radio 和 checkbox 应明确写出有意义的 `value`。省略时，它们读到的默认选项值为字符串 `on`，不是标签文字，也不是布尔值 `true`。若同名复选项都省略 value，就无法仅靠这个选项值区分它们分别表示哪种功能。

| 写法 | 选中时提交的数据值 | 问题 |
|------|--------------------|------|
| `value="wrap"` | `wrap` | 可区分具体选项 |
| 省略 `value` | `on` | 多个同名项无法区分 |
| `value="true"` | 字符串 `true` | 看起来像布尔值，实际仍是文本 |

依据见 [Checkbox 状态](https://html.spec.whatwg.org/multipage/input.html#checkbox-state-(type=checkbox))及 [value 的 default/on 模式](https://html.spec.whatwg.org/multipage/input.html#dom-input-value-default-on)。

::: tip 共同 name 表示“同一道选择题”
一组 radio 共用一个 `name`，每个选项用不同 `value` 表示答案；checkbox 即使共用 `name`，也各自独立勾选。先判断“最多选一个”还是“可以多选”，再决定类型和分组方式。
:::

## 四、file 选择文件，尚未上传文件

### 1. 选择入口与 accept 提示

`type="file"` 提供由浏览器和操作系统管理的文件选择入口。没有使用多文件增强属性时，一次选择保留至多一个文件。下面的局部片段用 `accept="text/plain"` 提示选择纯文本文件：

```html
<label>演示文件：<input type="file" name="attachment" accept="text/plain"></label>
```

`text/plain` 是一种 MIME 类型，即描述资源格式的类型标识。`accept` 影响选择器提供的文件类型提示或过滤，不负责验证文件内容，更不保证服务器收到的文件可信。它在 HTML4 中已经存在，不能把整个属性称为 HTML5 新增；后续允许的写法扩展和多文件选择由第 5 章展开。

历史依据见 [HTML4 的 accept](https://www.w3.org/TR/html401/interact/forms.html#adef-accept)，现行规则见 [File Upload 状态](https://html.spec.whatwg.org/multipage/input.html#file-upload-state-(type=file))。

### 2. 选好文件不等于已经上传

选好文件只更新当前控件中的选择，文件不会仅因文件名显示出来就自动上传。实际发送文件需要表单提交与适合的编码方式；完整流程由[表单提交与数据编码](./05-submission-encoding.md)负责。

文件控件有独立的值模式，不能像文本框那样由作者在 `value` 属性中预设一个本地路径。理解这一点，才能区分“用户选择了文件”和“页面已经取得了文件内容”。

### 3. 文件名、伪路径与真实路径

作者不能在文件框的 `value` 属性中预填一个本地路径，让浏览器自动取得那个文件；该类型的 `value` 属性应省略。用户选好文件后，当前值可以表现为 `C:\fakepath\note.txt`，这段前缀是兼容用的伪路径，即使当前机器不是 Windows，也不代表文件真的存放在那里。

浏览器同时保留选中的文件列表，其中包含文件名、类型及可供后续处理的文件内容。列表的存在不等于向网页公开了完整本地目录；文件名与真实路径不能混为一谈。依据见 [文件名值模式](https://html.spec.whatwg.org/multipage/input.html#dom-input-value-filename)。

### 4. 取消选择不一定清空原值

再次打开选择器后按“取消”，不能普遍推断为“清空了原文件”。浏览器可以把操作解释为保留原选择的关闭，也可以按其界面规则更新为空选择；应检查控件当前实际保留了什么。

取消及重复选择的界面映射由[文件选择器规则](https://html.spec.whatwg.org/multipage/input.html#show-the-picker,-if-applicable)说明。观察时应同时记录文件名和文件数量，不能只凭一次取消操作推断所有平台的行为。

## 五、独立核对类型、选择与值

### 1. 创建 HTML 与演示文件

新建空目录 `html-basic-inputs`。先创建 UTF-8 文本文件 `note.txt`，只放下面一行非敏感内容；它是本篇自备的文件选择材料：

```text [note.txt]
File input demonstration.
```

在同一目录创建 UTF-8 文件 `input-types.html`。各组只用于比较控件本身，没有提交按钮，不连接接收服务，也不依赖其他文章的文件：

::: details 查看 input-types.html 完整内容

```html [input-types.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>基本输入类型观察</title>
</head>
<body>
  <h1>基本输入类型观察</h1>
  <form id="input-form">
    <p><label>默认文本：<input id="default-field" name="plain_text"></label></p>
    <p><label>演示口令：<input id="secret-field" type="password" name="demo_secret"></label></p>
    <input id="version-field" type="hidden" name="document_version" value="draft-1">
    <fieldset>
      <legend>显示密度</legend>
      <p><label><input id="compact" type="radio" name="density" value="compact" checked>紧凑</label></p>
      <p><label><input id="spacious" type="radio" name="density" value="spacious">宽松</label></p>
    </fieldset>
    <fieldset>
      <legend>文字功能</legend>
      <p><label><input id="wrap" type="checkbox" name="feature" value="wrap">自动换行</label></p>
      <p><label><input id="spellcheck" type="checkbox" name="feature" value="spellcheck">拼写检查</label></p>
    </fieldset>
    <p><label>演示文件：<input id="attachment" type="file" name="attachment" accept="text/plain"></label></p>
  </form>
</body>
</html>
```

:::

### 2. 核对文本、隐藏字段与选择状态

双击打开 HTML，向默认文本框输入“短说明”，向演示口令框输入非敏感文字 `demo-only`。口令框应遮挡显示；隐藏字段没有普通输入界面，但在 Elements 中仍能找到 `document_version` 和 `draft-1`。

点击“宽松”，确认“紧凑”不再选中；也可以用 `Tab` 进入单选组后用方向键切换。分别按空格勾选或点击两个复选项，确认它们能同时保留选中状态，且不会因为 `name` 相同就互斥。

需要区分“选项值”和“当前状态”时，可在 Chrome 开发者工具的 Console 逐条输入以下只读表达式。`document.getElementById('…')` 按 id 找到当前元素，句点后的名称读取该元素的一项信息；这些表达式不修改页面，不需要另建脚本：

```js
document.getElementById('secret-field').value
document.getElementById('wrap').value
document.getElementById('wrap').checked
```

按前述操作，第一项可读到 `demo-only`，说明遮挡不等于不可读取；第二项是 `wrap`，第三项是表示当前选中状态的 `true` 或 `false`。

### 3. 选择文件并对照值

点击文件选择按钮，找到当前目录的 `note.txt` 并确认选择，页面应显示相应文件名。再次打开选择器并取消，观察当前文件名是否保留。若尚未选过文件就取消，则仍没有文件；不要把这两个起点混作同一种状态。

最后两项读取文件框的当前值和文件数量：

```js
document.getElementById('attachment').value
document.getElementById('attachment').files.length
```

选择 `note.txt` 后应得到带伪路径的文件名与数量 `1`，没有文件时分别为空字符串和 `0`。文件名的显示只证明当前选择，不证明内容已经发送。

| 观察项 | 表达式或操作 | 预期结果 |
|--------|--------------|----------|
| 密码框当前值 | `.value` | `demo-only`，说明遮挡可被脚本读取 |
| 复选框选项值 | `.value` | `wrap` |
| 复选框当前状态 | `.checked` | `true` 或 `false` |
| 文件框当前值 | `.value` | 未选时为空，选中后有伪路径文件名 |
| 文件数量 | `.files.length` | 未选为 `0`，选中为 `1` |
| 隐藏字段 | Elements | 无可见界面，但属性和值仍在文档中 |

### 4. 分别定位分组错误与类型错误

先把第二个 radio 的 `name="density"` 临时改成 `name="other-density"`，刷新后依次选择两项。两项可以同时选中，说明它们已不属于同一互斥组；恢复共同 `name` 后再试。把边框或标签改得相似，不能修复这个分组条件。

另将正常文件复制为 `invalid.html`，只给默认文本框加上错误的 `type="textt"`。页面仍呈现文本框，因为无效值回退到文本状态；将完整文件上传 [Nu HTML Checker](https://validator.w3.org/nu/)，可定位无效类型。修复时改为合法的 `type="text"`，保存为 `repaired.html`，再打开并复检。

| 注入的问题 | 观察 | 恢复 |
|------------|------|------|
| radio 使用了不同 `name` | 两项可同时选中 | 恢复共同 `name`，核对所属表单 |
| `type="textt"` | 仍显示文本框，Nu 报告无效类型 | 改为 `type="text"` |
| 复选框省略 `value` | 选中值为 `on`，同名项无法区分 | 为每个选项写明确 `value` |
| 给 file 预设 `value` | 不能取得作者指定的本地文件 | 删除该属性，由用户选择 |
| 用 `hidden` 保存敏感值 | 开发者工具可见并可修改 | 不把隐藏字段当安全存储 |

### 5. 验证记录

本例于 2026-11-14 在 macOS 的 Chrome 157.0.8103.79 中核对：默认与错误类型均按文本状态呈现，密码框遮挡显示但当前值可读；单选、复选和错误分组的行为符合上述说明。自动化向文件框设置本篇的 `note.txt` 后，读到伪路径、文件数量 `1` 与对应文件内容；显式清空后值为空、数量为 `0`。正常、故意拼错类型和修复文件分别经 Nu 检查，只有故意错误版本报告无效类型。

原生文件选择器的“取消”未在本次环境中实测，保留为读者按上述步骤手工观察的项目；显式清空的自动验证不代表取消按钮一定清空。本次重写只补充正文层次、注释和观察项，示例文件与实测条件未变；这里也没有执行文件上传、服务器接收、完整原生校验或真实账号处理。
