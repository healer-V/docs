import { appendFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

import { BUILD_UNIT_NAMES } from './build-units.mjs'
import { getDirectorySize, readJson } from './lib/files.mjs'

/**
 * 将字节数转换为适合 CI 表格阅读的 MiB。
 *
 * @param {number | null | undefined} bytes 原始字节数。
 * @returns {string} 两位小数的 MiB；未采集时返回短横线。
 */
function formatMiB(bytes) {
  return Number.isFinite(bytes) ? `${(bytes / 1024 / 1024).toFixed(2)} MiB` : '-'
}

/**
 * 将毫秒转换为适合 CI 表格阅读的秒数。
 *
 * @param {number | null | undefined} milliseconds 原始耗时毫秒数。
 * @returns {string} 一位小数的秒数；未采集时返回短横线。
 */
function formatSeconds(milliseconds) {
  return Number.isFinite(milliseconds) ? `${(milliseconds / 1000).toFixed(1)} s` : '-'
}

/**
 * 汇总构建单元、合并、当前站内引用和搜索指标。
 *
 * @param {{buildRoot?: string, outputPath?: string | null}} options 构建根目录与 GitHub Summary 输出文件。
 * @returns {Promise<string>} 完整 Markdown 汇总内容。
 */
export async function writeCiSummary(options = {}) {
  const buildRoot = path.resolve(options.buildRoot ?? '.build')
  const unitMetrics = []
  for (const unitName of BUILD_UNIT_NAMES) {
    unitMetrics.push(await readJson(path.join(buildRoot, 'units', unitName, 'build-metrics.json')))
  }
  const assembly = await readJson(path.join(buildRoot, 'assembly-report.json'))
  const validation = await readJson(path.join(buildRoot, 'site-validation-report.json'))
  const search = await readJson(path.join(buildRoot, 'search-report.json'))
  const artifactBytes = await getDirectorySize(path.join(buildRoot, 'assembled'))

  const lines = [
    '## 文档站构建指标',
    '',
    '| 构建单元 | 页面 | 耗时 | 峰值 RSS | 产物体积 |',
    '|---|---:|---:|---:|---:|',
  ]
  for (const metrics of unitMetrics) {
    lines.push(`| ${metrics.unit} | ${metrics.pageCount} | ${formatSeconds(metrics.elapsedMs)} | ${formatMiB(metrics.peakRssBytes)} | ${formatMiB(metrics.totalBytes)} |`)
  }
  lines.push(
    '',
    '| 全站门禁 | 结果 |',
    '|---|---:|',
    `| 正式路由 | ${assembly.routeCount} |`,
    `| 内部引用问题 | ${validation.summary.issues} |`,
    `| 搜索覆盖率 | ${search.summary.coveragePercent}% |`,
    `| 搜索标题兜底页 | ${search.summary.titleFallbackPages} |`,
    `| Pages Artifact 体积 | ${formatMiB(artifactBytes)} |`,
    '',
  )
  const markdown = lines.join('\n')
  if (options.outputPath) {
    await appendFile(path.resolve(options.outputPath), markdown, 'utf8')
  }
  return markdown
}

/** 执行 GitHub Actions 构建汇总 CLI。 */
async function main() {
  const outputPath = process.env.GITHUB_STEP_SUMMARY || null
  const markdown = await writeCiSummary({ outputPath })
  if (!outputPath) {
    console.log(markdown)
  }
}

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isDirectExecution) {
  // 汇总失败代表诊断产物不完整，应阻断发布而不是静默跳过。
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
