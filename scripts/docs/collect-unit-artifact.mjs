import { readFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

import { load } from 'cheerio'

import { resolveBuildUnit, getBuildUnitForRoute } from './build-units.mjs'
import {
  collectFileDigests,
  collectFiles,
  getDirectorySize,
  readJson,
  writeJson,
} from './lib/files.mjs'
import {
  htmlPathToRoute,
  routeToSourcePath,
} from './lib/routes.mjs'

const SITE_BASE = '/docs/'

/**
 * 删除构建站点中的单个已知文件，文件不存在时保持幂等。
 *
 * @param {string} siteDirectory 单元站点目录。
 * @param {string} relativePath 相对于站点目录的目标文件。
 * @returns {Promise<void>} 文件删除或确认不存在后结束。
 */
async function removeSiteFile(siteDirectory, relativePath) {
  try {
    await unlink(path.join(siteDirectory, ...relativePath.split('/')))
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error
    }
  }
}

/**
 * 从生成页面中读取正文标题，供路由清单和搜索元数据复用。
 *
 * @param {string} html VitePress 生成的完整 HTML。
 * @returns {string} 正文一级标题或文档标题。
 */
function extractPageTitle(html) {
  const $ = load(html)
  const articleTitle = $('.vp-doc h1').first().clone().children('a.header-anchor').remove().end().text().trim()
  return articleTitle || $('title').first().text().split('|')[0].trim() || '(无标题)'
}

/**
 * 建立大小写不敏感的 VitePress 哈希键索引，并拒绝潜在文件系统碰撞。
 *
 * @param {Record<string, string>} hashMap VitePress 单元构建生成的原始哈希映射。
 * @returns {Map<string, {key: string, value: string}>} 小写键到原始键和值的索引。
 */
function createHashLookup(hashMap) {
  const lookup = new Map()
  for (const [key, value] of Object.entries(hashMap)) {
    const normalizedKey = key.toLowerCase()
    const existing = lookup.get(normalizedKey)
    if (existing && existing.key !== key) {
      throw new Error(`VitePress 页面哈希键存在大小写碰撞: ${existing.key}, ${key}`)
    }
    lookup.set(normalizedKey, { key, value })
  }
  return lookup
}

/**
 * 移除非 portal 单元复制出的公共目录文件，确保根级公共资源只有一个所有者。
 *
 * @param {string} siteDirectory 单元站点目录。
 * @param {string} publicDirectory VitePress 公共资源源目录。
 * @returns {Promise<void>} 已有公共文件从单元产物移除后结束。
 */
async function removeNonPortalPublicFiles(siteDirectory, publicDirectory) {
  const publicFiles = await collectFiles(publicDirectory)
  for (const publicFile of publicFiles) {
    await removeSiteFile(siteDirectory, publicFile)
  }
}

/**
 * 将 VitePress 单元输出整理成站点、路由、摘要和指标可消费的 Artifact。
 *
 * @param {string} unitName 已批准的构建单元名称。
 * @param {{repositoryRoot?: string}} options 仓库根目录覆盖，仅用于测试或脚本复用。
 * @returns {Promise<{pageCount: number, fileCount: number, totalBytes: number}>} Artifact 汇总指标。
 */
export async function collectUnitArtifact(unitName, options = {}) {
  const repositoryRoot = path.resolve(options.repositoryRoot ?? process.cwd())
  const unit = resolveBuildUnit(unitName)
  const artifactDirectory = path.resolve(repositoryRoot, '.build', 'units', unit.name)
  const siteDirectory = path.join(artifactDirectory, 'site')
  const publicDirectory = path.resolve(repositoryRoot, 'content', 'public')
  const hashMapPath = path.join(siteDirectory, 'hashmap.json')
  const hashMap = await readJson(hashMapPath)
  const hashLookup = createHashLookup(hashMap)

  if (!unit.ownsRootArtifacts) {
    await removeSiteFile(siteDirectory, '404.html')
    await removeNonPortalPublicFiles(siteDirectory, publicDirectory)
  }

  // 全站哈希映射由合并阶段统一生成，任何单元都不直接拥有该根文件。
  await removeSiteFile(siteDirectory, 'hashmap.json')

  const files = await collectFiles(siteDirectory)
  const routes = []
  for (const relativePath of files) {
    if (!relativePath.toLowerCase().endsWith('.html') || relativePath === '404.html') {
      continue
    }

    const route = htmlPathToRoute(relativePath, SITE_BASE)
    const owner = getBuildUnitForRoute(route, SITE_BASE)
    if (owner.name !== unit.name) {
      throw new Error(`单元 ${unit.name} 生成了越权路由 ${route}，应归属 ${owner.name}`)
    }

    const source = routeToSourcePath(route, SITE_BASE)
    const html = await readFile(path.join(siteDirectory, ...relativePath.split('/')), 'utf8')
    const requestedHashKey = source.replaceAll('/', '_')
    const hashRecord = hashLookup.get(requestedHashKey.toLowerCase())
    if (!hashRecord) {
      throw new Error(`单元 ${unit.name} 路由缺少 VitePress 页面哈希: ${route}`)
    }
    routes.push({
      route,
      source,
      html: relativePath,
      title: extractPageTitle(html),
      unit: unit.name,
      hashKey: hashRecord.key,
      pageHash: hashRecord.value,
    })
  }

  // 路由清单顺序固定，确保合并输入可重复比较。
  routes.sort((left, right) => left.route.localeCompare(right.route))
  const fileDigests = await collectFileDigests(siteDirectory)
  const summary = {
    pageCount: routes.length,
    fileCount: fileDigests.length,
    totalBytes: await getDirectorySize(siteDirectory),
  }

  await writeJson(path.join(artifactDirectory, 'routes.json'), { unit: unit.name, routes })
  await writeJson(path.join(artifactDirectory, 'file-digests.json'), { unit: unit.name, files: fileDigests })
  return summary
}

/** 执行 Artifact 整理 CLI。 */
async function main() {
  const unitName = process.argv[2]
  if (!unitName) {
    throw new Error('用法: node scripts/docs/collect-unit-artifact.mjs <unit>')
  }
  console.log(JSON.stringify(await collectUnitArtifact(unitName)))
}

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isDirectExecution) {
  // CLI 异常统一设置退出码，导入该模块时不会触发构建副作用。
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
