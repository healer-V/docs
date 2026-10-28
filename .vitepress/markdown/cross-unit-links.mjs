import { statSync } from 'node:fs'
import path from 'node:path'

import { getBuildUnitForSource } from '../../scripts/docs/build-units.mjs'

/**
 * 判断相对链接是否指向另一个构建单元内实际存在的 Markdown。
 * @param {string} href 尚未被 VitePress 添加部署 base 的原始链接。
 * @param {string} sourceFile 当前 Markdown 绝对路径，作为相对链接解析基准。
 * @param {string} sourceDirectory 全站 content 绝对路径，目标不得逃出该目录。
 * @param {string} unitName 当前构建单元名称；单体构建不调用此函数。
 * @returns {boolean} 只有归属明确、文件存在且属于其他单元时返回 true。
 */
export function isExistingCrossUnitLink(href, sourceFile, sourceDirectory, unitName) {
  if (!href || !sourceFile || href.startsWith('#') || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) {
    return false
  }

  try {
    const relativeSource = path.relative(sourceDirectory, sourceFile).replaceAll('\\', '/')
    const url = new URL(href, `https://docs.invalid/${relativeSource}`)
    let sourcePath = decodeURIComponent(url.pathname).replace(/^\/(?:docs\/)?/, '')
    if (sourcePath.endsWith('/')) sourcePath += 'index.md'
    else if (sourcePath.endsWith('.html')) sourcePath = sourcePath.slice(0, -5) + '.md'
    else if (!path.posix.extname(sourcePath)) sourcePath += '.md'

    const target = path.resolve(sourceDirectory, sourcePath)
    const relativeTarget = path.relative(sourceDirectory, target)
    if (relativeTarget.startsWith('..') || path.isAbsolute(relativeTarget)) return false
    return getBuildUnitForSource(sourcePath).name !== unitName && statSync(target).isFile()
  } catch {
    // 非法 URL、未登记方向和缺失文件仍交给 VitePress 的死链检查报告。
    return false
  }
}

/**
 * 保留跨单元链接的 HTML，只把已验证存在的目标交给合并后的全站门禁检查。
 * @param {import('markdown-it')} md 已安装 VitePress 链接渲染规则的实例。
 * @param {string} unitName 当前构建单元名称，必须来自单元注册表。
 * @param {string} sourceDirectory 全站 content 绝对路径。
 * @returns {void} 包装链接渲染器；同单元、缺失文件和非法链接仍参与原死链检查。
 */
export function configureCrossUnitLinks(md, unitName, sourceDirectory) {
  const renderLink = md.renderer.rules.link_open

  /**
   * 按源文件位置核实目标归属，避免被 srcExclude 排除的有效正文被误报。
   * @param {object[]} tokens 当前内联令牌列表。
   * @param {number} index link_open 令牌在列表中的索引。
   * @param {object} options Markdown 渲染选项，原样传递。
   * @param {object} env VitePress 环境，path 必须定位当前源文件，links 为死链检查输入。
   * @param {object} renderer 当前渲染器，原样传递。
   * @returns {string} 原 VitePress 规则生成的 HTML；仅调整本次新增的检查记录。
   */
  md.renderer.rules.link_open = function renderCrossUnitLink(tokens, index, options, env, renderer) {
    const href = tokens[index].attrGet('href')
    const existingCount = env.links?.length ?? 0
    const html = renderLink(tokens, index, options, env, renderer)
    if (isExistingCrossUnitLink(href, env.path, sourceDirectory, unitName)) {
      env.links?.splice(existingCount)
    }
    return html
  }
}
