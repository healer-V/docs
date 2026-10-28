---
title: "CSS 过渡与状态反馈"
tags:
  - CSS
  - transition
  - 动效
excerpt: "解释 CSS 过渡如何连接属性的前后状态，介绍属性、时长、缓动和延迟，验证悬停、键盘焦点、反向变化与取消，并说明插值限制和减少动效时的最终状态。"
---

# CSS 过渡与状态反馈

**过渡**（transition）在属性从一个值变成另一个值时，按时间生成中间状态。它需要前后两种可观察的样式，以及满足条件的属性变化；声明过渡本身不会主动修改目标值。

## 一、过渡的四个设置

| 子属性 | 负责什么 | 示例 |
|--------|----------|------|
| `transition-property` | 哪些属性参与 | `background-color, transform` |
| `transition-duration` | 变化多久 | `160ms` |
| `transition-timing-function` | 时间与进度的关系 | `ease-out`、`linear`、`cubic-bezier(...)` |
| `transition-delay` | 何时开始 | `0ms`，负值可从中间进度开始 |

简写中第一项时间通常是时长，第二项时间是延迟。例如 `transform 160ms ease-out 40ms` 在等待 `40ms` 后进行 `160ms` 的变换过渡。

**缓动**控制进度随时间怎样变化，不改变终点值。`steps()` 采用分段跳变，不能把它理解成更低帧率的连续线性动画。

::: tip 明确列出参与属性
`transition: all` 会把其他意外变化也纳入过渡，可能引入尺寸和颜色问题。已知状态反馈只列需要变化的属性更容易控制和排查。
:::

## 二、建立按钮的前后状态

以下是局部 HTML，省略文档外壳，只需要原生按钮：

```html
<button class="action" type="button">保存</button>
```

对应的完整局部样式如下。过渡放在基础状态，让进入与退出都具有相应设置：

::: details 查看按钮过渡样式

```css
.action {
  padding: 8px 16px;
  border: 1px solid #166534;
  color: #166534;
  background-color: white;
  transition: background-color 160ms ease-out, transform 160ms ease-out;
}
.action:not(:disabled):hover,
.action:not(:disabled):focus-visible {
  background-color: #e7f6ee;
  transform: translateY(-2px);
}
.action:focus-visible { outline: 2px solid #166534; outline-offset: 3px; }
.action:disabled { opacity: 0.5; }
@media (prefers-reduced-motion: reduce) {
  .action { transition: none; }
  .action:not(:disabled):hover,
  .action:not(:disabled):focus-visible { transform: none; }
}
```

:::

按顺序验证：

1. 鼠标进入按钮，背景变浅并向上移动 `2px`。
2. 鼠标离开，回到基础背景和位置。
3. 用 Tab 聚焦，得到同样的状态反馈及焦点轮廓。
4. 临时给按钮添加原生 `disabled` 属性，它不再触发相同悬停效果，也不能作为普通键盘操作目标。

这里只证明样式状态变化，没有实现提交请求。颜色和位置变化不能作为“保存成功”的证据。

## 三、哪些变化可以插值

**插值**是根据起点、终点和进度计算中间值。数值、颜色和可兼容的变换通常支持相应插值，但不同属性有各自的动画类型。

| 情况 | 判断 |
|------|------|
| 两个明确长度 | 通常可连续变化，仍需考虑布局成本 |
| 合法颜色 | 按相应颜色插值规则变化 |
| 不兼容或离散值 | 可能跳变，不能承诺连续中间状态 |
| `auto` 与具体尺寸 | 不能默认按普通数值过渡，相关增强需单独验证 |
| `display` 等特殊切换 | 需要额外离散过渡及进入样式机制，不能套用基础示例 |

刚插入元素与设置目标样式在同一次更新中发生时，浏览器可能没有前一可观察状态，因此不会按预期过渡。现代进入/离散过渡能力应按具体属性与目标环境核对，规则见 [CSS Transitions](https://www.w3.org/TR/css-transitions-2/)。

::: warning 过渡无效先检查状态和动画类型
确认属性确实从一个值变到另一个值、时长非零、声明胜出，再检查可插值性。延长时长不能让无效属性值变得合法。
:::

## 四、快速反向与取消

过渡未结束就移开鼠标时，浏览器会基于当前过程处理反向变化，不一定从原始起点完整重播。快速进入、离开可以暴露闪烁或不合适的延迟。

元素消失、过渡属性改变或相关声明被移除，可能导致取消而不是正常结束。若脚本依赖 `transitionend`，还需考虑取消与没有实际过渡的情况，不能把该事件作为唯一的业务完成信号。

## 五、减少动效与最终反馈

`prefers-reduced-motion: reduce` 表示用户希望减少非必要动效，不代表浏览器自动替作者删除所有动画。示例关闭过渡并移除位移，仍保留即时背景变化和焦点轮廓。

::: info 检查减少动效下的状态
在系统设置或开发者工具中模拟减少动效，再用鼠标和键盘验证。控件应直接进入明确终态，不能因为关闭动画就失去焦点、状态或反馈。
:::

性能成本不能只按“有没有 transform”推断，需结合实际录制，见[CSS 渲染性能](../06-engineering/05-rendering-performance.md)。
