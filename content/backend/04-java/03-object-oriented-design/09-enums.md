---
title: "枚举"
tags:
  - Java 21
  - enum
  - 状态机
excerpt: "说明枚举常量、字段、方法、switch 与 EnumSet 的使用方式，并通过订单状态机验证业务编码、合法迁移和持久化边界。"
date: 2026-09-03
---

# 枚举

枚举用一个类型声明有限且封闭的实例集合。每个枚举常量都是该枚举类型的唯一对象，可以拥有字段、构造器和行为，因此比字符串常量更适合表达订单状态、渠道类型等固定业务集合。

## 一、枚举提供类型安全的固定实例

```java
enum OrderStatus {
    CREATED,
    PAID,
    SHIPPED,
    COMPLETED,
    CANCELED
}
```

变量 `OrderStatus status` 只能保存这些常量之一或 `null`，不能误传普通字符串。枚举隐式继承 `java.lang.Enum`，不能再继承其他类，但可以实现接口。

枚举常量在对应类加载器内各有一个实例，因此比较时可直接使用 `==`：

```java
if (status == OrderStatus.PAID) {
    // 处理已支付订单
}
```

`equals` 同样可用，但 `==` 能表达枚举单例身份，并且在一侧为 `null` 时不会调用方法。

## 二、枚举常量可以携带数据

业务系统通常需要稳定编码和展示文本，不应把 Java 常量名直接当作所有外部协议。下面截取本篇 `EnumDemo.java` 的常量、字段与构造器，省略查询和状态迁移方法；完整程序仍保留全部五种状态。

枚举常量的参数最终传给同一个构造器；`code` 和 `terminal` 分别表达外部编码与终态规则。

::: details 查看枚举编码声明片段

```java
private enum OrderStatus {
    CREATED("created", false),
    PAID("paid", false),
    SHIPPED("shipped", false),
    COMPLETED("completed", true),
    CANCELED("canceled", true);

    private final String code;
    private final boolean terminal;

    /**
     * 创建状态常量。
     *
     * @param code 对外使用的稳定业务编码
     * @param terminal 是否为不能继续迁移的终态
     */
    OrderStatus(String code, boolean terminal) {
        this.code = code;
        this.terminal = terminal;
    }

    // 查询与迁移方法在本篇完整程序中给出。
}
```

:::

::: tip 枚举常量应保持稳定含义

枚举构造器不能由外部调用；常量声明时的参数用于创建固定实例。字段通常应为 `final`，避免全局唯一常量在运行中改变含义。

:::

## 三、外部编码与枚举实例的映射

Java 常量名、声明顺序和业务协议分别由不同变更驱动。持久化先确定稳定编码，再让解析入口把外部值转换为受控的枚举实例，避免源码重排改变历史数据含义。

### 1. name、ordinal 与业务编码 {#三、name、ordinal-与业务编码}

| 表达 | 示例 | 稳定性与用途 |
|------|------|--------------|
| `name()` | `"COMPLETED"` | Java 声明名，重命名会变化 |
| `ordinal()` | `3` | 源码声明位置，仅供枚举内部设施，不可持久化 |
| 自定义 `code` | `"completed"` | 可作为显式维护的数据库或 API 编码 |
| 展示文本 | `"已完成"` | 可能国际化或调整，不宜作为稳定标识 |

::: danger 持久化 ordinal 会造成状态错配

持久化 `ordinal()` 是严重风险：在中间插入新常量后，旧数字会映射到另一状态且不会自动报错。外部协议应存储明确业务编码，并对未知编码给出可诊断失败。

:::

### 2. 解析外部输入 {#四、解析外部输入}

`OrderStatus.valueOf("PAID")` 按声明名精确匹配，大小写不同或未知名称会抛出 `IllegalArgumentException`。它适合可信的内部名称，不适合直接解析用户或外部系统的业务编码。

```java
static OrderStatus fromCode(String code) {
    for (OrderStatus status : values()) {
        if (status.code.equals(code)) {
            return status;
        }
    }
    throw new IllegalArgumentException("未知订单状态：" + code);
}
```

::: tip 建立编码映射时检测重复值

`values()` 返回按声明顺序排列的新数组。状态数量少时线性查找足够清晰；高频解析可预先建立不可变映射，但必须在初始化时检测重复编码。

:::

## 四、状态规则与状态持有者

订单状态机有两个协作角色：枚举描述从某个状态允许去哪里，订单对象持有当前状态并执行迁移。只定义有限状态集合，还不能阻止调用方跨越业务步骤。

### 1. 枚举行为表达状态规则 {#五、枚举行为表达状态规则}

把状态规则放在枚举或领域对象中，可以避免不同调用方各自维护字符串条件：

```java
boolean canTransitTo(OrderStatus target) {
    EnumSet<OrderStatus> allowed = switch (this) {
        case CREATED -> EnumSet.of(PAID, CANCELED);
        case PAID -> EnumSet.of(SHIPPED, CANCELED);
        case SHIPPED -> EnumSet.of(COMPLETED);
        case COMPLETED, CANCELED -> EnumSet.noneOf(OrderStatus.class);
    };
    return allowed.contains(target);
}
```

`switch` 表达式覆盖了全部常量，因此无需 `default`。新增常量后编译器会要求重新处理分支，比吞掉未知状态的默认分支更容易暴露遗漏。

`EnumSet` 专用于同一枚举类型的集合，语义上直接表达允许状态集合；`EnumMap` 则适合以枚举为键的映射。两者不能保存 `null` 键或混合不同枚举类型。

### 2. 状态变化仍由领域对象控制 {#六、状态变化仍由领域对象控制}

枚举能回答迁移规则，但订单对象负责持有当前状态并保证每次迁移合法：

```java
void transitTo(OrderStatus target) {
    if (!status.canTransitTo(target)) {
        throw new IllegalStateException(
                "不允许从 %s 迁移到 %s".formatted(status, target));
    }
    status = target;
}
```

::: warning 枚举不能替代状态迁移校验

如果直接公开 `setStatus`，调用方仍可从 `SHIPPED` 改回 `CREATED`，枚举本身无法保护订单不变量。类型安全与状态封装必须同时存在。

:::

## 五、运行订单状态机示例 {#七、运行订单状态机示例}

完整源码保存为 `EnumDemo.java`。订单从 `CREATED` 迁移到 `PAID`、`SHIPPED`，随后故意尝试回到 `CREATED`。

```java
Order order = new Order("ORD-9001");
order.transitTo(OrderStatus.PAID);
order.transitTo(OrderStatus.SHIPPED);

System.out.println("status=" + order.status().code());
System.out.println("terminal=" + order.status().terminal());
System.out.println("parsed=" + OrderStatus.fromCode("completed"));
```

新建一个空文件夹，将以下代码保存为 `EnumDemo.java`，编码使用 UTF-8。后续编译和运行命令均在该文件夹执行。

::: details 查看 EnumDemo 完整代码

```java [EnumDemo.java]
import java.util.EnumSet;

/**
 * 演示枚举如何表达封闭订单状态、业务编码和允许的状态迁移。
 */
public final class EnumDemo {

    /**
     * 示例入口类不需要实例化。
     */
    private EnumDemo() {
    }

    /**
     * 示例入口。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        Order order = new Order("ORD-9001");
        order.transitTo(OrderStatus.PAID);
        order.transitTo(OrderStatus.SHIPPED);

        System.out.println("status=" + order.status().code());
        System.out.println("terminal=" + order.status().terminal());
        System.out.println("parsed=" + OrderStatus.fromCode("completed"));

        try {
            order.transitTo(OrderStatus.CREATED);
        } catch (IllegalStateException exception) {
            System.out.println("rejected=" + exception.getMessage());
        }
    }

    /**
     * 订单状态拥有稳定业务编码、终态标记和显式迁移规则。
     */
    private enum OrderStatus {
        CREATED("created", false),
        PAID("paid", false),
        SHIPPED("shipped", false),
        COMPLETED("completed", true),
        CANCELED("canceled", true);

        private final String code;
        private final boolean terminal;

        /**
         * 创建状态常量。
         *
         * @param code 对外使用的稳定业务编码
         * @param terminal 是否为不能继续迁移的终态
         */
        OrderStatus(String code, boolean terminal) {
            this.code = code;
            this.terminal = terminal;
        }

        /**
         * 返回稳定业务编码，避免向外暴露枚举声明名或序号。
         *
         * @return 小写业务编码
         */
        private String code() {
            return code;
        }

        /**
         * 判断当前状态是否为终态。
         *
         * @return 不能继续迁移时返回 true
         */
        private boolean terminal() {
            return terminal;
        }

        /**
         * 判断是否允许迁移到目标状态。
         *
         * @param target 目标状态，不能为 null
         * @return 符合状态机规则时返回 true
         */
        private boolean canTransitTo(OrderStatus target) {
            EnumSet<OrderStatus> allowed = switch (this) {
                case CREATED -> EnumSet.of(PAID, CANCELED);
                case PAID -> EnumSet.of(SHIPPED, CANCELED);
                case SHIPPED -> EnumSet.of(COMPLETED);
                case COMPLETED, CANCELED -> EnumSet.noneOf(OrderStatus.class);
            };
            return allowed.contains(target);
        }

        /**
         * 按业务编码解析订单状态。
         *
         * @param code 外部业务编码，区分大小写
         * @return 与编码对应的状态
         * @throws IllegalArgumentException 编码未知时抛出
         */
        private static OrderStatus fromCode(String code) {
            for (OrderStatus status : values()) {
                if (status.code.equals(code)) {
                    return status;
                }
            }
            throw new IllegalArgumentException("未知订单状态：" + code);
        }
    }

    /**
     * 订单只允许通过状态机方法改变状态。
     */
    private static final class Order {
        private final String number;
        private OrderStatus status = OrderStatus.CREATED;

        /**
         * 创建初始状态为 CREATED 的订单。
         *
         * @param number 订单号，不能为空
         */
        private Order(String number) {
            this.number = number;
        }

        /**
         * 按状态机规则迁移订单。
         *
         * @param target 目标状态，不能为 null
         * @throws IllegalStateException 当前状态不允许迁移到目标状态时抛出
         */
        private void transitTo(OrderStatus target) {
            if (!status.canTransitTo(target)) {
                throw new IllegalStateException("订单 %s 不允许从 %s 迁移到 %s"
                        .formatted(number, status, target));
            }
            status = target;
        }

        /**
         * 返回当前状态。
         *
         * @return 当前订单状态
         */
        private OrderStatus status() {
            return status;
        }
    }
}
```

:::


```powershell

New-Item -ItemType Directory -Force out | Out-Null
javac -encoding UTF-8 -d out EnumDemo.java
java -cp out EnumDemo
```

预期输出：

```text
status=shipped
terminal=false
parsed=COMPLETED
rejected=订单 ORD-9001 不允许从 SHIPPED 迁移到 CREATED
```

::: info 进程内状态机的验证边界

失败路径在赋值前抛出异常，所以订单仍保持 `SHIPPED`。这个状态机只演示进程内规则，没有处理数据库并发更新、状态历史和幂等命令。

:::

## 六、边界与误区 {#八、边界与误区}

| 做法 | 风险 | 合理替代 |
|------|------|----------|
| 用字符串表示固定状态 | 拼写错误只能运行时发现 | 使用枚举参数和字段 |
| 持久化 `ordinal()` | 调整声明顺序会污染历史数据 | 持久化显式业务编码 |
| 直接对用户输入调用 `valueOf` | 大小写或未知值产生粗糙异常 | 使用 `fromCode` 并转换边界错误 |
| 在枚举中访问数据库或远程服务 | 全局常量承担不稳定副作用 | 枚举保留规则，外部协作者处理 I/O |
| 用枚举表示可动态扩展插件 | 集合在编译期封闭 | 使用接口和注册机制 |

规范依据可参阅 [JLS 8.9：Enum Classes](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.9)、[Java 21 Enum API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Enum.html) 与 [Java 21 EnumSet API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/EnumSet.html)。
