<template>
  <div class="gh-archive">

    <!-- ── Profile Header ── -->
    <div class="gh-profile-header">
      <div class="gh-avatar">
        <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.164 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.16 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>
      </div>
      <div class="gh-profile-info">
        <h1 class="gh-username">创作归档</h1>
        <p class="gh-bio">共 <strong>{{ articles.length }}</strong> 篇文章 · <strong>{{ activeDays }}</strong> 个创作日</p>
      </div>
    </div>

    <!-- ── Contribution Graph ── -->

    <!-- title 在卡片外面 -->
    <p class="gh-contrib-title">
      <strong>{{ yearlyCount }}</strong> contributions in {{ selectedYear }}
    </p>

    <div class="gh-contrib-section">

      <!-- 左侧：贡献图卡片 -->
      <div class="gh-card">

        <div class="gh-graph-container">
          <svg
            class="gh-heatmap-svg"
            :viewBox="`0 0 ${svgW} ${svgH}`"
            width="100%"
            :style="{ maxWidth: svgW + 'px' }"
          >
            <!-- 星期标签：Mon / Wed / Fri -->
            <text class="gh-svg-wd" text-anchor="end" :x="LEFT - 5" :y="TOP + 1*STEP + 10">Mon</text>
            <text class="gh-svg-wd" text-anchor="end" :x="LEFT - 5" :y="TOP + 3*STEP + 10">Wed</text>
            <text class="gh-svg-wd" text-anchor="end" :x="LEFT - 5" :y="TOP + 5*STEP + 10">Fri</text>

            <!-- 月份标签 -->
            <text
              v-for="m in monthLabels"
              :key="m.key"
              class="gh-svg-label"
              :x="LEFT + m.weekIndex * STEP"
              :y="TOP - 6"
            >{{ m.label }}</text>

            <!-- 格子 -->
            <rect
              v-for="(cell, idx) in heatmapCells"
              :key="idx"
              :x="LEFT + Math.floor(idx / 7) * STEP"
              :y="TOP + (idx % 7) * STEP"
              :width="CELL"
              :height="CELL"
              rx="2" ry="2"
              :data-level="cell.level"
              :class="{ 'c-today': cell.isToday, 'c-future': cell.isFuture, 'c-out': cell.outOfYear }"
              @mouseenter="onCellEnter($event, cell)"
              @mouseleave="onCellLeave"
            />
          </svg>
        </div>

        <!-- 图例 -->
        <div class="gh-legend-row">
          <a class="gh-legend-link" href="javascript:void(0)">Learn how we count contributions</a>
          <div class="gh-legend">
            <span>Less</span>
            <i v-for="l in [0,1,2,3,4]" :key="l" class="gh-legend-cell" :data-level="l"></i>
            <span>More</span>
          </div>
        </div>
      </div>

      <!-- 右侧：年份选择器竖排 -->
      <div class="gh-year-sidebar">
        <button
          v-for="y in availableYears"
          :key="y"
          class="gh-year-btn"
          :class="{ active: selectedYear === y }"
          @click="selectedYear = y"
        >{{ y }}</button>
      </div>

    </div>

    <!-- ── Stats Row ── -->
    <div class="gh-stats-row">
      <div class="gh-stat" v-for="s in statItems" :key="s.label">
        <div class="gh-stat-value">{{ s.value }}</div>
        <div class="gh-stat-label">{{ s.label }}</div>
      </div>
    </div>

    <!-- ── Activity Timeline ── -->
    <div class="gh-activity">
      <div class="gh-activity-header">
        <svg class="gh-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M1.5 1.75V13.5h13.75a.75.75 0 010 1.5H.75a.75.75 0 01-.75-.75V1.75a.75.75 0 011.5 0zm14.28 2.53l-5.25 5.25a.75.75 0 01-1.06 0L7 7.06 4.28 9.78a.749.749 0 01-1.275-.326.749.749 0 01.215-.734l3.25-3.25a.75.75 0 011.06 0L9 7.94l4.72-4.72a.749.749 0 011.275.326.749.749 0 01-.215.734z"/></svg>
        <span>Contribution Activity</span>
      </div>

      <div v-for="yg in timeline" :key="yg.year" class="gh-year-group">

        <!-- 年份分割线（可点击折叠） -->
        <div class="gh-year-divider gh-collapsible" @click="toggleYear(yg.year)">
          <span class="gh-year-label">
            <svg class="gh-chevron" :class="{ open: expandedYears.has(yg.year) }" viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z"/></svg>
            {{ yg.year }}
            <span class="gh-year-total">{{ yg.total }} articles</span>
          </span>
        </div>

        <template v-if="expandedYears.has(yg.year)">
          <div v-for="mg in yg.months" :key="mg.month" class="gh-month-group">
            <!-- 月份 Header（可点击折叠） -->
            <div class="gh-month-header gh-collapsible" @click="toggleMonth(`${yg.year}-${mg.month}`)">
              <div class="gh-timeline-dot"></div>
              <span class="gh-month-title">{{ yg.year }}年{{ mg.month }}月</span>
              <span class="gh-month-badge">{{ mg.articles.length }} articles</span>
              <svg class="gh-chevron gh-chevron--month" :class="{ open: expandedMonths.has(`${yg.year}-${mg.month}`) }" viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z"/></svg>
            </div>

            <!-- 文章列表卡片 -->
            <div v-if="expandedMonths.has(`${yg.year}-${mg.month}`)" class="gh-commits-card">
              <div
                v-for="a in mg.articles"
                :key="a.path"
                class="gh-commit-row"
                @click="go(a.path)"
              >
                <div class="gh-commit-icon">
                  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M11.93 8.5a4.002 4.002 0 01-7.86 0H.75a.75.75 0 010-1.5h3.32a4.002 4.002 0 017.86 0h3.32a.75.75 0 010 1.5zm-1.43-.75a2.5 2.5 0 10-5 0 2.5 2.5 0 005 0z"/></svg>
                </div>
                <div class="gh-commit-info">
                  <span class="gh-commit-msg">{{ a.title }}</span>
                  <div class="gh-commit-meta">
                    <span v-if="a.category" class="gh-repo-badge">
                      <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 010-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8z"/></svg>
                      {{ a.category }}
                    </span>
                    <span v-for="t in a.tags.slice(0,2)" :key="t" class="gh-tag-badge">{{ t }}</span>
                  </div>
                </div>
                <div class="gh-commit-date">
                  <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M4.75 0a.75.75 0 01.75.75V2h5V.75a.75.75 0 011.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0113.25 16H2.75A1.75 1.75 0 011 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 014.75 0zm0 3.5h-2a.25.25 0 00-.25.25V6h10.5V3.75a.25.25 0 00-.25-.25h-2V5a.75.75 0 01-1.5 0V3.5h-5V5a.75.75 0 01-1.5 0V3.5zM2.5 7.5v6.75c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25V7.5H2.5z"/></svg>
                  {{ fmtDate(a.date) }}
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 无日期文章 -->
      <div v-if="undated.length" class="gh-year-group">
        <div class="gh-year-divider gh-collapsible" @click="toggleYear('undated')">
          <span class="gh-year-label">
            <svg class="gh-chevron" :class="{ open: expandedYears.has('undated') }" viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z"/></svg>
            Undated
            <span class="gh-year-total">{{ undated.length }} articles</span>
          </span>
        </div>
        <template v-if="expandedYears.has('undated')">
          <div class="gh-month-group">
            <div class="gh-commits-card">
              <div
                v-for="a in undated"
                :key="a.path"
                class="gh-commit-row"
                @click="go(a.path)"
              >
                <div class="gh-commit-icon">
                  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M11.93 8.5a4.002 4.002 0 01-7.86 0H.75a.75.75 0 010-1.5h3.32a4.002 4.002 0 017.86 0h3.32a.75.75 0 010 1.5zm-1.43-.75a2.5 2.5 0 10-5 0 2.5 2.5 0 005 0z"/></svg>
                </div>
                <div class="gh-commit-info">
                  <span class="gh-commit-msg">{{ a.title }}</span>
                  <div class="gh-commit-meta">
                    <span v-if="a.category" class="gh-repo-badge">
                      <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 010-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8z"/></svg>
                      {{ a.category }}
                    </span>
                  </div>
                </div>
                <div class="gh-commit-date">—</div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Tooltip -->
    <Teleport to="body">
      <div
        v-if="tip.visible"
        class="gh-tooltip"
        :style="{ left: tip.x + 'px', top: tip.y + 'px' }"
      >
        <template v-if="tip.count > 0">
          <strong>{{ tip.count }} contribution{{ tip.count > 1 ? 's' : '' }}</strong> on {{ tip.dateStr }}
          <ul v-if="tip.titles.length">
            <li v-for="t in tip.titles" :key="t">{{ t }}</li>
          </ul>
        </template>
        <template v-else>
          No contributions on {{ tip.dateStr }}
        </template>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vitepress'
import { data as allArticles } from '../utils/archive.data.mjs'

const router  = useRouter()
const articles = ref(allArticles)

// ── 折叠状态（默认全部折叠，用 Set 记录已展开的 key）────────────
const expandedYears  = reactive(new Set())
const expandedMonths = reactive(new Set())

const toggleYear = (year) => {
  if (expandedYears.has(year)) expandedYears.delete(year)
  else expandedYears.add(year)
}
const toggleMonth = (key) => {
  if (expandedMonths.has(key)) expandedMonths.delete(key)
  else expandedMonths.add(key)
}

// ── Tooltip ──────────────────────────────────────────────────
const tip = reactive({ visible: false, x: 0, y: 0, dateStr: '', count: 0, titles: [] })

const onCellEnter = (e, cell) => {
  if (cell.isFuture) return
  tip.dateStr = cell.dateStr
  tip.count   = cell.count
  tip.titles  = cell.titles
  tip.visible = true
  tip.x = e.clientX + 14
  tip.y = e.clientY - 50
}
const onCellLeave = () => { tip.visible = false }

// ── Date map ─────────────────────────────────────────────────
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

// ── Year selector ────────────────────────────────────────────
const currentYear = new Date().getFullYear()

// 有效年份范围：2015 ~ 当前年，过滤 git log 带来的异常日期
const MIN_YEAR = 2015

const availableYears = computed(() => {
  const years = new Set()
  articles.value.forEach(a => {
    if (!a.date) return
    const y = new Date(a.date).getFullYear()
    if (y >= MIN_YEAR && y <= currentYear) years.add(y)
  })
  const arr = [...years].sort((a, b) => b - a)
  if (!arr.includes(currentYear)) arr.unshift(currentYear)
  return arr.slice(0, 6)
})

const selectedYear = ref(currentYear)

const yearlyCount = computed(() =>
  articles.value.filter(a => {
    if (!a.date) return false
    return new Date(a.date).getFullYear() === selectedYear.value
  }).length
)

// ── Stats ────────────────────────────────────────────────────
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
  { value: articles.value.length, label: 'Total articles' },
  { value: activeDays.value,      label: 'Active days' },
  { value: maxPerDay.value,       label: 'Best in a day' },
  { value: longestStreak.value,   label: 'Longest streak' },
  { value: currentStreak.value,   label: 'Current streak' },
])

// ── Heatmap grid ─────────────────────────────────��───────────
const CELL = 13   // 格子尺寸（略大于 GitHub 原版，更清晰）
const GAP  = 3    // 间距
const STEP = CELL + GAP  // = 16
const LEFT = 36   // 左侧星期标签区（11px 字体需要更多空间）
const TOP  = 26   // 顶部月份标签区高度

// SVG 画布尺寸（响应式靠 preserveAspectRatio 拉伸）
const numWeeks = computed(() => Math.ceil(heatmapCells.value.length / 7))
const svgW = computed(() => LEFT + numWeeks.value * STEP - GAP)
const svgH = TOP + 7 * STEP - GAP  // 固定高度 = 111

const heatmapCells = computed(() => {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const year  = selectedYear.value

  // 从所选年的 1 月 1 日往前对齐到周日
  const start = new Date(year, 0, 1)
  start.setDate(start.getDate() - start.getDay())

  // 结束：始终渲染到年底（与 GitHub 一致，未来格子透明）
  const end = new Date(year, 11, 31)

  const cells = []
  const d = new Date(start)
  while (d <= end || cells.length % 7 !== 0) {
    const key        = d.toISOString().slice(0, 10)
    const outOfYear  = d.getFullYear() !== year   // Jan 1 前的对齐填充天，完全隐藏
    const isFuture   = !outOfYear && d > today    // 年内未来日期，显示为空格子
    const titles     = outOfYear ? [] : (dateMap.value.get(key) || [])
    const count      = titles.length
    let level = 0
    if (!isFuture && !outOfYear && count > 0) level = count >= 4 ? 4 : count
    cells.push({
      date: new Date(d),
      dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      count, titles, level,
      isToday:  !outOfYear && d.getTime() === today.getTime(),
      isFuture,
      outOfYear,
    })
    d.setDate(d.getDate() + 1)
  }
  return cells
})

const monthLabels = computed(() => {
  const labels = []
  const seen   = new Set()
  heatmapCells.value.forEach((cell, i) => {
    const weekIndex = Math.floor(i / 7)
    const monthKey  = `${cell.date.getFullYear()}-${cell.date.getMonth()}`
    if (!seen.has(monthKey) && !cell.outOfYear) {
      seen.add(monthKey)
      labels.push({
        key: monthKey,
        label: cell.date.toLocaleDateString('en-US', { month: 'short' }),
        weekIndex,
      })
    }
  })
  return labels
})

// ── Timeline ───────────────────���─────────────────────────────
// 过滤掉年份明显异常的文章（git log 历史可能带来无效日期）
const dated   = computed(() => articles.value.filter(a => {
  if (!a.date) return false
  const y = new Date(a.date).getFullYear()
  return y >= MIN_YEAR && y <= currentYear + 1
}))
const undated = computed(() => articles.value.filter(a => {
  if (a.date) {
    const y = new Date(a.date).getFullYear()
    return y < MIN_YEAR || y > currentYear + 1
  }
  return true
}))

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

const fmtDate = (d) => {
  if (!d) return '—'
  const date = new Date(d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
const go = (path) => router.go(path.startsWith('/') ? path : `/${path}`)
</script>

<style scoped>
/* ── CSS 变量 ─────────────────────────────────────────────── */
.gh-archive {
  --gh-border:        #d0d7de;
  --gh-bg:            #ffffff;
  --gh-bg-secondary:  #f6f8fa;
  --gh-text:          #1f2328;
  --gh-text-muted:    #636e7b;
  --gh-text-subtle:   #6e7781;
  --gh-link:          #0969da;
  --gh-green-0:       #ebedf0;
  --gh-green-1:       #9be9a8;
  --gh-green-2:       #40c463;
  --gh-green-3:       #30a14e;
  --gh-green-4:       #216e39;
  --gh-badge-bg:      rgba(9,105,218,0.08);
  --gh-badge-color:   #0969da;
  --gh-badge-border:  rgba(9,105,218,0.2);

  max-width: 1012px;
  margin: 0 auto;
  padding: 0 1rem 5rem;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  color: var(--gh-text);
}

.dark .gh-archive {
  --gh-border:        #30363d;
  --gh-bg:            #0d1117;
  --gh-bg-secondary:  #161b22;
  --gh-text:          #e6edf3;
  --gh-text-muted:    #8b949e;
  --gh-text-subtle:   #6e7781;
  --gh-link:          #58a6ff;
  --gh-green-0:       #161b22;
  --gh-green-1:       #0e4429;
  --gh-green-2:       #006d32;
  --gh-green-3:       #26a641;
  --gh-green-4:       #39d353;
  --gh-badge-bg:      rgba(88,166,255,0.1);
  --gh-badge-color:   #58a6ff;
  --gh-badge-border:  rgba(88,166,255,0.2);
}

/* ── Profile Header ───────────────────────────────────────── */
.gh-profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 2rem 0 1.5rem;
}

.gh-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--gh-bg-secondary);
  border: 1px solid var(--gh-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gh-text-muted);
  flex-shrink: 0;
}

.gh-profile-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gh-username {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gh-text);
  margin: 0;
  line-height: 1.2;
  border: none;
  padding: 0;
}

.gh-bio {
  font-size: 0.875rem;
  color: var(--gh-text-muted);
  margin: 0;
}

.gh-bio strong {
  color: var(--gh-text);
  font-weight: 600;
}

/* ── Card ─────────────────────────────────────────────────── */
.gh-card {
  border: 1px solid var(--gh-border);
  border-radius: 6px;
  background: var(--gh-bg);
  padding: 16px;
  flex: 1;
  min-width: 0;
}

/* 贡献图 + 年份选择器 并排布局 */
.gh-contrib-section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.gh-contrib-title {
  font-size: 0.875rem;
  color: var(--gh-text);
  margin: 0 0 8px;
}

.gh-contrib-title strong {
  font-weight: 600;
}

/* 右侧年份竖排 */
.gh-year-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex-shrink: 0;
}

.gh-year-btn {
  padding: 5px 16px;
  font-size: 0.8125rem;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--gh-link);
  cursor: pointer;
  text-align: left;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s;
}

.gh-year-btn:hover {
  background: var(--gh-bg-secondary);
  border-color: var(--gh-border);
}

.gh-year-btn.active {
  background: var(--gh-link);
  color: #fff;
  border-color: var(--gh-link);
}

/* ── Graph SVG ────────────────────────────────────────────── */
.gh-graph-container {
  overflow-x: auto;
  padding-bottom: 4px;
}

.gh-heatmap-svg {
  display: block;
  overflow: visible;
}

/* 月份标签 */
.gh-svg-label {
  font-size: 11px;
  fill: var(--gh-text-subtle);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}

/* 星期标签（Mon/Wed/Fri）— GitHub 用蓝色 */
.gh-svg-wd {
  font-size: 11px;
  fill: var(--gh-link);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}

/* 格子默认色 */
.gh-heatmap-svg rect {
  fill: var(--gh-green-0);
  shape-rendering: geometricPrecision;
  cursor: pointer;
}

/* 各级别颜色 */
.gh-heatmap-svg rect[data-level="1"] { fill: var(--gh-green-1); }
.gh-heatmap-svg rect[data-level="2"] { fill: var(--gh-green-2); }
.gh-heatmap-svg rect[data-level="3"] { fill: var(--gh-green-3); }
.gh-heatmap-svg rect[data-level="4"] { fill: var(--gh-green-4); }

/* 今天：GitHub 用深色描边 */
.gh-heatmap-svg rect.c-today {
  stroke: var(--gh-text);
  stroke-width: 1.5;
}

/* 年内未来日期：显示为空格子（level=0），不响应鼠标 */
.gh-heatmap-svg rect.c-future {
  cursor: default;
  pointer-events: none;
}

/* Jan 1 前的对齐填充格：完全隐藏 */
.gh-heatmap-svg rect.c-out {
  fill: transparent;
  cursor: default;
  pointer-events: none;
}

/* hover 高亮 */
.gh-heatmap-svg rect:not(.c-future):hover {
  opacity: 0.75;
}

/* ── Legend ───────────────────────────────────────────────── */
.gh-legend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.gh-legend-link {
  font-size: 0.7rem;
  color: var(--gh-link);
  text-decoration: none;
}

.gh-legend-link:hover {
  text-decoration: underline;
}

.gh-legend {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.7rem;
  color: var(--gh-text-subtle);
}

.gh-legend-cell {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  outline: 1px solid rgba(27,31,36,0.06);
  outline-offset: -1px;
}

.gh-legend-cell[data-level="0"] { background: var(--gh-green-0); }
.gh-legend-cell[data-level="1"] { background: var(--gh-green-1); }
.gh-legend-cell[data-level="2"] { background: var(--gh-green-2); }
.gh-legend-cell[data-level="3"] { background: var(--gh-green-3); }
.gh-legend-cell[data-level="4"] { background: var(--gh-green-4); }

/* ── Stats ────────────────────────────────────────────────── */
.gh-stats-row {
  display: flex;
  gap: 1px;
  margin-bottom: 24px;
  border: 1px solid var(--gh-border);
  border-radius: 6px;
  overflow: hidden;
  background: var(--gh-border);
}

.gh-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 8px;
  background: var(--gh-bg);
  gap: 4px;
  min-width: 80px;
}

.gh-stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gh-text);
  line-height: 1;
}

.gh-stat-label {
  font-size: 0.65rem;
  color: var(--gh-text-muted);
  text-align: center;
  line-height: 1.3;
}

/* ── Activity Section ─────────────────────────────────────── */
.gh-activity {}

.gh-activity-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gh-text);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--gh-border);
}

.gh-icon {
  color: var(--gh-text-muted);
}

/* ── Year Group ───────────────────────────────────────────── */
.gh-year-group {
  margin-bottom: 24px;
}

.gh-year-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.gh-year-divider::before,
.gh-year-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--gh-border);
}

.gh-year-divider::before {
  display: none;
}

.gh-year-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gh-text);
  background: var(--gh-bg);
  padding: 4px 12px;
  border: 1px solid var(--gh-border);
  border-radius: 20px;
}

/* ── Month Group ──────────────────────────────────────────── */
.gh-month-group {
  position: relative;
  padding-left: 28px;
  margin-bottom: 20px;
}

.gh-month-group::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 20px;
  bottom: 0;
  width: 1px;
  background: var(--gh-border);
}

.gh-month-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.gh-timeline-dot {
  position: absolute;
  left: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--gh-bg);
  border: 2px solid var(--gh-border);
}

.gh-month-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gh-text);
}

.gh-month-badge {
  font-size: 0.7rem;
  color: var(--gh-text-muted);
  background: var(--gh-bg-secondary);
  border: 1px solid var(--gh-border);
  padding: 1px 8px;
  border-radius: 20px;
}

/* ── Commits Card ─────────────────────────────────────────── */
.gh-commits-card {
  border: 1px solid var(--gh-border);
  border-radius: 6px;
  background: var(--gh-bg);
  overflow: hidden;
}

.gh-commit-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--gh-border);
  cursor: pointer;
  transition: background 0.1s;
}

.gh-commit-row:last-child {
  border-bottom: none;
}

.gh-commit-row:hover {
  background: var(--gh-bg-secondary);
}

.gh-commit-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--gh-bg-secondary);
  border: 1px solid var(--gh-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gh-text-muted);
  flex-shrink: 0;
}

.gh-commit-info {
  flex: 1;
  min-width: 0;
}

.gh-commit-msg {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gh-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.1s;
}

.gh-commit-row:hover .gh-commit-msg {
  color: var(--gh-link);
}

.gh-commit-meta {
  display: flex;
  gap: 6px;
  margin-top: 3px;
  flex-wrap: wrap;
  align-items: center;
}

.gh-repo-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  color: var(--gh-badge-color);
  background: var(--gh-badge-bg);
  border: 1px solid var(--gh-badge-border);
  padding: 1px 8px;
  border-radius: 20px;
}

.gh-tag-badge {
  font-size: 0.68rem;
  color: var(--gh-text-muted);
  background: var(--gh-bg-secondary);
  border: 1px solid var(--gh-border);
  padding: 1px 7px;
  border-radius: 20px;
}

.gh-commit-date {
  font-size: 0.72rem;
  color: var(--gh-text-subtle);
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

/* ── Tooltip ──────────────────────────────────────────────── */
.gh-tooltip {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  background: #1b1f24;
  color: #e6edf3;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.75rem;
  box-shadow: 0 8px 24px rgba(0,0,0,.4);
  white-space: normal;
  max-width: 220px;
  line-height: 1.5;
}

.gh-tooltip ul {
  margin: 6px 0 0;
  padding-left: 14px;
}

.gh-tooltip li {
  font-size: 0.7rem;
  color: #8b949e;
  line-height: 1.6;
}

/* ── 折叠交互 ─────────────────────────────────��───────────── */
.gh-collapsible {
  cursor: pointer;
  user-select: none;
}

.gh-chevron {
  flex-shrink: 0;
  color: var(--gh-text-muted);
  transition: transform 0.2s ease;
  transform: rotate(0deg);
}

.gh-chevron.open {
  transform: rotate(90deg);
}

.gh-year-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.gh-year-total {
  font-size: 0.72rem;
  font-weight: 400;
  color: var(--gh-text-muted);
  background: var(--gh-bg-secondary);
  border: 1px solid var(--gh-border);
  padding: 1px 8px;
  border-radius: 20px;
}

.gh-year-divider:hover .gh-year-label {
  color: var(--gh-link);
}

.gh-chevron--month {
  margin-left: auto;
}

.gh-month-header.gh-collapsible:hover .gh-month-title {
  color: var(--gh-link);
}

/* ── 响应式 ───────────────────────────────────────────────── */
@media (max-width: 640px) {
  .gh-archive { padding: 0 0.75rem 3rem; }
  .gh-card { padding: 12px; }
  .gh-profile-header { padding: 1.5rem 0 1rem; }
  .gh-username { font-size: 1.25rem; }
  .gh-contrib-section { flex-direction: column; }
  .gh-year-sidebar { flex-direction: row; flex-wrap: wrap; }
  .gh-stats-row { flex-wrap: wrap; }
  .gh-stat { min-width: calc(33.33% - 1px); }
  .gh-commit-date svg { display: none; }
}
</style>
