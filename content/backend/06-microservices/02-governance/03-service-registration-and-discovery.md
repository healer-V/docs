---
title: "Spring Cloud 服务注册与发现"
tags:
  - Eureka
  - Spring Cloud
  - 服务注册
excerpt: "使用 Spring Cloud 2025.1 创建 Eureka Server 和注册客户端，配置稳定服务身份、查询服务实例，并掌握本地验证、正常下线和多环境地址管理方法。"
date: 2026-07-20
---

# Spring Cloud 服务注册与发现

本文以 Java 21、Spring Boot 4.1 和 Spring Cloud 2025.1 为基线，展示最小注册发现链路。示例只用于本地学习；生产环境还需要认证、TLS、多节点、容量和监控设计。

## 一、版本管理

### 1. 使用 Spring Cloud BOM

Spring Cloud 组件应通过 Release Train BOM 管理，不为 Eureka、LoadBalancer 和 OpenFeign 分别拼接版本。

```xml
<!-- pom.xml -->
<properties>
    <java.version>21</java.version>
    <spring-cloud.version>2025.1.2</spring-cloud.version>
</properties>

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>${spring-cloud.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

- **核对兼容矩阵**：Release Train 必须与 Spring Boot 版本匹配。升级时以 [Spring Cloud 官方兼容关系](https://spring.io/projects/spring-cloud/) 为准。

## 二、创建 Eureka Server

### 1. 添加依赖

```xml
<!-- discovery-server/pom.xml -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
</dependency>
```

### 2. 启用 Server

```java
// discovery-server/src/main/java/com/example/discovery/DiscoveryServerApplication.java
package com.example.discovery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@EnableEurekaServer
@SpringBootApplication
public class DiscoveryServerApplication {
    /**
     * 启动本地 Eureka Server。
     *
     * @param args 命令行参数
     */
    public static void main(String[] args) {
        SpringApplication.run(DiscoveryServerApplication.class, args);
    }
}
```

### 3. 本地单节点配置

```yaml

# discovery-server/src/main/resources/application.yml
server:
  port: 8761

spring:
  application:
    name: discovery-server

eureka:
  client:
    register-with-eureka: false
    fetch-registry: false
```

单节点关闭自注册和注册表拉取仅适用于本地学习，不是生产高可用方案。

## 三、注册业务服务

### 1. 添加客户端依赖

```xml
<!-- product-service/pom.xml -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

### 2. 配置身份与 Server

```yaml

# product-service/src/main/resources/application.yml
server:
  port: 8081

spring:
  application:
    name: product-service

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

`defaultZone` 是区分大小写的 Map 键，不能随意改成其他拼写。

### 3. 启动应用

```java
// product-service/src/main/java/com/example/product/ProductServiceApplication.java
package com.example.product;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ProductServiceApplication {
    /**
     * 启动产品服务并由 Eureka Client 自动注册实例。
     *
     * @param args 命令行参数
     */
    public static void main(String[] args) {
        SpringApplication.run(ProductServiceApplication.class, args);
    }
}
```

当前 Spring Cloud 在发现客户端依赖存在时自动配置 DiscoveryClient，不需要机械添加 `@EnableDiscoveryClient`。

## 四、查询服务实例

### 1. 使用 DiscoveryClient

下面的内部诊断端点只展示实例查询，生产环境不应直接向公网暴露注册信息。

```java
// application-service/src/main/java/com/example/application/support/DiscoveryQueryController.java
package com.example.application.support;

import java.util.List;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DiscoveryQueryController {
    private final DiscoveryClient discoveryClient;

    /**
     * 创建服务发现诊断端点。
     *
     * @param discoveryClient Spring Cloud 服务发现抽象
     */
    public DiscoveryQueryController(DiscoveryClient discoveryClient) {
        this.discoveryClient = discoveryClient;
    }

    /**
     * 查询产品服务的当前实例列表。
     *
     * @return Eureka 客户端本地注册表中的产品服务实例
     */
    @GetMapping("/internal/discovery/product-service")
    public List<ServiceInstance> productInstances() {
        return discoveryClient.getInstances("product-service");
    }
}
```

- **不直接缓存结果**：DiscoveryClient 自身已经管理注册表更新。业务代码不应再建立无失效策略的永久实例缓存。

## 五、本地验证

### 1. 启动顺序

1. 启动 `discovery-server`；
2. 启动 `product-service`；
3. 启动查询方服务；
4. 查看 Eureka 控制台和实例查询端点。

- **验证服务名**：控制台中应看到稳定服务名和预期实例数。随机名称或环境后缀应通过统一规范生成。
- **验证多实例**：使用不同端口启动同一服务，确认两个实例都归属 `product-service`，再由负载均衡章节验证选择行为。

控制台、Consumer 和真实网络分别证明不同事实，三类证据不能互相替代：

| 验证位置 | 能证明什么 | 不能证明什么 |
|----------|------------|--------------|
| Eureka Server 控制台 | Server 已保存实例记录 | Consumer 已经拉取该记录、地址真实可达 |
| Consumer 的 DiscoveryClient | 当前客户端本地注册表包含实例 | 目标端口能够完成业务请求 |
| Consumer 实际调用 | 当前网络和目标接口可用 | 其他实例、其他网络区域同样可用 |

本地验证应记录实例注册、Consumer 首次发现和第一次调用成功的时间。这样在生产出现“控制台有实例但调用无实例”时，才能判断是注册失败、拉取延迟、缓存还是地址可达性问题。

## 六、地址与环境

- **不写死生产地址**：Eureka Server 地址通过环境配置或配置中心提供，代码和默认配置不能包含生产域名或凭据。
- **容器地址可达**：容器内的 `localhost` 只表示当前容器。上报地址和 Server 地址必须从消费者网络视角验证。
- **多网卡选择**：主机存在多块网卡时，需要统一地址选择规则，避免注册不可达的管理网或虚拟网卡地址。

## 七、正常下线

- **主动注销**：Spring 应用正常关闭时，Eureka Client 默认会尝试注销实例。发布系统仍需预留流量摘除和请求排空时间。
- **优雅关闭**：仅从注册表删除实例不能保证在途请求已经完成，需结合 Spring Boot 优雅关闭和入口负载均衡策略。
- **异常退出**：强制终止进程无法主动注销，消费者可能在一段时间内继续看到该实例，因此必须配置调用超时。

## 八、安全边界

- **控制台不是公开页面**：Eureka 控制台和 API 会暴露内部服务拓扑，应限制网络访问并配置认证与 TLS。
- **元数据不保存秘密**：注册信息会被多个客户端读取，禁止放入 Token、密码和客户信息。
- **最小权限**：生产部署应控制谁能注册、查询和管理实例，防止伪造服务进入调用链。

## 九、常见问题

- **服务注册但无法调用**：优先检查实例上报地址是否从消费者网络可达，而不是只看控制台状态。
- **下线后仍被调用**：检查正常注销、租约、注册表拉取和负载均衡缓存的共同延迟。
- **本地可以生产失败**：本地单节点、固定端口和无认证配置不能直接复制到生产。
