import { defineConfig } from 'vitepress'
import { nav } from '../.vitepress/themeConfig/nav.js'
import { sidebar } from '../.vitepress/themeConfig/sidebar.js'
// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "xianling Docs",
  description: "学习笔记，经验心得",
  lang: 'zh-CN',
  base: '/font-docs/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo.png', // 表示docs/public/logo.png
    markdown: {
      lineNumbers: true,
    },
    i18nRouting: true,
    nav: nav,
    sidebar: sidebar,
    search: {
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
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/mazy699' }
    ],
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
    footer: {
      copyright: 'MIT Licensed | Copyright © 2024-present Mazy'
    },
  }
})
