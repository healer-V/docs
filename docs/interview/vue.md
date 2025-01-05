## Vue面试题

### 1. Vue的生命周期有哪些？
:::tip Vue2.x生命周期
- `beforeCreate` ：(实例刚被创建，数据观测和事件配置之前)
- `created` ：(实例创建完成，数据观测和事件配置之后)
- `beforeMount` ：(实例挂载开始)
- `mounted` ：(实例挂载完成)
- `beforeUpdate` ：(数据更新时)
- `updated` ：(数据更新完毕) 
- `activated` ：(keep-alive 组件激活时)
- `deactivated` ：(keep-alive 组件停用时)
- `beforeDestroy` ：(实例销毁开始)
- `destroyed` ：(实例销毁完成)
:::

:::tip Vue3.x生命周期
- `setup` ：(组件实例被创建)
- `onBeforeMount` ：(组件挂载开始)
- `onMounted` ：(组件挂载完成)
- `onBeforeUpdate` ：(组件更新开始)
- `onUpdated` ：(组件更新完成)
- `onBeforeUnmount` ：(组件销毁开始)
- `onUnmounted` ：(组件销毁完成)
- `onActivated` ：(keep-alive 组件激活时)
- `onDeactivated` ：(keep-alive 组件停用时)
:::
### 2. Vue的双向数据绑定原理是什么？

- 数据劫持：Vue通过Object.defineProperty()方法来劫持各个属性的读取和设置，在数据发生变动时通知依赖于它的视图更新。
- 发布订阅模式：Vue通过发布者-订阅者模式来实现数据与视图的双向绑定。

### 3. Vue的模板语法有哪些？
:::tip
- 插值：{{ }}
- 指令：v-if、v-else、v-else-if、v-for、v-on、v-bind、v-model
- 过滤器：{{ message | capitalize }}
- 缩写：v-bind:class="['active', 'text-danger']"
:::
### 4. Vue的路由模式有哪些？
:::tip
- hash：使用 URL 的 hash 来模拟一个完整的 URL，于是当 URL 改变时页面不会重新加载。
- history：使用 HTML5 History API 来完成 URL 跳转，页面会重新加载。
- abstract：在不同路由模式之间切换。
:::
### 5. Vue的组件通信有哪些方式？

:::tip
- `props`：父组件向子组件传递数据。
- `events`：子组件触发事件，父组件监听事件。
- `$emit`：父组件触发事件，子组件监听事件。
- `$parent`：访问父组件。
- `$children`：访问子组件。
- `$refs`：访问子组件的 DOM 元素。
- `provide`/`inject`：祖先组件向下传递数据，子孙组件接收数据。
- `lisener`/`$emit`：父组件向子组件传递数据，子组件触发事件，父组件监听事件。
:::
