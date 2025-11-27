// https://vitepress.dev/guide/custom-theme
import { h, ref } from 'vue'
import DefaultTheme from 'vitepress/theme'
import { inBrowser } from 'vitepress'
import busuanzi from 'busuanzi.pure.js'
import Login from '../components/Login.vue'
import LogoutButton from '../components/LogoutButton.vue'
import ImageViewer from '../components/ImageViewer.vue'
import BlogList from '../components/BlogList.vue'
import BusuanziStats from '../components/BusuanziStats.vue'
import ArticleMeta from '../components/ArticleMeta.vue'
import Wlink from '../components/Wlink.vue'
import { authManager } from '../utils/auth.js'
import './style.css';
import './style/index.css';
// import './custom.css';


/** @type {import('vitepress').Theme} */

export default {
  extends: DefaultTheme,
  // ignoreDeadLinks: true,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      'layout-top': () => {
        const isAuthenticated = ref(false)
        const showLogin = ref(true)

        const handleLoginSuccess = () => {
          isAuthenticated.value = true
          showLogin.value = false
        }

        // 在浏览器环境中检查登录状态
        if (inBrowser) {
          isAuthenticated.value = authManager.isAuthenticated()
          showLogin.value = !isAuthenticated.value
        }

        if (showLogin.value) {
          return h(Login, {
            onLoginSuccess: handleLoginSuccess
          })
        }
        return null
      },
      'nav-bar-content-after': () => {
        const isAuthenticated = ref(false)

        // 在浏览器环境中检查登录状态
        if (inBrowser) {
          isAuthenticated.value = authManager.isAuthenticated()
        }

        if (isAuthenticated.value) {
          return h(LogoutButton, {
            onLogoutSuccess: () => {
              // 重新加载页面以更新登录状态
              if (inBrowser) {
                window.location.reload()
              }
            }
          })
        }
        return null
      }
    })
  },
  enhanceApp({ app, router, siteData }) {
    // 注册全局组件
    app.component('BlogList', BlogList)
    app.component('BusuanziStats', BusuanziStats)
    app.component('ArticleMeta', ArticleMeta)
    app.component('Wlink', Wlink)
    app.component('ImageViewer', ImageViewer)
    
    // 确保busuanzi在浏览器环境中可用
    if (inBrowser) {
      // 将busuanzi挂载到window对象
      window.busuanzi = busuanzi
      
      router.onAfterRouteChanged = () => {
        if (window.busuanzi) {
          window.busuanzi.fetch()
        }
      }
    }
  }
}
