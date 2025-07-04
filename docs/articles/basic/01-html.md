# 01-HTML基础

## 一、HTML

### 1、HTML概述


#### 1.1、什么是HTML
>[!TIP]
> HTML（**HyperText Markup Language**，超文本标记语言）
> - 是构建网页的标准语言。
> - 用于定义网页的结构和内容，通过一系列标签来标识文本、图像、链接、表单等网页元素。
>
> **特点：**
>
> 1. `跨平台`：
>    - 兼容性强：HTML可以在多种操作系统和浏览器上运行。
>    - 设备无关性：HTML网页可以在不同的设备上显示。
> 2. `结构化`：文档结构清晰,通过标签来定义文档的结构  
> 3. `可扩展性`：支持多种技术结合使用，如JavaScript、CSS、Java、PHP等。

#### 1.2、 HTML的历史
>[!TIP]
> 1. 1991年：`HTML`诞生,由英国`蒂姆·伯纳斯-李`发明。
> 4. 2008年：`HTML5 `诞生。

#### 1.3、HTML的基本结构
>[!TIP]
> 1. **`<!DOCTYPE html>`**：声明文档类型，告诉浏览器使用 HTML5 标准解析网页。
> 2. **`<html>`**：网页的根元素，包含整个网页内容。
> 3. **`<head>`**：头部信息，包含网页的元数据，如标题、字符编码等。
> 4. **`<title>`**：定义网页在浏览器标签上显示的标题。
> 5. **`<body>`**：网页的主体部分，包含所有可见的网页内容，如文本、图片、表格等。
示例：
::: details 点击查看示例
```html
<!DOCTYPE html>
<html>
<head>
	<title>网页标题</title>
</head>
<body>
	<!-- 网页内容 -->
</body>
</html>
```
:::


### 2、HTML标签
>[!TIP]
>   分为两种类型：
>
> - 块级标签：占据整行，如`<div>`、`<p>`等。
> - 行内标签：不占据整行，如`<span>`、`<a>`等。
>
> HTML标签可以嵌套，如`<div>`标签可以包含多个`<p>`标签。



### 2.1、标签的语法
>[!TIP]
> HTML标签有两种形式：
>
> 1. 自闭合标签：不包含内容的标签，如`<img>`、`<br>`等。
> 2. 开始标签和结束标签：包含内容的标签，如`<a>`、`<table>`等。
>
> HTML标签的属性：
> - 属性可以附加到HTML标签上，用来控制标签的行为。
> - 属性以名称/值对的形式出现，如`name="value"`。


### 2.2、常见的标签
>[!TIP] 常见的HTML标签：
> - 标题标签：`<h1>`~`<h6>`
> - 段落标签：`<p>`
> - 多媒体标签：`<img>`、`<audio>`、`<video>`
> - 列表标签：`<ul>`、`<ol>`、`<li>`
> - 表单标签：`<form>`、`<input>`、`<select>`、`<option>`、`<textarea>`、`<button>`
> - 表格标签：`<table>`、`<tr>`、`<td>`、`<th>`
> - 文字标签：`<span>`、`<a>`、`<em>`、`<strong>`、`<b>`、`<i>`、`<u>`、`<strike>`、`<font>`
> - 多媒体标签：`<audio>`、`<video>`、`<svg>`、`<iframe>`、`<object>`
> - 其他标签：`<div>`、`<span>`、`<script>`、`<style>`、`<canvas>`、`<header>`、`<footer>`、`<nav>`、`<main>`、`<article>`、`<section>`、`<aside>`、`<details>`、`<figure>`、`<figcaption>`、`<dialog>`、`<datalist>`、`<output>`、`<math>`、`<picture>`、`<mark>`

#### 2.2.1、标题标签
>[!TIP]
> 标题标签用于定义网页的各级标题
> 	- `<h1>`标签定义网页的最高级标题，`<h6>`标签定义网页的最低级标题。

#### 2.2.2、文本标签
>[!TIP]
> 文本标签用于定义网页的文本内容
> 	- 段落`<p>`、标题`<h1>`、强调`<em><strong>`、加粗`<b>`、斜体`<em><i>`等。
> 	- 锚元素`<a>`可以通过`href`属性创建通向其他网页、文件、电子邮件地址、同一页面内的位置或任何其他 URL 的超链接。

#### 2.2.3、多媒体标签
>[!TIP]
> 多媒体标签用于定义网页的媒体内容，如图片、音频、视频等。
> - 图片`<img>`、音频`<audio>`、视频`<video>`。

##### 3.1、图片`img`
>[!TIP]
> `img`标签用于在网页中插入图片，支持格式：`JPEG PNG GIF SVG WebP AVIF`等。
> - `src`：图片的URL地址。
> - `width`：图片的宽度。
> - `height`：图片的高度。
> - `title`：鼠标`悬停`在图片上时显示的文本。
> - `alt`：图片的`替代`文本，用于屏幕阅读器。

::: details 示例代码
```html
<img src="image.jpg" alt="描述文本" width="500" height="300" title="图片标题">
```
:::

##### 3.2、音频`audio`
>[!TIP]
> 用于定义音频内容，支持 MP3、WAV 和 OGG）。
>属性：
> - `src`：音频的URL地址。
> - `controls`：显示音频播放控件。
> - `autoplay`：自动播放音频。
> - `loop`：循环播放音频。
> - `muted`：是否静音播放音频，默认值为 false。
> - `preload`：预加载音频，值有：`none`、`metadata`、`auto`。
> - `poster`：音频播放前的封面图片。
> - `duration`：音频的总时长,以秒为单位。
>事件：
> - `play`：音频开始播放时触发。
> - `pause`：音频暂停播放时触发。
> - `ended`：音频播放结束时触发。

::: details 示例代码
```html
<audio src="audio.mp3" controls autoplay loop muted preload poster="poster.jpg">
```
:::

##### 3.3、视频`video`
>[!TIP]
> 用于定义视频内容，支持多种视频格式（如 MP4、WebM 和 OGG）。
> - `src`：视频的URL地址。
> - `controls`：显示视频播放控件。
> - `autoplay`：自动播放视频。
> - `loop`：循环播放视频。
> - `muted`：静音播放视频。
> - `preload`：预加载视频。
> - `poster`：视频播放前的封面图片。
> - `width`：视频的宽度。
> - `height`：视频的高度。
::: details 示例代码
```html
<video src="video.mp4" controls autoplay loop muted preload poster="poster.jpg" width="500" height="300">

```
:::


#### 2.2.4、列表标签



#### 2.2.5、表单
>[!tip]
> 表单用于收集用户输入，常见的表单元素包括输入框、下拉菜单、多选框、单选按钮、提交按钮等。
##### 5.1、输入框
>[!TIP]
> 输入框用于收集用户输入的文本信息，常见的输入框类型有：
> - 文本输入框：`<input type="text">`
> - 密码输入框：`<input type="password">`
> - 数字输入框：`<input type="number">`
> - 邮箱输入框：`<input type="email">`
> - 日期输入框：`<input type="date">`
> - 年月输入框：`<input type="month">`
> - 日期时间选择器：`<input type="datetime-local">`
> - 文件上传框：`<input type="file">`
> - 搜索框：`<input type="search">`
> - 电话输入框：`<input type="tel">`
> - URL输入框：`<input type="url">`
> - 隐藏输入框：`<input type="hidden">`
> - 提交按钮：`<input type="submit">`
> - 重置按钮：`<input type="reset">`
> - 图像按钮：`<input type="image">`
> - 单选按钮：`<input type="radio">`
> - 复选框：`<input type="checkbox">`
> - 颜色选择器：`<input type="color">`
> - 滑动条：`<input type="range">`
> - 下拉菜单：`<select>`
> - 多行文本框：`<textarea>`
> - 按钮：`<button>`
##### 5.2、下拉菜单
>[!TIP]
> 下拉菜单用于收集用户选择的选项，常见的下拉菜单类型有：
> - 单选下拉菜单：`<select>`
> - 多选下拉菜单：`<select multiple>`
> - 下拉菜单选项：`<option>`
> - 下拉菜单分组：`<optgroup>`
示例：
::: details 点击查看示例代码
```html
<select multiple>
  <option value="option1">选项1</option>
  <option value="option2">选项2</option>
  <option value="option3">选项3</option>
</select>
```

<select multiple>
  <option value="option1">选项1</option>
  <option value="option2">选项2</option>
  <option value="option3">选项3</option>
</select>
```html
<select>
  <optgroup label="分组1">
    <option value="option1">选项1</option>
    <option value="option2">选项2</option>
  </optgroup>
  <optgroup label="分组2">
    <option value="option3">选项3</option>
    <option value="option4">选项4</option>
  </optgroup>
</select>
```

<select>
  <optgroup label="分组1">
    <option value="option1">选项1</option>
    <option value="option2">选项2</option>
  </optgroup>
  <optgroup label="分组2">
    <option value="option3">选项3</option>
    <option value="option4">选项4</option>
  </optgroup>
</select>
:::

##### 5.3、单选按钮(Radio Button)
>[!TIP]
> 单选按钮用于从多个选项中选择一个：
> - 使用`<input type="radio">`创建
> - 相同name属性的单选按钮为一组
> - 常用属性：
>   - checked：默认选中
>   - disabled：禁用
>   - value：提交的值
>   - required：必选(HTML5)

基础示例：
::: details 点击查看基础示例
```html
<label><input type="radio" name="gender" value="male">男</label>
<label><input type="radio" name="gender" value="female">女</label>
<label><input type="radio" name="gender" value="other">其他</label>
```
<label><input type="radio" name="gender" value="male">男</label>
<label><input type="radio" name="gender" value="female">女</label>
<label><input type="radio" name="gender" value="other">其他</label>
:::

##### 5.4、多选按钮(Checkbox)
>[!TIP]
> 多选按钮用于选择多个选项：
> - 使用`<input type="checkbox">`创建
> - 相同name属性的复选框为一组
> - 常用属性：
>   - checked：默认选中
>   - disabled：禁用
>   - value：提交的值
>   - required：至少选择一个(HTML5)

基础示例：
::: details 点击查看基础示例
```html
<label><input type="checkbox" name="hobby" value="reading">阅读</label>
<label><input type="checkbox" name="hobby" value="sports">运动</label>
<label><input type="checkbox" name="hobby" value="music">音乐</label>
```
<label><input type="checkbox" name="hobby" value="reading">阅读</label>
<label><input type="checkbox" name="hobby" value="sports">运动</label>
<label><input type="checkbox" name="hobby" value="music">音乐</label>
:::

区别对比：
::: details 点击查看区别
```html
<!-- 单选按钮(只能选一个) -->
<label><input type="radio" name="gender" value="male">男</label>
<label><input type="radio" name="gender" value="female">女</label>

<!-- 多选按钮(可以选多个) -->  
<label><input type="checkbox" name="hobby" value="sports">运动</label>
<label><input type="checkbox" name="hobby" value="music">音乐</label>
```
:::

##### 5.5、文本区域
>[!TIP]
> 文本区域用于多行文本输入，使用`<textarea>`标签
> - rows：指定可见行数
> - cols：指定可见列数
> - placeholder：提示文本
示例：
::: details 点击查看示例代码
```html
<textarea rows="4" cols="50" placeholder="请输入您的意见..."></textarea>
```
<textarea rows="4" cols="50" placeholder="请输入您的意见..."></textarea>
:::

##### 5.6、表单提交
>[!TIP]
> 表单提交相关元素：
> - 提交按钮：`<input type="submit">`或`<button type="submit">`
> - 重置按钮：`<input type="reset">`
> - 表单属性：
>   - action：指定提交地址
>   - method：指定提交方法(GET/POST)
>   - enctype：指定编码类型(文件上传时需要multipart/form-data)
完整示例：
::: details 点击查看完整表单示例
```html
<form action="/submit" method="post" enctype="multipart/form-data">
  <label>用户名：<input type="text" name="username" required></label><br>
  <label>密码：<input type="password" name="password" required></label><br>
  <label>性别：
    <input type="radio" name="gender" value="male">男
    <input type="radio" name="gender" value="female">女
  </label><br>
  <label>爱好：
    <input type="checkbox" name="hobby" value="reading">阅读
    <input type="checkbox" name="hobby" value="sports">运动
  </label><br>
  <label>城市：
    <select name="city">
      <option value="beijing">北京</option>
      <option value="shanghai">上海</option>
    </select>
  </label><br>
  <label>个人简介：<textarea name="bio"></textarea></label><br>
  <label>上传头像：<input type="file" name="avatar"></label><br>
  <button type="submit">提交</button>
  <button type="reset">重置</button>
</form>
```
:::

##### 5.7、HTML5表单增强
>[!TIP]
> HTML5新增的表单特性和输入类型：
> - 新的输入类型：email、url、number、range、date、color等
> - 表单验证属性：required、pattern、min、max等
> - 自动完成：autocomplete
> - 占位文本：placeholder
示例：
::: details 点击查看HTML5表单示例
```html
<input type="email" required placeholder="请输入邮箱">
<input type="number" min="1" max="100" step="1">
<input type="date">
<input type="color">
<input type="range" min="0" max="100" value="50">
```
:::


#### 2.2.6、表格
>[!TIP]
> HTML表格用于展示结构化数据：
> - 基本结构：`<table>`、`<tr>`(行)、`<td>`(单元格)、`<th>`(表头)
> - 常用属性：
>   - border：边框宽度
>   - cellspacing：单元格间距
>   - cellpadding：单元格内边距
>   - colspan/rowspan：合并单元格

基础示例：
::: details 点击查看基础示例
```html
<table border="1" cellspacing="0" cellpadding="5">
  <tr>
    <th>姓名</th>
    <th>年龄</th>
    <th>城市</th>
  </tr>
  <tr>
    <td>张三</td>
    <td>25</td>
    <td>北京</td>
  </tr>
  <tr>
    <td>李四</td>
    <td>30</td>
    <td>上海</td>
  </tr>
</table>
```


:::

高级用法：
>[!TIP]
> 1. **表格语义化标签**：
>    - `<caption>`：表格标题
>    - `<thead>`/`<tbody>`/`<tfoot>`：表格分组
>    - `<colgroup>`/`<col>`：列分组和样式控制
>
> 2. **可访问性**：
>    - 使用scope属性标识表头方向
>    - 为复杂表格添加描述

完整示例：
::: details 点击查看完整示例
```html
<table>
  <caption>员工信息表</caption>
  <colgroup>
    <col span="1" style="background-color:#f5f5f5">
    <col span="2">
  </colgroup>
  <thead>
    <tr>
      <th scope="col">姓名</th>
      <th scope="col">部门</th>
      <th scope="col">薪资</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>张三</td>
      <td>技术部</td>
      <td>¥15,000</td>
    </tr>
    <tr>
      <td>李四</td>
      <td>市场部</td>
      <td>¥12,000</td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td colspan="2">平均薪资</td>
      <td>¥13,500</td>
    </tr>
  </tfoot>
</table>
```
:::

最佳实践：
::: details 点击查看最佳实践
1. 避免使用表格布局，仅用于展示表格数据
2. 复杂表格应提供简明的描述或摘要
3. 响应式设计考虑：
```css
@media screen and (max-width: 600px) {
  table, thead, tbody, th, td, tr {
    display: block;
  }
  th {
    position: absolute;
    top: -9999px;
    left: -9999px;
  }
  td {
    position: relative;
    padding-left: 50%;
  }
  td:before {
    position: absolute;
    left: 6px;
    content: attr(data-label);
    font-weight: bold;
  }
}
```
:::

#### 2.2.7、多媒体标签
>[!TIP]
> 除img/audio/video外，HTML还支持以下多媒体标签：
> - `<iframe>`：嵌入其他网页
> - `<embed>`：嵌入插件内容
> - `<object>`：嵌入外部资源
> - `<canvas>`：绘制图形
> - `<svg>`：矢量图形

##### iframe嵌入
>[!TIP]
> iframe用于嵌入其他网页：
> - src：指定嵌入的URL
> - width/height：设置尺寸
> - frameborder：是否显示边框(0/1)
> - sandbox：安全限制
> - allowfullscreen：允许全屏

示例：
::: details 点击查看示例
```html
<iframe 
  src="https://example.com" 
  width="500" 
  height="300"
  frameborder="0"
  sandbox="allow-same-origin allow-scripts"
  allowfullscreen>
</iframe>
```
:::

##### embed标签
>[!TIP]
> 用于嵌入插件内容：
> - src：资源URL
> - type：MIME类型
> - width/height：尺寸

示例：
::: details 点击查看示例
```html
<embed 
  src="flash.swf" 
  type="application/x-shockwave-flash"
  width="400" 
  height="300">
```
:::

##### object标签
>[!TIP]
> 用于嵌入外部资源：
> - data：资源URL
> - type：MIME类型
> - 可包含param子标签传递参数

示例：
::: details 点击查看示例
```html
<object data="video.mp4" type="video/mp4" width="400" height="300">
  <param name="autoplay" value="true">
</object>
```
:::

##### Canvas绘图
>[!TIP]
> Canvas用于JavaScript绘图：
> - 使用JavaScript绘制图形
> - 支持路径、矩形、圆形、文本等
> - 可制作动画、游戏等

基础示例：
::: details 点击查看示例
```html
<canvas id="myCanvas" width="200" height="100"></canvas>
<script>
  const canvas = document.getElementById('myCanvas');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'red';
  ctx.fillRect(10, 10, 50, 50);
  ctx.strokeStyle = 'blue';
  ctx.strokeRect(30, 30, 50, 50);
</script>
```
:::

##### SVG矢量图形
>[!TIP]
> SVG用于绘制矢量图形：
> - 基于XML的矢量图形格式
> - 可缩放不失真
> - 支持动画和交互

示例：
::: details 点击查看示例
```html
<svg width="100" height="100">
  <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
</svg>
```
:::



## 二、HTML5

### 3.1、HTML5新特性
>[!TIP]
>1. 语义化标签
>2. 多媒体元素（`audio`、`video`）
>3. `Canvas`元素
>4. `Web`存储（`Storage`、`IndexDB`、`WebSQL`）
>5. 离线缓存
>6. 地理位置(`Geolocation API`)
>7. `Web Workers`
>8. 表单控件和验证
>9. 拖放 API (`Drag and Drop`)
>10. `WebSockets`


### 3.2、SEO优化
>[!TIP]
> HTML层面的SEO优化技巧：
> 1. **语义化标签**：
>    - 使用`<header>`、`<nav>`、`<main>`、`<article>`、`<section>`等语义化标签
>    - 合理使用`<h1>`-`<h6>`标题层级
> 
> 2. **元数据优化**：
>    - `<title>`标签：简洁明了，包含关键词
>    - `<meta name="description">`：准确描述页面内容
>    - `<meta name="keywords">`：适当使用关键词
>    - `<meta name="viewport">`：确保移动端友好
>
> 3. **内容优化**：
>    - 图片使用`alt`属性
>    - 链接使用描述性文本
>    - 避免隐藏内容
>
> 4. **结构化数据**：
>    - 使用Schema.org标记
>    - 添加JSON-LD格式的结构化数据

示例：
::: details 点击查看SEO优化示例
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>前端开发学习指南 | HTML基础教程</title>
  <meta name="description" content="全面的HTML基础教程，涵盖HTML5新特性及最佳实践">
  <meta name="keywords" content="HTML,HTML5,前端开发,web开发">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <header>
    <h1>HTML基础教程</h1>
    <nav>
      <ul>
        <li><a href="#html-basic">HTML基础</a></li>
        <li><a href="#html5">HTML5新特性</a></li>
      </ul>
    </nav>
  </header>
  <main>
    <article>
      <h2>HTML语义化标签</h2>
      <p>语义化标签有助于SEO和可访问性...</p>
      <img src="html-structure.png" alt="HTML语义化结构示意图">
    </article>
  </main>
</body>
</html>
```
:::

### 3.4、性能优化
>[!TIP]
> HTML性能优化技巧：
> 1. **减少DOM节点**：
>    - 简化HTML结构
>    - 避免深层嵌套
>
> 2. **资源加载优化**：
>    - 使用`defer`或`async`加载脚本
>    - 图片使用`loading="lazy"`延迟加载
>    - 使用`preload`预加载关键资源
>
> 3. **缓存优化**：
>    - 合理设置缓存头
>    - 使用manifest文件离线缓存
>
> 4. **代码优化**：
>    - 压缩HTML代码
>    - 删除注释和空白字符
>    - 避免使用`@import`引入CSS
>
> 5. **移动端优化**：
>    - 使用`viewport`元标签
>    - 避免使用过大的图片

示例：
::: details 点击查看性能优化示例
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- 预加载关键CSS -->
  <link rel="preload" href="styles.css" as="style">
  <!-- 异步加载非关键JS -->
  <script src="analytics.js" async></script>
</head>
<body>
  <!-- 简化DOM结构 -->
  <main class="content">
    <article>
      <h1>性能优化技巧</h1>
      <!-- 延迟加载非首屏图片 -->
      <img src="optimization.jpg" loading="lazy" alt="性能优化示意图">
    </article>
  </main>
  <!-- 延迟加载JS -->
  <script src="app.js" defer></script>
</body>
</html>
```
:::

