---
title: "JDBC 事务与隔离"
tags: [Java, JDBC, 事务]
excerpt: "以同一连接为事务边界，解释自动提交、提交、回滚、保存点和隔离级别，通过新连接观察成功与失败结果，并处理提交未知、回滚失败及连接状态恢复。"
date: 2026-09-10
---


# JDBC 事务与隔离

JDBC 本地事务由 `Connection` 管理。需要共同成功的多条 SQL 必须在同一连接上执行；关闭自动提交后，由应用在成功时提交、失败时回滚。


## 一、连接与事务边界

新连接通常开启自动提交，但连接池可以配置不同默认值。自动提交模式下，语句完成会触发该语句事务的提交；有结果集的语句还要注意“完成”与结果读取的关系，不能简单理解为每次方法返回就结束所有数据库工作。

需要写入订单与关联记录时，应先关闭自动提交，再在该连接上执行全部操作。另一次 `DataSource.getConnection()` 得到的是另一个会话，不能因为调用来自同一个 Java 方法就视为同一事务。

```java
connection.setAutoCommit(false);
```

事务不自动覆盖文件、HTTP 或消息发送。数据库回滚无法撤回已发出的外部请求，这类一致性需要额外的业务状态、幂等或消息设计。


## 二、提交与回滚


### 1. 事务执行器

下方的 `JdbcTransactions` 为每个工作单元获取连接，成功提交后才返回结果。下面是 `src/main/java/order/persistence/JdbcTransactions.java` 中的执行方法，省略构造器与接口声明。

::: details 查看事务执行方法

```java
/**
 * 执行同一连接中的工作，提交后返回结果。
 * @param work 非空工作单元，不得关闭连接或改变事务所有权
 * @param <T> 工作结果类型
 * @return 已成功提交的工作结果
 * @throws SQLException 获取、执行、提交或关闭失败时抛出
 */
public <T> T execute(Work<T> work) throws SQLException {
    Objects.requireNonNull(work);
    try (Connection connection = dataSource.getConnection()) {
        connection.setAutoCommit(false);
        try {
            T result = work.execute(connection);
            connection.commit();
            return result;
        } catch (SQLException | RuntimeException | Error failure) {
            rollbackPreserving(connection, failure);
            throw failure;
        }
    }
}
```

:::

`Work<T>` 的 `execute(Connection)` 只借用连接，可以抛出 `SQLException`。`rollbackPreserving` 在回滚也失败时，把回滚错误加入原异常的 suppressed 列表；外层 try-with-resources 继续管理关闭异常。


### 2. 异常与结果未知

SQL、参数映射和业务判断都可能抛出异常，因此不能只对 `SQLException` 回滚。代码也对 `Error` 尽力回滚后继续抛出，但进程崩溃、强制终止或资源耗尽时不保证清理能够执行。

提交调用失败不一定代表数据库没有提交：连接可能在提交完成后、响应返回前中断。成功提交后的连接关闭失败也可能让调用方收到异常，但数据库记录已经存在。

::: warning 不把异常等同于未提交
重试之前需要根据业务唯一键和数据库状态判断结果，不能盲目重新执行扣款或订单写入。回滚尝试不会撤销数据库已经完成的提交。
:::


## 三、隔离级别


### 1. JDBC 声明

隔离级别限制并发事务可观察的现象，通常应在事务开始前设置。`DatabaseMetaData.supportsTransactionIsolationLevel` 可以查询声明能力，但真实冲突行为仍需执行验证。

| 级别 | 基本目标 | 仍需判断 |
|------|----------|----------|
| `READ_UNCOMMITTED` | 允许较弱读取隔离 | 数据库是否实际允许脏读 |
| `READ_COMMITTED` | 不读取其他事务未提交的数据 | 语句间读取是否变化 |
| `REPEATABLE_READ` | 对重复读取提供更强约束 | 范围查询、快照与写冲突语义 |
| `SERIALIZABLE` | 按串行执行目标约束并发结果 | 实现限制、冲突失败与重试契约 |

级别名称不能替代数据库文档。同一名称在不同实现中的锁、快照与冲突检测方式可能不同，不能直接推断所有业务不变量都得到保护。

### 2. H2 读取验证

下方完整测试使用两个连接，读取方设置 `READ_COMMITTED` 并关闭自动提交。写入方插入订单但未提交时，读取方查不到；写入方提交后，读取方的新查询可以看到订单。

这个顺序不依赖 `sleep`：两个连接的调用由测试显式编排。它证明 H2 2.4.240 在该场景下的可见性，未验证其他级别、写偏差或其他数据库实现。


## 四、保存点

保存点允许回滚当前事务中某个位置之后的操作，不建立独立提交边界。下方完整测试中的关键步骤如下，`insert` 使用借用连接插入固定订单数据：

```java
connection.setAutoCommit(false);
insert(connection, "ORD-1001");
var savepoint = connection.setSavepoint("before_optional_order");
insert(connection, "ORD-1002");
connection.rollback(savepoint);
connection.commit();
```

提交后只有 `ORD-1001` 可见。若最终回滚整个事务，保存点之前尚未提交的订单也不会留下；保存点不能实现独立于外层事务的“内层成功”。

真实数据库错误可能改变事务的可继续状态。捕获异常后是否能回到保存点继续，需要目标数据库证据，也需要业务明确允许部分步骤被放弃。

## 五、事务结果验证

使用 JDK 21，本篇给出了建表、唯一约束、测试数据和事务实现。以下命令运行六项事务测试：

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

将以下内容保存为 `src/main/java/order/persistence/JdbcTransactions.java`：

::: details 查看 JdbcTransactions.java 完整内容

```java [src/main/java/order/persistence/JdbcTransactions.java]
package order.persistence;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Objects;
import javax.sql.DataSource;

/** 在单一连接上执行本地事务，保留业务、回滚和关闭异常。 */
public final class JdbcTransactions {
    private final DataSource dataSource;

    /**
     * 记录连接入口，连接仍按每次工作单元获取。
     * @param dataSource 非空连接工厂或连接池
     */
    public JdbcTransactions(DataSource dataSource) {
        this.dataSource = Objects.requireNonNull(dataSource);
    }

    /** 定义只借用事务连接的工作单元。 */
    @FunctionalInterface
    public interface Work<T> {
        /**
         * 执行一个本地数据库工作单元。
         * @param connection 事务执行器管理的连接，不得关闭或切换自动提交
         * @return 交给调用方的结果，只有提交成功后才会返回
         * @throws SQLException 数据库操作失败时抛出
         */
        T execute(Connection connection) throws SQLException;
    }

    /**
     * 成功提交后返回结果；失败时尽力回滚并保持最初的异常。
     * @param work 非空工作单元，不得在内部转移连接所有权
     * @param <T> 工作单元结果类型
     * @return 已成功提交的工作结果
     * @throws SQLException 获取连接、执行 SQL、提交或关闭失败时抛出
     */
    public <T> T execute(Work<T> work) throws SQLException {
        Objects.requireNonNull(work);
        try (Connection connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);
            try {
                T result = work.execute(connection);
                connection.commit();
                return result;
            } catch (SQLException | RuntimeException | Error failure) {
                rollbackPreserving(connection, failure);
                throw failure;
            }
        }
    }

    /**
     * 回滚失败不能覆盖触发回滚的原始异常；严重进程故障不保证此方法运行。
     * @param connection 需要回滚的非空连接
     * @param failure 要保留的原始异常，非空
     * 回滚失败被附加为 suppressed exception，无返回值。
     */
    static void rollbackPreserving(Connection connection, Throwable failure) {
        try {
            connection.rollback();
        } catch (SQLException rollbackFailure) {
            failure.addSuppressed(rollbackFailure);
        }
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

    /** 提交结果必须从新连接可见，不能仅检查事务内的读取。 */
    @Test
    void commitIsVisibleFromAnotherConnection() throws Exception {
        var transactions = new JdbcTransactions(dataSource);
        transactions.execute(/* 在执行器提供的同一事务连接中写入。 */ connection -> {
            insert(connection, "ORD-1001");
            return null;
        });
        try (var observer = dataSource.getConnection()) {
            assertTrue(JdbcOrders.find(observer, "ORD-1001").isPresent());
        }
    }

    /** 第二次写入违反唯一约束时，第一次写入也必须回滚。 */
    @Test
    void constraintFailureRollsBack() throws Exception {
        var transactions = new JdbcTransactions(dataSource);
        var failure = assertThrows(SQLException.class,
                /* 用真实唯一约束失败触发事务执行器的回滚分支。 */
                () -> transactions.execute(/* 两次写入必须使用同一连接。 */ connection -> {
                    insert(connection, "ORD-1001");
                    insert(connection, "ORD-1001");
                    return null;
                }));
        assertEquals("23505", failure.getSQLState());
        assertEquals(0, count());
    }

    /** SQL 之后的业务异常同样回滚，并保留异常对象。 */
    @Test
    void runtimeFailureRollsBack() throws Exception {
        var original = new IllegalStateException("payment rejected");
        var failure = assertThrows(IllegalStateException.class,
                /* 在首条 SQL 完成后模拟业务失败。 */
                () -> new JdbcTransactions(dataSource).execute(/* 不执行外部副作用。 */ connection -> {
                    insert(connection, "ORD-1001");
                    throw original;
                }));
        assertSame(original, failure);
        assertEquals(0, count());
    }

    /** 回滚失败应附加到主异常，不能使最初原因丢失。 */
    @Test
    void rollbackFailureIsSuppressed() throws Exception {
        var original = new SQLException("primary failure");
        var connection = dataSource.getConnection();
        connection.close();
        JdbcTransactions.rollbackPreserving(connection, original);
        assertEquals(1, original.getSuppressed().length);
        assertInstanceOf(SQLException.class, original.getSuppressed()[0]);
    }

    /** 保存点只撤销其后的写入，最终结果仍受外层提交控制。 */
    @Test
    void savepointKeepsEarlierWrite() throws Exception {
        try (var connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);
            insert(connection, "ORD-1001");
            var savepoint = connection.setSavepoint("before_optional_order");
            insert(connection, "ORD-1002");
            connection.rollback(savepoint);
            connection.commit();
        }
        assertEquals(1, count());
        try (var observer = dataSource.getConnection()) {
            assertTrue(JdbcOrders.find(observer, "ORD-1002").isEmpty());
        }
    }

    /** 只记录 H2 READ_COMMITTED 的实测读取行为，不外推到其他数据库。 */
    @Test
    void readCommittedHidesUncommittedWrite() throws Exception {
        try (var writer = dataSource.getConnection(); var reader = dataSource.getConnection()) {
            writer.setAutoCommit(false);
            reader.setTransactionIsolation(Connection.TRANSACTION_READ_COMMITTED);
            reader.setAutoCommit(false);
            insert(writer, "ORD-1001");
            assertTrue(JdbcOrders.find(reader, "ORD-1001").isEmpty());
            writer.commit();
            assertTrue(JdbcOrders.find(reader, "ORD-1001").isPresent());
            reader.rollback();
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

mvn -ntp -f pom.xml test "-Dtest=JdbcContractTest#commitIsVisibleFromAnotherConnection+constraintFailureRollsBack+runtimeFailureRollsBack+rollbackFailureIsSuppressed+savepointKeepsEarlierWrite+readCommittedHidesUncommittedWrite"
```

| 场景 | 新连接或异常中的证据 |
|------|----------------------|
| 正常提交 | 订单存在 |
| 第二次插入触发唯一约束 | SQLState 为 `23505`，订单总数为 0 |
| 首次插入后业务异常 | 原异常保留，订单总数为 0 |
| 对已关闭连接尝试回滚 | 回滚异常附加到原异常 |
| 回滚保存点后提交 | 第一条存在，第二条不存在 |
| READ_COMMITTED 双连接读取 | 提交前不可见，提交后新查询可见 |

报告应为 6 项通过。仅在同一事务连接内读取到数据，不能证明提交成功；用新连接观察是区分暂存变化与已提交结果的关键。


## 六、事务容量与状态

事务中只保留必须原子完成的数据库工作。输入转换、独立校验及外部等待尽量放到事务外，避免长时间占用连接、锁与版本资源。

JDBC 没有统一的完整事务超时接口。连接池等待、语句超时、驱动网络等待与请求总预算需要分别限制；`setReadOnly(true)` 是连接提示，也不能代替权限控制。

归还连接前必须明确提交或回滚。切换自动提交、隔离级别及只读状态还要遵守驱动和连接池契约；不要在异常清理中随手 `setAutoCommit(true)`，因为状态切换本身可能触发提交。

## 七、参考资料

- [Connection 事务 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Connection.html)
- [Savepoint](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Savepoint.html)
- [H2 隔离说明](https://h2database.com/html/advanced.html#transaction_isolation)

以上资料分别定义调用契约与本例实现边界。
