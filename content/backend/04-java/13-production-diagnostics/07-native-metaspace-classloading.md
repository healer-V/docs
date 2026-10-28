---
title: "本地内存与类加载诊断"
tags: [Java, NMT, Metaspace]
excerpt: "区分堆、元空间、直接内存、线程栈和进程工作集，使用 NMT 基线差异与类加载器统计验证受控分配、保留和释放，明确采集范围与容量边界。"
date: 2026-09-10
---


# 本地内存与类加载诊断

Java 进程内存包含堆、类元数据、代码缓存、平台线程栈、直接缓冲区以及 JVM 和本地库的分配。堆稳定但进程内存增长时，应先分类，不把全部增长归因于 Java 对象泄漏。

## 一、统一口径

| 指标 | 表达内容 | 不能混用的概念 |
|------|----------|----------------|
| Heap Used | Java 堆当前使用 | 不包含全部直接内存载荷 |
| NMT reserved | 保留的虚拟地址空间 | 不等于已经驻留的物理内存 |
| NMT committed | 跟踪范围内已提交内存 | 不等于进程 RSS 或工作集 |
| RSS / 工作集 | 操作系统观察到的驻留页 | 可能含共享库、映射及其他区域 |

NMT 跟踪 HotSpot 了解的本地分配，不能完整解释所有第三方本地库和映射。若 NMT 趋势稳定而进程指标增长，应补充操作系统映射和库自身的统计。


## 二、NMT 对照


### 1. 启用与基线

按下面给出的完整文件编译。在本篇新建的示例目录启动受控目标，`native` 模式先等待输入，尚未分配实验载荷：

使用 JDK 21，在任意位置新建空目录并保存下方完整文件。所有命令均以该目录为工作目录；需要持续观察的程序在终端 A 启动，取证命令在同目录的终端 B 执行。

保存为 `DiagnosticLab.java`：

::: details 查看 DiagnosticLab.java 完整代码

```java [DiagnosticLab.java]
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

/** 仅用于本地故障注入；限制存活量和寿命，所有工作线程为守护线程。 */
public final class DiagnosticLab {
    private static final List<Object> RETAINED = new ArrayList<>();
    private static volatile boolean running = true;

    /** 禁止实例化诊断入口。 */
    private DiagnosticLab() { }
    /**
     * 启动本地观察目标；输出 PID 和状态，并接收 stop 命令。
     * @param args 两个参数：模式 native，以及存活秒数 1..60
     * @throws Exception 参数非法、初始化或控制输入失败时终止当前进程
     */
    public static void main(String[] args) throws Exception {
        if (args.length != 2) throw new IllegalArgumentException("expected mode and seconds");
        String mode = args[0];
        int seconds = Integer.parseInt(args[1]);
        if (seconds < 1 || seconds > 60) throw new IllegalArgumentException("seconds must be 1..60");
        switch (mode) {
            case "native" -> { }
            default -> throw new IllegalArgumentException("unknown mode");
        }
        System.out.println("READY pid=" + ProcessHandle.current().pid() + " mode=" + mode + " time=" + Instant.now());
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(seconds);
        BufferedReader input = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
        try {
            while (System.nanoTime() < deadline) {
                if (input.ready()) {
                    String command = input.readLine();
                    if ("stop".equals(command)) break;
                    if ("allocate".equals(command)) allocateNative();
                    if ("clear".equals(command)) {
                        RETAINED.clear();
                        System.out.println("CLEARED");
                    }
                }
                Thread.sleep(50);
            }
        } finally {
            running = false;
            System.out.println("STOPPED retained=" + RETAINED.size());
        }
    }

    /** 分配一次 8 MiB 直接缓冲和 32 个独立加载器；拒绝重复扩大存活集。 */
    private static void allocateNative() throws Exception {
        if (!RETAINED.isEmpty()) throw new IllegalStateException("allocate only once before clear");
        RETAINED.add(ByteBuffer.allocateDirect(8 * 1024 * 1024));
        URL[] locations = {Path.of("out").toUri().toURL()};
        for (int index = 0; index < 32; index++) {
            try (var loader = new URLClassLoader(locations, null)) {
                RETAINED.add(loader.loadClass("RetainedOrder"));
            }
        }
        System.out.println("ALLOCATED directMiB=8 loaders=32");
    }
}
```

:::

保存为 `RetainedOrder.java`：

::: details 查看 RetainedOrder.java 完整代码

```java [RetainedOrder.java]
/** 模拟订单请求结束后不应继续保留的载荷。 */
public final class RetainedOrder {
    private final byte[] payload = new byte[512];

    /** @param index 订单序号，取非负数；写入载荷以形成真实分配。 */
    public RetainedOrder(int index) {
        payload[0] = (byte) index;
    }
}
```

:::

先编译本篇源码：

```powershell
javac -encoding UTF-8 --release 21 -Xlint:all -Werror -d out DiagnosticLab.java RetainedOrder.java
```


```powershell
java -Xms32m -Xmx64m -XX:NativeMemoryTracking=summary -cp out DiagnosticLab native 60
```

第二个终端核对 PID，并在输入分配命令之前保存基线：

```powershell
$javaPid = [int](Read-Host 'Java PID')
jcmd $javaPid VM.native_memory baseline
jcmd $javaPid VM.classloader_stats > loaders-before.txt
```

NMT 必须在启动时启用，未开启的目标会返回 `Native memory tracking is not enabled`。不能把这个结果当作没有堆外使用，也不能用已有堆转储补出完整 NMT 历史。


### 2. 分配与差异

在目标前台输入 `allocate` 后回车。程序只允许一轮未清理的分配，创建 8 MiB 直接缓冲区，并通过 32 个独立加载器各加载一次 `RetainedOrder`，打印 `ALLOCATED directMiB=8 loaders=32`。

随后在第二个终端执行：

```powershell
jcmd $javaPid VM.native_memory summary.diff scale=KB
jcmd $javaPid VM.classloader_stats > loaders-after.txt
```

本次实际 NMT `Other` 分类增长 8196 KiB，类加载统计增加 32 个 `URLClassLoader`。分类总量还包含少量辅助分配，不能要求它精确等于 8192 KiB 缓冲载荷。


## 三、类加载器保留

### 1. 类与加载器关系

相同类名经不同定义加载器加载，会形成不同运行时类。动态代理、脚本或重部署不断创建加载器时，若旧加载器仍被线程或静态注册表保留，相关类元数据也可能无法释放。

本例静态列表保留 `Class` 对象，从而保留对应加载器。源码已经关闭各 `URLClassLoader` 的资源，但关闭资源不等于类立即卸载，引用关系仍然存在。

### 2. 清理对照

在前台输入 `clear`，看到 `CLEARED` 后，本地执行一次显式回收，再查看差异：

```powershell
jcmd $javaPid GC.run
jcmd $javaPid VM.classloader_stats
jcmd $javaPid VM.native_memory summary.diff scale=KB
```

本次结果中新增的 32 个加载器均已消失，`Other` 只剩相对基线约 4 KiB 的增长。部分正常加载的基础类仍然存在，所以 Metaspace 不必完全恢复到最初值。

::: warning 显式 GC 仅用于本地观察
该操作可能引入停顿，不能作为生产释放策略。本例证明清除保留路径后具备释放条件，并记录一次实际回收结果，不承诺自动清理时间。
:::


## 四、其他增长来源

平台线程不断增加时，应关联线程创建点、生命周期和栈预算；减少 `-Xss` 前验证真实调用深度。虚拟线程也有任务与调用状态开销，不能认为创建数量不影响容量。

直接内存耗尽要查缓冲容量和保留对象，代码缓存问题要结合编译状态；JNI、映射文件和本地分配器可能需要原生工具。操作系统直接终止进程时还可能没有 Java OOM 或自动堆转储。

::: tip 先定位分类再改上限
`MaxMetaspaceSize` 或 `MaxDirectMemorySize` 能暴露边界，不能修复无效保留。比较同样生命周期内的分类增长，并确认清理后功能和资源都恢复。
:::

## 五、参考资料

- [Java 21 NMT](https://docs.oracle.com/en/java/javase/21/vm/native-memory-tracking.html)
- [jcmd](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html)
- [类加载规范](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html)

以上资料说明跟踪和类生命周期。
