---
title: "I/O 与连接池延迟"
tags: [Java, JDBC, 超时, 连接池]
excerpt: "把请求延迟分解到排队、连接获取、执行和响应读取，使用连接池耗尽与 SQL 超时测试核对错误及恢复，解释重试放大、取消残留和下游容量约束。"
date: 2026-09-10
---


# I/O 与连接池延迟

请求慢经常源于等待。数据库连接池、客户端队列、DNS、建连、下游执行和响应读取都可能占用时间；CPU 不高并不能排除容量故障。


## 一、分解等待阶段

| 阶段 | 优先证据 | 常见误判 |
|------|----------|----------|
| 执行器排队 | 队列、活动任务、提交到开始时间 | 把排队算进数据库执行 |
| 池连接获取 | active、pending、acquisition | 只看到池满就增大池 |
| DNS、TCP、TLS | 客户端阶段指标、连接错误 | 用读取超时代替所有期限 |
| SQL 或下游处理 | 活动会话、锁、服务日志 | 把 Socket 等待归因于 Java 库 |
| 读取与映射 | JFR I/O、响应大小、映射 CPU | 忽略大结果集与流式读取 |

JFR 的文件和 Socket 事件能补充持续时间和栈，但启用阈值会影响可见范围。DNS、TLS 和客户端队列不一定能靠一个事件完整拆开，需要客户端及下游证据。


## 二、连接池耗尽


### 1. 可复现故障

本篇使用 HikariCP 7.0.2、H2 2.4.240 和 JDK 21。`JdbcContractTest#poolWaitTimesOutAndRecovers` 将池容量限制为 1，持有唯一连接，再次获取必须在 350 ms 的配置期限附近失败。

测试的核心片段如下，`pool` 由外层资源块负责关闭：

```java
try (var held = pool.getConnection()) {
    assertTrue(held.isValid(1));
    assertEquals(1, pool.getHikariPoolMXBean().getActiveConnections());
    assertThrows(SQLTransientConnectionException.class,
            /* 唯一连接被持有时第二次借用必须超时。 */ pool::getConnection);
}
```

### 2. 错误与恢复

关闭已持有的连接后，测试确认 active 回到 0，再借用得到有效连接。故障和恢复发生在同一个池内，说明本例的等待来自资源被占用，而非数据库已经不可达。

生产中 active 达到上限还可能由慢 SQL、长事务、连接泄漏或建连故障造成。需要同时看持有时间、pending、数据库会话和线程栈，才能决定释放资源、缩短事务还是调整容量。


## 三、查询超时

`queryTimeoutIsSeparateFromPoolWait` 已经成功取得连接，然后对一项足够大的 H2 聚合计算设置 1 秒查询超时。测试断言 `SQLTimeoutException`，并在同一连接上执行 `VALUES 1`，确认返回 1。

安装 JDK 21 和 Maven 3.9.11，在任意位置新建空目录。按下方路径创建父目录和 UTF-8 文件；以下命令均在这个目录执行，首次构建会下载声明的公开依赖。

将以下内容保存为 `src/test/java/order/persistence/JdbcContractTest.java`：

::: details 查看 JdbcContractTest.java 完整内容

```java [src/test/java/order/persistence/JdbcContractTest.java]
package order.persistence;

import static org.junit.jupiter.api.Assertions.*;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLTimeoutException;
import java.sql.SQLTransientConnectionException;
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

在新建目录执行两个故障与恢复测试：

```powershell
mvn -ntp -f pom.xml test "-Dtest=JdbcContractTest#poolWaitTimesOutAndRecovers+queryTimeoutIsSeparateFromPoolWait"
```

两项均已通过。池获取超时限制借用等待，查询超时作用于执行阶段，不能互相替代；具体取消语义和连接恢复能力还取决于驱动与数据库。

::: warning H2 验证的范围
本地内存数据库不包含真实 DNS、TLS、网络丢包或生产数据库锁行为。这里验证的是 HikariCP 与 H2 的故障边界；目标数据库仍需相应集成与故障测试。
:::


## 四、预算与重试


### 1. 总截止时间

请求预算需包含排队、连接获取、执行、读取、映射及清理。每次重试都重新给一个完整超时，会让实际耗时远超入口期限；应从总截止时间扣除已经消耗的部分。

客户端返回超时不保证原任务已经停止。还要验证底层取消、事务状态、连接归还和在途任务数量，特别是写请求必须查清结果是否已提交。


### 2. 放大与限额

故障期间立即重试会叠加仍在执行的旧请求，多层重试还可能形成乘法放大。只有错误可重试、操作幂等且剩余预算允许时，才使用有限退避。

::: tip 扩容要计算总连接
单实例池大小乘以实例数，才是数据库面对的潜在连接规模。应用扩容可能提高下游压力，使持有时间更长，应同时验证数据库容量和入口准入。
:::


## 五、恢复检查

修复后检查阶段耗时、成功率、pending、连接持有时间和下游活动数，确认积压消退且没有重复写入。文件 I/O 问题还需核对挂载与刷盘要求，不能以吞吐为由降低必要持久化保证。

机制与配置详见[连接池与超时预算](../10-data-access/07-pools-timeouts-capacity.md)；HTTP 请求的具体边界见[HttpClient](../07-exceptions-io-network/10-http-client.md)。
