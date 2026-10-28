const SITE_BUILD_UNITS = Object.freeze([
  { name: 'portal', paths: ['', 'index.html', 'links.html', 'about', 'about/'] },
  { name: 'frontend', paths: ['frontend/'] },
  { name: 'backend', paths: ['backend/'] },
  { name: 'operation', paths: ['operation/'] },
  { name: 'ai', paths: ['ai/'] },
  { name: 'web3', paths: ['web3/'] },
  {
    name: 'ecosystem',
    paths: [
      'articles/',
      'crossend/',
      'diary/',
      'engineering/',
      'interview/',
      'microfrontend/',
      'practices/',
      'project/',
      'skill/',
    ],
  },
])

/**
 * 将部署 base 规范化为唯一的首尾斜杠形式。
 *
 * @param {string} siteBase VitePress 部署 base。
 * @returns {string} 规范化后的 base。
 */
function normalizeClientBase(siteBase) {
  const trimmedBase = String(siteBase || '/').trim().replace(/^\/+|\/+$/g, '')
  return trimmedBase ? `/${trimmedBase}/` : '/'
}

/**
 * 将相对地址或绝对地址解析为可比较的 URL。
 *
 * @param {string | URL} value 待解析的浏览器地址。
 * @param {string | URL} baseUrl 相对地址使用的基准地址。
 * @returns {URL | null} 合法 URL；无法解析时返回 `null`。
 */
function parseClientUrl(value, baseUrl = 'https://docs.local/') {
  try {
    return new URL(value, baseUrl)
  } catch {
    return null
  }
}

/**
 * 根据公开页面地址解析浏览器当前所在的构建单元。
 *
 * @param {string | URL} value 页面相对地址或绝对地址。
 * @param {string} siteBase VitePress 部署 base。
 * @returns {string | null} 构建单元名称；非正式页面返回 `null`。
 */
export function resolveClientBuildUnit(value, siteBase = '/docs/') {
  const normalizedBase = normalizeClientBase(siteBase)
  const url = parseClientUrl(value)
  if (!url || !url.pathname.startsWith(normalizedBase)) {
    return null
  }

  const relativePath = url.pathname.slice(normalizedBase.length).replace(/^\/+/, '')
  for (const unit of SITE_BUILD_UNITS) {
    // 同一单元可以声明多个一级目录，任一路径前缀匹配即归属于该单元。
    const ownsPath = unit.paths.some((ownedPath) => (
      ownedPath.endsWith('/')
        ? relativePath.startsWith(ownedPath)
        : relativePath === ownedPath
    ))
    if (ownsPath) {
      return unit.name
    }
  }

  return null
}

/**
 * 判断一次站内导航是否必须重新加载完整页面。
 *
 * @param {string | URL} currentUrl 当前页面地址。
 * @param {string | URL} targetUrl 目标页面地址。
 * @param {string} siteBase VitePress 部署 base。
 * @returns {boolean} 已知构建单元发生切换时返回 `true`。
 */
export function shouldUseFullPageNavigation(currentUrl, targetUrl, siteBase = '/docs/') {
  const current = parseClientUrl(currentUrl)
  const target = parseClientUrl(targetUrl, current || 'https://docs.local/')
  if (!current || !target || current.origin !== target.origin) {
    return false
  }

  // 同一文档的页内锚点和查询参数不需要重新下载当前单元资源。
  if (current.pathname === target.pathname) {
    return false
  }

  const currentUnit = resolveClientBuildUnit(current, siteBase)
  const targetUnit = resolveClientBuildUnit(target, siteBase)
  return Boolean(currentUnit && targetUnit && currentUnit !== targetUnit)
}
