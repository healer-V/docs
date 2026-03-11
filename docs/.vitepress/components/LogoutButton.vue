<template>
  <button class="logout-button" @click="handleLogout" title="登出">
    退出
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
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 3px;
  color: var(--vp-c-text-2);
  font-size: 0.78rem;
  font-family: 'DM Sans', sans-serif;
  font-weight: 400;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 8px;
}

.logout-button:hover {
  border-color: var(--accent, #e8a045);
  color: var(--accent, #e8a045);
}

.logout-button:active {
  opacity: 0.7;
}
</style>
