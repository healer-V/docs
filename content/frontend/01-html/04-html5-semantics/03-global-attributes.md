---
title: "全局属性增强"
tags:
  - HTML
  - 全局属性
  - 自定义数据
  - 可编辑内容
excerpt: "解释 data-* 与 dataset 的名称和字符串映射，区分 hidden 的隐藏状态及较新取值，并对照 contenteditable、spellcheck、draggable 的有效值、默认行为和继承边界。"
date: 2026-11-14
---

# 全局属性增强

全局属性除了标识和分类，还能为元素附加页面自用的数据、隐藏状态、编辑能力或交互提示。`data-*` 保存自定义信息，`hidden` 声明内容当前是否相关，`contenteditable`、`spellcheck` 和 `draggable` 分别参与编辑、拼写检查和拖动行为。

这些属性不能统一理解为“写上就开启、写 false 就关闭”。有些值需要按关键字解释，有些缺失后会参考父元素或浏览器默认行为。判断时应区分源码里的属性值、浏览器读取到的状态，以及用户实际看到的效果。

下面按自定义数据、隐藏状态、编辑提示和拖动声明分组，最后用单文件核对状态。

::: info 本篇的范围
本篇讲 `data-*`/`dataset`、`hidden`、`contenteditable`、`spellcheck` 和 `draggable` 的取值与状态。`id`、`class`、`title` 等基础全局属性见[HTML 全局属性](../01-foundation/06-global-attributes.md)；`lang`/`dir` 见[HTML 字符编码与语言声明](../01-foundation/08-encoding-language.md)；`inputmode` 等表单提示归第 5 章；拖放事件与数据传输归第 7 章。编辑器、富文本清洗和安全存储不在本篇展开。
:::

## 一、data-* 保存页面自用的数据

### 1. 名称与用途

`data-*` 不是一个固定属性名，而是一组以 `data-` 开头的自定义属性。例如，下面是可放在 `body` 中的局部内容：

```html
<p id="data-probe" data-item-id="A-17" data-count="3">数据观察文本</p>
```

`data-item-id` 和 `data-count` 把值附在这个元素上，供当前页面的脚本等使用。它们本身不会把文字改成编号、计算数量，也不会自动产生标签语义。已有标准属性能准确表达需求时，应直接使用对应标准属性；例如 `data-hidden="true"` 不能代替 `hidden`。

名称必须在 `data-` 后至少还有一个字符，并符合属性名称规则；自定义数据属性的名称不含 ASCII 大写字母。普通 HTML 源码的属性名会被解析器转为 ASCII 小写，所以 `data-itemId` 不会替作者保留这个大写 `I`。建议采用 `data-item-id` 这样的明确写法，避免与脚本中的名称映射混淆。

完整限制见 [HTML：自定义数据属性](https://html.spec.whatwg.org/multipage/dom.html#embedding-custom-non-visible-data-with-the-data-*-attributes)。

### 2. dataset 映射名称

元素的 `dataset` 提供访问这些属性的接口。常见映射会去掉 `data-`，把后面“连字符加 ASCII 小写字母”改成大写字母，因此 `data-item-id` 对应 `dataset.itemId`，`data-count` 对应 `dataset.count`。其他字符不因此全部消失；不能简单地把名称中的所有连字符删掉。

| HTML 属性 | dataset 名称 | 说明 |
|-----------|--------------|------|
| `data-item-id` | `dataset.itemId` | 连字符后的字母转为大写 |
| `data-count` | `dataset.count` | 单个词直接对应 |
| `data-ready` | `dataset.ready` | 名称相同，值仍是字符串 |
| `data-itemId` | 不按作者预期保留大写 | 解析器会把属性名转为小写 |

### 3. dataset 的值始终是字符串

`dataset` 读取的值是字符串：`data-count="3"` 读到的是 `"3"`，`data-ready="false"` 读到的是 `"false"`，不会自动变成数字或布尔值。写入 dataset 的值也按字符串保存；若程序需要计算或判断，应明确转换和解释数据，不能把这些文本直接当成已校验的类型。

接口定义见 [HTML：dataset](https://html.spec.whatwg.org/multipage/dom.html#dom-dataset)与 [MDN：名称转换](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset#name_conversion)。

::: info dataset 观察只需要最小 JavaScript 基础
后面的 Console 表达式使用 `document.querySelector('#data-probe')` 找到具有该 id 的元素，再用句点读取属性；`typeof` 返回值的类型名称。它们只读取数据，不修改页面，也不要求编写函数或事件。需要系统了解变量、选择元素和 DOM 操作时，可使用 [MDN：DOM 脚本入门](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/DOM_scripting)。
:::

### 4. 自定义数据不是保密存储

这里的“页面自用”说明数据的约定范围，不表示保密。属性仍可在开发者工具中读取；它也不是面向所有外部工具的通用元数据格式。需要服务器信任的数据不能只放在 `data-*` 中，页面上显示或隐藏都不能替代服务端校验。

## 二、hidden 的取值与显示状态

### 1. hidden 是枚举属性

现行标准把 `hidden` 定义为枚举属性，即按指定关键字确定状态，而不是普通布尔属性。没有这个属性时处于非隐藏状态；空值及 `hidden` 关键字对应隐藏状态；`until-found` 对应可被查找揭示的隐藏状态。

例如，下面是故意错误的局部写法：

```html
<!-- 错误示例：false 不是 hidden 的有效关键字 -->
<p hidden="false">这段文字仍处于隐藏状态。</p>
```

无效值会回退到隐藏状态，所以这里仍然隐藏。要恢复普通显示，应移除 `hidden` 属性，不能把它的文本改成 `false`。以下对照均假定没有 CSS 覆盖其显示规则：

| 源码声明 | 状态 | 元素 `.hidden` 的读取结果 |
|----------|------|----------------------------|
| 没有 `hidden` 属性 | 非隐藏 | 布尔值 `false` |
| `hidden`、`hidden=""` 或 `hidden="hidden"` | 隐藏 | 布尔值 `true` |
| `hidden="false"` | 无效值回退到隐藏 | 布尔值 `true` |
| `hidden="until-found"` | 隐藏直到被查找等功能揭示 | 字符串 `"until-found"` |

HTML 属性里的字符串与脚本接口返回的布尔值不是同一种写法。规则见 [HTML：hidden 状态及接口](https://html.spec.whatwg.org/multipage/interaction.html#the-hidden-attribute)。

### 2. until-found 保留查找与片段导航入口

普通隐藏内容不呈现给当前用户；`hidden="until-found"` 则允许支持它的浏览器通过页面查找或片段导航发现其中的内容。浏览器准备定位匹配目标时会移除相应 `hidden` 属性，再显示并滚动到内容，不需要作者先编写一套展开事件。

它和普通隐藏的布局表现也不同。支持环境通常用 `content-visibility: hidden` 隐去内部内容，元素本身仍可能保留边框、内边距和布局盒；不能把它等同于整块 `display: none`。为了能被查找揭示，元素还必须具有适合的布局约束；把它改为 `display: none`、`contents` 或普通 `inline` 会破坏这条观察链路。

完整条件见 [HTML：Hidden Until Found](https://html.spec.whatwg.org/multipage/interaction.html#the-hidden-attribute)。

`until-found` 是较新的标准状态，不属于 2014 年 HTML5 已有的 `hidden` 布尔属性定义。历史对照见 [HTML5 2014：hidden](https://www.w3.org/TR/2014/REC-html5-20141028/editing.html#the-hidden-attribute)；实际使用仍应核对当前目标浏览器，而不是由“支持 hidden”推出“支持所有 hidden 取值”。

### 3. hidden 不等于删除或权限控制

内容仍在文档中，脚本等行为不会仅因隐藏而全部停止，作者样式也可能覆盖隐藏显示。应避免把必须对用户保密的内容仅靠 `hidden` 藏起来；需要揭示时用有效状态或移除属性，不能只按画面是否消失判断源码。

::: warning hidden 不会删除内容，也不是权限控制
隐藏只是在当前呈现中不显示内容。DOM 查询、页面源码和开发者工具仍可能取得它；把敏感数据写进隐藏区域，与把它写进普通区域一样需要服务端保护。
:::

## 三、编辑能力与拼写提示

### 1. contenteditable 的有效值与继承

`contenteditable="true"` 或空值允许用户编辑元素内容；`contenteditable="false"` 明确禁止该区域编辑。缺失或无效值进入继承状态，按父元素的编辑状态判断，并不一律等于不可编辑。

下面是 `body` 中的局部结构。外层可以编辑，未另行声明的子段落随之可编辑，而显式写 `false` 的短语不开放编辑：

```html
<div contenteditable="true">
  <p>继承外层编辑能力的短句。</p>
  <p><span contenteditable="false">固定词条</span>，其余文字可编辑。</p>
</div>
```

| 声明 | 当前元素的编辑状态 | 子元素未声明时 |
|------|--------------------|----------------|
| `contenteditable="true"` | 可编辑 | 继承为可编辑 |
| `contenteditable=""` | 可编辑 | 继承为可编辑 |
| `contenteditable="false"` | 不可编辑 | 继承为不可编辑 |
| 缺失或无效值 | 继承父元素 | 继续按父元素状态判断 |

### 2. plaintext-only 限制为纯文本编辑

`contenteditable="plaintext-only"` 允许编辑纯文本，关闭富文本格式编辑。例如从其他应用粘贴带格式文字时，不应保留相应的富文本格式；它不是为整个区域附加 HTML 源码编辑器。

这个取值属于后续演进，不能当作 [2014 年 HTML5 的基础取值](https://www.w3.org/TR/2014/REC-html5-20141028/editing.html#attr-contenteditable)；当前定义见 [HTML：contenteditable](https://html.spec.whatwg.org/multipage/interaction.html#attr-contenteditable)。

### 3. 读取自身声明与继承结果

元素的 `.contentEditable` 可以读到自身声明的状态字符串，`.isContentEditable` 则表示该元素当前是否可编辑。一个未写属性的子元素，前者可以是 `"inherit"`，后者仍为 `true`；只看自身有没有 `contenteditable` 会漏掉继承结果。

### 4. 可编辑不等于已经保存

`contenteditable` 让当前文档中的内容可编辑，没有自动把它写回 HTML 文件、服务器或表单字段的含义。这里没有保存程序，重新加载文件会恢复文件中的原始文字；需要接收多行表单数据时，应先按需求使用 `textarea`，而不是假定任意可编辑区域都会作为字段提交。

::: warning 可以编辑不等于内容已经保存
编辑只改变当前页面中的 DOM。没有脚本发送、服务器接收或持久化时，刷新会丢失修改；把可编辑区域放进 `form` 也不会自动成为可提交字段。
:::

## 四、spellcheck 与 draggable

### 1. spellcheck 声明检查偏好

`spellcheck="true"` 请求允许拼写和语法检查，`spellcheck="false"` 请求关闭，空值对应开启状态。缺失或无效值进入默认状态：它会结合元素类型、浏览器默认行为和祖先的声明判断，不能概括为所有元素都默认开启，也不能等同于 contenteditable 的继承规则。

下面的局部片段可编辑，但不请求拼写检查。把 `spellcheck` 改成 `true` 只改变检查声明，不会替文字自动纠错，也不会把不可编辑的普通段落变成编辑器：

```html
<p contenteditable="true" spellcheck="false">可以输入的短句。</p>
```

是否出现拼写下划线还受用户设置、检查语言和浏览器能力影响；`.spellcheck` 的布尔读取结果不保证界面一定显示某条提示。对不适合检查的文本，也不能靠添加属性保证检查发生。声明、默认与用户偏好的区别见 [HTML：拼写和语法检查](https://html.spec.whatwg.org/multipage/interaction.html#spelling-and-grammar-checking)。

### 2. draggable 需要有效关键字

`draggable="true"` 声明元素可以拖动，`draggable="false"` 关闭它自身的拖动能力。缺失或无效值进入 Auto 状态，采用浏览器默认行为；这里的 Auto 是状态名称，不是让作者改写为 `draggable="auto"` 的有效关键字。

因此，不能把 `draggable` 当作可省略值的布尔属性。下面是可放在 `body` 的正确局部标记：

```html
<p draggable="true">可拖动词条</p>
```

`<p draggable>` 的空字符串不是有效许可，通常仍按普通段落的默认规则处理。默认规则也与元素有关：链接、图片等有各自原生行为，不能由一个普通段落的结果推断全部元素。它不会像 contenteditable 那样继承父元素的取值；至于实际拖动时哪个祖先成为来源，需要按拖放机制另行判断。

### 3. 声明拖动不等于实现拖放

仅声明 `draggable="true"` 不会自动建立放置目标、传输自定义数据或保存排序结果。这些需要拖放 API 配合，本篇只观察声明与状态，不展开事件处理。

现行依据见 [HTML：draggable](https://html.spec.whatwg.org/multipage/dnd.html#the-draggable-attribute)，HTML5 时期的写法可参照 [2014 年 HTML5 草案](https://www.w3.org/TR/2014/CR-html5-20140204/editing.html#the-draggable-attribute)。

::: warning draggable 不是布尔属性
`draggable` 缺失时是 Auto，不等同于 `false`；`draggable=""` 也不是 `true`。需要拖动时写 `draggable="true"`，需要明确关闭时写 `draggable="false"`，并分别核对链接、图片等元素的默认行为。
:::

## 五、独立核对属性、编辑与查找

### 1. 创建单文件对照页

新建空目录 `html-attribute-states`，创建 UTF-8 文件 `attribute-states.html`。所有内容都在下面给齐，没有脚本、外部资源或服务依赖；样式只给观察区域增加边框和间距，不覆盖隐藏规则。

::: details 查看 attribute-states.html 完整内容

```html [attribute-states.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>增强属性状态观察</title>
  <style>
    .region { border: 1px solid #777; padding: 8px; margin: 12px 0; }
  </style>
</head>
<body>
  <h1 id="page-title">增强属性状态观察</h1>
  <p id="data-probe" data-item-id="A-17" data-count="3" data-ready="false">数据观察文本</p>
  <p id="visible-probe">没有 hidden 的普通内容。</p>
  <p id="hidden-probe" hidden>普通隐藏内容。</p>
  <p><a href="#find-target">定位可查找内容</a></p>
  <div id="find-area" class="region" hidden="until-found">
    <p id="find-target">朱鹮观测点</p>
  </div>
  <div id="edit-root" class="region" contenteditable="true" spellcheck="false">
    <p id="edit-child">继承编辑能力的短句。</p>
    <p id="edit-fixed" contenteditable="false">固定内容。</p>
    <p id="spell-optin" spellcheck="true">Spelling observation.</p>
  </div>
  <p id="plain-edit" class="region" contenteditable="plaintext-only" spellcheck="false">纯文本初稿。</p>
  <div id="drag-root" class="region" draggable="true">
    可拖动词条
    <p id="drag-child">没有自身拖动声明的子内容。</p>
  </div>
  <p id="no-drag" draggable="false">明确关闭自身拖动的词条。</p>
  <p><a id="default-link" href="#page-title">具有默认行为的链接</a></p>
</body>
</html>
```

:::

用浏览器直接打开文件。普通隐藏段落不显示；可查找区域的内部文字初始不显示，但边框可以保留。编辑区域和纯文本区域能接收输入，固定内容不因此开放编辑；修改后重新加载，不应把恢复初稿误判为保存失败，因为文件没有写回机制。

### 2. 读取 dataset 的映射与类型

Chrome 开发者工具可用 `F12` 打开，macOS 可用 `Option+Command+I`。在 Console 逐条执行以下只读表达式：

```js
document.querySelector('#data-probe').dataset.itemId
document.querySelector('#data-probe').dataset.count
typeof document.querySelector('#data-probe').dataset.count
document.querySelector('#data-probe').dataset.ready
document.querySelector('#data-probe').dataset.itemid
```

前四项依次返回 `"A-17"`、`"3"`、`"string"` 和 `"false"`。最后一项名称写成 `itemid`，读到 `undefined`，表示没有这一项，不能据此认定 HTML 没有保存数据；改回映射名称 `itemId` 后恢复正确读取。

下面另做一次写入对照：**第一行会修改当前 DOM**，与前面的只读检查不同；后两行读取 HTML 属性及结果类型。`getAttribute` 使用完整的 HTML 属性名，不采用 dataset 的名称映射：

```js
document.querySelector('#data-probe').dataset.count = 7
document.querySelector('#data-probe').getAttribute('data-count')
typeof document.querySelector('#data-probe').dataset.count
```

写入的数字被转换为属性字符串，因此后两行分别得到 `"7"` 和 `"string"`。重新加载文件，再读取 `.dataset.count`，会恢复为文件中的 `"3"`；这次赋值只改了当前文档，没有保存到磁盘。

### 3. 比较编辑、拼写与拖动状态

再分别读取 `document.querySelector('#edit-child').contentEditable` 与 `.isContentEditable`，预期得到 `"inherit"` 和 `true`。读取 `#edit-fixed` 的 `.isContentEditable` 得到 `false`。查看 `#edit-child` 和 `#spell-optin` 的 `.spellcheck`，本例声明下分别为 `false` 与 `true`，但本次不据此承诺显示拼写标记。

读取 `#drag-root`、`#drag-child`、`#default-link` 的 `.draggable`，可以比较显式许可、普通子元素的 Auto 与链接的默认行为。这里不需要编写拖放接收程序，也不以某个词条能否落在另一处来检验单个属性。

| 观察项 | 表达式 | 预期结果 |
|--------|--------|----------|
| 子段落自身声明 | `.contentEditable` | `"inherit"` |
| 子段落实际状态 | `.isContentEditable` | `true` |
| 固定内容 | `.isContentEditable` | `false` |
| 外层拼写声明 | `.spellcheck` | `false` |
| 显式允许拖动 | `.draggable` | `true` |
| 普通子元素的 Auto | `.draggable` | 按元素默认行为读取 |

### 4. 查找并揭示 until-found 内容

先重新加载未带片段的原始文件，在 Console 读取 `document.querySelector('#find-area').hidden`。支持当前状态的环境应读到字符串 `"until-found"`；这只是状态检查，还要实际观察揭示行为，不能只凭属性能保存该字符串就认定完整支持。

把焦点返回页面，用浏览器的页面查找，macOS 按 `Command+F`，Windows 常用 `Ctrl+F`，输入 `朱鹮观测点` 并按回车确认匹配。支持的环境应揭示内部文字；再检查 `#find-area`，其 `hidden` 属性已经移除。关闭查找栏，重新打开不带片段的文件并确认它恢复 `until-found` 后，也可点击“定位可查找内容”，独立核对片段导航的揭示路径。

如果浏览器只把它当作普通隐藏内容，不应通过添加 `display: block` 伪装成查找支持。先核对浏览器版本、状态读取以及是否有样式覆盖；不支持时，应提供可直接访问的普通内容或其他明确入口，而不是把必须阅读的信息只放在该区域。

### 5. 制造无效值并恢复

将完整文件复制为 `invalid.html`，把普通隐藏段落改成 `hidden="false"`，把可拖动容器改成空值 `draggable=""`。刷新后前者仍隐藏，后者不再得到显式的拖动许可；读取对应 `.hidden` 与 `.draggable`，不要按字符串的日常含义推断行为。

使用 [Nu HTML Checker](https://validator.github.io/validator/)检查无效属性值；官方提供在线服务及可下载的本地检查器，使用一种可用入口即可。修复时移除普通段落的 `hidden`、恢复 `draggable="true"`，保存为 `repaired.html`，再确认普通段落可见、拖动声明恢复。`until-found` 等较新取值还需区分现行标准、浏览器支持和检查器实现，不能只凭检查器的一条兼容性差异改写标准结论。

| 注入的问题 | 观察 | 恢复 |
|------------|------|------|
| `hidden="false"` | 仍然隐藏，Nu 报告无效值 | 移除 `hidden` 属性 |
| `draggable=""` | 没有得到显式拖动许可，Nu 报告无效值 | 改为 `draggable="true"` |
| 把 `data-item-id` 写成 `data-itemId` | 实际属性名被转为小写，映射不符合预期 | 使用小写连字符名称 |
| 用 `data-hidden="true"` 代替 `hidden` | 只是自定义数据，不产生隐藏状态 | 使用标准 `hidden` 属性 |
| 编辑后直接刷新 | 修改丢失，恢复文件初稿 | 需要保存时另写接收逻辑 |

### 6. 验证记录

本例于 2026-11-14 在 macOS 的 Chrome 157.0.8103.79 自动验证属性映射、字符串读写、隐藏与编辑状态、输入后刷新恢复，以及片段导航揭示；另在原生 Chrome 窗口通过页面查找得到匹配，确认隐藏属性移除并显示文字。Nu 本地版 26.11.9（0f0f1f9）接受正常和修复文件，包括 `until-found` 与 `plaintext-only`；故意错误版本报告 `hidden="false"` 和空值 `draggable` 两项错误。

本次重写只补充正文层次、注释和观察项，`attribute-states.html` 的结构、属性与实测条件未变；这些结果没有验证其他浏览器、系统拼写字典、跨应用富文本粘贴或完整拖放交互，不能从属性读取正常推定这些能力都已完成测试。
