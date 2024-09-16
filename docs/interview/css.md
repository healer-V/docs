# CSS面试常见题

## 1、 CSS有哪些选择器

| **选择器类型**   | **语法**             | **作用**                             | **优先级权重**                 |
| ---------------- | -------------------- | ------------------------------------ | ------------------------------ |
| 通配选择器       | *                    | 选择所有元素                         | 0                              |
| 元素选择器       | element              | 选择所有指定的元素                   | 1                              |
| 类选择器         | .class               | 选择所有具有指定类名的元素           | 10                             |
| ID选择器         | #id                  | 选择具有指定ID的单个元素             | 100                            |
| 属性选择器       | [attribute]          | 选择具有指定属性的所有元素           | 10                             |
| 后代选择器       | ancestor descendant  | 选择所有属于指定祖先元素的后代元素   | 2                              |
| 子元素选择器     | parent > child       | 选择所有属于指定父元素的直接子元素   | 2                              |
| 相邻兄弟选择器   | previous + next      | 选择紧接在指定元素后的相邻兄弟元素   | 2                              |
| 通用兄弟选择器   | previous ~ siblings  | 选择指定元素之后的所有兄弟元素       | 2                              |
| 伪类选择器       | :pseudo-class        | 选择特定状态的元素，如悬停、焦点等   | 10                             |
| 伪元素选择器     | ::pseudo-element     | 选择元素的某个部分，如首字母、首行等 | 1                              |
| 群组选择器       | selector1, selector2 | 选择多个元素，并对它们应用相同的样式 | 根据其中优先级最高的选择器确定 |
| 属性值选择器     | [attribute=value]    | 选择具有指定属性值的所有元素         | 10                             |
| 部分属性值选择器 | [attribute^=value]   | 选择指定属性值以某个值开头的元素     | 10                             |
| 部分属性值选择器 | [attribute$=value]   | 选择指定属性值以某个值结尾的元素     | 10                             |
| 部分属性值选择器 | [attribute*=value]   | 选择指定属性值包含某个值的元素       | 10                             |

```css
/* 通配选择器，优先级：0 */
* {
  margin: 0;
  padding: 0;
}

/* 元素选择器，优先级：1 */
p {
  color: blue;
}

/* 类选择器，优先级：10 */
.intro {
  font-size: 14px;
} 

/* ID选择器，优先级：100 */
#header {
  background: yellow;
} 

/* 属性选择器，优先级：10 */
[type="text"] {
  border: 1px solid;
} 

/* 后代选择器，优先级：2 */
div p {
  color: red;
} 

/* 子元素选择器，优先级：2 */
ul > li {
  list-style: none;
} 

/* 相邻兄弟选择器，优先级：2 */
h1 + p {
  margin-top: 0;
} 

/* 通用兄弟选择器，优先级：2 */
h1 ~ p {
  color: grey;
} 

/* 伪类选择器，优先级：10 */
a:hover {
  color: red;
} 

/* 伪元素选择器，优先级：1 */
p::first-line {
  font-weight: bold;
} 

/* 群组选择器，优先级：根据其中优先级最高的选择器确定 */
h1, h2, h3 {
  margin: 0;
} 

/* 属性值选择器，优先级：10 */
[type="button"] {
  background: green;
} 

/* 部分属性值选择器，优先级：10 */
[class^="btn-"] {
  padding: 5px;
} 

/* 部分属性值选择器，优先级：10 */
[href$=".pdf"] {
  color: red;
} 

/* 部分属性值选择器，优先级：10 */
[title*="hello"] {
  font-style: italic;
}
```

## 2、如何计算 CSS 的优先级？

| **选择器类型** | **格式**      | **优先级权重** |
| -------------- | ------------- | -------------- |
| ID选择器       | #id           | 100            |
| 类选择器       | .classname    | 10             |
| 属性选择器     | a[ref="eee"]  | 10             |
| 伪类选择器     | li:last-child | 10             |
| 标签选择器     | div           | 1              |
| 伪元素选择器   | li:after      | 1              |
| 相邻兄弟选择器 | h1 + p        | 0              |
| 子选择器       | ul > li       | 0              |
| 后代选择器     | li a          | 0              |
| 通配符选择器   | *             | 0              |

#### 优先级计算规则

- 标签选择器、伪元素选择器：1
- 类选择器、伪类选择器、属性选择器：10
- ID选择器：100
- 内联样式：1000

#### 注意事项

- !important 声明的样式的优先级最高。
- 优先级相同：如果优先级相同，则最后出现的样式生效。
- 继承样式：继承得到的样式的优先级最低。
- 权值为 0：通用选择器（*）、子选择器（>）和相邻同胞选择器（+）的权值为 0。
- 内联样式 > 内部样式 > 外部样式 > 浏览器用户自定义样式 > 浏览器默认样式。

#### 示例

```css
/* ID选择器，优先级：100 */
#header {
  background: yellow;
}

/* 类选择器，优先级：10 */
.intro {
  font-size: 14px;
}

/* 属性选择器，优先级：10 */
a[ref="eee"] {
  color: red;
}

/* 伪类选择器，优先级：10 */
li:last-child {
  color: green;
}

/* 标签选择器，优先级：1 */
div {
  color: blue;
}

/* 伪元素选择器，优先级：1 */
li:after {
  content: ' after';
}

/* 相邻兄弟选择器，优先级：0 */
h1 + p {
  margin-top: 0;
}

/* 子选择器，优先级：0 */
ul > li {
  list-style: none;
}

/* 后代选择器，优先级：0 */
li a {
  text-decoration: none;
}

/* 通配符选择器，优先级：0 */
* {
  margin: 0;
  padding: 0;
}
```

## 3、CSS 中可继承与不可继承属性有哪些？

> CSS 中的属性分为可继承和不可继承两类。
>
> 可继承属性会从父元素传递给子元素，而不可继承属性则只应用于定义它们的元素。一般来说，可继承属性主要涉及文本和字体相关的属性，以及一些布局相关属性。

1. **可继承属性**：

   | **属性**       | **作用**     |
   | -------------- | ------------ |
   | color          | 文本颜色     |
   | font-family    | 字体家族     |
   | font-size      | 字体大小     |
   | font-style     | 字体样式     |
   | font-variant   | 字体变体     |
   | font-weight    | 字体粗细     |
   | letter-spacing | 字母间距     |
   | line-height    | 行高         |
   | text-align     | 文本对齐方式 |
   | text-indent    | 文本缩进     |
   | text-transform | 文本转换     |
   | visibility     | 可见性       |
   | white-space    | 空白处理     |
   | word-spacing   | 单词间距     |
   | direction      | 文本方向     |
   | cursor         | 鼠标指针样式 |
   | opacity        | 不透明度     |

2. **不可继承属性**：

   | **属性**   | **作用** |
   | ---------- | -------- |
   | background | 背景     |
   | border     | 边框     |
   | margin     | 外边距   |
   | padding    | 内边距   |
   | height     | 高度     |
   | width      | 宽度     |
   | max-height | 最大高度 |
   | max-width  | 最大宽度 |
   | min-height | 最小高度 |
   | min-width  | 最小宽度 |
   | display    | 显示方式 |
   | position   | 定位     |
   | top        | 上边距   |
   | right      | 右边距   |
   | bottom     | 下边距   |
   | left       | 左边距   |
   | float      | 浮动     |
   | clear      | 清除浮动 |
   | z-index    | 层级     |
   | overflow   | 溢出处理 |
   | clip       | 剪切     |
   | visibility | 可见性   |
   | opacity    | 不透明度 |

#### 扩展知识

在实际开发中，理解CSS属性的继承性非常重要，因为它会影响页面元素的样式和布局。为了更好地理解和应用这一概念，这里还有一些实用的小窍门和深入的知识点。

1. **默认值和继承**：某些CSS属性虽然不是继承属性，但它们在没有明确定义时，某些浏览器会默认继承。例如，`line-height`通常会被继承用于更好的文本对齐。

2. **使用 `inherit` 关键字**：CSS 提供了一个 `inherit` 关键字，可以明确地让某个属性继承其父元素的值。例如：

   ```css
   .child {
       color: inherit; // 强制继承父元素的文字颜色
   }
   ```

3. **全局关键字**：除了 `inherit` 之外，还有 `initial` 和 `unset` 等CSS全局关键字：

   - `initial` ：把属性设置为其默认值。
   - `unset` ：对于可继承属性，行为与 `inherit` 相同；对于不可继承属性，行为与 `initial` 相同。

4. **特殊情况**：有一些属性是部分可继承的，比如 `list-style` 属性，其中 `list-style-type` 和 `list-style-position` 是可继承的，而 `list-style-image` 则不是。



## 4、CSS 中 display 属性的值及其作用

display 属性用于定义元素的显示行为，即元素应如何在页面上布局和显示。每种取值都影响元素的渲染方式和布局特性。

| **属性值**         | **作用**                                           |
| ------------------ | -------------------------------------------------- |
| none               | 元素不显示，并且不会占据任何空间。                 |
| block              | 元素显示为块级元素，占据一整行。                   |
| inline             | 元素显示为行内元素，不会在前后产生换行。           |
| inline-block       | 元素显示为行内块级元素，不会换行，但可以设置宽高。 |
| **flex**           | **将元素显示为弹性容器，子元素使用弹性布局。**     |
| inline-flex        | 将元素显示为行内弹性容器，子元素使用弹性布局。     |
| **grid**           | 将元素显示为网格容器，子元素使用网格布局。         |
| inline-grid        | 将元素显示为行内网格容器，子元素使用网格布局。     |
| table              | 将元素显示为块级表格容器。                         |
| table-row          | 将元素显示为表格行。                               |
| table-cell         | 将元素显示为表格单元格。                           |
| table-row-group    | 将元素显示为表格行组。                             |
| table-header-group | 将元素显示为表格头部组。                           |
| table-footer-group | 将元素显示为表格底部组。                           |
| table-column       | 将元素显示为表格列。                               |
| table-column-group | 将元素显示为表格列组。                             |
| table-caption      | 将元素显示为表格标题。                             |
| list-item          | 将元素显示为列表项，并带有列表标记。               |
| initial            | 将 display 属性设置为默认值。                      |
| inherit            | 继承父元素的 display 属性值。                      |



## 5、CSS 隐藏元素的方法有哪些？

| **方法**                           | **描述**                                 |
| ---------------------------------- | ---------------------------------------- |
| display: none;                     | 元素不显示，并且不占据任何空间。         |
| visibility: hidden;                | 元素不可见，但仍占据空间。               |
| opacity: 0;                        | 元素完全透明，但仍占据空间并且可以交互。 |
| position: absolute; left: -9999px; | 将元素移出可视区域。                     |
| height: 0; overflow: hidden;       | 将元素高度设为0，并隐藏其内容。          |
| clip: rect(0, 0, 0, 0);            | 将元素裁剪为不可见的区域。               |
| transform: scale(0);               | 将元素缩放到不可见。                     |

```css
/* display: none; - 元素不显示，并且不占据任何空间。 */
.display-none {
  display: none;
}

/* visibility: hidden; - 元素不可见，但仍占据空间。 */
.visibility-hidden {
  visibility: hidden;
}

/* opacity: 0; - 元素完全透明，但仍占据空间并且可以交互。 */
.opacity-zero {
  opacity: 0;
}

/* position: absolute; left: -9999px; - 将元素移出可视区域。 */
.position-absolute {
  position: absolute;
  left: -9999px;
}

/* height: 0; overflow: hidden; - 将元素高度设为0，并隐藏其内容。 */
.height-zero {
  height: 0;
  overflow: hidden;
}

/* clip: rect(0, 0, 0, 0); - 将元素裁剪为不可见的区域。 */
.clip-rect {
  position: absolute;
  clip: rect(0, 0, 0, 0);
}

/* transform: scale(0); - 将元素缩放到不可见。 */
.transform-scale {
  transform: scale(0);
}
```



## 6、使用 link 和 @import 引用 CSS 的区别

在 HTML 文档中，可以通过 标签或 CSS 中的 @import 语句来引用外部样式表。两者在使用方式、加载顺序、兼容性等方面有一些重要的区别。

| **特性**     |                              | **@import**                   |
| ------------ | ---------------------------- | ----------------------------- |
| 用法         | 在 HTML 文档的 部分使用      | 在 CSS 文件或 标签内使用      |
| 加载顺序     | 页面加载时立即加载样式表     | 在加载包含它的 CSS 文件后加载 |
| 浏览器支持   | 支持所有主流浏览器           | 支持 IE5+ 和所有现代浏览器    |
| 性能         | 加载并行进行，速度较快       | 加载顺序依赖，速度较慢        |
| DOM 可操作性 | 可通过 JavaScript 操作和控制 | 不易通过 JavaScript 操作      |
| 样式权重     | 样式权重相同                 | 样式权重相同                  |

#### link:

用于 HTML 文档中引用 CSS 文件，因为其加载速度更快，兼容性更好，并且可以通过 JavaScript 操作。

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Link vs Import</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <h1>Hello, world!</h1>
  </body>
</html>
```

#### @import：

可以在 CSS 文件中引用其他 CSS 文件，但由于加载速度较慢，不建议在需要高性能的应用中使用。

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Link vs Import</title>
    <style>
      @import url("styles.css");
    </style>
  </head>
  <body>
    <h1>Hello, world!</h1>
  </body>
</html>
```



## 7、CSS 中 transition 和 animation 的区别

回答重点：

> CSS 中 `transition` 和 `animation` 都用于在元素样式改变时实现平滑过渡，但它们有一些关键区别：
>
> 1）`transition` 是用于定义元素属性变化时的过渡效果。它需要触发某个事件（如鼠标悬停、点击等）来启动。简单来说，`transition` 只能在两个状态之间转换，并且需要一个触发条件。
>
> 2）`animation` 提供了更多的控制选项，它允许我们定义关键帧（keyframes），并且可以在复数个状态之间进行变化。`animation` 可以在页面加载时自动开始运行，不需要特定的触发事件。



##### 1）`transition` 示例

```css
.box {
  width: 100px;
  height: 100px;
  background-color: red;
  transition: width 2s, height 2s, background-color 2s;
}

.box:hover {
  width: 200px;
  height: 200px;
  background-color: blue;
}
```

上面的 `transition` 代码表示，当 `.box` 触发了 `:hover` 事件（鼠标悬停）时，元素的 `width`、`height` 和 `background-color` 会在2秒内平滑地从初始状态过渡到目标状态。

##### 2）`animation` 示例

```css
@keyframes example {
  from {background-color: red;}
  to {background-color: yellow;}
}

.box {
  width: 100px;
  height: 100px;
  background-color: red;
  animation: example 5s infinite;
}
/** 在这个 `animation` 示例中，我们定义了一个名为 `example` 的关键帧动画。`.box` 元素的 `background-color` 会在5秒内从红色过渡到黄色，并且会无限循环。*/
```



##### 更多补充

1）`transition` 的特点：

- 只能从一种状态过渡到另一种状态。
- 需要一个触发条件来启动。
- 简单且适合属性变化较少的动画效果。

2）`animation` 的特点：

- 可以定义多个关键帧，实现更复杂的动画。
- 不需要触发条件即可自动启动。
- 更灵活，适用于复杂动画效果。



## 8、盒模型的理解

回答重点：

> 盒模型是 CSS 中的一个重要概念，用于描述元素在网页布局中的空间占用。它包含了四个主要部分： 
>
> 1）内容(content)：这是元素的实际内容，文本或图片等。
>
> 2）内边距(padding)：紧贴内容区域内的一层区域，用以定义内容与边框之间的距离。 
>
> 3）边框(border)：包围内容和内边距的一层线条，可以设置其宽度、样式和颜色。 
>
> 4）外边距(margin)：位于边框外的一层区域，用以定义元素与相邻元素之间的距离。

总结来说，盒模型是理解和处理元素在网页中的布局和间距的基础。

#### 扩展知识

为了更深入理解盒模型，以下是几个关键点：

1）**标准盒模型和IE盒模型**：

- 标准盒模型（W3C Model）：内容宽度只包含 content 部分，padding、border 和 margin 会额外增加到总宽度和高度。
- IE盒模型（怪异盒模型）：内容宽度包含 content + padding + border，也就是说设置的宽度就包括了 padding 和 border。

```
可以使用 CSS 中的 `box-sizing` 属性来切换这两种模型：
​```css
.box {
    box-sizing: content-box; /* 标准盒模型 */
}
.box {
    box-sizing: border-box; /* IE盒模型 */
}
​```
```

2）**应用场景**：

- 标准盒模型在做精确的尺寸和间距控制时更方便，适用于大多数场景。
- IE盒模型在处理多层嵌套的布局时，更容易调整和理解整体宽度和高度。

3）**调整和调试工具**：

- 浏览器开发者工具的“元素”界面，可以清晰地展示每个 HTML 元素的盒模型，查看其 padding、border 和 margin。
- 使用 CSS 灵活调节: 像 `padding`, `margin`, 和 `border` 属性都可以分别设置不同的方向（如 padding-left, margin-top 等），帮助实现更复杂的布局。

4）**与响应式设计结合**：利用盒模型结合 CSS 媒体查询，可以更好地实现响应式设计，根据不同屏幕尺寸灵活调整盒模型的各属性值，保证界面设计在各种设备上的一致性和美观。



## 9、为什么有时候用 translate 来改变位置而不是定位？

回答重点：

> `translate` 是通过 CSS transforms 实现的，它操作的是元素的渲染层，而不是布局层。这样一来，浏览器就不会因为位置的改变而重新计算布局（reflow），从而提高渲染性能。



#### 扩展知识

让我们进一步深入探讨这个问题，并延伸一些相关知识点：

1）**Reflow 与 Repaint：**

- **Reflow**（重排）：是指浏览器在 DOM 发生变化时重新计算元素的位置和几何形状。当使用定位属性（如 `top`, `left`）改变元素位置时，就会触发 Reflow，这在页面复杂时会非常消耗性能。
- **Repaint**（重绘）：是指元素的外观发生变化（如背景颜色、边框等）时，需要重新绘制这些元素，但不涉及重新计算布局。Repaint 的开销相对较小。

2）**Transform - Translate：**

- `translate` 是 CSS Transform 属性的一部分，通过矩阵变换（matrix transformations）来操作元素的视觉位置。这个过程是在合成层（compositing layer）完成的，不会影响文档的布局结构，所以不会触发 Reflow，只会造成 Repaint。

3）**硬件加速：**

- 使用 `translate` 通常能够借助 GPU 加速，而传统的定位方式则主要依赖于 CPU。在渲染大量图形和动画时，GPU 的效率是显著优于 CPU 的，能带来更流畅的视觉效果。

4）**性能优化的常见实践：**

- 在涉及到动画和频繁调整位置的场景下，应该优先考虑使用 `transform: translate`，而不是 `top` 或 `left`。
- 合理利用 `will-change` 属性，告知浏览器即将发生的一些变化（如 `transform` 或 `opacity`），预先做一些优化处理，提高动画的流畅度。

5）**实际应用中的权衡：**

- 尽管 `translate` 在性能上具有优势，但也不是所有情况下都适用。例如，对于特定布局需求或固定定位（fixed positioning）的情景，传统的定位方式依然不可或缺。因此，我们需要根据具体需求和性能考量做出合理选择。



## 10、为什么 li 与 li 元素之间有看不见的空白间隔？如何解决？

#### 回答重点

> 在 HTML 中，`li` 元素之间的空白间隔是由于 HTML 标签之间的空白字符（如空格、换行等）被渲染为一个空格字符。这是因为 HTML 中的空白字符（如空格、Tab、换行符）会被浏览器解释为一个正常的空白符。
>
> 解决办法： 
>
> 1）消除 HTML 代码中的空白字符，包括标签之间的空格和换行。 
>
> 2）使用负的 `margin` 或 `padding` 值来压缩这些空白间隔。 
>
> 3）使用 CSS 的 `display` 属性，将 `li` 元素设置为 `display: inline-block;`，并设定父元素的字号为零，然后再恢复子元素的字号。 
>
> 4）用CSS的 `flexbox` 布局来代替传统的块级布局。



#### 扩展知识

为了让大家更好地理解这些方法，我将详细举例说明：

1）删除空白字符：

```html
<ul>
    <li>Item 1</li><li>Item 2</li><li>Item 3</li>
</ul>
```

这虽然简单但可读性差，在实际开发中不太推荐。

2）使用负 `margin` 或 `padding`：

```html
<ul>
  <li style="margin-right: -4px;">Item 1</li>
  <li style="margin-right: -4px;">Item 2</li>
  <li>Item 3</li>
</ul>
```

这个方法比较合适临时调整，但不够优雅。

3）父元素的字号设为0：

```html
<ul style="font-size: 0;">
  <li style="display: inline-block; font-size: 16px;">Item 1</li>
  <li style="display: inline-block; font-size: 16px;">Item 2</li>
  <li style="display: inline-block; font-size: 16px;">Item 3</li>
</ul>
```

这是一个常用的解决方案，因为它可以在保持代码可读性的情况下去除空间，但需要额外的 CSS 定义。

4）使用 `flexbox`：

```html
<ul style="display: flex;">
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
```

`flexbox` 是一种现代且强大的布局方式，不会受到空白字符影响，并且提供了许多灵活的选项。

除了这四种方法，理解 HTML 和 CSS 渲染的底层机制对我们也是有好处的，了解文字节点与块级元素、行级元素之间的关系，可以让我们在布局时避免许多不必要的麻烦。尤其是在复杂布局或需要考虑响应式设计时，通过合理应用布局模型和属性，可以大大提高开发效率和代码的维护性。



## 11、CSS3 中有哪些新特性？

#### 回答重点

> CSS3 引入了许多新的特性，使得网页设计和开发更加灵活和强大。下面是一些最重要的新特性：
>
> 1）**盒子模型（Box Model）**：包括 box-sizing 属性，可以更好地控制元素的尺寸和边框。 
>
> 2）**背景与边框（Backgrounds and Borders）**：如多重背景图片、边框图片（border-image）等。 
>
> 3）**文本效果（Text Effects）**：包括文本阴影（text-shadow）和换行（word-wrap）。 
>
> 4）**变形（Transforms）和过渡（Transitions）**：可以使元素在用户交互时动态地改变样式。 
>
> 5）**动画（Animations）**：使用 @keyframes 规则，可以创建复杂的动画效果。 
>
> 6）**多列布局（Multi-column Layout）**：使得文本内容可以像报纸一样分为多列显示。 
>
> 7）**Flexbox 和 Grid 布局**：提供更强大和灵活的布局机制。 
>
> 8）**媒体查询（Media Queries）**：使得网页设计可以响应不同设备的尺寸和特性。 
>
> 9）**自定义属性（Custom Properties，也叫 CSS 变量）**：可以在样式表中定义变量，提高可维护性和重用性。 
>
> 10）**伪类和伪元素**：如 :nth-child() 和 ::before 等，更精确地选择和操作元素。

#### 扩展知识

谈到 CSS3 新特性，要了解的不仅仅是列举出来的几个具体功能，更要理解它们背后的设计理念和应用场景。以下是我对每个重点内容的进一步解释和扩展：

1）**盒子模型（Box Model）**：

- 在 CSS3 中，`box-sizing` 属性可以设置为 `content-box` 或 `border-box`。前者是默认值，后者则包括内边距和边框，使得盒子的尺寸计算更直观。

2）**背景与边框（Backgrounds and Borders）**：

- 多重背景允许你为一个元素设置多个背景图片，并使用不同的位置和大小。
- `border-image` 属性可以使用图片作为边框，这使得设计更加灵活和生动。

3）**文本效果（Text Effects）**：

- `text-shadow` 可以为文本添加阴影效果，增加视觉层次感。
- `word-wrap: break-word` 可以在必要时断行，避免长单词溢出容器。

4）**变形和过渡（Transforms and Transitions）**：

- `transform` 属性可以对元素进行平移（translate）、旋转（rotate）、缩放（scale）等变形操作。
- `transition` 属性可以为元素的属性变化设置动画效果，参数包括属性名、持续时间、过渡效果等。

5）**动画（Animations）**：

- 使用 `@keyframes` 规则定义动画的各个关键帧，然后通过 `animation` 属性引用这些动画。

6）**多列布局（Multi-column Layout）**：

- 通过 `column-count` 和 `column-gap` 等属性，可以简单地将文本内容分为多列。

7）**Flexbox 和 Grid 布局**：

- Flexbox 布局是一维的，专注于行或列的布局，常用于简单的导航菜单和弹性盒子布局。
- Grid 布局是二维的，可以同时控制行和列，更适合复杂的布局。

8）**媒体查询（Media Queries）**：

- 媒体查询让开发者可以针对不同设备和屏幕尺寸编写不同的样式，从而实现响应式布局。

9）**自定义属性（CSS 变量）**：

- 使用 `--variable-name` 的格式定义变量，然后通过 `var(--variable-name)` 引用这些变量。适用于重复使用的值，如颜色、字体大小等。

10）**伪类和伪元素**： - :nth-child() 允许更复杂的元素选择规则，适用于样式交替或循环的情况。 - ::before 和 ::after 可以在元素内部添加内容，常用于装饰性效果。





## 12、什么是替换元素？说说其概念及计算规则

#### 回答重点

替换元素是指在CSS中，元素的内容不是由CSS所控制的，而是由外部资源来决定的，例如图像 (`<img>`)、视频 (`<video>`)、嵌入内容 (`<iframe>`) 等。这类元素的内容及尺寸通常是由其自身的属性或外部资源来决定，浏览器根据资源的固有尺寸来渲染这些元素。

#### 扩展知识

1）**常见的替换元素**：

- `<img>`：显示外部图片。
- `<video>`：嵌入外部视频。
- `<object>`：嵌入外部对象资源。
- `<embed>`：嵌入外部程序或插件。
- `<iframe>`：嵌入一个文档中的另一个HTML文档。

2）**计算规则**：

- **固有尺寸**：替换元素通常会有一个固有尺寸，即资源本身的宽度和高度，如图片的分辨率。
- **宽度和高度属性**：可以通过CSS或者HTML属性明确设置替换元素的宽高。注意：CSS中的 `width` 和 `height` 属性是用来覆盖固有尺寸的。
- **默认盒模型**：替换元素通常默认使用内容盒模型（`content-box`），即属性 `box-sizing` 默认为 `content-box`。在这个模型下，宽度和高度不包括内边距和边框。
- **CSS规则**：可以通过CSS规则对替换元素进行进一步的样式设置，如边框 (`border`)、内边距 (`padding`)、外边距 (`margin`) 等。

3）**注意事项**：

- **在响应式设计中的应用**：替换元素在响应式设计中经常需要使用，如对图片使用百分比的宽高设置，以便在不同设备上适应窗口尺寸。
- **兼容性问题**：老旧浏览器对某些替换元素的支持可能存在兼容性问题，需要做额外的处理。

4）**替换元素和非替换元素的对比**：

- **控制内容的不同**：替换元素的内容是外部资源，内容不是由HTML本身的标签和文本定义的。而非替换元素由标签和文本内容组成，完全受CSS控制。
- **固有尺寸**：替换元素有固有尺寸，而非替换元素的尺寸完全受CSS控制。



## 13、什么是物理像素，逻辑像素和像素密度？为什么在移动端开发时需要用到 @3x, @2x 这种图片？

#### 回答重点

> 物理像素（Physical Pixel）是设备屏幕上实际存在的最小显示单元。逻辑像素（Logical Pixel）则是与编程和设计中使用的抽象单位，它与设备独立像素（Device Independent Pixel, DIP）对应。像素密度（Pixel Density）是每英寸拥有的物理像素数，通常用PPI（Pixels Per Inch）表示。
>
> 在移动端开发中使用 @3x, @2x 这种图片，是为了适应不同设备的屏幕分辨率和像素密度，确保在高像素密度的设备上，图片显示依然清晰而不会模糊。@2x 和 @3x 是对像素密度为2倍和3倍的设备提供的高分辨率图片资源。

#### 扩展知识

1）物理像素（Physical Pixel）：这是硬件层面上屏幕实际的物理点。现代设备通常拥有非常高的物理像素密度，比如 iPhones，尤其是带 Retina 显示屏的设备。

2）逻辑像素（Logical Pixel）：也叫设备独立像素（Device Independent Pixel，DIP），这是开发和设计时使用的抽象单位，它与物理像素的比例由设备设置决定。例如，iPhone上的逻辑像素与物理像素比例可能是1:2或1:3。

3）像素密度（Pixel Density）：即每英寸内的像素数量，通常用PPI表示。像素密度越高，显示效果越细腻。

4）@2x 和 @3x 图片：在不同像素密度的设备上，如果使用相同大小的图片，低像素密度的设备上图片会显示清晰，但在高像素密度设备上图片会显得模糊。通过使用 @2x 和 @3x，这些设备可以加载分辨率更高的图片以保持清晰度。例如，@2x 图片的分辨率是标准分辨率的两倍，每个逻辑像素对应2x2个物理像素。

5）响应式图片：为不同设备准备合适的图片资源不仅仅是为了清晰度，还有助于优化性能。提供多套图片资源并根据设备的像素密度加载相应的图片，避免了高像素密度设备加载低分辨率图片带来的模糊，同时也避免了低像素密度设备加载高分辨率图片带来的浪费。

6）CSS 中的实践：在使用CSS设计时，可以通过媒体查询（media queries）和像素密度特性来为不同设备提供合适的图片资源。例如，可以使用 `background-image` 属性的 `image-set()` 函数来加载不同分辨率的背景图。

7）影响显示的其他因素：除了像素密度，设备的色彩深度、显示技术（比如LCD、OLED）等也是影响显示效果和用户体验的重要因素。在设计和开发时需要综合考虑这些方面。



## 14、CSS 优化和提高性能的方法有哪些？

#### 回答重点

> CSS 优化和提高性能的方法主要有以下几种：
>
> 1）合并和最小化 CSS 文件：通过工具（如 Webpack、Gulp）将多个 CSS 文件合并为一个，并最小化 CSS 代码，减少文件大小和请求数。 
>
> 2）使用 CSS 预处理器：利用 Sass、LESS 这些预处理器，可以编写更简洁高效的 CSS 代码，并支持变量、嵌套等特性。 
>
> 3）减少使用高级选择器：避免使用复杂的选择器（如后代选择器、通配符选择器），优先使用类选择器，减少浏览器的解析时间。 
>
> 4）避免冗余样式：删除未使用的 CSS 规则，确保所有样式都有实际用处。 
>
> 5）合理使用 CSS Sprite：将多个小图标合并成一张图，通过 background-position 实现图标显示，减少 HTTP 请求。 
>
> 6）使用 CSS 动画的调优：避免复杂的动画，尽量使用 transform 和 opacity，它们对性能影响较小。 
>
> 7）CSS 放置位置：在 HTML 中，CSS 文件应放在 head 标签内，确保页面加载时能尽快应用样式。 
>
> 8）使用内联样式进行关键渲染路径优化：对于首屏重要的样式，可以使用内联 CSS，减少首次渲染时间。

#### 扩展知识

接下来，我会对这些方法做进一步的说明，同时延伸一些相关的知识点。

1）合并和最小化 CSS 文件：

- 合并 CSS 文件可以减少 HTTP 请求数，因为每个请求都会带来额外的网络开销。
- 最小化 CSS 文件可以减少文件大小，通过删除空格、注释等无用字符，使得传输速率更快。常用的工具有 CSSNano、UglifyCSS 等。

2）使用 CSS 预处理器：

- 预处理器能够帮助我们编写更具逻辑性和可维护性的代码，比如利用变量存储重复的值，使用嵌套减少选择器层级等。此外，预处理器还支持混入和函数。

3）减少使用高级选择器：

- 比如后代选择器（div p）和通配符选择器（*）会让浏览器遍历更多的 DOM 节点，从而增加渲染时间。使用更具体的类选择器（.class）可以迅速定位到目标元素。

4）避免冗余样式：

- 通过工具（如 PurifyCSS、UnCSS）可以自动检测和删除未使用的 CSS 规则。保持 CSS 文件干净整洁，对维护也非常友好。

5）合理使用 CSS Sprite：

- 将多个图标合并成一张大图，并通过背景定位显示特定部分，可以显著减少 HTTP 请求数，提高加载速度。工具 SpriteSmith 可以帮助生成 Sprite 图。

6）CSS 动画的调优：

- 对比普通的属性，transform 和 opacity 不会触发布局和绘制，只会触发合成，这使得它们在渲染过程中更高效。例如，可以用 transform: translateX(100px) 代替 left: 100px。

7）CSS 放置位置：

- 如果将 CSS 文件放在 body 底部，在样式加载完成之前页面内容可能没有样式，会影响用户体验。所以一般情况下会将 CSS 文件放在 head 中，以保证样式尽快加载和解析。

8）使用内联样式进行关键渲染路径优化：

- 对于初次加载页面的关键样式，可以直接写在 HTML 中，这样浏览器就不必等待外部 CSS 文件加载完成，能够更快呈现出内容。例如，可以在 head 中通过 标签添加。



## 15、CSS 预处理器 / 后处理器是什么？为什么要使用它们？

#### 回答重点

CSS 预处理器和后处理器是用于提升CSS编写和管理效率的工具。CSS 预处理器如Sass、Less可提供变量、嵌套、混合等高级功能来编写更具结构性和模块化的CSS代码。CSS后处理器如PostCSS则侧重于通过插件机制自动优化和增强CSS，例如自动添加浏览器前缀等。这些工具的使用可以使CSS代码更简洁、易维护，同时提升开发效率和项目的可扩展性。

#### 扩展知识

1）**CSS 预处理器的功能和优势**： 

- **变量**：允许你定义变量，以便在整个样式表中复用同一组值，如颜色、字体大小等，从而减少重复定义并提高代码的可维护性。 
- **嵌套**：支持嵌套规则，使代码更加直观，类似于HTML结构，从而增加代码的可读性。 
- **混合**：通过混合（mixin）功能，允许你定义可复用的代码片段，并且可以带有参数，进一步减少重复代码。
- **文件拆分**：允许将CSS代码拆分成多个文件，便于模块化开发和团队协作。

2）**常见的CSS 预处理器**： 

- **Sass (Syntactically Awesome Style Sheets)**: - 拥有强大的变量、混合、继承等功能； 
- 可以用`.scss`和` .sass`两种不同的语法书写； - 广泛支持，社区资源丰富。 
- **Less (Leaner Style Sheets)**: - 语法简洁，学习成本低； - 支持JavaScript风格的操作，可以动态计算值；
- 与现有CSS完全兼容。

3）**CSS 后处理器的功能和优势**： 

- **自动添加浏览器前缀**：通过插件如Autoprefixer，能自动根据目标浏览器的兼容性需求添加必要的前缀。 

- **优化和压缩**：可利用插件进行CSS代码的优化和压缩，减少文件大小，提高加载速度。 

- **转译现代CSS特性**：通过插件，如cssnext，可以使用未来的CSS特性，让代码更具前瞻性。

4）**常见的CSS 后处理器**： 

- **PostCSS**： - 灵活的插件机制，可以根据需求按需添加插件； 

- 插件生态丰富，如Autoprefixer、cssnano（用于压缩）、postcss-preset-env（未来CSS特性转译）等； 

- 与多种构建工具集成方便，如Webpack、Gulp。

5）**实践中的应用**：在现代前端开发中，我们通常会结合使用这两类工具。比如，先通过Sass预处理器进行编写，实现模块化和复用，随后利用PostCSS后处理器进行自动化优化和兼容性处理。



## 16、display:inline-block 什么时候会显示间隙？

#### 回答重点

在使用 `display: inline-block` 的时候，经常会碰到元素之间出现莫名其妙的间隙。这些间隙通常是由 HTML 中的空格字符（比如换行、空格、Tab 等）所引起的。简单说，`display: inline-block` 元素之间的间距是由于它们本质上还是“行内”元素，所以任何在 HTML 中的空白字符都会被处理为一个空格，从而导致视觉上的间隙。

#### 扩展知识

我们可以从以下几个方面进一步理解和解决这个问题： 1）**原因分析**：`inline-block` 元素虽然呈现为块级元素，但在排版行为上仍保留了一部分行内元素的特性。因为行内元素之间的空格字符（比如 HTML 中的换行、空格等）会被渲染作为一个普通空格，导致视觉上出现间隙。

2）**解决方案**：

- 移除 HTML 中的空白

  ：最简单的方法是在编写 HTML 时确保

  ```
  inline-block
  ```

  元素之间没有任何空白字符。可以将元素直接连在一起，比如：

  ```html
  
  ```

<div style="display: inline-block"></div><div style="display: inline-block"></div>

  ```
- 使用 HTML 注释

  ：在两个

  ```

inline-block

  ```
  
  元素之间插入 HTML 注释也可以避免空白字符的影响：

  ```html
<div style="display: inline-block"></div><!--
  --><div style="display: inline-block"></div>
  ```

- 负边距修正

  ：通过给其中一个

  ```
  inline-block
  ```

  元素设置负的

  ```
  margin-right
  ```

  也可以消除间隙，不过这种方法可能会在某些浏览器中表现不一致：

  ```css
  .inline-block-element {
      display: inline-block;
    margin-right: -4px; /* 负边距值根据实际间隙大小调整 */
  }
  ```

```
3）**其他替代方案**：

- 使用 Flexbox 或 Grid

  ：CSS Flexbox 或 Grid 可以直接避免这些间隙问题，并提供更强大的布局能力。使用 Flexbox 实现同样布局：

  ```css
  .flex-container {
      display: flex;
  }
  .flex-item {
      /* Your styles here */
  }
```

  ```html
  <div class="flex-container">
      <div class="flex-item"></div>
      <div class="flex-item"></div>
  </div>
  ```

4）**问题探索**：CSS 的设计初衷之一就是让 HTML 与样式相分离，但像 `inline-block` 这种情况却常常透露出 HTML 排版的一些底层特性。通过理解这些小细节，不仅能帮助我们更好地掌握 CSS，还能写出更健壮的代码。



## 17、CSS 怎么实现单行、多行文本溢出隐藏？

#### 回答重点

实现单行文本溢出隐藏可以通过使用 CSS 的 `white-space`, `overflow`, 以及 `text-overflow` 属性。具体代码如下：

```css
.single-line-ellipsis {
    white-space: nowrap; /* 白空间不换行 */
    overflow: hidden;    /* 溢出的部分隐藏 */
    text-overflow: ellipsis; /* 溢出部分用三个点表示 */
}
```

如果要实现多行文本溢出隐藏，可以使用 `-webkit-line-clamp` CSS 属性，结合 `display` 和 `webkit-box-orient` 等属性。具体代码如下：

```css
.multi-line-ellipsis {
    display: -webkit-box;        /* 弹性盒模型 */
    -webkit-box-orient: vertical;/* 垂直排列子元素 */
    -webkit-line-clamp: 2;       /* 限制最多显示两行 */
    overflow: hidden;            /* 溢出部分隐藏 */
}
```

#### 扩展知识

1）**white-space 属性**：

- `nowrap`：强制文本在一行内显示，忽略换行符。
- `normal`：默认值，文本会在需要时换行。
- `pre`：文本会保留空白符和换行符。

2）**text-overflow 属性**：

- `ellipsis`：文本溢出部分显示省略号(…)，这是最常用的处理方式。
- `clip`：剪切文本，不显示省略号。

3）**-webkit-line-clamp**：

- `n`：显示 `n` 行文本，超出部分截断并显示省略号，需要结合其他 Webkit 属性使用。
- 注意：这个属性并不是标准 CSS 属性，它是在 Webkit 浏览器中实现的。

4）**扩展实现多行溢出隐藏的方法**：

- 使用

  ```
  line-height
  ```

  和

  ```
  height
  ```

  :

  ```css
  .multi-line-ellipsis {
      line-height: 1.2;       /* 设置行高 */
    height: 2.4em;          /* 2.4em 即为两行文本的高度 */
      overflow: hidden;       /* 溢出部分隐藏 */
  }
  ```

- 优点：这种方法适用于所有现代浏览器。

- 缺点：需要具体设定每行的高度，如果前景内容会频繁变化，维护起来会比较繁琐。

5）**兼容性的考量**：

- `-webkit-line-clamp` 属性在非 Webkit 的浏览器上可能无法生效，可以使用 JavaScript 或各类 polyfill 进行补充。
- 为更好的跨浏览器支持，还可以用 JS 动态计算行数，手动添加或替换省略号。



## 18、Sass、Less 是什么？为什么要使用它们？

#### 回答重点

Sass和Less是两种动态样式表语言（也被称为CSS预处理器），它们被用于编写更简洁、可维护和灵活的CSS代码。通过使用Sass和Less，开发者能够利用变量、嵌套规则、混合、运算以及函数等特性，极大地提高了CSS的可重用性和扩展性。

#### 扩展知识

1）**Sass和Less的定义**

- **Sass（Syntactically Awesome Stylesheets）**：是由Hampton Catlin和Natalie Weizenbaum开发的一种CSS预处理器。Sass有两种语法，缩进式语法（.sass 文件）和SCSS语法（.scss 文件），其中SCSS是Sass的扩展，会更接近CSS的语法。
- **Less（Leaner Style Sheets）**：是由Alexis Sellier开发的CSS预处理器。Less允许开发者以更动态的方式编写CSS。在语法上，Less与CSS非常接近，减少了学习成本。

2）**为什么使用Sass和Less**

- **变量**：通过变量，可以减少重复代码，便于全局修改。例如，定义颜色变量，一个地方改动，全局生效。
- **嵌套**：支持嵌套结构，让样式表更具层次性和可读性。有点像编写HTML结构，通过嵌套，可以更清晰地表达层级关系。
- **混合（Mixins）**：把一段可复用的样式定义成一个混合，这样在使用时可以像调用函数一样，避免重复撰写冗长的属性集合。
- **运算**：能够进行数学运算，使得样式的编写更灵活，比如计算长度、宽度、边距、填充等。
- **继承**：通过继承来简化代码，减少冗余，增强样式的可维护性。
- **函数**：支持定义自己的函数，对样式进行逻辑处理和计算，使得样式更加智能化。

3）**实际应用中的好处**

- **提高开发效率**：重复代码少了，创建和维护样式的时间显著减少。
- **提升样式一致性**：通过预处理器的特性，避免了样式表的分散和凌乱，全面提升了样式的一致性。
- **增强代码可维护性**：当需要改变某个全局变量（如主色调）时，只需要改变一处即可，无需找到每一个地方逐一修改。
- **分工协作更轻松**：预处理器文件可以分模块管理，团队成员可以各自负责一部分，提升协作性。

4）**相互比较**

- **语法差异**：Sass有两种语法(Sass和SCSS)，而Less只有一种。SCSS与CSS十分相似，学习曲线较平缓。
- **社区支持**：Sass的社区贡献较活跃，尤其在一些新特性和组件库的支持上（例如Bootstrap选择了Sass）。
- **功能特性**：虽然两者具备众多相似的特性，但Sass在某些高级功能（如函数和高级选择器的支持）上表现更加突出。



## 19、说说你对媒体查询的理解？

#### 回答重点

媒体查询（Media Query）是CSS3中提供的一种功能强大的机制，用于针对不同的设备类型或设备特性应用不同的样式。通过媒体查询，我们可以根据设备的宽度、高度、分辨率、方向等条件，加载不同的CSS样式表，从而实现响应式设计。响应式设计指的是一个网站能根据用户所使用设备的不同，实现自动调整布局和样式，以提供最佳的用户体验。

#### 扩展知识

1）**使用方法**： 媒体查询的语法相对简单，常见用法有内联样式、link标签、和import语句。例如：

```css
/* 直接在CSS文件中使用 */
@media (min-width: 600px) {
  body {
    background-color: lightblue;
  }
}

/* 通过link标签 */
<link rel="stylesheet" media="screen and (max-width: 600px)" href="style.css">

/* 使用import语句 */
@import url("style.css") screen and (max-width: 600px);
```

2）**媒体特性**： 除了屏幕宽度和高度，媒体查询还支持多种其他特性。例如：

- `aspect-ratio`: 元素的宽高比
- `resolution`: 设备的分辨率
- `orientation`: 设备的方向（横向或纵向）
- `color`: 设备是否支持颜色，以及颜色深度

3）**逻辑操作符**： 媒体查询支持逻辑操作符比如`and`, `not`, 和 `only`，用于组合和否定条件：

```css
@media screen and (min-width: 600px) and (max-width: 800px) {
  body {
    background-color: yellow;
  }
}
```

4）**移动优先设计**： 在响应式设计中，“移动优先”是一种推荐的实践方式。即先设计移动端的样式，再通过媒体查询针对更大屏幕进行增强：

```css
/* 默认样式：移动端优先 */
body {
  font-size: 14px;
}

/* 针对大屏幕的增强 */
@media (min-width: 768px) {
  body {
    font-size: 16px;
  }
}
```

5）**适配不同设备**： 通过媒体查询，我们可以轻松适配各种设备，包括手机、平板、桌面电脑等。例如：

```css
/* 手机设备 */
@media (max-width: 480px) {
  body {
    background-color: pink;
  }
}

/* 平板设备 */
@media (min-width: 481px) and (max-width: 1024px) {
  body {
    background-color: lightgreen;
  }
}

/* 桌面电脑 */
@media (min-width: 1025px) {
  body {
    background-color: lightblue;
  }
}
```



## 20、说说你对 CSS 工程化的理解

#### 回答重点

CSS 工程化，顾名思义就是将 CSS 开发过程中的相关问题，从工程角度去解决，使得 CSS 开发更符合工程化的标准、更高效。核心目的就是提高开发效率、维护性和可扩展性。在实际使用中，通常会用到以下几个技术和方法：

1）模块化：将 CSS 按照模块拆分，比如使用 BEM（Block Element Modifier）命名法，或采用 Sass、LESS 等预处理器来实现模块化开发。 2）自动化工具：使用工具如 Webpack、Gulp 进行资源打包、自动化构建，减少人为错误，提升工作效率。 3）规范化：制定和遵守 CSS 编码规范，保持代码风格一致，便于团队协作和代码审查。 4）预处理器和后处理器：预处理器（如 Sass、LESS）可以让 CSS 具备编程语言的一些特性，而后处理器（如 PostCSS）可以对生成的 CSS 进行优化和处理。 5）组件化：通过 CSS-in-JS 或者 CSS Modules 等技术手段，将样式与组件的逻辑更紧密地结合，便于维护和复用。

#### 扩展知识

CSS 工程化并不是简单的技术选择，而是一个综合性的架构设计和规划。有关 CSS 工程化的探索和应用已经成为当代前端开发中不可或缺的一部分。下面我进一步展开一些涉及 CSS 工程化的技术和实践：

1）CSS Modules 和 Scoped CSS：

- CSS Modules：通过模块化的方式，让每个 JavaScript 文件都有独立的 CSS，避免了全局命名冲突。
- Scoped CSS：如 Vue 和 Svelte 等框架，允许在组件内部写样式并让样式只作用于当前组件。

2）PostCSS 和 Autoprefixer：

- PostCSS 是一个强大的工具，可以使用各种各样的插件实现不同的功能，例如自动添加浏览器前缀、压缩 CSS 代码等。
- Autoprefixer：可以根据目标浏览器的不同，自动为 CSS 属性添加前缀，保持兼容性。

3）CSS-in-JS：

- 这种方法将 CSS 样式写在 JavaScript 里，通过 JavaScript 动态生成样式。常见的库有 Styled-components、Emotion 等。它们提供了更强的动态和条件样式能力。

4）静态分析和代码检查：

- 使用工具如 Stylelint 来进行静态分析和代码质量检查，这些工具可以捕获潜在问题并确保代码风格的一致性。

5）构建和优化：

- 使用 Webpack、Gulp 等工具进行构建和打包。通过 Tree Shaking、代码压缩等手段，减少 CSS 文件的体积，提高加载速度。

6）探索新标准：

- 当前已有一些 CSS 新标准和提案，如 CSS Variables、Grid Layout 等，这些新特性可以使 CSS 写法更加灵活和强大。



## 21、z-index 属性在什么情况下会失效？

#### 回答重点

z-index 属性会在以下情况下失效： 1）元素的定位方式不是 position:absolute、position:relative、position:fixed 或 position:sticky。 2）z-index 值设置为 auto 值。 3）元素不在同一个堆叠上下文中。

#### 扩展知识

这题牵涉到了 CSS 中关于 z-index 和堆叠上下文（stacking context）的知识，了解这些有助于我们更好地调试和控制布局。

1）**堆叠上下文**： 当一个元素拥有特定的 CSS 属性时，会创建一个新的堆叠上下文。新堆叠上下文中的子元素会按照它们的 z-index 属性在父亲堆叠上下文之中进行相对的排列。以下这些情况都会创建新的堆叠上下文：

- 设置了 `position` 属性为 `absolute`、`relative`、`fixed` 或 `sticky` 并且 `z-index` 不为 `auto`。
- 父元素设置了 `transform`、`opacity`、`filter`、`will-change`、`perspective`、`clip-path` 等特性。

2）**自动 z-index**： 当z-index为auto时，元素会遵循文档流的顺序和兄弟元素在当前堆叠上下文中的位置，而不允许任何自定义的堆叠顺序。

3）**定位 context**： z-index 只对那些有明确定位的元素生效，这些定位通常指的是 `position: relative`、`absolute`、`fixed` 或 `sticky`。如果元素的定位方式是 `static` 或没有指定 `position`，那么 z-index 是不生效的。

4）**实际应用**：

- 在实际的 CSS 开发中，通常会通过工具（如浏览器的开发者工具）调试 z-index 的问题。如果发现 z-index 属性没有生效，可以逐步检查上述几点来排查问题。
- z-index 相关问题时常出现于复杂布局时，比如多层弹窗、浮动元素等。当我们明确了堆叠上下文的概念，就能更好地进行调试。



## 22、CSS3 中的 transform 有哪些属性？

#### 回答重点

CSS3 中的 transform 属性主要包含以下几个子属性：

1）translate：用于移动元素的位置。 2）scale：用于缩放元素的尺寸。 3）rotate：用于旋转元素。 4）skew：用于扭曲元素。 5）matrix：结合以上多个功能综合变换元素。

简要地看，这些属性帮助我们操作元素的位置、大小和形态，它们是构建现代网页动效的核心工具。

#### 扩展知识

我注意到你对 transform 属性感兴趣，那我来进一步详细解释一下每个属性，以及实际应用中的一些常见场景。

1）translate： translate 属性用于移动元素，可以在 2D 和 3D 空间中使用，有 translateX、translateY、translateZ 和综合的 translate。它们分别控制元素在 X 轴、Y 轴和 Z 轴的移动。 比如：

```css
transform: translateX(50px); /* 水平方向移动50像素 */
transform: translateY(-20px); /* 垂直方向移动-20像素 */
```

在网页动画中，translate 通常用于实现平滑移动，比如滑动菜单或卡片翻转效果。

2）scale： scale 属性用于缩放元素尺寸，也可以用于 2D 和 3D 空间，有 scaleX、scaleY、scaleZ 和综合的 scale。它们分别控制元素在 X 轴、Y 轴和 Z 轴的缩放。 比如：

```css
transform: scale(1.5); /* 同时放大元素1.5倍 */
transform: scaleX(2);  /* 仅在水平放大2倍 */
```

在响应式设计中，scale 处理图标或图片的自适应缩放效果很常见。

3）rotate： rotate 属性用于旋转元素，可以在 2D 和 3D 空间中使用，有 rotateX、rotateY、rotateZ 和综合的 rotate。它们分别控制元素围绕 X 轴、Y 轴和 Z 轴旋转。 比如：

```css
transform: rotate(45deg); /* 2D旋转45度 */
transform: rotateY(180deg); /* 围绕Y轴旋转180度 */
```

在图形设计和动画中，rotate 常用于实现旋转按钮或指针等效果。

4）skew： skew 属性用于扭曲元素，仅在 2D 空间中使用，有 skewX 和 skewY。它们分别控制元素在 X 轴和 Y 轴的倾斜角度。 比如：

```css
transform: skewX(30deg); /* 水平方向倾斜30度 */
transform: skewY(-15deg); /* 垂直方向倾斜-15度 */
```

在斜体文本特效和一些斜角设计中，skew 属性应用广泛。

5）matrix： matrix 是一个综合性的变换属性，可以实现平移、缩放、旋转和扭曲。它接受6个参数，用于表示 2D 变换的矩阵。 比如：

```css
transform: matrix(1, 0, 0, 1, 50, 50); /* 平移50像素 */
```

这种方法较为底层，一般在复杂变换中使用。



## 23、常见的 CSS 布局单位有哪些？

在 CSS 中，我们常用的布局单位可以分为两类：

一种是**绝对单位**，如 px（像素），

另一种是**相对单位**，如 em、rem、%、vw、vh 等。

以下是一些常见的布局单位：

> 1）px（像素）：这种单位是最常见的绝对单位。它表示屏幕上独立的像素点，在不同的设备和屏幕分辨率下，px 的表现一般是一致的。
>
> 2）em：这种单位是相对单位，表示当前元素字体大小的倍数。比如，若一个元素的字体大小为 16px，则 2em 就等于 32px。
>
> 3）rem：rem 也是一种相对单位，但是它是相对于根元素（html 元素）的字体大小。
>
> 4）%（百分比）：百分比单位是一个相对单位，其大小是相对其父元素的大小。比如，宽度设置为 50%，那么其宽度将是父元素宽度的一半。
>
> 5）vw（视窗宽度）：这种单位是相对于视口宽度的百分比。1vw 表示视口宽度的 1%。
>
> 6）vh（视窗高度）：这种单位是相对于视口高度的百分比。1vh 表示视口高度的 1%。
>
> 7）vmin 和 vmax：这两个单位与视窗尺寸有关。vmin 是视口宽度和高度中较小的那个的百分比，而 vmax 是视口宽度和高度中较大的那个的百分比。



## 24、说说 px、em、rem 的区别及使用场景

#### 回答重点

px (像素)、em 和 rem 都是 CSS 中常用的长度单位，但它们在具体应用上有所不同。

1）px (像素)：px 是一个相对固定的单位，它表示屏幕上的一个点（或一个像素）。使用 px 时，元素的尺寸不会根据外部因素（如父元素或根元素的字体大小）自动调整。适用于需要精确控制尺寸、位置的情况，比如边框、图片大小等。

2）em：em 是相对单位，它基于当前元素的字体大小。例如，如果父元素的字体大小设为 16px，那么 2em 就是 32px。使用 em 可以使布局相对灵活，适用于那些希望根据父元素进行调整的场景，比如按钮、输入框的 padding 和 margin。

3）rem：rem 也是相对单位，但它与 em 的区别在于，它是相对根元素（html 元素）的字体大小。例如，如果 html 的字体大小设为 16px，那么无论在何处，1rem 都等于 16px。使用 rem 可以使整个页面更一致，适用于希望整个页面相对统一且易于维护的场景。

#### 扩展知识

说完了 px、em 和 rem 的基本区别，我觉得可以再深入一下，具体讲解一下它们的优缺点和使用场景。

1）px：

- **优点**：简单直观，适用于需要精确控制布局的场景。
- **缺点**：不利于响应式设计，元素在不同屏幕尺寸下不会自适应。
- **使用场景**：图片大小、边框宽度、某些固定布局。

2）em：

- **优点**：灵活，可相对于父元素进行缩放，非常适合嵌套元素的布局。
- **缺点**：多层嵌套容易造成尺寸难以管理，计算复杂。
- **使用场景**：内边距、外边距、字体大小。

3）rem：

- **优点**：统一性强，修饰过的元素会与根元素的尺寸变化成比例，非常适合响应式设计。
- **缺点**：依赖于根元素的字体设置，需要在设计初期做好规划。
- **使用场景**：页面布局、字体大小。

#### 响应式设计与单位选择

在现代 Web 设计中，响应式设计显得越来越重要。响应式设计要求元素能够根据不同的屏幕大小进行调整。在这种情况下，使用 em 和 rem 会更加合理。

1）**媒体查询与 rem**：媒体查询常常与 rem 配合使用，以此实现基于视口的设计调整。例如：

```css
html {
  font-size: 16px; /* 默认字体大小 */
}
@media (min-width: 600px) {
  html {
    font-size: 18px; /* 大屏设备上的字体大小 */
  }
}
```

这段代码意在根据设备宽度调整根元素的字体大小，从而以 rem 为单位的其他元素会随之调整。

2）**渐进增强与 em**：有时我们需要逐步实例化某些设计上的改变。通过 em 的使用，可以更自然地递进式调整。例如：

```css
button {
  font-size: 1em;
  padding: 0.5em 1em;
}
```

这能确保按钮的字体和内边距会随着父元素的字体大小变化进行调整。



## 25、怎么实现网页两栏布局？

#### 回答重点

实现网页两栏布局，有多种方法，我这里介绍其中两种常见且易于理解的方式：使用传统的 Float 和使用 Flexbox。

1）使用 Float： 可以通过将左侧栏浮动到左边，右侧栏设置 margin-left 来实现。

2）使用 Flexbox： 通过将容器设置为 `display: flex;`，并且让两个子元素分别占据不同的宽度，从而实现两栏布局。

#### 扩展知识

##### 1）使用 Float 实现两栏布局

HTML

```html
<div class="container">
  <div class="left">Left Column</div>
  <div class="right">Right Column</div>
</div>
```

CSS

```css
.container {
  width: 100%;
}

.left {
  float: left;
  width: 70%;  /* 左侧栏宽度 */
  background: lightblue;
}

.right {
  margin-left: 70%;  /* 右侧栏宽度 */
  background: lightcoral;
}
```

传统一些或考虑兼容性的问题时，用 Float 布局是个不错的选择。不过要注意使用 `clearfix` 技巧解决浮动带来的问题，比如父元素高度坍塌等。

##### 2）使用 Flexbox 实现两栏布局

HTML

```html
<div class="container">
  <div class="left">Left Column</div>
  <div class="right">Right Column</div>
</div>
```

CSS

```css
.container {
  display: flex;
}

.left {
  flex: 7;      /* 左侧栏，占 7 份 */
  background: lightblue;
}

.right {
  flex: 3;      /* 右侧栏，占 3 份 */
  background: lightcoral;
}
```

Flexbox 是现代浏览器支持的布局方式，使用起来相对简单灵活，能很快实现复杂的布局需求。

##### 3）其他实现方式

除了上面介绍的两种常见方法，其实还有其他方式可以实现两栏布局，比如使用 `Grid Layout`、或是通过 `position` 属性来进行绝对定位实现。不过这两者稍微复杂了一些，典型场景还是建议优先考虑 Float 和 Flexbox。

###### （1）使用 Grid Layout

```css
.container {
  display: grid;
  grid-template-columns: 70% 30%;  /* 左侧 70%，右侧 30% */
}

.left {
  background: lightblue;
}

.right {
  background: lightcoral;
}
```

###### （2）使用 position

```css
.container {
  position: relative;
}

.left {
  position: absolute;
  width: 70%;
  height: 100%;
  background: lightblue;
}

.right {
  position: absolute;
  width: 30%;
  height: 100%;
  left: 70%;  /* 右侧栏位于左侧栏之后 */
  background: lightcoral;
}
```



## 26、怎么实现网页三栏布局？

#### 回答重点

要实现网页的三栏布局，最常见的方法有以下几种：

##### 1）**Float方式：**

```html
<div class="container">
    <div class="left">Left</div>
    <div class="center">Center</div>
    <div class="right">Right</div>
</div>
.container {
    overflow: hidden;
}
.left, .right {
    width: 200px;
    float: left;
}
.right {
    float: right;
}
.center {
    margin: 0 200px;
}
```

##### 2）**Flexbox方式：**

```html
<div class="container">
    <div class="left">Left</div>
    <div class="center">Center</div>
    <div class="right">Right</div>
</div>
.container {
    display: flex;
}
.left, .right {
    width: 200px;
}
.center {
    flex-grow: 1;
}
```

##### 3）**Grid方式：**

```html
<div class="container">
    <div class="left">Left</div>
    <div class="center">Center</div>
    <div class="right">Right</div>
</div>
.container {
    display: grid;
    grid-template-columns: 200px 1fr 200px;
}
.left {
    grid-column: 1;
}
.center {
    grid-column: 2;
}
.right {
    grid-column: 3;
}
```

#### 扩展知识

虽然这三种方法都是实现三栏布局的常见方法，但它们各有优劣，适用于不同的场景。

##### 1）**Float方式：** 

这是一种较为老旧的方法，兼容性好，可以针对老旧浏览器进行兼容处理，但是需要手动清除浮动，代码稍显复杂。

我推荐在使用这种方法时确保你对`clear`和`clearfix`有一定的认识。例如，可以使用伪元素清除浮动：

```css
.container::after {
    content: "";
    display: table;
    clear: both;
}
```

##### 2）**Flexbox方式：** 

Flexbox是CSS3引入的一种强大的布局工具，处理简单、直观。通过`flex-grow`属性可以很容易地实现自适应的中间栏。需要注意的是Flexbox在IE11及更老的浏览器上可能会存在一些兼容性问题，不过现代浏览器基本都已支持。

使用Flexbox时你还可以借助`flex-direction`、`justify-content`等属性来进行更复杂的布局。

##### 3）**Grid方式：** 

CSS Grid是目前最强大的布局工具，它允许你以二维的方式（rows和columns）来定义布局，非常灵活、功能强大。唯独不足的是对旧浏览器的支持有限，但对于现代应用来说，它是一个非常好的选择。

你可以结合`grid-template-areas`属性来使布局更加清晰明了：

```css
.container {
    display: grid;
    grid-template-areas: "left center right";
    grid-template-columns: 200px 1fr 200px;
}
.left {
    grid-area: left;
}
.center {
    grid-area: center;
}
.right {
    grid-area: right;
}
```



## 27、怎么实现元素的水平垂直居中？

#### 回答重点

实现元素的水平垂直居中主要有几种常见的方式，比如使用 CSS 的「Flexbox」、「Grid」布局，也可以使用绝对定位配合 transform 属性。此外，还可以利用一些传统的方法如表格布局。让我分别简单介绍一下：

1）Flexbox：通过设置父元素的 display 为 flex，并使用 justify-content 和 align-items 属性。 2）Grid布局：通过设置父元素的 display 为 grid，并使用 place-items 属性。 3）绝对定位加 transform：通过绝对定位将元素移动到父元素的中心。 4）表格布局：通过设置 display 为 table 和 display 为 table-cell。

#### 扩展知识

##### 1）**Flexbox布局：**

 Flexbox 是一种一维布局模型，很适合用来进行元素的居中操作。假设我们有如下 HTML 结构：

```html
<div class="parent">
   <div class="child"></div>
</div>
```

我们可以这样做：

```css
.parent {
    display: flex;
    justify-content: center; /* 水平居中 */
    align-items: center;    /* 垂直居中 */
    height: 100vh;          /* 为了示例效果，父元素设置全屏高度 */
}
.child {
    width: 100px;
    height: 100px;
    background-color: red;
}
```

##### 2）**Grid布局：** 

Grid 是一种二维布局模型，可以很轻松地实现居中。使用如下：

```css
.parent {
    display: grid;
    place-items: center; /* 同时水平和垂直居中 */
    height: 100vh;       /* 为了示例效果，父元素设置全屏高度 */
}
.child {
    width: 100px;
    height: 100px;
    background-color: blue;
}
```

3）**绝对定位加 transform：** 这种方法是通过将元素绝对定位到其父元素中部，然后利用 transform 属性的 translate 将其移动到中心位置：

```css
.parent {
    position: relative;
    height: 100vh; /* 为了示例效果，父元素设置全屏高度 */
}
.child {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100px;
    height: 100px;
    background-color: green;
}
```

4）**表格布局法：** 表格布局在传统的 CSS 方法中被广泛使用，但现代开发中不常用它来完成这种需求：

```css
.parent {
    display: table;
    width: 100%;
    height: 100vh; /* 为了示例效果，父元素设置全屏高度 */
}
.child {
    display: table-cell;
    vertical-align: middle;
    text-align: center;
}
.child div {
    display: inline-block;
    width: 100px;
    height: 100px;
    background-color: yellow;
}
```

这里需要注意的是，`text-align: center` 对 div 元素居中无效，我们可以通过在 .child 中嵌套一个 div 元素来进行设置。



## 28、如何根据设计稿进行移动端适配

#### 回答重点

> 根据设计稿进行移动端适配的关键在于灵活运用CSS和媒体查询来响应不同的屏幕尺寸及设备类型。
>
> 在实践中，我一般遵循以下几个步骤：
>
> 1）使用流式布局：避免使用固定宽度，采用百分比来定义元素的宽度。 
>
> 2）媒体查询：通过CSS的media query根据不同的屏幕宽度和设备类型调整样式。 
>
> 3）视口单位：利用vw、vh等视口单位定义尺寸，以适应不同设备。
>
> 4）弹性单位：使用rem或em来定义元素的尺寸，确保字体等比例缩放。 
>
> 5）图片适配：使用灵活的百分比宽度或者srcset属性，使图片能在各尺寸设备上正常显示。 
>
> 6）测试与调试：在实际设备上或模拟器中进行测试，确保在各种环境下都能正常显示。

#### 扩展知识

在实际操作中，我们还可以利用其他技术和策略来增强对移动端适配的处理。

1）**CSS框架**：利用CSS框架如Bootstrap、Foundation，可以快速实现响应式设计，这些框架内置了很多用于移动端适配的工具和样式。 

2）**视口meta标签**：添加视口meta标签来控制布局和缩放行为。例如：

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

3）**Flexbox和Grid布局**：现代CSS布局方式如Flexbox和CSS Grid在处理响应式设计时非常有用，可以大大简化布局代码。例如，使用Flexbox可以轻松实现元素的自适应排列。 

4）**响应式图片**：使用`<picture>`元素和`srcset`属性来加载不同分辨率的图片，从而提高加载效率和视觉效果。例如：

```html
<picture>
   <source srcset="small.jpg" media="(max-width: 600px)">
   <source srcset="large.jpg" media="(min-width: 601px)">
   <img src="default.jpg" alt="Example Image">
</picture>
```

5）**JavaScript响应式设计**：有时通过CSS实现可能不够，我们可以利用JavaScript来辅助进行更复杂的响应式调整。例如，在窗口尺寸变化时动态调整某些元素的样式：

```javascript
window.addEventListener('resize', function() {
  if (window.innerWidth < 600) {
    document.body.style.backgroundColor = 'lightblue';
  } else {
    document.body.style.backgroundColor = 'white';
  }
});
```

6）**使用高倍图像**：考虑到高DPI屏幕（如视网膜屏），使用更高分辨率的图像来确保在这些设备上的显示质量。



## 29、说说你对 Flex 布局的理解及其使用场景

#### 回答重点

Flex 布局，即弹性盒布局（Flexible Box Layout），是一种用于设计更灵活、更高效的响应式布局的 CSS 布局模式。它的核心思想是通过定义容器和子项的关系，以及如何分布和排列子项，来动态适应不同屏幕和容器大小。

具体来说，Flex 布局的重点包括以下几个方面： 

1）`flex-container`：定义为 Flex 布局的父容器；通过设置 `display: flex` 来启用 Flex 布局。 

2）`flex-item`：定义在 Flex 容器中的子元素；这些子元素可以根据各种属性（如 `flex-direction`、`justify-content`）灵活排列。 

3）主轴和交叉轴：Flex 布局包含主轴（默认是水平方向）和与之垂直的交叉轴；轴的方向可以通过 `flex-direction` 属性来设置。 

4）项目的排列和对齐：使用 `justify-content` 来控制子项在主轴上的排列，使用 `align-items` 和 `align-content` 来控制子项在交叉轴上的对齐方式。

#### 扩展知识

Flex 布局的优势在于它能够简化复杂的布局方案，特别是在处理不同终端设备的响应式布局时。我们可以通过以下一些常见属性来深入了解它的强大功能：

1）`flex-direction`：决定主轴的方向，属性值包括 `row`（默认值）、`row-reverse`、`column`、`column-reverse`。

- 举个例子，当我们设置 `flex-direction: column` 时，主轴变为垂直方向，子项会垂直排列。

2）`flex-wrap`：控制子项是否换行，常见属性值有 `nowrap`（默认，子项不换行）、`wrap`（子项换行）、`wrap-reverse`（逆反方向换行）。

- 这个属性特别有用，当容器宽度缩小时，超出部分会自动换行排列，不会溢出容器。

3）`justify-content`：在主轴方向上对齐子项，常见属性值有 `flex-start`、`center`、`flex-end`、`space-between`、`space-around`。

- 如果我们想让子项在主轴上均匀分布，我们可以设置 `justify-content: space-between`，子项会均匀分布，首尾没有空隙。

4）`align-items`：在交叉轴方向上对齐所有子项，常见属性值包括 `stretch`（默认，拉伸子项来填满容器）、`flex-start`、`center`、`flex-end`、`baseline`。

- 当我们想要所有子项在交叉轴上居中对齐时，可以设置 `align-items: center`。

5）`flex-grow`、`flex-shrink` 和 `flex-basis`：分别控制子项的放大、缩小以及基础尺寸。

- 例如，设置一个子项的 `flex-grow: 1` ，表示所有剩余空间将在这个子项中均匀分布。

#### 使用场景例子

1）**导航栏布局**：在导航栏中，可能需要一些项目在左侧排列，一些在右侧排列。通过 Flex 布局的 `justify-content: space-between` 属性，很容易实现这种效果。

2）**响应式网格布局**：我们可以使用 Flex 布局来创建动态响应的网格布局，子项能够根据屏幕宽度自动调整。

3）**垂直居中**：在传统的布局模式中，实现垂直居中对齐需要一些技巧，而 Flex 布局通过合理设置 `align-items` 或 `align-content` 属性很容易实现垂直居中。



## 30、说说响应式设计的概念及基本原理

#### 回答重点

响应式设计（Responsive Design）是一种网页设计方法，它使网页能够在各种设备和窗口或屏幕尺寸上良好地显示和操作。核心目标是提供良好的用户体验，不论用户使用的是PC、平板还是手机。响应式设计的基本原理是通过使用灵活的网格布局、可调整的图像和媒体查询，根据设备的特征自动调整网页的布局。这里主要有几个关键点：

1）**灵活的网格布局**：使用百分比而不是固定的像素来定义页面元素的宽度。 2）**可调整的图像**：根据设备窗口大小动态调整图像尺寸，避免溢出或失真。 3）**媒体查询**：CSS3提供的功能，根据不同的屏幕尺寸和设备类型应用不同的样式规则以适应不同的显示环境。

#### 扩展知识

我们可以进一步探讨一下响应式设计的具体实现方法和一些最佳实践。

1）**视口（Viewport）设置**： 在响应式设计里，HTML的`<meta>`标签通常用于设置视口，使得页面宽度和缩放符合设备。例如：

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

这个标签告诉浏览器页面的宽度应与设备的宽度一致，并且初始缩放比例为1。

2）**流动布局（Fluid Layouts）**： 使用百分比、视口宽度（vw）或视口高度（vh）等相对单位，而不是固定宽度。比如：

```css
.container {
    width: 80%;
}
```

3）**媒体查询（Media Queries）**： 通过CSS的媒体查询，可以分别为不同的设备或屏幕尺寸定义不同的样式。例如：

```css
@media (max-width: 600px) {
    .container {
        width: 100%;
    }
}
```

上面的代码表示当屏幕宽度小于600px时，`.container`的宽度将会被设置为100%。

4）**弹性图片与视频**： 为了保证图片和视频的大小能够自适应，通常会设置最大宽度为100%，这样它们就不会溢出容器。例如：

```css
img {
    max-width: 100%;
    height: auto;
}
```

5）**设计模式**： 在实际设计中，我们常用“移动优先”设计，即首先设计适应小屏幕的页面，然后逐步适应大屏幕。这种方法有助于确保关键功能在所有设备上都能良好地呈现。此外，可以搭配Flexbox或CSS Grid等现代布局工具，以更灵活和高效地实现响应式设计。



## 31、为什么需要清除浮动？清除浮动的方式有哪些？

#### 回答重点

清除浮动主要是为了避免由于浮动元素脱离正常文档流而引发的布局问题。当一个元素浮动时，它从普通文档流中脱离，常常会影响到其父元素和后续兄弟元素的显示效果。典型问题包括父元素无法包裹浮动元素的高度等。清除浮动是为了解决这些布局上的紊乱问题，确保页面布局按照预期运行。

清除浮动的方式有以下几种： 1）使用空的清除浮动元素（clearfix hack）。 2）使用伪元素 `::after` 清除浮动。 3）使用 `overflow` 属性清除浮动。 4）使用 `display: flow-root` 清除浮动。

#### 扩展知识

1）**空的清除浮动元素（clearfix hack）**： 这种方法通过在浮动元素之后插入一个空的拥有 `clear` 样式的 div，来清除浮动。具体实现如下：

```html
<div class="clearfix"></div>
.clearfix {
    clear: both;
}
```

2）**伪元素 `::after` 清除浮动**： 这是比较受欢迎的一种清除浮动方法，通过在父元素的 CSS 规则中添加伪元素 `::after`，给它设置 `clear: both`。

```css
.clearfix::after {
    content: "";
    display: table;
    clear: both;
}
```

通常会通过添加一个泛用的 `clearfix` 类来实现：

```css
.clearfix::after {
    content: "";
    display: table;
    clear: both;
}
```

3）**使用 `overflow` 属性清除浮动**： 这个方法利用 CSS 的 `overflow` 属性让父元素包裹浮动的子元素。这样避免了添加额外的 HTML 元素。

```css
.container {
    overflow: auto;
}
```

在某些浏览器中，使用 `overflow: hidden` 也可以达到同样效果。

4）**使用 `display: flow-root` 清除浮动**： CSS 的 `display: flow-root` 属性可以创建一个新的块级格式化上下文（BFC），从而清除浮动。

```css
.container {
    display: flow-root;
}
```

这种方法是相对简洁的处理方式，因为它不影响其他样式。



## 32、说说你对 BFC 的理解，如何创建 BFC？

#### 回答重点

BFC（块级格式化上下文，Block Formatting Context）是CSS中一种非常重要的布局概念，是一个独立的渲染区域，使其内部的布局不受外部元素影响。了解BFC有助于解决浮动、清除浮动、边距重叠等常见布局问题。

创建BFC非常简单，常见的方法有： 1）设置元素的 `float` 属性为 `left` 或 `right`。 2）设置元素的 `position` 属性为 `absolute` 或 `fixed`。 3）设置元素的 `display` 属性为 `inline-block` 或 `table-cell` 等。 4）设置元素的 `overflow` 属性为 `hidden`、`auto` 或 `scroll`。

#### 扩展知识

简单总结之后，我再详细说说BFC的几个常见使用场景和影响规则吧。

1）**浮动元素的清除**： 当在设计页面布局时，需要清除浮动影响来保证父元素正确的高度，这时可以利用创建BFC来实现。这种方法比给父元素添加一个空的`div`进行清除浮动更优雅。

2）**防止外边距（Margin）重叠**： 如果两个相邻的普通流定位的块元素相遇，它们的垂直外边距会发生重叠（取较大值）。通过创建BFC，可以将两个元素的外边距分离，避免重叠现象。

3）**自适应容器**： BFC可以包含浮动元素。例如，在一个浮动子元素里，如果父元素也是BFC，则父元素就会包含子元素的高度。

4）**隔离 float 元素**： 上面提到，float 元素被包含在BFC里会被包含其高度，如果我们不想其他元素被 float 元素影响布局，那么我们可以给该元素创造一个BFC。

当深入了解BFC及其使用场景后，还有一些相关的概念你也得知晓：

- **IFC（Inline Formatting Context）**：内联格式化上下文，它和BFC一样是CSS布局中的一种概念。IFC主要是指文本在其父级块元素中的布局规则。
- **Flex 和 Grid 布局**：现代前端布局中， Flex 和 Grid 布局也在逐渐替代部分传统布局技巧。了解和掌握它们也非常重要。



## 33、说说网页元素的层叠顺序

#### 回答重点

网页元素的层叠顺序主要由CSS中的`z-index`属性决定。`z-index`的值越大，元素在堆叠顺序中就越靠前。需要注意的是，`z-index`只有在元素有定位属性（`position`为`relative`、`absolute`、`fixed`或`sticky`）时才会生效。如果元素没有指定`z-index`或者`z-index`值相同，则它们的层叠顺序取决于它们在DOM树中的顺序，后面的元素会覆盖前面的元素。

#### 扩展知识

1）**默认层叠顺序**： 在没有指定 `z-index` 的情况下，浏览器会按照元素在DOM树中出现的顺序进行堆叠，DOM树中靠后的元素层级更高。

2）**层叠上下文**： `z-index` 属性的工作是相对当前层叠上下文来说的。新层叠上下文可以通过某些特定属性创建，比如： - `position` 为 `absolute`、`relative`、`fixed` 并且 `z-index` 不为 `auto`。 - `transform` 非 `none` 或 `filter` 非 `none`。 - `opacity` 小于 1。

3）**全局与局部 `z-index`**： 每个独立的层叠上下文内部元素的 `z-index` 值只在该上下文内部比较，换句话说，子元素的 `z-index` 无法超越父层叠上下文的 `z-index`。

4）**层叠上下文的创建规则**： 层叠上下文不仅由于 `z-index` 创建，许多CSS属性也会创建层叠上下文，例如： - 使用 `transform`、`opacity`、`filter`、`perspective`、`clip-path`等样式。

5）**CSS优先级和继承**： 在实际项目中，还需要考虑不同选择器的优先级与继承关系。更高优先级的样式会覆盖更低优先级的样式，不过 `z-index` 值的叠加与选择器的优先级无关。

6）**实际布局问题**： 理解并正确应用`z-index`和层叠上下文是前端开发中解决元素重叠问题的关键。调试网页时，可以通过浏览器自带的开发者工具（如Chrome的开发者工具）观察和修改元素的`z-index`，快速定位和解决布局问题。



## 34、如何用 CSS 实现一个宽高自适应的正方形？

#### 回答重点

要实现一个宽高自适应的正方形，最简单的方法是使用 **padding-top** 或 **padding-bottom**。因为在 CSS 中，padding 的百分比是相对于父元素的宽度来计算的。通过这种方法可以确保元素的宽高成比例，保持正方形的形状。下面是具体的示例代码：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>自适应正方形</title>
    <style>
        .square {
            width: 50%; /* 可根据需要调整宽度 */
            padding-top: 50%; /* 保持宽高比例为1:1 */
            background-color: lightblue; /* 仅用于展示效果 */
            position: relative; /* 让内部元素能够相对定位 */
        }

        .square-content {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
        }
    </style>
</head>
<body>
    <div class="square">
        <div class="square-content">
            正方形内容
        </div>
    </div>
</body>
</html>
```

在这个例子中，`.square` 的 `padding-top` 设置为 `50%`，这保证了它的高度总是等于宽度的 50%，也就是保持 1:1 的比例成为一个正方形。

#### 扩展知识

1）**使用伪元素**：如果你不想在容器中放置无意义的内容或对于内部的内容有其他的需求，可以使用伪元素实现相同的效果。

```css
.square:before {
    content: "";
    display: block;
    padding-top: 100%; /* 保持宽高比例为1:1 */
}
```

2）**Flexbox 解决方案**：使用 Flexbox 可以简化布局，同时保证子元素在正方形内部居中。

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>自适应正方形-Flexbox</title>
    <style>
        .flex-square {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 50%;
            padding-top: 50%;
            background-color: lightcoral;
            position: relative;
        }

        .flex-square-content {
            position: absolute;
        }
    </style>
</head>
<body>
    <div class="flex-square">
        <div class="flex-square-content">
            正方形内容
        </div>
    </div>
</body>
</html>
```

3）**适应不同设备**：使用媒体查询可以确保正方形适应不同的视口和设备。

```css
@media (max-width: 600px) {
    .square {
        width: 80%;
        padding-top: 80%;
    }
}
```

通过这种方式，你可以更灵活地控制正方形的大小以适应不同设备的屏幕尺寸。



## 35、如何检测 CSS 动画的 FPS 值？

#### 回答重点

检测 CSS 动画的 FPS（帧率）值，即每秒呈现的帧数，可以通过 JavaScript 与 `requestAnimationFrame` 方法配合相应的时间计算来实现。基本思路是每帧动画时记录当前时间，并通过时间差计算帧率。核心代码如下：

```javascript
let lastTime = performance.now();
let frameCount = 0;

function measureFPS() {
    let currentTime = performance.now();
    frameCount++;
    
    if (currentTime - lastTime >= 1000) {  // 每秒统计一次
        let fps = frameCount;
        console.log(`FPS: ${fps}`);
        frameCount = 0;
        lastTime = currentTime;
    }
    
    requestAnimationFrame(measureFPS);
}

requestAnimationFrame(measureFPS);
```

这个代码实现了一个实时的 FPS 监测，每秒钟计算一次 FPS 并打印到控制台。

#### 扩展知识

这个问题涉及一些关于前端动画性能优化的知识点，我可以进一步讲解几个重要的方面：

1）**requestAnimationFrame 方法**：这是一个用于告知浏览器你希望执行动画并请求浏览器在下一次重绘之前调用指定的回调函数的方法。与传统的 `setInterval` 不同，`requestAnimationFrame` 能够更智能地优化动画效果，使其更加流畅。浏览器会根据自身的刷新频率（通常是60Hz）来调用这个函数，让动画帧率更加稳定。

2）**性能检测工具**：除手写 FPS 检测代码外，许多浏览器自带开发者工具也可以帮助检测动画性能。例如，Chrome 开发者工具的 "Performance" 标签，Safari 的 "Timelines" 标签，这些工具可以记录并分析动画执行情况，显示 CPU 使用率和 FPS。

3）**资源优化技巧**：

- **CSS3硬件加速**：通过使用 `transform`、`opacity` 等属性代替 `top`、`left` 可以显著提升动画性能，因为前者可以利用 GPU 进行硬件加速。
- **减少重排和重绘**：保证动画过程中不会频繁触发布局（重排）和绘制（重绘），这可以通过精简 DOM 结构和避免昂贵的样式计算来实现。
- **动画特效库**：使用专门为高性能设计的动画库如 `GSAP`、`Three.js` 也能进一步优化动画的流畅度和性能，很多库都内建了高效的动画管理机制。

4）**现代 Web API**：

- **Intersection Observer**：对于涉及视窗内外切换的动画，可以通过 Intersection Observer 来监测 DOM 元素是否在视窗内，来基于元素可见性动态控制动画的开启与关闭。
- **Web Animations API**：提供了更强大、细粒度的动画控制，对于创建复杂的动画效果，可以更方便地使用并优化动画性能。



## 36、CSS 的 flex 布局有什么好处?

#### 回答重点

CSS 的 flex 布局是一种专门为复杂布局而设计的强大功能。它相对于传统的布局方式（如 float 布局和定位布局）有很多显著的好处：

1. **灵活性**：Flex 布局允许容器内的元素自动调整大小，占满可用空间。这特别适合响应式设计。
2. **便捷的对齐和排序**：可以轻松实现水平居中、垂直居中以及任意方向的排列。使用 `justify-content` 和 `align-items` 属性就能控制主轴和交叉轴上的对齐方式。
3. **简化的代码**：相比传统布局，flex 布局的代码更简洁，更直观。通过简单定义父元素和子元素的属性即可实现复杂排版。
4. **动态调整**：Flex 布局可以根据内容动态调整布局，确保在不同设备和窗口大小下都能很好地呈现内容。

#### 扩展知识

Flex 布局虽然强大，但也有一些最佳实践和注意事项，这里我再详细讲解一下几个重点：

1. **主轴和交叉轴**：
   - Flex 布局是基于主轴和交叉轴来工作的。所谓主轴，就是 `flex-direction` 定义的方向（水平或垂直），交叉轴则是垂直于主轴的方向。
   - `flex-direction` 属性有几种常见值，比如 `row`（水平，默认），`column`（垂直），以及它们的反向 `row-reverse` 和 `column-reverse`。
2. **常用的 flex 属性**：
   - `justify-content`: 控制主轴上的对齐方式。常见值包括 `flex-start`, `flex-end`, `center`, `space-between`, `space-around`。
   - `align-items`: 控制交叉轴上的对齐方式。常见值包括 `stretch`（默认），`flex-start`, `flex-end`, `center`, `baseline`。
   - `flex-wrap`: 默认情况下，flex 项目会在一行内排列，使用 `flex-wrap: wrap` 可以使得项目自动换行。
3. **flex 子元素的控制**：
   - `flex-grow`: 定义元素如何按比例增长。如果所有子元素的 `flex-grow` 都是 1，那么它们会等比例地分配多余的空间。
   - `flex-shrink`: 定义元素如何按比例缩小。通常与 `flex-basis` 配合使用。
   - `flex-basis`: 类似于 `width` 或 `height` 属性，指定了在分配空间之前，元素的默认大小。
4. **兼容性**：
   - Flex 布局在大多数现代浏览器中都有很好的兼容性。但在较旧的浏览器版本中可能会遇到一些问题。建议在使用前查看目标浏览器的支持情况，并可能使用一些 polyfill 或冻结工具来增强兼容性。



## 37、CSS 中 flex: 1 是什么意思？

#### 回答重点

`flex: 1` 在 CSS 中用于 `flex` 布局，它是 `flex-grow`、`flex-shrink` 和 `flex-basis` 三个属性的简写。具体来说，`flex: 1` 等同于 `flex: 1 1 0`，这意味着： 1）`flex-grow: 1` —— 元素可以根据剩余空间进行扩展。 2）`flex-shrink: 1` —— 元素在空间不足时可以缩小。 3）`flex-basis: 0` —— 元素的基础尺寸为 0，剩余空间会根据 `flex-grow` 属性进行分配。

总之，`flex: 1` 通常用于使元素在容器中平均分配多余的空间，显得各个元素一样宽。

#### 扩展知识

1）**`flex-grow`：** 决定了 flex 项目在有多余空间时的扩展能力。值为正整数，数值越大，分配的空间越多。 2）**`flex-shrink`：** 决定了 flex 项目在空间不足时的收缩能力。值为正整数，数值越大，收缩的比例越大。 3）**`flex-basis`：** 定义了 flex 项目的基础尺寸。在有多余空间时，以这一定义的基础进行扩展或收缩。 4）**简写属性：** `flex` 是 `flex-grow`、`flex-shrink` 和 `flex-basis` 的简写，可以同时定义这些属性，从而简化代码。 5）**具体例子：**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        .container {
            display: flex;
            border: 1px solid #000;
        }
        .item {
            flex: 1;
            border: 1px solid red;
        }
    </style>
    <title>Flex Example</title>
</head>
<body>
    <div class="container">
        <div class="item">Item 1</div>
        <div class="item">Item 2</div>
        <div class="item">Item 3</div>
    </div>
</body>
</html>
```

在这个例子中，每个 `.item` 元素都会在 `.container` 容器中平均分配空间。

6）**其他常见值：** - `flex: 2` 会使该元素占据相对于 `flex: 1` 元素两倍的空间。 - `flex: 0 1 auto` 表示元素不能扩展，但在必要时可以缩小，基础尺寸依据内容自动决定而非 0。



## 38、如何在浏览器可视区域画一个最大的正方形？

#### 回答重点

要在浏览器的可视窗口内画一个最大的正方形，核心思路就是利用浏览器窗口的高度和宽度，选择较小的那个值来设置正方形的边长。这样正方形才能完全适应在可视区域内。

实现方式可以简单概括为： 1）用 JavaScript 获取窗口的宽度和高度。 2）取两者中的较小值，设为正方形的边长。 3）使用 CSS 来设置这个正方形的大小和居中。

具体代码如下：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        .square {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: lightblue;
        }
    </style>
    <title>Max Square</title>
</head>
<body>
    <div id="square" class="square"></div>
    <script>
        function drawMaxSquare() {
            const square = document.getElementById('square');
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const sideLength = Math.min(windowWidth, windowHeight);
            square.style.width = `${sideLength}px`;
            square.style.height = `${sideLength}px`;
        }

        // Initial draw
        drawMaxSquare();

        // Redraw if window is resized
        window.addEventListener('resize', drawMaxSquare);
    </script>
</body>
</html>
```

在这段代码中，我创建了一个 `div` 元素，并通过 JavaScript 动态设置其宽和高，使其保持最大可视区域内的正方形状态。同时，通过监听 `window` 的 `resize` 事件来保持正方形在窗口大小变化时也能自适应。

#### 扩展知识

1）**窗口大小的获取**：在这个问题中，`window.innerWidth` 和 `window.innerHeight` 是直接忽略滚动条，获取浏览器可视区域的有效方式。

2）**CSS 居中方式**：使用 `position: absolute` 并配合 `transform: translate(-50%, -50%)`，可以让任何元素不管是宽度、高度明确还是不明确，都能在父容器内实现居中。此外，其他常见的方式还有 `flexbox` 和 `grid`，这两种CSS布局方式更强大，在复杂的布局需求中非常实用。

3）**响应式设计**：在现代前端开发中，响应式设计非常重要。通过监听窗口变化，可以适应不同设备和屏幕的大小变化，从而提供更好的用户体验。现代CSS的 `@media` 查询也能实现相似的效果。

4）**性能考虑**：添加窗口大小变化监听器时，应当注意性能问题。在窗口大小频繁变化的时候，比如用户快速拖动调整窗口大小，频繁触发事件监听器可能导致性能下降。可以考虑 debounce 技术限制事件处理频率。



## 39、CSS **伪元素和伪类的作用和区别？**

#### 回答重点

CSS 伪元素和伪类都是用于修饰文档的特定部分，但它们的作用和应用场景有所不同。伪元素用于创建你不平常的标记，即增加文档里实际不存在的元素，常用于将样式应用到某个元素的一部分。而伪类则表示元素的某种状态，因而可以选择和样式化元素的特定状态。

1）伪元素：伪元素主要用于选取和样式化某个元素的一部分，比如首字母、第一行文本、或是在某个元素内容之前或之后插入内容。常见的伪元素有 `::before`、`::after`、`::first-line` 和 `::first-letter`。

2）伪类：伪类则用于选择那些特殊状态下的元素，比如鼠标悬停、被点击等。常见的伪类有 `:hover`、`:focus`、`:active` 和 `:nth-child`。

3）语法区别：伪类一般使用单个冒号 `:`，而伪元素在 CSS3 标准中使用双冒号 `::`。例如：`:hover` 是伪类，而 `::before` 是伪元素。

#### 扩展知识

伪元素和伪类在实战中的应用非常广泛，除了基础应用外，我们可以挖掘更多高级技巧来提升页面表现效果。

1）**伪元素扩展:** a) **::before 和 ::after**: 利用这两个伪元素，可以在元素的内容之前和之后插入额外的内容或样式，常用作装饰效果。例如在按钮前添加图标或者在特定文本之后添加引号。

```css
.button::before {
  content: '🔥';
  margin-right: 8px;
}
```

b) **::first-letter 和 ::first-line**: 这两个伪元素能够选择并样式化某段文本的首字母和首行，非常适合文章排版中的美化效果。

```css
p::first-letter {
  font-size: 2em;
  font-weight: bold;
}
```

2）**伪类扩展:** a) **动态伪类**: 如 `:hover`、`:focus` 等，用于实现交互效果，比如鼠标悬停高亮、输入框聚焦改变边框颜色。

```css
a:hover {
  color: red;
}
input:focus {
  border-color: blue;
}
```

b) **结构性伪类**: 如 `:nth-child`、`:last-child` 等，用于选择特定位置的元素。

```css
li:nth-child(odd) {
  background-color: #f2f2f2;
}
li:last-child {
  border-bottom: none;
}
```

3）**综合应用：**

- **灵活布局**: 利用伪元素可以实现复杂的布局结构，特别是当我们需要一些不影响文档流的修饰元素时，例如玩具标签云、导航菜单分割线等。

```css
.nav::after {
  content: '';
  display: block;
  clear: both;
}
```

- **动画和过渡效果**: 结合伪类，可以制作一些有趣的动画效果，如按钮点击后的微动效应、图片加载过程中的占位符效果等。

```css
.image:hover::after {
  opacity: 0.5;
}
```