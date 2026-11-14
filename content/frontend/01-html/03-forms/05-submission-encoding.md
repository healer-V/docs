---
title: "表单提交与数据编码"
tags:
  - HTML
  - 表单
  - 数据编码
excerpt: "从提交入口和字段条目解释原生表单的请求构造，对照 GET、POST、URL 编码与 multipart，并用独立本地回显服务核对中文、重复字段、控件状态和文件字节数。"
date: 2026-11-14
---

# 表单提交与数据编码

输入框中有文字、文件控件中显示文件名，都只说明浏览器中的控件有了当前状态。**提交时，浏览器先从符合条件的控件构造有序字段条目，再把条目按选定方式编码成请求。** 接收端是否收到这些内容，需要观察请求和响应，不能从控件外观推断。

一个字段条目由名称和值组成，值可以是文本，也可以是文件。它不是只能保留一个值的字典：两个勾选的同名复选框，可以形成两个同名条目。提交入口、控件状态、请求方法和编码各自影响不同环节，排查时要把它们分开。

::: info 本篇的范围
本篇讲原生表单的提交入口、字段条目和三种编码方式，并给出一个只在本机回显请求的 Python 工具。控件类型见[input 基本输入控件](./02-basic-inputs.md)，选择控件见[选择控件与文本域](./03-select-textarea.md)，按钮与控件状态见[按钮与控件状态](./04-buttons-control-state.md)。`required`、`pattern` 等原生校验归第 5 章；接收工具不涉及框架、数据库、认证、持久化或生产部署。
:::

## 一、从提交动作到 HTTP 请求

### 1. 声明目标、方法和响应位置

原生表单可以直接发出 **HTTP 请求**，即浏览器向某个地址发送的消息。请求包含方法、目标地址、描述内容的头部，以及按方法决定是否使用的请求体（承载提交数据的字节内容）。服务器处理后返回响应，浏览器再显示响应内容；这不要求先写 JavaScript。

下面是局部表单标记，可放在普通文档的 `body` 中；`/echo` 必须由服务提供，单独双击文件并不会创建这个接收地址。

```html
<form action="/echo" method="post"
      enctype="application/x-www-form-urlencoded" target="_self">
  <label>文本 <input name="query" value="中文"></label>
  <button type="submit">提交</button>
</form>
```

`action` 指定提交目标。相对地址按照文档的基准地址解析，例如从 `http://127.0.0.1:8000/submission.html` 提交到 `/echo`，目标是同一主机和端口下的 `/echo`。省略 `action` 时使用当前文档地址；路径解析的基础见[链接与路径](../02-content-elements/04-links-paths.md)。

`method` 指定请求方法。普通网络表单的 `get` 把编码后的字段放入 URL 查询部分，`post` 把字段放入请求体；省略时采用 `get`。`enctype` 指定 POST 请求体的编码方式，缺省为 `application/x-www-form-urlencoded`。不能用 `method="put"` 扩展出任意 HTTP 方法；`dialog` 属于对话框行为，不是这里的网络提交方式。

`target` 决定响应显示在哪个浏览上下文中，例如 `_self` 在当前页面显示，`_blank` 请求新的上下文，也可以指定已有命名窗口或框架。它不决定字段内容，也不决定接收端如何处理数据。上述属性的定义见 [MDN：form](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form)。

### 2. 按钮与 Enter 的提交入口

激活属于该表单的提交按钮，会以这个按钮为提交发起者。浏览器依据当时的控件状态构造条目；若按钮有 `name`，还会带上这个按钮的 `name` 和 `value`。同一表单里的其他提交按钮不会一起发送，普通按钮和重置按钮也不因为有 `name` 就变成提交字段。

在支持隐式提交的平台上，文本控件获得焦点后按 Enter，可以触发默认提交按钮。默认按钮是按树顺序属于该表单的第一个提交按钮；它必须能被激活且未禁用。不能把这条规则概括成“任何控件按 Enter 都提交”，例如多行 `textarea` 中的 Enter 用于换行。

没有提交按钮时，标准还根据表单中会阻止隐式提交的输入控件数量判断是否提交；多个普通文本输入框不能据此保证按 Enter 会提交。如果第一个提交按钮被禁用，也不能假定浏览器会自动改用第二个。依据见 [HTML 标准：隐式提交](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission)。

本例不使用 `required` 等约束，也没有脚本拦截提交，因此可以集中观察请求构造。原生校验与程序化提交的差异归表单校验主题；按钮类型及状态操作见[按钮与控件状态](./04-buttons-control-state.md)。

## 二、哪些控件会形成字段条目

### 1. 名称、状态与当前值共同决定结果

对于这里使用的普通控件，浏览器按控件顺序检查是否属于当前表单、是否禁用、是否有非空 `name`，再按控件类型取值。`id` 用于文档中的身份与标签关联，不代替提交名称；仅仅给输入框写 `id="query"`，不会产生名称为 `query` 的条目。

下表描述的是提交那一刻的状态，不是只看源码中的初始 `value`、`checked` 或 `selected`：

| 控件或状态 | 条目构造结果 |
|------------|--------------|
| 有名称的普通文本框，值为空 | 保留该名称，值为空字符串 |
| 没有 `name`，或名称为空 | 不生成普通字段条目 |
| 实际处于禁用状态 | 不生成条目，即使仍能看到原值 |
| 支持 `readonly` 的只读文本框 | 仍按当前值生成条目，只读限制不等于禁用 |
| 未选中的 checkbox 或 radio | 不生成该选项的条目，不自动发送 `false` |
| 已选中的 checkbox 或 radio | 生成其名称及 `value`；未声明 `value` 时默认值为 `on` |
| `select` 中已选中且未禁用的 option | 每个符合条件的选项形成一个条目 |
| 本次使用的提交按钮 | 有非空名称时，生成该按钮的名称和值 |
| 未使用的提交按钮、普通按钮、重置按钮 | 不作为本次提交条目 |

禁用还可能来自外层 `fieldset` 的规则，不只取决于控件自己有没有 `disabled`。只读的适用范围也不是所有控件；这里用支持它的普通文本框比较请求结果，不把 `readonly` 当作复选框或下拉框的通用状态。[禁用属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/disabled)与[只读属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/readonly)的区别直接影响字段是否缺失。

### 2. 同名多值与空值不能随意合并

若两个复选框都叫 `category`，值分别为 `plain` 和 `compact`，勾选后会产生 `category=plain` 与 `category=compact` 两个条目。多选列表同样可以产生多个同名条目。接收端若简单转成只容纳一个同名键的字典，就会丢掉部分信息；这是接收方式的问题，不能据此说浏览器只提交了最后一个值。

空值和缺失字段也不同。`empty=` 表示有一个名称为 `empty` 的空文本条目；没有 `ignored` 条目则表示该名称没有参与这次构造。接收工具需要保留空值，才能检查“用户留空”与“控件未提交”的区别。复选框的提交规则可参见 [MDN：checkbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/checkbox)。

### 3. 文件条目有单独的空状态

有名称且未禁用的文件控件，即使没有选中文件，也会形成一个空文件条目：文件名为空、内容为零字节。在 multipart 编码中，它仍以文件分段出现。若选中了一个名为 `empty.txt` 的零字节文件，内容也是零字节，但文件名不为空，因此两种情况可以区分。

真正选中文件时，条目包含该文件；这仍不代表请求已经到达服务器。浏览器不会提交输入控件显示的 `C:\fakepath\...` 作为可信本地路径，接收端也不能把客户端给出的文件名当作安全的磁盘保存地址。完整条目规则见 [HTML 标准：构造条目列表](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constructing-the-entry-list)。

## 三、条目怎样编码进请求

### 1. GET 与 POST 的 URL 编码

`application/x-www-form-urlencoded` 把文本名称和值组成 `name=value`，不同条目之间用 `&` 分隔。同名条目仍逐个保留。空格编码为 `+`，原本的加号编码为 `%2B`；中文按 UTF-8 字节进行百分号编码，解码后才能恢复原文字。

例如，名称为 `query`、值为 `中文 +`，再加一个空值和两个同名选项，对应的编码片段是：

```text
query=%E4%B8%AD%E6%96%87+%2B&empty=&category=plain&category=compact
```

这只是编码片段，不是完整 HTTP 请求。GET 把它放到目标 URL 的 `?` 后，POST 使用相同编码时把它放入请求体，并发送 `Content-Type: application/x-www-form-urlencoded`。`Content-Type` 是说明请求体格式的 HTTP 头；它不是表单字段。[URL 标准](https://url.spec.whatwg.org/#application/x-www-form-urlencoded)定义了这种序列化与解析方式。

GET 提交会按字段条目设置目标 URL 的查询部分，不能假定它总是接在 `action` 已有查询参数后面。需要随 GET 提交的固定值应成为有名称的字段，例如 `input type="hidden"`，不要依赖 `action="/echo?version=1"` 保留该查询。表单中的多行文本在这里编码时会规范为回车符（CR）加换行符（LF）组成的 CRLF 换行，在原始编码中可观察到 `%0D%0A`。

文件条目转为 URL 编码时，只用文件名作为文本值，不包含文件内容。选择 `note.txt` 后出现 `attachment=note.txt`，证明的是文件名到达，不能据此宣布文件内容已上传。POST 使用这种编码也有同样边界，不能只把 `method` 改成 `post` 就完成文件传输。[HTML 标准：提交编码](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#form-submission-algorithm)说明了方法与编码的组合。

::: warning POST 不提供保密性
POST 把字段放入请求体，避免字段直接出现在提交 URL 中，但请求体仍可被浏览器工具和接收端读取。传输保密需要 HTTPS 等条件，服务端仍需验证输入；隐藏字段、只读字段和客户端的禁用状态都不能充当安全校验。本地示例只使用非敏感观察值。
:::

### 2. multipart 与文件内容

`multipart/form-data` 把不同条目编码为多个分段，每个分段携带名称；文件分段还带文件名和文件内容。使用网络表单传送文件内容时，通常应组合 `method="post"` 与 `enctype="multipart/form-data"`。GET 仍按查询编码处理，不会因为写了 multipart 就在 GET 请求中附带文件体。

浏览器会生成用于分隔各段的 **boundary**，并把相同边界写进请求头的 `Content-Type` 参数。接收端依靠这项参数识别分段，不能手工把它当作固定字符串；不同提交的 boundary 和总请求体字节数不必相同。文件内容之外还有分段头与边界，因此一个三字节文件产生的 multipart 请求体明显大于三字节。分段格式见 [RFC 7578](https://www.rfc-editor.org/rfc/rfc7578.html)。

### 3. text/plain 适合直接查看，不适合通用解析

`text/plain` 把条目写成逐行的 `名称=值`，不按 URL 编码那样保护分隔字符。值本身包含等号或换行时，仅凭文本行很难可靠还原字段边界，所以它可用于有限调试，不宜当作通用接收格式。接收端也不能把它交给 URL 编码解析器处理。

完整示例会单独提交含等号、空格和多行值的纯文本。观察工具仅回显原文，不把一个简化的“按行拆分”算法冒充可靠字段解析。三种编码的用途及请求形态也可对照 [MDN：发送表单数据](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Sending_and_retrieving_form_data)。

## 四、准备独立的本地观察环境

### 1. 安装检查与文件准备

在自己新建的空目录 `html-submission` 中创建 `submission.html` 和 `receiver.py`，均以 UTF-8 保存。前者只包含原生表单，后者负责提供页面和回显请求；所有代码都在下面给齐，不需要学习或安装后端框架。

::: info Python 只用于运行接收工具
本例实际验证环境是 macOS、Python 3.9.6 与 Chrome 157.0.8103.79，日期为 2026-11-14。接收代码使用 Python 标准库，不依赖 `cgi`。无需先掌握 Python 语法：按文件名保存代码、在该目录运行命令并读取 JSON 输出即可。实际使用其他版本时应重新核对结果，不把本次验证当作所有版本的测试结论。
:::

在终端中进入这个空目录。macOS/Linux 检查命令如下，预期输出 `Python 3.x.x`；Windows 可使用 `py -3 --version`。

```sh
python3 --version
```

若命令不存在，先从 [Python 官方下载页](https://www.python.org/downloads/)安装 Python 3，再重新打开终端核对。3.9.6 是本次已有环境的实测记录，不要求为了复制示例安装旧版本。

`submission.html` 的第一张表单用于比较提交方式；第二张表单独立观察纯文本，不共享字段。页面声明 UTF-8，第一张表单的 `accept-charset="UTF-8"` 也明确提交所用字符编码。它没有约束校验属性，也不包含按钮级 `form*` 覆盖属性。

::: details 查看 submission.html 完整内容

```html [submission.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>表单条目与编码</title>
</head>
<body>
  <h1>字段条目观察</h1>
  <form id="probe" action="/echo" method="get"
        enctype="application/x-www-form-urlencoded" target="_self"
        accept-charset="UTF-8">
    <p><label>文本 <input name="query" value="中文 +"></label></p>
    <p><label>空文本 <input name="empty" value=""></label></p>
    <fieldset>
      <legend>同名复选框</legend>
      <label><input type="checkbox" name="category" value="plain" checked>普通</label>
      <label><input type="checkbox" name="category" value="compact" checked>紧凑</label>
      <label><input type="checkbox" name="category" value="extra">补充</label>
    </fieldset>
    <fieldset>
      <legend>单选框</legend>
      <label><input type="radio" name="mode" value="basic" checked>基本</label>
      <label><input type="radio" name="mode" value="extended">扩展</label>
    </fieldset>
    <p>
      <label>多选列表
        <select name="choice" multiple size="3">
          <option value="alpha" selected>甲</option>
          <option value="beta" selected>乙</option>
          <option value="blocked" selected disabled>禁用选项</option>
        </select>
      </label>
    </p>
    <p><label>只读 <input name="stamp" value="fixed" readonly></label></p>
    <p><label>禁用 <input name="ignored" value="disabled-value" disabled></label></p>
    <p><label>只有 id <input id="local-only" value="no-name"></label></p>
    <input type="hidden" name="version" value="1">
    <p><label>多行文本 <textarea name="note" rows="2" cols="20">第一行
第二行</textarea></label></p>
    <p><label>文件 <input type="file" name="attachment"></label></p>
    <button type="submit" name="send" value="first">提交一</button>
    <button type="submit" name="send" value="second">提交二</button>
    <button type="reset" name="reset-control" value="reset">重置</button>
    <button type="button" name="plain-control" value="plain">普通按钮</button>
  </form>

  <h2>纯文本编码对照</h2>
  <form id="plain" action="/echo" method="post" enctype="text/plain">
    <p><label>含分隔字符 <input name="query" value="a=b &amp; 中文"></label></p>
    <p><label>多行值 <textarea name="note" rows="2" cols="20">一
二</textarea></label></p>
    <button type="submit">提交纯文本</button>
  </form>
</body>
</html>
```

:::

再创建 `receiver.py`。工具只监听本机回环地址 `127.0.0.1`，只读指定页面；对 POST 先检查整个请求体不超过 64 KiB，再解析。文件只在内存中计数字节，不写入磁盘。返回值采用 JSON，即由名称、值、列表等组成的文本数据格式；`entries` 是列表，所以能保留重复名称。

::: details 查看 receiver.py 完整内容

```python [receiver.py]
from email import policy
from email.parser import BytesParser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qsl, urlsplit
import json
import sys


ROOT = Path(__file__).resolve().parent
MAX_BODY = 64 * 1024  # 64 KiB，计算整个请求体，不只是文件内容。


def text_entries(encoded):
    """把 URL 编码字符串转成有序条目列表；保留空值与同名值，无副作用。"""
    return [
        {"name": name, "value": value}
        for name, value in parse_qsl(
            encoded, keep_blank_values=True, encoding="utf-8", errors="strict"
        )
    ]


def multipart_entries(content_type, body):
    """解析本例的 multipart，返回文本条目或文件元信息，不保存文件。

    content_type: 浏览器发送的 Content-Type，必须含 boundary。
    body: 已限制大小的完整请求体字节；只支持扁平表单和 UTF-8 文本。
    返回按原顺序排列的列表；不完整或嵌套的消息抛出 ValueError。
    """
    prefix = ("Content-Type: " + content_type + "\r\n\r\n").encode("ascii")
    message = BytesParser(policy=policy.default).parsebytes(prefix + body)
    if not message.get_boundary() or not message.is_multipart() or message.defects:
        raise ValueError("multipart 缺少有效边界或内容不完整")
    entries = []
    for part in message.iter_parts():
        if part.is_multipart() or part.defects:
            raise ValueError("本工具只接受完整的扁平表单")
        if part.get_content_disposition() != "form-data":
            raise ValueError("分段不是 form-data")
        name = part.get_param("name", header="content-disposition")
        if name is None:
            raise ValueError("分段缺少 name")
        payload = part.get_payload(decode=True) or b""
        filename = part.get_filename()
        if filename is None:
            entries.append({"name": name, "value": payload.decode("utf-8")})
        else:
            entries.append({
                "name": name, "filename": filename,
                "content_type": part.get_content_type(), "bytes": len(payload)
            })
    return entries


class Receiver(BaseHTTPRequestHandler):
    def send_bytes(self, status, content_type, payload):
        """发送响应，无返回值；写入当前连接。

        status: HTTP 状态码；content_type: 响应媒体类型。
        payload: 已编码的响应字节，其长度用于 Content-Length。
        """
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def send_json(self, status, data):
        """把 data 编成 UTF-8 JSON 响应，无返回值。

        status: HTTP 状态码；data: 可由 json.dumps 编码的观察结果。
        副作用：调用 send_bytes 写入当前连接。
        """
        payload = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_bytes(status, "application/json; charset=utf-8", payload)

    def do_GET(self):
        """处理页面读取或 GET 回显，无返回值；只读本目录指定的 HTML。"""
        address = urlsplit(self.path)
        if address.path in ("/", "/submission.html"):
            try:
                payload = (ROOT / "submission.html").read_bytes()
            except FileNotFoundError:
                self.send_json(404, {"error": "receiver.py 同目录缺少 submission.html"})
                return
            self.send_bytes(200, "text/html; charset=utf-8", payload)
        elif address.path == "/echo":
            self.send_json(200, {
                "method": "GET", "path": self.path,
                "content_type": self.headers.get("Content-Type"),
                "body_bytes": 0, "entries": text_entries(address.query)
            })
        else:
            self.send_json(404, {"error": "没有这个路径，请检查 action"})

    def do_POST(self):
        """接收 /echo 的有限大小请求体并回显，无返回值；上传只驻留内存。"""
        if urlsplit(self.path).path != "/echo":
            self.send_json(404, {"error": "没有这个路径，请检查 action"})
            return
        try:
            length = int(self.headers.get("Content-Length", "-1"))
        except ValueError:
            length = -1
        if length < 0:
            self.send_json(411, {"error": "需要有效的 Content-Length"})
            return
        if length > MAX_BODY:
            self.send_json(413, {"error": "请求体超过 64 KiB，请选择更小的文件"})
            return
        body = self.rfile.read(length)
        content_type = self.headers.get("Content-Type", "")
        media_type = content_type.split(";", 1)[0].strip().lower()
        result = {
            "method": "POST", "path": self.path,
            "content_type": content_type, "body_bytes": len(body)
        }
        try:
            if media_type == "application/x-www-form-urlencoded":
                result["entries"] = text_entries(body.decode("utf-8"))
            elif media_type == "multipart/form-data":
                result["entries"] = multipart_entries(content_type, body)
            elif media_type == "text/plain":
                # 纯文本存在分隔歧义，保留原文，不冒充通用字段解析器。
                result["raw_text"] = body.decode("utf-8")
            else:
                self.send_json(415, {"error": "本工具不支持这个 Content-Type"})
                return
        except (ValueError, UnicodeError) as error:
            self.send_json(400, {"error": str(error)})
            return
        self.send_json(200, result)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    with ThreadingHTTPServer(("127.0.0.1", port), Receiver) as server:
        print("打开 http://127.0.0.1:{}/submission.html".format(server.server_port), flush=True)
        print("按 Ctrl+C 停止；文件内容不会保存到磁盘。", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("服务已停止。", flush=True)
```

:::

这个工具用 `urllib.parse.parse_qsl` 保留空值及重复字段，用 `email.parser.BytesParser` 按请求头识别 multipart 分段。后者原本用于解析 MIME 消息，即能表达内容类型和分段的消息格式。这里的接收工具只接受浏览器生成的扁平表单、UTF-8 文本与小文件，不承诺一般上传服务的健壮性、恶意输入处理或生产并发能力。实现依据见 [Python：urllib.parse](https://docs.python.org/3.9/library/urllib.parse.html#urllib.parse.parse_qsl)、[email.parser](https://docs.python.org/3.9/library/email.parser.html)和 [http.server](https://docs.python.org/3.9/library/http.server.html)。

在同一目录执行下面一行，创建内容恰好为 ASCII 字符 `abc` 的 `note.txt`，以及零字节的 `empty.txt`。不要用会自动补换行的编辑操作改变 `note.txt`，否则字节数也会变化；Windows 把命令开头的 `python3` 换成 `py -3`。

```sh
python3 -c "from pathlib import Path; Path('note.txt').write_bytes(b'abc'); Path('empty.txt').write_bytes(b'')"
```

### 2. 启动页面与请求观察

仍在 `html-submission` 目录中运行；Windows 使用 `py -3 receiver.py`。

```sh
python3 receiver.py
```

终端应出现以下两行，随后保持运行等待浏览器请求：

```text
打开 http://127.0.0.1:8000/submission.html
按 Ctrl+C 停止；文件内容不会保存到磁盘。
```

在 Chrome 打开这个 HTTP 地址，而不是双击 HTML。按 `F12`，macOS 可用 `Option+Command+I`，打开 Network 面板并勾选 Preserve log，保留提交导致页面跳转之前的请求。界面名称会受语言设置影响；重点是找到 `/echo` 请求的 Headers、Payload 和 Response。

如果启动时报地址已占用，不要结束未知进程。先在自己已启动的旧服务终端按 `Ctrl+C`；也可以运行 `python3 receiver.py 8001`，并把浏览器地址的端口改成 `8001`。表单使用同源的 `/echo`，无需另改 `action`。若页面报告缺少 `submission.html`，检查两个文件是否确实位于同一目录。

## 五、逐项对照请求与回显

### 1. GET：核对条目，而不是只看表单外观

初次打开页面后，不选文件，点击“提交一”。预期当前页面显示 JSON：`method` 为 `GET`，`body_bytes` 为 `0`；地址栏和 Network 中的 Request URL 包含查询字段，Payload 中可查看解码后的查询参数。JSON 的 `path` 保留原始编码，`entries` 是接收端解码后的结果。响应状态码 `200` 表示本工具成功处理了请求，状态码可在 Headers 中查看。

以下是默认状态下应有的字段内容；同名行在实际 `entries` 中保留为不同条目：

| 名称 | 预期值或缺失原因 |
|------|------------------|
| `query` | `中文 +`，用于核对 UTF-8、空格与加号 |
| `empty` | 空字符串，说明空值没有被解析器丢掉 |
| `category` | `plain` 和 `compact` 两条；`extra` 未勾选而省略 |
| `mode` | `basic`；未选中的 `extended` 不出现 |
| `choice` | `alpha` 和 `beta` 两条；已选但禁用的 `blocked` 被省略 |
| `stamp` | `fixed`，只读没有排除条目 |
| `ignored`、`local-only` | 均不存在，前者禁用，后者只有 `id` 没有 `name` |
| `version` | `1`，有名称的隐藏控件仍参与提交 |
| `note` | 两行文本，原始查询中的换行是 `%0D%0A` |
| `attachment` | 空字符串，空文件条目转成 URL 编码后只留下空文件名 |
| `send` | `first`；不是两个提交按钮一起发送 |

回到 `submission.html` 的完整地址并重新载入，点击“提交二”，预期只有提交按钮条目变成 `send=second`。再次载入，在“文本”输入框按 Enter，当前测试环境预期触发“提交一”，对应 `send=first`。输入框改成其他文字再提交，接收的是修改后的当前值，不是始终发送源码初始值。

“重置”和“普通按钮”不发出提交请求：前者按原生规则恢复默认状态，后者在没有脚本的本例中没有额外动作。若观察不到 `/echo`，先区分按钮是否本来就不会提交，不要先认定接收程序出错。

### 2. POST URL 编码：条目相同，位置不同

编辑 `submission.html`，只把第一张表单的 `method="get"` 改为 `method="post"`，保留 URL 编码。保存后在浏览器重新打开页面，再点击“提交一”；不要在已有 JSON 响应页上刷新来代替重新进入表单。

预期 Network 中方法为 POST，Request URL 是 `/echo`，不再用查询携带这些条目；Request Headers 有 `application/x-www-form-urlencoded`，Payload 中是编码后的请求体。回显的 `method` 为 `POST`，`body_bytes` 大于零，默认文本条目仍与 GET 对照相同。

选择 `note.txt` 后再提交，回显中 `attachment` 仍只是文本值 `note.txt`，没有文件字节数。这证明“POST”和“传送文件内容”是两项不同条件。若地址栏看不到字段，却在 Payload 和回显中存在，字段没有丢失，只是位置改变。

### 3. multipart：区分未选择、零字节和小文件

保留 POST，再把第一张表单的 `enctype` 改成 `multipart/form-data`，保存并重新打开页面。依次做三次提交，每次都从表单页面进入：不选文件、选择 `empty.txt`、选择 `note.txt`。

预期 Request Headers 的 Content-Type 包含浏览器生成的 boundary，Payload 的文本字段仍包含重复名称。接收端的三个文件条目摘录汇集如下：

```json
[
  {"name":"attachment","filename":"","content_type":"application/octet-stream","bytes":0},
  {"name":"attachment","filename":"empty.txt","content_type":"text/plain","bytes":0},
  {"name":"attachment","filename":"note.txt","content_type":"text/plain","bytes":3}
]
```

数组中的三项来自分别提交的请求，不表示同一文件控件一次提交了三个文件。文件媒体类型还受浏览器对文件类型的判断影响，上述 `text/plain` 是本次环境的预期与实测值；判断文件是否有内容，应核对 `bytes`，不能只看媒体类型。multipart 请求体的 `body_bytes` 包含所有字段、分段头和边界，不等于文件的 `bytes`。

::: tip 对照请求头和文件回显一起判断
看到 `attachment` 只带文件名时，先检查请求是否使用 POST 和 multipart；看到 `filename=""`、`bytes=0` 时，先检查是否确实选中了文件。仅更改文件控件的 `value` 属性不能替代用户选择文件，也不能证明上传成功。
:::

### 4. 纯文本：直接观察分隔歧义

重新进入页面，点击第二张表单的“提交纯文本”，不需要改第一张表单。预期请求方法为 POST，Content-Type 为 `text/plain`；回显中没有解析出来的 `entries`，而是 `raw_text`。

`raw_text` 解码后相当于下面的文本；JSON 查看器会把换行显示为 `\r\n` 等转义序列：

```text
query=a=b & 中文
note=一
二
```

第二个等号属于第一个字段的值，“二”也不是第三个字段。这说明若接收端只按等号和换行拆分，会把合法输入解释错。工具保留原文，是为了显示编码本身的边界。

## 六、根据请求证据定位并恢复

### 1. 路径、方法和编码错误

把第一张表单的 `action` 临时改成 `/missing`，保存并重新进入表单提交。预期请求到达服务器，但返回 HTTP `404` 与“没有这个路径，请检查 action”；恢复 `/echo` 后沿相同入口重新提交，应回到 `200` 回显。404 表明请求目标没有对应处理，不等于控件未产生条目。

若把 HTML 中的 `method` 错写成 `put`，Nu 会报告无效值；浏览器仍按缺省 GET 行为处理，不会因此发出 PUT。检查时同时看源码和实际 Request Method，恢复合法的 `post` 后重新进入表单提交，应观察到 POST。这种 HTML 声明错误与服务端不支持 POST 是不同原因。

如果 POST 返回 `501 Unsupported method ('POST')`，检查启动命令是否误用了 `python3 -m http.server`。普通静态文件服务能够显示 HTML，但没有这里的 POST 接收逻辑。只停止自己误启的服务，再使用 `python3 receiver.py` 并从表单重新提交；GET 能显示页面不能证明 POST 接收已经准备好。

若文本正常而文件只有名字，核对 Network 的请求方法及 Content-Type，再恢复 POST 与 multipart。若某个文本名称完全缺失，回到它的 `name`、禁用状态、选中状态和所属表单逐项检查；若同名值只剩一项，应同时检查接收端有没有覆盖列表。浏览器发送与服务端解析是两个取证位置，不能只修改其中一个就宣布原因已确定。

### 2. 请求大小和验证边界

工具把整个 POST 请求体限制为 64 KiB。可在当前目录运行下面的命令创建大小恰为 64 KiB 的观察文件，Windows 同样替换 Python 命令前缀：

```sh
python3 -c "from pathlib import Path; Path('oversized.bin').write_bytes(b'x' * 65536)"
```

使用 POST multipart 选择它并提交，文件内容加上其他字段和编码开销后必然超过上限，预期得到 `413`，且工具不解析或保存文件。换回三字节的 `note.txt` 再提交，应恢复 `200` 和 `bytes: 3`。这是观察工具的限额，不是 HTML 或浏览器对所有上传的统一大小限制。

以下为 2026-11-14 的实际验证记录；“预期”描述规则推导，“实测”只描述本次已观察到的环境，不代替其他浏览器或生产服务的结论：

| 对照 | 实测结果 |
|------|----------|
| 默认 GET 与两个提交按钮、文本框 Enter | URL 查询与回显条目一致；两个按钮分别出现 `first`、`second`，Enter 使用 `first` |
| 中文、空值、同名多值与控件状态 | 中文加号还原，空值保留；复选框和多选值均保留；无名称、禁用及未选中项省略，只读项保留 |
| POST URL 编码 | 请求体与回显一致；所选文件仅留下文件名 |
| POST multipart 三种文件状态 | 文件名分别为空、`empty.txt`、`note.txt`，字节数分别为 0、0、3 |
| text/plain | 原始请求体与 `raw_text` 一致，未冒充可靠字段解析 |
| 错误路径、静态服务与大小上限 | 分别观察到 404、POST 501、413；按上述方式恢复后重新得到 200 |
| Nu HTML Checker | 完整 HTML 无错误、无警告；`method="put"` 反例报告 1 个属性值错误，恢复合法方法后无错误、无警告 |

Nu 可通过[在线检查器](https://validator.w3.org/nu/)上传文件，它能检查标记是否合法，但不会代替服务器接收文件，也不会检查你的接收端是否丢掉重复字段。当前浏览器验证覆盖 HTTP 请求、编码与回显；没有验证 Firefox、Safari、移动设备、真实文件选择对话框或生产上传能力。

观察结束后，在运行 `receiver.py` 的终端按 `Ctrl+C`，看到“服务已停止。”再关闭终端。页面停止可访问是本地观察服务已退出的结果；已创建的三个观察文件可按需删除，接收服务没有另行保存上传副本。
