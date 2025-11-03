// 博客文章数据收集工具
export class BlogDataManager {
  constructor() {
    this.articles = []
    this.categories = new Map()
    this.articleMap = new Map()
  }

  // 文章数据结构
  createArticleData(filePath, frontmatter, content) {
    const pathParts = filePath.split('/')
    const category = pathParts[pathParts.length - 2] || 'uncategorized'
    const fileName = pathParts[pathParts.length - 1]
    
    const articleData = {
      title: frontmatter.title || this.extractTitleFromContent(content) || fileName.replace('.md', ''),
      description: frontmatter.description || this.extractDescriptionFromContent(content),
      date: frontmatter.date || new Date().toISOString(),
      category: frontmatter.category || this.formatCategoryName(category),
      tags: frontmatter.tags || [],
      author: frontmatter.author || 'xianling',
      path: filePath.replace('.md', ''),
      readingTime: this.calculateReadingTime(content),
      wordCount: this.calculateWordCount(content),
      excerpt: this.extractExcerpt(content),
      featured: frontmatter.featured || false,
      draft: frontmatter.draft || false,
      lastModified: frontmatter.lastModified || new Date().toISOString()
    }
    
    this.articleMap.set(articleData.path, articleData)
    return articleData
  }

  // 添加文章到集合
  addArticle(articleData) {
    // 检查是否已存在相同路径的文章
    const existingIndex = this.articles.findIndex(article => article.path === articleData.path)
    
    if (existingIndex !== -1) {
      // 如果已存在，更新文章数据
      this.articles[existingIndex] = articleData
    } else {
      // 如果不存在，添加新文章
      this.articles.push(articleData)
    }
    
    // 更新分类统计
    const category = articleData.category
    if (!this.categories.has(category)) {
      this.categories.set(category, [])
    }
    
    // 检查分类中是否已存在该文章
    const categoryArticles = this.categories.get(category)
    const existingCategoryIndex = categoryArticles.findIndex(article => article.path === articleData.path)
    
    if (existingCategoryIndex !== -1) {
      // 更新分类中的文章
      categoryArticles[existingCategoryIndex] = articleData
    } else {
      // 添加新文章到分类
      categoryArticles.push(articleData)
    }
  }

  // 获取所有文章
  getAllArticles() {
    return this.articles.sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  // 从内容中提取标题
  extractTitleFromContent(content) {
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.startsWith('# ')) {
        return line.replace('# ', '').trim()
      }
    }
    return null
  }

  // 从内容中提取描述
  extractDescriptionFromContent(content) {
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.trim() && !line.startsWith('#') && !line.startsWith(':::') && !line.startsWith('>')) {
        return line.trim().substring(0, 150) + '...'
      }
    }
    return '暂无描述'
  }

  // 提取文章摘要
  extractExcerpt(content) {
    const lines = content.split('\n')
    let excerpt = ''
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine && 
          !trimmedLine.startsWith('#') && 
          !trimmedLine.startsWith(':::') && 
          !trimmedLine.startsWith('>') &&
          !trimmedLine.startsWith('```') &&
          !trimmedLine.startsWith('---')) {
        excerpt += trimmedLine + ' '
        if (excerpt.length > 200) break
      }
    }
    
    return excerpt.trim().substring(0, 200) + (excerpt.length > 200 ? '...' : '')
  }

  // 计算阅读时间
  calculateReadingTime(content) {
    const wordsPerMinute = 200
    const wordCount = this.calculateWordCount(content)
    return Math.ceil(wordCount / wordsPerMinute)
  }

  // 计算字数
  calculateWordCount(content) {
    // 移除markdown语法
    const cleanContent = content
      .replace(/#{1,6}\s+/g, '') // 移除标题
      .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体
      .replace(/\*(.*?)\*/g, '$1') // 移除斜体
      .replace(/`(.*?)`/g, '$1') // 移除行内代码
      .replace(/```[\s\S]*?```/g, '') // 移除代码块
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 移除链接
      .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ') // 只保留中文、英文、数字和空格
      .trim()
    
    return cleanContent.length
  }

  // 格式化分类名称
  formatCategoryName(category) {
    const categoryMap = {
      'basic': '基础知识',
      'blog': '博客相关',
      'browser': '浏览器',
      'engineering': '工程化',
      'frame': '跨端框架',
      'network': '网络协议',
      'server': '服务端',
      'tools': '开发工具',
      'about': '关于'
    }
    return categoryMap[category] || category
  }

  // 获取所有分类
  getCategories() {
    return Array.from(this.categories.keys()).map(category => ({
      name: category,
      count: this.categories.get(category).length
    }))
  }

  // 按分类获取文章
  getArticlesByCategory(category) {
    return this.categories.get(category) || []
  }

  // 获取最新文章
  getLatestArticles(limit = 10) {
    return this.articles
      .filter(article => !article.draft)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit)
  }

  // 获取推荐文章
  getFeaturedArticles() {
    return this.articles
      .filter(article => article.featured && !article.draft)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  // 搜索文章
  searchArticles(keyword) {
    const lowerKeyword = keyword.toLowerCase()
    return this.articles.filter(article => 
      !article.draft && (
        article.title.toLowerCase().includes(lowerKeyword) ||
        article.excerpt.toLowerCase().includes(lowerKeyword) ||
        article.category.toLowerCase().includes(lowerKeyword) ||
        article.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
      )
    )
  }

  // 清除重复文章
  removeDuplicates() {
    const uniqueArticles = []
    const seenPaths = new Set()
    
    for (const article of this.articles) {
      if (!seenPaths.has(article.path)) {
        seenPaths.add(article.path)
        uniqueArticles.push(article)
      }
    }
    
    this.articles = uniqueArticles
    
    // 重新构建分类统计
    this.categories.clear()
    for (const article of this.articles) {
      const category = article.category
      if (!this.categories.has(category)) {
        this.categories.set(category, [])
      }
      this.categories.get(category).push(article)
    }
  }

  // 获取文章数量
  getArticleCount() {
    return this.articles.length
  }
}

// 创建单例实例
export const blogDataManager = new BlogDataManager()
