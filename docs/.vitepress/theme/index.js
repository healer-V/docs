// https://vitepress.dev/guide/custom-theme
import { h, ref, defineComponent } from 'vue'
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
import GuideNav from '../components/GuideNav.vue'
import HomeBento from '../components/HomeBento.vue'
import AboutPage from '../components/AboutPage.vue'
import { authManager } from '../utils/auth.js'
import './style.css';
import './style/index.css';
// import './custom.css';

// 登录守卫组件，响应式状态在组件内部管理
const LoginGuard = defineComponent({
  setup() {
    const showLogin = ref(inBrowser ? !authManager.isAuthenticated() : false)
    const handleLoginSuccess = () => {
      showLogin.value = false
    }
    return () => showLogin.value
      ? h(Login, { onLoginSuccess: handleLoginSuccess })
      : null
  }
})

// 导航栏登出按钮组件
const NavLogout = defineComponent({
  setup() {
    const isAuthenticated = ref(inBrowser ? authManager.isAuthenticated() : false)
    return () => isAuthenticated.value
      ? h(LogoutButton, {
          onLogoutSuccess: () => {
            if (inBrowser) window.location.reload()
          }
        })
      : null
  }
})

/** @type {import('vitepress').Theme} */

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      'layout-top': () => h(LoginGuard),
      'nav-bar-content-after': () => h(NavLogout),
    })
  },
  enhanceApp({ app, router, siteData }) {
    // 注册全局组件
    app.component('BlogList', BlogList)
    app.component('BusuanziStats', BusuanziStats)
    app.component('ArticleMeta', ArticleMeta)
    app.component('Wlink', Wlink)
    app.component('ImageViewer', ImageViewer)
    app.component('GuideNav', GuideNav)
    app.component('HomeBento', HomeBento)
    app.component('AboutPage', AboutPage)
    
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
