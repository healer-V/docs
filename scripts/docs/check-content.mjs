/**
 * 全站 Markdown 内容质量检查。
 *
 * 用法：node scripts/docs/check-content.mjs [路径前缀...] [--strict] [--json]
 * 默认只报告问题并以 0 退出；传入 --strict 时存在错误则以 1 退出。
 * 路径前缀相对于 content/，例如 frontend/08-react16。
 * 未被 sidebar 或顶部导航引用的页面记为 orphan 警告，供旧稿清理时参考。
 * 连续三条以上“加粗关键词：短句”的列表项记为 filler-list 警告，提示人工判断是否为空话清单。
 */
import { readFileSync, readdirSync } from 'node:fs'
import { extname, relative, resolve, sep, basename, dirname } from 'node:path'
import { rawNav } from '../../.vitepress/themeConfig/nav.js'
import { loadSidebar } from '../../.vitepress/themeConfig/sidebar.js'

const REPO_ROOT = resolve(import.meta.dirname, '../..')
const CONTENT_ROOT = resolve(REPO_ROOT, 'content')
const args = process.argv.slice(2)
const STRICT = args.includes('--strict')
const AS_JSON = args.includes('--json')
const PREFIXES = args.filter((arg) => !arg.startsWith('--'))
const EXEMPT_TOP = new Set(['diary', 'about', 'public', 'interview', 'project'])
const EXEMPT_FILES = new Set(['index.md', 'links.md'])
const CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十']
const MAX_CODE_LINES = 10
const EXAMPLE_DIR = /(^|[\s(`'"]|\.\.?\/)examples?\//
const FILLER_ITEM = /^\s*(?:\d+\.|[-*+])\s+\*\*([^*]+)\*\*\s*[：:]\s*(.*)$/
const FILLER_MAX_CHARS = 18
const FILLER_MIN_RUN = 3

const issues = []

/**
 * 记录一条检查结果。
 *
 * @param {'error'|'warning'} level 问题级别
 * @param {string} file 相对 content/ 的路径
 * @param {number} line 1 起始的行号，0 表示文件级
 * @param {string} rule 规则编号
 * @param {string} message 问题说明
 */
function report(level, file, line, rule, message) {
  issues.push({ level, file, line, rule, message })
}

/**
 * 递归收集需要检查的 Markdown 文件。
 *
 * @param {string} directory 绝对目录
 * @returns {string[]} 绝对路径列表
 */
function collect(directory) {
  const files = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = resolve(directory, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'images' || entry.name === 'node_modules') continue
      files.push(...collect(full))
    } else if (extname(entry.name) === '.md') {
      files.push(full)
    }
  }
  return files.sort()
}

/**
 * 判断文件是否属于豁免范围或不在过滤前缀内。
 *
 * @param {string} rel 相对 content/ 的路径
 * @returns {boolean} 需要检查时返回 true
 */
function shouldCheck(rel) {
  const parts = rel.split(sep)
  if (parts.length < 2 || EXEMPT_TOP.has(parts[0])) return false
  if (PREFIXES.length && !PREFIXES.some((prefix) => rel.split(sep).join('/').startsWith(prefix))) return false
  return true
}

/**
 * 去掉行内代码、链接地址和强调标记，得到用于统计长度的纯文本。
 *
 * @param {string} text Markdown 行内文本
 * @returns {string} 纯文本
 */
function plainText(text) {
  return text.replace(/`[^`]*`/g, 'C').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_]/g, '').trim()
}

/**
 * 检查单篇文章的 Frontmatter、标题、代码折叠、示例目录引用和骨架化小节。
 *
 * @param {string} rel 相对 content/ 的路径
 * @param {string} source 文件原文
 */
function checkArticle(rel, source) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const isIndex = EXEMPT_FILES.has(basename(rel))
  let title = null
  let start = 0
  if (lines[0] === '---') {
    const end = lines.indexOf('---', 1)
    if (end > 0) {
      const match = lines.slice(1, end).join('\n').match(/^title:\s*["']?(.+?)["']?\s*$/m)
      title = match ? match[1] : null
      start = end + 1
    }
  }
  if (!isIndex && title === null) report('error', rel, 1, 'frontmatter', '缺少 Frontmatter 或 title 字段')

  const h1 = []
  const sections = []
  const counters = { h2: 0, h3: 0, h4: 0 }
  let fence = null
  let fenceStart = 0
  let detailsDepth = 0
  let current = null
  let fillerRun = []
  /** 连续空话候选达到阈值时记录警告，并开始新的计数。 */
  const flushFiller = () => {
    if (!isIndex && fillerRun.length >= FILLER_MIN_RUN) {
      report('warning', rel, fillerRun[0], 'filler-list', `连续 ${fillerRun.length} 条“加粗关键词：短句”列表项，检查是否只有断言没有依据`)
    }
    fillerRun = []
  }

  for (let index = start; index < lines.length; index += 1) {
    const line = lines[index]
    const lineNo = index + 1
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})(.*)$/)
    if (EXAMPLE_DIR.test(line) && !isIndex) report('error', rel, lineNo, 'example-dir', '引用了仓库示例目录')
    if (fence) {
      if (fenceMatch && fenceMatch[1].startsWith(fence) && !fenceMatch[2].trim()) {
        const length = index - fenceStart - 1
        if (length > MAX_CODE_LINES && detailsDepth === 0) {
          report('error', rel, fenceStart + 1, 'code-fold', `代码块 ${length} 行，超过 ${MAX_CODE_LINES} 行但未放入 details`)
        }
        fence = null
      }
      continue
    }
    const fillerItem = line.match(FILLER_ITEM)
    if (fillerItem && plainText(fillerItem[2]).length <= FILLER_MAX_CHARS) fillerRun.push(lineNo)
    else if (line.trim()) flushFiller()
    if (fenceMatch) {
      fence = fenceMatch[1]
      fenceStart = index
      if (!fenceMatch[2].trim()) report('warning', rel, lineNo, 'code-lang', '代码块未标注语言')
      if (current) Object.assign(current, { rich: true, empty: false })
      continue
    }
    if (/^:{3,}\s*details\b/.test(line)) detailsDepth += 1
    else if (/^:{3,}\s*$/.test(line) && detailsDepth > 0) detailsDepth -= 1
    if (/^:{3,}\s*detail\s/.test(line)) report('error', rel, lineNo, 'container', '容器名应为 details 而不是 detail')

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/)
    if (heading) {
      const level = heading[1].length
      const text = heading[2]
      if (level === 1) h1.push({ text: text.replace(/\s*\{#[^}]*\}\s*$/, ''), lineNo })
      if (!isIndex) checkNumbering(rel, lineNo, level, text, counters)
      current = { level, text, lineNo, sentences: 0, rich: false, empty: true }
      sections.push(current)
      continue
    }
    if (current && line.trim()) {
      current.empty = false
      if (/^\s*([-*+]|\d+\.|\||>|:::|!\[)/.test(line)) current.rich = true
      else current.sentences += (line.match(/[。！？]/g) || []).length || 1
    }
  }

  flushFiller()
  if (!isIndex) {
    if (h1.length !== 1) report('error', rel, 0, 'h1', `一级标题数量为 ${h1.length}，应为 1`)
    else if (title && h1[0].text !== title) report('error', rel, h1[0].lineNo, 'h1', 'Frontmatter title 与一级标题不一致')
  }
  checkSkeleton(rel, sections)
}

/**
 * 检查二到四级标题的中文数字和阿拉伯数字编号是否连续。
 *
 * @param {string} rel 文件路径
 * @param {number} lineNo 标题行号
 * @param {number} level 标题级别
 * @param {string} text 标题文本
 * @param {{h2:number,h3:number,h4:number}} counters 当前编号状态
 */
function checkNumbering(rel, lineNo, level, text, counters) {
  if (level === 2) {
    counters.h2 += 1
    counters.h3 = 0
    const expected = `${CN[counters.h2 - 1]}、`
    if (!text.startsWith(expected)) report('warning', rel, lineNo, 'heading-number', `二级标题应以“${expected}”开头`)
  } else if (level === 3) {
    counters.h3 += 1
    counters.h4 = 0
    if (!text.startsWith(`${counters.h3}. `)) report('warning', rel, lineNo, 'heading-number', `三级标题应以“${counters.h3}. ”开头`)
  } else if (level === 4) {
    counters.h4 += 1
    const expected = `${counters.h3}.${counters.h4} `
    if (!text.startsWith(expected)) report('warning', rel, lineNo, 'heading-number', `四级标题应以“${expected}”开头`)
  } else if (level > 4) {
    report('warning', rel, lineNo, 'heading-depth', '标题超过四级')
  }
}

/**
 * 找出空小节、只有一句话的骨架化小节，以及连续三个以上的骨架化小节。
 *
 * @param {string} rel 文件路径
 * @param {Array<{level:number,lineNo:number,sentences:number,rich:boolean,empty:boolean}>} sections 小节列表
 */
function checkSkeleton(rel, sections) {
  let streak = 0
  sections.forEach((section, index) => {
    if (section.level < 2) return
    const next = sections[index + 1]
    const hasChild = next && next.level > section.level
    if (section.empty && !hasChild) report('error', rel, section.lineNo, 'empty-section', '小节没有正文')
    const skeleton = !hasChild && !section.empty && !section.rich && section.sentences <= 1
    if (skeleton) report('warning', rel, section.lineNo, 'skeleton', '小节只有一句普通正文')
    streak = skeleton ? streak + 1 : hasChild ? streak : 0
    if (streak === 3) report('error', rel, section.lineNo, 'skeleton-run', '连续三个以上骨架化小节')
  })
}

/**
 * 检查同级编号目录或文件的重复与断层。
 *
 * @param {string[]} files 已收集的绝对路径
 */
function checkNumberingOfEntries(files) {
  const groups = new Map()
  const add = (parent, name) => {
    const match = name.match(/^(\d{2})-/)
    if (!match) return
    if (!groups.has(parent)) groups.set(parent, new Map())
    const bucket = groups.get(parent)
    bucket.set(match[1], [...(bucket.get(match[1]) || []), name])
  }
  const seenDirs = new Set()
  for (const file of files) {
    add(dirname(file), basename(file))
    let directory = dirname(file)
    while (directory.startsWith(CONTENT_ROOT) && directory !== CONTENT_ROOT && !seenDirs.has(directory)) {
      seenDirs.add(directory)
      add(dirname(directory), basename(directory))
      directory = dirname(directory)
    }
  }
  for (const [parent, bucket] of groups) {
    const rel = relative(CONTENT_ROOT, parent) || '.'
    if (!shouldCheck(`${rel}${sep}_`)) continue
    for (const [number, names] of bucket) {
      if (new Set(names).size > 1) report('error', rel, 0, 'duplicate-number', `编号 ${number} 重复：${[...new Set(names)].join('、')}`)
    }
    const numbers = [...bucket.keys()].map(Number).sort((a, b) => a - b)
    numbers.forEach((value, index) => {
      if (value !== index + 1) {
        report('warning', rel, 0, 'number-gap', `编号不连续：${numbers.map((n) => String(n).padStart(2, '0')).join(' ')}`)
      }
    })
  }
}

/**
 * 收集 sidebar 与顶部导航引用的页面，统一为不带扩展名、相对 content/ 的路径。
 *
 * @returns {Promise<Set<string>>} 已被导航引用的页面路径集合
 */
async function collectNavigationPages() {
  const pages = new Set()
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit)
    if (!node || typeof node !== 'object') return
    if (typeof node.link === 'string' && node.link.startsWith('/')) {
      const path = node.link.split(/[#?]/)[0].replace(/^\//, '').replace(/\.(md|html)$/, '')
      pages.add(!path || path.endsWith('/') ? `${path}index` : path)
    }
    Object.values(node).forEach(visit)
  }
  visit(await loadSidebar(null, { includeMissing: true }))
  visit(rawNav)
  return pages
}

/**
 * 标记没有被导航引用的普通文章；这类页面仍会构建发布，但读者无法从目录到达。
 *
 * @param {string[]} files 已收集的绝对路径
 * @param {Set<string>} pages 已被导航引用的页面
 */
function checkOrphans(files, pages) {
  for (const file of files) {
    const rel = relative(CONTENT_ROOT, file)
    if (EXEMPT_FILES.has(basename(rel))) continue
    if (!pages.has(rel.split(sep).join('/').replace(/\.md$/, ''))) {
      report('warning', rel, 0, 'orphan', '未被 sidebar 或顶部导航引用，读者无法从目录到达')
    }
  }
}

const all = collect(CONTENT_ROOT)
const targets = all.filter((file) => shouldCheck(relative(CONTENT_ROOT, file)))
for (const file of targets) checkArticle(relative(CONTENT_ROOT, file), readFileSync(file, 'utf8'))
checkNumberingOfEntries(targets)
checkOrphans(targets, await collectNavigationPages())

const deduped = [...new Map(issues.map((item) => [JSON.stringify(item), item])).values()]
const errors = deduped.filter((item) => item.level === 'error')
if (AS_JSON) {
  console.log(JSON.stringify({ files: targets.length, issues: deduped }, null, 2))
} else {
  const byModule = new Map()
  for (const item of deduped) {
    const key = item.file.split(sep).slice(0, 2).join('/')
    const stat = byModule.get(key) || { error: 0, warning: 0 }
    stat[item.level] += 1
    byModule.set(key, stat)
  }
  if (PREFIXES.length) {
    for (const item of deduped) console.log(`[${item.level}] ${item.file}${item.line ? `:${item.line}` : ''} ${item.rule} ${item.message}`)
  }
  console.log(`\n检查 ${targets.length} 个文件，错误 ${errors.length}，警告 ${deduped.length - errors.length}`)
  console.table(Object.fromEntries([...byModule].sort()))
}
if (STRICT && errors.length) process.exit(1)
