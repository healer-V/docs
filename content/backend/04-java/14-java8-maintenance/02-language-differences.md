---
title: "Java 8 与 21 语法差异"
tags: [Java, Java 8, Java 21]
excerpt: "按变量、分支和类型建模比较 Java 8 与 21 的正式语法，区分源码接受范围与 Class 运行版本，使用同一 Record 模式示例验证编译和加载失败。"
date: 2026-09-11
---


# Java 8 与 21 语法差异

Java 21 支持 Java 8 之后加入的局部变量推断、表达式分支和新类型建模语法。维护 Java 8 项目时，应根据源码目标选择写法，而不是根据开发机安装的 JDK 决定。

## 一、常见语法对应

| Java 21 正式写法 | Java 8 对应方式 | 行为核对 |
|-----------------|----------------|----------|
| `var` 局部推断 | 显式局部类型 | 类型仍在编译期确定 |
| switch 表达式、箭头与 `yield` | switch 语句、分支赋值或方法返回 | 贯穿、空值与遗漏分支 |
| 文本块 | 普通字符串与换行 | 缩进、转义、尾部换行 |
| Record | 明确构造器、字段与访问器的类 | 相等性、可变组件、框架访问规则 |
| sealed 类型 | 接口或继承层次配合访问边界 | 无法完整复制编译期允许类型约束 |
| instanceof / Record / switch 模式 | 类型检查、强制转换和访问器 | null、守卫顺序、穷尽性 |

Lambda、方法引用、默认接口方法和 try-with-resources 已有 Java 8 可用形式，不需要为了维护旧项目全部改回匿名类。部分语法细节在后续版本扩大了允许范围，仍需按目标编译器核验。


## 二、分支与类型

### 1. 现代分支的含义

下面的 `ModernSyntax.java` 用 Record 表达订单结果，模式分支读取编号与金额。以下为其方法中的局部逻辑，`Order` 是文件内声明的 Record：

```java
Object result = new Order("ORD-1001", 4970);
String number = switch (result) {
    case Order(String value, long amount) when amount >= 0 -> value;
    default -> throw new IllegalArgumentException("invalid order");
};
System.out.println(number);
```

Java 8 需要先检查类型、显式转换并取字段，再验证金额。这个改写可以保留当前行为，但开放接口加 `instanceof` 不具备密封类型的全部编译期穷尽约束。

### 2. 不机械替换对象契约

普通 JavaBean 改为 Record 会改变访问器命名、构造方式和默认相等性；可变字段也不会因此自动深度不可变。代码更短不等于对框架、序列化和公共 API 没有影响。


## 三、编译与运行验证

安装 JDK 21 和 JDK 8，在任意位置新建空目录，以 UTF-8 保存下方文件。为两个已安装 JDK 设置本终端变量：

```powershell
$env:JAVA8_HOME = Read-Host 'JDK 8 安装目录'
$env:JAVA21_HOME = Read-Host 'JDK 21 安装目录'
$env:JAVA_HOME = $env:JAVA21_HOME
& "$env:JAVA8_HOME/bin/java.exe" -version
& "$env:JAVA21_HOME/bin/java.exe" -version
```

将以下内容保存为 `ModernSyntax.java`：

::: details 查看 ModernSyntax.java 完整内容

```java [ModernSyntax.java]
/** Java 21 正式语法对照，不纳入 Java 8 主制品。 */
public final class ModernSyntax {
    /** 表达已经校验的订单结果。 */
    record Order(String number, long totalCents) { }

    /** @param args 不使用参数；输出 Record 模式分派后的订单编号。 */
    public static void main(String[] args) {
        Object result = new Order("ORD-1001", 4970);
        String number = switch (result) {
            case Order(String value, long amount) when amount >= 0 -> value;
            default -> throw new IllegalArgumentException("invalid order");
        };
        System.out.println(number);
    }
}
```

:::

在新建目录使用 JDK 21 编译并运行：

```powershell
& "$env:JAVA21_HOME/bin/javac.exe" --release 21 -d out/modern ModernSyntax.java
& "$env:JAVA21_HOME/bin/java.exe" -cp out/modern ModernSyntax
& "$env:JAVA21_HOME/bin/javac.exe" --release 8 -d out/reject ModernSyntax.java
```

前两条实际得到 `ORD-1001`。第三条失败，编译器指出 switch 表达式、模式等不受 Java 8 目标支持；不能加一个旧 `target` 值让这些语法自动转换。

再用真实 Java 8 运行同一份 Java 21 产物，`JAVA8_HOME` 指向已安装 JDK 8：

```powershell
& "$env:JAVA8_HOME/bin/java.exe" -cp out/modern ModernSyntax
```

实际失败为 `UnsupportedClassVersionError`，因为产物主版本为 65，Java 8 支持到 52。这是加载边界，和 Java 8 编译器看不懂源码属于不同阶段。

::: warning 不以修改文件头实现兼容
降低 Class 版本字段不能补回缺失 API、指令语义和链接条件。应使用适合目标的源码与 `--release`，并执行目标运行时测试。
:::


## 四、版本边界

本文只对照 Java 21 已正式交付的能力，不需要预览参数。维护时先保留旧业务行为，按实际价值采用新写法；模块导入、紧凑源文件等更晚版本能力不属于这份 Java 21 语法范围。

`var` 的作用域和限制见[变量、常量与作用域](../02-language-syntax/02-variables-constants-scope.md)，switch 的结果与贯穿规则见[条件分支](../02-language-syntax/06-conditionals.md)，缩进与换行规则见[字符串与文本块](../04-core-apis/01-string-text-blocks.md)。这些语法各有独立行为，不能只按“代码更短”判断是否替换。

类型规则的完整主讲见[密封类型与模式匹配](../03-object-oriented-design/11-sealed-pattern-matching.md)；跨版本构建与失败验证见[多 JDK 与 Toolchains](./06-multi-jdk-toolchains.md)。
