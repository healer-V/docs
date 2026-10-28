---
title: "并行流"
tags:
  - Java
  - Stream
  - 并发
excerpt: "通过订单汇总和确定性反例判断流水线是否适合并行，区分结果顺序、动作顺序与执行线程，解释数据规模、拆分合并、阻塞调用和共享资源的成本，并给出顺序回退与验证方法。"
date: 2026-09-08
---

# 并行流 {#并行流的使用边界}

并行流允许框架拆分数据、处理局部结果并完成合并。它适合能够独立处理元素、正确组合结果的聚合计算；是否值得并行，还取决于计算成本、拆分成本、合并成本和运行时资源。

::: info 执行模式改变不会补齐工程保证

把 `stream()` 改成 `parallelStream()` 只改变执行模式，不会自动补齐数据一致性、线程安全、远程调用限流或事务边界。本文使用 Java 21 和本地演示数据验证语义，所有输出都用于正确性检查，不构成性能结论。

:::

## 一、可以拆分的计算需要哪些条件

已支付订单金额合计可以把列表分成若干部分，各部分筛选并求和，再把小计相加。只要读取期间订单内容稳定、筛选不依赖变化的外部状态，且金额合并满足归约契约，拆分就不会改变业务结果。

| 条件 | 当前订单计算如何满足 | 不满足时的后果 |
|------|----------------------|----------------|
| 无干扰 | 不修改正在读取的列表与订单 | 数据源被改变，可能出现异常或错误结果 |
| 无状态的行为参数 | 支付判断只读取当前订单 | 同一订单的结果依赖其他元素的处理时机 |
| 正确合并 | 非负整数分求和，所有局部和均在 long 范围内 | 单位元、结合性或溢出策略不成立时，分组影响结果 |
| 明确的输入边界 | 使用不可修改列表与不可变记录字段 | 读取可变对象时可能看见业务上不一致的状态 |

无干扰并非仅在并行流中才需要；顺序流在遍历非并发集合时修改数据源也违反要求。并发集合的特定遍历语义不能自动提供订单报表的事务快照，数据如何取得一致的业务视图仍须由读取边界决定。

归约的单位元与结合性详见 [Collector 与归约](./06-collectors-reduction.md)。这里的重点是判断具体计算能否遵守这些规则，而不是通过几次“结果刚好一样”的运行替代契约分析。

## 二、共享状态与前项依赖是两类问题

### 1. 共享更新的原子性与分配次序

共享计数器自增可能发生丢失更新：两个动作都读取旧值 0，分别计算 1，再各自写回 1，最终丢失一次递增。程序使用顺序排列的读写模型稳定展示这个过程；实际并行调度未必每次形成该交错。

即使改成原子计数器，也只是处理了原子更新问题，不能让依赖处理次序的转换成为无状态转换。例如编号分配若依赖计数器递增，得到哪个编号仍可能取决于调度顺序。

### 2. 前项依赖要求保留跨段上下文

另一个问题甚至不需要多个线程才能解释：求序列 1、2、3、4 的各前缀和，再把它们相加，得到 1 + 3 + 6 + 10 = 20。如果把两段分别从零累计，得到 1 + 3 与 3 + 7，最后相加为 14。锁不能补回被丢失的跨段前缀信息。

::: warning 加锁不能修复缺失的跨段状态

这类计算应先保留显式顺序循环，或设计携带足够状态、能够正确合并的分段摘要。不能把一个依赖前项状态的 `map` 直接改为并行，然后认为外层加锁或终止时排序就能恢复业务含义。

:::

## 三、结果顺序与动作顺序

并行执行与结果有序可以同时成立。有序列表源经过保序操作后，`toList` 仍按遇见顺序给出结果；框架可以在内部以不同顺序处理元素，最后组织出有序结果。

| 操作 | 顺序契约 | 不能据此推导的结论 |
|------|----------|--------------------|
| 有序流的 `toList` | 结果保留遇见顺序 | 上游 map 按编号顺序逐个执行 |
| 并行 `forEach` | 不保证按遇见顺序执行动作 | 打印几次有序就说明顺序有保证 |
| `forEachOrdered` | 有遇见顺序时，终止动作依次执行 | 整条流水线只有一个线程，或固定使用某个线程 |
| `findFirst` | 有序流中选择首个元素 | 无序源也存在稳定的业务“第一笔” |
| `findAny` | 允许选择任意符合条件的元素 | 顺序与并行必须返回相同编号 |
| `unordered` | 放宽对遇见顺序的要求 | 主动随机打乱数据 |

本例用 `forEachOrdered` 把编号追加到一个局部列表；只有终止动作写入该列表，动作间有 API 规定的先后关系，列表也没有被其他线程同时读取。若目的只是取得结果集合，直接 `toList` 更能表达需求。

::: info 执行模式作用于整条流水线

`parallel()` 和 `sequential()` 控制的是最终流水线执行模式，不是“这一小段并行、后一小段顺序”的分段指令。示例最后调用 `sequential()` 后，整条流水线使用顺序模式；需要独立阶段边界时应明确取得中间结果，再组织后续计算。

:::

## 四、规模、阻塞与资源成本

### 1. 运算规模与拆分合并成本

并行收益来自同时处理独立工作，但拆分、调度、缓冲和合并都有成本。五笔订单的一次状态判断和金额相加不能证明并行收益；即使输入增至一万条，本例也只检查结果等价，没有采集足以支持性能判断的数据。

| 场景 | 默认判断 | 需要验证的依据 |
|------|----------|----------------|
| 少量订单、简单字段映射 | 保持顺序实现 | 计算本身很轻，额外组织成本没有已证实收益 |
| 大批量可拆分数据、每项 CPU 计算较重 | 可以作为并行候选 | 代表性数据、端到端耗时、资源使用和结果一致性 |
| 有序流大量排序、去重、截取 | 单独评估 | 有状态阶段和顺序约束可能引入缓冲及协调成本 |
| 每笔订单调用数据库或 HTTP | 不直接以 parallelStream 作为并发控制方案 | 连接上限、超时、限流、取消和故障处理是否明确 |
| 多个请求同时争用计算资源 | 先确定资源预算 | 单次计算加速是否导致整体吞吐或尾延迟变差 |
| 存在逐笔结算、外部写入 | 显式设计执行流程 | 幂等、失败恢复和事务范围不能由流操作隐式承担 |

### 2. 阻塞调用与共享执行资源

Stream API 没有每条流水线的专属线程池参数。JDK 的相关执行资源需要从应用整体考虑，不能把调整公共池参数当作只影响当前查询。ForkJoinPool 文档也明确限制了对阻塞 I/O 和未受管理同步的补偿保证；具体调度机制属于并发执行器主题，这里不展开线程池实现。

::: danger 并行付款失败不会自动回滚

一个动作抛异常，不意味着其他已发生的外部副作用会自动回滚。把付款调用放进并行 `forEach`，无法仅靠捕获终止操作异常确定哪些订单已经付款。对这种流程，应先建立可观察、可重试且具有明确失败语义的任务模型。

:::

## 五、顺序与并行结果验证

以下完整程序保存为 `ParallelStreamsDemo.java`。只需 JDK 21，无外部依赖。订单使用固定的五笔数据；规模验证使用 1 至 101 循环的合成金额，独立公式计算期望合计，避免只拿两条可能同时错误的流水线互相对照。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看ParallelStreamsDemo的完整代码

```java
// ParallelStreamsDemo.java
import java.util.ArrayList;
import java.util.List;
import java.util.stream.LongStream;
import java.util.stream.Stream;

/** 比较顺序与并行的正确结果，使用确定性模型展示状态依赖。 */
public final class ParallelStreamsDemo {
    /** 仅提供静态验证入口。 */
    private ParallelStreamsDemo() {}

    /**
     * 执行金额、顺序和分段模型断言；无返回值，不测量性能。
     * @param args 本例不接受参数
     */
    public static void main(String[] args) {
        if (args.length != 0) {
            throw new IllegalArgumentException("no arguments expected");
        }
        List<Order> orders = orders();
        long sequential = orders.stream().filter(ParallelStreamsDemo::isPaid).mapToLong(Order::amountCents).sum();
        long parallel = orders.parallelStream().filter(ParallelStreamsDemo::isPaid).mapToLong(Order::amountCents).sum();
        assert sequential == 41800 && parallel == sequential;
        List<String> expected = List.of("ORD-1001", "ORD-1002", "ORD-1003", "ORD-1004", "ORD-1005");
        List<String> collected = orders.parallelStream().map(Order::number).toList();
        assert collected.equals(expected);
        List<String> observed = new ArrayList<>();
        // 只有forEachOrdered的终止动作写入本地列表；上游没有共享写入者。
        orders.parallelStream().map(Order::number).forEachOrdered(observed::add);
        assert observed.equals(expected);
        Stream<Order> reverted = orders.parallelStream().filter(ParallelStreamsDemo::isPaid).sequential();
        assert !reverted.isParallel();
        long revertedCents = reverted.mapToLong(Order::amountCents).sum();
        assert revertedCents == sequential;

        System.out.println("paid cents: sequential=" + sequential + ", parallel=" + parallel);
        System.out.println("ordered result=" + collected);
        System.out.println("ordered actions=" + observed);
        System.out.println("sequential fallback=" + revertedCents);
        for (int size : List.of(0, 1, 16, 10000)) {
            long serialTotal = LongStream.range(0, size).map(ParallelStreamsDemo::syntheticAmount).sum();
            long parallelTotal = LongStream.range(0, size).parallel().map(ParallelStreamsDemo::syntheticAmount).sum();
            long cycles = size / 101;
            long remainder = size % 101;
            long expectedTotal = cycles * 5151 + remainder * (remainder + 1) / 2;
            assert serialTotal == expectedTotal && parallelTotal == expectedTotal;
            System.out.println("size=" + size + ", total=" + parallelTotal + ", equal=true");
        }

        long whole = prefixTotal(List.of(1L, 2L, 3L, 4L));
        long split = prefixTotal(List.of(1L, 2L)) + prefixTotal(List.of(3L, 4L));
        assert whole == 20 && split == 14;
        System.out.println("stateful split model: whole=" + whole + ", split=" + split);

        // 顺序模拟两次读到同一旧值后各自写回；不是声称线程必然如此调度。
        int sharedBefore = 0;
        int firstRead = sharedBefore;
        int secondRead = sharedBefore;
        int afterFirstWrite = firstRead + 1;
        int afterSecondWrite = secondRead + 1;
        assert afterFirstWrite == 1 && afterSecondWrite == 1;
        System.out.println("lost update model: expected=2, observed=" + afterSecondWrite);
    }

    /**
     * 为不同输入规模构造可核对的整数金额。
     * @param index 范围为0至9999的演示索引
     * @return 1至101循环的金额分，无共享状态，合计不溢出long
     */
    private static long syntheticAmount(long index) {
        return index % 101 + 1;
    }

    /**
     * 用显式循环求所有前缀和的总和，故意保留前项状态依赖。
     * @param values 非null且元素非null的演示列表，本例只使用1至4
     * @return 各前缀合计再求和的结果，不可用独立分段求和直接替代
     */
    private static long prefixTotal(List<Long> values) {
        long prefix = 0;
        long total = 0;
        for (long value : values) {
            prefix += value;
            total += prefix;
        }
        return total;
    }

    /**
     * 判断支付状态，不访问外部可变状态。
     * @param order 非null且status非null的订单
     * @return 状态为PAID时为true
     */
    private static boolean isPaid(Order order) {
        return "PAID".equals(order.status());
    }

    /**
     * 构造同一组五笔订单供顺序与并行读取。
     * @return 不可修改列表，金额合计47700分；记录字段均为不可变值
     */
    private static List<Order> orders() {
        return List.of(
                new Order("ORD-1001", "C-01", "PAID", 9900),
                new Order("ORD-1002", "C-02", "CREATED", 4900),
                new Order("ORD-1003", "C-01", "PAID", 19900),
                new Order("ORD-1004", "C-02", "PAID", 12000),
                new Order("ORD-1005", "C-03", "CREATED", 1000));
    }

    /**
     * 保留订单筛选与金额统计所需字段。
     * @param number 非null订单编号
     * @param customer 非null客户编号
     * @param status 非null演示状态
     * @param amountCents 非负金额分，演示局部和均不溢出long
     */
    record Order(String number, String customer, String status, long amountCents) {}
}
```

:::

在本篇示例目录执行 PowerShell 命令。公共池并行度参数只作用于此次新启动的 Java 进程，用于固定一个验证条件，不表示整条流恰好使用两个线程，也不是生产推荐配置。

```powershell
javac -encoding UTF-8 -Xlint:all -Xdoclint:all,-missing -Werror -d out ParallelStreamsDemo.java
java -ea "-Djava.util.concurrent.ForkJoinPool.common.parallelism=2" -cp out ParallelStreamsDemo
```

JDK 21.0.11 实测输出如下。前缀和与丢失更新两行是程序明确构造的错误模型结果，不是实际线程竞态的运行记录。

```text
paid cents: sequential=41800, parallel=41800
ordered result=[ORD-1001, ORD-1002, ORD-1003, ORD-1004, ORD-1005]
ordered actions=[ORD-1001, ORD-1002, ORD-1003, ORD-1004, ORD-1005]
sequential fallback=41800
size=0, total=0, equal=true
size=1, total=1, equal=true
size=16, total=136, equal=true
size=10000, total=509950, equal=true
stateful split model: whole=20, split=14
lost update model: expected=2, observed=1
```

四种规模同时覆盖空输入、单元素、小批量和较大批量。相同断言还在默认公共池配置和并行度为 1 的独立 Java 进程中通过；以下命令可以复核。结果正确不代表实际执行了固定数量的任务，也不代表性能随并行度提升。

```powershell
java -ea "-Djava.util.concurrent.ForkJoinPool.common.parallelism=1" -cp out ParallelStreamsDemo
java -ea -cp out ParallelStreamsDemo
```

## 六、发现差异后的定位与回退

::: tip 保留顺序基准并缩小差异输入

并行候选必须保留顺序实现作为结果基准。出现差异时，先缩小输入，核对每个阶段的契约；不要通过反复运行直到偶然通过来认定正确。

:::

| 观察到的问题 | 优先核对的证据 | 处理方式 |
|--------------|----------------|----------|
| 数量偶发减少或列表损坏 | 是否在 forEach 中写外部集合或计数器 | 用正确的收集归约承载结果，移除共享累加状态 |
| 值正确但顺序不同 | 数据源、unordered、forEach、findAny 的契约 | 只在业务确实需要时保留顺序，并选择相应终止操作 |
| 相同输入得到不同金额 | identity、combiner、舍入、溢出或可变数据读取 | 修正计算规则与输入边界，不能只修改线程数 |
| 超时、资源占用上升 | 外部调用、资源争用、排序缓冲与合并成本 | 回到顺序模式并重新评估执行方式和资源限制 |
| 前缀计算等依赖前项的结果错误 | 分段后是否丢失必要上下文 | 保留显式循环，或证明新的分段摘要能够正确合并 |

本例的 `sequential()` 证明可以明确切换执行模式；如果原逻辑已有数据竞争或错误副作用，仅回退顺序模式不是对整个业务流程的完整修复。应同时移除不合法的行为参数和隐藏写入。

性能决策需要代表性负载、预热、重复测量和端到端资源观察。这里没有执行性能基准或远程调用压测，因此不提供加速倍数、推荐数据量阈值和生产线程数。

## 七、官方依据

- [Java 21 Stream 包：并行、无干扰与无状态要求](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/package-summary.html)
- [Java 21 Stream：forEach、forEachOrdered 与结果顺序](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html)
- [Java 21 BaseStream：parallel、sequential 与 unordered](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/BaseStream.html)
- [Java 21 ForkJoinPool：公共池配置与阻塞边界](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ForkJoinPool.html)
