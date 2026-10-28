import { navigationLinkExists } from '../navigation.js'

/**
 * 将文章转换为简洁的编号目录，正文完成后才开放阅读链接。
 *
 * @param {object} article 包含标题和可选 publishedLink 的文章记录；链接必须指向真实正文。
 * @param {string} number 章节内展示编号，例如 `2.1`。
 * @returns {object} 只含编号与标题的侧栏项；已完成正文额外提供链接和页脚标题。
 */
function createArticleItem(article, number) {
  const item = { text: `${number} ${article.title}` }
  if (article.publishedLink) {
    if (!navigationLinkExists(article.publishedLink)) {
      throw new Error(`正文入口不存在：${article.publishedLink}`)
    }
    item.link = article.publishedLink
    item.docFooterText = article.title
  }
  return item
}

/**
 * 按主题生成章节侧栏，所有文章使用其所属模块的目录。
 *
 * @param {{modules: object[]}} catalog 已确认的模块、章节和文章规划；模块 path 为唯一目录前缀。
 * @returns {Record<string, object[]>} 按模块路径登记的 VitePress 侧栏。
 */
export function createTopicSidebar(catalog) {
  const record = {}

  for (const module of catalog.modules) {
    // 与 Java 目录保持同层级：一个主题分组下排列章节，避免每章产生独立分隔线。
    const chapters = []
    const groups = [{ text: module.title, items: chapters }]
    for (const [chapterIndex, chapter] of module.chapters.entries()) {
      const items = []
      for (const [articleIndex, article] of chapter.articles.entries()) {
        items.push(createArticleItem(article, `${chapterIndex + 1}.${articleIndex + 1}`))
      }
      chapters.push({
        text: `第${chapterIndex + 1}章：${chapter.title}`,
        // 与 Java 一致，章节默认收起；进入正文时由 VitePress 展开当前章节。
        collapsed: true,
        items,
      })
    }
    record[`${module.path}/`] = groups
  }
  return record
}
