---
title: "进程与 jcmd"
tags: [Java, jcmd, 诊断]
excerpt: "确认目标 JVM、JDK、命令行和 Attach 边界，按实际帮助选择诊断命令，通过有界本地进程验证版本、参数、堆信息与未启用 NMT 的失败表现。"
date: 2026-09-10
---


# 进程与 jcmd

`jcmd` 是向运行中 JVM 发送诊断命令的 JDK 工具。执行前需要确认目标 PID、实例和运行版本，再读取该 JVM 实际支持的命令；终端默认 JDK 与目标 JVM 可以不同。


## 一、确认目标


### 1. PID 与实例

`jcmd -l` 列出可发现的 Java 进程，配合主类、启动参数、工作目录和实例标识核对目标。不要根据列表第一项选择，也不要使用 `jcmd 0` 向多个无关 JVM 发送命令。

容器内外可能存在不同 PID 命名空间。生产环境优先在匹配的进程环境中使用目标 JDK 工具，不能直接把宿主机 PID 当作容器内 PID。

### 2. 权限与兼容

工具通常需要与目标进程相同的用户权限，并受 Attach、临时目录和安全配置影响。优先使用同发行版、同主版本工具，失败后先核对原因，不并发重复 Attach。

::: warning 输出也包含环境信息
命令行和系统属性可能带有路径、代理和业务参数。只采集当前问题需要的内容，转交时去除敏感值。
:::


## 二、启动可控目标

下方程序 `DiagnosticLab` 的 `idle` 模式不注入故障，最多运行 60 秒。使用 JDK 21，在本篇新建的示例目录执行：

使用 JDK 21，在任意位置新建空目录并保存下方完整文件。所有命令均以该目录为工作目录；需要持续观察的程序在终端 A 启动，取证命令在同目录的终端 B 执行。

保存为 `DiagnosticLab.java`：

::: details 查看 DiagnosticLab.java 完整代码

```java [DiagnosticLab.java]
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.concurrent.TimeUnit;

/** 仅用于本地故障注入；限制存活量和寿命，所有工作线程为守护线程。 */
public final class DiagnosticLab {
    private static volatile boolean running = true;

    /** 禁止实例化诊断入口。 */
    private DiagnosticLab() { }
    /**
     * 启动本地观察目标；输出 PID 和状态，并接收 stop 命令。
     * @param args 两个参数：模式 idle，以及存活秒数 1..60
     * @throws Exception 参数非法、初始化或控制输入失败时终止当前进程
     */
    public static void main(String[] args) throws Exception {
        if (args.length != 2) throw new IllegalArgumentException("expected mode and seconds");
        String mode = args[0];
        int seconds = Integer.parseInt(args[1]);
        if (seconds < 1 || seconds > 60) throw new IllegalArgumentException("seconds must be 1..60");
        switch (mode) {
            case "idle" -> { }
            default -> throw new IllegalArgumentException("unknown mode");
        }
        System.out.println("READY pid=" + ProcessHandle.current().pid() + " mode=" + mode + " time=" + Instant.now());
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(seconds);
        BufferedReader input = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
        try {
            while (System.nanoTime() < deadline) {
                if (input.ready()) {
                    String command = input.readLine();
                    if ("stop".equals(command)) break;
                }
                Thread.sleep(50);
            }
        } finally {
            running = false;
            System.out.println("STOPPED");
        }
    }
}
```

:::

先编译本篇源码：

```powershell
javac -encoding UTF-8 --release 21 -Xlint:all -Werror -d out DiagnosticLab.java
```


```powershell

java -Xms32m -Xmx64m -cp out DiagnosticLab idle 30
```

看到 `READY pid=... mode=idle time=...` 后，在第二个 PowerShell 终端执行以下命令。`Read-Host` 输入刚刚核对的数字 PID，避免误用 PowerShell 只读变量 `$PID`：

```powershell
$javaPid = [int](Read-Host 'Java PID')
jcmd $javaPid VM.version
jcmd $javaPid VM.command_line
jcmd $javaPid VM.flags
jcmd $javaPid GC.heap_info
jcmd $javaPid help
```

本地实际输出确认 HotSpot 21.0.11、入口 `DiagnosticLab idle 30`，最大堆标志为 67108864 字节。进程到期输出 `STOPPED retained=0` 后结束，也可在其前台输入 `stop` 提前退出。


## 三、选择命令

| 命令 | 观察目标 | 使用条件 |
|------|----------|----------|
| `VM.version`、`VM.command_line` | 运行时与启动方式 | 基线确认 |
| `VM.flags` | 生效的 JVM 标志 | 与启动脚本交叉检查 |
| `GC.heap_info` | 当前堆和元空间概况 | 不能得到保留路径 |
| `Thread.print -l` | 平台线程、栈和部分锁 | 结合多次快照与业务窗口 |
| `JFR.start/check/stop` | 一段时间的运行事件 | 限制窗口与输出 |
| `GC.class_histogram`、`GC.heap_dump` | 实例统计、对象图 | 先检查影响、磁盘与必要性 |

执行高成本命令前，使用 `jcmd $javaPid help GC.heap_dump` 等获取当前版本帮助。选项是否可用、是否触发额外工作，应以目标进程的返回为准。


## 四、失败与恢复


### 1. 采集能力未启用

在上述未开启 NMT 的进程上运行：

```powershell
jcmd $javaPid VM.native_memory summary
```

实际输出包含：

```text
Native memory tracking is not enabled
```

这不是堆外内存为零，也不能在这个进程里补加启动参数。需要本地重新启动启用 NMT 的目标，生产则按既有变更与恢复安排处理。


### 2. Attach 或路径失败

目标已退出、权限不匹配或 Attach 被限制时，采集可能失败。先核对进程仍存在、工具版本和诊断通道；若进程正严重停顿，优先保留已有日志与系统证据，不无期限重试。

诊断文件由目标 JVM 写入。使用目标用户可写的绝对路径，检查空间和文件是否已经存在，再验证输出文件能读取，而非只检查命令已返回。

## 五、参考资料

- [Java 21 jcmd 文档](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html)
- [NMT](https://docs.oracle.com/en/java/javase/21/vm/native-memory-tracking.html)

以上资料说明启用边界。
