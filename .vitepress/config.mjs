import { defineConfig } from 'vitepress'
import { nav } from './themeConfig/nav.js'
import { sidebar } from './themeConfig/sidebar.js'
import { createSrcExclude, resolveRequestedBuildUnit } from '../scripts/docs/build-units.mjs'
import { fileURLToPath } from 'node:url'
import { configureCrossUnitLinks } from './markdown/cross-unit-links.mjs'

// 本地搜索会为全站 Markdown 生成索引；调试导航/主题时可关闭，避免 dev server 重启期间长时间不监听端口。
const enableLocalSearch = process.env.VITEPRESS_LOCAL_SEARCH !== 'false'
const buildUnit = resolveRequestedBuildUnit()
const previewOutDir = process.env.DOCS_PREVIEW_OUT_DIR

/**
 * 配置表格滚动，并在单元构建时按真实文件处理跨单元正文链接。
 *
 * @param {import('markdown-it')} md VitePress 使用的 Markdown-It 实例。
 * @returns {void} 直接注册表格起止标签的渲染规则。
 */
function configureMarkdown(md) {
  // 避免在 Markdown 生成的表格包装器上添加 role 属性；Vue 3.5.4 静态模板提升会误丢 role 表格前的兄弟节点。
  md.renderer.rules.table_open = () => '<div class="table-scroll" tabindex="0"><table>\n'
  md.renderer.rules.table_close = () => '</table></div>\n'
  if (buildUnit) {
    configureCrossUnitLinks(md, buildUnit.name, fileURLToPath(new URL('../content/', import.meta.url)))
  }
}

export default defineConfig({
  title: "xianling Docs",
  description: "学习笔记，经验心得",
  lang: 'zh-CN',
  // 只将网站内容作为页面源；根目录中的规范、过程文档和脚本不参与页面构建。
  srcDir: 'content',
  base: '/docs/',
  ...(buildUnit ? {
    srcExclude: createSrcExclude(buildUnit.name),
    cacheDir: buildUnit.cacheDir,
    outDir: buildUnit.outDir,
  } : {}),
  ...(previewOutDir ? { outDir: previewOutDir } : {}),
  ignoreDeadLinks: false,
  head: [
    ['link',{ rel: 'icon', href: '/docs/logo_new.png'}],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover' }],
  ],
    //启用深色模式
  appearance:'dark', 
  vite: {
    build: {
      chunkSizeWarningLimit: 1500,
      // 降低 Rollup 并发，减少大型文档站构建时的峰值内存。
      rollupOptions: {
        maxParallelFileOps: 3,
      },
    },
    server: {
      watch: {
        // VitePress 生成目录频繁变化，忽略它们可以减少无意义重启和端口短暂断开。
        ignored: [
          '**/.vitepress/cache/**',
          '**/.vitepress/dist/**',
          '**/.vitepress/.temp/**',
          '**/.build/**',
        ],
      },
    },
  },
  markdown: {
    // lineNumbers: true,
    config: configureMarkdown,
  },
  themeConfig: {
    logo: '/logo_new.png',
    i18nRouting: true,
    nav: nav,
    sidebar: sidebar,
    // search: enableLocalSearch ? {
    //   provider: 'local',
    //   options: {
    //     translations: {
    //       button: {
    //         buttonText: "搜索文档",
    //         buttonAriaLabel: "搜索文档",
    //       },
    //       modal: {
    //         noResultsText: "无法找到相关结果",
    //         resetButtonTitle: "清除查询条件",
    //         footer: {
    //           selectText: "选择",
    //           navigateText: "切换",
    //         },
    //       },
    //     },
    //   },
    // } : undefined,
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
