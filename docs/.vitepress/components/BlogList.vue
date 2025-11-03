<template>
  <div class="blog-container">

    <!-- 搜索和筛选 -->
    <div class="blog-filters">
      <div class="search-container">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索文章..."
          class="search-input"
          @input="handleSearch"
        />
        <div v-if="searchKeyword" class="search-results-info">
          找到 {{ filteredArticles.length }} 篇相关文章
        </div>
      </div>
      
      <div class="category-filters">
        <button
          v-for="category in categories"
          :key="category.name"
          :class="['category-btn', { active: selectedCategory === category.name }]"
          @click="filterByCategory(category.name)"
        >
          {{ category.name }}
          <span class="count">({{ category.count }})</span>
        </button>
      </div>
    </div>

    <!-- 文章统计 -->
    <div class="blog-stats">
      <span class="stats-text">
        共找到 <strong>{{ filteredArticles.length }}</strong> 篇文章
        <span v-if="selectedCategory !== 'all'">，分类：{{ selectedCategory }}</span>
        <span v-if="searchKeyword">，关键词：{{ searchKeyword }}</span>
      </span>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 文章列表 -->
      <div class="articles-list">
        <article
          v-for="article in paginatedArticles"
          :key="article.path"
          class="article-item"
          @click="navigateToArticle(article.path)"
        >
          <div class="article-content">
            <h3 class="article-title">{{ article.title }}</h3>
            <p class="article-excerpt">{{ article.excerpt }}</p>
            <div class="article-meta">
              <span class="article-author">xianling</span>
              <span class="article-date">{{ formatDate(article.date) }}</span>
              <span v-if="article.category" class="article-category">{{ article.category }}</span>
            </div>
          </div>
        </article>
      </div>

      <!-- 右侧侧边栏 -->
      <div class="sidebar">
        <!-- 用户信息 -->
        <div class="user-info">
          <div class="avatar">
            <div class="avatar-placeholder">
              <img src="/avatar.png" alt="头像" class="avatar-img">
            </div>
          </div>
          <h3 class="username">xianling</h3>
          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-number">{{ articles.length }}</span>
              <span class="stat-label">博客文章</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">+0</span>
              <span class="stat-label">本月更新</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">+0</span>
              <span class="stat-label">本周更新</span>
            </div>
          </div>
        </div>

        <!-- 精选文章 -->
        <div class="featured-articles">
          <h4 class="featured-title">🔥 精选文章</h4>
          <div class="featured-list">
            <div
              v-for="(article, index) in featuredArticles"
              :key="article.path"
              class="featured-item"
              @click="navigateToArticle(article.path)"
            >
              <span class="featured-number">{{ index + 1 }}</span>
              <div class="featured-content">
                <h5 class="featured-article-title">{{ article.title }}</h5>
                <span class="featured-date">{{ formatDate(article.date) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Busuanzi访问统计 -->
        <BusuanziStats />

        <!-- GitHub评论系统 -->
        <div class="comments-section">
          <h4 class="comments-title">💬 评论交流</h4>
          <div class="comments-content">
            <p class="comments-description">
              欢迎在GitHub上参与讨论，分享您的想法和建议！
            </p>
            <div class="comments-actions">
              <a 
                href="https://github.com/your-username/your-repo/discussions" 
                target="_blank" 
                rel="noopener noreferrer"
                class="github-discussions-btn"
              >
                <svg class="github-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub Discussions
              </a>
              <a 
                href="https://github.com/your-username/your-repo/issues" 
                target="_blank" 
                rel="noopener noreferrer"
                class="github-issues-btn"
              >
                <svg class="github-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub Issues
              </a>
            </div>
            <div class="comments-stats">
              <div class="comment-stat-item">
                <span class="comment-stat-number">{{ discussionCount }}</span>
                <span class="comment-stat-label">讨论</span>
              </div>
              <div class="comment-stat-item">
                <span class="comment-stat-number">{{ issueCount }}</span>
                <span class="comment-stat-label">问题</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination">
      <button
        :disabled="currentPage === 1"
        class="page-btn prev"
        @click="goToPage(currentPage - 1)"
      >
        上一页
      </button>
      
      <div class="page-numbers">
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="['page-number', { active: page === currentPage }]"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
      </div>
      
      <button
        :disabled="currentPage === totalPages"
        class="page-btn next"
        @click="goToPage(currentPage + 1)"
      >
        下一页
      </button>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredArticles.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <h3>暂无文章</h3>
      <p>没有找到符合条件的文章，请尝试其他搜索条件</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vitepress'
import { generateArticleData, getAllArticles } from '../utils/articleCollector.js'
import { blogDataManager } from '../utils/blogData.js'
import BusuanziStats from './BusuanziStats.vue'

const router = useRouter()

// 响应式数据
const articles = ref([])
const searchKeyword = ref('')
const selectedCategory = ref('all')
const currentPage = ref(1)
const articlesPerPage = 12

// GitHub评论系统数据
const discussionCount = ref(0)
const issueCount = ref(0)

// 计算属性
const categories = computed(() => {
  const categoryMap = new Map()
  articles.value.forEach(article => {
    const count = categoryMap.get(article.category) || 0
    categoryMap.set(article.category, count + 1)
  })
  
  const result = Array.from(categoryMap.entries()).map(([name, count]) => ({
    name,
    count
  }))
  
  return [
    { name: 'all', count: articles.value.length },
    ...result
  ]
})

const filteredArticles = computed(() => {
  let filtered = articles.value

  // 按分类筛选
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(article => article.category === selectedCategory.value)
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase().trim()
    if (keyword) {
      filtered = filtered.filter(article => {
        // 标题搜索（权重最高）
        const titleMatch = article.title.toLowerCase().includes(keyword)
        
        // 摘要搜索
        const excerptMatch = article.excerpt.toLowerCase().includes(keyword)
        
        // 分类搜索
        const categoryMatch = article.category.toLowerCase().includes(keyword)
        
        // 标签搜索
        const tagMatch = article.tags.some(tag => tag.toLowerCase().includes(keyword))
        
        // 作者搜索
        const authorMatch = (article.author || 'xianling').toLowerCase().includes(keyword)
        
        return titleMatch || excerptMatch || categoryMatch || tagMatch || authorMatch
      })
      
      // 对搜索结果进行排序，更相关的结果排在前面
      filtered = filtered.sort((a, b) => {
        const keyword = searchKeyword.value.toLowerCase().trim()
        
        // 计算相关性分数
        const getRelevanceScore = (article) => {
          let score = 0
          const title = article.title.toLowerCase()
          const excerpt = article.excerpt.toLowerCase()
          const category = article.category.toLowerCase()
          const tags = article.tags.map(tag => tag.toLowerCase())
          
          // 标题完全匹配得分最高
          if (title === keyword) score += 100
          // 标题开头匹配
          else if (title.startsWith(keyword)) score += 80
          // 标题包含关键词
          else if (title.includes(keyword)) score += 60
          
          // 分类匹配
          if (category.includes(keyword)) score += 40
          
          // 标签匹配
          if (tags.some(tag => tag.includes(keyword))) score += 30
          
          // 摘要匹配
          if (excerpt.includes(keyword)) score += 20
          
          return score
        }
        
        return getRelevanceScore(b) - getRelevanceScore(a)
      })
    }
  }

  return filtered
})

const totalPages = computed(() => {
  return Math.ceil(filteredArticles.value.length / articlesPerPage)
})

const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * articlesPerPage
  const end = start + articlesPerPage
  return filteredArticles.value.slice(start, end)
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
})

// 精选文章
const featuredArticles = computed(() => {
  return articles.value.slice(0, 6)
})



// 初始化GitHub数据
const initGitHubData = () => {
  // 模拟GitHub API数据，实际项目中可以调用GitHub API
  discussionCount.value = Math.floor(Math.random() * 20) + 5
  issueCount.value = Math.floor(Math.random() * 15) + 3
}

// 方法
const handleSearch = () => {
  currentPage.value = 1
}

const filterByCategory = (category) => {
  selectedCategory.value = category
  currentPage.value = 1
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const navigateToArticle = (path) => {
  // 确保路径格式正确
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  router.go(cleanPath)
}

// 生命周期
onMounted(() => {
  // 检查是否已经生成过文章数据
  const existingArticles = getAllArticles()
  if (existingArticles.length === 0) {
    // 只在没有文章数据时才生成
    generateArticleData()
  } else {
    // 如果已有数据，清除可能的重复
    blogDataManager.removeDuplicates()
  }
  articles.value = getAllArticles()
  
  
  // 初始化GitHub数据
  initGitHubData()

})
</script>

<style scoped>
.blog-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  background: var(--vp-c-bg);
}

/* 页面头部 */
.blog-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.blog-title {
  font-size: 2rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.blog-subtitle {
  color: var(--vp-c-text-2);
  font-size: 1rem;
  margin: 0;
  line-height: 1.4;
}

/* 搜索和筛选 */
.blog-filters {
  margin-bottom: 1.5rem;
}

.search-container {
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  font-size: 13px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
}

.search-input::placeholder {
  color: var(--vp-c-text-3);
}

.search-results-info {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  text-align: center;
}

.category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.category-btn {
  padding: 4px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.category-btn.active {
  background: var(--vp-c-brand-1);
  color: white;
  border-color: var(--vp-c-brand-1);
}

.count {
  margin-left: 2px;
  opacity: 0.8;
  font-size: 10px;
}

/* 文章统计 */
.blog-stats {
  margin-bottom: 1.5rem;
  padding: 0.8rem;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
  border-left: 2px solid var(--vp-c-brand-1);
}

.stats-text {
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 500;
}

/* 主要内容区域 */
.main-content {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

/* 文章列表 */
.articles-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 3rem;
}

.article-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 0;
  padding: 1rem;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
  cursor: pointer;
  border-radius: .5rem;
  transition: all 0.2s ease;
  position: relative;
}

.article-item:hover {
  /* background: var(--vp-c-bg-soft); */
  border-radius: .5rem;
  padding: 1rem;
  transform: translateY(-2px);
  box-shadow: 0 0 16px 0 rgba(0, 0, 0, 0.2);
}

.article-item:last-child {
  border-bottom: none;
}

.article-content {
  flex: 1;
  min-width: 0;
}

.article-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
  transition: color 0.2s ease;
}

.article-item:hover .article-title {
  color: var(--vp-c-brand-1);
}

.article-excerpt {
  color: var(--vp-c-text-2);
  line-height: 1.5;
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  flex-wrap: wrap;
}

.article-author {
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.article-category {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  padding: 1px 4px;
  border-radius: 2px;
  font-weight: 500;
  font-size: 0.7rem;
}

.article-thumbnail {
  flex-shrink: 0;
  width: 60px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.article-item:hover .thumbnail-placeholder {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
}

.thumbnail-icon {
  font-size: 1.2rem;
  color: var(--vp-c-text-3);
  transition: color 0.2s ease;
}

.article-item:hover .thumbnail-icon {
  color: var(--vp-c-brand-1);
}

/* 侧边栏 */
.sidebar {
  flex-shrink: 0;
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 用户信息 */
.user-info {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
}

.avatar {
  margin-bottom: 1rem;
}

.avatar-placeholder {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--vp-c-bg-soft);
  border: 2px solid var(--vp-c-divider);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin: 0 auto;
}
.avatar-img{
  width: 100%;
  height: 100%;
  border-radius: 50%;
}
.username {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 1rem 0;
}

.user-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-number {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  line-height: 1;
  word-break: break-all;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  margin-top: 0.25rem;
}

/* 精选文章 */
.featured-articles {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 1.5rem;
}

.featured-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.featured-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.featured-item {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0.5rem;
  border-radius: 4px;
}

.featured-item:hover {
  background: var(--vp-c-bg-soft);
}

.featured-number {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
  line-height: 1;
}

.featured-content {
  flex: 1;
  min-width: 0;
}

.featured-article-title {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.featured-date {
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
}

/* GitHub评论系统 */
.comments-section {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 1.5rem;
}

.comments-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.comments-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comments-description {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  margin: 0;
  line-height: 1.5;
}

.comments-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.github-discussions-btn,
.github-issues-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.github-discussions-btn:hover,
.github-issues-btn:hover {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  transform: translateY(-1px);
}

.github-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.comments-stats {
  display: flex;
  justify-content: space-around;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.comment-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.comment-stat-number {
  font-size: 1rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  line-height: 1;
}

.comment-stat-label {
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
  margin-top: 0.25rem;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 3rem;
  padding: 1rem;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.page-btn:hover:not(:disabled) {
  background: var(--vp-c-brand-1);
  color: white;
  border-color: var(--vp-c-brand-1);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-number {
  width: 32px;
  height: 32px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
}

.page-number:hover {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.page-number.active {
  background: var(--vp-c-brand-1);
  color: white;
  border-color: var(--vp-c-brand-1);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: var(--vp-c-text-2);
  font-size: 1.2rem;
  font-weight: 600;
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .sidebar {
    width: 100%;
    flex-direction: row;
    gap: 1rem;
  }
  
  .user-info {
    flex: 1;
  }
  
  .featured-articles {
    flex: 1;
  }
  
  .comments-section {
    flex: 1;
  }
}

@media (max-width: 768px) {
  .blog-container {
    padding: 1rem;
  }
  
  .blog-title {
    font-size: 1.8rem;
  }
  
  .blog-subtitle {
    font-size: 0.9rem;
  }
  
  .search-input {
    font-size: 14px;
  }
  
  .main-content {
    gap: 1rem;
  }
  
  .sidebar {
    flex-direction: column;
    gap: 1rem;
  }
  
  .article-item {
    flex-direction: column;
    gap: 0.8rem;
    padding: 0.8rem 0;
  }
  
  .article-item:hover {
    padding: 0.8rem;
    margin: 0 -0.8rem;
  }
  
  .article-thumbnail {
    width: 100%;
    height: 60px;
    align-self: center;
  }
  
  .article-title {
    font-size: 1rem;
  }
  
  .category-filters {
    gap: 4px;
  }
  
  .category-btn {
    padding: 3px 6px;
    font-size: 11px;
  }
  
  .pagination {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .page-numbers {
    order: -1;
    width: 100%;
    justify-content: center;
    margin-bottom: 1rem;
  }
  
  .page-btn {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
  
  .page-number {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .blog-container {
    padding: 1rem;
  }
  
  .blog-title {
    font-size: 1.6rem;
  }
  
  .blog-subtitle {
    font-size: 0.85rem;
  }
  
  .article-item {
    padding: 0.6rem;
  }
  
  .article-item:hover {
    padding: 0.6rem;
    margin: 0 -0.6rem;
  }
  
  .article-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
  }
  
  .category-filters {
    gap: 3px;
  }
  
  .category-btn {
    padding: 2px 4px;
    font-size: 10px;
  }
  
  .pagination {
    padding: 0.5rem;
  }
}
</style>
