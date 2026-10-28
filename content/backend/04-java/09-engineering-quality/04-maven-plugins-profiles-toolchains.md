---
title: "Maven 构建配置"
tags: [Java, Maven, Toolchains]
excerpt: "区分插件执行、Profile、Wrapper 与 JDK 工具链的配置职责，利用订单工程验证环境检查与有效模型，避免机器路径、应用配置和构建规则互相混用。"
date: 2026-09-11
---


# Maven 构建配置

Maven 的插件决定构建做什么，Profile 表达可选择的构建差异，Wrapper 固定 Maven 发行版，Toolchains 选择插件使用的 JDK。配置问题应先定位到对应角色，再检查最终生效值。


## 一、插件与执行绑定


### 1. Goal 与 execution

插件提供 Goal；`execution` 为一次执行命名，并指定 Goal、阶段和局部配置。插件级配置提供通用默认值，执行级配置进一步约束当前执行。相同 Goal 可以用于不同执行，但重复绑定也可能让工作执行两次。

例如，应用可以把 Dependency Plugin 的 `properties` 绑定到 `initialize`，把 `copy-dependencies` 绑定到 `package`。前者为测试 Agent 提供已解析 JAR 路径，后者复制运行依赖；二者的阶段取决于消费者何时需要结果。


### 2. 管理与启用

父 POM 的 `pluginManagement` 集中管理版本和默认配置，`plugins` 声明实际使用。普通自定义插件不会因为进入管理区而自动执行；已经由 Packaging 绑定的编译、测试、打包插件可以使用管理区中的配置。

::: warning 检查实际执行日志
不能仅凭 POM 中出现某个插件就认定检查生效。应同时看到绑定的阶段、日志中的执行 ID，以及违规时的非零退出结果。
:::


## 二、Profile 的边界

Profile 适合表示可选环境校验、额外集成测试或平台打包差异。数据库密码、用户路径和业务开关不应通过多套 POM 片段维护，否则相同源码会产生难以解释的不同制品。

本篇的 `pom.xml` 提供 `verify-environment` Profile，显式启用后在 `validate` 检查构建进程版本。以下是 Profile 中 Enforcer 执行的关键配置；完整插件版本为 `3.6.2`。

::: details 查看构建环境检查配置

```xml
<execution>
    <id>check-build-runtime</id>
    <phase>validate</phase>
    <goals><goal>enforce</goal></goals>
    <configuration>
        <rules>
            <requireJavaVersion><version>[21,22)</version></requireJavaVersion>
            <requireMavenVersion><version>[3.9,4)</version></requireMavenVersion>
        </rules>
    </configuration>
</execution>
```

:::

`[21,22)` 要求构建进程处于 Java 21 版本范围。它描述本示例的构建约束，不是 Java 库对所有消费者的最低版本声明。

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
    <profiles>
        <profile>
            <id>verify-environment</id>
            <build>
                <plugins>
                    <plugin>
                        <groupId>org.apache.maven.plugins</groupId>
                        <artifactId>maven-enforcer-plugin</artifactId>
                        <version>3.6.2</version>
                        <executions>
                            <execution>
                                <id>check-build-runtime</id>
                                <phase>validate</phase>
                                <goals><goal>enforce</goal></goals>
                                <configuration>
                                    <rules>
                                        <requireJavaVersion><version>[21,22)</version></requireJavaVersion>
                                        <requireMavenVersion><version>[3.9,4)</version></requireMavenVersion>
                                    </rules>
                                </configuration>
                            </execution>
                        </executions>
                    </plugin>
                </plugins>
            </build>
        </profile>
    </profiles>
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

在本篇目录运行：

```powershell
mvn -ntp validate -Pverify-environment
mvn -ntp help:active-profiles -Pverify-environment
```

JDK 21 与 Maven 3.9.11 下，Enforcer 的 Java、Maven 版本规则通过；有效 Profile 中能看到 `verify-environment`。这里的 Profile 只作用于本篇独立 POM。聚合其他项目不会自动让它们继承当前配置。


## 三、Wrapper 与工具链


### 1. 固定 Maven

在本篇已有 POM 的目录，使用先行安装的 Maven 生成 Wrapper 3.3.4，固定后续启动的 Maven 3.9.11：

```powershell
mvn -ntp org.apache.maven.plugins:maven-wrapper-plugin:3.3.4:wrapper -Dmaven=3.9.11 -Dtype=only-script
./mvnw.cmd --version
```

生成的 `mvnw`、`mvnw.cmd` 与 `.mvn/wrapper/maven-wrapper.properties` 一起保存。`only-script` 类型不需要 Wrapper JAR；下载地址和校验配置位于 properties。第一步完成后，后续终端才可以使用 `./mvnw.cmd`。

Wrapper 固定的是 Maven，不能替代 JDK 选择。IDE 自己的 Maven 配置也可能绕过 Wrapper，因此应核对实际命令输出。


### 2. 选择插件使用的 JDK

Toolchains 将项目的 JDK 条件与机器安装路径分开。Maven 可以由一个 JDK 启动，再由支持工具链的编译、测试插件使用另一 JDK；不是所有插件都会自动采用选中工具链。

Toolchains Plugin 3.2.0 的 `select-jdk-toolchain` 直接接收 `version` 等参数。下面是插件内的局部配置，不能误写为另一个 Goal 的 `toolchains/jdk` 配置结构：

```xml
<configuration>
    <version>[21,22)</version>
    <useJdk>Never</useJdk>
</configuration>
```

`Never` 要求选出工具链，即使 Maven 当前已经由匹配 JDK 启动。真实 Java 8/21 的配置与双运行时验证由[多 JDK 与编译兼容](../14-java8-maintenance/06-multi-jdk-toolchains.md)负责；本例的 Enforcer 检查不证明工具链已经切换。


## 四、配置归属与诊断

| 配置 | 归属 | 核对方式 |
|------|------|----------|
| 插件版本与执行 | POM 或父 POM | 有效 POM、执行 ID |
| Maven 版本 | Wrapper properties | Wrapper `--version` |
| JDK 要求 | 项目工具链条件 | 插件日志、编译与测试 JVM |
| JDK 安装路径 | 本机工具链配置或发现机制 | 路径中的实际 `java -version` |
| 镜像、代理、凭据 | 用户或构建环境 Settings | 本地检查，不公开敏感输出 |
| 应用运行配置 | 应用资源或部署输入 | 启动后的实际行为 |

如果 Profile 未生效，先检查名称、`-P` 参数与激活条件；如果 JDK 检查失败，先区分 Maven 进程 JDK 与插件工具链。仅在某台机器可用的绝对路径应退出项目配置，不应通过反复增加 Profile 掩盖环境差异。

## 五、参考资料

- [Maven 插件配置](https://maven.apache.org/guides/mini/guide-configuring-plugins.html)
- [Profile](https://maven.apache.org/guides/introduction/introduction-to-profiles.html)
- [Wrapper](https://maven.apache.org/wrapper/)
- [Toolchains 选择参数](https://maven.apache.org/plugins/maven-toolchains-plugin/select-jdk-toolchain-mojo.html)

以上资料分别定义这些配置角色。
