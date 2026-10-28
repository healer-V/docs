---
title: "调试与构建检查"
tags: [Java, Maven, 调试]
excerpt: "通过订单工程串联断点、编译告警、测试报告与构建规则，复现原始类型和 JDK 版本错误，说明如何定位失败、修复根因并保留可重复的构建检查。"
date: 2026-09-11
---


# 调试与构建检查

调试用于观察一次执行中的变量与控制流，构建检查用于让同一类问题在每次构建时稳定暴露。二者回答的问题不同：断点可以解释某次金额为何算错，类型检查与测试则防止相同缺陷再次进入制品。


## 一、问题与检查入口

| 问题 | 首选证据 | 判断方式 |
|------|----------|----------|
| 输入经过哪条分支 | 断点、调用栈和局部变量 | 对照输入与业务条件 |
| 泛型或 API 用法有风险 | 编译器诊断 | 读取文件、位置和告警类别 |
| 实际结果偏离业务规则 | 测试断言和报告 | 比较期望值、实际值及触发输入 |
| 本机与构建环境不同 | Wrapper、JDK 和插件规则 | 核对真正执行构建的版本 |
| 运行后才失败 | 日志、异常链和运行依赖 | 从失败点追溯必要条件 |

先选择能缩小问题范围的证据，再修改代码。看到 `BUILD FAILURE` 只说明构建未通过；真正原因在失败模块、插件目标和首条有效诊断中。

## 二、订单流程调试

### 1. 断点与观察值

下面给出本篇需要的订单类、测试和入口。安装 JDK 21 和 Maven 3.9.11，在任意位置新建空目录。按下方路径创建父目录和 UTF-8 文件；以下命令均在这个目录执行，首次构建会下载声明的公开依赖。

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
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

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

    /**
     * 验证无效数量被拒绝且已有金额不变；只准备本次草稿，无返回值。
     *
     * @param quantity 零或负数，包含 int 最小值
     */
    @ParameterizedTest(name = "[{index}] invalid quantity={0}")
    @ValueSource(ints = {0, -1, Integer.MIN_VALUE})
    void rejectsInvalidQuantityWithoutChangingTotal(int quantity) {
        draft.addItem(1990L, 2);

        // 回调只触发目标调用，准备数据发生的异常不会被误当作预期异常。
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class, () -> draft.addItem(990L, quantity));

        assertEquals("quantity must be positive", exception.getMessage());
        assertEquals(3980L, draft.totalCents());
    }
}
```

:::

将以下内容保存为 `src/main/java/order/app/OrderApplication.java`：

::: details 查看 OrderApplication.java 完整内容

```java [src/main/java/order/app/OrderApplication.java]
package order.app;

import order.OrderDraft;

/** 提供可设置断点的订单金额入口。 */
public final class OrderApplication {
    /** 工具入口不允许实例化。 */
    private OrderApplication() { }

    /**
     * 计算订单并输出金额；非法数量时保留异常证据，无返回值。
     * @param args 空数组运行正常路径，任意一个参数触发数量为零的失败路径
     */
    public static void main(String[] args) {
        OrderDraft draft = new OrderDraft();
        try {
            draft.addItem(1990, args.length == 0 ? 2 : 0);
            draft.addItem(990, 1);
            System.out.println("totalCents=" + draft.totalCents());
        } catch (IllegalArgumentException exception) {
            System.err.println("order rejected totalCents=" + draft.totalCents());
            exception.printStackTrace();
        }
    }
}
```

:::

在 `OrderApplication.main` 创建订单及调用 `addItem` 的位置设置断点，使用无参数启动；进入领域方法后观察单价、数量和累计金额。

正常路径中两次调用分别使用 `1990 × 2` 与 `990 × 1`，金额单位为分，最终应为 `4970`。调试时比较调用前后的值和异常分支，不能只看变量名就判断金额单位。

给入口传入 `fail` 后，第一次添加商品的数量变为 `0`。断点应定位到参数校验，并确认异常被入口记录，金额仍为 `0`，第二次添加不会执行。命令行调试器的启动与断点操作见[编译、运行与调试](../01-language-foundation/06-compile-run-debug.md)。

::: warning 断点会改变时序
挂起线程会影响超时、锁竞争和任务调度。并发缺陷需要结合线程转储、事件记录或受控同步测试；一次单步执行正常不能证明并发行为正确。
:::

### 2. 保留回归证据

找到原因后，把输入与预期行为写入稳定的测试。订单领域的非法数量测试检查抛出的异常及原状态；这比只断言某个私有方法被调用更能保护业务契约。

测试报告在本篇目录的 `target/surefire-reports/`。阅读失败类、方法、参数化输入和异常根因；不要只统计绿色用例数量。具体断言与测试发现规则见[JUnit 测试](./08-junit.md)。


## 三、编译告警


### 1. 原始类型失败

`RawOrders.java` 故意省略集合元素类型，用于观察静态检查。将下面的完整文件保存在新建目录根部，它不会进入 Maven 的 `src/main/java` 正常源码集。

将以下内容保存为 `RawOrders.java`：

::: details 查看 RawOrders.java 完整内容

```java [RawOrders.java]
import java.util.ArrayList;
import java.util.List;

/** 故意保留原始类型，演示编译告警如何阻止构建；不是生产写法。 */
public final class RawOrders {
    /** 禁止实例化命令行示例。 */
    private RawOrders() { }

    /**
     * 构造缺少元素类型约束的订单编号集合。
     * @param args 不读取命令行参数
     */
    public static void main(String[] args) {
        List orders = new ArrayList();
        orders.add("ORD-1001");
        System.out.println(orders.get(0));
    }
}
```

:::


在本篇目录编译错误示例。`-Xlint:all` 开启告警，`-Werror` 让告警导致非零退出：

```powershell
javac "-J-Duser.language=en" --release 21 -encoding UTF-8 -Xlint:all -Werror -d out RawOrders.java
```

诊断包含两条 `rawtypes`、一条 `unchecked`，以及以下失败结论；具体位置以文件输出为准：

```text
error: warnings found and -Werror specified
1 error
3 warnings
```

### 2. 类型约束恢复

在同一目录保存正确文件。它使用 `List<String>` 和菱形推断，使添加与读取受元素类型检查。

将以下内容保存为 `TypedOrders.java`：

::: details 查看 TypedOrders.java 完整内容

```java [TypedOrders.java]
import java.util.ArrayList;
import java.util.List;

/** 使用元素类型约束修复原始类型告警。 */
public final class TypedOrders {
    /** 禁止实例化命令行示例。 */
    private TypedOrders() { }

    /**
     * 输出一个类型检查通过的订单编号。
     * @param args 不读取命令行参数
     */
    public static void main(String[] args) {
        List<String> orders = new ArrayList<>();
        orders.add("ORD-1001");
        System.out.println(orders.get(0));
    }
}
```

:::

保持相同编译选项重新编译并执行：

```powershell
javac --release 21 -encoding UTF-8 -Xlint:all -Werror -d out TypedOrders.java
java -cp out TypedOrders
```

输出应为 `ORD-1001`，编译退出码为 `0`。这证明类型问题已修复；删除 `-Werror` 只会改变构建是否拒绝告警，不会修复类型缺口。

上方 Maven POM 在 Compiler Plugin 中使用同样的告警策略，并增加文档注释检查。更广的静态分析可补充空值、资源和安全规则，但需说明规则版本、报告入口和误报处理，不能用工具数量代替有效反馈。


## 四、构建环境规则

### 1. 版本不匹配

上方 POM 的 `verify-environment` profile 使用 Enforcer 3.6.2，将构建 JVM 限定为 Java 21、Maven 限定为 3.9 系列。以下是该插件的局部规则配置，完整执行绑定已在上方 POM 给出：

```xml
<rules>
    <requireJavaVersion><version>[21,22)</version></requireJavaVersion>
    <requireMavenVersion><version>[3.9,4)</version></requireMavenVersion>
</rules>
```

在已安装 JDK 11 的终端中把 `JAVA_HOME` 临时指向它，在本篇目录执行：

```powershell
mvn -ntp validate -Pverify-environment
```

规则应报告 `RequireJavaVersion failed`，并给出实际版本不在 `[21,22)` 内的原因。`validate` 使环境问题在编译和测试之前暴露；本次核验使用 JDK 11.0.32 复现了该失败。

### 2. 修复与复查

将当前终端 `JAVA_HOME` 恢复到 JDK 21，先用 Maven 的 `-v` 确认它真正使用的 JVM，再执行完整检查：

```powershell
mvn -v
mvn -ntp clean verify -Pverify-environment
```

预期单个工程成功，本文金额测试运行 5 次（包含三组非法数量）。`clean` 清理旧编译产物，避免已删除的资源留在 `target/` 中干扰结论。

::: tip 修复后保留同一检查入口
环境错误修复后继续执行原规则；业务缺陷修复后继续运行触发它的测试及受影响回归。确需豁免时，应限定规则、位置、原因和复查条件，避免全局关闭反馈。
:::


## 五、制品与验证边界

本地 `verify` 成功证明当前源码、依赖和测试在指定环境下通过检查。它不自动证明数据库兼容性、部署配置、生产负载或外部服务契约正确。

发布前应使用实际制品验证启动入口和运行依赖，保留版本及报告。当前示例可用 `java -jar target/order-app-1.0.0.jar` 验证 `totalCents=4970`，追加 `fail` 则输出拒绝信息与数量异常；目录结构、依赖复制与 Manifest 解释见[JAR 与模块系统](./06-jar-classpath-jpms.md)。

## 六、参考资料

- [`javac` 诊断选项](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html)
- [Enforcer Java 版本规则](https://maven.apache.org/enforcer/enforcer-rules/requireJavaVersion.html)
- [Surefire 报告](https://maven.apache.org/surefire/maven-surefire-plugin/)

以上资料分别定义静态检查、环境约束与测试反馈。
