<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="logo">
          <img src="../../public/logo_new.png" alt="Logo" />
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
  background: #f5f2ee;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  font-family: 'DM Sans', -apple-system, sans-serif;
}

/* 左侧装饰条 */
.login-container::before {
  content: '';
  position: fixed;
  left: 0;
  top: 0;
  width: 3px;
  height: 100%;
  background: #e8a045;
}

.login-box {
  width: 90%;
  max-width: 400px;
  animation: fadeUp 0.35s ease-out;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* 页头 */
.login-header {
  margin-bottom: 2.5rem;
}

.logo {
  margin-bottom: 1.25rem;
}

.logo img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
}

.title {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 1.75rem;
  font-weight: 400;
  letter-spacing: -0.03em;
  color: #1a1a2e;
  margin: 0 0 0.4rem 0;
  line-height: 1.15;
  /* 去掉渐变，用纯色 */
  background: none;
  -webkit-text-fill-color: unset;
}

.subtitle {
  font-size: 0.85rem;
  font-weight: 300;
  color: #6b6560;
  margin: 0;
  letter-spacing: 0.01em;
}

/* 表单 */
.login-form {
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6b6560;
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  padding: 10px 14px;
  font-size: 0.95rem;
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  border: 1px solid #d8d0c8;
  border-radius: 4px;
  background: #fff;
  color: #1a1a2e;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  outline: none;
}

.form-group input:focus {
  border-color: #e8a045;
}

.form-group input::placeholder {
  color: #b0a89e;
  font-weight: 300;
}

/* 错误提示 */
.error-message {
  padding: 10px 14px;
  border-left: 2px solid #e05252;
  background: #fdf4f4;
  color: #c0392b;
  border-radius: 0 4px 4px 0;
  font-size: 0.82rem;
  font-weight: 400;
  margin-bottom: 1.25rem;
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}

/* 登录按钮 */
.login-button {
  width: 100%;
  padding: 11px;
  font-size: 0.875rem;
  font-family: 'DM Sans', sans-serif;
  font-weight: 400;
  letter-spacing: 0.05em;
  color: #fff;
  background: #1a1a2e;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.login-button:hover {
  background: #e8a045;
  transform: translateY(-1px);
}

.login-button:active {
  transform: translateY(0);
  background: #d4903a;
}

.login-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

/* 页脚 */
.login-footer {
  padding-top: 1.5rem;
  border-top: 1px solid #e0d8d0;
}

.login-footer p {
  margin: 0;
  font-size: 0.72rem;
  color: #b0a89e;
  letter-spacing: 0.04em;
}

/* 暗色模式 */
.dark .login-container {
  background: #1c1917;
}

.dark .login-container::before {
  background: #c9a96e;
}

.dark .title {
  color: #e8e3dc;
}

.dark .subtitle { color: #7a7068; }

.dark .form-group label { color: #7a7068; }

.dark .form-group input {
  background: #242220;
  border-color: rgba(255,255,255,0.1);
  color: #e8e3dc;
}

.dark .form-group input:focus { border-color: #c9a96e; }
.dark .form-group input::placeholder { color: #4a4540; }

.dark .error-message {
  background: rgba(224,82,82,0.08);
  border-color: #e05252;
  color: #f08080;
}

.dark .login-button {
  background: #c9a96e;
  color: #1c1917;
}

.dark .login-button:hover { background: #e8c99a; }

.dark .login-footer { border-color: rgba(255,255,255,0.08); }
.dark .login-footer p { color: #4a4540; }

/* 响应式 */
@media (max-width: 640px) {
  .login-box { max-width: 340px; }
  .title { font-size: 1.5rem; }
}
</style>


