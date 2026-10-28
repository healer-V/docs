import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { toPosixPath } from './routes.mjs'

/**
 * 验证目标路径位于允许根目录内，防止清理或复制操作越界。
 *
 * @param {string} targetPath 待验证的绝对或相对目标路径。
 * @param {string} allowedRoot 允许操作的绝对或相对根目录。
 * @returns {string} 解析后的绝对目标路径。
 */
export function assertPathWithin(targetPath, allowedRoot) {
  const resolvedTarget = path.resolve(targetPath)
  const resolvedRoot = path.resolve(allowedRoot)
  const relative = path.relative(resolvedRoot, resolvedTarget)
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`目标路径必须是允许根目录内的子目录: ${resolvedTarget} (root=${resolvedRoot})`)
  }

  return resolvedTarget
}

/**
 * 清空并重新创建允许根目录下的目标目录。
 *
 * @param {string} targetDirectory 需要重建的目录。
 * @param {string} allowedRoot 允许执行递归清理的根目录。
 * @returns {Promise<void>} 目录重建完成后结束。
 */
export async function resetDirectory(targetDirectory, allowedRoot) {
  const resolvedTarget = assertPathWithin(targetDirectory, allowedRoot)
  await rm(resolvedTarget, { recursive: true, force: true })
  await mkdir(resolvedTarget, { recursive: true })
}

/**
 * 递归收集目录内所有普通文件，并使用稳定的 POSIX 相对路径排序。
 *
 * @param {string} rootDirectory 根目录的绝对路径。
 * @param {string} currentDirectory 当前递归目录，首次调用与根目录相同。
 * @returns {Promise<string[]>} 相对于根目录的文件路径。
 */
export async function collectFiles(rootDirectory, currentDirectory = rootDirectory) {
  const entries = await readdir(currentDirectory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const absolutePath = path.join(currentDirectory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectFiles(rootDirectory, absolutePath))
    } else if (entry.isFile()) {
      files.push(toPosixPath(path.relative(rootDirectory, absolutePath)))
    }
  }

  return files.sort()
}

/**
 * 计算单个文件的 SHA-256 摘要。
 *
 * @param {string} filePath 文件绝对路径。
 * @returns {Promise<string>} 小写十六进制 SHA-256。
 */
export async function calculateFileDigest(filePath) {
  const digest = createHash('sha256')
  for await (const chunk of createReadStream(filePath)) {
    digest.update(chunk)
  }
  return digest.digest('hex')
}

/**
 * 生成目录内全部文件的摘要与大小清单。
 *
 * @param {string} rootDirectory 待扫描目录的绝对路径。
 * @returns {Promise<Array<{path: string, sha256: string, bytes: number}>>} 稳定排序的文件清单。
 */
export async function collectFileDigests(rootDirectory) {
  const relativePaths = await collectFiles(rootDirectory)
  const digests = []

  for (const relativePath of relativePaths) {
    const absolutePath = path.join(rootDirectory, ...relativePath.split('/'))
    const fileStat = await stat(absolutePath)
    digests.push({
      path: relativePath,
      sha256: await calculateFileDigest(absolutePath),
      bytes: fileStat.size,
    })
  }

  return digests
}

/**
 * 计算目录内普通文件的总字节数。
 *
 * @param {string} rootDirectory 待统计目录。
 * @returns {Promise<number>} 所有普通文件大小之和。
 */
export async function getDirectorySize(rootDirectory) {
  const relativePaths = await collectFiles(rootDirectory)
  let totalBytes = 0
  for (const relativePath of relativePaths) {
    const fileStat = await stat(path.join(rootDirectory, ...relativePath.split('/')))
    totalBytes += fileStat.size
  }
  return totalBytes
}

/**
 * 写入带稳定缩进和末尾换行的 JSON 文件。
 *
 * @param {string} filePath 输出文件路径。
 * @param {unknown} value 可 JSON 序列化的数据。
 * @returns {Promise<void>} 文件写入完成后结束。
 */
export async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

/**
 * 读取并解析 UTF-8 JSON 文件。
 *
 * @param {string} filePath JSON 文件路径。
 * @returns {Promise<unknown>} 解析后的 JSON 值。
 */
export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

/**
 * 复制目录内容到目标目录，调用方负责处理路径冲突。
 *
 * @param {string} sourceDirectory 源目录。
 * @param {string} targetDirectory 目标目录。
 * @returns {Promise<void>} 递归复制完成后结束。
 */
export async function copyDirectory(sourceDirectory, targetDirectory) {
  await mkdir(targetDirectory, { recursive: true })
  await cp(sourceDirectory, targetDirectory, { recursive: true, force: false, errorOnExist: true })
}
