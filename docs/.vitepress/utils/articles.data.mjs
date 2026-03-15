// 使用 VitePress createContentLoader 在构建时扫描所有 markdown 文件
// 优先读取 frontmatter 中的 title / category / tags / excerpt 字段
import { createContentLoader } from 'vitepress'

// 需要排除的文件名
const EXCLUDE_FILES = ['index', 'guide', 'blog-list', 'links', 'me']
// 需要排除的目录前缀（基于相对路径）
const EXCLUDE_DIRS = ['about/', 'articles/about/']

export default createContentLoader('**/*.md', {
  includeSrc: true,
  transform(rawData) {
    return rawData
      .filter(page => {
        // 统一转为相对路径做判断，去掉 /docs/ 前缀、.html 后缀、前导 /
        const rel = page.url.replace(/^\/docs\//, '').replace(/\.html$/, '').replace(/^\//, '')
        // 排除根路径
        if (!rel) return false
        // 排除特定文件名
        const fileName = rel.split('/').pop() || ''
        if (EXCLUDE_FILES.includes(fileName)) return false
        // 排除特定目录
        if (EXCLUDE_DIRS.some(dir => rel.startsWith(dir))) return false
        // 排除只有标题没有正文内容的文章
        const src = page.src || ''
        const bodyContent = src.replace(/^#\s+.+$/m, '').replace(/---[\s\S]*?---/g, '').trim()
        if (bodyContent.length < 50) return false
        return true
      })
      .map(page => {
        const fm = page.frontmatter || {}
        const relativePath = page.url.replace(/^\/docs\//, '').replace(/\.html$/, '').replace(/^\//, '')

        // 标题：frontmatter > # 标题 > 文件名
        const titleMatch = (page.src || '').match(/^#\s+(.+)$/m)
        const title = fm.title || (titleMatch ? titleMatch[1].trim() : relativePath.split('/').pop())

        // 分类：直接读 frontmatter.category
        const category = fm.category || '未分类'

        // 标签：直接读 frontmatter.tags
        const tags = Array.isArray(fm.tags) ? fm.tags.slice(0, 4) : []

        // 摘要：frontmatter.excerpt 优先，否则从正文提取
        let excerpt = fm.excerpt || ''
        if (!excerpt) {
          const lines = (page.src || '').split('\n')
          let inCodeBlock = false
          for (const line of lines) {
            const t = line.trim()
            if (t.startsWith('```')) { inCodeBlock = !inCodeBlock; continue }
            if (inCodeBlock) continue
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

        const wordCount = (page.src || '').length
        const readingTime = Math.max(1, Math.ceil(wordCount / 400))

        return {
          title,
          excerpt: excerpt || '暂无摘要',
          category,
          date: fm.date || null,
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
