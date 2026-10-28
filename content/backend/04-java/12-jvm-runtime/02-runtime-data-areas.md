---
title: "运行时数据区"
tags: [Java, JVM, 内存]
excerpt: "区分线程私有的程序计数器与栈、共享堆与方法区，解释栈帧、运行时常量池和 HotSpot 本地内存的关系，并用小栈进程验证栈溢出边界。"
date: 2026-09-10
---


# 运行时数据区

运行时数据区描述 JVM 执行程序需要保存的状态。理解它们首先要区分线程所有权和数据用途，再讨论具体实现把内存放在哪里；“对象在堆、变量在栈”不足以解释完整程序。


## 一、线程与共享状态

| 数据区 | 共享关系 | 保存内容 |
|--------|----------|----------|
| 程序计数器 | 每线程 | 当前执行位置；本地方法执行时规范不定义其值 |
| Java 虚拟机栈 | 每线程 | 方法调用的栈帧 |
| 本地方法栈 | 依实现支持 | 本地方法执行所需状态 |
| 堆 | 线程共享 | 类实例和数组的逻辑分配空间 |
| 方法区 | 线程共享 | 类结构、方法数据、运行时常量池等 |

共享表示能够被多个线程访问，不等于自动具有线程安全性。栈中的引用值属于当前调用，而它指向的订单对象可以通过静态字段或队列被其他线程共同访问。


## 二、栈帧与调用


### 1. 局部变量和操作数栈

方法调用创建栈帧，其中局部变量表保存参数和局部值，操作数栈支持指令计算。静态方法 `total(long, int)` 的参数占用三个局部变量槽位，因为 `long` 占两个槽位。

这不是“对象占三个字节”的意思。槽位是字节码执行模型中的单位，优化后的机器码可以把值放在寄存器或消除不必要的中间状态。

### 2. 正常与异常退出

方法正常返回时，将结果交给调用者并退出当前帧。异常退出则查找适用的处理器，必要时向外展开调用栈；资源关闭逻辑也在这一控制流中运行。

无限递归持续需要新的调用状态，会达到栈容量边界。增加 Java 堆不能修复这个调用结构问题。


## 三、方法区与本地内存

HotSpot 21 使用元空间保存主要类元数据，但方法区是规范概念，不能简单等同于某一块物理内存。字符串对象仍在堆中，JIT 机器码主要放入代码缓存，直接缓冲区还会使用堆外存储。

| 观察量 | 能说明什么 | 不能直接推出什么 |
|--------|------------|------------------|
| 堆使用量 | Java 堆对象占用 | 进程全部内存 |
| Non-Heap 管理值 | 受管理的非堆内存池状态 | 所有本地库和映射开销 |
| NMT 分类 | HotSpot 跟踪的本地分配 | 完整 RSS 构成 |
| 进程工作集或 RSS | 操作系统视角的驻留页 | 全部页面都是泄漏对象 |

::: warning 内存上限要分开核对
`-Xmx` 约束堆，不能作为进程总内存上限。平台线程栈、元空间、代码缓存、直接内存和 JVM 自身结构都需要预算。
:::

## 四、观察栈溢出

下面创建一个只负责递归调用的程序，在独立的小栈进程中观察失败：

在任意位置新建空目录，使用 JDK 21，将下面的文件保存到该目录。后续命令均在此目录执行。

保存为 `RuntimeLab.java`：

::: details 查看 RuntimeLab.java 完整代码

```java [RuntimeLab.java]
/** 用有限工作量观察 Java 21 HotSpot；各模式独立进程执行。 */
public final class RuntimeLab {

    /** 禁止实例化命令入口。 */
    private RuntimeLab() { }
    /**
     * 执行当前观察场景并输出结果，无返回值。
     * @param args 只接受一个参数：stack
     * @throws Exception 参数不合法或观察失败时终止当前进程
     */
    public static void main(String[] args) throws Exception {
        if (args.length != 1) {
            throw new IllegalArgumentException("expected mode: stack");
        }
        switch (args[0]) {
            case "stack" -> overflow();
            default -> throw new IllegalArgumentException("unknown mode");
        }
    }

    /** 在独立小栈进程内触发并报告溢出，不把可变递归深度当作规范常量。 */
    private static void overflow() {
        try {
            recurse(1);
        } catch (StackOverflowError failure) {
            System.out.println("StackOverflowError");
        }
    }

    /** @param depth 当前递归计数；无终止条件用于故障注入。 @return 正常路径不会返回。 */
    private static long recurse(long depth) {
        return recurse(depth + 1) + depth;
    }
}
```

:::

使用 UTF-8 编译本篇文件：

```powershell
javac -encoding UTF-8 --release 21 -Xlint:all -Werror -d out RuntimeLab.java
```


```powershell
java -Xss256k -Xmx32m -cp out RuntimeLab stack
java -Xss256k -Xmx64m -cp out RuntimeLab stack
```

两次均输出以下异常类型；入口捕获这个特定错误后结束进程，不继续处理业务：

```text
StackOverflowError
```

故障方法没有递归终止条件，`RuntimeLab#overflow` 负责报告结果。完整实现已在上方给出，以下是触发核心：

```java
/** @param depth 当前递归计数；无终止条件用于故障注入。 @return 正常路径不会返回。 */
private static long recurse(long depth) {
    return recurse(depth + 1) + depth;
}
```

扩大堆仍然溢出，证明本次失败由调用深度造成。正确修复是引入终止条件、限制输入深度或改用受控迭代；不能把某次溢出的递归次数当作 JVM 保证。

## 五、虚拟线程边界

虚拟线程的调用状态由运行时按需管理，不能用“虚拟线程数乘以 `-Xss`”估算总内存。大量挂起任务持有的对象和栈状态仍会占用空间，必须结合实际并发和保留数据测量。

::: tip 从所有权查引用
排查对象为何存活时，关注哪个活动线程、静态字段或容器仍能到达它。局部变量离开源码作用域，与对象立刻被回收不是同一件事。
:::

## 六、参考资料

- [JVMS 21 运行时数据区](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5)
- [栈帧](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.6)
- [Java 21 内存管理接口](https://docs.oracle.com/en/java/javase/21/docs/api/java.management/java/lang/management/MemoryMXBean.html)

以上资料说明管理视图。
