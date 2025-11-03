<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="logo">
          <img src="/docs/logo_new.png" alt="Logo" />
        </div>
        <h1 class="title">xianling Docs</h1>
        <p class="subtitle">学习笔记，经验心得</p>
      </div>
      
      <div class="login-form">
        <div class="form-group">
          <label for="username">账号</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="请输入账号"
            @keyup.enter="handleLogin"
            autocomplete="username"
          />
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="请输入密码"
            @keyup.enter="handleLogin"
            autocomplete="current-password"
          />
        </div>
        
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <button class="login-button" @click="handleLogin" :disabled="isLoading">
          <span v-if="isLoading">登录中...</span>
          <span v-else>登录</span>
        </button>
      </div>
      
      <div class="login-footer">
        <p>© 2024-present xianling</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { authManager } from '../utils/auth.js'

const username = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const emit = defineEmits(['login-success'])

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true
  
  try {
    // 验证账号密码
    if (authManager.validateCredentials(username.value, password.value)) {
      // 登录成功，保存登录状态
      authManager.login()
      
      // 触发登录成功事件
      emit('login-success')
    } else {
      errorMessage.value = '账号或密码错误，请重试'
      password.value = ''
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

.login-box {
  background: var(--vp-c-bg, #ffffff);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 48px 40px;
  width: 90%;
  max-width: 420px;
  animation: slideIn 0.4s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  margin-bottom: 20px;
}

.logo img {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: var(--vp-c-text-1, #213547);
  margin: 0 0 8px 0;
  background: linear-gradient(120deg, #bd34fe 30%, #41d1ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  height: 32px;
}

.subtitle {
  font-size: 14px;
  color: var(--vp-c-text-2, #476582);
  margin: 0;
}

.login-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1, #213547);
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  border: 1px solid var(--vp-c-divider, #e2e8f0);
  border-radius: 8px;
  background: var(--vp-c-bg-soft, #f6f6f7);
  color: var(--vp-c-text-1, #213547);
  transition: all 0.2s ease;
  box-sizing: border-box;
  outline: none;
}

.form-group input:focus {
  border-color: var(--vp-c-brand-1, #5b7ae0);
  background: var(--vp-c-bg, #ffffff);
  box-shadow: 0 0 0 3px rgba(91, 122, 224, 0.1);
}

.form-group input::placeholder {
  color: var(--vp-c-text-3, #adb5bd);
}

.error-message {
  padding: 12px 16px;
  background: var(--vp-c-danger-soft, #fef0f0);
  color: var(--vp-c-danger-1, #f43f5e);
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 20px;
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

.login-button {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(120deg, #bd34fe 30%, #41d1ff);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(189, 52, 254, 0.3);
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(189, 52, 254, 0.4);
}

.login-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(189, 52, 254, 0.3);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 4px 12px rgba(189, 52, 254, 0.3);
}

.login-footer {
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid var(--vp-c-divider, #e2e8f0);
}

.login-footer p {
  margin: 0;
  font-size: 13px;
  color: var(--vp-c-text-3, #6b7280);
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .login-container {
    background: linear-gradient(135deg, #1e1e30 0%, #2d1b47 100%);
  }
  
  .title {
    color: var(--vp-c-text-1, #f6f6f7);
  }
}

/* 响应式设计 */
@media (max-width: 640px) {
  .login-box {
    padding: 36px 28px;
  }
  
  .title {
    font-size: 24px;
    height: fit-content;
  }
}
</style>


