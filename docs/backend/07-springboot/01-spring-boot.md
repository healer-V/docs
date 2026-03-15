---
title: "Spring Boot 概述"
category: "后端 · Spring Boot"
tags:
  - Spring
excerpt: "Spring Boot 是基于 Spring Framework 的快速开发框架，通过约定优于配置的理念，极大简化了 Spring 应用的搭建和开发过程。 | 项目 | 说明 | |------|------| | Spring Frame..."
---

# Spring Boot 概述

## 一、Spring Boot 简介

Spring Boot 是基于 Spring Framework 的快速开发框架，通过**约定优于配置**的理念，极大简化了 Spring 应用的搭建和开发过程。

### 1. Spring 生态体系

| 项目 | 说明 |
|------|------|
| Spring Framework | IoC 容器、AOP、事件机制等核心能力 |
| Spring Boot | 快速构建独立的 Spring 应用 |
| Spring Cloud | 微服务架构解决方案（注册中心、网关、配置中心等） |
| Spring Data | 统一的数据访问抽象（JPA、Redis、MongoDB 等） |
| Spring Security | 认证与授权框架 |
| Spring Batch | 批处理框架 |

### 2. Spring Boot 核心特性

- **自动配置**：根据 classpath 中的依赖自动装配 Bean
- **起步依赖**：通过 `spring-boot-starter-*` 一站式引入所需依赖
- **内嵌服务器**：内置 Tomcat / Jetty / Undertow，无需外部部署
- **Actuator**：提供生产级监控和健康检查端点
- **无代码生成**：不依赖 XML 配置，全注解驱动

## 二、项目初始化

### 1. Spring Initializr

访问 [start.spring.io](https://start.spring.io) 或在 IntelliJ IDEA 中通过 `File → New → Spring Initializr` 创建项目。

::: tip 推荐配置
- **构建工具**：Maven 或 Gradle
- **语言**：Java 17+（LTS 版本）
- **Spring Boot 版本**：选择最新稳定版（非 SNAPSHOT）
:::

### 2. 项目结构

::: details 标准 Maven 项目结构
```text
my-application/
├── src/
│   ├── main/
│   │   ├── java/com/example/myapp/
│   │   │   ├── MyApplication.java
│   │   │   ├── controller/
│   │   │   ├── service/
│   │   │   ├── repository/
│   │   │   ├── entity/
│   │   │   ├── dto/
│   │   │   └── config/
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       └── static/
│   └── test/java/com/example/myapp/
├── pom.xml
└── README.md
```
:::

### 3. pom.xml 基础配置

::: details pom.xml 示例
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.5</version>
    </parent>

    <groupId>com.example</groupId>
    <artifactId>my-application</artifactId>
    <version>1.0.0</version>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```
:::

## 三、核心注解

### 1. 启动类注解

`@SpringBootApplication` 是一个组合注解，等价于同时标注以下三个注解：

| 注解 | 作用 |
|------|------|
| `@SpringBootConfiguration` | 标识当前类为配置类（等价于 `@Configuration`） |
| `@EnableAutoConfiguration` | 启用自动配置机制 |
| `@ComponentScan` | 扫描当前包及子包中的组件 |

::: details 启动类示例
```java
@SpringBootApplication
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
}
```
:::

### 2. Web 层注解

| 注解 | 作用 |
|------|------|
| `@RestController` | 组合了 `@Controller` + `@ResponseBody`，返回 JSON |
| `@RequestMapping` | 映射请求路径，可指定 HTTP 方法 |
| `@GetMapping` | 处理 GET 请求 |
| `@PostMapping` | 处理 POST 请求 |
| `@PutMapping` | 处理 PUT 请求 |
| `@DeleteMapping` | 处理 DELETE 请求 |
| `@PathVariable` | 绑定 URL 路径变量 |
| `@RequestParam` | 绑定查询参数 |
| `@RequestBody` | 绑定请求体（JSON → 对象） |

### 3. 依赖注入注解

| 注解 | 作用 |
|------|------|
| `@Autowired` | 按类型自动注入（Spring 原生） |
| `@Resource` | 按名称自动注入（JSR-250 标准） |
| `@Qualifier` | 配合 `@Autowired` 按名称指定注入的 Bean |
| `@Value` | 注入配置属性值 |

::: warning 推荐使用构造器注入
避免字段注入（`@Autowired` 直接标注在字段上），推荐使用构造器注入，便于测试和保证不可变性。
:::

::: details 构造器注入示例
```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    // Spring Boot 4.x 单构造器可省略 @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }
}
```
:::

### 4. 组件注解

| 注解 | 语义 |
|------|------|
| `@Component` | 通用组件 |
| `@Service` | 业务逻辑层 |
| `@Repository` | 数据访问层 |
| `@Controller` | Web 控制器层 |
| `@Configuration` | 配置类 |

## 四、配置管理

### 1. application.yml

Spring Boot 支持 `application.properties` 和 `application.yml` 两种格式，推荐使用 YAML。

::: details application.yml 配置示例
```yaml
server:
  port: 8080
  servlet:
    context-path: /api

spring:
  application:
    name: my-application
  datasource:
    url: jdbc:mysql://localhost:3306/mydb?useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: ${DB_PASSWORD}
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true

logging:
  level:
    root: INFO
    com.example.myapp: DEBUG
  file:
    name: logs/application.log
```
:::

### 2. 多环境配置（Profiles）

通过 `application-{profile}.yml` 实现环境隔离。

::: details 多环境配置示例
```yaml
# application.yml - 公共配置
spring:
  profiles:
    active: dev

---
# application-dev.yml
server:
  port: 8080
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb_dev

---
# application-prod.yml
server:
  port: 80
spring:
  datasource:
    url: jdbc:mysql://prod-db-host:3306/mydb_prod
```
:::

激活 Profile 的方式：

- 配置文件：`spring.profiles.active=prod`
- 命令行参数：`--spring.profiles.active=prod`
- 环境变量：`SPRING_PROFILES_ACTIVE=prod`

### 3. 自定义配置绑定

::: details @ConfigurationProperties 绑定示例
```java
@Component
@ConfigurationProperties(prefix = "app.upload")
@Data
public class UploadProperties {
    private String basePath = "/data/uploads";
    private long maxFileSize = 10485760; // 10MB
    private List<String> allowedTypes = List.of("jpg", "png", "pdf");
}
```

```yaml
# application.yml
app:
  upload:
    base-path: /data/uploads
    max-file-size: 20971520
    allowed-types:
      - jpg
      - png
      - pdf
      - docx
```
:::

## 五、RESTful API 开发

### 1. 统一响应体

::: details 统一响应封装
```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ApiResult<T> {
    private int code;
    private String message;
    private T data;

    public static <T> ApiResult<T> success(T data) {
        return new ApiResult<>(200, "success", data);
    }

    public static <T> ApiResult<T> error(int code, String message) {
        return new ApiResult<>(code, message, null);
    }
}
```
:::

### 2. Controller 层

::: details CRUD Controller 示例
```java
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ApiResult<List<UserVO>> list(@RequestParam(defaultValue = "1") int page,
                                        @RequestParam(defaultValue = "10") int size) {
        List<UserVO> users = userService.findAll(page, size);
        return ApiResult.success(users);
    }

    @GetMapping("/{userId}")
    public ApiResult<UserVO> getById(@PathVariable Long userId) {
        UserVO user = userService.findById(userId);
        return ApiResult.success(user);
    }

    @PostMapping
    public ApiResult<UserVO> create(@RequestBody @Valid CreateUserDTO dto) {
        UserVO user = userService.create(dto);
        return ApiResult.success(user);
    }

    @PutMapping("/{userId}")
    public ApiResult<UserVO> update(@PathVariable Long userId,
                                    @RequestBody @Valid UpdateUserDTO dto) {
        UserVO user = userService.update(userId, dto);
        return ApiResult.success(user);
    }

    @DeleteMapping("/{userId}")
    public ApiResult<Void> delete(@PathVariable Long userId) {
        userService.delete(userId);
        return ApiResult.success(null);
    }
}
```
:::

### 3. 全局异常处理

::: details 全局异常处理器
```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiResult<Void> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return ApiResult.error(400, message);
    }

    @ExceptionHandler(BusinessException.class)
    public ApiResult<Void> handleBusiness(BusinessException e) {
        log.warn("业务异常: {}", e.getMessage());
        return ApiResult.error(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ApiResult<Void> handleUnknown(Exception e) {
        log.error("未知异常", e);
        return ApiResult.error(500, "服务器内部错误");
    }
}
```
:::

### 4. 参数校验

使用 `spring-boot-starter-validation`（基于 Hibernate Validator）进行参数校验。

::: details DTO 校验示例
```java
@Data
public class CreateUserDTO {

    @NotBlank(message = "用户名不能为空")
    @Size(min = 2, max = 20, message = "用户名长度为 2-20 个字符")
    private String username;

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    @NotBlank(message = "密码不能为空")
    @Size(min = 8, max = 64, message = "密码长度为 8-64 个字符")
    private String password;

    @Min(value = 0, message = "年龄不能小于 0")
    @Max(value = 150, message = "年龄不能大于 150")
    private Integer age;
}
```
:::

## 六、数据访问

### 1. Spring Data JPA

Spring Data JPA 通过接口约定方法名即可自动生成 SQL，极大减少样板代码。

::: details Entity 与 Repository 示例
```java
@Entity
@Table(name = "t_user")
@Data
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String username;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
```

```java
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    List<User> findByEmailContaining(String keyword);

    boolean existsByUsername(String username);

    @Query("SELECT u FROM User u WHERE u.createdAt >= :startDate")
    List<User> findRecentUsers(@Param("startDate") LocalDateTime startDate);
}
```
:::

### 2. MyBatis 集成

添加 `mybatis-spring-boot-starter` 依赖后，通过 Mapper 接口 + XML/注解编写 SQL。

::: details MyBatis Mapper 示例
```java
@Mapper
public interface UserMapper {

    @Select("SELECT * FROM t_user WHERE id = #{userId}")
    User selectById(@Param("userId") Long userId);

    @Insert("INSERT INTO t_user(username, email, password) VALUES(#{username}, #{email}, #{password})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(User user);

    List<User> selectByCondition(UserQueryDTO query); // 对应 XML 映射
}
```

```xml
<!-- resources/mapper/UserMapper.xml -->
<mapper namespace="com.example.myapp.mapper.UserMapper">
    <select id="selectByCondition" resultType="com.example.myapp.entity.User">
        SELECT * FROM t_user
        <where>
            <if test="username != null and username != ''">
                AND username LIKE CONCAT('%', #{username}, '%')
            </if>
            <if test="email != null and email != ''">
                AND email = #{email}
            </if>
        </where>
        ORDER BY created_at DESC
        LIMIT #{offset}, #{pageSize}
    </select>
</mapper>
```
:::

::: tip JPA vs MyBatis 如何选择
- **JPA**：适合标准 CRUD、领域模型驱动的项目，开发效率高
- **MyBatis**：适合复杂 SQL、多表关联查询多的项目，SQL 可控性强
:::

## 七、Spring Security 基础

### 1. 引入依赖

添加 `spring-boot-starter-security` 后，所有端点默认需要认证。

### 2. 安全配置

::: details Spring Security 配置示例
```java
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```
:::

### 3. JWT 认证流程

::: details JWT 工具类示例
```java
@Component
public class JwtUtils {

    @Value("${app.jwt.secret}")
    private String secretKey;

    @Value("${app.jwt.expiration}")
    private long expirationMs;

    public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    public boolean isTokenValid(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    private Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }
}
```
:::

::: warning 安全注意事项
- JWT Secret 必须通过环境变量或密钥管理服务注入，禁止硬编码
- 生产环境必须启用 HTTPS
- 密码存储必须使用 `BCryptPasswordEncoder` 加密
:::

## 八、常用中间件集成

### 1. Redis

::: details Redis 集成示例
```yaml
# application.yml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      password: ${REDIS_PASSWORD}
      lettuce:
        pool:
          max-active: 16
          max-idle: 8
```

```java
@Service
@RequiredArgsConstructor
public class CacheService {

    private final StringRedisTemplate redisTemplate;

    public void set(String key, String value, long timeoutSeconds) {
        redisTemplate.opsForValue().set(key, value, timeoutSeconds, TimeUnit.SECONDS);
    }

    public String get(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    public void delete(String key) {
        redisTemplate.delete(key);
    }
}
```
:::

### 2. RabbitMQ

::: details RabbitMQ 集成示例
```yaml
spring:
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: ${RABBITMQ_PASSWORD}
```

```java
// 生产者
@Service
@RequiredArgsConstructor
public class OrderEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishOrderCreated(OrderEvent event) {
        rabbitTemplate.convertAndSend("order.exchange", "order.created", event);
    }
}

// 消费者
@Component
@Slf4j
public class OrderEventConsumer {

    @RabbitListener(queues = "order.created.queue")
    public void handleOrderCreated(OrderEvent event) {
        log.info("收到订单事件: orderId={}", event.getOrderId());
        // 处理业务逻辑
    }
}
```
:::

### 3. Swagger / OpenAPI 文档

::: details SpringDoc OpenAPI 配置
```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.5.0</version>
</dependency>
```

```java
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("My Application API")
                        .version("1.0.0")
                        .description("接口文档"));
    }
}
```

访问地址：`http://localhost:8080/swagger-ui.html`
:::

### 4. 定时任务

::: details 定时任务示例
```java
@Configuration
@EnableScheduling
public class ScheduleConfig {
}

@Component
@Slf4j
public class DataSyncTask {

    @Scheduled(cron = "0 0 2 * * ?") // 每天凌晨 2 点执行
    public void syncData() {
        log.info("开始数据同步任务...");
        // 业务逻辑
    }

    @Scheduled(fixedRate = 60000) // 每 60 秒执行一次
    public void healthCheck() {
        log.info("执行健康检查...");
    }
}
```
:::

::: tip 常用 Cron 表达式

| 表达式 | 含义 |
|--------|------|
| `0 0 * * * ?` | 每小时整点 |
| `0 0 2 * * ?` | 每天凌晨 2 点 |
| `0 0/30 * * * ?` | 每 30 分钟 |
| `0 0 10 ? * MON-FRI` | 工作日上午 10 点 |
:::
