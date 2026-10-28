---
title: "Vue面试题"
category: "面试题"
tags:
  - Vue
  - Vue Router
excerpt: "围绕 Vue 响应式、组件与数据流、渲染更新、路由和工程场景等面试题，解释 Vue 3 的行为与 Vue 2 的差异，补充分片上传、断点续传和 PDF 预览的设计约束及常见追问。"
---

# Vue面试题

Vue 根据状态生成界面，并追踪响应式数据与渲染、计算或监听逻辑之间的依赖。回答 Vue 题目应区分数据追踪、组件数据流与 DOM（文档对象模型）更新，不能把它们都称为“双向绑定”。

::: info Vue 版本与前置知识
本篇以 Vue 3.5 为主，Vue 2.7 仅用于历史项目与机制对比；涉及 Router 时以 Vue Router 4 为准。需要理解 JavaScript 的对象、函数、Promise 和模块，可参考 [JS题库](./03-javascript.md) 与 [ES6题库](./04-ES6.md)。
:::

## 一、框架模型与版本

先明确 Vue 的更新模型与版本边界，再比较 API 和框架差异，避免把历史实现与当前行为混用。

### 1. Vue 与 React 的状态更新模型有何区别？

#### 1.1 依赖追踪与状态快照

1. **Vue 主要通过响应式依赖追踪关联数据与更新逻辑，React 主要通过状态更新调度重新执行组件。** 两者都强调根据状态声明界面，不能概括为“Vue 双向、React 单向”。

   | 维度 | Vue 3 | React 函数组件 |
   |------|-------|----------------|
   | 常见界面表达 | 模板与指令，也可使用渲染函数或 JSX | JSX 等 JavaScript 表达 |
   | 状态更新 | 修改 ref 或 reactive 的响应式值 | 调用状态 setter，通常采用不可变更新 |
   | 派生值 | computed 追踪依赖并缓存 | 渲染时计算，按需要使用 useMemo |
   | 父子数据流 | props 向下，事件通知上层 | props 向下，回调通知上层 |

#### 1.2 数据所有权和选型边界

1. 例如改变订单数量，Vue 会通知依赖该数量的逻辑；React setter 请求新一轮渲染，组件读取本轮状态快照。两者都不应由子组件随意改父组件拥有的数据。

2. 模板并不意味着 Vue 无法表达复杂逻辑，JSX 也不自动让 React 更灵活或更快。选型要看团队经验、生态依赖、状态组织和实际性能证据。

参考：[Vue：响应式与 React 对比](https://vuejs.org/guide/extras/reactivity-in-depth.html#connection-to-signals)、[React：状态快照](https://react.dev/learn/state-as-a-snapshot)。

### 2. Vue 3 的变化为何影响迁移，Options API 还能用吗？

#### 2.1 Vue 2 与 Vue 3 的机制差异

1. **Vue 3 改进了响应式、组件逻辑组织和编译优化，但仍支持 Options API。** Composition API 是补充的组织方式，不能说它已取代 Options API。

   | 维度 | Vue 2 | Vue 3 |
   |------|-------|-------|
   | 主要响应式机制 | Object.defineProperty 与数组方法处理 | reactive 使用 Proxy，ref 使用值访问追踪 |
   | 逻辑组织 | Options API；2.7 也支持 Composition API | 两种 API 均可使用 |
   | 组件根节点 | 通常单根 | 支持 Fragment 多根节点 |
   | 跨位置渲染 | 常借助额外方案 | 内置 Teleport |
   | 类型与编译 | 历史方案 | 更好的类型配合、静态分析与更新提示 |

#### 2.2 迁移成本与版本约束

1. **迁移原因：** 响应式实现、组件约定和编译产物都可能改变旧代码的行为。迁移要核对生命周期命名、组件 `v-model`、事件、第三方依赖及构建配置；性能与体积还取决于应用和导入内容，不能宣称统一改善比例。

2. **版本边界：** Vue 2 于 2023-12-31 结束官方常规维护。维护历史项目应明确安全支持与兼容来源；Vue 2.7 可用 Composition API，也不代表 Vue 2 与 Vue 3 的运行时代码可以直接混用。

::: info 迁移时先核对版本与依赖
Options API 在 Vue 3 中仍可使用；是否迁移到 Composition API 应由逻辑组织需求决定。Vue 2 停止维护后，旧项目还要核对依赖的 Vue 3 兼容性与维护来源。
:::

参考：[Vue：Vue 2 停止维护公告](https://v2.vuejs.org/eol/)、[Vue：Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html)。

## 二、响应式与异步更新

响应式题按数据读取、依赖追踪、状态修改、调度和清理的顺序分析。数据改变与 DOM 完成更新是不同时间点。

### 1. Vue 2 为何难追踪新增属性，Vue 3 的 Proxy 解决到哪一步？

#### 1.1 属性访问器与代理的观测范围

1. **defineProperty 定义或修改某个属性的描述符，Proxy 为对象操作建立代理入口。** defineProperty 返回目标对象，不是返回那个属性的值。

   | 机制 | 范围 | 对 Vue 的影响 |
   |------|------|--------------|
   | getter、setter | 已定义的属性访问 | Vue 2 需要为数据属性设置访问器 |
   | Proxy 的 get、set、deleteProperty 等 | 经代理发生的相应对象操作 | 能处理属性增删等更多场景 |

#### 1.2 新增属性和原始对象的边界

1. **本质原因：** Vue 2 为已有属性布置 getter/setter；后加属性没有经过这一步，原有依赖无法感知。数组下标赋值、`length` 等也受旧观测方案限制，需要 `Vue.set` 或合适的数组方法。这是观测范围问题，不是 `defineProperty` 绝对不能定义新属性。

2. **解决边界：** Proxy 在对象操作进入代理时拦截增删等行为，但直接操作原始对象会绕过代理；Map、Set 等集合还需专门处理。Vue 3 的 `reactive` 使用 Proxy，`ref` 的 `.value` 也不能一律解释成“全靠 Proxy”。

::: warning Proxy 只能观察经过代理的操作
保留原始对象并直接修改它，绕过代理就不会建立同样的读取与触发关系。排查“Vue 3 也没更新”时，先检查读写是否经过同一个响应式入口。
:::

参考：[MDN：Object.defineProperty()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)、[Vue：响应式原理](https://vuejs.org/guide/extras/reactivity-in-depth.html)。

### 2. Vue 如何追踪依赖并在状态变化后更新界面？

#### 2.1 依赖收集与界面更新

1. **执行渲染或响应式效果时读取数据会建立依赖，修改相关数据再通知这些效果更新。** “读取、记录依赖、修改、触发、调度更新”是共同模型，具体内部结构不是业务 API。

   在空目录创建 `reactivity.html`。下面的完整页面使用 Vue 3.5.22 CDN，需要网络可访问该脚本；以现代浏览器打开后点击“增加数量”：

   ::: details 查看 reactivity.html 的完整响应式示例

   ```html
   <!doctype html>
   <html lang="zh-CN">
   <head>
     <meta charset="utf-8">
     <meta name="viewport" content="width=device-width, initial-scale=1">
     <title>订单数量</title>
     <script src="https://unpkg.com/vue@3.5.22/dist/vue.global.js"></script>
   </head>
   <body>
     <div id="app">
       <p>数量：{{ quantity }}</p>
       <p>小计：{{ subtotal }} 元</p>
       <button type="button" @click="increaseQuantity">增加数量</button>
     </div>
     <script>
       const { createApp, ref, computed, watch } = Vue;
       /** 建立订单状态与派生计算；返回模板需要的绑定。 */
       function setupOrder() {
         const quantity = ref(1);
         /** 根据当前数量计算小计；返回元金额，仅用于整数价格演示。 */
         function calculateSubtotal() { return quantity.value * 20; }
         /** 用户增加数量时修改状态；无返回值。 */
         function increaseQuantity() { quantity.value += 1; }
         /** 数量变化后报告新值；无返回值，输出控制台消息。 */
         function reportQuantity(value) { console.log("新数量", value); }
         const subtotal = computed(calculateSubtotal);
         watch(quantity, reportQuantity);
         return { quantity, subtotal, increaseQuantity };
       }
       createApp({ setup: setupOrder }).mount("#app");
     </script>
   </body>
   </html>
   ```

   :::

#### 2.2 结果验证与失效排查

1. 初始数量 1、小计 20 元；一次点击后变为 2、40 元，控制台输出“新数量 2”。事件只改变状态，小计由计算属性得出，页面由渲染依赖更新。

2. 模板语法原样出现时检查脚本加载和挂载是否成功。若改成普通非响应式变量，修改值不会自动触发同样的更新；本例也没有包含接口、货币舍入或服务端校验。

参考：[Vue：响应式基础](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)。

### 3. ref 与 reactive 如何选择，解构为什么可能丢失响应性？

#### 3.1 ref 和 reactive 的使用模型

1. **ref 用 `.value` 保存一个响应式值，reactive 返回对象代理。** ref 适合原始值及需要整体替换的状态，reactive 适合保持同一对象身份的状态组织。

   | 用法 | 行为或限制 |
   |------|------------|
   | `ref(1)` | 脚本通过 `.value` 读取与修改，模板有相应解包规则 |
   | `reactive({ quantity: 1 })` | 通过代理属性读写，不能直接用于原始值 |
   | 解构 reactive 的原始值属性 | 得到当前值，脱离后续代理读取 |
   | toRef、toRefs | 建立属性引用，保持与原属性关联 |

#### 3.2 解构与代理身份的边界

1. 例如 `const { quantity } = reactiveOrder` 取得一个数字后，quantity 不会自己变成响应式引用。解构得到的嵌套响应式对象又有不同情况，不能说所有解构都必定失效。

   ::: info Vue 3.5 的 props 解构有编译支持
   在同一 `<script setup>` 中，从 defineProps 解构的变量可由编译器转换为响应式 props 访问。这不等于普通 reactive 对象解构都安全；跨函数传递时仍要按 getter 或 ref 的约定保留追踪。
   :::

2. 替换 reactive 变量指向新的代理也可能使原依赖失去关联，应保持使用方式一致。数组或集合中的 ref 解包规则也与模板顶层变量不同。

参考：[Vue：响应式基础限制](https://vuejs.org/guide/essentials/reactivity-fundamentals.html#limitations-of-reactive)、[Vue：props 响应式解构](https://vuejs.org/guide/components/props.html#reactive-props-destructure)。

### 4. 派生值与副作用为何分开，computed、watch、watchEffect 如何选？

#### 4.1 派生值、明确监听与自动追踪

1. **computed 表达派生值，watch 对明确来源执行副作用，watchEffect 自动追踪同步执行时读取的依赖。** 副作用是请求、订阅等与外部系统发生交互的操作。

   | 场景 | 选择 | 原因 |
   |------|------|------|
   | 数量与单价得到小计 | computed | 依赖变化时重新计算，适合纯派生值 |
   | 订单号变化后加载详情 | watch | 来源明确，可比较新旧值并处理清理 |
   | 根据多个读取的状态同步外部效果 | watchEffect | 自动收集使用的依赖，首次立即执行 |

#### 4.2 副作用和异步依赖边界

1. **职责划分：** `computed` 应保持纯计算，便于缓存并根据依赖重新求值；请求或订阅等外部同步交给监听器。`watch` 默认不立即回调，可用 `immediate` 改变；深层监听还需考虑遍历成本，以及新旧值可能指向同一对象。

2. **依赖边界：** `watchEffect` 自动追踪同步执行时读到的依赖，异步回调在首次 `await` 后读取的值不会自动被追踪。来源越明确，越适合用 `watch` 显式声明；两种监听都要处理失效清理。

::: tip 先问结果是否能由已有状态直接算出
若小计能由数量和单价计算，就用 `computed` 表达派生关系；若订单号变化后要请求服务器，就使用监听处理外部副作用。把请求放入计算属性会让读取派生值产生难以预测的外部行为。
:::

参考：[Vue：计算属性](https://vuejs.org/guide/essentials/computed.html)、[Vue：监听器](https://vuejs.org/guide/essentials/watchers.html)。

### 5. watch 中的异步请求为什么会出现旧结果覆盖新结果？

#### 5.1 请求竞态与双重防线

1. **状态改变的顺序与请求完成顺序可能不同，监听本身不会自动取消上一次请求。** 搜索条件从 A 改到 B，A 较晚返回时仍可能覆盖 B 的结果。

2. **双重防线：** 来源变化时先使旧任务失效，再按 API 能力中止请求；写回前仍要检查任务是否有效。中止可减少浪费，但不保证服务端未处理，也不能单靠取消来证明旧结果不会写回。

   下面是 Vue 3.5 `<script setup>` 的局部模式，需已有响应式 `orderId`、`order` 和实际接口，省略界面；回调的清理注册使用 watch 第三个参数：

   ::: details 查看监听请求的清理片段

   ```javascript
   // OrderPanel.vue 的 script setup 中。
   /**
    * 按当前编号加载订单并登记失效清理。
    * @param id 当前非空订单编号，用于生成请求路径。
    * @param previousId 上一次编号，仅供 watch 传入，本示例不使用。
    * @param onCleanup 在下一次监听或停止时登记清理的函数。
    * @returns 完成请求处理的 Promise；有效失败会继续抛出。
    */
   async function reloadOrder(id, previousId, onCleanup) {
     const controller = new AbortController();
     let active = true;
     /** 来源失效时取消并禁止旧结果写入；无返回值。 */
     function cancelPrevious() { active = false; controller.abort(); }
     onCleanup(cancelPrevious);
     try {
       const response = await fetch(`/api/orders/${encodeURIComponent(id)}`, { signal: controller.signal });
       if (!response.ok) throw new Error(`HTTP ${response.status}`);
       const data = await response.json();
       if (active) order.value = data;
     } catch (error) {
       if (active) throw error;
     }
   }
   watch(orderId, reloadOrder);
   ```

   :::

#### 5.2 清理时机和测试方法

1. 需要自行导入 watch，接口结果还需按业务校验。回调失败应由组件错误处理或可控的错误状态承接；上面没有声称完成整个请求界面。

2. Vue 3.5 的 onWatcherCleanup 还有同步注册限制，不能在 await 后随意调用。测试应制造 A 慢、B 快的顺序，确认最终展示 B，而不是只测试一个请求。

::: warning 请求完成顺序不等于用户操作顺序
A、B 两次查询先后发出，A 仍可能后返回。验证应人为制造 A 慢、B 快，并确认界面只接受当前编号 B 的结果，而不只检查取消方法被调用。
:::

参考：[Vue：副作用清理](https://vuejs.org/guide/essentials/watchers.html#side-effect-cleanup)。

### 6. v-model 的双向绑定由哪些行为组成？

#### 6.1 值绑定、更新事件与组件约定

1. **v-model 组合值绑定与更新事件，不是 Proxy 自动把用户输入直接写回数据。** 响应式负责数据变化后的更新，事件负责把交互转换成状态修改。

2. 原生文本输入常组合 value 与 input，复选框、单选框和选择框有相应规则。组件上，Vue 3 默认约定 modelValue 属性与 update:modelValue 事件，Vue 2 默认约定 value 与 input，可按配置调整。

   以下是 Vue 3.4 及以上 SFC（单文件组件）中的局部 `OrderNote.vue`，省略父组件和构建配置：

   ```vue
   <!-- OrderNote.vue -->
   <script setup>
   const note = defineModel({ type: String, required: true });
   </script>
   <template>
     <label>订单备注<input v-model="note"></label>
   </template>
   ```

#### 6.2 父子状态和校验边界

1. 父级使用 `<OrderNote v-model="note" />`，note 变化通过约定事件通知父级。defineModel 是编译宏，不是需要从 Vue 导入的普通函数。

2. 不要直接修改只读 prop，也不要误以为 v-model 自带业务校验、请求同步和权限控制。组件默认值与父级缺失值还可能不同步，应明确受控值的初始来源。

参考：[Vue：组件 v-model](https://vuejs.org/guide/components/v-model.html)。

### 7. 修改状态后 DOM 为什么还没变，nextTick 保证什么？

#### 7.1 状态修改与 DOM 刷新

1. **响应式状态可立即改变，DOM 更新会被批量调度；nextTick 等待这轮 Vue DOM 更新完成。** 它不保证业务请求、图片加载或浏览器绘制都已完成。

2. 例如增加订单行后立即调用 querySelector，可能还查不到新行。需要操作新节点时，应在修改状态之后 await nextTick，或使用合适的更新后监听时机。

   以下是已经拥有 `quantity` ref 的组件局部 `script setup` 片段，省略模板：

   ```javascript
   // OrderPanel.vue：需要导入 nextTick。
   /** 增加数量并等待 DOM 更新；返回完成后的 Promise，不等待网络或绘制。 */
   async function increaseAndWait() {
     quantity.value += 1;
     await nextTick();
     // 此处才读取依赖 quantity 的已更新 DOM。
   }
   ```

#### 7.2 nextTick 的保证范围

1. 不能先调用 nextTick 再改变状态，来证明这次改变已经完成。需要等待过渡或媒体资源时，应监听相应事件；nextTick 不是万能延迟器。

参考：[Vue：nextTick()](https://vuejs.org/api/general.html#nexttick)。

## 三、组件接口与生命周期

组件题先确定状态由谁拥有，再选择输入、事件、注入和命令接口。外部资源还需配合挂载、停用与卸载管理。

### 1. 父子和兄弟组件如何通信，为什么不应直接修改 prop？

#### 1.1 状态所有权和通信路径

1. **父级通过 props 提供数据，子级通过事件表达请求，兄弟组件通常由共同父级协调。** 这样能明确状态所有权，避免不同组件同时修改同一来源。

   | 关系 | 常见方案 | 边界 |
   |------|----------|------|
   | 父到子 | props | 子级不能直接重赋 prop |
   | 子到父 | emit、父级监听 | 组件事件不按 DOM 事件的方式自动跨层冒泡 |
   | 兄弟间 | 共同父级持有状态并分发 | 不互相依赖实例内部结构 |
   | 特定命令 | ref 与 defineExpose | 适合聚焦等命令，不替代全部数据流 |

#### 1.2 prop 修改与组件边界

1. 例如数量组件提交“希望改为 3”的事件，父级检查库存后决定是否更新 quantity。传入对象的嵌套属性仍可能被子级修改，但这会隐式影响父状态，应按约定避免。

2. defineProps、defineEmits 声明组件边界，toRefs 和 watch 是响应式工具，不是独立的通信通道。Vue 3 不提供 Vue 2 的 `$children` 作为推荐通信方式。

参考：[Vue：Props](https://vuejs.org/guide/components/props.html)、[Vue：组件事件](https://vuejs.org/guide/components/events.html)。

### 2. provide/inject 与全局状态管理如何选择？

#### 2.1 子树注入与全局共享

1. **provide/inject 适合组件子树中的依赖传递，Pinia 等状态管理适合跨页面共享的业务状态。** 注入不是天然全局变量，也不天然保证所有提供值都响应式。

2. 提供 ref 或 reactive 时可以保留响应性，提供普通值则仍按普通值行为处理。祖先更近的同名提供者可覆盖外层提供，符号键有助于避免库级冲突。

   | 场景 | 方案 | 约束 |
   |------|------|------|
   | 表单子树共享校验上下文 | provide/inject | 由提供者维护状态和修改入口 |
   | 多个页面共享购物车 | Pinia 等 store | 明确重置、持久化和服务端同步规则 |
   | 单个父子数量控件 | props、emit | 无需引入全局存储 |

#### 2.2 响应性和服务端隔离

1. Vue 2 原有 provide/inject 不能不加说明就套用 Vue 3 的全部行为。服务器渲染时更不能把不同请求的状态存入同一全局实例，避免用户数据串联。

参考：[Vue：Provide / Inject](https://vuejs.org/guide/components/provide-inject.html)、[Pinia：介绍](https://pinia.vuejs.org/introduction.html)。

### 3. 如何设计可复用组件的 props、事件、插槽和暴露方法？

#### 3.1 组件公开接口的职责

1. **把数据、动作意图、内容扩展和命令分别放在清晰的接口上。** 单一职责不意味着只能有一个 prop，而是组件围绕同一个稳定问题组织。

   | 接口 | 负责内容 | 订单选择组件示例 |
   |------|----------|------------------|
   | props | 外部输入与限制 | 选中编号、可选订单、禁用状态 |
   | emits | 通知交互意图 | 用户请求选择某个订单 |
   | slots | 自定义显示内容 | 订单条目的补充说明 |
   | defineExpose | 必要的命令式操作 | 聚焦搜索输入 |

#### 3.2 插槽作用域与状态约束

1. 插槽内容通常由父级作用域决定；子级通过插槽 props 提供需要的局部数据。不要让父级依赖子级私有字段、DOM 层级或不稳定的实现方法。

2. 还需设计加载、空值、错误、禁用和键盘操作状态。对同一数据同时保留父 prop 与子内部副本时，应明确同步规则，避免受控与非受控行为混杂。

参考：[Vue：插槽](https://vuejs.org/guide/components/slots.html)、[Vue：组件暴露](https://vuejs.org/api/sfc-script-setup.html#defineexpose)。

### 4. Vue 生命周期何时可以操作 DOM，哪些资源要主动清理？

#### 4.1 挂载、卸载与资源清理

1. **DOM 相关初始化通常在挂载后进行，外部资源在卸载或失效时清理。** setup 是初始化逻辑入口，不能把它当成“DOM 已经可用”的挂载钩子。

   | 阶段 | Vue 3 Composition API | 主要职责 |
   |------|----------------------|----------|
   | 初始化 | setup、script setup | 建立状态与逻辑，不访问尚未挂载的节点 |
   | 挂载后 | onMounted | 读取已挂载 DOM、连接浏览器资源 |
   | 更新前后 | onBeforeUpdate、onUpdated | 观察组件更新，不无条件再次修改导致循环的状态 |
   | 卸载前后 | onBeforeUnmount、onUnmounted | 停止外部事件、计时器、连接等 |
   | 缓存切换 | onActivated、onDeactivated | 恢复或暂停缓存组件的工作 |

#### 4.2 服务端和缓存组件边界

1. Vue 2 的 beforeDestroy、destroyed 在 Vue 3 对应 beforeUnmount、unmounted。同步在 setup 中创建的监听等会按框架生命周期停止，但手工创建的全局监听、异步创建的任务和外部 SDK 仍需管理。

2. 服务端渲染不执行客户端挂载钩子，模块或 setup 顶层访问 window 会失败。缓存停用也不等于卸载，持续轮询可能需要在 deactivated 时暂停。

参考：[Vue：生命周期钩子](https://vuejs.org/guide/essentials/lifecycle.html)。

### 5. v-if、v-show 与 KeepAlive 的成本有何区别？

#### 5.1 创建、显示与缓存的成本

1. **v-if 按条件创建或销毁子树，v-show 保留节点并切换显示，KeepAlive 缓存组件实例。** 三者解决不同的状态与生命周期问题。

   | 场景 | 选择方向 | 代价与边界 |
   |------|----------|------------|
   | 很少打开、初始化昂贵的区域 | v-if | 初次可不创建，但每次重建可能有成本 |
   | 高频显示隐藏且需要保留状态 | v-show | 初始仍需创建，隐藏并不自动停止后台工作 |
   | 页面组件之间切换并保存内部状态 | KeepAlive | 占用缓存内存，需 include、exclude、max 等策略 |

#### 5.2 生命周期和性能取舍

1. KeepAlive 激活和停用使用 activated、deactivated，而非每次挂载与卸载。轮询、播放器或订阅在停用时是否继续，应按业务处理。

2. 性能优化不能统一替换全部 v-if，也不能通过 Object.freeze 随意冻结还需要变化的数据。先测初始化、切换与内存成本，再确定是否保留节点或实例。

参考：[Vue：条件渲染](https://vuejs.org/guide/essentials/conditional.html)、[Vue：KeepAlive](https://vuejs.org/guide/built-ins/keep-alive.html)。

### 6. Vue 与 TypeScript 如何约束 props、事件和组件引用？

#### 6.1 类型约束的组件边界

1. **类型描述可检查组件边界和开发阶段的使用关系，但仍需运行时校验接口数据。** script setup 宏配合类型推断，可以减少重复声明。

   以下是配置了 Vue 3.5、TypeScript 与 SFC 编译的工程中 `OrderAction.vue` 局部组件，省略父级和构建配置：

   ```vue
   <!-- OrderAction.vue -->
   <script setup lang="ts">
   const props = defineProps<{ orderId: string }>();
   const emit = defineEmits<{ select: [orderId: string] }>();
   /** 点击时通知父级选择当前编号；无返回值，不直接修改父状态。 */
   function selectOrder(): void { emit("select", props.orderId); }
   </script>
   <template>
     <button type="button" @click="selectOrder">{{ props.orderId }}</button>
   </template>
   ```

#### 6.2 运行时和引用可空性

1. 父级的事件名和载荷可以被检查，模板及组件类型还需使用 vue-tsc 等对应工具验证。只做 Vite 的语法转换，不等于已完成整个项目的类型检查。

2. 模板引用挂载前、卸载后或条件区域关闭时可以为 null，调用前需判断。类型声明不能证明返回的订单号一定有效，也不能替代组件自身的运行时边界。

参考：[Vue：TypeScript 与 Composition API](https://vuejs.org/guide/typescript/composition-api.html)。

## 四、渲染、Diff 与性能

渲染题应说明节点身份与更新过程，性能题则从真实耗时证据出发，不能仅凭框架名称断言快慢。

### 1. 虚拟 DOM 解决什么问题，为什么不一定比直接 DOM 操作快？

1. **虚拟 DOM 用 JavaScript 对象描述界面，渲染器比较前后描述并更新真实节点。** 它提供声明式组件、节点复用和平台适配能力，也带来创建与比较的成本。

2. 典型过程是：模板编译为渲染函数，执行后生成 VNode，首次挂载创建 DOM，状态更新后产生新的描述并执行 patch。组件重新执行渲染不代表所有 DOM 都被重建。

3. 例如只有订单状态文字改变，原有输入节点可以保留，只更新必要文本。框架还会结合编译信息跳过可确定的静态部分，而不是必须比较每个属性。

4. 一次明确的 textContent 修改可以比完整组件重渲染更便宜，但应用需要同时考虑代码组织和更新正确性。虚拟 DOM 也不承诺得到数学意义上全局最少的编辑操作。

参考：[Vue：渲染机制](https://vuejs.org/guide/extras/rendering-mechanism.html)。

### 2. Vue 2 的双端 Diff 如何复用列表节点，是 O(n³) 吗？

#### 2.1 双端比较与节点复用

1. **Vue 2.7 的相关子节点更新实现使用新旧头尾比较及键映射来寻找可复用节点，不是直接运行通用树编辑的 O(n³) 算法。** 不能把通用树差异问题的复杂度套在框架列表实现上。

   主要过程如下：

   1. 比较新旧头部、新旧尾部，以及交叉的头尾组合，匹配时更新并移动相应指针。
   2. 需要处理中间节点时，建立旧节点键到位置的映射，尝试复用匹配节点。
   3. 找不到可复用节点就新建；遍历结束后添加剩余新节点、移除剩余旧节点。

#### 2.2 复杂度的成立条件

1. 例如列表从 A、B、C 变成 C、A、B，可以移动原 C 节点并更新内容，不必因为顺序变化就重建全部子树。

2. 有稳定键的常规列表路径可接近线性处理；无键等路径中的查找、实际 patch 和 DOM 成本另有边界，不能承诺所有场景固定 O(n)。机制解释应基于具体版本实现。

参考：[Vue 2.7.16：patch.ts](https://github.com/vuejs/vue/blob/v2.7.16/src/core/vdom/patch.ts)。

### 3. Vue 3 的 keyed Diff 为什么使用最长递增子序列？

#### 3.1 前后缀同步与节点移动

1. **Vue 3 对带键子节点先同步公共前缀与后缀，再处理中间区域；需要重排时用最长递增子序列减少已存在节点的移动。** LIS 指保持相对顺序的最长递增位置序列。

2. 以旧 A、B、C、D，新 B、A、C、D 为例，头尾可先缩小需要处理的范围。对仍存在的节点建立新旧位置关联，能保留相对有序的一组，其他节点再移动到新位置。

   | 步骤 | 作用 |
   |------|------|
   | 同步头尾 | 直接处理顺序已相同的区域 |
   | 新键到索引映射 | 判断旧节点是否仍存在及它的新位置 |
   | 记录旧位置序列 | 判断重排并计算可保留顺序 |
   | 反向遍历与 LIS | 配合锚点插入或移动，减少必要移动 |

#### 3.2 算法成本与编译优化

1. LIS 的典型计算为 O(n log n)，相关映射扫描通常是线性；不能把整个 keyed 更新一律说成 O(n)，实际成本还包括子树和 DOM 操作。

2. 编译器的静态提升、Patch Flag（更新提示）和 Block（动态节点分组）是另一组优化，它们提供减少比较的线索，不代表运行时只比较已经“知道变化”的节点。

参考：[Vue 3.5.22：renderer.ts](https://github.com/vuejs/core/blob/v3.5.22/packages/runtime-core/src/renderer.ts)。

### 4. key 如何影响节点身份，为什么列表重排不宜使用索引？

#### 4.1 稳定键与节点身份

1. **key 用来区分同级节点的身份，稳定业务键帮助正确复用组件和 DOM 状态。** 相同 key 也需结合节点类型判断，不是只要值相同就一定复用。

2. 例如订单 A、B 各有未提交的输入值，删除 A 后，若用索引 0、1 作 key，原来属于 A 的节点可能被复用于 B，造成输入或子组件状态错位。用稳定订单号才能保留正确关联。

   下面是已拥有 orders 数据的模板局部片段：

   ```vue
   <!-- OrderList.vue 的 template 中。 -->
   <OrderRow v-for="order in orders" :key="order.id" :order="order" />
   ```

#### 4.2 列表重排和状态错位

1. key 在同级列表中应唯一、稳定，不能每次渲染都生成随机数。改变 key 会让原节点被替换，可用于明确的状态重置，但会增加创建与销毁成本。

2. 若列表完全固定且没有身份相关状态，索引的风险可以较小；面试回答仍应先说明未来增删、排序和输入状态的约束，而不是只背“索引绝对不能用”。

参考：[Vue：key 与状态维护](https://vuejs.org/guide/essentials/list.html#maintaining-state-with-key)。

### 5. Vue 页面卡顿或首屏慢时，应怎样确定优化方向？

#### 5.1 定位加载与交互瓶颈

1. **先区分资源加载、JavaScript 执行、组件更新和浏览器绘制，再优化有证据的瓶颈。** 一个通用清单不能证明当前问题已解决。

   | 证据 | 可能的方向 | 取舍 |
   |------|------------|------|
   | 首屏脚本很大 | 路由分块、按需引入、检查依赖 | 增加后续加载与失败状态 |
   | 长列表更新和 DOM 数量大 | 虚拟列表、分页、稳定 key、稳定 props | 要处理可访问性、滚动与状态复用 |
   | 巨大不可变数据的追踪成本 | shallowRef 等浅层方案 | 深层修改需显式按约定通知 |
   | 频繁深监听或派生计算 | 收窄监听来源、computed、减少重复工作 | 不跳过真正需要的业务更新 |
   | 图片到达慢、布局跳动 | 正确资源尺寸、格式、懒加载与缓存 | 首屏关键图片应及时获取 |

#### 5.2 复测和架构取舍

1. 先记录一次真实操作，再检查 bundle、Vue Devtools 与 Performance 中的更新和耗时。优化后用相同输入复测，确认性能和功能都没有退步。

2. SSR（服务端渲染）可改善某些内容展示路径，但增加服务器和 hydration（客户端接管已有 HTML）的复杂度。CDN（内容分发网络）主要改变资源分发，不会自动减少请求数量。

参考：[Vue：性能](https://vuejs.org/guide/best-practices/performance.html)。

## 五、路由与文件处理

工程场景需要把组件状态、浏览器能力与服务端协议联系起来，明确失败、恢复和资源清理的责任。

### 1. History 刷新为何会 404，Hash 与 Memory 模式何时适用？

#### 1.1 三种路由模式的地址行为

1. **它们区别在于路由位置的存储与导航方式；History 模式还要求服务器正确处理直接访问。** 路由不是通过“重写所有地址函数”实现的一套统一规则。

   | Vue Router 4 模式 | 地址与场景 | 部署要求 |
   |-------------------|------------|----------|
   | createWebHashHistory | `/#/orders`，片段不发送到服务器 | 通常不需要前端路径回退 |
   | createWebHistory | `/orders`，使用 History API | 前端页面路径正确回退到入口 |
   | createMemoryHistory | 内存维护位置，常用于 SSR 等 | 不自动影响浏览器 URL，需管理初始导航 |

#### 1.2 刷新 404 的服务端原因

1. **404 原因：** History 地址中的 `/orders` 会在刷新或直接访问时发给服务器；服务器若只查找同名静态资源，就会返回 404。Hash 的 `#` 后内容不发送到服务器；Memory 模式则不依赖浏览器地址栏。`pushState` 和 `replaceState` 也不会自动触发 `popstate`。

2. **部署处理：** 检查实际请求路径、部署 base 与服务器回退规则，只让可由前端处理的路径回退到应用入口。API 和缺失静态资源不能一律返回成功 HTML；前端未匹配的业务路由仍要显示 404。

::: warning History 模式需要服务器配合直接访问
站内点击能正常导航，不代表刷新 `/orders` 可用。验收时应直接输入深层地址并刷新，同时检查 API 与缺失资源没有被错误回退为首页。
:::

参考：[Vue Router：History 模式](https://router.vuejs.org/guide/essentials/history-mode.html)。

### 2. 断点续传为何不能只看前端进度，如何确认已上传分片？

1. **断点续传需要服务器确认已接收的分片，前端本地进度只负责展示与辅助恢复。** 仅保存“上传到 60%”无法确定哪些字节已经可靠存储。

#### 2.1 分片与上传会话如何设计

1. 以大附件上传为例，先创建有权限和有效期的上传会话，再按固定边界切片，使用会话 ID、分片序号和必要校验信息上传。后端需记录分片并支持幂等重传。

   | 协作点 | 必须明确的内容 |
   |--------|----------------|
   | 会话创建 | 文件大小、身份、分片策略、权限和过期处理 |
   | 分片接收 | 序号与范围、大小校验、重复分片处理 |
   | 恢复查询 | 服务端已确认的分片集合，而不是只有前端缓存 |
   | 最终合并 | 完整性验证、原子完成、业务记录关联 |
   | 异常回收 | 失败、取消和过期分片的资源清理 |

   在空目录创建 `chunk-plan.mjs`，用 Node.js 22 或更高版本运行 `node chunk-plan.mjs`。这个完整示例只验证 Blob 的分片边界，不包含服务端上传协议：

   ```javascript
   // chunk-plan.mjs
   const attachment = new Blob(["0123456789"]);
   const chunkSize = 4;
   for (let start = 0, index = 0; start < attachment.size; start += chunkSize, index += 1) {
     const chunk = attachment.slice(start, Math.min(start + chunkSize, attachment.size));
     console.log(index, chunk.size, await chunk.text());
   }
   ```

   预期输出如下，证明最后一片可小于约定大小：

   ```text
   0 4 0123
   1 4 4567
   2 2 89
   ```

#### 2.2 恢复与失败怎样处理

1. 恢复时重新确认文件身份、查询已完成分片，再仅上传缺失片。限制并发，失败后按条件重试，所有分片经服务端确认后再请求合并；文件名与大小相同并不保证内容相同。

2. Vue 组件负责状态展示、选择、取消和资源清理；分片、校验与上传协议可以独立于组件组织。前端哈希可辅助识别，但服务器仍需校验权限和内容，不能信任客户端声称的文件类型或摘要。

3. 该设计没有预设内部接口，也没有声称只靠示例已经实现可用的断点续传系统。验证真实协议时需覆盖重复提交、断网恢复、文件变化和会话过期。

::: tip 服务端确认才是恢复依据
前端显示“60%”可能包含尚未被服务端可靠保存的分片。恢复时应通过上传会话查询已确认的分片集合，再按文件身份与分片边界补传缺失部分。
:::

参考：[MDN：Blob.slice()](https://developer.mozilla.org/en-US/docs/Web/API/Blob/slice)、[MDN：文件 API](https://developer.mozilla.org/en-US/docs/Web/API/File_API)。

### 3. Vue 页面预览多页 PDF 时，如何控制渲染与内存成本？

#### 3.1 按可视页渲染的基本策略

1. **使用 PDF.js 等已有解析与渲染引擎，按可视页安排工作，避免一次渲染所有页面。** PDF 内容不是先“转换为 wasm 文件”再显示，WebAssembly 是可执行模块格式，不是 PDF 格式。

2. PDF.js 可解析 PDF 并将页面绘制到 Canvas，还可配合文字层、注释层和导航实现阅读能力。仅展示位图不能完整保留文本选择、链接和无障碍信息。

   | 约束 | 设计方向 |
   |------|----------|
   | 页面数量多 | 虚拟滚动，只维护可视与相邻页面 |
   | 缩放与快速翻页 | 取消过时渲染任务，确认最新任务归属 |
   | 主线程负载高 | 正确配置 PDF.js worker，版本与主库一致 |
   | Canvas 内存大 | 限制像素比、释放远离视口的画布 |
   | 组件关闭或文件更换 | 取消渲染并清理旧文档和对象 URL |

#### 3.2 画布内存与失败排查

1. 例如一页以 1200 × 1600 CSS 像素展示、设备像素比为 2，仅 RGBA 画布像素就约占 29.3 MiB，尚未计入解析和其他缓存。整份百页文件同时渲染会迅速放大成本。

   以下是调度关系的伪代码，用于表达设计顺序，不是可运行的 PDF.js API 实现：

   ```text
   视口或缩放变化 -> 计算应保留的页范围
   取消已过时任务 -> 释放不再需要的画布
   加载页描述 -> 用受限分辨率渲染可视页
   检查任务仍有效 -> 更新页面、文字层与交互层
   文件更换或组件卸载 -> 清理文档及全部旧任务
   ```

2. 排查空白预览先看文件响应、跨源限制、worker 加载和容器尺寸，再判断内存与渲染队列。涉及敏感 PDF 的处理还需遵守内容访问权限，前端预览不替代服务端授权。

参考：[PDF.js：页面渲染示例](https://mozilla.github.io/pdf.js/examples/)、[PDF.js：常见问题](https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions)。

### 4. File、Blob、ArrayBuffer、Data URL 与 Base64 有何区别？

#### 4.1 字节、文件与文本编码的区别

1. **File、Blob 描述文件或不可变字节数据，ArrayBuffer 保存原始内存字节，Data URL 是 URL 文本形式，Base64 是编码方式。** 它们不是五种相同层级的“原始数据类型”。

   | 对象或形式 | 主要内容 | 场景与边界 |
   |------------|----------|------------|
   | Blob | 不可变字节数据及媒体类型信息 | 分片、下载、媒体数据 |
   | File | Blob 的子类型，增加文件名和修改时间等 | 文件选择，也可以由脚本构造 |
   | ArrayBuffer | 字节内存，需要视图访问 | 二进制计算、传输；存在可调整等后续能力 |
   | Data URL | 包含数据的 URL 字符串 | 小数据内嵌，可使用 Base64 或其他编码形式 |
   | Base64 | 将字节编码为文本 | 不是加密，也不提供文件身份保证 |

#### 4.2 对象 URL 和数据安全

1. 预览本地文件可生成对象 URL，结束后调用 URL.revokeObjectURL 释放关联资源。对象 URL 与 Data URL 不同，前者不是把全部字节嵌进 URL 字符串。

2. Base64 通常增加约三分之一的数据长度，还需考虑字符串内存和处理成本，大文件不宜无理由全部转成 Base64。File.name、Blob.type 等元信息可被构造，服务端必须按真实内容校验。

参考：[MDN：File](https://developer.mozilla.org/en-US/docs/Web/API/File)、[MDN：Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob)、[MDN：ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)、[MDN：Data URL](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/data)。

## 六、逻辑复用与跨环境渲染

### 1. Composable 与 mixin 怎样复用逻辑，为什么推荐明确的数据来源？

**Composable 是调用时返回状态和操作的函数，mixin 将选项合并进组件。** 两者都能复用逻辑，但 composable 的输入、输出与命名冲突更容易从调用处看清。

1. 订单筛选可以由 `useOrderFilters()` 返回筛选条件、更新动作和计算结果；组件显式解构并可按需重命名。
2. mixin 中的字段会与组件选项合并，同名字段来源难查，多个 mixin 的依赖关系也不直观。
3. composable 通常在组件 `setup` 同步执行阶段调用，生命周期钩子与当前组件实例才能正确关联。全局模块级状态则可能被多个实例或 SSR 请求共享，应明确生命周期。

::: tip 复用单元要有清楚的所有权
复用业务逻辑时同时定义状态归属、何时发起请求、如何取消和清理。仅把代码搬进 `useXxx` 函数，不会自动解决竞态或共享状态问题。
:::

参考：[Vue：组合式函数](https://vuejs.org/guide/reusability/composables.html)、[Vue：mixins](https://vuejs.org/api/options-composition.html#mixins)。

### 2. `shallowRef` 与 `markRaw` 为什么能减少响应式开销，也会带来什么限制？

**Vue 的深层响应式会追踪嵌套访问；浅层或原始对象策略减少这种代理工作，但要求调用方明确更新边界。** 对大量不可变数据或第三方实例，这可能比逐层代理更合适。

1. `shallowRef` 只追踪 `.value` 的替换；直接改内部嵌套属性通常不会触发依赖它的更新。应替换根值，或在明确场景使用 `triggerRef`。
2. `markRaw` 让指定对象不被转换为响应式代理，适合不应被 Vue 管理的复杂实例；嵌套对象仍可能在其他响应式路径被代理，需注意对象身份差异。
3. 先用性能分析确认代理成本，再调整数据结构。若表格卡顿主要来自大量 DOM，换成 `shallowRef` 不会自动解决渲染负担。

参考：[Vue：进阶响应式 API](https://vuejs.org/api/reactivity-advanced.html)、[Vue：减少大型不可变结构的响应式开销](https://vuejs.org/guide/best-practices/performance.html#reduce-reactivity-overhead-for-large-immutable-structures)。

### 3. 作用域插槽的数据由谁提供，插槽内容在哪个组件的作用域求值？

**子组件决定插槽放置位置并向插槽传数据；父组件编写插槽内容，所以表达式在父组件作用域求值。** 这解释了为什么子组件内部局部变量不能直接写进父组件提供的插槽模板。

1. 订单列表子组件向插槽暴露当前行数据，父组件可以据此渲染自定义操作列。
2. 子组件通过插槽属性提供受控数据接口；父组件用接收的插槽属性访问行数据，而不是依赖子组件未公开的局部变量。
3. 若数据与模板责任混乱，优先明确 props、事件和插槽各自的职责，避免把插槽当成跨组件任意访问状态的通道。

面试可从“模板写在哪里，谁提供数据，表达式在哪个作用域执行”三个维度回答，而不只说“插槽用于复用”。

参考：[Vue：插槽作用域](https://vuejs.org/guide/components/slots.html#render-scope)、[Vue：作用域插槽](https://vuejs.org/guide/components/slots.html#scoped-slots)。

### 4. `Teleport` 与 `Suspense` 各改变什么，能替代状态管理吗？

**`Teleport` 改变组件 DOM 的最终挂载位置，`Suspense` 协调异步依赖的等待与后备内容。** 它们分别解决布局层级和异步呈现问题，不承担跨页面共享业务状态。

1. 弹窗可通过 `Teleport` 挂到页面顶层，减少祖先 `overflow` 或层叠上下文干扰；逻辑组件父子关系仍保留，事件与状态仍按组件树组织。
2. `Suspense` 可在等待异步组件或异步 `setup` 时显示后备内容；它不会自动处理所有 `fetch`，也不会替代请求错误处理与取消。
3. 两者都要验证 SSR、焦点、滚动锁定和错误边界等实际场景。`Teleport` 不会自动让弹窗满足无障碍对话框要求。

::: info Suspense 的版本边界
Vue 3 文档将 `Suspense` 标为实验性特性；采用它前应核对项目锁定的 Vue 版本与团队对 API 变化的接受程度。
:::

参考：[Vue：Teleport](https://vuejs.org/guide/built-ins/teleport.html)、[Vue：Suspense](https://vuejs.org/guide/built-ins/suspense.html)。

### 5. Vue SSR 为什么会出现 hydration mismatch，如何定位？

**服务端先产出 HTML，客户端 hydration 时按组件结果接管这些节点；两边首次渲染不一致就可能出现不匹配。** 常见原因是浏览器专有 API、随机值、时间、用户时区或请求间共享状态。

1. 在服务端渲染阶段避免直接读取 `window`、`localStorage`；确需浏览器数据时，在客户端挂载后读取并更新。
2. 随机 ID、当前时间和用户相关数据应在服务端与客户端共享同一初始输入，或将仅客户端可知的内容延后渲染。
3. 查看开发环境 hydration 警告，比较服务端 HTML 与客户端首次 VNode，定位第一个不同节点；不能只通过“忽略警告”掩盖状态错位。

::: warning SSR 请求间不能泄露共享状态
若把用户订单保存在模块级单例响应式对象中，服务端多个请求可能共享它。应按请求创建应用与状态实例，并验证用户隔离。
:::

参考：[Vue：SSR](https://vuejs.org/guide/scaling-up/ssr)、[Vue：SSR hydration mismatch](https://vuejs.org/guide/scaling-up/ssr#hydration-mismatch)。

### 6. Pinia 的 state、getter 和 action 应如何分工，何时不需要 Store？

**Pinia Store 用于多个组件共享、且需要清楚归属的状态；state 保存源数据，getter 表达派生结果，action 组织业务操作。** 不能把所有组件临时状态都放入全局 Store，否则生命周期和清理边界会变得含糊。

1. 订单页的当前筛选弹窗开关通常留在组件本地；跨页面使用的登录用户或购物车可以考虑 Store。
2. getter 应根据 state 派生结果，不保存第二份可独立变更的相同数据；异步请求可由 action 组织，同时明确加载、错误、重试和取消策略。
3. Pinia 的状态更新仍由 Vue 响应式系统驱动；直接修改状态是允许的，复杂业务操作集中在 action 更便于追踪与复用。

SSR 时应为每个请求创建独立的应用与 Pinia 实例，避免用户数据跨请求共享；客户端接管时还要使用服务端对应的初始状态。

参考：[Pinia：核心概念](https://pinia.vuejs.org/core-concepts/)、[Pinia：SSR](https://pinia.vuejs.org/ssr/)。

### 7. Vue Router 导航守卫能做什么，为什么不能代替服务端权限校验？

**导航守卫决定一次前端路由切换能否继续、重定向或取消，适合维护页面访问体验。** 用户仍能绕过前端路由直接请求 API，因此服务端必须对订单数据和操作单独鉴权。

1. 全局守卫适合检查登录状态和路由元信息，再决定跳登录页或继续；单个路由守卫适合该页面专属条件。
2. 异步鉴权要处理会话恢复与并发导航，避免旧请求结束后把用户带到过时页面；失败与 401/403 应有明确去向。
3. 动态路由、懒加载组件和页面内按钮显示都只是前端访问体验的一部分，不能作为 API 权限证据。

::: tip 以直接调用接口验证权限
即使浏览器不显示“取消订单”按钮，也应测试无权限账号直接发请求是否被拒绝，并检查订单归属。
:::

参考：[Vue Router：导航守卫](https://router.vuejs.org/guide/advanced/navigation-guards.html)、[Vue Router：路由元信息](https://router.vuejs.org/guide/advanced/meta.html)。


