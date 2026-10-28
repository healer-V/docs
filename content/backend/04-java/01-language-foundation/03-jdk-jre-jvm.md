---
title: "JDK、JRE 与 JVM"
tags:
  - JDK
  - JRE
  - JVM
  - Java 21
excerpt: "解释现代 JDK、运行时镜像与 JVM 的包含关系，并通过编译、类文件检查和运行时信息验证 Java 程序的完整执行链。"
date: 2026-09-02
---

# JDK、JRE 与 JVM

JDK、JRE 和 JVM 描述的是开发工具、运行环境与执行引擎三个不同层次。Java 8 时代常见的“单独安装 JRE”说法已不能直接套用到 Java 21：现代 JDK 自带运行 Java 程序所需的运行时镜像，Oracle 和 OpenJDK 不再提供传统意义上的独立 JRE 下载包。

## 一、三者分别负责什么

| 名称 | 完整名称 | 核心职责 | 典型内容 |
|------|----------|----------|----------|
| JDK | Java Development Kit | 开发、运行、分析和打包 Java 程序 | 编译器、启动器、标准模块、调试与诊断工具 |
| JRE | Java Runtime Environment | Java 8 时代常用的独立运行环境概念 | JVM、核心类库、运行所需文件 |
| JVM | Java Virtual Machine | 加载、验证并执行类文件 | 类加载器、执行引擎、运行时内存、垃圾收集器 |

在 Java 21 中，更准确的关系是：

::: details 查看 JDK、运行时与 JVM 的组成关系

```text
JDK 21
├── 运行时镜像
│   ├── Java 标准模块
│   └── JVM 实现
└── 开发与诊断工具
    ├── javac
    ├── java
    ├── javap
    ├── jdb
    ├── javadoc
    ├── jar
    ├── jlink
    └── jcmd / jfr / jstack 等
```

:::

::: info JVM 与标准库承担不同职责

JVM 不是包含全部标准库的独立开发包。它负责执行符合要求的类文件；程序能调用集合、文件或网络 API，是因为运行时镜像同时提供了对应 Java 模块。

:::

## 二、运行环境的版本差异 {#二、java-8-与-java-21-的运行环境差异}

### 1. Java 8 的传统分发方式

Java 8 时代常见两种安装包：

- JDK：面向开发人员，包含编译和运行工具；
- JRE：面向只运行 Java 程序的用户，不提供 `javac` 等开发工具。

因此许多旧文档会画出“JDK 包含 JRE，JRE 包含 JVM”的关系图。这张图适合解释 Java 8 的发行结构，但不是 Java 21 安装包的精确描述。

### 2. Java 9 之后的模块化运行时

Java 9 引入 Java Platform Module System 后，JDK 和标准库改为模块化组织。应用可以使用 `jlink` 根据需要组合定制运行时镜像，而不是依赖一个统一、单独分发的传统 JRE。

::: warning 不要在 Java 21 环境中寻找 `jre` 子目录
Java 8 JDK 通常包含明显的 `jre` 目录；Java 21 JDK 的目录结构已经改变。判断安装是否完整应执行 `java -version` 和 `javac -version`，不能以是否存在 `jre` 文件夹为标准。
:::

## 三、JDK 中的常用工具

| 工具 | 作用 | 典型使用场景 |
|------|------|--------------|
| `javac` | 把 Java 源文件编译为类文件 | 检查语法和类型、生成字节码 |
| `java` | 启动 JVM 并运行类、JAR 或源文件 | 启动应用、传入运行参数 |
| `javap` | 反汇编或查看类文件结构 | 检查方法签名、字节码和类文件版本 |
| `jar` | 创建、查看和更新 JAR 文件 | 打包类文件和资源 |
| `javadoc` | 从源码注释生成 API 文档 | 发布公共接口说明 |
| `jdb` | JDK 自带的命令行调试器 | 设置断点、单步执行、查看变量 |
| `jcmd` | 向运行中的 JVM 发送诊断命令 | 查看线程、堆、类加载和 JFR 状态 |
| `jlink` | 根据模块生成定制运行时镜像 | 缩减独立部署所需运行时 |

日常使用 IDE 时，IDE 仍会在底层调用 JDK 编译器、启动 JVM 或连接调试协议。理解这些命令可以帮助区分“IDE 配置问题”和“Java 程序问题”。

## 四、从源文件到 JVM 的最小闭环

下面的程序输出实际运行它的 Java 版本、运行时名称、虚拟机名称和类文件版本。完整源码保存为 `RuntimeInfo.java`。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看 RuntimeInfo 运行环境示例完整代码

```java
/**
 * 输出编译与运行 Java 程序时可以观察到的运行时信息。
 */
public final class RuntimeInfo {

    /**
     * 工具类不需要实例化。
     */
    private RuntimeInfo() {
    }

    /**
     * 输出 Java 版本、运行时、虚拟机名称和类文件版本。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        System.out.println("java.version=" + System.getProperty("java.version"));
        System.out.println("java.runtime.name=" + System.getProperty("java.runtime.name"));
        System.out.println("java.vm.name=" + System.getProperty("java.vm.name"));
        System.out.println("java.class.version=" + System.getProperty("java.class.version"));
    }
}
```

:::

在本篇示例目录执行以下 PowerShell 命令。`-d` 指定类文件输出目录，`-cp` 指定 JVM 查找类的根目录。

```powershell
New-Item -ItemType Directory -Force out | Out-Null

javac -Xlint:all -encoding UTF-8 `
  -d out `
  RuntimeInfo.java

java -cp out RuntimeInfo
```

在 OpenJDK 21 环境中，输出具有以下格式；补丁版本和发行版名称会随本机 JDK 改变：

```text
java.version=21.0.11
java.runtime.name=OpenJDK Runtime Environment
java.vm.name=OpenJDK 64-Bit Server VM
java.class.version=65.0
```

::: tip 分别核对编译器与运行时

这里可以观察到两个独立事实：`javac` 生成了类文件，`java` 启动的 JVM 决定了运行时属性。编译器版本和运行时版本可以不同，但这种混用必须满足类文件兼容规则。

:::

## 五、类文件记录了什么

使用 `javap` 可以读取编译结果，而不执行其中的业务逻辑：

```powershell
javap -verbose `
  -classpath out `
  RuntimeInfo
```

Java 21 默认编译的类文件会包含以下关键行：

```text
major version: 65
```

类文件主版本号 65 对应 Java 21。Java 8 JVM 只认识最高为 52 的类文件，因此直接运行该文件会出现 `UnsupportedClassVersionError`。这类错误发生在 JVM 解析类文件时，与源码中某个方法是否被调用无关。

如果需要用 JDK 21 编译面向 Java 8 的代码，应使用 `--release 8` 同时约束语言特性、类文件版本和可用标准 API。当前的 `RuntimeInfo.java` 只调用 Java 8 已有的 API，可以直接用它验证，无需另建源文件：

```powershell
javac --release 8 -encoding UTF-8 `
  -d out/java8-compatible `
  RuntimeInfo.java

javap -verbose -classpath out/java8-compatible RuntimeInfo
```

这次类文件检查应显示 `major version: 52`。JDK 21 可能同时提示 Java 8 目标选项已过时；该警告不代表编译失败，仍应检查退出码和生成的类文件。程序输出的 `java.class.version` 表示当前 JVM 支持的类文件版本；它不能代替 `javap` 检查某个文件的实际版本。

::: warning source 参数不能保证 API 兼容

仅设置 `-source 8` 不足以保证 API 兼容，因为编译器仍可能看到当前 JDK 的新 API。即使使用 `--release 8`，第三方依赖也必须分别确认 Java 8 兼容性。

:::

## 六、JVM 如何启动一个类

执行 `java -cp out RuntimeInfo` 时，关键过程包括：

1. `java` 启动器创建 JVM 进程，并把 `out` 设置为类路径；
2. JVM 根据主类名在类路径下定位 `RuntimeInfo.class`；
3. 类加载器读取类文件，JVM 对字节码格式和约束进行验证；
4. JVM 链接并初始化类；
5. 启动器寻找 `public static void main(String[] args)` 方法；
6. 执行引擎解释或编译方法中的字节码，并调用标准库输出文本。

::: info 加载、链接和初始化需要分别判断

加载、链接和初始化是不同阶段。类文件能被找到，不代表它一定能通过验证；通过验证，也不代表静态初始化一定成功。后续看到 `ClassNotFoundException`、`NoClassDefFoundError` 或 `ExceptionInInitializerError` 时，需要根据发生阶段继续定位。

:::

## 七、常见失败场景

### 1. 当前环境只有运行工具，没有编译器

执行 `java -version` 成功但 `javac -version` 失败，说明 `PATH` 可能指向残留运行环境、精简运行时或不完整安装。先检查两个命令的实际路径：

```powershell
Get-Command java | Select-Object -ExpandProperty Source
Get-Command javac | Select-Object -ExpandProperty Source
```

二者应来自预期的 JDK 安装目录。如果路径不同，应先修正 `JAVA_HOME` 和 `PATH`，再调整 IDE。

### 2. JVM 找不到主类

下面的命令把类路径指向了没有类文件的目录：

```powershell
java -cp missing-classes RuntimeInfo
```

本例的类文件由 `javac -d out` 写入 `out`。正确命令是 `java -cp out RuntimeInfo`；类路径不会自动修正拼写错误，也不会递归搜索其他目录。

### 3. 编译版本高于运行版本

错误信息中如果出现 `class file version 65.0` 和 `only recognizes ... 52.0`，说明类文件由 Java 21 编译，却交给 Java 8 JVM 运行。修复方式只有两类：升级运行环境，或按目标版本重新编译并确认所有依赖兼容；反复修改类路径不能解决版本不兼容。

## 八、官方资料

- [Dev.java：Getting Started with Java](https://dev.java/learn/getting-started/) 说明现代 JDK、编译工具和源文件启动方式。
- [JDK 21 Tool Specifications](https://docs.oracle.com/en/java/javase/21/docs/specs/man/index.html) 提供 `java`、`javac`、`javap`、`jdb` 等工具的参数定义。
- [Java Virtual Machine Specification 21](https://docs.oracle.com/javase/specs/jvms/se21/html/) 定义类文件格式、加载链接和字节码执行规则。
- [Java Platform Module System](https://openjdk.org/projects/jigsaw/spec/) 说明 Java 9 之后的模块化运行时模型。

这些资料分别覆盖工具操作、虚拟机规范和模块系统。排查命令参数应查工具规范，判断类文件行为则应查 JVM 规范。
