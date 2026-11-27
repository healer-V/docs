---
title: "Java并发面试题"
category: "面试题"
tags:
  - Java
  - 并发
  - 线程池
excerpt: "围绕线程状态、Java 内存模型、synchronized 与 volatile、CAS 与 AQS、线程池参数与拒绝策略、ThreadLocal 泄漏及虚拟线程等面试题，解释并发问题的成因、正确用法和排查方式。"
---

# Java并发面试题

并发题考查三类问题：多个线程能否看到彼此的修改（可见性）、操作会不会被打断（原子性）、指令会不会被重排（有序性）。分析代码时先找出共享的可变状态，再判断它由什么机制保护。

::: info 版本边界
本篇以 Java 21 为主线。虚拟线程是 Java 21 正式特性；涉及 `synchronized` 锁优化时说明 HotSpot 的版本差异，这些属于 JVM 实现而非 Java 语言规范。
:::

## 一、线程与内存模型

### 1. 线程有哪些状态，如何转换？

**`Thread.State` 定义了 6 种状态：NEW、RUNNABLE、BLOCKED、WAITING、TIMED_WAITING、TERMINATED。** Java 的 RUNNABLE 包含操作系统层面的“就绪”和“运行中”，线程在执行阻塞 I/O 时通常也显示为 RUNNABLE。

| 状态 | 进入条件 | 离开条件 |
|------|----------|----------|
| NEW | 已创建，未调用 `start()` | 调用 `start()` |
| BLOCKED | 等待进入 `synchronized` 监视器 | 获得监视器锁 |
| WAITING | `wait()`、`join()`、`LockSupport.park()` 无超时 | `notify`、目标线程结束、`unpark` |
| TIMED_WAITING | `sleep(ms)`、带超时的 `wait`/`join`/`park` | 超时或被唤醒 |
| TERMINATED | `run()` 执行结束或抛出未捕获异常 | 不可再次启动 |

区分 BLOCKED 和 WAITING 对排查很重要：`jstack` 中大量 BLOCKED 说明在争抢 `synchronized` 锁；`ReentrantLock` 的等待线程显示为 WAITING (parking)，因为它基于 `LockSupport.park()`。

参考：[Java 21 API：Thread.State](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.State.html)。

### 2. sleep() 与 wait() 有什么区别？

**`sleep()` 是 `Thread` 的静态方法，暂停当前线程但不释放已持有的锁；`wait()` 是 `Object` 的方法，必须在持有该对象监视器时调用，调用后释放锁并等待通知。**

`wait()` 不在 `synchronized` 块中调用会抛出 `IllegalMonitorStateException`。被 `notify()` 唤醒的线程需要重新竞争锁才能继续执行，而且可能发生虚假唤醒，所以等待条件必须写在 `while` 循环里：`while (queue.isEmpty()) lock.wait();`，而不是 `if`。

参考：[Java 21 API：Object.wait](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#wait())。

### 3. 什么是 Java 内存模型和 happens-before？

**Java 内存模型（JMM）规定了一个线程的写入何时对另一个线程可见，happens-before 是判断可见性的规则：若操作 A happens-before 操作 B，A 的结果对 B 可见。**

没有同步时，编译器和 CPU 可能重排指令，写入也可能停留在 CPU 缓存中，另一个线程读到旧值。常用的 happens-before 规则包括：

1. **程序顺序：** 同一线程内，前面的操作 happens-before 后面的操作。
2. **监视器锁：** 对同一把锁的解锁 happens-before 后续的加锁。
3. **volatile：** 对 volatile 变量的写 happens-before 后续对它的读。
4. **线程启动与终止：** `start()` happens-before 新线程的任何操作；线程的所有操作 happens-before 其他线程从 `join()` 返回。
5. **传递性：** A 先于 B、B 先于 C，则 A 先于 C。

happens-before 不等于时间上的先后：它是可见性保证。两个线程的操作之间若找不到这条链，就存在数据竞争，结果不可预测。

参考：[JLS 21：Java 内存模型](https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5)。

## 二、锁与原子操作

### 1. synchronized 的原理是什么，锁升级还成立吗？

**`synchronized` 基于对象监视器（monitor）实现互斥和可见性；同步代码块编译为 `monitorenter`/`monitorexit` 指令，同步方法通过 `ACC_SYNCHRONIZED` 标志实现。** 它是可重入锁，同一线程可以重复进入。

HotSpot 会根据竞争情况选择锁实现：无竞争时用 CAS 修改对象头的轻量级锁，竞争激烈时膨胀为依赖操作系统互斥量的重量级锁。传统面试答案中的“偏向锁 → 轻量级锁 → 重量级锁”需要加版本前提：偏向锁在 JDK 15 起默认禁用（JEP 374），JDK 18 起相关参数已成为 obsolete 选项，Java 21 中不再存在偏向锁阶段。

`synchronized` 退出时一定释放锁（包括异常退出），不会因忘记解锁而死锁；但它不支持超时获取、中断等待和多个条件队列，这些需求要使用 `ReentrantLock`。

参考：[JEP 374：Deprecate and Disable Biased Locking](https://openjdk.org/jeps/374)。

### 2. volatile 能保证什么，不能保证什么？

**volatile 保证变量的可见性和禁止相关指令重排，但不保证复合操作的原子性。**

`volatile boolean running` 适合作为停止标志：一个线程设置 `false`，工作线程下一次读取就能看到。但 `volatile int count; count++` 包含“读、加一、写”三步，两个线程可能读到同一个值，各自加一后写回，丢失一次累加，应改用 `AtomicInteger` 或加锁。

双重检查锁定的单例中，实例字段必须是 volatile。`instance = new Singleton()` 包含分配内存、初始化对象、赋值引用三步，没有 volatile 时后两步可能重排，另一个线程拿到引用后访问到尚未初始化完成的对象。

参考：[JLS 21：volatile 字段](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.3.1.4)。

### 3. CAS 是什么，ABA 问题如何解决？

**CAS（Compare-And-Swap）是 CPU 提供的原子指令：只有内存中的值等于预期值时才更新为新值，否则失败并由调用方重试。** `AtomicInteger.incrementAndGet()` 就是在循环中执行 CAS 直到成功。

| 问题 | 表现 | 处理方式 |
|------|------|----------|
| ABA | 值从 A 变为 B 又变回 A，CAS 误认为未变化 | `AtomicStampedReference` 附加版本号 |
| 自旋开销 | 竞争激烈时大量 CAS 失败重试，占用 CPU | 高并发计数使用 `LongAdder` 分散热点 |
| 单变量限制 | 一次只能原子更新一个变量 | 把多个字段封装进不可变对象，用 `AtomicReference` 替换 |

`LongAdder` 在竞争时把累加分散到多个 `Cell` 上，读取 `sum()` 时再汇总，因此写吞吐高，但 `sum()` 在并发写入期间不是精确快照，适合统计计数而不适合生成序号。

参考：[Java 21 API：java.util.concurrent.atomic](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/package-summary.html)。

### 4. AQS 是什么，ReentrantLock 如何基于它实现？

**AQS（AbstractQueuedSynchronizer）用一个 `volatile int state` 表示同步状态，用 FIFO 等待队列管理获取失败的线程。** ReentrantLock、Semaphore、CountDownLatch 都是基于它实现的。

ReentrantLock 中 `state` 表示重入次数：为 0 时用 CAS 设为 1 并记录持有线程；持有线程再次加锁时 `state` 加一；获取失败的线程进入队列并 `park`。释放时 `state` 减到 0 才真正释放并唤醒队列中的后继线程。

| 对比项 | `synchronized` | `ReentrantLock` |
|--------|----------------|-----------------|
| 获取与释放 | JVM 自动 | 必须在 `finally` 中 `unlock()` |
| 公平性 | 非公平 | 默认非公平，可构造为公平锁 |
| 超时与中断 | 不支持 | `tryLock(timeout)`、`lockInterruptibly()` |
| 条件等待 | 一个等待集 | 可创建多个 `Condition` |

非公平锁允许新来的线程直接尝试 CAS 抢锁，减少线程切换，吞吐更高；公平锁按排队顺序获取，避免饥饿但切换更多。

参考：[Java 21 API：AbstractQueuedSynchronizer](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/AbstractQueuedSynchronizer.html)。

### 5. 死锁的条件是什么，如何排查？

**死锁需要同时满足互斥、持有并等待、不可剥夺、循环等待四个条件，破坏任意一个即可避免。** 实践中最常用的是固定加锁顺序破坏循环等待，或用 `tryLock` 超时破坏持有并等待。

转账时线程 1 先锁账户 A 再锁 B，线程 2 先锁 B 再锁 A，就可能互相等待。按账户 ID 从小到大加锁可以消除这种循环。

排查时执行 `jstack <pid>` 或 `jcmd <pid> Thread.print`，输出末尾会出现 `Found one Java-level deadlock`，并列出每个线程持有和等待的锁。这只能检测 `synchronized` 和 `java.util.concurrent` 锁之间的死锁；数据库锁或外部资源造成的等待需要结合对应系统的锁信息分析。

参考：[JDK 21 工具：jstack](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jstack.html)。

## 三、线程池与异步

### 1. ThreadPoolExecutor 的核心参数和任务提交流程是什么？

**线程池由核心线程数、最大线程数、空闲存活时间、任务队列、线程工厂和拒绝策略共同决定行为。** 提交任务时按以下顺序判断：

1. 当前线程数小于 `corePoolSize`，创建新线程执行任务，即使有空闲线程。
2. 核心线程已满，尝试把任务放入 `workQueue`。
3. 队列已满且线程数小于 `maximumPoolSize`，创建非核心线程执行任务。
4. 线程数已达最大值且队列已满，执行拒绝策略。

非核心线程空闲超过 `keepAliveTime` 后被回收；调用 `allowCoreThreadTimeOut(true)` 后核心线程也会回收。由这个顺序可知：使用无界队列时，第 3 步永远不会发生，`maximumPoolSize` 形同虚设。

| 拒绝策略 | 行为 |
|----------|------|
| `AbortPolicy`（默认） | 抛出 `RejectedExecutionException` |
| `CallerRunsPolicy` | 由提交任务的线程自己执行，形成反压 |
| `DiscardPolicy` | 静默丢弃任务 |
| `DiscardOldestPolicy` | 丢弃队列中最旧的任务后重试提交 |

参考：[Java 21 API：ThreadPoolExecutor](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html)。

### 2. 为什么不建议直接使用 Executors 创建线程池，线程数如何设置？

**`Executors` 的工厂方法隐藏了无界资源：`newFixedThreadPool` 和 `newSingleThreadExecutor` 使用无界 `LinkedBlockingQueue`，`newCachedThreadPool` 的最大线程数为 `Integer.MAX_VALUE`。** 任务积压时分别会导致内存耗尽或线程数失控。

直接构造 `ThreadPoolExecutor`，显式指定有界队列、可识别的线程名称和拒绝策略，故障时才能定位是哪个池拒绝了任务。

线程数的经验起点是：CPU 密集型约为 CPU 核数（+1），I/O 密集型可按 `核数 × (1 + 等待时间 / 计算时间)` 估算。估算只给出起点，最终要通过压测观察吞吐、延迟、队列长度和 CPU 使用率调整；容器中运行时，`Runtime.availableProcessors()` 返回的是容器 CPU 限额而非宿主机核数（JDK 10 起支持容器感知）。

参考：[Java 21 API：Executors](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Executors.html)。

### 3. ThreadLocal 的原理是什么，为什么会内存泄漏？

**每个 `Thread` 持有一个 `ThreadLocalMap`，键是 `ThreadLocal` 对象的弱引用，值是线程私有的数据。** `threadLocal.get()` 实际是用当前 ThreadLocal 作为键，到当前线程的 Map 中查找。

键是弱引用，ThreadLocal 对象没有强引用后键会被回收变为 `null`，但值仍被 Map 强引用；线程池中的线程长期存活，这些值就无法回收。更常见的问题是数据串用：线程池复用线程后，上一个请求设置的用户信息被下一个请求读到。

```java
try {
    CURRENT_USER.set(user);
    orderService.submit(order);
} finally {
    CURRENT_USER.remove(); // 线程归还线程池前清理，防止泄漏和串用
}
```

异步任务不会自动继承父线程的 ThreadLocal。Java 21 中 `ScopedValue` 仍是预览特性，不能在生产代码中按正式 API 使用。

参考：[Java 21 API：ThreadLocal](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ThreadLocal.html)。

### 4. CompletableFuture 使用时要注意什么？

**CompletableFuture 用回调链组合异步任务，`thenApply` 转换结果、`thenCompose` 串联另一个异步调用、`thenCombine` 合并两个结果、`allOf` 等待多个任务。**

1. **默认线程池：** 不传 `Executor` 的 `supplyAsync` 使用 `ForkJoinPool.commonPool()`，阻塞 I/O 任务会占满公共池，影响并行流等其他使用者；业务调用应传入专用线程池。
2. **异常处理：** 链中某一步抛出异常后，后续 `thenApply` 不会执行，异常被包装为 `CompletionException`；需要用 `exceptionally` 或 `handle` 处理，否则异常可能无人知晓。
3. **超时控制：** Java 9 起可用 `orTimeout()` 或 `completeOnTimeout()` 为远程调用设置超时，避免 `join()` 无限等待。

参考：[Java 21 API：CompletableFuture](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html)。

### 5. 虚拟线程是什么，适用于什么场景？

**虚拟线程是由 JVM 调度的轻量线程，阻塞时会从承载它的平台线程上卸载，平台线程可以继续执行其他虚拟线程。** 它在 Java 21 由 JEP 444 正式发布，适合大量并发的阻塞 I/O 任务。

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (var orderId : orderIds) {
        executor.submit(() -> paymentClient.query(orderId)); // 每个任务一个虚拟线程
    }
} // close() 等待已提交任务完成
```

虚拟线程提升的是吞吐（同时处理的请求数），不会让单个 CPU 计算更快，CPU 密集型任务应继续使用平台线程池。虚拟线程创建成本低，不应再池化；需要限制下游并发时使用 `Semaphore`。

::: warning Java 21 中 synchronized 会钉住虚拟线程
在 Java 21 中，虚拟线程在 `synchronized` 块内执行阻塞操作时会被“钉住”（pinned）在平台线程上，无法卸载，高并发下可能耗尽承载线程。可以用 `-Djdk.tracePinnedThreads=full` 观察，必要时改用 `ReentrantLock`。JDK 24 的 JEP 491 解决了这一限制，但 Java 21 项目仍需注意。
:::

参考：[JEP 444：Virtual Threads](https://openjdk.org/jeps/444)、[JEP 491：Synchronize Virtual Threads without Pinning](https://openjdk.org/jeps/491)。
