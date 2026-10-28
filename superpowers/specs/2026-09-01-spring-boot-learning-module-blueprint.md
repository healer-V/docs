---
title: "Spring Boot 3.5 主线与 2.7 维护线模块蓝图"
tags:
  - Spring Boot
  - Spring Framework
  - 模块蓝图
  - 教程体系
excerpt: "定义 Spring Boot 教程的版本、前置知识、15 个大章节、逐篇文章职责、订单管理综合场景以及 Spring Boot 2.7 遗留系统维护范围。"
date: 2026-09-01
---

# Spring Boot 3.5 主线与 2.7 维护线模块蓝图

## 一、模块教学契约

| 字段 | 内容 |
|------|------|
| 模块名称 | Spring Boot 核心 |
| 目标目录 | `content/backend/07-springboot/` |
| 主知识方向 | 框架与类库；负责 Spring 核心模型和 Spring Boot 应用开发能力 |
| 辅助知识方向 | Web API、数据访问、安全、测试、可观测和部署；只覆盖 Spring 应用侧能力 |
| 读者基线 | 已掌握 Java 主线第 1～8 章；涉及 Maven、JDBC、并发和 JVM 的章节分别声明对应前置 |
| 当前方向起点 | 可以没有 Spring 经验，从 Spring 生态、Boot 项目和第一个可运行应用开始 |
| 主版本基线 | Java 21、Spring Boot 3.5.x、Spring Framework 6.2.x；依赖版本由 Boot BOM 管理 |
| 维护版本 | Java 8、Spring Boot 2.7.18、Spring Framework 5.3.x |
| 构建基线 | Maven Wrapper；Gradle 使用者参考 Java 工程章节，不在本模块维护双套完整示例 |
| 最终能力 | 能解释容器和 Boot 启动机制，开发、测试、保护、观察和部署订单管理 REST 服务 |
| 范围排除 | Java 基础语法、数据库/Redis/消息系统内部原理、Spring Cloud、微服务架构、Kubernetes 系统教程 |

## 二、版本与来源

| 来源 ID | 官方资料 | 支撑范围 |
|---------|----------|----------|
| `S-SRC-01` | [Spring Boot 3.5 系统要求](https://docs.spring.io/spring-boot/3.5/system-requirements.html) | Java、构建工具和 Servlet 容器兼容范围 |
| `S-SRC-02` | [Spring Boot 3.5 参考文档](https://docs.spring.io/spring-boot/3.5/reference/) | 启动、配置、Web、数据、测试、Actuator 和部署 |
| `S-SRC-03` | [Spring Framework 6.2 参考文档](https://docs.spring.io/spring-framework/reference/6.2/) | IoC、AOP、MVC、事务、缓存、任务、事件和测试 |
| `S-SRC-04` | [Spring Security 参考文档](https://docs.spring.io/spring-security/reference/) | 过滤器链、认证、授权、CSRF、OAuth2 Resource Server 和测试 |
| `S-SRC-05` | [Spring Data JPA 参考文档](https://docs.spring.io/spring-data/jpa/reference/) | Repository、查询、事务和审计 |
| `S-SRC-06` | [MyBatis Spring Boot Starter 文档](https://mybatis.org/spring-boot-starter/mybatis-spring-boot-autoconfigure/) | MyBatis 与 Boot 的正式接入边界 |
| `S-SRC-07` | [Spring Boot 2.7.18 参考文档](https://docs.spring.io/spring-boot/docs/2.7.18/reference/html/) | Java 8 和 Boot 2.7 维护线 |
| `S-SRC-08` | [Spring Framework 5.3 参考文档](https://docs.spring.io/spring-framework/docs/5.3.x/reference/html/) | Boot 2.7 对应 Spring 运行模型 |
| `S-SRC-09` | [Jakarta EE 迁移资料](https://jakarta.ee/specifications/) | `javax` 到 `jakarta` 的规范和命名空间边界 |
| `S-SRC-10` | [Testcontainers for Java](https://java.testcontainers.org/) | 真实依赖集成测试 |

正文引用必须定位到当前主版本的具体章节。不能使用最新 Spring Boot 4.x 文档反推 3.5 默认行为，也不能把 Boot 2.7 行为混入主线。

## 三、前置知识与排除边界

| 前置知识 | 要求深度 | Java 主讲位置 | Spring Boot 处理方式 |
|----------|----------|---------------|----------------------|
| 类、接口、注解和反射 | 解释 | Java 第 3、8 章 | 只解释这些能力如何参与容器和代理 |
| 异常与资源 | 使用 | Java 第 7 章 | 聚焦异常如何映射为 Web 或事务结果 |
| Maven | 使用 | Java 第 9 章 | 只讲 Starter、BOM 和 Boot 插件差异 |
| JUnit 与 Mockito | 使用 | Java 第 9 章 | 聚焦 Spring TestContext、切片和集成测试 |
| JDBC 与事务 | 使用 | Java 第 10 章 | 聚焦 Spring 抽象、代理和 ORM/Mapper 集成 |
| 并发 | 解释 | Java 第 11 章 | 异步和线程池文章声明强前置 |
| JVM 与诊断 | 解释/诊断 | Java 第 12～13 章 | 性能和生产诊断文章声明强前置 |
| HTTP 与 SQL | 基础使用 | 协议和数据库模块 | 保留理解当前请求或查询所需的最小说明和链接 |

Spring Data、Spring Security、Redis 和消息组件在本模块只讲与 Spring Boot 应用的组合方式。它们自身的完整体系不借接入文章扩写成平行教程。

## 四、章节依赖与目录

| 顺序 | 目录 | Sidebar 标题 | 必要前置 | 章节能力 | 统一证据或场景 |
|------|------|----------------|----------|----------|----------------|
| 1 | `01-foundation` | 第1章：Spring Boot 基础与项目创建 | Java 第 1～8 章 | 能创建、运行并解释最小 Boot 应用的组成 | `order-service` 最小工程 |
| 2 | `02-ioc-di-beans` | 第2章：IoC、依赖注入与 Bean | 第1章、Java 反射 | 能解释容器如何注册、解析和管理对象 | 订单服务依赖图 |
| 3 | `03-aop-events` | 第3章：AOP、代理与应用事件 | 第2章、Java 动态代理 | 能解释代理边界并正确使用切面和事件 | 审计切面与订单事件 |
| 4 | `04-bootstrap-configuration` | 第4章：启动流程、自动配置与外部化配置 | 第1～3章、Maven | 能解释 Boot 启动与条件装配并管理配置 | 多环境订单服务 |
| 5 | `05-web-mvc-rest` | 第5章：Spring MVC 与 REST API | 第2、4章、HTTP 基础 | 能实现并解释一次 REST 请求处理链 | 订单查询和创建 API |
| 6 | `06-validation-error-contracts` | 第6章：参数校验、异常与接口契约 | 第5章 | 能建立稳定的输入和错误契约 | 订单校验、错误码和幂等请求 |
| 7 | `07-data-access` | 第7章：数据访问与持久化 | 第2、4、6章、Java JDBC、SQL 基础 | 能选择并接入 JDBC、MyBatis 或 JPA | 订单持久化 |
| 8 | `08-transactions-data-testing` | 第8章：事务管理与数据访问测试 | 第3、7章 | 能解释代理事务并验证真实数据库行为 | 下单与扣库存事务 |
| 9 | `09-security` | 第9章：认证、授权与接口安全 | 第5～6章 | 能保护 REST API 并验证安全边界 | 客户、客服和管理员角色 |
| 10 | `10-cache-tasks-messaging` | 第10章：缓存、任务与消息集成 | 第3、7～9章；异步文章需 Java 并发 | 能按一致性和执行边界接入扩展能力 | 商品缓存、订单任务和事件 |
| 11 | `11-testing-quality` | 第11章：测试体系与接口质量 | 第5～10章、Java 测试 | 能建立从单元到集成和契约的测试体系 | 订单 API 测试矩阵 |
| 12 | `12-observability-performance` | 第12章：可观测性、性能与故障定位 | 第4～11章；性能文章需 Java JVM/诊断 | 能用日志、指标和 Trace 解释运行问题 | 订单服务延迟和失败 |
| 13 | `13-packaging-deployment` | 第13章：打包、容器化与生产部署 | 第4、11～12章 | 能打包、配置、启动、探测和回滚应用 | 订单服务容器部署 |
| 14 | `14-application-architecture` | 第14章：订单系统综合实践 | 第1～13章 | 能把分散能力组合为可验收后端服务 | 完整订单管理后端 |
| 15 | `15-boot2-maintenance` | 第15章：Spring Boot 2.7 维护与升级 | Java 8 维护章、第1～14章按主题引用 | 能维护 Boot 2.7 并制定升级到 3.5 的方案 | 同一订单服务双版本对照 |

## 五、逐篇文章职责

每个文章 ID 同时是该文章主知识项的唯一归属。所有示例默认使用 Java 21 和当前锁定的 Spring Boot 3.5.x 维护版本；第 15 章除外。

### 1. 第1章：Spring Boot 基础与项目创建

| ID / 文件 | 标题 | 唯一学习问题 | 类型 / 深度 | 必须证据 | 失败边界 |
|-----------|------|--------------|-------------|----------|----------|
| `S01-01` `01-spring-ecosystem-and-boot.md` | Spring 生态与 Spring Boot 定位 | Spring Framework、Boot、Data、Security 和 Cloud 如何分工？ | 基础概念 / 认识 | 生态关系图、应用场景和模块边界 | 把 Spring 等同 Boot、把 Boot 当代码生成器 |
| `S01-02` `02-version-baseline.md` | Java、Spring 与 Boot 版本关系 | 如何为新项目和遗留项目选择兼容版本组合？ | 设计与实践 / 设计 | 官方兼容矩阵和主/维护线决策 | 随意组合版本、使用 Boot 4 文档解释 3.5 |
| `S01-03` `03-spring-initializr.md` | Spring Initializr 与项目创建 | 如何生成一个依赖最少、版本明确的 Boot 工程？ | 接入教程 / 使用 | Initializr 参数、生成文件和 Maven 验证 | 加入无关 Starter、SNAPSHOT 和联网失败 |
| `S01-04` `04-project-structure-starters.md` | 项目结构、Starter 与依赖管理 | Boot 工程各目录、Starter、BOM 和插件分别做什么？ | 运行机制 / 解释 | dependency tree、重打包产物和结构图 | 手工覆盖受管版本、Starter 与自动配置混淆 |
| `S01-05` `05-first-application.md` | 第一个 Spring Boot 应用 | 最小应用如何启动内嵌服务器并响应 HTTP 请求？ | 接入教程 / 使用 | 完整项目、启动日志、curl 响应和停止方式 | 端口占用、扫描范围、启动类位置和 JDK 版本 |

### 2. 第2章：IoC、依赖注入与 Bean

| ID / 文件 | 标题 | 唯一学习问题 | 类型 / 深度 | 必须证据 | 失败边界 |
|-----------|------|--------------|-------------|----------|----------|
| `S02-01` `01-ioc-di.md` | IoC 与依赖注入 | 将对象创建和依赖组装交给容器解决了什么问题？ | 基础概念 / 解释 | 手工组装与容器组装对照、依赖图 | 把 IoC 解释成“自动 new”、隐藏真实依赖 |
| `S02-02` `02-container-model.md` | BeanFactory 与 ApplicationContext | Bean 定义、工厂和应用上下文如何形成容器模型？ | 运行机制 / 解释 | 容器对象关系和运行时类型观察 | “BeanFactory 总是懒加载”等绝对化结论 |
| `S02-03` `03-component-scanning.md` | 组件扫描与 Bean 注册 | 组件如何被扫描、命名和注册，扫描边界如何确定？ | 运行机制 / 使用+解释 | Bean 列表、包边界和重名失败 | 启动类位置错误、重复名称和扫描过宽 |
| `S02-04` `04-configuration-bean.md` | @Configuration 与 @Bean | 何时使用配置类注册第三方对象，代理模式有什么影响？ | 语法与 API / 解释 | 配置类、Bean 方法调用与 lite/full 模式观察 | 直接调用造成重复实例、销毁方法和外部对象责任 |
| `S02-05` `05-constructor-injection.md` | 构造器注入与依赖选择 | 容器如何在单个和多个候选中解析构造器依赖？ | 语法与 API / 解释 | 构造器、`@Primary`、`@Qualifier` 和失败日志 | 字段注入、可选依赖误用和歧义候选 |
| `S02-06` `06-scopes-lifecycle.md` | Bean 作用域与生命周期 | Bean 从定义到销毁经历哪些阶段，作用域如何改变所有权？ | 运行机制 / 解释 | 生命周期时序、后处理器日志和销毁验证 | prototype 销毁、Web 作用域跨线程和早期引用 |
| `S02-07` `07-container-failures.md` | 循环依赖与容器启动错误 | 如何根据创建阶段和依赖图定位容器启动失败？ | 测试与排障 / 诊断 | 构造器循环故障、FailureAnalyzer/异常链 | 开启循环引用掩盖设计问题、只看最后一行异常 |

### 3. 第3章：AOP、代理与应用事件

| ID / 文件 | 标题 | 唯一学习问题 | 类型 / 深度 | 必须证据 | 失败边界 |
|-----------|------|--------------|-------------|----------|----------|
| `S03-01` `01-aop-proxy-model.md` | Spring AOP 与代理模型 | 调用如何经过代理，JDK 与类代理的能力边界是什么？ | 运行机制 / 解释 | 代理类型、调用链和日志 | final、非公开方法和错误“编译期织入”表述 |
| `S03-02` `02-pointcuts-advice.md` | 切点、通知与切面 | 如何把横切逻辑限定在准确的连接点并保留异常语义？ | 语法与 API / 使用 | 审计切面、参数、返回和异常日志 | 切点过宽、吞异常、记录敏感数据 |
| `S03-03` `03-proxy-boundaries.md` | 代理边界与内部调用失效 | 为什么自调用绕过代理，如何选择重构或显式边界？ | 测试与排障 / 诊断 | 自调用失败测试、代理外部调用对照 | 滥用 `AopContext`、以注解存在证明生效 |
| `S03-04` `04-application-events.md` | 应用事件发布与监听 | 进程内事件如何解耦协作者，同步、异步和事务时机如何选择？ | 设计与实践 / 设计 | 订单事件时序与失败传播 | 把进程内事件当可靠消息、监听器异常影响 |

### 4. 第4章：启动流程、自动配置与外部化配置

| ID / 文件 | 标题 | 唯一学习问题 | 类型 / 深度 | 必须证据 | 失败边界 |
|-----------|------|--------------|-------------|----------|----------|
| `S04-01` `01-spring-application.md` | SpringApplication 启动流程 | 从 main 方法到应用就绪经历哪些阶段和事件？ | 运行机制 / 解释 | 启动时序、日志和事件监听 | 把私有实现顺序写成稳定 API、启动回调阻塞 |
| `S04-02` `02-spring-boot-application.md` | @SpringBootApplication 组合机制 | 组合注解如何连接配置、扫描和自动配置？ | 运行机制 / 解释 | 注解展开、扫描范围和条件报告 | 将三个注解作用混为一谈 |
| `S04-03` `03-starters-auto-configuration.md` | Starter、自动配置与条件装配 | classpath、属性和已有 Bean 如何共同决定自动配置？ | 运行机制 / 解释 | 条件评估报告、back-off 对照 | Starter 必然创建 Bean、强行覆盖默认值 |
| `S04-04` `04-externalized-configuration.md` | 配置文件与属性覆盖顺序 | 属性源如何合并和覆盖，如何确定最终值来自哪里？ | 运行机制 / 诊断 | 多属性源示例、Actuator/env 安全边界 | 错误优先级表、公开敏感配置 |
| `S04-05` `05-configuration-properties.md` | @ConfigurationProperties 与配置校验 | 如何把外部字符串绑定为有类型、可校验的配置对象？ | 接入教程 / 使用 | Record/类绑定、校验和启动失败输出 | `@Value` 分散配置、宽松绑定误解和无校验 |
| `S04-06` `06-profiles-secrets.md` | Profile、环境变量与敏感配置 | 如何隔离环境差异而不把秘密写入仓库？ | 设计与实践 / 设计 | Profile 组合、环境变量和配置决策表 | 用 Profile 表达业务功能、默认密码和日志泄密 |

### 5. 第5章：Spring MVC 与 REST API

| ID / 文件 | 标题 | 唯一学习问题 | 类型 / 深度 | 必须证据 | 失败边界 |
|-----------|------|--------------|-------------|----------|----------|
| `S05-01` `01-dispatcher-servlet.md` | DispatcherServlet 与请求处理链 | HTTP 请求如何经过 Servlet、映射器、适配器和消息转换器？ | 运行机制 / 解释 | 请求时序、调试日志和组件职责 | 把 Filter/Interceptor/Controller 混为一层 |
| `S05-02` `02-controller-mapping.md` | Controller 与请求映射 | 路径、HTTP 方法、媒体类型和处理方法如何匹配？ | 语法与 API / 使用 | 多种映射、冲突启动错误和 405/415 | 用一个万能映射、忽略 consumes/produces |
| `S05-03` `03-request-inputs.md` | 路径、查询参数与请求体 | Spring MVC 如何绑定三类输入并在缺失或类型错误时失败？ | 接入教程 / 使用+解释 | 完整 Controller、curl、JSON 响应和错误输出 | `@PathVariable`/`@RequestParam`/`@RequestBody` 混用、400 原因不明 |
| `S05-04` `04-json-content-negotiation.md` | JSON 序列化与内容协商 | Jackson 与消息转换器如何在 Java 对象和 HTTP 表示间转换？ | 运行机制 / 解释 | ObjectMapper 配置、日期/枚举和媒体类型对照 | 实体直接暴露、未知字段和时区漂移 |
| `S05-05` `05-responses-status-headers.md` | 响应体、状态码与响应头 | 如何准确表达创建、查询、更新、删除和条件响应结果？ | 设计与实践 / 设计 | ResponseEntity、Location、ETag 或缓存头示例 | 全部返回 200、业务码替代 HTTP 语义 |
| `S05-06` `06-filter-interceptor-advice.md` | Filter、Interceptor 与 ControllerAdvice | 跨请求关注点应放在哪个扩展点？ | 设计与实践 / 设计 | 调用顺序日志和职责决策表 | 重复读取请求体、异步分派和异常边界 |
| `S05-07` `07-files-async-requests.md` | 文件上传、下载与异步请求 | 如何流式处理文件并理解 Servlet 异步请求的生命周期？ | 接入教程 / 使用 | 限制配置、流式响应和超时结果 | 路径穿越、内存加载大文件、异步等于新线程误解 |

### 6. 第6章：参数校验、异常与接口契约

| ID / 文件 | 标题 | 唯一学习问题 | 类型 / 深度 | 必须证据 | 失败边界 |
|-----------|------|--------------|-------------|----------|----------|
| `S06-01` `01-bean-validation.md` | Bean Validation 参数校验 | 请求对象、方法参数和级联对象如何声明并触发校验？ | 接入教程 / 使用 | DTO、分组边界、失败响应和测试 | 实体承担接口校验、漏 `@Valid`、空值语义 |
| `S06-02` `02-custom-validation.md` | 自定义校验规则 | 跨字段或领域约束何时需要自定义 Constraint，何时应留在业务层？ | 设计与实践 / 设计 | 日期/金额跨字段校验和单元测试 | 校验器查库、与业务规则重复 |
| `S06-03` `03-global-exceptions.md` | 全局异常处理 | 异常如何按类型解析并映射为稳定 HTTP 响应？ | 运行机制 / 解释 | `@RestControllerAdvice`、异常链和映射测试 | 捕获 `Exception` 后统一 200、泄漏堆栈 |
| `S06-04` `04-error-contract.md` | 统一错误响应契约 | 错误码、消息、字段错误、Trace ID 和时间如何形成可演进契约？ | 设计与实践 / 设计 | Problem Details 风格 JSON 和前端消费示例 | 把用户文案当稳定错误码、内部细节泄漏 |
| `S06-05` `05-pagination-idempotency-rest.md` | 分页、幂等与 REST API 设计 | 如何让集合查询和写操作在重试、排序和演进下保持可预测？ | 设计与实践 / 设计 | 分页参数、稳定排序、幂等键和冲突响应 | offset 漂移、重复下单、把所有接口做 CRUD |

### 7. 第7章：数据访问与持久化

| ID / 文件 | 标题 | 唯一学习问题 | 类型 / 深度 | 必须证据 | 失败边界 |
|-----------|------|--------------|-------------|----------|----------|
| `S07-01` `01-data-access-selection.md` | Spring 数据访问体系与技术选型 | JdbcTemplate、MyBatis、JPA 分别适合什么约束？ | 设计与实践 / 设计 | 订单场景决策矩阵和排除条件 | 无场景争论优劣、把 Spring Data 等同 JPA |
| `S07-02` `02-datasource-hikari.md` | DataSource 与 HikariCP | Boot 如何配置数据源和连接池，容量如何受数据库限制？ | 接入教程 / 设计 | 配置、池指标、超时和健康检查 | 明文凭据、盲目增大池、依赖未就绪 |
| `S07-03` `03-jdbc-template.md` | JdbcTemplate | Spring 如何消除 JDBC 样板同时保留 SQL 和资源边界？ | 接入教程 / 使用 | 参数查询、RowMapper、异常转换和测试 | 拼接 SQL、queryForObject 空/多行边界 |
| `S07-04` `04-mybatis.md` | MyBatis 集成 | Mapper、参数、结果映射和动态 SQL 如何在 Boot 中组织？ | 接入教程 / 使用 | 官方 Starter、Mapper 测试和 SQL 日志 | `${}` 注入、N+1、XML/注解规则分散 |
| `S07-05` `05-jpa-entities.md` | JPA 实体映射 | 实体身份、生命周期和值对象如何映射到关系模型？ | 运行机制 / 设计 | Order 实体、ID、Embeddable 和 schema | equals/hashCode、可变集合和无界级联 |
| `S07-06` `06-spring-data-repositories.md` | Spring Data Repository 与查询 | Repository 代理如何生成实现，派生查询和显式查询如何选择？ | 运行机制 / 使用+解释 | Repository 代理、分页和查询测试 | 方法名失控、返回类型含糊、无稳定排序 |
| `S07-07` `07-persistence-context-n-plus-one.md` | 持久化上下文、关联与 N+1 | 一级缓存、脏检查和加载策略为何会产生隐藏查询？ | 运行机制 / 诊断 | SQL 计数、事务内状态和 N+1 修复 | Open Session 掩盖边界、随意 EAGER |
| `S07-08` `08-database-migrations.md` | Flyway/Liquibase 数据库迁移 | 如何把 schema 变化纳入可重复发布和回滚判断？ | 接入教程 / 设计 | 迁移文件、启动执行、失败和修复流程 | 修改已发布脚本、应用启动时高风险迁移 |

### 8. 第8章：事务管理与数据访问测试

| ID / 文件 | 标题 | 唯一学习问题 | 类型 / 深度 | 必须证据 | 失败边界 |
|-----------|------|--------------|-------------|----------|----------|
| `S08-01` `01-transaction-abstraction.md` | Spring 事务抽象 | 事务管理器如何把不同数据技术统一为事务边界？ | 运行机制 / 解释 | TransactionManager 角色图和资源绑定 | 认为事务覆盖 HTTP/消息等外部副作用 |
| `S08-02` `02-transactional-proxy.md` | @Transactional 与代理机制 | 注解何时被代理拦截并创建、提交或回滚事务？ | 运行机制 / 解释 | 调用时序、日志和自调用失败测试 | 私有方法、自调用、错误代理类型和注解无效 |
| `S08-03` `03-propagation-isolation.md` | 传播行为与隔离级别 | 嵌套业务调用如何共享或创建事务，隔离应由谁决定？ | 设计与实践 / 设计 | REQUIRED/REQUIRES_NEW 对照和并发测试 | 记忆枚举不理解物理事务、误判数据库隔离 |
| `S08-04` `04-rollback-async-boundaries.md` | 回滚规则、异步与事务边界 | 异常类型、捕获位置和线程切换如何决定回滚？ | 测试与排障 / 诊断 | 受检异常、吞异常、异步失效测试 | 以日志替代回滚验证、跨线程继承事务 |
| `S08-05` `05-data-access-tests.md` | 数据访问测试与 Testcontainers | 如何用真实数据库证明 SQL、映射、约束和事务行为？ | 测试与排障 / 诊断 | Testcontainers、迁移、回滚和断言 | 只用 Mock/H2、容器未运行却声称通过 |

### 9. 第9章：认证、授权与接口安全

| ID / 文件 | 标题 | 唯一学习问题 | 类型 / 深度 | 必须证据 | 失败边界 |
|-----------|------|--------------|-------------|----------|----------|
| `S09-01` `01-security-filter-chain.md` | Spring Security 与过滤器链 | 安全请求如何经过过滤器链建立认证并执行授权？ | 运行机制 / 解释 | FilterChainProxy 时序和调试日志 | 把 Controller 拦截当完整安全边界 |
| `S09-02` `02-users-passwords-authentication.md` | 用户、密码与认证模型 | Authentication、UserDetails、Provider 和密码编码器如何协作？ | 运行机制 / 使用+解释 | 登录成功/失败、BCrypt 和测试 | 明文密码、自定义弱哈希和用户枚举 |
| `S09-03` `03-session-authentication.md` | Session 登录认证 | 状态化登录如何创建、持久化和失效安全上下文？ | 接入教程 / 使用 | Cookie/Session 流程、登出和并发会话 | Session fixation、Cookie 属性和跨域误解 |
| `S09-04` `04-oauth2-jwt-resource-server.md` | OAuth2 Resource Server 与 JWT | API 如何验证访问令牌并把 Claim 映射为权限？ | 接入教程 / 解释 | 签名验证、过期/issuer/audience 失败响应 | 自己实现 JWT、把编码当加密、无密钥轮换 |
| `S09-05` `05-authorization.md` | URL 和方法级授权 | 请求级与业务方法级规则如何协作并保持最小权限？ | 设计与实践 / 设计 | 角色/权限矩阵、`@PreAuthorize` 和拒绝测试 | 只隐藏前端按钮、角色硬编码扩散 |
| `S09-06` `06-cors-csrf.md` | CORS 与 CSRF | 浏览器同源、跨域许可和伪造请求分别解决什么问题？ | 运行机制 / 解释 | 前端跨域预检、CSRF 正反例 | 禁用全部防护、通配 origin 携带凭据 |
| `S09-07` `07-security-testing-risks.md` | 安全测试与常见风险 | 如何验证未认证、越权、输入和敏感数据边界？ | 测试与排障 / 诊断 | MockMvc Security、越权矩阵和日志脱敏 | 只测成功登录、测试中使用真实密钥 |

### 10. 第10章：缓存、任务与消息集成

| ID / 文件 | 标题 | 唯一学习问题 | 类型 / 深度 | 必须证据 | 失败边界 |
|-----------|------|--------------|-------------|----------|----------|
| `S10-01` `01-spring-cache.md` | Spring Cache 与本地缓存 | 缓存抽象如何代理方法调用，键、失效和一致性如何设计？ | 运行机制 / 设计 | 命中/未命中日志、键和失效测试 | 自调用失效、缓存 null、无失效策略 |
| `S10-02` `02-redis-integration.md` | Redis 集成 | Boot 应用如何安全连接 Redis 并选择序列化和超时？ | 接入教程 / 使用 | 本地 Redis、模板/Cache、TTL 和失败输出 | Java 原生序列化、热 key、缓存穿透只写口号 |
| `S10-03` `03-scheduled-tasks.md` | 定时任务 | 调度线程如何触发任务，单机与多实例边界是什么？ | 运行机制 / 设计 | fixed/cron 执行、时区和异常日志 | 多实例重复执行、长任务阻塞和无幂等 |
| `S10-04` `04-async-executors.md` | 异步任务与线程池 | `@Async` 如何通过代理提交任务并传播结果和错误？ | 运行机制 / 设计 | 自定义有界池、异常和上下文传播 | 自调用、默认执行器、事务/安全上下文丢失 |
| `S10-05` `05-transactional-events.md` | 事务事件监听 | 如何在事务阶段触发进程内副作用并处理回滚？ | 运行机制 / 设计 | BEFORE/AFTER_COMMIT 行为测试 | 把事务事件当可靠消息、监听失败无补偿 |
| `S10-06` `06-messaging-boundaries.md` | RabbitMQ 与 Kafka 集成边界 | 应用接入消息时必须处理哪些序列化、确认、幂等和重试边界？ | 设计与实践 / 设计 | 最小生产消费、失败重投和决策表 | 把消息原理全部塞入 Boot、无限重试和重复消费 |

### 11. 第11章：测试体系与接口质量

| ID / 文件 | 标题 | 唯一学习问题 | 类型 / 深度 | 必须证据 | 失败边界 |
|-----------|------|--------------|-------------|----------|----------|
| `S11-01` `01-testing-strategy.md` | Spring Boot 测试策略 | 单元、切片、集成、契约和端到端测试应如何分工？ | 设计与实践 / 设计 | 风险到测试层映射矩阵 | 全部使用 `@SpringBootTest`、追求无意义覆盖率 |
| `S11-02` `02-service-controller-unit-tests.md` | Service 与 Controller 单元测试 | 如何在不启动容器时验证纯业务和适配逻辑？ | 接入教程 / 使用 | JUnit/Mockito 测试和失败输出 | Mock 框架本身、测试实现细节 |
| `S11-03` `03-test-context-slices.md` | Spring TestContext 与测试切片 | 上下文缓存和测试切片如何控制依赖范围与反馈速度？ | 运行机制 / 解释 | `@WebMvcTest`/`@DataJpaTest` 上下文对照 | MockBean 滥用、污染缓存和切片越界 |
| `S11-04` `04-mockmvc.md` | MockMvc 接口测试 | 如何验证映射、绑定、校验、序列化和安全响应？ | 接入教程 / 使用 | 成功与失败请求、JSONPath 和错误契约 | 只调用 Controller 方法、忽略编码/过滤器 |
| `S11-05` `05-integration-testcontainers.md` | 集成测试与 Testcontainers | 如何启动真实依赖并验证完整订单请求到数据库链路？ | 接入教程 / 使用 | 容器、动态属性、迁移和 HTTP/DB 断言 | 共享脏数据、固定端口和无 Docker 时伪通过 |
| `S11-06` `06-openapi-contracts.md` | OpenAPI 与接口契约验证 | 如何生成或维护可供前端消费并能回归验证的 API 契约？ | 设计与实践 / 设计 | OpenAPI 文档、示例响应和差异检查 | 文档与实现漂移、暴露内部模型 |

### 12. 第12章：可观测性、性能与故障定位

| ID / 文件 | 标题 | 唯一学习问题 | 类型 / 深度 | 必须证据 | 失败边界 |
|-----------|------|--------------|-------------|----------|----------|
| `S12-01` `01-logging.md` | Spring Boot 日志体系 | Boot 如何选择日志实现并管理级别、格式和关联字段？ | 运行机制 / 使用 | 配置、结构化字段、异常和动态级别 | 打印凭据/请求体、生产 DEBUG 和重复日志 |
| `S12-02` `02-actuator-endpoints.md` | Actuator 端点与安全边界 | Actuator 如何暴露管理能力，哪些端点可以公开？ | 接入教程 / 设计 | 端点列表、授权和脱敏响应 | 暴露 env/heapdump、业务端口无隔离判断 |
| `S12-03` `03-health-readiness.md` | 健康检查与就绪状态 | liveness、readiness 和依赖健康应如何影响流量？ | 运行机制 / 设计 | 状态转换和探针结果 | 下游故障导致存活探针重启风暴 |
| `S12-04` `04-micrometer-metrics.md` | Micrometer 指标 | 如何定义有边界、低基数且可告警的业务和技术指标？ | 接入教程 / 设计 | Counter/Timer、标签和指标抓取 | 用户 ID 高基数、指标名无单位 |
| `S12-05` `05-trace-log-correlation.md` | Trace、日志与请求关联 | 请求上下文如何跨线程和下游传播并关联证据？ | 运行机制 / 诊断 | trace/span、MDC 与异步传播 | 手工 ThreadLocal 泄漏、记录敏感头 |
| `S12-06` `06-performance-analysis.md` | 启动和接口性能分析 | 如何从启动步骤、请求分段和资源指标定位性能瓶颈？ | 测试与排障 / 诊断 | 基线、JFR、指标和 SQL/HTTP 时间线 | 无负载基线、凭单次耗时调参 |
| `S12-07` `07-production-troubleshooting.md` | Spring Boot 生产问题排查 | 如何把启动失败、404/400/500、池耗尽和慢请求映射到证据链？ | 测试与排障 / 诊断 | 多故障案例、日志/指标/线程证据和恢复 | 只列检查项、重启代替根因、在线高风险操作 |

### 13. 第13章：打包、容器化与生产部署

| ID / 文件 | 标题 | 唯一学习问题 | 类型 / 深度 | 必须证据 | 失败边界 |
|-----------|------|--------------|-------------|----------|----------|
| `S13-01` `01-production-configuration.md` | 外部配置与凭据管理 | 生产配置和秘密如何注入、轮换并避免进入产物与日志？ | 设计与实践 / 设计 | 环境变量/挂载配置和泄漏扫描 | 秘密写 YAML、默认生产凭据 |
| `S13-02` `02-executable-jar.md` | 可执行 Jar 与启动参数 | Boot 重打包产物如何加载依赖并接受运行参数？ | 运行机制 / 使用 | `mvn package`、jar 内容和 `java -jar` | original jar 混淆、参数位置和层级错误 |
| `S13-03` `03-graceful-lifecycle.md` | 优雅启动与关闭 | 应用如何停止接流量、等待请求并释放资源？ | 运行机制 / 设计 | SIGTERM、生命周期日志和超时验证 | 无界等待、任务/连接未关闭和就绪状态滞后 |
| `S13-04` `04-docker-buildpacks.md` | Docker 镜像与 Buildpacks | 如何生成可重复、非 root、分层合理的应用镜像？ | 接入教程 / 使用 | Dockerfile 与 Buildpacks 对照、镜像检查 | 密钥入层、latest 标签、root 运行 |
| `S13-05` `05-container-jvm-resources.md` | JVM 容器资源配置 | CPU/内存限制如何影响 JVM、线程池和连接池容量？ | 设计与实践 / 设计 | 容器限制、JVM 参数和运行指标 | 只设 `-Xmx`、忽略本地内存和 CPU 配额 |
| `S13-06` `06-release-rollback.md` | 健康验证、发布与回滚 | 如何定义发布前检查、冒烟、观察窗口和回滚条件？ | 测试与排障 / 设计 | 发布清单、故障版本和回滚证据 | 只看进程启动、数据库变更不可回滚 |

### 14. 第14章：订单系统综合实践

| ID / 文件 | 标题 | 唯一学习问题 | 类型 / 深度 | 必须证据 | 失败边界 |
|-----------|------|--------------|-------------|----------|----------|
| `S14-01` `01-package-architecture.md` | 分层架构与按功能组织代码 | 订单服务如何按业务能力组织代码并控制依赖方向？ | 设计与实践 / 设计 | 包结构、依赖规则和架构测试 | 巨型 service、技术分层跨包循环 |
| `S14-02` `02-model-boundaries.md` | DTO、领域对象与持久化对象 | 不同边界的模型为何不能无条件复用？ | 设计与实践 / 设计 | 映射、不可变 DTO 和实体生命周期 | 实体直接出接口、映射样板无边界膨胀 |
| `S14-03` `03-order-api.md` | 订单 REST API 与错误契约 | 如何组合映射、校验、幂等和错误响应形成稳定接口？ | 接入教程 / 设计 | 完整 API、curl/OpenAPI 和错误矩阵 | 非原子创建、重复请求和状态码混乱 |
| `S14-04` `04-order-persistence-transaction.md` | 订单持久化与事务 | 如何在一个明确事务中创建订单、固化价格并扣减库存？ | 接入教程 / 设计 | 数据模型、事务、并发测试和回滚结果 | 超卖、长事务和事务外副作用 |
| `S14-05` `05-order-security-audit.md` | 订单接口安全与审计 | 如何落实身份、对象级授权、最小权限和审计日志？ | 设计与实践 / 设计 | 越权测试、审计事件和脱敏日志 | 只做 URL 权限、客户读取他人订单 |
| `S14-06` `06-order-delivery-acceptance.md` | 测试、监控与部署验收 | 如何证明订单服务在功能、失败、安全和运维方面可交付？ | 测试与排障 / 诊断 | 测试矩阵、指标、镜像、冒烟和回滚演练 | 只验证 happy path、没有生产观察点 |

### 15. 第15章：Spring Boot 2.7 维护与升级

| ID / 文件 | 标题 | 唯一学习问题 | 类型 / 深度 | 必须证据 | 失败边界 |
|-----------|------|--------------|-------------|----------|----------|
| `S15-01` `01-java8-boot27-baseline.md` | Java 8 与 Spring Boot 2.7 基线 | Boot 2.7 项目的兼容边界和维护风险是什么？ | 基础概念 / 设计 | 官方系统要求、依赖基线和维护决策 | 把可运行当仍受社区支持、混用新 Starter |
| `S15-02` `02-spring53-model.md` | Spring Framework 5.3 运行模型 | 主线学到的哪些容器、AOP、MVC 和事务概念仍适用，差异在哪里？ | 速查与参考 / 解释 | 主线映射表和代表性验证 | 重讲整套 Spring、用 6.2 行为反推 5.3 |
| `S15-03` `03-javax-jakarta.md` | javax 与 jakarta 命名空间迁移 | 从 Boot 2.7 到 3.5 时哪些 API、容器和第三方依赖必须一起迁移？ | 设计与实践 / 设计 | 编译错误、依赖树和代码迁移 | 仅全局替换包名、遗漏生成代码和容器 |
| `S15-04` `04-security-config-actuator.md` | Security、配置与 Actuator 差异 | 旧安全配置、属性和管理端点如何映射到 3.5？ | 速查与参考 / 设计 | 双版本配置、请求和端点差异 | 复制废弃适配器、开放端点以通过迁移 |
| `S15-05` `05-build-test-migration.md` | 依赖、构建与测试迁移 | Java、Maven、插件、测试和第三方库升级应按什么顺序验证？ | 设计与实践 / 设计 | 依赖报告、编译、测试和兼容清单 | 一次升级全部依赖、跳过测试 |
| `S15-06` `06-boot27-to-35.md` | Spring Boot 2.7 升级 3.5 实践 | 如何分阶段迁移订单服务并保留可回退路径？ | 设计与实践 / 设计 | 双版本分支、自动迁移报告、测试、观察和回滚 | 大爆炸升级、行为基线缺失和数据库不可逆变更 |

## 六、知识与能力覆盖矩阵

逐篇职责表完成知识项的唯一归属，最终能力由下表闭合：

| 最终能力 | 支撑文章范围 | 验证方式 | 初始状态 |
|----------|--------------|----------|----------|
| 创建并解释最小 Boot 应用 | `S01-*` | Maven 构建、启动日志和 HTTP 请求 | 待重写验证 |
| 解释容器、依赖、生命周期和代理 | `S02-*`～`S04-*` | Bean 图、生命周期日志、代理故障和条件报告 | 待重写验证 |
| 设计稳定 REST API | `S05-*`～`S06-*` | MockMvc、curl、错误矩阵和 OpenAPI | 待重写验证 |
| 选择并实现数据访问与事务 | `S07-*`～`S08-*` | Testcontainers、SQL、事务和并发测试 | 待重写验证 |
| 建立认证授权和接口安全 | `S09-*` | 安全测试矩阵和失败响应 | 待重写验证 |
| 接入缓存、任务和消息 | `S10-*` | 命中、调度、异步和消息失败行为 | 待重写验证 |
| 建立分层测试和接口质量保障 | `S11-*` | 单元、切片、集成和契约检查 | 待重写验证 |
| 观察和诊断运行问题 | `S12-*` | 日志、指标、Trace、JFR 和故障案例 | 待重写验证 |
| 打包、部署和回滚服务 | `S13-*` | 镜像、探针、SIGTERM、冒烟和回滚演练 | 待重写验证 |
| 组合为可交付订单后端 | `S14-*` | 完整验收矩阵 | 待重写验证 |
| 维护 Boot 2.7 并升级到 3.5 | `S15-*` | Java 8/21 双环境构建和迁移记录 | 待重写验证 |

## 七、现有内容迁移映射

| 现有文件 | 主要目标章节 | 处理说明 |
|----------|--------------|----------|
| `01-spring-boot.md` | 新第 1、4 章 | 概述、项目、注解、配置混合内容拆分；所有过时版本和错误 H1 代码注释重写 |
| `02-ioc-di.md` | 新第 2～3 章 | IoC、注册、注入、生命周期和 AOP 分配到唯一文章；纠正无条件化结论 |
| `03-mvc-rest.md` | 新第 5～6 章 | 请求链、参数、响应、校验和异常按独立学习问题拆分 |
| `04-jpa-mybatis.md` | 新第 7～8 章 | JDBC/MyBatis/JPA/事务不再由一篇混讲；每种技术使用真实测试闭环 |
| `05-security-jwt.md` | 新第 9 章 | 认证、Session、JWT、授权、CORS/CSRF 和测试拆分；不自行实现 JWT 协议 |
| `06-config-deploy.md` | 新第 4、12～13 章 | 配置、Actuator、Docker、JVM 和发布按职责拆分；不复制 Docker/JVM 系统教程 |
| `index.md` | 新模块入口 | 从空标题重写为版本、边界、前置和分层学习入口 |
| sidebar 规划的未落地 07～46 | 新第 1～15 章 | 不按旧编号直接补文件；根据本蓝图重新编号，仅在正文存在后登记 |

## 八、样板文章与门禁

| 项目 | 内容 |
|------|------|
| 样板文章 | `S05-03 路径、查询参数与请求体`，目标路径 `content/backend/07-springboot/05-web-mvc-rest/03-request-inputs.md` |
| 选择理由 | 同时检验前置依赖、框架机制、完整工程、代码注释、请求命令、JSON 响应、错误处理和前端可理解性 |
| 核心验证 | Java 21 + Boot 3.5.x 下执行 Maven 测试；启动服务并使用 curl 验证成功、缺参、类型错误和 JSON 绑定失败 |
| 深度门禁 | 不只列三个注解；必须解释参数来源、参数解析器、消息转换器、失败阶段以及错误如何进入统一契约 |
| 第二样板 | 无；安全、事务和诊断文章在各自章节使用更严格的单篇证据门禁 |

Spring Boot 样板在 Java 主线第 1～9 章达到前置要求后生成。样板确认后，从第 1 章按大章节重写，不从第 5 章向两侧并行铺开。

## 九、蓝图评审结论

| 评审项 | 结论 | 说明 |
|--------|------|------|
| 主方向与版本 | 通过 | Boot 3.5/Framework 6.2 为主线，Boot 2.7/Framework 5.3 为维护线 |
| 前置知识边界 | 通过 | 默认已学 Java，不重复语言基础；工程与深入章节声明按需前置 |
| 知识完整性 | 通过 | 覆盖入口、心智模型、核心能力、运行机制、设计、测试、生产和演进 |
| 依赖与顺序 | 通过 | 容器和启动先于 Web、数据、安全、扩展、生产与综合实践 |
| 文章粒度 | 通过，实施中按证据复核 | 每篇只承担一个主要问题，生态接入保留明确排除边界 |
| 示例策略 | 通过 | 订单服务贯穿全部工程章节，基础机制仍使用最小观察示例 |
| 迁移范围 | 通过 | 六篇旧文档和未落地 sidebar 规划按新职责重新分配 |
