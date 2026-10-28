---
title: "Java 标题层级与内容深度复审记录"
tags:
  - Java
  - 文档规范
  - 内容治理
excerpt: "记录已重构 Java 文章的语义层级与内容深度复审，逐篇说明保留或调整的原因，并核对旧锚点、完整示例、容器折叠、构建产物和实际页面的验证边界。"
date: 2026-09-10
---

# Java 标题层级与内容深度复审记录

本轮依据用户确认的要求复审已重构正文：标题应表达真实的知识从属关系，不能为了增加目录层级而增加标题。66 篇逐篇核对后，33 篇调整结构或补足解释，33 篇保留现有组织方式。

## 一、范围与规范同步

| 项目 | 本轮处理 |
|---|---|
| 正文范围 | 前八章 65 篇，加 J09-08 JUnit 样板，共 66 篇 |
| 单篇规范 | `standards/documentation/article-generation.md` 更新至 v1.3，新增语义层级和内容深度复审规则 |
| 执行入口 | 同步 AGENTS.md、article-contracts.md、quality-gates.md 与 sample-review-template.md |
| 增加标题的条件 | 独立子问题、明确父主题、专属解释或证据，以及拆分后的理解或查阅价值 |
| 保留浅层的条件 | 主题集中、并列关系清楚，现有段落、图表或案例已能支撑所需深度 |
| 原有阅读规则 | 保留语义提示容器；超过 10 行的代码默认折叠，关键解释与结果仍在外部可读 |
| 模块边界 | 保留知识 ID、文件路径、章节顺序和 sidebar；本轮不新增第9章其他正文 |

::: tip 复审结果不以标题数量验收
没有统一要求每篇出现三级或四级标题。本轮主要修正真实的父子关系，以及挤在同一段中的机制和边界；各篇的处理依据见逐篇记录。代码、表格和术语出现过，并不自动证明讲解深度已经足够。
:::

## 二、逐章结果

| 章节 | 复审 | 调整 | 保留 | 主要判断 |
|---|---:|---:|---:|---|
| 第1章：语言与环境 | 6 | 0 | 6 | 已有安装、运行和诊断结构完整，平台比较适合浅层 |
| 第2章：语法与方法 | 9 | 1 | 8 | 重载规则和递归边界需要归组 |
| 第3章：面向对象与类型设计 | 12 | 5 | 7 | 相等性、哈希、接口成员、浅不可变和模式匹配需区分层次 |
| 第4章：核心 API | 6 | 3 | 3 | 数值精度、时间表示与解析、正则状态需要独立讲解 |
| 第5章：泛型与集合 | 9 | 7 | 2 | 从实现成本、视图状态、比较与更新契约建立子问题 |
| 第6章：函数式处理 | 7 | 6 | 1 | 组合顺序、提取策略、流生命周期与归约条件分别展开 |
| 第7章：异常、I/O 与网络 | 10 | 7 | 3 | 失败阶段、关闭顺序、编码、缓冲区与消息边界分开解释 |
| 第8章：注解与反射 | 6 | 4 | 2 | 查询规则、访问能力、代理契约和类型化调用分层 |
| 第9章：JUnit 样板 | 1 | 0 | 1 | 已有工程、生命周期、参数化和失败报告子问题完整 |
| 合计 | 66 | 33 | 33 | 每篇分别判断，没有层级配额 |

## 三、逐篇处理依据

以下链接指向本轮复审的实际文章。“保留”表示已检查职责、内容与证据后保持原文；“重组并补充”表示层级调整同时补足了因果、状态或使用边界。

### 1. 语言与环境

该组文章按各自的知识关系和既有内容作出以下处理。

| 文章 | 处理 | 原因 |
|---|---|---|
| [Java 概述](../../content/backend/04-java/01-language-foundation/01-overview.md) | 保留 | 语言特征和版本已有子节；平台关系、适用场景用图表即可承担认识深度。 |
| [Java 平台与技术体系](../../content/backend/04-java/01-language-foundation/02-java-platform.md) | 保留 | 平台边界属于并列比较，各节都有角色解释或场景表；保留浅层便于横向查询。 |
| [JDK、JRE 与 JVM](../../content/backend/04-java/01-language-foundation/03-jdk-jre-jvm.md) | 保留 | 版本分发与失败阶段已有子节，编译运行是连续闭环，不再切碎。 |
| [JDK 21 安装与环境配置](../../content/backend/04-java/01-language-foundation/04-install-jdk21.md) | 保留 | 平台安装入口并列，Linux多方式和常见故障已有必要细分。 |
| [第一个 Java 程序](../../content/backend/04-java/01-language-foundation/05-first-program.md) | 保留 | 源码构成与两类错误已细分，编译和运行步骤短且各有完整结果。 |
| [编译、运行与调试](../../content/backend/04-java/01-language-foundation/06-compile-run-debug.md) | 保留 | 诊断工具分工和异常输入已有结构，jdb命令应保持连续执行顺序。 |

### 2. 语法与方法

该组文章按各自的知识关系和既有内容作出以下处理。

| 文章 | 处理 | 原因 |
|---|---|---|
| [Java 源文件与基础语法](../../content/backend/04-java/02-language-syntax/01-basic-syntax.md) | 保留 | 包、导入、类型和错误已有真实子问题，词法速查不需要逐项设标题。 |
| [变量、常量与作用域](../../content/backend/04-java/02-language-syntax/02-variables-constants-scope.md) | 保留 | 声明、final和作用域已分层，默认值对照和遮蔽示例可在单节完整理解。 |
| [Java 基本数据类型](../../content/backend/04-java/02-language-syntax/03-data-types.md) | 保留 | 数值表示、提升、溢出、浮点与Unicode已有独立讲解和证据；不强加四级。 |
| [引用类型、数组与 null](../../content/backend/04-java/02-language-syntax/04-reference-arrays-null.md) | 保留 | 引用和数组已分层，复制与身份对照各自形成窄主题。 |
| [运算符、表达式与类型转换](../../content/backend/04-java/02-language-syntax/05-operators-conversions.md) | 保留 | 求值和数值提升已分层，其余运算边界有直接代码和失败对照。 |
| [条件分支](../../content/backend/04-java/02-language-syntax/06-conditionals.md) | 保留 | if路径和switch表达式已有子节，null策略适合紧凑对照。 |
| [循环控制](../../content/backend/04-java/02-language-syntax/07-loops.md) | 保留 | for控制和控制转移已有必要层级，不变量证明保持连续步骤。 |
| [方法、参数与返回值](../../content/backend/04-java/02-language-syntax/08-methods-parameters-return.md) | 保留 | 返回路径和引用值传递已有子节、关系图与运行证据。 |
| [方法重载、可变参数与递归](../../content/backend/04-java/02-language-syntax/09-overload-varargs-recursion.md) | 重组并补充 | 归并重载成立、解析、歧义和默认值；分清递归正确性与栈边界，解释可变参数的数组共享。 |

### 3. 面向对象与类型设计

该组文章按各自的知识关系和既有内容作出以下处理。

| 文章 | 处理 | 原因 |
|---|---|---|
| [类与对象](../../content/backend/04-java/03-object-oriented-design/01-classes-objects.md) | 保留 | 对象创建、成员归属和身份比较已有子问题；职责判断用步骤即可。 |
| [构造器与对象初始化](../../content/backend/04-java/03-object-oriented-design/02-constructors-initialization.md) | 保留 | 默认值与初始化器、this与super已有分层，初始化顺序保持完整状态链。 |
| [包、访问控制与封装](../../content/backend/04-java/03-object-oriented-design/03-packages-access-encapsulation.md) | 保留 | 读写边界已有子节，访问控制表与构造/行为校验对照承担查询职责。 |
| [继承与组合](../../content/backend/04-java/03-object-oriented-design/04-inheritance-composition.md) | 保留 | 重写的注解、父类调用和final已细分；继承与组合各有场景支撑。 |
| [多态与动态绑定](../../content/backend/04-java/03-object-oriented-design/05-polymorphism-dynamic-binding.md) | 保留 | 编译检查与运行分派、转换与模式检查均已建立层级。 |
| [抽象类与接口](../../content/backend/04-java/03-object-oriented-design/06-abstract-classes-interfaces.md) | 重组并补充 | 分开接口调用契约与成员状态边界，纠正接口final字段必为编译期常量的表述。 |
| [Object 通用契约](../../content/backend/04-java/03-object-oriented-design/07-object-contract.md) | 重组并补充 | 相等性与哈希查找分别归组，解释键变更如何破坏插入位置和查找条件。 |
| [嵌套类与匿名类](../../content/backend/04-java/03-object-oriented-design/08-nested-anonymous-classes.md) | 保留 | 四种嵌套形式是同层比较，每类已有创建、捕获或生命周期解释，浅层适用。 |
| [枚举](../../content/backend/04-java/03-object-oriented-design/09-enums.md) | 重组 | 外部编码与解析归为映射边界，迁移规则与状态持有者归为状态机协作。 |
| [Record 与不可变对象](../../content/backend/04-java/03-object-oriented-design/10-records-immutability.md) | 重组并补充 | 浅不可变拆为引用、列表结构、元素与数组边界，补充别名变化和相等规则。 |
| [密封类型与模式匹配](../../content/backend/04-java/03-object-oriented-design/11-sealed-pattern-matching.md) | 重组并补充 | 密封声明与子类型开放度归组，匹配、穷尽和守卫归组，补充守卫失败后的选择。 |
| [SOLID 原则与常见设计模式](../../content/backend/04-java/03-object-oriented-design/12-solid-design-patterns.md) | 保留 | 原则已有子节，各模式以不同变化问题并列，现有层级足以定位取舍。 |

### 4. 核心 API

该组文章按各自的知识关系和既有内容作出以下处理。

| 文章 | 处理 | 原因 |
|---|---|---|
| [String、StringBuilder 与文本块](../../content/backend/04-java/04-core-apis/01-string-text-blocks.md) | 保留 | 池与内容比较已有子节；拼接与文本块各自有针对性示例和边界，不再机械拆小。 |
| [包装类型与自动装箱](../../content/backend/04-java/04-core-apis/02-wrapper-autoboxing.md) | 保留 | 装拆箱和比较已有层级，null路径与解析陷阱已有独立解释。 |
| [Math、随机数与 UUID](../../content/backend/04-java/04-core-apis/03-math-random-uuid.md) | 保留 | 普通、安全、并发随机有明确选择关系，取模反例与标识契约内容充分。 |
| [BigInteger 与 BigDecimal](../../content/backend/04-java/04-core-apis/04-big-numbers.md) | 重组并补充 | 运算与舍入归组，区分有效数字、小数位、数值比较和尺度标准化。 |
| [日期时间 API](../../content/backend/04-java/04-core-apis/05-date-time.md) | 重组并补充 | 建立时间表示、时区解析、格式契约层级，补充有效偏移数量、严格解析和截止边界，将Clock放在机制之后。 |
| [正则表达式与文本处理](../../content/backend/04-java/04-core-apis/06-regular-expressions.md) | 重组并补充 | 规则、匹配和分组归为状态过程；区分模式/替换解释与拆分空字段。 |

### 5. 泛型与集合

该组文章按各自的知识关系和既有内容作出以下处理。

| 文章 | 处理 | 原因 |
|---|---|---|
| [泛型类、接口与方法](../../content/backend/04-java/05-generics-collections/01-generic-types-methods.md) | 重组并补充 | 区分实现类的类型传递与静态方法自己的类型参数，解释实例参数不能提供静态调用契约。 |
| [泛型边界、通配符与类型擦除](../../content/backend/04-java/05-generics-collections/02-bounds-wildcards-erasure.md) | 保留 | 既有样板已按上界、通配符、捕获和擦除建立完整层级，含正反例和推理。 |
| [集合框架整体模型](../../content/backend/04-java/05-generics-collections/03-collection-framework.md) | 保留 | 模型、成本和可修改性属于并列选择维度，现有图表和场景能完整说明，无需逐项设子标题。 |
| [迭代、比较与排序](../../content/backend/04-java/05-generics-collections/04-iteration-comparison-sorting.md) | 重组 | 迭代位置与修改权限归组，比较契约与稳定性归组；完整验证从稳定排序子题中独立出来。 |
| [List](../../content/backend/04-java/05-generics-collections/05-list.md) | 重组并补充 | 比较索引移动、链表定位与实际访问成本；分开subList回写和视图失效的生命周期。 |
| [Set](../../content/backend/04-java/05-generics-collections/06-set.md) | 重组 | Set实现下分开顺序维护与比较器判重，突出compare为零与equals的关系。 |
| [Map](../../content/backend/04-java/05-generics-collections/07-map.md) | 重组并补充 | 区分更新函数的输入输出与回调限制，分开映射视图的回写能力和条目来源。 |
| [Queue 与 Deque](../../content/backend/04-java/05-generics-collections/08-queue-deque.md) | 重组并补充 | 优先级队列下分开队头保证、同级次序与优先级变更，补充入队序号的业务含义。 |
| [不可变集合与 Sequenced Collections](../../content/backend/04-java/05-generics-collections/09-immutable-sequenced.md) | 重组 | 首尾访问、逆序视图与有序快照归为有序集合关系，浅不可变对照保持紧凑。 |

### 6. 函数式处理

该组文章按各自的知识关系和既有内容作出以下处理。

| 文章 | 处理 | 原因 |
|---|---|---|
| [Lambda 表达式](../../content/backend/04-java/06-functional-processing/01-lambda.md) | 重组并补充 | 签名适配下分开参数形式与返回路径，说明省略类型不会放宽接口约束。 |
| [函数式接口与方法引用](../../content/backend/04-java/06-functional-processing/02-functional-interfaces-method-references.md) | 重组并补充 | 条件短路、函数数据流、消费副作用各有独立契约；失败验证区分运行时和编译时。 |
| [Lambda 变量捕获](../../content/backend/04-java/06-functional-processing/03-variable-capture.md) | 保留 | 局部变量、引用、字段、循环和生命周期各自回答明确问题，状态表与失败证据充分，保留浅层方便比较。 |
| [Optional](../../content/backend/04-java/06-functional-processing/04-optional.md) | 重组并补充 | 结果提取分为备用值求值与必需结果失败，补充查询缺失在发货边界的不同含义。 |
| [Stream 流水线与常用操作](../../content/backend/04-java/06-functional-processing/05-stream-pipelines.md) | 重组并补充 | 区分连接与执行、短路与缓冲、空流与副作用，以及结果集合与流的生命周期。 |
| [Collector 与归约](../../content/backend/04-java/06-functional-processing/06-collectors-reduction.md) | 重组并补充 | 归约分开数学条件与重载兼容，收集分开组成与隔离，分组分开重复键与下游过滤。 |
| [并行流的使用边界](../../content/backend/04-java/06-functional-processing/07-parallel-streams.md) | 重组 | 共享更新与跨段前项依赖需要不同修正，成本评估区分计算规模与阻塞共享资源。 |

### 7. 异常、I/O 与网络

该组文章按各自的知识关系和既有内容作出以下处理。

| 文章 | 处理 | 原因 |
|---|---|---|
| [Java 异常体系](../../content/backend/04-java/07-exceptions-io-network/01-exception-hierarchy.md) | 重组 | 类型模型本身清楚，混合的验证节区分运行失败与编译声明约束。 |
| [异常捕获、传播与处理策略](../../content/backend/04-java/07-exceptions-io-network/02-catching-propagation.md) | 重组并补充 | finally分开保留返回与覆盖控制转移，补充返回引用和对象修改区别；分开两类故障验证。 |
| [自定义异常与错误设计](../../content/backend/04-java/07-exceptions-io-network/03-custom-error-design.md) | 保留 | 处理责任、稳定错误码、已识别失败与运行证据各自完整，现有决策表足以承载层次。 |
| [资源生命周期与 try-with-resources](../../content/backend/04-java/07-exceptions-io-network/04-resource-lifecycle.md) | 重组并补充 | 分开资源获得关闭的顺序与主次异常规则，解释部分初始化失败的所有权。 |
| [Path 与 Files](../../content/backend/04-java/07-exceptions-io-network/05-path-files.md) | 保留 | 路径计算、文件操作、受控往返、失败与安全为同层问题，图表和完整案例已承载必要深度。 |
| [字节流、字符流与字符编码](../../content/backend/04-java/07-exceptions-io-network/06-byte-character-streams.md) | 重组并补充 | 编码下分开跨块连续性和合法性校验，解释增加缓冲区不能保证字符边界。 |
| [NIO Buffer 与 Channel](../../content/backend/04-java/07-exceptions-io-network/07-nio-buffers-channels.md) | 重组并补充 | 位置模型下分别说明不变量、flip/compact和clear/rewind，补充未读数据被覆盖的原因。 |
| [序列化与数据交换边界](../../content/backend/04-java/07-exceptions-io-network/08-serialization-boundaries.md) | 保留 | 对象图、版本、分层校验和格式取舍均有完整对照与证据，避免把每种校验机械拆成子节。 |
| [Socket 与应用消息边界](../../content/backend/04-java/07-exceptions-io-network/09-socket-programming.md) | 重组并补充 | 帧协议分开单条消息范围与方向结束，解释flush不能解除双方等待EOF的条件。 |
| [HttpClient 请求与响应处理](../../content/backend/04-java/07-exceptions-io-network/10-http-client.md) | 重组并补充 | 分开分阶段时间预算与BodyHandler资源所有权，说明收到响应对象不等于正文已到齐。 |

### 8. 注解与反射

该组文章按各自的知识关系和既有内容作出以下处理。

| 文章 | 处理 | 原因 |
|---|---|---|
| [注解与元注解](../../content/backend/04-java/08-annotations-reflection/01-annotations-meta.md) | 重组并补充 | 继承查询与重复展开具有不同规则，补充声明位置、查询入口与消费顺序的区别。 |
| [自定义注解](../../content/backend/04-java/08-annotations-reflection/02-custom-annotations.md) | 保留 | 属性形状、默认契约、消费职责和编译证据已清楚并列，不为属性表逐项增加标题。 |
| [Class 与反射 API](../../content/backend/04-java/08-annotations-reflection/03-class-reflection.md) | 重组并补充 | 分开成员范围与精确签名，分开失败阶段和访问权限；纠正三类标题与四项表格不一致。 |
| [泛型类型信息](../../content/backend/04-java/08-annotations-reflection/04-generic-type-information.md) | 保留 | Type树、边界、声明与实例分别完整，递归约束和类型令牌用容器说明即可。 |
| [JDK 动态代理](../../content/backend/04-java/08-annotations-reflection/05-dynamic-proxies.md) | 重组并补充 | 分开返回和异常契约、Object身份和默认方法委托，补充接收者不同导致的调用边界。 |
| [Method Handle 与类型化调用](../../content/backend/04-java/08-annotations-reflection/06-method-handles.md) | 重组并补充 | 精确调用与适配归组，纠正调用点返回描述符由赋值目标决定的说法，说明显式转换的作用。 |

### 9. JUnit 样板

该组文章按各自的知识关系和既有内容作出以下处理。

| 文章 | 处理 | 原因 |
|---|---|---|
| [JUnit 单元测试](../../content/backend/04-java/09-engineering-quality/08-junit.md) | 保留 | 工程、生命周期、参数化和报告已有真实子问题和完整验证，金额对象等窄主题保留浅层。 |

## 四、解释补充与事实核对

本轮保持所有围栏代码、配置和输出内容不变，将必要说明放在相关机制附近。DateTime 的 Clock 完整示例随其讲解整体移动；不拆分或压缩完整实现来规避折叠。

| 主题 | 补充或修正 | 核对方式 |
|---|---|---|
| 接口字段 | public static final 不等于所有字段都是编译期常量，引用不可重赋也不代表对象不可变 | JLS 21 接口规则；运行时初始化字段作为 case 标签被 javac 拒绝 |
| Record 与副本 | 区分列表结构副本、元素共享和数组分量的默认相等性 | Java 21 Record 契约与临时断言程序 |
| BigDecimal | 精度限制有效数字，scale 限制小数位；数值相等与表示相等分别判断 | Java 21 API 与同一数值的舍入对照 |
| 日期时间 | 本地时间可能对应零个或两个偏移；格式匹配与严格日期校验不同 | SMART/STRICT、历史时区缺口和重叠断言 |
| 流与 I/O | 消费不等于关闭；缓冲区容量不等于有效数据；帧结束不等于方向结束 | 既有程序对照、状态推导与资源所有权解释 |
| 反射失败分类 | 修正“三类”标题与四项阶段表不一致，分别说明参数检查、目标异常与访问限制 | 对照真实查找和调用 API |
| Method Handle | 调用点返回描述符依据显式转换或表达式语句上下文，不能笼统归因于赋值目标 | 同为 Object 赋值目标，对照有无 String 显式转换，以及 void 语句上下文 |

主要依据：[JLS 21 接口字段](https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.3)、[Record](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Record.html)、[BigDecimal](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html)、[DateTimeFormatter](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/format/DateTimeFormatter.html)、[MethodHandle 编译与调用规则](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/invoke/MethodHandle.html)。

## 五、验证结果与边界

| 检查 | 结果 | 证据与边界 |
|---|---|---|
| 逐篇语义复审 | 66 篇完成 | 上述逐篇理由与本轮源文件差异对应 |
| 标题与代码 | 730 个原标题锚点全部保留，围栏内容完全一致 | 按 VitePress 实际解析结果与开工快照比对；不是重新计算近似 slug |
| 小节完整性 | 空薄候选为 0，逐篇语义判断完成 | 扫描二至四级标题；自动扫描不代替人工深度判断 |
| 长代码折叠 | 80 个超过 10 行的代码块仍默认折叠 | 原生 details、不嵌套折叠，文字容器和关键解释保持可见 |
| 新增解释的边界检查 | 6 组运行断言通过，1 份编译错误符合预期 | Java 21，临时程序与故障夹具保存在本轮证据目录 |
| 关联完整示例 | 9 个程序重新编译并运行通过 | Record、BigDecimal、日期时间、Stream、Collector、资源关闭、NIO、动态代理、Method Handle |
| 全站构建与引用 | 构建通过；678 页、85,336 处引用，失效链接与缺失锚点均为 0 | 隔离输出共 2,054 个文件；66 篇正文的构建结构与源码检查一致 |
| 实际页面 | NIO、Collector 与 Method Handle 桌面检查通过 | 1280×720；目录从属正确，三级项可定位，旧锚点仍指向对应知识；长代码可展开并收起，所查页面无整页横向溢出 |
| 工作区保护 | 原有暂存状态未变，范围外文件内容保持开工状态 | 内容摘要及 Git index 摘要核对 |

本轮证据目录为仓库内的 `.build/java-structure-v13/`，包含开工快照、逐篇判断、结构检查、临时语义验证及运行日志；生成证据不纳入源码。最终构建和引用检查结果落在该目录的 build.log、validation.json 与 site-validation.json 中。

全站构建在 Node 默认 4 GiB 堆上限下退出 134，原因是堆内存不足。改用单次进程参数 `--max-old-space-size=6144` 后，VitePress 完整构建退出 0，耗时 167.92 秒；没有修改项目依赖或日常启动配置。复现命令在仓库根目录执行：

```powershell
node --max-old-space-size=6144 node_modules/vitepress/bin/vitepress.js build docs --outDir D:/03-Other_project/DocsProject/docs/.build/java-structure-v13/site
node scripts/docs/validate-site.mjs --site .build/java-structure-v13/site --output .build/java-structure-v13/site-validation.json
node .build/java-structure-v13/validate.mjs --built
```

工作区摘要最终覆盖 42 个本轮变更文件：33 篇正文、5 份规范入口或契约、3 份进度记录，以及本记录。开工时存在的 794 个其他文件内容未变，Git index 摘要未变。本地页面复用已有的 `http://127.0.0.1:5173/docs/` 服务，没有另启预览进程。

既有示例源码、依赖和围栏内容没有修改。本轮重新运行上述关联程序，没有重跑所有历史故障模式、全部 JUnit/Maven 流程、网络压测或移动端设备测试；旧交付记录中的实测结果仍属于各自原执行批次，不改写为本轮结果。
