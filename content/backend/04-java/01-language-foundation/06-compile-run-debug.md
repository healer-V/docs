---
title: "编译、运行与调试"
tags:
  - javac
  - JVM
  - jdb
  - Java 21
excerpt: "使用带参数校验的完整程序串联编译、类路径、运行时异常、字节码检查和断点调试，建立按失败阶段定位 Java 问题的方法。"
date: 2026-09-02
---

# 编译、运行与调试

Java 程序的问题可能发生在源码编译、JVM 启动、类加载或业务执行阶段。有效调试不是反复修改代码碰运气，而是先确定失败阶段，再通过编译输出、退出码、异常栈、字节码或断点收集证据。

## 一、用于诊断的完整程序

使用 JDK 21，在一个空文件夹中创建 `LaunchDiagnostics.java`，将下面的代码以 UTF-8 保存。程序接收订单号和商品数量，完成参数检查、类型转换和摘要输出；后续命令均在这个文件夹中执行。

::: details 查看 LaunchDiagnostics 启动诊断完整代码

```java
/**
 * 演示命令行参数、运行错误和断点调试所需的最小调用链。
 */
public final class LaunchDiagnostics {

    /**
     * 工具类不需要实例化。
     */
    private LaunchDiagnostics() {
    }

    /**
     * 读取订单号和数量参数，并输出标准化摘要。
     *
     * @param args 第一个参数为非空订单号，第二个参数为正整数数量
     */
    public static void main(String[] args) {
        if (args.length != 2) {
            throw new IllegalArgumentException("用法：LaunchDiagnostics <订单号> <正整数数量>");
        }

        String orderNumber = requireOrderNumber(args[0]);
        int quantity = parsePositiveQuantity(args[1]);
        String summary = formatSummary(orderNumber, quantity);

        System.out.println(summary);
    }

    /**
     * 校验并返回订单号。
     *
     * @param value 原始订单号，不能为 null 或空白字符串
     * @return 通过校验的订单号
     * @throws IllegalArgumentException 订单号为空白时抛出
     */
    private static String requireOrderNumber(String value) {
        if (value.isBlank()) {
            throw new IllegalArgumentException("订单号不能为空");
        }
        return value;
    }

    /**
     * 把文本解析为正整数数量。
     *
     * @param value 数量文本，必须是 int 范围内的大于 0 的十进制整数
     * @return 解析后的正整数数量
     * @throws NumberFormatException 文本不是合法 int 时抛出
     * @throws IllegalArgumentException 数量小于或等于 0 时抛出
     */
    private static int parsePositiveQuantity(String value) {
        int quantity = Integer.parseInt(value);
        if (quantity <= 0) {
            throw new IllegalArgumentException("商品数量必须大于 0");
        }
        return quantity;
    }

    /**
     * 格式化订单摘要，作为调试时观察参数和返回值的断点位置。
     *
     * @param orderNumber 已通过非空校验的订单号
     * @param quantity 已通过正数校验的商品数量
     * @return 单行订单摘要
     */
    private static String formatSummary(String orderNumber, int quantity) {
        return "order=" + orderNumber + ", quantity=" + quantity;
    }
}
```

:::

::: info isBlank 示例需要对应 Java 版本

这个示例使用 `String.isBlank()`，因此不能按原样在 Java 8 编译。Java 8 维护代码可以根据是否允许全空白的业务规则，改用 `value.trim().isEmpty()`；迁移时还要注意 `trim()` 与 Unicode 空白字符处理并不完全等价。

:::

## 二、带调试信息编译

在本篇示例目录执行：

```powershell
New-Item -ItemType Directory -Force out | Out-Null

javac -Xlint:all -g -encoding UTF-8 -d out LaunchDiagnostics.java
```

`-g` 要求编译器写入完整调试信息，包括源文件、行号和局部变量信息。调试器可以没有源码也执行字节码，但缺少这些信息时，断点定位和变量查看会明显受限。

编译阶段重点观察：

| 证据 | 表示什么 |
|------|----------|
| 退出码 `0` | 编译完成，没有阻断性错误 |
| 编译器错误中的文件、行、列 | 源码无法通过语法或类型检查的位置 |
| 编译器警告 | 代码可生成类文件，但存在值得处理的风险 |
| 输出目录中的类文件 | 本例的 `LaunchDiagnostics.class` 已生成，可用于运行和调试 |

生成的文件应位于：

```text
out/LaunchDiagnostics.class
```

## 三、传入参数并运行

运行时指定主类，并在类名后传入两个参数：

```powershell
java -cp out LaunchDiagnostics ORD-20260902-001 3
```

预期输出：

```text
order=ORD-20260902-001, quantity=3
```

启动命令可分为 JVM 参数、主类和应用参数：

| 命令部分 | 含义 |
|----------|------|
| `-cp out` | 从 `out` 查找编译后的类 |
| `LaunchDiagnostics` | 需要启动的主类 |
| `ORD-20260902-001 3` | 传给 `main` 的两个字符串参数 |

`main` 中的 `args[0]` 是订单号，`args[1]` 是字符串 `"3"`。命令行参数最初都是字符串，程序必须自行完成数字解析和业务约束校验。

## 四、根据退出码判断执行结果

PowerShell 可以在命令结束后读取本地进程退出码：

```powershell
java -cp out `
  LaunchDiagnostics `
  ORD-20260902-001 3

$LASTEXITCODE
```

正常完成时输出 `0`。未捕获异常会使进程以非零状态结束，并把异常类型、消息和调用栈写到标准错误。

::: warning 退出码为零不证明业务正确

退出码只能说明进程是否按其约定结束，不能证明业务结果一定正确。例如程序即使错误地输出数量 `30`，只要没有异常，退出码仍可能是 `0`。因此验证还必须检查输出内容或自动化测试断言。

:::

## 五、用异常栈定位运行错误

### 1. 缺少启动参数

只传订单号：

```powershell
java -cp out `
  LaunchDiagnostics `
  ORD-20260902-001
```

程序会以非零状态结束，并报告：

```text
Exception in thread "main" java.lang.IllegalArgumentException: 用法：LaunchDiagnostics <订单号> <正整数数量>
    at LaunchDiagnostics.main(LaunchDiagnostics.java:...)
```

第一行给出异常类型和业务消息；后续栈帧给出异常经过的方法和源码行。这里异常直接从 `main` 抛出，所以应先检查启动参数，而不是修改类路径。

### 2. 数量不是整数

```powershell
java -cp out `
  LaunchDiagnostics `
  ORD-20260902-001 three
```

关键异常为：

```text
java.lang.NumberFormatException: For input string: "three"
```

调用栈会经过 `Integer.parseInt`、`parsePositiveQuantity` 和 `main`。阅读时通常从最接近业务代码的栈帧开始，确认传入值和约束，再决定是在入口拒绝、转换错误，还是上层调用传错数据。

### 3. 数量不满足业务约束

传入 `0` 能通过整数解析，却不能通过正数校验：

```powershell
java -cp out `
  LaunchDiagnostics `
  ORD-20260902-001 0
```

::: tip 分别验证输入格式与业务约束

此时异常消息为 `商品数量必须大于 0`。这说明“格式合法”和“业务有效”是两层检查，不能用一次 `parseInt` 代替全部参数校验。

:::

## 六、使用 javap 检查编译结果

`javap` 可以在不运行代码的情况下查看类结构和字节码：

```powershell
javap -c -l -p `
  -classpath out `
  LaunchDiagnostics
```

参数作用如下：

| 参数 | 作用 |
|------|------|
| `-c` | 反汇编方法字节码 |
| `-l` | 显示行号表和局部变量表 |
| `-p` | 同时显示私有方法 |

输出中应能看到 `main`、`requireOrderNumber`、`parsePositiveQuantity` 和 `formatSummary`，以及与源码对应的 `LineNumberTable`、`LocalVariableTable`。如果局部变量表缺失，检查编译时是否使用了 `-g`。

`javap` 适合验证“编译器实际生成了什么”，但不能替代运行调试。字节码存在某个分支，不代表当前输入一定执行了这个分支。

## 七、使用 jdb 进行断点调试

JDK 自带的 `jdb` 可以展示调试器的基本模型。确认已使用 `-g` 将 `LaunchDiagnostics.java` 编译到 `out`，然后在本篇新建的示例目录启动：

```powershell
jdb -classpath out `
  LaunchDiagnostics `
  ORD-20260902-001 3
```

::: warning 应用参数放在 jdb 启动命令中

`jdb` 启动命令末尾的订单号和数量会被保存为目标程序参数。不要把这两个参数写在交互式 `run` 命令后面，否则 `jdb` 会把第一个值当成要替换的主类名。

:::

进入 `jdb` 提示符后，依次输入：

```text
stop in LaunchDiagnostics.formatSummary
run
locals
where
cont
exit
```

各命令承担不同观察任务：

| 命令 | 作用 | 预期观察 |
|------|------|----------|
| `stop in ...formatSummary` | 在方法入口设置断点 | 调试器确认断点被推迟或设置 |
| `run` | 使用启动 `jdb` 时保存的参数运行目标程序 | 执行在 `formatSummary` 方法暂停 |
| `locals` | 查看当前栈帧局部变量 | `orderNumber` 为订单号，`quantity` 为 `3` |
| `where` | 查看当前线程调用栈 | `main` 调用了 `formatSummary` |
| `cont` | 继续执行 | 程序输出摘要并结束 |
| `exit` | 退出调试器 | 返回 Shell |

IDE 的断点、变量面板、单步进入和调用栈窗口建立在相同概念上。掌握 `jdb` 不是为了取代 IDE，而是为了理解调试器正在控制哪个 JVM、暂停哪个线程和查看哪个栈帧。

::: warning 断点会暂停目标线程
在共享测试环境或生产服务中随意挂起线程可能造成请求超时和级联故障。生产问题优先使用日志、指标、线程转储和 JFR 等低侵入证据；交互式断点只应用在受控开发环境。
:::

## 八、类路径错误与业务异常的区别

把类路径改成不存在的目录：

```powershell
java -cp out/not-exists `
  LaunchDiagnostics `
  ORD-20260902-001 3
```

JVM 会报告：

```text
Error: Could not find or load main class LaunchDiagnostics
```

此时 `main` 根本没有执行，因此不会出现订单参数校验异常。修复顺序应是：

1. 确认 `.class` 文件实际生成的位置；
2. 让 `-cp` 指向包含类文件的 `out` 目录；
3. 使用主类名 `LaunchDiagnostics`，不要附加 `.java` 或 `.class` 后缀；
4. 类成功启动后，再处理业务代码抛出的异常。

## 九、按阶段选择证据

| 失败阶段 | 典型现象 | 首选证据 | 常用工具 |
|----------|----------|----------|----------|
| 编译 | 语法、类型或符号错误 | 第一条编译错误和源码位置 | `javac`、IDE 编译器 |
| JVM 启动 | 参数无效、版本不对 | 启动命令、Java 版本、退出码 | `java -version`、`Get-Command` |
| 类加载 | 主类或依赖类找不到 | 类文件位置、包名、类路径 | `javap`、`jar`、启动参数 |
| 业务运行 | 未捕获异常或错误结果 | 异常栈、输入、日志和断点状态 | 调试器、测试、日志 |
| 性能与资源 | CPU 高、阻塞、内存增长 | 线程、堆、GC、JFR 事件 | `jcmd`、JFR、线程/堆转储 |

先定位阶段再选工具，可以避免无关操作。例如类路径错误不需要加断点，业务结果错误也不能仅凭编译成功判定代码正确。

## 十、验证结论与边界

本示例证明了以下执行链：

```text
源码
  → javac 编译并写入调试信息
  → 类路径定位主类
  → main 接收字符串参数
  → 方法调用完成解析与校验
  → 正常输出或异常栈
  → jdb 在指定栈帧观察变量
```

示例没有引入日志框架、自动化测试、构建工具和远程调试。正式工程应通过测试固定正确行为，通过结构化日志记录上下文，并限制远程调试端口的网络和访问权限。

## 十一、官方资料

- [`javac` Command Specification](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html) 说明编译、调试信息和目标版本参数。
- [`java` Command Specification](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html) 说明类路径、启动模式和 JVM 参数。
- [`javap` Command Specification](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javap.html) 说明类文件反汇编选项。
- [`jdb` Command Specification](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jdb.html) 说明断点、线程、栈帧和单步调试命令。

命令参数以 JDK 21 工具规范为准。IDE 可能提供更友好的界面，但它配置的 Java 版本、类路径、启动参数和调试目标仍应与命令行模型一致。
