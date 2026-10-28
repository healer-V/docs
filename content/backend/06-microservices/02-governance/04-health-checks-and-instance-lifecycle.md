---
title: "健康检查与实例生命周期"
tags:
  - Spring Boot Actuator
  - Eureka
  - 健康检查
excerpt: "区分进程存活、应用就绪和业务依赖健康，使用 Spring Boot Actuator 管理健康端点，并把启动、接流、摘流、请求排空和注销组成可验证的实例生命周期。"
date: 2026-07-20
---

# 健康检查与实例生命周期

健康检查的目标不是证明系统永远正常，而是回答特定决策问题：进程是否需要重启、实例是否可以接收新流量、运维是否需要介入。把所有依赖放进一个健康状态会造成级联摘流或掩盖真实故障。

## 一、三类状态

- **存活状态**：Liveness 表示进程是否还能继续工作。失败通常触发进程重启，因此不能把短暂下游故障加入存活判断。
- **就绪状态**：Readiness 表示实例是否准备接收新流量。启动初始化、请求排空或关键本地资源异常时可以变为未就绪。
- **业务健康**：数据库、消息和下游服务状态用于运维判断，不一定直接决定当前实例是否摘流。

## 二、引入 Actuator

### 1. 添加依赖

```xml
<!-- product-service/pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

### 2. 暴露必要端点

```yaml

# product-service/src/main/resources/application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      probes:
        enabled: true
      show-details: never
```

健康详情可能包含内部依赖信息，公网环境不能无条件设置为 `always`。

### 3. 端点语义

| 端点 | 用途 |
|------|------|
| `/actuator/health` | 聚合健康状态 |
| `/actuator/health/liveness` | 存活判断 |
| `/actuator/health/readiness` | 就绪判断 |

## 三、自定义健康检查

### 1. 只检查有决策价值的能力

下面示例检查本地产品目录是否已经加载，不发起远程调用：

```java
// product-service/src/main/java/com/example/product/health/ProductCatalogHealthIndicator.java
package com.example.product.health;

import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
public class ProductCatalogHealthIndicator implements HealthIndicator {
    private final ProductCatalogState catalogState;

    /**
     * 创建产品目录健康检查。
     *
     * @param catalogState 本地产品目录加载状态
     */
    public ProductCatalogHealthIndicator(ProductCatalogState catalogState) {
        this.catalogState = catalogState;
    }

    /**
     * 根据本地目录是否完成加载返回健康状态。
     *
     * @return 产品目录健康结果
     */
    @Override
    public Health health() {
        return catalogState.isLoaded()
                ? Health.up().build()
                : Health.down().withDetail("reason", "catalog-not-loaded").build();
    }
}
```

`ProductCatalogState` 由产品模块提供，示例省略其直接的状态存取实现。

- **设置检查超时**：健康端点不能因为检查数据库或网络而长期阻塞，否则监控和负载均衡会同时积压。
- **避免全链路递归检查**：投保服务健康检查再调用产品、客户和保单服务，会把一个下游故障扩散为全部上游未就绪。

## 四、Eureka 健康状态

- **注册存在与健康不同**：实例注册表示它存在于注册表，不证明每个业务接口都成功。

### 1. 健康处理器

Spring Cloud Netflix 可以把应用健康状态用于 Eureka 实例状态。启用前应验证状态变化、恢复和缓存传播时间。

```yaml

# product-service/src/main/resources/application.yml
eureka:
  client:
    healthcheck:
      enabled: true
  instance:
    health-check-url-path: /actuator/health
```

- **端点路径一致**：修改管理端口、Context Path 或安全规则后，要验证 Eureka 上报的健康地址仍可访问。

## 五、启动生命周期

- **加载基础配置**：应用先加载本地和 Apollo 配置，再初始化 Bean 与业务资源。
- **完成必要预热**：缓存、规则或连接池未准备好时，就绪状态不应过早变为可用。
- **注册实例**：注册完成后还存在客户端拉取和缓存延迟，不能把注册成功日志当作全网立即可用。

## 六、停机生命周期

- **停止接收新流量**：发布平台或服务发现先把实例从候选列表移除。
- **等待传播**：为注册表和客户端缓存更新预留时间，避免刚摘流仍收到新请求。

### 1. 配置优雅关闭与请求排空

Spring Boot 可以启用优雅关闭：

```yaml

# product-service/src/main/resources/application.yml
server:
  shutdown: graceful

spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s
```

- **注销并终止**：完成请求后注销 Eureka 并关闭进程。强制超时退出需要记录未完成请求数量。

停机顺序不能只由应用进程决定，还要与发布平台和消费者缓存配合：

| 阶段 | 实例状态 | 允许的行为 |
|------|----------|------------|
| 摘流前 | 就绪 | 正常接收新请求 |
| 摘流传播期 | 未就绪或从候选列表移除 | 不再分配新请求，但继续处理在途请求 |
| 排空期 | 进程仍存活 | 等待已有请求、事务和消息处理完成 |
| 终止期 | 注销并关闭 | 超过截止时间的未完成工作按既定策略失败或转移 |

如果直接先结束 JVM，再等待 Eureka 移除记录，Consumer 会在缓存窗口内继续选择已经不存在的实例。正确顺序应通过故障演练验证，而不是只检查优雅关闭配置是否存在。

## 七、依赖健康策略

- **数据库**：本服务完全依赖数据库处理请求时，连接不可用可以影响就绪，但需要避免瞬时抖动导致全部实例同时摘流。
- **下游服务**：下游失败通常由请求级超时和降级处理，不应默认让上游实例判定死亡。
- **配置中心**：Apollo 短暂不可用时，客户端可使用缓存配置继续运行。应监控配置同步，而不是立即停止全部业务。

## 八、健康端点安全

- **最小暴露**：只暴露平台所需端点，管理端点优先使用独立网络或管理端口。
- **隐藏敏感详情**：错误信息、数据库地址和配置内容不能直接返回未认证调用方。
- **监控访问控制**：为监控系统提供受控访问，不把安全问题通过关闭全部健康信息来规避。

## 九、验证清单

### 1. 启动

- 初始化期间是否未就绪；
- 就绪后是否注册预期地址；
- 配置或本地资源失败时状态是否明确。

### 2. 运行

- 健康检查是否有超时；
- 下游故障是否造成不必要级联摘流；
- 端点详情是否受保护。

### 3. 停机

- 是否先摘流再终止；
- 在途请求是否获得排空时间；
- Eureka 和消费者多久不再返回旧实例。

::: warning API 包差异
Spring Boot 4 对 Actuator 健康贡献器的包结构进行了模块化调整。示例以 4.1.x 为边界，使用其他版本时应根据对应 JavaDoc 核对导入包。
:::

