---
title: "文本语义与内容说明元素"
tags:
  - HTML
  - HTML5
  - 文本语义
  - 内容说明
excerpt: "说明 figure 与 figcaption 的整体说明关系，区分 mark、time 和 data 的用途，并用独立短例解释 ruby 注音、bdi 方向隔离和 wbr 可选换行，核对机器可读值及结构错误。"
date: 2026-11-14
---

# 文本语义与内容说明元素

文字除了组成段落，还可以表达“这一段是某份内容的说明”“这个词与检索问题相关”“这段自然语言对应一个明确日期”等关系。相应元素让这些含义进入文档结构，而不是只依赖颜色、字号或读者猜测。

这里的 `figure`、`figcaption`、`mark`、`time`、`data`、`ruby`、`rt`、`rp`、`bdi`、`wbr` 都能在 2014 年 HTML5 正文中找到。历史依据见 [HTML5 的内容分组](https://www.w3.org/TR/2014/REC-html5-20141028/grouping-content.html#the-figure-element)和[文字级语义](https://www.w3.org/TR/2014/REC-html5-20141028/text-level-semantics.html#the-data-element)。这表示它们已进入该版标准，不表示此前从未有过浏览器实现或其他标准实践。

下面按自包含单元、语境标注、机器值、注音和方向/断行分组，最后用两个独立文件核对。

::: info 本篇的范围
本篇讲 `figure`/`figcaption`、`mark`、`time`/`data`、`ruby`/`rt`/`rp`、`bdi` 和 `wbr` 的用途与结构。`em`、`strong`、引用和代码元素见[文本语义与引用](../02-content-elements/02-text-semantics.md)；图片替代文本见[图片](../02-content-elements/05-images.md)；CSS 文本排版、完整国际化和双向文本算法不在本篇展开。
:::

## 一、figure 与 figcaption 组成说明单元

### 1. figure 不只用于图片

`figure` 把一份内容标为可以整体引用的自包含单元，内容可以是图、照片、代码、引文等。这里的“自包含”不等于必须能独立发表为文章：一段代码清单可以在讨论中整体说明，却仍需要周围论述解释用途。

下面是可以放在 `body` 中的局部内容。它展示一行 HTML 代码及其说明，不需要图片素材：

```html
<figure>
  <pre><code>&lt;p id="greeting"&gt;你好&lt;/p&gt;</code></pre>
  <figcaption>清单一：带有元素标识的段落标记。</figcaption>
</figure>
```

代码本身与说明构成一个单元。正文可以引用“清单一”，而不是只说“上面的代码”，这样移动这个单元时，引用含义仍较清楚。普通句子中的小图标只是句子的一部分，不必为了“它是图片”单独包成 `figure`。

### 2. figure 不表示次要内容

`figure` 也不代表“次要内容”。它可以是正文核心材料；与论述主线相关但可分离的旁支信息才更适合考虑 `aside`。定义见 [HTML：figure](https://html.spec.whatwg.org/dev/grouping-content.html#the-figure-element)。

代码文本与预格式内容的基础见[文本语义与引用](../02-content-elements/02-text-semantics.md)。

### 3. figcaption 有父级、位置与数量要求

`figcaption` 说明所属 `figure` 的其余内容。它必须是 `figure` 的直接子元素，并位于这个 `figure` 的开头或末尾；一个 `figure` 最多有一个这样的说明。`figure` 也可以没有 `figcaption`，不能把缺图注一概当成语法错误。

图注内部可以包含段落等流式内容，但这并不使它成为任意位置都可使用的说明段落标签。写在 `figure` 外部的普通文字，可以作为正文说明，却不能因为改名为 `figcaption` 就自动建立正确归属。依据见 [HTML：figcaption](https://html.spec.whatwg.org/dev/grouping-content.html#the-figcaption-element)。

### 4. 图注与 alt 解决不同问题

如果单元里有图片，图注与 `alt` 仍解决不同问题：图注说明整体材料或来源，替代文本提供图片在当前上下文中的等价信息。有图注时仍需按图像用途判断替代文字，不能机械地删除 `alt`。

具体取舍见[图片](../02-content-elements/05-images.md)。

| 声明 | 说明对象 | 是否可见 | 不能替代 |
|------|----------|----------|----------|
| `figcaption` | 整个 `figure` 单元 | 通常可见 | 图片的等价文字 |
| `alt` | 该图片的内容或功能 | 图片不可见时提供 | 材料来源与整体说明 |
| `title` | 补充提示 | 悬停等条件下 | `figcaption` 或 `alt` |

## 二、mark 表示当前语境中的相关标注

### 1. mark 标出与当前语境相关的文字

`mark` 标出因当前语境而值得关注的文字。例如，正在检索“换行”时，命中的句子可以把该词标出。下面是 `body` 中的局部内容：

```html
<p>检索词：换行。</p>
<p>命中说明：段落与<mark>换行</mark>表达不同关系。</p>
```

这段文字被标注，是因为它与检索有关，不是因为作者声称“换行”比其他文字更重要。标记本身不会实现搜索算法；这里手工标出了一个已知命中。

### 2. mark 与 strong、em 的职责不同

`strong` 表达重要性、严肃性或紧迫性，`em` 表达语气强调；`mark` 表达“在当下语境中相关”。不能只因都想让人注意，就把三者当作相同语义。

| 元素 | 表达的关系 | 例子 |
|------|------------|------|
| `mark` | 与当前检索、上下文或关注点相关 | 搜索结果中的命中词 |
| `strong` | 内容重要、严肃或紧迫 | 警告“不要覆盖原文件” |
| `em` | 句子的语气重心发生变化 | “这句话由**我**来读” |

### 3. 背景色不是 mark 的定义

浏览器常用背景色表现 `mark`，但黄色不是它的定义。把普通文字涂成黄色也不自动建立相同标注关系；反过来，改变 `mark` 的颜色不会取消它与当前语境的关联。

元素含义见 [HTML：mark](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-mark-element)。

::: tip 先问“为什么现在标它”
`mark` 的合理理由通常与当前任务有关：搜索命中、引用对照、读者正在核对的词。若理由只是“希望它更醒目”，应回到 `strong`、`em` 或纯样式，避免让语义标签承担视觉强调。
:::

## 三、time 和 data 连接显示文字与机器可读值

### 1. time 声明明确的日期、时间或时长

`time` 表示日期、时间、时区偏移或时长等限定种类的信息。可见文字可以面向读者自然表达，`datetime` 提供符合标准格式的机器可读表示。以下两个局部例子分别表达日期和带偏移的具体时刻：

```html
<p>日期：<time datetime="2026-11-14">2026 年 11 月 14 日</time>。</p>
<p>时刻：<time datetime="2026-11-14T09:30+08:00">当日 09:30（UTC+08:00）</time>。</p>
```

日期采用 `YYYY-MM-DD`；第二个值还包含时间与 `+08:00` 偏移。这些值不是任意日期文本，也必须表示真实存在的日期：`2026-02-30` 即使符合数字排列外观，也不是合法日期。省略偏移的本地日期时间，与确定了偏移的时刻表达不同信息，不能无条件互换。

### 2. 省略 datetime 时内容本身必须是合法机器值

`datetime` 可以省略，但此时元素内部的文本本身必须符合允许的机器格式，而且不能有元素后代。例如 `<time>2026-11-14</time>` 可直接表达日期；`<time>今天</time>` 则不能仅靠相对文字确定合法值。

普通日期展示优先显式提供 `datetime`，避免把任意自然语言误当格式。浏览器不会因为写了 `time` 就自动把文字转换成另一时区、生成日历控件或创建提醒。

### 3. data 为普通内容提供对应值

`data` 把可见内容与一个机器可读值联系起来，`value` 属性必须存在。例如，以下局部内容把名称与约定标识关联：

```html
<p>材料：<data value="A17">纸夹</data>。</p>
```

读者看到“纸夹”，程序可以读到值 `A17`。值的含义由使用方约定；浏览器不会自动知道它对应哪张业务表，也不会因此提交表单、查询数据或把字符串转为数字。日期时间信息已有更专门的 `time`，不必都放进 `data`。

### 4. data 元素与 data-* 属性不是同一机制

`data` **元素**与 `data-*` **自定义属性**不是同一种机制。`data-value="A17"` 可以是一个自定义属性，却不能代替 `data` 元素要求的 `value="A17"`；两种声明不会自动相互映射。

自定义属性的完整规则由[全局属性增强](./03-global-attributes.md)负责。元素依据见 [HTML：data](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-data-element)。

::: warning datetime 不是任意日期字符串
`2026-02-30`、`今天` 或被元素拆开的文本都不能作为合法的机器可读日期。页面仍可能显示这些文字，`time` 也不会因此报错；需要按标准允许的格式书写，并用检查器核对。
:::

## 四、ruby、rt 与 rp 表达注音

### 1. 基本文字、注音与回退括号

`ruby` 把正文与短注释联系起来，常用于东亚文字的读音提示。`rt` 提供注音文本，放在对应基本文字之后；`rp` 提供不支持 ruby 排版的用户代理可显示的括号等回退文字。例如，以下是 `body` 中的局部内容：

```html
<p><ruby>汉字<rp>（</rp><rt>hàn zì</rt><rp>）</rp></ruby></p>
```

“汉字”是基本文字，`hàn zì` 是这一组文字的读音；两个 `rp` 分别紧邻 `rt` 前后。支持相应排版时，浏览器通常把注音排在基本文字旁，隐藏回退括号；没有相应排版时，括号帮助区分正文与注释。

### 2. 注音顺序与语言边界

注音必须与对应文字保持正确顺序，不能把 `rt` 单独扔在段落里，再靠字号和位置猜它注释了谁。逐字注音可以按每个基本字与其 `rt` 依次配对；这里采用整词的一组注音，不展开多层注释排版。

注音是内容标记，不保证屏幕阅读器按某一种顺序、次数或语言读出。若语言影响发音，还需正确声明语言；不能用注音标签代替整份文档的语言声明。现行结构依据见 [ruby](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-ruby-element)、[rt](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-rt-element)与 [rp](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-rp-element)。

## 五、bdi 隔离方向，wbr 提供断行机会

### 1. bdi 防止未知方向文字影响周围排列

阿拉伯文与英文等文字混排时，数字、冒号等字符的显示位置会受到双向文本算法影响。`bdi` 把一段文字与周围文本隔离，适合嵌入方向未知的名称等短文本：

```html
<p dir="ltr">User <bdi lang="ar">إيان</bdi>: 3 posts.</p>
```

`bdi` 没有指定 `dir` 时，按自身内容采用 `auto` 方向，不像普通元素那样直接继承父元素的方向。这里把阿拉伯文名称隔离后，后面的冒号和数字继续按照外层语境排列，避免被名称一起卷入不符合预期的顺序。它不会翻译内容，也不会把阿拉伯文字母强行反转。

普通 `span` 不会仅因围住同样文字就产生这个隔离作用。`bdo` 则用于强制覆盖方向，是另一种需求，并且在 HTML4 中已经存在。语言和方向的基础关系见[HTML 字符编码与语言声明](../01-foundation/08-encoding-language.md)，隔离行为见 [HTML：bdi](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-bdi-element)。

### 2. wbr 允许在指定位置换行

`wbr` 是空元素，表示一个可选的断行机会，适合长标识中允许分开的边界。例如，在允许普通换行的容器内可写：

```html
<p>abcdefgh<wbr>ijklmnop</p>
```

空间足够时，文字可以保持一行；空间不足、该机会可被采用时，浏览器可以在两组字母之间断行。它不像 `br` 那样要求换行，也不会像软连字符那样在断行处自动显示一个连字符。元素本身也不向 `.textContent` 中插入换行字符。

### 3. 断行结果依赖容器与样式

是否出现断行还取决于容器宽度、字体及样式处理。本篇固定 `white-space: normal` 来观察普通断行，不把结果推广到所有 CSS 组合。不要把“宽页面上没有换行”直接判断为 `wbr` 不受支持。

依据见 [HTML：wbr](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-wbr-element)。

## 六、独立检查语义、方向和断行

### 1. 保存内容标注页面

新建空目录 `html-annotations`，创建 UTF-8 文件 `annotations.html`。各组分别观察一种关系，不共享业务状态；代码清单直接写在文件内，无外部图片、样式、脚本或服务依赖。

::: details 查看 annotations.html 完整内容

```html [annotations.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>内容语义观察</title>
</head>
<body>
  <h1>内容语义观察</h1>
  <h2>代码单元与说明</h2>
  <figure id="listing">
    <pre><code>&lt;p id="greeting"&gt;你好&lt;/p&gt;</code></pre>
    <figcaption>清单一：带有元素标识的段落标记。</figcaption>
  </figure>
  <h2>检索相关标注</h2>
  <p>检索词：换行。</p>
  <p>命中说明：段落与<mark>换行</mark>表达不同关系。</p>
  <h2>机器可读的日期</h2>
  <p>日期：<time id="date" datetime="2026-11-14">2026 年 11 月 14 日</time>。</p>
  <h2>名称与对应值</h2>
  <p>材料：<data id="item" value="A17">纸夹</data>。</p>
  <h2>整词注音</h2>
  <p><ruby id="reading">汉字<rp>（</rp><rt>hàn zì</rt><rp>）</rp></ruby></p>
</body>
</html>
```

:::

打开页面，代码中的尖括号应作为文字出现，图注说明整个清单；标注词仍是句子的一部分；日期与材料名保留适合读者阅读的显示方式，注音与“汉字”关联。

开发者工具 Console 中的以下只读表达式分别读取机器值，不修改页面：

```js
document.getElementById('date').dateTime
document.getElementById('item').value
```

结果分别是字符串 `2026-11-14` 和 `A17`。机器值不需要原样显示在正文中，但必须与显示内容对应；检查器无法替作者证明约定标识 `A17` 在外部系统里确实表示纸夹。

| 观察项 | 表达式或位置 | 预期结果 |
|--------|--------------|----------|
| 代码单元 | Elements | `figure` 内含代码与一个 `figcaption` |
| 检索标注 | Elements | `mark` 只包住当前相关文字 |
| 日期机器值 | `.dateTime` | `2026-11-14` |
| 数据元素值 | `.value` | `A17` |
| 注音结构 | Elements | `rt` 紧跟基本文字，`rp` 作为回退 |

### 2. 保存方向与断行对照

同目录创建 `direction-breaks.html`。这里的少量 CSS 只用于固定观察条件：方向行使用 24px Arial 及无衬线回退，断行框使用 20px Courier New 及等宽回退；实际字体仍受系统安装影响。断行框宽度为当前等宽字体约 12 个数字字符的宽度，样式不承担完整排版教程职责。

::: details 查看 direction-breaks.html 完整内容

```html [direction-breaks.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>方向隔离与可选换行</title>
  <style>
    .direction-line { font: 24px/1.5 Arial, sans-serif; }
    .token {
      font: 20px/1.5 "Courier New", monospace;
      width: 12ch;
      white-space: normal;
      overflow-wrap: normal;
      word-break: normal;
      border: 1px solid;
    }
  </style>
</head>
<body>
  <h1>方向隔离与可选换行</h1>
  <h2>同一名称的方向对照</h2>
  <p class="direction-line" dir="ltr">User <span id="plain-name" lang="ar">إيان</span>: 3 posts.</p>
  <p class="direction-line" dir="ltr">User <bdi id="isolated-name" lang="ar">إيان</bdi>: 3 posts.</p>
  <h2>相同字母的断行对照</h2>
  <p>没有可选断点：</p>
  <p id="unbroken" class="token">abcdefghijklmnop</p>
  <p>有可选断点：</p>
  <p id="breakable" class="token">abcdefgh<wbr>ijklmnop</p>
</body>
</html>
```

:::

打开页面，对照两个方向行中名称、冒号和数字的位置。没有隔离的版本会让冒号和数字参与名称附近的双向重排；`bdi` 版本让外层的 `: 3 posts.` 保持预期关系。浏览器中的实际视觉位置用于验证当前条件，不应据此自行重排源码中阿拉伯文的字符。

在默认 12ch 宽度下，没有断点的连续字母会溢出框，有 `wbr` 的一行可以在 `h` 和 `i` 之间分成两行。把 `.token` 的宽度临时改为 `20ch`，保存刷新，两组都能容纳在一行；再恢复 `12ch`。这组对照保持其余样式不变，只改变是否有断点与可用宽度。

这些变动只改变显示条件。读取 `document.getElementById('breakable').textContent` 仍得到 `abcdefghijklmnop`，并没有因为可选断点而多出换行字符。

| 观察条件 | 预期结果 | 说明 |
|----------|----------|------|
| 普通 `span` 包住阿拉伯文名称 | 冒号与数字可能参与重排 | 没有隔离边界 |
| `bdi` 包住同一名称 | 外层标点与数字关系稳定 | 名称按自身方向隔离 |
| 12ch 且无 `wbr` | 连续字母溢出 | 没有可用断点 |
| 12ch 且有 `wbr` | 在指定边界分成两行 | 可选断点被采用 |
| 20ch 且有 `wbr` | 保持一行 | 空间足够时不强制断行 |
| 读取 `textContent` | 没有额外换行字符 | `wbr` 不是文本节点内容 |

### 3. 制造属性与归属错误，再恢复

保留两个正常文件，分别复制 `annotations.html` 进行以下三个独立对照，每次只改一处：

1. 把日期的 `datetime` 改为 `2026-02-30`。显示文字仍能出现，属性读数也仍是错误字符串；这不表示日期已合法。检查器会报告无效日期，恢复为与显示内容一致的 `2026-11-14` 后复检。
2. 把整段 `figcaption` 移到 `figure` 的结束标签之后。文字仍能显示，但图注失去允许的父级；恢复为该 `figure` 的最后一个子元素后，再核对 DOM 与检查结果。
3. 把 `data` 的 `value="A17"` 改为 `data-value="A17"`。可见名称不变，但元素缺少要求的 `value`，读取 `.value` 得到空字符串。恢复正确的 `value` 后复检，不能把两个属性名当作拼写变体。

| 注入的问题 | 观察 | 恢复 |
|------------|------|------|
| `datetime="2026-02-30"` | 显示照常，Nu 报告无效日期 | 改为真实存在的日期 |
| `figcaption` 移到 `figure` 外 | 文字可见，失去允许的父级 | 放回 `figure` 开头或末尾 |
| `value` 写成 `data-value` | `.value` 为空，Nu 报告缺少必需属性 | 恢复 `value` |
| `mark` 当成 `strong` | 外观可能相似，语义不同 | 按“语境相关”或“重要性”选择 |
| 用 `wbr` 期待强制换行 | 空间足够时不换行 | 需要强制换行时使用 `br`，并判断是否真的需要 |

可以把完整文件上传 [Nu HTML Checker](https://validator.w3.org/nu/)，或使用[官方独立版工具](https://validator.github.io/validator/)。语义、结构和显示条件要分别判断：一个无效日期不会阻止整页显示，一个没有采用的可选断点也不自动构成标记错误。

### 4. 验证记录

以上两个完整页面于 2026-11-14 在 macOS 的 Chrome 157.0.8103.79 中实测：图注归属、代码文字、标注与机器值、ruby 的注音及回退括号状态、bdi 的方向隔离和给定字体条件下的断行均已核对。方向与断行对照使用 1280×720 的浏览器视口，实际渲染字体分别为 Arial 和 Courier New；断行框保持示例的 20px 字号、30px 行高及 `normal` 空白处理。正常文件及恢复文件经本地 Nu 26.11.9（0f0f1f9）检查无错误、无警告，三个错误对照分别报告相应日期、父级和必需属性问题。

本次重写只补充正文层次、注释和观察项，两个完整文件的结构、样式与实测条件未变；这里未测试不支持 ruby 的真实浏览器、屏幕阅读器实际朗读、跨浏览器排版或任何自动搜索、提醒及数据提交功能。
