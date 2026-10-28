---
title: "JDBC 批处理与生成键"
tags: [Java, JDBC, 批处理]
excerpt: "说明批次参数、更新计数与事务的关系，通过真实成功和失败批次验证回滚及生成键读取，明确驱动差异、批次上限与幂等恢复的边界。"
date: 2026-09-10
---


# JDBC 批处理与生成键

JDBC 批处理将多组同类 SQL 操作交给驱动执行，减少应用调用和潜在协议往返。它与事务是两种机制：批次决定如何组织执行，事务决定哪些结果共同提交或回滚。


## 一、批次执行模型

对同一个 `PreparedStatement`，逐组绑定参数并调用 `addBatch()`，最后调用 `executeBatch()`。复用语句时每次都要绑定完整参数，避免遗漏参数沿用旧值；丢弃待执行批次可用 `clearBatch()`。

批次大小应有明确上限。一次缓存百万条输入会放大应用内存、驱动缓冲和失败重做成本，即使最终只调用一次 `executeBatch()`，数据库仍需完成约束、索引和日志工作。

::: tip 分批不等于分事务
多个有界批次可以位于同一事务中，也可以按业务允许的检查点分别提交。前者仍需考虑长事务成本，后者则必须允许部分完成并设计恢复入口。
:::


## 二、更新计数

| 返回值 | 含义 | 处理边界 |
|--------|------|----------|
| 非负数 | 对应命令的影响行数 | `0` 可能意味着条件未匹配 |
| `SUCCESS_NO_INFO`（-2） | 成功但没有精确影响数 | 不能推断恰好修改一行 |
| `EXECUTE_FAILED`（-3） | 该命令执行失败 | 结合异常和数据库状态判断 |

`BatchUpdateException.getUpdateCounts()` 可能包含失败前已执行的命令，也可能包含驱动继续处理后的更多结果。驱动是否继续执行、返回数组长度及特殊值都可能不同，不能仅用数组长度推断整个批次已经提交。

涉及版本条件的批量更新，需要把计数与业务键关联。零行更新可能是并发冲突；成功但计数未知时，也不能假装已经验证了“每条恰好更新一行”。


## 三、批量插入验证


### 1. 受控事务

下方的 H2 2.4.240 测试向订单表插入两条数据，使用唯一业务编号和数据库生成主键。以下代码是 `JdbcContractTest#batchCountsAndKeys` 的执行核心，连接与语句在外层 try-with-resources 中创建。

```java
connection.setAutoCommit(false);
statement.setString(1, "ORD-1001");
statement.addBatch();
statement.setString(1, "ORD-1002");
statement.addBatch();
assertArrayEquals(new int[]{1, 1}, statement.executeBatch());
```

语句使用受控的固定金额与数据库时间，便于把观察重点放在批次结果上：

```sql
INSERT INTO orders(order_number, amount, created_at)
VALUES (?, 49.70, CURRENT_TIMESTAMP)
```

测试读取生成键后提交，再用新连接确认订单数为 2。这里的 `[1, 1]` 是固定驱动组合的实测结果，不是所有数据库必须返回的计数形态。


### 2. 部分失败回滚

失败测试将同一个订单编号加入两次，第二次触发唯一约束。关键代码如下，`statement` 使用同一插入 SQL，`connection` 已关闭自动提交：

```java
statement.setString(1, "ORD-1001");
statement.addBatch();
statement.addBatch();
var failure = assertThrows(BatchUpdateException.class,
        /* 唯一键重复应使该批次失败。 */ statement::executeBatch);
assertEquals("23505", failure.getSQLState());
connection.rollback();
```

随后通过新连接断言总数为 0，证明没有留下部分提交。正常应用由事务边界统一处理异常和回滚；测试中的 `assertThrows` 只负责验证行为。


## 四、生成键


### 1. 请求与读取

创建语句时指定 `Statement.RETURN_GENERATED_KEYS`，执行后再读取 `getGeneratedKeys()`。部分数据库也支持按列名请求，具体返回列和支持程度应针对驱动验证。

以下是本例单行插入方法中的局部代码，语句已完成参数绑定，调用方管理事务：

```java
if (statement.executeUpdate() != 1) {
    throw new SQLException("unexpected insert count");
}
try (var keys = statement.getGeneratedKeys()) {
    if (!keys.next()) {
        throw new SQLException("missing generated key");
    }
    return keys.getLong(1);
}
```

生成键结果集也需要关闭。返回的主键只能说明本次执行分配了标识，不能单独证明事务已经提交。


### 2. 业务键与关联

批次返回多少生成键、是否包含每条输入以及顺序是否稳定，都可能受驱动和批次重写配置影响。下方完整测试不依赖数组位置，而是根据订单编号查询记录，确认其主键存在于返回键集合中。

数据库代理主键与业务幂等键作用不同。订单编号的唯一约束用于识别同一业务操作，重试不能依赖“上一次返回数组中的第几项”。

::: warning 提交未知时不能直接重发
连接中断可能发生在提交已完成但响应未返回之后。应先根据稳定业务键查询状态，并结合幂等规则恢复；重新发送整个未知结果批次可能重复写入。
:::


## 五、执行与容量边界

在本篇新建的示例目录中使用 JDK 21 运行两项测试，完整源码、建表文件和依赖在下方给出：

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
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.Objects;
import java.util.Optional;

/** 封装订单 SQL，借用连接的提交和关闭责任始终留给调用方。 */
public final class JdbcOrders {
    /** 禁止实例化无状态 SQL 工具。 */
    private JdbcOrders() { }

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
import java.nio.charset.StandardCharsets;
import java.sql.BatchUpdateException;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
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

    /** 批次计数与生成键同时验证；不假定其他驱动返回相同顺序。 */
    @Test
    void batchCountsAndKeys() throws Exception {
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "INSERT INTO orders(order_number, amount, created_at) VALUES (?, 49.70, CURRENT_TIMESTAMP)",
                     Statement.RETURN_GENERATED_KEYS)) {
            connection.setAutoCommit(false);
            statement.setString(1, "ORD-1001");
            statement.addBatch();
            statement.setString(1, "ORD-1002");
            statement.addBatch();
            assertArrayEquals(new int[]{1, 1}, statement.executeBatch());
            List<Long> keys = new ArrayList<>();
            try (var rows = statement.getGeneratedKeys()) {
                while (rows.next()) {
                    keys.add(rows.getLong(1));
                }
            }
            assertEquals(2, keys.size());
            assertTrue(keys.contains(JdbcOrders.find(connection, "ORD-1001").orElseThrow().id()));
            assertTrue(keys.contains(JdbcOrders.find(connection, "ORD-1002").orElseThrow().id()));
            connection.commit();
        }
        assertEquals(2, count());
    }

    /** 批次部分执行后统一回滚，通过新连接确认没有部分提交。 */
    @Test
    void failedBatchRollsBack() throws Exception {
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "INSERT INTO orders(order_number, amount, created_at) VALUES (?, 49.70, CURRENT_TIMESTAMP)")) {
            connection.setAutoCommit(false);
            statement.setString(1, "ORD-1001");
            statement.addBatch();
            statement.addBatch();
            var failure = assertThrows(BatchUpdateException.class,
                    /* 同一业务键出现两次，触发真实批次约束错误。 */ statement::executeBatch);
            assertEquals("23505", failure.getSQLState());
            assertTrue(failure.getUpdateCounts().length > 0);
            connection.rollback();
        }
        assertEquals(0, count());
    }

    /** 从新连接读取已提交订单数，用于验证跨连接可见性。 */
    private int count() throws SQLException {
        try (var connection = dataSource.getConnection(); var statement = connection.createStatement();
             var rows = statement.executeQuery("SELECT COUNT(*) FROM orders")) {
            assertTrue(rows.next());
            return rows.getInt(1);
        }
    }
}
```

:::

```powershell

mvn -ntp -f pom.xml test "-Dtest=JdbcContractTest#batchCountsAndKeys+failedBatchRollsBack"
```

预期 2 项通过：成功批次返回两条成功计数及两个可关联主键，失败批次产生 `BatchUpdateException` 并在回滚后留下零条订单。

该测试没有证明某个批次大小性能最优，也没有测量网络往返。真实吞吐需要在目标数据库与代表性数据上比较调用次数、延迟、内存、锁持有时间及失败重做成本；启用驱动批次重写后还要重新验证计数与生成键契约。

## 六、参考资料

- [Statement 批处理](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Statement.html)
- [BatchUpdateException](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/BatchUpdateException.html)
- [H2 JDBC 能力](https://h2database.com/html/features.html)

以上资料说明计数、失败和数据库差异。
