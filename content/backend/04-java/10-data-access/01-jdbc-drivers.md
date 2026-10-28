---
title: "JDBC 与数据库驱动"
tags: [Java, JDBC, H2]
excerpt: "解释 JDBC 接口、数据库驱动和服务端的职责，通过 H2 连接、固定查询与元数据输出验证驱动发现，说明连接 URL、依赖和数据库兼容性的边界。"
date: 2026-09-10
---


# JDBC 与数据库驱动

JDBC（Java Database Connectivity）是 Java 访问关系数据库的标准接口。应用用它建立连接、发送 SQL、读取结果和控制事务；驱动把接口调用转换成目标数据库能够处理的操作。

## 一、调用链与职责

订单查询经过应用、数据访问实现、JDBC 接口与驱动，到达数据库。嵌入式 H2 在当前 JVM 内执行数据库逻辑；远程数据库驱动通常还需要网络协议交互，因此不能把所有 JDBC 调用都理解成一次网络请求。

| 参与者 | 负责的内容 | 不负责的内容 |
|--------|------------|--------------|
| 应用与 Repository | 查询目的、事务范围、业务结果 | 数据库协议实现 |
| JDBC API | 连接、语句、结果集和元数据契约 | 自动生成领域对象、保证 SQL 方言一致 |
| 驱动 | 连接创建、参数编码、结果转换 | 判断业务金额或订单状态是否合法 |
| 数据库 | SQL、约束、存储和事务实现 | 自动修复应用资源泄漏 |

JDBC 不是对象关系映射框架。即使接口相同，分页、时间类型、生成键与隔离行为也可能不同；迁移数据库需要执行目标数据库测试。


## 二、核心接口

`Connection` 表示一个数据库会话，并承载本地事务。`PreparedStatement` 负责执行固定结构、可绑定参数的 SQL，`ResultSet` 提供逐行读取结果的游标。`DataSource` 是获取连接的入口，本身不承诺一定包含连接池。

| 语句接口 | 使用条件 | 订单场景 |
|----------|----------|----------|
| `Statement` | SQL 完全受控，没有外部值拼接 | 建表、固定探测查询 |
| `PreparedStatement` | 查询或写入包含参数 | 根据订单编号查询 |
| `CallableStatement` | 数据库契约要求调用存储过程 | 已有存储过程接口适配 |

查询结果依赖语句和连接的生命周期。常规数据访问应在资源关闭之前完成映射，再返回普通 Java 对象。


## 三、驱动与连接 URL


### 1. 驱动发现

支持 JDBC 服务提供者机制的驱动可以通过 JAR 内的 `META-INF/services/java.sql.Driver` 注册实现，`DriverManager` 据此发现匹配 URL 的驱动。现代常规用法不必额外调用 `Class.forName`，但驱动 JAR 必须实际进入运行类路径。

本篇示例 `pom.xml` 固定 H2 2.4.240。它还在测试中直接使用 H2 的 `JdbcDataSource`，因此本工程使用默认编译作用域；只依赖标准 JDBC 接口的应用可以将驱动设为 `runtime`。

```xml
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <version>2.4.240</version>
</dependency>
```


### 2. URL 与数据库生命周期

`jdbc:` 后的子协议和参数由驱动定义。例如 `jdbc:h2:mem:probe` 创建具名的进程内数据库；没有额外保留配置时，最后一个连接关闭会结束该内存库的生命周期。

`DB_CLOSE_DELAY=-1` 可以让 H2 内存库保留到 JVM 结束，但批量测试若不断创建唯一数据库名，就会保留不必要的内存。下方完整测试选择显式持有一个连接，并在每次测试结束后关闭，详见[数据访问测试](./09-data-access-testing.md)。

::: warning URL 不是通用配置语言
连接、TLS、字符集和时区参数都由具体驱动解释。复制另一种数据库的参数名不会产生对应能力；连接地址和凭据也不应直接进入日志或对外错误。
:::

## 四、连接与查询

### 1. 完整探测程序

以下是 `src/main/java/order/persistence/JdbcProbe.java` 的完整程序，使用 JDK 21，在同一资源边界中输出元数据并执行 `VALUES 1`。

::: details 查看 JDBC 探测程序

```java
package order.persistence;

import java.sql.DriverManager;

/** 输出实际驱动和数据库，不打印连接地址或凭据。 */
public final class JdbcProbe {
    /** 禁止实例化命令行入口。 */
    private JdbcProbe() { }

    /**
     * 连接内存数据库，输出元数据与固定查询结果。
     * @param args 不读取启动参数
     * @throws Exception 驱动、连接或 SQL 失败时让进程失败退出
     */
    public static void main(String[] args) throws Exception {
        try (var connection = DriverManager.getConnection("jdbc:h2:mem:probe", "sa", "");
             var statement = connection.createStatement();
             var rows = statement.executeQuery("VALUES 1")) {
            var metadata = connection.getMetaData();
            System.out.println("database=" + metadata.getDatabaseProductName());
            System.out.println("version=" + metadata.getDatabaseProductVersion());
            System.out.println("driver=" + metadata.getDriverName());
            if (!rows.next()) {
                throw new IllegalStateException("probe returned no row");
            }
            System.out.println("probe=" + rows.getInt(1));
        }
    }
}
```

:::


### 2. 执行与结果

在本篇新建的示例目录，使用 Maven 3.9.11 构建，再运行探测。Windows 类路径分隔符为分号，Linux/macOS 应改为冒号。

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
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-dependency-plugin</artifactId>
                <version>3.8.1</version>
                <executions>
                    <execution>
                        <phase>package</phase>
                        <goals><goal>copy-dependencies</goal></goals>
                        <configuration>
                            <includeScope>runtime</includeScope>
                            <outputDirectory>${project.build.directory}/lib</outputDirectory>
                        </configuration>
                    </execution>
                </executions>
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

将以下内容保存为 `src/test/java/order/persistence/JdbcContractTest.java`：

::: details 查看 JdbcContractTest.java 完整内容

```java [src/test/java/order/persistence/JdbcContractTest.java]
package order.persistence;

import static org.junit.jupiter.api.Assertions.*;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
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

    /** 验证真实驱动、数据库产品和最小连接能力。 */
    @Test
    void driverMetadata() throws Exception {
        try (var connection = dataSource.getConnection()) {
            assertEquals("H2", connection.getMetaData().getDatabaseProductName());
            assertEquals("H2 JDBC Driver", connection.getMetaData().getDriverName());
            assertTrue(connection.isValid(1));
        }
    }

    /** 未注册子协议没有匹配驱动，故障发生在 SQL 执行之前。 */
    @Test
    void missingDriverFails() {
        var failure = assertThrows(SQLException.class,
                /* 使用不存在的 JDBC 子协议触发确定的驱动发现失败。 */
                () -> DriverManager.getConnection("jdbc:unknown:orders"));
        assertTrue(failure.getMessage().contains("No suitable driver"));
    }
}
```

:::

```powershell

mvn -ntp -f pom.xml clean verify
java -cp "target/classes;target/lib/*" order.persistence.JdbcProbe
```

构建运行本文的 2 项驱动测试。探测输出应包含以下产品、驱动及查询结果，`version` 行给出实际数据库构建版本：

```text
database=H2
version=2.4.240 (2025-09-22)
driver=H2 JDBC Driver
probe=1
```

元数据证明当前连接使用了什么实现，不证明该实现的全部兼容行为。隔离级别、批次计数和类型往返仍应通过相应操作验证。

## 五、驱动发现失败

在相同工程执行 `JdbcContractTest#missingDriverFails`，测试用不存在的 `jdbc:unknown:orders` 子协议触发 `No suitable driver`，并断言异常确实发生：

```powershell
mvn -ntp -f pom.xml test "-Dtest=JdbcContractTest#missingDriverFails"
```

实际项目出现同类错误时，先核对 URL 子协议和运行依赖，再检查驱动注册与类加载边界。缺少驱动、错误 URL 和错误启动类路径，都不能通过修改业务 SQL 解决。

JPMS 工程至少需要读取 `java.sql`。驱动是否有显式模块描述符，应使用实际 JAR 的 `jar --describe-module` 判断，不能由 Maven 坐标猜测模块名。


## 六、参考资料

- [Java 21 JDBC API](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/package-summary.html)
- [DriverManager](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/DriverManager.html)
- [H2 连接模式](https://h2database.com/html/features.html)

以上资料分别定义接口、驱动发现和数据库生命周期。
