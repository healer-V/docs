---
title: "随记导航与 Markdown 文档命名修正设计"
tags:
  - VitePress
  - Markdown
  - 文档治理
excerpt: "修正随记导航的错误目录，区分 VitePress 扩展语法与通用 Markdown 指南，并通过旧路由兼容和引用迁移避免重命名导致链接失效。"
date: 2026-09-22
---

# 随记导航与 Markdown 文档命名修正设计

“更多”导航下的“随记”分组当前没有显示，直接原因是三个链接使用了不存在的 `/article/` 目录，而真实目录是 `/articles/`。导航加载时，`filterNavigationItems()` 会过滤不存在的页面；三个子项全部失效后，“随记”空分组也会被移除。

本次修正同时解决两篇 Markdown 文档名称相近、文件名语义不清和大小写不统一的问题，但不扩大到文章内容重构。

## 一、目标与范围

### 1. 修正目标

| 目标 | 验收结果 |
|------|----------|
| 恢复随记导航 | “更多 → 随记”稳定显示三个可访问页面 |
| 区分两篇 Markdown 文档 | 导航名称和文件名能够直接表达各自职责 |
| 统一文件命名 | 文件名使用小写英文和连字符，不保留仅靠目录或大小写区分的名称 |
| 保留历史入口 | 旧页面 URL 跳转到对应新页面，查询参数和锚点继续保留 |
| 保护用户改动 | `content/articles/tools/02-Markdown.md` 当前未提交内容完整迁移，不重写正文 |

### 2. 修改边界

本次只修改导航配置、两个文件路径、第一篇文档的标题拼写、已确认的源码引用和历史路由迁移表。以下内容不在范围内：

- 不合并两篇文档；
- 不全文重写或格式化文章；
- 不调整 `articles` 下其他文件的编号；
- 不处理本次导航问题以外的孤立文档；
- 不自动提交或推送 Git 变更。

## 二、文档职责与命名

### 1. 职责划分

| 文档 | 核心职责 | 导航名称 |
|------|----------|----------|
| VitePress 扩展语法示例 | 展示 VitePress 容器、代码组、代码高亮、徽章等站点扩展能力 | VitePress Markdown |
| 通用 Markdown 指南 | 系统讲解 Markdown 基础语法、高级语法、工具与实践 | Markdown 语法指南 |

两篇文档存在少量主题交集，但服务目标不同。保留独立页面可以让仓库规范直接引用 VitePress 扩展示例，同时让读者通过通用指南学习完整 Markdown 语法。

### 2. 文件迁移

| 当前路径 | 新路径 |
|----------|--------|
| `content/articles/blog/02-markdown.md` | `content/articles/blog/02-vitepress-markdown.md` |
| `content/articles/tools/02-Markdown.md` | `content/articles/tools/02-markdown-guide.md` |

第一篇文档 Frontmatter 和一级标题中的 `vitepess` 同步修正为 `VitePress`，标题统一为“VitePress Markdown 扩展语法”。第二篇文档保留现有“Markdown 语法指南”标题及全部未提交内容。

## 三、导航与引用迁移

### 1. 导航结构

“更多”继续使用 VitePress 支持的分组结构：

| 层级 | 显示名称 | 目标 |
|------|----------|------|
| 一级 | 更多 | 顶部导航下拉菜单 |
| 二级 | 随记 | 分组标题，不直接跳转 |
| 三级 | VitePress | `/articles/blog/01-vitepress.md` |
| 三级 | VitePress Markdown | `/articles/blog/02-vitepress-markdown.md` |
| 三级 | Markdown 语法指南 | `/articles/tools/02-markdown-guide.md` |

所有路径统一使用真实的 `/articles/` 前缀。保留 `.md` 后缀以匹配当前导航解析与存在性过滤逻辑。

### 2. 源码引用

重命名后同步更新以下已确认引用：

| 位置 | 更新内容 |
|------|----------|
| `AGENTS.md` | 扩展语法示例与 Markdown 指南的新路径 |
| `standards/documentation/article-generation.md` | 写作检查入口的新路径 |
| `superpowers/specs/2026-09-10-java-readability-revision.md` | 两篇参考文档的新相对路径 |
| `.vitepress/themeConfig/nav.js` | 导航名称和页面路径 |

`scripts/baselines/published-routes.json` 作为历史发布路由基线，不把旧记录直接替换成新路径；旧路由由迁移表承接。

## 四、历史路由兼容

### 1. 跳转规则

在 `scripts/baselines/route-redirects.json` 增加两条迁移记录：

| 旧路由 | 新路由 |
|--------|--------|
| `/docs/articles/blog/02-markdown.html` | `/docs/articles/blog/02-vitepress-markdown.html` |
| `/docs/articles/tools/02-Markdown.html` | `/docs/articles/tools/02-markdown-guide.html` |

兼容页由现有站点组装流程生成，并沿用项目已有逻辑保留查询参数和锚点。不会保留错误的 `/docs/article/...` 地址，因为该路径从未对应真实页面，也没有进入已发布路由基线。

### 2. 路由约束

新路由必须成为正式构建路由后，旧路由迁移记录才允许通过组装校验。迁移表不得指向不存在的目标，也不得覆盖仍然存在的正式页面。

## 五、验证方案

| 顺序 | 验证项 | 通过条件 |
|----:|--------|----------|
| 1 | 文件与引用扫描 | 旧源码路径只保留在历史路由基线和迁移表的 `from` 字段中 |
| 2 | 导航配置加载 | `filterNavigationItems(rawNav)` 保留“随记”及三个子项 |
| 3 | 文档站单元测试 | `pnpm docs:test` 通过 |
| 4 | 构建验证 | 对受影响的 portal 与 ecosystem 构建单元执行构建，页面均生成 |
| 5 | 路由兼容验证 | 站点组装和历史路由检查确认两个旧 URL 可跳转到新页面 |

如果完整构建受当前工作区其他未完成内容影响，交付时必须区分本次修改导致的失败和已有失败，不得把未执行验证描述为通过。

## 六、实施顺序

| 顺序 | 操作 |
|----:|------|
| 1 | 使用 Git 感知的移动操作重命名两篇文档，保留文件内容与历史 |
| 2 | 修正 VitePress 扩展语法文档的标题拼写 |
| 3 | 更新导航、规范和正文中的引用 |
| 4 | 添加旧路由兼容记录 |
| 5 | 执行引用扫描、测试、构建与路由验证 |

实施过程中只修改本设计列出的文件。发现其他历史问题时仅记录，不扩大本次治理范围。
