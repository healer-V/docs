---
title: "CSS 顶层与浮层"
tags:
  - CSS
  - dialog
  - popover
excerpt: "区分普通定位浮层与浏览器顶层，比较模态 dialog 和非模态 popover 的语义及交互，通过独立页面验证打开、关闭、背景、Escape 和焦点返回，并说明兼容与可访问性边界。"
---

# CSS 顶层与浮层

**浮层**是界面中覆盖其他内容的呈现形式，普通浮层仍受其祖先的层叠与裁剪条件影响。**顶层**（top layer）是浏览器管理的特殊呈现范围，位于文档普通层叠上下文之上。

顶层不是一个可以用 `z-index` 填写的极大整数。元素通过模态 dialog、打开的 popover、全屏等特定机制进入顶层，DOM 结构并不因此搬到另一个父元素中。

## 一、按交互语义选择浮层

| 方式 | 层级范围 | 对其他内容的交互影响 |
|------|----------|----------------------|
| 普通定位元素 | 文档上下文 | 由作者实现相关交互 |
| `dialog.show()` 或 `<dialog open>` | 普通文档层级 | 非模态，不自动阻断其他页面内容 |
| `dialog.showModal()` | 顶层 | 当前文档其他内容成为不可交互的背景 |
| 打开的 `popover="auto"` | 顶层 | 非模态，支持常见的轻关闭行为 |

**模态**要求用户先处理当前交互；**非模态**允许继续操作页面其他内容。popover 不会因为位于顶层，就自动变成模态对话框。

::: warning 不要只为提高层级而使用模态窗口
`showModal()` 同时改变焦点和背景交互。选择它应因为任务确实需要模态语义，而不是因为普通元素的 `z-index` 不够大。
:::

## 二、独立打开与关闭示例

### 1. 创建页面

使用支持 `HTMLDialogElement.showModal()` 和 Popover API 的现代浏览器。在空目录 `top-layer` 新建 `index.html`，直接打开，不需要外部依赖。相关 API 见 [HTML dialog](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element) 和 [HTML popover](https://html.spec.whatwg.org/multipage/popover.html)。

页面同时包含被裁剪的普通提示、模态窗口和非模态提示。完整内容如下：

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>浮层比较</title>
  <style>
    body { font-family: sans-serif; }
    .host { position: relative; z-index: 1; height: 80px; overflow: hidden; }
    .ordinary { position: absolute; top: 60px; padding: 12px; background: #e7f6ee; }
    dialog, [popover] { max-width: calc(100% - 32px); padding: 20px; }
    dialog::backdrop { background: rgb(0 0 0 / 0.35); }
    button:focus-visible { outline: 2px solid green; outline-offset: 2px; }
  </style>
</head>
<body>
  <button id="open-dialog" type="button">打开设置</button>
  <button type="button" popovertarget="help">显示主题信息</button>
  <div class="host"><div class="ordinary">当前主题：浅色。</div></div>
  <dialog id="settings" aria-labelledby="settings-title">
    <h2 id="settings-title">页面设置</h2>
    <p>当前主题：浅色。</p>
    <form method="dialog"><button autofocus>关闭</button></form>
  </dialog>
  <div id="help" popover="auto">当前主题：浅色。</div>
  <script>
    const settings = document.querySelector('#settings');
    const opener = document.querySelector('#open-dialog');
    /** 点击打开按钮时进入模态状态；无返回值，改变窗口与焦点状态。 */
    function openSettings() {
      settings.showModal();
    }
    opener.addEventListener('click', openSettings);
  </script>
</body>
</html>
```

:::

### 2. 检查三个不同结果

1. **普通提示**：它的底部被 `.host` 裁剪，增加自身 `z-index` 不能取消裁剪。
2. **打开设置**：dialog 进入顶层，完整内容可见，出现 `::backdrop`；焦点落到关闭按钮，背景控件暂时不可操作。
3. **关闭设置**：关闭按钮通过 `method="dialog"` 关闭窗口；也可以按 Escape 触发默认取消，关闭后检查焦点回到打开按钮。
4. **显示主题信息**：popover 进入顶层，但页面其他控件仍可操作；点击外部、再次点击触发按钮或按 Escape，可以按 `auto` 的关闭规则关闭它。

关闭行为仍可能被脚本取消或自定义；实际产品要核对事件处理，不应仅因使用原生元素就假定所有交互都正确。

::: tip 打开方式决定是否进入顶层
直接给 dialog 设置 `open`，不等于调用 `showModal()`。如果没有背景遮罩或背景仍可操作，先检查打开方式，再查 CSS。
:::

## 三、顶层的样式与排序

`::backdrop` 是顶层内容关联的背景伪元素，可设置颜色等外观。它不是普通 DOM 节点，不能当作页面里的一层 `<div>` 寻找。

多个顶层元素的顺序由浏览器维护，通常后加入的在前；元素内部仍有自己的层叠规则。给普通页面元素设置更大的 `z-index`，不能越过浏览器顶层。

顶层解决绘制范围，但不自动解决尺寸：长内容仍需要合理的最大尺寸和内部滚动。dialog 中的标题、关闭按钮、表单状态等也仍需符合正常 HTML 与可访问性要求。

## 四、失败与恢复检查

| 现象 | 首要证据 | 处理 |
|------|----------|------|
| `showModal` 不可用 | API 支持情况 | 选择支持的环境或经过验证的替代实现 |
| `showModal` 报状态异常 | dialog 是否已按非模态方式打开 | 先关闭，再按正确方式打开 |
| popover 按钮没有反应 | 支持情况与目标 ID | 核对 `popover`、`popovertarget` 和唯一 ID |
| 窗口打开但内容超出屏幕 | 盒尺寸与滚动范围 | 约束尺寸，并保留关闭操作可达性 |

::: info 键盘行为需要实际验证
至少检查打开焦点、Tab 导航、Escape、关闭按钮和焦点返回。原生机制提供基础行为，但嵌套浮层、长内容及应用脚本仍可能改变结果。
:::
