---
title: "JVM面试题"
category: "面试题"
tags:
  - JVM
  - 垃圾回收
  - 类加载
excerpt: "围绕 JVM 运行时内存区域、对象分配与晋升、可达性分析与引用类型、垃圾回收算法和 G1/ZGC、类加载与双亲委派，以及 OOM 和频繁 GC 的排查等面试题，说明机制、参数与诊断证据。"
---

# JVM面试题

JVM 题需要把“内存怎么划分、对象何时被回收、类怎么加载”和可观察的证据联系起来。回答参数和收集器问题时，必须说明 JDK 版本，因为默认收集器、内存区域和日志参数都发生过变化。

::: info 版本边界
本篇以 HotSpot JDK 21 为准。永久代、CMS 等内容只在与 Java 8 对比时出现：永久代在 JDK 8 被元空间取代，CMS 在 JDK 14 被移除。
:::

## 一、内存区域与对象

### 1. JVM 运行时内存分为哪些区域？

**线程私有区域有程序计数器、虚拟机栈和本地方法栈；线程共享区域有堆和方法区。** 直接内存不属于虚拟机规范定义的运行时数据区，但会受 `-XX:MaxDirectMemorySize` 限制并可能导致 OOM。

| 区域 | 共享性 | 存放内容 | 常见错误 |
|------|--------|----------|----------|
| 程序计数器 | 线程私有 | 当前执行的字节码地址 | 不会 OOM |
| 虚拟机栈 | 线程私有 | 栈帧：局部变量表、操作数栈、返回地址 | 递归过深 `StackOverflowError` |
| 本地方法栈 | 线程私有 | native 方法调用 | 同上 |
| 堆 | 共享 | 对象实例、数组 | `Java heap space` |
| 方法区（元空间） | 共享 | 类元数据、运行时常量池 | `Metaspace` |

JDK 8 用本地内存中的元空间替代永久代，元空间默认只受物理内存限制，动态生成大量类（如滥用 CGLIB 或脚本引擎）时应设置 `-XX:MaxMetaspaceSize`。字符串常量池和静态变量在 JDK 7 起已移到堆中。

参考：[JVM 规范 SE 21：运行时数据区](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5)。

### 2. 对象是如何分配和晋升到老年代的？

**分代收集器中，新对象优先在 Eden 区分配；Minor GC 后存活对象复制到 Survivor 区并增加年龄，年龄达到阈值后晋升到老年代。**

1. **TLAB：** 每个线程在 Eden 中有私有分配缓冲区，分配对象只需移动指针，避免多线程竞争。
2. **年龄晋升：** 对象每熬过一次 Minor GC 年龄加一，达到 `-XX:MaxTenuringThreshold`（最大 15，因为年龄存于对象头的 4 位）后晋升。
3. **动态年龄判断：** Survivor 中某个年龄及以下对象的总大小超过 Survivor 一半时，大于等于该年龄的对象直接晋升。
4. **大对象：** 超过阈值的大对象直接进入老年代；G1 中超过 Region 一半大小的对象分配在 Humongous 区域。
5. **空间担保：** Survivor 放不下的存活对象直接进入老年代。

逃逸分析是另一个相关优化：JIT 判断对象不会逃出方法时，可以进行标量替换，把对象拆成局部变量，不在堆上分配。

参考：[HotSpot 调优指南：分代](https://docs.oracle.com/en/java/javase/21/gctuning/garbage-collector-implementation.html)。

### 3. 如何判断对象可以回收，四种引用有什么区别？

**HotSpot 使用可达性分析：从 GC Roots 出发沿引用链遍历，无法到达的对象可被回收。** 引用计数无法处理循环引用，主流 JVM 不采用。

GC Roots 包括：虚拟机栈中局部变量引用的对象、类的静态字段、常量、JNI 引用、被同步锁持有的对象等。

| 引用类型 | 回收时机 | 典型用途 |
|----------|----------|----------|
| 强引用 | 只要可达就不回收 | 普通变量 |
| 软引用 `SoftReference` | 内存不足时回收 | 内存敏感的缓存 |
| 弱引用 `WeakReference` | 下一次 GC 即回收 | `WeakHashMap`、`ThreadLocalMap` 的键 |
| 虚引用 `PhantomReference` | 无法取得对象，只在回收后入队通知 | 配合 `Cleaner` 释放堆外资源 |

参考：[Java 21 API：java.lang.ref](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ref/package-summary.html)。

## 二、垃圾回收

### 1. 标记清除、复制和标记整理各有什么优缺点？

**三种基础算法在碎片、空间利用率和移动对象成本之间取舍。** 分代收集让不同区域使用合适的算法。

| 算法 | 过程 | 优点 | 缺点 | 常用区域 |
|------|------|------|------|----------|
| 标记清除 | 标记存活对象，清除其余 | 不移动对象 | 产生内存碎片 | 早期老年代 |
| 复制 | 存活对象复制到另一块空间 | 无碎片，分配快 | 需要预留空间 | 新生代 |
| 标记整理 | 存活对象向一端移动 | 无碎片，不浪费空间 | 移动对象需要更新引用 | 老年代 |

新生代对象大多朝生夕死，复制少量存活对象的成本低，所以使用复制算法，Eden 与两个 Survivor 默认比例为 8:1:1。老年代存活率高，复制代价大，适合标记整理。

参考：[HotSpot 调优指南：垃圾回收基础](https://docs.oracle.com/en/java/javase/21/gctuning/garbage-collector-implementation.html)。

### 2. G1 与 ZGC 有什么区别，如何选择？

**G1 是 JDK 9 起的默认收集器，把堆划分为等大小的 Region，按回收收益优先回收垃圾最多的 Region，以可预测的停顿目标平衡吞吐；ZGC 的标记、转移和引用更新几乎都与应用线程并发执行，停顿时间通常在毫秒级以下且不随堆大小增长。**

| 收集器 | 启用参数 | 停顿特点 | 适用场景 |
|--------|----------|----------|----------|
| Serial | `-XX:+UseSerialGC` | 单线程，全程停顿 | 小内存、单核容器 |
| Parallel | `-XX:+UseParallelGC` | 多线程，追求吞吐 | 批处理、离线计算 |
| G1 | 默认，`-XX:+UseG1GC` | 目标停顿默认 200ms | 大多数服务端应用 |
| ZGC | `-XX:+UseZGC` | 亚毫秒级停顿 | 大堆、低延迟要求 |

JDK 21 通过 JEP 439 引入分代 ZGC，需要 `-XX:+UseZGC -XX:+ZGenerational` 启用；JDK 23 起分代模式成为默认，JDK 24 移除了非分代模式。G1 的 `-XX:MaxGCPauseMillis` 是目标而非保证，设得过小会导致每次回收的 Region 过少，反而更频繁地 GC。

::: tip 先看指标再换收集器
更换收集器前，先用 GC 日志确认问题是停顿过长、吞吐不足还是内存不够。若根因是对象分配速率过高或内存泄漏，换收集器只能推迟故障。
:::

参考：[JEP 439：Generational ZGC](https://openjdk.org/jeps/439)、[HotSpot 调优指南：G1](https://docs.oracle.com/en/java/javase/21/gctuning/garbage-first-g1-garbage-collector1.html)。

### 3. 什么是 STW，Minor GC、Major GC 和 Full GC 有什么区别？

**STW（Stop-The-World）指 GC 时暂停所有应用线程。** 所有收集器都有 STW 阶段，差别在于停顿多长、多频繁。

Minor GC（Young GC）只回收新生代，通常频繁但停顿短；Full GC 回收整个堆和元空间，停顿最长。Major GC 的含义在不同资料中不一致，有时指老年代回收，有时等同 Full GC，回答时应先说明口径。G1 还有 Mixed GC，同时回收新生代和部分老年代 Region。

触发 Full GC 的常见原因包括：老年代空间不足、元空间不足、代码显式调用 `System.gc()`，以及 G1 并发标记跟不上分配速度时退化为 Full GC。日志中出现 `Pause Full` 时应重点分析。

参考：[HotSpot 调优指南](https://docs.oracle.com/en/java/javase/21/gctuning/index.html)。

## 三、类加载

### 1. 类加载过程分为哪几步？

**类的生命周期中，加载、链接（验证、准备、解析）和初始化构成类加载过程。**

1. **加载：** 通过类的全限定名获取字节流，在方法区创建类元数据，并生成 `Class` 对象。
2. **验证：** 检查字节码格式和语义，防止恶意或损坏的字节码破坏 JVM。
3. **准备：** 为静态变量分配内存并设置零值；`static int count = 10` 此时为 0，`static final` 编译期常量直接赋值。
4. **解析：** 把常量池中的符号引用替换为直接引用，可以延迟到首次使用时进行。
5. **初始化：** 执行编译器生成的 `<clinit>()`，按源码顺序执行静态变量赋值和静态代码块。

初始化只在类被主动使用时触发，例如 `new`、调用静态方法、访问非常量静态字段、反射调用或初始化子类。通过子类引用父类的静态字段只会初始化父类；定义该类型的数组不会触发初始化。JVM 保证 `<clinit>()` 在多线程下只执行一次，这是静态内部类单例线程安全的依据。

参考：[JVM 规范 SE 21：加载、链接与初始化](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html)。

### 2. 什么是双亲委派，哪些场景会打破它？

**类加载器收到加载请求时先委派给父加载器，父加载器无法加载时才自己加载。** 这保证了 `java.lang.String` 等核心类始终由启动类加载器加载，用户无法用同名类替换。

JDK 9 引入模块系统后，加载器层次变为启动类加载器（Bootstrap）、平台类加载器（Platform，替代原扩展类加载器）和应用类加载器（Application）。类的唯一性由“类加载器 + 全限定名”共同决定，同名类被不同加载器加载会被视为不同类型，强转时抛出 `ClassCastException`。

| 场景 | 打破方式 | 原因 |
|------|----------|------|
| JDBC、SPI | 线程上下文类加载器 | 核心库接口需要加载应用提供的实现 |
| Tomcat | 每个 Web 应用独立加载器，优先加载自身类 | 多应用依赖不同版本的同名库 |
| 热部署、OSGi | 自定义加载器网状委派 | 模块独立替换 |

参考：[Java 21 API：ClassLoader](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ClassLoader.html)。

## 四、诊断与调优

### 1. 线上 OOM 如何排查？

**先根据错误信息确定是哪块内存溢出，再用堆转储找到占用最大的对象和它的引用链。** 不同的 OOM 信息指向不同原因。

| 错误信息 | 常见原因 |
|----------|----------|
| `Java heap space` | 内存泄漏、一次加载过多数据、堆设置过小 |
| `GC overhead limit exceeded` | 大部分时间在 GC 却回收很少，Parallel GC 下的保护机制 |
| `Metaspace` | 动态生成类过多、类加载器泄漏 |
| `Direct buffer memory` | NIO 堆外内存未释放或上限过小 |
| `unable to create native thread` | 线程数达到系统或容器限制 |

1. **预先保留现场：** 启动参数加 `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/data/dump`，OOM 时自动生成堆转储。
2. **在线获取：** 用 `jcmd <pid> GC.heap_dump /data/dump/heap.hprof` 生成转储；`jmap -histo:live` 可以快速看对象数量排行，但会触发 Full GC。
3. **分析转储：** 用 Eclipse MAT 等工具查看支配树（Dominator Tree）和 Leak Suspects，沿 GC Roots 引用链定位持有大量对象的静态集合、缓存或 ThreadLocal。
4. **验证修复：** 修复后观察老年代在 Full GC 后的占用是否稳定，而不是只看重启后的内存。

::: warning 生成堆转储会暂停应用
堆转储期间应用线程暂停，大堆可能持续数十秒，文件大小接近堆大小。生产环境应先摘除实例流量，并确认磁盘空间足够。
:::

参考：[JDK 21 故障排查指南：内存泄漏](https://docs.oracle.com/en/java/javase/21/troubleshoot/troubleshooting-memory-leaks.html)。

### 2. 频繁 Full GC 或 CPU 飙高如何定位？

**频繁 Full GC 看 GC 日志中老年代回收前后的占用；CPU 飙高要先找到占用 CPU 的线程，再看它在执行什么。**

GC 问题的排查步骤：用 `-Xlog:gc*:file=gc.log` 记录 GC 日志（JDK 9 起的统一日志格式），或用 `jstat -gcutil <pid> 1000` 每秒观察各区使用率和 GC 次数。若每次 Full GC 后老年代仍接近满，说明存活对象过多，可能存在泄漏；若回收后明显下降但很快又满，则是分配速率过高或堆偏小。

CPU 飙高的排查步骤：

1. `top -H -p <pid>` 找到 CPU 最高的线程 ID。
2. 把线程 ID 转为十六进制，例如 `printf '%x\n' 12345`。
3. 执行 `jstack <pid>`，按 `nid=0x3039` 搜索对应线程的堆栈。
4. 多次采样对比，若一直停在同一业务方法，通常是死循环或复杂计算；若是 GC 线程，回到 GC 分析。

Arthas 的 `thread -n 3` 可以直接列出 CPU 最高的 3 个线程堆栈，适合在已授权的环境快速诊断。

参考：[JDK 21 工具：jcmd](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html)、[JDK 21：统一 JVM 日志](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html#enable-logging-with-the-jvm-unified-logging-framework)。

### 3. 容器中运行 Java 应如何设置堆大小？

**JDK 10 起 JVM 能识别容器的 CPU 和内存限制，默认最大堆是可用内存的 1/4；容器场景推荐用百分比参数而不是固定 `-Xmx`。**

`-XX:MaxRAMPercentage=75.0` 让最大堆为容器内存限制的 75%，剩余空间留给元空间、线程栈、直接内存和 JVM 自身。若把 `-Xmx` 设为与容器限制相同，堆外内存一增长就会超出限制，进程被 Linux OOM Killer 杀死，此时 Java 不会抛出 `OutOfMemoryError`，日志中只能看到容器退出码 137。

用 `java -XX:+PrintFlagsFinal -version | grep MaxHeapSize` 可以在容器内确认实际生效的最大堆。

参考：[JDK 21：java 命令选项](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html)。
