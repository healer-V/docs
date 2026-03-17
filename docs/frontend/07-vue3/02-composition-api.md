---
title: "Vue 3 Composition API"
category: "前端 · Vue 3"
tags:
  - Vue
  - TypeScript
excerpt: "Composition API 是 Vue 3 的核心特性，通过 setup 函数将逻辑按功能聚合，本文详解 setup、ref、reactive、computed、watch 的用法和最佳实践。"
date: 2026-03-17
---

# Vue 3 Composition API

Composition API 是 Vue 3 引入的一套函数式 API，解决了 Options API 在复杂组件中逻辑分散、难以复用的问题。它让你可以将相关逻辑聚合在一起，并通过 Composable 函数在多个组件间共享。

## 一、setup 函数

### 1. 基本用法

`setup` 是 Composition API 的入口，在组件创建时执行，早于所有生命周期钩子。

::: details setup 基本示例

```vue
<template>
  <div>
    <p>用户名：{{ username }}</p>
    <button @click="updateName">修改名称</button>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  setup() {
    const username = ref('Alice')

    function updateName() {
      username.value = 'Bob'
    }

    // 必须 return，模板才能访问
    return { username, updateName }
  }
}
</script>
```
:::

### 2. script setup 语法糖（推荐）

`<script setup>` 是 `setup()` 函数的编译时语法糖，顶层声明自动暴露给模板，无需手动 `return`：

::: details script setup 示例

```vue{1}
<script setup>
import { ref } from 'vue'

// 直接声明，模板自动可访问
const username = ref('Alice')

function updateName() {
  username.value = 'Bob'
}
</script>

<template>
  <div>
    <p>用户名：{{ username }}</p>
    <button @click="updateName">修改名称</button>
  </div>
</template>
```
:::

### 3. setup 中的上下文

在普通 `setup()` 函数中，第二个参数 `context` 提供 `attrs`、`slots`、`emit`、`expose`：

::: details setup context 示例

```vue
<script>
export default {
  props: ['title'],
  emits: ['close'],
  setup(props, { attrs, slots, emit, expose }) {
    // props：响应式的 props 对象
    console.log(props.title)

    // attrs：非 props 的透传属性
    console.log(attrs.class)

    // emit：触发父组件事件
    function handleClose() {
      emit('close')
    }

    // expose：控制暴露给父组件的内容（通过模板引用访问）
    expose({ focus: () => console.log('focused') })

    return { handleClose }
  }
}
</script>
```
:::

## 二、ref 响应式引用

### 1. 基础用法

`ref` 用于创建任意类型的响应式数据，通过 `.value` 访问和修改：

::: details ref 基本示例

```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)
const username = ref('Alice')
const isVisible = ref(false)
const tags = ref(['Vue', 'TypeScript'])

// 修改值通过 .value
count.value++
username.value = 'Bob'
tags.value.push('Vite')

// 模板中自动解包，无需 .value
</script>

<template>
  <div>
    <p>计数：{{ count }}</p>
    <p>用户：{{ username }}</p>
    <button @click="count++">+1</button>
  </div>
</template>
```
:::

### 2. 模板引用

`ref` 也用于获取 DOM 元素或子组件实例：

::: details 模板引用示例

```vue{4,13}
<script setup>
import { ref, onMounted } from 'vue'

const inputRef = ref(null) // 模板引用，初始为 null

onMounted(() => {
  // 挂载后 DOM 存在，可以操作
  inputRef.value.focus()
})
</script>

<template>
  <!-- ref 属性值需与脚本中变量名一致 -->
  <input ref="inputRef" type="text" placeholder="自动获取焦点" />
</template>
```
:::

## 三、reactive 响应式对象

`reactive` 用于创建对象或数组的响应式代理，返回的代理对象直接访问属性，无需 `.value`：

::: details reactive 示例

```vue
<script setup>
import { reactive } from 'vue'

const form = reactive({
  username: '',
  email: '',
  password: '',
  agreeTerms: false
})

const cart = reactive({
  items: [],
  total: 0
})

function addItem(product) {
  cart.items.push(product)
  cart.total += product.price
}

function resetForm() {
  // 不能整体替换（会丢失响应性），需逐属性重置
  form.username = ''
  form.email = ''
  form.password = ''
  form.agreeTerms = false
}
</script>

<template>
  <form>
    <input v-model="form.username" placeholder="用户名" />
    <input v-model="form.email" type="email" placeholder="邮箱" />
  </form>
</template>
```
:::

::: warning ref vs reactive 选择建议

| 场景 | 推荐 |
|------|------|
| 基本类型（string、number、boolean） | `ref` |
| 表单、配置等复杂对象 | `reactive` |
| 需要整体替换数据 | `ref`（直接替换 `.value`） |
| 从函数返回响应式数据 | `ref`（保持响应性） |

实际开发中，许多团队统一使用 `ref` 处理所有数据，避免 `reactive` 解构丢失响应性的陷阱。
:::

## 四、computed 计算属性

### 1. 只读计算属性

::: details computed 基本示例

```vue
<script setup>
import { ref, computed } from 'vue'

const products = ref([
  { id: 1, name: '耳机', price: 299, inStock: true },
  { id: 2, name: '键盘', price: 599, inStock: false },
  { id: 3, name: '鼠标', price: 199, inStock: true }
])

const searchKeyword = ref('')

// 过滤并计算 - 依赖变化时自动更新
const filteredProducts = computed(() => {
  return products.value.filter(p =>
    p.name.includes(searchKeyword.value) && p.inStock
  )
})

const totalPrice = computed(() =>
  filteredProducts.value.reduce((sum, p) => sum + p.price, 0)
)
</script>

<template>
  <div>
    <input v-model="searchKeyword" placeholder="搜索商品" />
    <p>找到 {{ filteredProducts.length }} 件商品，合计 ¥{{ totalPrice }}</p>
    <ul>
      <li v-for="p in filteredProducts" :key="p.id">{{ p.name }}</li>
    </ul>
  </div>
</template>
```
:::

### 2. 可写计算属性

::: details 可写 computed 示例

```vue
<script setup>
import { ref, computed } from 'vue'

const firstName = ref('Alice')
const lastName = ref('Wang')

// getter + setter
const fullName = computed({
  get() {
    return `${firstName.value} ${lastName.value}`
  },
  set(newVal) {
    const parts = newVal.split(' ')
    firstName.value = parts[0]
    lastName.value = parts[1] || ''
  }
})

// fullName.value = 'Bob Li' 会自动更新 firstName 和 lastName
</script>
```
:::

## 五、watch 侦听器

### 1. watch 基本用法

::: details watch 示例

```vue
<script setup>
import { ref, watch } from 'vue'

const searchKeyword = ref('')
const results = ref([])
const isLoading = ref(false)

// 侦听单个 ref
watch(searchKeyword, async (newVal, oldVal) => {
  if (!newVal.trim()) {
    results.value = []
    return
  }
  isLoading.value = true
  results.value = await fetchSearchResults(newVal)
  isLoading.value = false
})

const userProfile = ref({ name: 'Alice', age: 25 })

// 侦听对象深层属性变化
watch(userProfile, (newProfile) => {
  console.log('用户信息变化:', newProfile)
}, { deep: true })

// 立即执行
watch(searchKeyword, (val) => {
  console.log('初始值及后续变化:', val)
}, { immediate: true })
</script>
```
:::

### 2. watchEffect 自动追踪依赖

`watchEffect` 不需要显式指定侦听的数据，会自动收集回调中访问的响应式数据作为依赖：

::: details watchEffect 示例

```vue
<script setup>
import { ref, watchEffect } from 'vue'

const userId = ref(1)
const userDetail = ref(null)

// 自动追踪 userId，当 userId 变化时重新执行
watchEffect(async (onCleanup) => {
  // onCleanup 注册清理函数（如取消上一次请求）
  const controller = new AbortController()
  onCleanup(() => controller.abort())

  const data = await fetch(`/api/users/${userId.value}`, {
    signal: controller.signal
  }).then(r => r.json())

  userDetail.value = data
})
</script>
```
:::

### 3. watch vs watchEffect 对比

| 特性 | `watch` | `watchEffect` |
|------|---------|---------------|
| 指定依赖 | 显式指定 | 自动收集 |
| 初始执行 | 需要 `immediate: true` | 立即执行 |
| 访问旧值 | 支持（第二参数） | 不支持 |
| 适用场景 | 需要对比新旧值 | 简单副作用同步 |

## 六、生命周期钩子

Composition API 中的生命周期钩子以 `on` 开头，在 `setup` 内调用：

::: details 生命周期钩子示例

```vue
<script setup>
import {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted
} from 'vue'

// 挂载前（此时 DOM 未创建）
onBeforeMount(() => {
  console.log('组件即将挂载')
})

// 挂载完成（可操作 DOM）
onMounted(() => {
  console.log('组件已挂载，可访问 DOM')
  // 常用于：初始化数据请求、第三方库初始化、DOM 操作
})

// 数据更新前
onBeforeUpdate(() => {
  console.log('数据即将更新')
})

// 数据更新后
onUpdated(() => {
  console.log('DOM 已更新')
})

// 卸载前
onBeforeUnmount(() => {
  console.log('组件即将卸载，清理副作用')
  // 清理定时器、取消事件监听、关闭 WebSocket 等
})

// 卸载完成
onUnmounted(() => {
  console.log('组件已卸载')
})
</script>
```
:::

## 七、Composable 组合式函数

Composable 是封装和复用有状态逻辑的函数，是 Composition API 最强大的使用方式：

::: details 封装数据请求的 Composable 示例

```js
// src/composables/useFetch.js
import { ref, watchEffect } from 'vue'

export function useFetch(urlRef) {
  const data = ref(null)
  const error = ref(null)
  const isLoading = ref(false)

  watchEffect(async (onCleanup) => {
    const controller = new AbortController()
    onCleanup(() => controller.abort())

    const url = typeof urlRef === 'string' ? urlRef : urlRef.value
    if (!url) return

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(url, { signal: controller.signal })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      data.value = await response.json()
    } catch (err) {
      if (err.name !== 'AbortError') {
        error.value = err.message
      }
    } finally {
      isLoading.value = false
    }
  })

  return { data, error, isLoading }
}
```

```vue
<!-- src/views/UserList.vue -->
<script setup>
import { computed } from 'vue'
import { useFetch } from '@/composables/useFetch'

const { data: users, error, isLoading } = useFetch('/api/users')

const activeUsers = computed(() =>
  users.value?.filter(u => u.isActive) ?? []
)
</script>

<template>
  <div>
    <p v-if="isLoading">加载中...</p>
    <p v-else-if="error" class="error">加载失败：{{ error }}</p>
    <ul v-else>
      <li v-for="user in activeUsers" :key="user.id">{{ user.name }}</li>
    </ul>
  </div>
</template>
```
:::

::: tip Composable 命名规范
Composable 函数名约定以 `use` 开头（如 `useAuth`、`useCart`、`useWindowSize`），这是社区公认的规范，便于与普通函数区分。
:::
