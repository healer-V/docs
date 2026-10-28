/**
 * 校验微服务 Markdown 的结构、链接和 sidebar 引用。
 *
 * 默认模式允许已登记的旧占位目录作为迁移期警告；传入 --strict 后，
 * 所有占位页和非连续文件编号都会作为错误处理。
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, extname, relative, resolve, sep } from 'node:path'
import { createHash } from 'node:crypto'

const REPO_ROOT = resolve(import.meta.dirname, '..')
const DOCS_ROOT = resolve(REPO_ROOT, 'content')
const MICROSERVICES_ROOT = resolve(DOCS_ROOT, 'backend/06-microservices')
const SIDEBAR_FILE = resolve(REPO_ROOT, '.vitepress/themeConfig/sidebar/backend.js')
const LEGACY_BASELINE_FILE = resolve(REPO_ROOT, 'scripts/microservices-docs-baseline.json')
const STRICT = process.argv.includes('--strict')
const LEGACY_BASELINE = JSON.parse(readFileSync(LEGACY_BASELINE_FILE, 'utf8'))
const CHINESE_NUMBERS = [
  '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
]
const LEGACY_PLACEHOLDER_DIRECTORIES = new Set([
  '04-api-gateway',
  '05-message-queue',
  '06-consistency',
  '07-observability',
  '08-platform',
  '09-evolution',
])

const errors = []
const warnings = []

/**
 * 递归查找目录中的 Markdown 文件。
 *
 * @param {string} directory 要扫描的绝对目录
 * @returns {string[]} 按绝对路径排序的 Markdown 文件列表
 */
function findMarkdownFiles(directory) {
  const files = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = resolve(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath))
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.md') {
      files.push(fullPath)
    }
  }
  return files.sort()
}

/**
 * 使用项目当前 Frontmatter 子集读取标题和正文。
 *
 * @param {string} source Markdown 原文
 * @param {string} filePath 用于错误定位的文件路径
 * @returns {{ title: string, body: string, bodyLineOffset: number } | null} Frontmatter 信息；格式不合法时返回 null
 */
function parseFrontmatter(source, filePath) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (!match) {
    errors.push(`${toRepoPath(filePath)}: 缺少合法 Frontmatter`)
    return null
  }

  const titleMatch = match[1].match(/^title:\s*["']?(.+?)["']?\s*$/m)
  if (!titleMatch) {
    errors.push(`${toRepoPath(filePath)}: Frontmatter 缺少 title`)
    return null
  }

  return {
    title: titleMatch[1],
    body: source.slice(match[0].length),
    bodyLineOffset: (match[0].match(/\n/g) ?? []).length,
  }
}

/**
 * 读取代码块之外的标题、正文和代码围栏状态。
 *
 * @param {string} body 不含 Frontmatter 的 Markdown 正文
 * @param {number} bodyLineOffset 正文之前已经占用的文件行数
 * @returns {{ headings: Array<{ level: number, text: string, line: number }>, contentLines: Array<{ line: number, text: string }>, fenceCount: number, unlabeledFenceLines: number[] }} Markdown 结构信息
 */
function inspectMarkdownBody(body, bodyLineOffset) {
  const headings = []
  const contentLines = []
  const unlabeledFenceLines = []
  const lines = body.split(/\r?\n/)
  let inFence = false
  let fenceCount = 0

  lines.forEach((line, index) => {
    const fenceMatch = line.match(/^```(.*)$/)
    if (fenceMatch) {
      fenceCount += 1
      if (!inFence && fenceMatch[1].trim() === '') {
        unlabeledFenceLines.push(bodyLineOffset + index + 1)
      }
      inFence = !inFence
      return
    }

    if (inFence) return
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/)
    if (headingMatch) {
      headings.push({
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
        line: bodyLineOffset + index + 1,
      })
      return
    }

    if (line.trim() !== '') {
      contentLines.push({ line: bodyLineOffset + index + 1, text: line.trim() })
    }
  })

  return { headings, contentLines, fenceCount, unlabeledFenceLines }
}

/**
 * 校验标题层级、编号和标题下正文。
 *
 * @param {string} filePath 当前 Markdown 的绝对路径
 * @param {{ headings: Array<{ level: number, text: string, line: number }>, contentLines: Array<{ line: number, text: string }>, fenceCount: number, unlabeledFenceLines: number[] }} state Markdown 结构信息
 * @param {string} expectedTitle Frontmatter 标题
 * @param {boolean} unchangedLegacy 当前文件是否与实施前基线完全一致
 * @returns {void}
 */
function validateHeadingStructure(filePath, state, expectedTitle, unchangedLegacy) {
  const h1 = state.headings.filter((heading) => heading.level === 1)
  if (h1.length !== 1) {
    recordContentIssue(filePath, `应有且仅有一个一级标题，当前为 ${h1.length} 个`, unchangedLegacy)
  } else if (h1[0].text !== expectedTitle) {
    recordContentIssue(filePath, `${h1[0].line}: 一级标题与 Frontmatter title 不一致`, unchangedLegacy)
  }

  if (state.fenceCount % 2 !== 0) {
    recordContentIssue(filePath, '代码块围栏未闭合', unchangedLegacy)
  }
  for (const line of state.unlabeledFenceLines) {
    recordContentIssue(filePath, `${line}: 代码块缺少语言标识`, unchangedLegacy)
  }

  let h2Index = 0
  let h3Index = 0
  for (const heading of state.headings) {
    if (heading.level === 2) {
      h2Index += 1
      h3Index = 0
      const expected = CHINESE_NUMBERS[h2Index - 1]
      if (expected && !heading.text.startsWith(`${expected}、`)) {
        recordContentIssue(filePath, `${heading.line}: 二级标题应以“${expected}、”开头`, unchangedLegacy)
      }
    } else if (heading.level === 3) {
      h3Index += 1
      if (!heading.text.startsWith(`${h3Index}. `)) {
        recordContentIssue(filePath, `${heading.line}: 三级标题应以“${h3Index}. ”开头`, unchangedLegacy)
      }
    }
  }

  for (let index = 0; index < state.headings.length; index += 1) {
    const heading = state.headings[index]
    if (heading.level < 2) continue
    const nextHeading = state.headings[index + 1]
    const boundary = nextHeading?.line ?? Number.POSITIVE_INFINITY
    const hasOwnContent = state.contentLines.some(
      (entry) => entry.line > heading.line && entry.line < boundary,
    )
    if (!hasOwnContent) {
      recordContentIssue(filePath, `${heading.line}: 标题下没有正文或结构化内容`, unchangedLegacy)
    }
  }
}

/**
 * 校验一个 Markdown 文件中的相对链接目标。
 *
 * @param {string} filePath 当前 Markdown 的绝对路径
 * @param {string} source Markdown 原文
 * @param {boolean} unchangedLegacy 当前文件是否与实施前基线完全一致
 * @returns {void}
 */
function validateInternalLinks(filePath, source, unchangedLegacy) {
  const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g
  for (const match of source.matchAll(linkPattern)) {
    const target = match[1].trim().replace(/^<|>$/g, '')
    if (!target || target.startsWith('#') || /^[a-z]+:/i.test(target)) continue
    const withoutAnchor = decodeURIComponent(target.split('#')[0])
    if (!withoutAnchor) continue
    const resolvedTarget = withoutAnchor.startsWith('/')
      ? resolve(DOCS_ROOT, `.${withoutAnchor}`)
      : resolve(dirname(filePath), withoutAnchor)
    const candidates = extname(resolvedTarget)
      ? [resolvedTarget]
      : [`${resolvedTarget}.md`, resolve(resolvedTarget, 'index.md')]
    if (!candidates.some((candidate) => existsSync(candidate))) {
      recordContentIssue(filePath, `内部链接不存在 -> ${target}`, unchangedLegacy)
    }
  }
}

/**
 * 判断文件是否只有 Frontmatter 和一级标题。
 *
 * @param {{ headings: Array<{ level: number, text: string, line: number }>, contentLines: Array<{ line: number, text: string }>, fenceCount: number, unlabeledFenceLines: number[] }} state Markdown 结构信息
 * @returns {boolean} true 表示文件属于占位页
 */
function isPlaceholder(state) {
  return state.headings.length === 1
    && state.headings[0].level === 1
    && state.contentLines.length === 0
}

/**
 * 记录占位页；迁移期旧目录在非严格模式下只产生警告。
 *
 * @param {string} filePath 占位 Markdown 的绝对路径
 * @returns {void}
 */
function recordPlaceholder(filePath) {
  const relativePath = relative(MICROSERVICES_ROOT, filePath)
  const topDirectory = relativePath.split(sep)[0]
  const message = `${toRepoPath(filePath)}: 仅包含 Frontmatter 和一级标题`
  if (!STRICT && LEGACY_PLACEHOLDER_DIRECTORIES.has(topDirectory)) {
    warnings.push(message)
  } else {
    errors.push(message)
  }
}

/**
 * 判断文件内容是否与实施前保存的旧正文哈希一致。
 *
 * @param {string} filePath 当前 Markdown 的绝对路径
 * @param {string} source Markdown 原文
 * @returns {boolean} true 表示仍是尚未迁移的旧正文
 */
function isUnchangedLegacyFile(filePath, source) {
  const baselinePath = relative(MICROSERVICES_ROOT, filePath).split(sep).join('/')
  const expectedHash = LEGACY_BASELINE[baselinePath]
  if (!expectedHash) return false
  const actualHash = createHash('sha256').update(source).digest('hex').toUpperCase()
  return actualHash === expectedHash
}

/**
 * 记录正文质量问题；未变化旧文件在迁移期降级为警告。
 *
 * @param {string} filePath 当前 Markdown 的绝对路径
 * @param {string} message 不含文件路径的问题描述
 * @param {boolean} unchangedLegacy 当前文件是否与实施前基线完全一致
 * @returns {void}
 */
function recordContentIssue(filePath, message, unchangedLegacy) {
  const issue = `${toRepoPath(filePath)}:${message}`
  if (!STRICT && unchangedLegacy) warnings.push(issue)
  else errors.push(issue)
}

/**
 * 校验同一目录中带两位前缀的文章编号连续性。
 *
 * @param {string[]} files 微服务 Markdown 绝对路径列表
 * @returns {void}
 */
function validateFileNumbering(files) {
  const groups = new Map()
  for (const filePath of files) {
    const directory = dirname(filePath)
    const match = filePath.split(sep).at(-1).match(/^(\d{2})-/)
    if (!match) continue
    const group = groups.get(directory) ?? []
    group.push(Number(match[1]))
    groups.set(directory, group)
  }

  for (const [directory, numbers] of groups.entries()) {
    const sorted = [...numbers].sort((left, right) => left - right)
    const expected = Array.from({ length: sorted.length }, (_, index) => index + 1)
    if (STRICT && sorted.join(',') !== expected.join(',')) {
      errors.push(`${toRepoPath(directory)}: 文件编号不连续，当前为 ${sorted.join(', ')}`)
    }
  }
}

/**
 * 校验 sidebar 中全部微服务 Markdown 链接。
 *
 * @returns {void}
 */
function validateSidebarLinks() {
  const source = readFileSync(SIDEBAR_FILE, 'utf8')
  const links = [...source.matchAll(/"link":\s*"(\/backend\/06-microservices\/[^"]+\.md)"/g)]
    .map((match) => match[1])

  for (const link of links) {
    const target = resolve(DOCS_ROOT, `.${link}`)
    if (!existsSync(target)) {
      errors.push(`${toRepoPath(SIDEBAR_FILE)}: sidebar 链接不存在 -> ${link}`)
      continue
    }

    const parsed = parseFrontmatter(readFileSync(target, 'utf8'), target)
    if (!parsed) continue
    const state = inspectMarkdownBody(parsed.body, parsed.bodyLineOffset)
    if (isPlaceholder(state)) {
      const message = `${toRepoPath(SIDEBAR_FILE)}: sidebar 指向占位页 -> ${link}`
      if (STRICT) errors.push(message)
      else warnings.push(message)
    }
  }
}

/**
 * 把绝对路径转换为仓库内统一的正斜杠路径。
 *
 * @param {string} absolutePath 仓库内绝对路径
 * @returns {string} 适合终端输出的相对路径
 */
function toRepoPath(absolutePath) {
  return relative(REPO_ROOT, absolutePath).split(sep).join('/')
}

/** 输出校验问题并设置进程退出码。 */
function reportResults() {
  for (const warning of warnings) console.warn(`WARN  ${warning}`)
  for (const error of errors) console.error(`ERROR ${error}`)
  console.log(`\n微服务文档检查完成：${errors.length} 个错误，${warnings.length} 个警告。`)
  if (errors.length > 0) process.exitCode = 1
}

const markdownFiles = findMarkdownFiles(MICROSERVICES_ROOT)
for (const filePath of markdownFiles) {
  const source = readFileSync(filePath, 'utf8')
  const parsed = parseFrontmatter(source, filePath)
  if (!parsed) continue
  const state = inspectMarkdownBody(parsed.body, parsed.bodyLineOffset)
  if (isPlaceholder(state)) {
    recordPlaceholder(filePath)
    continue
  }
  const unchangedLegacy = isUnchangedLegacyFile(filePath, source)
  validateHeadingStructure(filePath, state, parsed.title, unchangedLegacy)
  validateInternalLinks(filePath, source, unchangedLegacy)
}

validateFileNumbering(markdownFiles)
validateSidebarLinks()
reportResults()
