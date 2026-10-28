---
title: "大型知识库模块化构建工程实施计划"
tags:
  - VitePress
  - GitHub Actions
  - 实施计划
  - Pagefind
excerpt: "依据大型知识库模块化设计，分阶段实现路由基线、构建单元、确定性产物合并、统一搜索、历史 URL 门禁和 GitHub Pages 官方发布流程。"
date: 2026-08-31
---

# 大型知识库模块化构建工程实施计划

本计划依据已确认的[大型知识库模块化构建与内容治理设计](../specs/2026-08-31-modular-documentation-site-design.md)，先完成支撑 1,000～1,500 篇文档的工程底座，再进入 HTML 模块试点和逐模块内容建设。计划不直接生成数百篇缺失正文，也不在工程验证通过前改变生产 GitHub Pages 设置。

## 一、执行范围

### 1. 本轮交付

| 项目 | 内容 |
|------|------|
| 路由基线 | 保存当前生产路径、构建路径和历史锚点，建立兼容门禁 |
| 构建单元 | 建立 `portal`、`frontend`、`backend`、`operation`、`ai`、`web3`、`ecosystem` 七个单元 |
| 单元构建 | 使用同一 `content/` 源目录、独立 `cacheDir` 和 `outDir` 串行或 Matrix 构建 |
| 产物合并 | 按 URL 所有权、文件摘要和根级文件规则确定性合并 |
| 站点校验 | 校验路由、静态资源、内部链接、历史 URL 和搜索覆盖 |
| 全站搜索 | 对合并产物生成一个 Pagefind Extended 中文索引 |
| 主题适配 | 支持跨单元完整页面导航和统一搜索入口 |
| CI/CD | GitHub Actions Matrix 构建、官方 Pages Artifact 和原子发布 |
| 运行手册 | 记录本地构建、故障定位、回退和生产切换步骤 |

### 2. 非目标

- 不在本计划中批量补齐现有 766 个 sidebar 缺失目标；
- 不在本计划中重写 Java、React、微服务或其他技术正文；
- 不在工程改造中批量迁移现有 Markdown 路径；
- 不默认启用增量跳过构建，首版始终构建全部单元；
- 不在未经用户明确授权时切换仓库 Pages Source、执行 `git push` 或触发生产部署；
- 不将 HTML 试点与工程底座作为同一个大提交实施。

### 3. 后续计划边界

工程底座完成后，后续内容工作拆分为独立计划：

| 后续计划 | 前置条件 | 主要输出 |
|----------|----------|----------|
| HTML 模块蓝图与样板 | 本计划全部验收通过 | HTML 知识项、职责卡、覆盖矩阵和样板文章 |
| 基础模块建设 | HTML 试点复盘通过 | CSS、JavaScript、TypeScript 等逐模块计划 |
| 框架与平台建设 | 对应前置模块稳定 | Vue、React、Spring、数据库、运维等正文 |
| 容量复核 | 站点达到 1,000、1,200、1,500 篇 | 构建边界和资源阈值调整结论 |

## 二、工作区与实施约束

### 1. 当前重叠风险

当前工作区已经暂存大量用户改动，其中以下文件与本计划存在直接重叠：

```text
package.json
.vitepress/config.mjs
.vitepress/theme/index.js
.vitepress/themeConfig/nav.js
.vitepress/themeConfig/sidebar.js
.vitepress/themeConfig/sidebar/*.js
.github/workflows/deploy.yml
```

实施每个任务前必须重新读取目标文件和暂存差异，基于当前内容做最小补丁，不覆盖或撤销用户改动。提交时使用路径限定并检查提交文件列表，不允许把其他已暂存内容带入。

### 2. VitePress 版本约束

当前 VitePress 1.3.4 公开支持 `srcExclude`、`outDir` 和 `cacheDir`，但不公开 `tempDir` 配置。处理方式如下：

- GitHub Actions Matrix 每个单元使用独立 Runner，`.temp` 由工作区天然隔离；
- 本地 `docs:build:all` 默认串行构建七个单元；
- 不在首版脚本中并行启动共享 `.vitepress/.temp` 的本地构建；
- 每个单元继续使用独立缓存和输出目录。

### 3. 新增函数注释约束

新增的 Node.js 函数、Vue 回调和主题路由函数全部遵守根目录代码注释规范。多入参函数必须使用 JSDoc，说明每个参数的含义、边界、返回值或副作用；异常兜底和跨单元跳转必须说明业务原因。

## 三、目标文件结构

实施完成后的新增工程文件按以下结构组织：

```text
.vitepress/
├─ config.mjs
├─ components/
│  └─ GlobalSearch.vue
├─ theme/
│  ├─ index.js
│  └─ style/
│     └─ search.css
├─ utils/
│  └─ unitRouting.js
└─ themeConfig/
   ├─ nav.js
   └─ sidebar.js

scripts/
├─ baselines/
│  └─ published-routes.json
└─ docs/
   ├─ build-units.mjs
   ├─ build-unit.mjs
   ├─ build-all-units.mjs
   ├─ collect-unit-artifact.mjs
   ├─ assemble-site.mjs
   ├─ validate-site.mjs
   ├─ capture-route-baseline.mjs
   ├─ check-route-baseline.mjs
   ├─ export-navigation-backlog.mjs
   ├─ build-search.mjs
   ├─ preview-site.mjs
   ├─ lib/
   │  ├─ files.mjs
   │  └─ routes.mjs
   └─ __tests__/
      ├─ build-units.test.mjs
      ├─ routes.test.mjs
      ├─ assemble-site.test.mjs
      ├─ validate-site.test.mjs
      └─ unit-routing.test.mjs

tests/
└─ docs-site.spec.mjs

playwright.config.mjs

standards/documentation/
├─ backlogs/
│  └─ navigation-missing.json
└─ site-build-runbook.md
```

测试临时目录使用操作系统临时目录动态创建，不向仓库提交构建夹具产物。`.build/`、单元输出和 Pagefind 临时文件加入 `.gitignore`。

## 四、任务 1：冻结现状与生产路由基线

### 1. 修改文件

| 操作 | 文件 |
|------|------|
| 新建 | `scripts/docs/lib/routes.mjs` |
| 新建 | `scripts/docs/capture-route-baseline.mjs` |
| 新建 | `scripts/docs/__tests__/routes.test.mjs` |
| 生成 | `scripts/baselines/published-routes.json` |
| 修改 | `package.json`、`.gitignore` |

### 2. 实施步骤

1. 使用 Node.js 内置 `node:test` 为 Markdown 路径、HTML 路径、目录首页和锚点标准化编写失败测试；
2. 实现路径标准化、规范 URL 生成和重复路径检测；
3. 从当前 8 GiB 完整构建产物提取全部 HTML 路径与标题；
4. 使用 `https://healer-v.github.io/docs/` 作为生产基线入口，采集当前可访问路径；
5. 将生产路径、构建路径、源文件、标题和锚点写入结构化 JSON；
6. 标记只存在于生产、只存在于当前工作区和两边同时存在的页面；
7. 不因当前工作区新增页面而删除生产基线记录。

### 3. 验证命令

```powershell
node --test scripts/docs/__tests__/routes.test.mjs
$env:NODE_OPTIONS='--max-old-space-size=8192'; npm run docs:build
node scripts/docs/capture-route-baseline.mjs --site .vitepress/dist --production https://healer-v.github.io/docs/
```

完成条件：基线文件可重复生成，规范 URL 无重复，630 篇当前页面和生产页面差异均具有明确状态。

## 五、任务 2：建立构建单元唯一事实来源

### 1. 修改文件

| 操作 | 文件 |
|------|------|
| 新建 | `scripts/docs/build-units.mjs` |
| 新建 | `scripts/docs/__tests__/build-units.test.mjs` |
| 修改 | `.vitepress/config.mjs` |
| 修改 | `.vitepress/themeConfig/sidebar.js` |
| 修改 | `package.json` |

### 2. 实施步骤

1. 先为七个单元名称、URL 前缀、包含目录、排除目录和根级所有权编写失败测试；
2. 实现不可变的构建单元注册表和 `resolveBuildUnit()`；
3. 校验所有正式 Markdown 恰好归属一个单元；
4. 将 `DOCS_BUILD_UNIT` 解析集中在注册表中，未知单元立即失败；
5. 修改 VitePress 配置，根据单元设置 `srcExclude`、`cacheDir` 和 `outDir`；
6. 非 `portal` 单元禁止拥有首页、404 和公共静态文件；
7. sidebar 按当前单元异步加载，顶部导航保持全站一致；
8. 保留不设置 `DOCS_BUILD_UNIT` 时的单体构建模式，作为迁移期对照基准。

### 3. 验证命令

```powershell
node --test scripts/docs/__tests__/build-units.test.mjs
node scripts/docs/build-unit.mjs portal
node scripts/docs/build-unit.mjs frontend
node scripts/docs/build-unit.mjs backend
```

完成条件：单元归属没有遗漏或重复，三个代表性单元可以独立生成到不同输出目录，现有源文件和 URL 未移动。

## 六、任务 3：实现跨平台单元构建与指标采集

### 1. 修改文件

| 操作 | 文件 |
|------|------|
| 新建 | `scripts/docs/build-unit.mjs` |
| 新建 | `scripts/docs/build-all-units.mjs` |
| 新建 | `scripts/docs/collect-unit-artifact.mjs` |
| 新建 | `scripts/docs/lib/files.mjs` |
| 修改 | `package.json`、`.gitignore` |

### 2. 实施步骤

1. 使用 Node.js `spawn` 调用仓库已安装的 VitePress，不拼接 shell 命令；
2. `build-unit.mjs <unit>` 设置环境变量、输出路径和日志前缀；
3. 记录开始时间、结束时间、退出码、页面数、产物文件数和总字节数；
4. Linux Runner 使用 `/usr/bin/time` 记录最大常驻内存，本地 Windows 缺少同等工具时明确标记为未采集；
5. 构建成功后生成 `routes.json`、`file-digests.json` 和 `build-metrics.json`；
6. `build-all-units.mjs` 在本地按固定顺序串行调用七个单元；
7. 任一单元失败时停止本地全量流程并保留已有诊断文件。

### 3. 验证命令

```powershell
node scripts/docs/build-unit.mjs frontend
node scripts/docs/build-all-units.mjs
node -e "JSON.parse(require('fs').readFileSync('.build/units/frontend/build-metrics.json','utf8'))"
```

完成条件：七个单元全部独立构建成功，每个单元 Artifact 结构一致，本地不会并行争用 `.temp`。

## 七、任务 4：实现确定性产物合并

### 1. 修改文件

| 操作 | 文件 |
|------|------|
| 新建 | `scripts/docs/assemble-site.mjs` |
| 新建 | `scripts/docs/__tests__/assemble-site.test.mjs` |
| 修改 | `scripts/docs/lib/files.mjs`、`package.json` |

### 2. 测试场景

在操作系统临时目录中构造最小 Artifact，先覆盖以下失败与成功路径：

| 场景 | 预期结果 |
|------|----------|
| 不同单元生成不同 URL | 全部合并成功 |
| 同路径、同 SHA-256 | 去重并记录共同来源 |
| 同路径、不同 SHA-256 | 立即失败并报告双方单元 |
| 非 `portal` 生成 `index.html` | 所有权检查失败 |
| 单元缺少路由清单 | 合并失败 |
| 两个单元声明同一规范 URL | 合并失败 |
| 多个合法 `hashmap.json` | 合并为一个全站映射 |

### 3. 实施步骤

1. 先完成上述测试并确认实现前失败；
2. 按构建单元固定顺序读取 Artifact，不依赖文件系统遍历顺序；
3. 使用 SHA-256 对每个文件建立来源和摘要索引；
4. 由 `portal` 写入首页、404、公共静态文件和其他根级所有物；
5. 聚合所有页面哈希生成全站 `hashmap.json`；
6. 根据规范路由统一生成 sitemap；
7. 输出合并报告，包含路由数量、文件数量、去重数量和冲突列表；
8. 使用临时目标目录，全部成功后再原子替换 `.build/assembled/`。

### 4. 验证命令

```powershell
node --test scripts/docs/__tests__/assemble-site.test.mjs
node scripts/docs/assemble-site.mjs --input .build/units --output .build/assembled
```

完成条件：合并不使用覆盖顺序解决冲突，全站 `hashmap.json` 包含七个单元的全部正式页面。

## 八、任务 5：建立导航真实性与全站校验门禁

### 1. 修改文件

| 操作 | 文件 |
|------|------|
| 新建 | `scripts/docs/validate-site.mjs` |
| 新建 | `scripts/docs/check-route-baseline.mjs` |
| 新建 | `scripts/docs/export-navigation-backlog.mjs` |
| 新建 | `scripts/docs/__tests__/validate-site.test.mjs` |
| 生成 | `standards/documentation/backlogs/navigation-missing.json` |
| 修改 | `.vitepress/config.mjs` |
| 修改 | `.vitepress/themeConfig/nav.js`、`.vitepress/themeConfig/sidebar.js` |
| 修改 | `package.json` |

### 2. 实施步骤

1. 使用结构化 HTML 解析器读取生成页面，不使用正则解析 HTML；
2. 扫描页面链接、图片、脚本、样式和锚点引用；
3. 将当前 nav 和 sidebar 中不存在的目标导出到治理台账；
4. 正式导航在构建时依据真实路由过滤，空分组同步移除；
5. 校验正式 sidebar 中每个链接均存在，并校验正式页面是否具有唯一归属；
6. 对照 `published-routes.json` 检查历史路径和要求保留的锚点；
7. 历史路径缺失时输出明确差异，不自动生成未经确认的重定向；
8. 门禁稳定后将 `ignoreDeadLinks` 调整为 `false`；
9. 保留台账中的规划页面，但不再向线上导航输出占位链接。

### 3. 验证命令

```powershell
node --test scripts/docs/__tests__/validate-site.test.mjs
node scripts/docs/export-navigation-backlog.mjs
node scripts/docs/check-route-baseline.mjs --site .build/assembled
node scripts/docs/validate-site.mjs --site .build/assembled
```

完成条件：正式导航死链接为 0，766 个旧占位均进入明确治理状态，历史 URL 保留率为 100%。

## 九、任务 6：实现跨单元导航边界

### 1. 修改文件

| 操作 | 文件 |
|------|------|
| 新建 | `.vitepress/utils/unitRouting.js` |
| 新建 | `scripts/docs/__tests__/unit-routing.test.mjs` |
| 修改 | `.vitepress/theme/index.js` |
| 修改 | `.vitepress/themeConfig/nav.js` |

### 2. 实施步骤

1. 为同单元路径、跨单元路径、外链、锚点和未知路径编写路由判断测试；
2. 实现 URL 到构建单元的纯函数映射；
3. 在 VitePress `router.onBeforeRouteChange` 中识别跨单元导航；
4. 跨单元时使用 `window.location.assign()` 完整加载目标页面并取消客户端路由；
5. 同单元、同页锚点和外部链接保持 VitePress 默认行为；
6. 顶部导航和搜索结果显式携带所属单元元数据，路由守卫作为统一兜底；
7. 直接访问深层 URL 和页面刷新不得依赖首页预加载。

### 3. 验证命令

```powershell
node --test scripts/docs/__tests__/unit-routing.test.mjs
node scripts/docs/validate-site.mjs --site .build/assembled
```

完成条件：同单元跳转保持客户端体验，跨单元跳转不会尝试使用错误的 sidebar 或页面模块。

## 十、任务 7：接入 Pagefind 统一中文搜索

### 1. 修改文件

| 操作 | 文件 |
|------|------|
| 新建 | `scripts/docs/build-search.mjs` |
| 新建 | `.vitepress/components/GlobalSearch.vue` |
| 新建 | `.vitepress/theme/style/search.css` |
| 修改 | `.vitepress/theme/index.js`、`.vitepress/theme/style/index.css` |
| 修改 | `.vitepress/config.mjs` |
| 修改 | `package.json`、`pnpm-lock.yaml` |

### 2. 依赖策略

| 依赖 | 用途 | 约束 |
|------|------|------|
| `pagefind` | Extended 中文索引与浏览器搜索 API | 使用锁文件固定验证版本，不调用 `latest` |
| `cheerio` | 构建后 HTML 标注和校验 | 作为直接开发依赖，避免依赖传递包 |

首版搜索组件复用现有 VitePress 视觉语言，不引入额外 UI 框架。组件需要覆盖打开、输入、加载、结果、无结果、错误、键盘导航、移动端关闭和跨单元跳转状态。

### 3. 实施步骤

1. 在 VitePress HTML 转换阶段使用结构化解析，为 `.vp-doc` 添加 `data-pagefind-body`；
2. 为导航、sidebar、页脚和交互区域添加 `data-pagefind-ignore`；
3. 从路由清单注入标题、标签、摘要、模块和规范 URL 元数据；
4. 只对 `.build/assembled/` 运行一次 Pagefind；
5. 将索引固定输出到 `/docs/pagefind/`；
6. 搜索组件在聚焦或首次输入时延迟加载索引；
7. 结果支持按构建单元筛选，兼容页和治理文档不进入索引；
8. 跨单元搜索结果执行完整页面导航；
9. 对索引页数与应索引路由清单执行 100% 覆盖检查。

### 4. 验证命令

```powershell
pnpm install --frozen-lockfile
node scripts/docs/build-search.mjs --site .build/assembled
node scripts/docs/validate-site.mjs --site .build/assembled --require-search
```

完成条件：中文关键词、英文技术术语和模块过滤均返回规范页面，搜索加载失败时界面给出可恢复错误状态。

## 十一、任务 8：增加浏览器端回归验证

### 1. 修改文件

| 操作 | 文件 |
|------|------|
| 新建 | `tests/docs-site.spec.mjs` |
| 新建 | `playwright.config.mjs` |
| 新建 | `scripts/docs/preview-site.mjs` |
| 修改 | `package.json`、`pnpm-lock.yaml` |

### 2. 依赖与预览策略

| 项目 | 用途 | 约束 |
|------|------|------|
| `@playwright/test` | 桌面端与移动端浏览器回归 | 使用锁文件固定验证版本，并在 CI 安装 Chromium |
| `preview-site.mjs` | 预览指定的合并产物 | 通过 `DOCS_PREVIEW_OUT_DIR` 让 VitePress 配置解析目标目录，不依赖 `preview --outDir` |

预览脚本使用 Node.js `spawn` 启动仓库内的 VitePress，并将站点目录、主机和端口作为显式参数传入。VitePress 1.3.4 的 `preview` 命令从站点配置读取 `outDir`，因此不能把构建命令的 `--outDir` 用法直接套到预览命令。

### 3. 核心场景

| 场景 | 验收点 |
|------|--------|
| 首页进入前端页面 | URL 保持 `/docs/frontend/...` |
| 前端跳转后端 | 完整加载成功，显示后端 sidebar |
| 后端跳转运维 | 页面和静态资源无 404 |
| 深层页面刷新 | 直接返回正确页面而不是站点 404 |
| 中文搜索 | 返回标题、摘要和模块信息 |
| 搜索模块筛选 | 结果只属于选定模块 |
| 历史 URL | 返回正文或已确认兼容页 |
| 移动端搜索 | 控件不重叠，结果可滚动和关闭 |

### 4. 验证命令

启动预览服务前先检查项目已有服务；没有可复用服务时才启动临时服务，并在验证完成后关闭。

```powershell
node scripts/docs/preview-site.mjs --site .build/assembled --host 127.0.0.1 --port 4173
pnpm exec playwright test
```

完成条件：桌面与移动视口的核心场景全部通过，浏览器控制台没有未处理异常，页面和搜索结果不存在布局重叠。

## 十二、任务 9：迁移 GitHub Actions 构建流程

### 1. 修改文件

| 操作 | 文件 |
|------|------|
| 修改 | `.github/workflows/deploy.yml` |
| 修改 | `package.json` |
| 新建 | `standards/documentation/site-build-runbook.md` |

### 2. 工作流结构

| Job | 主要动作 | 产物或权限 |
|-----|----------|------------|
| `preflight` | 安装依赖、单元配置测试、路由归属检查 | 只读权限 |
| `build` | Matrix 构建七个单元并上传 Artifact | 每单元独立 Artifact |
| `assemble` | 下载、合并、基线检查、全站校验、搜索和浏览器冒烟 | 完整站点目录 |
| `upload-pages` | 上传唯一 Pages Artifact | `pages: write` 前不部署 |
| `deploy` | 官方 `deploy-pages` 原子发布 | `pages: write`、`id-token: write` |

### 3. 实施步骤

1. 增加 `pull_request`、`push main` 和 `workflow_dispatch` 触发；
2. 配置分支级 concurrency，新提交取消旧构建；
3. `preflight` 运行 Node 测试和单元归属检查；
4. Matrix 中每个 Runner 只执行一个单元，并上传固定命名 Artifact；
5. `assemble` 必须显式 `needs` 全部 Matrix 结果；
6. 合并后执行历史 URL、死链接、搜索和浏览器冒烟；
7. Pull Request 到此结束，不创建 Pages Deployment；
8. `main` 使用 `actions/configure-pages`、`actions/upload-pages-artifact` 和 `actions/deploy-pages`；
9. 删除第三方 `crazy-max/ghaction-github-pages` 和 `ACCESS_TOKEN` 引用；
10. 将构建指标写入 GitHub Actions Job Summary。

### 4. 放行条件

先通过 Pull Request 工作流验证，不立即切换生产 Pages Source。只有用户确认以下证据后，才在 GitHub 仓库设置中将 Source 切换为 `GitHub Actions`：

- 七个构建单元全部成功；
- 合并路由与单体基线一致；
- 历史 URL 保留率为 100%；
- 搜索覆盖率为 100%；
- 预览站点浏览器回归通过；
- 回退步骤已经在运行手册中验证。

## 十三、任务 10：对照构建与生产切换演练

### 1. 对照内容

| 对照项 | 单体基线 | 模块化结果 |
|--------|----------|------------|
| 页面路由 | 当前 8 GiB 构建 | 合并后的七单元路由 |
| HTML 数量 | 基线页面数 | 必须一致或差异有批准记录 |
| 静态资源 | 当前引用集合 | 不得出现缺失引用 |
| 历史 URL | `published-routes.json` | 100% 保留 |
| 页面标题 | 当前标题 | 非内容任务不得意外变化 |
| 首页和 404 | 当前行为 | `portal` 产物行为一致 |
| 搜索 | 当前关闭 | Pagefind 覆盖所有正式文章 |

### 2. 切换演练

1. 在不修改生产 Pages Source 的情况下完成一次完整 Artifact 构建；
2. 本地预览合并产物并完成浏览器回归；
3. 保存最后稳定部署提交和当前 `gh-pages` 状态；
4. 记录切换为 GitHub Actions Source 的人工步骤；
5. 记录失败时恢复旧 Source 或重新部署稳定 Artifact 的步骤；
6. 获得用户明确授权后才执行生产切换；
7. 切换后抽检首页及六个内容单元的深层页面和统一搜索。

完成条件：生产切换具有明确授权、验证记录和可执行回退，不依赖个人访问令牌。

## 十四、任务 11：关闭工程阶段并移交内容试点

### 1. 工程验收报告

最终报告必须包含：

| 项目 | 必须报告的结果 |
|------|----------------|
| 修改范围 | 新增、修改、删除文件及原因 |
| 构建单元 | 页面数、耗时、内存和产物体积 |
| 合并结果 | 文件数、路由数、去重数和冲突数 |
| URL 兼容 | 历史路径与锚点保留结果 |
| 导航 | 正式链接数量与治理台账数量 |
| 搜索 | 索引页面数、模块过滤和抽样结果 |
| 浏览器回归 | 桌面、移动端和控制台结果 |
| GitHub Actions | PR 验证和生产部署状态 |
| 剩余风险 | 未解决问题、原因和影响范围 |

### 2. HTML 试点入口

工程验收通过后，单独启动 HTML 模块蓝图任务。该任务重新读取 `content/frontend/01-html/` 的真实正文、对应导航、官方 HTML 标准和仓库分层文档规范，不能把本工程计划中的文章数量估算直接当作 HTML 建设清单。

## 十五、统一验证命令

工程实施结束时至少执行以下命令：

```powershell
node --test scripts/docs/__tests__/*.test.mjs
node scripts/docs/build-all-units.mjs
node scripts/docs/assemble-site.mjs --input .build/units --output .build/assembled
node scripts/docs/check-route-baseline.mjs --site .build/assembled
node scripts/docs/validate-site.mjs --site .build/assembled
node scripts/docs/build-search.mjs --site .build/assembled
node scripts/docs/validate-site.mjs --site .build/assembled --require-search
pnpm exec playwright test
```

无法在本地模拟的 GitHub Pages 权限和环境保护规则在 Pull Request 与人工切换阶段验证，并在验收报告中明确记录。

## 十六、实施顺序与停止条件

| 顺序 | 任务 | 进入下一任务的条件 |
|-----:|------|--------------------|
| 1 | 路由基线 | 基线可重复生成且无重复规范 URL |
| 2 | 构建单元 | 所有页面唯一归属，代表单元构建成功 |
| 3 | 构建脚本 | 七单元串行构建和指标生成成功 |
| 4 | 产物合并 | 冲突、所有权和 `hashmap.json` 测试通过 |
| 5 | 全站校验 | 导航、链接和历史 URL 门禁通过 |
| 6 | 路由边界 | 跨单元完整加载验证通过 |
| 7 | Pagefind | 索引覆盖率和模块过滤通过 |
| 8 | 浏览器回归 | 桌面与移动端核心流程通过 |
| 9 | GitHub Actions | Pull Request 全链路通过 |
| 10 | 生产演练 | 获得授权且回退步骤可执行 |
| 11 | 工程关闭 | 验收报告完整，允许启动 HTML 蓝图 |

出现以下任一情况时停止当前阶段，不带病进入下一任务：

- 构建单元存在页面遗漏或重复归属；
- 模块化产物与单体路由出现未解释差异；
- 同路径文件摘要冲突；
- 历史 URL 保留率低于 100%；
- 正式导航仍包含不存在页面；
- Pagefind 漏掉正式页面；
- 当前工作区改动与目标文件无法安全合并；
- Pull Request 验证尚未通过却准备切换生产 Pages Source；
- 用户尚未明确授权远端推送或生产发布。

## 十七、完成标准

- [ ] 当前生产和工作区路由基线已版本化；
- [ ] 七个构建单元具有唯一、可测试的页面归属；
- [ ] 本地多单元构建默认串行，不争用 VitePress `.temp`；
- [ ] 单元 Artifact 包含站点、路由、摘要和指标；
- [ ] 产物合并使用 SHA-256 和明确根级所有权；
- [ ] 全站 `hashmap.json` 和 sitemap 由完整路由统一生成；
- [ ] 正式 nav、sidebar 和内部链接全部有效；
- [ ] 规划页面已经迁移到治理台账，不生成空壳正文；
- [ ] 历史 URL 和要求保留的锚点通过自动门禁；
- [ ] 跨单元导航执行完整页面加载；
- [ ] Pagefind 中文全文搜索覆盖所有正式文章；
- [ ] 桌面和移动端核心流程通过浏览器回归；
- [ ] Pull Request 执行全链路验证但不部署；
- [ ] `main` 使用 GitHub 官方 Pages Artifact 和最小权限；
- [ ] 生产切换具有明确授权和回退记录；
- [ ] 未覆盖用户已有改动，未执行未经授权的远端操作；
- [ ] HTML 内容试点以独立蓝图和实施计划启动。
