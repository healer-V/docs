import assert from 'node:assert/strict'
import { test } from 'node:test'
import { existsSync, readFileSync } from 'node:fs'

import {
  aiCatalog,
  getAiModuleEntryLink,
} from '../../../.vitepress/themeConfig/catalogs/ai.js'
import {
  getOperationModuleEntryLink,
  operationCatalog,
} from '../../../.vitepress/themeConfig/catalogs/operation.js'
import { web3Catalog } from '../../../.vitepress/themeConfig/catalogs/web3.js'
import { navigationLinkExists, filterNavigationRecord } from '../../../.vitepress/themeConfig/navigation.js'
import { operationSidebar } from '../../../.vitepress/themeConfig/sidebar/operation.js'
import { createTopicSidebar } from '../../../.vitepress/themeConfig/sidebar/topic-catalog.js'
import { rawNav, nav } from '../../../.vitepress/themeConfig/nav.js'

// 固定用户批准的专题顺序与范围，防止改名后仍沿用原理训练目录。
const expectedAiModules = [
  ['AI01', 'AI 应用基础', '/ai/01-application-foundation', 3, 9],
  ['AI02', '模型接入', '/ai/02-model-integration', 6, 16],
  ['AI03', 'Prompt 与上下文', '/ai/03-prompt-context', 5, 15],
  ['AI04', 'RAG 应用', '/ai/04-rag', 7, 18],
  ['AI05', 'Agent 开发', '/ai/05-agent-development', 7, 19],
  ['AI06', '框架与编排', '/ai/06-framework-orchestration', 7, 18],
  ['AI07', '应用架构', '/ai/07-application-architecture', 6, 15],
  ['AI08', '评测与可观测性', '/ai/08-evaluation-observability', 6, 16],
  ['AI09', '安全与治理', '/ai/09-security-governance', 7, 18],
  ['AI10', '性能、成本与部署', '/ai/10-performance-deployment', 7, 18],
]

// 固定已确认的运维与 DevOps 模块顺序、章节数和文章数。
const expectedOperationModules = [
  ['OPS01', 'Linux', '/operation/01-linux', 9, 27],
  ['OPS02', 'Bash 与 Shell', '/operation/02-bash-shell', 8, 23],
  ['OPS03', '网络基础', '/operation/03-networking', 8, 21],
  ['OPS04', 'Nginx', '/operation/04-nginx', 9, 24],
  ['OPS05', 'Docker', '/operation/05-docker', 8, 24],
  ['OPS06', 'Kubernetes', '/operation/06-kubernetes', 11, 35],
  ['OPS07', 'CI/CD', '/operation/07-cicd', 8, 23],
  ['OPS08', 'Jenkins', '/operation/08-jenkins', 9, 27],
  ['OPS09', '监控与可观测性', '/operation/09-monitoring-observability', 8, 26],
  ['OPS10', 'SRE', '/operation/10-sre', 8, 22],
  ['OPS11', '运维安全', '/operation/11-operations-security', 9, 26],
  ['OPS12', 'Ansible', '/operation/12-ansible', 8, 23],
  ['OPS13', 'Terraform', '/operation/13-terraform', 8, 24],
  ['OPS14', '平台工程', '/operation/14-platform-engineering', 8, 23],
]

/** 收集侧栏实际链接，纯文本计划不会被视为可以打开的文章。 */
function collectLinks(items) {
  const links = []
  for (const item of items) {
    if (item.link) links.push(item.link)
    if (item.items) links.push(...collectLinks(item.items))
  }
  return links
}

// 目录总量与关键理解依赖应符合应用开发方案，而非仅更新专题名称。
test('AI topics preserve the approved application development scope and order', function preservesApprovedPlan() {
  const actual = []
  const ids = new Set()
  const plannedPaths = new Set()
  let chapterCount = 0
  let articleCount = 0
  for (const module of aiCatalog.modules) {
    let moduleArticleCount = 0
    for (const [chapterIndex, chapter] of module.chapters.entries()) {
      const chapterPrefix = `${String(chapterIndex + 1).padStart(2, '0')}-`
      assert.ok(chapter.directory.startsWith(chapterPrefix), chapter.directory)
      chapterCount++
      for (const [articleIndex, article] of chapter.articles.entries()) {
        const articlePrefix = `${String(articleIndex + 1).padStart(2, '0')}-`
        assert.ok(article.file.startsWith(articlePrefix), article.file)
        assert.ok(!ids.has(article.id), `重复文章编号：${article.id}`)
        ids.add(article.id)
        const plannedPath = `${module.path}/${chapter.directory}/${article.file}`
        assert.ok(!plannedPaths.has(plannedPath), `重复规划路径：${plannedPath}`)
        plannedPaths.add(plannedPath)
        moduleArticleCount++
        articleCount++
      }
    }
    actual.push([module.id, module.title, module.path, module.chapters.length, moduleArticleCount])
  }
  assert.deepEqual(actual, expectedAiModules)
  assert.equal(chapterCount, 61)
  assert.equal(articleCount, 162)

  const chapterTitles = new Map()
  for (const module of aiCatalog.modules) {
    const titles = []
    for (const chapter of module.chapters) titles.push(chapter.title)
    chapterTitles.set(module.id, titles)
  }
  assert.deepEqual(chapterTitles.get('AI01'), ['应用构成与模型边界', '模型生成机制', '最小应用'])
  assert.deepEqual(chapterTitles.get('AI02'), ['请求与响应', '响应生命周期', '结构化输出', '工具调用', '多模态接口', '接入可靠性'])
  assert.deepEqual(chapterTitles.get('AI03'), ['指令契约', 'Prompt 构造', '上下文组装', '会话状态', 'Prompt 生命周期'])
  assert.deepEqual(chapterTitles.get('AI04'), ['知识边界', '文档处理', '嵌入与索引', '检索与排序', '证据回答', 'RAG 评测', '知识库维护'])
  assert.deepEqual(chapterTitles.get('AI05'), ['Agent 模型', '工具执行', '权限与隔离', '状态与记忆', '流程与协作', 'MCP', '生产控制'])
  assert.deepEqual(chapterTitles.get('AI10'), ['性能模型', '请求优化', '模型路由', '成本治理', '应用部署', '发布与恢复', '容量与运行'])
})

// 顶部 AI 菜单按三个阶段进入已发布正文或保留的模块首页。
test('AI navigation opens available module entries with clean titles', function preservesTopicEntries() {
  const expectedGroups = ['基础与接入', '知识与智能体', '工程与治理']
  let rawAi
  let visibleAi
  for (const item of rawNav) if (item.text === 'AI') rawAi = item
  for (const item of nav) if (item.text === 'AI') visibleAi = item
  assert.ok(rawAi)
  assert.deepEqual(visibleAi, rawAi, '过滤后不应丢失任何 AI 专题')
  const groupNames = []
  const navEntries = []
  for (const group of rawAi.items) {
    groupNames.push(group.text)
    for (const item of group.items) navEntries.push([item.text, item.link])
  }
  assert.deepEqual(groupNames, expectedGroups)
  const catalogEntries = []
  for (const module of aiCatalog.modules) {
    const entryLink = getAiModuleEntryLink(module)
    assert.ok(entryLink, `${module.title} 缺少可访问入口`)
    assert.ok(navigationLinkExists(entryLink), entryLink)
    catalogEntries.push([module.title, entryLink])
  }
  assert.deepEqual(navEntries, catalogEntries)
  assert.equal(
    getAiModuleEntryLink(aiCatalog.modules[0]),
    '/ai/01-application-foundation/01-application-model-boundaries/01-application-components.md',
  )
  assert.equal(
    getAiModuleEntryLink(aiCatalog.modules[1]),
    '/ai/02-model-integration/01-request-response/01-input-items-content-types.md',
  )
  assert.doesNotMatch(getAiModuleEntryLink(aiCatalog.modules[0]), /\/index\.md$/)
  assert.doesNotMatch(getAiModuleEntryLink(aiCatalog.modules[1]), /\/index\.md$/)
})

// 运维目录必须保持用户确认的十四模块、连续编号和唯一规划路径。
test('operation catalog preserves the approved DevOps scope and order', function preservesOperationPlan() {
  const actual = []
  const ids = new Set()
  const plannedPaths = new Set()
  let chapterCount = 0
  let articleCount = 0

  for (const module of operationCatalog.modules) {
    let moduleArticleCount = 0
    for (const [chapterIndex, chapter] of module.chapters.entries()) {
      assert.ok(chapter.directory.startsWith(`${String(chapterIndex + 1).padStart(2, '0')}-`), chapter.directory)
      chapterCount++
      for (const [articleIndex, article] of chapter.articles.entries()) {
        assert.ok(article.file.startsWith(`${String(articleIndex + 1).padStart(2, '0')}-`), article.file)
        assert.ok(!ids.has(article.id), `重复文章编号：${article.id}`)
        ids.add(article.id)
        const plannedPath = `${module.path}/${chapter.directory}/${article.file}`
        assert.ok(!plannedPaths.has(plannedPath), `重复规划路径：${plannedPath}`)
        plannedPaths.add(plannedPath)
        moduleArticleCount++
        articleCount++
      }
    }
    actual.push([module.id, module.title, module.path, module.chapters.length, moduleArticleCount])
  }

  assert.deepEqual(actual, expectedOperationModules)
  assert.equal(chapterCount, 119)
  assert.equal(articleCount, 348)
})

// 顶栏保留全部运维专题，并直接进入各自第一章第一篇而不是目录页。
test('operation navigation keeps every module and opens its first article', function preservesOperationNavigation() {
  let rawOperation
  let visibleOperation
  for (const item of rawNav) if (item.text === 'DevOps') rawOperation = item
  for (const item of nav) if (item.text === 'DevOps') visibleOperation = item

  assert.ok(rawOperation)
  assert.deepEqual(visibleOperation, rawOperation, '首篇入口必须全部指向真实正文')
  const groupNames = []
  for (const group of rawOperation.items) groupNames.push(group.text)
  assert.deepEqual(groupNames, ['系统与网络', '容器与编排', '持续交付', '稳定性治理', '自动化与平台'])

  const navEntries = []
  for (const group of rawOperation.items) {
    for (const item of group.items) {
      assert.ok(navigationLinkExists(item.link), item.link)
      assert.doesNotMatch(item.link, /\/index\.md$/)
      navEntries.push([item.text, item.link])
    }
  }
  const catalogEntries = []
  for (const module of operationCatalog.modules) {
    const entryLink = getOperationModuleEntryLink(module)
    const firstChapter = module.chapters[0]
    const firstArticle = firstChapter.articles[0]
    const expectedLink = `${module.path}/${firstChapter.directory}/${firstArticle.file}`
    assert.equal(entryLink, expectedLink, `${module.title} 必须进入第一章第一篇`)
    catalogEntries.push([module.title, entryLink])
  }
  assert.deepEqual(navEntries, catalogEntries)
  assert.equal(navEntries.length, 14)
})

// 新侧栏只由目录数据生成：已有页面开放链接，其余规划保持纯文本且不重新挂载旧模块。
test('operation sidebar links available pages and keeps remaining plans unlinked', function exposesAvailableOperationPages() {
  const sidebar = filterNavigationRecord(operationSidebar)
  assert.equal(Object.keys(sidebar).length, 14)
  assert.equal(Object.hasOwn(sidebar, '/operation/'), false)
  assert.equal(Object.hasOwn(sidebar, '/operation/01-shell/'), false)

  let plannedArticles = 0
  let publishedArticles = 0
  let existingArticleSources = 0
  for (const module of operationCatalog.modules) {
    const groups = sidebar[`${module.path}/`]
    assert.equal(groups.length, 1)
    assert.equal(groups[0].text, module.title)
    const expectedLinks = module.chapters.flatMap((chapter) => chapter.articles)
      .flatMap((article) => article.publishedLink ? [article.publishedLink] : [])
    assert.deepEqual(collectLinks(groups), expectedLinks)
    for (const [chapterIndex, chapter] of groups[0].items.entries()) {
      for (const [articleIndex, item] of chapter.items.entries()) {
        const article = module.chapters[chapterIndex].articles[articleIndex]
        const sourceUrl = new URL(`../../../content${module.path}/${module.chapters[chapterIndex].directory}/${article.file}`, import.meta.url)
        const sourceExists = existsSync(sourceUrl)
        assert.equal(Boolean(article.publishedLink), sourceExists, `正文发布状态与文件不一致：${sourceUrl.pathname}`)
        if (sourceExists) existingArticleSources++
        if (article.publishedLink) {
          assert.equal(item.link, article.publishedLink)
          assert.equal(item.docFooterText, article.title)
          publishedArticles++
        } else {
          assert.equal(item.link, undefined)
        }
        assert.doesNotMatch(item.text, /待编写|待核对|现有稿|旧稿/)
        plannedArticles++
      }
    }
  }
  assert.equal(plannedArticles, 348)
  assert.equal(publishedArticles, existingArticleSources)
})

// 领域首页保留总览；十四个专题目录不再创建中间首页。
test('operation keeps the domain overview without module index pages', function preservesOperationIndexPages() {
  const domainIndex = readFileSync(new URL('../../../content/operation/index.md', import.meta.url), 'utf8')
  assert.match(domainIndex, /<OperationCatalog \/>/)
  assert.match(domainIndex, /监控属于运维与 DevOps 的核心能力/)

  for (const module of operationCatalog.modules) {
    const moduleIndex = new URL(`../../../content${module.path}/index.md`, import.meta.url)
    assert.equal(existsSync(moduleIndex), false, `专题目录不得保留首页：${moduleIndex.pathname}`)
  }
})

// 清理旧稿关联后，规划章节必须完整可展开，文章保持单层标题且不出现虚假链接。
test('topic sidebars preserve chapter plans without draft statuses or nested sources', function preservesCleanPlans() {
  for (const catalog of [aiCatalog, web3Catalog]) {
    const sidebar = filterNavigationRecord(createTopicSidebar(catalog))
    assert.equal(Object.keys(sidebar).length, catalog.modules.length)
    assert.equal(Object.hasOwn(catalog, 'legacyIndexes'), false)
    for (const module of catalog.modules) {
      assert.equal(Object.hasOwn(module, 'legacyIndexes'), false)
      const groups = sidebar[`${module.path}/`]
      assert.equal(groups.length, 1)
      assert.equal(groups[0].text, module.title)
      assert.equal(groups[0].items.length, module.chapters.length)
      for (const [chapterIndex, chapter] of module.chapters.entries()) {
        const renderedChapter = groups[0].items[chapterIndex]
        assert.equal(renderedChapter.collapsed, true)
        assert.equal(renderedChapter.text, `第${chapterIndex + 1}章：${chapter.title}`)
        assert.equal(renderedChapter.items.length, chapter.articles.length)
        for (const [articleIndex, article] of chapter.articles.entries()) {
          const item = renderedChapter.items[articleIndex]
          assert.equal(Object.hasOwn(article, 'currentArticles'), false)
          assert.equal(item.text, `${chapterIndex + 1}.${articleIndex + 1} ${article.title}`)
          assert.equal(item.items, undefined)
          assert.equal(item.link, article.publishedLink)
        }
      }
      for (const link of collectLinks(groups)) assert.ok(navigationLinkExists(link), link)
    }
  }
})

// 页面目录与侧栏应保留相同的知识标题，不再显示旧稿链接或逐项状态列。
test('topic index pages contain the planned articles without old draft references', function preservesIndexPlans() {
  for (const catalog of [aiCatalog, web3Catalog]) {
    for (const module of catalog.modules) {
      const url = new URL(`../../../content${module.path}/index.md`, import.meta.url)
      if (module.hasIndex === false) {
        assert.equal(existsSync(url), false, `模块不得保留强制首页：${url.pathname}`)
        continue
      }
      const markdown = readFileSync(url, 'utf8')
      assert.doesNotMatch(markdown, /待核对|现有稿|旧稿参考|阅读入口与状态|正文状态与阅读入口/)
      assert.match(markdown, /未提供链接的标题(?:为尚未编写的规划条目|尚未生成正文)/)
      for (const [chapterIndex, chapter] of module.chapters.entries()) {
        for (const [articleIndex, article] of chapter.articles.entries()) {
          const number = `${chapterIndex + 1}.${articleIndex + 1}`
          const plainRow = `| ${number} | ${article.title} |`
          const linkedRow = `| ${number} | [${article.title}](./${chapter.directory}/${article.file}) |`
          // 已发布文章可以提供真实阅读入口，规划文章只能保留无链接标题。
          assert.ok(
            markdown.includes(plainRow) || (article.publishedLink && markdown.includes(linkedRow)),
            article.title,
          )
        }
      }
    }
  }
})

// 尚未写作的框架与编排规划仍可展开，条目只显示知识标题。
test('unwritten chapters remain visible without fake article links', function keepsPlannedChapters() {
  const sidebar = filterNavigationRecord(createTopicSidebar(aiCatalog))
  const groups = sidebar['/ai/06-framework-orchestration/']
  assert.equal(groups.length, 1)
  assert.equal(groups[0].text, '框架与编排')
  assert.equal(groups[0].items.length, 7)
  assert.deepEqual(collectLinks(groups), [])
  let planned = 0
  for (const chapter of groups[0].items) {
    for (const item of chapter.items) {
      assert.doesNotMatch(item.text, /待编写|待核对|现有/)
      assert.equal(item.link, undefined)
      planned++
    }
  }
  assert.equal(planned, 18)
})

// 正文链接必须落到真实文件，避免过滤器静默掩盖错误配置。
test('missing published documents fail before navigation filtering', function rejectsMissingPublication() {
  const catalog = structuredClone(aiCatalog)
  catalog.modules[0].chapters[0].articles[0].publishedLink = '/ai/missing-verified-article.md'
  /** 触发无效正文链接校验，错误必须包含具体目标。 */
  function buildInvalidSidebar() { createTopicSidebar(catalog) }
  assert.throws(buildInvalidSidebar, /正文入口不存在：\/ai\/missing-verified-article.md/)
})

// 使用真实正文验证链接和页脚标题；完成稿也保持单层目录，不生成额外入口。
test('published articles provide one readable entry with a clean footer title', function preservesPublishedEntry() {
  const catalog = {
    modules: [{
      title: 'HTML',
      path: '/frontend/01-html',
      chapters: [{
        title: '基础',
        articles: [{ title: 'HTML 概述', publishedLink: '/frontend/01-html/01-overview.md' }],
      }],
    }],
  }
  const sidebar = createTopicSidebar(catalog)
  const item = sidebar['/frontend/01-html/'][0].items[0].items[0]
  assert.deepEqual(item, {
    text: '1.1 HTML 概述',
    link: '/frontend/01-html/01-overview.md',
    docFooterText: 'HTML 概述',
  })
})
