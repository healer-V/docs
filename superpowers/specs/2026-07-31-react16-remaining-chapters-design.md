---
title: "React 16.8 第 3～7 章文档重构设计"
tags:
  - React
  - 文档设计
  - 知识体系
excerpt: "规定 React 16.8 第 3～7 章共 35 篇文档的知识边界、文件迁移、正文组织、示例深度和交付验证要求。"
date: 2026-07-31
---

# React 16.8 第 3～7 章文档重构设计

## 一、重构范围

本次重构覆盖 `content/frontend/08-react16/` 中第 3～7 章，共 35 篇文档。第 1 章“核心语法”和第 2 章“数据流”作为既有知识基础，不在本次全文重写范围内。

| 章节 | 文档数量 | 重构方式 |
|------|----------|----------|
| 第 3 章：组件 | 8 篇 | 全文重写，移出类组件迁移文档 |
| 第 4 章：Hooks | 9 篇 | 全文重写，接收类组件迁移文档 |
| 第 5 章：高级能力 | 5 篇 | 全文重写，合并错误边界并补充命令式 API |
| 第 6 章：运行机制与性能优化 | 8 篇 | 全文重写，补齐 ReactDOM 与服务端渲染边界 |
| 第 7 章：工程质量与应用生态 | 5 篇 | 全文重写并调整文件名和主题边界 |

不创建独立示例工程，不增加与知识讲解无关的练习目录、项目脚手架或业务模块。

## 二、正文设计原则

### 1. 直接讲解技术知识

一级标题之后直接进入定义、语法、API、机制或问题说明。正文禁止出现以下内容：

- “上一篇已经使用”“下一篇将介绍”等跨文章串联；
- “学习顺序如下”“完成本节后”等课程说明；
- “学习目标”“学习方法”“实践任务”“验收标准”等固定模板章节；
- “代码均为局部示例”“假定已经引入依赖”等统一编写声明；
- 用流程图、表格或代码块重复展示当前文章目录。

文档之间的先后关系只通过目录编号和 VitePress sidebar 表达。

### 2. 按知识类型组织内容

不同知识点采用适合自身的讲解结构，不强制所有文章套用相同栏目。

| 知识类型 | 推荐展开方式 |
|----------|--------------|
| 语法与 Hook API | 含义与作用 → 调用形式 → 参数与返回值 → 使用规则 → 示例 → 错误写法 |
| 组件设计 | 问题与职责 → 接口设计 → 数据和事件关系 → 适用边界 → 对比示例 |
| 生命周期与副作用 | 触发条件 → 执行时机 → 参数与可用数据 → 清理方式 → 错误行为 |
| 运行机制 | 参与对象 → 执行阶段 → 状态变化 → 可观察结果 → 对应用代码的约束 |
| 性能与工程能力 | 问题证据 → 工具或方案 → 使用条件 → 成本 → 验证方式 |
| 生态工具 | React 16.8 兼容范围 → 解决的问题 → 核心接入方式 → 选型边界 |

### 3. 示例要求

- 主要使用 JavaScript 和 JSX，避免把文档变成 TypeScript 语法教程；
- Props 契约、事件类型或第三方库接口确有必要时，可以补充 TypeScript 或 `PropTypes`；
- 示例必须放在对应规则之后，正文先解释代码要证明的结论；
- 示例之后说明页面、DOM、State、生命周期、控制台或构建结果；
- 局部代码明确交代被省略的上下文，但不在文章开头统一声明；
- 同一篇文档中的数据字段、组件名称和操作保持一致；
- 示例函数、回调和类方法按照项目代码注释规范补充必要注释；
- 不展示与当前知识无关的完整工程配置。

### 4. 版本边界

正文以 React 16.8 为基准。涉及不同版本时必须明确说明：

- React 16.8 使用 `ReactDOM.render` 和 `ReactDOM.hydrate`；
- React 16.8 的批处理范围不同于 React 18 自动批处理；
- React 16.8 的合成事件存在事件池行为；
- React 18 开发环境中的 Effect 额外执行行为不能套用于 React 16.8；
- Router、状态库、请求缓存库和表单库只介绍与 React 16.8 兼容的版本线，不使用当前最新 API 反推旧版本。

## 三、第 3 章：组件

第 3 章负责组件定义、接口组合、职责边界和类组件模型。Hooks 只在第 4 章正式讲解，因此类组件迁移文档移到第 4 章末尾。

| 顺序 | 文件 | 文档标题 | 必须覆盖的内容 |
|------|------|----------|----------------|
| 3.1 | `01-function-components.md` | 函数组件与组件拆分 | 函数组件定义、命名规则、Props 参数、返回值、纯渲染、组件调用与普通函数调用的区别、拆分依据、过度拆分 |
| 3.2 | `02-children-and-composition.md` | children 与组件组合 | `children` 来源、可接受值、单个与多个子节点、具名区域、`React.Children` 常用 API、组合边界 |
| 3.3 | `03-component-responsibility.md` | 组件职责与状态归属 | 展示职责与业务职责、状态位置、数据 Props 与事件 Props、最小接口、透传对象问题、组件边界判断 |
| 3.4 | `04-composition-and-compound-components.md` | 组合模式与复合组件 | 普通组合、具名插槽、受控组合、复合组件结构、`Context.Provider` 与 `Context.Consumer`、错误嵌套、适用边界 |
| 3.5 | `05-fragment-and-tree-structure.md` | Fragment 与组件树结构 | Fragment 作用、短语法、显式语法、带 Key 的 Fragment、DOM 结构、CSS 布局边界、语义容器选择 |
| 3.6 | `06-class-components.md` | 类组件、Props 与 State | `React.Component`、构造函数、`super(props)`、实例 Props、初始 State、`render`、方法绑定、实例字段 |
| 3.7 | `07-class-set-state.md` | setState 更新模型 | 对象形式、函数形式、参数、浅合并、更新队列、回调、批处理、不可变更新、禁止直接修改 State |
| 3.8 | `08-class-lifecycle.md` | 类组件生命周期 | 挂载、更新、卸载、错误阶段；生命周期方法参数、触发条件、资源建立与清理、旧值比较、不安全生命周期 |

### 1. 章节边界

- 第 2 章已经解释 Props、State 和状态提升，第 3 章不重复基础语法，重点转向组件接口和组织方式；
- `Context.Consumer` 在复合组件中作为组件组合 API 使用，`useContext` 的 Hook 用法放在第 4 章；
- 类组件生命周期必须完整讲解，不能只给方法清单；
- 错误边界生命周期的完整实现放在第 5 章。

## 四、第 4 章：Hooks

第 4 章详细讲解 React 16.8 内置 Hook。第 2 章中出现的 `useState` 只承担数据流入门作用，本章需要覆盖 API 细节、更新模型和使用边界。

| 顺序 | 文件 | 文档标题 | 必须覆盖的内容 |
|------|------|----------|----------------|
| 4.1 | `01-hooks-mental-model.md` | Hooks 调用模型与使用规则 | Hook 作用、调用位置、固定顺序、组件与 Hook 状态关系、每次渲染的闭包、规则检查、常见违规方式 |
| 4.2 | `02-use-state.md` | useState 与状态更新 | 签名、初始值、惰性初始化、返回数组、更新函数、函数式更新、相同值跳过、对象与数组、重置策略 |
| 4.3 | `03-use-effect.md` | useEffect 与副作用 | 副作用定义、签名、执行时机、无依赖与有依赖、外部系统同步、事件逻辑与 Effect 的区别、异步请求结构 |
| 4.4 | `04-effect-dependencies-and-cleanup.md` | Effect 依赖、清理与执行时机 | 依赖比较、完整依赖、函数与对象依赖、清理触发、订阅与定时器、竞态、`useLayoutEffect`、与 `useEffect` 的时机差异 |
| 4.5 | `05-use-ref.md` | useRef 与 DOM 操作 | 签名、`current`、持久可变值、Ref 不触发渲染、DOM Ref、聚焦与测量、回调 Ref、禁止在渲染期间任意修改 |
| 4.6 | `06-use-context.md` | useContext 与跨层通信 | Context 创建、Provider、默认值、读取、更新来源、对象值导致的更新、Provider 范围、缺失 Provider |
| 4.7 | `07-use-reducer.md` | useReducer 与复杂状态 | 签名、Reducer、State、Action、`dispatch`、初始化、惰性初始化、状态转换、与 `useState` 的选择 |
| 4.8 | `08-custom-hooks.md` | 自定义 Hook 与逻辑复用 | 命名规则、参数、返回值、组合内置 Hook、状态隔离、生命周期契约、测试边界、无意义封装 |
| 4.9 | `09-class-to-hooks-migration.md` | 类组件迁移到 Hooks | 行为盘点、State 迁移、实例字段迁移、生命周期按同步目标拆分、方法绑定消失、错误边界保留、渐进迁移 |

### 1. 文件迁移

将：

`03-components/09-class-to-hooks-migration.md`

移动为：

`04-hooks/09-class-to-hooks-migration.md`

sidebar 中删除原 3.9 条目，并新增 4.9 条目。迁移前搜索仓库内引用并同步更新。

## 五、第 5 章：高级能力

第 5 章覆盖组件复用、跨 DOM 层级渲染、异步加载、故障隔离和命令式逃生舱。

| 顺序 | 文件 | 文档标题 | 必须覆盖的内容 |
|------|------|----------|----------------|
| 5.1 | `01-hoc-and-render-props.md` | 高阶组件与 Render Props | HOC 签名、Props 透传、静态属性、Ref 边界、显示名称、Render Props 参数、嵌套问题、迁移判断 |
| 5.2 | `02-portal-and-overlays.md` | Portal 与浮层组件 | `createPortal` 参数与返回值、DOM 位置与 React 树、事件冒泡、挂载容器、模态框焦点、关闭与清理、SSR 边界 |
| 5.3 | `03-lazy-suspense-code-splitting.md` | lazy、Suspense 与代码分割 | `React.lazy` 加载函数、默认导出、`Suspense` fallback、边界范围、动态导入失败、分包粒度、React 16.8 限制 |
| 5.4 | `04-error-boundaries.md` | 错误边界与降级界面 | 捕获范围、不捕获范围、`getDerivedStateFromError`、`componentDidCatch`、组件栈、边界粒度、降级、重试与重置 |
| 5.5 | `05-forward-ref-and-imperative-handle.md` | Ref 转发与命令式 API | `forwardRef` 参数和返回值、DOM Ref 转发、`useImperativeHandle`、暴露最小命令接口、第三方库初始化与销毁 |

### 1. 文件替换

`05-class-error-boundaries.md` 的类错误边界内容合并进 `04-error-boundaries.md`，原文件路径替换为：

`05-forward-ref-and-imperative-handle.md`

sidebar 和仓库内引用必须同步更新。

## 六、第 6 章：运行机制与性能优化

第 6 章从 React 元素进入更新队列、协调、Fiber、提交和浏览器绘制过程，再解释组件身份、闭包和性能工具。

| 顺序 | 文件 | 文档标题 | 必须覆盖的内容 |
|------|------|----------|----------------|
| 6.1 | `01-render-commit-paint.md` | ReactDOM、渲染、提交与浏览器绘制 | React 与 ReactDOM 职责、`render`、`hydrate`、卸载、ReactDOMServer 边界、Render、Commit、布局与绘制、Effect 时机 |
| 6.2 | `02-virtual-dom-and-reconciliation.md` | Virtual DOM 与协调过程 | React 元素树、树比较、类型、位置、Key、属性更新、子树替换、DOM 复用、协调假设 |
| 6.3 | `03-fiber-architecture.md` | Fiber 架构 | Fiber 节点职责、父子兄弟关系、当前树与工作树、Render 工作、Effect 标记、Commit、React 16 与并发能力边界 |
| 6.4 | `04-state-updates-and-batching.md` | State 更新与批处理 | 更新对象、更新队列、状态快照、函数式更新计算、React 事件批处理、异步边界、`unstable_batchedUpdates` 边界 |
| 6.5 | `05-key-and-component-identity.md` | Key 与组件身份 | 类型、位置与 Key、State 保留、State 重置、条件分支、列表移动、嵌套组件定义导致的身份变化 |
| 6.6 | `06-closures-and-stale-state.md` | 闭包、快照与陈旧状态 | 渲染闭包、事件回调、定时器、Promise、陈旧值、函数式更新、依赖修复、Ref 保存最新值的边界 |
| 6.7 | `07-memoization.md` | React.memo、useMemo 与 useCallback | 三个 API 的作用、参数、比较方式、依赖、缓存失效、引用稳定性、成本、错误使用 |
| 6.8 | `08-performance-workflow.md` | 性能检查与组件优化 | 性能问题定义、React Profiler、提交记录、渲染原因、基线、组件拆分、状态下沉、记忆化、复测 |

### 1. 原理示例

运行机制文档不能只给内部名词。每篇至少提供以下一种证据：

- 元素树或 Fiber 关系图；
- 更新时序或阶段图；
- 能观察渲染次数和提交结果的最小代码；
- React Profiler 的操作步骤与观察指标；
- React 16.8 与 React 18 行为对照表。

内部实现字段只用于解释概念，不将私有字段作为业务 API 使用。

## 七、第 7 章：工程质量与应用生态

第 7 章负责 React 核心之外的工程能力。第三方库只讲 React 16.8 可用的版本线和核心选择依据，不追求列举当前所有生态方案。

| 顺序 | 文件 | 文档标题 | 必须覆盖的内容 |
|------|------|----------|----------------|
| 7.1 | `01-project-structure-and-router.md` | 项目结构、路由与样式组织 | 按职责组织目录、页面与公共组件、React Router v5 核心组件、路由参数、嵌套路由、404、CSS Modules 与 CSS-in-JS 边界 |
| 7.2 | `02-state-and-form-ecosystem.md` | 状态管理与表单生态 | 本地状态、Context、Redux、Zustand 的职责边界，客户端状态与服务端状态，Formik 与 React Hook Form 的选择，版本兼容 |
| 7.3 | `03-data-fetching-and-cache.md` | 数据请求与缓存 | Effect 请求、加载与错误状态、取消与竞态、缓存键、去重、失效、重试、React Query 或 SWR 的 React 16.8 兼容用法 |
| 7.4 | `04-reliability-security-accessibility.md` | 可靠性、安全与无障碍 | 可预期错误、渲染错误、StrictMode 16.8 行为、XSS 与富文本、外部链接、语义元素、键盘操作、焦点和 ARIA |
| 7.5 | `05-testing-build-deployment.md` | 测试、调试与构建部署 | Jest、React Testing Library、`act()`、事件与异步测试、DevTools、环境变量、生产构建、静态部署、回退与质量检查 |

### 1. 文件迁移

第 7 章文件按新主题改名：

| 原文件 | 新文件 |
|--------|--------|
| `01-project-component-modeling.md` | `01-project-structure-and-router.md` |
| `02-form-list-state.md` | `02-state-and-form-ecosystem.md` |
| `03-data-request.md` | `03-data-fetching-and-cache.md` |
| `04-error-handling.md` | `04-reliability-security-accessibility.md` |
| `05-engineering-checklist.md` | `05-testing-build-deployment.md` |

所有 sidebar 条目和仓库内链接同步更新，不保留指向已删除文件的导航。

## 八、内容完成标准

### 1. 单篇文档

每篇文档必须满足：

- Frontmatter `title` 与唯一一级标题一致；
- 二级标题使用中文数字连续编号；
- 三级标题在每个二级标题内重新从 1 开始编号；
- 核心主题具备定义、机制、使用方式和边界中的必要说明；
- API 讲解包含参数、返回值和至少一个对应示例；
- 示例之前有用途说明，示例之后有结果解释；
- 错误示例同时说明错误现象、原因和正确处理；
- 没有课程式元叙述、占位文本和骨架化小节；
- React 版本结论准确，不混入 React 18 默认行为。

### 2. 整体知识边界

35 篇文档完成后必须能够覆盖：

- 函数组件、类组件、组件组合和生命周期；
- React 16.8 全部主要内置 Hook；
- Ref、Portal、错误边界、懒加载和旧式复用模式；
- ReactDOM、协调、Fiber、批处理、组件身份和闭包；
- 记忆化、Profiler 和基于证据的性能优化；
- Router、状态管理、请求缓存、表单、测试、无障碍、安全、构建和部署。

### 3. 工程验证

交付前依次执行：

1. 扫描 35 篇文档中的课程式元叙述；
2. 检查 Frontmatter、一级标题和标题编号；
3. 检查空小节、骨架化小节和代码块闭合；
4. 检查相对链接和 sidebar 文件路径；
5. 检查新增示例函数、回调和方法的注释；
6. 执行 VitePress 完整构建；
7. 核对 Git 状态，确认没有覆盖任务范围外的用户改动；
8. 不自动提交、不推送远程仓库。
