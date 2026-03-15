---
title: "生命周期"
category: "前端 · Vue 2"
tags:
  - Vue
excerpt: "生命周期钩子 是 Vue 在实例创建、更新、销毁过程中提供的函数，允许开发者在特定阶段执行自定义代码。 生命周期：Vue 实例从创建到销毁的完整过程 钩子函数：在生命周期的特定阶段自动调用的函数 执行顺序：钩子函数按照固定的顺序执行，不能改..."
---

# 生命周期



## 一、生命周期钩子

### 概述

**生命周期钩子** 是 Vue 在实例创建、更新、销毁过程中提供的函数，允许开发者在特定阶段执行自定义代码。

::: tip 说明
- **生命周期**：Vue 实例从创建到销毁的完整过程
- **钩子函数**：在生命周期的特定阶段自动调用的函数
- **执行顺序**：钩子函数按照固定的顺序执行，不能改变
- **使用场景**：数据初始化、DOM 操作、资源清理等
:::

### 生命周期阶段

Vue 实例的完整生命周期分为三个阶段：

```
创建阶段：实例初始化、数据观测、模板编译、DOM 挂载
beforeCreate → created → beforeMount → mounted

更新阶段：数据变化触发视图更新
beforeUpdate → updated

销毁阶段：实例销毁、清理资源
beforeDestroy → destroyed

Keep-alive 缓存阶段（仅在使用 keep-alive 时）：
activated → deactivated
```

::: details 生命周期图示
```
new Vue()
    │
    ├─ beforeCreate  // 实例初始化之后，数据观测之前
    │                 // 此时无法访问 data、methods、computed 等
    │
    ├─ created       // 实例创建完成，数据观测完成
    │                 // 可以访问 data、methods，但 DOM 还未挂载
    │
    ├─ beforeMount   // 挂载开始之前
    │                 // 模板编译完成，但还未挂载到 DOM
    │
    ├─ mounted       // 挂载完成，DOM 已渲染
    │                 // 可以访问 DOM 元素，适合进行 DOM 操作
    │
    ├─ beforeUpdate  // 数据更新时，虚拟 DOM 重新渲染之前
    │                 // 可以访问更新前的数据和 DOM
    │
    ├─ updated       // 数据更新后，DOM 已更新
    │                 // 可以访问更新后的 DOM，注意避免修改数据
    │
    ├─ beforeDestroy // 实例销毁之前
    │                 // 实例仍然可用，适合清理资源
    │
    ├─ destroyed     // 实例销毁后
    │                 // 所有子实例也被销毁，事件监听器被移除
    │
    ├─ activated     // 被 keep-alive 缓存的组件激活时调用
    │                 // 组件从缓存中恢复，重新显示时触发
    │
    └─ deactivated   // 被 keep-alive 缓存的组件停用时调用
                      // 组件被缓存，隐藏时触发
```
:::


### 1、beforeCreate

在实例初始化之后，数据观测（data observation）和事件配置（event/watcher setup）之前被调用。

::: tip 说明
- **执行时机**：Vue 实例刚被创建，但还没有初始化数据和方法
- **可访问内容**：无法访问 `data`、`methods`、`computed` 等选项
- **使用场景**：很少使用，通常用于插件初始化
- **注意事项**：此时 `this` 指向实例，但实例的数据和方法还未初始化
:::

#### 1.1、代码示例

```javascript
new Vue({
  beforeCreate() {
    console.log('beforeCreate')
    // 此时无法访问 data、methods 等
    console.log(this.message) // undefined
    console.log(this.greet)    // undefined
    // 可以访问实例本身
    console.log(this.$options) // 可以访问选项对象
  },
  data: {
    message: 'Hello'
  },
  methods: {
    greet() {
      console.log('Hello')
    }
  }
})
```

#### 1.2、使用场景

- 插件初始化
- 全局配置设置
- 很少在实际开发中使用

### 2、 created

实例创建完成，数据观测完成，属性已绑定，但 DOM 还未挂载。

::: tip 说明
- **执行时机**：数据观测、计算属性、方法、watch/event 事件回调都已配置完成
- **可访问内容**：可以访问 `data`、`methods`、`computed` 等选项
- **DOM 状态**：此时 DOM 还未挂载，无法访问 `this.$el`
- **使用场景**：最常用的生命周期钩子之一，适合进行数据初始化、API 请求等
:::

#### 2.1、代码示例

```javascript
new Vue({
  data: {
    message: 'Hello',
    userList: []
  },
  created() {
    console.log('created')
    // 可以访问 data、methods
    console.log(this.message) // 'Hello'
    // 可以调用方法
    this.greet() // 'Hello'
    // 适合进行数据请求
    this.fetchData()
    // 无法访问 DOM
    console.log(this.$el) // undefined
  },
  methods: {
    greet() {
      console.log('Hello')
    },
    fetchData() {
      // 发起 API 请求
      axios.get('/api/users').then(res => {
        this.userList = res.data
      })
    }
  }
})
```

#### 2.2、使用场景

- 发起 API 请求获取数据
- 初始化非 DOM 相关的数据
- 设置定时器、订阅事件等
- 访问和修改响应式数据

### 3、 beforeMount

挂载开始之前，模板编译完成，但还未挂载到 DOM。

::: tip 说明
- **执行时机**：在 `created` 之后，模板已经编译成渲染函数，但还未将虚拟 DOM 渲染到真实 DOM
- **可访问内容**：可以访问编译后的模板，但 `this.$el` 仍然是挂载前的 DOM 元素
- **使用场景**：很少使用，通常用于在挂载前进行最后的修改
- **注意事项**：此时对 `data` 的修改不会触发更新，因为还未开始渲染
:::

#### 3.1、代码示例

```javascript
new Vue({
  el: '#app',
  data: {
    message: 'Hello'
  },
  beforeMount() {
    console.log('beforeMount')
    // 模板已编译，但还未挂载
    // this.$el 是挂载前的 DOM 元素（如果提供了 el）
    console.log(this.$el) // 可能是 undefined 或挂载前的元素
    // 可以访问 data
    console.log(this.message) // 'Hello'
  },
  template: '<div>{{ message }}</div>'
})
```

#### 3.2、 使用场景

- 在挂载前进行最后的配置
- 很少在实际开发中使用

### 4、mounted

实例挂载完成，DOM 已渲染到页面，可以通过 `this.$el` 访问挂载的 DOM 元素。

::: tip 说明
- **执行时机**：虚拟 DOM 已经渲染为真实 DOM 并挂载到页面上
- **可访问内容**：可以访问 `this.$el` 和所有 DOM 元素
- **使用场景**：最常用的生命周期钩子之一，适合进行 DOM 操作、第三方库初始化
- **注意事项**：子组件的 `mounted` 会在父组件的 `mounted` 之前执行
:::

#### 4.1、代码示例

```javascript
new Vue({
  el: '#app',
  data: {
    message: 'Hello',
    chart: null
  },
  mounted() {
    console.log('mounted')
    // 可以访问 DOM 元素
    console.log(this.$el) // 挂载的 DOM 元素
    // 可以进行 DOM 操作
    const button = this.$el.querySelector('button')
    if (button) {
      button.style.color = 'red'
    }
    // 适合进行 DOM 操作、第三方库初始化
    this.initChart()
    this.bindEvents()
  },
  methods: {
    initChart() {
      // 初始化图表库（如 ECharts）
      this.chart = echarts.init(this.$el.querySelector('#chart'))
    },
    bindEvents() {
      // 绑定 DOM 事件
      window.addEventListener('resize', this.handleResize)
    },
    handleResize() {
      // 处理窗口大小变化
      if (this.chart) {
        this.chart.resize()
      }
    }
  }
})
```

#### 4.2、使用场景

- DOM 操作（获取元素、修改样式等）
- 初始化第三方库（图表库、地图库等）
- 绑定 DOM 事件监听器
- 发起需要 DOM 的 API 请求
- 初始化插件

### 5、beforeUpdate

数据更新时，虚拟 DOM 重新渲染之前被调用，此时可以访问更新前的数据和 DOM。

::: tip 说明
- **执行时机**：响应式数据发生变化，但虚拟 DOM 还未重新渲染
- **可访问内容**：可以访问更新前的数据和 DOM 状态
- **使用场景**：在更新前获取 DOM 状态（如滚动位置），用于更新后恢复
- **注意事项**：避免在此钩子中修改数据，可能导致无限循环
:::

#### 5.1、代码示例

```javascript
new Vue({
  data: {
    message: 'Hello',
    list: [1, 2, 3],
    scrollTop: 0
  },
  beforeUpdate() {
    console.log('beforeUpdate')
    // 可以访问更新前的数据
    console.log('更新前的 message:', this.message)
    // 可以获取更新前的 DOM 状态
    const container = this.$el.querySelector('.container')
    if (container) {
      this.scrollTop = container.scrollTop // 保存滚动位置
    }
  },
  updated() {
    // 在 updated 中恢复滚动位置
    const container = this.$el.querySelector('.container')
    if (container) {
      container.scrollTop = this.scrollTop
    }
  }
})
```

#### 5.2、使用场景

- 在更新前保存 DOM 状态（如滚动位置、输入框焦点等）
- 获取更新前的数据进行比较
- 很少在实际开发中使用

### 6、updated

数据更新后，虚拟 DOM 重新渲染完成，DOM 已更新。

::: tip 说明
- **执行时机**：数据变化导致虚拟 DOM 重新渲染，真实 DOM 已更新完成
- **可访问内容**：可以访问更新后的 DOM 和数据
- **使用场景**：在 DOM 更新后执行操作，如恢复滚动位置、更新第三方库等
- **注意事项**：避免在此钩子中修改响应式数据，可能导致无限更新循环
:::

#### 6.1、代码示例

```javascript
new Vue({
  data: {
    message: 'Hello',
    list: [1, 2, 3],
    chart: null
  },
  updated() {
    console.log('updated')
    // 可以访问更新后的 DOM
    const items = this.$el.querySelectorAll('.item')
    console.log('更新后的项目数量:', items.length)
    
    // 更新第三方库（如 ECharts）
    if (this.chart) {
      this.chart.setOption({
        series: [{
          data: this.list
        }]
      })
    }
    
    // ❌ 错误示例：不要在这里修改数据
    // this.message = 'Updated' // 可能导致无限循环
  }
})
```

#### 6.2、使用场景

- DOM 更新后的操作（如恢复滚动位置）
- 更新第三方库（图表、地图等）
- 执行依赖于 DOM 更新的操作
- 注意：谨慎使用，避免性能问题

::: tip 注意事项
- 不要在 `updated` 中修改响应式数据，可能导致无限更新循环
- 如果需要在数据更新后执行操作，考虑使用 `watch` 或 `nextTick`
- 子组件的 `updated` 会在父组件的 `updated` 之后执行
:::

### 7、beforeDestroy

实例销毁之前被调用，此时实例仍然完全可用，适合进行清理工作。

::: tip 说明
- **执行时机**：在实例销毁之前，实例的所有功能仍然可用
- **可访问内容**：可以访问所有数据、方法、DOM 元素
- **使用场景**：清理定时器、取消事件监听、销毁插件实例等
- **重要性**：防止内存泄漏，必须在此阶段清理资源
:::

#### 7.1、代码示例

```javascript
new Vue({
  data: {
    timer: null,
    chart: null
  },
  mounted() {
    // 创建定时器
    this.timer = setInterval(() => {
      console.log('定时执行')
    }, 1000)
    
    // 绑定事件
    window.addEventListener('resize', this.handleResize)
    
    // 初始化图表
    this.chart = echarts.init(this.$el.querySelector('#chart'))
  },
  beforeDestroy() {
    console.log('beforeDestroy')
    // 清理定时器
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    
    // 取消事件监听
    window.removeEventListener('resize', this.handleResize)
    
    // 销毁图表实例
    if (this.chart) {
      this.chart.dispose()
      this.chart = null
    }
    
    // 取消未完成的请求
    if (this.cancelToken) {
      this.cancelToken.cancel('组件销毁，取消请求')
    }
  },
  methods: {
    handleResize() {
      // 处理窗口大小变化
    }
  }
})
```

#### 7.2、使用场景

- 清理定时器（`setInterval`、`setTimeout`）
- 取消事件监听器（`addEventListener`）
- 销毁第三方库实例（图表、地图等）
- 取消未完成的 HTTP 请求
- 清理订阅（如 WebSocket、EventBus 等）

::: tip 注意事项
- 必须在此阶段清理所有资源，防止内存泄漏
- 实例销毁后，所有子实例也会被销毁
- 这是清理工作的最后机会
:::

### 8、destroyed

实例销毁后调用，此时实例的所有指令都已解绑，所有事件监听器都已移除，所有子实例也都被销毁。

::: tip 说明
- **执行时机**：实例完全销毁后，所有功能都已不可用
- **可访问内容**：理论上可以访问，但实例已不可用，不推荐进行任何操作
- **使用场景**：很少使用，通常清理工作已在 `beforeDestroy` 中完成
- **注意事项**：此时无法访问数据、方法、DOM 元素
:::

#### 8.1、代码示例

```javascript
new Vue({
  data: {
    message: 'Hello'
  },
  destroyed() {
    console.log('destroyed')
    // 所有子实例也被销毁
    // 所有事件监听器已移除
    // 所有指令已解绑
    
    // ❌ 不推荐在此阶段进行任何操作
    // console.log(this.message) // 可能无法访问
    // this.$el // 可能无法访问
  }
})
```

#### 8.2、使用场景

- 最终清理工作（通常已在 `beforeDestroy` 中完成）
- 记录销毁日志
- 很少在实际开发中使用

::: tip 注意事项
- 所有清理工作应该在 `beforeDestroy` 中完成
- 此时实例已完全销毁，不推荐进行任何操作
- 主要用于确认实例已销毁
:::

### 9、activated

被 `keep-alive` 缓存的组件激活时调用。当组件从缓存中恢复并重新显示时触发。

::: tip 说明
- **执行时机**：组件被 `keep-alive` 包裹，从缓存中恢复并显示时
- **触发条件**：组件之前被缓存（`deactivated`），现在需要重新显示
- **可访问内容**：可以访问所有实例属性和方法，包括 `data`、`methods`、`computed` 等
- **使用场景**：适合在组件重新显示时刷新数据、恢复定时器、重新连接 WebSocket 等
- **注意事项**：只有被 `keep-alive` 包裹的组件才会触发此钩子
:::

#### 9.1、代码示例

```javascript
// 组件定义
export default {
  name: 'UserList',
  data() {
    return {
      userList: [],
      timer: null
    }
  },
  activated() {
    console.log('activated - 组件被激活')
    // 组件从缓存中恢复，重新显示
    // 适合刷新数据
    this.fetchUserList()
    // 恢复定时器
    this.timer = setInterval(() => {
      this.refreshData()
    }, 5000)
  },
  methods: {
    fetchUserList() {
      // 获取用户列表
      axios.get('/api/users').then(res => {
        this.userList = res.data
      })
    },
    refreshData() {
      // 刷新数据
      this.fetchUserList()
    }
  }
}
```

```vue
<!-- 使用 keep-alive 包裹组件 -->
<template>
  <div>
    <keep-alive>
      <component :is="currentComponent"></component>
    </keep-alive>
  </div>
</template>
```

#### 9.2、使用场景

- **刷新数据**：组件重新显示时，刷新列表数据、获取最新信息
- **恢复定时器**：重新启动定时任务、轮询接口
- **重新连接**：恢复 WebSocket 连接、重新订阅事件
- **恢复状态**：恢复滚动位置、恢复表单状态
- **重新初始化**：重新初始化第三方库（如图表、地图等）

#### 9.3、与 mounted 的区别

::: warning 重要区别
- **mounted**：组件首次挂载时调用，只调用一次
- **activated**：每次从缓存中恢复时都会调用，可能调用多次
- 使用 `keep-alive` 时，组件不会重新创建，所以 `mounted` 只会在首次挂载时调用
- 后续切换时，组件被缓存，只会触发 `activated` 和 `deactivated`
:::

### 10、deactivated

被 `keep-alive` 缓存的组件停用时调用。当组件被缓存并隐藏时触发。

::: tip 说明
- **执行时机**：组件被 `keep-alive` 包裹，被缓存并隐藏时
- **触发条件**：组件需要被缓存，切换到其他组件时
- **可访问内容**：可以访问所有实例属性和方法
- **使用场景**：适合在组件隐藏时暂停定时器、断开连接、保存状态等
- **注意事项**：只有被 `keep-alive` 包裹的组件才会触发此钩子
:::

#### 10.1、代码示例

```javascript
// 组件定义
export default {
  name: 'UserList',
  data() {
    return {
      userList: [],
      timer: null,
      scrollTop: 0
    }
  },
  mounted() {
    // 首次挂载时创建定时器
    this.timer = setInterval(() => {
      this.refreshData()
    }, 5000)
  },
  activated() {
    console.log('activated - 组件被激活')
    // 恢复定时器
    this.timer = setInterval(() => {
      this.refreshData()
    }, 5000)
    // 恢复滚动位置
    this.$el.scrollTop = this.scrollTop
  },
  deactivated() {
    console.log('deactivated - 组件被停用')
    // 保存滚动位置
    this.scrollTop = this.$el.scrollTop
    // 清除定时器
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    // 断开 WebSocket 连接
    if (this.ws) {
      this.ws.close()
    }
  },
  beforeDestroy() {
    // 最终清理（组件真正销毁时）
    if (this.timer) {
      clearInterval(this.timer)
    }
  },
  methods: {
    refreshData() {
      // 刷新数据
      this.fetchUserList()
    },
    fetchUserList() {
      axios.get('/api/users').then(res => {
        this.userList = res.data
      })
    }
  }
}
```

#### 10.2、使用场景
:::tip
- **暂停定时器**：清除定时任务，避免后台运行
- **断开连接**：关闭 WebSocket 连接、取消订阅
- **保存状态**：保存滚动位置、表单数据、用户输入
- **暂停动画**：暂停视频播放、停止动画效果
- **释放资源**：释放临时资源，但不销毁组件
:::

#### 10.3、与 beforeDestroy 的区别

::: warning 重要区别
- **beforeDestroy**：组件真正销毁时调用，组件会被完全销毁
- **deactivated**：组件被缓存时调用，组件不会被销毁，只是被隐藏
- 使用 `keep-alive` 时，组件切换不会触发 `beforeDestroy`，只会触发 `deactivated`
- 只有当 `keep-alive` 被移除或组件被手动销毁时，才会触发 `beforeDestroy`
:::

#### 10.4、Keep-alive 完整示例

```vue
<template>
  <div>
    <button @click="currentTab = 'tab1'">标签页1</button>
    <button @click="currentTab = 'tab2'">标签页2</button>
    <button @click="currentTab = 'tab3'">标签页3</button>
    
    <keep-alive>
      <component :is="currentTab"></component>
    </keep-alive>
  </div>
</template>

<script>
export default {
  data() {
    return {
      currentTab: 'tab1'
    }
  },
  components: {
    tab1: {
      name: 'Tab1',
      template: '<div>标签页1内容</div>',
      created() {
        console.log('Tab1 created - 只调用一次')
      },
      mounted() {
        console.log('Tab1 mounted - 只调用一次')
      },
      activated() {
        console.log('Tab1 activated - 每次显示时调用')
      },
      deactivated() {
        console.log('Tab1 deactivated - 每次隐藏时调用')
      }
    },
    tab2: {
      name: 'Tab2',
      template: '<div>标签页2内容</div>',
      created() {
        console.log('Tab2 created - 只调用一次')
      },
      mounted() {
        console.log('Tab2 mounted - 只调用一次')
      },
      activated() {
        console.log('Tab2 activated - 每次显示时调用')
      },
      deactivated() {
        console.log('Tab2 deactivated - 每次隐藏时调用')
      }
    },
    tab3: {
      name: 'Tab3',
      template: '<div>标签页3内容</div>',
      created() {
        console.log('Tab3 created - 只调用一次')
      },
      mounted() {
        console.log('Tab3 mounted - 只调用一次')
      },
      activated() {
        console.log('Tab3 activated - 每次显示时调用')
      },
      deactivated() {
        console.log('Tab3 deactivated - 每次隐藏时调用')
      }
    }
  }
}
</script>
```

**执行顺序说明：**
1. 首次切换到 Tab1：`created` → `mounted` → `activated`
2. 切换到 Tab2：Tab1 的 `deactivated` → Tab2 的 `created` → `mounted` → `activated`
3. 切回 Tab1：Tab2 的 `deactivated` → Tab1 的 `activated`（不会再次调用 `created` 和 `mounted`）


### 11、完整生命周期示例

以下示例展示了 Vue 实例的完整生命周期，包括所有生命周期钩子的执行顺序：
::: details
```javascript
new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!',
    count: 0
  },
  // 创建阶段
  beforeCreate() {
    console.log('1. beforeCreate')
    console.log('数据:', this.message) // undefined
    console.log('DOM:', this.$el) // undefined
  },
  created() {
    console.log('2. created')
    // 可以访问 this.message
    console.log('数据:', this.message) // 'Hello Vue!'
    console.log('DOM:', this.$el) // undefined
    // 适合发起数据请求
  },
  beforeMount() {
    console.log('3. beforeMount')
    console.log('DOM:', this.$el) // 挂载前的元素
  },
  mounted() {
    console.log('4. mounted')
    // DOM 已挂载
    console.log('DOM:', this.$el) // 挂载后的元素
    // 适合进行 DOM 操作
  },
  // 更新阶段（数据变化时触发）
  beforeUpdate() {
    console.log('5. beforeUpdate')
    console.log('更新前的 count:', this.count)
  },
  updated() {
    console.log('6. updated')
    console.log('更新后的 count:', this.count)
  },
  // 销毁阶段
  beforeDestroy() {
    console.log('7. beforeDestroy')
    // 清理资源
  },
  destroyed() {
    console.log('8. destroyed')
    // 实例已销毁
  }
  // 注意：activated 和 deactivated 只在被 keep-alive 包裹时才会调用
  // activated() {
  //   console.log('activated - 组件被激活')
  // },
  // deactivated() {
  //   console.log('deactivated - 组件被停用')
  // }
})
```
:::

## 二、生命周期使用场景

**使用场景：**
| 生命周期 | 使用场景 | 说明 |
|---------|---------|------|
| `beforeCreate` | 插件初始化、全局配置 | 很少使用，此时无法访问数据和方法 |
| `created` | 发起数据请求、初始化非 DOM 相关数据 | 最常用，适合 API 请求、数据初始化 |
| `beforeMount` | 挂载前的最后配置 | 很少使用 |
| `mounted` | DOM 操作、初始化第三方库、绑定事件 | 最常用，适合所有需要 DOM 的操作 |
| `beforeUpdate` | 保存更新前的 DOM 状态 | 很少使用，如保存滚动位置 |
| `updated` | 数据更新后的 DOM 操作、更新第三方库 | 谨慎使用，避免修改数据 |
| `beforeDestroy` | 清理定时器、取消事件监听、销毁插件实例 | 必须使用，防止内存泄漏 |
| `destroyed` | 最终清理工作 | 很少使用，清理工作应在 beforeDestroy 完成 |
| `activated` | 刷新数据、恢复定时器、重新连接（keep-alive） | 组件从缓存恢复时调用，适合刷新数据 |
| `deactivated` | 暂停定时器、断开连接、保存状态（keep-alive） | 组件被缓存时调用，适合暂停任务 |



### 1、常见使用模式

#### 模式一：数据请求

```javascript
export default {
  data() {
    return {
      list: []
    }
  },
  created() {
    // 在 created 中发起请求，尽早获取数据
    this.fetchData()
  },
  methods: {
    fetchData() {
      axios.get('/api/data').then(res => {
        this.list = res.data
      })
    }
  }
}
```

#### 模式二：DOM 操作和第三方库

```javascript
export default {
  data() {
    return {
      chart: null
    }
  },
  mounted() {
    // 在 mounted 中初始化需要 DOM 的库
    this.chart = echarts.init(this.$el.querySelector('#chart'))
  },
  beforeDestroy() {
    // 清理资源
    if (this.chart) {
      this.chart.dispose()
    }
  }
}
```

#### 模式三：事件监听

```javascript
export default {
  mounted() {
    // 绑定事件
    window.addEventListener('resize', this.handleResize)
    document.addEventListener('click', this.handleClick)
  },
  beforeDestroy() {
    // 移除事件监听
    window.removeEventListener('resize', this.handleResize)
    document.removeEventListener('click', this.handleClick)
  },
  methods: {
    handleResize() { /* ... */ },
    handleClick() { /* ... */ }
  }
}
```

#### 模式四：定时器

```javascript
export default {
  data() {
    return {
      timer: null
    }
  },
  mounted() {
    // 创建定时器
    this.timer = setInterval(() => {
      this.updateData()
    }, 1000)
  },
  beforeDestroy() {
    // 清理定时器
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },
  methods: {
    updateData() { /* ... */ }
  }
}
```

## 三、总结

### 1、核心要点

::: tip 核心要点
- **Vue 实例**：Vue 应用的根，通过 `new Vue()` 创建，连接数据层和视图层
- **生命周期钩子**：在实例创建、更新、销毁的特定阶段自动调用的函数
- **执行顺序**：钩子函数按照固定顺序执行，不能改变
- **合理使用**：正确使用生命周期钩子可以优化应用性能和用户体验，防止内存泄漏
:::

### 2、重要原则

::: tip 重要原则
1. **数据请求在 `created`**：尽早获取数据，不依赖 DOM
2. **DOM 操作在 `mounted`**：确保 DOM 已渲染，可以安全操作
3. **资源清理在 `beforeDestroy`**：防止内存泄漏，必须清理所有资源
4. **避免在 `updated` 中修改数据**：可能导致无限更新循环
5. **keep-alive 组件使用 `activated` 和 `deactivated`**：管理缓存组件的激活和停用状态
:::

### 3、最佳实践

::: tip 最佳实践
- ✅ 在 `created` 中发起 API 请求
- ✅ 在 `mounted` 中初始化第三方库和进行 DOM 操作
- ✅ 在 `beforeDestroy` 中清理所有资源（定时器、事件监听、插件实例等）
- ✅ 在 `activated` 中刷新数据、恢复定时器（keep-alive 组件）
- ✅ 在 `deactivated` 中暂停定时器、保存状态（keep-alive 组件）
- ❌ 避免在 `updated` 中修改响应式数据
- ❌ 避免在 `beforeCreate` 中访问数据和方法
- ❌ 不要在 `destroyed` 中进行清理工作（应在 `beforeDestroy` 中完成）
:::

