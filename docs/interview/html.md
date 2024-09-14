HTML面试题

## 1、什么是 HTML 语义化

> 根据内容的结构和含义（内容语义化），选择合适的 HTML 标签（代码语义化），以更好地表达内容的意义和层次。通俗来讲，就是用正确的标签做正确的事情。

**语义化的优点**

1）对机器友好：

- SEO 友好：语义化的标签让搜索引擎更容易理解网页内容，有利于搜索引擎优化。
- 提高可访问性：例如屏幕阅读器，可以通过语义化标签更好地理解和朗读网页内容，帮助视障用户浏览网页。
- 内容组织：语义化标签有助于搜索引擎爬虫和其他自动化工具更好地抓取和索引网页内容，甚至自动生成目录。

2）对开发者友好：

- 代码可读性：语义化标签增强了代码的可读性，开发者可以更清晰地理解网页结构和内容。
- 维护和协作：清晰的结构有助于团队协作和项目维护，使得开发者能够快速定位和修改代码。



**常见的语义化标签**

以下是一些常见的 HTML5 语义化标签及其用途：

- `<header></header>`：定义文档或部分的头部，通常包含导航、logo 等。
- `<nav></nav>`：定义导航链接部分，包含一组导航链接。
- `<section></section>`：定义文档中的一个区块，用于分隔内容。
- `<main></main>`：定义文档的主要内容，文档中主体部分的容器。
- `<article></article>`：定义独立的内容单元，例如文章、博客帖子、新闻等。
- `<aside></aside>`：定义与主内容相关的辅助内容，通常为侧边栏。



## 2、HTML 的 script 标签中 defer 和 async 的区别

共同点：

> defer 和 async 属性用于控制脚本的加载和执行 ，都是**异步加载外部的 JS 脚本文件**，**两者都不会阻塞 HTML 的解析**。

**主要区别**

1）执行顺序**：**defer 保证脚本按照在 HTML 中出现的顺序执行，一般是在 HTML 解析完成后才执行。 而 async 则是谁先下载完成谁先执行， async 可能会阻断解析以执行脚本。 

2）适用场景**：**async 适合 **不依赖于其他脚本 **且 **不被其他脚本依赖 **的独立模块，例如：计数器或广告加载。
而 defer 适用于需要在 HTML 完全解析后才能运行的 JS 脚本，尤其是依赖于 DOM 的 JS 脚本。它保证了脚本执行的顺序性和依赖关系，适合用于包含多个脚本的页面。



## 3、HTML5 有哪些更新

>  1）语义化更强的 HTML 元素：引入如 article、section、nav、header 和 footer 等元素，帮助创建结构更清晰、语义明确的网页，有利于 SEO 和内容的可访问性。 
>
>  2）表单控件增强：新增多种表单输入类型（如 email、date），直接支持数据验证，极大地提高了表单的易用性和功能性。 
>
>  3）音视频支持：原生支持音频（audio）和视频（video）内容，无需依赖外部插件，提高了多媒体内容的访问速度和兼容性。 
>
>  4）新的 API 支持：引入了多个强大的 API，如 Canvas、Geolocation、Drag and Drop，增强了网页的功能性，使其能支持更复杂的用户交互。 
>
>  5）Web 存储和 WebSockets：提供了更先进的数据存储方案（localStorage 和 sessionStorage）和实时通信能力（WebSockets），让网页应用更像传统的桌面应用。 
>
>  6）更好的连接性和离线支持：通过应用程序缓存（Application Cache）支持离线应用，使得 Web 应用能够更灵活地在没有网络的环境下使用。

详解：

##### 1、语义化标签

- header：定义文档的页眉（头部）。
- footer：定义文档或节的页脚（底部）。
- nav：定义导航链接的部分。
- article：定义独立的文章内容。
- section：定义文档中的节（section、区段）。
- aside：定义与页面主内容相关联但又相对独立的内容，如侧边栏。

##### 2、媒体标签

HTML5 提高了原生媒体支持，无需额外插件即可播放音频和视频： 1）Audio 标签：用于嵌入音频内容。

```html
<audio src="audio.mp3" controls autoplay loop></audio>
```

2）Video 标签：用于嵌入视频内容。

```html
<video src="video.mp4" poster="poster.jpg" controls></video>
```

3）Source 标签：在音视频标签内使用，为不同的浏览器提供多种格式的媒体文件。

```html
<video controls>
    <source src="video.mp4" type="video/mp4">
    <source src="video.webm" type="video/webm">
</video>
```

##### 3、表单增强

HTML5 对表单控件也进行了扩展，增加了多种类型的输入控件，使得收集和验证用户输入更加方便：

- type="email"、type="url"：自动验证用户输入格式。
- type="number"、type="range"：输入数字或范围。
- type="search"：优化的搜索框。
- type="color"：颜色选择器。
- placeholder：输入框为空时显示的提示文字。
- required、pattern：简化了数据验证过程。
- time：时分秒
- data：日期选择年月日
- datatime：时间和日期(目前只有Safari支持)
- datatime-local：日期时间控件
- week：周控件
- month：月控件

##### 4、新的 API

HTML5 引入了许多强大的 JavaScript API，支持更复杂的网页应用： 1）拖放API：允许用户拖放文件直接到网页中。

```html
<img draggable="true" />
```

2）Web Storage：提供 localStorage 和 sessionStorage，用于在客户端存储数据。 3）Canvas API：用于在网页上绘制图形。

```html
<canvas id="myCanvas" width="200" height="100"></canvas>
```

4）Geolocation API：允许网站访问用户的地理位置。

##### 5、进度条和度量器

progress：显示操作的进度（IE、Safari不支持）。 meter：显示磁盘使用情况的标量值。（IE、Safari不支持）

##### 6、更好的连接性

Offline Web Applications：HTML5 提供了应用程序缓存，允许网站在离线状态下运行。

##### 7、 WebSockets

提供了一种在单个连接上进行全双工通讯的方式，使得实时数据通讯（如聊天应用）更加有效和资源节约。

##### 8、 更丰富的图形和效果

CSS3 Integration：HTML5 与 CSS3 紧密集成，支持更复杂和动态的视觉效果。 SVG Integration：支持可缩放矢量图形 (SVG) 的直接嵌入。

##### 9、移除过时元素

比如纯表现的元素：basefont，big，center，font, s，strike，tt，u; 对可用性产生负面影响的元素：frame，frameset，noframes；



## 4、Canvas与SVG的区别

> Canvas 和 SVG **都是用于在网页上绘制图形的技术**，但它们在实现方式、性能和使用场景上有明显的区别。
>
> Canvas **是基于像素的即时绘制技术**，适合频繁更新和复杂动画。
>
> SVG **是基于矢量的图形格式**，适合需要无损缩放和高分辨率的静态图形。

#### 具体的区别

##### 1、渲染方式

- Canvas：逐像素渲染，适合实时动态绘制。
- SVG：基于矢量描述，适合静态和简单的动态绘制。

##### 2、性能

- Canvas：高性能，适合频繁更新的图形和复杂动画。
- SVG：在处理复杂图形时，性能可能会下降。

##### 3、交互和 DOM 集成

- Canvas：不具备内置的 DOM 交互，需要额外的事件处理代码。
- SVG：每个图形元素都是 DOM 节点，天然支持交互和事件处理。

##### 4、使用场景

- Canvas：游戏开发、实时数据可视化、复杂动画。
- SVG：图标、标志、图表、需要高分辨率和可缩放性的图形。

#### Canvas 的特点及优缺点

##### 特点

1）基于像素：Canvas 绘图是逐像素操作，类似于在位图画布上绘制。 

2）即刻渲染：一旦图形绘制完成，就无法直接访问或修改其内容，除非重新绘制。 

3）不具备DOM特性：绘制在 Canvas 上的图形不是 DOM 元素，不能通过 DOM 直接访问和修改。 

4）动态绘图：非常适合需要频繁更新和复杂图形操作的应用，如游戏、动态数据可视化等。

##### 优点

1）高性能：对于频繁变化和复杂的动画，Canvas 提供了较高的性能。 

2）细粒度控制：通过 JavaScript API，可以对每个像素进行精确控制，适用于精细的图形绘制。 

3）适合实时渲染：能高效处理大批量图形的实时渲染。

##### 缺点

1）无法缩放：因为是基于像素的图形，缩放时可能失真。 

2）无内置交互：需要额外编写代码来处理用户交互。 

3）复杂性：处理复杂图形时，代码量和复杂度较高。

```javascript
<canvas id="myCanvas" width="500" height="500"></canvas>
<script>
  const canvas = document.getElementById('myCanvas');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'green';
  ctx.fillRect(10, 10, 100, 100);
</script>js
```

#### SVG 的特点及优缺点

##### 特点

1）基于矢量：SVG 使用 XML 描述图形，可以缩放到任意大小而不失真。 

2）DOM 集成：SVG 元素是 DOM 节点，可以通过 CSS 和 JavaScript 进行样式和行为操作。 

3）静态和动态支持：既适用于静态图形，也支持简单动画和交互。 

4）高分辨率：图形可以在任何分辨率下保持清晰，不会因为放大或缩小而失真。

##### 优点

1）可缩放性：图形可以无损缩放，非常适合响应式设计和高分辨率显示。 

2）可访问性：SVG 图形是 DOM 的一部分，可以通过 CSS 和 JavaScript 进行操作，易于实现交互效果。 

3）高可读性：SVG 文件是 XML 格式，具有良好的可读性和可维护性。 

4）内置交互：SVG 中的每个图形元素都是可独立操作的 DOM 节点，支持事件监听和响应。

##### 缺点

1. 性能问题：在处理复杂动画和大量图形元素时，性能可能不如 Canvas。
2. 浏览器兼容性：某些复杂特性在不同浏览器上的支持情况不完全一致。
3. 复杂性：对于非常复杂的图形，SVG 文件的大小和复杂度可能会增加。

```html
<svg width="500" height="500">
  <rect x="10" y="10" width="100" height="100" fill="green"/>
</svg>
```



## 5、HTML 的 head 标签有什么作用？其中哪些标签必不可少？

::: tip 作用
1）定义文档标题：使用 `title` 标签定义页面在浏览器标签中的标题。

2）引入样式和脚本：使用 `link` 标签引入外部CSS文件，使用 `style` 标签定义内联 CSS，使用 `script` 标签引入和定义 JavaScript 脚本。 

3）提供文档元数据：使用 `meta` 标签提供关于文档的描述、作者、关键词、字符集等信息。 

4）链接图标：使用 `link` 标签定义网站图标（favicon）。

其中 `title` 标签和 `meta` 标签是必不可少的。
:::



## 6、HTML5 的离线储存怎么使用？它的工作原理是什么

>  HTML5 引入了一些强大的技术来支持离线存储，使得我们可以创建在无网络状态下也能正常工作的应用。这些技术包括本地存储（Local Storage）和离线存储（Application Cache）。 离线存储指的是：允许开发者指定哪些文件（如 HTML 页面、图像、JS 脚本和 CSS 样式表）应该被浏览器缓存，并能够在没有网络连接时访问它们。

#### 工作原理

1）缓存清单文件：首先，需要创建一个清单文件（通常以 .appcache 扩展名保存），在这个文件中列出要缓存的资源。这个文件必须声明正确的 MIME 类型，即 text/cache-manifest。 2）引用清单文件：在 HTML 页面的 `<html></html>` 标签中使用 manifest 属性引用这个清单文件。例如：

```html
<html manifest="example.appcache"></html>
```

3）结构清单文件：清单文件的结构通常如下：

```
# 2024-01-01 v1.0.0
CACHE:
/css/style.css
/js/app.js
/images/logo.png

NETWORK:
*

FALLBACK:
/ /offline.html
```

其中：

- CACHE：后面列出的文件在首次下载后会被浏览器缓存，即使用户离线也可以访问。
- NETWORK：指定的资源永远不会被缓存，总是从服务器请求，*表示默认情况下所有其他资源都需要网络连接。
- FALLBACK：提供备用页面的路径，如果用户请求的资源无法访问，将返回这个备用页面。

#### 如何更新缓存？

1）更新 manifest 文件 2）通过 JS 操作 3）清除浏览器缓存

#### 使用场景和优势

离线应用缓存最大的好处是提高了应用在离线状态时的可用性，同时也可以减少服务器的负载，因为许多资源都是从本地缓存加载的。这对于那些需要在网络不稳定的环境下工作的应用特别有用，例如移动应用或在偏远地区使用的服务。

#### 注意事项

1）确保更新缓存清单文件时，更改文件内的任何部分（如注释中的版本号），以触发浏览器重新下载文件。 

2）离线缓存可能导致开发过程中的资源更新问题。开发者在测试阶段需要频繁清理浏览器缓存，或使用版本控制技巧。

3）HTML5 的离线应用缓存功能在新的 HTML 规范中已被弃用，被更强大的 Service Workers 取代，后者提供了更精细的控制能力和缓存管理功能。

#### 扩展知识

现代 Web 应用开发趋向于使用 Service Workers 来实现离线功能和资源缓存，因为它们提供了更高的灵活性和控制能力。 Service Workers 允许你在用户的浏览器中运行一个脚本作为一种网络代理。这意味着 Service Workers 可以控制网络请求，缓存资源，以及在用户离线时提供网页功能。Service Workers 运行在 Web Worker 的上下文中，这意味着它们不依赖于具体的网页脚本，可以独立于网页背后运行。

##### 工作原理

Service Workers 的工作原理包括几个关键步骤： 1）注册：首先，在 JS 相关文件中注册 Service Worker。

```javascript
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
        console.log('Service Worker 注册成功 with scope:', registration.scope);
    }).catch(function(err) {
        console.log('Service Worker 注册失败:', err);
    });
}
```

2）安装：注册成功后，Service Worker 将进入安装阶段。在这个阶段，我们需要缓存一些静态资源，如 HTML 页面、CSS 文件、JS 文件和图像。

```javascript
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('v1').then(function(cache) {
            return cache.addAll([
                '/index.html',
                '/style.css',
                '/script.js'
            ]);
        })
    );
});
```

3）激活：安装后，Service Worker 需要激活。在激活阶段，还可以处理旧缓存的清理。

```javascript
self.addEventListener('activate', function(event) {
    var cacheWhitelist = ['v1'];

    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
```

4）拦截请求：一旦激活，Service Worker 将能够拦截所有对其作用域内资源的请求。这使得Service Worker可以返回缓存的资源或调用网络请求。

```
javascript复制代码self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});
```

##### 特点和优势

1）离线体验：用户在离线状态下依然可以访问网站和应用。 2）性能提升：通过缓存资源来加速页面加载时间，特别是在网络条件不佳的情况下。 3）背景同步：Service Workers可以在后台同步数据，即使用户已经离开了网页。 4）推送通知：即使在浏览器关闭的情况下也可以向用户发送推送通知。

##### 注意事项

1）Service Workers 只支持 HTTPS 的环境下使用，因为涉及到敏感的网络请求拦截。 2）开发和调试 Service Workers 可能会有些复杂，特别是在处理缓存策略和更新机制时。



## 7、iframe 有哪些优点和缺点？

>  `<iframe></iframe>` 是一个非常强大的 HTML 元素，允许我们在当前网页中嵌入另一个独立的网页。在集成第三方内容如视频、地图等方面非常有用。但是用了太多的 `<iframe></iframe>` 会影响页面加载速度，并对 SEO 和网页的可访问性带来挑战.



## 优点

1）内容隔离：将第三方内容（如视频、地图）嵌入页面，不影响主页面的样式和脚本。 

2）防止嵌入内容的恶意脚本：可以阻止嵌入内容与主页面直接交互，减少 XSS 风险。 

3）应用集成：方便集成支付网关、社交媒体等外部服务，无需重构页面。 

4）简化管理：适用于频繁更新的内容（如新闻、天气），集中管理更简单。

## 缺点

1）性能问题：每个 `<iframe></iframe>` 都需要独立的 HTTP 请求，会增加页面加载时间，会阻塞主页面的 onload 事件，特别是多个 `<iframe></iframe>` 时。 

2）SEO 影响：搜索引擎会忽略 `<iframe></iframe>` 中的内容，影响搜索排名。 

3）可访问性：对屏幕阅读器不友好，需要适当的标题和描述。 

4）布局和响应式设计：固定大小的 `<iframe></iframe>` 难以适应不同屏幕，需要额外的 CSS 调整。 

5）跨域问题：同源政策限制了与不同域的 `<iframe></iframe>` 内容交互，但绕过这些限制可能带来安全风险。