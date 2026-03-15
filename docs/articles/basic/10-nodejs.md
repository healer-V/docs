---
title: "Node.js"
category: "基础知识"
tags:
  - Node
excerpt: "概念 Node.js 是一个基于 Chrome V8 JavaScript 引擎的 JavaScript 运行时环境。 Node.js 使用了一个事件驱动、非阻塞式 I/O 的模型，使其轻量又高效。 擅长处理IO密集型应用,不适合CPU密集..."
---

# Node.js

>[!tip] 概念
>1. Node.js 是一个基于 `Chrome V8 JavaScript` 引擎的 JavaScript 运行时环境。
>2. Node.js 使用了一个**事件驱动**、**非阻塞式** `I/O` 的模型，使其轻量又高效。
>3. **擅长处理**`IO密集型`应用,**不适合**`CPU密集型`应用 (图像、音频处理等需要大量数据结构 + 算法)



>[!warning] 注意事项
>1. Node.js 没有`BOM`（浏览器对象模型），没有`DOM`（文档对象模型），没有浏览器的内置对象。

## 一、Node.js 机制
### 1、单线程事件循环
>[!tip] 定义
>- Node.js 使用单线程的事件循环模型。
>- 通过事件驱动和回调函数处理并发请求。
>- 避免传统多线程编程中的线程切换开销。
>

### 2、非阻塞 I/O
>[!tip] 定义
>- 所有 I/O 操作（网络请求、文件读写等）都采用非阻塞模式。
>- 不会等待 I/O 操作完成，而是继续执行后续代码。

### 3、事件驱动
>[!tip] 定义
>- Node.js 是一个事件驱动的程序，这意味着它基于事件而不是基于时间的执行。
>- 好处：可以轻松实现并发，因为每个事件都有对应的回调函数。
>- 坏处：需要编写事件驱动代码，并且在错误处理上需要格外小心。


## 二、npm 包管理器
>[!tip] 功能
>- 全球最大的JavaScript包生态系统
>- 管理项目依赖
>- 执行脚本命令
>- 发布和分享代码
>
>[!warning] 注意事项
>- 使用 `npm init` 初始化项目
>- 区分 `dependencies`(生产依赖) 和 `devDependencies`（开发依赖）
>- 使用 `npm install` 安装依赖


### Npm install 原理
>[!tip] 执行npm install 的时候发生了什么？
>- 首先，npm 会检查本地是否有缓存，如果有缓存，则直接使用缓存；
>- 如果没有缓存，则会从远程仓库下载安装包，下载完成后，npm 会将安装包缓存到本地根目录的`node_modules`文件夹；
>- 然后，npm 会解析安装包的依赖，并递归执行`npm install`；
>- 最后，npm 会安装所有依赖包，并生成一个`package-lock.json`文件，记录当前项目依赖的版本信息。
>- 它会通过 `name + version + integrity` 信息生成一个唯一的key，这个key能找到对应的index-v5 下的缓存记录 也就是npm cache 文件夹下面的内容。
>- 如果发现有缓存记录，就会找到tar包的hash值，然后将对应的二进制文件解压到node_modeules下面的对应模块的目录下。

### Npm run 原理
>[!tip] 执行npm run 查找规则
>1. 先从当前项目的node_modules/.bin去查找可执行命令
>2. 如果没找到就去全局的node_modules 去找可执行命令
>3. 如果还没找到就去环境变量查找PATH里面的路径去找可执行命令
>4. 再找不到就进行报错


### Npm 生命周期
>[!tip] 定义
>- npm 生命周期是一个脚本的执行顺序
>- npm 生命周期分为 `pre` 和 `post` 两个阶段
>- npm 生命周期可以自定义，在 `package.json` 的 `scripts` 字段中定义

>[!warning] 注意事项
>- 生命周期的执行顺序是 `pre` -> `dev` -> `post`


**示例**
```json
{
    "predev": "node prev.js",
    "dev": "node index.js",
    "postdev": "node post.js"

}
```
>[!note] 生命周期
>- `predev`: 在 `dev` 之前执行
>- `dev`: 开发环境启动脚本
>- `postdev`: 在 `dev` 之后执行

>[!note] 运用场景
>1. npm run build 可以在打包之后删除dist目录等等
>2. post例如你编写完一个工具发布npm，那就可以在之后写一个ci脚本顺便帮你推送到git等等




## 三、模块化
>[!tip] 定义
>- Node.js 使用模块化，这意味着代码可以分割成多个文件，并且可以互相引用。
>- Node.js 内置了 `CommonJS` 和 `ES Modules` 两种模块规范。
>- 推荐使用 ES Modules，因为它更加简洁，并且可以利用浏览器的模块缓存机制。


### 3.1、CommonJS
>[!tip] 
>- Node.js 原生支持 CommonJS 模块规范
>- 使用 `require()` 导入模块
>- 使用 `module.exports` 或 `exports` 导出模块
>

### 3.2、ES Modules
>[!tip] 
>- Node.js 12+ 支持 ES Modules
>- 需要在 `package.json` 中设置 `"type": "module"`
>- 使用 `import` 语法 导入模块
>- 使用 `export` 语法 导出模块
>- 引入模块 import 必须写在头部，否则会报错


## 四、全局对象
>[!tip] 
> 真正的全局对象：
>- `global` ：全局作用域
>- `__filename` ：当前模块的文件名
>- `__dirname` ：当前模块的文件夹路径
>- `module` ：当前模块的引用，包含模块信息
>- `exports` ：当前模块的导出对象
>- `require()` ：用于导入模块的函数
>- `process` ：进程对象，提供属性和方法用于控制 Node.js 进程
>- 模块全局变量：
>- `Buffer`: 用于操作二进制数据
>- `console`: 用于打印日志
>- `setTimeout/setInterval/clearTimeout/clearInterval`: 定时器函数
>- `queueMicrotask`: 用于将微任务推入事件队列
>- `TextEncoder/TextDecoder`: 用于操作文本编码
>- 其他全局对象：
>- `URL`: 用于解析和构造 URL 对象
>- `URLSearchParams`: 用于操作 URL 查询字符串
>- `WebAssembly`: 用于操作 WebAssembly 模块

## 五、fs 文件系统
>[!tip] 
>- Node.js 提供了 `fs` 模块，用于操作文件系统。
>- `fs` 模块提供了文件读写、目录操作、文件类型判断等功能。
>- `fs` 模块的异步接口都采用回调函数的形式。
>- `fs` 模块的同步接口都采用阻塞的方式。

### 4.1、文件写入
>[!tip] 
>- `fs.writeFile(file, data, [options], callback)`：异步写入文件
>- `fs.writeFileSync(file, data, [options])`：同步写入文件

::: details 示例
```js
const fs = require('fs');

fs.writeFile('message.txt', 'Hello Node.js', (err) => {
  if (err) throw err;
  console.log('数据写入成功');
});

fs.writeFileSync('message.txt', 'Hello Node.js');
console.log('数据写入成功');
```
:::
### 4.2、文件读取
>[!tip] 
>- `fs.readFile(file, [options], callback)`：异步读取文件
>- `fs.readFileSync(file, [options])`：同步读取文件

::: details 示例
```js
const fs = require('fs');

fs.readFile('message.txt', (err, data) => {
  if (err) throw err;
  console.log(data.toString());
});

const data = fs.readFileSync('message.txt');
console.log(data.toString());
```
:::

### 4.3、文件追加
>[!tip] 
>- `fs.appendFile(file, data, [options], callback)`：异步追加文件
>- `fs.appendFileSync(file, data, [options])`：同步追加文件

::: details 示例
```js
const fs = require('fs');

fs.appendFile('message.txt', 'Hello Node.js', (err) => {
  if (err) throw err;
  console.log('数据追加成功');
});

fs.appendFileSync('message.txt', 'Hello Node.js');
console.log('数据追加成功');
```
:::
### 4.4、文件流
>[!tip] 
>- `fs.createReadStream(path, [options])`：创建可读流
>- `fs.createWriteStream(path, [options])`：创建可写流

::: details 示例
```js
const fs = require('fs');

// 创建可读流
const readStream = fs.createReadStream('message.txt');

// 创建可写流
const writeStream = fs.createWriteStream('output.txt');

// 管道读写
readStream.pipe(writeStream);
```
:::

### 4.5、文件删除
>[!tip] 
>- `fs.unlink(path, [options], callback)`：异步删除文件
>- `fs.unlinkSync(path, [options])`：同步删除文件

::: details 示例
```js
const fs = require('fs');

fs.unlink('message.txt', (err) => {
  if (err) throw err;
  console.log('文件删除成功');
});

fs.unlinkSync('message.txt');
console.log('文件删除成功');
```
:::

### 4.6、文件重命名
>[!tip] 
>- `fs.rename(oldPath, newPath, [options], callback)`：异步重命名文件
>- `fs.renameSync(oldPath, newPath, [options])`：同步重命名文件

::: details 示例
```js
const fs = require('fs');

fs.rename('message.txt', 'newMessage.txt', (err) => {
  if (err) throw err;
  console.log('文件重命名成功');
});

fs.renameSync('message.txt', 'newMessage.txt');
console.log('文件重命名成功');
```
:::

### 4.7、文件复制
>[!tip] 
>- `fs.copyFile(src, dest, [flags], callback)`：异步复制文件
>- `fs.copyFileSync(src, dest, [flags])`：同步复制文件

::: details 示例
```js
const fs = require('fs');

fs.copyFile('message.txt', 'newMessage.txt', (err) => {
  if (err) throw err;
  console.log('文件复制成功');
});

fs.copyFileSync('message.txt', 'newMessage.txt');
console.log('文件复制成功');
```
:::

### 4.8、文件监视
>[!tip] 
>- `fs.watch(filename, [options], listener)`：监视文件变化


### 4.9、目录操作
>[!tip] 
>- `fs.mkdir(path, [options], callback)`：异步创建目录
>- `fs.mkdirSync(path, [options])`：同步创建目录
>- `fs.rmdir(path, [options], callback)`：异步删除目录
>- `fs.rmdirSync(path, [options])`：同步删除目录
>- `fs.readdir(path, [options], callback)`：异步读取目录
>- `fs.readdirSync(path, [options])`：同步读取目录

::: details 示例
```js
const fs = require('fs');

// 创建目录
fs.mkdir('test', (err) => {
  if (err) throw err;
  console.log('目录创建成功');
});

fs.mkdirSync('test');
console.log('目录创建成功');

// 删除目录
fs.rmdir('test', (err) => {
  if (err) throw err;
  console.log('目录删除成功');
});

fs.rmdirSync('test');
console.log('目录删除成功');

// 读取目录
fs.readdir('test', (err, files) => {
  if (err) throw err;
  console.log(files);
});

const files = fs.readdirSync('test');
console.log(files);
```
:::
### 4.10、文件类型判断
>[!tip] 
>- `fs.stat(path, [options], callback)`：异步获取文件状态
>- `fs.statSync(path, [options])`：同步获取文件状态
>- `fs.lstat(path, [options], callback)`：异步获取符号链接文件状态
>- `fs.lstatSync(path, [options])`：同步获取符号链接文件状态
>- `fs.fstat(fd, [options], callback)`：异步获取文件描述符状态
>- `fs.fstatSync(fd, [options])`：同步获取文件描述符状态

::: details 示例
```js
const fs = require('fs');

// 获取文件状态
fs.stat('message.txt', (err, stats) => {
  if (err) throw err;
  console.log(stats);
});

const stats = fs.statSync('message.txt');
console.log(stats);

// 获取符号链接文件状态
fs.lstat('message.txt', (err, stats) => {
  if (err) throw err;
  console.log(stats);
});

const stats = fs.lstatSync('message.txt');
console.log(stats);

// 获取文件描述符状态
const fd = fs.openSync('message.txt', 'r');
fs.fstat(fd, (err, stats) => {
  if (err) throw err;
  console.log(stats);
});

const stats = fs.fstatSync(fd);
console.log(stats);
```
::: 



## 六、path 路径模块
>[!tip] 
>- Node.js 提供了 `path` 模块，用于处理文件和目录路径。
>- `path` 模块提供了文件路径处理、文件扩展名判断等功能。

### 6.1、路径拼接
>[!tip] 
>- `path.join([...paths])`：拼接路径

::: details 示例
```js
const path = require('path');

console.log(path.join('foo', 'bar', 'baz'));
// 输出：foo/bar/baz
```
:::

### 6.2、路径解析
>[!tip] 
>- `path.parse(path)`：解析路径

::: details 示例
```js
const path = require('path');

console.log(path.parse('foo/bar/baz.txt'));
// 输出：{ root: '', dir: 'foo/bar', base: 'baz.txt', ext: '.txt', name: 'baz' }
```
:::

### 6.3、路径分隔符
>[!tip] 
>- `path.sep`：路径分隔符

### 6.4、文件扩展名
>[!tip] 
>- `path.extname(path)`：获取文件扩展名

## 七、OS 操作系统模块
>[!tip] 
> Node.js 提供了 `os` 模块，用于获取操作系统信息。

### 7.1、系统信息
>[!tip] 
>- `os.arch()`：获取 CPU 架构
>- `os.platform()`：获取操作系统平台
>- `os.release()`：获取操作系统版本
>- `os.type()`：获取操作系统名称

### 7.2、CPU 信息
>[!tip] 
>- `os.cpus()`：获取 CPU 信息

## 八、http 模块
>[!tip] 
> Node.js 提供了 `http` 模块，用于创建 HTTP 服务器。

### 8.1、创建 HTTP 服务器
>[!tip] 
>- `http.createServer([requestListener])`：创建 HTTP 服务器




