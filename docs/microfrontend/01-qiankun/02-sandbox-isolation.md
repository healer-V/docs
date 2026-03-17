---
title: "Qiankun 沙箱与样式隔离"
category: "微前端 · Qiankun"
tags:
  - Qiankun
  - JS沙箱
  - 样式隔离
  - ProxySandbox
date: 2026-03-17
---

# Qiankun 沙箱与样式隔离

隔离是微前端的核心挑战。Qiankun 通过 JS 沙箱防止子应用的全局变量污染，通过样式隔离防止 CSS 样式溢出，确保多个子应用可以安全共存。

## 一、JS 沙箱实现原理

Qiankun 提供三种 JS 沙箱，根据运行环境自动选择或手动指定。

### 1. SnapshotSandbox（快照沙箱）

**原理：** 在子应用挂载前，对 `window` 对象做完整快照；子应用卸载时，将 `window` 恢复到快照状态，同时记录子应用对 `window` 的所有修改。下次挂载时，将记录的修改重新应用到 `window`。

```
mount:    拍摄 window 快照 → 恢复上次记录的修改
unmount:  记录 window 变化 → 恢复快照
```

**缺点：** 每次挂载/卸载都需要遍历整个 `window` 对象，性能开销大；不支持多实例（同时运行多个子应用）。

### 2. LegacySandbox（遗留沙箱）

**原理：** 基于 ES Proxy 拦截对 `window` 的读写操作。挂载时记录新增、修改的属性；卸载时将这些属性恢复原值或删除。

**优点：** 比快照沙箱性能好（按需记录变化，不遍历全量）。

**缺点：** 仍然直接操作全局 `window`，不支持真正的多实例。

### 3. ProxySandbox（代理沙箱，默认）

**原理：** 为每个子应用创建一个独立的 Proxy 对象作为 `fakeWindow`，子应用中所有对 `window` 的读写都被代理到 `fakeWindow`。真实的 `window` 对象不会被修改。

```js
// ProxySandbox 核心原理（简化版）
class ProxySandbox {
  fakeWindow = Object.create(null)
  active = false

  constructor() {
    const { fakeWindow } = this
    const proxy = new Proxy(fakeWindow, {
      set(target, prop, value) {
        // 写操作只作用于 fakeWindow，不污染真实 window
        target[prop] = value
        return true
      },
      get(target, prop) {
        // 读操作：先从 fakeWindow 读，没有则从真实 window 读
        return prop in target ? target[prop] : window[prop]
      },
    })
    this.proxy = proxy
  }

  active() {
    this.sandboxRunning = true
    // 将 fakeWindow 的 proxy 注入子应用运行上下文
  }

  inactive() {
    this.sandboxRunning = false
    // 子应用对 window 的所有修改都留在 fakeWindow 中，不影响主应用
  }
}
```

**优点：** 真正的多实例隔离，子应用之间互不影响；性能最好。

### 4. 三种沙箱对比

| 特性 | SnapshotSandbox | LegacySandbox | ProxySandbox |
|------|----------------|---------------|--------------|
| 实现方式 | window 快照 | Proxy | Proxy + fakeWindow |
| 多实例支持 | 否 | 否 | 是 |
| 性能 | 差（全量遍历） | 中 | 最好 |
| 浏览器兼容 | IE 支持 | 需要 Proxy（IE 不支持） | 需要 Proxy |
| 隔离程度 | 较弱 | 较弱 | 最强 |
| 默认使用 | Proxy 不支持时降级 | 单实例时使用 | 默认（推荐） |

## 二、样式隔离

### 1. strictStyleIsolation（Shadow DOM）

Qiankun 将子应用的 DOM 包裹在 Shadow DOM 中，CSS 完全隔离在 Shadow Root 内，不会影响外部。

```js
// 主应用 start 配置
start({
  sandbox: {
    strictStyleIsolation: true, // 开启 Shadow DOM 隔离
  },
})
```

**优点：** 最彻底的样式隔离，子应用样式完全不影响外部。

**缺点：**

- 组件库（Ant Design、Element Plus）的弹窗/下拉框默认挂载到 `document.body`，在 Shadow DOM 外，无法获取子应用的样式
- 需要组件库支持 `getPopupContainer` 之类的配置将弹窗渲染到 Shadow Root 内

::: warning strictStyleIsolation 兼容性问题
大多数 UI 组件库与 Shadow DOM 不完全兼容，弹窗类组件（Modal、Dropdown、Select）会出现样式丢失。使用前需要充分测试，或选择 `experimentalStyleIsolation` 方案。
:::

### 2. experimentalStyleIsolation（CSS 前缀，推荐）

Qiankun 动态给子应用的所有 CSS 规则添加特定选择器前缀（如 `div[data-qiankun="vue-app"]`），将子应用样式的作用域限制在其挂载容器内。

```js
start({
  sandbox: {
    experimentalStyleIsolation: true, // 开启 CSS 前缀隔离
  },
})
```

转换示例：

```css
/* 子应用原始 CSS */
.btn { color: blue; }
body { background: #f0f0f0; }

/* Qiankun 处理后 */
div[data-qiankun="vue-app"] .btn { color: blue; }
div[data-qiankun="vue-app"] body { background: #f0f0f0; }
```

**优点：** 兼容性好，组件库弹窗正常显示（挂载到 body 的元素不受影响）。

**缺点：** 无法隔离全局样式（`:root`、`body` 等），通过 JS 动态插入到 body 的样式无法被隔离。

::: details 两种样式隔离方案对比

| 特性 | strictStyleIsolation | experimentalStyleIsolation |
|------|---------------------|---------------------------|
| 实现 | Shadow DOM | CSS 选择器前缀 |
| 隔离程度 | 完全隔离 | 基本隔离 |
| 组件库兼容 | 差（弹窗样式丢失） | 好 |
| 性能 | 略差（Shadow DOM 开销） | 好 |
| 动态样式 | 支持 | 不支持 |
| 推荐场景 | 对样式隔离要求极高，且已适配组件库 | 大多数场景（推荐） |

:::

## 三、沙箱副作用清理

即使有 JS 沙箱，某些副作用仍需手动清理。

### 1. 定时器

```ts
// 子应用 src/main.ts
const timers: ReturnType<typeof setInterval>[] = []

export async function mount(props: Record<string, unknown>) {
  // 记录创建的定时器
  timers.push(
    setInterval(() => fetchLatestData(), 30000)
  )
}

export async function unmount() {
  // 卸载时清理所有定时器
  timers.forEach(clearInterval)
  timers.length = 0
}
```

### 2. 全局事件监听

```ts
// 子应用中注意管理全局事件监听
const eventHandlers: Array<{ event: string; handler: EventListener }> = []

function addGlobalListener(event: string, handler: EventListener) {
  window.addEventListener(event, handler)
  eventHandlers.push({ event, handler })
}

export async function unmount() {
  // 清理所有全局事件监听
  eventHandlers.forEach(({ event, handler }) => {
    window.removeEventListener(event, handler)
  })
  eventHandlers.length = 0
}
```

### 3. 全局变量

ProxySandbox 会自动清理子应用对 `window` 的修改。但通过 `Object.defineProperty` 定义的属性需要手动清理：

```ts
export async function unmount() {
  // 如果子应用在 window 上定义了不可删除的属性，需要手动清理
  if ('myAppState' in window) {
    delete (window as Record<string, unknown>).myAppState
  }
}
```

## 四、单例模式 vs 多例模式

### 1. 单例模式

同一时间只有一个子应用实例运行，子应用挂载/卸载时完整地初始化/销毁。

```js
// 主应用配置：同一容器，路由互斥
registerMicroApps([
  { name: 'app1', container: '#micro-app', activeRule: '/app1' },
  { name: 'app2', container: '#micro-app', activeRule: '/app2' },
])
```

适合场景：资源有限，子应用之间路由互斥，同一时间只访问一个子应用。

### 2. 多例模式

多个子应用同时挂载，各自运行在独立的 ProxySandbox 中。

```js
// 主应用配置：不同容器，可同时显示
registerMicroApps([
  { name: 'sidebar-app', container: '#sidebar', activeRule: () => true }, // 始终显示
  { name: 'content-app', container: '#content', activeRule: '/content' },
])

start({
  singular: false,  // 关闭单例模式，允许多实例同时运行
})
```

适合场景：侧边栏子应用需要始终显示，同时主内容区加载另一个子应用。

::: tip 选择建议
大多数场景使用**单例模式**（默认）即可，路由切换时 Qiankun 自动卸载旧应用再加载新应用。仅当需要多个子应用同时可见时才使用多例模式，此时需要注意 ProxySandbox 的多实例开销和应用间的通信设计。
:::
