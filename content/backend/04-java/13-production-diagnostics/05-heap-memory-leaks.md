---
title: "堆内存泄漏诊断"
tags: [Java, 堆转储, 内存泄漏]
excerpt: "区分堆增长、正常缓存与无效对象保留，结合实际类直方图和 HPROF 强引用路径定位静态容器，对照有界保留及清理结果，解释浅大小、保留大小和支配关系。"
date: 2026-09-10
---


# 堆内存泄漏诊断

Java 堆泄漏是对象已经不再服务业务目的，却仍能通过强引用路径从根到达。堆大、数组多或发生 OOM 都不能单独证明泄漏，还需确认负载、存活趋势和对象所有者。

## 一、增长与对象关系


### 1. 先看存活趋势

累计分配量可以远大于堆容量，短命对象被及时回收时并不构成泄漏。更有判断价值的是稳定负载下回收后的占用、活动请求数以及缓存容量是否达到平台。

正常缓存扩大、批处理一次加载过多数据和无效对象保留，都可能产生堆压力。区别来自业务生命周期与引用关系，不能仅根据类型名称判断。

### 2. 大小与支配关系

| 概念 | 说明 | 用途 |
|------|------|------|
| Shallow Size | 对象自身占用 | 类型实例的直接成本 |
| Retained Size | 对象失去后可连带释放的对象规模 | 发现小容器保留的大对象图 |
| Dominator | 所有根路径都必须经过的支配者 | 定位保留中心 |
| Path to GC Roots | 从根到对象的引用链 | 解释为什么仍然存活 |

类直方图主要给出数量和浅大小，无法直接计算保留大小。两条根路径可能共同保留一个对象，不能把它的大小重复归入每个持有者。


## 二、保留故障

按下面给出的完整文件编译。`DiagnosticLab heap` 创建 10000 个 `RetainedOrder`，每个持有 512 字节载荷，再把全部订单留在静态列表中。

在本篇新建的示例目录执行，最多运行 60 秒：

使用 JDK 21，在任意位置新建空目录并保存下方完整文件。所有命令均以该目录为工作目录；需要持续观察的程序在终端 A 启动，取证命令在同目录的终端 B 执行。

保存为 `DiagnosticLab.java`：

::: details 查看 DiagnosticLab.java 完整代码

```java [DiagnosticLab.java]
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
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
     * @param args 两个参数：模式 heap/heap-fixed，以及存活秒数 1..60
     * @throws Exception 参数非法、初始化或控制输入失败时终止当前进程
     */
    public static void main(String[] args) throws Exception {
        if (args.length != 2) throw new IllegalArgumentException("expected mode and seconds");
        String mode = args[0];
        int seconds = Integer.parseInt(args[1]);
        if (seconds < 1 || seconds > 60) throw new IllegalArgumentException("seconds must be 1..60");
        switch (mode) {
            case "heap", "heap-fixed" -> retainOrders(mode.endsWith("fixed"));
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

    /** @param bounded true 时仅保留最近 64 个订单，false 保留本批全部 10000 个。 */
    private static void retainOrders(boolean bounded) {
        for (int index = 0; index < 10_000; index++) {
            if (bounded && RETAINED.size() == 64) RETAINED.removeFirst();
            RETAINED.add(new RetainedOrder(index));
        }
        System.out.println("ORDERS=" + RETAINED.size());
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
java -Xms32m -Xmx64m -cp out DiagnosticLab heap 60
```

程序输出 `ORDERS=10000` 和 PID。第二个终端核对 PID，在可写目录采集本地小堆：

```powershell
$javaPid = [int](Read-Host 'Java PID')
$heapFile = Join-Path (Get-Location) 'orders.hprof'
jcmd $javaPid GC.heap_info
jcmd $javaPid GC.class_histogram > heap-before.txt
jcmd $javaPid help GC.heap_dump
jcmd $javaPid GC.heap_dump $heapFile
```

::: danger 仅对本地合成数据执行该转储
示例堆限制为 64 MiB，不含真实业务数据。生产转储可能触发明显停顿和大文件写入，必须先确认操作条件、空间与数据保护方式；已有文件不应随意覆盖。
:::


## 三、实际引用证据


### 1. 直方图与强根路径

本地直方图确认 10000 个 `RetainedOrder`。将生成的 HPROF 交给离线堆分析器，可以沿对象所属容器检查以下强引用路径：

```text
DiagnosticLab 的类静态状态
  -> RETAINED: ArrayList
  -> elementData: Object[]
  -> RetainedOrder
  -> payload: byte[]
```

因此即使创建方法已返回，静态列表仍保留订单。这个证据直接指向 `retainOrders` 的保存行为，不能靠扩大 `-Xmx` 消除。


### 2. 在分析器中核对

使用支持该 HPROF 的分析器打开文件，从 Histogram 选择 `RetainedOrder`，查看实例及排除弱引用后的根路径；再用 Dominator Tree 检查列表及其数组的支配范围。

本次已经核对实例数和强根路径，未提供某个 GUI 分析器测得的精确保留大小。载荷总量不包含对象头和列表数组，不能把 10000 × 512 字节直接标成整个列表的 Retained Size。


## 四、清理与有界对照

在目标程序前台输入 `clear` 并回车，看到 `CLEARED` 后重新执行 `GC.class_histogram`。本地结果不再包含 `RetainedOrder`；该采集过程可能请求 GC，它证明当前对象已能释放，不是自动回收时机保证。

结束故障进程后启动有界保留版本：

```powershell
java -Xms32m -Xmx64m -cp out DiagnosticLab heap-fixed 30
```

同样处理 10000 个订单，但只保留最近 64 个；实际直方图确认 64 个实例。再次清理后变为 0。两个版本比较的是相同输入的保留策略，不依赖等待 OOM 作为判断标准。

::: tip 修复要符合数据用途
示例代表短期订单观察缓存，允许只保留最近记录。账本或审计数据不能直接按此策略删除，应使用持久化及明确查询边界。
:::


## 五、恢复验证

生产修复需要覆盖原触发周期和代表性负载，观察存活集稳定、过期对象可释放、查询行为与数据完整性保持正确。ThreadLocal、监听器和类加载器保留分别检查对应的注销与清理路径。

输入 `stop` 或等待到期结束本地进程。原始 HPROF 不加入仓库，记录来源与哈希后按诊断数据策略保管；分析结论保留可复查的类型、路径和修复证据。


## 六、参考资料

- [Java 21 内存泄漏排查](https://docs.oracle.com/en/java/javase/21/troubleshoot/troubleshooting-memory-leaks.html)
- [Eclipse MAT 概念](https://help.eclipse.org/latest/topic/org.eclipse.mat.ui.help/concepts/shallowretainedheap.html)

以上资料说明泄漏判断和大小口径。
