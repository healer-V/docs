---
title: "4.5 路由懒加载与路由元信息"
category: "前端 · Vue 2"
tags:
  - Vue
excerpt: "路由懒加载可以按需加载组件，提高性能 使用 import() 实现懒加载 路由元信息用于存储路由相关的数据 在路由守卫和组件中都可以访问元信息"
---

# 4.5 路由懒加载与路由元信息

## 4.5.1 路由懒加载

### 4.5.1.1 基本用法

```javascript
// 方式1：使用 import()
const Home = () => import('@/views/Home.vue')

// 方式2：直接使用
{
  path: '/home',
  component: () => import('@/views/Home.vue')
}
```

### 4.5.1.2 分组打包

```javascript
{
  path: '/user',
  component: () => import(/* webpackChunkName: "user" */ '@/views/User.vue')
}
```

## 4.5.2 路由元信息

### 4.5.2.1 定义元信息

```javascript
{
  path: '/admin',
  component: Admin,
  meta: {
    requiresAuth: true,
    title: '管理后台',
    roles: ['admin']
  }
}
```

### 4.5.2.2 使用元信息

```javascript
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    // 需要认证
  }
  
  document.title = to.meta.title || '默认标题'
  next()
})
```

```vue
<script>
export default {
  mounted() {
    console.log(this.$route.meta)
  }
}
</script>
```

## 4.5.3 总结

- 路由懒加载可以按需加载组件，提高性能
- 使用 `import()` 实现懒加载
- 路由元信息用于存储路由相关的数据
- 在路由守卫和组件中都可以访问元信息
