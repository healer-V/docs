<template>
  <div class="article-meta" v-if="showMeta">
    <div class="meta-item">
      <svg class="meta-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
      <span class="meta-text">{{ author }}</span>
    </div>
    
    <div class="meta-item">
      <svg class="meta-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/>
      </svg>
      <span class="meta-text">更新于：{{ formattedDate }}</span>
    </div>
    
    <div class="meta-item">
      <svg class="meta-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
      </svg>
      <span class="meta-text">字数：{{ wordCount }}字</span>
    </div>
    
    <!-- <div class="meta-item">
      <svg class="meta-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/>
      </svg>
      <span class="meta-text">{{ readingTime }}分钟</span>
    </div>
     -->
    <div class="meta-item" v-if="tags && tags.length > 0">
      <svg class="meta-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z"/>
      </svg>
      <span class="meta-text">{{ tags.join(' · ') }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useData, useRoute } from 'vitepress'

const { frontmatter, page } = useData()
const route = useRoute()

// 响应式字数统计
const wordCount = ref(0)
const readingTime = ref(0)

// DOM字数统计函数
const countWordsFromDOM = () => {
  if (typeof window === 'undefined') return
  
  // 获取文章内容DOM元素
  const contentElement = document.querySelector('.vp-doc')
  
  if (!contentElement) {
    console.log('未找到 .vp-doc 元素')
    return
  }
  
  // 获取文本内容
  const content = contentElement.innerText
  
  if (!content) {
    console.log('未获取到文本内容')
    return
  }
  
  // 使用正则表达式过滤，只留下非空字符
  const text = content.match(/\S/g)
  
  if (!text) {
    console.log('未匹配到非空字符')
    return
  }
  
  // 计算字数
  const count = text.length
  
  // 计算阅读时间（中文每分钟200字）
  const minutes = Math.ceil(count / 200)
  
  // 更新响应式数据
  wordCount.value = count
  readingTime.value = minutes
  
  console.log('原始文本长度:', content.length)
  console.log('非空字符数组长度:', text.length)
  console.log('统计字数:', count)
}

// 计算属性
const showMeta = computed(() => {
  return frontmatter.value.author || frontmatter.value.date || frontmatter.value.tags
})

const author = computed(() => {
  return frontmatter.value.author || 'xianling'
})

const formattedDate = computed(() => {
  // 优先级：frontmatter.date > page.lastUpdated > 当前日期
  let dateToUse = null
  
  if (frontmatter.value.date) {
    // 使用frontmatter中的date
    dateToUse = new Date(frontmatter.value.date)
  } else if (page.value.lastUpdated) {
    // 使用VitePress的lastUpdated（文件最后修改时间）
    dateToUse = new Date(page.value.lastUpdated)
  } else {
    // 使用当前日期作为fallback
    dateToUse = new Date()
  }
  
  return dateToUse.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
})

const tags = computed(() => {
  return frontmatter.value.tags || []
})

// 组件挂载时获取字数
onMounted(() => {
  console.log('ArticleMeta组件已挂载')
  
  // 延迟执行，确保DOM已渲染
  setTimeout(() => {
    countWordsFromDOM()
  }, 100)
})

// 监听路由变化
watch(() => route.path, (newPath, oldPath) => {
  console.log('路由变化:', oldPath, '->', newPath)
  
  // 延迟执行，确保新页面DOM已渲染
  setTimeout(() => {
    countWordsFromDOM()
  }, 200)
}, { immediate: false })

// 监听frontmatter变化
watch(() => frontmatter.value, (newFrontmatter) => {
  console.log('frontmatter变化:', newFrontmatter)
  
  // 如果手动指定了字数，使用手动指定的值
  if (newFrontmatter.wordCount) {
    wordCount.value = newFrontmatter.wordCount
    readingTime.value = newFrontmatter.readingTime || Math.ceil(newFrontmatter.wordCount / 200)
    console.log('使用手动指定的字数:', newFrontmatter.wordCount)
  } else {
    // 否则使用DOM统计
    setTimeout(() => {
      countWordsFromDOM()
    }, 100)
  }
}, { immediate: true, deep: true })
</script>

<style scoped>
.article-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0 2rem 0;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border-left: 4px solid var(--vp-c-brand-1);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}

.meta-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  opacity: 0.7;
}

.meta-text {
  white-space: nowrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .article-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .meta-item {
    font-size: 0.85rem;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .article-meta {
    background: var(--vp-c-bg-alt);
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .article-meta {
    border: 1px solid var(--vp-c-divider);
  }
}
</style>