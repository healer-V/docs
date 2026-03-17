---
title: "Vue 3 状态管理"
category: "前端 · Vue 3"
tags:
  - Vue
  - Pinia
excerpt: "Pinia 是 Vue 3 官方推荐的状态管理库，提供 Store、State、Getter、Action 核心概念，支持 TypeScript 类型推断、开发工具调试和插件扩展，本文系统讲解其核心用法。"
date: 2026-03-17
---

# Vue 3 状态管理

Pinia 是 Vue 3 的官方状态管理库，由 Vue 核心团队维护，取代了 Vuex 4。它设计更简洁，原生支持 TypeScript，并与 Vue DevTools 完整集成。

## 一、Pinia 安装与配置

### 1. 安装

```bash
npm install pinia
```

### 2. 注册插件

```js
// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

## 二、定义 Store

Pinia 提供两种定义 Store 的方式：Options Store 和 Setup Store。

### 1. Options Store（类似 Vuex）

::: details Options Store 示例

```js
// src/stores/cart.js
import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  // state：响应式数据（工厂函数形式）
  state: () => ({
    items: [],
    couponCode: '',
    isCheckingOut: false
  }),

  // getters：计算属性（基于 state）
  getters: {
    itemCount: (state) => state.items.length,

    totalPrice: (state) =>
      state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),

    // 使用 this 访问其他 getter
    discountedTotal() {
      return this.couponCode === 'VIP20'
        ? this.totalPrice * 0.8
        : this.totalPrice
    }
  },

  // actions：方法（支持同步和异步）
  actions: {
    addItem(product) {
      const existing = this.items.find(i => i.id === product.id)
      if (existing) {
        existing.quantity++
      } else {
        this.items.push({ ...product, quantity: 1 })
      }
    },

    removeItem(productId) {
      this.items = this.items.filter(i => i.id !== productId)
    },

    async checkout() {
      this.isCheckingOut = true
      try {
        const order = await createOrder({
          items: this.items,
          couponCode: this.couponCode
        })
        this.$reset()  // 重置 state 到初始值
        return order
      } finally {
        this.isCheckingOut = false
      }
    }
  }
})
```
:::

### 2. Setup Store（推荐，更灵活）

::: details Setup Store 示例

```js
// src/stores/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // state：用 ref/reactive 定义
  const currentUser = ref(null)
  const token = ref(localStorage.getItem('token') || '')
  const isLoading = ref(false)

  // getters：用 computed 定义
  const isLoggedIn = computed(() => !!token.value && !!currentUser.value)

  const isAdmin = computed(() =>
    currentUser.value?.role === 'admin'
  )

  function hasPermission(permission) {
    return currentUser.value?.permissions?.includes(permission) ?? false
  }

  // actions：普通函数（支持 async）
  async function login(email, password) {
    isLoading.value = true
    try {
      const { user, accessToken } = await authApi.login(email, password)
      currentUser.value = user
      token.value = accessToken
      localStorage.setItem('token', accessToken)
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    await authApi.logout()
    currentUser.value = null
    token.value = ''
    localStorage.removeItem('token')
  }

  async function fetchProfile() {
    if (!token.value) return
    currentUser.value = await userApi.getProfile()
  }

  // 必须 return 所有需要暴露的内容
  return {
    currentUser,
    token,
    isLoading,
    isLoggedIn,
    isAdmin,
    hasPermission,
    login,
    logout,
    fetchProfile
  }
})
```
:::

## 三、在组件中使用 Store

### 1. 基本用法

::: details 组件中使用 Store 示例

```vue
<!-- src/components/CartSummary.vue -->
<script setup>
import { useCartStore } from '@/stores/cart'
import { storeToRefs } from 'pinia'

const cartStore = useCartStore()

// storeToRefs：将 store 的 state 和 getters 转为响应式 ref
// 必须用 storeToRefs，直接解构会丢失响应性
const { items, isCheckingOut } = storeToRefs(cartStore)
const { itemCount, discountedTotal } = storeToRefs(cartStore)

// actions 可以直接解构（函数不需要 storeToRefs）
const { addItem, removeItem, checkout } = cartStore

async function handleCheckout() {
  const order = await cartStore.checkout()
  if (order) {
    router.push({ name: 'OrderSuccess', params: { orderId: order.id } })
  }
}
</script>

<template>
  <div class="cart-summary">
    <h3>购物车（{{ itemCount }} 件）</h3>

    <ul>
      <li v-for="item in items" :key="item.id">
        {{ item.name }} × {{ item.quantity }}
        <span>¥{{ (item.price * item.quantity).toFixed(2) }}</span>
        <button @click="removeItem(item.id)">删除</button>
      </li>
    </ul>

    <div class="cart-total">
      合计：<strong>¥{{ discountedTotal.toFixed(2) }}</strong>
    </div>

    <button
      :disabled="isCheckingOut || items.length === 0"
      @click="handleCheckout"
    >
      {{ isCheckingOut ? '结算中...' : '去结算' }}
    </button>
  </div>
</template>
```
:::

### 2. 直接修改 state

::: details 直接修改 state 的三种方式

```js
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()

// 方式一：直接修改（只能在开发环境的 action 中建议使用）
cartStore.isCheckingOut = false

// 方式二：$patch 批量修改（推荐，会被合并为一次更新）
cartStore.$patch({
  isCheckingOut: false,
  couponCode: ''
})

// 方式三：$patch 传函数（处理数组操作等复杂场景）
cartStore.$patch((state) => {
  state.items.push({ id: 4, name: '新商品', price: 99, quantity: 1 })
  state.couponCode = 'NEW10'
})

// $reset：重置 state 到初始值（仅 Options Store 支持）
cartStore.$reset()
```
:::

## 四、Store 之间的交互

### 1. 在 Action 中调用其他 Store

::: details Store 间交互示例

```js
// src/stores/order.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useOrderStore = defineStore('order', () => {
  const orders = ref([])

  async function createOrder() {
    // 在 action 中直接调用其他 store
    const cartStore = useCartStore()    // 在函数内部调用（避免循环依赖）
    const userStore = useUserStore()

    if (!userStore.isLoggedIn) {
      throw new Error('请先登录')
    }

    const order = await orderApi.create({
      userId: userStore.currentUser.id,
      items: cartStore.items,
      total: cartStore.discountedTotal
    })

    orders.value.push(order)
    cartStore.$reset()  // 清空购物车
    return order
  }

  return { orders, createOrder }
})
```
:::

## 五、数据持久化

### 1. 手动持久化

::: details 手动持久化示例

```js
// src/stores/settings.js
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const SETTINGS_KEY = 'app_settings'

export const useSettingsStore = defineStore('settings', () => {
  // 从 localStorage 读取初始值
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')

  const theme = ref(saved.theme || 'light')
  const language = ref(saved.language || 'zh-CN')
  const fontSize = ref(saved.fontSize || 14)

  // 监听变化自动保存
  watch(
    () => ({ theme: theme.value, language: language.value, fontSize: fontSize.value }),
    (newSettings) => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))
    },
    { deep: true }
  )

  function resetSettings() {
    theme.value = 'light'
    language.value = 'zh-CN'
    fontSize.value = 14
  }

  return { theme, language, fontSize, resetSettings }
})
```
:::

### 2. 使用 pinia-plugin-persistedstate

::: details pinia-plugin-persistedstate 示例

```bash
npm install pinia-plugin-persistedstate
```

```js
// src/main.js
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
```

```js
// src/stores/user.js
export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const currentUser = ref(null)
  // ...
  return { token, currentUser }
}, {
  persist: {
    // 只持久化 token，currentUser 不需要持久化
    paths: ['token'],
    storage: localStorage
  }
})
```
:::

## 六、TypeScript 支持

::: details TypeScript 完整类型示例

```ts
// src/stores/product.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Product {
  id: number
  name: string
  price: number
  stock: number
  category: string
}

interface ProductFilter {
  keyword: string
  category: string
  minPrice: number
  maxPrice: number
}

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([])
  const filter = ref<ProductFilter>({
    keyword: '',
    category: '',
    minPrice: 0,
    maxPrice: Infinity
  })
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const filteredProducts = computed(() =>
    products.value.filter(p => {
      const matchKeyword = !filter.value.keyword ||
        p.name.includes(filter.value.keyword)
      const matchCategory = !filter.value.category ||
        p.category === filter.value.category
      const matchPrice = p.price >= filter.value.minPrice &&
        p.price <= filter.value.maxPrice
      return matchKeyword && matchCategory && matchPrice
    })
  )

  async function fetchProducts(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      products.value = await productApi.getAll()
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      isLoading.value = false
    }
  }

  return { products, filter, isLoading, error, filteredProducts, fetchProducts }
})
```
:::

## 七、Vuex 4 vs Pinia 对比

| 特性 | Vuex 4 | Pinia |
|------|--------|-------|
| TypeScript 支持 | 需要额外配置 | 原生完整支持 |
| 代码体积 | 较大 | 极小（~1KB） |
| Mutations | 必需 | 无（直接修改 state） |
| 模块命名空间 | `modules` + `namespaced` | 每个 Store 独立，天然隔离 |
| 组合式 API 风格 | 不自然 | 完全兼容 |
| DevTools 支持 | 支持 | 完整支持（时间旅行调试） |
| 插件系统 | 支持 | 支持，更简单 |

::: tip 新项目建议直接使用 Pinia
Vue 3 的官方推荐已从 Vuex 切换到 Pinia，Vuex 5 的开发工作也已停止，Pinia 是 Vue 生态的未来。
:::
