---
title: "CSS 渲染性能"
tags:
  - CSS
  - 性能
  - 浏览器
excerpt: "区分样式重新计算、布局、绘制与合成成本，通过独立列表对照读写交错和先读后写，介绍性能录制、动效、will-change 与包含策略，并说明计时和优化的证据边界。"
---

# CSS 渲染性能

**渲染性能**关注页面从状态变化到可见结果所消耗的时间与资源。一次 CSS 改动可能引起样式重新计算、布局、绘制或合成中的部分工作，实际成本取决于受影响范围和浏览器实现。

优化应先找到轨迹中的主要成本，再改变对应行为。只看到某个属性名称，不能判断整次交互一定快或慢。

## 一、呈现工作与失效范围

| 工作 | 主要问题 | 常见触发 |
|------|----------|----------|
| 样式重新计算 | 哪些规则与值需要更新 | 类、变量、结构或条件改变 |
| 布局 | 哪些盒子的尺寸和位置需要更新 | 尺寸、字体及几何约束改变 |
| 绘制 | 哪些内容需要重新生成绘制结果 | 颜色、阴影、背景等改变 |
| 合成 | 怎样组合已准备的图层 | 部分变换、透明度动画等 |

浏览器会复用已有结果，因此不是每次改变都重做全部工作。但一个祖先的字体或布局约束变化，可能影响较大范围的后代。

::: warning transform 不保证永远只有合成成本
内容变化、复杂效果、图层分配及资源限制都可能影响实际路径。层叠上下文与合成层不是一一对应，应以目标浏览器的录制为依据。
:::

## 二、读写交错与强制布局

**强制同步布局**发生在布局已失效，而脚本立即读取需要最新几何结果的属性时。浏览器为返回正确数字，可能必须提前完成布局。

循环中反复“读取尺寸 → 修改尺寸 → 再读取”，可能重复触发布局。把一组读取集中在写入之前，通常能减少这种交错；不能改变算法所需的数据依赖。

原理与诊断见 [web.dev 布局与读写交错](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)。

## 三、独立列表对照

### 1. 创建页面

在空目录 `css-performance` 新建 `index.html`，用带性能工具的现代浏览器打开。固定使用 500 项，两种更新都让每项高度增加 `1px`，区别只是读取与写入的组织方式。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>布局读写对照</title>
  <style>
    body { font-family: sans-serif; }
    .row { box-sizing: border-box; height: 32px; padding: 4px; border-bottom: 1px solid #9ca3af; }
    #result { display: block; margin: 12px 0; }
  </style>
</head>
<body>
  <button id="unbatched" type="button">读写交错</button>
  <button id="batched" type="button">先读后写</button>
  <output id="result" aria-live="polite"></output>
  <div id="list"></div>
  <script>
    const list = document.querySelector('#list');
    const result = document.querySelector('#result');
    for (let index = 0; index < 500; index += 1) {
      const row = document.createElement('div');
      row.className = 'row';
      row.textContent = '项目 ' + (index + 1);
      list.append(row);
    }
    const rows = list.children;

    /** 每次对照前恢复相同高度并完成一次基线布局；无返回值。 */
    function prepareRows() {
      for (const row of rows) row.style.height = '32px';
      // 将共同的重置布局放在计时区间外，避免上次更新污染本次起点。
      void list.offsetHeight;
    }

    /** 点击交错按钮时逐项读后写；无返回值，记录脚本与同步布局耗时。 */
    function runUnbatched() {
      prepareRows();
      const start = performance.now();
      performance.mark('unbatched-start');
      for (const row of rows) {
        const height = row.offsetHeight;
        row.style.height = (height + 1) + 'px';
      }
      performance.measure('unbatched-update', 'unbatched-start');
      result.textContent = '读写交错：' + (performance.now() - start).toFixed(2) + 'ms';
    }

    /** 点击批量按钮时先读全部高度再写；无返回值，记录相同区间耗时。 */
    function runBatched() {
      prepareRows();
      const start = performance.now();
      performance.mark('batched-start');
      const heights = [];
      for (const row of rows) heights.push(row.offsetHeight);
      for (let index = 0; index < rows.length; index += 1) {
        rows[index].style.height = (heights[index] + 1) + 'px';
      }
      performance.measure('batched-update', 'batched-start');
      result.textContent = '先读后写：' + (performance.now() - start).toFixed(2) + 'ms';
    }

    document.querySelector('#unbatched').addEventListener('click', runUnbatched);
    document.querySelector('#batched').addEventListener('click', runBatched);
  </script>
</body>
</html>
```

:::

### 2. 验证相同结果与不同工作组织

1. 记录浏览器版本、视口、500 项数据和是否启用 CPU 限速。
2. 点击任意按钮，500 项的高度都从 `32px` 变成 `33px`。
3. 在性能工具中分别录制两种点击，查找 `unbatched-update` 与 `batched-update` 标记。
4. 对照交错版本区间中的重复 Layout 与批量版本的布局分布，再查看后续绘制。
5. 交替多次运行，保持相同条件，避免只选择一个偶然快的结果。

示例输出的 `ms` 是脚本及期间同步工作耗时，没有包含所有后续布局、绘制和合成。批量版本可能把布局留到稍后完成，因此必须结合完整轨迹，不能仅凭输出数字宣称总呈现成本为零。

::: tip 计时与可见结果分别验证
两种算法必须得到相同尺寸，计时区间必须明确；完整性能录制用于补齐计时结束后的工作。没有这些条件，速度比较没有可解释性。
:::

## 四、动效与 will-change

先选择合适的变化属性，减少不必要的布局和绘制，再根据实际瓶颈考虑预先提示。`will-change` 告诉浏览器某些属性可能变化，不保证提升，也不代表强制开启 GPU。

下面是局部提示，假设应用只在准备运动时添加相应类：

```css
.moving.is-preparing {
  will-change: transform;
}
```

需要提前适量准备，结束后移除不再需要的提示。长期给大量元素设置可能增加内存与图层资源，还可能提前改变层叠或定位边界。

::: warning 优化提示有副作用
不要给所有元素统一设置 `will-change`。加入后同时比较轨迹、资源和层级行为，无法证明收益时应撤回。
:::

## 五、包含策略与优化回退

`contain` 声明布局、绘制或尺寸等方面的隔离条件；`content-visibility: auto` 可以让浏览器跳过部分离屏呈现工作。二者都有语义与几何约束，不是通用开关。

| 方案 | 需要验证 |
|------|----------|
| `contain: layout paint` | 子布局隔离、裁剪、层叠及包含块变化 |
| 尺寸包含 | 容器是否有足够外部尺寸，内容不再决定哪些尺寸 |
| `content-visibility: auto` | 离屏估算、滚动稳定、查找与焦点等行为 |
| `contain-intrinsic-size` | 预估占位是否接近真实内容，避免明显跳动 |

包含与跳过渲染规则见 [CSS Containment](https://www.w3.org/TR/css-contain-2/)。

实施优化时保存基线与对应改动，在相同数据和环境下重录。如果只是把成本转移到别处、破坏布局或增加资源消耗，应缩小范围或撤回。渲染优化的结论必须说明**测了什么、改善了哪段工作、代价是什么**。
