<script setup>
import { computed } from 'vue'
import { withBase } from 'vitepress'
import {
  getOperationModuleEntryLink,
  operationCatalog,
} from '../themeConfig/catalogs/operation.js'

const props = defineProps({
  moduleId: {
    type: String,
    default: '',
  },
})

const groupNumbers = ['一', '二', '三', '四', '五']

/** 根据页面传入的稳定 ID 取得当前模块；领域首页不传 ID。 */
const selectedModule = computed(function selectOperationModule() {
  if (!props.moduleId) return null
  for (const module of operationCatalog.modules) {
    if (module.id === props.moduleId) return module
  }
  return null
})

/** 按目录中的首次出现顺序整理五组模块，保证与顶部导航一致。 */
const moduleGroups = computed(function groupOperationModules() {
  const groups = []
  const groupMap = new Map()
  for (const module of operationCatalog.modules) {
    let group = groupMap.get(module.navigationGroup)
    if (!group) {
      group = { title: module.navigationGroup, modules: [] }
      groupMap.set(module.navigationGroup, group)
      groups.push(group)
    }
    group.modules.push({
      ...module,
      entryLink: getOperationModuleEntryLink(module),
    })
  }
  return groups
})

/**
 * 统计一个模块规划的文章总数。
 *
 * @param {object} module 运维目录中的模块记录，必须包含 chapters 数组。
 * @returns {number} 模块全部章节的文章数量。
 */
function countModuleArticles(module) {
  let count = 0
  for (const chapter of module.chapters) count += chapter.articles.length
  return count
}

/**
 * 将 VitePress 源文档链接转换为浏览器可访问路径。
 *
 * @param {string} link 以站点根开头的 Markdown 文档路径。
 * @returns {string} 带站点 base 且去除 `.md` 后缀的页面地址。
 */
function toPageLink(link) {
  return withBase(link.replace(/\.md$/, ''))
}
</script>

<template>
  <div v-if="selectedModule" class="operation-module-catalog">
    <section
      v-for="(chapter, chapterIndex) in selectedModule.chapters"
      :id="chapter.directory"
      :key="chapter.directory"
      class="operation-chapter"
    >
      <div class="operation-chapter-heading">
        <span aria-hidden="true">{{ String(chapterIndex + 1).padStart(2, '0') }}</span>
        <h2>第{{ chapterIndex + 1 }}章：{{ chapter.title }}</h2>
      </div>
      <p>{{ chapter.responsibility }}</p>

      <div class="table-scroll" tabindex="0">
        <table>
          <thead>
            <tr>
              <th scope="col">序号</th>
              <th scope="col">文章</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(article, articleIndex) in chapter.articles" :key="article.id">
              <td>{{ chapterIndex + 1 }}.{{ articleIndex + 1 }}</td>
              <td>
                <a v-if="article.publishedLink" :href="toPageLink(article.publishedLink)">
                  {{ article.title }}
                </a>
                <span v-else>{{ article.title }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>

  <div v-else class="operation-domain-catalog">
    <section
      v-for="(group, groupIndex) in moduleGroups"
      :key="group.title"
      class="operation-domain-group"
    >
      <div class="operation-group-heading">
        <span>{{ groupNumbers[groupIndex] }}</span>
        <h3>{{ group.title }}</h3>
      </div>
      <div class="operation-module-list">
        <component
          v-for="module in group.modules"
          :key="module.id"
          :is="module.entryLink ? 'a' : 'div'"
          class="operation-module-row"
          :class="{ 'is-unavailable': !module.entryLink }"
          :href="module.entryLink ? toPageLink(module.entryLink) : undefined"
        >
          <span class="operation-module-number">{{ module.path.split('/').at(-1).slice(0, 2) }}</span>
          <span class="operation-module-copy">
            <strong>{{ module.title }}</strong>
            <span>{{ module.description }}</span>
          </span>
          <span class="operation-module-meta">
            {{ module.chapters.length }} 章 / {{ countModuleArticles(module) }} 篇
          </span>
          <span v-if="module.entryLink" class="operation-module-arrow" aria-hidden="true">→</span>
        </component>
      </div>
    </section>
  </div>
</template>

<style scoped>
.operation-module-catalog,
.operation-domain-catalog {
  margin-top: 28px;
}

.operation-chapter {
  padding: 10px 0 34px;
  border-top: 1px solid var(--vp-c-divider);
}

.operation-chapter-heading,
.operation-group-heading {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.operation-chapter-heading > span,
.operation-group-heading > span {
  flex: 0 0 auto;
  color: var(--vp-c-brand-1);
  font-size: 13px;
  font-weight: 700;
}

.operation-chapter-heading h2 {
  margin: 0;
  padding: 20px 0 0;
  border-top: 0;
  font-size: 22px;
  letter-spacing: 0;
}

.operation-chapter > p {
  margin: 10px 0 16px 37px;
  color: var(--vp-c-text-2);
}

.operation-chapter table {
  margin: 0;
}

.operation-chapter th:first-child,
.operation-chapter td:first-child {
  width: 84px;
  color: var(--vp-c-text-2);
  font-variant-numeric: tabular-nums;
}

.operation-domain-group + .operation-domain-group {
  margin-top: 42px;
}

.operation-group-heading {
  margin-bottom: 12px;
}

.operation-group-heading > span {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 1px solid var(--vp-c-brand-2);
  border-radius: 4px;
}

.operation-group-heading h3 {
  margin: 0;
  font-size: 20px;
  letter-spacing: 0;
}

.operation-module-list {
  border-top: 1px solid var(--vp-c-divider);
}

.operation-module-row {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto 20px;
  gap: 12px;
  align-items: center;
  padding: 16px 4px;
  border-bottom: 1px solid var(--vp-c-divider);
  color: inherit;
  text-decoration: none;
  transition: background-color 160ms ease, color 160ms ease;
}

.operation-module-row[href]:hover,
.operation-module-row[href]:focus-visible {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-brand-1);
}

.operation-module-row[href]:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.operation-module-row.is-unavailable {
  cursor: default;
}

.operation-module-number,
.operation-module-meta {
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.operation-module-copy {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.operation-module-copy strong {
  color: var(--vp-c-text-1);
  font-size: 16px;
}

.operation-module-copy > span {
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.65;
}

.operation-module-arrow {
  color: var(--vp-c-brand-1);
  font-size: 18px;
}

@media (max-width: 640px) {
  .operation-module-row {
    grid-template-columns: 32px minmax(0, 1fr) 18px;
  }

  .operation-module-meta {
    grid-column: 2 / 3;
    grid-row: 2;
  }

  .operation-module-arrow {
    grid-column: 3;
    grid-row: 1 / 3;
  }

  .operation-chapter > p {
    margin-left: 0;
  }
}
</style>
