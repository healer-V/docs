---
title: "Vite 原理剖析"
category: "工程化 · Vite"
tags:
  - Vite
excerpt: "Vite 利用浏览器原生 ES 模块实现毫秒级冷启动，通过 Dev Server 按需编译、WebSocket 驱动 HMR、esbuild 预构建依赖，彻底解决了 Webpack 在大型项目中启动慢、热更新慢的痛点。"
date: 2026-03-17
---

# Vite 原理剖析

## 一、ESM 原理与 Vite 的启动逻辑

### 1. 浏览器原生 ES 模块

现代浏览器已原生支持 `type="module"` 脚本，可以直接解析 `import`/`export` 语法并发起网络请求加载依赖模块，不需要打包工具介入。

```html
<!-- index.html -->
<script type="module" src="/src/main.ts"></script>
```

Vite 开发服务器收到浏览器对 `main.ts` 的请求后，**按需将源文件转换为浏览器可执行的 JavaScript** 并返回。浏览器解析到 `import` 语句时会继续发起新的请求，整个依赖树就这样被懒加载。

::: tip 为什么比 Webpack 快
Webpack 启动时需要先打包所有模块，项目越大耗时越长。Vite 不打包，启动时只做两件事：依赖预构建（esbuild，极快）+ 启动 Dev Server，所以无论项目多大，冷启动时间都是秒级甚至毫秒级。
:::

### 2. 依赖预构建

裸模块导入（如 `import React from 'react'`）在浏览器中无法直接解析路径。Vite 在首次启动时用 **esbuild** 对 `node_modules` 中的依赖做预构建：

- 将 CommonJS/UMD 格式转换为 ESM
- 将碎片化的小文件合并，减少 HTTP 请求数（如 `lodash-es` 有 600+ 文件）
- 缓存到 `node_modules/.vite/deps/`

::: details 预构建核心逻辑（简化版）

```ts{8-14}
// vite 内部：packages/vite/src/node/optimizer/index.ts
async function optimizeDeps(config: ResolvedConfig) {
  // 1. 扫描入口文件，找出所有裸模块导入
  const deps = await scanImports(config)

  // 2. 用 esbuild 将依赖打包为单个 ESM 文件
  await build({
    entryPoints: Object.keys(deps),
    bundle: true,
    format: 'esm',
    splitting: true,
    outdir: path.join(config.cacheDir, 'deps'),
    metafile: true,
  })

  // 3. 写入元数据文件（记录 hash，用于缓存校验）
  await writeFile(metadataPath, JSON.stringify({ hash, optimized: deps }))
}
```

:::

### 3. 模块路径重写

Vite Dev Server 返回模块代码前，会将裸模块路径重写为绝对路径，指向预构建产物：

```js
// 浏览器收到的转换后代码
import React from '/node_modules/.vite/deps/react.js?v=abc123'
import { useState } from '/node_modules/.vite/deps/react.js?v=abc123'
```

---

## 二、Dev Server 工作机制

### 1. 请求处理流程

Vite Dev Server 基于 Node.js `http` 模块和 `connect` 中间件框架搭建，核心处理链如下：

| 步骤 | 中间件 | 作用 |
|------|--------|------|
| 1 | `htmlMiddleware` | 处理 HTML 请求，注入 HMR 客户端脚本 |
| 2 | `transformMiddleware` | 拦截 JS/TS/Vue/JSX 请求，调用插件链转换代码 |
| 3 | `serveStaticMiddleware` | 静态资源直接返回 |
| 4 | `errorMiddleware` | 404 / 错误处理 |

::: details transformMiddleware 核心逻辑

```ts{6-15}
// packages/vite/src/node/server/middlewares/transform.ts
export function transformMiddleware(server: ViteDevServer): Connect.NextHandleFunction {
  return async function viteTransformMiddleware(req, res, next) {
    const url = req.url!

    // 只处理模块请求（带 ?import 或 .js/.ts/.vue 等后缀）
    if (!isJSRequest(url) && !isCSSRequest(url)) {
      return next()
    }

    // 调用插件链的 resolveId → load → transform 钩子
    const result = await transformRequest(url, server)
    if (result) {
      // 设置正确的 Content-Type 并返回转换后的代码
      return send(req, res, result.code, 'js', { headers: server.config.server.headers })
    }
    next()
  }
}
```

:::

### 2. 插件管道

每个模块请求都经过完整的插件管道处理：

```
resolveId(id)  →  load(id)  →  transform(code, id)
```

::: details 插件容器（PluginContainer）实现

```ts
// 插件按顺序依次调用，直到某个插件返回非 null 结果
async function resolveId(id: string, importer?: string) {
  for (const plugin of plugins) {
    if (!plugin.resolveId) continue
    const result = await plugin.resolveId.call(ctx, id, importer)
    if (result != null) return result  // 找到结果立即返回
  }
}

// transform 是链式处理，每个插件都可以修改代码
async function transform(code: string, id: string) {
  for (const plugin of plugins) {
    if (!plugin.transform) continue
    const result = await plugin.transform.call(ctx, code, id)
    if (result != null) {
      code = typeof result === 'string' ? result : result.code
    }
  }
  return { code }
}
```

:::

---

## 三、HMR 热模块替换原理

### 1. 整体架构

HMR 由三个部分协作完成：

```
文件系统监听（chokidar）
       ↓ 文件变化事件
  Vite HMR Server
       ↓ WebSocket 推送更新消息
  浏览器 HMR Client
       ↓ 动态 import 新模块
  框架 HMR 处理器（如 @vitejs/plugin-vue）
       ↓ 更新组件，保留状态
```

### 2. 模块图与边界传播

Vite 在内存中维护一张 **模块依赖图（ModuleGraph）**，记录每个模块的导入者（importers）和被导入者（importedModules）。

当文件发生变化时：

1. 在模块图中找到变化的模块节点
2. 沿 importers 向上传播，查找最近的 **HMR 边界**（即调用了 `import.meta.hot.accept()` 的模块）
3. 若找到边界，只更新边界内的模块；若传播到入口仍无边界，则触发整页刷新

::: details HMR 边界示例

```ts
// src/components/Counter.vue（编译后）
// Vue 插件自动注入 HMR 代码，Counter.vue 本身就是边界
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    // 用新模块替换当前组件定义，保留组件状态
    __VUE_HMR_RUNTIME__.reload(newModule.default)
  })
}
```

:::

### 3. WebSocket 消息格式

::: details 服务端推送的更新消息

```ts
// 文件修改时，服务端推送
{
  type: 'update',
  updates: [
    {
      type: 'js-update',           // 或 'css-update'
      path: '/src/components/Counter.vue',
      acceptedPath: '/src/components/Counter.vue',
      timestamp: 1710000000000,
    }
  ]
}

// 文件删除或无法 HMR 时，推送全页刷新
{ type: 'full-reload' }
```

:::

::: warning HMR 注意事项
- Vue SFC 和 React Fast Refresh 的 HMR 由各自插件实现，普通 JS/TS 模块需要手动调用 `import.meta.hot.accept()` 才能局部更新
- 修改 `vite.config.ts` 或 `tsconfig.json` 等配置文件会导致 Dev Server 重启，不支持 HMR
:::

---

## 四、Vite 与 Webpack 对比

### 1. 核心差异

| 维度 | Vite | Webpack |
|------|------|---------|
| **开发模式** | 原生 ESM，按需编译 | Bundle-based，全量打包 |
| **冷启动速度** | 毫秒级（与项目大小无关） | 秒级～分钟级（随项目增大） |
| **HMR 速度** | 毫秒级（只更新变化模块） | 秒级（需重新打包受影响的 chunk） |
| **生产构建** | Rollup（Tree Shaking 优秀） | Webpack（生态更成熟） |
| **配置复杂度** | 简单，开箱即用 | 复杂，需要大量 loader/plugin |
| **旧浏览器兼容** | 需要 `@vitejs/plugin-legacy` | 内置支持（配置 target） |
| **CommonJS 支持** | 依赖预构建自动处理 | 原生支持 |
| **插件生态** | 快速成长，兼容 Rollup 插件 | 极其成熟 |

### 2. 迁移建议

::: tip 适合从 Webpack 迁移到 Vite 的场景
- 新项目或中小型项目
- 使用 Vue 3、React 18 等现代框架
- 开发体验是优先考量
- 不依赖 Webpack 特有的 loader（如 file-loader 的特殊用法）
:::

::: warning 谨慎迁移的场景
- 大量依赖 CommonJS 动态 require 的遗留代码
- 复杂的 Webpack 链式 loader（如多个 loader 处理同一文件类型）
- 需要兼容 IE11 等旧浏览器（Vite 官方不再维护 legacy 插件）
:::

---

## 五、生产构建：Vite + Rollup

### 1. 为什么生产不用 ESM

生产环境继续使用原生 ESM 会面临两个问题：

1. **请求瀑布**：大型应用有数百个模块，瀑布式加载会导致首屏时间过长
2. **Tree Shaking 不彻底**：浏览器运行时无法做跨模块的死代码消除

因此 Vite 生产构建使用 **Rollup** 进行打包，享受完整的 Tree Shaking 和代码分割能力。

### 2. 构建配置示例

::: details 生产构建 vite.config.ts

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'es2015',          // 编译目标，影响语法转换
    outDir: 'dist',
    assetsInlineLimit: 4096,   // 小于 4KB 的资源转为 base64 内联
    cssCodeSplit: true,        // CSS 代码分割
    sourcemap: false,          // 生产环境关闭 sourcemap
    rollupOptions: {
      output: {
        // 按第三方库分割 chunk，充分利用浏览器缓存
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
```

:::
