/**
 * 批量为所有 markdown 文章添加 frontmatter
 * 用法: node scripts/add-frontmatter.mjs
 *
 * 规则：
 * - 跳过已有 frontmatter 的文件
 * - 跳过 index.md / guide.md / blog-list.md / links.md
 * - 从 # 标题提取 title
 * - 从目录路径推导 category 和 tags
 * - 从正文提取 excerpt（前120字）
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve, relative, basename } from 'path'
import { globSync } from 'fs'

// Node 22+ 支持 fs.globSync，低版本用简易递归
import { readdirSync, statSync } from 'fs'

const DOCS_DIR = resolve(import.meta.dirname, '../docs')

// 递归查找所有 .md 文件
function findMdFiles(dir) {
  const results = []
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry)
    if (entry === '.vitepress' || entry === 'node_modules') continue
    const stat = statSync(full)
    if (stat.isDirectory()) {
      results.push(...findMdFiles(full))
    } else if (entry.endsWith('.md')) {
      results.push(full)
    }
  }
  return results
}

// 排除的文件
const SKIP_FILES = ['index.md', 'guide.md', 'blog-list.md', 'links.md']

// 目录 → 分类名映射
const CATEGORY_MAP = {
  'frontend/01-html': '前端 · HTML',
  'frontend/02-css': '前端 · CSS',
  'frontend/03-javascript': '前端 · JavaScript',
  'frontend/04-ecmascript': '前端 · ECMAScript',
  'frontend/05-typescript': '前端 · TypeScript',
  'frontend/06-vue2': '前端 · Vue 2',
  'frontend/07-vue3': '前端 · Vue 3',
  'frontend/08-react16': '前端 · React 16',
  'frontend/09-react18': '前端 · React 18',
  'backend/01-nodejs': '后端 · Node.js',
  'backend/02-express': '后端 · Express',
  'backend/03-nestjs': '后端 · NestJS',
  'backend/04-java': '后端 · Java',
  'backend/05-python': '后端 · Python',
  'backend/06-golang': '后端 · Golang',
  'backend/07-springboot': '后端 · Spring Boot',
  'backend/08-django': '后端 · Django',
  'backend/09-mysql': '后端 · MySQL',
  'backend/10-redis': '后端 · Redis',
  'backend/11-mongodb': '后端 · MongoDB',
  'backend/11-postgresql': '后端 · PostgreSQL',
  'backend/12-postgresql': '后端 · PostgreSQL',
  'engineering/01-webpack': '工程化 · Webpack',
  'engineering/02-vite': '工程化 · Vite',
  'operation/00-linux': '运维 · Linux',
  'operation/01-shell': '运维 · Shell',
  'operation/02-jenkins': '运维 · Jenkins',
  'operation/03-cicd': '运维 · CI/CD',
  'operation/04-k8s': '运维 · Kubernetes',
  'operation/05-docker': '运维 · Docker',
  'operation/06-nginx': '运维 · Nginx',
  'crossend/01-reactnative': '跨端 · React Native',
  'crossend/02-flutter': '跨端 · Flutter',
  'crossend/03-harmonyos': '跨端 · HarmonyOS',
  'crossend/04-electron': '跨端 · Electron',
  'microfrontend/01-qiankun': '微前端 · Qiankun',
  'web3/01-web3.0': 'Web3 · Web3.js',
  'web3/01-web3.js': 'Web3 · Web3.js',
  'web3/02-solidity': 'Web3 · Solidity',
  'web3/03-ethereum': 'Web3 · Ethereum',
  'interview': '面试题',
  'skill': '实践技巧',
  'practices': '项目实践',
  'project': '项目要点',
  'articles/basic': '基础知识',
  'articles/blog': '博客相关',
  'articles/browser': '浏览器',
  'articles/engineering': '工程化',
  'articles/frame': '跨端框架',
  'articles/network': '网络协议',
  'articles/server': '服务端',
  'articles/tools': '开发工具',
  'articles/about': '关于',
  'diary': '随记',
}

// 关键词 → 标签
const TAG_KEYWORDS = [
  'Vue', 'React', 'JavaScript', 'TypeScript', 'CSS', 'HTML',
  'Node', 'Express', 'NestJS', 'Java', 'Python', 'Golang', 'Go',
  'Spring', 'Django', 'MySQL', 'Redis', 'MongoDB', 'PostgreSQL',
  'Docker', 'Kubernetes', 'K8s', 'Linux', 'Nginx', 'Jenkins',
  'Webpack', 'Vite', 'Rollup', 'ESBuild',
  'Flutter', 'Electron', 'HarmonyOS', 'React Native',
  'Solidity', 'Ethereum', 'Web3',
  'Qiankun', 'Git', 'Shell', 'CI/CD',
]

function resolveCategory(relPath) {
  for (const [prefix, cat] of Object.entries(CATEGORY_MAP)) {
    if (relPath.startsWith(prefix)) return cat
  }
  return relPath.split('/')[0] || '未分类'
}

function resolveTags(relPath, title) {
  const combined = (relPath + ' ' + title).toLowerCase()
  const tags = []
  for (const kw of TAG_KEYWORDS) {
    if (combined.includes(kw.toLowerCase())) tags.push(kw)
  }
  return [...new Set(tags)].slice(0, 4)
}

function extractExcerpt(src) {
  const lines = src.split('\n')
  let excerpt = ''
  let inCodeBlock = false
  for (const line of lines) {
    const t = line.trim()
    if (t.startsWith('```')) { inCodeBlock = !inCodeBlock; continue }
    if (inCodeBlock) continue
    if (!t || t.startsWith('#') || t === '---' || t.startsWith('![')) continue
    if (/^:::/.test(t)) continue
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
      if (excerpt.length > 120) break
    }
  }
  excerpt = excerpt.trim().substring(0, 120)
  if (excerpt.length >= 120) excerpt += '...'
  return excerpt
}

// 主逻辑
const files = findMdFiles(DOCS_DIR)
let added = 0
let skipped = 0

for (const filePath of files) {
  const name = basename(filePath)
  if (SKIP_FILES.includes(name)) { skipped++; continue }

  const content = readFileSync(filePath, 'utf-8')

  // 已有 frontmatter 则跳过
  if (content.trimStart().startsWith('---')) { skipped++; continue }

  // 相对路径（用 / 分隔）
  const relPath = relative(DOCS_DIR, filePath).replace(/\\/g, '/').replace(/\.md$/, '')

  // 提取标题
  const titleMatch = content.match(/^#\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1].trim() : name.replace(/\.md$/, '')

  const category = resolveCategory(relPath)
  const tags = resolveTags(relPath, title)
  const excerpt = extractExcerpt(content)

  // 构建 frontmatter
  const tagsYaml = tags.length > 0 ? `\ntags:\n${tags.map(t => `  - ${t}`).join('\n')}` : ''
  const excerptYaml = excerpt ? `\nexcerpt: "${excerpt.replace(/"/g, '\\"')}"` : ''

  const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
category: "${category}"${tagsYaml}${excerptYaml}
---

`

  writeFileSync(filePath, frontmatter + content, 'utf-8')
  added++
  console.log(`✓ ${relPath}`)
}

console.log(`\n完成！添加 ${added} 篇，跳过 ${skipped} 篇`)
