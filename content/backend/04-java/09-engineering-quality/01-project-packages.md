---
title: "Java 工程结构"
tags: [Java, Maven, 工程化]
excerpt: "说明 Java 工程中源码、测试、资源、包与构建模块的职责，通过订单领域和应用入口的依赖关系，定位编译产物并判断何时需要拆分模块。"
date: 2026-09-11
---


# Java 工程结构

Java 工程把源码、依赖、测试和打包规则组织成可重复执行的构建。包解决类型命名与访问控制，构建模块决定制品边界；两者可以配合，但不要求每个包都成为独立模块。


## 一、源码与构建产物

Maven 使用标准目录区分生产与测试输入。生产代码不能反向引用测试源码，否则应用脱离测试类路径就无法编译或运行。

| 路径 | 职责 | 构建去向 |
|------|------|----------|
| `src/main/java` | 生产源码 | `target/classes` 中的类文件 |
| `src/main/resources` | 运行配置与资源 | 复制到 `target/classes` |
| `src/test/java` | 测试源码 | `target/test-classes` |
| `src/test/resources` | 测试专用资源 | 复制到测试类路径 |
| `pom.xml` | 坐标、依赖、插件和构建约束 | Maven 的有效项目模型 |

`target/` 由构建产生，不是另一份源码。修改其中的配置只影响当前产物，清理或重建后就会消失。需要随应用发布的配置应维护在资源目录，并检查 JAR 内的实际内容。

::: tip 测试依赖方向
JUnit、Mockito 等测试工具使用 `test` 范围。应用运行时不应因为执行过测试而依赖测试框架；依赖树和 JAR 内容应分别检查。
:::


## 二、包与模块边界


### 1. 按业务能力组织

`order` 表达订单能力，`order.app` 表达应用入口与协作。包内可以使用包级可见性隐藏实现，让对外 API 保持稳定。仅把所有类分到全局 `service`、`model`、`util` 目录，无法说明哪些类型共同维护同一个业务约束。

包名与目录通常一致，便于工具查找；编译后的名称来自 `package` 与类型声明。Maven 坐标 `order:order-domain:1.0.0` 用于定位制品，与 Java 包名承担不同职责。


### 2. 从依赖方向决定拆分

例如，可以把金额规则放在 `order-domain`，命令行与日志放在 `order-app`。应用依赖领域，领域不依赖日志实现、测试框架或应用入口。这样领域 JAR 可以被不同入口复用，并能独立执行金额边界测试。

| 情况 | 处理方式 | 判断依据 |
|------|----------|----------|
| 仅有几个紧密相关的类 | 一个模块内按包组织 | 拆分不会带来独立复用或验证价值 |
| 领域规则被多个入口使用 | 提取领域模块 | 入口变化不应迫使领域依赖具体框架 |
| 两个模块相互依赖 | 重划边界或合并 | 双向依赖使构建无法排序，职责也难独立解释 |
| 所有类型都进入 `common` | 按稳定能力重新归属 | “多个地方使用”不足以证明共同职责 |


## 三、订单工程

下面创建一个独立订单领域库。金额单位为分，生产类负责输入校验与累加，测试类通过公开 API 检查初始金额与两次添加的结果。这里用一个模块展示源码与测试的关系。

需要手工创建的文件只有三份，构建后的 `target/` 无需预先建立：

```text
order-domain/
├── pom.xml
├── src/main/java/order/OrderDraft.java
└── src/test/java/order/OrderDraftTest.java
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

保存文件后再执行构建。

## 四、构建与定位

在新建目录执行以下 PowerShell 命令：

```powershell
mvn -ntp clean verify
jar --list --file target/order-domain-1.0.0.jar
```

测试报告应包含以下结果：

```text
Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

`target/classes/order/OrderDraft.class` 来自生产源码，测试类只出现在 `target/test-classes/`。JAR 中应有 `OrderDraft.class`，不应有 `OrderDraftTest.class`；两次添加的断言则确认金额为 `4970` 分。

::: info 领域库没有启动入口
这份 JAR 供其他代码调用，未声明 `main` 或 Manifest 启动类，不能直接用 `java -jar` 启动。测试通过 JUnit 调用领域 API，报告保存在 `target/surefire-reports/`。
:::

如果只有 IDE 能编译，先核对 IDE 的 JDK、源码根和手工依赖是否进入 POM。若把测试类导入生产源码，Maven 的生产编译应拒绝它；应修复依赖方向，不能把测试目录加入应用运行类路径。

## 五、参考资料

- [Maven 标准目录](https://maven.apache.org/guides/introduction/introduction-to-the-standard-directory-layout.html)
- [Java 包与编译单元规范](https://docs.oracle.com/javase/specs/jls/se21/html/jls-7.html)

以上资料定义包、类型与模块声明的语义。
