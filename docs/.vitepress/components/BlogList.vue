<template>
  <div class="blog-container">

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
  
  

})
</script>

<style scoped>
.blog-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 3rem 2rem 5rem;
  min-height: 100vh;
}

/* 主要内容区域 */
.main-content {
  display: flex;
  gap: 2.5rem;
  align-items: flex-start;
}

/* 文章列表 */
.articles-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-bottom: 3rem;
}

.article-item {
  padding: 1.25rem 0;
  border-bottom: 1px solid var(--vp-c-divider);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  padding-left: 0;
}

.article-item::before {
  content: '';
  position: absolute;
  left: -1rem;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 2px;
  height: 60%;
  background: var(--accent, #e8a045);
  transition: transform 0.2s ease;
  transform-origin: center;
}

.article-item:hover::before { transform: translateY(-50%) scaleY(1); }
.article-item:hover { padding-left: 0.5rem; }
.article-item:last-child { border-bottom: none; }
.article-content { flex: 1; min-width: 0; }

.article-title {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 1.05rem;
  font-weight: 400;
  color: var(--vp-c-text-1);
  margin: 0 0 0.4rem 0;
  line-height: 1.4;
  letter-spacing: -0.01em;
  transition: color 0.2s ease;
}

.article-item:hover .article-title { color: var(--accent, #e8a045); }

.article-excerpt {
  color: var(--vp-c-text-2);
  line-height: 1.6;
  margin: 0 0 0.6rem 0;
  font-size: 0.82rem;
  font-weight: 300;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.72rem;
  color: var(--vp-c-text-3);
  flex-wrap: wrap;
}

.article-author { font-weight: 500; color: var(--vp-c-text-2); }

.article-category {
  background: var(--accent-soft, rgba(232,160,69,0.1));
  color: var(--accent, #e8a045);
  padding: 1px 6px;
  border-radius: 2px;
  font-size: 0.68rem;
  letter-spacing: 0.04em;
}

/* 侧边栏 */
.sidebar {
  flex-shrink: 0;
  width: 260px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  position: sticky;
  top: 5rem;
}

.user-info {
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 1.5rem;
  text-align: center;
}

.avatar { margin-bottom: 0.75rem; }

.avatar-placeholder {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 1px solid var(--vp-c-divider);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  overflow: hidden;
}

.avatar-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }

.username {
  font-family: 'DM Serif Display', serif;
  font-size: 1rem;
  font-weight: 400;
  color: var(--vp-c-text-1);
  margin: 0 0 1rem 0;
  letter-spacing: -0.01em;
}

.user-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; }
.stat-item { display: flex; flex-direction: column; align-items: center; }
.stat-number { font-size: 1.1rem; font-weight: 500; color: var(--accent, #e8a045); line-height: 1; }
.stat-label { font-size: 0.68rem; color: var(--vp-c-text-3); margin-top: 0.2rem; }

.featured-articles {
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 1.25rem;
}

.featured-title {
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  margin: 0 0 1rem 0;
}

.featured-list { display: flex; flex-direction: column; }

.featured-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--vp-c-divider);
  transition: all 0.2s ease;
}

.featured-item:last-child { border-bottom: none; }
.featured-item:hover .featured-article-title { color: var(--accent, #e8a045); }

.featured-number {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--vp-c-text-3);
  margin-top: 1px;
}

.featured-content { flex: 1; min-width: 0; }

.featured-article-title {
  font-size: 0.82rem;
  font-weight: 400;
  color: var(--vp-c-text-1);
  margin: 0 0 0.2rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s;
}

.featured-date { font-size: 0.68rem; color: var(--vp-c-text-3); }

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 3rem;
}

.page-btn {
  padding: 6px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 3px;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.82rem;
}

.page-btn:hover:not(:disabled) { border-color: var(--accent, #e8a045); color: var(--accent, #e8a045); }
.page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.page-numbers { display: flex; gap: 3px; }

.page-number {
  width: 30px;
  height: 30px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 3px;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
}

.page-number:hover { border-color: var(--accent, #e8a045); color: var(--accent, #e8a045); }
.page-number.active { background: var(--accent, #e8a045); color: #fff; border-color: var(--accent, #e8a045); }

/* 空状态 */
.empty-state { text-align: center; padding: 4rem 2rem; color: var(--vp-c-text-3); }
.empty-icon { font-size: 2rem; margin-bottom: 1rem; opacity: 0.4; }
.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: var(--vp-c-text-2);
  font-family: 'DM Serif Display', serif;
  font-size: 1.1rem;
  font-weight: 400;
}
.empty-state p { margin: 0; font-size: 0.85rem; font-weight: 300; }

/* 响应式 */
@media (max-width: 1024px) {
  .main-content { flex-direction: column; gap: 2rem; }
  .sidebar { width: 100%; position: static; flex-direction: row; }
  .user-info { flex: 1; }
  .featured-articles { flex: 1; }
}

@media (max-width: 768px) {
  .blog-container { padding: 1.5rem 1rem 3rem; }
  .sidebar { flex-direction: column; }
  .article-item:hover { padding-left: 0; }
  .article-item::before { display: none; }
  .pagination { flex-wrap: wrap; gap: 0.4rem; }
  .page-numbers { order: -1; width: 100%; justify-content: center; margin-bottom: 0.5rem; }
}

@media (max-width: 480px) {
  .article-meta { flex-direction: column; align-items: flex-start; gap: 0.25rem; }
  .blog-container { padding: 1rem 0.75rem 2.5rem; }
  .article-title { font-size: 0.95rem; }
  .user-stats { grid-template-columns: 1fr 1fr 1fr; gap: 0.25rem; }
  .stat-number { font-size: 0.95rem; }
  .pagination { gap: 0.25rem; }
  .page-btn { padding: 5px 10px; font-size: 0.75rem; }
  .page-number { width: 26px; height: 26px; font-size: 0.75rem; }
}
</style>
