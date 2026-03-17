---
title: "Webpack 构建优化"
category: "工程化 · Webpack"
tags:
  - Webpack
  - 优化
  - Tree-shaking
  - 代码分割
date: 2026-03-17
---

# Webpack 构建优化

Webpack 构建优化分为两个维度：**减小产物体积**（影响用户加载速度）和**提升构建速度**（影响开发效率）。本文系统介绍两类优化策略。

## 一、代码分割

代码分割（Code Splitting）将大 Bundle 拆分为多个小文件，实现按需加载，是减小首屏体积最有效的手段。

### 1. SplitChunksPlugin

`SplitChunksPlugin` 是 Webpack 内置的代码分割插件，通过 `optimization.splitChunks` 配置。

::: details SplitChunksPlugin 配置示例

```js
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',         // async（异步）| initial（同步）| all（全部，推荐）
      minSize: 20000,        // 生成 chunk 的最小体积（20KB）
      minRemainingSize: 0,
      minChunks: 1,          // 模块被引用次数达到此值才分割
      maxAsyncRequests: 30,  // 按需加载时最大并行请求数
      maxInitialRequests: 30, // 入口点的最大并行请求数
      cacheGroups: {
        // 将 node_modules 中的依赖单独打包
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: -10,     // 优先级，数值越大越优先匹配
          chunks: 'initial',
        },
        // 将 react 相关依赖单独打包
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: 'react-vendor',
          chunks: 'all',
          priority: 20,      // 优先级高于 vendors
        },
        // 被多处引用的公共模块单独打包
        common: {
          name: 'common',
          minChunks: 2,      // 被至少 2 个 chunk 引用
          minSize: 0,
          priority: -20,
          reuseExistingChunk: true, // 复用已有 chunk，不重复打包
        },
      },
    },
    // 将 Webpack 运行时代码单独提取，避免 vendors chunk 的 hash 随入口文件改变
    runtimeChunk: 'single',
  },
}
```

:::

### 2. 动态 import() 懒加载

使用 `import()` 语法动态导入模块，Webpack 会自动将其分割为独立的 Chunk，在需要时才加载。

::: details 动态 import() 示例

```js
// src/router/index.js — Vue Router 路由懒加载
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('../pages/Home.vue'),  // 懒加载，自动代码分割
    },
    {
      path: '/dashboard',
      // 魔法注释：指定 chunk 名称
      component: () => import(/* webpackChunkName: "dashboard" */ '../pages/Dashboard.vue'),
    },
    {
      path: '/settings',
      // 将多个路由合并为同一个 chunk
      component: () => import(/* webpackChunkName: "settings" */ '../pages/Settings.vue'),
    },
  ],
})
```

在普通业务代码中按需加载：

```js
// src/utils/chart.js
async function renderChart(container, data) {
  // 仅在需要时才加载 echarts（体积较大）
  const echarts = await import(/* webpackChunkName: "echarts" */ 'echarts')
  const chart = echarts.init(container)
  chart.setOption(data)
}
```

:::

::: tip 魔法注释（Magic Comments）
Webpack 支持在 `import()` 中使用特殊注释控制分割行为：
- `webpackChunkName`：指定 chunk 名称
- `webpackPrefetch`：空闲时预加载（浏览器空闲后加载）
- `webpackPreload`：与父 chunk 并行预加载
- `webpackMode`：指定加载模式（`lazy` | `eager` | `weak`）
:::

## 二、Tree Shaking

Tree Shaking 静态分析模块的导入导出，移除未使用的代码（Dead Code），减小 Bundle 体积。

### 1. 生效条件

Tree Shaking 只对 **ES Modules**（`import/export`）有效，CommonJS（`require`）无法 Tree Shaking。

| 条件 | 说明 |
|------|------|
| 使用 ES Modules | 源码必须使用 `import/export`，避免 `require()` |
| `mode: 'production'` | 生产模式下 Webpack 自动开启 |
| `optimization.usedExports: true` | 标记未使用的导出（开发模式下可手动开启） |
| 不被 `sideEffects` 标记 | 模块不含副作用，或在 `package.json` 中声明 |

### 2. sideEffects 配置

在 `package.json` 中声明 `sideEffects`，告诉 Webpack 哪些文件可以安全移除（无副作用）：

::: details sideEffects 配置示例

```json
// package.json
{
  "name": "my-app",
  "sideEffects": false
}
```

如果项目中有部分文件有副作用（如全局 CSS、polyfill），需要明确排除：

```json
// package.json
{
  "sideEffects": [
    "**/*.css",           // CSS 文件不能 Tree Shake
    "src/polyfills.js",   // polyfill 文件有副作用
    "src/global.js"
  ]
}
```

:::

::: warning 使用 babel 时注意模块转换
若 `@babel/preset-env` 将 ES Modules 转换为 CommonJS（`modules: 'commonjs'`），Tree Shaking 将失效。需设置 `modules: false`：

```json
// babel.config.json
{
  "presets": [
    ["@babel/preset-env", { "modules": false }]
  ]
}
```
:::

::: details Webpack Tree Shaking 配置

```js
// webpack.config.js
module.exports = {
  mode: 'production',
  optimization: {
    usedExports: true,     // 标记使用的导出（生产模式默认开启）
    minimize: true,        // 开启代码压缩（TerserPlugin 会移除标记的死代码）
    sideEffects: true,     // 读取 package.json 中的 sideEffects 字段
    concatenateModules: true, // Scope Hoisting：合并模块作用域，减少函数包装
  },
}
```

:::

## 三、懒加载与预加载

### 1. 懒加载（Lazy Loading）

懒加载即动态 `import()`，只在需要时加载模块。已在代码分割一节详述。

### 2. 预获取与预加载

通过魔法注释控制资源的预加载策略：

::: details prefetch 与 preload 示例

```js
// src/components/Header.vue
async function openUserModal() {
  // prefetch：浏览器空闲时下载，不阻塞当前页面
  // 适合：当前路由可能跳转到的下一个路由
  const UserModal = await import(
    /* webpackChunkName: "user-modal" */
    /* webpackPrefetch: true */
    './UserModal.vue'
  )
}

async function loadHeavyChart() {
  // preload：与父 chunk 并行下载，会阻塞渲染
  // 适合：当前页面肯定会用到但需要异步加载的资源
  const Chart = await import(
    /* webpackChunkName: "heavy-chart" */
    /* webpackPreload: true */
    './HeavyChart.vue'
  )
}
```

:::

| 策略 | 触发时机 | 优先级 | 适用场景 |
|------|----------|--------|----------|
| `prefetch` | 浏览器空闲时 | 低 | 用户可能导航到的下一页 |
| `preload` | 与父 chunk 并行 | 高 | 当前页面必须用到的异步资源 |

## 四、持久化缓存

### 1. Webpack 5 内置缓存

Webpack 5 引入了文件系统级别的持久化缓存，将构建结果缓存到磁盘，二次构建速度可提升 60%~90%：

::: details 持久化缓存配置

```js
// webpack.config.js
module.exports = {
  cache: {
    type: 'filesystem',            // 'memory'（默认）| 'filesystem'
    cacheDirectory: path.resolve(__dirname, '.webpack-cache'), // 缓存目录
    buildDependencies: {
      // 配置文件变更时使缓存失效
      config: [__filename, path.resolve(__dirname, 'babel.config.js')],
    },
    // 缓存版本，修改后强制使所有缓存失效
    version: `${process.env.NODE_ENV}-${require('./package.json').version}`,
    // 缓存最长保留时间（默认 2 周）
    maxAge: 1000 * 60 * 60 * 24 * 14,
  },
}
```

:::

### 2. 输出文件 contenthash

通过 `[contenthash]` 确保文件内容不变时浏览器缓存命中率最高（已在 Output 配置一节介绍）。

## 五、多进程打包

### 1. thread-loader

将耗时的 Loader（如 `babel-loader`）放到独立的 Worker 线程中运行，利用多核 CPU 加速构建：

::: details thread-loader 配置示例

```js
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        use: [
          {
            loader: 'thread-loader',
            options: {
              workers: 4,                // Worker 数量，建议 CPU 核数 - 1
              workerParallelJobs: 50,    // 每个 Worker 并行处理的 job 数
              poolTimeout: 2000,         // 空闲超时后关闭 Worker
            },
          },
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
}
```

:::

::: warning thread-loader 的启动开销
Worker 线程的启动本身需要约 600ms。对于小型项目，启动开销可能比节省的时间更多。建议在中大型项目（构建时间 > 10s）中使用。
:::

## 六、SWC/esbuild 替代 Babel 加速

`babel-loader` 是 JavaScript 编写的，速度较慢。使用 Rust 编写的 SWC 或 Go 编写的 esbuild 可以将编译速度提升 10~70 倍。

### 1. swc-loader（推荐）

::: details swc-loader 配置示例

```bash
npm install -D swc-loader @swc/core
```

```js
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',  // 'ecmascript' | 'typescript'
                tsx: true,
                decorators: true,
              },
              transform: {
                react: {
                  runtime: 'automatic', // React 17+ 自动导入 JSX runtime
                },
              },
              target: 'es2015',
            },
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
}
```

:::

### 2. esbuild-loader

::: details esbuild-loader 配置示例

```bash
npm install -D esbuild-loader
```

```js
// webpack.config.js
const { EsbuildPlugin } = require('esbuild-loader')

module.exports = {
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loader: 'esbuild-loader',
        options: {
          target: 'es2015',
        },
      },
      {
        test: /\.(ts|tsx)$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'tsx',
          target: 'es2015',
        },
      },
    ],
  },
  optimization: {
    minimizer: [
      // 用 esbuild 替代 TerserPlugin 压缩 JS（速度更快）
      new EsbuildPlugin({
        target: 'es2015',
        css: true, // 同时压缩 CSS
      }),
    ],
  },
}
```

:::

| 编译工具 | 编写语言 | 相对速度 | 兼容性 |
|----------|----------|----------|--------|
| `babel-loader` | JavaScript | 1x（基准） | 最佳，插件生态丰富 |
| `swc-loader` | Rust | 20~70x | 良好，支持大多数 Babel 插件 |
| `esbuild-loader` | Go | 10~100x | 较好，不支持部分装饰器语法 |

## 七、构建速度分析

使用 `speed-measure-webpack-plugin` 分析每个 Plugin 和 Loader 的耗时，找出构建瓶颈：

::: details speed-measure-webpack-plugin 使用示例

```bash
npm install -D speed-measure-webpack-plugin
```

```js
// webpack.config.js
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
const smp = new SpeedMeasurePlugin()

// 用 smp.wrap() 包裹整个配置对象
module.exports = smp.wrap({
  mode: 'production',
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['babel-loader'],
      },
    ],
  },
  plugins: [
    // 插件列表...
  ],
})
```

输出示例：
```
 SMP  ⏱
General output time took 8.35 secs

 SMP  ⏱  Plugins
HtmlWebpackPlugin took 0.218 secs

 SMP  ⏱  Loaders
babel-loader took 5.43 secs    ← 主要瓶颈
  module count = 142
```

:::

::: tip 综合优化策略建议

1. 首先用 `speed-measure-webpack-plugin` 找出瓶颈
2. 如果 `babel-loader` 慢，换 `swc-loader` 或 `esbuild-loader`
3. 开启持久化缓存（`cache: { type: 'filesystem' }`），收益最大
4. 大型项目使用 `thread-loader` 开启多进程
5. 确保 `exclude: /node_modules/` 避免处理第三方包

:::
