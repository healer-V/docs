<template>
  <div class="links-page">
    <!-- Header -->
    <header class="links-header">
      <div class="hdr-orb hdr-orb--1"></div>
      <div class="hdr-orb hdr-orb--2"></div>
      <div class="hdr-inner">
        <span class="hdr-tag">FRIENDS</span>
        <h1 class="hdr-title">友情链接</h1>
        <p class="hdr-desc">与志同道合的朋友们分享精彩内容</p>
      </div>
    </header>

    <!-- Sections -->
    <div class="links-sections">
      <section v-for="(item, index) of linksData" :key="index" class="link-section">
        <div class="sec-header">
          <svg v-if="index === 0" class="sec-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <svg v-else class="sec-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          <h2 class="sec-title">{{ item.title }}</h2>
          <span class="sec-count">{{ item.list.length }}</span>
          <span class="sec-line"></span>
        </div>
        <p class="sec-desc">{{ item.desc }}</p>
        <div class="links-grid">
          <LinkSite v-for="link in item.list" :key="link.link" :data="link" />
        </div>
      </section>
    </div>

    <!-- Apply -->
    <section class="apply-box">
      <div class="apply-glow"></div>
      <div class="apply-inner">
        <div class="apply-text">
          <span class="apply-badge">APPLY</span>
          <h2 class="apply-title">申请友链</h2>
          <p class="apply-desc">欢迎志同道合的朋友申请友链，一起分享更多精彩内容</p>
        </div>
        <div class="apply-format">
          <div class="fmt-row"><span class="fmt-key">网站名称</span><span class="fmt-val">您的网站名称</span></div>
          <div class="fmt-row"><span class="fmt-key">网站链接</span><span class="fmt-val">https://your-website.com</span></div>
          <div class="fmt-row"><span class="fmt-key">网站描述</span><span class="fmt-val">您的网站简介</span></div>
          <div class="fmt-row"><span class="fmt-key">头像链接</span><span class="fmt-val">https://your-avatar.com/avatar.png</span></div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang='ts'>
import { useData } from 'vitepress'
import LinkSite from './LinkSite.vue'

const { frontmatter: fm } = useData()
const linksData = fm.value.links
</script>

<style scoped>
.links-page {
  max-width: 1060px;
  margin: 0 auto;
  padding: 0 1.5rem 5rem;
}

/* ── Header ── */
.links-header {
  position: relative;
  text-align: center;
  padding: 2.6rem 0 2.5rem;
  overflow: hidden;
}

.hdr-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(60px);
}
.hdr-orb--1 {
  width: 280px; height: 280px;
  top: -60px; left: 10%;
  background: rgba(16, 185, 129, 0.07);
}
.hdr-orb--2 {
  width: 200px; height: 200px;
  bottom: -30px; right: 15%;
  background: rgba(139, 92, 246, 0.04);
}

.hdr-inner { position: relative; }

.hdr-tag {
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

.hdr-title {
  font-family: 'Outfit', sans-serif;
  font-size: 2.2rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  margin: 0 0 0.4rem;
  background: linear-gradient(135deg, var(--vp-c-text-1) 40%, var(--accent, #10b981));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 2.6rem;
}

.hdr-desc {
  font-size: 0.92rem;
  color: var(--vp-c-text-2);
  margin: 0;
}

/* ── Section ── */
.link-section { margin-bottom: 2.5rem; }

.sec-header {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.5rem;
}

.sec-icon { color: var(--accent, #10b981); flex-shrink: 0; }

.sec-title {
  font-family: 'Outfit', sans-serif;
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
  margin: 0 0 1.25rem;
  line-height: 1.6;
}

/* ── Grid ── */
.links-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

/* ── Apply ── */
.apply-box {
  margin-top: 1.5rem;
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

.apply-glow {
  position: absolute;
  top: -50%;
  right: -15%;
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%);
  pointer-events: none;
}

.apply-inner {
  position: relative;
  z-index: 1;
  padding: 2rem 2rem;
}

.apply-badge {
  display: inline-block;
  font-size: 0.58rem;
  letter-spacing: 0.2em;
  color: var(--accent, #10b981);
  font-weight: 700;
  margin-bottom: 0.4rem;
  padding: 2px 10px;
  background: var(--accent-soft);
  border-radius: 4px;
}

.apply-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 0.4rem;
  color: var(--vp-c-text-1);
}

.apply-desc {
  font-size: 0.84rem;
  color: var(--vp-c-text-2);
  margin: 0 0 1.25rem;
  line-height: 1.6;
}

.apply-format {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.fmt-row {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  font-size: 0.82rem;
  font-family: var(--vp-font-family-mono);
}

.fmt-key {
  color: var(--accent, #10b981);
  font-weight: 600;
  flex-shrink: 0;
  min-width: 56px;
}

.fmt-key::after {
  content: ':';
  color: var(--vp-c-text-3);
  margin-left: 2px;
}

.fmt-val { color: var(--vp-c-text-2); }

/* ── Responsive ── */
@media (max-width: 860px) {
  .links-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 520px) {
  .links-page { padding: 0 1rem 3rem; }
  .links-header { padding: 3rem 0 1.5rem; }
  .hdr-title { font-size: 1.6rem; }
  .links-grid { grid-template-columns: 1fr; }
  .apply-inner { padding: 1.25rem; }
  .fmt-row { flex-direction: column; gap: 0.1rem; }
  .fmt-key::after { content: ''; }
}
</style>
