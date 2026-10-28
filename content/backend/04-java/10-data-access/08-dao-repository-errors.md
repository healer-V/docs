---
title: "Repository 与异常转换"
tags: [Java, JDBC, Repository]
excerpt: "划分 DAO、Repository、行映射与事务边界，使用订单查询适配器隐藏 JDBC 资源，按 SQLState 提供稳定错误类别，并通过缺失与真实数据库故障验证根因保留。"
date: 2026-09-10
---


# Repository 与异常转换

Repository 用业务所需的查询和保存操作表达持久化能力，JDBC 实现负责连接、SQL 和结果映射。隐藏基础设施细节不等于隐藏失败：业务必须能够区分正常缺失与数据库访问异常。


## 一、职责划分

| 组件 | 主要职责 | 订单例子 |
|------|----------|----------|
| DAO | 封装贴近表和 SQL 的操作 | 执行参数化插入、读取指定列 |
| Repository | 提供业务需要的持久化接口 | 根据订单编号查找快照 |
| 行映射器 | 将当前行转换为对象 | 处理金额、时刻与可空审核人 |
| 事务协调器 | 管理多个操作共同提交或回滚 | 在同一连接编排相关写入 |

不是每个小工程都需要四个独立类。下方的 `JdbcOrders` 合并简单 SQL 与行映射，`JdbcOrderRepository` 管理独立查询的连接边界；当映射或事务协作复杂到需要独立维护时，再拆分职责。


## 二、业务接口与适配器


### 1. 明确查询语义

下方的 `order.OrderRepository` 只定义当前需要的订单查询。接口不暴露任意 SQL、列名、`ResultSet` 或 `Connection`，避免业务调用方承担数据库细节。

```java
/**
 * 查询已保存的订单，数据访问故障以异常表达。
 * @param orderNumber 非空业务编号
 * @return 订单快照，或表示正常缺失的空值
 */
Optional<OrderRow> findByNumber(String orderNumber);
```

`Optional.empty()` 表示查询成功但不存在该编号。连接不可用、权限不足或表缺失都不是正常缺失，不能在捕获异常后统一返回空值。


### 2. JDBC 实现

以下为 `src/main/java/order/persistence/JdbcOrderRepository.java` 的查询方法。`dataSource` 由构造器注入并校验非空，`JdbcOrders.find` 使用参数化查询并在内部映射结果。

::: details 查看订单查询适配器

```java
/**
 * 查询订单并转换基础设施错误，连接由本方法释放。
 * @param orderNumber 非空业务编号
 * @return 订单快照或正常缺失，失败时抛出 DataAccessFailure
 */
@Override
public Optional<OrderRow> findByNumber(String orderNumber) {
    try (var connection = dataSource.getConnection()) {
        return JdbcOrders.find(connection, orderNumber);
    } catch (SQLException failure) {
        throw new DataAccessFailure(failure);
    }
}
```

:::

该方法拥有查询连接，适合独立读取。需要多个 DAO 操作参与同一事务时，应由事务适配器共享连接，而不是连续调用多个各自获取连接的方法并假设它们能够一起回滚。


## 三、错误类别与根因


### 1. SQLState 分类

SQLState 前两位表示一类数据库错误，可以作为基础分类依据。应用只暴露确实需要区别处理的类别，具体处理仍要结合目标数据库。

| SQLState 类别 | 本例应用类别 | 不能直接推断的结论 |
|---------------|--------------|--------------------|
| `23` | `CONSTRAINT` | 不一定是订单编号重复，也可能是其他约束 |
| `08` | `UNAVAILABLE` | 不代表本次事务必然未提交或一定可重试 |
| 其他或空值 | `OTHER` | 需要继续读取原始错误与上下文 |

唯一约束、非空约束和外键都可能属于完整性约束类。只有识别真实约束并经过驱动测试，才可以把错误映射成“订单编号重复”这样的业务结论。


### 2. 保留异常链

下方的 `DataAccessFailure` 将原始 `SQLException` 保存为 cause，同时只提供稳定消息和错误类别。分类的局部代码如下，`cause` 是传入构造器的原始异常：

```java
String state = cause.getSQLState();
kind = state != null && state.startsWith("23") ? Kind.CONSTRAINT
        : state != null && state.startsWith("08") ? Kind.UNAVAILABLE : Kind.OTHER;
```

诊断仍可读取 cause 的 SQLState、供应商错误码、`getNextException()` 及 suppressed exceptions。不要依靠数据库错误消息的自然语言解析分类，消息可能随语言、版本与配置变化。

::: warning 内部原因与对外响应分开处理
保留 cause 是为了内部诊断，不意味着可以把堆栈、SQL、参数或服务器地址直接返回给请求方。接口层应映射为稳定错误码与安全说明。
:::


## 四、缺失与故障验证

下方的 H2 测试先对存在的空表查询 `ORD-404`，应返回正常缺失；随后关闭保活连接，让测试内存库结束，再通过 Repository 查询。此时新连接面对新数据库中的缺失表，必须抛出应用异常并保留 SQL 根因。

在本篇新建的示例目录使用 JDK 21 执行两项测试：

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

将以下内容保存为 `src/main/java/order/OrderRepository.java`：

::: details 查看 OrderRepository.java 完整内容

```java [src/main/java/order/OrderRepository.java]
package order;

import java.util.Optional;

/** 用业务编号表达读取需求，不向调用方暴露数据库连接。 */
public interface OrderRepository {
    /**
     * 查找已保存的订单；数据访问失败应抛出异常，不能冒充缺失。
     * @param orderNumber 要查询的业务编号，非空
     * @return 找到的订单快照，或表示正常缺失的空值
     */
    Optional<OrderRow> findByNumber(String orderNumber);
}
```

:::

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

将以下内容保存为 `src/main/java/order/persistence/DataAccessFailure.java`：

::: details 查看 DataAccessFailure.java 完整内容

```java [src/main/java/order/persistence/DataAccessFailure.java]
package order.persistence;

import java.sql.SQLException;

/** 保留 JDBC 根因，同时提供稳定的应用错误类别。 */
public final class DataAccessFailure extends RuntimeException {
    private static final long serialVersionUID = 1L;
    private final Kind kind;

    /** 只划分应用确实需要区别处理的类别，不推断错误可自动重试。 */
    public enum Kind { CONSTRAINT, UNAVAILABLE, OTHER }

    /**
     * 按 SQLState 类别保存诊断原因，不把数据库消息作为对外响应。
     * @param cause 非空 JDBC 原始异常；SQLState 可以为空
     */
    public DataAccessFailure(SQLException cause) {
        super("order lookup failed", cause);
        String state = cause.getSQLState();
        kind = state != null && state.startsWith("23") ? Kind.CONSTRAINT
                : state != null && state.startsWith("08") ? Kind.UNAVAILABLE : Kind.OTHER;
    }

    /** 返回应用错误类别；具体约束与重试策略仍需数据库证据。 */
    public Kind kind() {
        return kind;
    }
}
```

:::

将以下内容保存为 `src/main/java/order/persistence/JdbcOrderRepository.java`：

::: details 查看 JdbcOrderRepository.java 完整内容

```java [src/main/java/order/persistence/JdbcOrderRepository.java]
package order.persistence;

import order.OrderRepository;
import order.OrderRow;
import java.sql.SQLException;
import java.util.Objects;
import java.util.Optional;
import javax.sql.DataSource;

/** 将查询连接的所有权限制在适配器内，返回快照与应用异常。 */
public final class JdbcOrderRepository implements OrderRepository {
    private final DataSource dataSource;

    /**
     * 记录非空连接入口，不在构造时占用连接。
     * @param dataSource 应用创建并管理的连接工厂
     */
    public JdbcOrderRepository(DataSource dataSource) {
        this.dataSource = Objects.requireNonNull(dataSource);
    }

    /**
     * 查询订单并保留数据库错误；此独立查询自主管理连接。
     * @param orderNumber 非空业务编号
     * @return 订单快照或正常缺失，失败时抛出 DataAccessFailure
     */
    @Override
    public Optional<OrderRow> findByNumber(String orderNumber) {
        try (var connection = dataSource.getConnection()) {
            return JdbcOrders.find(connection, orderNumber);
        } catch (SQLException failure) {
            throw new DataAccessFailure(failure);
        }
    }
}
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

    /** Repository 正常缺失与数据库故障必须走不同结果通道。 */
    @Test
    void repositoryDoesNotHideFailure() throws Exception {
        var repository = new JdbcOrderRepository(dataSource);
        assertTrue(repository.findByNumber("ORD-404").isEmpty());
        keeper.close();
        var failure = assertThrows(DataAccessFailure.class,
                /* 最后连接关闭后旧表消失，不能把 SQL 失败转换为空值。 */
                () -> repository.findByNumber("ORD-404"));
        assertEquals(DataAccessFailure.Kind.OTHER, failure.kind());
        assertInstanceOf(SQLException.class, failure.getCause());
    }

    /** SQLState 23 是约束类别，不足以单独认定为订单编号重复。 */
    @Test
    void constraintTranslationKeepsCause() throws Exception {
        try (var connection = dataSource.getConnection()) {
            insert(connection, "ORD-1001");
            var cause = assertThrows(SQLException.class,
                    /* 使用真实唯一约束错误核验分类与 cause。 */
                    () -> insert(connection, "ORD-1001"));
            var failure = new DataAccessFailure(cause);
            assertEquals(DataAccessFailure.Kind.CONSTRAINT, failure.kind());
            assertSame(cause, failure.getCause());
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

mvn -ntp -f pom.xml test "-Dtest=JdbcContractTest#repositoryDoesNotHideFailure+constraintTranslationKeepsCause"
```

| 场景 | 预期结果 |
|------|----------|
| 表存在但无订单 | `Optional.empty()` |
| 表不存在导致 SQL 失败 | `DataAccessFailure`，cause 为 `SQLException` |
| 重复插入唯一编号 | SQLState `23505`，转换为 `CONSTRAINT`，同一 cause 被保留 |

报告应为 2 项通过。测试以真实 SQL 错误验证边界，未覆盖其他数据库的供应商子码和约束元数据。


## 五、事务与映射约束

数据库对象进入领域边界前需要满足业务不变量。历史数据中的未知状态、非法金额或缺少必要字段，应按明确兼容策略处理，不能悄悄构造非法领域对象。

映射器只借用当前结果行，不能关闭外层连接；Repository 不返回依赖已关闭资源的懒加载对象。显式的连接所有权也有助于看清异步边界：线程切换不会自动携带原 JDBC 事务。

上层业务可以用 Fake Repository 验证业务决策，数据库实现则需要真实 SQL 测试。Mock 只能证明调用形状，不能证明表结构、查询和事务在数据库中成立。

## 六、参考资料

- [SQLException API](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/SQLException.html)
- [H2 错误码](https://h2database.com/javadoc/org/h2/api/ErrorCode.html)

以上资料说明本例数据库的错误分类。
