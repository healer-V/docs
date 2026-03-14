<template>
  <div class="reading-progress-bar" :style="{ width: progress + '%' }"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vitepress'

const progress = ref(0)
const route = useRoute()

const updateProgress = () => {
  const scrollTop = window.scrollY
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  if (docHeight > 0) {
    progress.value = Math.min(100, (scrollTop / docHeight) * 100)
  }
}

let ticking = false
const onScroll = () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateProgress()
      ticking = false
    })
    ticking = true
  }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  updateProgress()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
.reading-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 2px;
  background: linear-gradient(90deg, #10b981, #06b6d4, #8b5cf6);
  z-index: 999;
  transition: width 0.1s linear;
  border-radius: 0 1px 1px 0;
  box-shadow: 0 0 6px var(--accent-glow, rgba(16, 185, 129, 0.25));
}
</style>
