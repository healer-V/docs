---
title: "CSS 响应式与条件查询"
tags:
  - CSS
  - 响应式
  - 容器查询
excerpt: "解释流动约束与内容驱动断点，比较媒体查询、容器查询和特性查询，通过独立页面展示同一列表在不同区域中的布局，并说明 viewport、图片约束和回退策略。"
---

# CSS 响应式与条件查询

**响应式布局**让页面在空间、输入条件和用户偏好变化时继续可用。基础是可伸缩尺寸与合理的内容约束，条件查询则在需要时切换规则。

**断点**是规则改变的条件，不必对应某个设备名称。应先观察内容何时拥挤、溢出或出现过长行，再决定在哪里切换布局。

## 一、三种条件查询

| 查询 | 参照什么 | 适用问题 |
|------|----------|----------|
| `@media` | 视口、媒体或用户偏好 | 页面主结构、减少动效等 |
| `@container` | 符合条件的祖先容器 | 同一组件在不同位置适配 |
| `@supports` | 浏览器是否接受某项 CSS 能力 | 增强功能与基础回退 |

### 1. 媒体查询

以下是局部 CSS，在较宽视口下切换页面结构：

```css
.layout { display: grid; gap: 24px; }
@media (min-width: 64rem) {
  .layout { grid-template-columns: minmax(0, 1fr) 18rem; }
}
```

条件为假时仍有单列基础布局。`pointer`、`hover` 查询可判断输入能力，但不能据此认定用户永远只使用鼠标或触摸；键盘反馈仍应保留。

### 2. 容器尺寸查询

`container-type: inline-size` 建立行内尺寸查询容器。`@container` 为其后代选择符合条件的祖先容器，不是让容器按自己的尺寸直接查询自身。

以下是局部 CSS，`.items` 位于 `.region` 中：

```css
.region { container-type: inline-size; }
.items { display: grid; gap: 12px; }
@container (min-width: 28rem) {
  .items { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
```

只有所在区域足够宽，列表才变为两列。同一个视口中，主区域与侧栏因此可以得到不同结果。需要限定特定祖先时，可设置 `container-name` 并在查询中指定名称。

::: warning 建立查询容器会引入尺寸包含
容器需要从外部布局获得合适的宽度，不能再完全依赖被查询子内容反过来决定它的行内尺寸。若查询没生效，先检查容器声明、祖先选择与实际宽度。
:::

## 二、独立响应式页面

### 1. 创建 HTML 与样式

在空目录 `responsive-layout` 新建 `index.html` 和 `styles.css`，用现代浏览器直接打开 HTML。完整示例不使用框架或其他文件。

`index.html` 包含移动端 viewport 元信息，避免移动浏览器先用较宽的布局视口排版再缩小显示：

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>响应式列表</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main class="layout">
    <section class="region">
      <h1>主区域</h1>
      <ul class="items"><li>布局</li><li>文字</li><li>颜色</li></ul>
    </section>
    <aside class="region" aria-label="关联主题">
      <h2>侧区域</h2>
      <ul class="items"><li>布局</li><li>文字</li><li>颜色</li></ul>
    </aside>
  </main>
</body>
</html>
```

:::

`styles.css` 先提供单列，再分别增强主结构与列表：

::: details 查看 styles.css 完整内容

```css [styles.css]
* { box-sizing: border-box; }
body { margin: 0; font-family: sans-serif; color: #202124; }
.layout {
  display: grid;
  gap: 24px;
  width: min(calc(100% - 32px), 70rem);
  margin: 24px auto;
}
.region { min-width: 0; container-type: inline-size; }
h1, h2 { font-size: 24px; }
.items { display: grid; gap: 12px; padding: 0; list-style: none; }
.items li { padding: 12px; border: 1px solid #9ca3af; }
@media (min-width: 64rem) {
  .layout { grid-template-columns: minmax(0, 1fr) 18rem; }
}
@container (min-width: 28rem) {
  .items { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
```

:::

### 2. 观察不同空间

保持默认根字号 `16px`，在开发者工具的设备模式中验证：

| 视口宽度 | 页面主结构 | 主区域列表 | 侧区域列表 |
|---------:|------------|------------|------------|
| `390px` | 单列 | 单列 | 单列 |
| `768px` | 单列 | 两列 | 两列 |
| `1440px` | 主侧两列 | 两列 | 单列 |

在 `1440px` 视口中，两组列表面对的是同一个媒体条件，却因容器宽度不同而得到不同列数。再把文字改长、放大字号，应仍能看到全部内容且没有横向页面溢出。

::: tip 断点是本例的内容选择
`64rem` 和 `28rem` 对应本例主侧结构与列表需求，并非适用于所有项目的标准断点。加入真实内容后，应重新检查规则切换是否合理。
:::

## 三、特性回退与资源约束

不支持容器查询时，示例保留单列列表，内容仍可使用。`@supports` 可只在支持时启用某项增强，以下是局部能力判断：

```css
@supports (container-type: inline-size) {
  .region { container-type: inline-size; }
}
```

这检查语法支持，不证明功能没有实现缺陷，也不代替目标环境测试。图片通常还需 `max-width: 100%; height: auto`，表格则可能需要单独滚动区域，避免撑开整个页面。

常见失败可按顺序判断：

1. 手机布局看起来被整体缩小：检查 viewport 元信息。
2. 列表始终单列：检查查询容器、实际行内尺寸和支持情况。
3. 页面横向溢出：检查轨道最小值、固定尺寸资源与不可断长文本。
4. 规则条件成立仍不生效：回到层叠检查胜出声明。

查询规则见 [Media Queries](https://www.w3.org/TR/mediaqueries-4/) 和 [CSS Containment](https://www.w3.org/TR/css-contain-3/)。
