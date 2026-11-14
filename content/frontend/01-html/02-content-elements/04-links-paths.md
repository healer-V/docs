---
title: "超链接与资源路径"
tags:
  - HTML
  - 超链接
  - URL
excerpt: "从 URL 与文档基准地址解释链接和资源路径，区分当前目录、父目录与站点根路径，并用独立文件核对片段导航、键盘操作、base、打开关系和下载的适用边界。"
date: 2026-11-14
---

# 超链接与资源路径

`a` 元素带有 `href` 时表示超链接。`href` 声明目标地址，元素中的文字或图片描述目标，浏览器负责按用户操作执行导航。例如，下面是可放在 `body` 中的局部内容：

```html
<a href="notes.html">阅读说明</a>
```

`notes.html` 不是从任意文件夹中搜索同名文件，而是根据当前文档的**基准地址**解析。链接、图片、样式表等资源声明都需要正确定位地址；文件确实存在，不代表当前写法指向了它。

下面先拆开 URL 与基准地址，再说明相对路径、片段、打开关系和下载条件，最后用两个页面和一个文本文件完成验证。

::: info 本篇的范围
本篇讲链接与资源地址的基础解析，以及 `a` 的导航相关属性。HTTP 协议、同源安全体系、前端路由和完整 URL 标准不在本篇展开；`head` 中样式、脚本的接入见[HTML 文档头部与资源引用](../01-foundation/09-head-resources.md)；图片资源与替代文本见[图片](./05-images.md)；按钮的原生行为归第 3 章表单。
:::

## 一、URL 与文档基准地址

### 1. 地址中的不同部分

URL 是用来定位资源的地址。下面的地址只用于说明组成，不表示这份演示文档一定在该服务器上存在：

```text
https://example.org:8443/docs/page.html?lang=zh#intro
```

| 部分 | 示例 | 作用 |
|------|------|------|
| 方案 | `https` | 说明使用哪种协议 |
| 主机 | `example.org` | 定位服务器 |
| 端口 | `8443` | 指定显式端口 |
| 路径 | `/docs/page.html` | 定位服务器上的资源 |
| 查询 | `?lang=zh` | 向资源传递参数 |
| 片段 | `#intro` | 定位文档内部位置 |

对于普通 HTML 文档，片段常用于定位文档内部的元素，并不作为 HTTP 请求路径发送给服务器。完整写出方案和目标的绝对 URL，可以独立表达一个地址；`notes.html`、`../root.html`、`#intro` 则需要基准才能解释。URL 的结构与解析依据见 [URL 标准](https://url.spec.whatwg.org/)。

### 2. 绝对地址与相对引用

绝对 URL 包含方案和主机，可以独立定位资源；相对引用只给出与当前基准的差量，必须结合文档地址或 `base` 才能得到完整目标。两者不是“长短写法”的区别，而是是否自带定位起点的区别。

```html
<a href="https://example.org/docs/notes.html">绝对地址</a>
<a href="notes.html">同目录相对引用</a>
<a href="../index.html">父目录相对引用</a>
```

上例中的后两个链接是否有效，取决于当前文档所在位置；不能只看文件名判断。资源文件存在但引用解析到别处，仍然会得到错误目标或 404。

### 3. 基准通常来自当前文档

普通独立 HTML 页没有设置 `base` 时，通常以自身地址作为相对引用的解析基准。例如，文档位于 `http://127.0.0.1:8000/sub/notes.html`，下面几种写法的目标不同：

| 源码中的引用 | 解析结果 | 含义 |
|--------------|----------|------|
| `other.html` 或 `./other.html` | `http://127.0.0.1:8000/sub/other.html` | 当前目录 |
| `../root.html` | `http://127.0.0.1:8000/root.html` | 上一层目录 |
| `/root.html` | `http://127.0.0.1:8000/root.html` | 当前 HTTP 来源的根路径 |
| `#intro` | `http://127.0.0.1:8000/sub/notes.html#intro` | 当前文档内部片段 |
| `?lang=en` | `http://127.0.0.1:8000/sub/notes.html?lang=en` | 当前文档的新查询 |

这些结果表达地址解析，不保证每个目标文件都存在。`./` 指当前基准目录，`../` 回到上一层，`/` 在这里从当前 HTTP 来源的根路径开始；它们不是三个可以随意互换的前缀。[HTML 的文档基准 URL 规则](https://html.spec.whatwg.org/multipage/urls-and-fetching.html#document-base-urls)定义了浏览器取得基准的方式。

### 4. file 访问与 HTTP 根路径不同

直接打开文件时，地址以 `file:` 开头。这时 `/root.html` 会按文件 URL 的根位置处理，不表示“当前练习文件夹的 root.html”。因此，适用于 HTTP 站点根路径的写法，不能不加检查地套在本地文件访问上。

| 访问方式 | 文档地址示例 | `/root.html` 的含义 |
|----------|--------------|---------------------|
| 本地文件 | `file:///Users/reader/html-links/root.html` | 文件系统根目录下的 `root.html` |
| 本地 HTTP | `http://127.0.0.1:8000/root.html` | 该服务器根路径下的 `root.html` |
| 站点子目录 | `https://example.org/docs/page.html` | `https://example.org/root.html` |

Windows 的 `C:\notes\page.html` 是本机磁盘路径，不是可供其他访问者使用的 Web 资源地址。HTML 中用 URL 的正斜杠和目录关系表达资源位置，不把作者机器上的绝对路径写进公开文档。

## 二、链接、片段与键盘操作

### 1. 链接文字说明目标

带 `href` 的链接具有浏览器原生的导航与键盘行为。通常可以用 `Tab` 到达链接，再按 `Enter` 跟随目标。链接文字应让人知道会前往哪里，例如“阅读配置说明”，比脱离上下文的“点击这里”更明确。

没有 `href` 的 `a` 不会因为使用了同一个标签名就成为可导航链接。`href=""` 也不是“没有动作”：它会按空引用解析地址；`href="#"` 则仍有片段导航等默认行为。因此，不应把这些占位写法当作普通按钮。

导航到另一份资源使用链接，提交或执行操作优先使用相应原生按钮。只给一段文字加下划线、鼠标样式或点击脚本，不能自动获得原生链接的地址语义、键盘操作和菜单能力。具体定义见 [HTML 标准：a 元素](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-a-element)。

### 2. 片段标识定位文档内容

链接到同一份文档里的元素，可以把它的唯一 `id` 放在 `#` 后面：

```html
<a href="#intro">跳到说明</a>
<h2 id="intro">说明</h2>
```

链接到另一页的具体位置，则组合文件路径和片段，如 `notes.html#intro`。浏览器先定位目标文档，再按照该文档中的片段进行导航；目标已经在视野中时，不一定出现明显滚动，因此还要核对地址与实际 `id`。

若找不到目标，先检查目标文档、标识拼写与唯一性。资源返回 200 只说明文件请求得到响应，不表示 `#intro` 在其中一定存在。`id` 的规则见 [HTML 全局属性](../01-foundation/06-global-attributes.md)。

### 3. 空 href、# 与伪链接

| 写法 | 实际行为 | 适用边界 |
|------|----------|----------|
| `<a href="notes.html">` | 导航到解析后的目标 | 正常链接 |
| `<a href="">` | 解析为当前文档地址，可能重新加载 | 不作为“无动作”占位 |
| `<a href="#">` | 导航到当前文档的空片段，常回到顶部 | 不作为普通按钮 |
| `<a>` 无 `href` | 不是可导航链接 | 只作为链接样式占位时需谨慎 |
| `<a href="javascript:...">` | 执行脚本式导航 | 不替代按钮，增加安全和可维护性问题 |

想让文字看起来像链接但不需要导航，应说明真实目的；需要执行操作时使用 `button`，需要导航时使用带 `href` 的 `a`。不要用空片段或脚本 URL 把链接伪装成按钮。

::: tip 链接是“去哪里”，按钮是“做什么”
选择元素时先判断用户操作的结果：会打开另一个资源或文档位置，使用链接；会在当前页面执行提交、切换或计算，使用按钮。外观可以后调，职责不应颠倒。
:::

## 三、base 会改变相对引用

### 1. base 改变解析基准

`base` 可在 `head` 中指定文档的 URL 基准。例如，在相应位置使用以下局部声明：

```html
<base href="./sub/">
```

若当前文档是站点根目录下的 `root.html`，相对链接 `notes.html` 会据此指向 `sub/notes.html`。原来已经写成 `sub/notes.html` 的引用，却会变成 `sub/sub/notes.html`。调整基准时应一起核对所有依赖它的地址，不能只修正某一个链接的显示文字。

### 2. 片段引用也受 base 影响

`base` 同样影响 `#intro` 这样的片段引用：它会相对于新基准组成地址，不保证仍指向当前 `root.html`。需要明确回到当前文件时，应使用在当前访问条件下能够定位该文件的路径，如 HTTP 示例中的 `/root.html#intro`。

### 3. 一份文档只应有一个 base href

一份文档只应声明一个 `base`；带 `href` 的 `base` 应位于其他包含 URL 属性的元素之前。浏览器在多个错误声明中采用第一个的恢复规则，不表示可以给每个链接分别安排一个 `base`。具体要求见 [HTML 标准：base](https://html.spec.whatwg.org/multipage/semantics.html#the-base-element)。

::: warning 先检查实际目标，再判断文件是否缺失
基准改变后，`href` 的文字可以完全没变，实际请求却已不同。查看浏览器解析后的完整地址，比反复确认文件“就在同一个文件夹”更有帮助。
:::

## 四、打开关系与下载边界

### 1. target 选择导航环境

`target` 选择导航使用的页面环境。`_self` 通常沿用当前页面，`_blank` 请求新的页面环境；最终采用标签页还是窗口，还受浏览器与用户选择影响。

| 值 | 常见含义 | 边界 |
|----|----------|------|
| `_self` | 当前浏览上下文 | 仍是默认行为之一，不必显式写出 |
| `_blank` | 新的浏览上下文 | 具体标签页或窗口由浏览器决定 |
| `_parent` | 父浏览上下文 | 没有父级时行为由环境决定 |
| `_top` | 最上层浏览上下文 | 用于跳出框架，不等于关闭页面 |
| 自定义名称 | 指定命名浏览上下文 | 名称不是给用户看的说明 |

### 2. rel 声明链接关系与安全边界

`rel` 描述链接关系。`rel="noopener"` 用于使新打开的页面不能通过 `window.opener` 取得打开它的页面引用。现行标准对通常的 `_blank` 导航已有相应默认隔离行为，显式写出可以表达意图，但不能据此声称完成全部页面安全防护。

`rel="noreferrer"` 进一步要求跟随链接时不发送来源信息，同时具有相应的 `noopener` 行为。它与只限制打开关系的 `noopener` 不同：后者并不单独要求删除 HTTP 来源信息。依据分别见 [noopener](https://html.spec.whatwg.org/multipage/links.html#link-type-noopener)和 [noreferrer](https://html.spec.whatwg.org/multipage/links.html#link-type-noreferrer)。

### 3. download 是下载意图，不是万能强制开关

下面的局部标记请求把目标资源作为下载处理，并建议文件名为 `copy.txt`：

```html
<a href="download.txt" download="copy.txt">下载文本文件</a>
```

是否能按这种方式下载，还取决于目标来源、响应头、浏览器策略和用户选择。普通跨来源资源不能仅靠链接上的 `download` 就保证强制下载；响应中的 `Content-Disposition` 也会影响处理方式和文件名。下载时应观察实际结果，不把属性存在当成下载已完成。[HTML 下载处理](https://html.spec.whatwg.org/multipage/links.html#downloading-resources)规定了相应条件。

### 4. mailto 与 tel 交给外部处理程序

`mailto:` 和 `tel:` 等地址则交给相应处理程序。例如，`mailto:reader@example.org` 可以请求邮件处理程序，`tel:` 地址可以请求电话处理程序；实际是否打开应用、是否询问用户，取决于设备与配置。声明这样的链接不代表已经发送邮件或拨打电话，本例不执行这些外部操作。

::: warning download 不保证跨来源强制保存
`download` 是作者表达的下载意图，不是绕过服务器响应和浏览器策略的开关。跨来源地址、`Content-Disposition: inline`、浏览器设置和用户选择都可能改变结果；验证时应看实际保存行为和响应头。
:::

## 五、从空目录验证路径与导航

### 1. 创建两个页面和一个文本文件

新建空目录 `html-links`，在其中创建 `root.html`，再创建子目录 `sub` 和其中的 `notes.html`。文件层级在这里具有路径含义；全部内容均由本篇提供。

::: details 查看 root.html 完整内容

```html [root.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>链接观察</title>
</head>
<body>
  <h1>链接观察</h1>

  <!-- 同目录下的子目录引用 -->
  <p><a id="notes" href="sub/notes.html">阅读子目录说明</a></p>

  <!-- 同页片段，目标 id 在下方 -->
  <p><a id="jump" href="#intro">跳到本页说明</a></p>

  <!-- 只有通过 HTTP 访问时才表示服务器根路径 -->
  <p><a id="site-root" href="/root.html#intro">从 HTTP 根路径定位本页</a></p>

  <!-- 新页面打开，并声明 opener 隔离 -->
  <p><a id="new-page" href="sub/notes.html" target="_blank"
        rel="noopener">在新页面阅读说明</a></p>

  <!-- noreferrer 还要求不发送来源信息 -->
  <p><a id="private-page" href="sub/notes.html" target="_blank"
        rel="noreferrer">不携带来源信息地阅读说明</a></p>

  <!-- download 只是下载意图，实际结果受响应和浏览器影响 -->
  <p><a id="download" href="download.txt" download="copy.txt">下载文本文件</a></p>

  <h2 id="intro">本页说明</h2>
  <p>片段链接指向这里。</p>
</body>
</html>
```

:::

子目录中的 `notes.html` 通过 `../` 引用父目录中的页面：

::: details 查看 sub/notes.html 完整内容

```html [sub/notes.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>子目录说明</title>
</head>
<body>
  <h1>子目录说明</h1>
  <p><a id="back" href="../root.html#intro">返回上层说明</a></p>
</body>
</html>
```

:::

在 `root.html` 同级再创建 UTF-8 文本文件 `download.txt`，内容为一行 `A local download file.`。这些文件既可验证同目录及父目录关系，也提供一个确定存在的下载目标。

### 2. 用文件方式核对相对导航

双击打开 `root.html`，先点击“阅读子目录说明”，再跟随返回链接。地址分别指向子目录文档和父目录文档的片段。重新打开根页面，确认焦点在页面中，按 `Tab` 到达第一个链接，再按 `Enter`，也应进入子目录说明。

`/root.html` 的站点根路径链接留给 HTTP 条件检查，不要求它在 `file:` 访问下具有同一目标。文件方式下可以验证相对路径、片段和键盘导航，但不能把根路径结果外推到 HTTP 站点。

### 3. 通过 HTTP 观察根路径和下载

这一步需要 Python 3.9 或更高版本；未安装时先从 [Python 官方下载](https://www.python.org/downloads/)安装。终端的当前目录应为 `html-links`。macOS 可打开终端、输入 `cd ` 并拖入该文件夹；Windows 可在文件夹地址栏输入 `powershell` 打开终端。

macOS 或使用 `python3` 的环境运行下面的命令。Windows 使用 Python 启动器时，可将 `python3` 换成 `py -3`：

```bash
python3 --version
python3 -m http.server 8000 --bind 127.0.0.1
```

浏览器访问 `http://127.0.0.1:8000/root.html`。终端保持运行，结束时按 `Ctrl+C` 停止。若端口被占用，改用一个空闲端口，并同步修改访问地址；不要直接停止自己不认识的进程。

现在访问“从 HTTP 根路径定位本页”，应得到 `/root.html#intro`。打开开发者工具的 Network 面板查看请求，必要时关闭缓存后重新加载。点击下载链接，主测浏览器会取得当前来源的 `download.txt` 并按建议名称保存；这是本例条件下的结果，不保证任意外站同样处理。

### 4. 检查 base 和错误路径

先保留原文件，在 `head` 的 `title` 之前加入 `<base href="./sub/">`，保存、刷新。Console 中读取以下只读表达式：`baseURI` 是文档基准地址，链接对象的 `.href` 是解析后的地址，不是原始属性字符串。

```js
document.baseURI
document.getElementById('notes').href
document.getElementById('jump').href
```

HTTP 条件下，它们分别指向 `/sub/`、`/sub/sub/notes.html` 和 `/sub/#intro`。先前的链接因此不能再按原意使用。把第一条链接改成 `href="notes.html"` 后可重新进入 `sub/notes.html`；完成观察后删除新增 `base`，并把第一条链接恢复为 `href="sub/notes.html"`，再验证原来的往返路径。

还可以把第一条链接改成 `href="sub/missing.html"`。服务器返回 404 时，应对照请求地址、文件名和大小写，再恢复正确路径；HTML 检查通过并不能证明目标存在。

若把第一条链接文字换成嵌套的 `button`，问题则是链接内部包含了不允许的交互内容。Nu 会报告此类标记错误，修复应恢复普通链接文字，或按实际目的把链接与按钮拆开，而不是只修改 CSS。嵌套规则见 [HTML 元素嵌套与内容模型](../01-foundation/05-nesting-content-models.md)。

| 注入的问题 | 观察 | 恢复 |
|------------|------|------|
| `href="sub/missing.html"` | 请求 404，目标不存在 | 对照 Network 地址、文件名和大小写，恢复正确路径 |
| 加 `<base href="./sub/">` | `notes` 变成 `sub/sub/notes.html` | 删除 base，恢复原相对路径 |
| 空 `href` 或 `href="#"` | 地址变化或回到顶部，不是“无动作” | 需要按钮时改用 `button`，需要导航时给真实目标 |
| 链接中嵌套 `button` | Nu 报告交互内容嵌套错误 | 恢复普通链接文字，或拆分链接与按钮 |

### 5. 验证记录

以上独立文件于 2026-11-14 在 macOS 的 Chrome 157.0.8103.79 中实测。文件与 HTTP 两种访问下的相对导航、HTTP 根路径、键盘 Enter、`base` 变化、同来源下载与错误路径恢复均已核对；新打开页面的 `opener` 为 `null`，`noreferrer` 的目标没有收到来源信息。正常与修复后的两个页面通过 Nu 检查，嵌套按钮对照得到对应错误。

本次重写只补充正文层次、注释和观察项，示例文件、链接属性与实测结论未变；未执行邮件或电话处理程序，也未据此验证跨来源下载、其他浏览器及所有用户导航偏好。
