---
title: "Apollo 与 Spring Boot 集成"
tags:
  - Apollo
  - Spring Boot
  - Config Data
excerpt: "基于 Apollo Java Client 2.5 和 Spring Boot Config Data 接入 Apollo，管理 AppId、环境、Namespace、配置绑定、本地缓存和变更监听，并明确动态配置的安全边界。"
date: 2026-07-20
---

# Apollo 与 Spring Boot 集成

本文以 Apollo Java Client 2.5 为基线。该版本加入 Spring Boot 4 兼容支持。示例默认使用 `local` Profile；只有显式启用 `apollo` Profile 时才导入远程 Namespace，避免本地开发和自动化测试依赖外部配置中心。

## 一、选择接入方式

- **Config Data**：Spring Boot 现代配置加载使用 `spring.config.import`。Apollo 的 `apollo-client-config-data` 提供 `apollo://` 位置解析器。
- **传统 Bootstrap**：旧项目可能使用 `apollo.bootstrap.enabled` 和 `@EnableApolloConfig`。维护存量代码时可以理解，但新示例不以旧 Bootstrap 流程作为主线。
- **不混用两套主流程**：同一应用同时使用多个 Apollo 注入入口容易产生重复 PropertySource 和优先级困惑，应根据客户端版本选定一种方案。

## 二、添加依赖

### 1. Config Data 客户端

```xml
<!-- product-service/pom.xml -->
<dependency>
    <groupId>com.ctrip.framework.apollo</groupId>
    <artifactId>apollo-client-config-data</artifactId>
    <version>2.5.0</version>
</dependency>
```

Apollo Client 不由 Spring Cloud BOM 管理，版本需要单独固定并验证 Spring Boot 兼容性。

- **不引入 Server 依赖**：业务服务只依赖 Java Client，不嵌入 Portal、Admin Service 或 Config Service。

## 三、Profile 隔离

### 1. 本地配置

```yaml

# product-service/src/main/resources/application-local.yml
insurance:
  product:
    query-timeout: 800ms
    sale-enabled: true
```

### 2. Apollo 导入

```yaml

# product-service/src/main/resources/application-apollo.yml
spring:
  config:
    import:
      - apollo://application
      - apollo://insurance.rules
```

如果某个 Namespace 允许缺失，可以使用 Spring Config Data 的 `optional:` 前缀；关键配置不应为了“成功启动”全部设为可选。

### 3. 启动参数

下面使用系统属性明确客户端身份与 Config Service 地址：

```powershell
java `
  "-Dspring.profiles.active=apollo" `
  "-Dapp.id=product-service" `
  "-Denv=DEV" `
  "-Dapollo.cluster=default" `
  "-Dapollo.configService=http://apollo-config.example" `
  -jar .\product-service.jar
```

示例地址是格式占位，不代表真实环境。生产值应由部署平台安全注入。

## 四、配置绑定

### 1. 使用 ConfigurationProperties

::: details 查看 product-service 的 ProductRuleProperties.java 完整代码
```java
// product-service/src/main/java/com/example/product/config/ProductRuleProperties.java
package com.example.product.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** 保存产品规则配置，并在绑定阶段执行边界验证。 */
@ConfigurationProperties(prefix = "insurance.product")
public record ProductRuleProperties(Duration queryTimeout, boolean saleEnabled) {
    /** 验证产品规则配置的必要边界。 */
    public ProductRuleProperties {
        if (queryTimeout == null || queryTimeout.isNegative() || queryTimeout.isZero()) {
            throw new IllegalArgumentException("queryTimeout 必须为正数");
        }
    }
}
```
:::

### 2. 启用绑定

```java
// product-service/src/main/java/com/example/product/config/ProductConfiguration.java
package com.example.product.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(ProductRuleProperties.class)
public class ProductConfiguration {
}
```

- **启动时失败**：缺少关键配置或值越界时让应用拒绝启动，通常比带着不可解释默认值进入生产更安全。

## 五、变更监听

### 1. 只监听相关前缀

::: details 查看 product-service 的 ProductRuleChangeListener.java 完整代码
```java
// product-service/src/main/java/com/example/product/config/ProductRuleChangeListener.java
package com.example.product.config;

import com.ctrip.framework.apollo.model.ConfigChangeEvent;
import com.ctrip.framework.apollo.spring.annotation.ApolloConfigChangeListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class ProductRuleChangeListener {
    private static final Logger LOGGER = LoggerFactory.getLogger(ProductRuleChangeListener.class);

    /**
     * 记录产品规则键变化，后续由受控刷新逻辑处理。
     *
     * @param event Apollo 配置变化事件
     */
    @ApolloConfigChangeListener(interestedKeyPrefixes = "insurance.product.")
    public void onProductRuleChanged(ConfigChangeEvent event) {
        // 只记录键名，不输出可能包含敏感内容的新旧值。
        LOGGER.info("产品规则配置发生变化，keys={}", event.changedKeys());
    }
}
```
:::

- **不在监听器执行重任务**：监听器不直接重建大型连接池、不调用远程服务，也不执行长事务。需要复杂处理时提交到受控执行器并设计幂等。
- **绑定对象是否刷新要验证**：Spring Environment 更新不代表所有 Bean、第三方组件和缓存自动重建。每类动态属性都要通过集成测试证明生效方式。

## 六、本地缓存

- **缓存用途**：Apollo Client 保存最近成功配置，使控制面短暂不可用时应用仍可能继续运行。
- **缓存目录**：容器环境需要为缓存选择可写、受控且不会泄露敏感信息的目录。
- **缓存不是永久配置源**：监控客户端与 Config Service 的连接、Release 版本和更新时间，避免实例长期使用陈旧配置而无人发现。

## 七、配置优先级

- **明确覆盖顺序**：系统属性、环境变量、本地文件和 Apollo Namespace 的优先级应在项目规范中记录并测试。
- **多 Namespace**：同名键出现在多个 Namespace 时，导入顺序会影响最终值。应减少重名，并用测试锁定预期。
- **紧急覆盖**：紧急环境变量覆盖需要审计和清理，不能永久脱离 Apollo 成为隐形配置。

## 八、失败策略

- **关键配置缺失**：服务身份、数据安全和核心业务阈值缺失时应拒绝启动。
- **可选增强缺失**：非核心功能可以使用安全默认值或关闭，但必须记录降级状态。
- **运行中断连**：继续使用最后配置并告警，同时记录断连持续时间；不能因为无法获取新配置立即清空现有值。

每个动态配置项都应在登记时确定失败策略，避免监听器收到非法值后临时决定：

| 配置类型 | 非法或缺失时的策略 | 示例 |
|----------|--------------------|------|
| 服务身份、安全边界 | 拒绝启动或拒绝应用新值 | AppId、允许访问的受控范围 |
| 核心业务阈值 | 保留最近合法值并告警 | 最低保费、审批上限 |
| 非核心增强开关 | 使用明确安全默认值 | 推荐、展示增强能力 |
| 需要重建资源的参数 | 不动态应用，随受控重启生效 | 连接池拓扑、线程模型 |

“配置已经进入 Spring Environment”不等于业务对象已经安全更新。测试需要直接观察最终 Bean、缓存或客户端行为，并验证多实例在短暂使用不同值时仍然兼容。

## 九、测试策略

- **绑定测试**：使用本地属性验证 Duration、布尔和数值边界，测试缺失值和非法值会失败。
- **Profile 测试**：默认测试不连接 Apollo；专用集成测试使用 Apollo Mock Server 或受控测试环境。
- **变更测试**：验证监听范围、重复通知、非法新值、处理失败和回滚行为。

## 十、版本与参考

- **当前边界**：示例针对 Apollo Java Client 2.5.0。该版本发布说明确认支持 Spring Boot 4.0；在 Spring Boot 4.1 使用前仍需执行完整编译和启动测试。

版本升级和接入行为应以 [Apollo Java Client 发布版本](https://github.com/apolloconfig/apollo-java/releases) 与 [Apollo Java Client 源码](https://github.com/apolloconfig/apollo-java) 为准，并在目标 Spring Boot 版本上执行绑定、启动、断连和变更测试。

::: warning 公司环境差异
公司 Apollo 可能通过统一 Starter、环境变量或平台注入完成接入。本文解释官方客户端模型，不推测内部封装的配置键和优先级。
:::
