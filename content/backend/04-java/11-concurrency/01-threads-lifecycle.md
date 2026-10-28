---
title: "线程与生命周期"
tags: [Java, Thread, 并发]
excerpt: "解释任务与线程、start 与 run、六种线程状态和有界等待，通过真实等待线程复现中断与终止，明确守护线程、异常传播及取消协议的边界。"
date: 2026-09-10
---


# 线程与生命周期

线程承载一条顺序执行的控制流。任务描述要执行什么，线程或执行器决定任务在哪里运行；创建一个 `Thread` 对象并不表示任务已经开始。


## 一、任务与启动

`Runnable` 描述不返回业务值的任务，`Callable<V>` 可以返回结果并抛出受检异常。普通业务优先把任务与线程管理分开，以便交给不同执行器并测试。

| 调用 | 执行位置 | 生命周期效果 |
|------|----------|--------------|
| `new Thread(task)` | 不执行任务 | 创建处于 `NEW` 的平台线程对象 |
| `thread.run()` | 对普通平台线程是调用者线程 | 普通方法调用，不启动新线程 |
| `thread.start()` | 新启动的线程 | 请求调度执行，同一对象只能调用一次 |

Java 21 还支持虚拟线程，其创建和调度边界见[虚拟线程](./12-virtual-threads.md)。直接调用 `run()` 的演示限定为普通平台线程，不用它作为虚拟线程启动入口。

线程结束后不能重新 `start()`。需要重复执行的是任务，可以创建新线程或再次提交给执行器，不应重用已经终止的 `Thread` 实例。


## 二、线程状态

| 状态 | 含义 | 典型观察 |
|------|------|----------|
| `NEW` | 已创建但未启动 | `start()` 之前 |
| `RUNNABLE` | JVM 可运行状态 | 执行、等待 CPU 或部分本地调用 |
| `BLOCKED` | 等待对象监视器 | 进入被其他线程持有的 `synchronized` |
| `WAITING` | 没有指定等待期限 | `wait()`、无期限 `join()` 或 park |
| `TIMED_WAITING` | 带期限的等待 | `sleep`、限时 park 等 |
| `TERMINATED` | 执行已经结束 | 正常返回或未处理异常退出 |

状态是瞬时快照。`RUNNABLE` 不保证持续占用 CPU，等待 `ReentrantLock` 也不等同于监视器 `BLOCKED`；判断问题还要结合栈、锁、时间和资源指标。


## 三、等待与中断

### 1. 等待完成

`join` 等待目标线程结束；带时限的等待超时后，必须检查是否仍然存活。Java 21 的 `join(Duration)` 也可以直接返回是否在期限内结束。

`sleep` 暂停当前线程，精度受计时与调度影响，不释放已持有的监视器，也不建立线程间的数据发布关系。不能用“睡得足够久”代替条件或完成通知。


### 2. 协作取消

`interrupt()` 是取消请求。目标线程需要检查中断状态，或通过可中断阻塞方法收到 `InterruptedException`。不能假设中断会强行终止任意计算、网络或本地调用。

`isInterrupted()` 读取标记而不清除，静态 `Thread.interrupted()` 读取并清除当前线程的标记。许多阻塞方法抛出 `InterruptedException` 时也会清除标记；能继续抛出时交给上层，不能抛出而决定结束任务时通常恢复标记。

```java
catch (InterruptedException failure) {
    Thread.currentThread().interrupt();
    return;
}
```

恢复标记不代表可以继续原业务流程。吞掉中断后继续等待，可能使取消和应用关闭一直无法完成。

## 四、生命周期验证

### 1. 受控等待线程

下面的独立示例使用 JDK 21、JUnit 6.1.2 和 Maven 3.9.11。下面是 `StateContractTest#interruptStopsWaitingThread` 中的任务核心，`gate` 是未打开的闭锁，`restored` 为原子布尔观测值。

```java
var worker = new Thread(/* 取消后结束任务，不继续原业务操作。 */ () -> {
    try {
        gate.await();
    } catch (InterruptedException failure) {
        Thread.currentThread().interrupt();
        restored.set(Thread.currentThread().isInterrupted());
    }
}, "order-waiter");
assertEquals(Thread.State.NEW, worker.getState());
worker.start();
```

测试有界等待线程进入 `WAITING`，然后发送中断并 `join`，断言它进入 `TERMINATED` 且恢复标记。最后仍执行清理，避免断言失败时留下后台线程。状态轮询只用于诊断测试，不承担业务数据同步。

### 2. 执行与结果

在本篇新建的示例目录运行启动方式与中断两个测试：

先安装 JDK 21 和 Maven 3.9.11，在任意位置新建空目录作为本篇示例目录。按下方路径创建父目录和文件，编码使用 UTF-8；Maven 首次构建会下载声明的公开依赖。

将以下内容保存为 `pom.xml`：

::: details 查看 pom.xml 完整内容

```xml [pom.xml]
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>order</groupId>
    <artifactId>order-concurrency</artifactId>
    <version>1.0.0</version>
    <properties>
        <maven.compiler.release>21</maven.compiler.release>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>6.1.2</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-clean-plugin</artifactId>
                <version>3.4.1</version>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-resources-plugin</artifactId>
                <version>3.3.1</version>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.14.1</version>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.5.4</version>
                <configuration><failIfNoTests>true</failIfNoTests></configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-jar-plugin</artifactId>
                <version>3.4.2</version>
            </plugin>
        </plugins>
    </build>
</project>
```

:::

将以下内容保存为 `src/test/java/order/concurrent/TestTasks.java`：

::: details 查看 TestTasks.java 完整内容

```java [src/test/java/order/concurrent/TestTasks.java]
package order.concurrent;

import static org.junit.jupiter.api.Assertions.*;
import java.time.Duration;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.TimeUnit;

/** 为并发教学测试统一提供有界等待和结束检查。 */
final class TestTasks {
    /** 禁止实例化测试工具。 */
    private TestTasks() { }

    /**
     * 请求取消未完成任务并验证线程池结束，无返回值。
     * @param executor 当前测试拥有的执行器，不能是公共池
     * @throws InterruptedException 等待终止被中断时继续传播
     */
    static void stop(ExecutorService executor) throws InterruptedException {
        executor.shutdownNow();
        assertTrue(executor.awaitTermination(2, TimeUnit.SECONDS), "executor did not stop");
    }

    /**
     * 协作中断测试线程并验证它结束，无返回值。
     * @param worker 当前测试创建且遵守中断协议的线程
     * @throws InterruptedException 等待结束被中断时继续传播
     */
    static void stopThread(Thread worker) throws InterruptedException {
        worker.interrupt();
        worker.join(Duration.ofSeconds(2));
        assertFalse(worker.isAlive(), "worker did not stop");
    }

    /**
     * 只为诊断断言等待线程到达明确状态，不据此发布业务数据。
     * @param worker 当前测试已启动的线程
     * @param state 两秒内应观察到的阻塞状态
     * 无返回值；有界自旋仅用于这些短测试。
     */
    static void state(Thread worker, Thread.State state) {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(2);
        while (worker.getState() != state && System.nanoTime() < deadline) {
            Thread.onSpinWait();
        }
        assertEquals(state, worker.getState());
    }
}
```

:::

将以下内容保存为 `src/test/java/order/concurrent/StateContractTest.java`：

::: details 查看 StateContractTest.java 完整内容

```java [src/test/java/order/concurrent/StateContractTest.java]
package order.concurrent;

import static org.junit.jupiter.api.Assertions.*;
import java.time.Duration;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

/** 受控交错展示错误，并用 API 契约解释修复；有限测试不是并发证明。 */
@Timeout(10)
class StateContractTest {
    /** 直接调用 run 使用调用线程，start 才创建新的执行线程。 */
    @Test
    void runAndStartDiffer() throws Exception {
        long[] observed = new long[1];
        var worker = new Thread(/* 记录当前实际执行线程，不读取共享业务状态。 */
                () -> observed[0] = Thread.currentThread().threadId(), "order-runner");
        worker.run();
        assertEquals(Thread.currentThread().threadId(), observed[0]);
        worker.start();
        try {
            worker.join(Duration.ofSeconds(2));
            assertFalse(worker.isAlive());
            assertEquals(worker.threadId(), observed[0]);
            assertThrows(IllegalThreadStateException.class,
                    /* 一个 Thread 对象只能启动一次。 */ worker::start);
        } finally {
            TestTasks.stopThread(worker);
        }
    }

    /** 通过真实等待状态触发中断，检查恢复标记与正常终止。 */
    @Test
    void interruptStopsWaitingThread() throws Exception {
        var gate = new CountDownLatch(1);
        var restored = new AtomicBoolean();
        var worker = new Thread(/* 没有业务结果时，取消应结束任务。 */ () -> {
            try {
                gate.await();
            } catch (InterruptedException failure) {
                Thread.currentThread().interrupt();
                restored.set(Thread.currentThread().isInterrupted());
            }
        }, "order-waiter");
        assertEquals(Thread.State.NEW, worker.getState());
        worker.start();
        try {
            TestTasks.state(worker, Thread.State.WAITING);
            worker.interrupt();
            worker.join(Duration.ofSeconds(2));
            assertFalse(worker.isAlive());
            assertEquals(Thread.State.TERMINATED, worker.getState());
            assertTrue(restored.get());
        } finally {
            TestTasks.stopThread(worker);
        }
    }
}
```

:::

```powershell

mvn -ntp -f pom.xml test "-Dtest=StateContractTest#runAndStartDiffer+interruptStopsWaitingThread"
```

报告应为 2 项通过。前者验证直接 `run` 使用调用线程、`start` 使用新线程且第二次启动失败；后者验证等待状态、中断处理与正常收敛。超时是失败条件，不能把仍存活的线程记为已完成。


## 五、退出与异常边界

平台线程默认继承创建者的守护属性。仅剩守护线程时，JVM 可以退出，不等待其业务工作完成，因此不能靠守护线程保证关键提交或文件写入。

线程任务未处理的异常会结束该线程，不自动抛回创建线程。未捕获异常处理器负责最终观测；执行器提交的任务还可能把异常保存在 `Future` 中，需要主动读取，见[执行器与线程池](./09-executors-thread-pools.md)。

::: warning 不使用过时的强制控制
`stop`、`suspend`、`resume` 属于已弃用的线程控制方式，Java 21 不应以它们构建停止协议。业务取消应明确中断响应、资源超时与结束等待，避免破坏对象状态或锁关系。
:::

## 六、参考资料

- [Thread API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.html)
- [JLS 线程和锁](https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html)

以上资料说明启动、等待、中断与状态的契约。
