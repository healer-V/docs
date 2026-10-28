---
title: "Gradle 构建基础"
tags: [Java, Gradle, Maven]
excerpt: "从 Maven 工程对照理解 Gradle 项目、任务、插件与依赖配置，使用固定版本 Wrapper 构建同一份订单源码和测试，说明迁移时需要保持的行为及任务依赖边界。"
date: 2026-09-11
---


# Gradle 构建基础

Gradle 通过插件和构建脚本建立项目模型，再根据任务依赖执行构建。阅读脚本时，首先找出项目边界、应用的插件、依赖配置和任务入口；脚本行号不能直接表示任务执行顺序。


## 一、项目与任务

| Maven 概念 | Gradle 对应入口 | 需要区分的行为 |
|------------|----------------|----------------|
| 聚合模块 | `settings.gradle.kts` 中的项目声明 | 项目身份与包含关系在设置阶段确定 |
| POM 与插件配置 | `build.gradle.kts` | Kotlin DSL 配置构建模型，并非普通业务入口 |
| 生命周期阶段 | 插件提供的任务及任务依赖 | Gradle 没有完全等同 Maven 的固定阶段链 |
| 依赖 scope | `implementation` 等 configuration | 消费、解析与 API 暴露需按插件语义区分 |
| Wrapper | `gradlew`、`gradlew.bat` | 固定 Gradle 分发版本，仍需配置 JDK |

初始化阶段确定项目，配置阶段建立任务模型，执行阶段运行所选任务及其依赖。配置缓存可以复用部分配置结果，但不会让没有依赖关系的任务自动有顺序保证。

Java 插件提供 `compileJava`、`test`、`jar`、`check`、`build` 等任务。`build` 连接组装与检查，单独执行 `jar` 不能假设测试一定运行。用 `tasks --all` 查看实际任务，用 `build --dry-run` 检查计划，不凭任务名猜测覆盖范围。


## 二、依赖配置

### 1. 编译与运行

`implementation` 声明当前实现所需的依赖，`runtimeOnly` 声明只在运行时需要的组件。测试使用 `testImplementation` 和 `testRuntimeOnly`，避免把测试引擎发布到应用运行目录。

应用 `java-library` 插件时，`api` 用于必须暴露给消费者编译接口的依赖。不要把所有依赖都改成 `api`；公开依赖越多，消费者越容易被实现变化影响。


### 2. BOM 与冲突

`platform(...)` 可以引入 Maven BOM 约束，保持同一组件族的版本一致。它解决版本协同，不会自动添加 BOM 中所有库。

冲突解析、约束和强制版本的语义需要按 Gradle 模型判断，不能套用 Maven 的“最近路径”规则。出现不符合预期的版本时，使用 `dependencies` 看解析结果，再用 `dependencyInsight` 解释来源和选择理由。

## 三、订单工程配置


### 1. 固定 Wrapper

先安装 JDK 21 和 Gradle 9.0.0，新建空目录。以下配置、源码和测试全部保存在这个目录，使用 UTF-8 编码；每条文件路径所需的父目录也需创建。保存后先由已安装的 Gradle 生成 Wrapper，再使用生成的脚本构建。

Wrapper 属性中的下载地址使用华为云 Gradle 镜像，原因是核验环境无法连接官方地址跳转后的下载端。归档使用官方 SHA-256 校验值固定内容：

```properties
distributionUrl=https\://repo.huaweicloud.com/gradle/gradle-9.0.0-bin.zip
distributionSha256Sum=8fad3d78296ca518113f3d29016617c7f9367dc005f932bd9d93bf45ba46072b
```

这是 `gradle/wrapper/gradle-wrapper.properties` 的局部内容。能够访问官方分发源的环境可以将 URL 改为同版本官方地址，同时保留并核对校验值；不要因下载失败取消校验。

### 2. 源码与测试

本篇使用自己的 `src/main/java` 和 `src/test/java`，通过订单金额契约观察构建行为。下面是 `build.gradle.kts` 中的依赖配置：

```kotlin
// 使用同一 BOM 固定测试 API、引擎和 Launcher。
dependencies {
    testImplementation(platform("org.junit:junit-bom:6.1.2"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}
```

Java 工具链与编译目标均为 21，测试任务使用 JUnit Platform。完整文件如下。设置文件确定工程名，构建脚本使用标准源码目录；完整领域类和测试让构建可以直接复现。

将以下内容保存为 `settings.gradle.kts`：

```kotlin [settings.gradle.kts]
rootProject.name = "order-domain-gradle"
```

将以下内容保存为 `build.gradle.kts`：

::: details 查看 build.gradle.kts 完整内容

```kotlin [build.gradle.kts]
plugins { java }
group = "order"
version = "1.0.0"
// 配置依赖仓库，无外部发布行为。
repositories { mavenCentral() }
// 使用已安装的 Java 21 工具链编译与测试，不自动下载 JDK。
java { toolchain { languageVersion = JavaLanguageVersion.of(21) } }
// 使用本篇目录的标准源码布局。
// BOM 固定测试 API、引擎和 Launcher 的同一版本。
dependencies {
    testImplementation(platform("org.junit:junit-bom:6.1.2"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}
// 对所有 Java 编译任务使用相同编码与编译告警策略。
tasks.withType<JavaCompile>().configureEach {
    options.encoding = "UTF-8"
    options.release = 21
    options.compilerArgs.addAll(listOf("-Xlint:all", "-Werror"))
}
// 默认只运行正常测试；故意失败的教学类通过 Maven 的独立入口验证。
tasks.test {
    useJUnitPlatform()
    exclude("**/OrderDraftFailureExample.class")
}
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

将以下内容保存为 `src/test/java/order/OrderDraftFailureExample.java`：

::: details 查看 OrderDraftFailureExample.java 完整内容

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


## 四、构建与观察

在本篇目录执行生成与构建命令。生成命令同时固定下载源和 SHA-256；随后使用生成的 Wrapper 构建，首次运行需要下载分发包与依赖：

```powershell
gradle wrapper --gradle-version 9.0.0 --distribution-type bin --gradle-distribution-url https://repo.huaweicloud.com/gradle/gradle-9.0.0-bin.zip --gradle-distribution-sha256-sum 8fad3d78296ca518113f3d29016617c7f9367dc005f932bd9d93bf45ba46072b
./gradlew.bat --version
./gradlew.bat --no-daemon clean test jar
```

构建应以 `BUILD SUCCESSFUL` 结束，`build/test-results/test/` 中的 XML 应记录 13 次测试、零失败和零错误。HTML 报告在 `build/reports/tests/test/index.html`，领域 JAR 在 `build/libs/order-domain-gradle-1.0.0.jar`。

任务日志不一定打印测试次数，因此验收应检查测试报告。Gradle 和 Maven 的 JAR 元数据、构建目录可以不同；迁移要保持的是源码目标版本、资源、对外 API、运行依赖和测试行为。

::: warning 默认发现规则可能不同
本例显式排除了用于演示失败的 `OrderDraftFailureExample`。移除排除配置后，Gradle 的测试发现会运行该教学类，构建应失败。迁移时必须核对实际发现的测试集合，不能只比较最终命令是否退出成功。
:::

## 五、任务依赖与迁移


### 1. 执行顺序

`dependsOn` 使依赖任务进入执行图；`mustRunAfter` 约束已经进入执行图的任务顺序，但不会主动加入另一个任务。需要生成文件再编译时，应声明真实任务依赖及输入输出，不能依靠两段配置的书写顺序。

执行以下命令观察依赖和构建计划，不会执行 Java 编译测试动作：

```powershell
./gradlew.bat dependencies --configuration testRuntimeClasspath
./gradlew.bat dependencyInsight --dependency junit --configuration testRuntimeClasspath
./gradlew.bat build --dry-run
```


### 2. 缓存与迁移结果

增量构建、任务输出缓存与配置缓存解决不同成本：是否重新执行任务、是否复用任务产物、是否重新配置构建。输入输出声明错误可能复用不合适的结果；排查时先核对模型，再选择 `--rerun-tasks` 或 `clean`，不要固定每次删除所有缓存。

将真实项目迁移到 Gradle 时，逐项对照编译目标、依赖版本、资源过滤、测试发现、代码生成、打包与质量规则。只有所需行为具备等价证据后才能替换原入口；当前订单示例验证领域构建，不代表任意 Maven 插件都能自动迁移。

## 六、参考资料

- [Gradle Wrapper](https://docs.gradle.org/9.0.0/userguide/gradle_wrapper.html)
- [Java 插件](https://docs.gradle.org/9.0.0/userguide/java_plugin.html)
- [依赖配置](https://docs.gradle.org/9.0.0/userguide/java_library_plugin.html)
- [官方校验值](https://downloads.gradle.org/distributions/gradle-9.0.0-bin.zip.sha256)

以上资料用于核对示例归档。
