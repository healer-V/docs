---
title: "02-CSS 基础"
category: "基础知识"
tags:
  - CSS
excerpt: "CSS（Cascading Style Sheets）层叠样式表： 用于控制网页的表现和布局 实现内容与样式的分离 支持响应式设计和动画效果 CSS发展历史 1996年：CSS1发布（字体、颜色等基础样式） 1998年：CSS2发布（定位、..."
---

# 02-CSS 基础

## 一、CSS基础概念

### 1、 CSS简介
>[!TIP]
> CSS（Cascading Style Sheets）层叠样式表：
> - 用于控制网页的表现和布局
> - 实现内容与样式的分离
> - 支持响应式设计和动画效果

>[!TIP] CSS发展历史
> - 1996年：CSS1发布（字体、颜色等基础样式）
> - 1998年：CSS2发布（定位、媒体查询等）
> - 2009年：CSS3发布（动画、渐变、阴影等现代特性）

>[!TIP] CSS基本语法
> CSS规则由选择器和声明块组成：
> - `选择器`：指定样式应用的元素
> - `声明块`：包含一组用{}包裹的样式声明
> - `声明`：由属性和值组成，以分号结尾

>[!note]常用CSS属性分类
>1. **布局属性**：display, position, float, clear等
>2. **盒模型属性**：width, height, padding, margin, border等
>3. **文本属性**：color, font-size, line-height, text-align等
>4. **背景属性**：background-color, background-image等
>5. **动画属性**：transition, animation, transform等

:::details 详细属性示例
```css
/* 基本语法示例 */
selector {
  /* 布局属性 */
  display: block; /* 块级元素 */
  position: relative; /* 相对定位 */
  
  /* 盒模型 */
  width: 100px;
  height: 100px;
  padding: 10px;
  margin: 20px;
  border: 1px solid #000;
  
  /* 文本样式 */
  color: #333;
  font-size: 16px;
  text-align: center;
  
  /* 背景 */
  background-color: #f5f5f5;
  
  /* 动画 */
  transition: all 0.3s ease;
}
```
:::

## 二、CSS核心模块

### 1、选择器系统

#### 1.1、类型 & 优先级

::: tip 选择器优先
 - ID选择器: 100
 - 类选择器: 10
 - 属性选择器: 10
 - 伪类选择器: 10
 - 伪元素选择器: 1
 - 元素选择器: 1
 - 通配符选择器: 0
 - 后代选择器: 0
 - 子元素选择器: 0
 - 相邻兄弟选择器: 0
::: 

#### 1.2、选择器语法

:::details 详细选择器示例
```css
/* 元素选择器 - 选择所有<p>元素 */
p { 
  color: blue;
  margin: 10px 0;
}

/* 类选择器 - 选择class包含"btn"的元素 */
.btn {
  padding: 8px 16px;
  border-radius: 4px;
  background: #4285f4;
  color: white;
}

/* ID选择器 - 选择id为"header"的元素 */
#header {
  height: 60px;
  background: #333;
  color: white;
}

/* 通配符选择器 - 选择所有元素 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
```
:::

#### 1.3、组合
>[!note] 组合方式
>1. 后代 : `空格`
>2. 子元素 : `>`
>3. 相邻兄弟 : `+`
>4. 通用兄弟 ：`~`
>5. 列组合器 ： `||`
>6. 分组选择器 ：`,`
>7. 层叠组合 ：`@layer`

::: details 选择器示例
```css
/* 后代选择器 */
div p { color: green; }

/* 子元素选择器 */
div > p { font-weight: bold; }

/* 相邻兄弟选择器 */
h1 + p { margin-top: 0; }

/* 通用兄弟选择器： h1 后面所有的 p 兄弟元素 */
h1 ~ p { color: green; }

/* 列组合选择器：选择属于 "selected" 列的单元格 */
col.selected || td {
  background: lightblue;
}


/* 分组选择器：h1、h2、h3 都应用相同的样式 */
h1, h2, h3 {
  font-family: Arial;
}


/* 复合选择器 同时具有 class1 和 class2 的元素 */
.class1.class2 {
  background: yellow;
}

```
:::

#### 1.3 伪类与伪元素
>[!tip]核心差异
> - `伪类`：是选择处于特定状态的元素，其本质是已有元素的特殊状态。如：hover、active、focus、nth-child等
> - `伪元素`：用于创建文档树里不存在的虚拟元素，如：::before、::after、::first-line（元素的首行）等

:::details 伪类示例
```css
a:hover {
  color: red; /* 鼠标悬停在链接上时，文字变红 */
}

input:focus {
  border: 2px solid blue; /* 输入框获得焦点时，边框变蓝 */
}

li:nth-child(odd) {
  background-color: #f2f2f2; /* 列表奇数项背景设为浅灰色 */
}
```
:::
:::details 伪元素示例
```css
p::before {
  content: "→ "; /* 在段落前添加箭头符号 */
  color: gray;
}

p::first-line {
  font-weight: bold; /* 段落首行文字加粗 */
}

::selection {
  background-color: yellow; /* 选中文本时，背景变黄 */
}
```
:::

### 2、盒模型
>[!TIP] 定义
> 每个元素都是一个矩形盒子，包含：
> - `content（内容）`: width, height
> - `padding（内边距）`: padding-top/right/bottom/left
> - `border（边框）`: border-width/style/color
> - `margin（外边距）`: margin-top/right/bottom/left

#### 标准盒模型 vs 怪异盒模型
>[!NOTE] 盒模型分类
> **标准盒模型**:
> - `box-sizing: content-box;`   （**默认值**）
> - width/height只包含content内容区
> - `总宽度` = width + padding + border
> - 默认模式，符合W3C标准
>
> **怪异盒模型**:
> - `box-sizing: border-box;` （**怪异盒**）
> - width/height包含content + padding + border
> - `总宽度` = width (已包含padding和border)
> - 传统浏览器渲染模式

:::details 盒模型对比示例
```css
/* 标准盒模型 */
.box-standard {
  box-sizing: content-box; /* 默认值 */
  width: 300px;
  padding: 20px;
  border: 10px solid black;
  /* 实际宽度 = 300 + 20*2 + 10*2 = 360px */
}

/* 怪异盒模型 */ 
.box-quirks {
  box-sizing: border-box;
  width: 300px;
  padding: 20px;
  border: 10px solid black;
  /* 实际宽度 = 300px (包含padding和border) */
}
```

**应用场景**：
- 响应式布局推荐使用`border-box`，更易控制元素尺寸
- 传统网站可能需要保持`content-box`以兼容旧布局
- 可通过`box-sizing`属性切换盒模型
:::

:::details 详细盒模型属性
```css
.box {
  /* 内容区尺寸 */
  width: 300px;   /* 宽度 */
  height: 200px;  /* 高度 */
  min-width: 100px; /* 最小宽度 */
  max-width: 500px; /* 最大宽度 */
  
  /* 内边距 */
  padding: 20px; /* 简写：上下左右 */
  padding: 10px 20px; /* 上下 | 左右 */
  padding: 10px 20px 30px 40px; /* 上 右 下 左 */
  
  /* 边框 */
  border: 1px solid #ccc; /* 简写 */
  border-width: 1px 2px 3px 4px;
  border-style: solid dotted dashed double;
  border-color: red green blue black;
  
  /* 外边距 */
  margin: 10px; /* 简写 */
  margin-top: 5px;
  margin-right: auto; /* 水平居中 */
  
  /* 盒模型计算方式 */
  box-sizing: border-box; /* 包含padding和border */
}
```
:::

### 3、布局系统
#### 3.1、传统布局
>[!TIP] 两种方式
> - 浮动布局：通过float属性实现
> - 定位布局：通过position属性实现

:::details 代码示例
```css
/* 浮动布局 */
.float-left { float: left; }

/* 定位布局 */
.positioned {
  position: relative;
  top: 20px;
  left: 30px;
}
```
:::

#### 3.2、Flex布局
>[!TIP] 定义
>1. 意为：**弹性布局**
>2. 用来为盒状模型提供最大的灵活性
>3. 任何一个容器都可以指定为 Flex 布局
>4. 设为 Flex 布局以后，子元素的`float`、`clear`和`vertical-align`属性将失效
>5. Webkit 内核的浏览器，必须加上-webkit前缀

:::details 加上厂商前缀
```css
.box{
  display: -webkit-flex; /* Safari */
  display: flex;
}
```
:::

##### 3.2.1、容器属性
1. **display**: 
::: tip 值
   - `flex`: 启用flex布局
   - `inline-flex`: 行内flex布局
:::
2. **flex-direction**: 定义主轴方向
::: tip 值
   - `row` (默认): 水平方向，起点在左端
   - `row-reverse`: 水平方向，起点在右端
   - `column`: 垂直方向，起点在上沿
   - `column-reverse`: 垂直方向，起点在下沿
:::
3. **flex-wrap**: 定义换行方式
::: tip 值
   - `nowrap` (默认): 不换行
   - `wrap`: 换行，第一行在上方
   - `wrap-reverse`: 换行，第一行在下方
:::
4. **justify-content**: 主轴对齐方式
::: tip 值
   - `flex-start` (默认): 向主轴起点对齐
   - `flex-end`: 向主轴终点对齐
   - `center`: 居中对齐
   - `space-between`: 两端对齐，项目间隔相等
   - `space-around`: 每个项目两侧间隔相等
   - `space-evenly`: 项目间隔和边框间隔都相等
:::
5. **align-items**: 交叉轴对齐方式
::: tip 值
   - `stretch` (默认): 拉伸填满容器高度
   - `flex-start`: 向交叉轴起点对齐
   - `flex-end`: 向交叉轴终点对齐
   - `center`: 居中对齐
   - `baseline`: 项目第一行文字基线对齐
:::
6. **align-content**: 多轴线对齐方式
::: tip 值
   - `stretch` (默认): 轴线占满整个交叉轴
   - `flex-start`: 向交叉轴起点对齐
   - `flex-end`: 向交叉轴终点对齐
   - `center`: 居中对齐
   - `space-between`: 两端对齐，轴线间隔相等
   - `space-around`: 每个轴线两侧间隔相等
:::
7. **gap**: 项目间距
::: tip 值
   - `row-gap`: 行间距
   - `column-gap`: 列间距
   - `gap`: 简写形式
:::

##### 3.2.2、项目属性
1. **order**: 排列顺序
::: tip 值
   - 数值越小，排列越靠前，默认为0
:::
2. **flex-grow**: 放大比例
::: tip 值
   - 默认为0，即不放大
   - 数值表示放大比例
:::
3. **flex-shrink**: 缩小比例
::: tip 值
   - 默认为1，即空间不足时项目会缩小
   - 0表示不缩小
:::
4. **flex-basis**: 项目初始大小
::: tip 值
   - `auto` (默认): 根据内容自动计算
   - 长度值: 如`100px`、`20%`等
   - `content`: 根据内容决定
:::
5. **flex**: 简写属性
::: tip 值
   - `flex: flex-grow flex-shrink flex-basis`
   - 常用简写:
     - `flex: 1` = `flex: 1 1 0%`
     - `flex: auto` = `flex: 1 1 auto`
     - `flex: none` = `flex: 0 0 auto`
:::
6. **align-self**: 单个项目对齐方式
::: tip 值
   - `auto` (默认): 继承父容器的align-items
   - 其他值与align-items相同
:::

:::details 详细Flex属性
```css
/* 容器属性 */
.container {
  display: flex; /* 启用flex布局 */
  flex-direction: row; 
  /* 主轴方向: row|row-reverse|column|column-reverse */
  flex-wrap: nowrap; 
  /* 换行: nowrap|wrap|wrap-reverse */
  justify-content: center; 
  /* 主轴对齐: flex-start|flex-end|center|space-between|space-around */
  align-items: center; 
  /* 交叉轴对齐: stretch|flex-start|flex-end|center|baseline */
  align-content: stretch; /* 多轴线对齐 */
  gap: 10px; /* 项目间距 */
}

/* 项目属性 */
.item {
  order: 0; /* 排列顺序 */
  flex-grow: 0; /* 放大比例 */
  flex-shrink: 1; /* 缩小比例 */
  flex-basis: auto; /* 项目初始大小 */
  align-self: auto; /* 单个项目对齐方式 */
}
```
:::

#### 3.3、Grid布局
>[!TIP] Grid属性详解

|    |属性名|属性值|取值范围|
|----|----|----|---|
|容器属性|`display`|设置布局方式|`grid` `inline-grid`|
|容器属性|`grid-template-columns`|定义列轨道|`100px`, `1fr`, `minmax(100px, 1fr)` `repeat(12, 1fr)`|
|容器属性|属性|属性||
|----|----|----|---|
|项目属性|属性|属性||


##### 3.3.1、容器属性
1. **display**: 
::: tip 值
   - `grid`: 启用grid布局
   - `inline-grid`: 行内grid布局
:::
2. **grid-template-columns**: 定义列轨道
::: tip 值
   - 长度值: `100px`, `1fr`, `minmax(100px, 1fr)`
   - 重复函数: `repeat(12, 1fr)`
   - 自动填充: `repeat(auto-fill, minmax(200px, 1fr))`
:::
3. **grid-template-rows**: 定义行轨道
::: tip 值
   - 与grid-template-columns类似
:::
4. **grid-template-areas**: 定义网格区域
::: tip 值
   - 命名区域: `"header header header" "main main sidebar" "footer footer footer"`
:::
5. **grid-template**: 简写属性
::: tip 值
   - `grid-template: rows / columns`
   - `grid-template: areas rows / columns`
:::
6. **gap**: 网格间距
::: tip 值
   - `row-gap`: 行间距
   - `column-gap`: 列间距
   - `gap`: 简写形式
:::
7. **justify-items**: 单元格水平对齐
::: tip 值
   - `start` | `end` | `center` | `stretch` (默认)
:::
8. **align-items**: 单元格垂直对齐
::: tip 值
   - `start` | `end` | `center` | `stretch` (默认)
:::
9. **justify-content**: 网格水平对齐
::: tip 值
   - `start` | `end` | `center` | `stretch` | `space-around` | `space-between` | `space-evenly`
:::
10. **align-content**: 网格垂直对齐
::: tip 值
 - `同justify-content`
:::
11. **grid-auto-columns**: 隐式列轨道大小
::: tip 值
  - 长度值: `100px`, `1fr`等
:::

12. **grid-auto-rows**: 隐式行轨道大小
::: tip 值
  - 同grid-auto-columns
:::

13. **grid-auto-flow**: 自动放置算法
::: tip 值
  - `row` (默认) | `column` | `row dense` | `column dense`
:::
##### 3.3.2、项目属性
1. **grid-column**: 列位置
::: tip 值
   - `grid-column-start`: 起始列线
   - `grid-column-end`: 结束列线
   - 简写: `grid-column: start / end`
:::
2. **grid-row**: 行位置
::: tip 值
   - `grid-row-start`: 起始行线
   - `grid-row-end`: 结束行线
   - 简写: `grid-row: start / end`
:::

3. **grid-area**: 网格区域
::: tip 值
   - 命名区域: `grid-area: header`
   - 简写位置: `grid-area: row-start / column-start / row-end / column-end`
:::
4. **justify-self**: 单个项目水平对齐
::: tip 值
   - `start` | `end` | `center` | `stretch` (默认)
:::
5. **align-self**: 单个项目垂直对齐
::: tip 值
   - `start` | `end` | `center` | `stretch` (默认)
:::
6. **place-self**: 简写属性
::: tip 值
   - `place-self: align-self justify-self`
:::

:::details 详细Grid属性
```css
/* 容器属性 */
.grid-container {
  display: grid; /* 启用grid布局 */
  
  /* 定义网格轨道 */
  grid-template-columns: 100px 1fr 2fr; /* 3列: 固定100px + 比例分配 */
  grid-template-rows: 80px auto 100px; /* 3行 */
  
  /* 网格间距 */
  gap: 20px; /* 行列间距 */
  column-gap: 10px; /* 列间距 */
  row-gap: 15px; /* 行间距 */
  
  /* 对齐方式 */
  justify-items: stretch; /* 水平对齐: start|end|center|stretch */
  align-items: center; /* 垂直对齐: start|end|center|stretch */
  
  /* 显式网格区域命名 */
  grid-template-areas:
    "header header header"
    "sidebar main main"
    "footer footer footer";
}

/* 项目属性 */
.grid-item {
  /* 项目位置 */
  grid-column: 1 / 3; /* 跨越1到3列 */
  grid-row: 2; /* 位于第2行 */
  
  /* 命名区域放置 */
  grid-area: header; /* 放入header区域 */
  
  /* 项目对齐 */
  justify-self: start; /* 单个项目水平对齐 */
  align-self: end; /* 单个项目垂直对齐 */
  
  /* 自动放置控制 */
  grid-auto-flow: row dense; /* 自动填充空白 */
}

```
:::

:::details 网格布局案例
```css
/* 1. 12列网格系统 */
.grid-12 {
  grid-template-columns: repeat(12, 1fr);
}

/* 2. 响应式网格 */
@media (min-width: 768px) {
  .responsive-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

/* 3. 圣杯布局 */
.holy-grail {
  grid-template:
    "header header header" 80px
    "nav content aside" 1fr
    "footer footer footer" 60px / 200px 1fr 200px;
}
```
:::



### 4、响应式设计

#### 2.4.1 核心概念
>[!note] 概念
>1. **定义**：响应式网页设计(RWD)是一种网页设计方法，使网站能够自动适应不同设备的屏幕尺寸
>2. **三大技术支柱**：
>   - 流体网格(Fluid Grids)
>   - 弹性图片(Flexible Images)
>   - 媒体查询(Media Queries)
>3. **设计原则**：
>   - 移动优先(Mobile First)
>   - 渐进增强(Progressive Enhancement)

#### 2.4.2 媒体查询详解
>[!NOTE] 媒体查询
> - 允许内容呈现适应不同的设备或屏幕尺寸，从而提供更好的用户体验。
> - 媒体查询可以针对不同的媒体类型（如屏幕、打印）和不同的设备特性（如视口宽度、高度、方向等）应用不同的样式规则。


```css
@media [媒体类型] and (媒体特性) {
  /* CSS规则 */
}
```

##### 媒体类型
:::tip
- `all` (默认): 所有设备
- `screen`: 电脑屏幕、平板、手机等
- `print`: 打印机和打印预览
- `speech`: 屏幕阅读器
:::

##### 常用媒体特性
:::tip
1. **宽度相关**:
   - `width`: 视口宽度
   - `min-width`: 最小宽度
   - `max-width`: 最大宽度
2. **高度相关**:
   - `height`: 视口高度
   - `min-height`: 最小高度
   - `max-height`: 最大高度
3. **方向**:
   - `orientation`: portrait(竖屏) | landscape(横屏)
4. **分辨率**:
   - `resolution`: 设备分辨率
   - `min-resolution`: 最小分辨率
   - `max-resolution`: 最大分辨率
:::

##### 常见断点设置

::: details 断点设置示例
```css
/* 移动设备 (竖屏) */
@media (max-width: 767px) { /* ... */ }

/* 平板 (横屏) */
@media (min-width: 768px) and (max-width: 1023px) { /* ... */ }

/* 桌面 */
@media (min-width: 1024px) { /* ... */ }

/* 高清屏幕 */
@media (min-resolution: 2dppx) { /* ... */ }
```
:::

#### 2.4.3 响应式布局技术
1. **流体网格**:
>[!TIP] 定义
> 通过使用`百分比宽度`来创建响应式网页，使页面在不同的设备上都能有相同的宽度。

:::details 流体网格示例
```css
.container {
  width: 100%;
  max-width: 1200px; /* 最大宽度限制 */
  margin: 0 auto;
}

.column {
  float: left;
  width: 50%; /* 流体宽度 */
  padding: 15px;
  box-sizing: border-box; /* 怪异盒模型 */
}
```
:::

2. **Flexbox布局**:
```css
.flex-container {
  display: flex;
  flex-wrap: wrap;
}

.flex-item {
  flex: 1 1 300px; /* 基础宽度300px，可伸缩 */
  margin: 10px;
}
```

3. **Grid布局**:
```css
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}
```

#### 2.4.4 响应式图片
1. **srcset属性**:
```html
<img src="small.jpg" 
     srcset="medium.jpg 1000w, large.jpg 2000w"
     sizes="(max-width: 600px) 100vw, 50vw">
```

2. **picture元素**:
```html
<picture>
  <source media="(min-width: 800px)" srcset="large.jpg">
  <source media="(min-width: 400px)" srcset="medium.jpg">
  <img src="small.jpg" alt="示例图片">
</picture>
```

3. **CSS背景图**:
```css
.hero {
  background-image: url('small.jpg');
}

@media (min-width: 768px) {
  .hero {
    background-image: url('large.jpg');
  }
}
```

#### 2.4.5 移动优先策略
1. **基础样式**:
```css
/* 移动设备基础样式 */
body {
  font-size: 14px;
  line-height: 1.5;
}

/* 大屏幕增强样式 */
@media (min-width: 768px) {
  body {
    font-size: 16px;
  }
}
```

2. **性能优化**:
- 延迟加载非关键资源
- 使用CSS containment优化渲染
- 避免不必要的重绘和回流

:::details 响应式设计示例
```css
/* 基础样式 - 移动优先 */
.container {
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
}

.nav {
  display: none; /* 移动端隐藏导航 */
}

/* 平板设备 */
@media (min-width: 768px) {
  .container {
    max-width: 720px;
    margin: 0 auto;
  }
  
  .nav {
    display: block; /* 显示导航 */
  }
}

/* 桌面设备 */
@media (min-width: 1024px) {
  .container {
    max-width: 960px;
  }
  
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
}
```
:::

## 三、CSS高级特性

### 1、过渡

#### 1.1、过渡属性
1. **transition-property**: 
::: tip 指定应用过渡效果的CSS属性
   - 值: `none` | `all` | `property-name` (如`width`, `opacity`)
   - 多个属性用逗号分隔
:::

2. **transition-duration**:
::: tip 过渡持续时间
   - 单位: `s`(秒)或`ms`(毫秒)
   - 默认值: `0s`(无过渡效果)
:::

3. **transition-timing-function**:
::: tip 过渡速度曲线
   - 常用值:
     - `ease` (默认): 慢→快→慢
     - `linear`: 匀速
     - `ease-in`: 慢→快
     - `ease-out`: 快→慢
     - `ease-in-out`: 慢→快→慢
     - `cubic-bezier(n,n,n,n)`: 自定义贝塞尔曲线
:::

4. **transition-delay**:
::: tip 过渡效果延迟时间
   - 单位同duration
   - 默认值: `0s`
:::
5. **transition**:
::: tip 过渡效果简写属性
- `transition: property duration timing-function delay;`
:::

#### 1.2、效果示例
::: details 过渡效果示例
```css

/* 示例 */
.box {
  transition: all 0.3s ease 0.1s;
  /* 等同于 */
  transition-property: all;
  transition-duration: 0.3s;
  transition-timing-function: ease;
  transition-delay: 0.1s;
}

/* 多属性过渡 */
.multi-transition {
  transition: 
    width 0.5s ease-in,
    height 0.3s linear,
    opacity 0.2s ease-out 0.1s;
}
```
:::

#### 1.3、性能优化
1. 优先使用`opacity`和`transform`属性，它们不会触发重排
2. 避免过渡`height`、`width`等会触发重排的属性
3. 使用`will-change`提示浏览器优化
```css
.optimized {
  will-change: transform, opacity; // 提示浏览器优化
}
```

### 2、动画

#### 2.1、@keyframes规则
```css
@keyframes animation-name {
  from { /* 起始状态 */ }
  to { /* 结束状态 */ }
  /* 或 */
  0% { /* 状态1 */ }
  50% { /* 状态2 */ }
  100% { /* 状态3 */ }
}
```

#### 2.2、动画属性详解
1. **animation-name**: 
::: tip 指定@keyframes动画名称
   - 默认值: `none`
:::

2. **animation-duration**:
:::tip 动画完成一个周期的时间
   - 单位: `s`或`ms`
   - 默认值: `0s`(无动画)
:::

3. **animation-timing-function**:
:::tip 动画速度曲线
   - 取值同transition-timing-function
:::

4. **animation-delay**:
:::tip 动画开始前的延迟
   - 单位同duration
   - 默认值: `0s`
:::
5. **animation-iteration-count**:
:::tip 动画播放次数
   - 值: `number` | `infinite`
   - 默认值: `1`
:::

6. **animation-direction**:
:::tip 动画播放方向
   - 值:
     - `normal` (默认): 正向播放
     - `reverse`: 反向播放
     - `alternate`: 轮流反向
     - `alternate-reverse`: 反向开始轮流
:::

7. **animation-fill-mode**:
:::tip 动画执行前后如何应用样式
   - 值:
     - `none` (默认)
     - `forwards`: 保留最后一帧样式
     - `backwards`: 应用第一帧样式
     - `both`
:::

8. **animation-play-state**:
:::tip 动画播放状态
   - 值: `running` | `paused`
   - 默认值: `running`
:::
8. **animation**:
:::tip 动画简写属性
- `animation: name duration timing-function delay iteration-count direction fill-mode;`
:::

#### 2.3、动画示例
::: details 点击展开查看动画示例
```css
/* 简写语法 */
animation: name duration timing-function delay iteration-count direction fill-mode;

/* 弹跳球动画 */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-50px); }
}

.ball {
  animation: bounce 1s ease-in-out infinite;
}

/* 复杂动画 */
.complex {
  animation: 
    slideIn 0.5s ease-out,
    fadeIn 1s linear 0.5s forwards;
}
```
:::

### 3、视觉效果

#### 3.1、渐变背景
>[!TIP] 渐变背景详解

##### 1、线性渐变
::: tip 线性渐变取值
- direction: 
  - 角度: `to right`, `to bottom right`, `45deg`
- color-stop: 
  - 颜色 位置: `red 10%`, `rgba(0,0,0,0.5) 50px`
:::

::: details 线性渐变示例
```css
background: linear-gradient(direction, color-stop1, color-stop2, ...);
```
:::

##### 2、径向渐变
::: tip 径向渐变取值
- shape: `ellipse`(默认) | `circle`
- size: `closest-side` | `farthest-corner` | 具体尺寸
- position: `center`(默认) | `top right` | 具体坐标
:::

::: details 径向渐变示例
```css
background: radial-gradient(shape size at position, color-stop1, color-stop2, ...);
```
:::

##### 3、渐变示例

::: details 点击展开查看渐变示例
```css
/* 线性渐变 */
.linear-example {
  background: linear-gradient(to right, red, yellow);
  background: linear-gradient(45deg, #ff0000, #ff9900 50%, #ffff00);
}

/* 径向渐变 */
.radial-example {
  background: radial-gradient(circle at center, white, black);
  background: radial-gradient(ellipse farthest-corner at top left, red, blue);
}

/* 重复渐变 */
.repeating-example {
  background: repeating-linear-gradient(45deg, yellow 0px, yellow 20px, black 20px, black 40px);
}
```
:::

#### 3.2、阴影效果

##### 1、box-shadow

::: tip box-shadow 取值
- `h-shadow`（必需）：水平阴影的位置。正值表示阴影在元素右侧，负值表示在左侧。
- `v-shadow`（必需）：垂直阴影的位置。正值表示阴影在元素下方，负值表示在上方。
- `blur`（可选）：阴影的模糊半径。值越大，阴影越模糊。默认值为 0，表示没有模糊效果。
- `spread`（可选）：阴影的扩展半径。正值会使阴影扩大，负值会使阴影缩小。默认值为 0。
- `color`（可选）：阴影的颜色。可以使用颜色名称、RGB、RGBA、HEX 等表示方式。如果省略，会使用浏览器默认颜色，通常是黑色。
- `inset`（可选）：将外部阴影（默认）改为内部阴影。
:::

**基本语法结构**
```css
box-shadow: h-offset v-offset blur spread color inset;
```
<!-- ::: -->

::: details box-shadow 单阴影示例
```css
/* 基础外部阴影：右侧和下方有黑色阴影 */
box-shadow: 5px 5px 10px black;

/* 模糊效果的阴影 */
box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);

/* 扩展半径为负值的阴影 */
box-shadow: 0 0 5px -2px red;

/* 内部阴影 */
box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
```
:::

::: details box-shadow 多阴影示例
```css
/* 双层阴影效果 */
box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.5), 
            -5px -5px 10px rgba(255, 255, 255, 0.5);

/* 混合内外阴影 */
box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5), 
            0 0 20px rgba(255, 0, 0, 0.3);
```
:::

##### 2、text-shadow
**基本语法结构**
```css
text-shadow: h-shadow v-shadow blur-radius color;
```
::: tip text-shadow 取值

- `h-shadow`（必需）：水平阴影的位置。正值表示阴影在文本右侧，负值表示在左侧。
- `v-shadow`（必需）：垂直阴影的位置。正值表示阴影在文本下方，负值表示在上方。
- `blur-radius`（可选）：阴影的模糊半径。值越大，阴影越模糊。默认值为 0，表示没有模糊效果。
- `color`（可选）：阴影的颜色。可以使用颜色名称、RGB、RGBA、HEX 等表示方式。如果省略，会使用浏览器默认颜色，通常是黑色。
:::

::: details text-shadow 单阴影示例

```css
/* 基础阴影：右侧和下方有黑色阴影 */
text-shadow: 2px 2px black;

/* 模糊效果的阴影 */
text-shadow: 0 0 10px rgba(255, 0, 0, 0.7);

/* 上方阴影 */
text-shadow: 0 -3px 5px rgba(0, 0, 0, 0.5);
```
:::
::: details text-shadow 多阴影示例

```css
/* 双层阴影：内阴影 + 外阴影 */
text-shadow: 1px 1px 2px black, 0 0 1em blue;

/* 发光文字效果 */
text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #0073e6, 0 0 20px #0073e6;

/* 立体文字效果 */
text-shadow: 1px 1px 0 #ccc, 2px 2px 0 #c9c9c9, 3px 3px 0 #bbb;
```
:::
::: details text-shadow 实际场景示例

```css
/* 标题强调效果 */
.hero-title {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

/* 霓虹文字效果 */
.neon-text {
  text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #00ff00, 0 0 20px #00ff00;
}

/* 复古文字效果 */
.vintage-text {
  text-shadow: 1px 1px 1px #919191, 1px 2px 1px #919191, 1px 3px 1px #919191;
}
```
:::


### 4、现代CSS特性
#### 4.1、CSS变量
>[!TIP] 概念
> - CSS变量以 `--` 开头，通常定义在 `:root 选择器`中（全局作用域）。
> - 也可以定义在特定元素中（局部作用域）

##### 定义变量 
>[!TIP] 两种变量形式
> - `全局变量`定义在 `:root` 选择器中,可在整个文档中访问。
> - `局部变量`定义在元素中,仅在该元素及其子元素中有效。

::: details 定义变量示例
```css
/* 全局变量 */
:root {
  --primary-color: #4285f4;
  --spacing: 16px;
}

/* 局部变量 */
.element {
  --font-size: 16px;
}
```
:::

##### 使用变量
>[!tip] 使用变量方式
> 使用 `var()` 函数引用CSS变量


::: details 使用变量示例
```css
.element {
  color: var(--primary-color);
  padding: var(--spacing);
  font-size: var(--font-size);
}
``` 
:::


##### 回退值
>[!tip]
> - 如果被使用的CSS变量未定义时，则使用回退值（备用值）。

:::tip
```css
/* 使用回退值 */
.element {
  /* 如果 --custom-color 未定义，则使用 #ccc */
  color: var(--custom-color, #ccc);
  
  /* 多个回退值 */
  background: var(--custom-background, 
               var(--fallback-background, 
               linear-gradient(white, #f0f0f0)));
}

/* 嵌套回退 */
.element {
  font-size: var(--custom-size, var(--default-size, 16px));
}
```
:::

##### 动态修改变量

**1、使用Javascript修改**

```js
// 获取根元素
const root = document.documentElement;

// 设置变量
root.style.setProperty('--primary-color', '#ff0000');

// 获取变量值
const primaryColor = getComputedStyle(root)
  .getPropertyValue('--primary-color');

// 移除变量
root.style.removeProperty('--primary-color');
```
**2、响应式修改**
:::tip
```js
// 根据窗口大小动态修改变量
function updateSpacing() {
  const width = window.innerWidth;
  const root = document.documentElement;
  
  if (width < 768) {
    root.style.setProperty('--spacing-unit', '8px');
  } else if (width < 1024) {
    root.style.setProperty('--spacing-unit', '16px');
  } else {
    root.style.setProperty('--spacing-unit', '24px');
  }
}

window.addEventListener('resize', updateSpacing);
updateSpacing(); // 初始化
```
:::

##### 变量特性

::: tip 变量特性
1. 继承性: 子元素继承父元素变量
2. 备用值: `var(--name, fallback)`
3. 计算: `calc(var(--spacing) * 2)`
4. `JavaScript操作:`

::: details 变量JavaScript操作示例
```js
// 获取
getComputedStyle(element).getPropertyValue('--color');
// 设置
element.style.setProperty('--color', 'red');
```
:::

##### 变量示例

::: details 点击查看 主题切换示例
```css
/* 主题切换 */
:root {
  --bg-color: white;
  --text-color: black;
}

.dark-mode {
  --bg-color: #222;
  --text-color: white;
}

body {
  background: var(--bg-color);
  color: var(--text-color);
}
```
:::

#### 3.3.2 滤镜效果
>[!TIP] 滤镜详解

##### filter属性
```css
filter: none | <filter-function>+;
```

##### 常用滤镜函数
::: tip 滤镜函数
1. **模糊**: `blur(5px)`
2. **亮度**: `brightness(0.5)` (0-1)
3. **对比度**: `contrast(200%)` 
4. **灰度**: `grayscale(100%)`
5. **色相旋转**: `hue-rotate(90deg)`
6. **反转**: `invert(100%)`
7. **透明度**: `opacity(50%)`
8. **饱和度**: `saturate(200%)`
9. **深褐色**: `sepia(100%)`
:::
##### 滤镜示例
```css
/* 图片滤镜 */
.image-filter {
  filter: grayscale(50%) blur(1px);
  transition: filter 0.3s;
}

.image-filter:hover {
  filter: none;
}

/* 背景滤镜 */
.backdrop-filter {
  backdrop-filter: blur(10px);
}
```

##### 滤镜性能优化
::: danger 性能优化
1. 避免对大面积元素使用模糊滤镜
2. 使用`will-change`提示浏览器优化
3. 考虑使用SVG滤镜替代复杂效果
:::

:::details 现代CSS特性示例
```css
/* 动画与过渡结合 */
.animated-card {
  --primary: #ff4757;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.animated-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
  filter: brightness(1.1);
}

/* 关键帧动画 */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.pulse-effect {
  animation: pulse 2s infinite;
}

/* 渐变背景 */
.gradient-bg {
  background: linear-gradient(135deg, var(--primary), #5352ed);
}

/* CSS变量控制主题 */
.theme-switcher {
  background: var(--bg-color);
  color: var(--text-color);
  transition: background 0.3s, color 0.3s;
}
```
:::




## 四、CSS最佳实践

### 4.1 性能优化
>[!TIP] 性能优化详解

#### 4.1.1 选择器优化
1. **避免过度嵌套**:
```css
/* 不推荐 */
.nav ul li a { color: red; }

/* 推荐 */
.nav-link { color: red; }
```

2. **避免通用选择器**:
```css
/* 不推荐 */
* { margin: 0; }

/* 推荐 */
body, h1, p { margin: 0; }
```

3. **使用类选择器替代后代选择器**:
```css
/* 不推荐 */
.header .logo { width: 100px; }

/* 推荐 */
.header-logo { width: 100px; }
```

#### 4.1.2 渲染性能优化
1. **减少重排和重绘**:
```css
/* 不推荐 - 触发重排 */
.element {
  width: 100px;
  height: 100px;
  margin: 10px;
}

/* 推荐 - 使用transform和opacity */
.element {
  transform: translateX(10px);
  opacity: 0.9;
}
```

2. **使用will-change提示浏览器**:
```css
.animated-element {
  will-change: transform, opacity;
}
```

3. **避免使用@import**:
```css
/* 不推荐 */
@import url("styles.css");

/* 推荐 */
<link rel="stylesheet" href="styles.css">
```

#### 4.1.3 文件优化
1. **压缩CSS**:
```bash
# 使用工具如cssnano
npm install cssnano -g
cssnano input.css output.min.css
```

2. **关键CSS内联**:
```html
<style>
  /* 关键CSS放在head中 */
  .header, .hero { display: block; }
</style>
```

3. **代码分割**:
```html
<!-- 首屏关键CSS -->
<link rel="stylesheet" href="critical.css">

<!-- 延迟加载非关键CSS -->
<link rel="preload" href="non-critical.css" as="style" onload="this.rel='stylesheet'">
```

### 4.2 可维护性
>[!TIP] 可维护性详解

#### 4.2.1 BEM命名规范
```css
/* Block */
.menu { ... }

/* Element */
.menu__item { ... }

/* Modifier */
.menu__item--active { ... }
```

#### 4.2.2 模块化结构
1. **按功能组织CSS**:
```
styles/
├── base/        # 基础样式
├── components/  # 组件样式
├── layouts/     # 布局样式
├── utils/       # 工具类
└── themes/      # 主题样式
```

2. **使用CSS预处理器**:
```scss
// _variables.scss
$primary-color: #4285f4;

// _buttons.scss
.button {
  background: $primary-color;
}
```

#### 4.2.3 注释规范
::: details 注释规范示例
```css
/* ============组件: 按钮============= */

/**
 * 基础按钮样式
 *
 * 示例:
 * <button class="btn">按钮</button>
 */

.btn {
  /* 基础样式 */
  padding: 8px 16px;
  
  /* 状态 */
  &:hover {
    opacity: 0.9;
  }
}
```
:::

### 4.3 浏览器兼容性
>[!TIP] 兼容性处理详解

#### 4.3.1 自动添加前缀
1. **使用Autoprefixer**:
```json
// package.json
{
  "browserslist": [
    "last 2 versions",
    "> 1%",
    "IE 10"
  ]
}
```

2. **PostCSS配置**:
```js
// postcss.config.js
module.exports = {
  plugins: [
    require('autoprefixer')
  ]
}
```

#### 4.3.2 渐进增强
```css
/* 基础样式 */
.box {
  width: 100%;
}

/* 增强样式 */
@supports (display: grid) {
  .box {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
```

#### 4.3.3 兼容性处理技巧
1. **CSS Hack**:
```css
/* IE10+ */
@media screen and (-ms-high-contrast: active), (-ms-high-contrast: none) {
  .ie-only { color: red; }
}
```

2. **特性检测**:
```javascript
// 检测Flexbox支持
if ('flex' in document.documentElement.style) {
  document.documentElement.classList.add('flexbox');
} else {
  document.documentElement.classList.add('no-flexbox');
}
```

:::details 最佳实践示例
```css
/* 性能优化示例 */
.optimized-box {
  /* 避免重排 */
  transform: translateZ(0);
  will-change: transform;
  
  /* 高效选择器 */
  &__item {
    color: var(--text-color);
  }
}

/* 可维护性示例 */
// _variables.scss
$spacing-unit: 8px;

// _card.scss
.card {
  padding: $spacing-unit * 2;
  
  &__header {
    margin-bottom: $spacing-unit;
  }
}

/* 兼容性示例 */
.fallback-box {
  display: flex;
  display: -webkit-flex; /* Safari */
}

@supports (display: grid) {
  .grid-fallback {
    display: grid;
  }
}
```
:::

## 五、CSS与SEO
>[!TIP]
> - 避免使用CSS隐藏重要内容
> - 优化关键渲染路径
> - 使用语义化HTML配合CSS
