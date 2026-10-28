---
title: "原子类与 CAS"
tags: [Java, Atomic, CAS]
excerpt: "用库存条件更新解释 CAS 的成功点和失败重试，区分原子引用、版本戳与统计计数，通过超额申请和 ABA 对照验证边界，避免在重试函数中产生外部副作用。"
date: 2026-09-10
---


# 原子类与 CAS

原子类为单个变量提供不可分割的读写或条件更新。CAS（compare-and-set）仅在当前值符合预期时写入新值，用于把“旧值仍有效”与“执行修改”连接成一次原子操作。


## 一、单变量更新

| 需求 | 常用 API | 返回与边界 |
|------|----------|------------|
| 整数计数 | `AtomicInteger`、`AtomicLong` | 原子加减，仍要考虑数值溢出 |
| 状态切换 | `AtomicBoolean`、`AtomicReference` | 条件替换一个值或引用 |
| 读取旧值再加一 | `getAndIncrement` | 返回更新前的值 |
| 加一并读取新值 | `incrementAndGet` | 返回更新后的值 |
| 按函数更新 | `updateAndGet` | 函数可能因竞争被重复调用 |

先 `get()` 判断再 `set()` 写入，仍是两个动作。需要旧值参与判断时，应使用原子复合 API 或 CAS 循环；两个不同 Atomic 字段也不会自动组成一个原子业务状态。


## 二、库存 CAS 循环

### 1. 成功与重试

读取库存后先检查数量，再尝试从旧值改为新值。若其他线程已经修改库存，CAS 失败，必须重新读取并重新计算，不能继续使用失效快照。

下方的 `AtomicStock.reserve` 的完整方法如下，`available` 为 `AtomicInteger`，构造器保证初始库存非负。保存位置为 `src/main/java/order/concurrent/AtomicStock.java`。

::: details 查看库存 CAS 申请方法

```java
/**
 * 库存足够且旧值仍有效时扣减，重试不执行外部副作用。
 * @param quantity 请求的正数数量
 * @return 成功扣减为 true，库存不足为 false
 */
public boolean reserve(int quantity) {
    if (quantity <= 0) {
        throw new IllegalArgumentException("quantity must be positive");
    }
    while (true) {
        int current = available.get();
        if (current < quantity) {
            return false;
        }
        if (available.compareAndSet(current, current - quantity)) {
            return true;
        }
    }
}
```

:::

CAS 成功是这次扣减对外生效的关键点。所有申请都使用该协议，旧值不足时返回失败，成功值不会小于零；这一论证比仅观察某轮测试结果更重要。


### 2. 竞争与副作用

竞争越激烈，重复读取和 CAS 重试可能越多。没有显式阻塞锁不代表没有 CPU 成本，也不保证每个线程都在固定次数内成功。

更新函数中不能发送消息、扣款或写数据库，因为函数可能执行多次而最终只提交一次原子值。复杂多字段状态和外部副作用通常需要更明确的锁、事务或业务协议。


## 三、原子引用与 ABA

`AtomicReference` 原子替换引用，不自动保护引用对象内部的可变字段。多个字段需要一起更新时，可以把它们封装为不可变状态，再条件替换整个引用。

ABA 指一个值从 A 变为 B 又变回 A，普通 CAS 只看到当前仍为 A，无法知道中间发生了变化。如果算法依赖资源身份或修改历史，就可能误判。

下方完整测试的对照使用相同对象引用，并用版本戳记录变化：

```java
var stamped = new AtomicStampedReference<>(first, 0);
assertTrue(stamped.compareAndSet(first, second, 0, 1));
assertTrue(stamped.compareAndSet(second, first, 1, 2));
assertFalse(stamped.compareAndSet(first, second, 0, 3));
```

这里 `first` 与 `second` 是两个独立对象。最终引用虽然恢复为 `first`，版本已是 2，因此旧版本 0 的预期失败。版本戳也需要一致更新，不能让某些写入绕过协议。


## 四、统计计数与业务状态

`LongAdder` 将竞争分散到多个单元，在高竞争累加场景下可能提高吞吐，但并发中的 `sum()` 不是单一原子快照。它适合请求数等统计，不适合用“先 sum 再判断”实现库存限额。

当所有更新任务都已结束，测试再调用 `sum()` 可以验证最终总数；这与更新仍在进行时读取瞬时值不同。是否优于 `AtomicLong` 仍需根据写入竞争、读取频率和内存成本测量。

`LongAccumulator` 支持其他聚合运算，运算必须适合分段合并且无副作用。原子数组保证元素级操作，不能让跨多个下标的不变量自动原子化。

::: warning 工具的原子范围就是使用边界
单变量原子性不能扩展为多个对象、数据库记录或外部系统的原子性。必须先定义要保护的状态，再判断原子 API 是否覆盖完整操作。
:::

## 五、执行与结果

在 JDK 21 环境运行库存 CAS、ABA 和统计三个测试：

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

将以下内容保存为 `src/main/java/order/concurrent/AtomicStock.java`：

::: details 查看 AtomicStock.java 完整内容

```java [src/main/java/order/concurrent/AtomicStock.java]
package order.concurrent;

import java.util.concurrent.atomic.AtomicInteger;

/** 用 CAS 将库存检查和扣减连接成一次条件更新。 */
public final class AtomicStock {
    private final AtomicInteger available;

    /**
     * 创建非负库存状态。
     * @param initial 初始数量，必须大于或等于零
     */
    public AtomicStock(int initial) {
        if (initial < 0) {
            throw new IllegalArgumentException("negative stock");
        }
        available = new AtomicInteger(initial);
    }

    /**
     * 仅在旧值仍有效且库存足够时扣减；重试不包含外部副作用。
     * @param quantity 需要扣减的正数
     * @return 扣减成功为 true，库存不足为 false
     */
    public boolean reserve(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("quantity must be positive");
        }
        while (true) {
            int current = available.get();
            if (current < quantity) {
                return false;
            }
            if (available.compareAndSet(current, current - quantity)) {
                return true;
            }
        }
    }

    /** 返回当前原子库存值，不承诺与其他变量组成一致快照。 */
    public int available() {
        return available.get();
    }
}
```

:::

将以下内容保存为 `src/test/java/order/concurrent/TestTasks.java`：

::: details 查看 TestTasks.java 完整内容

```java [src/test/java/order/concurrent/TestTasks.java]
package order.concurrent;

import static org.junit.jupiter.api.Assertions.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

/** 为并发教学测试统一提供有界等待和结束检查。 */
final class TestTasks {
    /** 禁止实例化测试工具。 */
    private TestTasks() { }

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
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.LongAdder;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

/** 验证等待、阶段、许可与容器的不同契约，并回收所有测试执行器。 */
@Timeout(10)
class CoordinationContractTest {

    /** 指定键的 merge 原子更新，LongAdder 在全部任务结束后汇总。 */
    @Test
    void concurrentMapAndAdderCount() throws Exception {
        var counts = new ConcurrentHashMap<String, Integer>();
        var completed = new LongAdder();
        var executor = Executors.newFixedThreadPool(4);
        try {
            List<Future<?>> tasks = new ArrayList<>();
            for (int index = 0; index < 200; index++) {
                tasks.add(executor.submit(/* 同一键使用容器复合 API，避免 get/put 竞态。 */ () -> {
                    counts.merge("PAID", 1,
                            /* 旧计数与新增计数仅做无副作用整数求和。 */ Integer::sum);
                    completed.increment();
                }));
            }
            for (var task : tasks) {
                TestTasks.result(task);
            }
            assertEquals(200, counts.get("PAID"));
            assertEquals(200, completed.sum());
        } finally {
            TestTasks.stop(executor);
        }
    }
}
```

:::

将以下内容保存为 `src/test/java/order/concurrent/StateContractTest.java`：

::: details 查看 StateContractTest.java 完整内容

```java [src/test/java/order/concurrent/StateContractTest.java]
package order.concurrent;

import static org.junit.jupiter.api.Assertions.*;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.function.BooleanSupplier;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

/** 受控交错展示错误，并用 API 契约解释修复；有限测试不是并发证明。 */
@Timeout(10)
class StateContractTest {

    /** CAS 在成功时原子地验证旧值并扣减，失败后重新计算。 */
    @Test
    void casProtectsStockInvariant() throws Exception {
        var stock = new AtomicStock(100);
        assertEquals(100, reservations(/* 共享 CAS 库存的受控申请。 */ () -> stock.reserve(1)));
        assertEquals(0, stock.available());
    }

    /** 引用恢复为 A 时普通 CAS 无法看到历史变化，版本戳能够拒绝旧预期。 */
    @Test
    void stampDetectsAba() {
        Object first = new Object();
        Object second = new Object();
        var plain = new AtomicReference<>(first);
        plain.set(second);
        plain.set(first);
        assertTrue(plain.compareAndSet(first, second));
        var stamped = new AtomicStampedReference<>(first, 0);
        assertTrue(stamped.compareAndSet(first, second, 0, 1));
        assertTrue(stamped.compareAndSet(second, first, 1, 2));
        assertFalse(stamped.compareAndSet(first, second, 0, 3));
    }

    /**
     * 提交固定 200 次申请并汇总结果，所有路径关闭执行器。
     * @param reserve 无参数线程安全申请函数，返回本次是否成功
     * @return 成功申请次数；不据此证明所有调度下的正确性
     * @throws Exception 任务、等待或清理失败时抛出
     */
    private static int reservations(BooleanSupplier reserve) throws Exception {
        var executor = Executors.newFixedThreadPool(4);
        try {
            List<Future<Boolean>> tasks = new ArrayList<>();
            for (int index = 0; index < 200; index++) {
                tasks.add(executor.submit(/* 将单次申请交给一个工作线程。 */ reserve::getAsBoolean));
            }
            int accepted = 0;
            for (var task : tasks) {
                if (TestTasks.result(task)) {
                    accepted++;
                }
            }
            return accepted;
        } finally {
            TestTasks.stop(executor);
        }
    }
}
```

:::

```powershell

mvn -ntp -f pom.xml test "-Dtest=StateContractTest#casProtectsStockInvariant+stampDetectsAba,CoordinationContractTest#concurrentMapAndAdderCount"
```

报告应为 3 项通过：库存 100 的 200 次申请恰好成功 100 次；普通引用 CAS 接受恢复后的 A，版本戳拒绝旧预期；全部 200 项统计任务结束后 `LongAdder.sum()` 为 200。

这些测试验证固定实现与受控边界，不提供性能排名，也不以未出现竞态代替内存模型和原子操作的契约。

## 六、参考资料

- [原子工具包](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/package-summary.html)
- [AtomicStampedReference](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicStampedReference.html)
- [LongAdder](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/LongAdder.html)

以上资料定义原子范围、版本比较及统计读取边界。
