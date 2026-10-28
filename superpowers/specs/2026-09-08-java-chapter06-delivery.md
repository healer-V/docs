---
title: "Java 第6章 Lambda、Stream 与函数式处理交付记录"
tags:
  - Java
  - Stream
  - 交付验证
excerpt: "记录 Java 第6章七篇正文、十四项知识与完整示例的核验，涵盖 Lambda 适配、变量捕获、Optional、流水线、归约和并行边界，以及旧文兼容、导航接入和站点工程检查。"
date: 2026-09-08
---

# Java 第6章 Lambda、Stream 与函数式处理交付记录

第6章围绕订单筛选、查询与统计，完成7篇正文、14项知识和7份独立源码。用户在第5章交付后继续授权推进，本批沿用已确认的[语言/API样板](./2026-09-08-java-generics-sample-review.md)，逐篇完成正文与正反例，再接入迁移和导航。当前内容与示例验证通过，工程验收通过。

## 一、文章与职责覆盖

文件编号独立从01到07连续；每篇对应两项主讲知识，稳定ID与[职责附件](./2026-09-08-java-article-responsibilities.md)一致。下表登记仓库源码路径，避免在ecosystem单元生成跨backend单元的页面链接。

| 顺序 | 文章与知识ID | 正式文章路径，相对仓库根 |
| --- | --- | --- |
| 6.1 | Lambda 表达式；J06-01.a/b | `content/backend/04-java/06-functional-processing/01-lambda.md` |
| 6.2 | 函数式接口与方法引用；J06-02.a/b | `content/backend/04-java/06-functional-processing/02-functional-interfaces-method-references.md` |
| 6.3 | Lambda 变量捕获；J06-03.a/b | `content/backend/04-java/06-functional-processing/03-variable-capture.md` |
| 6.4 | Optional；J06-04.a/b | `content/backend/04-java/06-functional-processing/04-optional.md` |
| 6.5 | Stream 流水线与常用操作；J06-05.a/b | `content/backend/04-java/06-functional-processing/05-stream-pipelines.md` |
| 6.6 | Collector 与归约；J06-06.a/b | `content/backend/04-java/06-functional-processing/06-collectors-reduction.md` |
| 6.7 | 并行流的使用边界；J06-07.a/b | `content/backend/04-java/06-functional-processing/07-parallel-streams.md` |

| 主讲职责 | 正文示例 | 实际证据 |
| --- | --- | --- |
| 目标类型、函数体适配、this | LambdaBasicsDemo | 正常适配与作用域差异；2个运行错误、3处编译错误 |
| 函数接口契约、组合与方法引用 | FunctionalCompositionDemo | 短路、组合顺序、四种引用与绑定；2个运行错误、1处编译歧义 |
| effectively final与状态捕获 | VariableCaptureDemo | 引用与对象、字段与快照、循环变量；2处编译错误 |
| 缺失值建模与转换 | OptionalQueryDemo | 默认值加载2次、map与flatMap的null边界；4个异常入口 |
| 惰性、中间操作与一次消费 | StreamPipelinesDemo | 终止前无追踪、短路、商品展开、排序与关闭；4个异常入口 |
| 单位元、结合性与Collector | CollectorsReductionDemo | 金额41800、客户分组、重复键策略、零值分组；2个异常入口与2个确定性错误模型 |
| 无干扰、无状态与并行选择 | ParallelStreamsDemo | 顺序/并行金额一致、四种规模的独立公式、三种公共池配置、顺序回退及2个状态模型 |

全模块仍为14章123篇、247项知识，本轮只把J06的14项改为已覆盖，不把第7章以后的规划知识标为已验收。

## 二、源码与执行证据

验证环境为Windows PowerShell、Corretto 21.0.11、javac 21.0.11。7份正文程序均使用JDK标准库，无需Maven、数据库或外部服务。五笔订单采用一致的编号、客户、状态和金额；各文章按职责保留所需字段投影。

| 检查 | 实际结果 | 证明范围 |
| --- | --- | --- |
| 正文提取与源码比对 | 7份完整源码逐字一致，另提取6份静态错误程序 | 剥离文件位置首行后，比对并重新编译正文代码 |
| 正常源码编译 | 7份编译通过，无警告；Xlint、doclint、Werror全部开启 | 类型、JavaDoc语法与JDK 21兼容 |
| 正常运行 | 7个入口使用断言运行，均退出0，输出逐行匹配正文 | 当前场景的结果、状态和边界 |
| 运行失败 | 14个入口均退出1，异常类型与说明一致 | 见下方分组；故意失败不作为工程失败 |
| 静态错误 | 6份程序各退出1、各1处编译错误 | 目标类型、返回值、受检异常、重载歧义、重赋值捕获与循环索引 |
| 并行对照 | 并行度2、并行度1及默认配置均通过相同断言 | 四种输入规模为0、1、16、10000；结果同时符合独立公式 |
| 反例模型 | 减法分组5与9；共享identity重复；前缀分段20与14；丢失更新2与1 | 明确构造的确定性模型，不冒充实际竞态、线程调度或性能数据 |

逐篇日志在 `.build/java-chapter06/checks-*.json`，最终正文提取与复核报告在 `.build/java-chapter06/final-verification.json`。临时验证材料可按正文重新生成，不作为站点正文或外部服务产物。

| 故障分组 | 模式 | 实际异常 |
| --- | --- | --- |
| Lambda | negative；checked | IllegalArgumentException；IOException |
| 接口组合与方法引用 | null-receiver；consumer-failure | NullPointerException；IllegalStateException |
| Optional | empty-get；flatmap-null；of-null；lookup-failure | NoSuchElementException；NullPointerException；NullPointerException；IllegalStateException |
| Stream | reuse；null-first；readonly；source-mutation | IllegalStateException；NullPointerException；UnsupportedOperationException；ConcurrentModificationException |
| Collector | duplicate-key；null-result | IllegalStateException；NullPointerException |

故障在独立本地进程触发，不写外部业务数据；按正文修正输入或操作后重新执行即可。ArrayList非法干扰的异常、count省略peek等观测均限定到示例与具体实现，不外推为所有实现的固定行为。

## 三、内容、格式与边界核验

| 检查项 | 结果 |
| --- | --- |
| 技术事实 | 按Java 21 JLS及具体API核对；不使用旧文作为技术依据 |
| 内容深度 | 定义、机制、选择条件与正反例逐项对应职责；没有用标题数量替代完成度 |
| 关键区分 | 缺失不等于失败；捕获引用不等于冻结对象；消费不等于关闭；toList容器契约不同；有序结果不等于顺序执行 |
| 文章结构 | 7篇Frontmatter与唯一H1一致，47个H2连续编号，无H3/H4骨架 |
| 示例格式 | 37个代码围栏均有语言标识且闭合；正文包含文件位置、环境、命令、实际输出和处理方式 |
| 注释 | 新增类、构造器、方法及回调均说明职责；多参数声明使用JavaDoc说明每个参数与返回或副作用 |
| 职责边界 | 比较契约引用第5章；线程调度、JMM与ForkJoinPool源码保留给并发章 |
| 性能边界 | 未提供加速倍数、数据量阈值或推荐生产线程数；输入规模对照只证明结果 |

## 四、旧文迁移与导航

两篇旧文已完整读取后按职责重写或拆分。旧文件退出主讲，新7篇全部存在后才接入sidebar；Java正式导航连续覆盖前六章49篇。

| 旧路径，位于03-collections-and-data | 新入口，位于06-functional-processing | 内容处理 |
| --- | --- | --- |
| 08-optional.md | 04-optional.md | 保留缺失建模与转换职责，补齐默认值次数、null边界与查询失败 |
| 09-stream-api.md | 05-stream-pipelines.md | 流水线主讲保留在05，归约与并行拆为06、07并用相对链接承接 |

两条旧HTML路径在 `scripts/baselines/route-redirects.json` 增加直接映射。它们在生产基线中均为local-only，production为null；基线虽然登记本地旧标题锚点，但没有这两页的生产锚点。本批提供页面级兼容并传递查询参数和片段，不声称旧本地标题语义逐一保留。

已搜索正文、sidebar和相关配置引用。当前正式入口均指向新文，职责映射表和生产基线保留旧路径作为历史证据。nav、生产基线及其他章节正文不改。

## 五、站点工程与修改范围

所有检查基于本地真实产物；本批没有启动预览服务。全站构建验证全部Markdown，装配使用本轮依次重建的backend、ecosystem及其余5个既有单元产物。

| 检查项 | 实际结果 | 证据位置，相对仓库根 |
| --- | --- | --- |
| VitePress全站构建 | 退出0，179.53秒；669个HTML页面 | `.build/java-chapter06/full-build.log` |
| 全站引用检查 | 83,995处引用；断链0、缺失锚点0、问题0 | `.build/java-chapter06/full-site-validation.json` |
| backend串行重建 | 退出0，255页，43.677秒 | `.build/java-chapter06/backend-build.log` |
| ecosystem串行重建 | 退出0，126页，70.447秒 | `.build/java-chapter06/ecosystem-build.log` |
| 整站装配 | 668条正式路由、50条兼容路由，无归属或摘要冲突 | `.build/java-chapter06/assembly-report.json` |
| 装配后引用检查 | 719个HTML、84,095处引用；断链0、缺失锚点0、问题0 | `.build/java-chapter06/assembled-site-validation.json` |
| 生产路由基线 | 398条全部保留；374条直接页面、24条兼容入口；缺失路由与锚点均为0 | `.build/java-chapter06/route-baseline-report.json` |
| 两个旧入口 | 跳转、canonical、查询参数与片段传递均已核对，无重定向链 | `.build/java-chapter06/compatibility-pages.json` |
| 最终记录渲染 | 11份受影响Markdown逐一检查，无异常内联HTML与Vue模板错误 | `.build/java-chapter06/render-check.json` |
| 修改范围 | 22个文件变化；范围外783个现存文件摘要未变，暂存区未变 | `.build/java-chapter06/change-audit.json` |
| 空白与冲突 | 目标路径git差异及新增文件尾空白、冲突标记扫描均通过 | `.build/java-chapter06/whitespace-check.json` |

构建和装配后只回填真实结果与阶段状态，这些最终文本再作Markdown与Vue模板定点检查。生产路由基线保持原状；前五章正文、源码和历史交付记录均未修改。上述工程检查不作为生产发布操作。

## 六、后续范围

本批结束后继续第7章“异常、I/O与网络编程”的10篇职责。工程、数据库、并发、诊断和双JDK迁移仍遵循各自样板门禁，不因为本章包含并行流就认为并发章样板已经完成。

本次不重跑第1～5章示例，不执行Java 8运行、性能基准、数据库事务或远程服务压测。没有执行搜索索引重建、浏览器发布回归、提交、推送或部署；本批结果用于本地文档交付。
