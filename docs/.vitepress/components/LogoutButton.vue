<template>
  <button class="logout-button" @click="handleLogout" title="登出">
    登出
  </button>
</template>

<script setup>
import { authManager } from '../utils/auth.js'

const emit = defineEmits(['logout-success'])

const handleLogout = () => {
  authManager.logout()
  emit('logout-success')
  // 刷新页面以重新显示登录页面
  window.location.reload()
}
</script>

<style scoped>
.logout-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  /* background: var(--vp-c-bg-soft); */
  background: skyblue;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 10px;
}

.logout-button:hover {
  background: var(--vp-c-bg-soft-up);
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-brand-1);
}

.logout-button svg {
  flex-shrink: 0;
}
</style>
