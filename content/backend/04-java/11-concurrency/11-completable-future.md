---
title: "CompletableFuture 异步组合"
tags: [Java, CompletableFuture, 并发]
excerpt: "根据结果依赖组合异步阶段，区分转换、展平和汇合，验证订单金额、异常根因与超时取消，明确阶段完成、底层任务停止及执行器选择的不同责任。"
date: 2026-09-10
---


# CompletableFuture 异步组合

`CompletableFuture` 同时表示一个可完成结果和一组可组合阶段。它用结果依赖表达异步流程，但不会自动管理所有底层任务的取消、下游容量和资源生命周期。


## 一、阶段依赖

| 关系 | API | 结果形态 |
|------|-----|----------|
| 转换一个结果 | `thenApply` | 将 T 转成 U |
| 消费结果 | `thenAccept` | 完成后没有业务返回值 |
| 只等待前段成功 | `thenRun` | 不读取前段值 |
| 结果决定另一个异步步骤 | `thenCompose` | 展平回调返回的阶段 |
| 两个结果合并 | `thenCombine` | 等两者成功后计算新值 |
| 等一组结果结束 | `allOf` | 返回 Void，仍从各原阶段读取值 |
| 任意一个先结束 | `anyOf` | 包含正常或异常完成，不取消其余阶段 |

回调返回另一个 Future 时，`thenApply` 会得到嵌套结果，`thenCompose` 才表达继续等待该异步步骤。不要在回调内部对同池子任务调用阻塞 `join()` 来模拟这种依赖。

`allOf` 等待全部阶段完成，不是遇到一个失败就自动停止其他任务。失败如何收集、剩余任务是否继续以及是否需要取消，应在业务边界明确决定。


## 二、执行线程

`supplyAsync` 执行有结果的任务，`runAsync` 执行无结果任务。未显式提供执行器的异步方法通常使用 `ForkJoinPool.commonPool()`；公共池并行度不足时还存在按任务创建线程的回退，不应依赖固定线程名称。

非 Async 回调可能由完成前段的线程执行，也可能由注册回调的线程执行。Async 变体通过指定或默认执行器调度，但不会自动继承调用方的 ThreadLocal 上下文。

耗时和阻塞操作应明确执行器及容量，短小纯转换可以直接沿完成线程执行。每个步骤都加 Async 会增加调度成本，也不代表整个流程更快。


## 三、订单金额组合

下方的 `ExecutionContractTest#completionStagesCompose` 分别获取单价 `1990` 分和数量 `2`，合并后增加第二件商品 `990` 分，最终格式化为 `total=4970`。

以下是测试中的主要组合，`executor` 为当前测试创建并最终关闭的两线程执行器：

```java
var price = CompletableFuture.supplyAsync(/* 固定单价，单位分。 */ () -> 1990, executor);
var quantity = CompletableFuture.supplyAsync(/* 当前订单购买数量。 */ () -> 2, executor);
var total = price.thenCombine(quantity,
        /* 单价乘数量得到金额，溢出时失败，不执行外部副作用。 */ Math::multiplyExact)
        .thenCompose(/* 依赖已有金额，继续返回一个结果阶段。 */
                amount -> CompletableFuture.completedFuture(Math.addExact(amount, 990)))
        .thenApplyAsync(/* 指定执行器进行结果格式转换。 */
                amount -> "total=" + amount, executor);
assertEquals("total=4970", TestTasks.result(total));
```

这里用固定值隔离阶段语义，未模拟网络延迟，也没有证明并行会比顺序计算更快。真实查询需要各自的客户端超时和数据契约，不能只复制最外层 Future 链。


## 四、异常传播

### 1. 获取与观察

`get` 通常以受检的 `ExecutionException` 包装任务失败，`join` 通常以 `CompletionException` 包装，取消还可能直接表现为 `CancellationException`。定位业务错误需要读取 cause，而不是只记录外层包装类型。

下方完整测试构造一个已失败阶段，验证 `join` 保留同一个 `IllegalStateException` 根因。回调异常也会影响后续阶段，必须在最终调用边界收集结果。

### 2. 恢复方式

| API | 触发与用途 | 需要注意 |
|-----|------------|----------|
| `exceptionally` | 失败时返回替代结果 | 只用于业务允许的降级 |
| `handle` | 同时检查结果与异常并转换 | 不应把所有故障都改成正常空值 |
| `whenComplete` | 观察结果或记录指标 | 回调自身抛出异常也可能影响返回阶段 |

没有合法库存结果时，随意返回 0 可能把依赖故障伪装成库存不足。是否降级是业务决定，错误分类和根因仍应保留。


## 五、超时与取消

### 1. 阶段状态

`orTimeout` 在未按时完成时使当前 Future 异常完成，`completeOnTimeout` 则用默认值完成；它们返回同一个 Future，并不只是给一次 `get` 增加等待上限。

`CompletableFuture.cancel(true)` 使阶段进入取消状态，但参数 `true` 不会使该类自动中断底层工作。它与普通执行器返回的 Future 取消机制不能直接等同。


### 2. 底层工作

下方完整测试让 Supplier 已经启动并等待闭锁，然后分别使阶段超时或取消。调用方已观察到结束结果，工作任务仍未退出；只有测试显式放行后，它才完成。

::: warning 超时后仍需管理资源
数据库查询、HTTP 请求或工作线程可能继续占用资源。需要底层取消支持、客户端超时和统一清理协议；退出外层 Future 链不等于这些工作自动停止。
:::

## 六、执行与观察

使用 JDK 21，在本篇新建的示例目录运行组合、超时和取消三项测试：

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
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

/** 验证执行器边界、上下文复用、异步取消和 Java 21 虚拟线程。 */
@Timeout(10)
class ExecutionContractTest {

    /** 独立结果先合并，再组合依赖阶段，最终金额单位为分。 */
    @Test
    void completionStagesCompose() throws Exception {
        var executor = Executors.newFixedThreadPool(2);
        try {
            var price = CompletableFuture.supplyAsync(/* 固定订单商品单价，单位分。 */ () -> 1990, executor);
            var quantity = CompletableFuture.supplyAsync(/* 同一订单的购买数量。 */ () -> 2, executor);
            var total = price.thenCombine(quantity,
                    /* 单价和数量进行受溢出检查的乘法，无外部副作用。 */ Math::multiplyExact)
                    .thenCompose(/* 增加第二件商品，返回一个依赖阶段。 */
                            amount -> CompletableFuture.completedFuture(Math.addExact(amount, 990)))
                    .thenApplyAsync(/* 显式选择执行器进行非阻塞结果转换。 */ amount -> "total=" + amount, executor);
            assertEquals("total=4970", TestTasks.result(total));
            var original = new IllegalStateException("stock unavailable");
            var failure = assertThrows(CompletionException.class,
                    /* 已失败的阶段在 join 时保留 cause。 */
                    () -> CompletableFuture.failedFuture(original).join());
            assertSame(original, failure.getCause());
        } finally {
            TestTasks.stop(executor);
        }
    }

    /** orTimeout 只使阶段失败，不负责中断已启动的 Supplier。 */
    @Test
    void completionTimeoutDoesNotStopWork() throws Exception {
        completionWithoutInterruption(false);
    }

    /** CompletableFuture.cancel(true) 中的 true 不会中断其底层工作。 */
    @Test
    void completionCancellationDoesNotInterrupt() throws Exception {
        completionWithoutInterruption(true);
    }

    /**
     * 比较阶段结束与底层任务结束，最后显式放行并回收工作线程。
     * @param cancel true 使用 cancel，false 使用 orTimeout
     * @throws Exception 任务、断言或清理失败时抛出
     */
    private static void completionWithoutInterruption(boolean cancel) throws Exception {
        var executor = Executors.newSingleThreadExecutor();
        var started = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        var finished = new CountDownLatch(1);
        var interrupted = new AtomicBoolean();
        try {
            var future = CompletableFuture.supplyAsync(/* 阶段结束后仍在等待业务放行。 */ () -> {
                started.countDown();
                try {
                    release.await();
                    return 4970;
                } catch (InterruptedException failure) {
                    interrupted.set(true);
                    Thread.currentThread().interrupt();
                    throw new CompletionException(failure);
                } finally {
                    finished.countDown();
                }
            }, executor);
            TestTasks.await(started);
            if (cancel) {
                assertTrue(future.cancel(true));
                assertThrows(CancellationException.class,
                        /* 取消的是阶段状态，调用方立即观察取消结果。 */ () -> TestTasks.result(future));
            } else {
                future.orTimeout(20, TimeUnit.MILLISECONDS);
                var failure = assertThrows(ExecutionException.class,
                        /* 超时阶段通过 Future.get 包装 TimeoutException。 */ () -> TestTasks.result(future));
                assertInstanceOf(TimeoutException.class, failure.getCause());
            }
            assertEquals(1, finished.getCount());
            assertFalse(interrupted.get());
            release.countDown();
            TestTasks.await(finished);
            assertFalse(interrupted.get());
        } finally {
            release.countDown();
            TestTasks.stop(executor);
        }
    }
}
```

:::

```powershell

mvn -ntp -f pom.xml test "-Dtest=ExecutionContractTest#completionStagesCompose+completionTimeoutDoesNotStopWork+completionCancellationDoesNotInterrupt"
```

| 场景 | 预期结果 |
|------|----------|
| 独立结果合并，再组合依赖阶段 | `total=4970` |
| 已失败阶段调用 join | 包装异常保留原始 cause |
| 工作进行中阶段超时 | 调用方看到 TimeoutException 根因，工作仍等待 |
| 工作进行中 cancel(true) | 调用方看到取消，工作线程没有因此被中断 |
| 显式放行并清理 | 工作退出，执行器按期限终止 |

报告应为 3 项通过。测试先用闭锁确认任务已启动，再触发阶段结束，不以固定休眠猜测工作状态。

## 七、参考资料

- [CompletableFuture API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html)
- [CompletionStage 契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletionStage.html)

以上资料定义组合、执行器、异常与取消边界。
