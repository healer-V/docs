---
title: "6.3 权限控制实现"
category: "前端 · Vue 2"
tags:
  - Vue
excerpt: "根据用户权限动态生成菜单，只显示有权限访问的菜单项。 权限控制是后台管理系统的重要组成部分，需要在前端和后端都进行权限验证。"
---

# 6.3 权限控制实现

## 6.3.1 路由权限控制

### 6.3.1.1 路由元信息

```javascript
// router/index.js
{
  path: '/admin',
  component: Admin,
  meta: {
    requiresAuth: true,
    roles: ['admin']
  }
}
```

### 6.3.1.2 路由守卫

```javascript
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.meta.requiresAuth) {
    if (!token) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    // 检查角色权限
    if (to.meta.roles) {
      const userRoles = getUserRoles()
      const hasRole = to.meta.roles.some(role => userRoles.includes(role))
      if (!hasRole) {
        next('/403')
        return
      }
    }
  }
  
  next()
})
```

## 6.3.2 按钮权限控制

### 6.3.2.1 自定义指令

```javascript
// directives/permission.js
Vue.directive('permission', {
  inserted(el, binding) {
    const { value } = binding
    const permissions = getPermissions()
    
    if (value && !permissions.includes(value)) {
      el.parentNode && el.parentNode.removeChild(el)
    }
  }
})
```

### 6.3.2.2 使用指令

```vue
<template>
  <button v-permission="'user:create'">创建用户</button>
  <button v-permission="'user:delete'">删除用户</button>
</template>
```

## 6.3.3 菜单权限控制

::: tip 菜单权限
根据用户权限动态生成菜单，只显示有权限访问的菜单项。
:::

## 6.3.4 总结

::: tip 总结
权限控制是后台管理系统的重要组成部分，需要在前端和后端都进行权限验证。
:::
