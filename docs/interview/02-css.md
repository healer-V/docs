### 1、CSS3新增了哪些新特性？
>[!tip]
> 1. 新增选择器：
>   - 属性选择器,伪类选择器,伪元素选择器,多列布局,媒体查询,混合模式
> 2. 新增样式：
>   - 三个边框属性：border-radius、box-shadow、border-image（使用图片来绘制边框）
>   - 设置元素阴影：水平阴影、垂直阴影、模糊距离(虚实）、阴影尺寸、阴影颜色、内外阴影
>   - 背景的属性，分别是background-clip、background-origin、background-size、background-break
>   - 文字：word-wrap、text-overflow、text-shadow、text-decoration
>   - 颜色：`rgba`、`hsla`
>   - transition 过渡
>   - transform 转换
>   - animation 动画
>   - 渐变
>   - 布局：flex、Grid、多列布局、媒体查询、混合模式
> 3. 新增属性：
>   - `rgba`、`hsla`、`gradient`
>   - `word-wrap`、`text-overflow`、`text-shadow`、`text-decoration`
>   - `transition`、`transform`、`animation`
>   - `flex`、`grid`、`media query`、`mix-blend-mode`

### 2、CSS标准盒模型与怪异盒模型的理解
>[!tip]
> - 盒模型范围包括：`margin、border、padding、content`

> - 在网页中，一个元素占有空间的大小由几个部分构成，其中包括元素的内容（content），元素的内边距（padding），
> 元素的边框（border），元素的外边距（margin）四个部分。这四个部分占有的空间中，有的部分可以显示相应的内容，
> 而有的部分只用来分隔相邻的区域或区域。4个部分一起构成了css中元素的盒模型。	

#### 2.1、标准盒模型

> **width**指`content`的宽度

#### 2.2、怪异盒模型

> **width**指`content + border +padding`的宽度



### 3、em/px/rem/vh/vw的区别

#### 3-1.详解

在`css`单位中，可以分为长度单位、绝对单位

| CSS单位      |                                        |
| ------------ | -------------------------------------- |
| 相对长度单位 | em、ex、ch、rem、vw、vh、vmin、vmax、% |
| 绝对长度单位 | cm、mm、in、px、pt、pc                 |

```js
px:表示像素,每个像素点都是大小等同的
em:相对于浏览器的默认字体尺寸（1em = 16px）
rem:相对的只是HTML根元素font-size的值
vw ，就是根据窗口的宽度，分成100等份，100vw就表示满宽，50vw就表示一半宽。（vw 始终是针对窗口的宽），同理，vh则为窗口的高度
```



### 3、隐藏页面元素的方式有哪些？
>[!tip]
> 1. display:none
> 2. visibility:hidden
> 3. opacity:0
> 4. 设置height、width模型属性为0
> 5. position:absolute
> 6. clip-path

#### 3-1.display:none
>[!tip]
> 元素不可见，不占据空间，无法响应点击事件
>
> ```css
> .hide {
>  display:none;
> }
> ```



#### 3-2.visibility:hidden
>[!tip]
> 元素不可见，占据页面空间，无法响应点击事件
>
> ```css
> .hidden{
>  visibility:hidden
> }
> ```



#### 3-3.opacity:0
>[!tip]
> 改变元素透明度，元素不可见，占据页面空间，可以响应点击事件
>
> ```css
> .transparent {
>  opacity:0;
> }
> ```



#### 3-4.设置height、width属性为0
>[!tip]
> 元素不可见，不占据页面空间，无法响应点击事件
>
> ```css
> .hiddenBox {
>  margin:0;     
>  border:0;
>  padding:0;
>  height:0;
>  width:0;
>  overflow:hidden;
> }
> ```



#### 3-5.position:absolute将元素移出可视区域
>[!tip]
> 元素不可见，不影响页面布局
>
> ```css
> .hide {
> position: absolute;
> top: -9999px;
> left: -9999px;
> }
> ```



#### 3-6.clip-path裁剪
>[!tip]
> 元素不可见，占据页面空间，无法响应点击事件
>
> ```css
> .hide {
> clip-path: polygon(0px 0px,0px 0px,0px 0px,0px 0px);
> }
> ```



#### 区别

|                        | `display: none` | `visibility: hidden` | `opacity: 0` |
| :--------------------- | :------------ | ------------------ | -------------- |
| 页面中                 | 不存在        | 存在               | 存在           |
| 重排                   | 会           | 不会               | 不会           |
| 重绘                   | 会           | 会                | 不一定          |
| 自身绑定事件            | 不触发        | 不触发             | 可触发          |
| transition            | 不支持        | 支持               | 支持           |
| 子元素可复原            | 不能          | 能                | 不能           |
| 被遮挡的元素可触发事件    | 能           | 能                 | 不能          |



### 4、BFC的理解
> Block Formatting Context(块级格式化上下文)
#### 4-1.概念
>[!tip]
> BFC是页面中的一块渲染区域,并且有一套属于自己的渲染规则，它决定了子元素如何布局，以及和其他元素的关系和相互作用。
> `BFC`目的是形成一个相对于外界完全独立的空间，让内部的子元素不会影响到外部的元素。
> - 内部的盒子会在垂直方向上一个接一个的放置。
> - 计算BFC的高度时，浮动子元素也参与计算
> - 每个元素的左外边距与包含块的左边界相接触（从左到右），即使浮动元素也是如此
> - BFC的区域不会与float的元素区域重叠
> - 计算BFC的高度时，浮动子元素也参与计算


#### 4-2.BFC解决什么问题
>1. 开启BFC其子元素不会不再有margin塌陷问题。
>2. 开启BFC就算子元素浮动，自身高度也不会塌陷。
>2. 开启BFC,自身不会被其他浮动元素覆盖。


#### 4-2.触发条件
>[!tip]
> 1. `根元素`，即HTML元素
> 2. `浮动元素`：float值为left、right
> 3. `overflow值`不为 visible，为 auto、scroll、hidden  **(非visible)**
> 4. 行内块元素：display值为inline-block、inline-table、inline-flex、inline-grid
> 5. `position的值`为absolute或fixed   `（非relative）`
> 6. 多列容器（设置column-count或column-width属性）
> 7. 表格元素
> 8. 设置display:flow-root的元素
#### 4-3.应用场景

> 1、margin重合
> 2、margin塌陷
> 3、高度塌陷

### 5、元素水平垂直居中的方法？

##### 5-1.利用`定位`+`margin:auto`

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



##### 5-2.利用定位+margin:负值

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



##### 5-3.利用定位+transform

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



##### 5-4.table布局

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



##### 5-5.flex弹性布局

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



##### 5-6.grid网格布局

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

