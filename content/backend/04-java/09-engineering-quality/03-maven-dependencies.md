---
title: "Maven 依赖管理"
tags: [Java, Maven, BOM]
excerpt: "解释 Maven 的依赖图、Scope、版本冲突、dependencyManagement 与 BOM，通过订单工程的依赖树区分生产 API、运行实现和测试依赖，并定位缺类与版本漂移。"
date: 2026-09-11
---


# Maven 依赖管理

Maven 递归读取依赖的 POM，结合范围、排除规则和版本管理形成依赖图。不同阶段使用不同类路径，因此“依赖已下载”不能证明它同时可用于编译、测试和运行。


## 一、直接依赖与传递依赖

源码直接引用的第三方 API 应由当前模块显式声明。`order-app` 直接使用 SLF4J，所以声明 `slf4j-api`；Logback 是运行实现，即使它传递带入相同 API，也不能替代应用对源码依赖的声明。

下方独立 `pom.xml` 直接固定 SLF4J 版本，依赖片段如下：

```xml
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-api</artifactId>
    <version>2.0.18</version>
</dependency>
```

如果只依靠另一个库传递引入该 API，那个库升级或将依赖改为可选后，当前模块就会失去编译条件。直接声明把这项要求留在实际使用它的模块中。


## 二、依赖范围

| Scope | 生产编译 | 测试 | 应用运行 | 典型用途 |
|-------|----------|------|----------|----------|
| `compile` | 包含 | 包含 | 包含 | 领域 API、SLF4J API |
| `provided` | 包含 | 包含 | 不包含 | 由目标容器提供的 API |
| `runtime` | 不包含 | 包含 | 包含 | 日志 Provider、通过 SPI 加载的 JDBC 驱动 |
| `test` | 不包含 | 包含 | 不包含 | JUnit、Mockito |

传递依赖还受上下游 Scope 的组合影响，不能只看某一个 POM 中的范围。`provided` 与 `test` 不作为普通传递依赖交给下游；`import` 仅用于在 `dependencyManagement` 中导入 POM 类型的 BOM。

::: warning 运行实现缺失
把 Logback 错放到 `test`，测试可以输出日志，正式应用却会缺少 Provider。应检查运行范围依赖树及最终部署的 `lib/`，不能仅看测试是否通过。
:::


## 三、版本选择


### 1. 冲突调解

对同一依赖坐标出现的不同版本，Maven 3 通常选择路径更近的定义，同深度按先声明者处理。这个规则不判断版本是否更安全或与业务更兼容；增加一个依赖、改变传递路径都可能改变结果。

`NoSuchMethodError` 常见于运行时加载到与编译期不兼容的类。诊断时应同时核对解析后的依赖树与部署目录，确认实际加载版本；只升级顶层依赖或盲目排除旧版本都不足以证明修复。


### 2. 版本管理与 BOM

`dependencies` 引入实际依赖，`dependencyManagement` 提供匹配依赖的版本和范围等默认值。BOM 是可导入的版本管理 POM，本身不会把所有组件加入工程。

本篇示例在 `pom.xml` 导入 JUnit BOM 6.1.2。下面是完整的版本管理块，实际测试依赖仍单独声明：

::: details 查看 JUnit BOM 声明

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.junit</groupId>
            <artifactId>junit-bom</artifactId>
            <version>6.1.2</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

:::

多个 BOM 管理同一坐标时，应检查当前 POM 的显式管理和导入顺序，通过有效 POM 确认最后约束；不能认为导入数量越多，兼容性越有保证。


## 四、检查真实依赖图

安装 JDK 21 和 Maven 3.9.11，在任意位置新建空目录。按下方路径创建父目录和 UTF-8 文件；以下命令均在这个目录执行，首次构建会下载声明的公开依赖。

将以下内容保存为 `pom.xml`：

::: details 查看 pom.xml 完整内容

```xml [pom.xml]
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>order</groupId>
    <artifactId>order-app</artifactId>
    <version>1.0.0</version>

    <properties>
        <maven.compiler.release>21</maven.compiler.release>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <junit.version>6.1.2</junit.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.junit</groupId>
                <artifactId>junit-bom</artifactId>
                <version>${junit.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.slf4j</groupId><artifactId>slf4j-api</artifactId><version>2.0.18</version>
        </dependency>
        <dependency>
            <groupId>ch.qos.logback</groupId><artifactId>logback-classic</artifactId><version>1.5.38</version><scope>runtime</scope>
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
                <configuration>
                    <compilerArgs>
                        <arg>-Xlint:all</arg>
                        <arg>-Xdoclint:all,-missing</arg>
                        <arg>-Werror</arg>
                    </compilerArgs>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.5.4</version>
                <configuration>
                    <!-- 单元测试是该工程的交付内容，零测试不能按成功处理。 -->
                    <failIfNoTests>true</failIfNoTests>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-jar-plugin</artifactId>
                <version>3.4.2</version>
                <configuration><archive><manifest>
                    <mainClass>order.app.OrderApplication</mainClass>
                    <addClasspath>true</addClasspath><classpathPrefix>lib/</classpathPrefix>
                </manifest></archive></configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId><artifactId>maven-dependency-plugin</artifactId><version>3.8.1</version>
                <executions><execution>
                    <id>copy-runtime-libraries</id><phase>package</phase><goals><goal>copy-dependencies</goal></goals>
                    <configuration><includeScope>runtime</includeScope><outputDirectory>${project.build.directory}/lib</outputDirectory></configuration>
                </execution></executions>
            </plugin>
        </plugins>
    </build>
</project>
```

:::

将以下内容保存为 `src/main/java/order/OrderDraft.java`：

::: details 查看 OrderDraft.java 完整内容

```java [src/main/java/order/OrderDraft.java]
package order;


/** 累计同币种、以分计价的订单草稿金额；对象由单线程持有，不包含折扣和持久化。 */
public final class OrderDraft {
    private long totalCents;

    /** 创建金额为零的订单草稿；无外部副作用。 */
    public OrderDraft() {
    }

    /**
     * 加入一项商品，所有校验和金额计算完成后才更新草稿；无返回值。
     *
     * @param unitPriceCents 单价，单位为分，范围为 0 到 Long.MAX_VALUE
     * @param quantity 数量，范围为 1 到 Integer.MAX_VALUE
     * @throws IllegalArgumentException 单价为负数或数量不为正数
     * @throws ArithmeticException 单项金额或累计金额超出 long 范围；草稿金额保持不变
     */
    public void addItem(long unitPriceCents, int quantity) {
        if (unitPriceCents < 0) {
            throw new IllegalArgumentException("unitPriceCents must not be negative");
        }
        if (quantity <= 0) {
            throw new IllegalArgumentException("quantity must be positive");
        }
        // 计算异常必须在赋值前传播，防止无效输入污染已有金额。
        long lineCents = Math.multiplyExact(unitPriceCents, (long) quantity);
        totalCents = Math.addExact(totalCents, lineCents);
    }

    /**
     * 读取当前草稿金额，不修改草稿。
     *
     * @return 已加入商品的累计金额，单位为分，范围为 0 到 Long.MAX_VALUE
     */
    public long totalCents() {
        return totalCents;
    }
}
```

:::

将以下内容保存为 `src/test/java/order/OrderDraftTest.java`：

::: details 查看 OrderDraftTest.java 完整内容

```java [src/test/java/order/OrderDraftTest.java]
package order;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

/** 验证订单草稿的公开金额契约，每个测试及参数化调用使用独立草稿。 */
class OrderDraftTest {
    private OrderDraft draft;

    /** 每次测试调用前建立空草稿；只替换当前测试实例的字段，无返回值。 */
    @BeforeEach
    void createDraft() {
        draft = new OrderDraft();
    }

    /** 验证新草稿的公开初始金额；断言失败时抛出断言错误，无返回值。 */
    @Test
    void startsWithZeroTotal() {
        assertEquals(0L, draft.totalCents());
    }

    /** 验证不同商品累计后的订单总额；只修改本次草稿，无返回值。 */
    @Test
    void addsDifferentItems() {
        draft.addItem(1990L, 2);

        draft.addItem(990L, 1);

        assertEquals(4970L, draft.totalCents());
    }
}
```

:::

将以下内容保存为 `src/main/java/order/app/OrderApplication.java`：

::: details 查看 OrderApplication.java 完整内容

```java [src/main/java/order/app/OrderApplication.java]
package order.app;

import order.OrderDraft;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

/** 用演示订单观察领域依赖、日志配置、关联字段和失败原因。 */
public final class OrderApplication {
    private static final Logger LOGGER = LoggerFactory.getLogger(OrderApplication.class);

    /** 禁止实例化命令行入口，无外部副作用。 */
    private OrderApplication() {
    }

    /**
     * 记录一次金额计算或受控失败，退出前清理 MDC；无返回值。
     * @param args 无参数表示正常计算；传入任意参数（演示用 fail）触发非法数量
     */
    public static void main(String[] args) {
        MDC.put("orderId", "ORD-1001");
        try {
            OrderDraft draft = new OrderDraft();
            draft.addItem(1990, args.length == 0 ? 2 : 0);
            draft.addItem(990, 1);
            LOGGER.info("order accepted totalCents={}", draft.totalCents());
        } catch (IllegalArgumentException exception) {
            // 参数拒绝作为可预期失败记录一次；保留 Throwable 而非仅记录消息。
            LOGGER.warn("order rejected", exception);
        } finally {
            MDC.remove("orderId");
        }
    }
}
```

:::

将以下内容保存为 `src/main/resources/logback.xml`：

```xml [src/main/resources/logback.xml]
<configuration>
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%level orderId=%X{orderId} %msg%n</pattern>
        </encoder>
    </appender>
    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
    </root>
</configuration>
```

先检查 BOM 实际选中的测试组件：

```powershell
mvn -ntp dependency:tree "-Dincludes=org.junit.jupiter:*,org.junit.platform:*"
mvn -ntp test
```

依赖树应显示 Jupiter API、参数化支持及引擎为 `6.1.2`，范围为 `test`；正常测试集执行 2 次并通过。过滤树只用于观察选中组件，判断冲突时应保留完整路径。

在同一目录检查应用运行依赖，并验证日志入口：

```powershell
mvn -ntp package dependency:tree "-Dscope=runtime"
java -jar target/order-app-1.0.0.jar
```

应用运行图包含 `slf4j-api`、`logback-classic` 与 `logback-core`；订单类来自本篇源码，不应包含 JUnit 或 Mockito。打包阶段把这些运行 JAR 复制到 `target/lib/`，供实际启动验证。入口应输出 `INFO orderId=ORD-1001 order accepted totalCents=4970`。


## 五、排除与可选依赖

`exclusions` 只切断指定依赖路径。如果另一个库仍引入同一制品，它仍可能进入最终图；排除也不会证明调用方不再需要其中的类。先确认冲突来源，再验证编译、测试及真正触发相关 API 的运行路径。

`optional` 表示库不自动把该依赖传递给消费者。消费者启用对应能力时需要自行声明。反射、SPI 与配置驱动的依赖可能被静态分析误判为未使用，删除前应核对真实加载入口。

::: tip 保持构建可复现
固定直接依赖和 BOM 版本，将升级前后的依赖树与行为测试一起核对。仓库地址、镜像及凭据属于环境配置，项目 POM 不应包含个人密钥或本机绝对 JAR 路径。
:::

## 六、参考资料

- [Maven 依赖机制](https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html)
- [Dependency Plugin](https://maven.apache.org/plugins/maven-dependency-plugin/)

以上资料提供依赖树、分析和复制目标。
