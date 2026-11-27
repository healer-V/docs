---
title: "SSR与全栈框架面试题"
category: "面试题"
tags:
  - SSR
  - Next.js
  - Nuxt
  - 水合
excerpt: "围绕 CSR、SSR、SSG 与增量静态再生成的区别，水合过程与水合不匹配，流式渲染，React Server Components 与客户端组件边界，SSR 的数据获取、缓存和 SEO 等面试题，说明渲染发生的位置、时机与代价。"
---

# SSR与全栈框架面试题

渲染方式的区别在于 HTML 在哪里、什么时候生成：浏览器运行时生成、每次请求时在服务器生成，还是构建时预先生成。Next.js、Nuxt 等全栈框架把这几种方式组合到同一个项目中，面试题通常考查每种方式对首屏速度、交互时间、服务器成本和数据新鲜度的影响。

::: info 版本边界
涉及 React Server Components 与 Next.js 的题目以 React 19 和 Next.js App Router 为基线，Nuxt 以 Nuxt 3 及以上为基线。各框架的缓存默认值在大版本之间有过调整，回答具体默认行为时要说明版本。
:::

## 一、渲染模式

### 1. CSR、SSR、SSG 和 ISR 有什么区别？

**四种模式的区别在于 HTML 内容生成的时机与位置。**

| 模式 | HTML 生成 | 首屏内容 | 数据新鲜度 | 服务器成本 |
|------|-----------|----------|------------|------------|
| CSR 客户端渲染 | 浏览器下载 JS 后生成 | 先空白或骨架屏 | 实时 | 低，只托管静态文件 |
| SSR 服务端渲染 | 每次请求时在服务器生成 | 直接可见 | 实时 | 高，每个请求都要渲染 |
| SSG 静态生成 | 构建时生成 | 直接可见 | 构建时的数据 | 最低，可放 CDN |
| ISR 增量静态再生成 | 构建时生成，过期后后台重新生成 | 直接可见 | 有一定延迟 | 低 |

选择时按页面特征判断：营销页、文档适合 SSG；商品详情页内容需要被搜索引擎收录又会变化，适合 ISR 或带缓存的 SSR；个人中心、后台管理不需要 SEO 且内容因人而异，用 CSR 即可。同一个应用的不同路由可以采用不同模式。

参考：[Next.js：渲染](https://nextjs.org/docs/app/getting-started/server-and-client-components)、[web.dev：Rendering on the Web](https://web.dev/articles/rendering-on-the-web)。

### 2. SSR 一定比 CSR 快吗？

**SSR 通常让用户更早看到内容（更好的 FCP 和 LCP），但不一定更早能交互，而且会增加首字节时间（TTFB）和服务器负载。**

SSR 页面的 HTML 到达后用户就能看到内容，但按钮要等 JavaScript 下载并完成水合后才响应点击，这段“看得见点不了”的时间会影响 INP 等交互指标。服务器渲染需要先等待数据查询完成，数据接口慢时 TTFB 随之变长，这时可以用流式渲染先发送页面框架。

| 指标 | SSR 的影响 |
|------|------------|
| TTFB | 增加，取决于服务端数据获取和渲染耗时 |
| FCP / LCP | 通常改善，HTML 中直接包含内容 |
| 可交互时间 | 不一定改善，仍需下载和执行同样的 JS |
| 服务器成本 | 增加，需要计算资源和缓存策略 |

参考：[web.dev：Rendering on the Web](https://web.dev/articles/rendering-on-the-web)、[web.dev：Web Vitals](https://web.dev/articles/vitals)。

## 二、水合

### 1. 水合是什么，为什么会出现水合不匹配？

**水合（Hydration）是浏览器端的框架接管服务端已渲染的 HTML：复用现有 DOM 节点，绑定事件监听器并建立组件状态，而不是重新创建 DOM。** 水合要求客户端首次渲染的结果与服务端生成的 HTML 一致。

两端结果不一致时，React 会报告水合错误并在出错的边界回退为客户端重新渲染，Vue 会在开发模式下给出 `Hydration mismatch` 警告。常见原因如下：

| 原因 | 例子 | 处理方式 |
|------|------|----------|
| 依赖时间或随机数 | 渲染时直接输出 `new Date()`、`Math.random()` | 由服务端生成后作为数据传给客户端 |
| 访问浏览器专有对象 | 渲染时读取 `window.innerWidth`、`localStorage` | 放到 `useEffect` 或 `onMounted` 中，挂载后再更新 |
| 时区或语言不同 | 服务端与用户时区不同导致日期格式不同 | 固定时区格式化，或只在客户端显示 |
| HTML 结构不合法 | `<p>` 中嵌套 `<div>` | 浏览器解析时会修正结构，与虚拟 DOM 不一致 |

对确实只能在客户端显示的内容（如本地时间），可以先渲染占位，在挂载后的副作用中更新；React 的 `suppressHydrationWarning` 只能用于单个元素的文本差异，不应用来掩盖结构差异。

参考：[React：hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot)、[Vue：SSR 水合不匹配](https://vuejs.org/guide/scaling-up/ssr.html#hydration-mismatch)。

### 2. 流式渲染和选择性水合解决了什么问题？

**传统 SSR 必须等所有数据就绪后才发送 HTML，客户端也必须加载完整个页面的 JS 才能开始水合；流式渲染把 HTML 分块发送，选择性水合让已就绪的部分先变得可交互。**

在 React 中，用 `<Suspense>` 包裹慢组件（如商品评论）后，服务器先发送页面框架和 `fallback` 占位，评论数据就绪后再在同一个响应中补发对应的 HTML 和替换脚本。客户端水合也以 Suspense 边界为单位进行，用户点击了尚未水合的区域时，React 会优先水合该区域。

这让“慢数据拖慢整页”变为“慢数据只延迟自身区域”。需要注意的是，流式响应开始发送后状态码和响应头就已确定，组件内部发生的错误无法再改为 500 状态码，必须通过错误边界在页面内处理。

参考：[React：Suspense](https://react.dev/reference/react/Suspense)、[React：renderToPipeableStream](https://react.dev/reference/react-dom/server/renderToPipeableStream)。

## 三、服务端组件与数据

### 1. React Server Components 与 SSR 有什么区别？

**SSR 是把组件渲染成 HTML 的技术，组件代码仍会发送到客户端用于水合；React Server Components（RSC）是只在服务器运行的组件，它的代码和依赖不会进入客户端 JS 包。**

| 维度 | Server Component | Client Component |
|------|------------------|------------------|
| 声明方式 | App Router 中的默认组件 | 文件顶部写 `'use client'` |
| 运行位置 | 仅服务器 | 服务器预渲染 + 浏览器 |
| 能做什么 | 直接读取数据库、文件和密钥 | 使用状态、副作用、事件处理和浏览器 API |
| 不能做什么 | 使用 `useState`、`onClick` | 直接访问服务端资源 |
| 客户端 JS | 不增加 | 组件代码会打包 |

Server Component 可以渲染 Client Component，并把可序列化的数据作为 props 传入；函数、类实例等不可序列化的值不能跨越这个边界。`'use client'` 标记的是边界：被它导入的模块都会进入客户端包，所以应尽量把交互部分抽成小的叶子组件，而不是在页面顶层标记。

::: warning 服务端组件中的密钥仍需防止误传
服务端组件可以安全地读取数据库密码，但若把包含敏感字段的对象作为 props 传给客户端组件，这些字段会被序列化到页面中。传给客户端的 props 只应包含展示所需的字段；可以用 `server-only` 包标记只能在服务端导入的模块。
:::

参考：[React：Server Components](https://react.dev/reference/rsc/server-components)、[React：'use client'](https://react.dev/reference/rsc/use-client)。

### 2. SSR 页面的数据获取和缓存要注意什么？

**SSR 的数据获取发生在服务器上，需要考虑请求瀑布、重复请求和缓存失效三个问题。**

1. **避免瀑布：** 页面同时需要用户和商品数据时，用 `Promise.all` 并行请求，而不是先 `await` 用户再 `await` 商品；嵌套组件各自串行获取数据也会形成瀑布。
2. **请求内去重：** 同一次渲染中多个组件需要相同数据时，React 的 `cache()` 可以让同一参数的函数调用在一次请求内只执行一次。
3. **跨请求缓存：** 公共数据（如商品分类）可以在服务端或 CDN 缓存一段时间；包含用户身份的数据不能被共享缓存，否则会把 A 的数据返回给 B。
4. **数据更新：** 修改数据后要主动失效相关缓存，例如在 Next.js 中调用 `revalidatePath` 或 `revalidateTag`，否则页面会继续显示旧内容。

服务端发起的请求不会自动携带浏览器的 Cookie，需要显式读取请求头并转发；服务端直接调用内部服务时，也要注意不要因为“在服务端”就跳过权限校验。

参考：[React：cache](https://react.dev/reference/react/cache)、[Next.js：缓存与重新验证](https://nextjs.org/docs/app/getting-started/caching-and-revalidating)。

### 3. SSR 对 SEO 有什么帮助，CSR 页面能被收录吗？

**SSR 和 SSG 让爬虫在初始 HTML 中直接获得正文、标题和链接；CSR 页面的内容需要执行 JavaScript 后才出现，依赖爬虫的渲染能力。**

Google 会把需要 JavaScript 的页面放入渲染队列，执行脚本后再索引，所以 CSR 页面可以被收录，但可能存在延迟，并且其他搜索引擎和社交平台的链接预览抓取器往往不执行 JavaScript。分享到聊天软件时显示的标题和缩略图来自 HTML 中的 Open Graph 元数据，CSR 页面通常无法按页面动态提供。

SEO 还取决于渲染方式以外的因素：每个页面有唯一的 `<title>` 和描述，使用可抓取的 `<a href>` 链接而不是只用点击事件跳转，提供 `sitemap.xml`，以及页面加载性能。

参考：[Google 搜索中心：JavaScript SEO 基础](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)。

### 4. 全栈框架中的服务端接口与独立后端如何分工？

**Next.js 的 Route Handlers、Server Actions 和 Nuxt 的 server 目录让前端项目可以直接编写服务端代码，适合 BFF 层的聚合、表单提交和轻量业务；复杂领域逻辑和多端共享的能力仍应放在独立后端服务中。**

| 场景 | 适合放在全栈框架内 | 适合独立后端 |
|------|--------------------|--------------|
| 页面专用的数据聚合 | 是 | 否 |
| 表单提交、简单 CRUD | 是 | 视规模而定 |
| App、小程序共用的业务接口 | 否 | 是 |
| 长时间任务、定时任务、消息消费 | 否 | 是 |
| 高并发核心交易 | 否 | 是 |

Server Actions 本质上是框架自动生成的 POST 接口，任何人都可以直接调用，必须在函数内部校验身份、权限和参数，不能因为它只在某个按钮中使用就省略校验。部署到 Serverless 或边缘运行时时，还要注意执行时长限制、冷启动和数据库连接数。

参考：[Next.js：Server Actions 的安全性](https://nextjs.org/docs/app/guides/data-security)、[Nuxt：server 目录](https://nuxt.com/docs/guide/directory-structure/server)。
