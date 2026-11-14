---
title: "字符编码与语言声明"
tags:
  - HTML
  - UTF-8
  - 国际化
excerpt: "区分文件字节、字符编码、内容语言与文字方向，说明 UTF-8 保存和声明的一致性，并通过真实错误编码、HTTP 响应头与 BOM 对照定位乱码，验证 lang 和 dir 的不同职责。"
date: 2026-11-14
---

# 字符编码与语言声明

浏览器读到 HTML 文件时，先要把字节解释为字符，再处理元素和文本。**字符编码**决定字节怎样对应文字；`lang` 声明内容使用什么语言；`dir` 声明文字的基本方向。三者分别处理解码、语言和方向，设置其中一项不会自动补齐另外两项。

例如，`lang="zh-CN"` 不会把 GBK 文件转换为 UTF-8，也不会把英文翻译成中文。页面写了 `<meta charset="utf-8">` 后仍然乱码，需要检查实际文件和传输声明，不能只反复修改语言属性。

下面从字节与字符的关系开始，依次核对保存声明、语言、方向和 HTTP 传输条件。

::: info 本篇的范围
本篇讲编码声明、`lang` 和 `dir` 的基础判断，并用本地文件与一个小型 HTTP 服务复现乱码条件。字符引用的写法见[HTML 注释、空白与字符引用](./07-comments-whitespace-references.md)；`head` 中其他资源的接入见[HTML 文档头部与资源引用](./09-head-resources.md)。本篇不展开完整的双向文本算法，也不评价特定屏幕阅读器的发音。
:::

## 一、从字符到文件字节

### 1. 字符、字符集与编码

**字符**是文字、数字、标点等文本单位。字符集用于标识一组字符，Unicode 则为字符分配编号，也称码点；**编码**规定这些字符如何表示为字节序列。UTF-8 是一种 Unicode 编码方式，不等于“只支持某一种语言”。

同一个字符可以有不同的字节表示。例如，字符“你”的 Unicode 编号是 U+4F60：

| 编码 | 文件中的十六进制字节 |
|------|------------------------|
| UTF-8 | `E4 BD A0` |
| GBK | `C4 E3` |

写入与读取使用同一套规则时，可以还原相同的字符。把 `C4 E3` 当成 UTF-8 读取，就不能按原来的 GBK 规则得到“你”。乱码来自这种解释不一致，不是“汉字必须设置一个中文字体”就能修复的问题。

### 2. 同一段文字可能有不同字节

编码不只影响汉字。拉丁字母、数字和标点在不同编码中也可能有不同字节；ASCII 范围内的字符在 UTF-8 中通常仍占一个字节，但超出 ASCII 的字符会使用多个字节。文件大小、字符数和字节数因此不是同一个计数。

| 观察对象 | 例子 | 说明 |
|----------|------|------|
| 字符 | `你` | Unicode 码点 U+4F60 |
| UTF-8 字节 | `E4 BD A0` | 三个字节表示一个字符 |
| GBK 字节 | `C4 E3` | 两个字节表示同一个字符 |
| 解码结果 | `你` | 只有按正确编码解释字节才能得到 |

### 3. charset 是声明，不是转码

`charset` 是 HTML 中用于声明编码的历史名称。`<meta charset="utf-8">` 告诉浏览器采用 UTF-8 解码，但它不会修改硬盘上的字节。与之相对，编辑器的“使用某种编码保存”才会决定写入的字节表示。

::: warning 修改 charset 不会转码文件
已经用 GBK 保存的文件，仅把声明改成 `utf-8`，仍然是 GBK 字节。应先用正确的原编码读取出原文，再以 UTF-8 保存；如果已经把错误解码后的文字保存覆盖，应从备份或可靠原文恢复，不能假定再次改声明就能找回内容。
:::

## 二、UTF-8 保存与声明要一致

### 1. 保存、声明与响应

新建 HTML 文档时，应把文件实际保存为 UTF-8，并在 `head` 起始处尽早声明：

```html
<head>
  <meta charset="utf-8">
  <title>编码观察</title>
</head>
```

声明时写 `utf-8` 或 `UTF-8` 都可以，但文件内容、页面声明和 HTTP 响应的编码信息应保持一致。编辑器显示“UTF-8”与浏览器读取为“UTF-8”分别证明写入和解码的设置，不能只看一边。

| 层次 | 由谁决定 | 观察方式 | 常见问题 |
|------|----------|----------|----------|
| 文件字节 | 编辑器的保存编码 | 十六进制查看或编辑器编码状态 | 实际是 GBK，声明却写 UTF-8 |
| 文档声明 | `meta charset` | 源码、Elements | 声明缺失或位置太后 |
| HTTP 响应 | 服务器响应头 | Network 面板 | 响应头与文件声明不一致 |
| 浏览器解码 | 按判定顺序选择 | `document.characterSet` | 读数正确但字节仍可能错误 |

### 2. 声明的 1024 字节边界

编码声明必须完整落在文档开头的前 1024 个字节内；把它紧跟 `head` 的开始标签，可以避免大量注释或其他内容把声明推到很后面。这里按字节计算，不是 1024 个汉字或 1024 行。现行 HTML 对作者的编码声明要求以 UTF-8 为准，具体见 [HTML 标准：字符编码声明](https://html.spec.whatwg.org/multipage/semantics.html#attr-meta-charset)。

如果声明出现在更后面，浏览器可能已经按默认或传输信息开始解码，之后再看到声明也无法重新解释前面的字节。把声明放在文档前部，是让解码条件尽早确定，不是为了让源码看起来整齐。

### 3. 重新打开与另存为

若编辑器支持“重新以某种编码打开”和“使用某种编码保存”，也要区分两个动作。前者改变如何解释现有字节，后者把当前文字重新写成所选编码。读取错误时先重新打开，读取正确后再转换保存。

::: tip 先恢复正确读取，再转换保存
看到乱码时，不要立刻把乱码文字按 UTF-8 覆盖保存。先尝试按原编码重新打开；只有编辑器显示出正确原文后，才执行“另存为 UTF-8”。顺序反了，可能把错误解码结果永久写回文件。
:::

## 三、lang 声明内容语言

### 1. 页面默认语言与局部覆盖

`lang` 指定元素内容的主要语言，并影响其中具有自然语言含义的属性文本。通常在根元素上声明页面默认语言：

```html
<html lang="zh-CN">
```

没有单独设置 `lang` 的普通后代，会沿祖先关系取得语言。局部文字换成另一种语言时，可以在对应元素上覆盖：

```html
<p>中文说明。</p>
<p lang="en">A short English sentence.</p>
```

这里第二段使用英语，第一段仍按页面的中文声明处理。把默认语言写在 `html` 上，还能覆盖 `head` 内的文档标题；只写在 `body` 上不能代替整份文档的默认声明。根元素与局部声明的选择依据见 [W3C：在 HTML 中声明语言](https://www.w3.org/International/questions/qa-html-language-declarations)。

### 2. 使用标准语言标签

语言值采用 BCP 47 语言标签。`en` 表示英语，`en-GB` 可进一步说明英国英语，`zh-Hans` 可标识简体中文文字，`zh-CN` 包含中文与中国大陆地区子标签。它们不是浏览器按钮名称，也不是文件编码名称。

| 值 | 可能表达的含义 | 不应解释为 |
|----|----------------|------------|
| `en` | 英语 | 英国英语的专门标签 |
| `en-GB` | 英国英语 | 所有英语内容的必需写法 |
| `zh-Hans` | 中文，简体文字 | 仅指中国大陆地区 |
| `zh-CN` | 中文，中国大陆地区子标签 | UTF-8 编码声明 |

### 3. lang 不负责编码和翻译

`lang="UTF-8"` 不能正确表达“文件使用 UTF-8”，`lang="Chinese"` 也不能代替标准的中文语言标签。语言声明用于辅助技术、拼写处理和其他语言相关的解释，不保证所有浏览器或读屏软件都采用同一套声音与表现。

设置 `lang` 不会翻译文字，也不会单独改变字符编码。用于目标受众等目的的 HTTP `Content-Language` 信息，与标记具体文字的 `lang` 不是同一层；不应使用 `meta http-equiv="Content-Language"` 替代元素语言声明。

::: warning 语言声明不是编码修复
页面乱码时，把 `lang` 改成 `zh-CN` 不会让 GBK 字节变成 UTF-8；页面需要英文发音时，把 `lang` 改成 `en` 也不会自动翻译正文。编码、语言和翻译是三件不同的事。
:::

## 四、dir 声明文字基本方向

### 1. 三个常见取值

语言名称和文字方向是两个独立维度。阿拉伯语、希伯来语等文字需要处理从右向左的基本方向，但仅有 `lang="ar"` 并不会自动把 HTML 元素的基本方向设成 RTL。

`dir` 的常见取值如下：

| 值 | 作用 |
|----|------|
| `ltr` | 从左向右的基本方向 |
| `rtl` | 从右向左的基本方向 |
| `auto` | 根据内容中的强方向性字符等规则确定基本方向 |

普通元素没有另行声明时会沿祖先方向处理，文档的默认基本方向通常为从左向右。需要整页 RTL 时可在 `html` 上设置 `dir="rtl"`；只有局部改变方向时，在那部分元素上声明。结构方向的依据见 [W3C：HTML 中从右向左的结构标记](https://www.w3.org/International/questions/qa-html-dir)。

### 2. 基本方向不是逐字符反转

`dir` 设置的是**基本方向**，不是把字符串逐字符倒过来。RTL 段落中的数字、拉丁字母和标点仍按双向文本规则组合。`auto` 也不是语言识别或翻译功能，它根据文本确定方向，不会自动填写 `lang`。

方向结果还会受到具体字符的影响：同一段 RTL 文本中出现数字或英文单词时，这些片段在行内的排列由双向算法处理，不能简单理解为“所有字符从右往左依次排列”。本篇只观察元素的基本方向，不展开完整的双向文本分段规则。

### 3. lang 与 dir 相互独立

`lang` 说明内容语言，`dir` 说明基本方向。阿拉伯语页面通常需要 RTL，但 `lang="ar"` 本身不设置方向；反过来，`dir="rtl"` 也不会把内容语言标记为阿拉伯语。两者应按实际内容分别声明。

| 声明组合 | 说明 | 常见误判 |
|----------|------|----------|
| `lang="ar"` 无 `dir` | 阿拉伯语内容，方向继承祖先 | 认为语言会自动设置 RTL |
| `lang="ar" dir="rtl"` | 阿拉伯语，基本方向 RTL | 认为两者是同一个属性 |
| `lang="en" dir="rtl"` | 英语内容，基本方向 RTL | 认为英语只能 LTR |
| `dir="auto"` 无 `lang` | 按内容决定方向，语言未声明 | 认为 `auto` 会自动识别语言 |

### 4. 用 language.html 观察语言与方向

新建空目录 `html-language`，创建下面的 `language.html`，以 UTF-8 保存并用浏览器打开。几段独立文本只用于比较声明，没有脚本或外部素材。

::: details 查看 language.html 完整内容

```html [language.html]
<!doctype html>
<html lang="zh-CN" dir="ltr">
<head>
  <meta charset="utf-8">
  <title>语言与方向</title>
</head>
<body>
  <p id="zh">中文：你好。</p>
  <p id="en" lang="en">A short English sentence.</p>
  <p id="ar" lang="ar" dir="rtl">مرحبا بالعالم</p>
  <p id="auto" lang="he" dir="auto">שלום 123</p>
  <p id="language-only" lang="ar">مرحبا بالعالم</p>
</body>
</html>
```

:::

`ar` 段落具有阿拉伯语声明和 RTL 基本方向。最后一段虽然也声明了阿拉伯语，但没有覆盖根元素的 LTR 方向；字形本身仍按相应文字规则显示，整个段落的基本方向与前一段不同。`auto` 段落以希伯来语文字起始，能观察到自动确定的 RTL 方向。

在 Elements 面板核对 `lang` 和 `dir`。需要精确观察时，Console 中可执行下列只读表达式；`getComputedStyle` 读取浏览器计算后的显示属性，`.direction` 返回本例的方向结果：

```js
document.documentElement.lang
document.getElementById('en').lang
getComputedStyle(document.getElementById('ar')).direction
getComputedStyle(document.getElementById('language-only')).direction
getComputedStyle(document.getElementById('auto')).direction
```

主测结果依次为 `zh-CN`、`en`、`rtl`、`ltr`、`rtl`。普通后代继承语言，不表示每个后代都自动出现一个 `lang` 属性；DOM 的 `.lang` 属性主要反映该元素自己声明的值，不能拿空字符串直接断言“这里没有继承语言”。

::: tip 分别检查解码、语言与方向
乱码先查字节与编码；语言标记查根元素和局部 `lang`；方向问题查 `dir` 与上下文。把语言改成 `ar` 不能代替 RTL 声明，把方向改成 `rtl` 也不能修复错误解码。
:::

## 五、用真实错误编码定位乱码

### 1. 准备正确文件与错误副本

在同一个空目录中创建 `encoding.html`，以 UTF-8 保存以下内容。它不包含只能靠其他文件取得的文本或脚本。

::: details 查看 encoding.html 完整内容

```html [encoding.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>编码观察</title>
</head>
<body>
  <p id="text">你好，世界。</p>
</body>
</html>
```

:::

打开后应显示 `你好，世界。`。在 Console 中读取以下表达式，核对浏览器使用的解码名称：

```js
document.characterSet
document.getElementById('text').textContent
```

本例正常文件返回 `UTF-8` 与 `你好，世界。`。接着保留正常文件，用支持 GBK 保存的编辑器制造一个错误副本：

1. 将文件另存为 `bad.html`，选择“使用编码保存”，将副本编码设为 GBK。
2. 保持副本中的 `<meta charset="utf-8">` 不变，不把正文改成其他文字。
3. 用浏览器打开副本，刷新并重复读取上述两个表达式。

在 VS Code 中可通过状态栏的编码入口选择“通过编码保存”，再选择相应的简体中文 GBK 编码。这里故意让真实字节与声明不一致；若编辑器没有 GBK 写入功能，可以只观察正确文件，不要用修改文件名或声明来冒充转码实验。

### 2. 观察错误解码的结果

错误副本中的文字不能正确还原，而 `document.characterSet` 仍会显示 `UTF-8`：这说明浏览器确实按声明选了 UTF-8，错误来自文件实际用了另一套字节表示。乱码的具体字符不作为固定预期，应比较是否仍为原文。

| 文件 | 实际字节 | 页面声明 | 浏览器读数 | 正文结果 |
|------|----------|----------|------------|----------|
| `encoding.html` | UTF-8 | UTF-8 | `UTF-8` | 原文正确 |
| `bad.html` | GBK | UTF-8 | `UTF-8` | 不能还原原文 |

### 3. 正确读取后再转换保存

在编辑器中对 `bad.html` 选择“通过编码重新打开”，明确按 GBK 读取，确认文字重新成为 `你好，世界。`。此时再选择“通过编码保存”，转成 UTF-8，并保持页面的 UTF-8 声明。

再次打开浏览器，编码读数仍是 `UTF-8`，正文已经恢复。前后编码读数相同而显示不同，进一步说明只看解码名称不能验证原始字节是否正确。

如果编辑器中看到的已经是乱码，不要直接把这份乱码按 UTF-8 保存覆盖原文件。先保留原始字节并按已知编码重新打开；若原字节已丢失，应从备份恢复。本例保留正常 `encoding.html`，因此也可用它核对原文。

## 六、HTTP 声明与 BOM 的补充对照

### 1. 文件内声明不是唯一输入

经 HTTP 加载时，服务器可以在响应头中发送 `Content-Type: text/html; charset=...`。在没有用户手工覆盖等额外条件时，开头可识别的 BOM（字节顺序标记）先参与编码判定；没有 BOM 而响应明确提供受支持编码时，HTTP 声明先于文档内的 `meta` 使用。

因此，不能把规则简化成“meta 永远决定编码”，也不能无条件说“HTTP 一定覆盖所有信息”。[HTML 标准：编码判定](https://html.spec.whatwg.org/multipage/parsing.html#determining-the-character-encoding)列出了判定过程；[W3C 的编码声明说明](https://www.w3.org/International/questions/qa-html-encoding-declarations)要求传输声明与文件内声明保持一致。UTF-8 文件可以没有 BOM，不需要为了修复普通页面而一律加 BOM。

| 输入条件 | 本例中的优先结果 | 说明 |
|----------|------------------|------|
| UTF-8 BOM + 错误 HTTP 声明 | BOM 指向的 UTF-8 | 可识别的 BOM 先参与判定 |
| 无 BOM + HTTP UTF-8 | HTTP 的 UTF-8 | 响应声明与字节一致 |
| 无 BOM + HTTP Windows-1252 | HTTP 的 Windows-1252 | 错误声明导致解码错误 |
| 无 BOM、无 HTTP 声明 | 文档内 `meta` 或默认规则 | 需要继续按完整判定过程检查 |

### 2. 用本地响应验证优先关系

以下补充实验需要 Python 3.9 或更高版本。它只用本篇创建的 `encoding.html`，把同一份 UTF-8 字节配上不同响应头，用来观察解码；不要求读者学习服务端框架。

在该文件所在目录创建 `serve.py`。编辑器保存 UTF-8 时可以带有或不带 BOM，为使三种响应具有稳定的对照条件，服务读取文件后先移除一个已有的 UTF-8 BOM，再只为 `/bom` 路径添加它。这个规范化仅作用于本次响应使用的字节，不修改磁盘文件。三个路径分别返回正确响应头、错误响应头、错误响应头但带单个 UTF-8 BOM 的内容。

::: details 查看 serve.py 完整内容

```python [serve.py]
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path


class EncodingHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        """返回编码对照页；仅用于本地观察，不修改原文件。"""
        if self.path not in {"/correct", "/conflict", "/bom"}:
            self.send_error(404)
            return
        # 去掉文件可能已有的 BOM，保证三个路径的输入字节可对照
        data = Path("encoding.html").read_bytes().removeprefix(b"\xef\xbb\xbf")
        if self.path == "/bom":
            data = b"\xef\xbb\xbf" + data
        charset = "utf-8" if self.path == "/correct" else "windows-1252"
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=" + charset)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


with HTTPServer(("127.0.0.1", 8018), EncodingHandler) as server:
    server.serve_forever()
```

:::

先确认 `encoding.html` 是正常 UTF-8 文件，再在该目录打开终端执行。macOS 使用下面的命令，Windows 已安装 Python 启动器时可使用 `py -3 serve.py`：

```bash
python3 serve.py
```

依次访问以下三个地址，在 Network 面板查看响应的 `Content-Type`，再在 Console 读取 `document.characterSet` 和正文。端口 `8018` 若已被占用，先停止占用它的演示服务；实验结束在启动服务的终端按 `Ctrl+C`。

| 地址 | 本例响应条件 | 主测结果 |
|------|--------------|----------|
| `http://127.0.0.1:8018/correct` | UTF-8 字节、UTF-8 HTTP 声明、无 BOM | `UTF-8`，原文正确 |
| `http://127.0.0.1:8018/conflict` | UTF-8 字节、Windows-1252 HTTP 声明、无 BOM | `windows-1252`，文字错误 |
| `http://127.0.0.1:8018/bom` | 同一错误 HTTP 声明，内容开头增加 UTF-8 BOM | `UTF-8`，原文正确 |

### 3. 验证记录

本实验于 2026-11-14 使用 macOS、Python 3.9.6 与 Chrome 157.0.8103.79 完成。语言和方向文件、UTF-8 正常文件、真实 GBK 字节错误副本及转回 UTF-8 的文件均核对了实际内容；正常 HTML 经 Nu 检查无错误、无警告，错误字节副本得到编码错误报告。HTTP 补充实验分别以无 BOM 和带单个 UTF-8 BOM 的原始文件运行；两种输入下的三个路径都得到上表结果，响应头、响应字节和浏览器读数分别核对，服务没有修改原文件。

这些结果证明所列条件下的编码判定和方向声明，不保证特定屏幕阅读器的发音，也没有覆盖所有浏览器、用户手工编码覆盖和所有混合文字排版。完整双向算法与语言本地化不属于本例范围。
