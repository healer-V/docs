---
title: "Java 8 升级 Java 21"
tags: [Java, Java 8, Java 21, 迁移]
excerpt: "按照依赖清点、旧行为基线、运行时验证、构建升级和分批发布推进 Java 8 到 21 迁移，结合双 JDK 业务测试与静态工具结果说明兼容、观察和回退条件。"
date: 2026-09-11
---


# Java 8 升级 Java 21

JDK 升级同时涉及运行时、依赖、构建插件和平台行为。先让既有产物在目标运行时得到可解释的结果，再决定是否提升源码级别，才能区分兼容修复与业务改写。


## 一、清点迁移对象

| 对象 | 核对内容 | 典型失败 |
|------|----------|----------|
| 源码与标准 API | 目标语法、弃用与移除能力 | 编译或类加载失败 |
| 第三方依赖 | 框架、驱动、序列化与日志版本 | 反射、链接或行为不兼容 |
| 构建插件 | 编译、测试、覆盖率、代码生成 | 不能读取新 Class 或选择错误 JVM |
| Agent 与本地库 | 启动方式、架构、JNI 支持 | Attach、告警或本地崩溃 |
| 运行配置 | GC、内存、字符集、TLS、时区 | 启动失败或结果漂移 |
| 交付协议 | 数据库、消息、序列化格式 | 回退后旧实例不能读取 |

Java 8 应用可能依赖后续移出的 Java EE 相关模块，或访问后来封装更严格的 JDK 内部实现。应查依赖与运行错误，不能把所有失败统一处理成增加 `--add-opens`。


## 二、建立行为基线

### 1. 旧环境先通过

用实际 Java 8 执行现有业务测试，记录输入、输出、异常、字符集、日期与资源清理。基线本来失败时先解释失败，不能把迁移后的差异全部归因于新 JDK。

下面用金额、边界输入和日期这五项测试建立一个完整迁移实验。安装 JDK 8、JDK 21 和 Maven 3.9.11，新建空目录，按路径创建 UTF-8 文件。

```powershell
$env:JAVA8_HOME = Read-Host 'JDK 8 安装目录'
$env:JAVA21_HOME = Read-Host 'JDK 21 安装目录'
$env:JAVA_HOME = $env:JAVA21_HOME
& "$env:JAVA8_HOME/bin/java.exe" -version
& "$env:JAVA21_HOME/bin/java.exe" -version
```

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

将以下内容保存为 `toolchains.xml`：

::: details 查看 toolchains.xml 完整内容

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

import java.util.Arrays;
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
}
```

:::

先使用 Java 8 编译并运行五项断言：

```powershell
mvn -ntp -t toolchains.xml clean verify "-Dtoolchain.version=8"
```

报告应为 `Tests run: 5, Failures: 0, Errors: 0, Skipped: 0`，并输出实际测试 JVM。生成 `target/order-compat-1.0.0.jar` 后，保留这份旧目标制品继续做跨运行时比较。


### 2. 相同产物跨运行时

使用刚才生成的同一 Java 8 目标 JAR 比较两个运行时：

```powershell
& "$env:JAVA8_HOME/bin/java.exe" -cp target/order-compat-1.0.0.jar order.compat.CompatProbe
& "$env:JAVA21_HOME/bin/java.exe" -cp target/order-compat-1.0.0.jar order.compat.CompatProbe
```

实际金额都为 4970 分，日期都为 `2026-09-10T00:00:00Z`。本机默认收集器存在差异，说明业务结果一致并不意味着运行机制或容量曲线完全相同。

## 三、发现兼容缺口


### 1. 静态检查

使用 JDK 21 对实际交付 JAR 执行内部 API 与弃用扫描：

```powershell
& "$env:JAVA21_HOME/bin/jdeps.exe" --jdk-internals target/order-compat-1.0.0.jar
& "$env:JAVA21_HOME/bin/jdeprscan.exe" --release 21 target/order-compat-1.0.0.jar
```

本篇 JAR 未报告内部 API 或弃用使用。`jdeps` 不能发现所有通过字符串拼接的反射调用，`jdeprscan` 也不覆盖每个第三方库兼容问题；没有报告只是这两类检查的结果。


### 2. 运行验证

运行旧产物的结果一致后，再用新工具链重建并运行相同测试：

```powershell
mvn -ntp -t toolchains.xml clean verify "-Dtoolchain.version=21"
```

预期仍为五项通过，测试输出的 JVM 应变成 Java 21。正式迁移还需检查框架启动、反射访问、数据库、序列化、文件编码、TLS 与 Agent。默认字符集等变化应通过明确配置和实际数据回归处理，不能只在开发机输出一条日志就判断完成。

::: warning 临时开放要有退出条件
确需 `--add-opens` 时限定目标包与接收模块，记录对应依赖和替代计划。长期广泛开放会掩盖后续升级问题，也不能修复不存在的 API。
:::

## 四、分阶段采用

1. 固定旧行为、依赖清单与旧运行时产物，确保能够恢复。
2. 使用 Java 21 运行旧目标产物，解决运行与依赖问题。
3. 升级构建工具及插件，保持最低目标执行兼容矩阵。
4. 确认全部消费者具备条件后，再将适用模块提升到 Java 21 源码目标。
5. 按具体收益采用 Record、模式匹配或虚拟线程，每项单独回归相关行为。

共享库可能仍需保留 Java 8 目标，独立服务则可先迁移。模块升级顺序取决于消费者与发布单元，不能只按仓库文件夹顺序决定。


## 五、观察与回退

灰度比较成功率、响应分位、吞吐、CPU、进程内存、GC 和连接池，在高峰、定时任务、缓存过期及类加载完整周期内观察。暂停下降但内存超过预算，也不应判为通过。

回退需要旧 JDK、旧应用产物、旧配置以及兼容的数据协议。若数据库或消息格式已发生不可向后兼容的变化，仅恢复运行时镜像无法恢复服务。

::: tip 本地实验的验证范围
本例验证本地双 JDK 构建、运行、业务断言和两类静态扫描，没有执行真实服务灰度、生产压测或数据库迁移。实际项目需在对应环境完成这些验证后才能发布。
:::

## 六、参考资料

- [Java 21 迁移指南](https://docs.oracle.com/en/java/javase/21/migrate/)
- [jdeps](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jdeps.html)
- [jdeprscan](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jdeprscan.html)

以上资料提供兼容变化和检查工具说明。
