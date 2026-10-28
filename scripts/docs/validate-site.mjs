import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

import { load } from 'cheerio'

import { collectFiles, writeJson } from './lib/files.mjs'
import {
  htmlPathToRoute,
  normalizeAnchor,
  normalizeRoutePath,
  routeToHtmlPath,
} from './lib/routes.mjs'

const SITE_BASE = '/docs/'
const LOCAL_ORIGIN = 'https://site.invalid'
const PRODUCTION_ORIGIN = 'https://healer-v.github.io'

/**
 * 安全解码 URL pathname，非法编码保持原值并由文件缺失门禁报告。
 *
 * @param {string} value URL pathname。
 * @returns {string} 解码后的 pathname。
 */
function safeDecodePath(value) {
  try {
    return decodeURI(value)
  } catch {
    return value
  }
}

/**
 * 判断 URL 协议是否应跳过本地静态文件校验。
 *
 * @param {string} reference HTML 属性中的原始引用。
 * @returns {boolean} 外部或非文件协议返回 `true`。
 */
function shouldIgnoreReference(reference) {
  return /^(?:data:|mailto:|tel:|javascript:|blob:)/i.test(reference)
}

/**
 * 判断元素引用属于正文、导航还是主题系统区域。
 *
 * @param {ReturnType<typeof load>} $ Cheerio 文档实例。
 * @param {object} element 当前 DOM 元素。
 * @returns {'content' | 'navigation' | 'system'} 问题表面分类。
 */
function classifySurface($, element) {
  const current = $(element)
  if (current.closest('.vp-doc').length > 0) {
    return 'content'
  }
  if (current.closest('.VPNav, .VPSidebar, nav').length > 0) {
    return 'navigation'
  }
  return 'system'
}

/**
 * 将 HTML 引用转换为待检查的页面或静态资源路径。
 *
 * @param {string} reference HTML 属性中的原始引用。
 * @param {string} currentRoute 当前 HTML 的规范路由。
 * @returns {{kind: 'page' | 'asset' | 'outside-base', relativePath: string | null, anchor: string | null} | null} 本地检查目标。
 */
function resolveReference(reference, currentRoute) {
  const trimmed = reference.trim()
  if (!trimmed || shouldIgnoreReference(trimmed)) {
    return null
  }

  let parsed
  try {
    parsed = new URL(trimmed, new URL(currentRoute, LOCAL_ORIGIN))
  } catch {
    return { kind: 'outside-base', relativePath: null, anchor: null }
  }

  if (![LOCAL_ORIGIN, PRODUCTION_ORIGIN].includes(parsed.origin)) {
    return null
  }

  const pathname = safeDecodePath(parsed.pathname).replaceAll('\\', '/')
  if (!pathname.startsWith(SITE_BASE)) {
    return { kind: 'outside-base', relativePath: null, anchor: normalizeAnchor(parsed.hash) }
  }

  const extension = path.posix.extname(pathname).toLowerCase()
  const isPage = !extension || ['.html', '.md'].includes(extension)
  if (isPage) {
    const route = normalizeRoutePath(`${pathname}${parsed.search}${parsed.hash}`, SITE_BASE)
    return {
      kind: 'page',
      relativePath: routeToHtmlPath(route, SITE_BASE),
      anchor: normalizeAnchor(parsed.hash),
    }
  }

  return {
    kind: 'asset',
    relativePath: pathname.slice(SITE_BASE.length),
    anchor: null,
  }
}

/**
 * 读取站点 HTML，建立正文锚点集合和 Cheerio 文档缓存。
 *
 * @param {string} siteDirectory 站点输出目录。
 * @param {string[]} htmlFiles 相对 HTML 路径。
 * @returns {Promise<Map<string, {html: string, anchors: Set<string>}>>} HTML 路径到页面数据的索引。
 */
async function createPageIndex(siteDirectory, htmlFiles) {
  const pageIndex = new Map()
  for (const htmlFile of htmlFiles) {
    const html = await readFile(path.join(siteDirectory, ...htmlFile.split('/')), 'utf8')
    const $ = load(html)
    const anchors = new Set()

    // 主题跳转目标（例如 VPContent）和正文标题都属于有效页面锚点。
    $('[id]').each((_index, element) => {
      const anchor = normalizeAnchor($(element).attr('id'))
      if (anchor) {
        anchors.add(anchor)
      }
    })
    pageIndex.set(htmlFile, { html, anchors })
  }
  return pageIndex
}

/**
 * 校验合并站点的页面、资源、锚点和可选 Pagefind 产物。
 *
 * @param {{siteDirectory: string, requireSearch?: boolean, throwOnError?: boolean, outputPath?: string | null}} options 站点目录与门禁选项。
 * @returns {Promise<{summary: object, issues: object[]}>} 结构化校验报告。
 */
export async function validateSite(options) {
  const siteDirectory = path.resolve(options.siteDirectory)
  const requireSearch = options.requireSearch ?? false
  const throwOnError = options.throwOnError ?? true
  const allFiles = await collectFiles(siteDirectory)
  const fileSet = new Set(allFiles)
  // 只有 HTML 进入页面与锚点索引，其他文件仍保留在资源存在性集合中。
  const htmlFiles = allFiles.filter((file) => file.toLowerCase().endsWith('.html'))
  const pageIndex = await createPageIndex(siteDirectory, htmlFiles)
  const issues = []
  let checkedReferences = 0

  for (const htmlFile of htmlFiles) {
    const currentRoute = htmlPathToRoute(htmlFile, SITE_BASE)
    const page = pageIndex.get(htmlFile)
    const $ = load(page.html)
    const selectors = [
      { selector: 'a[href]', attribute: 'href' },
      { selector: 'img[src]', attribute: 'src' },
      { selector: 'script[src]', attribute: 'src' },
      { selector: 'source[src]', attribute: 'src' },
      { selector: 'link[href]', attribute: 'href' },
    ]

    for (const { selector, attribute } of selectors) {
      // 每个可导航属性都按其所在页面解析相对地址并记录表面类型。
      $(selector).each((_index, element) => {
        const reference = $(element).attr(attribute)
        if (!reference) {
          return
        }

        const target = resolveReference(reference, currentRoute)
        if (!target) {
          return
        }
        checkedReferences += 1
        const surface = classifySurface($, element)

        if (target.kind === 'outside-base') {
          issues.push({ page: currentRoute, surface, kind: 'outside-base', reference })
          return
        }
        if (!fileSet.has(target.relativePath)) {
          issues.push({
            page: currentRoute,
            surface,
            kind: target.kind === 'page' ? 'missing-page' : 'missing-asset',
            reference,
            target: target.relativePath,
          })
          return
        }
        if (target.kind === 'page' && target.anchor) {
          const targetPage = pageIndex.get(target.relativePath)
          if (!targetPage?.anchors.has(target.anchor)) {
            issues.push({
              page: currentRoute,
              surface,
              kind: 'missing-anchor',
              reference,
              target: `${target.relativePath}${target.anchor}`,
            })
          }
        }
      })
    }
  }

  if (requireSearch && (!fileSet.has('pagefind/pagefind.js') || !fileSet.has('pagefind/pagefind-entry.json'))) {
    issues.push({
      page: SITE_BASE,
      surface: 'system',
      kind: 'missing-search',
      reference: 'pagefind/',
    })
  }

  let brokenReferences = 0
  let missingAnchors = 0
  for (const issue of issues) {
    if (issue.kind === 'missing-anchor') {
      missingAnchors += 1
    } else {
      brokenReferences += 1
    }
  }

  const report = {
    summary: {
      htmlFiles: htmlFiles.length,
      files: allFiles.length,
      checkedReferences,
      brokenReferences,
      missingAnchors,
      issues: issues.length,
    },
    issues,
  }
  if (options.outputPath) {
    await writeJson(path.resolve(options.outputPath), report)
  }

  if (throwOnError && issues.length > 0) {
    // 搜索产物缺失使用独立错误前缀，便于 CI 直接区分内容链接和索引阶段。
    const searchFailure = issues.some((issue) => issue.kind === 'missing-search')
    const error = new Error(searchFailure
      ? 'Pagefind 搜索索引不完整'
      : `站点校验失败: broken=${brokenReferences}, anchors=${missingAnchors}`)
    error.report = report
    throw error
  }
  return report
}

/**
 * 解析站点校验 CLI 参数。
 *
 * @param {string[]} argv CLI 参数数组。
 * @returns {{siteDirectory: string, requireSearch: boolean, outputPath: string}} 校验配置。
 */
function parseArguments(argv) {
  const options = {
    siteDirectory: '.build/assembled',
    requireSearch: false,
    outputPath: '.build/site-validation-report.json',
  }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--require-search') {
      options.requireSearch = true
      continue
    }
    const value = argv[index + 1]
    if (!['--site', '--output'].includes(argument) || !value) {
      throw new Error(`不支持或缺少值的参数: ${argument}`)
    }
    options[argument === '--site' ? 'siteDirectory' : 'outputPath'] = value
    index += 1
  }
  return options
}

/** 执行站点校验 CLI。 */
async function main() {
  const options = parseArguments(process.argv.slice(2))
  console.log(JSON.stringify((await validateSite(options)).summary))
}

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isDirectExecution) {
  // CLI 异常统一设置退出码，详细问题已经写入结构化报告。
  main().catch((error) => {
    if (error.report) {
      console.error(JSON.stringify(error.report.summary))
    }
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
