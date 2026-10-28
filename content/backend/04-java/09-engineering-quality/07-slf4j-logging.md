---
title: "SLF4J 日志"
tags: [Java, SLF4J, Logback]
excerpt: "说明日志门面与 Provider 的职责，结合订单应用验证参数化消息、异常栈和 MDC 关联字段，处理缺失实现、重复日志与敏感信息边界。"
date: 2026-09-11
---


# SLF4J 日志

SLF4J 提供业务代码调用的日志 API，Provider 负责实际输出。应用选择一个兼容实现并管理配置；可复用库通常只依赖 API，把日志目的地与格式交给最终应用。


## 一、依赖与输出链路

示例采用 SLF4J `2.0.18`、Logback `1.5.38` 和 JDK 21。版本固定在下方独立 `pom.xml`，应用 POM 声明 API 与运行实现，日志配置属于应用资源。

| 组件 | 作用 | Maven 范围 |
|------|------|------------|
| `slf4j-api` | Logger、参数化消息和 MDC API | `compile` |
| `logback-classic` | SLF4J Provider 与日志模型 | `runtime` |
| `logback-core` | Appender、Encoder 等基础能力 | 由 Logback 传递引入 |
| `logback.xml` | 级别、格式和输出位置 | 应用运行资源 |

SLF4J 2 使用 Provider 发现机制。没有可用 Provider 时会警告并退化为无操作日志；存在多个 Provider 时可能选到非预期实现。排查应核对运行依赖树，而不是只检查源码是否能调用 `LoggerFactory`。


## 二、消息与异常


### 1. 参数化消息

参数化日志让消息格式与字段分开。下面是 `OrderApplication.main` 中的局部调用，`draft` 由同一方法完成金额校验和计算：

```java
LOGGER.info("order accepted totalCents={}", draft.totalCents());
```

禁用级别时可以避免不必要的消息拼接，但 Java 实参仍会先求值。把昂贵方法放在占位符参数中，不会自动延迟执行；此时应先检查级别，或使用 SLF4J 2 的 Supplier 参数能力。

日志级别由处理动作决定：正常业务结果使用 INFO，预期拒绝或需要注意的降级可以使用 WARN，需要处置的系统失败使用 ERROR。不能仅根据某个异常继承层次决定所有日志级别。


### 2. 保留原因链

应用捕获参数错误时将异常对象一并传入：

```java
LOGGER.warn("order rejected", exception);
```

只传 `exception.getMessage()` 会丢失类型、调用位置与原因链。通常由处理边界统一记录一次完整失败，底层转换异常时保留 cause；每层同时打印再抛出会造成重复日志和重复告警。


## 三、关联字段与配置


### 1. 同步调用中的 MDC

MDC 保存当前执行上下文的关联字段。下面是入口中管理演示订单号的局部结构；实际金额代码位于 `try` 内。

```java
MDC.put("orderId", "ORD-1001");
try {
    // 执行当前订单计算，完整实现在 OrderApplication.main。
} finally {
    MDC.remove("orderId");
}
```

清理必须覆盖成功与异常路径。否则线程复用时，旧请求的标识可能进入新请求日志。这里仅演示同步范围；跨任务传播与嵌套上下文恢复由[ThreadLocal](../11-concurrency/10-thread-local.md)负责，不能假定 MDC 自动跨所有异步调用传播。


### 2. Logback 资源

完整配置保存为 `src/main/resources/logback.xml`。格式显式输出 `orderId`，否则即使设置 MDC，日志文本也不会自动包含该字段。

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

该配置用于本地控制台观察。生产日志还需根据部署方式配置采集、保留周期和容量限制；它们不能由这份控制台样例证明。


## 四、验证正常与失败输出

安装 JDK 21 和 Maven 3.9.11，新建空目录。先将上面的 `logback.xml` 保存到指定资源路径，再按下方路径创建 POM 和完整 Java 文件，全部使用 UTF-8。

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


    <dependencies>
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
                    <failIfNoTests>false</failIfNoTests>
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

在新建目录构建后执行两个入口：

```powershell
mvn -ntp clean package
java -jar target/order-app-1.0.0.jar
java -jar target/order-app-1.0.0.jar fail
```

正常调用与受控非法数量分别产生以下输出；异常栈仅摘录根因行：

```text
INFO orderId=ORD-1001 order accepted totalCents=4970
WARN orderId=ORD-1001 order rejected
java.lang.IllegalArgumentException: quantity must be positive
```

失败入口由应用捕获异常并记录，所以进程仍正常退出。这证明日志保留了失败原因，不等于库存或付款操作已经成功；需要失败退出码的批处理应另行设计入口契约。


## 五、日志数据边界

::: danger 敏感信息在输出前控制
不要记录密码、令牌、完整个人资料或请求对象的全部 `toString()`。字段进入本地文件或控制台后，采集端再脱敏无法撤销此前暴露。示例只使用人工构造的订单号与金额。
:::

外部文本还可能包含换行和控制字符，不能未经约束直接拼接到日志。本例订单号是固定构造值；真实系统接收外部字段时，应结合字段白名单、结构化编码和保留策略处理输入。

日志是运行证据，普通业务测试仍应优先验证返回值、状态和异常。只有日志本身承担审计契约时，才针对必需字段、脱敏和失败行为建立专门检查。

## 六、参考资料

- [SLF4J 手册](https://www.slf4j.org/manual.html)
- [Logback 配置](https://logback.qos.ch/manual/configuration.html)
- [MDC](https://logback.qos.ch/manual/mdc.html)

以上资料说明输出与关联字段的实际实现。
