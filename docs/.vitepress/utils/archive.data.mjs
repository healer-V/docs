import { createContentLoader } from 'vitepress'
import { execSync } from 'child_process'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CACHE_FILE = join(__dirname, '../cache/git-dates.json')

// ── 读取或构建 git 日期缓存 ───────────────────────────────────
function getGitDateCache() {
  // 1. 尝试读取缓存
  if (existsSync(CACHE_FILE)) {
    try {
      const json = readFileSync(CACHE_FILE, 'utf-8')
      const data = JSON.parse(json)
      return new Map(Object.entries(data))
    } catch {}
  }

  // 2. 缓存不存在或损坏，执行 git 命令
  const cache = new Map()
  try {
    const output = execSync(
      'git log --diff-filter=A --name-status --format="COMMIT:%ad" --date=short -- docs/',
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'], cwd: join(__dirname, '../../..') }
    )
    let currentDate = null
    for (const line of output.split('\n')) {
      const t = line.trim()
      if (t.startsWith('COMMIT:')) {
        currentDate = t.slice(7)
      } else if (t.startsWith('A\t') && currentDate) {
        const filePath = t.slice(2).replace(/\\/g, '/')
        if (!cache.has(filePath) && filePath.endsWith('.md')) {
          cache.set(filePath, currentDate)
        }
      }
    }
  } catch {}

  // 3. 写入缓存
  try {
    mkdirSync(dirname(CACHE_FILE), { recursive: true })
    writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(cache), null, 2))
  } catch {}

  return cache
}

const gitDateCache = getGitDateCache()

// 需要排除的文件名
const EXCLUDE_FILES = ['index', 'guide', 'blog-list', 'links', 'me']
const EXCLUDE_DIRS = ['about/', 'articles/about/']

export default createContentLoader('**/*.md', {
  includeSrc: true,
  transform(rawData) {
    return rawData
      .filter(page => {
        const rel = page.url.replace(/^\/docs\//, '').replace(/\.html$/, '').replace(/^\//, '')
        if (!rel) return false
        const fileName = rel.split('/').pop() || ''
        if (EXCLUDE_FILES.includes(fileName)) return false
        if (EXCLUDE_DIRS.some(dir => rel.startsWith(dir))) return false
        const src = page.src || ''
        const bodyContent = src.replace(/^#\s+.+$/m, '').replace(/---[\s\S]*?---/g, '').trim()
        if (bodyContent.length < 50) return false
        return true
      })
      .map(page => {
        const fm = page.frontmatter || {}
        const relativePath = page.url.replace(/^\/docs\//, '').replace(/\.html$/, '').replace(/^\//, '')

        // 标题
        const titleMatch = (page.src || '').match(/^#\s+(.+)$/m)
        const title = fm.title || (titleMatch ? titleMatch[1].trim() : relativePath.split('/').pop())

        // 分类、标签
        const category = fm.category || '未分类'
        const tags = Array.isArray(fm.tags) ? fm.tags.slice(0, 4) : []

        // 摘要
        let excerpt = fm.excerpt || ''
        if (!excerpt) {
          const lines = (page.src || '').split('\n')
          let inCode = false
          for (const line of lines) {
            const t = line.trim()
            if (t.startsWith('```')) { inCode = !inCode; continue }
            if (inCode) continue
            if (!t || t.startsWith('#') || t === '---' || t.startsWith('![') || /^:::/.test(t)) continue
            let cleaned = t
              .replace(/^>\s*(\[!.*?\]\s*)?/g, '')
              .replace(/^[-*+]\s+/, '')
              .replace(/^\d+[.、]\s*/, '')
              .replace(/\*\*/g, '')
              .replace(/`([^`]*)`/g, '$1')
              .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
              .replace(/<[^>]+>/g, '')
              .trim()
            if (cleaned.length > 0) {
              excerpt += cleaned + ' '
              if (excerpt.length > 200) break
            }
          }
          excerpt = excerpt.trim().substring(0, 200)
          if (excerpt.length >= 200) excerpt += '...'
        }

        // 日期：frontmatter > git 首次提交
        const gitKey = 'docs/' + relativePath + '.md'
        const gitDate = gitDateCache.get(gitKey) || null
        const date = fm.date ? String(fm.date).slice(0, 10) : gitDate

        const wordCount = (page.src || '').length
        const readingTime = Math.max(1, Math.ceil(wordCount / 400))

        return {
          title,
          excerpt: excerpt || '暂无摘要',
          category,
          date,
          tags,
          readingTime,
          wordCount,
          path: page.url.replace(/\.html$/, '').replace(/^(?!\/docs\/)/, '/docs'),
          featured: fm.featured || false,
        }
      })
      .sort((a, b) => {
        if (a.date && b.date) return new Date(b.date) - new Date(a.date)
        if (a.date) return -1
        if (b.date) return 1
        return a.path.localeCompare(b.path)
      })
  }
})
