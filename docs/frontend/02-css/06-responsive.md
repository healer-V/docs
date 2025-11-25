# CSS响应式设计

## 一、响应式设计概述

::: tip 响应式设计定义
- 响应式网页设计（Responsive Web Design，简称RWD）是一种设计和开发方法，使网站能够根据用户的设备（如桌面电脑、平板电脑、手机等）自动调整其布局、内容和功能，提供最佳的用户体验。
- 响应式设计的核心原则是：**一次设计，处处适用**。
:::

### 1.1 响应式设计的主要特点
- **流动性布局**：使用相对单位（如百分比、em、rem）代替固定单位（如像素），使布局能够适应不同的屏幕尺寸
- **灵活的图像和媒体**：确保图像、视频等媒体元素能够根据屏幕尺寸自动调整大小
- **媒体查询**：使用CSS媒体查询（Media Queries）根据设备的特性（如屏幕宽度、高度、方向等）应用不同的样式
- **移动优先设计**：从移动设备的设计开始，然后逐步扩展到更大的屏幕尺寸
- **断点设计**：在特定的屏幕尺寸（断点）处调整布局和样式

### 1.2 响应式设计的优势
1. **更好的用户体验**：为用户提供适合其设备的浏览体验，无需缩放或滚动即可查看内容
2. **提高转化率**：良好的用户体验可以提高用户的参与度和转化率
3. **降低维护成本**：只需维护一个网站，而不是为不同的设备创建多个版本
4. **提高SEO排名**：Google等搜索引擎优先考虑响应式网站
5. **未来适应性**：响应式设计可以适应未来可能出现的新设备和屏幕尺寸

### 1.3 响应式设计的挑战
1. **设计复杂性**：需要考虑各种设备和屏幕尺寸的设计方案
2. **性能优化**：确保在各种设备上都能提供良好的性能
3. **兼容性问题**：不同浏览器对CSS特性的支持程度不同，需要考虑兼容性问题
4. **测试难度**：需要在各种设备和浏览器上进行测试，确保一致的用户体验

### 1.4 基本响应式示例
::: details
::: code-group

```HTML [html]
<div class="responsive-basic-example">
  <h2>基本的响应式设计示例</h2>
  <div class="container">
    <header class="header">
      <h1>响应式网站标题</h1>
      <nav class="nav">
        <ul>
          <li><a href="#">首页</a></li>
          <li><a href="#">关于我们</a></li>
          <li><a href="#">产品</a></li>
          <li><a href="#">联系我们</a></li>
        </ul>
      </nav>
    </header>
    
    <main class="main">
      <article class="article">
        <h2>文章标题</h2>
        <p>这是一篇示例文章，展示了响应式设计的基本概念。响应式设计可以使网站在不同的设备上都能提供良好的用户体验。</p>
        <img src="https://picsum.photos/800/400" alt="示例图片" class="responsive-image">
        <p>响应式设计的核心是使用流动性布局、灵活的图像和媒体查询等技术，使网站能够根据用户的设备自动调整其布局和样式。</p>
      </article>
      
      <aside class="sidebar">
        <h3>侧边栏</h3>
        <ul>
          <li><a href="#">链接1</a></li>
          <li><a href="#">链接2</a></li>
          <li><a href="#">链接3</a></li>
        </ul>
      </aside>
    </main>
    
    <footer class="footer">
      <p>&copy; 2023 响应式网站示例</p>
    </footer>
  </div>
</div>
```

```CSS [css]
/* 基本样式 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f4f4f4;
}

.responsive-basic-example {
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 头部样式 */
.header {
  background-color: #007bff;
  color: #fff;
  padding: 20px;
  text-align: center;
}

.header h1 {
  margin-bottom: 10px;
  font-size: 2rem;
}

/* 导航样式 */
.nav ul {
  list-style: none;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.nav li {
  margin: 0 10px;
}

.nav a {
  color: #fff;
  text-decoration: none;
  padding: 5px 10px;
  border-radius: 3px;
  transition: background-color 0.3s ease;
}

.nav a:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* 主要内容样式 */
.main {
  display: flex;
  padding: 20px;
}

.article {
  flex: 1;
  padding-right: 20px;
}

.article h2 {
  margin-bottom: 15px;
  color: #007bff;
}

.article p {
  margin-bottom: 15px;
}

/* 响应式图像 */
.responsive-image {
  max-width: 100%;
  height: auto;
  border-radius: 5px;
  margin-bottom: 15px;
}

/* 侧边栏样式 */
.sidebar {
  width: 250px;
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
}

.sidebar h3 {
  margin-bottom: 10px;
  color: #007bff;
}

.sidebar ul {
  list-style: none;
}

.sidebar li {
  margin-bottom: 8px;
}

.sidebar a {
  color: #333;
  text-decoration: none;
  transition: color 0.3s ease;
}

.sidebar a:hover {
  color: #007bff;
}

/* 页脚样式 */
.footer {
  background-color: #343a40;
  color: #fff;
  text-align: center;
  padding: 20px;
}

/* 媒体查询 - 平板设备 */
@media (max-width: 768px) {
  .header h1 {
    font-size: 1.5rem;
  }
  
  .nav li {
    margin: 0 5px;
  }
  
  .nav a {
    padding: 3px 8px;
    font-size: 0.9rem;
  }
  
  .main {
    flex-direction: column;
  }
  
  .article {
    padding-right: 0;
    margin-bottom: 20px;
  }
  
  .sidebar {
    width: 100%;
  }
}

/* 媒体查询 - 移动设备 */
@media (max-width: 480px) {
  .header {
    padding: 15px;
  }
  
  .header h1 {
    font-size: 1.2rem;
    margin-bottom: 15px;
  }
  
  .nav ul {
    flex-direction: column;
    align-items: center;
  }
  
  .nav li {
    margin: 5px 0;
  }
  
  .main {
    padding: 15px;
  }
  
  .article h2 {
    font-size: 1.3rem;
  }
  
  .footer {
    padding: 15px;
    font-size: 0.9rem;
  }
}
```

:::


## 二、响应式设计的核心技术

### 2.1 流动性布局

::: tip 流动性布局
- 流动性布局（Fluid Layout）是响应式设计的基础，它使用相对单位（如百分比、em、rem）代替固定单位（如像素），使布局能够适应不同的屏幕尺寸。
- 流动性布局的核心是使容器、列和元素能够根据其父容器或视口的大小自动调整其尺寸。
:::

#### 2.1.1 主要特点
::: tip 主要特点
- 使用相对单位（如百分比）定义宽度、高度、边距等
- 避免使用固定宽度，使布局能够适应不同的屏幕尺寸
- 使用浮动（float）或弹性布局（flexbox）创建多列布局
- 确保内容在各种屏幕尺寸上都能正常显示和阅读
:::

#### 2.1.2 常用的相对单位
::: tip 常用的相对单位
- **百分比（%）**：相对于父元素的百分比
- **em**：相对于父元素的字体大小（font-size）
- **rem**：相对于根元素（html）的字体大小
- **vw/vh**：相对于视口宽度/高度的百分比（1vw = 视口宽度的1%）
- **vmin/vmax**：相对于视口宽度或高度中较小/较大值的百分比
:::

#### 2.1.3 实现技巧
::: tip 实现技巧
1. 使用百分比定义容器宽度：`width: 100%; max-width: 1200px;`
2. 使用相对单位定义字体大小：`font-size: 1rem;`
3. 使用相对单位定义边距和内边距：`margin: 1%; padding: 2%;`
4. 使用弹性盒模型（Flexbox）或网格布局（Grid）创建灵活的多列布局
5. 使用calc()函数进行复杂的计算：`width: calc(100% - 200px);`
:::

#### 2.1.4 流动性布局示例
::: details
::: code-group

```HTML [html]
<div class="fluid-layout-example">
  <h2>流动性布局示例</h2>
  
  <!-- 基本的流动性布局 -->
  <div class="example">
    <h3>基本的流动性布局</h3>
    <div class="fluid-container">
      <div class="fluid-column">
        <h4>列 1</h4>
        <p>这是一个使用百分比宽度的流动性列。</p>
      </div>
      <div class="fluid-column">
        <h4>列 2</h4>
        <p>这是一个使用百分比宽度的流动性列。</p>
      </div>
      <div class="fluid-column">
        <h4>列 3</h4>
        <p>这是一个使用百分比宽度的流动性列。</p>
      </div>
    </div>
  </div>
  
  <!-- 使用Flexbox的流动性布局 -->
  <div class="example">
    <h3>使用Flexbox的流动性布局</h3>
    <div class="flex-container">
      <div class="flex-column">
        <h4>Flex列 1</h4>
        <p>这是一个使用Flexbox的流动性列。</p>
      </div>
      <div class="flex-column">
        <h4>Flex列 2</h4>
        <p>这是一个使用Flexbox的流动性列。</p>
      </div>
      <div class="flex-column">
        <h4>Flex列 3</h4>
        <p>这是一个使用Flexbox的流动性列。</p>
      </div>
    </div>
  </div>
  
  <!-- 使用Grid的流动性布局 -->
  <div class="example">
    <h3>使用Grid的流动性布局</h3>
    <div class="grid-container">
      <div class="grid-item">
        <h4>Grid项 1</h4>
        <p>这是一个使用Grid的流动性项。</p>
      </div>
      <div class="grid-item">
        <h4>Grid项 2</h4>
        <p>这是一个使用Grid的流动性项。</p>
      </div>
      <div class="grid-item">
        <h4>Grid项 3</h4>
        <p>这是一个使用Grid的流动性项。</p>
      </div>
      <div class="grid-item">
        <h4>Grid项 4</h4>
        <p>这是一个使用Grid的流动性项。</p>
      </div>
    </div>
  </div>
</div>
```

```CSS [css]
/* 基本样式 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f4f4f4;
}

.fluid-layout-example {
  padding: 20px;
}

.example {
  background-color: white;
  padding: 20px;
  margin-bottom: 30px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #007bff;
}

h3 {
  margin-bottom: 20px;
  color: #28a745;
}

h4 {
  margin-bottom: 10px;
  color: #007bff;
}

p {
  margin-bottom: 10px;
}

/* 基本的流动性布局 */
.fluid-container {
  width: 100%;
  overflow: hidden;
}

.fluid-column {
  width: 31%; /* 三列布局，每列31%宽度，留出间距 */
  margin: 1%; /* 列之间的间距 */
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 5px;
  float: left;
}

/* 清除浮动 */
.fluid-container::after {
  content: "";
  display: table;
  clear: both;
}

/* 使用Flexbox的流动性布局 */
.flex-container {
  display: flex;
  flex-wrap: wrap; /* 允许换行 */
  gap: 20px; /* 列之间的间距 */
}

.flex-column {
  flex: 1; /* 等宽分配空间 */
  min-width: 250px; /* 最小宽度，确保在小屏幕上也能正常显示 */
  padding: 15px;
  background-color: #e9ecef;
  border-radius: 5px;
}

/* 使用Grid的流动性布局 */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* 自适应列数，最小宽度250px */
  gap: 20px; /* 项之间的间距 */
}

.grid-item {
  padding: 15px;
  background-color: #dee2e6;
  border-radius: 5px;
}

/* 媒体查询 - 平板设备 */
@media (max-width: 768px) {
  .fluid-column {
    width: 48%; /* 两列布局，每列48%宽度 */
  }
}

/* 媒体查询 - 移动设备 */
@media (max-width: 480px) {
  .fluid-column {
    width: 98%; /* 单列布局，98%宽度 */
  }
}
```
:::

### 2.2 灵活的图像和媒体

::: info 灵活的图像和媒体
在响应式设计中，确保图像、视频等媒体元素能够根据屏幕尺寸自动调整大小是非常重要的。如果不处理媒体元素，它们可能会溢出容器，导致布局混乱或需要水平滚动。
:::

#### 2.2.1 主要特点
::: info 主要特点
- 图像和视频能够根据其容器的大小自动调整尺寸
- 保持媒体元素的宽高比，避免变形
- 确保媒体元素在各种屏幕尺寸上都能正常显示
- 优化媒体元素的加载性能
:::

#### 2.2.2 实现方法
1. **使用max-width和height: auto**
   ```css
   img, video, embed, object {
     max-width: 100%;
     height: auto;
   }
   ```
   这是实现灵活图像的最简单方法，它确保图像的最大宽度不超过其容器的宽度，同时保持其宽高比。

2. **使用object-fit属性**
   ```css
   img {
     width: 100%;
     height: 200px;
     object-fit: cover; /* 保持宽高比，裁剪图像以填充容器 */
   }
   ```
   `object-fit`属性允许我们控制替换元素（如img、video等）如何适应其容器的宽高比。
   - `fill`：默认值，拉伸图像以填充容器，不保持宽高比
   - `contain`：保持宽高比，缩放图像以完全适应容器
   - `cover`：保持宽高比，缩放并裁剪图像以填充容器
   - `none`：不缩放图像，保持原始尺寸
   - `scale-down`：选择`none`或`contain`中较小的那个

3. **使用background-size属性**
   ```css
   .bg-image {
     background-image: url('image.jpg');
     background-size: cover; /* 保持宽高比，裁剪背景图以填充容器 */
     background-position: center;
     width: 100%;
     height: 300px;
   }
   ```
   对于使用背景图像的元素，可以使用`background-size`属性控制背景图像的大小。
   - `auto`：默认值，保持背景图像的原始尺寸
   - `cover`：保持宽高比，缩放背景图以完全覆盖容器
   - `contain`：保持宽高比，缩放背景图以完全适应容器
   - `percentage`：相对于容器的百分比
   - `length`：具体的长度值

4. **使用srcset和sizes属性**
   ```html
   <img 
     src="small.jpg" 
     srcset="small.jpg 600w, medium.jpg 900w, large.jpg 1200w" 
     sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw" 
     alt="描述"
   >
   ```
   `srcset`和`sizes`属性允许浏览器根据设备的特性（如屏幕宽度、像素密度等）选择最合适的图像版本，提高性能和用户体验。

5. **使用picture元素**
   ```html
   <picture>
     <source media="(max-width: 600px)" srcset="small.jpg">
     <source media="(max-width: 900px)" srcset="medium.jpg">
     <img src="large.jpg" alt="描述">
   </picture>
   ```
   `picture`元素允许我们根据不同的媒体查询条件提供不同的图像源，比srcset和sizes提供了更灵活的控制。

6. **优化媒体元素的加载性能**
   - 使用适当的图像格式（如WebP、AVIF等现代格式）
   - 压缩图像，减少文件大小
   - 使用懒加载（lazy loading）技术延迟加载非关键图像
   - 考虑使用响应式视频（如YouTube的响应式嵌入代码）

#### 2.2.3 示例
::: details
::: code-group

```HTML [html]
<div class="flexible-media-examples">
  <h2>灵活的图像和媒体示例</h2>
  
  <!-- 基本的灵活图像 -->
  <div class="example">
    <h3>基本的灵活图像</h3>
    <div class="image-container">
      <img src="https://picsum.photos/id/237/800/600" alt="基本的灵活图像" class="basic-flexible-image">
      <p>使用 max-width: 100%; height: auto; 的基本灵活图像</p>
    </div>
  </div>
  
  <!-- 使用object-fit的图像 -->
  <div class="example">
    <h3>使用object-fit的图像</h3>
    <div class="object-fit-container">
      <div class="object-fit-example">
        <h4>object-fit: fill</h4>
        <img src="https://picsum.photos/id/238/400/300" alt="object-fit: fill" class="object-fit-fill">
      </div>
      <div class="object-fit-example">
        <h4>object-fit: contain</h4>
        <img src="https://picsum.photos/id/238/400/300" alt="object-fit: contain" class="object-fit-contain">
      </div>
      <div class="object-fit-example">
        <h4>object-fit: cover</h4>
        <img src="https://picsum.photos/id/238/400/300" alt="object-fit: cover" class="object-fit-cover">
      </div>
      <div class="object-fit-example">
        <h4>object-fit: none</h4>
        <img src="https://picsum.photos/id/238/400/300" alt="object-fit: none" class="object-fit-none">
      </div>
    </div>
  </div>
  
  <!-- 使用background-size的背景图像 -->
  <div class="example">
    <h3>使用background-size的背景图像</h3>
    <div class="background-size-container">
      <div class="background-size-example background-size-auto">
        <h4>background-size: auto</h4>
      </div>
      <div class="background-size-example background-size-contain">
        <h4>background-size: contain</h4>
      </div>
      <div class="background-size-example background-size-cover">
        <h4>background-size: cover</h4>
      </div>
    </div>
  </div>
  
  <!-- 使用srcset和sizes的响应式图像 -->
  <div class="example">
    <h3>使用srcset和sizes的响应式图像</h3>
    <div class="srcset-container">
      <img 
        src="https://picsum.photos/id/239/400/300" 
        srcset="https://picsum.photos/id/239/400/300 400w, https://picsum.photos/id/239/800/600 800w, https://picsum.photos/id/239/1200/900 1200w" 
        sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw" 
        alt="使用srcset和sizes的响应式图像"
        class="srcset-image"
      >
      <p>浏览器会根据屏幕宽度选择最合适的图像版本</p>
    </div>
  </div>
  
  <!-- 使用picture元素的响应式图像 -->
  <div class="example">
    <h3>使用picture元素的响应式图像</h3>
    <div class="picture-container">
      <picture>
        <source media="(max-width: 600px)" srcset="https://picsum.photos/id/240/600/400">
        <source media="(max-width: 900px)" srcset="https://picsum.photos/id/241/900/600">
        <img src="https://picsum.photos/id/242/1200/800" alt="使用picture元素的响应式图像" class="picture-image">
      </picture>
      <p>根据不同的屏幕宽度显示不同的图像内容</p>
    </div>
  </div>
  
  <!-- 响应式视频 -->
  <div class="example">
    <h3>响应式视频</h3>
    <div class="video-container">
      <iframe 
        width="560" 
        height="315" 
        src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen
        class="responsive-video"
      ></iframe>
      <p>响应式视频嵌入</p>
    </div>
  </div>
</div>
```

```CSS [css]
/* 基本样式 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f4f4f4;
}

.flexible-media-examples {
  padding: 20px;
}

.example {
  background-color: white;
  padding: 20px;
  margin-bottom: 30px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #007bff;
}

h3 {
  margin-bottom: 20px;
  color: #28a745;
}

h4 {
  margin-bottom: 10px;
  color: #007bff;
}

p {
  margin-top: 10px;
  color: #666;
  font-style: italic;
}

/* 基本的灵活图像 */
.image-container {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #f8f9fa;
}

.basic-flexible-image {
  max-width: 100%;
  height: auto;
  border-radius: 3px;
}

/* 使用object-fit的图像 */
.object-fit-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.object-fit-example {
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 10px;
  text-align: center;
  background-color: #f8f9fa;
}

.object-fit-example img {
  width: 100%;
  height: 150px;
  border-radius: 3px;
  border: 1px solid #ccc;
}

.object-fit-fill {
  object-fit: fill; /* 拉伸填充 */
}

.object-fit-contain {
  object-fit: contain; /* 保持宽高比，完全适应 */
}

.object-fit-cover {
  object-fit: cover; /* 保持宽高比，裁剪填充 */
}

.object-fit-none {
  object-fit: none; /* 不缩放 */
}

/* 使用background-size的背景图像 */
.background-size-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.background-size-example {
  height: 200px;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 10px;
  text-align: center;
  color: white;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  background-image: url('https://picsum.photos/id/243/400/300');
  background-repeat: no-repeat;
  background-position: center;
}

.background-size-auto {
  background-size: auto; /* 默认值，保持原始尺寸 */
}

.background-size-contain {
  background-size: contain; /* 保持宽高比，完全适应 */
}

.background-size-cover {
  background-size: cover; /* 保持宽高比，裁剪填充 */
}

/* 使用srcset和sizes的响应式图像 */
.srcset-container {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #f8f9fa;
  text-align: center;
}

.srcset-image {
  max-width: 100%;
  height: auto;
  border-radius: 3px;
}

/* 使用picture元素的响应式图像 */
.picture-container {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #f8f9fa;
  text-align: center;
}

.picture-image {
  max-width: 100%;
  height: auto;
  border-radius: 3px;
}

/* 响应式视频 */
.video-container {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 宽高比 */
  height: 0;
  overflow: hidden;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #f8f9fa;
  margin-bottom: 10px;
}

.responsive-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
  border-radius: 5px;
}
```
:::

### 2.3 CSS媒体查询

::: tip 媒体查询定义
CSS媒体查询（Media Queries）是响应式设计的核心技术之一，它允许我们根据设备的特性（如屏幕宽度、高度、方向、分辨率等）应用不同的CSS样式。媒体查询使我们能够为不同的设备提供定制化的布局和样式，确保在各种设备上都能提供良好的用户体验。

:::

#### 2.3.1 基本语法
```css
@media media-type and (media-feature: value) {
  /* CSS样式 */
}
```

#### 2.3.2 媒体类型
- `all`：所有设备（默认值）
- `screen`：彩色屏幕设备
- `print`：打印设备
- `speech`：屏幕阅读器等语音合成设备

#### 2.3.3 常用的媒体特性
- `width`：视口宽度
- `height`：视口高度
- `max-width`：最大视口宽度
- `min-width`：最小视口宽度
- `max-height`：最大视口高度
- `min-height`：最小视口高度
- `orientation`：设备方向（`portrait`纵向或`landscape`横向）
- `aspect-ratio`：视口宽高比
- `device-width`：设备屏幕宽度（已废弃，推荐使用`width`）
- `device-height`：设备屏幕高度（已废弃，推荐使用`height`）
- `resolution`：设备分辨率
- `color`：颜色位数
- `prefers-reduced-motion`：用户是否偏好减少动画
- `prefers-color-scheme`：用户是否偏好深色或浅色模式

#### 2.3.4 媒体查询的运算符
- `and`：逻辑与，当所有条件都满足时应用样式
- `,`（逗号）：逻辑或，当任一条件满足时应用样式
- `not`：逻辑非，当条件不满足时应用样式
- `only`：仅匹配指定的媒体类型，用于兼容旧浏览器

#### 2.3.5 媒体查询的使用方法

1. **内联媒体查询**：在CSS文件中使用`@media`规则
```css
/* 基本样式 */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* 媒体查询 - 平板设备 */
@media (max-width: 768px) {
  .container {
    padding: 0 15px;
  }
}

/* 媒体查询 - 移动设备 */
@media (max-width: 480px) {
  .container {
    padding: 0 10px;
  }
}
```

2. **外部样式表**：使用`media`属性链接特定媒体的样式表
```html
<link rel="stylesheet" href="styles.css"> <!-- 所有设备 -->
<link rel="stylesheet" href="tablet.css" media="(max-width: 768px)"> <!-- 平板设备 -->
<link rel="stylesheet" href="mobile.css" media="(max-width: 480px)"> <!-- 移动设备 -->
```

3. **导入样式表**：使用`@import`规则导入特定媒体的样式表
```css
@import url('styles.css');
@import url('tablet.css') (max-width: 768px);
@import url('mobile.css') (max-width: 480px);
```

#### 2.3.6 媒体查询的最佳实践

1. **移动优先设计**：
   - 从移动设备的设计开始，然后使用`min-width`媒体查询逐步扩展到更大的屏幕尺寸
   - 这样可以确保在移动设备上有良好的性能和用户体验

2. **选择合适的断点**：
   - 基于内容而不是特定的设备尺寸设置断点
   - 常见的断点值：
     - 移动设备：320px - 480px
     - 平板设备：481px - 768px
     - 小型笔记本：769px - 1024px
     - 桌面电脑：1025px - 1200px
     - 大屏幕：1201px及以上

3. **使用相对单位**：
   - 结合媒体查询和相对单位（如em、rem、vw/vh）使用
   - 这样可以创建更灵活、更响应式的设计

4. **避免过度使用媒体查询**：
   - 尽量使用流动性布局和灵活的设计，减少对媒体查询的依赖
   - 只在必要时使用媒体查询调整布局和样式

5. **考虑设备方向**：
   - 使用`orientation`媒体查询处理设备方向变化（如从纵向到横向）
   - 确保在不同方向上都能提供良好的用户体验

6. **考虑用户偏好**：
   - 使用`prefers-reduced-motion`媒体查询尊重用户的动画偏好设置
   - 使用`prefers-color-scheme`媒体查询适应用户的深色/浅色模式偏好

7. **测试媒体查询**：
   - 在各种设备和浏览器上测试媒体查询的效果
   - 使用浏览器的开发者工具模拟不同的设备尺寸和特性
:::

#### 2.3.7 示例：CSS媒体查询
::: details
::: code-group

```HTML [html]
<div class="media-queries-examples">
  <h2>CSS媒体查询示例</h2>
  
  <!-- 基本的媒体查询 -->
  <div class="example">
    <h3>基本的媒体查询</h3>
    <div class="basic-media-query">
      <p>根据屏幕宽度，这个容器的背景颜色和字体大小会发生变化。</p>
    </div>
  </div>
  
  <!-- 移动优先设计 -->
  <div class="example">
    <h3>移动优先设计</h3>
    <div class="mobile-first-container">
      <div class="mobile-first-box">Box 1</div>
      <div class="mobile-first-box">Box 2</div>
      <div class="mobile-first-box">Box 3</div>
    </div>
    <p>从移动设备的单列布局开始，逐步扩展到更大屏幕的多列布局。</p>
  </div>
  
  <!-- 设备方向媒体查询 -->
  <div class="example">
    <h3>设备方向媒体查询</h3>
    <div class="orientation-example">
      <p>旋转设备，这个容器的布局会根据设备方向（纵向/横向）发生变化。</p>
    </div>
  </div>
  
  <!-- 用户偏好媒体查询 -->
  <div class="example">
    <h3>用户偏好媒体查询</h3>
    <div class="preferences-examples">
      <div class="motion-preference">
        <h4>减少动画偏好</h4>
        <div class="motion-box">如果您设置了减少动画，这个动画将不会播放。</div>
      </div>
      <div class="color-scheme-preference">
        <h4>颜色方案偏好</h4>
        <div class="color-scheme-box">根据您的系统颜色方案偏好，这个容器的颜色会自动调整。</div>
      </div>
    </div>
  </div>
</div>
```

```CSS [css]
/* 基本样式 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f4f4f4;
}

.media-queries-examples {
  padding: 20px;
}

.example {
  background-color: white;
  padding: 20px;
  margin-bottom: 30px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #007bff;
}

h3 {
  margin-bottom: 20px;
  color: #28a745;
}

h4 {
  margin-bottom: 10px;
  color: #007bff;
}

p {
  margin-top: 10px;
  color: #666;
  font-style: italic;
}

/* 基本的媒体查询 */
.basic-media-query {
  padding: 20px;
  border-radius: 5px;
  background-color: #e9ecef;
  text-align: center;
  font-size: 16px;
}

/* 媒体查询 - 桌面设备 */
@media (min-width: 1200px) {
  .basic-media-query {
    background-color: #007bff;
    color: white;
    font-size: 18px;
  }
}

/* 媒体查询 - 平板设备 */
@media (max-width: 768px) {
  .basic-media-query {
    background-color: #28a745;
    color: white;
    font-size: 16px;
    padding: 15px;
  }
}

/* 媒体查询 - 移动设备 */
@media (max-width: 480px) {
  .basic-media-query {
    background-color: #dc3545;
    color: white;
    font-size: 14px;
    padding: 10px;
  }
}

/* 移动优先设计 */
.mobile-first-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.mobile-first-box {
  padding: 20px;
  background-color: #007bff;
  color: white;
  text-align: center;
  font-weight: bold;
  border-radius: 5px;
}

/* 媒体查询 - 平板设备（使用min-width，移动优先） */
@media (min-width: 768px) {
  .mobile-first-container {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .mobile-first-box {
    flex: 1;
    min-width: 30%;
  }
}

/* 媒体查询 - 桌面设备 */
@media (min-width: 1024px) {
  .mobile-first-container {
    flex-direction: row;
  }
  
  .mobile-first-box {
    flex: 1;
    min-width: auto;
  }
}

/* 设备方向媒体查询 */
.orientation-example {
  padding: 20px;
  border-radius: 5px;
  background-color: #ffc107;
  color: #212529;
  text-align: center;
}

/* 纵向方向 */
@media (orientation: portrait) {
  .orientation-example {
    background-color: #ffc107;
    color: #212529;
    padding: 30px 20px;
  }
}

/* 横向方向 */
@media (orientation: landscape) {
  .orientation-example {
    background-color: #17a2b8;
    color: white;
    padding: 20px 40px;
  }
}

/* 用户偏好媒体查询 */
.preferences-examples {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.motion-preference,
.color-scheme-preference {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #f8f9fa;
}

/* 动画示例 */
@keyframes motionExample {
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(50px);
  }
  100% {
    transform: translateX(0);
  }
}

.motion-box {
  padding: 15px;
  background-color: #6f42c1;
  color: white;
  border-radius: 5px;
  text-align: center;
  animation: motionExample 2s ease-in-out infinite;
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .motion-box {
    animation: none;
    transform: none;
  }
}

/* 颜色方案示例 */
.color-scheme-box {
  padding: 15px;
  border-radius: 5px;
  text-align: center;
  background-color: white;
  color: black;
  border: 1px solid #ddd;
}

/* 深色模式偏好 */
@media (prefers-color-scheme: dark) {
  .color-scheme-box {
    background-color: #333;
    color: white;
    border-color: #555;
  }
}

/* 浅色模式偏好 */
@media (prefers-color-scheme: light) {
  .color-scheme-box {
    background-color: white;
    color: black;
    border-color: #ddd;
  }
}
```
:::

## 三、响应式设计的设计策略

### 3.1 移动优先设计

::: tip 移动优先设计定义
移动优先设计（Mobile-First Design）是一种响应式设计策略，它从移动设备的设计开始，然后逐步扩展到更大的屏幕尺寸。这种方法与传统的"桌面优先"设计相反，后者从桌面设备的设计开始，然后向下适配到更小的屏幕尺寸。

:::

### 3.2 移动优先设计的核心原则
::: info
- 从最小的屏幕尺寸（移动设备）开始设计
- 确定核心内容和功能，确保在移动设备上有良好的用户体验
- 使用`min-width`媒体查询逐步添加更多的布局和功能，适应更大的屏幕尺寸
- 优先考虑移动设备的性能和可用性约束
:::

### 3.3 移动优先设计的优势
::: info
1. **更好的移动用户体验**：
   - 确保在移动设备上有良好的用户体验，而不是作为桌面设计的"降级版"
   - 强迫设计师专注于核心内容和功能，避免不必要的元素

2. **更好的性能**：
   - 从简单的设计开始，逐步添加复杂性，减少初始加载时间
   - 优化移动设备的性能，通常移动设备的处理能力和网络连接都比桌面设备弱

3. **更好的SEO**：
   - Google等搜索引擎优先考虑移动友好的网站
   - 移动优先设计自然会创建移动友好的网站结构

4. **更高效的开发**：
   - 从简单到复杂的开发流程，减少返工和修改
   - 更好地管理项目范围和优先级

5. **更好的可访问性**：
   - 移动优先设计通常会导致更清晰、更简洁的内容结构
   - 有助于创建更易于导航和理解的用户界面

:::

### 3.4 移动优先设计的实现步骤
::: info
1. **研究和规划**：
   - 了解目标用户和他们的设备使用情况
   - 确定核心内容和功能，创建内容层次结构
   - 设计用户流程图和线框图，从移动设备开始

2. **移动设计**：
   - 设计移动设备的布局和界面
   - 确保核心内容和功能在小屏幕上都能正常工作
   - 优化导航、阅读体验和触摸交互

3. **响应式扩展**：
   - 使用`min-width`媒体查询逐步扩展到更大的屏幕尺寸
   - 在每个断点处添加更多的布局元素和功能
   - 确保在所有屏幕尺寸上都能提供良好的用户体验

4. **测试和优化**：
   - 在各种设备和浏览器上测试设计
   - 收集用户反馈，不断优化设计
   - 监控性能指标，确保在移动设备上有良好的性能

:::

### 3.5 移动优先设计的最佳实践
::: info
1. **内容优先**：
   - 确定网站的核心内容和功能，确保它们在移动设备上有最高的可见性和可用性
   - 使用清晰的内容层次结构，帮助用户快速找到他们需要的信息

2. **简化导航**：
   - 在移动设备上使用汉堡菜单或其他简化的导航模式
   - 减少导航项的数量，优先显示最重要的链接
   - 考虑使用粘性导航，方便用户在滚动时访问

3. **优化触摸交互**：
   - 确保按钮和交互元素足够大（至少48×48像素），便于触摸
   - 提供足够的触摸目标间距（至少16像素），避免误触
   - 使用明确的视觉反馈，让用户知道他们的操作已被接收

4. **优化性能**：
   - 压缩和优化图像、CSS和JavaScript文件
   - 使用懒加载技术延迟加载非关键资源
   - 考虑使用AMP（Accelerated Mobile Pages）等技术提高移动页面加载速度

5. **适应不同的输入方式**：
   - 考虑不同设备的输入方式（如触摸、鼠标、键盘等）
   - 确保在各种输入方式下都能提供良好的用户体验

6. **考虑离线访问**：
   - 使用Service Workers等技术支持离线访问
   - 确保核心内容在网络连接不稳定的情况下也能访问

7. **测试、测试、再测试**：
   - 在各种设备和浏览器上测试移动优先设计
   - 使用浏览器的开发者工具模拟不同的设备尺寸和特性
   - 收集真实用户的反馈，不断优化设计
:::

### 3.6 移动优先设计示例
::: details
::: code-group
```HTML [html]
<div class="mobile-first-design-example">
  <h2>移动优先设计示例</h2>
  
  <!-- 移动优先的响应式网站 -->
  <div class="mobile-first-website">
    <!-- 头部 -->
    <header class="mobile-header">
      <div class="header-content">
        <h1 class="site-title">移动优先设计</h1>
        <button class="menu-toggle" aria-label="菜单">
          <span class="menu-icon"></span>
          <span class="menu-icon"></span>
          <span class="menu-icon"></span>
        </button>
      </div>
      
      <!-- 导航菜单 -->
      <nav class="mobile-nav">
        <ul class="nav-list">
          <li class="nav-item"><a href="#" class="nav-link">首页</a></li>
          <li class="nav-item"><a href="#" class="nav-link">关于我们</a></li>
          <li class="nav-item"><a href="#" class="nav-link">产品</a></li>
          <li class="nav-item"><a href="#" class="nav-link">博客</a></li>
          <li class="nav-item"><a href="#" class="nav-link">联系我们</a></li>
        </ul>
      </nav>
    </header>
    
    <!-- 主要内容 -->
    <main class="mobile-main">
      <!-- 英雄区域 -->
      <section class="hero-section">
        <div class="hero-content">
          <h2>移动优先，处处适用</h2>
          <p>创建在各种设备上都能提供出色用户体验的响应式网站</p>
          <a href="#" class="cta-button">了解更多</a>
        </div>
      </section>
      
      <!-- 特色区域 -->
      <section class="features-section">
        <h2>我们的特色</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">📱</div>
            <h3>移动优先</h3>
            <p>从移动设备开始设计，确保最佳的移动用户体验</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎨</div>
            <h3>现代设计</h3>
            <p>采用现代的设计理念和技术，创建美观实用的网站</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>高性能</h3>
            <p>优化网站性能，确保快速加载和流畅的用户体验</p>
          </div>
        </div>
      </section>
      
      <!-- 博客文章区域 -->
      <section class="blog-section">
        <h2>最新博客文章</h2>
        <div class="blog-grid">
          <article class="blog-card">
            <img src="https://picsum.photos/id/101/800/600" alt="响应式设计的未来" class="blog-image">
            <div class="blog-content">
              <h3>响应式设计的未来</h3>
              <p>探索响应式设计的最新趋势和技术，了解未来的发展方向...</p>
              <a href="#" class="read-more">阅读更多</a>
            </div>
          </article>
          <article class="blog-card">
            <img src="https://picsum.photos/id/102/800/600" alt="移动优先设计的最佳实践" class="blog-image">
            <div class="blog-content">
              <h3>移动优先设计的最佳实践</h3>
              <p>学习如何实施移动优先设计策略，创建出色的移动用户体验...</p>
              <a href="#" class="read-more">阅读更多</a>
            </div>
          </article>
        </div>
      </section>
      
      <!-- 联系区域 -->
      <section class="contact-section">
        <h2>联系我们</h2>
        <form class="contact-form">
          <div class="form-group">
            <label for="name">姓名</label>
            <input type="text" id="name" name="name" required>
          </div>
          <div class="form-group">
            <label for="email">邮箱</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="form-group">
            <label for="message">留言</label>
            <textarea id="message" name="message" rows="4" required></textarea>
          </div>
          <button type="submit" class="submit-button">发送留言</button>
        </form>
      </section>
    </main>
    
    <!-- 页脚 -->
    <footer class="mobile-footer">
      <div class="footer-content">
        <div class="footer-info">
          <h3>移动优先设计</h3>
          <p>创建在各种设备上都能提供出色用户体验的响应式网站</p>
        </div>
        <div class="footer-links">
          <h4>快速链接</h4>
          <ul>
            <li><a href="#">首页</a></li>
            <li><a href="#">关于我们</a></li>
            <li><a href="#">产品</a></li>
            <li><a href="#">博客</a></li>
            <li><a href="#">联系我们</a></li>
          </ul>
        </div>
        <div class="footer-social">
          <h4>关注我们</h4>
          <div class="social-icons">
            <a href="#" class="social-icon">📘</a>
            <a href="#" class="social-icon">🐦</a>
            <a href="#" class="social-icon">📸</a>
            <a href="#" class="social-icon">📹</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2023 移动优先设计. 保留所有权利.</p>
      </div>
    </footer>
  </div>
</div>
```

```CSS [css]
/* 基本样式 - 移动优先 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f4f4f4;
}

.mobile-first-design-example {
  padding: 0;
}

h2 {
  margin-bottom: 20px;
  color: #007bff;
}

h3 {
  margin-bottom: 15px;
  color: #28a745;
}

h4 {
  margin-bottom: 10px;
  color: #007bff;
}

p {
  margin-bottom: 15px;
}

/* 头部样式 - 移动优先 */
.mobile-header {
  background-color: #007bff;
  color: white;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
}

.site-title {
  font-size: 1.2rem;
  font-weight: bold;
}

/* 菜单切换按钮 */
.menu-toggle {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 5px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 30px;
  height: 21px;
}

.menu-icon {
  display: block;
  width: 100%;
  height: 3px;
  background-color: white;
  border-radius: 1px;
  transition: all 0.3s ease;
}

/* 移动导航菜单 */
.mobile-nav {
  background-color: #0056b3;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.mobile-nav.active {
  max-height: 300px; /* 足够容纳所有菜单项 */
}

.nav-list {
  list-style: none;
  padding: 0 15px;
}

.nav-item {
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-item:last-child {
  border-bottom: none;
}

.nav-link {
  color: white;
  text-decoration: none;
  display: block;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: #ffc107;
}

/* 主要内容样式 - 移动优先 */
.mobile-main {
  background-color: white;
}

/* 英雄区域 */
.hero-section {
  background-color: #007bff;
  color: white;
  padding: 40px 20px;
  text-align: center;
}

.hero-content h2 {
  font-size: 1.8rem;
  margin-bottom: 15px;
  color: white;
}

.hero-content p {
  font-size: 1.1rem;
  margin-bottom: 25px;
  opacity: 0.9;
}

/* 按钮样式 */
.cta-button {
  display: inline-block;
  background-color: #ffc107;
  color: #212529;
  padding: 12px 24px;
  text-decoration: none;
  border-radius: 5px;
  font-weight: bold;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.cta-button:hover {
  background-color: #e0a800;
  transform: translateY(-2px);
}

/* 特色区域 */
.features-section {
  padding: 40px 20px;
  text-align: center;
}

.features-grid {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.feature-card {
  background-color: #f8f9fa;
  padding: 25px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

/* 博客文章区域 */
.blog-section {
  padding: 40px 20px;
  background-color: #f8f9fa;
  text-align: center;
}

.blog-grid {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.blog-card {
  background-color: white;
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.blog-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.blog-image {
  width: 100%;
  height: auto;
  display: block;
}

.blog-content {
  padding: 20px;
  text-align: left;
}

.read-more {
  display: inline-block;
  color: #007bff;
  text-decoration: none;
  font-weight: bold;
  margin-top: 10px;
  transition: color 0.3s ease;
}

.read-more:hover {
  color: #0056b3;
  text-decoration: underline;
}

/* 联系区域 */
.contact-section {
  padding: 40px 20px;
  text-align: center;
}

.contact-form {
  max-width: 500px;
  margin: 0 auto;
  text-align: left;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #495057;
}

input[type="text"],
input[type="email"],
textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

input[type="text"]:focus,
input[type="email"]:focus,
textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.submit-button {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
  width: 100%;
}

.submit-button:hover {
  background-color: #218838;
}

/* 页脚样式 - 移动优先 */
.mobile-footer {
  background-color: #343a40;
  color: white;
  padding: 30px 20px;
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
  margin-bottom: 20px;
}

.footer-info,
.footer-links,
.footer-social {
  text-align: center;
}

.footer-info p {
  opacity: 0.8;
}

.footer-links ul {
  list-style: none;
}

.footer-links li {
  margin-bottom: 8px;
}

.footer-links a {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-links a:hover {
  color: white;
}

.social-icons {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.social-icon {
  display: inline-block;
  font-size: 1.5rem;
  color: white;
  text-decoration: none;
  transition: transform 0.3s ease;
}

.social-icon:hover {
  transform: translateY(-3px);
}

.footer-bottom {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.9rem;
  opacity: 0.8;
}

/* 媒体查询 - 平板设备（768px及以上） */
@media (min-width: 768px) {
  /* 头部样式 - 平板设备 */
  .header-content {
    padding: 20px 30px;
  }
  
  .site-title {
    font-size: 1.5rem;
  }
  
  /* 英雄区域 - 平板设备 */
  .hero-section {
    padding: 60px 30px;
  }
  
  .hero-content h2 {
    font-size: 2.5rem;
    margin-bottom: 20px;
  }
  
  .hero-content p {
    font-size: 1.2rem;
    margin-bottom: 30px;
    max-width: 700px;
    margin-left: auto;
    margin-right: auto;
  }
  
  /* 特色区域 - 平板设备 */
  .features-section {
    padding: 60px 30px;
  }
  
  .features-grid {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 20px;
  }
  
  .feature-card {
    flex: 1;
    min-width: calc(50% - 10px); /* 两列布局，减去间隙 */
  }
  
  /* 博客文章区域 - 平板设备 */
  .blog-section {
    padding: 60px 30px;
  }
  
  .blog-grid {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 20px;
  }
  
  .blog-card {
    flex: 1;
    min-width: calc(50% - 10px); /* 两列布局，减去间隙 */
  }
  
  /* 联系区域 - 平板设备 */
  .contact-section {
    padding: 60px 30px;
  }
  
  /* 页脚 - 平板设备 */
  .mobile-footer {
    padding: 40px 30px;
  }
  
  .footer-content {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 30px;
    justify-content: space-between;
  }
  
  .footer-info,
  .footer-links,
  .footer-social {
    flex: 1;
    min-width: calc(33.333% - 20px); /* 三列布局，减去间隙 */
    text-align: left;
  }
}

/* 媒体查询 - 桌面设备（1024px及以上） */
@media (min-width: 1024px) {
  /* 头部样式 - 桌面设备 */
  .header-content {
    padding: 20px 50px;
  }
  
  .site-title {
    font-size: 1.8rem;
  }
  
  /* 菜单切换按钮 - 桌面设备隐藏 */
  .menu-toggle {
    display: none;
  }
  
  /* 导航菜单 - 桌面设备 */
  .mobile-nav {
    max-height: none; /* 不再隐藏 */
    background-color: transparent;
    padding: 0 50px 0 0;
  }
  
  .nav-list {
    display: flex;
    padding: 0;
    justify-content: flex-end;
  }
  
  .nav-item {
    border-bottom: none;
    margin-left: 20px;
    padding: 0;
  }
  
  .nav-link {
    padding: 10px 15px;
    border-radius: 4px;
    transition: background-color 0.3s ease;
  }
  
  .nav-link:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
  
  /* 英雄区域 - 桌面设备 */
  .hero-section {
    padding: 80px 50px;
  }
  
  .hero-content h2 {
    font-size: 3rem;
    margin-bottom: 25px;
  }
  
  /* 特色区域 - 桌面设备 */
  .features-section {
    padding: 80px 50px;
  }
  
  .features-grid {
    gap: 30px;
  }
  
  .feature-card {
    min-width: calc(33.333% - 20px); /* 三列布局，减去间隙 */
  }
  
  /* 博客文章区域 - 桌面设备 */
  .blog-section {
    padding: 80px 50px;
  }
  
  /* 联系区域 - 桌面设备 */
  .contact-section {
    padding: 80px 50px;
  }
  
  /* 页脚 - 桌面设备 */
  .mobile-footer {
    padding: 50px;
  }
}

/* 媒体查询 - 大屏幕设备（1200px及以上） */
@media (min-width: 1200px) {
  /* 容器宽度 - 大屏幕设备 */
  .hero-section,
  .features-section,
  .blog-section,
  .contact-section {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  /* 博客文章区域 - 大屏幕设备 */
  .blog-card {
    min-width: calc(33.333% - 20px); /* 三列布局，减去间隙 */
  }
}
```
:::