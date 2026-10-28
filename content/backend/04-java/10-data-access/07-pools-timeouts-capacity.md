---
title: "连接池与超时预算"
tags: [Java, JDBC, HikariCP]
excerpt: "解释连接池借还、容量和状态恢复，区分池等待、查询与网络超时，通过单连接池和受控慢查询分别触发失败，说明连接预算、泄漏判断与恢复边界。"
date: 2026-09-10
---


# 连接池与超时预算

连接池复用有限数量的数据库连接，并让容量不足的请求等待可用连接。它降低反复建立会话的成本，同时约束进入数据库的并发；池大小不会自动增加数据库的计算与存储能力。


## 一、借还与物理连接

应用借到的连接通常是代理，`close()` 将连接归还池。物理连接可以继续供后续请求使用，也可能因过期、故障或池关闭被淘汰。

连接仍被应用持有时，池无法替应用缩短业务代码、SQL 或网络等待。活动连接满且请求排队，既可能是池预算不足，也可能是长事务、慢查询或连接泄漏，需要结合持有时间和数据库会话判断。

::: warning 扩池不是通用修复
更多连接会增加数据库 CPU、I/O 与锁竞争。若瓶颈在数据库内部，扩池可能增加尾延迟；先确认等待发生在哪里，再调整容量。
:::


## 二、容量与时间预算

### 1. 总连接上限

连接预算应统计所有应用实例、后台任务和运维预留。例如数据库允许这组应用使用 80 条连接，当前 4 个实例，每实例最多 20 条；若滚动发布同时存在 6 个实例，同样的池配置会请求 120 条，超过预算。

稳定负载下，平均并发占用可用“每秒事务数 × 平均连接持有秒数”估计。但这是观察平均容量的关系，不是直接设置池上限的公式，还需要考虑峰值、尾延迟、数据库负载和拒绝策略。


### 2. 分层超时

| 限制 | 控制对象 | 常见单位与边界 |
|------|----------|----------------|
| HikariCP `connectionTimeout` | 调用方等待借到池连接 | 毫秒；不是 SQL 总超时 |
| `validationTimeout` | 连接存活验证 | 毫秒；应小于借用等待预算 |
| `Statement.setQueryTimeout` | 语句执行取消请求 | 秒；支持和取消及时性由驱动决定 |
| 驱动连接、Socket 超时 | 建连或网络响应 | 参数、单位和效果因驱动而异 |
| 请求截止时间 | 整个业务请求 | 包含等待、执行、映射、重试和清理 |

各阶段要在统一截止时间内消耗剩余预算，而不是每到一层重新获得完整超时。JDBC 没有一个能替代所有阶段的通用事务超时设置。


## 三、HikariCP 配置

本篇示例固定 HikariCP 7.0.2、H2 2.4.240、JDK 21，依赖在 `pom.xml`。下面是测试池的完整工厂方法，位于 `JdbcContractTest`；`dataSource` 为该测试的 H2 连接工厂。

::: details 查看单连接测试池

```java
/** 创建仅一条连接的测试池；调用方负责关闭，超时单位为毫秒。 */
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
```

:::

HikariCP 7.0.2 接受的借用等待下限是 250 ms。本例用 350 ms 制造短且可重复的超时，并非生产推荐值。池在测试结束时由 try-with-resources 关闭，避免残留连接和维护线程。

`maxLifetime` 管理连接寿命，`keepaliveTime` 用于空闲连接保活，`idleTimeout` 配合 `minimumIdle` 影响空闲回收。寿命与保活应结合数据库、代理和网络的断开策略核对，不能期待它们终止任意正在执行业务的连接。

## 四、两种超时的验证


### 1. 池等待

`poolWaitTimesOutAndRecovers` 首先持有池中唯一连接，再尝试第二次获取。第二次借用应抛出 `SQLTransientConnectionException`；归还第一条后，活动连接数恢复为 0，随后能再次借到有效连接。

测试的关键断言如下，`pool` 和 `held` 的关闭均在外层资源边界中管理：

```java
assertTrue(held.isValid(1));
assertEquals(1, pool.getHikariPoolMXBean().getActiveConnections());
assertThrows(SQLTransientConnectionException.class,
        /* 池中唯一连接被占用时，第二次借用必须有界失败。 */ pool::getConnection);
```

这里 SQL 尚未开始执行，修改查询超时不会消除借用等待。真实故障要继续检查是谁持有连接、持有多久以及数据库是否仍在处理该会话。

### 2. 查询取消

`queryTimeoutIsSeparateFromPoolWait` 使用直接连接，把查询超时设为 1 秒，对 H2 的大范围聚合触发取消。以下为资源边界内的局部代码：

```java
statement.setQueryTimeout(1);
assertThrows(SQLTimeoutException.class,
        /* 大范围聚合使 H2 在执行中检查一秒超时。 */
        () -> statement.executeQuery("SELECT SUM(X) FROM SYSTEM_RANGE(1, 1000000000)"));
```

超时后测试继续执行 `VALUES 1`，验证当前 H2 连接可用。其他驱动可能需要重置或淘汰连接，不能将本例恢复结果视为通用承诺。

## 五、执行与结果

在本篇新建的示例目录运行两个受控故障及状态重置测试：

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
import java.sql.SQLTimeoutException;
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

    /** 查询超时独立于连接池等待，用受控内存计算触发驱动取消。 */
    @Test
    void queryTimeoutIsSeparateFromPoolWait() throws Exception {
        try (var connection = dataSource.getConnection(); var statement = connection.createStatement()) {
            statement.setQueryTimeout(1);
            assertThrows(SQLTimeoutException.class,
                    /* 聚合足够大的范围，H2 在执行期间检查一秒超时。 */
                    () -> statement.executeQuery("SELECT SUM(X) FROM SYSTEM_RANGE(1, 1000000000)"));
            assertTrue(connection.isValid(1));
            try (var rows = statement.executeQuery("VALUES 1")) {
                assertTrue(rows.next());
                assertEquals(1, rows.getInt(1));
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

mvn -ntp -f pom.xml test "-Dtest=JdbcContractTest#poolWaitTimesOutAndRecovers+queryTimeoutIsSeparateFromPoolWait+poolResetsUnfinishedTransaction"
```

报告应为 3 项通过。它们分别证明借用等待有界、SQL 取消与池等待独立，以及当前池组合会清理未提交事务。未测试远程网络中断、数据库重启或生产容量。


## 六、泄漏与恢复判断

`leakDetectionThreshold` 记录长时间持有连接的线索，不会自动归还连接；慢事务也可能触发告警，因此不能只凭一条泄漏日志认定遗漏 `close()`。

排查时关联 active、idle、pending、获取时间、使用时间，以及数据库 SQL 与锁等待。只有调用已结束、数据库操作也结束、连接仍未归还，才更指向所有权泄漏。

::: tip 先恢复资源，再评估重试
连接故障后应由驱动和池按契约处理失效会话。认证错误、SQL 语法和约束冲突不适合机械重试；瞬时异常也需满足幂等、次数和总预算限制。
:::


## 七、参考资料

- [HikariCP 配置](https://github.com/brettwooldridge/HikariCP)
- [连接池容量说明](https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing)
- [Statement 查询超时](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Statement.html#setQueryTimeout(int)

以上资料)定义池参数、容量取舍与驱动取消契约。
