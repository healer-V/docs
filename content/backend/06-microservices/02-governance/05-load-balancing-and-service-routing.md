---
title: "客户端负载均衡与服务路由"
tags:
  - Spring Cloud LoadBalancer
  - Eureka
  - 服务路由
excerpt: "理解客户端负载均衡从 Eureka 获取实例、应用缓存与筛选策略并选择调用目标的过程，掌握轮询、权重、区域、元数据路由以及实例陈旧条件下的失败边界。"
date: 2026-07-20
---

# 客户端负载均衡与服务路由

Eureka 返回候选实例列表，Spring Cloud LoadBalancer 决定本次请求使用哪个实例。选择过程发生在客户端，因此每个消费者都需要正确的实例缓存、筛选、指标和超时策略。

## 一、调用链路

- **使用逻辑服务名**：调用方使用 `http://product-service`，其中 `product-service` 是服务 ID，不是 DNS 主机名。
- **获取候选实例**：DiscoveryClient 从本地注册表返回产品服务实例，LoadBalancer 使用 `ServiceInstanceListSupplier` 提供的列表。
- **选择目标**：负载均衡算法结合请求上下文、区域或元数据选择一个实例，再把逻辑地址替换为真实地址。
- **发起请求**：底层 HTTP 客户端连接目标实例。实例选择成功不代表请求必然成功。

## 二、引入 LoadBalancer

### 1. 添加依赖

```xml
<!-- application-service/pom.xml -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-loadbalancer</artifactId>
</dependency>
```

OpenFeign 集成 LoadBalancer 时也需要确保该依赖存在。

### 2. 创建负载均衡 RestClient

```java
// application-service/src/main/java/com/example/application/config/HttpClientConfiguration.java
package com.example.application.config;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class HttpClientConfiguration {
    /**
     * 创建支持逻辑服务名的 RestClient Builder。
     *
     * @return 带有 Spring Cloud LoadBalancer 拦截能力的 Builder
     */
    @Bean
    @LoadBalanced
    RestClient.Builder loadBalancedRestClientBuilder() {
        return RestClient.builder();
    }
}
```

### 3. 使用服务名

```java
// application-service/src/main/java/com/example/application/client/ProductLookupClient.java
package com.example.application.client;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class ProductLookupClient {
    private final RestClient restClient;

    /**
     * 创建产品查询客户端。
     *
     * @param builder 支持服务发现的 RestClient Builder
     */
    public ProductLookupClient(RestClient.Builder builder) {
        this.restClient = builder.baseUrl("http://product-service").build();
    }

    /**
     * 查询指定产品摘要。
     *
     * @param productCode 产品编码，不能为空
     * @return 产品服务返回的摘要
     */
    public ProductSummary findByCode(String productCode) {
        return restClient.get()
                .uri("/internal/products/{code}", productCode)
                .retrieve()
                .body(ProductSummary.class);
    }
}
```

`ProductSummary` 是调用契约类型，第三章将完整说明 DTO 与错误处理。

## 三、选择算法

- **轮询**：轮询让请求依次分配到实例，适合实例能力相近且请求成本差异不大的场景。
- **随机**：随机策略实现简单，在大量请求下趋向均匀，但短窗口内可能分布不均。
- **权重**：实例能力不同或需要逐步引流时可以使用权重。权重来源和变更流程必须受治理，不能由实例自行夸大容量。
- **一致性需求**：需要同一业务键稳定落到相同实例时，应先确认服务是否错误依赖本地状态。真正需要粘性时再选择一致性路由策略。

算法选择必须匹配请求成本和实例能力，不能只看分配是否平均：

| 条件 | 合适起点 | 需要额外验证 |
|------|----------|--------------|
| 实例规格相同、请求成本接近 | 轮询 | 长请求是否导致瞬时负载倾斜 |
| 请求量大且无需严格短窗均匀 | 随机 | 小流量时分布波动是否可接受 |
| 实例规格或灰度容量不同 | 权重 | 权重来源、动态调整和过载保护 |
| 需要同区域优先 | 区域筛选后轮询 | 无同区域实例时是否允许跨区回退 |
| 业务要求稳定落点 | 先审查本地状态依赖 | 扩缩容时映射变化和热点键风险 |

无论使用哪种算法，实例级并发、连接池和下游限额仍可能不同。负载均衡指标需要与服务端饱和度联合判断，不能用“请求数均匀”代替容量健康。

## 四、实例列表供应链

- **Discovery**：从 Eureka 获取全部候选实例。
- **Zone**：优先选择同区域实例，减少跨区域延迟和流量成本。没有同区域实例时需要明确是否跨区域回退。
- **Health Check**：对于已由 Eureka 提供健康实例的场景，通常不需要再为每个客户端重复主动探测。额外探测会放大流量和状态差异。
- **Cache**：缓存减少注册表查询成本，也会延长实例变化传播。修改 TTL 前要验证 Eureka 客户端缓存与 LoadBalancer 缓存的组合效果。

## 五、元数据路由

- **版本标签**：实例可以注册 `version=v2`，消费者根据兼容策略选择版本。
- **区域标签**：区域或机房用于就近访问与故障域控制，取值必须来自部署平台而不是手工随意填写。
- **灰度标签**：`release=canary` 可以标记灰度实例，但是否选择它应由请求规则和发布策略决定。
- **安全边界**：元数据会传播到客户端，不能存放 Apollo 密钥、访问令牌或用户身份信息。

## 六、失败处理

- **无可用实例**：调用方应返回明确的下游不可用错误，不把空实例列表转换为 NullPointerException。
- **选中故障实例**：注册表可能陈旧，连接和读取超时仍然必须配置。
- **实例切换**：只有满足幂等和时间预算时才对其他实例重试。负载均衡不能自动证明重试安全。

## 七、调用指标

- **启用统计**：Spring Cloud LoadBalancer 可以通过 Micrometer 记录活动、成功、失败和丢弃请求，需要 MeterRegistry 和对应配置。
- **控制标签基数**：不要把订单号、客户号或完整动态路径作为指标标签，否则会产生高基数时序。
- **结合服务指标**：客户端选择指标需要与服务端请求量、延迟和错误率共同分析。

## 八、与 Feign 的关系

- **Feign 定义调用接口**：OpenFeign 负责根据 Java 接口生成 HTTP 客户端代理。
- **LoadBalancer 选择实例**：当 Feign 只配置服务名而没有固定 URL 时，Spring Cloud LoadBalancer 参与目标选择。
- **Eureka 提供列表**：LoadBalancer 通过 DiscoveryClient 使用 Eureka 注册信息。三者职责不同但组成同一调用链。

## 九、常见错误

- **同时写服务名和固定 URL**：固定 URL 会绕过服务发现，适合明确的外部接口，不适合需要 Eureka 选实例的内部服务。
- **把负载均衡当容错**：均匀分配请求不等于处理超时、过载和依赖故障。
- **缓存时间无限增大**：减少注册查询的同时会延长故障实例残留时间，需要基于演练而不是直觉设置。

具体供应链和属性名称应以 [Spring Cloud LoadBalancer](https://docs.spring.io/spring-cloud-commons/reference/spring-cloud-commons/loadbalancer.html) 与 [Spring Cloud LoadBalancer 配置属性](https://docs.spring.io/spring-cloud-commons/reference/configprops.html) 为准。版本升级后需要重新验证缓存、健康筛选和指标配置，不能直接复制旧版 Ribbon 参数。
