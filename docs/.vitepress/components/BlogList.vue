<template>
  <div class="blog-page">
    <!-- Hero -->
    <header class="blog-header">
      <div class="header-mesh"></div>
      <div class="header-orb header-orb--1"></div>
      <div class="header-orb header-orb--2"></div>
      <div class="header-inner">
        <span class="header-tag">BLOG</span>
        <h1 class="header-title">文章</h1>
        <p class="header-desc">{{ articles.length }} 篇文章，持续更新中</p>
      </div>
    </header>

    <!-- Search -->
    <div class="search-bar">
      <div class="search-input-wrap">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          v-model="searchKeyword"
          type="text"
          class="search-input"
          placeholder="搜索文章标题、标签、分类..."
          @input="currentPage = 1"
        />
        <button v-if="searchKeyword" class="search-clear" @click="searchKeyword = ''; currentPage = 1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
      <span v-if="searchKeyword" class="search-result-count">
        找到 {{ filteredArticles.length }} 篇文章
      </span>
    </div>

    <!-- Body -->
    <div class="blog-body">
      <!-- Articles -->
      <main class="article-feed">
        <TransitionGroup name="card-list" tag="div" class="article-list">
          <article
            v-for="(article, i) in paginatedArticles"
            :key="article.path"
            class="card"
            :style="{ '--card-i': i }"
            @click="navigateToArticle(article.path)"
          >
            <div class="card-glow"></div>
            <div class="card-body">
              <div class="card-top">
                <span v-if="article.category" class="card-cat">{{ article.category }}</span>
                <time class="card-date">{{ formatDate(article.date) }}</time>
                <span class="card-reading-time" v-if="article.excerpt">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  {{ estimateReadingTime(article) }} min
                </span>
              </div>
              <h2 class="card-title">{{ article.title }}</h2>
              <p class="card-excerpt">{{ article.excerpt }}</p>
              <div class="card-footer">
                <div class="card-tags" v-if="article.tags && article.tags.length">
                  <span class="card-tag" v-for="tag in article.tags.slice(0, 3)" :key="tag">{{ tag }}</span>
                </div>
                <span class="card-more">
                  阅读全文
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </span>
              </div>
            </div>
          </article>
        </TransitionGroup>

        <!-- Pagination -->
        <nav v-if="totalPages > 1" class="pager">
          <button :disabled="currentPage === 1" class="pager-btn" @click="goToPage(currentPage - 1)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button
            v-for="p in visiblePages"
            :key="p"
            :class="['pager-num', { active: p === currentPage, dots: p === '...' }]"
            :disabled="p === '...'"
            @click="p !== '...' && goToPage(p)"
          >{{ p }}</button>
          <button :disabled="currentPage === totalPages" class="pager-btn" @click="goToPage(currentPage + 1)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </nav>

        <!-- Empty -->
        <div v-if="filteredArticles.length === 0" class="empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15h6"/></svg>
          <p>暂无文章</p>
        </div>
      </main>

      <!-- Sidebar -->
      <aside class="sidebar">
        <!-- Profile -->
        <div class="sb-card sb-profile">
          <div class="profile-banner"></div>
          <div class="profile-main">
            <div class="profile-avatar">
              <img src="/avatar.png" alt="avatar" />
            </div>
            <h3 class="profile-name">xianling</h3>
            <p class="profile-bio">日拱一卒，功不唐捐</p>
            <div class="profile-stats">
              <div class="ps-item">
                <strong>{{ articles.length }}</strong>
                <span>文章</span>
              </div>
              <div class="ps-sep"></div>
              <div class="ps-item">
                <strong>7+</strong>
                <span>方向</span>
              </div>
              <div class="ps-sep"></div>
              <div class="ps-item">
                <strong>200+</strong>
                <span>篇幅</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Hot articles -->
        <div class="sb-card sb-hot">
          <h4 class="sb-heading">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
            热门文章
          </h4>
          <ol class="hot-list">
            <li
              v-for="(a, idx) in featuredArticles"
              :key="a.path"
              class="hot-item"
              @click="navigateToArticle(a.path)"
            >
              <span :class="['hot-rank', { accent: idx < 3 }]">{{ idx + 1 }}</span>
              <div class="hot-meta">
                <span class="hot-title">{{ a.title }}</span>
                <span class="hot-date">{{ formatDate(a.date) }}</span>
              </div>
            </li>
          </ol>
        </div>

        <!-- Stats -->
        <BusuanziStats />
      </aside>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vitepress'
import { data as allArticles } from '../utils/articles.data.mjs'
import BusuanziStats from './BusuanziStats.vue'

const router = useRouter()

const articles = ref(allArticles)
const searchKeyword = ref('')
const selectedCategory = ref('all')
const currentPage = ref(1)
const articlesPerPage = 12

const estimateReadingTime = (article) => {
  if (article.readingTime) return article.readingTime
  if (!article.excerpt) return 1
  return Math.max(1, Math.ceil(article.excerpt.length / 400))
}

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

  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(article => article.category === selectedCategory.value)
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase().trim()
    if (keyword) {
      filtered = filtered.filter(article => {
        const titleMatch = article.title.toLowerCase().includes(keyword)
        const excerptMatch = article.excerpt.toLowerCase().includes(keyword)
        const categoryMatch = article.category.toLowerCase().includes(keyword)
        const tagMatch = article.tags.some(tag => tag.toLowerCase().includes(keyword))
        const authorMatch = (article.author || 'xianling').toLowerCase().includes(keyword)
        return titleMatch || excerptMatch || categoryMatch || tagMatch || authorMatch
      })

      filtered = filtered.sort((a, b) => {
        const getRelevanceScore = (article) => {
          let score = 0
          const title = article.title.toLowerCase()
          const excerpt = article.excerpt.toLowerCase()
          const category = article.category.toLowerCase()
          const tags = article.tags.map(tag => tag.toLowerCase())

          if (title === keyword) score += 100
          else if (title.startsWith(keyword)) score += 80
          else if (title.includes(keyword)) score += 60
          if (category.includes(keyword)) score += 40
          if (tags.some(tag => tag.includes(keyword))) score += 30
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
    for (let i = 1; i <= total; i++) pages.push(i)
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

const featuredArticles = computed(() => {
  return articles.value.slice(0, 6)
})

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const navigateToArticle = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  router.go(cleanPath)
}

</script>

<style scoped>
/* ── Page ── */
.blog-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1rem 1.5rem 5rem;
}

/* ── Header ── */
.blog-header {
  position: relative;
  text-align: center;
  padding: 2.6rem 0 2.5rem;
  overflow: hidden;
}

/* Subtle mesh pattern */
.header-mesh {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 25% 50%, rgba(16, 185, 129, 0.04) 0%, transparent 50%),
    radial-gradient(circle at 75% 30%, rgba(6, 182, 212, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 50% 80%, rgba(139, 92, 246, 0.03) 0%, transparent 40%);
  pointer-events: none;
}

.header-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(60px);
}
.header-orb--1 {
  width: 320px; height: 320px;
  top: -80px; left: -60px;
  background: rgba(16, 185, 129, 0.08);
  animation: orbDrift 12s ease-in-out infinite alternate;
}
.header-orb--2 {
  width: 240px; height: 240px;
  bottom: -40px; right: -40px;
  background: rgba(59, 130, 246, 0.05);
  animation: orbDrift 15s ease-in-out infinite alternate-reverse;
}

@keyframes orbDrift {
  0% { transform: translate(0, 0); }
  100% { transform: translate(20px, -15px); }
}

.header-inner { position: relative; }

.header-tag {
  display: inline-block;
  font-size: 0.6rem;
  letter-spacing: 0.25em;
  font-weight: 700;
  color: var(--accent, #10b981);
  background: var(--accent-soft, rgba(16, 185, 129, 0.08));
  border: 1px solid rgba(16, 185, 129, 0.15);
  padding: 3px 14px;
  border-radius: 20px;
  margin-bottom: 0.75rem;
}

.header-title {
  font-family: 'Sora', 'Noto Sans SC', sans-serif;
  font-size: 2.4rem;
  line-height: 3.6rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  margin: 0 0 0.4rem;
  background: linear-gradient(135deg, var(--vp-c-text-1) 30%, #06b6d4, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-desc {
  font-size: 0.92rem;
  color: var(--vp-c-text-2);
  margin: 0;
}

/* ── Body layout ── */
.blog-body {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 2rem;
  align-items: start;
}

/* ── Article list ── */
.article-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Card list transition */
.card-list-enter-active {
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  transition-delay: calc(var(--card-i, 0) * 50ms);
}
.card-list-leave-active {
  transition: all 0.25s ease;
}
.card-list-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.card-list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* ── Article card ── */
.article-feed {
  display: flex;
  flex-direction: column;
}

.card {
  position: relative;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--vp-c-bg);
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.card:hover {
  border-color: rgba(16, 185, 129, 0.25);
  box-shadow:
    0 4px 16px rgba(16, 185, 129, 0.06),
    0 12px 32px rgba(0, 0, 0, 0.04);
  transform: translateY(-3px);
}

.dark .card:hover {
  box-shadow:
    0 4px 16px rgba(16, 185, 129, 0.04),
    0 12px 32px rgba(0, 0, 0, 0.2);
}

/* Aurora glow on hover — top edge */
.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #10b981, #06b6d4, #8b5cf6);
  opacity: 0;
  transition: opacity 0.35s;
}

.card:hover .card-glow {
  opacity: 1;
}

.card-body {
  padding: 1.15rem 1.35rem;
}

.card-top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
}

.card-cat {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--accent, #10b981);
  background: var(--accent-soft, rgba(16, 185, 129, 0.08));
  padding: 2px 8px;
  border-radius: 4px;
  transition: background 0.2s, color 0.2s;
}

.card:hover .card-cat {
  background: rgba(16, 185, 129, 0.12);
}

.card-date {
  font-size: 0.72rem;
  color: var(--vp-c-text-3);
}

.card-reading-time {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.68rem;
  color: var(--vp-c-text-3);
  margin-left: auto;
}

.card-title {
  font-family: 'Sora', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
  margin: 0 0 0.35rem;
  line-height: 1.45;
  transition: color 0.2s;
}

.card:hover .card-title { color: var(--accent, #10b981); }

.card-excerpt {
  font-size: 0.82rem;
  color: var(--vp-c-text-2);
  line-height: 1.7;
  margin: 0 0 0.7rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Footer: tags + read more */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.card-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  min-width: 0;
}

.card-tag {
  font-size: 0.62rem;
  font-weight: 500;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
  padding: 2px 7px;
  border-radius: 4px;
  white-space: nowrap;
  transition: color 0.2s, background 0.2s;
}

.card:hover .card-tag {
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-elv);
}

.card-more {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--vp-c-text-3);
  flex-shrink: 0;
  opacity: 0;
  transform: translateX(-8px);
  transition: opacity 0.25s, transform 0.25s, color 0.25s;
}

.card:hover .card-more {
  opacity: 1;
  transform: translateX(0);
  color: var(--accent, #10b981);
}

.card:hover .card-more svg {
  animation: arrowBounce 0.6s ease-in-out;
}

@keyframes arrowBounce {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(4px); }
}

/* ── Sidebar ── */
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: sticky;
  top: calc(var(--vp-nav-height, 64px) + 1.5rem);
}

.sb-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--vp-c-bg);
  transition: box-shadow 0.3s, border-color 0.3s;
  overflow: hidden;
}

.sb-card:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.04);
  border-color: rgba(16, 185, 129, 0.15);
}

.dark .sb-card:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
}

/* Profile — with banner */
.sb-profile { text-align: center; }

.profile-banner {
  height: 52px;
  background: linear-gradient(135deg,
    rgba(16, 185, 129, 0.1),
    rgba(6, 182, 212, 0.08),
    rgba(139, 92, 246, 0.06));
}

.dark .profile-banner {
  background: linear-gradient(135deg,
    rgba(16, 185, 129, 0.07),
    rgba(6, 182, 212, 0.05),
    rgba(139, 92, 246, 0.04));
}

.profile-main {
  padding: 0 1.25rem 1.25rem;
  margin-top: -28px;
}

.profile-avatar {
  width: 56px;
  height: 56px;
  margin: 0 auto 0.5rem;
  border-radius: 50%;
  padding: 2.5px;
  background: linear-gradient(135deg, #10b981, #06b6d4, #8b5cf6);
  transition: transform 0.3s ease;
}

.sb-profile:hover .profile-avatar {
  transform: scale(1.05) rotate(3deg);
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2.5px solid var(--vp-c-bg);
}

.profile-name {
  font-family: 'Sora', 'Noto Sans SC', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 0.15rem;
}

.profile-bio {
  font-size: 0.76rem;
  color: var(--vp-c-text-3);
  margin: 0 0 0.85rem;
}

.profile-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--vp-c-divider);
}

.ps-item { display: flex; flex-direction: column; align-items: center; }
.ps-item strong { font-size: 1.05rem; font-weight: 800; color: var(--accent, #10b981); line-height: 1.2; }
.ps-item span { font-size: 0.65rem; color: var(--vp-c-text-3); margin-top: 2px; }
.ps-sep { width: 1px; height: 20px; background: var(--vp-c-divider); }

/* Hot articles */
.sb-hot { padding: 1.25rem; }

.sb-heading {
  font-family: 'Sora', 'Noto Sans SC', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 0.6rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid var(--vp-c-divider);
  display: flex;
  align-items: center;
  gap: 6px;
}

.sb-heading svg { color: var(--accent, #10b981); }

.hot-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.hot-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.45rem 0;
  cursor: pointer;
  transition: background 0.15s;
  border-radius: 6px;
}

.hot-item:not(:last-child) {
  border-bottom: 1px solid var(--vp-c-divider);
}

.hot-item:hover .hot-title { color: var(--accent, #10b981); }

.hot-rank {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-3);
  margin-top: 2px;
}

.hot-rank.accent {
  background: var(--accent-soft, rgba(16, 185, 129, 0.1));
  color: var(--accent, #10b981);
}

.hot-meta { flex: 1; min-width: 0; }

.hot-title {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s;
}

.hot-date {
  font-size: 0.65rem;
  color: var(--vp-c-text-3);
}

/* ── Pagination ── */
.pager {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 2.5rem;
}

.pager-btn,
.pager-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.pager-btn { width: 34px; height: 34px; }
.pager-num { width: 32px; height: 32px; }

.pager-btn:hover:not(:disabled),
.pager-num:hover:not(:disabled):not(.dots) {
  border-color: var(--accent, #10b981);
  color: var(--accent, #10b981);
  transform: translateY(-1px);
}

.pager-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.pager-num.dots { border: none; background: none; cursor: default; }

.pager-num.active {
  background: var(--accent, #10b981);
  border-color: var(--accent, #10b981);
  color: #fff;
  box-shadow: 0 2px 8px var(--accent-glow);
}

/* ── Empty ── */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 2rem;
  color: var(--vp-c-text-3);
}
.empty svg { margin-bottom: 0.75rem; opacity: 0.3; }
.empty p { margin: 0; font-size: 0.88rem; }

/* ── Search bar ── */
.search-bar {
  margin-bottom: 1.5rem;
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.search-input-wrap {
  position: relative;
  width: 100%;
  max-width: 480px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--vp-c-text-3);
  pointer-events: none;
  transition: color 0.2s;
}

.search-input-wrap:focus-within .search-icon {
  color: var(--accent, #10b981);
}

.search-input {
  width: 100%;
  height: 42px;
  padding: 0 40px 0 40px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.88rem;
  font-family: 'Sora', 'Noto Sans SC', sans-serif;
  outline: none;
  transition: border-color 0.25s, box-shadow 0.25s;
}

.search-input::placeholder {
  color: var(--vp-c-text-3);
  font-size: 0.82rem;
}

.search-input:focus {
  border-color: var(--accent, #10b981);
  box-shadow: 0 0 0 3px var(--accent-soft, rgba(16, 185, 129, 0.1));
}

.search-clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-3);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.search-clear:hover {
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-1);
}

.search-result-count {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  letter-spacing: 0.02em;
}

/* ── Responsive ── */
@media (max-width: 960px) {
  .blog-body {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .sb-card { flex: 1; min-width: 200px; }
}

@media (max-width: 640px) {
  .blog-page { padding: 0 1rem 3rem; }
  .blog-header { padding: 2rem 0 1.5rem; }
  .header-title { font-size: 1.7rem; line-height: 1.2; }
  .header-orb--1 { width: 180px; height: 180px; top: -40px; left: -30px; }
  .header-orb--2 { width: 140px; height: 140px; }
  .sidebar { flex-direction: column; }
  .sb-card { min-width: 0; }
  .search-input-wrap { max-width: 100%; }
  .search-input { height: 38px; font-size: 0.82rem; border-radius: 10px; }
  .card-body { padding: 1rem; }
  .card-more { display: none; }
  .card-reading-time { display: none; }
  .card-title { font-size: 0.95rem; }
  .card-excerpt { font-size: 0.8rem; -webkit-line-clamp: 2; }
  .card:hover { transform: none; }
  .card-tags { display: none; }
  /* Profile */
  .profile-avatar { width: 50px; height: 50px; }
  .profile-name { font-size: 0.92rem; }
  /* Pagination */
  .pager { gap: 4px; }
  .pager-btn { width: 32px; height: 32px; }
  .pager-num { width: 28px; height: 28px; font-size: 0.75rem; }
}

@media (max-width: 360px) {
  .blog-page { padding: 0 0.75rem 2rem; }
  .header-title { font-size: 1.4rem; }
  .card-body { padding: 0.85rem; }
  .card-top { flex-wrap: wrap; gap: 0.3rem; }
  .card-title { font-size: 0.88rem; }
  .sb-card { padding: 1rem; }
}
</style>
