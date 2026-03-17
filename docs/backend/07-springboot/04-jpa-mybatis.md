---
title: "Spring Boot 数据访问"
category: "后端 · Spring Boot"
tags:
  - Spring Boot
  - JPA
  - MyBatis
  - 数据库
date: 2026-03-17
excerpt: "Spring Boot 提供 Spring Data JPA 和 MyBatis 两种主流数据访问方案：JPA 适合快速开发标准 CRUD，MyBatis 适合复杂 SQL 场景，事务管理则由 @Transactional 统一处理。"
---

# Spring Boot 数据访问

## 一、Spring Data JPA

### 1. 依赖与配置

::: details Maven 依赖与数据源配置
```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <scope>runtime</scope>
</dependency>
```

```yaml
# src/main/resources/application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/demo?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root
    password: your_password
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: update      # 开发环境 update；生产环境 validate 或 none
    show-sql: true           # 控制台打印 SQL
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.MySQL8Dialect
```
:::

### 2. 实体类定义

::: details 实体类注解示例
```java
// src/main/java/com/example/demo/entity/User.java
@Entity
@Table(name = "t_user")  // 映射到数据库表名
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // 自增主键
    private Long id;

    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false)
    private String email;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp  // 自动设置创建时间
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp    // 自动更新修改时间
    private LocalDateTime updatedAt;

    @Enumerated(EnumType.STRING)  // 枚举存储为字符串
    private UserStatus status;
}
```
:::

### 3. Repository 接口与 CRUD

Spring Data JPA 通过接口继承提供 CRUD 方法，无需编写实现类。

::: details Repository 接口定义与使用
```java
// src/main/java/com/example/demo/repository/UserRepository.java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // 方法名推导查询：findBy + 字段名
    Optional<User> findByUsername(String username);

    List<User> findByStatus(UserStatus status);

    boolean existsByEmail(String email);

    long countByStatus(UserStatus status);

    // 多条件查询
    List<User> findByStatusAndCreatedAtAfter(UserStatus status, LocalDateTime after);

    // 模糊查询
    List<User> findByUsernameLike(String pattern);  // pattern: "%张%"
    List<User> findByUsernameContaining(String keyword);  // 自动添加 %

    // 排序
    List<User> findByStatusOrderByCreatedAtDesc(UserStatus status);
}
```

```java
// src/main/java/com/example/demo/service/UserServiceImpl.java
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    public UserDTO findById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("用户不存在：" + id));
        return UserDTO.from(user);
    }

    public UserDTO create(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException(400, "邮箱已被注册");
        }
        User user = User.builder()
            .username(request.username())
            .email(request.email())
            .status(UserStatus.ACTIVE)
            .build();
        return UserDTO.from(userRepository.save(user));
    }

    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("用户不存在：" + id);
        }
        userRepository.deleteById(id);
    }
}
```
:::

### 4. 分页查询

::: details 分页与排序示例
```java
// Repository 继承 JpaRepository 已内置分页支持
public interface UserRepository extends JpaRepository<User, Long> {

    // 带分页的条件查询
    Page<User> findByStatus(UserStatus status, Pageable pageable);
}

// Service 中构建分页请求
public Page<UserDTO> findPage(int page, int size, UserStatus status) {
    // PageRequest.of(页码从0开始, 每页条数, 排序)
    Pageable pageable = PageRequest.of(page, size,
        Sort.by(Sort.Direction.DESC, "createdAt"));
    return userRepository.findByStatus(status, pageable)
        .map(UserDTO::from);
}
```
:::

### 5. 自定义查询（@Query）

::: details JPQL 与原生 SQL 查询
```java
public interface UserRepository extends JpaRepository<User, Long> {

    // JPQL（面向实体类，不是表名）
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.status = :status")
    Optional<User> findActiveByEmail(@Param("email") String email,
                                     @Param("status") UserStatus status);

    // 原生 SQL（nativeQuery = true）
    @Query(value = "SELECT * FROM t_user WHERE created_at > :date LIMIT :limit",
           nativeQuery = true)
    List<User> findRecentUsers(@Param("date") LocalDateTime date,
                               @Param("limit") int limit);

    // 更新操作需要 @Modifying
    @Modifying
    @Query("UPDATE User u SET u.status = :status WHERE u.id = :id")
    int updateStatus(@Param("id") Long id, @Param("status") UserStatus status);
}
```
:::

---

## 二、JPA 关联关系

### 1. 关联关系注解

| 注解 | 关系类型 | 示例 |
|------|----------|------|
| `@ManyToOne` | 多对一 | 多个订单属于同一用户 |
| `@OneToMany` | 一对多 | 一个用户有多个订单 |
| `@OneToOne` | 一对一 | 用户与用户详情 |
| `@ManyToMany` | 多对多 | 用户与角色 |

### 2. 常见关联配置

::: details 关联关系完整示例
```java
// src/main/java/com/example/demo/entity/Order.java
@Entity
@Table(name = "t_order")
@Data
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 多个订单属于一个用户（多对一）
    // FetchType.LAZY：懒加载，访问 user 字段时才查询（推荐）
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)  // 外键列名
    private User user;

    // 一个订单有多个订单项（一对多）
    // cascade = ALL：对 Order 的操作级联到 OrderItem
    // orphanRemoval = true：从集合中移除的 OrderItem 自动删除
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    private List<OrderItem> items = new ArrayList<>();
}

// src/main/java/com/example/demo/entity/Role.java（多对多示例）
@Entity
@Table(name = "t_role")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
}

// User 实体中添加多对多
@ManyToMany(fetch = FetchType.LAZY)
@JoinTable(
    name = "t_user_role",           // 中间表名称
    joinColumns = @JoinColumn(name = "user_id"),
    inverseJoinColumns = @JoinColumn(name = "role_id")
)
private Set<Role> roles = new HashSet<>();
```
:::

::: warning N+1 查询问题
使用 `FetchType.EAGER` 或不当的 JPQL 容易触发 N+1 查询。推荐使用 `JOIN FETCH` 或 `@EntityGraph` 显式声明需要加载的关联，避免大量额外查询。

```java
// 使用 JOIN FETCH 避免 N+1
@Query("SELECT o FROM Order o JOIN FETCH o.items WHERE o.user.id = :userId")
List<Order> findWithItemsByUserId(@Param("userId") Long userId);
```
:::

---

## 三、Spring Boot 集成 MyBatis

### 1. 依赖与配置

::: details MyBatis 依赖与配置
```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>3.0.3</version>
</dependency>
```

```yaml
# src/main/resources/application.yml
mybatis:
  mapper-locations: classpath:mapper/*.xml   # XML 映射文件位置
  type-aliases-package: com.example.demo.entity  # 类型别名包
  configuration:
    map-underscore-to-camel-case: true        # 下划线转驼峰命名
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl  # 开发环境打印 SQL
```
:::

### 2. Mapper 接口（注解方式）

::: details 注解方式 Mapper
```java
// src/main/java/com/example/demo/mapper/UserMapper.java
@Mapper  // 或在启动类上 @MapperScan("com.example.demo.mapper")
public interface UserMapper {

    @Select("SELECT * FROM t_user WHERE id = #{id}")
    User findById(Long id);

    @Select("SELECT * FROM t_user WHERE status = #{status}")
    List<User> findByStatus(String status);

    @Insert("INSERT INTO t_user(username, email, status, created_at) " +
            "VALUES(#{username}, #{email}, #{status}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")  // 回填自增主键
    int insert(User user);

    @Update("UPDATE t_user SET username=#{username}, email=#{email} WHERE id=#{id}")
    int update(User user);

    @Delete("DELETE FROM t_user WHERE id = #{id}")
    int deleteById(Long id);
}
```
:::

### 3. XML 映射（复杂 SQL）

::: details XML Mapper 示例
```java
// src/main/java/com/example/demo/mapper/OrderMapper.java
@Mapper
public interface OrderMapper {
    List<Order> findByCondition(OrderQueryParam param);
    int batchInsert(List<OrderItem> items);
}
```

```xml
<!-- src/main/resources/mapper/OrderMapper.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.example.demo.mapper.OrderMapper">

    <!-- 结果映射（处理关联查询）-->
    <resultMap id="OrderResultMap" type="Order">
        <id property="id" column="order_id"/>
        <result property="totalAmount" column="total_amount"/>
        <association property="user" javaType="User">
            <id property="id" column="user_id"/>
            <result property="username" column="username"/>
        </association>
        <collection property="items" ofType="OrderItem">
            <id property="id" column="item_id"/>
            <result property="productName" column="product_name"/>
            <result property="quantity" column="quantity"/>
        </collection>
    </resultMap>

    <!-- 动态 SQL：条件查询 -->
    <select id="findByCondition" parameterType="OrderQueryParam"
            resultMap="OrderResultMap">
        SELECT o.id AS order_id, o.total_amount,
               u.id AS user_id, u.username,
               oi.id AS item_id, oi.product_name, oi.quantity
        FROM t_order o
        LEFT JOIN t_user u ON o.user_id = u.id
        LEFT JOIN t_order_item oi ON oi.order_id = o.id
        <where>
            <if test="userId != null">
                AND o.user_id = #{userId}
            </if>
            <if test="status != null and status != ''">
                AND o.status = #{status}
            </if>
            <if test="startDate != null">
                AND o.created_at >= #{startDate}
            </if>
            <if test="endDate != null">
                AND o.created_at &lt;= #{endDate}
            </if>
        </where>
        ORDER BY o.created_at DESC
    </select>

    <!-- 批量插入 -->
    <insert id="batchInsert" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO t_order_item(order_id, product_name, quantity, price)
        VALUES
        <foreach collection="list" item="item" separator=",">
            (#{item.orderId}, #{item.productName}, #{item.quantity}, #{item.price})
        </foreach>
    </insert>

</mapper>
```
:::

---

## 四、事务管理

### 1. @Transactional

`@Transactional` 注解可加在类或方法上，Spring 通过 AOP 代理自动管理事务的开启、提交和回滚。

::: details @Transactional 使用示例
```java
// src/main/java/com/example/demo/service/OrderServiceImpl.java
@Service
@RequiredArgsConstructor
public class OrderServiceImpl {

    private final OrderRepository orderRepository;
    private final StockRepository stockRepository;

    // 默认：REQUIRED 传播级别，RuntimeException 时回滚
    @Transactional
    public Order createOrder(CreateOrderRequest request) {
        // 扣减库存
        Stock stock = stockRepository.findByProductId(request.getProductId())
            .orElseThrow(() -> new BusinessException(404, "商品不存在"));
        if (stock.getQuantity() < request.getCount()) {
            throw new BusinessException(400, "库存不足");
        }
        stock.setQuantity(stock.getQuantity() - request.getCount());
        stockRepository.save(stock);

        // 创建订单
        Order order = new Order();
        order.setUserId(request.getUserId());
        order.setProductId(request.getProductId());
        order.setCount(request.getCount());
        return orderRepository.save(order);
        // 方法正常返回 → 提交事务
        // 抛出 RuntimeException → 回滚事务
    }

    // 只读事务：优化查询性能，不允许写操作
    @Transactional(readOnly = true)
    public Page<Order> findPage(Pageable pageable) {
        return orderRepository.findAll(pageable);
    }
}
```
:::

### 2. 传播级别与隔离级别

| 传播级别 | 说明 | 适用场景 |
|----------|------|----------|
| `REQUIRED`（默认） | 有事务则加入，无则新建 | 大多数业务方法 |
| `REQUIRES_NEW` | 始终新建事务，挂起当前事务 | 日志记录、审计（不受外层回滚影响） |
| `SUPPORTS` | 有事务则加入，无则以非事务运行 | 只读查询方法 |
| `NOT_SUPPORTED` | 始终以非事务运行，挂起当前事务 | 不需要事务的操作 |
| `NEVER` | 不允许在事务中运行，否则抛异常 | 强制非事务场景 |
| `MANDATORY` | 必须在事务中运行，否则抛异常 | 确保调用者有事务 |
| `NESTED` | 在当前事务中嵌套子事务（保存点） | 部分回滚场景 |

| 隔离级别 | 说明 | 解决的问题 |
|----------|------|------------|
| `READ_UNCOMMITTED` | 读取未提交数据 | 无 |
| `READ_COMMITTED` | 只读已提交数据（Oracle 默认） | 脏读 |
| `REPEATABLE_READ` | 同一事务多次读取结果一致（MySQL 默认） | 脏读、不可重复读 |
| `SERIALIZABLE` | 串行执行，最高隔离级别 | 脏读、不可重复读、幻读 |

::: warning @Transactional 失效场景
- 方法为 `private` 或 `final`（AOP 代理无法拦截）
- 同类内部方法互相调用（绕过了代理对象）
- 异常被 `catch` 吞掉未重新抛出
- 非 `RuntimeException` 未配置 `rollbackFor`

```java
// 正确：指定检查型异常也回滚
@Transactional(rollbackFor = Exception.class)
public void doSomething() throws IOException { ... }
```
:::

---

## 五、多数据源配置

::: details 双数据源配置示例
```yaml
# src/main/resources/application.yml
spring:
  datasource:
    primary:
      url: jdbc:mysql://localhost:3306/primary_db
      username: root
      password: primary_pass
    secondary:
      url: jdbc:mysql://localhost:3306/secondary_db
      username: root
      password: secondary_pass
```

```java
// src/main/java/com/example/demo/config/PrimaryDataSourceConfig.java
@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
    basePackages = "com.example.demo.repository.primary",
    entityManagerFactoryRef = "primaryEntityManagerFactory",
    transactionManagerRef = "primaryTransactionManager"
)
public class PrimaryDataSourceConfig {

    @Primary
    @Bean
    @ConfigurationProperties("spring.datasource.primary")
    public DataSource primaryDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Primary
    @Bean
    public LocalContainerEntityManagerFactoryBean primaryEntityManagerFactory(
            @Qualifier("primaryDataSource") DataSource dataSource) {
        LocalContainerEntityManagerFactoryBean factory =
            new LocalContainerEntityManagerFactoryBean();
        factory.setDataSource(dataSource);
        factory.setPackagesToScan("com.example.demo.entity.primary");
        // 设置 JPA 提供商和属性...
        return factory;
    }

    @Primary
    @Bean
    public PlatformTransactionManager primaryTransactionManager(
            @Qualifier("primaryEntityManagerFactory")
            EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }
}
```
:::

::: tip 多数据源的简化方案
若不想手动配置多数据源，可使用 `dynamic-datasource-spring-boot-starter`（苞米豆）库，通过 `@DS("secondary")` 注解轻松切换数据源。
:::
