# HTML概述

## 一、HTML的基本概念

### 1.1 HTML是什么

::: tip HTML定义
1. **HyperText Markup Language**：超文本标记语言
2. **Web页面的结构基础**：定义网页的结构和内容
3. **非编程语言**：是一种标记语言，不是编程语言
4. **与CSS和JavaScript协作**：共同构成现代Web开发的基础
:::

#### 基本语法

```html
<!DOCTYPE html>
<html>
<head>
    <title>页面标题</title>
</head>
<body>
    <h1>主标题</h1>
    <p>段落内容</p>
</body>
</html>
```

### 1.2 HTML的发展历史

::: info HTML版本发展
1. **HTML 1.0**：1993年，第一个HTML规范
2. **HTML 2.0**：1995年，标准化的HTML规范
3. **HTML 3.2**：1997年，引入表格、列表等元素
4. **HTML 4.01**：1999年，更完善的规范
5. **XHTML 1.0**：2000年，结合XML的严格语法
6. **HTML5**：2014年，现代Web标准，增加了语义化标签和API
:::

### 1.3 HTML的文档结构

::: tip 文档结构组成
1. **DOCTYPE声明**：定义文档类型
2. **html根元素**：整个HTML文档的根
3. **head头部**：包含元数据信息
4. **body主体**：包含可见的页面内容
:::

#### 完整示例

::: details 点击查看完整HTML文档结构
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <!-- 字符编码 -->
    <meta charset="UTF-8">
    <!-- 视口设置 -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- 页面标题 -->
    <title>HTML文档示例</title>
    <!-- 外部样式表 -->
    <link rel="stylesheet" href="styles.css">
    <!-- 内部脚本 -->
    <script defer src="script.js"></script>
</head>
<body>
    <!-- 页面头部 -->
    <header>
        <h1>网站标题</h1>
        <nav>
            <ul>
                <li><a href="#">首页</a></li>
                <li><a href="#">关于</a></li>
                <li><a href="#">联系</a></li>
            </ul>
        </nav>
    </header>

    <!-- 主要内容 -->
    <main>
        <section>
            <h2>文章标题</h2>
            <p>这是一段文章内容...</p>
        </section>
    </main>

    <!-- 页面底部 -->
    <footer>
        <p>&copy; 2024 网站名称</p>
    </footer>
</body>
</html>
```
:::

### 1.4 HTML的核心特性

::: tip 核心特性
1. **标记语言**：使用标签来标记内容
2. **语义化**：使用有意义的标签描述内容结构
3. **跨平台**：在任何支持HTML的浏览器中都能运行
4. **可扩展**：可以与CSS和JavaScript结合扩展功能
5. **开放性**：W3C标准，免费使用
:::

## 二、HTML的基本语法

### 2.1 标签（Tags）

::: info 标签特点
1. **尖括号包围**：使用`<>`包围标签名
2. **开始和结束标签**：大多数标签成对出现
3. **自闭合标签**：有些标签可以自闭合
4. **嵌套关系**：标签可以嵌套，但不能交叉
:::

#### 标签类型

```html
<!-- 成对标签 -->
<div>内容</div>
<p>段落</p>
<h1>标题</h1>

<!-- 自闭合标签 -->
<img src="image.jpg" alt="图片">
<input type="text" value="输入框">
<br>
<hr>
```

### 2.2 属性（Attributes）

::: tip 属性特点
1. **在开始标签中**：属性写在开始标签内
2. **键值对形式**：属性名="属性值"
3. **多个属性**：用空格分隔多个属性
4. **通用属性**：大多数标签都支持的属性
:::

#### 属性示例

```html
<!-- 带属性的标签示例 -->
<a href="https://example.com" target="_blank" title="示例链接">链接文本</a>
<img src="logo.png" alt="网站logo" width="200" height="100">
<div id="main" class="container" style="color: red;">内容</div>
```

### 2.3 注释（Comments）

::: info 注释特点
1. **语法**：使用`<!-- 注释内容 -->`
2. **不可见**：浏览器不会显示注释内容
3. **用于说明**：帮助开发者理解代码
4. **可以注释代码**：临时禁用某些代码
:::

#### 注释示例

```html
<!-- 这是一个HTML注释 -->
<!-- 页面头部开始 -->
<header>
    <h1>网站标题</h1>
</header>
<!-- 页面头部结束 -->

<!-- 
    这是一个多行注释
    可以包含更多说明信息
 -->

<!-- 临时注释掉的代码
<p>这段内容暂时不显示</p>
 -->
```

## 三、HTML5的新特性

### 3.1 语义化标签

::: tip 语义化标签
1. **更清晰的结构**：使用有意义的标签名
2. **更好的可访问性**：有助于屏幕阅读器等辅助技术
3. **更好的SEO**：有利于搜索引擎理解内容结构
4. **代码可读性**：更容易理解和维护
:::

#### 常用语义化标签

```html
<!-- 页面结构标签 -->
<header>页面头部</header>
<nav>导航栏</nav>
<main>主要内容</main>
<aside>侧边栏</aside>
<footer>页面底部</footer>

<!-- 内容分组标签 -->
<section>内容区块</section>
<article>独立内容</article>
<figure>图片内容</figure>
<figcaption>图片说明</figcaption>

<!-- 文本级标签 -->
<mark>高亮文本</mark>
<time datetime="2024-01-01">2024年1月1日</time>
<address>联系信息</address>
```

### 3.2 HTML5 API

::: info HTML5 API
1. **Canvas绘图**：用于动态绘制图形
2. **Web Storage**：本地存储数据
3. **Geolocation**：获取地理位置
4. **Web Workers**：后台线程处理
5. **WebSocket**：实时通信
6. **Media API**：音频和视频处理
:::

#### API示例

::: details 点击查看HTML5 API示例
```html
<!-- Canvas示例 -->
<canvas id="myCanvas" width="200" height="100"></canvas>
<script>
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(10, 10, 150, 80);
</script>

<!-- Web Storage示例 -->
<script>
    // 本地存储
    localStorage.setItem('username', '张三');
    const name = localStorage.getItem('username');
    
    // 会话存储
    sessionStorage.setItem('token', 'abc123');
    const token = sessionStorage.getItem('token');
</script>

<!-- Geolocation示例 -->
<script>
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            console.log('纬度:', position.coords.latitude);
            console.log('经度:', position.coords.longitude);
        });
    }
</script>
```
:::

### 3.3 表单增强

::: tip 表单新特性
1. **新的输入类型**：email、tel、number等
2. **表单验证**：内置的表单验证功能
3. **占位符文本**：placeholder属性
4. **自动聚焦**：autofocus属性
5. **表单控制**：required、pattern等属性
:::

#### 表单示例

```html
<!-- 现代表单示例 -->
<form action="/submit" method="post">
    <div>
        <label for="email">邮箱：</label>
        <input type="email" id="email" name="email" required placeholder="请输入邮箱地址">
    </div>
    
    <div>
        <label for="phone">电话：</label>
        <input type="tel" id="phone" name="phone" pattern="[0-9]{11}" placeholder="请输入11位手机号">
    </div>
    
    <div>
        <label for="age">年龄：</label>
        <input type="number" id="age" name="age" min="0" max="150" value="18">
    </div>
    
    <div>
        <label for="website">网站：</label>
        <input type="url" id="website" name="website" placeholder="https://">
    </div>
    
    <div>
        <label for="message">留言：</label>
        <textarea id="message" name="message" rows="4" cols="50" placeholder="请输入留言内容"></textarea>
    </div>
    
    <button type="submit">提交</button>
    <button type="reset">重置</button>
</form>
```

## 四、HTML的最佳实践

### 4.1 代码规范

::: tip 代码规范建议
1. **使用小写标签**：HTML标签和属性使用小写
2. **正确嵌套**：确保标签正确嵌套，不交叉
3. **关闭标签**：所有标签都要正确关闭
4. **使用引号**：属性值使用双引号包围
5. **缩进一致**：使用统一的缩进（2空格或4空格）
6. **文件命名**：使用小写字母和连字符
:::

### 4.2 性能优化

::: info 性能优化建议
1. **减少HTTP请求**：合并文件，使用CSS Sprites等
2. **优化资源**：压缩HTML、CSS、JavaScript文件
3. **合理使用缓存**：设置适当的缓存策略
4. **延迟加载**：使用lazyload属性延迟加载图片
5. **减少重绘重排**：避免频繁操作DOM
6. **使用CDN**：内容分发网络加速资源加载
:::

### 4.3 可访问性（Accessibility）

::: tip 可访问性建议
1. **使用语义化标签**：正确使用HTML5语义化标签
2. **添加alt属性**：为图片添加替代文本
3. **合理的标题层级**：正确使用h1-h6标签
4. **键盘导航**：确保所有功能都可以通过键盘访问
5. **ARIA属性**：适当使用ARIA角色和属性
6. **颜色对比度**：确保文本与背景的对比度足够
:::

## 五、HTML学习资源

### 5.1 官方文档

::: info 官方资源
1. **MDN Web Docs**：最权威的Web开发文档
   - [HTML参考](https://developer.mozilla.org/zh-CN/docs/Web/HTML)
2. **W3C HTML标准**：HTML的官方标准
   - [HTML Standard](https://html.spec.whatwg.org/)
3. **W3Schools**：适合初学者的教程
   - [HTML教程](https://www.w3schools.com/html/)
:::

### 5.2 学习路径

::: tip 学习建议
1. **基础阶段**：学习HTML基本语法和常用标签
2. **进阶阶段**：学习HTML5新特性和语义化
3. **实践阶段**：构建完整的HTML页面
4. **整合阶段**：结合CSS和JavaScript开发完整网站
5. **优化阶段**：学习性能优化和最佳实践
:::

## 六、总结

HTML是构建Web页面的基础，是每一个Web开发者必须掌握的核心技术。通过学习HTML，我们可以创建结构化、语义化、可访问的Web页面，为用户提供良好的浏览体验。随着HTML5的发展，它不仅是一种标记语言，还提供了丰富的API和功能，使得Web应用开发更加灵活和强大。

学习HTML的过程中，要注重实践，多编写代码，同时关注最新的Web标准和最佳实践，不断提升自己的Web开发技能。