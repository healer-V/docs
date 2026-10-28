import { access, copyFile, mkdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

import {
  BUILD_UNIT_NAMES,
  getBuildUnitForRoute,
} from './build-units.mjs'
import {
  assertPathWithin,
  calculateFileDigest,
  readJson,
  resetDirectory,
  writeJson,
} from './lib/files.mjs'

const ROOT_PORTAL_FILES = new Set(['index.html', '404.html'])
const DEFAULT_PRODUCTION_ORIGIN = 'https://healer-v.github.io'

/**
 * 判断路径是否存在，不吞掉权限等非缺失错误。
 *
 * @param {string} targetPath 待检查路径。
 * @returns {Promise<boolean>} 路径存在时返回 `true`。
 */
async function pathExists(targetPath) {
  try {
    await access(targetPath)
    return true
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false
    }
    throw error
  }
}

/**
 * 读取并验证一个构建单元的路由与文件清单。
 *
 * @param {string} inputDirectory 全部单元 Artifact 根目录。
 * @param {string} unitName 构建单元名称。
 * @returns {Promise<{unit: string, directory: string, siteDirectory: string, routes: object[], files: object[]}>} 单元 Artifact。
 */
async function loadUnitArtifact(inputDirectory, unitName) {
  const directory = path.join(inputDirectory, unitName)
  const routesPath = path.join(directory, 'routes.json')
  const digestsPath = path.join(directory, 'file-digests.json')

  if (!await pathExists(routesPath)) {
    throw new Error(`单元 ${unitName} 缺少 routes.json`)
  }
  if (!await pathExists(digestsPath)) {
    throw new Error(`单元 ${unitName} 缺少 file-digests.json`)
  }

  const routeManifest = await readJson(routesPath)
  const digestManifest = await readJson(digestsPath)
  if (routeManifest.unit !== unitName || digestManifest.unit !== unitName) {
    throw new Error(`单元 ${unitName} 的 Artifact 清单标识不一致`)
  }
  if (!Array.isArray(routeManifest.routes) || !Array.isArray(digestManifest.files)) {
    throw new Error(`单元 ${unitName} 的 Artifact 清单结构无效`)
  }

  return {
    unit: unitName,
    directory,
    siteDirectory: path.join(directory, 'site'),
    routes: routeManifest.routes,
    files: digestManifest.files,
  }
}

/**
 * 验证全部规范路由唯一，并在唯一性通过后检查构建单元所有权。
 *
 * @param {Array<{unit: string, routes: object[]}>} artifacts 单元 Artifact 列表。
 * @returns {object[]} 按规范 URL 排序的全站路由。
 */
function validateRoutes(artifacts) {
  const routeSources = new Map()
  const routes = []

  for (const artifact of artifacts) {
    for (const route of artifact.routes) {
      const declarations = routeSources.get(route.route) ?? []
      declarations.push(`${artifact.unit}:${route.source}`)
      routeSources.set(route.route, declarations)
      routes.push({ ...route, unit: artifact.unit })
    }
  }

  const duplicateMessages = []
  for (const [route, declarations] of routeSources) {
    if (declarations.length > 1) {
      duplicateMessages.push(`${route}: ${declarations.join(', ')}`)
    }
  }
  if (duplicateMessages.length > 0) {
    throw new Error(`发现重复规范路由:\n${duplicateMessages.sort().join('\n')}`)
  }

  for (const route of routes) {
    const expectedOwner = getBuildUnitForRoute(route.route)
    if (expectedOwner.name !== route.unit) {
      throw new Error(`路由所有权错误 ${route.route}: manifest=${route.unit}, expected=${expectedOwner.name}`)
    }
  }

  // 全站路由顺序只由规范 URL 决定。
  return routes.sort((left, right) => left.route.localeCompare(right.route))
}

/**
 * 校验 Artifact 文件摘要、根级所有权与同路径冲突。
 *
 * @param {Array<{unit: string, siteDirectory: string, files: object[]}>} artifacts 单元 Artifact 列表。
 * @returns {Promise<{files: Map<string, object>, deduplicatedFiles: number}>} 唯一文件索引与去重数。
 */
async function validateFiles(artifacts) {
  const files = new Map()
  let deduplicatedFiles = 0

  for (const artifact of artifacts) {
    for (const file of artifact.files) {
      if (ROOT_PORTAL_FILES.has(file.path) && artifact.unit !== 'portal') {
        throw new Error(`根级文件 ${file.path} 只能由 portal 拥有，实际来自 ${artifact.unit}`)
      }

      const sourcePath = path.join(artifact.siteDirectory, ...file.path.split('/'))
      if (!await pathExists(sourcePath)) {
        throw new Error(`Artifact 文件不存在: ${artifact.unit}/${file.path}`)
      }
      const actualDigest = await calculateFileDigest(sourcePath)
      if (actualDigest !== file.sha256) {
        throw new Error(`Artifact 摘要校验失败: ${artifact.unit}/${file.path}`)
      }

      const existing = files.get(file.path)
      if (!existing) {
        files.set(file.path, {
          path: file.path,
          sha256: file.sha256,
          bytes: file.bytes,
          sourcePath,
          units: [artifact.unit],
        })
      } else if (existing.sha256 !== file.sha256) {
        throw new Error(`文件摘要冲突 ${file.path}: ${existing.units.join(', ')} != ${artifact.unit}`)
      } else {
        existing.units.push(artifact.unit)
        deduplicatedFiles += 1
      }
    }
  }

  return { files, deduplicatedFiles }
}

/**
 * 从全站路由生成 VitePress 客户端需要的页面哈希映射。
 *
 * @param {object[]} routes 已排序的全站路由。
 * @returns {Record<string, string>} 按源文件键排序的页面哈希映射。
 */
function createHashMap(routes) {
  const entries = []
  for (const route of routes) {
    if (!route.pageHash) {
      throw new Error(`路由缺少 pageHash: ${route.route}`)
    }
    entries.push([route.hashKey ?? route.source.replaceAll('/', '_'), route.pageHash])
  }

  // 哈希映射按资源路径排序，确保不同平台生成相同 JSON 顺序。
  entries.sort((left, right) => left[0].localeCompare(right[0]))
  const hashMap = {}
  const normalizedKeys = new Map()
  for (const [key, value] of entries) {
    const normalizedKey = key.toLowerCase()
    const existingKey = normalizedKeys.get(normalizedKey)
    if (existingKey) {
      throw new Error(`页面哈希键冲突: ${existingKey}, ${key}`)
    }
    normalizedKeys.set(normalizedKey, key)
    hashMap[key] = value
  }
  return hashMap
}

/**
 * 转义 XML 文本节点中的保留字符。
 *
 * @param {string} value 原始 URL 文本。
 * @returns {string} 可安全写入 sitemap 的文本。
 */
function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

/**
 * 为全部规范 URL 生成最小 sitemap。
 *
 * @param {object[]} routes 已排序的全站路由。
 * @param {string} productionOrigin 生产站点 origin。
 * @returns {string} 带末尾换行的 sitemap XML。
 */
function createSitemap(routes, productionOrigin) {
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
  for (const route of routes) {
    const absoluteUrl = new URL(route.route, productionOrigin).href
    lines.push(`  <url><loc>${escapeXml(absoluteUrl)}</loc></url>`)
  }
  lines.push('</urlset>', '')
  return lines.join('\n')
}

/**
 * 以备份回滚方式替换输出目录，避免校验通过前暴露半成品。
 *
 * @param {string} stagingDirectory 已完成的临时站点目录。
 * @param {string} outputDirectory 正式合并输出目录。
 * @param {string} allowedRoot 允许执行目录替换的根目录。
 * @returns {Promise<void>} 正式目录替换完成后结束。
 */
async function replaceDirectoryAtomically(stagingDirectory, outputDirectory, allowedRoot) {
  const resolvedStaging = assertPathWithin(stagingDirectory, allowedRoot)
  const resolvedOutput = assertPathWithin(outputDirectory, allowedRoot)
  const backupDirectory = assertPathWithin(`${resolvedOutput}.backup`, allowedRoot)
  const outputExists = await pathExists(resolvedOutput)

  await rm(backupDirectory, { recursive: true, force: true })
  if (outputExists) {
    await rename(resolvedOutput, backupDirectory)
  }

  try {
    await rename(resolvedStaging, resolvedOutput)
    await rm(backupDirectory, { recursive: true, force: true })
  } catch (error) {
    if (outputExists && await pathExists(backupDirectory)) {
      await rename(backupDirectory, resolvedOutput)
    }
    throw error
  }
}

/**
 * 确定性合并多个构建单元 Artifact，并生成全站哈希与 sitemap。
 *
 * @param {{inputDirectory: string, outputDirectory: string, unitNames?: string[], productionOrigin?: string}} options 合并输入、输出、单元顺序与生产 origin。
 * @returns {Promise<{routeCount: number, fileCount: number, deduplicatedFiles: number, units: string[]}>} 当前站点的合并报告。
 */
export async function assembleSite(options) {
  const inputDirectory = path.resolve(options.inputDirectory)
  const outputDirectory = path.resolve(options.outputDirectory)
  const allowedRoot = path.dirname(outputDirectory)
  const unitNames = options.unitNames ?? BUILD_UNIT_NAMES
  const productionOrigin = options.productionOrigin ?? DEFAULT_PRODUCTION_ORIGIN
  const artifacts = []

  for (const unitName of unitNames) {
    artifacts.push(await loadUnitArtifact(inputDirectory, unitName))
  }

  const routes = validateRoutes(artifacts)
  const { files, deduplicatedFiles } = await validateFiles(artifacts)
  const stagingDirectory = `${outputDirectory}.staging-${process.pid}`
  await resetDirectory(stagingDirectory, allowedRoot)

  // 文件按相对路径排序后复制，避免 Map 插入来源影响落盘顺序。
  const sortedFiles = [...files.values()].sort((left, right) => left.path.localeCompare(right.path))
  for (const file of sortedFiles) {
    const targetPath = path.join(stagingDirectory, ...file.path.split('/'))
    await mkdir(path.dirname(targetPath), { recursive: true })
    await copyFile(file.sourcePath, targetPath)
  }

  await writeJson(path.join(stagingDirectory, 'hashmap.json'), createHashMap(routes))
  await writeFile(
    path.join(stagingDirectory, 'sitemap.xml'),
    createSitemap(routes, productionOrigin),
    'utf8',
  )
  await replaceDirectoryAtomically(stagingDirectory, outputDirectory, allowedRoot)

  const report = {
    units: [...unitNames],
    routeCount: routes.length,
    fileCount: files.size + 2,
    deduplicatedFiles,
  }
  await writeJson(path.join(allowedRoot, 'assembled-routes.json'), { routes })
  await writeJson(path.join(allowedRoot, 'assembly-report.json'), report)
  return report
}

/**
 * 解析合并 CLI 参数。
 *
 * @param {string[]} argv CLI 参数数组。
 * @returns {{inputDirectory: string, outputDirectory: string}} 合并输入与输出目录配置。
 */
function parseArguments(argv) {
  const options = {
    inputDirectory: '.build/units',
    outputDirectory: '.build/assembled',
  }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    const value = argv[index + 1]
    if (!['--input', '--output'].includes(argument) || !value) {
      throw new Error(`不支持或缺少值的参数: ${argument}`)
    }
    const optionName = argument === '--input' ? 'inputDirectory' : 'outputDirectory'
    options[optionName] = value
    index += 1
  }
  return options
}

/** 执行全站合并 CLI。 */
async function main() {
  console.log(JSON.stringify(await assembleSite(parseArguments(process.argv.slice(2)))))
}

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isDirectExecution) {
  // CLI 异常统一设置退出码，导入模块进行测试时不会产生文件副作用。
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
