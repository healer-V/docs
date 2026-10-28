---
title: "数据访问安全与性能"
tags: [Java, JDBC, SQL]
excerpt: "从调用侧约束动态 SQL、权限、结果规模和超时，使用真实测试对照逐条查询与有界读取，解释调用次数、网络往返、映射成本及幂等恢复之间的区别。"
date: 2026-09-10
---


# 数据访问安全与性能

数据访问边界要同时限制 SQL 能做什么、能读取多少数据以及能占用多久资源。查询返回正确记录只是基本条件，动态结构、权限和无界请求仍可能造成越权或容量问题。


## 一、SQL 结构与权限

### 1. 动态标识符白名单

参数占位符适合绑定值，表名、列名和排序方向必须由程序控制。下方的 `JdbcOrders.page` 只接受内部枚举 `Sort.NUMBER` 或 `Sort.AMOUNT`，并把它们映射到固定列名。

```java
String column = switch (Objects.requireNonNull(sort)) {
    case NUMBER -> "order_number";
    case AMOUNT -> "amount";
};
```

排序加入 `id` 作为稳定的并列裁决键，页大小限定为 `1..100`，并使用参数绑定。完整方法位于 `src/main/java/order/persistence/JdbcOrders.java`，`LIMIT` 语法只在本例 H2 上验证。

外部请求需要先转换成受控枚举，再进入 SQL 构造。测试传入 `amount; DROP TABLE orders` 时，枚举解析应失败，该文本不能进入 SQL 结构。

### 2. 最小权限

参数化查询和最小权限保护不同边界。即使所有参数正确绑定，权限过宽的应用账号仍能执行不必要的写入或 DDL。

本例权限测试在独立 H2 内存库创建仅有 `SELECT` 权限的账号，查询订单总数成功，插入则被拒绝。下面的 SQL 只用于该临时测试环境，口令是无实际用途的演示值：

```sql
CREATE USER order_reader PASSWORD 'demo-only';
GRANT SELECT ON orders TO order_reader;
```

生产运行账号、迁移账号和分析账号按职责分配权限。凭据由受控配置提供；日志记录语句标识、耗时和安全关联键，避免完整参数、地址与数据库结构泄漏。

## 二、结果规模

单次请求必须限制行数和列数。返回所有数据再在 Java 中截取，会先支付网络、映射和内存成本，不能视为数据库分页。

| 方式 | 适用场景 | 需要处理的边界 |
|------|----------|----------------|
| 有界首页查询 | 小规模列表入口 | 最大页大小、稳定排序 |
| Offset 分页 | 需要随机跳页、页深有限 | 深分页成本与数据变化 |
| Keyset 分页 | 按游标连续读取 | 唯一排序键、游标校验与方向 |
| 流式批量消费 | 大规模导出或离线处理 | 连接持有、背压、内存和取消 |

排序字段不唯一时，应加入稳定唯一键，例如 `created_at, id`。分页期间数据仍可能变化，需要明确是否接受实时视图；分页本身不等同于一致快照。


## 三、调用次数与耗时


### 1. 逐条查询对照

下方完整测试先插入三条订单，再用三次按编号查询读取它们，随后用一次有界查询读取同样数量的订单。核心对照如下，`connection` 与数据均由外层测试准备：

```java
int individualCalls = 0;
for (int number = 1001; number <= 1003; number++) {
    assertTrue(JdbcOrders.find(connection, "ORD-" + number).isPresent());
    individualCalls++;
}
var rows = JdbcOrders.page(connection, JdbcOrders.Sort.NUMBER, 3);
assertEquals(individualCalls, rows.size());
```

`find` 每次执行一条查询，`page` 在一次查询中读取有界结果。测试证明应用 SQL 调用从 3 次减少到 1 次，并保持三条结果；它没有测量吞吐或网络往返。

::: warning 调用数不等于协议往返数
H2 本例在进程内执行，没有远程数据库网络往返。真实驱动还涉及准备、绑定、抓取和批次重写，不能用 JDBC 方法调用次数直接宣称网络耗时降低了某个比例。
:::


### 2. 时间分段

应用观察一次查询，应区分连接等待、执行、结果提取与映射、业务后处理。下面是计时位置的局部示意，`dataSource` 和查询参数由调用方提供：

```java
long start = System.nanoTime();
try (var connection = dataSource.getConnection()) {
    long acquired = System.nanoTime();
    var rows = JdbcOrders.page(connection, JdbcOrders.Sort.NUMBER, 10);
    long mapped = System.nanoTime();
    // acquired - start 表示连接获取耗时；mapped - acquired 包含查询与映射。
}
```

持续时间使用单调时钟计算，输出时转换并标注单位。细分执行与映射需在相应方法内部埋点；单次端到端计时不能直接归因于数据库执行器。


## 四、超时与恢复

本例查询超时测试用 `setQueryTimeout(1)` 触发 H2 的受控聚合取消，并在同一连接执行 `VALUES 1` 验证恢复。池等待是另一条路径，必须单独观察，相关配置见[连接池与超时预算](./07-pools-timeouts-capacity.md)。

调用方超时返回后，数据库操作不一定已经停止。重试还会消耗剩余预算，应同时限制次数、并发和总时间；涉及写入时，必须先解决幂等与提交未知问题。

事务内避免等待外部 HTTP、文件和消息响应。慢 SQL、长事务或缺少合适索引，应结合数据库执行计划、锁与负载证据处理；扩大连接池不会改变 SQL 自身的工作量。


## 五、执行与证据

使用 JDK 21，在下方的 H2 2.4.240 工程运行安全、规模和超时四项测试：

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
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/** 封装订单 SQL，借用连接的提交和关闭责任始终留给调用方。 */
public final class JdbcOrders {
    /** 禁止实例化无状态 SQL 工具。 */
    private JdbcOrders() { }

    /** 限定可用于 SQL 结构的排序方式。 */
    public enum Sort { NUMBER, AMOUNT }

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
     * 用受控排序片段查询有界结果；LIMIT 语法只在本示例 H2 中验证。
     * @param connection 当前有效连接，调用方负责关闭
     * @param sort 非空内部枚举，不能传入任意 SQL 文本
     * @param limit 页大小，范围 1 至 100
     * @return 最多 limit 条订单快照，按指定键及 id 稳定排序
     * @throws SQLException SQL 执行或映射失败时抛出
     */
    public static List<OrderRow> page(Connection connection, Sort sort, int limit) throws SQLException {
        if (limit < 1 || limit > 100) {
            throw new IllegalArgumentException("limit must be between 1 and 100");
        }
        String column = switch (Objects.requireNonNull(sort)) {
            case NUMBER -> "order_number";
            case AMOUNT -> "amount";
        };
        String sql = "SELECT id, order_number, amount, created_at, reviewer_id FROM orders ORDER BY "
                + column + ", id LIMIT ?";
        try (var statement = connection.prepareStatement(sql)) {
            statement.setInt(1, limit);
            statement.setQueryTimeout(2);
            try (var rows = statement.executeQuery()) {
                List<OrderRow> result = new ArrayList<>();
                while (rows.next()) {
                    result.add(map(rows));
                }
                return List.copyOf(result);
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
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.SQLTimeoutException;
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

    /** SQL 控制字符在参数化查询中不能改变查询结构。 */
    @Test
    void boundInputCannotChangeSql() throws Exception {
        try (var connection = dataSource.getConnection()) {
            insert(connection, "ORD-1001");
            insert(connection, "ORD-1002");
            String input = "' OR '1'='1";
            assertTrue(JdbcOrders.find(connection, input).isEmpty());
            // 仅在隔离数据库展示错误拼接，固定输入不能接入真实请求。
            try (var statement = connection.createStatement();
                 var rows = statement.executeQuery(
                         "SELECT COUNT(*) FROM orders WHERE order_number = '" + input + "'")) {
                assertTrue(rows.next());
                assertEquals(2, rows.getInt(1));
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

    /** 受控排序和页大小减少返回规模，并拒绝非法上限。 */
    @Test
    void boundedPageAndCallCounts() throws Exception {
        try (var connection = dataSource.getConnection()) {
            for (int number = 1001; number <= 1003; number++) {
                insert(connection, "ORD-" + number);
            }
            int individualCalls = 0;
            for (int number = 1001; number <= 1003; number++) {
                assertTrue(JdbcOrders.find(connection, "ORD-" + number).isPresent());
                individualCalls++;
            }
            var rows = JdbcOrders.page(connection, JdbcOrders.Sort.NUMBER, 3);
            assertEquals(individualCalls, rows.size());
            assertEquals(1, JdbcOrders.page(connection, JdbcOrders.Sort.AMOUNT, 1).size());
            assertThrows(IllegalArgumentException.class,
                    /* 大于上限的页大小在发送 SQL 之前被拒绝。 */
                    () -> JdbcOrders.page(connection, JdbcOrders.Sort.NUMBER, 101));
            assertThrows(IllegalArgumentException.class,
                    /* 非法枚举值不能进入 SQL 结构。 */
                    () -> JdbcOrders.Sort.valueOf("amount; DROP TABLE orders"));
        }
    }

    /** 独立只读账号可查询但不能插入，证明权限与参数化是不同边界。 */
    @Test
    void readOnlyAccountCannotWrite() throws Exception {
        try (var setup = keeper.createStatement()) {
            setup.execute("CREATE USER order_reader PASSWORD 'demo-only'");
            setup.execute("GRANT SELECT ON orders TO order_reader");
        }
        try (var reader = DriverManager.getConnection(dataSource.getURL(), "order_reader", "demo-only");
             var query = reader.createStatement();
             var rows = query.executeQuery("SELECT COUNT(*) FROM orders")) {
            assertTrue(rows.next());
            assertEquals(0, rows.getInt(1));
            assertThrows(SQLException.class,
                    /* 只读账号的写入应由数据库权限拒绝。 */
                    () -> insert(reader, "ORD-1001"));
        }
        assertEquals(0, count());
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

mvn -ntp -f pom.xml test "-Dtest=JdbcContractTest#boundInputCannotChangeSql+boundedPageAndCallCounts+readOnlyAccountCannotWrite+queryTimeoutIsSeparateFromPoolWait"
```

| 检查 | 预期证据 |
|------|----------|
| 参数绑定 | 特殊输入无法扩大订单查询范围 |
| 受控排序和规模 | 非法枚举、页大小 101 被拒绝；页大小 1 返回一条 |
| 调用对照 | 三次单条查询与一次有界查询读取三条订单 |
| 最小权限 | 只读账号查询成功、写入失败 |
| 查询超时 | 抛出 `SQLTimeoutException`，随后探测恢复 |

报告应为 4 项通过。性能数据应另用目标数据库和代表性数据测量，本次不提供未经压测的吞吐、延迟或最佳池大小结论。

## 六、参考资料

- [PreparedStatement](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/PreparedStatement.html)
- [H2 权限语句](https://h2database.com/html/commands.html#grant_right)
- [查询超时 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Statement.html#setQueryTimeout(int)

以上资料)说明结构、权限和执行预算的不同约束。
