---
title: "第一个 Java 程序"
tags:
  - Java 21
  - javac
  - main 方法
excerpt: "通过一个完整的控制台程序解释源文件、类、main 方法和控制台输出，并完成编译、运行、源文件模式与常见错误的闭环验证。"
date: 2026-09-02
---

# 第一个 Java 程序

一个可以由 `java` 命令直接启动的传统 Java 类，需要提供约定形式的 `main` 方法。下面的程序虽然只有一行输出，却完整包含源文件、类声明、应用入口、编译产物和 JVM 启动过程。

## 一、完整源码

将完整源码保存为 `HelloJava.java`。文件采用 UTF-8 编码，不声明包，便于第一次从命令行观察类文件。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看 HelloJava 第一个程序完整代码

```java
/**
 * 输出第一条 Java 控制台消息。
 */
public final class HelloJava {

    /**
     * 工具类不需要实例化。
     */
    private HelloJava() {
    }

    /**
     * Java 应用入口，输出固定问候语。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        System.out.println("Hello, Java 21");
    }
}
```

:::

代码中的空行和缩进用于表达结构；Java 编译器并不依赖固定缩进判断代码块，而是根据花括号、分号和关键字解析语法。

## 二、源文件与类声明

### 1. `public class` 决定文件名

`public final class HelloJava` 声明了一个名为 `HelloJava` 的公开类。源文件中存在公开顶级类时，文件名必须与类名完全一致，包括大小写：

```text
类名：HelloJava
文件名：HelloJava.java
```

Java 标识符区分大小写，因此 `hellojava.java`、`HelloJAVA.java` 都不是这个公开类的正确文件名。

`final` 表示该类不能被其他类继承。这里使用它是因为这个类只承担程序入口职责，不需要构造子类；它不是 `main` 方法能够运行的必要条件。

### 2. 私有构造方法阻止无意义实例化

`private HelloJava()` 是构造方法。它与类同名，没有返回值，并被声明为 `private`，所以类外代码不能执行 `new HelloJava()`。

::: tip 静态入口与业务对象使用不同构造方式

程序入口是静态方法，不需要先创建 `HelloJava` 对象。把构造方法设为私有可以明确表达“这个类只提供静态入口”。普通业务实体和服务类不应机械照搬这种写法。

:::

## 三、main 方法为什么是程序入口

传统 Java 启动器会在指定类中寻找下面的方法签名：

```java
public static void main(String[] args)
```

每个部分都有明确含义：

| 部分 | 含义 | 改错后的结果 |
|------|------|--------------|
| `public` | JVM 启动器可以访问该方法 | 启动器无法按约定调用 |
| `static` | 不创建对象即可调用 | 启动器不会为入口类自动实例化对象 |
| `void` | 方法不向 JVM 返回 Java 值 | 进程状态由正常结束或异常等方式决定 |
| `main` | 约定的方法名 | 启动器找不到入口方法 |
| `String[] args` | 接收命令行参数数组 | 参数类型不符合入口约定 |

`String... args` 也可以作为等价入口参数，因为可变参数在方法签名层面使用数组。初学阶段优先使用 `String[] args`，它更直接地表现启动参数的数据结构。

::: warning `main` 不是所有 Java 代码的入口
单元测试由测试引擎发现并调用，Web 请求由服务器和框架分发，定时任务由调度器触发。`main` 是启动一个独立 Java 应用的常见入口，不是每个业务方法都需要具备的形式。
:::

## 四、输出语句如何工作

```java
System.out.println("Hello, Java 21");
```

这条语句包含三个对象或调用层次：

| 表达式 | 作用 |
|--------|------|
| `System` | `java.lang` 包中的标准类，编译器会自动导入该包 |
| `out` | `System` 类提供的标准输出流 |
| `println(...)` | 输出参数内容，并在末尾写入换行符 |

字符串字面量使用双引号。语句末尾的分号表示这条语句结束。中文弯引号 `“”` 不能替代代码中的英文半角双引号。

::: info 标准输出与生产日志职责不同

标准输出通常显示在终端或 IDE 控制台，但部署平台可以重定向它。生产应用一般通过日志框架输出具有级别、时间和上下文的日志，不会只依赖 `System.out.println`。

:::

## 五、编译源文件

以下命令都在本篇示例目录执行。先创建独立输出目录，避免把 `.class` 文件写到源码目录：

```powershell
New-Item -ItemType Directory -Force out | Out-Null

javac -Xlint:all -encoding UTF-8 `
  -d out `
  HelloJava.java
```

参数含义如下：

| 参数 | 作用 |
|------|------|
| `-Xlint:all` | 启用编译器可提供的全部常见警告 |
| `-encoding UTF-8` | 明确指定源文件字符编码 |
| `-d out` | 指定生成的类文件根目录 |

命令成功时通常没有控制台输出，进程退出码为 `0`。可以检查生成文件：

```powershell
Get-ChildItem out
```

预期包含：

```text
HelloJava.class
```

::: warning 修改源码后必须重新编译

`.class` 是 JVM 类文件，不是适合人工编辑的文本。源代码修改后必须重新编译，旧类文件不会自动同步变化。

:::

## 六、运行编译结果

使用 `java` 启动器运行类时，传入的是类名而不是文件名：

```powershell
java -cp out HelloJava
```

预期输出：

```text
Hello, Java 21
```

`-cp out` 把编译输出目录设置为类路径根目录。JVM 在该目录下查找 `HelloJava.class`，加载类后调用 `main` 方法。

不要写成下面两种形式：

```powershell
# 错误：传统类启动模式不传 .class 文件路径
java out/HelloJava.class

# 错误：当前目录不是类文件所在的类路径根目录
java HelloJava
```

第二条命令只有在当前类路径恰好包含 `HelloJava.class` 时才可能成功。明确使用 `-cp` 可以让命令不依赖隐含工作目录。

## 七、直接运行源文件

Java 11 起，`java` 启动器支持直接运行单个源文件。下面的命令不要求先手工调用 `javac`：

```powershell
java HelloJava.java
```

输出仍然是：

```text
Hello, Java 21
```

源文件模式会在内存中编译并执行源码，适合单文件示例和快速验证，但不会在 `out` 中留下可复用的类文件。正式项目仍应由 Maven、Gradle 或明确的编译步骤管理多文件依赖、测试和打包。

::: warning Java 8 不支持源文件模式
Java 8 必须先使用 `javac` 编译，再使用 `java` 运行类文件。维护 Java 8 项目时，不能把 `java SomeFile.java` 写进构建或启动脚本。
:::

## 八、编译错误如何阅读

### 1. 文件名与公开类名不一致

假设把源码保存为 `Greeting.java`，内部仍声明 `public class HelloJava`，编译器会报告类似错误：

```text
class HelloJava is public, should be declared in a file named HelloJava.java
```

错误信息给出公开类名和要求的文件名。正确处理是统一类名与文件名，而不是删除 `public` 来掩盖组织问题。

### 2. 使用了中文标点

如果把字符串引号写成中文弯引号，编译器可能报告非法字符或语法错误。应检查错误中的行号和列号，把代码标点改为英文半角字符；源码内容本身仍可以使用中文，并通过 `-encoding UTF-8` 保持一致编码。

### 3. 漏写分号或花括号

::: tip 从第一条编译错误向前检查

编译器常在“发现无法继续解析的位置”报告错误，该位置不一定就是最早写错的位置。例如漏掉右花括号，错误可能出现在文件结尾。排查时先看第一条错误，再检查它前面的完整语句和代码块边界。

:::

## 九、运行错误如何阅读

### 1. 找不到主类

```text
Error: Could not find or load main class HelloJava
```

先确认类文件是否存在，再确认 `-cp` 指向类路径根目录，最后确认运行时使用的是类名而非文件路径。修改 `main` 里的输出文字无法解决类加载路径错误。

### 2. 找不到 main 方法

如果方法名、可见性或参数签名不符合约定，启动器会报告找不到主方法。把入口恢复为 `public static void main(String[] args)`，重新编译后再运行；只修改源码但不重新编译，JVM 仍会读取旧类文件。

### 3. 源码改了但输出没变

这通常表示运行的是旧类文件或另一个输出目录。检查编译命令的 `-d` 与运行命令的 `-cp` 是否一致，并用 `Get-Command java` 确认没有误用其他 Java 环境。

## 十、验证结论

完成上面的编译与运行后，可以确认：

- 源文件名与公开类名形成编译期约束；
- `javac` 把源码转换为 `.class` 类文件；
- `java` 根据类路径和类名启动 JVM；
- JVM 按约定寻找并调用 `main` 方法；
- `System.out.println` 把文本写入标准输出。

这个示例没有覆盖包管理、第三方依赖、测试和 JAR 打包。它的边界是证明最小 Java 程序如何从文本源码变为可执行类。

## 十一、官方资料

- [Dev.java：Getting Started with Java](https://dev.java/learn/getting-started/) 提供编译、运行和源文件模式的官方入门说明。
- [`java` Command Specification](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html) 说明类、JAR、模块和源文件启动模式。
- [`javac` Command Specification](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html) 说明编译参数、输出目录和版本控制。
- [Java Language Specification：Program Structure](https://docs.oracle.com/javase/specs/jls/se21/html/jls-7.html) 定义编译单元、包与类型声明规则。
