---
title: "解释执行与 JIT"
tags: [Java, JVM, JIT]
excerpt: "解释 HotSpot 的解释执行、分层编译、OSR、内联与去优化，使用金额方法的实际编译日志观察热点，并区分正确性校验、预热现象和可靠的性能测量。"
date: 2026-09-10
---


# 解释执行与 JIT

解释器直接执行字节码语义，JIT 编译器在运行期间把适合优化的方法或代码区域转换为机器码。HotSpot 可以在两者之间切换，用运行时信息改善持续执行的效率。


## 一、分层执行


### 1. 从采样到编译

默认分层编译可以结合解释器、C1 和 C2。运行过程中收集调用频率、循环和类型等信息，再决定是否编译以及采用何种优化层级；不是每个方法都必然经历全部层级。

冷启动阶段还包含类加载、初始化、缓存建立和连接准备。看到首次调用更慢，不能把全部差异都归因于 JIT。


### 2. OSR 与去优化

OSR 允许正在执行的长循环转入编译后的代码，不必等待整个方法重新调用。编译日志中的 `%` 常用于标识这种编译。

优化可能基于运行时观察到的类型或分支。如果假设失效，JVM 可以使相应代码失效并恢复到更通用的执行状态。去优化是维护语义的一部分，出现一次不等于性能事故。


## 二、优化的条件

| 优化 | 解决的问题 | 观察边界 |
|------|------------|----------|
| 内联 | 消除调用开销并扩大优化范围 | 受热度、大小、类型信息和预算限制 |
| 逃逸分析与标量替换 | 减少不必要的对象分配 | 不是所有局部对象都能消除 |
| 锁消除 | 删除已证明不需要的同步 | 不能依赖它修复错误的并发代码 |
| 循环优化 | 减少重复检查或计算 | 必须保持可观察语义 |

::: info 源码与机器码不同
在源码里写出一次对象创建或一次方法调用，不代表运行时一定保留同样形态。反过来，编译日志出现某个方法，也不保证它在所有调用点都已内联。
:::


## 三、观察订单热点

### 1. 固定计算入口

`RuntimeLab.java` 的 `warm` 连续计算 200 万次金额，数量循环使用 1、2、3，最后消费总和。这里只验证计算结果与编译事件，不用循环耗时宣称吞吐提升。

下面创建用于观察热点编译的独立程序，并在其目录中执行：

在任意位置新建空目录，使用 JDK 21，将下面的文件保存到该目录。后续命令均在此目录执行。

保存为 `RuntimeLab.java`：

::: details 查看 RuntimeLab.java 完整代码

```java [RuntimeLab.java]
/** 用有限工作量观察 Java 21 HotSpot；各模式独立进程执行。 */
public final class RuntimeLab {
    private static volatile long checksum;

    /** 禁止实例化命令入口。 */
    private RuntimeLab() { }
    /**
     * 执行当前观察场景并输出结果，无返回值。
     * @param args 只接受一个参数：jit
     * @throws Exception 参数不合法或观察失败时终止当前进程
     */
    public static void main(String[] args) throws Exception {
        if (args.length != 1) {
            throw new IllegalArgumentException("expected mode: jit");
        }
        switch (args[0]) {
            case "jit" -> warm();
            default -> throw new IllegalArgumentException("unknown mode");
        }
    }

    /** 反复调用金额方法并消费结果，只用于观察编译，不作为微基准。 */
    private static void warm() {
        long sum = 0;
        for (int index = 0; index < 2_000_000; index++) {
            sum += OrderMath.total(1990, index % 3 + 1);
        }
        checksum = sum;
        System.out.println("checksum=" + checksum);
    }
}
```

:::

保存为 `OrderMath.java`：

::: details 查看 OrderMath.java 完整代码

```java [OrderMath.java]
/** 提供可反汇编和预热的订单金额计算，不包含外部状态。 */
public final class OrderMath {
    /** 禁止实例化无状态计算工具。 */
    private OrderMath() { }

    /**
     * @param priceCents 单价分，必须非负。
     * @param quantity 数量，必须为正数。
     * @return 精确金额分；非法输入或溢出时抛出异常。
     */
    public static long total(long priceCents, int quantity) {
        if (priceCents < 0 || quantity < 1) {
            throw new IllegalArgumentException("invalid order amount");
        }
        return Math.multiplyExact(priceCents, quantity);
    }
}
```

:::

使用 UTF-8 编译本篇文件：

```powershell
javac -encoding UTF-8 --release 21 -Xlint:all -Werror -d out RuntimeLab.java OrderMath.java
```


```powershell
New-Item -ItemType Directory -Force target | Out-Null
java -Xbatch -XX:+PrintCompilation -cp out RuntimeLab jit > target/jit.txt
Select-String -Path target/jit.txt -Pattern 'OrderMath::total|checksum='
java -Xint -cp out RuntimeLab jit
```

### 2. 读取结果

实际编译日志包含 `OrderMath::total`，普通混合执行和 `-Xint` 解释执行均返回：

```text
checksum=7959998010
```

编译编号、时间和出现次数会变化。`-Xbatch` 使当前观察更容易等待编译完成，但改变执行策略，只用于本地证据采集，不应直接复制为生产优化参数。

若没有看到目标方法，先确认输入规模、类名和日志是否来自当前进程。不要通过删除结果消费来“减少干扰”，那可能让被测工作被优化掉。

## 四、测量可信度

单进程的一次计时会混入预热、GC、CPU 调度和系统负载。常量输入可能被折叠，无人消费的计算可能被消除，手工循环还会改变优化机会。

需要比较 API 或算法时，应使用 JMH 等成熟微基准工具，设置独立进程、预热、测量轮次和代表性输入，并保留环境与误差。当前示例没有执行 JMH，也没有提供性能排名。

::: warning 正确性结果不能代替性能结论
两种模式得到同一总和，只证明这组输入的结果一致。生产选项还需要请求延迟、吞吐、CPU、内存和异常负载对照，不能根据一个编译事件决定调参。
:::

## 五、参考资料

- [HotSpot 分层编译说明](https://docs.oracle.com/en/java/javase/21/vm/java-hotspot-virtual-machine-performance-enhancements.html)
- [Java 21 编译选项](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html)
- [JMH 项目](https://github.com/openjdk/jmh)

以上资料提供机制和测量依据。
