import { defineConfig } from 'vitepress'
import { nav } from '../.vitepress/themeConfig/nav.js'
import { sidebar } from '../.vitepress/themeConfig/sidebar.js'

// 本地搜索会为全站 Markdown 生成索引；调试导航/主题时可关闭，避免 dev server 重启期间长时间不监听端口。
const enableLocalSearch = process.env.VITEPRESS_LOCAL_SEARCH !== 'false'

export default defineConfig({
  title: "xianling Docs",
  description: "学习笔记，经验心得",
  lang: 'zh-CN',
  base: '/docs/',
  ignoreDeadLinks: true,
  head: [
    ['link',{ rel: 'icon', href: '/docs/logo_new.png'}],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover' }],
  ],
    //启用深色模式
  appearance:'dark', 
  build: {
    chunkSizeWarningLimit: 1500,
    // 降低 Rollup 并发，减少峰值内存（CI 环境关键配置）
    rollupOptions: {
      maxParallelFileOps: 3,
      output: {
        // 更细粒度的代码分割，避免单个 chunk 过大撑爆内存
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@vue') || id.includes('vue-demi')) {
              return 'vendor-vue'
            }
            if (id.includes('vitepress') || id.includes('@vitepress')) {
              return 'vendor-vitepress'
            }
            return 'vendor'
          }
        }
      }
    }
  },
  vite: {
    server: {
      watch: {
        // VitePress 生成目录频繁变化，忽略它们可以减少无意义重启和端口短暂断开。
        ignored: [
          '**/docs/.vitepress/cache/**',
          '**/docs/.vitepress/dist/**',
          '**/docs/.vitepress/.temp/**',
        ],
      },
    },
  },
  themeConfig: {
    logo: '/logo_new.png',
    markdown: {
      lineNumbers: true
    },
    i18nRouting: true,
    nav: nav,
    sidebar: sidebar,
    search: enableLocalSearch ? {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: "搜索文档",
            buttonAriaLabel: "搜索文档",
          },
          modal: {
            noResultsText: "无法找到相关结果",
            resetButtonTitle: "清除查询条件",
            footer: {
              selectText: "选择",
              navigateText: "切换",
            },
          },
        },
      },
    } : undefined,
    // socialLinks: [
    //   { icon: 'github', link: 'https://github.com/healer-V/docs' }
    // ],
    outline: {
      level: [2, 6],
      label: '目录'
    },
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium'
      }
    },
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '返回顶部',
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },
    // editLink: {
    //   repo: 'https://github.com/healer-V/docs',
    //   link: 'https://github.com/healer-V/docs/',
    //   text: '在 GitHub 上编辑此页',
    //   ariaLabel: '在 GitHub 上编辑此页'
    // },
    footer: {
      copyright: 'MIT Licensed | Copyright © 2024-present xianling'
    },
  }
})
