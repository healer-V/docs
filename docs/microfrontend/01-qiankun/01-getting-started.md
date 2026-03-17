---
title: "Qiankun 快速上手"
category: "微前端 · Qiankun"
tags:
  - Qiankun
  - 主应用
  - 子应用
  - 配置
date: 2026-03-17
---

# Qiankun 快速上手

本文介绍如何搭建一个 Qiankun 微前端应用，包括主应用配置、Vue 3 和 React 子应用改造，以及本地调试技巧。

## 一、主应用配置

主应用（基座）负责注册子应用、控制路由、提供统一布局。主应用本身可以是任意前端框架。

### 1. 安装 Qiankun

```bash
# 在主应用中安装（子应用无需安装 qiankun）
npm install qiankun
```

### 2. 注册子应用

::: details 主应用完整配置（registerMicroApps + start）

```ts
// src/micro/index.ts — 主应用微前端配置
import { registerMicroApps, start, addGlobalUncaughtErrorHandler } from 'qiankun'

registerMicroApps(
  [
    {
      name: 'vue-app',                              // 子应用唯一名称
      entry: '//localhost:7100',                    // 子应用入口地址（开发环境）
      container: '#micro-container',               // 渲染子应用的 DOM 容器
      activeRule: '/vue-app',                      // 激活路由规则
      props: {                                     // 传递给子应用的初始数据
        routerBase: '/vue-app',
        token: localStorage.getItem('token'),
      },
    },
    {
      name: 'react-app',
      entry: '//localhost:7200',
      container: '#micro-container',
      activeRule: '/react-app',
      props: {
        routerBase: '/react-app',
      },
    },
    {
      name: 'legacy-app',
      entry: '//localhost:7300',
      container: '#legacy-container',   // 遗留应用可以使用独立容器
      activeRule: '/legacy',
    },
  ],
  {
    // 子应用生命周期钩子
    beforeLoad: (app) => {
      console.log(`[主应用] 开始加载: ${app.name}`)
      return Promise.resolve()
    },
    beforeMount: (app) => {
      console.log(`[主应用] 开始挂载: ${app.name}`)
      return Promise.resolve()
    },
    afterMount: (app) => {
      console.log(`[主应用] 挂载完成: ${app.name}`)
      return Promise.resolve()
    },
    afterUnmount: (app) => {
      console.log(`[主应用] 卸载完成: ${app.name}`)
      return Promise.resolve()
    },
  }
)

// 全局未捕获错误处理
addGlobalUncaughtErrorHandler((event) => {
  console.error('[Qiankun] 全局错误:', event)
})

// 启动 Qiankun
start({
  prefetch: 'all',          // 预加载策略：all | true | false | string[]
  sandbox: {
    strictStyleIsolation: false,           // Shadow DOM 样式隔离
    experimentalStyleIsolation: true,      // CSS 前缀样式隔离（推荐）
  },
})
```

:::

### 3. 主应用 HTML 容器

主应用需要为子应用提供一个 DOM 挂载点：

```html
<!-- src/index.html 或 App.vue 布局组件 -->
<div id="app">
  <!-- 主应用导航 -->
  <nav class="main-nav">
    <a href="/vue-app">Vue 应用</a>
    <a href="/react-app">React 应用</a>
  </nav>

  <!-- 子应用挂载容器 -->
  <main id="micro-container"></main>
</div>
```

::: warning 容器元素必须在 start() 调用前存在于 DOM 中
Qiankun 初始化时会查找容器元素。如果容器是由框架动态渲染的（如 Vue 组件），需要在组件 `mounted` 生命周期之后再调用 `start()`，避免容器还未渲染就开始加载子应用。
:::

## 二、子应用改造（通用原则）

所有框架的子应用都需要遵循以下改造原则：

### 1. 暴露三个生命周期函数

子应用必须导出 `bootstrap`、`mount`、`unmount` 三个生命周期函数：

| 生命周期 | 触发时机 | 建议操作 |
|----------|----------|----------|
| `bootstrap` | 子应用第一次加载时 | 一次性初始化（如注册全局组件） |
| `mount` | 每次子应用挂载时 | 渲染应用到容器 DOM |
| `unmount` | 子应用切出时 | 销毁应用实例，清理副作用 |

### 2. 配置 publicPath

子应用打包后的静态资源路径需要指向子应用自身的域名/端口，否则在主应用中加载时路径会指向主应用。

## 三、Vue 3 子应用改造

::: details Vue 3 子应用完整改造（vite + TypeScript）

**第一步：配置 publicPath**

```ts
// src/public-path.ts
// 在子应用入口文件顶部导入
if (window.__POWERED_BY_QIANKUN__) {
  // 在 Qiankun 环境下，设置 publicPath 为子应用的完整部署地址
  // __webpack_public_path__ 用于 Webpack；Vite 需要通过 vite.config.ts 配置 base
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__
}
```

**第二步：改造 main.ts**

```ts
// src/main.ts
import './public-path'
import { createApp, App as VueApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

let app: VueApp | null = null

// 独立运行时的挂载逻辑（非 Qiankun 环境）
function render(props?: Record<string, unknown>) {
  const container = props?.container as Element | undefined
  const mountNode = container
    ? container.querySelector('#app')   // 从 Qiankun 传入的容器中查找
    : document.getElementById('app')   // 独立运行时使用默认 id

  app = createApp(App)
  app.use(router)
  app.use(createPinia())
  app.mount(mountNode!)
}

// ===== Qiankun 生命周期 =====

export async function bootstrap() {
  console.log('[子应用 vue-app] bootstrap')
}

export async function mount(props: Record<string, unknown>) {
  console.log('[子应用 vue-app] mount', props)
  render(props)
}

export async function unmount() {
  console.log('[子应用 vue-app] unmount')
  app?.unmount()
  app = null
}

// ===== 独立运行 =====
if (!window.__POWERED_BY_QIANKUN__) {
  render()
}
```

**第三步：配置 Vite**

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import qiankun from 'vite-plugin-qiankun'

export default defineConfig({
  base: process.env.NODE_ENV === 'production'
    ? 'https://sub-app.example.com/'  // 生产环境子应用域名
    : '//localhost:7100/',

  plugins: [
    vue(),
    qiankun('vue-app', {              // 子应用名称与 registerMicroApps 中一致
      useDevMode: true,               // 开发模式
    }),
  ],

  server: {
    port: 7100,
    cors: true,                       // 允许主应用跨域访问
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
})
```

**第四步：配置 Vue Router**

```ts
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  // 在 Qiankun 中使用主应用传入的 base，独立运行时使用 '/'
  history: createWebHistory(
    window.__POWERED_BY_QIANKUN__
      ? window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__
      : '/'
  ),
  routes: [
    { path: '/', component: () => import('../views/Home.vue') },
    { path: '/list', component: () => import('../views/List.vue') },
  ],
})

export default router
```

:::

## 四、React 子应用改造

::: details React 子应用改造（Webpack + TypeScript）

**第一步：配置 publicPath**

```ts
// src/public-path.ts
if (window.__POWERED_BY_QIANKUN__) {
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__
}
```

**第二步：改造 index.tsx**

```tsx
// src/index.tsx
import './public-path'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

let root: ReturnType<typeof ReactDOM.createRoot> | null = null

function render(props?: Record<string, unknown>) {
  const container = props?.container as Element | undefined
  const mountNode = (container
    ? container.querySelector('#root')
    : document.getElementById('root')) as Element

  root = ReactDOM.createRoot(mountNode)
  root.render(
    <React.StrictMode>
      <App routerBase={props?.routerBase as string} />
    </React.StrictMode>
  )
}

export async function bootstrap() {
  console.log('[子应用 react-app] bootstrap')
}

export async function mount(props: Record<string, unknown>) {
  console.log('[子应用 react-app] mount')
  render(props)
}

export async function unmount() {
  console.log('[子应用 react-app] unmount')
  root?.unmount()
  root = null
}

if (!window.__POWERED_BY_QIANKUN__) {
  render()
}
```

**第三步：Webpack 配置**

```js
// config/webpack.config.js — 关键修改
module.exports = {
  output: {
    // 必须配置 library 和 libraryTarget，让子应用以 UMD 格式导出生命周期函数
    library: 'react-app',        // 与子应用名称一致
    libraryTarget: 'umd',
    // Webpack 5 需要额外配置
    globalObject: 'window',
  },
  devServer: {
    port: 7200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
}
```

:::

## 五、调试技巧

### 1. 全局变量辅助判断

```ts
// 在子应用中判断当前运行环境
if (window.__POWERED_BY_QIANKUN__) {
  console.log('运行在 Qiankun 主应用中')
} else {
  console.log('子应用独立运行')
}
```

### 2. 本地联调步骤

1. 启动所有子应用开发服务器（各自的 `npm run dev`）
2. 启动主应用开发服务器
3. 访问主应用地址，点击对应路由即可加载子应用
4. 每个子应用也可以独立访问其 `localhost:71xx` 地址单独调试

::: tip 调试建议
- 子应用中的控制台日志在主应用的 DevTools 中统一显示
- 在 Qiankun 中 Network 面板能看到子应用的资源请求（来自各子应用域名）
- 使用 Vue DevTools 或 React DevTools 时，安装对应浏览器扩展即可在主应用 DevTools 中调试子应用组件树
:::

### 3. TypeScript 类型声明

::: details 为 Qiankun 全局变量添加类型

```ts
// src/global.d.ts
declare global {
  interface Window {
    __POWERED_BY_QIANKUN__: boolean
    __INJECTED_PUBLIC_PATH_BY_QIANKUN__: string
  }
}

export {}
```

:::
