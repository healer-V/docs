---
title: "Vue 3 高级特性"
category: "前端 · Vue 3"
tags:
  - Vue
excerpt: "Vue 3 高级特性包括 Teleport 传送门、Suspense 异步处理、异步组件懒加载、KeepAlive 缓存、Transition 动画，以及性能优化策略，帮助你构建高质量的 Vue 应用。"
date: 2026-03-17
---

# Vue 3 高级特性

Vue 3 提供了一系列内置高级特性，帮助你处理复杂的应用场景：将组件渲染到任意 DOM 位置（Teleport）、优雅处理异步加载（Suspense）、缓存组件状态（KeepAlive）、以及系统级的性能优化。

## 一、Teleport 传送门

### 1. 基本用法

`<Teleport>` 将组件的 HTML 内容渲染到指定的 DOM 节点，而不是组件所在的位置。常用于模态框、通知、下拉菜单等需要脱离父组件样式限制的场景。

::: details Teleport 模态框示例

```vue
<!-- src/components/ConfirmDialog.vue -->
<script setup>
const props = defineProps({
  visible: Boolean,
  title: { type: String, default: '提示' },
  message: String
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])
</script>

<template>
  <!-- 将对话框渲染到 body 下，避免被父元素的 overflow:hidden 或 z-index 影响 -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="visible" class="modal-backdrop" @click.self="emit('update:visible', false)">
        <div class="modal-dialog" role="dialog" :aria-label="title">
          <header class="modal-header">
            <h3>{{ title }}</h3>
            <button @click="emit('update:visible', false)" aria-label="关闭">×</button>
          </header>
          <div class="modal-body">
            <p>{{ message }}</p>
          </div>
          <footer class="modal-footer">
            <button @click="emit('cancel')">取消</button>
            <button class="btn-primary" @click="emit('confirm')">确认</button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
```
:::

### 2. 多个 Teleport 共享目标

多个 `Teleport` 可以挂载到同一目标，按顺序追加：

::: details 通知系统示例

```vue
<!-- src/components/NotificationContainer.vue -->
<template>
  <!-- 所有通知都渲染到 #notification-root -->
  <Teleport v-for="notification in notifications" :key="notification.id" to="#notification-root">
    <div :class="`notification notification-${notification.type}`">
      {{ notification.message }}
    </div>
  </Teleport>
</template>
```

```html
<!-- index.html：提供挂载目标 -->
<body>
  <div id="app"></div>
  <div id="notification-root"></div>
</body>
```
:::

::: tip Teleport 的 disabled 属性
`<Teleport :disabled="isMobile">` 可动态禁用传送，`disabled` 为 `true` 时组件在原位置渲染。
:::

## 二、Suspense 异步组件

### 1. 基本用法

`<Suspense>` 用于处理异步依赖，在异步内容加载完成前显示 fallback 内容：

::: details Suspense 基础示例

```vue
<!-- src/App.vue -->
<template>
  <Suspense>
    <!-- 主内容（可以是异步组件或包含 async setup 的组件） -->
    <template #default>
      <AsyncDashboard />
    </template>

    <!-- 加载中的 fallback -->
    <template #fallback>
      <div class="loading-screen">
        <Spinner />
        <p>加载中，请稍候...</p>
      </div>
    </template>
  </Suspense>
</template>
```

```vue
<!-- src/views/AsyncDashboard.vue - 异步 setup -->
<script setup>
// setup 函数可以是 async 的，Suspense 会等待其完成
const [userData, statsData] = await Promise.all([
  fetch('/api/user').then(r => r.json()),
  fetch('/api/stats').then(r => r.json())
])
</script>

<template>
  <div class="dashboard">
    <UserProfile :user="userData" />
    <StatsPanel :stats="statsData" />
  </div>
</template>
```
:::

### 2. 错误处理

::: details Suspense + 错误边界示例

```vue
<script setup>
import { ref, onErrorCaptured } from 'vue'

const error = ref(null)

// 捕获子组件（包括异步组件）的错误
onErrorCaptured((err) => {
  error.value = err.message
  return false  // 阻止错误继续传播
})
</script>

<template>
  <div v-if="error" class="error-boundary">
    <h3>加载失败</h3>
    <p>{{ error }}</p>
    <button @click="error = null; $forceUpdate()">重试</button>
  </div>

  <Suspense v-else>
    <template #default>
      <AsyncContent />
    </template>
    <template #fallback>
      <LoadingSkeleton />
    </template>
  </Suspense>
</template>
```
:::

## 三、异步组件

### 1. defineAsyncComponent

::: details 异步组件完整示例

```js
// src/router/index.js 或组件内使用
import { defineAsyncComponent } from 'vue'

// 基础用法
const RichTextEditor = defineAsyncComponent(
  () => import('@/components/RichTextEditor.vue')
)

// 完整配置：加载状态、错误处理、超时
const HeavyChart = defineAsyncComponent({
  loader: () => import('@/components/HeavyChart.vue'),

  // 加载中显示的组件
  loadingComponent: () => import('@/components/ChartSkeleton.vue'),
  delay: 200,  // 延迟 200ms 显示 loadingComponent（避免闪烁）

  // 加载失败显示的组件
  errorComponent: () => import('@/components/LoadError.vue'),
  timeout: 10000,  // 超时时间（ms），超时后显示 errorComponent

  // 错误回调
  onError(error, retry, fail, attempts) {
    if (attempts <= 3) {
      retry()  // 最多重试 3 次
    } else {
      fail()
    }
  }
})
```

```vue
<template>
  <!-- 在 Suspense 中使用异步组件 -->
  <Suspense>
    <template #default>
      <HeavyChart :data="chartData" />
    </template>
    <template #fallback>
      <p>图表加载中...</p>
    </template>
  </Suspense>
</template>
```
:::

## 四、KeepAlive 组件缓存

### 1. 基本缓存

::: details KeepAlive 示例

```vue
<!-- src/views/TabsLayout.vue -->
<script setup>
import { ref, shallowRef } from 'vue'
import SearchView from './SearchView.vue'
import FavoritesView from './FavoritesView.vue'
import HistoryView from './HistoryView.vue'

const activeTab = shallowRef('search')

const tabs = {
  search: SearchView,
  favorites: FavoritesView,
  history: HistoryView
}
</script>

<template>
  <nav>
    <button
      v-for="(_, key) in tabs"
      :key="key"
      :class="{ active: activeTab === key }"
      @click="activeTab = key"
    >
      {{ key }}
    </button>
  </nav>

  <!-- include：指定缓存哪些组件（组件 name）-->
  <!-- exclude：指定不缓存哪些组件 -->
  <!-- max：最多缓存几个组件实例（LRU 策略） -->
  <KeepAlive :max="5" :include="['SearchView', 'FavoritesView']">
    <component :is="tabs[activeTab]" />
  </KeepAlive>
</template>
```
:::

### 2. 缓存生命周期

::: details onActivated / onDeactivated 示例

```vue
<!-- 被 KeepAlive 缓存的组件内 -->
<script setup>
import { onActivated, onDeactivated, ref } from 'vue'

const refreshTimer = ref(null)

// 组件被激活（从缓存中恢复）时触发
onActivated(() => {
  console.log('组件被激活，开始刷新数据')
  // 重新获取最新数据
  fetchLatestData()
  // 启动定时刷新
  refreshTimer.value = setInterval(fetchLatestData, 30000)
})

// 组件被缓存（切换离开）时触发
onDeactivated(() => {
  console.log('组件进入缓存，暂停刷新')
  clearInterval(refreshTimer.value)
})
</script>
```
:::

## 五、Transition 过渡动画

### 1. 单元素过渡

::: details Transition 完整示例

```vue
<script setup>
import { ref } from 'vue'
const isVisible = ref(true)
</script>

<template>
  <button @click="isVisible = !isVisible">切换</button>

  <Transition name="slide-fade" mode="out-in">
    <div v-if="isVisible" key="content" class="content-box">
      内容区域
    </div>
  </Transition>
</template>

<style scoped>
/* 进入和离开的过渡 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}
</style>
```
:::

### 2. 列表过渡

::: details TransitionGroup 示例

```vue
<script setup>
import { ref } from 'vue'

const items = ref([
  { id: 1, text: '任务一' },
  { id: 2, text: '任务二' },
  { id: 3, text: '任务三' }
])

let nextId = 4

function addItem() {
  items.value.push({ id: nextId++, text: `任务${nextId - 1}` })
}

function removeItem(id) {
  items.value = items.value.filter(i => i.id !== id)
}
</script>

<template>
  <button @click="addItem">添加任务</button>

  <TransitionGroup name="list" tag="ul">
    <li v-for="item in items" :key="item.id">
      {{ item.text }}
      <button @click="removeItem(item.id)">删除</button>
    </li>
  </TransitionGroup>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 移动过渡（其他元素位置变化的动画） */
.list-move {
  transition: transform 0.4s ease;
}

/* 离开时脱离文档流，避免影响其他元素位置 */
.list-leave-active {
  position: absolute;
}
</style>
```
:::

## 六、性能优化

### 1. v-once 与 v-memo

::: details 静态内容优化示例

```vue
<template>
  <!-- v-once：只渲染一次，后续数据变化不更新此节点 -->
  <header v-once>
    <h1>{{ siteTitle }}</h1>  <!-- siteTitle 不会变化，只需渲染一次 -->
  </header>

  <!-- v-memo：当依赖值不变时跳过此子树的更新 -->
  <div v-for="item in largeList" :key="item.id" v-memo="[item.id, item.isSelected]">
    <!-- 只有 item.id 或 item.isSelected 变化时才重新渲染 -->
    <ExpensiveItemComponent :item="item" />
  </div>
</template>
```
:::

### 2. 虚拟列表

大数据列表渲染建议使用虚拟列表库，只渲染可视区域内的 DOM 节点：

::: details 使用 vue-virtual-scroller 示例

```bash
npm install vue-virtual-scroller
```

```vue
<script setup>
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { ref } from 'vue'

// 10000 条数据只渲染可视区域的 ~20 条
const items = ref(Array.from({ length: 10000 }, (_, i) => ({
  id: i + 1,
  name: `用户 ${i + 1}`,
  email: `user${i + 1}@example.com`
})))
</script>

<template>
  <RecycleScroller
    class="scroller"
    :items="items"
    :item-size="60"
    key-field="id"
    v-slot="{ item }"
  >
    <div class="user-row">
      <span>{{ item.name }}</span>
      <span>{{ item.email }}</span>
    </div>
  </RecycleScroller>
</template>

<style scoped>
.scroller {
  height: 600px;
}
</style>
```
:::

### 3. 计算属性与 watchEffect 优化

::: details 性能优化建议

```vue
<script setup>
import { ref, computed, shallowRef } from 'vue'

// 优化1：大数组用 shallowRef，避免深层响应式代理开销
const tableData = shallowRef([])

// 优化2：对开销较大的计算用 computed（自动缓存）
const processedData = computed(() => {
  return tableData.value
    .filter(row => row.isActive)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 100)
})

// 优化3：避免在模板中直接调用方法（每次渲染都执行）
// 错误：<div>{{ formatDate(row.createdAt) }}</div>  每次渲染都调用
// 正确：在 computed 或数据预处理时格式化

// 优化4：组件级别懒加载
const HeavyModal = defineAsyncComponent(() => import('./HeavyModal.vue'))
</script>
```
:::

### 4. 性能优化清单

| 优化手段 | 适用场景 | 效果 |
|----------|---------|------|
| `v-once` | 静态内容渲染 | 跳过后续更新 |
| `v-memo` | 大列表局部更新 | 跳过未变化子树 |
| `shallowRef/shallowReactive` | 大型数据对象 | 减少响应式代理开销 |
| `KeepAlive` | 频繁切换的组件 | 避免重复创建销毁 |
| 虚拟列表 | 万级以上列表数据 | DOM 节点数量恒定 |
| 异步组件 | 路由级、条件渲染的重型组件 | 按需加载，减少首屏体积 |
| `computed` 代替方法 | 模板中的计算表达式 | 依赖不变时缓存结果 |
| `Transition` 的 `mode="out-in"` | 路由/组件切换动画 | 避免新旧组件同时存在 |

::: warning 过度优化的陷阱
不要在没有性能问题时提前优化。先用 Chrome DevTools 的 Performance 面板或 Vue DevTools 定位真正的性能瓶颈，再针对性地采用优化手段，避免代码复杂度上升而收益甚微。
:::
