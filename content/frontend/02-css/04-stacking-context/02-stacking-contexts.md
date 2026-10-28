---
title: "CSS 创建与嵌套层叠上下文"
tags:
  - CSS
  - 层叠上下文
  - z-index
excerpt: "解释层叠上下文的创建条件和原子性，通过两组父子盒子验证高 z-index 子元素受到父级约束的原因，并区分 auto 与零、布局边界和浏览器合成层。"
---

# CSS 创建与嵌套层叠上下文

**层叠上下文**把一组内容作为独立单元组织绘制。内部先决定前后顺序，再以整体参与外层的排序，这种整体参与的特性称为**原子性**。

后代的 `z-index` 只能决定它在相应内部范围的位置，不能跳出祖先上下文，与任意外部元素直接比较。

## 一、哪些条件会建立上下文

创建条件可以按目的理解，而不必把所有属性当成互不相关的触发名单：

| 类别 | 常见条件 |
|------|----------|
| 文档起点 | 根元素 |
| 明确层级 | relative/absolute 且 `z-index` 非 `auto`；Flex/Grid 项目的 `z-index` 非 `auto` |
| 特定定位 | `position: fixed` 或 `sticky` |
| 整体视觉处理 | `opacity < 1`；非 `none` 的 transform、filter、backdrop-filter 等 |
| 混合与隔离 | `mix-blend-mode` 非 `normal`；`isolation: isolate` |
| 裁剪或包含等 | 非 `none` 的 clip-path、mask；包含 layout 或 paint 的 contain |
| 预先提示及特殊呈现 | 符合创建条件的 will-change；浏览器顶层内容等 |

独立 `translate`、`rotate`、`scale` 和 `perspective` 等也需要按自身规则检查。动画及填充状态可能让相关创建效果在结束后继续存在，完整条件见 [MDN 层叠上下文](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context)。

::: warning 看起来没变也可能建立上下文
`transform: translate(0)` 和 `opacity: 0.99` 都可能改变绘制分组。排查时要看实际生效的属性，不能只看肉眼可见的位移或透明程度。
:::

## 二、嵌套怎样限制子元素

### 1. 建立两组父子关系

以下是局部 HTML，省略文档外壳：

```html
<div class="stage">
  <div class="a">区域甲<span class="tip">提示</span></div>
  <div class="b">区域乙</div>
</div>
```

对应局部 CSS，提示与区域乙有一部分几何重叠：

```css
.stage { position: relative; }
.a { position: relative; z-index: 1; width: 180px; height: 120px; }
.tip {
  position: absolute; z-index: 9999;
  left: 120px; top: 20px; width: 80px; height: 40px;
  background: #9fdfb8;
}
.b { position: absolute; z-index: 2; left: 140px; top: 0;
  width: 80px; height: 120px; background: #f6b8bd; }
```

这组上下文的关系是：

```text
根上下文
├─ 区域甲：1
│  └─ 提示：9999
└─ 区域乙：2
```

### 2. 在共同范围里比较

1. 提示先在区域甲内部排序，`9999` 能把它放到甲内部的前方。
2. 根上下文比较区域甲的 `1` 与区域乙的 `2`。
3. 区域甲整体在乙后面，因此提示的重叠部分仍被乙盖住。

继续把提示改为更大的整数不会解决问题。需要调整甲在外层的位置，或重新选择浮层的归属，具体取决于页面语义和定位需求。

::: tip 修复发生在真正的比较层级
若甲的整个内容应位于乙前面，可调整甲的级别。若只有提示需要跨区域显示，应考虑把提示放到适当的共同容器或使用符合语义的顶层机制，并复测位置、焦点和滚动。
:::

## 三、auto 与零为什么不同

对于没有其他创建条件的 `position: relative` 元素：

| 设置 | 是否因此建立上下文 | 对后代的影响 |
|------|--------------------|--------------|
| `z-index: auto` | 否 | 后代可参与更外层的上下文 |
| `z-index: 0` | 是 | 后代被收进新的整体范围 |

把示例中甲的 `z-index` 改成 `auto`，并确保它没有变换、透明度等其他触发条件，提示就可参与根上下文，与乙的 `2` 比较。

这说明 `0` 不是“完全没有效果”。删除一个整数级别后，也不能仅看数值判断上下文是否消失，还需检查其他创建条件。

## 四、与其他边界的区别

1. **BFC**解决流布局隔离；它不自动决定所有重叠层级。
2. **包含块**为尺寸和定位提供参考；层叠上下文不必是某个后代的包含块。
3. **合成层**是浏览器实现和性能决策中的对象，不能与层叠上下文一一对应。

::: info 页面层级不能用 GPU 层数量解释
层叠上下文是 CSS 绘制模型中的规则，合成层是浏览器可能采用的实现方式。层级正确与性能良好都需要各自的证据。
:::

正式的上下文与堆叠级别定义见 [CSS 分层呈现](https://www.w3.org/TR/CSS22/visuren.html#layers)。
