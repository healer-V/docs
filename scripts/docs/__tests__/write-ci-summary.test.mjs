import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { BUILD_UNIT_NAMES } from '../build-units.mjs'
import { writeCiSummary } from '../write-ci-summary.mjs'

/**
 * 验证构建汇总只依赖当前站点报告，缺少历史路由报告时也能完成。
 * @returns {Promise<void>} 汇总内容与追加写入通过断言后结束，并清理临时目录。
 */
test('writeCiSummary completes without a historical route report', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'docs-summary-'))
  try {
    for (const unit of BUILD_UNIT_NAMES) {
      const directory = path.join(root, 'units', unit)
      await mkdir(directory, { recursive: true })
      await writeFile(path.join(directory, 'build-metrics.json'), JSON.stringify({
        unit,
        pageCount: 1,
        elapsedMs: 1000,
        peakRssBytes: null,
        totalBytes: 1024,
      }))
    }
    await mkdir(path.join(root, 'assembled'))
    await writeFile(path.join(root, 'assembled', 'index.html'), 'current site')
    await writeFile(path.join(root, 'assembly-report.json'), JSON.stringify({ routeCount: 7 }))
    await writeFile(path.join(root, 'site-validation-report.json'), JSON.stringify({ summary: { issues: 0 } }))
    await writeFile(path.join(root, 'search-report.json'), JSON.stringify({
      summary: { coveragePercent: 100, titleFallbackPages: 0 },
    }))
    const outputPath = path.join(root, 'summary.md')
    await writeFile(outputPath, 'existing summary\n')

    const markdown = await writeCiSummary({ buildRoot: root, outputPath })

    assert.match(markdown, /\| 正式路由 \| 7 \|/)
    assert.match(markdown, /\| 内部引用问题 \| 0 \|/)
    assert.match(markdown, /\| 搜索覆盖率 \| 100% \|/)
    assert.doesNotMatch(markdown, /历史 URL|历史兼容页/)
    assert.equal(await readFile(outputPath, 'utf8'), `existing summary\n${markdown}`)
  } finally {
    // 临时目录由本用例独立创建，清理不影响项目构建产物。
    await rm(root, { recursive: true, force: true })
  }
})
