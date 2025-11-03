<template>
  <div class="links-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">我的友链</h1>
      <p class="page-subtitle">与志同道合的朋友们分享精彩内容</p>
    </div>

    <!-- 友链内容区域 -->
    <div class="links-content">
      <div class="link-section" v-for="(item, index) of linksData" :key="index">
        <!-- 章节标题 -->
        <div class="section-header">
          <h2 class="section-title">{{ item.title }}</h2>
          <div class="section-divider"></div>
        </div>
        
        <!-- 章节描述 -->
        <p class="section-description">{{ item.desc }}</p>
        
        <!-- 友链网格 -->
        <div class="links-grid" :class="getGridClass(item.title)">
          <LinkSite 
            v-for="link in item.list" 
            :key="link.link" 
            :data="link" 
            class="link-item"
          />
        </div>
      </div>
    </div>

    <!-- 申请友链区域 -->
    <div class="apply-section">
      <div class="apply-header">
        <h2 class="apply-title">申请友链</h2>
        <div class="section-divider"></div>
      </div>
      <p class="apply-description">欢迎志同道合的朋友申请友链，让我们一起分享更多精彩内容 💞</p>
      <div class="apply-card">
        <div class="apply-info">
          <p>请按照以下格式留言申请友链：</p>
          <div class="format-example">
            <code>
              网站名称：您的网站名称<br>
              网站链接：https://your-website.com<br>
              网站描述：您的网站简介<br>
              头像链接：https://your-avatar.com/avatar.png
            </code>
          </div>
        </div>
        <div class="comment-area">
          <Twikoo />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { useData } from 'vitepress'
import LinkSite from './LinkSite.vue'
// import Twikoo from '../WTwikoo/index.vue'

const { frontmatter: fm } = useData()
console.log('fm.value.links', fm.value.links)
const linksData = fm.value.links

// 根据章节标题返回不同的网格类名
const getGridClass = (title: string) => {
  if (title === '传送门') {
    return 'grid-3-cols'
  }
  return 'grid-4-cols'
}
</script>

<style scoped>
.links-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  min-height: 100vh;
}

/* 页面标题区域 */
.page-header {
  text-align: center;
  margin-bottom: 4rem;
  padding: 2rem 0;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, var(--vp-c-brand-1), var(--vp-c-brand-2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
  margin: 0;
  opacity: 0.8;
}

/* 友链内容区域 */
.links-content {
  margin-bottom: 4rem;
}

.link-section {
  margin-bottom: 4rem;
}

/* 章节标题 */
.section-header {
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 1rem 0;
  position: relative;
  display: inline-block;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, var(--vp-c-brand-1), var(--vp-c-brand-2));
  border-radius: 2px;
}

.section-divider {
  width: 100px;
  height: 1px;
  background: var(--vp-c-divider);
  margin: 1.5rem auto 0;
}

/* 章节描述 */
.section-description {
  text-align: center;
  font-size: 1rem;
  color: var(--vp-c-text-2);
  margin: 0 0 2.5rem 0;
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* 友链网格 */
.links-grid {
  display: grid;
  gap: 1.5rem;
  margin-top: 2rem;
}

.grid-4-cols {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.grid-3-cols {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.link-item {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.link-item:hover {
  transform: translateY(-4px);
}

/* 申请友链区域 */
.apply-section {
  background: var(--vp-c-bg-soft);
  border-radius: 16px;
  padding: 3rem 2rem;
  margin-top: 4rem;
  border: 1px solid var(--vp-c-divider);
}

.apply-header {
  text-align: center;
  margin-bottom: 2rem;
}

.apply-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 1rem 0;
  position: relative;
  display: inline-block;
}

.apply-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, var(--vp-c-brand-1), var(--vp-c-brand-2));
  border-radius: 2px;
}

.apply-description {
  text-align: center;
  font-size: 1rem;
  color: var(--vp-c-text-2);
  margin: 0 0 2rem 0;
  line-height: 1.6;
}

.apply-card {
  background: var(--vp-c-bg);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid var(--vp-c-divider);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.apply-info {
  margin-bottom: 2rem;
}

.apply-info p {
  margin: 0 0 1rem 0;
  color: var(--vp-c-text-1);
  font-weight: 500;
}

.format-example {
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  padding: 1rem;
  border-left: 4px solid var(--vp-c-brand-1);
}

.format-example code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--vp-c-text-1);
  background: none;
  padding: 0;
}

.comment-area {
  margin-top: 1.5rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .links-container {
    padding: 1rem 0.5rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .section-title,
  .apply-title {
    font-size: 1.5rem;
  }
  
  .grid-4-cols,
  .grid-3-cols {
    grid-template-columns: 1fr;
  }
  
  .apply-section {
    padding: 2rem 1rem;
  }
  
  .apply-card {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.8rem;
  }
  
  .section-title,
  .apply-title {
    font-size: 1.3rem;
  }
  
  .links-grid {
    gap: 1rem;
  }
}

/* 深色模式适配 */
.dark .apply-section {
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-divider);
}

.dark .apply-card {
  background: var(--vp-c-bg);
  border-color: var(--vp-c-divider);
}

.dark .format-example {
  background: var(--vp-c-bg-soft);
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.link-section {
  animation: fadeInUp 0.6s ease-out;
}

.link-section:nth-child(2) {
  animation-delay: 0.1s;
}

.link-section:nth-child(3) {
  animation-delay: 0.2s;
}

.apply-section {
  animation: fadeInUp 0.6s ease-out 0.3s both;
}
</style>