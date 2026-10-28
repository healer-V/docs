---
title: "Java 内存模型与 volatile"
tags: [Java, JMM, volatile]
excerpt: "用 happens-before 解释线程间可见性与有序性，通过 volatile 发布普通字段和受控丢失更新对照其能力，说明 final 初始化、引用快照和复合原子性的边界。"
date: 2026-09-10
---


# Java 内存模型与 volatile

Java 内存模型（JMM）规定线程可以观察到哪些写入，以及同步操作建立的顺序约束。它讨论并发可见性与有序性，不是 JVM 的堆、栈或物理 CPU 缓存结构。


## 一、数据竞争与顺序

不同线程访问同一变量、至少有一次写入，且冲突访问之间没有 happens-before 顺序时，存在数据竞争。源码中的先后和现实中的等待时长，都不能替代正确的同步关系。

编译器和处理器可以执行规范允许的优化。分析并发程序时，应先找允许观察结果的语言规则，再讨论具体实现；不能用“每次都从主内存读”这样的简化说法解释所有情况。

## 二、happens-before


### 1. 常见关系

| 规则 | 建立的关系 | 使用条件 |
|------|------------|----------|
| 程序次序 | 同线程前后动作的顺序 | 描述语言语义，不要求物理指令逐条执行 |
| 监视器 | 解锁先于随后对同一锁的加锁 | 读写必须遵守相同锁协议 |
| volatile | 写先于随后对同一变量的读 | 不能换成另一个不相关字段 |
| 线程启动 | `start` 前的动作先于新线程动作 | 对象状态在启动前准备好 |
| 线程结束 | 线程动作先于其他线程检测其终止 | 成功等待结束，不能忽略超时 |
| 传递性 | A 先于 B、B 先于 C，则 A 先于 C | 中间关系都必须实际成立 |

并发库的队列、闭锁、Future 等还提供各自的内存一致性契约。它们不是因为“内部用了线程”就安全，而是明确规定了提交、传递、等待或完成之间的关系。

### 2. 发布链

一个写入线程先写普通金额字段，再写 `volatile ready=true`；读取线程读到这个发布标志后再读金额，可以沿程序次序与 volatile 关系推导可见性。

```text
写线程：amountCents = 4970 → ready = true
                              ↓ volatile 同步关系
读线程：                  读到 ready 为 true → 读取 amountCents
```

该链要求读取方先经过相应的 volatile 读取，且例子没有其他不受协调的后续金额写入。把金额读取移到检查标志之前，或持续无保护修改它，都不再是相同发布协议。


## 三、volatile 的能力


### 1. 发布与状态引用

volatile 适合独立状态标志、不可变配置快照的引用替换，以及其他已有严格协议的场景。它为单次读写提供规定的原子性和内存语义，但不会让多个线程互斥地执行整段业务。

以下是下方的 `StateContractTest#volatilePublishesOrdinaryState` 使用的状态，金额只在发布前写入一次：

```java
/** 金额通过单独的发布标志交给读取线程。 */
private static final class PublishedOrder {
    private int amountCents;
    private volatile boolean ready;
}
```

读取方循环检查 `ready`，读到 `true` 后返回金额；写入方先设金额再设标志。测试有超时与中断清理，自旋只用于这个短小的机制观察，实际等待通常优先使用阻塞协议。

### 2. 复合操作限制

`count++` 和“读旧值后减一再写回”由多个动作构成。即使字段是 volatile，两个线程仍可能读到同一个旧值并写回相同结果。

本例故障测试用屏障固定交错，初始库存为 2，两个线程均读取 2，最终都写回 1。这里可见性存在，但更新没有形成原子整体。修复要使用锁或 CAS，而不是增加更多 volatile 字段。

::: warning 原子引用不冻结内部对象
`volatile List<Order>` 只保护引用的读写语义，不能使列表修改线程安全。引用指向不可变快照，或内部状态另有同步规则，才有明确的共享契约。
:::


## 四、final 与初始化

正确构造且未让 `this` 在构造期间逸出的对象，具有专门的 final 字段初始化保证。这有助于设计不可变对象，但不把引用的后续修改自动同步，也不为普通可变字段免除发布责任。

构造器中启动使用 `this` 的线程、把自身注册到可立即回调的监听器，可能让其他线程观察到未完成的对象。应先完成构造，再通过明确边界发布。

双重检查锁定需要正确使用 volatile 引用，并遵守构造与锁协议。普通懒初始化可优先考虑静态初始化持有者或已有的生命周期管理，避免仅为了减少一处加锁引入复杂发布逻辑。

## 五、验证与推理

使用 JDK 21，在本篇新建的示例目录运行发布与复合更新两个测试：

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

将以下内容保存为 `src/test/java/order/concurrent/StateContractTest.java`：

::: details 查看 StateContractTest.java 完整内容

```java [src/test/java/order/concurrent/StateContractTest.java]
package order.concurrent;

import static org.junit.jupiter.api.Assertions.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

/** 受控交错展示错误，并用 API 契约解释修复；有限测试不是并发证明。 */
@Timeout(10)
class StateContractTest {

    /** 用 volatile 修饰同一变量仍然无法合并读取与写回。 */
    @Test
    void volatileDoesNotMakeUpdateAtomic() throws Exception {
        var stock = new VolatileStock();
        var readTogether = new CyclicBarrier(2);
        var executor = Executors.newFixedThreadPool(2);
        try {
            Callable<Void> reserve = /* volatile 只约束单次访问，不保护整个计算。 */ () -> {
                int previous = stock.available;
                readTogether.await(2, TimeUnit.SECONDS);
                stock.available = previous - 1;
                return null;
            };
            var first = executor.submit(reserve);
            var second = executor.submit(reserve);
            TestTasks.result(first);
            TestTasks.result(second);
            assertEquals(1, stock.available);
        } finally {
            TestTasks.stop(executor);
        }
    }

    /** 读到发布标志后，按 happens-before 关系读取先前的普通字段。 */
    @Test
    void volatilePublishesOrdinaryState() throws Exception {
        var order = new PublishedOrder();
        var executor = Executors.newSingleThreadExecutor();
        try {
            var result = executor.submit(/* 标志的 volatile 读取是发布协议的一部分。 */ () -> {
                while (!order.ready) {
                    if (Thread.currentThread().isInterrupted()) {
                        throw new InterruptedException("publication cancelled");
                    }
                    Thread.onSpinWait();
                }
                return order.amountCents;
            });
            order.amountCents = 4970;
            order.ready = true;
            assertEquals(4970, TestTasks.result(result));
        } finally {
            TestTasks.stop(executor);
        }
    }

    /** 仅用于复现 volatile 复合操作限制的故障状态。 */
    private static final class VolatileStock {
        private volatile int available = 2;
    }

    /** 普通金额字段通过单独的 volatile 标志发布。 */
    private static final class PublishedOrder {
        private int amountCents;
        private volatile boolean ready;
    }
}
```

:::

```powershell

mvn -ntp -f pom.xml test "-Dtest=StateContractTest#volatilePublishesOrdinaryState+volatileDoesNotMakeUpdateAtomic"
```

| 场景 | 预期结果 | 证明方式 |
|------|----------|----------|
| 普通字段通过 volatile 标志发布 | 读取金额 `4970` | 运行观察结合 happens-before 推理 |
| volatile 库存的受控读改写 | 最终库存 `1`，丢失一次更新 | 屏障固定两个线程读取相同旧值 |

报告应为 2 项通过。删除 volatile 后某次仍得到正确金额，不能证明发布协议成立；未正确同步的程序是否表现异常与运行条件有关，规范推理不能由有限测试替代。

## 六、参考资料

- [JLS happens-before](https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5)
- [final 字段语义](https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.5)
- [并发库内存一致性](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html)

以上资料提供发布链与测试边界的依据。
