<template>
  <a :href="data.link" :title="data.name" target="_blank" rel="noopener" class="link-card">
    <div class="lk-avatar">
      <img
        v-if="!imageFailed"
        :class="{ irregular: data.irregular }"
        :src="data.avatar"
        @error="handleImageError()"
        :alt="data.name"
      />
      <span v-else class="lk-fallback">{{ data.name.charAt(0) }}</span>
    </div>
    <div class="lk-info">
      <span class="lk-name">{{ data.name }}</span>
      <span class="lk-desc" :title="data.descr">{{ data.descr }}</span>
    </div>
    <svg class="lk-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
  </a>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({ data: Object })
const data = props.data
const imageFailed = ref(false)
const handleImageError = () => { imageFailed.value = true }
</script>

<style scoped>
.link-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  text-decoration: none !important;
  color: inherit;
  transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
  cursor: pointer;
}

.link-card:hover {
  transform: translateY(-2px);
  border-color: rgba(var(--color-success-rgb), 0.25);
  box-shadow: 0 6px 20px rgba(var(--shadow-rgb), 0.05);
}

.dark .link-card:hover {
  box-shadow: 0 6px 20px rgba(var(--shadow-rgb), 0.18);
}

.lk-avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-soft);
}

.lk-avatar img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.lk-avatar img.irregular {
  border-radius: 4px;
  object-fit: contain;
}

.lk-fallback {
  font-size: 1rem;
  font-weight: 700;
  color: var(--accent);
}

.lk-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.lk-name {
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s;
}

.link-card:hover .lk-name { color: var(--accent); }

.lk-desc {
  font-size: 0.72rem;
  color: var(--vp-c-text-3);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  overflow: hidden;
  margin-top: 1px;
}

.lk-arrow {
  flex-shrink: 0;
  color: var(--vp-c-text-3);
  opacity: 0;
  transform: translate(-4px, 4px);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.link-card:hover .lk-arrow {
  opacity: 1;
  transform: translate(0, 0);
  color: var(--accent);
}
</style>
