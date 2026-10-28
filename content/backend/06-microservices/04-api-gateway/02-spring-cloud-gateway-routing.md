---
title: "Spring Cloud Gateway 路由、过滤器与服务发现实践"
tags:
  - Spring Cloud Gateway
  - Eureka
  - 路由
  - WebFlux
excerpt: "基于 Spring Cloud Gateway 5.0.2 搭建三条可测试路由，解释 Route、Predicate、Filter、RewritePath、lb:// 与 Eureka 的执行关系，并通过真实下游替身验证优先级、路径重写、内部接口隔离和服务不可用响应。"
date: 2026-07-23
---

# Spring Cloud Gateway 路由、过滤器与服务发现实践

路由配置的价值不在于“写出一个 YAML”，而在于能预测某个 Method、Path 和 Header 组合会匹配哪条 Route、下游实际收到什么请求，以及实例不可用时失败发生在哪一层。

本文使用 `examples/microservices-insurance/gateway-service/`，实际解析版本为 Spring Cloud Gateway 5.0.2。Gateway 使用 WebFlux 与 Reactor Netty，业务服务 `application-service` 使用 Spring MVC 与 Tomcat。两种 Web 栈位于不同进程，不需要统一。

## 一、Route不是一个转发地址

Spring Cloud Gateway 的一条 Route 包含四类信息：

| 元素 | 作用 | 本文示例 |
|------|------|----------|
| ID | 观测、测试和配置定位 | `product-public` |
| URI | 下游目标或逻辑服务名 | `lb://product-service` |
| Predicate | 请求是否属于本 Route | Path、Method、Header |
| Filter | 匹配后如何修改请求和响应 | `RewritePath`、`AddResponseHeader` |

执行模型可以概括为：

```text
收到请求
  → HandlerMapping 按顺序检查 Route
  → 一条 Route 内所有 Predicate 都为 true
  → 选择该 Route
  → 合并 GlobalFilter 与 Route Filter
  → 按 Ordered 顺序执行请求阶段
  → LoadBalancer 把 lb://服务名解析为实例
  → Netty 发送下游请求
  → 过滤器按嵌套顺序处理响应
```

Predicate 是逻辑 AND，不是“写了多个备选条件”。需要 OR 时，通常应定义多条 Route 或使用明确的组合 Predicate。

## 二、建立可运行的Gateway模块

父工程新增 `gateway-service` 模块。核心依赖如下：

```xml
<!-- examples/microservices-insurance/gateway-service/pom.xml -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway-server-webflux</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-loadbalancer</artifactId>
</dependency>
```

`spring-cloud-starter-gateway-server-webflux` 已经提供响应式服务器能力，不应再添加 `spring-boot-starter-web`。如果同一 Gateway 进程混入 MVC，自动配置选择和过滤器模型会变得难以判断。

启动类没有业务逻辑：

```java
// gateway-service/src/main/java/com/example/insurance/gateway/GatewayServiceApplication.java
@SpringBootApplication
public class GatewayServiceApplication {
    /** 启动响应式 API Gateway 并注册到 Eureka。 */
    public static void main(String[] args) {
        SpringApplication.run(GatewayServiceApplication.class, args);
    }
}
```

## 三、三条路由如何匹配

完整路由位于 `gateway-service/src/main/resources/application.yml`：

```yaml
spring:
  cloud:
    gateway:
      server:
        webflux:
          routes:
            - id: product-canary-lab
              uri: lb://product-service
              predicates:
                - Path=/api/products/**
                - Method=GET
                - Header=X-Lab-Route, canary
              filters:
                - RewritePath=/api/products/(?<segment>.*), /internal/products/${segment}
                - AddResponseHeader=X-Selected-Route, product-canary-lab

            - id: product-public
              uri: lb://product-service
              predicates:
                - Path=/api/products/**
                - Method=GET
              filters:
                - RewritePath=/api/products/(?<segment>.*), /internal/products/${segment}
                - AddResponseHeader=X-Selected-Route, product-public

            - id: application-api
              uri: lb://application-service
              predicates:
                - Path=/api/applications/**
              filters:
                - AddResponseHeader=X-Selected-Route, application-api
```

匹配矩阵如下：

| 请求 | canary Route | public Route | 最终结果 |
|------|---------------|--------------|----------|
| `GET /api/products/HEALTH-001` | Header 不满足 | 满足 | `product-public` |
| 同路径且 `X-Lab-Route: canary` | 满足 | 也满足 | 先定义的 `product-canary-lab` |
| `POST /api/products/HEALTH-001` | Method 不满足 | Method 不满足 | 没有 Route，`404` |
| `GET /internal/products/HEALTH-001` | Path 不满足 | Path 不满足 | 内部路径未暴露，`404` |
| `GET /api/applications/APP-1001` | 不满足 | 不满足 | `application-api` |

canary Route 必须放在通用 Route 前面。若顺序颠倒，通用 Route 会先匹配，请求永远到不了 Header 实验路由。

::: warning Header Predicate不是授权
`X-Lab-Route` 由客户端控制，只适合诊断、实验分流或非安全路由条件。不能用 `X-Role`、`X-Admin` 等 Header 判断权限；身份和角色必须来自已验证令牌。
:::

## 四、RewritePath改变了什么

外部商品接口是：

```text
GET /api/products/HEALTH-001
```

产品服务只暴露内部接口：

```text
GET /internal/products/HEALTH-001
```

`RewritePath` 的正则捕获 `/api/products/` 后的所有内容，将其写入命名组 `segment`：

```text
输入：/api/products/HEALTH-001
正则：/api/products/(?<segment>.*)
捕获：segment = HEALTH-001
输出：/internal/products/HEALTH-001
```

本工程在 YAML 中直接保留 `${segment}`，并由 Gateway 5.0.2 的 Route 配置绑定交给 `RewritePath` 解释；路由测试已经证明最终下游路径正确。若改用 Java DSL，则替换值仍应表达同一个正则命名组，不能写成 Spring 属性占位符。

路径重写只改变转发请求，不会改变最初用于 Route Predicate 的匹配结果。响应里的 `X-Selected-Route` 是实验观测字段，生产系统更适合把 Route ID 写入受控指标或日志。

## 五、lb协议如何连接Eureka

`lb://product-service` 不是普通 URL：

```text
lb://product-service
  → ReactiveLoadBalancerClientFilter 识别 lb scheme
  → DiscoveryClient 提供 product-service 候选实例
  → LoadBalancer 选择一个实例
  → 目标替换为 http://127.0.0.1:8081 或 :8082
  → Netty 建立实际连接
```

这条链路有三种不同失败：

| 阶段 | 例子 | 证据 |
|------|------|------|
| 路由未匹配 | Method 或 Path 不满足 | `404`，尚未查询服务名 |
| 没有候选实例 | 注册表中无 `application-service` | LoadBalancer `NotFoundException` |
| 有实例但连接失败 | 注册表仍指向已停止端口 | `ConnectException` 或连接超时 |

本工程只把后两类归一为对外 `503`，内部日志仍可区分阶段。不能把“路由不存在”和“服务暂不可用”都变成 `500`。

## 六、WebFilter与GlobalFilter顺序决定实际语义

本工程定义的请求阶段顺序为：

| 层级与 Order | Filter | 作用 |
|----------------|--------|------|
| WebFilter `HIGHEST_PRECEDENCE` | `RequestIdWebFilter` | 在认证前校验或生成请求编号 |
| WebFilter | CORS、Spring Security | 处理预检、JWT 认证和入口角色 |
| GlobalFilter `HIGHEST_PRECEDENCE + 10` | `IdentityHeaderSanitizingGlobalFilter` | 删除外部身份 Header |
| GlobalFilter `-100` | `RateLimitGlobalFilter` | 按已认证主体或 IP 消耗额度 |
| GlobalFilter `-90` | `SecurityAuditGlobalFilter` | 包裹后续链路，记录最终状态 |
| GlobalFilter `-80` | `ServiceUnavailableGlobalFilter` | 捕获无实例和连接失败 |
| GlobalFilter `-70` | `SecurityResponseHeadersGlobalFilter` | 预设响应安全 Header |

Spring Security 与 CORS 是 WebFilter，位于 Gateway Route/GlobalFilter 体系外层。`RequestIdWebFilter` 又必须位于 Spring Security 之前，否则无令牌 `401` 会在请求编号生成前结束。认证完成后，GlobalFilter 才能从 `exchange.getPrincipal()` 获得 JWT 主体。

一个过滤器是否“先执行”不能只看类名。应同时检查它属于 WebFilter、GlobalFilter 还是 Route Filter，以及 `Ordered` 数值和响应阶段的反向嵌套。

## 七、用真实下游替身验证路由

`GatewayRoutingTest` 不启动 Eureka 和产品服务，而是启动一个 Reactor Netty HTTP 替身。替身返回它实际收到的 URI 与 Header，因此测试的是完整 Gateway 网络栈，不是单独调用正则函数。

替身核心代码如下：

```java
productBackend = HttpServer.create()
        .host("127.0.0.1")
        .port(0)
        .handle((request, response) -> response
                .header("Content-Type", "text/plain")
                .sendString(Mono.just(
                        request.uri() + "|" +
                        request.requestHeaders().get("X-Lab-Route")
                )))
        .bindNow();
```

测试把随机端口注册为 `product-service` 的唯一简单发现实例：

```java
@DynamicPropertySource
static void registerBackend(DynamicPropertyRegistry registry) {
    registry.add(
            "spring.cloud.discovery.client.simple.instances.product-service[0].uri",
            () -> "http://127.0.0.1:" + productBackend.port()
    );
}
```

普通路由断言：

```java
webTestClient.get()
        .uri("/api/products/HEALTH-001")
        .exchange()
        .expectStatus().isOk()
        .expectHeader().valueEquals("X-Selected-Route", "product-public")
        .expectBody(String.class)
        .isEqualTo("/internal/products/HEALTH-001|null");
```

canary 优先级断言：

```java
webTestClient.get()
        .uri("/api/products/HEALTH-001")
        .header("X-Lab-Route", "canary")
        .exchange()
        .expectStatus().isOk()
        .expectHeader().valueEquals("X-Selected-Route", "product-canary-lab")
        .expectBody(String.class)
        .isEqualTo("/internal/products/HEALTH-001|canary");
```

执行命令：

```powershell
.\mvnw.cmd -pl gateway-service -Dtest=GatewayRoutingTest test
```

实际结果为 10 项测试全部通过，其中包括路由、Header 清理、请求编号、CORS、安全 Header 和 `503`：

```text
Tests run: 10, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

## 八、验证服务不可用而不是伪造结果

测试将 `application-service` 简单发现实例指向没有监听的 `127.0.0.1:65534`，然后真实请求：

```java
webTestClient.get()
        .uri("/api/applications/APP-1001")
        .exchange()
        .expectStatus().isEqualTo(503)
        .expectHeader().contentType("application/problem+json")
        .expectBody()
        .jsonPath("$.type")
        .isEqualTo("https://example.com/problems/service-unavailable")
        .jsonPath("$.exception").doesNotExist();
```

这证明 Route 已匹配、LoadBalancer 已给出实例，但数据面连接失败。响应不返回 `127.0.0.1:65534`、异常类名或堆栈。

## 九、常见配置错误与定位方法

| 现象 | 优先检查 | 原因 |
|------|----------|------|
| 所有请求 `404` | 属性命名空间、Path、Method | Gateway 5 使用 `spring.cloud.gateway.server.webflux.routes` |
| canary 永不命中 | Route 顺序与 Header 正则 | 通用 Route 可能提前匹配 |
| 下游收到外部路径 | `RewritePath` 正则与替换值 | 捕获组名或转义错误 |
| 返回 `503` | 注册表候选和真实端口 | 路由成功不等于实例可连接 |
| Gateway 启动成 Tomcat | 依赖树是否混入 MVC | Web 栈选择错误 |
| Eureka 请求被负载均衡 | `RestClient.Builder` Bean 范围 | 基础设施客户端误用了 `@LoadBalanced` Builder |
| Filter 顺序与预期相反 | Filter 类型与 `getOrder()` | WebFilter、GlobalFilter、Route Filter 不在同一层 |

开启 `/actuator/gateway` 端点只能帮助查看已加载 Route，不能证明下游连接和过滤结果。最终仍需发送真实请求并观察下游、响应和日志。

## 十、生产边界

本地路由实验尚未覆盖：

- Gateway 多实例与配置一致性；
- Route 动态发布、灰度审批和回滚；
- DNS、Eureka 与 LoadBalancer 缓存的组合窗口；
- 连接池、连接超时、读取超时和整体调用预算；
- 大请求体、流式响应、WebSocket 与文件上传；
- 下游 TLS、证书轮换和服务身份；
- 写请求重试、幂等键与重复副作用。

::: tip 路由验收原则
一条路由只有在“匹配输入、实际下游 URI、实际 Header、失败状态和观测字段”都经过测试后，才算完成。仅看到 Gateway 启动日志中的 Route ID 不足以证明路由正确。
:::

下一篇将接入 Keycloak Device Authorization Flow，拆解 OAuth 2.0、OIDC、JWT 和 Resource Server 的边界，并让 Gateway 与业务服务独立验证同一个访问令牌。
