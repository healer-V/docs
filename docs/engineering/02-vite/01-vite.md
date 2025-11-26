# 拆掉 Vite 外壳，原理剖析

## 一、Vite 概述

::: tip Vite 是什么
Vite（法语意为"快速"）是一个由 Vue.js 作者尤雨溪开发的下一代前端构建工具。它利用浏览器原生 ES 模块和现代构建工具，提供了极速的开发体验。
:::

### 1、Vite 的核心特点

::: info 核心优势
- ⚡ **极速启动**：基于 ES 模块，无需打包即可启动开发服务器
- 🔥 **热更新（HMR）**：毫秒级的热模块替换
- 📦 **按需编译**：只编译当前页面需要的模块
- 🛠️ **开箱即用**：支持 TypeScript、JSX、CSS 预处理器等
- 🎯 **生产优化**：基于 Rollup 的优化构建
:::

### 2、Vite vs Webpack

::: details 点击查看对比表

| 特性 | Vite | Webpack |
|------|------|---------|
| **启动速度** | 毫秒级 | 秒级（需要打包） |
| **HMR 速度** | 毫秒级 | 秒级 |
| **开发模式** | 原生 ES 模块 | 打包后运行 |
| **构建工具** | Rollup | Webpack |
| **配置复杂度** | 简单 | 复杂 |
| **生态** | 快速成长 | 成熟稳定 |

:::

## 二、Vite 核心原理

### 1、ES 模块（ESM）机制

#### 1.1、浏览器原生支持

```javascript
// 传统方式（需要打包）
import { add } from './utils.js';
// 打包后：所有代码合并到一个文件

// Vite 方式（无需打包）
import { add } from './utils.js';
// 浏览器直接请求 ./utils.js 文件
```

::: tip ES 模块的优势
- 浏览器原生支持，无需打包即可运行
- 按需加载，只加载需要的模块
- 支持动态导入 `import()`
:::

#### 1.2、模块依赖图

```
index.html
  └── main.js
      ├── utils.js
      ├── component.js
      │   └── style.css
      └── api.js
```

Vite 在开发模式下：
1. 服务器启动时，不进行打包
2. 浏览器请求 `main.js` 时，返回源码
3. 浏览器解析 `import` 语句，再次请求对应模块
4. 服务器按需编译并返回

### 2、开发服务器原理

#### 2.1、请求拦截与转换

```typescript
// Vite 开发服务器核心逻辑（简化版）
import { createServer } from 'vite';

const server = createServer({
  // 拦截请求
  middlewareMode: false,
  // 转换模块
  transformMode: {
    web: [/\.[jt]sx?$/, /\.vue$/],
  },
});

// 请求处理流程
server.on('request', async (req, res) => {
  const url = req.url;
  
  // 1. 如果是 HTML，直接返回
  if (url === '/index.html') {
    return serveHTML(req, res);
  }
  
  // 2. 如果是 JS/TS，进行转换
  if (url.endsWith('.js') || url.endsWith('.ts')) {
    const code = await transformModule(url);
    return res.end(code);
  }
  
  // 3. 如果是 CSS，注入 HMR 代码
  if (url.endsWith('.css')) {
    const css = await transformCSS(url);
    return res.end(css);
  }
});
```

#### 2.2、模块转换流程

::: info 转换步骤
1. **请求拦截**：拦截浏览器对模块的请求
2. **依赖分析**：分析模块的依赖关系
3. **代码转换**：将 TypeScript、JSX、Vue 等转换为浏览器可执行的 JavaScript
4. **返回结果**：将转换后的代码返回给浏览器
:::

### 3、热模块替换（HMR）原理

#### 3.1、WebSocket 通信

```typescript
// HMR 核心流程
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 24678 });

// 监听文件变化
chokidar.watch('src').on('change', (file) => {
  // 1. 找到受影响的模块
  const affectedModules = getAffectedModules(file);
  
  // 2. 通过 WebSocket 通知客户端
  wss.clients.forEach((client) => {
    client.send(JSON.stringify({
      type: 'update',
      updates: affectedModules.map(module => ({
        type: 'js-update',
        path: module.path,
        acceptedPath: module.path,
        timestamp: Date.now(),
      })),
    }));
  });
});
```

#### 3.2、客户端更新逻辑

```javascript
// 客户端 HMR 处理（浏览器端）
if (import.meta.hot) {
  import.meta.hot.accept('./component.js', (newModule) => {
    // 1. 接收新模块
    // 2. 替换旧模块
    // 3. 重新渲染组件（保持状态）
    updateComponent(newModule);
  });
}
```

::: warning HMR 边界
- 如果模块没有 HMR 处理函数，会向上冒泡
- 如果到达入口文件仍无处理，会刷新页面
- 需要合理设置 HMR 边界
:::

## 三、Vite 架构设计

### 1、插件系统

#### 1.1、插件钩子

```typescript
// Vite 插件接口
interface Plugin {
  name: string;
  // 构建前
  buildStart?: () => void;
  // 解析模块
  resolveId?: (id: string) => string | null;
  // 加载模块
  load?: (id: string) => string | null;
  // 转换代码
  transform?: (code: string, id: string) => string | null;
  // 构建后
  buildEnd?: () => void;
}
```

#### 1.2、插件执行顺序

```
1. 配置解析插件（config）
2. 别名解析插件（alias）
3. 模块解析插件（resolve）
4. 代码转换插件（transform）
5. 构建优化插件（optimize）
```

### 2、依赖预构建

#### 2.1、为什么需要预构建

::: tip 预构建的原因
- **CommonJS 兼容**：将 CommonJS 转换为 ES 模块
- **性能优化**：将多个小文件合并，减少 HTTP 请求
- **依赖稳定**：锁定依赖版本，避免版本冲突
:::

#### 2.2、预构建流程

```typescript
// Vite 预构建逻辑
async function optimizeDeps(config) {
  // 1. 扫描依赖
  const deps = await scanImports(config);
  
  // 2. 使用 esbuild 打包
  const result = await esbuild.build({
    entryPoints: deps,
    format: 'esm',
    bundle: true,
    outdir: 'node_modules/.vite',
  });
  
  // 3. 生成元数据
  await writeManifest({
    hash: getHash(deps),
    optimized: result.metafile,
  });
}
```

### 3、构建优化

#### 3.1、代码分割

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // 手动代码分割
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'utils': ['./src/utils'],
        },
        // 自动代码分割
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
  },
});
```

#### 3.2、Tree Shaking

::: info Tree Shaking 原理
- 静态分析代码，找出未使用的导出
- 在构建时移除死代码
- 基于 ES 模块的静态结构
:::

```javascript
// 源文件
export function used() {
  return 'used';
}

export function unused() {
  return 'unused';
}

// 使用文件
import { used } from './module.js';
console.log(used());

// 构建后（unused 被移除）
function used() {
  return 'used';
}
console.log(used());
```

## 四、源码解析

### 1、入口文件分析

#### 1.1、createServer 函数

```typescript
// packages/vite/src/node/server/index.ts
export async function createServer(
  inlineConfig: InlineConfig = {}
): Promise<ViteDevServer> {
  // 1. 解析配置
  const config = await resolveConfig(inlineConfig, 'serve');
  
  // 2. 创建插件容器
  const plugins = await resolvePlugins(config, 'serve');
  const pluginContainer = createPluginContainer(plugins);
  
  // 3. 创建模块图
  const moduleGraph = new ModuleGraph(pluginContainer);
  
  // 4. 创建 WebSocket 服务器（HMR）
  const ws = createWebSocketServer(server, config);
  
  // 5. 创建开发服务器
  const server = await resolveServerOptions(config);
  
  // 6. 设置中间件
  setupMiddlewares(server, {
    config,
    pluginContainer,
    moduleGraph,
    ws,
  });
  
  return {
    config,
    pluginContainer,
    moduleGraph,
    ws,
    ...server,
  };
}
```

#### 1.2、请求处理中间件

```typescript
// packages/vite/src/node/server/middlewares/index.ts
export function setupMiddlewares(
  server: Connect.Server,
  options: ServerOptions
) {
  // 1. HTML 处理
  server.use(htmlMiddleware(options));
  
  // 2. 模块转换
  server.use(transformMiddleware(options));
  
  // 3. 静态资源
  server.use(serveStaticMiddleware(options));
  
  // 4. 404 处理
  server.use(errorMiddleware(options));
}
```

### 2、模块转换核心

#### 2.1、transformRequest 函数

```typescript
// packages/vite/src/node/server/transformRequest.ts
export async function transformRequest(
  url: string,
  server: ViteDevServer
): Promise<TransformResult | null> {
  // 1. 解析模块 ID
  const id = (await pluginContainer.resolveId(url))?.id || url;
  
  // 2. 加载模块
  const loadResult = await pluginContainer.load(id);
  if (loadResult) {
    return loadResult;
  }
  
  // 3. 转换代码
  const code = await fs.readFile(id, 'utf-8');
  const transformResult = await pluginContainer.transform(code, id);
  
  return {
    code: transformResult?.code || code,
    map: transformResult?.map,
  };
}
```

#### 2.2、插件容器

```typescript
// packages/vite/src/node/plugins/pluginContainer.ts
export function createPluginContainer(plugins: Plugin[]): PluginContainer {
  return {
    async resolveId(id: string) {
      for (const plugin of plugins) {
        if (plugin.resolveId) {
          const result = await plugin.resolveId(id);
          if (result) return result;
        }
      }
      return null;
    },
    
    async load(id: string) {
      for (const plugin of plugins) {
        if (plugin.load) {
          const result = await plugin.load(id);
          if (result) return result;
        }
      }
      return null;
    },
    
    async transform(code: string, id: string) {
      for (const plugin of plugins) {
        if (plugin.transform) {
          const result = await plugin.transform(code, id);
          if (result) {
            code = typeof result === 'string' ? result : result.code;
          }
        }
      }
      return { code };
    },
  };
}
```

## 五、性能优化原理

### 1、依赖预构建优化

#### 1.1、缓存机制

```typescript
// 依赖预构建缓存
const cacheDir = path.join(root, 'node_modules/.vite');
const manifestPath = path.join(cacheDir, '_metadata.json');

async function getCachedMetadata() {
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    // 检查依赖是否变化
    if (manifest.hash === getDepsHash()) {
      return manifest;
    }
  }
  return null;
}
```

#### 1.2、并行构建

```typescript
// 使用 esbuild 并行构建
const deps = Object.keys(dependencies);
const chunks = chunkArray(deps, os.cpus().length);

await Promise.all(
  chunks.map(chunk =>
    esbuild.build({
      entryPoints: chunk,
      // ... 配置
    })
  )
);
```

### 2、HMR 优化

#### 2.1、增量更新

```typescript
// 只更新变化的模块
function getAffectedModules(changedFile: string): string[] {
  const module = moduleGraph.getModuleById(changedFile);
  if (!module) return [];
  
  // 找到所有依赖此模块的模块
  const affected = new Set<string>();
  const queue = [module];
  
  while (queue.length) {
    const current = queue.shift()!;
    affected.add(current.id);
    
    // 添加所有导入此模块的模块
    for (const importer of current.importers) {
      if (!affected.has(importer.id)) {
        queue.push(importer);
      }
    }
  }
  
  return Array.from(affected);
}
```

#### 2.2、批量更新

```typescript
// 批量发送更新，减少 WebSocket 消息
let updateQueue: Update[] = [];
let updateTimer: NodeJS.Timeout | null = null;

function queueUpdate(update: Update) {
  updateQueue.push(update);
  
  if (!updateTimer) {
    updateTimer = setTimeout(() => {
      sendBatchUpdates(updateQueue);
      updateQueue = [];
      updateTimer = null;
    }, 10); // 10ms 内的更新合并
  }
}
```

## 六、实战：手写简化版 Vite

### 1、项目结构

```
mini-vite/
├── src/
│   ├── server/
│   │   ├── index.ts        # 服务器入口
│   │   ├── middleware.ts   # 中间件
│   │   └── transform.ts    # 模块转换
│   └── client/
│       └── hmr.ts          # HMR 客户端
├── package.json
└── tsconfig.json
```

### 2、开发服务器实现

```typescript
// src/server/index.ts
import express from 'express';
import { createServer as createViteServer } from 'vite';

async function createServer() {
  const app = express();
  
  // 创建 Vite 服务器
  const vite = await createViteServer({
    server: { middlewareMode: true },
  });
  
  // 使用 Vite 中间件
  app.use(vite.ssrLoadModule);
  
  app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
  });
}

createServer();
```

### 3、模块转换实现

```typescript
// src/server/transform.ts
import { transformSync } from 'esbuild';
import { readFileSync } from 'fs';

export function transformModule(id: string, code: string) {
  // 1. TypeScript 转换
  if (id.endsWith('.ts') || id.endsWith('.tsx')) {
    const result = transformSync(code, {
      loader: id.endsWith('.tsx') ? 'tsx' : 'ts',
      target: 'esnext',
      format: 'esm',
    });
    return result.code;
  }
  
  // 2. JSX 转换
  if (id.endsWith('.jsx')) {
    const result = transformSync(code, {
      loader: 'jsx',
      jsxFactory: 'React.createElement',
      format: 'esm',
    });
    return result.code;
  }
  
  return code;
}
```

### 4、HMR 实现

```typescript
// src/server/hmr.ts
import { WebSocketServer } from 'ws';
import chokidar from 'chokidar';

export function setupHMR(server: any, root: string) {
  const wss = new WebSocketServer({ server });
  
  // 监听文件变化
  const watcher = chokidar.watch(root, {
    ignored: /node_modules/,
  });
  
  watcher.on('change', (file) => {
    // 通知所有客户端
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'update',
          path: file,
        }));
      }
    });
  });
}
```

## 七、总结

### 1、Vite 核心优势

::: tip 关键点
1. **ES 模块**：利用浏览器原生能力，无需打包
2. **按需编译**：只编译当前需要的模块
3. **插件系统**：灵活的插件机制
4. **HMR**：快速的热模块替换
5. **构建优化**：基于 Rollup 的生产构建
:::

### 2、适用场景

::: info 推荐使用 Vite
- ✅ 新项目开发
- ✅ 需要快速启动的项目
- ✅ 使用现代框架（Vue 3、React、Svelte）
- ✅ 需要快速 HMR 的开发体验
:::

::: warning 考虑其他方案
- ❌ 需要兼容旧浏览器的项目
- ❌ 大量使用 CommonJS 的遗留项目
- ❌ 需要复杂 Webpack 配置的项目
:::

### 3、学习建议

::: details 深入学习路径
1. **理解 ES 模块**：掌握浏览器原生模块系统
2. **学习 Rollup**：了解 Vite 的构建基础
3. **插件开发**：编写自定义 Vite 插件
4. **源码阅读**：深入阅读 Vite 源码
5. **性能优化**：掌握 Vite 性能优化技巧
:::

---

**通过深入理解 Vite 的原理，你可以更好地使用和优化 Vite 项目！** 🚀

