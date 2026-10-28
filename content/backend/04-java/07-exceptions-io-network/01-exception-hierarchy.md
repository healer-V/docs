---
title: "Java 异常体系"
tags:
  - Java
  - Exception
excerpt: "通过 Throwable 层次、订单输入和数据源失败区分受检与非受检异常，解释编译器要求、方法契约和 Error 的处理边界，用完整程序与独立编译错误验证调用方责任。"
date: 2026-09-08
---

# Java 异常体系

Java 异常使用 Throwable 对象表达执行失败，并把控制流转移到能够匹配该类型的处理位置。异常类型决定编译器是否要求调用方捕获或声明，但不直接决定失败是否能恢复、是否应该重试或是否需要终止整个进程。

## 一、Throwable 的类型关系

Error 和 Exception 都直接继承 Throwable，RuntimeException 继承 Exception。非受检异常包括 RuntimeException、Error 及其子类；除此以外的 Throwable 类型属于受检异常。业务代码通常继承 Exception 或 RuntimeException 设计错误契约，不直接继承 Throwable。[Java 21 异常分类](https://docs.oracle.com/javase/specs/jls/se21/html/jls-11.html#jls-11.1.1)

| 类型分支 | 编译器是否强制捕获或声明 | 订单场景中的判断 |
|----------|--------------------------|------------------|
| IOException 等受检异常 | 是 | 读取失败必须沿签名传播，或在有处理策略的位置捕获 |
| RuntimeException 及子类 | 否 | 数量文本非法、违反对象状态等问题仍需准确定位 |
| Error 及子类 | 否 | 严重运行条件通常超出普通业务恢复能力，不能统一降级成正常结果 |

::: warning 扩大捕获类型也扩大恢复责任

`catch (Exception error)` 不会捕获 Error，`catch (Throwable error)` 则覆盖两条分支。扩大捕获类型会扩大需要负责的恢复范围，不是无成本地提高“容错率”。

:::

Error 也不是“必然立即关闭 JVM”的语法指令。未捕获异常首先影响当前线程的执行；进程结果取决于线程和运行环境。普通应用不应通过故意耗尽内存或无限递归来验证分类，本例只构造和抛出明确标注的 AssertionError。

## 二、受检异常进入方法契约

方法体中的受检异常必须被捕获，或由 `throws` 声明允许传播的类型。调用方法时，编译器依据被调用声明检查责任，不会因为本次参数“看起来不会失败”而忽略受检异常。

`readOrder(boolean available) throws IOException` 允许读取失败沿调用栈传递。`throws` 本身不会创建或抛出异常；`throw new IOException(...)` 才是本例实际触发失败的语句。main 继续声明 IOException 是允许进程在失败时非零退出，并不表示失败已经被恢复。

重写方法时，可以缩小或取消继承契约中的受检异常声明，不能任意新增调用方原契约不允许的受检异常。否则，通过父类型调用的代码将无法根据原签名履行处理责任。

| 选择 | 适用条件 | 应保留的信息 |
|------|----------|--------------|
| 在当前层捕获 | 当前层能明确恢复、拒绝输入或转换为稳定结果 | 失败类型、处理动作和必要上下文 |
| 继续 throws | 当前层没有恢复策略，调用方需要决定 | 精确异常类型，避免无必要的 throws Exception |
| 转换异常 | 跨越技术与业务边界 | 稳定业务语义和原始 cause |

::: info 异常分类不决定是否可以重试

受检不等于可恢复，非受检也不等于可以忽略。数量为0通常需要修正输入，而不是重试；文件临时不可用是否可重试，还取决于操作幂等性和失败阶段。

:::

## 三、异常对象携带哪些证据

异常对象中的类型、消息、原因链和堆栈分别回答不同问题。只打印一条消息会丢失调用路径，只记录堆栈而没有业务上下文，也难以确认失败对应哪次导入。

| 信息 | 含义 | 使用边界 |
|------|------|----------|
| 类型 | 当前失败类别 | 不用解析易变消息来充当稳定错误码 |
| message | 当前错误的描述 | 不应包含令牌、完整客户记录或外部响应原文 |
| cause | 导致当前错误的底层原因 | 包装时保留异常对象，不能只复制 message |
| stack trace | 通常反映异常创建时的调用栈 | 重抛同一对象不会自动成为一份全新的创建堆栈 |
| suppressed | 与主失败同时发生的附加失败 | 常见于资源关闭，主讲见[资源生命周期](./04-resource-lifecycle.md) |

::: tip 结合上下文、cause 与 suppressed 定位

这些结构不保证每个异常都具有非空消息、原因或完整堆栈；Throwable 的具体构造和实现允许某些信息缺省。定位时从业务入口观察类型与上下文，再沿 cause 和 suppressed 区分因果关系，不应把所有嵌套输出看成同一条原因链。[Throwable API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Throwable.html)

:::

## 四、订单错误分类的完整验证

文件保存为 `ExceptionHierarchyDemo.java`。使用 JDK 21，无第三方依赖；readOrder 是明确的本地故障模拟，不声称访问真实文件或订单系统。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看ExceptionHierarchyDemo的完整代码

```java
// ExceptionHierarchyDemo.java
import java.io.IOException;

/** 对照异常分类与调用方责任，数据源故障仅为本地模拟。 */
public final class ExceptionHierarchyDemo {
    /** 只提供静态演示入口。 */
    private ExceptionHierarchyDemo() {}

    /**
     * 验证异常类型，或触发一种未处理失败；无返回值，输出结果或终止进程。
     * @param args 空参数正常；checked、unchecked、error-boundary为失败模式
     * @throws IOException checked模式模拟读取失败
     */
    public static void main(String[] args) throws IOException {
        if (args.length > 0) {
            switch (args[0]) {
                case "checked" -> readOrder(false);
                case "unchecked" -> parseQuantity("invalid");
                case "error-boundary" -> {
                    try {
                        throw new AssertionError("simulated assertion failure");
                    } catch (Exception error) {
                        throw new IllegalStateException("unexpected Exception handler", error);
                    }
                }
                default -> throw new IllegalArgumentException("unknown mode");
            }
            return;
        }
        String order = readOrder(true);
        int quantity = parseQuantity("2");
        assert order.equals("ORD-1001") && quantity == 2;
        Throwable io = new IOException("simulated read failure");
        Throwable argument = new IllegalArgumentException("quantity must be positive");
        Throwable fatal = new AssertionError("simulated assertion failure");
        assert io instanceof Exception && !(io instanceof RuntimeException);
        assert argument instanceof RuntimeException;
        assert fatal instanceof Error && !(fatal instanceof Exception);
        System.out.println("order=" + order + ", quantity=" + quantity);
        System.out.println("IOException: Exception=true, RuntimeException=false");
        System.out.println("IllegalArgumentException: RuntimeException=true");
        System.out.println("AssertionError: Error=true, Exception=false");
    }

    /**
     * 用可控输入模拟读取契约，不执行真实文件或网络访问。
     * @param available true返回演示编号，false模拟数据源失败
     * @return ORD-1001，不返回失败占位值
     * @throws IOException 数据源被设置为不可用
     */
    private static String readOrder(boolean available) throws IOException {
        if (!available) {
            throw new IOException("simulated order source unavailable");
        }
        return "ORD-1001";
    }

    /**
     * 解析外部数量，格式与范围使用不同异常表达。
     * @param text 非null十进制整数文本，合法业务范围为正int
     * @return 正整数数量
     * @throws IllegalArgumentException 格式不合法、溢出int或数量不为正
     */
    private static int parseQuantity(String text) {
        int quantity = Integer.parseInt(text);
        if (quantity <= 0) {
            throw new IllegalArgumentException("quantity must be positive");
        }
        return quantity;
    }
}
```

:::

在本篇示例目录执行 PowerShell 命令。断言核对类型关系，编译同时检查警告和JavaDoc语法。

```powershell
javac -encoding UTF-8 -Xlint:all -Xdoclint:all,-missing -Werror -d out ExceptionHierarchyDemo.java
java -ea -cp out ExceptionHierarchyDemo
```

Corretto 21.0.11 实测输出如下：

```text
order=ORD-1001, quantity=2
IOException: Exception=true, RuntimeException=false
IllegalArgumentException: RuntimeException=true
AssertionError: Error=true, Exception=false
```

程序的正常运行证明分类和合法输入行为。三个故障入口分别触发受检异常、非受检异常，以及不会被 catch Exception 接住的 Error；没有制造实际内存不足。

## 五、运行失败与编译约束

### 1. 运行时的三类失败入口

分别执行以下命令，均已验证以非零退出码结束：

```powershell
java -ea -cp out ExceptionHierarchyDemo checked
java -ea -cp out ExceptionHierarchyDemo unchecked
java -ea -cp out ExceptionHierarchyDemo error-boundary
```

| 模式 | 实测异常 | 原因与处理 |
|------|----------|------------|
| checked | IOException | 模拟源不可用；调用方可传播或执行有依据的恢复，不能返回伪正常订单 |
| unchecked | NumberFormatException | invalid 无法转换为整数；定位输入边界并拒绝或修正数据 |
| error-boundary | AssertionError | Error 不属于 Exception；该模式用于证明类型边界，不建议业务捕获后继续 |

### 2. 编译器检查声明责任与抛出类型

下面两份文件用于独立编译错误验证，不能与正常程序一起编译。第一份保存为 `UncheckedDeclarationMissing.java`，故意遗漏 IOException 的捕获或声明：

```java
// UncheckedDeclarationMissing.java
import java.io.IOException;

/** 故意遗漏受检异常声明，验证调用方契约。 */
class UncheckedDeclarationMissing {
    /** 故意抛出IOException且不声明或捕获；本文件预期无法编译。 */
    static void importOrder() {
        throw new IOException("simulated import failure");
    }
}
```

第二份保存为 `InvalidThrownValue.java`，故意抛出普通字符串；Java 的 throw 操作数必须是可赋给 Throwable 的引用类型：

```java
// InvalidThrownValue.java
/** 验证Java不能抛出普通字符串。 */
class InvalidThrownValue {
    /** 故意使用错误throw操作数；本文件预期无法编译。 */
    static void rejectOrder() {
        throw "ORDER_REJECTED";
    }
}
```

分别编译以观察诊断，两条命令各产生1处编译错误：

```powershell
javac "-J-Duser.language=en" -encoding UTF-8 -d out UncheckedDeclarationMissing.java
javac "-J-Duser.language=en" -encoding UTF-8 -d out InvalidThrownValue.java
```

第一个错误通过准确声明或捕获修正；第二个错误需要改成具有明确语义的异常对象。修正不能只以“编译通过”为目标，还要让调用方知道失败代表什么。

## 六、恢复必须有明确边界

同一异常在不同场景下有不同处理方式：用户刚提交的数量格式错误可以返回输入错误，后台读取损坏数据则可能需要隔离该记录并告警。是否重试由失败原因、状态变化与幂等性决定，不由 checked 或 unchecked 标签决定。

::: warning 捕获 Throwable 后不能统一返回成功

业务层不应统一捕获 Throwable 后返回成功，也不应在每层重复记录同一份异常并继续抛出。由明确的处理边界记录必要诊断，底层保留 cause；具体控制转移与转换规则见[异常捕获、传播与处理策略](./02-catching-propagation.md)。

:::

本例只验证类型与控制边界，没有模拟真实 JVM 故障，也没有证明所有 Error 都可以安全恢复。进程终止、强制结束或硬件故障下的持久化一致性，需要由事务、幂等与外部恢复机制承担。
