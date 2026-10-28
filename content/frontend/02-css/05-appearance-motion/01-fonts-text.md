---
title: "CSS 字体与文本"
tags:
  - CSS
  - 字体
  - 文本
excerpt: "介绍字体族、回退、字号、字重和字体资源声明，解释行高、空白、断行与文本装饰，通过长文本和字体不可用场景说明可读性及省略号成立的必要条件。"
---

# CSS 字体与文本

**字体样式**决定文字使用哪种字体及尺度，**文本样式**决定空白、换行、对齐和装饰。文本是否可读，还取决于字体是否可用、内容长度与容器空间。

## 一、字体选择与资源回退

### 1. 字体族、字号与字重

`font-family` 提供按顺序尝试的字体列表。字体不存在或缺少某个字形时，浏览器会选择后续字体，最终可落到通用字体族。

以下是局部正文样式，省略 HTML 文档外壳：

```css
body {
  font-family: system-ui, "Microsoft YaHei", sans-serif;
  font-size: 16px;
  line-height: 1.6;
}
h1 { font-size: 2rem; font-weight: 700; }
```

`system-ui` 使用系统界面字体，`sans-serif` 是通用无衬线字体族。相同页面在不同系统上出现字体和换行差异是正常的，不能依赖某种字体恰好占固定宽度。

字重可用 `normal`、`bold` 或数值。静态字体只有部分字重时，浏览器可能选择相近字重或合成效果；写 `600` 不保证加载了一个真实的 600 字重文件。

### 2. @font-face

`@font-face` 声明一个可供 CSS 使用的字体资源。以下局部示例尝试本机 Arial，不需要下载文件；不存在时保留系统回退：

```css
@font-face {
  font-family: "Document Sans";
  src: local("Arial");
  font-weight: 400;
  font-display: swap;
}
.text { font-family: "Document Sans", system-ui, sans-serif; }
```

使用网页字体文件时，需取得有使用许可的字体资源，再把 `src` 设置为对应的 `url(...)`。字体文件路径、跨域许可、字重描述和格式都必须匹配；本机字体示例不证明网络加载条件已经满足。

`font-display: swap` 允许先用回退字体呈现，再在字体可用时替换。替换可能改变字形宽度、行数和布局，字体加载也是布局稳定性的一部分。定义见 [CSS Fonts](https://www.w3.org/TR/css-fonts-4/)。

::: tip 为字体不可用保留可读结果
始终提供通用回退。可临时把本例的 `local("Arial")` 改为一个明确不存在的字体名，观察正文仍能显示；网络字体还需在工具中模拟请求失败和慢速加载。
:::

## 二、行高、间距与装饰

### 1. 无单位行高

`line-height: 1.6` 使用无单位倍率，后代继承这个倍率后按自身字号计算。固定长度行高可能让大字号后代沿用过小的行高。

| 写法 | 字号 `16px` 时 | 字号 `24px` 的继承子级 |
|------|---------------|------------------------|
| `line-height: 1.5` | `24px` | 按倍率得到 `36px` |
| `line-height: 24px` | `24px` | 仍可能继承 `24px` |

行盒还会受同行内容和基线影响，机制见[行内布局与行盒](../03-visual-formatting-model/04-inline-line-boxes.md)。

### 2. 文字间距与链接识别

`letter-spacing` 调整字符间距，`word-spacing` 调整词间距。中文、阿拉伯语等文字系统的表现不同，不能把增加间距当成适用于所有语言的默认优化。

`text-decoration` 提供下划线等装饰，可组合 `text-underline-offset` 调整距离。正文链接应保持清晰识别，不能只依赖用户分辨颜色。

下面是局部链接样式，假设页面有正文链接：

```css
.text a {
  color: #166534;
  text-decoration: underline;
  text-underline-offset: 0.15em;
}
```

## 三、空白与长文本

| 属性或值 | 主要用途 |
|----------|----------|
| `white-space: normal` | 合并常见空白，允许软换行 |
| `white-space: nowrap` | 合并空白，不进行软换行 |
| `white-space: pre-wrap` | 保留空白和换行，同时允许换行 |
| `overflow-wrap: anywhere` | 必要时打断长片段，参与内容最小尺寸判断 |
| `word-break: break-all` | 更强地允许词内断开，可能降低阅读体验 |

长网址优先考虑 `overflow-wrap`；代码或用户输入需要保留空白时选择适合的 `white-space`，不能只根据表面有没有换行判断。

::: warning 文本能换行，盒子也需要能收缩
Flex/Grid 项目的自动最小尺寸可能阻止盒子变窄。长文本溢出时，同时检查项目 `min-width` 和轨道约束，不能只添加断词属性。
:::

## 四、单行省略号的条件

`text-overflow: ellipsis` 只指定溢出标记，不会自动限制宽度或禁止换行。以下是局部样式，假设 `.summary` 是块级元素：

```css
.summary {
  max-width: 20rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

文字超出有限的行内空间时，末尾出现省略号。短文字不会为了显示省略号而被截断；普通不接受宽度约束的行内元素也不能直接套用这套条件。

检查时依次观察：

1. 容器实际行内尺寸是否有限。
2. 内容是否确实溢出，而不是整个盒子被撑宽。
3. 换行规则与 overflow 是否正确。
4. 被截断的重要内容是否仍有可操作的完整查看方式。

::: info 省略号不是内容删除
视觉截断不改变原始文本。关键操作名称、错误原因和必要信息应保持可获取，不能仅用鼠标悬停提示作为唯一补充方式。
:::

断行与装饰规则见 [CSS Text](https://www.w3.org/TR/css-text-3/) 和 [CSS Text Decoration](https://www.w3.org/TR/css-text-decor-3/)。
