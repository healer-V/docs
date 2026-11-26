<template>
  <div class="home-page">
    <section class="home-hero">
      <div class="home-wrap home-hero__grid">
        <div class="home-hero__main">
          <p class="home-eyebrow">XIANLING DOCS <span>/ 个人技术知识库</span></p>
          <h1 class="home-hero__title">构建自身<br><em>知识体系<svg viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path d="M3 9c40-6 90-7 194-2" /></svg></em></h1>
          <p class="home-hero__lead">学过却遗忘的知识，回来复习；还没接触的技术，按顺序从 0 学起。</p>

          <ol class="home-steps">
            <li>
              <a href="#home-review">
                <span class="home-steps__no">01</span>
                <span><b>随机抽一篇，先回忆再对照</b><small>从全部正文中抽取，换一篇不刷新页面</small></span>
                <svg class="home-icon home-icon--sm" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.chevron" />
              </a>
            </li>
            <li>
              <a href="#home-path">
                <span class="home-steps__no">02</span>
                <span><b>沿一条路线学下去</b><small>每个方向按模块排序，从第一篇开始</small></span>
                <svg class="home-icon home-icon--sm" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.chevron" />
              </a>
            </li>
            <li>
              <a :href="withBase('/interview/')">
                <span class="home-steps__no">03</span>
                <span><b>面试题回炉</b><small>按主题刷题，答不上来的点回到正文</small></span>
                <svg class="home-icon home-icon--sm" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.chevron" />
              </a>
            </li>
          </ol>

          <div class="home-actions">
            <a class="home-btn home-btn--brand" :href="withBase(startLink)">
              开始学习
              <svg class="home-icon home-icon--sm" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.arrow" />
            </a>
            <a class="home-btn" :href="withBase('/interview/')">
              <svg class="home-icon home-icon--sm" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.check" />
              面试题库
            </a>
          </div>

          <dl class="home-stats">
            <div><dt>篇文档</dt><dd class="home-stats__total">{{ data.total }}</dd></div>
            <div><dt>个知识方向</dt><dd>{{ data.directions.length }}</dd></div>
            <div v-if="data.lastUpdated"><dt>最近更新</dt><dd>{{ data.lastUpdated.slice(5) }}</dd></div>
          </dl>
        </div>

        <div id="home-review" ref="reviewRef" class="home-review" aria-label="随机复习">
          <div class="home-review__head">
            <b>
              <svg class="home-icon home-icon--sm" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.shuffle" />
              随机复习
            </b>
            <span>从 {{ data.reviewPool.length }} 篇正文中抽取<span class="home-review__hint"> · 可左右拖动</span></span>
          </div>

          <TransitionGroup
            tag="div"
            name="home-deck"
            class="home-review__stack"
            :class="{ 'is-dragging': drag.active && drag.moved }"
            :css="animated"
            :style="{ '--exit-dir': exitDirection }"
          >
            <div
              v-for="(card, depth) in visibleCards"
              :key="card.id"
              class="home-review__card"
              :data-depth="depth"
              :inert="depth > 0"
              :aria-hidden="depth > 0 ? 'true' : undefined"
              :style="cardStyle(depth)"
              @pointerdown="depth === 0 && onPointerDown($event)"
              @pointermove="depth === 0 && onPointerMove($event)"
              @pointerup="depth === 0 && onPointerEnd($event)"
              @pointercancel="depth === 0 && onPointerEnd($event)"
              @click.capture="depth === 0 && onCardClick($event)"
            >
              <div class="home-review__top">
                <span class="home-review__crumb">
                  <template v-if="card.entry">
                    <span class="home-tag">{{ card.entry[2] }}</span>
                    <span v-if="card.entry[3]">{{ card.entry[3] }}</span>
                  </template>
                  <span v-else>&nbsp;</span>
                </span>
                <button class="home-review__swap" type="button" aria-label="换一篇随机复习文章" @click="dealNext(1, $event.detail === 0)">
                  <svg class="home-icon home-icon--sm" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.refresh" />
                  换一篇
                </button>
              </div>
              <p class="home-review__title" :title="card.entry ? card.entry[0] : undefined">{{ card.entry ? card.entry[0] : '正在抽取…' }}</p>
              <ul class="home-review__recall">
                <li v-for="question in RECALL_QUESTIONS" :key="question">
                  <svg class="home-icon home-icon--sm" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.circle" />
                  {{ question }}
                </li>
              </ul>
              <div class="home-review__foot">
                <span>先在心里回答，再打开文章对照</span>
                <a v-if="card.entry" class="home-review__open" :href="withBase(card.entry[1])" draggable="false">
                  打开对照
                  <svg class="home-icon home-icon--sm" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.arrow" />
                </a>
              </div>
            </div>
          </TransitionGroup>

          <p v-if="alternates.length" class="home-review__chips">
            <span>换一道看：</span>
            <a v-for="item in alternates" :key="item[1]" :href="withBase(item[1])" :title="item[0]">{{ item[0] }}</a>
          </p>
        </div>
      </div>
    </section>

    <section id="home-path" class="home-section">
      <div class="home-wrap">
        <header class="home-section__head">
          <p>LEARNING PATH</p>
          <h2>一条线学下去，不用纠结先看哪个</h2>
          <span>每个方向的核心模块按学习顺序排好，篇数由构建时统计</span>
        </header>

        <div class="home-tabs" role="tablist" aria-label="学习路线方向">
          <button
            v-for="direction in pathDirections"
            :id="`home-path-tab-${direction.key}`"
            :key="direction.key"
            type="button"
            role="tab"
            :aria-selected="direction.key === activePath.key"
            aria-controls="home-path-panel"
            @click="activeKey = direction.key"
          >
            {{ direction.label }}
          </button>
        </div>

        <div id="home-path-panel" role="tabpanel" :aria-labelledby="`home-path-tab-${activePath.key}`">
          <ol class="home-track">
            <li v-for="(module, index) in activePath.modules" :key="module.link" class="home-station" :class="{ 'home-station--first': index === 0 }">
              <span class="home-station__dot" aria-hidden="true" />
              <a class="home-station__card" :href="withBase(module.link)">
                <span class="home-station__no">第 {{ index + 1 }} 站</span>
                <b>{{ module.label }}</b>
                <span class="home-station__count">{{ module.count }} 篇</span>
                <span v-if="index === 0" class="home-station__first">从「{{ module.firstTitle }}」开始</span>
                <span class="home-station__start">
                  {{ index === 0 ? '开始学习' : '进入模块' }}
                  <svg class="home-icon home-icon--xs" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.arrow" />
                </span>
              </a>
            </li>
          </ol>
          <p class="home-track__note">
            {{ activePath.label }}主线 {{ activePath.modules.length }} 站 · 共 {{ pathTotal }} 篇 · {{ otherDirections }}见下方知识方向
          </p>
        </div>
      </div>
    </section>

    <section class="home-section home-section--alt">
      <div class="home-wrap">
        <header class="home-section__head">
          <p>KNOWLEDGE MAP</p>
          <h2>全部知识方向</h2>
          <span>{{ data.directions.length }} 个方向，覆盖前端、后端、AI、运维到面试实践</span>
        </header>

        <div class="home-dirs">
          <a v-for="direction in data.directions" :key="direction.key" class="home-dir" :href="withBase(direction.modules[0].link)">
            <span class="home-dir__head">
              <span class="home-dir__icon">
                <svg class="home-icon" viewBox="0 0 24 24" aria-hidden="true" v-html="icons[direction.icon]" />
              </span>
              <em>{{ direction.count }} 篇</em>
            </span>
            <h3>{{ direction.label }}</h3>
            <span class="home-dir__desc">{{ direction.description }}</span>
            <span class="home-dir__mods">{{ direction.modules.slice(0, 5).map((module) => module.label).join(' · ') }}</span>
            <span class="home-dir__go">
              进入{{ direction.label }}
              <svg class="home-icon home-icon--xs" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.arrow" />
            </span>
          </a>
        </div>
      </div>
    </section>

    <section class="home-section">
      <div class="home-wrap home-feed">
        <div>
          <div class="home-feed__head">
            <h2>最近更新</h2>
            <span>按 git 提交日期，取最近 {{ data.recentGroups.length }} 天</span>
          </div>
          <ul v-if="recentItems.length" class="home-posts">
            <li v-for="item in recentItems" :key="item.link">
              <a class="home-post" :href="withBase(item.link)">
                <span>
                  <b>{{ item.title }}</b>
                  <span class="home-post__meta">
                    <span class="home-post__tag">
                      <svg class="home-icon home-icon--xs" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.folder" />
                      {{ item.direction }} · {{ item.tag }}
                    </span>
                    <span>
                      <svg class="home-icon home-icon--xs" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.clock" />
                      {{ item.date.slice(5) }}
                    </span>
                  </span>
                </span>
                <svg class="home-icon home-icon--sm" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.chevron" />
              </a>
            </li>
          </ul>
          <p v-else class="home-feed__empty">暂无更新记录</p>
          <p v-if="data.recentGroups.length" class="home-feed__more">
            {{ data.recentGroups.map((group) => `${group.date.slice(5)} 共更新 ${group.total} 篇`).join(' · ') }}
          </p>
        </div>

        <aside class="home-side">
          <div class="home-panel">
            <h3>
              <svg class="home-icon home-icon--sm" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.chart" />
              写作节奏
            </h3>
            <dl class="home-kv">
              <div v-for="group in data.recentGroups.slice(0, 2)" :key="group.date">
                <dt>篇 · {{ group.date.slice(5) }}</dt><dd>{{ group.total }}</dd>
              </div>
              <div v-if="data.firstCommit"><dt>首次提交</dt><dd>{{ data.firstCommit.slice(0, 7) }}</dd></div>
              <div v-if="data.commitCount"><dt>次提交</dt><dd>{{ data.commitCount }}</dd></div>
            </dl>
          </div>

          <div class="home-panel">
            <h3>
              <svg class="home-icon home-icon--sm" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.check" />
              面试题复习
            </h3>
            <div class="home-qa">
              <a v-for="topic in data.interviewTopics" :key="topic.link" :href="withBase(topic.link)">{{ topic.label }}</a>
            </div>
            <a class="home-panel__all" :href="withBase('/interview/')">
              进入面试题库
              <svg class="home-icon home-icon--xs" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.arrow" />
            </a>
          </div>
        </aside>
      </div>
    </section>

    <section class="home-band">
      <div class="home-wrap">
        <a class="home-band__link" :href="withBase('/about/')">
          <span class="home-dir__icon">
            <svg class="home-icon" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.book" />
          </span>
          <span>
            <b>站内没讲到的，去学习资源找</b>
            <small>{{ resourceTotal }} 个外部教程、原理拆解、深度专栏与社区，按类别整理</small>
          </span>
          <span class="home-btn home-btn--brand">
            打开学习资源
            <svg class="home-icon home-icon--sm" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.arrow" />
          </span>
        </a>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { withBase } from 'vitepress'
import { data } from './homePage.data.js'
import { resourceTotal } from './learningResources.js'

const RECALL_QUESTIONS = ['它解决什么问题？', '核心机制能说出几步？', '有哪些常见坑和边界？']
const PATH_DIRECTION_COUNT = 4
const ALTERNATE_COUNT = 3
const STACK_DEPTH = 3
const SWIPE_THRESHOLD = 96
const DRAG_START_DISTANCE = 6

// 线性图标统一使用 24px 视图框和 currentColor 描边，由外层 SVG 控制线宽与颜色。
const icons = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  shuffle: '<path d="M3 7h3.5c2 0 3.2 1 4.2 2.6l2.6 4.8c1 1.6 2.2 2.6 4.2 2.6H21M17.5 4 21 7l-3.5 3M3 17h3.5c1.4 0 2.4-.5 3.2-1.3M13.8 8.3c.8-.8 1.8-1.3 3.2-1.3M17.5 14l3.5 3-3.5 3"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.6-4.5M4 4v3h3M4 13a8 8 0 0 0 14.6 4.5M20 20v-3h-3"/>',
  circle: '<circle cx="12" cy="12" r="7"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  folder: '<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  layout: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/>',
  server: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  infinity: '<path d="M6 16c-2.2 0-4-1.8-4-4s1.8-4 4-4c4 0 8 8 12 8 2.2 0 4-1.8 4-4s-1.8-4-4-4c-4 0-8 8-12 8z"/>',
  cube: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
  phone: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18h2"/>',
  tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.3-.6-.6-2.3z"/>',
  check: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8.5 12 2.2 2.2 4.8-4.7M8 17h8"/>',
  book: '<path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5zM12 6.5v13"/>',
}

const startLink = data.directions[0].modules[0].link

// 学习路线只展示前四个主方向，其余方向在知识方向网格中进入。
const pathDirections = data.directions.slice(0, PATH_DIRECTION_COUNT)
const activeKey = ref(pathDirections[0].key)
const activePath = computed(() => pathDirections.find((direction) => direction.key === activeKey.value))
const pathTotal = computed(() => activePath.value.modules.reduce((sum, module) => sum + module.count, 0))
const otherDirections = `还有 ${data.directions.slice(PATH_DIRECTION_COUNT).map((direction) => direction.label).join('、')}`

const recentItems = data.recentGroups.flatMap((group) => group.items.map((item) => ({ ...item, date: group.date })))

// 随机复习牌堆：只在浏览器挂载后抽取，服务端渲染三张占位卡，避免 hydration 不一致。
const placeholderCards = Array.from({ length: STACK_DEPTH }, (_, index) => ({ id: `placeholder-${index}`, entry: null }))
const deck = ref([])
const alternates = ref([])
const visibleCards = computed(() => (deck.value.length ? deck.value.slice(0, STACK_DEPTH) : placeholderCards))
const reviewRef = ref(null)
// 首次用真实卡片替换占位卡时不播放过渡，之后的发牌才启用动画。
const animated = ref(false)
const exitDirection = ref(1)
const drag = reactive({ active: false, moved: false, startX: 0, x: 0 })
let nextCardId = 0
let suppressClick = false

onMounted(async () => {
  deck.value = sample(STACK_DEPTH, new Set()).map(createCard)
  refreshAlternates()
  await nextTick()
  animated.value = true
})

/**
 * 从正文池随机抽取不重复的若干篇，并排除指定路由。
 *
 * @param {number} count 需要的篇数。
 * @param {Set<string>} excluded 需要排除的站内路由。
 * @returns {[string, string, string, string][]} 抽中的正文元组。
 */
function sample(count, excluded) {
  const candidates = data.reviewPool.filter((item) => !excluded.has(item[1]))
  const picked = []
  while (picked.length < count && candidates.length > 0) {
    picked.push(candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0])
  }
  return picked
}

/**
 * 为正文元组分配唯一卡片编号，供 TransitionGroup 区分进出场的卡片。
 *
 * @param {[string, string, string, string]} entry 正文元组。
 * @returns {{ id: number, entry: [string, string, string, string] }} 牌堆中的卡片。
 */
function createCard(entry) {
  nextCardId += 1
  return { id: nextCardId, entry }
}

/**
 * 重新抽取“换一道看”的备选文章，排除牌堆中已有的文章。
 *
 * @returns {void} 更新备选列表。
 */
function refreshAlternates() {
  alternates.value = sample(ALTERNATE_COUNT, new Set(deck.value.map((card) => card.entry[1])))
}

/**
 * 将顶部卡片向指定方向移出，后面的卡片依次上移，并在底部补入一张新卡。
 *
 * @param {-1 | 1} direction 顶部卡片飞出的方向，-1 向左、1 向右。
 * @param {boolean} [restoreFocus=false] 是否把焦点移到新顶部卡片的“换一篇”按钮，供键盘操作连续切换。
 * @returns {Promise<void>} 发牌和焦点恢复完成。
 */
async function dealNext(direction, restoreFocus = false) {
  if (deck.value.length === 0) return
  exitDirection.value = direction
  const [top, ...rest] = deck.value
  const [incoming] = sample(1, new Set(deck.value.map((card) => card.entry[1])))
  deck.value = [...rest, createCard(incoming ?? top.entry)]
  drag.x = 0
  refreshAlternates()
  if (!restoreFocus) return
  await nextTick()
  reviewRef.value
    ?.querySelector('.home-review__card[data-depth="0"]:not(.home-deck-leave-active) .home-review__swap')
    ?.focus()
}

/**
 * 在顶部卡片上按下指针时记录起点；按钮交给自身的点击处理。
 *
 * @param {PointerEvent} event 指针按下事件。
 * @returns {void}
 */
function onPointerDown(event) {
  suppressClick = false
  if (event.button !== 0 || event.target.closest('button')) return
  Object.assign(drag, { active: true, moved: false, startX: event.clientX, x: 0 })
}

/**
 * 水平移动超过阈值后进入拖动，并捕获指针，使卡片跟随手指或鼠标移动。
 *
 * @param {PointerEvent} event 指针移动事件。
 * @returns {void}
 */
function onPointerMove(event) {
  if (!drag.active) return
  const offset = event.clientX - drag.startX
  if (!drag.moved) {
    if (Math.abs(offset) < DRAG_START_DISTANCE) return
    drag.moved = true
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  drag.x = offset
}

/**
 * 松开指针时，拖动距离超过阈值就切换到下一张，否则卡片回弹到原位。
 *
 * @param {PointerEvent} event 指针抬起或取消事件。
 * @returns {void}
 */
function onPointerEnd(event) {
  if (!drag.active) return
  const { moved, x } = drag
  drag.active = false
  drag.moved = false
  if (!moved) return
  suppressClick = event.type === 'pointerup'
  if (Math.abs(x) >= SWIPE_THRESHOLD) {
    dealNext(x > 0 ? 1 : -1)
  } else {
    drag.x = 0
  }
}

/**
 * 拖动结束后浏览器仍会派发一次点击，拦截它以免误触“打开对照”链接。
 *
 * @param {MouseEvent} event 捕获阶段的点击事件。
 * @returns {void}
 */
function onCardClick(event) {
  if (!suppressClick) return
  suppressClick = false
  event.preventDefault()
  event.stopPropagation()
}

/**
 * 计算牌堆中每张卡片的层级、偏移和拖动旋转角度。
 *
 * @param {number} depth 卡片在牌堆中的位置，0 为顶部。
 * @returns {Record<string, string | number>} 内联样式变量。
 */
function cardStyle(depth) {
  const progress = Math.min(Math.abs(drag.x) / SWIPE_THRESHOLD, 1)
  return {
    '--depth': depth === 0 ? 0 : depth - progress * 0.5,
    '--drag-x': depth === 0 ? `${drag.x}px` : '0px',
    '--drag-r': depth === 0 ? `${drag.x / 20}deg` : '0deg',
    zIndex: STACK_DEPTH - depth,
  }
}
</script>

<style>
/* 首页使用自身的网格底纹，关闭全站默认的多色极光与点阵背景。 */
.VPHome:has(.home-page)::before,
.VPHome:has(.home-page)::after {
  display: none;
}
</style>

<style scoped>
.home-page {
  --home-accent: #0369a1;
  --home-accent-fill: #0284c7;
  --home-accent-line: rgba(14, 165, 233, 0.35);
  --home-accent-soft: rgba(14, 165, 233, 0.08);
  --home-on-accent: #fff;
  --home-card: var(--vp-c-bg);
  --home-grid: rgba(15, 23, 42, 0.045);
  --home-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06);
  position: relative;
  z-index: 1;
  color: var(--vp-c-text-1);
}

html.dark .home-page {
  --home-accent: #22d3ee;
  --home-accent-fill: #22d3ee;
  --home-accent-line: rgba(34, 211, 238, 0.35);
  --home-accent-soft: rgba(34, 211, 238, 0.08);
  --home-on-accent: #0b1220;
  --home-card: var(--vp-c-bg-soft);
  --home-grid: rgba(255, 255, 255, 0.035);
  --home-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.25);
}

.home-page a {
  color: inherit;
  text-decoration: none;
}

.home-page a:focus-visible,
.home-page button:focus-visible {
  outline: 2px solid var(--home-accent);
  outline-offset: 2px;
  border-radius: 8px;
}

.home-page h1,
.home-page h2,
.home-page h3,
.home-page p,
.home-page dl,
.home-page dd,
.home-page ol,
.home-page ul {
  margin: 0;
  padding: 0;
  border: 0;
}

.home-page ol,
.home-page ul {
  list-style: none;
}

.home-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.home-icon {
  width: 18px;
  height: 18px;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.home-icon--xs { width: 14px; height: 14px; }
.home-icon--sm { width: 16px; height: 16px; }

.home-tag {
  padding: 1px 8px;
  border-radius: 4px;
  background: var(--home-accent-soft);
  color: var(--home-accent);
  font-size: 12px;
}

.home-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 46px;
  padding: 0 22px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--home-card);
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  transition: border-color 0.2s;
}

.home-btn:hover {
  border-color: var(--home-accent-line);
}

.home-btn--brand {
  border-color: var(--home-accent-fill);
  background: var(--home-accent-fill);
  color: var(--home-on-accent) !important;
}

/* 首屏：网格纸底纹，左侧用法与入口，右侧随机复习卡 */
.home-hero {
  position: relative;
  padding: 56px 0;
  border-bottom: 1px solid var(--vp-c-divider);
  background:
    linear-gradient(var(--home-grid) 1px, transparent 1px) 0 0 / 32px 32px,
    linear-gradient(90deg, var(--home-grid) 1px, transparent 1px) 0 0 / 32px 32px;
}

.home-hero::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: 120px;
  background: linear-gradient(transparent, var(--vp-c-bg));
  pointer-events: none;
}

.home-hero__grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 48px;
}

.home-eyebrow {
  display: flex;
  gap: 10px;
  color: var(--home-accent);
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
  letter-spacing: 0.12em;
}

.home-eyebrow span {
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-base);
  letter-spacing: 0;
}

.home-hero__title {
  margin: 16px 0 18px !important;
  font-size: 42px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.home-hero__title em {
  position: relative;
  color: var(--home-accent);
  font-style: normal;
  white-space: nowrap;
}

.home-hero__title em svg {
  position: absolute;
  right: 0;
  bottom: -10px;
  left: 0;
  width: 100%;
  height: 14px;
  fill: none;
  stroke: var(--home-accent-fill);
  stroke-width: 3;
  stroke-linecap: round;
}

.home-hero__lead {
  max-width: 520px;
  color: var(--vp-c-text-2);
  font-size: 16px;
  line-height: 1.75;
}

.home-steps {
  display: grid;
  gap: 10px;
  max-width: 540px;
  margin: 28px 0 30px !important;
}

.home-steps a {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  min-height: 44px;
  padding: 12px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--home-card);
  transition: border-color 0.2s, transform 0.2s;
}

.home-steps a:hover {
  border-color: var(--home-accent-line);
  transform: translateX(2px);
}

.home-steps__no {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1.5px solid var(--home-accent-line);
  border-radius: 8px;
  color: var(--home-accent);
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
}

.home-steps b {
  display: block;
  font-size: 15px;
  font-weight: 600;
}

.home-steps small {
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.home-steps .home-icon {
  color: var(--vp-c-text-3);
}

.home-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.home-stats {
  display: flex;
  gap: 36px;
  margin-top: 30px !important;
}

.home-stats div {
  display: flex;
  flex-direction: column-reverse;
}

.home-stats dt {
  color: var(--vp-c-text-3);
  font-size: 12.5px;
}

.home-stats dd {
  font-family: var(--vp-font-family-mono);
  font-size: 26px;
  font-weight: 600;
  line-height: 1.2;
}

.home-review {
  align-self: center;
  scroll-margin-top: 96px;
}

.home-review__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.home-review__head b {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.home-review__head b .home-icon {
  color: var(--home-accent);
}

.home-review__stack {
  /* 所有卡片叠在同一个网格单元里，牌堆高度取最高的一张，后面的卡片从底边露出 */
  display: grid;
  margin-bottom: 26px;
}

.home-review__card {
  position: relative;
  grid-area: 1 / 1;
  padding: 22px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--home-card);
  transform-origin: 50% 100%;
  transform:
    translate3d(var(--drag-x, 0px), calc(var(--depth, 0) * 13px), 0)
    rotate(var(--drag-r, 0deg))
    scale(calc(1 - var(--depth, 0) * 0.05));
  transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.45s, box-shadow 0.45s;
  touch-action: pan-y;
}

.home-review__card[data-depth='0'] {
  box-shadow: var(--home-shadow);
  cursor: grab;
}

/* 后面的卡片只露出卡面，升到顶部后内容再淡入，避免切换途中文字重叠 */
.home-review__card > * {
  transition: opacity 0.3s 0.12s;
}

.home-review__card:not([data-depth='0']) > * {
  opacity: 0;
  transition-delay: 0s;
}

.home-review__stack.is-dragging .home-review__card {
  transition: none;
}

.home-review__stack.is-dragging .home-review__card[data-depth='0'] {
  cursor: grabbing;
  user-select: none;
}

.home-review__open {
  -webkit-user-drag: none;
}

.home-review__hint {
  display: none;
}

.home-review__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.home-review__crumb {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--vp-c-text-3);
  font-size: 12.5px;
}

.home-review__swap {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  color: var(--vp-c-text-2);
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}

.home-review__swap:hover {
  border-color: var(--home-accent-line);
  color: var(--home-accent);
}

.home-review__title {
  /* 固定两行高度并截断超长标题，保证每张卡片等高，“换一篇”按钮位置不随标题长度跳动 */
  display: -webkit-box;
  overflow: hidden;
  min-height: 2.7em;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  margin: 14px 0 16px !important;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: -0.01em;
}

.home-review__recall {
  display: grid;
  gap: 8px;
  padding-top: 14px !important;
  border-top: 1px dashed var(--vp-c-divider) !important;
}

.home-review__recall li {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--vp-c-text-2);
  font-size: 14px;
}

.home-review__recall .home-icon {
  color: var(--vp-c-text-3);
}

.home-review__foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-3);
  font-size: 13px;
}

.home-review__open {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 36px;
  color: var(--home-accent) !important;
  font-size: 14px;
  font-weight: 600;
}

.home-review__chips {
  /* 备选文章固定单行，避免换行改变复习区总高度，进而让居中的卡片上下移动 */
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
  margin-top: 30px !important;
  overflow: hidden;
  color: var(--vp-c-text-3);
  font-size: 13px;
}

.home-review__chips > span {
  flex: none;
}

.home-review__chips a {
  overflow: hidden;
  min-width: 0;
  padding: 4px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--home-card);
  color: var(--vp-c-text-2);
  line-height: 22px;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s, border-color 0.2s;
}

.home-review__chips a:hover {
  border-color: var(--home-accent-line);
  color: var(--home-accent);
}

/* 发牌动画：顶部卡片朝 --exit-dir 方向甩出，新卡片从牌堆底部浮现 */
.home-deck-leave-active {
  z-index: 4 !important;
  pointer-events: none;
  transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-in;
}

.home-review__card.home-deck-leave-to {
  opacity: 0;
  transform:
    translate3d(calc(var(--exit-dir) * 115%), -18px, 0)
    rotate(calc(var(--exit-dir) * 14deg));
}

.home-review__card.home-deck-enter-from {
  opacity: 0;
  transform: translate3d(0, calc(var(--depth, 0) * 13px + 28px), 0) scale(0.85);
}

/* 区块通用标题 */
.home-section {
  padding: 64px 0;
  scroll-margin-top: 64px;
}

.home-section--alt {
  border-top: 1px solid var(--vp-c-divider);
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-alt);
}

.home-section__head {
  margin-bottom: 36px;
  text-align: center;
}

.home-section__head p {
  color: var(--home-accent);
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
  letter-spacing: 0.12em;
}

.home-section__head h2 {
  margin: 6px 0 !important;
  font-size: 26px;
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.home-section__head span {
  color: var(--vp-c-text-2);
  font-size: 15px;
}

/* 学习路线 */
.home-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 32px;
  overflow-x: auto;
}

.home-tabs button {
  flex: none;
  min-height: 40px;
  padding: 0 18px;
  border: 1px solid transparent;
  border-radius: 999px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
}

.home-tabs button:hover {
  color: var(--home-accent);
}

.home-tabs button[aria-selected='true'] {
  border-color: var(--home-accent-line);
  background: var(--home-accent-soft);
  color: var(--home-accent);
  font-weight: 600;
}

.home-track {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.home-station {
  display: flex;
  flex-direction: column;
}

.home-station__dot {
  display: none;
}

.home-station__card {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--home-card);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.home-station__card:hover,
.home-station--first .home-station__card {
  border-color: var(--home-accent-line);
}

.home-station__card:hover {
  box-shadow: var(--home-shadow);
}

.home-station__no {
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
}

.home-station__card b {
  margin: 2px 0 6px;
  font-size: 17px;
}

.home-station__count {
  margin-bottom: 10px;
  color: var(--vp-c-text-2);
  font-size: 12.5px;
}

.home-station__first {
  margin-bottom: 10px;
  color: var(--vp-c-text-2);
  font-size: 12.5px;
  line-height: 1.5;
}

.home-station__start {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px dashed var(--vp-c-divider);
  color: var(--home-accent);
  font-size: 12.5px;
}

.home-track__note {
  margin-top: 28px !important;
  color: var(--vp-c-text-3);
  font-size: 13px;
  text-align: center;
}

/* 知识方向 */
.home-dirs {
  display: grid;
  gap: 16px;
}

.home-dir {
  display: flex;
  flex-direction: column;
  padding: 22px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--home-card);
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}

.home-dir:hover {
  border-color: var(--home-accent-line);
  box-shadow: var(--home-shadow);
  transform: translateY(-2px);
}

.home-dir__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.home-dir__head em {
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  font-style: normal;
}

.home-dir__icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  color: var(--home-accent);
}

.home-dir h3 {
  margin: 14px 0 4px !important;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
}

.home-dir__desc {
  flex: 1;
  color: var(--vp-c-text-2);
  font-size: 13.5px;
  line-height: 1.6;
}

.home-dir__mods {
  margin-top: 12px;
  color: var(--vp-c-text-3);
  font-size: 12.5px;
}

.home-dir__go {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 14px;
  color: var(--home-accent);
  font-size: 13.5px;
}

/* 最近更新与侧栏 */
.home-feed {
  display: grid;
  gap: 32px;
  align-items: start;
}

.home-feed__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
}

.home-feed__head h2 {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.3;
}

.home-feed__head span,
.home-feed__more,
.home-feed__empty {
  color: var(--vp-c-text-3);
  font-size: 13px;
}

.home-feed__more {
  margin-top: 14px !important;
  text-align: right;
}

.home-posts {
  display: grid;
  gap: 12px;
}

.home-post {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--home-card);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.home-post:hover {
  border-color: var(--home-accent-line);
  box-shadow: var(--home-shadow);
}

.home-post b {
  display: block;
  font-size: 16px;
  font-weight: 600;
}

.home-post > .home-icon {
  color: var(--vp-c-text-3);
}

.home-post__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 6px;
  color: var(--vp-c-text-3);
  font-size: 12.5px;
}

.home-post__meta > span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.home-post__tag {
  color: var(--home-accent);
}

.home-side {
  display: grid;
  gap: 20px;
}

.home-panel {
  padding: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--home-card);
}

.home-panel h3 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px !important;
  color: var(--vp-c-text-3);
  font-size: 13px;
  font-weight: 600;
}

.home-kv {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.home-kv div {
  display: flex;
  flex-direction: column-reverse;
}

.home-kv dt {
  color: var(--vp-c-text-3);
  font-size: 12px;
}

.home-kv dd {
  font-family: var(--vp-font-family-mono);
  font-size: 18px;
  font-weight: 600;
}

.home-qa {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.home-qa a {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 4px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  color: var(--vp-c-text-2);
  font-size: 13px;
  transition: color 0.2s, border-color 0.2s;
}

.home-qa a:hover {
  border-color: var(--home-accent-line);
  color: var(--home-accent);
}

.home-panel__all {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 14px;
  color: var(--home-accent) !important;
  font-size: 13px;
}

/* 学习资源横幅 */
.home-band {
  padding: 0 0 72px;
}

.home-band__link {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background:
    linear-gradient(var(--home-grid) 1px, transparent 1px) 0 0 / 24px 24px,
    linear-gradient(90deg, var(--home-grid) 1px, transparent 1px) 0 0 / 24px 24px,
    var(--home-card);
  transition: border-color 0.2s;
}

.home-band__link:hover {
  border-color: var(--home-accent-line);
}

.home-band__link b {
  display: block;
  font-size: 19px;
}

.home-band__link small {
  color: var(--vp-c-text-2);
  font-size: 14px;
}

@media (min-width: 640px) {
  .home-hero__title { font-size: 52px; }
  .home-review__card { padding: 24px 26px; }
  .home-review__title { font-size: 26px; }
  .home-review__hint { display: inline; }
  .home-track { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .home-dirs { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .home-side { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .home-tabs { justify-content: center; }
  .home-section { padding: 80px 0; }
  .home-section__head h2 { font-size: 32px; }
  .home-band__link { flex-direction: row; align-items: center; gap: 20px; padding: 28px 32px; }
  .home-band__link .home-btn { margin-left: auto; }
}

@media (min-width: 960px) {
  .home-hero { padding: 72px 0 64px; }
  .home-hero__grid { grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr); gap: 56px; align-items: center; }
  .home-hero__title { font-size: 60px; }
  .home-dirs { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .home-feed { grid-template-columns: minmax(0, 1fr) 340px; }
  .home-side { position: sticky; top: 88px; grid-template-columns: 1fr; }
}

@media (min-width: 1100px) {
  .home-wrap { padding: 0 32px; }
  .home-track { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  .home-track::before {
    content: '';
    position: absolute;
    top: 11px;
    right: 8%;
    left: 8%;
    height: 2px;
    background: var(--vp-c-divider);
  }
  .home-station__dot {
    position: relative;
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    margin: 0 auto 18px;
    border: 2px solid var(--vp-c-divider);
    border-radius: 50%;
    background: var(--vp-c-bg);
  }
  .home-station--first .home-station__dot { border-color: var(--home-accent-fill); }
  .home-station--first .home-station__dot::after {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--home-accent-fill);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-page * { transition: none !important; }
}
</style>
