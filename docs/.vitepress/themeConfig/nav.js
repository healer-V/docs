export const nav = [
  // { text: '首页', link: '/' },
  { text: '博客', link: '/blog-list/' },
  {
    text: '前端',
    items: [
      {
        text: '基础',
        items: [
          { text: 'HTML', link: '/frontend/01-html/01-overview' },
          { text: 'CSS', link: '/frontend/02-css/01-overview' },
          { text: 'JavaScript', link: '/frontend/03-javascript/01-dataType' },
          { text: 'ECMAScript', link: '/frontend/04-ecmascript/01-variable' },
          { text: 'TypeScript', link: '/frontend/05-typescript/01-typescript' },
        ],
      },
      {
        text: '框架',
        items: [
          { text: 'Vue 2', link: '/frontend/06-vue2/01-01-introduction' },
          { text: 'Vue 3', link: '/frontend/07-vue3/01-design-philosophy' },
          { text: 'React 16', link: '/frontend/08-react16/01-react16' },
          { text: 'React 18', link: '/frontend/09-react18/01-react18' },
        ],
      },
      {
        text: '工程化',
        items: [
          { text: 'Vite', link: '/engineering/02-vite/01-vite' },
        ],
      },
      {
        text: '微前端',
        items: [
          { text: 'Qiankun', link: '/microfrontend/01-qiankun/01-overview' },
        ],
      },
    ],
  },
  {
    text: '后端',
    items: [
      // 基础
      {
        text: '语言',
        items: [
          { text: 'Node.js', link: '/backend/01-nodejs/01-nodejs' },
          { text: 'Java', link: '/backend/02-express/01-express' },
          { text: 'Python', link: '/backend/03-nestjs/01-nestjs' },
          { text: 'Golang', link: '/backend/04-django/01-django' },
        ],
      },   
      // 框架
      {
        text: '框架',
        items: [
          { text: 'Express', link: '/backend/02-express/01-express' },
          { text: 'NestJS', link: '/backend/03-nestjs/01-nestjs' },
          { text: 'Spring Boot', link: '/backend/04-springboot/01-spring-boot' },
          { text: 'Django', link: '/backend/04-django/01-django' },
        ],
      },
      // 数据库
      {
        text: '数据库',
        items: [
          { text: 'MySQL', link: '/backend/05-mysql/01-mysql' },
          { text: 'Redis', link: '/backend/06-redis/01-redis' },
          { text: 'MongoDB', link: '/backend/07-mongodb/01-mongodb' },
          { text: 'PostgreSQL', link: '/backend/08-postgresql/01-postgresql' },
        ],
      }
     
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
    text: '运维',
    items: [
      { text: 'Linux', link: '/operation/00-linux/index' },
      { text: 'Shell', link: '/operation/01-shell/index' },
      { text: 'Docker', link: '/operation/05-docker/index' },
      { text: 'Kubernetes', link: '/operation/04-k8s/index' },
      { text: 'Jenkins', link: '/operation/02-jenkins/index' },
      { text: 'CI/CD', link: '/operation/03-cicd/index' },
      { text: 'Nginx', link: '/operation/06-nginx/01-overview' },
    ],
  },
  {
    text: 'Web3',
    items: [
      { text: 'Web3.js', link: '/web3/01-web3.0/01-overview' },
      { text: 'Solidity', link: '/web3/02-solidity/01-overview' },
      { text: 'Ethereum', link: '/web3/03-ethereum/01-overview' },
    ],
  },
  { text: '面试题', link: '/interview/index' },
  {
    text: '实践',
    items: [
      { text: '组件封装', link: '/skill/01-Vue组件封装' },
      { text: '项目实践', link: '/practices/index' },
      { text: '项目难点', link: '/project/index' },
    ],
  },
  {
    text: '关于',
    items: [
      { text: '学习文档', link: '/about/' },
      { text: '友情链接', link: '/links' },
      { text: '随记', link: '/diary/index' },
    ],
  },
]
