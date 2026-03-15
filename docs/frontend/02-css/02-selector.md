---
title: "CSS选择器"
category: "前端 · CSS"
tags:
  - CSS
excerpt: "CSS选择器是CSS规则的第一部分，它用于选择需要应用样式的HTML元素。选择器告诉浏览器应该对哪些元素应用特定的样式规则。 选择器的主要作用： 定位元素：精确选择需要应用样式的HTML元素 提高代码复用性：通过选择器可以将相同的样式应用到..."
---

# CSS选择器

## 一、选择器概述

::: tip 选择器定义
CSS选择器是CSS规则的第一部分，它用于选择需要应用样式的HTML元素。选择器告诉浏览器应该对哪些元素应用特定的样式规则。
:::

选择器的主要作用：

1. **定位元素**：精确选择需要应用样式的HTML元素
2. **提高代码复用性**：通过选择器可以将相同的样式应用到多个元素上
3. **增强可维护性**：使用有意义的选择器可以使CSS代码更易于理解和维护
4. **实现复杂布局**：通过高级选择器可以实现复杂的页面布局和效果

## 二、基本选择器

### 2.1 通用选择器

::: info 通用选择器
通用选择器（*）匹配文档中的所有元素。它通常用于重置默认样式或设置全局样式。
:::

**语法：**
```css
* {
  属性: 值;
}
```

**示例：**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
```

这个例子使用通用选择器重置所有元素的margin和padding为0，并设置box-sizing为border-box。

### 2.2 元素选择器

::: info 元素选择器
元素选择器（也称为标签选择器）根据HTML元素的名称来选择元素。
:::

**语法：**
```css
元素名 {
  属性: 值;
}
```

**示例：**

```css
h1 {
  color: #333;
  font-size: 24px;
  font-weight: bold;
}

p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 16px;
}
```

这个例子使用元素选择器为h1和p元素设置不同的样式。

### 2.3 ID选择器

::: info ID选择器
ID选择器使用HTML元素的ID属性来选择特定的元素。ID在文档中应该是唯一的，每个ID只能应用于一个元素。
:::

**语法：**
```css
#id名 {
  属性: 值;
}
```

**示例：**

```html
<div id="header">
  <h1>网站标题</h1>
</div>
```

```css
#header {
  background-color: #f5f5f5;
  padding: 20px;
  border-bottom: 1px solid #ddd;
}
```

这个例子使用ID选择器为id="header"的div元素设置样式。

### 2.4 类选择器

::: info 类选择器
类选择器使用HTML元素的class属性来选择元素。与ID不同，class可以应用于多个元素，一个元素也可以有多个class。
:::

**语法：**
```css
.类名 {
  属性: 值;
}
```

**示例：**

```html
<div class="container">
  <p class="text-primary">这是主要文本</p>
  <p class="text-secondary">这是次要文本</p>
  <p class="text-primary highlight">这是带高亮的主要文本</p>
</div>
```

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.text-primary {
  color: #007bff;
  font-weight: 500;
}

.text-secondary {
  color: #6c757d;
}

.highlight {
  background-color: #fff3cd;
  padding: 2px 4px;
  border-radius: 3px;
}
```

这个例子使用类选择器为不同的元素设置样式，并且展示了如何为一个元素应用多个类。

## 三、组合选择器

### 3.1 后代选择器

::: info 后代选择器
后代选择器（也称为包含选择器）选择元素内部的所有后代元素，无论它们在DOM树中的深度如何。
:::

**语法：**
```css
祖先元素 后代元素 {
  属性: 值;
}
```

**示例：**

```html
<nav class="main-nav">
  <ul>
    <li><a href="#">首页</a></li>
    <li><a href="#">关于我们</a></li>
    <li>
      <a href="#">产品中心</a>
      <ul>
        <li><a href="#">产品1</a></li>
        <li><a href="#">产品2</a></li>
      </ul>
    </li>
  </ul>
</nav>
```

```css
.main-nav a {
  color: #333;
  text-decoration: none;
  padding: 5px 10px;
  display: block;
}

.main-nav a:hover {
  color: #007bff;
  background-color: #f8f9fa;
}
```

这个例子使用后代选择器选择.main-nav元素内的所有a元素，并为它们设置样式。

### 3.2 子选择器

::: info 子选择器
子选择器选择元素的直接子元素，不包括更深层次的后代元素。
:::

**语法：**
```css
父元素 > 子元素 {
  属性: 值;
}
```

**示例：**

```html
<ul class="parent-list">
  <li>项目1</li>
  <li>项目2
    <ul>
      <li>子项目1</li>
      <li>子项目2</li>
    </ul>
  </li>
  <li>项目3</li>
</ul>
```

```css
.parent-list > li {
  color: #007bff;
  font-weight: bold;
  margin-bottom: 10px;
}
```

这个例子使用子选择器只选择.parent-list的直接子元素（li），而不包括li内部的ul中的li元素。

### 3.3 相邻兄弟选择器

::: info 相邻兄弟选择器
相邻兄弟选择器选择紧接在另一个元素后面的元素，且它们共享同一个父元素。
:::

**语法：**
```css
元素1 + 元素2 {
  属性: 值;
}
```

**示例：**

```html
<h2>标题</h2>
<p>这是紧接在标题后面的段落</p>
<p>这是另一个段落</p>
```

```css
h2 + p {
  color: #007bff;
  font-weight: bold;
  margin-top: 5px;
}
```

这个例子使用相邻兄弟选择器选择紧接在h2元素后面的p元素，并为其设置样式。

### 3.4 通用兄弟选择器

::: info 通用兄弟选择器
通用兄弟选择器选择在另一个元素后面的所有兄弟元素，且它们共享同一个父元素。
:::

**语法：**
```css
元素1 ~ 元素2 {
  属性: 值;
}
```

**示例：**

```html
<h2>标题</h2>
<p>段落1</p>
<div>分隔符</div>
<p>段落2</p>
<p>段落3</p>
```

```css
h2 ~ p {
  color: #6c757d;
  margin-left: 20px;
}
```

这个例子使用通用兄弟选择器选择在h2元素后面的所有p元素，并为它们设置样式，无论它们之间是否有其他元素。

## 四、属性选择器

### 4.1 基本属性选择器

::: info 基本属性选择器
基本属性选择器选择具有指定属性的元素，无论属性值是什么。
:::

**语法：**
```css
[属性名] {
  属性: 值;
}
```

**示例：**

```html
<a href="#">链接1</a>
<a>链接2（没有href属性）</a>
<input type="text" placeholder="输入文本">
<input type="submit" value="提交">
```

```css
[a]
  color: #007bff;
  text-decoration: none;
}

[placeholder] {
  border: 1px solid #ddd;
  padding: 5px 10px;
  border-radius: 3px;
}
```

这个例子使用基本属性选择器选择具有href属性的a元素和具有placeholder属性的input元素，并为它们设置样式。

### 4.2 精确属性值选择器

::: info 精确属性值选择器
精确属性值选择器选择具有指定属性和确切值的元素。
:::

**语法：**
```css
[属性名="属性值"] {
  属性: 值;
}
```

**示例：**

```html
<input type="text" value="文本输入">
<input type="password" value="密码">
<input type="submit" value="提交">
```

```css
[type="text"] {
  background-color: #fff;
  border: 1px solid #ddd;
}

[type="password"] {
  background-color: #f8f9fa;
  border: 1px solid #ddd;
}

[type="submit"] {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 5px 15px;
  cursor: pointer;
}
```

这个例子使用精确属性值选择器根据input元素的type属性值为不同类型的输入框设置不同的样式。

### 4.3 属性值包含选择器

::: info 属性值包含选择器
属性值包含选择器选择属性值包含指定字符串的元素。
:::

**语法：**
```css
[属性名*="字符串"] {
  属性: 值;
}
```

**示例：**

```html
<a href="https://www.example.com">Example网站</a>
<a href="https://www.test.com">Test网站</a>
<a href="http://www.example.org">Example组织</a>
```

```css
[href*="example"] {
  color: #28a745;
  font-weight: bold;
}
```

这个例子使用属性值包含选择器选择href属性值中包含"example"字符串的a元素，并为它们设置样式。

### 4.4 属性值开头选择器

::: info 属性值开头选择器
属性值开头选择器选择属性值以指定字符串开头的元素。
:::

**语法：**
```css
[属性名^="字符串"] {
  属性: 值;
}
```

**示例：**

```html
<a href="https://www.example.com">HTTPS链接</a>
<a href="http://www.example.com">HTTP链接</a>
<a href="ftp://files.example.com">FTP链接</a>
```

```css
[href^="https"] {
  color: #28a745;
  background-color: #d4edda;
  padding: 2px 4px;
  border-radius: 3px;
}

[href^="http:"] {
  color: #dc3545;
  background-color: #f8d7da;
  padding: 2px 4px;
  border-radius: 3px;
}
```

这个例子使用属性值开头选择器根据a元素的href属性值的开头部分为不同类型的链接设置不同的样式。

### 4.5 属性值结尾选择器

::: info 属性值结尾选择器
属性值结尾选择器选择属性值以指定字符串结尾的元素。
:::

**语法：**
```css
[属性名$="字符串"] {
  属性: 值;
}
```

**示例：**

```html
<a href="document.pdf">PDF文档</a>
<a href="image.jpg">JPG图片</a>
<a href="video.mp4">MP4视频</a>
```

```css
[href$=".pdf"] {
  color: #dc3545;
  font-weight: bold;
}

[href$=".jpg"] {
  color: #28a745;
  font-weight: bold;
}

[href$=".mp4"] {
  color: #ffc107;
  font-weight: bold;
}
```

这个例子使用属性值结尾选择器根据a元素的href属性值的结尾部分（文件扩展名）为不同类型的文件链接设置不同的样式。

### 4.6 属性值单词选择器

::: info 属性值单词选择器
属性值单词选择器选择属性值中包含指定完整单词的元素，单词之间用空格分隔。
:::

**语法：**
```css
[属性名~="单词"] {
  属性: 值;
}
```

**示例：**

```html
<div class="box primary">主要盒子</div>
<div class="box secondary">次要盒子</div>
<div class="box primary highlight">带高亮的主要盒子</div>
<div class="box-primary">主盒子（使用连字符）</div>
```

```css
[class~="primary"] {
  background-color: #007bff;
  color: white;
  padding: 10px;
  border-radius: 3px;
}
```

这个例子使用属性值单词选择器选择class属性值中包含完整单词"primary"的div元素，并为它们设置样式。注意，它不会匹配class="box-primary"的元素，因为"primary"不是一个完整的单词。

## 五、伪类选择器

### 5.1 链接伪类

::: info 链接伪类
链接伪类用于定义链接的不同状态。
:::

**常用的链接伪类：**

| 伪类 | 描述 |
|------|------|
| `:link` | 未访问的链接 |
| `:visited` | 已访问的链接 |
| `:hover` | 鼠标悬停在链接上 |
| `:active` | 链接被激活（点击时） |

**示例：**

```html
<a href="#">普通链接</a>
<a href="#about">关于我们</a>
```

```css
a:link {
  color: #007bff;
  text-decoration: none;
}

a:visited {
  color: #6c757d;
}

a:hover {
  color: #0056b3;
  text-decoration: underline;
}

a:active {
  color: #004085;
}
```

这个例子使用链接伪类为a元素的不同状态设置不同的样式。

### 5.2 用户操作伪类

::: info 用户操作伪类
用户操作伪类用于定义用户与元素交互时的样式。
:::

**常用的用户操作伪类：**

| 伪类 | 描述 |
|------|------|
| `:hover` | 鼠标悬停在元素上 |
| `:active` | 元素被激活（点击时） |
| `:focus` | 元素获得焦点（通过键盘或鼠标点击） |
| `:focus-within` | 元素或其内部的任何元素获得焦点 |
| `:focus-visible` | 元素通过键盘操作获得焦点时 |

**示例：**

```html
<input type="text" placeholder="输入文本">
<button>点击我</button>
<div class="focus-within-example">
  <label for="name">姓名：</label>
  <input type="text" id="name">
</div>
```

```css
input:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

button:hover {
  background-color: #007bff;
  color: white;
  cursor: pointer;
}

button:active {
  background-color: #0056b3;
}

.focus-within-example {
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 5px;
}

.focus-within-example:focus-within {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

input:focus-visible {
  border-color: #28a745;
  box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.25);
}
```

这个例子使用用户操作伪类为input和button元素的不同状态设置不同的样式，并展示了:focus-within和:focus-visible伪类的使用。

### 5.3 结构伪类

::: info 结构伪类
结构伪类用于根据元素在DOM树中的位置来选择元素。
:::

**常用的结构伪类：**

| 伪类 | 描述 |
|------|------|
| `:first-child` | 父元素的第一个子元素 |
| `:last-child` | 父元素的最后一个子元素 |
| `:only-child` | 父元素的唯一子元素 |
| `:nth-child(n)` | 父元素的第n个子元素 |
| `:nth-last-child(n)` | 父元素的倒数第n个子元素 |
| `:first-of-type` | 父元素中特定类型的第一个子元素 |
| `:last-of-type` | 父元素中特定类型的最后一个子元素 |
| `:only-of-type` | 父元素中特定类型的唯一子元素 |
| `:nth-of-type(n)` | 父元素中特定类型的第n个子元素 |
| `:nth-last-of-type(n)` | 父元素中特定类型的倒数第n个子元素 |

**n的取值：**
- 数字：如1, 2, 3等
- 关键字：even（偶数）, odd（奇数）
- 表达式：如2n, 2n+1, 3n等

**示例：**

```html
<ul class="list">
  <li>项目1</li>
  <li>项目2</li>
  <li>项目3</li>
  <li>项目4</li>
  <li>项目5</li>
</ul>

<div class="mixed-content">
  <h2>标题</h2>
  <p>段落1</p>
  <p>段落2</p>
  <div>分隔符</div>
  <p>段落3</p>
</div>
```

```css
/* 选择第一个和最后一个子元素 */
.list li:first-child {
  background-color: #007bff;
  color: white;
}

.list li:last-child {
  background-color: #dc3545;
  color: white;
}

/* 选择奇数和偶数子元素 */
.list li:nth-child(odd) {
  font-weight: bold;
}

.list li:nth-child(even) {
  font-style: italic;
}

/* 选择特定位置的子元素 */
.list li:nth-child(3) {
  text-decoration: underline;
}

/* 使用表达式选择子元素 */
.list li:nth-child(2n+1) {
  padding: 10px;
}

/* 选择特定类型的第一个和最后一个子元素 */
.mixed-content p:first-of-type {
  color: #007bff;
}

.mixed-content p:last-of-type {
  color: #dc3545;
}

/* 选择特定类型的第n个子元素 */
.mixed-content p:nth-of-type(2) {
  font-weight: bold;
}
```

这个例子使用结构伪类选择不同位置的li和p元素，并为它们设置样式。

### 5.4 表单相关伪类

::: info 表单相关伪类
表单相关伪类用于选择表单元素的不同状态。
:::

**常用的表单相关伪类：**

| 伪类 | 描述 |
|------|------|
| `:checked` | 选中的单选按钮或复选框 |
| `:disabled` | 禁用的元素 |
| `:enabled` | 启用的元素 |
| `:required` | 必填的表单元素 |
| `:optional` | 可选的表单元素 |
| `:valid` | 有效的表单元素 |
| `:invalid` | 无效的表单元素 |
| `:in-range` | 输入值在指定范围内的元素 |
| `:out-of-range` | 输入值超出指定范围的元素 |
| `:read-only` | 只读的元素 |
| `:read-write` | 可读写的元素 |

**示例：**

```html
<form>
  <div class="form-group">
    <label for="name">姓名（必填）：</label>
    <input type="text" id="name" required>
  </div>
  
  <div class="form-group">
    <label for="email">邮箱（必填，需要有效格式）：</label>
    <input type="email" id="email" required>
  </div>
  
  <div class="form-group">
    <label for="age">年龄（18-60岁）：</label>
    <input type="number" id="age" min="18" max="60">
  </div>
  
  <div class="form-group">
    <label for="comment">评论（可选）：</label>
    <input type="text" id="comment" disabled>
  </div>
  
  <div class="form-group">
    <label>
      <input type="checkbox" id="agree"> 我同意条款
    </label>
  </div>
  
  <div class="form-group">
    <label>
      <input type="radio" name="gender" value="male"> 男
    </label>
    <label>
      <input type="radio" name="gender" value="female"> 女
    </label>
  </div>
  
  <button type="submit">提交</button>
</form>
```

```css
.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

/* 必填和选填字段 */
input:required {
  border-left: 3px solid #dc3545;
}

input:optional {
  border-left: 3px solid #6c757d;
}

/* 有效和无效输入 */
input:valid {
  border-color: #28a745;
}

input:invalid {
  border-color: #dc3545;
}

/* 聚焦状态 */
input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

/* 禁用的输入 */
input:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

/* 选中的复选框和单选按钮 */
input:checked {
  accent-color: #007bff;
}

/* 输入值在范围内和超出范围 */
input:in-range {
  border-color: #28a745;
}

input:out-of-range {
  border-color: #dc3545;
}
```

这个例子使用表单相关伪类为不同状态的表单元素设置样式，包括必填/选填字段、有效/无效输入、聚焦状态、禁用状态、选中状态以及输入值在范围/超出范围的状态。

## 六、伪元素选择器

::: info 伪元素选择器
伪元素选择器用于选择元素的特定部分，而不是元素本身。伪元素使用双冒号（::）表示（虽然单冒号（:）在旧版本浏览器中也可以工作，但双冒号是推荐的语法）。
:::

### 6.1 常用的伪元素

| 伪元素 | 描述 |
|--------|------|
| `::before` | 在元素内容前插入内容 |
| `::after` | 在元素内容后插入内容 |
| `::first-line` | 元素的第一行 |
| `::first-letter` | 元素的第一个字母 |
| `::selection` | 用户选择的文本部分 |

### 6.2 伪元素示例

#### 6.2.1 ::before和::after

::: tip ::before和::after
`::before`和`::after`伪元素用于在元素内容的前后插入内容。这些内容是通过CSS的`content`属性定义的，并且是内联的。
:::

**示例：**

```html
<h2>标题</h2>
<p class="quote">这是一段引用文本</p>
<ul class="custom-list">
  <li>项目1</li>
  <li>项目2</li>
  <li>项目3</li>
</ul>
<div class="tooltip" data-tooltip="这是一个提示">悬停查看提示</div>
```

```css
h2::before {
  content: "🌟 ";
  color: #ffc107;
}

.quote {
  position: relative;
  padding: 15px 20px;
  background-color: #f8f9fa;
  border-radius: 5px;
  font-style: italic;
}

.quote::before,
.quote::after {
  font-size: 30px;
  color: #007bff;
  position: absolute;
}

.quote::before {
  content: "\"";
  top: -10px;
  left: 5px;
}

.quote::after {
  content: "\"";
  bottom: -15px;
  right: 10px;
}

.custom-list li {
  position: relative;
  padding-left: 25px;
  margin-bottom: 10px;
  list-style: none;
}

.custom-list li::before {
  content: "✓";
  position: absolute;
  left: 0;
  top: 0;
  background-color: #28a745;
  color: white;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  text-align: center;
  line-height: 18px;
  font-size: 12px;
}

.tooltip {
  position: relative;
  display: inline-block;
  padding: 5px 10px;
  background-color: #007bff;
  color: white;
  border-radius: 3px;
  cursor: help;
}

.tooltip::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: white;
  padding: 5px 10px;
  border-radius: 3px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.tooltip::before {
  content: "";
  position: absolute;
  bottom: 115%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: #333 transparent transparent transparent;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.tooltip:hover::after,
.tooltip:hover::before {
  opacity: 1;
  visibility: visible;
}
```

这个例子展示了如何使用`::before`和`::after`伪元素：
- 为标题添加星星图标
- 为引用文本添加引号
- 为列表项添加自定义的项目符号
- 创建一个带有提示框的元素

#### 6.2.2 ::first-line和::first-letter

::: tip ::first-line和::first-letter
`::first-line`伪元素用于选择元素的第一行，`::first-letter`伪元素用于选择元素的第一个字母。
:::

**示例：**

```html
<p class="drop-cap">这是一个段落，用于演示首字下沉效果。首字下沉是一种排版技巧，常用于书籍、杂志和报纸的文章开头，通过放大第一个字母并使其下沉到下面几行文本中，来吸引读者的注意力。</p>

<p class="first-line">这是一个段落的第一行。当文本换行时，这部分内容会被特殊处理。第一行可能包含多个单词，但只有第一行会应用特殊样式。</p>
```

```css
.drop-cap {
  font-size: 16px;
  line-height: 1.8;
}

.drop-cap::first-letter {
  font-size: 48px;
  font-weight: bold;
  color: #007bff;
  float: left;
  margin-right: 8px;
  margin-top: -10px;
  line-height: 1;
}

.first-line {
  font-size: 16px;
  line-height: 1.8;
  max-width: 500px;
}

.first-line::first-line {
  font-weight: bold;
  color: #007bff;
  text-transform: uppercase;
  letter-spacing: 1px;
}
```

这个例子展示了如何使用`::first-letter`创建首字下沉效果，以及如何使用`::first-line`为段落的第一行设置特殊样式。

#### 6.2.3 ::selection

::: tip ::selection
`::selection`伪元素用于选择用户选中的文本部分。
:::

**示例：**

```html
<p>选中这段文本，看看会发生什么！</p>
<h3>也可以选择这个标题试试</h3>
<div class="custom-selection">在这个div中，选中的文本会有不同的颜色和背景。</div>
```

```css
/* 全局选中文本样式 */
::selection {
  background-color: #007bff;
  color: white;
}

/* 标题选中文本样式 */
h3::selection {
  background-color: #dc3545;
  color: white;
}

/* 特定元素中的选中文本样式 */
.custom-selection::selection {
  background-color: #28a745;
  color: white;
}
```

这个例子展示了如何使用`::selection`伪元素为不同元素中的选中文本设置不同的样式。

## 七、选择器的优先级

::: info 优先级规则
当多个CSS规则应用于同一个元素时，浏览器会根据选择器的优先级来决定使用哪个规则。优先级是通过计算选择器中不同类型选择器的数量来确定的。
:::

### 7.1 优先级计算规则

优先级从高到低依次为：

1. **内联样式**（在HTML元素的style属性中定义）：优先级为1000
2. **ID选择器**：每个ID选择器贡献100点优先级
3. **类选择器、属性选择器、伪类选择器**：每个贡献10点优先级
4. **元素选择器、伪元素选择器**：每个贡献1点优先级
5. **通用选择器（*）、组合选择器（+, >, ~, 空格）**：不贡献优先级

### 7.2 优先级示例

| 选择器 | 优先级计算 | 优先级值 |
|--------|------------|----------|
| `*` | 0 | 0 |
| `p` | 1个元素选择器 | 1 |
| `p.middle` | 1个元素选择器 + 1个类选择器 | 11 |
| `p#main` | 1个元素选择器 + 1个ID选择器 | 101 |
| `.main .content` | 2个类选择器 | 20 |
| `.main #content` | 1个类选择器 + 1个ID选择器 | 110 |
| `div.main #content` | 1个元素选择器 + 1个类选择器 + 1个ID选择器 | 111 |
| `style=""` | 内联样式 | 1000 |
| `!important` | 最高优先级（覆盖所有其他规则） | 无限大 |

### 7.3 优先级示例代码

```html
<div id="container" class="box">
  <p class="text" id="paragraph">这是一段文本</p>
</div>
```

```css
/* 元素选择器 */
p {
  color: red; /* 优先级：1 */
}

/* 类选择器 */
.text {
  color: blue; /* 优先级：10 */
}

/* ID选择器 */
#paragraph {
  color: green; /* 优先级：100 */
}

/* 组合选择器 */
.box p {
  color: purple; /* 优先级：1 + 1 = 2 */
}

#container .text {
  color: orange; /* 优先级：100 + 10 = 110 */
}

/* 内联样式 */
/* style="color: black;" 优先级：1000 */

/* !important */
.text {
  color: yellow !important; /* 优先级：无限大 */
}
```

在这个例子中，由于`.text { color: yellow !important; }`使用了`!important`，所以段落的文本颜色会是黄色，除非有其他使用`!important`的规则具有更高的优先级。

## 八、选择器的最佳实践

### 8.1 选择器使用建议

::: tip 使用建议
在使用CSS选择器时，应遵循以下最佳实践：

1. **保持选择器简单**：尽量使用简单的选择器，避免过度复杂的嵌套和组合
2. **优先使用类选择器**：类选择器比ID选择器和元素选择器更灵活，更适合用于样式定义
3. **避免使用ID选择器进行样式设计**：ID选择器具有较高的优先级，可能导致样式覆盖问题，应主要用于JavaScript操作
4. **避免使用内联样式**：内联样式难以维护，且优先级过高，应尽量使用外部或内部样式表
5. **避免使用!important**：`!important`会破坏CSS的层叠机制，使样式难以维护，应尽量避免使用
6. **使用有意义的类名**：选择清晰、描述性的类名，提高代码的可读性和可维护性
7. **避免过度使用后代选择器**：过度使用后代选择器会增加CSS的特异性，且可能影响性能
:::

### 8.2 选择器性能考虑

::: info 性能考虑
选择器的性能对页面渲染速度有一定影响，以下是一些提高选择器性能的建议：

1. **选择器的匹配顺序**：浏览器从右到左匹配选择器，因此最右侧的选择器（关键选择器）对性能影响最大
2. **避免使用通配符选择器**：通配符选择器会匹配所有元素，性能较差
3. **避免使用属性选择器作为关键选择器**：属性选择器的匹配速度较慢
4. **避免使用复杂的伪类选择器**：某些伪类选择器（如`:nth-child(n)`）的计算成本较高
5. **减少选择器的特异性**：特异性越低的选择器，匹配速度越快
6. **使用CSS预处理器**：如Sass、Less等，可以帮助组织和优化CSS代码
:::

## 九、总结

CSS选择器是CSS的核心概念之一，它允许我们精确地选择需要应用样式的HTML元素。通过本文的学习，我们了解了：

1. **基本选择器**：通用选择器、元素选择器、ID选择器、类选择器
2. **组合选择器**：后代选择器、子选择器、相邻兄弟选择器、通用兄弟选择器
3. **属性选择器**：基本属性选择器、精确属性值选择器、属性值包含选择器、属性值开头选择器、属性值结尾选择器、属性值单词选择器
4. **伪类选择器**：链接伪类、用户操作伪类、结构伪类、表单相关伪类
5. **伪元素选择器**：`::before`、`::after`、`::first-line`、`::first-letter`、`::selection`
6. **选择器的优先级**：如何计算和理解选择器的优先级
7. **选择器的最佳实践**：如何使用选择器更高效、更可维护

掌握CSS选择器是学习CSS的重要一步，通过合理使用选择器，我们可以创建出更加灵活、可维护和高性能的CSS代码。在实际项目中，我们应该根据具体需求选择合适的选择器，并遵循最佳实践，以提高代码质量和开发效率。