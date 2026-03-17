---
title: "Webpack 开发环境配置"
category: "工程化 · Webpack"
tags:
  - Webpack
  - DevServer
  - HMR
  - 代理
date: 2026-03-17
---

# Webpack 开发环境配置

良好的开发环境能显著提升开发效率。本文介绍 `webpack-dev-server` 的核心配置、HMR 热更新原理、Source Map 类型选择，以及如何将开发与生产配置分离。

## 一、webpack-dev-server 配置

`webpack-dev-server` 提供了一个本地开发服务器，支持自动刷新、代理、HMR 等功能，是 Webpack 开发环境的标配。

### 1. 安装与启动

```bash
npm install -D webpack-dev-server
```

```json
// package.json
{
  "scripts": {
    "dev": "webpack serve --config webpack.dev.js",
    "build": "webpack --config webpack.prod.js"
  }
}
```

### 2. 常用配置项

::: details webpack-dev-server 完整配置示例

```js
// webpack.dev.js
module.exports = {
  devServer: {
    host: '0.0.0.0',     // 绑定地址，0.0.0.0 允许局域网访问
    port: 3000,           // 端口号
    open: true,           // 启动后自动打开浏览器
    hot: true,            // 开启 HMR（Hot Module Replacement）
    compress: true,       // 开启 gzip 压缩

    // 静态文件目录（不需要经过 Webpack 处理的文件）
    static: {
      directory: path.join(__dirname, 'public'),
    },

    // 代理配置（解决开发时跨域问题）
    proxy: {
      '/api': {
        target: 'http://localhost:8080',    // 代理到后端服务
        changeOrigin: true,                  // 修改请求头中的 Host
        pathRewrite: { '^/api': '' },        // 重写路径：/api/users → /users
        secure: false,                       // 关闭 SSL 证书验证（HTTPS 后端）
      },
      '/upload': {
        target: 'http://file-server.local',
        changeOrigin: true,
      },
    },

    // 单页应用 HTML5 History 路由支持
    historyApiFallback: {
      rewrites: [
        { from: /^\/$/, to: '/index.html' },
        { from: /^\/admin/, to: '/admin.html' },
        { from: /./, to: '/index.html' },
      ],
    },

    // 自定义响应头
    headers: {
      'Access-Control-Allow-Origin': '*',
    },

    // 监听文件变化（默认监听 src 目录）
    watchFiles: ['src/**/*.html', 'public/**/*'],

    // 开发服务器客户端配置
    client: {
      overlay: {
        errors: true,    // 在浏览器中覆盖显示编译错误
        warnings: false, // 不显示警告
      },
      progress: true,    // 在浏览器中显示编译进度
    },
  },
}
```

:::

### 3. 代理配置进阶

::: details 多目标代理与 WebSocket 代理

```js
// webpack.dev.js
module.exports = {
  devServer: {
    proxy: [
      // 数组形式支持更灵活的配置
      {
        context: ['/api', '/auth'],          // 匹配多个路径前缀
        target: 'http://api.example.local',
        changeOrigin: true,
      },
      {
        context: '/ws',
        target: 'ws://localhost:8080',       // WebSocket 代理
        ws: true,                            // 开启 WebSocket 支持
      },
    ],
  },
}
```

:::

## 二、HMR 热更新原理

HMR（Hot Module Replacement）允许在不刷新整个页面的情况下替换、添加、删除模块，保留应用状态，大幅提升开发效率。

### 1. HMR 工作流程

```
文件变化
   ↓
Webpack 重新编译变更的模块
   ↓
通过 WebSocket 推送 hash 到浏览器客户端
   ↓
浏览器发起 AJAX 请求获取更新的模块列表（hot-update.json）
   ↓
浏览器下载更新的模块文件（.hot-update.js）
   ↓
HMR Runtime 执行模块替换逻辑
   ↓
通知业务代码（module.hot.accept 回调）
```

### 2. 框架级 HMR 支持

现代框架（Vue、React）通过各自的 HMR 插件实现组件级热更新：

| 框架 | HMR 方案 | 特点 |
|------|----------|------|
| Vue 3 | `vue-loader` 内置 | 组件状态保留，自动处理 |
| React | `react-refresh/webpack` | 组件状态保留（Hooks 友好） |
| 原生 JS | `module.hot.accept` 手动处理 | 需手动编写替换逻辑 |

::: details React HMR 配置（react-refresh）

```bash
npm install -D @pmmmwh/react-refresh-webpack-plugin react-refresh
```

```js
// webpack.dev.js
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')

module.exports = {
  mode: 'development',
  devServer: { hot: true },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [require.resolve('react-refresh/babel')], // 仅开发环境
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new ReactRefreshWebpackPlugin(), // 组件级热更新
  ],
}
```

:::

::: details 原生 JS 手动处理 HMR

```js
// src/index.js
import { render } from './app'

render()

// 接受当前模块自身的更新
if (module.hot) {
  module.hot.accept('./app', () => {
    // app 模块更新后重新执行渲染
    render()
  })

  // 处理模块销毁前的清理工作
  module.hot.dispose((data) => {
    // 清理副作用（定时器、事件监听等）
    clearInterval(data.timer)
  })
}
```

:::

## 三、Source Map 类型对比

Source Map 将编译后的代码映射回源码，方便在浏览器中调试。Webpack 通过 `devtool` 配置项控制 Source Map 类型。

### 1. 常用类型对比

| devtool 值 | 构建速度 | 重建速度 | 质量 | 适用场景 |
|------------|----------|----------|------|----------|
| `false` | 最快 | 最快 | 无 | 生产环境（不需要 Source Map） |
| `eval` | 最快 | 最快 | 低（无列信息） | 开发环境（构建速度优先） |
| `eval-cheap-source-map` | 快 | 快 | 中（仅行信息） | 开发环境 |
| `eval-cheap-module-source-map` | 中 | 快 | 中（含 Loader 转换前代码） | **开发环境推荐** |
| `eval-source-map` | 慢 | 中 | 高 | 开发环境（调试精确度优先） |
| `cheap-source-map` | 中 | 中 | 中 | 不常用 |
| `source-map` | 慢 | 慢 | 最高 | **生产环境推荐** |
| `hidden-source-map` | 慢 | 慢 | 最高 | 生产环境（不暴露给浏览器） |
| `nosources-source-map` | 慢 | 慢 | 高（无源码） | 生产环境（可定位行列但不暴露源码） |

### 2. 推荐配置

::: tip 开发与生产环境的 Source Map 选择
- **开发环境**：`eval-cheap-module-source-map`（重建速度快，能定位到 Loader 转换前的源码）
- **生产环境**：`source-map`（完整映射，上传到错误监控平台，不部署到服务器）或 `nosources-source-map`（可定位行列，但不暴露源码内容）
:::

::: details 完整 Source Map 配置

```js
// webpack.dev.js
module.exports = {
  devtool: 'eval-cheap-module-source-map',
}

// webpack.prod.js
module.exports = {
  // 生成独立的 .map 文件，但不在 JS 文件中添加引用注释
  // 可将 .map 文件单独上传到 Sentry 等错误监控平台
  devtool: 'hidden-source-map',
}
```

:::

## 四、开发与生产配置分离

随着项目复杂度提升，建议将 Webpack 配置拆分为多个文件，使用 `webpack-merge` 合并公共配置。

### 1. 配置文件结构

```
project/
├── config/
│   ├── webpack.common.js   # 公共配置
│   ├── webpack.dev.js      # 开发环境配置
│   └── webpack.prod.js     # 生产环境配置
├── src/
└── package.json
```

::: details 配置分离完整示例

```js
// config/webpack.common.js — 公共配置
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, '../dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|webp)$/,
        type: 'asset',
        parser: { dataUrlCondition: { maxSize: 8 * 1024 } },
        generator: { filename: 'images/[hash:8][ext]' },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@': path.resolve(__dirname, '../src'),
    },
  },
}
```

```js
// config/webpack.dev.js — 开发环境配置
const { merge } = require('webpack-merge')
const common = require('./webpack.common')

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  output: {
    filename: 'js/[name].js',
  },
  cache: {
    type: 'filesystem',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  devServer: {
    port: 3000,
    hot: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
    historyApiFallback: true,
  },
})
```

```js
// config/webpack.prod.js — 生产环境配置
const { merge } = require('webpack-merge')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const common = require('./webpack.common')

module.exports = merge(common, {
  mode: 'production',
  devtool: 'hidden-source-map',
  output: {
    filename: 'js/[name].[contenthash:8].js',
    chunkFilename: 'js/[name].[contenthash:8].chunk.js',
    publicPath: '/',
  },
  cache: {
    type: 'filesystem',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css',
    }),
  ],
  optimization: {
    minimizer: [
      new TerserPlugin({ parallel: true }),
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'initial',
          priority: -10,
        },
      },
    },
    runtimeChunk: 'single',
  },
})
```

:::

## 五、环境变量

### 1. .env 文件与 cross-env

`cross-env` 解决了跨平台（Windows/macOS/Linux）设置环境变量的兼容性问题：

```bash
npm install -D cross-env dotenv-webpack
```

::: details .env 文件与 cross-env 配置

```bash
# .env.development
NODE_ENV=development
API_BASE_URL=http://localhost:8080/api
ENABLE_MOCK=true
```

```bash
# .env.production
NODE_ENV=production
API_BASE_URL=https://api.example.com
ENABLE_MOCK=false
```

```json
// package.json
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development webpack serve --config config/webpack.dev.js",
    "build": "cross-env NODE_ENV=production webpack --config config/webpack.prod.js",
    "build:staging": "cross-env NODE_ENV=staging webpack --config config/webpack.prod.js"
  }
}
```

```js
// config/webpack.common.js
const Dotenv = require('dotenv-webpack')

module.exports = {
  plugins: [
    new Dotenv({
      path: `.env.${process.env.NODE_ENV || 'development'}`,
      systemvars: true,
    }),
  ],
}
```

在业务代码中访问：

```js
// src/api/config.js
export const API_BASE_URL = process.env.API_BASE_URL
export const IS_MOCK = process.env.ENABLE_MOCK === 'true'
```

:::

::: tip Webpack 5 + dotenv 注意事项
Webpack 5 移除了 Node.js 核心模块的自动 polyfill（如 `process`）。使用 `process.env` 时需要通过 `DefinePlugin` 或 `dotenv-webpack` 显式注入，而不能依赖自动 polyfill。
:::
