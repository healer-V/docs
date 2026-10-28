---
title: "序列化与错误契约"
tags:
  - JSON
  - 错误契约
  - OpenFeign
excerpt: "设计金额、时间、枚举、空值和泛型等 JSON 序列化边界，使用 ProblemDetail 表达稳定错误，并在 Feign Consumer 中区分业务拒绝、HTTP 错误、网络失败和解码异常。"
date: 2026-07-20
---

# 序列化与错误契约

Feign 接口两端使用相同 Java 类型，不代表网络契约自然兼容。对象需要转换为 HTTP 消息，Provider 的异常也不会跨进程原样抛给 Consumer。成功与失败都必须设计稳定、可观测且可演进的协议。

## 一、JSON 边界

- **只传输数据**：JSON 保存字段和值，不包含 Java 方法、构造器逻辑和对象身份。Consumer 得到的是重新构造的数据对象。
- **字段名是契约**：重命名 Java 字段可能改变 JSON。需要迁移时先兼容旧字段，再升级消费者。
- **未知字段**：Consumer 通常应容忍 Provider 增加字段，但关键协议需要通过测试锁定实际 ObjectMapper 配置。
- **缺失与 null**：缺失字段、显式 null、空字符串和空集合可能具有不同业务含义，需要在契约中说明。

## 二、金额与数字

- **使用 BigDecimal**：保费、保额和比例使用十进制类型，避免二进制浮点误差。
- **明确单位**：字段文档说明元、分或百分比。相同数值在单位不一致时会造成严重业务错误。
- **限制精度**：Provider 校验小数位、范围和舍入规则，不能把所有数字字符串直接接受。

## 三、日期与时间

- **时间点**：跨时区发生时间使用 `Instant` 或带偏移量格式。
- **业务日期**：生日、保障起期等只表示日期的字段使用 `LocalDate`，不人为添加时区。
- **格式固定**：使用 ISO 8601 等明确格式，不依赖机器 Locale 和默认时区。
- **精度兼容**：双方确认秒、毫秒和纳秒精度，数据库或其他语言可能截断更高精度。

## 四、枚举与状态

- **新值风险**：Provider 增加枚举值时，旧 Consumer 可能无法反序列化或进入未覆盖分支。
- **稳定编码**：对长期协议使用稳定业务编码，并在 Consumer 设计未知值处理。
- **状态机语义**：状态值之外还要说明允许转换、终态和并发更新规则。

## 五、错误分类

| 类型 | 示例 | Consumer 处理 |
|------|------|---------------|
| 参数错误 | 产品编码格式非法 | 修正请求，不重试 |
| 业务拒绝 | 产品暂停销售 | 返回明确业务结果 |
| 未找到 | 产品不存在 | 按业务场景处理 |
| 依赖不可用 | Provider 无实例 | 降级或稍后重试 |
| 调用超时 | Provider 未按时响应 | 结果可能未知 |
| Provider 异常 | 未处理服务端错误 | 告警并受控失败 |
| 解码异常 | JSON 与契约不兼容 | 阻止重试并修复契约 |

## 六、Provider 错误响应

### 1. 使用 ProblemDetail

Spring MVC 可以使用 `ProblemDetail` 返回标准错误字段，并通过扩展属性提供稳定业务码。

```java
// product-service/src/main/java/com/example/product/ProductErrorHandler.java
package com.example.product;

import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ProductErrorHandler {
    /**
     * 把产品不存在异常转换为稳定 HTTP 错误契约。
     *
     * @param exception 产品不存在异常
     * @return 不包含内部堆栈的标准错误详情
     */
    @ExceptionHandler(ProductNotFoundException.class)
    public ProblemDetail handleProductNotFound(ProductNotFoundException exception) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND,
                "指定产品不存在"
        );
        problem.setType(URI.create("https://errors.example.com/product/not-found"));
        problem.setTitle("产品不存在");
        problem.setProperty("code", "PRODUCT_NOT_FOUND");
        return problem;
    }
}
```

示例域名用于说明稳定错误类型格式，实际项目使用组织批准且可长期维护的标识。

- **不返回堆栈**：响应不能包含类名、SQL、内部地址和调用栈。详细异常只进入受控日志。
- **业务码稳定**：Consumer 根据稳定业务码处理，不解析自然语言 `detail`。

## 七、Feign 错误转换

### 1. ErrorDecoder

下面的局部示例展示按 HTTP 状态分类；完整实现还需要安全读取并校验 ProblemDetail 响应体。

```java
// application-service/src/main/java/com/example/application/client/ProductErrorDecoder.java
package com.example.application.client;

import feign.Response;
import feign.codec.ErrorDecoder;

public class ProductErrorDecoder implements ErrorDecoder {
    private final ErrorDecoder defaultDecoder = new ErrorDecoder.Default();

    /**
     * 根据产品服务响应状态转换调用异常。
     *
     * @param methodKey Feign 方法标识
     * @param response Provider HTTP 响应
     * @return 调用方能够分类处理的异常
     */
    @Override
    public Exception decode(String methodKey, Response response) {
        if (response.status() == 404) {
            return new RemoteProductNotFoundException(methodKey);
        }
        return defaultDecoder.decode(methodKey, response);
    }
}
```

- **配置范围**：ErrorDecoder 可以按客户端配置，避免一个全局 Decoder 把不同服务的错误码混为一类。
- **保留必要上下文**：异常记录目标服务、方法、HTTP 状态和追踪标识，不记录敏感请求体。

## 八、网络错误

- **没有错误响应体**：连接失败和读取超时没有 Provider ProblemDetail，调用方只能根据异常类型和上下文处理。
- **超时结果未知**：写操作读取超时时，Provider 可能已经完成。调用方应查询状态或使用幂等键，不直接再次创建。
- **无可用实例**：LoadBalancer 找不到实例时，应转换为明确的依赖不可用错误并进入服务级指标。

## 九、契约兼容

- **增加字段**：确认旧 Consumer 忽略未知字段，新字段缺失时新 Consumer 有兼容行为。
- **改变错误**：新增业务错误码需要 Consumer 有未知码兜底；不能把原来的业务拒绝改成可重试 5xx。
- **修改 Content-Type**：JSON、文件和流式响应切换属于协议变化，需要新接口或明确迁移。
- **契约测试**：Provider 和 Consumer 分别验证成功与所有关键错误响应，不只测试一个正常 JSON。

## 十、安全检查

- **输入限制**：限制字符串长度、集合大小、数值范围和嵌套深度，防止资源消耗攻击。
- **输出脱敏**：客户身份、联系方式和内部错误详情按最小必要原则返回。
- **日志脱敏**：Feign FULL 日志和异常响应体可能包含敏感数据，生产默认关闭正文日志。
- **错误一致**：认证、业务和系统错误都使用可区分的状态与业务码，避免全部返回 HTTP 200。
