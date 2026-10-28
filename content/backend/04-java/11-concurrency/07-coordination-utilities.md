---
title: "并发协调工具"
tags: [Java, CountDownLatch, Semaphore, Phaser]
excerpt: "区分一次性完成、循环屏障、动态阶段与资源许可，通过任务失败、屏障破损和许可超时验证生命周期，说明完成信号、成功结果与资源所有权的区别。"
date: 2026-09-10
---


# 并发协调工具

并发协调工具表达任务之间的等待、会合和资源容量。选择时先确定生命周期：等待一批任务结束、反复完成阶段，还是限制同时进入某个下游的任务数，不能把这些需求都套成同一种计数器。


## 一、完成与阶段


### 1. CountDownLatch

`CountDownLatch` 的计数只能减少，减到零后持续开放，不能重置。它适合等待初始化完成或固定数量任务结束，`await(timeout, unit)` 可以限制等待时间。

每个任务应在拥有完成责任的 `finally` 中 `countDown()`，避免异常路径遗漏信号。但闭锁打开只说明信号已到齐，不能证明每项业务成功；仍需读取各自结果或异常。

```java
try {
    return calculateOrder();
} finally {
    done.countDown();
}
```

这是局部任务模式，`calculateOrder` 表示当前任务。下方完整测试实际提交一项返回 `10` 的任务和一项抛出异常的任务，闭锁照常打开，而第二个 Future 仍然失败。


### 2. CyclicBarrier

`CyclicBarrier` 让固定数量参与者在阶段点会合，成功推进后可复用到下一轮。屏障动作在一轮全部到齐后执行，适合汇总已经准备好的阶段数据。

某个等待者超时或中断、屏障动作失败等情况可以使屏障进入 broken 状态，其他等待者不能当作正常阶段继续。任意业务代码抛出异常却根本没有到达屏障时，也不保证自动唤醒其他参与者，协调方还需取消或重置整组。

::: warning 破损是整组协议失败
`BrokenBarrierException` 不是当前线程独自重试一次就能修复的错误。需要确认参与者、阶段数据和取消状态，避免部分线程推进、部分线程仍停留在旧阶段。
:::


## 二、资源许可


### 1. Semaphore

`Semaphore` 表达可用许可数，没有与 `Lock` 相同的线程所有权约束。它适合数据库或外部接口并发上限，但许可是否正确借还仍由应用保证。

```java
permits.acquire();
try {
    callDownstream();
} finally {
    permits.release();
}
```

局部模式中的 `callDownstream` 表示受许可限制的操作。只有获取成功后才进入释放边界；获取时被中断或 `tryAcquire` 返回 `false`，都不应额外释放许可，否则实际容量会越过配置上限。


### 2. 超时与总预算

许可等待、下游请求与结果处理共享一个截止时间。每次重试重新获得完整等待时长，会让请求持续时间失控；失败后要明确拒绝、取消或有界重试。

公平许可倾向按等待顺序授予，但不保证线程调度绝对公平。容量来自真实下游约束，而不是 Java 线程越多就配置越多许可。


## 三、动态阶段

`Phaser` 支持参与者在执行过程中注册和注销。阶段推进取决于当前注册参与者都到达；结束任务必须按协议注销，否则其他任务可能一直等待已经不存在的参与者。

下方完整测试保留协调者并动态注册一个工作者，双方完成一轮后注销。下面是工作者的局部逻辑：

```java
var worker = executor.submit(/* 完成一轮后注销，不遗留参与者计数。 */ () -> {
    int advanced = phaser.arriveAndAwaitAdvance();
    phaser.arriveAndDeregister();
    return advanced;
});
```

`arriveAndAwaitAdvance` 与可中断、有时限的 `awaitAdvanceInterruptibly` 具有不同等待契约。测试协调方使用后者控制预算，并在清理时 `forceTermination`，避免失败路径留下阶段等待。


## 四、选择依据

| 需求 | 选择起点 | 生命周期限制 |
|------|----------|--------------|
| 等待 N 次完成 | `CountDownLatch` | 一次性开放，不保存任务结果 |
| 固定参与者多轮会合 | `CyclicBarrier` | 需要处理整组破损 |
| 动态参与者、多阶段 | `Phaser` | 注册和注销必须平衡 |
| 限制下游同时访问数 | `Semaphore` | 只释放已获取许可 |
| 两个参与者交换数据 | `Exchanger` | 需要双方会合，超时与取消仍要处理 |

工具提供的内存一致性关系可以用于传递阶段前的结果，但不会保护与协议无关的共享写入。共享对象的其他访问仍要遵守锁、不可变或原子更新规则。

## 五、受控验证

下方的 `CoordinationContractTest` 位于 `src/test/java/order/concurrent/`。使用 JDK 21 执行四项测试：

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

将以下内容保存为 `src/test/java/order/concurrent/CoordinationContractTest.java`：

::: details 查看 CoordinationContractTest.java 完整内容

```java [src/test/java/order/concurrent/CoordinationContractTest.java]
package order.concurrent;

import static org.junit.jupiter.api.Assertions.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

/** 验证等待、阶段、许可与容器的不同契约，并回收所有测试执行器。 */
@Timeout(10)
class CoordinationContractTest {
    /** 闭锁表示完成信号，不代替各任务的成功或失败结果。 */
    @Test
    void latchCountsFailureAsFinished() throws Exception {
        var done = new CountDownLatch(2);
        var executor = Executors.newFixedThreadPool(2);
        try {
            var first = executor.submit(/* 成功与失败均在 finally 中发出完成信号。 */ () -> {
                try {
                    return 10;
                } finally {
                    done.countDown();
                }
            });
            var second = executor.submit(/* 使用受控失败，验证完成不等于成功。 */ () -> {
                try {
                    throw new IllegalStateException("order rejected");
                } finally {
                    done.countDown();
                }
            });
            TestTasks.await(done);
            assertEquals(10, TestTasks.result(first));
            assertThrows(ExecutionException.class,
                    /* 通过 Future 保留并观察任务失败。 */ () -> TestTasks.result(second));
        } finally {
            TestTasks.stop(executor);
        }
    }

    /** 固定参与者完成两轮屏障，超时后的屏障则进入破损状态。 */
    @Test
    void barrierRepeatsAndBreaks() throws Exception {
        var rounds = new AtomicInteger();
        var barrier = new CyclicBarrier(2,
                /* 每轮全部到达后，只增加一次阶段计数。 */ rounds::incrementAndGet);
        var executor = Executors.newFixedThreadPool(2);
        try {
            Callable<Void> participant = /* 两个参与者遵守同一阶段协议。 */ () -> {
                barrier.await(2, TimeUnit.SECONDS);
                barrier.await(2, TimeUnit.SECONDS);
                return null;
            };
            var first = executor.submit(participant);
            var second = executor.submit(participant);
            TestTasks.result(first);
            TestTasks.result(second);
            assertEquals(2, rounds.get());
        } finally {
            barrier.reset();
            TestTasks.stop(executor);
        }
        var broken = new CyclicBarrier(2);
        assertThrows(TimeoutException.class,
                /* 缺少第二个参与者时，当前屏障应有界失败。 */
                () -> broken.await(20, TimeUnit.MILLISECONDS));
        assertTrue(broken.isBroken());
        assertThrows(BrokenBarrierException.class,
                /* 破损屏障不能继续当作成功阶段。 */ broken::await);
    }

    /** 动态注册参与者，并在结束时注销使 Phaser 终止。 */
    @Test
    void phaserTracksParticipants() throws Exception {
        var phaser = new Phaser(1);
        var executor = Executors.newSingleThreadExecutor();
        phaser.register();
        try {
            var worker = executor.submit(/* 参与一个阶段后注销，不遗留注册数。 */ () -> {
                int advanced = phaser.arriveAndAwaitAdvance();
                phaser.arriveAndDeregister();
                return advanced;
            });
            int phase = phaser.arrive();
            assertTrue(phaser.awaitAdvanceInterruptibly(phase, 2, TimeUnit.SECONDS) > phase);
            assertTrue(TestTasks.result(worker) > phase);
            phaser.arriveAndDeregister();
            assertTrue(phaser.isTerminated());
        } finally {
            phaser.forceTermination();
            TestTasks.stop(executor);
        }
    }

    /** 没有获得许可时不释放，防止超时分支人为增加容量。 */
    @Test
    void semaphorePreservesCapacity() throws Exception {
        var permits = new Semaphore(1);
        permits.acquire();
        try {
            boolean acquired = permits.tryAcquire(20, TimeUnit.MILLISECONDS);
            assertFalse(acquired);
            if (acquired) {
                permits.release();
            }
            assertEquals(0, permits.availablePermits());
        } finally {
            permits.release();
        }
        assertEquals(1, permits.availablePermits());
    }
}
```

:::

```powershell

mvn -ntp -f pom.xml test "-Dtest=CoordinationContractTest#latchCountsFailureAsFinished+barrierRepeatsAndBreaks+phaserTracksParticipants+semaphorePreservesCapacity"
```

| 测试 | 预期证据 |
|------|----------|
| 闭锁与任务失败 | 闭锁打开，一项 Future 返回 10，另一项抛出 `ExecutionException` |
| 屏障复用和破损 | 成功推进两轮；缺少参与者后超时，后续等待抛出破损异常 |
| 动态阶段 | 注册者完成并注销后 Phaser 终止 |
| 许可超时 | 未获取时不增加许可，持有者释放后恢复为 1 |

报告应为 4 项通过。所有执行器有终止检查，屏障和阶段在失败清理中解除等待；没有用固定休眠猜测参与者是否已准备好。

## 六、参考资料

- [CountDownLatch](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CountDownLatch.html)
- [CyclicBarrier](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CyclicBarrier.html)
- [Semaphore](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Semaphore.html)
- [Phaser](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Phaser.html)

以上资料定义各自的阶段与失败契约。
