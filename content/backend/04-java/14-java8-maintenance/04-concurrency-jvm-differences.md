---
title: "Java 8 与 21 运行差异"
tags: [Java, Java 8, JVM, 并发]
excerpt: "比较 Java 8 与 21 的线程、异步、GC、日志和诊断能力，使用真实进程核对默认收集器与无效日志参数，明确发行版、容器和运行回归的边界。"
date: 2026-09-11
---

# Java 8 与 21 运行差异

Java 8 与 21 保留了大量相同并发契约，但任务 API、运行时实现和工具能力已经演进。升级后旧代码仍可能工作，原来的容量、反射、Agent 和启动参数假设则需要重新验证。

## 一、并发能力

| 能力 | Java 8 | Java 21 |
|------|--------|---------|
| 平台线程、监视器和显式锁 | 可用 | 基本同步契约延续，实现可演进 |
| Executor、Future | 可用 | 增加部分生命周期便利接口 |
| CompletableFuture | 基础组合可用 | 具有后续加入的超时等便利 API |
| ThreadLocal | 需显式清理与传播 | 线程池及虚拟线程仍需控制持有成本 |
| 虚拟线程 | 不可用 | 正式能力，仍需限制下游资源 |
| 结构化并发等预览能力 | 不适用 | 不纳入本模块正式示例 |

Java 8 的 `ExecutorService` 不能直接按 Java 21 的资源块写法关闭；旧工程应明确 `shutdown`、等待、必要时取消和中断恢复。补一个关闭调用不等于所有忽略中断的任务都已停止。

## 二、实现与版本

### 1. 锁与上下文

`synchronized`、`volatile` 和 happens-before 的必要语义不会因升级就取消。旧代码中的数据竞争仍然是错误，不能依赖某个 JDK 恰好运行正常。

虚拟线程主要降低大量阻塞任务占用平台线程的成本，不增加 CPU 核心或数据库连接容量。Java 21 的监视器固定载体线程还需通过实际事件判断，见[虚拟线程](../11-concurrency/12-virtual-threads.md)。

### 2. JFR 与发行版

Java 21 提供集成 JFR 与相应工具；Java 8 的可用性、更新回移和支持条件依赖实际发行版。不要简单写成“所有 Java 8 都没有 JFR”或“所有版本完全相同”。

容器感知同样与更新版本和平台有关。应在真实部署环境核对可见 CPU、内存和进程限制，本机 Windows 结果不能替代容器验证。

## 三、收集器基线

本例只使用 JDK 工具，在空目录创建下方两个 UTF-8 文件。安装 JDK 8 和 JDK 21 后，设置本终端环境变量：

```powershell
$env:JAVA8_HOME = Read-Host 'JDK 8 安装目录'
$env:JAVA21_HOME = Read-Host 'JDK 21 安装目录'
$env:JAVA_HOME = $env:JAVA21_HOME
& "$env:JAVA8_HOME/bin/java.exe" -version
& "$env:JAVA21_HOME/bin/java.exe" -version
```

将以下内容保存为 `src/order/compat/OrderRules.java`：

::: details 查看 OrderRules.java 完整内容

```java [src/order/compat/OrderRules.java]
package order.compat;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.ResolverStyle;
import java.util.Date;
import java.util.Locale;

/** 保留 Java 8 可用的业务规则，同时对照旧日期解析与 java.time。 */
public final class OrderRules {
    /** 禁止实例化无状态规则工具。 */
    private OrderRules() { }

    /**
     * @param priceCents 单价分，必须非负。
     * @param quantity 数量，必须为正数。
     * @return 精确金额分；输入非法或乘法溢出时抛出异常。
     */
    public static long total(long priceCents, int quantity) {
        if (priceCents < 0 || quantity < 1) throw new IllegalArgumentException("invalid order amount");
        return Math.multiplyExact(priceCents, (long) quantity);
    }

    /** @param value yyyy-MM-dd 完整日期，采用严格解析。 @return 与旧规则相同的 UTC 当日零点。 */
    public static Date modernDate(String value) {
        DateTimeFormatter format = DateTimeFormatter.ofPattern("uuuu-MM-dd", Locale.ROOT)
                .withResolverStyle(ResolverStyle.STRICT);
        return Date.from(LocalDate.parse(value, format).atStartOfDay(ZoneOffset.UTC).toInstant());
    }
}
```

:::

将以下内容保存为 `src/order/compat/CompatProbe.java`：

::: details 查看 CompatProbe.java 完整内容

```java [src/order/compat/CompatProbe.java]
package order.compat;

import java.lang.management.ManagementFactory;

/** 提供双运行时的版本与业务结果入口。 */
public final class CompatProbe {
    /** 禁止实例化命令入口。 */
    private CompatProbe() { }

    /** @param args 不使用参数；输出实际运行时和同一订单结果。 */
    public static void main(String[] args) {
        System.out.println("java=" + System.getProperty("java.version"));
        System.out.println("totalCents=" + (OrderRules.total(1990, 2) + OrderRules.total(990, 1)));
        System.out.println("date=" + OrderRules.modernDate("2026-09-10").toInstant());
        for (java.lang.management.GarbageCollectorMXBean collector : ManagementFactory.getGarbageCollectorMXBeans()) {
            System.out.println("collector=" + collector.getName());
        }
    }
}
```

:::

先由 JDK 21 按 Java 8 目标编译，再运行同一组类文件：

```powershell
& "$env:JAVA21_HOME/bin/javac.exe" --release 8 -encoding UTF-8 -d out src/order/compat/OrderRules.java src/order/compat/CompatProbe.java
& "$env:JAVA8_HOME/bin/java.exe" -cp out order.compat.CompatProbe
& "$env:JAVA21_HOME/bin/java.exe" -cp out order.compat.CompatProbe
```

本机 Java 8.0_491 返回 `PS Scavenge` 与 `PS MarkSweep`，对应 Parallel 系列；Corretto 21.0.11 返回 G1 管理名称。两次金额均为 4970 分、日期均为 `2026-09-10T00:00:00Z`。

这些名称说明本次实际选择，不能据此推导所有发行版或小资源环境的默认值。运行升级与收集器切换应分别评估，否则难以解释变化来源。

## 四、参数不兼容

Java 21 使用统一日志 `-Xlog`，Java 8 的旧 GC 日志选项具有不同语法。用两套 JDK 核对启动参数：

```powershell
& "$env:JAVA8_HOME/bin/java.exe" -XX:+PrintCommandLineFlags -version
& "$env:JAVA21_HOME/bin/java.exe" -XX:+PrintCommandLineFlags -version
& "$env:JAVA8_HOME/bin/java.exe" -Xlog:gc -version
```

第三条实际失败并包含 `Unrecognized option: -Xlog:gc`，程序没有启动。处理方式是为 Java 8 使用该版本支持的日志配置，不是忽略失败继续记录“验证成功”。

::: warning 启动参数不能整体照搬
旧收集器和部分诊断选项在新版本可能被移除或改变语义。逐项核对目标 JDK 帮助与生效值，保留原配置作为回退依据。
:::

## 五、恢复与回归

升级后测试超时取消、线程池关闭、上下文清理、Agent 启动和诊断采集，比较同负载 CPU、暂停、进程内存和错误率。无法满足目标时恢复经过验证的旧运行时与配置，并保留失败证据。

## 六、参考资料

- [Java 8 工具文档](https://docs.oracle.com/javase/8/docs/technotes/tools/windows/java.html)
- [Java 21 启动器](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html)
- [JEP 444](https://openjdk.org/jeps/444)

以上资料说明工具和虚拟线程边界。
