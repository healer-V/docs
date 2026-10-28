---
title: "Java 8 与 21 API 差异"
tags: [Java, Java 8, 集合, API]
excerpt: "比较集合工厂、Optional、Stream、时间与 I/O 的常用 API 差异，说明视图、快照、null 和可修改性的替代成本，验证旧字节码误调用新 API 的运行失败。"
date: 2026-09-11
---

# Java 8 与 21 API 差异

源码采用 Java 8 语法，不代表它只调用了 Java 8 API。编译器可见的新方法可能进入旧版本 Class 文件，直到旧运行时执行该调用才暴露链接失败。

## 一、常见替代

| Java 21 可用 API | Java 8 处理方式 | 必须核对 |
|-----------------|----------------|----------|
| `List.of`、`Set.of`、`Map.of` | 显式构造并包装 | null、重复键、修改能力 |
| `List.copyOf` | 复制后再不可修改包装 | 结构快照与元素可变性 |
| Sequenced Collections | 按 List、Deque 或有序 Map 分别处理 | 顺序、首尾与反向视图 |
| `Optional.stream`、`or`、`ifPresentOrElse` | 条件分支或组合已有方法 | 惰性求值和副作用次数 |
| `Stream.toList`、`takeWhile`、`mapMulti` | 收集器、循环或明确的前缀逻辑 | 可修改性、null 和有序语义 |
| `Files.readString`、`Path.of` | 显式字符集读取、`Paths.get` | 编码、大小和资源生命周期 |
| 标准 `HttpClient` | 合适的旧 API 或外部客户端 | 依赖、超时、连接与 TLS |

`java.time` 已在 Java 8 提供，维护旧项目也能使用 `LocalDate`、`Instant` 与 `DateTimeFormatter`。缺少某个后续便利方法，不等于整套时间 API 都不可用。

## 二、集合行为

### 1. 视图与快照

下面的 Java 8 局部代码中，`source` 为可变列表，复制发生在包装之前：

```java
List<String> view = Collections.unmodifiableList(source);
List<String> snapshot = Collections.unmodifiableList(new ArrayList<>(source));
```

源列表新增元素后，`view` 可观察到变化，`snapshot` 的结构不随之改变。两者都只是限制当前列表接口的修改，元素对象若可变仍需单独处理。

### 2. null 与可修改性

`Arrays.asList` 是固定大小列表，通常允许 `set` 和 null，不等同于 `List.of`。`Collectors.toList` 不承诺具体类型或可修改性，不能把“目前得到 ArrayList”作为公共 API 契约；确需可变列表时明确使用 `toCollection(ArrayList::new)`。

`Stream.toList` 返回不可修改列表，`List.of` 还拒绝 null。迁移时应分别测试这些性质，不能只比较元素打印结果。

## 三、链接失败实验

下面的 `ApiTrap.java` 故意调用 `List.of("ORD-1001")`。先保存错误示例，再观察编译和链接两个不同失败阶段。

安装 JDK 8 和 JDK 21，新建空目录，以 UTF-8 保存以下文件。环境变量指向真实安装位置：

```powershell
$env:JAVA8_HOME = Read-Host 'JDK 8 安装目录'
$env:JAVA21_HOME = Read-Host 'JDK 21 安装目录'
$env:JAVA_HOME = $env:JAVA21_HOME
& "$env:JAVA8_HOME/bin/java.exe" -version
& "$env:JAVA21_HOME/bin/java.exe" -version
```

将以下内容保存为 `ApiTrap.java`：

```java [ApiTrap.java]
import java.util.List;

/** 故意调用 Java 9 API，证明低字节码版本不等于 API 兼容。 */
public final class ApiTrap {
    /** @param args 不使用参数；Java 8 运行时应报告缺少 List.of。 */
    public static void main(String[] args) {
        System.out.println(List.of("ORD-1001"));
    }
}
```

```powershell
& "$env:JAVA21_HOME/bin/javac.exe" -source 8 -target 8 -d out/trap ApiTrap.java
& "$env:JAVA8_HOME/bin/java.exe" -cp out/trap ApiTrap
& "$env:JAVA21_HOME/bin/javac.exe" --release 8 -d out/release ApiTrap.java
```

第一条可生成低版本 Class，但会有旧选项及平台路径告警。第二条在真实 Java 8 上出现 `NoSuchMethodError`，因为运行时不存在 `List.of`。第三条直接在编译时拒绝该调用，报告找不到方法。

::: tip 将 API 边界前移
在新 JDK 上面向 Java 8 构建时，使用 `--release 8` 同时约束语言、Class 和标准 API。它不验证第三方依赖的最低 JDK，也不替代实际运行。
:::

## 四、行为回归

下面两项测试验证源列表联动、复制隔离、替换、null 和追加失败。安装 Maven 3.9.11，并在刚才的目录补齐这些 UTF-8 文件；错误示例 `ApiTrap.java` 留在根目录，不进入 Maven 正常源码集。

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
                <!-- 本例只有测试源码，生产输出目录尚不存在；忽略该布局的路径告警与旧目标告警。 -->
                <configuration><compilerArgs><arg>-Xlint:all,-options,-path</arg><arg>-Werror</arg></compilerArgs></configuration>
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

将以下内容保存为 `src/test/java/order/compat/CompatContractTest.java`：

::: details 查看 CompatContractTest.java 完整内容

```java [src/test/java/order/compat/CompatContractTest.java]
package order.compat;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.Test;
import static org.junit.Assert.*;

/** 同一业务断言分别在 Toolchain 选出的 JDK 8 和 21 执行。 */
public class CompatContractTest {

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
}
```

:::

分别在两套 JDK 执行相同断言：

```powershell
mvn -ntp -t toolchains.xml clean verify "-Dtoolchain.version=8"
mvn -ntp -t toolchains.xml clean verify "-Dtoolchain.version=21"
```

两次均应报告 `Tests run: 2, Failures: 0, Errors: 0, Skipped: 0`。

Stream 前缀操作也不能简单替换为 `filter`：前者遇到第一个不匹配元素后停止取前缀，后者继续筛选整个流。替代实现需选取包含“后续再次匹配”的输入验证差异。

## 五、参考资料

- [Java 8 集合 API](https://docs.oracle.com/javase/8/docs/api/java/util/Collections.html)
- [Java 21 List](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html)
- [Stream](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html)

以上资料给出工厂、视图与收集结果契约。
