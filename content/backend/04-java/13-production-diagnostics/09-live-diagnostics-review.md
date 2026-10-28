---
title: "在线诊断与复盘"
tags: [Java, 诊断, 复盘]
excerpt: "根据证据缺口选择 JDK 与在线诊断工具，明确采集范围、退出和恢复条件，以已验证的锁故障串联触发、取证、修复、恢复及可验收的预防措施。"
date: 2026-09-10
---


# 在线诊断与复盘

在线诊断为运行中问题补充证据，复盘将证据转为可验证的预防措施。采集完成并不等于服务恢复，服务恢复也不等于根因已经解释清楚。


## 一、工具选择

| 证据缺口 | 可选能力 | 选择边界 |
|----------|----------|----------|
| 版本、参数、线程与 GC | JDK 的 `jcmd`、日志、JFR | 优先使用已存在的运行证据 |
| 在线类与具体调用 | Arthas | 核对类、加载器、方法和表达式范围 |
| CPU、wall-clock 或分配采样 | async-profiler | 匹配平台、架构、权限和事件能力 |
| 对象保留路径 | 离线堆分析器 | 先确定转储必要性与数据保护 |

工具版本与平台支持会变化，部署前按官方发行包和当前帮助核对。这里的实际验证主线使用 JDK 21；未在本轮安装或执行 Arthas、async-profiler，不给出它们的虚构运行输出。


## 二、限制观察范围


### 1. 采样与插桩

采样表示窗口内捕获的执行或等待位置，火焰图宽度通常对应样本占比，不是某次调用的精确耗时。wall-clock 与 CPU 事件回答的问题不同，必须注明采样类型。

Arthas 的 `watch`、`trace` 等会增强相关字节码，并可能遍历参数或执行表达式。应限制类、方法、条件、次数和时间，不以通配全包作为初始观察方式。

### 2. 退出与复原

诊断前明确结束条件：已经得到足够证据、达到采集期限，或开销开始影响服务。JFR 可通过 `check` 核对记录、通过 `stop` 结束指定记录；其他工具也需要区分断开客户端与停止目标服务。

::: danger 表达式可能改变业务状态
在线调用方法、重放请求或重定义类不属于普通只读采样。对象 getter 也可能有副作用或高成本，执行前必须明确行为和既有操作约束。
:::


## 三、锁故障复盘

### 1. 可复查的事件链

下方程序在本篇复现锁故障；[线程转储与死锁](./04-thread-dumps.md)解释同类证据的读取方法。本例只在本地注入故障，没有真实生产用户影响，以下记录按实验阶段组织：

| 顺序 | 事实与证据 | 结论 |
|------|------------|------|
| 1 | 两个任务分别取得不同的第一把锁 | 具备锁顺序冲突的前提 |
| 2 | 屏障放行，`DEADLOCKED=2` | 两任务进入互相等待 |
| 3 | 三次转储均报告同一等待环 | 不是一次短暂竞争快照 |
| 4 | 故障进程输出 `STOPPED` 后结束 | 本地现场资源已回收 |
| 5 | 相同任务改为一致锁顺序 | 两任务输出 `LOCKS_COMPLETED=2` |
| 6 | 三次修复后快照没有死锁报告 | 修复符合本例证据与进度目标 |


### 2. 重现与核对

按下面给出的完整文件编译，在本篇新建的示例目录分别运行两个模式；每次都确认前一个进程退出，再启动后一个：

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
java -Xms32m -Xmx64m -cp out DiagnosticLab locks-fixed 30
```

在各自窗口使用 `jcmd <实际数字 PID> Thread.print -l` 采集，保留不同文件名。故障模式的终止只是本地止损；相同输入下修复模式完成任务，才是代码修复证据。

## 四、预防措施

| 原因或缺口 | 具体措施 | 验证方式 |
|------------|----------|----------|
| 锁顺序不一致 | 统一资源获取次序并记录所有权 | 两任务反向触发仍能完成 |
| 长等待缺少进度信号 | 记录活动任务与等待时长 | 故障注入时能及时观察 |
| 只有瞬时状态 | 有界保存多次转储或 JFR | 文件具有目标、时间和窗口 |
| 退出只关闭终端 | 明确停止记录及进程状态 | 原 PID 已结束或记录已停止 |

生产行动项还需填写负责人、期限和验证环境。不要仅写“加强监控”或“以后注意”，每项应能对应到已确认原因并独立核验。


## 五、恢复与数据

使用事故开始时定义的错误率、响应分位、吞吐和资源指标确认恢复，观察时间应覆盖原来的触发周期。重启清空缓存后的短暂正常，不能证明长期保留已经解决。

写请求还需要核对提交、幂等键和补偿记录，避免把超时等同于未执行。清理诊断服务、临时端口和采集任务，原始文件按留存策略保管，复盘保留最小必要证据。

## 六、参考资料

- [Arthas 命令与退出说明](https://arthas.aliyun.com/en/doc/commands.html)
- [async-profiler 官方仓库](https://github.com/async-profiler/async-profiler)
- [Java 21 故障排查指南](https://docs.oracle.com/en/java/javase/21/troubleshoot/)

以上资料提供工具范围和后续核验入口。
