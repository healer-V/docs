---
title: "Vue 3 响应式系统"
category: "前端 · Vue 3"
tags:
  - Vue
excerpt: "Vue 3 响应式系统基于 ES6 Proxy 实现，本文深入讲解 ref、reactive、toRef、toRefs 的用法与区别，以及响应式原理和常见陷阱的解决方案。"
date: 2026-03-17
---

# Vue 3 响应式系统

Vue 3 的响应式系统基于 ES6 `Proxy` 重写，相比 Vue 2 的 `Object.defineProperty` 方案，能够检测属性新增/删除、数组索引变化，并支持懒代理提升性能。

## 一、响应式基础 API

### 1. ref

`ref` 接收任意类型值，返回一个包裹对象，通过 `.value` 访问实际值：

::: details ref 完整用法

```vue
<script setup>
import { ref, isRef, unref } from 'vue'

// 基本类型
const count = ref(0)
const message = ref('Hello')
const isVisible = ref(false)

// 对象类型（内部会转为 reactive）
const user = ref({ name: 'Alice', age: 25 })

// 访问和修改
count.value++
user.value.name = 'Bob'
user.value = { name: 'Charlie', age: 30 } // 可以整体替换

// 工具函数
console.log(isRef(count))   // true - 判断是否是 ref
console.log(unref(count))   // 0 - 等同于 isRef(x) ? x.value : x

// 在模板中自动解包（无需 .value）
</script>

<template>
  <div>
    <p>{{ count }}</p>     <!-- 自动解包 -->
    <p>{{ user.name }}</p>
    <button @click="count++">+1</button>
  </div>
</template>
```
:::

### 2. reactive

`reactive` 用于创建对象的深层响应式代理，直接访问属性无需 `.value`：

::: details reactive 完整用法

```vue
<script setup>
import { reactive, isReactive, markRaw } from 'vue'

const state = reactive({
  count: 0,
  user: {
    name: 'Alice',
    address: { city: '北京' }
  },
  items: []
})

// 直接修改属性（包括深层嵌套）
state.count++
state.user.address.city = '上海'  // 深层响应式
state.items.push({ id: 1, name: '商品A' })

// 新增属性也是响应式的（Vue 2 做不到）
state.newField = '新属性'  // 自动响应式

// isReactive：判断对象是否是 reactive 代理
console.log(isReactive(state))  // true

// markRaw：标记对象不被代理（如第三方实例）
import mapboxgl from 'mapbox-gl'
const mapInstance = markRaw(new mapboxgl.Map({ container: 'map' }))
state.map = mapInstance  // mapInstance 不会被深层代理
</script>
```
:::

::: danger reactive 的解构陷阱
`reactive` 对象解构后会失去响应性，必须用 `toRefs` 转换：

```js
const state = reactive({ count: 0, name: 'Alice' })

// 错误：解构后 count 和 name 是普通值，不是响应式的
const { count, name } = state  // 失去响应性！

// 正确：使用 toRefs
import { toRefs } from 'vue'
const { count, name } = toRefs(state)  // count.value, name.value 都是响应式的
```
:::

### 3. readonly

`readonly` 创建一个只读的响应式代理，常用于防止子组件意外修改父组件传入的数据：

::: details readonly 示例

```vue
<script setup>
import { reactive, readonly } from 'vue'

const original = reactive({ count: 0, items: [] })
const readonlyState = readonly(original)

// 尝试修改只读代理会触发警告（开发模式）
readonlyState.count++  // Warning: Set operation on key "count" failed

// 原始对象修改会反映到只读代理上
original.count++
console.log(readonlyState.count)  // 1
</script>
```
:::

## 二、响应式工具函数

### 1. toRef 与 toRefs

将 `reactive` 对象的属性转换为独立的 `ref`，保持响应性连接：

::: details toRef / toRefs 示例

```vue
<script setup>
import { reactive, toRef, toRefs } from 'vue'

const state = reactive({
  username: 'Alice',
  email: 'alice@example.com',
  role: 'admin'
})

// toRef：转换单个属性
const username = toRef(state, 'username')
username.value = 'Bob'  // state.username 同步变为 'Bob'

// toRefs：转换所有属性
const { email, role } = toRefs(state)
email.value = 'bob@example.com'  // state.email 同步变化

// 常见用法：在 Composable 中返回响应式数据
function useUserState() {
  const state = reactive({ name: '', age: 0 })

  return {
    ...toRefs(state),  // 解构后仍保持响应性
    reset: () => { state.name = ''; state.age = 0 }
  }
}
</script>
```
:::

### 2. computed 与响应式

`computed` 基于响应式依赖缓存计算结果，依赖不变时不重新计算：

::: details computed 响应式示例

```js
import { ref, reactive, computed } from 'vue'

const orders = ref([
  { id: 1, amount: 100, status: 'paid' },
  { id: 2, amount: 200, status: 'pending' },
  { id: 3, amount: 150, status: 'paid' }
])

const filter = reactive({ status: 'all' })

// 依赖 orders 和 filter.status，任一变化都会重新计算
const filteredOrders = computed(() => {
  if (filter.status === 'all') return orders.value
  return orders.value.filter(o => o.status === filter.status)
})

const totalAmount = computed(() =>
  filteredOrders.value.reduce((sum, o) => sum + o.amount, 0)
)
```

::: tip 计算属性 vs 方法
计算属性有缓存，依赖不变时多次访问只计算一次；方法每次调用都会重新执行。对于开销较大的计算，优先使用 `computed`。
:::

### 3. shallowRef 与 shallowReactive

浅层响应式，只有顶层属性是响应式的，适合大型数据对象的性能优化：

::: details 浅层响应式示例

```js
import { shallowRef, shallowReactive, triggerRef } from 'vue'

// shallowRef：只有 .value 本身的替换是响应式的
const largeList = shallowRef([
  { id: 1, data: { /* 大量数据 */ } }
])

// 直接修改内部属性不触发更新
largeList.value[0].data.name = 'new'  // 不响应

// 替换整个 .value 会触发更新
largeList.value = [...largeList.value]  // 触发更新

// 或手动触发
largeList.value[0].data.name = 'new'
triggerRef(largeList)  // 手动触发更新

// shallowReactive：只有顶层属性是响应式的
const config = shallowReactive({
  theme: 'dark',
  layout: { sidebar: true, header: true }  // layout 内部不是响应式的
})
config.theme = 'light'           // 触发更新
config.layout.sidebar = false    // 不触发更新
```
:::

## 三、响应式系统原理

### 1. Proxy 拦截机制

Vue 3 使用 `Proxy` 拦截对象的 `get`、`set`、`deleteProperty` 等操作，实现依赖追踪和更新通知：

::: details 简化的响应式实现原理

```js
// 简化演示 Vue 3 响应式核心思路

// 当前正在执行的副作用函数
let activeEffect = null
// 依赖映射：target -> key -> effects
const targetMap = new WeakMap()

// 追踪依赖
function track(target, key) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))
  let deps = depsMap.get(key)
  if (!deps) depsMap.set(key, (deps = new Set()))
  deps.add(activeEffect)
}

// 触发更新
function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  const deps = depsMap.get(key)
  deps?.forEach(effect => effect())
}

// 创建响应式代理
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      track(target, key)        // 读取时追踪依赖
      return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver)
      trigger(target, key)      // 设置时触发更新
      return result
    },
    deleteProperty(target, key) {
      const result = Reflect.deleteProperty(target, key)
      trigger(target, key)      // 删除时触发更新
      return result
    }
  })
}

// 副作用函数（watchEffect 的核心）
function effect(fn) {
  activeEffect = fn
  fn()               // 执行时自动收集依赖
  activeEffect = null
}
```
:::

### 2. ref 的实现原理

`ref` 本质上是一个对象，通过 `getter/setter` 拦截 `.value` 的访问：

::: details ref 实现示意

```js
// ref 的简化实现
function ref(value) {
  return {
    get value() {
      track(this, 'value')  // 读取时追踪
      return value
    },
    set value(newVal) {
      value = newVal
      trigger(this, 'value')  // 修改时触发
    }
  }
}
```
:::

### 3. 响应式丢失的常见场景

::: warning 常见陷阱汇总

```js
import { reactive, ref } from 'vue'

const state = reactive({ count: 0, user: { name: 'Alice' } })

// 陷阱1：解构 reactive 对象
let { count } = state       // count 不是响应式的
count++                     // state.count 不会变化

// 陷阱2：将 reactive 属性赋值给普通变量
let name = state.user.name  // 普通字符串，不是响应式的

// 陷阱3：整体替换 reactive 对象
// state = reactive({ count: 1 })  // 这会断开原有响应式绑定

// 正确做法
import { toRefs } from 'vue'
const { count: countRef } = toRefs(state)  // 使用 toRefs
countRef.value++  // state.count 同步更新

// 或者统一用 ref
const count2 = ref(0)
count2.value++  // 正确
```
:::

## 四、响应式数据与 TypeScript

::: details TypeScript 类型标注示例

```ts
import { ref, reactive, computed } from 'vue'

interface Product {
  id: number
  name: string
  price: number
  stock: number
}

interface CartState {
  items: Product[]
  couponCode: string
}

// ref 的类型标注
const selectedProduct = ref<Product | null>(null)
const quantity = ref<number>(1)

// reactive 的类型标注
const cart = reactive<CartState>({
  items: [],
  couponCode: ''
})

// computed 自动推断类型
const totalPrice = computed(() =>
  cart.items.reduce((sum, item) => sum + item.price, 0)
)
// totalPrice 类型自动推断为 ComputedRef<number>

// 函数参数使用 Ref 类型
import type { Ref } from 'vue'

function useProductDetail(productId: Ref<number>) {
  const detail = ref<Product | null>(null)
  // ...
  return { detail }
}
```
:::
