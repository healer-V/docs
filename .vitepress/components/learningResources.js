const icon = (paths) =>
  `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`

export const resourceIcons = {
  book: icon('<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>'),
  mechanism: icon('<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>'),
  interview: icon('<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M9.5 8.5a2.5 2.5 0 1 1 3 2.4V12M12 14.5h.01"/>'),
  column: icon('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/><path d="M8 7h8M8 11h5"/>'),
  community: icon('<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
  external: icon('<path d="M7 17 17 7"/><path d="M8 7h9v9"/>'),
  star: icon('<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>')
}

export const resourceSections = [
  {
    id: 'tutorials',
    title: '系统教程',
    desc: '成体系的语言与框架教程，适合从头学或回头查',
    icon: 'book',
    items: [
      { name: '现代 JavaScript 教程', desc: '从语言基础到浏览器能力的系统化教程', tag: 'JavaScript', link: 'https://zh.javascript.info/', featured: true },
      { name: '阮一峰 · ES6 标准入门', desc: '中文 ES6+ 语法教程，持续维护', tag: 'ES6+', link: 'https://es6.ruanyifeng.com/', featured: true },
      { name: '网道文档', desc: '系统梳理前端基础知识', tag: '前端基础', link: 'https://wangdoc.com/' },
      { name: '小满 · React Docs', desc: '深度解读 React 文档，适合进阶学习', tag: 'React', link: 'https://message163.github.io/react-docs/react/components/base.html', featured: true },
      { name: 'ExplainThis', desc: '前端工程化与常见概念详解', tag: '工程化', link: 'https://www.explainthis.io/zh-hans' }
    ]
  },
  {
    id: 'internals',
    title: '原理拆解',
    desc: '深入源码、运行机制与底层实现',
    icon: 'mechanism',
    items: [
      { name: 'Vue.js 技术揭秘', desc: '深入分析 Vue 运行机制与源码实现', tag: 'Vue 原理', link: 'https://ustbhuangyi.github.io/vue-analysis/', featured: true },
      { name: 'Vue 源码剖析', desc: 'Vue 2 源码深度解析', tag: 'Vue 2', link: 'https://vue-js.com/learn-vue/' },
      { name: 'Vue3 源码解析', desc: 'Vue 3 核心源码分析', tag: 'Vue 3', link: 'https://wangzhenhao.github.io/vue3-analysis/' }
    ]
  },
  {
    id: 'interview',
    title: '面试题库',
    desc: '面经、知识自检与高频题',
    icon: 'interview',
    items: [
      { name: '前端官 · Vue3 面试题', desc: '系统整理的 Vue 3 原理与高频题', tag: 'Vue 3', link: 'https://vue3js.cn/interview/' },
      { name: '面试指南', desc: '系统进阶的前端知识体系', tag: '综合', link: 'https://interview.poetries.top/' },
      { name: '小鹤', desc: '大厂面经与必备修养', tag: '面经', link: 'https://geekdaxue.co/books/qingyubailou@gygiq6' }
    ]
  },
  {
    id: 'columns',
    title: '深度专栏',
    desc: '个人长期维护的专题文章与知识库',
    icon: 'column',
    items: [
      { name: '冴羽 · JavaScript 深入系列', desc: '原型链、作用域、闭包、异步等核心机制', tag: 'JavaScript', link: 'https://github.com/mqyqingfeng/Blog', featured: true },
      { name: '张鑫旭 · CSS世界', desc: '深入 CSS 细节与原理', tag: 'CSS', link: 'https://www.zhangxinxu.com/wordpress/', featured: true },
      { name: '前端知识笔记', desc: 'realgeoffrey 整理的 HTML、CSS 与 JavaScript 知识库', tag: 'GitHub', link: 'https://github.com/realgeoffrey/knowledge' },
      { name: '前端知识分享', desc: '服务端渲染原理详解', tag: 'SSR', link: 'https://github.com/yacan8/blog/blob/master/posts/%E6%9C%8D%E5%8A%A1%E7%AB%AF%E6%B8%B2%E6%9F%93%E5%8E%9F%E7%90%86.md' }
    ]
  },
  {
    id: 'community',
    title: '社区与博客',
    desc: '技术社区、运维知识与博客主题参考',
    icon: 'community',
    items: [
      { name: '掘金 · 前端专栏', desc: '活跃的前端技术社区', tag: '社区', link: 'https://juejin.cn/frontend' },
      { name: 'OpForge · 运维', desc: '运维锻造，知识沉淀', tag: '运维', link: 'https://opforge.srebro.cn/' },
      { name: 'onedayxyy', desc: 'Linux 运维知识', tag: '运维', link: 'https://onedayxyy.cn/' },
      { name: '粥里有糖', desc: 'VitePress 主题定制', tag: '博客主题', link: 'https://sugarat.top/' },
      { name: 'DK酱', desc: '个人技术博客', tag: '博客', link: 'https://cccdk.github.io/blog/' }
    ]
  }
]

export const featuredResources = resourceSections.flatMap((section) =>
  section.items.filter((item) => item.featured).map((item) => ({ ...item, icon: section.icon, section: section.title }))
)

export const resourceTotal = resourceSections.reduce((sum, section) => sum + section.items.length, 0)
