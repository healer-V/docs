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
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 16px;
  background: linear-gradient(135deg, var(--vp-c-bg-soft), var(--vp-c-bg-mute));
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.logout-button:hover {
  background: linear-gradient(135deg, var(--vp-c-bg-mute), var(--vp-c-bg-soft-up));
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-brand-1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.logout-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.logout-button svg {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  transition: transform 0.3s ease;
}

.logout-button:hover svg {
  transform: rotate(15deg);
}
</style>
