---
title: "线程安全与共享状态"
tags: [Java, 线程安全, 并发]
excerpt: "以库存不变量识别共享可变状态与复合竞态，受控复现丢失更新，再用同一临界区修复，说明线程封闭、不可变对象、安全发布与活跃性之间的关系。"
date: 2026-09-10
---


# 线程安全与共享状态

线程安全要求共享对象在允许的并发交错下仍满足约定的结果和不变量。程序没有抛出异常、最终数值偶尔正确，都不足以证明这一点。


## 一、共享边界与不变量

多个线程能够访问同一状态，且至少一个线程修改它，就需要明确协调规则。局部变量本身可以只属于当前调用，但它引用的对象仍可能通过字段、集合或参数被其他线程共享。

库存的约束不是“每次整数赋值正确”，而是检查与扣减之后不能超卖、成功申请数量与剩余库存应一致。订单状态和支付时间等多字段约束，也不能仅靠分别保护单次读写实现。

| 维度 | 需要回答的问题 | 库存例子 |
|------|----------------|----------|
| 原子性 | 哪些动作必须作为整体观察 | 判断足够与实际扣减 |
| 可见性 | 写入通过什么关系传给其他线程 | 扣减后读取最新受保护状态 |
| 有序性 | 哪些操作顺序受到同步约束 | 初始化完成后才发布引用 |
| 活跃性 | 是否能够持续推进 | 等待锁或资源能否收敛 |

## 二、受控丢失更新


### 1. 错误交错

假设初始库存为 2，两个线程各扣减 1。读取、计算、写回不是自动原子操作，以下交错最终只体现一次扣减：

| 顺序 | 线程 A | 线程 B | 共享库存 |
|------|--------|--------|----------|
| 1 | 读取 2 | | 2 |
| 2 | | 读取 2 | 2 |
| 3 | 写回 1 | | 1 |
| 4 | | 写回 1 | 1 |

`StateContractTest#forcedLostUpdate` 用屏障确保两个线程都读完旧值，再允许写回。它主动构造合法的错误交错，无需依赖大循环碰运气。

```java
Callable<Void> reserve = /* 故障示例：读取与写回之间没有原子边界。 */ () -> {
    int previous = stock[0];
    readTogether.await(2, TimeUnit.SECONDS);
    stock[0] = previous - 1;
    return null;
};
```

该局部片段中的 `stock` 初值为 `{2}`，`readTogether` 为两个参与者的 `CyclicBarrier`。完整测试提交两项任务，读取两个 `Future` 后断言库存为 1，证明一项更新丢失。

### 2. 复合检查

“先判断库存足够，再扣减”同样存在窗口。把一个字段改成 `volatile`，或把 `get` 与 `set` 分别换成原子方法，都不会自动合并这两个动作。

线程安全集合也只能保证其契约覆盖的操作。多个安全调用组成的业务流程，仍需使用适当的原子复合 API 或更大的同步边界。


## 三、减少共享与安全发布

无状态计算、每任务独立对象和消息传递，能减少需要同步的状态。各任务独立计算后在完成边界汇总，也比多个线程持续修改同一累计对象更容易判断。

不可变快照适合跨线程共享，但 `final` 引用或 record 并不自动冻结其引用的数组与集合。需要防御性复制或不可变内部结构，并避免构造期间 `this` 逸出。

对象发布还需要明确的可见性依据，例如线程启动、锁、volatile 引用或并发容器的传递契约。不要把“引用已经非空”直接视为所有可变状态都正确同步。

::: tip 先确定状态所有者
对每项可变状态写清谁能读写、生命周期在哪里、需要保护什么不变量，再选择同步工具。单纯按类名标注“线程安全”无法表达跨对象的业务约束。
:::

## 四、监视器修复

下方的 `StockLedger` 使用同一私有锁保护检查、扣减与读取。以下方法来自 `src/main/java/order/concurrent/StockLedger.java`，构造器保证初始库存非负。

::: details 查看库存原子申请方法

```java
/**
 * 在同一临界区检查并扣减库存。
 * @param quantity 需要申请的正数
 * @return 成功扣减为 true，库存不足为 false
 */
public boolean reserve(int quantity) {
    if (quantity <= 0) {
        throw new IllegalArgumentException("quantity must be positive");
    }
    synchronized (monitor) {
        if (available < quantity) {
            return false;
        }
        available -= quantity;
        return true;
    }
}
```

:::

正确性来自同一锁上的互斥与可见性：每次检查看到受保护状态，扣减期间其他申请不能插入。`available()` 也遵守同一锁规则，不把内部可变状态直接暴露出去。

## 五、执行与边界

使用 JDK 21，在本篇示例目录执行故障与修复两个测试：

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

将以下内容保存为 `src/main/java/order/concurrent/StockLedger.java`：

::: details 查看 StockLedger.java 完整内容

```java [src/main/java/order/concurrent/StockLedger.java]
package order.concurrent;


/** 用同一私有监视器保护库存检查、扣减及读取。 */
public final class StockLedger {
    private final Object monitor = new Object();
    private int available;

    /**
     * 创建独立库存账本。
     * @param available 初始库存，必须大于或等于零
     */
    public StockLedger(int available) {
        if (available < 0) {
            throw new IllegalArgumentException("negative stock");
        }
        this.available = available;
    }

    /**
     * 在同一临界区检查并扣减库存，不允许超卖。
     * @param quantity 请求数量，必须为正数
     * @return 成功扣减时为 true，库存不足时为 false
     */
    public boolean reserve(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("quantity must be positive");
        }
        synchronized (monitor) {
            if (available < quantity) {
                return false;
            }
            available -= quantity;
            return true;
        }
    }

    /** 返回同一监视器保护下的库存快照。 */
    public int available() {
        synchronized (monitor) {
            return available;
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

    /** 屏障强制两个线程读取同一旧值，确定地复现一次丢失更新。 */
    @Test
    void forcedLostUpdate() throws Exception {
        int[] stock = {2};
        var readTogether = new CyclicBarrier(2);
        var executor = Executors.newFixedThreadPool(2);
        try {
            Callable<Void> reserve = /* 局部错误写法：读和写之间没有原子边界。 */ () -> {
                int previous = stock[0];
                readTogether.await(2, TimeUnit.SECONDS);
                stock[0] = previous - 1;
                return null;
            };
            var first = executor.submit(reserve);
            var second = executor.submit(reserve);
            TestTasks.result(first);
            TestTasks.result(second);
            assertEquals(1, stock[0]);
        } finally {
            TestTasks.stop(executor);
        }
    }

    /** 同一私有监视器保护检查和扣减，使库存不会被超额预订。 */
    @Test
    void monitorProtectsStockInvariant() throws Exception {
        var stock = new StockLedger(100);
        assertEquals(100, reservations(/* 每次申请一件库存。 */ () -> stock.reserve(1)));
        assertEquals(0, stock.available());
        assertThrows(IllegalArgumentException.class,
                /* 非法数量不能改变库存。 */ () -> stock.reserve(0));
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

mvn -ntp -f pom.xml test "-Dtest=StateContractTest#forcedLostUpdate+monitorProtectsStockInvariant"
```

报告应为 2 项通过。故障例最终库存为 1；修复例从库存 100 接受 200 次单件申请，恰好 100 次成功、剩余为 0，并拒绝非法数量。

有限测试用于验证实现与展示行为，所有调度下的正确性还要依赖同步设计和规范推理。与此同时，过大的锁范围会增加等待，跨锁顺序不一致可能死锁；无死锁也不保证没有活锁或饥饿。

## 六、参考资料

- [JLS 内存模型](https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4)
- [并发工具包的内存一致性](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html)

以上资料提供共享状态与发布的规范依据。
