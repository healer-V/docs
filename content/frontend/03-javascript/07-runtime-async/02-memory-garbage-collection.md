---
title: "内存模型与垃圾回收"
tags:
  - JavaScript
  - 内存
  - 垃圾回收
  - 内存泄漏
excerpt: "说明原始值与对象在存储和传递上的差别、引用与可达性如何决定回收，解释标记清除的基本思路与回收时机不可依赖的原因，列出全局引用、定时器、事件监听与分离 DOM 节点四类持有来源，并给出用堆快照定位持有链的观察页。"
date: 2026-11-15
---

# 内存模型与垃圾回收

原始值按值保存，复制后互不影响；对象按引用保存，多个变量指向同一个对象时，通过任何一个变量修改都会反映到其他变量。对象是否被回收取决于它是否可达：从全局对象、调用栈和活动回调出发能沿着引用找到它，它就继续存在。

垃圾回收器用标记清除的思路找出不可达的对象并回收。回收的时机由引擎决定，无法从代码里精确预测，因此不能用“赋值 `null` 后内存立刻减少”来判断是否泄漏。常见的持有来源是全局变量、闭包、未清除的定时器、未移除的事件监听和分离的 DOM 节点。

本篇先说明值的存放与可达性，再讲标记清除与时机，随后列出持有来源，最后用堆快照的实例计数核对。

::: info 本篇的范围
本篇讲内存与回收的概念和诊断方法，不承诺具体回收时机，也不展开 `WeakRef` 与终结器的业务用法。闭包的形成见“闭包”，引用类型的基础见“对象与数组的初步使用”。
:::

## 一、值存放在哪里

### 1. 原始值与对象

字符串、数字、布尔值、`null`、`undefined`、`symbol`、`bigint` 是原始值，赋值时复制一份，两个变量各存各的。对象、数组、函数是引用类型，变量里保存的是指向对象的引用，复制变量只是复制引用，不会复制对象本身。

```js
let a = "文本";
let b = a;
b = "新文本";
console.log(a); // "文本"

const first = { count: 1 };
const second = first;
second.count = 2;
console.log(first.count); // 2
```

### 2. 引用与可达性

判断一个对象会不会被回收，看它是否可达：从根（全局对象、当前调用栈上的变量、正在执行的闭包、活动定时器与监听器）出发，沿着引用能到达的对象都保留，到不了的对象才可能被回收。对象不再被任何可达变量引用时，代码无法再访问它，回收与否都不会影响结果。

```js
let item = { id: 1 };
item = null; // 对象不再可达
console.log(item); // null
```

## 二、垃圾回收的基本思路

### 1. 从根出发的可达性

标记清除分两步：从根集合出发遍历所有可达对象并打标记，然后回收没有标记的对象。引用计数这类方案处理不了循环引用，现代引擎普遍采用基于可达性的标记方案，两个互相引用的对象只要整体不可达，就会一起被回收。

```js
function makePair() {
  const a = {};
  const b = {};
  a.peer = b;
  b.peer = a;
  return "已创建互相引用的对象";
}
makePair(); // 函数返回后 a、b 不可达，循环引用不影响回收
```

### 2. 回收时机不可依赖

回收由引擎按内存压力和内部策略安排，何时发生、回收多少都不确定。同样的代码在不同机器、不同页面状态下可能表现出不同的内存曲线。不要写依赖“某个时刻内存已经释放”的逻辑，也不要因为一次快照里对象还在就断定泄漏。

```js
let cache = new Array(10000).fill("数据");
cache = null; // 只是解除引用，内存是否已归还由引擎决定
```

### 3. 把变量置空不等于立即释放

把变量设为 `null` 只去掉一个引用。对象可能还被别处持有，例如闭包、数组、监听器；这些引用都在时，置空一个变量不会让对象不可达。反过来，即便对象已不可达，也要等下一次回收才真正释放内存。置空的作用是“让对象有机会被回收”，不是立即释放。

```js
let shared = { id: 1 };
const holder = [shared];
shared = null;
console.log(holder[0].id); // 1，对象仍被数组引用
```

## 三、常见的持有来源

### 1. 全局引用与闭包

挂在 `window` 上的变量、模块级数组和长期存在的缓存会一直持有对象，直到被显式清空。闭包也会持有外层函数的变量：只要闭包本身可达，它捕获的对象就不可回收。全局缓存需要有上限或过期策略，否则会随使用持续增长。

```js
const cache = [];
function remember(value) {
  cache.push(value);
}
remember({ id: 1 });
remember({ id: 2 });
console.log(cache.length); // 2，只有清空数组才会释放
```

### 2. 定时器与事件监听

`setInterval` 的回调在清除前一直存活，回调通过闭包引用的对象也随之保留；事件监听同理，目标元素存在时监听器不会被回收。页面切换或组件销毁时没有 `clearInterval`、`removeEventListener`，积累的回调就会持续占用内存并重复执行。

```js
const state = { hits: 0 };
const timer = setInterval(() => {
  state.hits += 1;
}, 1000);
// 结束时必须清理，否则回调与 state 一直存活
clearInterval(timer);
```

### 3. 分离的 DOM 节点

节点从文档中移除后，如果 JavaScript 变量仍引用它，节点和它的子树都不会被回收，这就是分离节点泄漏。常见写法是把节点存在数组或映射里，只在 DOM 上删除。排查时在快照中搜索 `Detached` 开头的条目，再顺着持有链找到引用它的变量。

```js
const list = document.body.appendChild(document.createElement("ul"));
const item = document.createElement("li");
list.append(item);
item.remove();
// item 变量仍引用该节点，节点与它的子树不会被回收
```

## 四、用堆快照定位持有链

### 1. 采集堆快照

在 Chrome DevTools 打开 Memory 面板，选择 Heap snapshot 后点击拍摄，可以得到当前所有可达对象的快照。对比两次快照的差异，能看出哪些对象在操作后没有被释放；在 Summary 视图按构造函数名筛选，能看到该类实例的数量与占用大小。

操作路径是：Memory 面板 → 选择 Heap snapshot → 点击 Take snapshot → 在筛选框输入构造函数名。点击快照下方的回收按钮可以强制触发一次垃圾回收，再拍第二张快照，差异就是这段时间新增且仍然存活的对象。

### 2. 从实例找到持有者

选中某个实例后，下方的 Retainers 面板列出引用它的对象，逐层向上可以追到根。找到持有链上不该存在的引用，就能定位泄漏点：可能是忘记清空的数组、未移除的监听器，或一个仍指向旧节点的变量。修复后重新拍摄快照，实例数量应回到基线。

## 五、从空目录观察持有与释放

### 1. 创建页面

新建空目录 `js-memory`，创建 `index.html`。页面定义 `LeakProbe` 类，用四种方式各创建一个实例并由按钮控制创建与释放：推入全局数组、被 `setInterval` 回调闭包引用、被事件监听闭包引用、被分离的 DOM 节点属性引用；另有一个只存在于局部变量的实例。释放时依次清空数组、清除定时器、移除监听并置空节点引用。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>对象持有与释放观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>对象持有与释放观察</h1>
  <p>依次点击“创建持有”和“释放引用”，在 DevTools 的 Memory 面板中对比堆快照。</p>
  <button id="create" type="button">创建持有</button>
  <button id="release" type="button">释放引用</button>
  <div id="holder"></div>
  <table id="output">
    <thead><tr><th>持有方式</th><th>释放前</th><th>释放后</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    class LeakProbe {
      constructor(tag) {
        this.tag = tag;
        this.payload = new Array(1000).fill(0);
      }
    }

    const held = [];
    let timerId = null;
    let listenerProbe = null;
    let detachedProbe = null;
    let detachedBlock = null;
    const holder = document.querySelector("#holder");
    const onHolderClick = () => listenerProbe.tag;

    function createArtifacts() {
      held.push(new LeakProbe("array"));
      const timerProbe = new LeakProbe("timer");
      timerId = setInterval(() => {
        if (timerProbe.tag) LeakProbe.lastTick = Date.now();
      }, 1000);
      listenerProbe = new LeakProbe("listener");
      holder.addEventListener("click", onHolderClick);
      const block = document.createElement("div");
      block.textContent = "已被移除的节点";
      holder.append(block);
      detachedProbe = new LeakProbe("detached");
      block.probe = detachedProbe;
      block.remove();
      detachedBlock = block;
      new LeakProbe("local-only");
    }

    function releaseArtifacts() {
      held.length = 0;
      clearInterval(timerId);
      timerId = null;
      holder.removeEventListener("click", onHolderClick);
      listenerProbe = null;
      detachedProbe = null;
      detachedBlock = null;
    }

    window.probe = { createArtifacts, releaseArtifacts, held };

    const rows = [
      ["数组引用", "held 中保留 1 个", "清空 length 后释放"],
      ["定时器回调闭包", "interval 每秒读取一次", "clearInterval 后释放"],
      ["事件监听闭包", "监听器引用 listenerProbe", "removeEventListener 后释放"],
      ["分离的 DOM 节点", "节点被移除但仍被变量引用", "置空引用后释放"],
      ["局部变量对象", "调用结束后不可达", "立即成为回收对象"],
    ];
    const body = document.querySelector("#output tbody");
    for (const cells of rows) {
      const row = document.createElement("tr");
      for (const text of cells) {
        const cell = document.createElement("td");
        cell.textContent = text;
        row.append(cell);
      }
      body.append(row);
    }

    document.querySelector("#create").addEventListener("click", createArtifacts);
    document.querySelector("#release").addEventListener("click", releaseArtifacts);
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后在 Memory 面板拍快照，按 `LeakProbe` 筛选，实例数为 `2`，来自类本身与原型，不是业务对象。点击“创建持有”再强制回收并拍摄，实例数变为 `6`：数组、定时器闭包、监听闭包、分离节点各保留一个，局部变量那个已经在回收中被释放。点击“释放引用”后再次回收并拍摄，实例数回到 `2`，四个持有来源全部解除。

| 阶段 | `LeakProbe` 实例数 | 说明 |
|------|--------------------|------|
| 打开页面后 | `2` | 类本身与原型 |
| 点击“创建持有”后 | `6` | 四个持有来源各保留一个，局部对象已被回收 |
| 点击“释放引用”后 | `2` | 引用全部解除，回到基线 |

### 3. 失败分支

第一种偏差是把内存增长都当成泄漏。页面加载、缓存填充和正常的数据结构增长都会让堆变大；只有“操作结束、引用已不再需要，对象却仍然可达”才是泄漏。判断依据是持有链，不是数字本身。

第二种偏差是认为 `null` 赋值立即释放内存。赋值只去掉一个引用，对象是否回收取决于它是否还可达，何时回收取决于引擎。页面中的局部变量对象在创建后立即不可达，但在下一次回收前仍可能出现在快照里。

第三种偏差是只从 DOM 上移除节点却保留变量引用。`item.remove()` 之后节点不在文档中出现，但它和子树仍被 `item` 变量持有，页面表现正常，内存却持续增长。释放时要同时置空变量或从保存容器中删除。

## 六、验证记录与边界

以上页面于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。实例计数通过 Chrome DevTools Protocol 的 `HeapProfiler.collectGarbage` 与 `HeapProfiler.takeHeapSnapshot` 采集快照后统计节点名得到：基线 `2`，创建后 `6`，释放后 `2`。HTML 文件经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

Memory 面板中的筛选、Retainers 视图与具体菜单文字本文没有逐项自动验证，只核对到快照数据本身；不同 Chrome 版本的界面布局可能不同。本文也没有验证回收时机、堆大小阈值等引擎内部策略，以及 `WeakRef`、`FinalizationRegistry` 的行为；这些内容需要按目标环境核对。
