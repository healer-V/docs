---
title: "分层授权、对象权限与可信身份上下文"
tags:
  - Spring Security
  - 对象级授权
  - JWT
  - 零信任
excerpt: "通过两张投保申请和三个身份建立角色、接口、所有权与审核区域权限矩阵，复现伪造 X-User-Id 和绕过 Gateway 攻击，解释为何业务服务必须从自己验证的 JWT 重建主体，并给出 401、403、隐藏对象 404 的选择依据。"
date: 2026-07-23
---

# 分层授权、对象权限与可信身份上下文

认证成功只说明“这个请求携带了可信身份”，不说明该身份能执行任意操作。一个拥有合法访问令牌的普通用户，仍可能读取他人的投保申请、调用审核接口或伪造身份 Header。

本文在 `application-service` 中实现最终授权。Gateway 负责入口粗筛，但业务服务不把“请求来自 Gateway”当成信任依据。

## 一、把认证和三层授权分开

同一个请求至少经过四个判断：

| 层级 | 问题 | 输入 | 本工程结果 |
|------|------|------|------------|
| 认证 | Token 是否由受信发行方签发且仍有效 | 签名、`iss`、`aud`、时间 | 失败返回 `401` |
| 路径授权 | 该角色能否访问这个 HTTP 接口 | Method、Path、Authority | 失败返回 `403` |
| 对象授权 | 该主体能否观察这一个申请 | `sub`、owner、region | 不可观察返回 `404` |
| 状态授权 | 当前对象状态是否允许此操作 | 申请状态、业务规则 | 应返回领域冲突，例如 `409` |

本章实现前三层。状态机属于投保领域，不为了演示安全而伪造复杂流程。

::: warning 角色不是对象权限
`ROLE_APPLICANT` 表示“可以进入申请人能力”，不表示“可以读取全部申请”。如果 Controller 只有 `hasRole("APPLICANT")`，任一申请人都可能枚举其他申请编号。
:::

## 二、固定数据让权限结果可重复

业务服务只存稳定的 Keycloak `sub`，不使用可修改的 `preferred_username` 作为所有权主键。

| 申请 | ownerSubject | 区域 | 初始状态 |
|------|--------------|------|----------|
| `APP-1001` | `11111111-1111-1111-1111-111111111111` | EAST | SUBMITTED |
| `APP-2001` | `22222222-2222-2222-2222-222222222222` | WEST | SUBMITTED |

三个实验身份为：

| 用户 | `sub` | Realm角色 | `review_regions` |
|------|-------|-----------|------------------|
| `applicant-a` | `11111111-1111-1111-1111-111111111111` | applicant | 无 |
| `applicant-b` | `22222222-2222-2222-2222-222222222222` | applicant | 无 |
| `reviewer-a` | `33333333-3333-3333-3333-333333333333` | reviewer | EAST |

授权矩阵因此可以明确写成：

| 主体与操作 | APP-1001 | APP-2001 |
|------------|----------|----------|
| applicant-a 读取 | `200` | 隐藏对象 `404` |
| applicant-b 读取 | 隐藏对象 `404` | `200` |
| reviewer-a 读取 | `200` | 隐藏对象 `404` |
| reviewer-a 审核 | `200`，状态变为 REVIEWED | 隐藏对象 `404` |
| 任一 applicant 审核 | `403` | `403` |

## 三、Gateway只做入口粗筛

Gateway 的路径规则如下：

```java
// gateway/security/GatewaySecurityConfiguration.java
.authorizeExchange(exchange -> exchange
        .pathMatchers("/actuator/health", "/actuator/info").permitAll()
        .pathMatchers(HttpMethod.GET, "/api/products/**").permitAll()
        .pathMatchers(HttpMethod.GET, "/api/applications/eligibility/**").authenticated()
        .pathMatchers(HttpMethod.GET, "/api/applications/*")
            .hasAnyRole("APPLICANT", "REVIEWER")
        .pathMatchers(HttpMethod.POST, "/api/applications/*/review")
            .hasRole("REVIEWER")
        .anyExchange().denyAll())
```

这些规则能在入口拒绝明显无效请求，却无法回答以下问题：

- `APP-1001` 的 ownerSubject 是谁；
- `reviewer-a` 是否覆盖 EAST；
- 申请当前是否允许审核；
- 返回视图中哪些字段可见。

因此 `application-service` 配置相同的接口角色门禁，并在 Service 内执行对象规则。Gateway 规则是性能和治理层的早期拒绝，后端规则才是不可绕过的安全边界。

## 四、从已验证JWT构建权限

Keycloak Realm 角色位于：

```json
{
  "realm_access": {
    "roles": ["applicant"]
  }
}
```

Spring Security 默认更关注 `scope`/`scp`。本工程显式转换 Realm 角色：

::: details 查看 KeycloakRealmRoleConverter.java 完整代码
```java
// application/security/KeycloakRealmRoleConverter.java
public final class KeycloakRealmRoleConverter
        implements Converter<Jwt, Collection<GrantedAuthority>> {

    /** 提取 Realm 角色，并忽略格式异常的声明。 */
    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess == null
                || !(realmAccess.get("roles") instanceof Collection<?> roles)) {
            return List.of();
        }

        return roles.stream()
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .map(role -> role.toUpperCase(Locale.ROOT))
                .map(role -> (GrantedAuthority)
                        new SimpleGrantedAuthority("ROLE_" + role))
                .toList();
    }
}
```
:::

格式异常时返回空权限，而不是尝试容错成更高权限。`realm_access.roles=[reviewer]` 最终得到 `ROLE_REVIEWER`。

## 五、所有权和审核范围属于业务服务

读取申请的核心逻辑：

::: details 查看 ApplicationAccessService 可见性判断代码
```java
// application/ApplicationAccessService.java
public ApplicationView findVisible(
        String applicationId,
        JwtAuthenticationToken authentication
) {
    ensureAnyRole(
            authentication.getAuthorities(),
            "ROLE_APPLICANT",
            "ROLE_REVIEWER"
    );
    InsuranceApplication application = findHidden(applicationId);
    if (!canObserve(application, authentication)) {
        throw new ApplicationNotFoundException();
    }
    return toView(application);
}
```
:::

对象判断同时支持所有者和审核区域：

::: details 查看 canObserve 所有权判断代码
```java
private boolean canObserve(
        InsuranceApplication application,
        JwtAuthenticationToken authentication
) {
    if (hasAuthority(authentication.getAuthorities(), "ROLE_APPLICANT")
            && application.ownerSubject()
                    .equals(authentication.getToken().getSubject())) {
        return true;
    }
    return hasAuthority(authentication.getAuthorities(), "ROLE_REVIEWER")
            && reviewRegions(authentication).contains(application.region());
}
```
:::

审核操作先检查角色，再检查对象范围：

::: details 查看 review 审核范围判断代码
```java
public ApplicationView review(
        String applicationId,
        JwtAuthenticationToken authentication
) {
    ensureAnyRole(authentication.getAuthorities(), "ROLE_REVIEWER");
    InsuranceApplication application = findHidden(applicationId);
    if (!reviewRegions(authentication).contains(application.region())) {
        throw new ApplicationNotFoundException();
    }
    return toView(repository.updateStatus(application, "REVIEWED"));
}
```
:::

顺序很重要：

1. 没有 reviewer 角色时返回 `403`，说明该操作不属于此主体；
2. 有 reviewer 角色但对象不在审核区域时返回 `404`，避免暴露对象；
3. 只有角色和区域都满足时才执行状态更新。

## 六、为什么无权观察返回404

假设攻击者依次请求 `APP-1001`、`APP-1002`、`APP-1003`：

- 若存在但无权访问返回 `403`；
- 不存在返回 `404`；

攻击者就能枚举哪些申请真实存在。对不应观察对象的主体，本工程把“对象不存在”和“对象存在但不可观察”统一为同一 Problem Details：

```json
{
  "type": "https://example.com/problems/application-not-found",
  "title": "Application not found",
  "status": 404,
  "detail": "The requested application is not available.",
  "instance": "/api/applications/APP-1001",
  "requestId": "..."
}
```

并非所有权限失败都应伪装成 `404`。选择依据是“调用方是否有权知道该对象存在”：

| 情况 | 推荐状态 |
|------|----------|
| 缺少或无效身份 | `401` |
| 已知功能不允许当前角色使用 | `403` |
| 当前主体不应知道对象是否存在 | `404` |
| 对象可见但状态不允许操作 | `409` 或明确领域错误 |

## 七、伪造身份Header攻击

攻击请求：

```http
GET /api/applications/APP-1001 HTTP/1.1
Authorization: Bearer <applicant-b的合法令牌>
X-User-Id: applicant-a
X-Roles: REVIEWER
X-Review-Regions: EAST
```

若业务服务优先读取 `X-User-Id`，攻击者会把自己的合法登录变成他人身份。正确链路是：

```text
Gateway 删除外部身份 Header
  → 原始 Bearer JWT 继续转发
  → application-service 独立校验 JWT
  → 从 JWT sub 得到 applicant-b
  → ownerSubject 不匹配 APP-1001
  → 返回隐藏对象 404
```

Gateway 清理列表为：

- `X-User-Id`；
- `X-Tenant-Id`；
- `X-Roles`；
- `X-Review-Regions`；
- `X-Internal-User`。

对应 GlobalFilter：

```java
ServerHttpRequest request = exchange.getRequest().mutate()
        .headers(headers ->
                UNTRUSTED_IDENTITY_HEADERS.forEach(headers::remove))
        .build();
return chain.filter(exchange.mutate().request(request).build());
```

清理 Header 是纵深防御，不是后端信任 Header 的理由。业务服务完全不读取这些 Header 进行授权。

## 八、绕过Gateway实验

直接访问业务服务：

```powershell
Invoke-WebRequest `
  -Uri 'http://localhost:8090/api/applications/APP-1001' `
  -Headers @{
    'X-User-Id' = 'applicant-a'
    'X-Roles' = 'REVIEWER'
  } `
  -SkipHttpErrorCheck
```

实际 HTTP 集成测试得到：

```text
Status: 401
Content-Type: application/problem+json
WWW-Authenticate: Bearer
type: https://example.com/problems/authentication-required
```

这证明安全结论来自业务服务自己的 Resource Server，而不是网络路径上的 Gateway。

## 九、真实签名HTTP测试

`ApplicationHttpSecurityTest` 在测试进程中：

1. 生成 2048 位 RSA 密钥对；
2. 启动只发布公钥的临时 JWK HTTP 端点；
3. 让生产 `NimbusJwtDecoder` 从该端点读取公钥；
4. 使用私钥签发 60 秒 JWT；
5. 通过真实 Tomcat 随机端口请求业务接口。

测试矩阵包括：

| 测试 | 预期 |
|------|------|
| applicant-a + APP-1001 | `200`，响应无 ownerSubject |
| 只有伪造 Header | `401` |
| applicant-b Token + applicant-a Header | `404` |
| applicant 调审核接口 | `403` |
| EAST reviewer 审核 WEST | `404` |

执行：

```powershell
.\mvnw.cmd -pl application-service -Dtest=ApplicationHttpSecurityTest test
```

实际结果：

```text
Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

这类测试不能用 `mockJwt()` 代替，因为 `mockJwt()` 适合构造权限主体，却不会证明签名、公钥、Issuer 和 Audience 校验真实生效。

## 十、跨服务身份传播的四种方式

本章选择把原始 Bearer Token 转发给业务服务，由业务服务再次验证。不同系统还可能选择：

| 方式 | 优点 | 风险与适用边界 |
|------|------|----------------|
| 转发用户 Token | 保留最终用户上下文，实现简单 | Token Audience 必须覆盖下游，传播范围要受控 |
| Token Exchange | 为下游换取更窄 Audience/Scope | 需要身份平台支持和更多失败处理 |
| Gateway 签发内部身份凭证 | 下游只信任内部短期凭证 | Gateway 成为内部发行方，密钥和协议复杂 |
| 仅传用户 Header + mTLS | Header 有服务身份通道保护 | 每跳都必须验证 mTLS，不能暴露直连旁路 |

服务网格 mTLS 证明“调用方工作负载是谁”，用户 JWT 证明“最终用户是谁”。两者解决不同身份，不能互相替代。

## 十一、生产检查

- 所有权主键是否使用稳定 `sub`，而不是用户名或邮箱；
- JWT 自定义 Claim 是否有大小、类型和来源约束；
- 角色门禁和对象授权是否分别测试；
- 无权对象与不存在对象是否返回一致内容和耗时特征；
- 是否存在绕过 Gateway 的网络路径，后端是否仍认证；
- 服务间转发的 Token Audience 是否过宽；
- 日志是否记录完整 JWT、用户邮箱或对象敏感字段；
- 缓存权限结果时，角色撤销和对象转移如何失效；
- 管理员或客服等特殊权限是否有独立审计和审批。

下一篇将继续实现入口限流、安全响应头、CORS、统一 Problem Details 和脱敏审计，并解释单实例令牌桶为什么不能直接当成分布式生产方案。
