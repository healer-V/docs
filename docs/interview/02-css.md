# CSS面试题
## 1、CSS3新特性
>[!important]
> 1. **盒模型**：包括`box-sizing`属性等，控制元素尺寸和边框。
> 2. **背景与边框**：多重背景图片边框图片等。
> 3. **文本效果**：包括文本阴影`text-shadow`和换行等。
> 4. **变形(transform) 和过渡**：使元素动态改变样式。
> 5. **动画（animation）**：使用`@keyframes`规则定义动画效果。
> 6. **多列布局**：使文本内容多列显示。
> 7. **媒体查询**：`@media`规则，使网页设计可以相应不同的设备。
> 8. **Flexbox和Grid布局**：提供更灵活的布局方式。
> 9. **伪类和伪元素**：更精确的选择和操作元素。

## 2、CSS盒模型

>[!tip] 标准盒模型
> **width**:`content`的宽度

>[!tip] 怪异盒模型
> **width**:`content + border +padding`的宽度




## 3、隐藏页面元素的方式
>[!tip] 方式
> 1. `display:none`
> 2. `visibility:hidden`
> 3. `opacity:0`
> 4. `width:0;height:0`
> 5. `position:absolute`
> 6. `clip-path`

### 3.1、区别

|                        | `display: none` | `visibility: hidden` | `opacity: 0` |
| :--------------------- | :------------ | ------------------ | -------------- |
| 是否在页面中                 | 不存在        | 存在               | 存在           |
| 是否发生重排                   | 会           | 不会               | 不会           |
| 是否发生重绘                   | 会           | 会                | 不一定          |
| 自身绑定事件            | 不触发        | 不触发             | 可触发          |
| transition            | 不支持        | 支持               | 支持           |
| 子元素可复原            | 不能          | 能                | 不能           |
| 被遮挡的元素可触发事件    | 能           | 能                 | 不能          |



## 4、BFC的理解
>[!tip] Block Formatting Context(块级格式化上下文)
> 1. `BFC`是页面中的一块**渲染区域**,并且有一套属于自己的渲染规则，它决定了子元素如何布局，以及和其他元素的关系和相互作用。
> 2. `BFC`目的是形成一个相对于外界完全独立的空间，让内部的子元素不会影响到外部的元素。
> 3. `BFC`内部的盒子会在垂直方向上一个接一个的放置。
> 4. 计算BFC的高度时，浮动子元素也参与计算。
> 5. 每个元素的左外边距与包含块的左边界相接触（从左到右），即使浮动元素也是如此。
> 6. BFC的区域不会与float的元素区域重叠。
> 7. 计算BFC的高度时，浮动子元素也参与计算。


>[!important] BFC解决什么问题
>1. 开启BFC其子元素不会不再有margin塌陷问题。
>2. 开启BFC就算子元素浮动，自身高度也不会塌陷。
>2. 开启BFC,自身不会被其他浮动元素覆盖。


>[!caution] 触发条件
> 1. **根元素**，即HTML元素
> 2. **浮动元素**：`float`值为left、right
> 3. **overflow** : 值不为 visible，为 auto、scroll、hidden  **(非visible)**
> 4. **行内块元素**：display值为inline-block、inline-table、inline-flex、inline-grid
> 5. **position** : 值为absolute或fixed `（非relative）`
> 6. **多列容器**（设置column-count或column-width属性）
> 7. 表格元素
> 8. 设置`display:flow-root`的元素
### 4-1、应用场景
>[!note]
> 1. `margin`重合
> 2. `margin`塌陷
> 3. 高度塌陷

## 5、元素水平垂直居中的方法？

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


## 6、`transition`与`animation`的区别
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