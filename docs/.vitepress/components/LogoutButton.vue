<template>
  <button class="logout-button" @click="handleLogout" title="退出登录">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
    <span class="logout-text">退出</span>
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
  padding: 4px 10px;
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-2);
  font-size: 0.75rem;
  font-family: 'Sora', 'Noto Sans SC', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 8px;
  height: 28px;
  line-height: 1;
}

.logout-button:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.logout-button:active {
  opacity: 0.7;
}

.logout-button svg {
  opacity: 0.7;
  flex-shrink: 0;
}

.logout-button:hover svg {
  opacity: 1;
}

@media (max-width: 768px) {
  .logout-button {
    padding: 0 10px;
    width: 40px;
    height: 40px;
    font-size: 0.7rem;
    margin-left: 4px;
    border-radius: 6px;
    background: var(--vp-c-bg-soft);
    border: 1px solid var(--glow-border, var(--vp-c-divider)) !important;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .logout-text {
    display: none;
  }
}
</style>
