import path from 'node:path'

/**
 * 将 URL 编码安全地解码为可比较路径，非法编码会保留原值用于后续报错定位。
 *
 * @param {string} value 需要解码的路径或锚点。
 * @returns {string} 解码后的值；输入包含非法百分号编码时返回原值。
 */
function safeDecode(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/**
 * 将仓库相对路径转换为稳定的 POSIX 形式。
 *
 * @param {string} value Windows 或 Unix 风格的仓库相对路径。
 * @returns {string} 不含开头 `./` 和重复分隔符的 POSIX 路径。
 */
export function toPosixPath(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError('文件路径必须是非空字符串')
  }

  return value
    .trim()
    .replaceAll('\\', '/')
    .replace(/^\.\/+/, '')
    .replace(/^\/+/, '')
    .replace(/\/{2,}/g, '/')
}

/**
 * 将 VitePress base 规范为具有唯一首尾斜杠的路径。
 *
 * @param {string} value VitePress base，例如 `docs`、`/docs/` 或 `/`。
 * @returns {string} 可直接用于 URL 拼接的规范 base。
 */
export function normalizeSiteBase(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError('站点 base 必须是非空字符串')
  }

  const normalized = `/${value.trim().replaceAll('\\', '/').replace(/^\/+|\/+$/g, '')}/`
    .replace(/\/{2,}/g, '/')

  return normalized === '//' ? '/' : normalized
}

/**
 * 将任意站内页面链接转换为公开的规范 URL。
 *
 * @param {string} value 绝对 URL、站点根路径或相对页面路径。
 * @param {string} siteBase VitePress 部署 base。
 * @returns {string} 带部署 base 的 `.html` 或目录首页 URL，不含查询参数和锚点。
 */
export function normalizeRoutePath(value, siteBase = '/') {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError('路由必须是非空字符串')
  }

  const base = normalizeSiteBase(siteBase)
  const baseUrl = new URL(base, 'https://routes.invalid')
  const parsed = new URL(value.trim().replaceAll('\\', '/'), baseUrl)
  let pathname = safeDecode(parsed.pathname).replace(/\/{2,}/g, '/')
  const baseWithoutTrailingSlash = base === '/' ? '' : base.slice(0, -1)

  if (base !== '/' && pathname !== baseWithoutTrailingSlash && !pathname.startsWith(base)) {
    pathname = `${base}${pathname.replace(/^\/+/, '')}`
  }

  if (pathname === baseWithoutTrailingSlash || pathname === base) {
    return base
  }

  if (/\/index\.(?:md|html)$/i.test(pathname)) {
    pathname = pathname.replace(/index\.(?:md|html)$/i, '')
  } else if (/\.md$/i.test(pathname)) {
    pathname = pathname.replace(/\.md$/i, '.html')
  } else if (!pathname.endsWith('/') && path.posix.extname(pathname) === '') {
    pathname = `${pathname}.html`
  }

  return pathname
}

/**
 * 将 Markdown 源文件路径映射为 VitePress 构建后的公开 URL。
 *
 * @param {string} sourcePath 相对于 `content/` 的 Markdown 文件路径。
 * @param {string} siteBase VitePress 部署 base。
 * @returns {string} 对应的规范公开 URL。
 */
export function markdownPathToRoute(sourcePath, siteBase = '/') {
  const normalizedSource = toPosixPath(sourcePath)
  if (!normalizedSource.toLowerCase().endsWith('.md')) {
    throw new TypeError(`Markdown 路径必须以 .md 结尾: ${sourcePath}`)
  }

  return normalizeRoutePath(normalizedSource, siteBase)
}

/**
 * 将构建产物 HTML 路径映射为公开 URL。
 *
 * @param {string} htmlPath 相对于站点输出目录的 HTML 文件路径。
 * @param {string} siteBase VitePress 部署 base。
 * @returns {string} 对应的规范公开 URL。
 */
export function htmlPathToRoute(htmlPath, siteBase = '/') {
  const normalizedHtml = toPosixPath(htmlPath)
  if (!normalizedHtml.toLowerCase().endsWith('.html')) {
    throw new TypeError(`HTML 路径必须以 .html 结尾: ${htmlPath}`)
  }

  return normalizeRoutePath(normalizedHtml, siteBase)
}

/**
 * 将规范公开 URL 转换为相对于站点输出目录的 HTML 路径。
 *
 * @param {string} route 需要转换的规范或可规范化页面 URL。
 * @param {string} siteBase VitePress 部署 base。
 * @returns {string} 使用 POSIX 分隔符的相对 HTML 路径。
 */
export function routeToHtmlPath(route, siteBase = '/') {
  const base = normalizeSiteBase(siteBase)
  const normalizedRoute = normalizeRoutePath(route, base)
  if (!normalizedRoute.startsWith(base)) {
    throw new Error(`路由不属于站点 base ${base}: ${route}`)
  }

  const relativeRoute = normalizedRoute.slice(base.length)
  return relativeRoute === '' || relativeRoute.endsWith('/')
    ? `${relativeRoute}index.html`
    : relativeRoute
}

/**
 * 将规范公开 URL 转换为约定的 Markdown 源文件路径。
 *
 * @param {string} route 需要转换的规范或可规范化页面 URL。
 * @param {string} siteBase VitePress 部署 base。
 * @returns {string} 使用 POSIX 分隔符的相对 Markdown 路径。
 */
export function routeToSourcePath(route, siteBase = '/') {
  return routeToHtmlPath(route, siteBase).replace(/\.html$/i, '.md')
}

/**
 * 将 URL fragment 规范为解码后的 HTML id 表示。
 *
 * @param {string | null | undefined} value 带或不带 `#` 的 fragment。
 * @returns {string | null} `#` 开头的锚点；空值返回 `null`。
 */
export function normalizeAnchor(value) {
  if (value === null || value === undefined) {
    return null
  }

  const normalized = safeDecode(String(value).trim().replace(/^#/, '')).trim()
  return normalized === '' ? null : `#${normalized}`
}

/**
 * 校验每个规范 URL 只对应一个源文件或产物来源。
 *
 * @param {Array<{route: string, source: string}>} entries 待校验的路由来源记录。
 * @returns {Map<string, string>} 路由到唯一来源的映射。
 * @throws {Error} 同一路由出现两个及以上不同来源时抛出冲突明细。
 */
export function assertUniqueRoutes(entries) {
  if (!Array.isArray(entries)) {
    throw new TypeError('路由记录必须是数组')
  }

  const routeSources = new Map()
  for (const entry of entries) {
    if (!entry?.route || !entry?.source) {
      throw new TypeError('每条路由记录都必须包含 route 和 source')
    }

    const sources = routeSources.get(entry.route) ?? new Set()
    sources.add(entry.source)
    routeSources.set(entry.route, sources)
  }

  const conflicts = [...routeSources.entries()]
    // 冲突列表只保留具有两个及以上来源的路由。
    .filter(([, sources]) => sources.size > 1)
    // 固定格式同时输出路由及全部来源，便于 CI 直接定位。
    .map(([route, sources]) => `${route}: ${[...sources].sort().join(', ')}`)

  if (conflicts.length > 0) {
    throw new Error(`发现重复规范路由:\n${conflicts.join('\n')}`)
  }

  // 校验通过后每个集合都只有一个元素，可以安全收敛为简单映射。
  return new Map([...routeSources.entries()].map(([route, sources]) => [route, [...sources][0]]))
}
