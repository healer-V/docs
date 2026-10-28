---
title: "执行器与线程池"
tags: [Java, Executor, Future, ForkJoinPool]
excerpt: "解释任务提交、线程与队列容量、Future 异常和取消，通过有界线程池验证拒绝与终止，并说明周期任务、工作窃取、公共池和生命周期管理的边界。"
date: 2026-09-10
---


# 执行器与线程池

执行器把任务提交与执行机制分离。`Executor` 不承诺创建新线程；`ExecutorService` 增加结果、取消和生命周期管理，线程池则用工作线程与队列组织实际执行。


## 一、任务与结果


### 1. execute 与 submit

`Runnable` 没有业务返回值，`Callable<V>` 可以返回结果并抛出受检异常。以普通 `ThreadPoolExecutor` 为例，两种提交方式的失败观察路径不同：

| 方式 | 结果通道 | 异常观察 |
|------|----------|----------|
| `execute(Runnable)` | 无 Future | 未处理任务异常进入工作线程的未捕获异常路径 |
| `submit(Runnable/Callable)` | 返回 Future | 任务失败保存在 Future 中，读取时暴露 |

只调用 `submit` 而不读取结果、不统一收集错误，会让失败难以察觉。线程仍存活也不能证明此前任务成功。


### 2. Future 等待与取消

`get(timeout, unit)` 控制当前调用方等待结果的时长；任务失败被包装为 `ExecutionException`，实际原因在 cause。等待被中断时应传播或恢复中断，不把它转换为普通空结果。

`Future.cancel(true)` 对具备相应执行关联的任务请求中断，无法强行停止不响应中断的代码。取消状态、工作线程退出和外部副作用结束是不同事件，需要分别管理。


## 二、线程与队列容量


### 1. 接受任务的顺序

在线程池正常运行时，`ThreadPoolExecutor` 的容量判断可以按以下顺序理解：

1. 工作线程少于核心数时，尝试创建线程执行任务。
2. 核心数已到达时，尝试入队等待。
3. 入队失败且线程数未达最大值时，尝试增加线程。
4. 无法接受任务或池已关闭时，执行拒绝策略。

并发关闭和工作线程状态还会触发重新检查，因此不是简单地“入队成功就一定执行”。使用无界队列时，额外线程通常不会因队列满而创建，调大 `maximumPoolSize` 未必生效。


### 2. 有界配置

下方完整测试使用一条线程和一格队列，使容量边界可明确观察。下面是 `ExecutionContractTest#boundedPoolRejectsAndTerminates` 中的配置：

```java
var executor = new ThreadPoolExecutor(1, 1, 0, TimeUnit.MILLISECONDS,
        new ArrayBlockingQueue<>(1), Thread.ofPlatform().name("order-pool-", 0).factory(),
        new ThreadPoolExecutor.AbortPolicy());
```

这组数字用于故障验证，不是生产参数。生产上限应结合任务执行时间、允许排队时长、内存和下游容量确定；持续过载需要拒绝或限制入口，不能只扩张队列。


## 三、拒绝与执行隔离

| 策略 | 行为 | 需要承担的结果 |
|------|------|----------------|
| `AbortPolicy` | 抛出拒绝异常 | 调用方明确处理过载 |
| `CallerRunsPolicy` | 未关闭时由提交线程运行 | 提交线程可能阻塞或改变线程上下文 |
| `DiscardPolicy` | 静默丢弃 | 必须业务允许丢失并有观测 |
| `DiscardOldestPolicy` | 丢弃队首并重试 | 可能丢弃等待已久的重要任务 |

丢弃策略配合 `submit` 时，还可能留下从未执行、也未完成的 Future，等待方无法自然结束。策略必须与结果、取消和指标共同设计。

CPU 计算、阻塞 I/O、长批次和定时任务不宜无条件共用一个小池。所有工作线程在任务中阻塞等待同池排队子任务，可能产生线程饥饿死锁；应调整依赖表达、拆分执行边界或采用适合的组合模型。

::: warning 默认工厂仍需容量判断
`newFixedThreadPool` 使用无界任务队列，`newCachedThreadPool` 的平台线程数量缺少业务上限。测试可以提交固定少量任务，服务端持续流量则必须另设容量与拒绝边界。
:::

## 四、调度与工作窃取

### 1. 周期任务

`scheduleAtFixedRate` 按计划频率安排，`scheduleWithFixedDelay` 从上一次结束计算间隔。同一周期任务的连续执行不会因前一次变慢就自动重叠，但延迟或积压仍需要观察。

周期任务抛出未处理异常后，后续执行会被抑制。下方完整测试让第一次刷新失败，通过返回的 Future 读取异常，并确认调用次数为 1。继续调度还是停止应由业务策略决定，不能只捕获后静默忽略。

### 2. ForkJoinPool

Fork/Join 适合可拆分、可合并的计算任务。工作窃取让空闲工作线程从其他任务队列取得工作，减少固定分区负载不均；它不能保证任意阻塞调用都有足够补偿线程。

下方的 `OrderSum` 将区间递归拆分，小区间直接计算；先 `fork` 一半，在当前工作线程计算另一半，最后 `join` 汇合。`ExecutionContractTest#forkJoinCombinesRanges` 在独立两线程池中得到 `1..100` 的总和 `5050`。

公共池会被并行流和部分异步 API 共用，任务阻塞或过量计算可能影响其他调用。显式选择执行器有助于容量与故障归属，但不意味着需要为每个小任务创建一个新池。


## 五、关闭与终止

`shutdown()` 拒绝新任务并继续已有任务；`shutdownNow()` 尝试中断执行中的任务，返回尚未开始的任务，不能强制终止任意代码。返回的未执行任务若关联 Future，也需要按调用契约完成或取消。

通常先停止提交，再 `shutdown` 并限时等待，超时后请求取消、再次等待并记录未退出任务。Java 21 的 `ExecutorService.close()` 可以用于 try-with-resources，但会等待任务结束，不能把它当作天然有业务时限的清理。

测试辅助方法 `TestTasks.stop` 对自己创建的执行器执行中断与终止断言，不能用于随意关闭公共池或其他组件拥有的执行器。

## 六、执行与证据

使用 JDK 21，在本篇新建的示例目录运行线程池、Future、调度和 Fork/Join 四项测试：

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

将以下内容保存为 `src/main/java/order/concurrent/OrderSum.java`：

::: details 查看 OrderSum.java 完整内容

```java [src/main/java/order/concurrent/OrderSum.java]
package order.concurrent;

import java.util.concurrent.RecursiveTask;

/** 将独立整数区间拆分为 Fork/Join 任务，验证工作分解与结果汇合。 */
public final class OrderSum extends RecursiveTask<Integer> {
    private static final long serialVersionUID = 1L;
    private final int first;
    private final int last;

    /**
     * 创建受控的小范围求和任务。
     * @param first 闭区间起点，必须为正数
     * @param last 闭区间终点，不小于起点且不超过 10000
     */
    public OrderSum(int first, int last) {
        if (first < 1 || last < first || last > 10_000) {
            throw new IllegalArgumentException("invalid range");
        }
        this.first = first;
        this.last = last;
    }

    /** 返回区间内整数之和；小区间直接计算，大区间拆分后汇合。 */
    @Override
    protected Integer compute() {
        if (last - first < 16) {
            int total = 0;
            for (int value = first; value <= last; value++) {
                total += value;
            }
            return total;
        }
        int middle = (first + last) / 2;
        var left = new OrderSum(first, middle);
        left.fork();
        int right = new OrderSum(middle + 1, last).compute();
        return right + left.join();
    }
}
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
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

/** 验证执行器边界、上下文复用、异步取消和 Java 21 虚拟线程。 */
@Timeout(10)
class ExecutionContractTest {
    /** 一条工作线程和一格队列占满后拒绝第三项，并验证取消与终止。 */
    @Test
    void boundedPoolRejectsAndTerminates() throws Exception {
        var executor = new ThreadPoolExecutor(1, 1, 0, TimeUnit.MILLISECONDS,
                new ArrayBlockingQueue<>(1), Thread.ofPlatform().name("order-pool-", 0).factory(),
                new ThreadPoolExecutor.AbortPolicy());
        var running = new CountDownLatch(1);
        var gate = new CountDownLatch(1);
        var stopped = new CountDownLatch(1);
        try {
            var first = executor.submit(/* 通过闭锁保持工作线程占用，支持中断退出。 */ () -> {
                running.countDown();
                try {
                    gate.await();
                    return "ORD-1001";
                } finally {
                    stopped.countDown();
                }
            });
            TestTasks.await(running);
            var queued = executor.submit(/* 第二项只占用队列，不会在取消前执行。 */ () -> "ORD-1002");
            assertEquals(1, executor.getQueue().size());
            assertThrows(RejectedExecutionException.class,
                    /* 第三项超过线程和队列容量，必须显式失败。 */
                    () -> executor.submit(/* 被拒绝的任务不应运行。 */ () -> "ORD-1003"));
            assertTrue(queued.cancel(false));
            assertTrue(first.cancel(true));
            TestTasks.await(stopped);
            executor.shutdown();
            assertTrue(executor.awaitTermination(2, TimeUnit.SECONDS));
        } finally {
            gate.countDown();
            TestTasks.stop(executor);
        }
    }

    /** submit 的失败通过 Future 观察，保留原始业务异常。 */
    @Test
    void futurePreservesTaskFailure() throws Exception {
        var executor = Executors.newSingleThreadExecutor();
        var original = new IllegalStateException("stock unavailable");
        try {
            var result = executor.submit(/* 故意失败以核验 Future 的异常通道。 */ () -> {
                throw original;
            });
            var failure = assertThrows(ExecutionException.class,
                    /* 获取结果时读取已保存的任务失败。 */ () -> TestTasks.result(result));
            assertSame(original, failure.getCause());
        } finally {
            TestTasks.stop(executor);
        }
    }

    /** 周期任务未处理的异常会停止该周期序列。 */
    @Test
    void scheduledFailureStopsSequence() throws Exception {
        var executor = Executors.newSingleThreadScheduledExecutor();
        var calls = new AtomicInteger();
        try {
            var periodic = executor.scheduleAtFixedRate(/* 首次执行失败，后续执行被抑制。 */ () -> {
                calls.incrementAndGet();
                throw new IllegalStateException("refresh rejected");
            }, 0, 10, TimeUnit.MILLISECONDS);
            assertThrows(ExecutionException.class,
                    /* 读取周期任务终止原因，而非只看线程仍存活。 */ () -> TestTasks.result(periodic));
            assertEquals(1, calls.get());
            assertTrue(periodic.isDone());
        } finally {
            TestTasks.stop(executor);
        }
    }

    /** 独立 ForkJoinPool 执行拆分求和，不占用公共池。 */
    @Test
    void forkJoinCombinesRanges() throws Exception {
        var executor = new ForkJoinPool(2);
        try {
            assertEquals(5050, TestTasks.result(executor.submit(new OrderSum(1, 100))));
        } finally {
            TestTasks.stop(executor);
        }
    }
}
```

:::

```powershell

mvn -ntp -f pom.xml test "-Dtest=ExecutionContractTest#boundedPoolRejectsAndTerminates+futurePreservesTaskFailure+scheduledFailureStopsSequence+forkJoinCombinesRanges"
```

| 场景 | 预期证据 |
|------|----------|
| 一项运行、一项排队后再提交 | 第三项抛出 `RejectedExecutionException` |
| 取消运行项和排队项 | 运行项退出，线程池在期限内终止 |
| 任务抛业务异常 | `ExecutionException` 保留同一 cause |
| 周期首次失败 | 执行一次后序列结束 |
| 分治计算 | 返回 `5050` |

报告应为 4 项通过。实际服务还应观察提交、完成、拒绝、排队和执行时间，以及任务异常与取消结果，不能只看活跃线程数或平均延迟。

## 七、参考资料

- [ExecutorService](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html)
- [ThreadPoolExecutor](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html)
- [周期调度](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ScheduledExecutorService.html)
- [ForkJoinPool](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ForkJoinPool.html)

以上资料定义任务与生命周期契约。
