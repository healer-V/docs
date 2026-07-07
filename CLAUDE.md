# CLAUDE.md

## 文档编写规范

### 标题结构

- 文章标题必须按层级递进，不得跳级（`#` → `##` → `###` → `####`）
- 每篇文档有且仅有一个 `#` 一级标题
- 同级标题必须使用中文序号按顺序编号：
  - **二级标题**（`##`）：使用 `一、`、`二、`、`三、` …
  - **三级标题**（`###`）：使用 `1.`、`2.`、`3.` …
  - **四级标题**（`####`）：使用 `(1)`、`(2)`、`(3)` …
- 示例：
  ```md
  # 文章标题
  ## 一、第一部分
  ### 1. 小节一
  ### 2. 小节二
  ## 二、第二部分
  ### 1. 小节一
  #### (1) 细分内容
  ```

### VitePress 语法要求

所有 Markdown 文档必须使用 VitePress 支持的扩展语法，包括但不限于：

- **容器提示**：使用 `::: tip`、`::: warning`、`::: danger`、`::: details` 包裹提示性内容 或者使用`>[!tip]` `[!note]`等方式 包裹内容
- **代码组**：多种实现方式对比时使用 `::: code-group` 组织代码块
- **代码块**：标注语言和可选的行高亮，如 `` ```js{1,3-5} ``
- **表格**：结构化数据优先使用表格呈现，保持对齐
- **Frontmatter**：每篇文章必须在顶部使用 YAML frontmatter 声明元数据，规范见下方「Frontmatter 规范」

### Frontmatter 规范

每篇 Markdown 文档**必须**以 YAML frontmatter 开头，用于博客页数据展示和文章分类检索。

#### 必填字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | `string` | 文章标题，与 `#` 一级标题保持一致 |
| `category` | `string` | 文章分类，必须使用下方「分类取值」中的标准值 |

#### 可选字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `tags` | `string[]` | `[]` | 技术标签，最多 4 个，如 `[Vue, TypeScript]` |
| `excerpt` | `string` | 自动提取 | 文章摘要，建议 50-120 字；未填写时从正文自动提取前 120 字 |
| `date` | `string` | `null` | 发布日期，格式 `YYYY-MM-DD`，用于按时间排序 |
| `featured` | `boolean` | `false` | 是否为精选文章 |

#### 分类取值

分类值必须从以下列表中选取，不得自创：

| 目录前缀 | category 值 |
|----------|-------------|
| `frontend/01-html` | `前端 · HTML` |
| `frontend/02-css` | `前端 · CSS` |
| `frontend/03-javascript` | `前端 · JavaScript` |
| `frontend/04-ecmascript` | `前端 · ECMAScript` |
| `frontend/05-typescript` | `前端 · TypeScript` |
| `frontend/06-vue2` | `前端 · Vue 2` |
| `frontend/07-vue3` | `前端 · Vue 3` |
| `frontend/08-react16` | `前端 · React 16` |
| `frontend/09-react18` | `前端 · React 18` |
| `backend/01-nodejs` | `后端 · Node.js` |
| `backend/02-express` | `后端 · Express` |
| `backend/03-nestjs` | `后端 · NestJS` |
| `backend/04-java` | `后端 · Java` |
| `backend/05-python` | `后端 · Python` |
| `backend/06-golang` | `后端 · Golang` |
| `backend/07-springboot` | `后端 · Spring Boot` |
| `backend/08-django` | `后端 · Django` |
| `backend/09-mysql` | `后端 · MySQL` |
| `backend/10-redis` | `后端 · Redis` |
| `backend/11-postgresql` | `后端 · PostgreSQL` |
| `engineering/01-webpack` | `工程化 · Webpack` |
| `engineering/02-vite` | `工程化 · Vite` |
| `operation/00-linux` | `运维 · Linux` |
| `operation/01-shell` | `运维 · Shell` |
| `operation/02-jenkins` | `运维 · Jenkins` |
| `operation/03-cicd` | `运维 · CI/CD` |
| `operation/04-k8s` | `运维 · Kubernetes` |
| `operation/05-docker` | `运维 · Docker` |
| `operation/06-nginx` | `运维 · Nginx` |
| `crossend/01-reactnative` | `跨端 · React Native` |
| `crossend/02-flutter` | `跨端 · Flutter` |
| `crossend/03-harmonyos` | `跨端 · HarmonyOS` |
| `crossend/04-electron` | `跨端 · Electron` |
| `microfrontend/01-qiankun` | `微前端 · Qiankun` |
| `ai/01-fundamentals` | `AI · 基础` |
| `ai/02-prompt` | `AI · Prompt` |
| `ai/03-langchain` | `AI · LangChain` |
| `ai/04-llm-api` | `AI · LLM API` |
| `ai/05-agent` | `AI · Agent` |
| `ai/06-mcp` | `AI · MCP` |
| `ai/07-local-deploy` | `AI · 本地部署` |
| `web3/01-blockchain` | `Web3 · Ethereum` |
| `web3/02-solidity` | `Web3 · Solidity` |
| `web3/03-web3js` | `Web3 · Web3.js` |
| `web3/04-ethersjs` | `Web3 · Ethereum` |
| `web3/05-dapp` | `Web3 · Ethereum` |
| `web3/06-advanced` | `Web3 · Ethereum` |
| `interview` | `面试题` |
| `skill` | `实践技巧` |
| `practices` | `项目实践` |
| `project` | `项目要点` |
| `articles/basic` | `基础知识` |
| `articles/blog` | `博客相关` |
| `articles/browser` | `浏览器` |
| `articles/engineering` | `工程化` |
| `articles/frame` | `跨端框架` |
| `articles/network` | `网络协议` |
| `articles/server` | `服务端` |
| `articles/tools` | `开发工具` |
| `diary` | `随记` |

#### 完整示例

```yaml
---
title: "Vue 3 组合式 API"
category: "前端 · Vue 3"
tags:
  - Vue
  - TypeScript
excerpt: "组合式 API 是 Vue 3 的核心特性，通过 setup 函数将逻辑按功能组织，解决了选项式 API 在复杂组件中代码分散的问题。"
date: 2026-03-15
---
```

### 内容风格

#### 语言表述

- 使用简洁清晰的中文表述，技术术语保留英文原文（如 `Promise`、`React`、`WebSocket`），首次出现时可附中文释义
- 表述应准确无歧义，避免"可能"、"大概"、"也许"等模糊措辞，给出明确的结论或指引
- 人称统一使用第二人称"你"，保持亲切感，避免"我们"、"笔者"等表述
- 段落之间保持逻辑连贯，使用过渡句衔接不同知识点，避免突兀跳转

#### 代码示例

- 代码示例使用`::: details`包裹外层
- 代码示例必须可运行、有注释，涉及文件路径时需标注完整的相对路径（如 `// src/utils/auth.js`）
- 避免无意义的占位代码（如 `foo`、`bar`、`test123`），使用贴近真实场景的变量名和数据
- 关键代码行使用行高亮标注，引导读者关注重点，如 `` ```js{3-5} ``
- 多种实现方式对比时使用 `::: code-group` 组织，并标注各方式的适用场景
- 代码块上方应有一句话说明该代码的用途或预期效果

#### 内容组织

- 避免大段纯文字堆砌，善用列表、表格、代码块、容器提示拆分内容
- 结构清晰，每个小节聚焦一个主题，单个章节建议不超过屏幕三屏内容
- 重要概念、注意事项、常见错误使用 `::: tip`、`::: warning`、`::: danger` 容器高亮
- 操作步骤使用有序列表，并发/无序内容使用无序列表
- 对比类信息（API 参数、配置项、方案优劣）优先使用表格呈现

#### 图片与媒体

- 图片必须添加有意义的 `alt` 描述文字，不得留空
- 截图应裁剪到关键区域，避免包含无关信息
- 图片文件统一放在对应文档同级的 `images/` 目录下，使用相对路径引用

## 知识目录规划方法

### 通用整理流程

整理某个技术模块目录时，优先按知识体系设计完整目录，再复用已有文件承接内容，缺失内容先以 sidebar 链接占位，后续逐步补文档。

| 顺序 | 步骤 | 处理原则 |
|------|------|----------|
| 1 | 查看现有目录 | 先确认实际 Markdown 文件，不只看 sidebar 配置 |
| 2 | 判断知识闭环 | 按“基础概念 → 核心机制 → 常用能力 → 进阶能力 → 工程实践 → 规范参考”检查缺口 |
| 3 | 重排学习顺序 | 章节顺序应符合学习路径，不按文件创建时间排序 |
| 4 | 复用已有文件 | 能挂载现有文档就不重命名，避免大量链接迁移 |
| 5 | 规划新增文件 | 缺失知识点先补 sidebar 链接，文件后续再逐步补充 |
| 6 | 保持编号连续 | 避免第5章后直接跳第7章等编号断层 |
| 7 | 统一参考章节 | 对比、速查、最佳实践、规范类内容统一放在末尾 |

### HTML 目录规划思路

HTML 按“页面从被浏览器识别到完整交付”的路径组织，核心目标是完整解释一个 HTML 页面如何组织内容、声明资源、承载交互入口，并满足可访问性、SEO、安全和性能要求。

| 章节 | 章节定位 | 主要内容 |
|------|----------|----------|
| 第1章 | HTML 基础 | 概述、文档结构、标签、属性、URL、编码 |
| 第2章 | Head 与资源声明 | meta、title、favicon、link、script、noscript |
| 第3章 | 文本与语义结构 | 文本标签、列表、语义标签、语义化实践 |
| 第4章 | 链接、图片与嵌入 | a、img、audio、video、iframe |
| 第5章 | 表格与表单 | table、form、表单控件、原生校验、提交编码 |
| 第6章 | HTML5 扩展能力 | HTML5 特性、Canvas、Storage、Web Components |
| 第7章 | 工程实践与规范参考 | 可访问性、SEO、安全、性能、HTML5 对比、标签参考 |

### CSS 目录规划思路

CSS 按“样式如何生效 → 元素如何排布 → 页面如何呈现 → 项目中如何维护”的路径组织，核心目标是完整解释 CSS 从选择元素、计算样式、形成布局、渲染视觉、响应交互，到工程化维护的全过程。

| 章节 | 章节定位 | 主要内容 |
|------|----------|----------|
| 第1章 | CSS 基础机制 | 语法、选择器、伪类伪元素、层叠继承、单位、样式计算 |
| 第2章 | 盒模型与格式化上下文 | 盒模型、文档流、BFC、浮动、定位、滚动 |
| 第3章 | CSS 布局系统 | 布局概述、Flex、Grid、多列、响应式、媒体查询、容器查询 |
| 第4章 | 视觉样式与排版 | 字体、文本、颜色、背景、边框、阴影、渐变、滤镜 |
| 第5章 | 动效与交互反馈 | transition、animation、transform、性能、动效可访问性 |
| 第6章 | 现代 CSS 能力 | CSS 变量、现代选择器、@layer、@scope、嵌套、逻辑属性 |
| 第7章 | 工程实践与规范参考 | 预处理器、命名组织、CSS Modules、PostCSS、CSS-in-JS、Tailwind、性能、调试、属性参考 |

### 后续模块复用模板

| 模块类型 | 推荐章节模型 |
|----------|--------------|
| 基础语言类 | 概述 → 语法基础 → 核心机制 → 常用 API → 进阶特性 → 工程实践 → 规范参考 |
| 框架类 | 概述 → 项目创建 → 核心语法 → 组件/状态/路由 → 原理 → 工程实践 → 性能与部署 |
| 工程化工具类 | 概述 → 安装配置 → 核心概念 → 常用场景 → 插件/扩展 → 优化 → 最佳实践 |
| 浏览器/Web API 类 | 概述 → 基础模型 → 核心 API → 事件/异步 → 安全限制 → 性能 → 兼容性参考 |
