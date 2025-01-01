## 一、HTML部分


### 1、html5有哪些新特性
>[!tip]新特性
> 1. 绘画 `canvas`;
> 2. 用于媒介回放的 `video` 和 `audio` 元素;
> 3. 本地离线存储 localStorage 长期存储数据，浏览器关闭后数据不丢失;
> 4. sessionStorage 的数据在浏览器关闭（回话结束）后自动删除;
> 5. 语义化更好的内容元素，比如 article、footer、header、nav、section;
> 6. 表单控件增强：color、date、time、email、url、search;
> 7. 新技术`webworker`, `websocket`, `Geolocation(定位)`;



### 2、HTML 的 src 和 href 属性有什么区别

> src 和 href 属性虽然都是用于指定资源的地址，但在具体应用标签和资源加载方式上有着明显的区别。



#### 2-1.应用标签不同

> 1. src 属性的作用是 **指定要加载的资源路径**，常出现于 `<script>`、`<img>`、`<audio>`、`<video>` 和 `<iframe>` 等标签中，用于加载 JavaScript 脚本、图像、音频、视频或嵌入的网页文件。
>
> 2. href 属性的作用是 **指定超链接的目标地址**或定义文档与外部资源的关联，主要用在 `<a>`、`<link>`、`<area>` 等标签中

#### 2-2.资源加载方式不同

> 1. 当浏览器解析到适用于 src 属性的标签（比如 `<script>` 和 `<img>`）时，会暂停其他资源的下载和处理，直到将该资源加载、编译（如果是 JavaScript）、执⾏（如果是脚本）完成。这种方式称为阻塞加载,所以⼀般建议将 JavaScript 脚本放在页面底部
> 2. 当浏览器识别到适用于 href 属性的标签（比如 `<a>` 和 `<link>`）时，会并⾏下载资源，不会停⽌对当前⽂档的处理。这种方式称为非阻塞加载，浏览器可以同时处理超链接或引入样式表。





### 3、Canvas 和 SVG 有什么区别

> `Canvas` 和 `SVG` **都是用于在网页上绘制图形的技术**，但它们在实现方式、性能和使用场景上有明显的区别。
>
> - `Canvas` **是基于像素的即时绘制技术**，适合频繁更新和复杂动画， 
> - `SVG` **是基于矢量的图形格式**，适合需要无损缩放和高分辨率的静态图形。



#### 3-1.具体区别：

##### 3-1-1、渲染方式

> - Canvas：逐像素渲染，适合实时动态绘制。
> - SVG：基于矢量描述，适合静态和简单的动态绘制。

##### 3-1-2、性能

> - Canvas：高性能，适合频繁更新的图形和复杂动画。
> - SVG：在处理复杂图形时，性能可能会下降。

##### 3-1-3、交互和 DOM 集成

> - Canvas：不具备内置的 DOM 交互，需要额外的事件处理代码。
> - SVG：每个图形元素都是 DOM 节点，天然支持交互和事件处理。

#### 3-2.Canvas 的主要特点及优缺点

##### 3-2-1.特点

> 1）基于像素：Canvas 绘图是逐像素操作，类似于在位图画布上绘制。 
>
> 2）即刻渲染：一旦图形绘制完成，就无法直接访问或修改其内容，除非重新绘制。 
>
> 3）不具备DOM特性：绘制在 Canvas 上的图形不是 DOM 元素，不能通过 DOM 直接访问和修改。 
>
> 4）动态绘图：非常适合需要频繁更新和复杂图形操作的应用，如游戏、动态数据可视化等。

##### 3-2-2.优点

> 1）高性能：对于频繁变化和复杂的动画，Canvas 提供了较高的性能。 
>
> 2）细粒度控制：通过 JavaScript API，可以对每个像素进行精确控制，适用于精细的图形绘制。 
>
> 3）适合实时渲染：能高效处理大批量图形的实时渲染。

##### 3-2-3.缺点

> 1）无法缩放：因为是基于像素的图形，缩放时可能失真。 
>
> 2）无内置交互：需要额外编写代码来处理用户交互。 
>
> 3）复杂性：处理复杂图形时，代码量和复杂度较高。





## 二、CSS部分

### 1、CSS标准盒模型与怪异盒模型的理解

> 盒模型范围包括：margin、border、padding、content

> 在网页中，一个元素占有空间的大小由几个部分构成，其中包括元素的内容（content），元素的内边距（padding），
> 元素的边框（border），元素的外边距（margin）四个部分。这四个部分占有的空间中，有的部分可以显示相应的内容，
> 而有的部分只用来分隔相邻的区域或区域。4个部分一起构成了css中元素的盒模型。	

#### 1-1.标准盒模型



> **width**指`content`的宽度

#### 1-2.怪异盒模型



> **width**指`content + border +padding`的宽度



### 2、em/px/rem/vh/vw的区别

#### 2-1.详解

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

> 1. display:none
> 2. visibility:hidden
> 3. opacity:0
> 4. 设置height、width模型属性为0
> 5. position:absolute
> 6. clip-path

#### 3-1.display:none



> 元素不可见，不占据空间，无法响应点击事件
>
> ```css
> .hide {
>  display:none;
> }
> ```



#### 3-2.visibility:hidden

> 元素不可见，占据页面空间，无法响应点击事件
>
> ```css
> .hidden{
>  visibility:hidden
> }
> ```



#### 3-3.opacity:0

> 改变元素透明度，元素不可见，占据页面空间，可以响应点击事件
>
> ```css
> .transparent {
>  opacity:0;
> }
> ```



#### 3-4.设置height、width属性为0

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

> 元素不可见，不影响页面布局
>
> ```css
> .hide {
> position: absolute;
> top: -9999px;
> left: -9999px;
> }
> ```
>
> 



#### 3-6.clip-path裁剪

> 元素不可见，占据页面空间，无法响应点击事件
>
> ```css
> .hide {
> clip-path: polygon(0px 0px,0px 0px,0px 0px,0px 0px);
> }
> ```



#### 区别

|                        | display: none | visibility: hidden | **opacity: 0** |
| :--------------------- | :------------ | ------------------ | -------------- |
| 页面中                 | 不存在        | 存在               | 存在           |
| 重排                   | 会            | 不会               | 不会           |
| 重绘                   | 会            | 会                 | 不一定         |
| 自身绑定事件           | 不触发        | 不触发             | 可触发         |
| transition             | 不支持        | 支持               | 支持           |
| 子元素可复原           | 不能          | 能                 | 不能           |
| 被遮挡的元素可触发事件 | 能            | 能                 | 不能           |



### 4、BFC的理解

#### 4-1.概念

> 块级格式化上下文，它是页面中的一块渲染区域,并且有一套属于自己的渲染规则：

> - 内部的盒子会在垂直方向上一个接一个的放置
> - 对于同一个BFC的俩个相邻的盒子的margin会发生重叠，与方向无关。
> - 每个元素的左外边距与包含块的左边界相接触（从左到右），即使浮动元素也是如此
> - BFC的区域不会与float的元素区域重叠
> - 计算BFC的高度时，浮动子元素也参与计算
> - BFC就是页面上的一个隔离的独立容器，容器里面的子元素不会影响到外面的元素，反之亦然
>
> `BFC`目的是形成一个相对于外界完全独立的空间，让内部的子元素不会影响到外部的元素



#### 4-2.触发条件

> 1. 根元素，即HTML元素
> 2. 浮动元素：float值为left、right
> 3. overflow值不为 visible，为 auto、scroll、hidden  **(非visible)**
> 4. display的值为inline-block、inltable-cell、table-caption、table、inline-table、flex、inline-flex、grid、inline-grid   **(非none 非inline 非block)**
> 5. position的值为absolute或fixed   **（非relative）**



#### 4-3.应用场景

> 1、margin重合
>
> 2、margin塌陷
>
> 3、高度塌陷



### 5、元素水平垂直居中的方法？

##### 5-1.利用定位+margin:auto

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

