---
title: "6.2 API请求封装（Axios）"
category: "前端 · Vue 2"
tags:
  - Vue
excerpt: "网络错误：提示网络连接失败 业务错误：显示后端返回的错误信息 权限错误：跳转到登录页 服务器错误：提示服务器异常 合理的 API 封装可以提高代码复用性，统一的错误处理可以提升用户体验。"
---

# 6.2 API请求封装（Axios）

## 6.2.1 安装 Axios

::: tip 安装
```bash
npm install axios
# 或
yarn add axios
```
:::

## 6.2.2 基础封装

### 6.2.2.1 创建 axios 实例

```javascript
// utils/request.js
import axios from 'axios'

const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API,
  timeout: 5000
})

export default service
```

### 6.2.2.2 请求拦截器

```javascript
// 请求拦截器
service.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    // 对请求错误做些什么
    return Promise.reject(error)
  }
)
```

### 6.2.2.3 响应拦截器

```javascript
// 响应拦截器
service.interceptors.response.use(
  response => {
    // 对响应数据做点什么
    const res = response.data
    if (res.code !== 200) {
      // 处理业务错误
      return Promise.reject(new Error(res.message || 'Error'))
    }
    return res
  },
  error => {
    // 对响应错误做点什么
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，跳转到登录页
          break
        case 403:
          // 禁止访问
          break
        case 404:
          // 资源不存在
          break
        case 500:
          // 服务器错误
          break
      }
    }
    return Promise.reject(error)
  }
)
```

## 6.2.3 API 接口封装

### 6.2.3.1 用户相关接口

```javascript
// api/user.js
import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/user/login',
    method: 'post',
    data
  })
}

export function getUserInfo() {
  return request({
    url: '/user/info',
    method: 'get'
  })
}
```

### 6.2.3.2 使用接口

```vue
<script>
import { login, getUserInfo } from '@/api/user'

export default {
  methods: {
    async handleLogin() {
      try {
        const res = await login({
          username: this.username,
          password: this.password
        })
        console.log('登录成功', res)
      } catch (error) {
        console.error('登录失败', error)
      }
    }
  }
}
</script>
```

## 6.2.4 错误处理

::: tip 错误处理策略
1. **网络错误**：提示网络连接失败
2. **业务错误**：显示后端返回的错误信息
3. **权限错误**：跳转到登录页
4. **服务器错误**：提示服务器异常
:::

## 6.2.5 总结

::: tip 总结
合理的 API 封装可以提高代码复用性，统一的错误处理可以提升用户体验。
:::
