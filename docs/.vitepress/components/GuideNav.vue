<template>
  <div class="guide-nav">

    <!-- Header -->
    <div class="guide-header">
      <div class="header-badge">KNOWLEDGE MAP</div>
      <h1 class="guide-title">选择你的学习方向</h1>
      <p class="guide-desc">从基础到进阶，系统化的前端全栈知识体系</p>
      <div class="header-line"></div>
    </div>

    <!-- Sections -->
    <div v-for="section in sections" :key="section.title" class="guide-section">
      <div class="section-header">
        <span class="section-icon">{{ section.icon }}</span>
        <h2 class="section-title">{{ section.title }}</h2>
        <span class="section-count">{{ section.items.length }}</span>
      </div>
      <div class="section-grid">
        <a
          v-for="item in section.items"
          :key="item.title"
          :href="item.link"
          class="guide-card"
        >
          <div class="card-inner">
            <span class="card-tag">{{ item.tag }}</span>
            <h3 class="card-title">{{ item.title }}</h3>
            <p class="card-desc">{{ item.desc }}</p>
            <div class="card-footer">
              <span class="card-arrow">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </div>
          </div>
        </a>
      </div>
    </div>

    <!-- Interview CTA -->
    <div class="guide-interview">
      <div class="interview-glow"></div>
      <div class="interview-inner">
        <div class="interview-text">
          <div class="interview-badge">INTERVIEW</div>
          <h2 class="interview-title">面试题库</h2>
          <p class="interview-desc">涵盖基础、框架、工程化、跨端、网络、浏览器、手写题等高频考点</p>
        </div>
        <a href="/docs/interview/" class="interview-btn">
          <span>进入题库</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>
    </div>

  </div>
</template>

<script setup>
const sections = [
  {
    icon: '🧱',
    title: '前端基础',
    items: [
      { tag: 'HTML', title: 'HTML', desc: '页面结构与语义化标签', link: '/docs/frontend/01-html/01-overview' },
      { tag: 'CSS', title: 'CSS', desc: '选择器、布局、动画、响应式', link: '/docs/frontend/02-css/01-overview' },
      { tag: 'JS', title: 'JavaScript', desc: '数据类型、函数、异步、DOM', link: '/docs/frontend/03-javascript/01-dataType' },
      { tag: 'ES6+', title: 'ECMAScript', desc: 'ES6+ 新特性全覆盖', link: '/docs/frontend/04-ecmascript/01-variable' },
      { tag: 'TS', title: 'TypeScript', desc: '类型系统、泛型、装饰器', link: '/docs/frontend/05-typescript/01-typescript' },
    ]
  },
  {
    icon: '⚡',
    title: '主流框架',
    items: [
      { tag: 'Vue 2', title: 'Vue 2', desc: '选项式 API、Vuex、Vue Router', link: '/docs/frontend/06-vue2/01-01-introduction' },
      { tag: 'Vue 3', title: 'Vue 3', desc: 'Composition API、Pinia、Vite', link: '/docs/frontend/07-vue3/01-design-philosophy' },
      { tag: 'React 16', title: 'React 16', desc: 'JSX、生命周期、Hooks 基础', link: '/docs/frontend/08-react16/01-react16' },
      { tag: 'React 18', title: 'React 18', desc: '并发特性、Suspense、新 Hooks', link: '/docs/frontend/09-react18/01-react18' },
    ]
  },
  {
    icon: '🔧',
    title: '工程化 & 微前端',
    items: [
      { tag: 'Vite', title: 'Vite', desc: '原理剖析、插件开发、打包优化', link: '/docs/engineering/02-vite/01-vite' },
      { tag: 'Qiankun', title: 'Qiankun', desc: '主应用配置、沙箱机制、应用通信', link: '/docs/microfrontend/01-qiankun/01-overview' },
    ]
  },
  {
    icon: '📱',
    title: '跨端开发',
    items: [
      { tag: 'RN', title: 'React Native', desc: '组件系统、导航、原生模块', link: '/docs/crossend/01-reactnative/index' },
      { tag: 'Flutter', title: 'Flutter', desc: 'Widget、布局、动画、状态管理', link: '/docs/crossend/02-flutter/index' },
      { tag: 'HarmonyOS', title: 'HarmonyOS', desc: 'ArkUI、页面路由、权限管理', link: '/docs/crossend/03-harmonyos/index' },
      { tag: 'Electron', title: 'Electron', desc: '主进程、IPC、打包发布', link: '/docs/crossend/04-electron/index' },
    ]
  },
  {
    icon: '🖥️',
    title: '后端 & Node',
    items: [
      { tag: 'Node.js', title: 'Node.js', desc: '模块系统、事件循环、异步编程', link: '/docs/backend/01-nodejs/01-nodejs' },
      { tag: 'Express', title: 'Express', desc: '路由、中间件、API 开发', link: '/docs/backend/02-express/01-express' },
      { tag: 'NestJS', title: 'NestJS', desc: '模块、控制器、守卫、微服务', link: '/docs/backend/03-nestjs/01-nestjs' },
    ]
  },
  {
    icon: '🚀',
    title: '运维 & DevOps',
    items: [
      { tag: 'Shell', title: 'Shell', desc: '脚本基础、流程控制、文本处理', link: '/docs/operation/01-shell/01-overview' },
      { tag: 'Docker', title: 'Docker', desc: '镜像、容器、Compose', link: '/docs/operation/05-docker/01-overview' },
      { tag: 'K8s', title: 'Kubernetes', desc: 'Pod、Service、Deployment', link: '/docs/operation/04-k8s/01-overview' },
      { tag: 'Jenkins', title: 'Jenkins', desc: 'Pipeline、插件、集成 Git', link: '/docs/operation/02-jenkins/01-overview' },
      { tag: 'CI/CD', title: 'CI/CD', desc: 'GitLab CI、GitHub Actions', link: '/docs/operation/03-cicd/01-overview' },
      { tag: 'Nginx', title: 'Nginx', desc: '反向代理、负载均衡', link: '/docs/operation/06-nginx/01-overview' },
    ]
  },
  {
    icon: '⛓️',
    title: 'Web3',
    items: [
      { tag: 'Web3.js', title: 'Web3.js', desc: '连接区块链、账户、合约交互', link: '/docs/web3/01-web3.0/01-overview' },
      { tag: 'Solidity', title: 'Solidity', desc: '智能合约开发、数据类型、函数', link: '/docs/web3/02-solidity/01-overview' },
      { tag: 'Ethereum', title: 'Ethereum', desc: '账户系统、交易、合约部署', link: '/docs/web3/03-ethereum/01-overview' },
    ]
  },
]
</script>

<style scoped>
/* ── Container ── */
.guide-nav {
  max-width: 980px;
  margin: 0 auto;
  padding: 4rem 2rem 6rem;
}

/* ── Header ── */
.guide-header {
  margin-bottom: 4rem;
  text-align: center;
}

.header-badge {
  display: inline-block;
  font-size: 0.68rem;
  letter-spacing: 0.2em;
  color: var(--accent, #10b981);
  font-weight: 600;
  margin-bottom: 1rem;
  padding: 4px 14px;
  background: var(--accent-soft, rgba(16, 185, 129, 0.1));
  border-radius: 20px;
  border: 1px solid rgba(16, 185, 129, 0.15);
}

.guide-title {
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  margin: 0 0 0.75rem;
  color: var(--vp-c-text-1);
  line-height: 1.15;
}

.guide-desc {
  font-size: 1rem;
  font-weight: 400;
  color: var(--vp-c-text-2);
  margin: 0 auto;
  line-height: 1.6;
  max-width: 420px;
}

.header-line {
  width: 48px;
  height: 3px;
  background: linear-gradient(90deg, var(--accent, #10b981), transparent);
  border-radius: 2px;
  margin: 2rem auto 0;
}

/* ── Section ── */
.guide-section {
  margin-bottom: 3rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.section-icon {
  font-size: 1rem;
  line-height: 1;
}

.section-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0;
  color: var(--vp-c-text-1);
}

.section-count {
  margin-left: auto;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--accent, #10b981);
  background: var(--accent-soft, rgba(16, 185, 129, 0.1));
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

/* ── Grid ── */
.section-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

/* ── Card ── */
.guide-card {
  display: block;
  text-decoration: none !important;
  color: inherit;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
}

.card-inner {
  display: flex;
  flex-direction: column;
  padding: 1.1rem 1.2rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  height: 100%;
  transition: border-color 0.3s ease;
}

.guide-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06);
}

.guide-card:hover .card-inner {
  border-color: var(--accent, #10b981);
}

.card-tag {
  align-self: flex-start;
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent, #10b981);
  background: var(--accent-soft, rgba(16, 185, 129, 0.1));
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 0.6rem;
}

.card-title {
  font-family: 'Outfit', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 0.3rem;
  color: var(--vp-c-text-1);
  letter-spacing: -0.01em;
}

.card-desc {
  font-size: 0.78rem;
  font-weight: 400;
  color: var(--vp-c-text-2);
  margin: 0;
  line-height: 1.5;
  flex: 1;
}

.card-footer {
  margin-top: 0.6rem;
  display: flex;
  justify-content: flex-end;
}

.card-arrow {
  color: var(--vp-c-text-3);
  opacity: 0;
  transform: translateX(-6px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
}

.guide-card:hover .card-arrow {
  opacity: 1;
  transform: translateX(0);
  color: var(--accent, #10b981);
}

/* ── Interview CTA ── */
.guide-interview {
  margin-top: 4rem;
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

.interview-glow {
  position: absolute;
  top: -50%;
  right: -20%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, var(--accent-glow, rgba(16,185,129,0.15)) 0%, transparent 70%);
  pointer-events: none;
}

.interview-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2.5rem 2.5rem;
  gap: 2rem;
  position: relative;
  z-index: 1;
}

.interview-badge {
  display: inline-block;
  font-size: 0.62rem;
  letter-spacing: 0.2em;
  color: var(--accent, #10b981);
  font-weight: 600;
  margin-bottom: 0.5rem;
  padding: 3px 10px;
  background: var(--accent-soft);
  border-radius: 4px;
}

.interview-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 0.5rem;
  color: var(--vp-c-text-1);
}

.interview-desc {
  font-size: 0.88rem;
  font-weight: 400;
  color: var(--vp-c-text-2);
  margin: 0;
  line-height: 1.6;
  max-width: 480px;
}

.interview-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: var(--accent, #10b981);
  color: #fff !important;
  text-decoration: none !important;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.interview-btn:hover {
  background: var(--accent-hover, #059669);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px var(--accent-glow, rgba(16,185,129,0.25));
}

.interview-btn svg {
  transition: transform 0.3s ease;
}

.interview-btn:hover svg {
  transform: translateX(3px);
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .guide-nav { padding: 2rem 1.25rem 4rem; }
  .guide-header { margin-bottom: 3rem; }
  .section-grid { grid-template-columns: 1fr 1fr; }
  .interview-inner { flex-direction: column; align-items: flex-start; }
  .interview-btn { width: 100%; text-align: center; justify-content: center; }
}

@media (max-width: 400px) {
  .section-grid { grid-template-columns: 1fr; }
}
</style>
