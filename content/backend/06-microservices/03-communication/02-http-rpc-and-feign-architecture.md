---
title: "HTTP RPC 与 Feign 架构"
tags:
  - OpenFeign
  - HTTP RPC
  - Spring Cloud
excerpt: "理解 Feign 如何根据 Java 接口创建动态代理，将方法参数编码为 HTTP 请求，再通过客户端、负载均衡、解码器和错误处理还原返回值，避免把远程调用误认为本地方法。"
date: 2026-07-20
---

# HTTP RPC 与 Feign 架构

Feign 是声明式 HTTP 客户端。开发者定义 Java 接口和映射注解，框架在运行时创建代理，把方法调用转成 HTTP 请求。Spring Cloud OpenFeign 进一步集成 Spring MVC 注解、Eureka、LoadBalancer、配置和可观测性。

## 一、声明式调用

- **接口描述请求**：接口声明目标服务、路径、HTTP 方法、参数和返回类型，调用方不重复编写 URL 拼接与反序列化代码。
- **代理执行网络调用**：注入的接口对象不是业务实现，而是动态代理。方法被调用时才组装并发送请求。
- **仍然是远程边界**：方法签名简洁不能消除网络失败。接口命名、包结构和文档应明确它是远程客户端。

## 二、调用链

- **方法元数据**：Spring Cloud 解析 `@FeignClient`、`@GetMapping`、`@RequestBody` 等注解，生成请求模板。
- **参数编码**：路径变量、查询参数、请求头和请求体被编码为 HTTP 请求。对象通常通过 HttpMessageConverter 转为 JSON。
- **服务选址**：没有配置固定 URL 时，Feign 以客户端名称作为服务 ID，交给 Spring Cloud LoadBalancer 选择 Eureka 实例。
- **HTTP 执行**：底层 Client 建立连接、发送请求并读取响应。具体连接池和超时取决于选用的 HTTP 实现与配置。
- **响应解码**：Decoder 根据状态、Content-Type 和返回类型把响应转换为 Java 对象。
- **错误转换**：非成功响应由 ErrorDecoder 或上层异常映射转换为调用方可理解的错误。

代理创建发生在应用启动阶段，真实网络请求发生在方法调用阶段。两类失败应分开判断：启动时的 Bean 冲突、注解解析和配置错误会阻止客户端创建；运行时才会出现无实例、连接失败、HTTP 错误与解码异常。

```text
启动阶段：扫描 @FeignClient → 解析 Contract → 创建代理 Bean
调用阶段：读取方法参数 → 编码请求 → 选择实例 → HTTP 执行 → 解码结果
```

这也是远程客户端不应伪装成普通领域 Service 的原因。代码评审需要一眼识别调用是否跨进程，才能审查超时、批量调用、循环依赖和事务边界。

## 三、关键组件

| 组件 | 职责 |
|------|------|
| Feign Contract | 解析接口与注解 |
| Encoder | 编码请求体与参数 |
| Decoder | 解码成功响应 |
| ErrorDecoder | 转换错误响应 |
| RequestInterceptor | 添加受控请求头 |
| Client | 执行 HTTP 请求 |
| Retryer | 决定 Feign 层重试行为 |
| LoadBalancer | 从服务实例中选择目标 |

## 四、Spring Cloud 集成

- **Spring MVC 注解**：接口可以使用熟悉的 `@GetMapping`、`@RequestParam` 和 `@RequestBody` 描述 HTTP 契约。
- **Spring Environment**：客户端超时、日志级别和固定 URL 等配置可以从本地文件或 Apollo 进入 Spring Environment。
- **Eureka**：服务 ID 对应 Eureka 中的逻辑服务名，消费者不需要维护实例 IP。
- **LoadBalancer**：LoadBalancer 负责实例列表筛选和选择，Feign 本身不等于服务发现。

## 五、客户端上下文

- **每个客户端独立配置**：不同下游可以有不同超时、拦截器和错误处理，不应给所有服务套用同一个高风险全局配置。
- **name 与 contextId**：多个客户端指向同一服务但配置不同，可以使用不同 `contextId` 避免 Bean 与配置冲突。
- **配置类边界**：Feign 专用配置不应被主应用的组件扫描意外变成全局默认配置。

## 六、请求拦截器

- **适用内容**：可以添加追踪标识、内部认证和稳定调用方标识。
- **不传播所有请求头**：外部 Cookie、Authorization 和用户可控路由头不能无选择传入内部服务。
- **线程上下文**：从 ThreadLocal 读取上下文时，需要考虑异步、虚拟线程和测试环境，避免跨请求泄漏。

## 七、序列化边界

- **DTO 明确**：Feign 接口使用专用请求和响应类型，不直接暴露 JPA 实体。
- **JSON 不是 Java 对象复制**：构造器、泛型、枚举、日期和空值需要经过序列化规则，双方类型相同也不保证语义兼容。
- **大响应受控**：列表分页、字段裁剪和响应大小应进入契约，避免连接和堆内存压力。

## 八、错误语义

- **业务拒绝**：产品不可投保属于可预期业务结果，不应被包装为无信息的网络异常。
- **Provider 错误**：服务端 5xx 表示处理失败，需要区分是否可重试和是否已经产生副作用。
- **网络错误**：连接失败、读取超时和无可用实例没有 HTTP 业务响应，需要调用方映射为明确依赖错误。
- **反序列化错误**：通常表示契约不兼容或错误响应格式异常，应保留必要证据并阻止无意义重试。

## 九、性能边界

- **连接池**：每次重新建连会增加延迟，连接池需要容量、空闲连接和 DNS/实例变化策略。
- **超时**：连接和读取超时分别控制不同阶段。默认值不能替代业务调用预算。
- **压缩与编码**：压缩可以减少带宽但增加 CPU，对小消息未必有收益，需要基于负载测试。
- **日志**：Feign FULL 日志可能输出敏感请求体并产生大量 I/O，生产默认使用受控级别和脱敏日志。

## 十、框架边界

- **OpenFeign 已进入维护状态**：Spring Cloud 官方将 OpenFeign 定位为 feature-complete，继续提供修复和有限增强，但建议新系统评估 Spring HTTP Service Clients。
- **公司封装可能扩展行为**：Catfish 基于 Feign 改造，可能增加注册、协议、拦截和错误规则。没有内部规范证据时不能从 OpenFeign 默认行为直接推断 Catfish。

OpenFeign 的客户端上下文、配置属性和当前维护状态应以 [Spring Cloud OpenFeign](https://docs.spring.io/spring-cloud-openfeign/reference/) 与 [Spring Cloud OpenFeign 功能](https://docs.spring.io/spring-cloud-openfeign/reference/spring-cloud-openfeign.html) 为准。升级 Release Train 后需要重新验证超时、HTTP Client、观测和 LoadBalancer 集成。

