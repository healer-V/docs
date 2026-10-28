---
title: "Java 基础语法"
tags:
  - Java 21
  - 基础语法
  - package
excerpt: "解释 Java 编译单元中的包、导入、类型、方法、语句和注释，并通过一个带包结构的完整程序验证编译、类路径与常见语法错误。"
date: 2026-09-02
---

# Java 基础语法 {#java-源文件与基础语法}

Java 源文件是普通文本文件，编译器会把字符解析为关键字、标识符、字面量、分隔符和运算符，再检查它们是否组成合法的包声明、导入声明、类型和语句。缩进帮助人阅读，分号、花括号和声明顺序才属于语法约束。

## 一、编译单元的组成

一个 `.java` 文件在 Java 语言规范中称为编译单元，常见结构依次为：

```text
package 声明       0 或 1 个，必须位于普通声明之前
import 声明        0 个或多个
顶级类型声明       0 个或多个 class、interface、enum 或 record
```

下面是结构示意，不是本篇完整示例：

```java
package order;

import java.time.LocalDate;

public class OrderApplication {
    // 字段、构造方法和方法位于类型体内。
}
```

`package` 和 `import` 不是写在类体中的语句。把它们放进花括号内部，或者把 `package` 写在 `import` 之后，都会导致编译错误。

## 二、包名与目录结构

### 1. 包为类型提供命名空间

包可以区分不同模块中的同名类型。例如 `java.util.Date` 和 `java.sql.Date` 都叫 `Date`，全限定类名仍然不同。

下面的独立示例声明：

```java
package order;
```

编译后，类文件相对于输出根目录位于：

```text
order/BasicSyntaxDemo.class
```

::: tip 保持源码目录与包路径一致

源文件目录与包路径保持一致不是语言对所有编译方式的绝对要求，但它是构建工具、IDE 和团队工程的通用约定。偏离约定会让源码定位、增量编译和代码审查变得困难。

:::

### 2. 运行时使用全限定类名

包内类不能只用简单类名从任意目录启动。假设类路径根目录为 `out`，正确运行方式是：

```powershell
java -cp out order.BasicSyntaxDemo
```

`-cp` 指向包目录之前的根，类名包含完整包名。`java -cp out BasicSyntaxDemo` 会在默认包中查找类，无法匹配已经声明包的编译结果。

## 三、import 解决名称书写问题

### 1. 单类型导入

`import java.time.LocalDate;` 允许当前文件使用简单名称 `LocalDate`。没有导入时，可以直接写全限定名：

```java
java.time.LocalDate orderDate = java.time.LocalDate.of(2026, 9, 2);
```

::: info import 只负责名称解析

导入不会下载依赖，也不会把类复制进当前文件。它只在编译期帮助解析名称；类型是否存在仍由模块、依赖和编译类路径决定。

:::

### 2. 隐式可用的类型

同一包中的类型和 `java.lang` 包中的公开类型可以直接使用。`String`、`System`、`Math` 和 `Integer` 都属于 `java.lang`，因此通常不写导入。

| 简单名称 | 能直接使用的原因 |
|----------|------------------|
| `BasicSyntaxDemo` | 当前编译单元正在声明该类型 |
| 同包的 `OrderNumber` | 当前包中的可访问类型不需要导入 |
| `String` | `java.lang` 由编译单元隐式按需导入 |
| `LocalDate` | 不属于同包或 `java.lang`，需要显式导入或全限定名 |

### 3. 通配符的边界

`import java.util.*;` 只导入 `java.util` 中可访问的类型，不递归导入 `java.util.concurrent` 等子包。两个通配符同时带来同名类型时，仍需使用单类型导入或全限定名消除歧义。

生产代码通常使用明确的单类型导入，让依赖来源在文件顶部可以直接阅读。IDE 可以自动整理导入，但开发者仍应理解类型来自哪个包。

## 四、类型、方法与语句

### 1. 公开类型与文件名

一个编译单元最多有一个 `public` 顶级类型。存在公开顶级类时，文件名必须与类名一致，包括大小写：

| 声明 | 正确文件名 |
|------|------------|
| `public class BasicSyntaxDemo` | `BasicSyntaxDemo.java` |
| `public interface OrderRepository` | `OrderRepository.java` |
| `public record OrderId(...)` | `OrderId.java` |

一个文件可以包含额外的非公开顶级类型，但大型工程通常让每个主要类型拥有独立文件，以保持职责和导航清晰。

### 2. 代码块与语句

花括号定义类型体、方法体和局部代码块。分号结束变量声明、赋值、方法调用和 `return` 等语句：

```java
String status = "PAID";
System.out.println(status);
```

::: warning 多余分号可能掩盖控制流错误

类声明、方法声明、`if` 或循环的代码块末尾通常不额外写分号。多余分号会形成空语句，虽然部分位置可以编译，却可能掩盖条件或循环错误。

:::

### 3. 表达式可以产生值

方法调用、算术运算和变量读取都可以构成表达式。例如：

```java
int subtotal = 1_990 * 2;
```

右侧表达式先求值得到 `3980`，再由变量声明语句把值存入 `subtotal`。表达式的类型、转换和求值顺序将在本章的运算符文章单独解释。

## 五、标识符、关键字与大小写

标识符用于命名包、类型、方法和变量。它可以由 Unicode 字母、数字、下划线和货币符号等合法字符组成，但不能以数字开头，也不能与关键字或保留字冲突。

```java
int itemCount = 3;
String orderNumber = "ORD-42";
```

Java 严格区分大小写：

```text
orderNumber、OrderNumber、ORDER_NUMBER 是三个不同标识符
```

语法允许使用非 ASCII 标识符，但团队代码通常采用稳定的英文命名，避免输入法、字体和跨工具检索差异。

| 元素 | 常见约定 | 示例 |
|------|----------|------|
| 包 | 全小写，使用组织反向域名或稳定前缀 | `order` |
| 类、接口、记录 | UpperCamelCase | `OrderService` |
| 方法、变量 | lowerCamelCase | `calculateSubtotal` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |

命名约定不由编译器强制，但它是 Java 生态中重要的可读性契约。

## 六、注释与 Javadoc

Java 支持三种常见注释：

```java
// 单行注释

/*
 * 多行块注释
 */

/**
 * 可以由 javadoc 工具提取的文档注释。
 */
```

::: tip 注释说明契约与非直观决策

注释不会改变正常程序语义。有效注释应说明参数约束、业务原因、边界和非直观决策，不应逐行重复代码。公开 API 的 Javadoc 通常需要说明参数、返回值、异常和版本约束。

:::

注释不能嵌套：块注释内部再出现 `/*` 不会开始一个独立层级。临时屏蔽大段代码也容易被内部注释截断，应依靠版本控制而不是长期保留注释掉的实现。

## 七、完整程序

将完整源码保存为 `src/order/BasicSyntaxDemo.java`。它包含包声明、显式导入、公开类、私有构造方法、入口方法、普通静态方法和多条语句。

在任意位置新建一个空目录作为本篇示例目录，按文中标注的相对路径创建文件并保存为 UTF-8。后续编译和运行命令都在该目录执行；文件夹不存在时先创建相应父目录。

::: details 查看BasicSyntaxDemo的完整代码

```java
package order;

import java.time.LocalDate;

/**
 * 演示包、导入、类、方法和语句如何组成一个可编译的 Java 源文件。
 */
public final class BasicSyntaxDemo {

    /**
     * 工具类不需要实例化。
     */
    private BasicSyntaxDemo() {
    }

    /**
     * 创建固定日期的订单编号并输出。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        LocalDate orderDate = LocalDate.of(2026, 9, 2);
        String orderNumber = formatOrderNumber("ORD", orderDate, 42);

        System.out.println(orderNumber);
    }

    /**
     * 按前缀、日期和序号格式化订单编号。
     *
     * @param prefix 订单编号前缀，不能为空
     * @param orderDate 下单日期，不能为 null
     * @param sequence 当日序号，取值范围为 0～9999
     * @return 格式为“前缀-年月日-四位序号”的订单编号
     */
    private static String formatOrderNumber(String prefix, LocalDate orderDate, int sequence) {
        return "%s-%tY%<tm%<td-%04d".formatted(prefix, orderDate, sequence);
    }
}
```

:::

## 八、编译与运行

在本篇示例目录执行：

```powershell
New-Item -ItemType Directory -Force out | Out-Null

javac -Xlint:all -encoding UTF-8 `
  -d out `
  src/order/BasicSyntaxDemo.java

java -cp out order.BasicSyntaxDemo
```

预期输出：

```text
ORD-20260902-0042
```

编译器根据导入解析 `LocalDate`，根据包声明创建类文件目录；JVM 则根据类路径根和全限定类名找到入口类。输出正确同时证明了源码结构、导入、包路径、编译和启动参数保持一致。

## 九、常见失败场景

### 1. 文件名与公开类名不一致

错误信息通常包含：

```text
class BasicSyntaxDemo is public, should be declared in a file named BasicSyntaxDemo.java
```

应统一文件名和公开类名。删除 `public` 可能暂时消除错误，却改变了类型可见性，不是工程中的正确修复方式。

### 2. 漏写分号

在变量声明后漏掉分号，编译器可能报告 `';' expected`。先处理第一条编译错误，并检查它之前的完整语句；后续错误经常只是解析器无法从前一处错误恢复产生的连锁结果。

```java
String status = "PAID" // 错误：声明没有用分号结束
System.out.println(status);
```

修复第一行后重新编译，再判断是否仍有独立错误，避免同时追逐连锁诊断。

### 3. 未导入类型

删除 `LocalDate` 的导入但仍使用简单名称，通常会得到 `cannot find symbol`。可以恢复单类型导入，或使用 `java.time.LocalDate` 全限定名。只有在依赖本身缺失时，才需要继续检查模块或类路径。

```java
// 没有 import java.time.LocalDate; 时，使用全限定名仍可解析。
java.time.LocalDate orderDate = java.time.LocalDate.of(2026, 9, 2);
```

如果全限定名同样无法解析，再检查目标 JDK 是否包含该 API，以及编译命令使用的 Java 版本。

### 4. 运行时省略包名

`java -cp out BasicSyntaxDemo` 会报告主类找不到，因为 JVM 正在默认包中查找。修复时保留类路径根，并传入 `order.BasicSyntaxDemo`；不要把 `.class` 文件路径作为类名。

```powershell
# 错误：省略了 package 对应的名称
java -cp out BasicSyntaxDemo

# 正确：类路径根 + 全限定类名
java -cp out order.BasicSyntaxDemo
```

## 十、规范依据

- [JLS 3：Lexical Structure](https://docs.oracle.com/javase/specs/jls/se21/html/jls-3.html) 定义标识符、关键字、字面量、分隔符和注释。
- [JLS 7：Packages and Modules](https://docs.oracle.com/javase/specs/jls/se21/html/jls-7.html) 定义编译单元、包和导入声明。
- [JLS 8：Classes](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html) 定义类声明、成员和方法。
- [JLS 14：Blocks and Statements](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html) 定义代码块与语句结构。

编译器错误文字可能因 JDK 发行版和语言环境不同而变化，但合法结构和名称解析规则以 JLS 21 为准。
