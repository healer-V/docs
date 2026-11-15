---
title: "性能分析与优化"
tags:
  - JavaScript
  - 性能
  - DevTools
  - 长任务
excerpt: "说明性能问题定义与固定条件的基线、Performance 面板的主线程活动与火焰图读法、布局抖动和批量 DOM 更新的开销来源、高频回调的节流策略，以及内存快照、优化前后对照与回退的验证方式。同一页面内对照 2000 行列表的两种构建方式。"
date: 2026-11-15
---

# 性能分析与优化

性能优化的第一步不是改代码，而是把问题写成可测量的指标：哪个操作慢、在多少数据量下慢、慢在主线程的哪一段。Performance 面板录制一段时间，展示主线程任务、布局、绘制与长任务；火焰图里最宽的块就是耗时最多的调用。

常见瓶颈有两类：主线程被长任务占住，交互与渲染排队；反复读取布局属性迫使浏览器同步重排。减少长任务、批量更新 DOM、把纯计算移出主线程，都能缩短主线程占用。优化后必须在相同数据规模与设备上复测，并确认功能没有退化。

本篇先讲问题定义与录制读法，再讲常见瓶颈与改法，随后讲内存观察与前后对照，最后在同一页面比较两种列表构建方式。

::: info 本篇的范围
本篇讲浏览器性能分析与常见前端瓶颈，不承诺通用加速比例，也不展开浏览器渲染管线源码。长任务观察见“页面生命周期与性能观察”，内存与垃圾回收见“内存管理与垃圾回收”。
:::

## 一、录制前先定义问题

### 1. 固定条件与基线

比较优化前后，数据规模、设备、浏览器版本、网络条件都要固定，只改一处。先记录基线：操作名、数据量、耗时或长任务数量。没有基线的“感觉快了”无法证伪，也无法判断是否回退。

### 2. 选择指标

列表渲染看构建耗时与主线程长任务，输入交互看从事件到界面更新的延迟，滚动看帧率与掉帧。指标要与用户感知对应：一个 20 毫秒的同步函数不足 50 毫秒的长任务门槛，但在高频回调里仍会造成卡顿。

### 3. 复测功能与回退

优化后重跑功能用例，确认输出一致；记录改动前后的指标，若没有改善或引入回归就回退。性能改动常与正确性冲突，例如减少重排时缓存了尺寸，窗口变化后缓存失效，需要重新测量。

## 二、Performance 面板的读法

### 1. 录制与主线程活动

打开 Performance 面板点击录制，执行目标操作后停止。时间轴上方的 Main 轨道显示主线程任务，任务块越宽表示占用越久；下方是网络、帧、GPU 等轨道，可以对照请求与渲染时机。录制时关闭无关扩展，避免噪声。

### 2. 火焰图与长任务

Main 轨道展开后是调用栈火焰图：上层是调用者，下层是被调用者，宽度代表耗时。超过 50 毫秒的任务会被标红，与 `PerformanceObserver` 的 `longtask` 判定一致。点击任务块可以看到具体函数、源码位置与耗时，从而定位是业务计算、第三方脚本还是浏览器内部工作。

### 3. 布局与绘制成本

任务块下的 Layout、Recalculate Style、Paint 表示样式计算、布局与绘制。布局时间异常通常来自大量 DOM 改动或读写交替；绘制时间异常来自大面积重绘、阴影与滤镜。把它们与业务操作对齐，判断是脚本占住主线程还是渲染本身太重。

## 三、常见瓶颈与改法

### 1. 布局抖动

每次修改样式后立即读取 `offsetHeight`、`getBoundingClientRect`、`scrollTop`，浏览器必须立刻完成布局才能给出准确值，于是循环里发生 N 次布局。把读取集中到写入之前，或先记录尺寸再统一修改，可以把布局次数降下来。

```js
for (const text of data) {
  const item = document.createElement("li");
  item.textContent = text;
  list.append(item);
  if (item.offsetHeight >= 0) layoutReads += 1;
}
```

上面的循环每轮插入后立即读取布局，2000 行就触发 2000 次强制布局，这是实测中最主要的耗时来源。

### 2. 批量 DOM 更新

`DocumentFragment` 把节点先放进脱离文档的容器，再一次性插入，只触发一次布局；也可以先拼好 HTML 字符串再统一写入，但拼接用户输入有注入风险。批量更新的原则是“一次插入一批节点”，而不是“插入一个节点算一次”。

```js
const fragment = document.createDocumentFragment();
for (const text of data) {
  const item = document.createElement("li");
  item.textContent = text;
  fragment.append(item);
}
list.append(fragment);
```

### 3. 高频回调

`scroll`、`resize`、`input`、`pointermove` 在短时间内连续触发，回调里做布局读取或远端请求会让主线程持续繁忙。用 `requestAnimationFrame` 合并到每帧一次，或用防抖/节流限制频率；耗时计算移到 Worker，主线程只负责把结果写回界面。

## 四、内存与优化验证

### 1. 内存快照

Memory 面板的堆快照按构造函数列出对象数量与占用，分配时间线显示一段时间内的内存增长。反复操作后发现同类对象数量持续上升，通常是监听器、定时器或缓存没有释放。具体操作与判定见“内存管理与垃圾回收”。

### 2. 分配时间线

分配时间线适合观察短时间内的频繁分配：大量临时对象会让垃圾回收更频繁，表现为周期性卡顿。减少临时数组、避免在循环里创建大对象，能降低回收压力；不要为了减少分配而牺牲可读性，先确认分配确实是瓶颈。

### 3. 前后对照与回退

优化后的对照要在同一份数据、同一台设备、同样的页面状态下进行，至少重复几次取稳定值。若结果波动大，说明测量噪声盖过差异，应加大数据量或改用长任务数量这类更稳的指标。没有稳定改善就回退，保留基线数据供下次比较。

## 五、从空目录对照

### 1. 创建页面

新建空目录 `js-perf`，创建 `index.html`。页面准备 2000 条数据，分别在两个容器中构建列表：朴素方式每插入一行就读取 `offsetHeight`，优化方式先用 `DocumentFragment` 收集再一次性插入。两次构建放在不同任务中，用 `PerformanceObserver` 统计各自期间的长任务，最后把结果写入表格。

```html
<div id="naive"></div>
<div id="optimized"></div>
```

页面用 `file://` 打开即可，不需要服务端。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>列表更新性能对照</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>列表更新性能对照</h1>
  <div id="naive"></div>
  <div id="optimized"></div>
  <table id="output">
    <thead><tr><th>观察项</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const data = Array.from({ length: 2000 }, (_, index) => "第 " + index + " 行");

    function buildNaive() {
      const list = document.getElementById("naive");
      const start = performance.now();
      let layoutReads = 0;
      for (const text of data) {
        const item = document.createElement("li");
        item.textContent = text;
        list.append(item);
        if (item.offsetHeight >= 0) layoutReads += 1;
      }
      return {
        ms: performance.now() - start,
        layoutReads,
        count: list.children.length,
        start,
        end: performance.now(),
      };
    }

    function buildOptimized() {
      const list = document.getElementById("optimized");
      const start = performance.now();
      const fragment = document.createDocumentFragment();
      for (const text of data) {
        const item = document.createElement("li");
        item.textContent = text;
        fragment.append(item);
      }
      list.append(fragment);
      return {
        ms: performance.now() - start,
        layoutReads: 0,
        count: list.children.length,
        start,
        end: performance.now(),
      };
    }

    const longTasks = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        longTasks.push({ start: entry.startTime, duration: entry.duration });
      }
    }).observe({ type: "longtask", buffered: false });

    function countBetween(from, to) {
      return longTasks.filter(
        (task) => task.start <= to && task.start + task.duration >= from,
      ).length;
    }

    let naive = null;
    let optimized = null;

    setTimeout(() => {
      naive = buildNaive();
      setTimeout(() => {
        optimized = buildOptimized();
        setTimeout(render, 300);
      }, 100);
    }, 100);

    function render() {
      const ratio = (optimized.ms / naive.ms).toFixed(3);
      const rows = [
        ["朴素方式构建 2000 行耗时", naive.ms.toFixed(1), "每次插入后读 offsetHeight"],
        ["优化方式构建 2000 行耗时", optimized.ms.toFixed(1), "先放入片段再一次性插入"],
        ["朴素方式的强制布局读取次数", naive.layoutReads, "每次插入触发一次布局"],
        ["优化方式的强制布局读取次数", optimized.layoutReads, "没有读取布局"],
        ["朴素方式的行数", naive.count, "应为 2000"],
        ["优化方式的行数", optimized.count, "应为 2000"],
        ["朴素方式期间的长任务数", countBetween(naive.start, naive.end), "超过 50 毫秒的任务"],
        ["优化方式期间的长任务数", countBetween(optimized.start, optimized.end), "超过 50 毫秒的任务"],
        ["优化耗时占朴素耗时的比例", ratio, "同页同数据规模，保留三位小数"],
      ];

      const body = document.querySelector("#output tbody");
      for (const [label, value, extra] of rows) {
        const row = document.createElement("tr");
        for (const text of [label, JSON.stringify(value), extra]) {
          const cell = document.createElement("td");
          cell.textContent = text;
          row.append(cell);
        }
        body.append(row);
      }

      console.log("naive", naive.ms.toFixed(1), naive.layoutReads, naive.count);
      console.log("optimized", optimized.ms.toFixed(1), optimized.layoutReads, optimized.count);
      console.log("longtask", countBetween(naive.start, naive.end), countBetween(optimized.start, optimized.end));
      console.log("ratio", ratio);
    }
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有九行。朴素方式构建 2000 行耗时约 `192.2` 毫秒，强制布局读取 `2000` 次，期间产生 `1` 个长任务；优化方式耗时 `0.9` 毫秒，没有读取布局，也没有长任务；两者行数都是 `2000`，优化耗时占朴素耗时的 `0.005`。

| 观察项 | 结果 | 说明 |
|--------|------|------|
| 朴素方式构建 2000 行耗时 | `192.2` | 每次插入后读 `offsetHeight` |
| 优化方式构建 2000 行耗时 | `0.9` | 先放入片段再一次性插入 |
| 朴素方式的强制布局读取次数 | `2000` | 每次插入触发一次布局 |
| 优化方式的强制布局读取次数 | `0` | 没有读取布局 |
| 朴素方式的行数 | `2000` | 应为 2000 |
| 优化方式的行数 | `2000` | 应为 2000 |
| 朴素方式期间的长任务数 | `1` | 超过 50 毫秒的任务 |
| 优化方式期间的长任务数 | `0` | 超过 50 毫秒的任务 |
| 优化耗时占朴素耗时的比例 | `0.005` | 同页同数据规模，保留三位小数 |

两个数字不能直接当作“优化了 200 倍”的结论：优化方式只测量了节点构建与一次插入，实际的样式计算与布局推迟到下一次渲染，没有计入这段计时。它说明的是脚本侧开销大幅下降，完整渲染成本要在 Performance 面板录制中查看。

### 3. 失败分支

在不同数据规模或不同设备上比较两个版本，结论不可比：100 行时差距很小，高密度屏幕或低性能设备上布局成本更高。只看总耗时不看主线程活动，也可能把等待网络的时间算进“渲染慢”。

另一个常见错误是优化后没有复测功能：批量构建时忘记保留数据属性、顺序或事件绑定，列表看起来更快但交互失效。性能改动必须连同功能用例一起验证，指标与行为都通过才算完成。

## 六、验证记录与边界

以上页面于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对，数据规模固定为 2000 行。表格九行与四条控制台输出一致，数值来自同一次运行；重复运行时耗时会有波动，长任务数量与比例方向稳定。页面经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

Performance 面板的录制、火焰图与内存快照界面没有自动化验证，本文的耗时来自 `performance.now` 与 `PerformanceObserver`，面板读法来自工具行为说明。本文没有验证其他浏览器、低端设备与不同数据规模，也没有展开绘制与合成层、Web Vitals 指标、Worker 卸载与虚拟列表实现；这些内容需要按目标设备与数据规模核对。
