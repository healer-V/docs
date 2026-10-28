---
title: "Optional"
tags:
  - Java
  - Optional
excerpt: "用订单查询说明 Optional 如何表达单个结果的缺失，区分 map、flatMap 与默认值求值时机，建立缺失和系统失败的边界，并通过真实异常验证空值与返回契约。"
date: 2026-09-08
---

# Optional

`Optional<T>` 表示“没有值”或“有一个非null的T”。它适合把单个查询结果的缺失写进方法返回契约，但不保存失败原因，也不能把所有null或异常都变成合理的“未找到”。

## 一、先确定缺失是不是正常结果

查询一个订单编号时，“该编号没有对应订单”可以是正常缺失；数据源不可用、没有查询权限或记录损坏则需要保留失败原因。示例findOrder只把内存映射没有键转换为空Optional，对故意模拟的查询故障仍抛出异常。

| 业务结果 | 合适表达 | 原因 |
|---|---|---|
| 查询一个可能不存在的订单 | `Optional<Order>` | 调用方必须考虑有值与无值 |
| 查询全部匹配订单，没有任何匹配 | 空列表 | 已经能表达零个结果，不必再套一层 |
| 未执行查询与已执行但空结果要区分 | 明确状态模型 | 单一空列表或随意嵌套Optional都容易丢失语义 |
| 查询操作失败 | 有意义的异常或结果类型 | 需要携带错误原因，而不只是有无值 |
| 必填输入缺失 | 参数校验失败 | 不应把非法输入包装成正常空结果 |

Optional官方定位主要是方法返回值。把它作为字段或参数不是Java语法错误，但会让调用方同时面对“包装器为null”和“包装器为空”等状态；是否适合序列化或框架绑定，也要看具体契约。当前示例只在返回边界包装可空城市字段，不引入ORM或序列化假设。[Optional API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html)

## 二、创建方式决定null如何进入边界

of要求值非null；ofNullable将null转换为空；empty明确表示没有值。返回类型已经是Optional的方法应始终返回Optional实例，否则调用方又得检查外层引用。

::: warning Optional 提取结果仍可能为 null

Optional有值时内容一定非null，但它不保证所有提取操作的最终结果非null。例如orElse(null)和返回null的默认Supplier仍能让提取结果为null。使用API时应同时检查容器契约与默认值契约。

:::

这是值语义对象，不应依赖empty是否是单例，也不应通过对象身份判断“同一个缺失”。使用isEmpty、isPresent或组合操作表达状态；不要把Optional实例当作锁对象。

## 三、map 与 flatMap {#三、map与flatmap传播的是不同结果形状}

map接收普通值转换：有值时调用，无值时跳过；转换结果为null时得到空Optional。flatMap用于转换本来就返回Optional的情况，避免额外套一层，但其转换函数不能返回null。

示例先查询订单，再用findCity得到可能缺失的城市，通过strip规范化后过滤空白，最后提供UNKNOWN。城市字段为null是正常缺失；若findCity返回null包装器，则属于实现违反契约，不能与正常缺失混为一谈。

| 转换目标 | 合适操作 | 关键边界 |
|---|---|---|
| Order变成状态字符串 | map(Order::status) | null结果转为空 |
| Order变成可选城市 | flatMap(findCity) | 返回空Optional表示缺失，返回null报错 |
| 只保留符合条件的值 | filter | 条件false变为空，条件异常继续传播 |
| 当前缺失时尝试另一个可选来源 | or | Supplier只在缺失时调用，返回Optional |
| 获取存在值并执行副作用 | ifPresent / ifPresentOrElse | 消费分支发生异常时不会自动恢复 |

::: info map 与 flatMap 具有不同空值契约

map和flatMap的空值差异属于公开契约，不能把flatMap当作“更通用的map”随意替换。[map](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html#map(java.util.function.Function))、[flatMap](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html#flatMap(java.util.function.Function))

:::

## 四、缺失结果的提取策略

提取结果前需要先确定缺失的处理含义：可以使用备用值，还是必须以业务错误结束当前操作。默认值策略还要继续区分备用值是否需要计算。

### 1. 默认值的求值时机 {#四、orelse与orelseget有不同求值时机}

::: tip 需要延迟计算默认值时使用 orElseGet

orElse接收已经计算好的备用值，所以 `present.orElse(loadDefault())` 即使已有结果，也会先执行loadDefault。orElseGet接收行为，只有缺失时调用Supplier。选择依据是默认值是否需要计算，以及计算是否有副作用，不能只看两个表达式最后返回相同字符串。

:::

完整示例用DefaultStatusSource.loads观察调用次数：有值时orElse调用一次load；随后有值时orElseGet不增加次数；缺失时orElseGet再调用一次，最终为2。计数器仅用于本地单线程诊断，不代表缓存行为。

### 2. 必需结果使用明确的失败契约

get在空值时抛出NoSuchElementException。无参orElseThrow也抛出相同类型，但能更明确地表达“当前必须存在”；需要业务错误含义时使用接收异常Supplier的重载。不要把所有“先判断再get”都视为非法，而应看分支是否清晰、是否重复检查，以及错误是否保留了业务上下文。

查询接口允许订单不存在，并不意味着每个调用场景都允许继续执行。例如订单详情查询可以返回缺失，发货操作则必须在缺失时停止；应在发货边界把空结果转换为明确错误，不能补造一个默认订单继续更新状态。

## 五、保留可选结果的边界而不过度包装

::: tip 复杂缺失分支保留清楚的控制流

Optional不要求所有控制流都写成长链。存在分支和缺失分支各自包含多个步骤时，具名变量和普通条件分支更利于定位失败。List中的每个位置若都套Optional，也应先确认位置与缺失是否有独立业务意义；只需要实际结果时可以收敛为普通列表。

:::

Optional.stream返回0或1个元素的顺序流，适合把可选结果接入集合处理；它不是重复查询，也不会把Optional变成可反复消费的同一个Stream。完整流水线语义见[Stream流水线与常用操作](./05-stream-pipelines.md)。OptionalInt、OptionalLong和OptionalDouble提供基本类型的可选结果，API并不与泛型Optional完全相同。

本章以Java 21为基线，使用or、stream和ifPresentOrElse等可用API。Java 8替代与迁移由维护章节集中处理，不把主线示例拆成多套不同语义。

## 六、查询链与默认值的完整验证

以下独立程序使用Corretto 21.0.11，无外部数据源。FAIL-LOOKUP是故意触发错误的演示输入，不是生产故障证据；城市为空和订单不存在均有单独断言。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看OptionalQueryDemo的完整代码

```java
// OptionalQueryDemo.java
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/** 用内存订单查询验证缺失传播、默认值求值和异常边界。 */
public final class OptionalQueryDemo {
    private static final Map<String, Order> ORDERS = Map.of(
            "ORD-1001", new Order("ORD-1001", "PAID", " Shanghai "),
            "ORD-1002", new Order("ORD-1002", "CREATED", null));

    /** 只提供静态演示入口，不创建额外状态。 */
    private OptionalQueryDemo() {}

    /**
     * 查询订单与默认值；无返回值，输出结果或故意传播异常。
     * @param args 空参数正常运行；empty-get、flatmap-null、of-null、lookup-failure为故障模式
     */
    public static void main(String[] args) {
        Optional<Order> present = findOrder("ORD-1001");
        if (args.length > 0) {
            switch (args[0]) {
                case "empty-get" -> findOrder("ORD-9999").get();
                case "flatmap-null" -> {
                    // 故意违反flatMap的返回契约：应返回Optional.empty而不是null。
                    present.flatMap(order -> null);
                }
                case "of-null" -> Optional.of((String) null);
                case "lookup-failure" -> findOrder("FAIL-LOOKUP");
                default -> throw new IllegalArgumentException("unknown mode");
            }
            return;
        }
        // 城市为空或全空白时不保留结果；map与filter仅作用于存在的值。
        String city = present.flatMap(OptionalQueryDemo::findCity)
                .map(String::strip).filter(value -> !value.isBlank()).orElse("UNKNOWN");
        assert city.equals("Shanghai");
        assert findOrder("ORD-1002").flatMap(OptionalQueryDemo::findCity).isEmpty();
        // 故意返回null以验证map转为空Optional，不代表推荐的数据转换。
        Optional<String> mappedNull = present.map(order -> (String) null);
        assert mappedNull.isEmpty();

        DefaultStatusSource defaults = new DefaultStatusSource();
        Optional<String> status = present.map(Order::status);
        String eager = status.orElse(defaults.load());
        assert defaults.loads == 1;
        String lazy = status.orElseGet(defaults::load);
        assert defaults.loads == 1;
        String missing = findOrder("ORD-9999").map(Order::status).orElseGet(defaults::load);
        assert defaults.loads == 2 && missing.equals("UNKNOWN");

        // 仅当第一份查询缺失时查后备编号；返回值始终为Optional实例。
        Optional<Order> fallback = findOrder("ORD-9999").or(() -> findOrder("ORD-1001"));
        assert fallback.orElseThrow().number().equals("ORD-1001");
        List<String> events = new ArrayList<>();
        // 有值时记录编号，无值时记录缺失标记；两条分支仅修改本地事件列表。
        present.ifPresentOrElse(
                // 有值时消费编号，无返回值，追加一条本地事件。
                order -> events.add(order.number()),
                // 缺失时无输入与返回值，追加缺失事件。
                () -> events.add("MISSING"));
        // 当前查询确定为空，仅缺失分支执行；不把查询异常转成缺失。
        findOrder("ORD-9999").ifPresentOrElse(
                // 有值时消费编号，无返回值，追加一条本地事件。
                order -> events.add(order.number()),
                // 缺失时无输入与返回值，追加缺失事件。
                () -> events.add("MISSING"));
        assert events.equals(List.of("ORD-1001", "MISSING"));
        assert present.stream().count() == 1 && Optional.empty().stream().count() == 0;
        System.out.println("city=" + city + ", mapped null empty=" + mappedNull.isEmpty());
        System.out.println("statuses=" + eager + "," + lazy + "," + missing + "; loads=" + defaults.loads);
        System.out.println("fallback=" + fallback.orElseThrow().number());
        System.out.println("events=" + events);
    }

    /**
     * 查询演示映射；只把没有映射解释为缺失。
     * @param number 非null编号；FAIL-LOOKUP专用于模拟底层查询故障
     * @return 已找到的订单或空Optional，绝不返回null
     * @throws IllegalStateException 故障输入触发的模拟查询错误
     */
    private static Optional<Order> findOrder(String number) {
        Objects.requireNonNull(number, "number");
        if ("FAIL-LOOKUP".equals(number)) {
            throw new IllegalStateException("simulated lookup failure");
        }
        return Optional.ofNullable(ORDERS.get(number));
    }

    /**
     * 将底层可空城市字段转换为返回值边界上的Optional。
     * @param order 非null演示订单
     * @return 有城市时包含原文本，否则为空
     */
    private static Optional<String> findCity(Order order) {
        return Optional.ofNullable(order.city());
    }

    /** 用执行次数观察默认值求值；仅供单线程诊断，不是缓存或真实数据源。 */
    private static final class DefaultStatusSource {
        private int loads;

        /**
         * 计算固定默认状态并累计观察次数。
         * @return UNKNOWN；副作用是loads增加1
         */
        private String load() {
            loads++;
            return "UNKNOWN";
        }
    }

    /**
     * 当前查询需要的订单字段；城市允许缺失，不使用Optional实体字段。
     * @param number 非null演示编号
     * @param status 非null演示状态
     * @param city 城市文本，允许null及首尾空白
     */
    record Order(String number, String status, String city) {}
}
```

:::

在本篇示例目录的PowerShell执行：

```powershell
New-Item -ItemType Directory -Force -Path out | Out-Null
javac -encoding UTF-8 -Xlint:all -Werror -d out OptionalQueryDemo.java
if ($LASTEXITCODE -ne 0) { throw '编译失败' }
java -ea -cp out OptionalQueryDemo
if ($LASTEXITCODE -ne 0) { throw '运行失败' }
```

实际结果同时展示城市处理、默认值次数、后备查询和条件消费：

```text
city=Shanghai, mapped null empty=true
statuses=PAID,PAID,UNKNOWN; loads=2
fallback=ORD-1001
events=[ORD-1001, MISSING]
```

## 七、区分空值误用与查询故障

正常编译后可独立运行四种失败模式。每个进程都重新建立演示数据：

```powershell
foreach ($mode in @('empty-get', 'flatmap-null', 'of-null', 'lookup-failure')) {
    java -cp out OptionalQueryDemo $mode
    if ($LASTEXITCODE -ne 1) { throw "$mode 未按预期失败" }
}
```

| 模式 | 实际异常与位置 | 原因及正确处理 |
|---|---|---|
| empty-get | NoSuchElementException，空结果get处 | 当前编号不存在；组合处理缺失或明确要求存在 |
| flatmap-null | NullPointerException，flatMap处 | 转换返回null包装器；改为Optional.empty或非空Optional |
| of-null | NullPointerException，Optional.of处 | 输入违反非空要求；按真实边界校验或使用ofNullable |
| lookup-failure | IllegalStateException，findOrder处 | 故意模拟查询失败；保留失败原因，不转为空结果 |

无参数运行可恢复正常验证。示例没有数据库连接、网络重试或事务，不声称Optional能处理这些工程故障；它证明的是结果缺失与操作失败必须分别建模。
