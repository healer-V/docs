---
title: "高 CPU 诊断"
tags: [Java, CPU, JFR]
excerpt: "结合进程 CPU、线程累计 CPU 和 JFR 采样定位空转热点，验证等待策略前后的对照，区分有效负载、算法放大、GC 和本地执行等不同来源。"
date: 2026-09-10
---


# 高 CPU 诊断

高 CPU 表示处理器时间被消耗，原因可能是有效请求，也可能是忙循环、重复计算、重试、GC 或本地调用。诊断应先确认目标进程及负载，再定位线程和调用路径。


## 一、确认消耗来源

| 层次 | 观察量 | 判断边界 |
|------|--------|----------|
| 主机或容器 | CPU 总量、配额与节流 | 宿主机空闲不代表容器没有受限 |
| JVM 进程 | CPU 增量、成功吞吐 | 吞吐增长可能解释正常消耗 |
| 线程 | 累计 CPU 的时间差 | 单个时刻的累计值不等于当前速率 |
| 方法 | 采样栈、调用树 | 样本占比不等于单次方法耗时 |

响应变慢而 CPU 低，通常需要转查等待路径；`RUNNABLE` 也可能包含本地或 Socket 调用，不能只凭状态认定忙循环。

## 二、空转对照


### 1. 触发与采集

`DiagnosticLab cpu` 模拟无任务时仍反复检查的轮询线程，`cpu-fixed` 每次空检查等待 10 ms。两者均没有处理业务请求，因此持续占用 CPU 缺乏有效工作解释。

在本篇示例目录保存并编译下方程序后启动：

使用 JDK 21，在任意位置新建空目录并保存下方完整文件。所有命令均以该目录为工作目录；需要持续观察的程序在终端 A 启动，取证命令在同目录的终端 B 执行。

保存为 `DiagnosticLab.java`：

::: details 查看 DiagnosticLab.java 完整代码

```java [DiagnosticLab.java]
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.LockSupport;

/** 仅用于本地故障注入；限制存活量和寿命，所有工作线程为守护线程。 */
public final class DiagnosticLab {
    private static volatile boolean running = true;
    private static volatile long checksum;

    /** 禁止实例化诊断入口。 */
    private DiagnosticLab() { }
    /**
     * 启动本地观察目标；输出 PID 和状态，并接收 stop 命令。
     * @param args 两个参数：模式 cpu/cpu-fixed，以及存活秒数 1..60
     * @throws Exception 参数非法、初始化或控制输入失败时终止当前进程
     */
    public static void main(String[] args) throws Exception {
        if (args.length != 2) throw new IllegalArgumentException("expected mode and seconds");
        String mode = args[0];
        int seconds = Integer.parseInt(args[1]);
        if (seconds < 1 || seconds > 60) throw new IllegalArgumentException("seconds must be 1..60");
        switch (mode) {
            case "cpu", "cpu-fixed" -> Thread.ofPlatform().daemon().name("order-poller").start(
                    /* 同一轮询任务对照忙循环与等待；工作线程随进程结束。 */ () -> poll(mode.endsWith("fixed")));
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
                }
                Thread.sleep(50);
            }
        } finally {
            running = false;
            System.out.println("STOPPED");
        }
    }

    /** @param waiting true 时等待 10 ms 再检查，false 制造空转；无业务请求被处理。 */
    private static void poll(boolean waiting) {
        while (running) {
            if (waiting) LockSupport.parkNanos(TimeUnit.MILLISECONDS.toNanos(10));
            checksum++;
        }
    }
}
```

:::

先编译本篇源码：

```powershell
javac -encoding UTF-8 --release 21 -Xlint:all -Werror -d out DiagnosticLab.java
```


```powershell
java -Xms32m -Xmx64m -cp out DiagnosticLab cpu 30
```

第二个终端核对 PID，在可写目录录制 3 秒，保存线程快照和 JFR：

```powershell
$javaPid = [int](Read-Host 'Java PID')
$recording = Join-Path (Get-Location) 'cpu.jfr'
jcmd $javaPid JFR.start name=cpu settings=profile
Start-Sleep -Seconds 3
jcmd $javaPid Thread.print -l
jcmd $javaPid JFR.stop name=cpu "filename=$recording"
jfr print --events jdk.ExecutionSample $recording
```


### 2. 实际证据

本地故障记录包含 `DiagnosticLab.poll` 执行样本。线程快照中 `order-poller` 约存活 3.98 秒，累计 CPU 为 3890.62 ms，支持单线程持续空转的判断。这些数值是一次本地观测值，采样时机和机器负载会改变具体时间。

结束故障进程，改用 `cpu-fixed 30`，重复相同采集步骤并使用新文件名。该次快照约存活 3.86 秒，线程处于等待条件状态，累计 CPU 显示 31.25 ms。

| 本地模式 | 任务情况 | 栈与 CPU 观察 |
|----------|----------|----------------|
| `cpu` | 没有业务工作 | `poll` 热点，接近持续占用一个核心 |
| `cpu-fixed` | 同样没有业务工作 | 等待路径，累计 CPU 明显降低 |

这些是一次本地观察，受计时精度与环境影响。它验证了空等待可以避免本例忙循环，没有测量吞吐或请求延迟，也不表示应把生产任务统一改为每 10 ms 轮询。


## 三、定位业务原因


### 1. 从热点追到入口

哈希、编码、排序和正则等通用方法可能成为叶子热点。继续沿调用树确认哪个业务入口、什么输入规模触发它，检查是否存在重复扫描、重复序列化或异常后立即重试。

真实任务队列通常应使用阻塞获取或明确事件通知，并验证退出、中断和总等待预算；示例的短等待只用于展示空转对照。


### 2. 区分 GC 与本地工作

若 CPU 增长主要来自收集线程，应关联分配热点、回收后存活集和 GC 日志。若样本主要在本地库，可能需要匹配平台的原生采样与符号；Java 业务栈不能覆盖全部执行成本。

::: warning 样本不足时保留不确定性
短录制、低频调用或被阈值过滤的事件可能没有足够证据。不能因为某个方法没有样本就断言它没有执行，也不能凭一张热点图认定根因。
:::


## 四、修复与恢复

修复后在相同输入、并发和资源下比较单位成功请求 CPU、吞吐与响应分位，同时检查内存和等待是否恶化。算法优化还应覆盖代表性数据规模，重试修复应验证有限次数、退避与取消。

示例前台输入 `stop` 或等待到期即可退出，录制通过 `JFR.stop` 结束。保留不同模式的独立文件，确认没有遗留采集进程，再记录结论。

## 五、参考资料

- [Java 21 JFR 命令](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jfr.html)
- [jcmd](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html)
- [线程管理接口](https://docs.oracle.com/en/java/javase/21/docs/api/java.management/java/lang/management/ThreadMXBean.html)

以上资料说明采样与线程 CPU 的口径。
