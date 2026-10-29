import { filterNavigationItems } from './navigation.js'
import { aiNavigation } from './catalogs/ai.js'
import { operationNavigation } from './catalogs/operation.js'

export const rawNav = [
  {
    text: '前端',
    items: [
      {
        text: '基础',
        items: [
          { text: 'HTML', link: '/frontend/01-html/01-overview.md' },
          { text: 'CSS', link: '/frontend/02-css/01-css-foundation/01-css-and-browser.md' },
          { text: 'JavaScript', link: '/frontend/03-javascript/01-boundary' },
          { text: 'ECMAScript', link: '/frontend/04-ecmascript/01-variable' },
          { text: 'TypeScript', link: '/frontend/05-typescript/01-typescript' },
        ],
      },
      {
        text: '框架',
        items: [
          { text: 'Vue 2', link: '/frontend/06-vue2/01-01-introduction' },
          { text: 'Vue 3', link: '/frontend/07-vue3/01-design-philosophy' },
          { text: 'React 16.8', link: '/frontend/08-react16/01-core-syntax/01-react-elements-and-jsx' },
          { text: 'React 18', link: '/frontend/09-react18/01-01-changes-and-roadmap' },
        ],
      },
      {
        text: '工程化',
        items: [
          { text: 'Vite', link: '/engineering/02-vite/01-vite' },
          { text: 'Webpack', link: '/engineering/01-webpack/01-webpack' },
        ],
      },
      {
        text: '微前端',
        items: [
          { text: 'Qiankun', link: '/microfrontend/01-qiankun/index' },
        ],
      },
    ],
  },
  {
    text: '后端',
    items: [
      {
        text: '语言',
        items: [
          { text: 'Node.js', link: '/backend/01-nodejs/01-nodejs' },
          { text: 'Java', link: '/backend/04-java/01-language-foundation/01-overview' },
          { text: 'Python', link: '/backend/05-python/01-python' },
        ],
      },
      {
        text: '框架',
        items: [
          { text: 'Express', link: '/backend/02-express/01-express' },
          { text: 'NestJS', link: '/backend/03-nestjs/01-nestjs' },
          { text: 'Spring Boot', link: '/backend/07-springboot/01-spring-boot' },
        ],
      },
      {
        text: '数据与中间件',
        items: [
          { text: 'MySQL', link: '/backend/09-mysql/01-mysql' },
          { text: 'Redis', link: '/backend/10-redis/01-redis' },
          { text: 'PostgreSQL', link: '/backend/11-postgresql/01-postgresql' },
          { text: '消息队列', link: '/backend/12-message-queue/01-overview.md' },
          { text: '搜索引擎', link: '/backend/13-search-engine/01-overview.md' },
          { text: '对象存储', link: '/backend/14-object-storage/01-overview.md' },
        ],
      },
      {
        text: '工程治理',
        items: [
          { text: 'API 设计', link: '/backend/15-api-design/01-overview.md' },
          { text: '安全认证', link: '/backend/16-security-auth/01-overview.md' },
          { text: '测试工程', link: '/backend/17-testing-engineering/01-overview.md' },
          { text: '可观测性', link: '/backend/18-observability/01-overview.md' },
          { text: '稳定性治理', link: '/backend/19-reliability/01-overview.md' },
        ],
      },
      {
        text: '架构设计',
        items: [
          { text: '系统设计', link: '/backend/20-system-design/01-overview.md' },
          { text: 'DDD 与分层架构', link: '/backend/21-ddd-architecture/01-overview.md' },
          { text: '分布式系统', link: '/backend/22-distributed-systems/01-overview.md' },
          { text: '微服务架构', link: '/backend/06-microservices/01-foundation/01-overview.md' },
        ],
      },
    ],
  },
  {
    text: '跨端',
    items: [
      { text: 'React Native', link: '/crossend/01-reactnative/index' },
      { text: 'Flutter', link: '/crossend/02-flutter/index' },
      { text: 'HarmonyOS', link: '/crossend/03-harmonyos/index' },
      { text: 'Electron', link: '/crossend/04-electron/index' },
    ],
  },
  {
    text: 'DevOps',
    items: operationNavigation,
  },
  {
    text: 'Web3',
    items: [
      { text: '区块链基础', link: '/web3/01-blockchain/index.md' },
      { text: '以太坊与 EVM', link: '/web3/02-ethereum-protocol/index.md' },
      { text: 'Solidity', link: '/web3/03-solidity/index.md' },
      { text: '智能合约开发', link: '/web3/04-contract-engineering/index.md' },
      { text: '钱包与链交互', link: '/web3/05-chain-interaction/index.md' },
      { text: 'DApp 开发', link: '/web3/06-dapp/index.md' },
      { text: '链上数据', link: '/web3/07-onchain-data/index.md' },
      { text: '合约安全', link: '/web3/08-contract-security/index.md' },
      { text: 'DeFi', link: '/web3/09-defi/index.md' },
      { text: 'NFT 与 DAO', link: '/web3/10-nft-dao/index.md' },
    ],
  },
  {
    text: 'AI',
    items: aiNavigation,
  },
  {
    text: '实践',
    items: [
      {
        text: '题库',
        items: [
          { text: '前端题库', link: '/interview/index' },
          // { text: '前端题库', link: '/practice/01-frontend/index' },
          // { text: 'Java题库', link: '/practice/02-java/index' }
        ],
      },
      {  
        text: '项目',
        items: [
          // { text: '组件封装', link: '/practice/03-component/index' },
          // { text: '项目实践', link: '/practice/04-project/index' },
          // { text: '项目难点', link: '/practice/05-difficulty/index' }
          { text: '组件封装', link: '/skill/01-Vue组件封装' },
          { text: '项目实践', link: '/practices/index' },
          { text: '项目难点', link: '/project/index' }
        ],
      }
    ],
  },
  {
    text: '更多',
    items: [
      { text: '收藏', link: '/about/' },
      { text: '友链', link: '/links' },
      {
        text: '随记',
        items: [
          { text: 'VitePress 建站', link: '/articles/blog/01-vitepress.md' },
          { text: 'Markdown 语法指南', link: '/articles/tools/02-markdown-guide.md' },
          { text: 'VitePress 扩展语法', link: '/articles/blog/02-vitepress-markdown.md' },
        ],
      },
      {
        text: '年度',
        items: [
          { text: '2023', link: '/diary/index.md' },
          { text: '2024', link: 'diary/2024' },
          { text: '2025', link: 'diary/2025' },
        ],
      },
    ],
  },
]

export const nav = filterNavigationItems(rawNav)
