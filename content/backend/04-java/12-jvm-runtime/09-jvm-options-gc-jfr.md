---
title: "JVM 参数与运行观测"
tags: [Java, JVM, GC, JFR]
excerpt: "从进程内存预算建立 JVM 参数基线，掌握统一日志和 JFR 的采集、读取与边界，通过固定分配负载的双堆容量实验说明调整前后的证据要求。"
date: 2026-09-10
---


# JVM 参数与运行观测

JVM 参数表达运行目标和资源约束，日志与 JFR 用于核对实际行为。调优应先保留环境、负载和结果基线，再改变一个主要因素，不能凭参数数量判断配置质量。


## 一、参数与预算


### 1. 参数类别

`--class-path`、`-D` 等描述启动和系统属性，`-X` 提供扩展选项，`-XX` 主要控制 HotSpot 实现行为。升级 JDK 时需要重新核对非标准参数，已经移除的选项可能直接阻止启动。

在目标 JDK 上查看帮助和最终值，实际进程还可用 `jcmd` 获取生效快照：

```powershell
java --help
java -X
java -XX:+PrintFlagsFinal -version
```


### 2. 内存组成

| 预算项 | 常用控制或观察 | 注意点 |
|--------|----------------|--------|
| 堆 | `-Xms`、`-Xmx` | 初始与最大目标，不是进程总上限 |
| 平台线程栈 | `-Xss`、线程数量 | 调用深度与总线程预算一起核对 |
| 类元数据 | `MaxMetaspaceSize`、类加载统计 | `MetaspaceSize` 主要影响相关 GC 阈值 |
| 代码缓存 | `ReservedCodeCacheSize`、编译状态 | 先证明压力，再调整 |
| 直接缓冲区 | `MaxDirectMemorySize`、BufferPool | 不涵盖所有本地分配 |
| JVM 与本地库 | NMT、进程内存 | 跟踪范围与操作系统视图不同 |

容器或主机上限还需留出突发余量。百分比堆参数依赖 JVM 识别到的资源，显式 `-Xmx` 也必须与实际限额匹配；本机普通进程测试不能证明容器部署已满足预算。


## 二、统一日志

统一日志使用标签、级别、输出和装饰字段组织证据。例如 `gc*` 匹配带 GC 标签的相关日志，`safepoint` 补充应用暂停协调信息；在 PowerShell 中为整个选项加引号。

以下为 Java 21 日志语法，先创建目标目录，再将该选项放在主类之前：

```text
-Xlog:gc*,safepoint=info:file=target/gc.log:time,uptime,level,tags:filecount=5,filesize=20m
```

文件路径由目标 JVM 解析。目录不存在或不可写会导致初始化失败，不能把日志缺失解释为没有发生 GC。生产日志需限制轮转体积，并使时间与请求指标可关联。


## 三、JFR 事件


### 1. 录制与读取

Java Flight Recorder 记录 GC、编译、采样、锁和 I/O 等事件。`default` 与 `profile` 的启用范围、阈值和成本不同；短时性能观察可使用 `profile`，不能假设它无开销。

以下程序通过启动参数录制，在进程结束时写入文件。先保存并编译程序，再进行双容量录制；产物生成后用 `jfr summary` 确认时间范围与事件数量。

在任意位置新建空目录，使用 JDK 21，将下面的文件保存到该目录。后续命令均在此目录执行。

保存为 `RuntimeLab.java`：

::: details 查看 RuntimeLab.java 完整代码

```java [RuntimeLab.java]
/** 用有限工作量观察 Java 21 HotSpot；各模式独立进程执行。 */
public final class RuntimeLab {
    private static volatile Object retained;
    private static volatile long checksum;

    /** 禁止实例化命令入口。 */
    private RuntimeLab() { }
    /**
     * 执行当前观察场景并输出结果，无返回值。
     * @param args 只接受一个参数：allocation
     * @throws Exception 参数不合法或观察失败时终止当前进程
     */
    public static void main(String[] args) throws Exception {
        if (args.length != 1) {
            throw new IllegalArgumentException("expected mode: allocation");
        }
        switch (args[0]) {
            case "allocation" -> allocate();
            default -> throw new IllegalArgumentException("unknown mode");
        }
    }

    /** 分配 3000 个 64 KiB 数组，仅保留最近 64 个，固定工作量便于对照。 */
    private static void allocate() {
        byte[][] ring = new byte[64][];
        long sum = 0;
        for (int index = 0; index < 3000; index++) {
            byte[] payload = new byte[64 * 1024];
            payload[0] = (byte) index;
            ring[index % ring.length] = payload;
            sum += Byte.toUnsignedInt(payload[0]);
        }
        retained = ring;
        System.out.println("retained=" + ring.length + ", checksum=" + sum);
    }
}
```

:::

使用 UTF-8 编译本篇文件：

```powershell
javac -encoding UTF-8 --release 21 -Xlint:all -Werror -d out RuntimeLab.java
```





### 2. 证据边界

事件未出现可能来自窗口、配置、阈值或采样，而非行为不存在。JFR 还可能包含路径、线程和业务字段，应按诊断数据管理。

::: warning 采集前确认成本
堆统计、根路径和高频事件会增加额外工作。先确定要区分的假设，再选事件；详细记录不应无限期运行。
:::


## 四、双容量实验


### 1. 固定工作量

使用 `RuntimeLab allocation`，两次都分配 3000 个 64 KiB 数组、保留最近 64 个，只改变堆容量。JDK、G1、录制配置与源码保持一致，使用上方已编译的本篇程序。

在本篇示例目录执行：

```powershell
New-Item -ItemType Directory -Force target | Out-Null
java -XX:+UseG1GC -Xms32m -Xmx32m "-Xlog:gc*:file=target/heap-32.log:uptime,level,tags" "-XX:StartFlightRecording=filename=target/heap-32.jfr,settings=profile,dumponexit=true" -cp out RuntimeLab allocation
java -XX:+UseG1GC -Xms64m -Xmx64m "-Xlog:gc*:file=target/heap-64.log:uptime,level,tags" "-XX:StartFlightRecording=filename=target/heap-64.jfr,settings=profile,dumponexit=true" -cp out RuntimeLab allocation
```


### 2. 对照观察

先读取上面命令实际生成的录制文件：

```powershell
jfr summary target/heap-32.jfr
jfr print --events jdk.GarbageCollection,jdk.GCPhasePause target/heap-32.jfr
```

两次实际输出都包含 `retained=64, checksum=375876`，两份 JFR 均能读取并包含垃圾收集事件。使用以下命令列出完成的暂停行，避免同时把 `gc,start` 计作另一次暂停：

```powershell
Select-String -Path target/heap-32.log -Pattern 'Pause .*ms\s*$'
Select-String -Path target/heap-64.log -Pattern 'Pause .*ms\s*$'
```

依次比较暂停次数、总暂停、回收后占用和峰值。固定工作量适合检查回收行为，不能用这个很短的启动实验计算服务 P99；录制自身的分配也计入了进程。


## 五、调整与恢复

假设扩大堆能缓解分配频率，应同时确认进程内存仍有余量、暂停没有恶化、业务吞吐和错误率满足目标。若回收后存活集持续增长，则应先定位保留关系，扩大堆只能改变耗尽时间。

保留原配置和原始日志，每次只改变一个主要因素；不满足目标时恢复原参数，并用相同负载重新核对。正式诊断还需要实例、时间线和故障恢复证据，见[生产诊断方法](../13-production-diagnostics/01-diagnostic-method.md)。

## 六、参考资料

- [Java 21 启动参数](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html)
- [jfr 命令](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jfr.html)
- [jcmd 命令](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html)

以上资料说明选项、事件读取和影响边界。
