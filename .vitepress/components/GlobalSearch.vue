<template>
  <div class="global-search">
    <button
      class="global-search__trigger"
      type="button"
      aria-label="搜索全部文档"
      title="搜索全部文档"
      @click="openSearch"
    >
      <span class="vpi-search global-search__trigger-icon" aria-hidden="true" />
      <span class="global-search__trigger-label">搜索</span>
    </button>

    <Teleport to="body">
      <dialog
        ref="dialogElement"
        class="global-search-dialog"
        aria-labelledby="global-search-title"
        @click="handleBackdropClick"
        @close="handleDialogClosed"
      >
        <section class="global-search-panel">
          <header class="global-search-panel__header">
            <h2 id="global-search-title">搜索全部文档</h2>
            <button
              class="global-search-panel__close"
              type="button"
              aria-label="关闭搜索"
              title="关闭搜索"
              @click="closeSearch"
            >
              <span class="vpi-delete" aria-hidden="true" />
            </button>
          </header>

          <div class="global-search-panel__controls">
            <label class="global-search-field">
              <span class="vpi-search" aria-hidden="true" />
              <span class="sr-only">搜索关键词</span>
              <input
                ref="queryInput"
                v-model="query"
                type="search"
                autocomplete="off"
                placeholder="输入技术主题或关键词"
                @input="handleQueryInput"
              >
            </label>

            <label class="global-search-filter">
              <span class="sr-only">文档模块</span>
              <select v-model="selectedUnit" @change="handleFilterChange">
                <option
                  v-for="option in unitOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>
          </div>

          <div class="global-search-panel__body" aria-live="polite" :aria-busy="isLoading">
            <p v-if="loadError" class="global-search-state global-search-state--error">
              {{ loadError }}
              <button type="button" @click="retrySearch">重新加载</button>
            </p>
            <p v-else-if="isLoading" class="global-search-state">正在检索...</p>
            <p v-else-if="!query.trim()" class="global-search-state">输入关键词开始搜索</p>
            <p v-else-if="results.length === 0" class="global-search-state">没有匹配的文档</p>
            <template v-else>
              <p class="global-search-summary">找到 {{ resultCount }} 条结果，显示前 {{ results.length }} 条</p>
              <ol class="global-search-results">
                <li v-for="result in results" :key="result.id">
                  <!-- 同单元跳转会复用导航组件，选中文档时主动关闭原生弹窗。 -->
                  <a class="global-search-result" :href="result.url" @click="closeSearch">
                    <span class="global-search-result__content">
                      <strong>{{ result.title }}</strong>
                      <span>{{ result.excerpt }}</span>
                      <small>{{ unitLabel(result.unit) }}</small>
                    </span>
                    <span class="vpi-chevron-right global-search-result__arrow" aria-hidden="true" />
                  </a>
                </li>
              </ol>
            </template>
          </div>
        </section>
      </dialog>
    </Teleport>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { withBase } from 'vitepress'

const dialogElement = ref(null)
const queryInput = ref(null)
const query = ref('')
const selectedUnit = ref('all')
const isLoading = ref(false)
const loadError = ref('')
const results = ref([])
const resultCount = ref(0)
let pagefindModulePromise = null
let activeSearchId = 0

const unitOptions = Object.freeze([
  { value: 'all', label: '全部模块' },
  { value: 'frontend', label: '前端' },
  { value: 'backend', label: '后端' },
  { value: 'operation', label: '运维' },
  { value: 'ai', label: 'AI' },
  { value: 'web3', label: 'Web3' },
  { value: 'ecosystem', label: '生态与实践' },
  { value: 'portal', label: '站点页面' },
])

/**
 * 延迟加载合并站点唯一的 Pagefind 浏览器模块。
 *
 * @returns {Promise<object>} Pagefind 浏览器搜索 API 与完整标题列表。
 */
async function loadPagefind() {
  if (!pagefindModulePromise) {
    const moduleUrl = withBase('/pagefind/pagefind.js')
    pagefindModulePromise = initializePagefind(moduleUrl)
  }
  return pagefindModulePromise
}

/**
 * 导入 Pagefind 模块并显式使用中文索引，避免 `zh-CN` 与索引键 `zh` 不一致。
 *
 * @param {string} moduleUrl Pagefind 浏览器入口地址。
 * @returns {Promise<object>} 已初始化的 api 实例及同一索引中的 titles 列表。
 */
async function initializePagefind(moduleUrl) {
  const pagefindModule = await import(/* @vite-ignore */ moduleUrl)
  const instance = pagefindModule.createInstance({
    basePath: withBase('/pagefind/'),
    // 索引已保存含站点 base 的正式 URL，不能再按 bundle 所在目录追加一次。
    baseUrl: '/',
    language: 'zh',
  })
  await instance.init()
  const filters = await instance.filters()
  return { api: instance, titles: Object.keys(filters.title ?? {}) }
}

/** 预热搜索索引，并把加载异常转换为用户可恢复状态。 */
async function warmSearchIndex() {
  try {
    await loadPagefind()
  } catch {
    pagefindModulePromise = null
    loadError.value = '搜索索引加载失败'
  }
}

/** 打开搜索弹窗并把焦点移到输入框。 */
async function openSearch() {
  if (!dialogElement.value?.open) {
    dialogElement.value?.showModal()
  }
  await nextTick()
  queryInput.value?.focus()
  warmSearchIndex()
}

/** 关闭搜索弹窗。 */
function closeSearch() {
  dialogElement.value?.close()
}

/** 弹窗关闭后清除瞬时错误，允许下次打开重新尝试。 */
function handleDialogClosed() {
  loadError.value = ''
}

/**
 * 用户点击原生 dialog 遮罩区域时关闭搜索。
 *
 * @param {MouseEvent} event dialog 冒泡的点击事件。
 * @returns {void} 点击面板内部时不执行操作。
 */
function handleBackdropClick(event) {
  if (event.target === dialogElement.value) {
    closeSearch()
  }
}

/**
 * 将 Pagefind 的构建单元值转换为界面标签。
 *
 * @param {string | undefined} unit 构建索引时写入的单元名称。
 * @returns {string} 可显示的中文模块名称。
 */
function unitLabel(unit) {
  // 固定单元数量很小，线性查找能直接复用筛选菜单的唯一标签来源。
  return unitOptions.find((option) => option.value === unit)?.label ?? '其他'
}

/** 执行当前关键词和模块条件对应的 Pagefind 搜索。 */
async function executeSearch() {
  const normalizedQuery = query.value.trim()
  const requestedUnit = selectedUnit.value
  const searchId = ++activeSearchId
  if (!normalizedQuery) {
    results.value = []
    resultCount.value = 0
    isLoading.value = false
    return
  }

  isLoading.value = true
  loadError.value = ''
  try {
    const { api: pagefind, titles } = await loadPagefind()
    const options = requestedUnit === 'all'
      ? {}
      : { filters: { unit: requestedUnit } }
    const response = await pagefind.debouncedSearch(normalizedQuery, options, 120)
    if (!response || searchId !== activeSearchId) {
      return
    }

    // 标题连续匹配不依赖浏览器与索引的分词词典；正文搜索仍保留原排序。
    const titleQuery = normalizedQuery.replace(/\s+/g, '').toLowerCase()
    /** 只补充真正包含当前标题片段的文章，忽略显示空白与英文大小写。 */
    const matchedTitles = titles.filter((title) => title.replace(/\s+/g, '').toLowerCase().includes(titleQuery))
    const titleResponse = matchedTitles.length
      ? await pagefind.search(null, { filters: { ...options.filters, title: { any: matchedTitles } } })
      : { results: [] }
    if (searchId !== activeSearchId) return

    // 两类查询使用同一索引的稳定 ID，先求并集再截断，数量与显示不会重复计页。
    const mergedResults = new Map()
    for (const rawResult of [...titleResponse.results, ...response.results]) {
      if (!mergedResults.has(rawResult.id)) mergedResults.set(rawResult.id, rawResult)
    }
    const nextResults = []
    for (const rawResult of [...mergedResults.values()].slice(0, 20)) {
      const data = await rawResult.data()
      nextResults.push({
        id: rawResult.id,
        url: data.url,
        title: data.meta?.title || data.title,
        excerpt: data.plain_excerpt || '',
        unit: data.meta?.unit,
      })
    }
    if (searchId === activeSearchId) {
      results.value = nextResults
      resultCount.value = mergedResults.size
    }
  } catch {
    if (searchId === activeSearchId) {
      pagefindModulePromise = null
      results.value = []
      resultCount.value = 0
      loadError.value = '搜索暂时不可用'
    }
  } finally {
    if (searchId === activeSearchId) {
      isLoading.value = false
    }
  }
}

/** 输入内容变化时使用 Pagefind 内置短延迟合并连续请求。 */
function handleQueryInput() {
  executeSearch()
}

/** 模块筛选变化时复用当前关键词重新搜索。 */
function handleFilterChange() {
  executeSearch()
}

/** 清除模块缓存并重试当前搜索。 */
function retrySearch() {
  pagefindModulePromise = null
  executeSearch()
}

/**
 * 处理全局搜索快捷键，不干扰浏览器和输入控件的其他按键。
 *
 * @param {KeyboardEvent} event 页面级键盘事件。
 * @returns {void} 非搜索快捷键不执行操作。
 */
function handleGlobalShortcut(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    openSearch()
  }
}

/** 注册全局搜索快捷键。 */
function registerSearchShortcut() {
  window.addEventListener('keydown', handleGlobalShortcut)
}

/** 移除全局搜索快捷键，避免热更新或卸载后重复响应。 */
function unregisterSearchShortcut() {
  window.removeEventListener('keydown', handleGlobalShortcut)
}

onMounted(registerSearchShortcut)
onUnmounted(unregisterSearchShortcut)
</script>
