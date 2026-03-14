<template>
  <button class="logout-button" @click="handleLogout" title="退出登录">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
    <span>退出</span>
  </button>
</template>

<script setup>
import { authManager } from '../utils/auth.js'

const emit = defineEmits(['logout-success'])

const handleLogout = () => {
  authManager.logout()
  emit('logout-success')
  window.location.reload()
}
</script>

<style scoped>
.logout-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  color: var(--vp-c-text-2);
  font-size: 0.75rem;
  font-family: 'Sora', 'Noto Sans SC', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 8px;
}

.logout-button:hover {
  border-color: var(--accent, #0ea5e9);
  color: var(--accent, #0ea5e9);
}

.logout-button:active {
  opacity: 0.7;
}

.logout-button svg {
  opacity: 0.7;
}

.logout-button:hover svg {
  opacity: 1;
}
</style>
