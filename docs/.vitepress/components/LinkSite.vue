<template>
    <div class="link-item">
      <a :href="data.link" :title="data.name" target="_blank">
        <div class="link-icon">
          <img v-if="!imageFailed" :class="{ irregular: data.irregular }" :src="data.avatar" @error="handleImageError()" :alt="data.name" />
          <!-- 替代内容：显示首字母 -->
          <span v-else class="iconPlaceholder">{{ data.name.charAt(0) }}</span>
        </div>
        <div class="link-info">
          <div class="link-name">{{ data.name }}</div>
          <div class="link-desc" :title="data.descr">{{ data.descr }}</div>
        </div>
      </a>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const props = defineProps({ data: Object })
  const data = props.data
  
  // 记录图片加载状态
  const imageFailed = ref(false)
  
  // 处理图片加载失败
  const handleImageError = () => {
    imageFailed.value = true // 更新加载状态
  }
  </script>
  
 <style>
.link-item {
    --weiz-card-border-radius: 16px;
    --weiz-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100px;
  display: inline-block;
  border-radius: var(--weiz-card-border-radius);
  background-color: var(--vp-c-bg);
  box-shadow: var(--weiz-shadow);
}
/* .link-item:hover .link-icon > img, .link-item:hover .iconPlaceholder {
  transform: scale(1.2);
}
.link-item:hover .link-icon > img.irregular, .link-item:hover .iconPlaceholder.irregular {
  transform: scale(1.2);
}
.link-item:hover .link-info {
  margin-left: 20px;
} */
.link-item > a {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  align-items: center;
}
.link-item .link-icon {
  flex: 0 0 auto;
  width: 100px;
  height: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--weiz-transition-6);
}
.link-item .link-icon > img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  vertical-align: top;
  object-fit: cover;
  transition: var(--weiz-transition-6);
}
.link-item .link-icon > img[src^="https://vitepress.dev/"] {
  border-radius: 0;
}
.link-item .link-icon > img.irregular {
  object-fit: contain;
}
.link-item .link-icon .iconPlaceholder {
  font-size: var(--weiz-font-size-3xl);
  font-weight: var(--weiz-font-weight-bold);
  display: inline-block;
  transition: var(--weiz-transition-6);
}
.link-item .link-info {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: var(--weiz-transition-6);
}
.link-item .link-name {
  width: 100%;
  font-size: 16px;
  line-height: var(--weiz-text-st-line-height);
  font-weight: var(--weiz-font-weight-semibold);
  margin-bottom: var(--weiz-spacing-2xl);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: var(--weiz-transition-6);
  font-weight: 600;
}
.link-item .link-desc {
  width: 100%;
  padding-right: var(--weiz-spacing-6xl);
  font-weight: var(--weiz-font-weight-semibold);
  color: var(--vp-c-text-2);
  line-height: var(--weiz-text-xs-line-height);
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  transition: var(--weiz-transition-6);
  font-size: 14px;
}

 </style>