<template>
  <div class="archive-page">

    <!-- ── Header ── -->
    <header class="archive-header">
      <div class="header-orb header-orb--1"></div>
      <div class="header-orb header-orb--2"></div>
      <div class="header-inner">
        <span class="header-tag">ARCHIVE</span>
        <!-- 用 span 包裹渐变标题，避免 h1 默认 margin 被截断 -->
        <div class="header-title-wrap">
          <span class="header-title">归档</span>
        </div>
        <p class="header-desc">
          共 <strong>{{ articles.length }}</strong> 篇文章 ·
          <strong>{{ activeDays }}</strong> 个创作日 ·
          坚持就是胜利
        </p>
      </div>
    </header>

    <!-- ── Stats ── -->
    <div class="stats-row">
      <div class="stat-card" v-for="s in statItems" :key="s.label">
        <strong>{{ s.value }}</strong>
        <span>{{ s.label }}</span>
      </div>
    </div>

    <!-- ── Heatmap ── -->
    <div class="heatmap-section">
      <div class="heatmap-header">
        <span class="heatmap-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          过去一年创作热力图
        </span>
        <div class="heatmap-legend">
          <span>少</span>
          <i v-for="l in [0,1,2,3,4]" :key="l" class="legend-cell" :data-level="l"></i>
          <span>多</span>
        </div>
      </div>

      <!-- 热力图主体：左侧星期标签 + 右侧滚动区域 -->
      <div class="heatmap-body">
        <div class="weekday-col">
          <span v-for="d in ['', '一', '', '三', '', '五', '']" :key="d" class="wd-label">{{ d }}</span>
        </div>

        <div class="heatmap-scroll-area" ref="heatmapRef">
          <!-- 月份标签（绝对定位） -->
          <div class="month-row">
            <span
              v-for="m in monthLabels"
              :key="m.key"
              class="month-label"
              :style="{ left: m.offsetPx + 'px' }"
            >{{ m.label }}</span>
          </div>

          <!-- 格子 -->
          <div class="heatmap-grid">
            <div
              v-for="(cell, i) in heatmapCells"
              :key="i"
              class="hc"
              :data-level="cell.level"
              :class="{ today: cell.isToday, future: cell.isFuture }"
              @mouseenter="onCellEnter($event, cell)"
              @mouseleave="onCellLeave"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tooltip（fixed，跟随鼠标） -->
    <Teleport to="body">
      <div
        v-if="tip.visible"
        class="hc-tooltip"
        :style="{ left: tip.x + 'px', top: tip.y + 'px' }"
      >
        <div class="tip-date">{{ tip.dateStr }}</div>
        <div v-if="tip.count > 0" class="tip-count">发布 {{ tip.count }} 篇文章</div>
        <div v-else class="tip-empty">暂无文章</div>
        <ul v-if="tip.titles.length">
          <li v-for="t in tip.titles" :key="t">{{ t }}</li>
        </ul>
      </div>
    </Teleport>

    <!-- ── Timeline ── -->
    <div class="timeline-wrap">
      <div v-for="yg in timeline" :key="yg.year" class="year-block">
        <div class="year-row">
          <span class="year-dot"></span>
          <span class="year-num">{{ yg.year }}</span>
          <span class="year-cnt">{{ yg.total }} 篇</span>
        </div>

        <div v-for="mg in yg.months" :key="mg.month" class="month-block">
          <div class="month-row">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            <span class="month-name">{{ mg.month }} 月</span>
            <span class="month-cnt">{{ mg.articles.length }} 篇</span>
          </div>
          <ul class="art-list">
            <li
              v-for="a in mg.articles"
              :key="a.path"
              class="art-item"
              @click="go(a.path)"
            >
              <span class="art-day">{{ fmtDay(a.date) }}</span>
              <span class="art-dot"></span>
              <div class="art-info">
                <span class="art-title">{{ a.title }}</span>
                <div class="art-meta">
                  <span v-if="a.category" class="art-cat">{{ a.category }}</span>
                  <span v-for="t in a.tags.slice(0,2)" :key="t" class="art-tag">{{ t }}</span>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- 无日期文章 -->
      <div v-if="undated.length" class="year-block">
        <div class="year-row">
          <span class="year-dot"></span>
          <span class="year-num">未标注日期</span>
          <span class="year-cnt">{{ undated.length }} 篇</span>
        </div>
        <ul class="art-list" style="margin-left:26px">
          <li
            v-for="a in undated"
            :key="a.path"
            class="art-item"
            @click="go(a.path)"
          >
            <span class="art-day">--</span>
            <span class="art-dot"></span>
            <div class="art-info">
              <span class="art-title">{{ a.title }}</span>
              <div class="art-meta">
                <span v-if="a.category" class="art-cat">{{ a.category }}</span>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vitepress'
import { data as allArticles } from '../utils/archive.data.mjs'

const router = useRouter()
const articles = ref(allArticles)
const heatmapRef = ref(null)

// ── Tooltip ────────────────────────────────────────────────────
const tip = reactive({ visible: false, x: 0, y: 0, dateStr: '', count: 0, titles: [] })

const onCellEnter = (e, cell) => {
  if (cell.isFuture) return
  tip.dateStr = cell.dateStr
  tip.count = cell.count
  tip.titles = cell.titles
  tip.visible = true
  moveTip(e)
}
const onCellLeave = () => { tip.visible = false }
const moveTip = (e) => {
  tip.x = e.clientX + 12
  tip.y = e.clientY - 40
}

// ── Date map ───────────────────────────────────────────────────
const dateMap = computed(() => {
  const m = new Map()
  articles.value.forEach(a => {
    if (!a.date) return
    const key = String(a.date).slice(0, 10)
    if (!m.has(key)) m.set(key, [])
    m.get(key).push(a.title)
  })
  return m
})

// ── Stats ──────────────────────────────────────────────────────
const activeDays = computed(() => dateMap.value.size)

const maxPerDay = computed(() => {
  let max = 0
  dateMap.value.forEach(v => { if (v.length > max) max = v.length })
  return max
})

const longestStreak = computed(() => {
  const days = [...dateMap.value.keys()].sort()
  if (!days.length) return 0
  let max = 1, cur = 1
  for (let i = 1; i < days.length; i++) {
    const diff = (new Date(days[i]) - new Date(days[i - 1])) / 86400000
    diff === 1 ? (cur++, cur > max && (max = cur)) : (cur = 1)
  }
  return max
})

const currentStreak = computed(() => {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  let streak = 0; const d = new Date(today)
  while (true) {
    if (dateMap.value.has(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1) }
    else break
  }
  return streak
})

const statItems = computed(() => [
  { value: articles.value.length, label: '文章总数' },
  { value: activeDays.value,      label: '创作天数' },
  { value: maxPerDay.value,       label: '单日最多' },
  { value: longestStreak.value,   label: '最长连续（天）' },
  { value: currentStreak.value,   label: '当前连续（天）' },
])

// ── Heatmap grid ───────────────────────────────────────────────
// 每格 13px，间距 2px → 步长 15px
const CELL = 13
const GAP  = 2
const STEP = CELL + GAP

const heatmapCells = computed(() => {
  const today = new Date(); today.setHours(0, 0, 0, 0)

  // 往前推 52 整周，再对齐到周日
  const start = new Date(today)
  start.setDate(start.getDate() - 364)
  start.setDate(start.getDate() - start.getDay()) // 对齐到周日

  const cells = []
  const d = new Date(start)
  // 填满到今天，并补全最后一周
  while (d <= today || cells.length % 7 !== 0) {
    const key = d.toISOString().slice(0, 10)
    const titles = dateMap.value.get(key) || []
    const count  = titles.length
    const isFuture = d > today
    let level = 0
    if (!isFuture && count > 0) level = count >= 4 ? 4 : count
    cells.push({
      date: new Date(d),
      dateStr: d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
      count, titles, level,
      isToday:  d.getTime() === today.getTime(),
      isFuture,
    })
    d.setDate(d.getDate() + 1)
  }
  return cells
})

// 月份标签：定位在该月第一个格子所在列的左边缘
const monthLabels = computed(() => {
  const labels = []
  const seen = new Set()
  heatmapCells.value.forEach((cell, i) => {
    if (cell.isFuture) return
    const weekIndex = Math.floor(i / 7)          // 列序号（0-based）
    const monthKey  = `${cell.date.getFullYear()}-${cell.date.getMonth()}`
    // 每个月只取第一次出现
    if (!seen.has(monthKey)) {
      seen.add(monthKey)
      labels.push({
        key: monthKey,
        label: `${cell.date.getMonth() + 1}月`,
        offsetPx: weekIndex * STEP,               // 距左边缘像素
      })
    }
  })
  return labels
})

// ── Timeline ───────────────────────────────────────────────────
const dated  = computed(() => articles.value.filter(a => a.date))
const undated = computed(() => articles.value.filter(a => !a.date))

const timeline = computed(() => {
  const yMap = new Map()
  dated.value.forEach(a => {
    const d = new Date(a.date)
    const y = d.getFullYear()
    const mo = d.getMonth() + 1
    if (!yMap.has(y)) yMap.set(y, new Map())
    const mMap = yMap.get(y)
    if (!mMap.has(mo)) mMap.set(mo, [])
    mMap.get(mo).push(a)
  })
  return [...yMap.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, mMap]) => {
      const months = [...mMap.entries()]
        .sort(([a], [b]) => b - a)
        .map(([month, articles]) => ({ month, articles }))
      return { year, months, total: months.reduce((s, m) => s + m.articles.length, 0) }
    })
})

const fmtDay = (d) => d ? String(new Date(d).getDate()).padStart(2, '0') : '--'
const go     = (path) => router.go(path.startsWith('/') ? path : `/${path}`)
</script>

<style scoped>
/* ── 页面容器 ─────────────────────────────────────────────── */
.archive-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1.5rem 5rem;
}

/* ── Header ───────────────────────────────────────────────── */
.archive-header {
  position: relative;
  text-align: center;
  padding: 3rem 0 2rem;
  /* ❌ 不设 overflow:hidden，否则渐变文字上下会被截断 */
}
.header-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(60px);
  z-index: 0;
}
.header-orb--1 {
  width: 280px; height: 280px;
  top: -80px; left: -60px;
  background: rgba(16, 185, 129, 0.09);
  animation: orbDrift 12s ease-in-out infinite alternate;
}
.header-orb--2 {
  width: 220px; height: 220px;
  bottom: -40px; right: -40px;
  background: rgba(59, 130, 246, 0.06);
  animation: orbDrift 15s ease-in-out infinite alternate-reverse;
}
@keyframes orbDrift {
  to { transform: translate(20px, -15px); }
}
.header-inner {
  position: relative;
  z-index: 1;
}
.header-tag {
  display: inline-block;
  font-size: 0.6rem;
  letter-spacing: 0.25em;
  font-weight: 700;
  color: var(--accent, #10b981);
  background: rgba(16,185,129,0.08);
  border: 1px solid rgba(16,185,129,0.15);
  padding: 3px 14px;
  border-radius: 20px;
  margin-bottom: 0.8rem;
}
/* 用 div 包裹，给渐变文字留出上下呼吸空间，防截断 */
.header-title-wrap {
  line-height: 1;
  padding: 0.15em 0;
  overflow: visible;
}
.header-title {
  display: inline-block;
  font-size: 2.4rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, var(--vp-c-text-1) 20%, #06b6d4 60%, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  /* 关键：给行内渐变文字留出底部空间 */
  padding-bottom: 0.1em;
}
.header-desc {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin: 0.6rem 0 0;
}
.header-desc strong {
  color: var(--accent, #10b981);
  font-weight: 700;
}

/* ── Stats ────────────────────────────────────────────────── */
.stats-row {
  display: flex;
  gap: 8px;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.stat-card {
  flex: 1;
  min-width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.85rem 0.5rem 0.7rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  transition: border-color .25s, box-shadow .25s;
}
.stat-card:hover {
  border-color: rgba(16,185,129,.25);
  box-shadow: 0 4px 16px rgba(16,185,129,.06);
}
.stat-card strong {
  font-size: 1.45rem;
  font-weight: 800;
  line-height: 1.2;
  color: var(--accent, #10b981);
}
.stat-card span {
  font-size: 0.62rem;
  color: var(--vp-c-text-3);
  margin-top: 4px;
  text-align: center;
}

/* ── Heatmap section ──────────────────────────────────────── */
.heatmap-section {
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--vp-c-bg);
  padding: 1.25rem 1.5rem 1.5rem;
  margin-bottom: 2.5rem;
}
.heatmap-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
}
.heatmap-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  flex-shrink: 0;
}
.heatmap-title svg { color: var(--accent, #10b981); }

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.65rem;
  color: var(--vp-c-text-3);
}
.legend-cell {
  display: inline-block;
  width: 11px; height: 11px;
  border-radius: 2px;
}
.legend-cell[data-level="0"] { background: var(--vp-c-bg-soft); }
.legend-cell[data-level="1"] { background: #bbf7d0; }
.legend-cell[data-level="2"] { background: #4ade80; }
.legend-cell[data-level="3"] { background: #16a34a; }
.legend-cell[data-level="4"] { background: #14532d; }
.dark .legend-cell[data-level="1"] { background: #14532d; }
.dark .legend-cell[data-level="2"] { background: #166534; }
.dark .legend-cell[data-level="3"] { background: #16a34a; }
.dark .legend-cell[data-level="4"] { background: #4ade80; }

/* 热力图主体布局：左边星期 + 右边可滚动格子 */
.heatmap-body {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  overflow-x: auto;
}
.weekday-col {
  display: grid;
  grid-template-rows: repeat(7, 13px);
  gap: 2px;
  padding-top: 20px;   /* 对齐月份标签行高度 */
  flex-shrink: 0;
}
.wd-label {
  font-size: 0.6rem;
  color: var(--vp-c-text-3);
  line-height: 13px;
  text-align: right;
  user-select: none;
}

/* 月份标签 + 格子容器 */
.heatmap-scroll-area {
  position: relative;
  flex-shrink: 0;
}
.month-row {
  position: relative;
  height: 20px;
}
.month-label {
  position: absolute;
  top: 0;
  font-size: 0.6rem;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  user-select: none;
}

/* 格子网格：column-first，7行 */
.heatmap-grid {
  display: grid;
  grid-template-rows: repeat(7, 13px);
  grid-auto-flow: column;
  grid-auto-columns: 13px;
  gap: 2px;
}

/* 单个格子 */
.hc {
  width: 13px; height: 13px;
  border-radius: 2px;
  background: var(--vp-c-bg-soft);
  cursor: pointer;
  transition: transform .15s;
}
.hc[data-level="1"] { background: #bbf7d0; }
.hc[data-level="2"] { background: #4ade80; }
.hc[data-level="3"] { background: #16a34a; }
.hc[data-level="4"] { background: #14532d; }
.dark .hc[data-level="1"] { background: #14532d; }
.dark .hc[data-level="2"] { background: #166534; }
.dark .hc[data-level="3"] { background: #16a34a; }
.dark .hc[data-level="4"] { background: #4ade80; }
.hc.today { outline: 2px solid var(--accent, #10b981); outline-offset: -1px; }
.hc.future { opacity: 0.18; cursor: default; }
.hc:not(.future):hover { transform: scale(1.4); z-index: 1; }

/* ── Tooltip（Teleport to body，fixed 定位） ─────────────── */
.hc-tooltip {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.75rem;
  color: var(--vp-c-text-1);
  box-shadow: 0 4px 16px rgba(0,0,0,.15);
  white-space: nowrap;
  max-width: 220px;
  white-space: normal;
  transform: none;
}
.tip-date  { font-weight: 700; color: var(--accent, #10b981); margin-bottom: 2px; }
.tip-count { color: var(--vp-c-text-2); font-size: 0.72rem; }
.tip-empty { color: var(--vp-c-text-3); font-size: 0.72rem; }
.hc-tooltip ul {
  margin: 4px 0 0;
  padding-left: 14px;
}
.hc-tooltip li {
  font-size: 0.7rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

/* ── Timeline ─────────────────────────────────────────────── */
.timeline-wrap {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.year-block {}

.year-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1rem;
}
.year-dot {
  width: 12px; height: 12px;
  border-radius: 50%;
  background: var(--accent, #10b981);
  box-shadow: 0 0 0 3px rgba(16,185,129,.15);
  flex-shrink: 0;
}
.year-num {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--vp-c-text-1);
  letter-spacing: -0.02em;
}
.year-cnt {
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
  padding: 2px 8px;
  border-radius: 10px;
}

.month-block {
  margin-left: 6px;
  padding-left: 20px;
  border-left: 2px solid var(--vp-c-divider);
  margin-bottom: 1.2rem;
  position: relative;
}
.month-block::before {
  content: '';
  position: absolute;
  left: -5px; top: 3px;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--vp-c-bg);
  border: 2px solid var(--vp-c-divider);
}

.month-row {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 0.5rem;
  color: var(--vp-c-text-3);
}
.month-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
}
.month-cnt {
  font-size: 0.65rem;
  color: var(--vp-c-text-3);
}

.art-list {
  list-style: none;
  margin: 0; padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.art-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background .15s;
}
.art-item:hover { background: var(--vp-c-bg-soft); }
.art-item:hover .art-title { color: var(--accent, #10b981); }
.art-item:hover .art-dot   { background: var(--accent, #10b981); }

.art-day {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--vp-c-text-3);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  width: 18px;
  text-align: right;
}
.art-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--vp-c-divider);
  flex-shrink: 0;
  transition: background .15s;
}
.art-info {
  flex: 1;
  min-width: 0;
}
.art-title {
  display: block;
  font-size: 0.87rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color .15s;
}
.art-meta {
  display: flex;
  gap: 4px;
  margin-top: 2px;
  flex-wrap: wrap;
}
.art-cat {
  font-size: 0.6rem;
  color: var(--accent, #10b981);
  background: rgba(16,185,129,.08);
  padding: 1px 6px;
  border-radius: 4px;
}
.art-tag {
  font-size: 0.6rem;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
  padding: 1px 6px;
  border-radius: 4px;
}

/* ── 响应式 ───────────────────────────────────────────────── */
@media (max-width: 640px) {
  .archive-page { padding: 0 1rem 3rem; }
  .archive-header { padding: 2rem 0 1.5rem; }
  .header-title { font-size: 1.8rem; }
  .heatmap-section { padding: 1rem; }
  .heatmap-header { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
  .stats-row { gap: 6px; }
  .stat-card { padding: 0.65rem 0.4rem; }
  .stat-card strong { font-size: 1.15rem; }
  .year-num { font-size: 1.05rem; }
}
</style>
