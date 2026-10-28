---
title: "函数式接口与方法引用"
tags:
  - Java
  - 函数式接口
  - 方法引用
excerpt: "按输入、输出与副作用选择函数式接口，解释条件短路、函数组合和消费顺序，并通过订单校验、构造器引用、接收者绑定及重载歧义验证方法引用的适配规则。"
date: 2026-09-08
---

# 函数式接口与方法引用

函数式接口把行为约束为可检查的输入、输出和异常契约；方法引用把已有方法或构造器适配到这个契约。订单校验、编号转换和审计记录虽然都能用 Lambda 表达，却有不同返回语义，不应统一包装成一个含糊的“回调”。

## 一、按输入和结果选择接口

标准接口提供可组合的通用形状，业务规则仍由实现负责。例如 Predicate 只保证得到 boolean，不保证自动校验订单是否完整；Supplier 只负责提供值，不承诺每次都是新对象、缓存值或非null值。[函数式接口包](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/package-summary.html)、[Supplier 契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/Supplier.html)

| 需求 | 接口与抽象方法 | 使用边界 |
|---|---|---|
| 判断一个订单是否合法 | `Predicate<Order>.test` | 返回boolean，允许按规则短路组合 |
| 把状态文本规范化 | `Function<String, String>.apply` | 输入与结果类型可以不同 |
| 记录一个订单编号 | `Consumer<String>.accept` | 无返回值，副作用需单独说明 |
| 延迟取得一个编号 | `Supplier<String>.get` | 无输入；延迟与缓存是不同能力 |
| 两个输入产生一个结果 | `BiFunction<T, U, R>.apply` | 不因为参数有两个就获得原子性 |
| 输入与结果保持同一类型 | UnaryOperator / BinaryOperator | 分别是一元和二元Function特化 |
| 数值转换或提取 | IntUnaryOperator、ToIntFunction等 | 使用基本类型签名，减少不必要装箱 |

::: tip 接口签名应保留领域与异常含义

需要表达领域名称或受检异常时，可以设计自己的函数式接口。不要为了复用标准Function，把多个参数挤进Object数组，也不要把本来有不同失败类型的操作都转成不透明的null。

:::

## 二、条件、函数与消费者各有组合顺序

### 1. 条件组合先判断是否继续

Predicate.and 在第一个条件为false时停止，or 在第一个条件为true时停止，negate 反转结果。示例先判断非null，再检查quantity，保护顺序不能随意交换；条件抛出的异常会直接传播，不会自动变成false。[Predicate 组合契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/Predicate.html)

因此，非null检查既是条件，也是后一个条件的执行前提。只有短路方向与保护条件一致，才能避免对缺失订单读取字段；把同样两个条件换成 or，并不能保留原来的保护效果。

### 2. 函数组合把前一步结果交给后一步

Function 的 andThen 先执行当前转换，再执行参数转换；compose 先执行参数转换，再执行当前转换。相同规则也用于示例中的 IntUnaryOperator：两倍后加一，输入3得到7；加一后两倍得到8。组合的是调用关系，声明组合对象时还没有处理输入。[Function 组合契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/Function.html)

检查组合时可以沿数据流确认类型：前一步的输出必须能成为后一步的输入。编译器能检查这条类型关系，但“先规范化再校验”和“先校验再规范化”是否满足业务规则，仍需用实际输入验证。

### 3. 消费串联保留副作用的失败边界

::: warning 消费动作串联不等于事务

Consumer.andThen 按顺序执行两次消费。第一次失败时，后面的消费不会执行；第一次已经完成的外部写入也不会自动回滚。示例只写本地列表以观察顺序，不能据此把“审计后发通知”视为一个事务。[Consumer 组合契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/Consumer.html)

:::

组合链很长、同一个字段反复转换或中途包含重试与异常处理时，提取具名方法更容易检查。组合API的价值是清楚表达依赖，不是让所有逻辑都缩成一行。

## 三、四种方法引用如何映射参数

方法引用没有固定的独立函数类型，编译器仍需结合目标接口解析签名与重载。表中写法都在完整程序中实际使用。[方法引用规则](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.13)

| 形式 | 本例目标接口 | 参数如何传递 |
|---|---|---|
| Integer::parseInt，静态方法 | `Function<String, Integer>` | apply的字符串成为parseInt实参，int结果装箱 |
| 一个字符串对象的::strip，已绑定实例 | `Supplier<String>` | 接收者已经固定，get无需再传字符串 |
| String::length，未绑定实例 | `ToIntFunction<String>` | 输入字符串本身成为length的接收者 |
| Order::new，构造器 | `BiFunction<String, Integer, Order>` | 编号与数量成为构造参数，apply时才构造 |

`String::length` 不表示调用静态length方法，`Order::new` 也没有立刻创建Order。判断引用含义时先写出目标接口的参数列表，再标出哪个参数成为接收者、哪些成为普通实参。

返回值也要适配。List.add返回boolean，本例将它引用为Consumer时丢弃结果；这种适配不代表List.add变成了void方法。需要判断是否真正新增元素时，应选择保留boolean结果的接口。

## 四、接收者绑定时机影响失败位置

`receiver::strip` 在创建方法引用时求值并绑定receiver；如果它为null，创建动作本身就抛出NullPointerException。改成 `() -> receiver.strip()` 后，取字段或调用方法发生在执行函数体时；对复杂接收者表达式，两种写法的求值次数也会不同。[方法引用的运行时求值](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.13.3)

::: warning 替换方法引用时检查求值时机

因此，“方法引用等价于Lambda”需要保持接收者、参数传递和求值时机一致。不能机械把每个Lambda都换成方法引用，尤其是接收者来自有副作用的工厂或会变动的字段时。

:::

本例还用 Comparator.comparingInt 和 thenComparing 把数量、编号组合为排序策略。比较契约与稳定性由[迭代、比较与排序](../05-generics-collections/04-iteration-comparison-sorting.md)主讲；这里验证方法引用和组合顺序，不重新定义相等性。

## 五、订单校验、转换和审计的完整程序

以下独立文件在Corretto 21.0.11验证，所有审计数据只写本地列表，无外部系统依赖。Order是当前调用所需字段的投影，数量限制由调用规则负责。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看FunctionalCompositionDemo的完整代码

```java
// FunctionalCompositionDemo.java
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.function.BiFunction;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.IntUnaryOperator;
import java.util.function.Predicate;
import java.util.function.Supplier;
import java.util.function.ToIntFunction;

/** 验证函数式接口组合、方法引用适配和顺序；不访问外部审计系统。 */
public final class FunctionalCompositionDemo {
    /** 仅提供静态验证入口，不产生实例状态。 */
    private FunctionalCompositionDemo() {}

    /**
     * 执行组合规则，或触发绑定与消费失败；无返回值，打印本地结果。
     * @param args 空参数正常运行；null-receiver 空接收者；consumer-failure 首个消费失败
     */
    public static void main(String[] args) {
        List<String> auditEntries = new ArrayList<>();
        // 本地消费记录编号；List.add的boolean返回值在Consumer适配中被忽略。
        Consumer<String> record = auditEntries::add;
        if (args.length > 0) {
            switch (args[0]) {
                case "null-receiver" -> {
                    String receiver = null;
                    // 绑定形式在创建引用时检查接收者，不等到get被调用。
                    Supplier<String> invalid = receiver::strip;
                    invalid.get();
                }
                case "consumer-failure" -> {
                    Consumer<String> failing = FunctionalCompositionDemo::rejectAudit;
                    try {
                        failing.andThen(record).accept("ORD-1001");
                    } catch (IllegalStateException error) {
                        System.out.println("audit after failure=" + auditEntries);
                        throw error;
                    }
                }
                default -> throw new IllegalArgumentException("unknown mode");
            }
            return;
        }
        // 构造器方法引用把编号与非null数量适配为Order，调用apply时才构造。
        BiFunction<String, Integer, Order> factory = Order::new;
        Order order = factory.apply("ORD-1001", 2);
        Predicate<Order> nonNull = Objects::nonNull;
        // 返回订单数量是否合法；只在非null保护通过后调用。
        Predicate<Order> positive = item -> item.quantity() > 0;
        Predicate<Order> valid = nonNull.and(positive);
        assert valid.test(order) && !valid.test(null);

        Function<String, String> normalize = FunctionalCompositionDemo::normalizeStatus;
        Function<String, Integer> parse = Integer::parseInt;
        Supplier<String> bound = " ORD-1001 "::strip;
        ToIntFunction<String> unbound = String::length;
        assert bound.get().equals(order.number()) && unbound.applyAsInt(order.number()) == 8;

        // 输入为本例小整数；分别返回两倍数量和增加一后的数量。
        IntUnaryOperator twice = quantity -> quantity * 2;
        // 此转换无副作用；本例输入不会溢出int。
        IntUnaryOperator increment = quantity -> quantity + 1;
        int firstDouble = twice.andThen(increment).applyAsInt(3);
        int firstIncrement = twice.compose(increment).applyAsInt(3);
        assert firstDouble == 7 && firstIncrement == 8;

        // 审计消费只写本地列表，返回值被忽略；用于观察andThen执行顺序。
        Consumer<String> accepted = number -> auditEntries.add("accepted:" + number);
        record.andThen(accepted).accept(order.number());
        assert auditEntries.equals(List.of("ORD-1001", "accepted:ORD-1001"));

        List<Order> orders = new ArrayList<>(List.of(factory.apply("ORD-1002", 2), order));
        orders.sort(Comparator.comparingInt(Order::quantity).thenComparing(Order::number));
        assert orders.getFirst().number().equals("ORD-1001");
        System.out.println("normalized=" + normalize.apply(" paid ") + ", parsed=" + parse.apply("2"));
        System.out.println("bound=" + bound.get() + ", length=" + unbound.applyAsInt(order.number()));
        System.out.println("composition=" + firstDouble + "," + firstIncrement);
        System.out.println("audit=" + auditEntries);
        System.out.println("sorted=" + orders);
    }

    /**
     * 规范化演示状态，避免依赖操作系统默认Locale。
     * @param value 非null状态文本，允许首尾空白
     * @return 去除首尾空白后的大写文本
     */
    private static String normalizeStatus(String value) {
        return value.strip().toUpperCase(Locale.ROOT);
    }

    /**
     * 故意拒绝审计输入，以验证后续Consumer不会执行；无返回值。
     * @param number 非null演示编号，仅用于错误信息
     * @throws IllegalStateException 始终抛出，不写入任何记录
     */
    private static void rejectAudit(String number) {
        throw new IllegalStateException("simulated audit failure: " + number);
    }

    /**
     * 保存当前适配示例所需字段，不承担完整订单实体职责。
     * @param number 非null演示编号
     * @param quantity 演示数量，正常输入为正整数
     */
    record Order(String number, int quantity) {}
}
```

:::

在本篇示例目录的PowerShell编译运行，程序同时检查空值短路和同数量订单的编号排序：

```powershell
New-Item -ItemType Directory -Force -Path out | Out-Null
javac -encoding UTF-8 -Xlint:all -Werror -d out FunctionalCompositionDemo.java
if ($LASTEXITCODE -ne 0) { throw '编译失败' }
java -ea -cp out FunctionalCompositionDemo
if ($LASTEXITCODE -ne 0) { throw '运行失败' }
```

实际输出如下，composition的两个值对应不同的组合顺序：

```text
normalized=PAID, parsed=2
bound=ORD-1001, length=8
composition=7,8
audit=[ORD-1001, accepted:ORD-1001]
sorted=[Order[number=ORD-1001, quantity=2], Order[number=ORD-1002, quantity=2]]
```

## 六、复现绑定失败、消费中断与重载歧义

### 1. 运行时绑定失败与消费中断

正常源码的两个故障入口分别验证接收者求值和Consumer链中断：

```powershell
java -cp out FunctionalCompositionDemo null-receiver
if ($LASTEXITCODE -ne 1) { throw '空接收者未按预期失败' }
java -cp out FunctionalCompositionDemo consumer-failure
if ($LASTEXITCODE -ne 1) { throw '消费未按预期失败' }
```

第一种实际抛出NullPointerException，定位在创建receiver::strip处。第二种先打印下面的诊断，再传播IllegalStateException，说明后续record未执行：

```text
audit after failure=[]
```

修复时分别保证绑定接收者有效、为消费操作建立明确的失败处理。故障入口没有外部写入，重新运行正常入口即可恢复；真实多步骤副作用需要自己的补偿或事务设计。

### 2. 编译时目标接口存在歧义

下面的独立文件故意声明两个都接受零参数、String结果的重载。Callable只作为允许受检异常的签名候选，不执行线程调度。

::: details 查看AmbiguousMethodReference的完整代码

```java
// AmbiguousMethodReference.java
import java.util.concurrent.Callable;
import java.util.function.Supplier;

/** 两个重载接受相同形状的行为，故意保留无法选择的调用。 */
class AmbiguousMethodReference {
    /**
     * 仅表示重载候选，不执行异步任务；无返回值和副作用。
     * @param action 返回String的非null行为
     */
    static void choose(Callable<String> action) {}
    /**
     * 仅表示另一个重载候选；无返回值和副作用。
     * @param action 返回String的非null行为
     */
    static void choose(Supplier<String> action) {}
    /** 用构造器引用触发歧义；本文件不能编译，无运行副作用。 */
    static void inspect() {
        choose(String::new);
    }
}
```

:::

保存后独立编译：

```powershell
javac '-J-Duser.language=en' -encoding UTF-8 -d out AmbiguousMethodReference.java
if ($LASTEXITCODE -ne 1) { throw '重载歧义未按预期出现' }
```

本机诊断为reference to choose is ambiguous。可先声明明确类型的Supplier变量再传入，或重新设计重载名称；仅把String::new改成同形状Lambda并不能解决两个目标都匹配的问题。
