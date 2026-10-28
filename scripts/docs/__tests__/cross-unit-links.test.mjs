import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { createMarkdownRenderer } from 'vitepress'

import { configureCrossUnitLinks, isExistingCrossUnitLink } from '../../../.vitepress/markdown/cross-unit-links.mjs'

// 使用真实 Markdown 渲染器验证跨单元例外，并保留断链、同单元和锚点检查的输入。
test('cross-unit links require a real source and preserve rendered hrefs', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'docs-cross-unit-'))
  try {
    await mkdir(path.join(root, 'backend', '04-java'), { recursive: true })
    await mkdir(path.join(root, 'articles', 'blog'), { recursive: true })
    await writeFile(path.join(root, 'backend', '04-java', 'topic.md'), '# 主题\n')
    await writeFile(path.join(root, 'articles', 'blog', 'same.md'), '# 同单元\n')
    const source = path.join(root, 'articles', 'blog', 'report.md')
    const valid = '../../backend/04-java/topic.md#主题'
    assert.equal(isExistingCrossUnitLink(valid, source, root, 'ecosystem'), true)
    assert.equal(isExistingCrossUnitLink('../backend/04-java/topic.md', source, root, 'ecosystem'), false)
    assert.equal(isExistingCrossUnitLink('../../backend/04-java/missing.md', source, root, 'ecosystem'), false)
    assert.equal(isExistingCrossUnitLink('./same.md', source, root, 'ecosystem'), false)
    assert.equal(isExistingCrossUnitLink('https://outside.example/topic.md', source, root, 'ecosystem'), false)
    assert.equal(isExistingCrossUnitLink('#主题', source, root, 'ecosystem'), false)
    assert.equal(isExistingCrossUnitLink('%ZZ.md', source, root, 'ecosystem'), false)

    const md = await createMarkdownRenderer(root, {
      /** 通过真实 VitePress 扩展入口注册单元链接规则。 */
      config(renderer) {
        configureCrossUnitLinks(renderer, 'ecosystem', root)
      },
    }, '/docs/')
    const env = { path: source }
    const html = md.render(`[跨单元](${valid}) [同单元](./same.md) [缺失](../../backend/04-java/missing.md)`, env)
    assert.match(html, /href="\.\/\.\.\/\.\.\/backend\/04-java\/topic.html#主题"/)
    assert.equal(env.links.length, 2)
    assert.ok(env.links.includes('./same'))
    assert.ok(env.links.includes('./../../backend/04-java/missing'))
  } finally {
    // 只清理本用例创建的隔离临时目录。
    await rm(root, { recursive: true, force: true })
  }
})
