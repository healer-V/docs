---
title: "并发集合"
tags: [Java, ConcurrentHashMap, BlockingQueue]
excerpt: "按单键更新、快照读取和有界任务传递选择并发集合，通过 merge 计数、写时复制迭代和队列超时验证语义，说明弱一致遍历、复合操作与容量边界。"
date: 2026-09-10
---


# 并发集合

并发集合封装特定的数据共享协议，例如单键原子更新、快照迭代和阻塞传递。选择时要看操作的原子范围、读取一致性与容量约束，不能只看类是否属于 `java.util.concurrent`。


## 一、单次安全与业务原子性

即使 `Map` 的 `get` 和 `put` 各自线程安全，“读取旧计数再写回加一”仍可能丢失更新。外层业务需要的是复合动作，而不是两个彼此独立的安全调用。

```java
// 错误局部示例：其他线程可以在 get 和 put 之间更新同一键。
Integer old = counts.get("PAID");
counts.put("PAID", old == null ? 1 : old + 1);
```

跨多个键或对象维护不变量时，即使改用单键原子 API 也不够；需要建立覆盖完整约束的锁、不可变状态或事务边界。

## 二、ConcurrentHashMap


### 1. 单键原子操作

| 目标 | API | 关键语义 |
|------|-----|----------|
| 不存在才写入 | `putIfAbsent` | 避免 containsKey/put 窗口 |
| 按当前值计算 | `compute` | 指定键上的复合更新 |
| 缺失时计算初值 | `computeIfAbsent` | 处理函数返回 null 与失败 |
| 累加或合并 | `merge` | 缺失时写入，存在时合并 |
| 条件删除、替换 | `remove(k,v)`、`replace(k,old,new)` | 仅在预期映射仍成立时修改 |

下方完整测试让 200 项任务对同一订单状态计数。每次使用一个 `merge` 完成初始化或累加，合并函数只有整数计算：

```java
counts.merge("PAID", 1,
        /* 当前计数与新增计数只做无副作用求和。 */ Integer::sum);
```

回调应短小，避免慢 I/O 或修改同一映射表形成递归更新。返回 null 可能代表删除或不建立映射，应按具体 API 契约判断，不能作为随意的“失败默认值”。


### 2. 遍历与值对象

`ConcurrentHashMap` 不接受 null 键和值，读取到 null 因而能表达当前没有映射。其迭代器是弱一致的，可以反映遍历期间部分变化，但不提供整个映射表某一时刻的事务快照。

并发容器保护映射关系，不自动保护 value 内部的可变字段。审计、结算等需要一致快照的操作，应使用明确的快照生成协议或其他具有相应保证的数据源。


## 三、写时复制

`CopyOnWriteArrayList` 修改时复制底层数组，再发布新数组。迭代器保留创建时数组的快照，因此后续添加不会出现在旧迭代器中，也不允许通过该迭代器修改集合。

它适合元素少、读多写少的监听器或配置集合。高频写入、大数组以及长时间持有旧迭代器，都会增加复制成本或旧数组保留时间。

下方完整测试先建立只含 `audit` 的迭代器，再向列表加入 `metrics`。旧迭代器只读到 `audit`，当前列表则包含两项，验证的是快照语义而非“读取总能看到最新值”。


## 四、阻塞与容量


### 1. BlockingQueue

阻塞队列把线程安全的数据传递与等待协议结合起来。对有界队列，满时等待或失败让生产者感知压力；传入数据前后的可见性由队列契约提供。

| 操作 | 立即失败方式 | 阻塞方式 | 有界等待 |
|------|--------------|----------|----------|
| 插入 | `add` 抛异常，`offer` 返回 false | `put` | `offer(value, time, unit)` |
| 取出 | `remove` 抛异常，`poll` 返回 null | `take` | `poll(time, unit)` |
| 查看 | `element` 抛异常，`peek` 返回 null | 无 | 无 |

`ArrayBlockingQueue` 容量固定；`LinkedBlockingQueue` 只有显式配置容量才有实际业务上限。`SynchronousQueue` 不存储元素，生产与消费直接交接；优先级或延迟队列也不能自动当作容量限制。

### 2. 背压与结束

队列容量为 1 时，放入 `ORD-1001` 后再限时放入 `ORD-1002` 应返回 false。取出第一项后容量恢复，第二项才能成功入队。

队列本身通常没有统一关闭协议。消费任务如何停止，要按中断、明确结束消息或外部生命周期设计；多个消费者的结束信号数量和异常退出也需要考虑。

::: warning 无界队列只是推迟过载表现
任务持续进入而消费不足，会增长内存和等待时间。容量、拒绝、超时与消费结束需要一起设计，不能用队列隐藏持续超出下游能力的负载。
:::

## 五、验证与选择

使用 JDK 21，在本篇新建的示例目录运行并发计数、快照和背压三个测试：

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

    /** CopyOnWrite 迭代器保留创建时快照，不跟随之后的写入。 */
    @Test
    void copyOnWriteIteratorIsSnapshot() {
        var listeners = new CopyOnWriteArrayList<>(List.of("audit"));
        var iterator = listeners.iterator();
        listeners.add("metrics");
        List<String> snapshot = new ArrayList<>();
        iterator.forEachRemaining(/* 收集旧迭代器实际可见的元素。 */ snapshot::add);
        assertEquals(List.of("audit"), snapshot);
        assertEquals(List.of("audit", "metrics"), listeners);
    }

    /** 有界队列满时超时返回 false，消费后容量恢复。 */
    @Test
    void boundedQueueBackpressure() throws Exception {
        var queue = new ArrayBlockingQueue<String>(1);
        assertTrue(queue.offer("ORD-1001"));
        assertFalse(queue.offer("ORD-1002", 20, TimeUnit.MILLISECONDS));
        assertEquals("ORD-1001", queue.take());
        assertTrue(queue.offer("ORD-1002"));
        assertEquals("ORD-1002", queue.poll());
        assertNull(queue.poll());
    }
}
```

:::

```powershell

mvn -ntp -f pom.xml test "-Dtest=CoordinationContractTest#concurrentMapAndAdderCount+copyOnWriteIteratorIsSnapshot+boundedQueueBackpressure"
```

报告应为 3 项通过，分别得到计数 200、旧迭代器的单元素快照，以及队列满时失败和消费后恢复的结果。完整代码在 `CoordinationContractTest.java`，任务结束后统一检查执行器终止。

无需等待、容量另有管理的场景可考虑 `ConcurrentLinkedQueue`；需要并发有序键时可看 `ConcurrentSkipListMap`。并发集合的 `size()` 可能成本高且会立刻过时，不能用它代替原子条件操作。

兼容旧接口的 `Collections.synchronizedList` 在迭代时还需要按包装器契约外部同步，所有访问必须使用同一包装器。集合名称相近不代表遍历语义一致。

## 六、参考资料

- [ConcurrentHashMap](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html)
- [CopyOnWriteArrayList](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CopyOnWriteArrayList.html)
- [BlockingQueue](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/BlockingQueue.html)

以上资料定义原子操作、迭代与传递契约。
