---
title: "浏览器面试题"
tags:
  - 浏览器
  - 渲染
  - 事件循环
excerpt: "围绕浏览器进程与线程、页面渲染、事件循环、异步执行及垃圾回收解释参与角色与调度边界，帮助在面试中从可观察行为推导原因。"
---

# 浏览器面试题

浏览器不是一条“解析 HTML → 执行 JavaScript → 画面出现”的单线程流水线。页面脚本、网络、输入、布局和合成涉及不同角色；具体进程数量与线程分工也随浏览器、平台和站点隔离策略变化。

## 一、进程与线程有什么区别，为什么浏览器要同时使用它们？

**进程提供隔离的运行空间，线程是在进程内执行工作的单位。** 同一进程的线程可以共享该进程内存，不同进程通常通过进程间通信交换数据。

1. **隔离：** 将部分站点内容放在独立渲染进程中，有助于限制崩溃与安全风险的影响范围，但会增加进程和通信开销。
2. **并发：** 渲染进程可以包含主线程、合成相关线程以及执行 Worker 的线程；主线程长时间运行脚本时，其他线程仍可能处理部分工作。
3. **边界：** “JavaScript 单线程”通常讨论同一个执行代理内的代码顺序，不代表整个浏览器只有一条线程，也不代表任何异步任务都会转移到另一线程。

::: tip 面试先说职责，再说实现数量
浏览器进程模型不是固定“五个进程”的清单。回答应解释浏览器界面、页面渲染、网络与图形合成各自承担的职责，再说明具体隔离方式因实现而异。
:::

参考：[Chromium：RenderingNG 架构](https://developer.chrome.com/docs/chromium/renderingng-architecture)。

## 二、浏览器进程与渲染进程各负责什么？

**浏览器进程协调界面、导航与其他进程；渲染进程处理页面内容的解析、脚本和呈现。** Chromium 还会使用与网络、GPU 等相关的进程或服务，具体拆分不能推广为全部浏览器的规范要求。

| 角色 | 典型职责 | 回答边界 |
|------|----------|----------|
| 浏览器进程 | 标签页与地址栏、导航协调、进程管理 | 不等于执行每个页面的全部脚本 |
| 渲染进程 | 文档解析、页面脚本、布局与绘制准备 | 一个标签页不必永远只对应一个渲染进程 |
| 网络服务 | 请求、缓存与连接相关工作 | 不应假定每次请求必然新建连接 |
| GPU / 合成相关角色 | 栅格化与最终画面合成的部分工作 | 实际线程和进程边界依平台而变化 |

同一页面中的跨站 iframe 可能需要额外隔离。分析性能问题时，看长任务落在渲染主线程、网络等待还是合成路径，比背进程名称更有用。

参考：[Chromium：RenderingNG 架构](https://developer.chrome.com/docs/chromium/renderingng-architecture)。

## 三、浏览器如何把 HTML 和 CSS 呈现为画面？

**浏览器先建立文档和样式信息，再计算布局、绘制并合成可见结果。** 不是每次视觉变化都必须完整重走所有阶段。

### 1. 首次呈现的主要阶段

1. **解析：** HTML 建立 DOM（文档对象模型）；CSS 建立供样式计算使用的规则。解析期间还可能发现并请求脚本、样式和图片。
2. **样式与布局：** 计算元素最终样式与几何位置。布局依赖元素尺寸、包含块和字体等条件。
3. **绘制与合成：** 把可见内容转换为绘制结果，再按图层与设备条件组合到屏幕。具体栅格化和线程分工属于浏览器实现细节。

### 2. 不同修改为何成本不同

| 修改 | 通常需要重新考虑 |
|------|------------------|
| 改变元素宽度 | 样式、布局，以及受影响的绘制与合成 |
| 改变背景颜色 | 样式和绘制，通常无需重新布局 |
| 对适合独立合成的元素改变 transform | 可能主要涉及合成，仍需验证实际图层与设备 |

::: warning 不要把流水线当作每一帧的固定步骤
浏览器可以跳过不受影响的阶段，也可能合并多次修改。面试题问“为什么卡顿”时，应借助 Performance 时间线确认是脚本、布局、绘制还是合成耗时。
:::

参考：[web.dev：渲染性能](https://web.dev/articles/rendering-performance)、[Chromium：渲染进程内部](https://developer.chrome.com/blog/inside-browser-part3)。

## 四、渲染主线程为什么容易成为交互瓶颈？

**渲染主线程要处理页面脚本、部分输入事件和文档生命周期工作。** 一个长时间不让出的同步任务会推迟后续事件处理与相关界面更新。

1. **可观察现象：** 输入文字后界面迟迟不更新，Performance 面板可看到主线程长任务；网络请求可能早已结束，但响应处理回调仍需等待可执行时机。
2. **处理方向：** 缩小单次计算，按业务允许的时机分批；大量纯计算可评估 Worker，同时考虑数据复制或转移成本。
3. **边界：** 合成线程在一些条件下仍能维持滚动或动画，但不能保证所有输入都绕过主线程。复杂布局或必须由脚本处理的事件仍受主线程负载影响。

::: tip 用用户操作复现瓶颈
记录“点击 → 响应”的一次完整操作，区分事件回调何时开始、脚本执行多久、布局绘制耗时多少。只看到 CPU 高，不足以判断应优化哪一段。
:::

参考：[Chromium：RenderingNG 架构](https://developer.chrome.com/docs/chromium/renderingng-architecture)、[Chromium：输入事件与合成](https://developer.chrome.com/blog/inside-browser-part4)。

## 五、事件循环为什么需要任务与微任务？

**事件循环为当前执行、等待中的回调和渲染机会安排顺序。** 一个任务执行结束后会运行微任务检查点，之后浏览器再按条件处理渲染与后续任务。

1. **任务：** 计时器到时、用户事件等可以提供任务；回调不能打断正在执行的普通同步代码。
2. **微任务：** Promise 后续处理与 `queueMicrotask` 等进入微任务队列；检查点会继续处理期间新排入的微任务。
3. **渲染：** 浏览器并不保证每个任务后都绘制。如果微任务不断追加，后续输入与绘制机会可能被推迟。

::: warning await Promise.resolve() 不保证页面先绘制
它通常把后续代码安排到微任务，不等于主动让出一个完整的渲染机会。长计算要分批到可让浏览器处理输入的调度点，或交由 Worker。
:::

参考：[WHATWG HTML：事件循环](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)、[MDN：微任务](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)。

## 六、浏览器任务队列有固定的全局优先级吗？

**没有“交互队列永远高于计时器队列”的通用顺序承诺。** HTML 标准允许不同任务来源有不同队列，浏览器可选择下一任务来源；微任务检查点和任务来源选择也不是同一层概念。

1. 同一来源的任务有相应排序约束，但不同来源之间不能只按“用户事件 > 计时器 > 其他”推断每一次结果。
2. 一个任务运行时，新到的输入不能直接插到该任务的调用栈中。实际响应延迟仍受长任务、微任务、渲染和浏览器调度策略影响。
3. 面试代码输出题要先分析同步栈和已确定的微任务顺序；跨来源任务顺序若规范未保证，应指出环境条件，而不是硬背一种实现的结果。

参考：[WHATWG HTML：任务队列](https://html.spec.whatwg.org/multipage/webappapis.html#task-queues)。

## 七、异步是否等于把 JavaScript 放到其他线程？

**不等于。异步描述结果在当前调用之后交付，线程位置取决于 API 与运行环境。** `fetch` 的网络过程可以由浏览器其他组件处理，但消费响应的普通页面回调仍在相应 JavaScript 执行环境中运行。

1. `setTimeout` 到时只让回调具备排队条件，不会立即打断当前同步循环。
2. `Promise.resolve().then(...)` 把后续处理放入微任务，不会把其中的 CPU 计算自动移到 Worker。
3. Web Worker 提供另一个 JavaScript 执行环境，适合部分计算任务；它不能直接操作页面 DOM，数据要通过消息传递。

::: tip 用两个问题拆开异步
先问“什么时候得到结果”，再问“计算在哪个线程执行”。前者决定回调时序，后者决定是否能缓解主线程计算负担。
:::

参考：[MDN：JavaScript 执行模型](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model)、[MDN：Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)。

## 八、垃圾回收为什么仍无法自动防止内存泄漏？

**现代 JavaScript 引擎主要根据可达性回收对象，而不是根据开发者是否还想使用它。** 从根对象仍能访问的对象会被保留，即使它已不再具有业务价值。

### 1. 可达性与循环引用如何理解

1. 标记清除从根出发追踪可达对象；无法再到达的对象可被回收。两个对象彼此引用但整体已不可达，也可以回收。
2. 引用计数可用来解释历史算法的局限，但不能把“循环引用必然泄漏”套到现代 JavaScript 垃圾回收器上。
3. 分代、增量与并发等是引擎实现优化，不改变“对象是否可达”的核心判断；回收时机不由业务代码精确控制。

### 2. 常见泄漏如何处理

页面卸载后，若全局数组仍保存 DOM 节点、定时器闭包仍引用大对象，或订阅未清理，相关对象就可能保持可达。先在 DevTools 中复现操作并比较内存快照，再沿引用路径寻找保留来源；修复要移除监听、停止计时器或删除不再需要的强引用。

::: warning WeakMap 不能替你清理所有资源
弱关联有助于避免某些键被映射表单独保留，但其他强引用仍可能保存对象。网络连接、监听器和定时器还需要明确的生命周期清理。
:::

参考：[MDN：内存管理](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management)。

## 九、I/O 密集型与 CPU 密集型任务该如何安排？

**I/O 密集型任务主要等待外部资源，CPU 密集型任务主要消耗计算时间。** 区分这两类任务，才能选择并发请求、分批调度或 Worker。

| 类型 | 例子 | 主要处理方向 |
|------|------|--------------|
| I/O 密集型 | 等待接口、读取文件或数据库响应 | 允许互不依赖的任务并发，并控制数量与取消 |
| CPU 密集型 | 大量数据排序、图像处理 | 减少计算、分批让出主线程，或评估 Worker |

订单页面同时读取独立的商品与配送数据，能够在业务允许时并发发起；把一段昂贵同步排序包在 `async` 函数中并不会变成并行计算。诊断时分别看网络等待、主线程执行时间和用户输入延迟，再决定优化方式。

参考：[MDN：Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)、[web.dev：渲染性能](https://web.dev/articles/rendering-performance)。

## 十、Cookie、Web Storage 和 IndexedDB 应按什么边界选择？

**先问数据是否需要自动随请求发送、容量与查询能力如何、能否被页面脚本读取。** 存储位置不是安全保证；服务端仍要验证所有来自浏览器的数据。

| 机制 | 典型用途 | 关键边界 |
|------|----------|----------|
| Cookie | 会话标识等需按规则随请求发送的少量数据 | 大小、作用域、SameSite/Secure/HttpOnly；请求会带来额外开销 |
| `localStorage` / `sessionStorage` | 少量同源页面配置 | 同步 API；页面脚本可读；后者按标签页会话隔离 |
| IndexedDB | 大量结构化数据、离线查询 | 异步事务；需处理配额、版本升级与清理 |

例如订单筛选偏好可存 Web Storage；离线订单草稿可评估 IndexedDB，但要考虑设备共享、过期与数据同步。不要把长期访问令牌放进可被同源脚本读取的存储，再声称“用了 HTTPS 就安全”。

参考：[MDN：Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)、[MDN：IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)、[MDN：Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)。

## 十一、Web Worker 与 Service Worker 分别能做什么？

**Web Worker 用独立执行环境处理计算；Service Worker 可拦截其作用域内的网络请求并支持离线等能力。** 两者都不能直接操作页面 DOM。

1. 对大量数据聚合，页面可把可序列化数据发给专用 Worker，Worker 计算后回传；需要考虑复制、可转移对象和线程通信成本。
2. Service Worker 独立于某个页面生命周期，通过安装、激活和 `fetch` 等事件管理资源；更新与缓存失效必须设计，不能假定用户每次刷新立刻运行最新脚本。
3. 普通接口请求不会因为注册了 Service Worker 自动离线可用，必须定义缓存与回源策略；涉及个人数据时尤其要防止错误复用。

::: tip 判断依据是工作内容
CPU 计算选 Web Worker；离线资源和请求控制评估 Service Worker。需要同时做两件事时可以分别使用，不能靠名称相似互相替代。
:::

参考：[MDN：Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)、[MDN：Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)。

## 十二、`requestAnimationFrame`、定时器和空闲回调如何选择？

**按工作与画面更新的关系选择调度点，而不是把它们当作固定毫秒精度的时钟。** 三者回调都可能受页面可见性、主线程繁忙和浏览器策略影响。

| API | 适合的工作 | 主要限制 |
|-----|------------|----------|
| `requestAnimationFrame` | 下一次绘制前更新动画状态 | 后台标签页常被暂停或降频 |
| `setTimeout` | 延后执行不依赖特定帧的工作 | 最小延迟不等于准确执行时间 |
| `requestIdleCallback` | 有空闲时执行非紧急工作 | 不保证很快获得空闲；必要时设置超时并控制工作量 |

例如进度动画适合按帧更新时间；保存订单的确认动作不能依赖空闲回调才开始。长循环拆成多个定时器任务可以给输入和渲染机会，但还要测量任务长度与完成时间。

参考：[MDN：requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)、[MDN：requestIdleCallback](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback)。

## 十三、为什么连续读写布局信息会导致强制同步布局？

**修改样式后立刻读取几何尺寸，浏览器可能必须先完成布局计算，才能返回最新值。** 在循环中交替读写会反复触发计算，形成布局抖动。

1. 例如逐项设置列表宽度后立即读取 `offsetWidth`，每次读取都可能迫使浏览器处理此前未完成的布局工作。
2. 可以先集中读取所需尺寸，再批量写入样式；对大量列表还应减少 DOM 数量，而不是只调整执行顺序。
3. 在 Performance 时间线中确认强制布局调用栈、次数与耗时，再判断是否值得改动。单次读取尺寸不是错误，**重复的读写依赖**才是重点。

::: warning `transform` 也不是零成本
位移和透明度动画在合适条件下可以减少布局与绘制，但新图层、合成和内存开销仍需测量。
:::

参考：[web.dev：避免大型复杂布局与布局抖动](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)。

## 十四、页面从后台返回时，为什么不能只依赖 `load` 事件刷新数据？

**返回页面可能恢复已有文档状态，也可能从后退前进缓存（BFCache）恢复；这时不会像首次导航一样重新加载整页。** 订单状态等时效数据需要按页面恢复路径重新校验。

1. 首次进入可在初始化时读取数据；返回页面时可结合 `pageshow` 判断恢复，并按业务时效请求最新状态。
2. `visibilitychange` 能提示页面进入或离开可见状态，但切回可见不一定代表发生了导航。不要每次显示都无条件重复提交写操作。
3. 可在开发工具里检查 BFCache 命中、页面恢复与网络请求，区分缓存造成的旧界面和服务端数据本身未更新。

参考：[MDN：pageshow](https://developer.mozilla.org/en-US/docs/Web/API/Window/pageshow_event)、[web.dev：BFCache](https://web.dev/articles/bfcache)。
