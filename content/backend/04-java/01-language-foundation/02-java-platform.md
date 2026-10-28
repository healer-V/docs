---
title: "Java 平台"
tags:
  - Java SE
  - Jakarta EE
  - Spring Boot
excerpt: "厘清 Java SE、JDK、Jakarta EE、Spring Framework、Spring Boot 和 Java ME 的边界，建立从语言运行时到企业应用框架的分层模型。"
date: 2026-09-02
---

# Java 平台 {#java-平台与技术体系}

Java 生态包含语言规范、运行时、标准 API、企业规范和应用框架。它们经常出现在同一个项目中，却不属于同一层。把 Java SE、Jakarta EE 和 Spring Boot 当成可以互换的名称，会直接影响依赖选择、问题定位和版本升级。

## 一、Java SE 是基础平台

Java SE（Java Platform, Standard Edition）定义 Java 通用能力，包括语言规范、JVM 规范和标准 API。无论编写命令行程序、Spring Boot 服务还是大数据任务，都建立在 Java SE 之上。

Java SE 21 的标准 API 以模块组织，常见模块包括：

| 模块 | 主要能力 | 典型包 |
|------|----------|--------|
| `java.base` | 语言基础、集合、I/O、并发、网络基础 | `java.lang`、`java.util`、`java.io` |
| `java.net.http` | HTTP Client | `java.net.http` |
| `java.sql` | JDBC 数据库访问接口 | `java.sql`、`javax.sql` |
| `java.logging` | JDK 日志 API | `java.util.logging` |
| `java.xml` | XML 处理 | `javax.xml`、`org.w3c.dom` |

`java.*` 通常表示 Java SE 标准 API。部分历史标准 API 仍使用 `javax.*` 包名，例如 `javax.sql.DataSource`；因此不能只根据包名前缀机械判断它是否属于旧版企业规范。

## 二、JDK 是 Java SE 的开发实现

JDK（Java Development Kit）提供一套可实际安装和使用的 Java SE 实现，并附带开发、运行和诊断工具。Java 规范规定行为边界，JDK 发行版负责实现这些规则。

常见发行版包括 Oracle JDK、Eclipse Temurin、Amazon Corretto 和 Microsoft Build of OpenJDK。它们都来源于 Java/OpenJDK 生态，但在安装包、许可证、补丁节奏、支持周期和附加能力上可能不同。

选择发行版时至少核对以下条件：

| 条件 | 需要确认的问题 |
|------|----------------|
| Java 版本 | 是否提供项目要求的 Java 21 或 Java 8 |
| 操作系统与 CPU | 是否匹配 Windows/Linux/macOS 以及 x64/AArch64 |
| 许可证 | 开发、测试和生产部署是否满足组织合规要求 |
| 更新策略 | 安全补丁由谁发布，更新频率和支持期限如何 |
| 企业认证 | 生产环境是否只允许组织批准的发行版 |

::: warning JDK 内部 API 不属于通用标准

JDK 中还存在 `jdk.*` 模块和包，它们是 JDK 工具或实现相关 API，不等同于 Java SE 通用标准。业务代码如果依赖内部实现 API，跨版本或跨发行版迁移时更容易失败。

:::

## 三、Jakarta EE 定义企业应用规范

Jakarta EE 在 Java SE 之上定义 Web、持久化、事务、验证、依赖注入等企业应用规范。规范通常描述接口和行为，真正运行程序还需要兼容实现或应用服务器。

| 规范能力 | 常见 API 或概念 | 解决的问题 |
|----------|-----------------|------------|
| Servlet | `jakarta.servlet.*` | HTTP 请求与响应处理 |
| Persistence | Jakarta Persistence | 对象与关系数据库映射 |
| Validation | `jakarta.validation.*` | 对象字段和方法参数校验 |
| Transactions | Jakarta Transactions | 事务边界和协调 |
| CDI | Contexts and Dependency Injection | 依赖注入和上下文生命周期 |

Jakarta EE 9 起，大量企业 API 从 `javax.*` 迁移到 `jakarta.*`。这不是简单替换文本：升级时还要同步检查框架、服务器、依赖和配置是否支持新命名空间。

::: warning Java SE 与 Jakarta EE 不是同一套版本号
Java 21 指 Java SE/JDK 功能版本；Jakarta EE 使用自己的版本体系。项目可以在 Java 21 上使用某个 Jakarta EE API，但不能据此推导二者版本号必须一致。
:::

## 四、Spring 与 Spring Boot {#四、spring-framework-与-spring-boot-的关系}

Spring Framework 是 Java 应用框架，核心能力包括依赖注入、Web 编程、数据访问、事务和测试支持。Spring Boot 构建在 Spring Framework 之上，通过自动配置、Starter 依赖、内嵌服务器和运维端点降低应用装配成本。

二者的职责可以这样区分：

| 技术 | 核心职责 | 典型表现 |
|------|----------|----------|
| Spring Framework | 提供应用编程模型和基础设施抽象 | 容器、Bean、MVC、事务、数据访问 |
| Spring Boot | 约定依赖组合和运行方式 | Starter、自动配置、内嵌服务器、Actuator |

Spring Boot 不是 Java SE，也不是完整的 Jakarta EE 应用服务器。它会按所选技术栈使用部分 Jakarta 规范，例如 Spring MVC 应用通常使用 Servlet 和 Validation API；应用的生命周期、依赖注入容器和配置方式仍由 Spring 体系主导。

::: info 新项目与 Java 8 维护线分开

本知识库的 Spring 主线以 Java 21、Spring Boot 3.5 和 Spring Framework 6.2 为基线。企业 Java 8 存量系统则单独维护 Spring Boot 2.7.18 与 Spring Framework 5.3 的兼容知识，不在新项目中混用两条依赖线。

:::

## 五、Java ME 面向受限设备

Java ME（Java Platform, Micro Edition）面向资源受限设备和嵌入式场景，具有不同的配置、Profile 和设备 API。它与当前常见的 Java 服务端开发不是同一条技术路线。

当工作内容是 Spring Boot 服务、普通命令行程序或桌面工具时，应优先关注 Java SE；只有目标设备和既有平台明确采用 Java ME 时，才需要进入对应规范和工具链。

## 六、各层技术如何组合

一个典型 Spring Boot Web 服务可以表示为：

::: details 查看 Java 应用各技术层的组合关系

```text
业务代码（order）
        │
        ▼
Spring Boot：依赖组合、自动配置、应用启动
        │
        ▼
Spring Framework：IoC、Spring MVC、事务抽象
        │
        ├── 使用部分 Jakarta API：Servlet、Validation、Persistence
        ▼
Java SE API：集合、并发、网络、JDBC 等
        │
        ▼
JDK / JVM 实现
        │
        ▼
操作系统与硬件
```

:::

这张分层图带来两个直接的排障原则：

1. `NoSuchMethodError` 可能来自框架或依赖版本冲突，不一定是 Java 语法问题；
2. JVM 启动失败或类文件版本不兼容时，Spring 容器甚至还没有开始创建 Bean。

## 七、从包名识别代码来源

包名能提供线索，但最终仍应以依赖和官方 API 文档为准。

| 包名前缀 | 常见来源 | 示例 |
|----------|----------|------|
| `java.*` | Java SE 标准 API | `java.util.List` |
| `javax.*` | Java SE 历史 API或旧 Java EE API | `javax.sql.DataSource`、`javax.servlet.Servlet` |
| `jakarta.*` | Jakarta EE 新命名空间 | `jakarta.validation.Valid` |
| `jdk.*` | JDK 工具或实现相关 API | `jdk.jfr.Event` |
| `org.springframework.*` | Spring 项目 | `org.springframework.stereotype.Service` |
| 组织自有前缀 | 业务代码 | `order.OrderService` |

::: warning 不能全局替换 javax 包名

同一个 `javax.*` 前缀可能来自不同层，所以迁移 Jakarta 包名时不能全局替换所有 `javax`。例如 `javax.sql.DataSource` 仍属于 Java SE 21，不应改成不存在的 `jakarta.sql.DataSource`。

:::

## 八、根据项目判断需要学习哪一层

| 项目任务 | 必须掌握的基础 | 继续深入的技术 |
|----------|----------------|----------------|
| 编写普通 Java 程序 | Java SE、JDK 工具 | 构建工具、测试、模块化 |
| 开发 Spring Boot API | Java SE、Spring Framework 基础 | Spring Boot、数据库、安全、运维 |
| 维护传统应用服务器项目 | Java SE | 项目实际使用的 Java EE/Jakarta EE 版本和服务器 |
| 维护 Java 8 Spring 项目 | Java 8 差异 | Spring Boot 2.7、Spring Framework 5.3 |
| 嵌入式 Java 设备 | 目标设备支持的 Java 能力 | Java ME 或厂商专用 API |

::: tip 从构建文件确认项目技术栈

判断一个陌生项目时，先查看构建文件中的 Java 版本、框架 BOM 和依赖包名，再查看启动方式。不要仅根据目录里出现 `Controller` 或 `Servlet` 就推断整个技术栈。

:::

## 九、官方资料

| 资料 | 用途 |
|------|------|
| [Java SE 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/index.html) | 查询标准模块、包、类和方法 |
| [JDK 21 Documentation](https://docs.oracle.com/en/java/javase/21/index.html) | 查询 JDK 工具和实现文档 |
| [Jakarta EE Specifications](https://jakarta.ee/specifications/) | 查询 Jakarta EE 各项规范和版本 |
| [Spring Boot Reference Documentation](https://docs.spring.io/spring-boot/reference/) | 查询 Spring Boot 配置与运行机制 |
| [Java ME Overview](https://www.oracle.com/java/technologies/javameoverview.html) | 了解 Java ME 的定位与设备场景 |

官方资料解决的问题不同：Java SE API 不能代替 Spring Boot 参考文档，Spring Boot 文档也不会重新定义 Java 语言规则。按技术所属层次查资料，可以减少把框架行为误认为语言行为的情况。
