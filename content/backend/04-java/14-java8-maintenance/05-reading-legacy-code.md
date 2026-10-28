---
title: "Java 8 旧代码重构"
tags: [Java, Java 8, 重构]
excerpt: "从匿名类、旧日期解析、可变 DTO 和集合包装识别遗留代码的真实契约，通过双运行时的日期、排序和边界测试约束替换，避免只按语法新旧判断设计质量。"
date: 2026-09-11
---

# Java 8 旧代码重构

阅读旧代码先确定输入、状态、所有权和输出，再决定是否替换写法。匿名类、JavaBean 或 `Date` 的存在不是重构理由，重复状态、隐含时区和错误边界才需要具体分析。

## 一、识别契约

| 旧式写法 | 需要追问的行为 | 可能的替换风险 |
|----------|----------------|----------------|
| 匿名类 | 是否有自身状态、`this` 或序列化身份 | Lambda 的 `this` 含义不同 |
| 可变 DTO | 谁创建、谁修改、框架如何访问 | 改为 Record 后构造和访问规则变化 |
| `Date` 与格式器 | 时区、精度、宽松解析与线程共享 | 日期或异常集合改变 |
| 工具类 | 是否含全局可变状态或外部 I/O | 仅移动方法无法消除耦合 |
| 集合包装 | 返回视图还是快照、元素是否可变 | 源集合修改是否仍可见 |

## 二、日期替换

### 1. 旧规则显式化

`OrderRules.legacyDate` 每次创建独立 `SimpleDateFormat`，指定 UTC、关闭宽松解析，检查输入被完整消费且格式回写一致。这样可以拒绝非法闰日、尾随字符和非约定宽度。

如果旧业务一直接受宽松日期，收紧行为就属于规则变更，不能伪装成等价重构。应先确认调用方输入契约和异常处理，再决定是否采用严格模式。

### 2. 新实现

下方完整 `OrderRules.java` 中的局部方法 保持 Java 8 可编译，使用已经在该版本提供的 `java.time`：

```java
/** @param value yyyy-MM-dd 完整日期，采用严格解析。 @return 与旧规则相同的 UTC 当日零点。 */
public static Date modernDate(String value) {
    DateTimeFormatter format = DateTimeFormatter.ofPattern("uuuu-MM-dd", Locale.ROOT)
            .withResolverStyle(ResolverStyle.STRICT);
    return Date.from(LocalDate.parse(value, format).atStartOfDay(ZoneOffset.UTC).toInstant());
}
```

这里使用 `uuuu` 表示年份，返回边界仍为 `Date`，使调用方暂时无需一起迁移。两套实现对正常日期和闰日返回相同时间点，对约定非法输入都失败；异常具体类型仍有差别，依赖它的调用方要显式适配。

## 三、匿名类与比较器

无状态比较器可从匿名类改为 `Integer::compare`，但不能用 `left - right` 简化，后者可能溢出并破坏排序契约。`CompatContractTest#comparatorRefactor` 使用最大值、最小值、负数与零对照两种实现。

若匿名类依赖它自己的 `this`，直接变为 Lambda 会改为外围实例语义。应先拆出状态职责或保留具名类型，不能只以编译通过作为行为证明。

::: tip 先固定输入和边界
为正常输入、空值策略、极端数值、日期和异常写出可观察断言，再替换内部表达。重构后输出相同，也要核对副作用次数、资源关闭与异常类型。
:::

## 四、可变对象边界

DTO 包含 `Date` 或 `List` 时，`final` 只能限制引用重新赋值。构造时是否复制、访问时是否暴露原对象，会决定调用方能否修改内部状态；集合不可修改包装也不等于元素深度不可变。

改成 Record 前核对 ORM 代理、无参构造、JavaBean 访问器和序列化协议。若目标仍为 Java 8，可通过普通类的明确构造与防御性复制改善设计，无需等待语言升级。

## 五、执行与结果

安装 JDK 8、JDK 21 和 Maven 3.9.11，新建空目录。以下三项测试分别验证日期等价、非法日期和排序边界；按路径创建父目录并保存 UTF-8 文件。

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

将以下内容保存为 `src/test/java/order/compat/CompatContractTest.java`：

::: details 查看 CompatContractTest.java 完整内容

```java [src/test/java/order/compat/CompatContractTest.java]
package order.compat;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import org.junit.Test;
import static org.junit.Assert.*;

/** 同一业务断言分别在 Toolchain 选出的 JDK 8 和 21 执行。 */
public class CompatContractTest {

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

文件保存完成后，分别选择 Java 8 与 21 执行同一组测试：

```powershell
mvn -ntp -t toolchains.xml -f pom.xml clean verify "-Dtoolchain.version=8"
mvn -ntp -t toolchains.xml -f pom.xml clean verify "-Dtoolchain.version=21"
```

本地两套运行时均为 3 项通过。测试只覆盖明确列出的契约，不包含 ORM 或线上数据迁移；若需要改变持久化模型，应另设兼容和回退验证。

## 六、参考资料

- [Java 8 SimpleDateFormat](https://docs.oracle.com/javase/8/docs/api/java/text/SimpleDateFormat.html)
- [DateTimeFormatter](https://docs.oracle.com/javase/8/docs/api/java/time/format/DateTimeFormatter.html)
- [JLS 21 Lambda](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.27)

以上资料说明日期和作用域差异。
