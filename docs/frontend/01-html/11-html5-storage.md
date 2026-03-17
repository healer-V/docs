---
title: "HTML5 Web Storage"
category: "前端 · HTML"
tags:
  - HTML
  - HTML5
  - Web Storage
excerpt: "HTML5 Web Storage 提供了 localStorage 和 sessionStorage 两种客户端存储方案，解决了 Cookie 容量小、每次请求都携带的痛点。本文全面讲解各种 Web 存储方案的使用场景和最佳实践。"
date: 2026-03-17
---

# HTML5 Web Storage

## 一、Web Storage 概述

### 1. Cookie 的局限性

在 HTML5 之前，浏览器端唯一的存储方式是 Cookie，但它有明显局限：

| 问题 | 说明 |
|------|------|
| 容量极小 | 单个 Cookie 限制 4KB，每个域名限制约 50 个 |
| 每次请求都携带 | 即使服务端不需要，也会浪费带宽 |
| API 不友好 | 字符串拼接读写，操作繁琐 |
| 安全风险 | `HttpOnly` 关闭时可被 XSS 窃取；CSRF 攻击利用 Cookie 自动携带特性 |
| 同源限制复杂 | 需要手动设置 `domain`、`path`、`expires` |

### 2. Web Storage 的优势

- 容量大：每个域名 5~10MB（各浏览器实现不同）
- 不随请求发送：仅在浏览器端存在，不污染 HTTP 请求头
- API 简洁：`setItem` / `getItem` / `removeItem` / `clear`
- 同源隔离：不同域名完全隔离，无需手动配置

### 3. 各存储方案横向对比

| 对比维度 | Cookie | localStorage | sessionStorage | IndexedDB |
|---------|--------|-------------|----------------|-----------|
| 存储容量 | ~4KB | ~5MB | ~5MB | 数百MB~无限 |
| 生命周期 | 可设置过期时间 | 永久（手动清除） | 标签页关闭即清除 | 永久 |
| 随请求发送 | 是 | 否 | 否 | 否 |
| 跨标签页共享 | 是 | 是 | 否（同源同窗口下子框架可共享） | 是 |
| API 类型 | 同步（字符串） | 同步（字符串） | 同步（字符串） | 异步（结构化数据） |
| 数据查询 | 不支持 | 不支持 | 不支持 | 支持索引查询 |
| 服务端访问 | 可（请求头携带） | 不可 | 不可 | 不可 |
| 适用场景 | 身份认证 Token | 用户偏好、缓存 | 临时表单数据 | 离线数据、大量结构化数据 |

---

## 二、localStorage（持久存储）

### 1. 基本操作

localStorage 中的数据在浏览器关闭后依然保留，除非手动清除：

```javascript{2,5,8,11,14}
// src/utils/storage-demo.js

// 存储数据（值会被自动转为字符串）
localStorage.setItem('username', '张三')
localStorage.setItem('theme', 'dark')

// 读取数据（不存在时返回 null）
const username = localStorage.getItem('username')  // '张三'
const missing = localStorage.getItem('notExist')   // null

// 删除单个
localStorage.removeItem('theme')

// 清空所有
localStorage.clear()

// 获取存储项数量
console.log(localStorage.length)  // 1

// 通过索引获取键名
console.log(localStorage.key(0))  // 'username'
```

### 2. 存储对象与数组

localStorage 只能存储字符串，存储复杂数据需要 JSON 序列化：

```javascript{4,10}
// src/utils/storage-object.js

// 存储对象
const userInfo = { id: 1, name: '张三', role: 'admin' }
localStorage.setItem('userInfo', JSON.stringify(userInfo))

// 读取对象
const stored = localStorage.getItem('userInfo')
const user = stored ? JSON.parse(stored) : null
console.log(user?.name)  // '张三'

// 存储数组
const cart = [
  { id: 101, name: 'MacBook Pro', qty: 1 },
  { id: 102, name: '机械键盘', qty: 2 },
]
localStorage.setItem('cart', JSON.stringify(cart))
const savedCart = JSON.parse(localStorage.getItem('cart') || '[]')
```

### 3. 容量限制与超限处理

localStorage 通常限制 5MB，超限会抛出 `QuotaExceededError`：

```javascript
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      console.warn('localStorage 容量已满，请清理旧数据')
      // 可在此处实现 LRU 淘汰策略
    }
    return false
  }
}
```

### 4. 封装 localStorage 工具函数

::: details 封装类型安全的 localStorage 工具

以下封装了支持泛型、过期时间、命名空间的工具函数：

```typescript
// src/utils/storage.ts

interface StorageItem<T> {
  value: T
  expiry?: number  // 过期时间戳（毫秒）
}

const PREFIX = 'app_'  // 命名空间前缀，避免键名冲突

export const storage = {
  /**
   * 存储数据，支持设置过期时间
   * @param key 键名
   * @param value 任意可序列化的值
   * @param ttl 过期时间（毫秒），不传则永久有效
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const item: StorageItem<T> = { value }
    if (ttl) {
      item.expiry = Date.now() + ttl
    }
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(item))
    } catch {
      console.error(`[storage] 存储 ${key} 失败，可能已超出容量`)
    }
  },

  /**
   * 读取数据，自动处理过期
   * @returns 数据值，过期或不存在时返回 null
   */
  get<T>(key: string): T | null {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null

    try {
      const item: StorageItem<T> = JSON.parse(raw)
      if (item.expiry && Date.now() > item.expiry) {
        localStorage.removeItem(PREFIX + key)
        return null
      }
      return item.value
    } catch {
      return null
    }
  },

  remove(key: string): void {
    localStorage.removeItem(PREFIX + key)
  },

  clear(): void {
    // 只清除本应用的数据（带前缀的）
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k))
  }
}

// 使用示例
storage.set('token', 'eyJhbGci...', 7 * 24 * 60 * 60 * 1000)  // 7天过期
const token = storage.get<string>('token')
```

:::

---

## 三、sessionStorage（会话存储）

### 1. 与 localStorage 的区别

sessionStorage 的 API 与 localStorage 完全相同，核心区别只有一点：

::: warning 生命周期差异
`sessionStorage` 的数据仅在**当前标签页的生命周期内**有效。关闭标签页后数据立即清除；刷新页面数据保留；通过 `Ctrl+D` 复制的标签页会携带一份数据副本，但之后两个标签页的数据是独立的。
:::

### 2. 多标签页隔离行为

| 操作 | localStorage | sessionStorage |
|------|-------------|----------------|
| 同一域名多标签页 | 数据共享 | 各自独立 |
| 刷新页面 | 保留 | 保留 |
| 关闭标签页重开 | 保留 | 清除 |
| 复制标签页（Ctrl+D） | 共享同一份 | 复制一份副本 |

### 3. 典型使用场景

sessionStorage 适合存储**不需要跨标签页、只需当次会话有效**的数据：

::: details 多步骤表单数据暂存示例

```javascript
// src/scripts/multi-step-form.js
// 多步骤注册表单，每步保存进度，防止误操作丢失

const FORM_KEY = 'registerFormDraft'

// 保存当前步骤的表单数据
function saveDraft(step, data) {
  const draft = JSON.parse(sessionStorage.getItem(FORM_KEY) || '{}')
  draft[`step${step}`] = data
  draft.currentStep = step
  sessionStorage.setItem(FORM_KEY, JSON.stringify(draft))
}

// 恢复上次进度
function loadDraft() {
  return JSON.parse(sessionStorage.getItem(FORM_KEY) || '{}')
}

// 提交完成后清除
function clearDraft() {
  sessionStorage.removeItem(FORM_KEY)
}

// 页面加载时恢复草稿
const draft = loadDraft()
if (draft.currentStep) {
  console.log(`检测到未完成的注册，从第 ${draft.currentStep} 步继续`)
  restoreForm(draft)
}
```

:::

---

## 四、storage 事件

### 1. 跨标签页通信

当 localStorage 数据发生变化时，**同源的其他标签页**会收到 `storage` 事件（当前标签页不触发）：

```javascript{4-13}
// src/scripts/tab-communication.js

// 标签页 A：监听来自其他标签页的消息
window.addEventListener('storage', (event) => {
  console.log('键名:', event.key)
  console.log('旧值:', event.oldValue)
  console.log('新值:', event.newValue)
  console.log('来源 URL:', event.url)

  if (event.key === 'logout-signal' && event.newValue === 'true') {
    // 其他标签页触发了登出，当前标签页也跳转登录页
    window.location.href = '/login'
  }
})

// 标签页 B：触发登出，通知其他标签页
function broadcastLogout() {
  localStorage.setItem('logout-signal', 'true')
  // 设置完可以立即删除，因为其他标签页已收到事件
  setTimeout(() => localStorage.removeItem('logout-signal'), 100)
}
```

::: details storage 事件实战：多标签页主题同步

```javascript
// src/scripts/theme-sync.js

// 应用主题
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('userTheme', theme)
}

// 监听其他标签页的主题变更
window.addEventListener('storage', (event) => {
  if (event.key === 'userTheme' && event.newValue) {
    // 只修改 DOM，不再触发 localStorage.setItem（避免循环）
    document.documentElement.setAttribute('data-theme', event.newValue)
  }
})

// 初始化：读取已保存的主题
const savedTheme = localStorage.getItem('userTheme') || 'light'
document.documentElement.setAttribute('data-theme', savedTheme)
```

:::

---

## 五、IndexedDB（结构化存储）

### 1. IndexedDB 的定位与优势

IndexedDB 是浏览器内置的 NoSQL 数据库，适合存储大量结构化数据：

- 容量大：通常可达数百 MB，部分浏览器按磁盘剩余空间百分比计算
- 异步 API：不阻塞主线程，适合大量数据操作
- 支持索引查询：可按字段建立索引，高效查找
- 支持事务：保证数据一致性
- 支持二进制数据：可存储 Blob、File、ArrayBuffer

### 2. 基本操作流程

IndexedDB 操作分为：打开数据库 → 创建对象仓库 → 在事务中增删改查：

```javascript{4,12,19,28}
// src/utils/indexeddb-base.js

// 1. 打开数据库（不存在则创建，版本号升级会触发 onupgradeneeded）
const request = indexedDB.open('myAppDB', 1)

// 2. 数据库升级时创建对象仓库（表）
request.onupgradeneeded = (event) => {
  const db = event.target.result

  // 创建 users 对象仓库，以 id 为主键
  if (!db.objectStoreNames.contains('users')) {
    const store = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true })
    // 创建索引（字段名, 索引名, 配置）
    store.createIndex('by_email', 'email', { unique: true })
    store.createIndex('by_name', 'name', { unique: false })
  }
}

// 3. 打开成功
request.onsuccess = (event) => {
  const db = event.target.result
  console.log('数据库打开成功', db)
}

request.onerror = (event) => {
  console.error('数据库打开失败:', event.target.error)
}
```

### 3. 简单待办事项 IndexedDB 实现

::: details 完整的 IndexedDB 待办事项 CRUD 示例

```javascript
// src/utils/todo-db.js
// 封装 IndexedDB 的 Promise API，消除回调嵌套

class TodoDB {
  constructor() {
    this.db = null
  }

  // 初始化数据库
  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('todoDB', 1)

      request.onupgradeneeded = (e) => {
        const db = e.target.result
        if (!db.objectStoreNames.contains('todos')) {
          const store = db.createObjectStore('todos', {
            keyPath: 'id',
            autoIncrement: true
          })
          store.createIndex('by_status', 'completed', { unique: false })
          store.createIndex('by_date', 'createdAt', { unique: false })
        }
      }

      request.onsuccess = (e) => {
        this.db = e.target.result
        resolve(this)
      }
      request.onerror = (e) => reject(e.target.error)
    })
  }

  // 添加待办
  add(todo) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('todos', 'readwrite')
      const store = tx.objectStore('todos')
      const req = store.add({ ...todo, createdAt: Date.now(), completed: false })
      req.onsuccess = (e) => resolve(e.target.result)  // 返回新 id
      req.onerror = (e) => reject(e.target.error)
    })
  }

  // 查询所有待办
  getAll() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('todos', 'readonly')
      const req = tx.objectStore('todos').getAll()
      req.onsuccess = (e) => resolve(e.target.result)
      req.onerror = (e) => reject(e.target.error)
    })
  }

  // 更新待办（标记完成）
  toggle(id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('todos', 'readwrite')
      const store = tx.objectStore('todos')
      const getReq = store.get(id)

      getReq.onsuccess = (e) => {
        const todo = e.target.result
        todo.completed = !todo.completed
        const putReq = store.put(todo)
        putReq.onsuccess = () => resolve(todo)
        putReq.onerror = (e) => reject(e.target.error)
      }
    })
  }

  // 删除待办
  delete(id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('todos', 'readwrite')
      const req = tx.objectStore('todos').delete(id)
      req.onsuccess = () => resolve()
      req.onerror = (e) => reject(e.target.error)
    })
  }
}

// 使用示例
const db = new TodoDB()
await db.init()
const id = await db.add({ title: '学习 IndexedDB', priority: 'high' })
const todos = await db.getAll()
await db.toggle(id)
await db.delete(id)
```

:::

---

## 六、Cache API 与 Service Worker 简介

Cache API 配合 Service Worker 可以缓存网络请求，实现离线访问能力：

```javascript
// src/sw.js（Service Worker 文件）
const CACHE_NAME = 'my-app-v1'
const ASSETS = ['/index.html', '/styles/main.css', '/scripts/app.js']

// 安装阶段：预缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  )
})

// 拦截网络请求：先查缓存，没有再走网络
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  )
})
```

::: tip 离线优先应用的存储策略
完整的 PWA（渐进式 Web 应用）存储策略通常是：
- **静态资源**（HTML/CSS/JS/图片）→ Cache API + Service Worker
- **用户偏好/配置**（主题、语言）→ localStorage
- **会话状态**（未提交表单）→ sessionStorage
- **大量业务数据**（文章草稿、离线数据）→ IndexedDB
- **身份凭证**（Token）→ Cookie（HttpOnly）或 localStorage（需注意 XSS 防护）
:::

---

## 七、存储方案选型指南

| 对比维度 | Cookie | localStorage | sessionStorage | IndexedDB | Cache API |
|---------|--------|-------------|----------------|-----------|-----------|
| 存储容量 | ~4KB | ~5MB | ~5MB | 数百MB+ | 受磁盘限制 |
| 数据类型 | 字符串 | 字符串 | 字符串 | 任意结构化数据 | HTTP 响应 |
| 读写方式 | 同步 | 同步 | 同步 | 异步 | 异步 |
| 持久性 | 可配置 | 永久 | 会话内 | 永久 | 永久（可手动清除） |
| 查询能力 | 无 | 无（只能按键） | 无（只能按键） | 有（索引查询） | 无（按 URL） |
| 跨标签页 | 是 | 是 | 否 | 是 | 是 |
| 服务端可见 | 是 | 否 | 否 | 否 | 否 |
| 适用场景 | 认证凭证 | 配置/缓存 | 临时状态 | 离线业务数据 | 静态资源缓存 |
