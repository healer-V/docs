export const sidebar = {
  "/skill/": [
    {
      text: "🥤实践技巧",
      items: [
        { text: "01-Vue组件封装", link: "/skill/01-Vue组件封装.md" },
        { text: "02-React组件封装", link: "/skill/02-React组件封装.md" },
      ],
    },
  ],
  "/practices/": [
    {
      text: "🍚项目",
      items: [
        { text: "01-vue2移动端项目", link: "/practices/01-vue2.md" },
        { text: "02-vue2PC端项目", link: "/practices/02-vue2PC.md" },
        { text: "03-vue3移动端项目", link: "/practices/03-vue3.md" },
        { text: "04-vue3PC端项目", link: "/practices/04-vue3PC.md" },
        { text: "05-react16移动端项目", link: "/practices/05-react16_mobile.md" },
        { text: "06-react16PC端项目", link: "/practices/06-react16PC.md" },
        { text: "07-react18移动端项目", link: "/practices/07-react18_mobile.md" },
        { text: "08-react18PC端项目", link: "/practices/08-react18PC.md" },
      ],
    },
  ],
  "/project/": [
    {
      text: "🥥项目要点",
      items: [
        { text: "移动端项目要点", link: "/project/" },
        { text: "PC端项目要点", link: "/project/pc" },
      ],
    },
  ],
  "/interview/": [
    {
      text: "📖 面试题",
      items: [
        {
          text: "01-基础",
          collapsed: true,
          items: [
            { text: "01-Html", link: "/interview/" },
            { text: "02-Css", link: "/interview/02-css.md" },
            { text: "03-JS", link: "/interview/03-javascript.md" },
            { text: "04-ES6", link: "/interview/04-ES6.md" },
          ],
        },
        {
          text: "02-框架",
          collapsed: true,
          items: [
            { text: "05-TS", link: "/interview/05-typescript.md" },
            { text: "06-Vue", link: "/interview/06-vue.md" },
            { text: "07-React", link: "/interview/07-react.md" },
          ],
        },
        {
          text: "03-工程化",
          collapsed: true,
          items: [{ text: "08-工程化", link: "/interview/08-engineering.md" }],
        },
        {
          text: "05-网络",
          collapsed: true,
          items: [{ text: "09-网络", link: "/interview/09-network.md" }],
        },
        {
          text: "06-浏览器",
          collapsed: true,
          items: [{ text: "10-浏览器", link: "/interview/10-Browser.md" }],
        },
        {
          text: "07-手写题",
          collapsed: true,
          items: [{ text: "11-手写题", link: "/interview/11-Handwriting.md" }],
        },
        {
          text: "08-项目常考",
          collapsed: true,
          items: [{ text: "12-项目常考", link: "/interview/12-Optimize.md" }],
        },
      ],
    },
  ],
  "/diary/": [
    {
      text: "🍒随记",
      items: [
        { text: "2023年", link: "/diary/index.md" },
        { text: "2024年", link: "/diary/2024" },
        { text: "2025年", link: "/diary/2025" },
      ],
    },
  ],
  "/about/": [
    {
      text: "🍒 关于",
      items: [{ text: "学习文档", link: "/about/" }],
    },
  ],
  "/frontend/01-html/": [
    {
      text: "HTML 核心学习",
      items: [
        {
          text: "第1章：HTML 基础",
          collapsed: true,
          items: [
            { text: "1.1 HTML 概述", link: "/frontend/01-html/01-overview.md" },
            { text: "1.2 HTML 标签", link: "/frontend/01-html/02-tag.md" },
            { text: "1.3 HTML 属性", link: "/frontend/01-html/03-attributes.md" },
            { text: "1.4 HTML 表单", link: "/frontend/01-html/05-form.md" },
            { text: "1.5 HTML 表格", link: "/frontend/01-html/06-table.md" },
          ],
        },
        {
          text: "第2章：HTML 语义化",
          collapsed: true,
          items: [
            { text: "2.1 语义化元素", link: "/frontend/01-html/04-semanticElement.md" },
            { text: "2.2 语义化最佳实践", link: "/frontend/01-html/07-semantic.md" },
          ],
        },
        {
          text: "第3章：HTML5 新特性",
          collapsed: true,
          items: [
            { text: "3.1 HTML5 核心新特性", link: "/frontend/01-html/08-html5-features.md" },
            { text: "3.2 HTML5 多媒体", link: "/frontend/01-html/09-html5-multimedia.md" },
            { text: "3.3 Canvas 绘图", link: "/frontend/01-html/10-html5-canvas.md" },
            { text: "3.4 Web Storage", link: "/frontend/01-html/11-html5-storage.md" },
          ],
        },
        {
          text: "第4章：HTML vs HTML5",
          collapsed: true,
          items: [
            { text: "4.1 HTML4 与 HTML5 全面对比", link: "/frontend/01-html/12-html-vs-html5.md" },
          ],
        },
      ],
    },
  ],
  "/frontend/02-css/": [
    {
      text: "CSS 核心学习",
      items: [
        {
          text: "第1章：CSS 基础",
          collapsed: true,
          items: [
            { text: "1.1 CSS 概述", link: "/frontend/02-css/01-overview.md" },
            { text: "1.2 CSS 选择器", link: "/frontend/02-css/02-selector.md" },
            { text: "1.3 CSS 盒模型", link: "/frontend/02-css/03-box-model.md" },
          ],
        },
        {
          text: "第2章：CSS 布局",
          collapsed: true,
          items: [
            { text: "2.1 CSS 布局", link: "/frontend/02-css/04-layout.md" },
            { text: "2.2 响应式设计", link: "/frontend/02-css/06-responsive.md" },
          ],
        },
        {
          text: "第3章：CSS3 动效",
          collapsed: true,
          items: [
            { text: "3.1 过渡与动画", link: "/frontend/02-css/05-animation.md" },
          ],
        },
        {
          text: "第4章：CSS3 视觉增强",
          collapsed: true,
          items: [
            { text: "4.1 边框、阴影与圆角", link: "/frontend/02-css/08-css3-visual.md" },
            { text: "4.2 渐变与背景增强", link: "/frontend/02-css/09-css3-gradient.md" },
            { text: "4.3 滤镜与混合模式", link: "/frontend/02-css/11-css3-filter.md" },
          ],
        },
        {
          text: "第5章：CSS3 进阶",
          collapsed: true,
          items: [
            { text: "5.1 CSS 自定义属性（变量）", link: "/frontend/02-css/10-css3-variables.md" },
          ],
        },
        {
          text: "第6章：CSS 工程化",
          collapsed: true,
          items: [
            { text: "6.1 CSS 预处理器", link: "/frontend/02-css/07-preprocessor.md" },
          ],
        },
        {
          text: "第7章：CSS vs CSS3",
          collapsed: true,
          items: [
            { text: "7.1 CSS2 与 CSS3 全面对比", link: "/frontend/02-css/12-css-vs-css3.md" },
          ],
        },
      ],
    },
  ],
  "/frontend/03-javascript/": [
    {
      text: "JavaScript 核心学习",
      items: [
        {
          text: "第1章：JS 基础",
          collapsed: true,
          items: [
            { text: "1.1 数据类型", link: "/frontend/03-javascript/01-dataType.md" },
            { text: "1.2 内存机制", link: "/frontend/03-javascript/02-memory.md" },
            { text: "1.3 流程控制", link: "/frontend/03-javascript/03-controlflow.md" },
          ],
        },
        {
          text: "第2章：内置类型",
          collapsed: true,
          items: [
            { text: "2.1 Number 类型", link: "/frontend/03-javascript/04-number.md" },
            { text: "2.2 String 类型", link: "/frontend/03-javascript/05-string.md" },
            { text: "2.3 Boolean 类型", link: "/frontend/03-javascript/06-boolean.md" },
            { text: "2.4 Undefined 与 Null", link: "/frontend/03-javascript/07-undefined.md" },
          ],
        },
        {
          text: "第3章：引用类型",
          collapsed: true,
          items: [
            { text: "3.1 函数", link: "/frontend/03-javascript/08-function.md" },
            { text: "3.2 对象", link: "/frontend/03-javascript/09-object.md" },
            { text: "3.3 数组", link: "/frontend/03-javascript/10-array.md" },
            { text: "3.4 正则表达式", link: "/frontend/03-javascript/11-regex.md" },
          ],
        },
        {
          text: "第4章：工程化",
          collapsed: true,
          items: [
            { text: "4.1 模块系统", link: "/frontend/03-javascript/12-module.md" },
            { text: "4.2 设计模式", link: "/frontend/03-javascript/13-designpattern.md" },
          ],
        },
        {
          text: "第5章：浏览器 API",
          collapsed: true,
          items: [
            { text: "5.1 DOM 操作", link: "/frontend/03-javascript/14-dom.md" },
            { text: "5.2 BOM 对象", link: "/frontend/03-javascript/15-bom.md" },
            { text: "5.3 事件处理", link: "/frontend/03-javascript/16-event.md" },
          ],
        },
        {
          text: "第6章：异步编程",
          collapsed: true,
          items: [
            { text: "6.1 异步编程", link: "/frontend/03-javascript/17-async.md" },
          ],
        },
      ],
    },
  ],
  "/frontend/04-ecmascript/": [
    {
      text: "ECMAScript 核心学习",
      items: [
        {
          text: "第1章：ES 基础扩展",
          collapsed: true,
          items: [
            { text: "1.1 变量扩展（let/const/解构）", link: "/frontend/04-ecmascript/01-variable.md" },
            { text: "1.2 基本类型扩展", link: "/frontend/04-ecmascript/02-basicTypeExtension.md" },
            { text: "1.3 引用类型扩展", link: "/frontend/04-ecmascript/03-referenceTypeExtension.md" },
          ],
        },
        {
          text: "第2章：ES 进阶特性",
          collapsed: true,
          items: [
            { text: "2.1 ES6+ 异步编程", link: "/frontend/04-ecmascript/04-async-programming.md" },
            { text: "2.2 ES 模块与元编程", link: "/frontend/04-ecmascript/07-modules-and-meta.md" },
          ],
        },
        {
          text: "第3章：新版本特性",
          collapsed: true,
          items: [
            { text: "3.1 ES2016-ES2020 新特性", link: "/frontend/04-ecmascript/05-es2016-to-2020.md" },
            { text: "3.2 ES2021-ES2023 新特性", link: "/frontend/04-ecmascript/06-es2021-to-2023.md" },
          ],
        },
      ],
    },
  ],
  "/frontend/05-typescript/": [
    {
      text: "TypeScript 核心学习",
      items: [
        {
          text: "第1章：TS 基础",
          collapsed: true,
          items: [
            { text: "1.1 TypeScript 概述", link: "/frontend/05-typescript/01-typescript.md" },
            { text: "1.2 基础语法", link: "/frontend/05-typescript/02-basic-syntax.md" },
            { text: "1.3 类型系统", link: "/frontend/05-typescript/03-type-system.md" },
          ],
        },
        {
          text: "第2章：类型深入",
          collapsed: true,
          items: [
            { text: "2.1 接口与类型别名", link: "/frontend/05-typescript/04-interfaces.md" },
            { text: "2.2 类与面向对象", link: "/frontend/05-typescript/05-classes.md" },
            { text: "2.3 泛型", link: "/frontend/05-typescript/06-generics.md" },
            { text: "2.4 高级类型", link: "/frontend/05-typescript/07-advanced-types.md" },
          ],
        },
        {
          text: "第3章：工程实践",
          collapsed: true,
          items: [
            { text: "3.1 模块与命名空间", link: "/frontend/05-typescript/08-module.md" },
            { text: "3.2 装饰器", link: "/frontend/05-typescript/09-decorators.md" },
            { text: "3.3 项目实战", link: "/frontend/05-typescript/10-project.md" },
          ],
        },
      ],
    },
  ],
  "/frontend/06-vue2/": [
    {
      text: "Vue 2 核心学习",
      items: [
        {
          text: "第1章：设计理念与基础",
          collapsed: true,
          items: [
            { text: "1.1 设计理念", link: "/frontend/06-vue2/01-01-introduction.md" },
            { text: "1.2 项目创建", link: "/frontend/06-vue2/01-02-installation.md" },
            { text: "1.3 生命周期", link: "/frontend/06-vue2/01-03-lifecycle.md" },
            { text: "1.4 指令系统", link: "/frontend/06-vue2/01-04-directives.md" },
            { text: "1.5 选项式API", link: "/frontend/06-vue2/01-05-options-api.md" },
            { text: "1.6 组件通信", link: "/frontend/06-vue2/01-06-communication.md" },
          ],
        },
        {
          text: "第2章：组件系统",
          collapsed: true,
          items: [
            { text: "2.1 组件基础", link: "/frontend/06-vue2/02-01-component-basics.md" },
            { text: "2.2 组件通信", link: "/frontend/06-vue2/02-02-component-communication.md" },
            { text: "2.3 插槽使用", link: "/frontend/06-vue2/02-03-slots.md" },
            { text: "2.4 动态组件", link: "/frontend/06-vue2/02-04-dynamic-async-components.md" },
            { text: "2.5 组件生命周期", link: "/frontend/06-vue2/02-05-component-lifecycle.md" },
            { text: "2.6 混入与自定义指令", link: "/frontend/06-vue2/02-06-mixins-directives.md" },
          ],
        },
        {
          text: "第3章：进阶特性",
          collapsed: true,
          items: [
            { text: "3.1 响应式原理", link: "/frontend/06-vue2/03-01-reactivity-principle.md" },
            { text: "3.2 事件处理与表单绑定", link: "/frontend/06-vue2/03-02-events-forms.md" },
            { text: "3.3 过渡与动画", link: "/frontend/06-vue2/03-03-transitions-animations.md" },
            { text: "3.4 过滤器", link: "/frontend/06-vue2/03-04-filters.md" },
            { text: "3.5 渲染函数与JSX", link: "/frontend/06-vue2/03-05-render-functions-jsx.md" },
            { text: "3.6 插件开发", link: "/frontend/06-vue2/03-06-plugin-development.md" },
          ],
        },
        {
          text: "第4章：路由管理",
          collapsed: true,
          items: [
            { text: "4.1 路由基础", link: "/frontend/06-vue2/04-01-router-basics.md" },
            { text: "4.2 动态路由与嵌套路由", link: "/frontend/06-vue2/04-02-dynamic-nested-routes.md" },
            { text: "4.3 编程式导航与命名路由", link: "/frontend/06-vue2/04-03-programmatic-navigation.md" },
            { text: "4.4 路由守卫", link: "/frontend/06-vue2/04-04-navigation-guards.md" },
            { text: "4.5 路由懒加载与路由元信息", link: "/frontend/06-vue2/04-05-lazy-loading-meta.md" },
          ],
        },
        {
          text: "第5章：状态管理（Vuex）",
          collapsed: true,
          items: [
            { text: "5.1 Vuex核心概念", link: "/frontend/06-vue2/05-01-vuex-core-concepts.md" },
            { text: "5.2 模块化状态管理", link: "/frontend/06-vue2/05-02-modules.md" },
            { text: "5.3 Vuex辅助函数", link: "/frontend/06-vue2/05-03-helper-functions.md" },
            { text: "5.4 严格模式与插件开发", link: "/frontend/06-vue2/05-04-strict-mode-plugins.md" },
            { text: "5.5 Vuex最佳实践", link: "/frontend/06-vue2/05-05-best-practices.md" },
          ],
        },
        {
          text: "第6章：项目实战",
          collapsed: true,
          items: [
            { text: "6.1 项目结构与架构设计", link: "/frontend/06-vue2/06-01-project-structure.md" },
            { text: "6.2 API请求封装（Axios）", link: "/frontend/06-vue2/06-02-api-axios.md" },
            { text: "6.3 权限控制实现", link: "/frontend/06-vue2/06-03-permission-control.md" },
            { text: "6.4 性能优化策略", link: "/frontend/06-vue2/06-04-performance-optimization.md" },
            { text: "6.5 单元测试与E2E测试", link: "/frontend/06-vue2/06-05-testing.md" },
            { text: "6.6 部署与CI/CD", link: "/frontend/06-vue2/06-06-deployment-cicd.md" },
          ],
        },
      ],
    },
    {
      text: "Vue 3",
      link: "/frontend/07-vue3/01-vue3.md",
    },
  ],
  "/frontend/07-vue3/": [
    {
      text: "Vue 3 核心学习",
      items: [
        {
          text: "第1章：Vue 3 基础",
          collapsed: true,
          items: [
            { text: "1.1 设计理念与优势", link: "/frontend/07-vue3/01-design-philosophy.md" },
            { text: "1.2 Vue 3 概述", link: "/frontend/07-vue3/01-vue3.md" },
            { text: "1.3 Composition API", link: "/frontend/07-vue3/02-composition-api.md" },
            { text: "1.4 响应式系统", link: "/frontend/07-vue3/03-reactivity.md" },
          ],
        },
        {
          text: "第2章：组件系统",
          collapsed: true,
          items: [
            { text: "2.1 组件系统", link: "/frontend/07-vue3/04-components.md" },
            { text: "2.2 插槽", link: "/frontend/07-vue3/05-slots.md" },
            { text: "2.3 指令系统", link: "/frontend/07-vue3/06-directives.md" },
          ],
        },
        {
          text: "第3章：生态与进阶",
          collapsed: true,
          items: [
            { text: "3.1 路由管理（Vue Router）", link: "/frontend/07-vue3/07-router.md" },
            { text: "3.2 状态管理（Pinia）", link: "/frontend/07-vue3/08-state-management.md" },
            { text: "3.3 高级特性", link: "/frontend/07-vue3/09-advanced.md" },
          ],
        },
      ],
    },
  ],
  "/frontend/08-react16/": [
    {
      text: "React 16 核心学习",
      items: [
        {
          text: "第1章：React 16 基础",
          collapsed: true,
          items: [
            { text: "1.1 React 16 概述", link: "/frontend/08-react16/01-react16.md" },
            { text: "1.2 JSX 语法", link: "/frontend/08-react16/03-jsx.md" },
            { text: "1.3 组件开发", link: "/frontend/08-react16/02-components.md" },
            { text: "1.4 生命周期", link: "/frontend/08-react16/04-lifecycle.md" },
          ],
        },
        {
          text: "第2章：进阶与实战",
          collapsed: true,
          items: [
            { text: "2.1 Hooks 基础", link: "/frontend/08-react16/05-hooks.md" },
            { text: "2.2 路由配置", link: "/frontend/08-react16/06-router.md" },
            { text: "2.3 状态管理", link: "/frontend/08-react16/07-state-management.md" },
            { text: "2.4 项目实战", link: "/frontend/08-react16/08-project.md" },
          ],
        },
      ],
    },
  ],
  "/frontend/09-react18/": [
    {
      text: "React 18 核心学习",
      items: [
        {
          text: "第1章：React 18 并发特性",
          collapsed: true,
          items: [
            { text: "1.1 React 18 概述", link: "/frontend/09-react18/01-react18.md" },
            { text: "1.2 并发特性", link: "/frontend/09-react18/02-concurrent-features.md" },
            { text: "1.3 Automatic Batching", link: "/frontend/09-react18/03-automatic-batching.md" },
            { text: "1.4 Transitions", link: "/frontend/09-react18/04-transitions.md" },
            { text: "1.5 Suspense 增强", link: "/frontend/09-react18/05-suspense.md" },
          ],
        },
        {
          text: "第2章：生态与实战",
          collapsed: true,
          items: [
            { text: "2.1 新增 Hooks", link: "/frontend/09-react18/06-new-hooks.md" },
            { text: "2.2 路由配置", link: "/frontend/09-react18/07-router.md" },
            { text: "2.3 状态管理", link: "/frontend/09-react18/08-state-management.md" },
            { text: "2.4 项目实战", link: "/frontend/09-react18/09-project.md" },
          ],
        },
      ],
    },
  ],
  "/backend/01-nodejs/": [
    {
      text: "Node.js 核心学习",
      items: [
        {
          text: "第1章：Node.js 核心",
          collapsed: true,
          items: [
            { text: "1.1 Node.js 概述", link: "/backend/01-nodejs/01-nodejs.md" },
            { text: "1.2 模块系统", link: "/backend/01-nodejs/02-module-system.md" },
            { text: "1.3 文件系统", link: "/backend/01-nodejs/03-file-system.md" },
            { text: "1.4 事件循环与网络基础", link: "/backend/01-nodejs/04-network.md" },
          ],
        },
        {
          text: "第2章：进阶特性",
          collapsed: true,
          items: [
            { text: "2.1 异步编程", link: "/backend/01-nodejs/05-async.md" },
            { text: "2.2 流（Stream）", link: "/backend/01-nodejs/06-streams.md" },
            { text: "2.3 网络编程（HTTP）", link: "/backend/01-nodejs/07-network.md" },
          ],
        },
        {
          text: "第3章：实战",
          collapsed: true,
          items: [
            { text: "3.1 数据库操作", link: "/backend/01-nodejs/08-database.md" },
            { text: "3.2 性能优化", link: "/backend/01-nodejs/09-performance.md" },
            { text: "3.3 项目实战", link: "/backend/01-nodejs/10-project.md" },
          ],
        },
      ],
    },
  ],
  "/backend/02-express/": [
    {
      text: "Express 核心学习",
      items: [
        {
          text: "第1章：Express 基础",
          collapsed: true,
          items: [
            { text: "1.1 Express 概述", link: "/backend/02-express/01-express.md" },
            { text: "1.2 路由系统", link: "/backend/02-express/02-routing.md" },
            { text: "1.3 中间件机制", link: "/backend/02-express/03-middleware.md" },
          ],
        },
        {
          text: "第2章：请求与响应",
          collapsed: true,
          items: [
            { text: "2.1 请求处理", link: "/backend/02-express/04-request.md" },
            { text: "2.2 响应处理", link: "/backend/02-express/05-response.md" },
            { text: "2.3 模板引擎", link: "/backend/02-express/06-template.md" },
            { text: "2.4 错误处理", link: "/backend/02-express/09-error-handling.md" },
          ],
        },
        {
          text: "第3章：数据与安全",
          collapsed: true,
          items: [
            { text: "3.1 数据库集成", link: "/backend/02-express/07-database.md" },
            { text: "3.2 身份认证", link: "/backend/02-express/08-authentication.md" },
            { text: "3.3 RESTful API 开发", link: "/backend/02-express/10-api-development.md" },
          ],
        },
      ],
    },
  ],
  "/backend/03-nestjs/": [
    {
      text: "NestJS 核心学习",
      items: [
        {
          text: "第1章：NestJS 核心",
          collapsed: true,
          items: [
            { text: "1.1 NestJS 概述", link: "/backend/03-nestjs/01-nestjs.md" },
            { text: "1.2 模块系统", link: "/backend/03-nestjs/02-modules.md" },
            { text: "1.3 控制器", link: "/backend/03-nestjs/03-controllers.md" },
            { text: "1.4 提供者与依赖注入", link: "/backend/03-nestjs/04-providers.md" },
          ],
        },
        {
          text: "第2章：请求管道",
          collapsed: true,
          items: [
            { text: "2.1 中间件", link: "/backend/03-nestjs/05-middleware.md" },
            { text: "2.2 异常过滤器", link: "/backend/03-nestjs/06-exception-filters.md" },
            { text: "2.3 Pipes 管道", link: "/backend/03-nestjs/07-pipes.md" },
            { text: "2.4 Guards 守卫", link: "/backend/03-nestjs/08-guards.md" },
            { text: "2.5 拦截器", link: "/backend/03-nestjs/09-interceptors.md" },
          ],
        },
        {
          text: "第3章：数据与生态",
          collapsed: true,
          items: [
            { text: "3.1 数据库集成", link: "/backend/03-nestjs/10-database.md" },
            { text: "3.2 身份认证", link: "/backend/03-nestjs/11-authentication.md" },
            { text: "3.3 API 文档（Swagger）", link: "/backend/03-nestjs/12-api-docs.md" },
            { text: "3.4 微服务", link: "/backend/03-nestjs/13-microservices.md" },
          ],
        },
      ],
    },
  ],
  "/backend/04-java/": [
    {
      text: "Java 核心学习",
      items: [
        {
          text: "第1章：Java 基础",
          collapsed: true,
          items: [
            { text: "1.1 Java 概述", link: "/backend/04-java/01-java.md" },
            { text: "1.2 面向对象编程", link: "/backend/04-java/02-oop.md" },
            { text: "1.3 集合框架", link: "/backend/04-java/03-collections.md" },
          ],
        },
        {
          text: "第2章：Java 进阶",
          collapsed: true,
          items: [
            { text: "2.1 I/O 与 NIO", link: "/backend/04-java/04-io-streams.md" },
            { text: "2.2 多线程与并发", link: "/backend/04-java/05-concurrency.md" },
            { text: "2.3 JDBC 与 MyBatis", link: "/backend/04-java/06-jdbc-mybatis.md" },
          ],
        },
      ],
    },
  ],
  "/backend/05-python/": [
    {
      text: "Python 核心学习",
      items: [
        {
          text: "第1章：Python 基础",
          collapsed: true,
          items: [
            { text: "1.1 Python 概述", link: "/backend/05-python/01-python.md" },
            { text: "1.2 基础语法", link: "/backend/05-python/02-basic-syntax.md" },
            { text: "1.3 面向对象", link: "/backend/05-python/03-oop.md" },
          ],
        },
        {
          text: "第2章：Python 进阶",
          collapsed: true,
          items: [
            { text: "2.1 进阶特性", link: "/backend/05-python/04-advanced.md" },
            { text: "2.2 Flask 与 FastAPI", link: "/backend/05-python/05-web-framework.md" },
          ],
        },
      ],
    },
  ],
  "/backend/06-golang/": [
    {
      text: "Golang 核心学习",
      items: [
        {
          text: "第1章：Go 基础",
          collapsed: true,
          items: [
            { text: "1.1 Golang 概述", link: "/backend/06-golang/01-golang.md" },
            { text: "1.2 基础语法", link: "/backend/06-golang/02-basic-syntax.md" },
            { text: "1.3 结构体与接口", link: "/backend/06-golang/03-structs-interfaces.md" },
          ],
        },
        {
          text: "第2章：Go 进阶",
          collapsed: true,
          items: [
            { text: "2.1 Goroutine 与并发", link: "/backend/06-golang/04-goroutines.md" },
            { text: "2.2 Gin Web 框架", link: "/backend/06-golang/05-gin-framework.md" },
          ],
        },
      ],
    },
  ],
  "/backend/07-springboot/": [
    {
      text: "Spring Boot 核心学习",
      items: [
        {
          text: "第1章：Spring Boot 基础",
          collapsed: true,
          items: [
            { text: "1.1 Spring Boot 概述", link: "/backend/07-springboot/01-spring-boot.md" },
            { text: "1.2 IoC 与依赖注入", link: "/backend/07-springboot/02-ioc-di.md" },
            { text: "1.3 Spring MVC 与 RESTful API", link: "/backend/07-springboot/03-mvc-rest.md" },
          ],
        },
        {
          text: "第2章：数据与安全",
          collapsed: true,
          items: [
            { text: "2.1 数据访问层", link: "/backend/07-springboot/04-jpa-mybatis.md" },
            { text: "2.2 Security 与 JWT", link: "/backend/07-springboot/05-security-jwt.md" },
            { text: "2.3 配置与部署", link: "/backend/07-springboot/06-config-deploy.md" },
          ],
        },
      ],
    },
  ],
  "/backend/08-django/": [
    {
      text: "Django 核心学习",
      items: [
        {
          text: "第1章：Django 基础",
          collapsed: true,
          items: [
            { text: "1.1 Django 概述", link: "/backend/08-django/01-django.md" },
            { text: "1.2 模型与数据库", link: "/backend/08-django/02-models.md" },
            { text: "1.3 视图与路由", link: "/backend/08-django/03-views-urls.md" },
          ],
        },
        {
          text: "第2章：进阶与部署",
          collapsed: true,
          items: [
            { text: "2.1 Django REST Framework", link: "/backend/08-django/04-drf.md" },
            { text: "2.2 项目部署", link: "/backend/08-django/05-deployment.md" },
          ],
        },
      ],
    },
  ],
  "/backend/09-mysql/": [
    {
      text: "MySQL 核心学习",
      items: [
        {
          text: "第1章：MySQL 基础",
          collapsed: true,
          items: [
            { text: "1.1 MySQL 概述", link: "/backend/09-mysql/01-mysql.md" },
            { text: "1.2 DDL 与 DML", link: "/backend/09-mysql/02-ddl-dml.md" },
            { text: "1.3 索引原理与优化", link: "/backend/09-mysql/03-indexes.md" },
          ],
        },
        {
          text: "第2章：进阶调优",
          collapsed: true,
          items: [
            { text: "2.1 事务与锁机制", link: "/backend/09-mysql/04-transactions.md" },
            { text: "2.2 性能调优", link: "/backend/09-mysql/05-optimization.md" },
          ],
        },
      ],
    },
  ],
  "/backend/10-redis/": [
    {
      text: "Redis 核心学习",
      items: [
        {
          text: "第1章：Redis 基础",
          collapsed: true,
          items: [
            { text: "1.1 Redis 概述", link: "/backend/10-redis/01-redis.md" },
            { text: "1.2 数据结构与命令", link: "/backend/10-redis/02-data-structures.md" },
          ],
        },
        {
          text: "第2章：Redis 进阶",
          collapsed: true,
          items: [
            { text: "2.1 持久化与高可用", link: "/backend/10-redis/03-persistence.md" },
            { text: "2.2 进阶应用场景", link: "/backend/10-redis/04-advanced-use.md" },
          ],
        },
      ],
    },
  ],
  "/backend/11-postgresql/": [
    {
      text: "PostgreSQL 核心学习",
      items: [
        {
          text: "第1章：PostgreSQL 基础",
          collapsed: true,
          items: [
            { text: "1.1 PostgreSQL 概述", link: "/backend/11-postgresql/01-postgresql.md" },
            { text: "1.2 进阶 SQL 特性", link: "/backend/11-postgresql/02-advanced-sql.md" },
          ],
        },
        {
          text: "第2章：特性与调优",
          collapsed: true,
          items: [
            { text: "2.1 JSON 与数组支持", link: "/backend/11-postgresql/03-json-array.md" },
            { text: "2.2 性能调优", link: "/backend/11-postgresql/04-optimization.md" },
          ],
        },
      ],
    },
  ],
  "/ai/01-fundamentals/": [
    {
      text: "AI 基础学习",
      items: [
        {
          text: "第1章：AI 基础理论",
          collapsed: true,
          items: [
            { text: "1.1 AI 基础概述", link: "/ai/01-fundamentals/index.md" },
            { text: "1.2 机器学习基础", link: "/ai/01-fundamentals/01-ml-basics.md" },
            { text: "1.3 深度学习基础", link: "/ai/01-fundamentals/02-deep-learning.md" },
            { text: "1.4 Transformer 架构", link: "/ai/01-fundamentals/03-transformer.md" },
          ],
        },
      ],
    },
  ],
  "/ai/02-prompt/": [
    {
      text: "Prompt 核心学习",
      items: [
        {
          text: "第1章：Prompt 基础",
          collapsed: true,
          items: [
            { text: "1.1 Prompt 工程概述", link: "/ai/02-prompt/index.md" },
            { text: "1.2 Prompt 基础技巧", link: "/ai/02-prompt/01-prompt-basics.md" },
            { text: "1.3 高级 Prompt 技巧", link: "/ai/02-prompt/02-advanced-prompt.md" },
          ],
        },
        {
          text: "第2章：Prompt 进阶",
          collapsed: true,
          items: [
            { text: "2.1 Prompt 设计模式", link: "/ai/02-prompt/03-prompt-patterns.md" },
            { text: "2.2 Prompt 工具与评估", link: "/ai/02-prompt/04-prompt-engineering-tools.md" },
          ],
        },
      ],
    },
  ],
  "/ai/03-langchain/": [
    {
      text: "LangChain 核心学习",
      items: [
        {
          text: "第1章：LangChain 基础",
          collapsed: true,
          items: [
            { text: "1.1 LangChain 概述", link: "/ai/03-langchain/index.md" },
            { text: "1.2 LangChain 入门", link: "/ai/03-langchain/01-overview.md" },
            { text: "1.3 RAG 检索增强生成", link: "/ai/03-langchain/02-rag.md" },
          ],
        },
        {
          text: "第2章：LangChain 进阶",
          collapsed: true,
          items: [
            { text: "2.1 Agent 与工具使用", link: "/ai/03-langchain/03-agents-tools.md" },
            { text: "2.2 LCEL 与链构建", link: "/ai/03-langchain/04-chains-lcel.md" },
          ],
        },
      ],
    },
  ],
  "/ai/04-llm-api/": [
    {
      text: "LLM API 核心学习",
      items: [
        {
          text: "第1章：LLM API 基础",
          collapsed: true,
          items: [
            { text: "1.1 LLM API 概述", link: "/ai/04-llm-api/index.md" },
            { text: "1.2 OpenAI API", link: "/ai/04-llm-api/01-openai-api.md" },
            { text: "1.3 Claude API", link: "/ai/04-llm-api/02-claude-api.md" },
          ],
        },
        {
          text: "第2章：高级特性",
          collapsed: true,
          items: [
            { text: "2.1 流式输出与函数调用", link: "/ai/04-llm-api/03-streaming-function-calling.md" },
            { text: "2.2 LLM 应用集成实践", link: "/ai/04-llm-api/04-llm-integration.md" },
          ],
        },
      ],
    },
  ],
  "/ai/05-agent/": [
    {
      text: "AI Agent 核心学习",
      items: [
        {
          text: "第1章：Agent 开发",
          collapsed: true,
          items: [
            { text: "1.1 AI Agent 概述", link: "/ai/05-agent/index.md" },
            { text: "1.2 Agent 基础", link: "/ai/05-agent/01-agent-basics.md" },
            { text: "1.3 工具使用与集成", link: "/ai/05-agent/02-tool-use.md" },
            { text: "1.4 多智能体系统", link: "/ai/05-agent/03-multi-agent.md" },
          ],
        },
      ],
    },
  ],
  "/ai/06-mcp/": [
    {
      text: "MCP 核心学习",
      items: [
        {
          text: "第1章：MCP 开发",
          collapsed: true,
          items: [
            { text: "1.1 MCP 协议概述", link: "/ai/06-mcp/index.md" },
            { text: "1.2 MCP 入门", link: "/ai/06-mcp/01-mcp-overview.md" },
            { text: "1.3 MCP Server 开发", link: "/ai/06-mcp/02-mcp-server.md" },
            { text: "1.4 MCP Client 集成", link: "/ai/06-mcp/03-mcp-client.md" },
          ],
        },
      ],
    },
  ],
  "/ai/07-local-deploy/": [
    {
      text: "本地部署核心学习",
      items: [
        {
          text: "第1章：本地部署",
          collapsed: true,
          items: [
            { text: "1.1 本地部署概述", link: "/ai/07-local-deploy/index.md" },
            { text: "1.2 Ollama 本地部署", link: "/ai/07-local-deploy/01-ollama.md" },
            { text: "1.3 LM Studio 与 vLLM", link: "/ai/07-local-deploy/02-lm-studio-vllm.md" },
            { text: "1.4 模型选型与优化", link: "/ai/07-local-deploy/03-model-selection.md" },
          ],
        },
      ],
    },
  ],
  "/web3/01-blockchain/": [
    {
      text: "区块链核心学习",
      items: [
        {
          text: "第1章：区块链基础",
          collapsed: true,
          items: [
            { text: "1.1 区块链基础概述", link: "/web3/01-blockchain/index" },
            { text: "1.2 区块链核心概念", link: "/web3/01-blockchain/01-concepts.md" },
            { text: "1.3 以太坊基础", link: "/web3/01-blockchain/02-ethereum.md" },
            { text: "1.4 钱包与账户", link: "/web3/01-blockchain/03-wallet.md" },
            { text: "1.5 Gas 与交易机制", link: "/web3/01-blockchain/04-gas-transaction.md" },
          ],
        },
      ],
    },
  ],
  "/web3/02-solidity/": [
    {
      text: "Solidity 核心学习",
      items: [
        {
          text: "第1章：Solidity 基础",
          collapsed: true,
          items: [
            { text: "1.1 Solidity 概述", link: "/web3/02-solidity/index" },
            { text: "1.2 开发环境搭建", link: "/web3/02-solidity/01-environment.md" },
            { text: "1.3 基本语法与数据类型", link: "/web3/02-solidity/02-syntax.md" },
            { text: "1.4 函数与修饰器", link: "/web3/02-solidity/03-functions.md" },
          ],
        },
        {
          text: "第2章：Solidity 进阶",
          collapsed: true,
          items: [
            { text: "2.1 合约继承与接口", link: "/web3/02-solidity/04-inheritance.md" },
            { text: "2.2 事件与日志", link: "/web3/02-solidity/05-events.md" },
            { text: "2.3 安全最佳实践", link: "/web3/02-solidity/06-security.md" },
          ],
        },
      ],
    },
  ],
  "/web3/03-web3js/": [
    {
      text: "Web3.js 核心学习",
      items: [
        {
          text: "第1章：Web3.js 交互",
          collapsed: true,
          items: [
            { text: "1.1 Web3.js 概述", link: "/web3/03-web3js/index" },
            { text: "1.2 Web3.js 入门", link: "/web3/03-web3js/01-getting-started.md" },
            { text: "1.3 连接区块链与读取数据", link: "/web3/03-web3js/02-connect-read.md" },
            { text: "1.4 发送交易与合约调用", link: "/web3/03-web3js/03-transactions.md" },
            { text: "1.5 事件监听与过滤", link: "/web3/03-web3js/04-events.md" },
          ],
        },
      ],
    },
  ],
  "/web3/04-ethersjs/": [
    {
      text: "Ethers.js 核心学习",
      items: [
        {
          text: "第1章：Ethers.js 实战",
          collapsed: true,
          items: [
            { text: "1.1 Ethers.js 概述", link: "/web3/04-ethersjs/index" },
            { text: "1.2 Ethers.js 入门", link: "/web3/04-ethersjs/01-getting-started.md" },
            { text: "1.3 Provider 与 Signer", link: "/web3/04-ethersjs/02-provider-signer.md" },
            { text: "1.4 合约交互", link: "/web3/04-ethersjs/03-contract-interaction.md" },
          ],
        },
      ],
    },
  ],
  "/web3/05-dapp/": [
    {
      text: "DApp 核心学习",
      items: [
        {
          text: "第1章：DApp 开发",
          collapsed: true,
          items: [
            { text: "1.1 DApp 开发概述", link: "/web3/05-dapp/index" },
            { text: "1.2 Hardhat 开发框架", link: "/web3/05-dapp/01-hardhat.md" },
            { text: "1.3 ERC-20 代币开发", link: "/web3/05-dapp/02-erc20.md" },
            { text: "1.4 ERC-721 NFT 开发", link: "/web3/05-dapp/03-erc721.md" },
            { text: "1.5 DApp 前端集成", link: "/web3/05-dapp/04-frontend.md" },
          ],
        },
      ],
    },
  ],
  "/web3/06-advanced/": [
    {
      text: "Web3 进阶学习",
      items: [
        {
          text: "第1章：Web3 进阶",
          collapsed: true,
          items: [
            { text: "1.1 Web3 进阶概述", link: "/web3/06-advanced/index" },
            { text: "1.2 DeFi 核心概念", link: "/web3/06-advanced/01-defi.md" },
            { text: "1.3 合约升级模式", link: "/web3/06-advanced/02-upgradeable.md" },
            { text: "1.4 The Graph 数据索引", link: "/web3/06-advanced/03-thegraph.md" },
          ],
        },
      ],
    },
  ],
  "/microfrontend/01-qiankun/": [
    {
      text: "Qiankun 核心学习",
      items: [
        {
          text: "第1章：Qiankun 基础",
          collapsed: true,
          items: [
            { text: "1.1 Qiankun 微前端框架", link: "/microfrontend/01-qiankun/index.md" },
            { text: "1.2 快速上手", link: "/microfrontend/01-qiankun/01-getting-started.md" },
            { text: "1.3 沙箱与样式隔离", link: "/microfrontend/01-qiankun/02-sandbox-isolation.md" },
          ],
        },
        {
          text: "第2章：进阶实践",
          collapsed: true,
          items: [
            { text: "2.1 应用间通信", link: "/microfrontend/01-qiankun/03-communication.md" },
            { text: "2.2 生产实践", link: "/microfrontend/01-qiankun/04-advanced-practices.md" },
          ],
        },
      ],
    },
  ],
  "/crossend/01-reactnative/": [
    {
      text: "React Native 核心学习",
      items: [
        {
          text: "第1章：React Native 基础",
          collapsed: true,
          items: [
            { text: "1.1 React Native 概述", link: "/crossend/01-reactnative/index.md" },
            { text: "1.2 环境搭建", link: "/crossend/01-reactnative/01-getting-started.md" },
            { text: "1.3 核心组件", link: "/crossend/01-reactnative/02-basic-components.md" },
            { text: "1.4 样式与布局", link: "/crossend/01-reactnative/03-styling-and-layout.md" },
          ],
        },
        {
          text: "第2章：功能开发",
          collapsed: true,
          items: [
            { text: "2.1 导航系统", link: "/crossend/01-reactnative/04-navigation.md" },
            { text: "2.2 状态管理", link: "/crossend/01-reactnative/05-state-management.md" },
            { text: "2.3 网络请求", link: "/crossend/01-reactnative/06-networking.md" },
            { text: "2.4 Native 模块", link: "/crossend/01-reactnative/07-native-modules.md" },
          ],
        },
        {
          text: "第3章：发布与优化",
          collapsed: true,
          items: [
            { text: "3.1 性能优化", link: "/crossend/01-reactnative/08-performance-optimization.md" },
            { text: "3.2 打包部署", link: "/crossend/01-reactnative/09-deployment.md" },
            { text: "3.3 学习资源", link: "/crossend/01-reactnative/10-learning-resources.md" },
          ],
        },
      ],
    },
  ],
  "/crossend/02-flutter/": [
    {
      text: "Flutter 核心学习",
      items: [
        {
          text: "第1章：Flutter 基础",
          collapsed: true,
          items: [
            { text: "1.1 Flutter 概述", link: "/crossend/02-flutter/index.md" },
            { text: "1.2 环境搭建", link: "/crossend/02-flutter/01-getting-started.md" },
            { text: "1.3 Widget 系统", link: "/crossend/02-flutter/02-widgets.md" },
            { text: "1.4 布局系统", link: "/crossend/02-flutter/03-layout.md" },
          ],
        },
        {
          text: "第2章：功能开发",
          collapsed: true,
          items: [
            { text: "2.1 状态管理", link: "/crossend/02-flutter/04-state-management.md" },
            { text: "2.2 导航系统", link: "/crossend/02-flutter/05-navigation.md" },
            { text: "2.3 网络请求", link: "/crossend/02-flutter/06-networking.md" },
            { text: "2.4 动画系统", link: "/crossend/02-flutter/07-animation.md" },
          ],
        },
        {
          text: "第3章：发布与优化",
          collapsed: true,
          items: [
            { text: "3.1 性能优化", link: "/crossend/02-flutter/08-performance-optimization.md" },
            { text: "3.2 打包部署", link: "/crossend/02-flutter/09-deployment.md" },
            { text: "3.3 学习资源", link: "/crossend/02-flutter/10-learning-resources.md" },
          ],
        },
      ],
    },
  ],
  "/crossend/03-harmonyos/": [
    {
      text: "HarmonyOS 核心学习",
      items: [
        {
          text: "第1章：HarmonyOS 基础",
          collapsed: true,
          items: [
            { text: "1.1 HarmonyOS 概述", link: "/crossend/03-harmonyos/index.md" },
            { text: "1.2 环境搭建", link: "/crossend/03-harmonyos/01-getting-started.md" },
            { text: "1.3 ArkUI 框架", link: "/crossend/03-harmonyos/02-arkui-framework.md" },
            { text: "1.4 状态管理", link: "/crossend/03-harmonyos/03-state-management.md" },
          ],
        },
        {
          text: "第2章：进阶开发",
          collapsed: true,
          items: [
            { text: "2.1 页面路由", link: "/crossend/03-harmonyos/04-page-routing.md" },
            { text: "2.2 网络请求", link: "/crossend/03-harmonyos/05-networking.md" },
            { text: "2.3 权限管理", link: "/crossend/03-harmonyos/06-permission-management.md" },
            { text: "2.4 性能优化", link: "/crossend/03-harmonyos/07-performance-optimization.md" },
          ],
        },
      ],
    },
  ],
  "/crossend/04-electron/": [
    {
      text: "Electron 核心学习",
      items: [
        {
          text: "第1章：Electron 基础",
          collapsed: true,
          items: [
            { text: "1.1 Electron 概述", link: "/crossend/04-electron/index.md" },
            { text: "1.2 环境搭建", link: "/crossend/04-electron/01-getting-started.md" },
            { text: "1.3 进程间通信", link: "/crossend/04-electron/02-ipc-communication.md" },
          ],
        },
        {
          text: "第2章：进阶开发",
          collapsed: true,
          items: [
            { text: "2.1 原生 API 集成", link: "/crossend/04-electron/03-native-apis.md" },
            { text: "2.2 集成前端框架", link: "/crossend/04-electron/04-frontend-integration.md" },
            { text: "2.3 打包与分发", link: "/crossend/04-electron/05-packaging-deployment.md" },
          ],
        },
      ],
    },
  ],
  "/operation/00-linux/": [
    {
      text: "Linux 系统学习指南",
      items: [
        { text: "学习路线总览", link: "/operation/00-linux/index.md" },
        {
          text: "第1章：认识 Linux",
          collapsed: true,
          items: [
            { text: "1.1 Linux 简介与历史", link: "/operation/00-linux/01-intro.md" },
            { text: "1.2 安装与环境搭建", link: "/operation/00-linux/02-installation.md" },
            { text: "1.3 Shell 与终端基础", link: "/operation/00-linux/03-terminal.md" },
          ],
        },
        {
          text: "第2章：文件系统",
          collapsed: true,
          items: [
            { text: "2.1 目录结构详解", link: "/operation/00-linux/04-filesystem.md" },
            { text: "2.2 文件与目录操作", link: "/operation/00-linux/05-file-operations.md" },
            { text: "2.3 文件查找与搜索", link: "/operation/00-linux/06-find-search.md" },
          ],
        },
        {
          text: "第3章：权限与用户管理",
          collapsed: true,
          items: [
            { text: "3.1 用户与用户组", link: "/operation/00-linux/07-users.md" },
            { text: "3.2 文件权限详解", link: "/operation/00-linux/08-permissions.md" },
          ],
        },
        {
          text: "第4章：文本处理",
          collapsed: true,
          items: [
            { text: "4.1 Vim 编辑器", link: "/operation/00-linux/09-vim.md" },
            { text: "4.2 文本处理三剑客（grep/sed/awk）", link: "/operation/00-linux/10-text-processing.md" },
          ],
        },
        {
          text: "第5章：进程与系统管理",
          collapsed: true,
          items: [
            { text: "5.1 进程管理", link: "/operation/00-linux/11-process.md" },
            { text: "5.2 系统资源监控", link: "/operation/00-linux/12-monitor.md" },
          ],
        },
        {
          text: "第6章：网络管理",
          collapsed: true,
          items: [
            { text: "6.1 网络管理与诊断", link: "/operation/00-linux/13-network.md" },
          ],
        },
        {
          text: "第7章：软件包管理",
          collapsed: true,
          items: [
            { text: "7.1 APT / YUM / DNF 包管理", link: "/operation/00-linux/14-package-manager.md" },
          ],
        },
      ],
    },
  ],
  "/operation/01-shell/": [
    {
      text: "Shell 核心学习",
      items: [
        {
          text: "第1章：Shell 脚本",
          collapsed: true,
          items: [
            { text: "1.1 Shell 概述", link: "/operation/01-shell/index.md" },
            { text: "1.2 Shell 基础语法", link: "/operation/01-shell/01-basics.md" },
            { text: "1.3 流程控制", link: "/operation/01-shell/02-control-flow.md" },
          ],
        },
        {
          text: "第2章：实战应用",
          collapsed: true,
          items: [
            { text: "2.1 文本处理", link: "/operation/01-shell/03-text-processing.md" },
            { text: "2.2 实用脚本案例", link: "/operation/01-shell/04-practical-scripts.md" },
          ],
        },
      ],
    },
  ],
  "/operation/02-jenkins/": [
    {
      text: "Jenkins 核心学习",
      items: [
        {
          text: "第1章：Jenkins CI/CD",
          collapsed: true,
          items: [
            { text: "1.1 Jenkins 概述", link: "/operation/02-jenkins/index.md" },
            { text: "1.2 安装与配置", link: "/operation/02-jenkins/01-installation.md" },
            { text: "1.3 Job 与 Pipeline", link: "/operation/02-jenkins/02-freestyle-jobs.md" },
            { text: "1.4 高级流水线", link: "/operation/02-jenkins/03-advanced-pipeline.md" },
          ],
        },
      ],
    },
  ],
  "/operation/03-cicd/": [
    {
      text: "CI/CD 核心学习",
      items: [
        {
          text: "第1章：CI/CD 实践",
          collapsed: true,
          items: [
            { text: "1.1 CI/CD 概述", link: "/operation/03-cicd/index.md" },
            { text: "1.2 GitHub Actions 实战", link: "/operation/03-cicd/01-github-actions.md" },
            { text: "1.3 CI/CD 最佳实践", link: "/operation/03-cicd/02-cicd-practices.md" },
          ],
        },
      ],
    },
  ],
  "/operation/04-k8s/": [
    {
      text: "Kubernetes 核心学习",
      items: [
        {
          text: "第1章：Kubernetes 基础",
          collapsed: true,
          items: [
            { text: "1.1 K8s 概述", link: "/operation/04-k8s/index.md" },
            { text: "1.2 核心概念", link: "/operation/04-k8s/01-core-concepts.md" },
            { text: "1.3 工作负载", link: "/operation/04-k8s/02-workloads.md" },
          ],
        },
        {
          text: "第2章：网络与存储",
          collapsed: true,
          items: [
            { text: "2.1 网络与服务发现", link: "/operation/04-k8s/03-networking.md" },
            { text: "2.2 存储与配置管理", link: "/operation/04-k8s/04-storage-config.md" },
          ],
        },
      ],
    },
  ],
  "/operation/05-docker/": [
    {
      text: "Docker 核心学习",
      items: [
        {
          text: "第1章：Docker 基础",
          collapsed: true,
          items: [
            { text: "1.1 Docker 概述", link: "/operation/05-docker/index.md" },
            { text: "1.2 基础操作", link: "/operation/05-docker/01-basics.md" },
            { text: "1.3 Dockerfile 最佳实践", link: "/operation/05-docker/02-dockerfile.md" },
          ],
        },
        {
          text: "第2章：网络与编排",
          collapsed: true,
          items: [
            { text: "2.1 网络与数据卷", link: "/operation/05-docker/03-networking-volumes.md" },
            { text: "2.2 Docker Compose", link: "/operation/05-docker/04-compose.md" },
          ],
        },
      ],
    },
  ],
  "/operation/06-nginx/": [
    {
      text: "Nginx 核心学习",
      items: [
        {
          text: "第1章：Nginx 基础",
          collapsed: true,
          items: [
            { text: "1.1 Nginx 概述", link: "/operation/06-nginx/index.md" },
            { text: "1.2 安装与配置", link: "/operation/06-nginx/01-installation.md" },
            { text: "1.3 配置文件详解", link: "/operation/06-nginx/02-config.md" },
          ],
        },
        {
          text: "第2章：核心功能",
          collapsed: true,
          items: [
            { text: "2.1 静态资源服务", link: "/operation/06-nginx/03-static.md" },
            { text: "2.2 反向代理", link: "/operation/06-nginx/04-reverse-proxy.md" },
            { text: "2.3 负载均衡", link: "/operation/06-nginx/05-load-balance.md" },
            { text: "2.4 HTTPS 配置", link: "/operation/06-nginx/06-https.md" },
          ],
        },
        {
          text: "第3章：运维实战",
          collapsed: true,
          items: [
            { text: "3.1 性能优化", link: "/operation/06-nginx/07-performance.md" },
            { text: "3.2 日志管理", link: "/operation/06-nginx/08-logging.md" },
            { text: "3.3 实战案例", link: "/operation/06-nginx/09-practice.md" },
          ],
        },
      ],
    },
  ],
  "/engineering/01-webpack/": [
    {
      text: "Webpack 核心学习",
      items: [
        {
          text: "第1章：Webpack 基础",
          collapsed: true,
          items: [
            { text: "1.1 Webpack 概述", link: "/engineering/01-webpack/index.md" },
            { text: "1.2 核心配置详解", link: "/engineering/01-webpack/01-core-config.md" },
            { text: "1.3 插件系统", link: "/engineering/01-webpack/02-plugins.md" },
          ],
        },
        {
          text: "第2章：工程化实践",
          collapsed: true,
          items: [
            { text: "2.1 构建优化", link: "/engineering/01-webpack/03-optimization.md" },
            { text: "2.2 开发环境配置", link: "/engineering/01-webpack/04-dev-environment.md" },
          ],
        },
      ],
    },
  ],
  "/engineering/02-vite/": [
    {
      text: "Vite 核心学习",
      items: [
        {
          text: "第1章：Vite 原理",
          collapsed: true,
          items: [
            { text: "1.1 Vite 原理剖析", link: "/engineering/02-vite/01-vite.md" },
            { text: "1.2 企业级脚手架", link: "/engineering/02-vite/02-脚手架.md" },
          ],
        },
        {
          text: "第2章：插件与优化",
          collapsed: true,
          items: [
            { text: "2.1 插件实战", link: "/engineering/02-vite/03-插件实战.md" },
            { text: "2.2 打包优化", link: "/engineering/02-vite/04-打包优化.md" },
          ],
        },
        {
          text: "第3章：实战与部署",
          collapsed: true,
          items: [
            { text: "3.1 Vue/React 双项目实战", link: "/engineering/02-vite/05-双项目实战.md" },
            { text: "3.2 部署上线 + CI/CD", link: "/engineering/02-vite/06-部署上线.md" },
            { text: "3.3 阿里云完整部署流程", link: "/engineering/02-vite/07-阿里云部署.md" },
          ],
        },
      ],
    },
  ],
};
