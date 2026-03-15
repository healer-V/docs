---
title: "组件基础与注册方式"
category: "前端 · Vue 2"
tags:
  - Vue
excerpt: "组件是 Vue 最强大的功能之一，可以将页面拆分为可复用的独立模块。 组件是可复用的 Vue 实例，具有自己的数据、方法和生命周期。 组件可以嵌套、组合，形成复杂的应用结构。 main.js中使用 Vue.component() 进行全局注..."
---

#  组件基础与注册方式
:::tip
组件是 Vue 最强大的功能之一，可以将页面拆分为可复用的独立模块。
:::

## 一、什么是组件

::: tip 组件定义
- 组件是可复用的 Vue 实例，具有自己的数据、方法和生命周期。
- 组件可以嵌套、组合，形成复杂的应用结构。
:::

## 二、组件注册

### 1、全局注册
>[!note]
> - `main.js`中使用 `Vue.component()` 进行全局注册
>
```javascript
// main.js
import Vue from 'vue'

Vue.component('my-component', {
  template: '<div>这是一个全局组件</div>'
})

new Vue({
  el: '#app'
})
```

```vue
<!-- 在任何组件中都可以使用 -->
<template>
  <div>
    <my-component></my-component>
  </div>
</template>
```

### 2、局部注册
>[!note]
> - 在组件选项中注册,使用`components`
>

```vue
<template>
  <div>
    <child-component></child-component>
  </div>
</template>

<script>
// 导入子组件
import ChildComponent from './ChildComponent.vue'

export default {
  name: 'ParentComponent',
  components: {
    // 局部注册
    ChildComponent
  }
}
</script>
```

### 3、组件命名
>[!note]
> - 推荐使用 `PascalCase`（大驼峰）命名
>

```vue
<script>
export default {
  name: 'MyComponent'  // ✅ 推荐
}
</script>
```

```vue
<template>
  <div>
    <MyComponent />  <!-- ✅ 推荐 -->
    <my-component />  <!-- ✅ 也可以，会自动转换 -->
  </div>
</template>
```

## 三、单文件组件

### 1、基本结构
::: details
```vue
<template>
  <!-- HTML 模板 -->
  <div class="my-component">
    <h1>{{ title }}</h1>
  </div>
</template>

<script>
// JavaScript 逻辑
export default {
  name: 'MyComponent',
  data() {
    return {
      title: '我的组件'
    }
  }
}
</script>

<style scoped>
/* CSS 样式 */
.my-component {
  color: #333;
}
</style>
```
:::

### 2、使用单文件组件
:::details
```vue
<!-- ParentComponent.vue -->
<template>
  <div>
    <ChildComponent />
  </div>
</template>

<script>
import ChildComponent from './ChildComponent.vue'

export default {
  components: {
    ChildComponent
  }
}
</script>
```
:::

## 四、组件数据

### 1、data
>[!warning] 注意事项
>- 组件中的 `data` 必须是一个函数，返回一个对象
>- **为什么必须是函数**
>   - 如果 `data` 是对象，所有组件实例会共享同一个数据对象
>   - 使用函数返回对象，每个组件实例都有独立的数据副本

```vue
<script>
export default {
  data() { // [!code focus]
    return { // [!code focus]
      message: 'Hello' // [!code focus]
    } // [!code focus]
  } // [!code focus]
}
</script>
```


## 五、组件最佳实践

1. **单一职责**：每个组件只负责一个功能
2. **可复用性**：组件应该是可复用的
3. **命名规范**：使用 PascalCase 命名组件
4. **Props 验证**：为 props 添加类型和验证
5. **使用 scoped 样式**：避免样式污染

