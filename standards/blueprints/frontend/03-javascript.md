---
title: "JavaScript 模块章节目录设计"
tags:
  - JavaScript
  - 模块蓝图
  - 目录规划
excerpt: "以语言语义、运行机制和浏览器宿主三条主线组织 JavaScript 模块十章五十篇，记录零基础入口、知识依赖、逐篇职责、示例验证和旧稿替换边界，并标注逐篇交付状态。"
date: 2026-11-15
---

# JavaScript 模块章节目录设计

JavaScript 在浏览器中同时承担语言表达与页面行为：值如何表示和转换，函数如何组织执行，对象如何沿原型查找，异步任务何时轮到执行，以及脚本如何操作 DOM 与网络。本设计围绕这些问题组织 `content/frontend/03-javascript/`，从零基础语法开始，依次建立语言语义、运行机制和宿主 API 能力。

本文件记录 `content/frontend/03-javascript/` 的章节目录、内容职责与交付状态。用户于 2026-11-15 确认十章目录、`04-ecmascript` 边界、设计模式移出和旧稿删除方案，授权按本蓝图重写正文。十章五十篇已于 2026-11-15 生成并逐篇实测，sidebar 与顶栏入口已替换，23 篇旧稿已删除且旧 URL 作废。覆盖状态与验证结果按节记录，未执行或未覆盖的部分单独标注。

## 一、任务范围与现状

| 项目 | 结论与依据 |
|------|------------|
| 当前任务 | 已完成：建立十章五十篇正文，替换 sidebar 与顶栏入口，删除旧稿；逐篇验证记录见第七节职责卡 |
| 目标读者 | 未系统学习过 JavaScript；能阅读 HTML 文档结构，知道标签、属性和样式的作用 |
| 实施前目录 | 模块平铺 23 篇 Markdown，没有章节子目录：5 篇 6.9–31.7 KB 旧稿，5 篇 360–699 字节提纲，13 篇仅 96–120 字节占位 |
| 导航变化 | 实施前 sidebar 为 8 章 40 个链接，其中 26 个指向不存在的文件、9 篇现有文件未挂载；顶栏指向 `01-boundary`；实施后分别为 10 章 50 个真实链接与新第 1 章第 1 篇 |
| 结构问题 | 类型、函数、对象、异步与 Web API 压在同一层；模块化内容分散在 `12-module`、`18-module`、`20-module` 三处；设计模式混入语言教学 |
| 概念问题 | 缺少变量、控制流、数组等零基础入口；sidebar 以“语言边界”“编码基线”开篇，读者无法从第一个可运行程序进入 |
| 重复边界 | `04-ecmascript` 现有规划重复 ES2015 及之后的语言语义；本模块完整承担语义讲解，`04` 只保留标准体系与版本特性，另行设计 |
| 范围边界 | 只改本模块目录、正文、sidebar 与顶栏入口；不新增模块首页，不迁移旧地址，不改 `04-ecmascript` 现有文件 |
| 工作区 | 实施期间不覆盖、不回退仓库其他未提交改动；交付后改动范围见第十节工作区检查 |
| 审计口径 | 未对 5 篇旧稿执行全文质量验收；旧稿只作为事实核对材料，不计入新目录覆盖 |

## 二、模块契约与知识边界

### 1. 教学契约

| 字段 | 内容 |
|------|------|
| 模块名称 | JavaScript |
| 模块位置 | `content/frontend/03-javascript/` |
| 主知识方向 | 编程语言；采用编程语言覆盖模型中的环境、语法、类型与值、对象模型、运行机制、异步与模块、调试与质量能力 |
| 辅助方向 | 浏览器宿主环境；只讲解语言使用所需的 DOM、事件、网络、存储、页面生命周期与 Worker 边界 |
| 当前方向起点 | 从“脚本在哪里运行、第一个程序怎样执行”开始；变量、控制流、函数、对象、数组和异步均在本模块讲解 |
| 最终能力 | 能从空目录写出可运行的交互页面；解释类型、作用域、原型与异步行为；用模块组织代码；用 DevTools 定位错误与性能问题；判断兼容性与安全边界 |
| 主技术基线 | 以 TC39 ECMA-262 现行标准和 MDN 行为定义为准，不承诺统一“ES20xx”版本；正文逐篇标注特性首次标准化版本与兼容边界 |
| 验证环境 | 实测使用 macOS 上的 Chrome 157.0.8103.79 与 Node.js v22.23.4 启动的本地静态服务；需要 `file://` 或控制台的示例直接打开页面 |
| 兼容边界 | 单浏览器验证不能证明其他浏览器一致；涉及存储配额、后台节流、权限的结论必须注明实测条件或标为未验证 |
| 维护线 | 旧文章 URL 作废，不建跳转；不把框架、TypeScript 或构建工具内容并入本模块 |

### 2. 三条组织主线

| 主线 | 负责的问题 | 完整讲解位置 | 不承担的职责 |
|------|------------|--------------|--------------|
| 语言语义 | 值是什么类型，表达式如何求值，函数、作用域、对象和类怎样组织代码 | 第 1—6 章 | 浏览器 API 行为、页面渲染时机 |
| 运行机制 | 代码在执行上下文、调用栈、内存和事件循环中怎样运行 | 第 7 章 | DOM 事件传播、HTTP 语义 |
| 宿主 API | 脚本怎样操作文档、事件、网络、存储、页面生命周期和后台线程 | 第 8—9 章 | 语言语法与对象模型的重复教学 |

第 8 章的模块与错误既是语言机制，也是工程组织能力；它依赖第 4 章的函数与第 7 章的异步。第 10 章在三条主线之后，用 DevTools、性能面板与安全边界检验读者能否定位真实问题。

### 3. 外部前置与范围排除

| 内容 | 要求或处理边界 | 学习入口或归属 |
|------|----------------|----------------|
| HTML 文档结构与属性 | 能写出包含 `html`、`head`、`body`、`script` 的页面；示例附近仍解释必要结构 | [HTML 基础](../../../content/frontend/01-html/01-foundation/01-overview.md) |
| HTML 表单、多媒体与 Web API | 本模块不重复元素语义；DOM、事件、fetch 只讲脚本侧用法 | [HTML 模块](../../../content/frontend/01-html/) |
| CSS 选择器与盒模型 | 只要求能通过类名选取元素和理解可见性；样式规则不展开 | [CSS 模块](../../../content/frontend/02-css/) |
| 浏览器开发者工具 | 第 9—10 章之前只使用控制台查看输出；完整调试在第 10 章 | 本模块第 10 章 |
| Vue、React 等框架 | 不属于语言教学；只在本模块之外出现 | 前端框架模块 |
| TypeScript、打包器、转译器 | 本模块只解释特性检测与原生模块；不搭建构建链 | 工程化模块 |
| Node.js 服务端开发 | 只在 CommonJS 与模块解析中给出最小运行示例 | Node.js 专项文档 |
| 设计模式 | 不设章节；创建型、结构型、行为型模式不在零基础语言模块展开 | 后续独立模块或工程文档 |
| 算法与数据结构课程 | 数组与集合文章只讲语言内置能力，不扩展算法设计 | 算法专项 |

## 三、版本与来源

### 1. 版本策略

| 对象 | 基线 | 使用规则 |
|------|------|----------|
| 语言标准 | [ECMA-262](https://tc39.es/ecma262/) 现行标准与 MDN 行为定义 | 不使用“最新版全部支持”的笼统表述；逐篇标注特性首次标准化年份或版本 |
| 文档状态 | 实施核对日期 2026-11-15 | 50 篇正文均复核所涉接口、异常与兼容数据，并在文末写明未覆盖范围 |
| 浏览器 | Chrome 157.0.8103.79（项目已验证环境） | 记录实际版本、操作系统、页面入口与观察结果；不推断其他浏览器 |
| 辅助运行时 | Node.js v22.23.4（实测） | 用于 CommonJS、ESM、Worker 对照与本地静态服务；其他版本行为未验证 |
| 脚本类型 | 经典脚本与模块脚本分别说明 | 模块默认严格模式、延迟执行、顶层 `this` 为 `undefined`，不把两种行为混写 |
| 新特性 | 可选链、空值合并、`structuredClone`、顶层 `await` 等分别标注 | 给出特性检测或降级方式，不假设所有目标浏览器支持 |
| 示例依赖 | 浏览器文章用独立 HTML 与脚本；模块与 Node 文章给出目录和启动命令 | 不引用仓库示例目录，不跨文章复用文件 |

### 2. 来源清单

以下为设计阶段的来源入口，用于确定概念范围与章节边界。正文按篇核对具体接口、异常与兼容数据，结果与未覆盖项写入文章末尾；本表不代表已逐页打开核验。

| ID | 官方资料 | 支撑范围 |
|----|----------|----------|
| `S01` | [MDN JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)、[语法与类型](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types) | 语言组成、脚本引入、声明、类型与字面量 |
| `S02` | [表达式与运算符](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_operators) | 表达式、优先级、转换与相等性 |
| `S03` | [控制流与错误处理](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling)、[循环与迭代](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration) | 分支、循环、跳转 |
| `S04` | [函数](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions) | 函数形式、参数、返回值 |
| `S05` | [执行模型](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model)、[闭包](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures) | 执行上下文、作用域、提升、闭包 |
| `S06` | [`this`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)、[`Function.prototype.call`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call) | `this` 绑定、`call`/`apply`/`bind` |
| `S07` | [对象](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects)、[属性描述符](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) | 属性访问、解构、描述符、复制 |
| `S08` | [原型链](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain)、[类](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_classes) | 原型、继承、`class` |
| `S09` | [JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON)、[Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)、[Math](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math) | 序列化、时间、数值计算 |
| `S10` | [可选链](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)、[空值合并](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)、[展开语法](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) | 安全取值与组合 |
| `S11` | [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) | 数组方法、迭代、排序 |
| `S12` | [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)、[Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) | 键值集合与去重 |
| `S13` | [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)、[正则表达式](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions) | 字符串处理与匹配 |
| `S14` | [迭代器与生成器](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_generators) | 可迭代协议、生成器 |
| `S15` | [内存管理](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management) | 引用、可达性与垃圾回收 |
| `S16` | [事件循环](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop)、[HTML 事件循环](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops) | 任务队列、微任务、渲染时机 |
| `S17` | [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)、[async 函数](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) | Promise 与 `async`/`await` |
| `S18` | [`setTimeout`](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout) | 定时器、延迟与清理 |
| `S19` | [JavaScript 模块](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) | ESM 静态与动态导入 |
| `S20` | [Node.js 模块](https://nodejs.org/docs/latest-v22.x/api/modules.html) | CommonJS、模块解析与互操作 |
| `S21` | [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)、[try...catch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch) | 错误类型、抛出与捕获 |
| `S22` | [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model)、[Document](https://developer.mozilla.org/en-US/docs/Web/API/Document) | DOM 查询与修改 |
| `S23` | [Event](https://developer.mozilla.org/en-US/docs/Web/API/Event)、[addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) | 事件流、监听与委托 |
| `S24` | [Location](https://developer.mozilla.org/en-US/docs/Web/API/Location)、[History](https://developer.mozilla.org/en-US/docs/Web/API/History)、[Navigator](https://developer.mozilla.org/en-US/docs/Web/API/Navigator) | URL、导航与浏览器环境 |
| `S25` | [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)、[AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) | 请求、响应、中断 |
| `S26` | [Storage](https://developer.mozilla.org/en-US/docs/Web/API/Storage)、[IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)、[HTTP 缓存](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching) | 存储与缓存 |
| `S27` | [页面生命周期](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)、[Navigation Timing](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Navigation_timing) | 加载事件与性能测量 |
| `S28` | [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) | Worker 通信与数据传递 |
| `S29` | [Chrome DevTools](https://developer.chrome.com/docs/devtools/) | 调试、网络、性能与内存面板 |
| `S30` | [MDN Web 安全](https://developer.mozilla.org/en-US/docs/Web/Security)、[OWASP XSS 防护](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)、[CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) | 注入、敏感数据与内容安全策略 |
| `S31` | [MDN 浏览器兼容数据](https://github.com/mdn/browser-compat-data)、[caniuse](https://caniuse.com/) | 特性检测与兼容判断 |
| `S32` | [ECMA-262](https://tc39.es/ecma262/) | 语言语义与规范级行为 |

## 四、知识项与覆盖矩阵

本表同时作为知识清单与知识覆盖矩阵。每个知识项只有一个完整主讲位置；文章 ID 的第一组数字表示归属章节。81 个知识项均已由对应主讲文章覆盖，逐篇实测环境与结果记录在第七节职责卡和正文“验证记录与边界”中。

| ID | 知识项 | 分类 | 必要前置 | 来源 | 主讲 | 深度 | 必要证据 |
|----|--------|------|----------|------|------|------|----------|
| `K001` | JavaScript 组成与宿主分工 | 基础 | 外部：HTML 文档结构 | `S01`, `S32` | `A01-01` | 认识 | 语言、宿主与 Web API 关系表 |
| `K002` | 脚本引入与执行时机 | 基础 | `K001` | `S01` | `A01-01` | 使用 | 经典脚本、`defer`、`async`、模块的执行顺序日志 |
| `K003` | 从空目录运行与观察输出 | 基础 | `K001` | `S01`, `S29` | `A01-02` | 使用 | 独立页面与控制台结果 |
| `K004` | 变量声明与 `const` 约束 | 基础 | `K003` | `S01` | `A01-03` | 使用 | `let`/`const`/`var` 重复声明与重新赋值对照 |
| `K005` | 标识符命名与保留字 | 基础 | `K004` | `S01` | `A01-03` | 使用 | 合法与非法标识符及报错 |
| `K006` | 严格模式生效范围 | 机制 | `K003` | `S01`, `S32` | `A01-03` | 解释 | 经典脚本与模块中隐式全局赋值的差异 |
| `K007` | 表达式、语句与求值顺序 | 基础 | `K004` | `S02` | `A01-04` | 使用 | 含副作用的表达式顺序日志 |
| `K008` | 运算符优先级与结合性 | 核心 | `K007` | `S02` | `A01-04` | 使用 | 加括号与不加括号的结果对照 |
| `K009` | 原始类型与 `typeof` | 基础 | `K007` | `S01`, `S32` | `A02-01` | 使用 | 八种 `typeof` 返回值表 |
| `K010` | 包装对象与原始值属性访问 | 机制 | `K009` | `S01` | `A02-01` | 解释 | 字符串属性访问与包装对象行为 |
| `K011` | 数字表示、精度与安全整数 | 核心 | `K009` | `S01`, `S32` | `A02-02` | 解释 | 浮点误差、安全整数与 `BigInt` 对照 |
| `K012` | 字符串、模板字面量与 Unicode | 核心 | `K009` | `S01`, `S13` | `A02-03` | 使用 | 插值、多行与码点长度对照 |
| `K013` | 布尔转换与真值判断 | 核心 | `K009` | `S01`, `S02` | `A02-04` | 使用 | 假值表与条件结果 |
| `K014` | `null`、`undefined` 与缺失值 | 核心 | `K009`, `K013` | `S01` | `A02-04` | 使用 | 参数缺省、JSON 往返与默认值对照 |
| `K015` | 对象与数组字面量 | 基础 | `K009` | `S01`, `S07` | `A02-05` | 使用 | 嵌套结构读取与修改 |
| `K016` | 显式与隐式类型转换 | 机制 | `K013`, `K015` | `S02`, `S32` | `A02-06` | 解释 | 转换表与 `+`、`==` 反例 |
| `K017` | 相等性算法与 `Object.is` | 机制 | `K016` | `S02`, `S32` | `A02-06` | 解释 | `===`、`==`、`Object.is` 对 `NaN` 与 `±0` 的结果 |
| `K018` | 条件分支与 `switch` | 核心 | `K016` | `S03` | `A03-01` | 使用 | 条件组合、严格匹配与落空分支 |
| `K019` | 循环与迭代语法 | 核心 | `K018` | `S03` | `A03-02` | 使用 | 四种循环遍历同一数据的输出 |
| `K020` | 跳转与提前退出 | 核心 | `K019` | `S03` | `A03-03` | 使用 | `break`、`continue`、`return` 路径日志 |
| `K021` | 函数形式与调用 | 基础 | `K007` | `S04` | `A04-01` | 使用 | 声明、表达式、箭头函数与调用结果 |
| `K022` | 参数、默认值与剩余参数 | 核心 | `K021` | `S04`, `S32` | `A04-02` | 使用 | 缺省、多余实参与默认值触发条件 |
| `K023` | 返回值与调用结果 | 基础 | `K021` | `S04` | `A04-02` | 使用 | 无返回值、返回对象与链式调用 |
| `K024` | 词法作用域与作用域链 | 机制 | `K021` | `S05` | `A04-03` | 解释 | 嵌套函数读取外层变量 |
| `K025` | 提升与暂时性死区 | 机制 | `K004`, `K024` | `S05` | `A04-03` | 解释 | 声明前访问 `var`、`let` 与函数声明 |
| `K026` | 闭包与变量捕获 | 机制 | `K024` | `S05` | `A04-04` | 解释 | 计数器与循环捕获反例 |
| `K027` | `this` 绑定与 `call`/`apply`/`bind` | 机制 | `K021` | `S06` | `A04-05` | 解释 | 四种调用位置的 `this` 值 |
| `K028` | 箭头函数的 `this` 与限制 | 机制 | `K027` | `S06` | `A04-05` | 解释 | 回调中的 `this` 对照与构造限制 |
| `K029` | 对象属性访问与解构 | 核心 | `K015` | `S07` | `A05-01` | 使用 | 嵌套解构、默认值与别名 |
| `K030` | 属性描述符与属性操作 | 机制 | `K029` | `S07` | `A05-02` | 解释 | `writable`、`enumerable`、`configurable` 对照 |
| `K031` | 浅拷贝、深拷贝与冻结 | 核心 | `K030` | `S07` | `A05-02` | 使用 | 展开、`Object.assign`、`structuredClone` 与 `freeze` |
| `K032` | 原型与原型链 | 机制 | `K029` | `S08` | `A05-03` | 解释 | 属性查找、遮蔽与 `Object.create` |
| `K033` | `class`、实例与继承 | 核心 | `K032` | `S08` | `A05-04` | 使用 | 类定义、实例、`extends` 与 `super` |
| `K034` | 私有字段、静态成员与访问器 | 核心 | `K033` | `S08`, `S32` | `A05-04` | 使用 | `#` 字段、`static` 与 `get`/`set` 边界 |
| `K035` | JSON 序列化与解析 | 核心 | `K029` | `S09` | `A05-05` | 使用 | 循环引用、`undefined` 与 `Date` 的丢失 |
| `K036` | `Date`、时区与 `Math` 计算 | 核心 | `K011` | `S09` | `A05-05` | 使用 | 时间戳、解析差异、舍入与随机 |
| `K037` | 可选链、空值合并与展开 | 核心 | `K014`, `K029` | `S10` | `A05-06` | 使用 | 深层取值、默认值与展开结果 |
| `K038` | 数组创建、长度与增删 | 基础 | `K015` | `S11` | `A06-01` | 使用 | `push`/`pop`/`splice` 与 `length` 结果 |
| `K039` | 数组迭代与 `map`/`filter`/`reduce` | 核心 | `K038`, `K021` | `S11` | `A06-02` | 使用 | 同一数据的四种方法输出 |
| `K040` | 排序、查找与扁平化 | 核心 | `K039` | `S11` | `A06-02` | 使用 | 比较函数、`sort` 原地修改与 `flat` |
| `K041` | `Map`、`Set` 与 `Weak` 集合 | 核心 | `K015`, `K029` | `S12` | `A06-03` | 使用 | 键类型、去重与弱引用边界 |
| `K042` | 字符串方法与 Unicode 处理 | 核心 | `K012` | `S13` | `A06-04` | 使用 | 切片、大小写与码点遍历 |
| `K043` | 正则表达式 | 核心 | `K042` | `S13` | `A06-04` | 使用 | `test`/`exec`/`replace`、标志与分组 |
| `K044` | 可迭代协议与迭代器 | 机制 | `K019` | `S14` | `A06-05` | 解释 | `for...of` 与自定义可迭代对象 |
| `K045` | 生成器与 `yield` | 机制 | `K044`, `K021` | `S14` | `A06-05` | 解释 | 分步取值与 `yield*` |
| `K046` | 执行上下文与调用栈 | 机制 | `K024` | `S05` | `A07-01` | 解释 | 嵌套调用栈日志与断点 |
| `K047` | 递归与栈溢出 | 机制 | `K046` | `S05` | `A07-01` | 解释 | 递归深度与 `RangeError` |
| `K048` | 内存、引用与垃圾回收 | 机制 | `K032` | `S15` | `A07-02` | 解释 | 可达性与回收观察 |
| `K049` | 内存泄漏识别 | 诊断 | `K048` | `S15`, `S29` | `A07-02` | 诊断 | 定时器、监听与闭包持有的对照 |
| `K050` | 事件循环与任务队列 | 机制 | `K046`, `K044` | `S16` | `A07-03` | 解释 | `setTimeout` 与 Promise 回调顺序 |
| `K051` | 渲染时机与主线程阻塞 | 机制 | `K050` | `S16` | `A07-03` | 解释 | 长任务前后的输入与绘制延迟 |
| `K052` | 回调与错误优先约定 | 核心 | `K021` | `S04`, `S17` | `A07-04` | 使用 | 回调嵌套与错误传递 |
| `K053` | Promise 状态与组合 | 核心 | `K050`, `K052` | `S17` | `A07-04` | 使用 | `then`/`catch`/`finally` 与组合方法 |
| `K054` | `async`/`await` 与错误传播 | 核心 | `K053` | `S17` | `A07-05` | 使用 | `await` 顺序、`try`/`catch` 与并发控制 |
| `K055` | 定时器精度与清理 | 核心 | `K050`, `S18` | `S18` | `A07-06` | 使用 | 漂移测量与 `clearTimeout` |
| `K056` | 防抖与节流 | 设计 | `K055`, `K021` | `S18` | `A07-06` | 设计 | 连续事件的调用次数对照 |
| `K057` | 模块化演进与全局脚本问题 | 认识 | `K001` | `S19` | `A08-01` | 认识 | 全局污染与 IIFE 对照 |
| `K058` | ES Module 静态与动态导入 | 核心 | `K057` | `S19` | `A08-02` | 使用 | 命名、默认、重导出与动态导入 |
| `K059` | 循环依赖与模块求值顺序 | 机制 | `K058` | `S19`, `S32` | `A08-02` | 解释 | 两个模块循环引用的求值结果 |
| `K060` | CommonJS 与 Node.js 模块解析 | 核心 | `K057` | `S20` | `A08-03` | 使用 | `require`、`module.exports` 与缓存 |
| `K061` | 错误类型、抛出与捕获 | 核心 | `K021` | `S21` | `A08-04` | 使用 | 内置错误类型、`throw` 与 `try`/`catch`/`finally` |
| `K062` | 异步错误与全局错误处理 | 机制 | `K054`, `K061` | `S21`, `S17` | `A08-04` | 解释 | 未处理 rejection 与全局错误事件 |
| `K063` | DOM 查询与遍历 | 核心 | `K029` | `S22` | `A09-01` | 使用 | 选择器、节点关系与集合差异 |
| `K064` | 内容、属性与样式修改 | 核心 | `K063` | `S22` | `A09-01` | 使用 | `textContent`、`innerHTML`、`classList` 对照 |
| `K065` | 事件流与监听 | 机制 | `K063` | `S23` | `A09-02` | 解释 | 捕获、目标与冒泡顺序 |
| `K066` | 事件对象与事件委托 | 核心 | `K065` | `S23` | `A09-02` | 使用 | `target`/`currentTarget`、默认行为与委托 |
| `K067` | `location`、`history` 与 `navigator` | 核心 | `K001` | `S24` | `A09-03` | 使用 | 查询参数、导航与浏览器信息边界 |
| `K068` | `fetch` 请求与响应 | 核心 | `K053` | `S25` | `A09-04` | 使用 | 请求方法、状态码与响应体读取 |
| `K069` | `AbortController` 与错误分类 | 核心 | `K068` | `S25` | `A09-04` | 使用 | 中断、网络错误与 HTTP 错误区分 |
| `K070` | Cookie、Storage 与 IndexedDB | 核心 | `K029` | `S26` | `A09-05` | 使用 | 容量、生命周期与同步性对照 |
| `K071` | 缓存策略与存储配额 | 设计 | `K070`, `K068` | `S26` | `A09-05` | 设计 | HTTP 缓存与配额异常处理 |
| `K072` | 页面生命周期与加载事件 | 核心 | `K063` | `S27` | `A09-06` | 使用 | `DOMContentLoaded`、`load` 与可见性顺序 |
| `K073` | 性能时间线与测量 | 核心 | `K072`, `K050` | `S27` | `A09-06` | 使用 | `performance.now()` 与导航时间读数 |
| `K074` | Web Worker 通信与数据传递 | 核心 | `K050`, `K073` | `S28` | `A09-07` | 使用 | `postMessage`、结构化克隆与终止 |
| `K075` | 断点、网络与控制台诊断 | 诊断 | `K046`, `K061` | `S29` | `A10-01` | 诊断 | 断点命中、作用域读取与失败请求定位 |
| `K076` | 性能分析与瓶颈定位 | 诊断 | `K073`, `K051` | `S29` | `A10-02` | 诊断 | 性能录制与长任务定位 |
| `K077` | 内存与渲染性能验证 | 诊断 | `K049`, `K076` | `S29` | `A10-02` | 诊断 | 内存快照与优化前后对照 |
| `K078` | XSS 与信任边界 | 质量 | `K064`, `K061` | `S30` | `A10-03` | 使用 | `innerHTML` 注入与转义对照 |
| `K079` | 敏感数据、第三方脚本与 CSP | 质量 | `K070`, `K078` | `S30` | `A10-03` | 认识 | 敏感存储与 CSP 拦截 |
| `K080` | 特性检测与兼容降级 | 质量 | `K001` | `S31` | `A10-04` | 使用 | `in`/`typeof` 检测与回退分支 |
| `K081` | 兼容数据与 polyfill 边界 | 质量 | `K080` | `S31` | `A10-04` | 设计 | 支持矩阵与降级决策表 |

## 五、依赖关系与排序

### 1. 主要依赖

| 当前主题 | 必要前置 | 原因与排序影响 |
|----------|----------|----------------|
| 脚本引入与执行 | 语言组成 | 先知道浏览器、ECMAScript 与 Web API 的分工，再讨论脚本何时执行 |
| 变量与运算符 | 第一个程序 | 没有可运行入口，无法观察声明与表达式结果 |
| 类型与转换 | 变量、表达式 | 转换发生在取值和运算中，需要先有变量与运算符 |
| 控制流 | 类型与真值判断 | 条件依赖真值转换；循环依赖表达式与变量 |
| 函数与作用域 | 控制流、表达式 | 函数体需要语句；作用域解释依赖声明形式 |
| 对象、原型与类 | 函数、作用域 | 方法与 `this`、闭包和原型上的函数对象都需要函数基础 |
| 数组与集合 | 对象、函数 | 数组是对象；迭代方法接收函数作为参数 |
| 运行时与异步 | 函数、闭包、对象 | 调用栈、微任务和 Promise 回调都建立在函数执行模型上 |
| 模块与错误 | 函数、异步 | 模块求值顺序和异步错误传播依赖前两章 |
| 浏览器 API | 对象、模块、异步 | DOM 操作、事件回调和 `fetch` 都使用对象与 Promise |
| 调试、性能与安全 | 前述机制与 API | 只有先理解语义与异步，才能解释断点、长任务与注入风险 |

### 2. 同层排序与交叉主题

| 情况 | 处理 |
|------|------|
| 类型章内部 | 先原始类型，再数字、字符串、空值与真值，最后对象字面量和转换；转换依赖前四篇的类型判断 |
| 对象章内部 | 先字面量与解构，再属性控制与复制，随后原型、类、内置对象和语法糖 |
| 数组章内部 | 基础操作先于迭代方法；Map/Set 独立于数组算法；正则与字符串同篇但先讲字符串方法 |
| 异步章内部 | 先调用栈与事件循环，再回调、Promise、`async`/`await`，最后定时器与限流 |
| 模块章内部 | 演进史只建立问题背景；ESM 为主讲，CommonJS 作为对照；错误处理独立成篇 |
| 浏览器章内部 | DOM 与事件先于网络；存储与缓存依赖网络；生命周期与性能相邻；Worker 最后 |
| 转换与相等性 | `A02-06` 唯一主讲；其他文章只引用结论，不重复算法表 |
| 原型与 `class` | 原型链在 `A05-03` 完整解释；`A05-04` 只解释 `class` 如何映射到原型，不重讲查找 |
| Promise 与 `async` | Promise 机制在 `A07-04`；`A07-05` 只讲暂停恢复、错误传播与并发控制 |
| 事件循环与渲染 | 事件循环在 `A07-03`；页面加载与性能测量在 `A09-06`，不重复任务队列 |
| 存储与缓存 | API 对照在 `A09-05`；HTTP 缓存只解释响应头与浏览器行为，不讲服务端实现 |
| 安全与 DOM | DOM 修改只讲安全写法，完整威胁模型在 `A10-03` |

同级文章在没有直接依赖时按“先建立可观察对象，再解释机制，最后做工程判断”排序。例如 `A09-05` 存储与缓存放在 `fetch` 之后，因为配额与缓存行为需要先有请求上下文。

## 六、章节目录

### 1. 章节职责

| 顺序 | 文件夹 | 章节 | 篇数 | 目标 | 包含知识项 | 必要前置 | 排除与验证 |
|-----:|--------|------|-----:|------|------------|----------|------------|
| 1 | `01-foundation` | 入门与运行环境 | 4 | 能引入脚本、读写变量并观察第一个程序 | `K001`～`K008` | HTML 文档结构 | 不展开类型细节；验证脚本执行顺序与控制台输出 |
| 2 | `02-types` | 类型与值 | 6 | 能判断类型、转换结果与相等性 | `K009`～`K017` | 第 1 章 | 不提前讲原型与集合；验证 `typeof`、浮点与转换表 |
| 3 | `03-control-flow` | 控制流 | 3 | 能按条件与循环组织执行路径 | `K018`～`K020` | 第 2 章 | 不扩展到异步流程；验证分支与循环输出 |
| 4 | `04-functions-scope` | 函数与作用域 | 5 | 能定义、调用函数并解释作用域与闭包 | `K021`～`K028` | 第 2—3 章 | 不展开原型与类；验证作用域、闭包与 `this` |
| 5 | `05-objects-prototypes` | 对象、原型与类 | 6 | 能组织对象数据并解释原型与继承 | `K029`～`K037` | 第 4 章 | 不重复函数基础；验证属性查找、复制与类实例 |
| 6 | `06-collections` | 数组、字符串与集合 | 5 | 能用数组方法、Map/Set、正则与迭代器处理数据 | `K038`～`K045` | 第 2、5 章 | 不讲算法课程；验证方法返回值与迭代顺序 |
| 7 | `07-runtime-async` | 运行时与异步 | 6 | 能解释调用栈、事件循环并编写 Promise/async 代码 | `K046`～`K056` | 第 4 章 | 不讲 DOM 事件；验证任务顺序、错误传播与限流 |
| 8 | `08-modules-errors` | 模块与错误 | 4 | 能拆分 ESM、处理错误并判断加载边界 | `K057`～`K062` | 第 4、7 章 | 不搭建构建工具；验证模块求值顺序与错误分支 |
| 9 | `09-browser-apis` | 浏览器 API | 7 | 能操作 DOM、处理事件、请求数据并观察性能 | `K063`～`K074` | 第 5—8 章、HTML 模块 | 不重复 HTML 元素语义；验证 DOM、事件、请求与 Worker |
| 10 | `10-quality` | 调试、性能与安全 | 4 | 能定位错误、分析性能并识别常见安全问题 | `K075`～`K081` | 第 1—9 章 | 不写框架调试；验证断点、性能录像与注入对照 |

### 2. 完整文章目录

文章路径相对于 `content/frontend/03-javascript/`，均已创建并通过 `docs:check:strict`。章内独立从 `01` 编号；网站入口由 sidebar 与顶栏提供。

| 编号 | 文章 | 规划路径 |
|------|------|----------|
| 1.1 | JavaScript 的组成与运行位置 | `01-foundation/01-composition-and-runtime.md` |
| 1.2 | 第一个程序与脚本引入 | `01-foundation/02-first-program.md` |
| 1.3 | 变量、声明与命名 | `01-foundation/03-variables-declarations.md` |
| 1.4 | 表达式与运算符 | `01-foundation/04-expressions-operators.md` |
| 2.1 | 原始类型与 typeof | `02-types/01-primitive-types-typeof.md` |
| 2.2 | 数字与精度 | `02-types/02-numbers.md` |
| 2.3 | 字符串与模板字面量 | `02-types/03-strings-template-literals.md` |
| 2.4 | 布尔、null、undefined 与真值判断 | `02-types/04-booleans-null-undefined-truthiness.md` |
| 2.5 | 对象与数组的初步使用 | `02-types/05-objects-arrays-intro.md` |
| 2.6 | 类型转换与相等性 | `02-types/06-type-conversion-equality.md` |
| 3.1 | 条件分支 | `03-control-flow/01-conditionals.md` |
| 3.2 | 循环与迭代 | `03-control-flow/02-loops-iteration.md` |
| 3.3 | 跳转与提前退出 | `03-control-flow/03-jumps-early-exit.md` |
| 4.1 | 函数声明、表达式与调用 | `04-functions-scope/01-function-forms-calls.md` |
| 4.2 | 参数、默认值、剩余参数与返回值 | `04-functions-scope/02-parameters-returns.md` |
| 4.3 | 作用域、提升与暂时性死区 | `04-functions-scope/03-scope-hoisting-tdz.md` |
| 4.4 | 闭包 | `04-functions-scope/04-closures.md` |
| 4.5 | this、call/apply/bind 与箭头函数 | `04-functions-scope/05-this-arrow-functions.md` |
| 5.1 | 对象字面量、属性访问与解构 | `05-objects-prototypes/01-object-literals-destructuring.md` |
| 5.2 | 属性描述符、复制与不可变 | `05-objects-prototypes/02-property-descriptors-copying.md` |
| 5.3 | 原型链与继承 | `05-objects-prototypes/03-prototype-chain.md` |
| 5.4 | class 与实例 | `05-objects-prototypes/04-class-inheritance.md` |
| 5.5 | 内置对象：JSON、Date 与 Math | `05-objects-prototypes/05-builtins-json-date-math.md` |
| 5.6 | 可选链、空值合并与展开 | `05-objects-prototypes/06-optional-chaining-spread.md` |
| 6.1 | 数组创建与增删改查 | `06-collections/01-arrays-basics.md` |
| 6.2 | 数组迭代与高阶方法 | `06-collections/02-array-iteration-methods.md` |
| 6.3 | Map、Set 与 Weak 集合 | `06-collections/03-map-set-weak.md` |
| 6.4 | 字符串处理与正则表达式 | `06-collections/04-strings-regex.md` |
| 6.5 | 迭代器与生成器 | `06-collections/05-iterators-generators.md` |
| 7.1 | 执行上下文与调用栈 | `07-runtime-async/01-execution-context-call-stack.md` |
| 7.2 | 内存模型与垃圾回收 | `07-runtime-async/02-memory-garbage-collection.md` |
| 7.3 | 事件循环、宏任务与微任务 | `07-runtime-async/03-event-loop-tasks.md` |
| 7.4 | 回调与 Promise | `07-runtime-async/04-callback-promise.md` |
| 7.5 | async/await 与异步错误处理 | `07-runtime-async/05-async-await-errors.md` |
| 7.6 | 定时器、防抖与节流 | `07-runtime-async/06-timers-debounce-throttle.md` |
| 8.1 | 模块化演进 | `08-modules-errors/01-module-evolution.md` |
| 8.2 | ES Module | `08-modules-errors/02-es-modules.md` |
| 8.3 | CommonJS 与 Node.js 模块 | `08-modules-errors/03-commonjs-node.md` |
| 8.4 | 错误类型、抛出与捕获 | `08-modules-errors/04-errors-throw-catch.md` |
| 9.1 | DOM 查询与修改 | `09-browser-apis/01-dom-query-mutation.md` |
| 9.2 | 事件模型与事件委托 | `09-browser-apis/02-event-model-delegation.md` |
| 9.3 | BOM 与浏览器环境 | `09-browser-apis/03-bom-environment.md` |
| 9.4 | fetch 与网络请求 | `09-browser-apis/04-fetch-requests.md` |
| 9.5 | 存储与缓存边界 | `09-browser-apis/05-storage-cache.md` |
| 9.6 | 页面生命周期与性能观察 | `09-browser-apis/06-page-lifecycle-performance.md` |
| 9.7 | Web Worker | `09-browser-apis/07-web-worker.md` |
| 10.1 | 调试与 DevTools | `10-quality/01-debugging-devtools.md` |
| 10.2 | 性能分析与优化 | `10-quality/02-performance-analysis.md` |
| 10.3 | 前端安全边界 | `10-quality/03-frontend-security.md` |
| 10.4 | 兼容性与特性检测 | `10-quality/04-compatibility-feature-detection.md` |

### 3. 示例选择与公共契约

| 项目 | 约定 |
|------|------|
| 示例选择 | 按当前知识选择最小可观察对象；类型、函数和对象文章用控制台输出，DOM 与网络文章用独立页面 |
| 独立性 | 每篇从读者新建的空目录复现；语言语义篇给出完整 HTML 或脚本文件，模块篇给出目录结构和启动命令，不引用仓库示例目录 |
| 执行入口 | 浏览器篇直接打开页面；ESM、Worker 与 `fetch` 需要 HTTP 时就地给出 `python3 -m http.server`；CommonJS 篇给出 `node` 命令并注明版本确认要求 |
| 文件结构 | 单页示例使用 `index.html` 与 `app.js`；模块篇使用 `main.js`、`math.js` 等直接文件名；只在实际需要时增加目录层级 |
| 输出证据 | 控制台日志、返回值、DOM 文本、网络状态与计时读数；机制文章记录顺序和条件，不只贴最终值 |
| 失败证据 | 每篇包含可复现的错误分支或反例：语法错误、类型错误、未处理 rejection、请求失败、注入失败等 |
| 命名 | 变量与函数名只表达当前示例的对象和关系，不预设跨文章业务字段；示例中不出现“待编写”“示例目录”等占位提示 |
| 文档格式 | 标题直入技术主题；超过 10 行代码折叠；前提、结论与风险保留在折叠外；函数和回调按仓库要求注释 |
| 职责卡继承 | 下列卡片共同继承本节环境、独立性与验证状态；来源和前置按第四节逐项记录 |

## 七、逐篇文章职责

### 1. A01-01 JavaScript 的组成与运行位置

| 字段 | 内容 |
|------|------|
| 身份 | 第 1 章；`01-foundation/01-composition-and-runtime.md` |
| 唯一问题 | JavaScript 在浏览器中由哪些部分组成，脚本在哪里运行？ |
| 知识归属 | 主讲 `K001`、`K002`；外部前置为 HTML 文档结构；不承担类型与语法细节 |
| 类型与深度 | 基础概念；认识 |
| 必须覆盖 | ECMAScript 语言核心、宿主环境、Web API 的分工；浏览器与 Node.js 的宿主差异；`script` 元素位置、`defer`、`async`、`type="module"` 的加载与执行时机；控制台与页面脚本的区别 |
| 明确不覆盖 | 不展开 DOM 查询、事件与网络；不比较浏览器引擎实现；不要求构建工具 |
| 证据与观察 | 通过示例用一个页面依次引入普通脚本、`defer` 脚本和模块脚本，记录日志顺序与 DOM 是否就绪；对照控制台执行 |
| 失败边界 | 脚本在目标元素之前执行导致取不到节点；`async` 顺序不固定；模块从 `file://` 打开被阻止 |
| 核验 | 来源 `S01`、`S32`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 2. A01-02 第一个程序与脚本引入

| 字段 | 内容 |
|------|------|
| 身份 | 第 1 章；`01-foundation/02-first-program.md` |
| 唯一问题 | 怎样从空目录写出并运行第一个可观察结果的程序？ |
| 知识归属 | 主讲 `K003`；引用 `K001`、`K002`；不承担变量规则 |
| 类型与深度 | 接入教程；使用 |
| 必须覆盖 | 新建 HTML 与脚本文件、`<script src>` 与内联脚本、`console.log` 与页面输出、浏览器打开方式、控制台查看结果、常见路径与编码错误 |
| 明确不覆盖 | 不解释执行上下文与调用栈；不引入包管理器与本地服务器（模块篇再讲） |
| 证据与观察 | 通过示例创建 `index.html` 与 `app.js`，输出一行文本和一个计算结果；故意写错文件路径观察控制台报错 |
| 失败边界 | 路径大小写与目录错误、脚本在 DOM 之前执行、编辑器编码不一致 |
| 核验 | 来源 `S01`、`S29`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 3. A01-03 变量、声明与命名

| 字段 | 内容 |
|------|------|
| 身份 | 第 1 章；`01-foundation/03-variables-declarations.md` |
| 唯一问题 | `let`、`const`、`var` 各有什么规则，应该怎样声明变量？ |
| 知识归属 | 主讲 `K004`、`K005`、`K006`；引用 `K003`；提升细节留给 `A04-03` |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | 声明与赋值、`const` 必须初始化且不能重新绑定、块级与函数级作用域差异、重复声明、合法标识符与保留字、命名可读性、严格模式的默认范围与隐式全局赋值 |
| 明确不覆盖 | 不展开暂时性死区的完整机制；不讨论模块导出绑定 |
| 证据与观察 | 通过示例对照三种声明在块内、重复声明和重新赋值时的结果；在经典脚本与模块中执行隐式赋值 |
| 失败边界 | `const` 声明未初始化、重复声明报错、非严格模式下意外创建全局变量 |
| 核验 | 来源 `S01`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 4. A01-04 表达式与运算符

| 字段 | 内容 |
|------|------|
| 身份 | 第 1 章；`01-foundation/04-expressions-operators.md` |
| 唯一问题 | 表达式如何求值，运算符的优先级与结合性怎样影响结果？ |
| 知识归属 | 主讲 `K007`、`K008`；引用 `K004`；转换细节由 `A02-06` 主讲 |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | 表达式与语句区别、算术与赋值运算符、比较与逻辑运算符、条件运算符、逗号运算符、优先级与结合性、括号改变求值顺序、副作用与求值顺序 |
| 明确不覆盖 | 不系统讲类型转换算法；不展开位运算在工程中的技巧 |
| 证据与观察 | 通过示例用同一组数值对比加括号前后的结果，并用日志观察副作用顺序 |
| 失败边界 | 把 `=` 写成 `==`、误判 `&&`/`||` 返回值、赋值链的可读性问题 |
| 核验 | 来源 `S02`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 5. A02-01 原始类型与 typeof

| 字段 | 内容 |
|------|------|
| 身份 | 第 2 章；`02-types/01-primitive-types-typeof.md` |
| 唯一问题 | JavaScript 有哪些原始类型，`typeof` 能判断什么、不能判断什么？ |
| 知识归属 | 主讲 `K009`、`K010`；引用 `K007`；不承担对象结构与原型 |
| 类型与深度 | 基础概念；使用 |
| 必须覆盖 | `undefined`、`null`、`boolean`、`number`、`bigint`、`string`、`symbol` 七种原始类型；`typeof` 八种返回值；`typeof null` 的历史行为；`function` 的返回；包装对象与原始值属性访问 |
| 明确不覆盖 | 不展开 `Symbol` 的元编程用途；不比较 `instanceof` 与构造函数 |
| 证据与观察 | 通过示例对每种值输出 `typeof` 与直接值的对照表；访问字符串属性观察临时包装 |
| 失败边界 | 用 `typeof` 判断 `null` 或数组导致误判；把包装对象当成原始值 |
| 核验 | 来源 `S01`、`S32`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 6. A02-02 数字与精度

| 字段 | 内容 |
|------|------|
| 身份 | 第 2 章；`02-types/02-numbers.md` |
| 唯一问题 | JavaScript 的数字怎样表示，什么情况下会出现精度问题？ |
| 知识归属 | 主讲 `K011`；引用 `K009`；不承担 `Math` 全部方法 |
| 类型与深度 | 运行机制；解释 |
| 必须覆盖 | IEEE 754 双精度、整数与浮点的边界、`0.1 + 0.2`、`NaN` 与 `Number.isNaN`、`Infinity`、安全整数与 `Number.MAX_SAFE_INTEGER`、`BigInt` 与 `n` 后缀、`Number()` 与 `parseInt`/`parseFloat` 的差异 |
| 明确不覆盖 | 不实现任意精度小数库；不展开位运算表示 |
| 证据与观察 | 通过示例输出浮点运算、安全整数溢出、`BigInt` 运算与解析差异的对照 |
| 失败边界 | 用 `===` 比较浮点、把 `parseInt` 当作严格解析、混用 `BigInt` 与 `Number` 报错 |
| 核验 | 来源 `S01`、`S32`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 7. A02-03 字符串与模板字面量

| 字段 | 内容 |
|------|------|
| 身份 | 第 2 章；`02-types/03-strings-template-literals.md` |
| 唯一问题 | 怎样表示、拼接和插值字符串，长度为什么可能与看到的字符数不同？ |
| 知识归属 | 主讲 `K012`；引用 `K009`；字符串方法与正则留给 `A06-04` |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | 单引号、双引号与反引号、转义序列、模板字面量插值、多行文本、标签模板的最小用法、UTF-16 码元与 `.length`、码点遍历的最小示例 |
| 明确不覆盖 | 不展开正则与字符串替换 API；不讨论国际化排序 |
| 证据与观察 | 通过示例输出同一内容三种写法、含换行的模板字符串，以及 emoji 的 `.length` 与码点数量 |
| 失败边界 | 未转义引号、模板插值中的类型转换、按 `.length` 截断 emoji |
| 核验 | 来源 `S01`、`S13`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 8. A02-04 布尔、null、undefined 与真值判断

| 字段 | 内容 |
|------|------|
| 身份 | 第 2 章；`02-types/04-booleans-null-undefined-truthiness.md` |
| 唯一问题 | 哪些值在条件中为假，`null` 与 `undefined` 应如何使用？ |
| 知识归属 | 主讲 `K013`、`K014`；引用 `K009`；相等性算法由 `A02-06` 主讲 |
| 类型与深度 | 核心概念；使用 |
| 必须覆盖 | `true`/`false`、全部假值、`Boolean()` 转换、`null` 与 `undefined` 的来源与差异、默认参数与逻辑运算符中的表现、JSON 序列化时的差异、何时显式返回 `null` |
| 明确不覆盖 | 不展开可选链与空值合并的完整用法；不讨论 `void 0` 的历史技巧 |
| 证据与观察 | 通过示例列出假值表并逐个放入 `if`；对照函数缺省参数与缺失对象属性 |
| 失败边界 | 把 `0`、空字符串当作“没有值”；用 `==` 同时判断 `null` 与 `undefined` 却忽略其他值 |
| 核验 | 来源 `S01`、`S02`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 9. A02-05 对象与数组的初步使用

| 字段 | 内容 |
|------|------|
| 身份 | 第 2 章；`02-types/05-objects-arrays-intro.md` |
| 唯一问题 | 怎样用对象和数组字面量组织一组数据并读取？ |
| 知识归属 | 主讲 `K015`；引用 `K009`；不承担属性描述符、原型和数组方法 |
| 类型与深度 | 基础概念；使用 |
| 必须覆盖 | 对象字面量、键与值、点访问与方括号访问、嵌套对象、数组字面量与索引、`length`、引用语义的最小示例、修改与复制的基本区别 |
| 明确不覆盖 | 不系统讲解构与展开；不展开数组迭代方法；不解释原型链 |
| 证据与观察 | 通过示例用一份任务数据读取嵌套字段与数组元素，修改副本并观察原对象 |
| 失败边界 | 访问不存在的属性得到 `undefined`、把对象赋给另一个变量却误以为复制、数组越界 |
| 核验 | 来源 `S01`、`S07`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 10. A02-06 类型转换与相等性

| 字段 | 内容 |
|------|------|
| 身份 | 第 2 章；`02-types/06-type-conversion-equality.md` |
| 唯一问题 | 值在运算和比较时怎样被转换，`==`、`===` 与 `Object.is` 为什么结果不同？ |
| 知识归属 | 主讲 `K016`、`K017`；前置 `K013`、`K015`；其他文章只引用本结论 |
| 类型与深度 | 运行机制；解释 |
| 必须覆盖 | 显式转换（`Number`、`String`、`Boolean`）、`+` 的字符串拼接规则、`ToPrimitive` 与 `valueOf`/`toString`、抽象相等比较的主要规则、严格相等、`Object.is` 对 `NaN` 与 `±0` 的差异、何时必须显式转换 |
| 明确不覆盖 | 不逐条抄写规范算法；不讨论 `Symbol.toPrimitive` 的完整元编程 |
| 证据与观察 | 通过示例用转换表覆盖 `null`、`undefined`、布尔、数字、字符串与对象；对同一组值分别输出三种相等判断 |
| 失败边界 | `[] == false` 等反直觉结果、对象与原始值比较、用 `==` 代替显式转换导致维护困难 |
| 核验 | 来源 `S02`、`S32`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 11. A03-01 条件分支

| 字段 | 内容 |
|------|------|
| 身份 | 第 3 章；`03-control-flow/01-conditionals.md` |
| 唯一问题 | 如何用 `if`/`else` 和 `switch` 表达多条执行路径？ |
| 知识归属 | 主讲 `K018`；引用 `K013`、`K017`；不重复真值表 |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | `if`/`else if`/`else`、条件表达式、`switch` 的严格相等匹配、`case` 落空与 `break`、`default` 位置、常见分支合并与提前返回 |
| 明确不覆盖 | 不展开错误处理；不把 `switch` 写成表驱动设计模式课程 |
| 证据与观察 | 通过示例用同一输入走不同分支并输出结果；演示漏写 `break` 的落空 |
| 失败边界 | 条件顺序导致不可达分支、`switch` 用宽松相等思维判断、`default` 放错位置 |
| 核验 | 来源 `S03`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 12. A03-02 循环与迭代

| 字段 | 内容 |
|------|------|
| 身份 | 第 3 章；`03-control-flow/02-loops-iteration.md` |
| 唯一问题 | `for`、`while`、`for...of` 与 `for...in` 各适用于什么对象？ |
| 知识归属 | 主讲 `K019`；引用 `K015`、`K018`；迭代器协议留给 `A06-05` |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | `for` 三段表达式、`while` 与 `do...while`、`for...of` 遍历可迭代对象、`for...in` 遍历可枚举属性名、循环变量作用域、避免无限循环 |
| 明确不覆盖 | 不展开生成器与自定义迭代器；不讨论性能基准 |
| 证据与观察 | 通过示例用数组、字符串和对象分别选择循环，输出索引、值与键；对照 `for...in` 遍历数组的问题 |
| 失败边界 | 用 `for...in` 遍历数组得到字符串索引、循环条件不更新、`for...of` 用于普通对象报错 |
| 核验 | 来源 `S03`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 13. A03-03 跳转与提前退出

| 字段 | 内容 |
|------|------|
| 身份 | 第 3 章；`03-control-flow/03-jumps-early-exit.md` |
| 唯一问题 | `break`、`continue` 与 `return` 怎样改变循环和函数的执行路径？ |
| 知识归属 | 主讲 `K020`；引用 `K019`、`K021`；不重复循环语法 |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | `break` 退出当前循环、`continue` 跳过本次迭代、标签语句与嵌套循环退出、函数中的提前 `return`、用提前返回降低嵌套 |
| 明确不覆盖 | 不把标签语句写成通用控制流技巧；不讨论异常作为跳转 |
| 证据与观察 | 通过示例在嵌套循环中分别使用 `break`、标签 `break` 与 `continue`，输出迭代日志 |
| 失败边界 | 以为 `break` 退出外层循环、在 `forEach` 回调中使用 `break` 报错 |
| 核验 | 来源 `S03`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 14. A04-01 函数声明、表达式与调用

| 字段 | 内容 |
|------|------|
| 身份 | 第 4 章；`04-functions-scope/01-function-forms-calls.md` |
| 唯一问题 | 函数有哪几种定义形式，调用时发生了什么？ |
| 知识归属 | 主讲 `K021`；引用 `K007`；提升细节留给 `A04-03` |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | 函数声明、函数表达式、箭头函数、方法简写、调用表达式、函数也是对象、回调的最小示例、函数名与可读性 |
| 明确不覆盖 | 不展开参数默认值与 `this`；不讨论构造函数 |
| 证据与观察 | 通过示例用三种形式实现同一计算并调用；把函数作为参数传入另一个函数 |
| 失败边界 | 表达式在声明前调用、箭头函数不能用作构造函数、回调中丢失上下文 |
| 核验 | 来源 `S04`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 15. A04-02 参数、默认值、剩余参数与返回值

| 字段 | 内容 |
|------|------|
| 身份 | 第 4 章；`04-functions-scope/02-parameters-returns.md` |
| 唯一问题 | 实参怎样传入函数，缺省和多余参数如何处理，函数返回什么？ |
| 知识归属 | 主讲 `K022`、`K023`；引用 `K021`；不展开闭包 |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | 形参与实参、默认参数在 `undefined` 时生效、剩余参数得到数组、`arguments` 的存在与限制、返回值与 `undefined`、返回对象与链式调用、参数传递中引用值的共享 |
| 明确不覆盖 | 不讨论柯里化设计模式；不展开 `Function.prototype.length` 的全部规则 |
| 证据与观察 | 通过示例用不同数量实参调用同一函数，输出参数与返回值；修改传入对象观察外部变化 |
| 失败边界 | 默认值对 `null` 不生效、剩余参数与 `arguments` 混用、箭头函数没有 `arguments` |
| 核验 | 来源 `S04`、`S32`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 16. A04-03 作用域、提升与暂时性死区

| 字段 | 内容 |
|------|------|
| 身份 | 第 4 章；`04-functions-scope/03-scope-hoisting-tdz.md` |
| 唯一问题 | 变量在哪些位置可见，声明在代码执行前处于什么状态？ |
| 知识归属 | 主讲 `K024`、`K025`；引用 `K004`、`K021`；闭包另篇 |
| 类型与深度 | 运行机制；解释 |
| 必须覆盖 | 全局、函数与块级作用域、词法作用域与作用域链、`var` 提升、函数声明提升、`let`/`const` 的暂时性死区、块内函数声明的严格模式行为、遮蔽 |
| 明确不覆盖 | 不讨论执行上下文对象的内部槽；不重复 `this` 绑定 |
| 证据与观察 | 通过示例在声明前后访问同名变量，输出值与错误；嵌套函数读取外层变量 |
| 失败边界 | 认为 `let` 也会初始化为 `undefined`、在 TDZ 中访问导致 `ReferenceError`、循环中 `var` 与 `let` 的差异 |
| 核验 | 来源 `S05`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 17. A04-04 闭包

| 字段 | 内容 |
|------|------|
| 身份 | 第 4 章；`04-functions-scope/04-closures.md` |
| 唯一问题 | 函数怎样记住外层变量，这种记忆何时带来问题？ |
| 知识归属 | 主讲 `K026`；引用 `K024`、`K025`；内存回收留给 `A07-02` |
| 类型与深度 | 运行机制；解释 |
| 必须覆盖 | 闭包形成条件、计数器与私有状态、循环中捕获变量、工厂函数、事件回调中的闭包、闭包持有的生命周期边界 |
| 明确不覆盖 | 不展开模块模式与设计模式；不量化内存占用 |
| 证据与观察 | 通过示例用计数器验证状态保留；用 `var` 与 `let` 循环注册回调对比输出 |
| 失败边界 | 循环变量捕获错误、闭包无意延长对象生命周期、在回调中误用共享变量 |
| 核验 | 来源 `S05`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 18. A04-05 this、call/apply/bind 与箭头函数

| 字段 | 内容 |
|------|------|
| 身份 | 第 4 章；`04-functions-scope/05-this-arrow-functions.md` |
| 唯一问题 | `this` 由什么决定，箭头函数为什么表现不同？ |
| 知识归属 | 主讲 `K027`、`K028`；引用 `K021`；不重复作用域链 |
| 类型与深度 | 运行机制；解释 |
| 必须覆盖 | 全局调用、方法调用、`call`/`apply`/`bind`、构造调用、严格模式下 `undefined`、箭头函数捕获外层 `this`、箭头函数不能 `new` 且没有 `arguments` |
| 明确不覆盖 | 不展开类字段初始化顺序；不讨论框架绑定语法 |
| 证据与观察 | 通过示例用同一函数在四种调用位置输出 `this`；对照箭头函数作为回调 |
| 失败边界 | 回调方法丢失 `this`、`bind` 后再次 `bind` 无效、箭头函数用于对象方法 |
| 核验 | 来源 `S06`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 19. A05-01 对象字面量、属性访问与解构

| 字段 | 内容 |
|------|------|
| 身份 | 第 5 章；`05-objects-prototypes/01-object-literals-destructuring.md` |
| 唯一问题 | 怎样安全地读写对象属性，并用解构提取数据？ |
| 知识归属 | 主讲 `K029`；引用 `K015`；不展开属性描述符 |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | 属性简写、计算属性名、方法定义、点与方括号访问、`in` 与 `hasOwn` 的区别、对象解构、数组解构、默认值、别名、剩余属性、嵌套解构 |
| 明确不覆盖 | 不展开展开语法与可选链；不讨论原型链查找 |
| 证据与观察 | 通过示例从嵌套配置对象解构多个字段，含缺失字段与默认值；对照 `in` 与 `hasOwn` 对继承属性的结果 |
| 失败边界 | 解构 `null`/`undefined` 报错、默认值只在 `undefined` 时生效、计算属性名拼写错误 |
| 核验 | 来源 `S07`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 20. A05-02 属性描述符、复制与不可变

| 字段 | 内容 |
|------|------|
| 身份 | 第 5 章；`05-objects-prototypes/02-property-descriptors-copying.md` |
| 唯一问题 | 属性有哪些特征，复制和冻结对象时实际发生了什么？ |
| 知识归属 | 主讲 `K030`、`K031`；引用 `K029`；不重复原型 |
| 类型与深度 | 运行机制；使用 |
| 必须覆盖 | `Object.defineProperty`、`writable`/`enumerable`/`configurable`、访问器属性、`Object.keys` 与 `getOwnPropertyNames`、展开与 `Object.assign` 的浅拷贝、`structuredClone` 的支持范围、`Object.freeze` 的浅层限制 |
| 明确不覆盖 | 不实现完整不可变数据结构库；不讨论代理与反射元编程 |
| 证据与观察 | 通过示例定义不可枚举属性并观察遍历结果；复制嵌套对象后修改内层；冻结后尝试修改 |
| 失败边界 | 认为展开等于深拷贝、冻结只冻结一层、`structuredClone` 无法复制函数与 DOM 节点 |
| 核验 | 来源 `S07`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 21. A05-03 原型链与继承

| 字段 | 内容 |
|------|------|
| 身份 | 第 5 章；`05-objects-prototypes/03-prototype-chain.md` |
| 唯一问题 | 属性查找怎样沿原型链进行，继承关系从哪里来？ |
| 知识归属 | 主讲 `K032`；引用 `K029`；`class` 映射留给 `A05-04` |
| 类型与深度 | 运行机制；解释 |
| 必须覆盖 | `[[Prototype]]` 与 `Object.getPrototypeOf`、构造函数的 `prototype`、`Object.create`、属性查找与遮蔽、`Object.prototype` 的终点、`instanceof` 的基本判断、避免修改内建原型 |
| 明确不覆盖 | 不展开 `class` 语法与私有字段；不讨论混入模式 |
| 证据与观察 | 通过示例用 `Object.create` 建立两级原型并读取同名属性；删除自有属性观察回退 |
| 失败边界 | 把 `prototype` 与实例原型混淆、在原型上放可变共享状态、修改 `Object.prototype` 污染所有对象 |
| 核验 | 来源 `S08`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 22. A05-04 class 与实例

| 字段 | 内容 |
|------|------|
| 身份 | 第 5 章；`05-objects-prototypes/04-class-inheritance.md` |
| 唯一问题 | `class` 语法怎样创建实例并组织继承？ |
| 知识归属 | 主讲 `K033`、`K034`；引用 `K032`；不重讲原型查找 |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | 类声明与类表达式、构造函数、实例字段、原型方法、`extends` 与 `super()`、方法重写与 `super.method()`、静态成员、私有 `#` 字段、访问器、类内部的严格模式 |
| 明确不覆盖 | 不展开装饰器提案；不讨论多重继承模拟 |
| 证据与观察 | 通过示例定义基类与子类，创建实例并调用重写方法；访问私有字段验证外部不可见 |
| 失败边界 | 子类构造器在 `super()` 前使用 `this`、忘记 `super()`、把私有字段当作普通属性 |
| 核验 | 来源 `S08`、`S32`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 23. A05-05 内置对象：JSON、Date 与 Math

| 字段 | 内容 |
|------|------|
| 身份 | 第 5 章；`05-objects-prototypes/05-builtins-json-date-math.md` |
| 唯一问题 | 怎样安全地序列化数据、处理时间并进行数值计算？ |
| 知识归属 | 主讲 `K035`、`K036`；引用 `K029`、`K011`；不展开国际化格式化课程 |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | `JSON.stringify`/`parse`、可序列化类型与丢失规则、循环引用报错、`reviver`/`replacer` 的最小用法、`Date` 时间戳与本地/UTC 读取、解析字符串的差异、`Math` 舍入与随机数的边界 |
| 明确不覆盖 | 不实现日期库；不把 `Math.random` 当作安全随机源 |
| 证据与观察 | 通过示例序列化含 `undefined`、`Date` 与循环引用的对象；输出本地时间与 UTC 字段；演示浮点舍入 |
| 失败边界 | JSON 往返丢失类型、`new Date("...")` 解析不一致、`Math.round` 对负数的结果 |
| 核验 | 来源 `S09`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 24. A05-06 可选链、空值合并与展开

| 字段 | 内容 |
|------|------|
| 身份 | 第 5 章；`05-objects-prototypes/06-optional-chaining-spread.md` |
| 唯一问题 | 怎样安全读取深层属性并用展开组合对象和数组？ |
| 知识归属 | 主讲 `K037`；引用 `K014`、`K029`；不重复解构 |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | `?.` 对 `null`/`undefined` 的短路、`?.[]` 与 `?.()`、`??` 仅在空值时回退、`??` 与 `||` 的差异、不可与 `&&`/`||` 无括号混用、对象与数组展开、展开的浅拷贝与顺序覆盖 |
| 明确不覆盖 | 不把可选链当作普遍的错误处理；不展开剩余参数（函数篇已讲） |
| 证据与观察 | 通过示例对缺失中间节点取值、用 `||` 与 `??` 处理 `0` 和空字符串；展开后修改嵌套值 |
| 失败边界 | `obj?.a.b` 只保护 `a`、用 `||` 覆盖合法假值、展开只复制一层 |
| 核验 | 来源 `S10`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 25. A06-01 数组创建与增删改查

| 字段 | 内容 |
|------|------|
| 身份 | 第 6 章；`06-collections/01-arrays-basics.md` |
| 唯一问题 | 数组的长度和元素怎样随增删操作变化？ |
| 知识归属 | 主讲 `K038`；引用 `K015`；迭代方法另篇 |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | 数组字面量与 `Array.from`、索引读写、`length` 的可写性、`push`/`pop`/`shift`/`unshift`、`splice`/`slice`、`indexOf`/`includes`、稀疏数组与 `delete` 的边界、浅拷贝 |
| 明确不覆盖 | 不展开 `map`/`filter`/`reduce`；不比较数据结构性能 |
| 证据与观察 | 通过示例对同一数组执行增删操作并记录长度与内容；演示 `splice` 与 `slice` 的差异 |
| 失败边界 | 修改 `length` 截断数组、`splice` 参数误用、`includes` 与 `indexOf` 对 `NaN` 的差异 |
| 核验 | 来源 `S11`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 26. A06-02 数组迭代与高阶方法

| 字段 | 内容 |
|------|------|
| 身份 | 第 6 章；`06-collections/02-array-iteration-methods.md` |
| 唯一问题 | `map`、`filter`、`reduce` 等方法如何选择，怎样避免副作用？ |
| 知识归属 | 主讲 `K039`、`K040`；引用 `K038`、`K021`；不重复循环语法 |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | 回调参数、`map`/`filter`/`find`/`some`/`every`、`reduce` 的累加器与初始值、`forEach` 的返回值、链式调用、`sort` 的比较函数与原地修改、`flat`/`flatMap`、在高阶方法中修改外部变量的问题 |
| 明确不覆盖 | 不展开惰性求值与迭代器；不讨论性能基准 |
| 证据与观察 | 通过示例用同一组任务数据完成筛选、映射与汇总，记录中间结果；对照 `sort` 默认字符串比较 |
| 失败边界 | `reduce` 空数组无初始值报错、`sort` 默认按字符串排序、回调中遗漏 `return` |
| 核验 | 来源 `S11`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 27. A06-03 Map、Set 与 Weak 集合

| 字段 | 内容 |
|------|------|
| 身份 | 第 6 章；`06-collections/03-map-set-weak.md` |
| 唯一问题 | 何时用 `Map`、`Set` 取代普通对象和数组？ |
| 知识归属 | 主讲 `K041`；引用 `K029`、`K031`；不展开算法复杂度课程 |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | `Map` 的键类型与插入顺序、`get`/`set`/`has`/`delete`/`size`、`Set` 去重与 `SameValueZero`、迭代方式、对象键与字符串键的差异、`WeakMap`/`WeakSet` 的键限制与回收边界 |
| 明确不覆盖 | 不实现缓存框架；不承诺垃圾回收时刻 |
| 证据与观察 | 通过示例用对象作为 `Map` 键并与普通对象键对照；用 `Set` 去重；观察 `WeakMap` 不可迭代 |
| 失败边界 | 用 `map[key]` 访问 `Map`、把原始值作为 `WeakMap` 键、依赖 `WeakMap` 的枚举 |
| 核验 | 来源 `S12`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 28. A06-04 字符串处理与正则表达式

| 字段 | 内容 |
|------|------|
| 身份 | 第 6 章；`06-collections/04-strings-regex.md` |
| 唯一问题 | 怎样用字符串方法和正则完成查找、替换与提取？ |
| 知识归属 | 主讲 `K042`、`K043`；引用 `K012`；不重复字符串表示 |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | `slice`/`substring`/`split`/`trim`/`startsWith`/`includes`、大小写转换、Unicode 码点遍历、正则字面量与 `RegExp`、`test`/`exec`/`match`/`matchAll`/`replace`、标志 `g`/`i`/`m`/`s`/`u`、分组与命名分组的最小用法 |
| 明确不覆盖 | 不写完整正则语法课程；不展开回溯性能分析 |
| 证据与观察 | 通过示例从一段文本中提取日期或标签，输出匹配结果与替换结果；对照有无 `g` 标志的 `exec` |
| 失败边界 | `lastIndex` 残留导致结果变化、未转义用户输入构造正则、`.` 与换行、按码元处理 emoji |
| 核验 | 来源 `S13`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 29. A06-05 迭代器与生成器

| 字段 | 内容 |
|------|------|
| 身份 | 第 6 章；`06-collections/05-iterators-generators.md` |
| 唯一问题 | 可迭代协议怎样让 `for...of` 工作，生成器如何分步产出值？ |
| 知识归属 | 主讲 `K044`、`K045`；引用 `K019`、`K021`；不重复数组方法 |
| 类型与深度 | 运行机制；解释 |
| 必须覆盖 | `Symbol.iterator`、`next()` 的 `value`/`done`、自定义可迭代对象、迭代器的提前关闭、`function*`、`yield` 的暂停与恢复、`yield*` 委托、生成器作为迭代器的使用 |
| 明确不覆盖 | 不展开异步生成器；不实现完整惰性求值库 |
| 证据与观察 | 通过示例手写一个可迭代对象并用 `for...of` 消费；用生成器逐步输出值并记录 `done` |
| 失败边界 | 可迭代对象返回非迭代器、忘记 `done: true` 导致死循环、`for...of` 中断后的清理 |
| 核验 | 来源 `S14`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 30. A07-01 执行上下文与调用栈

| 字段 | 内容 |
|------|------|
| 身份 | 第 7 章；`07-runtime-async/01-execution-context-call-stack.md` |
| 唯一问题 | 函数调用时执行环境怎样建立和销毁，调用栈如何决定执行顺序？ |
| 知识归属 | 主讲 `K046`、`K047`；引用 `K024`；不重复作用域可见性 |
| 类型与深度 | 运行机制；解释 |
| 必须覆盖 | 全局与函数执行上下文、词法环境与变量环境的最小模型、调用栈的压入与弹出、同步执行顺序、递归、栈溢出与 `RangeError`、断点中的调用栈观察 |
| 明确不覆盖 | 不讨论引擎内部实现细节；不承诺尾调用优化 |
| 证据与观察 | 通过示例用嵌套函数输出进入与离开日志；用递归触发栈溢出并查看错误 |
| 失败边界 | 把调用栈与任务队列混为一谈、递归缺少终止条件、认为所有浏览器都做尾调用优化 |
| 核验 | 来源 `S05`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 31. A07-02 内存模型与垃圾回收

| 字段 | 内容 |
|------|------|
| 身份 | 第 7 章；`07-runtime-async/02-memory-garbage-collection.md` |
| 唯一问题 | 值存放在哪里，什么时候会被回收，什么情况会阻止回收？ |
| 知识归属 | 主讲 `K048`、`K049`；引用 `K032`、`K026`；不展开引擎源码 |
| 类型与深度 | 运行机制；诊断 |
| 必须覆盖 | 原始值与对象的存储差异（概念层）、引用与可达性、标记清除的基本思路、闭包与全局引用造成的持有、未移除的监听器和定时器、分离 DOM 节点、用 DevTools 内存快照定位持有链 |
| 明确不覆盖 | 不承诺具体回收时机；不用 `WeakRef` 实现业务缓存 |
| 证据与观察 | 通过示例用定时器、事件监听和全局数组分别持有对象，观察快照中的保留路径 |
| 失败边界 | 认为 `null` 赋值立即释放内存、把内存增长都当成泄漏、依赖不可靠的回收时机 |
| 核验 | 来源 `S15`、`S29`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 32. A07-03 事件循环、宏任务与微任务

| 字段 | 内容 |
|------|------|
| 身份 | 第 7 章；`07-runtime-async/03-event-loop-tasks.md` |
| 唯一问题 | 异步回调在什么时候执行，任务和微任务的顺序由什么决定？ |
| 知识归属 | 主讲 `K050`、`K051`；引用 `K046`、`K044`；不展开 Promise API |
| 类型与深度 | 运行机制；解释 |
| 必须覆盖 | 调用栈、任务队列、微任务队列、每个任务后的微任务检查点、`setTimeout` 与 Promise 回调的顺序、渲染与任务的交替、长任务阻塞输入与绘制、`queueMicrotask` 的最小用法 |
| 明确不覆盖 | 不讨论 Node.js 事件循环的全部阶段；不量化帧率 |
| 证据与观察 | 通过示例用同步日志、`setTimeout`、Promise 与 `queueMicrotask` 输出顺序；用长循环观察点击响应延迟 |
| 失败边界 | 认为 `setTimeout(fn, 0)` 立即执行、微任务中无限递归阻塞渲染、把事件循环与事件冒泡混淆 |
| 核验 | 来源 `S16`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 33. A07-04 回调与 Promise

| 字段 | 内容 |
|------|------|
| 身份 | 第 7 章；`07-runtime-async/04-callback-promise.md` |
| 唯一问题 | 怎样用 Promise 组织异步结果、错误和多个任务的组合？ |
| 知识归属 | 主讲 `K052`、`K053`；引用 `K050`、`K021`；不展开 `async`/`await` |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | 回调与错误优先约定、回调嵌套的问题、Promise 三种状态与不可逆、`then` 返回新 Promise、`catch` 与 `finally`、`Promise.all`/`allSettled`/`race`/`any`、thenable 与返回值传递 |
| 明确不覆盖 | 不实现 Promise polyfill；不展开并发调度算法 |
| 证据与观察 | 通过示例把嵌套回调改写为 Promise 链，记录各阶段值；对照组合方法在部分失败时的结果 |
| 失败边界 | 忘记 `return` 导致链断裂、在 `then` 中抛错未捕获、`race` 与 `any` 的差异误用 |
| 核验 | 来源 `S17`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 34. A07-05 async/await 与异步错误处理

| 字段 | 内容 |
|------|------|
| 身份 | 第 7 章；`07-runtime-async/05-async-await-errors.md` |
| 唯一问题 | `await` 怎样暂停函数，异步错误如何传播和捕获？ |
| 知识归属 | 主讲 `K054`；引用 `K053`；不重复 Promise 状态 |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | `async` 函数总是返回 Promise、`await` 的暂停与恢复、串行与并行（`Promise.all`）、`try`/`catch` 捕获 rejection、错误继续向上传播、未处理 rejection、`finally` 清理 |
| 明确不覆盖 | 不展开顶层 `await` 的模块边界；不讨论取消语义（网络篇） |
| 证据与观察 | 通过示例对比串行 `await` 与并行 `Promise.all` 的耗时；在 `async` 函数中抛出并捕获错误 |
| 失败边界 | 在 `forEach` 回调中使用 `await` 不会等待、错误被吞掉、并行请求误写成串行 |
| 核验 | 来源 `S17`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 35. A07-06 定时器、防抖与节流

| 字段 | 内容 |
|------|------|
| 身份 | 第 7 章；`07-runtime-async/06-timers-debounce-throttle.md` |
| 唯一问题 | 定时器的时间精度如何，怎样限制高频事件的执行次数？ |
| 知识归属 | 主讲 `K055`、`K056`；引用 `K050`、`K021`；不展开事件系统 |
| 类型与深度 | 设计与实践；设计 |
| 必须覆盖 | `setTimeout`/`setInterval` 的返回值与清除、最小延迟与嵌套定时器限制、实际延迟与漂移、后台标签页节流、防抖的前沿与后沿、节流的固定间隔、取消与清理 |
| 明确不覆盖 | 不实现完整调度器；不承诺各浏览器定时精度一致 |
| 证据与观察 | 通过示例测量连续定时器的实际间隔；用输入事件对比原始、防抖和节流的调用次数 |
| 失败边界 | 忘记清理造成重复执行、用 `setInterval` 处理耗时任务导致堆积、在页面卸载后仍触发回调 |
| 核验 | 来源 `S18`、`S16`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 36. A08-01 模块化演进

| 字段 | 内容 |
|------|------|
| 身份 | 第 8 章；`08-modules-errors/01-module-evolution.md` |
| 唯一问题 | 从全局脚本到 ES Module，模块化解决了哪些问题？ |
| 知识归属 | 主讲 `K057`；引用 `K001`；不展开 ESM 语法细节 |
| 类型与深度 | 演进与概念；认识 |
| 必须覆盖 | 全局脚本的命名冲突与加载顺序、IIFE 的作用与局限、CommonJS 与 AMD 的历史定位、ESM 的静态依赖与作用域隔离、模块与脚本的差异 |
| 明确不覆盖 | 不写打包工具史；不比较模块加载器性能 |
| 证据与观察 | 通过示例用两个全局脚本制造同名变量冲突，再用 IIFE 与模块隔离 |
| 失败边界 | 认为模块只是文件拆分、把 `type="module"` 当作普通脚本、遗漏模块的严格模式 |
| 核验 | 来源 `S19`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 37. A08-02 ES Module

| 字段 | 内容 |
|------|------|
| 身份 | 第 8 章；`08-modules-errors/02-es-modules.md` |
| 唯一问题 | `import`/`export` 如何解析、求值，循环依赖时会发生什么？ |
| 知识归属 | 主讲 `K058`、`K059`；引用 `K057`；不重复模块历史 |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | 命名导出与默认导出、重导出、导入绑定只读且为活绑定、导入提升与模块图求值、循环依赖的 TDZ 与部分初始化、`type="module"` 的加载规则、动态 `import()`、`import.meta` 的最小用法 |
| 明确不覆盖 | 不展开打包器解析策略；不讨论 import maps 的完整配置 |
| 证据与观察 | 通过示例用三个模块组成导入图，输出求值顺序；构造循环依赖观察实际值 |
| 失败边界 | 从 `file://` 加载模块被阻止、修改导入绑定报错、循环依赖中提前访问未初始化绑定 |
| 核验 | 来源 `S19`、`S32`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 38. A08-03 CommonJS 与 Node.js 模块

| 字段 | 内容 |
|------|------|
| 身份 | 第 8 章；`08-modules-errors/03-commonjs-node.md` |
| 唯一问题 | `require` 与 `module.exports` 怎样工作，和 ESM 的核心差异是什么？ |
| 知识归属 | 主讲 `K060`；引用 `K057`；不转向 Node.js 服务端课程 |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | `require` 的同步解析与缓存、`module.exports` 与 `exports` 别名、`__dirname`/`__filename`、模块作用域包装、CommonJS 与 ESM 的加载时机和绑定差异、Node.js 中的互操作边界 |
| 明确不覆盖 | 不展开包管理器与依赖版本；不实现加载器 |
| 证据与观察 | 通过示例创建两个 CommonJS 文件，验证缓存与导出对象；对照同一逻辑的 ESM 版本 |
| 失败边界 | 重新赋值 `exports` 导致导出失效、循环 `require` 得到部分对象、在 ESM 中直接使用 `require` |
| 核验 | 来源 `S20`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 39. A08-04 错误类型、抛出与捕获

| 字段 | 内容 |
|------|------|
| 身份 | 第 8 章；`08-modules-errors/04-errors-throw-catch.md` |
| 唯一问题 | 错误如何分类、抛出和捕获，异步错误怎样不丢失？ |
| 知识归属 | 主讲 `K061`、`K062`；引用 `K021`、`K054`；不重复 Promise 链 |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | `Error` 与常见子类、`throw` 任意值的问题、`try`/`catch`/`finally`、错误对象的 `message`/`name`/`cause`、自定义错误类、异步函数中的捕获、未处理 rejection 与 `unhandledrejection`、全局 `error` 事件的最小用法 |
| 明确不覆盖 | 不建立完整监控平台；不讨论跨域脚本错误细节 |
| 证据与观察 | 通过示例抛出不同类型错误并输出 `name` 与 `message`；制造未处理 rejection 观察全局事件 |
| 失败边界 | `catch` 吞掉错误不记录、`finally` 中的 `return` 覆盖异常、只处理同步错误 |
| 核验 | 来源 `S21`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 40. A09-01 DOM 查询与修改

| 字段 | 内容 |
|------|------|
| 身份 | 第 9 章；`09-browser-apis/01-dom-query-mutation.md` |
| 唯一问题 | 怎样选中节点并安全地修改内容、属性和样式？ |
| 知识归属 | 主讲 `K063`、`K064`；引用 `K029`；XSS 完整边界留给 `A10-03` |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | DOM 树与节点类型、`getElementById`/`querySelector`/`querySelectorAll`、静态与动态集合、父子兄弟遍历、`textContent` 与 `innerHTML`、`createElement`/`append`/`remove`、`classList`/`dataset`/`style`、`DocumentFragment` 的最小用法 |
| 明确不覆盖 | 不重复 HTML 元素语义；不展开虚拟 DOM 与框架 |
| 证据与观察 | 通过示例查询列表节点，修改文本、类名与属性；插入新节点并观察页面 |
| 失败边界 | 脚本在 DOM 之前执行、`querySelectorAll` 返回静态集合、用 `innerHTML` 拼接用户输入 |
| 核验 | 来源 `S22`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 41. A09-02 事件模型与事件委托

| 字段 | 内容 |
|------|------|
| 身份 | 第 9 章；`09-browser-apis/02-event-model-delegation.md` |
| 唯一问题 | 事件怎样传播，委托在什么条件下可靠？ |
| 知识归属 | 主讲 `K065`、`K066`；引用 `K063`；不重复 DOM 查询 |
| 类型与深度 | 运行机制；使用 |
| 必须覆盖 | 捕获、目标与冒泡阶段、`addEventListener` 的 `capture`/`once`/`passive`、`removeEventListener` 的匹配条件、`event.target` 与 `currentTarget`、`preventDefault` 与 `stopPropagation`、事件委托与 `closest`、动态节点的监听 |
| 明确不覆盖 | 不展开自定义事件与框架事件系统；不承诺所有事件都冒泡 |
| 证据与观察 | 通过示例在嵌套元素上注册捕获与冒泡监听，输出顺序；用父元素委托处理动态按钮 |
| 失败边界 | 移除监听时函数或 `capture` 不一致、在委托中忽略 `stopPropagation`、对不冒泡事件使用委托 |
| 核验 | 来源 `S23`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 42. A09-03 BOM 与浏览器环境

| 字段 | 内容 |
|------|------|
| 身份 | 第 9 章；`09-browser-apis/03-bom-browser-environment.md` |
| 唯一问题 | 脚本怎样读取和改变地址、历史记录与浏览器环境信息？ |
| 知识归属 | 主讲 `K067`；引用 `K001`；不重复定位与权限 API |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | `location` 的字段与 `assign`/`replace`/`reload`、`URL` 与 `URLSearchParams`、`history.pushState`/`replaceState` 与 `popstate`、`navigator.userAgent` 的不可靠性、`onLine`、屏幕与语言信息、`setTimeout` 所在全局环境 |
| 明确不覆盖 | 不实现单页路由；不展开浏览器指纹与权限策略 |
| 证据与观察 | 通过示例读取查询参数并更新地址，使用历史记录前进后退；输出 `navigator` 的常用字段 |
| 失败边界 | 用 `userAgent` 做精确特性判断、改写历史后未处理 `popstate`、`replace` 与 `assign` 混用 |
| 核验 | 来源 `S24`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 43. A09-04 fetch 与网络请求

| 字段 | 内容 |
|------|------|
| 身份 | 第 9 章；`09-browser-apis/04-fetch-network.md` |
| 唯一问题 | 怎样发起请求、读取响应，并区分 HTTP 错误、网络错误与中断？ |
| 知识归属 | 主讲 `K068`、`K069`；引用 `K053`；不展开 HTTP 协议课程 |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | `fetch` 返回 Promise、`response.ok`/`status`/`headers`、`json`/`text` 只能读取一次、GET 与 POST、请求头与 JSON 体、同源与 CORS 的基本边界、`AbortController` 与 `AbortSignal.timeout`、错误分类 |
| 明确不覆盖 | 不实现请求库；不讨论鉴权协议与缓存细节 |
| 证据与观察 | 通过示例请求本地静态 JSON 与一个不存在的路径，记录状态码与错误；用 `AbortController` 中断请求 |
| 失败边界 | 把 404 当成 rejection、重复读取响应体报错、跨域缺少 CORS 头 |
| 核验 | 来源 `S25`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 44. A09-05 存储与缓存边界

| 字段 | 内容 |
|------|------|
| 身份 | 第 9 章；`09-browser-apis/05-storage-cache.md` |
| 唯一问题 | Cookie、Web Storage、IndexedDB 与 HTTP 缓存各自适合保存什么？ |
| 知识归属 | 主讲 `K070`、`K071`；引用 `K029`、`K068`；不重复安全威胁模型 |
| 类型与深度 | 设计与实践；设计 |
| 必须覆盖 | Cookie 的读写限制与生命周期、`localStorage`/`sessionStorage` 的同步字符串存储与容量边界、`storage` 事件、IndexedDB 的异步事务模型、HTTP 缓存响应头、`navigator.storage.estimate()` 与配额异常、敏感数据不应放入 Web Storage |
| 明确不覆盖 | 不实现离线应用框架；不展开 Service Worker 缓存策略 |
| 证据与观察 | 通过示例用三种存储保存同一份数据，记录容量、同步性与生命周期差异；读取配额估算 |
| 失败边界 | 容量超限抛出异常未处理、把隐私数据存入 `localStorage`、缓存导致更新不生效 |
| 核验 | 来源 `S26`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 45. A09-06 页面生命周期与性能观察

| 字段 | 内容 |
|------|------|
| 身份 | 第 9 章；`09-browser-apis/06-page-lifecycle-performance.md` |
| 唯一问题 | 页面在什么时机加载完成，怎样测量关键时间点？ |
| 知识归属 | 主讲 `K072`、`K073`；引用 `K063`、`K050`；不重复事件循环机制 |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | `readyState`、`DOMContentLoaded`、`load`、`pageshow`/`pagehide`、`visibilitychange`、资源加载对事件的影响、`performance.now()`、Navigation Timing 的关键时间点、`PerformanceObserver` 的最小用法、实验室测量与真实用户数据的区别 |
| 明确不覆盖 | 不建立完整 RUM 系统；不展开 LCP/CLS/INP 的优化策略 |
| 证据与观察 | 通过示例在独立页面记录各事件顺序与导航时间读数；对比添加大图前后的 `load` 时间 |
| 失败边界 | 在 `DOMContentLoaded` 中等待图片、把 `load` 当作所有异步任务完成、混用时间基准 |
| 核验 | 来源 `S27`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 46. A09-07 Web Worker

| 字段 | 内容 |
|------|------|
| 身份 | 第 9 章；`09-browser-apis/07-web-worker.md` |
| 唯一问题 | 怎样把计算移出主线程并安全传递数据？ |
| 知识归属 | 主讲 `K074`；引用 `K050`、`K073`；不展开共享内存与原子操作 |
| 类型与深度 | 语法与 API；使用 |
| 必须覆盖 | Worker 的创建与脚本 URL、`postMessage` 与 `message` 事件、结构化克隆、可转移对象的基本概念、Worker 中不可访问 DOM、`terminate` 与清理、模块 Worker 的边界、同源限制 |
| 明确不覆盖 | 不实现并行计算框架；不展开 SharedArrayBuffer 与锁 |
| 证据与观察 | 通过示例把一段耗时计算放入 Worker，对比主线程是否仍能响应；传递对象并观察副本 |
| 失败边界 | 在 Worker 中访问 `document` 报错、传递不可克隆对象、忘记终止导致资源占用 |
| 核验 | 来源 `S28`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 47. A10-01 调试与 DevTools

| 字段 | 内容 |
|------|------|
| 身份 | 第 10 章；`10-quality/01-debugging-devtools.md` |
| 唯一问题 | 怎样用断点、作用域和网络记录把问题定位到具体代码？ |
| 知识归属 | 主讲 `K075`；引用 `K046`、`K061`、`K068`；不重复性能面板 |
| 类型与深度 | 测试与排障；诊断 |
| 必须覆盖 | Sources 面板断点、条件断点、`debugger` 语句、单步执行、作用域与监视表达式、调用栈、异常暂停、Network 面板的请求与状态、Console 的记录与分组、修复后复测 |
| 明确不覆盖 | 不写编辑器插件教程；不展开远程调试协议 |
| 证据与观察 | 通过示例注入一个条件分支错误，用断点读取变量并修复；定位一个 404 请求 |
| 失败边界 | 只在 `console.log` 中猜值、修改运行时变量误认为源码已改、忽略缓存中的旧脚本 |
| 核验 | 来源 `S29`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 48. A10-02 性能分析与优化

| 字段 | 内容 |
|------|------|
| 身份 | 第 10 章；`10-quality/02-performance-analysis.md` |
| 唯一问题 | 怎样用性能录制找到瓶颈，并验证优化是否有效？ |
| 知识归属 | 主讲 `K076`、`K077`；引用 `K073`、`K051`、`K049`；不重复性能 API 用法 |
| 类型与深度 | 测试与排障；诊断 |
| 必须覆盖 | Performance 面板录制、主线程活动、长任务、函数调用火焰图、布局与绘制成本、内存快照与分配时间线、固定条件的前后对照、优化回退 |
| 明确不覆盖 | 不承诺通用加速比例；不展开浏览器渲染管线源码 |
| 证据与观察 | 通过示例构造列表批量更新与高频回调，录制前后轨迹并记录耗时与长任务 |
| 失败边界 | 在不同设备或数据规模下比较、只看总耗时不看主线程活动、优化后未复测功能 |
| 核验 | 来源 `S29`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 49. A10-03 前端安全边界

| 字段 | 内容 |
|------|------|
| 身份 | 第 10 章；`10-quality/03-frontend-security.md` |
| 唯一问题 | 用户数据进入页面和存储时，哪些位置会失守？ |
| 知识归属 | 主讲 `K078`、`K079`；引用 `K064`、`K070`、`K061`；不重复 DOM API 教程 |
| 类型与深度 | 质量与安全；使用 |
| 必须覆盖 | XSS 的注入位置、`innerHTML` 与 `textContent`、属性与 URL 上下文、转义与消毒的边界、敏感数据与 `localStorage`、第三方脚本风险、CSP 的基本作用与限制、`Trusted Types` 的存在与兼容边界 |
| 明确不覆盖 | 不写渗透测试教程；不承诺单一措施防御所有攻击 |
| 证据与观察 | 通过示例用受控字符串对比 `innerHTML` 注入与 `textContent` 显示；配置最小 CSP 观察被阻止的脚本 |
| 失败边界 | 只转义尖括号却忽略属性上下文、把 CSP 当作 XSS 的唯一防线、在前端保存长期令牌 |
| 核验 | 来源 `S30`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

### 50. A10-04 兼容性与特性检测

| 字段 | 内容 |
|------|------|
| 身份 | 第 10 章；`10-quality/04-compatibility-feature-detection.md` |
| 唯一问题 | 怎样判断目标环境是否支持某个 API，并在不支持时降级？ |
| 知识归属 | 主讲 `K080`、`K081`；引用 `K001`；不搭建构建链 |
| 类型与深度 | 设计与实践；设计 |
| 必须覆盖 | 特性检测（`in`、`typeof`、`try`/`catch`）、避免 UA 嗅探、渐进增强、兼容数据来源（BCD、caniuse）、polyfill 与转译的区别、原生模块与旧环境边界、降级路径的验证 |
| 明确不覆盖 | 不配置 Babel 或打包器；不承诺所有旧浏览器一致 |
| 证据与观察 | 通过示例对同一 API 分别做存在性检测与调用测试，记录支持与降级分支 |
| 失败边界 | 用版本字符串推断能力、polyfill 加载失败无回退、只在现代浏览器验证就宣称兼容 |
| 核验 | 来源 `S31`、`S01`；2026-11-15 已按本节证据完成实测，结果与未覆盖边界见正文“验证记录与边界” |

## 八、能力覆盖与样板

### 1. 能力覆盖矩阵

| 最终能力 | 支撑知识项 | 负责文章 | 验证方式 | 当前状态 |
|----------|------------|----------|----------|----------|
| 写出并运行第一个程序 | `K001`～`K008` | 第 1 章 | 独立页面、控制台输出与脚本顺序 | 已覆盖：2026-11-15 实测，证据见对应文章“验证记录与边界” |
| 判断类型、转换与相等性 | `K009`～`K017` | 第 2 章 | 类型表、浮点与转换对照 | 已覆盖：2026-11-15 实测，证据见对应文章“验证记录与边界” |
| 组织条件与循环 | `K018`～`K020` | 第 3 章 | 分支与循环路径日志 | 已覆盖：2026-11-15 实测，证据见对应文章“验证记录与边界” |
| 定义函数并解释作用域 | `K021`～`K028` | 第 4 章 | 闭包、提升与 `this` 对照 | 已覆盖：2026-11-15 实测，证据见对应文章“验证记录与边界” |
| 组织对象并解释继承 | `K029`～`K037` | 第 5 章 | 属性查找、复制与类实例 | 已覆盖：2026-11-15 实测，证据见对应文章“验证记录与边界” |
| 处理数组、字符串与集合 | `K038`～`K045` | 第 6 章 | 方法返回值与迭代顺序 | 已覆盖：2026-11-15 实测，证据见对应文章“验证记录与边界” |
| 解释并编写异步代码 | `K046`～`K056` | 第 7 章 | 任务顺序、错误传播与限流次数 | 已覆盖：2026-11-15 实测，证据见对应文章“验证记录与边界” |
| 拆分模块并处理错误 | `K057`～`K062` | 第 8 章 | 模块求值顺序与错误分支 | 已覆盖：2026-11-15 实测，证据见对应文章“验证记录与边界” |
| 操作浏览器页面与网络 | `K063`～`K074` | 第 9 章 | DOM、事件、请求、存储与 Worker 观察 | 已覆盖：2026-11-15 实测，证据见对应文章“验证记录与边界” |
| 调试、分析性能并识别风险 | `K075`～`K081` | 第 10 章 | 断点、性能轨迹、注入与检测对照 | 已覆盖：2026-11-15 实测，证据见对应文章“验证记录与边界” |

### 2. 样板选择

| 项目 | 设计 |
|------|------|
| 主样板 | `A02-06 类型转换与相等性` |
| 选择理由 | 位于类型、表达式与比较的交界，能检验术语准确性、机制解释、最小示例和浏览器证据；比入门概述更能暴露正文质量问题 |
| 重点校准 | `ToPrimitive` 的解释深度、`==` 规则的呈现方式、`Object.is` 的差异、何时应显式转换、控制台输出与实际结果一致 |
| 核心验证 | 用转换表覆盖 `null`、`undefined`、布尔、数字、字符串与对象，对同一组值输出三种相等判断，并在 Chrome 与 Node.js 中对照 |
| 质量判断 | 概念先于示例，示例可独立复现，结果与解释一致，失败分支可见，未验证边界写明 |
| 第二样板 | 暂不设置；若第 9 章 DOM 与事件所需的浏览器证据与语言篇差异过大，再提出并说明理由 |
| 当前状态 | 已完成；样板于 2026-11-15 经用户确认，其余章节按同一标准生成并逐章验收 |

## 九、目录与导航影响

### 1. 拟实施文件范围

| 对象 | 处理设计 | 兼容与边界 |
|------|----------|------------|
| 本设计文件 | `standards/blueprints/frontend/03-javascript.md` | 随规范提交，不进入网站页面 |
| 10 个章节文件夹与 50 篇文章 | 已按本目录逐章新建 | 不预生成空壳文章；旧稿不作为占位保留在新目录 |
| 现有 23 篇平铺 Markdown | 已于 2026-11-15 删除 | 旧 URL 作废，不建跳转；删除前已确认 sidebar、导航、正文与测试引用全部更新 |
| JavaScript sidebar | 已替换为 10 章 50 个真实链接 | 链接全部指向已验收文章；导航缺失目标检查中本模块为 0 |
| 顶栏 JavaScript 入口 | 已由 `01-boundary` 改为 `01-foundation/01-composition-and-runtime.md` | 旧入口随旧文件删除失效；导航测试与回归断言已同步检查 |
| `04-ecmascript` | 本次不改动 | 其现有规划与本模块重复的部分，在后续单独设计中删除或改为标准体系内容 |
| 正文内部链接 | 只链接已存在的主讲文章 | 未创建文章用纯文本引用，不用可点击占位链接 |
| 其他模块引用 | 搜索 `03-javascript` 引用，逐项更新 | 不批量改写无关模块 |

### 2. 阶段顺序

| 顺序 | 动作 | 完成依据 |
|-----:|------|----------|
| 1 | 完成蓝图并自检 | 本文件与结构检查结果 |
| 2 | 用户确认蓝图与样板范围 | 用户明确同意按本目录实施 |
| 3 | 生成并验证 `A02-06` 样板 | 正文、实际运行结果与样板评审 |
| 4 | 用户确认样板 | 深度、证据与表达标准校准 |
| 5 | 按章生成正文并逐章验收 | 每章 `docs:check:strict`、构建与链接检查通过 |
| 6 | 替换 sidebar、顶栏并删除旧稿 | 已执行：`docs:check:strict` 与导航检查通过，回归见第十节 |

## 十、验证与评审

### 1. 验证方案

| 层次 | 检查 | 方法与通过标准 | 当前状态 |
|------|------|----------------|----------|
| 范围 | 读者起点、三条主线、排除项 | 零基础入口存在；框架、TypeScript、构建工具与设计模式不在范围内 | 设计自检 |
| 知识 | 知识项归属与能力支撑 | 81 个知识项均有唯一主讲；10 项能力均有证据方案 | 结构检查 |
| 依赖 | ID 有效、无循环、顺序一致 | 全部内部前置存在且位于主讲文章之前；外部前置明确 | 结构检查 |
| 粒度 | 单篇唯一问题与文章类型 | 每篇一个主要问题；不把基础、机制和排障挤成一篇 | 设计自检 |
| 路径 | 章节与文件编号 | 文件夹 `01`～`10`；各章从 `01` 连续编号；路径表与职责卡一致 | 结构检查 |
| 链接 | 来源与内部链接 | 来源为官方入口；正文只链接已存在文章 | 已执行：`docs:check:strict` 0 错误；导航缺失目标中本模块为 0 |
| 示例 | 独立复现与真实结果 | 每篇从空目录复现；记录浏览器版本与观察；未验证分支明确标注 | 已执行：50 篇均记录 2026-11-15 的实测环境与结果 |
| 渲染 | 折叠、标题与页面阅读 | 按桌面与手机视口核对提示、折叠与代码溢出 | 已执行：`pnpm docs:e2e` 桌面与移动 Chromium 通过 9 项，3 项按设备跳过 |
| 构建 | 构建单元与导航 | `pnpm docs:build:unit frontend`、`docs:check:strict frontend/03-javascript`、`docs:test` | 已执行：`pages=277`、0 错误 0 警告、43 项测试通过 |
| 全站 | 合并、引用与搜索 | `pnpm docs:build:all`、`docs:assemble`、`docs:validate`、`docs:search` | 已执行：7 个单元 `exitCode` 均为 0；803 条路由、断链 0、锚点缺失 0；搜索覆盖率 100% |
| 工作区 | 用户现有改动 | 只改本模块、sidebar、顶栏与蓝图；保留其他未提交改动 | 已检查：仅修改上述文件及 HTML 模块一处失效引用 |

### 2. D01～D10 评审结论

| 门禁 | 结论 | 依据 |
|------|------|------|
| D01 范围 | 通过 | 只规划 JavaScript 语言与浏览器宿主能力，不扩展到框架与构建工程 |
| D02 版本与来源 | 通过 | 以 ECMA-262 与 MDN 为基线，不使用笼统版本承诺；来源为官方入口，正文逐篇复核 |
| D03 方向覆盖 | 通过 | 语言基础完整纳入；HTML/CSS 作为明确外部前置；排除项有归属 |
| D04 知识责任 | 通过 | 81 个知识项逐项指定唯一主讲，跨章主题有边界表 |
| D05 依赖 | 通过 | 前置均指向更早文章；同层顺序有理由；无循环 |
| D06 粒度与命名 | 通过 | 50 篇均为单一问题；标题为“技术对象 + 必要限定”，无空泛章节 |
| D07 能力验证 | 通过 | 10 项能力均有知识支撑与具体观察方案；当前状态为已覆盖并附实测证据 |
| D08 工程边界 | 通过 | 旧稿删除、旧 URL 作废、导航替换与引用检查均有步骤 |
| D09 样板 | 通过 | 选择类型转换与相等性校准机制解释和证据 |
| D10 状态 | 通过 | 规划与完成分开记录，未运行项标为未验证 |

十章五十篇已全部生成、实测并接入导航，本蓝图的规划阶段与实施阶段均告结束。后续维护沿用本文件的知识归属与验证口径：修改正文时同步更新对应职责卡的验证记录；新增文章先补知识项与依赖，再写正文；未重新运行的环境与场景继续标注为未验证。
