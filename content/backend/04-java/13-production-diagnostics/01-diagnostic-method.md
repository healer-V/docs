---
title: "生产诊断方法"
tags: [Java, 诊断, 证据]
excerpt: "从影响范围、时间线和变更建立诊断假设，按证据成本选择采集方法，以本地锁故障的真实恢复对照说明事实、推断、验证与复盘之间的关系。"
date: 2026-09-10
---


# 生产诊断方法

生产诊断是用证据解释故障如何发生、如何影响用户，以及什么操作能够恢复。工具输出只有与同一实例、同一时间窗口和业务结果关联，才支持根因判断。


## 一、明确现象

先记录受影响接口、开始时间、错误率、响应分位和流量范围。订单提交超时、查询变慢和进程退出属于不同现象，不能只写“Java 服务异常”。

| 事实 | 需要对应的范围 | 判断价值 |
|------|----------------|----------|
| 延迟和错误上升 | 实例、接口、时间、样本量 | 确认用户影响 |
| 发布或配置变化 | 版本、批次、生效时间 | 提供触发候选 |
| JVM 与资源指标 | PID、JDK、CPU、内存限制 | 建立环境约束 |
| 健康实例 | 同版本、相近流量 | 排除共同因素 |

没有代码发布不等于环境没有变化。证书、数据库数据、流量结构和依赖节点都可能改变；应记录实际变化，再判断是否与现象相关。


## 二、时间线与假设


### 1. 对齐证据

日志使用明确时区和稳定请求标识，测量阶段耗时使用单调时钟。JFR 的录制窗口、线程转储时间和部署事件需落在同一故障区间，恢复后的正常快照不能否定此前故障。

线程池会复用线程，一个线程名不能代表一个请求。业务日志可通过请求标识与安全业务键关联，JFR 再补充同窗内的执行、锁和 I/O 证据。


### 2. 可证伪判断

“连接池太小”只是候选。可检验的表达是：请求时间主要花在获取连接，池等待随延迟增加，归还连接后等待恢复；还需查清连接为何长期占用。

| 候选 | 支持证据 | 反证或替代检查 |
|------|----------|----------------|
| 忙循环 | 单线程 CPU 增长、重复热点栈 | CPU 主要来自 GC 或别的进程 |
| 监视器死锁 | 两个所有者互相等待、持续快照 | 只有短暂竞争且任务正常完成 |
| 无效对象保留 | 无业务需要的对象仍有强根路径 | 正常缓存容量、活跃请求增长 |


## 三、采集成本

先查看已有日志、指标和录制，再选择能区分当前假设的命令。`jcmd` 的实际 `help` 会说明命令影响，不能把所有诊断命令都归为低成本。

::: danger 堆转储与对象输出
堆转储可能暂停应用、占用大量磁盘并包含凭据和业务数据。生产采集需遵循已有操作权限和数据管理流程，确认可用容量与恢复路径；不把原始文件放入公共附件。
:::

持续故障扩大时，应先使用已知的限流、摘除实例或版本回退控制影响，同时保存最低必要证据。涉及写入一致性时，还需核对已经提交的结果，不能盲目重放超时请求。


## 四、锁故障闭环

### 1. 本地触发

下方完整 `DiagnosticLab.java` 仅用于本地，限制运行时间为 1～60 秒。`locks` 让两个守护线程通过屏障分别持有一把锁，再请求对方的锁；`locks-fixed` 使用相同锁顺序。

在本篇新建的示例目录在前台执行，30 秒后自动退出，也可输入 `stop` 后回车结束：

使用 JDK 21，在任意位置新建空目录并保存下方完整文件。所有命令均以该目录为工作目录；需要持续观察的程序在终端 A 启动，取证命令在同目录的终端 B 执行。

保存为 `DiagnosticLab.java`：

::: details 查看 DiagnosticLab.java 完整代码

```java [DiagnosticLab.java]
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.lang.management.ManagementFactory;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/** 仅用于本地故障注入；限制存活量和寿命，所有工作线程为守护线程。 */
public final class DiagnosticLab {
    private static volatile boolean running = true;

    /** 禁止实例化诊断入口。 */
    private DiagnosticLab() { }
    /**
     * 启动本地观察目标；输出 PID 和状态，并接收 stop 命令。
     * @param args 两个参数：模式 locks/locks-fixed，以及存活秒数 1..60
     * @throws Exception 参数非法、初始化或控制输入失败时终止当前进程
     */
    public static void main(String[] args) throws Exception {
        if (args.length != 2) throw new IllegalArgumentException("expected mode and seconds");
        String mode = args[0];
        int seconds = Integer.parseInt(args[1]);
        if (seconds < 1 || seconds > 60) throw new IllegalArgumentException("seconds must be 1..60");
        switch (mode) {
            case "locks", "locks-fixed" -> locks(mode.endsWith("fixed"));
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

    /** @param ordered true 按相同顺序获得两把锁，false 在屏障后形成确定等待环。 */
    private static void locks(boolean ordered) throws InterruptedException {
        Object orderLock = new Object();
        Object stockLock = new Object();
        CountDownLatch held = new CountDownLatch(2);
        CountDownLatch done = new CountDownLatch(2);
        Thread.ofPlatform().daemon().name("order-first").start(
                /* 第一个事务固定先订单锁。 */ () -> lockBoth(orderLock, stockLock, held, done, ordered));
        Thread.ofPlatform().daemon().name("stock-first").start(
                /* 故障分支反转锁顺序，修复分支遵守同一顺序。 */
                () -> lockBoth(ordered ? orderLock : stockLock, ordered ? stockLock : orderLock, held, done, ordered));
        if (ordered) {
            if (!done.await(2, TimeUnit.SECONDS)) throw new IllegalStateException("ordered locks stalled");
            System.out.println("LOCKS_COMPLETED=2");
        } else {
            long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(2);
            long[] deadlocked;
            do {
                deadlocked = ManagementFactory.getThreadMXBean().findDeadlockedThreads();
                if (deadlocked == null) Thread.sleep(1);
            } while (deadlocked == null && System.nanoTime() < deadline);
            if (deadlocked == null) throw new IllegalStateException("deadlock not established");
            System.out.println("DEADLOCKED=" + deadlocked.length);
        }
    }

    /**
     * @param first 第一把非空监视器。
     * @param second 第二把不同监视器。
     * @param held 两个任务获得第一把锁后的屏障。
     * @param done 正常完成计数，不把死锁记作成功。
     * @param ordered true 跳过故障屏障。
     * 无返回值；完整获得两把锁后递减完成计数。
     */
    private static void lockBoth(Object first, Object second, CountDownLatch held, CountDownLatch done, boolean ordered) {
        synchronized (first) {
            held.countDown();
            if (!ordered) {
                try {
                    if (!held.await(2, TimeUnit.SECONDS)) throw new IllegalStateException("first locks not held");
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
            synchronized (second) {
                done.countDown();
            }
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

java -Xms32m -Xmx64m -cp out DiagnosticLab locks 30
```

程序输出 `DEADLOCKED=2` 和含 PID、UTC 时间的 `READY`。另一个终端按[进程与 jcmd](./02-process-jcmd.md)确认 PID，采集 `Thread.print -l`。


### 2. 证据与恢复

本地三次快照均报告 `Found one Java-level deadlock`，等待链包含 `order-first` 和 `stock-first`。终止该本地故障进程后，改用 `locks-fixed` 执行相同两个任务：

```powershell
java -Xms32m -Xmx64m -cp out DiagnosticLab locks-fixed 30
```

实际输出 `LOCKS_COMPLETED=2`，三次快照没有死锁报告。这个对照说明本例的锁顺序修复有效；重启故障进程本身只清除了现场状态，不是修复证据。


## 五、记录与结论

记录每项命令的目标、时间、参数、输出和影响，将原始文件与分析结论分开保存。文件哈希有助于确认分析对象没有变化，但不能证明采集内容本身完整。

::: tip 根因要解释全部证据
结论应同时解释触发条件、受影响范围、运行机制和修复后变化。无法解释的证据保留为未决问题，不把“最后一次操作后恢复”直接写成因果结论。
:::

## 六、参考资料

- [Java 21 故障排查指南](https://docs.oracle.com/en/java/javase/21/troubleshoot/)
- [jcmd 命令](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html)

以上资料提供工具与影响边界。
