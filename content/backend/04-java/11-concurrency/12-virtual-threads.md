---
title: "虚拟线程"
tags: [Java, 虚拟线程, Java 21]
excerpt: "解释 Java 21 每任务一虚拟线程的执行模型，验证下游许可与任务取消，通过实际 JFR 事件观察监视器固定载体线程，明确 CPU、内存、上下文和版本边界。"
date: 2026-09-10
---


# 虚拟线程

虚拟线程是由 JVM 调度的轻量级 `Thread`，在 Java 21 成为正式能力。它让大量相互独立的阻塞任务继续使用顺序代码，降低等待过程中占用平台线程的成本，但不会改变线程安全和业务容量要求。


## 一、线程与载体

平台线程通常对应一个操作系统线程。虚拟线程在执行时挂载到载体线程上，在受支持的阻塞点可以卸载，使载体继续运行其他任务；恢复执行时不保证仍使用同一个载体。

ThreadLocal、调用栈和中断状态属于虚拟线程自身，业务不应依赖载体身份。虚拟线程是守护线程，进程退出前仍需显式等待必须完成的工作。

| 场景 | 虚拟线程的作用 | 仍然存在的限制 |
|------|----------------|----------------|
| 大量独立阻塞请求 | 降低等待占用的平台线程成本 | 下游容量、超时与入口负载 |
| 顺序业务控制流 | 保留局部变量与异常边界 | 跨资源一致性不会自动获得 |
| CPU 密集计算 | 不增加 CPU 核心能力 | 仍需控制实际计算并行度 |
| 单次数据库慢查询 | 不会直接加快 SQL | 数据库执行与锁问题仍需处理 |


## 二、创建与生命周期

`Thread.startVirtualThread` 直接启动任务，`Thread.ofVirtual()` 提供构建器，`Executors.newVirtualThreadPerTaskExecutor()` 为每项提交创建独立虚拟线程。

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    var result = executor.submit(/* 返回当前任务是否在虚拟线程执行。 */
            () -> Thread.currentThread().isVirtual());
    System.out.println(result.get(2, TimeUnit.SECONDS));
}
```

这是局部执行示例，需导入 `Executors`、`TimeUnit` 并处理等待异常。`close()` 会等待任务结束；如果任务忽略取消或缺少外部超时，离开资源块也可能长期等待。

虚拟线程通常不需要为了减少创建成本而池化复用。需要约束的是数据库连接、下游并发、请求内存和入口流量；这些边界仍可以通过许可、池和准入控制限制。


## 三、下游并发限制

下方的 `ExecutionContractTest#virtualThreadsRespectDownstreamLimit` 创建 12 项虚拟线程任务，只有 2 个下游许可。前两项获得许可后保持等待，让测试能够明确观察并发上限。

下面是每项任务的核心，`permits`、`active`、`maximum` 及闭锁由外层测试创建，所有任务均在最终路径回收：

::: details 查看虚拟线程的下游许可边界

```java
permits.acquire();
try {
    int current = active.incrementAndGet();
    maximum.accumulateAndGet(current,
            /* 当前值与历史值只做无副作用比较。 */ Math::max);
    twoActive.countDown();
    release.await();
    return Thread.currentThread().isVirtual();
} finally {
    active.decrementAndGet();
    permits.release();
}
```

:::

测试在两个任务都活动后放行，等待全部结果，确认每项都在虚拟线程执行、最大下游并发为 2、结束后许可恢复为 2。更多虚拟线程没有扩大下游容量。


## 四、Java 21 的固定行为


### 1. 固定载体线程

Java 21 中，虚拟线程在持有 `synchronized` 监视器或涉及某些本地调用时执行阻塞，可能无法卸载，称为 pinning。此时载体也被占用，频繁而长时间的固定会影响扩展性。

短小内存临界区不应因此全面替换。先观察实际事件和持有栈，再缩短阻塞临界区，或在明确受影响的路径使用合适的显式锁。该限制以 Java 21 为准，后续 JDK 的监视器实现会演进。

### 2. JFR 事件验证

下方完整测试开启 `jdk.VirtualThreadPinned` 事件并将阈值设为零，在监视器内停放虚拟线程约 150 ms，产生真实事件文件 `target/virtual-thread-pinned.jfr`。

这段停放是明确的故障触发，不用于推测任务顺序。JFR 输出的一次实际节选如下，时间和线程编号每次运行可以不同：

```text
jdk.VirtualThreadPinned {
  duration = 148 ms
  eventThread = "" (javaThreadId = 88, virtual)
}
```

这是从完整事件中保留的关键字段，堆栈还包含 `VirtualThread.parkOnCarrierThread` 和 `LockSupport.parkNanos`。事件证明当前 Java 21 执行发生固定，不代表真实业务已经存在同样瓶颈。

::: warning 不能跨版本套用固定结论
主线示例按 Java 21 验证，固定行为测试也检查该版本。升级 JDK 后应重新核对运行机制与事件，不能把一个版本的结果永久当成所有虚拟线程的限制。
:::

## 五、执行与观察

使用 JDK 21，在本篇新建的示例目录运行限流和固定行为测试，再读取 JFR：

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
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

/** 为并发教学测试统一提供有界等待和结束检查。 */
final class TestTasks {
    /** 禁止实例化测试工具。 */
    private TestTasks() { }

    /**
     * 等待真实同步事件，不使用休眠猜测线程顺序。
     * @param latch 必须在两秒内打开的闭锁
     * @throws InterruptedException 测试等待被中断时继续传播
     */
    static void await(CountDownLatch latch) throws InterruptedException {
        assertTrue(latch.await(2, TimeUnit.SECONDS), "latch timed out");
    }

    /**
     * 读取任务结果并使任务异常、超时成为测试失败。
     * @param future 已提交的非空任务
     * @param <T> 任务结果类型
     * @return 两秒内完成的任务结果
     * @throws Exception 任务失败、超时或等待被中断时抛出
     */
    static <T> T result(Future<T> future) throws Exception {
        return future.get(2, TimeUnit.SECONDS);
    }

    /**
     * 请求取消未完成任务并验证线程池结束，无返回值。
     * @param executor 当前测试拥有的执行器，不能是公共池
     * @throws InterruptedException 等待终止被中断时继续传播
     */
    static void stop(ExecutorService executor) throws InterruptedException {
        executor.shutdownNow();
        assertTrue(executor.awaitTermination(2, TimeUnit.SECONDS), "executor did not stop");
    }
}
```

:::

将以下内容保存为 `src/test/java/order/concurrent/ExecutionContractTest.java`：

::: details 查看 ExecutionContractTest.java 完整内容

```java [src/test/java/order/concurrent/ExecutionContractTest.java]
package order.concurrent;

import static org.junit.jupiter.api.Assertions.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.LockSupport;
import jdk.jfr.Recording;
import jdk.jfr.consumer.RecordingFile;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

/** 验证执行器边界、上下文复用、异步取消和 Java 21 虚拟线程。 */
@Timeout(10)
class ExecutionContractTest {

    /** 虚拟线程按任务创建，Semaphore 独立限制下游并发为二。 */
    @Test
    void virtualThreadsRespectDownstreamLimit() throws Exception {
        var executor = Executors.newVirtualThreadPerTaskExecutor();
        var permits = new Semaphore(2);
        var twoActive = new CountDownLatch(2);
        var release = new CountDownLatch(1);
        var active = new AtomicInteger();
        var maximum = new AtomicInteger();
        try {
            List<Future<Boolean>> tasks = new ArrayList<>();
            for (int index = 0; index < 12; index++) {
                tasks.add(executor.submit(/* 每项任务使用独立虚拟线程，只限下游许可。 */ () -> {
                    permits.acquire();
                    try {
                        int current = active.incrementAndGet();
                        maximum.accumulateAndGet(current,
                                /* 原子回调只比较历史值和当前值，可以安全重试。 */ Math::max);
                        twoActive.countDown();
                        release.await();
                        return Thread.currentThread().isVirtual();
                    } finally {
                        active.decrementAndGet();
                        permits.release();
                    }
                }));
            }
            TestTasks.await(twoActive);
            assertEquals(2, active.get());
            release.countDown();
            for (var task : tasks) {
                assertTrue(TestTasks.result(task));
            }
            assertEquals(2, maximum.get());
            assertEquals(0, active.get());
            assertEquals(2, permits.availablePermits());
        } finally {
            release.countDown();
            TestTasks.stop(executor);
        }
    }

    /** Java 21 持有监视器时停放虚拟线程，记录真实的 pinning 事件。 */
    @Test
    void java21MonitorPinningIsRecorded() throws Exception {
        assertEquals(21, Runtime.version().feature(), "this contract targets Java 21");
        var executor = Executors.newVirtualThreadPerTaskExecutor();
        Path output = Path.of("target", "virtual-thread-pinned.jfr");
        Files.createDirectories(output.getParent());
        try (var recording = new Recording()) {
            recording.enable("jdk.VirtualThreadPinned").withThreshold(Duration.ZERO).withStackTrace();
            recording.start();
            var monitor = new Object();
            TestTasks.result(executor.submit(/* 有意停放 150 ms 以产生记录，不用于线程排序。 */ () -> {
                synchronized (monitor) {
                    LockSupport.parkNanos(TimeUnit.MILLISECONDS.toNanos(150));
                }
            }));
            recording.stop();
            recording.dump(output);
            boolean pinned = false;
            for (var event : RecordingFile.readAllEvents(output)) {
                if (event.getEventType().getName().equals("jdk.VirtualThreadPinned")) {
                    pinned = true;
                }
            }
            assertTrue(pinned, "expected Java 21 monitor pinning event");
        } finally {
            TestTasks.stop(executor);
        }
    }
}
```

:::

```powershell

mvn -ntp -f pom.xml test "-Dtest=ExecutionContractTest#virtualThreadsRespectDownstreamLimit+java21MonitorPinningIsRecorded"
jfr print --events jdk.VirtualThreadPinned target/virtual-thread-pinned.jfr
```

报告应为 2 项通过，并至少记录一个固定事件。本篇示例不启用预览参数；结构化并发、Scoped Values 等 Java 21 预览能力不混入该执行入口。


## 六、上下文与诊断

虚拟线程支持 ThreadLocal，但每任务保存较大的缓存或缓冲区，会随着并发数放大内存占用。连接和昂贵资源仍应按独立生命周期获取并归还，不以线程本地缓存替代容量设计。

取消依然依赖任务和阻塞 API 的中断协议。客户端超时、请求截止时间与执行器关闭都需验证，虚拟线程本身不能确保数据库或远程请求立即停止。

传统 `ThreadMXBean` 主要管理平台线程，不能据此推断所有虚拟线程状态。JFR 与新式线程转储可补充观察，诊断时同时关注活跃请求、许可等待、堆内存和下游延迟。

## 七、参考资料

- [JEP 444](https://openjdk.org/jeps/444)
- [Java 21 虚拟线程指南](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html)
- [虚拟线程执行器](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Executors.html#newVirtualThreadPerTaskExecutor()

以上资料)说明正式能力、调度和监视器固定边界。
