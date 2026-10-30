import { expect, test } from '@playwright/test'

const FRONTEND_ROUTE = '/docs/frontend/01-html/01-foundation/01-overview.html'
const BACKEND_ROUTE = '/docs/backend/04-java/01-language-foundation/01-overview.html'
const OPERATION_ROUTE = '/docs/operation/01-linux/01-system-foundation/01-linux-distribution.html'
const LEGACY_JAVA_ROUTE = '/docs/backend/04-java/01-java.html'

/**
 * 在页面脚本执行前设置本地认证状态，浏览器回归只验证文档站工程链路。
 *
 * @param {import('@playwright/test').Page} page Playwright 页面实例。
 * @returns {Promise<void>} 初始化脚本注册完成后返回。
 */
async function authenticateDocumentationSite(page) {
  // 初始化脚本回调在站点脚本前执行，保证每次导航的认证条件一致。
  await page.addInitScript(() => {
    localStorage.setItem('vitepress_auth', 'true')
    localStorage.setItem('vitepress_auth_time', Date.now().toString())
  })
}

/**
 * 收集页面运行期错误与站内 4xx/5xx 响应，供每个测试结束时统一断言。
 *
 * @param {import('@playwright/test').Page} page Playwright 页面实例。
 * @returns {string[]} 测试期间持续写入的问题列表。
 */
function collectBrowserIssues(page) {
  const issues = []

  /** 记录未捕获的浏览器脚本异常。 */
  function handlePageError(error) {
    issues.push(`pageerror: ${error.message}`)
  }

  /** 记录浏览器控制台 error，保留前端运行时原始信息。 */
  function handleConsole(message) {
    if (message.type() === 'error') {
      issues.push(`console: ${message.text()}`)
    }
  }

  /** 记录同源站点资源的错误响应，忽略外部字体等第三方网络状态。 */
  function handleResponse(response) {
    const responseUrl = new URL(response.url())
    if (responseUrl.origin === 'http://127.0.0.1:4173' && response.status() >= 400) {
      issues.push(`response: ${response.status()} ${responseUrl.pathname}`)
    }
  }

  page.on('pageerror', handlePageError)
  page.on('console', handleConsole)
  page.on('response', handleResponse)
  return issues
}

// 每个浏览器上下文都绕过与本任务无关的登录表单，并独立收集运行期问题。
test.beforeEach(async ({ page }) => {
  await authenticateDocumentationSite(page)
})

// 桌面导航验证构建单元切换会完整加载目标页面及对应 sidebar。
test('desktop cross-unit navigation and deep refresh', async ({ page, isMobile }) => {
  test.skip(isMobile, '移动端使用独立的搜索与布局回归')
  const issues = collectBrowserIssues(page)

  await page.goto(FRONTEND_ROUTE)
  await expect(page.locator('h1')).toContainText('HTML')

  const backendMenu = page.locator('.VPNavBarMenuGroup').filter({ hasText: '后端' })
  await backendMenu.hover()
  await backendMenu.getByRole('link', { name: 'Java', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`${BACKEND_ROUTE.replaceAll('/', '\\/')}$`))
  await expect(page.locator('h1')).toContainText('Java')

  // 按顶层按钮的完整名称确定所属菜单，避免跨菜单文本匹配。
  const operationMenu = page.locator('.VPNavBarMenuGroup').filter({ has: page.getByRole('button', { name: 'DevOps', exact: true }) })
  await operationMenu.hover()
  await operationMenu.getByRole('link', { name: 'Linux', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`${OPERATION_ROUTE.replaceAll('/', '\\/')}$`))
  await page.reload()
  await expect(page.locator('h1')).toBeVisible()
  expect(issues).toEqual([])
})

// 中文搜索验证全文结果、模块筛选和跨单元结果跳转。
test('global Chinese search filters backend results', async ({ page, isMobile }) => {
  test.skip(isMobile, '移动端在独立布局用例中验证相同筛选链路')
  const issues = collectBrowserIssues(page)
  await page.goto(FRONTEND_ROUTE)
  await page.getByRole('button', { name: '搜索全部文档' }).click()

  const dialog = page.getByRole('dialog', { name: '搜索全部文档' })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('文档模块').selectOption('backend')
  await dialog.getByLabel('搜索关键词').fill('并发')
  await expect(dialog.locator('.global-search-result').first()).toBeVisible()
  await expect(dialog.locator('.global-search-result__content small').first()).toHaveText(/后端/)

  const firstResult = dialog.locator('.global-search-result').first()
  const expectedUrl = new URL(await firstResult.getAttribute('href'), page.url())
  expect(expectedUrl.pathname.startsWith('/docs/backend/')).toBe(true)
  await firstResult.click()
  await expect(page).toHaveURL(expectedUrl.href)
  await expect(page.locator('h1')).toBeVisible()
  expect(issues).toEqual([])
})

// AI 正文和当前模块目录页都能按精准中文标题检索并跳转到实际入口。
test('AI title search opens current articles and topic directories', async ({ page }) => {
  const issues = collectBrowserIssues(page)
  const chapter = '/docs/ai/'
  const documents = [
    { title: 'AI 应用组成', file: '01-application-foundation/01-application-model-boundaries/01-application-components.html' },
    { title: '输入项与内容类型', file: '02-model-integration/01-request-response/01-input-items-content-types.html' },
    { title: 'Prompt 与上下文', file: '03-prompt-context/' },
  ]
  await page.goto(FRONTEND_ROUTE)
  for (const document of documents) {
    await page.getByRole('button', { name: '搜索全部文档' }).click()
    const dialog = page.getByRole('dialog', { name: '搜索全部文档' })
    await dialog.getByLabel('文档模块').selectOption('ai')
    await dialog.getByLabel('搜索关键词').fill(document.title)
    const result = dialog.locator('.global-search-result').filter({ has: page.getByText(document.title, { exact: true }) })
    await expect(result).toHaveCount(1)
    await expect(result).toHaveAttribute('href', chapter + document.file)
    await result.click()
    await expect(dialog).not.toBeVisible()
    await expect(page).toHaveURL(new URL(chapter + document.file, page.url()).href)
    await expect(page.locator('.vp-doc h1')).toHaveText(document.title)
  }
  // 快速切换查询与模块后，过期的 AI 标题结果不能覆盖最新筛选。
  await page.getByRole('button', { name: '搜索全部文档' }).click()
  const dialog = page.getByRole('dialog', { name: '搜索全部文档' })
  await dialog.getByLabel('搜索关键词').fill(documents[0].title)
  await dialog.getByLabel('文档模块').selectOption('backend')
  await expect(dialog.locator('.global-search-panel__body')).toHaveAttribute('aria-busy', 'false')
  await expect(dialog.locator(`a[href="${chapter}${documents[0].file}"]`)).toHaveCount(0)
  await dialog.getByLabel('文档模块').selectOption('ai')
  await expect(dialog.locator(`a[href="${chapter}${documents[0].file}"]`)).toHaveCount(1)
  expect(issues).toEqual([])
})

/**
 * 验证退役的 Java 地址返回 404，不再生成静态跳转页。
 * @param {object} fixtures request 为当前项目的 HTTP 请求上下文。
 * @returns {Promise<void>} 旧地址状态码与响应地址通过断言后结束。
 */
test('retired route returns 404', async ({ request }) => {
  const response = await request.get(LEGACY_JAVA_ROUTE, { maxRedirects: 0 })
  expect(response.status()).toBe(404)
  expect(new URL(response.url()).pathname).toBe(LEGACY_JAVA_ROUTE)
  expect(response.headers().location).toBeUndefined()
})

/**
 * 在桌面与移动视口检查 Java 当前入口、十四章导航和长代码的实际折叠行为。
 * @param {object} fixtures 当前测试上下文，page 为独立页面，isMobile 表示移动项目。
 * @param {import('@playwright/test').TestInfo} testInfo 测试产物路径；截图只写入当前用例目录。
 * @returns {Promise<void>} 阅读与折叠检查完成后返回；失败时保留截图和 trace。
 */
test('Java chapters preserve navigation and readable code details', async ({ page, isMobile }, testInfo) => {
  const issues = collectBrowserIssues(page)
  await page.goto('/docs/backend/04-java/10-data-access/01-jdbc-drivers.html#jdbc-与数据库驱动')
  await expect(page).toHaveURL(/\/docs\/backend\/04-java\/10-data-access\/01-jdbc-drivers\.html#/)
  await expect(page.locator('.vp-doc h1')).toContainText('JDBC 与数据库驱动')
  await expect(page.locator('h1[id="jdbc-与数据库驱动"]')).toHaveCount(1)

  if (isMobile) {
    await page.locator('.VPLocalNav .menu').click()
  }
  const sidebar = page.locator('.VPSidebar')
  await expect(sidebar.getByRole('button', { name: /^第\d+章：/ })).toHaveCount(14)
  await expect(sidebar).not.toContainText('历史专题')
  await expect(sidebar.getByRole('link', { name: '10.1 JDBC 与数据库驱动', exact: true })).toBeVisible()
  if (isMobile) {
    // 当前文章不会触发 route.path 变化，使用移动端可见的遮罩关闭目录。
    await page.locator('.VPBackdrop').click({ position: { x: page.viewportSize().width - 8, y: 120 } })
    await expect(sidebar).not.toBeInViewport()
    await expect(page.locator('.VPBackdrop')).not.toBeVisible()
  }

  const details = page.locator('.vp-doc details').filter({ hasText: '查看 JDBC 探测程序' })
  await details.locator('summary').scrollIntoViewIfNeeded()
  await expect(details.locator('pre')).not.toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('java-folded.png'), fullPage: false })
  await details.locator('summary').click()
  await expect(details.locator('pre')).toBeVisible()
  await details.locator('summary').click()
  await expect(details.locator('pre')).not.toBeVisible()

  // DOM 测量只核对页面是否横向溢出，不把代码内部的局部滚动当作页面布局错误。
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  await page.reload()
  await expect(details.locator('pre')).not.toBeVisible()
  expect(issues).toEqual([])
})

// 移动端搜索弹窗必须完整落在视口内，结果可滚动并可由关闭按钮退出。
test('mobile search remains within the viewport', async ({ page, isMobile }, testInfo) => {
  test.skip(!isMobile, '桌面端由完整导航与搜索测试覆盖')
  const issues = collectBrowserIssues(page)
  await page.goto(FRONTEND_ROUTE)
  await page.getByRole('button', { name: '搜索全部文档' }).click()

  const dialog = page.getByRole('dialog', { name: '搜索全部文档' })
  await dialog.getByLabel('文档模块').selectOption('backend')
  await dialog.getByLabel('搜索关键词').fill('并发')
  await expect(dialog.locator('.global-search-result').first()).toBeVisible()
  await expect(dialog.locator('.global-search-result__content small').first()).toHaveText(/后端/)
  const box = await dialog.boundingBox()
  const viewport = page.viewportSize()
  expect(box).not.toBeNull()
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)

  await page.screenshot({
    path: testInfo.outputPath('search.png'),
    fullPage: false,
  })
  await dialog.getByRole('button', { name: '关闭搜索' }).click()
  await expect(dialog).not.toBeVisible()
  expect(issues).toEqual([])
})
