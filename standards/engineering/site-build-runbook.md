---
title: "模块化文档站构建与发布运行手册"
tags:
  - VitePress
  - GitHub Actions
  - Pagefind
  - 运维手册
excerpt: "说明七构建单元文档站的本地构建、确定性合并、全站验收、GitHub Pages 切换、故障定位和回退流程。"
date: 2026-08-31
---

# 模块化文档站构建与发布运行手册

文档站使用同一份 Markdown 源码生成七个独立 VitePress 构建单元，再把通过摘要和路由检查的产物合并为一个 GitHub Pages Artifact。任何单元构建、路由、链接、搜索或浏览器门禁失败时，流水线都不会进入部署任务。

## 一、运行边界与版本

### 1. 工程边界

| 项目 | 当前约束 |
|------|----------|
| VitePress 项目根目录 | 仓库根目录，配置位于 `.vitepress/config.mjs` |
| VitePress 源目录 | `content/`，由 `srcDir` 指定 |
| 过程与规范文档 | 根目录中的 `superpowers/`、`standards/` 不参与构建与搜索 |
| 构建单元定义 | `scripts/docs/build-units.mjs` |
| 构建单元 | `portal`、`frontend`、`backend`、`operation`、`ai`、`web3`、`ecosystem` |
| 本地构建方式 | 七单元串行，避免共享 `.temp` 目录竞争 |
| CI 构建方式 | 七个独立 GitHub Actions Runner 执行 Matrix 构建 |
| 合并输出 | `.build/assembled/` |
| 部署 base | `/docs/` |
| 搜索输出 | `.build/assembled/pagefind/` |
| 发布方式 | GitHub 官方 Pages Artifact，不写入 `gh-pages` 分支 |
| 地址维护 | 当前站内引用随改名、移动和标题调整同步更新；旧地址和旧锚点直接作废，不生成兼容页或隐藏锚点 |

内容建设与工程发布是两个独立流程。新增文章仍需遵守模块蓝图、样板确认和内容质量门禁；本手册不授权批量生成正文，也不授权自动推送或切换生产设置。

### 2. 已验证版本

| 运行项 | 版本或范围 | 说明 |
|--------|------------|------|
| Node.js | 本地兼容当前项目；CI 固定 22 | 单元堆上限固定为 4 GiB |
| pnpm | 10.21.0 | CI 与生成锁文件的本地版本一致 |
| VitePress | 1.3.4 | 使用 `srcExclude`、`cacheDir` 和 `outDir` |
| Pagefind | 1.5.2 Extended | 强制使用 `zh` 中文索引 |
| Playwright | 1.62.1 | CI 安装 Chromium 及系统依赖 |

升级任一构建依赖后必须重新执行七单元全量构建。只有单元测试通过不能证明 VitePress 产物、Pagefind WASM 或浏览器行为仍然兼容。

## 二、本地完整构建

### 1. 安装与前置检查

在仓库根目录安装锁文件中的依赖：

```powershell
pnpm install --frozen-lockfile
```

首次执行浏览器回归时安装 Chromium：

```powershell
pnpm exec playwright install chromium
```

开始预览前检查 `4173` 端口和进程命令行，已有服务指向当前项目和 `.build/assembled` 时直接复用：

```powershell
Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue
Get-CimInstance Win32_Process |
  Where-Object { $_.CommandLine -match 'preview-site|vitepress.+preview' } |
  Select-Object ProcessId, CommandLine
```

### 2. 全链路命令

以下命令按顺序执行，任一步失败都应先处理对应报告，不能跳过后继续发布：

```powershell
pnpm docs:test
pnpm docs:navigation:backlog
pnpm docs:build:all
pnpm docs:assemble
pnpm docs:validate
pnpm docs:search
pnpm docs:validate -- --require-search
pnpm docs:e2e
pnpm docs:summary
```

完整成功链路应满足以下结果：

| 门禁 | 预期结果 |
|------|----------|
| 单元归属 | 每个 Markdown 恰好属于一个单元 |
| 单元构建 | 七个 `build-metrics.json` 的 `exitCode` 均为 `0` |
| 产物合并 | 路由无重复、同路径文件无摘要冲突 |
| 站点引用 | `issues` 为 `0` |
| 搜索覆盖 | `coveragePercent` 为 `100` |
| 浏览器回归 | 桌面和移动 Chromium 场景全部通过 |

### 3. 单元调试

只定位某个模块的 VitePress 构建问题时，可以单独构建一个单元：

```powershell
pnpm docs:build:unit frontend
```

单元命令会重建 `.build/units/frontend/`，并生成站点、路由、文件摘要和指标。单元调试成功后仍需重新执行全部七个单元，因为主题、导航和依赖属于共享输入。

## 三、产物与报告

### 1. 单元 Artifact

每个 `.build/units/<unit>/` 目录包含以下证据：

| 文件 | 用途 |
|------|------|
| `site/` | 当前单元的 VitePress 静态产物 |
| `routes.json` | 规范 URL、源文件、页面标题、哈希和所属单元 |
| `file-digests.json` | 每个产物文件的 SHA-256 与字节数 |
| `build-metrics.json` | 页面数、耗时、退出码、峰值 RSS 和产物体积 |
| `resource-usage.txt` | Linux Runner 上的 GNU time 原始报告 |

Windows 本地没有使用 GNU time 时，`peakRssBytes` 为 `null`，这表示未采集而不是内存为零。GitHub Actions 的 Ubuntu Runner 必须生成该指标。

### 2. 全站报告

| 文件 | 关键字段 |
|------|----------|
| `.build/assembly-report.json` | 当前路由数、文件数和去重数 |
| `.build/site-validation-report.json` | 页面、资源、锚点和问题表面分类 |
| `.build/search-report.json` | 索引页数、覆盖率、单元计数和标题兜底页 |
| `.build/assembled-routes.json` | 全部正式路由的唯一清单 |

Pagefind 不会为完全空白的正文建立全文记录。搜索脚本会把这类历史页面记录在 `fallbackRoutes`，仅以标题建立最小索引；补齐正文并通过内容门禁后，下一次构建会自动恢复为全文索引。

## 四、GitHub Actions 行为

### 1. 触发与权限

| 触发方式 | 构建与验收 | Pages Artifact | 生产部署 |
|----------|------------|----------------|----------|
| Pull Request | 执行 | 不创建 | 不执行 |
| `main` push | 执行 | 验收通过后创建 | 环境规则允许时执行 |
| `workflow_dispatch` | 按触发分支执行 | 仅 `main` 创建 | 仅 `main` 执行 |

工作流默认只有 `contents: read`。只有 Pages Artifact 任务获得 `pages: write`，部署任务单独获得 `pages: write` 和 `id-token: write`。流程不读取 `ACCESS_TOKEN`，也不向远端分支提交生成文件。

### 2. Job 依赖

| 顺序 | Job | 失败结果 |
|-----:|-----|----------|
| 1 | `preflight` | 不启动 Matrix |
| 2 | `build` | 保留已完成单元诊断，不进入合并 |
| 3 | `assemble` | 不上传已验证站点 Artifact |
| 4 | `upload-pages` | 不生成 `github-pages` Artifact |
| 5 | `deploy` | 不改变当前线上版本 |

同一分支的新提交会取消旧的未完成工作流。Matrix 初期始终构建全部单元，不能把旧单元 Artifact 与新主题产物混合发布。

## 五、故障定位

### 1. 诊断矩阵

| 现象 | 首要证据 | 处理方式 |
|------|----------|----------|
| VitePress OOM | 失败单元日志、`resource-usage.txt` | 保留原始日志；检查页面规模和共享配置，不直接提高全站单体堆上限 |
| 页面遗漏或重复归属 | `docs:test` 输出 | 修正 `build-units.mjs` 的唯一所有权 |
| 同路径摘要冲突 | `docs:assemble` 输出 | 确认根级所有者或共享资源生成逻辑，禁止依赖复制顺序覆盖 |
| 页面、资源或锚点缺失 | `site-validation-report.json` | 按 `content`、`navigation`、`system` 分类修复源链接或构建配置 |
| 搜索页数不足 | `search-report.json`、`pagefind-entry.json` | 检查正文标记、规范 URL 和空正文兜底，不降低覆盖阈值 |
| 搜索界面加载失败 | 浏览器网络和控制台 | 确认 `/docs/pagefind/pagefind.js`、WASM 和索引分片均在 Artifact 中 |
| 跨单元点击后 404 | Playwright trace | 检查路由单元映射和 `onBeforeRouteChange` 完整页面导航 |

### 2. 定点复现

链接问题可以先保留结构化报告而不抛出额外猜测。修复后重新执行：

```powershell
pnpm docs:assemble
pnpm docs:validate
```

搜索问题必须从未加入 Pagefind 的合并产物重新生成，不能手工修改 `pagefind/` 分片：

```powershell
pnpm docs:assemble
pnpm docs:search
pnpm docs:validate -- --require-search
```

浏览器失败时查看 `.build/playwright-results/` 中保留的 trace、截图或视频。修复主题或路由后需要重新构建受影响单元；共享主题变更完成后执行全量构建。

## 六、生产切换

### 1. 切换前门禁

首次从 `gh-pages` 分支发布切换到 GitHub Actions 前，必须确认：

1. Pull Request 的七单元 Matrix、合并、路由、链接、搜索和 Playwright 全部通过；
2. 当前站内引用的 `issues` 为 `0`，搜索的 `coveragePercent` 为 `100`；
3. `.build/assembled/` 已完成本地预览抽检；
4. 当前稳定生产提交和 `gh-pages` 分支状态已经记录；
5. `github-pages` Environment 的保护规则和允许分支已经确认；
6. 已获得用户对 Pages Source 切换和生产发布的明确授权。

### 2. 人工切换步骤

获得授权后，在 GitHub 仓库 `Settings > Pages > Build and deployment` 中把 Source 设置为 `GitHub Actions`，然后从 `main` 手动运行 `docs` 工作流。部署成功后抽检首页及六个内容单元的当前深层页面和全站搜索。

本地修改 workflow、创建提交或通过 Pull Request 验证都不等于获得生产切换授权。没有明确授权时，停止在已验证 Artifact，不修改仓库 Pages 设置。

## 七、回退流程

### 1. Actions Artifact 回退

新版本异常但工作流仍可用时，优先重新运行最后稳定提交对应的 `docs` 工作流。该方式继续使用相同的官方 Pages Artifact 和环境权限，不需要恢复生成文件分支。

回退后验证以下路径：

1. `/docs/` 首页；
2. 每个构建单元至少一个深层 URL；
3. `/docs/pagefind/pagefind.js` 与一次中文搜索；
4. 一次跨构建单元的当前文档导航。

### 2. Source 回退

只有官方 Pages 流程无法恢复且旧 `gh-pages` 分支仍保存稳定产物时，才在获得明确授权后把 Pages Source 临时切回原分支。切回前不得删除或重写 `gh-pages` 历史，切回后记录原因、时间、稳定提交和后续恢复条件。

GitHub Pages 接收的是完整单一 Artifact。单元构建或合并失败不会覆盖上一版站点，因此不能用“先发布成功单元”作为恢复手段。

## 八、容量复核

| 指标 | 正常 | 预警 | 必须处理 |
|------|------|------|----------|
| 单元页面数 | 不高于 350 | 351～400 | 超过 400 复核单元边界 |
| 单元构建时间 | 不高于 3 分钟 | 3～5 分钟 | 超过 5 分钟执行性能治理 |
| 内部引用问题 | 0 | 无 | 大于 0 阻断发布 |
| 搜索覆盖率 | 100% | 无 | 低于 100% 阻断发布 |
| Pages Artifact | 不高于 750 MiB | 750 MiB～1 GiB | 超过 1 GiB 暂停扩展 |

全站达到 1,000、1,200 和 1,500 篇时分别保存一次完整构建指标。文档数量只触发容量复核，不能代替知识职责判断，也不能作为把完整文章机械拆碎的依据。
