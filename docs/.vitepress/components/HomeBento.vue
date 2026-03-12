<template>
  <div class="bento-section" ref="sectionRef">

    <!-- ── Stats banner ── -->
    <div class="stats-bar">
      <div class="stat-item" v-for="stat in stats" :key="stat.label">
        <span class="stat-num">{{ stat.value }}</span>
        <span class="stat-label">{{ stat.label }}</span>
      </div>
    </div>

    <!-- Section title -->
    <div class="bento-header">
      <span class="bento-label">RESOURCES</span>
      <h2 class="bento-title">精选学习资源</h2>
      <p class="bento-desc">来自社区最优质的前端学习资料，助你系统化进阶</p>
    </div>

    <!-- Bento Grid -->
    <div class="bento-grid">
      <a
        v-for="(item, i) in cards"
        :key="item.title"
        :href="item.link"
        :class="['bento-card', item.size, { 'card-visible': visibleCards[i] }]"
        :style="{ '--card-accent': item.color, '--card-accent-soft': item.colorSoft, '--card-delay': i * 60 + 'ms' }"
        target="_blank"
        rel="noopener"
        @mousemove="onMouseMove($event, i)"
        @mouseleave="onMouseLeave(i)"
        :ref="el => cardEls[i] = el"
      >
        <!-- Mouse glow -->
        <div
          class="card-glow"
          :ref="el => glowRefs[i] = el"
        ></div>

        <!-- Content -->
        <div class="card-content">
          <div class="card-icon-wrap">
            <div class="card-icon" v-html="item.icon"></div>
          </div>
          <div class="card-body">
            <div class="card-tag">{{ item.tag }}</div>
            <h3 class="card-title">{{ item.title }}</h3>
            <p class="card-desc">{{ item.desc }}</p>
          </div>
          <div class="card-arrow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 17L17 7"/>
              <path d="M7 7h10v10"/>
            </svg>
          </div>
        </div>
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'

const glowRefs = reactive({})
const cardEls = reactive({})
const visibleCards = reactive({})
const sectionRef = ref(null)
let observer = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = Object.values(cardEls).indexOf(entry.target)
          if (idx !== -1) visibleCards[idx] = true
        }
      })
    },
    { threshold: 0.15 }
  )
  Object.values(cardEls).forEach((el) => {
    if (el) observer.observe(el)
  })
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})

const onMouseMove = (e, i) => {
  const el = glowRefs[i]
  if (!el) return
  const rect = e.currentTarget.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  el.style.opacity = '1'
  el.style.background = `radial-gradient(320px circle at ${x}px ${y}px, var(--card-accent-soft), transparent 60%)`
}

const onMouseLeave = (i) => {
  const el = glowRefs[i]
  if (!el) return
  el.style.opacity = '0'
}

const stats = [
  { value: '7+', label: '技术方向' },
  { value: '30+', label: '知识专题' },
  { value: '200+', label: '篇幅文章' },
  { value: '持续', label: '更新维护' },
]

const cards = [
  {
    title: '前端官 · Vue3面试题',
    tag: 'Vue 3',
    desc: '系统整理的 Vue3 面试题，覆盖响应式原理、Composition API、性能优化等核心考点',
    link: 'https://vue3js.cn/interview/',
    size: 'span-2',
    color: '#10b981',
    colorSoft: 'rgba(16, 185, 129, 0.12)',
    icon: `<svg viewBox="0 0 32 32" width="28" height="28"><path d="M2 4l14 24L30 4h-5.5L16 18.5 7.5 4z" fill="#10b981"/><path d="M7.5 4L16 18.5 24.5 4h-5L16 10.5 12.5 4z" fill="#059669"/></svg>`
  },
  {
    title: '小满 · React Docs',
    tag: 'React',
    desc: '深度解读 React 文档，适合进阶学习',
    link: 'https://message163.github.io/react-docs/react/components/base.html',
    size: 'span-1',
    color: '#3b82f6',
    colorSoft: 'rgba(59, 130, 246, 0.12)',
    icon: `<svg viewBox="0 0 32 32" width="28" height="28"><circle cx="16" cy="16" r="3" fill="#3b82f6"/><ellipse cx="16" cy="16" rx="14" ry="5.5" fill="none" stroke="#3b82f6" stroke-width="1.5"/><ellipse cx="16" cy="16" rx="14" ry="5.5" fill="none" stroke="#3b82f6" stroke-width="1.5" transform="rotate(60 16 16)"/><ellipse cx="16" cy="16" rx="14" ry="5.5" fill="none" stroke="#3b82f6" stroke-width="1.5" transform="rotate(120 16 16)"/></svg>`
  },
  {
    title: 'GitHub · 前端知识笔记',
    tag: 'HTML / CSS / JS',
    desc: 'realgeoffrey 整理的前端知识体系',
    link: 'https://github.com/realgeoffrey/knowledge',
    size: 'span-1',
    color: '#8b5cf6',
    colorSoft: 'rgba(139, 92, 246, 0.12)',
    icon: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#8b5cf6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`
  },
  {
    title: '阮一峰 · ES6 标准入门',
    tag: 'ES6+',
    desc: '最权威的中文 ES6 教程，持续更新维护',
    link: 'https://es6.ruanyifeng.com/',
    size: 'span-1',
    color: '#f59e0b',
    colorSoft: 'rgba(245, 158, 11, 0.12)',
    icon: `<svg viewBox="0 0 32 32" width="28" height="28"><rect x="2" y="2" width="28" height="28" rx="6" fill="rgba(245,158,11,0.15)"/><text x="16" y="23" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="15" fill="#f59e0b">ES</text></svg>`
  },
  {
    title: '张鑫旭 · CSS世界',
    tag: 'CSS',
    desc: '深入 CSS 细节与原理，国内 CSS 领域最具深度的博客',
    link: 'https://www.zhangxinxu.com/wordpress/',
    size: 'span-1',
    color: '#ec4899',
    colorSoft: 'rgba(236, 72, 153, 0.12)',
    icon: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#ec4899" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3h16l-1.5 15L12 21l-6.5-3z"/><path d="M8 8h8l-.5 5H12"/></svg>`
  },
  {
    title: '冴羽 · JavaScript深入系列',
    tag: 'JavaScript',
    desc: '深入理解 JS 原型链、作用域、闭包、异步等核心概念，从底层彻底搞懂 JavaScript',
    link: 'https://github.com/mqyqingfeng/Blog',
    size: 'span-2',
    color: '#06b6d4',
    colorSoft: 'rgba(6, 182, 212, 0.12)',
    icon: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#06b6d4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="14" y1="4" x2="10" y2="20"/></svg>`
  },
  {
    title: '神三元 · 前端进阶',
    tag: '进阶',
    desc: '系统梳理前端进阶知识，原理分析深入浅出',
    link: 'https://sanyuan0704.top/blogs/',
    size: 'span-1',
    color: '#f97316',
    colorSoft: 'rgba(249, 115, 22, 0.12)',
    icon: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#f97316" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`
  },
  {
    title: '掘金 · 前端专栏',
    tag: '社区',
    desc: '国内最活跃的前端技术社区，优质文章持续更新',
    link: 'https://juejin.cn/frontend',
    size: 'span-1',
    color: '#6366f1',
    colorSoft: 'rgba(99, 102, 241, 0.12)',
    icon: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9z"/><path d="M2 9h20"/><path d="M10 3l-4 6 6 13 6-13-4-6"/></svg>`
  },
]
</script>

<style scoped>
/* ── Section ── */
.bento-section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
  position: relative;
  z-index: 1;
}

/* ── Stats bar ── */
.stats-bar {
  display: flex;
  justify-content: center;
  gap: 3rem;
  padding: 2rem 0 3rem;
  margin-bottom: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-num {
  font-family: 'Outfit', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--vp-c-text-1);
  background: linear-gradient(135deg, var(--accent), var(--vp-c-brand-3));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--vp-c-text-3);
  letter-spacing: 0.04em;
}

.bento-header {
  text-align: center;
  margin-bottom: 3rem;
}

.bento-label {
  display: inline-block;
  font-size: 0.65rem;
  letter-spacing: 0.22em;
  color: var(--accent, #10b981);
  font-weight: 600;
  padding: 4px 14px;
  background: var(--accent-soft, rgba(16, 185, 129, 0.08));
  border-radius: 20px;
  border: 1px solid rgba(16, 185, 129, 0.12);
  margin-bottom: 1rem;
}

.bento-title {
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 0.5rem;
  color: var(--vp-c-text-1);
}

.bento-desc {
  font-size: 0.92rem;
  color: var(--vp-c-text-2);
  margin: 0;
  line-height: 1.6;
}

/* ── Grid ── */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

/* ── Card ── */
.bento-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  text-decoration: none !important;
  color: inherit;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
              box-shadow 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
              border-color 0.3s ease,
              opacity 0.5s ease;
  cursor: pointer;

  /* Entrance animation — starts hidden */
  opacity: 0;
  transform: translateY(16px);
}

.bento-card.card-visible {
  opacity: 1;
  transform: translateY(0);
  transition-delay: var(--card-delay, 0ms);
}

.bento-card.span-2 {
  grid-column: span 2;
}

.bento-card.span-1 {
  grid-column: span 1;
}

/* Glow follow */
.card-glow {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
  z-index: 0;
}

/* Hover */
.bento-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 60px -12px rgba(0, 0, 0, 0.08);
  border-color: var(--card-accent, var(--accent));
}

.dark .bento-card:hover {
  box-shadow: 0 20px 60px -12px rgba(0, 0, 0, 0.35);
}

/* Top gradient line */
.bento-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--card-accent), transparent);
  opacity: 0;
  transition: opacity 0.35s ease;
  z-index: 2;
}

.bento-card:hover::before {
  opacity: 1;
}

/* Content */
.card-content {
  position: relative;
  z-index: 1;
  padding: 1.4rem 1.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--card-accent-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.bento-card:hover .card-icon-wrap {
  transform: scale(1.08);
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.card-body {
  flex: 1;
}

.card-tag {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--card-accent);
  margin-bottom: 0.5rem;
}

.card-title {
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0 0 0.4rem;
  color: var(--vp-c-text-1);
  line-height: 1.4;
}

.bento-card.span-2 .card-title {
  font-size: 1.1rem;
}

.card-desc {
  font-size: 0.82rem;
  font-weight: 400;
  color: var(--vp-c-text-2);
  margin: 0;
  line-height: 1.6;
}

.bento-card.span-2 .card-desc {
  max-width: 380px;
}

/* Arrow */
.card-arrow {
  position: absolute;
  top: 1.4rem;
  right: 1.5rem;
  color: var(--vp-c-text-3);
  opacity: 0;
  transform: translate(-4px, 4px);
  transition: all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.bento-card:hover .card-arrow {
  opacity: 1;
  transform: translate(0, 0);
  color: var(--card-accent);
}

/* ── Dark specific ── */
.dark .bento-card {
  background: var(--vp-c-bg-soft);
}

/* ── Responsive ── */
@media (max-width: 860px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .bento-card.span-2 {
    grid-column: span 2;
  }
}

@media (max-width: 520px) {
  .bento-section {
    padding: 1.5rem 1rem 3rem;
  }
  .stats-bar {
    gap: 1.5rem;
    padding: 1.5rem 0 2rem;
    flex-wrap: wrap;
  }
  .stat-num {
    font-size: 1.3rem;
  }
  .bento-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .bento-card.span-2 {
    grid-column: span 1;
  }
  .card-content {
    padding: 1.2rem;
  }
  .bento-header {
    margin-bottom: 2rem;
  }
}
</style>
