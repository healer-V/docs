# 4.1 路由基础与配置

Vue Router 是 Vue.js 官方的路由管理器，用于构建单页应用。

## 4.1.1 安装

```bash
npm install vue-router@3
```

## 4.1.2 基本配置

```javascript
// router/index.js
import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '@/views/Home.vue'
import About from '@/views/About.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: About
  }
]

const router = new VueRouter({
  mode: 'history',
  routes
})

export default router
```

```javascript
// main.js
import Vue from 'vue'
import App from './App.vue'
import router from './router'

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
```

## 4.1.3 router-view 和 router-link

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <nav>
      <router-link to="/">首页</router-link>
      <router-link to="/about">关于</router-link>
    </nav>
    <router-view></router-view>
  </div>
</template>
```

## 4.1.4 路由模式

### 4.1.4.1 hash 模式（默认）

```javascript
const router = new VueRouter({
  mode: 'hash',  // URL 中有 # 号
  routes
})
```

### history 模式

```javascript
const router = new VueRouter({
  mode: 'history',  // 需要服务器配置支持
  routes
})
```

## 4.1.5 路由配置选项

```javascript
{
  path: '/user/:id',      // 路径
  name: 'User',           // 命名路由
  component: User,        // 组件
  components: {},         // 命名视图
  redirect: '/home',      // 重定向
  alias: '/u',            // 别名
  meta: {},               // 元信息
  props: true,           // 将路由参数作为 props
  beforeEnter: () => {}  // 路由守卫
}
```

## 4.1.6 总结

- Vue Router 用于构建单页应用
- 配置路由表，使用 router-view 和 router-link
- 支持 hash 和 history 模式
- 提供丰富的路由配置选项
