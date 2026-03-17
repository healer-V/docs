---
title: "Qiankun 应用间通信"
category: "微前端 · Qiankun"
tags:
  - Qiankun
  - 通信
  - Actions
  - 状态共享
date: 2026-03-17
---

# Qiankun 应用间通信

微前端应用间的通信需要在保持隔离性的前提下实现。Qiankun 提供了 `initGlobalState` 作为官方通信机制，同时也支持自定义事件、共享依赖等方案。

## 一、initGlobalState（全局状态管理）

`initGlobalState` 是 Qiankun 官方提供的应用间通信方案，基于发布/订阅模式，主应用与子应用都可以读取和修改全局状态。

### 1. 主应用初始化全局状态

::: details 主应用全局状态配置

```ts
// src/micro/globalState.ts — 主应用
import { initGlobalState, MicroAppStateActions } from 'qiankun'

// 定义全局状态的类型
interface GlobalState {
  user: {
    id: number
    name: string
    role: 'admin' | 'user'
    token: string
  } | null
  theme: 'light' | 'dark'
  language: 'zh-CN' | 'en-US'
  notifications: number  // 未读通知数
}

// 初始化全局状态
const initialState: GlobalState = {
  user: null,
  theme: 'light',
  language: 'zh-CN',
  notifications: 0,
}

const actions: MicroAppStateActions = initGlobalState(initialState)

// 主应用监听状态变化
actions.onGlobalStateChange((state, prevState) => {
  console.log('[主应用] 状态变化:', {
    from: prevState,
    to: state,
  })

  // 例如：子应用修改了 theme，主应用同步更新
  if (state.theme !== prevState.theme) {
    document.documentElement.setAttribute('data-theme', state.theme)
  }
})

export { actions }
export type { GlobalState }
```

```ts
// src/micro/index.ts — 将 actions 传递给子应用
import { registerMicroApps } from 'qiankun'
import { actions } from './globalState'

registerMicroApps([
  {
    name: 'vue-app',
    entry: '//localhost:7100',
    container: '#micro-container',
    activeRule: '/vue-app',
    props: {
      actions, // 将 actions 传给子应用
    },
  },
])
```

:::

### 2. onGlobalStateChange 监听状态变化

::: details 子应用中监听全局状态

```ts
// 子应用 src/main.ts
import type { MicroAppStateActions } from 'qiankun'
import type { GlobalState } from '../../main-app/src/micro/globalState'

let globalActions: MicroAppStateActions | null = null

export async function mount(props: Record<string, unknown>) {
  globalActions = props.actions as MicroAppStateActions

  // 监听全局状态变化
  globalActions.onGlobalStateChange((state: GlobalState, prevState: GlobalState) => {
    console.log('[子应用] 状态变化:', state)

    // 用户登出时清空本地状态
    if (!state.user && prevState.user) {
      clearLocalState()
    }

    // 主题变化时更新子应用主题
    if (state.theme !== prevState.theme) {
      applyTheme(state.theme)
    }
  }, true) // 第二个参数 true：立即触发一次回调，获取当前状态
}

export async function unmount() {
  // 卸载时移除监听（防止内存泄漏）
  globalActions?.offGlobalStateChange()
  globalActions = null
}
```

:::

### 3. setGlobalState 更新状态

::: details 子应用更新全局状态

```ts
// 子应用中的登录逻辑
async function handleLogin(username: string, password: string) {
  const response = await loginApi(username, password)

  // 更新全局状态：通知主应用和其他子应用用户已登录
  globalActions?.setGlobalState({
    user: {
      id: response.data.id,
      name: response.data.name,
      role: response.data.role,
      token: response.data.token,
    },
  })
}

// 子应用中切换主题
function toggleTheme() {
  const currentState = // 获取当前状态...
  globalActions?.setGlobalState({
    theme: currentState.theme === 'light' ? 'dark' : 'light',
  })
}
```

:::

::: warning setGlobalState 只能修改已存在的顶级字段
`setGlobalState` 是浅合并，只能修改 `initGlobalState` 时定义的顶级字段。如果尝试设置未定义的字段，会被忽略。嵌套对象会被整体替换，不会深度合并。
:::

## 二、自定义事件通信（CustomEvent）

对于需要跨应用广播消息的场景，原生 `CustomEvent` 是一种简单有效的补充方案：

::: details 基于 CustomEvent 的通信工具

```ts
// shared/eventBus.ts — 可在主应用和子应用中共享（通过 CDN 或 npm 包）

type EventCallback = (data: unknown) => void

const eventBus = {
  /**
   * 发布事件
   * @param eventName 事件名
   * @param data 传递的数据
   */
  emit(eventName: string, data?: unknown) {
    const event = new CustomEvent(`qiankun:${eventName}`, {
      detail: data,
      bubbles: true,          // 冒泡
      cancelable: false,
    })
    window.dispatchEvent(event)
  },

  /**
   * 监听事件
   */
  on(eventName: string, callback: EventCallback): () => void {
    const handler = (event: Event) => {
      callback((event as CustomEvent).detail)
    }
    window.addEventListener(`qiankun:${eventName}`, handler)
    // 返回取消监听函数，便于清理
    return () => window.removeEventListener(`qiankun:${eventName}`, handler)
  },

  /**
   * 监听一次
   */
  once(eventName: string, callback: EventCallback) {
    const off = this.on(eventName, (data) => {
      callback(data)
      off()
    })
  },
}

export default eventBus
```

```ts
// 子应用 A 中发布事件
import eventBus from '@shared/eventBus'

function handleOrderCreated(order: Order) {
  // 通知其他子应用（如购物车子应用）订单已创建
  eventBus.emit('order:created', { orderId: order.id, amount: order.total })
}
```

```ts
// 子应用 B 中监听事件
import eventBus from '@shared/eventBus'

let offOrderCreated: (() => void) | null = null

export async function mount() {
  // 监听订单创建事件
  offOrderCreated = eventBus.on('order:created', (data) => {
    console.log('收到新订单通知:', data)
    refreshOrderList()
  })
}

export async function unmount() {
  offOrderCreated?.() // 清理监听
  offOrderCreated = null
}
```

:::

## 三、共享依赖（externals）

将 React、Vue 等公共依赖通过 CDN 加载，所有子应用共享同一个实例，避免重复加载。

::: details Webpack externals 配置共享依赖

```js
// 子应用 webpack.config.js
module.exports = {
  externals: {
    // key: 包名，value: 全局变量名（CDN 导出的全局变量）
    'react': 'React',
    'react-dom': 'ReactDOM',
    'react-router-dom': 'ReactRouterDOM',
  },
}
```

```html
<!-- 主应用 public/index.html — 通过 CDN 加载共享依赖 -->
<head>
  <!-- 所有应用共用 React 18 -->
  <script crossorigin src="https://cdn.example.com/react@18.2.0/umd/react.production.min.js"></script>
  <script crossorigin src="https://cdn.example.com/react-dom@18.2.0/umd/react-dom.production.min.js"></script>
</head>
```

:::

::: warning 共享依赖的版本一致性
共享依赖要求所有子应用使用完全相同的版本。版本不一致会导致运行时错误（如 React Hooks 报错）。建议在 monorepo 中通过 `peerDependencies` 统一管理版本。
:::

## 四、公共组件库共享方案

公共组件库（设计系统、工具函数库）有多种共享方案：

| 方案 | 实现方式 | 优点 | 缺点 |
|------|----------|------|------|
| npm 包 | 发布私有 npm 包，各子应用安装 | 版本可控，类型友好 | 需重新发布才能更新 |
| CDN + externals | CDN 加载，externals 引用 | 无打包开销，自动共享 | 版本强一致，CDN 故障风险 |
| Module Federation | Webpack 5 模块联邦 | 运行时共享，按需加载 | 需要 Webpack 5，配置复杂 |
| `props` 传递 | 主应用通过 props 传给子应用 | 简单，灵活 | 只适合少量工具函数 |

## 五、主子应用路由联动

主应用负责一级路由（决定加载哪个子应用），子应用负责二级及以下路由。两者之间的路由需要协同。

::: details Vue 3 主应用路由与 Qiankun 联动

```ts
// 主应用 src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { registerMicroApps, start } from 'qiankun'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('../views/Dashboard.vue') },
    {
      // 通配符路由：所有 /vue-app/* 路由都由 Vue 子应用处理
      path: '/vue-app/:pathMatch(.*)*',
      component: () => import('../views/MicroAppContainer.vue'),
    },
    {
      path: '/react-app/:pathMatch(.*)*',
      component: () => import('../views/MicroAppContainer.vue'),
    },
  ],
})

// MicroAppContainer.vue 只需要提供挂载容器
// Qiankun 的 activeRule 会自动匹配路由并加载对应子应用
```

```ts
// 子应用中导航到主应用的其他路由（跨应用跳转）
function navigateToMainApp(path: string) {
  // 方案 1：通过全局状态通知主应用
  globalActions?.setGlobalState({ navigateTo: path })

  // 方案 2：直接修改 history（ProxySandbox 下 history 未被代理，直接生效）
  window.history.pushState(null, '', path)
}
```

:::

::: tip 路由跳转最佳实践
- **子应用内部跳转**：使用子应用自身的 router（`router.push('/list')`），路由自动拼接 `routerBase`
- **跳转到其他子应用**：通过 `window.history.pushState` 或主应用提供的导航方法
- **跳转到主应用页面**：通过全局状态或自定义事件通知主应用
:::
