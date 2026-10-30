---
title: "Eureka、LoadBalancer 与 Feign 调用链"
tags:
  - Eureka
  - OpenFeign
  - Spring Cloud LoadBalancer
excerpt: "串联 OpenFeign 代理、Eureka 注册表、Spring Cloud LoadBalancer 和底层 HTTP Client，理解服务名解析、实例缓存、目标选择、请求执行与失败传播的完整过程。"
date: 2026-07-20
---

# Eureka、LoadBalancer 与 Feign 调用链

OpenFeign、Eureka 和 LoadBalancer 经常一起出现，但三者职责不能混淆：Feign 把方法转换成 HTTP 请求，Eureka 提供实例信息，LoadBalancer 选择目标，底层 HTTP Client 最终执行网络操作。只有把每一层的输入、输出和缓存分开，才能在调用失败时找到真正责任点。

## 一、完整链路

- **调用代理**：业务代码调用 `ProductClient.findByCode`，Feign 代理读取接口元数据并创建请求模板。
- **解析服务 ID**：客户端名称 `product-service` 被识别为逻辑服务 ID，而不是固定主机名。
- **获取实例列表**：DiscoveryClient 从 Eureka 客户端本地注册表获取产品服务实例。
- **选择实例**：Spring Cloud LoadBalancer 应用实例供应链、缓存和选择算法得到一个 `ServiceInstance`。
- **重建 URI**：逻辑地址被替换为实例协议、主机和端口，保留请求路径与参数。
- **执行和解码**：底层 Client 发送 HTTP 请求，Feign Decoder 或 ErrorDecoder 处理响应。

一次调用在运行时可以展开为以下时序：

```text
ApplicationService
  → ProductClient Feign Proxy
    → Contract + Encoder 生成 GET /internal/products/HEALTH-001
      → LoadBalancerClient 请求 product-service 实例
        → Eureka DiscoveryClient 返回本地注册表副本
          → LoadBalancer 选择 172.17.0.8:8081
            → HTTP Client 建连并发送请求
              → Product Service 返回 JSON
                → Decoder 转换为 ProductSummary
```

这条链路有两个容易混淆的边界：Eureka Server 不参与每次业务请求，Consumer 读取的是本地注册表；LoadBalancer 只负责选择候选实例，不负责保证目标接口一定成功。选址成功后发生的连接、超时、HTTP 状态和解码错误仍由调用方处理。

| 层次 | 输入 | 输出 | 典型失败证据 |
|------|------|------|--------------|
| Feign Contract | Java 方法与注解 | HTTP 请求模板 | 路径、参数或 Content-Type 不符合契约 |
| DiscoveryClient | 逻辑服务 ID | 本地候选实例列表 | Consumer 本地实例数为 0 |
| LoadBalancer | 候选实例与请求上下文 | 一个目标实例 | 元数据筛选后无实例、路由不符合预期 |
| HTTP Client | 真实 URI 和请求 | 网络响应或 I/O 异常 | 连接失败、读取超时、连接池耗尽 |
| Decoder | 状态码、响应头和响应体 | Java 返回值或本地异常 | JSON、枚举或错误体不兼容 |

## 二、依赖组合

- **OpenFeign Starter**：提供 `@FeignClient`、代理创建和 Spring MVC Contract 集成。
- **Eureka Client Starter**：提供 DiscoveryClient 实现和注册表缓存。
- **LoadBalancer Starter**：提供服务实例选择。OpenFeign 不应依赖已淘汰的 Ribbon 教程。
- **Actuator**：提供健康和 Micrometer 基础，帮助观察客户端与 Provider 行为。

## 三、配置示例

### 1. Eureka 地址

```yaml

# application-service/src/main/resources/application.yml
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

### 2. Feign 超时

::: details 查看 application-service 的 Feign 超时配置
```yaml

# application-service/src/main/resources/application.yml
spring:
  cloud:
    openfeign:
      client:
        config:
          product-service:
            connectTimeout: 1000
            readTimeout: 2000
            loggerLevel: basic
```
:::

`connectTimeout` 和 `readTimeout` 使用毫秒值，并应根据上游总预算和真实延迟分布设置。

### 3. LoadBalancer 指标

```yaml

# application-service/src/main/resources/application.yml
spring:
  cloud:
    loadbalancer:
      stats:
        micrometer:
          enabled: true
        include-path: false
```

禁用动态路径标签可以降低指标高基数风险。

## 四、实例缓存层次

- **Eureka Client 缓存**：保存从 Server 获取的注册表副本。
- **LoadBalancer 缓存**：缓存服务实例供应结果，减少重复查询。
- **HTTP 连接池**：缓存到具体主机和端口的网络连接。
- **组合延迟**：实例下线后仍被调用多久，取决于注册、租约、拉取、LoadBalancer 和连接层共同作用。

| 缓存层 | 缓存内容 | 变化来源 | 陈旧时的表现 |
|--------|----------|----------|----------------|
| Eureka Client | 服务名到实例列表 | 周期性拉取 Server 注册表 | Consumer 仍能看到已下线实例，或暂时看不到新实例 |
| LoadBalancer | 实例供应结果 | DiscoveryClient 与供应链刷新 | 路由继续使用旧候选集合 |
| HTTP 连接池 | 到具体主机和端口的连接 | 连接创建、空闲回收和失败 | 连接可能指向正在关闭的实例 |

排查传播延迟时不能只看某一个 TTL。应记录 Provider 注销时间、Eureka Server 变化时间、Consumer 本地列表变化时间和最后一次命中旧实例的时间，再判断延迟位于哪一层。

## 五、无可用实例

- **发生条件**：服务未注册、服务名错误、注册表尚未同步或筛选规则移除了全部实例。
- **错误处理**：Consumer 应把它转换为明确的依赖不可用错误，并记录目标服务 ID。
- **不应无限回退**：不能自动绕过服务发现调用未知固定地址，也不能在无时间预算下持续重试。

## 六、实例调用失败

- **连接失败**：选中的实例地址不可达，可能来自陈旧注册表、网络或实例进程故障。
- **读取超时**：连接成功但 Provider 未在预算内返回，结果可能已经执行或仍在处理中。
- **HTTP 错误**：Provider 返回明确状态和错误体，应先按契约处理，不与网络错误混为一类。
- **解码失败**：通常表示契约或 Content-Type 不兼容，切换实例未必能够解决。

不同错误需要不同动作，不能统一捕获后全部重试：

| 错误类型 | 是否已有 Provider 业务响应 | 通常是否适合换实例重试 | 首要检查 |
|----------|----------------------------|------------------------|----------|
| 无可用实例 | 否 | 等待注册表收敛可能有效，但必须受总预算限制 | 服务名、本地注册表、路由筛选 |
| 连接失败 | 否 | 幂等请求可在剩余预算内尝试其他实例 | 注册地址、网络、实例进程 |
| 读取超时 | 不确定 | 写操作不能默认重试 | Provider 是否已执行、幂等状态 |
| 明确 `4xx` | 是 | 通常不适合 | 参数、认证和业务拒绝契约 |
| 明确 `5xx` | 是 | 取决于副作用和错误语义 | Provider 日志、下游故障、幂等性 |
| 解码失败 | 是 | 通常不适合 | Content-Type、字段、枚举和版本组合 |

## 七、重试与实例切换

- **重试层次**：Feign、LoadBalancer、HTTP Client、网关和业务代码都可能提供重试。必须只选择明确层次，避免次数相乘。
- **幂等前提**：产品查询可以在预算内尝试其他实例；创建投保申请不能默认重试。
- **时间预算**：每次尝试消耗剩余预算，不能让多个完整读取超时叠加超过上游响应目标。

例如入口只允许 2 秒完成投保校验，预留 300 毫秒用于本地处理和响应后，下游总预算最多约 1.7 秒。若产品查询一次读取超时就配置为 1.5 秒，再允许完整重试一次，最坏等待已经超过入口目标。合理设计应同时限制单次连接、单次读取、最大尝试次数和总截止时间，并让第二次尝试只能使用剩余预算。

::: warning 重试次数会相乘
网关、业务代码、Feign、LoadBalancer 和底层 Client 如果各自重试一次，最坏尝试次数可能呈乘法增长。调用链必须指定唯一主要重试层，并通过指标记录真实尝试次数。
:::

## 八、请求上下文

- **追踪标识**：调用方通过受控拦截器传递追踪标识，Provider 日志使用相同标识关联。
- **认证信息**：内部服务身份与最终用户身份分别处理，不直接复制所有入口请求头。
- **灰度上下文**：可信入口生成的灰度标识可以参与实例筛选，外部用户不能任意指定内部版本。

## 九、诊断顺序

- **检查服务名**：确认 `@FeignClient` 名称与 Provider 的 `spring.application.name` 一致。
- **检查注册表**：确认 Consumer 本地能够发现实例，而不是只看 Eureka Server 控制台。
- **检查地址可达**：从 Consumer 运行环境访问实例地址与端口。
- **检查错误类型**：区分无实例、连接失败、读取超时、HTTP 错误和解码错误。
- **对齐时间线**：结合 Eureka、Consumer、Provider 和发布记录判断实例变化传播。

诊断时应要求每一步都有证据，而不是看到某个控制台页面后直接下结论：

| 诊断问题 | 有效证据 | 常见误判 |
|----------|----------|----------|
| Consumer 是否发现实例 | Consumer 进程中的 DiscoveryClient 结果 | 只看 Eureka Server 控制台 |
| 注册地址是否可达 | 从 Consumer 网络访问目标地址 | 在 Provider 本机访问 `localhost` |
| 请求是否到达 Provider | 同一 TraceId 的 Provider 入口日志 | Consumer 出现读取超时就认定未执行 |
| 是否选错版本 | LoadBalancer 选择记录和实例元数据 | 只比较整体服务错误率 |
| 是否契约不兼容 | 状态码、Content-Type、脱敏响应摘要和版本 | 把所有解码异常归为网络抖动 |

## 十、验证场景

| 场景 | 预期结果 |
|------|----------|
| 两个 Provider | 请求按配置策略分配 |
| 新增实例 | 缓存更新后开始接收请求 |
| 正常下线 | 实例逐步不再被选择 |
| 强制终止 | 短暂失败受超时控制，注册表最终清理 |
| Eureka 中断 | 已知实例可继续调用，控制面产生告警 |
| 全部实例停止 | Consumer 返回明确下游不可用错误 |
