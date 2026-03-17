---
title: "Webpack 插件系统"
category: "工程化 · Webpack"
tags:
  - Webpack
  - Plugin
  - HtmlWebpackPlugin
  - 优化
date: 2026-03-17
---

# Webpack 插件系统

Plugin 是 Webpack 的支柱功能，它比 Loader 更强大，可以介入 Webpack 构建的整个生命周期，完成代码压缩、资源管理、环境变量注入等 Loader 无法实现的任务。

## 一、Plugin 原理

### 1. Tapable 钩子系统

Webpack 的插件机制基于 [Tapable](https://github.com/webpack/tapable) 库实现。Tapable 提供了一套发布/订阅模式的钩子系统，Webpack 在构建的不同阶段会触发对应的钩子，Plugin 通过注册这些钩子来介入构建流程。

Webpack 的构建流程本质上是一系列钩子的触发过程：

```
初始化 → 编译开始 → 模块解析 → 模块构建 → 代码生成 → 输出文件
  ↓           ↓          ↓          ↓          ↓          ↓
environment  make    buildModule  seal     afterCompile  emit
```

### 2. Plugin 的基本结构

一个合法的 Webpack Plugin 必须是一个包含 `apply` 方法的类（或对象）：

::: details 自定义 Plugin 示例

```js
// plugins/MyPlugin.js
class MyPlugin {
  constructor(options = {}) {
    this.options = options
  }

  // Webpack 会调用 apply 方法，并将 compiler 对象传入
  apply(compiler) {
    // 注册 emit 钩子（在输出文件到 dist 目录之前触发）
    compiler.hooks.emit.tapAsync('MyPlugin', (compilation, callback) => {
      // compilation 包含当前构建的所有信息（模块、chunk、资源等）
      const assets = compilation.assets

      // 遍历所有输出文件
      Object.keys(assets).forEach((filename) => {
        if (filename.endsWith('.js')) {
          const source = assets[filename].source()
          console.log(`[MyPlugin] 处理文件: ${filename}，大小: ${source.length} bytes`)
        }
      })

      callback() // 必须调用，否则构建会挂起
    })
  }
}

module.exports = MyPlugin
```

:::

::: tip compiler 与 compilation 的区别
- `compiler`：代表整个 Webpack 实例，包含全部配置信息，在整个构建过程中只有一个
- `compilation`：代表一次具体的构建过程（每次文件变化都会产生新的 compilation），包含模块、依赖、chunk 等信息
:::

## 二、常用 Plugin 详解

### 1. HtmlWebpackPlugin

自动生成 HTML 文件，并将打包后的 JS/CSS 文件自动注入其中。这是开发单页应用最常用的插件。

::: details HtmlWebpackPlugin 配置示例

```js
// webpack.config.js
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',  // HTML 模板文件路径
      filename: 'index.html',           // 输出文件名
      title: 'My Application',         // 注入到模板的 title（需模板中使用 <%= htmlWebpackPlugin.options.title %>）
      favicon: './public/favicon.ico',  // favicon 路径
      chunks: ['main'],                 // 指定注入哪些 chunk（多入口时有用）
      minify: {
        removeComments: true,           // 移除 HTML 注释
        collapseWhitespace: true,       // 折叠空白字符
        removeAttributeQuotes: true,    // 移除属性引号
      },
    }),
  ],
}
```

多页应用为每个页面创建独立的 HTML：

```js
// webpack.config.js — 多页应用
const pages = ['home', 'about', 'contact']

module.exports = {
  entry: Object.fromEntries(
    pages.map(name => [name, `./src/pages/${name}/index.js`])
  ),
  plugins: pages.map(name =>
    new HtmlWebpackPlugin({
      template: `./src/pages/${name}/index.html`,
      filename: `${name}.html`,
      chunks: [name],  // 每个 HTML 只注入对应页面的 chunk
    })
  ),
}
```

:::

### 2. MiniCssExtractPlugin

将 CSS 从 JS Bundle 中提取为独立的 CSS 文件，替代 `style-loader`（生产环境使用）。提取后的 CSS 可以被浏览器并行加载，并支持独立缓存。

::: details MiniCssExtractPlugin 配置示例

```js
// webpack.config.js
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,  // 替代 style-loader
          'css-loader',
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css',          // 入口 CSS 文件名
      chunkFilename: 'css/[name].[contenthash:8].chunk.css', // 异步 CSS 文件名
    }),
  ],
  optimization: {
    minimizer: [
      '...',              // 保留 JS 默认压缩器（TerserPlugin）
      new CssMinimizerPlugin(), // 压缩 CSS
    ],
  },
}
```

:::

### 3. DefinePlugin

在编译时将代码中的变量替换为指定的值，常用于注入环境变量、特性开关等。这是 Webpack 内置插件，无需安装。

::: details DefinePlugin 环境变量注入

```js
// webpack.config.js
const { DefinePlugin } = require('webpack')

module.exports = {
  plugins: [
    new DefinePlugin({
      // 注意：值会被当作代码片段直接替换，字符串需要用 JSON.stringify
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.API_BASE_URL': JSON.stringify('https://api.example.com'),
      __DEV__: process.env.NODE_ENV !== 'production',
      __APP_VERSION__: JSON.stringify(require('./package.json').version),
    }),
  ],
}
```

在业务代码中直接使用：

```js
// src/api/request.js
const BASE_URL = process.env.API_BASE_URL // 编译后直接替换为字符串

if (__DEV__) {
  console.log('当前版本:', __APP_VERSION__)
}
```

:::

::: warning DefinePlugin 的值是代码字符串
`DefinePlugin` 的值是代码字符串，不是字面量。`'"hello"'` 会被替换为 `"hello"`（字符串），而 `'hello'` 会被替换为标识符 `hello`（变量名）。字符串值一定要用 `JSON.stringify` 包裹。
:::

### 4. CopyWebpackPlugin

将指定目录或文件复制到输出目录，常用于复制不需要经过 Webpack 处理的静态资源（如 `public` 目录下的文件）。

::: details CopyWebpackPlugin 配置示例

```js
// webpack.config.js
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public',          // 源目录（相对于 webpack.config.js）
          to: '.',                 // 目标目录（相对于 output.path）
          globOptions: {
            ignore: ['**/index.html'], // 排除 index.html（由 HtmlWebpackPlugin 处理）
          },
        },
        {
          from: 'src/assets/icons', // 复制 icons 目录
          to: 'icons',
        },
      ],
    }),
  ],
}
```

:::

### 5. BannerPlugin

在每个生成的 Chunk 文件顶部添加注释（Banner），常用于添加版权信息或构建信息。内置插件，无需安装。

::: details BannerPlugin 配置示例

```js
// webpack.config.js
const { BannerPlugin } = require('webpack')

module.exports = {
  plugins: [
    new BannerPlugin({
      banner: `
/*!
 * My Application v${require('./package.json').version}
 * Build: ${new Date().toISOString()}
 * Copyright (c) ${new Date().getFullYear()} Example Corp.
 */
      `.trim(),
      raw: true,   // true 表示 banner 内容原样输出，不包裹注释符号
    }),
  ],
}
```

:::

### 6. CompressionPlugin

对输出文件进行 Gzip 或 Brotli 压缩，生成 `.gz` / `.br` 文件，配合 Nginx 的静态文件压缩可以大幅减少传输体积。

::: details CompressionPlugin 配置示例

```js
// webpack.config.js
const CompressionPlugin = require('compression-webpack-plugin')

module.exports = {
  plugins: [
    // Gzip 压缩
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,  // 压缩 JS、CSS、HTML、SVG
      threshold: 10240,              // 仅压缩大于 10KB 的文件
      minRatio: 0.8,                 // 压缩率大于 0.8 才输出压缩文件
      filename: '[path][base].gz',   // 输出文件名
    }),
    // Brotli 压缩（压缩率更高，现代浏览器支持）
    new CompressionPlugin({
      algorithm: 'brotliCompress',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
      filename: '[path][base].br',
    }),
  ],
}
```

配合 Nginx 开启静态文件压缩：

```nginx
# nginx.conf
gzip_static on;   # 优先使用 .gz 文件
brotli_static on; # 优先使用 .br 文件（需 ngx_brotli 模块）
```

:::

### 7. BundleAnalyzerPlugin

可视化分析打包结果，以树图方式展示每个模块的体积占比，帮助你找出可以优化的依赖。

::: details BundleAnalyzerPlugin 配置示例

```js
// webpack.config.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = {
  plugins: [
    // 只在分析模式下启用，避免影响正常构建
    process.env.ANALYZE && new BundleAnalyzerPlugin({
      analyzerMode: 'server',    // server | static | json | disabled
      openAnalyzer: true,        // 构建后自动打开浏览器
      reportFilename: 'report.html',
    }),
  ].filter(Boolean), // 过滤掉 false 值
}
```

在 `package.json` 中添加分析命令：

```json
{
  "scripts": {
    "build": "webpack --mode production",
    "analyze": "ANALYZE=true webpack --mode production"
  }
}
```

:::

## 三、环境变量注入

### 1. 通过 DefinePlugin 注入（推荐）

前文已介绍，这是最常用的方式，适合注入少量已知的环境变量。

### 2. 通过 dotenv 读取 .env 文件

配合 `dotenv-webpack` 插件，可以自动读取 `.env` 文件中的变量：

::: details dotenv-webpack 配置示例

```bash
# .env.production
API_BASE_URL=https://api.example.com
ENABLE_ANALYTICS=true
```

```js
// webpack.config.js
const Dotenv = require('dotenv-webpack')

module.exports = {
  plugins: [
    new Dotenv({
      path: `./.env.${process.env.NODE_ENV}`, // 根据环境加载对应文件
      safe: true,   // 检查 .env.example 中声明的变量是否都已定义
      systemvars: true, // 允许使用系统环境变量
    }),
  ],
}
```

:::

## 四、CSS 提取与压缩

生产环境推荐将 CSS 提取为独立文件并进行压缩，详见 MiniCssExtractPlugin 一节。以下是完整的生产环境 CSS 处理配置：

::: details 生产环境 CSS 完整配置

```js
// webpack.prod.js
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.(css|scss)$/,
        use: [
          MiniCssExtractPlugin.loader, // 提取为独立文件
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ],
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
      new TerserPlugin({            // JS 压缩（Webpack 5 默认已包含）
        parallel: true,             // 开启多进程压缩
        terserOptions: {
          compress: {
            drop_console: true,     // 移除 console.log
          },
        },
      }),
      new CssMinimizerPlugin(),     // CSS 压缩
    ],
  },
}
```

:::
