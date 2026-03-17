---
title: "TypeScript 项目实战"
category: "前端 · TypeScript"
tags:
  - TypeScript
excerpt: "本文通过实战案例介绍在真实项目中应用 TypeScript 的最佳实践，包括与 Vue 3、React 的集成、API 类型管理、状态管理类型化，以及常见错误的排查和解决方法。"
date: 2026-03-17
---

# TypeScript 项目实战

## 一、与 Vue 3 集成

### 1. 组件类型化

::: details Vue 3 组合式 API 类型实践

```vue
<!-- src/components/UserCard.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// 定义 Props 类型
interface Props {
  userId: number
  compact?: boolean
  onSelect?: (userId: number) => void
}

// 使用 withDefaults 设置默认值
const props = withDefaults(defineProps<Props>(), {
  compact: false
})

// 定义 Emits 类型
const emit = defineEmits<{
  (e: 'update', userId: number, data: Partial<User>): void
  (e: 'delete', userId: number): void
}>()

// 业务类型定义
interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  avatar?: string
}

// 响应式数据带类型推断
const user = ref<User | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

// 计算属性类型自动推断
const displayName = computed(() => {
  if (!user.value) return '加载中...'
  return `${user.value.name} (${user.value.role})`
})

// 生命周期中加载数据
onMounted(async () => {
  isLoading.value = true
  try {
    const res = await fetch(`/api/users/${props.userId}`)
    user.value = await res.json() as User
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    isLoading.value = false
  }
})

// 暴露给父组件的方法
defineExpose({
  refresh: () => onMounted
})
</script>

<template>
  <div class="user-card" :class="{ compact: props.compact }">
    <template v-if="isLoading">加载中...</template>
    <template v-else-if="error">错误: {{ error }}</template>
    <template v-else-if="user">
      <img v-if="user.avatar" :src="user.avatar" :alt="user.name" />
      <h3>{{ displayName }}</h3>
      <p>{{ user.email }}</p>
    </template>
  </div>
</template>
```

:::

### 2. Pinia 状态管理类型化

::: details Pinia Store 类型实践

```ts
// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface AuthUser {
  id: number
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  permissions: string[]
}

interface LoginPayload {
  email: string
  password: string
}

// 组合式 Store（推荐）
export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => token.value !== null && user.value !== null)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const hasPermission = computed(() => (permission: string) => {
    return user.value?.permissions.includes(permission) ?? false
  })

  // Actions
  async function login(payload: LoginPayload): Promise<void> {
    isLoading.value = true
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || '登录失败')
      }

      const data = await res.json() as { token: string; user: AuthUser }
      token.value = data.token
      user.value = data.user
      localStorage.setItem('token', data.token)
    } finally {
      isLoading.value = false
    }
  }

  function logout(): void {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }

  return { user, token, isLoading, isAuthenticated, isAdmin, hasPermission, login, logout }
})
```

:::

## 二、与 React 集成

### 1. 组件类型化

::: details React 函数组件类型实践

```tsx
// src/components/ProductList.tsx
import React, { useState, useEffect, useCallback } from 'react'

interface Product {
  id: number
  name: string
  price: number
  stock: number
  category: string
}

interface ProductListProps {
  category?: string
  onProductSelect?: (product: Product) => void
  className?: string
  children?: React.ReactNode
}

// FC<Props> 或直接写 (props: Props) => JSX.Element
const ProductList: React.FC<ProductListProps> = ({
  category,
  onProductSelect,
  className,
  children
}) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = category ? `?category=${category}` : ''
      const res = await fetch(`/api/products${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as Product[]
      setProducts(data)
    } catch (e) {
      setError(e instanceof Error ? e : new Error('未知错误'))
    } finally {
      setLoading(false)
    }
  }, [category])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  if (loading) return <div>加载中...</div>
  if (error) return <div>错误: {error.message}</div>

  return (
    <div className={className}>
      {children}
      <ul>
        {products.map(product => (
          <li key={product.id} onClick={() => onProductSelect?.(product)}>
            <span>{product.name}</span>
            <span>¥{product.price}</span>
            <span>库存: {product.stock}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ProductList
```

:::

### 2. 自定义 Hook 类型化

::: details 通用请求 Hook

```ts
// src/hooks/useRequest.ts
import { useState, useEffect, useRef } from 'react'

interface RequestState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

interface UseRequestOptions<T> {
  initialData?: T
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  enabled?: boolean
}

function useRequest<T>(
  fetcher: () => Promise<T>,
  options: UseRequestOptions<T> = {}
): RequestState<T> & { refetch: () => void } {
  const { initialData = null, onSuccess, onError, enabled = true } = options

  const [state, setState] = useState<RequestState<T>>({
    data: initialData as T | null,
    loading: enabled,
    error: null
  })

  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const execute = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const data = await fetcherRef.current()
      setState({ data, loading: false, error: null })
      onSuccess?.(data)
    } catch (e) {
      const error = e instanceof Error ? e : new Error('请求失败')
      setState(prev => ({ ...prev, loading: false, error }))
      onError?.(error)
    }
  }

  useEffect(() => {
    if (enabled) execute()
  }, [enabled])

  return { ...state, refetch: execute }
}

// 使用示例
function UserProfile({ userId }: { userId: number }) {
  const { data: user, loading, error, refetch } = useRequest(
    () => fetch(`/api/users/${userId}`).then(r => r.json()),
    {
      onSuccess: (user) => console.log('加载成功:', user.name)
    }
  )

  return loading ? <div>加载中</div> : <div>{user?.name}</div>
}
```

:::

## 三、API 层类型管理

### 1. 统一 API 类型定义

::: details API 类型文件组织结构

```ts
// src/api/types.ts - 统一类型定义

// 通用响应包装
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
  timestamp: number
}

// 分页参数
export interface PageParams {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 分页响应
export interface PageResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 用户相关类型
export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  avatar?: string
  createdAt: string
}

export type CreateUserDto = Pick<User, 'name' | 'email' | 'role'> & {
  password: string
}

export type UpdateUserDto = Partial<Pick<User, 'name' | 'email' | 'role' | 'avatar'>>
```

```ts
// src/api/user.ts - API 调用封装

import type { ApiResponse, PageParams, PageResponse, User, CreateUserDto, UpdateUserDto } from './types'
import { request } from './request'  // 封装了 axios 的请求函数

export const userApi = {
  list: (params: PageParams) =>
    request.get<ApiResponse<PageResponse<User>>>('/users', { params }),

  detail: (id: number) =>
    request.get<ApiResponse<User>>(`/users/${id}`),

  create: (data: CreateUserDto) =>
    request.post<ApiResponse<User>>('/users', data),

  update: (id: number, data: UpdateUserDto) =>
    request.put<ApiResponse<User>>(`/users/${id}`, data),

  delete: (id: number) =>
    request.delete<ApiResponse<void>>(`/users/${id}`)
}
```

:::

## 四、常见错误与解决方案

### 1. 高频 TypeScript 错误

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `Object is possibly 'null'` | strictNullChecks 开启，未处理 null | 使用可选链 `?.` 或非空断言 `!` |
| `Property does not exist on type` | 访问了类型中不存在的属性 | 检查拼写，或更新类型定义 |
| `Type 'X' is not assignable to type 'Y'` | 类型不兼容 | 检查类型定义，使用类型断言或修正类型 |
| `Argument of type 'X' is not assignable` | 函数参数类型不匹配 | 检查函数签名，修正传入参数的类型 |
| `Could not find declaration file` | 第三方库缺少类型声明 | 安装 `@types/xxx` 或手写声明文件 |

### 2. 解决 null 处理问题

::: details 各种 null 处理模式

```ts
interface Config {
  timeout?: number
  retries?: number
  baseUrl?: string
}

function createClient(config?: Config) {
  // 可选链：安全访问可能为 null 的属性
  const timeout = config?.timeout ?? 5000
  const retries = config?.retries ?? 3

  // 非空断言（确定不为 null 时使用）
  const input = document.getElementById('search') as HTMLInputElement
  console.log(input.value)  // 不需要检查 null

  // 类型守卫收窄
  const baseUrl = config?.baseUrl
  if (baseUrl !== undefined) {
    console.log(baseUrl.toUpperCase())  // 此处 baseUrl 类型为 string
  }

  // 空值合并赋值
  config ??= {}
  config.timeout ??= 5000
}
```

:::

### 3. 处理第三方库类型问题

::: details 缺少类型声明的处理方案

```ts
// 方案 1：安装 @types 包
// npm install -D @types/lodash

// 方案 2：创建临时声明文件
// src/types/missing-lib.d.ts
declare module 'some-untyped-lib' {
  export function doSomething(input: string): string
  export const VERSION: string
}

// 方案 3：使用 any 临时绕过（在文件顶部）
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import untypedLib from 'some-untyped-lib'

// 方案 4：整个文件跳过类型检查
// @ts-nocheck （放在文件第一行）
```

:::

## 五、TypeScript 工程化配置

### 1. 推荐的 ESLint 配置

::: details .eslintrc.cjs TypeScript 规则

```js
// .eslintrc.cjs
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {
    // 禁止使用 any
    '@typescript-eslint/no-explicit-any': 'error',
    // 要求显式函数返回类型（可以更宽松）
    '@typescript-eslint/explicit-function-return-type': 'off',
    // 禁止非空断言（慎用 !）
    '@typescript-eslint/no-non-null-assertion': 'warn',
    // 要求使用类型专用导入
    '@typescript-eslint/consistent-type-imports': 'error',
    // 命名约定
    '@typescript-eslint/naming-convention': [
      'error',
      { selector: 'interface', format: ['PascalCase'] },
      { selector: 'typeAlias', format: ['PascalCase'] },
      { selector: 'enum', format: ['PascalCase'] }
    ]
  }
}
```

:::

::: tip 迁移现有 JavaScript 项目的建议
1. 将 `tsconfig.json` 的 `allowJs` 设为 `true`，允许 `.js` 和 `.ts` 文件共存
2. 先将入口文件和核心工具函数改为 `.ts`
3. 开启 `strict: false`，再逐步开启各个严格检查项
4. 优先修复 `noImplicitAny` 错误，这是最有价值的检查
5. 最后开启 `strictNullChecks`，处理所有 null/undefined 问题
:::
