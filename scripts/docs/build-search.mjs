import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

import { load } from 'cheerio'
import { close, createIndex } from 'pagefind'

import {
  collectFiles,
  getDirectorySize,
  readJson,
  resetDirectory,
  writeJson,
} from './lib/files.mjs'

/**
 * 将页面正文、排除区域和搜索元数据写入可供 Pagefind 解析的 HTML。
 *
 * @param {string} html VitePress 生成的完整 HTML。
 * @param {{route: string, source: string, title: string, unit: string}} route 正式路由记录。
 * @returns {string} 已标记索引范围的完整 HTML。
 */
export function preparePageForSearch(html, route) {
  const $ = load(html)
  let contentRoot = $('.vp-doc').first()
  for (const fallbackSelector of ['.VPContent', 'main', 'body']) {
    if (contentRoot.length > 0) {
      break
    }
    contentRoot = $(fallbackSelector).first()
  }
  if (contentRoot.length === 0) {
    throw new Error(`页面缺少可索引正文容器: ${route.route}`)
  }

  contentRoot.attr('data-pagefind-body', '')
  $('.VPNav, .VPSidebar, .VPLocalNav, .VPDocAside, .VPFooter, .login-portal, script, style')
    .attr('data-pagefind-ignore', '')

  // 显式元数据避免 Pagefind 从站点标题后缀或公共描述中推断错误值。
  $('meta[data-pagefind-meta], meta[data-pagefind-filter]').remove()
  const metadata = [
    { attribute: 'data-pagefind-meta', name: 'title[content]', content: route.title },
    { attribute: 'data-pagefind-meta', name: 'unit[content]', content: route.unit },
    { attribute: 'data-pagefind-meta', name: 'source[content]', content: route.source },
    { attribute: 'data-pagefind-filter', name: 'unit[content]', content: route.unit },
    // 标题完整值用于补充 CJK 分词召回，不改变正文或全文索引的词语。
    { attribute: 'data-pagefind-filter', name: 'title[content]', content: route.title },
  ]
  for (const item of metadata) {
    const metaElement = $('<meta>')
      .attr(item.attribute, item.name)
      .attr('content', item.content)
    $('head').append(metaElement)
  }

  return $.html()
}

/**
 * 判断已标记页面是否具有标题之外的可索引正文。
 *
 * @param {string} html 已执行 Pagefind 标记的完整 HTML。
 * @returns {boolean} 正文包含非空文本时返回 `true`。
 */
export function hasIndexableBody(html) {
  const $ = load(html)
  const contentRoot = $('[data-pagefind-body]').first().clone()
  contentRoot.find('[data-pagefind-ignore]').remove()
  return contentRoot.text().replace(/[\s\u200B]+/g, '').length > 0
}

/**
 * 将 Pagefind 返回的错误集合转换为阻断构建的可读异常。
 *
 * @param {string} operation 当前 Pagefind 操作名称。
 * @param {string[]} errors Pagefind 返回的错误列表。
 * @returns {void} 没有错误时正常返回。
 */
function assertNoPagefindErrors(operation, errors) {
  if (errors.length > 0) {
    throw new Error(`${operation}失败:\n${errors.join('\n')}`)
  }
}

/**
 * 为已合并站点构建唯一的中文 Pagefind Extended 索引。
 *
 * @param {{siteDirectory: string, routesPath: string, outputPath: string, reportPath?: string | null}} options 合并站点、路由清单与输出位置。
 * @returns {Promise<object>} 搜索覆盖率与产物体积报告。
 */
export async function buildSearchIndex(options) {
  const siteDirectory = path.resolve(options.siteDirectory)
  const routesManifest = await readJson(path.resolve(options.routesPath))
  if (!Array.isArray(routesManifest.routes)) {
    throw new Error('合并路由清单缺少 routes 数组')
  }

  const outputPath = path.resolve(options.outputPath)
  await resetDirectory(outputPath, siteDirectory)
  const createResult = await createIndex({
    forceLanguage: 'zh',
    keepIndexUrl: true,
    verbose: false,
  })
  assertNoPagefindErrors('创建 Pagefind 索引', createResult.errors)
  if (!createResult.index) {
    throw new Error('Pagefind 未返回可用索引实例')
  }

  const index = createResult.index
  const indexedUrls = new Set()
  const fallbackRoutes = []
  const unitCounts = {}
  try {
    for (const route of routesManifest.routes) {
      const htmlPath = path.join(siteDirectory, ...route.html.split('/'))
      const preparedHtml = preparePageForSearch(await readFile(htmlPath, 'utf8'), route)
      await writeFile(htmlPath, preparedHtml, 'utf8')
      let addResult
      if (hasIndexableBody(preparedHtml)) {
        addResult = await index.addHTMLFile({
          content: preparedHtml,
          sourcePath: route.html,
          url: route.route,
        })
        assertNoPagefindErrors(`索引页面 ${route.route}`, addResult.errors)
      } else {
        // 空正文历史页仍以标题作为最小搜索记录，后续内容治理可以直接补充原路径。
        addResult = await index.addCustomRecord({
          url: route.route,
          content: route.title,
          language: 'zh',
          meta: {
            title: route.title,
            unit: route.unit,
            source: route.source,
          },
          filters: { unit: [route.unit], title: [route.title] },
        })
        assertNoPagefindErrors(`索引空正文页面 ${route.route}`, addResult.errors)
        fallbackRoutes.push(route.route)
      }
      if (indexedUrls.has(addResult.file.url)) {
        throw new Error(`Pagefind 返回重复 URL: ${addResult.file.url}`)
      }
      indexedUrls.add(addResult.file.url)
      unitCounts[route.unit] = (unitCounts[route.unit] ?? 0) + 1
    }

    if (indexedUrls.size !== routesManifest.routes.length) {
      throw new Error(`Pagefind 覆盖不完整: indexed=${indexedUrls.size}, routes=${routesManifest.routes.length}`)
    }

    const writeResult = await index.writeFiles({ outputPath })
    assertNoPagefindErrors('写入 Pagefind 产物', writeResult.errors)
  } finally {
    await index.deleteIndex()
    await close()
  }

  const pagefindEntry = await readJson(path.join(outputPath, 'pagefind-entry.json'))
  let indexedPageCount = 0
  for (const language of Object.values(pagefindEntry.languages ?? {})) {
    indexedPageCount += language.page_count ?? 0
  }
  if (indexedPageCount !== routesManifest.routes.length) {
    throw new Error(`Pagefind 实际覆盖不完整: indexed=${indexedPageCount}, routes=${routesManifest.routes.length}`)
  }

  const outputFiles = await collectFiles(outputPath)
  // 单元计数按稳定名称排序，避免索引遍历顺序影响报告差异。
  const sortedUnitCounts = Object.fromEntries(
    Object.entries(unitCounts).sort(([left], [right]) => left.localeCompare(right)),
  )
  const report = {
    summary: {
      routeCount: routesManifest.routes.length,
      indexedPages: indexedPageCount,
      coveragePercent: routesManifest.routes.length === 0
        ? 100
        : Number(((indexedPageCount / routesManifest.routes.length) * 100).toFixed(2)),
      files: outputFiles.length,
      bytes: await getDirectorySize(outputPath),
      titleFallbackPages: fallbackRoutes.length,
    },
    unitCounts: sortedUnitCounts,
    fallbackRoutes,
  }
  if (options.reportPath) {
    await writeJson(path.resolve(options.reportPath), report)
  }
  return report
}

/**
 * 解析搜索构建 CLI 参数。
 *
 * @param {string[]} argv CLI 参数数组。
 * @returns {{siteDirectory: string, routesPath: string, outputPath: string, reportPath: string}} 搜索构建配置。
 */
function parseArguments(argv) {
  const options = {
    siteDirectory: '.build/assembled',
    routesPath: '.build/assembled-routes.json',
    outputPath: '.build/assembled/pagefind',
    reportPath: '.build/search-report.json',
  }
  const argumentKeys = {
    '--site': 'siteDirectory',
    '--routes': 'routesPath',
    '--output': 'outputPath',
    '--report': 'reportPath',
  }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    const optionKey = argumentKeys[argument]
    const value = argv[index + 1]
    if (!optionKey || !value) {
      throw new Error(`不支持或缺少值的参数: ${argument}`)
    }
    options[optionKey] = value
    index += 1
  }
  return options
}

/** 执行统一搜索索引构建 CLI。 */
async function main() {
  const report = await buildSearchIndex(parseArguments(process.argv.slice(2)))
  console.log(JSON.stringify(report.summary))
}

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isDirectExecution) {
  // CLI 失败必须阻断后续 Pages Artifact 上传。
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
