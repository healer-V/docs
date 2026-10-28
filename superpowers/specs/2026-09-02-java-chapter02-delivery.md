---
title: "Java 第 2 章重写交付记录"
tags:
  - Java
  - 文档重构
  - 交付验证
excerpt: "记录 Java 语法、数据类型与方法章节的 9 篇正文、示例正反例、旧文件迁移、导航调整和 VitePress 工程验证结果。"
date: 2026-09-02
---

# Java 第 2 章重写交付记录

## 一、交付范围

本批次完成“第 2 章：Java 语法、数据类型与方法”。章节从合法源文件开始，依次建立变量、基本类型、引用类型、表达式、分支、循环和方法模型；不提前展开完整面向对象设计、集合框架或异常体系。

| 顺序 | 文章 | 唯一职责 | 行数 | 代码块 |
|------|------|----------|------|--------|
| 2.1 | `01-basic-syntax.md` | 解释包、导入、类型、语句和注释如何组成合法源文件 | 300 | 18 |
| 2.2 | `02-variables-constants-scope.md` | 解释变量位置、确定赋值、`final`、作用域和遮蔽 | 313 | 17 |
| 2.3 | `03-data-types.md` | 解释八种基本类型、值域、精度、溢出和 Unicode | 589 | 25 |
| 2.4 | `04-reference-arrays-null.md` | 解释引用共享、数组、`null` 和浅复制 | 350 | 22 |
| 2.5 | `05-operators-conversions.md` | 解释求值、优先级、短路、数值提升和窄化 | 288 | 18 |
| 2.6 | `06-conditionals.md` | 使用 `if` 与 `switch` 表达互斥业务规则 | 292 | 14 |
| 2.7 | `07-loops.md` | 解释循环选择、终止、边界、`break` 和 `continue` | 328 | 14 |
| 2.8 | `08-methods-parameters-return.md` | 解释签名、返回值、调用栈和按值传递 | 336 | 17 |
| 2.9 | `09-overload-varargs-recursion.md` | 解释重载选择、可变参数、递归和栈深边界 | 328 | 12 |

9 篇正文合计 3124 行、157 个代码块。2.3 使用用户已确认的基本数据类型样板，其余 8 篇按同一质量标准补齐。

## 二、示例源码

| 文章 | 正文示例 | 核心证据 |
|------|----------|----------|
| 2.1 | `BasicSyntaxDemo.java` | 包路径、导入、公开类、编译与全限定类名启动 |
| 2.2 | `VariablesScopeDemo.java` | 字段默认值、`var`、块作用域、参数遮蔽 |
| 2.3 | `PrimitiveTypesDemo.java` | 八种基本类型、溢出、浮点和 UTF-16 |
| 2.4 | `ReferenceArrayDemo.java` | 别名、独立副本、浅复制、空引用与越界 |
| 2.5 | `OperatorsConversionsDemo.java` | 优先级、整数除法、短路、提升与窄化 |
| 2.6 | `ConditionalsDemo.java` | 保护性返回、`switch` 表达式和非空契约 |
| 2.7 | `LoopsDemo.java` | 四类循环、哨兵、`break`、`continue` 和边界 |
| 2.8 | `MethodsDemo.java` | 基本值与引用值的按值传递、调用链和返回值 |
| 2.9 | `AdvancedMethodsDemo.java` | 重载、可变参数、有界递归和无限递归 |

9 个正文完整代码块均与实际编译内容逐字符比较一致。全部源码在 OpenJDK 21.0.11 下使用 `javac -Xlint:all -g -encoding UTF-8` 一次编译通过，正常路径逐个运行成功。

## 三、正常运行结果

| 示例 | 代表性结果 |
|------|------------|
| 基础语法 | `ORD-20260902-0042` |
| 变量作用域 | 字段默认值 `0`，记录后字段为 `1`，外层数量保持 `3` |
| 基本类型 | `int` 回绕、浮点尾差、emoji 为 2 个代码单元和 1 个码点 |
| 引用数组 | 共享数组首项为 `9`，独立副本第二项为 `50`，浅复制内部值同步为 `99` |
| 运算转换 | 优先级结果 `14/20`，整数除法 `2`，窄化结果 `-1294967296` |
| 条件分支 | 未支付、已支付和关闭订单分别得到唯一动作 |
| 循环 | 首个空库存索引 `1`，哨兵前有效合计 `5` |
| 方法参数 | 局部数量为 `4`，调用方仍为 `3`；共享数组被修改但引用未被替换 |
| 高级方法 | `int/long` 重载分别命中，可变参数合计 `10`，`5!` 为 `120` |

## 四、失败场景验证

### 1. 编译期失败

| 隔离源码 | 退出码 | 实际诊断 |
|----------|--------|----------|
| `PublicTypeMismatch.java` | 1 | 公开类 `DifferentPublicType` 必须位于同名文件 |
| `UninitializedVariable.java` | 1 | `itemCount` 可能尚未初始化 |
| `MissingReturn.java` | 1 | 非 `void` 方法存在缺失返回路径 |
| `AmbiguousOverload.java` | 1 | `String` 与 `Integer` 重载对 `null` 调用产生歧义 |

这些故意无效的验证源码位于 Git 忽略的 `.build/java-chapter02-failures`，不会混入教程示例或正常批量编译。

### 2. 运行时失败

| 触发方式 | 退出码 | 实际证据 |
|----------|--------|----------|
| `ReferenceArrayDemo null` | 1 | 详细 `NullPointerException` 指出空数组引用读取长度 |
| `ReferenceArrayDemo bounds` | 1 | 索引 3 超出长度 3 |
| `ConditionalsDemo null` | 1 | 非空契约消息“订单状态不能为 null” |
| `LoopsDemo bounds` | 1 | 索引 5 超出长度 5，定位错误终止条件 |
| `AdvancedMethodsDemo stack-overflow` | 1 | `-Xss256k` 下得到 `StackOverflowError` 和重复递归栈帧 |

## 五、内容与格式检查

| 检查项 | 结果 | 说明 |
|--------|------|------|
| Frontmatter 与 H1 | 通过 | 9 篇均具有合法 Frontmatter，唯一正文 H1 与 `title` 一致 |
| H2 编号 | 通过 | 每篇从“一”开始连续编号 |
| H3 完整性 | 通过 | 空小节、单句骨架小节扫描结果为 0 |
| 代码围栏 | 通过 | 全部代码块闭合并标记语言 |
| 源码同步 | 通过 | 9 个完整 Java 代码块与实际编译内容一致 |
| 元叙述 | 通过 | 未发现“上一篇”“下一篇”“下一章”“学习目标”“学习路线” |
| 占位内容 | 通过 | 未发现 `TODO`、待补充或占位文本 |
| 新增方法注释 | 通过 | 示例类、构造方法和普通方法均有职责注释，多参数方法具有完整 JavaDoc |

## 六、旧文件与路由迁移

第 1 章暂留的三篇旧语法文章已经完成知识拆分并删除源码：

| 旧入口 | 新入口 | 补充归属 |
|--------|--------|----------|
| `01-language-foundation/03-basic-syntax.html` | `02-language-syntax/01-basic-syntax.html` | 变量和运算符分别由 2.2、2.5 承担 |
| `01-language-foundation/05-control-flow.html` | `02-language-syntax/06-conditionals.html` | 循环由 2.7 承担 |
| `01-language-foundation/06-methods.html` | `02-language-syntax/08-methods-parameters-return.html` | 重载、可变参数和递归由 2.9 承担 |

三个兼容 HTML 均在独立合并站点实际生成，包含 refresh、canonical 链接和 `window.location.replace`，并分别指向上述目标。

## 七、Sidebar 状态

Java 主线现在包含：

1. 第 1 章：Java 基础与开发环境；
2. 第 2 章：Java 语法、数据类型与方法；
3. 第 3 章：面向对象与类型设计。

原面向对象内容已顺延显示为第 3 章。其余尚未依据 14 章蓝图重写的模块统一标为“历史专题（待迁移）”，保留访问能力，但不继续冒充新主线章节。

## 八、工程验证

| 命令或门禁 | 结果 |
|------------|------|
| `npm run docs:build:unit -- backend` | 通过，242 个页面、744 个文件，约 23.66 秒 |
| `npm run docs:build:unit -- ecosystem` | 通过，119 个页面、375 个文件，约 37.09 秒 |
| 默认 `.build/assembled` 替换 | 现有预览服务锁定 Windows 目录，首次 `rename` 返回 `EPERM` |
| 独立目录合并 | 通过，648 条路由、2003 个文件、29 条重定向 |
| 历史路由门禁 | 通过，398 条生产路由保留率 100%，缺失路由和锚点为 0 |
| 链接校验 | 通过，678 个 HTML、2003 个文件、79950 个引用，问题数 0 |
| `git diff --check` | 通过，无空白错误；仅有仓库既有 LF/CRLF 提示 |
| `npm run docs:test` | 通过，30 项测试全部成功，Markdown 总数为 648 |

没有停止或重启工作区既有预览服务。默认目录受锁后改用 `.build/assembled-java-chapter02-final`，同一合并脚本在独立目录完成了原子替换；因此当前预览服务仍显示其启动时的旧产物，但最终 Artifact、兼容页、历史路由和链接校验已经完整通过。
