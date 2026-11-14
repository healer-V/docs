---
title: "新增表单属性"
tags:
  - HTML
  - 表单
  - 表单属性
  - 提交
excerpt: "说明 placeholder、autocomplete、inputmode、autofocus 怎样改变填写提示，multiple 与 accept 怎样影响多值和文件选择，form 怎样关联外部控件，以及提交按钮的四个覆盖属性。"
date: 2026-11-14
---

# 新增表单属性

表单属性改变的是填写和提交过程中的具体环节：空值时显示什么提示、浏览器能否提供保存过的值、控件属于哪个表单、这一次提交发往哪里。把这些环节分开，才能判断一个属性是提示、关联还是提交覆盖。

本篇的“新增”是相对早期表单分类而言，不表示每个属性都在同一版标准中出现。`select` 的 `multiple` 早于 HTML5；`autocomplete` 的 token 和 `inputmode` 的取值按现行标准增补。判断时以当前 WHATWG HTML Living Standard 的定义为准。

下面先看填写阶段的四个属性，再看多值与文件、控件归属和按钮级提交覆盖；约束校验属性只做定位，不在这里展开。

::: info 版本与规范入口
属性行为按 WHATWG HTML Living Standard 的现行定义说明；`autocomplete`、`inputmode` 等枚举值会随标准增补。规范入口：[表单控件基础设施](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html)、[input 元素](https://html.spec.whatwg.org/multipage/input.html)、[autofocus](https://html.spec.whatwg.org/multipage/interaction.html#the-autofocus-attribute)。`novalidate`、`formnovalidate` 和约束校验 API 由[原生约束校验](./05-constraint-validation.md)主讲。
:::

## 一、填写提示、自动填写与输入方式

这四个属性都发生在用户填写阶段，但作用点不同：`placeholder` 管空值提示，`autocomplete` 管字段语义，`inputmode` 管虚拟键盘，`autofocus` 管初始焦点。它们都不改变字段的 `name`，也不自动完成校验。

### 1. placeholder 是提示，不是标签

`placeholder` 提供一个短提示，只在控件值为空时显示；用户输入后提示消失，清空后重新出现。它不是默认值：提交时控件值仍是空字符串，除非用户真的输入了内容。

| 属性 | 含义 | 使用方式 | 不能替代 |
|------|------|----------|----------|
| `placeholder` | 空值时显示的短提示 | 放格式示例，如“例如：小林” | `label`、默认值、校验 |

它适用于 `input` 的 text、search、tel、url、email、password 类型，以及 `textarea`。提示应说明格式或示例，不要重复标签文字。

```html
<label for="nickname">昵称</label>
<input id="nickname" name="nickname" type="text" placeholder="例如：小林">
```

打开页面，昵称输入框为空时显示“例如：小林”；输入文字后提示消失。在 Console 读取 `document.getElementById('nickname').value`，未输入时是空字符串，说明提示没有成为值。

::: warning placeholder 不能当标签
只写 `placeholder` 而不写 `label` 时，输入后提示消失，字段没有持久可见的名称，读者只能靠上下文推断。`placeholder` 也不参与约束校验，不能用来代替格式检查。
:::

### 2. autocomplete 表达字段语义

`autocomplete` 告诉浏览器这个字段收集的是哪类数据，浏览器可据此提供已保存的姓名、邮箱、地址或验证码。它是提示，不是强制：浏览器可以忽略，用户也可以拒绝自动填写。

| 取值 | 含义 | 常见用法 |
|------|------|----------|
| `name` | 姓名 | 姓名输入框 |
| `email` | 邮箱 | `type="email"` |
| `tel` | 电话号码 | `type="tel"` |
| `street-address` | 街道地址 | 地址输入 |
| `postal-code` | 邮政编码 | 地址输入 |
| `one-time-code` | 一次性验证码 | 短信或验证器验证码 |
| `on` / `off` | 允许或关闭自动填写提示 | 浏览器可忽略 `off` |

需要区分多个地址或联系人时，可以在 token 前加 `section-*`，或用 `shipping`/`billing`、`home`/`work` 等限定；单字段场景直接用上表中的 token 即可。

```html
<label for="email">邮箱</label>
<input id="email" name="email" type="email" autocomplete="email">
```

在 Elements 面板确认 `autocomplete="email"`；是否出现已保存邮箱的候选，取决于浏览器、用户设置和是否保存过数据，不能把“没有候选”当成属性失效。

::: warning autocomplete 不是访问控制
`autocomplete="off"` 只是提示，浏览器可以忽略；它不能阻止自动填写，也不能代替权限校验。涉及敏感字段时按业务规则处理，不把 `off` 当作安全边界。
:::

### 3. inputmode 只提示输入方式

`inputmode` 提示浏览器在移动设备上显示哪种虚拟键盘。它不改变控件值，也不限制可以输入哪些字符；在桌面浏览器上通常没有可见效果。

| 取值 | 提示的键盘 | 适用场景 |
|------|------------|----------|
| `text` | 文本键盘 | 普通文本 |
| `numeric` | 数字键盘 | 数字编号、数量 |
| `decimal` | 带小数点的数字键盘 | 金额、度量 |
| `tel` | 电话键盘 | 电话号码 |
| `email` | 带 @ 的键盘 | 邮箱 |
| `url` | 带 / 和 . 的键盘 | 网址 |
| `search` | 搜索键盘 | 搜索框 |
| `none` | 不提示 | 由浏览器决定 |

```html
<label for="code">验证码</label>
<input id="code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code">
```

在桌面 Chrome 中只能确认属性存在，键盘外观不变；在手机上通常显示数字键盘，具体键盘由输入法和系统决定。输入 `abc` 仍会进入控件，说明 `inputmode` 不做校验。

::: warning inputmode 不校验
`inputmode="numeric"` 只影响虚拟键盘，不限制输入内容，也不参与约束校验。需要格式约束时使用 `pattern`、`min`/`max` 或脚本校验，具体见[原生约束校验](./05-constraint-validation.md)。
:::

### 4. autofocus 改变初始焦点

`autofocus` 是布尔属性，页面加载后把焦点移到该控件。一个文档只应有一个 `autofocus`；多个时浏览器通常只处理第一个。焦点移动可能触发页面滚动或移动端键盘弹出，因此只放在用户下一步最可能要操作的字段上。

| 属性 | 值 | 作用 | 边界 |
|------|----|------|------|
| `autofocus` | 布尔属性，写出即生效 | 加载后聚焦该控件 | 浏览器可忽略；一个文档只放一个 |

```html
<label for="nickname">昵称</label>
<input id="nickname" name="nickname" autofocus>
```

加载页面后在 Console 读取 `document.activeElement.id`，返回 `nickname`；如果返回 `body` 或其他元素，说明焦点没有落到该控件。

::: warning autofocus 会移动焦点
页面加载时焦点跳到该控件，长页面可能滚动，移动端可能弹出键盘。不要给每个表单都加 `autofocus`；它不能代替提交后的焦点管理。
:::

## 二、多值输入和文件类型提示

`multiple` 和 `accept` 都影响用户能选什么，但都不替服务端做决定。前者改变控件接受多值的能力，后者只是文件选择器的过滤提示。

### 1. multiple 的三种用途

`multiple` 是布尔属性，但不同控件上的含义不同：email 输入接受逗号分隔的多个地址，file 输入允许多选文件，select 允许选中多个选项。`select` 的 `multiple` 早于 HTML5，不应笼统称为新增属性。

| 元素或类型 | 作用 | 提交时的形式 | 状态 |
|------------|------|--------------|------|
| `input type="email"` | 接受逗号分隔的多个邮箱 | 一个字段，值用逗号分隔 | 现行 |
| `input type="file"` | 允许选择多个文件 | multipart 中多个同名 part | 现行 |
| `select` | 允许选中多个选项 | 每个选中项一个同名值 | 早于 HTML5 |

```html
<label for="contacts">联系邮箱（逗号分隔）</label>
<input id="contacts" name="contacts" type="email" multiple>

<label for="files">附件</label>
<input id="files" name="files" type="file" multiple>
```

在邮箱框输入 `a@example.com, b@example.com`，`document.getElementById('contacts').checkValidity()` 返回 `true`；文件选择器允许一次选多个文件。服务端收到的是一个 `contacts` 字段，以及多个同名的 `files` part。

::: warning multiple 不改变服务端规则
`multiple` 只让控件接受多个值；服务端仍要检查数量、大小、类型和内容。邮箱字段提交后仍是一个用逗号分隔的字符串，不是自动拆好的数组。
:::

文件多选和邮箱多值都会进入同一个字段名，接收端需要按字段类型分别解析。

::: tip select 的 multiple 不是新增
`<select multiple>` 在 HTML5 之前就存在；本章把它列在对照表中，是为了避免把“多选”一律归为 HTML5 新属性。
:::

### 2. accept 只是文件类型提示

`accept` 用在 `input type="file"` 上，用逗号分隔扩展名或 MIME 类型，告诉文件选择器优先显示哪些文件。它是提示，不是上传限制：用户仍可能选择其他类型，服务端必须重新检查。

| 写法 | 含义 | 边界 |
|------|------|------|
| `accept=".txt"` | 建议 .txt 扩展名 | 扩展名可以伪造 |
| `accept="text/plain"` | 建议 text/plain MIME 类型 | 不同系统对 MIME 的判断可能不同 |
| `accept="image/*"` | 建议所有图片类型 | 不代表图片内容安全 |

```html
<label for="files">附件</label>
<input id="files" name="files" type="file" multiple accept=".txt,text/plain">
```

打开文件选择器时，.txt 和 text/plain 文件更容易被选中；不同浏览器和系统对过滤的严格程度不同，不能用界面表现判断文件是否合格。

::: warning accept 不是校验
文件选择器的过滤只是提示；接收端必须检查扩展名、MIME、大小和内容。不要因为写了 `accept` 就跳过服务端校验。
:::

## 三、控件与 form 的显式关联

控件通常放在 `form` 内部，但表单关联元素可以通过 `form` 属性关联到文档中任意位置的表单。这个属性解决的是归属，不是布局；控件仍在原来的 DOM 位置。

### 1. form 属性按 id 关联

`form` 属性的值是目标表单的 `id`，不是 `name`。带该属性的控件可以放在 `form` 外面，提交时仍属于指定表单；一个控件只能有一个表单所有者。

| 属性 | 所属元素 | 值 | 作用 | 边界 |
|------|----------|----|------|------|
| `form` | `button`、`fieldset`、`input`、`object`、`output`、`select`、`textarea` | 目标表单的 `id` | 把控件关联到指定表单 | id 必须存在；一个控件只能有一个 form owner |

```html
<form id="signup" action="/send" method="post">
  <label for="nickname">昵称</label>
  <input id="nickname" name="nickname">
</form>

<label for="referrer">推荐人</label>
<input id="referrer" name="referrer" form="signup">
```

在 Console 读取 `document.getElementById('referrer').form.id`，返回 `signup`；提交表单后，服务端输出包含 `referrer`，即使它不在 `form` 标签内部。

::: warning form 指向 id
`form="signup"` 匹配的是 `id="signup"`，不是 `name="signup"`。id 不存在时控件没有表单所有者，点击提交不会带上它；用 Console 读取 `control.form` 可以确认是否为 `null`。
:::

### 2. 关联失败与提交边界

关联失败通常没有报错，只是字段悄悄不出现在请求里。判断时同时看 DOM 归属和实际请求，不要只看页面外观。

| 现象 | 定位证据 | 修复 |
|------|----------|------|
| 外部控件没有随表单提交 | `control.form` 为 `null`；请求体没有该 `name` | 检查 `form` 值是否等于某个表单的 `id`，补 id 或改 `form` |
| 控件提交到了另一个表单 | `control.form.id` 不是预期值 | 检查文档中是否有重复 id；确保目标 id 唯一 |
| 控件在 `form` 内却被指向别处 | `control.form.id` 指向另一个表单 | 删除 `form` 属性，或确认确实要改归属 |

`form` 属性只建立关联，不把控件移动到表单里；CSS 布局、DOM 顺序和事件冒泡仍按控件的实际位置计算。需要把按钮放到表单外、又希望它提交该表单时，这个属性比用脚本转发更直接。

::: info 一个控件只能有一个 form owner
`form` 属性只建立关联，不复制表单；一个控件只能有一个表单所有者。重复 id 会让 `form` 指向树序中第一个匹配元素，容易关联错控件；用 `form.elements` 可以核对表单实际包含哪些控件。
:::

## 四、提交按钮的覆盖属性

同一个表单可以有多个提交按钮，每个按钮用 `formaction`、`formmethod`、`formenctype`、`formtarget` 覆盖这一次提交的目标、方法、编码和窗口。覆盖只作用于被激活的按钮，不修改表单本身的属性。

### 1. 四个覆盖属性

| 属性 | 覆盖的表单属性 | 取值 | 生效条件 | 边界 |
|------|----------------|------|----------|------|
| `formaction` | `action` | URL | 被激活的提交按钮 | 只对提交按钮生效 |
| `formmethod` | `method` | `get`、`post`、`dialog` | 同上 | `dialog` 关闭对话框，不发送请求 |
| `formenctype` | `enctype` | `application/x-www-form-urlencoded`、`multipart/form-data`、`text/plain` | 同上，且方法为 `post` | `get` 不带请求体，编码不生效 |
| `formtarget` | `target` | 关键字（如 `_self`、`_blank`）或窗口名 | 同上 | 实际窗口行为由浏览器决定 |

这四个属性都只写在提交按钮上。没有写覆盖属性时，按钮使用 `form` 上的 `action`、`method`、`enctype`、`target`；写了就只改这一次提交。

```html
<form id="signup" action="/send" method="post" enctype="application/x-www-form-urlencoded" target="_self">
  <!-- 预览：只改这一次提交的地址和方法 -->
  <button type="submit" formaction="/preview" formmethod="get" formtarget="_blank">预览</button>
  <!-- 发送：沿用 form 的 POST 和 urlencoded -->
  <button type="submit">发送</button>
  <!-- 发送文件：只改这一次提交的编码 -->
  <button type="submit" formenctype="multipart/form-data">发送文件</button>
</form>
```

点击“预览”发出 `GET /preview`；点击“发送”发出 `POST /send`，`Content-Type` 为 `application/x-www-form-urlencoded`；点击“发送文件”仍发往 `/send`，但 `Content-Type` 变为 `multipart/form-data`。在 Network 面板逐项核对方法、URL 和请求头。

::: warning 覆盖只对被激活的按钮生效
`formaction` 写在 `type="button"` 上不会提交；写在 `type="submit"` 上才参与提交。多个提交按钮并存时，只有用户激活的那个按钮的覆盖属性生效，其他按钮的值不参与。
:::

### 2. 覆盖不修改表单本身

覆盖属性只影响这一次提交，不会把新值写回 `form` 元素。点击过“预览”后，在 Console 读取 `document.getElementById('signup').action`，仍是原来的 `/send`；下一次点击“发送”仍按表单默认值提交。

| 现象 | 定位证据 | 修复 |
|------|----------|------|
| 按钮没有覆盖提交 | Network 仍是表单的 `action`/`method` | 确认按钮是 `type="submit"`；`type="button"` 不提交 |
| GET 请求没有 Content-Type | 请求头没有 Content-Type | GET 不带请求体，`formenctype` 不生效 |
| 文件字段没有文件 part | multipart 请求体只有文本字段 | 确认按钮带 `formenctype="multipart/form-data"`，且用户已选择文件 |
| 预览没有打开新标签页 | 响应在当前页替换 | 检查 `formtarget`；浏览器可能拦截弹窗 |

`formnovalidate` 和 `novalidate` 控制的是提交时是否执行交互校验，不改变目标、方法或编码，因此放在约束校验一篇，不在这里重复。

::: info 校验覆盖不在本篇
`formnovalidate` 与 `novalidate` 只影响提交时是否执行交互校验；它们不改变 `action`、`method`、`enctype`、`target`。需要跳过校验时见[原生约束校验](./05-constraint-validation.md)。
:::

## 五、属性组合的边界

### 1. 一张表看清职责

| 属性 | 改变什么 | 不改变什么 | 主讲 |
|------|----------|------------|------|
| `placeholder` | 空值提示 | 值、标签、校验 | 本篇 |
| `autocomplete` | 自动填写提示 | 值、校验、权限 | 本篇 |
| `inputmode` | 虚拟键盘提示 | 值、校验 | 本篇 |
| `autofocus` | 初始焦点 | 值、提交 | 本篇 |
| `multiple` | 可输入或选择多个值 | 服务端接受规则 | 本篇 |
| `accept` | 文件选择提示 | 上传限制 | 本篇 |
| `form` | 控件归属 | DOM 位置 | 本篇 |
| `formaction`、`formmethod`、`formenctype`、`formtarget` | 本次提交的目标、方法、编码、窗口 | `form` 的持久属性 | 本篇 |
| `novalidate`、`formnovalidate` | 是否执行交互校验 | 提交目标、编码 | [原生约束校验](./05-constraint-validation.md) |

这些属性可以组合，但每个只负责一件事：`form` 决定控件归属，`multiple` 决定能否选多个，`formenctype` 决定文件怎样编码。把它们混在一起判断，容易把界面提示当成服务端规则。

### 2. 独立示例

在空目录中创建两个文件：`attributes.html` 和 `echo_server.py`。示例用 Python 标准库启动本地服务，不安装第三方包；服务端把收到的字段打印到页面，便于对照浏览器提交结果。

1. 新建目录并保存下面两个文件，编码使用 UTF-8。
2. 在目录中运行 `python3 echo_server.py`，终端会输出 `http://127.0.0.1:8000/attributes.html`。如果 8000 被占用，用 `PORT=8001 python3 echo_server.py`，再打开对应端口。
3. 用 Chrome 打开该地址，按下面的观察表逐项操作；服务端输出直接显示在页面上。

::: details 完整示例 attributes.html
```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>表单属性观察</title>
</head>
<body>
  <h1>表单属性观察</h1>

  <!-- 表单的默认提交设置；按钮可以覆盖其中一项或多项 -->
  <form id="signup" action="/send" method="post"
        enctype="application/x-www-form-urlencoded" target="_self">
    <!-- placeholder 只给格式示例；label 才是字段名称 -->
    <p>
      <label for="nickname">昵称</label>
      <input id="nickname" name="nickname" type="text"
             placeholder="例如：小林" autocomplete="nickname"
             inputmode="text" autofocus>
    </p>

    <!-- email 的 multiple 接受逗号分隔的多个地址 -->
    <p>
      <label for="contacts">联系邮箱（逗号分隔）</label>
      <input id="contacts" name="contacts" type="email" multiple
             autocomplete="email" placeholder="a@example.com, b@example.com">
    </p>

    <!-- 文件多选；accept 只是选择器提示，不是上传限制 -->
    <p>
      <label for="files">附件</label>
      <input id="files" name="files" type="file" multiple
             accept=".txt,text/plain">
    </p>

    <!-- 三个按钮分别覆盖提交地址、方法或编码 -->
    <p>
      <button type="submit" formaction="/preview" formmethod="get"
              formtarget="_blank">预览（GET）</button>
      <button type="submit">发送（URL 编码）</button>
      <button type="submit" formenctype="multipart/form-data">发送文件（multipart）</button>
    </p>
  </form>

  <!-- 这个控件在 form 外部，通过 form 属性关联到 signup -->
  <p>
    <label for="referrer">推荐人</label>
    <input id="referrer" name="referrer" form="signup"
           placeholder="不在 form 内部，但会随表单提交">
  </p>
</body>
</html>
```
:::

服务端脚本只依赖 Python 标准库：GET 请求解析查询字符串，urlencoded 请求用 `parse_qs` 解析，multipart 请求用 `email.parser` 取出文本字段和文件 part。它不校验业务规则，只把收到的内容原样显示出来。

::: details 完整示例 echo_server.py
```python
import os
from email.parser import BytesParser
from email.policy import default
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

HOST = "127.0.0.1"
PORT = int(os.environ.get("PORT", "8000"))
BASE = Path(__file__).resolve().parent


def describe(entries):
    """把字段名和值转成可读文本；文件值显示文件名与字节数。"""
    lines = []
    for name, values in entries.items():
        for value in values:
            if isinstance(value, tuple):
                filename, size = value
                lines.append(f"{name} = <file {filename!r}, {size} bytes>")
            else:
                lines.append(f"{name} = {value!r}")
    return "\n".join(lines) or "(无字段)"


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = urlparse(self.path).path
        if path in ("/", "/attributes.html"):
            body = (BASE / "attributes.html").read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        query = parse_qs(urlparse(self.path).query, keep_blank_values=True)
        self.reply("GET", path, "(无请求体)", query)

    def do_POST(self):
        path = urlparse(self.path).path
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length)
        content_type = self.headers.get("Content-Type", "")
        entries = {}
        if content_type.startswith("application/x-www-form-urlencoded"):
            entries = parse_qs(raw.decode("utf-8"), keep_blank_values=True)
        elif content_type.startswith("multipart/form-data"):
            message = BytesParser(policy=default).parsebytes(
                f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode() + raw
            )
            for part in message.iter_parts():
                name = part.get_param("name", header="content-disposition")
                if not name:
                    continue
                filename = part.get_filename()
                payload = part.get_payload(decode=True) or b""
                if filename:
                    entries.setdefault(name, []).append((filename, len(payload)))
                else:
                    entries.setdefault(name, []).append(payload.decode("utf-8"))
        self.reply("POST", path, content_type, entries)

    def reply(self, method, path, content_type, entries):
        body = f"方法: {method}\n路径: {path}\nContent-Type: {content_type}\n\n{describe(entries)}\n"
        body = body.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    print(f"http://{HOST}:{PORT}/attributes.html")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
```
:::

| 操作 | 可核对的结果 | 说明 |
|------|--------------|------|
| 打开页面 | `document.activeElement.id` 为 `nickname` | `autofocus` 生效 |
| 不输入昵称 | 输入框显示“例如：小林”；`value` 为空字符串 | `placeholder` 不是值 |
| 输入昵称后 | 提示消失，`value` 为输入内容 | 提示只在空值时显示 |
| 点击“预览（GET）” | Network 显示 `GET /preview`，查询字符串含昵称、邮箱、推荐人；浏览器在新标签页显示响应（若被拦截，允许弹窗后重试） | `formaction`、`formmethod`、`formtarget` |
| 点击“发送（URL 编码）” | Network 显示 `POST /send`，`Content-Type: application/x-www-form-urlencoded`；服务端输出含 `referrer` | 表单默认值 + `form` 关联 |
| 选择两个 .txt 后点击“发送文件” | `POST /send`，`Content-Type: multipart/form-data`；服务端出现两个 `files = <file ...>` | `multiple` + `formenctype` |
| 删除 `referrer` 的 `form` 属性后提交 | 服务端输出没有 `referrer`；`referrer.form` 为 `null` | 关联失败 |
| 把“预览”按钮改成 `type="button"` | 点击不产生请求 | 覆盖只对提交按钮生效 |

文件选择需要手动操作；如果只想验证服务端，可以用 curl 直接发送一个文件：

```bash
curl -X POST -F "nickname=Lin" -F "files=@note.txt" http://127.0.0.1:8000/send
```

服务端会显示 `files = <file 'note.txt', N bytes>`，其中 `N` 是文件字节数。文件名和字节数来自 multipart part，不是浏览器界面。

### 3. 失败与恢复

| 注入的错误 | 观察 | 恢复 |
|------------|------|------|
| 删除昵称的 `label` | `placeholder` 仍在，但字段没有持久标签；输入后提示消失 | 恢复 `label`；`placeholder` 只放格式示例 |
| 删除 `referrer` 的 `form` 属性 | `referrer.form` 为 `null`；提交没有 `referrer` | 加回 `form="signup"` |
| 把“预览”按钮改成 `type="button"` | 点击无请求 | 改回 `type="submit"` |
| 去掉“发送文件”按钮的 `formenctype` | 请求变回 urlencoded；文件字段不会以文件 part 出现 | 加回 `formenctype="multipart/form-data"` |
| 给两个控件写相同 `id` | `form` 关联和 `label` 可能指向错误元素；`getElementById` 只返回第一个 | 保证 id 唯一；用 `form.elements` 核对 |

出现差异时，先看 Network 的方法、URL、Content-Type 和请求体，再看 Console 的 `form`、`validity`、`activeElement`；不要只根据页面外观判断。

### 4. 验证记录

2026-11-14 在 macOS 的 Chrome 157.0.8103.79 和 Python 3.9.6 中核对：用本地 HTTP 页面读取 `document.activeElement.id` 为 `nickname`，`referrer.form.id` 为 `signup`，多个邮箱值的 `checkValidity()` 为 `true`；自动提交后服务端分别收到 `GET /preview`、`POST /send` 的 urlencoded 和 multipart 请求，字段包含外部关联的 `referrer`；删除 `form` 属性后，`POST /send` 不再包含 `referrer`。文件字节用 curl 的 multipart 请求核对，服务端显示文件名和字节数。

未验证：具体屏幕阅读器对 `placeholder` 与 `label` 的朗读结果、真实手机上 `inputmode` 弹出的键盘类型、文件选择器对 `accept` 的实际过滤，以及 `formtarget="_blank"` 在各浏览器中的弹窗拦截行为。本篇没有运行 Nu HTML Checker，因为本机没有可用的 Java 运行时。
