# Vue面试题

## 1. Vue的生命周期有哪些？
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


## 2. Vue的双向数据绑定原理是什么？
::: tip 原理
1. **数据劫持**：Vue通过`Object.defineProperty()`（Vue 2.x）或 `Proxy`（Vue 3.x）方法来劫持各个属性的读取和设置，在数据发生变动时通知依赖于它的视图更新。
2. **发布订阅模式**：Vue通过**发布者-订阅者模式**来实现数据与视图的双向绑定。

:::


## 3. Vue的模板语法？
:::tip
- 插值表达式
- 指令：`v-if、v-else、v-else-if、v-for、v-on、v-bind、v-model`
- 过滤器
- 缩写：`v-bind:class="['active', 'text-danger']"`
:::

## 4. Vue的路由模式？
:::tip 两种路由模式
1. `hash`：使用 URL 的 hash 来模拟一个完整的 URL，于是当 URL 改变时页面不会重新加载。
2. `history`：使用 HTML5 History API 来完成 URL 跳转，页面会重新加载。
- `abstract`：在不同路由模式之间切换。
:::

## 5. Vue的组件通信方式？

:::tip Vue2.x组件通信方式
- `props`：父组件 → 子组件传递数据（单向数据流）。
- `$emit`：子组件 → 父组件，子组件触发事件，父组件监听事件。
- `provide / inject`（跨层级）：祖先组件向下传递数据，子孙组件接收数据。
- `Vuex`：集中式状态管理，可实现跨组件数据共享。
- `$parent`：访问父组件。
- `$children`：访问子组件。
- `$refs`：访问子组件的 DOM 元素。
:::
::: details Vue2.x组件通信示例
```js
/*********** 父子组件通信    ***********/
//  父组件
    <child :msg="msg"></child>
//  子组件
    props: ['msg'],
    template: '<div>{{ msg }}</div>'

/*********** 祖孙组件通信    ***********/
//  祖先组件
    provide: {
        msg: 'hello'
    }
//  子孙组件
    inject: ['msg'],
    template: '<div>{{ msg }}</div>'

/*********** 跨层级组件通信    ***********/
//  祖先组件
    provide: {
        msg: 'hello'
    }
//  中间组件
    inject: ['msg'],
    template: '<div><son></son></div>'
//  子孙组件
    inject: ['msg'],
    template: '<div>{{ msg }}</div>'

/*********** 父子组件通信（Vuex）    ***********/
//  父组件
    <child :msg="this.$store.state.msg"></child>
//  子组件
    props: ['msg'],
    template: '<div>{{ msg }}</div>'
//  父组件
    this.$store.commit('updateMsg', 'newMsg')
//  子组件
    watch: {
        msg(newVal) {
            this.$emit('update:msg', newVal)
        }
    }

/*********** 父子组件通信（$parent/$children/$refs）    ***********/
//  父组件
    <child ref="child"></child>
    this.$refs.child.doSomething()
//  子组件
    methods: {
        doSomething() {
            console.log(this.$parent.$el) // 父组件的DOM元素
            console.log(this.$children[0].$el) // 子组件的DOM元素
        }
    }
/*********** 父子组件通信（$parent/$children/$refs）    ***********/




```
:::



:::tip Vue3.x组件通信方式
- `defineProps/defineEmits`: 定义组件的属性和事件，父组件可以向子组件传递数据，子组件可以触发事件。
- `provide/inject`: 祖先组件向下传递数据，子孙组件接收数据。
- `ref`: 获取组件实例或子组件实例的引用。
- `toRefs`: 将响应式对象转换为普通对象。
- `watch`: 监听数据的变化。
- `emit`: 触发事件。
- `on`: 监听事件。
:::





## 6. Vue性能优化
### 6-1. 代码层面的优化
:::tip
1. 减少 DOM 操作：尽量减少 DOM 的操作，比如不要用 v-if 切换元素，用 CSS 动画或过渡效果代替。
2. 长列表性能优化：使用虚拟滚动，只渲染可视区域内的元素。 使用 `Object.freeze()冻结数据`，避免数据被修改。
3. 路由懒加载：按需加载路由，减少首屏加载时间。
4. 图片懒加载：使用第三方库，比如 vue-lazyload。
5. 第三方插件的按需引入
6. v-if 和 v-show 区分使用场景
7. 合理使用 computed 和 watch: computed 用于计算属性，watch 用于监听数据的变化。
8. 合理使用 keep-alive 组件：keep-alive 组件可以缓存组件，避免重复渲染。
9. 事件的及时销毁：Vue 组件销毁时，会自动清理它与其它实例的连接，解绑它的全部指令及事件监听器，但是仅限于组件本身的事件。 如果有一些全局的事件监听器，需要在组件销毁时移除。
10. 事件节流：使用防抖和节流函数，减少函数的执行频率。
:::
### 6-2. 工具层面的优化
:::tip
1. 开启生产模式：生产模式下，Vue 会进行更精简的打包，移除警告信息，提高运行效率。
2. 使用 Webpack 进行代码分割：Webpack 能够将代码分割成多个 bundle，使得初始加载更快。
3. 使用 Tree-Shaking：Tree-Shaking 能够自动清除未使用的代码，减少打包体积。
4. 使用预渲染插件：预渲染插件能够提前渲染出初始 HTML，使得首屏渲染更快。
5. 使用服务端渲染：服务端渲染能够将组件渲染成 HTML 字符串，直接发送给浏览器，使得首屏渲染更快。
6. 构建结果输出分析：Webpack 能够输出分析报告，帮助分析打包结果。
:::

#### 6-3. 网络层面的优化
:::tip
1. 使用 CDN：使用 CDN 加载静态资源，减少请求次数，提高响应速度。
2. 图片压缩：使用图片压缩工具，压缩图片大小，减少请求体积。
3. 减少请求数量：合并请求，减少请求数量，减少响应时间。
4. 缓存：使用缓存，减少请求次数，提高响应速度。
5. 压缩传输：压缩传输内容，减少传输时间。
:::

## 7. Vue 如何封装组件？

#### 7-1. 确认动机
:::tip
1. 服务当前页面，减少当前界面复杂度。
2. 通用性公共组件，提高开发效率。
:::
#### 7-2. 分析边界
:::tip
越通用，边界越窄，越灵活，便利性越低
:::
#### 7-3. 设计接口
:::tip
- 属性
- 插槽
- 事件
:::
#### 7-4. 代码实现
:::tip
- 组件注册
- 组件属性
- 组件插槽
- 组件事件
:::
#### 7-5. 测试
:::tip
- 单元测试
- 集成测试
:::
#### 7-6. 后续维护
:::tip
- 优化
- bug修复
- 功能更新
:::

## 8. 为什么要有虚拟DOM？
>[!tip]
> 一个dom上面的属性是非常多的,所以直接操作DOM非常浪费性能。
>
> 解决方案：
>
> 1. Vue1.0有太多的闭包，小项目还可以，大项目就不适合，就会造成内存泄漏。	
> 2. 可以用`JS`的计算性能来换取操作`DOM`所消耗的性能，既然我们逃不掉操作`DOM`这道坎,但是我们可以尽可能少的操作`DOM`，因为`操作JS是非常快`的。？