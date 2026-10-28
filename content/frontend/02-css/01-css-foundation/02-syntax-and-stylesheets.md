---
title: "CSS 语法与引入"
tags:
  - CSS
  - HTML
excerpt: "介绍 CSS 规则、声明、注释和三种引入方式，通过独立 HTML 与 CSS 文件验证样式加载，并解释路径错误、无效声明、选择器列表与简写重置的边界。"
---

# CSS 语法与引入

**CSS 规则**由选择器和声明块组成。选择器决定样式应用到哪些元素；声明块中的每条声明，通过“属性名: 属性值”表达一项呈现要求。

## 一、规则与声明

### 1. 基本语法

以下规则是局部 CSS，假设页面有类名为 `notice` 的元素：

```css
/* 通知文字与背景 */
.notice {
  color: #164e3b;
  background-color: #e7f6ee;
  padding: 12px;
}
```

1. `.notice` 是**选择器**，匹配带有 `notice` 类名的元素。
2. `{ ... }` 是**声明块**，容纳这个规则的声明。
3. `color` 是**属性名**，`#164e3b` 是对应的**属性值**。
4. `;` 分隔声明。最后一条声明也保留分号，便于追加和修改。

CSS 注释使用 `/* ... */`，不能使用 JavaScript 的 `//`。空格和换行帮助阅读，但不能代替分号。

### 2. 简写会设置多个属性

`padding`、`border`、`background` 等是**简写属性**，一次声明会设置一组相关的长写属性。未写出的子项通常也会被重置，而不是保留原值。

下面的局部规则没有保留原来的背景颜色：

```css
.notice {
  background-color: #e7f6ee;
  background: none;
}
```

`background: none` 除了移除背景图片，也把背景颜色重置为透明。只想关闭图片时，应使用 `background-image: none`。

::: warning 简写不是只覆盖写出的部分
调整简写前，检查它涉及哪些长写属性。开发者工具展开简写后可以看到被一起设置的子项。
:::

## 二、样式的三种引入方式

| 方式 | 写在哪里 | 主要适用情况 |
|------|----------|--------------|
| 外部样式表 | `<link rel="stylesheet" href="styles.css">` | 多页面复用、样式单独维护 |
| 页面内样式 | HTML 的 `<style>` 元素 | 独立演示、当前页面的小范围样式 |
| 内联样式 | 元素的 `style` 属性 | 单个元素的动态值或局部验证 |

外部样式和页面内样式都包含完整 CSS 规则。内联样式只填写声明，例如 `<p style="color: green">内容</p>`，不写选择器和花括号。

::: info 引入方式与冲突优先级不是同一个问题
外部样式和 `<style>` 不会仅因存放位置而天然分出高低。内联普通声明通常高于作者样式表中的普通声明，但仍有重要声明和过渡等边界，具体见[层叠与优先级](../02-style-computation/03-cascade-specificity.md)。
:::

## 三、创建一个独立页面

### 1. 创建文件

在空目录 `css-start` 中创建 `index.html` 和 `styles.css`。使用现代浏览器即可直接打开页面，不需要 Node.js 或文档站服务。

`index.html` 的完整内容如下。`href` 从当前 HTML 所在位置解析，因此两个文件放在同一目录：

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CSS 引入</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <p class="notice">样式文件已应用。</p>
</body>
</html>
```

:::

`styles.css` 使用以下完整内容，设置文字、背景和内边距：

```css [styles.css]
.notice {
  color: #164e3b;
  background-color: #e7f6ee;
  padding: 12px;
  border: 1px solid #7ab89c;
}
```

### 2. 打开与观察

1. 用浏览器打开 `index.html`，应出现深绿色文字、浅绿色背景和边框。
2. 打开开发者工具，选中这个 `<p>`。在 Styles 面板应看到来自 `styles.css` 的 `.notice` 规则。
3. 暂时取消 `padding` 声明的勾选。文字与边框的距离缩小，说明声明已被匹配并应用。

这组结果验证了“文件加载 → 选择器匹配 → 声明生效”。它没有证明多条冲突规则如何裁决。

## 四、无效样式的判断

### 1. 文件没有加载

把 `href` 临时改为不存在的 `style.css`，刷新后页面恢复浏览器默认外观。Styles 面板也不再显示外部 `.notice` 规则。

1. 核对真实文件名与 `href` 是否一致，包括扩展名。
2. 核对相对路径。CSS 中 `url(...)` 的相对路径通常以样式表文件为基准，不是以 HTML 为基准。
3. 恢复 `styles.css` 并刷新，再确认规则重新出现。

### 2. 文件加载了，但声明无效

局部错误声明如下，省略未修改的规则：

```css
.notice {
  color: #164e3b;
  padding: blue;
}
```

`padding` 需要合法长度或百分比等取值，`blue` 不符合语法，因此该声明被忽略；合法的 `color` 仍可生效。开发者工具通常会标记无效值，而不是报出整页停止执行的错误。

::: warning 无效选择器可能使整条规则失效
普通逗号选择器列表中若包含无效选择器，整条规则可能被丢弃。`:is()`、`:where()` 的参数使用宽容选择器列表，能丢弃无效项；不能把这种容错推广到所有选择器列表。
:::

如果规则存在、声明合法却被划线，通常需要检查冲突；如果规则根本没有出现，应先查加载、条件和匹配。CSS 的语法与解析边界可参照 [CSS Syntax](https://www.w3.org/TR/css-syntax-3/)。
