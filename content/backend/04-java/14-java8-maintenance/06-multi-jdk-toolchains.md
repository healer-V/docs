---
title: "多 JDK 与 Toolchains"
tags: [Java, Maven, Toolchains, 兼容性]
excerpt: "用项目内 Toolchains 配置隔离 Java 8 与 21 的编译和测试进程，固定最低发布目标，验证真实 JVM、Class 版本及 API 失败边界，避免 PATH 和缓存掩盖环境差异。"
date: 2026-09-11
---

# 多 JDK 与 Toolchains

Maven 自己的运行 JDK、编译器 JDK、测试 JVM 和发布最低版本是四个不同选择。Toolchains 为支持它的插件提供 JDK 路径，`release` 约束编译目标，实际运行测试则验证最终兼容行为。

## 一、准备两套 JDK

安装 JDK 8、JDK 21 和 Maven 3.9.11，新建空目录。主源码面向 Java 8，使用可在 Java 8 执行的 JUnit 4.13.2；POM、工具链配置、业务源码和测试均在下方完整给出，按路径创建父目录并保存 UTF-8 文件。

两个目录需要是真实、可执行的 JDK 安装位置。以下环境变量只影响当前 PowerShell 及其子进程，不修改系统配置：

```powershell
$env:JAVA8_HOME = Read-Host 'JDK 8 安装目录'
$env:JAVA21_HOME = Read-Host 'JDK 21 安装目录'
& "$env:JAVA8_HOME/bin/java.exe" -version
& "$env:JAVA21_HOME/bin/java.exe" -version
$env:JAVA_HOME = $env:JAVA21_HOME
mvn -version
```

最后一条确认 Maven 自身使用的 Java Home，前两条确认待选运行时。使用 Toolchains 不会自动改变 Maven 启动 JDK。

## 二、显式选择工具链

### 1. 项目内配置

`toolchains.xml` 引用两项环境变量，不包含机器绝对路径。Maven 的 `-t` 指定这份配置，避免改写用户级工具链文件。

::: details 查看完整 Toolchains 配置

```xml [toolchains.xml]
<?xml version="1.0" encoding="UTF-8"?>
<toolchains xmlns="http://maven.apache.org/TOOLCHAINS/1.1.0">
    <toolchain>
        <type>jdk</type>
        <provides><version>8</version></provides>
        <configuration><jdkHome>${env.JAVA8_HOME}</jdkHome></configuration>
    </toolchain>
    <toolchain>
        <type>jdk</type>
        <provides><version>21</version></provides>
        <configuration><jdkHome>${env.JAVA21_HOME}</jdkHome></configuration>
    </toolchain>
</toolchains>
```

:::

`provides` 是配置声明，不替代真实版本检查。如果把 Java 21 路径误填入 Java 8 条目，必须由命令输出与测试进程证据发现，不能仅相信“匹配到 version=8”的日志。

### 2. 构建契约

`pom.xml` 绑定 Toolchains 3.2.0 的 `toolchain` goal，按 `toolchain.version` 选择 JDK。Compiler 3.14.1 和 Surefire 3.5.4 都读取该工具链，`maven.compiler.release` 始终为 8。

Compiler 插件在实际 JDK 8 上将 `release` 配置转换为该编译器支持的 `source/target`，标准 API 由真实 JDK 8 提供；在 JDK 21 上使用 `--release 8`。本工程仅关闭旧目标选项告警，其他 `-Xlint` 告警仍由 `-Werror` 阻断。

按以下相对路径补齐 POM、业务类、运行探针和测试类。它们与上方 `toolchains.xml` 位于同一个新建目录中。

将以下内容保存为 `pom.xml`：

::: details 查看 pom.xml 完整内容

```xml [pom.xml]
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>order</groupId>
    <artifactId>order-compat</artifactId>
    <version>1.0.0</version>
    <properties>
        <maven.compiler.release>8</maven.compiler.release>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <toolchain.version>21</toolchain.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.13.2</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-toolchains-plugin</artifactId>
                <version>3.2.0</version>
                <executions><execution><goals><goal>toolchain</goal></goals></execution></executions>
                <configuration>
                    <toolchains><jdk><version>${toolchain.version}</version></jdk></toolchains>
                </configuration>
            </plugin>
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
                <!-- 保留 release 8 是本章的兼容目标，仅排除旧目标选项告警。 -->
                <configuration><compilerArgs><arg>-Xlint:all,-options</arg><arg>-Werror</arg></compilerArgs></configuration>
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
        </plugins>
    </build>
</project>
```

:::

将以下内容保存为 `src/main/java/order/compat/OrderRules.java`：

::: details 查看 OrderRules.java 完整内容

```java [src/main/java/order/compat/OrderRules.java]
package order.compat;

import java.text.ParsePosition;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.ResolverStyle;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

/** 保留 Java 8 可用的业务规则，同时对照旧日期解析与 java.time。 */
public final class OrderRules {
    /** 禁止实例化无状态规则工具。 */
    private OrderRules() { }

    /**
     * @param priceCents 单价分，必须非负。
     * @param quantity 数量，必须为正数。
     * @return 精确金额分；输入非法或乘法溢出时抛出异常。
     */
    public static long total(long priceCents, int quantity) {
        if (priceCents < 0 || quantity < 1) throw new IllegalArgumentException("invalid order amount");
        return Math.multiplyExact(priceCents, (long) quantity);
    }

    /** @param value yyyy-MM-dd 完整日期，不接受非法日期或尾随内容。 @return UTC 当日零点。 */
    public static Date legacyDate(String value) {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd", Locale.ROOT);
        format.setTimeZone(TimeZone.getTimeZone("UTC"));
        format.setLenient(false);
        ParsePosition position = new ParsePosition(0);
        Date result = format.parse(value, position);
        if (result == null || position.getIndex() != value.length() || !format.format(result).equals(value)) {
            throw new IllegalArgumentException("invalid order date");
        }
        return result;
    }

    /** @param value yyyy-MM-dd 完整日期，采用严格解析。 @return 与旧规则相同的 UTC 当日零点。 */
    public static Date modernDate(String value) {
        DateTimeFormatter format = DateTimeFormatter.ofPattern("uuuu-MM-dd", Locale.ROOT)
                .withResolverStyle(ResolverStyle.STRICT);
        return Date.from(LocalDate.parse(value, format).atStartOfDay(ZoneOffset.UTC).toInstant());
    }
}
```

:::

将以下内容保存为 `src/main/java/order/compat/CompatProbe.java`：

::: details 查看 CompatProbe.java 完整内容

```java [src/main/java/order/compat/CompatProbe.java]
package order.compat;

import java.lang.management.ManagementFactory;

/** 提供双运行时的版本与业务结果入口。 */
public final class CompatProbe {
    /** 禁止实例化命令入口。 */
    private CompatProbe() { }

    /** @param args 不使用参数；输出实际运行时和同一订单结果。 */
    public static void main(String[] args) {
        System.out.println("java=" + System.getProperty("java.version"));
        System.out.println("totalCents=" + (OrderRules.total(1990, 2) + OrderRules.total(990, 1)));
        System.out.println("date=" + OrderRules.modernDate("2026-09-10").toInstant());
        for (java.lang.management.GarbageCollectorMXBean collector : ManagementFactory.getGarbageCollectorMXBeans()) {
            System.out.println("collector=" + collector.getName());
        }
    }
}
```

:::

将以下内容保存为 `src/test/java/order/compat/CompatContractTest.java`：

::: details 查看 CompatContractTest.java 完整内容

```java [src/test/java/order/compat/CompatContractTest.java]
package order.compat;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import org.junit.Test;
import static org.junit.Assert.*;

/** 同一业务断言分别在 Toolchain 选出的 JDK 8 和 21 执行。 */
public class CompatContractTest {
    /** 正常订单金额与实际测试 JVM 一同输出。 */
    @Test public void amountAndRuntime() {
        assertEquals(4970, OrderRules.total(1990, 2) + OrderRules.total(990, 1));
        System.out.println("test.java=" + System.getProperty("java.version"));
    }

    /** 数量非法必须失败，不能产生负订单。 */
    @Test public void invalidQuantity() {
        assertThrows(IllegalArgumentException.class, /* 验证非法输入边界。 */ () -> OrderRules.total(1990, 0));
    }

    /** 金额溢出必须失败，不能静默绕回。 */
    @Test public void overflow() {
        assertThrows(ArithmeticException.class, /* 验证乘法边界。 */ () -> OrderRules.total(Long.MAX_VALUE, 2));
    }

    /** 正常日期与闰日的两套实现必须返回相同时间点。 */
    @Test public void dateEquivalence() {
        for (String date : Arrays.asList("2026-09-10", "2024-02-29")) {
            assertEquals(OrderRules.legacyDate(date), OrderRules.modernDate(date));
        }
    }

    /** 两套解析器都拒绝无效日期和尾随内容，异常类型可以不同。 */
    @Test public void invalidDates() {
        for (String date : Arrays.asList("2026-02-29", "2026-09-10x", "2026-9-10")) {
            assertThrows(RuntimeException.class, /* 旧解析器必须严格消费输入。 */ () -> OrderRules.legacyDate(date));
            assertThrows(RuntimeException.class, /* 新解析器保留同样的拒绝集合。 */ () -> OrderRules.modernDate(date));
        }
    }

    /** 包装视图会随源列表变化，复制后的包装才隔离结构修改。 */
    @Test public void viewAndSnapshot() {
        List<String> source = new ArrayList<>(Arrays.asList("CREATED"));
        List<String> view = Collections.unmodifiableList(source);
        List<String> snapshot = Collections.unmodifiableList(new ArrayList<>(source));
        source.add("PAID");
        assertEquals(2, view.size());
        assertEquals(1, snapshot.size());
        assertThrows(UnsupportedOperationException.class, /* 返回快照禁止结构修改。 */ () -> snapshot.add("CLOSED"));
    }

    /** 固定大小列表仍可替换并保留 null，不能等同于 List.of。 */
    @Test public void arraysListContract() {
        List<String> values = Arrays.asList("CREATED", null);
        values.set(0, "PAID");
        assertNull(values.get(1));
        assertEquals("PAID", values.get(0));
        assertThrows(UnsupportedOperationException.class, /* 固定大小列表不能追加。 */ () -> values.add("CLOSED"));
    }

    /** 匿名比较器与方法引用在边界整数上保持相同排序，避免减法溢出。 */
    @Test public void comparatorRefactor() {
        List<Integer> legacy = new ArrayList<>(Arrays.asList(Integer.MAX_VALUE, -1, 0, Integer.MIN_VALUE));
        List<Integer> modern = new ArrayList<>(legacy);
        legacy.sort(new Comparator<Integer>() {
            /**
             * @param left 非空左侧数量。
             * @param right 非空右侧数量。
             * @return 按数值升序比较，避免相减溢出。
             */
            @Override public int compare(Integer left, Integer right) { return Integer.compare(left, right); }
        });
        modern.sort(/* 与旧比较器相同的升序规则。 */ Integer::compare);
        assertEquals(legacy, modern);
        assertEquals(Integer.valueOf(Integer.MIN_VALUE), modern.get(0));
    }
}
```

:::

## 三、双环境执行

依次运行，`clean` 防止上一次编译产物掩盖新工具链的结果：

```powershell
mvn -ntp -t toolchains.xml -f pom.xml clean verify "-Dtoolchain.version=8"
mvn -ntp -t toolchains.xml -f pom.xml clean verify "-Dtoolchain.version=21"
```

两次实际结果如下，测试类自己输出 `java.version`，不只依赖 Maven 的版本展示：

```text
test.java=1.8.0_491
Tests run: 8, Failures: 0, Errors: 0, Skipped: 0
test.java=21.0.11
Tests run: 8, Failures: 0, Errors: 0, Skipped: 0
```

每次 `clean` 会删除上一轮报告，正式矩阵应为两套作业保留独立证据目录。主制品为 `target/order-compat-1.0.0.jar`，两套运行时执行 `CompatProbe` 均返回金额 4970 分和相同 UTC 日期。

## 四、核对产物边界

用 JDK 21 反汇编目标类，实际主版本为 52：

```powershell
& "$env:JAVA21_HOME/bin/javap.exe" -verbose -classpath target/classes order.compat.OrderRules
```

但低主版本本身仍不能证明 API 兼容。[API 链接失败示例](./03-api-collection-differences.md)通过完整 `ApiTrap` 说明 `source/target 8` 可以误引用新 API，Java 8 执行产生 `NoSuchMethodError`，详见[API 差异](./03-api-collection-differences.md#三、链接失败实验)。

::: warning 工具链未匹配就停止
路径不存在、版本声明错误或环境变量缺失时，先修正配置并重新清理构建。不要移除 Toolchains 后继续用 PATH 默认 JDK，再把结果记入 Java 8 验证列。
:::

## 五、参考资料

- [Maven Toolchains 标准配置](https://maven.apache.org/plugins/maven-toolchains-plugin/toolchains/jdk.html)
- [Compiler release](https://maven.apache.org/plugins/maven-compiler-plugin/examples/set-compiler-release.html)
- [Surefire 工具链](https://maven.apache.org/surefire/maven-surefire-plugin/examples/toolchains.html)

以上资料说明编译及测试进程选择。
