<template>
  <div class="guide-nav">

    <!-- 页头 -->
    <div class="guide-header">
      <p class="guide-label">KNOWLEDGE MAP</p>
      <h1 class="guide-title">选择你的学习方向</h1>
      <p class="guide-desc">从基础到进阶，系统化的前端全栈知识体系</p>
    </div>

    <!-- 各模块 -->
    <div v-for="section in sections" :key="section.title" class="guide-section">
      <div class="section-header">
        <span class="section-icon">{{ section.icon }}</span>
        <h2 class="section-title">{{ section.title }}</h2>
        <span class="section-count">{{ section.items.length }} 个模块</span>
      </div>
      <div class="section-grid">
        <a
          v-for="item in section.items"
          :key="item.title"
          :href="item.link"
          class="guide-card"
        >
          <div class="card-top">
            <span class="card-tag">{{ item.tag }}</span>
          </div>
          <h3 class="card-title">{{ item.title }}</h3>
          <p class="card-desc">{{ item.desc }}</p>
          <div class="card-arrow">→</div>
        </a>
      </div>
    </div>

    <!-- 面试题入口 -->
    <div class="guide-interview">
      <div class="interview-inner">
        <div class="interview-text">
          <p class="interview-label">INTERVIEW</p>
          <h2 class="interview-title">面试题库</h2>
          <p class="interview-desc">涵盖基础、框架、工程化、跨端、网络、浏览器、手写题等高频考点</p>
        </div>
        <a href="/docs/interview/" class="interview-btn">进入题库 →</a>
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
/* ── 容器 ── */
.guide-nav {
  max-width: 960px;
  margin: 0 auto;
  padding: 4rem 2rem 6rem;
}

/* ── 页头 ── */
.guide-header {
  margin-bottom: 4rem;
  border-left: 2px solid var(--accent, #e8a045);
  padding-left: 1.5rem;
}

.guide-label {
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  color: var(--accent, #e8a045);
  font-weight: 500;
  margin: 0 0 0.75rem;
}

.guide-title {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 400;
  letter-spacing: -0.03em;
  margin: 0 0 0.75rem;
  color: var(--vp-c-text-1);
  line-height: 1.15;
}

.guide-desc {
  font-size: 0.95rem;
  font-weight: 300;
  color: var(--vp-c-text-2);
  margin: 0;
  line-height: 1.6;
}

/* ── Section ── */
.guide-section {
  margin-bottom: 3.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.section-icon {
  font-size: 1rem;
}

.section-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  margin: 0;
  color: var(--vp-c-text-1);
}

.section-count {
  margin-left: auto;
  font-size: 0.72rem;
  color: var(--vp-c-text-3);
  letter-spacing: 0.05em;
}

/* ── Grid ── */
.section-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

/* ── Card ── */
.guide-card {
  display: flex;
  flex-direction: column;
  padding: 1.1rem 1.25rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  text-decoration: none !important;
  color: inherit;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.guide-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 100%;
  background: var(--accent, #e8a045);
  transform: scaleY(0);
  transform-origin: bottom;
  transition: transform 0.2s ease;
}

.guide-card:hover {
  border-color: var(--accent, #e8a045);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0,0,0,0.06);
}

.guide-card:hover::before {
  transform: scaleY(1);
}

.card-top {
  margin-bottom: 0.5rem;
}

.card-tag {
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent, #e8a045);
  background: var(--accent-soft, rgba(232,160,69,0.1));
  padding: 2px 6px;
  border-radius: 2px;
}

.card-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  margin: 0 0 0.35rem;
  color: var(--vp-c-text-1);
  letter-spacing: -0.01em;
}

.card-desc {
  font-size: 0.78rem;
  font-weight: 300;
  color: var(--vp-c-text-2);
  margin: 0;
  line-height: 1.5;
  flex: 1;
}

.card-arrow {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  transition: all 0.2s ease;
  opacity: 0;
  transform: translateX(-4px);
}

.guide-card:hover .card-arrow {
  opacity: 1;
  transform: translateX(0);
  color: var(--accent, #e8a045);
}

/* ── 面试题入口 ── */
.guide-interview {
  margin-top: 4rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
}

.interview-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem 2.5rem;
  gap: 2rem;
}

.interview-label {
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  color: var(--accent, #e8a045);
  font-weight: 500;
  margin: 0 0 0.5rem;
}

.interview-title {
  font-family: 'DM Serif Display', serif;
  font-size: 1.5rem;
  font-weight: 400;
  letter-spacing: -0.02em;
  margin: 0 0 0.5rem;
  color: var(--vp-c-text-1);
}

.interview-desc {
  font-size: 0.85rem;
  font-weight: 300;
  color: var(--vp-c-text-2);
  margin: 0;
  line-height: 1.6;
  max-width: 480px;
}

.interview-btn {
  flex-shrink: 0;
  display: inline-block;
  padding: 10px 24px;
  background: var(--vp-c-brand-1);
  color: #fff !important;
  text-decoration: none !important;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 400;
  letter-spacing: 0.03em;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.interview-btn:hover {
  background: var(--vp-c-brand-3);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(26,26,46,0.15);
}

/* ── 响应式 ── */
@media (max-width: 640px) {
  .guide-nav { padding: 2rem 1.25rem 4rem; }
  .section-grid { grid-template-columns: 1fr 1fr; }
  .interview-inner { flex-direction: column; align-items: flex-start; }
  .interview-btn { width: 100%; text-align: center; }
}

@media (max-width: 400px) {
  .section-grid { grid-template-columns: 1fr; }
}
</style>
