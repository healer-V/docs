import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { validateSite } from '../validate-site.mjs'

/**
 * 创建最小静态站点夹具。
 *
 * @param {Record<string, string>} files 相对路径到文本内容的映射。
 * @returns {Promise<string>} 临时站点根目录。
 */
async function createSite(files) {
  const siteDirectory = await mkdtemp(path.join(os.tmpdir(), 'docs-validate-'))
  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = path.join(siteDirectory, ...relativePath.split('/'))
    await mkdir(path.dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content, 'utf8')
  }
  return siteDirectory
}

// 验证存在的页面、资源和锚点可以通过门禁。
test('validateSite accepts valid internal pages, assets, and anchors', async () => {
  const siteDirectory = await createSite({
    'index.html': '<main class="vp-doc"><a href="/docs/guide/start.html#intro">开始</a><img src="/docs/logo.png"></main>',
    'guide/start.html': '<main class="vp-doc"><h1 id="intro">开始</h1></main>',
    'logo.png': 'image',
  })

  const report = await validateSite({ siteDirectory })
  assert.equal(report.summary.brokenReferences, 0)
  assert.equal(report.summary.missingAnchors, 0)
})

// 验证缺失页面、资源和锚点均进入结构化问题列表。
test('validateSite reports missing pages, assets, and anchors', async () => {
  const siteDirectory = await createSite({
    'index.html': '<main class="vp-doc"><a href="/docs/missing.html">缺失</a><a href="/docs/guide.html#missing">锚点</a><img src="/docs/missing.png"></main>',
    'guide.html': '<main class="vp-doc"><h1 id="existing">指南</h1></main>',
  })

  const report = await validateSite({ siteDirectory, throwOnError: false })
  assert.equal(report.summary.brokenReferences, 2)
  assert.equal(report.summary.missingAnchors, 1)
  // 问题映射只抽取稳定 kind，避免测试依赖问题对象的展示字段。
  assert.deepEqual(new Set(report.issues.map((issue) => issue.kind)), new Set(['missing-page', 'missing-asset', 'missing-anchor']))
})

// 验证启用搜索门禁时必须存在 Pagefind 浏览器入口和元数据。
test('validateSite requires Pagefind output when requested', async () => {
  const siteDirectory = await createSite({ 'index.html': '<main class="vp-doc"><h1>首页</h1></main>' })
  await assert.rejects(
    validateSite({ siteDirectory, requireSearch: true }),
    /Pagefind 搜索索引不完整/,
  )
})
