---
title: "4.4 路由守卫"
category: "前端 · Vue 2"
tags:
  - Vue
excerpt: "路由守卫用于在导航过程中进行控制，可以在路由跳转前后执行逻辑。 全局守卫：beforeEach、afterEach 路由独享：beforeEnter 组件内：beforeRouteEnter、beforeRouteUpdate、before..."
---

# 4.4 路由守卫

路由守卫用于在导航过程中进行控制，可以在路由跳转前后执行逻辑。

## 4.4.1 全局前置守卫

```javascript
// router/index.js
router.beforeEach((to, from, next) => {
  // 检查登录状态
  if (to.meta.requiresAuth && !isLoggedIn()) {
    next('/login')
  } else {
    next()
  }
})
```

## 4.4.2 全局后置钩子

```javascript
router.afterEach((to, from) => {
  // 页面标题
  document.title = to.meta.title || '默认标题'
})
```

## 路由独享守卫

```javascript
{
  path: '/user/:id',
  component: User,
  beforeEnter: (to, from, next) => {
    // 路由独享的守卫
    if (checkPermission()) {
      next()
    } else {
      next('/403')
    }
  }
}
```

## 4.4.4 组件内守卫

```vue
<script>
export default {
  beforeRouteEnter(to, from, next) {
    // 进入前
    next()
  },
  beforeRouteUpdate(to, from, next) {
    // 路由更新时（同一组件）
    next()
  },
  beforeRouteLeave(to, from, next) {
    // 离开前
    if (confirm('确定离开？')) {
      next()
    } else {
      next(false)
    }
  }
}
</script>
```

## 4.4.5 权限控制示例

```javascript
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.meta.requiresAuth) {
    if (token) {
      next()
    } else {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
  } else {
    next()
  }
})
```

## 4.4.6 总结

- 全局守卫：beforeEach、afterEach
- 路由独享：beforeEnter
- 组件内：beforeRouteEnter、beforeRouteUpdate、beforeRouteLeave
- 用于权限控制、页面标题设置等
