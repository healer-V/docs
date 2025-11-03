// 文章收集器 - 从实际markdown文件中收集文章信息
import { blogDataManager } from './blogData.js'

// 文章路径配置
const ARTICLE_PATHS = [
  // 基础知识
  { path: '/docs/articles/basic/01-html', category: '基础知识', title: 'HTML基础教程' },
  { path: '/docs/articles/basic/02-css', category: '基础知识', title: 'CSS样式指南' },
  { path: '/docs/articles/basic/03-javascript', category: '基础知识', title: 'JavaScript核心概念' },
  { path: '/docs/articles/basic/04-ecmascript', category: '基础知识', title: 'ECMAScript新特性' },
  { path: '/docs/articles/basic/05-typescript', category: '基础知识', title: 'TypeScript类型系统' },
  { path: '/docs/articles/basic/06-vue2', category: '基础知识', title: 'Vue.js框架入门' },
  { path: '/docs/articles/basic/07-vue3', category: '基础知识', title: 'Vue 3 Composition API' },
  { path: '/docs/articles/basic/08-react16', category: '基础知识', title: 'React开发实践' },
  { path: '/docs/articles/basic/09-react18', category: '基础知识', title: 'React 18新特性' },
  { path: '/docs/articles/basic/10-nodejs', category: '基础知识', title: 'Node.js服务端开发' },
  { path: '/docs/articles/basic/11-Sass', category: '基础知识', title: 'Sass预处理器' },

  // 博客相关
  { path: '/docs/articles/blog/01-vitepress', category: '博客相关', title: 'VitePress建站教程' },
  { path: '/docs/articles/blog/02-markdown', category: '博客相关', title: 'Markdown写作指南' },

  // 浏览器
  { path: '/docs/articles/browser/01-basic', category: '浏览器', title: '浏览器基础原理' },
  { path: '/docs/articles/browser/02-render', category: '浏览器', title: '浏览器渲染机制' },
  { path: '/docs/articles/browser/03-eventloop', category: '浏览器', title: 'JavaScript事件循环' },

  // 工程化
  { path: '/docs/articles/engineering/01-Webpack', category: '工程化', title: 'Webpack打包工具' },
  { path: '/docs/articles/engineering/02-Vite', category: '工程化', title: 'Vite构建工具' },
  { path: '/docs/articles/engineering/03-ESBuild', category: '工程化', title: 'ESBuild极速构建' },
  { path: '/docs/articles/engineering/04-Rollup', category: '工程化', title: 'Rollup模块打包' },

  // 跨端框架
  { path: '/docs/articles/frame/01-Uniapp', category: '跨端框架', title: 'UniApp跨端开发' },
  { path: '/docs/articles/frame/02-Flutter', category: '跨端框架', title: 'Flutter移动开发' },
  { path: '/docs/articles/frame/03-ReactNative', category: '跨端框架', title: 'React Native开发' },
  { path: '/docs/articles/frame/04-HarmonyOS', category: '跨端框架', title: 'HarmonyOS应用开发' },
  { path: '/docs/articles/frame/05-Electron', category: '跨端框架', title: 'Electron桌面应用' },

  // 网络协议
  { path: '/docs/articles/network/01-http', category: '网络协议', title: 'HTTP协议详解' },
  { path: '/docs/articles/network/02-FileTransfer', category: '网络协议', title: '文件传输协议' },
  { path: '/docs/articles/network/03-WebSocket', category: '网络协议', title: 'WebSocket实时通信' },

  // 服务端
  { path: '/docs/articles/server/01-NodeJs', category: '服务端', title: 'Node.js服务端开发' },
  { path: '/docs/articles/server/02-Express', category: '服务端', title: 'Express框架使用' },
  { path: '/docs/articles/server/03-NestJs', category: '服务端', title: 'NestJS企业级开发' },

  // 开发工具
  { path: '/docs/articles/tools/01-Git', category: '开发工具', title: 'Git版本控制' },
  { path: '/docs/articles/tools/02-Markdown', category: '开发工具', title: 'Markdown语法' },
  { path: '/docs/articles/tools/03-IDE', category: '开发工具', title: 'IDE开发环境' },

  // 关于
  { path: '/docs/articles/about/links', category: '关于', title: '友情链接' },
  { path: '/docs/articles/about/me', category: '关于', title: '关于我' }
]

// 生成文章数据
export function generateArticleData() {
  const articles = []
  
  ARTICLE_PATHS.forEach((article, index) => {
    const articleData = {
      title: article.title,
      excerpt: generateExcerpt(article.category, article.title),
      category: article.category,
      date: generateDate(index),
      tags: generateTags(article.category, article.title),
      readingTime: Math.floor(Math.random() * 30) + 10, // 10-40分钟
      wordCount: Math.floor(Math.random() * 5000) + 2000, // 2000-7000字
      path: article.path,
      featured: Math.random() > 0.8, // 20%概率推荐
      draft: false
    }
    
    articles.push(articleData)
    blogDataManager.addArticle(articleData)
  })
  
  return articles
}

// 生成文章摘要
function generateExcerpt(category, title) {
  const excerpts = {
    '基础知识': '深入理解前端核心技术，从基础语法到高级特性，系统学习现代Web开发必备技能。',
    '博客相关': '分享博客搭建、内容创作、SEO优化等经验，帮助开发者建立个人技术品牌。',
    '浏览器': '探索浏览器工作原理，理解渲染机制、事件循环等底层原理，提升前端性能优化能力。',
    '工程化': '掌握现代前端工程化工具链，从构建工具到部署流程，打造高效的开发工作流。',
    '跨端框架': '学习跨平台开发技术，一套代码多端运行，提高开发效率和用户体验。',
    '网络协议': '深入理解网络通信原理，掌握HTTP、WebSocket等协议，构建高性能的网络应用。',
    '服务端': '学习服务端开发技术，从Node.js到企业级框架，构建完整的全栈应用。',
    '开发工具': '掌握开发必备工具，提高开发效率，优化工作流程，提升代码质量。',
    '关于': '个人介绍、联系方式、友情链接等信息。'
  }
  
  return excerpts[category] || '这是一篇关于' + title + '的技术文章，包含了详细的理论知识和实践案例。'
}

// 生成日期（模拟不同时间发布）
function generateDate(index) {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 365) + index * 2 // 模拟不同时间发布
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  return date.toISOString().split('T')[0]
}

// 生成标签
function generateTags(category, title) {
  const tagMap = {
    '基础知识': ['前端基础', 'Web开发', '编程'],
    '博客相关': ['博客', '写作', 'SEO', 'VitePress'],
    '浏览器': ['浏览器', '性能优化', '渲染'],
    '工程化': ['构建工具', '工程化', '自动化'],
    '跨端框架': ['跨端', '移动开发', '桌面应用'],
    '网络协议': ['网络', '协议', '通信'],
    '服务端': ['后端', '服务端', 'API'],
    '开发工具': ['工具', '效率', '开发环境'],
    '关于': ['个人', '介绍', '联系']
  }
  
  const baseTags = tagMap[category] || ['技术', '学习']
  
  // 根据标题添加特定标签
  if (title.includes('Vue')) baseTags.push('Vue')
  if (title.includes('React')) baseTags.push('React')
  if (title.includes('JavaScript')) baseTags.push('JavaScript')
  if (title.includes('CSS')) baseTags.push('CSS')
  if (title.includes('HTML')) baseTags.push('HTML')
  if (title.includes('Node')) baseTags.push('Node.js')
  if (title.includes('TypeScript')) baseTags.push('TypeScript')
  
  return baseTags.slice(0, 4) // 最多4个标签
}

// 获取所有文章数据
export function getAllArticles() {
  return blogDataManager.getAllArticles()
}

// 按分类获取文章
export function getArticlesByCategory(category) {
  return blogDataManager.getArticlesByCategory(category)
}

// 搜索文章
export function searchArticles(keyword) {
  return blogDataManager.searchArticles(keyword)
}

// 获取推荐文章
export function getFeaturedArticles() {
  return blogDataManager.getFeaturedArticles()
}

// 获取最新文章
export function getLatestArticles(limit = 10) {
  return blogDataManager.getLatestArticles(limit)
}
