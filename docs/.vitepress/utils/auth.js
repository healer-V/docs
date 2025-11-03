// 登录状态管理工具
export class AuthManager {
  constructor() {
    this.authKey = 'vitepress_auth'
    this.authTimeKey = 'vitepress_auth_time'
    this.sessionTimeout = 24 * 60 * 60 * 1000 // 24小时
  }

  // 检查是否已登录
  isAuthenticated() {
    if (typeof window === 'undefined') return false
    
    const authStatus = localStorage.getItem(this.authKey)
    const authTime = localStorage.getItem(this.authTimeKey)
    
    if (!authStatus || !authTime) return false
    
    // 检查会话是否过期
    const now = Date.now()
    const loginTime = parseInt(authTime)
    
    if (now - loginTime > this.sessionTimeout) {
      this.logout()
      return false
    }
    
    return authStatus === 'true'
  }

  // 登录
  login() {
    if (typeof window === 'undefined') return
    
    localStorage.setItem(this.authKey, 'true')
    localStorage.setItem(this.authTimeKey, Date.now().toString())
  }

  // 登出
  logout() {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem(this.authKey)
    localStorage.removeItem(this.authTimeKey)
  }

  // 验证登录凭据
  validateCredentials(username, password) {
    return username === 'Jeffrey' && password === 'Jeffrey_Lucky121500'
  }
}

// 创建单例实例
export const authManager = new AuthManager()
