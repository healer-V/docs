---
title: "Spring Security 与 JWT 认证"
category: "后端 · Spring Boot"
tags:
  - Spring Boot
  - Security
  - JWT
  - 认证
date: 2026-03-17
excerpt: "Spring Security 是 Spring 生态中功能最强大的安全框架，提供认证与授权两大核心能力。结合 JWT 可实现无状态的 Token 认证，适合前后端分离架构。"
---

# Spring Security 与 JWT 认证

## 一、Spring Security 核心概念

### 1. 认证与授权

| 概念 | 说明 | 核心接口 |
|------|------|----------|
| **认证（Authentication）** | 验证用户身份（你是谁） | `AuthenticationManager` |
| **授权（Authorization）** | 验证用户权限（你能做什么） | `AccessDecisionManager` |
| **Principal** | 已认证的用户主体 | `Authentication.getPrincipal()` |
| **GrantedAuthority** | 用户拥有的权限 | `Collection<GrantedAuthority>` |

### 2. 过滤器链

Spring Security 本质上是一条 Servlet 过滤器链（`SecurityFilterChain`），每个请求按顺序经过各过滤器处理。常见过滤器包括：

| 过滤器 | 职责 |
|--------|------|
| `UsernamePasswordAuthenticationFilter` | 处理表单登录 |
| `BasicAuthenticationFilter` | 处理 HTTP Basic 认证 |
| `BearerTokenAuthenticationFilter` | 处理 JWT Bearer Token |
| `ExceptionTranslationFilter` | 捕获认证/授权异常并响应 |
| `FilterSecurityInterceptor` | 最终的授权决策 |

---

## 二、SecurityFilterChain 配置

Spring Boot 3.x 使用基于 Lambda 的流式配置，废弃了继承 `WebSecurityConfigurerAdapter` 的方式。

::: details 完整 Security 配置示例
```java
// src/main/java/com/example/demo/config/SecurityConfig.java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // 启用方法级权限注解（@PreAuthorize 等）
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 禁用 CSRF（前后端分离使用 JWT，无需 CSRF 保护）
            .csrf(csrf -> csrf.disable())

            // 配置路径权限
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()        // 认证接口公开
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")  // 管理员接口
                .requestMatchers(HttpMethod.GET, "/api/v1/**").authenticated()
                .anyRequest().authenticated()                           // 其余需登录
            )

            // 无状态 Session（JWT 不需要 Session）
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // 配置未认证/无权限时的响应
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(
                    (req, res, e) -> res.sendError(401, "未登录"))
                .accessDeniedHandler(
                    (req, res, e) -> res.sendError(403, "无权限"))
            )

            // 在 UsernamePasswordAuthenticationFilter 之前插入 JWT 过滤器
            .addFilterBefore(jwtAuthFilter,
                UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```
:::

---

## 三、UserDetailsService

`UserDetailsService` 是 Spring Security 的用户信息加载接口，实现它告诉 Security 如何根据用户名查找用户信息。

::: details UserDetailsService 实现示例
```java
// src/main/java/com/example/demo/service/CustomUserDetailsService.java
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException(
                "用户不存在：" + username));

        // 将权限字符串转换为 GrantedAuthority 集合
        List<GrantedAuthority> authorities = user.getRoles().stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName()))
            .collect(Collectors.toList());

        return new org.springframework.security.core.userdetails.User(
            user.getUsername(),
            user.getPassword(),   // 数据库中存储的是 BCrypt 加密后的密码
            user.isEnabled(),     // 账户是否启用
            true,                 // 账户未过期
            true,                 // 凭证未过期
            true,                 // 账户未锁定
            authorities
        );
    }
}
```
:::

---

## 四、密码加密（BCrypt）

BCrypt 是一种自适应哈希函数，内置盐值，每次加密结果不同，是 Spring Security 推荐的密码存储方案。

::: details BCrypt 使用示例
```java
// 注入 PasswordEncoder（已在 SecurityConfig 中声明为 Bean）
@Service
@RequiredArgsConstructor
public class AuthService {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    // 注册时加密密码
    public void register(RegisterRequest request) {
        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = User.builder()
            .username(request.getUsername())
            .password(encodedPassword)  // 存储加密后的密码
            .build();
        userRepository.save(user);
    }

    // 验证密码（matches 方法内部处理盐值比对）
    public boolean verifyPassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
        // rawPassword: 用户输入的明文
        // encodedPassword: 数据库存储的密文
    }
}
```
:::

::: tip BCrypt 的强度参数
`new BCryptPasswordEncoder(12)` 中的参数是 cost factor（默认 10），控制哈希计算轮数。值越大越安全，但越慢。生产环境推荐 10-12，不建议超过 14（登录响应会明显变慢）。
:::

---

## 五、JWT 原理与结构

### 1. JWT 组成

**JWT（JSON Web Token）** 由三部分组成，用 `.` 连接：

```
Header.Payload.Signature
eyJhbGc...  .eyJ1c2VyX...  .SflKxwRJ...
```

| 部分 | 说明 | 内容 |
|------|------|------|
| **Header** | 算法声明 | `{"alg": "HS256", "typ": "JWT"}` |
| **Payload** | 声明（Claims） | 用户信息、过期时间、自定义数据 |
| **Signature** | 签名 | `HMACSHA256(base64(header) + "." + base64(payload), secret)` |

### 2. 常用 Payload 字段

| 字段 | 说明 |
|------|------|
| `sub` | Subject，通常存用户 ID 或用户名 |
| `iat` | Issued At，签发时间（Unix 时间戳） |
| `exp` | Expiration，过期时间 |
| `iss` | Issuer，签发方 |
| `jti` | JWT ID，唯一标识符（防重放） |

::: details JWT 工具类实现
```java
// src/main/java/com/example/demo/util/JwtUtil.java
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:3600000}")  // 默认 1 小时，单位毫秒
    private long expiration;

    // 生成 JWT
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", userDetails.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.toList()));

        return Jwts.builder()
            .setClaims(claims)
            .setSubject(userDetails.getUsername())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(getSignKey(), SignatureAlgorithm.HS256)
            .compact();
    }

    // 从 Token 提取用户名
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // 验证 Token
    public boolean isTokenValid(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = Jwts.parserBuilder()
            .setSigningKey(getSignKey())
            .build()
            .parseClaimsJws(token)
            .getBody();
        return resolver.apply(claims);
    }

    private Key getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
```

```yaml
# src/main/resources/application.yml
jwt:
  secret: "your-base64-encoded-256-bit-secret-key-here"
  expiration: 3600000  # 1小时
```
:::

---

## 六、JWT 集成 Spring Security

### 1. JWT 过滤器

::: details JWT 认证过滤器实现
```java
// src/main/java/com/example/demo/filter/JwtAuthenticationFilter.java
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        // 没有 Token 或格式不对，直接放行（后续由 Security 决定是否拒绝）
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);  // 去掉 "Bearer " 前缀

        try {
            String username = jwtUtil.extractUsername(token);

            // 用户名存在且当前请求未认证
            if (username != null &&
                    SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                if (jwtUtil.isTokenValid(token, userDetails)) {
                    // 创建认证对象并设置到 SecurityContext
                    UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                        );
                    authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (JwtException e) {
            // Token 无效：过期、签名错误等
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token 无效");
            return;
        }

        chain.doFilter(request, response);
    }
}
```
:::

### 2. 登录接口实现

::: details 登录接口完整实现
```java
// src/main/java/com/example/demo/controller/AuthController.java
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final UserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public Result<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        try {
            // 触发 Spring Security 认证流程（内部调用 UserDetailsService）
            Authentication authentication = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getUsername(),
                    request.getPassword()
                )
            );
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String token = jwtUtil.generateToken(userDetails);
            return Result.success(new LoginResponse(token));
        } catch (BadCredentialsException e) {
            throw new BusinessException(401, "用户名或密码错误");
        }
    }
}

public record LoginRequest(
    @NotBlank String username,
    @NotBlank String password
) {}

public record LoginResponse(String token) {}
```
:::

---

## 七、方法级权限控制

### 1. @PreAuthorize

启用 `@EnableMethodSecurity` 后，可在方法上直接声明权限要求。

::: details 方法级权限注解示例
```java
// src/main/java/com/example/demo/controller/AdminController.java
@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    // 需要 ROLE_ADMIN 角色
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserDTO> listAllUsers() { /* ... */ }

    // 需要 ROLE_ADMIN 或 ROLE_MANAGER 之一
    @GetMapping("/reports")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ReportDTO getReport() { /* ... */ }

    // 使用 SpEL 表达式：用户只能修改自己的数据
    @PutMapping("/users/{id}")
    @PreAuthorize("#id == authentication.principal.id or hasRole('ADMIN')")
    public UserDTO updateUser(@PathVariable Long id, @RequestBody UserRequest req) {
        /* ... */
    }

    // 需要特定权限（非角色）
    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasAuthority('user:delete')")
    public void deleteUser(@PathVariable Long id) { /* ... */ }
}
```
:::

---

## 八、CORS 配置

跨域资源共享（CORS）配置需要在 Spring Security 中统一处理，不能仅依赖 `@CrossOrigin`。

::: details CORS 全局配置
```java
// src/main/java/com/example/demo/config/SecurityConfig.java（在 filterChain 中）
http.cors(cors -> cors.configurationSource(corsConfigurationSource()));

// 添加 CORS 配置 Bean
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of(
        "http://localhost:3000",
        "https://your-frontend.com"
    ));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setExposedHeaders(List.of("Authorization"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);  // 预检请求缓存时间（秒）

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);  // 对 /api/** 生效
    return source;
}
```
:::

::: warning JWT 安全注意事项
- **secret 密钥**：至少 256 位，通过环境变量注入，不能硬编码在代码中
- **Token 过期时间**：访问 Token 建议 15 分钟到 1 小时，配合刷新 Token 使用
- **Token 存储**：前端推荐存 `httpOnly Cookie` 而非 `localStorage`，防止 XSS 攻击
- **敏感信息**：Payload 仅做 Base64 编码，不加密，不要存密码等敏感数据
:::
