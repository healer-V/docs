---
title: "事件模型与事件委托"
tags:
  - JavaScript
  - DOM
  - 事件流
  - 事件委托
excerpt: "说明捕获、目标与冒泡三个阶段，addEventListener 的 capture、once 选项与移除监听所需的同一函数引用，事件对象上的 target、currentTarget、preventDefault 与两种停止传播方法，事件委托的 closest 写法与动态节点，并对照鼠标、键盘、输入、表单与窗口事件的常用字段。"
date: 2026-11-15
---

# 事件模型与事件委托

页面上的一次点击会从 `document` 沿祖先链传到目标元素，再原路返回，这两个方向分别叫捕获阶段与冒泡阶段。`addEventListener` 的第三个参数决定监听落在哪个阶段；目标节点上的监听按注册顺序执行，与阶段标记无关。

事件对象携带 `target`（触发源）与 `currentTarget`（当前正在执行监听的对象）。`preventDefault` 取消默认行为，`stopPropagation` 阻止继续传播，`stopImmediatePropagation` 还会跳过同一元素上注册在后面的监听。

把监听挂在父元素上、用 `closest` 找出目标所在的行，就是事件委托。它让动态新增的节点自动获得处理，也减少监听数量。本篇先讲事件流与注册，再讲事件对象与委托，最后用页面核对顺序与计数。

::: info 本篇的范围
本篇讲浏览器事件模型与委托写法，不展开框架的事件系统，也不讨论 `passive` 选项对滚动性能的影响和触摸手势。异步任务的调度顺序见“事件循环与任务队列”，XSS 与输入处理见“前端安全边界”。
:::

## 一、事件流与监听注册

### 1. 捕获、目标与冒泡

监听默认在冒泡阶段执行。给 `addEventListener` 传第三个参数 `true`（或 `{ capture: true }`）改为捕获阶段执行，此时祖先元素的监听先于目标执行。完整顺序是：`document` 捕获 → 祖先捕获 → 目标 → 祖先冒泡 → `document` 冒泡。

```js
const outer = document.createElement("div");
const inner = document.createElement("button");
outer.append(inner);
outer.addEventListener("click", () => console.log("outer 捕获"), true);
inner.addEventListener("click", () => console.log("inner 目标"));
outer.addEventListener("click", () => console.log("outer 冒泡"));
inner.click();
```

输出依次为 `outer 捕获`、`inner 目标`、`outer 冒泡`。同一个元素上同时注册捕获与冒泡监听时，本次测试的 Chrome 先调用捕获监听、再调用冒泡监听，同类监听之间按注册顺序执行。

### 2. addEventListener 与选项

第三个参数还可以是对象：`once: true` 让监听在执行一次后自动移除，`passive: true` 表示监听不会调用 `preventDefault`，适合 `touchmove`、`wheel` 这类高频事件。`once` 省去了在回调里手动 `removeEventListener` 的代码。

```js
const button = document.createElement("button");
let count = 0;
button.addEventListener("click", () => { count += 1; }, { once: true });
button.click();
button.click();
console.log(count); // 1
```

### 3. 移除监听

`removeEventListener` 按“事件类型 + 回调引用 + 阶段”匹配，必须传入注册时的同一个函数。用箭头函数原地注册再传一个新的箭头函数移除，两者引用不同，监听仍然存在，计数继续增加。

```js
const button = document.createElement("button");
let count = 0;
function onClick() { count += 1; }
button.addEventListener("click", onClick);
button.removeEventListener("click", onClick);
button.click();
console.log(count); // 0
```

## 二、事件对象

### 1. target 与 currentTarget

`event.target` 是实际触发事件的元素，`event.currentTarget` 是当前执行监听时事件所在的元素。监听挂在父元素上时两者通常不同：点击 `<span>`，`target` 是 `SPAN`，`currentTarget` 是外层 `UL`。需要行级数据时，从 `target` 用 `closest` 向上找。

```js
const list = document.createElement("ul");
list.innerHTML = '<li data-id="1"><span>第一项</span></li>';
list.addEventListener("click", (event) => {
  console.log(event.target.tagName); // "SPAN"
  console.log(event.currentTarget.tagName); // "UL"
  console.log(event.target.closest("li").dataset.id); // "1"
});
list.querySelector("span").click();
```

### 2. preventDefault 与默认行为

`preventDefault()` 取消浏览器对该事件的默认动作，对 `click` 来说是勾选、提交、跳转等；取消后 `event.defaultPrevented` 变为 `true`。它不影响传播，父元素的监听仍会执行。只有 `cancelable` 为 `true` 的事件才有效。

```js
const box = document.createElement("input");
box.type = "checkbox";
box.addEventListener("click", (event) => event.preventDefault());
box.click();
console.log(box.checked); // false
```

### 3. stopPropagation 与 stopImmediatePropagation

`stopPropagation()` 阻止事件继续向祖先传播，但同一元素上注册的其他监听照常执行；`stopImmediatePropagation()` 同时阻止这些监听。两者都不等于 `preventDefault`：默认行为仍然发生。滥用会切断父层的事件委托，让排障变得困难。

```js
const outer = document.createElement("div");
const inner = document.createElement("button");
outer.append(inner);
outer.addEventListener("click", () => console.log("outer"));
inner.addEventListener("click", (event) => event.stopPropagation());
inner.click();
console.log("结束");
```

输出只有 `结束`，`outer` 的监听没有执行。

## 三、事件委托

### 1. 在父元素上监听

委托的做法是在稳定的父元素上注册一次监听，用 `event.target.closest(选择器)` 找到真正要处理的行，再从行上读取数据。相比给每个子元素单独注册，监听数量从 N 个降为 1 个，也避免了大批量节点的绑定开销。

```js
const list = document.createElement("ul");
list.innerHTML = '<li data-id="1"><span>第一项</span></li>';
list.addEventListener("click", (event) => {
  const item = event.target.closest("li");
  console.log(item.dataset.id); // "1"
});
list.querySelector("span").click();
```

### 2. 动态节点

委托的价值在动态内容上最明显：新插入的子节点没有自己的监听，但点击仍会冒泡到父元素，被同一个处理函数接住。直接挂在初始节点上的监听不会覆盖后来新增的节点，表现为“新加的行点了没反应”。

```js
const list = document.createElement("ul");
list.addEventListener("click", (event) => {
  const item = event.target.closest("li");
  if (item) console.log(item.dataset.id);
});
const item = document.createElement("li");
item.dataset.id = "9";
item.textContent = "新增项";
list.append(item);
item.click(); // "9"
```

### 3. 委托的适用边界

委托适合会冒泡的事件，`click`、`input`、`keydown` 都符合；`focus`、`blur` 不冒泡，需要改用 `focusin`、`focusout` 或在捕获阶段监听。子元素调用 `stopPropagation` 会让父层委托收不到事件，用委托时不要在子监听里随意切断传播。`closest` 返回 `null` 时必须先判断，否则访问 `dataset` 会抛 `TypeError`。

## 四、常见事件类型

### 1. 鼠标与键盘事件

`click` 的 `event.button` 为 `0` 表示主键、`1` 为中键、`2` 为右键，只有 `mousedown`、`mouseup` 能区分具体按键。键盘事件的 `event.key` 是按键的字符值（`"Enter"`、`"a"`），`event.code` 是物理位置（`"KeyA"`）；判断快捷键用 `key`，判断布局无关的位置用 `code`。

```js
const button = document.createElement("button");
button.addEventListener("click", (event) => {
  console.log(event.type, event.button); // click 0
});
button.click();
```

### 2. 输入与表单事件

`input` 在用户每次修改输入值时触发，`change` 在值改变并失去焦点时触发；程序赋值不会触发任何一个，需要时手动派发。`submit` 事件处理中调用 `preventDefault` 才能阻止页面刷新，这也是前端表单校验的入口。

```js
const form = document.createElement("form");
form.addEventListener("submit", (event) => {
  event.preventDefault();
  console.log("已拦截", event.defaultPrevented); // 已拦截 true
});
document.body.append(form);
form.requestSubmit();
```

`requestSubmit()` 会走与用户提交相同的流程，包括校验与 `submit` 事件；`submit()` 直接提交表单、不触发 `submit` 事件，二者不能混用。上面的表单插入文档后才派发事件，未插入文档的表单调用 `requestSubmit` 不会触发监听。

### 3. 窗口事件

`resize`、`scroll` 监听在 `window` 上，`scroll` 也可以挂在可滚动元素上；这两类事件触发频繁，回调里不要直接做重排或远程请求，应配合防抖或节流合并处理。页面卸载前的清理放在 `pagehide` 或 `beforeunload` 中，具体生命周期见“页面生命周期与性能观察”。

```js
window.addEventListener("resize", () => console.log("收到 resize"));
window.dispatchEvent(new Event("resize")); // 收到 resize
```

## 五、从空目录观察事件

### 1. 创建页面

新建空目录 `js-events`，创建 `index.html`。页面为顺序、阻止传播、移除监听、一次性监听、委托、默认行为、自定义事件和键盘事件各准备一组元素，脚本用 `dispatchEvent` 与 `click()` 触发，把每次观察的结果写入表格。

::: details 查看 index.html 完整内容

```html [index.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>事件模型与委托观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>事件模型与委托观察</h1>
  <div id="a-outer"><button id="a-inner" type="button">A</button></div>
  <div id="b-outer"><button id="b-inner" type="button">B</button></div>
  <button id="c-remove" type="button">C</button>
  <button id="d-once" type="button">D</button>
  <ul id="menu">
    <li class="row" data-id="1"><span class="label">第一项</span></li>
    <li class="row" data-id="2"><span class="label">第二项</span></li>
  </ul>
  <label><input id="agree" type="checkbox"> 同意（阻止默认行为）</label>
  <label><input id="plain" type="checkbox"> 普通勾选</label>
  <div id="event-parent"><span id="event-child">子节点</span></div>
  <input id="key-input" type="text" placeholder="回车">
  <table id="output">
    <thead><tr><th>观察项</th><th>结果</th><th>说明</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    const results = {};

    const aOuter = document.getElementById("a-outer");
    const aInner = document.getElementById("a-inner");
    const order = [];
    document.addEventListener("click", () => order.push("document 捕获"), true);
    aOuter.addEventListener("click", () => order.push("outer 捕获"), true);
    aInner.addEventListener("click", () => order.push("inner 捕获"), true);
    aInner.addEventListener("click", () => order.push("inner 冒泡"));
    aOuter.addEventListener("click", (event) => {
      order.push("outer 冒泡");
      results.targetId = event.target.id;
      results.currentTargetId = event.currentTarget.id;
    });
    document.addEventListener("click", () => order.push("document 冒泡"));
    aInner.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    results.order = order.join(" → ");

    const bOuter = document.getElementById("b-outer");
    const bInner = document.getElementById("b-inner");
    let outerBubbleCount = 0;
    let immediateThirdRan = false;
    bOuter.addEventListener("click", () => {
      outerBubbleCount += 1;
    });
    bInner.addEventListener("click", () => {});
    bInner.addEventListener("click", (event) => {
      event.stopImmediatePropagation();
    });
    bInner.addEventListener("click", () => {
      immediateThirdRan = true;
    });
    bInner.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    results.outerAfterStop = outerBubbleCount;
    results.thirdAfterImmediate = immediateThirdRan;

    const stopInner = document.createElement("button");
    const stopOuter = document.createElement("div");
    stopOuter.append(stopInner);
    let stopOuterCount = 0;
    stopOuter.addEventListener("click", () => {
      stopOuterCount += 1;
    });
    stopInner.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    stopInner.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    results.outerAfterStopPropagation = stopOuterCount;

    const removeButton = document.getElementById("c-remove");
    let sameRefCount = 0;
    let newRefCount = 0;
    const sameHandler = () => {
      sameRefCount += 1;
    };
    removeButton.addEventListener("click", sameHandler);
    removeButton.click();
    removeButton.removeEventListener("click", sameHandler);
    removeButton.click();
    results.sameRefCount = sameRefCount;

    removeButton.addEventListener("click", () => {
      newRefCount += 1;
    });
    removeButton.removeEventListener("click", () => {});
    removeButton.click();
    removeButton.click();
    results.newRefCount = newRefCount;

    const onceButton = document.getElementById("d-once");
    let onceCount = 0;
    onceButton.addEventListener("click", () => {
      onceCount += 1;
    }, { once: true });
    onceButton.click();
    onceButton.click();
    results.onceCount = onceCount;

    const menu = document.getElementById("menu");
    let directCount = 0;
    let delegatedId = null;
    for (const row of menu.querySelectorAll(".row")) {
      row.addEventListener("click", () => {
        directCount += 1;
      });
    }
    menu.addEventListener("click", (event) => {
      const row = event.target.closest(".row");
      if (row) {
        delegatedId = row.dataset.id;
      }
    });
    menu.querySelector(".label").click();
    results.firstDelegatedId = delegatedId;

    const third = document.createElement("li");
    third.className = "row";
    third.dataset.id = "3";
    const thirdLabel = document.createElement("span");
    thirdLabel.className = "label";
    thirdLabel.textContent = "第三项";
    third.append(thirdLabel);
    menu.append(third);
    thirdLabel.click();
    results.dynamicDelegatedId = delegatedId;
    results.directCount = directCount;

    const agree = document.getElementById("agree");
    agree.addEventListener("click", (event) => {
      event.preventDefault();
      results.defaultPrevented = event.defaultPrevented;
    });
    agree.click();
    results.agreeChecked = agree.checked;

    const plain = document.getElementById("plain");
    plain.click();
    results.plainChecked = plain.checked;

    const eventParent = document.getElementById("event-parent");
    const eventChild = document.getElementById("event-child");
    let parentSaw = 0;
    eventParent.addEventListener("custom", () => {
      parentSaw += 1;
    });
    eventChild.dispatchEvent(new Event("custom"));
    results.parentSawNonBubbling = parentSaw;
    eventChild.dispatchEvent(new Event("custom", { bubbles: true }));
    results.parentSawBubbling = parentSaw;

    const keyInput = document.getElementById("key-input");
    keyInput.addEventListener("keydown", (event) => {
      results.keyValue = event.key;
    });
    keyInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    const rows = [
      ["捕获与冒泡的调用顺序", results.order, "从 document 到目标再回到 document"],
      ["outer 冒泡处理中的 event.target.id", results.targetId, "始终是触发源"],
      ["outer 冒泡处理中的 event.currentTarget.id", results.currentTargetId, "当前处理节点"],
      ["stopPropagation 后 outer 冒泡计数", results.outerAfterStopPropagation, "传播被切断"],
      ["stopImmediatePropagation 后 outer 冒泡计数", results.outerAfterStop, "传播被切断"],
      ["stopImmediatePropagation 后同一元素的第三个监听", results.thirdAfterImmediate, "立即停止"],
      ["removeEventListener 传入同一函数后的次数", results.sameRefCount, "监听已移除"],
      ["removeEventListener 传入新匿名函数后的次数", results.newRefCount, "引用不同，移除失败"],
      ["once: true 监听两次点击后的次数", results.onceCount, "只触发一次"],
      ["委托读到第一行的 data-id", results.firstDelegatedId, "从事件源向上找行"],
      ["动态新增行点击后的 data-id", results.dynamicDelegatedId, "委托照顾新节点"],
      ["直接挂在初始行上的监听计数", results.directCount, "新增行不受影响"],
      ["preventDefault 后 checkbox.checked", results.agreeChecked, "默认勾选被阻止"],
      ["preventDefault 后 event.defaultPrevented", results.defaultPrevented, "标记已阻止"],
      ["普通 checkbox 点击后的 checked", results.plainChecked, "默认行为生效"],
      ["非冒泡自定义事件到达父元素的次数", results.parentSawNonBubbling, "不向上传播"],
      ["冒泡自定义事件到达父元素的次数", results.parentSawBubbling, "累计一次"],
      ["keydown 事件的 key", results.keyValue, "读取按键值"],
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

    console.log("order", results.order);
    console.log("target", results.targetId, results.currentTargetId);
    console.log("stop", results.outerAfterStop, results.thirdAfterImmediate);
    console.log("delegate", results.firstDelegatedId, results.dynamicDelegatedId, results.directCount);
  </script>
</body>
</html>
```

:::

### 2. 读取结果

打开页面后，表格应有十八行。捕获与冒泡的顺序为 `document 捕获 → outer 捕获 → inner 捕获 → inner 冒泡 → outer 冒泡 → document 冒泡`；`target` 恒为 `a-inner`，`currentTarget` 为 `a-outer`。两种停止传播方法都使外层冒泡计数为 `0`，`stopImmediatePropagation` 还使同一元素的第三个监听未执行。传入同一函数移除后计数停在 `1`，传入新匿名函数则继续增长到 `2`；`once: true` 两次点击只计 `1`。委托在第一行读到 `1`，新增行读到 `3`，而直接监听只覆盖初始行，计数为 `1`。`preventDefault` 后复选框保持未勾选且 `defaultPrevented` 为 `true`，普通复选框勾选成功；非冒泡事件不达父元素，冒泡事件到达一次；键盘事件读到 `Enter`。控制台四条输出与表格一致。

| 观察项 | 结果 | 说明 |
|--------|------|------|
| 捕获与冒泡的调用顺序 | `document 捕获 → outer 捕获 → inner 捕获 → inner 冒泡 → outer 冒泡 → document 冒泡` | 从 `document` 到目标再回到 `document` |
| `outer` 冒泡处理中的 `event.target.id` | `"a-inner"` | 始终是触发源 |
| `outer` 冒泡处理中的 `event.currentTarget.id` | `"a-outer"` | 当前处理节点 |
| `stopPropagation` 后 `outer` 冒泡计数 | `0` | 传播被切断 |
| `stopImmediatePropagation` 后 `outer` 冒泡计数 | `0` | 传播被切断 |
| `stopImmediatePropagation` 后同一元素的第三个监听 | `false` | 立即停止 |
| `removeEventListener` 传入同一函数后的次数 | `1` | 监听已移除 |
| `removeEventListener` 传入新匿名函数后的次数 | `2` | 引用不同，移除失败 |
| `once: true` 监听两次点击后的次数 | `1` | 只触发一次 |
| 委托读到第一行的 `data-id` | `"1"` | 从事件源向上找行 |
| 动态新增行点击后的 `data-id` | `"3"` | 委托照顾新节点 |
| 直接挂在初始行上的监听计数 | `1` | 新增行不受影响 |
| `preventDefault` 后 `checkbox.checked` | `false` | 默认勾选被阻止 |
| `preventDefault` 后 `event.defaultPrevented` | `true` | 标记已阻止 |
| 普通 `checkbox` 点击后的 `checked` | `true` | 默认行为生效 |
| 非冒泡自定义事件到达父元素的次数 | `0` | 不向上传播 |
| 冒泡自定义事件到达父元素的次数 | `1` | 累计一次 |
| `keydown` 事件的 `key` | `"Enter"` | 读取按键值 |

### 3. 失败分支

创建 `inner-target.html`，在父元素上注册两个监听：一个读取 `event.target.dataset.id`，一个用 `closest(".row")` 找行。点击行内的 `<span>` 时，前者得到 `event.target.tagName: SPAN / event.target.dataset.id: undefined`，后者得到 `closest(".row").dataset.id: 1`。委托中直接用 `target` 读数据，只要点击落在子元素上就会取到 `undefined`，这是最常见的委托错误。

::: details 查看 inner-target.html 完整内容

```html [inner-target.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>委托时误用 target 的观察</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>委托时误用 target 的观察</h1>
  <ul id="menu">
    <li class="row" data-id="1"><span class="label">第一项</span></li>
    <li class="row" data-id="2"><span class="label">第二项</span></li>
  </ul>
  <p id="target-out">未点击</p>
  <p id="closest-out">未点击</p>
  <script>
    const targetOut = document.getElementById("target-out");
    const closestOut = document.getElementById("closest-out");
    const menu = document.getElementById("menu");

    menu.addEventListener("click", (event) => {
      targetOut.textContent =
        "event.target.tagName: " + event.target.tagName +
        " / event.target.dataset.id: " + event.target.dataset.id;
    });

    menu.addEventListener("click", (event) => {
      const row = event.target.closest(".row");
      closestOut.textContent =
        "closest(\".row\").dataset.id: " + (row ? row.dataset.id : "null");
    });

    document.querySelector(".label").click();
  </script>
</body>
</html>
```

:::

另一类静默失败发生在子元素上：子监听调用 `stopPropagation` 后，父元素的委托监听不再收到事件，表现为“某些行点了没反应”。排查时在父层监听里打日志，确认事件是否到达。

## 六、验证记录与边界

以上页面于 2026-11-15 在 macOS 的 Chrome 157.0.8103.79 中通过 `file://` 打开核对。表格十八行与控制台四条输出与正文一致；`inner-target.html` 得到 `event.target.dataset.id: undefined` 与 `closest(".row").dataset.id: 1`。两个 HTML 文件与全部行内片段都经实际执行验证，HTML 经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。

本文没有验证其他浏览器与旧版本环境，也没有展开 `passive` 监听对滚动的影响、触摸与指针事件的字段差异、`focusin`/`focusout` 与 `focus` 的冒泡区别、合成事件与 `isTrusted` 的区别，以及框架对原生事件的封装与批量更新；这些内容需要按目标环境核对。
