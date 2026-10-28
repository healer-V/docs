---
title: "JUnit 单元测试"
tags:
  - Java
  - JUnit
  - Maven
  - 单元测试
excerpt: "用 Java 21 与固定版本 Maven 工程验证订单金额契约，解释 JUnit 生命周期、断言、参数化与异常测试，并通过真实 Surefire 报告区分测试失败、未预期异常和零测试问题。"
date: 2026-09-11
---


# JUnit 单元测试

JUnit 单元测试把一个可观察的行为契约写成自动检查：给定明确输入，执行被测代码，再断言返回值、对象状态或异常。测试是否有价值取决于它能否发现行为错误，不能只看方法有没有执行、构建有没有变绿。


## 一、单元边界与 JUnit 运行角色

订单草稿接收商品单价和数量，累计同币种金额。这个对象没有网络、数据库和时钟依赖，可以直接创建真实对象测试；引入 Spring 容器或 Mock（模拟依赖的测试替身）不会让金额规则得到更强的证明。

| 行为契约 | 具体输入与观察 | 测试要回答的问题 |
|---|---|---|
| 初始金额为零 | 新建草稿，读取 `totalCents()` | 是否存在上次操作残留的状态 |
| 按分累计商品金额 | 1990 分 × 2，加 990 分 × 1，得到 4970 分 | 不同商品是否正确累计 |
| 单价非负、数量为正 | 零单价合法，零数量非法 | 业务边界是否被明确区分 |
| 溢出和校验失败不修改旧金额 | 在已有金额的草稿上加入无效商品 | 是否拒绝输入且保持原状态 |

JUnit 6.1.2 中，测试源码仍然使用 `org.junit.jupiter` 包名。运行链路包含三类角色，版本号、包名和 Maven 插件不能混为一谈。

| 角色 | 职责 | 在工程中的入口 |
|---|---|---|
| JUnit Jupiter | 提供 `@Test`、生命周期、参数化 API，以及发现这些测试的引擎 | `junit-jupiter` 测试依赖 |
| JUnit Platform | 接收测试发现和执行请求，调度测试引擎 | 由构建工具或 IDE 启动 |
| Maven Surefire | 在 Maven 的 `test` 阶段启动测试，生成报告并决定该阶段是否失败 | `maven-surefire-plugin` |

::: warning 只有测试注解不能形成执行链路

只有测试注解和 API，没有匹配的测试引擎，不能形成完整执行链路。这里的 `junit-jupiter` 聚合依赖包含 API、参数化支持和引擎；不需要为新测试引入迁移旧 JUnit 3/4 所用的 Vintage。

:::


## 二、固定版本的 Maven 工程

### 1. 环境与文件职责

安装 JDK 21 和 Maven 3.9.11，新建空目录 `order-domain`。按下方路径创建目录并保存 UTF-8 文件，所有命令在这个新建目录执行。下列版本是这份示例的复现基线，不表示依赖的最新版本。

| 组成 | 固定版本或条件 | 作用 |
|---|---|---|
| JDK | Java 21；实测 Amazon Corretto 21.0.11 | 编译和运行测试，不使用预览特性 |
| Maven / Wrapper | Maven 3.9.11 / Wrapper 3.3.4 | Wrapper 固定 Maven 发行版并校验下载文件 |
| JUnit | BOM（依赖版本清单）与 Jupiter 6.1.2 | 对齐 JUnit 依赖版本 |
| Compiler / Surefire | 3.14.1 / 3.5.4 | Java 21 编译与单元测试执行 |
| Clean / Resources / JAR | 3.4.1 / 3.3.1 / 3.4.2 | 固定 `clean verify` 实际使用的其他插件 |
| 外部条件 | 首次运行能访问 Maven Central，JDK 21 已安装 | 下载 Maven 及依赖；测试本身不访问外部服务 |

::: info Wrapper 不负责选择 Java 运行环境

JUnit 6 运行时要求 Java 17 或以上；这里明确使用 Java 21。`maven.compiler.release=21` 约束语言、字节码和可用 Java SE API，不负责安装或选择 JDK。Wrapper 同样只固定 Maven，应先检查它实际显示的 Java 版本。

:::

工程中的文件承担以下职责，路径均相对于 `order-domain/`：

| 文件 | 职责 |
|---|---|
| `pom.xml` | 依赖、插件和编译目标 |
| `mvnw`、`mvnw.cmd`、`.mvn/wrapper/maven-wrapper.properties` | 官方生成的启动脚本与发行版校验配置 |
| `src/main/java/order/OrderDraft.java` | 被测业务对象 |
| `src/test/java/order/OrderDraftTest.java` | 默认执行的正常测试 |
| `src/test/java/order/OrderDraftFailureExample.java` | 显式选择时才执行的教学反例 |
| `target/surefire-reports/` | 每次测试生成的文本与 XML 报告，不纳入源码 |


### 2. POM 与测试发现

POM（项目对象模型）是 Maven 描述项目、依赖和插件的配置。BOM 只管理依赖版本，真正把 Jupiter 加入测试类路径的是 `dependencies`；`test` 作用域避免将测试框架作为业务运行依赖。

完整配置位于 `pom.xml`。其中 `maven.compiler.release=21` 固定编译目标，Surefire 的 `failIfNoTests=true` 将未发现测试视为构建失败；其他插件版本也显式固定，使 `clean verify` 的执行环境能够复现。

::: details 查看订单测试工程的完整 pom.xml

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
</project>
```

:::

Surefire 默认按 `Test*`、`*Test`、`*Tests`、`*TestCase` 等类名模式选择测试，再由 Jupiter 识别测试方法。因此 `OrderDraftTest` 会被执行，`OrderDraftFailureExample` 不在默认集合内；它是明确隔离的故障演示，不能照此命名正式回归测试。

::: warning 发现测试不等于存在有效断言

`failIfNoTests=true` 是本工程主动设置的约束，Surefire 3.5.4 的该选项默认值是 `false`。它能阻止“一个测试也没发现”的成功构建，但不能发现“测试存在却没有有效断言”。

:::


### 3. Wrapper 与执行环境

在保存 POM 后，先用已安装的 Maven 生成官方 Wrapper 脚本：

```powershell
mvn -ntp org.apache.maven.plugins:maven-wrapper-plugin:3.3.4:wrapper -Dmaven=3.9.11 -Dtype=only-script
```

生成的 `mvnw`、`mvnw.cmd` 与 `.mvn/wrapper/maven-wrapper.properties` 共同构成启动入口。将 properties 中同名项调整为以下值，保留生成文件中的其他配置：

```properties
wrapperVersion=3.3.4
distributionType=only-script
distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.11/apache-maven-3.9.11-bin.zip
distributionSha256Sum=0d7125e8c91097b36edb990ea5934e6c68b4440eef4ea96510a0f6815e7eeadb
```

该 SHA-256 来自 Maven Central 的对应 ZIP，计算前已核对官方发布的 SHA-512。修改 Maven 版本时需要同时核对发行包与校验值；不能删除校验来绕过下载错误。

在自行创建的 `order-domain/` 目录中打开 Windows PowerShell，执行下面的版本检查。此目录应已包含本节保存的 `pom.xml` 和刚生成的 Wrapper；如需选择 JDK，先调整当前终端的 `JAVA_HOME`。

```powershell
./mvnw.cmd --version
if ($LASTEXITCODE -ne 0) { throw 'Maven Wrapper 启动失败' }
```

实测版本输出包含以下关键字段，省略随机器变化的安装路径：

```text
Apache Maven 3.9.11
Java version: 21.0.11, vendor: Amazon.com Inc.
```

macOS/Linux 可通过同工程的 `sh ./mvnw` 启动；本次实际运行与报告来自 Windows，未将其他操作系统标为已验证。完整的 Maven 插件、Profile 与 Toolchains 模型见[插件与环境配置](./04-maven-plugins-profiles-toolchains.md)，此处只保留运行测试所需配置。


## 三、被测对象的金额契约

草稿只累计以分表示的金额，不承担币种转换、税费和折扣。用整数不等于不会出错：单价与数量相乘，以及向旧总额累加，都需要拒绝超出 `long` 范围的结果。整数与精度的区别可参照[BigInteger 与 BigDecimal](../04-core-apis/04-big-numbers.md)。

下面是完整 `src/main/java/order/OrderDraft.java`。校验和计算都在赋值之前完成，因此失败后保留旧金额；这是可以通过公开 API 检查的契约。

::: details 查看 OrderDraft 金额校验与累计的完整实现

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

“失败后金额不变”只描述单次调用的对象状态，不意味着线程安全或数据库事务。测试也不应断言内部必须调用 `Math.addExact`，而应断言溢出被拒绝且旧总额保留，这样等价实现可以自由重构。


## 四、测试生命周期与行为断言

### 1. 每次调用建立独立状态

JUnit Jupiter 默认使用 `PER_METHOD`：每次测试方法执行前创建测试类实例。参数化测试的每次调用也具有各自的测试生命周期。`@BeforeEach` 在每次调用前准备状态，`@AfterEach` 在调用后承担必要清理。

本例在 `@BeforeEach` 中新建草稿，把“每次从零开始”的准备动作集中到一个位置。字段初始化也可以完成这种简单准备；这里显式展示生命周期钩子的触发位置。对象不持有文件或连接，因此不增加无事可做的 `@AfterEach`。

| 生命周期配置 | 适用职责 | 需要注意的状态边界 |
|---|---|---|
| `@BeforeEach` / `@AfterEach` | 每次调用的准备与资源清理 | 参数化数据每行都会触发，不能依赖前一行结果 |
| `@BeforeAll` / `@AfterAll` | 测试类级别的准备与清理 | 默认 `PER_METHOD` 下通常使用静态方法；共享可变业务对象会破坏隔离 |
| `@TestInstance(PER_CLASS)` | 让同一测试类实例服务所有方法 | 实例字段随之共享，需要重新评估和重置状态，不是修复顺序依赖的办法 |

::: warning 新建测试实例不会重置外部状态

新建测试实例不会清除静态字段、磁盘文件或外部系统。对象独立只是隔离的一层，不能把默认生命周期当成所有资源自动重置的保证。

:::


### 2. 完整测试与断言职责

行为测试先准备条件（Arrange），再执行目标动作（Act），最后断言结果（Assert）。`addsDifferentItems` 在已有商品的草稿上加入另一商品，检查累计金额是否符合独立给定的期望值；每个阶段只承担一种职责，失败时才能判断是准备条件、目标调用还是结果断言出了问题。

以下片段摘自 `src/test/java/order/OrderDraftTest.java`，只展示该测试方法；省略了类声明、导入、`draft` 字段和为它创建空草稿的 `@BeforeEach`，不能单独编译。

```java
/** 验证不同商品累计后的订单总额；只修改本次草稿，无返回值。 */
@Test
void addsDifferentItems() {
    draft.addItem(1990L, 2);

    draft.addItem(990L, 1);

    assertEquals(4970L, draft.totalCents());
}
```

第一次加入商品是准备条件，第二次加入是被检查的动作。断言中的 4970 分来自业务规则：1990 分乘 2，再加 990 分。若结果不同，断言会报告期望值与实际值，不能只凭方法正常返回判断金额正确。

同一文件的完整测试类还包含初始状态、参数化计价、无效输入和溢出保护。完整代码保留全部导入、准备方法和断言，可在本篇新建的 Maven 目录内运行。

::: details 查看 OrderDraftTest 生命周期与金额契约的完整测试

```java [src/test/java/order/OrderDraftTest.java]
package order;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
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
     * 验证同一计价契约的普通值、零单价和整数上界；只修改本次草稿，无返回值。
     *
     * @param unitPriceCents 非负单价，单位为分
     * @param quantity 正整数数量，本组输入保证乘积不溢出
     * @param expectedCents 独立给定的期望总额，单位为分，不在断言中重算被测算法
     */
    @ParameterizedTest(name = "[{index}] price={0}, quantity={1}, expected={2}")
    @CsvSource({
            "1990, 2, 3980",
            "0, 3, 0",
            "1, 1, 1",
            "1, 2147483647, 2147483647",
            "9223372036854775807, 1, 9223372036854775807"
    })
    void calculatesItemTotal(long unitPriceCents, int quantity, long expectedCents) {
        draft.addItem(unitPriceCents, quantity);

        assertEquals(expectedCents, draft.totalCents());
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

    /** 验证负单价被拒绝且已有金额不变；只准备本次草稿，无返回值。 */
    @Test
    void rejectsNegativePriceWithoutChangingTotal() {
        draft.addItem(1990L, 2);

        // 回调只调用负单价分支，由 JUnit 检查异常类型。
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class, () -> draft.addItem(-1L, 1));

        assertEquals("unitPriceCents must not be negative", exception.getMessage());
        assertEquals(3980L, draft.totalCents());
    }

    /** 验证单项乘法溢出被拒绝且已有金额不变；只准备本次草稿，无返回值。 */
    @Test
    void rejectsItemOverflowWithoutChangingTotal() {
        draft.addItem(1990L, 2);

        // 回调制造单项金额溢出；不绑定 JDK 的异常消息文本。
        assertThrows(ArithmeticException.class, () -> draft.addItem(Long.MAX_VALUE, 2));

        assertEquals(3980L, draft.totalCents());
    }

    /** 验证累计金额溢出被拒绝且旧总额保留；只修改本次草稿，无返回值。 */
    @Test
    void rejectsTotalOverflowWithoutChangingTotal() {
        draft.addItem(Long.MAX_VALUE, 1);

        // 回调制造累加溢出，单项金额本身仍然有效。
        assertThrows(ArithmeticException.class, () -> draft.addItem(1L, 1));

        assertEquals(Long.MAX_VALUE, draft.totalCents());
    }
}
```

:::

::: tip 期望值应独立于被测计算过程

`assertEquals(expected, actual)` 的顺序会影响失败消息，不能颠倒。每个期望金额都是从业务规则独立得到的固定值；如果在测试中复制生产代码的乘法和累加过程，同一个错误就可能同时出现在实现与断言中。

:::

测试类和方法可以是包可见的，不能是 `private`；普通测试方法不返回业务值，返回值和状态应通过断言检查。选择断言时，先确定要检查的是值、身份还是一组独立结果：

| 断言 | 检查对象 | 使用边界 |
|---|---|---|
| `assertEquals` | 两个值是否相等 | 本例用于金额；第一个参数是期望值，第二个是实际值 |
| `assertSame` | 两个引用是否指向同一对象 | 不用于代替金额或其他值的相等判断 |
| `assertArrayEquals` | 数组内容是否相等 | 需要比较数组元素时使用 |
| `assertAll` | 一组独立断言 | 不把依赖前一项成功的检查放进独立执行组 |

存在先后依赖的检查应保持顺序，例如先确认对象非空，再读取其字段。这样失败报告才能直接指出前置条件不成立，避免后续空指针异常干扰判断。


## 五、参数化输入与异常验证

### 1. 同一行为的多组输入

`@ParameterizedTest` 描述可重复调用的测试方法，数据源决定输入。`@CsvSource` 的每行被转换为方法参数类型并执行一次，本例三列依次对应 `long` 单价、`int` 数量、`long` 期望金额。`@ValueSource` 适合只有一列简单数据的场景。

| 数据组 | 为什么保留 | 对应观察 |
|---|---|---|
| 1990 × 2 | 普通计价 | 总额为 3980 分 |
| 0 × 3 | 免费商品与无效数量不能混淆 | 零单价被接受 |
| 1 × 1 | 最小正整数 | 单位与边界一致 |
| 1 × `Integer.MAX_VALUE` | 数量上界 | 不先在 `int` 中产生错误结果 |
| `Long.MAX_VALUE` × 1 | 单价和结果上界 | 最大合法金额不被误拒绝 |
| 数量 0、-1、`Integer.MIN_VALUE` | 非正数量边界 | 每次均抛异常且旧金额不变 |

::: tip 参数化数据应验证同一种行为

每行数据必须验证同一种行为，不应在一个参数化方法中按输入分支决定“这行成功、那行抛异常、另一行再调用其他 API”。成功计价与无效数量分别建方法，报告可以直接对应失败规则。

:::

`name` 中保留关键输入可帮助 IDE 和支持显示名的报告定位数据；Surefire XML 中也能通过方法签名和调用序号区别各次执行。这样遇到参数化测试失败时，可以先找到对应输入，再判断违反了哪条计价约束。

复杂对象或无法自然写成 CSV 的输入可以用 `@MethodSource`，但不要为本来只有三个数值的规则引入数据构造框架。参数源无法转换、参数数量不匹配属于测试定义问题，和被测金额计算失败应分别定位。


### 2. 异常是可验证的公开结果

`assertThrows` 要求回调抛出指定异常或其子类，并返回捕获到的异常。没有异常、类型不匹配都会让断言失败。只有公开契约要求精确类型时，才使用不接受子类的 `assertThrowsExactly`；不要用 `Exception.class` 接受范围过宽的错误。

`rejectsInvalidQuantityWithoutChangingTotal` 将验证拆成三个相互相关的事实：调用拒绝无效数量、异常指出数量规则、已有 3980 分金额保持不变。只检查异常类型不足以证明后两项，需要继续读取异常对象和草稿状态。

以下片段摘自 `src/test/java/order/OrderDraftTest.java` 的同名方法，只保留方法体；省略了导入、方法声明、参数源和创建空草稿的 `@BeforeEach`。其中 `quantity` 来自 `@ValueSource` 的 0、-1 或 `Integer.MIN_VALUE`，片段不能单独编译。

```java
draft.addItem(1990L, 2);

// 回调只触发目标调用，准备数据发生的异常不会被误当作预期异常。
IllegalArgumentException exception = assertThrows(
        IllegalArgumentException.class, () -> draft.addItem(990L, quantity));

assertEquals("quantity must be positive", exception.getMessage());
assertEquals(3980L, draft.totalCents());
```

::: tip 异常断言只包裹被检查的动作

准备草稿放在回调外，因此准备阶段抛出的异常会直接让测试报错，不会被误认成预期的拒绝行为。`assertThrows` 返回后继续检查消息与金额，才能发现“抛出了正确异常，但已经改坏旧状态”的实现。

:::

异常消息只在它属于稳定契约时逐字断言。本例自定义的数量与单价消息是固定文本；`ArithmeticException` 的 JDK 实现消息不属于订单对外约定，因此溢出测试只验证类型与对象状态。不要捕获异常后留空 `catch`，那会让“没有真正验证失败”的代码显示为通过。


## 六、执行测试与读取 Surefire 报告


### 1. 完整测试与构建结果

在 `order-domain/` 下执行以下命令。`clean` 删除旧产物，`verify` 会经过编译、测试和打包；这个 POM 没有配置数据库集成测试或其他质量插件，不能把阶段名称当作这些检查已经执行的证据。

```powershell
./mvnw.cmd -B -ntp clean verify
if ($LASTEXITCODE -ne 0) { throw '订单工程验证失败，请检查 Surefire 报告' }
Get-Content target/surefire-reports/order.OrderDraftTest.txt
```

实测 Maven 退出码为 `0`，终端摘要中的关键行如下，省略耗时和下载信息：

```text
[INFO] Tests run: 13, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

13 次执行来自 5 个普通测试、5 行计价参数和3行无效数量参数，不等于 13 个 Java 方法。`@BeforeEach` 不计入测试数量。

| 产物 | 能证明什么 | 不能据此推断什么 |
|---|---|---|
| `target/surefire-reports/order.OrderDraftTest.txt` | 当前测试类的执行数、失败与错误摘要 | 不能证明没有断言遗漏 |
| `target/surefire-reports/TEST-order.OrderDraftTest.xml` | 每次调用、失败堆栈以及聚合计数，便于工具读取 | XML 不是 HTML 页面，也不等于覆盖率报告 |
| `target/order-domain-1.0.0.jar` | 业务类被打包成普通库 JAR | 没有 `main` 入口，不是可直接 `java -jar` 启动的应用 |

::: warning 测试报告需要核对并按需提取

XML 中的 `tests`、`failures`、`errors`、`skipped` 必须结合退出码和具体测试名检查。该正常测试的计数为 `13 / 0 / 0 / 0`。报告中的本机路径、JVM 属性和环境信息不适合原样贴到公开问题单，只提取必要的计数、异常和业务代码位置。

:::


### 2. 定位单个方法与依赖版本

只复现计价数据时可以选择方法，参数化方法的全部数据行仍会执行。PowerShell 中将含 `#` 的参数整体加引号：

```powershell
./mvnw.cmd -B -ntp clean test '-Dtest=OrderDraftTest#calculatesItemTotal'
if ($LASTEXITCODE -ne 0) { throw '参数化计价测试失败' }
```

本次选择得到以下摘要，退出码为 `0`：

```text
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

怀疑 IDE 和命令行使用不同 JUnit 版本时，先从 POM 与实际依赖树定位。下面固定 Dependency Plugin 的版本，过滤业务工程中的 JUnit 依赖；过滤不包括 Surefire 插件自己的全部运行依赖。

```powershell
./mvnw.cmd -B -ntp org.apache.maven.plugins:maven-dependency-plugin:3.8.1:tree '-Dincludes=org.junit.jupiter:*,org.junit.platform:*'
if ($LASTEXITCODE -ne 0) { throw '依赖树解析失败' }
```

树中的 Jupiter API、Params、Engine 与 Platform Commons、Engine 均应为 `6.1.2`，作用域为 `test`。仅修改 IDE 的运行配置不会改变 Maven 使用的 POM。


## 七、失败报告、零测试与隔离问题

### 1. 断言失败与未预期异常

下面是完整 `src/test/java/order/OrderDraftFailureExample.java`。它是故意保留的教学反例，类名不匹配默认发现规则；只有显式选择它时才运行。

::: details 查看断言失败、未预期异常和缺少断言的完整反例

```java [src/test/java/order/OrderDraftFailureExample.java]
package order;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * 显式运行的教学反例；类名不匹配 Surefire 默认发现规则。
 * 使用 -Dtest=OrderDraftFailureExample 单独观察失败报告，不作为正常测试套件。
 */
class OrderDraftFailureExample {
    /** 故意写错独立期望值，触发断言失败；无返回值，不修改外部状态。 */
    @Test
    void wrongExpectedTotal() {
        OrderDraft draft = new OrderDraft();
        draft.addItem(1990L, 2);
        draft.addItem(990L, 1);

        assertEquals(4990L, draft.totalCents());
    }

    /** 故意让未声明为预期的业务异常逃出测试，触发测试错误；无返回值。 */
    @Test
    void unexpectedException() {
        OrderDraft draft = new OrderDraft();
        draft.addItem(990L, 0);
    }

    /** 教学反例：没有结果断言的测试仍可通过，只能证明调用未抛异常；无返回值。 */
    @Test
    void missingAssertion() {
        OrderDraft draft = new OrderDraft();
        draft.addItem(1990L, 2);
    }
}
```

:::

用以下命令触发并保存退出码。这里明确预期构建失败；不能用最后一个成功的 `Get-Content` 掩盖 Maven 的结果。

```powershell
./mvnw.cmd -B -ntp clean test '-Dtest=OrderDraftFailureExample'
$diagnosticExit = $LASTEXITCODE
if ($diagnosticExit -ne 1) { throw "故障演示预期退出 1，实际为 $diagnosticExit" }
Get-Content target/surefire-reports/order.OrderDraftFailureExample.txt
```

实测 Maven 退出 `1`，摘要与两条错误的核心信息如下；完整堆栈保存在对应报告中：

```text
Tests run: 3, Failures: 1, Errors: 1, Skipped: 0
org.opentest4j.AssertionFailedError: expected: <4990> but was: <4970>
java.lang.IllegalArgumentException: quantity must be positive
[INFO] BUILD FAILURE
```

| 测试方法 | 结果与证据 | 正确处理 |
|---|---|---|
| `wrongExpectedTotal` | XML 的 `failure` 元素；金额预期与实际不同 | 先独立核对计价规则，本例应为 4970；真实问题不能直接把实际值复制成预期 |
| `unexpectedException` | XML 的 `error` 元素；数量为零导致异常逃出测试 | 如果验证拒绝规则，用 `assertThrows`；如果验证正常计价，修正输入 |
| `missingAssertion` | 方法正常返回，报告显示通过 | 增加 `assertEquals(3980L, draft.totalCents())`；通过只说明没有异常，不证明结果正确 |

这也说明“业务预期的异常”不等于测试失败：正常套件中由 `assertThrows` 检查的异常会让测试通过；未被声明为预期的异常才会成为错误。

### 2. 没有发现测试

类名不符合约定、文件放错目录或错误的筛选参数，都会改变测试发现结果。下面临时用不存在的类名模式过滤全部测试，源码和 POM 不发生修改：

```powershell
./mvnw.cmd -B -ntp clean test '-Dsurefire.includes=**/NoMatchingTest.java'
$discoveryExit = $LASTEXITCODE
if ($discoveryExit -ne 1) { throw "零测试演示预期退出 1，实际为 $discoveryExit" }
```

本例因 `failIfNoTests=true` 退出 `1`，错误信息包含 `No tests were executed!`。如果使用 `-Dtest=MissingOrderTest` 显式点名不存在的测试，则由 Surefire 的 `failIfNoSpecifiedTests` 规则处理；这两个选项不是同一个开关。

::: warning 不能通过跳过测试消除发现失败

定位时依次核对测试源目录、类名模式、Jupiter 注解导入、测试引擎依赖和筛选参数。不要把 `failIfNoTests` 改为 `false`、加 `-DskipTests` 或忽略测试失败来消除告警，否则无法证明任何订单规则得到执行。

:::

### 3. 顺序依赖与恢复验证

测试默认执行顺序不应成为业务前置。方法名单独运行失败、整个测试类却通过，通常意味着共享状态或隐含准备步骤；通过 `@Order` 把方法排好不能解决这种依赖。

| 脆弱写法 | 失败原因 | 对应处理 |
|---|---|---|
| 静态草稿由多个测试累加 | 新建测试实例仍共用静态对象 | 每次创建独立业务对象 |
| 一个测试先加入商品，另一个测试读取其结果 | 单独执行后一个方法时缺少前置动作 | 在当前测试内准备所需状态 |
| 精确断言私有方法调用次数 | 合法重构会改变内部步骤 | 断言金额、异常和稳定协作边界 |
| 直接用当前日期或随机输入断言固定结果 | 输入不可控，失败难重现 | 显式传入时间或固定可重放数据 |

前面的单方法选择和参数化调用可用于检查独立性；还可以用随机方法顺序辅助暴露问题，但一次通过并不证明不存在全部顺序或并发问题。

故障示例无需回滚外部系统，正常测试对象也没有跨进程状态。结束诊断后执行完整入口，清除旧报告并恢复正式产物：

```powershell
./mvnw.cmd -B -ntp clean verify
if ($LASTEXITCODE -ne 0) { throw '恢复后的完整验证失败' }
```

此时应重新得到 13 次正常测试全部通过，故障类不再执行。读取报告前先核对当前命令与测试类，不能把上次的绿色报告当作这次的结果。

## 八、验证范围与官方依据

这份工程验证了 JVM 内的订单金额契约、测试隔离方式和 Maven 失败反馈。测试与打包均已在上述 Java 21、Maven 和插件版本下实际执行，故意失败与零测试命令也分别核对了退出码与原因。

::: info 单元测试成功不代表工程能力全部就绪

它没有数据库集成测试、并发保证、覆盖率阈值、性能基准和发布流程；JUnit 成功不能证明这些能力。Mockito 的外部协作替身、Gradle 的测试配置及通用质量插件分别保留给对应工程主题，不为解释一个金额测试引入额外框架。

:::

以下资料于 2026-09-10 核对。JUnit 使用固定版本页面，Maven 插件行为尽量链接到同版本归档。

| 官方来源 | 对应事实 |
|---|---|
| [JUnit 6.1.2 概述](https://docs.junit.org/6.1.2/overview.html) | Platform、Jupiter 和 Java 运行要求 |
| [JUnit 6.1.2 构建支持](https://docs.junit.org/6.1.2/running-tests/build-support.html) | BOM、测试引擎、Maven 集成与类名发现 |
| [JUnit 测试实例生命周期](https://docs.junit.org/6.1.2/writing-tests/test-instance-lifecycle.html) | PER_METHOD、PER_CLASS 与共享状态 |
| [JUnit 断言](https://docs.junit.org/6.1.2/writing-tests/assertions.html) | 结果与异常断言、组合断言 |
| [JUnit 参数化测试](https://docs.junit.org/6.1.2/writing-tests/parameterized-classes-and-tests.html) | 数据源、类型转换、每次调用的生命周期 |
| [Surefire 3.5.4 test 参数](https://maven.apache.org/surefire-archives/surefire-3.5.4/maven-surefire-plugin/test-mojo.html) | 发现规则、报告、failIfNoTests 与 failIfNoSpecifiedTests |
| [Compiler 3.14.1 release 配置](https://maven.apache.org/plugins-archives/maven-compiler-plugin-3.14.1/examples/set-compiler-release.html) | 编译目标与 JDK 选择的边界 |
| [Apache Maven Wrapper](https://maven.apache.org/wrapper/) | 生成方式、发行版固定与 SHA-256 校验 |
