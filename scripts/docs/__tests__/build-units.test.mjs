import assert from 'node:assert/strict'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

import {
  BUILD_UNIT_NAMES,
  BUILD_UNITS,
  createSrcExclude,
  getBuildUnitForRoute,
  getBuildUnitForSource,
  resolveBuildUnit,
} from '../build-units.mjs'

/**
 * 递归收集目录中的 Markdown 文件，用真实文件验证单元覆盖而不是只验证配置样例。
 *
 * @param {string} rootDirectory `content/` 的绝对路径。
 * @param {string} currentDirectory 当前递归目录，首次调用与根目录相同。
 * @returns {Promise<string[]>} 相对于 `content/` 的 POSIX Markdown 路径。
 */
async function collectMarkdownPaths(rootDirectory, currentDirectory = rootDirectory) {
  const entries = await readdir(currentDirectory, { withFileTypes: true })
  const markdownPaths = []

  for (const entry of entries) {
    if (entry.name === '.vitepress' || entry.name === '.claude') {
      continue
    }

    const absolutePath = path.join(currentDirectory, entry.name)
    if (entry.isDirectory()) {
      markdownPaths.push(...await collectMarkdownPaths(rootDirectory, absolutePath))
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      markdownPaths.push(path.relative(rootDirectory, absolutePath).replaceAll('\\', '/'))
    }
  }

  return markdownPaths.sort()
}

// 验证七个单元名称和顺序固定，供本地串行构建与 CI Matrix 共用。
test('build unit registry exposes the seven approved units', () => {
  assert.deepEqual(BUILD_UNIT_NAMES, ['portal', 'frontend', 'backend', 'operation', 'ai', 'web3', 'ecosystem'])
  assert.equal(BUILD_UNITS.length, 7)
})

// 验证代表性源文件和公开路由落入设计指定的构建单元。
test('source files and routes resolve to the approved owners', () => {
  assert.equal(getBuildUnitForSource('index.md').name, 'portal')
  assert.equal(getBuildUnitForSource('about/index.md').name, 'portal')
  assert.equal(getBuildUnitForSource('frontend/01-html/01-overview.md').name, 'frontend')
  assert.equal(getBuildUnitForSource('backend/04-java/01-language-foundation/01-overview.md').name, 'backend')
  assert.equal(getBuildUnitForSource('engineering/02-vite/01-vite.md').name, 'ecosystem')
  assert.equal(getBuildUnitForRoute('/docs/operation/05-docker/index.html').name, 'operation')
  assert.equal(getBuildUnitForRoute('/docs/crossend/02-flutter/index.html').name, 'ecosystem')
})

// 验证当前全部 Markdown 恰好归属一个单元；正常内容增删不改变所有权契约。
test('every current Markdown file belongs to exactly one unit', async () => {
  const docsDirectory = path.resolve('content')
  const markdownPaths = await collectMarkdownPaths(docsDirectory)
  // 计数映射为每个已批准单元建立独立初始值。
  const counts = Object.fromEntries(BUILD_UNIT_NAMES.map((name) => [name, 0]))

  for (const markdownPath of markdownPaths) {
    const unit = getBuildUnitForSource(markdownPath)
    counts[unit.name] += 1
  }

  assert.ok(markdownPaths.length > 0, '必须扫描到真实文档，避免空目录导致检查空通过')
  let assignedCount = 0
  for (const unitName of BUILD_UNIT_NAMES) {
    assert.ok(counts[unitName] > 0, `构建单元 ${unitName} 应包含实际文档`)
    assignedCount += counts[unitName]
  }
  assert.equal(assignedCount, markdownPaths.length)
})

// 验证非 portal 单元排除其他源码根和根页面，但不会排除自己的目录。
test('createSrcExclude isolates a unit without excluding its own sources', () => {
  const frontendExcludes = createSrcExclude('frontend')
  assert.ok(frontendExcludes.includes('backend/**/*.md'))
  assert.ok(frontendExcludes.includes('index.md'))
  assert.ok(!frontendExcludes.includes('frontend/**/*.md'))

  const portalExcludes = createSrcExclude('portal')
  assert.ok(portalExcludes.includes('frontend/**/*.md'))
  assert.ok(!portalExcludes.includes('index.md'))
})

// 验证未知单元、过程文档、无归属路径和静态资源不会被纳入网站构建。
test('invalid units and unowned sources fail with actionable errors', () => {
  // 断言回调触发名称、归属和文件类型的防御分支，预期抛出错误而不返回值。
  assert.throws(() => resolveBuildUnit('unknown'), /未知构建单元/)
  assert.throws(() => getBuildUnitForSource('unowned/topic.md'), /没有构建单元负责/)
  // 解析过程蓝图的归属以验证拒绝构建；回调预期抛出错误，无返回值。
  assert.throws(() => getBuildUnitForSource('superpowers/specs/design.md'), /没有构建单元负责/)
  // 解析编写规范的归属以验证拒绝构建；回调预期抛出错误，无返回值。
  assert.throws(() => getBuildUnitForSource('standards/documentation/README.md'), /没有构建单元负责/)
  assert.throws(() => getBuildUnitForSource('public/logo.png'), /只支持 Markdown/)
})

// 验证只有 portal 声明根级页面与公共资源所有权。
test('portal is the only root artifact owner', () => {
  // 先筛选根产物所有者，再只比较其稳定名称，避免对象细节影响契约。
  const rootOwners = BUILD_UNITS.filter((unit) => unit.ownsRootArtifacts)
  assert.deepEqual(rootOwners.map((unit) => unit.name), ['portal'])
})
