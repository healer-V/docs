<template>
  <div v-if="visible" class="doc-meta" data-pagefind-ignore>
    <div v-if="excerpt" class="doc-meta__excerpt">{{ excerpt }}</div>
    <div v-if="tags.length || date" class="doc-meta__row">
      <ul v-if="tags.length" class="doc-meta__tags" aria-label="标签">
        <li v-for="tag in tags" :key="tag" class="doc-meta__tag"><span aria-hidden="true">#</span>{{ tag }}</li>
      </ul>
      <span v-if="date" class="doc-meta__date">最后更新 {{ date }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { frontmatter } = useData()

const excerpt = computed(() => String(frontmatter.value.excerpt ?? '').trim())
const tags = computed(() => (Array.isArray(frontmatter.value.tags) ? frontmatter.value.tags.map(String) : []))

/** frontmatter 中的 YAML 日期会序列化为 ISO 字符串，只展示日期部分。 */
const date = computed(() => {
  const raw = frontmatter.value.date
  return raw ? String(raw).slice(0, 10) : ''
})

const visible = computed(() => (
  !['home', 'page'].includes(frontmatter.value.layout) && Boolean(excerpt.value || tags.value.length || date.value)
))
</script>
