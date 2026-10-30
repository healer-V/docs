import assert from 'node:assert/strict'
import test from 'node:test'

import {
  resolveClientBuildUnit,
  shouldUseFullPageNavigation,
} from '../../../.vitepress/utils/unitRouting.js'

// 验证所有公开路径都映射到既定的七个构建单元。
test('resolveClientBuildUnit maps public routes to build units', () => {
  assert.equal(resolveClientBuildUnit('/docs/'), 'portal')
  assert.equal(resolveClientBuildUnit('/docs/frontend/01-html/01-overview.html'), 'frontend')
  assert.equal(resolveClientBuildUnit('/docs/backend/04-java/01-language-foundation/01-overview.html'), 'backend')
  assert.equal(resolveClientBuildUnit('/docs/operation/01-linux/01-introduction.html'), 'operation')
  assert.equal(resolveClientBuildUnit('/docs/ai/01-ai/01-introduction.html'), 'ai')
  assert.equal(resolveClientBuildUnit('/docs/web3/01-blockchain/01-introduction.html'), 'web3')
  assert.equal(resolveClientBuildUnit('/docs/practices/performance.html'), 'ecosystem')
  assert.equal(resolveClientBuildUnit('/docs/superpowers/specs/design.html'), null)
  assert.equal(resolveClientBuildUnit('/docs/standards/'), null)
})

// 验证同一构建单元内仍使用 VitePress 客户端路由。
test('shouldUseFullPageNavigation keeps same-unit navigation client-side', () => {
  assert.equal(shouldUseFullPageNavigation(
    'https://healer-v.github.io/docs/frontend/01-html/01-overview.html',
    '/docs/frontend/02-css/01-overview.html',
  ), false)
})

// 验证跨构建单元时通过完整页面加载获取目标单元页面清单。
test('shouldUseFullPageNavigation reloads cross-unit routes', () => {
  assert.equal(shouldUseFullPageNavigation(
    'https://healer-v.github.io/docs/frontend/01-html/01-overview.html',
    '/docs/backend/04-java/01-language-foundation/01-overview.html',
  ), true)
})

// 验证页内锚点和查询参数不会触发不必要的完整刷新。
test('shouldUseFullPageNavigation ignores same-page changes', () => {
  assert.equal(shouldUseFullPageNavigation(
    'https://healer-v.github.io/docs/backend/04-java/index.html',
    '/docs/backend/04-java/index.html#运行机制',
  ), false)
})

// 验证外部站点和未知站内路径由浏览器或 VitePress 原逻辑处理。
test('shouldUseFullPageNavigation ignores external and unknown targets', () => {
  const current = 'https://healer-v.github.io/docs/frontend/01-html/01-overview.html'
  assert.equal(shouldUseFullPageNavigation(current, 'https://vitepress.dev/guide/'), false)
  assert.equal(shouldUseFullPageNavigation(current, '/docs/not-owned/page.html'), false)
})
