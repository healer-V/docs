---
title: "CSS 可访问性"
tags:
  - CSS
  - 可访问性
  - WCAG
excerpt: "解释颜色信息、对比、焦点、缩放重排与动效偏好的样式约束，通过独立表单验证键盘和强制颜色模式，并区分视觉隐藏、语义隐藏与完整可访问性验收。"
---

# CSS 可访问性

**可访问性**要求不同视觉、输入和使用条件下的用户仍能理解并操作页面。CSS 改变外观、位置和可见性时，也可能破坏这些能力。

HTML 提供控件语义和关系，CSS 保持信息可辨、焦点可见和内容可达。仅用 CSS 美化一个 `<div>`，不能获得原生按钮的全部行为。

## 一、颜色、对比与状态信息

### 1. 状态不能只用颜色

错误输入同时使用错误文字和对应关系，而不只是红色边框。链接需要有可辨认线索；图表和状态也应通过标签或其他信息补充颜色。

### 2. 对比的测量口径

以 WCAG 2.2 AA 的文字对比要求为例，普通文字至少为 `4.5:1`，符合大字号定义的文字至少为 `3:1`。大字号指至少 `18pt` 普通文字或 `14pt` 粗体，约对应 `24px` 或 `18.67px`；还有装饰、不可用控件和标志等明确例外。

这里的**对比度**依据前景与背景的相对亮度计算，不是 RGB 分量直接相减。半透明颜色、背景图片和渐变需要按实际叠加背景判断，不能只测声明中的一个色值。定义见 [WCAG 文字对比](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)。

::: warning 达到数值下限不代表所有文字都易读
过细字重、图片背景变化和小尺寸仍可能影响阅读。必要控件边界和图形还有非文本对比要求，应按实际使用对象核对。
:::

## 二、独立表单验证

### 1. 创建页面

在空目录 `css-accessibility` 中创建 `index.html`，用现代浏览器打开。示例只处理输入反馈，不连接服务器；使用原生邮箱输入与按钮，错误信息由有效状态同步控制。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>表单样式验证</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font: 16px/1.5 system-ui, sans-serif; color: #202124; background: white; }
    main { width: min(calc(100% - 32px), 32rem); margin: 24px auto; }
    input, button { font: inherit; max-width: 100%; padding: 8px; border: 1px solid #374151; }
    input { display: block; width: 100%; }
    input[aria-invalid="true"] { border-color: #b42318; }
    .error { color: #b42318; overflow-wrap: anywhere; }
    button { color: white; background: #166534; transition: transform 160ms ease-out; }
    button:hover { transform: translateY(-2px); }
    input:focus-visible, button:focus-visible { outline: 2px solid #166534; outline-offset: 3px; }
    @media (prefers-reduced-motion: reduce) {
      button { transition: none; }
      button:hover { transform: none; }
    }
    @media (forced-colors: active) {
      input, button { border: 1px solid ButtonText; }
      input:focus-visible, button:focus-visible { outline-color: Highlight; }
    }
  </style>
</head>
<body>
  <main>
    <h1>联系邮箱</h1>
    <label for="email">电子邮箱</label>
    <input id="email" type="email" required aria-describedby="email-error">
    <p id="email-error" class="error">请输入完整的电子邮箱地址。</p>
    <button type="button">继续</button>
  </main>
  <script>
    const email = document.querySelector('#email');
    const error = document.querySelector('#email-error');
    /** 输入变化时同步有效状态与错误文字；无返回值，更新属性和可见性。 */
    function syncEmail() {
      const valid = email.checkValidity();
      email.setAttribute('aria-invalid', String(!valid));
      error.hidden = valid;
    }
    email.addEventListener('input', syncEmail);
    syncEmail();
  </script>
</body>
</html>
```

:::

错误以文字与边框共同表达，`aria-describedby` 关联说明，`aria-invalid` 与实际有效状态同步。脚本只是验证状态的最小配合，CSS 不负责判断邮箱格式。

### 2. 正常与故障对照

1. 用 Tab 到达输入框和按钮，观察清晰焦点轮廓及合理顺序。
2. 输入 `reader@example.com`，错误文字隐藏；清空或输入无效邮箱，说明重新出现。
3. 临时把焦点样式改成 `outline: none`，确认键盘位置变得难以识别，再恢复源码。
4. 把错误颜色临时改成很浅的灰色，用开发者工具测对比，再恢复原色并重新检查。

::: tip 焦点应独立于悬停反馈
用户用键盘到达控件时，需要知道当前位置。不能只设计 `:hover`，也不能让轮廓被祖先裁剪或被固定区域完全遮住。
:::

## 三、缩放与重排

文字放大不应让内容丢失。以 WCAG 的重排要求为参考，横排内容需要在相当于 `320 CSS px` 宽度的空间下继续使用，不能普遍要求同时横向和纵向滚动；数据表等确需二维布局的内容有对应例外。见 [WCAG 重排](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)。

1. 把页面缩到 `320px` 宽，检查输入、错误和按钮都能完整显示。
2. 浏览器放大到 200%，检查文字与控件没有固定高度截断。
3. 在约 `1280px` 宽视口放大到 400%，观察等效窄空间的重排。
4. 替换成长错误文字，检查断行与操作仍可达。

页面没有横向溢出只是一个证据，还需确认放大后内容没有重叠、裁剪或消失。

## 四、减少动效与强制颜色

`prefers-reduced-motion` 让作者根据用户偏好减少非必要运动；`forced-colors` 让页面适应系统替换颜色的模式。强制颜色下阴影等效果可能不可用，必要边界应有真实边框或轮廓。

在开发者工具中分别模拟两种模式：减少动效时按钮不再位移；强制颜色时控件边界和焦点仍能识别。模拟不代替目标系统和辅助技术的真实验证。

::: warning 谨慎使用 forced-color-adjust: none
禁止系统替换颜色可能破坏用户需要的对比。只有确实需要保留语义颜色、并补齐对应可读方案时才使用，不能把它当成保持品牌外观的默认方式。
:::

## 五、隐藏方式的语义边界

| 方式 | 布局与视觉 | 必须关注 |
|------|------------|----------|
| `display: none` 或 `hidden` | 通常不占位、不显示 | 通常也退出无障碍呈现 |
| `visibility: hidden` | 保留布局占位、不显示 | 隐藏内容通常不作为普通可操作目标 |
| `opacity: 0` | 占位保留、视觉透明 | 可能仍聚焦和交互，不等于语义隐藏 |
| 视觉隐藏专用样式 | 视觉上隐藏 | 需确保内容仍适合辅助技术，聚焦时可见 |

隐藏控件前还需管理焦点和状态。不要让用户停留在不可见的焦点上，也不要对仍可聚焦后代简单设置 `aria-hidden`。

::: info 验证结论有范围
本例验证 CSS 相关的颜色、焦点、重排与偏好处理。完整可访问性还需检查真实内容、语义、错误流程和辅助技术，不能凭单页截图宣称全站符合 WCAG。
:::
