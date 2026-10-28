# Xianling Docs

帮助读者从 0 系统学习一门语言或技术的学习文档。

## 文档定位

围绕每门语言或技术建立循序渐进的知识体系，让读者从基础概念和基本用法起步，逐步理解运行机制、完成实际应用，并在已声明的模块范围内深入工程实践。文档同时支持学习后的复习查阅、长期积累与对外分享。

| 维度 | 定位 |
|------|------|
| 目标读者 | 对目标语言或技术零基础的学习者；语言入门不默认已经掌握其他编程语言 |
| 内容组织 | 按知识依赖由浅入深，先讲清必要概念与基本用法，再展开机制和进阶内容 |
| 讲解与示例 | 解释概念、原因、用法和边界；操作类内容提供可复现步骤、预期结果和常见错误处理 |
| 学习结果 | 能理解核心概念，独立完成基本任务，判断结果并处理常见错误 |

框架和工具等技术所依赖的外部基础，应明确要求深度并提供学习入口。例如学习 React 可以要求 JavaScript、HTML 和 CSS 基础，React 自身的 JSX、组件和数据流仍需从基础讲起。

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
pnpm docs:build:all
pnpm docs:assemble
pnpm docs:search

# 预览构建结果
pnpm docs:preview:assembled
```

## 📁 项目结构

```text
├── .vitepress/      # 网站配置、主题和导航
├── .claude/         # Claude Code 本地项目设置
├── content/         # 网站 Markdown、文档图片和公共资源
├── standards/       # 文档编写与验收规范
├── superpowers/     # 设计、蓝图、评审记录和实施计划
├── scripts/         # 构建、检查和维护脚本
├── tests/           # 自动化测试
├── .build/          # 自动生成的构建与验证产物
├── .github/         # CI 工作流
└── package.json     # 依赖和执行命令
```

`content/` 内保留前端、后端、运维、AI、Web3 等现有分类和章节层级。VitePress 从仓库根目录加载 `.vitepress/config.mjs`，通过 `srcDir: 'content'` 读取网站内容；`standards/` 与 `superpowers/` 不生成站点页面，也不进入站点搜索。文档图片随文章存放，公共静态资源位于 `content/public/`；网站访问路径仍使用 `/docs/`。

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
