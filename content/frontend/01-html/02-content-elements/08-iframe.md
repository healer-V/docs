---
title: "页面嵌入 iframe"
tags:
  - HTML
  - iframe
  - 文档隔离
excerpt: "说明 iframe 如何嵌入独立文档，区分 src、srcdoc、名称和尺寸，解释源、沙箱与权限策略，并通过本地完整文件验证内容选择、脚本限制、错误地址与恢复。"
date: 2026-11-14
---

# 页面嵌入 iframe

`iframe` 在当前页面中嵌入另一份文档。嵌入结果可以看起来像页面上的一块区域，但子文档仍有自己的文档树和地址，不是把其中的标签直接复制到父文档的 `body`。

这种独立边界使页面能够显示其他文档，也引入地址、来源、权限和被嵌入方策略等条件。出现空白或动作受限时，需要先判断属于哪一种条件，不能一律通过放宽权限处理。

下面先说明独立文档的范围与命名，再区分内容来源、加载提示、源和沙箱，最后用两个本地文件逐项观察。

::: info 本篇的范围
本篇讲 `iframe` 的嵌入、命名、内容来源和隔离条件。完整 URL 解析见[超链接与资源路径](./04-links-paths.md)；脚本跨文档读取的完整规则属于 JavaScript 与浏览器安全主题；CSP、`X-Frame-Options` 等服务端响应策略只说明它们与嵌入的关系，不展开服务器配置。本例只嵌入本地可控文件，不测试第三方站点。
:::

## 一、嵌入的是一份独立文档

### 1. src 指向被嵌入的文档

下面是可放在 `body` 中的局部标记，假定 `child.html` 已在同一目录创建；完整文件会在独立示例中给出：

```html
<iframe src="child.html" title="补充说明" width="320" height="150"></iframe>
```

`src` 是被嵌入文档的地址，`width` 和 `height` 指定显示区域的尺寸。区域过小可以让子文档出现滚动，不会自动删去或重新组织子文档的内容。`iframe` 不是空元素，需要结束标签。

### 2. 子文档有自己的文档树

父子文档各自解析自己的 HTML。父页面的一条普通 CSS 规则不会仅因子文档出现在框内，就自动匹配子文档里的元素；同样，父页面中查找普通后代元素，也不等于遍历另一份文档的树。这项边界由 [iframe 的文档模型](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element)定义。

父文档的样式若要进入子文档，需要子文档自己引用样式，或在符合同源等条件时由脚本操作；这不是 `iframe` 自动继承的能力。判断页面结构时，应把框内内容当作另一份文档，而不是父文档中的一段普通子内容。

### 3. title 与 name 作用不同

`iframe` 的 `title` 为内嵌区域提供可理解的说明，帮助用户和辅助技术识别这里装的是什么。子文档自己的 `title` 则是那份文档的信息，不能依赖它自动替代父页面对嵌入区域的说明。

`name` 用于给可导航目标命名。例如，`name="preview"` 可供链接的 `target="preview"` 使用，让导航发生在指定框内。它不是面向用户的说明文字，也不会因为写了 `name` 就补齐合适的 `title`。相关属性职责见 [iframe 属性说明](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe)。

| 声明 | 面向谁 | 作用 | 不能替代 |
|------|--------|------|----------|
| `title` | 用户与辅助技术 | 说明这个嵌入区域是什么 | 子文档自己的标题 |
| `name` | 导航目标 | 给框一个可被 `target` 引用的名称 | 区域的可见说明 |
| 子文档 `<title>` | 该文档自身 | 标识子文档 | 父页面对嵌入区域的说明 |

::: tip title 要说明“这里装了什么”
嵌入区域需要让人知道它的用途，例如“地址引用的说明”“行内文档预览”。只写“iframe”或重复技术名词，不能帮助读者判断框内内容；`name` 即使看起来像可读单词，也不是给用户看的说明。
:::

## 二、内容来源与加载声明

### 1. srcdoc 直接声明一份 HTML 文档

`srcdoc` 把被嵌入的 HTML 写在属性值中。它存在且浏览器支持时，内容优先于 `src`；不能认为两份内容会拼在一起。若只想恢复地址指向的文档，应移除 `srcdoc`，而不只是修改 `src`。

```html
<iframe src="child.html"
  srcdoc="<!doctype html><html lang='zh-CN'><body><p>行内内容优先。</p></body></html>"
  title="行内文档" width="320" height="150"></iframe>
```

上面的框会显示 `srcdoc` 中的段落，`src` 仍保留但不用于决定当前显示内容。这个优先级解释了为什么“改了 `src` 却还是旧内容”不一定与缓存有关。

### 2. srcdoc 的值仍受外层属性边界约束

`srcdoc` 的值仍要遵守外层 HTML 属性的边界。外层使用双引号时，内层可以使用单引号，或按字符引用规则表达引号与 `&`。完整示例会给出一份带有自己标题和正文的内嵌文档。

这类文档的地址通常表现为 `about:srcdoc`；其中的相对 URL 在未另设 `base` 时，默认依据父文档的基准地址解析，不能把它当作自动拥有另一套磁盘目录的文件。使用不可信内容时，还需要与隔离和内容处理规则一起判断，不能把 `srcdoc` 当作安全过滤器。

### 3. loading 与 referrerpolicy 是不同提示

`loading="lazy"` 是延迟加载提示，`loading="eager"` 表示通常的即时加载方式。浏览器决定何时满足加载条件，因此不能根据写了 `lazy` 就保证某一滚动距离之前绝不产生请求。

`referrerpolicy` 决定请求中如何提供引用来源信息。这里的引用来源指请求头中的 **Referer** 等信息，用于说明请求从哪个页面发起；它与目标地址的 `src`、文档能否被嵌入并非同一配置。例如，`referrerpolicy="no-referrer"` 可避免在该嵌入请求中发送这类来源信息。

| 声明 | 控制什么 | 不控制什么 |
|------|----------|------------|
| `src` | 被嵌入文档的地址 | 是否允许脚本、能否被对方站点接受 |
| `srcdoc` | 直接写入的文档内容，优先于 `src` | 子文档的安全边界 |
| `loading` | 加载时机的提示 | 请求是否一定延后 |
| `referrerpolicy` | 请求中携带多少来源信息 | 页面的可见内容与权限 |
| `sandbox` | 子文档的能力限制 | 服务器是否允许自己被嵌入 |

`loading` 与 `referrerpolicy` 应按现行标准理解，不因为文章组织在 HTML 知识目录中，就都声称是最初 HTML5 新增。细节分别见 [iframe 的现行属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe)和 [Referrer-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy)。

## 三、源与脚本边界

### 1. 同源由协议、主机和端口共同决定

在普通 HTTP 或 HTTPS 地址中，**源**（origin）由协议、主机和有效端口共同确定。例如，`http://127.0.0.1:8000/parent.html` 与同端口的 `/child.html` 同源；把端口改为 8001，或把协议改为 HTTPS，就已经不同源。

**同源策略**限制不同源文档之间的脚本读取等操作。它不等于“跨源文档一律不能显示在 iframe 中”：能否显示、脚本能否读取以及能否使用某项功能，是需要分别判断的条件。[同源策略说明](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy)给出了这些边界。

### 2. 显示与脚本读取是不同问题

一个跨源页面可以正常出现在框中，同时父页面脚本不能读取它的 DOM。反过来，脚本读取受限也不表示页面没有加载。排查时应先分清是“资源没有请求到”“资源被拒绝嵌入”，还是“已显示但脚本不能访问”。

本地文件地址的来源处理不能简单当作 HTTP 同源规则。需要核对嵌入和权限行为时，使用下面完整步骤中的本地 HTTP 服务，避免把文件访问差异混入核心观察。

### 3. 不要用放宽同源来代替定位问题

若父页面脚本需要读取子文档，先确认两者是否本来就同源，以及这项读取是否确有必要。把子文档改成同源、添加 `allow-same-origin` 或移除沙箱，都会改变安全边界，不能作为“让报错消失”的通用步骤。

## 四、沙箱与功能许可

### 1. sandbox 先限制，再按需允许

`sandbox` 声明对内嵌文档增加的一组限制。`sandbox=""` 使用空许可列表，启用相应限制；`sandbox="allow-scripts"` 则只放开脚本执行这一项，而不是取消整个沙箱。

即使 `src` 文字上与父页面同源，沙箱未允许保留源时，子文档也会被当作特殊的不透明源处理。`allow-same-origin` 的含义是让文档保留原本的源，不是把任意外站变成父页面的源。它与 `allow-scripts` 是不同许可，不应盲目一起加入，尤其是同源且不可信的内容。[sandbox 的关键词与限制](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#attr-iframe-sandbox)应逐项对照所需能力。

| 写法 | 脚本 | 保留原源 | 典型用途 |
|------|------|----------|----------|
| 不写 `sandbox` | 按文档自身条件执行 | 是 | 完全信任的本地页面 |
| `sandbox=""` | 被限制 | 否 | 先以最小能力显示静态内容 |
| `sandbox="allow-scripts"` | 被允许 | 否 | 需要执行脚本，但不需要同源访问 |
| `sandbox="allow-scripts allow-same-origin"` | 被允许 | 是 | 仅用于确实需要且可信的内容 |

最后一行的组合会同时放开脚本和原源，不能因为示例能运行就默认采用。是否需要某项能力，应由框内文档的实际任务决定。

### 2. allow 是权限策略的入口

`allow` 是 **Permissions Policy**（权限策略）的入口，用于控制摄像头、定位等功能在内嵌文档中的可用范围。例如：

```html
<iframe src="child.html" title="补充说明" allow="geolocation 'none'"></iframe>
```

这项声明对该内嵌文档禁用定位功能。它不会替代 `sandbox`，也不会替用户批准浏览器权限；父页面或服务器施加的限制不能靠它任意放宽。当前例子只观察嵌入，不调用定位 API。功能许可的语法与继承关系见 [Permissions Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Permissions_Policy)。

### 3. 服务器可以拒绝被嵌入

被嵌入的服务器还可以通过响应头 [X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options)或 [CSP frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors)拒绝嵌入。响应头是服务器随 HTTP 响应发送的控制信息，和页面里修改一个属性不是同一操作。

外站明确拒绝时，应提供普通链接等合适入口；修改 `sandbox` 或 `allow` 无法替被嵌入方取消这项限制。排查空白框时，查看 Network 中目标文档的响应头，比反复调整父页面属性更直接。

::: warning 空白框不一定是权限不足
框内空白可能来自地址错误、资源 404、对方拒绝嵌入、沙箱限制或脚本错误。先看请求与响应，再决定是否调整权限；直接移除 `sandbox` 或添加 `allow-same-origin` 可能扩大攻击面，却没有解决真正原因。
:::

## 五、用两个本地文件观察边界

### 1. 创建父文档

新建空目录 `html-iframe`，在其中创建下面两个 UTF-8 文件。`parent.html` 包含普通地址、`srcdoc` 和空沙箱三个对照；它们只用于观察当前规则，不依赖在线地图、账号或其他文章工程：

::: details 查看 parent.html 完整内容

```html [parent.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>内嵌文档对照</title>
  <style>p { color: #125aa0; }</style>
</head>
<body>
  <h1>内嵌文档对照</h1>
  <p>这段文字属于父文档。</p>
  <p><a href="child.html#note" target="preview">在指定框内定位说明</a></p>
  <h2>使用地址</h2>
  <iframe id="external" src="child.html" name="preview"
    title="地址引用的说明" width="320" height="150"
    allow="geolocation 'none'" referrerpolicy="no-referrer"></iframe>
  <h2>直接声明内容</h2>
  <iframe id="inline" src="child.html"
    srcdoc="<!doctype html><html lang='zh-CN'><head><meta charset='utf-8'><title>行内文档</title></head><body><p>srcdoc 内容优先。</p></body></html>"
    title="直接写入的说明" width="320" height="150"></iframe>
  <h2>启用沙箱</h2>
  <iframe id="restricted" src="child.html" sandbox=""
    title="沙箱中的说明" width="320" height="150"></iframe>
</body>
</html>
```

:::

三个框分别验证不同条件：第一个带入地址、名称和权限声明；第二个同时给出 `src` 与 `srcdoc`；第三个只增加空沙箱。它们使用同一个子文档，便于比较“地址相同而行为不同”的原因。

### 2. 创建子文档

`child.html` 有自己的标题与正文。末尾一条脚本只把当前文档中指定段落的文字改为“脚本已执行。”，便于观察沙箱是否允许执行；不要求先掌握完整 JavaScript 语言：

::: details 查看 child.html 完整内容

```html [child.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>独立子文档</title>
</head>
<body>
  <h1>独立子文档</h1>
  <p id="note">这是子文档自己的说明。</p>
  <p id="state">脚本尚未执行。</p>
  <script>
    document.getElementById('state').textContent = '脚本已执行。';
  </script>
</body>
</html>
```

:::

`note` 段落为链接片段提供目标，`state` 段落显示脚本是否运行。脚本只修改当前子文档的文字，不访问父页面，因此可以把观察集中在沙箱是否允许脚本执行上。

### 3. 启动本地服务并观察

先安装 [Python 3.9 或更高版本](https://www.python.org/downloads/)。在当前目录打开终端：Windows 可在文件夹地址栏输入 `powershell`，macOS 可在终端输入 `cd ` 后拖入该目录，再回车。按系统选择相应命令启动本地静态服务：

```powershell
py --version
py -m http.server 8000 --bind 127.0.0.1
```

macOS 或命令名为 `python3` 的环境使用：

```bash
python3 --version
python3 -m http.server 8000 --bind 127.0.0.1
```

保持终端运行，打开 `http://127.0.0.1:8000/parent.html`。8000 已被占用时，同时将命令与访问地址中的端口改为 8001；结束观察后在自己的服务终端按 `Ctrl+C` 停止。静态服务仅用于本地预览，其使用边界见 [http.server](https://docs.python.org/3.13/library/http.server.html)。

普通框中应出现“独立子文档”及“脚本已执行。”；`srcdoc` 框显示直接声明的文字；沙箱框能显示静态正文，但脚本状态仍为初始值。父文档的普通段落为蓝色，子文档段落没有自动继承这条父页面 CSS。

| 观察对象 | 预期结果 | 说明 |
|----------|----------|------|
| 普通框 | 显示子文档，脚本文字更新 | 地址文件存在且未受沙箱限制 |
| `srcdoc` 框 | 显示“srcdoc 内容优先。” | `srcdoc` 优先于 `src` |
| 空沙箱框 | 显示静态正文，脚本未执行 | 空许可列表限制了脚本 |
| 父页面段落 | 蓝色 | 父文档自己的样式生效 |
| 子文档段落 | 未被父页面样式染色 | 子文档有独立文档树 |

点击“在指定框内定位说明”，导航应发生在命名为 `preview` 的框中，父页面地址不因此替换为子页面地址。这验证的是 `name` 与链接目标的关系，而不是把 `name` 当作区域说明。

### 4. 按最少许可修改并复测

将第三个框的 `sandbox=""` 改为 `sandbox="allow-scripts"`，保存并重新加载。该框的脚本文字可以更新，但这不表示表单、弹窗、顶层导航等限制都同时解除。关键词需要精确匹配；如果误写为 `allow-script`，它不会提供预期许可，应该修正为所需的有效关键词并重新加载，而不是直接移除沙箱。

如果只是改变 `src`，第二个框仍显示 `srcdoc` 内容，这不是浏览器缓存了旧文件。移除 `srcdoc` 后才会使用其 `src` 地址；如果地址也被改坏，会出现相应资源请求失败，应修复地址而不是增加权限。

在 Chrome 开发者工具中，可以从 Network 检查 `child.html` 的请求，从 Console 查看脚本受到沙箱限制的提示。正常框与沙箱框地址相同却行为不同，说明“资源存在”和“允许执行脚本”是不同条件。不要为了让提示消失就移除所有隔离。

### 5. 注入错误并恢复

| 注入的问题 | 观察 | 恢复 |
|------------|------|------|
| 把沙箱许可写成 `allow-script` | 脚本仍不执行，关键词无效 | 改为 `allow-scripts`，只在确需时保留 |
| 只改 `src` 而保留 `srcdoc` | 框内仍是直接声明的内容 | 移除 `srcdoc`，再核对地址 |
| 把 `src` 改为 `missing.html` | 请求失败，框内无子文档 | 对照 Network 修正路径和文件名 |
| 移除整段 `sandbox` 让脚本运行 | 脚本运行，但隔离条件一并消失 | 只添加实际需要的许可 |
| 用 `name` 代替 `title` | 导航目标可用，但区域缺少说明 | 同时提供有意义的 `title` |

恢复时逐项只改回一个条件，再重新加载对照；同时修改地址、`srcdoc` 和沙箱会让结果无法归因。

### 6. 验证记录

本例于 2026-11-14 在 macOS 的 Chrome 157.0.8103.79 中核对：普通嵌入、`srcdoc` 优先与空沙箱阻止脚本符合上述结果；只加入 `allow-scripts` 后脚本执行恢复。正常父子文件和修复版本通过 Nu 检查；把许可误写成 `allow-script` 的故意错误版本被报告为无效沙箱关键词。

此验证只覆盖本地可控文件和所列声明，没有测试外站登录、真实定位权限或第三方拒嵌响应。外部地址拒绝显示时，应分别核对地址、响应和被嵌入方策略，不能把本地示例成功泛化成任意站点都可嵌入。本次重写只补充正文层次、注释和观察项，两个完整文件的结构与脚本未变。
