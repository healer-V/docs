---
title: "OpenFeign Provider 与 Consumer"
tags:
  - OpenFeign
  - Spring MVC
  - 微服务通信
excerpt: "使用 Spring MVC 暴露产品查询 Provider，通过 Spring Cloud OpenFeign 创建 Consumer 代理，配置依赖、扫描范围和稳定契约，并验证一次完整的声明式 HTTP 调用。"
date: 2026-07-20
---

# OpenFeign Provider 与 Consumer

本文实现最小声明式调用：产品服务提供内部查询接口，投保服务通过 OpenFeign 调用。代码只展示通信边界，数据使用内存目录，不引入数据库和跨服务事务。

## 一、依赖准备

### 1. Consumer 依赖

```xml
<!-- application-service/pom.xml -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-loadbalancer</artifactId>
</dependency>
```

- **Provider 依赖**：Provider 使用 Spring MVC 暴露 HTTP 接口，不需要依赖 OpenFeign Starter。
- **契约依赖**：Provider 与 Consumer 可以依赖固定版本的 `insurance-contracts`，示例只共享 DTO，不共享服务实现。

## 二、Provider 业务入口

### 1. 产品目录

::: details 查看 product-service 的 ProductCatalog.java 完整代码
```java
// product-service/src/main/java/com/example/product/ProductCatalog.java
package com.example.product;

import com.example.insurance.product.ProductSummary;
import java.math.BigDecimal;
import org.springframework.stereotype.Service;

@Service
public class ProductCatalog {
    /**
     * 查询指定产品的消费者摘要。
     *
     * @param code 产品编码，不能为空
     * @return 产品摘要
     * @throws ProductNotFoundException 产品不存在时抛出
     */
    public ProductSummary findByCode(String code) {
        if (!"HEALTH-001".equals(code)) {
            throw new ProductNotFoundException(code);
        }
        return new ProductSummary(
                code,
                "健康保障计划",
                new BigDecimal("100.00"),
                true
        );
    }
}
```
:::

### 2. HTTP Controller

::: details 查看 product-service 的 ProductQueryController.java 完整代码
```java
// product-service/src/main/java/com/example/product/ProductQueryController.java
package com.example.product;

import com.example.insurance.product.ProductSummary;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/products")
public class ProductQueryController {
    private final ProductCatalog productCatalog;

    /**
     * 创建产品查询入口。
     *
     * @param productCatalog 产品目录服务
     */
    public ProductQueryController(ProductCatalog productCatalog) {
        this.productCatalog = productCatalog;
    }

    /**
     * 查询指定产品摘要。
     *
     * @param code 产品编码，不能为空
     * @return 产品摘要
     */
    @GetMapping("/{code}")
    public ProductSummary findByCode(@PathVariable String code) {
        return productCatalog.findByCode(code);
    }
}
```
:::

`ProductNotFoundException` 与错误响应将在错误契约文档中实现。

## 三、定义 Feign Client

### 1. 使用服务名

::: details 查看 application-service 的 ProductClient.java 完整代码
```java
// application-service/src/main/java/com/example/application/client/ProductClient.java
package com.example.application.client;

import com.example.insurance.product.ProductSummary;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "product-service", path = "/internal/products")
public interface ProductClient {
    /**
     * 通过产品服务查询产品摘要。
     *
     * @param code 产品编码，不能为空
     * @return 产品摘要
     */
    @GetMapping("/{code}")
    ProductSummary findByCode(@PathVariable String code);
}
```
:::

`name` 对应 Eureka 服务 ID。没有设置 `url` 时，Spring Cloud LoadBalancer 参与实例选择。

- **接口命名**：使用 `ProductClient` 明确远程边界，不把它命名为内部领域 Service 造成误解。

## 四、启用客户端扫描

### 1. 启动类

::: details 查看 application-service 的 ApplicationServiceApplication.java 完整代码
```java
// application-service/src/main/java/com/example/application/ApplicationServiceApplication.java
package com.example.application;

import com.example.application.client.ProductClient;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@EnableFeignClients(clients = ProductClient.class)
@SpringBootApplication
public class ApplicationServiceApplication {
    /**
     * 启动投保服务并注册指定 Feign Client。
     *
     * @param args 命令行参数
     */
    public static void main(String[] args) {
        SpringApplication.run(ApplicationServiceApplication.class, args);
    }
}
```
:::

- **显式扫描范围**：大型项目优先使用 `clients` 或明确包范围，避免意外扫描测试接口和不应启用的客户端。

## 五、调用远程服务

### 1. 投保校验

::: details 查看 application-service 的 ApplicationEligibilityService.java 完整代码
```java
// application-service/src/main/java/com/example/application/ApplicationEligibilityService.java
package com.example.application;

import com.example.application.client.ProductClient;
import org.springframework.stereotype.Service;

@Service
public class ApplicationEligibilityService {
    private final ProductClient productClient;

    /**
     * 创建投保资格校验服务。
     *
     * @param productClient 产品服务远程客户端
     */
    public ApplicationEligibilityService(ProductClient productClient) {
        this.productClient = productClient;
    }

    /**
     * 检查产品当前是否允许新投保。
     *
     * @param productCode 产品编码，不能为空
     * @return true 表示产品允许新投保
     */
    public boolean isProductAvailable(String productCode) {
        return productClient.findByCode(productCode).saleEnabled();
    }
}
```
:::

- **不隐藏远程成本**：调用方法所在类明确命名为 Client，业务服务知道该操作可能超时和失败。

## 六、配置服务身份

### 1. Consumer

```yaml

# application-service/src/main/resources/application.yml
spring:
  application:
    name: application-service
```

### 2. Provider

```yaml

# product-service/src/main/resources/application.yml
spring:
  application:
    name: product-service
```

- **名称必须一致**：`@FeignClient(name = "product-service")` 必须与 Provider 注册到 Eureka 的服务名一致。

## 七、本地调用验证

- **启动组件**：依次启动 Eureka、产品服务和投保服务。

### 1. 先验证 Provider

先直接调用产品服务接口，确认 Provider 契约正常。

```powershell
Invoke-RestMethod 'http://localhost:8081/internal/products/HEALTH-001'
```

- **查询 Consumer**：再通过投保服务的业务入口触发 Feign，验证服务发现和远程调用完整链路。
- **停止 Provider**：观察无可用实例和读取超时的错误类型，为后续错误映射建立测试基线。

## 八、固定 URL 模式

- **适用场景**：外部第三方接口或不通过 Eureka 管理的服务可以配置固定 URL。
- **与服务发现互斥**：设置固定 URL 后，调用不再依赖相同的 Eureka 实例发现流程。内部服务不要无意中绕过治理。
- **测试用途**：Consumer 测试可以把 URL 指向 WireMock，不需要启动真实 Provider 和 Eureka。

## 九、常见错误

- **Provider 也添加 Feign Starter**：服务端只提供 HTTP 接口时无需 Feign 依赖，避免无关自动配置。
- **共享实现模块**：Consumer 只依赖契约，不能依赖产品服务实现类和 Repository。
- **返回实体**：实体字段和关联变化会破坏远程契约，应转换为稳定 DTO。
- **默认无超时意识**：接口能够调用不代表生产安全，下一篇和超时文档会补齐实例选择与调用预算。

## 十、完成标准

- **编译**：Provider、Consumer 和契约模块能够独立构建。
- **运行**：Consumer 通过逻辑服务名调用 Provider，不写死实例地址。
- **边界**：共享模块不包含实体、Repository 和服务实现。
- **故障**：Provider 不可用时能够观察明确异常，而不是无限等待。
