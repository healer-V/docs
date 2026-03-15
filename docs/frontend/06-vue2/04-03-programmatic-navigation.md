---
title: "4.3 编程式导航与命名路由"
category: "前端 · Vue 2"
tags:
  - Vue
excerpt: "使用 this.$router 进行编程式导航： 使用 this.$router.push() 进行导航 命名路由提供更灵活的导航方式 支持路径参数和查询参数 使用 replace 替换当前历史记录"
---

# 4.3 编程式导航与命名路由

## 4.3.1 编程式导航

使用 `this.$router` 进行编程式导航：

```vue
<script>
export default {
  methods: {
    goToHome() {
      this.$router.push('/')
    },
    goToAbout() {
      this.$router.push('/about')
    },
    goBack() {
      this.$router.go(-1)
    },
    goForward() {
      this.$router.go(1)
    },
    replace() {
      this.$router.replace('/about')
    }
  }
}
</script>
```

## 4.3.2 命名路由

### 4.3.2.1 配置命名路由

```javascript
{
  path: '/user/:id',
  name: 'User',
  component: User
}
```

### 使用命名路由

```vue
<template>
  <router-link :to="{ name: 'User', params: { id: 1 } }">
    用户
  </router-link>
</template>
```

```javascript
this.$router.push({ name: 'User', params: { id: 1 } })
```

## 4.3.3 路由参数

```javascript
// 路径参数
this.$router.push({ name: 'User', params: { id: 1 } })

// 查询参数
this.$router.push({ path: '/user', query: { id: 1 } })

// 完整示例
this.$router.push({
  name: 'User',
  params: { id: 1 },
  query: { tab: 'profile' }
})
```

## 4.3.4 总结

- 使用 `this.$router.push()` 进行导航
- 命名路由提供更灵活的导航方式
- 支持路径参数和查询参数
- 使用 `replace` 替换当前历史记录
