---
title: "Vue 3 指令系统"
category: "前端 · Vue 3"
tags:
  - Vue
excerpt: "Vue 3 提供丰富的内置指令（v-if、v-for、v-model 等），同时支持自定义指令扩展 DOM 操作能力，本文系统讲解指令系统的用法与自定义指令的开发规范。"
date: 2026-03-17
---

# Vue 3 指令系统

指令（Directive）是带有 `v-` 前缀的特殊属性，用于在模板中声明式地操作 DOM。Vue 3 内置了常用指令，并允许你创建自定义指令扩展 DOM 操作能力。

## 一、内置指令

### 1. 条件渲染：v-if / v-else / v-else-if / v-show

::: details 条件渲染指令示例

```vue
<script setup>
import { ref } from 'vue'

const orderStatus = ref('processing')
const isNotificationVisible = ref(true)
</script>

<template>
  <!-- v-if 系列：完全从 DOM 移除 -->
  <div v-if="orderStatus === 'pending'">等待付款</div>
  <div v-else-if="orderStatus === 'processing'">
    <span class="spinner" />处理中
  </div>
  <div v-else-if="orderStatus === 'shipped'">已发货</div>
  <div v-else>已完成</div>

  <!-- v-show：保留 DOM，仅切换 display -->
  <div v-show="isNotificationVisible" class="notification">
    你有新消息！
    <button @click="isNotificationVisible = false">关闭</button>
  </div>
</template>
```
:::

### 2. 列表渲染：v-for

::: details v-for 指令示例

```vue
<script setup>
import { ref, reactive } from 'vue'

const tasks = ref([
  { id: 1, title: '完成需求评审', done: true },
  { id: 2, title: '编写技术方案', done: false },
  { id: 3, title: '代码审查', done: false }
])

function toggleTask(id) {
  const task = tasks.value.find(t => t.id === id)
  if (task) task.done = !task.done
}

function removeTask(id) {
  tasks.value = tasks.value.filter(t => t.id !== id)
}
</script>

<template>
  <ul>
    <li v-for="task in tasks" :key="task.id" :class="{ done: task.done }">
      <input type="checkbox" :checked="task.done" @change="toggleTask(task.id)" />
      <span>{{ task.title }}</span>
      <button @click="removeTask(task.id)">删除</button>
    </li>
  </ul>
</template>
```
:::

::: warning v-for 与 v-if 不要同时使用
在同一元素上同时使用 `v-for` 和 `v-if` 时，Vue 3 中 `v-if` 优先级更高，导致 `v-if` 无法访问 `v-for` 中的变量。建议用 `computed` 先过滤数据，或将 `v-if` 移到父元素上。
:::

### 3. 属性绑定：v-bind

::: details v-bind 完整用法示例

```vue
<script setup>
import { ref, reactive } from 'vue'

const imageUrl = ref('/assets/hero.png')
const isDisabled = ref(false)
const buttonStyle = reactive({ backgroundColor: '#1890ff', color: '#fff' })
const classList = ref(['btn', 'btn-primary'])
const inputProps = reactive({ type: 'email', placeholder: '请输入邮箱', maxlength: 100 })
</script>

<template>
  <!-- 基本绑定 -->
  <img :src="imageUrl" alt="主图" />

  <!-- 布尔属性 -->
  <button :disabled="isDisabled">提交</button>

  <!-- 动态 class -->
  <div :class="{ active: true, disabled: isDisabled }">状态类</div>
  <div :class="classList">数组类</div>

  <!-- 动态 style -->
  <button :style="buttonStyle">操作按钮</button>

  <!-- 批量绑定属性对象 -->
  <input v-bind="inputProps" />
</template>
```
:::

### 4. 事件绑定：v-on

::: details v-on 修饰符示例

```vue
<template>
  <!-- 常用修饰符 -->
  <form @submit.prevent="handleSubmit">       <!-- 阻止默认行为 -->
    <div @click.stop="handleClick">            <!-- 阻止冒泡 -->
      <button @click.once="handleOnce">只触发一次</button>
    </div>

    <!-- 按键修饰符 -->
    <input @keyup.enter="search" @keyup.esc="clearSearch" />
    <input @keydown.ctrl.s="saveDocument" />   <!-- 组合键 -->

    <!-- 鼠标修饰符 -->
    <div @click.right.prevent="showContextMenu">右键菜单</div>
    <div @click.middle="openInNewTab">中键点击</div>
  </form>
</template>
```
:::

### 5. 双向绑定：v-model 修饰符

::: details v-model 修饰符示例

```vue
<script setup>
import { ref } from 'vue'

const username = ref('')
const age = ref(null)
const description = ref('')
</script>

<template>
  <!-- .trim：自动去除首尾空格 -->
  <input v-model.trim="username" placeholder="用户名" />

  <!-- .number：自动转为数字 -->
  <input v-model.number="age" type="number" placeholder="年龄" />

  <!-- .lazy：在 change 事件后同步（而非 input 事件） -->
  <textarea v-model.lazy="description" placeholder="描述（失去焦点后更新）" />
</template>
```
:::

### 6. 其他内置指令

| 指令 | 说明 | 示例 |
|------|------|------|
| `v-text` | 替代 `{{ }}`，设置元素文本内容 | `<span v-text="message" />` |
| `v-html` | 渲染原始 HTML（注意 XSS 风险） | `<div v-html="richContent" />` |
| `v-pre` | 跳过该元素及其子元素的编译 | `<span v-pre>{{ 不编译 }}</span>` |
| `v-once` | 只渲染一次，后续不随数据更新 | `<h1 v-once>{{ title }}</h1>` |
| `v-memo` | 根据依赖数组缓存子树渲染 | `<div v-memo="[value]">...</div>` |
| `v-cloak` | 配合 CSS 隐藏未编译的模板闪烁 | `<div v-cloak>{{ message }}</div>` |

## 二、自定义指令

### 1. 全局注册自定义指令

::: details 全局自定义指令示例

```js
// src/directives/focus.js
export const vFocus = {
  mounted(el, binding) {
    // binding.value 是指令绑定的值
    if (binding.value !== false) {
      el.focus()
    }
  }
}
```

```js
// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import { vFocus } from './directives/focus'

const app = createApp(App)
app.directive('focus', vFocus)  // 全局注册，模板中使用 v-focus
app.mount('#app')
```
:::

### 2. 局部注册自定义指令

在 `<script setup>` 中，以 `v` 开头的变量自动被识别为自定义指令：

::: details 局部自定义指令示例

```vue
<script setup>
// 变量名以 v 开头，自动注册为指令 v-highlight
const vHighlight = {
  mounted(el, binding) {
    el.style.backgroundColor = binding.value || '#fff3cd'
  },
  updated(el, binding) {
    el.style.backgroundColor = binding.value || '#fff3cd'
  }
}
</script>

<template>
  <p v-highlight="'#d4edda'">绿色高亮文本</p>
  <p v-highlight>默认黄色高亮</p>
</template>
```
:::

### 3. 指令钩子函数

自定义指令可以实现以下生命周期钩子：

| 钩子 | 触发时机 |
|------|---------|
| `created` | 元素属性或事件侦听器被应用前 |
| `beforeMount` | 元素插入 DOM 前 |
| `mounted` | 元素及其子元素挂载完成后 |
| `beforeUpdate` | 组件更新前 |
| `updated` | 组件及其子元素更新后 |
| `beforeUnmount` | 元素卸载前 |
| `unmounted` | 元素卸载后 |

### 4. 实用自定义指令示例

::: details 权限控制指令 v-permission

```js
// src/directives/permission.js
import { useUserStore } from '@/stores/user'

export const vPermission = {
  mounted(el, binding) {
    const userStore = useUserStore()
    const required = binding.value  // 所需权限，如 'admin' 或 ['admin', 'editor']

    const hasPermission = Array.isArray(required)
      ? required.some(p => userStore.permissions.includes(p))
      : userStore.permissions.includes(required)

    if (!hasPermission) {
      // 移除元素或隐藏（根据需求选择）
      el.parentNode?.removeChild(el)
    }
  }
}
```

```vue
<!-- 使用权限指令 -->
<template>
  <button v-permission="'admin'">删除用户</button>
  <button v-permission="['admin', 'editor']">编辑内容</button>
</template>
```
:::

::: details 懒加载图片指令 v-lazy

```js
// src/directives/lazy.js
export const vLazy = {
  mounted(el, binding) {
    // 使用 IntersectionObserver 实现图片懒加载
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            el.src = binding.value  // 设置真实图片地址
            observer.unobserve(el)  // 加载后取消监听
          }
        })
      },
      { threshold: 0.1 }
    )

    el.src = '/placeholder.png'  // 先显示占位图
    observer.observe(el)

    // 保存 observer 引用，卸载时清理
    el._lazyObserver = observer
  },
  unmounted(el) {
    el._lazyObserver?.disconnect()
  }
}
```

```vue
<!-- 使用懒加载指令 -->
<template>
  <div class="image-grid">
    <img
      v-for="item in gallery"
      :key="item.id"
      v-lazy="item.fullUrl"
      :alt="item.title"
      class="gallery-image"
    />
  </div>
</template>
```
:::

::: details 点击外部关闭指令 v-click-outside

```js
// src/directives/clickOutside.js
export const vClickOutside = {
  mounted(el, binding) {
    function handleClick(event) {
      // 点击目标不在元素内部时触发回调
      if (!el.contains(event.target)) {
        binding.value(event)
      }
    }
    el._clickOutsideHandler = handleClick
    document.addEventListener('mousedown', handleClick)
  },
  unmounted(el) {
    document.removeEventListener('mousedown', el._clickOutsideHandler)
  }
}
```

```vue
<script setup>
import { ref } from 'vue'
import { vClickOutside } from '@/directives/clickOutside'

const isDropdownOpen = ref(false)
</script>

<template>
  <div
    class="dropdown"
    v-click-outside="() => isDropdownOpen = false"
  >
    <button @click="isDropdownOpen = !isDropdownOpen">选择选项</button>
    <ul v-show="isDropdownOpen">
      <li>选项一</li>
      <li>选项二</li>
    </ul>
  </div>
</template>
```
:::

::: details 防抖输入指令 v-debounce

```js
// src/directives/debounce.js
export const vDebounce = {
  mounted(el, binding) {
    const { value: handler, arg: delay = 300 } = binding
    let timer = null

    el._debounceHandler = function (event) {
      clearTimeout(timer)
      timer = setTimeout(() => handler(event), Number(delay))
    }

    el.addEventListener('input', el._debounceHandler)
  },
  unmounted(el) {
    el.removeEventListener('input', el._debounceHandler)
  }
}
```

```vue
<script setup>
import { vDebounce } from '@/directives/debounce'

function handleSearch(event) {
  console.log('搜索关键词:', event.target.value)
  // 发起 API 请求
}
</script>

<template>
  <!-- 500ms 防抖 -->
  <input v-debounce:500="handleSearch" placeholder="搜索..." />
</template>
```
:::

## 三、指令 vs Composable 的选择

::: tip 何时选择自定义指令
- **使用自定义指令**：需要直接操作 DOM 元素时（如焦点管理、滚动、动画、懒加载）
- **使用 Composable**：处理响应式状态和业务逻辑时（如数据请求、表单验证、状态管理）

自定义指令应保持简单，专注于 DOM 操作，复杂逻辑应提取到 Composable 中。
:::
