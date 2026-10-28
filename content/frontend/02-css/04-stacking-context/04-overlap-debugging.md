---
title: "CSS 遮挡问题排查"
tags:
  - CSS
  - 调试
  - 层叠上下文
excerpt: "用独立页面复现父上下文限制、溢出裁剪和变换祖先改变固定定位三类问题，按几何、可见范围和绘制顺序收集证据，分别修复并复测滚动、缩放和焦点。"
---

# CSS 遮挡问题排查

浮层“看不见”至少可能来自三类原因：**位置不对、被裁剪、被其他内容覆盖**。三类故障可以同时存在，因此首先要确认盒子在哪里、哪部分允许绘制，再检查前后顺序。

## 一、保留可复现条件

开始修改前，记录触发动作、滚动位置、视口大小及浮层状态。开发者工具中暂时取消声明可以验证假设，但只有把修复写回源码并刷新，才算完成修复。

基本检查顺序如下：

1. 确认元素存在，未被 `display: none`、`visibility: hidden` 或透明状态隐藏。
2. 测量边界矩形，确认尺寸非零且位置在预期区域。
3. 检查祖先的 `overflow`、clip-path 等可见范围限制。
4. 若确实与另一个盒子重叠，再比较共同层叠上下文中的顺序。

::: tip 不要把所有不可见都归为 z-index
没有进入视口的盒子需要修位置，被裁剪的内容需要修可见范围，被覆盖的内容才需要检查层叠关系。
:::

## 二、创建三个独立故障

在空目录 `overlay-debug` 新建 `index.html`，用现代浏览器直接打开。页面具有足够高度，可验证固定元素的滚动行为；三组盒子互不依赖外部文件。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>浮层诊断</title>
  <style>
    body { min-height: 1500px; font-family: sans-serif; }
    section { margin-bottom: 32px; }
    .stage { position: relative; height: 120px; }
    .a { position: relative; z-index: 1; width: 180px; height: 100px; }
    .a .tip { position: absolute; z-index: 9999; left: 100px; top: 20px;
      width: 100px; height: 40px; background: #9fdfb8; }
    .b { position: absolute; z-index: 2; left: 150px; top: 0;
      width: 100px; height: 100px; background: #f6b8bd; }
    .clip { position: relative; width: 240px; height: 60px; overflow: hidden;
      border: 1px solid; }
    .clip .tip { position: absolute; top: 40px; height: 50px; background: #9fdfb8; }
    .transformed { transform: translate(0); margin-top: 40px; height: 120px; }
    .fixed { position: fixed; top: 0; right: 0; padding: 12px; background: #f6b8bd; }
  </style>
</head>
<body>
  <section><h2>上下文限制</h2><div class="stage">
    <div class="a">甲<button class="tip">操作</button></div><div class="b">乙</div>
  </div></section>
  <section><h2>裁剪限制</h2><div class="clip">
    <button class="tip">更多操作</button>
  </div></section>
  <section><h2>固定定位参照</h2><div class="transformed">
    <button class="fixed">固定操作</button>
  </div></section>
</body>
</html>
```

:::

预期看到：第一组操作按钮部分被乙覆盖；第二组按钮被容器底部截断；第三组“固定操作”跟随变换祖先的位置，并随页面滚动离开视口。

## 三、逐类收集证据与修复

### 1. 父上下文限制

1. 选中第一组 `.tip`，确认 `z-index: 9999` 已生效。
2. 检查祖先 `.a` 的 `position: relative; z-index: 1`，它建立了上下文。
3. 在共同上下文中比较 `.a` 的 `1` 与 `.b` 的 `2`，因此 `.a` 整体位于后方。
4. 本例中甲的整个区域应在前方，可以把 `.a` 的级别改为 `3`，刷新核对遮挡消失。

真实界面若只有按钮浮层应跨区域显示，不应无条件提升整个父组件；可以调整浮层归属，但必须同时检查继承、定位和交互语义。

### 2. overflow 裁剪

1. 选中第二组 `.tip`，它有非零尺寸，位置确实跨出了容器底部。
2. 临时取消 `.clip` 的 `overflow: hidden`，完整按钮出现，证明原因是裁剪。
3. 本例无需裁剪，可把它改为 `visible`。若实际容器必须裁剪装饰，应把装饰裁剪与浮层包装分开。
4. 刷新后用 Tab 到达按钮，检查焦点轮廓和完整内容。

::: warning 裁剪故障无法靠层级修复
把第二组按钮的 `z-index` 提高不会扩大祖先的可见范围。移动 DOM 或使用顶层也应以交互需求为依据，不能忽略位置和焦点变化。
:::

### 3. fixed 参照改变

先在控制台读取位置，下面仅展示当前页面中的测量动作：

```js
const fixed = document.querySelector('.fixed');
fixed.getBoundingClientRect().top;
```

1. 滚动页面并再次读取，顶部坐标跟随祖先变化。
2. 临时取消 `.transformed` 的 `transform`，固定按钮转而位于视口顶部。
3. 本例变换没有必要，可以删除；若真实组件必须变换，应让需要视口固定的元素位于不受它影响的合适位置。
4. 恢复页面到顶部并再次滚动，确认修复后的顶部坐标保持在预期位置。

## 四、刷新后的复测

| 复测条件 | 检查项 |
|----------|--------|
| 重新打开页面 | 修复确实来自源码，非临时工具修改 |
| 页面和内部滚动 | 浮层跟随正确参照，不意外离开或覆盖 |
| `390px` 与 `1440px` 视口 | 内容不被裁掉，操作仍可见 |
| 页面缩放与长文字 | 尺寸变化后仍能完整操作 |
| 键盘 Tab | 焦点可见，顺序符合逻辑 |

::: info 记录根因对应的属性
结论应具体到“哪个祖先、哪条有效声明、造成什么边界”。“把 z-index 调大后好了”只描述动作，不能解释是否真正修复了原因。
:::

依据分别见[包含块与定位](../03-visual-formatting-model/07-containing-block-position.md)、[溢出与滚动](../03-visual-formatting-model/08-overflow-scroll.md)及[嵌套层叠上下文](./02-stacking-contexts.md)。
