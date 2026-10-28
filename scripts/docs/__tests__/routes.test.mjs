import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertUniqueRoutes,
  htmlPathToRoute,
  markdownPathToRoute,
  normalizeAnchor,
  normalizeRoutePath,
  normalizeSiteBase,
  routeToHtmlPath,
  routeToSourcePath,
  toPosixPath,
} from '../lib/routes.mjs'

// 验证 Windows 和 Unix 文件路径会收敛为相同的仓库相对路径。
test('toPosixPath normalizes separators and relative prefixes', () => {
  assert.equal(toPosixPath('.\\frontend\\01-html\\01-overview.md'), 'frontend/01-html/01-overview.md')
  assert.equal(toPosixPath('./backend//04-java/index.md'), 'backend/04-java/index.md')
})

// 验证站点 base 始终保留唯一的首尾斜杠，供 URL 拼接复用。
test('normalizeSiteBase creates a stable base path', () => {
  assert.equal(normalizeSiteBase('docs'), '/docs/')
  assert.equal(normalizeSiteBase('/docs/'), '/docs/')
  assert.equal(normalizeSiteBase('/'), '/')
})

// 验证 Markdown 源路径映射到 VitePress cleanUrls=false 的公开 URL。
test('markdownPathToRoute maps articles and directory indexes', () => {
  assert.equal(markdownPathToRoute('index.md', '/docs/'), '/docs/')
  assert.equal(markdownPathToRoute('about/index.md', '/docs/'), '/docs/about/')
  assert.equal(
    markdownPathToRoute('frontend/01-html/01-overview.md', '/docs/'),
    '/docs/frontend/01-html/01-overview.html',
  )
})

// 验证构建产物路径与 Markdown 路由使用同一套规范 URL。
test('htmlPathToRoute maps generated HTML files', () => {
  assert.equal(htmlPathToRoute('index.html', '/docs/'), '/docs/')
  assert.equal(htmlPathToRoute('about/index.html', '/docs/'), '/docs/about/')
  assert.equal(htmlPathToRoute('frontend/01-html/01-overview.html', '/docs/'), '/docs/frontend/01-html/01-overview.html')
})

// 验证链接中的查询参数、Markdown 后缀和目录首页会被规范化。
test('normalizeRoutePath normalizes internal links without losing the site base', () => {
  assert.equal(normalizeRoutePath('/frontend/01-html/01-overview.md?from=nav#intro', '/docs/'), '/docs/frontend/01-html/01-overview.html')
  assert.equal(normalizeRoutePath('/docs/about/index.html', '/docs/'), '/docs/about/')
  assert.equal(normalizeRoutePath('https://healer-v.github.io/docs/backend/01-nodejs/index.html', '/docs/'), '/docs/backend/01-nodejs/')
})

// 验证规范 URL 可以无损转换回构建产物和约定的 Markdown 源路径。
test('routeToHtmlPath and routeToSourcePath reverse canonical routes', () => {
  assert.equal(routeToHtmlPath('/docs/', '/docs/'), 'index.html')
  assert.equal(routeToHtmlPath('/docs/about/', '/docs/'), 'about/index.html')
  assert.equal(routeToHtmlPath('/docs/frontend/01-html/01-overview.html', '/docs/'), 'frontend/01-html/01-overview.html')
  assert.equal(routeToSourcePath('/docs/about/', '/docs/'), 'about/index.md')
  assert.equal(routeToSourcePath('/docs/frontend/01-html/01-overview.html', '/docs/'), 'frontend/01-html/01-overview.md')
})

// 验证锚点统一使用解码后的 HTML id，避免编码差异造成误报。
test('normalizeAnchor decodes and validates fragment identifiers', () => {
  assert.equal(normalizeAnchor('#Java%20内存模型'), '#Java 内存模型')
  assert.equal(normalizeAnchor('并发安全'), '#并发安全')
  assert.equal(normalizeAnchor(''), null)
})

// 验证两个源文件不能声明同一个规范 URL。
test('assertUniqueRoutes reports every conflicting source', () => {
  // 断言回调在测试框架控制范围内触发路由冲突异常。
  assert.throws(
    () => assertUniqueRoutes([
      { route: '/docs/frontend/start.html', source: 'frontend/start.md' },
      { route: '/docs/frontend/start.html', source: 'frontend/legacy-start.md' },
    ]),
    /(?=.*frontend\/start\.md)(?=.*frontend\/legacy-start\.md)/s,
  )
})
