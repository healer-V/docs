---
title: "Spring IoC 与依赖注入"
category: "后端 · Spring Boot"
tags:
  - Spring Boot
  - IoC
  - DI
  - Bean
date: 2026-03-17
excerpt: "IoC（控制反转）是 Spring 的核心设计思想，通过容器统一管理对象的创建与依赖关系，让开发者从繁琐的对象管理中解放出来，专注于业务逻辑本身。"
---

# Spring IoC 与依赖注入

## 一、IoC 容器概念

**IoC（Inversion of Control，控制反转）** 是一种设计原则：将对象的创建权和依赖管理权从应用代码转交给外部容器。Spring 中的 IoC 容器负责实例化、配置和组装 Bean。

**DI（Dependency Injection，依赖注入）** 是 IoC 的具体实现方式，容器在运行时自动将依赖对象注入到目标对象中。

### 1. IoC 容器接口

| 接口 | 说明 |
|------|------|
| `BeanFactory` | IoC 容器的基础接口，按需加载 Bean（懒加载） |
| `ApplicationContext` | `BeanFactory` 的扩展，提供事件发布、国际化、AOP 等增强功能 |
| `AnnotationConfigApplicationContext` | 基于注解配置的容器实现 |
| `WebApplicationContext` | Web 环境专用容器 |

::: tip ApplicationContext 是首选
日常开发中始终使用 `ApplicationContext`，它在启动时预加载所有单例 Bean，能提前暴露配置错误。`BeanFactory` 仅在内存极度受限的场景下使用。
:::

### 2. Spring Boot 中的容器启动

Spring Boot 应用启动时，`SpringApplication.run()` 会自动创建并刷新 `ApplicationContext`，完成所有 Bean 的扫描、实例化和依赖注入。

::: details 手动获取容器中的 Bean
```java
// src/main/java/com/example/demo/DemoApplication.java
@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        ApplicationContext ctx = SpringApplication.run(DemoApplication.class, args);
        // 按类型获取 Bean
        UserService userService = ctx.getBean(UserService.class);
        // 按名称获取 Bean
        UserService us = (UserService) ctx.getBean("userServiceImpl");
    }
}
```
:::

---

## 二、Bean 定义与注册

### 1. 组件注解（类路径扫描）

Spring 通过 `@ComponentScan` 扫描指定包下的注解，自动注册 Bean。`@SpringBootApplication` 已内置扫描主类所在包及其子包。

| 注解 | 适用场景 | 说明 |
|------|----------|------|
| `@Component` | 通用组件 | 所有 Bean 注册注解的元注解来源 |
| `@Service` | 业务逻辑层 | 语义明确，无额外行为 |
| `@Repository` | 数据访问层 | 额外开启 Spring 的持久层异常转换 |
| `@Controller` | MVC 控制器 | 配合视图解析使用 |
| `@RestController` | REST API 控制器 | `@Controller` + `@ResponseBody` 的组合 |

::: details 组件注解使用示例
```java
// src/main/java/com/example/demo/service/UserService.java

// 业务层组件
@Service
public class UserServiceImpl implements UserService {
    // ...
}

// 数据访问层组件
@Repository
public class UserRepository {
    // ...
}

// 指定 Bean 名称（默认为类名首字母小写）
@Component("myCustomBean")
public class CustomComponent {
    // ...
}
```
:::

### 2. @Configuration 与 @Bean

当需要注册第三方类（无法添加注解）或需要复杂初始化逻辑时，使用 `@Configuration` + `@Bean` 方式。

::: details @Configuration 配置类示例
```java
// src/main/java/com/example/demo/config/AppConfig.java
@Configuration
public class AppConfig {

    // Bean 名称默认为方法名 "restTemplate"
    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setRequestFactory(new HttpComponentsClientHttpRequestFactory());
        return restTemplate;
    }

    // 指定 Bean 名称和销毁方法
    @Bean(name = "dataSource", destroyMethod = "close")
    public DataSource dataSource(
            @Value("${spring.datasource.url}") String url,
            @Value("${spring.datasource.username}") String username,
            @Value("${spring.datasource.password}") String password) {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(url);
        ds.setUsername(username);
        ds.setPassword(password);
        return ds;
    }
}
```
:::

::: tip @Configuration 的 proxyBeanMethods
`@Configuration(proxyBeanMethods = true)`（默认）会为配置类生成 CGLIB 代理，保证同一配置类中多次调用同一 `@Bean` 方法返回同一实例。设为 `false` 可提升启动速度，但需避免方法间互相调用。
:::

---

## 三、依赖注入方式

### 1. 构造器注入（推荐）

构造器注入是 Spring 官方和业界**最推荐**的注入方式，依赖关系在对象创建时即明确，支持不可变字段（`final`），便于单元测试。

::: details 构造器注入示例
```java
// src/main/java/com/example/demo/service/OrderServiceImpl.java
@Service
public class OrderServiceImpl implements OrderService {

    private final UserService userService;
    private final ProductRepository productRepository;

    // 只有一个构造器时，@Autowired 可省略（Spring 4.3+）
    public OrderServiceImpl(UserService userService, ProductRepository productRepository) {
        this.userService = userService;
        this.productRepository = productRepository;
    }
}
```

使用 Lombok 的 `@RequiredArgsConstructor` 可以省略构造器样板代码：

```java
// src/main/java/com/example/demo/service/OrderServiceImpl.java
@Service
@RequiredArgsConstructor  // 自动生成 final 字段的构造器
public class OrderServiceImpl implements OrderService {

    private final UserService userService;
    private final ProductRepository productRepository;
}
```
:::

### 2. Setter 注入

适用于**可选依赖**（非必须），允许在对象创建后再设置依赖。

::: details Setter 注入示例
```java
// src/main/java/com/example/demo/service/NotificationService.java
@Service
public class NotificationService {

    private EmailSender emailSender;

    // 可选依赖：emailSender 不存在时不报错
    @Autowired(required = false)
    public void setEmailSender(EmailSender emailSender) {
        this.emailSender = emailSender;
    }
}
```
:::

### 3. 字段注入（@Autowired）

直接在字段上添加 `@Autowired`，简洁但有缺点：无法使用 `final`，不便于单元测试，隐藏了依赖关系。

::: warning 字段注入的缺点
- 字段不能声明为 `final`，无法保证不可变性
- 单元测试时必须依赖 Spring 容器或反射才能注入依赖
- 循环依赖问题更难发现
- 建议仅在测试代码或简单示例中使用
:::

::: details 字段注入 vs @Resource
```java
@Service
public class UserServiceImpl {

    // @Autowired：按类型注入，多个实现时配合 @Qualifier 指定名称
    @Autowired
    @Qualifier("mysqlUserRepository")
    private UserRepository userRepository;

    // @Resource：JSR-250 注解，默认按名称注入，名称不匹配再按类型
    @Resource(name = "mysqlUserRepository")
    private UserRepository anotherRepository;
}
```
:::

### 4. @Autowired 与 @Qualifier

当同一接口有多个实现时，需要通过 `@Qualifier` 指定注入哪个 Bean。

::: details 多实现注入示例
```java
// src/main/java/com/example/demo/service/PayService.java
public interface PayService {
    void pay(BigDecimal amount);
}

@Service("alipayService")
public class AlipayServiceImpl implements PayService { /* ... */ }

@Service("wechatPayService")
public class WechatPayServiceImpl implements PayService { /* ... */ }

// 注入时指定具体实现
@Service
@RequiredArgsConstructor
public class OrderService {

    @Qualifier("alipayService")
    private final PayService payService;
}
```
:::

---

## 四、Bean 作用域

### 1. 常用作用域

| 作用域 | 注解 | 说明 | 适用场景 |
|--------|------|------|----------|
| `singleton` | 默认 | 容器中只有一个实例 | 无状态的 Service、Repository |
| `prototype` | `@Scope("prototype")` | 每次请求创建新实例 | 有状态的对象，如表单数据 |
| `request` | `@RequestScope` | 每个 HTTP 请求一个实例 | Web 请求作用域数据 |
| `session` | `@SessionScope` | 每个 HTTP Session 一个实例 | 用户会话数据 |

::: details 作用域注解示例
```java
// src/main/java/com/example/demo/component/RequestContext.java

// 每次 HTTP 请求创建一个新实例
@Component
@RequestScope
public class RequestContext {
    private String traceId;
    private String userId;
    // getter/setter ...
}

// 每次从容器获取都创建新实例
@Component
@Scope("prototype")
public class ReportGenerator {
    // 有状态，不能共享
}
```
:::

::: warning Singleton 注入 Prototype 的陷阱
当 Singleton Bean 注入 Prototype Bean 时，Prototype Bean 实际上只会被创建一次（随 Singleton 一起）。需要通过 `ApplicationContext.getBean()` 或 `@Lookup` 注解每次获取新实例。
:::

---

## 五、条件注解

### 1. @Conditional 系列

条件注解用于根据特定条件决定是否注册 Bean，Spring Boot 自动配置大量依赖这类注解。

| 注解 | 生效条件 |
|------|----------|
| `@ConditionalOnProperty` | 配置文件中存在指定属性且值匹配 |
| `@ConditionalOnClass` | classpath 中存在指定类 |
| `@ConditionalOnMissingBean` | 容器中不存在指定类型的 Bean |
| `@ConditionalOnBean` | 容器中已存在指定类型的 Bean |
| `@ConditionalOnWebApplication` | 当前为 Web 应用环境 |
| `@ConditionalOnExpression` | SpEL 表达式为 true |

::: details 条件注解使用示例
```java
// src/main/java/com/example/demo/config/CacheConfig.java
@Configuration
public class CacheConfig {

    // 仅当配置 cache.type=redis 时注册此 Bean
    @Bean
    @ConditionalOnProperty(name = "cache.type", havingValue = "redis")
    public CacheManager redisCacheManager(RedisConnectionFactory factory) {
        return RedisCacheManager.builder(factory).build();
    }

    // 当没有其他 CacheManager 时，注册内存缓存作为默认实现
    @Bean
    @ConditionalOnMissingBean(CacheManager.class)
    public CacheManager concurrentMapCacheManager() {
        return new ConcurrentMapCacheManager("users", "products");
    }
}
```

```yaml
# src/main/resources/application.yml
cache:
  type: redis   # 切换为 memory 则使用内存缓存
```
:::

### 2. @Profile

`@Profile` 是 `@Conditional` 的特殊化，根据激活的 Spring Profile 决定 Bean 是否注册。

::: details @Profile 示例
```java
// src/main/java/com/example/demo/config/DataSourceConfig.java

@Configuration
@Profile("dev")
public class DevDataSourceConfig {
    @Bean
    public DataSource dataSource() {
        // 开发环境：使用 H2 内存数据库
        return new EmbeddedDatabaseBuilder()
            .setType(EmbeddedDatabaseType.H2)
            .build();
    }
}

@Configuration
@Profile("prod")
public class ProdDataSourceConfig {
    @Bean
    public DataSource dataSource() {
        // 生产环境：使用连接池
        HikariDataSource ds = new HikariDataSource();
        // 配置生产数据库...
        return ds;
    }
}
```
:::

---

## 六、AOP 基础

### 1. AOP 核心概念

**AOP（Aspect-Oriented Programming，面向切面编程）** 将横切关注点（日志、事务、权限校验等）从业务逻辑中分离出来。

| 概念 | 说明 |
|------|------|
| **Aspect（切面）** | 横切关注点的模块化，用 `@Aspect` 标注的类 |
| **Join Point（连接点）** | 程序执行的某个点（方法调用、异常抛出等） |
| **Pointcut（切点）** | 匹配连接点的表达式，定义在哪些方法上应用通知 |
| **Advice（通知）** | 切面在连接点执行的动作（Before/After/Around） |
| **Weaving（织入）** | 将切面应用到目标对象的过程 |

### 2. 通知类型

| 注解 | 执行时机 |
|------|----------|
| `@Before` | 目标方法执行前 |
| `@After` | 目标方法执行后（无论是否异常） |
| `@AfterReturning` | 目标方法正常返回后 |
| `@AfterThrowing` | 目标方法抛出异常后 |
| `@Around` | 环绕目标方法，可控制是否执行原方法 |

### 3. 切点表达式

::: details 切点表达式语法示例
```java
// execution(修饰符? 返回类型 类路径.方法名(参数) 异常?)

// 匹配 service 包下所有类的所有 public 方法
@Pointcut("execution(public * com.example.demo.service.*.*(..))")

// 匹配带有 @Transactional 注解的方法
@Pointcut("@annotation(org.springframework.transaction.annotation.Transactional)")

// 匹配 UserService 接口的所有方法
@Pointcut("within(com.example.demo.service.UserService+)")
```
:::

### 4. 完整切面示例

::: details 日志切面完整实现
```java
// src/main/java/com/example/demo/aspect/LogAspect.java
@Aspect
@Component
@Slf4j
public class LogAspect {

    // 定义可复用的切点：匹配 controller 包下所有方法
    @Pointcut("execution(* com.example.demo.controller..*(..))")
    public void controllerMethods() {}

    // 前置通知：记录请求信息
    @Before("controllerMethods()")
    public void logBefore(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        Object[] args = joinPoint.getArgs();
        log.info("调用方法：{}，参数：{}", methodName, Arrays.toString(args));
    }

    // 环绕通知：记录方法执行耗时
    @Around("controllerMethods()")
    public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        String methodName = joinPoint.getSignature().toShortString();
        try {
            Object result = joinPoint.proceed();  // 执行目标方法
            long elapsed = System.currentTimeMillis() - startTime;
            log.info("方法 {} 执行耗时：{} ms", methodName, elapsed);
            return result;
        } catch (Exception e) {
            log.error("方法 {} 执行异常：{}", methodName, e.getMessage());
            throw e;
        }
    }

    // 后置返回通知：获取返回值
    @AfterReturning(pointcut = "controllerMethods()", returning = "result")
    public void logAfterReturning(JoinPoint joinPoint, Object result) {
        log.info("方法 {} 返回：{}", joinPoint.getSignature().getName(), result);
    }
}
```

启用 AOP 需在配置类或主类上添加 `@EnableAspectJAutoProxy`（Spring Boot 默认已启用）。
:::

::: tip AOP 的代理机制
Spring AOP 默认使用 **JDK 动态代理**（目标类实现了接口）或 **CGLIB 代理**（目标类未实现接口）。代理只对 Spring 容器管理的 Bean 生效，类内部方法互相调用不会触发 AOP。
:::
