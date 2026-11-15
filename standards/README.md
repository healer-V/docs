---
title: "文档规范索引"
tags:
  - 文档规范
  - AI 生成
excerpt: "按任务选择目录规划、文章生成、写作、验收和构建规范，明确规则的唯一归属及模块蓝图的使用边界。"
date: 2026-11-15
---

# 文档规范索引

本目录维护项目的文档规则、模块蓝图和必要模板。根目录 [AGENTS.md](../AGENTS.md) 提供项目定位、优先级和硬性规则速览；本索引负责选择执行入口。网站正文只保存在 `content/`，本目录不生成网站页面。

## 一、文件职责

| 文件 | 唯一维护的职责 |
|------|----------------|
| [article/article-generation.md](./article/article-generation.md) | 单篇和逐章生成：任务范围、文章类型、目标深度、历史治理 |
| [writing/content-organization.md](./writing/content-organization.md) | 正文：开篇、知识单元、信息密度、容器、标题与阅读路径 |
| [writing/markdown-format.md](./writing/markdown-format.md) | 格式：Frontmatter、编号、代码折叠、链接、图片及最小正文骨架 |
| [writing/code-examples.md](./writing/code-examples.md) | 示例：空目录复现、依赖与入口、验证状态、数据和注释 |
| [knowledge/knowledge-system.md](./knowledge/knowledge-system.md) | 知识方向覆盖模型、读者起点、版本和来源策略 |
| [knowledge/directory-planning.md](./knowledge/directory-planning.md) | 目录：知识项、依赖、文章归属、覆盖矩阵、路径与导航 |
| [process/workflow.md](./process/workflow.md) | 阶段：建档、蓝图确认、样板确认、逐章生成、整体验收 |
| [process/quality-gates.md](./process/quality-gates.md) | 验收：蓝图、A01—A12 单篇门禁、章节、机器检查及样板评审记录 |
| [templates/module-blueprint-template.md](./templates/module-blueprint-template.md) | 可填写的模块蓝图，内含[单篇文章职责卡](./templates/module-blueprint-template.md#article-responsibility) |
| [engineering/site-build-runbook.md](./engineering/site-build-runbook.md) | 构建、搜索、浏览器回归、CI、发布与回退 |
| `blueprints/<方向>/<模块>.md` | 各模块已经登记的知识范围、版本、目录、职责及进度；使用前核对其确认状态 |

规则只在所属规范中维护；执行入口和验收清单通过链接引用，模板只定义填写字段，不建立第二套规则。临时脚本与检查报告放在 `work/`；本地设计、计划和评审记录按项目约定放在 `superpowers/`，均不提交。需要长期依据的结论保存在本目录。

## 二、任务路由

先确定任务类型，再读取相应文件。“写作规范”指 `writing/` 下的三份文件；只局部修改旧文时仅应用与修改相关的规则。

| 任务 | 读取范围 | 开始实施前的条件 |
|------|----------|------------------|
| 新建或全文重构模块 | 知识方向、目录规划、阶段流程、文章生成、写作规范、质量门禁及已有蓝图 | 先确认蓝图，再生成并确认样板，最后批量正文 |
| 仅规划章节或逐篇大纲 | 知识方向、目录规划、阶段流程及已有蓝图 | 先形成知识项与依赖；不创建空正文或更新正式导航 |
| 新建或全文重写单篇 | 模块蓝图、文章生成、写作规范、质量门禁 | 职责卡已确认或能从有效蓝图唯一确定 |
| 续写已确认章节 | 当前蓝图、文章生成、阶段流程、写作规范及质量门禁 | 复用已有有效确认；当前篇及当前章验收通过后再继续 |
| 局部修订旧文 | 受影响的写作规范与质量门禁 | 范围明确，保留用户改动，不扩大治理 |
| 批量质量治理 | 当前蓝图、文章生成中的历史治理与质量门禁 | 治理范围、迁移规则及工程验证方式已明确 |
| 构建或导航维护 | 构建手册；涉及目录或内容时补读对应规范 | 修改范围和需要执行的检查已明确 |

新建、重构或规划模块时没有有效蓝图，先使用模块蓝图模板。单篇任务不机械执行完整模块流程，但必须明确职责。

## 三、优先级与边界

依次遵循当前用户要求、最近的目录级 `AGENTS.md`、根目录 `AGENTS.md`、本次任务适用规范、当前模块蓝图及既有局部风格。蓝图只细化模块知识和职责，不放宽事实、格式、安全或工程要求；蓝图中的技术结论仍须用可靠来源与实际验证核对。

阶段确认与暂停条件以[阶段流程](./process/workflow.md)和[质量门禁](./process/quality-gates.md)为准。不得用文件数、字数、标题数或构建成功替代内容完成度，也不得把规划路径当作已完成正文。

## 四、规范维护

1. 新增规则前先确定唯一归属；相同要求在其他文件只保留执行入口或验收引用。
2. 可机械判定的规则同步维护 `scripts/docs/check-content.mjs`，并在质量门禁中区分已实现检查与人工复查。
3. 移动、合并或删除文件时，同步更新根目录 `AGENTS.md`、本索引及规范、模板和蓝图中的链接与锚点。
4. 精简只合并重复表达；涉及规则含义变化时，列明差异并由用户确认。未经用户明确授权，不提交、推送、发布或部署。
