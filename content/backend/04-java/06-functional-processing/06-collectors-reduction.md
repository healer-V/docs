---
title: "Collector 与归约"
tags:
  - Java
  - Stream
  - Collector
excerpt: "以订单金额汇总、客户分组和状态统计说明 reduce 与 collect 的职责，验证单位元、结合性、累加合并兼容、重复键策略与结果容器约束，给出可运行的正常和失败案例。"
date: 2026-09-08
---

# Collector 与归约

归约把多个输入组合成一个结果。订单金额合计属于值的归约，按客户整理订单属于容器的收集。设计时先确定“结果是什么、空输入代表什么、局部结果怎样合并”，再选择 `reduce` 或 `collect`。

本文采用 Java 21，以五笔本地演示订单验证行为。金额使用非负整数分，所有局部和都限定在 `long` 范围内；这项约束使示例能讨论加法合并，而不混入金额精度与溢出策略。

## 一、reduce 的单位元与结合性

### 1. 单位元与结合性约束分组结果

金额求和的单位元为 0，因为把 0 与任意金额相加不会改变金额。单位元不是“业务上想附加的初始费用”：把 100 分服务费直接写成加法归约的 identity，会破坏单位元要求。应先合计订单，再根据业务规则加一次服务费。

结合性要求改变括号分组不改变结果，不要求交换元素位置。字符串拼接可以保持元素顺序并重新分组，但不能任意交换字符串。减法则不同，`(10 - 3) - 2 = 5`，`10 - (3 - 2) = 9`；不能将它作为满足契约的并行归约运算。

### 2. 归约重载与累加合并兼容

重载形式决定空输入的表达，以及输入元素与中间结果能否使用不同类型。三参数形式还需要证明累加和合并表达的是同一套计算规则。

| 形式 | 结果模型 | 空输入与设计要点 |
|------|----------|------------------|
| `reduce(identity, operator)` | 输入与结果同类型 | 空输入得到 identity；operator 要满足结合性 |
| `reduce(operator)` | 返回 Optional | 空输入为 empty，适合没有合适默认值的归约 |
| `reduce(identity, accumulator, combiner)` | 输入类型与结果类型可以不同 | accumulator 接受单个输入，combiner 合并两个局部结果 |
| `mapToLong(...).sum()` | 专用数值合计 | 适合直接的整数金额投影，避免不必要装箱 |

三参数形式需要两种操作兼容。对某个已有小计 u 和一笔订单 t，“先将 t 放入空结果再与 u 合并”，必须等价于“直接把 t 累加到 u”。本例 accumulator 把订单金额加到小计，combiner 把两个金额小计相加，因此两条路径一致。

::: info 整数归约结论依赖金额范围

这种论证依赖数据范围。若存在金额溢出，`Long::sum` 不会自动抛异常；示例中 `addAmount` 使用 `Math.addExact` 检查累加，但 combiner 仍依赖所有局部和不溢出的前提。生产代码若需要全路径检测，必须同时定义累加、合并和数据范围的策略。浮点加法还受舍入影响，不能把这里的整数分等价结论直接迁移过去。

:::

## 二、collect 的局部容器与合并

### 1. 收集器的中间类型与组成职责

`collect` 面向可变容器：把订单编号加入列表，在不同局部列表完成后再合并。安全条件是各局部累加过程拥有自己的容器，而不是所有执行者都向一个外部 ArrayList 写入。

`Collector<T, A, R>` 中，T 是输入类型，A 是中间累加容器，R 是最终结果。很多标准工厂隐藏 A 的具体类型，使用者通常无须依赖实现类。

| 组成部分 | 职责 | 订单编号收集的对应关系 |
|----------|------|------------------------|
| supplier | 创建新的空容器 | 每次返回一个新的 ArrayList |
| accumulator | 将一个输入加入局部容器 | 加入一个编号 |
| combiner | 合并两个局部结果 | 将右侧列表内容合并进左侧列表 |
| finisher | 从中间容器生成最终结果 | 直接返回容器，或包装成指定结果 |
| characteristics | 声明实现实际满足的属性 | 不是请求框架替收集器补上安全性 |

### 2. 局部隔离与并发属性的不同保证

非并发 Collector 可以在并行流中工作：框架隔离局部容器，完成局部累加后合并。因此，标准列表收集不要求每个 ArrayList 本身成为并发集合。反过来，给外部共享列表加锁，也不能自动修复有状态转换、错误顺序或错误归约规则。

::: warning Collector 属性是契约声明

`IDENTITY_FINISH` 表示可省略中间容器到结果的转换；`UNORDERED` 表示结果不依赖遇见顺序；`CONCURRENT` 表示同一容器允许 accumulator 并发调用。不能为了性能随意声明这些属性，尤其不能把 `CONCURRENT` 当作框架会自动加锁。

:::

## 三、分组、重复键与下游收集

### 1. 重复键的合并规则决定报表含义

订单按客户汇总时，一个客户拥有多笔订单是正常业务数据。用 `toMap(customer, amount)` 却不提供合并规则，会把正常重复键变成异常。合并规则必须体现目标：求金额和、保留全部订单、选择最大金额，分别产生不同结果。

| 业务目标 | 收集组合 | 当前数据的结果 |
|----------|----------|----------------|
| 已支付金额按客户合计 | `groupingBy + summingLong` | C-01 为 29800，C-02 为 12000 |
| 重复客户键按金额合并 | `toMap + Long::sum` | 与客户金额合计一致 |
| 每种状态的订单编号 | `groupingBy + mapping + toCollection` | CREATED 两笔、PAID 三笔 |
| 已支付与未支付数量 | `partitioningBy + counting` | true 为 3，false 为 2 |
| 每个出现过的客户的已支付笔数 | `groupingBy + filtering + counting` | C-03 保留为 0 |

### 2. 下游过滤保留分组的空结果

表中最后一项体现过滤位置的差异。先在流水线上过滤已支付订单，再分组，会完全移除只有未支付订单的 C-03；先按所有订单分组，再使用下游 `filtering`，能让该客户保留零统计。选择哪一种取决于报表是否要求显示零值客户。

`partitioningBy` 的两个布尔分区始终存在；某个分区没有元素时，值由下游收集器的空结果决定。Map 的打印顺序则是另一个问题：本例对客户和状态使用 TreeMap 工厂，以便输出按键排序，不依赖默认 Map 的迭代顺序。

## 四、结果集合的可修改性

结果是否允许修改应当成为接口契约。不要根据当前 JDK 返回的具体类推导长期保证，也不要将“容器不可修改”与“容器内对象深度不可变”混为一谈。

| 收集方式 | 容器约束 | 选择依据 |
|----------|----------|----------|
| `Stream.toList()` | List 不可修改 | 返回固定的查询结果集合 |
| `Collectors.toList()` | 不承诺具体类型、可修改性或线程安全性 | 只依赖 List 内容契约 |
| `Collectors.toCollection(ArrayList::new)` | 明确取得 ArrayList | 调用方需要后续增删，且自行管理并发访问 |
| `Collectors.toUnmodifiableList()` | 不可修改，拒绝 null 元素 | 在收集结果时明确限制空元素 |
| `collect(supplier, accumulator, combiner)` | 由显式容器创建与合并规则决定 | 需要理解或定制可变归约过程 |

::: warning 不能为了收集成功无条件丢弃数据

如果上游数据允许 null，而目标容器拒绝 null，应先根据业务规则拒绝、过滤或映射缺失值。不要仅为了让收集成功就无条件丢弃数据；例如订单编号缺失可能属于输入校验失败，而不是可以忽略的一条记录。

:::

## 五、订单聚合完整示例

保存以下完整程序为 `CollectorsReductionDemo.java`，使用 JDK 21 编译。程序对金额、分组内容、空输入和两个确定性反例执行断言；演示中新增的 `ORD-LOCAL` 只用于证明结果列表可修改，不参与金额统计。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看CollectorsReductionDemo的完整代码

```java
// CollectorsReductionDemo.java
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/** 验证订单金额归约、分组收集以及错误合并模型。 */
public final class CollectorsReductionDemo {
    /** 只提供静态验证入口。 */
    private CollectorsReductionDemo() {}

    /**
     * 执行断言或制造指定收集错误；无返回值，输出结果或异常。
     * @param args 空参数正常运行；duplicate-key或null-result触发故障
     */
    public static void main(String[] args) {
        List<Order> orders = orders();
        List<Order> paid = orders.stream().filter(CollectorsReductionDemo::isPaid).toList();
        if (args.length > 0) {
            switch (args[0]) {
                case "duplicate-key" -> paid.stream().collect(Collectors.toMap(Order::customer, Order::amountCents));
                case "null-result" -> Stream.of("ORD-1001", null).collect(Collectors.toUnmodifiableList());
                default -> throw new IllegalArgumentException("unknown mode");
            }
            return;
        }

        long total = paid.stream().map(Order::amountCents).reduce(0L, Long::sum);
        long fused = paid.stream().reduce(0L, CollectorsReductionDemo::addAmount, Long::sum);
        long parallel = paid.parallelStream().reduce(0L, CollectorsReductionDemo::addAmount, Long::sum);
        Optional<Long> emptyTotal = Stream.<Long>empty().reduce(Long::sum);
        assert total == 41800 && fused == total && parallel == total;
        assert Stream.<Long>empty().reduce(0L, Long::sum) == 0;
        assert emptyTotal.isEmpty();

        Map<String, Long> byCustomer = paid.stream().collect(Collectors.groupingBy(
                Order::customer, TreeMap::new, Collectors.summingLong(Order::amountCents)));
        Map<String, Long> merged = paid.stream().collect(Collectors.toMap(
                Order::customer, Order::amountCents, Long::sum, TreeMap::new));
        assert byCustomer.equals(Map.of("C-01", 29800L, "C-02", 12000L));
        assert merged.equals(byCustomer);
        Map<String, List<String>> numbersByStatus = orders.stream().collect(Collectors.groupingBy(
                Order::status, TreeMap::new,
                Collectors.mapping(Order::number, Collectors.toCollection(ArrayList::new))));
        Map<Boolean, Long> partitions = orders.stream().collect(Collectors.partitioningBy(
                CollectorsReductionDemo::isPaid, Collectors.counting()));
        Map<String, Long> paidCounts = orders.stream().collect(Collectors.groupingBy(
                Order::customer, TreeMap::new,
                Collectors.filtering(CollectorsReductionDemo::isPaid, Collectors.counting())));
        assert paidCounts.equals(Map.of("C-01", 2L, "C-02", 1L, "C-03", 0L));
        assert partitions.get(true) == 3 && partitions.get(false) == 2;
        assert numbersByStatus.get("PAID").equals(List.of("ORD-1001", "ORD-1003", "ORD-1004"));
        assert numbersByStatus.get("CREATED").equals(List.of("ORD-1002", "ORD-1005"));

        // supplier每次创建新列表；标准add与addAll分别承担局部累加和合并。
        List<String> mutable = paid.parallelStream().map(Order::number)
                .collect(ArrayList::new, List::add, List::addAll);
        assert mutable.equals(List.of("ORD-1001", "ORD-1003", "ORD-1004"));
        mutable.add("ORD-LOCAL");
        assert mutable.size() == 4;

        int leftGrouped = (10 - 3) - 2;
        int rightGrouped = 10 - (3 - 2);
        assert leftGrouped == 5 && rightGrouped == 9;
        List<String> aliased = sharedIdentityModel();
        assert aliased.equals(List.of("ORD-1001", "ORD-1003", "ORD-1001", "ORD-1003"));

        System.out.println("totals=" + total + "," + fused + "," + parallel + "; empty=" + emptyTotal);
        System.out.println("by customer=" + byCustomer + "; merged=" + merged);
        System.out.println("by status=" + numbersByStatus);
        System.out.println("partitions: paid=" + partitions.get(true) + ", unpaid=" + partitions.get(false));
        System.out.println("paid counts=" + paidCounts);
        System.out.println("mutable=" + mutable);
        System.out.println("subtraction groups=" + leftGrouped + "," + rightGrouped);
        System.out.println("shared identity model=" + aliased);
    }

    /**
     * 将一笔订单金额累加到局部结果。
     * @param subtotal 非负金额分；本例所有局部和都在long范围内
     * @param order 非null、金额非负的演示订单
     * @return 累加后的金额分；超出long范围时抛出ArithmeticException
     */
    private static long addAmount(long subtotal, Order order) {
        return Math.addExact(subtotal, order.amountCents());
    }

    /**
     * 判断订单是否已支付。
     * @param order 非null且status非null的订单
     * @return PAID状态时为true，不改变订单
     */
    private static boolean isPaid(Order order) {
        return "PAID".equals(order.status());
    }

    /**
     * 顺序模拟两个局部累加器错误共用同一个可变identity。
     * @return 错误共享并合并后的重复编号，仅证明别名问题，不模拟真实线程调度
     */
    private static List<String> sharedIdentityModel() {
        List<String> identity = new ArrayList<>();
        List<String> left = identity;
        List<String> right = identity;
        left.add("ORD-1001");
        right.add("ORD-1003");
        // 两边其实是同一个对象；先复制右边，只让结果说明别名造成的重复。
        left.addAll(new ArrayList<>(right));
        return left;
    }

    /**
     * 创建用于分组与金额聚合的固定订单数据。
     * @return 不可修改列表；五笔订单金额合计47700分，均在long范围内
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
     * 承载分组键与金额投影，不含外部服务行为。
     * @param number 非null订单编号
     * @param customer 非null客户编号，允许多笔订单共享
     * @param status 非null演示状态
     * @param amountCents 非负金额分，本例的任意局部和不溢出long
     */
    record Order(String number, String customer, String status, long amountCents) {}
}
```

:::

在本篇示例目录执行 PowerShell 命令，无第三方依赖或外部服务。

```powershell
javac -encoding UTF-8 -Xlint:all -Xdoclint:all,-missing -Werror -d out CollectorsReductionDemo.java
java -ea -cp out CollectorsReductionDemo
```

JDK 21.0.11 实测输出如下。三种金额归约结果一致，状态分组中编号仍保持列表源的遇见顺序。

```text
totals=41800,41800,41800; empty=Optional.empty
by customer={C-01=29800, C-02=12000}; merged={C-01=29800, C-02=12000}
by status={CREATED=[ORD-1002, ORD-1005], PAID=[ORD-1001, ORD-1003, ORD-1004]}
partitions: paid=3, unpaid=2
paid counts={C-01=2, C-02=1, C-03=0}
mutable=[ORD-1001, ORD-1003, ORD-1004, ORD-LOCAL]
subtraction groups=5,9
shared identity model=[ORD-1001, ORD-1003, ORD-1001, ORD-1003]
```

`sharedIdentityModel` 在一个线程中明确让 left 和 right 指向同一个对象，再模拟合并，从而稳定显示重复数据。它证明可变初值别名破坏了“独立局部结果”假设，不是声称真实并行流必定出现这一排列。

::: tip 可变结果应由 collect 创建独立容器

不要使用共享可变初值的 `reduce` 收集列表。改为 `collect`，让 supplier 每次创建新列表；本例的并行收集通过 `ArrayList::new`、`List::add`、`List::addAll` 表达了这个边界。正常结果的实测不能替代结合性论证，两者需要同时成立。

:::

## 六、失败表现与规则修正

完成编译后分别执行以下故障模式，两条命令均应非零退出。

```powershell
java -ea -cp out CollectorsReductionDemo duplicate-key
java -ea -cp out CollectorsReductionDemo null-result
```

| 情况 | 已验证的表现 | 定位证据 | 修正方式 |
|------|--------------|----------|----------|
| 重复客户键无合并规则 | `IllegalStateException` | C-01 对应两笔已支付订单，金额分别为 9900 与 19900 | 金额报表显式求和；若要保留明细则按键分组收集列表 |
| null 元素进入不可修改收集器 | `NullPointerException` | 输入流包含 null，目标使用 `toUnmodifiableList` | 明确空值业务规则后校验或转换 |
| 非结合运算用于归约 | 模型分组结果 5 与 9 不同 | 只改变减法括号就改变结果 | 按所需顺序使用显式循环，或重新设计满足合并条件的摘要 |
| 局部结果共享可变初值 | 模型中编号重复 | left 与 right 为同一引用 | 每个局部结果由新容器承载，使用正确的 collect |

::: tip 先检查归约契约再调整执行方式

如果并行结果与顺序结果不一致，应先检查单位元、结合性、累加合并兼容和外部状态，不能仅通过改线程数掩盖问题。若需求本身是依赖前一笔结果的顺序计算，应保留明确顺序；[并行流的使用边界](./07-parallel-streams.md) 给出了这种场景的拆分反例和取舍方式。

:::

本例验证的是受控整数金额与本地容器的归约正确性，没有测试数据库事务、并发更新期间的数据一致性或生产性能。生产数据进入流水线之前，仍需要确定其读取边界。

## 七、官方依据

- [Java 21 Stream：reduce 与 collect 契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html)
- [Java 21 Collector：组合、隔离与一致性约束](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Collector.html)
- [Java 21 Collectors：分组、映射与结果容器](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Collectors.html)
