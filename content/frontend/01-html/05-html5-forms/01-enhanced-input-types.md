---
title: "新增 input 输入类型"
tags:
  - HTML
  - input
  - 日期时间
  - 表单
excerpt: "按数据含义区分搜索、电话、地址、邮箱、数量、范围、日期时间和颜色输入，解释界面与标准值、值清洗及回退的区别，并以独立页面验证当前浏览器行为。"
date: 2026-11-14
---

# 新增 input 输入类型

输入类型不仅决定控件长什么样，还声明值的含义。电话号码和数量都可能包含数字，但前者是联系标识，后者可以进行数量运算；日期界面可以按本地习惯显示，控件保存的值却采用标准格式。选择类型应先回答“这是什么数据”，再观察浏览器提供什么界面。

这些类型形成于 HTML5 发展阶段及后续标准。2014 年 HTML5 定稿已有搜索、电话、URL、邮箱、日期、时间、数量、范围和颜色等状态，`month`、`week`、`datetime-local` 可在 HTML 5.1 中找到；本文按现行 Living Standard 教授，不把当前所有类型都说成 2014 年定稿新增。

下面按文本、数量、日期时间和颜色分组，最后用独立页面比较界面与标准值。

::: info 本篇的范围
本篇讲增强输入类型的值语义、标准值和基本界面差异。传统 `text`、密码、单选、复选和文件选择见[input 基本输入控件](../03-forms/02-basic-inputs.md)；`min`、`max`、`step` 和校验状态见[原生约束校验](./05-constraint-validation.md)；`multiple`、`accept` 等填写属性见[新增表单属性](./02-enhanced-form-attributes.md)。时区数据库、日期库和完整国际化不在本篇展开。
:::

## 一、文本输入的语义细分

### 1. search 表示搜索词

`search` 用于搜索词。它保留单行文本的基本能力，浏览器可以提供搜索相关的外观或清除入口，但不会仅凭这个类型执行搜索、发起请求或创建搜索结果。下面是 `body` 中的局部标记：

```html
<label>搜索词：<input type="search" name="keyword"></label>
```

搜索行为仍需要表单提交或脚本实现。把输入框设为 `search`，只是告诉浏览器这段文字用于搜索；没有提交入口和接收端，它仍只是一个文本框。

### 2. tel 声明电话号码，不定义统一格式

`tel` 声明电话号码。不同地区的号码规则不同，因此该类型不内置一套统一的有效号码格式；`+86`、空格或分隔符等如何解释，需要具体规则。

```html
<label>联系电话：<input type="tel" name="phone"></label>
```

某些设备会提供适合电话输入的键盘，这属于界面支持，不能推断所有设备都有相同键盘，也不能把键盘样式当作号码有效性证明。

### 3. 编号、邮编等不因像数字就选 number

电话、邮政编码、会员编号等通常不适合 `number`：它们不因“加一”就得到有意义的下一个数量，还可能需要前导零。需要保留标识文本时，应采用 `tel` 或 `text` 等相应语义。

定义见 [Search 状态](https://html.spec.whatwg.org/multipage/input.html#text-(type=text)-state-and-search-state-(type=search))和 [Telephone 状态](https://html.spec.whatwg.org/multipage/input.html#telephone-state-(type=tel))。

### 4. url 与 email 有格式含义

`url` 表示绝对 URL，例如 `https://example.org/help`；只有 `/help` 这样的相对路径并不满足该类型的 URL 格式要求。`email` 表示邮箱地址；未启用多值属性时，当前字段用于一个地址，例如 `reader@example.org`。

```html
<label>资料地址：<input type="url" name="resource"></label>
<label>联系邮箱：<input type="email" name="email"></label>
```

这些类型会参与原生格式检查，但格式正确不证明网站可达、邮箱存在或使用者拥有它。它们也不会保证错误文字一输入就被清空：邮箱框可以暂时保留不符合邮箱格式的文本，检查失败与值仍存在是两件事。

URL 与邮箱状态还按各自规则处理行界和首尾 ASCII 空白，不宜据此推导普通 `text` 也有完全相同的清洗。规则见 [URL 状态](https://html.spec.whatwg.org/multipage/input.html#url-state-(type=url))与 [Email 状态](https://html.spec.whatwg.org/multipage/input.html#email-state-(type=email))。

| 类型 | 值的含义 | 是否内置格式检查 | 不能据此判断 |
|------|----------|------------------|--------------|
| `search` | 搜索词 | 无专门格式约束 | 是否真的执行了搜索 |
| `tel` | 电话号码 | 不定义统一号码格式 | 号码是否真实存在 |
| `url` | 绝对 URL | 有 URL 语法检查 | 页面是否可访问 |
| `email` | 邮箱地址 | 有邮箱语法检查 | 邮箱是否存在、是否属于填写者 |

## 二、数量与连续范围

### 1. number 表达可增减的数量

`number` 用于数值，例如份数、重量或数量。它的 `.value` 仍是字符串，不能因为类型叫 number 就把读取结果当作 JavaScript 数字；用户清空时可以得到空字符串。浏览器还可以提供增减操作，接受的数值语法也不等于“只允许十个数字字符”。

```html
<label>份数：<input type="number" name="copies" value="3"></label>
```

上例可以把 `3` 改成 `4`，也可在支持的界面用增减操作改变数量。小数是否符合当前步长，还要看相关约束；`min`、`max`、`step` 的完整规则由[原生约束校验](./05-constraint-validation.md)展开。

### 2. 前导零会丢失编号含义

若把编号 `0012` 填进数量框，暂时能看到这串文字也不能证明类型合适。增减或数值转换可以得到 `13`，前导零不再承担标识意义；应改回文本类型保留编号，而不是用数量控件维护编号格式。

标准特别区分了适合数值增减的数据与看似数字的文本，见 [Number 状态](https://html.spec.whatwg.org/multipage/input.html#number-state-(type=number))。

### 3. range 表达范围内的位置

`range` 适合选择精确数值本身不太重要的位置，例如相对强度。它通常显示为滑块，仍然具有数值，而不是一个可随意为空的文本框：

```html
<label>相对强度：<input type="range" name="strength" value="25"></label>
```

当前例子没有另设边界，采用默认的 0 到 100 范围和默认步长 1。滑块停在 25 时，`.value` 是字符串 `"25"`；用方向键移动后应读取当前位置，不能从滑块的像素坐标直接当作数值。

无效或空的值会按范围规则得到合适数值，不像普通文本框那样一直保留空字符串。具体边界与值清洗见 [Range 状态](https://html.spec.whatwg.org/multipage/input.html#range-state-(type=range))。

::: warning 输入类型依据数据含义，不依据字符外观
`0012`、`000-0000` 都包含数字，却不是可增减的数量。需要保留前导零、分隔符或业务格式时，使用文本或电话类型，并另写格式规则；不要为了得到数字键盘而牺牲标识含义。
:::

## 三、日期与时间的值格式

### 1. 界面显示与保存值分开

日期类控件把“界面显示”与“保存的字符串”分开。界面可能使用本地日期顺序、月份名称或 12 小时制，但读取 `.value` 应按对应类型的标准格式判断。以下示例使用通常的四位年份；完整年份语法并不只允许四位。

| 类型 | 表达的数据 | 合法值示例 |
|------|------------|------------|
| `date` | 不含时区的年、月、日 | `2026-11-14` |
| `time` | 不含时区的一天内时间 | `09:30`，需要相应精度时也可有秒和小数秒 |
| `month` | 年与月 | `2026-11` |
| `week` | 周所属年份与周编号 | `2026-W46` |
| `datetime-local` | 不含时区的日期与时间 | `2026-11-14T09:30` |

### 2. 日期与周编号各有规则

`date` 不接受不存在的日期，例如 `2026-02-30`。`week` 的周从星期一开始，周所属年份按周编号规则计算，年初和年末不能简单把日期的公历年抄成周所属年。

`time` 不附日期，`month` 不附日；缺少的信息不会因控件显示了某个日历就自动补进值中。

### 3. datetime-local 不带时区

`datetime-local` 中的 `T` 分隔日期与时间，值不携带 `Z` 或 `+08:00` 这类时区偏移。`2026-11-14T09:30` 表示一组本地日期和时间组成部分，不足以单独确定全球时间轴上的一个时刻；接收端需要明确相应地区或时区约定，不能擅自当成 UTC。

这些类型的无效值可以被清洗为空字符串；这与“保留文本但格式检查不通过”的情况应分别观察。依据见 [日期](https://html.spec.whatwg.org/multipage/input.html#date-state-(type=date))、[月份](https://html.spec.whatwg.org/multipage/input.html#month-state-(type=month))、[周](https://html.spec.whatwg.org/multipage/input.html#week-state-(type=week))、[时间](https://html.spec.whatwg.org/multipage/input.html#time-state-(type=time))和 [本地日期时间](https://html.spec.whatwg.org/multipage/input.html#local-date-and-time-state-(type=datetime-local))。

::: warning 本地日期时间不是 UTC
`2026-11-14T09:30` 没有时区偏移，不能被接收端当成 UTC 的 09:30。保存或比较前必须约定时区，或改用携带偏移/时区信息的数据；日期控件本身不替应用完成这项转换。
:::

## 四、颜色输入及现行扩展

### 1. 基础 color 使用不透明 sRGB 值

`color` 表达颜色选择。常见基础写法不启用透明度和广色域扩展，采用不透明、8 位 sRGB 分量的兼容序列化，常读到 `#rrggbb`：

```html
<label>基础颜色：<input type="color" name="color" value="#336699"></label>
```

这里的三个两位十六进制数分别表达红、绿、蓝分量。颜色控件会维持一个颜色；把值设为空或无效内容时，不应把它当成“尚无颜色”的空文本状态，现行算法会以不透明黑色作为无效解析的回退。

### 2. alpha 与 colorspace 扩展值格式

**现行标准已经不只定义这一种颜色格式。** `alpha` 允许透明度，`colorspace` 选择 `limited-srgb` 或 `display-p3`；后者表达另一种色彩空间。启用相应条件后，值可以采用 `color(...)` 等 CSS 颜色序列化，不应把所有 color 值都按固定七字符解析。

```html
<label>扩展颜色：<input type="color" alpha colorspace="display-p3"
  value="color(display-p3 1 0.5 0 / 0.5)"></label>
```

### 3. 类型被识别不代表扩展已支持

扩展属性和界面的支持必须另查；浏览器可以识别 `type="color"`，却没有实现透明度或色彩空间扩展。这种局部支持差异不等于整个类型回退到 text。

基础示例与较新扩展应分开验证，现行解析和序列化条件见 [Color 状态](https://html.spec.whatwg.org/multipage/input.html#color-state-(type=color))。

| 条件 | 值可能是什么 | 不能推断 |
|------|--------------|----------|
| 基础 `color` | `#rrggbb` | 一定支持透明度 |
| `alpha` | 带 alpha 的颜色序列化 | 目标浏览器已实现 |
| `colorspace="display-p3"` | `color(display-p3 …)` | 显示器支持完整 P3 色域 |
| 无效初始值 | 回退为不透明黑色 | “尚无颜色”的空状态 |

::: tip 先按数据语义选类型，再看界面
选择输入类型时先写清数据的含义：可增减的数量、需要保留格式的标识、确定日期、连续位置还是颜色。界面外观、键盘和选择器会随浏览器变化，不能反过来用它们决定字段语义。
:::

## 五、独立比较界面、值与回退

### 1. 创建完整输入对照页

新建空目录 `html-enhanced-types`，创建 UTF-8 文件 `types.html`。各组是独立的输入观察，没有共同业务流程、脚本、外部素材或提交按钮；可以直接用浏览器打开：

::: details 查看 types.html 完整内容

```html [types.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>输入类型与标准值</title>
</head>
<body>
  <h1>输入类型与标准值</h1>
  <p><label>搜索词：<input id="search" type="search" name="keyword"></label></p>
  <p><label>联系电话：<input id="phone" type="tel" name="phone" value="000-0000"></label></p>
  <p><label>资料地址：<input id="url" type="url" name="url" value="https://example.org/help"></label></p>
  <p><label>联系邮箱：<input id="email" type="email" name="email" value="reader@example.org"></label></p>
  <p><label>份数：<input id="quantity" type="number" name="copies" value="3"></label></p>
  <p><label>相对强度：<input id="strength" type="range" name="strength" value="25"></label></p>
  <p><label>日期：<input id="date" type="date" name="date" value="2026-11-14"></label></p>
  <p><label>时间：<input id="time" type="time" name="time" value="09:30"></label></p>
  <p><label>月份：<input id="month" type="month" name="month" value="2026-11"></label></p>
  <p><label>周：<input id="week" type="week" name="week" value="2026-W46"></label></p>
  <p><label>本地日期时间：<input id="local-time" type="datetime-local"
    name="local_time" value="2026-11-14T09:30"></label></p>
  <p><label>基础颜色：<input id="color" type="color" name="color" value="#336699"></label></p>
  <p><label>扩展颜色：<input id="wide-color" type="color" name="wide_color" alpha
    colorspace="display-p3" value="#ff8000"></label></p>
</body>
</html>
```

:::

输入搜索词、改变份数，用方向键改变相对强度，再选择日期与时间。每个控件都有可见标签；标签、传统 input 的书写方式见[input 基本输入控件](../03-forms/02-basic-inputs.md)。不要填写真实联系方式，示例只使用演示数据。

### 2. 读取标准值，而不是抄界面格式

打开 Chrome 开发者工具的 Console，逐条输入下面的只读表达式。`document.getElementById` 按 id 找到当前控件，`.type` 读取浏览器识别的类型，`.value` 读取当前字符串；这些表达式不提交或修改数据：

```js
document.getElementById('date').type
document.getElementById('date').value
document.getElementById('local-time').value
document.getElementById('strength').value
document.getElementById('color').value
```

初始日期值应为 `2026-11-14`，本地日期时间为 `2026-11-14T09:30`，强度为 `"25"`，基础颜色为 `#336699`。改变对应输入后重读，观察值是否按该类型规则改变；即使界面日期顺序不同，也不要把显示文字当作值格式。

清空份数后读取值，可得到空字符串；再输入一个整数即可恢复。邮箱框输入 `not-an-address`，文字可以保留，这不证明它是格式合格的邮箱。校验 API 和错误报告交由[原生约束校验](./05-constraint-validation.md)主讲，不在这里用一组 API 替代输入类型的解释。

| 观察项 | 表达式或操作 | 预期结果 |
|--------|--------------|----------|
| 日期类型 | `.type` | `date` |
| 日期值 | `.value` | `2026-11-14` |
| 本地日期时间 | `.value` | `2026-11-14T09:30`，不含偏移 |
| 强度 | `.value` | 字符串 `"25"` |
| 基础颜色 | `.value` | `#336699` |
| 清空数量 | `.value` | 空字符串 |

### 3. 观察扩展颜色分支

完整文件的扩展颜色先采用兼容初值 `#ff8000`。要单独观察较新颜色格式，可把该控件的 value 改成前面片段中的 `color(display-p3 1 0.5 0 / 0.5)`，重新打开后读取值。

这个分支需与基础输入分别判断：本次 Chrome 将它转换为不透明的 `#ff7600`，没有同时提供 alpha 和 colorSpace 接口；不能把这种结果当作透明度、Display P3 完整支持。

### 4. 修复非法日期并辨认回退

把完整文件复制为 `invalid.html`，只将日期的初始 `value` 改为 `2026-02-30`。刷新后读取 `#date` 的 `.value`，应为空；不存在的日期没有变成一个有效日期。用 [Nu HTML Checker](https://validator.github.io/validator/)的本地检查器检查，可定位无效日期。恢复 `2026-11-14`，保存为 `repaired.html` 后重读并复检。

不认识的类型按文本状态回退。可以把搜索框的 type 临时改成 `future-input`，观察 `.type` 读成 `text`，恢复 `search` 后再读。这个人为错误只演示通用回退，不能冒充“当前浏览器不支持 date”的测试。类型被识别，也不保证具备每种原生选择器或移动键盘；桌面结果、设备模拟和真机证据应分别记录。

| 注入的问题 | 观察 | 恢复 |
|------------|------|------|
| `date` 值为 `2026-02-30` | `.value` 为空，Nu 报告无效日期 | 改为真实存在的日期 |
| `type="future-input"` | `.type` 读成 `text` | 恢复合法类型，不把回退当支持 |
| 用 `number` 保存编号 `0012` | 前导零失去标识意义 | 改用 `text` 或 `tel` |
| `datetime-local` 当 UTC | 值不含偏移，无法确定全球时刻 | 约定时区或改用带偏移的数据 |
| 扩展颜色只检查 `type` | 类型被识别但扩展可能未实现 | 分别验证值格式与界面能力 |

### 5. 验证记录

本例于 2026-11-14 在 macOS 的 Chrome 157.0.8103.79 中核对各类型及初始标准值、文本输入、滑块方向键、清空与无效值清洗，以及编号增减和类型回退。Nu 本地版 26.11.9（0f0f1f9）对完整正常文件与日期修复文件无错误、无警告，对非法日期报告错误。

单独使用 CSS 颜色函数的扩展分支符合所引现行颜色定义，但本次 Nu 仍报告颜色字符串长度错误，属于检查器该分支与现行定义的差异，未把它记为通过。本次重写只补充正文层次、注释和观察项，`types.html` 的结构、属性与实测条件未变；移动键盘、原生日期和颜色选择器、其他浏览器及颜色扩展的完整界面行为均未验证。
