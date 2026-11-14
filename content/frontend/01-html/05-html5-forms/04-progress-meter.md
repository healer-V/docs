---
title: "进度 progress 与度量 meter"
tags:
  - HTML
  - 表单
  - progress
  - meter
excerpt: "区分任务进度与已知范围内的度量，解释 progress 的确定、不确定和零进度，以及 meter 的数值范围、阈值和最佳区间，用独立静态文档核对名称、读数、错误与恢复。"
date: 2026-11-14
---

# 进度 progress 与度量 meter

`progress` 表示任务完成到什么程度，`meter` 表示某个数值在已知范围内处于什么位置。完成了 5 个步骤中的 3 个，适合用 `progress`；容量已占用 100 个单位中的 40 个，适合用 `meter`。外观看起来都像一条横条，不能据此互换。

两者都已包含在 [2014 年 HTML5 表单定义](https://www.w3.org/TR/2014/REC-html5-20141028/forms.html#the-progress-element)中。下面采用现行 HTML Standard 的属性和状态规则；示例声明的是静态观察值，不连接真实任务、上传过程或监控系统。

::: info 本篇的范围
本篇讲 `progress` 与 `meter` 的值、范围、状态和可见名称。滑块式数值输入见[新增 input 输入类型](./01-enhanced-input-types.md)，标签关联的基础见[表单结构与控件标签](../03-forms/01-form-structure-labels.md)。上传进度的事件接入、轮询任务状态、图表库和自定义动画不在本篇展开。
:::

## 一、progress 的确定与不确定状态

### 1. value 与 max 表达已完成量和总量

`value` 表示已经完成的工作量，`max` 表示全部工作量。它们使用无单位的数值，具体单位由周围文字说明。下面是可放在 `body` 中的局部内容：

```html
<label for="steps">步骤进度</label>
<progress id="steps" value="3" max="5">已完成 3/5</progress>
<p>已完成 5 个步骤中的 3 个。</p>
```

这里的比例是 3÷5，即 60%。`value` 不要求本身就是百分数；若把范围写成 `max="100"`，才需要相应使用 0 到 100 的数值。没有声明 `max` 时，上限默认是 1，例如 `value="0.6"` 表达相同比例。

### 2. 作者声明必须落在合法数值内

`max` 若存在，必须大于 0；`value` 若存在，必须大于或等于 0，且不能超过上限。两者都使用合法浮点数写法，不在属性中写 `60%`、`3/5` 或单位文字。`progress` 没有用于改变起点的 `min` 属性，完成量以 0 为起点。依据见 [HTML：progress](https://html.spec.whatwg.org/multipage/form-elements.html#the-progress-element)。

### 3. 省略 value 表示不确定

任务已经开始、但还不知道完成比例时，可以不声明 `value`：

```html
<label for="waiting">等待处理结果</label>
<progress id="waiting">完成比例未知</progress>
<p>正在处理，尚不能报告完成比例。</p>
```

这称为**不确定进度**。它与确定的零进度不同：`value="0" max="5"` 声明已知完成量为 0，而省略 `value` 表示当前无法确定比例。浏览器可用不同样式表示不确定状态，但并不保证某一种动画、速度或颜色。

### 4. 接口读数需要结合状态判断

`.value` 在不确定状态下也会返回 0，不能单凭这个读数认定确定的零进度；`.position` 则在不确定时返回 -1，在确定时返回完成量与总量之比：

| 声明 | 状态 | `.value` | `.position` |
|------|------|----------|-------------|
| `value="3" max="5"` | 确定，完成 3/5 | 3 | 0.6 |
| `value="0" max="5"` | 确定，完成量为 0 | 0 | 0 |
| 不声明 `value` | 不确定 | 0 | -1 |

要切换为不确定状态，应删除 `value` 属性，不能用空字符串或 `value="unknown"` 代替。要切换回确定状态，再声明合法数值。改变显示状态不会自动启动或完成任何任务。

::: warning 进度条不驱动任务
`progress` 只显示作者声明的数值。把 `value` 改成 5 或删掉 `value`，不会让上传开始、暂停或结束；任务的真实状态仍要由脚本和接收端维护。
:::

## 二、meter 的范围与当前度量

### 1. 先确定范围，再解释数值

`meter` 表示已知范围内的标量度量，也就是一个可放进上下限中比较的数值。它适合容量占用、已知比例等信息，不用于表示一个持续任务已经完成多少，也不适合没有已知范围的任意测量值。

以下是 `body` 中的局部内容，表示容量占用 40 个单位，总容量为 100：

```html
<label for="capacity">容量占用</label>
<meter id="capacity" min="0" max="100" value="40">40/100</meter>
<p>已占用 40/100 个单位。</p>
```

`min` 和 `max` 给出下限、上限，`value` 给出当前读数，三者使用相同单位。单位要在可见文字中说明，不写成 `value="40MB"`。`meter` 没有一个会自动生成单位标识的专门属性。

### 2. value 必需，默认范围是 0 到 1

`value` 必须声明，并满足 `min ≤ value ≤ max`。没有声明上下限时，默认范围为 0 到 1；因此只写 `value="40"` 并不表示浏览器知道总量是 100。范围可以包含负数，只要各值符合相同范围关系，不能把所有度量都限定为非负数。

### 3. 省略 value 不是未知状态

省略 `meter` 的 `value` 不表示“未知度量状态”。这会缺少必需声明；若尚无可靠数值，应直接说明“读数未知”，而不是借用 `progress` 的不确定规则。定义见 [HTML：meter](https://html.spec.whatwg.org/multipage/form-elements.html#the-meter-element)。

### 4. low、high 与 optimum 说明区间含义

`low` 和 `high` 把范围分成低、中、高几个部分，`optimum` 提供一个最佳点，用来确定哪一部分更合适。它不是当前读数，也不要求永远等于上限。

下面是 `body` 中的局部容量度量，阈值仅用于解释语法，不代表实际系统的告警规则：

```html
<label for="usage">容量占用：低占用更合适</label>
<meter id="usage" min="0" max="100" value="40"
       low="25" high="75" optimum="10">40/100</meter>
```

当前读数为 40，低、高边界分别是 25 和 75，最佳点 10 落在低区间。因此这里表达“较低占用更合适”，而不是“数字越大越好”。如果把最佳点改到 90，就表达高区间更合适；改为 50，则中间区间更合适。

| 最佳点位置 | 最佳区间 | 其余区间的关系 |
|------------|----------|----------------|
| `optimum < low` | 低区间 | 中区间次之，高区间更不合适 |
| `low ≤ optimum ≤ high` | 中区间 | 两侧区间都次于中间 |
| `optimum > high` | 高区间 | 中区间次之，低区间更不合适 |

### 5. 区间属性的顺序与默认值

最佳点恰好等于 `low` 或 `high` 时，也按中间区间为最佳处理。`optimum` 不必夹在 `low` 与 `high` 之间；强制这样写，反而不能表达低值或高值更合适的度量。

声明时必须满足 `min ≤ low ≤ high ≤ max`（同时提供两个边界时），并单独满足 `min ≤ optimum ≤ max`。只提供一个边界时，它也必须处于范围内。省略 `low`、`high` 时，对应边界分别采用下限、上限；省略 `optimum` 时，最佳点采用范围中点。所有这些属性都使用合法数值，不能借浏览器的错误恢复随意颠倒边界。

### 6. 颜色不是元素定义

浏览器可以据区间关系呈现不同外观，但某一种绿色、黄色或红色不是元素定义。读者应能从名称、数值和解释理解状态，不能要求只能靠颜色识别“合适”。完整作者规则与区间处理见 [meter 的属性和区间定义](https://html.spec.whatwg.org/multipage/form-elements.html#the-meter-element)。

::: warning meter 不是输入控件
`meter` 不让用户拖动输入数值。需要可编辑范围输入时，应使用 `range` 等输入控件；不能只因形状相近就把度量当作滑块，也不能把用户拖动后的像素位置当作度量值。
:::

## 三、名称与可见文字

### 1. label 提供可理解的名称

`progress` 和 `meter` 都可以用关联的 `label` 提供名称，让用户知道这条指示器描述什么。标签关联的基础见[表单结构与控件标签](../03-forms/01-form-structure-labels.md)。

### 2. 内部文字是回退内容

两个元素都有结束标签，标签内部可以放相应的文字表示，为不支持其表现方式的用户代理保留内容。但**内部文字不能替代可理解的名称**，支持原生指示器的浏览器也不一定把内部文字直接画出来。重要数值和“比例未知”等说明应在周围正文中可见。

### 3. 一条指示器的完整说明

例如，“任务进度”说明对象，“已完成 3/5”说明当前状态；“容量占用”说明对象，“40/100 个单位、低占用更合适”补足范围与方向。只有一个没有名称的横条，或者只写“看绿色区域”，都不足以清楚表达这些信息。

| 元素 | 名称应说明 | 正文应补充 |
|------|------------|------------|
| `progress` | 哪个任务 | 已完成量与总量，或“比例未知” |
| `meter` | 哪个度量 | 当前值与范围、单位、哪个区间更合适 |

## 四、从空目录核对状态与读数

### 1. 创建独立静态文档

新建空目录 `html-indicators`，创建 UTF-8 文件 `indicators.html`。页面对照已知进度、确定零进度、不确定进度和容量度量，无脚本、外部资源或服务依赖。

::: details 查看 indicators.html 完整内容

```html [indicators.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>进度与度量观察</title>
</head>
<body>
  <h1>进度与度量观察</h1>
  <h2>任务进度</h2>
  <p><label for="known">已知任务进度</label>：
    <progress id="known" value="3" max="5">3/5</progress>
    已完成 3/5 个步骤。</p>
  <p><label for="zero">确定零进度</label>：
    <progress id="zero" value="0" max="5">0/5</progress>
    已知完成量为 0。</p>
  <p><label for="waiting">不确定进度</label>：
    <progress id="waiting">完成比例未知</progress>
    正在处理，尚不能报告完成比例。</p>
  <h2>容量度量</h2>
  <p><label for="capacity">容量占用</label>：
    <meter id="capacity" min="0" max="100" value="40"
           low="25" high="75" optimum="10">40/100</meter>
    已占用 40/100 个单位，本例以低占用更合适。</p>
</body>
</html>
```

:::

双击打开页面，比较四种指示器及其可见说明。它们展示的是声明的数值，不会随着时间自动前进。可在开发者工具的 Accessibility 信息中核对名称和当前值；这只是浏览器提供的信息，不等于已经测试屏幕阅读器的实际朗读。

### 2. 对照确定与不确定进度

在 Console 执行以下只读表达式。前两项分别是当前值与完成比例，最后一项检查未知进度是否真的没有 `value` 属性：

```js
document.getElementById('known').value
document.getElementById('known').position
document.getElementById('waiting').hasAttribute('value')
document.getElementById('waiting').value
document.getElementById('waiting').position
```

结果依次为 `3`、`0.6`、`false`、`0`、`-1`。再执行 `document.getElementById('zero').position` 得到 0，说明确定零进度与比例未知并不是同一种状态。

在文件里临时删除 `known` 的 `value="3"`，并把该项内部文字与可见说明同步改为“完成比例未知”，刷新后它也变为不确定状态。把该位置改为 `value="0"` 并说明已完成 0/5 后，恢复为确定的零进度；最后恢复 `value="3"` 及原说明文字，完成正常状态的复测。

### 3. 改变最佳点，保留同一个当前值

记录 `capacity` 的 `value="40"`，保持数值和边界不变，把 `optimum` 依次改为 50 和 90，每次保存刷新，读取以下表达式。这个实验仅比较声明含义，应同时把可见解释改为本次偏好的中区间或高区间，不表示真实容量场景也应采用这种偏好：

```js
document.getElementById('capacity').value
document.getElementById('capacity').low
document.getElementById('capacity').high
document.getElementById('capacity').optimum
```

当前值仍为 40，边界仍为 25 和 75，最佳点分别成为 50、90。按前述区间规则，两次声明分别偏好中区间与高区间；当前读数没有因为最佳点改变而变成 50 或 90。完成后把 `optimum` 恢复为 10，并保留一致的文字解释。

| 观察项 | 表达式或操作 | 预期结果 |
|--------|--------------|----------|
| 已知进度值 | `#known.value` | `3` |
| 已知进度比例 | `#known.position` | `0.6` |
| 零进度比例 | `#zero.position` | `0` |
| 未知进度 | `#waiting.hasAttribute('value')` | `false` |
| 未知进度比例 | `#waiting.position` | `-1` |
| 改最佳点 | `optimum` 依次改 50、90 | `value` 仍为 40 |

## 五、区分错误恢复与合法声明

### 1. 完成量超出上限

保留正常文档，每次复制一份只改一项，再用[官方独立版 Nu 工具](https://validator.github.io/validator/)检查。

把 `known` 改成 `value="7" max="5"`。源码完成量超出上限，本次浏览器的 `.value` 会限制为 5，`.position` 为 1；这属于浏览器处理错误输入的结果，不表示作者正确声明了“全部完成”。检查器会报告越界，恢复 3 后重检。

### 2. 颠倒 low 与 high

把 `capacity` 的 `low` 改为 80、`high` 改为 20。这违反低边界不应高于高边界的要求；浏览器处理后的接口读数不一定等于原始属性字符串。先核对 Elements 中的声明，再恢复 `low="25" high="75"`，不要据横条还能显示就保留颠倒边界。

### 3. 缺少 value 与语义误用

删除 `capacity` 的 `value="40"`。这是缺少必需属性，不是未知状态的合法写法；恢复当前度量值后再检查。

如果错误来自含义选择，例如用 `meter` 表示文件处理的完成程度，即使数值范围合法，也应按任务语义改用 `progress`。检查器不能自动知道某个 40/100 到底代表容量还是完成量，仍需作者说明数据来源与用途。

| 注入的问题 | 观察 | 恢复 |
|------------|------|------|
| `value="7" max="5"` | `.value` 为 5、`.position` 为 1，Nu 报告越界 | 改为合法完成量 |
| `low="80" high="20"` | 边界颠倒，外观仍可能显示 | 恢复 `low` ≤ `high` |
| 删除 `meter` 的 `value` | 缺少必需属性 | 补回当前度量值 |
| 用 `meter` 表示任务完成度 | 数值合法但语义错误 | 改用 `progress` |

### 4. 验证记录

以上独立文件于 2026-11-14 在 macOS 的 Chrome 157.0.8103.79 中实测：三种进度的属性存在性和比例、度量范围与最佳点、浏览器提供的名称，以及越界和颠倒边界的处理均已核对。正常及恢复文档经本地 Nu 26.11.9（0f0f1f9）检查无错误、无警告，三个错误对照得到相应报告。这里没有连接真实任务或监控数据，没有验证其他浏览器、屏幕阅读器实际朗读、所有系统颜色或不支持元素时的真实回退界面。
