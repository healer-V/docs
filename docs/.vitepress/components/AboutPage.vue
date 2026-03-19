<template>
  <div class="about-page">
    <!-- Header -->
    <header class="about-header">
      <div class="ab-orb ab-orb--1"></div>
      <div class="ab-orb ab-orb--2"></div>
      <div class="ab-inner">
        <span class="ab-tag">ABOUT</span>
        <h1 class="ab-title">学习文档</h1>
        <p class="ab-desc">精选优质学习资源，助力技术成长</p>
      </div>
    </header>

    <!-- Sections -->
    <div class="about-sections">
      <section v-for="(section, idx) in sections" :key="idx" class="ab-section">
        <div class="sec-head">
          <component :is="section.iconComponent" class="sec-svg" />
          <h2 class="sec-title">{{ section.title }}</h2>
          <span class="sec-count">{{ section.items.length }}</span>
          <span class="sec-line"></span>
        </div>
        <p class="sec-desc">{{ section.desc }}</p>
        <div class="sec-grid">
          <a
            v-for="item in section.items"
            :key="item.link"
            :href="item.link"
            target="_blank"
            rel="noopener noreferrer"
            class="res-card"
          >
            <div class="res-icon">
              <span class="res-emoji">{{ item.icon }}</span>
            </div>
            <div class="res-info">
              <span class="res-name">{{ item.name }}</span>
              <span class="res-desc">{{ item.desc }}</span>
            </div>
            <svg class="res-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
          </a>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { h } from 'vue'

const BookIcon = {
  render() {
    return h('svg', {
      width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none',
      stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }, [
      h('path', { d: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z' }),
      h('path', { d: 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' })
    ])
  }
}

const GlobeIcon = {
  render() {
    return h('svg', {
      width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none',
      stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }, [
      h('circle', { cx: 12, cy: 12, r: 10 }),
      h('path', { d: 'M2 12h20' }),
      h('path', { d: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' })
    ])
  }
}

const sections = [
  {
    title: '知识文档',
    desc: '系统化的知识体系，从基础到进阶',
    iconComponent: BookIcon,
    items: [
      { icon: 'H', name: '小鹤', desc: '大厂面经、必备修养', link: 'https://geekdaxue.co/books/qingyubailou@gygiq6' },
      { icon: 'M', name: '面试指南', desc: '系统进阶知识体系', link: 'https://interview.poetries.top/' },
      { icon: 'E', name: 'ExplainThis', desc: '前端工程化详解', link: 'https://www.explainthis.io/zh-hans' },
      { icon: 'V', name: 'Vue源码剖析', desc: 'Vue2 源码深度解析', link: 'https://vue-js.com/learn-vue/' },
      { icon: '3', name: 'Vue3 源码解析', desc: 'Vue3 核心源码分析', link: 'https://wangzhenhao.github.io/vue3-analysis/' },
      { icon: 'S', name: '前端知识分享', desc: '服务端渲染原理详解', link: 'https://github.com/yacan8/blog/blob/master/posts/%E6%9C%8D%E5%8A%A1%E7%AB%AF%E6%B8%B2%E6%9F%93%E5%8E%9F%E7%90%86.md' },
    ]
  },
  {
    title: '博客系统',
    desc: '优秀的个人博客和主题参考',
    iconComponent: GlobeIcon,
    items: [
      { icon: 'Z', name: '粥里有糖', desc: 'VitePress 主题定制', link: 'https://sugarat.top/' },
      { icon: 'D', name: 'DK酱', desc: '个人技术博客', link: 'https://cccdk.github.io/blog/' },
      { icon: 'O', name: 'onedayxyy', desc: 'Linux 运维知识', link: 'https://onedayxyy.cn/' },
    ]
  }
]
</script>

<style scoped>
.about-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1.5rem 5rem;
}

/* ── Header ── */
.about-header {
  position: relative;
  text-align: center;
  padding: 4.5rem 0 2.5rem;
  overflow: hidden;
}

.ab-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(60px);
}
.ab-orb--1 { width: 260px; height: 260px; top: -60px; left: 5%; background: rgba(16, 185, 129, 0.07); }
.ab-orb--2 { width: 200px; height: 200px; bottom: -40px; right: 10%; background: rgba(59, 130, 246, 0.04); }

.ab-inner { position: relative; }

.ab-tag {
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

.ab-title {
  font-family: 'Sora', 'Noto Sans SC', sans-serif;
  font-size: 2.2rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  margin: 0 0 0.4rem;
  background: linear-gradient(135deg, var(--vp-c-text-1) 30%, #06b6d4, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.ab-desc {
  font-size: 0.92rem;
  color: var(--vp-c-text-2);
  margin: 0;
}

/* ── Sections ── */
.about-sections { display: flex; flex-direction: column; gap: 2.5rem; }

.sec-head {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.4rem;
}

.sec-svg { color: var(--accent, #10b981); flex-shrink: 0; }

.sec-title {
  font-family: 'Sora', 'Noto Sans SC', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: var(--vp-c-text-1);
}

.sec-count {
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--accent, #10b981);
  background: var(--accent-soft, rgba(16, 185, 129, 0.1));
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
}

.sec-line {
  flex: 1;
  height: 1px;
  background: var(--vp-c-divider);
  margin-left: 0.4rem;
}

.sec-desc {
  font-size: 0.84rem;
  color: var(--vp-c-text-2);
  margin: 0 0 1rem;
  line-height: 1.6;
}

/* ── Grid ── */
.sec-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

/* ── Card ── */
.res-card {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  text-decoration: none !important;
  color: inherit;
  transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
  cursor: pointer;
}

.res-card:hover {
  transform: translateY(-2px);
  border-color: rgba(16, 185, 129, 0.25);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.dark .res-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
}

.res-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-soft, rgba(16, 185, 129, 0.08));
}

.res-emoji {
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'Sora', 'Noto Sans SC', sans-serif;
  color: var(--accent, #10b981);
}

.res-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.res-name {
  font-family: 'Sora', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  transition: color 0.2s;
}

.res-card:hover .res-name { color: var(--accent, #10b981); }

.res-desc {
  font-size: 0.72rem;
  color: var(--vp-c-text-3);
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.res-arrow {
  flex-shrink: 0;
  color: var(--vp-c-text-3);
  opacity: 0;
  transform: translate(-4px, 4px);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.res-card:hover .res-arrow {
  opacity: 1;
  transform: translate(0, 0);
  color: var(--accent, #10b981);
}

/* ── Responsive ── */
@media (max-width: 960px) {
  .about-page { max-width: 100%; }
  .sec-grid { gap: 8px; }
}

@media (max-width: 640px) {
  .about-page { padding: 0 1rem 3rem; }
  .about-header { padding: 2rem 0 1.5rem; }
  .ab-title { font-size: 1.6rem; }
  .ab-orb--1 { width: 160px; height: 160px; }
  .ab-orb--2 { width: 120px; height: 120px; }
  .sec-grid { grid-template-columns: 1fr; }
  .res-card { padding: 0.75rem 0.85rem; gap: 0.65rem; }
  .res-icon { width: 32px; height: 32px; }
  .res-emoji { font-size: 0.78rem; }
  .res-name { font-size: 0.82rem; }
  .res-desc { font-size: 0.68rem; }
  .res-arrow { display: none; }
  .res-card:hover { transform: none; }
  .sec-title { font-size: 1rem; }
  .sec-desc { font-size: 0.8rem; }
}

@media (max-width: 360px) {
  .about-page { padding: 0 0.75rem 2rem; }
  .ab-title { font-size: 1.3rem; }
  .res-card { padding: 0.65rem 0.75rem; }
}
</style>
