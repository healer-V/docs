---
title: "Java 已重构文档可读性修订记录"
tags:
  - Java
  - 文档规范
  - 可读性
excerpt: "登记 Java 前八章及 JUnit 样板共 66 篇文章的阅读层次修订，说明文字容器选型、长代码折叠、规范同步、源码一致性和页面验证结果，保留后续正文生成的执行基线。"
date: 2026-09-10
---

# Java 已重构文档可读性修订记录

本轮根据用户对连续文字阅读负担的反馈，修订 Java 前八章 65 篇正文和第九章 JUnit 样板，共 66 篇。单篇生成规范同步升级为 v1.2，文字前提、建议、误区与风险成为必须主动判断的表达形式。

本轮是已重构正文的阅读质量治理。目录、文章职责和学习顺序继续沿用已确认蓝图；第九章其余 10 篇尚未生成，不能把排版修订计为新增知识交付。

## 一、逐章修订范围

下表按真实文件统计最终状态，文字容器数量包含原有有效提示。数量用于核对范围，不作为以后每篇必须添加固定数量提示的配额。

| 顺序 | 章节 | 修订文章 | 文字容器 | 已折叠长代码 |
|---|---|---|---|---|
| 1 | Java 基础与开发环境 | 6 | 32 | 5 |
| 2 | Java 语法、数据类型与方法 | 9 | 44 | 12 |
| 3 | 面向对象与类型设计 | 12 | 53 | 11 |
| 4 | 核心 API 与常用数据 | 6 | 28 | 1 |
| 5 | 泛型与集合框架 | 9 | 42 | 16 |
| 6 | Lambda、Stream 与函数式处理 | 7 | 30 | 10 |
| 7 | 异常、I/O 与网络编程 | 10 | 44 | 12 |
| 8 | 注解、反射与动态能力 | 6 | 26 | 9 |
| 9 | 工程质量中的 JUnit 样板 | 1 | 10 | 4 |
| 合计 | 本轮已重构正文 | 66 | 309 | 80 |

## 二、阅读层次的处理方式

项目的[扩展语法示例](../../content/articles/blog/02-vitepress-markdown.md)和[Markdown 语法指南](../../content/articles/tools/02-markdown-guide.md)已经展示原生容器。普通技术文章统一采用 VitePress 的 `info`、`tip`、`warning`、`danger` 和 `details`，遵守仓库现有语法约定。

| 内容 | 处理方式 | 正文例子 |
|---|---|---|
| 环境与证据范围 | `info` 指出条件及其影响，保持展开 | [JUnit](../../content/backend/04-java/09-engineering-quality/08-junit.md)中的 Wrapper 与 Java 运行环境 |
| 可复用判断 | `tip` 保留建议、条件与原因 | [Map](../../content/backend/04-java/05-generics-collections/07-map.md)中的稳定键选择 |
| 容易误用的边界 | `warning` 紧邻对应机制或操作 | [函数式接口](../../content/backend/04-java/06-functional-processing/02-functional-interfaces-method-references.md)中的消费动作与事务边界 |
| 数据和安全风险 | `danger` 指明具体后果，危险操作前可见 | [枚举](../../content/backend/04-java/03-object-oriented-design/09-enums.md)的 ordinal 持久化，以及[反序列化](../../content/backend/04-java/07-exceptions-io-network/08-serialization-boundaries.md)的不可信输入 |
| 完整源码与长输出 | 超过 10 行放入默认折叠的 `details`，标题说明对象 | JUnit 的 POM、业务类、完整测试和故障类 |
| 原理与因果关系 | 保留连贯正文，参数和对照继续用表格 | 类型擦除、动态绑定、缓冲区状态等机制解释 |

逐篇阅读后选定提示段落，再按 Markdown 结构添加容器与折叠。首轮发现的 5 处相邻文字容器已处理：保留最需要强调的判断，其余解释恢复正文；反序列化风险提前到示例之前。没有把整节放进提示容器，也没有通过删注释、压缩代码或机械拆块规避折叠。

JUnit 保留两段不超过 10 行的关键局部代码，分别解释行为断言和异常后的状态检查；完整实现仍各保留一份。必要条件、运行入口、输出判断与失败恢复均可在折叠外阅读。

校读时修正了 BigDecimal 的一处原有事实错误：去尾随零后的负 `scale` 可发生在非零整数表示中，数值为零时返回 `scale` 为 0 的 `BigDecimal.ZERO`。修改依据为 [Java 21 stripTrailingZeros API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html#stripTrailingZeros())，未改变配套示例源码。

## 三、生成规范同步

后续生成必须先判断信息用途，再选择表达形式。对有适用前提、建议、误区或风险的长文，仅增加标题或折叠代码不满足阅读质量要求；正文原因说明和提示层次需要同时成立。

| 维护入口 | 本轮更新 |
|---|---|
| `AGENTS.md` | 增加 `info`，接入项目语法示例，明确文字提示选型、位置、标题和内容检查 |
| `standards/documentation/article-generation.md` | 升级 v1.2，新增文字容器与阅读层次规则，同步验收和三个可复用生成指令 |
| `standards/documentation/article-contracts.md` | 写入语义提示、展开条件、长文分布和避免堆叠的要求 |
| `standards/documentation/quality-gates.md` | 将容器语义、正文分布和可见性纳入复查，扫描只产生人工判断候选 |
| `standards/documentation/templates/sample-review-template.md` | 增加阅读重点、容器位置和后续校准证据 |

上表路径相对于仓库根目录。这些规范不属于 VitePress 发布页面，因此保留仓库路径，不生成无法访问的站内链接。

## 四、验证结果与证据

本轮优先验证实际改变的表达结构、渲染与链接。66 篇正文中的代码块与排版前逐块比较一致；JUnit 的两段新增局部片段另与已测试的完整源码核对，未调整业务实现、依赖或测试算法。

| 检查项 | 状态 | 证据与边界 |
|---|---|---|
| 正文结构与阅读候选 | 通过 | 66 篇标题文本和层级保持一致；无空小节、单句骨架、相邻文字容器或过长段落候选 |
| 长代码与文字可见性 | 通过 | 80 段长代码默认折叠，无多层 details；必要文字提示保持展开 |
| Markdown 与相对引用 | 通过 | 76 份正文、规范入口及状态记录一起解析，Frontmatter、标题编号、语言标识与目标路径有效 |
| JUnit 示例一致性 | 通过 | 5 份完整配置或源码逐字匹配；2 段局部代码来自完整测试中的连续内容 |
| JUnit 本轮回归 | 通过 | 离线 `clean verify` 退出 0；13 次执行、失败 0、错误 0、跳过 0，重新生成 JAR 与 XML |
| 桌面与手机预览 | 通过 | 390 × 844 与 1440 × 900 下提示标题、正文与折叠布局正常，页面无横向溢出；POM 可展开与收起，已恢复默认窗口尺寸 |
| 全站构建与 HTML 引用 | 通过 | VitePress 构建退出 0，耗时 165.24 秒；677 个 HTML、85,090 处引用，断链 0、缺失锚点 0；66 篇正文构建后的容器、代码与标题数量和 Markdown 渲染结果一致 |
| 变更范围 | 通过 | 本轮 76 份文件在允许范围内，其中 75 份修改、1 份新增；开工时 834 份文件中的其余 759 份摘要一致，暂存区保持原状 |

本地复查入口为 `.build/java-readability-v12/check-chapter.mjs` 和 `validate.mjs`；最终 Markdown、逐章计数、范围及构建 HTML 的比较结果保存在同目录 JSON 中。JUnit 回归记录为 `.build/java-junit-sample/v11-regression-result.json` 及其报告目录，该回归发生在文字容器调整之前，之后示例源码未变。

构建使用 `NODE_OPTIONS=--max-old-space-size=8192` 和 `pnpm docs:build --outDir D:/03-Other_project/DocsProject/docs/.build/java-readability-v12/site`。最终日志为 `.build/java-readability-v12/build-final.log`，站点引用报告为 `site-validation.json`；本记录的验收字段在构建后回填，并再次解析检查。首次构建发现的 5 个站点外规范链接已改为仓库路径说明，后续构建与引用扫描均通过。

前八章的 Java 正反例沿用原章节交付中的执行证据，本轮没有重新运行全部示例。文档脚本上次为 29/30 通过，剩余一项仍硬编码旧文章总数 656；本轮没有改构建脚本，也没有重复运行该组测试或把历史失败标为已修复。

预览复用已有服务 `http://127.0.0.1:5173/docs/`，本轮没有另起开发服务；该已有服务继续运行。

## 五、后续执行状态

后续文章采用 v1.2：先确定知识与示例闭环，再逐节组织正文、表格、短代码和文字提示，最后检查折叠与实际页面。不能把本轮的容器数量或具体标题复制成所有知识方向的固定模板。

Java 当前内容进度仍是前八章 65 篇及 JUnit 样板 1 篇。第九章继续条件和工程职责见 [JUnit 样板评审](./2026-09-10-java-junit-sample-review.md)与[实施计划](../plans/2026-09-02-java-spring-boot-learning-system-plan.md)；此次阅读反馈不记为对尚未生成内容的验收。
