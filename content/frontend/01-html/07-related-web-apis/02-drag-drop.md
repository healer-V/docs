---
title: "拖放 API"
tags:
  - HTML
  - 拖放
  - DataTransfer
excerpt: "从可拖动词条、接收区域和按钮替代操作出发，解释 dragstart 写入数据、dragover 允许放置、drop 读取数据的时序，并复现缺少允许动作和写入时机错误，给出键盘可用的同等操作。"
date: 2026-11-14
---

# 拖放 API

HTML 拖放让页面内的元素可以被指针拖动，并把一段数据交给目标区域。它由三部分组成：**源**（被拖动的元素）、**数据**（拖动过程中携带的内容）、**目标**（接收放置的区域）。三者缺一，拖放就不会完成。

`draggable="true"` 只是声明“这个元素可以被拖动”，不会自动实现数据传递；目标是否接收、接收后做什么，都由事件处理决定。本篇用一个词条和一块接收区域走通完整链路，并给出不依赖拖动的按钮操作。

::: info 本篇的范围
本篇讲页面内拖放的事件时序、`DataTransfer` 文本传递与键盘替代操作。全局属性 `draggable` 的取值见[全局属性](../04-html5-semantics/03-global-attributes.md)。文件上传、桌面文件系统权限、跨应用拖放协议、排序组件和触摸手势库不在本篇展开。
:::

## 一、拖放模型与适用条件

### 1. 源、数据与目标各司其职

源负责在开始拖动时放入数据，目标负责在悬停与放置时决定是否接收，数据则在两者之间通过 `DataTransfer` 传递。只写 `draggable` 或只写 `drop` 监听，都只能完成一半。

### 2. draggable 只声明可拖动

`draggable="true"` 让元素进入可拖动状态，鼠标按住后可以拖出。它不定义数据格式，也不保证目标接受；图片和链接默认具有可拖动行为，其他元素需要显式声明。

### 3. 拖放不是唯一操作方式

拖放依赖指针设备与精细动作，键盘用户、触摸屏用户或运动障碍用户可能无法完成。凡是拖放能完成的操作，都应提供按钮、菜单或其他可聚焦的等价入口。

::: warning 不能只用拖放完成关键操作
“拖动排序”“拖入回收站”这类交互如果没有替代按钮，部分用户就无法使用。替代操作不是附加功能，而是同一任务的另一条入口。
:::

## 二、开始拖动与写入数据

### 1. dragstart 里调用 setData

拖动开始时触发 `dragstart`，在这里把要传递的内容写入 `DataTransfer`：

```js
word.addEventListener("dragstart", (event) => {
  event.dataTransfer.setData("text/plain", word.textContent);
});
```

第一个参数是 MIME 类型，页面内纯文本使用 `text/plain`。写入的是字符串，不是节点；接收方拿到的是文本副本，原元素不会自动移动。

### 2. 读取时机只能在 drop

`getData` 在拖动过程中通常读不到数据，浏览器出于安全考虑限制访问时机；只有在 `drop` 事件里读取才可靠。把 `setData` 写到 `dragover` 里也不能补救，因为那时已经错过了携带数据的阶段。

### 3. effectAllowed 与 dropEffect 表达意图

源可以设置 `effectAllowed`（如 `copy`、`move`），目标在 `dragover` 中设置 `dropEffect` 表达希望执行的操作。两者一致时指针旁的光标会给出提示，但**它们只是意图声明**，不会自动完成复制或删除。

### 4. dragend 用于收尾

无论放置成功还是被取消，源都会收到 `dragend`。适合在这里清理拖动中的临时样式或状态；不要在这里读取数据，因为放置结果已经确定。

## 三、目标接收：dragover 与 drop

### 1. dragover 必须取消默认动作

目标在 `dragover` 中调用 `event.preventDefault()`，才会被视为“允许放置”。不取消默认动作时，浏览器不会触发 `drop`：

```js
zone.addEventListener("dragover", (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
});
```

### 2. drop 中读取并处理数据

`drop` 触发后读取文本，并同样调用 `preventDefault()`，避免浏览器执行自己的默认动作（例如把文本当作导航内容）：

```js
zone.addEventListener("drop", (event) => {
  event.preventDefault();
  const text = event.dataTransfer.getData("text/plain");
  result.textContent = text;
});
```

### 3. 用 textContent 显示，不要拼 HTML

拖入的内容来自外部，可能包含尖括号或脚本片段。用 `textContent` 写入会按文字显示；用 `innerHTML` 拼接则会把内容当标记解析，带来注入风险。

### 4. 事件顺序可以核对

一次成功拖放通常依次出现 `dragstart`、多次 `dragover`、`drop`、`dragend`。记录事件名与数据，是判断“哪一步没生效”的直接证据。

## 四、从空目录完成词条移动

### 1. 创建 dnd.html

新建空目录 `html-dnd`，创建 UTF-8 文件 `dnd.html`。页面上有一个可拖动词条、一块接收区域、一个按钮和事件记录列表：

::: details 查看 dnd.html 完整内容

```html [dnd.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>拖放词条</title>
  <style>
    #word { display: inline-block; padding: 6px 12px; border: 1px solid #33475b; cursor: grab; }
    #zone { margin-top: 12px; padding: 24px; border: 2px dashed #8899aa; }
  </style>
</head>
<body>
  <h1>拖放词条</h1>
  <p>把这个词条拖到下方区域：</p>
  <p><span id="word" draggable="true">示例词条</span></p>
  <div id="zone">把词条拖到这里</div>
  <p><button id="move" type="button">用按钮移入词条</button></p>
  <p id="result" role="status">尚未接收</p>
  <h2>事件记录</h2>
  <ol id="log"></ol>
  <script>
    const word = document.getElementById("word");
    const zone = document.getElementById("zone");
    const result = document.getElementById("result");
    const log = document.getElementById("log");
    let dragOverLogged = false;

    /** 追加一条事件记录，避免重复刷屏；无返回值。 */
    function record(text) {
      const item = document.createElement("li");
      item.textContent = text;
      log.append(item);
    }

    /** 用纯文本显示接收结果，不解析成 HTML；无返回值。 */
    function showWord(text) {
      result.textContent = text === "" ? "没有收到文本" : "已接收：" + text;
    }

    word.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", word.textContent);
      event.dataTransfer.effectAllowed = "copy";
      dragOverLogged = false;
      record("dragstart：" + word.textContent);
    });

    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      if (!dragOverLogged) {
        record("dragover：允许放置");
        dragOverLogged = true;
      }
    });

    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      const text = event.dataTransfer.getData("text/plain");
      record("drop：读取到 " + JSON.stringify(text));
      showWord(text);
    });

    word.addEventListener("dragend", () => {
      record("dragend：拖放结束");
    });

    document.getElementById("move").addEventListener("click", () => {
      record("click：使用按钮");
      showWord(word.textContent);
    });
  </script>
</body>
</html>
```

:::

### 2. 用鼠标完成一次拖放

双击打开页面，按住“示例词条”拖到虚线区域后松开。结果应显示“已接收：示例词条”，事件记录依次出现 `dragstart`、`dragover`、`drop`、`dragend`。词条本身仍在原位，说明传递的是文本副本。

### 3. 只用键盘完成同一操作

把焦点移到“用按钮移入词条”并按 Enter 或空格，结果同样是“已接收：示例词条”，事件记录新增一条 `click：使用按钮`。这条路径不依赖指针位置，是拖放的等价入口。

### 4. 对照事件与结果

| 观察项 | 操作 | 本次结果 |
|--------|------|----------|
| 拖动结果 | 鼠标拖入接收区 | `已接收：示例词条` |
| 事件顺序 | 查看记录列表 | `dragstart` → `dragover` → `drop` → `dragend` |
| 数据内容 | `drop` 中 `getData` | `"示例词条"` |
| 按钮路径 | 聚焦按钮后按 Enter | 同一结果，新增 `click` 记录 |
| 原元素 | 放置后查看 | 仍在原位，未被移动或删除 |

## 五、失败定位与非拖拽环境

### 1. 目标不接收

删除 `dragover` 中的 `event.preventDefault()` 后重新拖放：本次记录只有 `dragstart`、`dragover`、`dragend`，没有 `drop`，结果保持“尚未接收”。这证明“允许放置”由目标显式声明，而不是拖动方单方面决定。

### 2. 数据为空

把 `setData` 从 `dragstart` 移到 `dragover` 后拖放：`drop` 仍然触发，但读取到空字符串，页面显示“没有收到文本”。数据必须在拖动开始时写入，接收方在放置时读取。

### 3. 默认动作与触摸环境

`drop` 中的 `preventDefault()` 用于阻止浏览器对放入内容的默认处理。本次去掉它后仍收到文本且页面未跳转，但默认动作取决于拖入的数据类型与目标，不能依赖“不取消也没事”。

触摸屏通常不触发这套鼠标拖放事件。需要触摸支持时，应另行设计手势或提供按钮操作，不能把桌面拖放直接当作移动端可用。

| 注入的问题 | 现象 | 处理 |
|------------|------|------|
| `dragover` 未取消默认动作 | 没有 `drop`，结果不变 | 补 `event.preventDefault()` |
| `setData` 写在 `dragover` | `drop` 读到空字符串 | 移回 `dragstart` |
| 用 `innerHTML` 显示拖入内容 | 标记被解析，存在注入风险 | 改用 `textContent` |
| 只提供拖放入口 | 键盘与触摸用户无法操作 | 增加按钮或其他可聚焦入口 |
| 期望拖放自动移动元素 | 原元素仍在原位 | 传递的是数据，移动需自行实现 |

### 4. 验证记录

以上文件于 2026-11-14 在 macOS 的 Chrome 157.0.8103.79 中核对。页面通过 `python3 -m http.server` 同源访问，用自动化指针完成从词条到接收区的拖放：结果为“已接收：示例词条”，事件顺序为 `dragstart`、`dragover`、`drop`、`dragend`，`getData` 读到 `"示例词条"`；按钮路径得到相同结果。删除 `dragover` 的取消动作后 `drop` 不触发；把 `setData` 移到 `dragover` 后读到空字符串。

`dnd.html` 经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。本次使用桌面 Chrome 与自动化指针，未验证真实鼠标手感、触摸屏、其他浏览器、跨窗口拖放或文件拖入。
