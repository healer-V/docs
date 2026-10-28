import { defineConfig, devices } from '@playwright/test'

// 本地可复用系统浏览器；CI 不设置该变量时继续使用工作流安装的隔离 Chromium。
const chromiumExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH

export default defineConfig({
  testDir: './tests',
  outputDir: '.build/playwright-results',
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  // Pagefind Worker 与同一静态预览服务串行验收，避免并发浏览器让移动端导航超时。
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { outputFolder: '.build/playwright-report', open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    launchOptions: chromiumExecutablePath ? { executablePath: chromiumExecutablePath } : undefined,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'node scripts/docs/preview-site.mjs --site .build/assembled --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/docs/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
