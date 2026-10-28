import { spawn } from 'node:child_process'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

import { resolveBuildUnit } from './build-units.mjs'
import { collectUnitArtifact } from './collect-unit-artifact.mjs'
import { resetDirectory, writeJson } from './lib/files.mjs'

/**
 * 启动子进程并将输出透传到当前终端。
 *
 * @param {string} command 可执行文件绝对路径。
 * @param {string[]} args 不经 shell 拼接的参数数组。
 * @param {NodeJS.ProcessEnv} env 子进程环境变量。
 * @returns {Promise<number>} 子进程退出码。
 */
function runCommand(command, args, env) {
  // Promise 执行器只负责把子进程的 error/close 事件转换为单一异步结果。
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: 'inherit', shell: false })

    /** 子进程无法启动时保留原始系统错误。 */
    function handleError(error) {
      reject(error)
    }

    /** 子进程退出时将信号终止统一转换为非零退出码。 */
    function handleClose(code) {
      resolve(code ?? 1)
    }

    child.once('error', handleError)
    child.once('close', handleClose)
  })
}

/**
 * 在 Linux Runner 上使用 GNU time 包装构建命令，本地 Windows 保持直接执行 Node.js。
 *
 * @param {string} vitepressBin VitePress CLI 绝对路径。
 * @param {string} resourceUsagePath GNU time 资源报告输出路径。
 * @returns {Promise<{command: string, args: string[]}>} 可直接传给 `spawn` 的命令与参数。
 */
async function resolveBuildInvocation(vitepressBin, resourceUsagePath) {
  if (process.platform === 'linux') {
    try {
      await access('/usr/bin/time')
      return {
        command: '/usr/bin/time',
        args: ['-v', '-o', resourceUsagePath, process.execPath, vitepressBin, 'build'],
      }
    } catch {
      // 精简 Linux 镜像可能未安装 GNU time，此时继续构建并明确保留空指标。
    }
  }

  return {
    command: process.execPath,
    args: [vitepressBin, 'build'],
  }
}

/**
 * 从 GNU time 报告读取最大常驻内存并转换为字节。
 *
 * @param {string} resourceUsagePath GNU time 输出文件。
 * @returns {Promise<number | null>} 最大 RSS 字节数；未采集时返回 `null`。
 */
async function readPeakRssBytes(resourceUsagePath) {
  try {
    const report = await readFile(resourceUsagePath, 'utf8')
    const match = report.match(/Maximum resident set size \(kbytes\):\s*(\d+)/)
    return match ? Number(match[1]) * 1024 : null
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

/**
 * 构建一个 VitePress 单元并生成标准 Artifact。
 *
 * @param {string} unitName 已批准的构建单元名称。
 * @param {{repositoryRoot?: string}} options 仓库根目录覆盖，用于脚本复用。
 * @returns {Promise<object>} 完整构建指标。
 */
export async function buildUnit(unitName, options = {}) {
  const repositoryRoot = path.resolve(options.repositoryRoot ?? process.cwd())
  const unit = resolveBuildUnit(unitName)
  const unitsRoot = path.join(repositoryRoot, '.build', 'units')
  const artifactDirectory = path.join(unitsRoot, unit.name)
  const metricsPath = path.join(artifactDirectory, 'build-metrics.json')
  const resourceUsagePath = path.join(artifactDirectory, 'resource-usage.txt')
  const vitepressBin = path.join(repositoryRoot, 'node_modules', 'vitepress', 'bin', 'vitepress.js')
  const startedAt = new Date()
  const startedClock = performance.now()

  await resetDirectory(artifactDirectory, unitsRoot)
  console.log(`[docs:${unit.name}] 开始构建`)

  const invocation = await resolveBuildInvocation(vitepressBin, resourceUsagePath)
  const exitCode = await runCommand(invocation.command, invocation.args, {
    ...process.env,
    DOCS_BUILD_UNIT: unit.name,
    NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=4096',
  })

  const baseMetrics = {
    unit: unit.name,
    startedAt: startedAt.toISOString(),
    endedAt: new Date().toISOString(),
    elapsedMs: Math.round(performance.now() - startedClock),
    exitCode,
    peakRssBytes: await readPeakRssBytes(resourceUsagePath),
  }

  if (exitCode !== 0) {
    await writeJson(metricsPath, baseMetrics)
    throw new Error(`构建单元 ${unit.name} 失败，退出码 ${exitCode}`)
  }

  const artifactSummary = await collectUnitArtifact(unit.name, { repositoryRoot })
  const metrics = { ...baseMetrics, ...artifactSummary }
  await writeJson(metricsPath, metrics)
  console.log(`[docs:${unit.name}] 构建完成 pages=${metrics.pageCount} files=${metrics.fileCount} elapsedMs=${metrics.elapsedMs}`)
  return metrics
}

/** 执行单元构建 CLI。 */
async function main() {
  const unitName = process.argv[2]
  if (!unitName) {
    throw new Error('用法: node scripts/docs/build-unit.mjs <unit>')
  }
  await buildUnit(unitName)
}

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isDirectExecution) {
  // CLI 异常统一设置退出码，导入该模块时不会触发构建副作用。
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
