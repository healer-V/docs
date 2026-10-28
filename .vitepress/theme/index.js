// https://vitepress.dev/guide/custom-theme
import { h, ref, defineComponent, provide, inject, onMounted } from 'vue'
import DefaultTheme from 'vitepress/theme'
import { inBrowser } from 'vitepress'
import Login from '../components/Login.vue'
import LogoutButton from '../components/LogoutButton.vue'
import Wlink from '../components/Wlink.vue'
import HomeBento from '../components/HomeBento.vue'
import AboutPage from '../components/AboutPage.vue'
import GlobalSearch from '../components/GlobalSearch.vue'
import OperationCatalog from '../components/OperationCatalog.vue'
import ReadingProgress from '../components/ReadingProgress.vue'
import { authManager } from '../utils/auth.js'
import { shouldUseFullPageNavigation } from '../utils/unitRouting.js'
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
    // 服务端与客户端首次渲染都从未认证状态开始，避免读取 localStorage 造成 hydration 分支不一致。
    const authState = ref(false)
    provide(AUTH_KEY, authState)

    /** hydration 完成后恢复浏览器保存的认证状态。 */
    function restoreAuthenticationState() {
      authState.value = authManager.isAuthenticated()
    }

    onMounted(restoreAuthenticationState)

    return () => h(DefaultTheme.Layout, null, {
      'layout-top': () => [h(LoginGuard), h(ReadingProgress)],
      // 导航插槽回调渲染全站唯一搜索入口。
      'nav-bar-content-before': () => h(GlobalSearch),
      'nav-bar-content-after': () => h(NavLogout),
    })
  }
})

/**
 * 为分单元站点安装路由守卫，跨单元时重新加载目标 HTML 和页面清单。
 *
 * @param {import('vitepress').Router} router VitePress 客户端路由实例。
 * @returns {void} 仅修改路由实例的前置导航钩子。
 */
function installUnitRouteGuard(router) {
  const originalBeforeRouteChange = router.onBeforeRouteChange

  /**
   * 在 VitePress 请求目标页面数据前判断是否需要完整页面导航。
   *
   * @param {string} targetUrl VitePress 即将访问的站内地址。
   * @returns {Promise<void | boolean>} 返回 `false` 时取消本次客户端路由。
   */
  router.onBeforeRouteChange = async function handleBeforeRouteChange(targetUrl) {
    if (originalBeforeRouteChange) {
      const originalResult = await originalBeforeRouteChange.call(router, targetUrl)
      if (originalResult === false) {
        return false
      }
    }

    if (inBrowser && shouldUseFullPageNavigation(window.location.href, targetUrl)) {
      window.location.assign(new URL(targetUrl, window.location.href).href)
      return false
    }
  }
}

export default {
  extends: DefaultTheme,
  Layout: AuthLayout,
  enhanceApp({ app, router }) {
    // 注册全局组件
    app.component('Wlink', Wlink)
    app.component('HomeBento', HomeBento)
    app.component('AboutPage', AboutPage)
    app.component('OperationCatalog', OperationCatalog)
    installUnitRouteGuard(router)
  }
}
