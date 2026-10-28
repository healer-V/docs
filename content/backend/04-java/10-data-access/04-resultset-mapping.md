---
title: "ResultSet 类型映射"
tags: [Java, JDBC, 类型映射]
excerpt: "从游标位置与列标签出发，处理 SQL NULL、十进制金额和日期时间，验证订单快照的往返语义，并说明结果集关闭、大字段与有界读取的要求。"
date: 2026-09-10
---


# ResultSet 类型映射

`ResultSet` 保存查询结果的游标位置。读取列之前必须先调用 `next()` 并确认返回 `true`；读取结果时，还需要把数据库的空值、精度和时间语义映射为正确的 Java 类型。


## 一、游标与列标签

游标初始位于第一行之前。按唯一键查询也可能没有结果，不能跳过 `next()`；遍历多行则持续调用它直到返回 `false`。默认结果集通常只支持前向、只读访问，滚动和更新能力应显式请求并验证驱动支持。

业务查询优先列出需要的列，并使用稳定列标签。联合查询中的同名字段应给出明确别名，避免列顺序调整或 `SELECT *` 把表变化扩散到映射逻辑。

```sql
SELECT id, order_number, amount, created_at, reviewer_id
FROM orders
WHERE order_number = ?
```

该查询对应本例订单快照的五个字段，映射完成后不再依赖 `ResultSet`、语句或连接。


## 二、SQL NULL


### 1. 基本类型读取

`getLong` 无法返回 Java `null`。列为 SQL NULL 时，它返回 `0`，必须紧接着调用 `wasNull()` 判断刚读取的列是否为空。

```java
long reviewerValue = rows.getLong("reviewer_id");
Long reviewerId = rows.wasNull() ? null : reviewerValue;
```

如果中间又读取其他列，`wasNull()` 就对应新的读取结果。把它移到整行映射结束之后会悄悄改变含义，因此这两步应保持相邻。


### 2. 缺失与空字段

`getString`、`getBigDecimal` 等引用类型读取可以返回 `null`，但仍需根据列约束验证必要字段。支持的驱动也可用 `getObject(column, Long.class)` 获取可空包装类型，实际映射需针对目标驱动核对。

查询没有订单与订单存在但审核人为空是不同状态。前者可用返回值 `Optional<OrderRow>` 表示，后者属于快照字段语义，不应把数据库失败也混入“无记录”。

::: warning 零值不能代替缺失
金额为 0、审核人编号为 0、审核人未分配具有不同含义。是否允许编号为 0 由业务规则决定；驱动读取层不能在丢失空值后再猜测原始语义。
:::


## 三、金额与时间


### 1. 十进制精度

本例列为 `DECIMAL(19,2)`，使用 `BigDecimal` 读写，金额单位为元。示例值 `49.70` 对应领域示例中的 `4970` 分；转换时应显式处理单位和精度，不能直接交换两个数字。

数据库列的范围和小数位有限。过多小数位可能被拒绝或舍入，规则由数据库与字段契约共同决定。`BigDecimal.equals` 比较数值和 scale，测试是比较金额语义还是精确存储格式，应先明确。


### 2. 时间语义

| 数据语义 | 常用 Java 类型 | 判断重点 |
|----------|----------------|----------|
| 业务日期 | `LocalDate` | 没有时区和时间点含义 |
| 本地墙上时间 | `LocalDateTime` | 需要外部时区才能确定唯一时刻 |
| 带偏移的日期时间 | `OffsetDateTime` | 偏移和时刻均明确，但不包含完整地区规则 |
| 全球时间点 | `Instant` | 适合跨系统事件时间；直接 JDBC 映射需驱动支持 |

本例把 `OffsetDateTime` 写入 H2 的 `TIMESTAMP WITH TIME ZONE`，读取后比较 `toInstant()`，证明时刻一致。不能由此推断其他数据库会保留原偏移或支持相同 `getObject` 类型。


## 四、订单快照映射

以下方法来自 `src/main/java/order/persistence/JdbcOrders.java`。它只借用已经定位的当前行，不负责推进游标或关闭资源。

::: details 查看订单行映射方法

```java
/**
 * 把当前行映射为脱离 JDBC 生命周期的快照。
 * @param rows 已定位到有效行的结果集，由调用方关闭
 * @return 包含金额、创建时刻和可空审核人的订单快照
 * @throws SQLException 列、位置或类型不符合查询契约时抛出
 */
private static OrderRow map(ResultSet rows) throws SQLException {
    long reviewerValue = rows.getLong("reviewer_id");
    Long reviewerId = rows.wasNull() ? null : reviewerValue;
    return new OrderRow(rows.getLong("id"), rows.getString("order_number"),
            rows.getBigDecimal("amount"), rows.getObject("created_at", OffsetDateTime.class), reviewerId);
}
```

:::

`OrderRow` 是下方的 `order` 包中的 record。它声明普通 Java 字段，业务调用方无需知道游标或驱动类型。若状态存为文本，应按稳定业务编码解析，不能使用 `enum.ordinal()`；未知状态要按兼容策略保留或明确失败。


## 五、往返与失败验证

使用 JDK 21 与下方的 H2 2.4.240 工程，执行以下三项测试。建表与数据隔离由 `JdbcContractTest` 的生命周期方法完成：

先安装 JDK 21 和 Maven 3.9.11，在任意位置新建空目录作为本篇示例目录。按下方路径创建父目录和文件，编码使用 UTF-8；Maven 首次构建会下载声明的公开依赖。

将以下内容保存为 `pom.xml`：

::: details 查看 pom.xml 完整内容

```xml [pom.xml]
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>order</groupId>
    <artifactId>order-jdbc</artifactId>
    <version>1.0.0</version>
    <properties>
        <maven.compiler.release>21</maven.compiler.release>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>6.1.2</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <version>2.4.240</version>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-clean-plugin</artifactId>
                <version>3.4.1</version>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-resources-plugin</artifactId>
                <version>3.3.1</version>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.14.1</version>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.5.4</version>
                <configuration><failIfNoTests>true</failIfNoTests></configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-jar-plugin</artifactId>
                <version>3.4.2</version>
            </plugin>
        </plugins>
    </build>
</project>
```

:::

将以下内容保存为 `src/test/resources/schema.sql`：

```sql [src/test/resources/schema.sql]
CREATE TABLE orders (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    order_number VARCHAR(40) NOT NULL UNIQUE,
    amount DECIMAL(19, 2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reviewer_id BIGINT
);
```

将以下内容保存为 `src/main/java/order/OrderRow.java`：

::: details 查看 OrderRow.java 完整内容

```java [src/main/java/order/OrderRow.java]
package order;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * 保存脱离 JDBC 游标的订单快照。
 * @param id 数据库生成的正主键
 * @param orderNumber 唯一业务编号，非空
 * @param amount 金额，单位元，保留两位小数
 * @param createdAt 订单创建时间，包含 UTC 偏移
 * @param reviewerId 审核人编号，null 表示尚未分配
 */
public record OrderRow(long id, String orderNumber, BigDecimal amount,
                       OffsetDateTime createdAt, Long reviewerId) { }
```

:::

将以下内容保存为 `src/main/java/order/persistence/JdbcOrders.java`：

::: details 查看 JdbcOrders.java 完整内容

```java [src/main/java/order/persistence/JdbcOrders.java]
package order.persistence;

import order.OrderRow;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.time.OffsetDateTime;
import java.util.Objects;
import java.util.Optional;

/** 封装订单 SQL，借用连接的提交和关闭责任始终留给调用方。 */
public final class JdbcOrders {
    /** 禁止实例化无状态 SQL 工具。 */
    private JdbcOrders() { }

    /**
     * 在借用的连接中插入订单并读取生成键，不自行提交。
     * @param connection 当前有效连接，由调用方关闭
     * @param number 非空唯一订单编号，不超过 40 字符
     * @param amount 非负金额，单位元，数据库精度 DECIMAL(19,2)
     * @param createdAt 非空创建时间，包含偏移
     * @param reviewerId 可空审核人编号
     * @return 数据库返回的订单主键
     * @throws SQLException SQL、约束或生成键读取失败时抛出
     */
    public static long insert(Connection connection, String number, BigDecimal amount,
                              OffsetDateTime createdAt, Long reviewerId) throws SQLException {
        String sql = "INSERT INTO orders(order_number, amount, created_at, reviewer_id) VALUES (?, ?, ?, ?)";
        try (var statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            statement.setString(1, Objects.requireNonNull(number));
            statement.setBigDecimal(2, Objects.requireNonNull(amount));
            statement.setObject(3, Objects.requireNonNull(createdAt));
            if (reviewerId == null) {
                statement.setNull(4, Types.BIGINT);
            } else {
                statement.setLong(4, reviewerId);
            }
            if (statement.executeUpdate() != 1) {
                throw new SQLException("unexpected insert count");
            }
            try (var keys = statement.getGeneratedKeys()) {
                if (!keys.next()) {
                    throw new SQLException("missing generated key");
                }
                return keys.getLong(1);
            }
        }
    }

    /**
     * 绑定编号查询，完成映射后关闭语句和游标，不关闭借用连接。
     * @param connection 当前有效连接，不能被其他线程并发使用
     * @param number 非空查询值；即使含 SQL 符号也只作为参数
     * @return 找到的快照或正常缺失
     * @throws SQLException 查询或映射失败时抛出
     */
    public static Optional<OrderRow> find(Connection connection, String number) throws SQLException {
        String sql = "SELECT id, order_number, amount, created_at, reviewer_id FROM orders WHERE order_number = ?";
        try (var statement = connection.prepareStatement(sql)) {
            statement.setString(1, Objects.requireNonNull(number));
            statement.setQueryTimeout(2);
            try (var rows = statement.executeQuery()) {
                return rows.next() ? Optional.of(map(rows)) : Optional.empty();
            }
        }
    }

    /**
     * 映射已定位的当前行；wasNull 紧跟可空基本类型的读取。
     * @param rows 有效且已定位的结果集，由调用方关闭
     * @return 不持有 JDBC 资源的订单快照
     * @throws SQLException 列不存在、游标无效或类型不支持时抛出
     */
    private static OrderRow map(ResultSet rows) throws SQLException {
        long reviewerValue = rows.getLong("reviewer_id");
        Long reviewerId = rows.wasNull() ? null : reviewerValue;
        return new OrderRow(rows.getLong("id"), rows.getString("order_number"),
                rows.getBigDecimal("amount"), rows.getObject("created_at", OffsetDateTime.class), reviewerId);
    }
}
```

:::

将以下内容保存为 `src/test/java/order/persistence/JdbcContractTest.java`：

::: details 查看 JdbcContractTest.java 完整内容

```java [src/test/java/order/persistence/JdbcContractTest.java]
package order.persistence;

import static org.junit.jupiter.api.Assertions.*;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.h2.jdbcx.JdbcDataSource;
import org.h2.tools.RunScript;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

/** 用独立 H2 数据库验证 JDBC 契约，不声称覆盖其他数据库方言。 */
@Timeout(15)
class JdbcContractTest {
    private static final BigDecimal AMOUNT = new BigDecimal("49.70");
    private static final OffsetDateTime CREATED = OffsetDateTime.parse("2026-09-10T10:00:00+08:00");
    private JdbcDataSource dataSource;
    private Connection keeper;

    /** 保留一个连接使建表后的内存库持续存在；每次测试使用唯一名称。 */
    @BeforeEach
    void createDatabase() throws Exception {
        dataSource = new JdbcDataSource();
        dataSource.setURL("jdbc:h2:mem:orders_" + UUID.randomUUID());
        dataSource.setUser("sa");
        dataSource.setPassword("");
        keeper = dataSource.getConnection();
        try (var input = getClass().getResourceAsStream("/schema.sql")) {
            assertNotNull(input);
            try (var reader = new InputStreamReader(input, StandardCharsets.UTF_8)) {
                RunScript.execute(keeper, reader);
            }
        }
    }

    /** 释放最后一个测试连接，使内存库消失，不影响其他测试。 */
    @AfterEach
    void closeDatabase() throws Exception {
        if (keeper != null) {
            keeper.close();
        }
    }

    /** 生成键、金额、偏移时间和可空审核人经过真实数据库往返。 */
    @Test
    void generatedKeyAndMapping() throws Exception {
        try (var connection = dataSource.getConnection()) {
            long id = JdbcOrders.insert(connection, "ORD-1001", AMOUNT, CREATED, null);
            var row = JdbcOrders.find(connection, "ORD-1001").orElseThrow();
            assertTrue(id > 0);
            assertEquals(id, row.id());
            assertEquals(AMOUNT, row.amount());
            assertEquals(CREATED.toInstant(), row.createdAt().toInstant());
            assertNull(row.reviewerId());
            assertTrue(JdbcOrders.find(connection, "ORD-404").isEmpty());
        }
    }

    /** 基本类型的零值需要用 wasNull 区分 SQL NULL 与真实零。 */
    @Test
    void sqlNullIsNotZero() throws Exception {
        try (var connection = dataSource.getConnection()) {
            JdbcOrders.insert(connection, "ORD-1001", AMOUNT, CREATED, null);
            JdbcOrders.insert(connection, "ORD-1002", AMOUNT, CREATED, 0L);
            try (var statement = connection.createStatement();
                 var rows = statement.executeQuery("SELECT reviewer_id FROM orders ORDER BY order_number")) {
                assertTrue(rows.next());
                assertEquals(0, rows.getLong(1));
                assertTrue(rows.wasNull());
                assertTrue(rows.next());
                assertEquals(0, rows.getLong(1));
                assertFalse(rows.wasNull());
            }
        }
    }

    /** 游标未定位和资源关闭之后均不能读取列。 */
    @Test
    @SuppressWarnings("try") // 仅此故障测试需要提前关闭受管语句，验证游标失效。
    void cursorAndResourceBoundaries() throws Exception {
        try (var connection = dataSource.getConnection();
             var statement = connection.createStatement();
             var rows = statement.executeQuery("VALUES 1")) {
            assertThrows(SQLException.class,
                    /* next 之前的读取应失败。 */ () -> rows.getInt(1));
            assertTrue(rows.next());
            assertEquals(1, rows.getInt(1));
            statement.close();
            assertTrue(rows.isClosed());
            assertThrows(SQLException.class,
                    /* 上游语句关闭后，游标不再有效。 */ () -> rows.getInt(1));
        }
    }

    /**
     * 以固定金额和时间插入测试订单，不管理连接事务。
     * @param connection 由测试持有的有效连接
     * @param number 本次测试内的订单编号
     * @return 数据库生成的正主键
     * @throws SQLException SQL 或约束失败时抛出
     */
    private static long insert(Connection connection, String number) throws SQLException {
        return JdbcOrders.insert(connection, number, AMOUNT, CREATED, null);
    }
}
```

:::

```powershell

mvn -ntp -f pom.xml test "-Dtest=JdbcContractTest#generatedKeyAndMapping+sqlNullIsNotZero+cursorAndResourceBoundaries"
```

| 输入或操作 | 断言结果 |
|------------|----------|
| 金额 `49.70`，时间 `2026-09-10T10:00:00+08:00` | 金额保持预定精度，时间点一致 |
| 审核人分别为 NULL 和 0 | 两次 `getLong` 都为 0，但 `wasNull` 不同 |
| 未执行 `next` 就读取 | 抛出 `SQLException` |
| 关闭语句后继续读取 | 结果集失效，读取失败 |

报告应为 3 项通过。故障测试明确捕获非法读取，因此测试通过不表示关闭后的结果集仍可使用。

## 六、读取规模与资源

`setFetchSize` 是给驱动的提取提示，不是跨数据库通用的流式开关。是否采用游标、如何缓冲、自动提交是否影响行为，都需要结合驱动验证；同时还必须限制返回行数和连接持有时间。

CLOB、BLOB 及其流可能依赖当前连接，应在资源边界内消费并限制大小。普通列表只读取必要列，附件内容使用独立读取入口。SQL 执行、网络传输、对象映射与集合复制消耗不同资源，应分别观察，不能只看数据库执行时间。

## 七、参考资料

[ResultSet API](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/ResultSet.html)定义游标、类型读取和 `wasNull`；[H2 数据类型](https://h2database.com/html/datatypes.html)说明本例列语义。Java 时间模型见[日期时间](../04-core-apis/05-date-time.md)。
