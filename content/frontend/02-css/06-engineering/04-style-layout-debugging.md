---
title: "CSS 样式与布局排错"
tags:
  - CSS
  - 调试
  - 开发者工具
excerpt: "按资源、匹配、有效性、层叠和布局约束组织排错，通过独立页面注入路径错误、选择器不匹配、无效变量与 Flex 长文本故障，收集证据并在源码修复后复测。"
---

# CSS 样式与布局排错

CSS 的“没有生效”可能发生在**加载、匹配、值有效性、层叠或布局约束**中的任意位置。开发者工具把这些位置分别展示，排错应逐步收敛到具体声明和条件。

## 一、按处理位置查证据

| 位置 | 观察工具 | 主要问题 |
|------|----------|----------|
| 样式资源 | Network、Sources | 文件是否加载、路径是否正确 |
| 规则匹配 | Elements 的 Styles | 目标选择器和条件是否适用 |
| 声明有效性 | Styles 的无效标记 | 属性名、值及变量替换是否合法 |
| 层叠 | 被划线声明、来源与层 | 哪条声明胜出，输在哪一步 |
| 解析与布局 | Computed、盒模型、Flex/Grid 面板 | 参考量、最小尺寸和空间分配 |

开发者工具中的显示名称可能随版本变化，但观察对象一致。临时取消声明只用于检验假设，不会自动修改原文件。

::: tip 先建立最小复现
保留触发问题的结构、内容和必要声明，再减少无关代码。减少时每次核对故障是否仍存在，避免删掉真正的触发条件。
:::

## 二、独立故障页面

在空目录 `css-debug` 新建 `index.html` 和 `styles.css`，用现代浏览器打开。初始版本故意包含三个错误：通知颜色不匹配、变量替换后无效、长文本阻止 Flex 收缩。

HTML 完整内容如下：

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>样式诊断</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <p class="notice">通知文字应为绿色。</p>
  <div class="panel">内边距应为 12px。</div>
  <div class="row">
    <span class="message">https://example.com/articles/very-long-unbroken-address</span>
    <button type="button">打开</button>
  </div>
</body>
</html>
```

:::

CSS 完整内容如下：

::: details 查看 styles.css 故障版本

```css [styles.css]
body { color: #202124; font-family: sans-serif; }
.notification { color: #166534; }
.panel {
  --space: green;
  padding: 12px;
  padding: var(--space, 8px);
  border: 1px solid;
}
.row { display: flex; width: 240px; gap: 8px; margin-top: 16px; }
.message { flex: 1 1 0; white-space: nowrap; }
.row button { flex: 0 0 auto; }
```

:::

页面中的故障文字是检查对象的说明，不是已经修复的结果。通知没有变绿，面板没有期望内边距，网址与按钮超出预期一行宽度。

## 三、加载与匹配故障

### 1. 注入路径错误

1. 把 HTML 中 `href` 临时改为不存在的 `style.css`，刷新。
2. 观察样式请求失败，且原有规则不再出现在 Styles 面板。
3. 恢复 `styles.css`，刷新后确认边框和 Flex 规则重新出现。

这里证明失败发生在加载。缓存、网络请求与构建输出路径需要按实际环境检查，不能靠提高选择器权重解决。

### 2. 选择器不匹配

选中通知段落，实际类名是 `.notice`，样式写成 `.notification`，因此规则根本不匹配。把选择器改为 `.notice`，刷新后文字应为绿色。

::: warning 规则不存在与声明被划线不同
规则不存在时先查加载、条件和匹配；规则存在而声明被划线时才比较层叠。直接添加 `!important` 无法让不匹配的选择器命中元素。
:::

## 四、变量无效与尺寸异常

### 1. 计算时无效的内边距

在 Styles 中追踪 `--space`，得到 `green`。这个变量存在，但不适合作为内边距；`var()` 不会使用 `8px` 回退，胜出的声明在替换后无效。

页面已打开时，可在控制台核对解析值：

```js
const panel = document.querySelector('.panel');
getComputedStyle(panel).paddingTop; // "0px"
```

把 `--space` 改为 `12px`，刷新后应得到 `12px`。前一条 `padding: 12px` 不会在计算时无效后自动重新成为胜出声明，机制见[自定义属性](../02-style-computation/07-custom-properties.md)。

### 2. Flex 自动最小尺寸

选中 `.message`，确认它是直属 Flex 项目，`flex-shrink` 允许收缩。再检查 `min-width: auto` 与不可断开的文本，找到阻止收缩的内容下限。

把以下局部修复写回样式文件，保留原先的 `flex` 设置：

```css
.message {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

网址可以收缩并以省略号显示，按钮保持可见。需要完整网址时，也可改为允许换行；选择哪种方式取决于内容需求。

::: info 数字相同不代表测量对象相同
Computed 中的宽度是属性解析值，盒模型面板展示内容、内边距与边框，边界矩形还可能包含变换。对照前先说明自己测的是什么。
:::

## 五、修复与复测

1. 保存源码并重新打开页面，排除临时开发者工具修改。
2. 确认样式文件加载、通知变绿、内边距解析为 `12px`。
3. 增长或缩短网址，按钮始终可见，文本按选择的规则处理。
4. 在 `390px` 与 `1440px` 视口及文字放大条件下检查溢出。
5. 用 Tab 到达按钮，确认焦点没有被裁掉。

根因记录应包含失败位置、有效证据和对应修复。浮层裁剪与上下文诊断见[遮挡问题排查](../04-stacking-context/04-overlap-debugging.md)，开发者工具的操作参考 [Chrome CSS 调试文档](https://developer.chrome.com/docs/devtools/css)。
