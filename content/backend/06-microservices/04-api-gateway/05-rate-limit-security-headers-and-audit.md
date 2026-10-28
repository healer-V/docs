---
title: "网关限流、安全响应头与审计实践"
tags:
  - Bucket4j
  - CORS
  - Problem Details
  - 安全审计
excerpt: "实现每主体 5 次/10 秒的 Bucket4j 限流、有界 Caffeine 状态、精确 CORS、安全响应头、统一 Problem Details 和脱敏审计，并通过真实 Gateway 请求验证 429、Retry-After、503 与日志字段，说明单实例方案的生产边界。"
date: 2026-07-23
---

# 网关限流、安全响应头与审计实践

入口治理不能停留在“加一个限流注解”和“打印请求日志”。一个可用方案需要回答：额度属于谁、状态存在哪里、并发是否安全、何时恢复、客户端得到什么证据、Gateway 扩容后是否仍成立，以及日志如何支持排障而不泄露凭证。

本文基于 `gateway-service` 的 Bucket4j 8.18.0、Caffeine 3.2.4 和 Spring Cloud Gateway 5.0.2 实现，所有状态码和 Header 都经过真实 HTTP 测试。

## 一、先定义限流契约

本地实验规则为：

| 参数 | 值 | 含义 |
|------|----|------|
| 容量 | 5 token | 一个主体最多积累 5 次额度 |
| 补充 | 每 10 秒一次补满 5 token | 固定周期补充 |
| 消耗 | 每个投保 API 请求 1 token | 成功代理和下游失败都消耗 |
| 主体键 | 已认证 JWT `sub` | 用户名变化不影响额度 |
| 匿名兜底 | TCP 来源 IP | 不信任外部 `X-Forwarded-For` |
| 适用路径 | `/api/applications/**` | 商品查询不参与本实验额度 |
| 拒绝响应 | `429` + `Retry-After` | 客户端知道最早重试时间 |

“每秒 10 次”仍然不完整。至少还要说明突发容量、补充模型、身份维度、失败请求是否计数和多实例一致性。

## 二、令牌桶如何变化

容量为 5 的令牌桶初始状态：

```text
时间 0s： [● ● ● ● ●] 5
请求 1： [● ● ● ● ○] 4
请求 2： [● ● ● ○ ○] 3
请求 3： [● ● ○ ○ ○] 2
请求 4： [● ○ ○ ○ ○] 1
请求 5： [○ ○ ○ ○ ○] 0
请求 6： 无 token，返回 429
时间 10s：一次补充到容量上限 5
```

本工程使用 intervally refill，而不是 greedy refill：

| 模型 | 补充方式 | 适用观察 |
|------|----------|----------|
| Intervally | 周期边界一次补充 | 行为直观，边界处可能瞬间突发 |
| Greedy | 周期内连续按比例补充 | 流量更平滑，重试时间动态变化 |

没有绝对更好的模型，必须根据上游行为和下游容量选择。

## 三、实现有界本地Bucket

限流状态不能放进无界 `ConcurrentHashMap`。攻击者可以制造大量身份或来源地址，导致 Gateway 内存持续增长。

本工程使用：

```java
private final Cache<String, Bucket> buckets = Caffeine.newBuilder()
        .maximumSize(10_000)
        .expireAfterAccess(30, TimeUnit.MINUTES)
        .build();
```

两个边界分别控制：

- `maximumSize(10_000)`：主体数量有硬上限；
- `expireAfterAccess(30分钟)`：长期不活跃主体会回收。

Bucket4j 令牌桶构建：

```java
private Bucket newBucket() {
    Bandwidth limit = Bandwidth.builder()
            .capacity(capacity)
            .refillIntervally(capacity, refillPeriod)
            .build();
    return Bucket.builder().addLimit(limit).build();
}
```

`Bucket.tryConsumeAndReturnRemaining(1)` 是原子操作，返回是否成功、剩余额度和等待补充的纳秒数。

## 四、为什么按sub而不是用户名

限流键提取逻辑：

```java
private String subjectKey(
        Principal principal,
        ServerWebExchange exchange
) {
    if (principal instanceof JwtAuthenticationToken authentication) {
        return "sub:" + authentication.getToken().getSubject();
    }
    return principal.getName() == null
            ? clientIpKey(exchange)
            : "principal:" + principal.getName();
}
```

使用 `preferred_username` 会产生两个问题：

1. 用户名修改后获得一套新额度；
2. 不同身份源可能出现同名用户。

`sub` 是发行方范围内的稳定主体标识。若系统接受多个 Issuer，限流键还应包含 Issuer，例如 `iss + "|" + sub`，避免不同身份域的 `sub` 碰撞。

## 五、429响应如何让客户端可恢复

消耗成功时返回：

```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
```

消耗失败时计算向上取整的秒数：

```java
long retryAfter = Math.max(
        1,
        (long) Math.ceil(
                probe.getNanosToWaitForRefill() / 1_000_000_000.0
        )
);
response.getHeaders().set("Retry-After", Long.toString(retryAfter));
```

Problem Details 响应：

```json
{
  "type": "https://example.com/problems/rate-limit-exceeded",
  "title": "Too many requests",
  "status": 429,
  "detail": "The request quota is exhausted; retry after the indicated interval.",
  "instance": "/api/applications/APP-1001",
  "requestId": "..."
}
```

客户端不应立即循环重试 `429`。应遵守 `Retry-After`，并对并发请求做合并或排队。

## 六、真实限流测试

`GatewayRateLimitTest` 使用独立 Spring 上下文和真实随机端口。它把 `application-service` 指向未监听端口，前 5 次请求进入代理链并返回 `503`，第 6 次在代理前被限流。

这能证明失败请求也消耗额度：

```java
for (int requestNumber = 1; requestNumber <= 5; requestNumber++) {
    webTestClient.get()
            .uri("/api/applications/APP-1001")
            .exchange()
            .expectStatus().isEqualTo(503)
            .expectHeader().valueEquals(
                    "X-RateLimit-Remaining",
                    Integer.toString(5 - requestNumber)
            );
}

webTestClient.get()
        .uri("/api/applications/APP-1001")
        .exchange()
        .expectStatus().isEqualTo(429)
        .expectHeader().valueEquals("X-RateLimit-Remaining", "0")
        .expectHeader().exists("Retry-After");
```

执行结果：

```text
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
```

若下游失败不计数，攻击者可以利用最昂贵的失败路径持续消耗连接和线程资源。

## 七、单实例限流何时失效

本地 Bucket 的局限是确定的：

| 场景 | 实际行为 |
|------|----------|
| Gateway 重启 | 全部额度重置 |
| 两个 Gateway 实例 | 同一用户拥有两套独立额度 |
| 负载均衡不粘滞 | 用户可在实例间交替消耗 |
| Caffeine 淘汰 Bucket | 该主体重新获得满额 |
| 集群扩容 | 总允许速率随实例数增加 |

因此本实现适合：

- 单实例本地实验；
- 每实例自我保护；
- 允许近似额度的低风险接口。

需要全局配额时应使用 Redis、集中限流服务或数据面网关提供的原子计数能力，并明确：

- key 分片与热点；
- Redis 不可用时 fail-open 还是 fail-closed；
- 时钟、Lua/原子命令和过期策略；
- 多区域一致性与延迟；
- 配置发布和租户隔离；
- 限流服务本身的容量与降级。

## 八、CORS不是认证

本工程只允许 `http://localhost:5173`：

```java
CorsConfiguration configuration = new CorsConfiguration();
configuration.setAllowedOrigins(List.of(allowedOrigin));
configuration.setAllowedMethods(List.of("GET", "POST", "OPTIONS"));
configuration.setAllowedHeaders(List.of(
        "Authorization",
        "Content-Type",
        "X-Request-Id"
));
configuration.setAllowCredentials(false);
configuration.setMaxAge(600L);
```

允许来源的预检请求得到 `200` 与：

```http
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET,POST,OPTIONS
```

未知来源的预检得到 `403`。但非浏览器客户端仍可直接发送 HTTP 请求，因此 CORS 只约束浏览器是否允许页面读取响应，不能阻止 curl、移动端或恶意服务调用 API。

使用 `allowedOrigins=*` 同时允许凭证是危险配置。Bearer Token 场景也应列出明确来源，避免任意站点通过用户浏览器读取 API 响应。

## 九、安全响应头解决什么

Gateway 为代理响应设置：

| Header | 值 | 目的 |
|--------|----|------|
| `X-Content-Type-Options` | `nosniff` | 阻止浏览器猜测其他内容类型 |
| `X-Frame-Options` | `DENY` | 阻止页面被旧式 Frame 嵌入 |
| `Referrer-Policy` | `no-referrer` | 不向外发送来源 URL |
| `Content-Security-Policy` | `default-src 'none'; frame-ancestors 'none'` | API 响应默认不加载资源且不可嵌入 |

这些 Header 不能修复 SQL 注入、越权或无效 JWT。它们只是浏览器侧纵深防御。

测试直接断言代理响应 Header：

```java
.expectHeader().valueEquals("X-Content-Type-Options", "nosniff")
.expectHeader().valueEquals("X-Frame-Options", "DENY")
.expectHeader().valueEquals("Referrer-Policy", "no-referrer")
.expectHeader().valueEquals(
        "Content-Security-Policy",
        "default-src 'none'; frame-ancestors 'none'"
);
```

## 十、统一Problem Details

错误响应由一个写入器复用，字段固定为：

| 字段 | 来源 | 约束 |
|------|------|------|
| `type` | 稳定问题 URI | 可供客户端分类，不随异常类变化 |
| `title` | 简短标题 | 不含内部策略 |
| `status` | HTTP 状态 | 与响应状态一致 |
| `detail` | 可公开说明 | 不含角色、IP、端口和堆栈 |
| `instance` | 请求 Path | 不含查询敏感参数 |
| `requestId` | 已规范化 Header | 用于日志关联 |

网关当前类型包括：

- `authentication-required`；
- `access-denied`；
- `rate-limit-exceeded`；
- `service-unavailable`。

无实例和连接失败都对外返回 `503`，但服务端应通过异常分类、Route ID 和指标保留诊断差异。

## 十一、审计日志如何避免泄密

本工程审计格式：

```text
security_audit requestId=ec80bf89-ac19-4b39-a0ea-1576a24c14fe
subject=anonymous method=GET path=/api/applications/APP-1001
status=503 durationMs=23
```

已认证请求的 `subject` 记录 JWT `sub`，不记录：

- `Authorization` Header；
- 访问令牌、刷新令牌和 ID Token；
- 用户密码、邮箱和姓名；
- 完整请求或响应正文；
- 下游内部地址；
- Spring Security Authentication 对象的字符串形式。

过滤器只提取必要字段：

```java
LOGGER.info(
        "security_audit requestId={} subject={} method={} path={} status={} durationMs={}",
        requestId,
        subject,
        exchange.getRequest().getMethod(),
        exchange.getRequest().getPath().value(),
        status,
        durationMs
);
```

Spring Security 在 Route 匹配前拒绝 `401/403`，因此路由阶段的 `SecurityAuditGlobalFilter` 无法观察这两类请求。认证和授权失败处理器另外记录不含凭证的拒绝事件：

```text
security_rejection requestId=54ce7b3e-5a8b-41ec-b962-770660bb9cce
subject=anonymous method=GET path=/api/applications/APP-1001
status=401 reason=authentication_required
```

`RequestIdWebFilter` 位于 Spring Security 之前，所以这类早期拒绝也能与客户端响应关联。`403` 事件只记录 `subject=authenticated`，避免错误处理器序列化完整 Authentication 对象。

生产环境还应增加稳定事件类型、Route ID、客户端应用 ID 和拒绝分类，并通过日志平台设置访问控制、保留期和告警。不要通过“先全部记录，再在日志平台脱敏”处理 Bearer Token；凭证一旦写入文件就已经泄露。

## 十二、限流、熔断和重试的边界

三个机制解决不同问题：

| 机制 | 保护对象 | 触发依据 | 主要结果 |
|------|----------|----------|----------|
| 限流 | Gateway 与下游容量 | 请求速率或并发 | `429` |
| 熔断 | 调用方资源 | 最近失败率、慢调用 | 快速失败或降级 |
| 重试 | 短暂传输失败 | 明确可重试异常 | 再次调用 |

本章没有伪造一个“所有异常都熔断和重试”的配置。写请求可能产生重复审核，熔断窗口和降级数据也需要业务定义。生产引入 Resilience4j 前应先建立调用预算：

```text
上游总预算
  ≥ Gateway 处理
  + 下游连接超时
  + 读取超时
  + 有限重试退避
```

重试次数、单次超时和熔断慢调用阈值必须共同设计。

## 十三、验证与生产检查

执行 Gateway 全部测试：

```powershell
.\mvnw.cmd -pl gateway-service test
```

实际结果：

```text
Tests run: 14, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

上线前继续检查：

1. 限流键是否会把不同租户或 Issuer 错误合并；
2. 多实例是否要求全局一致额度；
3. 状态存储失败时采用何种策略；
4. `429` 是否包含可执行的重试信息；
5. CORS 是否只允许真实前端来源；
6. 安全 Header 是否覆盖错误响应；
7. Problem Details 是否有稳定版本与兼容策略；
8. 审计是否能按请求编号关联且不含凭证；
9. 高基数字段是否会使指标系统失控；
10. Gateway 重启、扩容和下游停服是否经过故障演练。

至此，路由、认证、最终对象授权和入口治理形成了完整链路。真实运行时仍需通过 Keycloak Device Flow、多进程 Eureka 环境和令牌过期实验验证身份面与数据面的组合行为。
