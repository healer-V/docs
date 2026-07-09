// https://vitepress.dev/guide/custom-theme
import { h, ref, defineComponent, provide, inject } from 'vue'
import DefaultTheme from 'vitepress/theme'
import { inBrowser } from 'vitepress'
import Login from '../components/Login.vue'
import LogoutButton from '../components/LogoutButton.vue'
import Wlink from '../components/Wlink.vue'
import HomeBento from '../components/HomeBento.vue'
import AboutPage from '../components/AboutPage.vue'
import ReadingProgress from '../components/ReadingProgress.vue'
import { authManager } from '../utils/auth.js'
import './style/index.css';

// 共享的登录状态 — 使用 provide/inject 保持同步
const AUTH_KEY = Symbol('auth')

// 登录守卫组件
const LoginGuard = defineComponent({
  setup() {
    const authState = inject(AUTH_KEY)
    const handleLoginSuccess = () => {
      authState.value = true
    }
    return () => !authState.value
      ? h(Login, { onLoginSuccess: handleLoginSuccess })
      : null
  }
})

// 导航栏登出按钮组件
const NavLogout = defineComponent({
  setup() {
    const authState = inject(AUTH_KEY)
    return () => authState.value
      ? h(LogoutButton, {
          onLogoutSuccess: () => {
            if (inBrowser) window.location.reload()
          }
        })
      : null
  }
})

/** @type {import('vitepress').Theme} */

// 包装 Layout，提供共享的认证状态
const AuthLayout = defineComponent({
  setup() {
    const authState = ref(inBrowser ? authManager.isAuthenticated() : false)
    provide(AUTH_KEY, authState)

    return () => h(DefaultTheme.Layout, null, {
      'layout-top': () => [h(LoginGuard), h(ReadingProgress)],
      'nav-bar-content-after': () => h(NavLogout),
    })
  }
})

export default {
  extends: DefaultTheme,
  Layout: AuthLayout,
  enhanceApp({ app }) {
    // 注册全局组件
    app.component('Wlink', Wlink)
    app.component('HomeBento', HomeBento)
    app.component('AboutPage', AboutPage)
  }
}
