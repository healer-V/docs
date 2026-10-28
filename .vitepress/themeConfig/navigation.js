import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_SOURCE_ROOT = fileURLToPath(new URL('../../content/', import.meta.url))
const SITE_BASE = '/docs/'

/**
 * 判断导航链接是否由浏览器外部处理。
 *
 * @param {string} link 导航链接。
 * @returns {boolean} 外部协议或纯锚点返回 `true`。
 */
export function isExternalNavigationLink(link) {
  return /^(?:[a-z][a-z\d+.-]*:|#)/i.test(link)
}

/**
 * 将 VitePress 导航链接转换为预期 Markdown 源路径。
 *
 * @param {string} link 内部导航链接。
 * @param {string} siteBase VitePress 部署 base。
 * @returns {string | null} 相对于 `content/` 的 Markdown 路径；外链返回 `null`。
 */
export function navigationLinkToSourcePath(link, siteBase = SITE_BASE) {
  if (!link || isExternalNavigationLink(link)) {
    return null
  }

  const parsed = new URL(link, `https://navigation.invalid${siteBase}`)
  let pathname = decodeURI(parsed.pathname).replaceAll('\\', '/')
  const normalizedBase = `/${siteBase.replace(/^\/+|\/+$/g, '')}/`.replace(/\/{2,}/g, '/')
  if (normalizedBase !== '/' && pathname.startsWith(normalizedBase)) {
    pathname = pathname.slice(normalizedBase.length)
  } else {
    pathname = pathname.replace(/^\/+/, '')
  }

  if (pathname === '' || pathname.endsWith('/')) {
    return `${pathname}index.md`
  }
  if (/\.html$/i.test(pathname)) {
    return pathname.replace(/\.html$/i, '.md')
  }
  if (/\.md$/i.test(pathname)) {
    return pathname
  }
  if (path.posix.extname(pathname)) {
    return null
  }
  return `${pathname}.md`
}

/**
 * 判断导航链接指向的 Markdown 是否真实存在。
 *
 * @param {string} link 导航链接。
 * @param {string} sourceRoot `content/` 源目录绝对路径。
 * @returns {boolean} 外链或现有 Markdown 返回 `true`。
 */
export function navigationLinkExists(link, sourceRoot = DEFAULT_SOURCE_ROOT) {
  const sourcePath = navigationLinkToSourcePath(link)
  return sourcePath === null || existsSync(path.join(sourceRoot, ...sourcePath.split('/')))
}

/**
 * 递归过滤 nav/sidebar 条目，移除不存在的页面和过滤后为空的分组。
 *
 * @param {object[]} items 导航或 sidebar 条目。
 * @param {string} sourceRoot `content/` 源目录绝对路径。
 * @returns {object[]} 保留原顺序的有效导航条目。
 */
export function filterNavigationItems(items, sourceRoot = DEFAULT_SOURCE_ROOT) {
  const filteredItems = []
  for (const item of items ?? []) {
    const filteredChildren = item.items ? filterNavigationItems(item.items, sourceRoot) : null
    const hasValidLink = item.link ? navigationLinkExists(item.link, sourceRoot) : false
    const hasChildren = Boolean(filteredChildren?.length)

    if ((item.link && !hasValidLink) || (!item.link && item.items && !hasChildren)) {
      continue
    }

    filteredItems.push({
      ...item,
      ...(item.items ? { items: filteredChildren } : {}),
    })
  }
  return filteredItems
}

/**
 * 过滤 VitePress 多前缀 sidebar 记录，并移除空前缀。
 *
 * @param {Record<string, object[]>} sidebar 原始 sidebar 记录。
 * @param {string} sourceRoot `content/` 源目录绝对路径。
 * @returns {Record<string, object[]>} 只含现有页面的 sidebar。
 */
export function filterNavigationRecord(sidebar, sourceRoot = DEFAULT_SOURCE_ROOT) {
  const filteredSidebar = {}
  for (const [routePrefix, groups] of Object.entries(sidebar)) {
    const filteredGroups = filterNavigationItems(groups, sourceRoot)
    if (filteredGroups.length > 0) {
      filteredSidebar[routePrefix] = filteredGroups
    }
  }
  return filteredSidebar
}
