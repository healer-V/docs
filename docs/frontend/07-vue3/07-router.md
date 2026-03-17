---
title: "Vue 3 路由管理"
category: "前端 · Vue 3"
tags:
  - Vue
  - Vue Router
excerpt: "Vue Router 4 是 Vue 3 的官方路由库，本文讲解路由配置、动态路由、嵌套路由、导航守卫、路由懒加载等核心功能，帮助你构建完整的单页应用路由体系。"
date: 2026-03-17
---

# Vue 3 路由管理

Vue Router 4 是 Vue 3 的官方路由管理库，提供客户端路由功能，支持 History 和 Hash 两种模式，配合导航守卫实现权限控制和路由鉴权。

## 一、安装与基本配置

### 1. 安装

```bash
npm install vue-router@4
```

### 2. 路由配置

::: details 路由配置示例

```js{8,15,22}
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

// 路由懒加载：只有访问该路由时才加载对应组件
const routes = [
  {
    path: '/',
    redirect: '/dashboard'   // 根路径重定向
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: '仪表盘', requiresAuth: true }
  },
  {
    path: '/users',
    name: 'UserList',
    component: () => import('@/views/UserListView.vue'),
    meta: { title: '用户管理', requiresAuth: true, permission: 'user:read' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录', guest: true }
  },
  {
    // 404 页面：匹配所有未定义路由
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 滚动行为：切换路由时滚动到顶部
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition  // 后退时恢复滚动位置
    }
    return { top: 0 }
  }
})

export default router
```
:::

### 3. 注册路由插件

```js
// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
```

## 二、路由跳转

### 1. RouterLink 声明式导航

::: details RouterLink 示例

```vue
<template>
  <nav>
    <!-- 基本跳转 -->
    <RouterLink to="/dashboard">仪表盘</RouterLink>

    <!-- 命名路由 -->
    <RouterLink :to="{ name: 'UserList' }">用户管理</RouterLink>

    <!-- 带参数 -->
    <RouterLink :to="{ name: 'UserDetail', params: { id: 123 } }">
      用户详情
    </RouterLink>

    <!-- 带查询参数 -->
    <RouterLink :to="{ path: '/search', query: { keyword: 'vue', page: 1 } }">
      搜索结果
    </RouterLink>

    <!-- active-class：激活时添加的类名 -->
    <RouterLink to="/settings" active-class="nav-active" exact-active-class="nav-exact">
      设置
    </RouterLink>
  </nav>

  <!-- 路由出口 -->
  <RouterView />
</template>
```
:::

### 2. useRouter 编程式导航

::: details 编程式导航示例

```vue
<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()  // 当前路由信息（响应式）

// 跳转到新路由
function goToDashboard() {
  router.push('/dashboard')
}

// 带参数跳转
function viewUserDetail(userId) {
  router.push({ name: 'UserDetail', params: { id: userId } })
}

// 带查询参数跳转
function searchProducts(keyword) {
  router.push({ path: '/search', query: { keyword, page: 1 } })
}

// 替换当前路由（不产生历史记录）
function replaceRoute() {
  router.replace('/login')
}

// 前进/后退
function goBack() {
  router.back()    // 等同于 router.go(-1)
}

// 读取当前路由参数
console.log(route.params.id)      // 路由参数
console.log(route.query.keyword)  // 查询参数
console.log(route.meta.title)     // 路由元数据
</script>
```
:::

## 三、动态路由

### 1. 路由参数

::: details 动态路由参数示例

```js
// 路由配置
{
  path: '/users/:userId',
  name: 'UserDetail',
  component: () => import('@/views/UserDetailView.vue')
},
{
  // 多段动态参数
  path: '/teams/:teamId/members/:memberId',
  name: 'MemberDetail',
  component: () => import('@/views/MemberDetailView.vue')
},
{
  // 可选参数
  path: '/articles/:articleId/:slug?',
  name: 'ArticleDetail',
  component: () => import('@/views/ArticleView.vue')
}
```

```vue
<!-- src/views/UserDetailView.vue -->
<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const user = ref(null)

// 监听路由参数变化（同一组件复用时触发）
watch(
  () => route.params.userId,
  async (userId) => {
    if (userId) {
      user.value = await fetchUser(userId)
    }
  },
  { immediate: true }
)
</script>

<template>
  <div v-if="user">
    <h1>{{ user.name }}</h1>
    <p>ID: {{ route.params.userId }}</p>
  </div>
</template>
```
:::

### 2. 嵌套路由

::: details 嵌套路由配置示例

```js
// 嵌套路由配置
{
  path: '/settings',
  name: 'Settings',
  component: () => import('@/views/SettingsView.vue'),
  redirect: '/settings/profile',  // 默认跳转到子路由
  children: [
    {
      path: 'profile',
      name: 'SettingsProfile',
      component: () => import('@/views/settings/ProfileView.vue')
    },
    {
      path: 'security',
      name: 'SettingsSecurity',
      component: () => import('@/views/settings/SecurityView.vue')
    },
    {
      path: 'notifications',
      name: 'SettingsNotifications',
      component: () => import('@/views/settings/NotificationsView.vue')
    }
  ]
}
```

```vue
<!-- src/views/SettingsView.vue：父路由组件需要包含 RouterView -->
<template>
  <div class="settings-layout">
    <aside class="settings-nav">
      <RouterLink to="/settings/profile">个人资料</RouterLink>
      <RouterLink to="/settings/security">安全设置</RouterLink>
      <RouterLink to="/settings/notifications">通知设置</RouterLink>
    </aside>
    <main>
      <RouterView />  <!-- 子路由渲染在此 -->
    </main>
  </div>
</template>
```
:::

## 四、导航守卫

### 1. 全局前置守卫

::: details 全局导航守卫示例

```js{4,12,20}
// src/router/guards.js
import router from './index'
import { useUserStore } from '@/stores/user'

// 全局前置守卫（每次路由跳转前执行）
router.beforeEach(async (to, from) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - MyApp` : 'MyApp'

  const userStore = useUserStore()

  // 需要登录但未认证：重定向到登录页
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return {
      name: 'Login',
      query: { redirect: to.fullPath }  // 记录原目标路由，登录后跳回
    }
  }

  // 已登录用户访问登录页：重定向到首页
  if (to.meta.guest && userStore.isLoggedIn) {
    return { name: 'Dashboard' }
  }

  // 权限检查
  if (to.meta.permission && !userStore.hasPermission(to.meta.permission)) {
    return { name: 'Forbidden' }
  }
})

// 全局后置守卫（路由跳转完成后执行，不影响导航）
router.afterEach((to, from) => {
  // 上报页面访问统计
  analytics.pageView(to.fullPath)
})
```
:::

### 2. 路由独享守卫

::: details 路由级守卫示例

```js
{
  path: '/admin',
  name: 'Admin',
  component: () => import('@/views/AdminView.vue'),
  beforeEnter(to, from) {
    // 仅针对此路由的守卫
    const userStore = useUserStore()
    if (!userStore.isAdmin) {
      return { name: 'Forbidden' }
    }
  }
}
```
:::

### 3. 组件内守卫

::: details 组件内导航守卫示例

```vue
<script setup>
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { ref } from 'vue'

const hasUnsavedChanges = ref(false)

// 离开当前路由前触发
onBeforeRouteLeave((to, from) => {
  if (hasUnsavedChanges.value) {
    const confirmed = window.confirm('有未保存的更改，确定要离开吗？')
    if (!confirmed) return false  // 阻止导航
  }
})

// 路由参数变化时触发（组件复用场景）
onBeforeRouteUpdate(async (to, from) => {
  // to.params.id 变化，重新加载数据
  await loadData(to.params.id)
})
</script>
```
:::

## 五、路由元数据与过渡动画

### 1. 路由过渡动画

::: details 路由过渡动画示例

```vue
<!-- src/App.vue -->
<template>
  <RouterView v-slot="{ Component, route }">
    <Transition
      :name="route.meta.transition || 'fade'"
      mode="out-in"
    >
      <component :is="Component" :key="route.path" />
    </Transition>
  </RouterView>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-leave-to {
  transform: translateX(-100%);
}
</style>
```
:::

### 2. 路由懒加载与分包

::: details 路由分包示例

```js
// 使用 webpackChunkName（Webpack）或 vite 的自动分包
const routes = [
  {
    path: '/dashboard',
    component: () => import(/* webpackChunkName: "dashboard" */ '@/views/DashboardView.vue')
  },
  {
    // 按功能模块分组，同一 chunk 内的路由共享一个包
    path: '/admin/users',
    component: () => import(/* webpackChunkName: "admin" */ '@/views/admin/UserManage.vue')
  },
  {
    path: '/admin/settings',
    component: () => import(/* webpackChunkName: "admin" */ '@/views/admin/SystemSettings.vue')
  }
]
```
:::

## 六、useRouter 与 useRoute 常用操作

::: details 常用路由操作速查

```vue
<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

// 当前路径
const currentPath = computed(() => route.path)

// 获取查询参数（自动类型转换需手动处理）
const page = computed(() => Number(route.query.page) || 1)
const keyword = computed(() => String(route.query.keyword || ''))

// 更新查询参数（不产生新的历史记录）
function updateFilter(newQuery) {
  router.replace({
    query: { ...route.query, ...newQuery }
  })
}

// 带参数的命名路由跳转
function navigateToOrder(orderId) {
  router.push({ name: 'OrderDetail', params: { orderId } })
}

// 登录后跳回原路由
function handleLoginSuccess() {
  const redirect = route.query.redirect as string
  router.push(redirect || '/dashboard')
}
</script>
```
:::

::: tip History 模式与 Hash 模式
- `createWebHistory()`：使用 HTML5 History API，URL 更简洁（如 `/users/123`），需服务器配置所有路径返回 `index.html`
- `createWebHashHistory()`：URL 带 `#`（如 `/#/users/123`），无需服务器配置，适合静态部署
- `createMemoryHistory()`：用于 SSR 或测试环境，不依赖浏览器 URL
:::
