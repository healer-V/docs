---
title: "Vue 3 插槽"
category: "前端 · Vue 3"
tags:
  - Vue
excerpt: "插槽是 Vue 组件内容分发的核心机制，本文详解默认插槽、具名插槽、作用域插槽的用法，以及动态插槽名和插槽的实际应用场景。"
date: 2026-03-17
---

# Vue 3 插槽

插槽（Slot）是 Vue 的内容分发机制，允许父组件向子组件模板的特定位置传递内容，实现高度灵活的组件复用。

## 一、默认插槽

### 1. 基本用法

子组件用 `<slot>` 标签定义内容插入点，父组件在组件标签内放置的内容会替换 `<slot>`：

::: details 默认插槽示例

```vue
<!-- src/components/BaseCard.vue -->
<template>
  <div class="base-card">
    <div class="card-body">
      <slot />  <!-- 父组件传入的内容渲染在此处 -->
    </div>
  </div>
</template>

<style scoped>
.base-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
</style>
```

```vue
<!-- 父组件使用 -->
<template>
  <BaseCard>
    <!-- 这段内容被分发到 BaseCard 的 <slot> 位置 -->
    <h3>订单详情</h3>
    <p>订单号：#20260317001</p>
    <p>金额：¥299.00</p>
  </BaseCard>
</template>
```
:::

### 2. 插槽默认内容

`<slot>` 标签内可以放置默认内容，当父组件没有传入内容时显示：

::: details 插槽默认内容示例

```vue
<!-- src/components/AlertBox.vue -->
<template>
  <div class="alert-box" :class="`alert-${type}`">
    <slot>
      <!-- 默认内容：父组件不传入时显示 -->
      <p>暂无提示信息</p>
    </slot>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'info',
    validator: v => ['info', 'success', 'warning', 'error'].includes(v)
  }
})
</script>
```

```vue
<template>
  <!-- 使用默认内容 -->
  <AlertBox type="info" />

  <!-- 覆盖默认内容 -->
  <AlertBox type="warning">
    <strong>注意：</strong>你的会话即将过期，请保存当前工作。
  </AlertBox>
</template>
```
:::

## 二、具名插槽

### 1. 定义与使用具名插槽

当组件需要多个插入点时，使用 `name` 属性区分：

::: details 具名插槽示例

```vue
<!-- src/components/PageLayout.vue -->
<template>
  <div class="page-layout">
    <header class="page-header">
      <slot name="header">
        <h1>默认页面标题</h1>
      </slot>
    </header>

    <aside class="page-sidebar">
      <slot name="sidebar" />
    </aside>

    <main class="page-content">
      <slot />  <!-- 未命名的默认插槽，等同于 name="default" -->
    </main>

    <footer class="page-footer">
      <slot name="footer">
        <p>© 2026 MyApp</p>
      </slot>
    </footer>
  </div>
</template>
```

```vue
<!-- 父组件使用具名插槽 -->
<template>
  <PageLayout>
    <!-- 使用 v-slot:name 或简写 #name -->
    <template #header>
      <h1>用户管理</h1>
      <p class="subtitle">管理系统中的所有用户账户</p>
    </template>

    <template #sidebar>
      <nav>
        <a href="/users">用户列表</a>
        <a href="/roles">角色管理</a>
      </nav>
    </template>

    <!-- 默认插槽内容 -->
    <UserTable :users="users" />

    <template #footer>
      <p>共 {{ users.length }} 位用户</p>
    </template>
  </PageLayout>
</template>
```
:::

### 2. 动态插槽名

插槽名称可以动态绑定，适用于根据条件渲染不同插槽的场景：

::: details 动态插槽名示例

```vue
<script setup>
import { ref } from 'vue'

const activeSection = ref('content')
</script>

<template>
  <PageLayout>
    <template #[activeSection]>
      <!-- 动态渲染到对应名称的插槽 -->
      <DynamicContent />
    </template>
  </PageLayout>
</template>
```
:::

## 三、作用域插槽

### 1. 基本概念

作用域插槽允许子组件向父组件的插槽内容传递数据，实现"子组件提供数据，父组件决定渲染方式"的模式：

::: details 作用域插槽基础示例

```vue
<!-- src/components/DataTable.vue -->
<script setup>
defineProps({
  rows: {
    type: Array,
    required: true
  },
  columns: {
    type: Array,
    required: true
  }
})
</script>

<template>
  <table>
    <thead>
      <tr>
        <th v-for="col in columns" :key="col.key">{{ col.title }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row.id">
        <td v-for="col in columns" :key="col.key">
          <!-- 将行数据和列定义传给父组件的插槽 -->
          <slot name="cell" :row="row" :column="col" :value="row[col.key]">
            {{ row[col.key] }}  <!-- 默认渲染 -->
          </slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>
```

```vue
<!-- 父组件自定义单元格渲染 -->
<script setup>
import { ref } from 'vue'
import DataTable from '@/components/DataTable.vue'

const columns = [
  { key: 'name', title: '用户名' },
  { key: 'status', title: '状态' },
  { key: 'role', title: '角色' },
  { key: 'actions', title: '操作' }
]

const users = ref([
  { id: 1, name: 'Alice', status: 'active', role: 'admin' },
  { id: 2, name: 'Bob', status: 'inactive', role: 'user' }
])
</script>

<template>
  <DataTable :rows="users" :columns="columns">
    <!-- 通过 v-slot 接收子组件传来的数据 -->
    <template #cell="{ row, column, value }">
      <!-- 状态列自定义渲染 -->
      <span v-if="column.key === 'status'"
        :class="value === 'active' ? 'badge-green' : 'badge-gray'">
        {{ value === 'active' ? '活跃' : '已禁用' }}
      </span>

      <!-- 操作列自定义渲染 -->
      <div v-else-if="column.key === 'actions'">
        <button @click="editUser(row)">编辑</button>
        <button @click="deleteUser(row.id)">删除</button>
      </div>

      <!-- 其他列默认渲染 -->
      <span v-else>{{ value }}</span>
    </template>
  </DataTable>
</template>
```
:::

### 2. 默认插槽的作用域写法

::: details 默认作用域插槽示例

```vue
<!-- src/components/InfiniteList.vue -->
<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  fetchFn: { type: Function, required: true }
})

const items = ref([])
const isLoading = ref(false)
const hasMore = ref(true)

async function loadMore() {
  if (isLoading.value || !hasMore.value) return
  isLoading.value = true
  const newItems = await props.fetchFn(items.value.length)
  items.value.push(...newItems)
  hasMore.value = newItems.length > 0
  isLoading.value = false
}

onMounted(loadMore)
</script>

<template>
  <div class="infinite-list">
    <!-- 将每条数据暴露给父组件 -->
    <slot v-for="item in items" :key="item.id" :item="item" />

    <div v-if="isLoading">加载中...</div>
    <button v-if="hasMore && !isLoading" @click="loadMore">加载更多</button>
  </div>
</template>
```

```vue
<!-- 父组件决定每项如何渲染 -->
<template>
  <InfiniteList :fetch-fn="fetchArticles">
    <template #default="{ item }">
      <article class="article-item">
        <h3>{{ item.title }}</h3>
        <p>{{ item.summary }}</p>
        <time>{{ item.publishedAt }}</time>
      </article>
    </template>
  </InfiniteList>
</template>
```
:::

## 四、实际应用场景

### 1. 封装模态框组件

::: details 模态框插槽设计示例

```vue
<!-- src/components/BaseModal.vue -->
<script setup>
const props = defineProps({
  title: String,
  visible: Boolean,
  width: { type: String, default: '480px' }
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

function handleClose() {
  emit('update:visible', false)
  emit('cancel')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="handleClose">
      <div class="modal-container" :style="{ width }">
        <!-- 头部插槽 -->
        <header class="modal-header">
          <slot name="title">
            <h3>{{ title }}</h3>
          </slot>
          <button class="modal-close" @click="handleClose">×</button>
        </header>

        <!-- 主体插槽 -->
        <div class="modal-body">
          <slot />
        </div>

        <!-- 底部插槽，默认提供确认/取消按钮 -->
        <footer class="modal-footer">
          <slot name="footer">
            <button @click="handleClose">取消</button>
            <button class="btn-primary" @click="emit('confirm')">确认</button>
          </slot>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
```

```vue
<!-- 使用模态框 -->
<script setup>
import { ref } from 'vue'

const showModal = ref(false)
</script>

<template>
  <button @click="showModal = true">删除账户</button>

  <BaseModal
    v-model:visible="showModal"
    title="确认删除"
    @confirm="handleDeleteAccount"
  >
    <p>此操作不可逆，确定要删除你的账户吗？</p>
    <p class="text-danger">删除后所有数据将永久清除。</p>

    <!-- 自定义底部按钮 -->
    <template #footer>
      <button @click="showModal = false">我再想想</button>
      <button class="btn-danger" @click="handleDeleteAccount">确认删除</button>
    </template>
  </BaseModal>
</template>
```
:::

### 2. 无渲染组件（Renderless Component）

::: details 无渲染组件模式

```vue
<!-- src/components/MouseTracker.vue - 只提供数据，不渲染 UI -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const x = ref(0)
const y = ref(0)

function updatePosition(e) {
  x.value = e.clientX
  y.value = e.clientY
}

onMounted(() => window.addEventListener('mousemove', updatePosition))
onUnmounted(() => window.removeEventListener('mousemove', updatePosition))
</script>

<template>
  <!-- 将鼠标坐标通过作用域插槽传给父组件 -->
  <slot :x="x" :y="y" />
</template>
```

```vue
<!-- 父组件完全掌控 UI 渲染 -->
<template>
  <MouseTracker v-slot="{ x, y }">
    <div class="cursor-info">
      鼠标位置：({{ x }}, {{ y }})
    </div>
  </MouseTracker>
</template>
```
:::

::: tip 无渲染组件 vs Composable
Vue 3 中，无渲染组件的逻辑复用场景大多可以用 Composable 函数替代，代码更简洁。无渲染组件更适合需要在模板中进行状态共享且逻辑与视图耦合较紧的场景。
:::
