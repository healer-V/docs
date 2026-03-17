---
title: "Webpack 概述"
category: "工程化 · Webpack"
tags:
  - Webpack
  - 构建工具
  - 工程化
date: 2026-03-17
---

# Webpack 概述

Webpack 是目前最主流的前端模块打包工具，它将项目中分散的模块及其依赖关系打包成浏览器可直接运行的静态资源。理解 Webpack 的核心概念是掌握现代前端工程化的基础。

## 一、Webpack 是什么

Webpack 是一个静态模块打包器（Static Module Bundler）。当 Webpack 处理你的应用程序时，它会从一个或多个入口点出发，递归构建一张依赖图（Dependency Graph），最终将项目所需的每个模块打包成一个或多个 Bundle 文件。

Webpack 本身只能处理 JavaScript 和 JSON 文件，处理其他类型的文件（CSS、图片、TypeScript 等）需要通过 Loader 进行转换，而 Plugin 则扩展了 Webpack 的构建能力。

::: tip 为什么需要模块打包器
浏览器原生支持 ES Modules，但在生产环境中，大量的模块请求会造成网络开销。Webpack 将模块合并、压缩、优化，显著提升页面加载性能。
:::

## 二、核心概念

理解以下 7 个核心概念，是使用 Webpack 的前提。

### 1. Entry（入口）

Entry 告诉 Webpack 从哪个模块开始构建依赖图。默认值为 `./src/index.js`。可配置单入口或多入口。

### 2. Output（输出）

Output 告诉 Webpack 在哪里输出打包后的 Bundle，以及如何命名。默认输出路径为 `./dist`。

### 3. Loader（加载器）

Webpack 默认只能处理 JavaScript 和 JSON。Loader 使 Webpack 能够处理其他类型的文件，将它们转换为有效的模块，添加到依赖图中。Loader 本质上是一个函数，接收文件内容，返回转换后的内容。

### 4. Plugin（插件）

Plugin 用于执行 Loader 无法完成的更广泛的任务，如打包优化、资源管理、环境变量注入等。Plugin 通过监听 Webpack 构建生命周期的钩子来扩展能力。

### 5. Mode（模式）

Mode 有三个可选值：`development`（开发）、`production`（生产）、`none`。设置 Mode 后，Webpack 会自动启用对应模式下的内置优化。

| Mode | 特性 |
|------|------|
| `development` | 开启 NamedChunksPlugin、NamedModulesPlugin，便于调试 |
| `production` | 开启代码压缩、Tree Shaking、Scope Hoisting 等优化 |
| `none` | 不使用任何默认优化选项 |

### 6. Chunk（代码块）

Chunk 是 Webpack 内部处理过程中的代码块概念。一个 Chunk 由多个模块组成，是打包过程中的中间产物。

### 7. Bundle（包）

Bundle 是 Webpack 最终输出的文件。通常一个 Chunk 对应一个 Bundle，但也可以配置多个 Chunk 合并为一个 Bundle。

::: tip Chunk vs Bundle 的区别
Chunk 是 Webpack 构建过程中的逻辑概念，Bundle 是最终输出到磁盘的文件。大多数情况下一一对应，但使用 SourceMap 时一个 Chunk 会对应多个文件。
:::

## 三、Webpack vs Vite vs Rollup 对比

| 维度 | Webpack | Vite | Rollup |
|------|---------|------|--------|
| 定位 | 通用模块打包器 | 下一代前端开发与构建工具 | JavaScript 模块打包器 |
| 开发模式 | Bundle Dev Server | 基于原生 ESM 的 No-Bundle | 不侧重开发服务器 |
| 冷启动速度 | 较慢（需全量打包） | 极快（按需编译） | 慢 |
| HMR 速度 | 受模块数量影响 | 极快（模块级 HMR） | 较慢 |
| 生产构建 | 功能完善，生态丰富 | 底层使用 Rollup 打包 | 输出极简，适合库打包 |
| 代码分割 | 强大，配置灵活 | 支持 | 支持 |
| 生态插件 | 极其丰富（历史悠久） | 快速增长（兼容 Rollup 插件） | 丰富（专注于库） |
| 配置复杂度 | 高 | 低 | 中 |
| 适合场景 | 复杂企业级应用 | 现代前端应用 | 库/工具包开发 |
| Tree Shaking | 支持（需 ESM） | 支持 | 原生支持，效果最佳 |
| 学习曲线 | 陡峭 | 平缓 | 中等 |

::: warning 如何选择
- 新项目首选 **Vite**，开发体验极佳
- 复杂遗留项目或需要高度定制化的工程，选 **Webpack**
- 开发 npm 库/工具包，选 **Rollup**
:::

## 四、Webpack 适用场景

### 1. 复杂企业级应用

Webpack 对大型单页应用的支持成熟稳定，代码分割、懒加载、持久化缓存等功能配置灵活，适合团队规模大、定制需求多的项目。

### 2. 遗留项目维护

大量存量项目（Vue CLI 2/3、Create React App 等）基于 Webpack 构建，迁移成本高，继续使用 Webpack 更稳妥。

### 3. 多页应用（MPA）

Webpack 的多入口配置天然适合多页应用，可以为每个页面生成独立的 Bundle，并通过 `HtmlWebpackPlugin` 生成对应的 HTML 文件。

### 4. 需要深度定制构建流程

Webpack 的 Loader 和 Plugin 机制几乎可以定制构建流程的每个环节，适合有特殊构建需求的场景（如国际化资源处理、自定义模块解析规则等）。

::: details Webpack 基础配置示例

```js
// webpack.config.js
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  // 模式：development | production | none
  mode: 'production',

  // 入口
  entry: './src/index.js',

  // 输出
  output: {
    filename: 'bundle.[contenthash:8].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true, // 每次构建前清空 dist 目录
  },

  // Loader 配置
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'], // 从右到左执行
      },
    ],
  },

  // Plugin 配置
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html', // 以此 HTML 为模板
      filename: 'index.html',
    }),
  ],
}
```

:::
