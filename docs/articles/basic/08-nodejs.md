# Node.js

>[!tip] 简介
>1. Node.js 是一个基于 `Chrome V8` 引擎的 JavaScript 运行环境。
>2. Node.js 使用了一个**事件驱动**、**非阻塞式** `I/O` 的模型，使其轻量又高效。
>3. **擅长处理**`IO密集型`应用,**不适合**`CPU密集型`应用 (图像、音频处理等需要大量数据结构 + 算法)
>4. Node.js 依靠 `libuv` 有很强的处理能力，而 CPU 因为 Node.js 单线程原因，容易造成 CPU 占用率高，如果非要做 CPU 密集型应用，可以使用 C++ 插件编写 或者 nodejs 提供的 `cluster`。


>[!warning] 注意事项
>1. Node.js 没有`BOM`（浏览器对象模型），没有`DOM`（文档对象模型），没有浏览器的内置对象。


>[!important] 参考资料
>1. [Node.js 官网](https://nodejs.org/)
>2. [Node.js 文档](https://nodejs.org/zh-cn/docs/)

## 一、Node.js 机制
### 1、单线程
>[!tip] 定义
>- Node.js 是单线程的，这意味着它只允许一个线程执行代码。
>- 好处：操作系统完全不在有线程创建、销毁的时间开销。
>- 坏处：单线程意味着只能同时执行一个任务，其他任务必须排队等待。

### 2、异步 I/O
>[!tip] 定义
>- Node.js 使用异步 I/O，这意味着它不会等待一个操作完成，而是继续执行下一个操作。
>- 好处：可以处理大量并发请求，不会造成线程阻塞。
>- 坏处：需要编写异步代码，并且在错误处理上需要格外小心。

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
>- 区分 `dependencies` 和 `devDependencies`
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







##  核心模块
>[!tip] 常用核心模块
>- `fs`: 文件系统操作
>- `http`: 创建HTTP服务器/客户端
>- `path`: 处理文件路径
>- `events`: 事件触发器
>- `stream`: 流处理
>- `child_process`: 子进程管理


## 四、事件循环
>[!tip] 机制
>- Node.js 使用事件循环处理异步操作
>- 包含6个阶段：timers、pending callbacks、idle/prepare、poll、check、close callbacks
>- 理解事件循环有助于编写高效代码

## 五、错误处理
>[!tip] 最佳实践
>- 使用 `try/catch` 处理同步错误
>- 回调函数第一个参数为错误对象
>- Promise 使用 `.catch()` 处理错误
>- Async/Await 结合 try/catch
>
>[!warning] 注意事项
>- 未捕获的异常会导致进程退出
>- 使用 `process.on('uncaughtException')` 捕获全局异常

## 六、性能优化
>[!tip] 技巧
>- 使用流处理大文件
>- 避免阻塞事件循环
>- 使用集群(cluster)利用多核CPU
>- 合理使用缓存
>- 监控内存使用