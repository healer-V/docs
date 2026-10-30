---
title: "Java 21 主线与 Java 8 维护线模块蓝图（2026-09-08 修订）"
tags:
  - Java
  - 知识体系
  - 目录规划
excerpt: "基于现有 Java 模块和已确认的 Java 21 主线，规划十四章知识结构、逐篇职责、必要依赖、验证方式与历史内容迁移边界，兼顾个人长期积累、工作查询和对外分享。"
date: 2026-09-08
---

# Java 21 主线与 Java 8 维护线模块蓝图（2026-09-08 修订）

Java 模块定位为“能够持续积累、按问题查询并对外分享的 Java 核心知识体系”。内容从 Java 自身的语法和对象模型开始，逐步建立标准库使用、工程交付、数据访问、并发、运行机制和诊断能力。

用户已于 2026-09-08 确认本方案，并于 2026-09-10 要求按最新两份执行规范重构全部 Java 目录和正文、删除无用历史专题。当前 **14 章、123 篇**已全部落地，稳定知识 ID 与职责边界继续沿用；前八章按最新命名和结构约束复核，第9～14章补齐正文、示例与运行证据。篇数不代替内容与行为验证。

| 交付项 | 说明 |
| --- | --- |
| 当前阶段 | 全123篇正文已落地，62篇剩余历史正文退出，十四章导航已接入；完整结果见[全量重构记录](../../../superpowers/specs/2026-09-10-java-full-refactor.md) |
| 阅读质量修订 | 前八章与 J09-08 共 66 篇已按单篇规范 v1.2 整理文字提示和长代码折叠，范围及复验状态见[可读性修订记录](../../../superpowers/specs/2026-09-10-java-readability-revision.md)；不增加已交付篇数 |
| 标题与深度复审 | 按单篇规范 v1.3 逐篇复审同一范围，33 篇调整、33 篇保留；不设置三级或四级标题配额，逐篇依据与验证范围见[结构深度复审记录](../../../superpowers/specs/2026-09-10-java-structure-depth-revision.md) |
| 目标目录 | `content/backend/04-java/`，相对仓库根 |
| 完整执行附件 | [文章职责、247 个知识项和历史路径映射](./04-java-responsibilities.md) |
| 与旧蓝图关系 | 替代 2026-09-01 蓝图的当前执行职责；旧稿保留为历史基线，既有样板与章节交付记录仍可追溯 |
| 规划数量 | 123 个文章职责、247 个知识项；正文归属与规则已逐项核对，不宣称覆盖 Java SE 全部 API |
| 现状核对口径 | 按验证批次区分新实测与历史证据；2026-09-12 从空目录复跑13个独立 Java 程序和 JUnit 13项测试，其余运行结果沿用已登记记录 |
| 最新执行规范 | 目录规范 v1.1、单篇规范 v1.5；沿用准确命名与语义层级，示例按本篇空目录独立复现，验证结果见[独立示例修订记录](../../../superpowers/specs/2026-09-11-java-standalone-examples.md) |
| 2026-09-12 复核 | 目录与 Markdown 结构完成全量检查；本轮修订18篇正文，重点处理仓库起点残留、片段误标、示例一致性和运行说明顺序，语义复查范围见执行附件 |
| 输出位置 | 本文件与职责附件是仓库维护入口；分析目录中的 2026-09-08 中文稿保留为确认时的快照 |

## 一、定位、版本与范围

### 1. 模块契约

先以 Java 语言与直接运行模型建立主线，工程和数据库接入只展开完成 Java 应用目标所需的部分。读者可以对 Java 零基础，但应具备基本编程和计算机常识。

| 维度 | 设计约束 |
| --- | --- |
| 主知识方向 | 编程语言：Java 语法、类型系统、对象模型、常用标准库及直接运行机制 |
| 辅助方向 | Java 工程、JDBC 数据访问、运行诊断；各自不扩成第二套技术百科 |
| 主要读者 | 有基本编程常识，希望系统学习 Java；已有经验者可凭职责卡按问题定位 |
| 使用场景 | 系统学习、工作中查找规则与边界、复用经过验证的示例、维护旧项目 |
| 语言与运行主线 | 延续已确认的 Java 21 LTS；只使用该版本正式特性，示例标注具体 JDK 发行版和补丁版本 |
| 维护线 | Java 8：旧代码阅读、差异速查、真实双运行时验证与升级；不再复制基础教程 |
| 构建主线 | Maven；本地核对为 Maven 3.9.11。Gradle 达到阅读、执行和基础迁移深度 |
| 跨方向前置 | 文件与终端操作；进入网络、JDBC、诊断时分别补充所需 TCP/HTTP、关系表/SQL、进程与内存常识 |
| 排除 | Spring/Boot 机制、ORM、数据库内核、分布式系统、容器平台、完整算法课程；由对应独立模块负责 |
| 延伸而非必修 | Java 25 演进、JavaFX/AWT、JNI/FFM、完整密码学、编译器插件、Selector/Reactor、专门基准框架；若未来纳入，单独确认目标和职责 |

### 2. 版本与环境分层

主线版本沿用既有决定，不因新版本发布自动调整。语言与库范围以 [Java SE 21 语言规范](https://docs.oracle.com/javase/specs/jls/se21/html/index.html) 和 [Java SE 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/index.html) 为准。Java 8 的差异按 [Java SE 8 文档](https://docs.oracle.com/javase/8/docs/) 单独核验。

| 对象 | 目前依据 | 正文生成时的要求 |
| --- | --- | --- |
| Java 21 | 本轮命令输出：Corretto 21.0.11，javac 21.0.11 | 在每个实际示例环境中记录发行版和补丁版本；运行机制区分规范与实现 |
| Maven | 3.9.11，运行JDK为21.0.11；J09-08固定Wrapper3.3.4及发行包SHA-256 | 已验证独立缓存下载与离线重建；Compiler3.14.1、Surefire3.5.4及实际构建插件均已固定 |
| JUnit | J09-08固定BOM与Jupiter6.1.2，依赖树已核对 | 13次正常测试通过，故障与零测试分别验证；不直接复用为Java8运行测试模板 |
| SLF4J、Mockito、H2、HikariCP | SLF4J 2.0.18、Logback 1.5.38、Mockito 5.23.0；H2 2.4.240、HikariCP 7.0.2 | 第9章17项 Maven 测试、第10章22项 H2 测试通过；日志、异常和资源证据见正文 |
| Gradle | 固定 Gradle 9.0.0 Wrapper 与发行包 SHA-256 | 13项正常测试通过；有意引入失败后确认构建失败，再恢复并复验 |
| Java 8 | 本机 JDK 1.8.0_491，使用显式 Maven Toolchains | Java 8 与 Corretto 21.0.11 各执行8项业务测试；另验证 API 和 Class 加载失败 |
| 数据库和网络 | JDBC 使用进程内 H2；未执行外部生产数据库与容器集成 | H2 结果不推导 MySQL/PostgreSQL 兼容性；网络与进程诊断仅使用本地受控示例 |

### 3. 组织方案比较

本次确认沿用十四章，因为语言、库、工程与运行诊断已有清晰责任边界，且前四章已落地。调整主要集中在后续文章粒度和必要前置。

| 方案 | 收益 | 代价 | 结论 |
| --- | --- | --- | --- |
| 保留十四章，局部调整文章职责 | 兼容已完成内容，继续已有主线；可按章增量实施 | 需维护新旧路径和职责映射 | 推荐 |
| 继续按历史专题目录增补 | 短期编辑量小 | 新基础章与旧专题编号交错，Lambda 等知识主讲分散 | 不作为目标结构 |
| 改成二十章以上的细粒度目录 | 每个专题入口更独立 | 扩大目录迁移，容易把两三条规则拆成薄弱章节 | 当前不采用 |

## 二、现状与本次调整

### 1. 真实资产与规划区分

目录规划时，Java 目录共清点到 117 个 Markdown 文件。其中前四个目标章节有 33 篇及交付记录，另外 84 篇仍在历史专题路径。这是目录确认时的历史快照；第5章新增9篇并迁移7篇旧文，第6章新增7篇并迁移2篇旧文，第7章新增10篇并迁移10篇旧文，第8章新增6篇并迁移3篇旧文，各批次另行登记。历史数量不能证明目标职责已经实现。

| 资产 | 本轮识别结果 | 设计处理 |
| --- | --- | --- |
| 第1～4章 | 6 + 9 + 12 + 6 = 33 篇；存在样板和章节交付记录 | 保留目录、文件名、编号和已确认主讲职责；本稿细化知识项另标复核状态 |
| 历史专题 | 目录确认时84篇，前次已迁移22篇；本次剩余62篇已审计、迁移或退出主线 | 删除六个旧专题目录及三个前次遗留空目录；Java 25 两篇独立专题退出，混合迁移文章保留通用方法 |
| 正式导航 | Java 入口仍指向第1章概述；sidebar接入14章123篇 | 只展示真实正文；删除全部“历史专题／待迁移”分组 |
| 路径兼容 | 已有 published-routes 与 route-redirects 基线 | 继续沿用既有兼容机制，拆分文章时另核锚点归属 |
| 当前工作区 | 存在多类未提交改动 | 本次范围为 Java 正文、配套示例、执行记录、必要导航和路由，以及完成站点验证所需的构建修正与测试；按初始摘要保护范围外文件及暂存区 |

### 2. 相对旧蓝图的修订

文章 ID 沿用旧蓝图的 `J章号-职责号`，用于稳定引用；它与文件的阅读序号分开。比如 J05-08 调整到第5章第4篇，ID 不变。附录列出每个 ID 的目标路径。

| 范围 | 调整 | 原因 |
| --- | --- | --- |
| 第5章，9篇不变 | 把迭代、比较与排序从第8篇提前到第4篇 | TreeSet、TreeMap 和 PriorityQueue 使用比较契约前，应先建立比较规则 |
| 第6章，6→7篇 | 拆开 Collector/归约与并行流边界 | 前者负责结果组合，后者负责并行适用条件；线程调度由并发章解释 |
| 第7章，9→10篇 | Socket 与 HttpClient 各自成篇 | 消息边界和 HTTP 状态/响应处理使用不同的验证闭环；历史正文也已分开 |
| 第8章，5→6篇 | 动态代理与 Method Handle 各自成篇 | 调用拦截与类型化调用各自有独立模型、异常和验证 |
| 第10章，9→10篇 | 数据访问测试与安全/性能分开 | 测试负责数据库行为证据；安全性能负责输入与调用成本 |
| 第11章，10→12篇 | 协调工具与并发集合拆开；新增 ThreadLocal 职责 | 信号协作、容器语义和线程复用上下文是三个独立问题 |
| 第11章，原职责细化 | Executor 篇明确包含 Callable/Future、调度与工作窃取边界 | 避免只有线程池参数而缺少任务结果、取消和容量生命周期 |
| 第14章及延伸 | Java 8→21 为维护主线；按本次用户要求移除 Java 25 独立历史专题 | 旧入口转向范围说明，不将后续版本能力当作 Java 21 已有能力 |

## 三、知识覆盖与章节职责

### 1. 编程语言覆盖模型

目录先覆盖当前语言自身的规则，再扩展直接相关的工程能力。具体知识项采用稳定后缀，例如 J02-08.a 为方法声明调用，J02-08.b 为按值传递；每项只归属一篇主讲文章。

| 方向要求 | 主讲位置 | 规划证据 |
| --- | --- | --- |
| 环境、工具与程序入口 | 第1章 J01-01～06 | 安装、编译、运行与调试闭环 |
| 词法、变量、类型、表达式与控制流 | 第2章 J02-01～07 | 合法/非法程序与边界输入验证 |
| 方法与对象组合 | 第2章 J02-08/09、第3章 | 值传递、初始化、访问、分派、契约和模型取舍 |
| 常用数据、容器与函数式表达 | 第4～6章 | 文本/金额/时间、集合契约、流水线与归约结果 |
| 错误、资源和通信 | 第7章 | 异常传播、资源关闭、文件与网络的成功/失败结果 |
| 元数据与动态能力 | 第8章 | 声明/消费边界、访问失败与调用类型验证 |
| 模块、构建、日志、测试与调试 | 第9章 | 包/JAR/JPMS、可重建工程、日志、测试报告与失败构建 |
| 数据访问集成 | 第10章 | 真实连接、SQL、映射、事务、池和集成测试 |
| 并发与内存语义 | 第11章 | 任务状态、同步论证、受控并发反例和清理 |
| 直接运行机制 | 第12章 | 字节码、数据区、加载、JIT、GC 与运行证据 |
| 诊断和演进 | 第13～14章 | 故障证据、恢复对照、版本兼容与迁移回归 |

### 2. 十四章总览

下表是目标章节边界。章节内的必要前置以附录知识项为准；编号表示推荐顺序，不表示必须先通读所有前章。

| 序号 | 章节目录 | 章节职责 | 篇数 | 状态 |
| --- | --- | --- | --- | --- |
| 01 | `01-language-foundation/` | 基础与环境 | 6 | 正文已落地 |
| 02 | `02-language-syntax/` | 语言语法 | 9 | 正文已落地 |
| 03 | `03-object-oriented-design/` | 面向对象 | 12 | 正文已落地 |
| 04 | `04-core-apis/` | 常用 API | 6 | 正文已落地 |
| 05 | `05-generics-collections/` | 泛型与集合 | 9 | 正文已落地 |
| 06 | `06-functional-processing/` | 函数式处理 | 7 | 正文已落地 |
| 07 | `07-exceptions-io-network/` | 异常、I/O 与网络 | 10 | 正文已落地 |
| 08 | `08-annotations-reflection/` | 注解与反射 | 6 | 正文已落地 |
| 09 | `09-engineering-quality/` | 工程与质量 | 11 | 正文已落地 |
| 10 | `10-data-access/` | JDBC 与事务 | 10 | 正文已落地 |
| 11 | `11-concurrency/` | 并发编程 | 12 | 正文已落地 |
| 12 | `12-jvm-runtime/` | JVM 运行机制 | 9 | 正文已落地 |
| 13 | `13-production-diagnostics/` | 生产诊断 | 9 | 正文已落地 |
| 14 | `14-java8-maintenance/` | Java 8 维护与迁移 | 7 | 正文已落地 |

## 四、完整目标目录

以下均为实际正文路径，每章文章独立从 01 连续编号，共123篇。章节名与正式导航保持一致。目录展开较长，放入折叠块供查阅。

::: details 查看十四章完整目录

```text
content/backend/04-java/
├── 01-language-foundation/  # 基础与环境
│   ├── 01-overview.md  # Java 概述
│   ├── 02-java-platform.md  # Java 平台
│   ├── 03-jdk-jre-jvm.md  # JDK、JRE 与 JVM
│   ├── 04-install-jdk21.md  # JDK 21 环境配置
│   ├── 05-first-program.md  # 第一个 Java 程序
│   └── 06-compile-run-debug.md  # 编译、运行与调试
├── 02-language-syntax/  # 语言语法
│   ├── 01-basic-syntax.md  # Java 基础语法
│   ├── 02-variables-constants-scope.md  # 变量、常量与作用域
│   ├── 03-data-types.md  # 基本数据类型
│   ├── 04-reference-arrays-null.md  # 引用类型、数组与 null
│   ├── 05-operators-conversions.md  # 运算符与类型转换
│   ├── 06-conditionals.md  # 条件分支
│   ├── 07-loops.md  # 循环控制
│   ├── 08-methods-parameters-return.md  # 方法、参数与返回值
│   └── 09-overload-varargs-recursion.md  # 方法重载、可变参数与递归
├── 03-object-oriented-design/  # 面向对象
│   ├── 01-classes-objects.md  # 类与对象
│   ├── 02-constructors-initialization.md  # 构造器与对象初始化
│   ├── 03-packages-access-encapsulation.md  # 包、访问控制与封装
│   ├── 04-inheritance-composition.md  # 继承与组合
│   ├── 05-polymorphism-dynamic-binding.md  # 多态与动态绑定
│   ├── 06-abstract-classes-interfaces.md  # 抽象类与接口
│   ├── 07-object-contract.md  # Object 通用契约
│   ├── 08-nested-anonymous-classes.md  # 嵌套类与匿名类
│   ├── 09-enums.md  # 枚举
│   ├── 10-records-immutability.md  # Record 与不可变对象
│   ├── 11-sealed-pattern-matching.md  # 密封类型与模式匹配
│   └── 12-solid-design-patterns.md  # SOLID 与设计模式
├── 04-core-apis/  # 常用 API
│   ├── 01-string-text-blocks.md  # 字符串与文本块
│   ├── 02-wrapper-autoboxing.md  # 包装类型与自动装箱
│   ├── 03-math-random-uuid.md  # Math、随机数与 UUID
│   ├── 04-big-numbers.md  # BigInteger 与 BigDecimal
│   ├── 05-date-time.md  # 日期时间 API
│   └── 06-regular-expressions.md  # 正则表达式与文本处理
├── 05-generics-collections/  # 泛型与集合
│   ├── 01-generic-types-methods.md  # 泛型类、接口与方法
│   ├── 02-bounds-wildcards-erasure.md  # 泛型边界与类型擦除
│   ├── 03-collection-framework.md  # 集合框架
│   ├── 04-iteration-comparison-sorting.md  # 迭代、比较与排序
│   ├── 05-list.md  # List
│   ├── 06-set.md  # Set
│   ├── 07-map.md  # Map
│   ├── 08-queue-deque.md  # Queue 与 Deque
│   └── 09-immutable-sequenced.md  # 集合可变性与顺序
├── 06-functional-processing/  # 函数式处理
│   ├── 01-lambda.md  # Lambda 表达式
│   ├── 02-functional-interfaces-method-references.md  # 函数式接口与方法引用
│   ├── 03-variable-capture.md  # Lambda 变量捕获
│   ├── 04-optional.md  # Optional
│   ├── 05-stream-pipelines.md  # Stream 流水线
│   ├── 06-collectors-reduction.md  # Collector 与归约
│   └── 07-parallel-streams.md  # 并行流
├── 07-exceptions-io-network/  # 异常、I/O 与网络
│   ├── 01-exception-hierarchy.md  # Java 异常体系
│   ├── 02-catching-propagation.md  # 异常捕获与传播
│   ├── 03-custom-error-design.md  # 自定义异常与错误设计
│   ├── 04-resource-lifecycle.md  # 资源管理与自动关闭
│   ├── 05-path-files.md  # Path 与 Files
│   ├── 06-byte-character-streams.md  # 字节流、字符流与字符编码
│   ├── 07-nio-buffers-channels.md  # NIO 缓冲区与通道
│   ├── 08-serialization-boundaries.md  # 序列化与数据交换边界
│   ├── 09-socket-programming.md  # Socket 与应用消息边界
│   └── 10-http-client.md  # HttpClient
├── 08-annotations-reflection/  # 注解与反射
│   ├── 01-annotations-meta.md  # 注解与元注解
│   ├── 02-custom-annotations.md  # 自定义注解
│   ├── 03-class-reflection.md  # Class 与反射 API
│   ├── 04-generic-type-information.md  # 泛型类型信息
│   ├── 05-dynamic-proxies.md  # JDK 动态代理
│   └── 06-method-handles.md  # Method Handle
├── 09-engineering-quality/  # 工程与质量
│   ├── 01-project-packages.md  # Java 工程结构
│   ├── 02-maven-pom-lifecycle.md  # Maven 构建生命周期
│   ├── 03-maven-dependencies.md  # Maven 依赖管理
│   ├── 04-maven-plugins-profiles-toolchains.md  # Maven 构建配置
│   ├── 05-maven-multi-module.md  # Maven 多模块
│   ├── 06-jar-classpath-jpms.md  # JAR 与模块系统
│   ├── 07-slf4j-logging.md  # SLF4J 日志
│   ├── 08-junit.md  # JUnit 单元测试
│   ├── 09-mockito-test-doubles.md  # Mockito 测试替身
│   ├── 10-debug-quality-build.md  # 调试与构建检查
│   └── 11-gradle-reading-migration.md  # Gradle 构建基础
├── 10-data-access/  # JDBC 与事务
│   ├── 01-jdbc-drivers.md  # JDBC 与数据库驱动
│   ├── 02-datasource-connections.md  # DataSource 与连接生命周期
│   ├── 03-prepared-statements.md  # PreparedStatement 参数绑定
│   ├── 04-resultset-mapping.md  # ResultSet 类型映射
│   ├── 05-transactions-isolation.md  # JDBC 事务与隔离
│   ├── 06-batch-generated-keys.md  # JDBC 批处理与生成键
│   ├── 07-pools-timeouts-capacity.md  # 连接池与超时预算
│   ├── 08-dao-repository-errors.md  # Repository 与异常转换
│   ├── 09-data-access-testing.md  # 数据访问测试
│   └── 10-security-performance.md  # 数据访问安全与性能
├── 11-concurrency/  # 并发编程
│   ├── 01-threads-lifecycle.md  # 线程与生命周期
│   ├── 02-thread-safety-shared-state.md  # 线程安全与共享状态
│   ├── 03-jmm-volatile.md  # Java 内存模型与 volatile
│   ├── 04-synchronized-monitors.md  # synchronized 与监视器
│   ├── 05-lock-condition.md  # Lock 与 Condition
│   ├── 06-atomics-cas.md  # 原子类与 CAS
│   ├── 07-coordination-utilities.md  # 并发协调工具
│   ├── 08-concurrent-collections.md  # 并发集合
│   ├── 09-executors-thread-pools.md  # 执行器与线程池
│   ├── 10-thread-local.md  # ThreadLocal 与上下文
│   ├── 11-completable-future.md  # CompletableFuture 异步组合
│   └── 12-virtual-threads.md  # 虚拟线程
├── 12-jvm-runtime/  # JVM 运行机制
│   ├── 01-jvm-execution.md  # JVM 执行模型
│   ├── 02-runtime-data-areas.md  # 运行时数据区
│   ├── 03-object-allocation-references.md  # 对象分配与引用
│   ├── 04-class-bytecode.md  # Class 文件与字节码
│   ├── 05-class-loading.md  # 类加载与初始化
│   ├── 06-interpreter-jit.md  # 解释执行与 JIT
│   ├── 07-gc-foundations.md  # 垃圾收集基础
│   ├── 08-gc-collectors.md  # 垃圾收集器选型
│   └── 09-jvm-options-gc-jfr.md  # JVM 参数与运行观测
├── 13-production-diagnostics/  # 生产诊断
│   ├── 01-diagnostic-method.md  # 生产诊断方法
│   ├── 02-process-jcmd.md  # 进程与 jcmd
│   ├── 03-high-cpu.md  # 高 CPU 诊断
│   ├── 04-thread-dumps.md  # 线程转储与死锁
│   ├── 05-heap-memory-leaks.md  # 堆内存泄漏诊断
│   ├── 06-gc-pauses.md  # GC 暂停诊断
│   ├── 07-native-metaspace-classloading.md  # 本地内存与类加载诊断
│   ├── 08-io-pools-latency.md  # I/O 与连接池延迟
│   └── 09-live-diagnostics-review.md  # 在线诊断与复盘
└── 14-java8-maintenance/  # Java 8 维护与迁移
    ├── 01-release-lts-baselines.md  # Java 版本与支持基线
    ├── 02-language-differences.md  # Java 8 与 21 语法差异
    ├── 03-api-collection-differences.md  # Java 8 与 21 API 差异
    ├── 04-concurrency-jvm-differences.md  # Java 8 与 21 运行差异
    ├── 05-reading-legacy-code.md  # Java 8 旧代码重构
    ├── 06-multi-jdk-toolchains.md  # 多 JDK 与 Toolchains
    └── 07-java8-to-21-migration.md  # Java 8 升级 Java 21
```

:::

每篇示例由该文章给齐所需代码、配置和执行步骤，读者从自建空目录复现。现有概述继续作为 Java 入口，不另设只有计划链接的空首页。

## 五、依赖、引用与阅读顺序

### 1. 必要依赖与跨章边界

附录为每个知识项登记必要前置。本轮检查了所有 ID 的存在性、唯一主讲及目录顺序；每条内部依赖均指向更早出现的职责，因此不存在循环。外部前置在各章契约中单列。

| 使用主题 | 必要前置 | 边界处理 |
| --- | --- | --- |
| 面向对象 | 引用、方法和初始化 | 不要求先学集合；Object 契约只借最小标准 API 演示 |
| 有序集合 | 泛型、相等性、比较器 | 比较排序提前；第5章比较器示例先用显式类，Lambda 写法由第6章负责 |
| Stream | 泛型、集合、函数接口 | Collector 先证明归约规则，再讨论并行适用条件 |
| 并行流 | 归约与无状态处理 | 不把线程池/JMM 硬塞成前向前置；ForkJoinPool 的任务调度归 J11-08 |
| I/O 和网络 | 异常与资源生命周期 | 先掌握关闭和失败传播；HTTP 同步调用先闭合，异步阶段组合归 J11-09 |
| 反射与代理 | 接口、异常；泛型元数据另需擦除 | 代理展开目标异常所需的异常基础必须已经建立 |
| JUnit 与构建 | 包、接口、异常、Maven | 不要求先通读反射、并发或 JVM |
| JDBC | 资源管理、依赖配置和 SQL 常识 | 连接池从借还和容量预算讲起，不以线程池内部实现为前置 |
| ThreadLocal | 线程封闭与 Executor 任务复用 | 重点是任务结束后的清理和跨异步边界，不能只讲 get/set |
| JVM | 对象、字节码/类路径和线程基础 | 不同运行机制各有精确前置，不要求整个并发模块 |
| 生产诊断 | 工具基线及对应故障机制 | CPU、堆、池等待等专题分别引用其机制文章 |
| Java 8 维护 | 对应语法/API/并发/构建知识 | 按工作问题进入，不设置“先读完十三章”的门槛 |

### 2. 唯一主讲与检索方式

知识在唯一主讲处解释完整，其他文章保留足够上下文并引用。维护线解释版本差异，不重复建立第二套定义。专题间有相互引用时，要区分“进一步解释”和“使用本文前必须掌握”，后者才登记为依赖。

正文标题围绕技术主题命名，不固定插入“学习目标、实践任务、验收标准”，也不写“上一篇/下一篇”。文章顺序由文件编号和 sidebar 表达；按问题查询通过清晰标题、少量稳定标签、摘要与搜索完成。

## 六、能力闭环与样板策略

### 1. 能力覆盖矩阵

下表区分已验证能力与后续验证目标，当前状态以相应章节的正文和执行证据为准。知识与文章的逐项关系见附录；已有交付记录只支持其交付范围，不直接证明其他新增细项已覆盖。

| 最终能力 | 支撑知识/文章 | 验证方式 | 当前状态 |
| --- | --- | --- | --- |
| 独立编译、运行与排错 | J01-04.a～J01-06.b | 命令输出、编译产物、失败定位 | 既有交付记录；本轮未复跑 |
| 编写并解释 Java 语言程序 | J02-01～09、J03-01～11 的知识项 | 有效/非法程序、类型规则和状态断言 | 正文细项已复核；运行证据沿用既有交付 |
| 设计清晰的业务对象并处理常用数据 | J03-07/10/12、J04-01～06 | 订单值对象、金额/时间边界与设计反例 | 既有交付记录；本轮未复跑 |
| 选择集合并构造正确数据流水线 | J05-01～09、J06-01～07 | 去重/排序、分组/归约与反例 | 第5章18项及第6章14项已覆盖；流水线正常、失败与并行等价证据已核对 |
| 完成文件与网络操作并处理失败 | J07-01～10 | 本地文件/服务成功、超时、关闭与错误传播 | 20项已覆盖；10个正常入口、29个运行失败及4处编译错误已核对 |
| 解释注解消费和动态调用 | J08-01～06 | 元数据可见性、代理和调用类型证据 | 12项已覆盖；6个正常入口、13个运行失败、4处编译错误及2组javap证据已核对 |
| 可重复地构建和测试工程 | J09-01～11 | 干净构建、报告、依赖树、失败规则 | Maven 17项、Gradle 13项测试通过；版本拒绝、类型告警与 JPMS 访问失败已复现 |
| 安全访问数据库并证明事务结果 | J10-01～10 | 目标数据库状态与集成测试 | H2 22项测试通过；回滚、保存点、映射、SQL 注入与池超时已验证 |
| 管理并发任务、共享状态和上下文 | J11-01～12 | 受控交错、内存语义论证、取消/清理/关闭 | 30项测试通过；受控竞态、取消、任务复用和虚拟线程 pinning 已核对 |
| 把程序行为映射到 JVM 证据 | J12-01～09 | javap、加载/编译事件、GC/JFR | 字节码、初始化、类身份、JIT、四类收集器及双堆配置实测通过 |
| 诊断并恢复可复现运行故障 | J13-01～09 | 故障—证据—处理—恢复对照 | CPU、死锁、堆引用、GC、NMT、类加载器及连接等待均有本地证据与恢复对照 |
| 维护 Java 8 并迁移到 21 | J14-01～07 | 两套运行时、行为回归和回退记录 | Java 8/21 各8项测试通过，同一兼容产物运行一致；上线灰度仅说明操作与判断条件 |

### 2. 样板复用与补充

已有基础样板继续复用，不为了新目录重复生成前四章。后续只有当文章类型、例证形式或运行环境变化时，才补充对应样板。

| 顺序 | 样板范围 | 校准重点 | 完成后的推进范围 |
| --- | --- | --- | --- |
| 1 | 既有 J02-03 基本数据类型样板及前四章交付 | 沿用标题、知识密度、正反例和验证格式 | 复核有变化的职责，保留已完成资产 |
| 2 | J05-02 泛型边界、通配符与擦除；[技术评审通过，用户已确认](../../../superpowers/specs/2026-09-08-java-generics-sample-review.md) | 编译正反例、机制深度与反射职责边界 | 第5～6章已完成正文；语言/API标准已复用 |
| 3 | J09-08 JUnit与最小Maven工程；[原样板记录](../../../superpowers/specs/2026-09-10-java-junit-sample-review.md) | 固定版本，13次正常测试、失败报告、零测试与恢复构建 | 用户本次授权全量重构后已完成第9章 |
| 4 | J10-05 事务及 J10-09 数据访问测试 | H2 真实连接、回滚与替代数据库边界 | 已用于第10章10篇正文 |
| 5 | J11-12 ThreadLocal 与上下文生命周期 | 确定性复现、异常清理和任务复用 | 已用于第11章12篇正文 |
| 6 | J13-04 线程转储与死锁 | 故障注入、三次快照、退出与恢复 | 已用于第13章9篇正文 |
| 7 | J14-06 多 JDK 与 Toolchains | 编译兼容与真实双运行时验证分开 | 已用于第14章7篇正文 |

每篇正文的生成输入是“本稿的版本与章节契约 + 附录职责卡 + 对应文章规范”。必须覆盖不等于机械建立同名小节；只有能完整解释的独立主题才使用标题。教程和排障至少给出一条可复现闭环，未执行的部分明确说明原因。

## 七、历史内容迁移与导航兼容

### 1. 迁移策略

前八章保持目标路径；84 篇历史文章的分批处理去向见附录末尾。本次审读剩余62篇，以知识职责和实际示例重写或合并正文，移除重复文件及主线外 Java 25 专题；旧 URL 保留直接跳转。

| 情况 | 处理方式 | 兼容要求 |
| --- | --- | --- |
| 一篇对应一篇 | 核对职责和版本后复用、补足 | 目标验收后切换 sidebar；旧 URL 保留映射 |
| 一篇拆多篇 | 按唯一问题分配段落、示例与锚点 | 旧 URL 选择最贴近原主题的默认目标；重要锚点明确归属，必要时保留兼容页 |
| 多篇合一 | 逐项核对合并后的知识与例证，不机械拼接 | 每个旧入口有去向；已发布锚点不能默默丢失 |
| 历史内容已被前四章承接 | 先核对正文与旧链接，再决定何时退出历史导航 | 不再生成重复主讲；兼容测试通过后处理重复正文 |
| Java 21→25 两篇及相关升级内容 | EXT-JAVA25 退出当前模块；混合文章只保留依赖、回归和回退方法 | 旧入口指向范围说明或 Java 8→21 迁移，不宣称承接未覆盖的 Java 25 功能 |
| ThreadLocal 等新增职责 | 先查历史片段，判断是否足以复用 | 没有独立正文前只存在于规划，不建空文章或假链接 |

### 2. 分批接入顺序

本版目录按用户本次全量重构指令完成接入。前八章及 J09-08 的原交付记录保留日期与当时状态，不把本次批量授权改写成历史样板已获单独确认。下面的执行顺序继续作为后续维护要求；本次实际证据见[全量重构记录](../../../superpowers/specs/2026-09-10-java-full-refactor.md)。

1. 冻结本批旧路由与锚点清单，并检查当前用户改动。
2. 审计历史候选，确认复用、拆分、合并和新增范围。
3. 完成相应样板，锁定运行环境及必要依赖。
4. 按职责生成或修订正文，执行小节完整性和示例闭环检查。
5. 内容通过后同步 sidebar、正文链接、图片路径和旧路由映射。
6. 运行相关构建、导航及路由检查，通过后开放该批内容。

现有入口包括 `.vitepress/themeConfig/sidebar/backend.js`、`.vitepress/themeConfig/nav.js`、`scripts/baselines/published-routes.json` 与 `scripts/baselines/route-redirects.json`。本次只更新 Java sidebar 与必要迁移表，保留原发布基线，旧迁移链合并为直达当前正文的目标。

## 八、设计检查与当前边界

设计稿验收关注职责和结构；技术内容验收另需正文与执行证据。二者不互相替代。

| 检查项 | 本轮处理 |
| --- | --- |
| 知识归属 | 123 篇职责对应 247 项知识，逐项登记主讲、深度、证据、来源和必要前置 |
| 顺序与依赖 | 前置 ID 有效且全部在目录中先出现；无循环；已特别处理排序、反射异常、同步/异步 HTTP 和并行流边界 |
| 编号与路径 | 14 个连续章节；每章从 01 连续编号；前四章路径与真实文件一致 |
| 已有资产 | 目录确认时的117个 Markdown 路径全部登记去向，其中33篇原位保留、84篇候选迁移；后续样板另行登记 |
| 内容完成度 | 没有用文件数宣称完成；历史正文抽样结果不扩成全模块验收 |
| 版本与来源 | 主版本沿用既有决定；官方资料核对日期为2026-09-08；易变依赖在样板阶段固定并验证 |
| 当前执行范围 | 全123篇正文、247项知识、配套示例及62篇历史正文清理；本地完成，不执行远端发布 |
| 文档工程检查 | 本次标题、容器、链接、编号、构建与页面结果见[全量重构记录](../../../superpowers/specs/2026-09-10-java-full-refactor.md) |
| 后续工程门禁 | 样板执行正文、代码、链接和站点构建检查；整章发布时另验连续编号、导航及旧路由兼容 |
| 未执行项 | 未重跑前八章示例；未验证 MySQL/PostgreSQL、生产流量、容器平台、第三方在线分析工具与真实上线灰度；不扩大本地样例结论 |

## 九、设计依据与官方来源

### 1. 仓库依据

以下文件用于恢复版本、目录约束和交付状态。站点内资料使用相对链接；仓库根下的 standards 规范不在站点页面树内，以仓库相对路径登记。

| 依据 | 路径 |
| --- | --- |
| 目录生成执行规范 | `standards/knowledge/directory-planning.md` |
| 正文生成执行规范 | `standards/article/article-generation.md` |
| 分层规范索引 | `standards/README.md` |
| 已有 Java 模块蓝图 | [已有 Java 模块蓝图](../../../superpowers/specs/2026-09-01-java-learning-module-blueprint.md) |
| Java 与 Spring Boot 体系设计 | [Java 与 Spring Boot 体系设计](../../../superpowers/specs/2026-09-01-java-spring-boot-learning-system-design.md) |
| 已确认实施计划 | [已确认实施计划](../../../superpowers/plans/2026-09-02-java-spring-boot-learning-system-plan.md) |
| 数据类型样板评审 | [数据类型样板评审](../../../superpowers/specs/2026-09-02-java-data-types-sample-review.md) |
| 第1章交付记录 | [第1章交付记录](../../../superpowers/specs/2026-09-02-java-chapter01-delivery.md) |
| 第2章交付记录 | [第2章交付记录](../../../superpowers/specs/2026-09-02-java-chapter02-delivery.md) |
| 第3章交付记录 | [第3章交付记录](../../../superpowers/specs/2026-09-03-java-chapter03-delivery.md) |
| 第4章交付记录 | [第4章交付记录](../../../superpowers/specs/2026-09-03-java-chapter04-delivery.md) |
| 第5章交付记录 | [第5章交付记录](../../../superpowers/specs/2026-09-08-java-chapter05-delivery.md) |
| 第6章交付记录 | [第6章交付记录](../../../superpowers/specs/2026-09-08-java-chapter06-delivery.md) |
| 第7章交付记录 | [第7章交付记录](../../../superpowers/specs/2026-09-08-java-chapter07-delivery.md) |
| 第8章交付记录 | [第8章交付记录](../../../superpowers/specs/2026-09-08-java-chapter08-delivery.md) |
| JUnit工程样板 | [JUnit与最小Maven工程样板评审](../../../superpowers/specs/2026-09-10-java-junit-sample-review.md) |

### 2. 官方来源登记

S 编号供附录逐项引用，表示规划依据和事实核验入口。主版本目录不直接等同教学目录；正文生成时仍须下钻到对应规则或固定版本 API，并给出真实执行证据。

| ID | 官方资料 | 用途与边界 |
| --- | --- | --- |
| S01 | [Java SE 21 语言规范](https://docs.oracle.com/javase/specs/jls/se21/html/index.html) | 语法、类型、表达式、异常、模块与内存语义；按文章主题核对对应章节 |
| S02 | [Java SE 21 标准 API](https://docs.oracle.com/en/java/javase/21/docs/api/index.html) | 核心 API、集合、I/O、反射与类型边界 |
| S03 | [JDK 21 工具手册](https://docs.oracle.com/en/java/javase/21/docs/specs/man/index.html) | java、javac、jar、javap、jcmd、jfr 等工具入口 |
| S04 | [Java SE 21 虚拟机规范](https://docs.oracle.com/javase/specs/jvms/se21/html/index.html) | Class 文件、运行时区域、加载与指令语义 |
| S05 | [Maven 构建生命周期](https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html) | 生命周期与构建产物；Maven 3.9.11 为本地可用基线 |
| S06 | [JUnit 6.1.2 用户指南](https://docs.junit.org/6.1.2/overview.html) | 测试框架版本入口；配套插件在工程样板中锁定 |
| S07 | [Java 21 JDBC API](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/package-summary.html) | JDBC API 职责及驱动实现差异 |
| S08 | [Java 21 Stream 包说明](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/package-summary.html) | 流水线、归约与并行使用约束 |
| S09 | [Java 21 HTTP Client 包说明](https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/package-summary.html) | HTTP 请求与响应、同步/异步接口范围 |
| S10 | [Java 21 Proxy API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Proxy.html) | 接口代理与调用转发 |
| S11 | [Java 21 java.lang.invoke](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/invoke/package-summary.html) | Method Handle 与类型化动态调用 |
| S12 | [SLF4J 使用手册](https://www.slf4j.org/manual.html) | 日志门面与 provider 接入 |
| S13 | [Mockito 官方发行记录](https://github.com/mockito/mockito/releases) | 版本与运行环境核对入口；实现前读固定版本 API |
| S14 | [Gradle 核心概念](https://docs.gradle.org/current/userguide/gradle_basics.html) | 工程模型参考；current 页面会变，样板实施时固定 Wrapper 与匹配文档 |
| S15 | [HikariCP 官方仓库](https://github.com/brettwooldridge/HikariCP) | 连接池配置与支持范围；样板使用固定 tag |
| S16 | [H2 官方文档入口](https://h2database.com/html/main.html) | 基础 JDBC 示例的数据库与官方手册入口 |
| S17 | [Java 21 并发包说明](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html) | 任务、协调、集合和内存一致性职责 |
| S18 | [Java 21 ThreadLocal API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ThreadLocal.html) | 每线程变量及清理接口 |
| S19 | [Java 21 虚拟线程指南](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html) | Java 21 的阻塞模型、使用限制与观察方式 |
| S20 | [JDK 21 官方文档](https://docs.oracle.com/en/java/javase/21/) | HotSpot、GC、诊断指南入口；实现细节需下钻对应专题核验 |
| S21 | [Java SE 8 官方文档](https://docs.oracle.com/javase/8/docs/) | 维护线的语法、API 与工具对照 |
| S22 | [迁移到 JDK 21 指南](https://docs.oracle.com/en/java/javase/21/migrate/getting-started.html) | 升级步骤和兼容性核对入口 |
