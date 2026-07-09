<template>
  <div class="login-portal">
    <!-- Animated aurora background -->
    <div class="portal-bg">
      <div class="aurora-orb aurora-orb--1"></div>
      <div class="aurora-orb aurora-orb--2"></div>
      <div class="aurora-orb aurora-orb--3"></div>
      <div class="grid-overlay"></div>
    </div>

    <!-- Login card -->
    <div class="portal-card">
      <div class="card-glow"></div>

      <!-- Header -->
      <div class="portal-header">
        <div class="logo-ring">
          <!-- <img src="../../public/logo_new.png" alt="Logo" /> -->
          <img src="/logo_new.png" alt="Logo" />
        </div>
        <h1 class="portal-title">xianling Docs</h1>
        <p class="portal-sub">学习笔记 · 经验心得</p>
      </div>

      <!-- Form -->
      <div class="portal-form">
        <div class="field">
          <label for="username">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
            账号
          </label>
          <div class="input-wrap" :class="{ focused: userFocused }">
            <input
              id="username"
              v-model="username"
              type="text"
              placeholder="请输入账号"
              @keyup.enter="handleLogin"
              @focus="userFocused = true"
              @blur="userFocused = false"
              autocomplete="username"
            />
          </div>
        </div>

        <div class="field">
          <label for="password">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            密码
          </label>
          <div class="input-wrap" :class="{ focused: passFocused }">
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="请输入密码"
              @keyup.enter="handleLogin"
              @focus="passFocused = true"
              @blur="passFocused = false"
              autocomplete="current-password"
            />
          </div>
        </div>

        <Transition name="err">
          <div v-if="errorMessage" class="error-toast">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {{ errorMessage }}
          </div>
        </Transition>

        <button class="submit-btn" @click="handleLogin" :disabled="isLoading">
          <span class="btn-text">{{ isLoading ? '验证中...' : '进入文档' }}</span>
          <svg v-if="!isLoading" class="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          <span v-else class="btn-spinner"></span>
        </button>
      </div>

      <!-- Footer -->
      <div class="portal-footer">
        <span class="footer-line"></span>
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
const userFocused = ref(false)
const passFocused = ref(false)

const emit = defineEmits(['login-success'])

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    if (authManager.validateCredentials(username.value, password.value)) {
      authManager.login()
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
/* ── Portal container ── */
.login-portal {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-night);
  overflow: hidden;
  font-family: 'Sora', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ── Aurora background ── */
.portal-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.aurora-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
}

.aurora-orb--1 {
  width: 500px;
  height: 500px;
  top: -15%;
  left: -10%;
  background: rgba(var(--color-success-rgb), 0.12);
  animation: orbFloat1 18s ease-in-out infinite alternate;
}

.aurora-orb--2 {
  width: 400px;
  height: 400px;
  top: 20%;
  right: -8%;
  background: rgba(var(--color-cyan-rgb), 0.10);
  animation: orbFloat2 22s ease-in-out infinite alternate;
}

.aurora-orb--3 {
  width: 350px;
  height: 350px;
  bottom: -10%;
  left: 30%;
  background: rgba(var(--color-purple-rgb), 0.08);
  animation: orbFloat3 20s ease-in-out infinite alternate;
}

@keyframes orbFloat1 {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(40px, 30px) scale(1.1); }
}
@keyframes orbFloat2 {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(-30px, -20px) scale(1.15); }
}
@keyframes orbFloat3 {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(25px, -35px) scale(1.05); }
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(var(--light-rgb), 0.08) 0.5px, transparent 0.5px);
  background-size: 28px 28px;
  mask-image: radial-gradient(ellipse at center, black 20%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 20%, transparent 70%);
  opacity: 0.4;
}

/* ── Card ── */
.portal-card {
  position: relative;
  width: 92%;
  max-width: 380px;
  padding: 2.5rem 2rem 2rem;
  background: rgba(var(--surface-dark-rgb), 0.65);
  border: 1px solid rgba(var(--light-rgb), 0.06);
  border-radius: 20px;
  backdrop-filter: blur(40px) saturate(150%);
  -webkit-backdrop-filter: blur(40px) saturate(150%);
  animation: cardReveal 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 1;
}

.card-glow {
  position: absolute;
  inset: -1px;
  border-radius: 21px;
  background: linear-gradient(135deg, rgba(var(--color-success-rgb), 0.25), rgba(var(--color-cyan-rgb), 0.15), rgba(var(--color-purple-rgb), 0.2));
  z-index: -1;
  opacity: 0.5;
  filter: blur(1px);
  transition: opacity 0.4s ease;
}

.portal-card:hover .card-glow {
  opacity: 0.8;
}

@keyframes cardReveal {
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── Header ── */
.portal-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-ring {
  width: 56px;
  height: 56px;
  margin: 0 auto 1rem;
  border-radius: 16px;
  padding: 2px;
  background: var(--aurora);
  animation: ringShift 6s ease-in-out infinite alternate;
  transition: transform 0.3s ease;
}

.logo-ring:hover {
  transform: scale(1.05) rotate(2deg);
}

@keyframes ringShift {
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
}

.logo-ring img {
  width: 100%;
  height: 100%;
  border-radius: 14px;
  object-fit: cover;
  display: block;
  background: var(--vp-c-bg, var(--color-white));
}

.portal-title {
  font-family: 'Sora', sans-serif;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0 0 0.35rem;
  background: linear-gradient(135deg, var(--color-neutral-300) 30%, var(--color-brand-bright) 70%, var(--color-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.portal-sub {
  font-size: 0.78rem;
  font-weight: 400;
  color: var(--color-neutral-700);
  margin: 0;
  letter-spacing: 0.08em;
}

/* ── Form ── */
.portal-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.field label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-neutral-700);
  margin-bottom: 0.4rem;
}

.field label svg {
  color: var(--color-neutral-800);
}

.input-wrap {
  position: relative;
  border-radius: 10px;
  border: 1px solid rgba(var(--light-rgb), 0.06);
  background: rgba(var(--light-rgb), 0.03);
  transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
}

.input-wrap.focused {
  border-color: rgba(var(--color-brand-bright-rgb), 0.3);
  box-shadow: 0 0 0 3px rgba(var(--color-brand-bright-rgb), 0.06), 0 0 20px rgba(var(--color-brand-bright-rgb), 0.05);
  background: rgba(var(--light-rgb), 0.04);
}

.input-wrap input {
  width: 100%;
  padding: 11px 14px;
  font-size: 0.9rem;
  font-family: 'Sora', 'Noto Sans SC', sans-serif;
  font-weight: 400;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--color-neutral-300);
  outline: none;
  box-sizing: border-box;
}

.input-wrap input::placeholder {
  color: var(--color-neutral-900);
  font-weight: 300;
}

/* ── Error ── */
.error-toast {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(var(--color-danger-rgb), 0.08);
  border: 1px solid rgba(var(--color-danger-rgb), 0.15);
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-danger-soft);
}

.error-toast svg { flex-shrink: 0; color: var(--color-danger); }

.err-enter-active { animation: errIn 0.35s ease; }
.err-leave-active { animation: errIn 0.2s ease reverse; }
@keyframes errIn {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── Submit button ── */
.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  margin-top: 0.3rem;
  font-family: 'Sora', 'Noto Sans SC', sans-serif;
  font-size: 0.88rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--color-white);
  background: var(--aurora);
  background-size: 200% 200%;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  animation: gradShift 5s ease-in-out infinite;
}

@keyframes gradShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Shimmer sweep */
.submit-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: -120%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(var(--light-rgb), 0.18), transparent);
  animation: shimmerSweep 3.5s ease-in-out infinite;
  pointer-events: none;
}

@keyframes shimmerSweep {
  0%, 65%, 100% { left: -120%; }
  80% { left: 150%; }
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(var(--color-cyan-rgb), 0.25), 0 0 0 1px rgba(var(--color-brand-bright-rgb), 0.15);
}

.submit-btn:active {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-arrow {
  transition: transform 0.25s ease;
}

.submit-btn:hover .btn-arrow {
  transform: translateX(3px);
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(var(--light-rgb), 0.3);
  border-top-color: var(--color-white);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Footer ── */
.portal-footer {
  margin-top: 1.8rem;
  text-align: center;
}

.footer-line {
  display: block;
  width: 40px;
  height: 1px;
  margin: 0 auto 0.8rem;
  background: linear-gradient(90deg, transparent, rgba(var(--light-rgb), 0.08), transparent);
}

.portal-footer p {
  margin: 0;
  font-size: 0.65rem;
  color: var(--color-neutral-900);
  letter-spacing: 0.05em;
}

/* ── Light mode overrides ── */
:root .login-portal {
  background: var(--color-neutral-200);
}

:root .aurora-orb--1 { background: rgba(var(--color-success-rgb), 0.08); }
:root .aurora-orb--2 { background: rgba(var(--color-cyan-rgb), 0.06); }
:root .aurora-orb--3 { background: rgba(var(--color-purple-rgb), 0.05); }

:root .grid-overlay {
  background-image: radial-gradient(circle, rgba(var(--shadow-rgb), 0.04) 0.5px, transparent 0.5px);
}

:root .portal-card {
  background: rgba(var(--light-rgb), 0.75);
  border-color: rgba(var(--shadow-rgb), 0.06);
}

:root .card-glow {
  opacity: 0.3;
}

:root .portal-title {
  background: linear-gradient(135deg, var(--color-ink) 30%, var(--color-brand) 70%, var(--color-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

:root .portal-sub { color: var(--color-neutral-600); }

:root .field label { color: var(--color-neutral-600); }
:root .field label svg { color: var(--color-neutral-500); }

:root .input-wrap {
  border-color: rgba(var(--shadow-rgb), 0.08);
  background: rgba(var(--shadow-rgb), 0.02);
}

:root .input-wrap.focused {
  border-color: rgba(var(--color-brand-rgb), 0.35);
  box-shadow: 0 0 0 3px rgba(var(--color-brand-rgb), 0.06), 0 0 20px rgba(var(--color-brand-rgb), 0.04);
  background: var(--color-white);
}

:root .input-wrap input {
  color: var(--color-ink);
}

:root .input-wrap input::placeholder {
  color: var(--color-neutral-400);
}

:root .portal-footer p { color: var(--color-neutral-400); }

:root .footer-line {
  background: linear-gradient(90deg, transparent, rgba(var(--shadow-rgb), 0.06), transparent);
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .portal-card {
    max-width: 340px;
    padding: 2rem 1.5rem 1.5rem;
    border-radius: 16px;
  }
  .portal-title { font-size: 1.3rem; }
  .logo-ring { width: 48px; height: 48px; border-radius: 14px; }
  .logo-ring img { border-radius: 12px; }
  .aurora-orb--1 { width: 300px; height: 300px; }
  .aurora-orb--2 { width: 250px; height: 250px; }
  .aurora-orb--3 { width: 200px; height: 200px; }
}

@media (max-width: 360px) {
  .portal-card {
    max-width: 300px;
    padding: 1.5rem 1.25rem 1.25rem;
  }
  .portal-title { font-size: 1.15rem; }
  .portal-header { margin-bottom: 1.5rem; }
}
</style>
