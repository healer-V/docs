export const sidebar = {
  "/articles/": [
    {
      text: "首页",
      items: [
        {
          text: "🍎前端基础",
          collapsed: true, // 侧边栏可折叠
          items: [
            { text: "01-HTML", link: "/articles/basic/01-html.md" },
            { text: "02-CSS", link: "/articles/basic/02-css.md" },
            { text: "03-JS", link: "/articles/basic/03-javascript.md" },
            { text: "04-ES6", link: "/articles/basic/04-ecmascript.md" },
            { text: "05-TS", link: "/articles/basic/05-typescript.md" },
            { text: "06-Vue2", link: "/articles/basic/06-vue2.md" },
            { text: "07-Vue3", link: "/articles/basic/07-vue3.md" },
            { text: "08-React16", link: "/articles/basic/08-react16.md" },
            { text: "09-React18", link: "/articles/basic/09-react18.md" },
            { text: "10-Node.js", link: "/articles/basic/10-nodejs.md" },
            { text: "11-Sass", link: "/articles/basic/11-Sass.md" },
          ],
        },
        {
          text: "🍑服务端",
          collapsed: true,
          items: [
            { text: "01-Node.js", link: "/articles/server/01-NodeJs.md" },
            { text: "02-Express", link: "/articles/server/02-Express.md" },
            { text: "03-Nest.js", link: "/articles/server/03-NestJs.md" },
          ],
        },
        {
          text: "🥝浏览器基础",
          collapsed: true,
          items: [
            { text: "01-线程与进程", link: "/articles/browser/01-basic.md" },
            { text: "02-机制与引擎", link: "/articles/browser/02-render.md" },
          ],
        },
        {
          text: "🍓网络基础",
          collapsed: true,
          items: [
            { text: "01-网络协议", link: "/articles/network/01-http.md" },
            { text: "02-WebSocket", link: "/articles/network/02-WebSocket.md" },
            { text: "03-niginx", link: "/articles/network/03-niginx.md" },
          ],
        },

        {
          text: "🍎混合App开发",
          collapsed: true,
          items: [
            { text: "01-Uniapp", link: "/articles/frame/01-Uniapp.md" },
            { text: "02-Flutter", link: "/articles/frame/02-Flutter.md" },
            {
              text: "03-React Native",
              link: "/articles/frame/03-ReactNative.md",
            },
            { text: "04-HarmonyOS", link: "/articles/frame/04-HarmonyOS.md" },
            { text: "05-Electron", link: "/articles/frame/05-Electron.md" },
          ],
        },
        {
          text: "🍉前端工程化",
          collapsed: true,
          items: [
            { text: "01-Webpack", link: "/articles/engineering/01-Webpack.md" },
            { text: "02-Vite", link: "/articles/engineering/02-Vite.md" },
            { text: "03-Rollup", link: "/articles/engineering/03-Rollup.md" },
          ],
        },
        {
          text: "🍜工具",
          collapsed: true,
          items: [
            { text: "01-Git", link: "/articles/tools/01-Git.md" },
            { text: "02-Markdown语法", link: "/articles/tools/02-Markdown.md" },
            { text: "03-IDE使用技巧", link: "/articles/tools/03-IDE.md" },
          ],
        },

        {
          text: "🍏博客",
          collapsed: true,
          items: [
            { text: "01-搭建博客", link: "/articles/blog/01-vitepress.md" },
            { text: "02-Markdown语法", link: "/articles/blog/02-markdown.md" },
          ],
        },
      ],
    },
  ],
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
          collapsed: true, // 侧边栏可折叠
          items: [
            { text: "01-Html", link: "/interview/" },
            { text: "02-Css", link: "/interview/02-css.md" },
            { text: "03-JS", link: "/interview/03-javascript.md" },
            { text: "04-ES6", link: "/interview/04-ES6.md" },
          ],
        },
        {
          text: "02-框架",
          collapsed: true, // 侧边栏可折叠
          items: [
            { text: "05-TS", link: "/interview/05-typescript.md" },
            { text: "06-Vue", link: "/interview/06-vue.md" },
            { text: "07-React", link: "/interview/08-react16.md" },
          ],
        },
        {
          text: "03-工程化",
          collapsed: true, // 侧边栏可折叠
          items: [{ text: "08-工程化", link: "/interview/08-engineering.md" }],
        },
        {
          text: "04-跨端",
          collapsed: true, // 侧边栏可折叠
          items: [
            { text: "09-UniApp", link: "/interview/09-UniApp.md" },
            { text: "10-React Native", link: "/interview/10-ReactNative.md" },
            { text: "11-Flutter", link: "/interview/11-Flutter.md" },
            { text: "12-Harmony OS", link: "/interview/12-HarmonyOS.md" },
            { text: "13-Elctron", link: "/interview/13-Elctron.md" },
          ],
        },
        {
          text: "05-网络",
          collapsed: true, // 侧边栏可折叠
          items: [{ text: "09-网络", link: "/interview/09-network.md" }],
        },
        {
          text: "06-浏览器",
          collapsed: true, // 侧边栏可折叠
          items: [{ text: "10-浏览器", link: "/interview/10-Browser.md" }],
        },
        {
          text: "07-手写题",
          collapsed: true, // 侧边栏可折叠
          items: [{ text: "11-手写题", link: "/interview/11-Handwriting.md" }],
        },
        {
          text: "08-项目常考",
          collapsed: true, // 侧边栏可折叠
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
      text: "html",
      items: [
        { text: "01-概述", link: "/frontend/01-html/01-overview.md" },
        { text: "02-标签", link: "/frontend/01-html/02-tag.md" },
        { text: "03-属性", link: "/frontend/01-html/03-attributes.md" },
        { text: "04-语义化", link: "/frontend/01-html/04-semanticElement.md" },
        { text: "05-注释", link: "/frontend/01-html/05-form.md" },
        { text: "06-文档类型", link: "/frontend/01-html/06-table.md" },
        { text: "07-语义化扩展", link: "/frontend/01-html/07-semantic.md" },
      ],
    },
  ],
  "/frontend/02-css/": [
    {
      text: "css",
      items: [
        { text: "01-概述", link: "/frontend/02-css/01-overview.md" },
        { text: "02-选择器", link: "/frontend/02-css/02-selector.md" },
        { text: "03-盒模型", link: "/frontend/02-css/03-box-model.md" },
        { text: "04-布局", link: "/frontend/02-css/04-layout.md" },
        { text: "05-动画", link: "/frontend/02-css/05-animation.md" },
        { text: "06-响应式", link: "/frontend/02-css/06-responsive.md" },
        { text: "07-预处理器", link: "/frontend/02-css/07-preprocessor.md" }
      ]
    }
  ],
  "/frontend/03-javascript/": [
    {
      text: "javascript",
      items: [
        { text: "01-数据类型", link: "/frontend/03-javascript/01-dataType.md" },
        // { text: "02-内存", link: "/frontend/03-javascript/02-memory.md" },
        { text: "02-运算符", link: "/frontend/03-javascript/02-operator.md" },
        { text: "03-流程控制", link: "/frontend/03-javascript/03-controlflow.md" },
        { text: "04-数值", link: "/frontend/03-javascript/04-number.md" },
        { text: "05-字符串", link: "/frontend/03-javascript/05-string.md" },
        { text: "06-布尔值", link: "/frontend/03-javascript/06-boolean.md" },
        { text: "07-空值", link: "/frontend/03-javascript/07-undefined.md" },
        { text: "08-函数", link: "/frontend/03-javascript/08-function.md" },
        { text: "09-对象", link: "/frontend/03-javascript/09-object.md" },
        { text: "10-数组", link: "/frontend/03-javascript/10-array.md" },
        { text: "11-正则", link: "/frontend/03-javascript/11-regex.md" },
        { text: "12-模块化", link: "/frontend/03-javascript/12-module.md" },
        {
          text: "13-设计模式",
          link: "/frontend/03-javascript/13-designpattern.md",
        },
        { text: "14-DOM", link: "/frontend/03-javascript/14-dom.md" },
        { text: "15-BOM", link: "/frontend/03-javascript/15-bom.md" },
        { text: "16-事件", link: "/frontend/03-javascript/16-event.md" },
        { text: "17-异步编程", link: "/frontend/03-javascript/17-async.md" },
        { text: "18-模块化", link: "/frontend/03-javascript/18-module.md" },
        {
          text: "19-设计模式",
          link: "/frontend/03-javascript/19-designpattern.md",
        },
      ],
    },
  ],
  "/frontend/04-ecmascript/": [
    {
      text: "ecmascript",
      items: [
        { text: "01-变量扩展", link: "/frontend/04-ecmascript/01-variable.md" },
        {
          text: "02-基本类型扩展",
          link: "/frontend/04-ecmascript/02-basicTypeExtension.md",
        },
        {
          text: "03-引用类型扩展",
          link: "/frontend/04-ecmascript/03-referenceTypeExtension.md",
        },
        { text: "04-Symbol", link: "/frontend/04-ecmascript/04-symbol.md" },
        { text: "05-Set/Map", link: "/frontend/04-ecmascript/05-container.md" },
        { text: "06-Proxy", link: "/frontend/04-ecmascript/06-proxy.md" },
        { text: "07-Reflect", link: "/frontend/04-ecmascript/07-reflect.md" },
        { text: "08-Promise", link: "/frontend/04-ecmascript/08-promise.md" },
        { text: "09-Iterator", link: "/frontend/04-ecmascript/09-iterator.md" },
        {
          text: "10-Generator",
          link: "/frontend/04-ecmascript/10-generator.md",
        },
        {
          text: "11-Decorator",
          link: "/frontend/04-ecmascript/11-decorator.md",
        },
        {
          text: "12-Async/Await",
          link: "/frontend/04-ecmascript/12-asyncawait.md",
        },
        { text: "13-模块", link: "/frontend/04-ecmascript/13-module.md" },
        { text: "14-类", link: "/frontend/04-ecmascript/14-class.md" },
        {
          text: "15-异步遍历器",
          link: "/frontend/04-ecmascript/15-asynciterator.md",
        },
      ],
    },
  ],
  "/frontend/05-typescript/": [
    {
      text: "typescript",
      items: [
        {
          text: "01-TypeScript概述",
          link: "/frontend/05-typescript/01-typescript.md",
        },
        {
          text: "02-基本语法",
          link: "/frontend/05-typescript/02-basic-syntax.md",
        },
        {
          text: "03-类型系统",
          link: "/frontend/05-typescript/03-type-system.md",
        },
        {
          text: "04-接口与类型",
          link: "/frontend/05-typescript/04-interfaces.md",
        },
        { text: "05-类与继承", link: "/frontend/05-typescript/05-classes.md" },
        { text: "06-泛型", link: "/frontend/05-typescript/06-generics.md" },
        {
          text: "07-高级类型",
          link: "/frontend/05-typescript/07-advanced-types.md",
        },
        { text: "08-模块", link: "/frontend/05-typescript/08-module.md" },
        { text: "09-装饰器", link: "/frontend/05-typescript/09-decorators.md" },
        { text: "10-项目实战", link: "/frontend/05-typescript/10-project.md" },
      ],
    },
  ],
  "/frontend/06-vue2/": [
    {
      text: "Vue 2 核心学习",
      // collapsed: false,
      items: [
        {
          text: "第1章：Vue 2 基础理解",
          collapsed: true,
          items: [
            { text: "1.1 设计理念", link: "/frontend/06-vue2/01-01-introduction.md" },
            { text: "1.2 项目创建", link: "/frontend/06-vue2/01-02-installation.md" },
            { text: "1.3 生命周期", link: "/frontend/06-vue2/01-03-lifecycle.md" },
            { text: "1.4 指令系统", link: "/frontend/06-vue2/01-04-directives.md" },
            { text: "1.5 选项式API", link: "/frontend/06-vue2/01-05-options-api.md" },
            // { text: "1.6 组件通信", link: "/frontend/06-vue2/01-06-communication.md" },
          ],
        },
        {
          text: "第2章：Vue 2 组件系统",
          collapsed: true,
          items: [
            { text: "2.1 组件基础", link: "/frontend/06-vue2/02-01-component-basics.md" },
            { text: "2.2 组件通信", link: "/frontend/06-vue2/02-02-component-communication.md" },
            { text: "2.3 插槽使用", link: "/frontend/06-vue2/02-03-slots.md" },
            { text: "2.4 动态组件", link: "/frontend/06-vue2/02-04-dynamic-async-components.md" },
            { text: "2.5 组件生命周期", link: "/frontend/06-vue2/02-05-component-lifecycle.md" },
            // { text: "2.6 混入与自定义指令", link: "/frontend/06-vue2/02-06-mixins-directives.md" },
          ],
        },
        {
          text: "第3章：Vue 2 进阶特性",
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
          text: "第4章：Vue Router",
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
          text: "第5章：Vuex 状态管理",
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
          text: "第6章：Vue 2 项目实战",
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
      // collapsed: false,
      items: [
        {
          text: "第1章：Vue 3 新特性与升级",
          collapsed: true,
          items: [
            { text: "1.1 Vue 3 设计理念与优势", link: "/frontend/07-vue3/01-design-philosophy.md" },
            { text: "1.2 Composition API 简介", link: "/frontend/07-vue3/02-composition-api-intro.md" },
            { text: "1.3 响应式系统重构", link: "/frontend/07-vue3/03-reactivity-refactor.md" },
            { text: "1.4 性能优化", link: "/frontend/07-vue3/04-performance-tree-shaking.md" },
            { text: "1.5 从Vue 2迁移到Vue 3", link: "/frontend/07-vue3/05-migration-guide.md" },
          ],
        },
        {
          text: "第2章：Composition API 深度掌握",
          collapsed: true,
          items: [
            { text: "2.1 ref与reactive响应式变量", link: "/frontend/07-vue3/02-01-ref-reactive.md" },
            { text: "2.2 computed与watch", link: "/frontend/07-vue3/02-02-computed-watch.md" },
            { text: "2.3 生命周期钩子函数变化", link: "/frontend/07-vue3/02-03-lifecycle-hooks.md" },
            { text: "2.4 自定义组合式函数", link: "/frontend/07-vue3/02-04-composables.md" },
            { text: "2.5 provide与inject", link: "/frontend/07-vue3/02-05-provide-inject.md" },
            { text: "2.6 模板引用与响应式工具函数", link: "/frontend/07-vue3/02-06-template-refs-utils.md" },
          ],
        },
        {
          text: "第3章：Vue 3 组件系统",
          collapsed: true,
          items: [
            { text: "3.1 组件基础（Options与Composition对比）", link: "/frontend/07-vue3/03-01-component-basics.md" },
            { text: "3.2 defineProps与defineEmits", link: "/frontend/07-vue3/03-02-define-props-emits.md" },
            { text: "3.3 插槽改进", link: "/frontend/07-vue3/03-03-slots-improvements.md" },
            { text: "3.4 异步组件与Suspense", link: "/frontend/07-vue3/03-04-async-components-suspense.md" },
            { text: "3.5 组件v-model变化", link: "/frontend/07-vue3/03-05-v-model-changes.md" },
            { text: "3.6 Teleport组件", link: "/frontend/07-vue3/03-06-teleport.md" },
          ],
        },
        {
          text: "第4章：Vue 3 生态",
          collapsed: true,
          items: [
            { text: "4.1 Vue Router 4.x 新特性", link: "/frontend/07-vue3/04-01-vue-router-4.md" },
            { text: "4.2 Pinia（状态管理方案）", link: "/frontend/07-vue3/04-02-pinia.md" },
            { text: "4.3 VueUse工具库使用", link: "/frontend/07-vue3/04-03-vueuse.md" },
            { text: "4.4 Vite构建工具", link: "/frontend/07-vue3/04-04-vite.md" },
            { text: "4.5 TypeScript集成", link: "/frontend/07-vue3/04-05-typescript-integration.md" },
          ],
        },
        {
          text: "第5章：TypeScript与Vue 3",
          collapsed: true,
          items: [
            { text: "5.1 TypeScript基础类型与泛型", link: "/frontend/07-vue3/05-01-typescript-basics.md" },
            { text: "5.2 在Vue 3中使用TypeScript", link: "/frontend/07-vue3/05-02-vue3-typescript.md" },
            { text: "5.3 类型推断与类型声明", link: "/frontend/07-vue3/05-03-type-inference.md" },
            { text: "5.4 组件Props的类型定义", link: "/frontend/07-vue3/05-04-props-types.md" },
            { text: "5.5 Composition API的类型支持", link: "/frontend/07-vue3/05-05-composition-api-types.md" },
          ],
        },
        {
          text: "第6章：Vue 3 项目实战",
          collapsed: true,
          items: [
            { text: "6.1 使用Vite创建项目", link: "/frontend/07-vue3/06-01-vite-project.md" },
            { text: "6.2 现代前端架构设计", link: "/frontend/07-vue3/06-02-architecture-design.md" },
            { text: "6.3 组合式函数实践", link: "/frontend/07-vue3/06-03-composables-practice.md" },
            { text: "6.4 性能监控与优化", link: "/frontend/07-vue3/06-04-performance-monitoring.md" },
            { text: "6.5 微前端集成方案", link: "/frontend/07-vue3/06-05-micro-frontend.md" },
            { text: "6.6 服务器端渲染与Nuxt 3", link: "/frontend/07-vue3/06-06-ssr-nuxt3.md" },
          ],
        },
      ],
    },
  ],
  "/frontend/08-react16/": [
    {
      text: "React 16 - 从零开始学习",
      items: [
        // 基础篇
        { text: "01-React16概述", link: "/frontend/08-react16/01-react16.md" },
        { text: "02-JSX语法", link: "/frontend/08-react16/03-jsx.md" },
        { text: "03-组件开发", link: "/frontend/08-react16/02-components.md" },
        // 核心概念
        { text: "04-生命周期", link: "/frontend/08-react16/04-lifecycle.md" },
        { text: "05-Hooks基础", link: "/frontend/08-react16/05-hooks.md" },
        // 进阶应用
        { text: "06-路由配置", link: "/frontend/08-react16/06-router.md" },
        { text: "07-状态管理", link: "/frontend/08-react16/07-state-management.md" },
        // 实战
        { text: "08-项目实战", link: "/frontend/08-react16/08-project.md" },
      ],
    },
  ],
  "/frontend/09-react18/": [
    {
      text: "React 18 - 新特性与最佳实践",
      items: [
        // 基础篇
        { text: "01-React18概述", link: "/frontend/09-react18/01-react18.md" },
        { text: "02-并发特性", link: "/frontend/09-react18/02-concurrent-features.md" },
        // 核心新特性
        { text: "03-Automatic Batching", link: "/frontend/09-react18/03-automatic-batching.md" },
        { text: "04-Transitions", link: "/frontend/09-react18/04-transitions.md" },
        { text: "05-Suspense新特性", link: "/frontend/09-react18/05-suspense.md" },
        { text: "06-新Hooks", link: "/frontend/09-react18/06-new-hooks.md" },
        // 进阶应用
        { text: "07-路由配置", link: "/frontend/09-react18/07-router.md" },
        { text: "08-状态管理", link: "/frontend/09-react18/08-state-management.md" },
        // 实战
        { text: "09-项目实战", link: "/frontend/09-react18/09-project.md" },
      ],
    },
  ],
  "/backend/01-nodejs/": [
    {
      text: "Node.js",
      items: [
        { text: "01-Node.js概述", link: "/backend/01-nodejs/01-nodejs.md" },
        { text: "02-模块系统", link: "/backend/01-nodejs/02-modules.md" },
        { text: "03-文件系统", link: "/backend/01-nodejs/03-fs.md" },
        { text: "04-事件循环", link: "/backend/01-nodejs/04-event-loop.md" },
        { text: "05-异步编程", link: "/backend/01-nodejs/05-async.md" },
        { text: "06-流", link: "/backend/01-nodejs/06-streams.md" },
        { text: "07-网络编程", link: "/backend/01-nodejs/07-network.md" },
        { text: "08-数据库操作", link: "/backend/01-nodejs/08-database.md" },
        { text: "09-性能优化", link: "/backend/01-nodejs/09-performance.md" },
        { text: "10-项目实战", link: "/backend/01-nodejs/10-project.md" },
      ],
    },
  ],
  "/backend/02-express/": [
    {
      text: "Express",
      items: [
        { text: "01-Express概述", link: "/backend/02-express/01-express.md" },
        { text: "02-路由系统", link: "/backend/02-express/02-routing.md" },
        { text: "03-中间件", link: "/backend/02-express/03-middleware.md" },
        { text: "04-请求处理", link: "/backend/02-express/04-request.md" },
        { text: "05-响应处理", link: "/backend/02-express/05-response.md" },
        { text: "06-模板引擎", link: "/backend/02-express/06-template.md" },
        { text: "07-数据库集成", link: "/backend/02-express/07-database.md" },
        {
          text: "08-身份认证",
          link: "/backend/02-express/08-authentication.md",
        },
        {
          text: "09-错误处理",
          link: "/backend/02-express/09-error-handling.md",
        },
        {
          text: "10-API开发",
          link: "/backend/02-express/10-api-development.md",
        },
      ],
    },
  ],
  "/backend/03-nestjs/": [
    {
      text: "NestJS",
      items: [
        { text: "01-NestJS概述", link: "/backend/03-nestjs/01-nestjs.md" },
        { text: "02-模块系统", link: "/backend/03-nestjs/02-modules.md" },
        { text: "03-控制器", link: "/backend/03-nestjs/03-controllers.md" },
        { text: "04-提供者", link: "/backend/03-nestjs/04-providers.md" },
        { text: "05-中间件", link: "/backend/03-nestjs/05-middleware.md" },
        {
          text: "06-异常过滤器",
          link: "/backend/03-nestjs/06-exception-filters.md",
        },
        { text: "07-Pipes管道", link: "/backend/03-nestjs/07-pipes.md" },
        { text: "08-Guards守卫", link: "/backend/03-nestjs/08-guards.md" },
        { text: "09-拦截器", link: "/backend/03-nestjs/09-interceptors.md" },
        { text: "10-数据库集成", link: "/backend/03-nestjs/10-database.md" },
        {
          text: "11-身份认证",
          link: "/backend/03-nestjs/11-authentication.md",
        },
        { text: "12-API文档", link: "/backend/03-nestjs/12-api-docs.md" },
        { text: "13-微服务", link: "/backend/03-nestjs/13-microservices.md" },
      ],
    },
  ],
  "/web3/01-web3.0/": [
    {
      text: "Web3.js - 前端与区块链交互",
      items: [
        { text: "01-概述", link: "/web3/01-web3.js/01-overview.md" },
        { text: "02-环境搭建", link: "/web3/01-web3.js/02-setup.md" },
        { text: "03-连接区块链", link: "/web3/01-web3.js/03-connection.md" },
        { text: "04-账户管理", link: "/web3/01-web3.js/04-accounts.md" },
        { text: "05-查询余额", link: "/web3/01-web3.js/05-balance.md" },
        { text: "06-发送交易", link: "/web3/01-web3.js/06-transactions.md" },
        { text: "07-合约交互", link: "/web3/01-web3.js/07-contracts.md" },
        { text: "08-事件监听", link: "/web3/01-web3.js/08-events.md" },
        { text: "09-错误处理", link: "/web3/01-web3.js/09-error-handling.md" },
        { text: "10-最佳实践", link: "/web3/01-web3.js/10-best-practices.md" },
      ],
    },
  ],
  "/web3/02-solidity/": [
    {
      text: "Solidity - 智能合约开发",
      items: [
        // 基础篇
        { text: "01-概述", link: "/web3/02-solidity/01-overview.md" },
        { text: "02-开发环境", link: "/web3/02-solidity/02-environment.md" },
        { text: "03-第一个合约", link: "/web3/02-solidity/03-first-contract.md" },
        // 数据类型篇
        { text: "04-值类型", link: "/web3/02-solidity/16-value-types.md" },
        { text: "05-引用类型", link: "/web3/02-solidity/17-reference-types.md" },
        { text: "06-地址类型", link: "/web3/02-solidity/15-address.md" },
        { text: "07-数组", link: "/web3/02-solidity/13-arrays.md" },
        { text: "08-映射", link: "/web3/02-solidity/12-mappings.md" },
        { text: "09-字符串", link: "/web3/02-solidity/14-strings.md" },
        { text: "10-结构体", link: "/web3/02-solidity/10-structs.md" },
        { text: "11-枚举", link: "/web3/02-solidity/11-enums.md" },
        { text: "12-类型转换", link: "/web3/02-solidity/18-type-conversion.md" },
        // 语法篇
        { text: "13-变量", link: "/web3/02-solidity/03-variables.md" },
        { text: "14-运算符", link: "/web3/02-solidity/19-operators.md" },
        { text: "15-控制结构", link: "/web3/02-solidity/20-control-structures.md" },
        { text: "16-循环", link: "/web3/02-solidity/21-loops.md" },
        // 函数与合约篇
        { text: "17-函数", link: "/web3/02-solidity/04-functions.md" },
        { text: "18-合约", link: "/web3/02-solidity/06-contracts.md" },
        { text: "19-继承", link: "/web3/02-solidity/07-inheritance.md" },
        { text: "20-接口", link: "/web3/02-solidity/08-interfaces.md" },
        { text: "21-库", link: "/web3/02-solidity/09-libraries.md" },
        { text: "22-事件", link: "/web3/02-solidity/05-events.md" },
      ],
    },
  ],
  "/web3/03-ethereum/": [
    {
      text: "Ethereum - 以太坊生态",
      items: [
        // 基础概念
        { text: "01-概述", link: "/web3/03-ethereum/01-overview.md" },
        { text: "02-账户系统", link: "/web3/03-ethereum/02-accounts.md" },
        { text: "03-交易机制", link: "/web3/03-ethereum/03-transactions.md" },
        { text: "04-交易确认", link: "/web3/03-ethereum/07-transaction-confirmation.md" },
        // 合约开发
        { text: "05-合约基础", link: "/web3/03-ethereum/04-contracts.md" },
        { text: "06-ABI接口", link: "/web3/03-ethereum/05-abi.md" },
        { text: "07-合约部署", link: "/web3/03-ethereum/09-contract-deployment.md" },
        { text: "08-合约调用", link: "/web3/03-ethereum/10-contract-calls.md" },
        { text: "09-合约交互", link: "/web3/03-ethereum/08-contract-interaction.md" },
        // 事件与状态
        { text: "10-事件系统", link: "/web3/03-ethereum/06-events.md" },
        { text: "11-合约事件", link: "/web3/03-ethereum/11-contract-events.md" },
        { text: "12-合约状态", link: "/web3/03-ethereum/12-contract-state.md" },
        { text: "13-合约存储", link: "/web3/03-ethereum/13-contract-storage.md" },
      ],
    },
  ],
  "/microfrontend/01-qiankun/": [
    {
      text: "qiankun - 微前端框架",
      items: [
        // 基础篇
        { text: "01-概述", link: "/microfrontend/01-qiankun/01-overview.md" },
        { text: "02-快速开始", link: "/microfrontend/01-qiankun/02-quick-start.md" },
        // 核心概念
        { text: "03-主应用配置", link: "/microfrontend/01-qiankun/03-main-app.md" },
        { text: "04-微应用配置", link: "/microfrontend/01-qiankun/04-micro-app.md" },
        { text: "05-路由系统", link: "/microfrontend/01-qiankun/05-routing.md" },
        { text: "06-主应用路由", link: "/microfrontend/01-qiankun/06-main-app-routing.md" },
        { text: "07-微应用路由", link: "/microfrontend/01-qiankun/07-micro-app-routing.md" },
        // 进阶特性
        { text: "08-应用通信", link: "/microfrontend/01-qiankun/08-communication.md" },
        { text: "09-样式隔离", link: "/microfrontend/01-qiankun/09-style-isolation.md" },
        { text: "10-沙箱机制", link: "/microfrontend/01-qiankun/10-sandbox.md" },
        { text: "11-资源加载", link: "/microfrontend/01-qiankun/11-resource-loading.md" },
        { text: "12-生命周期", link: "/microfrontend/01-qiankun/12-micro-app-lifecycle.md" },
        { text: "13-状态管理", link: "/microfrontend/01-qiankun/13-micro-app-state-management.md" },
      ],
    },
  ],
  "/crossend/01-reactnative/": [
    {
      text: "React Native - 跨平台移动开发",
      items: [
        { text: "01-概述", link: "/crossend/01-reactnative/index.md" },
        { text: "02-环境搭建", link: "/crossend/01-reactnative/01-getting-started.md" },
        { text: "03-组件系统", link: "/crossend/01-reactnative/02-basic-components.md" },
        { text: "04-样式和布局", link: "/crossend/01-reactnative/03-styling-and-layout.md" },
        { text: "05-导航系统", link: "/crossend/01-reactnative/04-navigation.md" },
        { text: "06-状态管理", link: "/crossend/01-reactnative/05-state-management.md" },
        { text: "07-网络请求", link: "/crossend/01-reactnative/06-networking.md" },
        { text: "08-Native模块", link: "/crossend/01-reactnative/07-native-modules.md" },
        { text: "09-性能优化", link: "/crossend/01-reactnative/08-performance-optimization.md" },
        { text: "10-打包部署", link: "/crossend/01-reactnative/09-deployment.md" },
        { text: "11-学习资源", link: "/crossend/01-reactnative/10-learning-resources.md" },
      ],
    },
  ],
  "/crossend/02-flutter/": [
    {
      text: "Flutter - 跨平台UI框架",
      items: [
        { text: "01-概述", link: "/crossend/02-flutter/index.md" },
        { text: "02-环境搭建", link: "/crossend/02-flutter/01-getting-started.md" },
        { text: "03-Widget系统", link: "/crossend/02-flutter/02-widgets.md" },
        { text: "04-布局系统", link: "/crossend/02-flutter/03-layout.md" },
        { text: "05-状态管理", link: "/crossend/02-flutter/04-state-management.md" },
        { text: "06-导航系统", link: "/crossend/02-flutter/05-navigation.md" },
        { text: "07-网络请求", link: "/crossend/02-flutter/06-networking.md" },
        { text: "08-动画系统", link: "/crossend/02-flutter/07-animation.md" },
        { text: "09-性能优化", link: "/crossend/02-flutter/08-performance-optimization.md" },
        { text: "10-打包部署", link: "/crossend/02-flutter/09-deployment.md" },
        { text: "11-学习资源", link: "/crossend/02-flutter/10-learning-resources.md" },
      ],
    },
  ],
  "/crossend/03-harmonyOs/": [
    {
      text: "HarmonyOS - 鸿蒙应用开发",
      items: [
        { text: "01-概述", link: "/crossend/03-harmonyOs/index.md" },
        { text: "02-环境搭建", link: "/crossend/03-harmonyOs/01-getting-started.md" },
        { text: "03-ArkUI框架", link: "/crossend/03-harmonyOs/02-arkui-framework.md" },
        { text: "04-布局系统", link: "/crossend/03-harmonyOs/03-layout.md" },
        { text: "05-状态管理", link: "/crossend/03-harmonyOs/03-state-management.md" },
        { text: "06-页面路由", link: "/crossend/03-harmonyOs/04-page-routing.md" },
        { text: "07-网络请求", link: "/crossend/03-harmonyOs/05-networking.md" },
        { text: "08-权限管理", link: "/crossend/03-harmonyOs/06-permission-management.md" },
        { text: "09-性能优化", link: "/crossend/03-harmonyOs/07-performance-optimization.md" },
      ],
    },
  ],
  "/crossend/04-elctron/": [
    {
      text: "Electron - 桌面应用开发",
      items: [
        { text: "01-概述", link: "/crossend/04-elctron/index.md" },
        { text: "02-环境搭建", link: "/crossend/04-elctron/02-setup.md" },
        { text: "03-主进程与渲染进程", link: "/crossend/04-elctron/03-processes.md" },
        { text: "04-窗口管理", link: "/crossend/04-elctron/04-windows.md" },
        { text: "05-进程通信", link: "/crossend/04-elctron/05-ipc.md" },
        { text: "06-原生模块", link: "/crossend/04-elctron/06-native-modules.md" },
        { text: "07-打包发布", link: "/crossend/04-elctron/07-packaging.md" },
      ],
    },
  ],
  "/operation/01-shell/": [
    {
      text: "Shell脚本 - Linux自动化基础",
      items: [
        { text: "01-Shell概述", link: "/operation/01-shell/01-overview.md" },
        { text: "02-基础语法", link: "/operation/01-shell/02-basic-syntax.md" },
        { text: "03-变量与参数", link: "/operation/01-shell/03-variables.md" },
        { text: "04-流程控制", link: "/operation/01-shell/04-control-flow.md" },
        { text: "05-函数", link: "/operation/01-shell/05-functions.md" },
        { text: "06-文件操作", link: "/operation/01-shell/06-file-operations.md" },
        { text: "07-文本处理", link: "/operation/01-shell/07-text-processing.md" },
        { text: "08-实战脚本", link: "/operation/01-shell/08-practical-scripts.md" },
      ],
    },
  ],
  "/operation/05-docker/": [
    {
      text: "Docker容器 - 应用容器化技术",
      items: [
        { text: "01-Docker概述", link: "/operation/05-docker/01-overview.md" },
        { text: "02-安装配置", link: "/operation/05-docker/02-installation.md" },
        { text: "03-镜像管理", link: "/operation/05-docker/03-images.md" },
        { text: "04-容器管理", link: "/operation/05-docker/04-containers.md" },
        { text: "05-Dockerfile", link: "/operation/05-docker/05-dockerfile.md" },
        { text: "06-Docker Compose", link: "/operation/05-docker/06-compose.md" },
        { text: "07-网络与存储", link: "/operation/05-docker/07-network-storage.md" },
        { text: "08-实战部署", link: "/operation/05-docker/08-deployment.md" },
      ],
    },
  ],
  "/operation/04-k8s/": [
    {
      text: "Kubernetes - 容器编排平台",
      items: [
        { text: "01-K8s概述", link: "/operation/04-k8s/01-overview.md" },
        { text: "02-集群搭建", link: "/operation/04-k8s/02-cluster-setup.md" },
        { text: "03-Pod与容器", link: "/operation/04-k8s/03-pods-containers.md" },
        { text: "04-Service与Ingress", link: "/operation/04-k8s/04-service-ingress.md" },
        { text: "05-ConfigMap与Secret", link: "/operation/04-k8s/05-config-secret.md" },
        { text: "06-Deployment与StatefulSet", link: "/operation/04-k8s/06-deployment.md" },
        { text: "07-存储管理", link: "/operation/04-k8s/07-storage.md" },
        { text: "08-监控与日志", link: "/operation/04-k8s/08-monitoring.md" },
      ],
    },
  ],
  "/operation/02-jenkins/": [
    {
      text: "Jenkins - 持续集成工具",
      items: [
        { text: "01-Jenkins概述", link: "/operation/02-jenkins/01-overview.md" },
        { text: "02-安装配置", link: "/operation/02-jenkins/02-installation.md" },
        { text: "03-Pipeline语法", link: "/operation/02-jenkins/03-pipeline.md" },
        { text: "04-插件使用", link: "/operation/02-jenkins/04-plugins.md" },
        { text: "05-构建任务", link: "/operation/02-jenkins/05-build-jobs.md" },
        { text: "06-集成Git", link: "/operation/02-jenkins/06-git-integration.md" },
        { text: "07-集成Docker", link: "/operation/02-jenkins/07-docker-integration.md" },
        { text: "08-实战案例", link: "/operation/02-jenkins/08-practical-cases.md" },
      ],
    },
  ],
  "/operation/03-cicd/": [
    {
      text: "CI/CD实践 - 持续集成与部署",
      items: [
        { text: "01-CI/CD概述", link: "/operation/03-cicd/01-overview.md" },
        { text: "02-GitLab CI/CD", link: "/operation/03-cicd/02-gitlab-ci.md" },
        { text: "03-GitHub Actions", link: "/operation/03-cicd/03-github-actions.md" },
        { text: "04-自动化测试", link: "/operation/03-cicd/04-automated-testing.md" },
        { text: "05-自动化部署", link: "/operation/03-cicd/05-automated-deployment.md" },
        { text: "06-最佳实践", link: "/operation/03-cicd/06-best-practices.md" },
        { text: "07-实战案例", link: "/operation/03-cicd/07-practical-cases.md" },
      ],
    },
  ],
  "/operation/05-niginx": [
    {
      text: "Nginx - 反向代理服务器",
      items: [
      ],
    },
  ],
  "/engineering/01-webpack/": [
    {
      text: "Webpack - 前端构建工具",
      items: [

      ],
    },
  ],
  "/engineering/02-vite/": [
    {
      text: "Vite - 前端构建工具",
      items: [
        { text: "拆掉vite外壳，原理剖析", link: "/engineering/02-vite/01-vite.md" },
        { text: "企业级脚手架落地", link: "/engineering/02-vite/02-脚手架.md" },
        { text: "全体系插件实战+自定义插件开发", link: "/engineering/02-vite/03-插件实战.md" },
        { text: "企业级项目打包优化全链路", link: "/engineering/02-vite/04-打包优化.md" },
        { text: "vue/react双项目实战", link: "/engineering/02-vite/05-双项目实战.md" },
        { text: "部署上线+CI/CD自动化", link: "/engineering/02-vite/06-部署上线.md" },
        { text: "阿里云完整部署流程（企业级SOP）", link: "/engineering/02-vite/07-阿里云部署.md" },
      ],
    },
  ],
};
