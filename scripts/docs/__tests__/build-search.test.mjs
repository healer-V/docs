import assert from 'node:assert/strict'
import test from 'node:test'

import { load } from 'cheerio'

import { hasIndexableBody, preparePageForSearch } from '../build-search.mjs'

// 验证 Pagefind 只索引正文，并获得稳定的标题、来源和单元过滤信息。
test('preparePageForSearch marks content and metadata', () => {
  const html = `<!doctype html><html><head><title>旧标题</title></head><body>
    <nav class="VPNav">公共导航</nav>
    <aside class="VPSidebar">公共侧栏</aside>
    <main><article class="vp-doc"><h1>正文标题</h1><script>ignored()</script></article></main>
  </body></html>`
  const prepared = preparePageForSearch(html, {
    route: '/docs/frontend/01-html/01-overview.html',
    source: 'frontend/01-html/01-overview.md',
    title: 'HTML 概述',
    unit: 'frontend',
  })
  const $ = load(prepared)

  assert.equal($('.vp-doc').attr('data-pagefind-body'), '')
  assert.equal($('.VPNav').attr('data-pagefind-ignore'), '')
  assert.equal($('.VPSidebar').attr('data-pagefind-ignore'), '')
  assert.equal($('script').attr('data-pagefind-ignore'), '')
  assert.equal($('meta[data-pagefind-meta="title[content]"]').attr('content'), 'HTML 概述')
  assert.equal($('meta[data-pagefind-meta="source[content]"]').attr('content'), 'frontend/01-html/01-overview.md')
  assert.equal($('meta[data-pagefind-filter="unit[content]"]').attr('content'), 'frontend')
  assert.equal($('meta[data-pagefind-filter="title[content]"]').attr('content'), 'HTML 概述')
})

// 验证自定义首页缺少 vp-doc 时仍使用内容区域建立索引。
test('preparePageForSearch falls back to VitePress content', () => {
  const prepared = preparePageForSearch(
    '<html><head></head><body><main class="VPContent"><h1>首页</h1></main></body></html>',
    { route: '/docs/', source: 'index.md', title: '首页', unit: 'portal' },
  )
  const $ = load(prepared)
  assert.equal($('.VPContent').attr('data-pagefind-body'), '')
})

// 验证空正文页面可以在写入 Pagefind 前切换为标题级兜底记录。
test('hasIndexableBody distinguishes empty and populated content', () => {
  assert.equal(hasIndexableBody('<html><body><main data-pagefind-body>\u200B </main></body></html>'), false)
  assert.equal(hasIndexableBody('<html><body><main data-pagefind-body><h1>Java 并发</h1></main></body></html>'), true)
})
