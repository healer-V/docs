---
title: "JVM 执行模型"
tags: [Java, JVM, HotSpot]
excerpt: "沿订单方法从源码、Class 文件到运行进程解释 JVM 的执行边界，区分虚拟机规范与 HotSpot 实现，使用实际版本、字节码和运行参数核对环境。"
date: 2026-09-10
---


# JVM 执行模型

Java 虚拟机负责加载 Class 文件、维护运行时状态并执行指令。Java 源码不是它唯一可能的输入来源；其他语言只要生成符合规范的 Class 文件，也能使用 JVM 的运行能力。


## 一、源码到执行

订单方法先由 `javac` 检查类型、解析语法并生成字节码。启动器 `java` 创建虚拟机，定位入口类，再由运行时完成加载、链接、初始化和方法执行。某个依赖可能到真正使用时才加载，不能理解为启动时一次加载全部类。

下面表示实际处理链路，异常可以在不同阶段终止执行：

```mermaid
flowchart LR
  S[Java 源码] --> C[javac 编译]
  C --> B[Class 文件]
  B --> L[加载与链接]
  L --> I[类初始化]
  I --> E[解释或编译后执行]
  E --> R[返回结果或传播异常]
```

| 阶段 | 典型产物或状态 | 常见失败 |
|------|----------------|----------|
| 编译 | `.class`、类型检查结果 | 语法错误、缺少编译依赖 |
| 加载与链接 | 运行时类、符号解析 | 找不到类、类版本过高、方法不匹配 |
| 初始化 | 静态字段与初始化逻辑完成 | 静态配置错误 |
| 执行 | 栈帧、对象、机器码与结果 | 业务异常、栈或内存耗尽 |

## 二、规范与实现


### 1. JVM 规范约束

JVMS 定义 Class 格式、指令语义、运行时数据区和加载约束，保证合规实现对程序具有一致的必要行为。它不规定必须采用某个收集器、固定对象头大小或某种内存布局。

例如方法调用需要符合栈帧和返回规则，但一个优化后的方法可能被内联，不能要求在机器栈上永远找到与源码逐项对应的帧。


### 2. HotSpot 实现能力

本模块的 JDK 21 示例使用 HotSpot，涉及 G1、分层编译、Metaspace 和 `-XX` 参数时，描述的是这套实现。换 JVM 或发行版后，应核对可用选项和运行结果。

::: info 跨平台的边界
Class 文件采用平台无关格式，JVM 本身仍是面向具体操作系统与处理器的程序。JNI 库、文件路径、默认环境和外部服务也可能引入平台依赖。
:::


## 三、核对运行环境

下面直接创建运行环境观察程序，只依赖 JDK 21。它会输出实际进程的虚拟机信息和内存参数。

在任意位置新建空目录，使用 JDK 21，将下面的文件保存到该目录。后续命令均在此目录执行。

保存为 `RuntimeLab.java`：

::: details 查看 RuntimeLab.java 完整代码

```java [RuntimeLab.java]
import java.lang.management.ManagementFactory;

/** 用有限工作量观察 Java 21 HotSpot；各模式独立进程执行。 */
public final class RuntimeLab {

    /** 禁止实例化命令入口。 */
    private RuntimeLab() { }
    /**
     * 执行当前观察场景并输出结果，无返回值。
     * @param args 只接受一个参数：env
     * @throws Exception 参数不合法或观察失败时终止当前进程
     */
    public static void main(String[] args) throws Exception {
        if (args.length != 1) {
            throw new IllegalArgumentException("expected mode: env");
        }
        switch (args[0]) {
            case "env" -> environment();
            default -> throw new IllegalArgumentException("unknown mode");
        }
    }

    /** 输出实际 VM、参数和管理视图，数值不作为跨机器断言。 */
    private static void environment() {
        System.out.println("vm=" + System.getProperty("java.vm.name"));
        System.out.println("version=" + Runtime.version());
        System.out.println("args=" + ManagementFactory.getRuntimeMXBean().getInputArguments());
        System.out.println("heapMax=" + Runtime.getRuntime().maxMemory());
        System.out.println("nonHeap=" + ManagementFactory.getMemoryMXBean().getNonHeapMemoryUsage());
        for (var collector : ManagementFactory.getGarbageCollectorMXBeans()) {
            System.out.println("collector=" + collector.getName());
        }
    }
}
```

:::

使用 UTF-8 编译本篇文件：

```powershell
javac -encoding UTF-8 --release 21 -Xlint:all -Werror -d out RuntimeLab.java
```


```powershell

java -Xms32m -Xmx32m -cp out RuntimeLab env
```

实际输出节选如下，非堆使用量及收集器名称还会单独打印：

```text
vm=OpenJDK 64-Bit Server VM
version=21.0.11+10-LTS
args=[-Xms32m, -Xmx32m]
heapMax=33554432
```

这里 `heapMax` 的单位是字节。使用量随进程状态变化，不能把本机结果当作所有 Java 21 的默认值。

## 四、区分失败位置

若启动器报告找不到 `RuntimeLab`，先检查工作目录和 `out` 下的 Class 文件；此时没有进入业务方法。若提示 `UnsupportedClassVersionError`，检查实际启动 JDK 与编译目标，修改 classpath 无法降低字节码版本。

静态初始化失败与业务方法抛异常也有不同恢复边界：前者可能使类在当前加载器内进入错误状态，后者通常沿当前调用栈传播。先保留异常类型、原因链和发生阶段，再决定重新配置、替换依赖还是修复代码。

::: tip 判断依据
先确认运行的是哪个 JDK、哪个产物以及哪个入口，再解释 JVM 内部现象。IDE 显示的项目 SDK 不足以证明实际进程版本。
:::

## 五、参考资料

- [JVMS 21 的虚拟机结构](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html)
- [Java 21 启动器](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html)

以上资料说明具体命令和 HotSpot 选项。
