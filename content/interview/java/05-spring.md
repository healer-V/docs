---
title: "Spring面试题"
category: "面试题"
tags:
  - Spring
  - Spring Boot
  - 事务
excerpt: "围绕 IoC 与依赖注入、Bean 生命周期与作用域、循环依赖、AOP 代理、事务传播与失效场景、Spring Boot 自动配置和 Spring MVC 请求流程等面试题，说明机制、版本差异和排查方法。"
---

# Spring面试题

Spring 题的主线是“容器创建并管理对象，代理在调用前后织入横切逻辑”。很多问题，例如事务为什么不生效、循环依赖为什么报错，都能从容器创建 Bean 的顺序和代理的调用路径推导出来。

::: info 版本边界
本篇以 Spring Framework 6.2 和 Spring Boot 3.5 为基线，需要 Java 17 及以上，Jakarta EE 包名为 `jakarta.*`；Spring Boot 2.x 的差异在对应题目中说明。
:::

## 一、容器与 Bean

### 1. IoC 和依赖注入是什么，推荐哪种注入方式？

**IoC（控制反转）指对象不再自己创建依赖，而是由容器创建并注入；依赖注入（DI）是实现 IoC 的方式。** 订单服务只声明需要 `PaymentClient`，具体使用哪个实现由容器按配置决定，测试时可以替换为模拟实现。

| 注入方式 | 写法 | 特点 |
|----------|------|------|
| 构造器注入 | 依赖作为构造参数 | 依赖不可变、不为空，便于单元测试，官方推荐 |
| Setter 注入 | `@Autowired` 标注 setter | 适合可选依赖 |
| 字段注入 | `@Autowired` 标注字段 | 写法简短，但隐藏依赖，测试时只能借助反射 |

类只有一个构造器时，Spring 4.3 起可以省略 `@Autowired`。同一类型有多个实现时，用 `@Qualifier` 指定名称或用 `@Primary` 标记默认实现，否则启动时抛出 `NoUniqueBeanDefinitionException`。

参考：[Spring Framework：依赖注入](https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html)。

### 2. Bean 的生命周期是怎样的？

**单例 Bean 在容器启动时依次经历实例化、属性填充、Aware 回调、初始化前后处理和初始化，容器关闭时执行销毁回调。**

1. **实例化：** 通过构造器或工厂方法创建对象。
2. **属性填充：** 注入 `@Autowired`、`@Value` 等依赖。
3. **Aware 回调：** 依次调用 `BeanNameAware`、`BeanClassLoaderAware`、`BeanFactoryAware`；`ApplicationContextAware` 由容器内置的后处理器在初始化前回调。
4. **初始化前：** `BeanPostProcessor.postProcessBeforeInitialization`，`@PostConstruct` 在此阶段执行。
5. **初始化：** `InitializingBean.afterPropertiesSet()`，然后是自定义 `init-method`。
6. **初始化后：** `BeanPostProcessor.postProcessAfterInitialization`，AOP 代理通常在这里创建，容器中最终保存的是代理对象。
7. **销毁：** 容器关闭时执行 `@PreDestroy`、`DisposableBean.destroy()` 和 `destroy-method`。

第 6 步解释了一个常见现象：在 `@PostConstruct` 方法中调用本类带 `@Transactional` 的方法，事务不会生效，因为此时操作的是原始对象而不是代理。原型（prototype）Bean 的销毁回调不由容器调用。

参考：[Spring Framework：Bean 生命周期回调](https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html)。

### 3. Bean 有哪些作用域，单例 Bean 是线程安全的吗？

**默认作用域是 singleton，容器内只有一个实例；prototype 每次获取都创建新实例；Web 环境还有 request、session、application 和 websocket 作用域。**

单例 Bean 本身不保证线程安全，安全与否取决于它是否有可变的共享状态。常见的 Service、DAO 只持有其他无状态 Bean 和配置，所以可以安全共享；若在单例中用成员变量保存当前请求的用户或订单，并发请求就会互相覆盖，应改为方法局部变量或请求作用域对象。

在单例中注入 prototype Bean 时，注入只发生一次，之后拿到的始终是同一个实例。需要每次获取新实例时，使用 `ObjectProvider<T>.getObject()` 或 `@Lookup` 方法。

参考：[Spring Framework：Bean 作用域](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html)。

### 4. Spring 如何解决循环依赖，为什么 Spring Boot 默认禁止？

**对于单例 Bean 的字段或 setter 注入，Spring 通过三级缓存提前暴露尚未初始化完成的对象来解决循环依赖；构造器注入的循环依赖无法解决。**

| 缓存 | 存放内容 |
|------|----------|
| 一级 `singletonObjects` | 完全初始化好的单例 |
| 二级 `earlySingletonObjects` | 已提前暴露的早期引用 |
| 三级 `singletonFactories` | 生成早期引用的工厂，必要时返回代理 |

A 依赖 B、B 依赖 A 时：创建 A 实例后把它的工厂放入三级缓存；填充 A 的属性时去创建 B；B 填充属性时从三级缓存取出 A 的早期引用完成注入；B 初始化完毕后回到 A。第三级之所以存放工厂而不是对象，是为了在 A 需要 AOP 代理时，让 B 拿到的早期引用就是代理对象。

Spring Boot 2.6 起默认 `spring.main.allow-circular-references=false`，出现循环依赖时启动失败并打印依赖环。循环依赖通常说明职责划分有问题，应优先通过提取公共服务或事件解耦，而不是重新打开该配置。

参考：[Spring Boot 2.6 发布说明](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.6-Release-Notes#circular-references-prohibited-by-default)。

## 二、AOP 与事务

### 1. Spring AOP 如何实现，为什么同类内部调用不会被增强？

**Spring AOP 基于运行时代理：目标类实现接口时可以使用 JDK 动态代理，否则使用 CGLIB 生成子类；Spring Boot 默认对所有目标使用基于类的代理。** 切面逻辑只在“调用方 → 代理 → 目标”的路径上执行。

同一个类中，`placeOrder()` 直接调用 `this.deductStock()` 时，`this` 是目标对象本身而不是代理，`deductStock` 上的 `@Transactional`、`@Async` 或自定义切面都不会触发。

| 解决方式 | 说明 |
|----------|------|
| 拆分到另一个 Bean | 通过注入的代理调用，最清晰 |
| 注入自身代理 | `@Lazy` 注入本类实例后调用 |
| `AopContext.currentProxy()` | 需要开启 `exposeProxy = true`，耦合 AOP API |

CGLIB 通过继承生成代理，`final` 类和 `final`、`private`、`static` 方法都无法被增强。Spring AOP 只拦截 Spring 管理的 Bean 的方法调用，需要拦截字段访问或非容器对象时应使用 AspectJ 编译期或加载期织入。

参考：[Spring Framework：AOP 代理机制](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html)。

### 2. @Transactional 有哪些常见失效场景？

**事务失效的根源是调用没有经过事务代理，或者异常没有被事务拦截器识别为需要回滚。**

| 场景 | 原因 | 处理方式 |
|------|------|----------|
| 同类内部调用 | 绕过代理 | 拆分 Bean |
| 方法是 `private`、`final` 或 `static` | 代理无法拦截 | 改为可被代理的 `public` 方法 |
| 异常被 `catch` 后未抛出 | 拦截器没有看到异常 | 重新抛出或调用 `setRollbackOnly()` |
| 抛出受检异常 | 默认只对 `RuntimeException` 和 `Error` 回滚 | 设置 `rollbackFor = Exception.class` |
| 类未被 Spring 管理 | 没有代理 | 确认被组件扫描或显式注册 |
| 在新线程中执行数据库操作 | 事务绑定在 `ThreadLocal`，不跨线程 | 子线程操作单独开事务 |
| 存储引擎不支持事务 | 如 MySQL MyISAM | 使用 InnoDB |

排查时把 `org.springframework.transaction` 和 `org.springframework.jdbc` 的日志调到 DEBUG，能看到 `Creating new transaction`、`Committing` 或 `Rolling back` 记录，判断事务是否真的开启、在哪里结束。

参考：[Spring Framework：声明式事务回滚规则](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/rolling-back.html)。

### 3. 事务传播行为有哪些，REQUIRES_NEW 与 NESTED 有什么区别？

**传播行为决定一个事务方法被另一个事务方法调用时，是加入已有事务、新建事务还是以非事务方式执行。** 默认是 `REQUIRED`：有事务就加入，没有就新建。

| 传播行为 | 外部有事务时 | 外部无事务时 |
|----------|--------------|--------------|
| `REQUIRED` | 加入 | 新建 |
| `REQUIRES_NEW` | 挂起外部事务，新建独立事务 | 新建 |
| `NESTED` | 在外部事务中创建保存点 | 新建 |
| `SUPPORTS` | 加入 | 非事务执行 |
| `NOT_SUPPORTED` | 挂起外部事务，非事务执行 | 非事务执行 |
| `MANDATORY` | 加入 | 抛异常 |
| `NEVER` | 抛异常 | 非事务执行 |

下单时记录操作日志：日志方法用 `REQUIRES_NEW`，即使下单回滚，已提交的日志也会保留；若用 `NESTED`，日志回滚只回到保存点，不影响外部事务，但外部事务回滚时日志也一起回滚。`NESTED` 依赖 JDBC 保存点，使用 JPA 时通常不支持。

::: warning REQUIRED 中内层异常会让外层无法提交
内层 `REQUIRED` 方法抛出异常后，共享的事务被标记为仅回滚；外层即使捕获了异常并正常返回，提交时也会抛出 `UnexpectedRollbackException`。需要内层失败不影响外层时，应使用 `REQUIRES_NEW` 或 `NESTED`。
:::

参考：[Spring Framework：事务传播](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html)。

## 三、Spring Boot 与 MVC

### 1. Spring Boot 自动配置的原理是什么？

**`@SpringBootApplication` 组合了 `@SpringBootConfiguration`、`@EnableAutoConfiguration` 和 `@ComponentScan`；`@EnableAutoConfiguration` 读取类路径中所有自动配置类，再由条件注解决定每个配置是否生效。**

Spring Boot 2.7 起，自动配置类登记在 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` 文件中；3.0 起不再从 `spring.factories` 读取自动配置。每个自动配置类使用条件注解判断：

| 条件注解 | 生效条件 |
|----------|----------|
| `@ConditionalOnClass` | 类路径中存在指定类 |
| `@ConditionalOnMissingBean` | 容器中还没有该类型的 Bean |
| `@ConditionalOnProperty` | 配置项满足指定值 |
| `@ConditionalOnWebApplication` | 当前是 Web 应用 |

引入 `spring-boot-starter-jdbc` 后类路径中出现 `DataSource` 相关类，`DataSourceAutoConfiguration` 就会创建连接池；用户自己声明了 `DataSource` Bean 时，`@ConditionalOnMissingBean` 让自动配置让步。启动时加 `--debug` 会输出条件评估报告，列出每个自动配置匹配或未匹配的原因。

参考：[Spring Boot 3.5：自动配置](https://docs.spring.io/spring-boot/3.5/reference/using/auto-configuration.html)。

### 2. Spring Boot 配置的优先级是怎样的？

**Spring Boot 按固定顺序加载配置源，后加载的同名属性覆盖先加载的。** 常用来源从低到高大致为：

1. 打包在 jar 内的 `application.properties` / `application.yml`。
2. jar 内的 `application-{profile}` 文件。
3. jar 外同目录或 `config/` 目录下的配置文件。
4. 操作系统环境变量，例如 `SERVER_PORT`。
5. 命令行参数，例如 `--server.port=8081`。

所以同一属性在 jar 内为 8080、环境变量为 9090、命令行为 8081 时，最终生效的是 8081。生产环境的密码和密钥应通过环境变量或密钥管理服务注入，不提交到代码仓库。Actuator 的 `/actuator/env` 端点可以查看属性来自哪个来源，但会暴露敏感信息，必须做访问控制。

参考：[Spring Boot 3.5：外部化配置](https://docs.spring.io/spring-boot/3.5/reference/features/external-config.html)。

### 3. Spring MVC 处理一个请求的流程是怎样的？

**请求进入 `DispatcherServlet` 后，由 HandlerMapping 找到处理器，HandlerAdapter 调用控制器方法，返回值经消息转换器或视图解析器生成响应。**

1. Servlet 容器把请求交给 `DispatcherServlet`。
2. `HandlerMapping` 根据 URL 和方法找到 `HandlerExecutionChain`，包含控制器方法和拦截器。
3. 依次执行拦截器的 `preHandle`，返回 `false` 时直接结束。
4. `HandlerAdapter` 解析参数（`@RequestBody` 由 `HttpMessageConverter` 把 JSON 转为对象）并调用控制器。
5. `@RestController` 的返回值经 `HttpMessageConverter` 序列化为 JSON 写入响应。
6. 执行拦截器的 `postHandle` 和 `afterCompletion`；异常交给 `@ControllerAdvice` 中的 `@ExceptionHandler` 处理。

参考：[Spring Framework：DispatcherServlet](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet.html)。

### 4. 过滤器、拦截器和 AOP 有什么区别？

**三者作用在调用链的不同层次：过滤器属于 Servlet 规范，拦截器属于 Spring MVC，AOP 作用于 Spring Bean 的方法调用。**

| 维度 | Filter | HandlerInterceptor | AOP |
|------|--------|--------------------|-----|
| 规范归属 | Jakarta Servlet | Spring MVC | Spring AOP |
| 执行时机 | 进入 `DispatcherServlet` 之前 | 控制器方法前后 | 任意 Bean 方法前后 |
| 可获取信息 | 原始请求和响应 | 请求、响应及目标处理器 | 方法参数和返回值 |
| 典型用途 | 编码、跨域、请求日志 | 登录校验、权限 | 事务、方法级审计 |

Spring Security 的认证和授权就是一组过滤器链，因此它在拦截器之前执行。需要基于请求路径判断时选择过滤器或拦截器；需要对 Service 层方法统一处理时选择 AOP。

参考：[Spring Framework：拦截器](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/interceptors.html)。
