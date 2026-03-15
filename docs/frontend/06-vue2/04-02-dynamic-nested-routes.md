---
title: "4.2 动态路由与嵌套路由"
category: "前端 · Vue 2"
tags:
  - Vue
excerpt: "动态路由使用 :param 定义参数 通过 $route.params 访问参数 嵌套路由使用 children 配置 在父组件中使用  显示子路由"
---

# 4.2 动态路由与嵌套路由

## 4.2.1 动态路由

### 4.2.1.1 基本用法

```javascript
// router/index.js
{
  path: '/user/:id',
  component: User
}
```

```vue
<!-- User.vue -->
<template>
  <div>
    <p>用户ID: {{ $route.params.id }}</p>
  </div>
</template>
```

### 4.2.1.2 多个动态参数

```javascript
{
  path: '/user/:userId/post/:postId',
  component: UserPost
}
```

### 4.2.1.3 路由参数作为 props

```javascript
{
  path: '/user/:id',
  component: User,
  props: true  // 将 params 作为 props
}
```

```vue
<script>
export default {
  props: ['id']  // 直接接收 id
}
</script>
```

## 4.2.2 嵌套路由

### 4.2.2.1 基本用法

```javascript
{
  path: '/user/:id',
  component: User,
  children: [
    {
      path: 'profile',
      component: UserProfile
    },
    {
      path: 'posts',
      component: UserPosts
    }
  ]
}
```

```vue
<!-- User.vue -->
<template>
  <div>
    <h2>用户 {{ $route.params.id }}</h2>
    <router-link to="/user/1/profile">资料</router-link>
    <router-link to="/user/1/posts">文章</router-link>
    <router-view></router-view>
  </div>
</template>
```

### 默认子路由

```javascript
{
  path: '/user/:id',
  component: User,
  children: [
    {
      path: '',
      component: UserDefault
    },
    {
      path: 'profile',
      component: UserProfile
    }
  ]
}
```

## 4.2.3 总结

- 动态路由使用 `:param` 定义参数
- 通过 `$route.params` 访问参数
- 嵌套路由使用 `children` 配置
- 在父组件中使用 `<router-view>` 显示子路由
