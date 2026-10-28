---
title: "Maven 多模块"
tags: [Java, Maven, Reactor]
excerpt: "利用订单工程区分父 POM、聚合器与 Reactor，观察依赖驱动的模块排序、局部构建与制品关系，并处理循环依赖和不必要的公共模块。"
date: 2026-09-11
---


# Maven 多模块

Maven 多模块构建把多个有独立坐标的项目交给同一次 Reactor 执行。聚合器决定哪些项目参与，父 POM 提供继承配置，项目间依赖决定构建顺序。这三种关系需要分别检查。

## 一、三种关系

| 角色 | 声明位置 | 解决的问题 |
|------|----------|------------|
| 聚合器 | 根 POM 的 `modules` | 哪些项目参加本次构建 |
| 父 POM | 子 POM 的 `parent` | 从哪里继承属性、管理项和插件配置 |
| 模块依赖 | 当前 POM 的 `dependencies` | 编译与运行需要哪些制品 |

一个根 POM 可以同时作为父项目和聚合器，也可以只承担其中一个角色。把项目写进 `modules` 不会自动为它设置父 POM，更不会让其他模块自动依赖它。


## 二、订单模块关系


### 1. 聚合与继承

本篇根目录的 `pom.xml` 聚合应用和领域。下面刻意把应用放在领域之前，便于观察文本顺序与实际构建顺序的区别：

```xml
<packaging>pom</packaging>
<modules>
    <module>order-app</module>
    <module>order-domain</module>
</modules>
```

`order-app/pom.xml` 的 `parent` 指向根项目，从中继承编码、插件版本和依赖管理。`order-domain/pom.xml` 保持独立，没有该父声明，因此可以在自己的目录单独运行。


### 2. 依赖与排序

应用在自己的 POM 中声明领域依赖：

```xml
<dependency>
    <groupId>order</groupId>
    <artifactId>order-domain</artifactId>
    <version>${project.version}</version>
</dependency>
```

Reactor 必须先准备领域产物，再构建应用。父子关系同样影响有效模型与排序；最终顺序应看 Reactor 输出，而不是根据目录名或 `modules` 列表推断。

::: tip 领域保持独立
`order-domain` 只保存金额约束，不依赖命令行、日志 Provider 或库存网关。应用可以使用领域，领域无需知道应用如何输出结果。
:::


## 三、执行 Reactor

安装 JDK 21 和 Maven 3.9.11，新建空目录 `order-workspace`。以下根 POM、两个模块 POM、源码、测试和日志配置均在本篇给出；按路径创建父目录，以 UTF-8 保存。文件路径相对于 `order-workspace`。

将以下内容保存为 `pom.xml`：

::: details 查看 pom.xml 完整内容

```xml [pom.xml]
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>order</groupId>
    <artifactId>order-workspace</artifactId>
    <version>1.0.0</version>
    <packaging>pom</packaging>
    <modules>
        <module>order-app</module>
        <module>order-domain</module>
    </modules>
    <properties>
        <maven.compiler.release>21</maven.compiler.release>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <junit.version>6.1.2</junit.version>
        <slf4j.version>2.0.18</slf4j.version>
        <logback.version>1.5.38</logback.version>
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
    <build>
        <pluginManagement>
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
                        <failIfNoTests>true</failIfNoTests>
                    </configuration>
                </plugin>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-jar-plugin</artifactId>
                    <version>3.4.2</version>
                </plugin>
            </plugins>
        </pluginManagement>
    </build>
</project>
```

:::

将以下内容保存为 `order-domain/pom.xml`：

::: details 查看 pom.xml 完整内容

```xml [order-domain/pom.xml]
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>order</groupId>
    <artifactId>order-domain</artifactId>
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
            </plugin>
        </plugins>
    </build>
</project>
```

:::

将以下内容保存为 `order-domain/src/main/java/order/OrderDraft.java`：

::: details 查看 OrderDraft.java 完整内容

```java [order-domain/src/main/java/order/OrderDraft.java]
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

将以下内容保存为 `order-domain/src/test/java/order/OrderDraftTest.java`：

::: details 查看 OrderDraftTest.java 完整内容

```java [order-domain/src/test/java/order/OrderDraftTest.java]
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

将以下内容保存为 `order-app/pom.xml`：

::: details 查看 pom.xml 完整内容

```xml [order-app/pom.xml]
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>order</groupId>
        <artifactId>order-workspace</artifactId>
        <version>1.0.0</version>
        <relativePath>../pom.xml</relativePath>
    </parent>
    <artifactId>order-app</artifactId>
    <dependencies>
        <dependency>
            <groupId>order</groupId>
            <artifactId>order-domain</artifactId>
            <version>${project.version}</version>
        </dependency>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
            <version>${slf4j.version}</version>
        </dependency>
        <dependency>
            <groupId>ch.qos.logback</groupId>
            <artifactId>logback-classic</artifactId>
            <version>${logback.version}</version>
            <scope>runtime</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <configuration>
                    <failIfNoTests>false</failIfNoTests>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-jar-plugin</artifactId>
                <configuration>
                    <archive>
                        <manifest>
                            <mainClass>order.app.OrderApplication</mainClass>
                            <addClasspath>true</addClasspath>
                            <classpathPrefix>lib/</classpathPrefix>
                        </manifest>
                    </archive>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-dependency-plugin</artifactId>
                <version>3.8.1</version>
                <executions>
                    <execution>
                        <id>copy-runtime-libraries</id>
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

将以下内容保存为 `order-app/src/main/java/order/app/OrderApplication.java`：

::: details 查看 OrderApplication.java 完整内容

```java [order-app/src/main/java/order/app/OrderApplication.java]
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

将以下内容保存为 `order-app/src/main/resources/logback.xml`：

```xml [order-app/src/main/resources/logback.xml]
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

在 `order-workspace` 根目录构建应用及其 Reactor 依赖：

```powershell
mvn -ntp clean verify -pl :order-app -am
java -jar order-app/target/order-app-1.0.0.jar
```

当前示例的实际顺序为 `order-domain`、`order-workspace`、`order-app`，领域的 2 次测试通过；应用模块在本例中不另设测试。应用输出金额 `4970` 分，说明领域制品既参与编译，也在运行时被找到。

| 参数 | 选择含义 | 使用边界 |
|------|----------|----------|
| `-pl :order-app` | 选择应用模块 | 不自动构建其全部 Reactor 依赖 |
| `-am` | 加入选中项目所需的 Reactor 项目 | 不能凭空找到未参与聚合的本地源码 |
| `-amd` | 加入依赖选中项目的 Reactor 项目 | 用于检查下游影响，仍需核对所选范围 |

只运行 `-pl :order-app` 时，领域依赖如果既未由当前 Reactor 提供，也未安装或发布到可用仓库，就会解析失败。日常整组验证使用 `-am`，无需先把每个模块逐一 `install` 到本地仓库。


## 四、依赖方向与循环

如果为了复用应用工具类而让领域反向依赖应用，就会形成 `order-app → order-domain → order-app`。Reactor 无法对循环排序，业务规则也失去了独立边界。

处理时先确认这个工具类的实际职责：稳定领域能力移入领域；入口专属能力保留在应用；两个模块共享的协议可以提取为范围明确的 API。不要把所有冲突都转移到无限增长的 `common`，否则只是隐藏依赖关系。

生产模块也不能为复用测试代码反向依赖测试入口。共享测试工具应明确作为测试资产，避免进入运行依赖图。


## 五、构建模块与 Java 模块

Maven 模块是构建项目和制品，JPMS 模块由模块描述符与运行路径决定。当前 `order-domain` 是普通 JAR；是否使用模块路径、自动模块名或显式描述符，需要按[JAR 与模块系统](./06-jar-classpath-jpms.md)另行判断。

模块数量应由独立职责、依赖方向和复用需要决定。紧密相关、始终一起修改的小型代码可以保持一个模块；拆分后必须为额外的 POM、版本和公开 API 成本找到实际收益。

## 六、参考资料

- [Maven 多模块指南](https://maven.apache.org/guides/mini/guide-multiple-modules.html)
- [POM 继承](https://maven.apache.org/pom.html#Inheritance)

以上资料说明父子模型的合并规则。
