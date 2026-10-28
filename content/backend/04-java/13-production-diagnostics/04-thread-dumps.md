---
title: "线程转储与死锁"
tags: [Java, 线程, 死锁]
excerpt: "从线程状态、锁所有者和等待对象读取转储，使用屏障建立的死锁及三次快照验证等待环，对照统一锁顺序后的任务完成，并区分竞争、资源等待和虚拟线程观察。"
date: 2026-09-10
---


# 线程转储与死锁

线程转储保存某个时刻的线程、调用栈和部分同步信息。状态说明线程在做什么，等待链说明它需要谁推进；判断故障还需要持续时间、任务进度和关联资源指标。


## 一、状态与角色

| 状态或栈 | 常见含义 | 需要补充的判断 |
|----------|----------|----------------|
| `RUNNABLE` | 可运行、执行或部分本地调用 | 是否实际消耗 CPU |
| `BLOCKED` | 等待进入监视器 | 谁持有、为何未释放 |
| `WAITING` | 队列、条件、Future 等等待 | 是否存在应当到来的事件 |
| `TIMED_WAITING` | 带期限等待或休眠 | 期限、任务身份和完成结果 |

空闲工作线程等待队列通常正常；请求线程等待一个永远得不到调度的 Future 则可能发生资源死锁。相同状态必须结合上层调用和业务角色解释。


## 二、确定的等待环


### 1. 故障入口

`DiagnosticLab locks` 创建两把监视器和两个守护线程。两个线程都拿到第一把锁后，屏障才放行，它们分别请求对方持有的第二把锁，因此无需用 `sleep` 猜测交错顺序。

按下面给出的完整文件编译，在本篇新建的示例目录执行：

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

程序确认 `DEADLOCKED=2` 后打印 `READY`。第二个终端核对 PID，并在当前可写目录保存三次快照：

```powershell
$javaPid = [int](Read-Host 'Java PID')
jcmd $javaPid Thread.print -l > threads-1.txt
Start-Sleep -Milliseconds 250
jcmd $javaPid Thread.print -l > threads-2.txt
Start-Sleep -Milliseconds 250
jcmd $javaPid Thread.print -l > threads-3.txt
```


### 2. 阅读所有权

三份实际快照均报告 `Found one Java-level deadlock`。以下为等待关系节选，保留本次对象地址以便对应两把锁：

```text
order-first: waiting to lock 0x00000000fde7dfb8, held by stock-first
stock-first: waiting to lock 0x00000000fde7dfa8, held by order-first
```

这是对原始多行报告的归纳，具体线程栈均落在 `DiagnosticLab.lockBoth`。`order-first` 已持有 `fde7dfa8`，`stock-first` 已持有 `fde7dfb8`，构成闭合等待环；单独看到两个 `BLOCKED` 还不足以得出同样结论。


## 三、修复与退出

终止本地故障进程后，执行使用一致锁顺序的模式，并重新采集三份快照：

```powershell
java -Xms32m -Xmx64m -cp out DiagnosticLab locks-fixed 30
```

实际输出 `LOCKS_COMPLETED=2`，转储不再报告死锁。修复保证两个任务按相同顺序取得锁，不是移除同步；共享状态仍必须在正确边界内受保护。

::: warning 监视器等待不会因普通中断而退出
`synchronized` 的进入等待不具备 `lockInterruptibly` 的中断协议。本例使用守护线程和有界进程，输入 `stop` 或到期退出即可回收现场，不能把这种方式当作生产任务的恢复设计。
:::


## 四、竞争与资源死锁


### 1. 热锁与长临界区

如果等待者长期集中在一把锁上，但所有者仍在变化，通常先考虑竞争。结合 JFR 的监视器事件检查持锁 I/O、同步日志或复杂计算，缩短临界区前先写清需要共同保护的业务不变量。

三次快照间隔应覆盖正常任务时长。示例中的 250 ms 用于已确认不推进的本地等待环，不是所有生产任务的固定采集周期。

### 2. 执行器与下游

固定线程池的工作线程全部等待同池中的子任务，或线程持有连接再等待另一个连接，都可能无法推进。JVM 不一定报告 Java 级监视器死锁，需要补充队列、活动任务、许可和数据库等待证据。

只增加线程或池大小可能延后复现。应消除循环资源依赖，设置总等待预算，并核对取消后资源是否归还。


## 五、虚拟线程观察

Java 21 的 `Thread.dump_to_file` 提供包含虚拟线程的新格式转储，可按文本或 JSON 输出。先查看目标帮助，再按栈和任务类型聚合；它与传统 `Thread.print -l` 的锁和对象信息并不完全相同。

::: tip 状态、持续时间与进度一起看
一次快照是入口，等待对象和所有者是关系，连续证据与任务完成情况才解释是否故障。传统死锁报告为空，也不能排除数据库或跨服务等待环。
:::

## 六、参考资料

- [Java 21 jcmd](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html)
- [ThreadMXBean](https://docs.oracle.com/en/java/javase/21/docs/api/java.management/java/lang/management/ThreadMXBean.html)
- [虚拟线程指南](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html)

以上资料说明转储能力及边界。
