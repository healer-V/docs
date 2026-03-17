---
title: "Spring Boot 配置与部署"
category: "后端 · Spring Boot"
tags:
  - Spring Boot
  - 配置
  - 部署
  - Docker
date: 2026-03-17
excerpt: "Spring Boot 提供灵活的外部化配置体系，支持多环境切换。生产部署可通过可执行 Jar 搭配 Docker 实现标准化的容器化部署，配合 Actuator 完成运行时监控。"
---

# Spring Boot 配置与部署

## 一、application.yml 配置

### 1. 配置文件格式与优先级

Spring Boot 按以下顺序加载配置，后加载的配置会覆盖前面的值：

1. `classpath:/application.properties`
2. `classpath:/application.yml`
3. `classpath:/config/application.yml`
4. 命令行参数 `--key=value`
5. 环境变量

::: details 常用配置项示例
```yaml
# src/main/resources/application.yml
spring:
  application:
    name: demo-service        # 应用名称，影响服务注册和日志

  # 数据源配置
  datasource:
    url: jdbc:mysql://localhost:3306/demo
    username: ${DB_USER:root}         # 支持环境变量，冒号后为默认值
    password: ${DB_PASSWORD:123456}
    hikari:
      maximum-pool-size: 20           # 连接池最大连接数
      minimum-idle: 5
      connection-timeout: 30000       # 获取连接超时时间（毫秒）
      idle-timeout: 600000            # 空闲连接超时

  # Redis 配置
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: 6379
      password: ${REDIS_PASSWORD:}
      lettuce:
        pool:
          max-active: 8

# 服务端口与上下文路径
server:
  port: 8080
  servlet:
    context-path: /api    # 所有接口的前缀路径
  compression:
    enabled: true         # 开启 Gzip 压缩
    min-response-size: 2048

# 自定义配置
app:
  jwt:
    secret: ${JWT_SECRET}
    expiration: 3600000
  upload:
    path: /var/uploads/
    max-size: 10MB
```
:::

### 2. @Value 与 SpEL

::: details @Value 注入配置值
```java
// src/main/java/com/example/demo/service/FileService.java
@Service
public class FileService {

    @Value("${app.upload.path}")
    private String uploadPath;

    @Value("${app.upload.max-size:5MB}")  // 有默认值
    private String maxSize;

    @Value("${server.port}")
    private int port;

    // SpEL 表达式：注入列表
    @Value("#{'${app.allowed-origins}'.split(',')}")
    private List<String> allowedOrigins;
}
```
:::

---

## 二、多环境配置（Profiles）

### 1. Profile 文件约定

Spring Boot 按 `application-{profile}.yml` 命名约定加载特定环境的配置，激活的 Profile 配置会覆盖主配置文件中的同名配置。

::: details 多环境配置文件结构
```
src/main/resources/
├── application.yml          # 公共配置
├── application-dev.yml      # 开发环境
├── application-test.yml     # 测试环境
└── application-prod.yml     # 生产环境
```

```yaml
# src/main/resources/application.yml（公共配置）
spring:
  application:
    name: demo-service
  profiles:
    active: dev    # 默认激活开发环境（生产部署时通过命令行参数覆盖）

logging:
  level:
    root: INFO
```

```yaml
# src/main/resources/application-dev.yml（开发环境）
spring:
  datasource:
    url: jdbc:h2:mem:devdb
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true

logging:
  level:
    com.example.demo: DEBUG
```

```yaml
# src/main/resources/application-prod.yml（生产环境）
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST}:3306/${DB_NAME}
    username: ${DB_USER}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate    # 生产环境不自动建表
    show-sql: false

server:
  error:
    include-stacktrace: never  # 生产环境不暴露堆栈信息
```
:::

### 2. 激活 Profile 的方式

```bash
# 方式一：命令行参数
java -jar app.jar --spring.profiles.active=prod

# 方式二：环境变量
export SPRING_PROFILES_ACTIVE=prod

# 方式三：JVM 参数
java -Dspring.profiles.active=prod -jar app.jar
```

---

## 三、@ConfigurationProperties 配置绑定

相比 `@Value`，`@ConfigurationProperties` 支持将一组相关配置绑定到 POJO，类型安全、支持 IDE 补全。

::: details @ConfigurationProperties 完整示例
```yaml
# src/main/resources/application.yml
app:
  jwt:
    secret: "your-secret-key"
    expiration: 3600000
    refresh-expiration: 604800000
  storage:
    provider: local
    local:
      base-path: /var/uploads
    oss:
      endpoint: https://oss-cn-hangzhou.aliyuncs.com
      access-key: ${OSS_ACCESS_KEY}
      secret-key: ${OSS_SECRET_KEY}
      bucket: my-bucket
```

```java
// src/main/java/com/example/demo/config/AppProperties.java
@ConfigurationProperties(prefix = "app")
@Component  // 或在主类上 @EnableConfigurationProperties(AppProperties.class)
@Data
public class AppProperties {

    private JwtProperties jwt = new JwtProperties();
    private StorageProperties storage = new StorageProperties();

    @Data
    public static class JwtProperties {
        private String secret;
        private long expiration;
        private long refreshExpiration;
    }

    @Data
    public static class StorageProperties {
        private String provider = "local";
        private LocalStorage local = new LocalStorage();
        private OssStorage oss = new OssStorage();

        @Data
        public static class LocalStorage {
            private String basePath = "/tmp/uploads";
        }

        @Data
        public static class OssStorage {
            private String endpoint;
            private String accessKey;
            private String secretKey;
            private String bucket;
        }
    }
}
```

```java
// 注入并使用
@Service
@RequiredArgsConstructor
public class StorageService {

    private final AppProperties appProperties;

    public String getUploadPath() {
        return appProperties.getStorage().getLocal().getBasePath();
    }
}
```
:::

::: tip 生成配置元数据
添加 `spring-boot-configuration-processor` 依赖后，IDE 能对 `@ConfigurationProperties` 类提供自动补全和文档提示，极大提升配置编写效率。
:::

---

## 四、Actuator 监控端点

Spring Boot Actuator 暴露一系列内置端点，用于监控应用状态、查看配置、追踪指标等。

### 1. 启用与配置

::: details Actuator 配置示例
```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

```yaml
# src/main/resources/application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,env,loggers  # 暴露指定端点
        # include: "*"  # 暴露所有端点（仅内网使用）
      base-path: /actuator  # 端点路径前缀
  endpoint:
    health:
      show-details: always  # 显示详细健康信息
  info:
    env:
      enabled: true  # 允许通过 info.* 配置 /actuator/info 内容

info:
  app:
    name: demo-service
    version: 1.0.0
```
:::

### 2. 常用端点

| 端点 | 说明 |
|------|------|
| `/actuator/health` | 应用健康状态（数据库、Redis 连通性等） |
| `/actuator/info` | 应用基本信息 |
| `/actuator/metrics` | 应用指标（JVM 内存、GC、HTTP 请求数等） |
| `/actuator/env` | 当前所有配置属性 |
| `/actuator/loggers` | 查看和动态修改日志级别 |
| `/actuator/threaddump` | 线程堆栈信息 |
| `/actuator/httptrace` | 最近 HTTP 请求追踪 |

::: warning 生产环境安全
Actuator 端点会暴露配置信息，生产环境必须：
- 仅暴露必要端点（`health`、`info`）
- 将 Actuator 端口与业务端口分离（`management.server.port=8081`）
- 配置访问控制，限制仅内网访问
:::

---

## 五、打包与运行

### 1. 打包为可执行 Jar

```bash
# Maven 打包（跳过测试）
mvn clean package -DskipTests

# 运行
java -jar target/demo-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

::: details Maven 打包配置
```xml
<!-- pom.xml：确保 spring-boot-maven-plugin 已配置 -->
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <configuration>
                <!-- 排除 Lombok，不打入最终 Jar -->
                <excludes>
                    <exclude>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok</artifactId>
                    </exclude>
                </excludes>
            </configuration>
        </plugin>
    </plugins>
</build>
```
:::

---

## 六、Docker 部署

### 1. Dockerfile

::: details 多阶段构建 Dockerfile
```dockerfile
# src/Dockerfile

# 第一阶段：构建
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build
COPY pom.xml .
# 先下载依赖（利用 Docker 层缓存）
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# 第二阶段：运行（使用更小的镜像）
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# 创建非 root 用户
RUN addgroup -S spring && adduser -S spring -G spring
USER spring

# 从构建阶段复制 Jar
COPY --from=builder /build/target/*.jar app.jar

# 暴露端口
EXPOSE 8080

# JVM 参数优化（容器环境）
ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
```
:::

### 2. docker-compose 编排

::: details docker-compose.yml 完整示例
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    container_name: demo-app
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - DB_HOST=mysql
      - DB_NAME=demo
      - DB_USER=demo_user
      - DB_PASSWORD=${DB_PASSWORD}  # 从 .env 文件读取
      - REDIS_HOST=redis
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      mysql:
        condition: service_healthy  # 等待 MySQL 健康检查通过
      redis:
        condition: service_started
    restart: unless-stopped
    networks:
      - app-network

  mysql:
    image: mysql:8.0
    container_name: demo-mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: demo
      MYSQL_USER: demo_user
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./sql/init.sql:/docker-entrypoint-initdb.d/init.sql  # 初始化脚本
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    container_name: demo-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - app-network

volumes:
  mysql_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 停止并删除容器
docker-compose down
```
:::

---

## 七、日志配置

### 1. Logback 配置

Spring Boot 默认使用 Logback，通过 `logback-spring.xml` 实现按环境分别配置。

::: details logback-spring.xml 完整配置
```xml
<!-- src/main/resources/logback-spring.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<configuration>

    <!-- 引入 Spring Boot 默认配置（彩色控制台等）-->
    <include resource="org/springframework/boot/logging/logback/defaults.xml"/>

    <property name="LOG_PATH" value="${LOG_PATH:-/var/log/demo}"/>
    <property name="APP_NAME" value="${spring.application.name:-demo}"/>

    <!-- 控制台输出（开发环境）-->
    <springProfile name="dev">
        <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
            <encoder>
                <pattern>${CONSOLE_LOG_PATTERN}</pattern>
                <charset>UTF-8</charset>
            </encoder>
        </appender>
        <root level="DEBUG">
            <appender-ref ref="CONSOLE"/>
        </root>
        <logger name="com.example.demo" level="DEBUG"/>
    </springProfile>

    <!-- 文件输出（生产环境）-->
    <springProfile name="prod">
        <!-- 按天滚动日志文件 -->
        <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
            <file>${LOG_PATH}/${APP_NAME}.log</file>
            <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
                <fileNamePattern>${LOG_PATH}/${APP_NAME}-%d{yyyy-MM-dd}.%i.log.gz</fileNamePattern>
                <timeBasedFileNamingAndTriggeringPolicy
                    class="ch.qos.logback.core.rolling.SizeAndTimeBasedFNATP">
                    <maxFileSize>100MB</maxFileSize>
                </timeBasedFileNamingAndTriggeringPolicy>
                <maxHistory>30</maxHistory>  <!-- 保留最近 30 天 -->
                <totalSizeCap>5GB</totalSizeCap>
            </rollingPolicy>
            <encoder>
                <!-- JSON 格式，便于日志收集工具（ELK）解析 -->
                <pattern>{"time":"%d{yyyy-MM-dd HH:mm:ss.SSS}","level":"%-5level","thread":"%thread","logger":"%logger{36}","msg":"%msg"}%n</pattern>
                <charset>UTF-8</charset>
            </encoder>
        </appender>

        <root level="INFO">
            <appender-ref ref="FILE"/>
        </root>
        <logger name="com.example.demo" level="INFO"/>
        <!-- 减少框架层的日志量 -->
        <logger name="org.hibernate.SQL" level="WARN"/>
        <logger name="org.springframework" level="WARN"/>
    </springProfile>

</configuration>
```
:::

### 2. SLF4J 日志使用规范

::: details 日志使用最佳实践
```java
// src/main/java/com/example/demo/service/UserServiceImpl.java
@Service
@Slf4j  // Lombok 注解，等价于 private static final Logger log = LoggerFactory.getLogger(...)
public class UserServiceImpl {

    public UserDTO findById(Long id) {
        // 使用占位符，避免字符串拼接造成的性能损耗
        log.debug("查询用户，id：{}", id);

        User user = userRepository.findById(id)
            .orElseThrow(() -> {
                log.warn("用户不存在，id：{}", id);
                return new ResourceNotFoundException("用户不存在：" + id);
            });

        log.info("查询用户成功，username：{}", user.getUsername());
        return UserDTO.from(user);
    }

    public void processOrder(Long orderId) {
        try {
            // 业务处理...
        } catch (Exception e) {
            // 异常日志必须带上异常对象，以便打印完整堆栈
            log.error("处理订单异常，orderId：{}，原因：{}", orderId, e.getMessage(), e);
            throw e;
        }
    }
}
```
:::

::: tip 日志级别选择指南
- `DEBUG`：调试信息，开发环境使用，生产环境关闭
- `INFO`：关键业务流程节点（用户登录、订单创建等）
- `WARN`：业务预期内的异常情况（资源不存在、参数校验失败）
- `ERROR`：需要关注和处理的错误（数据库连接失败、外部服务异常）
:::
