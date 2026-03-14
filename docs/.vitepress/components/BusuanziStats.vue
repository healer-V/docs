<template>
  <div class="busuanzi-stats">
    <!-- busuanzi 会把 container 的 display 改成 inline，所以用外层 div 强制隐藏 -->
    <div class="busuanzi-hidden">
      <span id="busuanzi_container_site_pv"><span id="busuanzi_value_site_pv"></span></span>
      <span id="busuanzi_container_site_uv"><span id="busuanzi_value_site_uv"></span></span>
      <span id="busuanzi_container_page_pv"><span id="busuanzi_value_page_pv"></span></span>
    </div>

    <div class="stats-header">
      <h4 class="stats-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
        访问统计
      </h4>
    </div>

    <div class="stats-content">
      <div class="stat-item">
        <div class="stat-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">站点访问量</span>
          <span class="stat-value" :class="{ 'loading': isLoading }">
            {{ stats.sitePv }}
          </span>
        </div>
      </div>

      <div class="stat-item">
        <div class="stat-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">站点访客数</span>
          <span class="stat-value" :class="{ 'loading': isLoading }">
            {{ stats.siteUv }}
          </span>
        </div>
      </div>

      <div class="stat-item">
        <div class="stat-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">页面访问量</span>
          <span class="stat-value" :class="{ 'loading': isLoading }">
            {{ stats.pagePv }}
          </span>
        </div>
      </div>
    </div>

    <div class="stats-footer">
      <p class="stats-note">
        数据由 <a href="https://busuanzi.ibruce.info/" target="_blank" rel="noopener noreferrer">不蒜子</a> 提供
      </p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, nextTick } from 'vue'
import { inBrowser } from 'vitepress'

const stats = ref({
  sitePv: '加载中...',
  siteUv: '加载中...',
  pagePv: '加载中...'
})

const isLoading = ref(true)

let observer = null
let pollTimer = null

const formatNumber = (num) => {
  if (!num || num === '0') return '0'
  const number = parseInt(String(num).replace(/,/g, ''), 10)
  if (isNaN(number)) return num
  if (number >= 1000000) return (number / 1000000).toFixed(1) + 'M'
  if (number >= 1000) return (number / 1000).toFixed(1) + 'K'
  return number.toString()
}

const readStats = () => {
  const pvEl = document.getElementById('busuanzi_value_site_pv')
  const uvEl = document.getElementById('busuanzi_value_site_uv')
  const pagePvEl = document.getElementById('busuanzi_value_page_pv')

  const pv = pvEl?.innerHTML?.trim()
  const uv = uvEl?.innerHTML?.trim()
  const pagePv = pagePvEl?.innerHTML?.trim()

  if (pv || uv || pagePv) {
    stats.value = {
      sitePv: pv ? formatNumber(pv) : '0',
      siteUv: uv ? formatNumber(uv) : '0',
      pagePv: pagePv ? formatNumber(pagePv) : '0'
    }
    isLoading.value = false
    return true
  }
  return false
}

onMounted(async () => {
  if (!inBrowser) return

  // 等待 DOM 完全渲染（确保隐藏的 busuanzi span 已在 DOM 中）
  await nextTick()

  // busuanzi.pure.js 在 import 时已经自动 fetch 过一次，
  // 但那时 DOM 中可能还没有目标元素，所以需要重新 fetch
  if (window.busuanzi && typeof window.busuanzi.fetch === 'function') {
    window.busuanzi.fetch()
  }

  // 先尝试直接读取（可能 import 时的 fetch 已经写入了）
  if (readStats()) return

  // 用 MutationObserver 监听 busuanzi 写入数据
  observer = new MutationObserver(() => {
    if (readStats()) {
      observer?.disconnect()
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  })

  // 轮询兜底（某些情况 MutationObserver 可能捕获不到）
  pollTimer = setInterval(() => {
    if (readStats()) {
      clearInterval(pollTimer)
      pollTimer = null
      observer?.disconnect()
    }
  }, 2000)

  // 15 秒超时
  setTimeout(() => {
    if (isLoading.value) {
      isLoading.value = false
      stats.value = {
        sitePv: '-',
        siteUv: '-',
        pagePv: '-'
      }
    }
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    observer?.disconnect()
  }, 15000)
})

onUnmounted(() => {
  observer?.disconnect()
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})
</script>

<style scoped>
.busuanzi-stats {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  padding: 1.25rem;
  transition: box-shadow 0.3s, border-color 0.3s;
}

.busuanzi-stats:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.04);
  border-color: var(--glow-border, rgba(14, 165, 233, 0.15));
}

.dark .busuanzi-stats:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
}

.stats-header {
  margin-bottom: 0.75rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.stats-title {
  font-family: 'Sora', 'Noto Sans SC', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.stats-title svg {
  color: var(--accent, #0ea5e9);
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.65rem;
  background: var(--vp-c-bg-soft);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.stat-item:hover {
  background: var(--accent-soft, rgba(14, 165, 233, 0.06));
  transform: translateX(2px);
}

.stat-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-soft, rgba(14, 165, 233, 0.08));
  border-radius: 8px;
  flex-shrink: 0;
  color: var(--accent, #0ea5e9);
}

.stat-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
  margin-bottom: 2px;
}

.stat-value {
  font-family: 'Sora', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--accent, #0ea5e9);
  line-height: 1.2;
}

.loading {
  font-size: 0.72rem;
  color: var(--vp-c-text-3);
  font-weight: 400;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.stats-footer {
  margin-top: 0.75rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--vp-c-divider);
}

.stats-note {
  font-size: 0.65rem;
  color: var(--vp-c-text-3);
  margin: 0;
  text-align: center;
}

.stats-note a {
  color: var(--accent, #0ea5e9);
  text-decoration: none;
}

.stats-note a:hover {
  text-decoration: underline;
}

/* busuanzi 会把内部 container 改成 display:inline，用外层强制隐藏 */
.busuanzi-hidden {
  position: absolute !important;
  width: 0 !important;
  height: 0 !important;
  overflow: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

@media (max-width: 640px) {
  .busuanzi-stats { padding: 1rem; border-radius: 10px; }
  .stat-item { padding: 0.45rem 0.55rem; gap: 0.45rem; border-radius: 8px; }
  .stat-icon { width: 24px; height: 24px; border-radius: 6px; }
  .stat-icon svg { width: 12px; height: 12px; }
  .stat-label { font-size: 0.65rem; }
  .stat-value { font-size: 0.85rem; }
  .stats-title { font-size: 0.78rem; }
  .stats-note { font-size: 0.6rem; }
}
</style>
