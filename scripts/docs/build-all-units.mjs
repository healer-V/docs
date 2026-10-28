import process from 'node:process'

import { BUILD_UNIT_NAMES } from './build-units.mjs'
import { buildUnit } from './build-unit.mjs'

/**
 * 按固定顺序串行构建全部单元，避免本地共享 `.temp` 目录发生竞争。
 *
 * @returns {Promise<void>} 七个单元全部成功后结束。
 */
async function main() {
  const metrics = []
  for (const unitName of BUILD_UNIT_NAMES) {
    metrics.push(await buildUnit(unitName))
  }

  console.table(metrics)
}

// 全量构建脚本只提供 CLI 入口，任一单元失败即停止后续单元。
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
