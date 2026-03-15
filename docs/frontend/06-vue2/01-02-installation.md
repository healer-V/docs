---
title: "项目创建"
category: "前端 · Vue 2"
tags:
  - Vue
excerpt: "选择 Manually select features 可以自定义配置。 创建完成后，项目结构如下： 使用 Vue CLI 创建的项目，启动开发服务器： 打开浏览器访问 http://localhost:8080 查看应用。 构建后的文件默..."
---

# 项目创建

## 一、安装方式

### 1、CDN 引入（适合学习和小型项目）

```html
<!-- 开发版本，包含完整的警告和调试模式 -->
<script src="https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.js"></script>

<!-- 生产版本，优化了体积和速度 -->
<script src="https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.min.js"></script>
```

### 2、NPM 安装（推荐）
:::code-group
```bash [pnpm]
# pnpm 最新稳定版
pnpm install vue@2.6.14
```
```bash [yarn]
# 使用 yarn
yarn add vue@2.6.14
```
:::

### 3、Vue CLI 创建项目（推荐用于生产环境）
:::code-group
```bash
# 全局安装 Vue CLI
pnpm install -g @vue/cli
# 创建项目
vue create project-name
# 选择配置
# - 选择 Vue 2
# - 选择需要的特性（Babel, Router, Vuex, CSS Pre-processors等）
```
:::


## 二、使用 Vue CLI 创建项目

### 1、步骤 1：安装 Vue CLI
::: code-group
```bash [pnpm]
# 使用 pnpm
npm install -g @vue/cli
```
```bash [yarn]
# 或使用 yarn
yarn global add @vue/cli
```
:::

### 2、步骤 2：创建项目

```bash
vue create my-vue-app
```

### 3、步骤 3：选择预设

```
? Please pick a preset:
  Default ([Vue 2] babel, eslint)
  Default (Vue 3) ([Vue 3] babel, eslint)
  Manually select features
```

选择 `Manually select features` 可以自定义配置。

### 4、步骤 4：选择功能

```
? Check the features needed for your project:
 ◉ Babel
 ◉ TypeScript
 ◯ Progressive Web App (PWA) Support
 ◉ Router
 ◉ Vuex
 ◉ CSS Pre-processors
 ◉ Linter / Formatter
 ◯ Unit Testing
 ◯ E2E Testing
```

### 5、步骤 5：项目结构

创建完成后，项目结构如下：

```
my-vue-app/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── assets/
│   ├── components/
│   ├── router/
│   ├── store/
│   ├── App.vue
│   └── main.js
├── .gitignore
├── package.json
└── README.md
```

## 三、开发与构建

### 1、启动项目
使用 Vue CLI 创建的项目，启动开发服务器：
:::code-group
```bash [pnpm]
pnpm serve
```
```bash [yarn]
# yarn
yarn serve
```
:::

打开浏览器访问 `http://localhost:8080` 查看应用。

### 2、构建项目

:::code-group
```bash [pnpm]
pnpm build
```
```bash [yarn]
yarn build
```
:::
构建后的文件默认放置在 `dist/` 目录中。


## 四、项目配置

### 1、vue.config.js

在项目根目录创建 `vue.config.js` 进行自定义配置：

:::tip 配置说明
- **开发服务器配置**：`devServer` - 配置开发环境服务器选项
- **构建输出配置**：`outputDir`、`publicPath`、`assetsDir` - 控制构建输出
- **Webpack 配置**：`chainWebpack`、`configureWebpack` - 自定义 Webpack 配置
- **CSS 配置**：`css` - 配置 CSS 预处理器和提取选项
- **代理配置**：`devServer.proxy` - 配置 API 代理
- **路径别名**：`chainWebpack.resolve.alias` - 配置路径别名
- **生产优化**：`productionSourceMap`、`parallel` - 优化生产构建
:::

```javascript
const path = require('path')

function resolve(dir) {
  return path.join(__dirname, dir)
}

module.exports = {
  // ========== 开发服务器配置 ==========
  devServer: {
    // 端口号
    port: 3000,
    // 自动打开浏览器
    open: true,
    // 主机地址
    host: '0.0.0.0',
    // 启用 HTTPS
    https: false,
    // 热更新
    hot: true,
    // 编译错误时在浏览器中显示
    overlay: {
      warnings: false,
      errors: true
    },
    // API 代理配置
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    },
    // 开发服务器启动后执行
    onBeforeSetupMiddleware: function(devServer) {
      // 可以在这里添加自定义中间件
    }
  },

  // ========== 构建输出配置 ==========
  // 部署应用包时的基本 URL
  publicPath: process.env.NODE_ENV === 'production' 
    ? '/my-app/'  // 生产环境使用子路径
    : '/',        // 开发环境使用根路径
  
  // 构建输出目录
  outputDir: 'dist',
  
  // 静态资源目录（相对于 outputDir）
  assetsDir: 'static',
  
  // 构建时是否生成 index.html
  indexPath: 'index.html',
  
  // 文件名是否包含 hash（用于缓存控制）
  filenameHashing: true,

  // ========== Webpack 配置 ==========
  // 使用链式操作修改 Webpack 配置
  chainWebpack: config => {
    // 路径别名配置
    config.resolve.alias
      .set('@', resolve('src'))
      .set('@components', resolve('src/components'))
      .set('@utils', resolve('src/utils'))
      .set('@assets', resolve('src/assets'))
      .set('@views', resolve('src/views'))
      .set('@api', resolve('src/api'))
    
    // 生产环境优化
    if (process.env.NODE_ENV === 'production') {
      // 代码分割
      config.optimization.splitChunks({
        chunks: 'all',
        cacheGroups: {
          // 提取第三方库
          vendor: {
            name: 'chunk-vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'initial'
          },
          // 提取公共代码
          common: {
            name: 'chunk-common',
            minChunks: 2,
            priority: 5,
            chunks: 'initial',
            reuseExistingChunk: true
          }
        }
      })
    }
  },

  // 直接修改 Webpack 配置（与 chainWebpack 二选一）
  configureWebpack: {
    // 可以在这里添加 plugins、resolve 等配置
    // plugins: [...],
    // resolve: {...}
  },

  // ========== CSS 配置 ==========
  css: {
    // 是否将组件中的 CSS 提取到独立的 CSS 文件中
    extract: process.env.NODE_ENV === 'production',
    // 是否为 CSS 开启 source map
    sourceMap: false,
    // 向 CSS 相关的 loader 传递选项
    loaderOptions: {
      // 传递给 sass-loader 的选项
      sass: {
        // 全局引入变量和混入
        additionalData: `@import "@/styles/variables.scss";`
      },
      // 传递给 less-loader 的选项
      less: {
        lessOptions: {
          modifyVars: {
            // 自定义主题变量
            'primary-color': '#1890ff'
          },
          javascriptEnabled: true
        }
      },
      // 传递给 css-loader 的选项
      css: {
        // 启用 CSS Modules
        modules: {
          auto: /\.module\.\w+$/i,
          localIdentName: '[local]--[hash:base64:5]'
        }
      }
    }
  },

  // ========== 生产环境优化 ==========
  // 生产环境是否生成 sourceMap 文件
  productionSourceMap: false,
  
  // 是否为 Babel 或 TypeScript 使用 thread-loader
  parallel: require('os').cpus().length > 1,

  // ========== PWA 配置 ==========
  pwa: {
    name: 'My Vue App',
    themeColor: '#4DBA87',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      swSrc: 'src/service-worker.js'
    }
  },

  // ========== 其他配置 ==========
  // 是否在保存时通过 eslint-loader 进行代码检查
  lintOnSave: process.env.NODE_ENV !== 'production',
  
  // 是否使用包含运行时编译器的 Vue 构建版本
  runtimeCompiler: false,
  
  // 默认情况下 babel-loader 会忽略所有 node_modules 中的文件
  transpileDependencies: [],
  
  // 构建时启用/禁用 gzip 压缩大小报告
  // 如果你构建后的文件较大，设置为 true 可能会影响构建速度
  reportCompressedSize: false
}
```

### 2、配置项说明
::: info 详解
**1. 开发服务器配置（`devServer`）**
- `port`: 开发服务器端口
- `open`: 自动打开浏览器
- `proxy`: API 代理，解决跨域问题
- `hot`: 启用热模块替换（HMR）

**2. 路径别名（`chainWebpack`）**
- `@`: 指向 `src` 目录
- `@components`: 指向组件目录
- `@utils`: 指向工具函数目录
- 使用示例：`import utils from '@utils/index'`

**3. 代码分割（`splitChunks`）**
- 将第三方库和公共代码分离
- 减少主 bundle 大小
- 提高缓存效率

**4. CSS 预处理器配置**
- 支持 Sass、Less、Stylus
- 可配置全局变量和混入
- 支持 CSS Modules

**5. 生产环境优化**
- `productionSourceMap: false`: 不生成 source map，加快构建速度
- `parallel`: 启用多进程构建，提高构建速度
- `extract: true`: 提取 CSS 到独立文件
:::

### 3、常用配置场景

**场景 1：多环境配置**
```javascript
// .env.development
VUE_APP_API_BASE_URL=http://localhost:8080

// .env.production
VUE_APP_API_BASE_URL=https://api.example.com
```
```js
// vue.config.js
// 根据环境变量使用不同配置
const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = process.env.NODE_ENV === 'development'

module.exports = {
  publicPath: isProduction ? '/production-path/' : '/',
  devServer: {
    port: isDevelopment ? 3000 : 8080
  }
}
```

**场景 2：使用环境变量文件**
```javascript
// .env.development
VUE_APP_API_BASE_URL=http://localhost:8080

// .env.production
VUE_APP_API_BASE_URL=https://api.example.com
```
```js
// vue.config.js
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: process.env.VUE_APP_API_BASE_URL
      }
    }
  }
}
```

**场景 3：自定义 Webpack 插件**
```javascript
const webpack = require('webpack')

module.exports = {
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          CUSTOM_VAR: JSON.stringify('custom-value')
        }
      })
    ]
  }
}
```
