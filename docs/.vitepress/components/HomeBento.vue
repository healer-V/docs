<template>
  <div class="bento-section" ref="sectionRef">

    <!-- ── Stats banner with animated counters ── -->
    <div class="stats-bar" ref="statsRef">
      <div class="stat-item" v-for="(stat, i) in stats" :key="stat.label">
        <span class="stat-num">{{ animatedValues[i] || stat.value }}</span>
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
        :style="{ '--card-accent': item.color, '--card-accent-soft': item.colorSoft, '--card-delay': i * 80 + 'ms' }"
        target="_blank"
        rel="noopener"
        @mousemove="onMouseMove($event, i)"
        @mouseleave="onMouseLeave(i)"
        :ref="el => cardEls[i] = el"
      >
        <!-- Glow border effect -->
        <div class="card-glow-border"></div>
        <!-- Mouse glow -->
        <div class="card-glow" :ref="el => glowRefs[i] = el"></div>

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
const statsRef = ref(null)
const animatedValues = reactive({})
let observer = null
let statsObserver = null

const animateCounter = (index, target, suffix = '') => {
  const num = parseInt(target)
  if (isNaN(num)) {
    animatedValues[index] = target
    return
  }
  let current = 0
  const step = Math.ceil(num / 30)
  const timer = setInterval(() => {
    current += step
    if (current >= num) {
      current = num
      clearInterval(timer)
    }
    animatedValues[index] = current + suffix
  }, 40)
}

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
    { threshold: 0.1 }
  )
  Object.values(cardEls).forEach((el) => {
    if (el) observer.observe(el)
  })

  statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          stats.forEach((stat, i) => {
            animateCounter(i, stat.target, stat.suffix)
          })
          statsObserver.disconnect()
        }
      })
    },
    { threshold: 0.5 }
  )
  if (statsRef.value) statsObserver.observe(statsRef.value)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  if (statsObserver) statsObserver.disconnect()
})

const onMouseMove = (e, i) => {
  const el = glowRefs[i]
  if (!el) return
  const rect = e.currentTarget.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  el.style.opacity = '1'
  el.style.background = `radial-gradient(350px circle at ${x}px ${y}px, var(--card-accent-soft), transparent 60%)`
}

const onMouseLeave = (i) => {
  const el = glowRefs[i]
  if (!el) return
  el.style.opacity = '0'
}

const stats = [
  { value: '7+', target: '7', suffix: '+', label: '技术方向' },
  { value: '30+', target: '30', suffix: '+', label: '知识专题' },
  { value: '200+', target: '200', suffix: '+', label: '篇幅文章' },
  { value: '持续', target: '持续', suffix: '', label: '更新维护' },
]

const cards = [
  {
    title: '前端官 · Vue3面试题',
    tag: 'Vue 3',
    desc: '系统整理的 Vue3 面试题，覆盖响应式原理、Composition API、性能优化等核心考点',
    link: 'https://vue3js.cn/interview/',
    size: 'span-2',
    color: '#10b981',
    colorSoft: 'rgba(16, 185, 129, 0.10)',
    icon: `<svg viewBox="0 0 32 32" width="28" height="28"><path d="M2 4l14 24L30 4h-5.5L16 18.5 7.5 4z" fill="#10b981"/><path d="M7.5 4L16 18.5 24.5 4h-5L16 10.5 12.5 4z" fill="#059669"/></svg>`
  },
  {
    title: '小满 · React Docs',
    tag: 'React',
    desc: '深度解读 React 文档，适合进阶学习',
    link: 'https://message163.github.io/react-docs/react/components/base.html',
    size: 'span-1',
    color: '#38bdf8',
    colorSoft: 'rgba(56, 189, 248, 0.10)',
    icon: `<svg viewBox="0 0 32 32" width="28" height="28"><circle cx="16" cy="16" r="3" fill="#38bdf8"/><ellipse cx="16" cy="16" rx="14" ry="5.5" fill="none" stroke="#38bdf8" stroke-width="1.5"/><ellipse cx="16" cy="16" rx="14" ry="5.5" fill="none" stroke="#38bdf8" stroke-width="1.5" transform="rotate(60 16 16)"/><ellipse cx="16" cy="16" rx="14" ry="5.5" fill="none" stroke="#38bdf8" stroke-width="1.5" transform="rotate(120 16 16)"/></svg>`
  },
  {
    title: 'GitHub · 前端知识笔记',
    tag: 'HTML / CSS / JS',
    desc: 'realgeoffrey 整理的前端知识体系',
    link: 'https://github.com/realgeoffrey/knowledge',
    size: 'span-1',
    color: '#a78bfa',
    colorSoft: 'rgba(167, 139, 250, 0.10)',
    icon: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#a78bfa" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`
  },
  {
    title: '阮一峰 · ES6 标准入门',
    tag: 'ES6+',
    desc: '最权威的中文 ES6 教程，持续更新维护',
    link: 'https://es6.ruanyifeng.com/',
    size: 'span-1',
    color: '#fbbf24',
    colorSoft: 'rgba(251, 191, 36, 0.10)',
    icon: `<svg viewBox="0 0 32 32" width="28" height="28"><rect x="2" y="2" width="28" height="28" rx="6" fill="rgba(251,191,36,0.15)"/><text x="16" y="23" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="15" fill="#fbbf24">ES</text></svg>`
  },
  {
    title: '张鑫旭 · CSS世界',
    tag: 'CSS',
    desc: '深入 CSS 细节与原理，国内 CSS 领域最具深度的博客',
    link: 'https://www.zhangxinxu.com/wordpress/',
    size: 'span-1',
    color: '#f472b6',
    colorSoft: 'rgba(244, 114, 182, 0.10)',
    icon: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#f472b6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3h16l-1.5 15L12 21l-6.5-3z"/><path d="M8 8h8l-.5 5H12"/></svg>`
  },
  {
    title: '冴羽 · JavaScript深入系列',
    tag: 'JavaScript',
    desc: '深入理解 JS 原型链、作用域、闭包、异步等核心概念，从底层彻底搞懂 JavaScript',
    link: 'https://github.com/mqyqingfeng/Blog',
    size: 'span-2',
    color: '#22d3ee',
    colorSoft: 'rgba(34, 211, 238, 0.10)',
    icon: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#22d3ee" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="14" y1="4" x2="10" y2="20"/></svg>`
  },
  {
    title: '神三元 · 前端进阶',
    tag: '进阶',
    desc: '系统梳理前端进阶知识，原理分析深入浅出',
    link: 'https://sanyuan0704.top/blogs/',
    size: 'span-1',
    color: '#fb923c',
    colorSoft: 'rgba(251, 146, 60, 0.10)',
    icon: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#fb923c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`
  },
  {
    title: '掘金 · 前端专栏',
    tag: '社区',
    desc: '国内最活跃的前端技术社区，优质文章持续更新',
    link: 'https://juejin.cn/frontend',
    size: 'span-1',
    color: '#818cf8',
    colorSoft: 'rgba(129, 140, 248, 0.10)',
    icon: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#818cf8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9z"/><path d="M2 9h20"/><path d="M10 3l-4 6 6 13 6-13-4-6"/></svg>`
  },
]
</script>

<style scoped>
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
  gap: 2.5rem;
  padding: 1.5rem 0 2rem;
  margin-bottom: 0.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
}

.stat-item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: -1.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 30px;
  background: linear-gradient(to bottom, transparent, var(--vp-c-divider), transparent);
}

.stat-num {
  font-family: 'Sora', sans-serif;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  background: linear-gradient(135deg, #10b981, #06b6d4, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--vp-c-text-3);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.bento-header {
  text-align: center;
  margin-bottom: 2rem;
}

.bento-label {
  display: inline-block;
  font-size: 0.65rem;
  letter-spacing: 0.22em;
  color: var(--accent, #0ea5e9);
  font-weight: 600;
  padding: 5px 16px;
  background: var(--accent-soft);
  border-radius: 20px;
  border: 1px solid var(--glow-border, rgba(14, 165, 233, 0.15));
  margin-bottom: 1rem;
}

.bento-title {
  font-family: 'Sora', 'Noto Sans SC', sans-serif;
  font-size: 1.7rem;
  font-weight: 800;
  letter-spacing: -0.03em;
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
  background: var(--surface-card, var(--vp-c-bg));
  border: 1px solid var(--vp-c-divider);
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
              box-shadow 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
              border-color 0.3s ease;
  cursor: pointer;
  opacity: 0;
  transform: translateY(24px);
}

.bento-card.card-visible {
  opacity: 1;
  transform: translateY(0);
  transition-delay: var(--card-delay, 0ms);
}

.bento-card.span-2 { grid-column: span 2; }
.bento-card.span-1 { grid-column: span 1; }

/* Glow border on hover */
.card-glow-border {
  position: absolute;
  inset: -1px;
  border-radius: 17px;
  background: linear-gradient(135deg, var(--card-accent), transparent, var(--card-accent));
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: -1;
}

.bento-card:hover .card-glow-border {
  opacity: 0.5;
}

.card-glow {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
  z-index: 0;
}

.bento-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 24px 64px -16px rgba(0, 0, 0, 0.12);
  border-color: var(--card-accent);
}

.dark .bento-card:hover {
  box-shadow: 0 24px 64px -16px rgba(0, 0, 0, 0.4);
}

/* Top glow line */
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

.bento-card:hover::before { opacity: 1; }

.card-content {
  position: relative;
  z-index: 1;
  padding: 1.4rem 1.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-icon-wrap {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  background: var(--card-accent-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1),
              border-color 0.3s ease,
              box-shadow 0.3s ease;
}

.bento-card:hover .card-icon-wrap {
  transform: scale(1.1) rotate(-3deg);
  border-color: var(--card-accent);
  box-shadow: 0 4px 16px var(--card-accent-soft);
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.card-body { flex: 1; }

.card-tag {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--card-accent);
  margin-bottom: 0.5rem;
}

.card-title {
  font-family: 'Sora', 'Noto Sans SC', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0 0 0.4rem;
  color: var(--vp-c-text-1);
  line-height: 1.4;
  transition: color 0.2s;
}

.bento-card:hover .card-title { color: var(--card-accent); }
.bento-card.span-2 .card-title { font-size: 1.1rem; }

.card-desc {
  font-size: 0.82rem;
  font-weight: 400;
  color: var(--vp-c-text-2);
  margin: 0;
  line-height: 1.6;
}

.bento-card.span-2 .card-desc { max-width: 380px; }

.card-arrow {
  position: absolute;
  top: 1.4rem;
  right: 1.5rem;
  color: var(--vp-c-text-3);
  opacity: 0;
  transform: translate(-6px, 6px);
  transition: all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.bento-card:hover .card-arrow {
  opacity: 1;
  transform: translate(0, 0);
  color: var(--card-accent);
}

.dark .bento-card { background: var(--vp-c-bg-soft); }

/* ── Responsive ── */
@media (max-width: 960px) {
  .bento-grid { grid-template-columns: repeat(2, 1fr); }
  .bento-card.span-2 { grid-column: span 2; }
  .stats-bar { gap: 2rem; }
}

@media (max-width: 640px) {
  .bento-section { padding: 1.5rem 1rem 3rem; }
  .stats-bar { gap: 1rem; padding: 1.5rem 0 2rem; flex-wrap: wrap; justify-content: space-around; }
  .stat-num { font-size: 1.4rem; }
  .stat-item { min-width: 65px; }
  .stat-item:not(:last-child)::after { display: none; }
  .bento-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .bento-card.span-2 { grid-column: span 2; }
  .card-content { padding: 1.1rem; }
  .card-icon-wrap { width: 38px; height: 38px; border-radius: 10px; margin-bottom: 0.75rem; }
  .card-title { font-size: 0.9rem; }
  .bento-card.span-2 .card-title { font-size: 0.95rem; }
  .card-desc { font-size: 0.78rem; }
  .bento-card.span-2 .card-desc { max-width: none; }
  .bento-header { margin-bottom: 2rem; }
  .bento-title { font-size: 1.4rem; }
  .bento-desc { font-size: 0.85rem; }
  .card-arrow { display: none; }
  /* Disable hover transform on mobile */
  .bento-card:hover { transform: none; }
}

@media (max-width: 360px) {
  .bento-grid { grid-template-columns: 1fr; gap: 10px; }
  .bento-card.span-2 { grid-column: span 1; }
  .stats-bar { gap: 0.75rem; }
  .stat-num { font-size: 1.2rem; }
  .stat-label { font-size: 0.65rem; }
}
</style>
