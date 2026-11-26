<template>
  <nav v-if="crumbs.length" class="doc-breadcrumb" aria-label="面包屑" data-pagefind-ignore>
    <template v-for="(crumb, index) in crumbs" :key="`${index}-${crumb}`">
      <span v-if="index > 0" class="doc-breadcrumb__sep" aria-hidden="true">›</span>
      <span class="doc-breadcrumb__item">{{ crumb }}</span>
    </template>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { theme, page, frontmatter } = useData()

/**
 * 把侧栏、导航和当前页面的链接统一成不带扩展名的站内路径，便于比较。
 *
 * @param {string} link 配置中的链接或当前页面相对路径。
 * @returns {string} 以 `/` 开头、不含扩展名和 `index` 的路径。
 */
function normalizePath(link = '') {
  const path = `/${link}`.replace(/\/{2,}/g, '/').replace(/[?#].*$/, '')
  return decodeURI(path).replace(/(\/index)?\.(md|html)$/, '').replace(/\/index$/, '').replace(/\/$/, '')
}

/**
 * 取得当前页面所属的 sidebar 配置，按最长前缀匹配。
 *
 * @param {string} currentPath 当前页面的规范化路径。
 * @returns {{ prefix: string, items: Array<object> } | null} 匹配到的前缀及侧栏条目。
 */
function resolveSidebar(currentPath) {
  const sidebar = theme.value.sidebar
  if (Array.isArray(sidebar)) return { prefix: '', items: sidebar }
  if (!sidebar || typeof sidebar !== 'object') return null

  const prefix = Object.keys(sidebar)
    .filter((key) => currentPath.startsWith(normalizePath(key)))
    .sort((a, b) => b.length - a.length)[0]
  if (!prefix) return null

  const config = sidebar[prefix]
  return { prefix: normalizePath(prefix), items: Array.isArray(config) ? config : config?.items ?? [] }
}

/**
 * 深度优先查找目标页面，返回它所在的各级分组标题，不含页面自身。
 *
 * @param {Array<object>} items 侧栏条目。
 * @param {string} target 当前页面的规范化路径。
 * @param {string[]} chain 已经走过的分组标题。
 * @returns {string[] | null} 找到时返回分组标题链，否则返回 null。
 */
function findGroupChain(items, target, chain = []) {
  for (const item of items) {
    if (item.link && normalizePath(item.link) === target) return chain
    if (Array.isArray(item.items)) {
      const found = findGroupChain(item.items, target, [...chain, item.text])
      if (found) return found
    }
  }
  return null
}

/**
 * 在顶部导航中查找包含该模块链接的一级栏目，如“前端”。
 *
 * @param {string} prefix 当前 sidebar 的路径前缀。
 * @returns {string} 一级栏目名，没有匹配时返回空字符串。
 */
function findNavSection(prefix) {
  const hasLink = (items) => items?.some((item) => (
    (item.link && prefix && normalizePath(item.link).startsWith(prefix)) || hasLink(item.items)
  ))
  const nav = Array.isArray(theme.value.nav) ? theme.value.nav : []
  return nav.find((entry) => hasLink(entry.items))?.text ?? ''
}

const crumbs = computed(() => {
  if (['home', 'page'].includes(frontmatter.value.layout)) return []

  const currentPath = normalizePath(page.value.relativePath)
  const sidebar = resolveSidebar(currentPath)
  if (!sidebar) return []

  const groups = findGroupChain(sidebar.items, currentPath)
  if (!groups || groups.length === 0) return []

  const section = findNavSection(sidebar.prefix)
  return [section, ...groups].filter(Boolean)
})
</script>
