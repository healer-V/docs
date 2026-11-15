---
title: "原生约束校验"
tags:
  - HTML
  - 表单
  - 约束校验
excerpt: "解释必填、长度、格式、类型和数值范围约束的组合，使用独立表单与本地回显核对有效、无效和跳过校验的请求，并说明自定义错误清除、程序化提交与服务端校验边界。"
date: 2026-11-14
---

# 原生约束校验

表单中的 `required`、`pattern`、`min` 等属性，不只是填写提示。浏览器会根据控件类型、当前值和适用属性判定它是否满足约束；正常提交时，只要有参与校验的控件无效，就会阻止这次原生提交。

判断校验行为需要分开三个问题：控件是否参加校验，当前值是否符合所有适用约束，以及这条提交路径是否执行校验。**字段无效不一定阻止所有发送方式，浏览器通过也不等于数据满足服务端规则。**

::: info 本篇的范围
本篇讲原生约束属性、有效性状态、正常提交时的拦截，以及程序化提交与服务端校验的边界。输入类型对值语义的影响见[新增 input 输入类型](./01-enhanced-input-types.md)，提交条目与编码见[表单提交与数据编码](../03-forms/05-submission-encoding.md)。完整正则语法、跨字段业务规则、异步远程校验和框架表单库不在本篇展开。
:::

## 一、约束取决于控件类型与状态

约束不是任意元素都能使用的一套通用属性。文本框可以限制文字长度，数值框可以限制范围和步长；把 `minlength` 写到 `type="number"` 上，不会把数值限制为几位数字。选择类型应先依据数据含义，类型和值格式见[新增 input 输入类型](./01-enhanced-input-types.md)。

常用属性的适用范围可以先按以下三组区分，再分别理解它们怎样判定值：

| 约束组 | 主要适用对象 |
|--------|--------------|
| `minlength`、`maxlength` | `textarea`，以及 text、search、tel、url、email、password 类型的 `input` |
| `pattern` | 上述六种文本类 `input`，不适用于 `textarea`、number 或 date |
| `min`、`max`、`step` | number、range 及日期时间类 `input`，例如 date、time、month、week、datetime-local |

`required` 还适用于复选框、单选框、文件控件、`select` 和 `textarea` 等；range、color、hidden 等类型不靠它要求用户补值。具体属性是否适用，要看类型定义，不能由浏览器保留了一个属性字符串就推定已经执行相应校验。[HTML：input 属性适用表](https://html.spec.whatwg.org/multipage/input.html#the-input-element)列出了这些关系。

控件状态同样重要。禁用控件、支持只读状态的只读文本框，以及隐藏类型的输入控件，都不参加这里的约束校验。脚本接口 `willValidate` 可以观察当前控件是否具有校验资格；它不表示当前值是否有效。

相反，**没有 `name` 不等于不校验**。一个属于表单的必填文本框即使没有提交名称，也能阻止正常提交；`name` 决定提交条目名称，与约束校验资格是两项规则。只读、禁用与提交字段的区别见[表单提交与数据编码](../03-forms/05-submission-encoding.md)，校验资格依据见 [HTML：约束校验](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constraints)。

## 二、必填、格式与范围怎样组合

### 1. 空值可选，required 才要求填写

没有 `required` 时，一个空的邮箱框不会仅因没有邮箱而触发格式错误；带 `minlength` 或 `pattern` 的可选文本框，也可以保持空值。用户一旦填写非空内容，就要满足相应的格式、长度等约束。

`required` 是布尔属性，写上就要求满足该类型的必填条件，`required="false"` 不能关闭它。普通文本框判断的是空字符串，不会替应用去除所有空格；只输入空格可以满足“非空”，却未必满足其他格式或服务端规则。

复选框和单选组的“必填”不同。一个 checkbox 带 `required`，要求的是它自己被勾选；即使多个 checkbox 同名，也不会变成“任选一个就行”。同一个表单、同一名称的 radio 组中，只要组内有必填要求，就必须有一个组员选中，不要求选中恰好带 `required` 的那一项。

`select required` 也需要合适的选择。例如单选下拉框把首项设为 `value=""`、显示“请选择”，在本例配置中选中该占位项不能满足必填。依据见 [MDN：required](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/required)。界面上应明确写出“必填”“可选”或组内选择要求，而不是让用户从报错倒推规则。

### 2. 文字长度检查有输入来源条件

`minlength="3" maxlength="5"` 表示允许的文字长度区间，两个值都应为非负整数，最小值不能大于最大值。长度按 UTF-16 码元计算，不必等于眼睛看到的字数；普通 ASCII 字符各占一个码元，一些表情符号会占两个或更多。因此完整例子使用 ASCII 文字隔离长度规则，不把“3 个码元”直接叫作“3 个任意文字”。

浏览器通常会在用户输入达到 `maxlength` 后限制继续输入，所以不一定先接受超长内容，再等提交时显示“过长”。`minlength` 也不自动附带必填要求：可选文本为空可以通过，用户输入非空但过短时才有长度问题。

::: warning 脚本赋值不能代替长度约束的用户输入测试
长度过短、过长的原生判定与值是否最后由用户编辑有关。用 `input.value = "ab"` 设置值，再调用 `checkValidity()`，不能据此推断用户实际输入 `ab` 时也会通过；脚本赋值不会触发同样的长度检查。检查输入路径时，应实际键入或粘贴，再核对结果。
:::

这是标准规定的条件，不是某种自动化工具的偶然差异。完整规则见 [HTML：输入长度](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fe-maxlength)和 [MDN：minlength](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/minlength)。

### 3. type 与 pattern 同时约束格式

`type="email"` 为非空邮箱输入提供基础格式约束，但不会检查邮箱是否存在。`tel` 没有一套通用电话号码格式约束；需要限定文本格式时，可以在适用的输入类型上声明 `pattern`。

下面是可放在表单中的局部标记：

```html
<label>格式文字（必填）
  <input name="code" required pattern="[A-Z]{2}[0-9]{2}">
</label>
```

`[A-Z]{2}` 要求两个大写英文字母，`[0-9]{2}` 要求两个数字，合起来允许 `AB12`。`pattern` 隐含整串匹配，不是只在输入中找到一小段即可，所以 `xAB12` 不能通过。属性里不写 JavaScript 正则字面量的 `/.../` 分隔符。

现行标准把 `pattern` 按 JavaScript 正则的 **`v` 模式**编译；它会影响 Unicode 和字符集合的解释，不能把旧的 `u` 模式配方无条件复制过来。字符集合里若要表达字面的连字符等特殊符号，需要按当前规则转义。本例只用容易解释的字母、数字区间和次数，不需要先学习完整正则语法。

无效正则不会建立有效的 pattern 约束；这可能使作者以为已经限制的非空文字通过。空的 `pattern=""` 则不同，它是有效空模式，非空值不能匹配。`pattern`、`required` 和类型格式约束也不会互相替代：空值由必填判断，非空值必须同时满足所有适用规则。编译与匹配依据见 [HTML：pattern](https://html.spec.whatwg.org/multipage/input.html#the-pattern-attribute)和 [MDN：现行模式规则](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/pattern)。

### 4. 范围与步长是两项数值条件

`min`、`max` 限定端点，`step` 限定允许值之间的间隔。例如以下局部控件允许 `1`、`3`、`5`、`7`、`9`，但 `2` 虽在范围内，仍不符合步长：

```html
<label>数值（必填，1 至 9，步长 2）
  <input name="amount" type="number" min="1" max="9" step="2" required>
</label>
```

这里的步长基准是 `min="1"`，要求值与 1 的差是 2 的整数倍，不能简单理解为“必须是偶数”。基准通常优先使用合法 `min`，其次使用源码中的合法 `value`，再使用该类型的默认基准；number 通常为 0。number 的缺省步长是 1，`step="any"` 解除步长间隔限制，但不解除 `min`、`max` 或必填要求。

日期时间类型使用各自的格式和步长单位：例如 date 按天，time 的 `step` 按秒且缺省为 60 秒。不能把数值控件的默认值和单位照搬到所有日期时间类型。空的可选数值框也不会仅因声明了 `min` 而变成必填。类型转换失败还可能形成无法解释输入的状态，不能只看屏幕上的字符就断言已经有合法数值。依据见 [MDN：step](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/step)与 [HTML：范围和步长](https://html.spec.whatwg.org/multipage/input.html#the-step-attribute)。

## 三、建立独立的校验与请求观察页

### 1. 保存页面和自定义错误脚本

在自己新建的空目录 `html-validation` 中创建 `validation.html`、`validation.js` 和稍后给出的 `receiver.py`，全部以 UTF-8 保存。表单各字段仅用于观察规则，不组成业务流程；HTML 的普通提交校验不依赖 JavaScript，脚本只为演示自定义错误设置与清除。

::: details 查看 validation.html 完整内容

```html [validation.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>原生约束校验观察</title>
  <script src="validation.js" defer></script>
</head>
<body>
  <h1>原生约束校验观察</h1>
  <form id="validation-form" action="/receive" method="post">
    <p>
      <label for="code">格式文字（必填）</label>
      <input id="code" name="code" required pattern="[A-Z]{2}[0-9]{2}"
             aria-describedby="code-hint code-error">
    </p>
    <p id="code-hint">输入两位大写英文字母加两位数字，例如 AB12。</p>
    <p id="code-error" role="alert"></p>
    <p>
      <label for="short-text">长度文字（必填，示例使用 3 至 5 个英文字母）</label>
      <input id="short-text" name="short_text" required minlength="3" maxlength="5">
    </p>
    <p><label>邮箱（可选） <input id="email" name="email" type="email"></label></p>
    <p>
      <label for="amount">数值（必填，1 至 9，步长 2）</label>
      <input id="amount" name="amount" type="number" min="1" max="9" step="2" required>
    </p>
    <fieldset>
      <legend>复选条件</legend>
      <label><input id="must-check" type="checkbox" name="check" value="must" required>必须勾选</label>
      <label><input id="extra-check" type="checkbox" name="check" value="extra">附加选项（可选）</label>
    </fieldset>
    <fieldset>
      <legend>模式（必选一项）</legend>
      <label><input id="mode-a" type="radio" name="mode" value="a" required>甲</label>
      <label><input id="mode-b" type="radio" name="mode" value="b" required>乙</label>
    </fieldset>
    <p><label>选项（必选）
      <select id="choice" name="choice" required>
        <option value="">请选择</option>
        <option value="first">第一项</option>
      </select>
    </label></p>
    <p><label>补充文字（可选，示例使用 2 至 8 个英文字母）
      <textarea id="note" name="note" minlength="2" maxlength="8"></textarea>
    </label></p>
    <p><label>只读观察 <input id="locked" name="locked" value="fixed" readonly></label></p>
    <p><label>禁用观察 <input id="disabled-probe" name="disabled_probe" disabled required></label></p>
    <input id="hidden-probe" type="hidden" name="marker" value="hidden-value">
    <button id="normal-submit" type="submit" name="route" value="normal">正常提交</button>
    <button id="skip-submit" type="submit" name="route" value="skip" formnovalidate>跳过浏览器校验</button>
    <button id="set-error" type="button">设置自定义错误</button>
    <button id="clear-error" type="button">清除自定义错误</button>
  </form>
</body>
</html>
```

:::

HTML 给出了标签、填写说明和错误文本的位置。`aria-describedby="code-hint code-error"` 把格式框关联到说明及错误文字，`role="alert"` 为动态错误提供通知语义；这些属性不替代 `required` 或 `pattern` 的实际校验。

::: info 程序化补充所需的 JavaScript 深度
只需理解变量保存元素引用、`querySelector` 按选择器查找元素、方法调用，以及函数可以注册为按钮回调。`.validity` 等状态在对应操作处说明。本篇给齐脚本；系统学习入口是 [JavaScript 的组成与运行位置](../../03-javascript/01-foundation/01-composition-and-runtime.md)、[DOM 查询与修改](../../03-javascript/09-browser-apis/01-dom-query-mutation.md)、[MDN：DOM 脚本入门](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/DOM_scripting)和[事件入门](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Events)。
:::

::: details 查看 validation.js 完整内容

```js [validation.js]
const code = document.querySelector("#code");
const errorText = document.querySelector("#code-error");

/** 为格式文字设置演示错误；无返回值，更新校验状态、关联文字和 ARIA 状态。 */
function setError() {
  const message = "这是演示自定义错误，请清除后重新提交。";
  code.setCustomValidity(message);
  errorText.textContent = message;
  code.setAttribute("aria-invalid", "true");
}

/** 清除本例的自定义错误；无返回值，不改变 HTML 原有约束和用户输入。 */
function clearError() {
  code.setCustomValidity("");
  errorText.textContent = "";
  code.removeAttribute("aria-invalid");
}

const setButton = document.querySelector("#set-error");
const clearButton = document.querySelector("#clear-error");
setButton.addEventListener("click", setError);
clearButton.addEventListener("click", clearError);
```

:::

`setCustomValidity` 设置的是参与校验的自定义错误状态，不只是画面上的一行字；`textContent`、`aria-invalid` 则分别更新可读错误文本和相应语义。清除时必须同时恢复状态与提示，具体观察在后面的 API 对照中进行。这里没有拦截 `submit` 或自己发起异步请求。

### 2. 启动本篇的本地接收工具

要证明“浏览器是否发出请求”，需要一个真实接收地址。下面的工具使用 Python 标准库，只监听 `127.0.0.1`，提供上述两个文件并回显小型 URL 编码请求，不保存数据。它刻意不验证字段内容，用来显示浏览器限制可以被绕过；返回 `200` 只表示工具接收并回显了请求。

在这个目录的终端执行 `python3 --version`，应得到 Python 3 的版本号；Windows 可用 `py -3 --version`。若命令不存在，先从 [Python 官方入口](https://www.python.org/downloads/)安装 Python 3，再重新打开终端检查。本例实际使用 Python 3.9.6 验证，不要求安装该旧版本，也没有验证所有其他版本。

::: details 查看 receiver.py 完整内容

```python [receiver.py]
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qsl, urlsplit
import json
import sys


ROOT = Path(__file__).resolve().parent
MAX_BODY = 16 * 1024  # 只接收本例的小型文本请求体，上限 16 KiB。


class Receiver(BaseHTTPRequestHandler):
    def reply(self, status, content_type, body):
        """发送一次响应，无返回值；写入当前连接。

        status: HTTP 状态码；content_type: 响应媒体类型。
        body: 已编码的响应字节，长度用于 Content-Length。
        """
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def json_reply(self, status, value):
        """把观察结果写成 JSON，无返回值。

        status: HTTP 状态码；value: 可被 JSON 编码的数据。
        副作用：编码为 UTF-8 后通过 reply 写入当前连接。
        """
        body = json.dumps(value, ensure_ascii=False, indent=2).encode("utf-8")
        self.reply(status, "application/json; charset=utf-8", body)

    def do_GET(self):
        """提供本例两个指定文件，无返回值；只读取 receiver.py 同目录文件。"""
        routes = {
            "/": ("validation.html", "text/html; charset=utf-8"),
            "/validation.html": ("validation.html", "text/html; charset=utf-8"),
            "/validation.js": ("validation.js", "text/javascript; charset=utf-8")
        }
        route = routes.get(urlsplit(self.path).path)
        if route is None:
            self.json_reply(404, {"error": "请打开 /validation.html 并检查文件名"})
            return
        filename, content_type = route
        try:
            body = (ROOT / filename).read_bytes()
        except FileNotFoundError:
            self.json_reply(404, {"error": "同目录缺少 " + filename})
            return
        self.reply(200, content_type, body)

    def do_POST(self):
        """回显 /receive 的 URL 编码字段，无返回值；不保存数据或验证字段规则。"""
        if urlsplit(self.path).path != "/receive":
            self.json_reply(404, {"error": "接收路径应为 /receive"})
            return
        try:
            length = int(self.headers.get("Content-Length", "-1"))
        except ValueError:
            length = -1
        if not 0 <= length <= MAX_BODY:
            self.json_reply(413, {"error": "请求体长度无效或超过 16 KiB"})
            return
        media_type = self.headers.get("Content-Type", "").split(";", 1)[0]
        if media_type != "application/x-www-form-urlencoded":
            self.json_reply(415, {"error": "本例只接收 URL 编码文本"})
            return
        try:
            raw = self.rfile.read(length).decode("utf-8")
            pairs = parse_qsl(raw, keep_blank_values=True, errors="strict")
        except (ValueError, UnicodeError):
            self.json_reply(400, {"error": "无法按 UTF-8 解码字段"})
            return
        self.json_reply(200, {
            "method": "POST", "path": self.path,
            "fields": [{"name": name, "value": value} for name, value in pairs],
            "note": "仅回显请求，未执行服务端字段或业务校验。"
        })


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    with ThreadingHTTPServer(("127.0.0.1", port), Receiver) as server:
        print("打开 http://127.0.0.1:{}/validation.html".format(server.server_port), flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("服务已停止。", flush=True)
```

:::

该脚本只读取同目录的两个指定文件；`parse_qsl` 保留空字段与同名多值，回显的 `fields` 是名称和值的列表。工具说明见 Python 的 [http.server](https://docs.python.org/3.9/library/http.server.html)与 [urllib.parse](https://docs.python.org/3.9/library/urllib.parse.html)，这里不需要先学习后端框架或数据保存。

仍在 `html-validation` 目录运行以下命令；Windows 将 `python3` 换成 `py -3`：

```sh
python3 receiver.py
```

预期终端显示 `打开 http://127.0.0.1:8000/validation.html` 并保持等待。打开该 HTTP 地址，在 Chrome 按 `F12`，macOS 可用 `Option+Command+I`，进入 Network 面板并勾选 Preserve log，保留提交跳转前的请求。先清空日志，然后关注方法为 POST、路径为 `/receive` 的请求，避免把读取页面或脚本的请求误当作提交。

若端口占用，先停止自己启动的旧服务；不能结束未知进程。也可运行 `python3 receiver.py 8001`，并将浏览器地址改成端口 `8001`，相对 `action` 会自动使用该端口。若页面或脚本返回 404，检查三个文件是否同目录、文件名是否一致。误用普通 `python3 -m http.server` 能显示页面，但没有本例的 POST 回显逻辑，提交会遇到不支持方法的响应，应停止自己误启的服务后改用 `receiver.py`。

## 四、观察有效输入、阻止与跳过

### 1. 正常提交先校验，再发送

初始空表单点击“正常提交”，预期至少有必填控件无效，浏览器将焦点移向需要处理的字段，并提供它自己的反馈；Network 中没有这次 `/receive` POST。输入一个字符时，控件状态可能已经变化，但浏览器不必每输入一次就显示同样的错误气泡。填写过程中是否提示、提交时是否阻止，是不同的观察项。

用下面这组有效值建立对照：格式文字 `AB12`，长度文字 `abc`，数值 `3`，勾选“必须勾选”，选择模式“甲”及“第一项”；邮箱和补充文字留空。点击正常提交，预期发出 POST `/receive`，当前页面显示 JSON 回显，包含这些值和 `route=normal`。只读字段也会形成条目，禁用字段不会进入条目；这与它们都不参加校验并不矛盾。

返回完整表单地址，分别从这组有效值只改一项，其他条件保持满足，才能确认哪个规则导致阻止：

| 单项改动 | 预期原因与恢复方式 |
|----------|--------------------|
| 格式文字改为 `xAB12` | 不满足整串模式；恢复 `AB12` |
| 实际键入长度文字 `ab` | 小于最小长度；补成 `abc` |
| 邮箱填写 `plain` | 非空但不满足 email 格式；清空或改为 `a@example.test` |
| 数值改为 `0` 或 `11` | 超出最小值或最大值；恢复 `3` |
| 数值改为 `2` | 在范围内但步长不符；改为 `3` |
| 只勾选“附加选项” | 不能代替那个单独必选的 checkbox；勾选“必须勾选” |
| 清除模式选择或保留“请选择” | 缺少该组或下拉框的必需选择；选择相应有效项 |

同名 radio 正常界面不能通过点击已选项把整组取消；测试空组应重新打开初始表单，再填写其他字段。每次无效提交后都核对没有 POST，再恢复值并确认 POST 出现，不能仅从提示有无推测请求是否被阻止。

### 2. 跳过交互校验不会让值自动有效

重新进入表单，不填写必填内容，点击“跳过浏览器校验”。该按钮的 `formnovalidate` 跳过这次提交前的交互校验，预期仍发出 POST 并得到 `route=skip`。接收工具会回显空值，这正是它没有承担服务端字段检查的结果。

另把 HTML 中的 `<form>` 开始标签加上布尔属性 `novalidate`，保存后重新进入表单，点击普通“正常提交”，同样允许发出请求。前者只影响对应的提交按钮，后者影响表单的交互提交校验；它们不删除 `required` 等约束，也不会把 `.validity.valid` 改成 `true`。恢复测试时移除 `novalidate`，重新进入页面再提交空表单，应重新被阻止。

填写提示及按钮级覆盖的基础见[新增表单属性](./02-enhanced-form-attributes.md)；这里对照的是校验是否执行，而不是改写请求编码或目标。

## 五、用状态与必要 API 定位问题

### 1. checkValidity 与 reportValidity 不会提交

在尚未提交的表单页面打开 Console，以下表达式都不发送表单数据：

```js
document.querySelector("#code").willValidate
document.querySelector("#code").validity.valueMissing
document.querySelector("#validation-form").checkValidity()
document.querySelector("#validation-form").reportValidity()
```

初始格式框参与校验，所以第一项为 `true`；它为空且必填，第二项也为 `true`。表单还有无效控件，后两项返回 `false`。`checkValidity()` 执行检查，失败时触发相应 `invalid` 事件；它不负责显示浏览器默认反馈。`reportValidity()` 除了检查，还请求浏览器向用户报告问题。这两个 API 可以在控件或表单上调用，均不等于提交。

`.validity` 返回一组错误状态：例如格式不符可读 `patternMismatch`，邮箱格式错误为 `typeMismatch`，过短为 `tooShort`，越界为 `rangeUnderflow` 或 `rangeOverflow`，步长不符为 `stepMismatch`。`.validity.valid` 表示这些错误条件都未成立；多个规则可以同时不满足，不能把它当成只会出现一个原因的编号。

读取 `.validationMessage` 可以得到浏览器为当前错误准备的本地化提示，或者自定义消息。**不要依赖固定的系统文案、语言和界面外观来判断哪条规则失败。** 应结合约束属性、状态与请求记录；空的提示也可能因为控件不参加校验。接口依据见 [ValidityState](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState)、[checkValidity](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/checkValidity)与 [reportValidity](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/reportValidity)。

可以用同样方式读取 `#locked`、`#disabled-probe`、`#hidden-probe` 的 `.willValidate`，本例中都为 `false`。这说明的是校验资格，不意味着三个控件在可编辑性、可见性或提交条目方面都相同。

### 2. 自定义错误必须显式清除

先把全部必填条件填好，点击“设置自定义错误”。脚本调用 `code.setCustomValidity(非空消息)` 后，`.validity.customError` 变为 `true`，正常提交被阻止；相关错误文字也会显示在格式框旁。

即使把 `AB12` 改成另一个符合模式的 `CD34`，自定义错误仍然存在。浏览器不知道这条应用设置的消息何时不再成立，不能把“用户改过字了”自动等同于错误已清除。点击“清除自定义错误”，脚本实际执行 `setCustomValidity("")`，并清理对应文字和状态，再正常提交应恢复请求。

::: tip 清除自定义错误只清除这一项
`setCustomValidity("")` 不会解除 HTML 的必填、模式或范围限制。若字段仍为空或格式错误，清除后仍应被原生约束阻止。只删除画面上的错误文字，也不会清除 `customError`；状态和提示必须同步维护。
:::

实际应用应在重新计算对应条件后设置或清除消息，而不是长期保留一个已经失效的错误。本例通过两个按钮分开操作，是为了把这个状态变化直接显示出来，未建立复杂的跨字段规则。接口说明见 [setCustomValidity](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/setCustomValidity)。

### 3. requestSubmit 与 submit 走不同路径

在完整表单页面的 Console 中执行：

```js
document.querySelector("#validation-form").requestSubmit(
  document.querySelector("#normal-submit")
)
```

`requestSubmit` 按请求提交的路径处理，传入正常提交按钮时会进行交互校验。空表单被阻止；满足条件后才发送请求，并带上该按钮的提交条目。若指定的是带 `formnovalidate` 的按钮，或表单已有 `novalidate`，跳过规则仍然生效；不能概括成“调用 requestSubmit 就绝不会绕过”。

另从空表单页面执行下面一行，预期仍会产生请求：

```js
document.querySelector("#validation-form").submit()
```

`submit()` 直接走提交路径，不触发约束校验，也不触发 `submit` 事件；它没有一个被使用的提交按钮，因此这次也不产生 `route` 按钮条目。正常交互提交若在校验阶段失败，同样不会到达 `submit` 事件阶段，不能只用某个提交监听器没运行来认定脚本读取失败。

在新代码中，若希望保留与正常按钮相应的校验流程，应选择合适的 `requestSubmit` 调用；还要避免给控件取 `name="submit"` 或 `id="submit"`，覆盖表单的同名方法。差异见 [requestSubmit](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/requestSubmit)与 [submit](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit)。这些是当前 API 的行为，不把它们统一当作最初 HTML5 同时新增的能力。

## 六、提示与接收端各自承担什么

### 1. 错误要能定位和修正

用户需要知道哪个字段有问题、要求是什么、怎样修正。可见 `label`、常驻格式说明和与控件关联的错误文本，不能仅用红色边框或一闪而过的气泡替代。本例的自定义消息使用 `aria-describedby` 关联，同时设置 `aria-invalid`，让错误不只依赖颜色；这些状态应随着错误清除而恢复。

原生提示有帮助，但文案、展示时机和焦点反馈会随浏览器、语言及用户环境变化。自定义完整错误界面时还需考虑键盘定位、错误摘要与辅助技术通知，不能从单次 `reportValidity()` 返回 `false` 就宣布完成无障碍验收。设计依据见 [WAI：表单错误通知](https://www.w3.org/WAI/tutorials/forms/notifications/)。

### 2. 按实际输入和请求验证，再划定边界

本例于 2026-11-14 在 macOS、Chrome 157.0.8103.79、Python 3.9.6 中核对。以下是本次实际结果，不固定浏览器系统提示文案：

| 对照 | 实测结果 |
|------|----------|
| 空表单、错误模式/邮箱、用户输入过短、越界与步长错误 | 对应状态成立，正常提交未发出 `/receive` POST；修正后能提交 |
| 可选邮箱和文本为空，必填组选择符合要求 | 不产生额外格式错误，有效表单发出请求并得到回显 |
| 用户键入长度与脚本赋值 | 用户过短触发 `tooShort`，最大长度限制继续输入；脚本短值或超长值未产生相同长度错误 |
| 正常提交、跳过按钮、novalidate、两个程序化入口 | 校验路径与预期一致；绕过时原约束仍在，实际收到无效字段 |
| 设置、修改字段、清除自定义错误 | 修改为合法格式后 `customError` 仍在；清空消息后恢复提交，其他原生限制保留 |
| 检查 API 与接收工具 | check/report 返回状态但不发送；请求是否到达另由 Network 与回显核对 |
| 本地 Nu 26.11.9（0f0f1f9） | 完整 HTML 无错误、无警告；`minlength="-1"` 的错误源码被报告；恢复合法属性后通过 |

需要复核标记时，可按 [Nu 官方工具说明](https://validator.github.io/validator/)选择本地检查器。标记合法、用户当前输入有效、接收端接受数据，是三个不同结论；Nu 不会替你提交表单或执行所有浏览器交互。

另一个带 `required` 的对照把长度设为 `minlength="6" maxlength="5"`，本次 Nu 没有报告两者矛盾；浏览器实际限制键入到 5 个 ASCII 字符后，仍因小于 6 而不能正常提交。检查器通过不能替代约束组合判断。这一对照针对必填控件的非空用户输入，可选空值仍按前述规则处理。

::: warning 接收端必须重新检查输入和权限
浏览器约束能够改善填写过程，却可以被关闭、改写或通过其他客户端绕过。接收端仍需检查字段类型、长度、范围和格式，以及当前用户的权限与实际业务条件。邮箱格式通过不证明邮箱存在，HTTP `200` 也不证明已经通过这些检查；本篇回显工具尤其没有执行它们。
:::

当前证据没有覆盖其他浏览器、移动键盘、真实屏幕阅读器或生产服务端校验。观察结束后，在本例服务终端按 `Ctrl+C`，看到“服务已停止。”即可退出。
