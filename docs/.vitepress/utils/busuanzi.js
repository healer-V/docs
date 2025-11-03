// Busuanzi 配置和工具函数
export const busuanziConfig = {
  // 是否启用busuanzi
  enabled: true,
  
  // 统计类型配置
  stats: {
    // 站点访问量
    sitePv: {
      enabled: true,
      selector: '#busuanzi_value_site_pv',
      fallback: '加载中...'
    },
    
    // 站点访客数
    siteUv: {
      enabled: true,
      selector: '#busuanzi_value_site_uv',
      fallback: '加载中...'
    },
    
    // 页面访问量
    pagePv: {
      enabled: true,
      selector: '#busuanzi_value_page_pv',
      fallback: '加载中...'
    },
    
    // 在线人数
    siteOnline: {
      enabled: true,
      selector: '#busuanzi_value_site_online',
      fallback: '加载中...'
    }
  },
  
  // 刷新间隔（毫秒）
  refreshInterval: 30000,
  
  // 超时时间（毫秒）
  timeout: 10000,
  
  // 错误重试次数
  retryCount: 3,
  
  // 是否显示加载状态
  showLoading: true,
  
  // 是否显示错误状态
  showError: true
}

// 初始化busuanzi
export const initBusuanzi = () => {
  if (typeof window === 'undefined' || !busuanziConfig.enabled) {
    return false
  }
  
  try {
    // 检查busuanzi是否已加载
    if (!window.busuanzi) {
      console.warn('Busuanzi not loaded')
      return false
    }
    
    // 初始化busuanzi
    window.busuanzi.fetch()
    
    // 设置定时刷新
    if (busuanziConfig.refreshInterval > 0) {
      const interval = setInterval(() => {
        if (window.busuanzi) {
          window.busuanzi.fetch()
        }
      }, busuanziConfig.refreshInterval)
      
      // 保存interval ID
      window.busuanziInterval = interval
    }
    
    console.log('Busuanzi initialized successfully')
    return true
  } catch (error) {
    console.error('Failed to initialize busuanzi:', error)
    return false
  }
}

// 清理busuanzi
export const cleanupBusuanzi = () => {
  if (typeof window !== 'undefined' && window.busuanziInterval) {
    clearInterval(window.busuanziInterval)
    window.busuanziInterval = null
  }
}

// 获取统计数据的工具函数
export const getBusuanziStats = () => {
  if (typeof window === 'undefined' || !window.busuanzi) {
    return null
  }
  
  const stats = {}
  
  // 获取站点访问量
  const sitePvElement = document.querySelector(busuanziConfig.stats.sitePv.selector)
  if (sitePvElement) {
    stats.sitePv = sitePvElement.textContent || '0'
  }
  
  // 获取站点访客数
  const siteUvElement = document.querySelector(busuanziConfig.stats.siteUv.selector)
  if (siteUvElement) {
    stats.siteUv = siteUvElement.textContent || '0'
  }
  
  // 获取页面访问量
  const pagePvElement = document.querySelector(busuanziConfig.stats.pagePv.selector)
  if (pagePvElement) {
    stats.pagePv = pagePvElement.textContent || '0'
  }
  
  // 获取在线人数
  const siteOnlineElement = document.querySelector(busuanziConfig.stats.siteOnline.selector)
  if (siteOnlineElement) {
    stats.siteOnline = siteOnlineElement.textContent || '0'
  }
  
  return stats
}

// 格式化数字显示
export const formatNumber = (num) => {
  if (!num || num === '0' || num === '加载中...') {
    return num
  }
  
  const number = parseInt(num.replace(/,/g, ''))
  
  if (number >= 1000000) {
    return (number / 1000000).toFixed(1) + 'M'
  } else if (number >= 1000) {
    return (number / 1000).toFixed(1) + 'K'
  }
  
  return number.toString()
}

// 检查busuanzi是否可用
export const isBusuanziAvailable = () => {
  return typeof window !== 'undefined' && window.busuanzi
}

// 等待busuanzi加载完成
export const waitForBusuanzi = (timeout = 10000) => {
  return new Promise((resolve, reject) => {
    if (isBusuanziAvailable()) {
      resolve(true)
      return
    }
    
    // 检查是否在浏览器环境中
    if (typeof window === 'undefined') {
      reject(new Error('Not in browser environment'))
      return
    }
    
    const startTime = Date.now()
    const checkInterval = setInterval(() => {
      if (isBusuanziAvailable()) {
        clearInterval(checkInterval)
        resolve(true)
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval)
        reject(new Error('Busuanzi load timeout'))
      }
    }, 100)
  })
}

// 手动刷新统计数据
export const refreshBusuanziStats = () => {
  if (isBusuanziAvailable()) {
    window.busuanzi.fetch()
    return true
  }
  return false
}

// 设置统计数据的fallback值
export const setBusuanziFallback = (selector, value) => {
  if (typeof window === 'undefined') return
  
  const element = document.querySelector(selector)
  if (element) {
    element.textContent = value
  }
}

// 监听busuanzi数据更新
export const onBusuanziUpdate = (callback) => {
  if (typeof window === 'undefined') return
  
  // 监听DOM变化
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        const target = mutation.target
        if (target.id && target.id.includes('busuanzi_value')) {
          callback(getBusuanziStats())
        }
      }
    })
  })
  
  // 开始观察
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  })
  
  return observer
}
