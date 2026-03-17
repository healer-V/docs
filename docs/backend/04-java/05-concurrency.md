---
title: "Java 多线程与并发"
category: "后端 · Java"
tags:
  - Java
  - 多线程
  - 并发
  - JUC
date: 2026-03-17
---

# Java 多线程与并发

Java 并发编程是后端开发的核心技能，`java.util.concurrent`（JUC）包提供了从线程创建、同步原语到高级并发工具的完整支持。掌握并发编程需要理解线程模型、内存可见性和安全发布等核心概念。

## 一、线程创建

### 1. 四种创建方式

::: details Thread / Runnable 方式

```java
// 方式一：继承 Thread（不推荐，占用继承位）
class PrintTask extends Thread {
    private final String message;

    PrintTask(String message) { this.message = message; }

    @Override
    public void run() {
        System.out.println(Thread.currentThread().getName() + ": " + message);
    }
}

// 方式二：实现 Runnable（推荐，与线程管理解耦）
Runnable task = () -> System.out.println("Hello from " + Thread.currentThread().getName());

Thread t1 = new Thread(new PrintTask("继承方式"), "thread-1");
Thread t2 = new Thread(task, "thread-2");

t1.start();
t2.start();
```

:::

::: details Callable / Future 方式

```java
import java.util.concurrent.*;

// 方式三：Callable + Future（可获取返回值、传播异常）
Callable<Integer> callable = () -> {
    Thread.sleep(500);
    return 42;
};

ExecutorService executor = Executors.newSingleThreadExecutor();
Future<Integer> future = executor.submit(callable);

// 主线程继续执行其他工作...

// 获取结果（阻塞等待）
try {
    Integer result = future.get(2, TimeUnit.SECONDS); // 超时 2 秒
    System.out.println("结果：" + result); // 42
} catch (TimeoutException e) {
    future.cancel(true); // 超时取消
} finally {
    executor.shutdown();
}
```

:::

### 2. 线程状态

Java 线程共有 6 种状态，由 `Thread.State` 枚举表示：

| 状态 | 说明 | 转换触发 |
|------|------|---------|
| `NEW` | 已创建，未启动 | `new Thread()` |
| `RUNNABLE` | 运行中或就绪 | `start()` / 获得 CPU |
| `BLOCKED` | 等待 synchronized 锁 | 争抢 monitor |
| `WAITING` | 无限期等待 | `wait()` / `join()` / `park()` |
| `TIMED_WAITING` | 有限期等待 | `sleep(n)` / `wait(n)` / `join(n)` |
| `TERMINATED` | 已终止 | `run()` 执行完毕或异常退出 |

```
NEW → RUNNABLE ⇄ BLOCKED / WAITING / TIMED_WAITING → TERMINATED
```

## 二、synchronized 与 volatile

### 1. synchronized

`synchronized` 是 Java 内置的互斥锁，保证同一时刻只有一个线程执行被保护的代码块。

::: details synchronized 用法示例

```java
public class Counter {
    private int count = 0;

    // 修饰实例方法：锁定 this 对象
    public synchronized void increment() {
        count++;
    }

    // 修饰静态方法：锁定 Class 对象
    public static synchronized void staticMethod() { }

    // 修饰代码块：锁定指定对象（粒度更细，推荐）
    private final Object lock = new Object();

    public void addAmount(int amount) {
        // 非临界区代码（无需加锁）
        System.out.println("准备增加 " + amount);
        synchronized (lock) {
            // 临界区：只有锁的拥有者才能进入
            count += amount;
        }
    }

    public int getCount() {
        return count;
    }
}
```

:::

### 2. volatile

`volatile` 保证变量的**可见性**（修改立即刷新到主内存）和**有序性**（禁止指令重排），但不保证原子性。

::: details volatile 典型场景

```java
public class ServerStatus {
    // volatile 确保线程 B 能看到线程 A 对 running 的修改
    private volatile boolean running = true;

    public void start() {
        new Thread(() -> {
            while (running) { // 每次都从主内存读取
                processRequest();
            }
            System.out.println("服务已停止");
        }).start();
    }

    public void stop() {
        running = false; // 写入立即对其他线程可见
    }
}

// 双重检查锁定（DCL）单例：volatile 防止指令重排导致返回半初始化对象
public class Singleton {
    private static volatile Singleton instance;

    public static Singleton getInstance() {
        if (instance == null) {                     // 第一次检查（无锁）
            synchronized (Singleton.class) {
                if (instance == null) {             // 第二次检查（加锁）
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```

:::

| 特性 | synchronized | volatile |
|------|-------------|----------|
| 可见性 | ✓ | ✓ |
| 原子性 | ✓（代码块内） | ✗ |
| 有序性 | ✓ | ✓（禁止重排） |
| 阻塞 | 是（等待锁） | 否 |

## 三、Lock 接口

### 1. ReentrantLock

`ReentrantLock` 是 `synchronized` 的显式替代，提供更灵活的锁控制：可尝试锁、可中断锁、可超时锁、公平锁。

::: details ReentrantLock 示例

```java
import java.util.concurrent.locks.*;

public class SafeQueue<T> {
    private final Queue<T> queue = new LinkedList<>();
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notEmpty = lock.newCondition(); // 条件变量

    public void put(T item) {
        lock.lock();
        try {
            queue.offer(item);
            notEmpty.signal(); // 通知等待取元素的线程
        } finally {
            lock.unlock(); // 必须在 finally 中释放锁
        }
    }

    public T take() throws InterruptedException {
        lock.lock();
        try {
            while (queue.isEmpty()) {
                notEmpty.await(); // 等待直到有元素
            }
            return queue.poll();
        } finally {
            lock.unlock();
        }
    }

    // 尝试锁（非阻塞）
    public boolean tryPut(T item) {
        if (lock.tryLock()) {
            try {
                queue.offer(item);
                return true;
            } finally {
                lock.unlock();
            }
        }
        return false; // 未能获得锁，立即返回
    }
}
```

:::

### 2. ReadWriteLock

读写分离锁允许多个读线程并发，写操作互斥，适合读多写少场景。

::: details ReadWriteLock 示例

```java
import java.util.concurrent.locks.*;

public class CachedData {
    private final Map<String, String> cache = new HashMap<>();
    private final ReadWriteLock rwLock = new ReentrantReadWriteLock();

    public String get(String key) {
        rwLock.readLock().lock(); // 读锁（允许并发读）
        try {
            return cache.get(key);
        } finally {
            rwLock.readLock().unlock();
        }
    }

    public void put(String key, String value) {
        rwLock.writeLock().lock(); // 写锁（排他）
        try {
            cache.put(key, value);
        } finally {
            rwLock.writeLock().unlock();
        }
    }
}
```

:::

## 四、线程池

### 1. ThreadPoolExecutor

直接使用 `ThreadPoolExecutor` 可以精确控制线程池的行为，是生产环境推荐的方式。

::: details ThreadPoolExecutor 参数详解

```java
import java.util.concurrent.*;

ThreadPoolExecutor executor = new ThreadPoolExecutor(
    4,                              // corePoolSize：核心线程数（常驻）
    8,                              // maximumPoolSize：最大线程数
    60L, TimeUnit.SECONDS,          // keepAliveTime：空闲线程存活时间
    new LinkedBlockingQueue<>(200), // workQueue：等待队列（有界，避免 OOM）
    new ThreadFactory() {           // threadFactory：自定义线程名
        private final AtomicInteger counter = new AtomicInteger();
        @Override
        public Thread newThread(Runnable r) {
            Thread t = new Thread(r, "order-worker-" + counter.incrementAndGet());
            t.setDaemon(false);
            return t;
        }
    },
    new ThreadPoolExecutor.CallerRunsPolicy() // 拒绝策略：由调用者线程执行
);

// 提交任务
executor.submit(() -> processOrder(orderId));

// 关闭线程池
executor.shutdown();              // 不再接受新任务，等待已提交任务完成
executor.awaitTermination(30, TimeUnit.SECONDS);
```

:::

### 2. 拒绝策略

当线程池满且队列满时，执行拒绝策略：

| 策略 | 行为 |
|------|------|
| `AbortPolicy`（默认） | 抛出 `RejectedExecutionException` |
| `CallerRunsPolicy` | 由提交任务的线程执行（降速保护） |
| `DiscardPolicy` | 静默丢弃新任务 |
| `DiscardOldestPolicy` | 丢弃队列最老的任务，重新提交 |

### 3. Executors 工厂方法

::: details 常用线程池类型

```java
// CPU 密集型任务：线程数 = CPU 核心数
ExecutorService cpuPool = Executors.newFixedThreadPool(
    Runtime.getRuntime().availableProcessors()
);

// I/O 密集型任务：线程数 = 核心数 × 2（等待 I/O 期间可运行其他线程）
ExecutorService ioPool = Executors.newCachedThreadPool();

// 定时任务
ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
scheduler.scheduleAtFixedRate(
    () -> cleanupExpiredSessions(),
    0, 5, TimeUnit.MINUTES // 立即开始，每 5 分钟执行一次
);
```

:::

::: warning
阿里巴巴 Java 开发手册明确禁止使用 `Executors.newFixedThreadPool()` 和 `newCachedThreadPool()`，前者队列无界（Integer.MAX_VALUE）可能 OOM，后者线程数无界。生产环境务必使用 `ThreadPoolExecutor` 并指定有界队列。
:::

## 五、并发工具类

### 1. CountDownLatch

让一个或多个线程等待，直到其他线程完成一组操作。计数器只能减少，不能重置。

::: details CountDownLatch 示例

```java
import java.util.concurrent.*;

// 场景：主线程等待 3 个子任务全部完成后汇总结果
CountDownLatch latch = new CountDownLatch(3);
List<String> results = Collections.synchronizedList(new ArrayList<>());

for (int i = 1; i <= 3; i++) {
    final int taskId = i;
    executor.submit(() -> {
        try {
            String result = fetchDataFromService(taskId);
            results.add(result);
        } finally {
            latch.countDown(); // 无论成功失败都要 countDown
        }
    });
}

latch.await(10, TimeUnit.SECONDS); // 最多等待 10 秒
System.out.println("所有任务完成，结果数：" + results.size());
```

:::

### 2. CyclicBarrier

让一组线程互相等待，直到所有线程都到达屏障点后再一起继续，计数器可以重置复用。

::: details CyclicBarrier 示例

```java
// 场景：并行计算分阶段处理，每阶段所有线程同步后再进入下一阶段
CyclicBarrier barrier = new CyclicBarrier(4, () ->
    System.out.println("=== 阶段完成，进入下一阶段 ==="));

for (int i = 0; i < 4; i++) {
    final int workerId = i;
    executor.submit(() -> {
        for (int phase = 1; phase <= 3; phase++) {
            doPhaseWork(workerId, phase);
            barrier.await(); // 等待其他线程完成同一阶段
        }
    });
}
```

:::

### 3. Semaphore

信号量控制同时访问某资源的线程数量，常用于限流。

::: details Semaphore 限流示例

```java
// 场景：限制同时访问数据库连接的线程数为 10
Semaphore semaphore = new Semaphore(10);

public String queryDatabase(String sql) throws InterruptedException {
    semaphore.acquire(); // 获取许可（无许可时阻塞）
    try {
        return executeQuery(sql);
    } finally {
        semaphore.release(); // 必须释放许可
    }
}
```

:::

## 六、CompletableFuture

`CompletableFuture` 是 Java 8 引入的异步编程框架，支持链式调用、组合多个异步任务、异常处理。

::: details CompletableFuture 示例

```java
import java.util.concurrent.CompletableFuture;

// 基本异步执行
CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> fetchUserInfo(userId))     // 异步获取用户信息
    .thenApply(user -> enrichWithProfile(user))   // 同步转换结果
    .thenApplyAsync(user -> fetchOrders(user))    // 异步后续操作
    .exceptionally(ex -> {                        // 异常兜底
        log.error("获取用户信息失败", ex);
        return UserInfo.defaultUser();
    });

// 组合多个 Future
CompletableFuture<UserInfo> userFuture   = CompletableFuture.supplyAsync(() -> getUser(id));
CompletableFuture<OrderList> orderFuture = CompletableFuture.supplyAsync(() -> getOrders(id));

// 等待两者都完成后合并
CompletableFuture<UserDashboard> dashboard = userFuture.thenCombine(
    orderFuture,
    (user, orders) -> new UserDashboard(user, orders)
);

// 等待多个 Future 全部完成
CompletableFuture.allOf(userFuture, orderFuture)
    .thenRun(() -> System.out.println("所有数据加载完毕"));

// 等待最快的 Future 完成（竞速）
CompletableFuture.anyOf(serverA.query(), serverB.query())
    .thenAccept(result -> System.out.println("最快结果：" + result));

// 获取结果
String result = future.join(); // 阻塞获取，不抛检查异常
```

:::

::: tip
`CompletableFuture.supplyAsync()` 默认使用 `ForkJoinPool.commonPool()`。在生产环境中建议传入自定义线程池，以便控制并发度和线程命名，避免公共池被耗尽影响其他任务。
:::
