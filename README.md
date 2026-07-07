# Xianling Docs

> 前端全栈学习笔记 - 系统化的技术文档

## 📚 技术栈覆盖

- **前端基础**: HTML / CSS / JavaScript / TypeScript
- **前端框架**: Vue 2/3 · React 16/18 · 微前端
- **工程化**: Vite · Webpack
- **跨端开发**: React Native · Flutter · HarmonyOS · Electron
- **后端开发**: Node.js · Express · NestJS · Java · Python
- **运维部署**: Docker · Kubernetes · Jenkins · Nginx · CI/CD
- **Web3**: Solidity · Ethereum · Web3.js

## 🚀 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

## 📁 项目结构

```
docs/
├── frontend/        # 前端技术栈
├── backend/         # 后端技术栈
├── crossend/        # 跨端开发
├── engineering/     # 前端工程化
├── microfrontend/   # 微前端
├── operation/       # 运维部署
├── web3/           # Web3 技术
├── interview/      # 面试题库
└── .vitepress/     # VitePress 配置
```

## 🎯 特性

- ✅ 系统化的知识体系
- ✅ 清晰的目录结构
- ✅ 完善的导航系统
- ✅ 响应式设计
- ✅ 全文搜索
- ✅ 暗色模式

## 📝 文档规范

- 目录命名：小写 + 连字符（`01-html`, `02-css`）
- 文件命名：数字前缀 + 描述（`01-overview.md`）
- 路由规范：`/frontend/01-html/01-overview`

## 🔀 Git 提交流程

当前 `main` 分支默认绑定 GitHub 远程分支 `origin/main`。因此在 VS Code 编辑器中点击“同步更改 / 推送”时，会默认推送到 GitHub；如需同步到 Gitee，需要手动执行 Gitee 推送命令。

| 平台 | Remote 名称 | 仓库地址 | 推送方式 |
|------|-------------|----------|----------|
| GitHub | `origin` | `https://github.com/healer-V/docs.git` | VS Code 默认推送 / `git push` |
| Gitee | `gitee` | `https://gitee.com/xianling-coding/portal-knowdocs-web.git` | 手动执行 `git push gitee main` |

```bash
# 查看当前改动
git status

# 添加需要提交的文件
git add .

# 提交改动
git commit -m "docs: 更新文档内容"

# 推送到 GitHub（main 已绑定 origin/main，VS Code 默认推送也会走这里）
git push
```

如果本地还没有配置 Gitee 远程仓库，先执行一次：

```bash
git remote add gitee https://gitee.com/xianling-coding/portal-knowdocs-web.git
```

同步到 Gitee 时，手动执行：

```bash
git push gitee main
```

如果本地 `main` 分支尚未绑定 GitHub 远程分支，可执行一次：

```bash
git push -u origin main
```

## 🔗 相关链接

- [VitePress 官方文档](https://vitepress.dev/)
- [Vue 3 官方文档](https://cn.vuejs.org/)
- [React 官方文档](https://react.dev/)

## 📄 License

MIT License
