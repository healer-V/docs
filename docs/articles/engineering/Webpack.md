# Webpack
## 一、Webpack基础
### 1.1、 Webpack介绍
>[!note] 介绍
>- Webpack是一个模块打包器。它可以将许多模块按照依赖关系和规则打包成一个文件。
>- Webpack可以将各种类型的资源，例如JS、CSS、图片等进行处理，并将它们转换和打包为合适的格式供浏览器使用。

### 1.2、 优点
::: tip 
1. 自动化构建：Webpack可以自动化地完成各种构建任务，例如打包、压缩、优化、分离等。
2. 模块化开发：Webpack支持模块化开发，可以将复杂的应用程序分割成小的模块，并按需加载。
3. 代码分割：Webpack可以将代码分割成多个 bundle，按需加载，有效地解决加载时间过长的问题。
4. 高性能：Webpack使用异步加载和并行处理，可以提高应用的性能。
5. 扩展性：Webpack是高度可扩展的，它可以用各种插件来扩展它的功能。
:::

### 1.3、 工作原理
::: tip 
1. 识别入口文件：Webpack从配置的入口文件开始解析项目依赖关系。
2. 加载模块：Webpack递归地解析所有依赖的文件，并将其打包成一个文件。
3. 转换模块：Webpack对模块进行转换，例如将ES6代码转换为ES5代码。
4. 打包输出：Webpack将转换后的模块输出到文件系统。
5. 代码分割：Webpack可以将代码分割成多个 bundle，按需加载，有效地解决加载时间过长的问题。
:::
### 1.4、 基本概念
::: tip 
1. `Entry`：Webpack的入口文件，Webpack从这里开始解析项目的依赖关系。
2. `Output`：Webpack的输出文件，Webpack将编译后的代码输出到这里。
3. `Loader`：Webpack的模块转换器，Webpack可以用不同的loader来转换模块。
4. `Plugin`：Webpack的插件，Webpack可以用不同的插件来拓展它的功能。
5. `Mode`：Webpack的模式，Webpack可以以不同的模式运行，例如开发模式、生产模式等。
:::
## 二、Webpack的基本使用
### 2.1、 安装Webpack
Webpack可以使用npm安装，命令如下：

```bash
npm install webpack webpack-cli --save-dev
```

### 2.2、 配置Webpack
Webpack的配置文件是webpack.config.js，它是一个node.js模块，导出一个配置对象。

```js
const path = require('path');
module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  }
};
```

### 2.3、 运行Webpack
>[!TIP]
>1. Webpack可以通过`命令行`运行。
>2. Webpack也可以通过`node.js API`运行。

#### 2.3.1、 命令行运行
```bash
npx webpack
```

#### 2.3.2、 node.js API运行
```js
const webpack = require('webpack');
webpack(config, (err, stats) => {
  if (err) {
    console.error(err.stack || err);
    if (err.details) {
      console.error(err.details);
    }
    return;
  }
  const info = stats.toJson();
  if (stats.hasErrors()) {
    console.error(info.errors);
  }
  if (stats.hasWarnings()) {
    console.warn(info.warnings);
  }
  console.log(stats.toString({
    colors: true
  }));
});
```

