---
title: "数据表格"
tags:
  - HTML
  - 表格
  - 表头关联
  - 可访问性
excerpt: "说明 table、tr、th、td 与行组怎样组成二维数据网格，解释 scope、headers、colspan 与 rowspan 的属性含义和使用方式，并给出独立核对与失败恢复方法。"
date: 2026-11-14
---

# 数据表格

表格把数据组织成行和列。读取一个单元格时，通常要同时知道它属于哪一行、哪一列：单独看到“8”没有意义，结合“铅笔”和“数量”才是一条数据。这也是表格与用 `div` 摆放文字的区别：前者在结构中保留行列和表头关系，后者只保留位置。

HTML 表格用 `table` 建立网格，`tr` 组织行，`th` 和 `td` 分别表示表头与数据单元格；列没有对应标签，它由各行单元格在网格中的位置形成。`scope`、`headers`、`colspan` 和 `rowspan` 进一步描述表头范围与单元格跨度。

::: info 本文的判断依据
正文按 WHATWG HTML Living Standard 的现行规则说明。浏览器会把不合法的表格内容修补成可显示的结构，所以判断依据是 Elements 中的节点关系和验证器报告，而不是页面外观。
:::

## 一、表格的基本结构

### 1. 先判断是不是表格数据

表格表达的是“每一行是一条记录，每一列是同一种字段”的数据关系。页面导航、卡片排列和左右分栏也可以用表格对齐，但它们没有行列表头，辅助技术会按数据表处理它，导航结构也会变得难以理解。

| 判断问题 | 表格数据 | 布局结构 |
|----------|----------|----------|
| 去掉对齐后，内容是否仍能按行列理解 | 能，行列本身有含义 | 不能，位置只是排版 |
| 是否存在行标题或列标题 | 至少有一个方向有表头 | 没有表头 |
| 用 `div` + CSS 能否更直接地表达 | 不能，会丢失数据关系 | 能，布局由 CSS 负责 |

::: tip 先找行标题和列标题
如果每个数据都能回答“它属于哪一行、哪一列”，使用 `table`；如果只是把几个区块摆成网格，使用 `div` 等普通元素并交给 CSS 布局。判断依据是数据关系，不是外观是否像表格。
:::

### 2. table、tr、th、td 的分工

`table` 是表格容器，`tr` 表示一行，`th` 是表头单元格，`td` 是数据单元格。列不是由某个“列标签”声明出来的：每个 `tr` 中的单元格按顺序占据逻辑网格的位置，所有行对齐后才形成列。元素和内容模型见 [HTML：table 元素](https://html.spec.whatwg.org/multipage/tables.html#the-table-element)。

| 元素 | 作用 | 内容模型 | 关键属性 |
|------|------|----------|----------|
| `table` | 建立行列表格 | 接受 `caption`、`colgroup`、`thead`、`tbody`、`tfoot`、`tr` 等表格结构 | 无表格专用必需属性 |
| `tr` | 组织一行单元格 | 只接受 `th` 和 `td` | 无 |
| `th` | 表头单元格 | 承载表头文字或内容 | `scope`、`colspan`、`rowspan`、`headers`、`abbr` |
| `td` | 数据单元格 | 承载当前单元格的数据 | `colspan`、`rowspan`、`headers` |

表格相关属性的含义与使用方式：

| 属性 | 所属元素 | 含义 | 取值与默认 | 使用方式 |
|------|----------|------|------------|----------|
| `scope` | `th` | 声明表头覆盖的方向 | `row`、`col`、`rowgroup`、`colgroup`；不写时由浏览器推断 | 简单行列标题优先使用 |
| `headers` | `th`、`td` | 显式列出关联表头的 `id` | 空格分隔的 `id` 列表 | 多层表头或 `scope` 无法表达时使用 |
| `colspan` | `th`、`td` | 向右跨过的列数 | 1～1000 的整数，默认 1 | 横向合并单元格 |
| `rowspan` | `th`、`td` | 向下跨过的行数 | 0～65534 的整数，默认 1；0 表示跨到行组末尾 | 纵向合并单元格 |
| `abbr` | `th` | 表头的缩写文本 | 文本 | 表头文字较长、需要缩写时使用 |
| `id` | 任意元素 | 文档内唯一标识 | 唯一字符串 | 供 `headers` 引用 |

下面是一个局部表格，省略了完整文档外壳：

```html
<table>
  <tr>
    <!-- 列标题：scope="col" 表示作用于整列 -->
    <th scope="col">物品</th><th scope="col">数量</th>
  </tr>
  <tr>
    <!-- 行标题：scope="row" 表示作用于整行 -->
    <th scope="row">铅笔</th><td>8</td>
  </tr>
</table>
```

打开后应看到两行两列：第一行是“物品”和“数量”，第二行是“铅笔”和“8”；`th` 内容默认加粗居中。开发者工具的 Elements 中还会出现一个源码里没有写的 `tbody`，这是解析器为 `tr` 补出的行组。

::: warning 显示正常不代表结构合法
把 `td` 直接写在 `table` 下不符合内容模型，解析器会补出 `tbody` 和 `tr`，在 DOM 中形成源码没有写出的行；把 `div`、纯文本等非表格内容放进去，解析器会把它们移到表格之前。两种修补都让页面继续显示，所以要用 Elements 检查节点的实际父子关系，并用验证器核对源码。

`th` 的加粗也不能反过来证明表头关系：用 `td` 加上加粗样式，外观相同，结构里仍然没有表头。
:::

### 3. caption 与行组

`caption` 说明整张表的数据主题，必须是 `table` 的第一个子元素。`thead`、`tbody`、`tfoot` 按行分组，分别表示表头行、主体行和汇总行；它们分组的是行，不会改变其中 `td` 的含义。

| 元素 | 作用 | 数量与顺序 | 属性说明 |
|------|------|------------|----------|
| `caption` | 表格标题 | 最多一个，位于最前 | 无专用属性，文字直接写在元素内 |
| `thead` | 表头行组 | 最多一个，位于 `tbody` 之前 | 用于组织表头行 |
| `tbody` | 主体行组 | 可以有多个，位于 `thead` 之后、`tfoot` 之前 | 源码可省略，解析器会补出 |
| `tfoot` | 汇总行组 | 最多一个，位于 `tbody` 之后 | 用于组织汇总行 |

::: tip caption 与 th 的分工
`caption` 回答“这张表是什么”，`th` 回答“这一列或这一行是什么”。有 `caption` 不代表列标题可以省略，有 `th` 也不代表整张表不需要标题。
:::

```html
<table>
  <!-- caption 说明整张表，必须放在最前 -->
  <caption>文具库存</caption>
  <thead>
    <tr><th scope="col">物品</th><th scope="col">数量</th></tr>
  </thead>
  <tbody>
    <tr><th scope="row">铅笔</th><td>8</td></tr>
  </tbody>
</table>
```

预期观察：`caption` 显示在表格上方，但不占据数据行；`thead` 和 `tbody` 在 Elements 中各自形成分组。源码省略 `tbody` 时浏览器会自动补出，显示结果相同。

::: warning 顺序错误与自动补全
把 `caption` 放到 `tbody` 之后不符合内容模型，验证器会报告；结构的合法性以源码顺序为准，不能靠浏览器修补后的外观判断。`tfoot` 也应写在 `tbody` 之后，而不是像旧教程那样放在最前面。

`tbody` 被自动补出是解析行为，不代表源码可以随意省略行组。需要按行组设置样式或核对结构时，显式写出来更容易定位。
:::

## 二、表头与数据的关系

### 1. th 与 scope

`th` 与 `td` 的区别是语义，不是样式。`scope` 声明表头覆盖的方向：`col` 表示列表头，`row` 表示行表头，`rowgroup` 和 `colgroup` 分别表示整个行组或列组；不写时由浏览器推断。

| `scope` 取值 | 含义 | 适用场景 | 使用方式 |
|--------------|------|----------|----------|
| `col` | 表头作用于同一列中位于其后的数据单元格 | 列标题 | 写在表头行的 `th` 上 |
| `row` | 表头作用于同一行中位于其后的数据单元格 | 行标题 | 写在行首的 `th` 上 |
| `rowgroup` | 表头作用于所在行组的其余单元格 | 整个行组的标题 | 表头必须位于行组中 |
| `colgroup` | 表头作用于所在列组的其余单元格 | 整个列组的标题 | 表头必须对应列组 |

```html
<table>
  <tr><th scope="col">物品</th><th scope="col">数量</th></tr>
  <tr><th scope="row">铅笔</th><td>8</td></tr>
</table>
```

预期观察：读取“8”时，可以同时找到行表头“铅笔”和列表头“数量”。在开发者工具的 Accessibility 面板中，可以核对数据单元格与表头的关联，而不是只看页面文本。

::: tip 选择表头方向
先判断这个 `th` 是在说明“这一列是什么”，还是“这一行是什么”。前者用 `scope="col"`，后者用 `scope="row"`。同一张表可以同时存在两个方向；不要因为某个单元格在左侧就默认它是行标题。
:::

`scope` 只说明表头覆盖的方向，不负责把单元格变成表头；元素本身仍必须是 `th`。

::: warning 加粗不是表头
把行标题写成 `td` 再加粗，视觉上没有差别，但表头关系已经丢失，辅助技术无法从结构中获得行标题。`scope` 也不能随意扩大范围，`rowgroup` 只在行组内有效。
:::

### 2. headers 显式关联多层表头

当数据同时受年份、季度、月份等多层表头约束时，简单的 `scope` 不足以表达关系。这时给相关 `th` 设置唯一 `id`，再在数据单元格的 `headers` 中按空白分隔列出这些 id。

| 属性 | 写法 | 作用 | 使用边界 |
|------|------|------|----------|
| `id` | `id="jan"` | 给表头建立可引用的唯一标识 | 同一文档内不能重复 |
| `headers` | `headers="paper year quarter jan"` | 列出当前数据单元格关联的全部表头 id | 引用的 `th` 必须存在，且与数据单元格在同一张表中 |

```html
<!-- 数据单元格用 headers 列出四个表头 id -->
<tr>
  <th id="paper" scope="row">纸张</th>
  <td headers="paper year quarter jan">12</td>
  <td headers="paper year quarter feb">15</td>
</tr>
```

上面的片段必须放在同时包含 `id="year"`、`id="quarter"`、`id="jan"` 和 `id="feb"` 表头的同一张表中；完整结构见第五节。

预期观察：`12` 对应“纸张、2026 年、第一季度、一月”，`15` 对应“纸张、2026 年、第一季度、二月”。`headers` 的值是表头 id，不是显示文字，也不是 CSS 类名。

::: warning id 拼错不会改变外观
把 `jan` 拼成不存在的 `missing`，页面外观不变，但显式关联已经断开。这种错误只能靠验证器或逐个核对 id 发现；浏览器不会因为引用失效而给出可见报错。
:::

## 三、单元格跨度与逻辑网格

### 1. colspan 与 rowspan 的取值

`colspan` 让单元格向右跨列，`rowspan` 让它向下跨行。跨度占据的是网格位置，不是把内容复制到多个单元格；同一张表中的单元格不能互相重叠。单元格和网格的关系见 [表格处理模型](https://html.spec.whatwg.org/multipage/tables.html#processing-model-1)。

| 属性 | 取值 | 默认值 | 行为 | 使用方式 |
|------|------|--------|------|----------|
| `colspan` | 1～1000 的整数 | 1 | 向右占据指定列数 | 表头横跨多个数据列，或数据横向合并 |
| `rowspan` | 0～65534 的整数 | 1 | 向下占据指定行数；0 表示跨到行组末尾 | 表头纵跨多行，或数据纵向合并 |

```html
<table>
  <!-- “物品”向下跨两行，作为第一列的列标题 -->
  <tr><th rowspan="2" scope="col">物品</th><th colspan="2">2026 年</th></tr>
  <!-- 第二行只补后两列，第一列已被 rowspan 占用 -->
  <tr><th>一月</th><th>二月</th></tr>
  <tr><th scope="row">纸张</th><td>12</td><td>15</td></tr>
</table>
```

预期观察：表格有三列。第一列的“物品”纵向占据两行；“2026 年”横向占据后两列；第三行的“12”和“15”分别落在“一月”和“二月”下方。

::: tip 逐行计算已占位置
判断合并时，先在第一行把每个跨度覆盖的位置标出来，再进入下一行，跳过已经被上方 `rowspan` 占用的位置，只安排剩余单元格。这样能直接算出每一行应该写几个 `th`/`td`，而不是靠调整空格让表格看起来对齐。
:::

### 2. 跨度错误的判断

跨度写错通常不会产生可见报错：多写单元格会新增列，少写会留下空位，表格仍然可以渲染。判断依据是逻辑网格和 Elements 中的单元格数量。

| 现象 | 定位证据 | 修复与复测 |
|------|----------|------------|
| 表头与数据列错位 | 逐行计算跨度占用的位置，数每行实际单元格数 | 调整 `colspan`/`rowspan`，重新按网格核对 |
| 某行少一个单元格 | Elements 中该行 `th`/`td` 数量少于其他行 | 补上被跨度覆盖的单元格，或修正跨度 |
| 表格右侧多出空白列 | 某行声明的列数超过表头列数 | 检查是否多写了单元格或 `colspan` 过大 |
| 单元格互相覆盖 | 跨度范围与已有格子重叠 | 缩小跨度，保证每个网格位置只被一个单元格占用 |

::: warning 少写和多写都不会主动报错
浏览器会按解析规则补齐或扩展网格，因此“页面还能看”不能证明跨度正确。修改跨度后，至少核对一次表头行和数据行的单元格数量，再用验证器检查网格是否重叠。
:::

## 四、表现属性的现状

### 1. 为什么交给 CSS

HTML 负责结构，CSS 负责表现。`border`、`cellpadding`、`cellspacing`、`align`、`bgcolor`、`valign`、`nowrap`、`width`、`height` 这些属性直接控制外观，当前 HTML 标准已把它们列为不符合规范，样式应写在 CSS 中。这些属性的当前状态见 [HTML：过时特性](https://html.spec.whatwg.org/multipage/obsolete.html)。

::: info 规范状态
这些属性不是被浏览器“删除”，而是不再属于合规的 HTML 写法。旧页面是否仍能显示这些效果，取决于具体浏览器和文档模式，不能作为新代码的依据；验证器会把它们报告为错误或警告。
:::

### 2. 逐项替代

| 旧属性 | 作用 | 当前状态 | CSS 替代 | 使用说明 |
|--------|------|----------|----------|----------|
| `border` | 表格边框宽度 | 不符合规范 | `border` + `border-collapse` | 先合并边框，再设置单元格边框 |
| `cellpadding` | 单元格内边距 | 不符合规范 | `padding` | 写在 `th, td` 上 |
| `cellspacing` | 单元格间距 | 不符合规范 | `border-spacing` 或 `border-collapse: collapse` | 合并边框时通常不再需要间距 |
| `align` | 表格或单元格水平对齐 | 不符合规范 | `margin-inline`、`text-align` | 表格整体居中与单元格文字对齐分开处理 |
| `bgcolor` | 背景色 | 不符合规范 | `background-color` | 写在 `table`、`th` 或 `td` 上 |
| `valign` | 垂直对齐 | 不符合规范 | `vertical-align` | 写在 `th, td` 上 |
| `nowrap` | 禁止换行 | 不符合规范 | `white-space: nowrap` | 只在确实需要单行显示时使用 |
| `width` / `height` | 宽高 | 不符合规范 | CSS `width` / `height` | 优先使用自适应布局 |
| `summary`（`table`） | 表格摘要 | 不符合规范 | `caption` 或周围说明文字 | 摘要应能被所有读者看到 |

`abbr` 是 `th` 上仍然有效的属性，用于提供表头的缩写文本；`td` 上的 `abbr` 已不符合规范。表头文字本身仍应能独立说明含义，不能只依赖缩写。

旧写法与 CSS 写法的对照：

```html
<table border="1" cellpadding="8" cellspacing="0" bgcolor="#f8f9fa">
```

```css
table {
  border-collapse: collapse; /* 合并相邻边框，替代 cellspacing="0" */
  background-color: #f8f9fa; /* 替代 bgcolor */
}
th, td {
  border: 1px solid #777; /* 替代 border="1" */
  padding: 8px; /* 替代 cellpadding="8" */
}
```

预期观察：两种写法的边框、内边距和背景色接近；使用 CSS 的版本在验证器中不再报告上述属性。

### 3. 迁移旧页面

::: tip 迁移顺序
先确认当前视觉效果来自哪一条旧属性，再用 CSS 复现同样的效果，最后删除旧属性并跑一次验证器。不要一次性删掉全部属性，否则很难判断布局变化由哪一项引起。
:::

1. 在 Elements 中选中表格，查看生效的旧属性与对应样式。
2. 用 `border-collapse`、`padding`、`background-color` 等 CSS 复现视觉结果。
3. 删除 `border`、`cellpadding`、`cellspacing` 等属性，保存后刷新对比。
4. 用 Nu HTML Checker 复检，确认报告中的旧属性消失且没有引入新错误。

::: warning 浏览器仍显示不代表可以继续使用
旧页面可能因为兼容实现继续显示，但这不是新代码的依据。迁移时以验证器结果和 CSS 规则为准，不以“我这里看起来正常”为准。
:::

## 五、独立核对与失败恢复

### 1. 创建并打开示例

在新建的空目录 `html-tables` 中创建 `stock.html`，按 UTF-8 保存。文件包含两张表：第一张演示行列表头、行组和汇总；第二张只保留一个数据行，用于核对跨度和多层表头关联。样式写在文件内，不依赖外部资源。

::: details 查看 stock.html 完整内容

```html [stock.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>表格结构对照</title>
  <style>
    /* 用 CSS 控制边框与间距，避免使用已废弃的表现属性 */
    table { border-collapse: collapse; margin-bottom: 24px; }
    th, td { border: 1px solid #777; padding: 6px 12px; }
    caption { text-align: left; font-weight: bold; }
  </style>
</head>
<body>
  <h1>表格结构对照</h1>
  <table id="stock">
    <caption>文具数量与单价</caption>
    <thead>
      <!-- 三个列标题：scope="col" 声明它们分别作用于整列 -->
      <tr><th scope="col">物品</th><th scope="col">数量</th><th scope="col">单价（元）</th></tr>
    </thead>
    <tbody>
      <!-- 每行第一个 th 是行标题，后面的 td 才是数据 -->
      <tr><th scope="row">铅笔</th><td>8</td><td>2.00</td></tr>
      <tr><th scope="row">橡皮</th><td>10</td><td>1.50</td></tr>
      <tr><th scope="row">笔记本</th><td>5</td><td>6.00</td></tr>
    </tbody>
    <tfoot>
      <!-- 汇总行放在 tfoot 中，位置在 tbody 之后 -->
      <tr><th scope="row">数量合计</th><td>23</td><td>不适用</td></tr>
    </tfoot>
  </table>
  <table id="multi">
    <caption>纸张月度数量：多层表头对照</caption>
    <thead>
      <!-- 第一列跨三行；年份与季度分别跨两列 -->
      <tr><th rowspan="3" scope="col">物品</th><th id="year" colspan="2">2026 年</th></tr>
      <tr><th id="quarter" colspan="2">第一季度</th></tr>
      <tr><th id="jan">一月</th><th id="feb">二月</th></tr>
    </thead>
    <tbody>
      <!-- headers 用四个 id 声明这一行数据关联的全部表头 -->
      <tr>
        <th id="paper" scope="row">纸张</th>
        <td headers="paper year quarter jan">12</td>
        <td headers="paper year quarter feb">15</td>
      </tr>
    </tbody>
  </table>
</body>
</html>
```

:::

打开后按以下观察项核对：

| 观察对象 | 预期结果 | 判断依据 |
|----------|----------|----------|
| 第一张表列数 | 3 列 | 表头为物品、数量、单价 |
| `8` 的含义 | 铅笔的数量 | 行标题“铅笔”与列表头“数量” |
| `23` 的含义 | 数量合计 | 位于 `tfoot`，不是价格合计 |
| 第二张表逻辑列数 | 3 列 | “物品”跨 3 行，“2026 年”和“第一季度”各跨 2 列 |
| `12` 的关联 | 纸张、2026 年、第一季度、一月 | `headers` 中的四个 id |

### 2. 核对 DOM 与表头关联

1. 在 Elements 中展开 `#stock`，确认每个 `td` 的父元素是 `tr`，`thead`、`tbody`、`tfoot` 的行组顺序正确。
2. 展开 `#multi`，确认 `year`、`quarter`、`jan`、`feb`、`paper` 五个 id 都存在且唯一。
3. 选中一个数据单元格，在 Accessibility 面板中核对它与表头的关联，不只看页面文本。
4. 对照上一节的观察表，确认每个数据的行列含义都能被读出。

::: tip 先结构后语义
先核对节点层级和 id 引用，再看无障碍面板。结构错了，辅助技术读出的表头关系也会跟着错；只检查外观会漏掉 `headers` 拼写错误这类问题。
:::

### 3. 注入错误并恢复

1. 把 `stock.html` 复制为 `invalid.html`，把“2026 年”的 `colspan="2"` 改成 `colspan="3"`。打开后比较表头与数据列，原本三列的设计被扩大；不要靠添加空格掩盖错位。
2. 再把一月数据的 `headers` 中的 `jan` 改成不存在的 `missing`。页面外观可能仍然接近原表，但显式关联已经断开。
3. 把 `invalid.html` 上传到 [Nu HTML Checker](https://validator.w3.org/nu/)，按报告定位跨度与表头引用问题。
4. 修复时把跨度恢复为 `2`、引用恢复为 `jan`，保存为 `repaired.html`，重新打开并复检。

::: warning 两类错误都没有可见报错
跨度扩大和 `headers` 失效都不会让浏览器弹出提示。判断依据是逻辑网格、Elements 中的单元格数量、id 是否存在，以及验证器报告；页面是否整齐不能作为通过标准。
:::

### 4. 验证记录

::: info 验证边界
完整示例于 2026-11-14 在 macOS 的 Chrome 157.0.8103.79 中核对：正常和修复版本通过 Nu HTML Checker，故意错误版本报告表格网格及表头引用问题。核对覆盖 DOM、跨度和显式引用，不包含具体屏幕阅读器的朗读结果。本次同步在示例中补充了注释，没有改变元素、属性与嵌套关系。
:::
