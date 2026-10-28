import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

import { getBuildUnitForSource } from './build-units.mjs'
import { rawNav } from '../../.vitepress/themeConfig/nav.js'
import {
  navigationLinkToSourcePath,
} from '../../.vitepress/themeConfig/navigation.js'
import { loadSidebar } from '../../.vitepress/themeConfig/sidebar.js'
import { writeJson } from './lib/files.mjs'

const DEFAULT_OUTPUT = 'standards/documentation/backlogs/navigation-missing.json'

/**
 * 递归提取导航树中的内部链接及其文本路径。
 *
 * @param {object[]} items nav 或 sidebar 条目。
 * @param {string} surface 来源表面，例如 `nav` 或 sidebar 前缀。
 * @param {string[]} parentLabels 上级分组文本。
 * @param {object[]} results 共享结果数组。
 * @returns {void} 结果直接追加到 `results`。
 */
function collectNavigationReferences(items, surface, parentLabels, results) {
  for (const item of items ?? []) {
    const labels = item.text ? [...parentLabels, item.text] : parentLabels
    if (item.link) {
      const source = navigationLinkToSourcePath(item.link)
      if (source) {
        results.push({
          surface,
          labelPath: labels.join(' > '),
          link: item.link,
          source,
        })
      }
    }
    if (item.items) {
      collectNavigationReferences(item.items, surface, labels, results)
    }
  }
}

/**
 * 生成缺失导航目标台账，不修改原 sidebar 文件或创建占位正文。
 *
 * @param {string} outputPath 输出 JSON 路径。
 * @returns {Promise<object>} 台账摘要。
 */
export async function exportNavigationBacklog(outputPath = DEFAULT_OUTPUT) {
  const sourceRoot = path.resolve('content')
  const references = []
  collectNavigationReferences(rawNav, 'nav', [], references)

  const rawSidebar = await loadSidebar(null, { includeMissing: true })
  for (const [routePrefix, groups] of Object.entries(rawSidebar)) {
    collectNavigationReferences(groups, `sidebar:${routePrefix}`, [], references)
  }

  const missingBySource = new Map()
  for (const reference of references) {
    const absoluteSource = path.join(sourceRoot, ...reference.source.split('/'))
    if (existsSync(absoluteSource)) {
      continue
    }

    const entry = missingBySource.get(reference.source) ?? {
      source: reference.source,
      unit: getBuildUnitForSource(reference.source).name,
      status: 'planned',
      references: [],
    }
    entry.references.push({
      surface: reference.surface,
      labelPath: reference.labelPath,
      link: reference.link,
    })
    missingBySource.set(reference.source, entry)
  }

  // 台账按预期源路径排序，同一目标的引用按表面和文本排序。
  const missingTargets = [...missingBySource.values()].sort((left, right) => left.source.localeCompare(right.source))
  for (const target of missingTargets) {
    target.references.sort((left, right) => `${left.surface}:${left.labelPath}`.localeCompare(`${right.surface}:${right.labelPath}`))
  }

  const uniqueTargets = new Set()
  for (const reference of references) {
    uniqueTargets.add(reference.source)
  }

  const result = {
    schemaVersion: 1,
    summary: {
      references: references.length,
      uniqueTargets: uniqueTargets.size,
      missingTargets: missingTargets.length,
    },
    targets: missingTargets,
  }
  await writeJson(path.resolve(outputPath), result)
  return result.summary
}

/** 执行导航台账导出 CLI。 */
async function main() {
  console.log(JSON.stringify(await exportNavigationBacklog(process.argv[2] ?? DEFAULT_OUTPUT)))
}

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isDirectExecution) {
  // 台账生成失败时设置非零退出码，避免 CI 使用旧台账继续构建。
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
