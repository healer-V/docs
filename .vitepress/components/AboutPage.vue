<template>
  <div class="res-lib">
    <header class="rl-header">
      <span class="rl-eyebrow">RESOURCES</span>
      <h1 class="rl-title">学习资源</h1>
      <p class="rl-desc">收集的外部教程、源码解读、题库和专栏，按用途分类。</p>
      <p class="rl-meta">{{ resourceTotal }} 个资源 · {{ resourceSections.length }} 个分类 · 带“常用”标记的汇总在最上方</p>
      <nav class="rl-jump" aria-label="资源分类">
        <a href="#featured" class="rl-chip">
          <span class="rl-chip-icon" v-html="resourceIcons.star"></span>
          常用
          <span class="rl-chip-count">{{ featuredResources.length }}</span>
        </a>
        <a v-for="section in resourceSections" :key="section.id" :href="`#${section.id}`" class="rl-chip">
          <span class="rl-chip-icon" v-html="resourceIcons[section.icon]"></span>
          {{ section.title }}
          <span class="rl-chip-count">{{ section.items.length }}</span>
        </a>
      </nav>
    </header>

    <section class="rl-section">
      <div class="rl-sec-head">
        <span class="rl-sec-icon" v-html="resourceIcons.star"></span>
        <h2 id="featured" class="rl-sec-title" tabindex="-1">常用</h2>
        <span class="rl-sec-desc">高频回看的入口</span>
      </div>

      <div class="rl-featured">
        <a
          v-for="item in featuredResources"
          :key="item.link"
          :href="item.link"
          class="rl-fcard"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span class="rl-ficon" v-html="resourceIcons[item.icon]"></span>
          <span class="rl-fbody">
            <span class="rl-name">{{ item.name }}</span>
            <span class="rl-text">{{ item.desc }}</span>
            <span class="rl-fmeta">{{ item.section }}</span>
          </span>
          <span class="rl-ext rl-fext" v-html="resourceIcons.external"></span>
        </a>
      </div>
    </section>

    <section v-for="section in resourceSections" :key="section.id" class="rl-section">
      <div class="rl-sec-head">
        <span class="rl-sec-icon" v-html="resourceIcons[section.icon]"></span>
        <h2 :id="section.id" class="rl-sec-title" tabindex="-1">{{ section.title }}</h2>
        <span class="rl-sec-desc">{{ section.desc }}</span>
      </div>

      <div class="rl-grid">
        <a
          v-for="item in section.items"
          :key="item.link"
          :href="item.link"
          target="_blank"
          rel="noopener noreferrer"
          class="rl-item"
        >
          <span class="rl-item-top">
            <span class="rl-name">{{ item.name }}</span>
            <span class="rl-ext" v-html="resourceIcons.external"></span>
          </span>
          <span class="rl-text">{{ item.desc }}</span>
          <span class="rl-tags">
            <span class="rl-tag">{{ item.tag }}</span>
            <span v-if="item.featured" class="rl-tag rl-tag--featured">常用</span>
          </span>
        </a>
      </div>
    </section>
  </div>
</template>

<script setup>
import { featuredResources, resourceIcons, resourceSections, resourceTotal } from './learningResources.js'
</script>

<style scoped>
.res-lib {
  max-width: 920px;
  margin: 0 auto;
  padding: 0 0 4rem;
}

.rl-header {
  padding: 2.5rem 0 2rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.rl-eyebrow {
  font-family: var(--vp-font-family-mono);
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  color: var(--vp-c-brand-1);
}

.res-lib .rl-title {
  margin: 0.5rem 0 0 !important;
  padding: 0 !important;
  border: 0 !important;
  font-size: 2rem !important;
  font-weight: 700 !important;
  line-height: 1.3 !important;
  letter-spacing: -0.02em;
  color: var(--vp-c-text-1) !important;
  background: none !important;
  -webkit-text-fill-color: currentColor !important;
}

.rl-desc {
  margin: 0.6rem 0 0;
  font-size: 0.95rem;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}

.rl-meta {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}

.rl-jump {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 1.5rem;
}

.res-lib .rl-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--vp-c-text-2) !important;
  text-decoration: none !important;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.res-lib .rl-chip:hover {
  color: var(--vp-c-brand-1) !important;
  border-color: var(--vp-c-brand-1);
}

.rl-chip-icon,
.rl-sec-icon,
.rl-ext { display: inline-flex; }

.rl-chip-icon :deep(svg) { width: 14px; height: 14px; }

.rl-chip-count {
  font-family: var(--vp-font-family-mono);
  font-size: 0.72rem;
  color: var(--vp-c-text-3);
}

.rl-section {
  padding-top: 2.25rem;
}

.rl-sec-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 0.65rem;
  margin-bottom: 1rem;
}

.rl-sec-icon { color: var(--vp-c-brand-1); }

.res-lib .rl-sec-title {
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  font-size: 1.15rem !important;
  font-weight: 650 !important;
  line-height: 1.4;
  letter-spacing: 0;
  color: var(--vp-c-text-1);
  scroll-margin-top: calc(var(--vp-nav-height) + 24px);
}

.res-lib .rl-sec-title:hover::before { display: none !important; }

.res-lib .rl-sec-title :deep(.header-anchor) { display: none; }

.rl-sec-desc {
  font-size: 0.82rem;
  color: var(--vp-c-text-3);
}

.rl-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.rl-featured {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.res-lib .rl-fcard {
  position: relative;
  display: flex;
  gap: 0.8rem;
  padding: 0.95rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  color: inherit !important;
  text-decoration: none !important;
  transition: border-color 0.2s ease;
}

.res-lib .rl-fcard:hover { border-color: var(--vp-c-brand-1); }

.rl-ficon {
  display: grid;
  place-items: center;
  flex: none;
  width: 34px;
  height: 34px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  color: var(--vp-c-text-2);
  transition: color 0.2s ease, border-color 0.2s ease;
}

.rl-fcard:hover .rl-ficon {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.rl-fbody {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  padding-right: 1rem;
}

.rl-fmeta {
  margin-top: 0.35rem;
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
}

.rl-fext {
  position: absolute;
  top: 0.95rem;
  right: 0.9rem;
}

.rl-fcard:hover .rl-ext,
.rl-fcard:hover .rl-name { color: var(--vp-c-brand-1); }

.res-lib .rl-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  color: inherit !important;
  text-decoration: none !important;
  transition: border-color 0.2s ease;
}

.res-lib .rl-item:hover { border-color: var(--vp-c-brand-1); }

.rl-item-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.rl-name {
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.45;
  color: var(--vp-c-text-1);
}

.rl-ext {
  flex: none;
  margin-top: 0.15rem;
  color: var(--vp-c-text-3);
  transition: color 0.2s ease;
}

.rl-ext :deep(svg) { width: 14px; height: 14px; }

.rl-item:hover .rl-ext,
.rl-item:hover .rl-name { color: var(--vp-c-brand-1); }

.rl-text {
  font-size: 0.8rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.rl-tags {
  display: flex;
  gap: 6px;
  margin-top: 0.3rem;
}

.rl-tag {
  padding: 0 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  font-size: 0.7rem;
  line-height: 1.6rem;
  color: var(--vp-c-text-3);
}

.rl-tag--featured {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

@media (max-width: 960px) {
  .rl-featured { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 640px) {
  .rl-header { padding-top: 1.5rem; }
  .res-lib .rl-title { font-size: 1.6rem !important; }
  .rl-grid, .rl-featured { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .rl-chip, .rl-item, .rl-ext, .rl-fcard, .rl-ficon { transition: none; }
}
</style>
