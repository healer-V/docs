---
title: "CSS 关键帧动画"
tags:
  - CSS
  - animation
  - 动效
excerpt: "介绍关键帧与 animation 播放设置，解释持续时间、循环、方向、填充和暂停，通过有限状态动画验证开始、结束及移除规则，并处理多动画冲突和减少动效。"
---

# CSS 关键帧动画

**关键帧动画**用 `@keyframes` 指定时间进度上的属性状态，再由 `animation` 选择播放方式。过渡依赖属性前后变化；关键帧可以主动定义一条包含多个状态的时间过程。

## 一、关键帧与时间进度

`from` 相当于 `0%`，`to` 相当于 `100%`。百分比表示一次迭代中的时间位置，不是元素尺寸的百分比。

以下是局部关键帧定义，省略元素结构：

```css
@keyframes appear {
  from { opacity: 0.3; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}
```

浏览器在两个状态间计算中间值。省略某些属性的起点或终点时，会按动画规则使用对应的底层样式，因此修改基础样式也可能改变动画结果。

关键帧内部不能靠 `!important` 提高优先级，这类声明会被忽略；动画值在完整层叠中的位置见[层叠与优先级](../02-style-computation/03-cascade-specificity.md)。

## 二、播放设置

| 子属性 | 作用 |
|--------|------|
| `animation-name` | 选择关键帧名称 |
| `animation-duration` | 每次迭代时长，默认 `0s` |
| `animation-timing-function` | 相邻关键帧区间的进度变化 |
| `animation-delay` | 开始等待时间，可为负 |
| `animation-iteration-count` | 迭代次数，可用 `infinite` |
| `animation-direction` | normal、reverse、alternate 等方向 |
| `animation-fill-mode` | 非活动播放阶段是否采用相应关键帧值 |
| `animation-play-state` | running 或 paused |

`alternate` 交替改变迭代方向；`reverse` 从反方向播放。`paused` 冻结当前播放进度，不等于移除动画或重新开始。

::: warning 无限动画需要使用理由和停止方式
持续运动可能干扰阅读。普通状态反馈优先采用有限次数；确需持续播放时，提供适当的暂停控制并处理减少动效偏好。
:::

## 三、有限动画与暂停

以下是局部 HTML，省略文档外壳。勾选控件用来验证暂停，不代表任何业务请求状态：

```html
<div class="preview">
  <label><input type="checkbox"> 暂停反馈</label>
  <p class="status is-updated">内容已更新。</p>
</div>
```

配合第一节的关键帧，添加以下局部样式。默认样式本身就是可读终态：

```css
.status { opacity: 1; transform: none; }
.status.is-updated { animation: appear 3s ease-out 1 both; }
.preview:has(input:checked) .status { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .status.is-updated { animation: none; }
}
```

1. 页面载入时，文字在 `3s` 内从淡且略偏下的状态到达正常位置。
2. 播放过程中勾选复选框，进度暂停；取消勾选，继续播放。
3. 播完后保持终态。重新打开页面，可再次验证暂停。
4. 在开发者工具中移除 `is-updated` 类，动画不再作用，基础终态仍可见。

示例采用较长时长便于观察播放控制，真实状态反馈的时长应按交互需要选择。

## 四、填充与多动画冲突

### 1. fill-mode 不修改基础声明

| 值 | 播放外阶段的行为 |
|----|------------------|
| `none` | 不提供额外填充 |
| `backwards` | 延迟期间使用相应起始关键帧 |
| `forwards` | 播完后保持相应结束关键帧 |
| `both` | 兼有前两种填充 |

结束关键帧取决于方向与迭代次数，不一定永远是 `100%`。填充只是让动画效果继续参与呈现，不会把属性写回元素的普通 CSS 声明。

`forwards` 还可能让动画建立的某些层叠效果继续存在。若终态应由正常组件样式管理，应明确设置终态并移除不需要的动画，而不是永久依赖填充。

### 2. 多动画修改同一属性

多个动画以逗号分隔；默认替换式组合下，列表中后面的动画通常优先提供同一属性的值。两个动画都写 `transform`，不等于一个自动负责位移、另一个自动负责旋转。

需要同时组合时，可以合并关键帧、分开包装元素，或在验证支持后使用明确的动画组合能力。不要把逗号动画当成无条件叠加。

::: tip 先分配属性所有权
一个反馈使用一个明确的属性组合更容易维护。状态样式、过渡与动画同时修改同一属性时，应先检查层叠和播放阶段。
:::

## 五、减少动效与状态真实性

开启减少动效后，示例通过 `animation: none` 直接显示基础终态。读者仍能获取“内容已更新”的文字，状态不依赖动画是否播放。

::: info 动画结束不代表业务成功
动画可能被跳过、取消或暂停。请求是否成功由真实结果判断，CSS 只负责呈现已经确定的状态。
:::

播放、填充与组合的定义见 [CSS Animations](https://www.w3.org/TR/css-animations-1/)。
