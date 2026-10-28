---
title: "CSS 样式组织与组件边界"
tags:
  - CSS
  - 组件
  - 工程化
excerpt: "解释基础样式、组件规则、状态与设计变量的职责，通过同名状态类的冲突比较命名隔离和主题继承，并说明 CSS Modules、框架 scoped 与原生作用域的实际边界。"
---

# CSS 样式组织与组件边界

**样式组织**明确一条规则负责哪些内容、可以影响哪个范围、由谁覆盖。**组件边界**让局部规则容易识别，同时保留有意共享的字体、颜色和设计变量。

把样式拆成多个文件不等于隔离：只要进入同一文档样式范围，选择器仍可匹配其他文件中的元素。

## 一、按职责组织样式

| 职责 | 内容 | 主要约束 |
|------|------|----------|
| reset | 消除确实需要统一的浏览器差异 | 不移除必要焦点和控件语义表现 |
| 基础样式 | 正文字体、通用链接、盒尺寸约定 | 保持范围少而稳定 |
| 组件样式 | 局部结构与外观 | 避免无范围的 `button`、`.title` 等污染 |
| 状态样式 | 选中、展开、错误等 | 由真实状态驱动，命名能判断归属 |
| 设计变量 | 颜色、间距和尺度 | 区分全局默认与局部覆盖 |

层叠层可以表达这些职责的覆盖关系。以下是局部结构示例，不代表 reset 的完整实现：

```css
@layer reset, base, components, utilities;
@layer base {
  :root { --space: 12px; --accent: #166534; }
  body { font-family: system-ui, sans-serif; }
}
@layer components {
  .panel { padding: var(--space); }
}
```

层只解决声明的裁决关系，不限制选择器匹配范围。完整规则见[层叠与优先级](../02-style-computation/03-cascade-specificity.md)。

::: tip reset 由实际差异决定
简单统一 `box-sizing` 或正文外边距有明确作用；全局 `all: unset` 会连控件状态一起清掉。每项重置都应有可验证的目的和恢复方式。
:::

## 二、同名状态类的冲突

### 1. 为什么拆文件仍会污染

以下局部 HTML 包含两个组件，省略文档外壳：

```html
<section class="panel"><button class="active">详情</button></section>
<nav class="toolbar"><button class="active">列表</button></nav>
```

假设两个组件各自提供下面的局部规则，最终一起进入文档：

```css
/* 面板希望选中项为绿色 */
.active { background: #166534; color: white; }
/* 工具栏希望选中项为灰色 */
.active { background: #e5e7eb; color: #202124; }
```

两个按钮都匹配两条规则，同权重时后写的灰色胜出。根因是范围不清，不能靠交换文件加载顺序让两个组件各自正确。

### 2. 命名与局部限定

可以把两个按钮分别改为 `panel__choice is-active` 和 `toolbar__choice is-active`，再使用明确规则：

```css
.panel__choice.is-active { background: #166534; color: white; }
.toolbar__choice.is-active { background: #e5e7eb; color: #202124; }
```

`组件__部分` 是一种命名约定，浏览器不赋予特殊行为。`is-active` 可以重复，但只有和组件选择器组合后才形成对应样式边界。

另外，也可在合适的组件根上使用原生 `@scope` 限定规则；它约束匹配范围，却不会像 Shadow DOM 一样建立完整封装。

::: warning 状态样式不能替代原生状态
按钮禁用应设置 `disabled`，表单无效、展开状态等也要使用合适的 HTML 或无障碍属性。只加 `.is-disabled` 会改变外观，却不自动禁止点击或键盘操作。
:::

## 三、隔离与继承的取舍

组件通常仍需跟随页面字体和主题。可以在根或主题容器上提供默认变量，再在组件根覆盖：

```css
:root { --accent: #166534; }
.panel { --accent: #9f1239; }
.panel__choice { border-color: var(--accent); }
.toolbar__choice { border-color: var(--accent); }
```

面板后代使用局部颜色，工具栏使用全局颜色。这里继承是有意复用，不是污染；变量的取值边界见[自定义属性](../02-style-computation/07-custom-properties.md)。

基础选择器仍可能影响组件，自定义属性也可能从祖先传入。应明确哪些输入允许继承，而不是试图用越来越长的选择器阻止所有外部影响。

## 四、构建工具的边界

| 方案 | 主要机制 | 不自动解决什么 |
|------|----------|----------------|
| CSS Modules | 构建时生成局部类名映射 | 继承、全局选择器、变量和层叠设计 |
| Vue scoped 等 | 给选择器和元素添加范围标记 | 所有继承、子组件根的影响及深度选择边界 |
| 原生 `@scope` | 在指定根与可选边界内匹配 | 完整 DOM 或样式封装 |
| 命名约定 | 作者使用明确的组件名称 | 约定的自动强制执行 |

CSS Modules 的输出类名由工具决定，不能依赖固定哈希；Vue scoped 不是浏览器识别一个全新的 CSS 作用域，而是编译产生相应选择器。依据见 [CSS Modules 文档](https://github.com/css-modules/css-modules) 和 [Vue SFC CSS](https://vuejs.org/api/sfc-css-features.html)。

## 五、改造后的验证

1. 在同一页面同时放置两个组件，切换各自状态。
2. 改变组件顺序和样式加载顺序，结果不应因无意匹配而互换。
3. 在外层切换主题变量，确认只改变允许共享的部分。
4. 检查开发者工具中的匹配规则，并复测焦点与禁用行为。

::: info 边界应能从规则中识别
读到选择器和变量声明时，应能判断它属于哪个组件、接受哪些外部输入、覆盖哪些状态。需要不断依靠文件加载顺序解释的样式，应重新检查职责划分。
:::
