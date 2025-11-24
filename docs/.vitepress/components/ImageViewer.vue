<template>
  <div class="image-viewer-container">
    <!-- 缩略图 -->
    <div class="thumbnail-container" @click="openViewer" :style="customStyles">
      <img :src="thumbnailSrc || src" :alt="alt" :title="alt" class="thumbnail-image" :style="{
        width: thumbnailWidth || 'auto',
        height: thumbnailHeight || 'auto',
        maxWidth: thumbnailMaxWidth || '100%',
        maxHeight: thumbnailMaxHeight || '100%',
        cursor: 'pointer'
      }" @error="handleImageError" />
      <div v-if="showZoomIcon" class="zoom-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
      </div>
    </div>

    <!-- 图片预览弹窗 -->
    <Teleport to="body">
      <div v-if="visible" class="image-viewer-overlay" @click="closeViewer" @wheel="handleWheel"
        :class="{ 'is-loading': isLoading }">
        <div class="image-viewer-modal" @click.stop>
          <!-- 关闭按钮 -->
          <button class="close-button" @click="closeViewer" :aria-label="'关闭'">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>

          <!-- 图片容器 -->
          <div class="image-container" ref="imageContainer">
            <div v-if="isLoading" class="loading-spinner">
              <svg class="spinner" width="40" height="40" viewBox="0 0 40 40">
                <circle class="path" cx="20" cy="20" r="18" fill="none" stroke-width="3"></circle>
              </svg>
            </div>
            <img v-show="!isLoading" ref="previewImage" :src="src" :alt="alt" class="preview-image" :style="{
              transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
              transition: isTransitioning ? 'transform 0.3s ease' : 'none'
            }" @load="handleImageLoad" @error="handleImageError" @mousedown="handleMouseDown"
              @touchstart="handleTouchStart" />
          </div>

          <!-- 工具栏 -->
          <div class="toolbar">
            <button class="toolbar-button" @click="resetZoom" :title="'重置缩放'">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23 4V10H17" stroke="#2ecc71" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" />
                <path d="M1 20V14H7" stroke="#2ecc71" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path
                  d="M3.51 9C4.01717 7.56678 4.87913 6.2854 6.01547 5.27542C7.1518 4.26543 8.52547 3.55976 10.0083 3.22426C11.4911 2.88875 13.0348 2.93434 14.4952 3.35677C15.9556 3.77921 17.2853 4.56471 18.36 5.64L23 10M1 14L5.64 18.36C6.71475 19.4353 8.04437 20.2208 9.50481 20.6432C10.9652 21.0657 12.5089 21.1113 13.9917 20.7757C15.4745 20.4402 16.8482 19.7346 17.9845 18.7246C19.1209 17.7146 19.9828 16.4332 20.49 15"
                  stroke="#2ecc71" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <button class="toolbar-button" @click="zoomIn" :title="'放大'" :disabled="scale >= maxScale">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                  stroke="#3498db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M21 21L16.65 16.65" stroke="#3498db" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" />
                <path d="M11 8V14" stroke="#3498db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M8 11H14" stroke="#3498db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <button class="toolbar-button" @click="zoomOut" :title="'缩小'" :disabled="scale <= minScale">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                  stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M21 21L16.65 16.65" stroke="#e74c3c" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" />
                <path d="M8 11H14" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

// Props
const props = defineProps({
  src: {
    type: String,
    required: true
  },
  thumbnailSrc: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: '图片预览'
  },
  thumbnailWidth: {
    type: String,
    default: ''
  },
  thumbnailHeight: {
    type: String,
    default: ''
  },
  thumbnailMaxWidth: {
    type: String,
    default: '100%'
  },
  thumbnailMaxHeight: {
    type: String,
    default: '100%'
  },
  showZoomIcon: {
    type: Boolean,
    default: true
  },
  minScale: {
    type: Number,
    default: 0.1
  },
  maxScale: {
    type: Number,
    default: 10
  },
  scaleStep: {
    type: Number,
    default: 0.1
  },
  customStyles: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['open', 'close', 'error', 'load'])

// 响应式数据
const visible = ref(false)
const isLoading = ref(true)
const isTransitioning = ref(false)
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const startX = ref(0)
const startY = ref(0)
const startTranslateX = ref(0)
const startTranslateY = ref(0)
const isDragging = ref(false)

// 模板引用
const imageContainer = ref(null)
const previewImage = ref(null)

// 打开预览
const openViewer = () => {
  visible.value = true
  resetZoom()
  emit('open')
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', handleKeydown)
}

// 关闭预览
const closeViewer = () => {
  visible.value = false
  emit('close')
  document.body.style.overflow = ''
  document.removeEventListener('keydown', handleKeydown)
}

// 重置缩放
const resetZoom = () => {
  isTransitioning.value = true
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
  setTimeout(() => {
    isTransitioning.value = false
  }, 300)
}

// 放大
const zoomIn = () => {
  if (scale.value < props.maxScale) {
    isTransitioning.value = true
    scale.value += props.scaleStep
    setTimeout(() => {
      isTransitioning.value = false
    }, 300)
  }
}

// 缩小
const zoomOut = () => {
  if (scale.value > props.minScale) {
    isTransitioning.value = true
    scale.value -= props.scaleStep
    setTimeout(() => {
      isTransitioning.value = false
    }, 300)
  }
}

// 处理鼠标滚轮
const handleWheel = (e) => {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -props.scaleStep : props.scaleStep

  if ((delta > 0 && scale.value < props.maxScale) ||
    (delta < 0 && scale.value > props.minScale)) {
    isTransitioning.value = true
    scale.value += delta
    setTimeout(() => {
      isTransitioning.value = false
    }, 300)
  }
}

// 处理鼠标按下
const handleMouseDown = (e) => {
  if (scale.value <= 1) return

  isDragging.value = true
  startX.value = e.clientX
  startY.value = e.clientY
  startTranslateX.value = translateX.value
  startTranslateY.value = translateY.value

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 处理鼠标移动
const handleMouseMove = (e) => {
  if (!isDragging.value) return

  isTransitioning.value = false
  translateX.value = startTranslateX.value + (e.clientX - startX.value)
  translateY.value = startTranslateY.value + (e.clientY - startY.value)
}

// 处理鼠标释放
const handleMouseUp = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

// 处理触摸开始
const handleTouchStart = (e) => {
  if (scale.value <= 1) return

  const touch = e.touches[0]
  isDragging.value = true
  startX.value = touch.clientX
  startY.value = touch.clientY
  startTranslateX.value = translateX.value
  startTranslateY.value = translateY.value

  document.addEventListener('touchmove', handleTouchMove, { passive: false })
  document.addEventListener('touchend', handleTouchEnd)
}

// 处理触摸移动
const handleTouchMove = (e) => {
  if (!isDragging.value) return

  e.preventDefault()
  const touch = e.touches[0]

  isTransitioning.value = false
  translateX.value = startTranslateX.value + (touch.clientX - startX.value)
  translateY.value = startTranslateY.value + (touch.clientY - startY.value)
}

// 处理触摸结束
const handleTouchEnd = () => {
  isDragging.value = false
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
}

// 处理键盘事件
const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    closeViewer()
  } else if (e.key === '+') {
    zoomIn()
  } else if (e.key === '-') {
    zoomOut()
  } else if (e.key === '0') {
    resetZoom()
  }
}

// 处理图片加载
const handleImageLoad = () => {
  isLoading.value = false
  emit('load')
}

// 处理图片错误
const handleImageError = (e) => {
  isLoading.value = false
  console.error('图片加载失败:', props.src)
  emit('error', { src: props.src, event: e })
}

// 监听visible变化
watch(visible, (newVal) => {
  if (newVal) {
    isLoading.value = true
    // 预加载图片
    const img = new Image()
    img.src = props.src
    img.onload = handleImageLoad
    img.onerror = handleImageError
  }
})

// 清理事件监听器
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.image-viewer-container {
  display: inline-block;
  position: relative;
}

.thumbnail-container {
  position: relative;
  display: inline-block;
  overflow: hidden;
}

.thumbnail-image {
  display: block;
  object-fit: contain;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.thumbnail-image:hover {
  opacity: 0.9;
  transform: scale(1.02);
}

.zoom-icon {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 4px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.thumbnail-container:hover .zoom-icon {
  opacity: 1;
}

/* 预览弹窗样式 */
.image-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  cursor: grab;
}

.image-viewer-overlay:active {
  cursor: grabbing;
}

.image-viewer-overlay.is-loading {
  cursor: default;
}

.image-viewer-modal {
  position: relative;
  max-width: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-container {
  position: relative;
  max-width: 100%;
  max-height: calc(100vh - 120px);
  overflow: visible;
}

.loading-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
}

.spinner {
  animation: rotate 1s linear infinite;
}

.spinner .path {
  stroke: var(--vp-c-brand-1, #42b883);
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }

  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }

  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.close-button {
  position: absolute;
  top: -240px;
  right: -340px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.toolbar {
  position: absolute;
  bottom: -200px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 12px;
  border-radius: 8px;
  z-index: 9;
}

.toolbar-button {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 42px;
  height: 42px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toolbar-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.toolbar-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .image-viewer-overlay {
    padding: 10px;
  }

  .close-button {
    top: -50px;
    right: 50%;
    transform: translateX(50%);
  }

  .toolbar {
    bottom: -70px;
  }
}
</style>