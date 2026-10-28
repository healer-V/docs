import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

/**
 * 终止预览脚本自己启动的进程树，Windows 需要显式回收 VitePress 的 esbuild 子进程。
 *
 * @param {import('node:child_process').ChildProcess} child 已记录 PID 的预览子进程。
 * @returns {void} 子进程已退出或缺少 PID 时不执行操作。
 */
function terminateProcessTree(child) {
  if (!child.pid || child.exitCode !== null) {
    return
  }
  if (process.platform === 'win32') {
    spawn('taskkill.exe', ['/pid', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    })
    return
  }
  child.kill('SIGTERM')
}

/**
 * 解析合并站点预览参数并验证端口范围。
 *
 * @param {string[]} argv CLI 参数数组。
 * @returns {{siteDirectory: string, host: string, port: number}} 预览站点、主机和端口。
 */
function parseArguments(argv) {
  const options = {
    siteDirectory: '.build/assembled',
    host: '127.0.0.1',
    port: 4173,
  }
  const argumentKeys = {
    '--site': 'siteDirectory',
    '--host': 'host',
    '--port': 'port',
  }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    const optionKey = argumentKeys[argument]
    const value = argv[index + 1]
    if (!optionKey || !value) {
      throw new Error(`不支持或缺少值的参数: ${argument}`)
    }
    options[optionKey] = optionKey === 'port' ? Number(value) : value
    index += 1
  }
  if (!Number.isInteger(options.port) || options.port < 1 || options.port > 65535) {
    throw new Error(`预览端口无效: ${options.port}`)
  }
  return options
}

/**
 * 启动 VitePress 预览服务，并让配置通过绝对 outDir 读取合并产物。
 *
 * @param {{siteDirectory: string, host: string, port: number, repositoryRoot?: string}} options 站点目录、监听地址与可选仓库根目录。
 * @returns {Promise<number>} 服务退出码；信号终止统一返回非零值。
 */
export function previewSite(options) {
  const repositoryRoot = path.resolve(options.repositoryRoot ?? process.cwd())
  const siteDirectory = path.resolve(repositoryRoot, options.siteDirectory)
  const vitepressBin = path.join(repositoryRoot, 'node_modules', 'vitepress', 'bin', 'vitepress.js')
  const child = spawn(process.execPath, [
    vitepressBin,
    'preview',
    '--host',
    options.host,
    '--port',
    String(options.port),
    '--strictPort',
  ], {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      DOCS_PREVIEW_OUT_DIR: siteDirectory,
    },
    stdio: 'inherit',
    shell: false,
  })

  /** 将父进程终止信号转发给预览服务，避免测试结束后遗留端口。 */
  function forwardTerminationSignal() {
    terminateProcessTree(child)
  }

  process.once('SIGINT', forwardTerminationSignal)
  process.once('SIGTERM', forwardTerminationSignal)

  // Promise 执行器将预览子进程的启动失败和最终退出码统一暴露给 CLI。
  return new Promise((resolve, reject) => {
    /** 子进程无法启动时保留系统错误，并清理信号监听器。 */
    function handleError(error) {
      process.off('SIGINT', forwardTerminationSignal)
      process.off('SIGTERM', forwardTerminationSignal)
      reject(error)
    }

    /** 子进程退出时清理信号监听器并返回稳定退出码。 */
    function handleClose(code) {
      process.off('SIGINT', forwardTerminationSignal)
      process.off('SIGTERM', forwardTerminationSignal)
      resolve(code ?? 1)
    }

    child.once('error', handleError)
    child.once('close', handleClose)
  })
}

/** 执行合并站点预览 CLI。 */
async function main() {
  const exitCode = await previewSite(parseArguments(process.argv.slice(2)))
  process.exitCode = exitCode
}

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isDirectExecution) {
  // 预览启动失败需要让 Playwright webServer 明确失败。
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
