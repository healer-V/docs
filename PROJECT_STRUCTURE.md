# 项目目录结构规范

## 📁 目录结构

```
docs/
├── .vitepress/              # VitePress 配置
│   ├── config.mjs          # 主配置文件
│   ├── themeConfig/        # 主题配置
│   │   ├── nav.js         # 导航栏配置
│   │   └── sidebar.js     # 侧边栏配置
│   ├── components/         # 自定义组件
│   ├── theme/             # 主题定制
│   └── utils/             # 工具函数
│
├── frontend/               # 前端技术栈
│   ├── 01-html/           # HTML 基础
│   ├── 02-css/            # CSS 基础
│   ├── 03-javascript/     # JavaScript 基础
│   ├── 04-ecmascript/     # ES6+ 特性
│   ├── 05-typescript/     # TypeScript
│   ├── 06-vue2/           # Vue 2
│   ├── 07-vue3/           # Vue 3
│   ├── 08-react16/        # React 16
│   └── 09-react18/        # React 18
│
├── backend/                # 后端技术栈
│   ├── 01-nodejs/         # Node.js
│   ├── 02-express/        # Express
│   └── 03-nestjs/         # NestJS
│
├── crossend/               # 跨端开发
│   ├── 01-reactnative/    # React Native
│   ├── 02-flutter/        # Flutter
│   ├── 03-harmonyos/      # HarmonyOS
│   └── 04-electron/       # Electron
│
├── engineering/            # 前端工程化
│   └── 02-vite/           # Vite
│
├── microfrontend/          # 微前端
│   └── 01-qiankun/        # Qiankun
│
├── operation/              # 运维部署
│   ├── 01-shell/          # Shell 脚本
│   ├── 02-jenkins/        # Jenkins
│   ├── 03-cicd/           # CI/CD
│   ├── 04-k8s/            # Kubernetes
│   ├── 05-docker/         # Docker
│   └── 06-nginx/          # Nginx
│
├── web3/                   # Web3 技术
│   ├── 01-web3.0/         # Web3.js
│   ├── 02-solidity/       # Solidity
│   └── 03-ethereum/       # Ethereum
│
├── interview/              # 面试题库
├── practices/              # 项目实践
├── project/                # 项目难点
├── skill/                  # 技能封装
├── diary/                  # 学习随记
├── about/                  # 关于页面
│
├── public/                 # 静态资源
├── index.md               # 首页
└── links.md               # 友情链接
```

## 📝 命名规范

### 目录命名
- 使用小写字母 + 连字符：`01-html`, `02-css`
- 数字前缀表示顺序：`01-`, `02-`, `03-`
- 多单词使用连字符：`react-native`, `harmony-os`

### 文件命名
- Markdown 文件：`01-overview.md`, `02-basic-syntax.md`
- 配置文件：`config.mjs`, `nav.js`, `sidebar.js`
- 组件文件：`ArticleMeta.vue`, `BlogList.vue`

## 🎯 路由规范

### Nav 路由
- 首页：`/`
- 分类首页：`/frontend/01-html/01-overview`
- 详情页：`/frontend/01-html/02-tag`

### Sidebar 路由
- 每个技术栈独立 sidebar
- 路径格式：`/frontend/01-html/`
- 链接格式：`/frontend/01-html/01-overview`

## ✅ 最佳实践

1. **一级目录** = 技术领域（frontend, backend, crossend）
2. **二级目录** = 具体技术（01-html, 02-css）
3. **三级文件** = 知识点（01-overview.md, 02-tag.md）
4. **Nav 分组** = 按领域分类，最多三级
5. **Sidebar 分组** = 按章节分类，支持折叠
6. **首页 Hero** = 展示核心技术栈入口

## 🚫 避免的问题

- ❌ 目录拼写错误（elctron → electron）
- ❌ 路径不一致（nav 和 sidebar 路径不匹配）
- ❌ 重复内容（articles/ 和 frontend/ 重叠）
- ❌ 无效链接（指向不存在的文件）
- ❌ 命名不规范（大小写混用）
