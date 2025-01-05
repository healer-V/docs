# Rollup

## 一、什么是Rollup
### 1.1、简介
:::tip Rollup简介
- Rollup是一个JavaScript打包工具，它可以将小模块聚合成一个文件，减少HTTP请求，提高加载速度。
:::
  ### 1.2、打包工具的作用
:::tip 作用
  1. `合并`：Rollup 可以将多个 JavaScript 脚本合并成一个脚本，供浏览器使用。
  2. `减少 HTTP 请求`：Rollup 可以将多个小模块合并成一个文件，减少 HTTP 请求，提高加载速度。
  3. `压缩代码`：Rollup 可以压缩代码，减少文件体积，提高加载速度。
  4. `兼容性`：Rollup 兼容 ES6、CommonJS、AMD 等模块化规范，可以与其他模块化工具配合使用。
:::
  ### 1.3、Rollup的特点
:::tip 特点
  1. `Tree-shaking`：Rollup 可以通过静态分析代码，自动剔除没有使用的代码，减少文件体积。
  2. `按需加载`：Rollup 可以通过动态导入，按需加载模块，减少初始加载时间。
  3. `代码分割`：Rollup 可以将代码分割成多个 bundle，提高加载速度。
  4. `插件`：Rollup 有丰富的插件，可以扩展功能，实现各种功能。
  5. `易于使用`：Rollup 简单易用，配置项少，使用起来很方便。
:::

## 二、Rollup的使用
### 2.1、安装
```bash
npm install --save-dev rollup
```
### 2.2、配置
```js
// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'index.js',
  output: {
    file: 'bundle.js',
    format: 'cjs'
  },
  plugins: [
    resolve(),
    commonjs()
  ]
};
```
### 2.3、使用
```
// index.js
import { add } from './math.js';

console.log(add(1, 2)); // 3
```
```
// math.js
export function add(a, b) {
  return a + b;
}
```
### 2.4、打包
```
npx rollup -c
```
### 2.5、打包后的文件
```
// bundle.js
'use strict';

  function add(a, b) {
    return a + b;
  }

  console.log(add(1, 2));
```

## 三、Rollup的插件
### 3.1、插件列表
- [rollup-plugin-commonjs](https://github.com/rollup/rollup-plugin-commonjs)：将 CommonJS 模块转换为 ES6 模块。
- [rollup-plugin-node-resolve](https://github.com/rollup/rollup-plugin-node-resolve)：解析 node_modules 中的模块。
- [rollup-plugin-json](https://github.com/rollup/rollup-plugin-json)：解析 JSON 文件。
- [rollup-plugin-replace](https://github.com/rollup/rollup-plugin-replace)：替换代码中的变量。
- [rollup-plugin-babel](https://github.com/rollup/rollup-plugin-babel)：使用 Babel 转换代码。
- [rollup-plugin-uglify](https://github.com/TrySound/rollup-plugin-uglify)：压缩代码。
- [rollup-plugin-alias](https://github.com/rollup/rollup-plugin-alias)：设置别名。
- [rollup-plugin-commonjs](https://github.com/rollup/rollup-plugin-commonjs)：将 CommonJS 模块转换为 ES6 模块。
- [rollup-plugin-node-globals](https://github.com/calvinmetcalf/rollup-plugin-node-globals)：使用 Node.js 的全局变量。
- [rollup-plugin-node-builtins](https://github.com/calvinmetcalf/rollup-plugin-node-builtins)：使用 Node.js 的内置模块。
- [rollup-plugin-istanbul](https://github.com/rollup/rollup-plugin-istanbul)：使用 Istanbul 进行代码覆盖率。
- [rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer)：生成 bundle 依赖图。
- [rollup-plugin-filesize](https://github.com/ Rollup/rollup-plugin-filesize)：生成 bundle 大小报告。
- [rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer)：生成 bundle 依赖图。
- [rollup-plugin-progress](https://github.com/rollup/rollup-plugin-progress)：显示打包进度。
- [rollup-plugin-sourcemaps](https://github.com/rollup/rollup-plugin-sourcemaps)：生成 sourcemap 文件。
- [rollup-plugin-string](https://github.com/TrySound/rollup-plugin-string)：将字符串拼接到代码中。
- [rollup-plugin-url](https://github.com/rollup/rollup-plugin-url)：处理文件资源。
- [rollup-plugin-inject](https://github.com/rollup/rollup-plugin-inject)：注入代码。
- [rollup-plugin-strip](https://github.com/rollup/rollup-plugin-strip)：删除代码块。
- [rollup-plugin-inject-process-env](https://github.com/rollup/rollup-plugin-inject-process-env)：注入环境变量。
- [rollup-plugin-node-globals](https://github.com/calvinmetcalf/rollup-plugin-node-globals)：使用 Node.js 的全局变量。
- [rollup-plugin-node-builtins](https://github.com/calvinmetcalf/rollup-plugin-node-builtins)：使用 Node.js 的内置模块。        
### 3.2、使用插件
```js
// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';

export default {
  input: 'index.js',
  output: {
    file: 'bundle.js',
    format: 'cjs'
  },
  plugins: [
    resolve(),
    commonjs(),
    uglify()
  ]
};
```
### 3.3、插件配置
```js
// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';

export default {
  input: 'index.js',
  output: {
    file: 'bundle.js',
    format: 'cjs'
  },
  plugins: [
    resolve({
      customResolveOptions: {
        moduleDirectory: 'node_modules'
      }
    }),
    commonjs(),
    uglify()
  ]
};
``` 
### 3.4、自定义插件
```js
// rollup-plugin-my-plugin.js
import { createFilter } from 'rollup-pluginutils';

export default function myPlugin(options = {}) {
  const filter = createFilter(options.include, options.exclude);

  return {
    name: 'my-plugin',
    transform(code, id) {
      if (!filter(id)) {
        return null;
      }

      // transform code...
    }
  };
}
```
```js
// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';
import myPlugin from './rollup-plugin-my-plugin';

export default {
  input: 'index.js',
  output: {
    file: 'bundle.js',
    format: 'cjs'
  },
  plugins: [
    resolve(),
    commonjs(),
    uglify(),
    myPlugin({
      include: '**/*.js',
      exclude: 'node_modules/**'
    })
  ]
};
```