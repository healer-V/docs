# Vue面试题

## 1. Vue的生命周期
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


## 2. 双向数据绑定原理

>[!tip] Vue2 双向数据绑定原理
>- Vue2数据双向绑定原理的实现 Vue2采用数据劫持并结合发布者-订阅者模式的方式，通过ES6的object.defineProperty()方法去劫持各个属性的setter/getter方法，在数据发生变化的时候，发布信息给订阅者，触发相应的监听回调。
>- 具体步骤如下：
>- 1、需要observe(观察者)的数据对象进行遍历，包括子属性对象的属性，都加上setter和getter，这样的话，给这个对象的某个值赋值，就会触发setter，那么就能监听到数据的变化。
>- 2、compile(解析)模板指令，将模板中的变量替换成数据，然后初始化渲染页面视图，并将每个指令的节点绑定更新函数，添加监听数据的订阅者，一旦数据有变动，收到通知，更新视图。
>- 3、watcher(订阅者)是observer和compile之间通信的桥梁，主要做的事情是：
>   - 1、在实例化时往属性订阅器(dep)里添加自己；
>   - 2、自身必须有一个update()方法；
>   - 3、待属性变动dep.notice()通知时，能够调用自身的update()方法，并触发compile中绑定的回调；
>- 4、MVVM作为数据绑定入口：
>   - observer,compile和watcher来监听自己的model数据变化，通过compile来解析模板，最终利用watcher搭起observer和compile之间的通信桥梁，达成数据变化-》更新视图：视图交互变化-》数据model变更的双向绑定效果。


>[!tip] Vue3 双向数据绑定原理
>- Vue3采用了全新的Proxy代理来处理双向数据绑定。Proxy是ES6中新增的特性，它可以劫持整个对象，代理对对象的操作，并在操作发生时触发对应的行为。
>- Vue3可以追踪对象的属性访问和修改，并在数据发生变化时立即通知相关的视图进行更新。这种方式可以实现更精确的数据变化追踪，避免了Vue2中不断遍历对象属性的开销。



## 3. Vue数据响应式原理
>[!tip] Vue数据响应式原理
>- 本质：**数据和函数的关联，** 数据变化，关联的函数运行。
>   - 数据：函数中督导的数据，数据本身是响应式对象的某个属性。
>   - 函数：被监控的函数，Vue2中被`watch`监控的函数，Vue3中被`effect`监控的函数。如`render`、`computed`、`watch`的第一个函数参数、`watchEffect`的回调函数 等。



## 4. Vue的路由模式

:::tip Hash路由与History路由的区别
1. **表面区别**：路由的**路径来源**不同。（根据不同的路径匹配不同的组件）
      1. 来自`memory Router`（内存）移动端 App等。
      2. 来自`Hash`值，使用Hash Router。
      3. URL中的`path` ,使用History Router 。
2. **实现区别**:
      1. Hash路由 **监听** 路由变化。windows.onhashchange()事件。
      2. History路由 **重写** 导致地址变化的函数。vue : replaceRoute()方法。

:::

:::tip 两种路由模式
- hash路由有#号。
- history路由在上线的时候,需要额外的配置。
- **额外配置的核心原则是**：​​对所有前端路由的请求，都返回 index.html​​，让前端路由来处理路径匹配。
- **hash路由模式**
  - 监听事件 => window.onhashchange事件
  - 根据 window.location.hash 获取路由的url
  - 匹配路由表
  - 将compoment的组件调用
- **history路由模式**
  - pushState => 添加一个路由信息
  - replaceState => 替换一个路由信息
  - window.onpopstate => 监听浏览器的前进与后退
:::
## 5. 组件通信方式

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

### 6-3. 网络层面的优化
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

## 8. 为什么要有虚拟DOM
>[!tip]
>- **1. 框架设计层面**: 
>   - 1. 数据驱动型框架，难以精确到具体哪个元素与数据的关联，其颗粒度是精确到组件级别，数据变化时会引起组件的重渲染。
>   - 2. 为了构建更加精准的DOM树，不相干的DOM保留不变，转而生成虚拟DOM，再与之前的虚拟DOM进行对比，计算出最小的变化，以此来更新真实DOM。
>- **2. 运行时解耦**：
>   - 1. 如果与真实DOM绑定意味着只能局限于Web系统中使用。
>   - 2. 虚拟DOM就是用来描述UI的，UI的描述与具体的平台无关，可以跨平台使用。




## 大文件上传实现



## 断点续传


## 实现高性能PDF预览



## 无感刷新


## 双token


## 文件类型File、Blob、ArrayBuffer、DataURL、Base64



