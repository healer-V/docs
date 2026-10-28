---
title: "synchronized 与监视器"
tags: [Java, synchronized, 并发]
excerpt: "解释监视器的互斥、重入与可见性，选择稳定锁对象并保护完整不变量，通过条件状态与 wait、notifyAll 验证先通知和后通知场景，说明异常及取消边界。"
date: 2026-09-10
---


# synchronized 与监视器

`synchronized` 使用对象监视器提供互斥：同一时刻只有一个线程持有该监视器。解锁与随后对同一监视器的加锁还建立可见性关系，使受保护状态能够在线程间一致传递。


## 一、锁对象与重入

| 写法 | 锁对象 | 容易误判的边界 |
|------|--------|----------------|
| 实例同步方法 | 当前 `this` | 不同实例使用不同锁 |
| 静态同步方法 | 声明类的 `Class` 对象 | 不等于某个实例锁 |
| `synchronized (monitor)` | 表达式得到的对象 | 所有相关访问必须得到同一对象 |

同一线程可以重复进入同一监视器，这称为可重入。它不解决跨对象锁顺序问题：线程持有 A 再申请 B，另一个持有 B 再申请 A，仍可能形成循环等待。

共享状态优先使用私有且稳定的锁对象，例如 `private final Object monitor = new Object()`。字符串常量、缓存包装对象或可被外部代码获得的锁，会引入无关竞争；运行期间替换锁对象则直接破坏原同步边界。


## 二、临界区与异常

库存检查与扣减必须由同一临界区保护，读取也遵守相同锁规则。只在写入时加锁，无法让不加锁的读取自动获得同样的可见性保证。

离开同步块会自动释放监视器，包括异常退出，但不会自动撤销已经修改的字段。因此仍需先验证条件、保证异常安全，或以不可变状态整体替换，避免留下半完成的不变量。

参数解析与不依赖共享状态的工作可以放在锁外。持锁执行网络请求或不受控回调会延长等待，还可能间接申请其他锁；锁范围应围绕状态一致性确定。


## 三、条件等待


### 1. wait 的释放与重获

调用对象的 `wait()` 前必须持有该对象监视器。等待会释放这个监视器，返回或抛出中断异常前会重新获得它；不会替线程释放它持有的所有其他锁。

等待必须放在检查条件的 `while` 中。虚假唤醒、竞争者先改变状态和多个等待者争用，都可能使被唤醒线程再次发现条件不成立。


### 2. 状态与通知

通知只是让等待者有机会继续竞争锁，不保存业务结果，也不立即把锁转交出去。必须先在锁内修改持久条件，再在同一锁内调用通知。

`notify()` 选择一个等待者，不能保证它恰好等待当前满足的业务条件；`notifyAll()` 唤醒全部等待者重新检查，可能产生额外竞争。多类条件复杂时，可考虑[Lock 与 Condition](./05-lock-condition.md)的独立条件队列。

::: tip 保存条件，避免依赖通知时机
“订单已准备”应记录为受锁保护的状态。通知先发生时，后来调用者仍能检查到条件成立；如果只发送一次通知而没有状态，后来的等待者可能一直等不到事件。
:::

## 四、订单准备信号

下方的 `OrderSignal` 用一次性布尔状态表达准备完成。完整文件位于 `src/main/java/order/concurrent/OrderSignal.java`：

::: details 查看订单条件信号

```java
package order.concurrent;

/** 用持久条件和同一监视器表达一次准备完成事件。 */
public final class OrderSignal {
    private final Object monitor = new Object();
    private boolean ready;

    /**
     * 条件成立时返回；等待期间允许调用方取消。
     * @throws InterruptedException 等待被中断时继续传播
     */
    public void awaitReady() throws InterruptedException {
        synchronized (monitor) {
            while (!ready) {
                monitor.wait();
            }
        }
    }

    /** 修改条件并通知等待者，无返回值。 */
    public void markReady() {
        synchronized (monitor) {
            ready = true;
            monitor.notifyAll();
        }
    }
}
```

:::

这是一次性信号，不会在成功等待后自动恢复为未准备。生产需求若有截止时间或重复周期，需要在相应协议中增加有界等待与重置规则，不能靠任意 `sleep` 推测对方已进入等待。

## 五、执行与失败判断

在 JDK 21 环境执行库存不变量与条件信号测试：

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

将以下内容保存为 `src/main/java/order/concurrent/OrderSignal.java`：

::: details 查看 OrderSignal.java 完整内容

```java [src/main/java/order/concurrent/OrderSignal.java]
package order.concurrent;


/** 用受锁保护的持久条件表达一次订单准备完成事件。 */
public final class OrderSignal {
    private final Object monitor = new Object();
    private boolean ready;

    /**
     * 等待准备条件，收到通知后仍重新检查；正常返回表示条件成立。
     * @throws InterruptedException 调用方请求取消等待时继续传播
     */
    public void awaitReady() throws InterruptedException {
        synchronized (monitor) {
            while (!ready) {
                monitor.wait();
            }
        }
    }

    /** 在修改条件的同一临界区通知等待者，无返回值。 */
    public void markReady() {
        synchronized (monitor) {
            ready = true;
            monitor.notifyAll();
        }
    }
}
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

    /** 同一私有监视器保护检查和扣减，使库存不会被超额预订。 */
    @Test
    void monitorProtectsStockInvariant() throws Exception {
        var stock = new StockLedger(100);
        assertEquals(100, reservations(/* 每次申请一件库存。 */ () -> stock.reserve(1)));
        assertEquals(0, stock.available());
        assertThrows(IllegalArgumentException.class,
                /* 非法数量不能改变库存。 */ () -> stock.reserve(0));
    }

    /** 条件状态既支持先通知后等待，也支持等待中的通知。 */
    @Test
    void monitorConditionKeepsNotification() throws Exception {
        var ready = new OrderSignal();
        ready.markReady();
        ready.awaitReady();
        var pending = new OrderSignal();
        var executor = Executors.newSingleThreadExecutor();
        try {
            var task = executor.submit(/* 等待受锁保护的准备条件。 */ () -> {
                pending.awaitReady();
                return "READY";
            });
            assertThrows(TimeoutException.class,
                    /* 条件未改变时，不应提前产生成功结果。 */ () -> task.get(20, TimeUnit.MILLISECONDS));
            pending.markReady();
            assertEquals("READY", TestTasks.result(task));
        } finally {
            TestTasks.stop(executor);
        }
        var monitor = new Object();
        assertThrows(IllegalMonitorStateException.class,
                /* 没有持有监视器时不能使用 wait。 */ monitor::wait);
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

mvn -ntp -f pom.xml test "-Dtest=StateContractTest#monitorProtectsStockInvariant+monitorConditionKeepsNotification"
```

| 场景 | 预期观察 |
|------|----------|
| 200 次申请竞争 100 件库存 | 100 次成功，库存为 0 |
| 先 `markReady` 再 `awaitReady` | 直接通过条件检查 |
| 未准备时等待 | 限时读取 Future 超时；准备后任务返回 `READY` |
| 未持锁调用 `wait` | `IllegalMonitorStateException` |

报告应为 2 项通过。Future 的读取超时只结束调用方这次等待，不自动取消底层任务；测试随后改变条件并统一回收执行器。

## 六、性能与版本边界

互斥正确并不代表吞吐满足要求。观察临界区持有时间、竞争栈和业务负载后，再考虑减少共享、缩小范围或调整执行模型，不凭锁名称断言性能高低。

Java 21 虚拟线程在持有监视器时执行某些阻塞操作可能固定载体线程。短临界区不应因此被全面替换；具体事件和版本限制见[虚拟线程](./12-virtual-threads.md)。

## 七、参考资料

- [JLS 监视器与等待集合](https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.2)
- [Object.wait](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#wait()
- [synchronized 语句](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.19)

以上资料定义互斥、释放和通知语义。
