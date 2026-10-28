---
title: "Stream 流水线"
tags:
  - Java
  - Stream
excerpt: "解释 Stream 的数据源、中间操作和终止操作如何组成惰性流水线，以订单筛选、金额排序和商品展开验证短路、一次消费、结果可修改性与资源关闭的边界。"
date: 2026-09-08
---

# Stream 流水线 {#stream-流水线与常用操作}

Stream 是对数据源执行聚合计算的流水线。它描述怎样筛选、转换和汇总元素，不负责保存一份可以反复读取的数据。订单列表可以多次创建流，每个已经消费的流实例只能使用一次。

本文使用 Java 21 API。订单金额以分保存，五笔订单的总金额为 47700 分，其中三笔已支付订单合计 41800 分；商品编码允许在不同订单中重复。

## 一、数据源、中间操作与终止操作

### 1. 连接阶段与请求数据的时机

流水线包含数据源、零个或多个中间操作，以及一个触发结果计算的终止操作。调用 `filter` 和 `map` 时，通常只是连接处理阶段；终止操作才请求数据。惰性不表示“所有代码都延迟”：创建流时执行的参数表达式、方法引用接收者求值和参数检查仍然可能立即发生。

| 角色 | 订单场景 | 需要注意的状态 |
|------|----------|----------------|
| 数据源 | `orders.stream()` | 从列表创建新流，不自动复制列表内容 |
| 无状态中间操作 | `filter`、`map` | 单个元素的转换不需要保留跨元素业务状态 |
| 有状态中间操作 | `sorted`、`distinct` | 需要排序缓冲或去重状态，不能概括成完全无缓冲的逐项传递 |
| 终止操作 | `toList`、`sum`、`findFirst` | 请求结果并消费流水线，结果可以是集合、标量或 Optional |

### 2. 短路是否能越过有状态阶段

对于“找到第一笔已支付订单”，`findFirst` 可以在得到结果后停止请求后续元素。对于“金额最高的两笔订单”，`sorted` 必须掌握足够的排序信息，不能因为后面有 `limit(2)` 就假设只检查两笔订单。操作顺序会改变结果：先 `limit(2)` 再排序，只是在前两笔输入中排序。

::: warning 无界输入必须具有可终止条件

`Stream.iterate` 可以提供无限数据源。必须结合能够结束的处理条件；无界源经过全量排序后再取前几项，不能形成有保证的有限计算。本例先 `limit(3)`，只生成用于验证的三个序号。

:::

## 二、筛选、转换与结果形状

选择操作时，先确定输入与输出的元素形状。订单映射为编号是一对一转换，订单展开为商品编码是一对多转换；把商品列表本身作为结果与展开列表中的商品，是两种不同需求。

| 操作 | 当前场景中的作用 | 边界 |
|------|------------------|------|
| `filter` | 保留状态为 PAID 的订单 | 不改变元素类型，也不会替业务更新状态 |
| `map` | 将订单转换成编号 | 映射结果可以是对象，若是列表则仍是“列表作为元素” |
| `flatMap` | 将每笔订单的商品流展开 | 返回 `null` 流按空流处理；业务代码仍建议明确返回空流 |
| `distinct` | 商品编码去重 | 按 `equals` 判断；有遇见顺序的流保留首次出现的元素 |
| `sorted` | 金额降序，金额相同时按编号升序 | 默认自然排序要求元素可比较；比较器必须满足比较契约 |
| `mapToLong` | 投影金额分后求和 | 避免把数值归约写成外部变量累加，仍需自行限定溢出范围 |
| `limit`、`skip` | 截取或跳过元素 | 参数不能为负；有序流的“前几个”由遇见顺序定义 |

本例把金额相同的订单再按编号排列，使业务结果拥有清晰的比较规则。列表源具有遇见顺序，但并非所有数据源都定义顺序；需要稳定业务顺序时，应使用有序源或明确比较器，不能依赖某次打印刚好有序。

`Optional.stream()` 将一个有值或无值的 Optional 转成含一个或零个元素的流，可用于合并多个查询结果。它与 `Optional.flatMap` 的空值契约不同，后者的映射器返回 `null` 会抛出异常，详见 [Optional 的转换边界](./04-optional.md)。

## 三、短路、空流与可观察副作用

### 1. 操作被省略时不能依赖副作用

`findFirst`、`anyMatch` 等短路操作不保证调用每个元素上的函数。即使终止操作不是短路操作，实现也可以省略不影响最终结果的阶段。已知大小的列表经过不改变元素数量的 `peek` 后执行 `count`，可以直接根据大小返回数量。

::: danger 必需的业务写入不能放进 peek

因此，不能把必需的审计、支付、落库或计费动作藏进 `peek`，也不能用它的调用次数代替真实处理数量。下方程序中的追踪列表只用于本地顺序流观察；筛选结果不依赖追踪列表。它不展示生产审计方案。

:::

### 2. 空流的逻辑结果不等于业务有效

空流不会调用元素上的判断函数，终止操作仍有约定的结果。判断这些结果能否直接用于订单规则，需要同时检查业务是否要求至少存在一个输入。

| 空流上的操作 | 结果 | 业务解释 |
|--------------|------|----------|
| `findFirst` | `Optional.empty()` | 没有候选订单 |
| `anyMatch` | `false` | 不存在满足条件的元素 |
| `allMatch` | `true` | 不存在违反条件的元素，不代表至少有一笔订单 |
| `noneMatch` | `true` | 不存在满足条件的元素 |
| `count`、数值 `sum` | 0 | 数量或合计为零，不能单独区分“没有订单”与“金额均为零” |

如果业务要求“至少一笔订单且全部已支付”，只调用 `allMatch` 不够，应同时表达非空条件。不能先在同一个流上调用 `count`，再调用 `allMatch`；应从可重读数据源重新创建流，或者一次收集业务需要的结果。

## 四、订单流水线完整示例

文件保存为 `StreamPipelinesDemo.java`。只需 JDK 21，无第三方依赖。程序使用本地演示订单，不连接支付系统；`trace`、`peekCalls` 和关闭标记用于观察执行行为。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看StreamPipelinesDemo的完整代码

```java
// StreamPipelinesDemo.java
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

/** 用同一组本地订单观察流水线惰性、排序、扁平化、消费与关闭。 */
public final class StreamPipelinesDemo {
    /** 仅提供静态入口，不创建额外状态。 */
    private StreamPipelinesDemo() {}

    /**
     * 执行流水线断言或故意违反使用契约；无返回值，输出观察与异常。
     * @param args 空参数正常运行；reuse、null-first、readonly、source-mutation为故障模式
     */
    public static void main(String[] args) {
        List<Order> orders = orders();
        if (args.length > 0) {
            switch (args[0]) {
                case "reuse" -> {
                    Stream<Order> consumed = orders.stream();
                    consumed.count();
                    consumed.toList();
                }
                case "null-first" -> Stream.of((String) null).findFirst();
                case "readonly" -> orders.stream().toList().add(orders.getFirst());
                case "source-mutation" -> {
                    List<Integer> source = new ArrayList<>(List.of(1, 2));
                    // 故意干扰正在遍历的数据源；返回原值，不作为合法业务写法。
                    source.stream().map(value -> {
                        source.add(9);
                        return value;
                    }).toList();
                }
                default -> throw new IllegalArgumentException("unknown mode");
            }
            return;
        }

        List<String> trace = new ArrayList<>();
        // 记录只用于当前顺序流的诊断；条件结果仅取决于订单，不依赖trace。
        Stream<String> pending = orders.stream().filter(order -> {
            trace.add("filter:" + order.number());
            return isPaid(order);
        }).map(order -> {
            // 仅观察映射调用并返回编号，不承载支付、审计或其他业务副作用。
            trace.add("map:" + order.number());
            return order.number();
        });
        assert trace.isEmpty();
        System.out.println("before terminal=" + trace);
        Optional<String> first = pending.findFirst();
        assert first.orElseThrow().equals("ORD-1001");
        System.out.println("first=" + first.orElseThrow() + ", trace=" + trace);

        List<String> largest = orders.stream().filter(StreamPipelinesDemo::isPaid)
                .sorted(Comparator.comparingLong(Order::amountCents).reversed().thenComparing(Order::number))
                .map(Order::number).limit(2).toList();
        // 每个订单产生一个商品流，flatMap将它们依次展开。
        List<String> products = orders.stream().filter(StreamPipelinesDemo::isPaid)
                .flatMap(order -> order.products().stream()).distinct().toList();
        assert largest.equals(List.of("ORD-1003", "ORD-1004"));
        assert products.equals(List.of("P-1001", "P-1002", "P-1004", "P-1005"));
        long paidCents = orders.stream().filter(StreamPipelinesDemo::isPaid).mapToLong(Order::amountCents).sum();
        assert paidCents == 41800;
        List<Integer> generated = Stream.iterate(1, StreamPipelinesDemo::increment).limit(3).toList();
        assert generated.equals(List.of(1, 2, 3));

        int[] peekCalls = {0};
        // 故意观察peek被省略的情况；计数只作诊断，不作为业务结果。
        long count = orders.stream().peek(order -> peekCalls[0]++).count();
        assert count == 5;
        System.out.println("largest=" + largest);
        System.out.println("products=" + products + ", paid cents=" + paidCents);
        System.out.println("generated=" + generated);
        System.out.println("count=" + count + ", peek calls=" + peekCalls[0]);
        assert Stream.<Order>empty().allMatch(StreamPipelinesDemo::isPaid);
        assert Stream.<Order>empty().noneMatch(StreamPipelinesDemo::isPaid);
        assert !Stream.<Order>empty().anyMatch(StreamPipelinesDemo::isPaid);

        boolean[] closed = {false};
        // 无参数关闭回调只改变本地观察标记，不模拟真实文件资源。
        try (Stream<String> closable = Stream.of("ORD-1001").onClose(() -> closed[0] = true)) {
            long consumedCount = closable.count();
            assert consumedCount == 1;
            assert !closed[0];
        }
        assert closed[0];
        System.out.println("closed=" + closed[0]);
    }

    /**
     * 判断订单支付状态，不读取或修改外部状态。
     * @param order 非null且status非null的演示订单
     * @return PAID时为true
     */
    private static boolean isPaid(Order order) {
        return "PAID".equals(order.status());
    }

    /**
     * 提供有限消费的序号生成规则。
     * @param value 本例从1开始且只消费前三项
     * @return value加1；若扩展到大整数，应另行处理溢出边界
     */
    private static int increment(int value) {
        return value + 1;
    }

    /**
     * 创建固定的五笔订单，金额单位为分，商品编码可跨订单重复。
     * @return 不可修改的演示列表，记录及其商品列表均无可变字段
     */
    private static List<Order> orders() {
        return List.of(
                new Order("ORD-1001", "C-01", "PAID", 9900, List.of("P-1001", "P-1002")),
                new Order("ORD-1002", "C-02", "CREATED", 4900, List.of("P-1003")),
                new Order("ORD-1003", "C-01", "PAID", 19900, List.of("P-1002", "P-1004")),
                new Order("ORD-1004", "C-02", "PAID", 12000, List.of("P-1005")),
                new Order("ORD-1005", "C-03", "CREATED", 1000, List.of("P-1006")));
    }

    /**
     * 承载筛选与商品展开所需字段。
     * @param number 非null订单编号
     * @param customer 非null客户编号
     * @param status 非null演示状态
     * @param amountCents 非负金额分，本例合计不会溢出long
     * @param products 非null且无null元素的不可修改商品列表
     */
    record Order(String number, String customer, String status, long amountCents, List<String> products) {}
}
```

:::

在本篇示例目录执行以下 PowerShell 命令。开启断言用于核对筛选、排序、金额、空流以及关闭时机；编译参数同时检查代码警告和文档注释。

```powershell
javac -encoding UTF-8 -Xlint:all -Xdoclint:all,-missing -Werror -d out StreamPipelinesDemo.java
java -ea -cp out StreamPipelinesDemo
```

在本项目 JDK 21.0.11 环境实测输出如下。`peek calls=0` 是此次实现与数据源下的观察，API 允许省略该阶段，不能据此推导所有流的 `peek` 都不会执行。

```text
before terminal=[]
first=ORD-1001, trace=[filter:ORD-1001, map:ORD-1001]
largest=[ORD-1003, ORD-1004]
products=[P-1001, P-1002, P-1004, P-1005], paid cents=41800
generated=[1, 2, 3]
count=5, peek calls=0
closed=true
```

终止前追踪记录为空，`findFirst` 只需要首笔已支付订单；商品列表按首次出现去重。金额排序与金额求和分别创建新流，各自独立消费同一份不可修改的数据。

## 五、一次消费、结果集合与关闭时机

### 1. 结果容器独立遵守可修改性契约

`Stream.toList()` 返回不可修改的 List；不能对其调用 `add`、`remove` 或 `set`。这不意味着元素对象变成深度不可变对象。本例记录及其商品列表没有可变业务字段，若换成可变订单对象，对元素的修改仍需要另行约束。

::: tip 用明确的收集工厂取得可修改结果

需要可修改集合时，使用明确的收集工厂；`Collectors.toList()` 也不能当作“保证可修改”的契约，详见 [Collector 与结果容器](./06-collectors-reduction.md)。

:::

### 2. 流的消费、关闭与源数据生命周期

终止操作消费的是当前流实例，保存该实例不能让同一条流水线再执行一次。需要再次计算时，应从允许重读的数据源创建新流；第一次的结果集合则可以按自身契约继续读取。

消费与关闭是两件事。示例在 `count` 结束后检查关闭标记仍为 `false`，退出 try-with-resources 后才观察到 `true`。普通内存集合流通常不持有需要关闭的资源；来自文件等 I/O 通道的流则应遵守对应工厂方法的关闭要求，使用 try-with-resources 明确资源生命周期。这里的关闭回调只验证 Stream 生命周期，没有执行文件读取实验。

::: warning 创建流不等于取得数据快照

从非并发集合读取时，不得在流水线中修改数据源。流通常也不代表数据源的创建时快照；需要快照语义时，应在业务边界先取得符合一致性要求的数据副本，而不是依赖一次 `stream()` 调用。

:::

## 六、故障复现与处理

编译正常示例后，分别运行以下命令。每条命令都是独立故障运行，预期非零退出；它们不会修改仓库业务数据。

```powershell
java -ea -cp out StreamPipelinesDemo reuse
java -ea -cp out StreamPipelinesDemo null-first
java -ea -cp out StreamPipelinesDemo readonly
java -ea -cp out StreamPipelinesDemo source-mutation
```

四个模式均已实跑，诊断依据和修复方式如下。异常类是稳定的观察点；具体堆栈行号随代码修改变化。

| 模式 | 本次异常 | 产生原因与定位证据 | 正确处理 |
|------|----------|--------------------|----------|
| `reuse` | `IllegalStateException` | 同一流先 `count` 后 `toList`，已经消费 | 从仍可重读的源创建新流，或保存第一次终止操作的结果 |
| `null-first` | `NullPointerException` | `findFirst` 选中的元素为 null，Optional 无法承载该值 | 在输入边界拒绝 null，或按业务含义过滤、转换缺失值 |
| `readonly` | `UnsupportedOperationException` | 修改 `Stream.toList` 的结果 | 按需求复制或使用明确的可修改收集容器 |
| `source-mutation` | `ConcurrentModificationException` | 映射过程中对被遍历的 ArrayList 执行 `add` | 分离遍历与修改，生成新结果后再进行明确的更新操作 |

最后一个模式故意违反无干扰要求；此次 ArrayList 实现检测到修改，不代表所有数据源、所有非法修改都保证抛出这个异常。不能通过捕获它来实现正常控制流程，也不能把“没有抛出异常”视为操作正确。

::: info 流水线示例只验证本地计算语义

示例证明了本地内存数据上的流水线语义和几类失败边界，没有测量吞吐量，也没有验证外部服务副作用的原子性。需要并行处理时，应进一步依据 [并行流的使用边界](./07-parallel-streams.md) 判断。

:::

## 七、官方依据

- [Java 21 Stream：操作、优化与结果契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html)
- [Java 21 Stream 包：惰性、无干扰、顺序与副作用](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/package-summary.html)
- [Java 21 BaseStream：消费模式与关闭](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/BaseStream.html)
