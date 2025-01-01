## 一、介绍vue
::: tip Vue
 - 一套用于构建用户界面的`渐进式框架`
 - 可以自底向上逐层应用。
 - Vue 的核心库只关注视图层。
:::
### 1.1、MVVM架构

1. `View`：视图层（UI 用户界面）
2. `ViewModel`：业务逻辑层（一切 js 可视为业务逻辑）
3. `Model`：数据层（存储数据及对数据的处理如增删改查）

### 1.2、vue2 对比 vue3
> [!IMPORTANT]
>- 重写了双向数据绑定
>- 优化了VDOM
>- 支持Fragments
>- 支持Tree shaking
>- 支持Composition API

### 1.3、Vue3新特性

#### 1.3.1、重写双向数据绑定
>[!TIP]
>- `Vue2`基于`Object.defineProperty()`实现
>
>- `Vue3` 基于`Proxy`实现
>
> `proxy`与`Object.defineProperty(obj, prop, desc)`方式相比有以下`优势`：
>
>  1. 丢掉麻烦的备份数据
>  2. 省去for in 循环
>  3. 可以监听数组变化
>  4. 代码更简化
>  5. 可以监听动态新增的属性；
>  6. 可以监听删除的属性 ；
>  7. 可以监听数组的索引和 length 属性；

```js
 
    let proxyObj = new Proxy(obj,{
        get : function (target,prop) {
            return prop in target ? target[prop] : 0
        },
        set : function (target,prop,value) {
            target[prop] = 888;
        }
    })
```



#### 1.3.2、Vue3优化VDOM
>[!TIP]
> - 在Vue2中,每次更新diff,都是全量对比。
> - Vue3则只对比`带有标记的`,这样大大减少了非动态内容的对比消耗
> 
>
> 『注』：可以通过[Vue Template Explorer](https://vue-next-template-explorer.netlify.app/) 网站看到静态标记	

#### 1.3.3、Vue3 Fragments
>[!TIP]
> - Vue3 支持`多个根节点`
> - 支持`render JSX `写法
> - 新增了`<Suspense>` 内置组件：在组件树中协调对异步依赖的处理。
>   - 可以在组件树上层等待下层的多个嵌套异步依赖项解析完成，并可以在等待时渲染一个加载状态。
> - 新增了`<teleport>` 内置组件：
>   - 将一个组件内部的一部分模板“传送”到该组件的 DOM 结构外层的位置去。
> - 新增了多 `v-model` 用法

```js
render() {
        return (
            <>
                {this.visable ? (
                    <div>{this.obj.name}</div>
                ) : (
                    <div>{this.obj.price}</div>
                )}
                <input v-model={this.val}></input>
                {[1, 2, 3].map((v) => {
                   return <div>{v}-----</div>;
                })}
            </>
        );
    },
 
```

#### 1.3.4、Vue3 Tree shaking
>[!TIP]
> - 在保持代码运行结果不变的前提下，`去除无用的代码`。
> - `Vue2中不支持`，主要原因是Vue实例在项目中是单例的，捆绑程序无法检测到该对象的哪些属性在代码中被使用到。
> - Vue3源码引入tree shaking特性，`将全局 API 进行分块`。

#### 1.3.5、Vue 3 Composition Api
>[!NOTE]
> Setup 语法糖式编程





## 二、配置环境

### 2.1、node.js
>[!TIP]
> [下载 | Node.js 中文网](http://nodejs.cn/download/current/)
>
> 安装完成之后可以在终端输入`npm -v` 来检查`是否安装成功`

### 2.2、NVM管理node多版本

#### 2.2.1、卸载node
>[!NOTE]
>『注』：**安装nvm时不能安装任何node版本（如存在请删除后再安装nvm），再检查环境变量，如果还有node.js相关也删掉，保证系统无任何node.js 残留。**


>[!TIP]
> - 控制面板 -> 卸载程序 -> 卸载nodejs
> - 为了确保彻底删除node，看下node安装目录中还有没有node文件夹，有的话一起删除。
> - 删除以下文件夹（如果存在的话）。
>   C:\Program Files (x86)\Nodejs
>   C:\Program Files\Nodejs
>   C:\Users{User}\AppData\Roaming\npm
>   C:\Users{User}\AppData\Roaming\npm-cache
> - 删除C:\Users\用户名 下的 .npmrc文件以及 .yarnrc 文件。
> - 环境变量中npm、node的所有相关统统删掉。

#### 2.2.2、下载nvm
>[!NOTE]
> [NVM下载](https://github.com/coreybutler/nvm-windows/releases)

#### 2.2.3、安装NVM
>[!TIP]
> - 下一步即可
>
> 『注』：**安装路径的文件夹名称不要出现中文，空格**

#### 2.2.4、配置路径和下载镜像

**找到nvm安装路径 =>找到 `setting.txt` 文件 =>新增两行信息，配置下载源**

```bash
node_mirror: https://npmmirror.com/mirrors/node/ # node下载镜像
npm_mirror: https://npmmirror.com/mirrors/npm/ # npm下载镜像

```

#### 2.2.5、检查nvm是否安装完成

> `win + R`，调用cmd，输入`nvm`

#### 2.2.6、安装node
>[!TIP]
> 1. `nvm list available` :查看node所有版本，LST表示可插入稳定版本。
> 2. `nvm install 16.14.0`: 安装指定版本。
> 3. `nvm use 16.14.0` ：切换node指定版本。
> 4. `nvm list` ：查看当前已安装的node.js版本，带*号的是正在使用的。
> 5. `nvm uninstall 16.14.0` :删除某node版本。

#### 2.2.7、修改默认镜像源

1. 修改npm默认镜像源为淘宝镜像

```bash
npm config set registry https://registry.npmmirror.com # 修改镜像源为淘宝镜像源
```

2. 检查是否修改成功

```bash
npm config get registry
```

### 2.3、nrm 管理 npm 源
>[!NOTE]
> nrm（npm registry manager）是一个用于管理和切换 npm 源的命令行工具,可以切换不同源。

#### 2.3.1、安装nrm

```bash
npm install -g nrm
```

#### 2.3.2、常见的 nrm 命令

```bash
nrm ls  # 列出可用的源：当前配置的所有可用 npm 源以及它们的名称和 URL。
```



## 三、vite目录

### 3.1、目录介绍
::: tip Vite
 - `public` :下面的不会被编译 可以存放静态资源。
 - `assets` :下面可以存放可编译的静态资源。
 - `components`: 下面用来存放我们的组件。
 - `App.vue` :全局组件。
 - `main.ts` :全局的ts文件。
 - `index.html ` : 非常重要的入口文件 。
 - webpack，rollup 他们的入口文件都是enrty input 是一个js文件 。
- 而Vite 的入口文件是一个html文件，他刚开始不会编译这些js文件 只有当你用到的时候 如script src="xxxxx.js" 会发起一个请求被vite拦截这时候才会解析js文件。
  - `vite.config.ts` 是vite的配置文件具体配置项。
 - VsCode Vue3 插件推荐 Vue Language Features (Volar)。
 :::



## 四、SFC语法规范
::: tip SFC
 `*.vue`文件都由三种类型的顶层语法块所组成：`<template>`、`<script>`、`<style>`

 1.`<template>`

 - 每个 `*.vue` 文件最多可同时包含一个顶层 `<template>` 块。
 - 其中的内容会被提取出来并传递给 `@vue/compiler-dom`，预编译为 `JavaScript` 的渲染函数，并附属到导出的组件上作为其 `render` 选项。

 2.`<script>`

 - 每一个 `*.vue` 文件可以有多个 `<script>` 块 (不包括[`<script setup>`](https://cn.vuejs.org/api/sfc-script-setup))。
 - 该脚本将作为 ES Module 来执行。
 - 其`默认导出`的内容应该是 Vue 组件选项对象，它要么是一个普通的对象，要么是 [defineComponent](https://v3.cn.vuejs.org/api/global-api.html#definecomponent) 的返回值。

 3.`<script setup>`

 - 每个 `*.vue` 文件最多只能有一个` <script setup>` 块 (不包括常规的` <script>`)

 - 该脚本会被预处理并作为组件的 `setup()` 函数使用，也就是说它会在每个组件实例中执行。`<script setup>` 的顶层绑定会自动暴露给模板。更多详情查看 `<script setup>` 文档。

 4.`<style>`

 - 一个 `*.vue` 文件可以包含多个 `<style>` 标签。
 - `<style> `标签可以通过` scoped` 或` module attribute` (更多详情查看 SFC 样式特性) 将样式封装在当前组件内。多个不同封装模式的 `<style> `标签可以在同一个组件中混
:::


## 五、模板语法 & vue指令

### 5.1、模板插值语法

> 在script 声明一个变量可以直接在template 使用用法为{{变量名称}}
>
> - 可以编写条件运算
> - 简单运算
> - 操作API 

```vue
<template>
  <div>{{ message }}</div>
 	<div>{{ mess == 0 ? '我是张三0' : '我不是张三other' }}</div>
  <div>{{ mess  + 1 }}</div>
  <div>{{ message.split('，') }}</div>
</template>
 
 
<script setup lang="ts">
const message = "我是张三"
const mess:number = 1
</script>
 
<style>
</style>
```

### 5.2、Vue指令

> 1. `v-text `: 用来显示文本
> 2. `v-html`:  用来展示富文本
> 3. `v-if`: 用来控制元素的显示隐藏（切换真假DOM）
> 4. `v-else-if` :表示 v-if 的“else if 块”。可以链式调用
> 5. `v-else v-if`: 条件收尾语句
> 6. `v-show`: 用来控制元素的显示隐藏（display none block Css切换）
> 7. `v-on`: 简写`@ `用来给元素添加事件
> 8. `v-bind`: 简写`: ` 用来绑定元素的属性Attr
> 9. `v-model`: 双向绑定
> 10. `v-for`: 用来遍历元素
> 11. `v-once `:性能优化只渲染一次
> 12. `v-memo`:小幅度手动提升一部分`性能`
> 13. `v-prevent`阻止表单提交



## 六、Vue核心虚拟Dom和 diff 算法

> `虚拟DOM`就是通过JS来生成一个AST(抽象语法树)节点树

### 6.1、为什么要有虚拟DOM？

> 一个dom上面的属性是非常多的,所以直接操作DOM非常浪费性能。
>
> 解决方案：
>
> 1. Vue1.0有太多的闭包，小项目还可以，大项目就不适合，就会造成内存泄漏。	
> 2. 可以用`JS`的计算性能来换取操作`DOM`所消耗的性能，既然我们逃不掉操作`DOM`这道坎,但是我们可以尽可能少的操作`DOM`，因为`操作JS是非常快`的。

#### 6.1.1、虚拟Dom（VNode）

假设真实DOM是：

```html
<ul id="container">
    <li class="box" :key="user1">张三</li>
    <li class="box" :key="user2">李四</li>
</ul>
```

那么它对应的VNode就是：

```js
<script>
let oldVNode = {
  tag: "ul",
  data: {
    staticClass: "container",
  },
  text: undefined,
  children: [
    {
      tag: "li",
      data: { staticClass: "box", key: "user1" },
      text: undefined,
      children: [
        { tag: undefined, data: undefined, text: "张三", children: undefined },
      ],
    },
    {
      tag: "li",
      data: { staticClass: "box", key: "user2" },
      text: undefined,
      children: [
        { tag: undefined, data: undefined, text: "李四", children: undefined },
      ],
    },
  ],
};
</script>
```



### 6.2、Vue2 Diff算法

> 整体策略：`深度优先，同层比较`。
>
> 关键特性：
>
> 	1. `同级比较`: 只比较同一层级的节点。
>
>    	2. `双端比较`：采用双端比较策略，从列表的两端（头部和尾部）开始比较，以尽量减少节点的移动次数。
>    	3. `更新策略`：当头尾比较无法匹配时，Vue2 会尝试复用旧节点，通过更新节点的属性或子节点来匹配新的虚拟节点，同时将其移动到正确的位置，以减少 DOM 操作次数。

#### 6.2.1、基本原理

> 1. 首先进行新旧节点头尾对比，头与头，尾与尾对比，寻找为移动的节点。
> 2. 新旧节点头尾对比完成后，进行交叉对比，头与尾，尾与头对比，这一步是寻找移动后可复用的节点。
> 3. 在剩余的新旧节点中对比寻找可复用节点，创建一个旧节点keyToIndex的哈希表map记录key，然后继续遍历新节点索引通过key查找可复用的旧节点。

#### 6.2.2、算法







### 6.3、Vue3 Diff算法

#### 6.3.1、基本原理

>  **全新的编译策略和运行时优化，包括对 Diff 算法的改进**
>
>  1. `双端比较优化`:对于相同节点的处理更加高效。
>  2. `静态节点提升`:对静态节点进行提升，这些节点在更新时不会被重新创建，而是直接复用，减少渲染成本。
>  3. `支持碎片化(Fragment)`:Vue3支持碎片化，允许组件有多个根节点，这在Vue2中是不支持的。
>  4. `区块树(Block Tree)`:可以跳过静态内容，快速定位到动态节点，减少了Diff时的比较次数。
>  5. `编译时优化`：Vue3在编译时会对模板进行静态提升，将不会变化的节点和属性提取出来，避免在每次渲染时都重新创建，以此减少DOM树的创建和销毁。





> [Vue3源码地址](https://github.com/vuejs/core)



#### 6.3.2、算法





#### 6.3.1、无key的Diff算法

> 1. patch的时候不同节点会进行替换。
> 2. 多余的节点进行新增。
> 3. 缺少了原节点会进行删除。



#### 6.3.2、有key的Diff算法

> 1. 前序对比算法。
> 2. 尾序对比算法。
> 3. 新节点如果多出来，就是挂载。
> 4. 旧节点如果多出来，就是卸载。
> 5. 特殊情况乱序。
>
>    1. 构建新节点的映射关系。
>    2. 记录新节点在旧节点中的位置数组。
>    3. 多余旧节点就进行删除。
>    4. 新节点不包含的旧节点也删除。
>    5. 节点出现交叉，说明是要移动，去求最长递增子序列。
>       - 求最长递增子序列升序（贪心+二分查找）。
>    6. 如果当前遍历的这个节点不在子序列，说明要进行移动，如果节点在子序列中直接跳过。


#### 6.3.3、最长递增子序列

> Longest Increasing Subsequence，简称LIS ：要求在一个给定的序列中找到最长的严格递增的子序列。
>
> 方法：
>
> 1. 动态规划
> 2. 贪心+二分查找



```js
function LIS(nums) {
  if (nums.length === 0) {
    return [];
  }
  let results = [[nums[0]]];
  for (let i = 1; i < nums.length; i++) {
    const n = nums[i];
    _update(n);
  }
  function _update(n) {
    for (let i = results.length - 1; i >= 0; i--) {
      const line = results[i];
      const tail = line[line.length - 1];
      if (n > tail) {
        results[i + 1] = [...line, n];
        break;
      } else if (n < tail && i === 0) {
        results[i] = [n];
      }
    }
  }
  return results[results.length - 1];
}
```










#### 6.3.4、前序遍历

> 根左右



#### 6.3.5、中序遍历

> 左根右



#### 6.3.6、后序遍历

> 左右根



### 6.4、Vue2 Diff 和Vue3 Diff区别

> 1. Vue3 的 Diff 算法相比 Vue2 在性能上有明显的提升。
> 2. 对静态节点和动态节点的处理更加高效。
> 3. Vue3 的`区块树优化`也减少了不必要的节点比较，进一步提高了性能。

## 七、Ref全家桶

### 7.1、ref

#### 7.1.1、定义

> 接受一个内部值并返回一个`响应式且可变`的 ref 对象。ref 对象仅有一个 `.value` property，指向该内部值。

#### 7.1.2、用法

```js
const test1 = ref({name:"张三"})
```



### 7.2、isRef

#### 7.2.1、定义

> 判断变量是否为响应式



#### 7.2.2、用法

```js
const test1 = ref({name:"张三"})
console.log(isRef(test1)) // true
```



### 7.3、shallowRef

#### 7.3.1、定义

> 浅层次的响应
>
> 1. `shallowRef`是`ref`的浅层作用形式。
> 2. 只有对 `.value` 的访问是响应式的。

> 
>
> 注意：`shallowRef`不能与`Ref`同时使用，不然`会影响shallowRef造成视图更新`，因为Ref会调用`triggerRef`导致依赖收集，触发依赖更新。

```js
<template>
		<div>{{test2}}</div>    
</template>
<script setup lang="ts">
const test2 = shallowRef({name:"张三"})
const touch =() =>{
    test2.value.name ="李四" // 视图不更新
}

</script>
```



```js
<template>
   <div>{{test1}}</div> 
		<div>{{test2}}</div>    
</template>
<script setup lang="ts">
const test1 = shallowRef({name:"王五"})
const test2 = shallowRef({name:"张三"})
const touch =() =>{
    test1.value.name ="王五123" 
    test2.value.name ="李四" // 视图更新
}

</script>
```



### 7.4、triggerRef

#### 7.4.1、定义

> **强制触发响应，手动更新视图**

#### 7.4.2、用法

> 接收一个参数 state ，即需要更新的 ref 对象。
>
> - `triggerRef(state)`

```js
<template>
  <div>
    <p>姓名：{{info.name}}</p>
    <p>年龄：{{info.age}}岁</p>

    <button @click="modifyInfo">点击按钮修改信息</button> 
  </div> 
</template>

<script setup>
import { shallowRef, triggerRef } from 'vue'
    
    const info = shallowRef({
      name: '张三',
      age: 20,
      
    })

    const modifyInfo = () => {
        info.value.name = '李四'
        info.value.age = 23 
        triggerRef(info)
    }  
</script>

```





### 7.5、customRef

#### 7.5.1、定义

> 创建一个`自定义的 ref`，显式声明对其依赖追踪和更新触发的控制方式。


#### 7.5.2、用法

```js
import { customRef } from 'vue';

// customRef用于自定义Ref
function MyRef(value) {
    // 该函数默认带参数 track 和 trigger 两个方法。
    return customRef((track, trigger) => {
   
      return {
        // 该对象需要包含 get 和 set 方法。
        get() {
          // 追踪数据变化
          track() // 收集依赖
          return value
        },
        // set 传入一个值作为新值，通常用于取代value
        set(newValue) {
          value = newValue
          // 触发响应，更新视图
          trigger() // 触发依赖更新
        }
      }
    })
}

```



## 八、Reactive全家桶

### 8.1、reactive

#### 8.1.1、定义

> 接受一个内部值并返回一个`响应式且可变`的 reactive对象。

#### 8.1.2、用法

```js
let form = reactive({
    name:"张三"
})
```



#### 8.1.3、与ref的区别

> 1. `ref`支持所有的类型，reactive只支持引用类型（`Array`、`Object`、`Map`、`Set`）
> 2. `ref`取值时都需要加`.value`获取，reactive不需要。

#### 8.1.4、注意点

> `rective`不能直接赋值整个对象的值，不然会对Proxy代理进行`覆盖`，影响视图更新。
>
> 解决方案：
>
> 1. 数组可以使用push加解构
>
> ````js
> let list = reactive([])
> const add =()=>{
>     setTimeout(()=>{
>         let res = ['EDG','FPX','IG']
>         list.push(res)
>         console.log(list)
>     },1000)
> }
> ````
>
> 2. 对象赋值其属性
>
> ```js
> let list = reactive({
>     arr:[]
> })
> const add =()=>{
>     setTimeout(()=>{
>         let res = ['EDG','FPX','IG']
>         list.arr= res
>         console.log(list)
>     },1000)
> }
> ```
>
> 



### 8.2、shallowReactive

#### 8.2.1、定义

> 浅层次的响应
>
> 1. `shallowRective`是`rective`的浅层作用形式。
> 2. 响应式只到其变量的第一层属性，如let list = reactive({index:{num:{foo:1}}}) ,只到list.index有响应式。

#### 8.2.2、用法

```js
let list = shallowReactive({
    foo:{
        num:{
            bar:1
        }
    }
})

```





## 九、to系列

### 9.1、toRef

#### 9.1.1、定义

> 只能修改响应式的值，非响应式对象视图不会更新

#### 9.1.2、用法

```js
<div>{{like}}</div>


import{toRef,reactive} from 'vue'

// const man = {name:'张三',age:22,hooby:'football'}
const man = reactive({name:'张三',age:22,hooby:'football'})
const hooby = toRef(man,"hooby")

const change = ()=>{
    hooby.value = 'basketball'
}
```

### 9.2、toRefs

#### 9.2.1、定义

> 把



#### 9.2.2、用法







## 十、响应式原理

### 10.1、Vue2响应式原理

> - `Vue2`使用的是`Object.defineProperty`
> - `Vue3`使用的是`Proxy`

#### 10.1.1、Vue2.0不足

> 1. 对象只能劫持设置好的数据，新增的数据需要使用`$set`。
>
> 2. 数组只能操作七种方法，修改某一项值无法劫持。
>
>  
>
> `Object.defineProperty`是能做到对数组的修改，只是有非常大的性能问题，所以只能做性能与操作之间的平衡。





### 10.2、实现reactive



```js
export const reactive = <T extends object>(target:T)=>{
    return new Proxy(target,{
        get(target,key,receiver){
            let res = Reflect.get(target,key,receiver) // 使用Reflect是为了防止上下文错乱
            return res
        },
        set(target,key,value,receiver){
            let res = Reflect.get(target,key,value,receiver)
            return res
        }
    })
}
```



### 10.3、实现副作用函数







## 十一、Computed计算属性

### 11.1、定义

> 当依赖的属性的值发生改变时，才会触发它的更改，如果依赖的值不改变，使用的是缓存中的属性值。





### 11.2、选项式写法

> 支持一个对象传入get函数以及set函数自定义操作

```js
<template>
    <div>姓：<input v-model="firstname" type="text"></div>
    <div>名：<input v-model="lastname" type="text"></div>
    
    <div>全名：{{name}}</div>
			<div><button @click="changeName">changeName</button></div>
</template>


<script setup lang="ts">
let firstname = ref("张")
let lastname = ref("三")
let name =computed<string>({
    get(){
        return firstname.value + '-' + lastname.value
    },
    set(newVal){
        [firstname.value,lastname.value] = newVal.split('-')
    }
})

const changName = ()=>{
    name.value = '李-四'
}
```



### 11.2、函数式写法

> 只能支持一个getter函数不允许修改值

```js
<template>
    <div>姓：<input v-model="firstname" type="text"></div>
    <div>名：<input v-model="lastname" type="text"></div>
    
    <div>全名：{{name}}</div>
		
</template>


<script setup lang="ts">
let firstname = ref("张")
let lastname = ref("三")


let name =computed<string>({
   
})

```





### 11.3、源码剖析

> 1. 如果 computed 的第一个参数是函数，说明是`只读`的传入形式，将参数赋值给 getter, setter为空或在开发环境抛出警告。
> 2. 否则则为选项式传参，直接去第一个参数里面读 get 和 set 并赋值。



> 1. `格式化参数`。
>    1. 如果 computed 的第一个参数是函数，说明是`只读`的传入形式，将参数赋值给 `getter`。setter为空或在开发环境抛出警告。
>    2. 如果computed的第一个参数是对象，说明是可读可写的形式。
> 2. 将get和set传给`ComputedRefImpl类`，默认声明了一个`value`和``dirty=true`（需要重新计算值）。
> 3. `get`中劫持了`value`,然后使用`toRaw`脱离`Proxy代理`，再判断`dirty`是否为true（脏值检测）
>    1. `dirty`为`true` 依赖改变，需要重新计算。
>    2. `dirty`为`false` 依赖不变，直接返回上一次的值。





## 十二、watch侦听器



> 侦听特定的数据源，并在单独的回调函数中执行副作用。
>
> 接受三个参数
>
> 1. `监听源`
>    1. `ref`声明的响应式数据
>    2. `reactive`声明的响应式数据
>    3. 数据源组成的`数组`
>    4. `回调函数`（监听单个数据源）
> 2. 回调函数`Call Back(newValue,oldvalue)`
> 3. `options`配置项 （对象）
>    1. `immediate : true ` // 是否立即调用一次
>    2. `deep: true ` // 是否开启深度监听       `reavtive`声明的变量`默认开启深度监听`。



## 十三、watchEffect高级侦听器

> 非惰性的，进入页面时函数自动调用一次。