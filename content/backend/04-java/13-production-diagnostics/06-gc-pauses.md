---
title: "GC 暂停诊断"
tags: [Java, GC, JFR]
excerpt: "关联暂停、分配、存活集与服务时间线，使用固定工作量的 32 MiB 和 64 MiB 堆实验解释容量假设与证据边界，区分分配压力、晋升和无效对象保留。"
date: 2026-09-10
---


# GC 暂停诊断

GC 发生是正常行为，诊断目标是确认回收是否破坏响应、吞吐或容量目标。请求变慢与 GC 同时出现也不自动构成因果关系，需要观察暂停窗口、分配和业务阶段。

## 一、关联时间线


### 1. 请求与暂停

先确认异常请求在哪个实例、什么时间变慢，再对齐 GC 日志和 JFR。暂停期间应用无法正常推进，但一个持续数秒的连接等待，不能由不重叠的毫秒级暂停解释。

统一日志中的时间、uptime、GC 编号和收集原因帮助关联多个阶段。安全点等待与实际收集工作应分别看，不能只截取一条 GC 子阶段耗时作为全部停顿。


### 2. 分配与存活

高分配率会增加年轻 GC 和 CPU，回收后占用仍可能稳定。若存活集持续上升，应检查在途请求、缓存、批处理和引用链；对象晋升与大对象分配则需结合当前收集器术语解释。

| 证据组合 | 候选原因 | 下一项验证 |
|----------|----------|------------|
| 频繁回收、释放比例高 | 分配量大或堆余量小 | 分配调用栈与进程预算 |
| 回收后占用持续上升 | 活跃数据增长或泄漏 | 保留路径与业务生命周期 |
| Full GC、晋升或转移失败 | 存活和分配超出当前余量 | 老区域、Humongous、CPU 与空间 |
| GC 暂停低、请求仍慢 | 主要耗时位于别处 | 线程、连接池与下游 |

## 二、容量假设实验

### 1. 相同输入与配置

使用 `RuntimeLab allocation`，固定分配 3000 个 64 KiB 数组，只保留最近 64 个。JDK 21.0.11、G1 和 JFR profile 不变，对比 32 MiB 与 64 MiB 堆。

在该目录完成[编译](../12-jvm-runtime/01-jvm-execution.md#三、核对运行环境)后执行：

使用 JDK 21，在任意位置新建空目录并保存下方完整文件。所有命令均以该目录为工作目录；需要持续观察的程序在终端 A 启动，取证命令在同目录的终端 B 执行。

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

先编译本篇源码：

```powershell
javac -encoding UTF-8 --release 21 -Xlint:all -Werror -d out RuntimeLab.java
```


```powershell
New-Item -ItemType Directory -Force target | Out-Null
java -XX:+UseG1GC -Xms32m -Xmx32m "-Xlog:gc*:file=target/heap-32.log:uptime,level,tags" "-XX:StartFlightRecording=filename=target/heap-32.jfr,settings=profile,dumponexit=true" -cp out RuntimeLab allocation
java -XX:+UseG1GC -Xms64m -Xmx64m "-Xlog:gc*:file=target/heap-64.log:uptime,level,tags" "-XX:StartFlightRecording=filename=target/heap-64.jfr,settings=profile,dumponexit=true" -cp out RuntimeLab allocation
```

### 2. 本地结果

两次都输出 `retained=64, checksum=375876`，JFR 均包含垃圾收集事件。一轮实际日志的完成暂停行统计如下：

| 堆容量 | 完成暂停行数 | 首次暂停 |
|--------|--------------|----------|
| 32 MiB | 37 | 16M→3M，7.547 ms |
| 64 MiB | 7 | 22M→2M，6.853 ms |

统计入口如下，只筛选含最终耗时的完成行，避免把开始事件重复计算：

```powershell
(Select-String -Path target/heap-32.log -Pattern 'Pause .*ms\s*$').Count
(Select-String -Path target/heap-64.log -Pattern 'Pause .*ms\s*$').Count
jfr summary target/heap-32.jfr
jfr summary target/heap-64.jfr
```

扩大堆在本轮减少了回收频率，首次暂停也略有下降。但一次暂停不能代表全部请求的尾延迟；仍需统计完整窗口，并结合业务响应评估，短启动负载不足以计算稳定的生产分位数。

::: warning 不把一次容量对照写成生产建议
本例包含启动和录制开销，未模拟真实请求、容器配额或长期存活数据。不同运行的次数与耗时可以变化，32 MiB 和 64 MiB 只是实验参数。
:::


## 三、从证据选择处理

如果分配热点来自一次性读取全部订单，应先减少查询批次或流式处理；若是重复序列化和日志构造，应减少无效工作。盲目对象池化可能延长生命周期并引入竞争。

需要扩大堆时先确认进程总预算，不能挤占本地内存或触发容器终止。需要换收集器时，采用[收集器选型](../12-jvm-runtime/08-gc-collectors.md)的同负载比较，包含 CPU、暂停、吞吐和失败场景。

## 四、恢复与回退

保留原始参数，调整后继续观察完整业务窗口。若暂停改善但 RSS、错误率或下游积压恶化，恢复原配置并修正假设。

本地实验进程完成固定工作量后自行退出。JFR 应可读取、输出校验和一致；日志路径不可写、录制缺失或工作未完成时，这一轮不得纳入成功对照。

## 五、参考资料

- [Java 21 GC 指南](https://docs.oracle.com/en/java/javase/21/gctuning/)
- [jfr 命令](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jfr.html)

以上资料说明收集与事件证据。
