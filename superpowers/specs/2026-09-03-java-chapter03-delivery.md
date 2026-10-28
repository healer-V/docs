---
title: "Java 第 3 章重写交付记录"
tags:
  - Java
  - 文档重构
  - 交付验证
excerpt: "记录 Java 面向对象与类型设计章节的 12 篇正文、配套示例、正反例验证、旧路由迁移、导航调整和站点工程检查结果。"
date: 2026-09-03
---

# Java 第 3 章重写交付记录

## 一、交付范围

本批次完成“第 3 章：面向对象与类型设计”。章节以订单、商品、客户、支付和定价为连续场景，先建立对象状态与初始化模型，再进入封装、继承、组合、多态和抽象契约，最后补齐值语义、封闭类型与具体设计决策。

| 顺序 | 文章 | 唯一职责 | 行数 | 代码块 |
|------|------|----------|------|--------|
| 3.1 | `01-classes-objects.md` | 区分类定义、对象实例、实例状态、静态状态、身份和值 | 175 | 8 |
| 3.2 | `02-constructors-initialization.md` | 解释默认值、初始化器、构造器链和对象发布边界 | 188 | 8 |
| 3.3 | `03-packages-access-encapsulation.md` | 使用包、访问级别和业务行为维护对象不变量 | 154 | 7 |
| 3.4 | `04-inheritance-composition.md` | 根据可替代性与变化维度选择继承或组合 | 167 | 8 |
| 3.5 | `05-polymorphism-dynamic-binding.md` | 区分编译期检查、运行时动态分派和转型边界 | 166 | 10 |
| 3.6 | `06-abstract-classes-interfaces.md` | 比较共享实现、行为契约和默认方法冲突 | 174 | 8 |
| 3.7 | `07-object-contract.md` | 解释 `equals`、`hashCode`、`toString` 与哈希集合 | 160 | 8 |
| 3.8 | `08-nested-anonymous-classes.md` | 比较四种嵌套类型的作用域与状态捕获 | 149 | 7 |
| 3.9 | `09-enums.md` | 用枚举业务编码和行为建立封闭订单状态机 | 169 | 9 |
| 3.10 | `10-records-immutability.md` | 使用 Record 表达受约束值并处理浅不可变边界 | 154 | 8 |
| 3.11 | `11-sealed-pattern-matching.md` | 使用 sealed 层次和 Java 21 模式匹配穷尽结果 | 147 | 7 |
| 3.12 | `12-solid-design-patterns.md` | 用订单定价重构说明 SOLID、策略、工厂和装饰器 | 200 | 8 |

12 篇正文合计 2003 行、96 个代码块。每篇围绕一个职责卡组织定义、机制、适用边界、核心代码、执行命令、预期输出与失败判断，没有用固定课程模板代替技术内容。

## 二、示例源码

| 文章 | 正文示例 | 核心证据 |
|------|----------|----------|
| 3.1 | `ClassesObjectsDemo.java` | 两个实例的独立状态、对象身份、默认相等性与静态计数 |
| 3.2 | `InitializationDemo.java` | 静态、实例初始化和构造器委托的编号顺序 |
| 3.3 | `EncapsulationDemo.java` | 构造校验、预占、入库与失败后不变量 |
| 3.4 | `InheritanceCompositionDemo.java` | 客户可替代性与可注入折扣策略 |
| 3.5 | `PolymorphismDemo.java` | 动态分派、模式匹配和 `ClassCastException` |
| 3.6 | `AbstractInterfaceDemo.java` | 接口调用、抽象模板流程和默认标签冲突处理 |
| 3.7 | `ObjectContractDemo.java` | 等值对象在 `HashSet` 去重和 `HashMap` 查找中的行为 |
| 3.8 | `NestedClassesDemo.java` | 静态嵌套、成员内部、局部和匿名类的捕获差异 |
| 3.9 | `EnumDemo.java` | 业务编码、`EnumSet` 迁移规则和非法回退 |
| 3.10 | `RecordsImmutabilityDemo.java` | Record 相等性、紧凑构造器和列表防御性复制 |
| 3.11 | `SealedPatternMatchingDemo.java` | 三种支付结果的 Record 模式和穷尽 `switch` |
| 3.12 | `SolidDesignPatternsDemo.java` | 工厂选择策略、审计装饰器和抽象依赖 |

全部源码在 OpenJDK 21.0.11 下使用 `javac -Xlint:all -g -encoding UTF-8` 一次编译通过，12 个默认路径分别运行成功。入口类、构造器和普通方法均有职责注释，多参数方法使用 JavaDoc 说明参数、约束和返回值。

## 三、代表性运行结果

| 示例 | 代表性结果 |
|------|------------|
| 类与对象 | 第一个商品库存为 `7`、第二个仍为 `10`，两个对象身份与默认相等性均为 `false` |
| 初始化 | 静态阶段为 `1～2`，实例阶段为 `3～6`，主构造器先于便捷构造器结束 |
| 封装 | 合法操作后库存为 `7`，超额预占被拒绝且状态不变 |
| 继承与组合 | 企业客户通过客户契约输出；同一服务按策略得到 `10000/9000` 分 |
| 多态 | 银行卡与余额分别动态分派，错误向下转型得到 `ClassCastException` |
| 抽象与接口 | 处理器标签冲突被显式解决，共享商户流程与渠道实现共同输出 |
| Object 契约 | 等值编码使 `HashSet` 大小为 `1`，另一个等值键能命中 `HashMap` |
| 嵌套类 | 四种嵌套形式分别输出快照、审计、局部标签和匿名任务结果 |
| 枚举 | 订单合法迁移至 `SHIPPED`，回退到 `CREATED` 被拒绝 |
| Record | 等值明细相等；原列表清空后摘要仍保留 1 条明细和 `3980` 分 |
| sealed | 成功、拒绝、处理中三个允许分支全部匹配且无需 `default` |
| SOLID 与模式 | VIP 策略计算 `17000` 分，审计装饰器观察相同结果 |

## 四、失败场景验证

### 1. 编译期失败

故意无效的隔离源码位于 Git 忽略目录 `.build/java-chapter03-failures`，不会混入教程示例的正常批量编译。

| 隔离源码 | 退出码 | 实际诊断 |
|----------|--------|----------|
| `RecursiveConstructor.java` | 1 | `recursive constructor invocation` |
| `InvalidDefaultConflict.java` | 1 | 从两个无关接口继承冲突的 `label()` 默认实现 |
| `InvalidNarrowAccess.java` | 1 | 接口实现试图使用比 `public` 更弱的访问权限 |
| `InvalidSealedImplementation.java` | 1 | 实现类没有列入 sealed 接口的 `permits` |
| `NonExhaustiveSwitch.java` | 1 | `switch` 表达式没有覆盖全部允许结果 |

### 2. 运行时与版本失败

运行 `PolymorphismDemo invalid-cast` 以退出码 1 结束，调用栈明确显示 `BalancePayment` 不能转换为 `CardPayment`。`RecordsImmutabilityDemo.java` 和 `SealedPatternMatchingDemo.java` 使用 `--release 8` 编译均以退出码 1 结束，分别证明 Record、`switch` 表达式和 sealed 模型不能直接进入 Java 8 源码线。

## 五、内容与格式检查

| 检查项 | 结果 | 说明 |
|--------|------|------|
| Frontmatter 与 H1 | 通过 | 12 篇均具有合法 Frontmatter，唯一正文 H1 与 `title` 一致 |
| H2 与 H3 编号 | 通过 | H2 使用连续中文编号，H3 在每个 H2 内从 1 连续编号 |
| 小节完整性 | 通过 | 空小节和只有一句普通正文的骨架化 H3/H4 扫描结果为 0 |
| 代码围栏 | 通过 | 全部代码块闭合并标记语言，Java 21 非正式语法已明确标为错误边界 |
| 示例闭环 | 通过 | 12 篇均给出源码位置、关键实现、命令、预期结果和至少一个边界 |
| 元叙述与占位 | 通过 | 未发现上一篇、下一篇、固定学习目标、`TODO` 或占位文本 |
| 示例关联 | 通过 | 12 个 `.java` 文件分别由职责对应的文章引用 |

## 六、旧文件与路由迁移

旧 `02-object-oriented-design` 中的 10 篇文章已经完成知识迁移并删除源码。兼容映射如下：

| 旧文章 | 新文章 | 迁移说明 |
|--------|--------|----------|
| `01-classes-and-objects` | `01-classes-objects` | 类与对象职责收窄，初始化拆为独立 3.2 |
| `02-encapsulation` | `03-packages-access-encapsulation` | 封装与包、访问矩阵、不变量合并 |
| `03-inheritance-and-composition` | `04-inheritance-composition` | 按可替代性和变化维度重新组织 |
| `04-polymorphism` | `05-polymorphism-dynamic-binding` | 补充编译期绑定和运行时分派机制 |
| `05-abstract-classes-and-interfaces` | `06-abstract-classes-interfaces` | 补充默认方法冲突失败证据 |
| `06-object-contract` | `07-object-contract` | 增强哈希集合与可变键边界 |
| `07-nested-classes` | `08-nested-anonymous-classes` | 明确四种嵌套形式和生命周期引用 |
| `08-enums` | `09-enums` | 使用订单状态机补齐业务编码和迁移验证 |
| `09-solid-principles` | `12-solid-design-patterns` | 与具体模式共同落到订单定价重构 |
| `10-design-patterns` | `12-solid-design-patterns` | 避免原则和模式重复罗列 |

10 个旧文章地址和旧总入口 `02-oop.html` 均由迁移清单生成兼容页。现代 Java 的旧 Record 专题中残留的相对链接已同步改到新 `Object` 契约文章。

## 七、Sidebar 状态

Java 主线导航现在连续展示：

1. 第 1 章：Java 基础与开发环境；
2. 第 2 章：Java 语法、数据类型与方法；
3. 第 3 章：面向对象与类型设计，共 12 篇。

后续尚未按 14 章蓝图重写的目录继续标为“历史专题（待迁移）”，不会提前冒充新主线章节。

## 八、工程验证

| 命令或门禁 | 结果 |
|------------|------|
| Java 21 正常源码 | 通过，12 个文件一次编译、12 个默认路径运行成功 |
| 编译失败源码 | 通过，5 类语言边界均以退出码 1 和预期诊断结束 |
| 运行时失败 | 通过，错误向下转型以退出码 1 和 `ClassCastException` 结束 |
| Java 8 源码级别 | 通过，Record 与 sealed 示例均被 `--release 8` 拒绝 |
| `npm run docs:build:unit -- backend` | 通过，244 个页面、750 个文件，约 22.50 秒 |
| `npm run docs:build:unit -- ecosystem` | 通过，120 个页面、378 个文件，约 39.10 秒 |
| 首次独立目录合并 | 暂存目录原子改名收到 Windows `EPERM`，未改动既有预览目录 |
| 第二个独立目录合并 | 通过，651 条路由、2022 个文件、39 条重定向 |
| 历史路由门禁 | 通过，398 条生产路由保留率 100%，缺失路由和锚点均为 0 |
| 链接校验 | 通过，691 个 HTML、2022 个文件、80407 个引用，问题数为 0 |
| `npm run docs:test` | 通过，30 项测试全部成功，Markdown 总数为 651 |

没有停止或重启工作区既有预览服务。最终站点使用独立目录 `.build/assembled-java-chapter03-complete` 完成验证，因此当前预览服务仍可能显示其启动时加载的旧 Artifact。
