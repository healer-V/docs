---
title: "Qiankun 生产实践"
category: "微前端 · Qiankun"
tags:
  - Qiankun
  - 性能优化
  - 部署
  - 问题排查
date: 2026-03-17
---

# Qiankun 生产实践

在生产环境使用 Qiankun，需要关注性能优化、正确的 Nginx 部署配置，以及处理各类常见问题。本文总结了实际项目中的关键实践经验。

## 一、预加载策略

### 1. prefetch 配置选项

Qiankun 在主应用完成首次渲染后，利用浏览器空闲时间（`requestIdleCallback`）预加载子应用资源，减少用户切换子应用时的等待。

::: details prefetch 配置详解

```ts
// 主应用 src/micro/index.ts
import { start } from 'qiankun'

start({
  // prefetch 有四种值：
  // false       — 不预加载
  // true        — 第一个子应用挂载后，预加载其余子应用的静态资源
  // 'all'       — 主应用 start() 后立即预加载所有子应用（推荐）
  // string[]    — 只预加载指定名称的子应用

  prefetch: 'all',

  // 也可以传入自定义预加载函数
  // prefetch: (apps) => {
  //   // 只预加载权限范围内的子应用
  //   const allowedApps = apps.filter(app => hasPermission(app.name))
  //   return { criticalAppNames: [], minorAppsName: allowedApps.map(a => a.name) }
  // },
})
```

:::

### 2. 按权限预加载

在有权限控制的系统中，只预加载当前用户有权限访问的子应用，避免加载无用资源：

::: details 按权限动态注册并预加载子应用

```ts
// src/micro/index.ts
import { registerMicroApps, start } from 'qiankun'

async function setupMicroApps(userPermissions: string[]) {
  // 全量子应用配置
  const allApps = [
    { name: 'order-app',    entry: '//localhost:7101', permission: 'ORDER_VIEW' },
    { name: 'finance-app',  entry: '//localhost:7102', permission: 'FINANCE_VIEW' },
    { name: 'report-app',   entry: '//localhost:7103', permission: 'REPORT_VIEW' },
  ]

  // 根据用户权限筛选可访问的子应用
  const allowedApps = allApps
    .filter(app => userPermissions.includes(app.permission))
    .map(app => ({
      name: app.name,
      entry: app.entry,
      container: '#micro-container',
      activeRule: `/${app.name}`,
    }))

  registerMicroApps(allowedApps)

  start({
    // 只预加载有权限的子应用
    prefetch: allowedApps.map(app => app.name) as unknown as 'all',
  })
}
```

:::

## 二、应用级缓存

Qiankun 默认在子应用卸载时保留已加载的 JS/CSS 资源，不会重复下载。但应用实例（Vue/React 实例）每次挂载都会重新创建。

对于需要保留子应用状态的场景，可以通过隐藏/显示 DOM 的方式实现"缓存"：

::: details 使用 loadMicroApp 实现子应用缓存

```ts
// src/micro/appCache.ts
import { loadMicroApp, MicroApp } from 'qiankun'

const appCache = new Map<string, { instance: MicroApp; container: HTMLElement }>()

async function activateApp(appName: string, entry: string, targetContainer: HTMLElement) {
  if (appCache.has(appName)) {
    // 已缓存：将容器移入当前视口
    const { container } = appCache.get(appName)!
    container.style.display = 'block'
    targetContainer.appendChild(container)
    return
  }

  // 首次加载：创建子应用容器并挂载
  const container = document.createElement('div')
  container.id = `micro-${appName}`
  targetContainer.appendChild(container)

  const instance = loadMicroApp({
    name: appName,
    entry,
    container,
  })

  await instance.mountPromise
  appCache.set(appName, { instance, container })
}

function deactivateApp(appName: string) {
  if (appCache.has(appName)) {
    // 不卸载，只隐藏 DOM
    const { container } = appCache.get(appName)!
    container.style.display = 'none'
  }
}
```

:::

::: warning 缓存子应用的内存开销
保留子应用实例会占用内存。对于有大量子应用的系统，不建议全量缓存，应根据访问频率决定是否缓存，并设置最大缓存数量（LRU 策略）。
:::

## 三、资源加载优化

### 1. 子应用独立运行标识

子应用需要能够判断自己是运行在 Qiankun 中还是独立运行，以便独立运行时加载 mock 数据或本地配置：

```ts
// 子应用中判断运行环境
export const isQiankun = !!window.__POWERED_BY_QIANKUN__

// 在 axios 请求拦截器中设置 baseURL
const baseURL = isQiankun
  ? '/api'               // 在主应用中，通过主应用的代理
  : 'http://localhost:8080/api' // 独立运行，直接访问后端

const http = axios.create({ baseURL })
```

### 2. 子应用入口优化

子应用的 HTML Entry 越小越好，避免在 HTML 中内联大量 JS/CSS：

```html
<!-- 子应用 public/index.html — 精简版 -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Sub App</title>
</head>
<body>
  <div id="app"></div>
  <!-- 不要内联脚本，让 Webpack/Vite 生成的 script 标签负责加载 -->
</body>
</html>
```

## 四、Nginx 部署配置

### 1. 典型部署架构

```
用户浏览器
    ↓
Nginx（主应用域名：app.example.com）
    ├── /          → 主应用静态文件
    ├── /vue-app/* → 代理到子应用服务器或子应用静态文件
    └── /react-app/* → 代理到子应用服务器
```

### 2. Nginx 配置示例

::: details 完整 Nginx 部署配置

```nginx
# /etc/nginx/conf.d/micro-frontend.conf

# 主应用
server {
    listen 80;
    server_name app.example.com;

    # 安全头
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;

    # 主应用静态文件
    location / {
        root /usr/share/nginx/html/main-app;
        try_files $uri $uri/ /index.html;  # SPA 路由支持
        index index.html;
    }

    # 静态资源缓存（contenthash 文件名，可长期缓存）
    location ~* \.(js|css|png|jpg|gif|ico|svg|woff2?)$ {
        root /usr/share/nginx/html/main-app;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 代理到 Vue 子应用（子应用独立部署在另一台服务器）
    location /sub-vue/ {
        proxy_pass http://vue-app-server:7100/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        # 允许跨域（子应用资源可能从不同域名加载）
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
    }

    # API 接口代理（解决跨域）
    location /api/ {
        proxy_pass http://backend-server:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 60s;
    }
}

# 子应用（独立域名，供子应用独立运行时访问）
server {
    listen 80;
    server_name vue-app.example.com;

    location / {
        root /usr/share/nginx/html/vue-app;
        try_files $uri $uri/ /index.html;
        index index.html;

        # 子应用允许被主应用跨域加载
        add_header Access-Control-Allow-Origin *;
    }
}
```

:::

## 五、常见问题排查

### 1. 样式污染

**现象：** 子应用的全局样式（如 `* { box-sizing: border-box; }`、`body { margin: 0; }`）影响了主应用或其他子应用。

**解决方案：**

::: details 样式污染解决方案

```js
// 方案 1：开启 experimentalStyleIsolation（推荐）
start({ sandbox: { experimentalStyleIsolation: true } })
```

```css
/* 方案 2：在子应用中将全局样式限制到根容器内 */

/* 修改前（全局污染） */
body { background: #f5f5f5; }
* { box-sizing: border-box; }

/* 修改后（限制到容器内） */
#app { background: #f5f5f5; }
#app *, #app *::before, #app *::after { box-sizing: border-box; }
```

```scss
// 方案 3：使用 SCSS 包裹所有样式
#app {
  // 将所有样式嵌套在根容器选择器内
  background: #f5f5f5;

  * {
    box-sizing: border-box;
  }

  .btn {
    color: blue;
  }
}
```

:::

### 2. 路由冲突

**现象：** 主应用和子应用的路由相互干扰，导致子应用内跳转触发了主应用的路由变化，或反之。

**解决方案：**

::: details 路由冲突排查与修复

```ts
// 确保子应用 router 配置了正确的 base
// Vue Router
const router = createRouter({
  history: createWebHistory(
    // 在 Qiankun 中使用注入的 publicPath 作为 base
    window.__POWERED_BY_QIANKUN__
      ? window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__
      : import.meta.env.BASE_URL
  ),
  routes: [...],
})
```

```ts
// React Router：使用 basename 约束路由
function App({ routerBase }: { routerBase: string }) {
  return (
    <BrowserRouter basename={routerBase || '/'}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/list" element={<List />} />
      </Routes>
    </BrowserRouter>
  )
}
```

:::

### 3. 全局变量污染

**现象：** 子应用修改了 `window.xxx` 导致主应用或其他子应用访问到错误的值。

**排查步骤：**

1. 确认 `sandbox` 配置已开启（默认开启 ProxySandbox）
2. 检查是否有通过 `Object.defineProperty` 定义不可配置属性
3. 检查是否在 `unmount` 钩子中手动清理了副作用

::: details 常见问题速查表

| 问题现象 | 可能原因 | 解决方案 |
|----------|----------|----------|
| 子应用资源 404 | `publicPath` 配置错误 | 检查 Vite `base` 或 `__webpack_public_path__` |
| 子应用不显示 | 容器 DOM 未就绪 | 在 `mounted` 后调用 `start()` |
| 样式组件库弹窗无样式 | `strictStyleIsolation` 与 Shadow DOM 冲突 | 改用 `experimentalStyleIsolation` |
| 切换子应用后白屏 | `unmount` 中未销毁 Vue/React 实例 | 检查 `unmount` 是否正确调用 `app.unmount()` |
| 子应用 HMR 失效 | dev server 未开启 CORS | 配置 `devServer.headers: {'Access-Control-Allow-Origin': '*'}` |
| `window.__POWERED_BY_QIANKUN__` 为 undefined | 子应用独立运行 | 用 `!!window.__POWERED_BY_QIANKUN__` 做兼容判断 |
| 子应用跳转外链使用 Electron 打开 | - | 配置 `webContents.setWindowOpenHandler` |
| 多个子应用同时运行样式错乱 | 未开启样式隔离 | 开启 `experimentalStyleIsolation` |

:::

## 六、Qiankun 3.x 新特性展望

Qiankun 3.x（基于 `@qiankun/react-bridge` 等新包）正在重构中，主要改进方向包括：

| 特性 | 说明 |
|------|------|
| 框架无关的 Bridge | 提供官方的 Vue、React、Angular 桥接包，替代手动改造生命周期 |
| 更好的 Vite 支持 | 原生支持 ES Modules，不再需要 `vite-plugin-qiankun` |
| 更强的 TypeScript 支持 | 全面的类型推导，不再需要手写 `declare global` |
| 改进的沙箱性能 | 优化 ProxySandbox，降低 Proxy 拦截开销 |
| 微应用路由改进 | 提供更简洁的路由集成方案，减少配置工作 |

::: tip 当前使用建议
Qiankun 3.x 尚在开发中（截至 2026 年 3 月），生产环境推荐继续使用稳定的 2.x 版本。可以关注 [Qiankun GitHub](https://github.com/umijs/qiankun) 跟进 3.x 进展。
:::
