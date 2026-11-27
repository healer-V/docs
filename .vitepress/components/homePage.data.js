import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { nav } from '../themeConfig/nav.js'
import { navigationLinkToSourcePath } from '../themeConfig/navigation.js'
import { markdownPathToRoute } from '../../scripts/docs/lib/routes.mjs'

const REPOSITORY_ROOT = fileURLToPath(new URL('../../', import.meta.url))
const CONTENT_ROOT = path.join(REPOSITORY_ROOT, 'content')
const MAX_RECENT_DAYS = 3
const MAX_RECENT_ITEMS = 8
const MAX_ITEMS_PER_MODULE_DAY = 2

// 首页知识地图的方向顺序、统计目录和展示模块；模块按有效导航的文案查找链接，缺失的模块跳过并告警。
const DIRECTIONS = [
  { key: 'frontend', label: '前端', icon: 'layout', description: '从 HTML、CSS、JavaScript 到框架原理', roots: ['frontend'], navGroup: '前端', modules: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'Vue 3', 'React 18'] },
  { key: 'backend', label: '后端', icon: 'server', description: '语言、框架、数据存储与架构设计', roots: ['backend'], navGroup: '后端', modules: ['Node.js', 'Java', 'Spring Boot', 'MySQL', 'Redis', '微服务架构'] },
  { key: 'ai', label: 'AI 应用', icon: 'spark', description: '从模型接入到 Agent、评测与治理', roots: ['ai'], navGroup: 'AI', modules: ['AI 应用基础', '模型接入', 'Prompt 与上下文', 'RAG 应用', 'Agent 开发', '框架与编排'] },
  { key: 'operation', label: 'DevOps', icon: 'infinity', description: '主机、容器、持续交付与可观测性', roots: ['operation'], navGroup: 'DevOps', modules: ['Linux', 'Bash 与 Shell', 'Nginx', 'Docker', 'Kubernetes', 'CI/CD'] },
  { key: 'web3', label: 'Web3', icon: 'cube', description: '区块链原理到合约开发与 DApp', roots: ['web3'], navGroup: 'Web3', modules: ['区块链基础', '以太坊与 EVM', 'Solidity', 'DApp 开发'] },
  { key: 'crossend', label: '跨端', icon: 'phone', description: '移动端与桌面端技术栈', roots: ['crossend'], navGroup: '跨端', modules: ['React Native', 'Flutter', 'HarmonyOS', 'Electron'] },
  { key: 'engineering', label: '工程化', icon: 'tool', description: '构建工具与微前端', roots: ['engineering', 'microfrontend'], navGroup: '前端', modules: ['Vite', 'Qiankun'] },
  { key: 'practice', label: '实践', icon: 'check', description: '面试题库、组件封装与项目难点', roots: ['interview', 'practices', 'project', 'skill'], navGroup: '实践', modules: ['前端题库', 'Java题库', '全栈题库', 'Agent题库', '组件封装', '项目实践', '项目难点'] },
]

/**
 * 递归列出目录下的 Markdown 文件。
 *
 * @param {string} directory 绝对目录路径。
 * @returns {string[]} 相对于 `content/` 的 POSIX 路径。
 */
function listMarkdownFiles(directory) {
  if (!existsSync(directory)) return []
  const files = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(entryPath))
    } else if (entry.name.endsWith('.md')) {
      files.push(path.relative(CONTENT_ROOT, entryPath).split(path.sep).join('/'))
    }
  }
  return files
}

/**
 * 读取 Markdown 的 Frontmatter 标题，缺失时退回第一个一级标题和文件名。
 *
 * @param {string} sourcePath 相对于 `content/` 的 Markdown 路径。
 * @returns {string} 页面标题。
 */
function readTitle(sourcePath) {
  const text = readFileSync(path.join(CONTENT_ROOT, sourcePath), 'utf8')
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? ''
  const frontmatterTitle = frontmatter.match(/^title:\s*(.+)$/m)?.[1]
  const headingTitle = text.match(/^#\s+(.+)$/m)?.[1]
  const title = frontmatterTitle ?? headingTitle ?? path.posix.basename(sourcePath, '.md')
  return title.trim().replace(/^(['"])(.*)\1$/, '$2')
}

/**
 * 在导航分组中按文案查找叶子链接。
 *
 * @param {object[]} items 导航条目。
 * @param {string} text 叶子文案。
 * @returns {string | null} 命中时返回导航链接。
 */
function findNavigationLink(items, text) {
  for (const item of items ?? []) {
    if (item.text === text && item.link) return item.link
    const nested = findNavigationLink(item.items, text)
    if (nested) return nested
  }
  return null
}

/**
 * 在有效导航中解析方向下的模块链接；导航已过滤不存在的页面，缺失模块只告警不阻断构建。
 *
 * @param {object} direction 首页方向配置。
 * @returns {{ label: string, link: string, count: number, firstTitle: string }[]} 至少包含一个模块的展示列表；`count` 为模块目录下的 Markdown 篇数，`firstTitle` 为导航入口页标题。
 */
function resolveDirectionModules(direction) {
  const group = nav.find((item) => item.text === direction.navGroup)
  const modules = []
  for (const label of direction.modules) {
    const sourcePath = navigationLinkToSourcePath(findNavigationLink(group?.items, label) ?? '')
    if (!sourcePath || !existsSync(path.join(CONTENT_ROOT, sourcePath))) {
      console.warn(`[home] 导航「${direction.navGroup}」中没有可用页面，首页跳过模块: ${label}`)
      continue
    }
    modules.push({
      label,
      link: markdownPathToRoute(sourcePath, '/'),
      count: listMarkdownFiles(path.join(CONTENT_ROOT, moduleKeyOf(sourcePath))).length,
      firstTitle: readTitle(sourcePath),
    })
  }
  if (modules.length === 0) {
    throw new Error(`首页知识地图方向没有任何可用模块: ${direction.label}`)
  }
  return modules
}

/**
 * 取源文件所在的模块目录，作为最近更新的模块归属键。
 *
 * @param {string} sourcePath 相对于 `content/` 的 Markdown 路径。
 * @returns {string} 一级或二级目录键。
 */
function moduleKeyOf(sourcePath) {
  const segments = sourcePath.split('/')
  return segments.length > 2 ? segments.slice(0, 2).join('/') : segments[0]
}

/**
 * 从导航叶子建立模块目录到模块名称的映射。
 *
 * @returns {Map<string, string>} 模块目录键到导航文案。
 */
function createModuleLabels() {
  const labels = new Map()

  /** 深度优先遍历导航，先出现的文案优先作为模块名称。 */
  function walk(items) {
    for (const item of items ?? []) {
      const sourcePath = item.link ? navigationLinkToSourcePath(item.link) : null
      if (sourcePath && !labels.has(moduleKeyOf(sourcePath))) {
        labels.set(moduleKeyOf(sourcePath), item.text)
      }
      walk(item.items)
    }
  }

  walk(nav)
  return labels
}

/**
 * 读取 git 历史中新增或修改过的正文，按文件最近一次提交日期去重。
 *
 * @returns {{ sourcePath: string, date: string }[]} 从新到旧排列的更新记录；无 git 历史时为空数组。
 */
function readGitUpdates() {
  let output = ''
  try {
    output = execFileSync('git', ['log', '-n', '300', '--diff-filter=AM', '--name-only', '--format=@@%as', '--', 'content'], {
      cwd: REPOSITORY_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch {
    return []
  }

  const updates = []
  const seen = new Set()
  let date = ''
  for (const line of output.split('\n')) {
    if (line.startsWith('@@')) {
      date = line.slice(2)
      continue
    }
    const sourcePath = line.trim().replace(/^content\//, '')
    if (!sourcePath.endsWith('.md') || seen.has(sourcePath)) continue
    seen.add(sourcePath)
    if (existsSync(path.join(CONTENT_ROOT, sourcePath))) {
      updates.push({ sourcePath, date })
    }
  }
  return updates
}

/**
 * 读取仓库首次提交日期和提交总数；部署流水线使用完整克隆，浅克隆或无 git 时返回空值。
 *
 * @returns {{ firstCommit: string | null, commitCount: number | null }} 首次提交的 `YYYY-MM-DD` 与提交次数。
 */
function readGitSummary() {
  const run = (args) => execFileSync('git', args, { cwd: REPOSITORY_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  try {
    if (run(['rev-parse', '--is-shallow-repository']) === 'true') return { firstCommit: null, commitCount: null }
    return {
      firstCommit: run(['log', '--reverse', '--format=%as']).split('\n')[0] || null,
      commitCount: Number(run(['rev-list', '--count', 'HEAD'])) || null,
    }
  } catch {
    return { firstCommit: null, commitCount: null }
  }
}

/**
 * 将最近更新按日期聚合，同一天同一模块最多展示两篇，避免整章重写占满列表。
 *
 * @param {{ sourcePath: string, date: string }[]} updates 已归属到方向的 git 更新记录。
 * @param {(sourcePath: string) => object} findDirection 源文件到方向的映射函数。
 * @returns {object[]} 最多三天、八篇的展示分组，`total` 为当天全部更新篇数。
 */
function groupRecentUpdates(updates, findDirection) {
  const moduleLabels = createModuleLabels()
  const groups = []
  let shown = 0

  for (const update of updates) {
    let group = groups.at(-1)
    if (!group || group.date !== update.date) {
      if (groups.length === MAX_RECENT_DAYS || shown >= MAX_RECENT_ITEMS) break
      group = { date: update.date, total: 0, items: [], perModule: new Map() }
      groups.push(group)
    }

    group.total += 1
    const moduleKey = moduleKeyOf(update.sourcePath)
    const moduleCount = group.perModule.get(moduleKey) ?? 0
    if (shown >= MAX_RECENT_ITEMS || moduleCount >= MAX_ITEMS_PER_MODULE_DAY) continue

    const direction = findDirection(update.sourcePath)
    group.perModule.set(moduleKey, moduleCount + 1)
    group.items.push({
      title: readTitle(update.sourcePath),
      link: markdownPathToRoute(update.sourcePath, '/'),
      tag: moduleLabels.get(moduleKey) ?? direction.label,
      direction: direction.label,
    })
    shown += 1
  }

  return groups.map(({ date, total, items }) => ({ date, total, items }))
}

// 首页复习面板逐篇展示的题库；其余题库只展示首篇入口。
const EXPANDED_INTERVIEW_BANK = 'interview/frontend'

/**
 * 读取面试题库的复习入口：前端题库逐篇展示，其余题库按导航顺序各展示一个首篇入口；总览页 `interview/index.md` 不参与展示。
 *
 * @returns {{ label: string, link: string }[]} 前端题库按文件编号排序的主题，其后为各题库入口；题库入口使用导航中的题库名称，缺失时退回首篇标题。
 */
function readInterviewTopics() {
  const bankFiles = listMarkdownFiles(path.join(CONTENT_ROOT, 'interview'))
    .filter((sourcePath) => sourcePath.split('/').length > 2)
    .sort()
  const topicLabel = (sourcePath) => readTitle(sourcePath).replace(/\s*面试题$/, '').trim()
  const expandedTopics = bankFiles
    .filter((sourcePath) => moduleKeyOf(sourcePath) === EXPANDED_INTERVIEW_BANK)
    .map((sourcePath) => ({ label: topicLabel(sourcePath), link: markdownPathToRoute(sourcePath, '/') }))

  const bankEntries = new Map()
  for (const sourcePath of bankFiles) {
    const bankKey = moduleKeyOf(sourcePath)
    if (bankKey !== EXPANDED_INTERVIEW_BANK && !bankEntries.has(bankKey)) bankEntries.set(bankKey, sourcePath)
  }
  // 有导航入口的题库按导航顺序排列，其余题库按路径顺序追加在后。
  const moduleLabels = createModuleLabels()
  const navOrdered = [...moduleLabels.keys()].filter((bankKey) => bankEntries.has(bankKey))
  const bankKeys = [...navOrdered, ...[...bankEntries.keys()].filter((bankKey) => !navOrdered.includes(bankKey))]
  const bankTopics = bankKeys.map((bankKey) => ({
    label: moduleLabels.get(bankKey) ?? topicLabel(bankEntries.get(bankKey)),
    link: markdownPathToRoute(bankEntries.get(bankKey), '/'),
  }))
  return [...expandedTopics, ...bankTopics]
}

/**
 * 收集随机复习的候选正文，排除目录页 `index.md`。
 *
 * @param {object[]} directions 已解析的首页方向。
 * @returns {[string, string, string, string][]} `[标题, 站内路由, 方向名, 模块名]` 元组，压缩首页数据体积；模块名未知时为空字符串。
 */
function readReviewPool(directions) {
  const moduleLabels = createModuleLabels()
  return directions.flatMap((direction) => direction.roots
    .flatMap((root) => listMarkdownFiles(path.join(CONTENT_ROOT, root)))
    .filter((sourcePath) => !sourcePath.endsWith('index.md'))
    .sort()
    .map((sourcePath) => [
      readTitle(sourcePath),
      markdownPathToRoute(sourcePath, '/'),
      direction.label,
      moduleLabels.get(moduleKeyOf(sourcePath)) ?? '',
    ]))
}

export default {
  watch: ['../../content/**/*.md'],
  load() {
    const directions = DIRECTIONS.map((direction) => {
      const count = direction.roots.reduce((sum, root) => sum + listMarkdownFiles(path.join(CONTENT_ROOT, root)).length, 0)
      return { ...direction, count, modules: resolveDirectionModules(direction) }
    })

    const findDirection = (sourcePath) => directions.find((direction) => direction.roots.includes(sourcePath.split('/')[0]))
    const updates = readGitUpdates().filter((update) => findDirection(update.sourcePath))
    const recentGroups = groupRecentUpdates(updates, findDirection)

    return {
      total: directions.reduce((sum, direction) => sum + direction.count, 0),
      directions: directions.map(({ key, label, icon, description, count, modules }) => ({ key, label, icon, description, count, modules })),
      reviewPool: readReviewPool(directions),
      lastUpdated: updates[0]?.date ?? null,
      recentGroups,
      ...readGitSummary(),
      interviewTopics: readInterviewTopics(),
    }
  },
}
