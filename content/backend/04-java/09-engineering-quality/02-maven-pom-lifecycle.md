---
title: "Maven 构建生命周期"
tags: [Java, Maven, POM]
excerpt: "通过可执行的订单工程说明 POM 坐标、Packaging、生命周期、阶段与插件目标，观察测试和 JAR 的产生过程，并定位构建阶段与运行入口错误。"
date: 2026-09-11
---


# Maven 构建生命周期

Maven 从 POM 建立项目模型，再按生命周期执行插件目标。POM 声明项目是什么、依赖什么以及如何构建；阶段描述执行位置，插件目标实现具体动作。


## 一、POM 与坐标

POM 的基本身份由 `groupId`、`artifactId` 和 `version` 组成。`packaging` 决定制品类型及默认插件绑定，省略时为 `jar`；只承担聚合或父配置的项目通常使用 `pom`。

订单领域工程的身份来自 本篇的 `pom.xml`。以下片段位于 `project` 内，完整文件还固定了编译、测试和打包插件。

```xml
<modelVersion>4.0.0</modelVersion>
<groupId>order</groupId>
<artifactId>order-domain</artifactId>
<version>1.0.0</version>
<properties>
    <maven.compiler.release>21</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
</properties>
```

`release` 同时约束语法、类文件版本和平台 API。仅设置源码编码不能决定 JDK，设置编译目标也不代表已经在目标运行时执行过程序。


## 二、生命周期与阶段

### 1. 三套独立生命周期

`default` 负责主要构建，`clean` 清理构建输出，`site` 生成项目站点。调用 `clean verify` 会先执行清理生命周期，再执行主构建到 `verify`；`verify` 自身不会隐含执行 `clean`。

| 主构建阶段 | 主要结果 | 默认 JAR 工程的插件目标 |
|------------|----------|-------------------------|
| `process-resources` | 资源进入输出目录 | `resources:resources` |
| `compile` | 生产类文件 | `compiler:compile` |
| `test` | 测试结果与报告 | `surefire:test` |
| `package` | JAR 制品 | `jar:jar` |
| `verify` | 集成结果与附加检查 | 取决于项目绑定的检查目标 |

调用某个阶段会执行同一生命周期中此前阶段。`mvn verify` 已覆盖编译、测试和打包；把命令写成 `compile test package verify` 会重复执行部分工作。


### 2. 阶段与插件目标

`test` 是阶段，`surefire:test` 是插件目标。目标可以绑定到阶段，也可以单独调用。`dependency:tree` 只输出依赖图，不意味着源码已经编译或测试通过。

Packaging 提供默认绑定，项目还可以添加执行。例如质量插件绑定到 `verify` 后，该阶段才会执行对应检查；仅在文档中写“运行 verify 做静态检查”，却没有插件配置，不会产生这项能力。

::: warning 集成测试的收尾
使用 Failsafe 或临时服务时，应运行到 `verify`，让测试结果判断和资源清理按配置完成。直接停在 `integration-test` 可能遗漏后续检查或关闭步骤。
:::


## 三、执行订单构建

订单 API 的用法如下；这是下方完整测试中的局部片段。

```java
OrderDraft draft = new OrderDraft();
draft.addItem(1990, 2);
draft.addItem(990, 1);
assertEquals(4970, draft.totalCents());
```

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

保存全部文件后执行构建，再检查制品：

```powershell
mvn -ntp clean verify
jar --list --file target/order-domain-1.0.0.jar
```

测试结果应包含以下关键行，耗时因机器变化：

```text
Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

JAR 中包含 `order/OrderDraft.class`，测试报告位于 `target/surefire-reports/`。这是领域库，没有 `main` 入口；不能据此使用 `java -jar` 启动它。应用入口及运行依赖的组织见[JAR 与模块系统](./06-jar-classpath-jpms.md)。

## 四、构建失败定位

### 1. 从首个失败目标定位

日志中的 `compiler:compile` 失败应检查源码、编译版本或类路径；`surefire:test` 失败应查看具体测试报告；依赖解析失败发生在实际使用相关制品之前，应核对坐标与仓库连通性。不要用跳过测试解决编译错误，也不要把打包成功当作运行依赖齐全。

在同一目录显式选择故意失败的教学测试，可以观察测试阶段失败：

```powershell
mvn -ntp test "-Dtest=OrderDraftFailureExample"
$LASTEXITCODE
```

该类包含故意错误的断言与未处理异常，进程应返回非零。报告说明具体失败方法；恢复为不带 `-Dtest` 的正常构建后，默认测试集应重新通过。


### 2. 查看有效配置

父 POM、Profile 与默认绑定都会影响实际模型。下面的命令只导出有效 POM，便于核对插件版本与编译目标，不输出用户凭据配置：

```powershell
mvn -ntp help:effective-pom -Doutput=target/effective-pom.xml
```

`install` 会把制品写入本地仓库，`deploy` 会发布到远程仓库。当前工程自身验证到 `verify` 即可，不需要把发布动作混进日常测试命令。

## 五、参考资料

- [Maven 生命周期](https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html)
- [POM 模型](https://maven.apache.org/pom.html)
- [Surefire 测试选择](https://maven.apache.org/surefire/maven-surefire-plugin/examples/single-test.html)

以上资料分别说明执行顺序、项目模型和测试入口。
