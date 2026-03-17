---
title: "Webpack 核心配置详解"
category: "工程化 · Webpack"
tags:
  - Webpack
  - 配置
  - Entry
  - Output
  - Loader
date: 2026-03-17
---

# Webpack 核心配置详解

`webpack.config.js` 是 Webpack 的核心配置文件，掌握 Entry、Output、Loader 等配置项的用法，是使用 Webpack 构建项目的基础。

## 一、webpack.config.js 整体结构

Webpack 配置文件导出一个对象（或函数），包含所有构建选项。常见的顶级字段如下：

::: details 完整配置结构总览

```js
// webpack.config.js
const path = require('path')

module.exports = {
  mode: 'production',        // 模式
  entry: './src/index.js',   // 入口
  output: { ... },           // 输出
  module: { rules: [...] },  // Loader 规则
  plugins: [...],            // 插件
  resolve: { ... },          // 模块解析
  optimization: { ... },     // 优化配置
  devServer: { ... },        // 开发服务器（需 webpack-dev-server）
  devtool: 'source-map',     // Source Map 类型
}
```

:::

当需要根据环境动态生成配置时，可以导出一个函数：

::: details 函数形式的配置

```js
// webpack.config.js
module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production'

  return {
    mode: argv.mode,
    devtool: isProduction ? false : 'eval-cheap-module-source-map',
    // 其他配置...
  }
}
```

:::

## 二、Entry 入口配置

Entry 定义 Webpack 构建依赖图的起点。

### 1. 单入口（单页应用）

```js
module.exports = {
  entry: './src/index.js',
  // 等价于
  entry: { main: './src/index.js' },
}
```

### 2. 多入口（多页应用）

多入口会生成多个 Bundle，适用于多页应用（MPA）。

::: details 多入口配置示例

```js
// webpack.config.js
module.exports = {
  entry: {
    // key 为 chunk 名称，value 为入口文件路径
    home: './src/pages/home/index.js',
    about: './src/pages/about/index.js',
    contact: './src/pages/contact/index.js',
  },
  output: {
    // [name] 对应 entry 的 key
    filename: '[name].[contenthash:8].js',
    path: path.resolve(__dirname, 'dist'),
  },
}
```

:::

### 3. 入口依赖预置

通过 `dependOn` 可以声明多个 Chunk 共享的依赖，避免重复打包：

::: details dependOn 共享依赖配置

```js
module.exports = {
  entry: {
    // app 和 admin 共享 shared 模块
    shared: ['react', 'react-dom'],
    app: {
      import: './src/app.js',
      dependOn: 'shared',
    },
    admin: {
      import: './src/admin.js',
      dependOn: 'shared',
    },
  },
}
```

:::

## 三、Output 输出配置

Output 控制 Webpack 如何输出编译后的文件。

### 1. 常用配置项

| 配置项 | 说明 | 示例值 |
|--------|------|--------|
| `filename` | 输出文件名 | `'[name].[contenthash:8].js'` |
| `path` | 输出目录（绝对路径） | `path.resolve(__dirname, 'dist')` |
| `publicPath` | 资源引用的基础路径 | `'/'` 或 `'https://cdn.example.com/'` |
| `clean` | 构建前清空输出目录 | `true` |
| `chunkFilename` | 非入口 Chunk 文件名 | `'[name].[contenthash:8].chunk.js'` |
| `assetModuleFilename` | 资源模块输出文件名 | `'assets/[hash][ext][query]'` |

### 2. 文件名占位符

| 占位符 | 说明 |
|--------|------|
| `[name]` | Chunk 名称（Entry 的 key） |
| `[id]` | Chunk 的内部 ID |
| `[hash]` | 每次构建生成的唯一 hash |
| `[contenthash]` | 基于文件内容的 hash，内容不变则 hash 不变 |
| `[chunkhash]` | 基于 Chunk 内容的 hash |
| `[ext]` | 资源文件扩展名 |

::: tip 推荐使用 contenthash
生产环境推荐使用 `[contenthash]`，文件内容不变时 hash 不变，浏览器可以持久缓存，只有内容变更的文件才会更新缓存。
:::

::: details 完整 Output 配置示例

```js
// webpack.config.js
const path = require('path')

module.exports = {
  output: {
    // JS 文件输出路径
    filename: 'js/[name].[contenthash:8].js',
    // 非入口 Chunk（动态导入）文件名
    chunkFilename: 'js/[name].[contenthash:8].chunk.js',
    // 输出目录
    path: path.resolve(__dirname, 'dist'),
    // CDN 或静态资源服务器前缀
    publicPath: '/',
    // 构建前清空 dist 目录（Webpack 5+）
    clean: true,
    // 资源模块（图片/字体）输出路径
    assetModuleFilename: 'assets/[hash:8][ext][query]',
  },
}
```

:::

## 四、Loader 机制

### 1. 转换原理

Loader 是一个导出函数的 Node.js 模块，接收文件内容字符串（或 Buffer），返回转换后的内容。Webpack 在遇到 `import` 或 `require` 引入非 JS/JSON 文件时，会按照 `module.rules` 中的匹配规则依次调用对应的 Loader。

```
源文件 → Loader A → Loader B → Loader C → 模块
```

### 2. 链式调用顺序

多个 Loader 以数组形式配置时，**从右到左**（从下到上）依次执行。前一个 Loader 的输出作为下一个 Loader 的输入。

```js
use: ['style-loader', 'css-loader', 'sass-loader']
// 执行顺序：sass-loader → css-loader → style-loader
```

::: warning 链式调用顺序不能颠倒
`sass-loader` 将 SCSS 编译为 CSS，`css-loader` 处理 CSS 中的 `@import` 和 `url()`，`style-loader` 将 CSS 注入 DOM。顺序错误会导致构建失败。
:::

### 3. 常用 Loader 汇总

| Loader | 用途 |
|--------|------|
| `babel-loader` | 将 ES6+ 语法转换为 ES5，支持 JSX |
| `css-loader` | 处理 CSS 文件中的 `@import` 和 `url()`，将 CSS 转为 JS 模块 |
| `style-loader` | 将 CSS 以 `<style>` 标签注入 DOM |
| `sass-loader` | 将 SCSS/SASS 编译为 CSS |
| `less-loader` | 将 Less 编译为 CSS |
| `postcss-loader` | 使用 PostCSS 处理 CSS（自动前缀、压缩等） |
| `file-loader` | 处理文件资源，输出到指定目录并返回 URL |
| `url-loader` | 小文件转 base64，大文件退回 file-loader |
| `ts-loader` | 将 TypeScript 编译为 JavaScript |
| `vue-loader` | 处理 `.vue` 单文件组件 |
| `thread-loader` | 多进程并行处理，加速构建 |
| `cache-loader` | 缓存 Loader 处理结果，加速二次构建 |

::: tip Webpack 5 内置资源模块
Webpack 5 新增了 Asset Modules，可以替代 `file-loader`、`url-loader`、`raw-loader`：
- `asset/resource`：输出文件，返回 URL（替代 `file-loader`）
- `asset/inline`：转为 base64 data URI（替代 `url-loader`）
- `asset/source`：返回文件源码字符串（替代 `raw-loader`）
- `asset`：自动选择，小于 8kb 转 base64，否则输出文件
:::

### 4. Loader 配置详解

::: details babel-loader 配置

```js
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,          // 匹配 JS 和 JSX 文件
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: '> 1%, last 2 versions', // 浏览器兼容目标
                useBuiltIns: 'usage',             // 按需引入 polyfill
                corejs: 3,
              }],
              '@babel/preset-react',              // 处理 JSX
            ],
            // 开启 babel-loader 缓存，加速二次构建
            cacheDirectory: true,
          },
        },
        exclude: /node_modules/,      // 排除 node_modules
      },
    ],
  },
}
```

:::

::: details CSS/SCSS 完整处理链配置

```js
// webpack.config.js
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
  module: {
    rules: [
      {
        test: /\.(css|scss)$/,
        use: [
          // 生产环境提取为独立 CSS 文件，开发环境注入 style 标签
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2, // css-loader 前有 2 个 loader（postcss + sass）
              modules: false,   // 是否开启 CSS Modules
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: ['autoprefixer'], // 自动添加浏览器前缀
              },
            },
          },
          'sass-loader',
        ],
      },
    ],
  },
}
```

:::

::: details 图片/字体资源模块配置（Webpack 5）

```js
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        // 图片资源
        test: /\.(png|jpg|jpeg|gif|svg|webp)$/,
        type: 'asset',                // 自动选择处理方式
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024,        // 小于 8KB 转为 base64
          },
        },
        generator: {
          filename: 'images/[hash:8][ext][query]', // 输出路径
        },
      },
      {
        // 字体文件
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[hash:8][ext][query]',
        },
      },
    ],
  },
}
```

:::

### 5. Loader 配置字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `test` | `RegExp` | 匹配需要处理的文件，通常匹配扩展名 |
| `use` | `string \| object \| array` | 指定使用的 Loader，数组时从右到左执行 |
| `exclude` | `RegExp \| string` | 排除不需要处理的目录（如 `node_modules`） |
| `include` | `RegExp \| string` | 只处理指定目录下的文件，与 `exclude` 互斥 |
| `options` | `object` | 传递给 Loader 的配置参数 |
| `enforce` | `'pre' \| 'post'` | 控制 Loader 执行顺序，`pre` 最先执行 |
| `resourceQuery` | `RegExp` | 匹配资源查询字符串（如 `?raw`） |

::: tip include 和 exclude 的优先级
两者同时存在时，`include` 优先级高于 `exclude`。建议只使用一个，优先使用 `include` 精确指定处理范围，可以减少不必要的 Loader 调用，提升构建速度。
:::
