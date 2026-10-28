---
title: "垃圾收集基础"
tags: [Java, JVM, GC]
excerpt: "围绕可达性、分代假设和回收过程解释 GC，区分算法、并行与并发，以及写屏障和安全点的作用，用有限存活集的真实日志观察分配与回收。"
date: 2026-09-10
---


# 垃圾收集基础

垃圾收集器识别不再需要保留的对象，并回收它们占用的堆空间。它管理内存可达性，不理解订单是否已完成，也不会自动为无界缓存制定容量或关闭业务连接。


## 一、可达性与存活


### 1. 从根引用出发

GC 从根集合出发跟踪引用关系。活跃调用中的引用、静态状态、JNI 全局引用及部分运行时结构都可能参与根路径；具体枚举方式由 JVM 和收集阶段决定。

订单 A 与明细 B 相互引用，但整个对象图不再能从根到达时，循环本身不会阻止回收。反过来，一个静态列表仍持有 B，就可能通过 B 继续保留 A。


### 2. 引用与资源

软、弱和虚引用具有不同处理语义，见[对象分配与引用](./03-object-allocation-references.md)。它们不提供确定清理时间；finalization 也不适合资源生命周期，Java 21 已将其标记为待移除的弃用能力。

::: warning 可回收不等于已回收
失去强可达性只是进入相应处理条件，不承诺立即发生 GC。文件和网络资源仍需显式关闭，测试也不能用一次 `System.gc()` 强制证明回收完成。
:::


## 二、算法与分代

| 技术 | 基本工作 | 主要成本 |
|------|----------|----------|
| 标记清扫 | 标记存活并回收空闲块 | 碎片与后续分配管理 |
| 标记整理 | 移动对象以集中空闲空间 | 移动和更新引用 |
| 复制 | 把存活对象转移到目标区域 | 需要目标空间，成本受存活率影响 |
| 分代或分区 | 优先处理收益较高的区域 | 维护跨区域引用和选择策略 |

分代假设来自许多对象存活较短的负载特征，因此优先回收年轻对象常能获得较高收益。它不是全部业务的定律，对象“年龄”也不是业务创建时间。

老对象可能指向年轻对象。若每次都扫描全部老对象，局部回收收益会下降；写屏障、卡表和记忆集用于维护需要额外检查的引用位置。这些 GC 写屏障与 Java 内存模型中的可见性约束不是同一概念。


## 三、暂停与并发

并行表示多个收集线程一起工作，应用仍可能暂停；并发表示部分回收阶段与应用同时推进。并发能缩短部分暂停，但会消耗 CPU、内存带宽和分配余量。

Stop-The-World 阶段需要协调应用线程进入可安全处理的状态。到达安全点的等待与实际 GC 工作应分别观察；请求暂停很长时，不能只截取某个 GC 子阶段耗时。


## 四、分配压力实验


### 1. 有限存活集

`RuntimeLab#allocate` 分配 3000 个 64 KiB 数组，环形数组只保留最近 64 个。新分配总量约 187.5 MiB，但最终数组载荷约 4 MiB，二者不能混为“堆至少需要 187.5 MiB”。

核心循环如下，`ring` 长度为 64，`sum` 在外部初始化并于结束时输出，完整源码见下方的 `RuntimeLab.java`：

```java
for (int index = 0; index < 3000; index++) {
    byte[] payload = new byte[64 * 1024];
    payload[0] = (byte) index;
    ring[index % ring.length] = payload;
    sum += Byte.toUnsignedInt(payload[0]);
}
```

### 2. 执行与结果

下面创建用于观察分配与 GC的独立程序，并在其目录中执行：

在任意位置新建空目录，使用 JDK 21，将下面的文件保存到该目录。后续命令均在此目录执行。

保存为 `RuntimeLab.java`：

::: details 查看 RuntimeLab.java 完整代码

```java [RuntimeLab.java]
/** 用有限工作量观察 Java 21 HotSpot；各模式独立进程执行。 */
public final class RuntimeLab {
    private static volatile Object retained;
    private static volatile long checksum;

    /** 禁止实例化命令入口。 */
    private RuntimeLab() { }
    /**
     * 执行当前观察场景并输出结果，无返回值。
     * @param args 只接受一个参数：allocation
     * @throws Exception 参数不合法或观察失败时终止当前进程
     */
    public static void main(String[] args) throws Exception {
        if (args.length != 1) {
            throw new IllegalArgumentException("expected mode: allocation");
        }
        switch (args[0]) {
            case "allocation" -> allocate();
            default -> throw new IllegalArgumentException("unknown mode");
        }
    }

    /** 分配 3000 个 64 KiB 数组，仅保留最近 64 个，固定工作量便于对照。 */
    private static void allocate() {
        byte[][] ring = new byte[64][];
        long sum = 0;
        for (int index = 0; index < 3000; index++) {
            byte[] payload = new byte[64 * 1024];
            payload[0] = (byte) index;
            ring[index % ring.length] = payload;
            sum += Byte.toUnsignedInt(payload[0]);
        }
        retained = ring;
        System.out.println("retained=" + ring.length + ", checksum=" + sum);
    }
}
```

:::

使用 UTF-8 编译本篇文件：

```powershell
javac -encoding UTF-8 --release 21 -Xlint:all -Werror -d out RuntimeLab.java
```


```powershell
java -XX:+UseG1GC -Xms32m -Xmx32m -Xlog:gc -cp out RuntimeLab allocation
```

程序结束时输出 `retained=64, checksum=375876`。一次相同工作负载并开启 JFR 的实际暂停行如下：

```text
GC(0) Pause Young (Normal) (G1 Evacuation Pause) 16M->3M(32M) 6.674ms
```

这里只摘录消息字段：回收前占用约 16 MiB，之后约 3 MiB，堆容量 32 MiB；它是一次年轻代转移暂停。此时循环尚未完成，不能要求回收后的占用等于最终保留量。

## 五、从现象到判断

| 现象 | 优先验证 | 不能直接下的结论 |
|------|----------|------------------|
| 年轻 GC 频繁、回收后稳定 | 分配速率、实际 CPU 与暂停 | 一定内存泄漏 |
| 回收后基线持续上升 | 活对象和根路径、负载变化 | 只需扩大年轻代 |
| 分配停顿或 Full GC | 回收余量、存活集、CPU | 换收集器必然解决 |
| 请求慢但暂停低 | I/O、锁、队列与业务计算 | 继续只调 GC |

本实验证明小堆可以通过回收支持较大的累计分配量，未模拟长期服务负载。容量结论仍需同时考虑对象头、辅助结构、真实存活数据和峰值余量。

## 六、参考资料

- [Java 21 GC 调优指南](https://docs.oracle.com/en/java/javase/21/gctuning/)
- [JEP 421](https://openjdk.org/jeps/421)

以上资料分别说明收集机制和 finalization 的弃用方向。
