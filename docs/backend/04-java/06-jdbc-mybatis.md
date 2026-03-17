---
title: "JDBC 与 MyBatis"
category: "后端 · Java"
tags:
  - Java
  - JDBC
  - MyBatis
  - 数据库
date: 2026-03-17
---

# JDBC 与 MyBatis

JDBC（Java Database Connectivity）是 Java 访问关系型数据库的标准 API，MyBatis 是对 JDBC 的轻量级封装，通过 XML 或注解将 SQL 与 Java 对象映射，在保留 SQL 控制力的同时大幅减少样板代码。

## 一、JDBC 基本流程

### 1. 五步操作

JDBC 操作数据库的标准流程分为五步：注册驱动 → 获取连接 → 执行 SQL → 处理结果 → 关闭连接。

::: details 完整 JDBC 查询示例

```java
import java.sql.*;

public class JdbcDemo {
    // 数据库连接参数
    private static final String URL      = "jdbc:mysql://localhost:3306/shop?useSSL=false&serverTimezone=UTC";
    private static final String USERNAME = "root";
    private static final String PASSWORD = "your_password";

    public static void main(String[] args) {
        // 1. 注册驱动（JDBC 4.0 后通过 SPI 自动注册，无需显式调用）
        // Class.forName("com.mysql.cj.jdbc.Driver");

        // 2. 获取连接
        try (Connection conn = DriverManager.getConnection(URL, USERNAME, PASSWORD);

             // 3. 创建 Statement（PreparedStatement 防 SQL 注入，后面详述）
             PreparedStatement stmt = conn.prepareStatement(
                 "SELECT id, name, price FROM product WHERE category = ? AND price < ?")) {

            // 设置参数（从 1 开始）
            stmt.setString(1, "electronics");
            stmt.setDouble(2, 5000.0);

            // 4. 执行查询，处理结果集
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    long   id    = rs.getLong("id");
                    String name  = rs.getString("name");
                    double price = rs.getDouble("price");
                    System.out.printf("ID: %d | 商品: %s | 价格: %.2f%n", id, name, price);
                }
            }

        } catch (SQLException e) {
            // 5. 异常处理（try-with-resources 自动关闭连接）
            System.err.println("SQL 错误：" + e.getMessage());
            System.err.println("错误码：" + e.getErrorCode());
        }
    }
}
```

:::

### 2. PreparedStatement 防 SQL 注入

`PreparedStatement` 将 SQL 结构与参数分离，数据库预编译 SQL 模板后再填充参数，参数值不会被解析为 SQL 命令。

::: details SQL 注入对比示例

```java
// 危险：字符串拼接，存在 SQL 注入风险
String dangerousSQL = "SELECT * FROM user WHERE name = '" + userInput + "'";
// 如果 userInput = "' OR '1'='1"，查询变为：
// SELECT * FROM user WHERE name = '' OR '1'='1'  → 返回所有用户！

// 安全：PreparedStatement
try (PreparedStatement stmt = conn.prepareStatement(
        "SELECT * FROM user WHERE name = ?")) {
    stmt.setString(1, userInput); // 参数被转义，不会破坏 SQL 结构
    ResultSet rs = stmt.executeQuery();
}
```

:::

::: danger
永远不要通过字符串拼接构造 SQL，这是最常见的安全漏洞（OWASP Top 10 榜首）。始终使用 `PreparedStatement` 或 ORM 框架的参数绑定机制。
:::

### 3. 事务控制

::: details JDBC 事务示例

```java
Connection conn = null;
try {
    conn = dataSource.getConnection();
    conn.setAutoCommit(false); // 关闭自动提交

    // 转账操作：扣减发送方余额
    try (PreparedStatement debit = conn.prepareStatement(
            "UPDATE account SET balance = balance - ? WHERE id = ?")) {
        debit.setDouble(1, 1000.0);
        debit.setLong(2, fromAccountId);
        debit.executeUpdate();
    }

    // 增加接收方余额
    try (PreparedStatement credit = conn.prepareStatement(
            "UPDATE account SET balance = balance + ? WHERE id = ?")) {
        credit.setDouble(1, 1000.0);
        credit.setLong(2, toAccountId);
        credit.executeUpdate();
    }

    conn.commit(); // 提交事务

} catch (SQLException e) {
    if (conn != null) {
        conn.rollback(); // 回滚事务
    }
    throw e;
} finally {
    if (conn != null) {
        conn.setAutoCommit(true);
        conn.close();
    }
}
```

:::

## 二、连接池

### 1. 为什么需要连接池

每次 `DriverManager.getConnection()` 都会创建新的 TCP 连接和数据库会话，耗时约 100ms 以上。连接池在启动时预创建连接，复用已建立的连接，将获取连接的时间降至微秒级。

### 2. HikariCP

HikariCP 是目前性能最佳的 JDBC 连接池，也是 Spring Boot 的默认连接池。

::: details HikariCP 配置示例

```java
import com.zaxxer.hikari.*;

HikariConfig config = new HikariConfig();
config.setJdbcUrl("jdbc:mysql://localhost:3306/shop");
config.setUsername("root");
config.setPassword("your_password");

// 核心参数
config.setMaximumPoolSize(20);          // 最大连接数（CPU核心数 × 2 + 磁盘数）
config.setMinimumIdle(5);              // 最小空闲连接数
config.setConnectionTimeout(30_000);   // 获取连接超时（30秒）
config.setIdleTimeout(600_000);        // 空闲连接回收时间（10分钟）
config.setMaxLifetime(1_800_000);      // 连接最大存活时间（30分钟，小于数据库 wait_timeout）
config.setConnectionTestQuery("SELECT 1"); // 连接有效性测试 SQL

HikariDataSource dataSource = new HikariDataSource(config);

// 使用连接池
try (Connection conn = dataSource.getConnection()) {
    // 正常使用，关闭时自动归还到池中
}
```

:::

### 3. Druid

Druid 是阿里巴巴开源的连接池，提供强大的监控功能，在国内项目中广泛使用。

::: details Druid Spring Boot 配置

```yaml
# application.yml
spring:
  datasource:
    type: com.alibaba.druid.pool.DruidDataSource
    url: jdbc:mysql://localhost:3306/shop?useSSL=false&serverTimezone=UTC
    username: root
    password: your_password
    druid:
      initial-size: 5          # 初始连接数
      max-active: 20           # 最大活跃连接数
      min-idle: 5              # 最小空闲连接数
      max-wait: 30000          # 获取连接最大等待时间（ms）
      validation-query: SELECT 1
      test-while-idle: true    # 空闲时检测连接有效性
      stat-view-servlet:
        enabled: true          # 启用监控页面
        url-pattern: /druid/*
        login-username: admin
        login-password: admin123
```

:::

## 三、MyBatis 配置与映射

### 1. 项目依赖与配置

::: details MyBatis + Spring Boot 配置

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>3.0.3</version>
</dependency>
```

```yaml
# application.yml
mybatis:
  mapper-locations: classpath:mapper/**/*.xml   # XML 映射文件路径
  type-aliases-package: com.example.entity      # 实体类包（可用简类名）
  configuration:
    map-underscore-to-camel-case: true          # 下划线 → 驼峰自动映射
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
```

:::

### 2. Mapper 接口与 XML

::: details Mapper 接口与 XML 映射示例

```java
// src/main/java/com/example/mapper/ProductMapper.java
@Mapper
public interface ProductMapper {
    Product selectById(Long id);
    List<Product> selectByCondition(ProductQuery query);
    int insert(Product product);
    int updateById(Product product);
    int deleteById(Long id);
}
```

```xml
<!-- src/main/resources/mapper/ProductMapper.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.example.mapper.ProductMapper">

    <!-- 结果映射（字段名与属性名不一致时使用）-->
    <resultMap id="ProductResultMap" type="Product">
        <id     column="id"           property="id"/>
        <result column="product_name" property="name"/>
        <result column="sale_price"   property="price"/>
        <result column="created_at"   property="createdAt"/>
    </resultMap>

    <!-- 查询单条 -->
    <select id="selectById" resultMap="ProductResultMap">
        SELECT id, product_name, sale_price, created_at
        FROM product
        WHERE id = #{id}
    </select>

    <!-- 插入并回填自增主键 -->
    <insert id="insert" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO product (product_name, sale_price, category, stock)
        VALUES (#{name}, #{price}, #{category}, #{stock})
    </insert>

    <!-- 更新 -->
    <update id="updateById">
        UPDATE product
        SET product_name = #{name},
            sale_price   = #{price},
            stock        = #{stock}
        WHERE id = #{id}
    </update>

    <!-- 删除 -->
    <delete id="deleteById">
        DELETE FROM product WHERE id = #{id}
    </delete>

</mapper>
```

:::

::: tip `#{}` vs `${}`
- `#{}` 使用预编译参数（PreparedStatement），安全，防注入，推荐使用
- `${}` 直接字符串替换，用于动态表名/列名等 SQL 结构，有注入风险，谨慎使用
:::

## 四、动态 SQL

### 1. if 与 where

`<where>` 标签自动处理多余的 `AND`/`OR` 前缀，配合 `<if>` 实现条件拼接。

::: details 动态查询条件示例

```xml
<select id="selectByCondition" resultMap="ProductResultMap">
    SELECT id, product_name, sale_price, category, stock
    FROM product
    <where>
        <if test="name != null and name != ''">
            AND product_name LIKE CONCAT('%', #{name}, '%')
        </if>
        <if test="category != null">
            AND category = #{category}
        </if>
        <if test="minPrice != null">
            AND sale_price >= #{minPrice}
        </if>
        <if test="maxPrice != null">
            AND sale_price &lt;= #{maxPrice}
        </if>
        <if test="inStock != null and inStock">
            AND stock > 0
        </if>
    </where>
    ORDER BY created_at DESC
    <if test="limit != null">
        LIMIT #{offset}, #{limit}
    </if>
</select>
```

:::

### 2. foreach

`<foreach>` 用于遍历集合，常用于 `IN` 查询和批量插入。

::: details foreach 示例

```xml
<!-- IN 查询 -->
<select id="selectByIds" resultMap="ProductResultMap">
    SELECT id, product_name, sale_price
    FROM product
    WHERE id IN
    <foreach collection="ids" item="id" open="(" separator="," close=")">
        #{id}
    </foreach>
</select>

<!-- 批量插入 -->
<insert id="batchInsert" useGeneratedKeys="true" keyProperty="id">
    INSERT INTO product (product_name, sale_price, category)
    VALUES
    <foreach collection="products" item="p" separator=",">
        (#{p.name}, #{p.price}, #{p.category})
    </foreach>
</insert>
```

:::

### 3. set 与 choose

::: details set 与 choose 示例

```xml
<!-- set：动态更新，自动去掉最后多余的逗号 -->
<update id="updateSelective">
    UPDATE product
    <set>
        <if test="name != null">product_name = #{name},</if>
        <if test="price != null">sale_price = #{price},</if>
        <if test="stock != null">stock = #{stock},</if>
    </set>
    WHERE id = #{id}
</update>

<!-- choose：类似 switch，只走第一个满足的 when -->
<select id="selectOrdered" resultMap="ProductResultMap">
    SELECT * FROM product
    ORDER BY
    <choose>
        <when test="orderBy == 'price'">sale_price</when>
        <when test="orderBy == 'name'">product_name</when>
        <otherwise>created_at</otherwise>
    </choose>
    <if test="orderDesc">DESC</if>
</select>
```

:::

## 五、MyBatis Plus 基础

MyBatis Plus（MP）是 MyBatis 的增强工具，无需编写 XML 即可完成单表 CRUD 操作。

### 1. 快速开始

::: details MyBatis Plus 配置与使用

```xml
<!-- pom.xml -->
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-boot-starter</artifactId>
    <version>3.5.5</version>
</dependency>
```

```java
// 实体类
@Data
@TableName("product")           // 对应数据库表名
public class Product {
    @TableId(type = IdType.AUTO) // 自增主键
    private Long id;

    @TableField("product_name")  // 字段映射（驼峰自动映射可省略）
    private String name;

    private Double price;
    private String category;
    private Integer stock;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableLogic                  // 逻辑删除字段
    private Integer deleted;
}

// Mapper 接口（无需 XML）
@Mapper
public interface ProductMapper extends BaseMapper<Product> {
    // 继承 BaseMapper 获得所有 CRUD 方法
    // 自定义复杂查询仍可在 XML 中编写
}

// Service 层使用
@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductMapper productMapper;

    public void demo() {
        // 插入
        Product p = new Product();
        p.setName("iPhone 15");
        p.setPrice(7999.0);
        productMapper.insert(p);

        // 按 ID 查询
        Product found = productMapper.selectById(1L);

        // 条件查询（LambdaQueryWrapper 避免硬编码字段名）
        LambdaQueryWrapper<Product> wrapper = new LambdaQueryWrapper<Product>()
            .eq(Product::getCategory, "electronics")
            .ge(Product::getPrice, 1000.0)
            .orderByDesc(Product::getCreatedAt)
            .last("LIMIT 10");

        List<Product> list = productMapper.selectList(wrapper);

        // 分页查询
        Page<Product> page = new Page<>(1, 20); // 第 1 页，每页 20 条
        Page<Product> result = productMapper.selectPage(page, wrapper);
        System.out.println("总记录数：" + result.getTotal());
        System.out.println("当前页数据：" + result.getRecords());

        // 条件更新
        LambdaUpdateWrapper<Product> updateWrapper = new LambdaUpdateWrapper<Product>()
            .eq(Product::getId, 1L)
            .set(Product::getPrice, 8999.0);
        productMapper.update(null, updateWrapper);

        // 逻辑删除（自动填充 deleted = 1）
        productMapper.deleteById(1L);
    }
}
```

:::

::: tip
MyBatis Plus 的 `LambdaQueryWrapper` 和 `LambdaUpdateWrapper` 使用方法引用代替字符串字段名，可以在重命名字段时由编译器检查，避免运行时错误。
:::
