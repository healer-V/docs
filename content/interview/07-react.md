---
title: "React 面试题"
category: "面试题"
tags:
  - React
  - Redux
  - MobX
excerpt: "围绕 React 状态与数据流、Hooks、副作用、生命周期、状态管理和性能等面试问题，解释更新机制、依赖与清理、常见误区及版本边界，并提供可独立运行的状态更新和 store 示例。"
---

# React 面试题

React 根据 props（外部输入）与 state（组件状态）描述界面。一次渲染计算本轮界面，提交阶段再更新 DOM（文档对象模型）；渲染函数应保持纯粹，请求、订阅等外部交互则需要明确的执行和清理时机。

::: info React 的版本边界
本篇通用机制以 React 18 的函数组件和 createRoot 为基线，完整浏览器示例固定为 18.3.1；React 19 的 ref 参数差异在对应题目说明。JSX 是 JavaScript 的语法扩展，含 JSX 的局部片段需要已有 React 工程及编译配置。
:::

## 一、状态与数据流

状态题先确定数据由谁拥有，再解释更新请求、渲染快照和节点身份。界面内容应由当前状态推导，避免多处保存并同步同一事实。

### 1. React 的渲染与提交有什么区别，重新渲染会重建全部 DOM 吗？

1. **渲染计算界面描述，提交把已确定的变化应用到 DOM；重新渲染不等于重建所有节点。** React 可以复用类型和身份匹配的节点，只更新需要改变的部分。

2. 例如订单数量从 1 变成 2，组件重新执行后产生新描述，但输入框、按钮等匹配节点可以保留。React 会结合类型、位置和 key 判断身份，保留节点并不意味着所有子组件都没有重新执行。

3. 渲染可能被重新尝试或放弃，所以不能在组件函数中提交订单、修改外部变量或建立订阅。一次组件函数调用也不必然对应一次用户可见的 DOM 提交。

参考：[React：渲染与提交](https://react.dev/learn/render-and-commit)。

### 2. useState 更新后为什么仍读到旧值，连续更新怎样累加？

#### 2.1 状态快照与旧值来源

1. **每轮渲染读取的是该轮状态快照，setter 请求后续更新，不会改写当前函数已经拿到的值。** 依赖前一次状态时，应使用函数式更新。

2. **旧值来源：** 当前事件处理器闭包读取的是本轮渲染的 `quantity`。在已经声明 `const [quantity, setQuantity] = useState(1)` 的组件事件中，以下两次调用都排入值 2，而不是依次得到 2 和 3：

   ```javascript
   // OrderPanel.jsx 的事件处理函数内；当前渲染的 quantity 为 1。
   setQuantity(quantity + 1);
   setQuantity(quantity + 1);
   // 后续状态通常为 2，两次提交的替换值都是 2。
   ```

#### 2.2 函数式更新和批处理边界

1. **正确累加：** 把“根据队列中前一个状态再加一”交给函数式更新，而不是重复读取当前闭包的快照；下面仍是同一组件事件中的局部片段：

   ```javascript
   /** 根据队列中的前一数量增加一件；返回新数量，不产生副作用。 */
   function addOne(previousQuantity) { return previousQuantity + 1; }
   setQuantity(addOne);
   setQuantity(addOne);
   // 初值为 1 时，队列依次计算为 2、3。
   ```

2. **更新边界：** React 18 的 `createRoot` 会对多种来源的更新自动批处理，但不同事件不能一律视为同一批次。更新对象或数组时创建新值；直接修改旧对象再传回同一引用，可能无法得到预期更新。

::: tip setter 请求下一轮渲染，不修改当前快照
一次事件里连续调用 `setQuantity(quantity + 1)`，两次计算都基于当前渲染的 `quantity`。需要依次累加时，向更新队列提交函数，让下一次更新读取队列中的前一结果。
:::

参考：[React：状态更新队列](https://react.dev/learn/queueing-a-series-of-state-updates)、[React：useState](https://react.dev/reference/react/useState)。

### 3. 父子、兄弟与跨层组件如何通信，为什么要提升状态？

#### 3.1 数据所有权和通信方向

1. **props 向下传值，回调向上表达操作意图；兄弟组件共享的数据通常放在最近共同父级。** 状态提升让相关组件拥有同一个可信来源。

   | 关系 | 方案 | 订单场景 |
   |------|------|----------|
   | 父到子 | props、children | 父级提供数量与禁用状态 |
   | 子到父 | 调用父级传入的回调 | 子级请求将数量改为 3 |
   | 兄弟间 | 共同父级协调 | 数量输入与订单小计共享 quantity |
   | 跨层 | Context 或合适的 store | 子树共享用户信息或跨页面购物车 |

#### 3.2 props、ref 与全局状态边界

1. 父级回调可以检查库存，再决定是否改变状态；不是子级拿到一个对象就可以直接修改其中字段。props 只读是数据流约定，嵌套对象不会因此在运行时自动深度冻结。

2. ref 适合聚焦、滚动等必要命令，children 负责内容组合，二者都不应取代常规状态流。将所有临时输入都塞进全局 store，也会扩大依赖和重置成本。

参考：[React：共享状态](https://react.dev/learn/sharing-state-between-components)。

### 4. 受控与非受控输入有什么区别，为什么输入框不能随意切换模式？

#### 4.1 两种输入模式的状态来源

1. **受控输入由 React 的 value 或 checked 决定当前值，非受控输入由 DOM 保存当前值，React 提供初始值并按需读取。** 选择依据是数据是否需要持续参与校验和其他界面计算。

   以下是已配置 React 与 JSX 编译的工程中 `OrderNote.jsx` 的局部组件，省略入口：

   ```jsx
   // OrderNote.jsx
   import { useState } from "react";
   /** 提供受控订单备注输入；返回表单区域，由组件持有文字状态。 */
   export default function OrderNote() {
     const [note, setNote] = useState("");
     /** 输入发生变化时同步文字；无返回值。 */
     function changeNote(event) { setNote(event.target.value); }
     return <label>备注<input value={note} onChange={changeNote} /></label>;
   }
   ```

#### 4.2 切换模式与文件输入的约束

1. 非受控输入可以使用 defaultValue，并通过 ref 或 FormData 在提交时读取。文件选择通常由浏览器控制，不能把任意本地文件路径当作受控 value 写进去。

2. 受控文本 value 应保持字符串，初始使用空字符串而非 undefined，再在 onChange 同步更新。给 value 却不提供修改方式会形成只读行为；在 undefined 与字符串之间切换会改变受控状态并产生警告。

参考：[React：input](https://react.dev/reference/react-dom/components/input)。

### 5. key 如何决定组件身份，为什么重排列表不宜使用索引？

#### 5.1 key 与列表位置的关系

1. **key 帮助 React 区分同一父级下的节点身份，稳定业务键使组件状态与业务记录对应。** 它不是提供给组件读取的普通 prop。

2. 订单 A、B 各自有输入状态，删除 A 后若使用索引，原 A 的位置可能被 B 复用，状态发生错位。使用稳定订单号可维持正确对应；需要子级读取编号，还要另外传 orderId。

#### 5.2 状态复用和重置的条件

1. 改变 key 可有意重置组件，例如切换订单时清除未提交的编辑状态；每轮渲染随机生成 key 则会持续销毁并新建节点。key 只要求同级唯一，不是全站唯一。

2. 没有增删、排序或身份状态的固定列表可以评估索引，但应说明成立条件。key 本身不让昂贵组件计算自动消失，也不能保证不同组件类型被复用。

参考：[React：状态的保留与重置](https://react.dev/learn/preserving-and-resetting-state)。

## 二、Hooks 与逻辑复用

Hooks 连接组件的状态、上下文和生命周期能力。应区分改变界面的状态、保留可变引用的数据，以及自定义 Hook 复用的逻辑。

### 1. Hooks 为什么不能放在条件或循环中，自定义 Hook 会共享状态吗？

#### 1.1 Hook 调用顺序与状态对应

1. **useState、useEffect 等常规 Hooks 依赖稳定的调用顺序，应在组件或自定义 Hook 的顶层调用。** 条件变化造成调用数量或顺序变化，就会使 Hook 与保存状态的对应关系失效。

2. **结构调整：** 需要条件行为时，把条件放进 Effect 或事件的内部逻辑，或提取独立子组件，保持组件自身的 Hook 调用顺序不变。普通工具函数、类组件和任意事件回调不能调用这些常规 Hooks。

#### 1.2 条件逻辑和共享状态边界

1. **状态归属：** 自定义 Hook 复用的是状态组织和副作用逻辑。两个组件各自调用 `useOrder`，会各自保存状态；真正共享数据仍需提升状态、Context 或外部 store。

2. React 19 的 use API 有专门的条件与循环使用规则，不能用它的例外推导出所有 Hooks 都能条件调用。检查时结合 React Hooks 的 lint 规则。

::: warning 复用 Hook 代码不等于共享 Hook 状态
每次在组件树中的调用都有各自的状态位置。面试回答应区分“抽取共同逻辑”和“让多个组件读取同一数据来源”，后者需要明确状态所有者。
:::

参考：[React：Hooks 规则](https://react.dev/reference/rules/rules-of-hooks)、[React：复用自定义 Hook](https://react.dev/learn/reusing-logic-with-custom-hooks)。

### 2. 复杂状态为何需要 reducer，请求应放在什么位置？

#### 2.1 纯 reducer 的状态转换

1. **useReducer 适合把多个事件驱动的状态转换集中到纯 reducer；useState 适合较简单的独立状态。** reducer 根据旧状态和 action 返回新状态，不在其中请求、订阅或修改外部数据。

   | 参数与返回 | 含义 |
   |------------|------|
   | reducer | 接收 state 与 action，计算新状态 |
   | initialArg | 必须提供的初始化输入，不会自动取 reducer 的默认参数 |
   | 可选 init | 从 initialArg 计算初始状态 |
   | `[state, dispatch]` | 当前状态及派发 action 的入口 |

#### 2.2 异步请求与副作用位置

1. **状态转换：** 订单提交可由 idle、submitting、success、error 组成状态机，action 表达“开始、成功、失败”等事件。请求在事件处理或合适的异步层执行，再把结果派发给 reducer；`useReducer` 本身不是异步请求工具。

2. **纯函数原因：** reducer 对相同 state 与 action 应得到相同新状态，不修改外部数据。开发检查可能重复调用它，若其中发请求就可能重复产生副作用。action 应表达业务事件，而不是暴露内部字段的任意改写入口。

::: warning reducer 管状态结果，不执行外部副作用
把支付请求写进 reducer，会让状态计算依赖网络并破坏可重复执行性。应在触发操作的事件或负责外部同步的层执行请求，再派发结果事件更新状态。
:::

参考：[React：useReducer](https://react.dev/reference/react/useReducer)。

### 3. useRef 与 useState 有何区别，修改 ref.current 会更新界面吗？

1. **useRef 返回跨渲染保留的引用容器，修改 current 不会主动请求渲染；useState 用于影响界面的数据。** ref 可保存 DOM 节点、计时器句柄或不需要展示的可变信息。

2. 例如输入框 ref 用于聚焦，轮询句柄 ref 用于停止定时器；订单数量应使用 state，因为数量变化需要反映到页面。不能把所有数据放进 ref，再期望界面自动跟随变化。

3. 节点在挂载前或卸载后可能为 null，命令应在事件或适当 Effect 中检查再执行。除可预测的初始化等特定模式外，不应在渲染时随意读写可变 current 来决定界面，否则破坏渲染的一致性。

参考：[React：useRef](https://react.dev/reference/react/useRef)。

### 4. useImperativeHandle 暴露什么，React 18 与 19 如何传 ref？

#### 4.1 命令式句柄与版本差异

1. **它定制父级 ref 可访问的命令对象，createHandle 不接收组件实例参数。** React 18 通常通过 forwardRef 接收 ref；React 19 可以将 ref 作为函数组件 prop 接收。

   以下是 React 18 JSX 工程中的 `OrderInput.jsx` 局部组件，省略父组件与入口；父级挂载后可调用 ref.current.focus()：

   ::: details 查看限定聚焦命令的组件

   ```jsx
   // OrderInput.jsx
   import { forwardRef, useImperativeHandle, useRef } from "react";
   /**
    * 渲染订单编号输入，只暴露聚焦命令。
    * @param props 组件输入，本示例不读取额外字段。
    * @param ref forwardRef 提供的父级引用，挂载前可能未设置。
    * @returns 输入元素，不暴露内部状态。
    */
   function OrderInput(props, ref) {
     const inputRef = useRef(null);
     /** 建立公开命令；返回仅包含 focus 的对象。 */
     function createHandle() {
       /** 父级请求聚焦时访问已挂载节点；无返回值。 */
       function focus() { inputRef.current?.focus(); }
       return { focus };
     }
     useImperativeHandle(ref, createHandle, []);
     return <input ref={inputRef} aria-label="订单编号" />;
   }
   export default forwardRef(OrderInput);
   ```

   :::

#### 4.2 依赖和公开接口边界

1. createHandle 使用的响应式值应列入依赖；此例只引用稳定 ref 容器，不读取 props 或 state。父级也需检查句柄存在，不能在渲染时调用聚焦。

2. 命令式接口用于无法由 props 自然表达的少数操作。用它暴露任意内部状态修改会扩大耦合，弹窗是否打开等常规状态仍优先通过受控接口表达。

参考：[React：useImperativeHandle](https://react.dev/reference/react/useImperativeHandle)。

### 5. useContext 如何找到值，Provider 更新会让哪些组件更新？

#### 5.1 最近 Provider 与默认值

1. **useContext 读取当前组件上方最近的对应 Provider；没有 Provider 时才使用 createContext 的默认值。** 它是按组件树作用域传递依赖，不是天然的全局变量。

2. Provider 的 value 改变时，消费该 Context 的组件会获得更新；身份比较使用 Object.is。每次传入新对象可能使值被认为改变，单独 memo 消费组件不能挡住其需要的 Context 更新。

#### 5.2 身份比较和订阅范围

1. 例如用户身份与高频表单输入可以分开成不同 Context，避免无关订阅一起更新。必要时稳定 Provider 值，但不通过漏掉依赖保存过期内容。

2. 同一组件返回的 Provider 不会改变该组件此前 useContext 读到的值，因为它不位于当前组件上方。Provider value 为 undefined 时读到的就是 undefined，不会自动回退默认值。React 18 使用 Context.Provider，React 19 还支持对应的新 Provider 写法。

参考：[React：useContext](https://react.dev/reference/react/useContext)。

### 6. 自定义 Hook 如何暴露调试状态，useDebugValue 会影响业务吗？

1. **useDebugValue 为自定义 Hook 添加 React DevTools 展示信息，不负责日志输出、状态更新或性能优化。** 它让使用者更容易识别 Hook 当前保存的业务状态。

2. 例如 useOrderConnection 可以展示“连接中、已连接、已断开”，无需暴露一长串底层字段。复杂展示可提供格式化函数，让开发工具需要展示时再处理。

3. 格式化函数应只生成调试表示，不请求数据或改状态。这个 Hook 不是所有自定义 Hook 的必需部分，缺少它也不会影响业务正确性。

参考：[React：useDebugValue](https://react.dev/reference/react/useDebugValue)。

## 三、副作用、依赖与清理

副作用题应从连接外部系统的原因、执行时机、依赖变化和失效清理展开。渲染、事件处理和 Effect 的职责不能混用。

### 1. Effect 为何需要建立与清理，依赖改变时执行什么？

#### 1.1 外部同步与清理的执行顺序

1. **Effect 在客户端提交后同步外部系统；依赖改变时先清理旧效果，再建立新效果，卸载时还会清理。** cleanup 不只在卸载时执行，也不是 useEffect 本身返回给调用方的值。

   | 依赖写法 | 行为 |
   |----------|------|
   | 不传依赖数组 | 每次相应提交后重新同步 |
   | `[]` | 不因普通 props/state 更新而重新同步；仍需考虑挂载、卸载与开发检查 |
   | `[quantity]` | 用 Object.is 比较，quantity 变化时重新同步 |

   在空目录创建 `order-state.html`。完整页面使用固定 React 18.3.1 CDN，需可访问外部脚本；现代浏览器打开后点击“增加两件”，再点击“卸载组件”：

   ::: details 查看状态快照与 Effect 清理的完整页面

   ```html
   <!doctype html>
   <html lang="zh-CN">
   <head>
     <meta charset="utf-8">
     <meta name="viewport" content="width=device-width, initial-scale=1">
     <title>订单状态</title>
     <script src="https://unpkg.com/react@18.3.1/umd/react.development.js"></script>
     <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js"></script>
   </head>
   <body>
     <div id="root"></div>
     <button id="unmount" type="button">卸载组件</button>
     <script>
       const { createElement: h, useState, useEffect } = React;
       /** 渲染订单数量与操作；返回元素，状态由本组件保存。 */
       function OrderPanel() {
         const [quantity, setQuantity] = useState(1);
         /** 提交后同步外部记录；返回清理当前数量记录的函数。 */
         function syncQuantity() {
           console.log("同步", quantity);
           /** 依赖改变或组件卸载时清理旧记录；无返回值。 */
           function cleanupQuantity() { console.log("清理", quantity); }
           return cleanupQuantity;
         }
         useEffect(syncQuantity, [quantity]);
         /** 从前一状态计算新数量；返回增加一件后的数量。 */
         function addOne(previousQuantity) { return previousQuantity + 1; }
         /** 点击时排入两次累加；无返回值。 */
         function addTwo() { setQuantity(addOne); setQuantity(addOne); }
         return h("section", null,
           h("p", null, `数量：${quantity}`),
           h("button", { type: "button", onClick: addTwo }, "增加两件"));
       }
       const root = ReactDOM.createRoot(document.getElementById("root"));
       root.render(h(OrderPanel));
       /** 页面命令卸载组件；无返回值，触发最后一次清理。 */
       function unmountOrder() { root.unmount(); }
       document.getElementById("unmount").addEventListener("click", unmountOrder);
     </script>
   </body>
   </html>
   ```

   :::

#### 1.2 旧资源释放与异步边界

1. 数量从 1 变成 3，卸载后组件区域消失。每个操作完成后再进行下一个操作，控制台输出如下；本页未启用 StrictMode：

   ```text
   同步 1
   清理 1
   同步 3
   清理 3
   ```

2. **清理原因：** 旧 cleanup 保留旧渲染的 `quantity`，新同步前先清理旧连接，避免两轮副作用同时生效。脚本未加载时检查网络和控制台；此例不含请求。Effect 回调不能直接写成 `async` 返回 Promise，应在内部启动异步工作，并同步返回清理函数。

::: info Effect 的对象是外部系统
Effect 用于让组件与订阅、连接、计时器等外部系统保持同步。若只是由 props 和 state 计算显示值，可直接在渲染中计算；多加一层 Effect 往往增加过期状态和重复更新的机会。
:::

参考：[React：useEffect](https://react.dev/reference/react/useEffect)。

### 2. 依赖数组为什么不能随意省略，旧闭包和请求竞态怎样处理？

#### 2.1 旧闭包与请求竞态的区别

1. **Effect 中使用的 props、state 等响应式值需要对应依赖，否则可能长期读取某轮旧渲染的值。** 依赖项不是凭期望执行次数任意填写的开关。

2. **区分两类错误：** 订单号从 A 改为 B，漏写 `orderId` 依赖会一直使用旧闭包中的 A；补上依赖后，A 慢、B 快仍可能让旧请求覆盖新结果。前者是读取过期值，后者是异步完成顺序倒置，不能用同一个补丁解决。

#### 2.2 依赖补全和失效处理

1. **分别处理：** 补齐真实依赖以重新同步；清理时取消支持 AbortSignal 的请求或标记旧任务失效，写回前确认结果仍有效。还要分别处理 HTTP、解析和业务失败；取消不能保证服务端未执行写入。

2. 事件发起的提交通常放在事件处理里；能从现有状态直接计算出的值，优先在渲染中计算。若对象或函数每轮新建导致 Effect 重跑，可以在效果内组织非共享对象或调整职责，不能靠删除依赖掩盖问题。

::: warning 补齐依赖仍不足以解决请求竞态
依赖正确只保证 B 改变后会发出新请求，不保证 B 的响应最后到达。要同时实现旧任务失效与写回前校验，并用 A 慢、B 快的测试顺序验证最终界面。
:::

参考：[React：移除不必要的依赖](https://react.dev/learn/removing-effect-dependencies)、[React：是否需要 Effect](https://react.dev/learn/you-might-not-need-an-effect)。

### 3. useLayoutEffect 与 useEffect 有何区别，前者越早就越好吗？

#### 3.1 布局测量与绘制时机

1. **useLayoutEffect 在 DOM 提交后、浏览器绘制前执行，可以测量布局并同步修正界面；useEffect 通常适合不阻塞绘制的外部同步。** 两者都可返回 cleanup，setup 不接收组件实例。

2. 例如提示层需先测量尺寸再定位，使用 layout Effect 可以避免先显示错误位置。连接订阅、记录非视觉状态等通常无需阻塞绘制，使用普通 Effect 更合适。

#### 3.2 阻塞成本和服务端边界

1. layout Effect 中的耗时工作及其同步更新会阻塞显示，应尽量缩小范围。普通 Effect 的绘制相对时机还受交互等条件影响，不能断言永远在 paint 之后执行。

2. 两类 Effect 都不在服务端渲染中执行。只在浏览器才能测量的界面应设计客户端路径，不能以服务端没有 DOM 为由随意伪造布局结果。

参考：[React：useLayoutEffect](https://react.dev/reference/react/useLayoutEffect)。

### 4. StrictMode 为什么让渲染或 Effect 看起来执行两次？

#### 4.1 开发环境的重复检查

1. **StrictMode 在开发环境增加检查，用来发现不纯渲染和遗漏清理。** 它不是生产环境所有事件都自动执行两次的规则。

2. 在 React 18 的严格模式下，组件渲染与某些纯计算可能被额外调用，Effect 会经历额外的建立、清理、再建立。真正正确的订阅应在这套检查后仍只保留有效连接。

#### 4.2 资源清理与正确性验证

1. 例如每次建立连接却没有断开，开发阶段更容易看到重复连接。应修复 cleanup、重复写入与状态所有权，不能只关闭 StrictMode 或用 ref 跳过建立逻辑来隐藏资源问题。

2. 次数不能代替正确性判断。测试应看最终界面、有效监听数量和卸载后的资源，而不是要求开发日志严格只出现一次；具体检查还需结合 React 版本和 StrictMode 放置范围。

::: tip 用资源状态验证清理，而不数日志次数
StrictMode 的开发检查会暴露重复建立而未清理的连接。验收重点是同一时刻有效订阅数量、最终界面和卸载后资源是否释放，而不是某条日志只出现一次。
:::

参考：[React：StrictMode](https://react.dev/reference/react/StrictMode)。

## 四、类组件与错误边界

维护历史项目仍需理解类组件，但不要把函数组件的 Effect 机械地等同于某一个生命周期方法。渲染异常与事件、请求失败也有不同的处理入口。

### 1. 类组件的挂载、更新和卸载分别经过哪些阶段？

#### 1.1 类组件的主要生命周期

1. **render 计算界面，提交阶段的生命周期处理 DOM 及外部同步。** constructor 用于初始化，不是执行请求或建立全局订阅的可靠位置。

   | 阶段 | 常见顺序 | 职责或限制 |
   |------|----------|------------|
   | 挂载 | constructor → getDerivedStateFromProps → render → componentDidMount | 初始化、计算界面、提交后连接资源 |
   | 更新 | getDerivedStateFromProps → shouldComponentUpdate → render → getSnapshotBeforeUpdate → componentDidUpdate | 可跳过渲染，必要时保存更新前 DOM 信息 |
   | 卸载 | componentWillUnmount | 清理监听、计时器与连接 |

#### 1.2 更新跳过和状态同步边界

1. 表中方法均以组件实际定义且正常更新为条件；shouldComponentUpdate 返回 false 可以跳过后续渲染路径。getSnapshotBeforeUpdate 在新 DOM 更新前读取旧布局，结果交给 componentDidUpdate 使用，不是任意状态的存储入口。

2. getDerivedStateFromProps 应保持纯粹，通常不需要把所有 props 复制进 state。componentDidUpdate 中无条件 setState 会形成更新循环。函数 Effect 关注同步与清理过程，不能简单一对一替换所有类生命周期。

参考：[React：Component](https://react.dev/reference/react/Component)。

### 2. 错误边界为何不能替代请求与事件错误处理？

#### 2.1 边界能捕获的错误

1. **错误边界主要接住子树渲染及相关生命周期中的异常，提供降级界面与记录入口。** 传统类边界使用 getDerivedStateFromError 生成降级状态，componentDidCatch 记录错误。

2. 常规事件处理器、计时器、普通异步 Promise 拒绝及服务端渲染中的错误，不应假定会被传统客户端边界自动接住。边界自身抛出的错误也要由更上层处理。

#### 2.2 请求与事件错误的处理

1. 例如订单详情组件渲染异常可显示该区域降级；提交按钮请求失败则在请求路径捕获并更新错误状态。错误边界不能取代表单提示、重试和后端错误协议。

2. 应选择能隔离故障的边界粒度，保留可用区域，并设计重置与记录策略。React 没有把 useEffect 的 try/catch 变成全树错误边界；框架的数据加载和服务端错误机制需按具体实现区分。

::: warning 渲染降级与操作失败要分开处理
组件渲染抛错可由上层边界显示降级界面；提交订单的请求失败应由该操作路径捕获并提示重试。把错误边界当作所有异步错误的兜底，会漏掉用户当前操作的反馈。
:::

参考：[React：错误边界](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)。

## 五、状态管理与性能

状态库处理共享数据的更新与订阅，性能优化则依据实际瓶颈选择措施。缓存计算、缓存函数、组件比较和代码分块各解决不同的问题。

### 1. useMemo 与 useCallback 缓存什么，能自动解决旧闭包吗？

#### 1.1 缓存计算结果与函数身份

1. **useMemo 缓存计算结果，useCallback 缓存函数身份，依赖没有改变时可以复用。** useCallback 不调用你的函数，也不会自动把函数变成“永远能读到最新值”。

   | 场景 | 方案 | 边界 |
   |------|------|------|
   | 昂贵的订单筛选与汇总 | useMemo | 计算必须纯粹，依赖完整 |
   | 向 memo 子组件传入回调 | useCallback | 需配合子级比较和其他稳定 props 才可能有收益 |
   | 普通加法或无比较需求的回调 | 通常直接计算或定义 | 缓存本身也有管理成本 |

#### 1.2 依赖正确性和测量边界

1. 遗漏 quantity 依赖的回调仍会捕获旧值；依赖正确或使用适合的函数式状态更新才处理这类问题。useMemo 也不负责阻止组件自身重新执行。

2. 这些缓存用于性能，不应承担业务正确性的唯一保证。无证据地给每个表达式套缓存，可能增加复杂度而没有实际收益；若项目启用 React Compiler，还要结合其实际配置判断人工缓存需求。

参考：[React：useMemo](https://react.dev/reference/react/useMemo)、[React：useCallback](https://react.dev/reference/react/useCallback)。

### 2. React.memo、PureComponent 与 shouldComponentUpdate 如何比较更新？

#### 2.1 浅比较的对象身份条件

1. **memo 常按 Object.is 逐项比较 props，PureComponent 浅比较 props 和 state，shouldComponentUpdate 允许类组件自定义更新判断。** 它们不负责递归判断任意对象内容。

2. 父级每次创建新的 address 对象或回调，浅比较可能认为 props 已改变；直接修改同一对象，又可能隐藏真正变化。性能比较必须建立在正确的不可变更新和输入边界上。

#### 2.2 上下文、闭包和比较成本

1. memo 组件仍会因自身 state 或所消费 Context 改变而更新。自定义比较必须考虑所有影响输出和行为的 props，包括函数；错误忽略回调会保留过期闭包。

2. 比较成本也需测量。如果深比较比组件渲染更贵，或输入本来每次都变，优化没有收益。shouldComponentUpdate 是优化入口，不是拒绝业务更新的权限机制。

参考：[React：memo](https://react.dev/reference/react/memo)、[React：PureComponent](https://react.dev/reference/react/PureComponent)。

### 3. Redux 如何保证状态更新可追踪，Redux Toolkit 改进了什么？

#### 3.1 Redux 的状态流与 Toolkit

1. **事件触发 dispatch(action)，reducer 计算新状态，store 通知订阅者，界面读取新结果。** action、reducer 和 store 是这条数据流中的角色，不是三种互相独立的数据流。

2. Redux Toolkit 的 configureStore 和 createSlice 减少标准配置及 action 的重复代码。createSlice 中看似修改 state 的写法由 Immer 草稿机制生成不可变结果，不能推广为普通 reducer 允许直接修改旧状态。

   安装 Node.js 22 或更高版本，在空目录执行以下 PowerShell 命令，然后创建 `order-store.mjs`：

   ```powershell
   npm init -y
   npm install @reduxjs/toolkit@2.9.0
   ```

   ::: details 查看 order-store.mjs 的完整 Redux 状态更新

   ```javascript
   // order-store.mjs
   import { configureStore, createSlice } from "@reduxjs/toolkit";
   /**
    * 根据数量更新事件修改 Immer 草稿。
    * @param state 当前草稿，quantity 为非负整数。
    * @param action 包含 payload 的 action；本例仅接受已校验的非负整数。
    * @returns 无显式返回值，由 Immer 生成后续不可变状态。
    */
   function quantityChanged(state, action) { state.quantity = action.payload; }
   const orderSlice = createSlice({
     name: "order",
     initialState: { quantity: 1 },
     reducers: { quantityChanged }
   });
   export const store = configureStore({ reducer: { order: orderSlice.reducer } });
   /** 从 root state 读取数量；返回 number，不修改状态。 */
   export function selectQuantity(state) { return state.order.quantity; }
   console.log(selectQuantity(store.getState()));
   store.dispatch(orderSlice.actions.quantityChanged(3));
   console.log(selectQuantity(store.getState()));
   ```

   :::

#### 3.2 运行验证和 React 接入

1. 运行 `node order-store.mjs`，预期输出如下，证明 action 经过 reducer 更新了 store：

   ```text
   1
   3
   ```

2. React 工程还需安装兼容版本的 react-redux，在根部提供 `<Provider store={store}>`，组件通过 useSelector 订阅读取、useDispatch 派发。只创建 connect 后的组件却仍渲染未连接组件，不能获得对应注入；Provider 也不会自动给任意组件填充 props。

3. 异步请求在 thunk、RTK Query 等合适的逻辑层组织，不写进纯 reducer。本例只验证同步 store，没有覆盖参数校验、网络请求或持久化；是否需要 Redux 取决于共享状态的复杂度。

参考：[Redux Toolkit：快速入门](https://redux-toolkit.js.org/tutorials/quick-start)。

### 4. MobX 如何追踪更新，observer 和 action 分别负责什么？

#### 4.1 响应式读取与 action 的职责

1. **MobX 跟踪被读取的 observable 数据，observer 让 React 渲染订阅对应数据，action 组织状态修改。** 仅把对象放进 Provider 不等于组件已经建立订阅。

   安装 Node.js 22 或更高版本，在另一个空目录执行以下 PowerShell 命令，再创建 `order-observable.mjs`：

   ```powershell
   npm init -y
   npm install mobx@6.13.7
   ```

   ::: details 查看 order-observable.mjs 的完整依赖追踪

   ```javascript
   // order-observable.mjs
   import { autorun, makeAutoObservable } from "mobx";
   /** 保存可观察的订单数量，通过动作更新，派生小计。 */
   class OrderStore {
     quantity = 1;
     /** 创建可观察状态并自动绑定动作；无返回值。 */
     constructor() { makeAutoObservable(this, {}, { autoBind: true }); }
     /** 读取整数演示价格的小计；返回元金额，不修改状态。 */
     get subtotal() { return this.quantity * 20; }
     /** 增加一件数量；无返回值，触发相关依赖更新。 */
     increaseQuantity() { this.quantity += 1; }
   }
   const order = new OrderStore();
   /** 跟踪并输出小计；无返回值，只订阅本次读取的数据。 */
   function reportSubtotal() { console.log(order.subtotal); }
   const stop = autorun(reportSubtotal);
   order.increaseQuantity();
   stop();
   order.increaseQuantity(); // 已取消订阅，不再由该 autorun 输出。
   ```

   :::

2. 运行 `node order-observable.mjs`，预期输出如下，证明依赖更新以及取消订阅：

   ```text
   20
   40
   ```

#### 4.2 组件订阅与异步修改

1. React 函数组件通常使用 mobx-react-lite 的 observer 包裹，并在渲染中读取 observable 字段。若提前在 observer 外取出原始值，后续渲染就不一定追踪到原字段；共享 store 可经 props 或 Context 提供。

2. makeAutoObservable 适合本例这样的普通类，并不适用于任意继承结构。await 之后的状态修改不自动属于原 action，应使用 runInAction 等方式重新组织；autorun、reaction 和连接也要在生命周期结束时清理。

参考：[MobX：可观察状态](https://mobx.js.org/observable-state.html)、[MobX：React 集成](https://mobx.js.org/react-integration.html)、[MobX：Action](https://mobx.js.org/actions.html)。

### 5. React.lazy 与 Suspense 如何实现组件懒加载，能接住所有请求吗？

#### 5.1 组件加载与挂起行为

1. **lazy 根据加载函数返回的 Promise 取得组件，Suspense 在子树挂起时显示 fallback。** 动态 import 常与打包器分块配合，加载失败还需要错误处理。

   以下为已有 React JSX 工程中 `ReportRegion.jsx` 的局部组件，要求同目录 `OrderReport.jsx` 默认导出报告组件，省略该报告实现与入口：

   ```jsx
   // ReportRegion.jsx
   import { lazy, Suspense } from "react";
   /** 首次需要报告时加载模块；返回含 default 组件的 Promise。 */
   function loadReport() { return import("./OrderReport.jsx"); }
   const OrderReport = lazy(loadReport);
   /** 提供报告加载占位；返回懒加载区域。 */
   export default function ReportRegion() {
     return <Suspense fallback={<p>加载报告中</p>}><OrderReport /></Suspense>;
   }
   ```

#### 5.2 加载失败和普通请求边界

1. lazy 声明放在组件外，避免每次重新创建组件身份。默认导出约定、产物路径、网络缓存和部署版本都要匹配；分块加载失败应由合适的错误边界与重试策略处理。

2. Suspense 不会自动发现 useEffect 中任意 fetch 的加载状态。可参与 Suspense 的数据来源需使用框架或兼容的接入机制；普通请求仍要明确 loading、error 与取消状态。

参考：[React：lazy](https://react.dev/reference/react/lazy)、[React：Suspense](https://react.dev/reference/react/Suspense)。

### 6. 页面卡顿和首屏慢的根因如何区分，何时才需要 memo？

#### 6.1 加载、渲染与绘制的成本

1. **先区分资源加载、组件计算、DOM 提交、布局与绘制，再针对实际瓶颈优化。** memo 只能影响部分重复渲染，不会自动缩小包体、加快接口或减少巨大 DOM。

   | 现象与证据 | 方向 | 必须考虑的代价 |
   |------------|------|----------------|
   | 首屏脚本体积与执行耗时高 | 代码分块、减少依赖、按需加载 | 后续加载失败与占位 |
   | 相同输入下组件重复计算昂贵 | 调整状态范围、按证据缓存或 memo | 比较与缓存成本、依赖正确性 |
   | 长列表创建大量节点 | 分页或虚拟列表 | 滚动、可访问性及记录状态 |
   | 连续输入触发昂贵更新 | 分离紧急输入与非紧急结果，评估 transition | 不替代节流请求和任务取消 |
   | 浏览器布局与绘制耗时高 | 减少布局抖动、优化节点与样式 | 验证实际视觉结果 |

#### 6.2 Profiler 证据和优化收益

1. 用 React Profiler 和浏览器 Performance 记录同一用户操作，结合网络与产物报告定位；优化后按相同数据复测交互、耗时和内存。开发检查影响调用次数，必要时测生产构建。

2. SSR（服务端渲染）可改善特定首屏路径，但还需 hydration，即客户端接管服务端 HTML；CDN（内容分发网络）改善资源分发，不直接解决组件计算成本。性能方案要说明收益条件，不能把工具列表当作问题已经解决。

::: tip 先用证据判断瓶颈所在阶段
网络慢、脚本大、组件重复计算与浏览器布局慢，分别需要不同处理。只有 Profiler 显示相同输入下存在昂贵的重复渲染，才有理由评估 `memo`，并在优化后复测收益与比较成本。
:::

参考：[React：Profiler](https://react.dev/reference/react/Profiler)、[React：useTransition](https://react.dev/reference/react/useTransition)。

## 六、调度、外部状态与服务端渲染

### 1. React 18 的自动批处理如何改变更新次数，`flushSync` 何时才需要？

**React 18 使用 `createRoot` 时，会将更多场景中的状态更新自动批处理，在合适时机一起提交。** 连续调用两次 setter 不意味着同步产生两次 DOM 提交；也不意味着事件处理函数里的变量立刻变成新值。

1. 在异步回调等场景连续更新多个状态，通常可以合并一次提交；具体是否合并仍由更新时机与边界决定。
2. 需要基于上一次状态计算下一次值时，使用函数式更新，不能依赖闭包里读到的旧值。
3. `flushSync` 可在少数与浏览器或第三方库同步交互的场景强制提交，例如必须在回调结束前测量刚出现的 DOM；它可能损害性能，并非“让状态立即可读”的日常方案。

::: tip 回答要区分状态快照与 DOM 提交
事件处理函数中的状态变量来自当前渲染快照；批处理决定何时提交更新。即使强制提交，当前闭包中的变量也不会自动改写。
:::

参考：[React：自动批处理](https://react.dev/blog/2022/03/29/react-v18#new-feature-automatic-batching)、[React：flushSync](https://react.dev/reference/react-dom/flushSync)。

### 2. `useTransition` 与 `useDeferredValue` 怎样保持输入响应？

**两者帮助把非紧急渲染与紧急输入区分，但作用入口不同。** `useTransition` 在触发状态更新时标记低优先级工作；`useDeferredValue` 在消费已经变化的值时让昂贵的下游渲染暂时使用旧值。

| 场景 | 更直接的选择 | 需要注意 |
|------|--------------|----------|
| 点击标签后切换昂贵视图 | `useTransition` 包裹状态更新 | 过渡可能被更紧急的更新打断并重做 |
| 输入框值必须立即显示，结果列表可稍后更新 | `useDeferredValue` 传给列表 | 输入仍用原始值，不用延迟值控制文本框 |

它们不减少每次网络请求，也不让重计算自动转到 Worker。搜索场景仍需根据查询词设计防抖、取消、缓存或服务端查询；用 Profiler 验证用户输入是否更顺畅。

参考：[React：useTransition](https://react.dev/reference/react/useTransition)、[React：useDeferredValue](https://react.dev/reference/react/useDeferredValue)。

### 3. 外部状态库为什么需要 `useSyncExternalStore`？

**React 需要一个一致的方式订阅组件外部的可变数据，并在渲染时读取快照。** `useSyncExternalStore` 接收订阅函数和快照读取函数；外部状态变化后，React 可以决定是否重新渲染相关组件。

1. 快照在存储未变化时应保持稳定引用；每次调用都返回新对象，可能造成重复渲染甚至循环问题。
2. 订阅函数应返回取消订阅方法，组件卸载时清理监听。订阅函数引用不稳定可能导致无谓的重复订阅。
3. SSR 场景还需提供服务端快照，并让客户端首次 hydration 读取到与服务端一致的数据。

普通组件内状态不需要为了“更高级”而换成外部 Store。面试关注的是**并发渲染下外部状态的一致性和订阅协议**。

参考：[React：useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)。

### 4. 为什么“根据 props 计算一个值”通常不需要 Effect？

**渲染期间能从现有 props 和 state 直接计算的值，应在渲染时计算。** 若用 Effect 再写入另一份 state，通常会先提交过时值，再触发一次额外渲染，还要维护两份状态的一致性。

1. 订单列表的已筛选数量可直接从列表与筛选条件计算；昂贵时先测量，再决定是否用 `useMemo` 缓存。
2. Effect 适合与 React 外部系统同步，例如订阅、网络连接或浏览器 API，并在依赖变化时清理旧同步关系。
3. 若用户操作本身决定行为，优先放在对应事件处理函数中；不要把事件写入 state，再让 Effect 猜测是哪次操作发生。

::: warning 少用 Effect 不代表禁止请求
客户端数据获取可以使用 Effect，但需处理清理和请求竞态；框架数据加载方案通常还能处理 SSR、缓存和预取等问题。
:::

参考：[React：你可能不需要 Effect](https://react.dev/learn/you-might-not-need-an-effect)、[React：同步 Effect](https://react.dev/learn/synchronizing-with-effects)。

### 5. SSR hydration 为什么要求服务端与客户端首轮输出一致？

**`hydrateRoot` 让 React 接管服务端已经生成的 HTML，而不是默认重新生成所有标记。** 客户端首次渲染结果若不同，可能产生警告、错误事件或部分界面表现异常。

1. 常见差异包括在渲染期间读取 `window`、当前时间、随机数、用户语言和仅客户端可用的存储。
2. 服务端与客户端应使用相同初始数据；浏览器专属内容可在 hydration 完成后通过 Effect 更新，必要时设计明确占位。
3. 使用 `onRecoverableError` 等信息和开发环境警告定位问题，并对比两端首轮输出。简单压制警告不能保证事件绑定和用户看到的文本正确。

SSR 可以让 HTML 较早出现，但 JavaScript 下载、执行和 hydration 仍消耗时间；需一起衡量首屏与交互可用时间。

参考：[React：hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot)、[React：服务端渲染](https://react.dev/reference/react-dom/server)。

### 6. React Server Components 与传统 SSR 有什么职责区别？

**Server Components 在服务端执行，可把数据读取和部分渲染逻辑留在服务端；SSR 主要描述服务端先生成可显示的 HTML。** 两者可以结合，不能简单说“用了 Server Components 就不需要客户端 JavaScript”。

1. Server Components 的代码不会作为同样的组件逻辑发送到浏览器，但它们不能直接使用浏览器事件处理或本地交互状态。
2. 需要交互的部分放在 Client Components，并通过框架支持的边界传递可序列化数据；其代码仍需在客户端加载。
3. 实际路由、缓存、流式传输与部署依赖支持 RSC 的框架和构建系统。普通客户端 React 应用不能只把组件改个文件名就获得这些能力。

::: info 版本与框架边界
这里依据 React 19 的官方 Server Components 文档。讨论具体应用时还需说明所用框架版本及其数据加载、缓存和部署约定。
:::

参考：[React：Server Components](https://react.dev/reference/rsc/server-components)、[React：Server/Client 边界](https://react.dev/reference/rsc/use-client)。
