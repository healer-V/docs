---
title: "DataSource 与连接生命周期"
tags: [Java, JDBC, DataSource]
excerpt: "区分连接工厂、物理连接和池化借用，明确语句、游标与事务的资源所有权，通过资源失效和连接池状态恢复测试解释关闭、归还、提交及线程边界。"
date: 2026-09-10
---


# DataSource 与连接生命周期

`DataSource` 是标准连接获取接口。直接连接工厂可以每次建立连接，连接池实现则可以返回已有物理连接的代理；应用调用 `close()` 的含义由具体实现决定，但调用方结束使用时都必须释放借到的资源。


## 一、连接工厂与连接池

应用在启动阶段创建并配置 `DataSource`，业务请求按工作单元获取 `Connection`。前者通常长期存在，后者应保持明确且尽量短的使用范围。

| 对象 | 生命周期 | 关闭责任 |
|------|----------|----------|
| 普通连接工厂 | 应用或测试环境 | 标准 `DataSource` 无统一关闭方法 |
| HikariCP 连接池 | 应用启动至停止 | 创建池的应用负责关闭池 |
| 借用的 `Connection` | 一次查询或一个事务 | 获取连接的边界负责归还 |
| `PreparedStatement` | 一次 SQL 工作或受控复用 | 创建语句的组件负责关闭 |
| `ResultSet` | 当前结果读取过程 | 遍历并映射结果的组件负责关闭 |

每次请求新建连接池会反复创建线程和连接，失去复用意义。全局保存一个连接也不合适：多请求会争用同一会话状态、事务与游标。


## 二、资源所有权

### 1. 自主管理连接

独立查询自己获取连接，就负责关闭连接、语句和结果集。需要返回订单时，应先在资源边界内完成映射，再返回已经脱离数据库资源的 `OrderRow`。

下面是读取一个数值的局部测试片段。`dataSource` 是下方完整测试中的 H2 连接工厂，`assertEquals` 来自 JUnit；这里省略测试方法与类声明：

```java
try (var connection = dataSource.getConnection();
     var statement = connection.prepareStatement("VALUES 1");
     var rows = statement.executeQuery()) {
    rows.next();
    assertEquals(1, rows.getInt(1));
}
```

`JdbcOrders.find` 只关闭自己创建的语句和结果集。这使它既可用于独立查询，也能在外部事务中借用同一连接。


### 2. 借用事务连接

事务协调器获取连接后，应把它传给需要共同提交的 SQL 操作。被调用方法不得关闭该连接、擅自提交或把自动提交切回 `true`，否则会破坏外层事务边界。

try-with-resources 按声明逆序关闭资源：先结果集，再语句，最后连接。主逻辑与关闭都失败时，关闭失败作为 suppressed exception 保留，诊断时需要一并检查。

::: warning 关闭不等于提交
关闭一个尚未明确提交或回滚的事务连接，其结果取决于实现契约。应用必须显式结束事务；连接池的清理与重置只能作为兜底，不能代替成功提交的证据。
:::


## 三、游标依赖与失效

关闭语句会关闭其结果集，重新执行语句也可能使当前结果失效。普通 Repository 不应把 `ResultSet` 返回给业务层，否则调用方既要理解游标，又要承担连接关闭责任。

下面是本例资源测试的核心过程，`connection` 已由外层 try-with-resources 管理，测试中的提前关闭是故意触发的失效场景：

```java
var statement = connection.createStatement();
var rows = statement.executeQuery("VALUES 1");
rows.next();
statement.close();
// 此时 rows.isClosed() 为 true，再读取列应抛出 SQLException。
```

流式读取大字段是特殊情况：流也可能依赖语句和连接，必须把关闭责任作为 API 契约暴露，并限制消费时间与数据量。一般列表查询优先在边界内完成有界映射。


## 四、连接状态与线程边界

自动提交、隔离级别、只读提示和部分会话设置都属于连接状态。连接归还给池后，下一个借用者不应继承上一次请求未完成的事务或意外配置。

一个 JDBC 工作单元应独占连接。把同一连接同时交给多个线程，即使驱动同步了某些方法，也无法自动建立正确的业务事务顺序。提交异步任务也不会自动传递原事务连接。

虚拟线程降低等待时的线程占用成本，但不会增加数据库会话容量。是否采用连接池仍由数据库资源、借还和超时管理决定，不能根据 Java 线程数量直接扩池。

## 五、借还与状态恢复验证

使用 JDK 21，本篇示例固定 H2 2.4.240、HikariCP 7.0.2。以下命令在本篇新建的示例目录，只运行与资源边界有关的三项测试：

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
        <dependency>
            <groupId>com.zaxxer</groupId>
            <artifactId>HikariCP</artifactId>
            <version>7.0.2</version>
        </dependency>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-simple</artifactId>
            <version>2.0.18</version>
            <scope>runtime</scope>
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
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.SQLTransientConnectionException;
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

    /** 用一条池连接制造有界等待，归还后相同池恢复可用。 */
    @Test
    void poolWaitTimesOutAndRecovers() throws Exception {
        try (var pool = pool()) {
            try (var held = pool.getConnection()) {
                assertTrue(held.isValid(1));
                assertEquals(1, pool.getHikariPoolMXBean().getActiveConnections());
                assertThrows(SQLTransientConnectionException.class,
                        /* 唯一连接被持有时第二次借用必须超时。 */ pool::getConnection);
            }
            assertEquals(0, pool.getHikariPoolMXBean().getActiveConnections());
            try (var recovered = pool.getConnection()) {
                assertTrue(recovered.isValid(1));
            }
        }
    }

    /** 池归还时的状态重置是兜底，不替代应用明确的提交和回滚。 */
    @Test
    void poolResetsUnfinishedTransaction() throws Exception {
        try (var pool = pool()) {
            try (var borrowed = pool.getConnection()) {
                borrowed.setAutoCommit(false);
                insert(borrowed, "ORD-1001");
                // 故意遗漏 commit/rollback，以验证 HikariCP 归还行为。
            }
            try (var next = pool.getConnection()) {
                assertTrue(next.getAutoCommit());
                assertTrue(JdbcOrders.find(next, "ORD-1001").isEmpty());
            }
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

    /** 创建仅一条连接的测试池；调用方必须关闭，超时单位为毫秒。 */
    private HikariDataSource pool() {
        var config = new HikariConfig();
        config.setDataSource(dataSource);
        config.setPoolName("order-contract");
        config.setMaximumPoolSize(1);
        config.setMinimumIdle(1);
        config.setConnectionTimeout(350);
        config.setValidationTimeout(250);
        return new HikariDataSource(config);
    }
}
```

:::

```powershell

mvn -ntp -f pom.xml test "-Dtest=JdbcContractTest#cursorAndResourceBoundaries+poolWaitTimesOutAndRecovers+poolResetsUnfinishedTransaction"
```

| 测试动作 | 预期观察 | 说明 |
|----------|----------|------|
| 提前关闭语句后读取结果 | `SQLException`，结果集已关闭 | 返回游标不能脱离上游资源 |
| 持有唯一池连接后再次借用 | 等待后超时；归还后可重新获取 | 逻辑关闭归还池容量 |
| 未提交写入后归还连接 | 下次借用自动提交恢复，记录不存在 | 当前池实现回滚并重置状态 |

测试报告应为 3 项通过，失败行为由断言捕获。第三项只证明本例 HikariCP 与 H2 的组合行为，不代替其他池实现或数据库的验证。

::: tip 泄漏与慢查询需要区分
活动连接长期占满既可能是遗漏关闭，也可能是 SQL、锁或网络导致持有时间过长。结合等待数、持有栈和数据库会话判断，再决定修复资源边界还是处理慢操作。
:::

## 六、参考资料

[DataSource](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/javax/sql/DataSource.html)、[Connection](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Connection.html)与[HikariCP 配置](https://github.com/brettwooldridge/HikariCP)定义连接入口、会话状态和池化行为。完整事务处理见[JDBC 事务与隔离](./05-transactions-isolation.md)。
