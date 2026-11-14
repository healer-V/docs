---
title: "文档模板 template"
tags:
  - HTML
  - template
  - 文档片段
excerpt: "解释 template 的惰性内容与 DocumentFragment，使用独立 HTML 和脚本完成深克隆、文本填充和节点插入，并对照实例独立、浅克隆、片段移动与重复 ID 的边界。"
date: 2026-11-14
---

# 文档模板 template

`template` 用来预先声明暂不显示的 HTML 片段。浏览器会解析其中的标记并保存节点，但不会把这些节点直接显示在页面中；需要使用时，脚本可以复制片段、填入文字，再把副本插入文档。

理解它需要分清三个对象：页面中的 **`template` 元素**、该元素关联的 **`content` 文档片段**，以及后来插入页面的**实例节点**。实例不是模板内容的实时映射，修改一个实例不会自动同步到另一个实例或原模板。

下面先说明模板的惰性内容，再解释 `content` 的查询范围，最后用独立文件完成克隆、填充和插入。

::: info 本篇的范围
本篇讲 `template`、`content`、`DocumentFragment` 以及一次完整的最小生成流程。标签结构见[标签与元素](../01-foundation/02-tags-elements.md)，文档头部与脚本接入见[文档头部与资源引用](../01-foundation/09-head-resources.md)。自定义元素、Shadow DOM、`slot`、框架模板和组件系统不在本篇展开；完整 DOM 编程归 JavaScript 主题。
:::

## 一、模板声明与惰性内容

### 1. template 声明一份暂不显示的片段

下面是可放在普通文档 `body` 中的局部标记，开始标签与结束标签都要保留：

```html
<template id="label-template">
  <p class="label">标签：<span class="label-text">占位文字</span></p>
</template>
```

这段代码声明了一个段落结构，但单独放进页面不会出现“标签：占位文字”。模板内容仍会被解析，节点会保存在与元素关联的文档片段中，只是尚未作为普通页面内容参与显示。

### 2. 惰性内容不等于纯文本

这里的**惰性**表示内容已被解析并保存，尚未作为普通页面内容参与显示；其中的脚本也不会仅因解析模板而执行。它不是一段等到使用时才解析的纯文本，更不会自己替换占位文字或循环生成内容。

[HTML 标准：template](https://html.spec.whatwg.org/multipage/scripting.html#the-template-element)定义了这种行为。

### 3. template 与 hidden 的区别

普通的 `<p hidden>隐藏文字</p>` 已经是当前文档中的段落，只是处于隐藏状态，普通文档查询仍能找到它。模板中的段落则保存在单独片段里，普通文档查询不会进入这个片段。

若需求只是让现有段落暂时隐藏，选择 `hidden`；若需要保留一个结构，随后复制出独立节点，`template` 才提供了相应的内容容器。

| 写法 | 节点在哪里 | 是否显示 | 普通文档查询能否找到内部节点 |
|------|------------|----------|------------------------------|
| `<p hidden>` | 当前文档树 | 不显示 | 能 |
| `<template><p>…</p></template>` | 关联的文档片段 | 不显示 | 不能，需要经过 `content` |

### 4. 版本归属与现行用法

普通 `template` 已包含在 [2014 年 HTML5 推荐标准](https://www.w3.org/TR/2014/REC-html5-20141028/scripting-1.html#the-template-element)中。这里按现行 HTML Living Standard 讲解这种片段用途；不能把当前标准中的所有模板扩展都当作 2014 年的新增内容。

## 二、content 与节点查询范围

### 1. 文档片段保存模板内部节点

浏览器中的 **DOM** 是由元素、文字等节点组成的文档结构，脚本可以查找和修改这些节点。`template.content` 返回一个 `DocumentFragment`，即**文档片段**：它可以容纳一组节点，却不是页面中的普通容器元素，也不会在显示结果中生成一个同名标签。

虽然源码看起来把 `p` 写在 `template` 标签之间，解析后的 `p` 并不是 `template` 元素的普通子节点，而是 `content` 的子节点。因此，读取模板内容要经过 `content`，不能把它当作普通 `div` 查询。

文档片段的基本模型见 [MDN：DocumentFragment](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment)。

### 2. querySelector 只在指定范围内查找

`querySelector` 返回指定范围内第一个匹配选择器的元素，找不到时返回 `null`。选择器中的 `#label-template` 按 `id` 查找，`.label-text` 按 `class` 查找；后者适合在每个片段内部重复使用。

以下是局部脚本，前提是页面已有前面的模板，且没有插入实例：

```js
const template = document.querySelector("#label-template");
document.querySelector(".label-text");          // null
template.querySelector(".label-text");         // null
template.content.querySelector(".label-text"); // 返回模板中的 span
```

`const` 为查到的元素引用起名，`.` 用来读取属性或调用方法，括号中的字符串是查询条件。前两种查询不会进入模板的 `content`；最后一种从文档片段开始查找，所以能得到 `span`。

### 3. 已插入的副本会进入普通文档查询

一旦副本已经插入页面，普通文档查询才可能找到那个副本，此时不能把查询到的实例误认成仍在模板里的节点。反过来，模板元素自身的 `childElementCount` 通常为 0，因为它的普通子节点为空；内容在 `content` 中。

这个区别解释了为什么“页面上明明有段落，模板里却查不到”：查询范围不同。

## 三、深克隆、填充与插入

### 1. 创建两个独立文件

::: info JavaScript 前置只到节点操作与按钮回调
需要认识变量保存值或节点引用、方法调用、简单条件判断，以及函数可以作为按钮点击时运行的回调。本例会解释查找节点、改文字、深克隆和插入的核心语句；系统学习入口是 [MDN：DOM 脚本入门](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/DOM_scripting)与[事件入门](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Events)。所有运行文件都在本篇给出，无需使用其他文章的源码。
:::

在自己新建的空目录 `html-template` 中创建 `template.html` 和 `template.js`，均以 UTF-8 保存。页面只生成不同文字的标签段落，用来观察节点，不需要外部数据、样式库、Node.js 或本地服务器。

::: details 查看 template.html 完整内容

```html [template.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>template 片段与实例</title>
  <script src="template.js" defer></script>
</head>
<body>
  <h1>模板片段与实例</h1>
  <p>下方容器只显示已经生成的实例。</p>
  <button id="create" type="button">生成一个实例</button>
  <button id="change-first" type="button">修改第一个实例</button>
  <p id="feedback">实例数量：0</p>
  <div id="instances"></div>
  <template id="label-template">
    <p class="label">标签：<span class="label-text">占位文字</span></p>
  </template>
</body>
</html>
```

:::

`script` 的 `src` 指向同目录的脚本，`defer` 让这个外部经典脚本在文档解析后执行，所以脚本查找按钮和模板时，它们已经存在。脚本接入的基本规则见[文档头部与资源引用](../01-foundation/09-head-resources.md)。

### 2. 脚本完成克隆、填字和插入

::: details 查看 template.js 完整内容

```js [template.js]
const template = document.querySelector("#label-template");
const container = document.querySelector("#instances");
const feedback = document.querySelector("#feedback");
let count = 0;

/** 点击生成按钮时创建一个深克隆实例；无返回值，修改页面及计数。 */
function addInstance() {
  const fragment = template.content.cloneNode(true);
  const text = fragment.querySelector(".label-text");
  count += 1;
  text.textContent = "实例 " + count;
  container.append(fragment);
  feedback.textContent = "实例数量：" + count;
}

/** 修改第一个实例；无返回值，仅改首项文字或显示尚无实例的反馈。 */
function changeFirst() {
  const first = container.querySelector(".label-text");
  if (first === null) {
    feedback.textContent = "尚无实例，请先生成。";
    return;
  }
  first.textContent = "只改第一个";
}

const createButton = document.querySelector("#create");
const changeButton = document.querySelector("#change-first");
createButton.addEventListener("click", addInstance);
changeButton.addEventListener("click", changeFirst);
```

:::

### 3. cloneNode(true) 复制整棵子树

`template.content.cloneNode(true)` 创建一个新的文档片段。参数 `true` 表示**深克隆**，即片段中的段落、`span` 和文字等后代节点也要复制；只复制最外层片段无法得到这些内容。`cloneNode` 返回新节点，不会把原模板中的节点拿走。

[MDN：cloneNode](https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode)说明了参数及复制范围。

### 4. textContent 填入文字，append 插入节点

随后，`fragment.querySelector(".label-text")` 查找的是本次副本内部的 `span`。`count += 1` 把计数加一，`"实例 " + count` 组成要显示的字符串，赋给 `text.textContent` 后替换该 `span` 中的文字。`let` 允许计数变量之后更新；`const` 保存的节点引用仍可用来修改节点内容。

`textContent` 把给定值作为文字，不把它解析成 HTML。例如把生成文字改成 `"<em>甲</em>"`，页面会显示这些尖括号与字符，不会生成 `em` 元素。这正好符合文本填充的目的；如果要改变结构，应明确选择相应的节点操作，不能把文字赋值理解成自动解析标签。依据见 [MDN：textContent](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent)。

最后，`container.append(fragment)` 把片段中的子节点移入目标容器末尾。**移入的是片段的子节点，不是一个可见的 DocumentFragment 包装标签。** 插入完成后，这份副本片段会变空，但 `template.content` 仍保存原内容，可供后续继续克隆。[append](https://developer.mozilla.org/en-US/docs/Web/API/Element/append)与文档片段的插入规则共同决定这个结果。

### 5. 事件监听器让按钮触发函数

文件末尾的 `addEventListener("click", addInstance)` 把函数交给点击事件监听器，等按钮被激活时再调用它。这里传入的是函数本身，没有写成 `addInstance()`，后者会在执行注册语句时立即运行函数。

修改按钮注册另一个回调，只查询目标容器的第一个实例，因此不会改变第二项和模板原文。

## 四、复制与移动的边界

### 1. 浅克隆没有复制后代

把 `template.js` 中的 `cloneNode(true)` 临时改为 `cloneNode()`，保存并重新载入页面。省略参数相当于不深克隆，所以得到的是空文档片段。点击生成后，查询 `.label-text` 返回 `null`，继续给它的 `textContent` 赋值会报错，页面不会出现标签实例。

恢复 `cloneNode(true)` 并重新载入，再点击生成，应重新出现正常段落。问题出在复制范围，不是模板原文消失，也不是为容器补一个 CSS 显示设置就能解决。

### 2. 直接使用原片段会耗空模板

若把创建副本的一行改成下面的局部代码，其他代码保持不变，就没有创建副本：

```js
// 错误对照：变量现在引用原模板片段，随后 append 会把原节点移走。
const fragment = template.content;
```

重新载入后第一次生成仍能显示段落，但同时把原模板中的节点移入了容器，`template.content.childElementCount` 变为 0。第二次再运行同样代码，原片段已经没有 `.label-text`，于是查询得到 `null` 并报错。第一次显示成功不能证明模板仍然可复用。

### 3. 克隆不会自动生成唯一 ID

`cloneNode(true)` 会复制元素属性，包括 `id`。如果给模板中的 `span` 固定写上 `id="label-text"`，连续生成两次后，当前文档会出现两个相同 ID；浏览器不会自动改名。用 `querySelector("#label-text")` 只拿到第一个匹配，也不能据此认为只有一个实例。

本例把 ID 留给页面上的唯一按钮、模板和目标容器，在可重复结构里使用 `.label-text`，并限制在当前片段或容器中查询。若实例确实需要 ID，例如标签关联到各自的输入框，应为每个实例分配不同 ID，并同步更新相关引用。只给 ID 加随机后缀却不更新引用，也没有完成关联修复。

### 4. 实例独立不等于复制运行状态

`cloneNode` 不会复制用 `addEventListener` 注册的监听器；本例把监听器注册在模板外的按钮上，没有依赖这项不存在的复制行为。重复 ID 与监听器边界见 [MDN：cloneNode](https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode)。

实例之间也不共享后来修改的文字。修改第一个实例的 `textContent` 不会影响第二个，更不会改回模板原文；这是副本独立于原片段的直接结果。

::: warning 克隆空模板不能恢复已经移走的内容
先恢复 `const fragment = template.content.cloneNode(true);`，再重新载入 HTML，让浏览器从源码重新建立模板片段，然后重做两次生成。只在已经被耗空的页面上补调用 `cloneNode(true)`，得到的仍是空片段。
:::

## 五、独立运行与证据

### 1. 打开页面并生成实例

保存两个文件后，用 Chrome 直接打开 `template.html`。初始应显示两个按钮和“实例数量：0”，下方没有标签段落。若先点“修改第一个实例”，应显示“尚无实例，请先生成。”，原因是查询返回 `null`，函数在该分支提前结束，没有尝试修改不存在的节点。

点击“生成一个实例”两次，预期依次出现“标签：实例 1”和“标签：实例 2”，数量变为 2。再点“修改第一个实例”，只有首项变为“标签：只改第一个”，第二项仍为“标签：实例 2”。继续生成时出现第三项，说明原模板没有被前两次使用耗空。

### 2. 在 Elements 中核对节点位置

在 Chrome 按 `F12`，macOS 可按 `Option+Command+I`，打开 Elements 面板。展开 `#instances`，生成两次后应看到两个实际的 `p.label`；展开模板时，开发者工具通常用 `#document-fragment` 展示单独保存的内容。

也可以在 Console 执行下面三行，前提是已经生成两个实例，且尚未生成第三个：

```js
document.querySelector("#instances").childElementCount;              // 2
document.querySelector("#label-template").childElementCount;          // 0
document.querySelector("#label-template").content.childElementCount;  // 1
```

第一行是两个已插入段落，第二行说明模板元素没有普通子元素，第三行是原片段中的一个段落。这里使用 `childElementCount` 只计算元素，不把格式缩进产生的空白文本节点混入数量。

| 观察项 | 表达式或操作 | 预期结果 |
|--------|--------------|----------|
| 已生成实例数 | `#instances` 的 `childElementCount` | 生成两次后为 `2` |
| 模板的普通子元素 | `template` 的 `childElementCount` | `0` |
| 模板片段内容 | `template.content` 的 `childElementCount` | `1` |
| 修改首项 | 点击修改按钮 | 只有第一个实例文字变化 |
| 继续生成 | 再点生成 | 仍能出现新实例，原模板未被耗空 |

### 3. 复现浅克隆与片段移动错误

先备份正常文件，再分别做两组错误对照，每次只改一处并重新载入：

1. 把 `cloneNode(true)` 改为 `cloneNode()`。生成时查询 `.label-text` 得到 `null`，给它的 `textContent` 赋值会报错，页面没有新实例。恢复深克隆后重新载入，生成恢复正常。
2. 把创建副本的行改成 `const fragment = template.content;`。第一次生成后模板片段被移空，第二次查询得到 `null` 并报错。恢复 `cloneNode(true)`，重新载入后确认模板仍含一个段落。

| 注入的问题 | 观察 | 恢复 |
|------------|------|------|
| `cloneNode()` 浅克隆 | 副本为空，查询 `.label-text` 返回 `null` | 改为 `cloneNode(true)` 并重新载入 |
| 直接使用 `template.content` | 第一次后模板被移空，第二次失败 | 每次先 `cloneNode(true)` |
| 在模板中固定写 `id` | 多个实例出现重复 ID | 改用 class，或在插入时分配唯一 ID |
| 期望 `textContent` 解析标签 | 尖括号作为文字显示 | 需要新结构时改用节点创建或插入 |
| 在已耗空页面上补克隆 | 仍得到空片段 | 重新载入 HTML，从源码重建模板 |

若按钮没有反应，先检查 `template.js` 是否与 HTML 同目录、文件名及 `src` 是否一致，并确认浏览器允许 JavaScript 执行。打开开发者工具的 Console 查看脚本读取或运行错误；修改后重新载入 HTML，再从零实例开始核对。

### 4. 验证记录

以上两个完整文件于 2026-11-14 在 macOS 的 Chrome 157.0.8103.79 中实际运行。下表把代码规则对应到本次观察结果：

| 对照 | 实测结果 |
|------|----------|
| 初始页面 | 容器中有 0 个实例，模板片段中保留 1 个段落，普通文档查询找不到模板内部的 `span` |
| 深克隆后生成两次 | 容器中有 2 个不同节点，分别显示“实例 1”和“实例 2” |
| 修改第一项并继续生成 | 第二项及模板原文不变，仍能生成第三项 |
| 用 `textContent` 写入带标签的字符串 | 尖括号作为文字显示，没有生成 `em` 元素 |
| 浅克隆与直接移动原片段 | 前者得到空副本；后者第一次后耗空模板，第二次失败；恢复代码并重新载入后均可正常生成两项 |
| 固定 ID 的克隆对照 | 插入后得到两个同 ID 节点；移除固定 ID 并重新载入后恢复正常 |

本次使用官方本地 Nu HTML Checker **26.11.9（0f0f1f9）** 检查 `template.html`，结果是无错误、无警告。临时删除 `</template>` 后，得到 2 个错误，涉及模板未闭合及文档结束时仍有开放元素；补回结束标签后重新检查，无错误、无警告。

需要自行复核时，可使用 [Nu 在线检查器](https://validator.w3.org/nu/)上传 HTML，也可按[官方本地工具说明](https://validator.github.io/validator/)选择独立程序检查文件。浏览器中观察模板功能不依赖安装这个可选检查工具。

本次重写只补充正文层次、注释和观察项，`template.html`、`template.js` 的结构与实测条件未变。Nu 检查的是提供给它的标记，不会运行这里的 JavaScript；浅克隆、查询范围错误和运行时生成的重复 ID，仍需结合 Console、Elements 与实际节点观察。当前验证没有覆盖其他浏览器、组件系统或更复杂的模板扩展。
