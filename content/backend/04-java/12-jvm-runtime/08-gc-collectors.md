---
title: "垃圾收集器选型"
tags: [Java, GC, G1, ZGC]
excerpt: "在 Java 21 HotSpot 范围内比较 Serial、Parallel、G1 和分代 ZGC，解释分区、暂停目标和并发余量，用实际启动验证与场景决策明确选择条件。"
date: 2026-09-10
---


# 垃圾收集器选型

收集器选择要服务于响应延迟、吞吐和资源预算。没有脱离负载的最佳方案，同一个低暂停收集器在 CPU 紧张或内存余量不足的环境中也可能无法满足应用目标。

## 一、候选方案

| 收集器 | 主要目标 | 候选场景 | 需要承担的代价 |
|--------|----------|----------|----------------|
| Serial | 降低协调复杂度 | 小工具、小堆、暂停要求宽松 | 单线程回收期间暂停 |
| Parallel | 批量工作吞吐 | 可接受暂停的离线任务 | 停顿式回收与尾延迟 |
| G1 | 平衡暂停与吞吐 | 普通服务端应用 | 记忆集、并发标记与转移成本 |
| ZGC | 缩短暂停 | 严格延迟目标、有足够资源余量 | 并发 CPU、屏障和可用空间 |

Java 21 HotSpot 在常见服务端环境使用 G1 作为默认起点，受限环境的实际选择仍应查看启动日志。发行版与平台也可能影响可用收集器，不能只看 JDK 主版本。


## 二、G1 的区域模型


### 1. Region 与回收集合

G1 将堆划为等大小 Region，按需要承担 Eden、Survivor、Old 等角色。年轻区域不必物理连续，回收集合可根据当前目标和收益调整。

并发标记帮助估计老 Region 存活情况，Mixed 回收可同时选择年轻 Region 和部分老 Region。Humongous 对象采用特殊区域分配方式，大量此类对象需要结合实际 Region 大小和日志观察。


### 2. 暂停软目标

`MaxGCPauseMillis` 为 G1 提供暂停目标，不是实时期限保证。存活集、复制量、线程到达安全点时间和可用 CPU 都会影响实际暂停。

人为固定年轻代大小可能限制 G1 的自适应选择。调参前应先确定分配、存活和回收证据，不能用一套固定比例覆盖所有负载。


## 三、Java 21 ZGC

ZGC 将大量标记和转移工作与应用并发执行。应用持续分配时，收集器需要在空间耗尽前完成足够工作，因此堆余量和 CPU 预算是选型前提。

Java 21 提供分代 ZGC，通过 `-XX:+UseZGC -XX:+ZGenerational` 显式启用。该版本只使用 `UseZGC` 与同时启用分代模式不是同一配置，后续 JDK 的模式和参数又有演进，应按目标版本核对。

::: warning 低暂停不等于无限容量
若活对象持续增长或分配速度超过可回收速度，ZGC 仍可能出现分配停顿或内存失败。切换收集器不能消除无界缓存和下游积压。
:::


## 四、核对实际启用

使用下方给出的同一分配程序，分别启动四个独立 JVM 进程：

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


```powershell
java -XX:+UseSerialGC -Xms64m -Xmx64m -Xlog:gc -cp out RuntimeLab allocation
java -XX:+UseParallelGC -Xms64m -Xmx64m -Xlog:gc -cp out RuntimeLab allocation
java -XX:+UseG1GC -Xms64m -Xmx64m -Xlog:gc -cp out RuntimeLab allocation
java -XX:+UseZGC -XX:+ZGenerational -Xms64m -Xmx64m -Xlog:gc -cp out RuntimeLab allocation
```

本地 Java 21.0.11 四次执行均完成，结果为 `retained=64, checksum=375876`。日志分别确认 Serial、Parallel、G1 和 ZGC；这证明当前平台能够启动并执行该负载，没有形成生产性能排名。

参数拼错或在不支持的平台运行时，应保留启动器错误，先修正可用性。不要因为启动失败就把参数静默删除，再把默认收集器的结果记作候选结果。


## 五、比较与回退

一个订单查询服务若 P99 不达标，应先确认延迟窗口与 GC 暂停重叠。若多数时间在等数据库连接，切换收集器缺乏证据；若暂停明确超标，才在同样流量和资源限制下加入候选比较。

1. 固定 JDK、应用、堆预算、数据、预热与负载，保存默认方案基线。
2. 仅替换收集器，比较吞吐、响应分位、暂停、CPU、进程内存与错误率。
3. 覆盖稳定负载、峰值和下游变慢，检查分配余量是否仍然充足。
4. 目标改善且附带成本可接受时保留，否则恢复原启动配置与原运行时。

::: tip 决策要包含代价
“暂停降低但 CPU 超过配额”不是完成优化。为候选方案记录目标、约束、证据和回退条件，才能在升级后重新核对。
:::

## 六、参考资料

- [Java 21 GC 指南](https://docs.oracle.com/en/java/javase/21/gctuning/)
- [G1 调优](https://docs.oracle.com/en/java/javase/21/gctuning/garbage-first-garbage-collector-tuning.html)
- [JEP 439](https://openjdk.org/jeps/439)

以上资料说明各收集器与 Java 21 分代 ZGC 的范围。
