---
title: "条件分支"
tags:
  - Java 21
  - if
  - switch
excerpt: "说明如何使用 if、保护性返回和 switch 表达式表达互斥业务规则，并处理分支顺序、完整性、贯穿与 null 输入边界。"
date: 2026-09-02
---

# 条件分支

条件分支根据布尔条件或离散选择值决定执行路径。正确的分支不仅要让当前输入得到结果，还要明确条件优先级、未覆盖输入和 `null` 的处理方式，保证同一业务状态不会意外执行多个互斥动作。

## 一、if 条件必须是 boolean

Java 不会把数字、字符串、对象或 `null` 隐式转换为真假：

```java
int itemCount = 3;
if (itemCount > 0) {
    System.out.println("订单包含商品");
}
```

`if (itemCount)` 不能编译。这与 JavaScript 的 truthy/falsy 规则不同，也意味着 Java 条件必须明确写出比较或调用返回 `boolean` 的方法。

## 二、if、else if 与条件顺序

### 1. 互斥分支只执行一条路径

```java
if (score >= 90) {
    level = "A";
} else if (score >= 80) {
    level = "B";
} else {
    level = "C";
}
```

条件从上到下判断，首个为 `true` 的分支执行后，后续 `else if` 不再判断。范围条件应按不会被前一条件吞掉的顺序排列。

如果写成两个独立 `if`，两个条件都可能执行：

```java
if (score >= 80) {
    // 执行
}
if (score >= 90) {
    // score 为 95 时也执行
}
```

选择独立 `if` 还是 `else if` 取决于业务动作能否同时成立，不能只根据排版偏好决定。

### 2. 保护性返回减少嵌套

不满足前置条件时可以提前返回：

```java
if (!paid) {
    return "WAIT_PAYMENT";
}
```

::: tip 用保护性返回明确正常路径

后续代码只处理已支付状态，避免把整个主要流程包在多层 `else` 中。提前返回应表达清晰的边界结果，不能散落成难以追踪的任意出口。

:::

## 三、switch 适合离散选择值

`switch` 适合根据一个表达式的离散值选择分支，例如状态、命令、枚举或代码。复杂范围、多个互不相关条件和需要短路组合的规则通常更适合 `if` 或独立规则对象。

传统冒号形式的 `switch` 语句可能发生贯穿：

```java
switch (status) {
    case "PAID":
        action = "SHIP";
        break;
    case "CANCELLED":
        action = "STOP";
        break;
    default:
        throw new IllegalArgumentException("未知状态");
}
```

遗漏 `break` 时会继续执行后续标签，除非代码明确需要共享逻辑，否则这是常见缺陷来源。

## 四、Java 21 switch 表达式

### 1. 箭头分支不会贯穿

现代 `switch` 可以直接产生值：

```java
String action = switch (status) {
    case "CREATED" -> "ALLOCATE_STOCK";
    case "PAID" -> "SHIP";
    case "CANCELLED", "REFUNDED" -> "STOP";
    default -> throw new IllegalArgumentException("未知状态");
};
```

箭头右侧分支不会贯穿到下一分支，多个标签可以使用逗号合并。因为整个结构是表达式，末尾需要分号完成变量初始化语句。

### 2. 复杂分支使用 yield

分支需要多条语句时使用代码块，并通过 `yield` 交付该分支结果：

```java
int priority = switch (status) {
    case "PAID" -> 10;
    case "CREATED" -> {
        int basePriority = 3;
        yield basePriority + 1;
    }
    default -> 0;
};
```

`yield` 只负责向当前 `switch` 表达式提供值，不等同于从外层方法 `return`。

### 3. 表达式必须覆盖所有可能值

::: info switch 表达式需要覆盖全部可能值

`switch` 表达式必须是穷尽的。对字符串等开放值域通常需要 `default`；对枚举或密封类型，编译器可以利用类型集合检查完整性。是否在 `default` 返回兜底值还是抛出异常，应根据未知状态能否安全继续决定。

:::

| 未知输入的业务含义 | `default` 建议 |
|--------------------|----------------|
| 可以安全使用通用展示文案 | 返回明确的通用结果 |
| 表示上下游协议新增了未适配状态 | 抛出异常并记录原始状态 |
| 表示数据损坏或违反不变量 | 立即失败，不伪装成正常状态 |
| 有限枚举已经逐项覆盖 | 让类型和编译器帮助检查，谨慎添加吞掉新值的宽松默认分支 |

宽松 `default` 会让新增状态在编译时保持沉默，因此不能为了“保证能运行”一律返回成功结果。

## 五、null 必须具有明确策略

对传统字符串 `switch`，选择表达式为 `null` 通常会抛出 `NullPointerException`，`default` 不能自动把它当成普通未知字符串。

Java 21 的增强 `switch` 可以在适用的引用类型选择器中显式编写 `case null`，但业务方法更常在入口明确非空契约：

```java
Objects.requireNonNull(status, "订单状态不能为 null");
```

两种方式表达不同语义：

| 规则 | 适用情况 |
|------|----------|
| 拒绝 `null` | 状态缺失表示调用方违反契约 |
| `case null` 返回明确结果 | 空状态是业务允许且有独立含义的输入 |

::: warning 不要把数据缺失当成普通未知状态

不要让 `null` 悄悄落入与未知非空状态相同的路径，否则数据缺失可能被误判为普通新状态。

:::

## 六、条件规则的可读性

复杂条件应先命名中间事实：

```java
boolean hasItems = itemCount > 0;
boolean addressReady = shippingAddress != null && !shippingAddress.isBlank();
boolean canShip = paid && hasItems && addressReady;
```

相比在 `if` 中堆叠一整行表达式，命名后的条件可以单独验证，也更容易说明哪个业务约束失败。

分支数量持续增长时，应判断是否已经从“控制流问题”演变为“状态模型或策略设计问题”。把二十个状态集中在一个方法中并不会因为使用 `switch` 就自动可维护。

## 七、完整程序

将完整源码保存为 `ConditionalsDemo.java`。它先用保护性返回处理未支付订单，再用 `switch` 表达式选择已支付订单动作。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看ConditionalsDemo的完整代码

```java
import java.util.Objects;

/**
 * 演示使用 if 和 switch 表达互斥的订单处理规则。
 */
public final class ConditionalsDemo {

    /**
     * 工具类不需要实例化。
     */
    private ConditionalsDemo() {
    }

    /**
     * 输出三个订单状态的处理动作；传入 null 可触发空状态失败场景。
     *
     * @param args 可选失败模式 null
     */
    public static void main(String[] args) {
        if (args.length == 1 && "null".equals(args[0])) {
            System.out.println(decideOrderAction(null, true));
            return;
        }

        System.out.println("unpaid=" + decideOrderAction("CREATED", false));
        System.out.println("paid=" + decideOrderAction("PAID", true));
        System.out.println("closed=" + decideOrderAction("CANCELLED", true));
    }

    /**
     * 根据支付标记和订单状态选择唯一处理动作。
     *
     * @param status 订单状态，不能为 null
     * @param paid 是否已经完成支付
     * @return WAIT_PAYMENT、ALLOCATE_STOCK、SHIP 或 STOP
     * @throws NullPointerException 状态为 null 时抛出
     * @throws IllegalArgumentException 状态不受支持时抛出
     */
    private static String decideOrderAction(String status, boolean paid) {
        Objects.requireNonNull(status, "订单状态不能为 null");
        if (!paid) {
            return "WAIT_PAYMENT";
        }

        return switch (status) {
            case "CREATED" -> "ALLOCATE_STOCK";
            case "PAID" -> "SHIP";
            case "CANCELLED", "REFUNDED" -> "STOP";
            default -> throw new IllegalArgumentException("不支持的订单状态：" + status);
        };
    }
}
```

:::

## 八、编译、运行与结果

```powershell
javac -Xlint:all -encoding UTF-8 `
  -d out `
  ConditionalsDemo.java

java -cp out ConditionalsDemo
```

预期输出：

```text
unpaid=WAIT_PAYMENT
paid=SHIP
closed=STOP
```

未支付条件优先于状态选择，所以 `CREATED` 且未支付只返回等待支付；已支付订单才进入互斥状态映射。

## 九、失败场景

运行空状态路径：

```powershell
java -cp out ConditionalsDemo null
```

进程以非零状态结束，异常消息指出订单状态不能为 `null`。调用栈会定位到 `Objects.requireNonNull` 和 `decideOrderAction`，证明失败发生在方法契约边界，而不是某个模糊的 `switch` 分支中。

其他常见问题如下：

| 问题 | 证据 | 修复方向 |
|------|------|----------|
| 高阈值分支永远不执行 | 更宽的低阈值条件排在前面 | 重新排列互斥范围并增加边界测试 |
| 同一订单执行多个动作 | 使用了多个独立 `if` | 确认规则互斥后使用 `else if`、返回或 `switch` |
| 传统 switch 意外贯穿 | 缺少 `break` | 补 `break` 或迁移到箭头分支 |
| 新状态被当成默认成功 | `default` 返回宽松兜底 | 对不能安全处理的状态抛出明确异常 |

## 十、Java 8 维护边界

Java 8 支持 `if`、字符串 `switch` 和传统冒号标签，但不支持 `switch` 表达式、箭头标签、逗号多标签和 `yield`。维护 Java 8 项目时需要使用局部结果变量与 `break`：

```java
String action;
switch (status) {
    case "PAID":
        action = "SHIP";
        break;
    default:
        throw new IllegalArgumentException("不支持的状态");
}
```

::: tip 先固定旧行为再迁移分支语法

迁移到 Java 21 时，应先用测试固定每个输入的旧行为，再改写语法，避免在消除贯穿的同时意外改变原本依赖贯穿的分支。

:::

## 十一、规范依据

- [JLS 14.9：The if Statement](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.9) 定义条件类型和分支执行。
- [JLS 14.11：The switch Statement](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.11) 定义标签、匹配、穷尽性和执行规则。
- [JLS 15.28：switch Expressions](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.28) 定义 `switch` 表达式求值。
- [Java SE 21 `Objects.requireNonNull`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Objects.html#requireNonNull(T,java.lang.String)) 定义非空参数检查行为。
