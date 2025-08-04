# CSS面试题
## 1、CSS3新特性
>[!note]
> 1. **盒模型与布局**：
>     - 布局：新增`flexbox`、`grid`布局、多列布局。
>     - 怪异盒模型：盒模型控制：`box-sizing：border-box`。
> 2. **视觉效果**：
>     - 圆角与阴影：
>     - 渐变背景：线性渐变、径向渐变、多重背景。
>     - 透明度与混合模式：`opacity`元素透明度、`background-blend-mode`背景混合模式。
>     - 变换（`Transform`）: 2D或3D转换，旋转、缩放、倾斜、位移。
>     - 过渡（`Transition`）：`transition`属性定义过渡效果。
>     - 动画（`Animation`）：`@keyframes`规则定义动画效果，`animation`属性控制动画。
> 3. **字体与排版**：
>     - 自定义字体：`@font-face`规则定义字体。
>     - 文本效果：文本溢出、长单词换行、添加连字符。
>     - 文本装饰：`text-shadow`文本阴影。
> 4**响应式设计**：
>     - 媒体查询：`@media`规则，使网页设计可以相应不同的设备。
>     - 视口单位：vw、vh（视口宽度和高度的百分比）、vmin、vmax（视口最小或最大尺寸的百分比）。
> 5. **其他特性**：
>     - 变量：`var()`函数，可以定义变量，可以方便的修改样式。
>     - 滤镜：`filter`属性，可以对元素进行滤镜处理。
>     - 裁剪：`clip-path`属性，可以裁剪元素。
>     - 遮罩：`mask-image`属性，使用图片作为遮罩。


## 2、CSS盒模型

>[!tip] 
> 1. 标准盒的`width`: `content`的宽度
> 2. 怪异盒的`width`: `content + border +padding`的宽度
    
## 3、link 和 @import 的区别
>[!tip] 区别
> 1. **语法不同**：`link`是HTML标签，`@import`是CSS指令。
> 2. **加载顺序不同**：`link`在页面加载时同时加载，`@import`需等待页面完成加载后再加载。
> 3. **性能不同**：`link`可以并行下载，`@import`需等待前一个样式表下载完成。
> 4. **兼容性不同**：`link`无兼容问题，`@import`在不同浏览器下兼容性不同。
> 5. **权重不同**：`link`可以设置`rel`和`type`属性，`@import`只能设置`url`属性。
> 6. **作用域不同**：`link`对所有样式有效，`@import`只对当前样式有效。


## 4、BFC 的理解
>[!tip] 块级格式化上下文
> 1. `BFC`是页面中的一块 **渲染区域**，并且有一套属于自己的渲染规则，它决定了子元素如何布局，以及和其他元素的关系和相互作用。
> 2. `BFC`目的是形成一个相对于外界完全独立的空间，让内部的子元素不会影响到外部的元素。
> 3. `BFC`内部的盒子会在垂直方向上一个接一个的放置。
> 4. 计算BFC的高度时，浮动子元素也参与计算。
> 5. 每个元素的左外边距与包含块的左边界相接触（从左到右），即使浮动元素也是如此。
> 6. BFC的区域不会与float的元素区域重叠。
> 7. 计算BFC的高度时，浮动子元素也参与计算。

### 4-1、BFC 解决什么问题
>[!tip] BFC解决什么问题
>1. 开启BFC,其子元素不会不再有margin塌陷问题。
>2. 开启BFC,就算子元素浮动，自身高度也不会塌陷。
>3. 开启BFC,自身不会被其他浮动元素覆盖。

### 4-2、BFC 触发条件
>[!caution] 触发条件
> 1. **根元素**，即HTML元素
> 2. **浮动元素**：`float`值为left、right
> 3. **overflow** : 值不为 visible，为 auto、scroll、hidden  **(非visible)**
> 4. **行内块元素**：display值为inline-block、inline-table、inline-flex、inline-grid
> 5. **position** : 值为absolute或fixed `（非relative）`
> 6. **多列容器**（设置column-count或column-width属性）
> 7. 表格元素
> 8. 设置`display:flow-root`的元素

### 4-3、BFC 应用场景
>[!note]
> 1. `margin`重合
> 2. `margin`塌陷
> 3. 高度塌陷

## 5、transition 与 animation 的区别
>[!tip] transition
>1. 只能从一种状态**过渡**到另一种状态。
>2. 一次性设置，不会保留中间状态。
>3. 需要一个**触发条件**来启动，比如鼠标悬停等。
>4. 简单且适合属性变化较少的动画。

>[!tip] animation
>1. 可以设置多个状态，可以保留**中间状态**。
>2. 不需要触发条件即可启动。
>3. 更加灵活适用于**复杂动画**

::: details transition 示例
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
:::

::: details animation 示例
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
```
:::

## 6、伪类和伪元素的区别
>[!tip] 区别
> 1. 伪元素：用于创建不在DOM中的抽象元素，
>    - 每个选择器只能使用一个伪元素（必须出现在最后）。
> 2. 伪类：用来描述元素的状态。

## 5、元素水平垂直居中

### 5-1、定位+`margin:auto`
::: details 点击查看代码
```html
<style>
    .father{
        width:500px;
        height:300px;
        border:1px solid #0a3b98;
        position: relative;
    }
    .son{
        width:100px;
        height:40px;
        background: #f0a238;
        position: absolute;
        top:0;
        left:0;
        right:0;
        bottom:0;
        margin:auto;
    }
</style>
<div class="father">
    <div class="son"></div>
</div>
```
:::


### 5-2、利用定位+margin:负值
::: details 点击查看代码
```html
<style>
    .father {
        position: relative;
        width: 200px;
        height: 200px;
        background: skyblue;
    }
    .son {
        position: absolute;
        top: 50%;
        left: 50%;
        margin-left:-50px;
        margin-top:-50px;
        width: 100px;
        height: 100px;
        background: red;
    }
</style>
<div class="father">
    <div class="son"></div>
</div>
```
:::


### 5-3、定位+transform
::: details 点击查看代码
```css
<style>
    .father {
        position: relative;
        width: 200px;
        height: 200px;
        background: skyblue;
    }
    .son {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%,-50%);
        width: 100px;
        height: 100px;
        background: red;
    }
</style>
<div class="father">
    <div class="son"></div>
</div>
```
:::


### 5-4、table布局
::: details 点击查看代码
```html
<style>
    .father {
        display: table-cell;
        width: 200px;
        height: 200px;
        background: skyblue;
        vertical-align: middle;
        text-align: center;
    }
    .son {
        display: inline-block;
        width: 100px;
        height: 100px;
        background: red;
    }
</style>
<div class="father">
    <div class="son"></div>
</div>
```
:::


### 5-5、flex弹性布局
::: details 点击查看代码
```html
<style>
    .father {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 200px;
        height: 200px;
        background: skyblue;
    }
    .son {
        width: 100px;
        height: 100px;
        background: red;
    }
</style>
<div class="father">
    <div class="son"></div>
</div>
```
:::


### 5-6、grid网格布局
::: details 点击查看代码
```html
<style>
    .father {
            display: grid;
            align-items:center;
            justify-content: center;
            width: 200px;
            height: 200px;
            background: skyblue;

        }
        .son {
            width: 10px;
            height: 10px;
            border: 1px solid red
        }
</style>
<div class="father">
    <div class="son"></div>
</div>
```
:::


