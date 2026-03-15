---
title: "HTML标签"
category: "前端 · HTML"
tags:
  - HTML
excerpt: "标记语言的基本单位：HTML标签是构成HTML文档的基本单位 内容的容器：用于包裹和定义页面的内容 尖括号包围：使用<>符号包围标签名 语义化表示：不同的标签表示不同类型的内容 按功能分类：结构标签、文本标签、表单标签、多媒体标签等 按显示..."
---

# HTML标签

## 一、HTML标签概述

### 1.1 标签的基本概念

::: tip 标签定义
1. **标记语言的基本单位**：HTML标签是构成HTML文档的基本单位
2. **内容的容器**：用于包裹和定义页面的内容
3. **尖括号包围**：使用`<>`符号包围标签名
4. **语义化表示**：不同的标签表示不同类型的内容
:::

#### 标签的语法结构

```html
<!-- 完整标签结构 -->
<标签名 属性1="值1" 属性2="值2">内容</标签名>

<!-- 自闭合标签 -->
<标签名 属性1="值1" 属性2="值2">
<!-- 或 -->
<标签名 属性1="值1" 属性2="值2" />
```

### 1.2 标签的分类

::: info 标签分类方式
1. **按功能分类**：结构标签、文本标签、表单标签、多媒体标签等
2. **按显示方式分类**：块级元素、行内元素、行内块元素
3. **按是否闭合分类**：成对标签、自闭合标签
4. **按版本分类**：HTML4标签、HTML5新标签
:::

#### 按显示方式分类

```html
<!-- 块级元素：独占一行，可设置宽高 -->
<div>块级元素 - div</div>
<p>块级元素 - p</p>
<h1>块级元素 - h1</h1>

<!-- 行内元素：不独占一行，不可设置宽高 -->
<span>行内元素 - span</span>
<a href="#">行内元素 - a</a>
<strong>行内元素 - strong</strong>

<!-- 行内块元素：不独占一行，可设置宽高 -->
<img src="" alt="行内块元素 - img">
<input type="text"> <!-- 行内块元素 - input -->
<button>行内块元素 - button</button>
```

## 二、常用HTML标签详解

### 2.1 基础结构标签

::: tip 基础结构标签
1. **`<!DOCTYPE html>`**：文档类型声明
2. **`<html>`**：HTML文档的根元素
3. **`<head>`**：文档头部，包含元数据
4. **`<body>`**：文档主体，包含可见内容
:::

#### 基础结构示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>页面标题</title>
</head>
<body>
    <!-- 页面内容 -->
</body>
</html>
```

### 2.2 文本内容标签

::: info 文本标签分类
1. **标题标签**：h1-h6
2. **段落标签**：p
3. **强调标签**：strong, em, mark
4. **列表标签**：ul, ol, li, dl, dt, dd
5. **引用标签**：blockquote, q
6. **其他文本标签**：br, hr, pre, code
:::

#### 标题标签

```html
<h1>一级标题</h1> <!-- 最重要的标题 -->
<h2>二级标题</h2>
<h3>三级标题</h3>
<h4>四级标题</h4>
<h5>五级标题</h5>
<h6>六级标题</h6> <!-- 最不重要的标题 -->
```

#### 段落和文本格式化

```html
<p>这是一个段落。</p>
<p>这是另一个段落，包含<strong>加粗</strong>和<em>斜体</em>文本。</p>
<p>这是<mark>高亮</mark>的文本。</p>
<p>这是<del>删除线</del>文本和<ins>下划线</ins>文本。</p>
<p>这是<small>小号</small>文本和<sub>下标</sub>/<sup>上标</sup>文本。</p>
```

#### 列表标签

::: details 点击查看列表标签示例
```html
<!-- 无序列表 -->
<ul>
    <li>列表项1</li>
    <li>列表项2</li>
    <li>列表项3</li>
</ul>

<!-- 有序列表 -->
<ol>
    <li>第一项</li>
    <li>第二项</li>
    <li>第三项</li>
</ol>

<!-- 有序列表的type属性 -->
<ol type="1"> <!-- 数字（默认） -->
    <li>项目1</li>
    <li>项目2</li>
</ol>

<ol type="A"> <!-- 大写字母 -->
    <li>项目1</li>
    <li>项目2</li>
</ol>

<ol type="a"> <!-- 小写字母 -->
    <li>项目1</li>
    <li>项目2</li>
</ol>

<ol type="I"> <!-- 大写罗马数字 -->
    <li>项目1</li>
    <li>项目2</li>
</ol>

<!-- 定义列表 -->
<dl>
    <dt>术语1</dt>
    <dd>术语1的定义</dd>
    <dt>术语2</dt>
    <dd>术语2的定义</dd>
    <dd>术语2的另一个定义</dd>
</dl>
```
:::

#### 引用和特殊文本

```html
<!-- 长引用 -->
<blockquote cite="https://example.com">
    这是一段长引用的内容。长引用通常会在页面上缩进显示，用于引用较长的文本段落。
</blockquote>

<!-- 短引用 -->
<p>正如莎士比亚所说：<q>生存还是毁灭，这是一个问题。</q></p>

<!-- 预格式化文本 -->
<pre>
    这是预格式化文本，
        保留了原始的
    空格和换行。
</pre>

<!-- 代码块 -->
<code>const greeting = "Hello, World!";</code>

<!-- 代码块（多行） -->
<pre><code>function sayHello() {
    console.log("Hello, World!");
}

sayHello();</code></pre>

<!-- 水平线和换行 -->
<p>这是第一行<br>这是第二行</p>
<hr>
<p>分隔线后的内容</p>
```

### 2.3 链接和图像标签

::: tip 链接和图像标签
1. **`<a>`**：锚点标签，用于创建链接
2. **`<img>`**：图像标签，用于插入图片
3. **`<map>`** 和 **`<area>`**：图像映射，用于创建可点击的区域
:::

#### 链接标签

```html
<!-- 基本链接 -->
<a href="https://example.com">访问示例网站</a>

<!-- 打开新窗口 -->
<a href="https://example.com" target="_blank">在新窗口打开</a>

<!-- 下载链接 -->
<a href="document.pdf" download="我的文档.pdf">下载PDF文档</a>

<!-- 邮件链接 -->
<a href="mailto:example@example.com">发送邮件</a>

<!-- 电话链接 -->
<a href="tel:+1234567890">拨打电话</a>

<!-- 页面内锚点 -->
<a href="#section1">跳转到第一部分</a>

<!-- 锚点目标 -->
<h2 id="section1">第一部分</h2>
```

#### 图像标签

::: details 点击查看图像标签示例
```html
<!-- 基本图像 -->
<img src="image.jpg" alt="图片描述">

<!-- 设置尺寸 -->
<img src="image.jpg" alt="图片描述" width="300" height="200">

<!-- 响应式图像 -->
<img src="image.jpg" alt="图片描述" style="max-width: 100%; height: auto;">

<!-- 图像标题 -->
<figure>
    <img src="image.jpg" alt="图片描述">
    <figcaption>图片标题</figcaption>
</figure>

<!-- 图像映射 -->
<img src="map.jpg" alt="地图" usemap="#map">

<map name="map">
    <area shape="rect" coords="0,0,82,126" alt="区域1" href="area1.html">
    <area shape="circle" coords="90,58,3" alt="区域2" href="area2.html">
    <area shape="poly" coords="124,59,119,96,150,96" alt="区域3" href="area3.html">
</map>

<!-- 加载失败的替代方案 -->
<img src="image.jpg" alt="图片描述" onerror="this.src='fallback.jpg'">

<!-- 延迟加载 -->
<img src="image.jpg" alt="图片描述" loading="lazy">
```
:::

### 2.4 表格标签

::: info 表格标签
1. **`<table>`**：表格容器
2. **`<tr>`**：表格行
3. **`<td>`**：表格数据单元格
4. **`<th>`**：表格标题单元格
5. **`<thead>`**：表格头部
6. **`<tbody>`**：表格主体
7. **`<tfoot>`**：表格底部
8. **`<caption>`**：表格标题
:::

#### 基本表格结构

```html
<table border="1">
    <caption>学生成绩表</caption>
    <thead>
        <tr>
            <th>姓名</th>
            <th>语文</th>
            <th>数学</th>
            <th>英语</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>张三</td>
            <td>85</td>
            <td>90</td>
            <td>88</td>
        </tr>
        <tr>
            <td>李四</td>
            <td>92</td>
            <td>88</td>
            <td>90</td>
        </tr>
    </tbody>
    <tfoot>
        <tr>
            <td>平均分</td>
            <td>88.5</td>
            <td>89</td>
            <td>89</td>
        </tr>
    </tfoot>
</table>
```

#### 表格的高级特性

::: details 点击查看表格高级特性示例
```html
<!-- 单元格合并 -->
<table border="1">
    <tr>
        <th colspan="3">合并列标题</th>
    </tr>
    <tr>
        <th rowspan="2">合并行标题</th>
        <td>数据1</td>
        <td>数据2</td>
    </tr>
    <tr>
        <td>数据3</td>
        <td>数据4</td>
    </tr>
</table>

<!-- 嵌套表格 -->
<table border="1">
    <tr>
        <td>普通单元格</td>
        <td>
            <table border="1">
                <tr>
                    <td>嵌套表格1</td>
                    <td>嵌套表格2</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<!-- 表格分组和样式 -->
<table border="1" cellpadding="5" cellspacing="0">
    <colgroup>
        <col span="1" style="background-color: #f2f2f2;">
        <col span="3" style="background-color: #e6e6e6;">
    </colgroup>
    <thead>
        <tr>
            <th>产品</th>
            <th>价格</th>
            <th>数量</th>
            <th>总计</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>产品A</td>
            <td>¥100</td>
            <td>2</td>
            <td>¥200</td>
        </tr>
        <tr>
            <td>产品B</td>
            <td>¥150</td>
            <td>1</td>
            <td>¥150</td>
        </tr>
    </tbody>
</table>
```
:::

### 2.5 表单标签

::: tip 表单标签
1. **`<form>`**：表单容器
2. **`<input>`**：输入控件，支持多种类型
3. **`<textarea>`**：多行文本输入框
4. **`<select>`** 和 **`<option>`**：下拉选择框
5. **`<button>`**：按钮
6. **`<label>`**：表单元素标签
7. **`<fieldset>`** 和 **`<legend>`**：表单分组
:::

#### 基本表单结构

```html
<form action="/submit" method="post">
    <div>
        <label for="username">用户名：</label>
        <input type="text" id="username" name="username" required>
    </div>
    
    <div>
        <label for="password">密码：</label>
        <input type="password" id="password" name="password" required>
    </div>
    
    <div>
        <label>
            <input type="radio" name="gender" value="male" checked> 男
        </label>
        <label>
            <input type="radio" name="gender" value="female"> 女
        </label>
    </div>
    
    <div>
        <label>
            <input type="checkbox" name="hobby" value="reading"> 阅读
        </label>
        <label>
            <input type="checkbox" name="hobby" value="sports"> 运动
        </label>
    </div>
    
    <div>
        <label for="city">城市：</label>
        <select id="city" name="city">
            <option value="">请选择</option>
            <option value="beijing">北京</option>
            <option value="shanghai">上海</option>
            <option value="guangzhou">广州</option>
        </select>
    </div>
    
    <div>
        <label for="message">留言：</label>
        <textarea id="message" name="message" rows="4" cols="50"></textarea>
    </div>
    
    <button type="submit">提交</button>
    <button type="reset">重置</button>
    <button type="button">普通按钮</button>
</form>
```

#### 输入控件类型

::: details 点击查看输入控件类型示例
```html
<!-- 文本输入 -->
<input type="text" placeholder="请输入文本">

<!-- 密码输入 -->
<input type="password" placeholder="请输入密码">

<!-- 数字输入 -->
<input type="number" min="0" max="100" step="1" value="50">

<!-- 日期和时间 -->
<input type="date">
<input type="time">
<input type="datetime-local">
<input type="month">
<input type="week">

<!-- 选择控件 -->
<input type="checkbox" id="checkbox1">
<label for="checkbox1">复选框</label>

<input type="radio" name="radioGroup" id="radio1" value="option1">
<label for="radio1">选项1</label>

<!-- 文件上传 -->
<input type="file" id="file1">
<input type="file" id="file2" multiple>
<input type="file" id="file3" accept="image/*">

<!-- 隐藏字段 -->
<input type="hidden" name="csrf_token" value="abc123">

<!-- 搜索框 -->
<input type="search" placeholder="搜索...">

<!-- 邮箱和URL -->
<input type="email" placeholder="请输入邮箱">
<input type="url" placeholder="请输入网址">

<!-- 电话号码 -->
<input type="tel" placeholder="请输入电话号码">

<!-- 颜色选择器 -->
<input type="color" value="#ff0000">

<!-- 滑块 -->
<input type="range" min="0" max="100" value="50">
```
:::

### 2.6 HTML5语义化标签

::: info HTML5语义化标签
1. **页面结构标签**：header, nav, main, aside, footer
2. **内容分组标签**：section, article, figure, figcaption
3. **文本级语义标签**：mark, time, address, meter, progress
4. **交互标签**：details, summary, dialog
:::

#### 语义化页面结构

```html
<!-- 完整的语义化页面结构 -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>语义化HTML5页面</title>
</head>
<body>
    <!-- 页面头部 -->
    <header>
        <div class="logo">网站Logo</div>
        <nav>
            <ul>
                <li><a href="#">首页</a></li>
                <li><a href="#">关于我们</a></li>
                <li><a href="#">产品中心</a></li>
                <li><a href="#">联系我们</a></li>
            </ul>
        </nav>
    </header>
    
    <!-- 主要内容 -->
    <main>
        <!-- 侧边栏 -->
        <aside>
            <h3>热门文章</h3>
            <ul>
                <li><a href="#">文章标题1</a></li>
                <li><a href="#">文章标题2</a></li>
                <li><a href="#">文章标题3</a></li>
            </ul>
        </aside>
        
        <!-- 内容区域 -->
        <section>
            <h2>文章列表</h2>
            
            <!-- 文章1 -->
            <article>
                <header>
                    <h3>文章标题1</h3>
                    <p><time datetime="2024-01-15">2024年1月15日</time> 作者：张三</p>
                </header>
                <p>文章内容摘要...</p>
                <a href="#">阅读全文</a>
            </article>
            
            <!-- 文章2 -->
            <article>
                <header>
                    <h3>文章标题2</h3>
                    <p><time datetime="2024-01-10">2024年1月10日</time> 作者：李四</p>
                </header>
                <p>文章内容摘要...</p>
                <a href="#">阅读全文</a>
            </article>
        </section>
    </main>
    
    <!-- 页面底部 -->
    <footer>
        <p>&copy; 2024 网站名称. 保留所有权利.</p>
        <address>联系地址：北京市朝阳区xxx街道xxx号</address>
    </footer>
</body>
</html>
```

#### 交互语义标签

```html
<!-- 可折叠内容 -->
<details>
    <summary>点击展开详情</summary>
    <p>这是展开后的详细内容。可以包含任意HTML元素。</p>
    <ul>
        <li>列表项1</li>
        <li>列表项2</li>
        <li>列表项3</li>
    </ul>
</details>

<!-- 进度条 -->
<progress value="70" max="100"></progress>
<span>70%</span>

<!-- 度量仪表 -->
<p>内存使用率：<meter value="0.7" min="0" max="1">70%</meter></p>
<p>磁盘空间：<meter value="65" min="0" max="100">65%</meter></p>

<!-- 对话框 -->
<button onclick="document.getElementById('myDialog').showModal()">打开对话框</button>

<dialog id="myDialog">
    <h3>对话框标题</h3>
    <p>这是对话框内容。</p>
    <button onclick="document.getElementById('myDialog').close()">关闭</button>
</dialog>

<!-- 高亮文本 -->
<p>这是一段包含<mark>高亮</mark>的文本。</p>

<!-- 时间标记 -->
<time datetime="2024-01-01">2024年1月1日</time>
<time datetime="2024-01-01T12:00:00">2024年1月1日 12:00</time>
```

## 三、标签的使用规范

### 3.1 语义化使用原则

::: tip 语义化原则
1. **根据内容选择标签**：根据内容的语义选择合适的标签
2. **避免滥用div和span**：不要过度使用无语义的标签
3. **正确嵌套**：标签嵌套要符合HTML规范
4. **保持标签的单一用途**：一个标签应该只表示一种类型的内容
:::

#### 语义化与非语义化对比

```html
<!-- 非语义化写法 -->
<div id="header">
    <div id="nav">
        <div class="nav-item">首页</div>
        <div class="nav-item">关于我们</div>
    </div>
</div>
<div id="content">
    <div class="article">
        <div class="title">文章标题</div>
        <div class="text">文章内容...</div>
    </div>
</div>

<!-- 语义化写法 -->
<header>
    <nav>
        <ul>
            <li><a href="#">首页</a></li>
            <li><a href="#">关于我们</a></li>
        </ul>
    </nav>
</header>
<main>
    <article>
        <h1>文章标题</h1>
        <p>文章内容...</p>
    </article>
</main>
```

### 3.2 标签嵌套规则

::: info 嵌套规则
1. **块级元素可以包含行内元素**：如div可以包含span
2. **块级元素通常包含块级元素**：如div可以包含p
3. **行内元素只能包含行内元素**：如span不能包含div
4. **特殊规则**：
   - p标签不能包含块级元素
   - li标签必须在ul或ol内
   - tr标签必须在table、thead、tbody或tfoot内
:::

#### 正确与错误的嵌套示例

```html
<!-- 正确的嵌套 -->
<div>
    <h2>标题</h2>
    <p>这是一个段落，包含<span>行内元素</span>。</p>
    <ul>
        <li>列表项1</li>
        <li>列表项2</li>
    </ul>
</div>

<!-- 错误的嵌套 -->
<p>
    段落内容
    <div>错误：p标签不能包含div</div>
</p>

<span>
    行内元素
    <div>错误：span不能包含div</div>
</span>

<li>错误：li必须在ul或ol内</li>

<tr>错误：tr必须在table内</tr>
```

## 四、标签的最佳实践

### 4.1 性能优化建议

::: tip 性能优化
1. **减少标签数量**：尽量减少不必要的标签嵌套
2. **避免空标签**：移除没有内容和作用的空标签
3. **合理使用语义化标签**：语义化标签不会影响性能，反而有利于SEO
4. **避免内联样式和脚本**：将CSS和JavaScript放在外部文件中
:::

### 4.2 可访问性建议

::: info 可访问性建议
1. **使用正确的标题层级**：h1-h6应该按顺序使用，不要跳过
2. **为图片添加alt属性**：提供替代文本，帮助屏幕阅读器理解图片内容
3. **使用label标签**：为表单元素添加关联的标签，提高可访问性
4. **确保链接有描述性文本**：避免使用"点击这里"这样的链接文本
5. **使用ARIA属性**：适当使用ARIA角色和属性增强可访问性
:::

### 4.3 SEO优化建议

::: tip SEO优化
1. **合理使用h1标签**：每个页面应该只有一个h1标签，包含页面的主要关键词
2. **语义化HTML结构**：搜索引擎更喜欢语义化的HTML结构
3. **优化图片alt属性**：包含关键词的alt属性有助于图片搜索优化
4. **使用描述性的链接文本**：链接文本应该准确描述链接目标的内容
5. **避免隐藏内容**：不要使用CSS隐藏重要内容，可能被视为作弊
:::

## 五、总结

HTML标签是构建Web页面的基础，正确使用标签对于创建结构清晰、语义化、可访问的网页至关重要。随着HTML5的发展，语义化标签的引入使得网页结构更加清晰，有利于搜索引擎优化和可访问性。

在实际开发中，我们应该根据内容的语义选择合适的标签，遵循HTML规范进行标签嵌套，同时考虑性能优化、可访问性和SEO等因素，这样才能创建出高质量的Web页面。

学习HTML标签的过程中，要注重实践，多编写代码，同时关注最新的Web标准和最佳实践，不断提升自己的Web开发技能。