---
title: "ThreadLocal 与上下文"
tags: [Java, ThreadLocal, 并发]
excerpt: "解释线程本地值的初始化、读取与清理，复现线程池复用导致的订单上下文残留，使用作用域恢复处理异常和嵌套，并明确继承、异步传播及虚拟线程成本。"
date: 2026-09-10
---

# ThreadLocal 与上下文

`ThreadLocal<T>` 为使用它的每个线程保存独立值。它将状态与线程关联，不与请求、Future 或方法调用自动关联；在线程池复用线程时，这个区别决定了上下文是否会串到后续任务。

## 一、读取与初始化

| API | 行为 | 生命周期含义 |
|-----|------|--------------|
| `get()` | 获取当前线程的值 | 尚未设置时调用初始化逻辑 |
| `set(value)` | 设置当前线程的值 | 其他线程不会自动取得该值 |
| `remove()` | 移除当前线程对应值 | 再次 get 可以重新初始化 |
| `withInitial(supplier)` | 定义每线程初始化来源 | 不是整个进程只执行一次 |

默认初始化值为 null。`remove()` 与 `set(null)` 不完全相同，后者仍是设置了一个 null 值；带初始化逻辑的变量在后续读取时尤其需要区分。

ThreadLocal 只隔离保存的引用。如果多个线程恰好设置了同一个可变对象引用，对象内部仍然共享，需要另有线程安全规则。

## 二、线程池残留

订单任务 A 把编号设为 `ORD-1001`，执行后没有清理。线程池将同一线程交给任务 B，B 调用 `get()` 就可能读到 A 的编号，即使 B 从未设置它。

下方完整测试使用只有一个工作线程的执行器固定复用关系。下面为 `ExecutionContractTest#threadLocalLeakAndScopedCleanup` 的局部错误演示，`leaked` 是新建的 `ThreadLocal<String>`：

```java
TestTasks.result(executor.submit(/* 故意遗漏清理以复现残留。 */
        () -> leaked.set("ORD-1001")));
assertEquals("ORD-1001", TestTasks.result(executor.submit(
        /* 后续任务确定复用同一工作线程。 */ leaked::get)));
```

ThreadLocal 的键使用弱引用不等于值能够及时回收。工作线程持续存活、条目尚未清理时，较大值仍可能被保留；明确 `remove()` 才能表达任务已经结束使用。

::: warning 任务结束与线程结束不同
线程池线程可以处理许多请求。不能等线程销毁再清理日志关联键、用户上下文或大对象，否则既可能发生数据串用，也可能扩大内存保留。
:::

## 三、作用域与嵌套恢复

下方的 `OrderContext` 在进入任务时保存旧编号，退出时恢复旧值；如果此前没有上下文，就执行 `remove()`。这样异常和嵌套调用都具有明确边界。

以下为 `src/main/java/order/concurrent/OrderContext.java` 的完整作用域方法，`CURRENT` 是私有静态 `ThreadLocal<String>`：

::: details 查看订单上下文作用域

```java
/**
 * 在当前线程执行任务，退出时恢复旧上下文或清理。
 * @param orderNumber 非空订单编号，不自动向其他线程传播
 * @param action 非空任务，正常或异常退出均恢复上下文
 * 无返回值，任务异常保持原样向上传播。
 */
public static void runWith(String orderNumber, Runnable action) {
    Objects.requireNonNull(orderNumber);
    Objects.requireNonNull(action);
    String previous = CURRENT.get();
    CURRENT.set(orderNumber);
    try {
        action.run();
    } finally {
        if (previous == null) {
            CURRENT.remove();
        } else {
            CURRENT.set(previous);
        }
    }
}
```

:::

仅在最外层请求使用时，`finally remove` 往往足够；存在嵌套作用域时，直接 remove 会丢掉外层仍在使用的上下文，因此本例显式恢复旧值。这不是把异常吞掉，异常继续交给原来的调用边界处理。

## 四、继承与异步传播

### 1. InheritableThreadLocal

继承值与子线程创建相关，不随每次任务提交更新。线程池常在首次任务时才创建工作线程，之后即使提交者上下文改变，已有线程也不会重新继承。

下方完整测试在线程创建前设置 `ORD-1001`，首次读取得到它；提交者随后改为 `ORD-1002`，同一工作线程仍读取 `ORD-1001`。这不是可用的逐请求传播协议。

### 2. 显式捕获与安装

跨线程时，先在提交点捕获需要的不可变上下文，再在执行线程安装、执行并清理。更简单的业务代码可以直接传递参数，不必为了隐藏参数而引入隐式线程状态。

日志 MDC 也不应假定自动传播到每个执行器。需要复制的是受控关联信息，不能传播可变 `Connection` 或把 JDBC 事务跨线程共享；具体日志实现还需遵守其上下文 API。

CompletableFuture 的普通回调可能在完成线程或注册线程执行，Async 回调又可能切换执行器，因此依赖“回调大概还在原线程”是不可靠的。

## 五、验证与结果

使用 JDK 21，运行线程池残留、作用域恢复和继承两个测试：

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

将以下内容保存为 `src/main/java/order/concurrent/OrderContext.java`：

::: details 查看 OrderContext.java 完整内容

```java [src/main/java/order/concurrent/OrderContext.java]
package order.concurrent;

import java.util.Objects;

/** 在当前线程的任务范围内保存订单编号，并支持嵌套调用恢复。 */
public final class OrderContext {
    private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();

    /** 禁止实例化上下文工具。 */
    private OrderContext() { }

    /** 返回当前线程的订单编号；未进入任务范围时为 null。 */
    public static String current() {
        return CURRENT.get();
    }

    /**
     * 在调用线程中执行任务，退出时恢复原上下文或清理槽位。
     * @param orderNumber 非空订单编号，不自动向其他线程传播
     * @param action 非空任务，正常或异常退出均恢复上下文
     * 无返回值，任务异常按原样向上传播。
     */
    public static void runWith(String orderNumber, Runnable action) {
        Objects.requireNonNull(orderNumber);
        Objects.requireNonNull(action);
        String previous = CURRENT.get();
        CURRENT.set(orderNumber);
        try {
            action.run();
        } finally {
            if (previous == null) {
                CURRENT.remove();
            } else {
                CURRENT.set(previous);
            }
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

    /** 复用线程会保留未清理的 ThreadLocal，作用域包装负责异常和嵌套恢复。 */
    @Test
    void threadLocalLeakAndScopedCleanup() throws Exception {
        var leaked = new ThreadLocal<String>();
        var executor = Executors.newSingleThreadExecutor();
        try {
            TestTasks.result(executor.submit(/* 故意遗漏 remove，复现跨请求残留。 */
                    () -> leaked.set("ORD-1001")));
            assertEquals("ORD-1001", TestTasks.result(executor.submit(
                    /* 单工作线程保证后续请求复用同一个线程。 */ leaked::get)));
            TestTasks.result(executor.submit(/* 修复演示中的残留，避免污染其他检查。 */ leaked::remove));
            TestTasks.result(executor.submit(/* 在同一复用线程核验上下文作用域。 */ () -> {
                assertThrows(IllegalStateException.class,
                        /* 故意抛出业务异常，finally 仍需恢复上下文。 */
                        () -> OrderContext.runWith("ORD-1002", /* 当前任务只读取本线程状态。 */ () -> {
                            assertEquals("ORD-1002", OrderContext.current());
                            OrderContext.runWith("ORD-1003", /* 嵌套任务拥有自己的临时编号。 */
                                    () -> assertEquals("ORD-1003", OrderContext.current()));
                            assertEquals("ORD-1002", OrderContext.current());
                            throw new IllegalStateException("request failed");
                        }));
            }));
            assertNull(TestTasks.result(executor.submit(/* 新任务不应看到旧编号。 */ OrderContext::current)));
        } finally {
            TestTasks.stop(executor);
        }
    }

    /** InheritableThreadLocal 在线程创建时继承，不随每次提交更新。 */
    @Test
    void inheritedContextIsNotSubmissionContext() throws Exception {
        var inherited = new InheritableThreadLocal<String>();
        var executor = Executors.newSingleThreadExecutor();
        inherited.set("ORD-1001");
        try {
            assertEquals("ORD-1001", TestTasks.result(executor.submit(
                    /* 首次提交创建平台工作线程，此时继承当前值。 */ inherited::get)));
            inherited.set("ORD-1002");
            assertEquals("ORD-1001", TestTasks.result(executor.submit(
                    /* 后续任务复用已存在的线程，仍是创建时的值。 */ inherited::get)));
            TestTasks.result(executor.submit(/* 明确清理工作线程上的继承值。 */ inherited::remove));
        } finally {
            inherited.remove();
            TestTasks.stop(executor);
        }
    }
}
```

:::

```powershell

mvn -ntp -f pom.xml test "-Dtest=ExecutionContractTest#threadLocalLeakAndScopedCleanup+inheritedContextIsNotSubmissionContext"
```

| 场景 | 预期观察 |
|------|----------|
| 未清理普通 ThreadLocal | 第二项任务读到 `ORD-1001` |
| 外层 `ORD-1002`，内层 `ORD-1003` | 内层结束后恢复为 `ORD-1002` |
| 外层任务抛异常 | 后续新任务读取上下文为 null |
| 提交者修改继承值 | 已存在工作线程仍保持创建时的值 |

报告应为 2 项通过。异常路径和嵌套恢复都在同一个复用线程中验证，避免仅在每次新建线程的环境下漏掉残留问题。

## 六、虚拟线程成本

虚拟线程支持 ThreadLocal，每任务创建线程可以缩短线程寿命，但大量并发任务仍可能各自持有大对象。不要在其中缓存连接、昂贵缓冲区或其他应有独立容量管理的资源。

Java 21 的相关上下文替代 API 仍涉及预览能力，本模块不把它们引入主线示例。采用新的上下文模型时，应按目标版本和框架传播契约重新验证，不能仅替换类型名。

## 七、参考资料

- [ThreadLocal](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ThreadLocal.html)
- [InheritableThreadLocal](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/InheritableThreadLocal.html)
- [SLF4J 日志](../09-engineering-quality/07-slf4j-logging.md)
