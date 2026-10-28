---
title: "Catfish RPC 与 Feign 概念映射"
tags:
  - Catfish RPC
  - OpenFeign
  - 企业框架
excerpt: "基于本地项目中已经确认的 Catfish 注解和 API 模块结构，将其映射到 Feign 客户端代理、Provider 暴露、远程能力启用和跨语言调用概念，同时明确无法从公开资料确认的内部机制。"
date: 2026-07-20
---

# Catfish RPC 与 Feign 概念映射

Catfish 是公司内部远程调用框架，已知其基于 Spring Cloud Feign 改造。本文只解释从本地代码能够确认的使用模型，不推测内部协议、序列化、注册、重试和安全实现。遇到差异时，以公司 Catfish 文档、制品版本和实际源码为准。

## 一、为什么称为 RPC

- **接口调用体验**：业务代码调用 Java 接口，框架代理负责远程通信，因此开发体验类似本地方法调用。
- **底层仍是远程请求**：基于 Feign 表明调用通常经过 HTTP 请求构造、服务选址、网络传输和响应解码，不具备本地方法的可靠性与事务语义。
- **RPC 不等于 gRPC**：Catfish 的 RPC 是远程调用编程模型，不代表使用 Protocol Buffers 或 gRPC 协议。

## 二、已确认注解

| Catfish 概念 | 已观察到的用途 | Feign/Spring 类比 |
|--------------|----------------|-------------------|
| `@EnableRemoting` | 启用远程调用能力 | `@EnableFeignClients` 与相关自动配置 |
| `@CatfishClient` | 声明或注入远程调用客户端 | Feign Client 代理 |
| `@CatfishRemote` | 标记可远程暴露的实现 | Provider Controller 或远程服务实现 |
| `@RemoteProvider` | 配置外部或跨语言 Provider | 面向特定协议的客户端适配器 |

“类比”只用于理解职责，不表示注解参数和运行行为一一相同。

## 三、模块结构

- **API 模块**：本地项目采用独立 `api` 模块保存接口和契约类型，供 Consumer 以发布制品依赖。
- **API 实现模块**：`api-impl` 模块提供接口实现并使用 Catfish 注解暴露能力。
- **Server 模块**：Server 负责组合实现、启用远程能力并作为可部署应用启动。
- **Consumer 依赖**：Consumer 只依赖 API 制品，不应依赖 Provider 的 `api-impl` 和数据访问实现。

## 四、概念调用链

下面是伪代码结构，用于表示角色，不是可编译 Catfish 示例：

```text
// API 模块：定义稳定业务契约
interface ProductFacade {
    ProductSummary findProduct(String productCode)
}

// Provider：实现并暴露接口
@CatfishRemote
class DefaultProductFacade implements ProductFacade {
    findProduct(productCode) → 查询并返回契约 DTO
}

// Consumer：获得远程代理
@CatfishClient
ProductFacade productFacade

// 调用时由 Catfish/Feign 封装远程请求
productFacade.findProduct("HEALTH-001")
```

## 五、与 OpenFeign 的共同机制

- **代理**：Consumer 注入的对象由框架生成或包装，方法调用触发远程请求。
- **契约**：接口、参数和返回类型需要双方共享理解，并保持版本兼容。
- **服务发现**：公司环境使用 Eureka，客户端通常通过逻辑服务身份定位实例。
- **配置**：超时、地址、开关和客户端行为可能由 Apollo 或统一配置进入框架。
- **错误**：网络错误、Provider 错误和反序列化错误需要转换为 Consumer 可处理的异常。

## 六、不能直接推断的行为

- **HTTP 契约格式**：不能仅从接口方法推断实际 URL、HTTP 方法、请求体和响应格式。
- **序列化**：不能假设全部使用 Spring 默认 JSON，也不能假设跨语言调用具有相同编码。
- **重试**：Catfish 可能修改 Feign 默认 Retryer、LoadBalancer 或错误处理。必须查看内部配置和实际版本。
- **超时**：公司统一 Starter 可能设置全局或按 Provider 的超时，不能直接套用 OpenFeign 属性名。
- **安全与上下文**：认证、追踪、灰度和用户上下文如何传播需要依据内部拦截器与规范。

## 七、阅读公司代码的方法

- **从 API 开始**：先找到接口、DTO、方法文档和发布制品，理解业务契约。
- **查找 Provider**：定位实现类与 `@CatfishRemote`，确认真实业务入口和错误转换。
- **查找 Consumer**：定位 `@CatfishClient` 的注入位置，识别调用场景、超时和异常处理。
- **查找启动配置**：定位 `@EnableRemoting`、Apollo 配置和 Eureka 服务身份，理解运行入口。
- **查找内部依赖版本**：从 Maven 依赖管理确认 Catfish 版本，再匹配对应内部文档和源码。

## 八、代码审查重点

- **远程边界是否可见**：调用类命名和注释是否说明远程成本，是否在循环中逐条调用。
- **超时是否合理**：超时是否符合上游预算，是否由 Apollo 动态配置且经过验证。
- **异常是否分类**：业务拒绝、远程不可用和超时是否分开处理，是否存在吞掉异常返回 null。
- **DTO 是否稳定**：是否共享实体、暴露敏感字段或依赖不稳定枚举。
- **重试是否安全**：是否对非幂等写操作自动重试，是否存在多层重试放大。

## 九、迁移 OpenFeign 知识

- **可以迁移**：代理、HTTP 编码、服务发现、负载均衡、超时、错误和契约兼容等基础知识可以直接帮助理解 Catfish。
- **需要验证**：注解参数、配置键、默认值、协议扩展和跨语言行为不能直接迁移。
- **不绕过框架规范**：理解 Feign 原理不表示可以在公司项目中随意替换 Catfish Client 或手工拼接内部 URL。

## 十、待查证清单

在具体项目中使用 Catfish 前，应从内部资料确认：

- 当前 Catfish 制品版本及支持的 Spring Boot、Spring Cloud 版本；
- Provider 命名、接口发布和 Eureka 服务名规则；
- 默认连接、读取超时与连接池；
- 重试、熔断、限流和幂等责任；
- JSON 或其他序列化协议与兼容规则；
- 错误码和异常转换；
- 认证、追踪、灰度上下文传播；
- 跨语言 `@RemoteProvider` 的协议与安全要求。

::: warning 内部框架边界
本文不复制 Catfish 私有源码、公司地址、Maven 仓库和真实配置。通用示例工程使用公开 Spring Cloud OpenFeign 验证机制。
:::

