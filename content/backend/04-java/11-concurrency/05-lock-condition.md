---
title: "Lock 与 Condition"
tags: [Java, Lock, Condition]
excerpt: "说明显式锁的超时、可中断获取与 finally 释放，通过单槽订单通道解释独立条件队列，并验证等待取消后锁仍可用，明确读写锁和乐观读的成本。"
date: 2026-09-10
---


# Lock 与 Condition

`Lock` 提供显式的加锁与释放协议，`ReentrantLock` 还支持超时尝试、可中断获取和多个条件队列。获得这些能力的同时，代码必须在所有退出路径正确释放已经取得的锁。


## 一、加锁与所有权


### 1. 获取方式

| API | 行为 | 失败或取消 |
|-----|------|------------|
| `lock()` | 等待直到获得锁 | 获取过程不因中断直接抛出异常 |
| `lockInterruptibly()` | 可中断地等待锁 | 抛出 `InterruptedException` |
| `tryLock()` | 立即尝试 | 失败返回 `false` |
| `tryLock(timeout, unit)` | 有界等待 | 超时返回 `false`，可响应中断 |

`ReentrantLock` 支持同线程重入，每次成功获取都要对应释放。公平选项影响竞争策略，但不保证操作系统调度公平；无参数 `tryLock()` 也不遵循同样的排队公平策略。

### 2. finally 释放

加锁成功后才进入保护 `unlock()` 的 `try/finally`。如果把未成功获取的路径也放入无条件解锁逻辑，会因不拥有锁而失败。

```java
lock.lockInterruptibly();
try {
    updateState();
} finally {
    lock.unlock();
}
```

这是局部模式，`updateState` 表示受当前锁保护的业务操作。超时获取失败时要明确返回过载、取消或重试结果，不能静默丢弃必须执行的业务。


## 二、独立条件队列

`Condition` 绑定到一个锁，等待者必须先持有该锁。`await` 释放关联锁，返回前重新获得；`signal` 只是通知等待者继续竞争，不能代替修改业务状态。

一个单槽订单通道有两类条件：消费者等待“非空”，生产者等待“未满”。同一 `ReentrantLock` 可以创建两个 `Condition`，让两类等待各有队列，并继续用 `while` 检查条件。

| 操作 | 等待条件 | 修改后通知 |
|------|----------|------------|
| 放入订单 | 槽位已有订单时等 `notFull` | 通知 `notEmpty` |
| 取出订单 | 槽位为空时等 `notEmpty` | 通知 `notFull` |

::: warning 条件成立仍需重新检查
虚假唤醒和竞争者先取得资源都可能改变条件。将 `while` 改成 `if`，会让刚被唤醒的线程在不满足前提时继续操作。
:::

## 三、订单通道实现

下方的 `src/main/java/order/concurrent/OrderChannel.java` 包含完整放入和取出方法。下面展示取出逻辑，省略字段和 `put`；`order`、两个条件均由同一个 `lock` 保护。

::: details 查看条件等待与取出方法

```java
/**
 * 等待订单并清空槽位，通知生产者可以继续放入。
 * @return 被取出的非空订单编号
 * @throws InterruptedException 获取锁或等待订单被中断时抛出
 */
public String take() throws InterruptedException {
    lock.lockInterruptibly();
    try {
        while (order == null) {
            notEmpty.await();
        }
        String result = order;
        order = null;
        notFull.signal();
        return result;
    } finally {
        lock.unlock();
    }
}
```

:::

`put` 使用相反条件：等待槽位清空后写入编号，再通知消费者。此实现用于解释条件协议，常规生产消费需求优先使用现成的 `BlockingQueue`，避免重复维护队列细节。

需要业务截止时间时，可通过限时获取及 `awaitNanos` 等方法传递剩余预算。每次唤醒后重新使用完整超时，会让一次请求的总等待超过原预算。

## 四、取消与恢复验证

使用 JDK 21，在本篇新建的示例目录运行以下三项测试：

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

将以下内容保存为 `src/main/java/order/concurrent/OrderChannel.java`：

::: details 查看 OrderChannel.java 完整内容

```java [src/main/java/order/concurrent/OrderChannel.java]
package order.concurrent;

import java.util.Objects;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

/** 用两个条件队列解释单槽订单通道；实际项目可直接选择 BlockingQueue。 */
public final class OrderChannel {
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notEmpty = lock.newCondition();
    private final Condition notFull = lock.newCondition();
    private String order;

    /**
     * 等待空槽后放入订单，发布后通知消费者，无返回值。
     * @param orderNumber 非空订单编号
     * @throws InterruptedException 获取锁或等待空槽被中断时抛出
     */
    public void put(String orderNumber) throws InterruptedException {
        Objects.requireNonNull(orderNumber);
        lock.lockInterruptibly();
        try {
            while (order != null) {
                notFull.await();
            }
            order = orderNumber;
            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }

    /**
     * 等待订单并清空槽位，通知生产者可继续放入。
     * @return 被取出的非空订单编号
     * @throws InterruptedException 获取锁或等待订单被中断时抛出
     */
    public String take() throws InterruptedException {
        lock.lockInterruptibly();
        try {
            while (order == null) {
                notEmpty.await();
            }
            String result = order;
            order = null;
            notFull.signal();
            return result;
        } finally {
            lock.unlock();
        }
    }
}
```

:::

将以下内容保存为 `src/test/java/order/concurrent/TestTasks.java`：

::: details 查看 TestTasks.java 完整内容

```java [src/test/java/order/concurrent/TestTasks.java]
package order.concurrent;

import static org.junit.jupiter.api.Assertions.*;
import java.time.Duration;
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
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.ReentrantLock;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

/** 受控交错展示错误，并用 API 契约解释修复；有限测试不是并发证明。 */
@Timeout(10)
class StateContractTest {

    /** 两个 Condition 传递订单，并在取消等待后保持锁可再次使用。 */
    @Test
    void conditionTransfersAndCancels() throws Exception {
        var channel = new OrderChannel();
        var executor = Executors.newSingleThreadExecutor();
        var waiting = new CountDownLatch(1);
        var cancelled = new CountDownLatch(1);
        try {
            var first = executor.submit(/* 消费者等待一个实际订单。 */ channel::take);
            channel.put("ORD-1001");
            assertEquals("ORD-1001", TestTasks.result(first));
            var second = executor.submit(/* 等待取消后在 finally 中通知测试线程。 */ () -> {
                waiting.countDown();
                try {
                    return channel.take();
                } finally {
                    cancelled.countDown();
                }
            });
            TestTasks.await(waiting);
            assertTrue(second.cancel(true));
            TestTasks.await(cancelled);
            channel.put("ORD-1002");
            assertEquals("ORD-1002", channel.take());
        } finally {
            TestTasks.stop(executor);
        }
    }

    /** timed tryLock 超时后没有锁所有权，不能无条件 unlock。 */
    @Test
    void timedLockDoesNotAcquire() throws Exception {
        var lock = new ReentrantLock();
        var executor = Executors.newSingleThreadExecutor();
        lock.lock();
        try {
            var task = executor.submit(/* 当前线程持锁时，其他线程只等待有限时间。 */ () -> {
                boolean acquired = lock.tryLock(30, TimeUnit.MILLISECONDS);
                if (acquired) {
                    lock.unlock();
                }
                return acquired;
            });
            assertFalse(TestTasks.result(task));
        } finally {
            lock.unlock();
            TestTasks.stop(executor);
        }
    }

    /** 可中断获取让等待锁的线程在持有者释放之前退出。 */
    @Test
    void interruptibleLockCancels() throws Exception {
        var lock = new ReentrantLock();
        var cancelled = new AtomicBoolean();
        var worker = new Thread(/* 获取失败时不拥有锁，因此不能 unlock。 */ () -> {
            try {
                lock.lockInterruptibly();
                try {
                    fail("lock must remain held by test");
                } finally {
                    lock.unlock();
                }
            } catch (InterruptedException failure) {
                cancelled.set(true);
                Thread.currentThread().interrupt();
            }
        }, "order-lock-waiter");
        lock.lock();
        try {
            worker.start();
            TestTasks.state(worker, Thread.State.WAITING);
            TestTasks.stopThread(worker);
            assertTrue(cancelled.get());
        } finally {
            lock.unlock();
            TestTasks.stopThread(worker);
        }
    }
}
```

:::

```powershell

mvn -ntp -f pom.xml test "-Dtest=StateContractTest#conditionTransfersAndCancels+timedLockDoesNotAcquire+interruptibleLockCancels"
```

| 场景 | 预期结果 |
|------|----------|
| 等待订单后放入 `ORD-1001` | 消费者取得该编号 |
| 取消等待中的消费者 | 任务退出；后续 `put/take` 仍可处理 `ORD-1002` |
| 另一线程持锁，限时获取 | 返回 `false`，没有锁所有权 |
| 持有者尚未释放，等待线程被中断 | `lockInterruptibly` 退出并恢复中断标记 |

报告应为 3 项通过。取消后再执行通道操作，是检验 `finally` 已正确释放锁的实际证据；仅观察 Future 进入取消状态还不够。


## 五、读写与乐观读取

`ReentrantReadWriteLock` 允许多个读者同时持有读锁，写入需要独占。它适合读多、临界区足够长且测量有收益的状态；持读锁直接升级到写锁存在等待风险，通常需释放、重新获取并重新检查条件。

`StampedLock` 的乐观读先读取字段，再验证 stamp；验证失败应退回受读锁保护的读取。它不可重入，乐观读取过程中也不能使用尚未验证的组合状态执行不可逆操作。

多锁协作需要统一获取顺序，避免持锁调用不受控外部代码。超时可以让等待有界，但仍需处理失败后的状态与重试，不会自动修复错误的锁结构。

## 六、参考资料

- [Lock](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/Lock.html)
- [Condition](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/Condition.html)
- [StampedLock](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/StampedLock.html)

以上资料分别定义获取、等待和乐观验证的契约。
